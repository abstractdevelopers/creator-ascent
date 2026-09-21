#!/usr/bin/env python3
"""Import subscribers from a SendByte send log into the applications table.

This log records every email ever sent, so it is not a clean subscriber list.
Three things have to be derived rather than read:

  * Subscribers are the distinct `to` values. A few `to` values are not
    subscribers at all -- the academy's own inbox, an API vendor's test address,
    and a support password reset -- and are excluded by name, not by guessing.

  * Names are not a column. The only place a name appears is the subject of the
    "New UCA Application" notification mails, and those were sent to the
    academy's own inbox, so the name is not attached to the applicant's email.
    Names are therefore recovered by matching the notification name against the
    email's local part, and only when that match is unambiguous. The rest keep a
    blank name, which the mailer renders as "Hi there," -- better a neutral
    greeting than a fabricated name.

  * Hard bounces are recorded, because mailing a known-dead address again is
    pure reputation damage. They are imported but reported, not silently placed
    in the send queue. Pass --suppress-bounced to mark them so broadcasts skip them.

Nothing is written without --commit.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter

# Addresses in the log that are not subscribers, each for a reason.
NON_SUBSCRIBERS = {
    "unifycreatoracademy@gmail.com": "the academy's own inbox (application notifications)",
    "delivered@resend.dev": "API vendor test address",
    "mrtechcloudude@gmail.com": "support password-reset, not an applicant",
}

NOTIFICATION_PREFIX = "New UCA Application"
BATCH_SIZE = 500


def clean_email(raw: str) -> str:
    return (raw or "").strip().lower()


def recover_names(rows: list[dict]) -> dict[str, str]:
    """Map applicant email -> name, using only unambiguous local-part matches."""
    names = []
    for r in rows:
        subject = (r.get("subject") or "").strip()
        if subject.startswith(NOTIFICATION_PREFIX):
            name = re.sub(rf"^{NOTIFICATION_PREFIX}\s*[—-]\s*", "", subject).strip()
            if name:
                names.append(name)

    by_local: dict[str, list[str]] = {}
    for email in {clean_email(r.get("to", "")) for r in rows}:
        if email and "@" in email:
            base = re.sub(r"[^a-z]", "", email.split("@")[0])
            digits_stripped = re.sub(r"\d+$", "", base)
            for key in {base, digits_stripped}:
                if key:
                    by_local.setdefault(key, []).append(email)

    recovered: dict[str, str] = {}
    for name in set(names):
        key = re.sub(r"[^a-z]", "", name.lower())
        candidates = {
            email
            for k in {key, re.sub(r"[^a-z]", "", "".join(name.split()).lower())}
            for email in by_local.get(k, [])
        }
        # Only accept when the name points at exactly one address.
        if len(candidates) == 1:
            email = next(iter(candidates))
            recovered.setdefault(email, name)
    return recovered


def derive_greeting(email: str) -> str:
    """Best-effort display name from an address, or '' when it would be noise.

    Off by default: run-together local parts produce greetings like
    "Hi Aanubabatundeoduntan," which reads worse than a neutral "Hi there,"
    and can read as spam. Opt in with --derive-greetings.
    """
    local = email.split("@")[0]
    letters = re.sub(r"[^a-z]", "", local.lower())
    if len(letters) < 5:
        return ""
    return letters.capitalize()


def build_records(rows: list[dict], derive_names: bool = False) -> tuple[list[dict], dict]:
    recovered = recover_names(rows)

    all_to = {clean_email(r.get("to", "")) for r in rows if clean_email(r.get("to", ""))}
    subscribers = sorted(all_to - set(NON_SUBSCRIBERS))

    bounced = {
        clean_email(r.get("to", ""))
        for r in rows
        if (r.get("status") or "").strip().lower() == "bounced"
    }
    bounced &= set(subscribers)

    records = []
    name_sources = Counter()
    for email in subscribers:
        name = recovered.get(email)
        if name:
            name_sources["recovered_from_notification"] += 1
        elif derive_names:
            derived = derive_greeting(email)
            name = derived
            name_sources["derived_from_local_part" if derived else "blank"] += 1
        else:
            # Left empty on purpose: the mailer renders an empty name as
            # "Hi there," rather than inventing one.
            name = ""
            name_sources["blank"] += 1

        records.append(
            {
                "email": email,
                "full_name": name,
                "social_handle": None,
                "source": "sendbyte_log_import",
            }
        )

    stats = {
        "log_rows": len(rows),
        "distinct_to_addresses": len(all_to),
        "excluded_non_subscribers": {
            addr: NON_SUBSCRIBERS[addr] for addr in sorted(all_to & set(NON_SUBSCRIBERS))
        },
        "subscribers": len(subscribers),
        "hard_bounced": sorted(bounced),
        "negative_name_sources": dict(name_sources),
    }
    return records, stats


def fetch_existing(base_url: str, key: str) -> set[str]:
    found: set[str] = set()
    page, offset = 1000, 0
    while True:
        req = urllib.request.Request(
            f"{base_url}/rest/v1/applications?select=email&limit={page}&offset={offset}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            batch = json.load(resp)
        for item in batch:
            found.add(clean_email(item.get("email", "")))
        if len(batch) < page:
            return found
        offset += page


def insert(base_url: str, key: str, batch: list[dict]) -> int:
    req = urllib.request.Request(
        f"{base_url}/rest/v1/applications?on_conflict=email_normalized",
        data=json.dumps(batch).encode(),
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=representation",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return len(json.load(resp))


def suppress(base_url: str, key: str, addresses: list[str]) -> None:
    if not addresses:
        return
    req = urllib.request.Request(
        f"{base_url}/rest/v1/applications?email_normalized=in.({','.join(addresses)})",
        data=json.dumps({"unsubscribed": True}).encode(),
        method="PATCH",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        resp.read()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("csv_path")
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--url", default=os.environ.get("SUPABASE_URL", ""))
    ap.add_argument("--service-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    ap.add_argument(
        "--derive-greetings",
        action="store_true",
        help="fall back to a name guessed from the email local part (often ugly)",
    )
    ap.add_argument(
        "--suppress-bounced",
        action="store_true",
        help="mark hard-bounced addresses so broadcasts skip them",
    )
    ap.add_argument("--report", help="write the JSON summary here")
    args = ap.parse_args()

    with open(args.csv_path, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))

    records, stats = build_records(rows, derive_names=args.derive_greetings)

    if not args.url or not args.service_key:
        print(json.dumps(stats, indent=2))
        print("\nno Supabase credentials given; reporting only.", file=sys.stderr)
        return 0

    existing = fetch_existing(args.url, args.service_key)
    fresh = [r for r in records if r["email"] not in existing]
    already = len(records) - len(fresh)

    summary = {
        **stats,
        "already_in_database": already,
        "new_to_insert": len(fresh),
        "committed": False,
        "inserted": 0,
        "bounced_suppressed": False,
    }

    print(json.dumps(summary, indent=2))

    if not args.commit:
        print("\ndry run -- nothing written. Re-run with --commit to apply.")
        if args.report:
            with open(args.report, "w", encoding="utf-8") as fh:
                json.dump(summary, fh, indent=2)
        return 0

    inserted = 0
    for i in range(0, len(fresh), BATCH_SIZE):
        inserted += insert(args.url, args.service_key, fresh[i : i + BATCH_SIZE])

    if args.suppress_bounced and stats["hard_bounced"]:
        suppress(args.url, args.service_key, stats["hard_bounced"])
        summary["bounced_suppressed"] = True

    summary["committed"] = True
    summary["inserted"] = inserted
    print(json.dumps({k: summary[k] for k in ("committed", "inserted", "bounced_suppressed")}, indent=2))

    if args.report:
        with open(args.report, "w", encoding="utf-8") as fh:
            json.dump(summary, fh, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
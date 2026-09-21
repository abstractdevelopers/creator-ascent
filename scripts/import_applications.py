#!/usr/bin/env python3
"""Import a CSV of applicants into the applications table, one row per email.

Nothing in the original schema stopped the same address from existing on several
rows, so a list import would silently re-add people who had already applied.
This script normalises addresses, keeps only the first occurrence of each, and
reports what it skipped instead of guessing.

Safety rules:
  * case- and whitespace-insensitive matching, so Ada@X.com == ada@x.com
  * an existing email is never overwritten -- rows already on file stay intact
  * --dry-run is the default; nothing is written without --commit

Usage:
  python3 scripts/import_applications.py list.csv                     # preview
  python3 scripts/import_applications.py list.csv --commit            # write
  python3 scripts/import_applications.py list.csv --commit --service-key "$KEY"
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

# Column aliases, lowercased with non-alphanumerics stripped.
ALIASES = {
    "email": "email",
    "emailaddress": "email",
    "mail": "email",
    "name": "full_name",
    "fullname": "full_name",
    "firstname": "first_name",
    "lastname": "last_name",
    "instagram": "social_handle",
    "handle": "social_handle",
    "socialhandle": "social_handle",
    "social": "social_handle",
    "username": "social_handle",
}

# Deliberately permissive: real lists contain addresses strict validation
# rejects, and dropping a reachable subscriber is worse than keeping an odd one.
# The pattern only rejects obvious non-addresses.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

BATCH_SIZE = 500


def norm_key(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (name or "").strip().lower())


def pick(row: dict, field: str) -> str:
    for key, value in row.items():
        if ALIASES.get(norm_key(key)) == field and value is not None:
            return str(value).strip()
    return ""


def read_csv(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8-sig") as fh:
        sample = fh.read(8192)
        fh.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel
        return list(csv.DictReader(fh, dialect=dialect))


def plan(rows: list[dict], source: str) -> tuple[dict, Counter, list[str]]:
    """Collapse CSV rows into one record per email and account for the rest."""
    records: dict[str, dict] = {}
    invalid: list[str] = []
    stats = Counter(
        total_rows=len(rows), missing_email=0, invalid_email=0, duplicate_in_file=0
    )

    for row in rows:
        raw = pick(row, "email")
        if not raw:
            stats["missing_email"] += 1
            continue

        email = raw.strip().lower()
        if not EMAIL_RE.match(email):
            stats["invalid_email"] += 1
            if len(invalid) < 20:
                invalid.append(raw)
            continue

        if email in records:
            # Keep the first row, but adopt any detail a later row filled in.
            existing = records[email]
            for field in ("full_name", "social_handle"):
                if not existing.get(field):
                    existing[field] = pick(row, field) or None
            stats["duplicate_in_file"] += 1
            continue

        first = pick(row, "first_name")
        last = pick(row, "last_name")
        full_name = pick(row, "full_name") or " ".join(x for x in (first, last) if x)

        records[email] = {
            "email": email,
            "full_name": full_name or email.split("@")[0],
            "social_handle": pick(row, "social_handle") or None,
            "source": source,
        }

    return records, stats, invalid


def fetch_existing(base_url: str, key: str) -> set[str]:
    """Every email already on file, for case-insensitive set membership."""
    found: set[str] = set()
    page = 1000
    offset = 0
    while True:
        req = urllib.request.Request(
            f"{base_url}/rest/v1/applications?select=email&limit={page}&offset={offset}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            batch = json.load(resp)
        for item in batch:
            found.add((item.get("email") or "").strip().lower())
        if len(batch) < page:
            return found
        offset += page


def insert(base_url: str, key: str, batch: list[dict]) -> int:
    req = urllib.request.Request(
        # on_conflict targets the unique generated column, so the database itself
        # is the final guard against a repeat even if the pre-filter missed one.
        f"{base_url}/rest/v1/applications?on_conflict=email_normalized",
        data=json.dumps(batch).encode(),
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            # Never clobber a row if an address slips through twice.
            "Prefer": "resolution=ignore-duplicates,return=representation",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return len(json.load(resp))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("csv_path")
    ap.add_argument("--commit", action="store_true", help="actually write to the database")
    ap.add_argument("--url", default=os.environ.get("SUPABASE_URL", ""))
    ap.add_argument("--service-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    ap.add_argument("--source", default="csv_import", help="value for the source column")
    ap.add_argument("--report", help="write a JSON summary to this path")
    args = ap.parse_args()

    records, stats, invalid = plan(read_csv(args.csv_path), args.source)

    existing: set[str] = set()
    if args.url and args.service_key:
        try:
            existing = fetch_existing(args.url, args.service_key)
        except (urllib.error.URLError, urllib.error.HTTPError) as exc:
            print(f"could not read existing rows: {exc}", file=sys.stderr)
            if args.commit:
                return 1
    elif args.commit:
        print(
            "--commit needs --url and --service-key "
            "(or SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
            file=sys.stderr,
        )
        return 1

    fresh = {e: r for e, r in records.items() if e not in existing}

    summary = {
        "csv_rows": stats["total_rows"],
        "skipped_missing_email": stats["missing_email"],
        "skipped_invalid_email": stats["invalid_email"],
        "duplicates_in_csv": stats["duplicate_in_file"],
        "unique_in_csv": len(records),
        "existing_rows_in_database": len(existing),
        "already_in_database": len(records) - len(fresh),
        "new_to_insert": len(fresh),
        "committed": False,
        "inserted": 0,
    }

    print(json.dumps(summary, indent=2))
    if invalid:
        print(f"sample of rejected addresses: {invalid}", file=sys.stderr)

    if not args.commit:
        print("\ndry run -- nothing written. Re-run with --commit to apply.")
    else:
        inserted = 0
        batch: list[dict] = []
        for record in fresh.values():
            batch.append(record)
            if len(batch) >= BATCH_SIZE:
                inserted += insert(args.url, args.service_key, batch)
                batch = []
        if batch:
            inserted += insert(args.url, args.service_key, batch)

        summary["committed"] = True
        summary["inserted"] = inserted
        print(json.dumps(summary, indent=2))

    if args.report:
        with open(args.report, "w", encoding="utf-8") as fh:
            json.dump(summary, fh, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
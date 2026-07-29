
CREATE TABLE public.email_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  header_image_url TEXT,
  footer_image_url TEXT,
  recipient_ids UUID[] NOT NULL DEFAULT '{}',
  total INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT ALL ON public.email_broadcasts TO service_role;
ALTER TABLE public.email_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.email_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broadcast_id UUID NOT NULL REFERENCES public.email_broadcasts(id) ON DELETE CASCADE,
  application_id UUID,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_send_log TO service_role;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_send_log_broadcast ON public.email_send_log(broadcast_id);
CREATE INDEX idx_email_send_log_broadcast_email_status ON public.email_send_log(broadcast_id, email, status);
CREATE INDEX idx_email_broadcasts_created_at ON public.email_broadcasts(created_at DESC);

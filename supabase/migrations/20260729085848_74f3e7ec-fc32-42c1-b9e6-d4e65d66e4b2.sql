
CREATE POLICY "no direct access" ON public.email_broadcasts FOR SELECT USING (false);
CREATE POLICY "no direct access" ON public.email_send_log FOR SELECT USING (false);

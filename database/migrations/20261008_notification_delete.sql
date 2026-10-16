-- Let people delete their own notifications (the x on each card in the
-- notifications popup). Until now they could only read them and mark them read.

GRANT DELETE ON public.notification TO authenticated;

DROP POLICY IF EXISTS notification_delete_own ON public.notification;
CREATE POLICY notification_delete_own
ON public.notification FOR DELETE TO authenticated
USING (user_id = auth.uid());

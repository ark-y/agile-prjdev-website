ALTER TABLE public.notification
    ADD COLUMN IF NOT EXISTS notif_type text NOT NULL DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS notif_volunteer_id uuid,
    ADD COLUMN IF NOT EXISTS notif_action_status text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'notification_volunteer_user_id_fkey'
          AND conrelid = 'public.notification'::regclass
    ) THEN
        ALTER TABLE public.notification
            ADD CONSTRAINT notification_volunteer_user_id_fkey
            FOREIGN KEY (notif_volunteer_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;
    END IF;
END;
$$;

ALTER TABLE public.notification
    DROP CONSTRAINT IF EXISTS notification_action_status_check;
ALTER TABLE public.notification
    ADD CONSTRAINT notification_action_status_check
    CHECK (notif_action_status IS NULL OR notif_action_status IN ('pending', 'accepted', 'declined'));

CREATE UNIQUE INDEX IF NOT EXISTS notification_pending_task_volunteer_key
    ON public.notification (user_id, task_id, notif_volunteer_id)
    WHERE notif_type = 'task_volunteer' AND notif_action_status = 'pending';

CREATE OR REPLACE FUNCTION public.volunteer_for_backlog_task(p_task_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_task public.task%ROWTYPE;
    developer_first_name text;
    developer_last_name text;
    target_project_name text;
    notification_message text;
BEGIN
    IF public.current_app_role() IS DISTINCT FROM 'Developer' THEN
        RAISE EXCEPTION 'Only a developer can volunteer for a task.';
    END IF;

    SELECT *
    INTO target_task
    FROM public.task
    WHERE task_id = p_task_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found.';
    END IF;

    IF NOT public.is_project_member(target_task.project_id) THEN
        RAISE EXCEPTION 'Join this project before volunteering for its tasks.';
    END IF;

    IF target_task.sprint_id IS NOT NULL THEN
        RAISE EXCEPTION 'You can only volunteer for a task in the backlog.';
    END IF;

    LOCK TABLE public.task_member IN SHARE ROW EXCLUSIVE MODE;

    IF EXISTS (SELECT 1 FROM public.task_member WHERE task_id = p_task_id) THEN
        RAISE EXCEPTION 'This task already has an assignee.';
    END IF;

    SELECT user_first_name, user_last_name
    INTO developer_first_name, developer_last_name
    FROM public."user"
    WHERE user_id = auth.uid();

    SELECT project_name
    INTO target_project_name
    FROM public.project
    WHERE project_id = target_task.project_id;

    IF NOT EXISTS (
        SELECT 1
        FROM public.project_member AS pm
        JOIN public."user" AS u ON u.user_id = pm.user_id
        JOIN public.role AS r ON r.role_id = u.role_id
        WHERE pm.project_id = target_task.project_id
          AND r.role_name::text = 'Admin'
    ) THEN
        RAISE EXCEPTION 'This project has no admin to receive volunteer requests.';
    END IF;

    notification_message := format(
        '%s %s. has volunteered for %s in %s.',
        developer_first_name,
        left(developer_last_name, 1),
        target_task.task_name,
        target_project_name
    );

    INSERT INTO public.notification (
        user_id,
        notif_message,
        task_id,
        notif_type,
        notif_volunteer_id,
        notif_action_status
    )
    SELECT
        pm.user_id,
        notification_message,
        p_task_id,
        'task_volunteer',
        auth.uid(),
        'pending'
    FROM public.project_member AS pm
    JOIN public."user" AS u ON u.user_id = pm.user_id
    JOIN public.role AS r ON r.role_id = u.role_id
    WHERE pm.project_id = target_task.project_id
      AND r.role_name::text = 'Admin'
    ON CONFLICT (user_id, task_id, notif_volunteer_id)
        WHERE notif_type = 'task_volunteer' AND notif_action_status = 'pending'
        DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_task_volunteer(
    p_notification_id integer,
    p_accept boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    volunteer_notification public.notification%ROWTYPE;
    target_task public.task%ROWTYPE;
BEGIN
    IF p_accept IS NULL THEN
        RAISE EXCEPTION 'Choose whether to accept or decline this volunteer request.';
    END IF;

    SELECT *
    INTO volunteer_notification
    FROM public.notification
    WHERE notif_id = p_notification_id;

    IF NOT FOUND
       OR volunteer_notification.user_id <> auth.uid()
       OR volunteer_notification.notif_type <> 'task_volunteer' THEN
        RAISE EXCEPTION 'Volunteer request not found or access denied.';
    END IF;

    IF volunteer_notification.notif_action_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'This volunteer request has already been handled.';
    END IF;

    SELECT *
    INTO target_task
    FROM public.task
    WHERE task_id = volunteer_notification.task_id
    FOR UPDATE;

    IF NOT FOUND OR NOT public.is_project_admin(target_task.project_id) THEN
        RAISE EXCEPTION 'Only an admin in this project can respond to its volunteer requests.';
    END IF;

    SELECT *
    INTO volunteer_notification
    FROM public.notification
    WHERE notif_id = p_notification_id
    FOR UPDATE;

    IF NOT FOUND
       OR volunteer_notification.user_id <> auth.uid()
       OR volunteer_notification.notif_type <> 'task_volunteer'
       OR volunteer_notification.notif_action_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION 'This volunteer request has already been handled or is no longer available.';
    END IF;

    IF p_accept THEN
        LOCK TABLE public.task_member IN SHARE ROW EXCLUSIVE MODE;

        IF target_task.sprint_id IS NOT NULL THEN
            RAISE EXCEPTION 'This task is no longer in the backlog.';
        END IF;

        IF EXISTS (
            SELECT 1 FROM public.task_member
            WHERE task_id = volunteer_notification.task_id
        ) THEN
            RAISE EXCEPTION 'This task already has an assignee.';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.project_member AS pm
            JOIN public."user" AS u ON u.user_id = pm.user_id
            JOIN public.role AS r ON r.role_id = u.role_id
            WHERE pm.project_id = target_task.project_id
              AND pm.user_id = volunteer_notification.notif_volunteer_id
              AND r.role_name::text = 'Developer'
        ) THEN
            RAISE EXCEPTION 'The volunteer is no longer a developer in this project.';
        END IF;

        INSERT INTO public.task_member (task_id, user_id)
        VALUES (volunteer_notification.task_id, volunteer_notification.notif_volunteer_id);
    END IF;

    UPDATE public.notification
    SET notif_action_status = CASE
            WHEN p_accept AND notif_volunteer_id = volunteer_notification.notif_volunteer_id THEN 'accepted'
            ELSE 'declined'
        END,
        notif_is_read = true,
        notif_read_at = now()
    WHERE task_id = volunteer_notification.task_id
      AND notif_type = 'task_volunteer'
      AND notif_action_status = 'pending'
      AND (p_accept OR notif_volunteer_id = volunteer_notification.notif_volunteer_id);
END;
$$;

REVOKE ALL ON FUNCTION public.volunteer_for_backlog_task(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_task_volunteer(integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.volunteer_for_backlog_task(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_task_volunteer(integer, boolean) TO authenticated;

-- Complete profile provisioning, backlog, tag, comment, and notification support.

INSERT INTO public.role (role_name, role_description)
SELECT 'Developer', 'Works on assigned project tasks.'
WHERE NOT EXISTS (
    SELECT 1 FROM public.role WHERE role_name::text = 'Developer'
);

INSERT INTO public.role (role_name, role_description)
SELECT 'Admin', 'Manages projects and project members.'
WHERE NOT EXISTS (
    SELECT 1 FROM public.role WHERE role_name::text = 'Admin'
);

INSERT INTO public.role (role_name, role_description)
SELECT 'Client', 'Views shared project progress.'
WHERE NOT EXISTS (
    SELECT 1 FROM public.role WHERE role_name::text = 'Client'
);

INSERT INTO public.status (status_name, status_color, status_is_default)
SELECT
    enum_value.enumlabel::public.default_status_enum,
    CASE
                WHEN lower(enum_value.enumlabel::text) LIKE '%done%'
                    OR lower(enum_value.enumlabel::text) LIKE '%complete%' THEN '#3F9B76'
                WHEN lower(enum_value.enumlabel::text) LIKE '%progress%' THEN '#3976B8'
        ELSE '#8793A1'
    END,
    true
FROM pg_type AS enum_type
JOIN pg_namespace AS enum_schema ON enum_schema.oid = enum_type.typnamespace
JOIN pg_enum AS enum_value ON enum_value.enumtypid = enum_type.oid
WHERE enum_schema.nspname = 'public'
    AND enum_type.typname = 'default_status_enum'
  AND NOT EXISTS (
            SELECT 1
            FROM public.status AS existing
            WHERE existing.status_name::text = enum_value.enumlabel::text
  );

INSERT INTO public.project_status (project_id, status_id)
SELECT p.project_id, s.status_id
FROM public.project AS p
CROSS JOIN public.status AS s
ON CONFLICT (project_id, status_id) DO NOTHING;

ALTER TABLE public."user"
ALTER COLUMN user_phone DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    developer_role_id integer;
    email_name text;
BEGIN
    SELECT role_id INTO developer_role_id
    FROM public.role
    WHERE role_name::text = 'Developer'
    ORDER BY role_id
    LIMIT 1;

    IF developer_role_id IS NULL THEN
        RAISE EXCEPTION 'The Developer role must exist before creating an Auth user.';
    END IF;

    email_name := coalesce(nullif(split_part(coalesce(NEW.email, ''), '@', 1), ''), 'New user');

    INSERT INTO public."user" (
        user_id,
        user_first_name,
        user_last_name,
        user_email,
        user_phone,
        role_id
    ) VALUES (
        NEW.id,
        coalesce(nullif(NEW.raw_user_meta_data ->> 'first_name', ''), email_name),
        coalesce(nullif(NEW.raw_user_meta_data ->> 'last_name', ''), 'User'),
        coalesce(NEW.email, NEW.id::text || '@no-email.invalid'),
        nullif(NEW.phone, ''),
        developer_role_id
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.shares_project_with(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
        SELECT EXISTS (
                SELECT 1
                FROM public.project_member AS viewer
                JOIN public.project_member AS target
                    ON target.project_id = viewer.project_id
                WHERE viewer.user_id = auth.uid()
                    AND target.user_id = target_user_id
        )
$$;

REVOKE ALL ON FUNCTION public.shares_project_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_project_with(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_profile_for_auth_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS create_public_profile_after_auth_signup ON auth.users;
CREATE TRIGGER create_public_profile_after_auth_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_auth_user();

INSERT INTO public."user" (
    user_id,
    user_first_name,
    user_last_name,
    user_email,
    user_phone,
    role_id
)
SELECT
    au.id,
    coalesce(nullif(au.raw_user_meta_data ->> 'first_name', ''), split_part(coalesce(au.email, ''), '@', 1), 'New user'),
    coalesce(nullif(au.raw_user_meta_data ->> 'last_name', ''), 'User'),
    coalesce(au.email, au.id::text || '@no-email.invalid'),
    nullif(au.phone, ''),
    r.role_id
FROM auth.users AS au
CROSS JOIN LATERAL (
    SELECT role_id FROM public.role
    WHERE role_name::text = 'Developer'
    ORDER BY role_id
    LIMIT 1
) AS r
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.task
ALTER COLUMN sprint_id DROP NOT NULL;

DROP POLICY IF EXISTS task_insert_admin ON public.task;
CREATE POLICY task_insert_admin
ON public.task FOR INSERT TO authenticated
WITH CHECK (
    public.is_project_admin(project_id)
    AND task_created_by = auth.uid()
    AND (
        sprint_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.sprint AS s
            WHERE s.sprint_id = task.sprint_id
              AND s.project_id = task.project_id
        )
    )
    AND (
        task_status_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.project_status AS ps
            WHERE ps.project_id = task.project_id
              AND ps.status_id = task.task_status_id
        )
    )
);

ALTER TABLE public.comment
ALTER COLUMN task_id DROP IDENTITY IF EXISTS;

DO $$
DECLARE
    primary_key_name text;
BEGIN
    SELECT conname INTO primary_key_name
    FROM pg_constraint
    WHERE conrelid = 'public.comment'::regclass
      AND contype = 'p';

    IF primary_key_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.comment DROP CONSTRAINT %I', primary_key_name);
    END IF;
END;
$$;

ALTER TABLE public.comment
ADD COLUMN IF NOT EXISTS comment_id integer GENERATED ALWAYS AS IDENTITY;
ALTER TABLE public.comment
ADD CONSTRAINT comment_pkey PRIMARY KEY (comment_id);

CREATE UNIQUE INDEX IF NOT EXISTS backlog_project_task_key
ON public.backlog (project_id, task_id);

CREATE OR REPLACE FUNCTION public.guard_task_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.sprint_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.sprint AS s
        WHERE s.sprint_id = NEW.sprint_id
          AND s.project_id = NEW.project_id
    ) THEN
        RAISE EXCEPTION 'The task sprint must belong to the same project.';
    END IF;

    IF NEW.task_status_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.project_status AS ps
        WHERE ps.project_id = NEW.project_id
          AND ps.status_id = NEW.task_status_id
    ) THEN
        RAISE EXCEPTION 'The selected status is not available in this project.';
    END IF;

    IF public.is_project_admin(OLD.project_id)
       AND public.is_project_admin(NEW.project_id) THEN
        RETURN NEW;
    END IF;

    IF public.current_app_role() = 'Developer'
       AND public.is_project_member(OLD.project_id)
       AND public.is_task_assignee(OLD.task_id)
       AND NEW.task_id = OLD.task_id
       AND (to_jsonb(NEW) - 'task_status_id') = (to_jsonb(OLD) - 'task_status_id') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'You are not permitted to update this task.';
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_task_backlog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.backlog WHERE task_id = NEW.task_id;

    IF NEW.sprint_id IS NULL THEN
        INSERT INTO public.backlog (task_id, project_id)
        VALUES (NEW.task_id, NEW.project_id)
        ON CONFLICT (project_id, task_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_insert_sync_backlog ON public.task;
CREATE TRIGGER task_insert_sync_backlog
AFTER INSERT ON public.task
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_backlog();

DROP TRIGGER IF EXISTS task_update_sync_backlog ON public.task;
CREATE TRIGGER task_update_sync_backlog
AFTER UPDATE OF sprint_id, project_id ON public.task
FOR EACH ROW
EXECUTE FUNCTION public.sync_task_backlog();

INSERT INTO public.backlog (task_id, project_id)
SELECT t.task_id, t.project_id
FROM public.task AS t
WHERE t.sprint_id IS NULL
ON CONFLICT (project_id, task_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.delete_sprint_to_backlog(p_sprint_id integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_project_id uuid;
BEGIN
    SELECT project_id INTO target_project_id
    FROM public.sprint
    WHERE sprint_id = p_sprint_id;

    IF target_project_id IS NULL OR NOT public.is_project_admin(target_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can delete this sprint.';
    END IF;

    UPDATE public.task
    SET sprint_id = NULL
    WHERE sprint_id = p_sprint_id;

    DELETE FROM public.sprint WHERE sprint_id = p_sprint_id;
    RETURN p_sprint_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_task_tags(p_task_id integer, p_tag_ids integer[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_project_id uuid;
BEGIN
    SELECT project_id INTO target_project_id
    FROM public.task
    WHERE task_id = p_task_id;

    IF target_project_id IS NULL OR NOT public.is_project_admin(target_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can edit task tags.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM unnest(coalesce(p_tag_ids, '{}'::integer[])) AS requested(tag_id)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.tag AS t
            WHERE t.tag_id = requested.tag_id
              AND t.project_id = target_project_id
        )
    ) THEN
        RAISE EXCEPTION 'Every selected tag must belong to this project.';
    END IF;

    DELETE FROM public.task_tag WHERE task_id = p_task_id;
    INSERT INTO public.task_tag (task_id, tag_id)
    SELECT p_task_id, requested.tag_id
    FROM (
        SELECT DISTINCT tag_id
        FROM unnest(coalesce(p_tag_ids, '{}'::integer[])) AS ids(tag_id)
    ) AS requested;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_project_tag(p_project_id uuid, p_tag_id integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_project_admin(p_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can delete project tags.';
    END IF;

    DELETE FROM public.task_tag AS tt
    USING public.task AS t
    WHERE tt.task_id = t.task_id
      AND t.project_id = p_project_id
      AND tt.tag_id = p_tag_id;

    DELETE FROM public.tag
    WHERE project_id = p_project_id
      AND tag_id = p_tag_id;

    RETURN p_tag_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    task_label text;
BEGIN
    SELECT task_name INTO task_label FROM public.task WHERE task_id = NEW.task_id;

    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
        INSERT INTO public.notification (user_id, notif_message, task_id)
        VALUES (NEW.user_id, 'You were assigned to task: ' || coalesce(task_label, 'Task'), NEW.task_id);
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_task_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.task_status_id IS DISTINCT FROM NEW.task_status_id THEN
        INSERT INTO public.notification (user_id, notif_message, task_id)
        SELECT DISTINCT recipients.user_id,
            'Task status changed: ' || NEW.task_name,
            NEW.task_id
        FROM (
            SELECT tm.user_id
            FROM public.task_member AS tm
            WHERE tm.task_id = NEW.task_id
            UNION
            SELECT pm.user_id
            FROM public.project_member AS pm
            JOIN public."user" AS u ON u.user_id = pm.user_id
            JOIN public.role AS r ON r.role_id = u.role_id
            WHERE pm.project_id = NEW.project_id
              AND r.role_name::text = 'Admin'
        ) AS recipients
        WHERE recipients.user_id IS DISTINCT FROM auth.uid();
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_task_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    task_label text;
    target_project_id uuid;
BEGIN
    SELECT task_name, project_id INTO task_label, target_project_id
    FROM public.task WHERE task_id = NEW.task_id;

    INSERT INTO public.notification (user_id, notif_message, task_id)
    SELECT DISTINCT recipients.user_id,
        'New comment on task: ' || coalesce(task_label, 'Task'),
        NEW.task_id
    FROM (
        SELECT tm.user_id
        FROM public.task_member AS tm
        WHERE tm.task_id = NEW.task_id
        UNION
        SELECT pm.user_id
        FROM public.project_member AS pm
        JOIN public."user" AS u ON u.user_id = pm.user_id
        JOIN public.role AS r ON r.role_id = u.role_id
        WHERE pm.project_id = target_project_id
          AND r.role_name::text = 'Admin'
    ) AS recipients
    WHERE recipients.user_id IS DISTINCT FROM NEW.user_id;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_project_member_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    project_label text;
BEGIN
    IF NEW.user_id IS NOT DISTINCT FROM auth.uid() THEN
        RETURN NEW;
    END IF;

    SELECT project_name INTO project_label
    FROM public.project
    WHERE project_id = NEW.project_id;

    INSERT INTO public.notification (user_id, notif_message)
    VALUES (NEW.user_id, 'You were added to project: ' || coalesce(project_label, 'Project'));

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_sprint_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_project_id uuid;
    sprint_label text;
    change_message text;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_project_id := OLD.project_id;
        sprint_label := OLD.sprint_name;
        change_message := 'Sprint deleted: ' || sprint_label;
    ELSIF TG_OP = 'INSERT' THEN
        target_project_id := NEW.project_id;
        sprint_label := NEW.sprint_name;
        change_message := 'Sprint created: ' || sprint_label;
    ELSE
        target_project_id := NEW.project_id;
        sprint_label := NEW.sprint_name;
        change_message := 'Sprint updated: ' || sprint_label;
    END IF;

    INSERT INTO public.notification (user_id, notif_message)
    SELECT pm.user_id, change_message
    FROM public.project_member AS pm
    WHERE pm.project_id = target_project_id
      AND pm.user_id IS DISTINCT FROM auth.uid();

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_member_notify_assignee ON public.task_member;
CREATE TRIGGER task_member_notify_assignee
AFTER INSERT ON public.task_member
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_assignment();

DROP TRIGGER IF EXISTS task_notify_status_change ON public.task;
CREATE TRIGGER task_notify_status_change
AFTER UPDATE OF task_status_id ON public.task
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_status_change();

DROP TRIGGER IF EXISTS comment_notify_task_members ON public.comment;
CREATE TRIGGER comment_notify_task_members
AFTER INSERT ON public.comment
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_comment();

DROP TRIGGER IF EXISTS project_member_notify_added_user ON public.project_member;
CREATE TRIGGER project_member_notify_added_user
AFTER INSERT ON public.project_member
FOR EACH ROW
EXECUTE FUNCTION public.notify_project_member_change();

DROP TRIGGER IF EXISTS sprint_notify_insert ON public.sprint;
CREATE TRIGGER sprint_notify_insert
AFTER INSERT ON public.sprint
FOR EACH ROW
EXECUTE FUNCTION public.notify_sprint_change();

DROP TRIGGER IF EXISTS sprint_notify_update ON public.sprint;
CREATE TRIGGER sprint_notify_update
AFTER UPDATE OF sprint_name, sprint_start_date, sprint_end_date, sprint_ongoing ON public.sprint
FOR EACH ROW
EXECUTE FUNCTION public.notify_sprint_change();

DROP TRIGGER IF EXISTS sprint_notify_delete ON public.sprint;
CREATE TRIGGER sprint_notify_delete
AFTER DELETE ON public.sprint
FOR EACH ROW
EXECUTE FUNCTION public.notify_sprint_change();

REVOKE ALL ON FUNCTION public.delete_sprint_to_backlog(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_task_tags(integer, integer[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_project_tag(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_sprint_to_backlog(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_task_tags(integer, integer[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_project_tag(uuid, integer) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tag TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.tag_tag_id_seq TO authenticated;
GRANT SELECT ON public.task_tag, public.backlog TO authenticated;
GRANT SELECT, INSERT ON public.comment TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.comment_comment_id_seq TO authenticated;
GRANT SELECT ON public.notification TO authenticated;
GRANT UPDATE (notif_is_read, notif_read_at) ON public.notification TO authenticated;

ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tag_read_project_member ON public.tag;
CREATE POLICY tag_read_project_member
ON public.tag FOR SELECT TO authenticated
USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS tag_insert_project_admin ON public.tag;
CREATE POLICY tag_insert_project_admin
ON public.tag FOR INSERT TO authenticated
WITH CHECK (public.is_project_admin(project_id));

DROP POLICY IF EXISTS tag_update_project_admin ON public.tag;
CREATE POLICY tag_update_project_admin
ON public.tag FOR UPDATE TO authenticated
USING (public.is_project_admin(project_id))
WITH CHECK (public.is_project_admin(project_id));

DROP POLICY IF EXISTS tag_delete_project_admin ON public.tag;
CREATE POLICY tag_delete_project_admin
ON public.tag FOR DELETE TO authenticated
USING (public.is_project_admin(project_id));

DROP POLICY IF EXISTS task_tag_read_task_member ON public.task_tag;
CREATE POLICY task_tag_read_task_member
ON public.task_tag FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = task_tag.task_id
          AND public.can_view_task(t.task_id, t.project_id)
    )
);

DROP POLICY IF EXISTS backlog_read_project_member ON public.backlog;
CREATE POLICY backlog_read_project_member
ON public.backlog FOR SELECT TO authenticated
USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS comment_read_task_member ON public.comment;
CREATE POLICY comment_read_task_member
ON public.comment FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = comment.task_id
          AND public.can_view_task(t.task_id, t.project_id)
    )
);

DROP POLICY IF EXISTS comment_insert_task_member ON public.comment;
CREATE POLICY comment_insert_task_member
ON public.comment FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = comment.task_id
          AND public.can_view_task(t.task_id, t.project_id)
    )
);

DROP POLICY IF EXISTS notification_read_own ON public.notification;
CREATE POLICY notification_read_own
ON public.notification FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_update_own ON public.notification;
CREATE POLICY notification_update_own
ON public.notification FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_read_self_or_project_admin ON public."user";
CREATE POLICY user_read_self_or_project_admin
ON public."user" FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR public.shares_project_with(user_id)
    OR EXISTS (
        SELECT 1 FROM public.project_member AS pm
        WHERE pm.user_id = "user".user_id
          AND public.is_project_admin(pm.project_id)
    )
);

COMMENT ON FUNCTION public.create_profile_for_auth_user() IS
'Creates a least-privileged Developer profile for each Supabase Auth user. Promote trusted accounts to Admin separately.';

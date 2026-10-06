CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT r.role_name::text
    FROM public."user" AS u
    JOIN public.role AS r ON r.role_id = u.role_id
    WHERE u.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.project_member AS pm
        WHERE pm.project_id = target_project_id
          AND pm.user_id = auth.uid()
    )
$$;

CREATE OR REPLACE FUNCTION public.is_project_admin(target_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.current_app_role() = 'Admin'
       AND public.is_project_member(target_project_id)
$$;

CREATE OR REPLACE FUNCTION public.can_join_created_project(target_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.current_app_role() = 'Admin'
       AND EXISTS (
            SELECT 1 FROM public.project AS p
            WHERE p.project_id = target_project_id
              AND p.project_created_by = auth.uid()
       )
$$;

CREATE OR REPLACE FUNCTION public.is_task_assignee(target_task_id integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.task_member AS tm
        WHERE tm.task_id = target_task_id
          AND tm.user_id = auth.uid()
    )
$$;

CREATE OR REPLACE FUNCTION public.can_view_task(target_task_id integer, target_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.is_project_member(target_project_id)
       AND (
            public.current_app_role() IN ('Admin', 'Client')
            OR (
                public.current_app_role() = 'Developer'
                AND public.is_task_assignee(target_task_id)
            )
       )
$$;

CREATE OR REPLACE FUNCTION public.guard_task_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.sprint AS s
        WHERE s.sprint_id = NEW.sprint_id
          AND s.project_id = NEW.project_id
    ) THEN
        RAISE EXCEPTION 'The task sprint must belong to the same project.';
    END IF;

    IF NEW.task_status_id IS NOT NULL
       AND NOT EXISTS (
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

CREATE OR REPLACE FUNCTION public.update_assigned_task_status(
    p_task_id integer,
    p_status_id integer
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    task_project_id uuid;
    updated_status_id integer;
BEGIN
    IF public.current_app_role() <> 'Developer'
       OR NOT public.is_task_assignee(p_task_id) THEN
        RAISE EXCEPTION 'Only the assigned developer can change this task status.';
    END IF;

    SELECT t.project_id INTO task_project_id
    FROM public.task AS t
    WHERE t.task_id = p_task_id;

    IF task_project_id IS NULL OR NOT public.is_project_member(task_project_id) THEN
        RAISE EXCEPTION 'Task not found or project access denied.';
    END IF;

    IF p_status_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.project_status AS ps
        WHERE ps.project_id = task_project_id
          AND ps.status_id = p_status_id
    ) THEN
        RAISE EXCEPTION 'The selected status is not available in this project.';
    END IF;

    UPDATE public.task
    SET task_status_id = p_status_id
    WHERE task_id = p_task_id
    RETURNING task_status_id INTO updated_status_id;

    RETURN updated_status_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_task_assignees(
    p_task_id integer,
    p_user_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    task_project_id uuid;
BEGIN
    SELECT t.project_id INTO task_project_id
    FROM public.task AS t
    WHERE t.task_id = p_task_id;

    IF task_project_id IS NULL OR NOT public.is_project_admin(task_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can assign tasks.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(coalesce(p_user_ids, '{}'::uuid[])) AS requested(user_id)
        WHERE NOT EXISTS (
            SELECT 1
            FROM public.project_member AS pm
            JOIN public."user" AS u ON u.user_id = pm.user_id
            JOIN public.role AS r ON r.role_id = u.role_id
            WHERE pm.project_id = task_project_id
              AND pm.user_id = requested.user_id
              AND r.role_name::text = 'Developer'
        )
    ) THEN
        RAISE EXCEPTION 'Every assignee must be a project member with the Developer role.';
    END IF;

    DELETE FROM public.task_member WHERE task_id = p_task_id;

    INSERT INTO public.task_member (task_id, user_id)
    SELECT p_task_id, requested.user_id
    FROM (
        SELECT DISTINCT user_id
        FROM unnest(coalesce(p_user_ids, '{}'::uuid[])) AS ids(user_id)
    ) AS requested;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_project_member_candidates(p_project_id uuid)
RETURNS TABLE (
    user_id uuid,
    user_first_name text,
    user_last_name text,
    user_pref_name text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_project_admin(p_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can list member candidates.';
    END IF;

    RETURN QUERY
    SELECT u.user_id, u.user_first_name, u.user_last_name, u.user_pref_name
    FROM public."user" AS u
    JOIN public.role AS r ON r.role_id = u.role_id
    WHERE r.role_name::text IN ('Developer', 'Client')
      AND NOT EXISTS (
          SELECT 1 FROM public.project_member AS pm
          WHERE pm.project_id = p_project_id
            AND pm.user_id = u.user_id
      )
    ORDER BY u.user_first_name, u.user_last_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_project_member(p_project_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_project_admin(p_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can add members.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public."user" AS u
        JOIN public.role AS r ON r.role_id = u.role_id
        WHERE u.user_id = p_user_id
          AND r.role_name::text IN ('Developer', 'Client')
    ) THEN
        RAISE EXCEPTION 'The selected account is not a developer or client.';
    END IF;

    INSERT INTO public.project_member (project_id, user_id)
    VALUES (p_project_id, p_user_id)
    ON CONFLICT (project_id, user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_project_member(p_project_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_project_admin(p_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can remove members.';
    END IF;

    DELETE FROM public.task_member AS tm
    USING public.task AS t
    WHERE tm.task_id = t.task_id
      AND t.project_id = p_project_id
      AND tm.user_id = p_user_id;

    DELETE FROM public.project_member
    WHERE project_id = p_project_id
      AND user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_project(p_name text, p_description text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_project_id uuid;
BEGIN
    IF public.current_app_role() <> 'Admin' THEN
        RAISE EXCEPTION 'Only an admin can create a project.';
    END IF;

    IF nullif(trim(p_name), '') IS NULL THEN
        RAISE EXCEPTION 'A project name is required.';
    END IF;

    INSERT INTO public.project (project_name, project_desc, project_created_by)
    VALUES (trim(p_name), nullif(trim(p_description), ''), auth.uid())
    RETURNING project_id INTO new_project_id;

    INSERT INTO public.project_member (project_id, user_id)
    VALUES (new_project_id, auth.uid());

    INSERT INTO public.project_status (project_id, status_id)
    SELECT new_project_id, s.status_id
    FROM public.status AS s
    ON CONFLICT (project_id, status_id) DO NOTHING;

    RETURN new_project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_project(p_project_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_project_admin(p_project_id) THEN
        RAISE EXCEPTION 'Only an admin who belongs to the project can delete it.';
    END IF;

    DELETE FROM public.task WHERE project_id = p_project_id;
    DELETE FROM public.sprint WHERE project_id = p_project_id;
    DELETE FROM public.project WHERE project_id = p_project_id;
    RETURN p_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_project_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_project_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_join_created_project(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_task_assignee(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_task(integer, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.guard_task_update() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_assigned_task_status(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_task_assignees(integer, uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_project_member_candidates(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_project_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_project_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_project(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_project(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_join_created_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_task_assignee(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_task(integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_assigned_task_status(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_task_assignees(integer, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_member_candidates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_project_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_project_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_project(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_project(uuid) TO authenticated;

INSERT INTO public.project_status (project_id, status_id)
SELECT p.project_id, s.status_id
FROM public.project AS p
CROSS JOIN public.status AS s
ON CONFLICT (project_id, status_id) DO NOTHING;

CREATE TRIGGER task_update_role_guard
BEFORE UPDATE ON public.task
FOR EACH ROW
EXECUTE FUNCTION public.guard_task_update();

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tag ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."user" FROM PUBLIC, anon, authenticated;
ALTER TABLE public."user" DROP COLUMN IF EXISTS user_password;
GRANT SELECT (
    user_id, user_first_name, user_last_name,
    user_pref_name, user_email, role_id
) ON public."user" TO authenticated;
GRANT SELECT ON public.role TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.project_member TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprint TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_member TO authenticated;
GRANT SELECT ON public.status, public.project_status TO authenticated;

CREATE POLICY user_read_self_or_project_admin
ON public."user" FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.project_member AS pm
        WHERE pm.user_id = "user".user_id
          AND public.is_project_admin(pm.project_id)
    )
);

CREATE POLICY role_read_authenticated
ON public.role FOR SELECT TO authenticated
USING (true);

CREATE POLICY project_read_member
ON public.project FOR SELECT TO authenticated
USING (public.is_project_member(project_id));

CREATE POLICY project_create_admin
ON public.project FOR INSERT TO authenticated
WITH CHECK (
    public.current_app_role() = 'Admin'
    AND project_created_by = auth.uid()
);

CREATE POLICY project_update_admin
ON public.project FOR UPDATE TO authenticated
USING (public.is_project_admin(project_id))
WITH CHECK (public.is_project_admin(project_id));

CREATE POLICY project_delete_admin
ON public.project FOR DELETE TO authenticated
USING (public.is_project_admin(project_id));

CREATE POLICY project_member_read_self_or_admin
ON public.project_member FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_project_admin(project_id));

CREATE POLICY project_member_insert_admin_or_creator
ON public.project_member FOR INSERT TO authenticated
WITH CHECK (
    (public.is_project_admin(project_id) AND public.current_app_role() = 'Admin')
    OR (user_id = auth.uid() AND public.can_join_created_project(project_id))
);

CREATE POLICY project_member_delete_admin
ON public.project_member FOR DELETE TO authenticated
USING (public.is_project_admin(project_id));

CREATE POLICY sprint_read_member
ON public.sprint FOR SELECT TO authenticated
USING (public.is_project_member(project_id));

CREATE POLICY sprint_insert_admin
ON public.sprint FOR INSERT TO authenticated
WITH CHECK (public.is_project_admin(project_id));

CREATE POLICY sprint_update_admin
ON public.sprint FOR UPDATE TO authenticated
USING (public.is_project_admin(project_id))
WITH CHECK (public.is_project_admin(project_id));

CREATE POLICY sprint_delete_admin
ON public.sprint FOR DELETE TO authenticated
USING (public.is_project_admin(project_id));

CREATE POLICY task_read_assigned_or_admin_or_client
ON public.task FOR SELECT TO authenticated
USING (public.can_view_task(task_id, project_id));

CREATE POLICY task_insert_admin
ON public.task FOR INSERT TO authenticated
WITH CHECK (
    public.is_project_admin(project_id)
    AND task_created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.sprint AS s
        WHERE s.sprint_id = task.sprint_id
          AND s.project_id = task.project_id
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

CREATE POLICY task_update_admin_or_assigned_developer
ON public.task FOR UPDATE TO authenticated
USING (
    public.is_project_admin(project_id)
    OR (
        public.current_app_role() = 'Developer'
        AND public.is_project_member(project_id)
        AND public.is_task_assignee(task_id)
    )
)
WITH CHECK (
    public.is_project_admin(project_id)
    OR (
        public.current_app_role() = 'Developer'
        AND public.is_project_member(project_id)
        AND public.is_task_assignee(task_id)
    )
);

CREATE POLICY task_delete_admin
ON public.task FOR DELETE TO authenticated
USING (public.is_project_admin(project_id));

CREATE POLICY task_member_read_self_or_admin
ON public.task_member FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = task_member.task_id
          AND public.is_project_admin(t.project_id)
    )
);

CREATE POLICY task_member_insert_admin
ON public.task_member FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = task_member.task_id
          AND public.is_project_admin(t.project_id)
    )
    AND EXISTS (
        SELECT 1 FROM public.project_member AS pm
        JOIN public.task AS t ON t.project_id = pm.project_id
        JOIN public."user" AS u ON u.user_id = pm.user_id
        JOIN public.role AS r ON r.role_id = u.role_id
        WHERE t.task_id = task_member.task_id
          AND pm.user_id = task_member.user_id
          AND r.role_name::text = 'Developer'
    )
);

CREATE POLICY task_member_update_admin
ON public.task_member FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = task_member.task_id
          AND public.is_project_admin(t.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = task_member.task_id
          AND public.is_project_admin(t.project_id)
    )
    AND EXISTS (
        SELECT 1
        FROM public.project_member AS pm
        JOIN public.task AS t ON t.project_id = pm.project_id
        JOIN public."user" AS u ON u.user_id = pm.user_id
        JOIN public.role AS r ON r.role_id = u.role_id
        WHERE t.task_id = task_member.task_id
          AND pm.user_id = task_member.user_id
          AND r.role_name::text = 'Developer'
    )
);

CREATE POLICY task_member_delete_admin
ON public.task_member FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = task_member.task_id
          AND public.is_project_admin(t.project_id)
    )
);

CREATE POLICY status_read_project_member
ON public.status FOR SELECT TO authenticated
USING (
    (public.current_app_role() = 'Admin' AND status_is_default)
    OR EXISTS (
        SELECT 1 FROM public.project_status AS ps
        WHERE ps.status_id = status.status_id
          AND public.is_project_member(ps.project_id)
    )
);

CREATE POLICY project_status_read_member
ON public.project_status FOR SELECT TO authenticated
USING (public.is_project_member(project_id));

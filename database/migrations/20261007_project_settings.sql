-- Add project-scoped member details for the settings interface and comment deletion.

DROP FUNCTION IF EXISTS public.list_project_member_candidates(uuid);

CREATE FUNCTION public.list_project_member_candidates(p_project_id uuid)
RETURNS TABLE (
    user_id uuid,
    user_first_name text,
    user_last_name text,
    user_pref_name text,
    user_email text,
    role_name text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_project_admin(p_project_id) THEN
        RAISE EXCEPTION 'Only a project admin can list member candidates.';
    END IF;

    RETURN QUERY
    SELECT u.user_id, u.user_first_name, u.user_last_name, u.user_pref_name,
           u.user_email, r.role_name::text
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

REVOKE ALL ON FUNCTION public.list_project_member_candidates(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_project_member_candidates(uuid) TO authenticated;

GRANT DELETE ON public.comment TO authenticated;
DROP POLICY IF EXISTS comment_delete_author_or_project_admin ON public.comment;
CREATE POLICY comment_delete_author_or_project_admin
ON public.comment FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.task AS t
        WHERE t.task_id = comment.task_id
          AND (
              public.is_project_admin(t.project_id)
              OR (
                  comment.user_id = auth.uid()
                  AND public.can_view_task(t.task_id, t.project_id)
              )
          )
    )
);

NOTIFY pgrst, 'reload schema';

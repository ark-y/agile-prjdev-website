-- Allow assigned developers to update checklist completion without granting
-- access to other task fields.

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
       AND (to_jsonb(NEW) - 'task_status_id' - 'task_checklists')
           = (to_jsonb(OLD) - 'task_status_id' - 'task_checklists') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'You are not permitted to update this task.';
END;
$$;

NOTIFY pgrst, 'reload schema';

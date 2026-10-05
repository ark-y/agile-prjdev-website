ALTER TABLE public.task
ADD COLUMN task_status_id integer;

ALTER TABLE public.task
ADD CONSTRAINT task_task_status_id_fkey
FOREIGN KEY (task_status_id)
REFERENCES public.status(status_id);

ALTER TABLE public.task_member
ALTER COLUMN task_id DROP DEFAULT;

ALTER TABLE public.task_member
ALTER COLUMN task_id TYPE integer
USING task_id::integer;

ALTER TABLE public.task_member
ADD CONSTRAINT task_member_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.task(task_id)
ON DELETE CASCADE
NOT VALID;

ALTER TABLE public.project_member
DROP CONSTRAINT project_member_project_id_fkey;

ALTER TABLE public.project_member
ADD CONSTRAINT project_member_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.project(project_id)
ON DELETE CASCADE;

ALTER TABLE public.sprint
DROP CONSTRAINT sprint_project_id_fkey;

ALTER TABLE public.sprint
ADD CONSTRAINT sprint_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.project(project_id);

ALTER TABLE public.task
DROP CONSTRAINT task_project_id_fkey;

ALTER TABLE public.task
ADD CONSTRAINT task_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.project(project_id);

ALTER TABLE public.backlog
DROP CONSTRAINT backlog_task_id_fkey;

ALTER TABLE public.backlog
ADD CONSTRAINT backlog_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.task(task_id)
ON DELETE CASCADE;

ALTER TABLE public.backlog
DROP CONSTRAINT backlog_project_id_fkey;

ALTER TABLE public.backlog
ADD CONSTRAINT backlog_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.project(project_id)
ON DELETE CASCADE;

ALTER TABLE public.project_status
DROP CONSTRAINT project_status_project_id_fkey;

ALTER TABLE public.project_status
ADD CONSTRAINT project_status_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.project(project_id)
ON DELETE CASCADE;

ALTER TABLE public.notification
DROP CONSTRAINT notification_task_id_fkey;

ALTER TABLE public.notification
ADD CONSTRAINT notification_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.task(task_id)
ON DELETE CASCADE;

ALTER TABLE public.comment
DROP CONSTRAINT task_comment_task_id_fkey;

ALTER TABLE public.comment
ADD CONSTRAINT task_comment_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.task(task_id)
ON DELETE CASCADE;

ALTER TABLE public.task_tag
ALTER COLUMN task_id TYPE integer
USING task_id::integer;

ALTER TABLE public.task_tag
ADD CONSTRAINT task_tag_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.task(task_id)
ON DELETE CASCADE
NOT VALID;

ALTER TABLE public.tag
ADD CONSTRAINT tag_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.project(project_id)
ON DELETE CASCADE
NOT VALID;

ALTER TABLE public.task
DROP CONSTRAINT task_subtask_id_fkey;

ALTER TABLE public.task
ADD CONSTRAINT task_subtask_id_fkey
FOREIGN KEY (subtask_id)
REFERENCES public.task(task_id)
ON DELETE SET NULL;

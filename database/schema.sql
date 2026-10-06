-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.user (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_first_name text NOT NULL,
  user_last_name text NOT NULL,
  user_pref_name text,
  user_email text NOT NULL UNIQUE,
  user_phone character varying UNIQUE,
  user_created_at timestamp without time zone NOT NULL DEFAULT now(),
  role_id integer NOT NULL,
  CONSTRAINT user_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(role_id)
);

CREATE TABLE public.task_member (
  task_id integer NOT NULL,
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_mem_assigned_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT task_member_pkey PRIMARY KEY (task_id, user_id),
  CONSTRAINT Task_assignee_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(user_id)
);

CREATE TABLE public.task_tag (
  task_id integer NOT NULL,
  tag_id numeric NOT NULL,
  CONSTRAINT task_tag_pkey PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE public.backlog (
  backlog_id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id integer NOT NULL,
  project_id uuid NOT NULL,
  CONSTRAINT backlog_pkey PRIMARY KEY (backlog_id, project_id),
  CONSTRAINT backlog_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.task(task_id) ON DELETE CASCADE,
  CONSTRAINT backlog_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX backlog_project_task_key
ON public.backlog (project_id, task_id);

CREATE TABLE public.project (
  project_id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_name text NOT NULL DEFAULT 'New Project'::text,
  project_desc text,
  project_created_at timestamp without time zone NOT NULL DEFAULT now(),
  project_created_by uuid,
  CONSTRAINT project_pkey PRIMARY KEY (project_id),
  CONSTRAINT project_project_created_by_fkey FOREIGN KEY (project_created_by) REFERENCES public.user(user_id)
);

CREATE TABLE public.project_member (
  project_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_member_joined_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_member_pkey PRIMARY KEY (project_id, user_id),
  CONSTRAINT project_member_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE CASCADE,
  CONSTRAINT project_member_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(user_id)
);

CREATE TABLE public.notification (
  notif_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  notif_message text NOT NULL,
  notif_is_read boolean NOT NULL DEFAULT false,
  notif_delivered_at timestamp without time zone NOT NULL DEFAULT now(),
  notif_read_at timestamp without time zone,
  task_id integer,
  CONSTRAINT notification_pkey PRIMARY KEY (notif_id),
  CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(user_id),
  CONSTRAINT notification_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.task(task_id) ON DELETE CASCADE
);

CREATE TABLE public.sprint (
  sprint_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id uuid,
  sprint_name text NOT NULL DEFAULT 'Sprint --'::text,
  sprint_start_date timestamp without time zone,
  sprint_end_date timestamp without time zone,
  sprint_ongoing boolean DEFAULT false,
  CONSTRAINT sprint_pkey PRIMARY KEY (sprint_id),
  CONSTRAINT sprint_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id)
);

CREATE TABLE public.status (
  status_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  status_name USER-DEFINED NOT NULL DEFAULT 'To Do'::default_status_enum,
  status_color character varying NOT NULL DEFAULT '#D3D3D3'::character varying,
  status_is_default boolean NOT NULL DEFAULT false,
  CONSTRAINT status_pkey PRIMARY KEY (status_id)
);

CREATE TABLE public.tag (
  tag_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id uuid NOT NULL,
  tag_name text NOT NULL DEFAULT 'new tag '::text,
  tag_colour text,
  tag_desc text NOT NULL,
  CONSTRAINT tag_pkey PRIMARY KEY (tag_id, project_id),
  CONSTRAINT tag_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE CASCADE
);

CREATE TABLE public.task (
  task_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id uuid NOT NULL,
  sprint_id integer,
  task_name text NOT NULL,
  task_desc text,
  task_priority text NOT NULL,
  task_weight numeric NOT NULL,
  task_deadline timestamp without time zone,
  task_status_id integer,
  task_created_by uuid NOT NULL,
  task_created_at timestamp without time zone NOT NULL DEFAULT now(),
  subtask_id integer UNIQUE,
  CONSTRAINT task_pkey PRIMARY KEY (task_id),
  CONSTRAINT task_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id),
  CONSTRAINT task_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.sprint(sprint_id),
  CONSTRAINT task_task_created_by_fkey FOREIGN KEY (task_created_by) REFERENCES public.user(user_id),
  CONSTRAINT task_subtask_id_fkey FOREIGN KEY (subtask_id) REFERENCES public.task(task_id) ON DELETE SET NULL
);

CREATE TABLE public.role (
  role_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  role_name USER-DEFINED NOT NULL DEFAULT 'Developer'::role_name_enum,
  role_description text,
  CONSTRAINT role_pkey PRIMARY KEY (role_id)
);

CREATE TABLE public.comment (
  comment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  task_id integer NOT NULL,
  user_id uuid NOT NULL,
  task_comm_message text NOT NULL,
  task_comm_created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT comment_pkey PRIMARY KEY (comment_id),
  CONSTRAINT task_comment_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.task(task_id) ON DELETE CASCADE,
  CONSTRAINT task_comment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(user_id)
);

CREATE TABLE public.project_status (
  project_id uuid NOT NULL,
  status_id integer NOT NULL,
  CONSTRAINT project_status_pkey PRIMARY KEY (project_id, status_id),
  CONSTRAINT project_status_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE CASCADE,
  CONSTRAINT project_status_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.status(status_id)
  );

ALTER TABLE public.task
ADD CONSTRAINT task_task_status_id_fkey
FOREIGN KEY (task_status_id) REFERENCES public.status(status_id);

ALTER TABLE public.task_member
ADD CONSTRAINT task_member_task_id_fkey
FOREIGN KEY (task_id) REFERENCES public.task(task_id) ON DELETE CASCADE;

ALTER TABLE public.task_tag
ADD CONSTRAINT task_tag_task_id_fkey
FOREIGN KEY (task_id) REFERENCES public.task(task_id) ON DELETE CASCADE;

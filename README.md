# CL_Thursday5pm_Team7

## Supabase setup

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key. These are browser-safe values; never use a service-role key in the app.
2. Install dependencies and start the Vite app with `npm install` and `npm run dev`.
3. Ensure the Supabase project has the baseline tables, enum types, and constraints represented by `database/schema.sql`. That file documents the schema; it is not a standalone migration.
4. On a fresh database with the baseline schema in place, run the files in `database/migrations/` once, in filename order. If the two `20261005` migrations have already been applied, run only `20261006_app_workflows.sql` from the earlier migrations. The access migration expects the role values `Admin`, `Developer`, and `Client`; the app migration discovers the values in `default_status_enum` and seeds matching status rows.
5. Run `20261006_auth_profile_repair.sql` after the app workflow migration to ensure the profile-creation trigger is installed and any existing Auth accounts without profiles are backfilled. The app's sign-up form creates Supabase Auth accounts with first and last names; new accounts receive the least-privileged Developer role. Assign Client or Admin roles to trusted accounts in the SQL Editor when required:

   ```sql
   UPDATE public."user"
   SET role_id = (SELECT role_id FROM public.role WHERE role_name::text = 'Admin' ORDER BY role_id LIMIT 1)
   WHERE user_id = '<auth-user-uuid>';
   ```

Use `Client` instead of `Admin` in the role lookup to prepare a client test account.

6. Apply `20261007_project_settings.sql` after the role/access and app workflow migrations. It enables safe comment deletion and returns role and email details to project-member candidate lists.
7. Apply `20261007_task_checklist_permissions.sql` after the other migrations. It allows assigned developers to update checklist completion while keeping other task-field updates restricted. Existing projects must apply this migration to Supabase before developers can save checklist changes.
8. Apply `20261008_notification_delete.sql` so people can delete their own notifications with the x on each notification card. Without it, the x shows a message asking for this migration.
9. Apply `20261009_update_own_name.sql` so Developers and Clients can change their own name under Settings → Profile. Without it, saving a name shows a message asking for this migration.
10. Apply `20261010_task_volunteer_notifications.sql` so Developers can volunteer for unassigned backlog tasks and Admins can accept or decline requests in the notification hub.
11. Link this repository to the Supabase project with the Supabase CLI and deploy the `create-project-member` Edge Function:

   ```sh
   supabase link --project-ref <project-ref>
   supabase functions deploy create-project-member
   ```

   The function verifies the signed-in Admin and project membership before creating an Auth account, assigning its Developer or Client role, and adding it to that project. The Supabase Edge Function runtime supplies the service-role key; never put that key in frontend environment variables or source files.

12. As an Admin, open Settings from the sidebar, then use Developers or Clients to add an existing account to a project or create a new account with a temporary password (pick the project it joins). Use Projects to create or rename a project. Added users should change that password under Settings → Security after signing in; Developers and Clients can also change their name under Settings → Profile. Admins can delete projects from the project list; comment authors can delete their own comments, and project Admins can delete any comment in the project.

For Netlify, set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` variables in the site's environment settings. The deploy configuration runs `npm run build` and publishes `dist`.

Notification, comment, tag, and backlog features require the migrations to be applied before they can be used.

FIT2101 S2 2026 group repository.

## Team

```
Alex Nguyen: Product Owner
Azza Alkaabi: Developer
Parampal Singh: Developer
Parvathi Deepu: Developer
Tessica Gomez: Scrum Master
```

## Getting Started

1. Clone this repository.
2. Create a branch for your work.
3. Commit regularly with clear messages.
4. Open a merge request when your work is ready for review.

## Repository Structure

```
CL_Thursday5pm_Team7
    ├── backend
    │   └── schema.sql
    ├── preview.html
    ├── README.md
    └── src
        ├── App.jsx
        ├── components
        │   ├── CreateProjectForm
        │   │   ├── CreateProjectForm.css
        │   │   └── CreateProjectForm.jsx
        │   ├── CreateTaskForm
        │   │   ├── CreateTaskForm.css
        │   │   └── CreateTaskForm.jsx
        │   ├── Navbar
        │   │   ├── Navbar.css
        │   │   └── Navbar.jsx
        │   ├── ProjectCard
        │   │   ├── ProjectCard.css
        │   │   └── ProjectCard.jsx
        │   ├── Sidebar
        │   │   ├── Sidebar.css
        │   │   └── Sidebar.jsx
        │   └── TaskCard
        │       ├── TaskCard.css
        │       └── TaskCard.jsx
        ├── context
        │   └── AuthContent.jsx
        ├── main.jsx
        ├── pages
        │   ├── ClientLanding
        │   │   ├── ClientLanding.css
        │   │   └── ClientLanding.jsx
        │   ├── DevLanding
        │   │   ├── DevLanding.css
        │   │   └── DevLanding.jsx
        │   ├── Login
        │   │   ├── Login.css
        │   │   └── Login.jsx
        │   └── ProjectOverview
        │       ├── ProjectOverview.css
        │       └── ProjectOverview.jsx
        ├── services
        │   ├── projectServices.js
        │   ├── sprintService.js
        │   ├── supabase.js
        │   └── taskServices.js
        └── styles
            └── global.css
```
## Notes

Keep your project work, documentation, setup instructions, and relevant artefacts in this repository.
Do not share this repository outside your group and the teaching team.
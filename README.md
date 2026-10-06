# CL_Thursday5pm_Team7

## Supabase setup

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key. These are browser-safe values; never use a service-role key in the app.
2. Install dependencies and start the Vite app with `npm install` and `npm run dev`.
3. Ensure the Supabase project has the baseline tables, enum types, and constraints represented by `database/schema.sql`. That file documents the schema; it is not a standalone migration.
4. On a fresh database with the baseline schema in place, run the files in `database/migrations/` once, in filename order. If the two `20261005` migrations have already been applied, run only `20261006_app_workflows.sql`. The access migration expects the role values `Admin`, `Developer`, and `Client`; the app migration discovers the values in `default_status_enum` and seeds matching status rows.
5. Create test accounts in Supabase Authentication. The latest migration creates profiles for new accounts and backfills existing Auth users as Developers. Promote trusted test accounts to Admin in the SQL Editor when required:

   ```sql
   UPDATE public."user"
   SET role_id = (SELECT role_id FROM public.role WHERE role_name::text = 'Admin' ORDER BY role_id LIMIT 1)
   WHERE user_id = '<auth-user-uuid>';
   ```

Use `Client` instead of `Admin` in the role lookup to prepare a client test account.

6. As an Admin, create projects and add developer/client accounts from the project overview. Developers only see projects they belong to and tasks assigned to them.

For Netlify, set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` variables in the site's environment settings. The deploy configuration runs `npm run build` and publishes `dist`.

Notification, comment, tag, and backlog features require the migrations to be applied before they can be used.

FIT2101 S2 2026 group repository.

## Team

Add your team members and roles here.

## Getting Started

1. Clone this repository.
2. Create a branch for your work.
3. Commit regularly with clear messages.
4. Open a merge request when your work is ready for review.

## Repository Structure

Update this section as your project grows.

## Notes

Keep your project work, documentation, setup instructions, and relevant artefacts in this repository.
Do not share this repository outside your group and the teaching team.

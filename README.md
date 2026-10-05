# CL_Thursday5pm_Team7

## Supabase setup

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
2. Run the SQL files in `database/migrations/` in filename order in the Supabase SQL Editor. The role policies expect `role_name_enum` values `Admin`, `Developer`, and `Client`.
3. Create each account in Supabase Auth and create a matching `public.user` row whose `user_id` is the Auth user UUID.
4. Add developers and clients to projects from the project overview as an Admin.

The React entry point is in place, but Vite and its development/build scripts are intentionally not configured yet.

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

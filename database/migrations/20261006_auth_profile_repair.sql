-- Restore Auth-to-profile provisioning independently of the full app workflow migration.

INSERT INTO public.role (role_name, role_description)
SELECT 'Developer', 'Works on assigned project tasks.'
WHERE NOT EXISTS (
    SELECT 1 FROM public.role WHERE role_name::text = 'Developer'
);

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
    SELECT role_id
    FROM public.role
    WHERE role_name::text = 'Developer'
    ORDER BY role_id
    LIMIT 1
) AS r
ON CONFLICT (user_id) DO NOTHING;

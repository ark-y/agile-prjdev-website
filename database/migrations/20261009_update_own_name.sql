-- Let a signed-in person change their own name (Settings > Profile for
-- Developers and Clients). Users only have SELECT on public."user", so the
-- change goes through this function, which can only ever touch the caller's row.
--
-- The preferred name is cleared so the name entered here is the one shown
-- everywhere (the app displays the preferred name first when there is one).

CREATE OR REPLACE FUNCTION public.update_own_name(p_first_name text, p_last_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in before changing your name.';
    END IF;

    IF coalesce(btrim(p_first_name), '') = '' OR coalesce(btrim(p_last_name), '') = '' THEN
        RAISE EXCEPTION 'Enter a first and last name.';
    END IF;

    UPDATE public."user"
    SET user_first_name = btrim(p_first_name),
        user_last_name = btrim(p_last_name),
        user_pref_name = NULL
    WHERE user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_name(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_own_name(text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

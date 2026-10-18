import { supabase } from "../supabaseClient";

export async function getCurrentProfileId() {
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();

    if (authError) {
        throw authError;
    }

    if (!user) {
        throw new Error("Sign in before performing this action.");
    }

    const { data: profile, error: profileError } = await supabase
        .from("user")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) {
        throw profileError;
    }

    if (!profile) {
        throw new Error(
            "Your signed-in account has no matching public.user profile. Create the profile before continuing."
        );
    }

    return profile.user_id;
}

export async function fetchCurrentProfile() {
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();

    if (authError) {
        throw authError;
    }

    if (!user) {
        throw new Error("Sign in before accessing a profile.");
    }

    const { data, error } = await supabase
        .from("user")
        .select("user_id, user_first_name, user_last_name, user_pref_name, user_email, role:role!user_role_id_fkey(role_name)")
        .eq("user_id", user.id)
        .single();

    if (error) {
        throw error;
    }

    const roleName = data.role?.role_name;
    if (!["Admin", "Developer", "Client"].includes(roleName)) {
        throw new Error(
            "Your public.user profile is missing a valid Admin, Developer, or Client role."
        );
    }

    return {
        ...data,
        role_name: roleName
    };
}

export async function fetchProjectMemberCandidates(projectId) {
    const { data, error } = await supabase.rpc("list_project_member_candidates", {
        p_project_id: projectId
    });

    if (error) {
        throw error;
    }

    return data;
}

export async function addProjectMember(projectId, userId) {
    const { error } = await supabase.rpc("add_project_member", {
        p_project_id: projectId,
        p_user_id: userId
    });

    if (error) {
        throw error;
    }
}

export async function removeProjectMember(projectId, userId) {
    const { error } = await supabase.rpc("remove_project_member", {
        p_project_id: projectId,
        p_user_id: userId
    });

    if (error) {
        throw error;
    }
}

export async function updateOwnName({ firstName, lastName }) {
    const { error } = await supabase.rpc("update_own_name", {
        p_first_name: firstName,
        p_last_name: lastName
    });

    if (error) {
        const missing = error.code === "PGRST202" || /could not find the function/i.test(error.message || "");
        throw new Error(
            missing
                ? "Saving your name needs the 20261009_update_own_name.sql migration to be applied in Supabase."
                : error.message || "Could not update your name."
        );
    }

    // Keep the sign-in account's own copy of the name in step (best effort).
    await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return jsonResponse({ error: "Sign in as an admin before adding a project member." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        return jsonResponse({ error: "The project member function is missing its Supabase configuration." }, 500);
    }

    const token = authorization.slice("Bearer ".length);
    const authClient = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) {
        return jsonResponse({ error: "Your sign-in session is invalid or expired." }, 401);
    }

    let body: {
        projectId?: string;
        role?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
    };
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: "The request body must be valid JSON." }, 400);
    }

    const { projectId, role, firstName, lastName, email, password } = body;
    if (
        !projectId
        || !["Developer", "Client"].includes(role || "")
        || !firstName?.trim()
        || !lastName?.trim()
        || !email?.trim()
        || !password
        || password.length < 8
    ) {
        return jsonResponse({
            error: "Provide a project, Developer or Client role, name, valid email, and a password of at least 8 characters."
        }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: profile, error: profileError } = await adminClient
        .from("user")
        .select("role:role!user_role_id_fkey(role_name)")
        .eq("user_id", authData.user.id)
        .single();
    if (profileError || profile?.role?.role_name !== "Admin") {
        return jsonResponse({ error: "Only an admin can create project members." }, 403);
    }

    const { data: adminMembership, error: membershipError } = await adminClient
        .from("project_member")
        .select("project_id")
        .eq("project_id", projectId)
        .eq("user_id", authData.user.id)
        .maybeSingle();
    if (membershipError || !adminMembership) {
        return jsonResponse({ error: "You must be a member of this project to manage its users." }, 403);
    }

    const { data: targetRole, error: roleError } = await adminClient
        .from("role")
        .select("role_id")
        .eq("role_name", role)
        .single();
    if (roleError || !targetRole) {
        return jsonResponse({ error: `The ${role} role is not configured in the database.` }, 500);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
        }
    });
    if (createError || !created.user) {
        return jsonResponse({
            error: createError?.message || "Supabase did not return the created user."
        }, 400);
    }

    const { data: updatedProfile, error: updateProfileError } = await adminClient
        .from("user")
        .update({ role_id: targetRole.role_id })
        .eq("user_id", created.user.id)
        .select("user_id")
        .maybeSingle();
    if (updateProfileError || !updatedProfile) {
        const profileFailureMessage = updateProfileError?.message
            || "The Auth account was created without a public.user profile. Apply the auth profile repair migration first.";
        const { error: profileCleanupError } = await adminClient
            .from("user")
            .delete()
            .eq("user_id", created.user.id);
        const { error: authCleanupError } = await adminClient.auth.admin.deleteUser(created.user.id);
        const cleanupError = profileCleanupError || authCleanupError;
        return jsonResponse({
            error: cleanupError
                ? `${profileFailureMessage} Account cleanup failed: ${cleanupError.message}`
                : profileFailureMessage
        }, 500);
    }

    const { error: addMemberError } = await adminClient
        .from("project_member")
        .insert({ project_id: projectId, user_id: created.user.id });
    if (addMemberError) {
        const { error: profileCleanupError } = await adminClient
            .from("user")
            .delete()
            .eq("user_id", created.user.id);
        const { error: authCleanupError } = await adminClient.auth.admin.deleteUser(created.user.id);
        const cleanupError = profileCleanupError || authCleanupError;
        return jsonResponse({
            error: cleanupError
                ? `${addMemberError.message} Account cleanup failed: ${cleanupError.message}`
                : addMemberError.message
        }, 500);
    }

    return jsonResponse({
        userId: created.user.id,
        role,
        email: created.user.email
    }, 201);
});

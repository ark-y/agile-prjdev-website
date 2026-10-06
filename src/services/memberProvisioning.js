import { supabase } from "../supabaseClient";

export async function createProjectMember({
    projectId,
    role,
    firstName,
    lastName,
    email,
    password
}) {
    const { data, error } = await supabase.functions.invoke("create-project-member", {
        body: {
            projectId,
            role,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password
        }
    });

    if (error) {
        const response = error.context;
        let detail = error.message;
        if (response && typeof response.json === "function") {
            try {
                const body = await response.json();
                detail = body.error || detail;
            } catch (readError) {
                if (readError instanceof Error) {
                    throw new Error(`${detail} (${readError.message})`);
                }
            }
        }
        throw new Error(detail || "Could not create the project member.");
    }

    return data;
}

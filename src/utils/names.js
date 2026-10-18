/*
 * The settings forms ask for one "Full name"; accounts store a first and last
 * name. The last word becomes the last name, everything before it the first.
 */

export function splitFullName(fullName) {
    const words = (fullName || "").trim().split(/\s+/).filter(Boolean);

    if (words.length < 2) {
        return null;
    }

    return {
        firstName: words.slice(0, -1).join(" "),
        lastName: words[words.length - 1]
    };
}

export function joinName(profile) {
    return `${profile.user_first_name || ""} ${profile.user_last_name || ""}`.trim();
}

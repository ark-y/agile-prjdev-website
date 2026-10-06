import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { createProjectMember } from "../../services/memberProvisioning";
import "./ProjectSettings.css";

function getMemberName(member) {
    return member.user_pref_name
        || `${member.user_first_name} ${member.user_last_name}`.trim()
        || member.user_email;
}

function ProjectSettings({
    project,
    roleName,
    members = [],
    memberCandidates = [],
    onClose,
    onAddMember,
    onRemoveMember,
    onRenameProject,
    onMemberCreated
}) {
    const isAdmin = roleName === "Admin" && Boolean(project);
    const [section, setSection] = useState(isAdmin ? "Developer" : "Security");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [projectName, setProjectName] = useState(project?.project_name || "");
    const [candidateId, setCandidateId] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const visibleCandidates = memberCandidates.filter(
        (candidate) => candidate.role_name === section
    );
    const visibleMembers = members.filter(
        (member) => member.role?.role_name === section
    );

    function selectSection(nextSection) {
        setSection(nextSection);
        setError("");
        setMessage("");
    }

    async function handleCreateAccount(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        setIsSaving(true);

        let accountCreated = false;
        try {
            await createProjectMember({
                projectId: project.project_id,
                role: section,
                firstName,
                lastName,
                email,
                password
            });
            accountCreated = true;
            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            await onMemberCreated();
            setMessage(`${section} account created and added to this project.`);
        } catch (createError) {
            setError(accountCreated
                ? `The account was created, but the project view could not refresh: ${createError.message}`
                : createError.message || `Could not create the ${section.toLowerCase()} account.`);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAddExisting(event) {
        event.preventDefault();
        if (!candidateId) return;
        setError("");
        setMessage("");
        setIsSaving(true);

        try {
            const wasAdded = await onAddMember(candidateId);
            if (wasAdded) {
                setCandidateId("");
                setMessage(`${section} added to this project.`);
            } else {
                setError("Could not add the selected account. Check the app error message.");
            }
        } catch (addError) {
            setError(addError.message || "Could not add the selected account.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleChangePassword(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (newPassword.length < 8) {
            setError("Use a password with at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        setIsSaving(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (updateError) throw updateError;
            setNewPassword("");
            setConfirmPassword("");
            setMessage("Your password has been changed.");
        } catch (updateError) {
            setError(updateError.message || "Could not change your password.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRenameProjectSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        setIsSaving(true);
        try {
            await onRenameProject(projectName);
            setMessage("Project name updated.");
        } catch (renameError) {
            setError(renameError.message || "Could not rename the project.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className="settings-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <section
                className="project-settings"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
            >
                <header className="settings-header">
                    <h2 id="settings-title">Settings</h2>
                    <button type="button" onClick={onClose} aria-label="Close settings">×</button>
                </header>

                <nav className="settings-tabs" aria-label="Settings sections">
                    {isAdmin && (
                        <>
                            <button
                                type="button"
                                aria-pressed={section === "Developer"}
                                onClick={() => selectSection("Developer")}
                            >
                                Developer
                            </button>
                            <button
                                type="button"
                                aria-pressed={section === "Client"}
                                onClick={() => selectSection("Client")}
                            >
                                Client
                            </button>
                            <button
                                type="button"
                                aria-pressed={section === "Project"}
                                onClick={() => selectSection("Project")}
                            >
                                Project
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        aria-pressed={section === "Security"}
                        onClick={() => selectSection("Security")}
                    >
                        Security
                    </button>
                </nav>

                {error && <p className="settings-error" role="alert">{error}</p>}
                {message && <p className="settings-message" role="status">{message}</p>}

                {isAdmin && ["Developer", "Client"].includes(section) && (
                    <section className="settings-section">
                        <h3>Add {section.toLowerCase()}</h3>
                        {visibleCandidates.length > 0 && (
                            <form className="settings-form" onSubmit={handleAddExisting}>
                                <label htmlFor="existing-member">Add an existing account</label>
                                <select
                                    id="existing-member"
                                    value={candidateId}
                                    onChange={(event) => setCandidateId(event.target.value)}
                                >
                                    <option value="">Choose an account...</option>
                                    {visibleCandidates.map((candidate) => (
                                        <option key={candidate.user_id} value={candidate.user_id}>
                                            {getMemberName(candidate)} ({candidate.user_email})
                                        </option>
                                    ))}
                                </select>
                                <button type="submit" disabled={!candidateId || isSaving}>
                                    Add existing {section.toLowerCase()}
                                </button>
                            </form>
                        )}

                        <h3>Create account and add to project</h3>
                        <form className="settings-form" onSubmit={handleCreateAccount}>
                            <label htmlFor="member-first-name">First name</label>
                            <input
                                id="member-first-name"
                                autoComplete="given-name"
                                required
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                            />
                            <label htmlFor="member-last-name">Last name</label>
                            <input
                                id="member-last-name"
                                autoComplete="family-name"
                                required
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                            />
                            <label htmlFor="member-email">Email</label>
                            <input
                                id="member-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                            <label htmlFor="member-password">Temporary password</label>
                            <input
                                id="member-password"
                                type="password"
                                autoComplete="new-password"
                                minLength={8}
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                            <button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : `Create ${section.toLowerCase()}`}
                            </button>
                        </form>

                        <h3>Project {section.toLowerCase()}s</h3>
                        {visibleMembers.length ? (
                            <ul className="settings-members">
                                {visibleMembers.map((member) => (
                                    <li key={member.user_id}>
                                        <span>{getMemberName(member)} ({member.user_email})</span>
                                        {member.user_id !== project.project_created_by && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveMember(member)}
                                                aria-label={`Remove ${getMemberName(member)} from project`}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No {section.toLowerCase()}s are assigned to this project yet.</p>
                        )}
                    </section>
                )}

                {isAdmin && section === "Project" && (
                    <section className="settings-section">
                        <h3>Project settings</h3>
                        <form className="settings-form" onSubmit={handleRenameProjectSubmit}>
                            <label htmlFor="project-name">Project name</label>
                            <input
                                id="project-name"
                                required
                                value={projectName}
                                onChange={(event) => setProjectName(event.target.value)}
                            />
                            <button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save project name"}
                            </button>
                        </form>
                    </section>
                )}

                {section === "Security" && (
                    <section className="settings-section">
                        <h3>Change password</h3>
                        <form className="settings-form" onSubmit={handleChangePassword}>
                            <label htmlFor="new-password">New password</label>
                            <input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                minLength={8}
                                required
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                            />
                            <label htmlFor="confirm-password">Confirm new password</label>
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                minLength={8}
                                required
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                            />
                            <button type="submit" disabled={isSaving}>
                                {isSaving ? "Updating..." : "Change password"}
                            </button>
                        </form>
                    </section>
                )}
            </section>
        </section>
    );
}

export default ProjectSettings;

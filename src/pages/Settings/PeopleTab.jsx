import { useState } from "react";
import { createProjectMember } from "../../services/memberProvisioning";
import { addProjectMember, fetchProjectMemberCandidates, removeProjectMember } from "../../services/serviceHelpers";
import { fetchProjectMembers } from "../../services/taskServices";
import { splitFullName } from "../../utils/names";
import {
    CardActions,
    Feedback,
    Field,
    getPersonName,
    IDLE,
    Note,
    SecretInput,
    SelectInput,
    SettingsCard,
    TextInput
} from "./parts";

/*
 * Admin: add Developers (or Clients) to projects. `role` is "Developer" or
 * "Client". Everything here is chosen per project, not tied to an open project.
 */
function PeopleTab({ role, projects }) {
    const lower = role.toLowerCase();
    const projectName = (projectId) => projects.find((project) => project.project_id === projectId)?.project_name || "the project";

    // ---- add an existing account to a project ----
    const [existingProjectId, setExistingProjectId] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [candidateId, setCandidateId] = useState("");
    const [existingStatus, setExistingStatus] = useState(IDLE);

    // ---- create a new account (and add it to a project) ----
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [createProjectId, setCreateProjectId] = useState("");
    const [createStatus, setCreateStatus] = useState(IDLE);

    // ---- who is on a project ----
    const [manageProjectId, setManageProjectId] = useState("");
    const [members, setMembers] = useState([]);
    const [manageStatus, setManageStatus] = useState(IDLE);

    async function loadCandidates(projectId) {
        if (!projectId) {
            setCandidates([]);
            return;
        }

        try {
            const rows = await fetchProjectMemberCandidates(projectId);
            setCandidates(rows.filter((row) => row.role_name === role));
        } catch (loadError) {
            setExistingStatus({ ...IDLE, error: loadError.message || `Could not load the available ${lower}s.` });
        }
    }

    async function loadMembers(projectId) {
        if (!projectId) {
            setMembers([]);
            return;
        }

        try {
            const rows = await fetchProjectMembers(projectId);
            setMembers(rows.filter((row) => row.role?.role_name === role));
        } catch (loadError) {
            setManageStatus({ ...IDLE, error: loadError.message || `Could not load the project's ${lower}s.` });
        }
    }

    async function refreshProject(projectId) {
        await Promise.all([
            existingProjectId === projectId ? loadCandidates(projectId) : null,
            manageProjectId === projectId ? loadMembers(projectId) : null
        ]);
    }

    function chooseExistingProject(projectId) {
        setExistingProjectId(projectId);
        setCandidateId("");
        setExistingStatus(IDLE);
        loadCandidates(projectId);
    }

    function resetExisting() {
        setExistingProjectId("");
        setCandidates([]);
        setCandidateId("");
        setExistingStatus(IDLE);
    }

    async function handleAddExisting(event) {
        event.preventDefault();
        setExistingStatus({ ...IDLE, busy: true });

        try {
            await addProjectMember(existingProjectId, candidateId);
            setCandidateId("");
            setExistingStatus({ ...IDLE, message: `${role} added to ${projectName(existingProjectId)}.` });
            await refreshProject(existingProjectId);
        } catch (addError) {
            setExistingStatus({ ...IDLE, error: addError.message || "Could not add the selected account." });
        }
    }

    function resetCreate() {
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setCreateProjectId("");
        setCreateStatus(IDLE);
    }

    async function handleCreate(event) {
        event.preventDefault();

        const name = splitFullName(fullName);
        if (!name) {
            setCreateStatus({ ...IDLE, error: "Enter a first and last name." });
            return;
        }
        if (password.length < 8) {
            setCreateStatus({ ...IDLE, error: "Use a password with at least 8 characters." });
            return;
        }
        if (password !== confirmPassword) {
            setCreateStatus({ ...IDLE, error: "The passwords do not match." });
            return;
        }

        setCreateStatus({ ...IDLE, busy: true });
        try {
            await createProjectMember({
                projectId: createProjectId,
                role,
                firstName: name.firstName,
                lastName: name.lastName,
                email,
                password
            });
            const addedTo = projectName(createProjectId);
            await refreshProject(createProjectId);
            resetCreate();
            setCreateStatus({ ...IDLE, message: `${role} account created and added to ${addedTo}.` });
        } catch (createError) {
            setCreateStatus({ ...IDLE, error: createError.message || `Could not create the ${lower} account.` });
        }
    }

    function chooseManageProject(projectId) {
        setManageProjectId(projectId);
        setManageStatus(IDLE);
        loadMembers(projectId);
    }

    async function handleRemove(member) {
        if (!window.confirm(`Remove ${getPersonName(member)} from ${projectName(manageProjectId)} and unassign their tasks?`)) {
            return;
        }

        setManageStatus({ ...IDLE, busy: true });
        try {
            await removeProjectMember(manageProjectId, member.user_id);
            setManageStatus({ ...IDLE, message: `${getPersonName(member)} was removed from ${projectName(manageProjectId)}.` });
            await refreshProject(manageProjectId);
        } catch (removeError) {
            setManageStatus({ ...IDLE, error: removeError.message || "Could not remove the project member." });
        }
    }

    const projectOptions = projects.map((project) => (
        <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
    ));
    const managedProject = projects.find((project) => project.project_id === manageProjectId);

    return (
        <div className="set-grid">
            <SettingsCard
                title={`Add existing ${lower}`}
                subtitle="Select an account that already exists and add it to a project."
                onSubmit={handleAddExisting}
            >
                <div className="set-body">
                    <Field id="existing-project" label="Project">
                        <SelectInput
                            id="existing-project"
                            required
                            value={existingProjectId}
                            onChange={(event) => chooseExistingProject(event.target.value)}
                        >
                            <option value="">Select a project</option>
                            {projectOptions}
                        </SelectInput>
                    </Field>
                    <Field id="existing-account" label={`Existing ${lower}`}>
                        <SelectInput
                            id="existing-account"
                            required
                            disabled={!existingProjectId}
                            value={candidateId}
                            onChange={(event) => setCandidateId(event.target.value)}
                        >
                            <option value="">
                                {!existingProjectId
                                    ? "Select a project first"
                                    : candidates.length ? `Select an existing ${lower}` : `No ${lower}s left to add`}
                            </option>
                            {candidates.map((candidate) => (
                                <option key={candidate.user_id} value={candidate.user_id}>
                                    {getPersonName(candidate)} ({candidate.user_email})
                                </option>
                            ))}
                        </SelectInput>
                    </Field>
                    <Note>This uses the existing account. No new login is created.</Note>
                    <Feedback status={existingStatus} />
                </div>
                <CardActions
                    onCancel={resetExisting}
                    submitLabel={`Add ${lower}`}
                    busyLabel="Adding..."
                    busy={existingStatus.busy}
                    disabled={!candidateId}
                />
            </SettingsCard>

            <SettingsCard
                title={`Create new ${lower}`}
                subtitle="Create a new account with its own sign-in details."
                onSubmit={handleCreate}
            >
                <div className="set-body">
                    <Field id="new-full-name" label="Full name">
                        <TextInput
                            id="new-full-name"
                            autoComplete="off"
                            required
                            placeholder="Enter full name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                        />
                    </Field>
                    <Field id="new-email" label="Email address">
                        <TextInput
                            id="new-email"
                            type="email"
                            autoComplete="off"
                            required
                            placeholder="Enter email address"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </Field>
                    <Field id="new-password" label="Password">
                        <SecretInput
                            id="new-password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            placeholder="Enter a password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </Field>
                    <Field id="new-confirm" label="Confirm password">
                        <SecretInput
                            id="new-confirm"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </Field>
                    <Field id="new-project" label="Add to project">
                        <SelectInput
                            id="new-project"
                            required
                            value={createProjectId}
                            onChange={(event) => setCreateProjectId(event.target.value)}
                        >
                            <option value="">Select a project</option>
                            {projectOptions}
                        </SelectInput>
                    </Field>
                    <Feedback status={createStatus} />
                </div>
                <CardActions
                    onCancel={resetCreate}
                    submitLabel={`Create ${lower}`}
                    busyLabel="Creating..."
                    busy={createStatus.busy}
                />
            </SettingsCard>

            <SettingsCard
                className="set-card-wide"
                title={`${role}s on a project`}
                subtitle={`See who is on a project and remove a ${lower} when they no longer need access.`}
            >
                <div className="set-body">
                    <Field id="manage-project" label="Project">
                        <SelectInput
                            id="manage-project"
                            value={manageProjectId}
                            onChange={(event) => chooseManageProject(event.target.value)}
                        >
                            <option value="">Select a project</option>
                            {projectOptions}
                        </SelectInput>
                    </Field>

                    {manageProjectId && (members.length ? (
                        <ul className="set-people">
                            {members.map((member) => (
                                <li key={member.user_id}>
                                    <span>
                                        <strong>{getPersonName(member)}</strong>
                                        <small>{member.user_email}</small>
                                    </span>
                                    {member.user_id !== managedProject?.project_created_by && (
                                        <button
                                            type="button"
                                            className="set-button set-button-light"
                                            aria-label={`Remove ${getPersonName(member)} from project`}
                                            disabled={manageStatus.busy}
                                            onClick={() => handleRemove(member)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="set-hint">No {lower}s are on this project yet.</p>
                    ))}
                    <Feedback status={manageStatus} />
                </div>
            </SettingsCard>
        </div>
    );
}

export default PeopleTab;

import { useState } from "react";
import { CardActions, Feedback, Field, IDLE, SelectInput, SettingsCard, TextInput } from "./parts";

// Admin: create a project workspace, or rename an existing one.
function ProjectsTab({ projects, onCreateProject, onRenameProject }) {
    const [newName, setNewName] = useState("");
    const [createStatus, setCreateStatus] = useState(IDLE);

    const [renameProjectId, setRenameProjectId] = useState("");
    const [renameName, setRenameName] = useState("");
    const [renameStatus, setRenameStatus] = useState(IDLE);

    function resetCreate() {
        setNewName("");
        setCreateStatus(IDLE);
    }

    async function handleCreate(event) {
        event.preventDefault();

        if (!newName.trim()) {
            setCreateStatus({ ...IDLE, error: "Enter a project name." });
            return;
        }

        setCreateStatus({ ...IDLE, busy: true });
        try {
            await onCreateProject({ name: newName, description: "" });
        } catch (createError) {
            setCreateStatus({ ...IDLE, error: createError.message || "Could not create the project." });
        }
    }

    function chooseRenameProject(projectId) {
        setRenameProjectId(projectId);
        setRenameName(projects.find((project) => project.project_id === projectId)?.project_name || "");
        setRenameStatus(IDLE);
    }

    function resetRename() {
        setRenameProjectId("");
        setRenameName("");
        setRenameStatus(IDLE);
    }

    async function handleRename(event) {
        event.preventDefault();

        if (!renameName.trim()) {
            setRenameStatus({ ...IDLE, error: "Enter a project name." });
            return;
        }

        setRenameStatus({ ...IDLE, busy: true });
        try {
            await onRenameProject(renameProjectId, renameName);
            setRenameStatus({ ...IDLE, message: "Project name updated." });
        } catch (renameError) {
            setRenameStatus({ ...IDLE, error: renameError.message || "Could not rename the project." });
        }
    }

    const currentName = projects.find((project) => project.project_id === renameProjectId)?.project_name;

    return (
        <div className="set-grid">
            <SettingsCard
                title="Create new project"
                subtitle="Start with a name. You can add developers and share the project with clients after creating it."
                onSubmit={handleCreate}
            >
                <div className="set-body">
                    <Field id="project-name" label="Project name">
                        <TextInput
                            id="project-name"
                            required
                            placeholder="Enter project name"
                            value={newName}
                            onChange={(event) => setNewName(event.target.value)}
                        />
                    </Field>
                    <p className="set-hint">Choose a name your team and clients will recognize.</p>
                    <Feedback status={createStatus} />
                </div>
                <CardActions
                    onCancel={resetCreate}
                    submitLabel="Create project"
                    busyLabel="Creating..."
                    busy={createStatus.busy}
                />
            </SettingsCard>

            <SettingsCard
                title="Rename a project"
                subtitle="Pick a project and give it a new name."
                onSubmit={handleRename}
            >
                <div className="set-body">
                    <Field id="rename-project" label="Project">
                        <SelectInput
                            id="rename-project"
                            required
                            value={renameProjectId}
                            onChange={(event) => chooseRenameProject(event.target.value)}
                        >
                            <option value="">Select a project</option>
                            {projects.map((project) => (
                                <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                            ))}
                        </SelectInput>
                    </Field>
                    <Field id="rename-name" label="New name">
                        <TextInput
                            id="rename-name"
                            required
                            disabled={!renameProjectId}
                            placeholder="Enter new project name"
                            value={renameName}
                            onChange={(event) => setRenameName(event.target.value)}
                        />
                    </Field>
                    <Feedback status={renameStatus} />
                </div>
                <CardActions
                    onCancel={resetRename}
                    submitLabel="Save name"
                    busyLabel="Saving..."
                    busy={renameStatus.busy}
                    disabled={!renameProjectId || !renameName.trim() || renameName.trim() === currentName}
                />
            </SettingsCard>
        </div>
    );
}

export default ProjectsTab;

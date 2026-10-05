import { useState } from "react";
import "./CreateProjectForm.css";

function CreateProjectForm({ onCreate, onCancel }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!name.trim()) {
            setError("Enter a project name.");
            return;
        }

        setError("");
        setIsSaving(true);

        try {
            await onCreate({ name, description });
        } catch (createError) {
            setError(createError.message || "Could not create the project.");
        } finally {
            setIsSaving(false);
        }
    }

    return (

        // background behind the popup
        <section className="popup-background popup-background-open">

            {/* the actual popup */}
            <form className="create-project-popup" onSubmit={handleSubmit}>

                <h2>Create Project</h2>

                {/* getting the project name */}
                <label htmlFor="projectName">
                    Project Name
                </label>

                <input
                    type="text"
                    id="projectName"
                    placeholder="Enter project name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />

                <label htmlFor="projectDescription">
                    Description
                </label>

                <textarea
                    id="projectDescription"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />

                {error && <p role="alert">{error}</p>}

                {/* buttons at the bottom */}
                <section className="popup-buttons">

                    {/* closing without making a project */}
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>

                    {/* making the project */}
                    <button
                        type="submit"
                        className="create-button"
                        disabled={isSaving}
                    >
                        {isSaving ? "Creating..." : "Create Project"}
                    </button>

                </section>

            </form>

        </section>
    );
}

export default CreateProjectForm;
import { useState } from "react";
import "./CreateProjectForm.css";

function CreateProjectForm({ onClose, onCreate }) {
    console.log("🟢 CreateProjectForm rendered");

    const [projectName, setProjectName] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("1. Form submitted with:", projectName);

        if (projectName.trim() === "") {
            console.log("2. Empty name, stopping"); //
            return;
        }

        onCreate(projectName);
        console.log("3. onCreate called"); //
        setProjectName("");
        onClose();
        console.log("4. onClose called"); //
    };

    return (
        <section className="popup-background">
            <form className="create-project-popup" onSubmit={handleSubmit}>
                <h2>Create Project</h2>

                <label htmlFor="projectName">Project Name</label>
                <input
                    type="text"
                    id="projectName"
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                />

                <section className="popup-buttons">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button type="submit" className="create-button">
                        Create Project
                    </button>
                </section>
            </form>
        </section>
    );
}

export default CreateProjectForm;
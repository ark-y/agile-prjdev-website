import { useRef, useEffect } from "react";
import "./ClientLanding.css";
import TaskComments from "../../components/TaskComments/TaskComments";

function ClientLanding({
    project,
    projects = [],
    tasks = [],
    sprints = [],
    currentUserId,
    roleName,
    onProjectChange,
    onOpenSettings,
    onSignOut
}) {
    const completedCount = tasks.filter((task) =>
        ["done", "complete", "completed"].includes(
            task.task_status?.status_name?.toLowerCase()
        )
    ).length;
    const progress = tasks.length
        ? Math.round((completedCount / tasks.length) * 100)
        : 0;

    const donutRef = useRef(null);

    useEffect(() => {
        //The progress bar being used is taken from: https://kimmobrunfeldt.github.io/progressbar.js/""
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/progressbar.js/1.1.0/progressbar.min.js";
        script.async = true;

        script.onload = () => {
        const donut = new window.ProgressBar.Circle(donutRef.current, {
            color: "#6FD361",
            trailColor: "#18273A",
            strokeWidth: 15,
            trailWidth: 15,
            fill: null,
            duration: 1200,
            easing: "easeOut",
            svgStyle: {
            display: "block",
            width: "100%",
            height: "100%",
            },
        });
        donut.animate(progress/100); // 67%
        };

        document.body.appendChild(script);

        return () => {
        document.body.removeChild(script);
        };
    }, []);

    return (
        <main className="client-page">
            <header className="client-dashboard-header">
                <h1>{project?.project_name || "Client dashboard"}</h1>
                {projects.length > 1 && (
                    <select
                        aria-label="Choose project"
                        value={project?.project_id || ""}
                        onChange={(event) => onProjectChange(
                            projects.find((item) => item.project_id === event.target.value)
                        )}
                    >
                        {projects.map((item) => (
                            <option key={item.project_id} value={item.project_id}>
                                {item.project_name}
                            </option>
                        ))}
                    </select>
                )}
                <div className="header-buttons">
                    <button type="button" onClick={onOpenSettings}>Settings</button>
                    <button type="button" onClick={onSignOut}>Sign out</button>
                </div>
            </header>

            {!project ? (
                <p className="client-empty-state">
                    {projects.length ? "Loading your project..." : "No projects have been shared with you yet."}
                </p>
            ) : (
                <section className="dashboard-content">
                    <section className="progress-section" aria-label="Overall progress">
                        <figure
                            className="progress-donut-container"
                            aria-label={`${progress}% complete`}
                        >
                            <div className="progress-donut" id="progress-donut" ref={donutRef}>
                                <span className="progress-text">
                                    {progress}%
                                </span>
                            </div>
                        </figure>
                    </section>

                    <section className="right-panel">
                        <article className="current-tasks">
                            <h2>Project tasks</h2>
                            {tasks.length ? (
                                <ul className="current-tasks-list">
                                    {tasks.map((task) => (
                                        <li className="task-item" key={task.task_id}>
                                            <span>{task.task_name}</span>
                                            <span>
                                                {task.task_status?.status_name || "Not started"}
                                            </span>
                                            <TaskComments
                                                taskId={task.task_id}
                                                currentUserId={currentUserId}
                                                roleName={roleName}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No tasks have been added yet.</p>
                            )}
                        </article>

                        {sprints.map((sprint) => (
                            <article className="client-sprint-box" key={sprint.sprint_id}>
                                <h3>{sprint.sprint_name}</h3>
                                <span>
                                    {tasks.filter((task) => task.sprint_id === sprint.sprint_id).length} tasks
                                </span>
                            </article>
                        ))}
                    </section>
                </section>
            )}
        </main>
    );
}

export default ClientLanding;

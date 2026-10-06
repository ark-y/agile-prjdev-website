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
                <span className="percentage">{progress}%</span>
                <button type="button" onClick={onOpenSettings}>Settings</button>
                <button type="button" onClick={onSignOut}>Sign out</button>
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
                            <span className="progress-donut">{progress}%</span>
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

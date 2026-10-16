import { useEffect, useState } from "react";
import ClientShell from "../../components/ClientShell/ClientShell";
import TaskComments from "../../components/TaskComments/TaskComments";
import "./ClientProject.css";

function isTaskComplete(task) {
    return ["done", "complete", "completed"].includes(task.task_status?.status_name?.toLowerCase());
}

function toPercent(done, total) {
    return total ? Math.round((done / total) * 100) : 0;
}

// A sprint is finished once its end date has passed or every task in it is done.
function isSprintFinished(sprint, sprintTasks) {
    const ended = sprint.sprint_end_date
        && new Date(`${sprint.sprint_end_date.slice(0, 10)}T23:59:59`) < new Date();
    return Boolean(ended) || (sprintTasks.length > 0 && sprintTasks.every(isTaskComplete));
}

function hasStarted(sprint) {
    return !sprint.sprint_start_date
        || new Date(`${sprint.sprint_start_date.slice(0, 10)}T00:00:00`) <= new Date();
}

// The progress ring: a white track with a salmon arc that fills clockwise from the top.
function ProgressDonut({ percent }) {
    const [shown, setShown] = useState(0);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => setShown(percent));
        return () => window.cancelAnimationFrame(frame);
    }, [percent]);

    return (
        <figure className="cp-donut" aria-label={`${percent}% complete`}>
            <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                <circle className="cp-donut-track" cx="50" cy="50" r="44" />
                <circle
                    className="cp-donut-arc"
                    cx="50"
                    cy="50"
                    r="44"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={100 - shown}
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <span className="cp-donut-text">{percent}%</span>
        </figure>
    );
}

/*
 * What a Client sees after opening one of their projects: overall progress,
 * the project's tasks (with comments) and a card for each sprint.
 */
function ClientProject({
    profile,
    project,
    tasks = [],
    sprints = [],
    currentUserId,
    onBack,
    onOpenSettings,
    onSignOut
}) {
    const progress = toPercent(tasks.filter(isTaskComplete).length, tasks.length);

    const orderedSprints = [...sprints].sort((a, b) =>
        (a.sprint_start_date || "").localeCompare(b.sprint_start_date || "") || a.sprint_id - b.sprint_id
    );
    const tasksOf = (sprint) => tasks.filter((task) => task.sprint_id === sprint.sprint_id);
    const unfinished = orderedSprints.filter((sprint) => !isSprintFinished(sprint, tasksOf(sprint)));
    const currentSprint = unfinished.find(hasStarted) ?? unfinished[0];

    return (
        <ClientShell
            profile={profile}
            title={project.project_name}
            upperTitle
            badge={`${progress}% complete`}
            onBack={onBack}
            activeNav="overview"
            onOpenOverview={onBack}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
        >
            <div className="cp-layout">
                <section className="cp-card cp-progress" aria-label="Overall progress">
                    <header className="cp-card-head">
                        <h2>Overall progress</h2>
                        <span className="cp-pill">{progress}%</span>
                    </header>
                    <ProgressDonut percent={progress} />
                </section>

                <div className="cp-side">
                    <section className="cp-card" aria-label="Current tasks">
                        <header className="cp-card-head">
                            <h2>Current Tasks</h2>
                            <span className="cp-pill cp-pill-light">
                                {tasks.length} {tasks.length === 1 ? "item" : "items"}
                            </span>
                        </header>

                        {tasks.length ? (
                            <ul className="cp-tasks">
                                {tasks.map((task) => (
                                    <li
                                        className={`cp-task${isTaskComplete(task) ? " is-complete" : ""}`}
                                        key={task.task_id}
                                    >
                                        <span className="cp-task-name">{task.task_name}</span>
                                        <span className="cp-task-status">
                                            {task.task_status?.status_name || "Not started"}
                                        </span>
                                        <TaskComments
                                            taskId={task.task_id}
                                            currentUserId={currentUserId}
                                            roleName={profile.role_name}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="cp-none">No tasks have been added yet.</p>
                        )}
                    </section>

                    {orderedSprints.map((sprint) => {
                        const sprintTasks = tasksOf(sprint);
                        const done = sprintTasks.filter(isTaskComplete).length;
                        const percent = toPercent(done, sprintTasks.length);
                        const finished = isSprintFinished(sprint, sprintTasks);

                        let description = `${done} of ${sprintTasks.length} tasks complete.`;
                        if (!sprintTasks.length) {
                            description = "No tasks in this sprint yet.";
                        } else if (sprint === currentSprint) {
                            description = `Current sprint progress remains at ${percent}%.`;
                        }

                        return (
                            <section
                                className={`cp-card cp-sprint${finished ? " is-finished" : ""}`}
                                key={sprint.sprint_id}
                                aria-label={sprint.sprint_name}
                            >
                                <div>
                                    <h3>{sprint.sprint_name}</h3>
                                    <p>{description}</p>
                                </div>
                                <span className="cp-pill cp-pill-large">{percent}%</span>
                            </section>
                        );
                    })}
                </div>
            </div>
        </ClientShell>
    );
}

export default ClientProject;

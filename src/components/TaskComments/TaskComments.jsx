import { useEffect, useState } from "react";
import { addTaskComment, fetchTaskComments } from "../../services/taskServices";
import "./TaskComments.css";

function TaskComments({ taskId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let active = true;
        fetchTaskComments(taskId)
            .then((data) => {
                if (active) setComments(data);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Could not load comments.");
            });

        return () => {
            active = false;
        };
    }, [isOpen, taskId]);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setError("");
        try {
            const comment = await addTaskComment(taskId, message);
            setComments((current) => [...current, comment]);
            setMessage("");
        } catch (saveError) {
            setError(saveError.message || "Could not add the comment.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className="task-comments">
            <button
                type="button"
                className="task-comments-toggle"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                {isOpen ? "Hide comments" : "Comments"}
            </button>
            {isOpen && (
                <section className="task-comments-content">
                    {error && <p role="alert">{error}</p>}
                    {!comments.length && !error && <p>No comments yet.</p>}
                    <ul>
                        {comments.map((comment) => {
                            const author = comment.user?.user_pref_name
                                || [comment.user?.user_first_name, comment.user?.user_last_name].filter(Boolean).join(" ")
                                || "User";
                            return (
                                <li key={comment.comment_id}>
                                    <strong>{author}</strong>
                                    <p>{comment.task_comm_message}</p>
                                    <time dateTime={comment.task_comm_created_at}>
                                        {new Date(comment.task_comm_created_at).toLocaleString()}
                                    </time>
                                </li>
                            );
                        })}
                    </ul>
                    <form onSubmit={handleSubmit}>
                        <label>
                            Add a comment
                            <textarea
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                maxLength={2000}
                                required
                            />
                        </label>
                        <button type="submit" disabled={isSaving || !message.trim()}>
                            {isSaving ? "Sending..." : "Send"}
                        </button>
                    </form>
                </section>
            )}
        </section>
    );
}

export default TaskComments;

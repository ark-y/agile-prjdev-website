import { useState } from "react";
import Icon from "../../components/Icons/Icons";

export const IDLE = { error: "", message: "", busy: false };

export function getPersonName(person) {
    return person.user_pref_name
        || `${person.user_first_name || ""} ${person.user_last_name || ""}`.trim()
        || person.user_email;
}

export function SettingsCard({ title, subtitle, className = "", onSubmit, children }) {
    const Tag = onSubmit ? "form" : "section";

    return (
        <Tag className={`set-card ${className}`.trim()} onSubmit={onSubmit}>
            <header>
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </header>
            {children}
        </Tag>
    );
}

export function Field({ id, label, children }) {
    return (
        <div className="set-field">
            <label htmlFor={id}>{label}</label>
            {children}
        </div>
    );
}

export function TextInput({ id, ...props }) {
    return <input id={id} className="set-input" {...props} />;
}

export function SelectInput({ id, children, ...props }) {
    return (
        <select id={id} className="set-input set-select" {...props}>
            {children}
        </select>
    );
}

// A password box with a show / hide eye on the right.
export function SecretInput({ id, ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="set-secret">
            <input id={id} className="set-input" type={visible ? "text" : "password"} {...props} />
            <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
            >
                <Icon name={visible ? "eyeOff" : "eye"} size={18} />
            </button>
        </div>
    );
}

export function Note({ children }) {
    return (
        <p className="set-note">
            <Icon name="info" size={18} />
            <span>{children}</span>
        </p>
    );
}

export function Feedback({ status }) {
    return (
        <>
            {status.error && <p className="set-feedback set-feedback-error" role="alert">{status.error}</p>}
            {status.message && <p className="set-feedback set-feedback-success" role="status">{status.message}</p>}
        </>
    );
}

export function CardActions({ onCancel, submitLabel, busyLabel, busy, disabled }) {
    return (
        <div className="set-actions">
            <button type="button" className="set-button set-button-light" onClick={onCancel} disabled={busy}>
                Cancel
            </button>
            <button type="submit" className="set-button set-button-dark" disabled={busy || disabled}>
                {busy ? busyLabel : submitLabel}
            </button>
        </div>
    );
}

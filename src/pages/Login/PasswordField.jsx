import { useState } from "react";

function EyeIcon({ crossed }) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            {crossed && <path d="m4 4 16 16" />}
        </svg>
    );
}

function PasswordField({
    id,
    label = "Password",
    value,
    onChange,
    autoComplete,
    placeholder = "Enter your password",
    minLength
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="login-field">
            <label htmlFor={id}>{label}</label>
            <div className="login-password">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    required
                    minLength={minLength}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
                <button
                    className="login-password-toggle"
                    type="button"
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    onClick={() => setVisible(!visible)}
                >
                    <EyeIcon crossed={visible} />
                </button>
            </div>
        </div>
    );
}

export default PasswordField;

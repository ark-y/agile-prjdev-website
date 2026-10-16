import { useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthLayout from "./AuthLayout";
import PasswordField from "./PasswordField";

// Shown when someone opens the link from a password-reset email. Supabase has
// already signed them in with a short-lived recovery session; this form just
// lets them choose the new password.
function ResetPassword({ onDone, onCancel }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Use a password with at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("The passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) {
                throw updateError;
            }

            onDone();
        } catch (updateError) {
            setError(updateError.message || "Could not change your password.");
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout>
            <form className="login-form" onSubmit={handleSubmit}>
                <p className="login-eyebrow">Your Quantix workspace</p>
                <h1>Choose a new password.</h1>
                <p className="login-lede">
                    Use at least 8 characters. You'll use it to sign in from now on.
                </p>

                <PasswordField
                    id="new-password"
                    label="New password"
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={setPassword}
                />

                <PasswordField
                    id="confirm-password"
                    label="Confirm new password"
                    placeholder="Re-enter the new password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                />

                {error && <p className="login-feedback login-feedback-error" role="alert">{error}</p>}

                <button className="login-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save new password"}
                </button>

                <p className="login-switch">
                    <button className="auth-mode-toggle" type="button" disabled={isSubmitting} onClick={onCancel}>
                        Back to sign in
                    </button>
                </p>
            </form>
        </AuthLayout>
    );
}

export default ResetPassword;

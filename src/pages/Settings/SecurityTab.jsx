import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { CardActions, Feedback, Field, IDLE, SecretInput, SettingsCard } from "./parts";

// Change password: available to every role.
function SecurityTab() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState(IDLE);

    function reset() {
        setNewPassword("");
        setConfirmPassword("");
        setStatus(IDLE);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (newPassword.length < 8) {
            setStatus({ ...IDLE, error: "Use a password with at least 8 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setStatus({ ...IDLE, error: "The passwords do not match." });
            return;
        }

        setStatus({ ...IDLE, busy: true });
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                throw error;
            }
            setNewPassword("");
            setConfirmPassword("");
            setStatus({ ...IDLE, message: "Your password has been changed." });
        } catch (updateError) {
            setStatus({ ...IDLE, error: updateError.message || "Could not change your password." });
        }
    }

    return (
        <div className="set-grid set-grid-single">
            <SettingsCard
                title="Change password"
                subtitle="Enter your new password, then enter it again to confirm."
                className="set-card-narrow"
                onSubmit={handleSubmit}
            >
                <div className="set-body">
                    <Field id="new-password" label="New password">
                        <SecretInput
                            id="new-password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            placeholder="Enter a new password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                        />
                    </Field>
                    <Field id="confirm-password" label="Confirm new password">
                        <SecretInput
                            id="confirm-password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            placeholder="Re-enter the new password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </Field>
                    <p className="set-hint">Use a strong, unique password that you don't use for other accounts.</p>
                    <Feedback status={status} />
                </div>
                <CardActions
                    onCancel={reset}
                    submitLabel="Change password"
                    busyLabel="Updating..."
                    busy={status.busy}
                />
            </SettingsCard>
        </div>
    );
}

export default SecurityTab;

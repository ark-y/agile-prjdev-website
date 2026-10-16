import { useState } from "react";
import { updateOwnName } from "../../services/serviceHelpers";
import { joinName, splitFullName } from "../../utils/names";
import { CardActions, Feedback, Field, IDLE, SettingsCard, TextInput } from "./parts";

// Developers and Clients can change their name here (and their password under Security).
function ProfileTab({ profile, onProfileUpdated }) {
    const currentName = joinName(profile);
    const [fullName, setFullName] = useState(currentName);
    const [status, setStatus] = useState(IDLE);

    function reset() {
        setFullName(currentName);
        setStatus(IDLE);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const name = splitFullName(fullName);
        if (!name) {
            setStatus({ ...IDLE, error: "Enter your first and last name." });
            return;
        }

        setStatus({ ...IDLE, busy: true });
        try {
            await updateOwnName(name);
            await onProfileUpdated();
            setStatus({ ...IDLE, message: "Your name has been updated." });
        } catch (updateError) {
            setStatus({ ...IDLE, error: updateError.message || "Could not update your name." });
        }
    }

    return (
        <div className="set-grid set-grid-single">
            <SettingsCard
                title="Your name"
                subtitle="This is the name your team sees across projects and tasks."
                className="set-card-narrow"
                onSubmit={handleSubmit}
            >
                <div className="set-body">
                    <Field id="profile-name" label="Full name">
                        <TextInput
                            id="profile-name"
                            autoComplete="name"
                            required
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                        />
                    </Field>
                    <Field id="profile-email" label="Email address">
                        <TextInput id="profile-email" value={profile.user_email || ""} disabled readOnly />
                    </Field>
                    <p className="set-hint">Your email is your sign-in and can't be changed here.</p>
                    <Feedback status={status} />
                </div>
                <CardActions
                    onCancel={reset}
                    submitLabel="Save name"
                    busyLabel="Saving..."
                    busy={status.busy}
                    disabled={!fullName.trim() || fullName.trim() === currentName}
                />
            </SettingsCard>
        </div>
    );
}

export default ProfileTab;

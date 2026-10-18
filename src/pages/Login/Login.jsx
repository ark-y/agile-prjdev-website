import { useState } from "react";
import { supabase } from "../../supabaseClient";
import AuthLayout from "./AuthLayout";
import PasswordField from "./PasswordField";

const COPY = {
    signin: {
        title: "Welcome back",
        lede: "Sign in to continue to your workspace.",
        submit: "Sign in",
        submitting: "Signing in...",
        fallbackError: "Could not sign in."
    },
    signup: {
        title: "Create your account",
        lede: "Join your team's workspace in a minute.",
        submit: "Create account",
        submitting: "Creating account...",
        fallbackError: "Could not create your account."
    },
    forgot: {
        title: "Reset your password",
        lede: "Enter your email and we'll send you a link to choose a new one.",
        submit: "Send reset link",
        submitting: "Sending...",
        fallbackError: "Could not send the reset link."
    }
};

function Login({ linkError = "" }) {
    const [mode, setMode] = useState("signin");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(linkError);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isSignUp = mode === "signup";
    const isForgot = mode === "forgot";
    const copy = COPY[mode];

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        setIsSubmitting(true);

        try {
            if (isForgot) {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                    redirectTo: window.location.origin
                });

                if (resetError) {
                    throw resetError;
                }

                // Same answer whether or not the email has an account, so this
                // form can't be used to find out who is registered.
                setMessage("If an account exists for that email, a reset link is on its way. Check your inbox.");
                return;
            }

            if (isSignUp) {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: {
                            first_name: firstName.trim(),
                            last_name: lastName.trim()
                        }
                    }
                });

                if (signUpError) {
                    throw signUpError;
                }

                setMessage(
                    data.session
                        ? "Account created. You are now signed in."
                        : "Account created. Check your email to confirm your account, then sign in."
                );
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });

            if (signInError) {
                throw signInError;
            }
        } catch (authError) {
            setError(authError.message || copy.fallbackError);
        } finally {
            setIsSubmitting(false);
        }
    }

    function switchMode(nextMode) {
        setMode(nextMode);
        setError("");
        setMessage("");
        setPassword("");
    }

    return (
        <AuthLayout>
            <form className="login-form" onSubmit={handleSubmit}>
                <span className="login-dash" aria-hidden="true" />
                <h1>{copy.title}</h1>
                <p className="login-lede">{copy.lede}</p>

                {isSignUp && (
                    <div className="login-name-row">
                        <div className="login-field">
                            <label htmlFor="first-name">First name</label>
                            <input
                                id="first-name"
                                type="text"
                                autoComplete="given-name"
                                placeholder="First name"
                                required
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                            />
                        </div>
                        <div className="login-field">
                            <label htmlFor="last-name">Last name</label>
                            <input
                                id="last-name"
                                type="text"
                                autoComplete="family-name"
                                placeholder="Last name"
                                required
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="login-field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>

                {!isForgot && (
                    <PasswordField
                        id="password"
                        value={password}
                        onChange={setPassword}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        minLength={isSignUp ? 8 : undefined}
                    />
                )}

                {error && <p className="login-feedback login-feedback-error" role="alert">{error}</p>}
                {message && <p className="login-feedback login-feedback-success" role="status">{message}</p>}

                <button className="login-submit" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? copy.submitting : copy.submit}
                </button>

                {mode === "signin" && (
                    <div className="login-forgot-row">
                        <button
                            className="auth-mode-toggle auth-mode-toggle-strong"
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => switchMode("forgot")}
                        >
                            Forgot password?
                        </button>
                    </div>
                )}

                <p className="login-switch">
                    {mode === "signin" && (
                        <>
                            New here?{" "}
                            <button className="auth-mode-toggle" type="button" disabled={isSubmitting} onClick={() => switchMode("signup")}>
                                Create an account
                            </button>
                        </>
                    )}
                    {mode === "signup" && (
                        <>
                            Already have an account?{" "}
                            <button className="auth-mode-toggle" type="button" disabled={isSubmitting} onClick={() => switchMode("signin")}>
                                Sign in
                            </button>
                        </>
                    )}
                    {isForgot && (
                        <>
                            Remembered it?{" "}
                            <button className="auth-mode-toggle" type="button" disabled={isSubmitting} onClick={() => switchMode("signin")}>
                                Back to sign in
                            </button>
                        </>
                    )}
                </p>
            </form>
        </AuthLayout>
    );
}

export default Login;

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import LoginShowcase from "./LoginShowcase";
import "./Login.css";

function EyeIcon({ crossed }) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            {crossed && <path d="m4 4 16 16" />}
        </svg>
    );
}

function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");
        setIsSubmitting(true);

        try {
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
            setError(
                authError.message
                || (isSignUp ? "Could not create your account." : "Could not sign in.")
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function toggleMode() {
        setIsSignUp(!isSignUp);
        setError("");
        setMessage("");
    }

    return (
        <main className="login-page">
            <LoginShowcase />

            <section className="login-panel">
                <form className="login-form" onSubmit={handleSubmit}>
                    <p className="login-eyebrow">Your Quantix workspace</p>
                    <h1>{isSignUp ? "Create your account." : "Welcome back."}</h1>
                    <p className="login-lede">
                        {isSignUp
                            ? "Tell us who you are and we'll get your workspace ready."
                            : "Sign in to pick up where your team left off."}
                    </p>

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
                            placeholder="you@company.com"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">Password</label>
                        <div className="login-password">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                placeholder="Enter your password"
                                required
                                minLength={isSignUp ? 8 : undefined}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                            <button
                                className="login-password-toggle"
                                type="button"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <EyeIcon crossed={showPassword} />
                            </button>
                        </div>
                    </div>

                    {error && <p className="login-feedback login-feedback-error" role="alert">{error}</p>}
                    {message && <p className="login-feedback login-feedback-success" role="status">{message}</p>}

                    <button className="login-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? (isSignUp ? "Creating account..." : "Signing in...")
                            : (isSignUp ? "Create account" : "Sign in")}
                    </button>

                    <p className="login-switch">
                        {isSignUp ? "Already have an account?" : "New here?"}
                        {" "}
                        <button
                            className="auth-mode-toggle"
                            type="button"
                            disabled={isSubmitting}
                            onClick={toggleMode}
                        >
                            {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                    </p>
                </form>

                <footer className="login-footer">
                    <span>&copy; 2026 Quantix services</span>
                    <span className="login-footer-links">
                        <span>Privacy</span>
                        <span>Need help?</span>
                    </span>
                </footer>
            </section>
        </main>
    );
}

export default Login;

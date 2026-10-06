import { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./Login.css";

function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        } catch (signInError) {
            setError(
                signInError.message
                || (isSignUp ? "Could not create your account." : "Could not sign in.")
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1>{isSignUp ? "Create account" : "Sign in"}</h1>
                {isSignUp && (
                    <>
                        <label htmlFor="first-name">First name</label>
                        <input
                            id="first-name"
                            type="text"
                            autoComplete="given-name"
                            required
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                        />
                        <label htmlFor="last-name">Last name</label>
                        <input
                            id="last-name"
                            type="text"
                            autoComplete="family-name"
                            required
                            value={lastName}
                            onChange={(event) => setLastName(event.target.value)}
                        />
                    </>
                )}
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    autoComplete={isSignUp ? "email" : "username"}
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                {error && <p role="alert">{error}</p>}
                {message && <p role="status">{message}</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? (isSignUp ? "Creating account..." : "Signing in...")
                        : (isSignUp ? "Create account" : "Sign in")}
                </button>
                <button
                    className="auth-mode-toggle"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError("");
                        setMessage("");
                    }}
                >
                    {isSignUp
                        ? "Already have an account? Sign in"
                        : "New here? Sign up"}
                </button>
            </form>
        </main>
    );
}

export default Login;
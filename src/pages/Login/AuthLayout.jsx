import LoginShowcase from "./LoginShowcase";
import "./Login.css";

// Shared shell for every signed-out screen: brand panel on the left, the form on the right.
function AuthLayout({ children }) {
    return (
        <main className="login-page">
            <LoginShowcase />

            <section className="login-panel">
                {children}

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

export default AuthLayout;

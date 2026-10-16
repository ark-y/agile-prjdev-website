import QuantixLogo from "../../components/QuantixLogo/QuantixLogo";
import "./Login.css";

// Shared shell for every signed-out screen: wordmark top left, the form in a
// centred card, and a short line of brand copy bottom left.
function AuthLayout({ children }) {
    return (
        <main className="login-page">
            <header className="login-brand">
                <QuantixLogo variant="text" />
            </header>

            <section className="login-card-wrap">{children}</section>

            <footer className="login-note">
                <p>Projects, sprints and conversations.</p>
                <p>One shared workspace.</p>
            </footer>
        </main>
    );
}

export default AuthLayout;

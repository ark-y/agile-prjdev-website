import "./QuantixLogo.css";

/*
 * "text": the plain wordmark on the signed-out pages.
 * "stacked": the navy Q tile with the name beside it, for the sidebar.
 */
function QuantixLogo({ variant = "text" }) {
    if (variant === "stacked") {
        return (
            <div className="quantix-logo quantix-logo-stacked">
                <span className="quantix-tile" aria-hidden="true">Q</span>
                <span className="quantix-stack">
                    <span className="quantix-wordmark">Quantix</span>
                    <span className="quantix-sub">Services</span>
                </span>
            </div>
        );
    }

    return (
        <div className="quantix-logo quantix-logo-text">
            <span className="quantix-wordmark">Quantix</span>
            <span className="quantix-sub">services</span>
        </div>
    );
}

export default QuantixLogo;

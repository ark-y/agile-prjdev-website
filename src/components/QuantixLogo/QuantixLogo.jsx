import "./QuantixLogo.css";

function QuantixLogo({ compact = false }) {
    return (
        <div className={`quantix-logo${compact ? " quantix-logo-compact" : ""}`}>
            <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#4F86D9" />
                <circle cx="15" cy="15" r="6.5" fill="none" stroke="#fff" strokeWidth="2.4" />
                <path d="M19.6 19.6 24 24" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <span className="quantix-wordmark">Quantix</span>
            <span className="quantix-sub">services</span>
        </div>
    );
}

export default QuantixLogo;

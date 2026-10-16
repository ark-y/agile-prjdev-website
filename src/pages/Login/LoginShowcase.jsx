export function QuantixLogo() {
    return (
        <div className="quantix-logo">
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

function LayersIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="#4F6F9A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 13 9 5 9-5" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
            <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.9.8 3 2.7 3 5.6" />
        </svg>
    );
}

function SprintPreview() {
    return (
        <div className="showcase-visual" aria-hidden="true">
            <span className="showcase-ring showcase-ring-large" />
            <span className="showcase-ring showcase-ring-small" />
            <span className="showcase-dot showcase-dot-salmon" />
            <span className="showcase-dot showcase-dot-blue" />

            <div className="showcase-card showcase-card-main">
                <div className="showcase-card-header">
                    <span className="showcase-card-icon"><LayersIcon /></span>
                    <div>
                        <p className="showcase-card-title">Website launch</p>
                        <p className="showcase-card-sub">Sprint 04 · In progress</p>
                    </div>
                </div>
                <div className="showcase-card-progress">
                    <div className="showcase-card-row">
                        <span>Sprint progress</span>
                        <strong>8 / 12 tasks</strong>
                    </div>
                    <div className="showcase-track">
                        <div className="showcase-fill" style={{ width: "66.7%" }} />
                    </div>
                </div>
                <div className="showcase-card-team">
                    <span className="showcase-avatar showcase-avatar-blue">TG</span>
                    <span className="showcase-avatar showcase-avatar-salmon">AA</span>
                    <span className="showcase-avatar showcase-avatar-light">PD</span>
                    <span className="showcase-card-note">Better, together.</span>
                </div>
            </div>

            <div className="showcase-card showcase-card-toast">
                <span className="showcase-check"><CheckIcon /></span>
                <div>
                    <p className="showcase-card-title">One step closer.</p>
                    <p className="showcase-card-sub">Design review completed</p>
                </div>
            </div>
        </div>
    );
}

function LoginShowcase() {
    return (
        <aside className="login-showcase">
            <QuantixLogo />

            <div className="showcase-body">
                <p className="login-eyebrow login-eyebrow-accent">A little clarity. A lot of momentum.</p>
                <h2>Your team, moving<br />in the same direction.</h2>
                <p className="showcase-lede">
                    Bring people, priorities and sprints together in one calm space.
                    Make room for your team&rsquo;s best work.
                </p>
                <SprintPreview />
            </div>

            <p className="showcase-footnote">
                <UsersIcon />
                Built for growing teams. Ready for what&rsquo;s next.
            </p>
        </aside>
    );
}

export default LoginShowcase;

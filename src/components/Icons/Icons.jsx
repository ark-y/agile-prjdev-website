const PATHS = {
    grid: (
        <>
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </>
    ),
    bell: (
        <>
            <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
            <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
        </>
    ),
    gear: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
        </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
        <>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
        </>
    ),
    trash: (
        <>
            <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
            <path d="M10 11v6M14 11v6" />
        </>
    ),
    arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
    signOut: (
        <>
            <path d="M9.5 4.5h-5v15h5" />
            <path d="M9 12h11m-4-4 4 4-4 4" />
        </>
    ),
    folder: <path d="M3.5 7.5a2 2 0 0 1 2-2H10l2 2.5h6.5a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" />,
    window: (
        <>
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path d="M3.5 9.5h17M7 7h.01M10 7h.01" />
        </>
    ),
    phone: (
        <>
            <rect x="7" y="3" width="10" height="18" rx="2" />
            <path d="M11 17.5h2" />
        </>
    ),
    chart: (
        <>
            <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
            <path d="M8 16v-4M12 16V8M16 16v-6" />
        </>
    ),
    sprint: (
        <>
            <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
            <path d="M20 4v4.5h-4.5" />
            <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
            <path d="M4 20v-4.5h4.5" />
        </>
    )
};

function Icon({ name, size = 16 }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {PATHS[name]}
        </svg>
    );
}

export default Icon;

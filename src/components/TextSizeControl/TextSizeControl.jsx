import { useEffect, useState } from "react";
import "./TextSizeControl.css";

/*
 * Self-contained text size control.
 * - Scales text by changing the root font size (a percentage of the browser default).
 *   Everything sized in rem scales with it; layout in px stays put.
 * - Remembers the choice in localStorage, so it persists across pages and visits.
 * - Needs no props, context or changes to App.jsx. Mounted once in main.jsx.
 */

const STORAGE_KEY = "text-size-percent";
const MIN = 80;
const MAX = 200;
const STEP = 10;
const DEFAULT = 100;

function clamp(value) {
    return Math.min(MAX, Math.max(MIN, value));
}

function readSaved() {
    try {
        const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
        return Number.isNaN(saved) ? DEFAULT : clamp(saved);
    } catch {
        return DEFAULT; // storage unavailable (private mode, blocked cookies)
    }
}

function applySize(percent) {
    document.documentElement.style.fontSize = `${percent}%`;
}

// Runs when this file is first imported, i.e. before React renders,
// so the saved size is in place on the first paint (no flash of 100% text).
applySize(readSaved());

function TextSizeControl() {
    const [percent, setPercent] = useState(readSaved);

    useEffect(() => {
        applySize(percent);
        try {
            localStorage.setItem(STORAGE_KEY, String(percent));
        } catch {
            /* ignore: the size still applies for this visit */
        }
    }, [percent]);

    const change = (next) => setPercent(clamp(next));

    return (
        <div className="tsc" role="group" aria-label="Text size">
            <button
                type="button"
                className="tsc-btn"
                onClick={() => change(percent - STEP)}
                disabled={percent <= MIN}
                aria-label="Decrease text size"
            >
                A&minus;
            </button>
            <button
                type="button"
                className="tsc-btn tsc-value"
                onClick={() => change(DEFAULT)}
                disabled={percent === DEFAULT}
                aria-label={`Text size ${percent} percent. Press to reset to 100 percent`}
            >
                {percent}%
            </button>
            <button
                type="button"
                className="tsc-btn"
                onClick={() => change(percent + STEP)}
                disabled={percent >= MAX}
                aria-label="Increase text size"
            >
                A+
            </button>
        </div>
    );
}

export default TextSizeControl;
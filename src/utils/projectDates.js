/*
 * Projects have no dates of their own: their timeline runs from the first sprint
 * start to the last sprint end. Dates are shown as day/month, like the sprints.
 */

export function formatDayMonth(date) {
    if (!date) {
        return "--/--";
    }

    const [, month, day] = date.slice(0, 10).split("-");
    return `${day}/${month}`;
}

export function projectDateRange(sprints) {
    const starts = sprints.map((sprint) => sprint.sprint_start_date).filter(Boolean).map((date) => date.slice(0, 10)).sort();
    const ends = sprints.map((sprint) => sprint.sprint_end_date).filter(Boolean).map((date) => date.slice(0, 10)).sort();

    return {
        start: starts[0] ?? null,
        end: ends[ends.length - 1] ?? null
    };
}

export function formatProjectDates({ start, end }) {
    if (!start && !end) {
        return "No dates set";
    }
    if (start && end) {
        return `${formatDayMonth(start)} – ${formatDayMonth(end)}`;
    }
    return formatDayMonth(start || end);
}

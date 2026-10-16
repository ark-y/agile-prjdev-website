import { useEffect, useMemo, useState } from "react";
import { fetchSprintDates } from "../services/projectServices";
import { formatProjectDates, projectDateRange } from "../utils/projectDates";

/*
 * Project cards show the timeline of their sprints. Returns describeDates(project),
 * which gives the text to print on a card ("–" while loading, a notice if it failed).
 */
export function useProjectDates(projects) {
    const [sprintDates, setSprintDates] = useState(null);

    useEffect(() => {
        let active = true;

        fetchSprintDates()
            .then((rows) => {
                if (active) {
                    setSprintDates(rows);
                }
            })
            .catch(() => {
                if (active) {
                    setSprintDates(undefined);
                }
            });

        return () => {
            active = false;
        };
    }, [projects]);

    const datesByProject = useMemo(() => {
        const byProject = {};
        for (const sprint of sprintDates || []) {
            (byProject[sprint.project_id] ??= []).push(sprint);
        }
        return byProject;
    }, [sprintDates]);

    return function describeDates(project) {
        if (sprintDates === undefined) {
            return "Dates unavailable";
        }
        if (sprintDates === null) {
            return "–";
        }
        return formatProjectDates(projectDateRange(datesByProject[project.project_id] || []));
    };
}

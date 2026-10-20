
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  fetchSprintDates: vi.fn(),
  formatProjectDates: vi.fn(),
  projectDateRange: vi.fn(),
}));

vi.mock("../../src/services/projectServices", () => ({
  fetchSprintDates: mocks.fetchSprintDates,
}));

vi.mock("../../src/utils/projectDates", () => ({
  formatProjectDates: mocks.formatProjectDates,
  projectDateRange: mocks.projectDateRange,
}));

import { useProjectDates } from "../../src/hooks/useProjectDates";

const projects = [
  { project_id: 1, project_name: "Project Alpha" },
  { project_id: 2, project_name: "Project Beta" },
];

const sprintDates = [
  {
    project_id: 1,
    sprint_id: 101,
    sprint_start_date: "2026-10-01",
    sprint_end_date: "2026-10-10",
  },
  {
    project_id: 1,
    sprint_id: 102,
    sprint_start_date: "2026-10-11",
    sprint_end_date: "2026-10-20",
  },
  {
    project_id: 2,
    sprint_id: 201,
    sprint_start_date: "2026-11-01",
    sprint_end_date: "2026-11-15",
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  mocks.fetchSprintDates.mockResolvedValue(sprintDates);

  mocks.projectDateRange.mockImplementation((rows) => ({
    rows,
  }));

  mocks.formatProjectDates.mockImplementation(
    (range) => `Formatted ${range.rows.length} sprint(s)`
  );
});

describe("useProjectDates loading", () => {
  it("returns a placeholder while loading", () => {
    let resolveFetch;

    mocks.fetchSprintDates.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const { result } = renderHook(() => useProjectDates(projects));

    expect(result.current(projects[0])).toBe("–");

    act(() => {
      resolveFetch(sprintDates);
    });
  });

  it("fetches sprint dates when mounted", async () => {
    renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(mocks.fetchSprintDates).toHaveBeenCalledOnce();
    });
  });

  it("returns Dates unavailable when fetching fails", async () => {
    mocks.fetchSprintDates.mockRejectedValue(
      new Error("Database unavailable")
    );

    const { result } = renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(result.current(projects[0]))
        .toBe("Dates unavailable");
    });
  });
});

describe("useProjectDates project date grouping", () => {
  it("formats dates for the first project", async () => {
    const { result } = renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(result.current(projects[0]))
        .toBe("Formatted 2 sprint(s)");
    });
  });

  it("formats dates for the second project", async () => {
    const { result } = renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(result.current(projects[1]))
        .toBe("Formatted 1 sprint(s)");
    });
  });

  it("groups sprint dates by project ID", async () => {
    const { result } = renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(result.current(projects[0]))
        .toBe("Formatted 2 sprint(s)");
    });

    expect(mocks.projectDateRange).toHaveBeenCalledWith([
      sprintDates[0],
      sprintDates[1],
    ]);
  });

  it("does not include another project's sprints", async () => {
    const { result } = renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(result.current(projects[1]))
        .toBe("Formatted 1 sprint(s)");
    });

    expect(mocks.projectDateRange).toHaveBeenCalledWith([
      sprintDates[2],
    ]);
  });

  it("handles projects without any sprints", async () => {
    const { result } = renderHook(() => useProjectDates(projects));

    const emptyProject = { project_id: 999 };

    await waitFor(() => {
      expect(result.current(emptyProject))
        .toBe("Formatted 0 sprint(s)");
    });

    expect(mocks.projectDateRange).toHaveBeenCalledWith([]);
  });

  it("handles an empty sprint date response", async () => {
    mocks.fetchSprintDates.mockResolvedValue([]);

    const { result } = renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(result.current(projects[0]))
        .toBe("Formatted 0 sprint(s)");
    });
  });

  it("handles null sprint dates", async () => {
    mocks.fetchSprintDates.mockResolvedValue(null);

    const { result } = renderHook(() => useProjectDates(projects));

    await waitFor(() => {
      expect(result.current(projects[0]))
        .toBe("–");
    });
  });
});

describe("useProjectDates updates", () => {
  it("refetches dates when projects change", async () => {
    const { rerender } = renderHook(
      ({ items }) => useProjectDates(items),
      {
        initialProps: { items: projects },
      }
    );

    await waitFor(() => {
      expect(mocks.fetchSprintDates).toHaveBeenCalledTimes(1);
    });

    const updatedProjects = [
      ...projects,
      { project_id: 3, project_name: "Project Gamma" },
    ];

    rerender({ items: updatedProjects });

    await waitFor(() => {
      expect(mocks.fetchSprintDates).toHaveBeenCalledTimes(2);
    });
  });

  it("does not refetch when the same projects reference is used", async () => {
    const { rerender } = renderHook(
      ({ items }) => useProjectDates(items),
      {
        initialProps: { items: projects },
      }
    );

    await waitFor(() => {
      expect(mocks.fetchSprintDates).toHaveBeenCalledTimes(1);
    });

    rerender({ items: projects });

    expect(mocks.fetchSprintDates).toHaveBeenCalledTimes(1);
  });

  it("ignores old requests after projects change", async () => {
    let resolveOld;
    let resolveNew;

    mocks.fetchSprintDates
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveOld = resolve;
        })
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveNew = resolve;
        })
      );

    const { result, rerender } = renderHook(
      ({ items }) => useProjectDates(items),
      {
        initialProps: { items: projects },
      }
    );

    const updatedProjects = [...projects];

    rerender({ items: updatedProjects });

    await act(async () => {
      resolveNew([sprintDates[2]]);
    });

    await waitFor(() => {
      expect(result.current(projects[1]))
        .toBe("Formatted 1 sprint(s)");
    });

    await act(async () => {
      resolveOld([sprintDates[0], sprintDates[1]]);
    });

    expect(result.current(projects[1]))
      .toBe("Formatted 1 sprint(s)");
  });

  it("does not update state after unmounting", async () => {
    let resolveFetch;

    mocks.fetchSprintDates.mockImplementation(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { unmount } = renderHook(
      () => useProjectDates(projects)
    );

    unmount();

    await act(async () => {
      resolveFetch(sprintDates);
    });

    expect(mocks.fetchSprintDates).toHaveBeenCalledOnce();
  });
});


import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "../../src/supabaseClient";
import {
  fetchAllSprints,
  fetchSprint,
  addSprint,
  modifySprint,
  deleteSprint
} from "../../src/services/sprintService";

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

function mockQuery(result) {
  const query = {};

  for (const method of [
    "select", "eq", "order", "single",
    "insert", "update", "delete"
  ]) {
    query[method] = vi.fn(() => query);
  }

  query.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);

  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Sprint fetching", () => {
  it("fetches all sprints", async () => {
    const sprints = [{ sprint_id: 1 }, { sprint_id: 2 }];
    const query = mockQuery({ data: sprints, error: null });
    supabase.from.mockReturnValue(query);

    expect(await fetchAllSprints()).toEqual(sprints);
    expect(supabase.from).toHaveBeenCalledWith("sprint");
    expect(query.order).toHaveBeenCalledWith("sprint_id");
  });

  it("filters sprints by project ID", async () => {
    const query = mockQuery({ data: [], error: null });
    supabase.from.mockReturnValue(query);

    await fetchAllSprints(5);

    expect(query.eq).toHaveBeenCalledWith("project_id", 5);
  });

  it("fetches a single sprint", async () => {
    const sprint = { sprint_id: 3, sprint_name: "Sprint 3" };
    const query = mockQuery({ data: sprint, error: null });
    supabase.from.mockReturnValue(query);

    expect(await fetchSprint(3)).toEqual(sprint);
    expect(query.eq).toHaveBeenCalledWith("sprint_id", 3);
  });

  it("throws an error when fetching fails", async () => {
    supabase.from.mockReturnValue(
      mockQuery({ data: null, error: new Error("Database error") })
    );

    await expect(fetchAllSprints()).rejects.toThrow("Database error");
    await expect(fetchSprint(1)).rejects.toThrow("Database error");
  });
});

describe("Sprint creation", () => {
  it("rejects missing project ID", async () => {
    await expect(addSprint({ name: "Sprint 1" }))
      .rejects.toThrow("A project is required");
  });

  it("rejects an empty sprint name", async () => {
    await expect(addSprint({ projectId: 1, name: "  " }))
      .rejects.toThrow("A sprint name is required");
  });

  it("rejects invalid date ranges", async () => {
    await expect(addSprint({
      projectId: 1,
      name: "Sprint 1",
      startDate: "2026-10-20",
      endDate: "2026-10-10"
    })).rejects.toThrow("Sprint end date must be");
  });

  it("creates a sprint with valid information", async () => {
    const query = mockQuery({
      data: { sprint_id: 10, sprint_name: "Sprint 1" },
      error: null
    });
    supabase.from.mockReturnValue(query);

    const result = await addSprint({
      projectId: 1,
      name: "  Sprint 1  ",
      startDate: "2026-10-20",
      endDate: "2026-10-27"
    });

    expect(result.sprint_id).toBe(10);
    expect(query.insert).toHaveBeenCalledWith({
      project_id: 1,
      sprint_name: "Sprint 1",
      sprint_start_date: "2026-10-20",
      sprint_end_date: "2026-10-27"
    });
  });

  it("allows a sprint without dates", async () => {
    const query = mockQuery({ data: {}, error: null });
    supabase.from.mockReturnValue(query);

    await addSprint({ projectId: 1, name: "Backlog Sprint" });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        sprint_start_date: null,
        sprint_end_date: null
      })
    );
  });

  it("handles database errors during creation", async () => {
    supabase.from.mockReturnValue(
      mockQuery({ data: null, error: new Error("Insert failed") })
    );

    await expect(addSprint({ projectId: 1, name: "Sprint" }))
      .rejects.toThrow("Insert failed");
  });
});

describe("Sprint modification", () => {
  it("rejects empty sprint names", async () => {
    await expect(modifySprint(1, { name: "" }))
      .rejects.toThrow("A sprint name is required");
  });

  it("rejects updates with no valid fields", async () => {
    await expect(modifySprint(1, { unknown: true }))
      .rejects.toThrow("Provide at least one sprint field");
  });

  it("updates a sprint name", async () => {
    const query = mockQuery({
      data: { sprint_id: 1, sprint_name: "Updated" },
      error: null
    });
    supabase.from.mockReturnValue(query);

    await modifySprint(1, { name: "  Updated  " });

    expect(query.update).toHaveBeenCalledWith({
      sprint_name: "Updated"
    });
  });

  it("updates the ongoing status", async () => {
    const query = mockQuery({ data: {}, error: null });
    supabase.from.mockReturnValue(query);

    await modifySprint(1, { ongoing: false });

    expect(query.update).toHaveBeenCalledWith({
      sprint_ongoing: false
    });
  });

  it("rejects invalid dates when modifying", async () => {
    const query = mockQuery({
      data: {
        sprint_id: 1,
        sprint_start_date: "2026-10-20",
        sprint_end_date: "2026-10-27"
      },
      error: null
    });
    supabase.from.mockReturnValue(query);

    await expect(modifySprint(1, {
      endDate: "2026-10-10"
    })).rejects.toThrow("Sprint end date must be");
  });

  it("handles database errors during updates", async () => {
    supabase.from.mockReturnValue(
      mockQuery({ data: null, error: new Error("Update failed") })
    );

    await expect(modifySprint(1, { name: "New name" }))
      .rejects.toThrow("Update failed");
  });
});

describe("Sprint deletion", () => {
  it("calls the correct Supabase function", async () => {
    supabase.rpc.mockResolvedValue({
      data: { success: true },
      error: null
    });

    await deleteSprint(5);

    expect(supabase.rpc).toHaveBeenCalledWith(
      "delete_sprint_to_backlog",
      { p_sprint_id: 5 }
    );
  });

  it("handles deletion errors", async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: new Error("Permission denied")
    });

    await expect(deleteSprint(5))
      .rejects.toThrow("Permission denied");
  });
});

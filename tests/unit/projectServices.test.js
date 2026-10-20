
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

import {
  fetchAllProjects,
  fetchSprintDates,
  fetchProject,
  addProject,
  renameProject,
  modifyProject,
  deleteProject,
} from "../../src/services/projectServices";

function mockQuery(result = { data: null, error: null }) {
  const q = {};

  for (const method of [
    "select",
    "order",
    "eq",
    "single",
    "update",
  ]) {
    q[method] = vi.fn(() => q);
  }

  q.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);

  return q;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Project fetching", () => {
  it("fetches all projects in newest-first order", async () => {
    const projects = [
      { project_id: 2, project_name: "Project B" },
      { project_id: 1, project_name: "Project A" },
    ];

    const q = mockQuery({ data: projects, error: null });
    mocks.from.mockReturnValue(q);

    expect(await fetchAllProjects()).toEqual(projects);

    expect(mocks.from).toHaveBeenCalledWith("project");
    expect(q.select).toHaveBeenCalledWith("*");
    expect(q.order).toHaveBeenCalledWith(
      "project_created_at",
      { ascending: false }
    );
  });

  it("returns an empty project list", async () => {
    mocks.from.mockReturnValue(
      mockQuery({ data: [], error: null })
    );

    expect(await fetchAllProjects()).toEqual([]);
  });

  it("handles errors when fetching projects", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Database unavailable"),
      })
    );

    await expect(fetchAllProjects())
      .rejects.toThrow("Database unavailable");
  });

  it("fetches sprint dates for project timelines", async () => {
    const dates = [
      {
        project_id: 1,
        sprint_start_date: "2026-10-01",
        sprint_end_date: "2026-10-15",
      },
    ];

    const q = mockQuery({ data: dates, error: null });
    mocks.from.mockReturnValue(q);

    expect(await fetchSprintDates()).toEqual(dates);

    expect(mocks.from).toHaveBeenCalledWith("sprint");
    expect(q.select).toHaveBeenCalledWith(
      "project_id, sprint_start_date, sprint_end_date"
    );
  });

  it("handles errors when fetching sprint dates", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Sprint query failed"),
      })
    );

    await expect(fetchSprintDates())
      .rejects.toThrow("Sprint query failed");
  });

  it("fetches a single project by ID", async () => {
    const project = {
      project_id: 5,
      project_name: "Quantix",
    };

    const q = mockQuery({ data: project, error: null });
    mocks.from.mockReturnValue(q);

    expect(await fetchProject(5)).toEqual(project);

    expect(q.eq).toHaveBeenCalledWith("project_id", 5);
    expect(q.single).toHaveBeenCalled();
  });

  it("handles a project that cannot be fetched", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Project not found"),
      })
    );

    await expect(fetchProject(999))
      .rejects.toThrow("Project not found");
  });
});

describe("Project creation", () => {
  it("rejects an empty project name", async () => {
    await expect(
      addProject({ name: "" })
    ).rejects.toThrow("A project name is required");

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only project names", async () => {
    await expect(
      addProject({ name: "   " })
    ).rejects.toThrow("A project name is required");
  });

  it("rejects missing project names", async () => {
    await expect(
      addProject({})
    ).rejects.toThrow("A project name is required");
  });

  it("creates a project with valid information", async () => {
    mocks.rpc.mockResolvedValue({
      data: 10,
      error: null,
    });

    const project = {
      project_id: 10,
      project_name: "New Project",
    };

    const q = mockQuery({ data: project, error: null });
    mocks.from.mockReturnValue(q);

    const result = await addProject({
      name: "  New Project  ",
      description: "  Project description  ",
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_project",
      {
        p_name: "New Project",
        p_description: "Project description",
      }
    );

    expect(q.eq).toHaveBeenCalledWith("project_id", 10);
    expect(result).toEqual(project);
  });

  it("allows projects without descriptions", async () => {
    mocks.rpc.mockResolvedValue({
      data: 11,
      error: null,
    });

    mocks.from.mockReturnValue(
      mockQuery({
        data: { project_id: 11 },
        error: null,
      })
    );

    await addProject({ name: "Project" });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "create_project",
      {
        p_name: "Project",
        p_description: null,
      }
    );
  });

  it("handles database errors during creation", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Permission denied"),
    });

    await expect(
      addProject({ name: "New Project" })
    ).rejects.toThrow("Permission denied");
  });

  it("handles failure to fetch a newly created project", async () => {
    mocks.rpc.mockResolvedValue({
      data: 12,
      error: null,
    });

    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Could not fetch project"),
      })
    );

    await expect(
      addProject({ name: "New Project" })
    ).rejects.toThrow("Could not fetch project");
  });
});

describe("Project renaming", () => {
  it("rejects an empty project name", async () => {
    await expect(
      renameProject(1, "")
    ).rejects.toThrow("A project name is required");
  });

  it("renames a project successfully", async () => {
    const q = mockQuery({
      data: {
        project_id: 1,
        project_name: "Updated Project",
      },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    const result = await renameProject(
      1,
      "  Updated Project  "
    );

    expect(q.update).toHaveBeenCalledWith({
      project_name: "Updated Project",
    });

    expect(q.eq).toHaveBeenCalledWith("project_id", 1);
    expect(result.project_name).toBe("Updated Project");
  });

  it("handles project rename errors", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Update failed"),
      })
    );

    await expect(
      renameProject(1, "New Name")
    ).rejects.toThrow("Update failed");
  });
});

describe("Project modification", () => {
  it("updates project name and description", async () => {
    const q = mockQuery({
      data: { project_id: 1 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await modifyProject(1, {
      name: "  Updated Project  ",
      description: "  Updated description  ",
    });

    expect(q.update).toHaveBeenCalledWith({
      project_name: "Updated Project",
      project_desc: "Updated description",
    });
  });

  it("updates only the description", async () => {
    const q = mockQuery({
      data: { project_id: 1 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await modifyProject(1, {
      description: "New description",
    });

    expect(q.update).toHaveBeenCalledWith({
      project_desc: "New description",
    });
  });

  it("converts empty descriptions to null", async () => {
    const q = mockQuery({
      data: { project_id: 1 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await modifyProject(1, {
      description: "   ",
    });

    expect(q.update).toHaveBeenCalledWith({
      project_desc: null,
    });
  });

  it("rejects invalid project names", async () => {
    await expect(
      modifyProject(1, { name: "   " })
    ).rejects.toThrow("A project name is required");
  });

  it("rejects updates with no valid fields", async () => {
    await expect(
      modifyProject(1, {})
    ).rejects.toThrow(
      "Provide a project name or description"
    );

    await expect(
      modifyProject(1, { unknown: true })
    ).rejects.toThrow(
      "Provide a project name or description"
    );
  });

  it("handles errors when modifying projects", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Update denied"),
      })
    );

    await expect(
      modifyProject(1, { description: "New" })
    ).rejects.toThrow("Update denied");
  });
});

describe("Project deletion", () => {
  it("deletes a project using the correct RPC", async () => {
    mocks.rpc.mockResolvedValue({
      data: true,
      error: null,
    });

    const result = await deleteProject(5);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "delete_project",
      {
        p_project_id: 5,
      }
    );

    expect(result).toBe(true);
  });

  it("handles errors when deleting projects", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Permission denied"),
    });

    await expect(
      deleteProject(5)
    ).rejects.toThrow("Permission denied");
  });
});

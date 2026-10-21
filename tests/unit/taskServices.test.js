
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
  getCurrentProfileId: vi.fn(),
}));

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    auth: { getUser: mocks.getUser },
  },
}));

vi.mock("../../src/services/serviceHelpers", () => ({
  getCurrentProfileId: mocks.getCurrentProfileId,
}));

import {
  fetchAllTasks,
  fetchTask,
  fetchTaskStatuses,
  fetchProjectTags,
  fetchTaskTagIds,
  addProjectTag,
  deleteProjectTag,
  setTaskTags,
  fetchTaskComments,
  addTaskComment,
  deleteTaskComment,
  fetchProjectMembers,
  fetchTaskAssignees,
  fetchAssigneeIdsByTask,
  addTask,
  modifyTask,
  deleteTask,
  assignTask,
  setTaskAssignees,
  unassignTask,
  volunteerForBacklogTask,
} from "../../src/services/taskServices";

function query(result = { data: [], error: null }) {
  const q = {};

  for (const method of [
    "select", "eq", "in", "order", "single",
    "insert", "update", "delete"
  ]) {
    q[method] = vi.fn(() => q);
  }

  q.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);

  return q;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getCurrentProfileId.mockResolvedValue("author-1");
  mocks.rpc.mockResolvedValue({ data: null, error: null });
});

describe("Task and metadata fetching", () => {
  it("filters tasks by project and sprint", async () => {
    const q = query({
      data: [{ task_id: 1 }],
      error: null,
    });

    mocks.from.mockReturnValue(q);

    expect(
      await fetchAllTasks({ projectId: 2, sprintId: 3 })
    ).toEqual([{ task_id: 1 }]);

    expect(q.eq).toHaveBeenCalledWith("project_id", 2);
    expect(q.eq).toHaveBeenCalledWith("sprint_id", 3);
    expect(q.order).toHaveBeenCalledWith(
      "task_created_at",
      { ascending: false }
    );
  });

  it("fetches a task by ID", async () => {
    const q = query({
      data: { task_id: 4 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    expect(await fetchTask(4)).toEqual({ task_id: 4 });
    expect(q.eq).toHaveBeenCalledWith("task_id", 4);
  });

  it("handles task fetching errors", async () => {
    mocks.from.mockReturnValue(
      query({
        data: null,
        error: new Error("Database unavailable"),
      })
    );

    await expect(fetchTask(4))
      .rejects.toThrow("Database unavailable");
  });

  it("returns empty statuses when none exist", async () => {
    mocks.from.mockReturnValue(
      query({ data: [], error: null })
    );

    expect(await fetchTaskStatuses(2)).toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("fetches project task statuses", async () => {
    const mapping = query({
      data: [{ status_id: 1 }, { status_id: 3 }],
      error: null,
    });

    const statuses = query({
      data: [{ status_id: 1 }, { status_id: 3 }],
      error: null,
    });

    mocks.from
      .mockReturnValueOnce(mapping)
      .mockReturnValueOnce(statuses);

    expect(await fetchTaskStatuses(2)).toHaveLength(2);

    expect(statuses.in).toHaveBeenCalledWith(
      "status_id",
      [1, 3]
    );
  });

  it("fetches project tags", async () => {
    const q = query({
      data: [{ tag_id: 2 }],
      error: null,
    });

    mocks.from.mockReturnValue(q);

    expect(await fetchProjectTags(5))
      .toEqual([{ tag_id: 2 }]);

    expect(q.order).toHaveBeenCalledWith("tag_name");
  });

  it("groups tag IDs by task", async () => {
    expect(await fetchTaskTagIds([])).toEqual({});

    mocks.from.mockReturnValue(
      query({
        data: [
          { task_id: 1, tag_id: 2 },
          { task_id: 1, tag_id: 3 },
          { task_id: 2, tag_id: 2 },
        ],
        error: null,
      })
    );

    expect(await fetchTaskTagIds([1, 2])).toEqual({
      "1": ["2", "3"],
      "2": ["2"],
    });
  });

  it("groups assigned users by task", async () => {
    expect(await fetchAssigneeIdsByTask()).toEqual({});

    mocks.from.mockReturnValue(
      query({
        data: [
          { task_id: 1, user_id: "a" },
          { task_id: 1, user_id: "b" },
        ],
        error: null,
      })
    );

    expect(await fetchAssigneeIdsByTask([1]))
      .toEqual({ "1": ["a", "b"] });
  });

  it("filters missing project members", async () => {
    mocks.from.mockReturnValue(
      query({
        data: [
          { user: { user_id: "a" } },
          { user: null },
        ],
        error: null,
      })
    );

    expect(await fetchProjectMembers(2))
      .toEqual([{ user_id: "a" }]);
  });

  it("fetches task assignees", async () => {
    mocks.from.mockReturnValue(
      query({
        data: [
          { user_id: "a" },
          { user_id: "b" },
        ],
        error: null,
      })
    );

    expect(await fetchTaskAssignees(9))
      .toEqual(["a", "b"]);
  });
});

describe("Task tags and comments", () => {
  it("trims tag names and descriptions", async () => {
    const q = query({
      data: { tag_id: 7 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    expect(await addProjectTag({
      projectId: 1,
      name: " Urgent ",
    })).toEqual({ tag_id: 7 });

    expect(q.insert).toHaveBeenCalledWith({
      project_id: 1,
      tag_name: "Urgent",
      tag_colour: "#3F9B76",
      tag_desc: "Urgent",
    });
  });

  it("removes duplicate task tags", async () => {
    await setTaskTags(4, ["2", 2, "3", "invalid"]);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "set_task_tags",
      {
        p_task_id: 4,
        p_tag_ids: [2, 3],
      }
    );
  });

  it("deletes a project tag", async () => {
    mocks.rpc.mockResolvedValue({
      data: true,
      error: null,
    });

    expect(await deleteProjectTag(1, "5")).toBe(true);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "delete_project_tag",
      {
        p_project_id: 1,
        p_tag_id: 5,
      }
    );
  });

  it("fetches task comments", async () => {
    const q = query({
      data: [{ comment_id: 1 }],
      error: null,
    });

    mocks.from.mockReturnValue(q);

    expect(await fetchTaskComments(4))
      .toEqual([{ comment_id: 1 }]);

    expect(q.order).toHaveBeenCalledWith(
      "task_comm_created_at"
    );
  });

  it("rejects empty comments", async () => {
    await expect(addTaskComment(1, "   "))
      .rejects.toThrow("cannot be empty");

    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("requires login before commenting", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(addTaskComment(1, "Hello"))
      .rejects.toThrow("Sign in");
  });

  it("adds a comment for the logged-in user", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });

    const q = query({
      data: { comment_id: 8 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    expect(await addTaskComment(1, " Hello "))
      .toEqual({ comment_id: 8 });

    expect(q.insert).toHaveBeenCalledWith({
      task_id: 1,
      user_id: "u1",
      task_comm_message: "Hello",
    });
  });

  it("deletes comments by ID", async () => {
    const q = query({
      data: null,
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await deleteTaskComment(8);

    expect(q.delete).toHaveBeenCalled();
    expect(q.eq).toHaveBeenCalledWith("comment_id", 8);
  });
});

describe("Task creation and assignments", () => {
  it("creates tasks with valid information", async () => {
    const q = query({
      data: { task_id: 12 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    const result = await addTask({
      projectId: 1,
      sprintId: null,
      name: " New task ",
      description: " Details ",
      priority: "medium",
      weight: "4",
      assigneeIds: ["u1", "u1", "", "u2"],
      checklists: [{ title: "QA" }],
    });

    expect(result).toEqual({ task_id: 12 });

    expect(q.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        task_name: "New task",
        task_desc: "Details",
        task_weight: 4,
        task_created_by: "author-1",
        task_checklists: [{ title: "QA" }],
      })
    );

    expect(mocks.rpc).toHaveBeenCalledWith(
      "set_task_assignees",
      {
        p_task_id: 12,
        p_user_ids: ["u1", "u2"],
      }
    );
  });

  it("rolls back creation when assignment fails", async () => {
    const q = query({
      data: { task_id: 12 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Assignment denied"),
    });

    await expect(addTask({
      projectId: 1,
      name: "Task",
      priority: "low",
      weight: 2,
    })).rejects.toThrow("Assignment denied");

    expect(q.delete).toHaveBeenCalled();
    expect(q.eq).toHaveBeenCalledWith("task_id", 12);
  });

  it("reports assignment and rollback failures", async () => {
    const inserted = query({
      data: { task_id: 12 },
      error: null,
    });

    const rollback = query({
      data: null,
      error: new Error("Rollback denied"),
    });

    mocks.from
      .mockReturnValueOnce(inserted)
      .mockReturnValueOnce(rollback);

    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Assignment denied"),
    });

    await expect(addTask({
      projectId: 1,
      name: "Task",
      priority: "low",
      weight: 2,
    })).rejects.toBeInstanceOf(AggregateError);
  });

  it("rejects updates without a task ID", async () => {
    await expect(modifyTask(null, { name: "New" }))
      .rejects.toThrow("task ID");
  });

  it("updates descriptions, checklists and sprints", async () => {
    const q = query({
      data: { task_id: 2 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await modifyTask(2, {
      description: "  ",
      checklists: [],
      sprintId: null,
    });

    expect(q.update).toHaveBeenCalledWith({
      task_desc: null,
      task_checklists: [],
      sprint_id: null,
    });
  });

  it("handles task deletion errors", async () => {
    mocks.from.mockReturnValue(
      query({
        data: null,
        error: new Error("Permission denied"),
      })
    );

    await expect(deleteTask(2))
      .rejects.toThrow("Permission denied");
  });

  it("avoids duplicate task assignees", async () => {
    mocks.from.mockReturnValue(
      query({
        data: [{ user_id: "u1" }],
        error: null,
      })
    );

    await assignTask(2, "u1");

    expect(mocks.rpc).toHaveBeenCalledWith(
      "set_task_assignees",
      {
        p_task_id: 2,
        p_user_ids: ["u1"],
      }
    );
  });

  it("filters duplicate and empty assignee IDs", async () => {
    await setTaskAssignees(2, [
      "u1", "", "u1", "u2"
    ]);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "set_task_assignees",
      {
        p_task_id: 2,
        p_user_ids: ["u1", "u2"],
      }
    );
  });

  it("unassigns a specific user", async () => {
    const q = query({
      data: null,
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await unassignTask(2, "u1");

    expect(q.eq).toHaveBeenCalledWith("task_id", 2);
    expect(q.eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("reports a missing volunteer migration", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Function missing",
      },
    });

    await expect(volunteerForBacklogTask(2))
      .rejects.toThrow("migration");
  });

  it("handles volunteer permission errors", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: "Not permitted" },
    });

    await expect(volunteerForBacklogTask(2))
      .rejects.toThrow("Not permitted");
  });
});

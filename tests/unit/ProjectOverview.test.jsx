
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  volunteerForBacklogTask: vi.fn(),
}));

vi.mock("../../src/services/taskServices", () => ({
  volunteerForBacklogTask: mocks.volunteerForBacklogTask,
}));

vi.mock("../../src/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
  }),
}));

vi.mock("../../src/components/WorkspaceShell/WorkspaceShell", () => ({
  default: ({ children }) => (
    <div data-testid="workspace-shell">{children}</div>
  ),
}));

vi.mock("../../src/components/Icons/Icons", () => ({
  default: ({ name }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

import ProjectOverview from "../../src/pages/ProjectOverview/ProjectOverview";

const profile = {
  user_id: "user-1",
  user_first_name: "Alex",
  user_last_name: "Smith",
};

const members = [
  {
    user_id: "user-1",
    user_first_name: "Alex",
    user_last_name: "Smith",
    user_email: "alex@example.com",
    role: { role_name: "Developer" },
  },
  {
    user_id: "user-2",
    user_first_name: "Sarah",
    user_last_name: "Jones",
    user_email: "sarah@example.com",
    role: { role_name: "Developer" },
  },
  {
    user_id: "client-1",
    user_first_name: "Chris",
    user_last_name: "Client",
    role: { role_name: "Client" },
  },
];

const statuses = [
  { status_id: 1, status_name: "To Do" },
  { status_id: 2, status_name: "In Progress" },
  { status_id: 3, status_name: "Done" },
];

const sprints = [
  {
    sprint_id: 10,
    sprint_name: "Sprint One",
    sprint_start_date: "2026-10-01",
    sprint_end_date: "2026-12-01",
  },
];

const tasks = [
  {
    task_id: 101,
    task_name: "Build login page",
    sprint_id: null,
    task_status_id: 1,
    task_priority: "high",
    task_weight: 3,
  },
  {
    task_id: 102,
    task_name: "Create dashboard",
    sprint_id: 10,
    task_status_id: 3,
    task_priority: "medium",
    task_weight: 5,
  },
  {
    task_id: 103,
    task_name: "Write documentation",
    sprint_id: 10,
    task_status_id: 2,
    task_priority: "low",
    task_weight: 2,
  },
];

let callbacks;

beforeEach(() => {
  vi.clearAllMocks();

  mocks.volunteerForBacklogTask.mockResolvedValue({});

  callbacks = {
    onAddTask: vi.fn(),
    onEditTask: vi.fn(),
    onAddSprint: vi.fn(),
    onUpdateSprint: vi.fn(),
    onDeleteSprint: vi.fn(),
    onMoveTaskToSprint: vi.fn(),
    onAddTag: vi.fn().mockResolvedValue({}),
    onDeleteTag: vi.fn(),
    onBack: vi.fn(),
    onOpenSettings: vi.fn(),
    onSignOut: vi.fn(),
  };
});

function renderOverview(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    profile,
    project: {
      project_id: 1,
      project_name: "Test Project",
    },
    tasks,
    sprints,
    statuses,
    members,
    projectTags: [],
    tagsByTask: {},
    assigneesByTask: {
      "101": ["user-1"],
      "102": ["user-2"],
      "103": ["user-1"],
    },
    roleName: "Admin",
    ...callbacks,
    ...overrides,
  };

  const view = render(<ProjectOverview {...props} />);

  return { user, ...view };
}

describe("ProjectOverview rendering", () => {
  it("renders the project name", () => {
    renderOverview();

    expect(
      screen.getByRole("heading", {
        name: "Test Project",
      })
    ).toBeInTheDocument();
  });

  it("renders the workspace layout", () => {
    renderOverview();

    expect(
      screen.getByTestId("workspace-shell")
    ).toBeInTheDocument();
  });

  it("renders the backlog", () => {
    renderOverview();

    expect(
      screen.getByRole("heading", {
        name: "Backlog",
      })
    ).toBeInTheDocument();
  });

  it("renders sprint columns", () => {
    renderOverview();

    expect(
      screen.getByDisplayValue("Sprint One")
    ).toBeInTheDocument();
  });

  it("renders all tasks", () => {
    renderOverview();

    expect(
      screen.getByText("Build login page")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Create dashboard")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Write documentation")
    ).toBeInTheDocument();
  });

  it("places backlog tasks in the backlog column", () => {
    const { container } = renderOverview();

    const backlog = container.querySelector(".po-lane");

    expect(
      within(backlog).getByText("Build login page")
    ).toBeInTheDocument();
  });

  it("places sprint tasks in their sprint column", () => {
    const { container } = renderOverview();

    const sprint = container.querySelectorAll(".po-lane")[1];

    expect(
      within(sprint).getByText("Create dashboard")
    ).toBeInTheDocument();
  });

  it("shows an empty backlog message", () => {
    renderOverview({
      tasks: tasks.filter((task) => task.sprint_id !== null),
    });

    expect(
      screen.getByText("Drop tasks here")
    ).toBeInTheDocument();
  });
});

describe("Project progress", () => {
  it("calculates completed task percentage", () => {
    renderOverview();

    expect(
      screen.getByRole("progressbar", {
        name: "Completed tasks",
      })
    ).toHaveAttribute("aria-valuenow", "33");
  });

  it("displays completed task count", () => {
    renderOverview();

    expect(
      screen.getByText("1 of 3 tasks complete")
    ).toBeInTheDocument();
  });

  it("shows zero progress when there are no tasks", () => {
    renderOverview({ tasks: [] });

    expect(
      screen.getByRole("progressbar")
    ).toHaveAttribute("aria-valuenow", "0");
  });

  it("recognises Completed as a finished status", () => {
    renderOverview({
      statuses: [
        { status_id: 1, status_name: "To Do" },
        { status_id: 3, status_name: "Completed" },
      ],
    });

    expect(
      screen.getByRole("progressbar")
    ).toHaveAttribute("aria-valuenow", "33");
  });
});

describe("Admin permissions", () => {
  it("shows Add task and Add sprint buttons", () => {
    renderOverview();

    expect(
      screen.getByRole("button", { name: "Add task" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Add sprint" })
    ).toBeInTheDocument();
  });

  it("calls onAddTask when clicked", async () => {
    const { user } = renderOverview();

    await user.click(
      screen.getByRole("button", { name: "Add task" })
    );

    expect(callbacks.onAddTask).toHaveBeenCalledOnce();
  });

  it("calls onAddSprint when clicked", async () => {
    const { user } = renderOverview();

    await user.click(
      screen.getByRole("button", { name: "Add sprint" })
    );

    expect(callbacks.onAddSprint).toHaveBeenCalledOnce();
  });

  it("allows admins to delete sprints", async () => {
    const { user } = renderOverview();

    await user.click(
      screen.getByRole("button", {
        name: "Delete Sprint One",
      })
    );

    expect(callbacks.onDeleteSprint).toHaveBeenCalledWith(
      sprints[0]
    );
  });

  it("allows admins to rename sprints", async () => {
    const { user } = renderOverview();

    const input = screen.getByRole("textbox", {
      name: "Sprint name",
    });

    await user.clear(input);
    await user.type(input, "Updated Sprint");
    await user.tab();

    expect(callbacks.onUpdateSprint).toHaveBeenCalledWith(
      10,
      { name: "Updated Sprint" }
    );
  });

  it("hides admin actions from developers", () => {
    renderOverview({ roleName: "Developer" });

    expect(
      screen.queryByRole("button", { name: "Add task" })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Add sprint" })
    ).not.toBeInTheDocument();
  });

  it("does not allow developers to delete sprints", () => {
    renderOverview({ roleName: "Developer" });

    expect(
      screen.queryByRole("button", {
        name: "Delete Sprint One",
      })
    ).not.toBeInTheDocument();
  });
});

describe("Task interactions", () => {
  it("opens a task when clicked", async () => {
    const { user } = renderOverview();

    await user.click(
      screen.getByText("Build login page")
    );

    expect(callbacks.onEditTask).toHaveBeenCalledWith(
      tasks[0]
    );
  });

  it("opens a task using the Enter key", () => {
    renderOverview();

    const card = screen
      .getByText("Build login page")
      .closest('[role="button"]');

    fireEvent.keyDown(card, { key: "Enter" });

    expect(callbacks.onEditTask).toHaveBeenCalledWith(
      tasks[0]
    );
  });

  it("marks completed tasks with a CSS class", () => {
    renderOverview();

    const card = screen
      .getByText("Create dashboard")
      .closest(".po-task");

    expect(card).toHaveClass("po-task-complete");
  });

  it("marks other developers' tasks differently", () => {
    renderOverview({ roleName: "Developer" });

    const card = screen
      .getByText("Create dashboard")
      .closest(".po-task");

    expect(card).toHaveClass("po-task-others");
  });

  it("makes admin task cards draggable", () => {
    renderOverview();

    const card = screen
      .getByText("Build login page")
      .closest(".po-task");

    expect(card).toHaveAttribute("draggable", "true");
  });

  it("prevents developers from dragging tasks", () => {
    renderOverview({ roleName: "Developer" });

    const card = screen
      .getByText("Build login page")
      .closest(".po-task");

    expect(card).toHaveAttribute("draggable", "false");
  });
});

describe("Developer filtering", () => {
  it("shows the assignee filter for developers", () => {
    renderOverview({ roleName: "Developer" });

    const filter = screen.getByRole("button", {
      name: "Filter",
    });

    expect(filter).toBeInTheDocument();
    expect(filter).toHaveTextContent("All tasks");
  });

  it("does not show the filter for admins", () => {
    renderOverview();

    expect(
      screen.queryByRole("button", {
        name: "Filter",
      })
    ).not.toBeInTheDocument();
  });

  it("opens the developer filter", async () => {
    const { user } = renderOverview({
      roleName: "Developer",
    });

    await user.click(
      screen.getByRole("button", { name: "Filter" })
    );

    expect(
      screen.getByRole("listbox", {
        name: "Filter tasks by assignee",
      })
    ).toBeInTheDocument();
  });

  it("filters tasks by selected developer", async () => {
    const { user } = renderOverview({
      roleName: "Developer",
    });

    await user.click(
      screen.getByRole("button", { name: "Filter" })
    );

    await user.click(
      screen.getByRole("option", {
        name: /Sarah Jones/,
      })
    );

    expect(
      screen.getByText("Create dashboard")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Build login page")
    ).not.toBeInTheDocument();
  });

  it("clears the developer filter", async () => {
    const { user } = renderOverview({
      roleName: "Developer",
    });

    // Open the dropdown.
    await user.click(
      screen.getByRole("button", { name: "Filter" })
    );

    // Select Sarah Jones.
    await user.click(
      screen.getByRole("option", {
        name: /Sarah Jones/,
      })
    );

    // Verify filtering was applied.
    expect(
      screen.queryByText("Build login page")
    ).not.toBeInTheDocument();

    // The dropdown remains open after selecting Sarah.
    // Do not click Filter again because that closes it.
    expect(
      screen.getByRole("listbox", {
        name: "Filter tasks by assignee",
      })
    ).toBeInTheDocument();

    // Clear the filter.
    await user.click(
      screen.getByRole("option", {
        name: /All tasks/,
      })
    );

    // All tasks should now be visible.
    expect(
      screen.getByText("Build login page")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Create dashboard")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Write documentation")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Filter",
      })
    ).toHaveTextContent("All tasks");
  });

  it("closes the filter with Escape", async () => {
    const { user } = renderOverview({
      roleName: "Developer",
    });

    await user.click(
      screen.getByRole("button", { name: "Filter" })
    );

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("listbox")
    ).not.toBeInTheDocument();
  });
});

describe("Project tags", () => {
  it("displays project tags for admins", () => {
    renderOverview({
      projectTags: [
        { tag_id: 1, tag_name: "Frontend" },
      ],
    });

    expect(
      screen.getByText("Frontend")
    ).toBeInTheDocument();
  });

  it("adds a new tag", async () => {
    const { user } = renderOverview();

    await user.type(
      screen.getByRole("textbox", { name: "New tag" }),
      "Backend"
    );

    await user.click(
      screen.getByRole("button", { name: "Add tag" })
    );

    await waitFor(() => {
      expect(callbacks.onAddTag)
        .toHaveBeenCalledWith("Backend");
    });
  });

  it("deletes a tag", async () => {
    const { user } = renderOverview({
      projectTags: [
        { tag_id: 1, tag_name: "Frontend" },
      ],
    });

    await user.click(
      screen.getByRole("button", {
        name: "Delete Frontend tag",
      })
    );

    expect(callbacks.onDeleteTag)
      .toHaveBeenCalledWith(1);
  });

  it("displays errors when adding tags fails", async () => {
    callbacks.onAddTag.mockRejectedValue(
      new Error("Tag already exists")
    );

    const { user } = renderOverview();

    await user.type(
      screen.getByRole("textbox", { name: "New tag" }),
      "Frontend"
    );

    await user.click(
      screen.getByRole("button", { name: "Add tag" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Tag already exists");
  });

  it("hides tag management from developers", () => {
    renderOverview({ roleName: "Developer" });

    expect(
      screen.queryByRole("region", {
        name: "Project tags",
      })
    ).not.toBeInTheDocument();
  });
});

describe("Volunteering for tasks", () => {
  it("allows developers to volunteer for unassigned backlog tasks", async () => {
    const { user } = renderOverview({
      roleName: "Developer",
      assigneesByTask: {},
    });

    await user.click(
      screen.getByRole("button", {
        name: "Volunteer for this task",
      })
    );

    await waitFor(() => {
      expect(mocks.volunteerForBacklogTask)
        .toHaveBeenCalledWith(101);
    });
  });

  it("displays an error if volunteering fails", async () => {
    mocks.volunteerForBacklogTask.mockRejectedValue(
      new Error("Volunteer request failed")
    );

    const { user } = renderOverview({
      roleName: "Developer",
      assigneesByTask: {},
    });

    await user.click(
      screen.getByRole("button", {
        name: "Volunteer for this task",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Volunteer request failed"
    );
  });
});

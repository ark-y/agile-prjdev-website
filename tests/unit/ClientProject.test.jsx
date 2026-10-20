
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  within,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

// --------------------------------------------------
// MOCK CHILD COMPONENTS
// --------------------------------------------------

vi.mock(
  "../../src/components/ClientShell/ClientShell",
  () => ({
    default: ({
      profile,
      title,
      upperTitle,
      badge,
      onBack,
      activeNav,
      onOpenOverview,
      onOpenSettings,
      onSignOut,
      children,
    }) => (
      <div data-testid="client-shell">
        <span data-testid="shell-profile">
          {profile.user_first_name}
        </span>

        <h1>{title}</h1>

        <span data-testid="shell-upper-title">
          {String(upperTitle)}
        </span>

        <span data-testid="shell-badge">{badge}</span>

        <span data-testid="shell-active-nav">
          {activeNav}
        </span>

        <button onClick={onBack}>Back</button>
        <button onClick={onOpenOverview}>Overview</button>
        <button onClick={onOpenSettings}>Settings</button>
        <button onClick={onSignOut}>Sign out</button>

        <main>{children}</main>
      </div>
    ),
  })
);

vi.mock(
  "../../src/components/TaskComments/TaskComments",
  () => ({
    default: ({ taskId, currentUserId, roleName }) => (
      <div
        data-testid={`task-comments-${taskId}`}
        data-user-id={currentUserId}
        data-role={roleName}
      >
        Comments for {taskId}
      </div>
    ),
  })
);

import ClientProject from "../../src/pages/ClientProject/ClientProject";

// --------------------------------------------------
// TEST DATA
// --------------------------------------------------

const profile = {
  user_id: "user-1",
  user_first_name: "Sarah",
  user_pref_name: "Sally",
  role_name: "Client",
};

const project = {
  project_id: "project-1",
  project_name: "Website Redesign",
};

function makeTask(id, name, status, sprintId = null) {
  return {
    task_id: id,
    task_name: name,
    sprint_id: sprintId,
    task_status: status
      ? { status_name: status }
      : null,
  };
}

function makeSprint(
  id,
  name,
  start = "2026-01-01",
  end = "2099-12-31"
) {
  return {
    sprint_id: id,
    sprint_name: name,
    sprint_start_date: start,
    sprint_end_date: end,
  };
}

let onBack;
let onOpenSettings;
let onSignOut;

beforeEach(() => {
  vi.clearAllMocks();

  onBack = vi.fn();
  onOpenSettings = vi.fn();
  onSignOut = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderClientProject(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    profile,
    project,
    tasks: [],
    sprints: [],
    currentUserId: "user-1",
    onBack,
    onOpenSettings,
    onSignOut,
    ...overrides,
  };

  const view = render(<ClientProject {...props} />);

  return { user, ...view };
}

function getSprint(name) {
  return screen.getByRole("region", { name });
}

function getProgress() {
  return screen.getByRole("region", {
    name: "Overall progress",
  });
}

function getTasksSection() {
  return screen.getByRole("region", {
    name: "Current tasks",
  });
}

// --------------------------------------------------
// BASIC RENDERING
// --------------------------------------------------

describe("ClientProject rendering", () => {
  it("renders the ClientShell", () => {
    renderClientProject();

    expect(
      screen.getByTestId("client-shell")
    ).toBeInTheDocument();
  });

  it("passes the project name as the page title", () => {
    renderClientProject();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Website Redesign",
      })
    ).toBeInTheDocument();
  });

  it("enables uppercase title styling", () => {
    renderClientProject();

    expect(
      screen.getByTestId("shell-upper-title")
    ).toHaveTextContent("true");
  });

  it("sets Overview as the active navigation page", () => {
    renderClientProject();

    expect(
      screen.getByTestId("shell-active-nav")
    ).toHaveTextContent("overview");
  });

  it("passes the profile to ClientShell", () => {
    renderClientProject();

    expect(
      screen.getByTestId("shell-profile")
    ).toHaveTextContent("Sarah");
  });

  it("renders the overall progress section", () => {
    renderClientProject();

    expect(getProgress()).toBeInTheDocument();
  });

  it("renders the current tasks section", () => {
    renderClientProject();

    expect(getTasksSection()).toBeInTheDocument();
  });
});

// --------------------------------------------------
// OVERALL PROGRESS
// --------------------------------------------------

describe("Overall progress", () => {
  it("shows 0% when there are no tasks", () => {
    renderClientProject();

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("0% complete");

    // Both the progress pill and donut display 0%.
    expect(
      within(getProgress()).getAllByText("0%")
    ).toHaveLength(2);

    expect(
      screen.getByLabelText("0% complete", {
        selector: "figure",
      })
    ).toBeInTheDocument();
  });

  it("shows 0% when no tasks are completed", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "To Do"),
        makeTask("2", "Task B", "In Progress"),
      ],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("0% complete");
  });

  it("shows 50% when half the tasks are completed", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "Done"),
        makeTask("2", "Task B", "In Progress"),
      ],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("50% complete");
  });

  it("shows 100% when all tasks are completed", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "Done"),
        makeTask("2", "Task B", "Complete"),
        makeTask("3", "Task C", "Completed"),
      ],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("100% complete");
  });

  it("rounds percentages to the nearest whole number", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "Done"),
        makeTask("2", "Task B", "To Do"),
        makeTask("3", "Task C", "To Do"),
      ],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("33% complete");
  });

  it("recognizes Done as completed regardless of case", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "DONE"),
        makeTask("2", "Task B", "done"),
      ],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("100% complete");
  });

  it("recognizes Complete and Completed as finished", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "COMPLETE"),
        makeTask("2", "Task B", "completed"),
      ],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("100% complete");
  });

  it("does not count missing statuses as completed", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", null),
        makeTask("2", "Task B", "Done"),
      ],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("50% complete");
  });

  it("renders the accessible progress donut", () => {
    renderClientProject({
      tasks: [makeTask("1", "Task A", "Done")],
    });

    expect(
      screen.getByLabelText("100% complete", {
        selector: "figure",
      })
    ).toBeInTheDocument();
  });

  it("renders the progress donut SVG", () => {
    const { container } = renderClientProject();

    expect(
      container.querySelector(".cp-donut svg")
    ).toBeInTheDocument();

    expect(
      container.querySelector(".cp-donut-arc")
    ).toBeInTheDocument();
  });

  it("updates progress when tasks change", () => {
    const { rerender } = renderClientProject({
      tasks: [makeTask("1", "Task A", "To Do")],
    });

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("0% complete");

    rerender(
      <ClientProject
        profile={profile}
        project={project}
        tasks={[makeTask("1", "Task A", "Done")]}
        sprints={[]}
        currentUserId="user-1"
        onBack={onBack}
        onOpenSettings={onOpenSettings}
        onSignOut={onSignOut}
      />
    );

    expect(
      screen.getByTestId("shell-badge")
    ).toHaveTextContent("100% complete");
  });
});

// --------------------------------------------------
// CURRENT TASKS
// --------------------------------------------------

describe("Current tasks", () => {
  it("shows the empty task message", () => {
    renderClientProject();

    expect(
      screen.getByText("No tasks have been added yet.")
    ).toBeInTheDocument();
  });

  it("shows 0 items when no tasks exist", () => {
    renderClientProject();

    expect(
      within(getTasksSection()).getByText("0 items")
    ).toBeInTheDocument();
  });

  it("uses singular item for one task", () => {
    renderClientProject({
      tasks: [makeTask("1", "Task A", "To Do")],
    });

    expect(
      within(getTasksSection()).getByText("1 item")
    ).toBeInTheDocument();
  });

  it("uses plural items for multiple tasks", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "To Do"),
        makeTask("2", "Task B", "Done"),
      ],
    });

    expect(
      within(getTasksSection()).getByText("2 items")
    ).toBeInTheDocument();
  });

  it("renders each task name", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Design homepage", "To Do"),
        makeTask("2", "Build dashboard", "Done"),
      ],
    });

    expect(
      screen.getByText("Design homepage")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Build dashboard")
    ).toBeInTheDocument();
  });

  it("renders each task status", () => {
    renderClientProject({
      tasks: [
        makeTask("1", "Task A", "In Progress"),
        makeTask("2", "Task B", "Done"),
      ],
    });

    expect(
      within(getTasksSection()).getByText("In Progress")
    ).toBeInTheDocument();

    expect(
      within(getTasksSection()).getByText("Done")
    ).toBeInTheDocument();
  });

  it("shows Not started when task status is missing", () => {
    renderClientProject({
      tasks: [makeTask("1", "Task A", null)],
    });

    expect(
      screen.getByText("Not started")
    ).toBeInTheDocument();
  });

  it("marks completed tasks with is-complete", () => {
    renderClientProject({
      tasks: [makeTask("1", "Task A", "Done")],
    });

    expect(
      screen.getByText("Task A").closest("li")
    ).toHaveClass("is-complete");
  });

  it("does not mark incomplete tasks as complete", () => {
    renderClientProject({
      tasks: [makeTask("1", "Task A", "In Progress")],
    });

    expect(
      screen.getByText("Task A").closest("li")
    ).not.toHaveClass("is-complete");
  });

  it("renders comments for each task", () => {
    renderClientProject({
      tasks: [
        makeTask("task-1", "Task A", "To Do"),
        makeTask("task-2", "Task B", "Done"),
      ],
    });

    expect(
      screen.getByTestId("task-comments-task-1")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("task-comments-task-2")
    ).toBeInTheDocument();
  });

  it("passes the current user ID to TaskComments", () => {
    renderClientProject({
      tasks: [makeTask("task-1", "Task A", "To Do")],
      currentUserId: "client-123",
    });

    expect(
      screen.getByTestId("task-comments-task-1")
    ).toHaveAttribute("data-user-id", "client-123");
  });

  it("passes the Client role to TaskComments", () => {
    renderClientProject({
      tasks: [makeTask("task-1", "Task A", "To Do")],
    });

    expect(
      screen.getByTestId("task-comments-task-1")
    ).toHaveAttribute("data-role", "Client");
  });
});

// --------------------------------------------------
// SPRINT RENDERING
// --------------------------------------------------

describe("Sprint rendering", () => {
  it("renders each sprint", () => {
    renderClientProject({
      sprints: [
        makeSprint(1, "Sprint 1"),
        makeSprint(2, "Sprint 2"),
      ],
    });

    expect(getSprint("Sprint 1")).toBeInTheDocument();
    expect(getSprint("Sprint 2")).toBeInTheDocument();
  });

  it("renders an empty sprint message", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
    });

    expect(
      within(getSprint("Sprint 1")).getByText(
        "No tasks in this sprint yet."
      )
    ).toBeInTheDocument();
  });

  it("shows 0% for a sprint with no tasks", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
    });

    expect(
      within(getSprint("Sprint 1")).getByText("0%")
    ).toBeInTheDocument();
  });

  it("shows sprint progress based on assigned tasks", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
        makeTask("2", "Task B", "To Do", 1),
      ],
    });

    expect(
      within(getSprint("Sprint 1")).getByText("50%")
    ).toBeInTheDocument();
  });

  it("ignores tasks belonging to other sprints", () => {
    renderClientProject({
      sprints: [
        makeSprint(1, "Sprint 1"),
        makeSprint(2, "Sprint 2"),
      ],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
        makeTask("2", "Task B", "To Do", 2),
      ],
    });

    expect(
      within(getSprint("Sprint 1")).getByText("100%")
    ).toBeInTheDocument();

    expect(
      within(getSprint("Sprint 2")).getByText("0%")
    ).toBeInTheDocument();
  });

  it("sorts sprints by start date", () => {
    const { container } = renderClientProject({
      sprints: [
        makeSprint(3, "Sprint 3", "2026-03-01"),
        makeSprint(1, "Sprint 1", "2026-01-01"),
        makeSprint(2, "Sprint 2", "2026-02-01"),
      ],
    });

    const names = [
      ...container.querySelectorAll(".cp-sprint h3"),
    ].map((element) => element.textContent);

    expect(names).toEqual([
      "Sprint 1",
      "Sprint 2",
      "Sprint 3",
    ]);
  });

  it("sorts same-date sprints by ID", () => {
    const { container } = renderClientProject({
      sprints: [
        makeSprint(3, "Sprint 3"),
        makeSprint(1, "Sprint 1"),
        makeSprint(2, "Sprint 2"),
      ],
    });

    const names = [
      ...container.querySelectorAll(".cp-sprint h3"),
    ].map((element) => element.textContent);

    expect(names).toEqual([
      "Sprint 1",
      "Sprint 2",
      "Sprint 3",
    ]);
  });

  it("does not mutate the original sprint array", () => {
    const sprints = [
      makeSprint(2, "Sprint 2"),
      makeSprint(1, "Sprint 1"),
    ];

    renderClientProject({ sprints });

    expect(sprints.map((s) => s.sprint_id)).toEqual([
      2,
      1,
    ]);
  });
});

// --------------------------------------------------
// SPRINT COMPLETION
// --------------------------------------------------

describe("Sprint completion", () => {
  it("marks a sprint finished when all its tasks are complete", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
        makeTask("2", "Task B", "Complete", 1),
      ],
    });

    expect(getSprint("Sprint 1")).toHaveClass(
      "is-finished"
    );
  });

  it("does not finish a sprint with incomplete tasks", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
        makeTask("2", "Task B", "To Do", 1),
      ],
    });

    expect(getSprint("Sprint 1")).not.toHaveClass(
      "is-finished"
    );
  });

  it("does not finish an empty sprint solely because it has no tasks", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
    });

    expect(getSprint("Sprint 1")).not.toHaveClass(
      "is-finished"
    );
  });

  it("marks a sprint finished when its end date has passed", () => {
    renderClientProject({
      sprints: [
        makeSprint(
          1,
          "Sprint 1",
          "2020-01-01",
          "2020-01-31"
        ),
      ],
      tasks: [
        makeTask("1", "Task A", "To Do", 1),
      ],
    });

    expect(getSprint("Sprint 1")).toHaveClass(
      "is-finished"
    );
  });

  it("does not mark a future sprint as finished", () => {
    renderClientProject({
      sprints: [
        makeSprint(
          1,
          "Sprint 1",
          "2099-01-01",
          "2099-12-31"
        ),
      ],
    });

    expect(getSprint("Sprint 1")).not.toHaveClass(
      "is-finished"
    );
  });

  it("handles sprints without an end date", () => {
    renderClientProject({
      sprints: [
        makeSprint(1, "Sprint 1", "2026-01-01", null),
      ],
      tasks: [
        makeTask("1", "Task A", "To Do", 1),
      ],
    });

    expect(getSprint("Sprint 1")).not.toHaveClass(
      "is-finished"
    );
  });

  it("shows completed task counts for finished sprints", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
        makeTask("2", "Task B", "Complete", 1),
      ],
    });

    expect(
      within(getSprint("Sprint 1")).getByText(
        "2 of 2 tasks complete."
      )
    ).toBeInTheDocument();
  });
});

// --------------------------------------------------
// CURRENT SPRINT SELECTION
// --------------------------------------------------

describe("Current sprint selection", () => {
  it("shows the current sprint progress message", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
        makeTask("2", "Task B", "To Do", 1),
      ],
    });

    expect(
      within(getSprint("Sprint 1")).getByText(
        "Current sprint progress remains at 50%."
      )
    ).toBeInTheDocument();
  });

  it("selects the first unfinished started sprint", () => {
    renderClientProject({
      sprints: [
        makeSprint(1, "Sprint 1", "2020-01-01", "2020-01-31"),
        makeSprint(2, "Sprint 2", "2026-01-01", "2099-12-31"),
        makeSprint(3, "Sprint 3", "2099-01-01", "2099-12-31"),
      ],
      tasks: [
        makeTask("1", "Task A", "To Do", 2),
        makeTask("2", "Task B", "To Do", 3),
      ],
    });

    expect(
      within(getSprint("Sprint 2")).getByText(
        "Current sprint progress remains at 0%."
      )
    ).toBeInTheDocument();
  });

  it("uses the earliest unfinished sprint if none have started", () => {
    renderClientProject({
      sprints: [
        makeSprint(1, "Sprint 1", "2099-01-01", "2099-01-31"),
        makeSprint(2, "Sprint 2", "2099-02-01", "2099-02-28"),
      ],
      tasks: [
        makeTask("1", "Task A", "To Do", 1),
        makeTask("2", "Task B", "To Do", 2),
      ],
    });

    expect(
      within(getSprint("Sprint 1")).getByText(
        "Current sprint progress remains at 0%."
      )
    ).toBeInTheDocument();
  });

  it("skips fully completed sprints when selecting the current sprint", () => {
    renderClientProject({
      sprints: [
        makeSprint(1, "Sprint 1"),
        makeSprint(2, "Sprint 2"),
      ],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
        makeTask("2", "Task B", "To Do", 2),
      ],
    });

    expect(
      within(getSprint("Sprint 2")).getByText(
        "Current sprint progress remains at 0%."
      )
    ).toBeInTheDocument();

    expect(
      within(getSprint("Sprint 1")).getByText(
        "1 of 1 tasks complete."
      )
    ).toBeInTheDocument();
  });

  it("treats a sprint without a start date as started", () => {
    renderClientProject({
      sprints: [
        makeSprint(1, "Sprint 1", null, "2099-12-31"),
      ],
      tasks: [
        makeTask("1", "Task A", "To Do", 1),
      ],
    });

    expect(
      within(getSprint("Sprint 1")).getByText(
        "Current sprint progress remains at 0%."
      )
    ).toBeInTheDocument();
  });

  it("shows normal progress descriptions when all sprints are finished", () => {
    renderClientProject({
      sprints: [makeSprint(1, "Sprint 1")],
      tasks: [
        makeTask("1", "Task A", "Done", 1),
      ],
    });

    expect(
      within(getSprint("Sprint 1")).getByText(
        "1 of 1 tasks complete."
      )
    ).toBeInTheDocument();
  });
});

// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

describe("ClientProject navigation", () => {
  it("calls onBack when Back is clicked", async () => {
    const { user } = renderClientProject();

    await user.click(
      screen.getByRole("button", { name: "Back" })
    );

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("calls onBack when Overview is clicked", async () => {
    const { user } = renderClientProject();

    await user.click(
      screen.getByRole("button", { name: "Overview" })
    );

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("calls onOpenSettings when Settings is clicked", async () => {
    const { user } = renderClientProject();

    await user.click(
      screen.getByRole("button", { name: "Settings" })
    );

    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("calls onSignOut when Sign out is clicked", async () => {
    const { user } = renderClientProject();

    await user.click(
      screen.getByRole("button", { name: "Sign out" })
    );

    expect(onSignOut).toHaveBeenCalledOnce();
  });
});

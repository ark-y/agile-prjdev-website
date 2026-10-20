
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTaskForm from "../../src/components/CreateTaskForm/CreateTaskForm";

// Simplify the surrounding layout so we can focus on the form.
vi.mock("../../src/components/WorkspaceShell/WorkspaceShell", () => ({
  default: ({ children, headerRight }) => (
    <div>
      <header>{headerRight}</header>
      <main>{children}</main>
    </div>
  ),
}));

vi.mock("../../src/components/Icons/Icons", () => ({
  default: () => <span aria-hidden="true" />,
}));

const currentUser = {
  user_id: "developer-1",
  user_first_name: "Test",
  user_last_name: "Developer",
  user_pref_name: "Tester",
};

const members = [
  {
    user_id: "developer-1",
    user_first_name: "Test",
    user_last_name: "Developer",
    user_pref_name: "Tester",
    user_email: "developer@example.com",
  },
  {
    user_id: "developer-2",
    user_first_name: "Second",
    user_last_name: "Developer",
    user_email: "second@example.com",
  },
];

const initialTask = {
  task_id: 10,
  task_name: "Existing task",
  task_desc: "Existing description",
  task_weight: 3,
  task_priority: "medium",
  sprint_id: 2,
  task_status_id: 1,
  assigneeIds: ["developer-1"],
  tagIds: [],
  task_checklists: [
    {
      id: "item-1",
      text: "Write tests",
      completed: false,
      addedBy: { name: "Tester" },
    },
  ],
};

const statuses = [
  { status_id: 1, status_name: "To Do" },
  { status_id: 2, status_name: "Done" },
];

let onSaveTask;
let onCancel;
let onDeleteTask;
let onAddTag;

beforeEach(() => {
  vi.restoreAllMocks();

  onSaveTask = vi.fn().mockResolvedValue(undefined);
  onCancel = vi.fn();
  onDeleteTask = vi.fn().mockResolvedValue(undefined);
  onAddTag = vi.fn().mockResolvedValue({
    tag_id: 5,
    tag_name: "Urgent",
  });
});

function renderForm(overrides = {}) {
  const user = userEvent.setup();

  render(
    <CreateTaskForm
      onSaveTask={onSaveTask}
      onCancel={onCancel}
      onDeleteTask={onDeleteTask}
      onAddTag={onAddTag}
      currentUser={currentUser}
      roleName="Admin"
      members={members}
      statuses={statuses}
      {...overrides}
    />
  );

  return user;
}

async function enterRequiredFields(user) {
  await user.type(
    screen.getByRole("textbox", { name: "Task name" }),
    "New task"
  );

  await user.selectOptions(
    screen.getByLabelText("Priority"),
    "high"
  );

  await user.selectOptions(
    screen.getByLabelText("Weight"),
    "4"
  );
}

describe("Creating tasks", () => {
  it("displays the task creation form", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Add task" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: "Task name" })
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Priority"))
      .toBeInTheDocument();

    expect(screen.getByLabelText("Weight"))
      .toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Create task" })
    ).toBeInTheDocument();
  });

  it("rejects missing required fields", async () => {
    const user = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Create task" })
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a name and choose a priority and weight."
    );

    expect(onSaveTask).not.toHaveBeenCalled();
  });

  it("rejects a task name containing only spaces", async () => {
    const user = renderForm();

    await user.type(
      screen.getByRole("textbox", { name: "Task name" }),
      "   "
    );

    await user.selectOptions(
      screen.getByLabelText("Priority"),
      "high"
    );

    await user.selectOptions(
      screen.getByLabelText("Weight"),
      "3"
    );

    await user.click(
      screen.getByRole("button", { name: "Create task" })
    );

    expect(screen.getByRole("alert"))
      .toHaveTextContent("Enter a name");

    expect(onSaveTask).not.toHaveBeenCalled();
  });

  it("creates a task with valid information", async () => {
    const user = renderForm();

    await enterRequiredFields(user);

    await user.type(
      screen.getByLabelText("Description"),
      "Task description"
    );

    await user.click(
      screen.getByRole("button", { name: "Create task" })
    );

    await waitFor(() => {
      expect(onSaveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New task",
          description: "Task description",
          weight: "4",
          priority: "high",
          deadline: null,
          sprintId: null,
          statusId: null,
          assigneeIds: [],
          tagIds: [],
          checklists: [],
        })
      );
    });
  });

  it("allows choosing a task status", async () => {
    const user = renderForm();

    await enterRequiredFields(user);

    await user.selectOptions(
      screen.getByLabelText("Status"),
      "2"
    );

    await user.click(
      screen.getByRole("button", { name: "Create task" })
    );

    await waitFor(() => {
      expect(onSaveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          statusId: 2,
        })
      );
    });
  });

  it("allows cancellation", async () => {
    const user = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Cancel" })
    );

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSaveTask).not.toHaveBeenCalled();
  });

  it("displays an error when saving fails", async () => {
    onSaveTask.mockRejectedValue(
      new Error("Permission denied")
    );

    const user = renderForm();

    await enterRequiredFields(user);

    await user.click(
      screen.getByRole("button", { name: "Create task" })
    );

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Permission denied");
  });

  it("disables buttons while saving", async () => {
    let finishSaving;

    onSaveTask.mockImplementation(
      () => new Promise((resolve) => {
        finishSaving = resolve;
      })
    );

    const user = renderForm();

    await enterRequiredFields(user);

    await user.click(
      screen.getByRole("button", { name: "Create task" })
    );

    expect(
      screen.getByRole("button", { name: "Saving..." })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeDisabled();

    finishSaving();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create task" })
      ).toBeEnabled();
    });
  });
});

describe("Editing tasks", () => {
  it("loads existing task information", () => {
    renderForm({ initialTask });

    expect(
      screen.getByRole("textbox", { name: "Task name" })
    ).toHaveValue("Existing task");

    expect(screen.getByLabelText("Description"))
      .toHaveValue("Existing description");

    expect(screen.getByLabelText("Weight"))
      .toHaveValue("3");

    expect(screen.getByLabelText("Priority"))
      .toHaveValue("medium");
  });

  it("saves changes to an existing task", async () => {
    const user = renderForm({ initialTask });

    await user.clear(
      screen.getByRole("textbox", { name: "Task name" })
    );

    await user.type(
      screen.getByRole("textbox", { name: "Task name" }),
      "Updated task"
    );

    await user.click(
      screen.getByRole("button", { name: /Save changes/ })
    );

    await waitFor(() => {
      expect(onSaveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 10,
          name: "Updated task",
          sprintId: 2,
        })
      );
    });
  });

  it("only displays Delete task for Admins", () => {
    const { unmount } = render(
      <CreateTaskForm
        initialTask={initialTask}
        roleName="Admin"
        currentUser={currentUser}
        onDeleteTask={onDeleteTask}
      />
    );

    expect(
      screen.getByRole("button", { name: "Delete task" })
    ).toBeInTheDocument();

    unmount();

    renderForm({
      initialTask,
      roleName: "Developer",
    });

    expect(
      screen.queryByRole("button", { name: "Delete task" })
    ).not.toBeInTheDocument();
  });

  it("does not delete a task if confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const user = renderForm({ initialTask });

    await user.click(
      screen.getByRole("button", { name: "Delete task" })
    );

    expect(window.confirm).toHaveBeenCalled();
    expect(onDeleteTask).not.toHaveBeenCalled();
  });

  it("deletes a task after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = renderForm({ initialTask });

    await user.click(
      screen.getByRole("button", { name: "Delete task" })
    );

    await waitFor(() => {
      expect(onDeleteTask).toHaveBeenCalledWith(initialTask);
    });
  });

  it("prevents editing in read-only mode", () => {
    renderForm({
      initialTask,
      roleName: "Developer",
      readOnly: true,
    });

    expect(
      screen.getByRole("textbox", { name: "Task name" })
    ).toHaveAttribute("readonly");

    expect(screen.getByLabelText("Priority"))
      .toBeDisabled();

    expect(screen.getByLabelText("Weight"))
      .toBeDisabled();

    expect(
      screen.queryByRole("button", { name: /Save changes/ })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Delete task" })
    ).not.toBeInTheDocument();
  });

  it("allows Developers to save editable tasks", async () => {
    const user = renderForm({
      initialTask,
      roleName: "Developer",
    });

    await user.selectOptions(
      screen.getByLabelText("Status"),
      "2"
    );

    await user.click(
      screen.getByRole("button", { name: /Save changes/ })
    );

    await waitFor(() => {
      expect(onSaveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 10,
          statusId: 2,
        })
      );
    });
  });
});

describe("Checklists and permissions", () => {
  it("allows Admins to add checklist items", async () => {
    const user = renderForm({ initialTask });

    await user.type(
      screen.getByRole("textbox", { name: "New checklist item" }),
      "Review code"
    );

    await user.click(
      screen.getByRole("button", { name: "Add checklist item" })
    );

    expect(screen.getByText("Review code"))
      .toBeInTheDocument();

    expect(screen.getAllByText("Added by Tester"))
      .toHaveLength(2);
  });

  it("allows assigned Developers to complete checklist items", async () => {
    const user = renderForm({
      initialTask,
      roleName: "Developer",
    });

    const checkbox = screen.getByRole("checkbox", {
      name: /Write tests/,
    });

    expect(checkbox).toBeEnabled();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("prevents unassigned Developers from toggling checklists", () => {
    renderForm({
      initialTask: {
        ...initialTask,
        assigneeIds: ["developer-2"],
      },
      roleName: "Developer",
    });

    expect(
      screen.getByRole("checkbox", { name: /Write tests/ })
    ).toBeDisabled();
  });

  it("allows removing a checklist item in edit mode", async () => {
    const user = renderForm({ initialTask });

    await user.click(
      screen.getByRole("button", { name: "Remove Write tests" })
    );

    expect(screen.queryByText("Write tests"))
      .not.toBeInTheDocument();
  });
});

describe("Task assignments and tags", () => {
  it("allows Admins to assign Developers", async () => {
    const user = renderForm();

    await enterRequiredFields(user);

    await user.click(
      screen.getByRole("button", { name: "Assignee" })
    );

    const group = screen.getByRole("group", {
      name: "Available developers",
    });

    await user.click(
      within(group).getByRole("checkbox", {
        name: /Tester/,
      })
    );

    await user.click(
      screen.getByRole("button", { name: "Create task" })
    );

    await waitFor(() => {
      expect(onSaveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeIds: ["developer-1"],
        })
      );
    });
  });

  it("prevents Developers from changing assignees", () => {
    renderForm({
      initialTask,
      roleName: "Developer",
    });

    expect(screen.getByLabelText("Assignee"))
      .toBeDisabled();
  });

  it("prevents Developers from editing tags", () => {
    renderForm({
      initialTask,
      roleName: "Developer",
      projectTags: [
        { tag_id: 5, tag_name: "Urgent" },
      ],
    });

    expect(
      screen.getByRole("button", { name: /tag/i })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Urgent" })
    ).toBeDisabled();
  });

  it("allows Admins to select project tags", async () => {
    const user = renderForm({
      initialTask,
      projectTags: [
        {
          tag_id: 5,
          tag_name: "Urgent",
          tag_colour: "#3F9B76",
        },
      ],
    });

    const tag = screen.getByRole("button", { name: "Urgent" });

    await user.click(tag);

    expect(tag).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: /Save changes/ })
    );

    await waitFor(() => {
      expect(onSaveTask).toHaveBeenCalledWith(
        expect.objectContaining({
          tagIds: ["5"],
        })
      );
    });
  });
});


import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

// --------------------------------------------------
// MOCKS
// --------------------------------------------------

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),

  fetchCurrentProfile: vi.fn(),

  fetchAllProjects: vi.fn(),
  fetchProject: vi.fn(),
  addProject: vi.fn(),
  deleteProject: vi.fn(),
  renameProject: vi.fn(),

  fetchAllSprints: vi.fn(),
  addSprint: vi.fn(),
  modifySprint: vi.fn(),
  deleteSprint: vi.fn(),

  fetchAllTasks: vi.fn(),
  fetchTaskStatuses: vi.fn(),
  fetchProjectMembers: vi.fn(),
  fetchProjectTags: vi.fn(),
  fetchTaskTagIds: vi.fn(),
  fetchAssigneeIdsByTask: vi.fn(),
  fetchTaskAssignees: vi.fn(),

  addTask: vi.fn(),
  modifyTask: vi.fn(),
  deleteTask: vi.fn(),
  setTaskAssignees: vi.fn(),
  setTaskTags: vi.fn(),
  updateAssignedTaskStatus: vi.fn(),

  addProjectTag: vi.fn(),
  deleteProjectTag: vi.fn(),
}));

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signOut: mocks.signOut,
    },
  },
}));

vi.mock("../../src/services/serviceHelpers", () => ({
  fetchCurrentProfile: mocks.fetchCurrentProfile,
}));

vi.mock("../../src/services/projectServices", () => ({
  fetchAllProjects: mocks.fetchAllProjects,
  fetchProject: mocks.fetchProject,
  addProject: mocks.addProject,
  deleteProject: mocks.deleteProject,
  renameProject: mocks.renameProject,
}));

vi.mock("../../src/services/sprintService", () => ({
  fetchAllSprints: mocks.fetchAllSprints,
  addSprint: mocks.addSprint,
  modifySprint: mocks.modifySprint,
  deleteSprint: mocks.deleteSprint,
}));

vi.mock("../../src/services/taskServices", () => ({
  fetchAllTasks: mocks.fetchAllTasks,
  fetchTaskStatuses: mocks.fetchTaskStatuses,
  fetchProjectMembers: mocks.fetchProjectMembers,
  fetchProjectTags: mocks.fetchProjectTags,
  fetchTaskTagIds: mocks.fetchTaskTagIds,
  fetchAssigneeIdsByTask: mocks.fetchAssigneeIdsByTask,
  fetchTaskAssignees: mocks.fetchTaskAssignees,

  addTask: mocks.addTask,
  modifyTask: mocks.modifyTask,
  deleteTask: mocks.deleteTask,
  setTaskAssignees: mocks.setTaskAssignees,
  setTaskTags: mocks.setTaskTags,
  updateAssignedTaskStatus: mocks.updateAssignedTaskStatus,

  addProjectTag: mocks.addProjectTag,
  deleteProjectTag: mocks.deleteProjectTag,
}));

// --------------------------------------------------
// MOCK CHILD COMPONENTS
// --------------------------------------------------

vi.mock("../../src/pages/Login/Login", () => ({
  default: ({ linkError }) => (
    <div data-testid="login">
      Login page
      {linkError && <p>{linkError}</p>}
    </div>
  ),
}));

vi.mock("../../src/pages/Login/ResetPassword", () => ({
  default: ({ onDone, onCancel }) => (
    <div data-testid="reset-password">
      <button onClick={onDone}>Finish recovery</button>
      <button onClick={onCancel}>Cancel recovery</button>
    </div>
  ),
}));

vi.mock("../../src/pages/ProjectsLanding/ProjectsLanding", () => ({
  default: ({
    profile,
    projects,
    onOpenProject,
    onAddProject,
    onDeleteProject,
    onOpenSettings,
    onSignOut,
  }) => (
    <div data-testid="projects-landing">
      <p>Role: {profile.role_name}</p>

      {projects.map((project) => (
        <div key={project.project_id}>
          <button onClick={() => onOpenProject(project)}>
            Open {project.project_name}
          </button>

          <button onClick={() => onDeleteProject(project)}>
            Delete {project.project_name}
          </button>
        </div>
      ))}

      <button onClick={onAddProject}>Add project</button>
      <button onClick={onOpenSettings}>Open settings</button>
      <button onClick={onSignOut}>Sign out</button>
    </div>
  ),
}));

vi.mock("../../src/pages/ClientLanding/ClientLanding", () => ({
  default: ({
    projects,
    onOpenProject,
    onOpenSettings,
    onSignOut,
  }) => (
    <div data-testid="client-landing">
      {projects.map((project) => (
        <button
          key={project.project_id}
          onClick={() => onOpenProject(project)}
        >
          Open {project.project_name}
        </button>
      ))}

      <button onClick={onOpenSettings}>Open settings</button>
      <button onClick={onSignOut}>Sign out</button>
    </div>
  ),
}));

vi.mock("../../src/pages/ClientProject/ClientProject", () => ({
  default: ({ project, onBack, onOpenSettings }) => (
    <div data-testid="client-project">
      <p>{project.project_name}</p>
      <button onClick={onBack}>Back to projects</button>
      <button onClick={onOpenSettings}>Open settings</button>
    </div>
  ),
}));

vi.mock("../../src/pages/ProjectOverview/ProjectOverview", () => ({
  default: ({
    project,
    tasks,
    roleName,
    onBack,
    onAddTask,
    onEditTask,
    onAddSprint,
    onUpdateSprint,
    onDeleteSprint,
    onMoveTaskToSprint,
    onChangeTaskStatus,
    onAddTag,
    onDeleteTag,
    onOpenSettings,
  }) => (
    <div data-testid="project-overview">
      <p>{project.project_name}</p>
      <p>Role: {roleName}</p>
      <p>Task count: {tasks.length}</p>

      <button onClick={onBack}>Back to projects</button>
      <button onClick={onAddTask}>Add task</button>

      {tasks.map((task) => (
        <button
          key={task.task_id}
          onClick={() => onEditTask(task)}
        >
          Edit {task.task_name}
        </button>
      ))}

      <button onClick={onAddSprint}>Add sprint</button>

      <button
        onClick={() =>
          onUpdateSprint("sprint-1", {
            sprint_name: "Updated Sprint",
          })
        }
      >
        Update sprint
      </button>

      <button
        onClick={() =>
          onDeleteSprint({
            sprint_id: "sprint-1",
            sprint_name: "Sprint 1",
          })
        }
      >
        Delete sprint
      </button>

      <button
        onClick={() =>
          onMoveTaskToSprint("task-1", "sprint-2")
        }
      >
        Move task
      </button>

      <button
        onClick={() => onAddTag("Urgent", "#ff0000")}
      >
        Add tag
      </button>

      <button
        onClick={() => onDeleteTag("tag-1")}
      >
        Delete tag
      </button>

      <button onClick={onOpenSettings}>Open settings</button>
    </div>
  ),
}));

vi.mock("../../src/components/CreateProjectForm/CreateProjectForm", () => ({
  default: ({ onCreate, onCancel }) => (
    <div data-testid="create-project-form">
      <button
        onClick={() =>
          onCreate({
            name: "New Project",
            description: "",
          })
        }
      >
        Submit project
      </button>

      <button onClick={onCancel}>Cancel project</button>
    </div>
  ),
}));

vi.mock("../../src/components/CreateTaskForm/CreateTaskForm", () => ({
  default: ({
    initialTask,
    readOnly,
    roleName,
    onSaveTask,
    onDeleteTask,
    onCancel,
  }) => (
    <div data-testid="task-form">
      <p>Role: {roleName}</p>
      <p>Read only: {String(readOnly)}</p>

      <button
        onClick={() =>
          onSaveTask({
            taskId: initialTask?.task_id,
            task_name: "Updated Task",
            assigneeIds: ["user-1"],
            tagIds: ["tag-1"],
          })
        }
      >
        Save task
      </button>

      {onDeleteTask && (
        <button onClick={() => onDeleteTask(initialTask)}>
          Delete task
        </button>
      )}

      <button onClick={onCancel}>Cancel task</button>
    </div>
  ),
}));

vi.mock("../../src/pages/Settings/SettingsPage", () => ({
  default: ({
    onOpenProjects,
    onSignOut,
    onCreateProject,
    onRenameProject,
    onProfileUpdated,
  }) => (
    <div data-testid="settings-page">
      <button onClick={onOpenProjects}>Leave settings</button>
      <button onClick={onSignOut}>Sign out</button>

      <button
        onClick={() =>
          onCreateProject({
            name: "Settings Project",
            description: "",
          })
        }
      >
        Create from settings
      </button>

      <button
        onClick={() =>
          onRenameProject("project-1", "Renamed Project")
        }
      >
        Rename project
      </button>

      <button onClick={onProfileUpdated}>Update profile</button>
    </div>
  ),
}));

import App from "../../src/App";

// --------------------------------------------------
// TEST DATA
// --------------------------------------------------

const session = {
  user: {
    id: "user-1",
    email: "test@example.com",
  },
};

const adminProfile = {
  user_id: "user-1",
  user_first_name: "Alex",
  role_name: "Admin",
};

const developerProfile = {
  user_id: "user-1",
  user_first_name: "Alex",
  role_name: "Developer",
};

const clientProfile = {
  user_id: "user-1",
  user_first_name: "Alex",
  role_name: "Client",
};

const projects = [
  {
    project_id: "project-1",
    project_name: "Website Redesign",
  },
];

const tasks = [
  {
    task_id: "task-1",
    task_name: "Build homepage",
    assigneeIds: ["user-1"],
  },
];

// --------------------------------------------------
// SETUP
// --------------------------------------------------

let authCallback;

beforeEach(() => {
  vi.clearAllMocks();

  window.history.replaceState(null, "", "/");

  authCallback = null;

  mocks.getSession.mockResolvedValue({
    data: { session },
    error: null,
  });

  mocks.onAuthStateChange.mockImplementation((callback) => {
    authCallback = callback;

    return {
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    };
  });

  mocks.signOut.mockResolvedValue({ error: null });

  mocks.fetchCurrentProfile.mockResolvedValue(adminProfile);
  mocks.fetchAllProjects.mockResolvedValue(projects);

  mocks.fetchProject.mockResolvedValue(projects[0]);
  mocks.fetchAllSprints.mockResolvedValue([
    {
      sprint_id: "sprint-1",
      sprint_name: "Sprint 1",
    },
  ]);

  mocks.fetchAllTasks.mockResolvedValue(tasks);
  mocks.fetchTaskStatuses.mockResolvedValue([]);
  mocks.fetchProjectMembers.mockResolvedValue([]);
  mocks.fetchProjectTags.mockResolvedValue([]);
  mocks.fetchTaskTagIds.mockResolvedValue({});
  mocks.fetchAssigneeIdsByTask.mockResolvedValue({});
  mocks.fetchTaskAssignees.mockResolvedValue(["user-1"]);

  mocks.addProject.mockResolvedValue({
    project_id: "project-new",
    project_name: "New Project",
  });

  mocks.deleteProject.mockResolvedValue(undefined);

  mocks.renameProject.mockResolvedValue({
    project_id: "project-1",
    project_name: "Renamed Project",
  });

  mocks.addSprint.mockResolvedValue({
    sprint_id: "sprint-2",
    sprint_name: "Sprint 2",
  });

  mocks.modifySprint.mockResolvedValue({
    sprint_id: "sprint-1",
    sprint_name: "Updated Sprint",
  });

  mocks.deleteSprint.mockResolvedValue(undefined);

  mocks.addTask.mockResolvedValue({
    task_id: "task-new",
    task_name: "Updated Task",
  });

  mocks.modifyTask.mockResolvedValue({
    task_id: "task-1",
    task_name: "Updated Task",
  });

  mocks.deleteTask.mockResolvedValue(undefined);
  mocks.setTaskAssignees.mockResolvedValue(undefined);
  mocks.setTaskTags.mockResolvedValue(undefined);

  mocks.addProjectTag.mockResolvedValue({
    tag_id: "tag-new",
    tag_name: "Urgent",
  });

  mocks.deleteProjectTag.mockResolvedValue(undefined);
  mocks.updateAssignedTaskStatus.mockResolvedValue(undefined);
});

async function renderApp(role = "Admin") {
  const user = userEvent.setup();

  const profileByRole = {
    Admin: adminProfile,
    Developer: developerProfile,
    Client: clientProfile,
  };

  mocks.fetchCurrentProfile.mockResolvedValue(
    profileByRole[role]
  );

  render(<App />);

  await waitFor(() => {
    expect(
      screen.queryByText("Checking sign-in...")
    ).not.toBeInTheDocument();
  });

  await screen.findByTestId(
    role === "Client"
      ? "client-landing"
      : "projects-landing"
  );

  return user;
}

async function openProject(user) {
  await user.click(
    screen.getByRole("button", {
      name: "Open Website Redesign",
    })
  );

  await screen.findByTestId("project-overview");
}

describe("Authentication", () => {
  it("checks the current Supabase session", async () => {
    await renderApp();

    expect(mocks.getSession).toHaveBeenCalled();
  });

  it("subscribes to authentication changes", async () => {
    await renderApp();

    expect(mocks.onAuthStateChange).toHaveBeenCalled();
  });

  it("shows Login when there is no session", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<App />);

    expect(
      await screen.findByTestId("login")
    ).toBeInTheDocument();
  });

  it("shows an error when session checking fails", async () => {
    mocks.getSession.mockRejectedValue(
      new Error("Session unavailable")
    );

    render(<App />);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Session unavailable");
  });

  it("shows a fallback error when session checking fails", async () => {
    mocks.getSession.mockRejectedValue({});

    render(<App />);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Could not check the sign-in session."
    );
  });

  it("loads the current user profile", async () => {
    await renderApp();

    expect(mocks.fetchCurrentProfile).toHaveBeenCalled();
  });

  it("loads the user's projects", async () => {
    await renderApp();

    expect(mocks.fetchAllProjects).toHaveBeenCalled();
  });

  it("shows a profile loading error", async () => {
    mocks.fetchCurrentProfile.mockRejectedValue(
      new Error("Profile not found")
    );

    render(<App />);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Profile not found");
  });

  it("shows an error when projects cannot load", async () => {
    mocks.fetchAllProjects.mockRejectedValue(
      new Error("Projects unavailable")
    );

    render(<App />);

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Projects unavailable");
  });
});

describe("Role-based navigation", () => {
  it("renders ProjectsLanding for Admin", async () => {
    await renderApp("Admin");

    expect(
      screen.getByTestId("projects-landing")
    ).toBeInTheDocument();

    expect(screen.getByText("Role: Admin")).toBeInTheDocument();
  });

  it("renders ProjectsLanding for Developer", async () => {
    await renderApp("Developer");

    expect(
      screen.getByTestId("projects-landing")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Role: Developer")
    ).toBeInTheDocument();
  });

  it("renders ClientLanding for Client", async () => {
    await renderApp("Client");

    expect(
      screen.getByTestId("client-landing")
    ).toBeInTheDocument();
  });

  it("opens Settings", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Open settings",
      })
    );

    expect(
      screen.getByTestId("settings-page")
    ).toBeInTheDocument();
  });

  it("returns from Settings to ProjectsLanding", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Open settings",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Leave settings",
      })
    );

    expect(
      screen.getByTestId("projects-landing")
    ).toBeInTheDocument();
  });

  it("returns Clients to ClientLanding after Settings", async () => {
    const user = await renderApp("Client");

    await user.click(
      screen.getByRole("button", {
        name: "Open settings",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Leave settings",
      })
    );

    expect(
      screen.getByTestId("client-landing")
    ).toBeInTheDocument();
  });
});

describe("Project loading", () => {
  it("opens the selected project", async () => {
    const user = await renderApp();

    await openProject(user);

    expect(mocks.fetchProject).toHaveBeenCalledWith(
      "project-1"
    );
  });

  it("loads project sprints", async () => {
    const user = await renderApp();

    await openProject(user);

    expect(mocks.fetchAllSprints).toHaveBeenCalledWith(
      "project-1"
    );
  });

  it("loads project tasks", async () => {
    const user = await renderApp();

    await openProject(user);

    expect(mocks.fetchAllTasks).toHaveBeenCalledWith({
      projectId: "project-1",
    });
  });

  it("loads project task statuses", async () => {
    const user = await renderApp();

    await openProject(user);

    expect(mocks.fetchTaskStatuses).toHaveBeenCalledWith(
      "project-1"
    );
  });

  it("loads project members for Admin", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    expect(mocks.fetchProjectMembers).toHaveBeenCalledWith(
      "project-1"
    );
  });

  it("loads project members for Developer", async () => {
    const user = await renderApp("Developer");

    await openProject(user);

    expect(mocks.fetchProjectMembers).toHaveBeenCalledWith(
      "project-1"
    );
  });

  it("does not load project members for Client", async () => {
    const user = await renderApp("Client");

    await user.click(
      screen.getByRole("button", {
        name: "Open Website Redesign",
      })
    );

    await screen.findByTestId("client-project");

    expect(mocks.fetchProjectMembers).not.toHaveBeenCalled();
  });

  it("renders ClientProject when a client opens a project", async () => {
    const user = await renderApp("Client");

    await user.click(
      screen.getByRole("button", {
        name: "Open Website Redesign",
      })
    );

    expect(
      await screen.findByTestId("client-project")
    ).toBeInTheDocument();
  });

  it("returns from project overview to project list", async () => {
    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Back to projects",
      })
    );

    expect(
      screen.getByTestId("projects-landing")
    ).toBeInTheDocument();
  });

  it("shows an error when project loading fails", async () => {
    mocks.fetchProject.mockRejectedValue(
      new Error("Project unavailable")
    );

    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Open Website Redesign",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Project unavailable");
  });
});

describe("Project management", () => {
  it("opens the create project form", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Add project",
      })
    );

    expect(
      screen.getByTestId("create-project-form")
    ).toBeInTheDocument();
  });

  it("closes the create project form when cancelled", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Add project",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Cancel project",
      })
    );

    expect(
      screen.queryByTestId("create-project-form")
    ).not.toBeInTheDocument();
  });

  it("creates a project through the service", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Add project",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Submit project",
      })
    );

    await waitFor(() => {
      expect(mocks.addProject).toHaveBeenCalledWith({
        name: "New Project",
        description: "",
      });
    });
  });

  it("opens a newly created project", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Add project",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Submit project",
      })
    );

    await waitFor(() => {
      expect(mocks.fetchProject).toHaveBeenCalledWith(
        "project-new"
      );
    });
  });

  it("does not delete a project when confirmation is cancelled", async () => {
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValue(false);

    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Delete Website Redesign",
      })
    );

    expect(confirm).toHaveBeenCalledWith(
      'Delete "Website Redesign"?'
    );

    expect(mocks.deleteProject).not.toHaveBeenCalled();

    confirm.mockRestore();
  });

  it("deletes a project when confirmed", async () => {
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Delete Website Redesign",
      })
    );

    await waitFor(() => {
      expect(mocks.deleteProject).toHaveBeenCalledWith(
        "project-1"
      );
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Open Website Redesign",
        })
      ).not.toBeInTheDocument();
    });

    confirm.mockRestore();
  });

  it("renames a project from Settings", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Open settings",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Rename project",
      })
    );

    await waitFor(() => {
      expect(mocks.renameProject).toHaveBeenCalledWith(
        "project-1",
        "Renamed Project"
      );
    });
  });

  it("updates the project list after renaming", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Open settings",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Rename project",
      })
    );

    await waitFor(() => {
      expect(mocks.renameProject).toHaveBeenCalledOnce();
    });

    await user.click(
      screen.getByRole("button", {
        name: "Leave settings",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Open Renamed Project",
      })
    ).toBeInTheDocument();
  });
});

describe("Sprint management", () => {
  it("creates a new sprint", async () => {
    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Add sprint",
      })
    );

    await waitFor(() => {
      expect(mocks.addSprint).toHaveBeenCalledWith({
        projectId: "project-1",
        name: "Sprint 2",
      });
    });
  });

  it("updates an existing sprint", async () => {
    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Update sprint",
      })
    );

    await waitFor(() => {
      expect(mocks.modifySprint).toHaveBeenCalledWith(
        "sprint-1",
        { sprint_name: "Updated Sprint" }
      );
    });
  });

  it("does not delete a sprint without confirmation", async () => {
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValue(false);

    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Delete sprint",
      })
    );

    expect(mocks.deleteSprint).not.toHaveBeenCalled();

    confirm.mockRestore();
  });

  it("deletes a sprint when confirmed", async () => {
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Delete sprint",
      })
    );

    await waitFor(() => {
      expect(mocks.deleteSprint).toHaveBeenCalledWith(
        "sprint-1"
      );
    });

    confirm.mockRestore();
  });

  it("moves a task to another sprint", async () => {
    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Move task",
      })
    );

    await waitFor(() => {
      expect(mocks.modifyTask).toHaveBeenCalledWith(
        "task-1",
        { sprintId: "sprint-2" }
      );
    });
  });
});

describe("Task management and permissions", () => {
  it("opens the task creation form for Admin", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Add task",
      })
    );

    expect(
      screen.getByTestId("task-form")
    ).toBeInTheDocument();
  });

  it("allows Admin to create a task", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Add task",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save task",
      })
    );

    await waitFor(() => {
      expect(mocks.addTask).toHaveBeenCalled();
    });
  });

  it("does not show the creation form for Developer", async () => {
    const user = await renderApp("Developer");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Add task",
      })
    );

    expect(
      screen.queryByTestId("task-form")
    ).not.toBeInTheDocument();
  });

  it("opens an existing task for editing", async () => {
    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    expect(
      await screen.findByTestId("task-form")
    ).toBeInTheDocument();

    expect(mocks.fetchTaskAssignees).toHaveBeenCalledWith(
      "task-1"
    );
  });

  it("allows Admin to edit existing tasks", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    await screen.findByTestId("task-form");

    await user.click(
      screen.getByRole("button", {
        name: "Save task",
      })
    );

    await waitFor(() => {
      expect(mocks.modifyTask).toHaveBeenCalledWith(
        "task-1",
        expect.objectContaining({
          task_name: "Updated Task",
        })
      );
    });
  });

  it("allows Developer to edit assigned tasks", async () => {
    const user = await renderApp("Developer");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    expect(
      await screen.findByText("Read only: false")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Save task",
      })
    );

    await waitFor(() => {
      expect(mocks.modifyTask).toHaveBeenCalled();
    });
  });

  it("makes unassigned tasks read-only for Developer", async () => {
    mocks.fetchTaskAssignees.mockResolvedValue([
      "another-user",
    ]);

    const user = await renderApp("Developer");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    expect(
      await screen.findByText("Read only: true")
    ).toBeInTheDocument();
  });

  it("does not show Delete task for Developer", async () => {
    const user = await renderApp("Developer");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    await screen.findByTestId("task-form");

    expect(
      screen.queryByRole("button", {
        name: "Delete task",
      })
    ).not.toBeInTheDocument();
  });

  it("shows Delete task for Admin", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    expect(
      await screen.findByRole("button", {
        name: "Delete task",
      })
    ).toBeInTheDocument();
  });

  it("deletes an existing task as Admin", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    await screen.findByTestId("task-form");

    await user.click(
      screen.getByRole("button", {
        name: "Delete task",
      })
    );

    await waitFor(() => {
      expect(mocks.deleteTask).toHaveBeenCalledWith(
        "task-1"
      );
    });
  });

  it("does not reassign tasks when Developer saves", async () => {
    const user = await renderApp("Developer");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    await screen.findByTestId("task-form");

    await user.click(
      screen.getByRole("button", {
        name: "Save task",
      })
    );

    await waitFor(() => {
      expect(mocks.modifyTask).toHaveBeenCalled();
    });

    expect(mocks.setTaskAssignees).not.toHaveBeenCalled();
    expect(mocks.setTaskTags).not.toHaveBeenCalled();
  });

  it("updates task assignees when Admin saves", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    await screen.findByTestId("task-form");

    await user.click(
      screen.getByRole("button", {
        name: "Save task",
      })
    );

    await waitFor(() => {
      expect(mocks.setTaskAssignees).toHaveBeenCalledWith(
        "task-1",
        ["user-1"]
      );
    });
  });

  it("updates task tags when Admin saves", async () => {
    const user = await renderApp("Admin");

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Edit Build homepage",
      })
    );

    await screen.findByTestId("task-form");

    await user.click(
      screen.getByRole("button", {
        name: "Save task",
      })
    );

    await waitFor(() => {
      expect(mocks.setTaskTags).toHaveBeenCalledWith(
        "task-1",
        ["tag-1"]
      );
    });
  });
});

describe("Project tags", () => {
  it("creates a project tag", async () => {
    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Add tag",
      })
    );

    await waitFor(() => {
      expect(mocks.addProjectTag).toHaveBeenCalledWith({
        projectId: "project-1",
        name: "Urgent",
        colour: "#ff0000",
      });
    });
  });

  it("deletes a project tag", async () => {
    const user = await renderApp();

    await openProject(user);

    await user.click(
      screen.getByRole("button", {
        name: "Delete tag",
      })
    );

    await waitFor(() => {
      expect(mocks.deleteProjectTag).toHaveBeenCalledWith(
        "project-1",
        "tag-1"
      );
    });
  });
});

describe("Settings", () => {
  it("creates a project from Settings", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Open settings",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Create from settings",
      })
    );

    await waitFor(() => {
      expect(mocks.addProject).toHaveBeenCalledWith({
        name: "Settings Project",
        description: "",
      });
    });
  });

  it("refreshes the profile after an update", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Open settings",
      })
    );

    mocks.fetchCurrentProfile.mockClear();

    await user.click(
      screen.getByRole("button", {
        name: "Update profile",
      })
    );

    await waitFor(() => {
      expect(mocks.fetchCurrentProfile).toHaveBeenCalledOnce();
    });
  });
});

describe("Sign out", () => {
  it("calls Supabase signOut", async () => {
    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledOnce();
    });
  });

  it("shows an error when sign out fails", async () => {
    mocks.signOut.mockResolvedValue({
      error: new Error("Sign out failed"),
    });

    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Sign out failed");
  });

  it("shows a fallback error for sign out failures", async () => {
    mocks.signOut.mockRejectedValue({});

    const user = await renderApp();

    await user.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Could not sign out.");
  });
});

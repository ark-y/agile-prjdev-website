
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useNotifications: vi.fn(),
  useProjectDates: vi.fn(),
}));

vi.mock("../../src/hooks/useNotifications", () => ({
  useNotifications: mocks.useNotifications,
}));

vi.mock("../../src/hooks/useProjectDates", () => ({
  useProjectDates: mocks.useProjectDates,
}));

vi.mock("../../src/components/WorkspaceShell/WorkspaceShell", () => ({
  default: ({
    profile,
    notifications,
    title,
    onOpenProjects,
    onOpenSettings,
    onSignOut,
    children,
  }) => (
    <div data-testid="workspace-shell">
      <div data-testid="dashboard-title">{title}</div>
      <div data-testid="profile-role">{profile.role_name}</div>
      <div data-testid="notification-count">
        {notifications.unreadCount}
      </div>
      <button type="button" onClick={onOpenSettings}>
        Settings
      </button>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
      {onOpenProjects && (
        <button type="button" onClick={onOpenProjects}>
          Open projects
        </button>
      )}
      {children}
    </div>
  ),
}));

vi.mock("../../src/components/Icons/Icons", () => ({
  default: ({ name, size }) => (
    <span
      data-testid={`icon-${name}`}
      data-size={size}
    />
  ),
}));

import ProjectsLanding from "../../src/pages/ProjectsLanding/ProjectsLanding";

const adminProfile = {
  user_id: "admin-1",
  user_first_name: "Alex",
  user_pref_name: "Alex",
  role_name: "Admin",
};

const developerProfile = {
  user_id: "dev-1",
  user_first_name: "Sarah",
  user_pref_name: "Sam",
  role_name: "Developer",
};

const projects = [
  {
    project_id: 1,
    project_name: "Website Redesign",
  },
  {
    project_id: 2,
    project_name: "Mobile Application",
  },
  {
    project_id: 3,
    project_name: "Database Migration",
  },
];

let callbacks;

beforeEach(() => {
  vi.clearAllMocks();

  mocks.useNotifications.mockReturnValue({
    notifications: [],
    unreadCount: 3,
  });

  mocks.useProjectDates.mockReturnValue(
    (project) => `Dates for ${project.project_name}`
  );

  callbacks = {
    onOpenProject: vi.fn(),
    onAddProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onOpenSettings: vi.fn(),
    onSignOut: vi.fn(),
  };
});

function renderLanding(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    profile: adminProfile,
    projects,
    ...callbacks,
    ...overrides,
  };

  const view = render(<ProjectsLanding {...props} />);

  return { user, ...view };
}

describe("ProjectsLanding rendering", () => {
  it("renders the workspace shell", () => {
    renderLanding();

    expect(
      screen.getByTestId("workspace-shell")
    ).toBeInTheDocument();
  });

  it("displays the Projects heading", () => {
    renderLanding();

    expect(
      screen.getByRole("heading", {
        name: "Projects",
      })
    ).toBeInTheDocument();
  });

  it("renders the projects list", () => {
    renderLanding();

    expect(
      screen.getByRole("list", {
        name: "Projects",
      })
    ).toBeInTheDocument();
  });

  it("renders all project cards", () => {
    renderLanding();

    for (const project of projects) {
      expect(
        screen.getByRole("button", {
          name: `Open ${project.project_name}`,
        })
      ).toBeInTheDocument();
    }
  });

  it("displays project names", () => {
    renderLanding();

    for (const project of projects) {
      expect(
        screen.getByText(project.project_name)
      ).toBeInTheDocument();
    }
  });

  it("displays project dates", () => {
    renderLanding();

    expect(
      screen.getByText("Dates for Website Redesign")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Dates for Mobile Application")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Dates for Database Migration")
    ).toBeInTheDocument();
  });

  it("displays the Project dates label on every card", () => {
    renderLanding();

    expect(
      screen.getAllByText("Project dates")
    ).toHaveLength(3);
  });

  it("passes the projects to useProjectDates", () => {
    renderLanding();

    expect(
      mocks.useProjectDates
    ).toHaveBeenCalledWith(projects);
  });

  it("passes notifications to the workspace shell", () => {
    renderLanding();

    expect(
      screen.getByTestId("notification-count")
    ).toHaveTextContent("3");
  });

  it("passes the profile role to the workspace shell", () => {
    renderLanding();

    expect(
      screen.getByTestId("profile-role")
    ).toHaveTextContent("Admin");
  });
});

describe("Admin dashboard", () => {
  it("displays the Admin dashboard title", () => {
    renderLanding();

    expect(
      screen.getByTestId("dashboard-title")
    ).toHaveTextContent("Admin's dashboard");
  });

  it("displays the Admin introduction", () => {
    renderLanding();

    expect(
      screen.getByText(
        /Manage active initiatives and create new workspaces/
      )
    ).toBeInTheDocument();
  });

  it("shows the Add project button", () => {
    renderLanding();

    expect(
      screen.getByRole("button", {
        name: /Add project/,
      })
    ).toBeInTheDocument();
  });

  it("calls onAddProject when clicked", async () => {
    const { user } = renderLanding();

    await user.click(
      screen.getByRole("button", {
        name: /Add project/,
      })
    );

    expect(
      callbacks.onAddProject
    ).toHaveBeenCalledOnce();
  });

  it("shows a delete button for every project", () => {
    renderLanding();

    for (const project of projects) {
      expect(
        screen.getByRole("button", {
          name: `Delete ${project.project_name}`,
        })
      ).toBeInTheDocument();
    }
  });

  it("calls onDeleteProject with the correct project", async () => {
    const { user } = renderLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Delete Mobile Application",
      })
    );

    expect(
      callbacks.onDeleteProject
    ).toHaveBeenCalledWith(projects[1]);
  });

  it("renders an Add project card when no projects exist", () => {
    renderLanding({ projects: [] });

    expect(
      screen.getByRole("button", {
        name: /Add project/,
      })
    ).toBeInTheDocument();
  });

  it("does not display the developer empty-state message", () => {
    renderLanding({ projects: [] });

    expect(
      screen.queryByText(
        "You haven't been added to any projects yet."
      )
    ).not.toBeInTheDocument();
  });
});

describe("Developer dashboard", () => {
  it("uses the preferred name in the dashboard title", () => {
    renderLanding({
      profile: developerProfile,
    });

    expect(
      screen.getByTestId("dashboard-title")
    ).toHaveTextContent("Sam's dashboard");
  });

  it("uses the first name when no preferred name exists", () => {
    renderLanding({
      profile: {
        ...developerProfile,
        user_pref_name: "",
      },
    });

    expect(
      screen.getByTestId("dashboard-title")
    ).toHaveTextContent("Sarah's dashboard");
  });

  it("uses My when neither name is available", () => {
    renderLanding({
      profile: {
        ...developerProfile,
        user_pref_name: "",
        user_first_name: "",
      },
    });

    expect(
      screen.getByTestId("dashboard-title")
    ).toHaveTextContent("My's dashboard");
  });

  it("displays the Developer introduction", () => {
    renderLanding({
      profile: developerProfile,
    });

    expect(
      screen.getByText(
        /Pick up your active initiatives/
      )
    ).toBeInTheDocument();
  });

  it("hides the Add project button", () => {
    renderLanding({
      profile: developerProfile,
    });

    expect(
      screen.queryByRole("button", {
        name: /Add project/,
      })
    ).not.toBeInTheDocument();
  });

  it("hides all delete project buttons", () => {
    renderLanding({
      profile: developerProfile,
    });

    for (const project of projects) {
      expect(
        screen.queryByRole("button", {
          name: `Delete ${project.project_name}`,
        })
      ).not.toBeInTheDocument();
    }
  });

  it("shows an empty-state message when no projects exist", () => {
    renderLanding({
      profile: developerProfile,
      projects: [],
    });

    expect(
      screen.getByText(
        "You haven't been added to any projects yet."
      )
    ).toBeInTheDocument();
  });

  it("does not show the empty-state message when projects exist", () => {
    renderLanding({
      profile: developerProfile,
    });

    expect(
      screen.queryByText(
        "You haven't been added to any projects yet."
      )
    ).not.toBeInTheDocument();
  });
});

describe("Project navigation", () => {
  it("opens the correct project when clicked", async () => {
    const { user } = renderLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Open Website Redesign",
      })
    );

    expect(
      callbacks.onOpenProject
    ).toHaveBeenCalledWith(projects[0]);
  });

  it("allows developers to open projects", async () => {
    const { user } = renderLanding({
      profile: developerProfile,
    });

    await user.click(
      screen.getByRole("button", {
        name: "Open Mobile Application",
      })
    );

    expect(
      callbacks.onOpenProject
    ).toHaveBeenCalledWith(projects[1]);
  });

  it("calls onOpenSettings when Settings is clicked", async () => {
    const { user } = renderLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Settings",
      })
    );

    expect(
      callbacks.onOpenSettings
    ).toHaveBeenCalledOnce();
  });

  it("calls onSignOut when Sign out is clicked", async () => {
    const { user } = renderLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    expect(
      callbacks.onSignOut
    ).toHaveBeenCalledOnce();
  });

  it("does not provide an Open projects callback to the shell", () => {
    renderLanding();

    expect(
      screen.queryByRole("button", {
        name: "Open projects",
      })
    ).not.toBeInTheDocument();
  });

  it("keeps project opening and deletion as separate actions", async () => {
    const { user } = renderLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Delete Website Redesign",
      })
    );

    expect(
      callbacks.onDeleteProject
    ).toHaveBeenCalledWith(projects[0]);

    expect(
      callbacks.onOpenProject
    ).not.toHaveBeenCalled();
  });
});

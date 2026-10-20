
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useProjectDates: vi.fn(),
}));

vi.mock("../../src/hooks/useProjectDates", () => ({
  useProjectDates: mocks.useProjectDates,
}));

vi.mock("../../src/components/ClientShell/ClientShell", () => ({
  default: ({
    profile,
    title,
    activeNav,
    onOpenOverview,
    onOpenSettings,
    onSignOut,
    children,
  }) => (
    <div data-testid="client-shell">
      <div data-testid="shell-title">{title}</div>
      <div data-testid="shell-active-nav">{activeNav}</div>
      <div data-testid="shell-profile">{profile.user_email}</div>

      <button
        type="button"
        onClick={onOpenSettings}
      >
        Settings
      </button>

      <button
        type="button"
        onClick={onSignOut}
      >
        Sign out
      </button>

      {onOpenOverview && (
        <button type="button" onClick={onOpenOverview}>
          Overview
        </button>
      )}

      <main>{children}</main>
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

import ClientLanding from "../../src/pages/ClientLanding/ClientLanding";

const profile = {
  user_id: "client-1",
  user_first_name: "Sarah",
  user_last_name: "Jones",
  user_email: "sarah@example.com",
  role_name: "Client",
};

const projects = [
  {
    project_id: "project-1",
    project_name: "Website Redesign",
    project_start_date: "2026-10-01",
    project_end_date: "2026-12-01",
  },
  {
    project_id: "project-2",
    project_name: "Mobile Application",
    project_start_date: "2026-11-01",
    project_end_date: "2027-01-01",
  },
  {
    project_id: "project-3",
    project_name: "Database Migration",
    project_start_date: null,
    project_end_date: null,
  },
];

let onOpenProject;
let onOpenSettings;
let onSignOut;
let describeDates;

beforeEach(() => {
  vi.clearAllMocks();

  onOpenProject = vi.fn();
  onOpenSettings = vi.fn();
  onSignOut = vi.fn();

  describeDates = vi.fn((project) => {
    if (project.project_id === "project-1") {
      return "Oct 1 – Dec 1, 2026";
    }

    if (project.project_id === "project-2") {
      return "Nov 1, 2026 – Jan 1, 2027";
    }

    return "Dates not set";
  });

  mocks.useProjectDates.mockReturnValue(describeDates);
});

function renderClientLanding(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    profile,
    projects,
    onOpenProject,
    onOpenSettings,
    onSignOut,
    ...overrides,
  };

  const view = render(<ClientLanding {...props} />);

  return { user, ...view };
}

describe("ClientLanding rendering", () => {
  it("renders the client workspace shell", () => {
    renderClientLanding();

    expect(
      screen.getByTestId("client-shell")
    ).toBeInTheDocument();
  });

  it("passes the correct title to ClientShell", () => {
    renderClientLanding();

    expect(
      screen.getByTestId("shell-title")
    ).toHaveTextContent("Client workspace");
  });

  it("sets overview as the active navigation", () => {
    renderClientLanding();

    expect(
      screen.getByTestId("shell-active-nav")
    ).toHaveTextContent("overview");
  });

  it("passes the client profile to ClientShell", () => {
    renderClientLanding();

    expect(
      screen.getByTestId("shell-profile")
    ).toHaveTextContent("sarah@example.com");
  });

  it("renders the welcome heading", () => {
    renderClientLanding();

    expect(
      screen.getByRole("heading", {
        name: "Welcome to your workspace",
      })
    ).toBeInTheDocument();
  });

  it("renders the correct introduction when projects exist", () => {
    renderClientLanding();

    expect(
      screen.getByText(
        "Pick a project to follow its progress and current sprint."
      )
    ).toBeInTheDocument();
  });

  it("renders the project grid", () => {
    renderClientLanding();

    expect(
      screen.getByRole("list", {
        name: "Your projects",
      })
    ).toBeInTheDocument();
  });

  it("renders all shared projects", () => {
    renderClientLanding();

    expect(
      screen.getByRole("button", {
        name: "Open Website Redesign",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Open Mobile Application",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Open Database Migration",
      })
    ).toBeInTheDocument();
  });

  it("renders one project card per project", () => {
    renderClientLanding();

    const list = screen.getByRole("list", {
      name: "Your projects",
    });

    expect(
      within(list).getAllByRole("listitem")
    ).toHaveLength(3);
  });

  it("displays the Project dates label", () => {
    renderClientLanding();

    expect(
      screen.getAllByText("Project dates")
    ).toHaveLength(3);
  });
});

describe("Project interactions", () => {
  it("opens the correct project when clicked", async () => {
    const { user } = renderClientLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Open Website Redesign",
      })
    );

    expect(onOpenProject).toHaveBeenCalledWith(projects[0]);
  });

  it("opens a different project when selected", async () => {
    const { user } = renderClientLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Open Mobile Application",
      })
    );

    expect(onOpenProject).toHaveBeenCalledWith(projects[1]);
  });

  it("only opens the clicked project", async () => {
    const { user } = renderClientLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Open Database Migration",
      })
    );

    expect(onOpenProject).toHaveBeenCalledOnce();

    expect(onOpenProject).toHaveBeenCalledWith(projects[2]);
  });

  it("passes projects to useProjectDates", () => {
    renderClientLanding();

    expect(mocks.useProjectDates).toHaveBeenCalledWith(projects);
  });

  it("calls the date formatter for every project", () => {
    renderClientLanding();

    expect(describeDates).toHaveBeenCalledTimes(3);

    for (const project of projects) {
      expect(describeDates).toHaveBeenCalledWith(project);
    }
  });

  it("displays formatted project dates", () => {
    renderClientLanding();

    expect(
      screen.getByText("Oct 1 – Dec 1, 2026")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Nov 1, 2026 – Jan 1, 2027")
    ).toBeInTheDocument();
  });

  it("displays a fallback for projects without dates", () => {
    renderClientLanding();

    expect(
      screen.getByText("Dates not set")
    ).toBeInTheDocument();
  });

  it("opens Settings when requested", async () => {
    const { user } = renderClientLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Settings",
      })
    );

    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("signs out when requested", async () => {
    const { user } = renderClientLanding();

    await user.click(
      screen.getByRole("button", {
        name: "Sign out",
      })
    );

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("does not render an Overview button when callback is undefined", () => {
    renderClientLanding();

    expect(
      screen.queryByRole("button", {
        name: "Overview",
      })
    ).not.toBeInTheDocument();
  });
});

describe("Empty project state", () => {
  it("shows the empty state when no projects exist", () => {
    renderClientLanding({ projects: [] });

    expect(
      screen.getByRole("region", {
        name: "No projects shared",
      })
    ).toBeInTheDocument();
  });

  it("shows the empty introduction", () => {
    renderClientLanding({ projects: [] });

    expect(
      screen.getByText(
        "Your shared projects will appear here."
      )
    ).toBeInTheDocument();
  });

  it("shows the no-projects message", () => {
    renderClientLanding({ projects: [] });

    expect(
      screen.getByText(
        /No project has been shared with you yet/
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Get started now!/)
    ).toBeInTheDocument();
  });

  it("explains how the client gets access", () => {
    renderClientLanding({ projects: [] });

    expect(
      screen.getByText(
        "An admin needs to share a project with your account. Contact your admin to get started."
      )
    ).toBeInTheDocument();
  });

  it("renders the Contact admin button", () => {
    renderClientLanding({ projects: [] });

    expect(
      screen.getByRole("button", {
        name: "Contact admin",
      })
    ).toBeInTheDocument();
  });

  it("renders the chat icon in the Contact admin button", () => {
    renderClientLanding({ projects: [] });

    expect(
      screen.getByTestId("icon-chat")
    ).toBeInTheDocument();
  });

  it("renders the empty-state illustration", () => {
    const { container } = renderClientLanding({
      projects: [],
    });

    expect(
      container.querySelector("svg.cl-art")
    ).toBeInTheDocument();
  });

  it("hides the project grid when no projects exist", () => {
    renderClientLanding({ projects: [] });

    expect(
      screen.queryByRole("list", {
        name: "Your projects",
      })
    ).not.toBeInTheDocument();
  });

  it("does not show the empty state when projects exist", () => {
    renderClientLanding();

    expect(
      screen.queryByRole("region", {
        name: "No projects shared",
      })
    ).not.toBeInTheDocument();
  });

  it("uses an empty array when projects prop is omitted", () => {
    renderClientLanding({ projects: undefined });

    expect(
      screen.getByRole("region", {
        name: "No projects shared",
      })
    ).toBeInTheDocument();

    expect(mocks.useProjectDates).toHaveBeenCalledWith([]);
  });

  it("does not call onOpenProject from the empty state", async () => {
    const { user } = renderClientLanding({
      projects: [],
    });

    await user.click(
      screen.getByRole("button", {
        name: "Contact admin",
      })
    );

    expect(onOpenProject).not.toHaveBeenCalled();
  });
});


import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the sidebar so we can test the shell independently.
vi.mock("../../src/components/Sidebar/Sidebar", () => ({
  default: ({
    active,
    extra,
    onOpenProjects,
    onOpenSettings,
    onSignOut,
  }) => (
    <aside data-testid="sidebar" data-active={active}>
      <button onClick={onOpenProjects}>Sidebar Projects</button>
      <button onClick={onOpenSettings}>Sidebar Settings</button>
      <button onClick={onSignOut}>Sidebar Sign Out</button>
      {extra}
    </aside>
  ),
}));

// Mock the notification bell.
vi.mock(
  "../../src/components/NotificationCenter/NotificationCenter",
  () => ({
    NotificationBell: ({ notifications }) => (
      <div data-testid="notification-bell">
        Notifications: {notifications?.unreadCount ?? 0}
      </div>
    ),
  })
);

vi.mock("../../src/components/Icons/Icons", () => ({
  default: ({ name }) => (
    <span data-testid={`icon-${name}`} aria-hidden="true" />
  ),
}));

import WorkspaceShell from "../../src/components/WorkspaceShell/WorkspaceShell";

const profile = {
  user_id: "user-1",
  user_first_name: "Azza",
  user_last_name: "AlKaabi",
  user_pref_name: "Azza",
};

let onOpenProjects;
let onOpenSettings;
let onSignOut;

beforeEach(() => {
  vi.clearAllMocks();

  onOpenProjects = vi.fn();
  onOpenSettings = vi.fn();
  onSignOut = vi.fn();
});

function renderShell(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    profile,
    notifications: {
      notifications: [],
      unreadCount: 3,
      error: "",
    },
    title: "My Projects",
    onOpenProjects,
    onOpenSettings,
    onSignOut,
    children: <div>Test page content</div>,
    ...overrides,
  };

  const view = render(<WorkspaceShell {...props} />);

  return { user, ...view };
}

describe("WorkspaceShell layout", () => {
  it("renders the main page content", () => {
    renderShell();

    expect(
      screen.getByText("Test page content")
    ).toBeInTheDocument();
  });

  it("renders the sidebar", () => {
    renderShell();

    expect(
      screen.getByTestId("sidebar")
    ).toBeInTheDocument();
  });

  it("uses projects as the default active navigation", () => {
    renderShell();

    expect(
      screen.getByTestId("sidebar")
    ).toHaveAttribute("data-active", "projects");
  });

  it("passes a custom active navigation to the sidebar", () => {
    renderShell({ activeNav: "settings" });

    expect(
      screen.getByTestId("sidebar")
    ).toHaveAttribute("data-active", "settings");
  });

  it("renders extra sidebar content", () => {
    renderShell({
      sidebarExtra: <p>Extra sidebar information</p>,
    });

    expect(
      screen.getByText("Extra sidebar information")
    ).toBeInTheDocument();
  });

  it("renders the main content inside a main element", () => {
    renderShell();

    expect(
      screen.getByRole("main")
    ).toHaveTextContent("Test page content");
  });
});

describe("Dashboard header", () => {
  it("displays the page title", () => {
    renderShell({ title: "Dashboard" });

    expect(
      screen.getByText("Dashboard")
    ).toBeInTheDocument();
  });

  it("displays the preferred name initial", () => {
    const { container } = renderShell();

    expect(
      container.querySelector(".ws-avatar")
    ).toHaveTextContent("A");
  });

  it("uses the first name if preferred name is missing", () => {
    const { container } = renderShell({
      profile: {
        user_first_name: "Sarah",
        user_pref_name: "",
      },
    });

    expect(
      container.querySelector(".ws-avatar")
    ).toHaveTextContent("S");
  });

  it("uses a question mark if the name is missing", () => {
    const { container } = renderShell({
      profile: {
        user_first_name: "",
        user_pref_name: "",
      },
    });

    expect(
      container.querySelector(".ws-avatar")
    ).toHaveTextContent("?");
  });

  it("converts initials to uppercase", () => {
    const { container } = renderShell({
      profile: {
        user_first_name: "alex",
        user_pref_name: "",
      },
    });

    expect(
      container.querySelector(".ws-avatar")
    ).toHaveTextContent("A");
  });

  it("renders the notification bell", () => {
    renderShell();

    expect(
      screen.getByTestId("notification-bell")
    ).toHaveTextContent("Notifications: 3");
  });
});

describe("Breadcrumb navigation", () => {
  const breadcrumbs = [
    { label: "Projects", icon: "arrowLeft" },
    { label: "Tasks" },
    { label: "Edit task" },
  ];

  it("renders breadcrumb navigation", () => {
    renderShell({ breadcrumb: breadcrumbs });

    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" })
    ).toBeInTheDocument();

    expect(screen.getByText("Projects"))
      .toBeInTheDocument();

    expect(screen.getByText("Tasks"))
      .toBeInTheDocument();

    expect(screen.getByText("Edit task"))
      .toBeInTheDocument();
  });

  it("marks the last breadcrumb as the current page", () => {
    renderShell({ breadcrumb: breadcrumbs });

    expect(
      screen.getByText("Edit task")
    ).toHaveAttribute("aria-current", "page");
  });

  it("renders clickable breadcrumbs when onClick is provided", async () => {
    const onProjectsClick = vi.fn();

    const { user } = renderShell({
      breadcrumb: [
        {
          label: "Projects",
          onClick: onProjectsClick,
        },
        {
          label: "Tasks",
        },
      ],
    });

    await user.click(
      screen.getByRole("button", { name: "Projects" })
    );

    expect(onProjectsClick).toHaveBeenCalledOnce();
  });

  it("does not make the current breadcrumb clickable", () => {
    renderShell({
      breadcrumb: [
        { label: "Projects", onClick: vi.fn() },
        { label: "Current page", onClick: vi.fn() },
      ],
    });

    expect(
      screen.queryByRole("button", { name: "Current page" })
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Current page")
    ).toHaveAttribute("aria-current", "page");
  });

  it("renders breadcrumb icons", () => {
    renderShell({
      breadcrumb: [
        {
          label: "Projects",
          icon: "arrowLeft",
          onClick: vi.fn(),
        },
        {
          label: "Tasks",
        },
      ],
    });

    expect(
      screen.getByTestId("icon-arrowLeft")
    ).toBeInTheDocument();
  });

  it("uses the card breadcrumb style when requested", () => {
    const { container } = renderShell({
      breadcrumb: breadcrumbs,
      breadcrumbStyle: "card",
    });

    expect(
      container.querySelector(".ws-topbar")
    ).toHaveClass(
      "ws-topbar-card",
      "ws-topbar-compact"
    );
  });

  it("uses the default breadcrumb bar style", () => {
    const { container } = renderShell({
      breadcrumb: breadcrumbs,
    });

    expect(
      container.querySelector(".ws-topbar")
    ).toHaveClass("ws-topbar-crumbs");
  });

  it("displays a custom header instead of the bell", () => {
    renderShell({
      breadcrumb: breadcrumbs,
      headerRight: <button>Save changes</button>,
    });

    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId("notification-bell")
    ).not.toBeInTheDocument();
  });

  it("renders the bell when no custom header is provided", () => {
    renderShell({
      breadcrumb: breadcrumbs,
    });

    expect(
      screen.getByTestId("notification-bell")
    ).toBeInTheDocument();
  });
});

describe("Sidebar navigation actions", () => {
  it("opens projects when the sidebar button is clicked", async () => {
    const { user } = renderShell();

    await user.click(
      screen.getByRole("button", { name: "Sidebar Projects" })
    );

    expect(onOpenProjects).toHaveBeenCalledOnce();
  });

  it("opens settings when the sidebar button is clicked", async () => {
    const { user } = renderShell();

    await user.click(
      screen.getByRole("button", { name: "Sidebar Settings" })
    );

    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("signs out when the sidebar button is clicked", async () => {
    const { user } = renderShell();

    await user.click(
      screen.getByRole("button", { name: "Sidebar Sign Out" })
    );

    expect(onSignOut).toHaveBeenCalledOnce();
  });
});

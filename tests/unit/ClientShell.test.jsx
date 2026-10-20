
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  useNotifications: vi.fn(),
}));

vi.mock("../../src/hooks/useNotifications", () => ({
  useNotifications: mocks.useNotifications,
}));

vi.mock("../../src/components/Icons/Icons", () => ({
  default: ({ name, size }) => (
    <span data-testid={`icon-${name}`} data-size={size} />
  ),
}));

vi.mock("../../src/components/QuantixLogo/QuantixLogo", () => ({
  default: ({ variant }) => (
    <div data-testid="quantix-logo" data-variant={variant}>
      Quantix Logo
    </div>
  ),
}));

vi.mock(
  "../../src/components/NotificationCenter/NotificationCenter",
  () => ({
    NotificationBell: ({ notifications }) => (
      <div data-testid="notification-bell">
        <span data-testid="notification-count">
          {notifications.items?.length ?? 0}
        </span>
      </div>
    ),
  })
);

import ClientShell from "../../src/components/ClientShell/ClientShell";

const profile = {
  user_id: "client-1",
  user_first_name: "Sarah",
  user_last_name: "Jones",
  user_pref_name: "Sally",
  user_email: "sarah@example.com",
};

let onOpenOverview;
let onOpenSettings;
let onSignOut;
let onBack;

const notifications = {
  items: [
    { id: "notification-1", message: "Task updated" },
    { id: "notification-2", message: "New sprint" },
  ],
  unreadCount: 2,
};

beforeEach(() => {
  vi.clearAllMocks();

  onOpenOverview = vi.fn();
  onOpenSettings = vi.fn();
  onSignOut = vi.fn();
  onBack = vi.fn();

  mocks.useNotifications.mockReturnValue(notifications);
});

function renderClientShell(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    profile,
    title: "Client Dashboard",
    onOpenOverview,
    onOpenSettings,
    onSignOut,
    children: <div data-testid="page-content">Page content</div>,
    ...overrides,
  };

  const view = render(<ClientShell {...props} />);

  const controls = {
    sidebar: () => view.container.querySelector(".cs-sidebar"),
    header: () => view.container.querySelector(".cs-header"),
    main: () => view.container.querySelector("main.cs-content"),
    nav: () => screen.getByRole("navigation", { name: "Workspace" }),
    overview: () => screen.getByRole("button", { name: "Overview" }),
    settings: () => screen.getByRole("button", { name: "Settings" }),
    signOut: () => screen.getByRole("button", { name: "Sign out" }),
  };

  return { user, controls, ...view };
}

describe("ClientShell rendering", () => {
  it("renders the client shell container", () => {
    const { container } = renderClientShell();

    expect(
      container.querySelector(".cs-shell")
    ).toBeInTheDocument();
  });

  it("renders the sidebar", () => {
    const { controls } = renderClientShell();

    expect(controls.sidebar()).toBeInTheDocument();
  });

  it("renders the workspace navigation", () => {
    const { controls } = renderClientShell();

    expect(controls.nav()).toBeInTheDocument();
  });

  it("renders the Overview button", () => {
    const { controls } = renderClientShell();

    expect(controls.overview()).toBeInTheDocument();
  });

  it("renders the Settings button", () => {
    const { controls } = renderClientShell();

    expect(controls.settings()).toBeInTheDocument();
  });

  it("renders the Sign out button", () => {
    const { controls } = renderClientShell();

    expect(controls.signOut()).toBeInTheDocument();
  });

  it("renders exactly two navigation buttons", () => {
    const { controls } = renderClientShell();

    expect(
      within(controls.nav()).getAllByRole("button")
    ).toHaveLength(2);
  });

  it("renders the Quantix logo with the client variant", () => {
    renderClientShell();

    expect(
      screen.getByTestId("quantix-logo")
    ).toHaveAttribute("data-variant", "client");
  });

  it("renders the page title", () => {
    renderClientShell();

    expect(
      screen.getByRole("heading", {
        name: "Client Dashboard",
      })
    ).toBeInTheDocument();
  });

  it("renders the header", () => {
    const { controls } = renderClientShell();

    expect(controls.header()).toBeInTheDocument();
  });

  it("renders children inside the main content area", () => {
    const { controls } = renderClientShell();

    expect(
      within(controls.main()).getByTestId("page-content")
    ).toHaveTextContent("Page content");
  });

  it("renders the client role card", () => {
    renderClientShell();

    expect(
      screen.getByText("Client role")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Follow your project and current sprint progress."
      )
    ).toBeInTheDocument();
  });

  it("renders the Client label in the header", () => {
    const { container } = renderClientShell();

    expect(
      container.querySelector(".cs-chip")
    ).toHaveTextContent("Client");
  });
});

describe("Active navigation", () => {
  it("marks Overview active by default", () => {
    const { controls } = renderClientShell();

    expect(controls.overview()).toHaveClass("is-active");
    expect(controls.overview()).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("marks Settings active when activeNav is settings", () => {
    const { controls } = renderClientShell({
      activeNav: "settings",
    });

    expect(controls.settings()).toHaveClass("is-active");
    expect(controls.settings()).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("does not mark Overview active on the Settings page", () => {
    const { controls } = renderClientShell({
      activeNav: "settings",
    });

    expect(controls.overview()).not.toHaveClass("is-active");
    expect(controls.overview()).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("does not mark Settings active on the Overview page", () => {
    const { controls } = renderClientShell();

    expect(controls.settings()).not.toHaveClass("is-active");
    expect(controls.settings()).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("does not mark either navigation active for an unknown page", () => {
    const { controls } = renderClientShell({
      activeNav: "other",
    });

    expect(controls.overview()).not.toHaveClass("is-active");
    expect(controls.settings()).not.toHaveClass("is-active");

    expect(controls.overview()).not.toHaveAttribute(
      "aria-current"
    );
    expect(controls.settings()).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("updates active navigation when props change", () => {
    const { controls, rerender } = renderClientShell();

    rerender(
      <ClientShell
        profile={profile}
        title="Settings"
        activeNav="settings"
        onOpenOverview={onOpenOverview}
        onOpenSettings={onOpenSettings}
        onSignOut={onSignOut}
      >
        Settings content
      </ClientShell>
    );

    expect(controls.settings()).toHaveClass("is-active");
    expect(controls.overview()).not.toHaveClass("is-active");
  });
});

describe("Navigation interactions", () => {
  it("calls onOpenOverview when Overview is clicked", async () => {
    const { user, controls } = renderClientShell();

    await user.click(controls.overview());

    expect(onOpenOverview).toHaveBeenCalledOnce();
  });

  it("calls onOpenSettings when Settings is clicked", async () => {
    const { user, controls } = renderClientShell();

    await user.click(controls.settings());

    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("calls onSignOut when Sign out is clicked", async () => {
    const { user, controls } = renderClientShell();

    await user.click(controls.signOut());

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("only calls the selected navigation callback", async () => {
    const { user, controls } = renderClientShell();

    await user.click(controls.settings());

    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onOpenOverview).not.toHaveBeenCalled();
    expect(onSignOut).not.toHaveBeenCalled();
  });
});

describe("Page title and badge", () => {
  it("does not uppercase the title by default", () => {
    const { container } = renderClientShell();

    expect(
      container.querySelector(".cs-heading")
    ).not.toHaveClass("is-upper");
  });

  it("applies uppercase styling when upperTitle is true", () => {
    const { container } = renderClientShell({
      upperTitle: true,
    });

    expect(
      container.querySelector(".cs-heading")
    ).toHaveClass("is-upper");
  });

  it("renders an optional badge", () => {
    renderClientShell({
      badge: "In Progress",
    });

    expect(
      screen.getByText("In Progress")
    ).toHaveClass("cs-badge");
  });

  it("does not render a badge when none is provided", () => {
    const { container } = renderClientShell();

    expect(
      container.querySelector(".cs-badge")
    ).not.toBeInTheDocument();
  });

  it("supports React elements as badges", () => {
    renderClientShell({
      badge: <strong data-testid="custom-badge">Active</strong>,
    });

    expect(
      screen.getByTestId("custom-badge")
    ).toHaveTextContent("Active");
  });
});

describe("Back navigation", () => {
  it("does not render a back button by default", () => {
    renderClientShell();

    expect(
      screen.queryByRole("button", {
        name: "Back to all projects",
      })
    ).not.toBeInTheDocument();
  });

  it("renders a back button when onBack is provided", () => {
    renderClientShell({
      onBack,
    });

    expect(
      screen.getByRole("button", {
        name: "Back to all projects",
      })
    ).toBeInTheDocument();
  });

  it("calls onBack when the back button is clicked", async () => {
    const { user } = renderClientShell({
      onBack,
    });

    await user.click(
      screen.getByRole("button", {
        name: "Back to all projects",
      })
    );

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("supports a custom back button label", () => {
    renderClientShell({
      onBack,
      backLabel: "Back to dashboard",
    });

    expect(
      screen.getByRole("button", {
        name: "Back to dashboard",
      })
    ).toBeInTheDocument();
  });

  it("renders the arrow icon in the back button", () => {
    renderClientShell({
      onBack,
    });

    const button = screen.getByRole("button", {
      name: "Back to all projects",
    });

    expect(
      within(button).getByTestId("icon-arrowLeft")
    ).toBeInTheDocument();
  });
});

describe("Client profile avatar", () => {
  it("uses the preferred name initial when available", () => {
    const { container } = renderClientShell();

    expect(
      container.querySelector(".cs-avatar")
    ).toHaveTextContent("S");
  });

  it("uses the first name when preferred name is missing", () => {
    const { container } = renderClientShell({
      profile: {
        ...profile,
        user_pref_name: "",
        user_first_name: "Michael",
      },
    });

    expect(
      container.querySelector(".cs-avatar")
    ).toHaveTextContent("M");
  });

  it("uses ? when no name is available", () => {
    const { container } = renderClientShell({
      profile: {
        ...profile,
        user_pref_name: "",
        user_first_name: "",
      },
    });

    expect(
      container.querySelector(".cs-avatar")
    ).toHaveTextContent("?");
  });

  it("converts lowercase initials to uppercase", () => {
    const { container } = renderClientShell({
      profile: {
        ...profile,
        user_pref_name: "alex",
      },
    });

    expect(
      container.querySelector(".cs-avatar")
    ).toHaveTextContent("A");
  });

  it("hides the avatar initial from screen readers", () => {
    const { container } = renderClientShell();

    expect(
      container.querySelector(".cs-avatar")
    ).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Notifications", () => {
  it("calls the useNotifications hook", () => {
    renderClientShell();

    expect(mocks.useNotifications).toHaveBeenCalled();
  });

  it("renders the notification bell", () => {
    renderClientShell();

    expect(
      screen.getByTestId("notification-bell")
    ).toBeInTheDocument();
  });

  it("passes notifications to the bell", () => {
    renderClientShell();

    expect(
      screen.getByTestId("notification-count")
    ).toHaveTextContent("2");
  });

  it("supports an empty notification list", () => {
    mocks.useNotifications.mockReturnValue({
      items: [],
      unreadCount: 0,
    });

    renderClientShell();

    expect(
      screen.getByTestId("notification-count")
    ).toHaveTextContent("0");
  });
});

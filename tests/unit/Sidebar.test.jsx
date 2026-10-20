
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

import Sidebar from "../../src/components/Sidebar/Sidebar";

let onOpenProjects;
let onOpenSettings;
let onSignOut;

beforeEach(() => {
  vi.clearAllMocks();

  onOpenProjects = vi.fn();
  onOpenSettings = vi.fn();
  onSignOut = vi.fn();
});

function renderSidebar(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    active: "projects",
    onOpenProjects,
    onOpenSettings,
    onSignOut,
    ...overrides,
  };

  const view = render(<Sidebar {...props} />);

  const controls = {
    sidebar: () => view.container.querySelector("aside.sidebar"),
    nav: () => screen.getByRole("navigation", { name: "Workspace" }),
    projects: () => screen.getByRole("button", { name: "Projects" }),
    settings: () => screen.getByRole("button", { name: "Settings" }),
    signOut: () => screen.getByRole("button", { name: "Sign out" }),
  };

  return { user, controls, ...view };
}

describe("Sidebar rendering", () => {
  it("renders the sidebar element", () => {
    const { controls } = renderSidebar();

    expect(controls.sidebar()).toBeInTheDocument();
  });

  it("renders the workspace navigation", () => {
    const { controls } = renderSidebar();

    expect(controls.nav()).toBeInTheDocument();
  });

  it("renders the Projects button", () => {
    const { controls } = renderSidebar();

    expect(controls.projects()).toBeInTheDocument();
  });

  it("renders the Settings button", () => {
    const { controls } = renderSidebar();

    expect(controls.settings()).toBeInTheDocument();
  });

  it("renders the Sign out button", () => {
    const { controls } = renderSidebar();

    expect(controls.signOut()).toBeInTheDocument();
  });

  it("renders exactly two navigation buttons", () => {
    const { controls } = renderSidebar();

    expect(
      within(controls.nav()).getAllByRole("button")
    ).toHaveLength(2);
  });

  it("renders the Quantix logo", () => {
    renderSidebar();

    expect(
      screen.getByTestId("quantix-logo")
    ).toBeInTheDocument();
  });

  it("uses the stacked Quantix logo variant", () => {
    renderSidebar();

    expect(
      screen.getByTestId("quantix-logo")
    ).toHaveAttribute("data-variant", "stacked");
  });

  it("renders the grid icon for Projects", () => {
    const { controls } = renderSidebar();

    expect(
      within(controls.projects()).getByTestId("icon-grid")
    ).toBeInTheDocument();
  });

  it("renders the gear icon for Settings", () => {
    const { controls } = renderSidebar();

    expect(
      within(controls.settings()).getByTestId("icon-gear")
    ).toBeInTheDocument();
  });

  it("renders the signOut icon for Sign out", () => {
    const { controls } = renderSidebar();

    expect(
      within(controls.signOut()).getByTestId("icon-signOut")
    ).toBeInTheDocument();
  });
});

describe("Active navigation", () => {
  it("sets Projects as active by default", () => {
    const user = userEvent.setup();

    render(
      <Sidebar
        onOpenProjects={onOpenProjects}
        onOpenSettings={onOpenSettings}
        onSignOut={onSignOut}
      />
    );

    expect(
      screen.getByRole("button", { name: "Projects" })
    ).toHaveClass("sidebar-link-active");

    expect(
      screen.getByRole("button", { name: "Projects" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("marks Projects active when active is projects", () => {
    const { controls } = renderSidebar({
      active: "projects",
    });

    expect(controls.projects()).toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.projects()).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("does not mark Settings active on the Projects page", () => {
    const { controls } = renderSidebar({
      active: "projects",
    });

    expect(controls.settings()).not.toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.settings()).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("marks Settings active when active is settings", () => {
    const { controls } = renderSidebar({
      active: "settings",
    });

    expect(controls.settings()).toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.settings()).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("does not mark Projects active on the Settings page", () => {
    const { controls } = renderSidebar({
      active: "settings",
    });

    expect(controls.projects()).not.toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.projects()).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("does not mark either button active for an unknown page", () => {
    const { controls } = renderSidebar({
      active: "unknown",
    });

    expect(controls.projects()).not.toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.settings()).not.toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.projects()).not.toHaveAttribute(
      "aria-current"
    );

    expect(controls.settings()).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("updates the active button when props change", () => {
    const { controls, rerender } = renderSidebar({
      active: "projects",
    });

    rerender(
      <Sidebar
        active="settings"
        onOpenProjects={onOpenProjects}
        onOpenSettings={onOpenSettings}
        onSignOut={onSignOut}
      />
    );

    expect(controls.projects()).not.toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.settings()).toHaveClass(
      "sidebar-link-active"
    );
  });
});

describe("Sidebar navigation interactions", () => {
  it("calls onOpenProjects when Projects is clicked", async () => {
    const { user, controls } = renderSidebar();

    await user.click(controls.projects());

    expect(onOpenProjects).toHaveBeenCalledOnce();
  });

  it("calls onOpenSettings when Settings is clicked", async () => {
    const { user, controls } = renderSidebar();

    await user.click(controls.settings());

    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("calls onSignOut when Sign out is clicked", async () => {
    const { user, controls } = renderSidebar();

    await user.click(controls.signOut());

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it("only calls the selected navigation callback", async () => {
    const { user, controls } = renderSidebar();

    await user.click(controls.settings());

    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onOpenProjects).not.toHaveBeenCalled();
    expect(onSignOut).not.toHaveBeenCalled();
  });

  it("does not change the active page without a prop update", async () => {
    const { user, controls } = renderSidebar({
      active: "projects",
    });

    await user.click(controls.settings());

    expect(controls.projects()).toHaveClass(
      "sidebar-link-active"
    );

    expect(controls.settings()).not.toHaveClass(
      "sidebar-link-active"
    );
  });
});

describe("Extra content", () => {
  it("renders extra content when provided", () => {
    renderSidebar({
      extra: <div data-testid="extra-content">Extra tools</div>,
    });

    expect(
      screen.getByTestId("extra-content")
    ).toHaveTextContent("Extra tools");
  });

  it("renders extra content above the Sign out button", () => {
    const { controls } = renderSidebar({
      extra: <div data-testid="extra-content">Extra tools</div>,
    });

    const extra = screen.getByTestId("extra-content");
    const signOut = controls.signOut();

    expect(
      extra.compareDocumentPosition(signOut) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("renders correctly without extra content", () => {
    const { controls } = renderSidebar();

    expect(controls.signOut()).toBeInTheDocument();

    expect(
      screen.queryByTestId("extra-content")
    ).not.toBeInTheDocument();
  });

  it("supports interactive extra content", async () => {
    const onExtraClick = vi.fn();

    const { user } = renderSidebar({
      extra: (
        <button type="button" onClick={onExtraClick}>
          Extra action
        </button>
      ),
    });

    await user.click(
      screen.getByRole("button", {
        name: "Extra action",
      })
    );

    expect(onExtraClick).toHaveBeenCalledOnce();
  });
});

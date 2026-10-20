
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../src/components/Icons/Icons", () => ({
  default: () => <span aria-hidden="true" />,
}));

import {
  NotificationPopup,
  NotificationBell,
} from "../../src/components/NotificationCenter/NotificationCenter";

const sampleNotifications = [
  {
    notif_id: 1,
    notif_message: "You have been assigned a task",
    notif_is_read: false,
    notif_delivered_at: "2026-10-20T09:00:00Z",
    notif_type: "task_assigned",
    notif_action_status: null,
  },
  {
    notif_id: 2,
    notif_message: "Your task was completed",
    notif_is_read: true,
    notif_delivered_at: "2026-10-19T09:00:00Z",
    notif_type: "task_completed",
    notif_action_status: null,
  },
  {
    notif_id: 3,
    notif_message: "A developer volunteered for a task",
    notif_is_read: false,
    notif_delivered_at: "2026-10-20T10:00:00Z",
    notif_type: "task_volunteer",
    notif_action_status: "pending",
  },
];

let onMarkRead;
let onDelete;
let onRespondToVolunteer;
let onClose;

beforeEach(() => {
  vi.clearAllMocks();

  onMarkRead = vi.fn();
  onDelete = vi.fn();
  onRespondToVolunteer = vi.fn();
  onClose = vi.fn();
});

function renderPopup(overrides = {}) {
  const user = userEvent.setup();

  render(
    <NotificationPopup
      notifications={sampleNotifications}
      error=""
      onMarkRead={onMarkRead}
      onDelete={onDelete}
      onRespondToVolunteer={onRespondToVolunteer}
      onClose={onClose}
      {...overrides}
    />
  );

  return user;
}

function renderBell(overrides = {}) {
  const user = userEvent.setup();

  render(
    <NotificationBell
      notifications={{
        notifications: sampleNotifications,
        unreadCount: 2,
        error: "",
        markRead: onMarkRead,
        remove: onDelete,
        respondToVolunteer: onRespondToVolunteer,
        ...overrides,
      }}
    />
  );

  return user;
}

describe("NotificationPopup rendering", () => {
  it("displays the notifications popup", () => {
    renderPopup();

    expect(
      screen.getByRole("dialog", { name: "Notifications" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Notifications" })
    ).toBeInTheDocument();
  });

  it("displays all notification messages", () => {
    renderPopup();

    expect(
      screen.getByText("You have been assigned a task")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Your task was completed")
    ).toBeInTheDocument();

    expect(
      screen.getByText("A developer volunteered for a task")
    ).toBeInTheDocument();
  });

  it("displays an empty state", () => {
    renderPopup({ notifications: [] });

    expect(
      screen.getByText("No notifications yet.")
    ).toBeInTheDocument();
  });

  it("displays notification errors", () => {
    renderPopup({
      notifications: [],
      error: "Could not load notifications.",
    });

    expect(screen.getByRole("alert"))
      .toHaveTextContent("Could not load notifications.");

    expect(
      screen.queryByText("No notifications yet.")
    ).not.toBeInTheDocument();
  });

  it("marks unread notifications visually", () => {
    renderPopup();

    const unreadMessage = screen.getByText(
      "You have been assigned a task"
    );

    expect(
      unreadMessage.closest("li")
    ).toHaveClass("is-unread");

    expect(
      screen.getAllByRole("img", { name: "Unread" })
    ).toHaveLength(2);
  });

  it("marks read notifications visually", () => {
    renderPopup();

    expect(
      screen.getByText("Your task was completed").closest("li")
    ).toHaveClass("is-read");
  });

  it("displays notification timestamps", () => {
    renderPopup();

    const notification = screen
      .getByText("You have been assigned a task")
      .closest("li");

    const time = notification.querySelector("time");

    expect(time).toBeInTheDocument();
    expect(time).toHaveAttribute(
      "datetime",
      "2026-10-20T09:00:00Z"
    );
    expect(time).not.toBeEmptyDOMElement();
  });

  it("closes the popup using the close button", async () => {
    const user = renderPopup();

    await user.click(
      screen.getByRole("button", {
        name: "Close notifications",
      })
    );

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("Notification actions", () => {
  it("marks an unread notification as read", async () => {
    const user = renderPopup();

    await user.click(
      screen.getByRole("button", {
        name: /You have been assigned a task/,
      })
    );

    expect(onMarkRead).toHaveBeenCalledWith(1);
  });

  it("does not mark already-read notifications again", async () => {
    const user = renderPopup();

    await user.click(
      screen.getByRole("button", {
        name: /Your task was completed/,
      })
    );

    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("does not mark volunteer requests as read by clicking", async () => {
    const user = renderPopup();

    await user.click(
      screen.getByRole("button", {
        name: /A developer volunteered for a task/,
      })
    );

    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("deletes the selected notification", async () => {
    const user = renderPopup();

    const notification = screen
      .getByText("You have been assigned a task")
      .closest("li");

    await user.click(
      within(notification).getByRole("button", {
        name: "Delete notification",
      })
    );

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("accepts a volunteer request", async () => {
    const user = renderPopup();

    await user.click(
      screen.getByRole("button", { name: "ACCEPT" })
    );

    expect(onRespondToVolunteer)
      .toHaveBeenCalledWith(3, true);
  });

  it("declines a volunteer request", async () => {
    const user = renderPopup();

    await user.click(
      screen.getByRole("button", { name: "DECLINE" })
    );

    expect(onRespondToVolunteer)
      .toHaveBeenCalledWith(3, false);
  });

  it("hides volunteer actions after a response", () => {
    renderPopup({
      notifications: [
        {
          ...sampleNotifications[2],
          notif_action_status: "accepted",
        },
      ],
    });

    expect(
      screen.queryByRole("button", { name: "ACCEPT" })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "DECLINE" })
    ).not.toBeInTheDocument();
  });

  it("shows volunteer request status classes", () => {
    renderPopup();

    const notification = screen
      .getByText("A developer volunteered for a task")
      .closest("li");

    expect(notification).toHaveClass(
      "is-volunteer-request",
      "is-pending"
    );
  });
});

describe("NotificationBell", () => {
  it("displays the unread notification count", () => {
    renderBell();

    expect(
      screen.getByRole("button", {
        name: "Notifications, 2 unread",
      })
    ).toBeInTheDocument();

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not display a badge when everything is read", () => {
    renderBell({ unreadCount: 0 });

    expect(
      screen.getByRole("button", { name: "Notifications" })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("2")
    ).not.toBeInTheDocument();
  });

  it("displays 9+ when there are more than nine unread", () => {
    renderBell({ unreadCount: 15 });

    expect(
      screen.getByText("9+")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Notifications, 15 unread",
      })
    ).toBeInTheDocument();
  });

  it("opens the popup when the bell is clicked", async () => {
    const user = renderBell();

    await user.click(
      screen.getByRole("button", {
        name: "Notifications, 2 unread",
      })
    );

    expect(
      screen.getByRole("dialog", { name: "Notifications" })
    ).toBeInTheDocument();
  });

  it("closes the popup when the bell is clicked again", async () => {
    const user = renderBell();

    const bell = screen.getByRole("button", {
      name: "Notifications, 2 unread",
    });

    await user.click(bell);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(bell);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the popup when Escape is pressed", async () => {
    const user = renderBell();

    await user.click(
      screen.getByRole("button", {
        name: "Notifications, 2 unread",
      })
    );

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog")
    ).not.toBeInTheDocument();
  });

  it("closes the popup when clicking outside", async () => {
    const user = renderBell();

    await user.click(
      screen.getByRole("button", {
        name: "Notifications, 2 unread",
      })
    );

    await user.click(document.body);

    expect(
      screen.queryByRole("dialog")
    ).not.toBeInTheDocument();
  });

  it("passes notification actions through to the hook", async () => {
    const user = renderBell();

    await user.click(
      screen.getByRole("button", {
        name: "Notifications, 2 unread",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: /You have been assigned a task/,
      })
    );

    expect(onMarkRead).toHaveBeenCalledWith(1);
  });
});

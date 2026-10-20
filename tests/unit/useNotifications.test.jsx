
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  fetchNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  deleteNotification: vi.fn(),
  respondToTaskVolunteer: vi.fn(),
}));

vi.mock("../../src/services/notificationService", () => ({
  fetchNotifications: mocks.fetchNotifications,
  markNotificationRead: mocks.markNotificationRead,
  deleteNotification: mocks.deleteNotification,
  respondToTaskVolunteer: mocks.respondToTaskVolunteer,
}));

import { useNotifications } from "../../src/hooks/useNotifications";

const sampleNotifications = [
  {
    notif_id: 1,
    notif_message: "New task assigned",
    notif_is_read: false,
    notif_read_at: null,
    task_id: 10,
    notif_volunteer_id: "developer-1",
    notif_action_status: null,
  },
  {
    notif_id: 2,
    notif_message: "Task completed",
    notif_is_read: true,
    notif_read_at: "2026-10-19T10:00:00Z",
    task_id: 20,
    notif_volunteer_id: null,
    notif_action_status: null,
  },
];

beforeEach(() => {
  vi.resetAllMocks();

  mocks.fetchNotifications.mockResolvedValue(
    sampleNotifications.map((item) => ({ ...item }))
  );

  mocks.markNotificationRead.mockResolvedValue(1);
  mocks.deleteNotification.mockResolvedValue(undefined);
  mocks.respondToTaskVolunteer.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Loading notifications", () => {
  it("loads notifications when the hook starts", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    expect(mocks.fetchNotifications).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe("");
  });

  it("calculates the unread notification count", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });
  });

  it("returns zero unread notifications when all are read", async () => {
    mocks.fetchNotifications.mockResolvedValue([
      { notif_id: 1, notif_is_read: true },
      { notif_id: 2, notif_is_read: true },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    expect(result.current.unreadCount).toBe(0);
  });

  it("handles an empty notification list", async () => {
    mocks.fetchNotifications.mockResolvedValue([]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mocks.fetchNotifications).toHaveBeenCalled();
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("displays errors when loading fails", async () => {
    mocks.fetchNotifications.mockRejectedValue(
      new Error("Database unavailable")
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.error).toBe("Database unavailable");
    });
  });

  it("uses a fallback message for loading errors", async () => {
    mocks.fetchNotifications.mockRejectedValue({});

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Could not load notifications."
      );
    });
  });

  it("refreshes notifications automatically", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useNotifications(1000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(mocks.fetchNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(mocks.fetchNotifications).toHaveBeenCalledTimes(2);
  });

  it("stops refreshing after unmount", async () => {
    vi.useFakeTimers();

    const { unmount } = renderHook(() => useNotifications(1000));

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mocks.fetchNotifications).toHaveBeenCalledTimes(1);
  });
});

describe("Marking notifications as read", () => {
  it("marks a notification as read", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(mocks.markNotificationRead).toHaveBeenCalledWith(1);

    expect(result.current.notifications[0].notif_is_read).toBe(true);
    expect(result.current.notifications[0].notif_read_at)
      .toEqual(expect.any(String));

    expect(result.current.unreadCount).toBe(0);
  });

  it("does not modify other notifications", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    const original = { ...result.current.notifications[1] };

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(result.current.notifications[1]).toEqual(original);
  });

  it("handles errors when marking notifications as read", async () => {
    mocks.markNotificationRead.mockRejectedValue(
      new Error("Update failed")
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(result.current.error).toBe("Update failed");
    expect(result.current.unreadCount).toBe(1);
  });
});

describe("Deleting notifications", () => {
  it("removes a notification successfully", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.remove(1);
    });

    expect(mocks.deleteNotification).toHaveBeenCalledWith(1);
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].notif_id).toBe(2);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.error).toBe("");
  });

  it("keeps notifications when deletion fails", async () => {
    mocks.deleteNotification.mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.remove(1);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.error).toBe("Network error");
  });

  it("detects missing notification deletion permissions", async () => {
    mocks.deleteNotification.mockRejectedValue({
      code: "42501",
      message: "Permission denied",
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.remove(1);
    });

    expect(result.current.error).toContain(
      "20261008_notification_delete.sql"
    );
  });

  it("detects row-level security deletion errors", async () => {
    mocks.deleteNotification.mockRejectedValue(
      new Error("Row-level security policy prevented deletion")
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.remove(1);
    });

    expect(result.current.error).toContain(
      "20261008_notification_delete.sql"
    );
  });

  it("uses a fallback message for deletion errors", async () => {
    mocks.deleteNotification.mockRejectedValue({});

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.remove(1);
    });

    expect(result.current.error).toBe(
      "Could not delete the notification."
    );
  });
});

describe("Responding to task volunteers", () => {
  it("accepts a volunteer and updates the notification", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.respondToVolunteer(1, true);
    });

    expect(mocks.respondToTaskVolunteer)
      .toHaveBeenCalledWith(1, true);

    expect(result.current.notifications[0].notif_action_status)
      .toBe("accepted");

    expect(result.current.notifications[0].notif_is_read)
      .toBe(true);

    expect(result.current.unreadCount).toBe(0);
  });

  it("declines a volunteer request", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.respondToVolunteer(1, false);
    });

    expect(mocks.respondToTaskVolunteer)
      .toHaveBeenCalledWith(1, false);

    expect(result.current.notifications[0].notif_action_status)
      .toBe("declined");
  });

  it("dispatches an event when a volunteer is accepted", async () => {
    const listener = vi.fn();

    window.addEventListener("task-volunteer-accepted", listener);

    try {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.respondToVolunteer(1, true);
      });

      expect(listener).toHaveBeenCalledTimes(1);

      expect(listener.mock.calls[0][0].detail).toEqual({
        taskId: 10,
        developerId: "developer-1",
      });
    } finally {
      window.removeEventListener("task-volunteer-accepted", listener);
    }
  });

  it("does not dispatch an event when declining", async () => {
    const listener = vi.fn();

    window.addEventListener("task-volunteer-accepted", listener);

    try {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      await act(async () => {
        await result.current.respondToVolunteer(1, false);
      });

      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("task-volunteer-accepted", listener);
    }
  });

  it("handles errors when responding to volunteers", async () => {
    mocks.respondToTaskVolunteer.mockRejectedValue(
      new Error("Request failed")
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.respondToVolunteer(1, true);
    });

    expect(result.current.error).toBe("Request failed");

    expect(result.current.notifications[0].notif_action_status)
      .toBeNull();
  });

  it("detects missing volunteer database migrations", async () => {
    mocks.respondToTaskVolunteer.mockRejectedValue({
      code: "PGRST202",
      message: "Function missing",
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.respondToVolunteer(1, true);
    });

    expect(result.current.error).toContain(
      "20261010_task_volunteer_notifications.sql"
    );
  });

  it("uses a fallback message for volunteer errors", async () => {
    mocks.respondToTaskVolunteer.mockRejectedValue({});

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.respondToVolunteer(1, true);
    });

    expect(result.current.error).toBe(
      "Could not respond to the volunteer request."
    );
  });
});


import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
  },
}));

import {
  fetchNotifications,
  markNotificationRead,
  respondToTaskVolunteer,
  deleteNotification,
} from "../../src/services/notificationService";

// Mock the Supabase query chain
function mockQuery(result = { data: null, error: null }) {
  const q = {};

  for (const method of [
    "select",
    "order",
    "limit",
    "update",
    "eq",
    "single",
    "delete",
  ]) {
    q[method] = vi.fn(() => q);
  }

  q.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);

  return q;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Fetching notifications", () => {
  it("fetches notifications successfully", async () => {
    const notifications = [
      { notif_id: 1, notif_message: "New task assigned" },
      { notif_id: 2, notif_message: "Task updated" },
    ];

    const q = mockQuery({
      data: notifications,
      error: null,
    });

    mocks.from.mockReturnValue(q);

    const result = await fetchNotifications();

    expect(result).toEqual(notifications);
    expect(mocks.from).toHaveBeenCalledWith("notification");

    expect(q.order).toHaveBeenCalledWith(
      "notif_delivered_at",
      { ascending: false }
    );

    expect(q.limit).toHaveBeenCalledWith(30);
  });

  it("uses a custom notification limit", async () => {
    const q = mockQuery({
      data: [],
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await fetchNotifications(10);

    expect(q.limit).toHaveBeenCalledWith(10);
  });

  it("returns an empty array when no notifications exist", async () => {
    mocks.from.mockReturnValue(
      mockQuery({ data: [], error: null })
    );

    expect(await fetchNotifications()).toEqual([]);
  });

  it("throws an error when fetching fails", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Database unavailable"),
      })
    );

    await expect(fetchNotifications())
      .rejects.toThrow("Database unavailable");
  });
});

describe("Marking notifications as read", () => {
  it("marks a notification as read", async () => {
    const q = mockQuery({
      data: { notif_id: 5 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    const result = await markNotificationRead(5);

    expect(result).toBe(5);

    expect(q.update).toHaveBeenCalledWith({
      notif_is_read: true,
      notif_read_at: expect.any(String),
    });

    expect(q.eq).toHaveBeenCalledWith("notif_id", 5);
  });

  it("sets a valid ISO timestamp when marking as read", async () => {
    const q = mockQuery({
      data: { notif_id: 3 },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await markNotificationRead(3);

    const update = q.update.mock.calls[0][0];

    expect(update.notif_is_read).toBe(true);

    expect(
      new Date(update.notif_read_at).toISOString()
    ).toBe(update.notif_read_at);
  });

  it("handles errors when marking as read", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Permission denied"),
      })
    );

    await expect(markNotificationRead(5))
      .rejects.toThrow("Permission denied");
  });
});

describe("Responding to task volunteers", () => {
  it("accepts a task volunteer", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await respondToTaskVolunteer(7, true);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "respond_to_task_volunteer",
      {
        p_notification_id: 7,
        p_accept: true,
      }
    );
  });

  it("rejects a task volunteer", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await respondToTaskVolunteer(7, false);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "respond_to_task_volunteer",
      {
        p_notification_id: 7,
        p_accept: false,
      }
    );
  });

  it("handles errors when responding to volunteers", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Permission denied"),
    });

    await expect(
      respondToTaskVolunteer(7, true)
    ).rejects.toThrow("Permission denied");
  });
});

describe("Deleting notifications", () => {
  it("deletes a notification successfully", async () => {
    const q = mockQuery({
      data: [{ notif_id: 9 }],
      error: null,
    });

    mocks.from.mockReturnValue(q);

    await expect(deleteNotification(9))
      .resolves.toBeUndefined();

    expect(q.delete).toHaveBeenCalled();
    expect(q.eq).toHaveBeenCalledWith("notif_id", 9);
    expect(q.select).toHaveBeenCalledWith("notif_id");
  });

  it("handles database errors when deleting", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Delete failed"),
      })
    );

    await expect(deleteNotification(9))
      .rejects.toThrow("Delete failed");
  });

  it("detects when no notification was deleted", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: [],
        error: null,
      })
    );

    await expect(deleteNotification(9))
      .rejects.toThrow(
        "Could not delete this notification."
      );
  });

  it("handles null deletion results", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: null,
      })
    );

    await expect(deleteNotification(9))
      .rejects.toThrow(
        "Could not delete this notification."
      );
  });
});

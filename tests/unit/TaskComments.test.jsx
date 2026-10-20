
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  fetchTaskComments: vi.fn(),
  addTaskComment: vi.fn(),
  deleteTaskComment: vi.fn(),
}));

vi.mock("../../src/services/taskServices", () => ({
  fetchTaskComments: mocks.fetchTaskComments,
  addTaskComment: mocks.addTaskComment,
  deleteTaskComment: mocks.deleteTaskComment,
}));

import TaskComments from "../../src/components/TaskComments/TaskComments";

const sampleComments = [
  {
    comment_id: 1,
    user_id: "user-1",
    task_comm_message: "I finished the first part.",
    task_comm_created_at: "2026-10-20T09:00:00Z",
    user: {
      user_pref_name: "Alex",
      user_first_name: "Alexander",
      user_last_name: "Smith",
    },
  },
  {
    comment_id: 2,
    user_id: "user-2",
    task_comm_message: "I will review the changes.",
    task_comm_created_at: "2026-10-20T10:00:00Z",
    user: {
      user_pref_name: "",
      user_first_name: "Sarah",
      user_last_name: "Jones",
    },
  },
  {
    comment_id: 3,
    user_id: "user-3",
    task_comm_message: "Looks good to me.",
    task_comm_created_at: "2026-10-20T11:00:00Z",
    user: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();

  mocks.fetchTaskComments.mockResolvedValue(sampleComments);
  mocks.addTaskComment.mockImplementation(
    async (taskId, message) => ({
      comment_id: 4,
      user_id: "user-1",
      task_comm_message: message,
      task_comm_created_at: "2026-10-20T12:00:00Z",
      user: { user_pref_name: "Alex" },
    })
  );
  mocks.deleteTaskComment.mockResolvedValue(undefined);
});

function renderComments(overrides = {}) {
  const user = userEvent.setup();

  render(
    <TaskComments
      taskId={10}
      currentUserId="user-1"
      roleName="Developer"
      {...overrides}
    />
  );

  return user;
}

async function openComments(user) {
  await user.click(
    screen.getByRole("button", { name: "Comments" })
  );

  await screen.findByText("I finished the first part.");
}

describe("TaskComments display", () => {
  it("starts with the comments section closed", () => {
    renderComments();

    expect(
      screen.getByRole("button", { name: "Comments" })
    ).toHaveAttribute("aria-expanded", "false");

    expect(
      screen.queryByText("I finished the first part.")
    ).not.toBeInTheDocument();
  });

  it("does not fetch comments until opened", () => {
    renderComments();

    expect(mocks.fetchTaskComments).not.toHaveBeenCalled();
  });

  it("fetches comments when opened", async () => {
    const user = renderComments();

    await openComments(user);

    expect(mocks.fetchTaskComments).toHaveBeenCalledWith(10);
  });

  it("displays fetched comments", async () => {
    const user = renderComments();

    await openComments(user);

    expect(
      screen.getByText("I finished the first part.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("I will review the changes.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Looks good to me.")
    ).toBeInTheDocument();
  });

  it("displays the preferred name of a comment author", async () => {
    const user = renderComments();

    await openComments(user);

    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("uses the first and last name when no preferred name exists", async () => {
    const user = renderComments();

    await openComments(user);

    expect(
      screen.getByText("Sarah Jones")
    ).toBeInTheDocument();
  });

  it("uses User when author information is unavailable", async () => {
    const user = renderComments();

    await openComments(user);

    expect(
      screen.getByText("User")
    ).toBeInTheDocument();
  });

  it("displays the empty state when no comments exist", async () => {
    mocks.fetchTaskComments.mockResolvedValue([]);

    const user = renderComments();

    await user.click(
      screen.getByRole("button", { name: "Comments" })
    );

    expect(
      await screen.findByText("No comments yet.")
    ).toBeInTheDocument();
  });

  it("displays an error if loading comments fails", async () => {
    mocks.fetchTaskComments.mockRejectedValue(
      new Error("Could not fetch comments")
    );

    const user = renderComments();

    await user.click(
      screen.getByRole("button", { name: "Comments" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Could not fetch comments");
  });

  it("closes the comments section when toggled again", async () => {
    const user = renderComments();

    await openComments(user);

    await user.click(
      screen.getByRole("button", { name: "Hide comments" })
    );

    expect(
      screen.queryByText("I finished the first part.")
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Comments" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("displays comment timestamps", async () => {
    const user = renderComments();

    await openComments(user);

    const comment = screen
      .getByText("I finished the first part.")
      .closest("li");

    const time = comment.querySelector("time");

    expect(time).toHaveAttribute(
      "datetime",
      "2026-10-20T09:00:00Z"
    );

    expect(time).not.toBeEmptyDOMElement();
  });
});

describe("Adding comments", () => {
  it("allows a user to add a comment", async () => {
    const user = renderComments();

    await openComments(user);

    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      "New test comment"
    );

    await user.click(
      screen.getByRole("button", { name: "Send" })
    );

    await waitFor(() => {
      expect(mocks.addTaskComment).toHaveBeenCalledWith(
        10,
        "New test comment"
      );
    });

    expect(
      await screen.findByText("New test comment")
    ).toBeInTheDocument();
  });

  it("clears the input after adding a comment", async () => {
    const user = renderComments();

    await openComments(user);

    const input = screen.getByRole("textbox", {
      name: "Add a comment",
    });

    await user.type(input, "Testing comments");

    await user.click(
      screen.getByRole("button", { name: "Send" })
    );

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("disables Send when the message is empty", async () => {
    const user = renderComments();

    await openComments(user);

    expect(
      screen.getByRole("button", { name: "Send" })
    ).toBeDisabled();
  });

  it("disables Send when the message only contains spaces", async () => {
    const user = renderComments();

    await openComments(user);

    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      "   "
    );

    expect(
      screen.getByRole("button", { name: "Send" })
    ).toBeDisabled();
  });

  it("displays an error when adding a comment fails", async () => {
    mocks.addTaskComment.mockRejectedValue(
      new Error("Could not save comment")
    );

    const user = renderComments();

    await openComments(user);

    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      "Test message"
    );

    await user.click(
      screen.getByRole("button", { name: "Send" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Could not save comment");

    expect(
      screen.getByRole("textbox", { name: "Add a comment" })
    ).toHaveValue("Test message");

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent("Could not save comment");
  });

  it("disables Send while saving", async () => {
    let finishSaving;

    mocks.addTaskComment.mockImplementation(
      () => new Promise((resolve) => {
        finishSaving = resolve;
      })
    );

    const user = renderComments();

    await openComments(user);

    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      "Pending comment"
    );

    await user.click(
      screen.getByRole("button", { name: "Send" })
    );

    expect(
      screen.getByRole("button", { name: "Sending..." })
    ).toBeDisabled();

    finishSaving({
      comment_id: 4,
      user_id: "user-1",
      task_comm_message: "Pending comment",
      task_comm_created_at: "2026-10-20T12:00:00Z",
      user: { user_pref_name: "Alex" },
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Send" })
      ).toBeDisabled();
    });

    expect(
      screen.getByRole("textbox", { name: "Add a comment" })
    ).toHaveValue("");

    expect(
      screen.getByText("Pending comment")
    ).toBeInTheDocument();
  });
});

describe("Deleting comments and permissions", () => {
  it("allows Admins to delete any comment", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = renderComments({ roleName: "Admin" });

    await openComments(user);

    const comment = screen
      .getByText("I will review the changes.")
      .closest("li");

    await user.click(
      within(comment).getByRole("button", {
        name: "Delete comment",
      })
    );

    await waitFor(() => {
      expect(mocks.deleteTaskComment)
        .toHaveBeenCalledWith(2);
    });

    expect(
      screen.queryByText("I will review the changes.")
    ).not.toBeInTheDocument();
  });

  it("allows Developers to delete their own comments", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = renderComments();

    await openComments(user);

    const comment = screen
      .getByText("I finished the first part.")
      .closest("li");

    await user.click(
      within(comment).getByRole("button", {
        name: "Delete comment",
      })
    );

    expect(mocks.deleteTaskComment)
      .toHaveBeenCalledWith(1);
  });

  it("prevents Developers from deleting other users' comments", async () => {
    const user = renderComments();

    await openComments(user);

    const otherComment = screen
      .getByText("I will review the changes.")
      .closest("li");

    expect(
      within(otherComment).queryByRole("button", {
        name: "Delete comment",
      })
    ).not.toBeInTheDocument();
  });

  it("does not delete a comment if confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const user = renderComments();

    await openComments(user);

    const ownComment = screen
      .getByText("I finished the first part.")
      .closest("li");

    await user.click(
      within(ownComment).getByRole("button", {
        name: "Delete comment",
      })
    );

    expect(mocks.deleteTaskComment).not.toHaveBeenCalled();

    expect(
      screen.getByText("I finished the first part.")
    ).toBeInTheDocument();
  });

  it("displays an error when deleting fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    mocks.deleteTaskComment.mockRejectedValue(
      new Error("Permission denied")
    );

    const user = renderComments();

    await openComments(user);

    const ownComment = screen
      .getByText("I finished the first part.")
      .closest("li");

    await user.click(
      within(ownComment).getByRole("button", {
        name: "Delete comment",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Permission denied");

    expect(
      screen.getByText("I finished the first part.")
    ).toBeInTheDocument();
  });

  it("uses the correct task ID when fetching comments", async () => {
    const user = renderComments({ taskId: 99 });

    await openComments(user);

    expect(mocks.fetchTaskComments).toHaveBeenCalledWith(99);
  });
});

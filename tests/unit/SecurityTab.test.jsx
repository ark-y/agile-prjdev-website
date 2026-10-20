
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
}));

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    auth: {
      updateUser: mocks.updateUser,
    },
  },
}));

vi.mock("../../src/components/Icons/Icons", () => ({
  default: ({ name, size }) => (
    <span data-testid={`icon-${name}`} data-size={size} />
  ),
}));

import SecurityTab from "../../src/pages/Settings/SecurityTab";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
});

function renderSecurityTab() {
  const user = userEvent.setup();
  render(<SecurityTab />);

  return {
    user,
    newPassword: () => screen.getByLabelText("New password"),
    confirmPassword: () => screen.getByLabelText("Confirm new password"),
    submit: () => screen.getByRole("button", { name: "Change password" }),
    cancel: () => screen.getByRole("button", { name: "Cancel" }),
  };
}

async function fillPasswords(
  user,
  password = "Password123!",
  confirmation = password
) {
  await user.type(screen.getByLabelText("New password"), password);
  await user.type(
    screen.getByLabelText("Confirm new password"),
    confirmation
  );
}

describe("SecurityTab rendering", () => {
  it("renders the Change password heading", () => {
    renderSecurityTab();

    expect(
      screen.getByRole("heading", { name: "Change password" })
    ).toBeInTheDocument();
  });

  it("renders the description", () => {
    renderSecurityTab();

    expect(
      screen.getByText(
        "Enter your new password, then enter it again to confirm."
      )
    ).toBeInTheDocument();
  });

  it("renders both password fields", () => {
    const { newPassword, confirmPassword } = renderSecurityTab();

    expect(newPassword()).toBeInTheDocument();
    expect(confirmPassword()).toBeInTheDocument();
  });

  it("hides passwords by default", () => {
    const { newPassword, confirmPassword } = renderSecurityTab();

    expect(newPassword()).toHaveAttribute("type", "password");
    expect(confirmPassword()).toHaveAttribute("type", "password");
  });

  it("requires both password fields", () => {
    const { newPassword, confirmPassword } = renderSecurityTab();

    expect(newPassword()).toBeRequired();
    expect(confirmPassword()).toBeRequired();
  });

  it("sets the minimum password length to 8", () => {
    const { newPassword, confirmPassword } = renderSecurityTab();

    expect(newPassword()).toHaveAttribute("minlength", "8");
    expect(confirmPassword()).toHaveAttribute("minlength", "8");
  });

  it("uses new-password autocomplete for both fields", () => {
    const { newPassword, confirmPassword } = renderSecurityTab();

    expect(newPassword()).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(confirmPassword()).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
  });

  it("renders the password guidance", () => {
    renderSecurityTab();

    expect(
      screen.getByText(
        "Use a strong, unique password that you don't use for other accounts."
      )
    ).toBeInTheDocument();
  });

  it("renders Change password and Cancel buttons", () => {
    const { submit, cancel } = renderSecurityTab();

    expect(submit()).toBeInTheDocument();
    expect(cancel()).toBeInTheDocument();
  });

  it("renders the narrow settings card", () => {
    const { container } = render(<SecurityTab />);

    expect(
      container.querySelector(".set-card-narrow")
    ).toBeInTheDocument();
  });
});

describe("Password visibility", () => {
  it("shows the new password when its visibility button is clicked", async () => {
    const { user, newPassword } = renderSecurityTab();

    const buttons = screen.getAllByRole("button", {
      name: "Show password",
    });

    await user.click(buttons[0]);

    expect(newPassword()).toHaveAttribute("type", "text");
  });

  it("shows the confirmation password independently", async () => {
    const { user, newPassword, confirmPassword } = renderSecurityTab();

    const buttons = screen.getAllByRole("button", {
      name: "Show password",
    });

    await user.click(buttons[1]);

    expect(confirmPassword()).toHaveAttribute("type", "text");
    expect(newPassword()).toHaveAttribute("type", "password");
  });

  it("hides the password again when toggled twice", async () => {
    const { user, newPassword } = renderSecurityTab();

    await user.click(
      screen.getAllByRole("button", {
        name: "Show password",
      })[0]
    );

    await user.click(
      screen.getByRole("button", {
        name: "Hide password",
      })
    );

    expect(newPassword()).toHaveAttribute("type", "password");
  });
});

describe("Password validation", () => {
  it("does not submit an empty form", async () => {
    const { user, submit } = renderSecurityTab();

    await user.click(submit());

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const { newPassword, confirmPassword, submit } =
      renderSecurityTab();

    fireEvent.change(newPassword(), {
      target: { value: "Short1" },
    });

    fireEvent.change(confirmPassword(), {
      target: { value: "Short1" },
    });

    fireEvent.submit(submit().closest("form"));

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Use a password with at least 8 characters."
    );

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    const { user, submit } = renderSecurityTab();

    await fillPasswords(user, "Password123!", "Different123!");

    await user.click(submit());

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("The passwords do not match.");

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("treats password matching as case-sensitive", async () => {
    const { user, submit } = renderSecurityTab();

    await fillPasswords(user, "Password123!", "password123!");

    await user.click(submit());

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("The passwords do not match.");

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("accepts passwords containing exactly 8 characters", async () => {
    const { user, submit } = renderSecurityTab();

    await fillPasswords(user, "Abcd1234");

    await user.click(submit());

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledWith({
        password: "Abcd1234",
      });
    });
  });
});

describe("Supabase password updates", () => {
  it("calls Supabase with the new password", async () => {
    const { user, submit } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledWith({
        password: "Password123!",
      });
    });
  });

  it("shows success feedback after updating", async () => {
    const { user, submit } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent("Your password has been changed.");
  });

  it("clears both password fields after success", async () => {
    const { user, newPassword, confirmPassword, submit } =
      renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    await waitFor(() => {
      expect(newPassword()).toHaveValue("");
      expect(confirmPassword()).toHaveValue("");
    });
  });

  it("shows errors returned by Supabase", async () => {
    mocks.updateUser.mockResolvedValue({
      data: null,
      error: { message: "Password update denied" },
    });

    const { user, submit } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Password update denied");
  });

  it("shows a fallback error when Supabase fails without a message", async () => {
    mocks.updateUser.mockRejectedValue({});

    const { user, submit } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Could not change your password.");
  });

  it("shows Updating... and disables buttons while saving", async () => {
    let resolveUpdate;

    mocks.updateUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );

    const { user, cancel, submit } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    expect(
      screen.getByRole("button", {
        name: "Updating...",
      })
    ).toBeDisabled();

    expect(cancel()).toBeDisabled();

    resolveUpdate({ error: null });

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent("Your password has been changed.");
  });

  it("re-enables buttons after an update error", async () => {
    mocks.updateUser.mockRejectedValue(
      new Error("Network error")
    );

    const { user, submit, cancel } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    await screen.findByRole("alert");

    expect(submit()).toBeEnabled();
    expect(cancel()).toBeEnabled();
  });
});

describe("Cancelling changes", () => {
  it("clears both password fields when Cancel is clicked", async () => {
    const { user, newPassword, confirmPassword, cancel } =
      renderSecurityTab();

    await fillPasswords(user);

    await user.click(cancel());

    expect(newPassword()).toHaveValue("");
    expect(confirmPassword()).toHaveValue("");
  });

  it("clears validation errors when Cancel is clicked", async () => {
    const { user, cancel, submit } = renderSecurityTab();

    await fillPasswords(user, "Password123!", "Different123!");

    await user.click(submit());

    expect(
      await screen.findByRole("alert")
    ).toBeInTheDocument();

    await user.click(cancel());

    expect(
      screen.queryByRole("alert")
    ).not.toBeInTheDocument();
  });

  it("clears success feedback when Cancel is clicked", async () => {
    const { user, cancel, submit } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(submit());

    await screen.findByRole("status");

    await user.click(cancel());

    expect(
      screen.queryByRole("status")
    ).not.toBeInTheDocument();
  });

  it("does not call Supabase when Cancel is clicked", async () => {
    const { user, cancel } = renderSecurityTab();

    await fillPasswords(user);

    await user.click(cancel());

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});

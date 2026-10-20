
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("../../src/pages/Login/AuthLayout", () => ({
  default: ({ children }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

// Use a simple controlled password input so we can
// test ResetPassword independently of PasswordField.
vi.mock("../../src/pages/Login/PasswordField", () => ({
  default: ({
    id,
    label,
    value,
    onChange,
    placeholder,
    autoComplete,
    minLength,
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
    </div>
  ),
}));

import ResetPassword from "../../src/pages/Login/ResetPassword";

beforeEach(() => {
  vi.clearAllMocks();

  mocks.updateUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
});

function renderResetPassword() {
  const user = userEvent.setup();
  const onDone = vi.fn();
  const onCancel = vi.fn();

  render(
    <ResetPassword
      onDone={onDone}
      onCancel={onCancel}
    />
  );

  return { user, onDone, onCancel };
}

async function fillPasswords(user, password, confirmation) {
  await user.type(
    screen.getByLabelText("New password"),
    password
  );

  await user.type(
    screen.getByLabelText("Confirm new password"),
    confirmation
  );
}

describe("ResetPassword rendering", () => {
  it("renders the password reset page", () => {
    renderResetPassword();

    expect(
      screen.getByTestId("auth-layout")
    ).toBeInTheDocument();
  });

  it("displays the correct heading", () => {
    renderResetPassword();

    expect(
      screen.getByRole("heading", {
        name: "Choose a new password",
      })
    ).toBeInTheDocument();
  });

  it("displays password instructions", () => {
    renderResetPassword();

    expect(
      screen.getByText(/Use at least 8 characters/)
    ).toBeInTheDocument();
  });

  it("renders both password fields", () => {
    renderResetPassword();

    expect(
      screen.getByLabelText("New password")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Confirm new password")
    ).toBeInTheDocument();
  });

  it("hides both passwords by default", () => {
    renderResetPassword();

    expect(
      screen.getByLabelText("New password")
    ).toHaveAttribute("type", "password");

    expect(
      screen.getByLabelText("Confirm new password")
    ).toHaveAttribute("type", "password");
  });

  it("requires both password fields", () => {
    renderResetPassword();

    expect(
      screen.getByLabelText("New password")
    ).toBeRequired();

    expect(
      screen.getByLabelText("Confirm new password")
    ).toBeRequired();
  });

  it("sets the minimum password length to 8", () => {
    renderResetPassword();

    expect(
      screen.getByLabelText("New password")
    ).toHaveAttribute("minlength", "8");

    expect(
      screen.getByLabelText("Confirm new password")
    ).toHaveAttribute("minlength", "8");
  });

  it("uses new-password autocomplete", () => {
    renderResetPassword();

    expect(
      screen.getByLabelText("New password")
    ).toHaveAttribute(
      "autocomplete",
      "new-password"
    );

    expect(
      screen.getByLabelText("Confirm new password")
    ).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
  });

  it("renders the save button", () => {
    renderResetPassword();

    expect(
      screen.getByRole("button", {
        name: "Save new password",
      })
    ).toBeInTheDocument();
  });
});

describe("Password validation", () => {
  it("does not submit empty passwords", async () => {
    const { user } = renderResetPassword();

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("does not submit passwords shorter than 8 characters", async () => {
    const { user } = renderResetPassword();

    await fillPasswords(user, "short", "short");

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects passwords that do not match", async () => {
    const { user } = renderResetPassword();

    await fillPasswords(
      user,
      "Password123",
      "Different123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "The passwords do not match."
    );

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("accepts matching passwords of 8 characters", async () => {
    const { user } = renderResetPassword();

    await fillPasswords(user, "Pass1234", "Pass1234");

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledWith({
        password: "Pass1234",
      });
    });
  });

  it("treats passwords as case-sensitive", async () => {
    const { user } = renderResetPassword();

    await fillPasswords(
      user,
      "Password123",
      "password123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "The passwords do not match."
    );
  });
});

describe("Updating the password", () => {
  it("updates the password through Supabase", async () => {
    const { user } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledWith({
        password: "NewPassword123",
      });
    });
  });

  it("calls onDone after a successful update", async () => {
    const { user, onDone } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce();
    });
  });

  it("does not call onDone if Supabase returns an error", async () => {
    mocks.updateUser.mockResolvedValue({
      error: new Error("Password update failed"),
    });

    const { user, onDone } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Password update failed"
    );

    expect(onDone).not.toHaveBeenCalled();
  });

  it("uses the fallback error message", async () => {
    mocks.updateUser.mockResolvedValue({
      error: {},
    });

    const { user } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Could not change your password."
    );
  });

  it("disables the save button while updating", async () => {
    let resolveUpdate;

    mocks.updateUser.mockImplementation(
      () => new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );

    const { user } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Saving...",
      })
    ).toBeDisabled();

    resolveUpdate({ error: null });

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledOnce();
    });
  });

  it("re-enables the save button after an error", async () => {
    mocks.updateUser.mockResolvedValue({
      error: new Error("Network error"),
    });

    const { user } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Save new password",
        })
      ).toBeEnabled();
    });
  });
});

describe("Navigation", () => {
  it("renders the Back to sign in button", () => {
    renderResetPassword();

    expect(
      screen.getByRole("button", {
        name: "Back to sign in",
      })
    ).toBeInTheDocument();
  });

  it("calls onCancel when Back to sign in is clicked", async () => {
    const { user, onCancel } = renderResetPassword();

    await user.click(
      screen.getByRole("button", {
        name: "Back to sign in",
      })
    );

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not call onCancel when saving a password", async () => {
    const { user, onCancel } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("disables Back to sign in while saving", async () => {
    let resolveUpdate;

    mocks.updateUser.mockImplementation(
      () => new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );

    const { user } = renderResetPassword();

    await fillPasswords(
      user,
      "NewPassword123",
      "NewPassword123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save new password",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Back to sign in",
      })
    ).toBeDisabled();

    resolveUpdate({ error: null });

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledOnce();
    });
  });
});

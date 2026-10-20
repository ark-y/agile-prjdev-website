
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
    },
  },
}));

vi.mock("../../src/pages/Login/AuthLayout", () => ({
  default: ({ children }) => (
    <div data-testid="auth-layout">{children}</div>
  ),
}));

vi.mock("../../src/pages/Login/PasswordField", () => ({
  default: ({
    id,
    value,
    onChange,
    autoComplete,
    minLength,
  }) => (
    <div>
      <label htmlFor={id}>Password</label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
    </div>
  ),
}));

import Login from "../../src/pages/Login/Login";

beforeEach(() => {
  vi.clearAllMocks();

  mocks.signInWithPassword.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });

  mocks.signUp.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  mocks.resetPasswordForEmail.mockResolvedValue({
    error: null,
  });
});

function renderLogin(props = {}) {
  const user = userEvent.setup();

  render(<Login {...props} />);

  return user;
}

async function fillCredentials(user) {
  await user.type(
    screen.getByRole("textbox", { name: "Email" }),
    "  user@example.com  "
  );

  await user.type(
    screen.getByLabelText("Password"),
    "Password123"
  );
}

async function openSignup(user) {
  await user.click(
    screen.getByRole("button", {
      name: "Create an account",
    })
  );
}

async function openForgotPassword(user) {
  await user.click(
    screen.getByRole("button", {
      name: "Forgot password?",
    })
  );
}

describe("Login page rendering", () => {
  it("renders the login page", () => {
    renderLogin();

    expect(
      screen.getByTestId("auth-layout")
    ).toBeInTheDocument();
  });

  it("starts in sign-in mode", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Sign in",
      })
    ).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    renderLogin();

    expect(
      screen.getByRole("textbox", { name: "Email" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();
  });

  it("displays an initial link error", () => {
    renderLogin({
      linkError: "This reset link has expired.",
    });

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(
      "This reset link has expired."
    );
  });

  it("requires an email address", () => {
    renderLogin();

    expect(
      screen.getByRole("textbox", { name: "Email" })
    ).toBeRequired();
  });

  it("requires a password", () => {
    renderLogin();

    expect(
      screen.getByLabelText("Password")
    ).toBeRequired();
  });
});

describe("Signing in", () => {
  it("signs in with valid credentials", async () => {
    const user = renderLogin();

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    await waitFor(() => {
      expect(
        mocks.signInWithPassword
      ).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123",
      });
    });
  });

  it("does not sign in with an empty form", async () => {
    const user = renderLogin();

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    expect(
      mocks.signInWithPassword
    ).not.toHaveBeenCalled();
  });

  it("displays an authentication error", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: new Error("Invalid login credentials"),
    });

    const user = renderLogin();

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Invalid login credentials"
    );
  });

  it("uses the fallback error when no message exists", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      error: {},
    });

    const user = renderLogin();

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Could not sign in.");
  });

  it("disables the submit button while signing in", async () => {
    let resolveSignIn;

    mocks.signInWithPassword.mockImplementation(
      () => new Promise((resolve) => {
        resolveSignIn = resolve;
      })
    );

    const user = renderLogin();

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    expect(
      screen.getByRole("button", {
        name: "Signing in...",
      })
    ).toBeDisabled();

    resolveSignIn({ error: null });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Sign in",
        })
      ).toBeEnabled();
    });
  });
});

describe("Account creation", () => {
  it("switches to signup mode", async () => {
    const user = renderLogin();

    await openSignup(user);

    expect(
      screen.getByRole("heading", {
        name: "Create your account",
      })
    ).toBeInTheDocument();
  });

  it("displays first and last name fields", async () => {
    const user = renderLogin();

    await openSignup(user);

    expect(
      screen.getByRole("textbox", {
        name: "First name",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: "Last name",
      })
    ).toBeInTheDocument();
  });

  it("requires first and last names", async () => {
    const user = renderLogin();

    await openSignup(user);

    expect(
      screen.getByRole("textbox", {
        name: "First name",
      })
    ).toBeRequired();

    expect(
      screen.getByRole("textbox", {
        name: "Last name",
      })
    ).toBeRequired();
  });

  it("requires at least eight password characters", async () => {
    const user = renderLogin();

    await openSignup(user);

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("minlength", "8");
  });

  it("creates an account with valid information", async () => {
    const user = renderLogin();

    await openSignup(user);

    await user.type(
      screen.getByRole("textbox", {
        name: "First name",
      }),
      "Alex"
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Last name",
      }),
      "Smith"
    );

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", {
        name: "Create account",
      })
    );

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123",
        options: {
          data: {
            first_name: "Alex",
            last_name: "Smith",
          },
        },
      });
    });
  });

  it("displays email confirmation instructions", async () => {
    const user = renderLogin();

    await openSignup(user);

    await user.type(
      screen.getByRole("textbox", { name: "First name" }),
      "Alex"
    );

    await user.type(
      screen.getByRole("textbox", { name: "Last name" }),
      "Smith"
    );

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", {
        name: "Create account",
      })
    );

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent(
      "Check your email to confirm your account"
    );
  });

  it("displays a success message if signup creates a session", async () => {
    mocks.signUp.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });

    const user = renderLogin();

    await openSignup(user);

    await user.type(
      screen.getByRole("textbox", { name: "First name" }),
      "Alex"
    );

    await user.type(
      screen.getByRole("textbox", { name: "Last name" }),
      "Smith"
    );

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", {
        name: "Create account",
      })
    );

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent(
      "Account created. You are now signed in."
    );
  });

  it("displays signup errors", async () => {
    mocks.signUp.mockResolvedValue({
      data: null,
      error: new Error("Email already registered"),
    });

    const user = renderLogin();

    await openSignup(user);

    await user.type(
      screen.getByRole("textbox", { name: "First name" }),
      "Alex"
    );

    await user.type(
      screen.getByRole("textbox", { name: "Last name" }),
      "Smith"
    );

    await fillCredentials(user);

    await user.click(
      screen.getByRole("button", {
        name: "Create account",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Email already registered");
  });

  it("returns from signup to signin", async () => {
    const user = renderLogin();

    await openSignup(user);

    await user.click(
      screen.getByRole("button", { name: "Sign in" })
    );

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      })
    ).toBeInTheDocument();
  });
});

describe("Password reset", () => {
  it("switches to forgot-password mode", async () => {
    const user = renderLogin();

    await openForgotPassword(user);

    expect(
      screen.getByRole("heading", {
        name: "Reset your password",
      })
    ).toBeInTheDocument();
  });

  it("hides the password field in reset mode", async () => {
    const user = renderLogin();

    await openForgotPassword(user);

    expect(
      screen.queryByLabelText("Password")
    ).not.toBeInTheDocument();
  });

  it("sends a password reset request", async () => {
    const user = renderLogin();

    await openForgotPassword(user);

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send reset link",
      })
    );

    await waitFor(() => {
      expect(
        mocks.resetPasswordForEmail
      ).toHaveBeenCalledWith(
        "user@example.com",
        {
          redirectTo: window.location.origin,
        }
      );
    });
  });

  it("displays a neutral reset confirmation message", async () => {
    const user = renderLogin();

    await openForgotPassword(user);

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send reset link",
      })
    );

    expect(
      await screen.findByRole("status")
    ).toHaveTextContent(
      "If an account exists for that email"
    );
  });

  it("displays an error if reset fails", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: new Error("Reset service unavailable"),
    });

    const user = renderLogin();

    await openForgotPassword(user);

    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send reset link",
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(
      "Reset service unavailable"
    );
  });

  it("returns to sign in from reset mode", async () => {
    const user = renderLogin();

    await openForgotPassword(user);

    await user.click(
      screen.getByRole("button", {
        name: "Back to sign in",
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      })
    ).toBeInTheDocument();
  });
});

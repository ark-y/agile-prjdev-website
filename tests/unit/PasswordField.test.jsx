import { useState } from "react";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import PasswordField from "../../src/pages/Login/PasswordField";

function renderPasswordField(overrides = {}) {
  const onChange = vi.fn();
  const user = userEvent.setup();

  const props = {
    id: "password",
    value: "",
    onChange,
    autoComplete: "current-password",
    ...overrides,
  };

  const view = render(<PasswordField {...props} />);

  return { user, onChange, ...view };
}

describe("PasswordField rendering", () => {
  it("renders a password input", () => {
    renderPasswordField();

    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();
  });

  it("hides the password by default", () => {
    renderPasswordField();

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("type", "password");
  });

  it("displays the default label", () => {
    renderPasswordField();

    expect(
      screen.getByText("Password")
    ).toBeInTheDocument();
  });

  it("supports a custom label", () => {
    renderPasswordField({
      label: "Confirm password",
    });

    expect(
      screen.getByLabelText("Confirm password")
    ).toBeInTheDocument();
  });

  it("displays the default placeholder", () => {
    renderPasswordField();

    expect(
      screen.getByPlaceholderText("Enter your password")
    ).toBeInTheDocument();
  });

  it("supports a custom placeholder", () => {
    renderPasswordField({
      placeholder: "Choose a password",
    });

    expect(
      screen.getByPlaceholderText("Choose a password")
    ).toBeInTheDocument();
  });

  it("displays the supplied password value", () => {
    renderPasswordField({
      value: "Password123",
    });

    expect(
      screen.getByLabelText("Password")
    ).toHaveValue("Password123");
  });

  it("requires a password", () => {
    renderPasswordField();

    expect(
      screen.getByLabelText("Password")
    ).toBeRequired();
  });

  it("supports a minimum password length", () => {
    renderPasswordField({
      minLength: 8,
    });

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("minlength", "8");
  });

  it("uses the supplied autocomplete value", () => {
    renderPasswordField({
      autoComplete: "new-password",
    });

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
  });
});

describe("Password visibility", () => {
  it("displays the Show password button initially", () => {
    renderPasswordField();

    expect(
      screen.getByRole("button", {
        name: "Show password",
      })
    ).toBeInTheDocument();
  });

  it("shows the password when toggled", async () => {
    const { user } = renderPasswordField({
      value: "Password123",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Show password",
      })
    );

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("type", "text");

    expect(
      screen.getByRole("button", {
        name: "Hide password",
      })
    ).toBeInTheDocument();
  });

  it("hides the password when toggled twice", async () => {
    const { user } = renderPasswordField({
      value: "Password123",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Show password",
      })
    );

    await user.click(
      screen.getByRole("button", {
        name: "Hide password",
      })
    );

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("type", "password");
  });

  it("updates aria-pressed when visibility changes", async () => {
    const { user } = renderPasswordField();

    const button = screen.getByRole("button", {
      name: "Show password",
    });

    expect(button).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await user.click(button);

    expect(
      screen.getByRole("button", {
        name: "Hide password",
      })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("uses a non-submit button for visibility toggling", () => {
    renderPasswordField();

    expect(
      screen.getByRole("button", {
        name: "Show password",
      })
    ).toHaveAttribute("type", "button");
  });

  it("uses the correct accessible label for custom passwords", async () => {
    const { user } = renderPasswordField({
      label: "Confirm password",
    });

    expect(
      screen.getByRole("button", {
        name: "Show confirm password",
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Show confirm password",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Hide confirm password",
      })
    ).toBeInTheDocument();
  });
});

describe("Password input behaviour", () => {
  it("calls onChange when the password is typed", async () => {
    const { user, onChange } = renderPasswordField();

    await user.type(
      screen.getByLabelText("Password"),
      "abc"
    );

    expect(onChange).toHaveBeenCalled();

    expect(onChange).toHaveBeenLastCalledWith("c");
  });

  it("passes the full updated value with a controlled parent", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function ControlledPassword() {
      const [value, setValue] = useState("");

      return (
        <PasswordField
          id="password"
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
        />
      );
    }

    render(<ControlledPassword />);

    await user.type(
      screen.getByLabelText("Password"),
      "Password123"
    );

    expect(onChange).toHaveBeenLastCalledWith(
      "Password123"
    );

    expect(
      screen.getByLabelText("Password")
    ).toHaveValue("Password123");
  });
});

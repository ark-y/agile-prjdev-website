
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  IDLE,
  getPersonName,
  SettingsCard,
  Field,
  TextInput,
  SelectInput,
  SecretInput,
  Note,
  Feedback,
  CardActions,
} from "../../src/pages/Settings/parts";

vi.mock("../../src/components/Icons/Icons", () => ({
  default: ({ name, size }) => (
    <span data-testid={`icon-${name}`} data-size={size} />
  ),
}));

describe("Settings helpers", () => {
  it("provides the correct initial status", () => {
    expect(IDLE).toEqual({
      error: "",
      message: "",
      busy: false,
    });
  });

  it("uses the preferred name when available", () => {
    expect(
      getPersonName({
        user_pref_name: "Sam",
        user_first_name: "Sarah",
        user_last_name: "Jones",
        user_email: "sarah@example.com",
      })
    ).toBe("Sam");
  });

  it("combines first and last names", () => {
    expect(
      getPersonName({
        user_first_name: "Sarah",
        user_last_name: "Jones",
      })
    ).toBe("Sarah Jones");
  });

  it("uses only the first name when last name is missing", () => {
    expect(
      getPersonName({
        user_first_name: "Sarah",
      })
    ).toBe("Sarah");
  });

  it("uses only the last name when first name is missing", () => {
    expect(
      getPersonName({
        user_last_name: "Jones",
      })
    ).toBe("Jones");
  });

  it("falls back to email when no name exists", () => {
    expect(
      getPersonName({
        user_email: "sarah@example.com",
      })
    ).toBe("sarah@example.com");
  });
});

describe("SettingsCard", () => {
  it("renders its title", () => {
    render(<SettingsCard title="Profile" />);

    expect(
      screen.getByRole("heading", { name: "Profile" })
    ).toBeInTheDocument();
  });

  it("renders its subtitle", () => {
    render(
      <SettingsCard
        title="Profile"
        subtitle="Update your personal information"
      />
    );

    expect(
      screen.getByText("Update your personal information")
    ).toBeInTheDocument();
  });

  it("does not render a subtitle when omitted", () => {
    const { container } = render(
      <SettingsCard title="Profile" />
    );

    expect(
      container.querySelector("header p")
    ).not.toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <SettingsCard title="Profile">
        <span>Settings content</span>
      </SettingsCard>
    );

    expect(
      screen.getByText("Settings content")
    ).toBeInTheDocument();
  });

  it("renders a section when no onSubmit is supplied", () => {
    const { container } = render(
      <SettingsCard title="Profile" />
    );

    expect(
      container.querySelector("section.set-card")
    ).toBeInTheDocument();
  });

  it("renders a form when onSubmit is supplied", () => {
    const onSubmit = vi.fn((event) => event.preventDefault());

    const { container } = render(
      <SettingsCard title="Profile" onSubmit={onSubmit}>
        <button type="submit">Save</button>
      </SettingsCard>
    );

    expect(
      container.querySelector("form.set-card")
    ).toBeInTheDocument();
  });

  it("calls onSubmit when the form is submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(
      <SettingsCard title="Profile" onSubmit={onSubmit}>
        <button type="submit">Save</button>
      </SettingsCard>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("applies additional CSS classes", () => {
    const { container } = render(
      <SettingsCard title="Profile" className="custom-card" />
    );

    expect(
      container.querySelector(".set-card")
    ).toHaveClass("custom-card");
  });
});

describe("Field and TextInput", () => {
  it("renders a field label", () => {
    render(
      <Field id="first-name" label="First name">
        <TextInput id="first-name" />
      </Field>
    );

    expect(
      screen.getByLabelText("First name")
    ).toBeInTheDocument();
  });

  it("associates the label with the correct input", () => {
    render(
      <Field id="email" label="Email">
        <TextInput id="email" type="email" />
      </Field>
    );

    expect(
      screen.getByRole("textbox", { name: "Email" })
    ).toHaveAttribute("id", "email");
  });

  it("passes input properties through", () => {
    render(
      <TextInput
        id="username"
        placeholder="Enter username"
        maxLength={20}
        required
      />
    );

    const input = screen.getByPlaceholderText("Enter username");

    expect(input).toHaveAttribute("maxlength", "20");
    expect(input).toBeRequired();
  });

  it("allows users to type into a text input", async () => {
    const user = userEvent.setup();

    render(<TextInput id="name" aria-label="Name" />);

    const input = screen.getByRole("textbox", { name: "Name" });

    await user.type(input, "Alex");

    expect(input).toHaveValue("Alex");
  });

  it("applies the correct input CSS class", () => {
    render(<TextInput id="name" aria-label="Name" />);

    expect(
      screen.getByRole("textbox", { name: "Name" })
    ).toHaveClass("set-input");
  });
});

describe("SelectInput", () => {
  it("renders a select element", () => {
    render(
      <SelectInput id="role" aria-label="Role">
        <option value="admin">Admin</option>
        <option value="developer">Developer</option>
      </SelectInput>
    );

    expect(
      screen.getByRole("combobox", { name: "Role" })
    ).toBeInTheDocument();
  });

  it("renders its options", () => {
    render(
      <SelectInput id="role" aria-label="Role">
        <option value="admin">Admin</option>
        <option value="developer">Developer</option>
      </SelectInput>
    );

    expect(
      screen.getByRole("option", { name: "Admin" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: "Developer" })
    ).toBeInTheDocument();
  });

  it("allows selection changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SelectInput id="role" aria-label="Role" onChange={onChange}>
        <option value="admin">Admin</option>
        <option value="developer">Developer</option>
      </SelectInput>
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Role" }),
      "developer"
    );

    expect(
      screen.getByRole("combobox", { name: "Role" })
    ).toHaveValue("developer");

    expect(onChange).toHaveBeenCalledOnce();
  });

  it("applies the select CSS classes", () => {
    render(
      <SelectInput id="role" aria-label="Role">
        <option>Admin</option>
      </SelectInput>
    );

    expect(
      screen.getByRole("combobox", { name: "Role" })
    ).toHaveClass("set-input", "set-select");
  });
});

describe("SecretInput", () => {
  it("hides passwords by default", () => {
    render(<SecretInput id="password" aria-label="Password" />);

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("type", "password");
  });

  it("shows the password when toggled", async () => {
    const user = userEvent.setup();

    render(<SecretInput id="password" aria-label="Password" />);

    await user.click(
      screen.getByRole("button", { name: "Show password" })
    );

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("type", "text");
  });

  it("hides the password again when toggled twice", async () => {
    const user = userEvent.setup();

    render(<SecretInput id="password" aria-label="Password" />);

    await user.click(
      screen.getByRole("button", { name: "Show password" })
    );

    await user.click(
      screen.getByRole("button", { name: "Hide password" })
    );

    expect(
      screen.getByLabelText("Password")
    ).toHaveAttribute("type", "password");
  });

  it("updates the toggle button accessible label", async () => {
    const user = userEvent.setup();

    render(<SecretInput id="password" aria-label="Password" />);

    const button = screen.getByRole("button", {
      name: "Show password",
    });

    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(
      screen.getByRole("button", { name: "Hide password" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("allows users to enter passwords", async () => {
    const user = userEvent.setup();

    render(<SecretInput id="password" aria-label="Password" />);

    await user.type(
      screen.getByLabelText("Password"),
      "Password123!"
    );

    expect(
      screen.getByLabelText("Password")
    ).toHaveValue("Password123!");
  });

  it("does not submit a form when visibility is toggled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <SecretInput id="password" aria-label="Password" />
        <button type="submit">Save</button>
      </form>
    );

    await user.click(
      screen.getByRole("button", { name: "Show password" })
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("Note", () => {
  it("renders informational text", () => {
    render(<Note>Passwords must be at least 8 characters.</Note>);

    expect(
      screen.getByText("Passwords must be at least 8 characters.")
    ).toBeInTheDocument();
  });

  it("renders the information icon", () => {
    render(<Note>Important information</Note>);

    expect(
      screen.getByTestId("icon-info")
    ).toBeInTheDocument();
  });
});

describe("Feedback", () => {
  it("renders an error message", () => {
    render(
      <Feedback
        status={{
          error: "Something went wrong",
          message: "",
        }}
      />
    );

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent("Something went wrong");
  });

  it("renders a success message", () => {
    render(
      <Feedback
        status={{
          error: "",
          message: "Changes saved",
        }}
      />
    );

    expect(
      screen.getByRole("status")
    ).toHaveTextContent("Changes saved");
  });

  it("renders both messages when both are present", () => {
    render(
      <Feedback
        status={{
          error: "An error occurred",
          message: "Previous changes saved",
        }}
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders no messages when status is idle", () => {
    render(<Feedback status={IDLE} />);

    expect(
      screen.queryByRole("alert")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("status")
    ).not.toBeInTheDocument();
  });
});

describe("CardActions", () => {
  const defaultProps = {
    onCancel: vi.fn(),
    submitLabel: "Save changes",
    busyLabel: "Saving...",
    busy: false,
    disabled: false,
  };

  it("renders Cancel and Save buttons", () => {
    render(<CardActions {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <CardActions {...defaultProps} onCancel={onCancel} />
    );

    await user.click(
      screen.getByRole("button", { name: "Cancel" })
    );

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows the busy label while submitting", () => {
    render(
      <CardActions {...defaultProps} busy />
    );

    expect(
      screen.getByRole("button", { name: "Saving..." })
    ).toBeInTheDocument();
  });

  it("disables both buttons while busy", () => {
    render(
      <CardActions {...defaultProps} busy />
    );

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Saving..." })
    ).toBeDisabled();
  });

  it("disables only Save when disabled is true", () => {
    render(
      <CardActions {...defaultProps} disabled />
    );

    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeEnabled();
  });

  it("uses the correct button types", () => {
    render(<CardActions {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toHaveAttribute("type", "button");

    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toHaveAttribute("type", "submit");
  });
});

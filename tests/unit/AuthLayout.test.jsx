
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("../../src/components/QuantixLogo/QuantixLogo", () => ({
  default: ({ variant }) => (
    <div data-testid="quantix-logo" data-variant={variant}>
      Quantix
    </div>
  ),
}));

import AuthLayout from "../../src/pages/Login/AuthLayout";

describe("AuthLayout", () => {
  it("renders the main login layout", () => {
    const { container } = render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    expect(
      container.querySelector(".login-page")
    ).toBeInTheDocument();

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the Quantix logo", () => {
    render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    expect(
      screen.getByTestId("quantix-logo")
    ).toBeInTheDocument();
  });

  it("uses the text logo variant", () => {
    render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    expect(
      screen.getByTestId("quantix-logo")
    ).toHaveAttribute("data-variant", "text");
  });

  it("renders the logo inside the header", () => {
    render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    const header = screen.getByRole("banner");

    expect(
      within(header).getByTestId("quantix-logo")
    ).toBeInTheDocument();
  });

  it("renders children inside the login card", () => {
    const { container } = render(
      <AuthLayout>
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" />
        </form>
      </AuthLayout>
    );

    const card = container.querySelector(".login-card-wrap");

    expect(card).toBeInTheDocument();

    expect(
      within(card).getByRole("textbox", { name: "Email" })
    ).toBeInTheDocument();
  });

  it("renders multiple child elements", () => {
    render(
      <AuthLayout>
        <h1>Welcome back</h1>
        <p>Sign in to your account</p>
      </AuthLayout>
    );

    expect(
      screen.getByRole("heading", { name: "Welcome back" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Sign in to your account")
    ).toBeInTheDocument();
  });

  it("renders the footer", () => {
    render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    expect(
      screen.getByRole("contentinfo")
    ).toBeInTheDocument();
  });

  it("displays the correct footer text", () => {
    render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    expect(
      screen.getByText("Projects, sprints and conversations.")
    ).toBeInTheDocument();

    expect(
      screen.getByText("One shared workspace.")
    ).toBeInTheDocument();
  });

  it("uses the correct footer CSS class", () => {
    render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    expect(
      screen.getByRole("contentinfo")
    ).toHaveClass("login-note");
  });

  it("renders without children", () => {
    const { container } = render(<AuthLayout />);

    expect(
      container.querySelector(".login-card-wrap")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("quantix-logo")
    ).toBeInTheDocument();
  });

  it("keeps the header, content and footer in order", () => {
    const { container } = render(
      <AuthLayout>
        <p>Login form</p>
      </AuthLayout>
    );

    const main = container.querySelector(".login-page");

    expect(main.children[0]).toHaveClass("login-brand");
    expect(main.children[1]).toHaveClass("login-card-wrap");
    expect(main.children[2]).toHaveClass("login-note");
  });
});

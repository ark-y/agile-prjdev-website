
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import QuantixLogo from "../../src/components/QuantixLogo/QuantixLogo";

describe("QuantixLogo", () => {

  it("renders the default text logo", () => {
    const { container } = render(<QuantixLogo />);

    expect(screen.getByText("Quantix")).toBeInTheDocument();
    expect(screen.getByText("services")).toBeInTheDocument();

    expect(
      container.querySelector(".quantix-logo-text")
    ).toBeInTheDocument();
  });

  it("renders the text variant explicitly", () => {
    const { container } = render(
      <QuantixLogo variant="text" />
    );

    expect(
      container.querySelector(".quantix-logo-text")
    ).toBeInTheDocument();

    expect(screen.getByText("services")).toBeInTheDocument();
  });

  it("renders the stacked logo", () => {
    const { container } = render(
      <QuantixLogo variant="stacked" />
    );

    expect(screen.getByText("Quantix")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Q")).toBeInTheDocument();

    expect(
      container.querySelector(".quantix-logo-stacked")
    ).toBeInTheDocument();
  });

  it("renders the client logo", () => {
    const { container } = render(
      <QuantixLogo variant="client" />
    );

    expect(screen.getByText("Quantix")).toBeInTheDocument();
    expect(
      screen.getByText("Client workspace")
    ).toBeInTheDocument();

    expect(
      container.querySelector(".quantix-logo-client")
    ).toBeInTheDocument();
  });

  it("uses the correct classes for the client variant", () => {
    const { container } = render(
      <QuantixLogo variant="client" />
    );

    const logo = container.querySelector(".quantix-logo");

    expect(logo).toHaveClass(
      "quantix-logo",
      "quantix-logo-stacked",
      "quantix-logo-client"
    );
  });

  it("hides the decorative Q from screen readers", () => {
    const { container } = render(
      <QuantixLogo variant="stacked" />
    );

    const tile = container.querySelector(".quantix-tile");

    expect(tile).toHaveTextContent("Q");
    expect(tile).toHaveAttribute("aria-hidden", "true");
  });

  it("does not display the Q tile in text mode", () => {
    const { container } = render(<QuantixLogo />);

    expect(
      container.querySelector(".quantix-tile")
    ).not.toBeInTheDocument();
  });

  it("falls back to the text logo for an unknown variant", () => {
    const { container } = render(
      <QuantixLogo variant="unknown" />
    );

    expect(
      container.querySelector(".quantix-logo-text")
    ).toBeInTheDocument();

    expect(screen.getByText("services")).toBeInTheDocument();
  });

});

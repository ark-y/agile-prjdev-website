
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateProjectForm from "../../src/components/CreateProjectForm/CreateProjectForm";

describe("CreateProjectForm", () => {
  let onCreate;
  let onCancel;

  beforeEach(() => {
    onCreate = vi.fn().mockResolvedValue(undefined);
    onCancel = vi.fn();
  });

  function renderForm() {
    const user = userEvent.setup();

    render(
      <CreateProjectForm
        onCreate={onCreate}
        onCancel={onCancel}
      />
    );

    return user;
  }

  it("displays the project creation form", () => {
    renderForm();

    expect(
      screen.getByRole("heading", { name: "Create Project" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Project Name")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Description")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Create Project" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();
  });

  it("allows users to enter a project name", async () => {
    const user = renderForm();

    const nameInput = screen.getByLabelText("Project Name");

    await user.type(nameInput, "Quantix");

    expect(nameInput).toHaveValue("Quantix");
  });

  it("allows users to enter a description", async () => {
    const user = renderForm();

    const descriptionInput = screen.getByLabelText("Description");

    await user.type(
      descriptionInput,
      "Project management website"
    );

    expect(descriptionInput).toHaveValue(
      "Project management website"
    );
  });

  it("rejects an empty project name", async () => {
    const user = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent("Enter a project name.");

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("rejects a name containing only spaces", async () => {
    const user = renderForm();

    await user.type(
      screen.getByLabelText("Project Name"),
      "   "
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    expect(
      screen.getByRole("alert")
    ).toHaveTextContent("Enter a project name.");

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("creates a project with valid information", async () => {
    const user = renderForm();

    await user.type(
      screen.getByLabelText("Project Name"),
      "Quantix"
    );

    await user.type(
      screen.getByLabelText("Description"),
      "Project management website"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        name: "Quantix",
        description: "Project management website",
      });
    });

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("allows project creation without a description", async () => {
    const user = renderForm();

    await user.type(
      screen.getByLabelText("Project Name"),
      "New Project"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        name: "New Project",
        description: "",
      });
    });
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Cancel" })
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("displays an error when project creation fails", async () => {
    onCreate.mockRejectedValue(
      new Error("Permission denied")
    );

    const user = renderForm();

    await user.type(
      screen.getByLabelText("Project Name"),
      "Quantix"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Permission denied");
  });

  it("displays a fallback error message", async () => {
    onCreate.mockRejectedValue({});

    const user = renderForm();

    await user.type(
      screen.getByLabelText("Project Name"),
      "Quantix"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent("Could not create the project.");
  });

  it("disables buttons while creating a project", async () => {
    let finishCreating;

    onCreate.mockImplementation(
      () => new Promise((resolve) => {
        finishCreating = resolve;
      })
    );

    const user = renderForm();

    await user.type(
      screen.getByLabelText("Project Name"),
      "Quantix"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    expect(
      screen.getByRole("button", { name: "Creating..." })
    ).toBeDisabled();

    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeDisabled();

    finishCreating();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create Project" })
      ).toBeEnabled();
    });
  });

  it("prevents duplicate submissions while saving", async () => {
    let finishCreating;

    onCreate.mockImplementation(
      () => new Promise((resolve) => {
        finishCreating = resolve;
      })
    );

    const user = renderForm();

    await user.type(
      screen.getByLabelText("Project Name"),
      "Quantix"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    expect(
      screen.getByRole("button", { name: "Creating..." })
    ).toBeDisabled();

    expect(onCreate).toHaveBeenCalledTimes(1);

    finishCreating();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create Project" })
      ).toBeEnabled();
    });

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("clears a previous validation error on valid submission", async () => {
    const user = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    expect(
      screen.getByRole("alert")
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Project Name"),
      "Quantix"
    );

    await user.click(
      screen.getByRole("button", { name: "Create Project" })
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("alert")
      ).not.toBeInTheDocument();
    });
  });
});

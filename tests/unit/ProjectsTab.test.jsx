
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProjectsTab from "../../src/pages/Settings/ProjectsTab";

const projects = [
  {
    project_id: "1",
    project_name: "Website Redesign",
  },
  {
    project_id: "2",
    project_name: "Mobile Application",
  },
  {
    project_id: "3",
    project_name: "Database Migration",
  },
];

let onCreateProject;
let onRenameProject;

beforeEach(() => {
  onCreateProject = vi.fn().mockResolvedValue({});
  onRenameProject = vi.fn().mockResolvedValue({});
});

function renderProjectsTab(overrides = {}) {
  const user = userEvent.setup();

  const props = {
    projects,
    onCreateProject,
    onRenameProject,
    ...overrides,
  };

  render(<ProjectsTab {...props} />);

  const cards = {
    create: () =>
      screen
        .getByRole("heading", {
          name: "Create new project",
        })
        .closest(".set-card"),

    rename: () =>
      screen
        .getByRole("heading", {
          name: "Rename a project",
        })
        .closest(".set-card"),
  };

  return { user, cards };
}

async function selectProject(user, cards, projectId = "1") {
  await user.selectOptions(
    within(cards.rename()).getByLabelText("Project"),
    projectId
  );
}

describe("ProjectsTab rendering", () => {
  it("renders both settings cards", () => {
    const { cards } = renderProjectsTab();

    expect(cards.create()).toBeInTheDocument();
    expect(cards.rename()).toBeInTheDocument();
  });

  it("displays the create project heading", () => {
    renderProjectsTab();

    expect(
      screen.getByRole("heading", {
        name: "Create new project",
      })
    ).toBeInTheDocument();
  });

  it("displays the rename project heading", () => {
    renderProjectsTab();

    expect(
      screen.getByRole("heading", {
        name: "Rename a project",
      })
    ).toBeInTheDocument();
  });

  it("renders the create project description", () => {
    renderProjectsTab();

    expect(
      screen.getByText(
        /Start with a name. You can add developers/
      )
    ).toBeInTheDocument();
  });

  it("renders the rename project description", () => {
    renderProjectsTab();

    expect(
      screen.getByText(
        "Pick a project and give it a new name."
      )
    ).toBeInTheDocument();
  });

  it("renders the project name field", () => {
    const { cards } = renderProjectsTab();

    expect(
      within(cards.create()).getByLabelText("Project name")
    ).toBeInTheDocument();
  });

  it("renders all project options", () => {
    const { cards } = renderProjectsTab();

    for (const project of projects) {
      expect(
        within(cards.rename()).getByRole("option", {
          name: project.project_name,
        })
      ).toBeInTheDocument();
    }
  });

  it("shows a placeholder option for project selection", () => {
    const { cards } = renderProjectsTab();

    expect(
      within(cards.rename()).getByRole("option", {
        name: "Select a project",
      })
    ).toBeInTheDocument();
  });

  it("disables the new name field until a project is selected", () => {
    const { cards } = renderProjectsTab();

    expect(
      within(cards.rename()).getByLabelText("New name")
    ).toBeDisabled();
  });

  it("disables Save name initially", () => {
    const { cards } = renderProjectsTab();

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    ).toBeDisabled();
  });
});

describe("Creating projects", () => {
  it("allows entering a project name", async () => {
    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    expect(
      within(cards.create()).getByLabelText("Project name")
    ).toHaveValue("New Project");
  });

  it("creates a project with the correct details", async () => {
    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    await waitFor(() => {
      expect(onCreateProject).toHaveBeenCalledWith({
        name: "New Project",
        description: "",
      });
    });
  });

  it("does not create a project with an empty name", async () => {
    const { user, cards } = renderProjectsTab();

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    expect(onCreateProject).not.toHaveBeenCalled();
  });

  it("shows a validation error for whitespace-only names", async () => {
    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "   "
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    expect(
      await within(cards.create()).findByRole("alert")
    ).toHaveTextContent("Enter a project name.");

    expect(onCreateProject).not.toHaveBeenCalled();
  });

  it("shows an error when project creation fails", async () => {
    onCreateProject.mockRejectedValue(
      new Error("Database error")
    );

    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    expect(
      await within(cards.create()).findByRole("alert")
    ).toHaveTextContent("Database error");
  });

  it("shows a fallback error when creation fails without a message", async () => {
    onCreateProject.mockRejectedValue({});

    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    expect(
      await within(cards.create()).findByRole("alert")
    ).toHaveTextContent("Could not create the project.");
  });

  it("clears the create form when Cancel is clicked", async () => {
    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "Temporary Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.create()).getByLabelText("Project name")
    ).toHaveValue("");
  });

  it("clears creation errors when Cancel is clicked", async () => {
    onCreateProject.mockRejectedValue(
      new Error("Creation failed")
    );

    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    expect(
      await within(cards.create()).findByRole("alert")
    ).toBeInTheDocument();

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.create()).queryByRole("alert")
    ).not.toBeInTheDocument();
  });

  it("shows Creating... while the request is pending", async () => {
    let resolveCreate;

    onCreateProject.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
    );

    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    expect(
      within(cards.create()).getByRole("button", {
        name: "Creating...",
      })
    ).toBeDisabled();

    expect(
      within(cards.create()).getByRole("button", {
        name: "Cancel",
      })
    ).toBeDisabled();

    resolveCreate({});

    await waitFor(() => {
      expect(onCreateProject).toHaveBeenCalledOnce();
    });
  });

  it("keeps the create form busy after a successful request", async () => {
    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    await waitFor(() => {
      expect(onCreateProject).toHaveBeenCalledOnce();
    });

    expect(
      within(cards.create()).getByRole("button", {
        name: "Creating...",
      })
    ).toBeDisabled();
  });

  it("re-enables the form after a creation error", async () => {
    onCreateProject.mockRejectedValue(
      new Error("Creation failed")
    );

    const { user, cards } = renderProjectsTab();

    await user.type(
      within(cards.create()).getByLabelText("Project name"),
      "New Project"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    );

    await within(cards.create()).findByRole("alert");

    expect(
      within(cards.create()).getByRole("button", {
        name: "Create project",
      })
    ).toBeEnabled();
  });
});

describe("Renaming projects", () => {
  it("enables the new name field after selecting a project", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    expect(
      within(cards.rename()).getByLabelText("New name")
    ).toBeEnabled();
  });

  it("populates the current project name when selected", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    expect(
      within(cards.rename()).getByLabelText("New name")
    ).toHaveValue("Website Redesign");
  });

  it("updates the name when switching projects", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards, "1");
    await selectProject(user, cards, "2");

    expect(
      within(cards.rename()).getByLabelText("New name")
    ).toHaveValue("Mobile Application");
  });

  it("keeps Save name disabled when the name is unchanged", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    ).toBeDisabled();
  });

  it("enables Save name when the name changes", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Website");

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    ).toBeEnabled();
  });

  it("renames the selected project", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards, "2");

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Mobile App");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    );

    await waitFor(() => {
      expect(onRenameProject).toHaveBeenCalledWith(
        "2",
        "Updated Mobile App"
      );
    });
  });

  it("shows success feedback after renaming", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Website");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    );

    expect(
      await within(cards.rename()).findByRole("status")
    ).toHaveTextContent("Project name updated.");
  });

  it("shows an error if renaming fails", async () => {
    onRenameProject.mockRejectedValue(
      new Error("Rename failed")
    );

    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Website");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    );

    expect(
      await within(cards.rename()).findByRole("alert")
    ).toHaveTextContent("Rename failed");
  });

  it("shows a fallback error when renaming fails without a message", async () => {
    onRenameProject.mockRejectedValue({});

    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Website");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    );

    expect(
      await within(cards.rename()).findByRole("alert")
    ).toHaveTextContent("Could not rename the project.");
  });

  it("clears the rename form when Cancel is clicked", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.rename()).getByLabelText("Project")
    ).toHaveValue("");

    expect(
      within(cards.rename()).getByLabelText("New name")
    ).toHaveValue("");
  });

  it("disables the new name field again after cancelling", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.rename()).getByLabelText("New name")
    ).toBeDisabled();
  });

  it("clears rename feedback when Cancel is clicked", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Website");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    );

    await within(cards.rename()).findByRole("status");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.rename()).queryByRole("status")
    ).not.toBeInTheDocument();
  });

  it("disables Save name when the new name is whitespace", async () => {
    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "   ");

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    ).toBeDisabled();
  });

  it("shows Saving... while renaming is pending", async () => {
    let resolveRename;

    onRenameProject.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRename = resolve;
        })
    );

    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Website");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    );

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Saving...",
      })
    ).toBeDisabled();

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Cancel",
      })
    ).toBeDisabled();

    resolveRename({});

    expect(
      await within(cards.rename()).findByRole("status")
    ).toHaveTextContent("Project name updated.");
  });

  it("re-enables Save name after a rename error", async () => {
    onRenameProject.mockRejectedValue(
      new Error("Rename failed")
    );

    const { user, cards } = renderProjectsTab();

    await selectProject(user, cards);

    const input = within(cards.rename()).getByLabelText("New name");

    await user.clear(input);
    await user.type(input, "Updated Website");

    await user.click(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    );

    await within(cards.rename()).findByRole("alert");

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    ).toBeEnabled();
  });

  it("does not rename when no project is selected", () => {
    const { cards } = renderProjectsTab();

    expect(
      within(cards.rename()).getByRole("button", {
        name: "Save name",
      })
    ).toBeDisabled();

    expect(onRenameProject).not.toHaveBeenCalled();
  });
});

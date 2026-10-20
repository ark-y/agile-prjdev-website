
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  createProjectMember: vi.fn(),
  addProjectMember: vi.fn(),
  fetchProjectMemberCandidates: vi.fn(),
  removeProjectMember: vi.fn(),
  fetchProjectMembers: vi.fn(),
}));

vi.mock("../../src/services/memberProvisioning", () => ({
  createProjectMember: mocks.createProjectMember,
}));

vi.mock("../../src/services/serviceHelpers", () => ({
  addProjectMember: mocks.addProjectMember,
  fetchProjectMemberCandidates: mocks.fetchProjectMemberCandidates,
  removeProjectMember: mocks.removeProjectMember,
}));

vi.mock("../../src/services/taskServices", () => ({
  fetchProjectMembers: mocks.fetchProjectMembers,
}));

vi.mock("../../src/components/Icons/Icons", () => ({
  default: ({ name }) => (
    <span data-testid={`icon-${name}`} />
  ),
}));

import PeopleTab from "../../src/pages/Settings/PeopleTab";

const projects = [
  {
    project_id: "1",
    project_name: "Website Redesign",
    project_created_by: "admin-1",
  },
  {
    project_id: "2",
    project_name: "Mobile Application",
    project_created_by: "admin-2",
  },
];

const candidates = [
  {
    user_id: "dev-1",
    user_first_name: "Sarah",
    user_last_name: "Jones",
    user_email: "sarah@example.com",
    role_name: "Developer",
  },
  {
    user_id: "dev-2",
    user_pref_name: "Alex",
    user_email: "alex@example.com",
    role_name: "Developer",
  },
  {
    user_id: "client-1",
    user_first_name: "Chris",
    user_last_name: "Client",
    user_email: "chris@example.com",
    role_name: "Client",
  },
];

const members = [
  {
    user_id: "dev-1",
    user_first_name: "Sarah",
    user_last_name: "Jones",
    user_email: "sarah@example.com",
    role: { role_name: "Developer" },
  },
  {
    user_id: "dev-2",
    user_pref_name: "Alex",
    user_email: "alex@example.com",
    role: { role_name: "Developer" },
  },
  {
    user_id: "client-1",
    user_first_name: "Chris",
    user_last_name: "Client",
    user_email: "chris@example.com",
    role: { role_name: "Client" },
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  mocks.createProjectMember.mockResolvedValue({});
  mocks.addProjectMember.mockResolvedValue({});
  mocks.removeProjectMember.mockResolvedValue({});
  mocks.fetchProjectMemberCandidates.mockResolvedValue(candidates);
  mocks.fetchProjectMembers.mockResolvedValue(members);

  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderPeopleTab(role = "Developer", projectList = projects) {
  const user = userEvent.setup();

  const view = render(
    <PeopleTab role={role} projects={projectList} />
  );

  const cards = {
    existing: () =>
      screen
        .getByRole("heading", {
          name: `Add existing ${role.toLowerCase()}`,
        })
        .closest(".set-card"),

    create: () =>
      screen
        .getByRole("heading", {
          name: `Create new ${role.toLowerCase()}`,
        })
        .closest(".set-card"),

    manage: () =>
      screen
        .getByRole("heading", {
          name: `${role}s on a project`,
        })
        .closest(".set-card"),
  };

  return { user, cards, ...view };
}

async function selectExistingProject(user, cards, projectId = "1") {
  await user.selectOptions(
    within(cards.existing()).getByLabelText("Project"),
    projectId
  );
}

async function selectManageProject(user, cards, projectId = "1") {
  await user.selectOptions(
    within(cards.manage()).getByLabelText("Project"),
    projectId
  );
}

async function fillNewAccount(
  user,
  cards,
  {
    name = "Taylor Morgan",
    email = "taylor@example.com",
    password = "Password123!",
    confirmPassword = "Password123!",
    projectId = "1",
  } = {}
) {
  const card = cards.create();

  await user.type(
    within(card).getByLabelText("Full name"),
    name
  );

  await user.type(
    within(card).getByLabelText("Email address"),
    email
  );

  await user.type(
    within(card).getByLabelText("Password", { exact: true }),
    password
  );

  await user.type(
    within(card).getByLabelText("Confirm password"),
    confirmPassword
  );

  await user.selectOptions(
    within(card).getByLabelText("Add to project"),
    projectId
  );
}

describe("PeopleTab rendering", () => {
  it("renders all three settings cards", () => {
    const { cards } = renderPeopleTab();

    expect(cards.existing()).toBeInTheDocument();
    expect(cards.create()).toBeInTheDocument();
    expect(cards.manage()).toBeInTheDocument();
  });

  it("displays Developer labels", () => {
    renderPeopleTab("Developer");

    expect(
      screen.getByRole("heading", {
        name: "Add existing developer",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Create new developer",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Developers on a project",
      })
    ).toBeInTheDocument();
  });

  it("displays Client labels", () => {
    renderPeopleTab("Client");

    expect(
      screen.getByRole("heading", {
        name: "Add existing client",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Create new client",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Clients on a project",
      })
    ).toBeInTheDocument();
  });

  it("renders project options in all three cards", () => {
    renderPeopleTab();

    expect(
      screen.getAllByRole("option", {
        name: "Website Redesign",
      })
    ).toHaveLength(3);
  });

  it("shows a note explaining existing accounts", () => {
    renderPeopleTab();

    expect(
      screen.getByText(
        "This uses the existing account. No new login is created."
      )
    ).toBeInTheDocument();
  });

  it("disables account selection until a project is chosen", () => {
    const { cards } = renderPeopleTab();

    expect(
      within(cards.existing()).getByLabelText(
        "Existing developer"
      )
    ).toBeDisabled();
  });

  it("disables adding existing members initially", () => {
    const { cards } = renderPeopleTab();

    expect(
      within(cards.existing()).getByRole("button", {
        name: "Add developer",
      })
    ).toBeDisabled();
  });

  it("does not show members until a project is selected", () => {
    const { cards } = renderPeopleTab();

    expect(
      within(cards.manage()).queryByRole("list")
    ).not.toBeInTheDocument();
  });
});

describe("Existing account management", () => {
  it("loads candidates when a project is selected", async () => {
    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await waitFor(() => {
      expect(
        mocks.fetchProjectMemberCandidates
      ).toHaveBeenCalledWith("1");
    });
  });

  it("only displays Developer candidates", async () => {
    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    expect(
      await within(cards.existing()).findByRole("option", {
        name: /Sarah Jones/,
      })
    ).toBeInTheDocument();

    expect(
      within(cards.existing()).queryByRole("option", {
        name: /Chris Client/,
      })
    ).not.toBeInTheDocument();
  });

  it("only displays Client candidates", async () => {
    const { user, cards } = renderPeopleTab("Client");

    await selectExistingProject(user, cards);

    expect(
      await within(cards.existing()).findByRole("option", {
        name: /Chris Client/,
      })
    ).toBeInTheDocument();

    expect(
      within(cards.existing()).queryByRole("option", {
        name: /Sarah Jones/,
      })
    ).not.toBeInTheDocument();
  });

  it("enables adding after a candidate is selected", async () => {
    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await within(cards.existing()).findByRole("option", {
      name: /Sarah Jones/,
    });

    await user.selectOptions(
      within(cards.existing()).getByLabelText(
        "Existing developer"
      ),
      "dev-1"
    );

    expect(
      within(cards.existing()).getByRole("button", {
        name: "Add developer",
      })
    ).toBeEnabled();
  });

  it("adds an existing Developer to a project", async () => {
    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await within(cards.existing()).findByRole("option", {
      name: /Sarah Jones/,
    });

    await user.selectOptions(
      within(cards.existing()).getByLabelText(
        "Existing developer"
      ),
      "dev-1"
    );

    await user.click(
      within(cards.existing()).getByRole("button", {
        name: "Add developer",
      })
    );

    await waitFor(() => {
      expect(
        mocks.addProjectMember
      ).toHaveBeenCalledWith("1", "dev-1");
    });
  });

  it("shows a success message after adding", async () => {
    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await within(cards.existing()).findByRole("option", {
      name: /Sarah Jones/,
    });

    await user.selectOptions(
      within(cards.existing()).getByLabelText(
        "Existing developer"
      ),
      "dev-1"
    );

    await user.click(
      within(cards.existing()).getByRole("button", {
        name: "Add developer",
      })
    );

    expect(
      await within(cards.existing()).findByRole("status")
    ).toHaveTextContent(
      "Developer added to Website Redesign."
    );
  });

  it("shows an error if adding fails", async () => {
    mocks.addProjectMember.mockRejectedValue(
      new Error("Could not add member")
    );

    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await within(cards.existing()).findByRole("option", {
      name: /Sarah Jones/,
    });

    await user.selectOptions(
      within(cards.existing()).getByLabelText(
        "Existing developer"
      ),
      "dev-1"
    );

    await user.click(
      within(cards.existing()).getByRole("button", {
        name: "Add developer",
      })
    );

    expect(
      await within(cards.existing()).findByRole("alert")
    ).toHaveTextContent("Could not add member");
  });

  it("shows an error if candidates cannot load", async () => {
    mocks.fetchProjectMemberCandidates.mockRejectedValue(
      new Error("Database unavailable")
    );

    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    expect(
      await within(cards.existing()).findByRole("alert")
    ).toHaveTextContent("Database unavailable");
  });

  it("clears the selected project when cancelled", async () => {
    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await user.click(
      within(cards.existing()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.existing()).getByLabelText("Project")
    ).toHaveValue("");
  });

  it("clears candidate selection when cancelled", async () => {
    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await within(cards.existing()).findByRole("option", {
      name: /Sarah Jones/,
    });

    await user.selectOptions(
      within(cards.existing()).getByLabelText(
        "Existing developer"
      ),
      "dev-1"
    );

    await user.click(
      within(cards.existing()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.existing()).getByLabelText(
        "Existing developer"
      )
    ).toHaveValue("");
  });

  it("shows the empty candidates message", async () => {
    mocks.fetchProjectMemberCandidates.mockResolvedValue([]);

    const { user, cards } = renderPeopleTab();

    await selectExistingProject(user, cards);

    await waitFor(() => {
      expect(
        within(cards.existing()).getByRole("option", {
          name: "No developers left to add",
        })
      ).toBeInTheDocument();
    });
  });
});

describe("Creating new accounts", () => {
  it("renders the required account fields", () => {
    const { cards } = renderPeopleTab();

    const card = cards.create();

    expect(
      within(card).getByLabelText("Full name")
    ).toBeRequired();

    expect(
      within(card).getByLabelText("Email address")
    ).toBeRequired();

    expect(
      within(card).getByLabelText("Password", {
        exact: true,
      })
    ).toBeRequired();

    expect(
      within(card).getByLabelText("Confirm password")
    ).toBeRequired();

    expect(
      within(card).getByLabelText("Add to project")
    ).toBeRequired();
  });

  it("requires passwords of at least 8 characters", () => {
    const { cards } = renderPeopleTab();

    expect(
      within(cards.create()).getByLabelText("Password", {
        exact: true,
      })
    ).toHaveAttribute("minlength", "8");
  });

  it("creates a Developer account with the correct details", async () => {
    const { user, cards } = renderPeopleTab();

    await fillNewAccount(user, cards);

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create developer",
      })
    );

    await waitFor(() => {
      expect(
        mocks.createProjectMember
      ).toHaveBeenCalledWith({
        projectId: "1",
        role: "Developer",
        firstName: "Taylor",
        lastName: "Morgan",
        email: "taylor@example.com",
        password: "Password123!",
      });
    });
  });

  it("creates a Client account with the correct role", async () => {
    const { user, cards } = renderPeopleTab("Client");

    await fillNewAccount(user, cards);

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create client",
      })
    );

    await waitFor(() => {
      expect(
        mocks.createProjectMember
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "Client",
          projectId: "1",
        })
      );
    });
  });

  it("shows a success message after creating an account", async () => {
    const { user, cards } = renderPeopleTab();

    await fillNewAccount(user, cards);

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create developer",
      })
    );

    expect(
      await within(cards.create()).findByRole("status")
    ).toHaveTextContent(
      "Developer account created and added to Website Redesign."
    );
  });

  it("clears fields after successful creation", async () => {
    const { user, cards } = renderPeopleTab();

    await fillNewAccount(user, cards);

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create developer",
      })
    );

    await waitFor(() => {
      expect(
        within(cards.create()).getByLabelText("Full name")
      ).toHaveValue("");
    });

    expect(
      within(cards.create()).getByLabelText("Email address")
    ).toHaveValue("");

    expect(
      within(cards.create()).getByLabelText("Add to project")
    ).toHaveValue("");
  });

  it("shows an error if account creation fails", async () => {
    mocks.createProjectMember.mockRejectedValue(
      new Error("Email already registered")
    );

    const { user, cards } = renderPeopleTab();

    await fillNewAccount(user, cards);

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create developer",
      })
    );

    expect(
      await within(cards.create()).findByRole("alert")
    ).toHaveTextContent("Email already registered");
  });

  it("rejects mismatched passwords", async () => {
    const { user, cards } = renderPeopleTab();

    await fillNewAccount(user, cards, {
      confirmPassword: "Different123!",
    });

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create developer",
      })
    );

    expect(
      await within(cards.create()).findByRole("alert")
    ).toHaveTextContent("The passwords do not match.");

    expect(
      mocks.createProjectMember
    ).not.toHaveBeenCalled();
  });

  it("does not submit an empty form", async () => {
    const { user, cards } = renderPeopleTab();

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Create developer",
      })
    );

    expect(
      mocks.createProjectMember
    ).not.toHaveBeenCalled();
  });

  it("resets fields when Cancel is clicked", async () => {
    const { user, cards } = renderPeopleTab();

    await user.type(
      within(cards.create()).getByLabelText("Full name"),
      "Taylor Morgan"
    );

    await user.click(
      within(cards.create()).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(
      within(cards.create()).getByLabelText("Full name")
    ).toHaveValue("");
  });
});

describe("Managing project members", () => {
  it("loads members when a project is selected", async () => {
    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    await waitFor(() => {
      expect(
        mocks.fetchProjectMembers
      ).toHaveBeenCalledWith("1");
    });
  });

  it("only displays Developers in the Developer tab", async () => {
    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    expect(
      await within(cards.manage()).findByText("Sarah Jones")
    ).toBeInTheDocument();

    expect(
      within(cards.manage()).queryByText("Chris Client")
    ).not.toBeInTheDocument();
  });

  it("only displays Clients in the Client tab", async () => {
    const { user, cards } = renderPeopleTab("Client");

    await selectManageProject(user, cards);

    expect(
      await within(cards.manage()).findByText("Chris Client")
    ).toBeInTheDocument();

    expect(
      within(cards.manage()).queryByText("Sarah Jones")
    ).not.toBeInTheDocument();
  });

  it("displays member email addresses", async () => {
    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    expect(
      await within(cards.manage()).findByText(
        "sarah@example.com"
      )
    ).toBeInTheDocument();
  });

  it("asks for confirmation before removing a member", async () => {
    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    await within(cards.manage()).findByText("Sarah Jones");

    await user.click(
      within(cards.manage()).getByRole("button", {
        name: "Remove Sarah Jones from project",
      })
    );

    expect(window.confirm).toHaveBeenCalledWith(
      "Remove Sarah Jones from Website Redesign and unassign their tasks?"
    );
  });

  it("does not remove members when confirmation is cancelled", async () => {
    window.confirm.mockReturnValue(false);

    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    await within(cards.manage()).findByText("Sarah Jones");

    await user.click(
      within(cards.manage()).getByRole("button", {
        name: "Remove Sarah Jones from project",
      })
    );

    expect(
      mocks.removeProjectMember
    ).not.toHaveBeenCalled();
  });

  it("removes the selected member", async () => {
    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    await within(cards.manage()).findByText("Sarah Jones");

    await user.click(
      within(cards.manage()).getByRole("button", {
        name: "Remove Sarah Jones from project",
      })
    );

    await waitFor(() => {
      expect(
        mocks.removeProjectMember
      ).toHaveBeenCalledWith("1", "dev-1");
    });
  });

  it("shows a success message after removal", async () => {
    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    await within(cards.manage()).findByText("Sarah Jones");

    await user.click(
      within(cards.manage()).getByRole("button", {
        name: "Remove Sarah Jones from project",
      })
    );

    expect(
      await within(cards.manage()).findByRole("status")
    ).toHaveTextContent(
      "Sarah Jones was removed from Website Redesign."
    );
  });

  it("shows an error if removal fails", async () => {
    mocks.removeProjectMember.mockRejectedValue(
      new Error("Permission denied")
    );

    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    await within(cards.manage()).findByText("Sarah Jones");

    await user.click(
      within(cards.manage()).getByRole("button", {
        name: "Remove Sarah Jones from project",
      })
    );

    expect(
      await within(cards.manage()).findByRole("alert")
    ).toHaveTextContent("Permission denied");
  });

  it("shows an error if members cannot load", async () => {
    mocks.fetchProjectMembers.mockRejectedValue(
      new Error("Failed to load members")
    );

    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    expect(
      await within(cards.manage()).findByRole("alert")
    ).toHaveTextContent("Failed to load members");
  });

  it("shows an empty message when no members exist", async () => {
    mocks.fetchProjectMembers.mockResolvedValue([]);

    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    expect(
      await within(cards.manage()).findByText(
        "No developers are on this project yet."
      )
    ).toBeInTheDocument();
  });

  it("does not allow removing the project creator", async () => {
    mocks.fetchProjectMembers.mockResolvedValue([
      {
        user_id: "admin-1",
        user_first_name: "Project",
        user_last_name: "Creator",
        user_email: "creator@example.com",
        role: { role_name: "Developer" },
      },
    ]);

    const { user, cards } = renderPeopleTab();

    await selectManageProject(user, cards);

    await within(cards.manage()).findByText(
      "Project Creator"
    );

    expect(
      within(cards.manage()).queryByRole("button", {
        name: "Remove Project Creator from project",
      })
    ).not.toBeInTheDocument();
  });
});

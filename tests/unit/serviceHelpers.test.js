
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../../src/supabaseClient", () => ({
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    auth: {
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
    },
  },
}));

import {
  getCurrentProfileId,
  fetchCurrentProfile,
  fetchProjectMemberCandidates,
  addProjectMember,
  removeProjectMember,
  updateOwnName,
} from "../../src/services/serviceHelpers";

function mockQuery(result = { data: null, error: null }) {
  const q = {};

  for (const method of [
    "select",
    "eq",
    "single",
    "maybeSingle",
  ]) {
    q[method] = vi.fn(() => q);
  }

  q.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);

  return q;
}

beforeEach(() => {
  vi.resetAllMocks();

  mocks.getUser.mockResolvedValue({
    data: {
      user: { id: "user-123" },
    },
    error: null,
  });

  mocks.rpc.mockResolvedValue({
    data: null,
    error: null,
  });

  mocks.updateUser.mockResolvedValue({
    data: {},
    error: null,
  });
});

describe("getCurrentProfileId", () => {
  it("returns the signed-in user's profile ID", async () => {
    const q = mockQuery({
      data: { user_id: "user-123" },
      error: null,
    });

    mocks.from.mockReturnValue(q);

    expect(await getCurrentProfileId()).toBe("user-123");

    expect(mocks.from).toHaveBeenCalledWith("user");
    expect(q.select).toHaveBeenCalledWith("user_id");
    expect(q.eq).toHaveBeenCalledWith(
      "user_id",
      "user-123"
    );
    expect(q.maybeSingle).toHaveBeenCalled();
  });

  it("rejects users who are not signed in", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(getCurrentProfileId())
      .rejects.toThrow("Sign in before performing this action.");

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("handles authentication errors", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Authentication failed"),
    });

    await expect(getCurrentProfileId())
      .rejects.toThrow("Authentication failed");
  });

  it("handles database errors when fetching profiles", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Database unavailable"),
      })
    );

    await expect(getCurrentProfileId())
      .rejects.toThrow("Database unavailable");
  });

  it("rejects users without a matching profile", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: null,
      })
    );

    await expect(getCurrentProfileId())
      .rejects.toThrow("no matching public.user profile");
  });
});

describe("fetchCurrentProfile", () => {
  const validProfile = {
    user_id: "user-123",
    user_first_name: "Test",
    user_last_name: "User",
    user_email: "test@example.com",
    role: { role_name: "Developer" },
  };

  it("fetches a valid Developer profile", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: validProfile,
        error: null,
      })
    );

    const result = await fetchCurrentProfile();

    expect(result.role_name).toBe("Developer");
    expect(result.user_id).toBe("user-123");
  });

  it.each(["Admin", "Developer", "Client"])(
    "accepts the %s role",
    async (roleName) => {
      mocks.from.mockReturnValue(
        mockQuery({
          data: {
            ...validProfile,
            role: { role_name: roleName },
          },
          error: null,
        })
      );

      const result = await fetchCurrentProfile();

      expect(result.role_name).toBe(roleName);
    }
  );

  it("rejects invalid roles", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: {
          ...validProfile,
          role: { role_name: "Guest" },
        },
        error: null,
      })
    );

    await expect(fetchCurrentProfile())
      .rejects.toThrow("missing a valid Admin, Developer, or Client role");
  });

  it("rejects profiles without roles", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: {
          ...validProfile,
          role: null,
        },
        error: null,
      })
    );

    await expect(fetchCurrentProfile())
      .rejects.toThrow("missing a valid");
  });

  it("rejects unsigned-in users", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(fetchCurrentProfile())
      .rejects.toThrow("Sign in before accessing a profile.");
  });

  it("handles authentication errors", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Session expired"),
    });

    await expect(fetchCurrentProfile())
      .rejects.toThrow("Session expired");
  });

  it("handles profile database errors", async () => {
    mocks.from.mockReturnValue(
      mockQuery({
        data: null,
        error: new Error("Profile not found"),
      })
    );

    await expect(fetchCurrentProfile())
      .rejects.toThrow("Profile not found");
  });
});

describe("Project membership", () => {
  it("fetches project member candidates", async () => {
    const candidates = [
      { user_id: "u1" },
      { user_id: "u2" },
    ];

    mocks.rpc.mockResolvedValue({
      data: candidates,
      error: null,
    });

    expect(
      await fetchProjectMemberCandidates(5)
    ).toEqual(candidates);

    expect(mocks.rpc).toHaveBeenCalledWith(
      "list_project_member_candidates",
      { p_project_id: 5 }
    );
  });

  it("handles errors when fetching candidates", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Permission denied"),
    });

    await expect(fetchProjectMemberCandidates(5))
      .rejects.toThrow("Permission denied");
  });

  it("adds a project member", async () => {
    await expect(
      addProjectMember(5, "u1")
    ).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith(
      "add_project_member",
      {
        p_project_id: 5,
        p_user_id: "u1",
      }
    );
  });

  it("handles errors when adding members", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Cannot add member"),
    });

    await expect(addProjectMember(5, "u1"))
      .rejects.toThrow("Cannot add member");
  });

  it("removes a project member", async () => {
    await expect(
      removeProjectMember(5, "u1")
    ).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith(
      "remove_project_member",
      {
        p_project_id: 5,
        p_user_id: "u1",
      }
    );
  });

  it("handles errors when removing members", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("Cannot remove member"),
    });

    await expect(removeProjectMember(5, "u1"))
      .rejects.toThrow("Cannot remove member");
  });
});

describe("Updating profile names", () => {
  it("updates the user's first and last name", async () => {
    await updateOwnName({
      firstName: "Test",
      lastName: "User",
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "update_own_name",
      {
        p_first_name: "Test",
        p_last_name: "User",
      }
    );

    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: {
        first_name: "Test",
        last_name: "User",
      },
    });
  });

  it("handles database permission errors", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: "Permission denied",
      },
    });

    await expect(updateOwnName({
      firstName: "Test",
      lastName: "User",
    })).rejects.toThrow("Permission denied");

    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("detects missing database migrations", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PGRST202",
        message: "Function not found",
      },
    });

    await expect(updateOwnName({
      firstName: "Test",
      lastName: "User",
    })).rejects.toThrow(
      "20261009_update_own_name.sql"
    );
  });

  it("detects missing functions from error messages", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        message: "Could not find the function",
      },
    });

    await expect(updateOwnName({
      firstName: "Test",
      lastName: "User",
    })).rejects.toThrow("migration");
  });

  it("uses a fallback error message", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {},
    });

    await expect(updateOwnName({
      firstName: "Test",
      lastName: "User",
    })).rejects.toThrow("Could not update your name.");
  });

  it("does not fail if the auth metadata update fails", async () => {
    mocks.updateUser.mockResolvedValue({
      data: null,
      error: new Error("Metadata update failed"),
    });

    await expect(updateOwnName({
      firstName: "Test",
      lastName: "User",
    })).resolves.toBeUndefined();
  });
});

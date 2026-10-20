
import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

const VALID_URL = "https://example.supabase.co";
const VALID_KEY = "test-publishable-key";

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  vi.stubEnv("VITE_SUPABASE_URL", VALID_URL);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", VALID_KEY);

  mocks.createClient.mockReturnValue({
    auth: {},
    from: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function importClient() {
  return import("../../src/supabaseClient.js");
}

describe("Supabase environment configuration", () => {
  it("initializes successfully when both environment variables exist", async () => {
    await expect(importClient()).resolves.toHaveProperty(
      "supabase"
    );
  });

  it("throws an error when the Supabase URL is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");

    await expect(importClient()).rejects.toThrow(
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before starting the app."
    );
  });

  it("throws an error when the publishable key is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(importClient()).rejects.toThrow(
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before starting the app."
    );
  });

  it("throws an error when both environment variables are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(importClient()).rejects.toThrow(
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before starting the app."
    );
  });

  it("does not initialize Supabase when the URL is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");

    await expect(importClient()).rejects.toThrow();

    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("does not initialize Supabase when the key is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(importClient()).rejects.toThrow();

    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("does not initialize Supabase when both values are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(importClient()).rejects.toThrow();

    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("Supabase client initialization", () => {
  it("calls createClient with the correct URL and key", async () => {
    await importClient();

    expect(mocks.createClient).toHaveBeenCalledWith(
      VALID_URL,
      VALID_KEY
    );
  });

  it("initializes Supabase exactly once per module import", async () => {
    await importClient();

    expect(mocks.createClient).toHaveBeenCalledOnce();
  });

  it("exports the client returned by createClient", async () => {
    const fakeClient = {
      auth: { signOut: vi.fn() },
      from: vi.fn(),
    };

    mocks.createClient.mockReturnValue(fakeClient);

    const { supabase } = await importClient();

    expect(supabase).toBe(fakeClient);
  });

  it("exports a defined Supabase client", async () => {
    const { supabase } = await importClient();

    expect(supabase).toBeDefined();
  });

  it("uses a different valid URL when configured", async () => {
    const customUrl = "https://another-project.supabase.co";

    vi.stubEnv("VITE_SUPABASE_URL", customUrl);

    await importClient();

    expect(mocks.createClient).toHaveBeenCalledWith(
      customUrl,
      VALID_KEY
    );
  });

  it("uses a different publishable key when configured", async () => {
    const customKey = "another-publishable-key";

    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", customKey);

    await importClient();

    expect(mocks.createClient).toHaveBeenCalledWith(
      VALID_URL,
      customKey
    );
  });

  it("passes both custom environment values to createClient", async () => {
    const customUrl = "https://custom.supabase.co";
    const customKey = "custom-key";

    vi.stubEnv("VITE_SUPABASE_URL", customUrl);
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", customKey);

    await importClient();

    expect(mocks.createClient).toHaveBeenCalledWith(
      customUrl,
      customKey
    );
  });

  it("does not call createClient more than once when imported repeatedly", async () => {
    await importClient();
    await importClient();

    expect(mocks.createClient).toHaveBeenCalledOnce();
  });
});

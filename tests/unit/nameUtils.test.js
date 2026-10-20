
import { describe, expect, it } from "vitest";

import {
  splitFullName,
  joinName,
} from "../../src/utils/names.js";

describe("splitFullName", () => {
  it("splits a first and last name", () => {
    expect(splitFullName("John Smith")).toEqual({
      firstName: "John",
      lastName: "Smith",
    });
  });

  it("supports multiple first names", () => {
    expect(splitFullName("Mary Jane Watson")).toEqual({
      firstName: "Mary Jane",
      lastName: "Watson",
    });
  });

  it("uses the last word as the last name", () => {
    expect(splitFullName("John Michael David Smith")).toEqual({
      firstName: "John Michael David",
      lastName: "Smith",
    });
  });

  it("removes leading and trailing spaces", () => {
    expect(splitFullName("  John Smith  ")).toEqual({
      firstName: "John",
      lastName: "Smith",
    });
  });

  it("handles multiple spaces between names", () => {
    expect(splitFullName("John    Smith")).toEqual({
      firstName: "John",
      lastName: "Smith",
    });
  });

  it("handles tabs and newlines", () => {
    expect(splitFullName("John\t\nSmith")).toEqual({
      firstName: "John",
      lastName: "Smith",
    });
  });

  it("returns null for a single name", () => {
    expect(splitFullName("John")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(splitFullName("")).toBeNull();
  });

  it("returns null for whitespace only", () => {
    expect(splitFullName("   ")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(splitFullName(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(splitFullName(undefined)).toBeNull();
  });

  it("preserves capitalization", () => {
    expect(splitFullName("aLEx sMITH")).toEqual({
      firstName: "aLEx",
      lastName: "sMITH",
    });
  });

  it("supports hyphenated names", () => {
    expect(splitFullName("Anne-Marie Smith-Jones")).toEqual({
      firstName: "Anne-Marie",
      lastName: "Smith-Jones",
    });
  });
});

describe("joinName", () => {
  it("joins first and last names", () => {
    expect(
      joinName({
        user_first_name: "John",
        user_last_name: "Smith",
      })
    ).toBe("John Smith");
  });

  it("handles a missing first name", () => {
    expect(
      joinName({
        user_last_name: "Smith",
      })
    ).toBe("Smith");
  });

  it("handles a missing last name", () => {
    expect(
      joinName({
        user_first_name: "John",
      })
    ).toBe("John");
  });

  it("handles both names missing", () => {
    expect(joinName({})).toBe("");
  });

  it("handles null name fields", () => {
    expect(
      joinName({
        user_first_name: null,
        user_last_name: null,
      })
    ).toBe("");
  });

  it("handles empty name fields", () => {
    expect(
      joinName({
        user_first_name: "",
        user_last_name: "",
      })
    ).toBe("");
  });

  it("removes outer whitespace from the result", () => {
    expect(
      joinName({
        user_first_name: " John",
        user_last_name: "Smith ",
      })
    ).toBe("John Smith");
  });

  it("does not use the preferred name", () => {
    expect(
      joinName({
        user_first_name: "Alexander",
        user_last_name: "Smith",
        user_pref_name: "Alex",
      })
    ).toBe("Alexander Smith");
  });
});

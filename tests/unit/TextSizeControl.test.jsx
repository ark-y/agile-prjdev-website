
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const STORAGE_KEY = "text-size-percent";

const DEFAULT = 100;
const MIN = 80;
const MAX = 200;

let TextSizeControl;

beforeEach(async () => {
  vi.resetModules();

  localStorage.clear();
  document.documentElement.style.fontSize = "";

  const module = await import(
    "../../src/components/TextSizeControl/TextSizeControl"
  );

  TextSizeControl = module.default;
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.style.fontSize = "";
});

function renderControl() {
  const user = userEvent.setup();

  render(<TextSizeControl />);

  const controls = {
    group: () =>
      screen.getByRole("group", {
        name: "Text size",
      }),

    decrease: () =>
      screen.getByRole("button", {
        name: "Decrease text size",
      }),

    increase: () =>
      screen.getByRole("button", {
        name: "Increase text size",
      }),

    reset: () =>
      screen.getByRole("button", {
        name: /Text size \d+ percent/,
      }),
  };

  return { user, controls };
}

async function increaseTimes(user, times) {
  for (let i = 0; i < times; i++) {
    await user.click(
      screen.getByRole("button", {
        name: "Increase text size",
      })
    );
  }
}

async function decreaseTimes(user, times) {
  for (let i = 0; i < times; i++) {
    await user.click(
      screen.getByRole("button", {
        name: "Decrease text size",
      })
    );
  }
}

describe("TextSizeControl rendering", () => {
  it("renders the text size group", () => {
    const { controls } = renderControl();

    expect(controls.group()).toBeInTheDocument();
  });

  it("renders all three buttons", () => {
    const { controls } = renderControl();

    expect(controls.decrease()).toBeInTheDocument();
    expect(controls.reset()).toBeInTheDocument();
    expect(controls.increase()).toBeInTheDocument();
  });

  it("displays 100% by default", () => {
    const { controls } = renderControl();

    expect(controls.reset()).toHaveTextContent("100%");
  });

  it("renders the decrease button", () => {
    const { controls } = renderControl();

    expect(controls.decrease()).toBeInTheDocument();
  });

  it("renders the increase button", () => {
    const { controls } = renderControl();

    expect(controls.increase()).toBeInTheDocument();
  });

  it("renders the reset button", () => {
    const { controls } = renderControl();

    expect(controls.reset()).toBeInTheDocument();
  });

  it("disables reset at the default size", () => {
    const { controls } = renderControl();

    expect(controls.reset()).toBeDisabled();
  });

  it("uses accessible labels for all buttons", () => {
    renderControl();

    expect(
      screen.getByRole("button", {
        name: "Decrease text size",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Increase text size",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Text size 100 percent. Press to reset to 100 percent",
      })
    ).toBeInTheDocument();
  });
});

describe("Increasing text size", () => {
  it("increases from 100% to 110%", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.increase());

    expect(controls.reset()).toHaveTextContent("110%");
  });

  it("updates the root font size when increased", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.increase());

    expect(
      document.documentElement.style.fontSize
    ).toBe("110%");
  });

  it("increases in steps of 10%", async () => {
    const { user, controls } = renderControl();

    await increaseTimes(user, 3);

    expect(controls.reset()).toHaveTextContent("130%");
  });

  it("allows increasing up to 200%", async () => {
    const { user, controls } = renderControl();

    await increaseTimes(user, 10);

    expect(controls.reset()).toHaveTextContent("200%");
    expect(controls.increase()).toBeDisabled();
  });

  it("does not increase beyond 200%", async () => {
    const { user, controls } = renderControl();

    await increaseTimes(user, 10);

    await user.click(controls.increase());

    expect(controls.reset()).toHaveTextContent("200%");
  });
});

describe("Decreasing text size", () => {
  it("decreases from 100% to 90%", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.decrease());

    expect(controls.reset()).toHaveTextContent("90%");
  });

  it("updates the root font size when decreased", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.decrease());

    expect(
      document.documentElement.style.fontSize
    ).toBe("90%");
  });

  it("decreases in steps of 10%", async () => {
    const { user, controls } = renderControl();

    await decreaseTimes(user, 2);

    expect(controls.reset()).toHaveTextContent("80%");
  });

  it("disables decrease at 80%", async () => {
    const { user, controls } = renderControl();

    await decreaseTimes(user, 2);

    expect(controls.decrease()).toBeDisabled();
  });

  it("does not decrease below 80%", async () => {
    const { user, controls } = renderControl();

    await decreaseTimes(user, 2);

    await user.click(controls.decrease());

    expect(controls.reset()).toHaveTextContent("80%");
  });
});

describe("Resetting text size", () => {
  it("resets an increased size to 100%", async () => {
    const { user, controls } = renderControl();

    await increaseTimes(user, 3);

    await user.click(controls.reset());

    expect(controls.reset()).toHaveTextContent("100%");
  });

  it("resets a decreased size to 100%", async () => {
    const { user, controls } = renderControl();

    await decreaseTimes(user, 2);

    await user.click(controls.reset());

    expect(controls.reset()).toHaveTextContent("100%");
  });

  it("restores the root font size after reset", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.increase());
    await user.click(controls.reset());

    expect(
      document.documentElement.style.fontSize
    ).toBe("100%");
  });

  it("disables reset again after returning to 100%", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.increase());
    await user.click(controls.reset());

    expect(controls.reset()).toBeDisabled();
  });
});

describe("localStorage persistence", () => {
  it("saves the default size to localStorage", async () => {
    renderControl();

    await waitFor(() => {
      expect(
        localStorage.getItem(STORAGE_KEY)
      ).toBe(String(DEFAULT));
    });
  });

  it("saves increased size to localStorage", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.increase());

    expect(
      localStorage.getItem(STORAGE_KEY)
    ).toBe("110");
  });

  it("saves decreased size to localStorage", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.decrease());

    expect(
      localStorage.getItem(STORAGE_KEY)
    ).toBe("90");
  });

  it("saves 100% after resetting", async () => {
    const { user, controls } = renderControl();

    await user.click(controls.increase());
    await user.click(controls.reset());

    expect(
      localStorage.getItem(STORAGE_KEY)
    ).toBe("100");
  });

  it("restores a saved preference", async () => {
    localStorage.setItem(STORAGE_KEY, "150");

    const { controls } = renderControl();

    await waitFor(() => {
      expect(controls.reset()).toHaveTextContent("150%");
    });
  });

  it("restores a saved preference and applies it to the root element", () => {
    localStorage.setItem(STORAGE_KEY, "140");

    renderControl();

    expect(
      document.documentElement.style.fontSize
    ).toBe("140%");
  });

  it("uses 100% if saved data is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "invalid");

    const { controls } = renderControl();

    expect(controls.reset()).toHaveTextContent("100%");
  });

  it("clamps saved values below 80%", () => {
    localStorage.setItem(STORAGE_KEY, "30");

    const { controls } = renderControl();

    expect(controls.reset()).toHaveTextContent("80%");
    expect(controls.decrease()).toBeDisabled();
  });

  it("clamps saved values above 200%", () => {
    localStorage.setItem(STORAGE_KEY, "300");

    const { controls } = renderControl();

    expect(controls.reset()).toHaveTextContent("200%");
    expect(controls.increase()).toBeDisabled();
  });

  it("persists the clamped value instead of the invalid range", () => {
    localStorage.setItem(STORAGE_KEY, "300");

    renderControl();

    expect(
      localStorage.getItem(STORAGE_KEY)
    ).toBe(String(MAX));
  });

  it("continues working if localStorage.setItem fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    const { user, controls } = renderControl();

    await user.click(controls.increase());

    expect(controls.reset()).toHaveTextContent("110%");
    expect(
      document.documentElement.style.fontSize
    ).toBe("110%");
  });

  it("uses the default size if localStorage.getItem fails", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    const { controls } = renderControl();

    expect(controls.reset()).toHaveTextContent("100%");
  });
});

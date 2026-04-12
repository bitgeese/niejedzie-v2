import { describe, it, expect } from "vitest";
import { extractTrainNumber } from "../src/lib/pkp-api";

describe("extractTrainNumber", () => {
  it("prefers nationalNumber", () => {
    expect(extractTrainNumber({ nationalNumber: "49015", name: "X", scheduleId: 2026, orderId: 1 } as any))
      .toBe("49015");
  });

  it("falls through to internationalDepartureNumber", () => {
    expect(extractTrainNumber({
      nationalNumber: null, internationalDepartureNumber: "5680",
      scheduleId: 2026, orderId: 1
    } as any)).toBe("5680");
  });

  it("falls through to internationalArrivalNumber", () => {
    expect(extractTrainNumber({ internationalArrivalNumber: "5387", scheduleId: 2026, orderId: 1 } as any))
      .toBe("5387");
  });

  it("falls through to name", () => {
    expect(extractTrainNumber({ name: "KASZTELAN", scheduleId: 2026, orderId: 1 } as any))
      .toBe("KASZTELAN");
  });

  it("final fallback is compound placeholder", () => {
    expect(extractTrainNumber({ scheduleId: 2026, orderId: 12345 } as any)).toBe("2026/12345");
  });

  it("strips whitespace", () => {
    expect(extractTrainNumber({ nationalNumber: "  49015  ", scheduleId: 2026, orderId: 1 } as any))
      .toBe("49015");
  });

  it("treats empty string as missing", () => {
    expect(extractTrainNumber({ nationalNumber: "", name: "FOO", scheduleId: 2026, orderId: 1 } as any))
      .toBe("FOO");
  });
});

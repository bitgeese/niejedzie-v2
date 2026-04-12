import { describe, it, expect } from "vitest";
import { todayWarsaw, yesterdayWarsaw } from "../src/lib/time";

describe("time", () => {
  it("todayWarsaw returns YYYY-MM-DD", () => {
    expect(todayWarsaw()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("yesterdayWarsaw is one calendar day before today", () => {
    const today = new Date(todayWarsaw() + "T00:00:00Z");
    const yesterday = new Date(yesterdayWarsaw() + "T00:00:00Z");
    expect((today.getTime() - yesterday.getTime()) / 86_400_000).toBeCloseTo(1, 0);
  });
});

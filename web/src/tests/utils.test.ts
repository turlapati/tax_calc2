import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  parseNumericInput,
  formatNumberWithCommas,
} from "@/lib/utils";

describe("cn (classnames utility)", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const condition = false;
    expect(cn("foo", condition && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatCurrency", () => {
  it("formats positive numbers with dollar sign and commas", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00");
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats small numbers", () => {
    expect(formatCurrency(0.5)).toBe("$0.50");
    expect(formatCurrency(99.99)).toBe("$99.99");
  });

  it("rounds to two decimal places", () => {
    expect(formatCurrency(100.999)).toBe("$101.00");
    expect(formatCurrency(100.004)).toBe("$100.00");
  });
});

describe("parseNumericInput", () => {
  it("parses plain numbers", () => {
    expect(parseNumericInput("1000")).toBe(1000);
    expect(parseNumericInput("0")).toBe(0);
  });

  it("parses numbers with commas", () => {
    expect(parseNumericInput("1,000")).toBe(1000);
    expect(parseNumericInput("1,234,567")).toBe(1234567);
  });

  it("parses numbers with dollar sign", () => {
    expect(parseNumericInput("$1000")).toBe(1000);
    expect(parseNumericInput("$1,000")).toBe(1000);
  });

  it("parses decimal numbers", () => {
    expect(parseNumericInput("1000.50")).toBe(1000.5);
    expect(parseNumericInput("1,000.50")).toBe(1000.5);
  });

  it("returns 0 for empty string", () => {
    expect(parseNumericInput("")).toBe(0);
  });

  it("returns 0 for invalid input", () => {
    expect(parseNumericInput("abc")).toBe(0);
    expect(parseNumericInput("$")).toBe(0);
  });
});

describe("formatNumberWithCommas", () => {
  it("formats numbers with commas", () => {
    expect(formatNumberWithCommas(1000)).toBe("1,000");
    expect(formatNumberWithCommas(1234567)).toBe("1,234,567");
  });

  it("handles small numbers without commas", () => {
    expect(formatNumberWithCommas(100)).toBe("100");
    // Note: 0 returns empty string by design (for input field display)
    expect(formatNumberWithCommas(0)).toBe("");
  });

  it("handles string input", () => {
    expect(formatNumberWithCommas("1000")).toBe("1,000");
  });

  it("rounds decimal numbers to integers", () => {
    // Implementation rounds to integers for display
    expect(formatNumberWithCommas(1000.5)).toBe("1,001");
    expect(formatNumberWithCommas(1000.4)).toBe("1,000");
  });
});

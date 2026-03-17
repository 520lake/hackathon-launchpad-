import { describe, it, expect } from "vitest";
import {
  getStatusConfig,
  getTagColor,
  getSkillColor,
  getMBTIConfig,
  getFormatConfig,
  formatDateRange,
  formatAmount,
  STATUS_MAP,
  TAG_COLORS,
  SKILL_COLORS,
  MBTI_COLORS,
} from "@/utils/constants";

// ============================================
// getStatusConfig
// ============================================

describe("getStatusConfig", () => {
  it("returns correct config for 'ongoing'", () => {
    const cfg = getStatusConfig("ongoing");
    expect(cfg.label).toBe("进行中");
    expect(cfg.textColor).toContain("green");
  });

  it("falls back to draft for unknown status", () => {
    const cfg = getStatusConfig("nonexistent_status");
    expect(cfg).toEqual(STATUS_MAP.draft);
  });
});

// ============================================
// getTagColor
// ============================================

describe("getTagColor", () => {
  it("returns purple for AI tag", () => {
    const color = getTagColor("AI");
    expect(color.text).toContain("purple");
  });

  it("falls back to default for unknown tag", () => {
    const color = getTagColor("UnknownTag");
    expect(color).toEqual(TAG_COLORS.default);
  });
});

// ============================================
// getSkillColor
// ============================================

describe("getSkillColor", () => {
  it("returns blue class for React", () => {
    const cls = getSkillColor("React");
    expect(cls).toContain("blue");
  });

  it("falls back to default for unknown skill", () => {
    const cls = getSkillColor("Haskell");
    expect(cls).toBe(SKILL_COLORS.default);
  });
});

// ============================================
// getMBTIConfig
// ============================================

describe("getMBTIConfig", () => {
  it("handles case insensitivity via .toUpperCase()", () => {
    const cfg = getMBTIConfig("intj");
    expect(cfg).toEqual(MBTI_COLORS.INTJ);
    expect(cfg.desc).toBe("建筑师");
  });

  it("falls back to default for unknown MBTI", () => {
    const cfg = getMBTIConfig("XXXX");
    expect(cfg).toEqual(MBTI_COLORS.default);
  });
});

// ============================================
// getFormatConfig
// ============================================

describe("getFormatConfig", () => {
  it("returns '线上' for online", () => {
    const cfg = getFormatConfig("online");
    expect(cfg.label).toBe("线上");
  });

  it("returns fallback for unknown format", () => {
    const cfg = getFormatConfig("unknown");
    expect(cfg.label).toBe("未知");
  });
});

// ============================================
// formatDateRange
// ============================================

describe("formatDateRange", () => {
  it("formats same-year range without repeating year", () => {
    const result = formatDateRange("2026-01-15", "2026-03-20");
    expect(result).toBe("2026.1.15 - 3.20");
  });

  it("formats cross-year range with both years", () => {
    const result = formatDateRange("2025-12-01", "2026-02-15");
    expect(result).toBe("2025.12.1 - 2026.2.15");
  });

  it("returns '待定' when dates are undefined", () => {
    expect(formatDateRange(undefined, undefined)).toBe("待定");
    expect(formatDateRange("2026-01-01", undefined)).toBe("待定");
  });
});

// ============================================
// formatAmount
// ============================================

describe("formatAmount", () => {
  it("formats >= 1亿 with 亿 suffix", () => {
    expect(formatAmount(150000000)).toBe("1.5亿");
    expect(formatAmount(100000000)).toBe("1.0亿");
  });

  it("formats >= 1万 with 万 suffix", () => {
    expect(formatAmount(50000)).toBe("5.0万");
    expect(formatAmount(10000)).toBe("1.0万");
  });

  it("formats < 1万 with locale string", () => {
    const result = formatAmount(9999);
    // toLocaleString output can vary by environment but should contain digits
    expect(result).toContain("9");
    expect(result).toContain("999");
  });
});

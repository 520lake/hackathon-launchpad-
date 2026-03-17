import { describe, it, expect } from "vitest";
import {
  formatLocation,
  formatPrizeText,
  toHackathonCardData,
} from "@/utils/hackathon";
import type { HackathonListItem } from "@/types/hackathon";

// ============================================
// formatLocation
// ============================================

describe("formatLocation", () => {
  it("deduplicates municipality province/city (e.g. 北京)", () => {
    expect(formatLocation("北京", "北京", "朝阳区")).toBe("北京 朝阳区");
  });

  it("deduplicates municipality without district", () => {
    expect(formatLocation("上海", "上海", null)).toBe("上海");
  });

  it("joins province + city normally", () => {
    expect(formatLocation("广东", "深圳", null)).toBe("广东 深圳");
  });

  it("joins all three parts", () => {
    expect(formatLocation("广东", "深圳", "南山区")).toBe("广东 深圳 南山区");
  });

  it("returns '线上' when all null", () => {
    expect(formatLocation(null, null, null)).toBe("线上");
  });
});

// ============================================
// formatPrizeText
// ============================================

describe("formatPrizeText", () => {
  it("shows cash + non-cash when both present", () => {
    const text = formatPrizeText(10000, true);
    expect(text).toBe("¥1.0万 + 非现金奖品");
  });

  it("shows cash only", () => {
    expect(formatPrizeText(50000, false)).toBe("¥5.0万");
  });

  it("shows non-cash only", () => {
    expect(formatPrizeText(0, true)).toBe("非现金奖品");
  });

  it("shows fallback when no prizes", () => {
    expect(formatPrizeText(0, false)).toBe("暂无奖品信息");
  });
});

// ============================================
// toHackathonCardData
// ============================================

describe("toHackathonCardData", () => {
  const mockItem: HackathonListItem = {
    id: 42,
    title: "Test Hack",
    description: "A description",
    tags: ["AI", "Web3"],
    cover_image: "https://example.com/img.png",
    registration_type: "team",
    format: "online",
    start_date: "2026-01-15",
    end_date: "2026-03-20",
    province: null,
    city: null,
    district: null,
    address: null,
    is_address_hidden: false,
    status: "ongoing",
    created_by: 10,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    updated_by: null,
    hosts: [{ id: 1, hackathon_id: 42, name: "Acme Corp", logo_url: null, display_order: 0, created_at: "2026-01-01", created_by: null, updated_at: "2026-01-01", updated_by: null }],
    total_cash_prize: 100000,
    has_non_cash_prizes: true,
  };

  it("maps fields correctly", () => {
    const card = toHackathonCardData(mockItem);
    expect(card.id).toBe("42");
    expect(card.title).toBe("Test Hack");
    expect(card.tags).toEqual(["AI", "Web3"]);
    expect(card.status).toBe("ongoing");
    expect(card.location).toBe("线上");
    expect(card.hosts[0].name).toBe("Acme Corp");
  });

  it("formats date range", () => {
    const card = toHackathonCardData(mockItem);
    expect(card.dateRange).toBe("2026.1.15 - 3.20");
  });

  it("formats prize text with cash + non-cash", () => {
    const card = toHackathonCardData(mockItem);
    expect(card.prizeText).toBe("¥10.0万 + 非现金奖品");
  });

  it("sets isOrganizer=true when currentUserId matches created_by", () => {
    const card = toHackathonCardData(mockItem, 10);
    expect(card.isOrganizer).toBe(true);
  });

  it("sets isOrganizer=false when currentUserId differs", () => {
    const card = toHackathonCardData(mockItem, 99);
    expect(card.isOrganizer).toBe(false);
  });

  it("sets isOrganizer=undefined when no userId provided", () => {
    const card = toHackathonCardData(mockItem);
    expect(card.isOrganizer).toBeUndefined();
  });
});

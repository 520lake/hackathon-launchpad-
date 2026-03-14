// ==========================================================================
// Shared hackathon utility functions.
// Used across pages and components that display hackathon data from the API.
// ==========================================================================

import type { HackathonListItem, HackathonCardData } from "@/types/hackathon";
import { formatDateRange, formatAmount } from "@/utils/constants";

/**
 * Join non-null province / city / district parts into a single display string.
 * Returns "线上" when all parts are null/empty (i.e. online-only events).
 *
 * Examples:
 *   formatLocation("北京", "北京", "朝阳区")  => "北京 朝阳区"
 *   formatLocation("广东", "深圳", null)       => "广东 深圳"
 *   formatLocation(null, null, null)            => "线上"
 */
export function formatLocation(
  province?: string | null,
  city?: string | null,
  district?: string | null,
): string {
  const parts = [province, city, district].filter(Boolean);
  if (parts.length === 0) return "线上";

  // When province and city are the same (direct-administered municipalities
  // like 北京/上海/天津/重庆), avoid repeating the name.
  if (province && city && province === city) {
    return district ? `${city} ${district}` : city;
  }

  return parts.join(" ");
}

/**
 * Build the prize display text from the lightweight summary fields
 * returned by the list endpoint.
 *
 * Rules:
 *  - cash > 0 only           => "¥1,234"
 *  - cash > 0 + non-cash     => "¥1,234 + 非现金奖品"
 *  - cash == 0 + non-cash    => "非现金奖品"
 *  - neither                  => "暂无奖品信息"
 */
export function formatPrizeText(
  totalCashPrize: number,
  hasNonCashPrizes: boolean,
): string {
  const hasCash = totalCashPrize > 0;

  if (hasCash && hasNonCashPrizes) {
    return `¥${formatAmount(totalCashPrize)} + 非现金奖品`;
  }
  if (hasCash) {
    return `¥${formatAmount(totalCashPrize)}`;
  }
  if (hasNonCashPrizes) {
    return "非现金奖品";
  }
  return "暂无奖品信息";
}

/**
 * Convert a backend list-endpoint hackathon item into the lightweight
 * HackathonCardData shape consumed by the HackathonCard component.
 *
 * Accepts an optional `currentUserId` so the caller doesn't have to
 * re-parse localStorage for every item in a list.
 */
export function toHackathonCardData(
  h: HackathonListItem,
  currentUserId?: number,
): HackathonCardData {
  return {
    id: String(h.id),
    title: h.title,
    coverImage: h.cover_image ?? undefined,
    hosts: h.hosts.map((host) => ({
      name: host.name,
      logo_url: host.logo_url ?? undefined,
    })),
    description: h.description ?? undefined,
    tags: h.tags ?? [],
    status: h.status,
    dateRange: formatDateRange(h.start_date, h.end_date),
    location: formatLocation(h.province, h.city, h.district),
    prizeText: formatPrizeText(
      h.total_cash_prize ?? 0,
      h.has_non_cash_prizes ?? false,
    ),
    isOrganizer:
      currentUserId != null ? h.created_by === currentUserId : undefined,
  };
}

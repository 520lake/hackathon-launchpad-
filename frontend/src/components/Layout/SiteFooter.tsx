import type { FC } from "react";

interface SiteFooterProps {
  /** Current language for text copy. */
  lang: "zh" | "en";
}

/**
 * Global site footer.
 *
 * Layout philosophy:
 * - Background + top/bottom borders span the full viewport width (full-bleed).
 * - All "core" content (logo, links, metadata) is constrained to a max width
 *   of 1200px and centered, so it visually aligns with the rest of the site.
 *
 * This component is intentionally "dumb" (no data fetching or routing) so that
 * non-technical teammates can safely reuse it across different pages.
 */
export const SiteFooter: FC<SiteFooterProps> = ({ lang }) => {
  // Shared max-width wrapper so content lines up with the 1200px core layout.
  // We keep a small horizontal padding (`px-6`) so content doesn't touch the
  // very edge of the viewport on tiny screens, matching the Navbar behavior.
  const contentWrapper = "max-w-[1200px] mx-auto w-full px-6";

  return (
    <footer className="bg-black/40 border-t-2 border-brand">
      {/* Top section: brand + navigation columns */}
      <div
        className={`${contentWrapper} py-12 lg:py-16 grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16`}
      >
        {/* Brand + description block */}
        <div className="md:col-span-2 space-y-4">
          {/* Product / platform name: same brand square as Navbar for visual consistency */}
          <h2 className="flex items-center gap-2 group cursor-default text-3xl md:text-4xl font-black tracking-tight text-ink">
            <span
              className="w-4 h-4 bg-brand group-hover:animate-pulse shrink-0"
              aria-hidden
            />
            AURA
          </h2>

          {/* Short mission statement so non‑technical visitors understand purpose */}
          <p className="text-gray-500 max-w-md leading-relaxed">
            {lang === "zh"
              ? "AURA 是一个由 AI 驱动的黑客松与开发者网络，用更透明的算法与更开放的协作，帮助团队在几天内完成从想法到原型的跃迁。"
              : "AURA is an AI‑powered hackathon and builder network that uses transparent algorithms and open collaboration to help teams go from ideas to prototypes in just a few days."}
          </p>
        </div>

        {/* Navigation column: product / docs links */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs tracking-[0.2em] text-brand uppercase">
            {lang === "zh" ? "产品" : "PRODUCT"}
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <a href="#" className="hover:text-brand transition-colors">
                {lang === "zh" ? "产品概览" : "Overview"}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand transition-colors">
                {lang === "zh" ? "使用文档" : "Documentation"}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand transition-colors">
                {lang === "zh" ? "源代码" : "Source Code"}
              </a>
            </li>
          </ul>
        </div>

        {/* Navigation column: company / legal links */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs tracking-[0.2em] text-brand uppercase">
            {lang === "zh" ? "关于" : "COMPANY"}
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <a href="#" className="hover:text-brand transition-colors">
                {lang === "zh" ? "加入我们" : "Careers"}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand transition-colors">
                {lang === "zh" ? "联系我们" : "Contact"}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand transition-colors">
                {lang === "zh" ? "隐私协议" : "Privacy"}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-brand transition-colors">
                {lang === "zh" ? "服务条款" : "Terms"}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar: full‑width separator, core content still at 1200px */}
      <div className="border-t border-white/5">
        <div
          className={`${contentWrapper} py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono text-gray-600`}
        >
          {/* Left side: copyright */}
          <span>
            © {new Date().getFullYear()} AURA Network ·{" "}
            {lang === "zh" ? "保留所有权利" : "All rights reserved"}
          </span>

          {/* Right side: simple status line to echo the brand tone */}
          <span className="text-[11px] md:text-xs text-gray-500">
            {lang === "zh"
              ? "SYSTEM_STATUS: ONLINE · LATENCY < 120ms · v1.0.0"
              : "SYSTEM_STATUS: ONLINE · LATENCY < 120ms · v1.0.0"}
          </span>
        </div>
      </div>
    </footer>
  );
};

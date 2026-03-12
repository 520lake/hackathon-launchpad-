import { Link, useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-void border-t border-border-base pt-12 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto w-full px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-12">
          {/* Brand Info - Left Column */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <div className="w-6 h-6 rounded-md bg-ink group-hover:bg-brand transition-colors duration-300 flex items-center justify-center">
                <div className="w-2 h-2 bg-void rounded-sm" />
              </div>
              <span className="text-xl font-bold tracking-tight text-ink font-sans group-hover:text-brand transition-colors duration-300">
                Aurathon
              </span>
            </div>
            <p className="text-ink-dim text-sm leading-relaxed max-w-xs">
              Aurathon 是一个由 AI
              驱动的全球黑客松创新平台。我们致力于连接开发者、设计师与创变者，共同构建未来的智能应用生态。
            </p>
          </div>

          {/* Links - Right Column */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Column 1: 创建黑客松 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-ink font-bold text-sm uppercase tracking-wider">
                创建黑客松
              </h4>
              <ul className="space-y-2 text-sm text-ink-dim">
                <li>
                  <Link
                    to="/create"
                    className="hover:text-brand transition-colors"
                  >
                    发起活动
                  </Link>
                </li>
                <li>
                  <Link
                    to="/guide/organizer"
                    className="hover:text-brand transition-colors"
                  >
                    组织者指南
                  </Link>
                </li>
                <li>
                  <Link
                    to="/resources/sponsors"
                    className="hover:text-brand transition-colors"
                  >
                    寻求赞助
                  </Link>
                </li>
                <li>
                  <Link
                    to="/resources/judges"
                    className="hover:text-brand transition-colors"
                  >
                    邀请评委
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: 探索黑客松 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-ink font-bold text-sm uppercase tracking-wider">
                探索黑客松
              </h4>
              <ul className="space-y-2 text-sm text-ink-dim">
                <li>
                  <Link
                    to="/events"
                    className="hover:text-brand transition-colors"
                  >
                    浏览活动
                  </Link>
                </li>
                <li>
                  <Link
                    to="/teams"
                    className="hover:text-brand transition-colors"
                  >
                    寻找队友
                  </Link>
                </li>
                <li>
                  <Link
                    to="/projects"
                    className="hover:text-brand transition-colors"
                  >
                    项目展示
                  </Link>
                </li>
                <li>
                  <Link
                    to="/calendar"
                    className="hover:text-brand transition-colors"
                  >
                    活动日历
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: 关于 Aurathon */}
            <div className="flex flex-col space-y-4 col-span-2 sm:col-span-1">
              <h4 className="text-ink font-bold text-sm uppercase tracking-wider">
                关于 Aurathon
              </h4>
              <ul className="space-y-2 text-sm text-ink-dim">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-brand transition-colors"
                  >
                    关于我们
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="hover:text-brand transition-colors"
                  >
                    官方博客
                  </Link>
                </li>
                <li>
                  <Link
                    to="/careers"
                    className="hover:text-brand transition-colors"
                  >
                    加入我们
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-brand transition-colors"
                  >
                    联系合作
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & ICP */}
        <div className="border-t border-border-base pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ink-dim">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <span>© {currentYear} Aurathon Inc. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-ink transition-colors">
                隐私政策
              </a>
              <a href="#" className="hover:text-ink transition-colors">
                服务条款
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-right opacity-60 hover:opacity-100 transition-opacity">
            <span>京ICP备2024000000号-1</span>
            <span className="hidden md:inline">|</span>
            <span>京公网安备 11010502000000号</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

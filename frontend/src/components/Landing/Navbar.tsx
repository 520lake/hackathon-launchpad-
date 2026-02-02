import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavbarProps {
  isLoggedIn: boolean;
  currentUser: any;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogoutClick: () => void;
  onAdminClick: () => void;
  lang: "zh" | "en";
  setLang: (lang: "zh" | "en") => void;
}

export default function Navbar({
  isLoggedIn,
  currentUser,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
  onAdminClick,
  lang,
  setLang,
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  /** Whether the user menu dropdown is open */
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  /** Ref for the user menu container, used to close dropdown when clicking outside */
  const userMenuRef = useRef<HTMLDivElement>(null);

  /** Clicking the AURA logo: go to homepage; if already on homepage, scroll to top. */
  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /** Close user dropdown when clicking outside the menu */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b-2 ${
        scrolled
          ? "bg-void/90 border-brand backdrop-blur-md py-4"
          : "bg-transparent border-transparent py-6"
      }`}
    >
      {/* Separator: 2px brand border when scrolled, same as Hackathon Detail tab section. Core content below at 1200px. */}
      {/* Core header content constrained to 1200px width, centered */}
      <div className="max-w-[1200px] mx-auto w-full flex justify-between items-center">
        {/* Logo: click goes to homepage (or scrolls to top when already on home) */}
        <div
          className="flex items-center gap-2 group cursor-pointer"
          onClick={handleLogoClick}
          role="button"
          aria-label="Go to homepage"
        >
          <div className="w-3 h-3 bg-brand group-hover:animate-pulse" />
          <span className="text-xl font-black tracking-tighter text-ink font-mono">
            AURA
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 font-mono text-sm">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="text-gray-500 hover:text-brand transition-colors text-xs"
          >
            [{lang.toUpperCase()}]
          </button>

          {isLoggedIn ? (
            <>
              {currentUser?.is_superuser && (
                <button
                  onClick={onAdminClick}
                  className="text-brand hover:text-white transition-colors"
                >
                  [ {lang === "zh" ? "管理" : "ADMIN"} ]
                </button>
              )}
              {/* User menu: button toggles dropdown with "个人中心" and "退出" */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-ink hover:text-brand transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {currentUser?.name || (lang === "zh" ? "用户" : "USER")}
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 py-1 min-w-[140px] bg-void/95 border border-white/10 rounded shadow-lg backdrop-blur-md z-50"
                    role="menu"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate("/user");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-white/10 hover:text-brand transition-colors"
                    >
                      {lang === "zh" ? "个人中心" : "PROFILE"}
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogoutClick();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-white/10 hover:text-red-500 transition-colors"
                    >
                      {lang === "zh" ? "退出" : "EXIT"}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="text-ink hover:text-brand transition-colors"
              >
                {lang === "zh" ? "登录" : "LOGIN"}
              </button>
              <button
                onClick={onRegisterClick}
                className="px-4 py-2 bg-white/5 border border-white/10 text-brand hover:bg-brand hover:text-void transition-all"
              >
                {lang === "zh" ? "加入网络" : "JOIN_NETWORK"}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

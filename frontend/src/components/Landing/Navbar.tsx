import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import NotificationDropdown from "../NotificationDropdown";
import axios from "axios";
import type { ProfileUser } from "@/types/profile";

interface NavbarProps {
  isLoggedIn: boolean;
  currentUser: ProfileUser | null;
  onLoginClick: () => void;
  onRegisterClick: () => void; // Keeping this for potential future use or mobile menu
  onLogoutClick: () => void;
  onDashboardClick: () => void;
  onAdminClick: () => void;
}

export default function Navbar({
  isLoggedIn,
  currentUser,
  onLoginClick,
  onLogoutClick,
  onDashboardClick,
  onAdminClick,
}: NavbarProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isLoggedIn) {
        setUnreadCount(0);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("/api/v1/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(res.data.unread_count || 0);
      } catch (e) {
        console.error("Failed to fetch unread count:", e);
      }
    };
    fetchUnreadCount();
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowNotificationMenu(false);
    };
    if (showUserMenu || showNotificationMenu) {
      window.addEventListener("click", handleClickOutside);
    }
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showUserMenu, showNotificationMenu]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoggedIn) {
      setShowUserMenu(!showUserMenu);
      setShowNotificationMenu(false); // Close notification menu when opening user menu
    } else {
      onLoginClick();
    }
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotificationMenu(!showNotificationMenu);
    setShowUserMenu(false); // Close user menu when opening notification menu
    if (unreadCount > 0) {
      setUnreadCount(0);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-void/90 border-border-base/50 backdrop-blur-md py-2 shadow-sm"
          : "bg-void border-transparent py-3"
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center h-full">
        {/* 1. Left: Brand / Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          {/* Rounded Rectangle Logo Placeholder */}
          <div className="w-7 h-7 rounded-md bg-ink group-hover:bg-brand transition-colors duration-300 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-void rounded-sm" />
          </div>

          <span className="text-lg font-bold tracking-tight text-ink font-sans group-hover:text-brand transition-colors duration-300">
            Aurathon
          </span>
        </div>

        {/* 2. Right: Action Icons */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle (Sun/Moon) */}
          <button
            className="p-2.5 rounded-[14px] text-ink/70 hover:text-ink hover:bg-ink/5 transition-all duration-200 focus:outline-none"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Moon className="w-5 h-5" strokeWidth={1.5} />
            )}
          </button>

          {/* Notification Badge (only for logged in users) */}
          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="p-2.5 rounded-[14px] text-ink/70 hover:text-ink hover:bg-ink/5 transition-all duration-200 focus:outline-none relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" strokeWidth={1.5} />

                {/* Red Dot */}
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationMenu && (
                <NotificationDropdown
                  onClose={() => setShowNotificationMenu(false)}
                />
              )}
            </div>
          )}

          {/* User Profile / Login */}
          <div className="relative">
            <button
              className={`p-2.5 rounded-[14px] transition-all duration-200 focus:outline-none ${
                isLoggedIn
                  ? "text-ink hover:bg-ink/5"
                  : "text-ink/70 hover:text-ink hover:bg-ink/5"
              }`}
              aria-label={isLoggedIn ? "User menu" : "Login"}
              onClick={handleUserClick}
            >
              <User className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* User Dropdown Menu */}
            {isLoggedIn && showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border-base rounded-[16px] shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-border-base/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-brand" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {currentUser?.username ||
                          currentUser?.nickname ||
                          currentUser?.full_name ||
                          "User"}
                      </p>
                      <p className="text-xs text-ink-dim truncate">
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {currentUser?.is_superuser && (
                    <button
                      onClick={() => {
                        onAdminClick();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-ink-dim hover:text-ink hover:bg-ink/5 flex items-center gap-3 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      管理面板
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onDashboardClick();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-dim hover:text-ink hover:bg-ink/5 flex items-center gap-3 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    个人中心
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-border-base/50 mx-3 my-1" />

                {/* Logout */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      onLogoutClick();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-50/5 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

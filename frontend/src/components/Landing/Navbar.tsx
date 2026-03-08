import { useState, useEffect } from 'react';
import { Sun, Moon, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationBadge from '../NotificationBadge';
import axios from 'axios';

interface NavbarProps {
    isLoggedIn: boolean;
    currentUser: any;
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
    onAdminClick
}: NavbarProps) {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!isLoggedIn) {
                setUnreadCount(0);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get('/api/v1/notifications/unread-count', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUnreadCount(res.data.unread_count || 0);
            } catch (e) {
                console.error('Failed to fetch unread count:', e);
            }
        };
        fetchUnreadCount();
    }, [isLoggedIn]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowUserMenu(false);
        if (showUserMenu) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showUserMenu]);

    const handleUserClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoggedIn) {
            setShowUserMenu(!showUserMenu);
        } else {
            onLoginClick();
        }
    };

    return (
        <header 
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
                scrolled 
                    ? 'bg-void/90 border-border-base/50 backdrop-blur-md py-2 shadow-sm' 
                    : 'bg-void border-transparent py-3'
            }`}
        >
            <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center h-full">
                
                {/* 1. Left: Brand / Logo */}
                <div 
                    className="flex items-center gap-2 cursor-pointer group" 
                    onClick={() => navigate('/')}
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
                <div className="flex items-center gap-2 sm:gap-3">
                    
                    {/* Theme Toggle (Sun/Moon) */}
                    <button 
                        className="p-1.5 rounded-full text-ink/80 hover:text-ink hover:bg-ink/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50"
                        aria-label="Toggle theme"
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                        ) : (
                            <Moon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                        )}
                    </button>

                    {/* Notification Badge (only for logged in users) */}
                    {isLoggedIn && (
                        <NotificationBadge 
                            unreadCount={unreadCount} 
                            onBellClick={() => {
                                if (unreadCount > 0) {
                                    setUnreadCount(0);
                                }
                            }} 
                        />
                    )}

                    {/* User Profile / Login */}
                    <button 
                        className={`p-1.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 ${
                            isLoggedIn ? 'text-brand bg-brand/10 hover:bg-brand/20' : 'text-ink/80 hover:text-ink hover:bg-ink/10'
                        }`}
                        aria-label={isLoggedIn ? "User menu" : "Login"}
                        onClick={handleUserClick}
                    >
                        <User className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                    </button>

                    {/* User Dropdown Menu */}
                    {isLoggedIn && showUserMenu && (
                        <div className="absolute right-0 mt-3 w-48 bg-surface border border-border-base rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="px-4 py-3 border-b border-border-base">
                                <p className="text-sm text-ink font-medium truncate">
                                    {currentUser?.full_name || currentUser?.nickname || 'User'}
                                </p>
                                <p className="text-xs text-ink-dim truncate mt-0.5">
                                    {currentUser?.email}
                                </p>
                            </div>
                            
                            {currentUser?.is_superuser && (
                                <button 
                                    onClick={() => { onAdminClick(); setShowUserMenu(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-ink-dim hover:text-ink hover:bg-ink/5 flex items-center gap-2 transition-colors"
                                >
                                    <Shield className="w-4 h-4" />
                                    管理面板
                                </button>
                            )}
                            
                            <button 
                                onClick={() => { onDashboardClick(); setShowUserMenu(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-ink-dim hover:text-ink hover:bg-ink/5 flex items-center gap-2 transition-colors"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                个人中心
                            </button>
                            
                            <div className="h-px bg-border-base my-1" />
                            
                            <button 
                                onClick={() => { onLogoutClick(); setShowUserMenu(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-ink/5 flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                退出登录
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

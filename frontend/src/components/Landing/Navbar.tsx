import { useState, useEffect } from 'react';

interface NavbarProps {
    isLoggedIn: boolean;
    currentUser: any;
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onLogoutClick: () => void;
    onDashboardClick: () => void;
    onAdminClick: () => void;
    lang: 'zh' | 'en';
    setLang: (lang: 'zh' | 'en') => void;
}

export default function Navbar({ 
    isLoggedIn, 
    currentUser, 
    onLoginClick, 
    onRegisterClick, 
    onLogoutClick, 
    onDashboardClick, 
    onAdminClick,
    lang,
    setLang
}: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-void/90 border-brand/20 backdrop-blur-md py-4' : 'bg-transparent border-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="w-3 h-3 bg-brand group-hover:animate-pulse" />
                    <span className="text-xl font-black tracking-tighter text-ink font-mono">AURA</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 font-mono text-sm">
                    {/* Language Switcher */}
                    <button 
                        onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                        className="text-gray-500 hover:text-brand transition-colors text-xs"
                    >
                        [{lang.toUpperCase()}]
                    </button>

                    {isLoggedIn ? (
                        <>
                            {currentUser?.is_superuser && (
                                <button onClick={onAdminClick} className="text-brand hover:text-white transition-colors">
                                    [ {lang === 'zh' ? '管理' : 'ADMIN'} ]
                                </button>
                            )}
                            <button onClick={onDashboardClick} className="flex items-center gap-2 text-ink hover:text-brand transition-colors">
                                <span className="w-2 h-2 bg-green-500 rounded-full" />
                                {currentUser?.name || (lang === 'zh' ? '用户' : 'USER')}
                            </button>
                            <button onClick={onLogoutClick} className="text-gray-500 hover:text-red-500 transition-colors">
                                // {lang === 'zh' ? '退出' : 'EXIT'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onLoginClick} className="text-ink hover:text-brand transition-colors">
                                {lang === 'zh' ? '登录' : 'LOGIN'}
                            </button>
                            <button 
                                onClick={onRegisterClick}
                                className="px-4 py-2 bg-white/5 border border-white/10 text-brand hover:bg-brand hover:text-void transition-all"
                            >
                                {lang === 'zh' ? '加入网络' : 'JOIN_NETWORK'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import Navbar from '../Landing/Navbar';
import { Footer } from '../Landing/Sections';

interface UserCenterLayoutProps {
  children: React.ReactNode;
}

export default function UserCenterLayout({ children }: UserCenterLayoutProps) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { 
    lang, setLang, 
    openLogin, openRegister,
    isLoginOpen, isRegisterOpen // These are modals, handled in App.tsx
  } = useUI();

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-ink selection:bg-brand selection:text-void">
      {/* Header / Navbar */}
      <Navbar 
        isLoggedIn={isAuthenticated}
        currentUser={user}
        onLoginClick={openLogin}
        onRegisterClick={openRegister}
        onLogoutClick={logout}
        onAdminClick={() => {}} // TODO: Handle admin click
        lang={lang}
        setLang={setLang}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-8 mt-20">
        {children}
      </main>

      {/* Footer */}
      <Footer lang={lang} />
    </div>
  );
}

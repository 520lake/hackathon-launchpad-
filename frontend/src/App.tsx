import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useUI } from './contexts/UIContext';

// Components
import Navbar from './components/Landing/Navbar';
import { Footer } from './components/Landing/Sections';
import HomePage from './pages/HomePage';
import HackathonListPage from './pages/HackathonListPage';
import DashboardPage from './pages/DashboardPage';
import HackathonDetailPage from './pages/HackathonDetailPage';

// Modals
import RegisterModal from './components/RegisterModal';
import LoginModal from './components/LoginModal';
import CreateHackathonModal from './components/CreateHackathonModal';
import VerificationModal from './components/VerificationModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import AITeamMatchModal from './components/AITeamMatchModal';

function App() {
  const { isAuthenticated, user, login, logout, checkAuth } = useAuth();
  const { 
    isLoginOpen, closeLogin, openLogin,
    isRegisterOpen, closeRegister, openRegister,
    isCreateHackathonOpen, closeCreateHackathon, openCreateHackathon,
    editingHackathon,
    lang, setLang
  } = useUI();

  // Local state for complex interactions not yet in UIContext
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isTeamMatchOpen, setIsTeamMatchOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);

  // Debug version log
  useEffect(() => {
    console.log("Aura Frontend Version: 2026-03-03-REFACTORED-v2.1 (Pages)");
  }, []);

  const handleLoginSuccess = async (token: string) => {
    closeLogin();
    await login(token);
  };

  const handleRegisterSuccess = () => {
    closeRegister();
    openLogin();
  };

  return (
    <div className="min-h-screen bg-void text-ink font-sans selection:bg-brand selection:text-void">
      <Navbar 
        isLoggedIn={isAuthenticated}
        currentUser={user}
        onLoginClick={openLogin}
        onRegisterClick={openRegister}
        onLogoutClick={logout}
        onAdminClick={() => setIsAdminDashboardOpen(true)}
        lang={lang}
        setLang={setLang}
      />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hackathons" element={<HackathonListPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/hackathons/:id" element={<HackathonDetailPage />} />
      </Routes>

      <Footer lang={lang} />

      {/* --- Modals --- */}
      
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={closeLogin} 
        onLoginSuccess={handleLoginSuccess}
        onRegisterClick={() => {
          closeLogin();
          openRegister();
        }}
        lang={lang}
      />

      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={closeRegister} 
        onRegisterSuccess={handleRegisterSuccess}
        onLoginClick={() => {
          closeRegister();
          openLogin();
        }}
        lang={lang}
      />

      <CreateHackathonModal 
        isOpen={isCreateHackathonOpen} 
        onClose={closeCreateHackathon}
        lang={lang}
        initialData={editingHackathon}
      />

      <VerificationModal 
        isOpen={isVerificationOpen} 
        onClose={() => setIsVerificationOpen(false)}
        onSuccess={() => {
            checkAuth();
            setIsVerificationOpen(false);
        }}
        lang={lang}
      />

      <AdminDashboardModal 
        isOpen={isAdminDashboardOpen} 
        onClose={() => setIsAdminDashboardOpen(false)}
        lang={lang}
      />

      <AITeamMatchModal 
        isOpen={isTeamMatchOpen} 
        onClose={() => setIsTeamMatchOpen(false)}
        lang={lang}
        hackathonId={selectedHackathonId || 0} // Fallback
      />

    </div>
  );
}

export default App;

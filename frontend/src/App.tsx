import { useState, useEffect } from 'react'
import axios from 'axios'

// Landing Components
import Navbar from './components/Landing/Navbar'
import Hero from './components/Landing/Hero'
import { LatestEvents, About, Partners, Schedule, Footer } from './components/Landing/Sections'

// Modals
import RegisterModal from './components/RegisterModal'
import LoginModal from './components/LoginModal'
import CreateHackathonModal from './components/CreateHackathonModal'
import HackathonListModal from './components/HackathonListModal'
import UserDashboardModal from './components/UserDashboardModal'
import HackathonDetailModal from './components/HackathonDetailModal'
import VerificationModal from './components/VerificationModal'
import AdminDashboardModal from './components/AdminDashboardModal'

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

function App() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCreateHackathonOpen, setIsCreateHackathonOpen] = useState(false);
  const [isHackathonListOpen, setIsHackathonListOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [latestHackathons, setLatestHackathons] = useState<Hackathon[]>([]);
  const [editingHackathon, setEditingHackathon] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchLatestHackathons();
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
    } catch (e) {
        console.error("Failed to fetch user", e);
    }
  };

  const fetchLatestHackathons = async () => {
    try {
      const response = await axios.get('/api/v1/hackathons/');
      // 取前6个
      setLatestHackathons(response.data.slice(0, 6));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    window.location.reload();
  };

  const handleCreateHackathonClick = async () => {
    if (isLoggedIn) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/v1/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.is_verified) {
                setIsCreateHackathonOpen(true);
            } else {
                alert('发布活动需要先完成实名认证');
                setIsVerificationOpen(true);
            }
        } catch (e) {
            console.error(e);
            setIsLoginOpen(true);
        }
    } else {
      setIsLoginOpen(true);
    }
  };

  const openHackathonDetail = (id: number) => {
    setSelectedHackathonId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-void text-ink font-sans selection:bg-brand selection:text-void">
      {/* Global Noise Overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <Navbar 
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLoginClick={() => setIsLoginOpen(true)}
        onRegisterClick={() => setIsRegisterOpen(true)}
        onLogoutClick={handleLogout}
        onDashboardClick={() => setIsDashboardOpen(true)}
        onAdminClick={() => setIsAdminDashboardOpen(true)}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Content Sections */}
      <main>
        <Hero 
            onCreateClick={handleCreateHackathonClick}
            onExploreClick={() => setIsHackathonListOpen(true)}
            lang={lang}
        />
        
        <About lang={lang} />
        
        <LatestEvents 
            hackathons={latestHackathons}
            onDetailClick={openHackathonDetail}
            onViewAll={() => setIsHackathonListOpen(true)}
            lang={lang}
        />
        
        <Schedule lang={lang} />
        
        <Partners />
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Modals */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} lang={lang} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} lang={lang} />
      <CreateHackathonModal 
        isOpen={isCreateHackathonOpen} 
        onClose={() => {
            setIsCreateHackathonOpen(false);
            setEditingHackathon(null);
        }}
        initialData={editingHackathon}
        lang={lang}
      />
      <HackathonListModal 
        isOpen={isHackathonListOpen} 
        onClose={() => setIsHackathonListOpen(false)} 
        onHackathonSelect={openHackathonDetail}
        lang={lang}
      />
      <UserDashboardModal 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)}
        onHackathonSelect={openHackathonDetail}
        onVerifyClick={() => setIsVerificationOpen(true)}
        lang={lang}
      />
      <HackathonDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        hackathonId={selectedHackathonId}
        onEdit={(hackathon) => {
            setIsDetailOpen(false);
            setEditingHackathon(hackathon);
            setIsCreateHackathonOpen(true);
        }}
        lang={lang}
      />
      <VerificationModal 
        isOpen={isVerificationOpen} 
        onClose={() => setIsVerificationOpen(false)}
        onSuccess={() => {}} 
        lang={lang}
      />
      <AdminDashboardModal 
        isOpen={isAdminDashboardOpen} 
        onClose={() => setIsAdminDashboardOpen(false)} 
        lang={lang}
      />
    </div>
  )
}

export default App

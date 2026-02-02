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

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
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
    console.log("--- FRONTEND VERSION: 2026-02-02-FIX-FINAL-v2.6-COOKIE-SECURE ---");
    let token = localStorage.getItem('token');
    
    // Try to recover from cookie if localStorage is empty on load
    if (!token || token === 'undefined' || token === 'null') {
        const cookieToken = getCookie('access_token');
        if (cookieToken) {
            console.log('[DEBUG] Init: Recovered token from Cookie');
            token = cookieToken;
            localStorage.setItem('token', token);
        }
    }

    setIsLoggedIn(!!token);
    fetchLatestHackathons();
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      let token = localStorage.getItem('token');
      console.log('[DEBUG] fetchCurrentUser - Token from localStorage:', token ? token.substring(0, 10) + '...' : 'null or undefined');
      
      if (!token || token === 'undefined' || token === 'null') {
           // Try to recover from cookie
          const cookieToken = getCookie('access_token');
          if (cookieToken) {
              console.log('[DEBUG] Recovered token from Cookie:', cookieToken.substring(0, 10) + '...');
              token = cookieToken;
              localStorage.setItem('token', token);
          } else {
              console.warn('[DEBUG] Token is invalid and no cookie found, skipping fetch');
              return;
          }
      }

      const res = await axios.get('api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data);
    } catch (e: any) {
      console.error("Failed to fetch user", e);
      if (e.response) {
         console.log('[DEBUG] fetchCurrentUser Error Status:', e.response.status);
         console.log('[DEBUG] fetchCurrentUser Error Data:', e.response.data);
      }
      // If token is invalid or user doesn't exist, clear state
      // DEBUG: Don't remove token immediately to allow for debugging/retries
      // localStorage.removeItem('token');
      // setIsLoggedIn(false);
      // setCurrentUser(null);
    }
  };

  const fetchLatestHackathons = async () => {
    try {
      const response = await axios.get('api/v1/hackathons');
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
    // Debug logic for auth flow
    console.log('[DEBUG] handleCreateHackathonClick - isLoggedIn:', isLoggedIn);
    
    if (isLoggedIn) {
        try {
            const token = localStorage.getItem('token');
            console.log('[DEBUG] Token present:', !!token);
            
            // If we already have currentUser loaded, use it directly to avoid extra API call delay
            if (currentUser) {
                 console.log('[DEBUG] Using cached currentUser:', currentUser);
                 if (currentUser.is_verified) {
                     console.log('[DEBUG] User verified, opening Create Modal');
                     setIsCreateHackathonOpen(true);
                 } else {
                     console.log('[DEBUG] User NOT verified, opening Verification Modal');
                     setIsVerificationOpen(true);
                 }
                 return;
            }

            const res = await axios.get('api/v1/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[DEBUG] User info fetched:', res.data);
            setCurrentUser(res.data); // Update global user state
            
            if (res.data.is_verified) {
                console.log('[DEBUG] User verified, opening Create Modal');
                setIsCreateHackathonOpen(true);
            } else {
                console.log('[DEBUG] User NOT verified, opening Verification Modal');
                // Show verification modal directly
                setIsVerificationOpen(true);
            }
        } catch (e: any) {
            console.error('[DEBUG] Failed to fetch user info:', e);
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                console.log('[DEBUG] 401/403 detected, opening Login Modal');
                // Token invalid, clear it
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                setCurrentUser(null);
                setIsLoginOpen(true);
            } else {
                alert(lang === 'zh' ? '无法获取用户信息，请重试' : 'Failed to fetch user info');
            }
        }
    } else {
      console.log('[DEBUG] Not logged in, opening Login Modal');
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
        onUserUpdate={fetchCurrentUser}
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

import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Landing/Navbar'
import Footer from '../components/Layout/Footer'
import axios from 'axios'

// Loading Progress Bar Component
function LoadingBar() {
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setLoading(true)
    setProgress(0)
    
    const timer1 = setTimeout(() => setProgress(30), 50)
    const timer2 = setTimeout(() => setProgress(60), 100)
    const timer3 = setTimeout(() => setProgress(90), 150)
    const timer4 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setLoading(false), 200)
    }, 200)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [location.pathname])

  if (!loading) return null

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-brand z-[9999] origin-left"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      exit={{ scaleX: 1, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ boxShadow: '0 0 10px #FFD700, 0 0 20px #FFD700' }}
    />
  )
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    let token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      const cookieToken = getCookie('access_token');
      if (cookieToken) {
        token = cookieToken;
        localStorage.setItem('token', token);
      }
    }
    setIsLoggedIn(!!token);
    if (token) {
      fetchCurrentUser();
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      let token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') {
        const cookieToken = getCookie('access_token');
        if (cookieToken) {
          token = cookieToken;
          localStorage.setItem('token', token);
        } else {
          return;
        }
      }
      const res = await axios.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data);
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
    setIsLoggedIn(false);
    setCurrentUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink font-sans selection:bg-brand selection:text-void">
      {/* Global Noise Overlay */}
      <div className="noise-overlay" />
      
      {/* Loading Progress Bar */}
      <AnimatePresence>
        <LoadingBar />
      </AnimatePresence>

      {/* Fixed Navigation */}
      <Navbar 
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLoginClick={() => {}}
        onRegisterClick={() => {}}
        onLogoutClick={handleLogout}
        onDashboardClick={() => navigate('/profile')}
        onAdminClick={() => {}}
      />

      {/* Main Content with Page Transition */}
      <AnimatePresence mode="wait">
        <motion.main
          className="flex-grow pt-16" // Add padding top for fixed navbar
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <Outlet context={{ isLoggedIn, currentUser, fetchCurrentUser }} />
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  )
}

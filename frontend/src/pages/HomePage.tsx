import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import axios from 'axios'

// Landing Components
import Hero from '../components/Landing/Hero'
import { LatestEvents, About, Partners, Schedule, Footer } from '../components/Landing/Sections'

// Modals
import RegisterModal from '../components/RegisterModal'
import LoginModal from '../components/LoginModal'
import VerificationModal from '../components/VerificationModal'
import UserDashboardModal from '../components/UserDashboardModal'
import AdminDashboardModal from '../components/AdminDashboardModal'
import AITeamMatchModal from '../components/AITeamMatchModal'

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
  fetchCurrentUser: () => void;
  lang: 'zh' | 'en';
}

export default function HomePage() {
  const navigate = useNavigate()
  const { isLoggedIn, currentUser, fetchCurrentUser, lang } = useOutletContext<OutletContextType>()
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false)
  const [isTeamMatchOpen, setIsTeamMatchOpen] = useState(false)
  const [latestHackathons, setLatestHackathons] = useState<Hackathon[]>([])

  useEffect(() => {
    fetchLatestHackathons()
  }, [])

  const fetchLatestHackathons = async () => {
    try {
      const response = await axios.get('/api/v1/hackathons')
      setLatestHackathons(response.data.slice(0, 6))
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateHackathonClick = async () => {
    if (isLoggedIn) {
      try {
        const token = localStorage.getItem('token')
        if (currentUser && currentUser.is_verified) {
          navigate('/create') // 跳转到独立的创建页面
          return
        }

        const res = await axios.get('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        fetchCurrentUser()
        
        if (res.data.is_verified) {
          navigate('/create') // 跳转到独立的创建页面
        } else {
          setIsVerificationOpen(true)
        }
      } catch (e: any) {
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          localStorage.removeItem('token')
          setIsLoginOpen(true)
        }
      }
    } else {
      setIsLoginOpen(true)
    }
  }

  // Navigate to event detail page
  const openHackathonDetail = (id: number) => {
    navigate(`/events/${id}`)
  }

  // Navigate to events list page
  const openEventsList = (mode: 'list' | 'ai' = 'list') => {
    navigate(`/events${mode === 'ai' ? '?mode=ai' : ''}`)
  }

  return (
    <>
      {/* Hero Section */}
      <Hero 
        onCreateClick={handleCreateHackathonClick}
        onExploreClick={() => openEventsList('list')}
        onAIGuideClick={() => openEventsList('ai')}
        lang={lang}
      />
      
      <About lang={lang} />
      
      <LatestEvents 
        hackathons={latestHackathons}
        onDetailClick={openHackathonDetail}
        onViewAll={() => openEventsList('list')}
        lang={lang}
      />
      
      <Schedule lang={lang} />
      <Partners />
      <Footer lang={lang} />

      {/* Modals */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} lang={lang} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} lang={lang} />
      <VerificationModal 
        isOpen={isVerificationOpen} 
        onClose={() => setIsVerificationOpen(false)}
        onSuccess={() => {}} 
        lang={lang}
      />
      <UserDashboardModal 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)}
        onHackathonSelect={openHackathonDetail}
        onVerifyClick={() => {
          setIsDashboardOpen(false)
          setIsVerificationOpen(true)
        }}
        onUserUpdate={fetchCurrentUser}
        onTeamMatchClick={() => setIsTeamMatchOpen(true)}
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
        hackathonId={null}
      />
    </>
  )
}

import { useState, useEffect } from 'react'
import axios from 'axios'
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
      // 简单取前3个作为“最新推荐”
      setLatestHackathons(response.data.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = () => {
      setIsLoggedIn(true);
      fetchCurrentUser();
      setIsLoginOpen(false);
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
            // Token might be invalid
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">

      {/* Navbar */}
      <nav className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">VibeBuild</div>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {currentUser?.is_superuser && (
                  <button 
                    onClick={() => setIsAdminDashboardOpen(true)}
                    className="px-4 py-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg mr-2"
                  >
                    后台管理
                  </button>
                )}
                <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="px-4 py-2 text-sm font-medium hover:text-blue-600 transition flex items-center gap-2"
                >
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">ME</span>
                  个人中心
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium hover:text-red-600 transition"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="px-4 py-2 text-sm font-medium hover:text-blue-600 transition"
                >
                  登录
                </button>
                <button 
                  onClick={() => setIsRegisterOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                >
                  注册
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 dark:bg-blue-900/30 rounded-full">
          AI 驱动的黑客松生态
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          让创意
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mx-2">
            触手可及
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          赋能每一个创造者，将伟大的想法变为现实。连接创意、人才与机会，推动黑客松文化走向大众。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={handleCreateHackathonClick}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            发起活动
          </button>
          <button 
            onClick={() => setIsHackathonListOpen(true)}
            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm hover:shadow-md"
          >
            探索黑客松
          </button>
        </div>
      </header>

      {/* Latest Hackathons Section */}
      {latestHackathons.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold">最新活动</h2>
            <button 
              onClick={() => setIsHackathonListOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              查看全部 &rarr;
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {latestHackathons.map((hackathon) => (
              <div key={hackathon.id} className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition border border-gray-100 dark:border-gray-700">
                <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 p-6 flex flex-col justify-end">
                  <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded self-start mb-2">
                    {hackathon.status}
                  </span>
                  <h3 className="text-xl font-bold text-white line-clamp-2">{hackathon.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm">
                    {hackathon.description}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                     <span>📅 {new Date(hackathon.start_date).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => openHackathonDetail(hackathon.id)}
                    className="w-full py-2 bg-gray-50 hover:bg-blue-50 text-blue-600 font-medium rounded-lg transition"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 mt-12">
        <p>© 2024 VibeBuild. All rights reserved.</p>
      </footer>

      {/* Modals */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <CreateHackathonModal 
        isOpen={isCreateHackathonOpen} 
        onClose={() => {
            setIsCreateHackathonOpen(false);
            setEditingHackathon(null);
        }}
        initialData={editingHackathon}
      />
      <HackathonListModal 
        isOpen={isHackathonListOpen} 
        onClose={() => setIsHackathonListOpen(false)} 
        onHackathonSelect={openHackathonDetail}
      />
      <UserDashboardModal 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)}
        onHackathonSelect={openHackathonDetail}
        onVerifyClick={() => setIsVerificationOpen(true)}
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
      />
      <VerificationModal 
        isOpen={isVerificationOpen} 
        onClose={() => setIsVerificationOpen(false)}
        onSuccess={() => {}} 
      />
      <AdminDashboardModal 
        isOpen={isAdminDashboardOpen} 
        onClose={() => setIsAdminDashboardOpen(false)} 
      />
    </div>
  )
}

export default App

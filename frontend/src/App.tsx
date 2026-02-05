import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Landing Components
import Navbar from "./components/Landing/Navbar";
import Hero from "./components/Landing/Hero";
import {
  LatestEvents,
  About,
  Partners,
  Schedule,
} from "./components/Landing/Sections";
import { SiteFooter } from "./components/Layout/SiteFooter";

// Pages (full-page views for Create, Explore, and Hackathon Detail)
import CreateHackathonPage from "./pages/CreateHackathonPage";
import ExplorePage from "./pages/ExplorePage";
import HackathonDetailPage from "./pages/HackathonDetailPage";
import UserPage from "./pages/UserPage";

// Modals
import RegisterModal from "./components/RegisterModal";
import LoginModal from "./components/LoginModal";
import CreateHackathonModal from "./components/CreateHackathonModal";
import HackathonListModal from "./components/HackathonListModal";
import VerificationModal from "./components/VerificationModal";
import AdminDashboardModal from "./components/AdminDashboardModal";

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCreateHackathonOpen, setIsCreateHackathonOpen] = useState(false);
  const [isHackathonListOpen, setIsHackathonListOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [latestHackathons, setLatestHackathons] = useState<Hackathon[]>([]);
  const [editingHackathon, setEditingHackathon] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lang, setLang] = useState<"zh" | "en">("zh");

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    fetchLatestHackathons();
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  // When navigating to home with state openLogin (e.g. from Create page "Log in" button), open the login modal.
  useEffect(() => {
    const state = location.state as { openLogin?: boolean } | null;
    if (location.pathname !== "/") return;
    if (state?.openLogin) {
      setIsLoginOpen(true);
      navigate("/", { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  // Set browser tab title per route, following current language (zh/en). All titles use suffix "- Aura".
  useEffect(() => {
    const path = location.pathname;
    let title: string;
    if (path === "/") {
      // Home page: no "- Aura" suffix
      title =
        lang === "zh" ? "Aura - AI 黑客松平台" : "Aura - AI Hackathon Platform";
    } else if (path === "/create") {
      title = lang === "zh" ? "发起活动 - Aura" : "Initiate Action - Aura";
    } else if (path === "/explore") {
      title = lang === "zh" ? "探索活动 - Aura" : "Explore Network - Aura";
    } else if (path.startsWith("/hackathon/")) {
      // Placeholder until HackathonDetailModal sets the event title
      title = lang === "zh" ? "活动详情 - Aura" : "Hackathon Details - Aura";
    } else if (path === "/user") {
      title = lang === "zh" ? "个人中心 - Aura" : "Profile - Aura";
    } else {
      // Fallback: same as home, no "- Aura" suffix
      title =
        lang === "zh" ? "Aura - AI 黑客松平台" : "Aura - AI Hackathon Platform";
    }
    document.title = title;
  }, [location.pathname, lang]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(res.data);
    } catch (e: any) {
      console.error("Failed to fetch user", e);
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  const fetchLatestHackathons = async () => {
    try {
      const response = await axios.get("/api/v1/hackathons");
      setLatestHackathons(response.data.slice(0, 6));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setCurrentUser(null);
    window.location.reload();
  };

  const openHackathonDetail = (id: number) => {
    window.open(`/hackathon/${id}`, "_blank", "noopener,noreferrer");
  };

  // Navigate to home and open login modal (used by Create page when user is not logged in).
  const openLoginFromPage = () => {
    navigate("/", { state: { openLogin: true } });
  };

  return (
    <div className="min-h-screen bg-void text-ink font-sans selection:bg-brand selection:text-void">
      {/* Global Noise Overlay */}
      <div className="noise-overlay" />

      <Routes>
        {/* Landing page: Hero, About, Latest Events, etc. */}
        <Route
          path="/"
          element={
            <>
              <Navbar
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onLoginClick={() => setIsLoginOpen(true)}
                onRegisterClick={() => setIsRegisterOpen(true)}
                onLogoutClick={handleLogout}
                onAdminClick={() => setIsAdminDashboardOpen(true)}
                lang={lang}
                setLang={setLang}
              />
              <main>
                <Hero lang={lang} />
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
              <SiteFooter lang={lang} />
            </>
          }
        />
        {/* Create hackathon page (Initiate Action) – opened from Hero "发起行动" button */}
        <Route
          path="/create"
          element={
            <CreateHackathonPage
              lang={lang}
              setLang={setLang}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onOpenLogin={openLoginFromPage}
            />
          }
        />
        {/* Explore hackathons page – opened from Hero "探索网络" button */}
        <Route
          path="/explore"
          element={
            <ExplorePage
              lang={lang}
              setLang={setLang}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onOpenLogin={openLoginFromPage}
              onHackathonSelect={openHackathonDetail}
            />
          }
        />
        {/* Hackathon detail page – opened when clicking a hackathon (Explore, Latest Events, Dashboard) */}
        <Route
          path="/hackathon/:id"
          element={
            <HackathonDetailPage
              lang={lang}
              setLang={setLang}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onOpenLogin={openLoginFromPage}
              onEdit={(hackathon) =>
                navigate("/create", { state: { editingHackathon: hackathon } })
              }
            />
          }
        />
        {/* User dashboard page – opened when clicking the user button in the navbar */}
        <Route
          path="/user"
          element={
            <UserPage
              lang={lang}
              setLang={setLang}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onOpenLogin={openLoginFromPage}
              onLogoutClick={handleLogout}
              onHackathonSelect={openHackathonDetail}
              onVerifyClick={() => setIsVerificationOpen(true)}
              onUserUpdate={fetchCurrentUser}
            />
          }
        />
      </Routes>

      {/* Modals */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        lang={lang}
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        lang={lang}
      />
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
  );
}

export default App;

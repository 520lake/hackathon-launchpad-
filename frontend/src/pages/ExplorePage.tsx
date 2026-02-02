/**
 * Full-page view for exploring hackathons (Explore Network).
 * Reuses HackathonListModal in "page" mode so the list appears on its own route
 * instead of in a popup. Users reach this page via the Hero "探索网络" button.
 */
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Landing/Navbar";
import HackathonListModal from "../components/HackathonListModal";
import { SiteFooter } from "../components/Layout/SiteFooter";

interface ExplorePageProps {
  lang: "zh" | "en";
  setLang: (l: "zh" | "en") => void;
  isLoggedIn: boolean;
  currentUser: any;
  onOpenLogin: () => void;
  onHackathonSelect: (id: number) => void;
}

export default function ExplorePage({
  lang,
  setLang,
  isLoggedIn,
  currentUser,
  onOpenLogin,
  onHackathonSelect,
}: ExplorePageProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/");
  };

  // When user selects a hackathon, navigate to its detail page (/hackathon/:id).
  const handleHackathonSelect = (id: number) => {
    onHackathonSelect(id);
  };

  return (
    <div className="min-h-screen bg-void text-ink font-sans selection:bg-brand selection:text-void">
      <div className="noise-overlay" />
      <Navbar
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLoginClick={onOpenLogin}
        onRegisterClick={onOpenLogin}
        onLogoutClick={() => {}}
        onAdminClick={() => navigate("/")}
        lang={lang}
        setLang={setLang}
      />
      {/* Core explore content (list rendered as full page, not popup). */}
      <HackathonListModal
        isOpen={true}
        onClose={handleClose}
        onHackathonSelect={handleHackathonSelect}
        lang={lang}
        asPage={true}
      />

      {/* Global footer: full-width background, 1200px max-width content (matches Hackathon Detail page). */}
      <SiteFooter lang={lang} />
    </div>
  );
}

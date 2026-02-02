/**
 * Full-page view for the logged-in user dashboard (My Created/Joined hackathons and Profile).
 * Reuses UserDashboardModal in "page" mode. Users reach this page by clicking the user
 * button in the top-right of the navbar on any page.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Landing/Navbar";
import UserDashboardModal from "../components/UserDashboardModal";
import { SiteFooter } from "../components/Layout/SiteFooter";

interface UserPageProps {
  lang: "zh" | "en";
  setLang: (l: "zh" | "en") => void;
  isLoggedIn: boolean;
  currentUser: any;
  onOpenLogin: () => void;
  onLogoutClick: () => void;
  onHackathonSelect: (id: number) => void;
  onVerifyClick: () => void;
  onUserUpdate?: () => void;
}

export default function UserPage({
  lang,
  setLang,
  isLoggedIn,
  currentUser,
  onOpenLogin,
  onLogoutClick,
  onHackathonSelect,
  onVerifyClick,
  onUserUpdate,
}: UserPageProps) {
  const navigate = useNavigate();

  // If not logged in, redirect to homepage (user page is for logged-in users only).
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/", { state: { openLogin: true } });
    }
  }, [isLoggedIn, navigate]);

  const handleClose = () => {
    navigate("/");
  };

  if (!isLoggedIn) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-void text-ink font-sans selection:bg-brand selection:text-void">
      <div className="noise-overlay" />
      <Navbar
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLoginClick={onOpenLogin}
        onRegisterClick={onOpenLogin}
        onLogoutClick={onLogoutClick}
        onAdminClick={() => navigate("/")}
        lang={lang}
        setLang={setLang}
      />
      {/* Core user dashboard content (modal in page mode). */}
      <UserDashboardModal
        isOpen={true}
        onClose={handleClose}
        onHackathonSelect={onHackathonSelect}
        onVerifyClick={onVerifyClick}
        onUserUpdate={onUserUpdate}
        lang={lang}
        asPage={true}
      />

      {/* Global footer: full-width background, 1200px max-width content (matches Hackathon Detail page). */}
      <SiteFooter lang={lang} />
    </div>
  );
}

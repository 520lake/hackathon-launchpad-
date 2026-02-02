/**
 * Full-page view for a single hackathon (detail).
 *
 * This page:
 * - Reuses `HackathonDetailModal` in "page" mode so the detail appears on its
 *   own route instead of in a popup.
 * - Wraps everything with the global `Navbar` and `SiteFooter` so the page
 *   matches the 1200px core-width layout used across the site.
 * - Is reached via /hackathon/:id (e.g. from Explore or Latest Events).
 */
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Landing/Navbar";
import HackathonDetailModal from "../components/HackathonDetailModal";
import { SiteFooter } from "../components/Layout/SiteFooter";

interface HackathonDetailPageProps {
  lang: "zh" | "en";
  setLang: (l: "zh" | "en") => void;
  isLoggedIn: boolean;
  currentUser: any;
  onOpenLogin: () => void;
  onEdit?: (hackathon: any) => void;
}

export default function HackathonDetailPage({
  lang,
  setLang,
  isLoggedIn,
  currentUser,
  onOpenLogin,
  onEdit,
}: HackathonDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hackathonId = id ? parseInt(id, 10) : null;

  const handleClose = () => {
    navigate("/");
  };

  const handleEdit = (hackathon: any) => {
    if (onEdit) {
      onEdit(hackathon);
    } else {
      navigate("/create", { state: { editingHackathon: hackathon } });
    }
  };

  if (!hackathonId || isNaN(hackathonId)) {
    navigate("/");
    return null;
  }

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
      {/* Core hackathon detail content rendered as a full page (not a popup). */}
      <HackathonDetailModal
        isOpen={true}
        onClose={handleClose}
        hackathonId={hackathonId}
        onEdit={handleEdit}
        lang={lang}
        asPage={true}
      />

      {/* Global footer: full-width background, 1200px max-width content. */}
      <SiteFooter lang={lang} />
    </div>
  );
}

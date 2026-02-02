/**
 * Full-page view for creating a new hackathon (Initiate Action).
 * Reuses CreateHackathonModal in "page" mode so the form appears on its own route
 * instead of in a popup. Users reach this page via the Hero "发起行动" button.
 * When navigated with state.editingHackathon (e.g. from detail page Edit), shows edit form.
 */
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Landing/Navbar";
import CreateHackathonModal from "../components/CreateHackathonModal";
import { SiteFooter } from "../components/Layout/SiteFooter";

interface CreateHackathonPageProps {
  lang: "zh" | "en";
  setLang: (l: "zh" | "en") => void;
  isLoggedIn: boolean;
  currentUser: any;
  onOpenLogin: () => void;
}

export default function CreateHackathonPage({
  lang,
  setLang,
  isLoggedIn,
  currentUser,
  onOpenLogin,
}: CreateHackathonPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const editingHackathon = (location.state as { editingHackathon?: any } | null)
    ?.editingHackathon;

  const handleClose = () => {
    navigate("/");
  };

  // If not logged in, show a prompt to log in first instead of the form.
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-void text-ink font-sans selection:bg-brand selection:text-void">
        <div className="noise-overlay" />
        <Navbar
          isLoggedIn={false}
          currentUser={null}
          onLoginClick={onOpenLogin}
          onRegisterClick={onOpenLogin}
          onLogoutClick={() => {}}
          onAdminClick={() => {}}
          lang={lang}
          setLang={setLang}
        />
        {/* Core content: same max-width (1200px) as Hackathon Detail and SiteFooter for consistent layout. */}
        <main className="max-w-[1200px] mx-auto w-full px-6 py-20 text-center">
          <h1 className="text-3xl font-black text-ink mb-4">
            <span className="text-brand">//</span>{" "}
            {lang === "zh" ? "发起行动" : "INITIATE ACTION"}
          </h1>
          <p className="text-gray-400 font-light mb-8 max-w-md mx-auto">
            {lang === "zh"
              ? "请先登录以创建新的黑客松活动。"
              : "Please log in to create a new hackathon."}
          </p>
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-8 py-4 bg-brand text-void font-bold text-lg hover:bg-white transition-all clip-path-slant"
          >
            {lang === "zh" ? "登录" : "LOG IN"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="ml-4 px-8 py-4 border border-white/20 text-ink font-mono text-lg hover:border-brand hover:text-brand transition-all"
          >
            {lang === "zh" ? "返回首页" : "BACK TO HOME"}
          </button>
        </main>

        {/* Global footer: full-width background, 1200px max-width content (matches Hackathon Detail page). */}
        <SiteFooter lang={lang} />
      </div>
    );
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
      {/* Core create-hackathon content (modal in page mode). */}
      <CreateHackathonModal
        isOpen={true}
        onClose={handleClose}
        initialData={editingHackathon}
        lang={lang}
        asPage={true}
      />

      {/* Global footer: full-width background, 1200px max-width content (matches Hackathon Detail page). */}
      <SiteFooter lang={lang} />
    </div>
  );
}

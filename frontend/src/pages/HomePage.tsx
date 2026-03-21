import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";

// Shared hackathon type returned by the list endpoint
import type { HackathonListItem } from "@/types/hackathon";

// Landing Components
import Hero from "../components/Landing/Hero";
import { LatestEvents, About, Schedule } from "../components/Landing/Sections";

// Modals
import RegisterModal from "../components/RegisterModal";
import LoginModal from "../components/LoginModal";
import UserDashboardModal from "../components/UserDashboardModal";
import AdminDashboardModal from "../components/AdminDashboardModal";
import AITeamMatchModal from "../components/AITeamMatchModal";
import ActivateOrganizerModal from "../components/ActivateOrganizerModal";

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
  fetchCurrentUser: () => void;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, fetchCurrentUser } =
    useOutletContext<OutletContextType>();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isTeamMatchOpen, setIsTeamMatchOpen] = useState(false);
  const [isActivateOrganizerOpen, setIsActivateOrganizerOpen] = useState(false);
  // Stores the most recent hackathons fetched from the list endpoint
  const [latestHackathons, setLatestHackathons] = useState<HackathonListItem[]>([]);

  useEffect(() => {
    fetchLatestHackathons();
  }, []);

  const fetchLatestHackathons = async () => {
    try {
      const response = await axios.get("/api/v1/hackathons");
      setLatestHackathons(response.data.slice(0, 6));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateHackathonClick = async () => {
    if (isLoggedIn) {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data;

        if (user.can_create_hackathon) {
          navigate("/create/new");
          return;
        }

        setIsActivateOrganizerOpen(true);
      } catch (e: any) {
        if (
          e.response &&
          (e.response.status === 401 || e.response.status === 403)
        ) {
          localStorage.removeItem("token");
          setIsLoginOpen(true);
        }
      }
    } else {
      setIsLoginOpen(true);
    }
  };

  // Navigate to event detail page
  const openHackathonDetail = (id: number) => {
    navigate(`/events/${id}`);
  };

  // Navigate to events list page
  const openEventsList = (mode: "list" | "ai" = "list") => {
    navigate(`/events${mode === "ai" ? "?mode=ai" : ""}`);
  };

  return (
    <>
      {/* Hero Section */}
      <Hero
        onCreateClick={handleCreateHackathonClick}
        onExploreClick={() => openEventsList("list")}
        onAIGuideClick={() => openEventsList("ai")}
        onCommunityClick={() => navigate("/community")}
      />

      <About />

      <LatestEvents
        hackathons={latestHackathons}
        onDetailClick={openHackathonDetail}
        onViewAll={() => openEventsList("list")}
      />

      <Schedule />

      {/* Modals */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <UserDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        onHackathonSelect={openHackathonDetail}
        onUserUpdate={fetchCurrentUser}
        onTeamMatchClick={() => setIsTeamMatchOpen(true)}
      />
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />
      <AITeamMatchModal
        isOpen={isTeamMatchOpen}
        onClose={() => setIsTeamMatchOpen(false)}
        hackathonId={null}
      />
      <ActivateOrganizerModal
        isOpen={isActivateOrganizerOpen}
        onClose={() => setIsActivateOrganizerOpen(false)}
        onSuccess={() => {
          fetchCurrentUser();
          navigate("/create/new");
        }}
      />
    </>
  );
}

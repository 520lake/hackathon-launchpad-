import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Hero from '../components/Landing/Hero';
import { LatestEvents, About, Features, Partners, Schedule } from '../components/Landing/Sections';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

interface Hackathon {
  id: number;
  title: string;
  description: string;
  start_date: string;
  status: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    openLogin, 
    openCreateHackathon, 
    lang 
  } = useUI();
  
  const [latestHackathons, setLatestHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    fetchLatestHackathons();
  }, []);

  const fetchLatestHackathons = async () => {
    try {
      // Mock data if backend fails or empty
      const res = await axios.get('http://localhost:8000/api/hackathons/?skip=0&limit=3');
      if (res.data && Array.isArray(res.data)) {
        setLatestHackathons(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch latest hackathons", err);
    }
  };

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    openCreateHackathon();
  };

  const handleExploreClick = () => {
    navigate('/hackathons');
  };

  const handleAIGuideClick = () => {
    navigate('/hackathons?mode=ai');
  };

  return (
    <>
      <Hero 
        onCreateClick={handleCreateClick}
        onExploreClick={handleExploreClick}
        onAIGuideClick={handleAIGuideClick}
        lang={lang}
      />
      <LatestEvents 
        hackathons={latestHackathons}
        onDetailClick={(id) => navigate(`/hackathons/${id}`)} 
        onViewAll={() => navigate('/hackathons')}
        lang={lang} 
      />
      <About lang={lang} />
      <Features lang={lang} />
      <Schedule lang={lang} />
      <Partners />
    </>
  );
}

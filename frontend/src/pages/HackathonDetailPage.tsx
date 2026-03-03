import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import type { Hackathon, Team, Project, Enrollment } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ProjectCard from '../components/dashboard/ProjectCard';

// New Components
import HackathonHero from '../components/hackathon/HackathonHero';
import HackathonSidebar from '../components/hackathon/HackathonSidebar';
import HackathonOverview from '../components/hackathon/HackathonOverview';
import HackathonSchedule from '../components/hackathon/HackathonSchedule';
import HackathonParticipants from '../components/hackathon/HackathonParticipants';

// Sub-Modals
import JudgingModal from '../components/JudgingModal';
import AIResumeModal from '../components/AIResumeModal';
import AIParticipantTools from '../components/AIParticipantTools';

export default function HackathonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, openLogin } = useUI();
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  
  // User status
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  
  // AI Tools State
  const [activeAiTool, setActiveAiTool] = useState<'idea' | 'pitch' | 'roadmap' | 'teammate' | 'resume'>('idea');
  const [projects, setProjects] = useState<Project[]>([]);

  // Modals
  const [isJudgingOpen, setIsJudgingOpen] = useState(false);
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);

  useEffect(() => {
    if (activeSection === 'projects' && hackathon) {
        axios.get(`http://localhost:8000/api/v1/projects/?hackathon_id=${hackathon.id}`)
             .then(res => setProjects(res.data))
             .catch(console.error);
    }
  }, [activeSection, hackathon]);

  useEffect(() => {
    if (id) {
      fetchHackathonDetail(id);
    }
  }, [id, user]);

  const fetchHackathonDetail = async (hackathonId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/hackathons/${hackathonId}`);
      setHackathon(response.data);
      
      if (user) {
        if (response.data.organizer_id === user.id) {
          setIsOrganizer(true);
        }
        try {
          const enrollRes = await axios.get(`http://localhost:8000/api/hackathons/${hackathonId}/enrollment`);
          setEnrollment(enrollRes.data);
        } catch (e) {
          setEnrollment(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch hackathon detail", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      openLogin();
      return;
    }
    try {
      await axios.post(`http://localhost:8000/api/hackathons/${id}/register`);
      alert(lang === 'zh' ? '报名成功！' : 'Registered successfully!');
      fetchHackathonDetail(id!);
    } catch (error) {
      console.error("Registration failed", error);
      alert(lang === 'zh' ? '报名失败' : 'Registration failed');
    }
  };

  const handleAiToolSelect = (tool: 'resume' | 'teammate' | 'idea' | 'pitch' | 'roadmap') => {
      if (tool === 'resume') {
          setIsAIResumeOpen(true);
      } else {
          setActiveSection('ai_toolkit');
          setActiveAiTool(tool);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">404 NOT FOUND</h2>
          <Button onClick={() => navigate('/hackathons')}>Back to List</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-ink pb-20 font-sans">
      <HackathonHero 
        hackathon={hackathon}
        isOrganizer={isOrganizer}
        enrollment={enrollment}
        onRegister={handleRegister}
        onNavigateSubmit={() => navigate(`/hackathons/${hackathon.id}/submit`)}
        onNavigateEdit={() => alert('Edit feature coming soon')}
        onAiTeammate={() => { setActiveSection('ai_toolkit'); setActiveAiTool('teammate'); }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Navigation */}
          <HackathonSidebar 
            hackathon={hackathon}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            lang={lang}
            onAiToolSelect={handleAiToolSelect}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
             {activeSection === 'overview' && <HackathonOverview hackathon={hackathon} />}
             
             {activeSection === 'schedule' && <HackathonSchedule hackathon={hackathon} />}
             
             {activeSection === 'participants' && <HackathonParticipants hackathonId={hackathon.id} />}
             
             {activeSection === 'projects' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-white">Projects Showcase</h2>
                        {enrollment && (
                            <Button onClick={() => navigate(`/hackathons/${hackathon.id}/submit`)}>Submit My Project</Button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.length > 0 ? (
                            projects.map(project => (
                                <div key={project.id} className="cursor-pointer" onClick={() => alert(`Project: ${project.title}`)}>
                                    <ProjectCard project={project} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-void/30">
                                <p className="text-ink/40">No projects submitted yet.</p>
                            </div>
                        )}
                    </div>
                </div>
             )}

             {activeSection === 'ai_toolkit' && (
                 user ? (
                   <AIParticipantTools 
                      user={user as any} 
                      hackathon={hackathon as any} 
                      activeTool={activeAiTool as any}
                      onToolChange={(tool) => setActiveAiTool(tool as any)}
                   />
                 ) : (
                   <div className="text-center py-12 bg-void/30 rounded-xl border border-white/10">
                     <p className="mb-4 text-ink/60">Please login to access AI tools.</p>
                     <Button onClick={openLogin}>Login Now</Button>
                   </div>
                 )
             )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <JudgingModal 
        isOpen={isJudgingOpen} 
        onClose={() => setIsJudgingOpen(false)} 
        hackathonId={hackathon.id}
        hackathonTitle={hackathon.title}
        lang={lang}
      />
      <AIResumeModal
        isOpen={isAIResumeOpen}
        onClose={() => setIsAIResumeOpen(false)}
        lang={lang}
      />
    </div>
  );
}

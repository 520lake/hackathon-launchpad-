import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Hackathon, Team, Project, Recruitment, Enrollment } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ReactMarkdown from 'react-markdown';

// Sub-Modals (Keeping as modals for now)
import SubmitProjectModal from '../components/SubmitProjectModal';
import JudgingModal from '../components/JudgingModal';
import ResultPublishModal from '../components/ResultPublishModal';
import AIResumeModal from '../components/AIResumeModal';
import AIParticipantTools from '../components/AIParticipantTools';
import AIProjectAssistant from '../components/AIProjectAssistant';

export default function HackathonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, openLogin } = useUI();
  
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // User status relative to this hackathon
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isJudge, setIsJudge] = useState(false);

  // Sub-modal states
  const [isSubmitProjectOpen, setIsSubmitProjectOpen] = useState(false);
  const [isJudgingOpen, setIsJudgingOpen] = useState(false);
  const [isResultPublishOpen, setIsResultPublishOpen] = useState(false);
  const [isAIResumeOpen, setIsAIResumeOpen] = useState(false);

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
      
      // Check roles
      if (user) {
        if (response.data.organizer_id === user.id) {
          setIsOrganizer(true);
        }
        // Fetch enrollment
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
    <div className="min-h-screen bg-void text-ink pb-20">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full bg-ink/5 overflow-hidden">
        {hackathon.cover_image ? (
          <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-void pattern-grid-lg opacity-50"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <span className={`inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider border backdrop-blur-md
                ${hackathon.status === 'registering' ? 'bg-brand/90 text-void border-brand' : 'bg-ink/90 text-void border-ink'}
              `}>
                {hackathon.status}
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-ink mb-2 tracking-tighter uppercase">
                {hackathon.title}
              </h1>
              <p className="text-xl text-ink/70 max-w-2xl font-mono">
                {hackathon.subtitle || hackathon.description.substring(0, 100)}...
              </p>
            </div>
            
            <div className="flex gap-4">
              {!enrollment ? (
                 <Button 
                   size="lg" 
                   className="animate-pulse shadow-[0_0_20px_rgba(212,163,115,0.5)]"
                   onClick={handleRegister}
                   disabled={hackathon.status === 'ended'}
                 >
                   {lang === 'zh' ? '立即报名' : 'REGISTER NOW'}
                 </Button>
              ) : (
                 <Button size="lg" variant="outline" disabled>
                   {lang === 'zh' ? '已报名' : 'REGISTERED'}
                 </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Info */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-8">
            <Card className="p-6 border-l-4 border-l-brand">
              <h3 className="text-xs font-mono uppercase text-ink/50 mb-4 tracking-widest">
                {lang === 'zh' ? '赛事信息' : 'EVENT INFO'}
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-ink/40 text-xs block mb-1">Timeline</label>
                  <p className="font-bold">{new Date(hackathon.start_date).toLocaleDateString()} - {new Date(hackathon.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-ink/40 text-xs block mb-1">Format</label>
                  <p className="capitalize">{hackathon.format || 'Online'}</p>
                </div>
                <div>
                   <label className="text-ink/40 text-xs block mb-1">Organizer</label>
                   <p>{hackathon.organizer_name || 'Unknown'}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xs font-mono uppercase text-ink/50 mb-4 tracking-widest">
                {lang === 'zh' ? 'AI 助手' : 'AI ASSISTANT'}
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-xs" onClick={() => setIsAIResumeOpen(true)}>
                  📝 {lang === 'zh' ? '简历优化' : 'Optimize Resume'}
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  🤝 {lang === 'zh' ? '寻找队友' : 'Find Teammates'}
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  💡 {lang === 'zh' ? '创意生成' : 'Generate Ideas'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Tabs Content */}
          <div className="flex-1">
             <div className="flex border-b border-ink/10 mb-8 overflow-x-auto">
               {['overview', 'participants', 'projects', 'judging', 'results'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-6 py-4 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap
                     ${activeTab === tab 
                       ? 'border-brand text-brand font-bold' 
                       : 'border-transparent text-ink/50 hover:text-ink'
                     }
                   `}
                 >
                   {tab}
                 </button>
               ))}
             </div>

             <div className="min-h-[400px]">
               {activeTab === 'overview' && (
                 <div className="prose prose-invert max-w-none">
                   <ReactMarkdown>{hackathon.description}</ReactMarkdown>
                   
                   {hackathon.awards_detail && (
                     <div className="mt-8">
                       <h3 className="text-2xl font-bold mb-4 font-mono text-brand">:: AWARDS ::</h3>
                       <ReactMarkdown>{hackathon.awards_detail}</ReactMarkdown>
                     </div>
                   )}
                 </div>
               )}

               {activeTab === 'participants' && (
                 user ? (
                   <AIParticipantTools user={user as any} hackathon={hackathon as any} />
                 ) : (
                   <div className="text-center py-12">
                     <p className="mb-4">Please login to access AI tools.</p>
                     <Button onClick={openLogin}>Login</Button>
                   </div>
                 )
               )}

               {activeTab === 'projects' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Project list placeholder */}
                   <Card className="p-6 border-dashed border-2 border-ink/20 flex items-center justify-center min-h-[200px]">
                     <div className="text-center">
                       <p className="text-ink/40 mb-4">Projects will be displayed here.</p>
                       {enrollment && (
                         <Button onClick={() => setIsSubmitProjectOpen(true)}>Submit Project</Button>
                       )}
                     </div>
                   </Card>
                 </div>
               )}
               
               {activeTab === 'judging' && isJudge && (
                 <div className="text-center py-12">
                   <p className="mb-4">Access the Judging Panel to score projects.</p>
                   <Button onClick={() => setIsJudgingOpen(true)}>Open Judging Panel</Button>
                 </div>
               )}

               {activeTab === 'results' && (
                 <div className="text-center py-12">
                   <p className="text-ink/60">Results pending...</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SubmitProjectModal 
        isOpen={isSubmitProjectOpen} 
        onClose={() => setIsSubmitProjectOpen(false)} 
        hackathonId={hackathon.id}
        lang={lang}
      />
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
      {/* Add other modals as needed */}
    </div>
  );
}

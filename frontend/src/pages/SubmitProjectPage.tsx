import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import AIProjectAssistant from '../components/AIProjectAssistant';
import type { Hackathon, Team, Project, TeamReadWithMembers } from '../types';

export default function SubmitProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, login } = useAuth(); // login needed if token refresh?
  const { lang } = useUI();

  // State
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [team, setTeam] = useState<TeamReadWithMembers | null>(null); // Use specific type if possible, or any
  const [existingProject, setExistingProject] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAiRefine, setShowAiRefine] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchData();
    } else if (!user) {
       // If not logged in, redirect or show message
       // But App.tsx might handle protection or we check here
    }
  }, [id, user]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Hackathon
      const hackRes = await axios.get(`http://localhost:8000/api/hackathons/${id}`);
      setHackathon(hackRes.data);

      // 2. Fetch My Teams to find the team for this hackathon
      const token = localStorage.getItem('token');
      const teamsRes = await axios.get(`http://localhost:8000/api/v1/teams/me`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      
      const myTeams = teamsRes.data;
      const currentTeam = myTeams.find((t: any) => t.hackathon_id === parseInt(id!));
      
      if (currentTeam) {
          setTeam(currentTeam);
          
          // 3. Fetch My Projects to see if we already submitted
          const projectsRes = await axios.get(`http://localhost:8000/api/v1/projects/me`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          // Check if any project belongs to this team
          const project = projectsRes.data.find((p: any) => p.team_id === currentTeam.id);
          
          if (project) {
              setExistingProject(project);
              // Populate Form
              setTitle(project.title);
              setDescription(project.description);
              setTechStack(project.tech_stack || '');
              setRepoUrl(project.repo_url || '');
              setDemoUrl(project.demo_url || '');
              setVideoUrl(project.video_url || '');
              setAttachmentUrl(project.attachment_url || '');
              setCoverImage(project.cover_image || '');
          }
      }

    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const res = await axios.post('http://localhost:8000/api/v1/upload/image', formData, {
        headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` 
        }
    });
    return res.data.url;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        try {
            const url = await uploadImage(e.target.files[0]);
            setCoverImage(url);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!team) {
        setError("You must join a team first!");
        setSubmitting(false);
        return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if ((repoUrl && !urlPattern.test(repoUrl)) || 
        (demoUrl && !urlPattern.test(demoUrl)) || 
        (videoUrl && !urlPattern.test(videoUrl)) ||
        (attachmentUrl && !urlPattern.test(attachmentUrl))) {
        setError('请输入有效的 URL (http/https)');
        setSubmitting(false);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
            title,
            description,
            tech_stack: techStack,
            repo_url: repoUrl,
            demo_url: demoUrl,
            video_url: videoUrl,
            attachment_url: attachmentUrl,
            cover_image: coverImage,
        };

      if (existingProject) {
        await axios.patch(`http://localhost:8000/api/v1/projects/${existingProject.id}`, payload, { headers });
      } else {
        await axios.post(`http://localhost:8000/api/v1/projects/?team_id=${team.id}`, payload, { headers });
      }
      
      alert('作品提交成功！');
      navigate(`/hackathons/${id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
        <div className="min-h-screen bg-void flex items-center justify-center pt-24">
            <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full"></div>
        </div>
    );
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-void flex items-center justify-center pt-24">
              <div className="text-center">
                  <h2 className="text-xl text-white mb-4">Please login to submit a project.</h2>
                  <Button onClick={() => navigate('/')}>Go Home</Button>
              </div>
          </div>
      );
  }

  if (!team) {
      return (
          <div className="min-h-screen bg-void flex items-center justify-center pt-24">
              <Card className="max-w-md w-full p-8 text-center border-brand/50">
                  <h2 className="text-xl font-bold text-white mb-4">Team Required</h2>
                  <p className="text-ink-light mb-6">You must join or create a team to submit a project for this hackathon.</p>
                  <Button onClick={() => navigate(`/hackathons/${id}`)}>Back to Hackathon</Button>
              </Card>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-void text-ink pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                    {existingProject ? '编辑项目' : '提交项目'}
                </h1>
                <p className="text-ink-light">
                    {hackathon?.title} • {team.name}
                </p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/hackathons/${id}`)}>
                返回
            </Button>
        </div>

        <Card className="p-0 overflow-hidden border-2 border-brand shadow-[8px_8px_0px_0px_rgba(212,163,115,0.5)] bg-void">
            {error && (
                <div className="p-4 bg-red-500/10 border-b border-red-500 text-red-500 font-mono text-sm">
                    ERROR: {error}
                </div>
            )}

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                            项目名称
                        </label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="给你的杰作起个名字..."
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-brand font-mono uppercase tracking-widest">
                                项目简介
                            </label>
                            <button 
                                type="button"
                                onClick={() => setShowAiRefine(!showAiRefine)}
                                className="text-xs font-mono text-brand hover:underline flex items-center gap-1"
                            >
                                ✨ AI 润色
                            </button>
                        </div>
                        
                        {showAiRefine && (
                            <div className="mb-4">
                                <AIProjectAssistant 
                                    mode="refine" 
                                    currentDescription={description} 
                                    onRefineDescription={(refined) => {
                                        setDescription(refined);
                                        setShowAiRefine(false);
                                    }}
                                    lang={lang} 
                                />
                            </div>
                        )}

                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-40 bg-ink/5 border border-ink/20 p-4 text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all font-mono text-sm resize-none rounded-md"
                            placeholder="详细描述你的项目解决了什么问题，以及它是如何工作的..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                            技术栈
                        </label>
                        <Input 
                            value={techStack} 
                            onChange={(e) => setTechStack(e.target.value)} 
                            placeholder="React, FastAPI, Solidity, etc."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-ink/50 font-mono mb-2 uppercase tracking-widest">
                                REPO URL
                            </label>
                            <Input 
                                value={repoUrl} 
                                onChange={(e) => setRepoUrl(e.target.value)} 
                                placeholder="https://github.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ink/50 font-mono mb-2 uppercase tracking-widest">
                                DEMO URL
                            </label>
                            <Input 
                                value={demoUrl} 
                                onChange={(e) => setDemoUrl(e.target.value)} 
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Media */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                            封面图片
                        </label>
                        <div className="relative w-full aspect-video bg-ink/5 border border-dashed border-ink/20 flex items-center justify-center overflow-hidden group hover:border-brand transition-colors cursor-pointer rounded-md">
                            {coverImage ? (
                                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <span className="text-2xl mb-2 block">📷</span>
                                    <span className="text-xs text-ink/40 font-mono">CLICK TO UPLOAD</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleCoverUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-ink/50 font-mono mb-2 uppercase tracking-widest">
                            VIDEO URL
                        </label>
                        <Input 
                            value={videoUrl} 
                            onChange={(e) => setVideoUrl(e.target.value)} 
                            placeholder="Youtube / Bilibili Link"
                        />
                    </div>

                    <div className="pt-8">
                         <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 text-lg font-bold">
                            {submitting ? '提交中...' : '提交项目'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
}
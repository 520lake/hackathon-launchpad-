import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import AIProjectAssistant from './AIProjectAssistant';

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  teamId?: number;
  existingProject?: any;
  initialDescription?: string;
  initialData?: {
    title?: string;
    description?: string;
    tech_stack?: string;
  };
  lang: 'zh' | 'en';
}

export default function SubmitProjectModal({ isOpen, onClose, teamId, existingProject, initialDescription, initialData, lang }: SubmitProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Assistance
  const [showAiRefine, setShowAiRefine] = useState(false);

  useEffect(() => {
    if (existingProject) {
      setTitle(existingProject.title);
      setDescription(initialDescription || existingProject.description);
      setTechStack(existingProject.tech_stack || '');
      setRepoUrl(existingProject.repo_url || '');
      setDemoUrl(existingProject.demo_url || '');
      setVideoUrl(existingProject.video_url || '');
      setAttachmentUrl(existingProject.attachment_url || '');
      setCoverImage(existingProject.cover_image || '');
    } else if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialDescription || initialData.description || '');
      setTechStack(initialData.tech_stack || '');
      setRepoUrl('');
      setDemoUrl('');
      setVideoUrl('');
      setAttachmentUrl('');
      setCoverImage('');
    } else {
      // Reset if new
      setTitle('');
      setDescription(initialDescription || '');
      setTechStack('');
      setRepoUrl('');
      setDemoUrl('');
      setVideoUrl('');
      setAttachmentUrl('');
      setCoverImage('');
    }
  }, [existingProject, isOpen, initialDescription, initialData]);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const res = await axios.post('/api/v1/upload/image', formData, {
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
    setLoading(true);
    setError('');

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if ((repoUrl && !urlPattern.test(repoUrl)) || 
        (demoUrl && !urlPattern.test(demoUrl)) || 
        (videoUrl && !urlPattern.test(videoUrl)) ||
        (attachmentUrl && !urlPattern.test(attachmentUrl))) {
        setError(lang === 'zh' ? '请输入有效的 URL (http/https)' : 'Please enter valid URLs (http/https)');
        setLoading(false);
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
        await axios.patch(`/api/v1/projects/${existingProject.id}`, payload, { headers });
      } else {
        if (!teamId) {
             throw new Error("Team ID is missing");
        }
        await axios.post(`/api/v1/projects/?team_id=${teamId}`, payload, { headers });
      }
      
      alert(lang === 'zh' ? '作品提交成功！' : 'Project submitted successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || (lang === 'zh' ? '提交失败' : 'Submission failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 border-brand shadow-[8px_8px_0px_0px_rgba(212,163,115,0.5)]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ink/10 bg-void">
          <h2 className="text-2xl font-black text-ink uppercase tracking-tighter">
            {existingProject ? (lang === 'zh' ? '编辑项目' : 'EDIT PROJECT') : (lang === 'zh' ? '提交项目' : 'SUBMIT PROJECT')}
          </h2>
          <button onClick={onClose} className="text-ink/50 hover:text-brand font-mono font-bold text-xl">[X]</button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-void">
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 font-mono text-sm">
                    ERROR: {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                            {lang === 'zh' ? '项目名称' : 'PROJECT TITLE'}
                        </label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder={lang === 'zh' ? "给你的杰作起个名字..." : "Name your masterpiece..."}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-brand font-mono uppercase tracking-widest">
                                {lang === 'zh' ? '项目简介' : 'DESCRIPTION'}
                            </label>
                            <button 
                                type="button"
                                onClick={() => setShowAiRefine(!showAiRefine)}
                                className="text-xs font-mono text-brand hover:underline flex items-center gap-1"
                            >
                                ✨ {lang === 'zh' ? 'AI 润色' : 'AI Refine'}
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
                            className="w-full h-40 bg-ink/5 border border-ink/20 p-4 text-ink focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all font-mono text-sm resize-none"
                            placeholder={lang === 'zh' ? "详细描述你的项目解决了什么问题，以及它是如何工作的..." : "Describe what problem your project solves and how it works..."}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                            {lang === 'zh' ? '技术栈' : 'TECH STACK'}
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
                            {lang === 'zh' ? '封面图片' : 'COVER IMAGE'}
                        </label>
                        <div className="relative w-full aspect-video bg-ink/5 border border-dashed border-ink/20 flex items-center justify-center overflow-hidden group hover:border-brand transition-colors cursor-pointer">
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
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-ink/10 bg-ink/5 flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
                {lang === 'zh' ? '取消' : 'CANCEL'}
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (lang === 'zh' ? '提交中...' : 'SUBMITTING...') : (lang === 'zh' ? '提交项目' : 'SUBMIT PROJECT')}
            </Button>
        </div>

      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  teamId?: number; // For team hackathons
  registrationType?: 'team' | 'individual'; // Hackathon type
  existingSubmission?: any; // If editing
  initialDescription?: string;
  initialData?: {
    title?: string;
    description?: string;
    tech_stack?: string;
  };
}

export default function SubmitProjectModal({ isOpen, onClose, hackathonId, teamId, registrationType = 'team', existingSubmission, initialDescription, initialData }: SubmitProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState(''); // New field
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Assistance
  const [aiLoading, setAiLoading] = useState(false);
  const [innovationPrompt, setInnovationPrompt] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    if (existingSubmission) {
      setTitle(existingSubmission.title);
      setDescription(initialDescription || existingSubmission.description);
      setTechStack(existingSubmission.tech_stack || '');
      setRepoUrl(existingSubmission.repo_url || '');
      setDemoUrl(existingSubmission.demo_url || '');
      setVideoUrl(existingSubmission.video_url || '');
      setAttachmentUrl(existingSubmission.attachment_url || '');
      setCoverImage(existingSubmission.cover_image || '');
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
  }, [existingSubmission, isOpen, initialDescription, initialData]);

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

  if (!isOpen) return null;

  const handleAIAssist = async () => {
    if (!innovationPrompt.trim()) return;
    setAiLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post('/api/v1/ai/generate', {
            prompt: innovationPrompt,
            type: 'project'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const content = res.data.content;
        setDescription(prev => prev + '\n\n' + content.description);
        alert('AI 优化建议已生成并追加到简介中！');
    } catch (e) {
        console.error(e);
        alert('AI 辅助失败');
    } finally {
        setAiLoading(false);
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
        setError('请输入有效的 URL (http/https)');
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
                    // hackathon_id removed as it's not in ProjectCreate and linked via team
                };

      if (existingSubmission) {
        await axios.patch(`/api/v1/submissions/${existingSubmission.id}`, payload, { headers });
      } else {
        const params = new URLSearchParams();
        params.set('hackathon_id', String(hackathonId));
        if (registrationType === 'team' && teamId) {
          params.set('team_id', String(teamId));
        }
        await axios.post(`/api/v1/submissions/?${params.toString()}`, payload, { headers });
      }
      
      alert('作品提交成功！');
      onClose();
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-4xl border-2 border-brand shadow-[8px_8px_0px_0px_#000] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-brand bg-black">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {existingSubmission ? '编辑原型' : '提交原型'}
          </h2>
          <button 
            onClick={onClose}
            className="text-brand hover:text-white font-mono font-bold text-xl"
          >
            [X]
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
            {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 font-mono text-sm">
                ERROR: {error}
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Cover Image */}
            <div>
                <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                    项目封面
                </label>
                <div className="relative w-full h-48 bg-black/50 border border-brand/30 flex items-center justify-center overflow-hidden group">
                    {coverImage ? (
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-gray-500 font-mono text-sm">点击上传封面图片</div>
                    )}
                    <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleCoverUpload}
                    />
                    <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                    项目代号 *
                </label>
                <input
                type="text"
                required
                className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={'例如: Aurathon AI'}
                />
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-brand font-mono uppercase tracking-widest">
                        技术简报 *
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className="text-xs text-brand hover:text-white font-mono border border-brand px-2 py-1 uppercase"
                    >
                        ✨ AI 增强
                    </button>
                </div>

                {showAiPanel && (
                    <div className="mb-4 p-4 bg-brand/5 border border-brand/20">
                        <input
                            type="text"
                            placeholder={'输入核心创意点...'}
                            className="w-full mb-3 px-3 py-2 text-sm bg-black border border-gray-700 text-white font-mono focus:border-brand focus:outline-none"
                            value={innovationPrompt}
                            onChange={(e) => setInnovationPrompt(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={handleAIAssist}
                            disabled={aiLoading || !innovationPrompt}
                            className="w-full py-2 bg-brand text-black font-bold text-xs uppercase hover:bg-white transition-colors disabled:opacity-50"
                        >
                            {aiLoading ? '计算中...' : '生成商业计划/润色文案'}
                        </button>
                    </div>
                )}

                <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700 h-40"
                placeholder={'描述你的项目解决了什么问题，使用了什么技术...'}
                required
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                    技术栈 (以逗号分隔)
                </label>
                <input 
                  type="text" 
                  value={techStack} 
                  onChange={e => setTechStack(e.target.value)}
                  placeholder="React, TypeScript, FastAPI, etc."
                  className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                        代码仓库
                    </label>
                    <input
                    type="url"
                    className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                        演示 DEMO
                    </label>
                    <input
                    type="url"
                    className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://demo.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                        视频展示
                    </label>
                    <input
                    type="url"
                    className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                        附件链接
                    </label>
                    <input
                    type="url"
                    className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="Google Drive / Dropbox"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand text-black font-black text-lg uppercase tracking-wider hover:bg-white border-2 border-brand shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50 mt-8"
            >
                {loading ? '正在上传...' : '确认部署'}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
}
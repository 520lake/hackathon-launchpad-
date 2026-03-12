import { useState, useEffect } from 'react';
import axios from 'axios';

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  teamId?: number; // Added teamId
  existingProject?: any; // If editing
  initialDescription?: string;
  initialData?: {
    title?: string;
    description?: string;
    tech_stack?: string;
  };
}

export default function SubmitProjectModal({ isOpen, onClose, teamId, existingProject, initialDescription, initialData }: SubmitProjectModalProps) {
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
    if (existingProject) {
      setTitle(existingProject.title);
      setDescription(initialDescription || existingProject.description);
      setTechStack(existingProject.tech_stack || ''); // New field
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
      setTechStack(''); // New field
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

      if (existingProject) {
        await axios.patch(`/api/v1/projects/${existingProject.id}`, payload, { headers }); // Changed put to patch
      } else {
        if (!teamId) {
             throw new Error("Team ID is missing");
        }
        await axios.post(`/api/v1/projects/?team_id=${teamId}`, payload, { headers });
      }
      
      alert('作品提交成功！');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 w-full max-w-4xl border border-zinc-800 rounded-[24px] relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[20px] bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {existingProject ? '编辑项目' : '提交作品'}
              </h2>
              <p className="text-[11px] text-zinc-500">完善你的项目信息</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-[12px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <p className="text-[12px] text-red-400">{error}</p>
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Cover Image */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    项目封面
                </label>
                <div className="relative w-full h-48 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center overflow-hidden group cursor-pointer hover:border-zinc-600 transition-colors">
                    {coverImage ? (
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-zinc-500 text-sm flex flex-col items-center gap-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            点击上传封面图片
                        </div>
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
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    项目标题 *
                </label>
                <input
                type="text"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl text-white px-4 py-3 focus:border-brand/50 focus:outline-none placeholder-zinc-600 transition-colors"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={'例如: AI智能助手'}
                />
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-zinc-300">
                        项目描述 *
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className="flex items-center gap-1.5 text-[11px] text-brand hover:text-white bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-[24px] transition-colors border border-brand/20"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI 增强
                    </button>
                </div>

                {showAiPanel && (
                    <div className="mb-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl">
                        <input
                            type="text"
                            placeholder={'输入核心创意点...'}
                            className="w-full mb-3 px-4 py-2.5 text-sm bg-zinc-900 border border-zinc-700 rounded-[24px] text-white placeholder-zinc-600 focus:border-brand/50 focus:outline-none transition-colors"
                            value={innovationPrompt}
                            onChange={(e) => setInnovationPrompt(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={handleAIAssist}
                            disabled={aiLoading || !innovationPrompt}
                            className="w-full py-2.5 bg-brand text-black font-medium text-sm rounded-[24px] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {aiLoading ? '生成中...' : '生成商业计划/润色文案'}
                        </button>
                    </div>
                )}

                <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl text-white px-4 py-3 focus:border-brand/50 focus:outline-none placeholder-zinc-600 h-40 resize-none transition-colors"
                placeholder={'描述你的项目解决了什么问题，使用了什么技术...'}
                required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    技术栈 (以逗号分隔)
                </label>
                <input 
                  type="text" 
                  value={techStack} 
                  onChange={e => setTechStack(e.target.value)}
                  placeholder="React, TypeScript, FastAPI, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl text-white px-4 py-3 focus:border-brand/50 focus:outline-none placeholder-zinc-600 transition-colors"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        代码仓库
                    </label>
                    <input
                    type="url"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl text-white px-4 py-3 focus:border-brand/50 focus:outline-none placeholder-zinc-600 transition-colors"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        演示 DEMO
                    </label>
                    <input
                    type="url"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl text-white px-4 py-3 focus:border-brand/50 focus:outline-none placeholder-zinc-600 transition-colors"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://demo.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        视频展示
                    </label>
                    <input
                    type="url"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl text-white px-4 py-3 focus:border-brand/50 focus:outline-none placeholder-zinc-600 transition-colors"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        附件链接
                    </label>
                    <input
                    type="url"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl text-white px-4 py-3 focus:border-brand/50 focus:outline-none placeholder-zinc-600 transition-colors"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="Google Drive / Dropbox"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand text-black font-semibold text-base rounded-[24px] hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        提交中...
                    </span>
                ) : (
                    existingProject ? '保存修改' : '提交作品'
                )}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
}

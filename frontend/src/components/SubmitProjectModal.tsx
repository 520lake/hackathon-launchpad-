import { useState, useEffect } from 'react';
import axios from 'axios';

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  existingProject?: any; // If editing
  lang: 'zh' | 'en';
}

export default function SubmitProjectModal({ isOpen, onClose, hackathonId, existingProject, lang }: SubmitProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Assistance
  const [aiLoading, setAiLoading] = useState(false);
  const [innovationPrompt, setInnovationPrompt] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    if (existingProject) {
      setTitle(existingProject.title);
      setDescription(existingProject.description);
      setRepoUrl(existingProject.repo_url || '');
      setDemoUrl(existingProject.demo_url || '');
      setVideoUrl(existingProject.video_url || '');
      setAttachmentUrl(existingProject.attachment_url || '');
    } else {
      // Reset if new
      setTitle('');
      setDescription('');
      setRepoUrl('');
      setDemoUrl('');
      setVideoUrl('');
      setAttachmentUrl('');
    }
  }, [existingProject, isOpen]);

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
        alert(lang === 'zh' ? 'AI 优化建议已生成并追加到简介中！' : 'AI suggestions generated and appended!');
    } catch (e) {
        console.error(e);
        alert(lang === 'zh' ? 'AI 辅助失败' : 'AI assist failed');
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
        repo_url: repoUrl,
        demo_url: demoUrl,
        video_url: videoUrl,
        attachment_url: attachmentUrl,
        hackathon_id: hackathonId
      };

      if (existingProject) {
        await axios.put(`/api/v1/projects/${existingProject.id}`, payload, { headers });
      } else {
        await axios.post('/api/v1/projects/', payload, { headers });
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-4xl border-2 border-brand shadow-[8px_8px_0px_0px_#000] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-brand bg-black">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
            {existingProject ? (lang === 'zh' ? '编辑原型' : 'EDIT PROTOTYPE') : (lang === 'zh' ? '提交原型' : 'SUBMIT PROTOTYPE')}
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
            <div>
                <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                    {lang === 'zh' ? '项目代号' : 'PROJECT CODENAME'} *
                </label>
                <input
                type="text"
                required
                className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === 'zh' ? "例如: Aura AI" : "e.g., Aura AI"}
                />
            </div>
            
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-brand font-mono uppercase tracking-widest">
                        {lang === 'zh' ? '技术简报' : 'TECH BRIEF'} *
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        className="text-xs text-brand hover:text-white font-mono border border-brand px-2 py-1 uppercase"
                    >
                        {lang === 'zh' ? '✨ AI 增强' : '✨ AI ENHANCE'}
                    </button>
                </div>

                {showAiPanel && (
                    <div className="mb-4 p-4 bg-brand/5 border border-brand/20">
                        <input
                            type="text"
                            placeholder={lang === 'zh' ? "输入核心创意点..." : "Enter core concept..."}
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
                            {aiLoading ? (lang === 'zh' ? '计算中...' : 'PROCESSING...') : (lang === 'zh' ? '生成商业计划/润色文案' : 'GENERATE BUSINESS PLAN / POLISH')}
                        </button>
                    </div>
                )}

                <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700 h-40"
                placeholder={lang === 'zh' ? "描述你的项目解决了什么问题，使用了什么技术..." : "Describe the problem solved and tech stack used..."}
                required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                        {lang === 'zh' ? '代码仓库' : 'REPOSITORY'}
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
                        {lang === 'zh' ? '演示 DEMO' : 'LIVE DEMO'}
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
                        {lang === 'zh' ? '视频展示' : 'VIDEO SHOWCASE'}
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
                        {lang === 'zh' ? '附件链接' : 'ATTACHMENT'}
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
                {loading ? (lang === 'zh' ? '正在上传...' : 'UPLOADING...') : (lang === 'zh' ? '确认部署' : 'DEPLOY PROTOTYPE')}
            </button>
            </form>
        </div>
      </div>
    </div>
  );
}
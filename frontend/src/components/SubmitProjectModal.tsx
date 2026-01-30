import { useState, useEffect } from 'react';
import axios from 'axios';

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  existingProject?: any; // If editing
}

export default function SubmitProjectModal({ isOpen, onClose, hackathonId, existingProject }: SubmitProjectModalProps) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-0 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">项目名称 *</label>
            <input
              type="text"
              required
              className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: VibeBuild AI"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                项目简介 *
                </label>
                <button
                    type="button"
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                    ✨ AI 创意辅助
                </button>
            </div>

            {showAiPanel && (
                <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                    <input
                        type="text"
                        placeholder="输入一句话描述你的创意点..."
                        className="w-full mb-2 px-3 py-1.5 text-sm rounded border border-purple-200 dark:border-purple-700 dark:bg-gray-800"
                        value={innovationPrompt}
                        onChange={(e) => setInnovationPrompt(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={handleAIAssist}
                        disabled={aiLoading || !innovationPrompt}
                        className="w-full py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        {aiLoading ? '生成中...' : '生成商业计划/润色文案'}
                    </button>
                </div>
            )}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white h-32"
              placeholder="描述你的项目解决了什么问题，使用了什么技术..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">代码仓库 URL</label>
            <input
              type="url"
              className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">演示 Demo URL</label>
            <input
              type="url"
              className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">演示视频 URL</label>
            <input
              type="url"
              className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">附件链接 (Google Drive/Dropbox)</label>
            <input
              type="url"
              className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-50 mt-4"
          >
            {loading ? '提交中...' : '确认提交'}
          </button>
        </form>
      </div>
    </div>
  );
}

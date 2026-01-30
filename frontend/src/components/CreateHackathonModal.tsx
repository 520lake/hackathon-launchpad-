import { useState, useEffect } from 'react';
import axios from 'axios';

interface CreateHackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // Add initialData for edit mode
}

export default function CreateHackathonModal({ isOpen, onClose, initialData }: CreateHackathonModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [themeTags, setThemeTags] = useState('');
  const [professionalismTags, setProfessionalismTags] = useState('');
  
  // Timelines
  const [startDate, setStartDate] = useState(''); // Competition Start
  const [endDate, setEndDate] = useState('');     // Competition End
  const [registrationStartDate, setRegistrationStartDate] = useState('');
  const [registrationEndDate, setRegistrationEndDate] = useState('');
  const [submissionStartDate, setSubmissionStartDate] = useState('');
  const [submissionEndDate, setSubmissionEndDate] = useState('');
  const [judgingStartDate, setJudgingStartDate] = useState('');
  const [judgingEndDate, setJudgingEndDate] = useState('');

  // Details
  const [awardsDetail, setAwardsDetail] = useState('');
  const [rulesDetail, setRulesDetail] = useState('');
  
  // Judging
  const [judges, setJudges] = useState<string[]>([]);
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [scoringDimensions, setScoringDimensions] = useState<{name: string, description: string, weight: number}[]>([]);
  const [newDimension, setNewDimension] = useState({ name: '', description: '', weight: 10 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'timeline' | 'details' | 'judging'>('basic');
  const [isVerified, setIsVerified] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        checkUserVerification();
        
        if (initialData) {
            // Pre-fill data for editing
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setCoverImage(initialData.cover_image || '');
            setThemeTags(initialData.theme_tags || '');
            setProfessionalismTags(initialData.professionalism_tags || '');
            
            // Helper to format date YYYY-MM-DD
            const fmt = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';
            
            setStartDate(fmt(initialData.start_date));
            setEndDate(fmt(initialData.end_date));
            setRegistrationStartDate(fmt(initialData.registration_start_date));
            setRegistrationEndDate(fmt(initialData.registration_end_date));
            setSubmissionStartDate(fmt(initialData.submission_start_date));
            setSubmissionEndDate(fmt(initialData.submission_end_date));
            setJudgingStartDate(fmt(initialData.judging_start_date));
            setJudgingEndDate(fmt(initialData.judging_end_date));
            
            setAwardsDetail(initialData.awards_detail || '');
            setRulesDetail(initialData.rules_detail || '');
            
            if (initialData.scoring_dimensions) {
                try {
                    setScoringDimensions(JSON.parse(initialData.scoring_dimensions));
                } catch (e) {
                    console.error("Failed to parse scoring dimensions", e);
                }
            }
        } else {
            // Reset fields for new creation
            setTitle('');
            setDescription('');
            setCoverImage('');
            setThemeTags('');
            setProfessionalismTags('');
            setStartDate('');
            setEndDate('');
            setRegistrationStartDate('');
            setRegistrationEndDate('');
            setSubmissionStartDate('');
            setSubmissionEndDate('');
            setJudgingStartDate('');
            setJudgingEndDate('');
            setAwardsDetail('');
            setRulesDetail('');
            setScoringDimensions([]);
            setJudges([]);
        }
    }
  }, [isOpen, initialData]);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post('/api/v1/ai/generate', {
            prompt: aiPrompt,
            type: 'hackathon'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const content = res.data.content;
        setTitle(content.title);
        setDescription(content.description);
        setThemeTags(content.theme_tags);
        setProfessionalismTags(content.professionalism_tags);
        setRulesDetail(content.rules_detail);
        setAwardsDetail(content.awards_detail);
        setScoringDimensions(content.scoring_dimensions);
        
        // Auto-fill dates for convenience if empty
        if (!startDate) {
            const today = new Date();
            const nextMonth = new Date(); nextMonth.setMonth(today.getMonth() + 1);
            setRegistrationStartDate(today.toISOString().split('T')[0]);
            setRegistrationEndDate(nextMonth.toISOString().split('T')[0]);
            setStartDate(nextMonth.toISOString().split('T')[0]);
            
            const end = new Date(nextMonth); end.setDate(end.getDate() + 2);
            setEndDate(end.toISOString().split('T')[0]);
            setSubmissionStartDate(nextMonth.toISOString().split('T')[0]);
            setSubmissionEndDate(end.toISOString().split('T')[0]);
            setJudgingStartDate(end.toISOString().split('T')[0]);
            
            const resultDay = new Date(end); resultDay.setDate(resultDay.getDate() + 2);
            setJudgingEndDate(resultDay.toISOString().split('T')[0]);
        }

        alert('AI 生成成功！请检查并调整内容。');
    } catch (e) {
        console.error(e);
        alert('AI 生成失败，请重试');
    } finally {
        setAiLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/v1/upload/image', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}` 
                }
            });
            setCoverImage(res.data.url);
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
    }
  };

  const checkUserVerification = async () => {
      try {
          const token = localStorage.getItem('token');
          if (token) {
              const res = await axios.get('/api/v1/users/me', {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setIsVerified(res.data.is_verified);
          }
      } catch (e) {
          console.error("Failed to check verification", e);
      }
  };

  if (!isOpen) return null;

  const addJudge = () => {
      if (newJudgeEmail && !judges.includes(newJudgeEmail)) {
          setJudges([...judges, newJudgeEmail]);
          setNewJudgeEmail('');
      }
  };

  const removeJudge = (email: string) => {
      setJudges(judges.filter(j => j !== email));
  };

  const addDimension = () => {
      if (newDimension.name) {
          setScoringDimensions([...scoringDimensions, newDimension]);
          setNewDimension({ name: '', description: '', weight: 10 });
      }
  };

  const removeDimension = (index: number) => {
      setScoringDimensions(scoringDimensions.filter((_, i) => i !== index));
  };

  const validateTimes = () => {
    if (new Date(registrationEndDate) > new Date(endDate)) {
      setError('报名截止时间不能晚于比赛结束时间');
      return false;
    }
    if (new Date(submissionEndDate) > new Date(judgingStartDate)) {
      setError('提交截止时间不能晚于评审开始时间');
      return false;
    }
    return true;
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    setError('');
    
    // Real-name auth check for publishing
    if (status === 'published' && !isVerified) {
        setError('发布活动需先完成实名认证');
        return;
    }

    // Basic validation
    if (!title || !startDate || !endDate) {
        setError('请填写必要信息（标题、比赛时间）');
        return;
    }
    
    // Strict validation for publishing
    if (status === 'published') {
        if (!description || !coverImage || !themeTags) {
            setError('发布活动需填写完整信息（简介、封面、标签）');
            return;
        }
        if (!registrationStartDate || !registrationEndDate || !submissionEndDate) {
            setError('发布活动需填写完整时间流程');
            return;
        }
    }

    if (!validateTimes()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const payload = {
        title,
        description,
        cover_image: coverImage,
        theme_tags: themeTags,
        professionalism_tags: professionalismTags,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
        registration_end_date: registrationEndDate ? new Date(registrationEndDate).toISOString() : null,
        submission_start_date: submissionStartDate ? new Date(submissionStartDate).toISOString() : null,
        submission_end_date: submissionEndDate ? new Date(submissionEndDate).toISOString() : null,
        judging_start_date: judgingStartDate ? new Date(judgingStartDate).toISOString() : null,
        judging_end_date: judgingEndDate ? new Date(judgingEndDate).toISOString() : null,
        awards_detail: awardsDetail,
        rules_detail: rulesDetail,
        scoring_dimensions: JSON.stringify(scoringDimensions),
        status: status
      };

      let res;
      if (initialData && initialData.id) {
          // Edit mode
          res = await axios.patch(`/api/v1/hackathons/${initialData.id}`, payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
      } else {
          // Create mode
          res = await axios.post('/api/v1/hackathons/', payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
      }
      
      // Appoint Judges (Only for new judges or if not handled)
      // Note: Judges handling in edit mode is complex (add/remove), 
      // current logic appends new ones. It might error if already exists, but that's fine (caught).
      if (judges.length > 0 && res.data.id) {
          for (const email of judges) {
              try {
                  await axios.post(`/api/v1/hackathons/${res.data.id}/judges`, null, {
                      params: { user_email: email },
                      headers: { Authorization: `Bearer ${token}` }
                  });
              } catch (e) {
                  console.error(`Failed to appoint judge ${email}`, e);
              }
          }
      }
      
      alert(initialData ? '活动修改成功！' : (status === 'draft' ? '草稿保存成功！' : '活动发布成功！'));
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail));
      } else {
        setError('操作失败，请检查网络或重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-0 relative transform transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{initialData ? '编辑黑客松' : '发起黑客松'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
            <button 
                onClick={() => setActiveTab('basic')}
                className={`py-3 px-4 font-medium border-b-2 transition ${activeTab === 'basic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            >
                基础信息
            </button>
            <button 
                onClick={() => setActiveTab('timeline')}
                className={`py-3 px-4 font-medium border-b-2 transition ${activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            >
                时间流程
            </button>
            <button 
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 font-medium border-b-2 transition ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            >
                规则与奖项
            </button>
            <button 
                onClick={() => setActiveTab('judging')}
                className={`py-3 px-4 font-medium border-b-2 transition ${activeTab === 'judging' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            >
                评审设置
            </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
            {/* AI Generator Banner */}
            {activeTab === 'basic' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">✨</span>
                        <h3 className="font-bold text-purple-900 dark:text-purple-100">AI 智能活动策划</h3>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700 dark:bg-gray-800"
                            placeholder="输入活动主题，例如：Web3 游戏开发黑客松..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        <button 
                            onClick={handleAIGenerate}
                            disabled={aiLoading || !aiPrompt}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {aiLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    生成中...
                                </>
                            ) : (
                                '一键生成'
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-300 mt-2 ml-1">
                        自动生成标题、简介、规则、奖项设置和评审维度。
                    </p>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {activeTab === 'basic' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">活动名称 *</label>
                        <input type="text" className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700" value={title} onChange={e => setTitle(e.target.value)} placeholder="输入活动名称" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">封面图片</label>
                        <div className="flex gap-2 mb-2">
                             <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                              "/>
                        </div>
                        <input type="text" className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="或者输入图片 URL..." />
                        {coverImage && (
                            <img src={coverImage} alt="Cover Preview" className="mt-2 h-32 w-auto object-cover rounded-lg" />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">活动简介</label>
                        <textarea className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700 h-24" value={description} onChange={e => setDescription(e.target.value)} placeholder="一句话介绍活动..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">主题标签 (逗号分隔)</label>
                            <input type="text" className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700" value={themeTags} onChange={e => setThemeTags(e.target.value)} placeholder="Web3, AI, Game..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">专业度标签</label>
                            <input type="text" className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700" value={professionalismTags} onChange={e => setProfessionalismTags(e.target.value)} placeholder="Beginner, Pro..." />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'timeline' && (
                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="font-semibold mb-3">比赛时间 (核心周期) *</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-gray-500">开始</label><input type="datetime-local" className="w-full border rounded p-2" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                            <div><label className="text-xs text-gray-500">结束</label><input type="datetime-local" className="w-full border rounded p-2" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">报名周期</h3>
                            <div><label className="text-xs text-gray-500">开始</label><input type="datetime-local" className="w-full border rounded p-2" value={registrationStartDate} onChange={e => setRegistrationStartDate(e.target.value)} /></div>
                            <div><label className="text-xs text-gray-500">截止</label><input type="datetime-local" className="w-full border rounded p-2" value={registrationEndDate} onChange={e => setRegistrationEndDate(e.target.value)} /></div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">作品提交周期</h3>
                            <div><label className="text-xs text-gray-500">开始</label><input type="datetime-local" className="w-full border rounded p-2" value={submissionStartDate} onChange={e => setSubmissionStartDate(e.target.value)} /></div>
                            <div><label className="text-xs text-gray-500">截止</label><input type="datetime-local" className="w-full border rounded p-2" value={submissionEndDate} onChange={e => setSubmissionEndDate(e.target.value)} /></div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">评审周期</h3>
                            <div><label className="text-xs text-gray-500">开始</label><input type="datetime-local" className="w-full border rounded p-2" value={judgingStartDate} onChange={e => setJudgingStartDate(e.target.value)} /></div>
                            <div><label className="text-xs text-gray-500">结束</label><input type="datetime-local" className="w-full border rounded p-2" value={judgingEndDate} onChange={e => setJudgingEndDate(e.target.value)} /></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'judging' && (
                <div className="space-y-6">
                    {/* Judges Section */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">任命评委</h3>
                        <div className="flex space-x-2">
                            <input 
                                type="email" 
                                className="input-field flex-1 px-4 py-2 rounded-lg border dark:bg-gray-700" 
                                placeholder="输入评委邮箱" 
                                value={newJudgeEmail} 
                                onChange={e => setNewJudgeEmail(e.target.value)} 
                            />
                            <button 
                                onClick={addJudge}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                                添加
                            </button>
                        </div>
                        {judges.length > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                                {judges.map((email, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span>{email}</span>
                                        <button onClick={() => removeJudge(email)} className="text-red-500 hover:text-red-700">移除</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500">评委需先在平台注册账号。</p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                    {/* Scoring Dimensions Section */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">评审维度</h3>
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4">
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 text-sm" 
                                    placeholder="维度名称 (如: 创新性)" 
                                    value={newDimension.name} 
                                    onChange={e => setNewDimension({...newDimension, name: e.target.value})} 
                                />
                            </div>
                            <div className="col-span-5">
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 text-sm" 
                                    placeholder="描述" 
                                    value={newDimension.description} 
                                    onChange={e => setNewDimension({...newDimension, description: e.target.value})} 
                                />
                            </div>
                            <div className="col-span-2">
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 rounded border dark:bg-gray-700 text-sm" 
                                    placeholder="权重" 
                                    value={newDimension.weight} 
                                    onChange={e => setNewDimension({...newDimension, weight: parseInt(e.target.value) || 0})} 
                                />
                            </div>
                            <div className="col-span-1">
                                <button 
                                    onClick={addDimension}
                                    className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {scoringDimensions.length > 0 && (
                            <div className="space-y-2">
                                {scoringDimensions.map((dim, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-sm">
                                        <div className="flex-1 grid grid-cols-12 gap-2">
                                            <span className="col-span-4 font-medium">{dim.name}</span>
                                            <span className="col-span-6 text-gray-500 truncate">{dim.description}</span>
                                            <span className="col-span-2 text-gray-500">{dim.weight}%</span>
                                        </div>
                                        <button onClick={() => removeDimension(idx)} className="ml-2 text-red-500 hover:text-red-700">×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'details' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详细规则 (支持 Markdown)</label>
                        <textarea className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700 h-40 font-mono text-sm" value={rulesDetail} onChange={e => setRulesDetail(e.target.value)} placeholder="# 比赛规则..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">奖项设置</label>
                        <textarea className="input-field w-full px-4 py-2 rounded-lg border dark:bg-gray-700 h-32" value={awardsDetail} onChange={e => setAwardsDetail(e.target.value)} placeholder="一等奖：$1000..." />
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
            <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                保存草稿
            </button>
            <button onClick={() => handleSubmit('published')} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">
                {loading ? '发布中...' : '立即发布'}
            </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';

interface CreateHackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any; // Add initialData for edit mode
  lang: 'zh' | 'en';
}

export default function CreateHackathonModal({ isOpen, onClose, initialData, lang }: CreateHackathonModalProps) {
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
          res = await axios.post('/api/v1/hackathons', payload, {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-surface border border-brand/20 card-brutal w-full max-w-4xl p-0 relative transform transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-brand/20 flex justify-between items-center bg-surface/50">
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight">
            <span className="text-brand mr-2">//</span>
            {initialData ? (lang === 'zh' ? '编辑协议' : 'EDIT PROTOCOL') : (lang === 'zh' ? '发起行动' : 'INITIATE ACTION')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-brand text-xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand/10 px-6 bg-white/5">
            <button 
                onClick={() => setActiveTab('basic')}
                className={`py-3 px-4 font-mono text-sm border-b-2 transition-colors ${activeTab === 'basic' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                {lang === 'zh' ? '基础信息' : 'BASIC INFO'}
            </button>
            <button 
                onClick={() => setActiveTab('timeline')}
                className={`py-3 px-4 font-mono text-sm border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                {lang === 'zh' ? '时间同步' : 'TIMELINE'}
            </button>
            <button 
                onClick={() => setActiveTab('details')}
                className={`py-3 px-4 font-mono text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                {lang === 'zh' ? '规则与奖励' : 'RULES & AWARDS'}
            </button>
            <button 
                onClick={() => setActiveTab('judging')}
                className={`py-3 px-4 font-mono text-sm border-b-2 transition-colors ${activeTab === 'judging' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                {lang === 'zh' ? '评审核心' : 'JUDGING CORE'}
            </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-surface/50 scrollbar-thin scrollbar-thumb-brand/20 scrollbar-track-transparent">
            {/* AI Generator Banner */}
            {activeTab === 'basic' && (
                <div className="mb-8 p-1 bg-gradient-to-r from-brand/20 to-purple-600/20 border border-brand/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay pointer-events-none" />
                    <div className="p-4 bg-black/40 backdrop-blur-sm relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl animate-pulse">⚡</span>
                            <h3 className="font-black text-brand tracking-widest uppercase">{lang === 'zh' ? 'AI 架构师模式' : 'AI ARCHITECT MODE'}</h3>
                        </div>
                        <div className="flex gap-0">
                            <input 
                                type="text" 
                                className="flex-1 px-4 py-3 bg-black/50 border border-brand/20 text-ink placeholder-gray-400 focus:border-brand focus:outline-none font-mono text-sm"
                                placeholder={lang === 'zh' ? "输入指令 [例如: AI 医疗创新赛]" : "Enter prompt [e.g. AI Health Innovation]"}
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                            />
                            <button 
                                onClick={handleAIGenerate}
                                disabled={aiLoading || !aiPrompt}
                                className="px-6 py-3 bg-brand/10 border-y border-r border-brand/20 text-brand font-mono font-bold hover:bg-brand hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 uppercase text-sm"
                            >
                                {aiLoading ? (
                                    <>
                                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                                        {lang === 'zh' ? '正在运算...' : 'COMPUTING...'}
                                    </>
                                ) : (
                                    lang === 'zh' ? '生成核心架构' : 'GENERATE ARCHITECTURE'
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-brand/60 mt-2 font-mono uppercase tracking-wider">
                            &gt; {lang === 'zh' ? '通过神经网络链接自动生成清单、规则和评分逻辑。' : 'Auto-generate manifest, rules, and scoring logic via neural link.'}
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-500/50 text-red-400 font-mono text-sm flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            {activeTab === 'basic' && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">行动代号 (名称) *</label>
                        <input type="text" className="w-full px-4 py-3 bg-white/5 border border-white/10 text-ink focus:border-brand focus:outline-none font-bold tracking-wide placeholder-gray-400" value={title} onChange={e => setTitle(e.target.value)} placeholder="输入活动名称..." />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">视觉密钥 (封面)</label>
                        <div className="flex gap-2 mb-2">
                             <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-xs text-gray-400 font-mono
                                file:mr-4 file:py-2 file:px-4
                                file:border border-brand/20
                                file:text-xs file:font-mono
                                file:bg-brand/10 file:text-brand
                                hover:file:bg-brand/20
                                cursor-pointer
                              "/>
                        </div>
                        <input type="text" className="w-full px-4 py-2 bg-white/5 border border-white/10 text-ink focus:border-brand focus:outline-none font-mono text-sm placeholder-gray-400" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="或输入图片 URL..." />
                        {coverImage && (
                            <img src={coverImage} alt="Cover Preview" className="mt-4 h-40 w-full object-cover border border-white/10 opacity-80" />
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">简报 (描述)</label>
                        <textarea className="w-full px-4 py-3 bg-white/5 border border-white/10 text-ink focus:border-brand focus:outline-none font-light h-24 placeholder-gray-400 resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="任务简报..." />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">赛道标签</label>
                            <input type="text" className="w-full px-4 py-2 bg-white/5 border border-white/10 text-ink focus:border-brand focus:outline-none font-mono text-sm placeholder-gray-400" value={themeTags} onChange={e => setThemeTags(e.target.value)} placeholder="AI, SaaS, Mobile..." />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest">专业等级</label>
                            <input type="text" className="w-full px-4 py-2 bg-white/5 border border-white/10 text-ink focus:border-brand focus:outline-none font-mono text-sm placeholder-gray-400" value={professionalismTags} onChange={e => setProfessionalismTags(e.target.value)} placeholder="初级, 进阶, 专家..." />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'timeline' && (
                <div className="space-y-8">
                    <div className="p-6 bg-white/5 border border-brand/20 relative">
                        <div className="absolute top-0 right-0 p-1 bg-brand text-black text-[10px] font-bold uppercase">{lang === 'zh' ? '关键路径' : 'CRITICAL PATH'}</div>
                        <h3 className="font-bold text-ink mb-4 uppercase tracking-widest text-sm">{lang === 'zh' ? '主流程 *' : 'MAIN FLOW *'}</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '开始时间' : 'START TIME'}</label><input type="datetime-local" className="w-full bg-black/50 border border-white/10 text-ink p-2 font-mono text-sm focus:border-brand outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '结束时间' : 'END TIME'}</label><input type="datetime-local" className="w-full bg-black/50 border border-white/10 text-ink p-2 font-mono text-sm focus:border-brand outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-white/10 pb-1">{lang === 'zh' ? '报名窗口' : 'REGISTRATION WINDOW'}</h3>
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '开启' : 'OPEN'}</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 text-ink p-2 font-mono text-xs focus:border-brand outline-none" value={registrationStartDate} onChange={e => setRegistrationStartDate(e.target.value)} /></div>
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '关闭' : 'CLOSE'}</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 text-ink p-2 font-mono text-xs focus:border-brand outline-none" value={registrationEndDate} onChange={e => setRegistrationEndDate(e.target.value)} /></div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-white/10 pb-1">{lang === 'zh' ? '提交窗口' : 'SUBMISSION WINDOW'}</h3>
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '开启' : 'OPEN'}</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 text-ink p-2 font-mono text-xs focus:border-brand outline-none" value={submissionStartDate} onChange={e => setSubmissionStartDate(e.target.value)} /></div>
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '关闭' : 'CLOSE'}</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 text-ink p-2 font-mono text-xs focus:border-brand outline-none" value={submissionEndDate} onChange={e => setSubmissionEndDate(e.target.value)} /></div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b border-white/10 pb-1">{lang === 'zh' ? '评审周期' : 'JUDGING PERIOD'}</h3>
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '开始' : 'START'}</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 text-ink p-2 font-mono text-xs focus:border-brand outline-none" value={judgingStartDate} onChange={e => setJudgingStartDate(e.target.value)} /></div>
                            <div><label className="text-[10px] font-mono text-gray-400 block mb-1">{lang === 'zh' ? '结束' : 'END'}</label><input type="datetime-local" className="w-full bg-white/5 border border-white/10 text-ink p-2 font-mono text-xs focus:border-brand outline-none" value={judgingEndDate} onChange={e => setJudgingEndDate(e.target.value)} /></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'judging' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-ink text-sm uppercase tracking-widest border-l-2 border-brand pl-3 mb-4">{lang === 'zh' ? '任命评审' : 'APPOINT ARBITERS'}</h3>
                        <div className="flex gap-2 mb-4">
                            <input type="email" className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-ink focus:border-brand outline-none font-mono text-sm" placeholder={lang === 'zh' ? "评审邮箱..." : "Arbiter Email..."} value={newJudgeEmail} onChange={e => setNewJudgeEmail(e.target.value)} />
                            <button onClick={addJudge} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-ink font-mono text-xs uppercase border border-white/10">{lang === 'zh' ? '添加' : 'ADD'}</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {judges.map(judge => (
                                <span key={judge} className="px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-mono flex items-center gap-2">
                                    {judge}
                                    <button onClick={() => removeJudge(judge)} className="hover:text-white">×</button>
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10">
                        <h3 className="font-bold text-ink text-sm uppercase tracking-widest border-l-2 border-brand pl-3 mb-4">{lang === 'zh' ? '评分维度' : 'EVALUATION METRICS'}</h3>
                        <div className="grid grid-cols-12 gap-2 mb-4">
                            <div className="col-span-3"><input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 text-ink font-mono text-xs outline-none focus:border-brand" placeholder={lang === 'zh' ? "维度名称" : "Metric Name"} value={newDimension.name} onChange={e => setNewDimension({...newDimension, name: e.target.value})} /></div>
                            <div className="col-span-6"><input type="text" className="w-full px-3 py-2 bg-white/5 border border-white/10 text-ink font-mono text-xs outline-none focus:border-brand" placeholder={lang === 'zh' ? "描述" : "Description"} value={newDimension.description} onChange={e => setNewDimension({...newDimension, description: e.target.value})} /></div>
                            <div className="col-span-2"><input type="number" className="w-full px-3 py-2 bg-white/5 border border-white/10 text-ink font-mono text-xs outline-none focus:border-brand" placeholder={lang === 'zh' ? "权重" : "Weight"} value={newDimension.weight} onChange={e => setNewDimension({...newDimension, weight: parseInt(e.target.value) || 0})} /></div>
                            <div className="col-span-1"><button onClick={addDimension} className="w-full h-full bg-brand/20 hover:bg-brand/30 text-brand font-bold flex items-center justify-center border border-brand/30">+</button></div>
                        </div>
                        <div className="space-y-2">
                            {scoringDimensions.map((dim, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 text-xs font-mono p-2 bg-white/5 border border-white/5">
                                    <div className="col-span-3 font-bold text-ink">{dim.name}</div>
                                    <div className="col-span-6 text-gray-400">{dim.description}</div>
                                    <div className="col-span-2 text-brand">{dim.weight}%</div>
                                    <div className="col-span-1 text-right"><button onClick={() => removeDimension(idx)} className="text-red-500 hover:text-red-400">×</button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'details' && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-widest">活动规则 (Markdown)</label>
                        <textarea className="w-full px-4 py-3 bg-white/5 border border-white/10 text-ink focus:border-brand focus:outline-none font-mono text-xs h-40 placeholder-gray-400 resize-none" value={rulesDetail} onChange={e => setRulesDetail(e.target.value)} placeholder="# 活动规则细则..." />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-widest">奖项设置</label>
                        <textarea className="w-full px-4 py-3 bg-white/5 border border-white/10 text-ink focus:border-brand focus:outline-none font-mono text-xs h-32 placeholder-gray-400 resize-none" value={awardsDetail} onChange={e => setAwardsDetail(e.target.value)} placeholder="一等奖: 1000 积分..." />
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-brand/20 flex justify-end space-x-4 bg-surface/50">
            <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 border border-white/10 text-gray-400 font-mono text-sm hover:bg-white/5 hover:text-white transition uppercase">
                保存草稿
            </button>
            <button onClick={() => handleSubmit('published')} disabled={loading} className="px-8 py-2 bg-brand text-black font-bold font-mono text-sm hover:bg-white hover:text-black transition shadow-[0_0_15px_rgba(212,163,115,0.3)] uppercase">
                {loading ? '发布中...' : '发布活动'}
            </button>
        </div>
      </div>
    </div>
  );
}

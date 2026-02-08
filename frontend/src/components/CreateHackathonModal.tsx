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
  const [awardsDetail, setAwardsDetail] = useState(''); // Kept for backward compat or raw text fallback
  const [rulesDetail, setRulesDetail] = useState('');
  
  // Judging
  const [judges, setJudges] = useState<string[]>([]);
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [scoringDimensions, setScoringDimensions] = useState<{name: string, description: string, weight: number}[]>([]);
  const [newDimension, setNewDimension] = useState({ name: '', description: '', weight: 10 });

  // New Fields
  const [subtitle, setSubtitle] = useState('');
  const [registrationType, setRegistrationType] = useState<'individual' | 'team'>('team');
  const [format, setFormat] = useState<'online' | 'offline'>('online');
  const [location, setLocation] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [resourceDetail, setResourceDetail] = useState('');
  
  // Contact Info
  const [contactInfo, setContactInfo] = useState<{text: string, image: string}>({ text: '', image: '' });

  // Structured Awards
  interface AwardItem {
      type: 'cash' | 'other' | 'mixed';
      name: string;
      count: number;
      amount?: number;
      prize?: string;
  }
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [newAward, setNewAward] = useState<AwardItem>({ type: 'cash', name: '', count: 1, amount: 0, prize: '' });

  // Step Control
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [showAiChat, setShowAiChat] = useState(true);

  useEffect(() => {
    if (isOpen) {
        checkUserVerification();
        setCurrentStep(1); // Reset to step 1
        
        if (initialData) {
            // Pre-fill data for editing
            setTitle(initialData.title || '');
            setSubtitle(initialData.subtitle || ''); // New
            setDescription(initialData.description || '');
            setCoverImage(initialData.cover_image || '');
            setThemeTags(initialData.theme_tags || '');
            setProfessionalismTags(initialData.professionalism_tags || '');
            
            setRegistrationType(initialData.registration_type || 'team'); // New
            setFormat(initialData.format || 'online'); // New
            setLocation(initialData.location || ''); // New
            setOrganizerName(initialData.organizer_name || ''); // New
            setRequirements(initialData.requirements || ''); // New
            setResourceDetail(initialData.resource_detail || ''); // New

            // Contact Info
            if (initialData.contact_info) {
                try {
                    setContactInfo(JSON.parse(initialData.contact_info));
                } catch {
                    setContactInfo({ text: initialData.contact_info, image: '' });
                }
            } else {
                setContactInfo({ text: '', image: '' });
            }

            // Awards
            if (initialData.awards_detail) {
                 try {
                     const parsed = JSON.parse(initialData.awards_detail);
                     if (Array.isArray(parsed)) {
                         setAwards(parsed);
                     } else {
                         // Fallback for old string data
                         setAwardsDetail(initialData.awards_detail); 
                     }
                 } catch {
                     setAwardsDetail(initialData.awards_detail || '');
                 }
            } else {
                setAwards([]);
            }

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
            setSubtitle('');
            setDescription('');
            setCoverImage('');
            setThemeTags('');
            setProfessionalismTags('');
            setRegistrationType('team');
            setFormat('online');
            setLocation('');
            setOrganizerName('');
            setRequirements('');
            setResourceDetail('');
            setContactInfo({ text: '', image: '' });
            setAwards([]);
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
    
    const newHistory = [...aiChatHistory, { role: 'user' as const, content: aiPrompt }];
    setAiChatHistory(newHistory);

    try {
        const token = localStorage.getItem('token');
        
        // Check if we are refining (if title exists)
        const isRefining = !!title;
        const contextData = isRefining ? {
            title, subtitle, description, requirements, resource_detail: resourceDetail,
            theme_tags: themeTags, professionalism_tags: professionalismTags,
            rules_detail: rulesDetail, awards_detail: awards, 
            scoring_dimensions: scoringDimensions
        } : undefined;

        const res = await axios.post('api/v1/ai/generate', {
            prompt: aiPrompt,
            type: 'hackathon',
            context_data: contextData
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const content = res.data.content;
        
        if (content.title) setTitle(content.title);
        if (content.subtitle) setSubtitle(content.subtitle);
        if (content.description) setDescription(content.description);
        if (content.theme_tags) setThemeTags(content.theme_tags);
        if (content.professionalism_tags) setProfessionalismTags(content.professionalism_tags);
        if (content.rules_detail) setRulesDetail(content.rules_detail);
        if (content.requirements) setRequirements(content.requirements);
        if (content.resource_detail) setResourceDetail(content.resource_detail);
        
        if (content.organizer_name) setOrganizerName(content.organizer_name);
        if (content.location) setLocation(content.location);
        if (content.registration_type && ['individual', 'team'].includes(content.registration_type)) {
            setRegistrationType(content.registration_type as any);
        }
        if (content.format && ['online', 'offline'].includes(content.format)) {
            setFormat(content.format as any);
        }
        if (content.contact_info_text) {
             setContactInfo(prev => ({ ...prev, text: content.contact_info_text }));
        }

        if (content.awards_detail) {
            if (typeof content.awards_detail === 'string') {
                setAwardsDetail(content.awards_detail);
            } else if (Array.isArray(content.awards_detail)) {
                setAwards(content.awards_detail);
            }
        }

        if (content.scoring_dimensions) setScoringDimensions(content.scoring_dimensions);
        
        // Auto-fill dates for convenience if empty (Creation mode)
        if (!startDate && !isRefining) {
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

        setAiChatHistory([...newHistory, { 
            role: 'ai', 
            content: isRefining 
                ? (lang === 'zh' ? '已更新活动信息。' : 'Event details updated.') 
                : (lang === 'zh' ? '已生成活动草案，请查看下方表单。' : 'Draft generated, please check the form below.')
        }]);
        setAiPrompt('');
    } catch (e) {
        console.error(e);
        setAiChatHistory([...newHistory, { role: 'ai', content: lang === 'zh' ? '生成失败，请重试' : 'Generation failed, please try again.' }]);
    } finally {
        setAiLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const res = await axios.post('api/v1/upload/image', formData, {
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

  const handleContactImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        try {
            const url = await uploadImage(e.target.files[0]);
            setContactInfo(prev => ({...prev, image: url}));
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
              const res = await axios.get('api/v1/users/me', {
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

  const addAward = () => {
      if (newAward.name) {
          setAwards([...awards, newAward]);
          setNewAward({ type: 'cash', name: '', count: 1, amount: 0, prize: '' });
      }
  };

  const removeAward = (index: number) => {
      setAwards(awards.filter((_, i) => i !== index));
  };

  const validateStep1 = () => {
      if (!title) { setError('请填写活动名称'); return false; }
      if (!coverImage) { setError('请上传缩略图'); return false; }
      if (!themeTags) { setError('请填写活动主题'); return false; }
      if (format === 'offline' && !location) { setError('线下活动请填写地点'); return false; }
      setError('');
      return true;
  };

  const validateStep2 = () => {
      if (!organizerName) { setError('请填写主办方'); return false; }
      if (!registrationStartDate || !registrationEndDate) { setError('请填写报名时间'); return false; }
      if (!submissionStartDate || !submissionEndDate) { setError('请填写作品提交时间'); return false; }
      if (!judgingStartDate || !judgingEndDate) { setError('请填写评审时间'); return false; }
      if (!description) { setError('请填写活动详情'); return false; }
      
      if (new Date(registrationEndDate) > new Date(endDate)) { setError('报名截止时间不能晚于比赛结束时间'); return false; }
      if (new Date(submissionEndDate) > new Date(judgingStartDate)) { setError('提交截止时间不能晚于评审开始时间'); return false; }
      
      if (scoringDimensions.length > 0) {
          const totalWeight = scoringDimensions.reduce((sum, dim) => sum + dim.weight, 0);
          if (totalWeight !== 100) {
              setError(`评审标准权重总和必须为 100% (当前: ${totalWeight}%)`);
              return false;
          }
      }

      setError('');
      return true;
  };

  const handleNext = () => {
      if (validateStep1()) {
          setCurrentStep(2);
      }
  };

  const handleBack = () => {
      setCurrentStep(1);
      setError('');
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    setError('');
    
    // Real-name auth check for publishing
    if (status === 'published' && !isVerified) {
        setError('发布活动需先完成实名认证');
        return;
    }

    if (currentStep === 1) {
        if (!validateStep1()) return;
        // Allow draft save on step 1
        if (status === 'published') {
            setCurrentStep(2); // Move to step 2 to finish
            return;
        }
    } else {
        if (!validateStep2()) return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      // Calculate overall start/end dates from sub-dates
    const dates = [
        registrationStartDate, registrationEndDate,
        submissionStartDate, submissionEndDate,
        judgingStartDate, judgingEndDate
    ].filter(Boolean).map(d => new Date(d).getTime());
    
    const calculatedStartDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : new Date().toISOString();
    const calculatedEndDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : new Date().toISOString();

    const payload = {
        title,
        subtitle,
        description,
        cover_image: coverImage,
        theme_tags: themeTags,
        professionalism_tags: professionalismTags,
        registration_type: registrationType,
        format,
        location: format === 'offline' ? location : '',
        organizer_name: organizerName,
        contact_info: JSON.stringify(contactInfo),
        requirements,
        resource_detail: resourceDetail,
        start_date: calculatedStartDate,
        end_date: calculatedEndDate,
        registration_start_date: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
        registration_end_date: registrationEndDate ? new Date(registrationEndDate).toISOString() : null,
        submission_start_date: submissionStartDate ? new Date(submissionStartDate).toISOString() : null,
        submission_end_date: submissionEndDate ? new Date(submissionEndDate).toISOString() : null,
        judging_start_date: judgingStartDate ? new Date(judgingStartDate).toISOString() : null,
        judging_end_date: judgingEndDate ? new Date(judgingEndDate).toISOString() : null,
        awards_detail: JSON.stringify(awards),
        rules_detail: rulesDetail, // Kept for backward compatibility or extra rules
        scoring_dimensions: JSON.stringify(scoringDimensions),
        status: status
      };

      let res;
      if (initialData && initialData.id) {
          // Edit mode
          res = await axios.patch(`api/v1/hackathons/${initialData.id}`, payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
      } else {
          // Create mode
          res = await axios.post('api/v1/hackathons', payload, {
              headers: { Authorization: `Bearer ${token}` }
          });
      }
      
      // Appoint Judges (Only for new judges or if not handled)
      // Note: Judges handling in edit mode is complex (add/remove), 
      // current logic appends new ones. It might error if already exists, but that's fine (caught).
      if (judges.length > 0 && res.data.id) {
          for (const email of judges) {
              try {
                  await axios.post(`api/v1/hackathons/${res.data.id}/judges`, null, {
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
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-surface border border-brand/20 card-brutal w-full max-w-5xl p-0 relative transform transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-brand/20 flex justify-between items-center bg-surface/50">
          <h2 className="text-2xl font-black text-ink uppercase tracking-tight flex items-center">
            <span className="text-brand mr-2">//</span>
            {initialData ? (lang === 'zh' ? '编辑协议' : 'EDIT PROTOCOL') : (lang === 'zh' ? '发起行动' : 'INITIATE ACTION')}
            <div className="ml-8 flex items-center space-x-2 text-sm font-mono">
                <span className={`px-2 py-1 ${currentStep === 1 ? 'bg-brand text-black' : 'text-gray-500'}`}>01 INFO</span>
                <span className="text-gray-600">--</span>
                <span className={`px-2 py-1 ${currentStep === 2 ? 'bg-brand text-black' : 'text-gray-500'}`}>02 DETAILS</span>
            </div>
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-brand text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-surface/50 scrollbar-thin scrollbar-thumb-brand/20 scrollbar-track-transparent">
            
            {/* AI Assistant Card - Prominent Entry */}
            <div className="mb-8 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand/20 to-transparent opacity-20 pointer-events-none" />
                
                <div className={`border border-brand/40 bg-black/60 transition-all duration-300 ${showAiChat ? 'shadow-[0_0_30px_rgba(212,163,115,0.15)]' : 'hover:border-brand/70'}`}>
                    {/* Header / Entry Point */}
                    <div 
                        className="p-5 flex justify-between items-center cursor-pointer"
                        onClick={() => setShowAiChat(!showAiChat)}
                    >
                        <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-none bg-brand text-black flex items-center justify-center text-xl font-bold shadow-lg ${aiLoading ? 'animate-pulse' : ''}`}>
                                ⚡
                             </div>
                             <div>
                                 <h3 className="font-black text-brand text-lg tracking-widest uppercase leading-none mb-1">
                                    {lang === 'zh' ? 'AI 活动架构师' : 'AI EVENT ARCHITECT'}
                                 </h3>
                                 <p className="text-gray-400 text-xs font-mono uppercase tracking-wider">
                                    {lang === 'zh' ? '自然语言生成完整活动方案' : 'GENERATE FULL EVENT PROTOCOL VIA NLP'}
                                 </p>
                             </div>
                        </div>
                        <button className={`px-4 py-2 border border-brand/50 text-brand text-xs font-bold uppercase hover:bg-brand hover:text-black transition-all ${showAiChat ? 'bg-brand/10' : ''}`}>
                            {showAiChat ? (lang === 'zh' ? '收起助手' : 'COLLAPSE') : (lang === 'zh' ? '让 AI 帮我创建' : 'LET AI HELP ME CREATE')}
                        </button>
                    </div>
                    
                    {/* Chat Interface */}
                    {showAiChat && (
                        <div className="border-t border-brand/20 p-5 bg-black/40 backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
                            {/* Chat History */}
                            {aiChatHistory.length > 0 ? (
                                <div className="mb-4 max-h-60 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-brand/20">
                                    {aiChatHistory.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[90%] p-3 text-sm font-mono border backdrop-blur-sm ${
                                                msg.role === 'user' 
                                                    ? 'bg-brand/10 border-brand/30 text-brand rounded-tl-lg rounded-bl-lg rounded-br-lg' 
                                                    : 'bg-white/5 border-white/10 text-gray-300 rounded-tr-lg rounded-br-lg rounded-bl-lg'
                                            }`}>
                                                <div className="flex justify-between items-center mb-1 opacity-50 text-[10px] uppercase tracking-wider border-b border-white/5 pb-1">
                                                    <span>{msg.role === 'user' ? 'USER COMMAND' : 'SYSTEM RESPONSE'}</span>
                                                    <span>{new Date().toLocaleTimeString()}</span>
                                                </div>
                                                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {aiLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-brand/5 border border-brand/20 p-3 text-brand text-xs font-mono animate-pulse flex items-center gap-2">
                                                <span className="animate-spin">⟳</span>
                                                PROCESSING REQUEST...
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-6 p-4 border border-dashed border-white/10 text-center text-gray-500 text-sm font-mono">
                                    {lang === 'zh' 
                                        ? '试试输入: "创建一个以Web3游戏为主题的黑客松，要求使用Rust开发，奖金池5万美元"' 
                                        : 'Try: "Create a Web3 Gaming hackathon using Rust, with $50k prize pool"'}
                                </div>
                            )}
                            
                            {/* Input Area */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-sm opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                                <div className="relative flex gap-0 bg-black">
                                    <textarea 
                                        className="flex-1 px-4 py-4 bg-black border border-brand/30 text-ink placeholder-gray-600 focus:border-brand focus:outline-none font-mono text-sm resize-none h-24 transition-all leading-relaxed"
                                        placeholder={lang === 'zh' ? "在此描述您的活动构想..." : "Describe your event concept here..."}
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAIGenerate();
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={handleAIGenerate}
                                        disabled={aiLoading || !aiPrompt.trim()}
                                        className="px-6 bg-brand text-black font-black uppercase hover:bg-white transition-all disabled:opacity-50 disabled:hover:bg-brand text-sm tracking-widest flex flex-col items-center justify-center border-l border-black min-w-[100px]"
                                    >
                                        <span>{lang === 'zh' ? '执行' : 'RUN'}</span>
                                        <span className="text-[10px] font-normal opacity-70 mt-1">CTRL+ENTER</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '活动名称' : 'HACKATHON TITLE'} *</label>
                                <input 
                                    className="w-full bg-black/50 border border-brand/20 p-4 text-ink focus:border-brand focus:outline-none placeholder-gray-600"
                                    placeholder={lang === 'zh' ? "输入活动名称" : "Enter title"}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '副标题' : 'SUBTITLE'}</label>
                                <input 
                                    className="w-full bg-black/50 border border-brand/20 p-4 text-ink focus:border-brand focus:outline-none placeholder-gray-600"
                                    placeholder={lang === 'zh' ? "一句话描述活动亮点" : "Subtitle"}
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '活动主题 (标题云)' : 'THEME TAGS'} *</label>
                                <input 
                                    className="w-full bg-black/50 border border-brand/20 p-4 text-ink focus:border-brand focus:outline-none placeholder-gray-600"
                                    placeholder={lang === 'zh' ? "Web3, AI, GameFi (用逗号分隔)" : "Tags separated by comma"}
                                    value={themeTags}
                                    onChange={(e) => setThemeTags(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '封面缩略图' : 'COVER IMAGE'} *</label>
                            <div className="border border-dashed border-brand/30 h-[220px] bg-black/30 flex flex-col items-center justify-center relative overflow-hidden group hover:border-brand/60 transition-colors">
                                {coverImage ? (
                                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="text-4xl mb-2 text-brand/50">+</div>
                                        <span className="text-gray-500 text-xs font-mono uppercase">Upload 16:9 Image</span>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleCoverUpload}
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand/10">
                        <div>
                            <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '报名形式' : 'REGISTRATION TYPE'} *</label>
                            <div className="flex space-x-4">
                                <label className={`flex items-center space-x-2 cursor-pointer p-3 border ${registrationType === 'individual' ? 'border-brand bg-brand/10' : 'border-gray-700 hover:border-gray-500'} flex-1`}>
                                    <input type="radio" checked={registrationType === 'individual'} onChange={() => setRegistrationType('individual')} className="hidden" />
                                    <span className={registrationType === 'individual' ? 'text-brand' : 'text-gray-400'}>👤 {lang === 'zh' ? '个人报名' : 'Individual'}</span>
                                </label>
                                <label className={`flex items-center space-x-2 cursor-pointer p-3 border ${registrationType === 'team' ? 'border-brand bg-brand/10' : 'border-gray-700 hover:border-gray-500'} flex-1`}>
                                    <input type="radio" checked={registrationType === 'team'} onChange={() => setRegistrationType('team')} className="hidden" />
                                    <span className={registrationType === 'team' ? 'text-brand' : 'text-gray-400'}>👥 {lang === 'zh' ? '团队报名' : 'Team'}</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '举办形式' : 'FORMAT'} *</label>
                            <div className="flex space-x-4">
                                <label className={`flex items-center space-x-2 cursor-pointer p-3 border ${format === 'online' ? 'border-brand bg-brand/10' : 'border-gray-700 hover:border-gray-500'} flex-1`}>
                                    <input type="radio" checked={format === 'online'} onChange={() => setFormat('online')} className="hidden" />
                                    <span className={format === 'online' ? 'text-brand' : 'text-gray-400'}>🌐 {lang === 'zh' ? '线上' : 'Online'}</span>
                                </label>
                                <label className={`flex items-center space-x-2 cursor-pointer p-3 border ${format === 'offline' ? 'border-brand bg-brand/10' : 'border-gray-700 hover:border-gray-500'} flex-1`}>
                                    <input type="radio" checked={format === 'offline'} onChange={() => setFormat('offline')} className="hidden" />
                                    <span className={format === 'offline' ? 'text-brand' : 'text-gray-400'}>📍 {lang === 'zh' ? '线下' : 'Offline'}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {format === 'offline' && (
                        <div>
                            <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '地点' : 'LOCATION'} *</label>
                            <input 
                                className="w-full bg-black/50 border border-brand/20 p-4 text-ink focus:border-brand focus:outline-none placeholder-gray-600"
                                placeholder={lang === 'zh' ? "详细地址" : "Address"}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Details & Schedule */}
            {currentStep === 2 && (
                <div className="space-y-8">
                    {/* Section 1: Organizer & Schedule */}
                    <div>
                        <h3 className="text-brand font-mono text-lg mb-4 border-b border-brand/20 pb-2">// ORGANIZATION & SCHEDULE</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '主办方' : 'ORGANIZER'} *</label>
                                <input 
                                    className="w-full bg-black/50 border border-brand/20 p-3 text-ink focus:border-brand focus:outline-none"
                                    value={organizerName}
                                    onChange={(e) => setOrganizerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '联系方式' : 'CONTACT INFO'}</label>
                                <div className="space-y-2">
                                    <input 
                                        className="w-full bg-black/50 border border-brand/20 p-3 text-ink focus:border-brand focus:outline-none placeholder-gray-600"
                                        placeholder={lang === 'zh' ? "微信号/邮箱/电话" : "WeChat/Email"}
                                        value={contactInfo.text}
                                        onChange={(e) => setContactInfo({...contactInfo, text: e.target.value})}
                                    />
                                    <div className="flex items-center gap-4">
                                        <div className="relative border border-dashed border-brand/30 w-full h-24 bg-black/30 flex items-center justify-center hover:border-brand/60 transition-colors">
                                            {contactInfo.image ? (
                                                <div className="relative w-full h-full group">
                                                    <img src={contactInfo.image} alt="Contact QR" className="w-full h-full object-contain" />
                                                    <button 
                                                        onClick={() => setContactInfo(prev => ({...prev, image: ''}))}
                                                        className="absolute top-1 right-1 bg-black/80 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <span className="text-brand/50 text-2xl">+</span>
                                                    <div className="text-[10px] text-gray-500 uppercase">{lang === 'zh' ? '上传二维码/名片' : 'UPLOAD QR/CARD'}</div>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleContactImageUpload}
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/5 p-4 border border-brand/10">
                            <div>
                                <label className="block text-brand text-[10px] font-bold mb-1 uppercase tracking-widest">{lang === 'zh' ? '报名时间' : 'REGISTRATION'} *</label>
                                <div className="space-y-2">
                                    <input type="date" className="w-full bg-black/50 border border-brand/20 p-2 text-xs text-ink" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)} />
                                    <input type="date" className="w-full bg-black/50 border border-brand/20 p-2 text-xs text-ink" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-brand text-[10px] font-bold mb-1 uppercase tracking-widest">{lang === 'zh' ? '作品提交' : 'SUBMISSION'} *</label>
                                <div className="space-y-2">
                                    <input type="date" className="w-full bg-black/50 border border-brand/20 p-2 text-xs text-ink" value={submissionStartDate} onChange={(e) => setSubmissionStartDate(e.target.value)} />
                                    <input type="date" className="w-full bg-black/50 border border-brand/20 p-2 text-xs text-ink" value={submissionEndDate} onChange={(e) => setSubmissionEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-brand text-[10px] font-bold mb-1 uppercase tracking-widest">{lang === 'zh' ? '评审时间' : 'JUDGING'} *</label>
                                <div className="space-y-2">
                                    <input type="date" className="w-full bg-black/50 border border-brand/20 p-2 text-xs text-ink" value={judgingStartDate} onChange={(e) => setJudgingStartDate(e.target.value)} />
                                    <input type="date" className="w-full bg-black/50 border border-brand/20 p-2 text-xs text-ink" value={judgingEndDate} onChange={(e) => setJudgingEndDate(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Details & Requirements */}
                    <div>
                        <h3 className="text-brand font-mono text-lg mb-4 border-b border-brand/20 pb-2">// DETAILS & REQUIREMENTS</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-brand text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '活动详情' : 'DESCRIPTION'} *</label>
                                <textarea 
                                    className="w-full h-32 bg-black/50 border border-brand/20 p-4 text-ink focus:border-brand focus:outline-none placeholder-gray-600 font-mono text-sm"
                                    placeholder={lang === 'zh' ? "Markdown 格式支持..." : "Description..."}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '作品要求' : 'REQUIREMENTS'}</label>
                                <textarea 
                                    className="w-full h-24 bg-black/50 border border-brand/20 p-4 text-ink focus:border-brand focus:outline-none placeholder-gray-600 font-mono text-sm"
                                    placeholder={lang === 'zh' ? "提交格式、技术栈限制等..." : "Submission requirements..."}
                                    value={requirements}
                                    onChange={(e) => setRequirements(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '资源与支持' : 'RESOURCES & SUPPORT'}</label>
                                <textarea 
                                    className="w-full h-24 bg-black/50 border border-brand/20 p-4 text-ink focus:border-brand focus:outline-none placeholder-gray-600 font-mono text-sm"
                                    placeholder={lang === 'zh' ? "提供的开发资源、API、导师支持等..." : "Resources provided..."}
                                    value={resourceDetail}
                                    onChange={(e) => setResourceDetail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Awards & Judging */}
                    <div>
                        <h3 className="text-brand font-mono text-lg mb-4 border-b border-brand/20 pb-2">// AWARDS & CRITERIA</h3>
                        
                        {/* Awards List */}
                        <div className="mb-6">
                            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '奖项设置' : 'AWARDS'}</label>
                            <div className="space-y-2 mb-3">
                                {awards.map((award, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 border border-brand/10">
                                        <span className="text-brand font-mono">#{idx+1}</span>
                                        <div className="flex-1 text-sm">
                                            <span className="font-bold text-ink">{award.name}</span>
                                            <span className="mx-2 text-gray-500">|</span>
                                            <span className="text-gray-400">{award.type === 'cash' ? `¥${award.amount}` : (award.type === 'other' ? award.prize : `¥${award.amount} + ${award.prize}`)}</span>
                                            <span className="mx-2 text-gray-500">|</span>
                                            <span className="text-gray-400">x{award.count}</span>
                                        </div>
                                        <button onClick={() => removeAward(idx)} className="text-red-500 hover:text-red-400 px-2">✕</button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-12 gap-2">
                                <select 
                                    className="col-span-2 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                    value={newAward.type}
                                    onChange={(e) => setNewAward({...newAward, type: e.target.value as any})}
                                >
                                    <option value="cash">现金</option>
                                    <option value="other">其他</option>
                                    <option value="mixed">混合</option>
                                </select>
                                <input 
                                    className="col-span-3 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                    placeholder="奖项名称"
                                    value={newAward.name}
                                    onChange={(e) => setNewAward({...newAward, name: e.target.value})}
                                />
                                <input 
                                    type="number"
                                    className="col-span-2 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                    placeholder="数量"
                                    value={newAward.count}
                                    onChange={(e) => setNewAward({...newAward, count: parseInt(e.target.value) || 0})}
                                />
                                {(newAward.type === 'cash' || newAward.type === 'mixed') && (
                                    <input 
                                        type="number"
                                        className="col-span-2 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                        placeholder="金额"
                                        value={newAward.amount}
                                        onChange={(e) => setNewAward({...newAward, amount: parseInt(e.target.value) || 0})}
                                    />
                                )}
                                {(newAward.type === 'other' || newAward.type === 'mixed') && (
                                    <input 
                                        className="col-span-2 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                        placeholder="奖品描述"
                                        value={newAward.prize}
                                        onChange={(e) => setNewAward({...newAward, prize: e.target.value})}
                                    />
                                )}
                                <button onClick={addAward} className="col-span-1 bg-brand text-black font-bold hover:bg-white">+</button>
                            </div>
                        </div>

                        {/* Review Dimensions */}
                        <div>
                            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase tracking-widest">{lang === 'zh' ? '评审标准' : 'JUDGING CRITERIA'}</label>
                            <div className="space-y-2 mb-3">
                                {scoringDimensions.map((dim, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 border border-brand/10">
                                        <span className="text-brand font-mono">{dim.weight}%</span>
                                        <div className="flex-1 text-sm">
                                            <span className="font-bold text-ink">{dim.name}</span>
                                            <span className="mx-2 text-gray-500">-</span>
                                            <span className="text-gray-400">{dim.description}</span>
                                        </div>
                                        <button onClick={() => removeDimension(idx)} className="text-red-500 hover:text-red-400 px-2">✕</button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-12 gap-2">
                                <input 
                                    className="col-span-3 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                    placeholder="维度名称"
                                    value={newDimension.name}
                                    onChange={(e) => setNewDimension({...newDimension, name: e.target.value})}
                                />
                                <input 
                                    type="number"
                                    className="col-span-2 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                    placeholder="权重%"
                                    value={newDimension.weight}
                                    onChange={(e) => setNewDimension({...newDimension, weight: parseInt(e.target.value) || 0})}
                                />
                                <input 
                                    className="col-span-6 bg-black/50 border border-brand/20 text-xs p-2 text-ink"
                                    placeholder="详细说明"
                                    value={newDimension.description}
                                    onChange={(e) => setNewDimension({...newDimension, description: e.target.value})}
                                />
                                <button onClick={addDimension} className="col-span-1 bg-brand text-black font-bold hover:bg-white">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-brand/20 bg-surface/80 backdrop-blur-md flex justify-between items-center">
            <div className="text-red-500 text-sm font-bold font-mono">{error}</div>
            <div className="flex gap-4">
                {currentStep === 2 && (
                    <button 
                        onClick={handleBack}
                        className="px-6 py-2 border border-brand/30 text-gray-400 hover:text-brand hover:border-brand font-mono text-sm transition-colors"
                    >
                        {lang === 'zh' ? '上一步' : 'BACK'}
                    </button>
                )}
                
                {currentStep === 1 ? (
                    <button 
                        onClick={handleNext}
                        className="px-8 py-3 bg-brand text-black font-black uppercase hover:bg-white hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                    >
                        {lang === 'zh' ? '下一步' : 'NEXT STEP'}
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={() => handleSubmit('draft')}
                            disabled={loading}
                            className="px-6 py-3 border border-brand text-brand font-bold uppercase hover:bg-brand/10 transition-colors disabled:opacity-50"
                        >
                            {lang === 'zh' ? '保存草稿' : 'SAVE DRAFT'}
                        </button>
                        <button 
                            onClick={() => handleSubmit('published')}
                            disabled={loading}
                            className="px-8 py-3 bg-brand text-black font-black uppercase hover:bg-white hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] disabled:opacity-50"
                        >
                            {loading ? 'PROCESSING...' : (lang === 'zh' ? '发布活动' : 'PUBLISH')}
                        </button>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

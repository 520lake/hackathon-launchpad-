import { useState, useEffect } from "react";
import axios from "axios";

interface JudgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: number;
  hackathonTitle: string;
  isOrganizer?: boolean;
}

interface Project {
  id: number;
  title: string;
  description: string;
  repo_url?: string;
  demo_url?: string;
  video_url?: string;
}

interface ScoringDimension {
  id: number;
  name: string;
  description: string;
  weight: number;
}

interface JudgeUser {
  id: number;
  username: string;
  email: string;
}

export default function JudgingModal({
  isOpen,
  onClose,
  hackathonId,
  hackathonTitle,
  isOrganizer = false,
}: JudgingModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Scoring state
  const [dimensions, setDimensions] = useState<ScoringDimension[]>([]);
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Progress tracking
  const [scoredIds, setScoredIds] = useState<Set<number>>(new Set());
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  // Judge management (organizer only)
  const [activePanel, setActivePanel] = useState<"scoring" | "judges">(
    "scoring",
  );
  const [judges, setJudges] = useState<JudgeUser[]>([]);
  const [newJudgeEmail, setNewJudgeEmail] = useState("");
  const [judgeLoading, setJudgeLoading] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (isOpen && hackathonId) {
      fetchData();
      fetchProgress();
      if (isOrganizer) fetchJudges();
    }
  }, [isOpen, hackathonId]);

  // Pre-populate scores when selecting a project
  useEffect(() => {
    if (selectedProject) {
      fetchMyScores(selectedProject.id);
    }
  }, [selectedProject?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch hackathon details -- judging criteria now live inside sections
      const hackathonRes = await axios.get(
        `/api/v1/hackathons/${hackathonId}`,
        authHeaders,
      );
      const sections = hackathonRes.data.sections || [];
      const criteriaSections = sections.filter(
        (s: any) => s.section_type === "judging_criteria",
      );
      const allCriteria = criteriaSections.flatMap((s: any) =>
        (s.judging_criteria || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          weight: c.weight_percentage,
        })),
      );
      setDimensions(allCriteria);

      // Fetch projects
      const projectsRes = await axios.get(
        `/api/v1/submissions/?hackathon_id=${hackathonId}`,
        authHeaders,
      );
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await axios.get(
        `/api/v1/hackathons/${hackathonId}/judges/me/progress`,
        authHeaders,
      );
      setScoredIds(new Set(res.data.scored_submission_ids));
      setTotalSubmissions(res.data.total_submissions);
    } catch {
      // Not a judge — no progress to show
    }
  };

  const fetchMyScores = async (submissionId: number) => {
    try {
      const res = await axios.get(
        `/api/v1/submissions/${submissionId}/scores/me`,
        authHeaders,
      );
      if (res.data.length > 0) {
        const existingScores: { [key: number]: number } = {};
        let existingComment = "";
        for (const s of res.data) {
          existingScores[s.criteria_id] = s.score_value;
          if (s.comment) existingComment = s.comment;
        }
        setScores(existingScores);
        setComment(existingComment);
      } else {
        setScores({});
        setComment("");
      }
    } catch {
      setScores({});
      setComment("");
    }
  };

  const fetchJudges = async () => {
    try {
      const res = await axios.get(
        `/api/v1/hackathons/${hackathonId}/judges`,
        authHeaders,
      );
      setJudges(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScoreChange = (dimId: number, value: number) => {
    setScores((prev) => ({
      ...prev,
      [dimId]: value,
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    dimensions.forEach((dim) => {
      const score = scores[dim.id] || 0;
      total += score * (dim.weight / 100);
    });
    return total.toFixed(2);
  };

  const submitScore = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      await axios.post(
        `/api/v1/submissions/${selectedProject.id}/score`,
        {
          scores: dimensions.map((dim) => ({
            criteria_id: dim.id,
            score_value: scores[dim.id] || 0,
            comment: comment,
          })),
        },
        authHeaders,
      );

      // Update progress
      setScoredIds((prev) => new Set([...prev, selectedProject.id]));
      alert("评分提交成功");
    } catch (err) {
      console.error(err);
      alert("评分提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIReview = async () => {
    if (!selectedProject) return;
    setLoading(true);
    setTimeout(() => {
      const mockScores = dimensions.reduce(
        (acc, dim) => {
          acc[dim.id] = Math.floor(Math.random() * (95 - 75) + 75);
          return acc;
        },
        {} as { [key: number]: number },
      );

      setScores(mockScores);
      setComment(
        "【AI 分析报告】\n该项目展现了极高的完整度。技术架构清晰，UI设计符合现代审美（Brutalist风格）。\n\n优点：\n1. 创新性：将AI与传统工作流结合得很好。\n2. 完成度：核心功能均已实现，Demo运行流畅。\n\n建议：\n可以增加更多的用户引导流程。",
      );
      setLoading(false);
    }, 1500);
  };

  const addJudge = async () => {
    if (!newJudgeEmail.trim()) return;
    setJudgeLoading(true);
    try {
      await axios.post(
        `/api/v1/hackathons/${hackathonId}/judges?user_email=${encodeURIComponent(newJudgeEmail.trim())}`,
        {},
        authHeaders,
      );
      setNewJudgeEmail("");
      fetchJudges();
    } catch (err: any) {
      alert(err.response?.data?.detail || "添加评委失败");
    } finally {
      setJudgeLoading(false);
    }
  };

  const removeJudge = async (userId: number) => {
    if (!confirm("确定移除此评委？")) return;
    try {
      await axios.delete(
        `/api/v1/hackathons/${hackathonId}/judges/${userId}`,
        authHeaders,
      );
      fetchJudges();
    } catch (err: any) {
      alert(err.response?.data?.detail || "移除评委失败");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-6xl h-[90vh] flex flex-col border-2 border-brand shadow-[8px_8px_0px_0px_#000]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-brand bg-black">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              评审终端: <span className="text-brand">{hackathonTitle}</span>
            </h2>
            {scoredIds.size > 0 && (
              <span className="text-xs font-mono text-brand/80 border border-brand/30 px-2 py-1">
                {scoredIds.size} / {totalSubmissions} 已评
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isOrganizer && (
              <div className="flex font-mono text-xs">
                <button
                  onClick={() => setActivePanel("scoring")}
                  className={`px-3 py-1 border border-brand/50 ${activePanel === "scoring" ? "bg-brand text-black" : "text-brand hover:bg-brand/10"}`}
                >
                  评分
                </button>
                <button
                  onClick={() => setActivePanel("judges")}
                  className={`px-3 py-1 border border-brand/50 border-l-0 ${activePanel === "judges" ? "bg-brand text-black" : "text-brand hover:bg-brand/10"}`}
                >
                  评委管理
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-brand hover:text-white font-mono font-bold text-xl"
            >
              [X]
            </button>
          </div>
        </div>

        {activePanel === "judges" && isOrganizer ? (
          /* Judge Management Panel */
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-8">
              <div>
                <h3 className="font-mono font-bold text-brand uppercase tracking-widest text-lg mb-6">
                  评委列表
                </h3>
                <div className="flex gap-3 mb-6">
                  <input
                    type="email"
                    value={newJudgeEmail}
                    onChange={(e) => setNewJudgeEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addJudge()}
                    placeholder="输入用户邮箱添加评委..."
                    className="flex-1 bg-black/50 border border-brand/30 text-white px-4 py-2 focus:border-brand focus:outline-none font-mono placeholder-gray-700"
                  />
                  <button
                    onClick={addJudge}
                    disabled={judgeLoading}
                    className="px-6 py-2 bg-brand text-black font-bold font-mono uppercase hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {judgeLoading ? "..." : "添加"}
                  </button>
                </div>
                <div className="space-y-2">
                  {judges.length === 0 ? (
                    <div className="text-gray-500 font-mono text-sm border border-dashed border-gray-700 p-6 text-center">
                      暂无评委
                    </div>
                  ) : (
                    judges.map((j) => (
                      <div
                        key={j.id}
                        className="flex items-center justify-between p-4 bg-black/30 border border-gray-800 hover:border-brand/50 transition-colors"
                      >
                        <div className="font-mono">
                          <span className="text-white font-bold">
                            {j.username}
                          </span>
                          <span className="text-gray-500 ml-3 text-sm">
                            {j.email}
                          </span>
                        </div>
                        <button
                          onClick={() => removeJudge(j.id)}
                          className="text-red-500/70 hover:text-red-400 font-mono text-xs border border-red-500/30 px-3 py-1 hover:bg-red-500/10 transition-colors"
                        >
                          移除
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Scoring Panel */
          <div className="flex flex-1 overflow-hidden">
            {/* Project List */}
            <div className="w-1/3 border-r-2 border-brand overflow-y-auto p-4 bg-black/20 custom-scrollbar">
              <h3 className="font-mono font-bold text-brand mb-4 uppercase tracking-widest border-b border-brand/20 pb-2">
                待评审项目
              </h3>
              {loading ? (
                <div className="font-mono text-gray-500 animate-pulse">
                  加载数据中...
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className={`p-4 border-2 transition-all cursor-pointer font-mono relative ${
                        selectedProject?.id === p.id
                          ? "bg-brand text-black border-brand shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
                          : "bg-black/40 text-gray-400 border-gray-700 hover:border-brand hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {scoredIds.has(p.id) && (
                          <span
                            className={`text-xs ${selectedProject?.id === p.id ? "text-black/70" : "text-green-500"}`}
                          >
                            ✓
                          </span>
                        )}
                        <div className="font-bold uppercase truncate">
                          {p.title}
                        </div>
                      </div>
                      <div className="text-xs opacity-70 mt-2 truncate">
                        {p.description}
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-gray-500 font-mono text-sm border border-dashed border-gray-700 p-4 text-center">
                      暂无项目提交
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scoring Area */}
            <div className="w-2/3 overflow-y-auto p-8 bg-surface custom-scrollbar relative">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 pointer-events-none"></div>

              {selectedProject ? (
                <div className="space-y-8 relative z-10">
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase mb-4 tracking-tight">
                      {selectedProject.title}
                    </h3>
                    <div className="p-4 bg-black/30 border border-brand/20 text-gray-300 font-mono text-sm leading-relaxed mb-6">
                      {selectedProject.description}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-mono">
                      {selectedProject.repo_url && (
                        <a
                          href={selectedProject.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-brand hover:text-white border border-brand px-3 py-1 hover:bg-brand/10 transition-colors"
                        >
                          [CODE REPO] ↗
                        </a>
                      )}
                      {selectedProject.demo_url && (
                        <a
                          href={selectedProject.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-brand hover:text-white border border-brand px-3 py-1 hover:bg-brand/10 transition-colors"
                        >
                          [LIVE DEMO] ↗
                        </a>
                      )}
                      {selectedProject.video_url && (
                        <a
                          href={selectedProject.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-brand hover:text-white border border-brand px-3 py-1 hover:bg-brand/10 transition-colors"
                        >
                          [VIDEO] ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="border-t-2 border-brand/20 pt-8">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-mono font-bold text-brand uppercase tracking-widest text-lg">
                        评分系统
                      </h4>
                      <button
                        onClick={handleAIReview}
                        disabled={loading}
                        className="bg-brand/10 hover:bg-brand/20 text-brand border border-brand px-4 py-2 text-sm font-mono uppercase transition-colors flex items-center gap-2"
                      >
                        {loading ? (
                          <span className="animate-pulse">Analyzing...</span>
                        ) : (
                          <>
                            <span>⚡</span>
                            AI 辅助评审
                          </>
                        )}
                      </button>
                    </div>

                    {dimensions.length > 0 ? (
                      <div className="space-y-6">
                        {dimensions.map((dim, idx) => (
                          <div
                            key={idx}
                            className="bg-black/20 border border-gray-800 p-6 hover:border-brand/50 transition-colors"
                          >
                            <div className="flex justify-between items-end mb-4">
                              <div>
                                <span className="font-bold text-white uppercase tracking-wider block mb-1">
                                  {dim.name}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                  {dim.description}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-3xl font-black text-brand">
                                  {scores[dim.id] || 0}
                                </span>
                                <span className="text-xs text-gray-500 font-mono ml-2">
                                  / 100 (Weight: {dim.weight}%)
                                </span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={scores[dim.id] || 0}
                              onChange={(e) =>
                                handleScoreChange(
                                  dim.id,
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full h-2 bg-gray-800 rounded-none appearance-none cursor-pointer accent-brand"
                            />
                          </div>
                        ))}

                        <div className="flex justify-between items-center p-6 bg-brand/10 border border-brand/30 mt-8">
                          <span className="font-mono font-bold text-brand uppercase text-xl">
                            总分 (加权)
                          </span>
                          <span className="text-4xl font-black text-white">
                            {calculateTotal()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 font-mono">
                        WARNING: 未配置评分维度，请直接打分 (0-100)
                      </div>
                    )}

                    <div className="mt-8">
                      <label className="block text-sm font-bold text-brand font-mono mb-2 uppercase tracking-widest">
                        评委意见
                      </label>
                      <textarea
                        className="w-full bg-black/50 border border-brand/30 text-white px-4 py-3 focus:border-brand focus:outline-none font-mono placeholder-gray-700 h-32"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={"写下你的评价..."}
                      />
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={submitScore}
                        disabled={submitting}
                        className="px-10 py-4 bg-brand text-black font-black uppercase tracking-wider hover:bg-white border-2 border-brand shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50"
                      >
                        {submitting
                          ? "提交中..."
                          : scoredIds.has(selectedProject.id)
                            ? "更新评分"
                            : "提交评分"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 font-mono">
                  <div className="text-6xl mb-4 opacity-20">←</div>
                  <p className="uppercase tracking-widest">
                    请选择一个项目开始评审
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";

interface JudgingPanelProps {
  hackathonId: number;
  hackathonTitle: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  repository_url?: string;
  demo_url?: string;
  video_url?: string;
}

interface ScoringDimension {
  name: string;
  description: string;
  weight: number;
}

export default function JudgingPanel({
  hackathonId,
  hackathonTitle,
}: JudgingPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Scoring state
  const [dimensions, setDimensions] = useState<ScoringDimension[]>([]);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hackathonId) {
      fetchData();
    }
  }, [hackathonId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch hackathon details -- judging criteria now live inside sections
      const hackathonRes = await axios.get(
        `/api/v1/hackathons/${hackathonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const sections = hackathonRes.data.sections || [];
      const criteriaSections = sections.filter(
        (s: any) => s.section_type === "judging_criteria",
      );
      const allCriteria = criteriaSections.flatMap((s: any) =>
        (s.judging_criteria || []).map((c: any) => ({
          name: c.name,
          description: c.description || "",
          weight: c.weight_percentage,
        })),
      );
      setDimensions(allCriteria);

      // Fetch projects
      const projectsRes = await axios.get(
        `/api/v1/submissions/?hackathon_id=${hackathonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (dimName: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [dimName]: value,
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    dimensions.forEach((dim) => {
      const score = scores[dim.name] || 0;
      total += score * (dim.weight / 100);
    });
    return total.toFixed(2);
  };

  const submitScore = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const totalScore = parseFloat(calculateTotal());

      await axios.post(
        `/api/v1/submissions/${selectedProject.id}/score`,
        {
          score_value: Math.round(totalScore),
          comment: comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("评分提交成功");
      setSelectedProject(null);
      setScores({});
      setComment("");
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
          acc[dim.name] = Math.floor(Math.random() * (95 - 75) + 75);
          return acc;
        },
        {} as { [key: string]: number },
      );

      setScores(mockScores);
      setComment(
        "【AI 分析报告】\n该项目展现了极高的完整度。技术架构清晰，UI设计符合现代审美（Brutalist风格）。\n\n优点：\n1. 创新性：将AI与传统工作流结合得很好。\n2. 完成度：核心功能均已实现，Demo运行流畅。\n\n建议：\n可以增加更多的用户引导流程。",
      );
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="text-[#FBBF24] font-mono">//</span>
          评审终端: <span className="text-[#FBBF24]">{hackathonTitle}</span>
        </h3>
      </div>

      <div className="flex gap-6 min-h-[600px]">
        {/* Project List — left 1/3 */}
        <div className="w-1/3 bg-[#0A0A0A] border border-[#222222] rounded-[16px] overflow-y-auto p-5">
          <h4 className="text-[11px] text-gray-500 uppercase tracking-wider mb-4">
            待评审项目
          </h4>
          {loading ? (
            <div className="text-sm text-gray-500 animate-pulse">
              加载数据中...
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`p-4 rounded-[12px] border transition-all cursor-pointer ${
                    selectedProject?.id === p.id
                      ? "bg-[#FBBF24]/10 border-[#FBBF24]/40 text-white"
                      : "bg-transparent border-[#222222] text-gray-400 hover:border-[#333] hover:text-white"
                  }`}
                >
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs opacity-60 mt-1 truncate">
                    {p.description}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">
                  暂无项目提交
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scoring Area — right 2/3 */}
        <div className="w-2/3 bg-[#0A0A0A] border border-[#222222] rounded-[16px] overflow-y-auto p-6">
          {selectedProject ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {selectedProject.name}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {selectedProject.description}
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {selectedProject.repository_url && (
                    <a
                      href={selectedProject.repository_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#FBBF24] hover:text-white border border-[#FBBF24]/30 px-3 py-1.5 rounded-[8px] hover:bg-[#FBBF24]/10 transition-colors"
                    >
                      Code Repo ↗
                    </a>
                  )}
                  {selectedProject.demo_url && (
                    <a
                      href={selectedProject.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#FBBF24] hover:text-white border border-[#FBBF24]/30 px-3 py-1.5 rounded-[8px] hover:bg-[#FBBF24]/10 transition-colors"
                    >
                      Live Demo ↗
                    </a>
                  )}
                  {selectedProject.video_url && (
                    <a
                      href={selectedProject.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#FBBF24] hover:text-white border border-[#FBBF24]/30 px-3 py-1.5 rounded-[8px] hover:bg-[#FBBF24]/10 transition-colors"
                    >
                      Video ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="border-t border-[#222222] pt-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[11px] text-gray-500 uppercase tracking-wider">
                    评分系统
                  </h4>
                  <button
                    onClick={handleAIReview}
                    disabled={loading}
                    className="text-xs text-[#FBBF24] border border-[#FBBF24]/30 px-3 py-1.5 rounded-[8px] hover:bg-[#FBBF24]/10 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Analyzing..." : "⚡ AI 辅助评审"}
                  </button>
                </div>

                {dimensions.length > 0 ? (
                  <div className="space-y-5">
                    {dimensions.map((dim, idx) => (
                      <div
                        key={idx}
                        className="bg-[#111] border border-[#222222] rounded-[12px] p-5"
                      >
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <span className="font-medium text-white text-sm block mb-0.5">
                              {dim.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {dim.description}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-[#FBBF24]">
                              {scores[dim.name] || 0}
                            </span>
                            <span className="text-xs text-gray-500 ml-1.5">
                              / 100 ({dim.weight}%)
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scores[dim.name] || 0}
                          onChange={(e) =>
                            handleScoreChange(
                              dim.name,
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full h-1.5 bg-[#222] rounded-full appearance-none cursor-pointer accent-[#FBBF24]"
                        />
                      </div>
                    ))}

                    <div className="flex justify-between items-center p-5 bg-[#FBBF24]/5 border border-[#FBBF24]/20 rounded-[12px] mt-6">
                      <span className="text-sm font-medium text-[#FBBF24]">
                        总分 (加权)
                      </span>
                      <span className="text-3xl font-bold text-white">
                        {calculateTotal()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-[12px] text-yellow-500 text-sm">
                    未配置评分维度，请在活动设置中添加评审标准
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-[11px] text-gray-500 uppercase tracking-wider mb-2">
                    评委意见
                  </label>
                  <textarea
                    className="w-full bg-[#111] border border-[#222222] rounded-[12px] text-white px-4 py-3 focus:border-[#FBBF24]/50 focus:outline-none text-sm placeholder-gray-600 h-28 resize-none"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="写下你的评价..."
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={submitScore}
                    disabled={submitting}
                    className="px-8 py-3 bg-[#FBBF24] text-black font-bold text-sm rounded-[12px] hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {submitting ? "提交中..." : "提交评分"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 min-h-[400px]">
              <div className="text-4xl mb-3 opacity-20">←</div>
              <p className="text-sm text-gray-500">请选择一个项目开始评审</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

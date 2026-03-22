import { useState, useEffect } from "react";
import axios from "axios";

interface ResultPublishPanelProps {
  hackathonId: number;
  onPublished?: () => void;
}

interface Project {
  id: number;
  name: string;
  description: string;
  total_score?: number;
}

interface Winner {
  project_id: number;
  project_name: string;
  award_name: string;
  comment?: string;
}

export default function ResultPublishPanel({
  hackathonId,
  onPublished,
}: ResultPublishPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Selection state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [awardName, setAwardName] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (hackathonId) {
      fetchData();
    }
  }, [hackathonId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const resProjects = await axios.get(
        `/api/v1/submissions?hackathon_id=${hackathonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const resHackathon = await axios.get(
        `/api/v1/hackathons/${hackathonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (resHackathon.data.results_detail) {
        try {
          setWinners(JSON.parse(resHackathon.data.results_detail));
        } catch (e) {
          console.error("Failed to parse results", e);
        }
      }

      setProjects(resProjects.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addWinner = () => {
    if (!selectedProjectId || !awardName) return;

    const project = projects.find((p) => p.id === Number(selectedProjectId));
    if (!project) return;

    const newWinner: Winner = {
      project_id: project.id,
      project_name: project.name,
      award_name: awardName,
      comment: comment,
    };

    setWinners([...winners, newWinner]);
    setSelectedProjectId(null);
    setAwardName("");
    setComment("");
  };

  const removeWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (
      winners.length === 0 &&
      !window.confirm("确定不设置任何奖项直接发布结果吗？")
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/v1/hackathons/${hackathonId}`,
        {
          results_detail: JSON.stringify(winners),
          status: "ended",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      alert("结果发布成功！活动已结束。");
      onPublished?.();
    } catch (err) {
      console.error(err);
      alert("发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <span className="text-[#FBBF24] font-mono">//</span>
          发布活动结果
        </h3>
        <button
          onClick={handlePublish}
          disabled={submitting}
          className="px-6 py-2.5 bg-[#FBBF24] text-black font-bold text-sm rounded-[12px] hover:bg-white transition-colors disabled:opacity-50"
        >
          {submitting ? "发布中..." : "确认发布结果"}
        </button>
      </div>

      {/* Add Winner Form */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
        <h4 className="text-[11px] text-gray-500 uppercase tracking-wider mb-4">
          添加获奖名单
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              选择作品
            </label>
            <select
              className="w-full bg-[#111] border border-[#222222] rounded-[12px] text-white px-4 py-2.5 focus:border-[#FBBF24]/50 focus:outline-none text-sm"
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              <option value="">请选择...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              奖项名称
            </label>
            <input
              type="text"
              className="w-full bg-[#111] border border-[#222222] rounded-[12px] text-white px-4 py-2.5 focus:border-[#FBBF24]/50 focus:outline-none text-sm"
              placeholder="例如：一等奖"
              value={awardName}
              onChange={(e) => setAwardName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              评语 (可选)
            </label>
            <textarea
              className="w-full bg-[#111] border border-[#222222] rounded-[12px] text-white px-4 py-2.5 focus:border-[#FBBF24]/50 focus:outline-none text-sm h-20 resize-none"
              placeholder="获奖理由..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <button
            onClick={addWinner}
            disabled={!selectedProjectId || !awardName}
            className="w-full py-2.5 bg-white/5 border border-white/10 text-white text-sm rounded-[12px] hover:bg-[#FBBF24] hover:text-black hover:border-[#FBBF24] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            添加至名单
          </button>
        </div>
      </div>

      {/* Winners List */}
      {winners.length > 0 && (
        <div className="bg-[#0A0A0A] border border-[#222222] rounded-[16px] p-6">
          <h4 className="text-[11px] text-gray-500 uppercase tracking-wider mb-4">
            已添加名单 ({winners.length})
          </h4>
          <div className="space-y-2">
            {winners.map((w, idx) => (
              <div
                key={idx}
                className="bg-[#FBBF24]/5 border border-[#FBBF24]/15 rounded-[12px] p-4 flex justify-between items-center group hover:bg-[#FBBF24]/10 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="bg-[#FBBF24] text-black text-xs font-bold px-2 py-0.5 rounded-[6px]">
                      {w.award_name}
                    </span>
                    <span className="font-medium text-white text-sm">
                      {w.project_name}
                    </span>
                  </div>
                  {w.comment && (
                    <p className="text-xs text-gray-500 mt-2 border-l-2 border-[#FBBF24]/20 pl-2">
                      {w.comment}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeWinner(idx)}
                  className="text-red-500/60 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

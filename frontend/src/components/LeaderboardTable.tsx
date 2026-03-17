import { useState, useEffect } from "react";
import axios from "axios";

interface CriteriaScore {
  submission_id: number;
  criteria_id: number;
  criteria_name: string;
  avg_score: number;
}

interface LeaderboardEntry {
  rank: number;
  submission_id: number;
  title: string;
  team_id: number | null;
  total_score: number;
  judge_count: number;
  criteria_scores: CriteriaScore[];
}

interface LeaderboardTableProps {
  hackathonId: number;
}

export default function LeaderboardTable({
  hackathonId,
}: LeaderboardTableProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [hackathonId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/v1/hackathons/${hackathonId}/leaderboard`,
      );
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="font-mono text-gray-500 text-sm animate-pulse py-8 text-center">
        加载排行榜...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border border-white/[0.05]">
        <div className="text-[11px] tracking-[0.2em] text-gray-600 uppercase mb-4">
          暂无评分数据
        </div>
        <p className="text-sm text-gray-500">等待评审完成后查看排行榜</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[60px_1fr_100px_80px] gap-4 px-4 py-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest border-b border-white/[0.05]">
        <div>排名</div>
        <div>项目</div>
        <div className="text-right">总分</div>
        <div className="text-right">评委数</div>
      </div>

      {/* Rows */}
      {entries.map((entry) => (
        <div key={entry.submission_id}>
          <div
            onClick={() =>
              setExpandedId(
                expandedId === entry.submission_id
                  ? null
                  : entry.submission_id,
              )
            }
            className={`grid grid-cols-[60px_1fr_100px_80px] gap-4 px-4 py-4 cursor-pointer transition-colors border border-transparent hover:border-white/[0.05] ${
              entry.rank <= 3 ? "bg-brand/[0.03]" : ""
            }`}
          >
            <div className="font-mono font-bold text-lg">
              {getMedalIcon(entry.rank)}
            </div>
            <div>
              <div className="font-medium text-white text-sm">
                {entry.title}
              </div>
            </div>
            <div className="text-right font-mono font-bold text-brand text-lg">
              {entry.total_score.toFixed(1)}
            </div>
            <div className="text-right font-mono text-gray-500 text-sm">
              {entry.judge_count}
            </div>
          </div>

          {/* Expanded criteria breakdown */}
          {expandedId === entry.submission_id &&
            entry.criteria_scores.length > 0 && (
              <div className="px-4 pb-4 ml-[60px]">
                <div className="bg-black/20 border border-white/[0.05] p-4 space-y-3">
                  <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">
                    各维度得分
                  </div>
                  {entry.criteria_scores.map((cs) => (
                    <div
                      key={cs.criteria_id}
                      className="flex items-center gap-4"
                    >
                      <span className="text-xs text-gray-400 font-mono w-32 truncate">
                        {cs.criteria_name}
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-brand/60 transition-all"
                          style={{ width: `${cs.avg_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-brand w-12 text-right">
                        {cs.avg_score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

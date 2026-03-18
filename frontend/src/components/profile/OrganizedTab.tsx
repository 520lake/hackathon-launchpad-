import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { HackathonListItem } from "@/types/hackathon";
import { toHackathonCardData } from "@/utils/hackathon";
import HackathonCard from "@/components/HackathonCard";

interface OrganizedTabProps {
  organizedHackathons: HackathonListItem[];
  currentUserId?: number;
  loading: boolean;
}

export default function OrganizedTab({
  organizedHackathons,
  currentUserId,
  loading,
}: OrganizedTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-semibold text-lg">我发起的活动</h3>
            <span className="px-3 py-1.5 bg-[#222] text-gray-400 text-[12px] rounded-[16px]">
              {organizedHackathons.length}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/create")}
            className="px-4 py-2 bg-brand text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors"
          >
            + 发起新活动
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : organizedHackathons.length > 0 ? (
          <div className="space-y-4">
            {organizedHackathons.map((hackathon, index) => {
              const cardData = toHackathonCardData(hackathon, currentUserId);
              return (
                <HackathonCard
                  key={hackathon.id}
                  data={cardData}
                  index={index}
                  onClick={() =>
                    navigate(`/events/${hackathon.id}?tab=manage`)
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🎉</div>
            <p>还没有发起任何活动</p>
            <Button
              variant="outline"
              onClick={() => navigate("/create")}
              className="mt-4 px-6 py-3 bg-brand text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors"
            >
              发起第一个活动
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

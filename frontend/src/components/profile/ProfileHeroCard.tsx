import { Button } from "@/components/ui/button";
import {
  UserIcon,
  LocationIcon,
  WorkIcon,
  EditIcon,
} from "./ProfileIcons";

interface ProfileHeroCardProps {
  currentUser: any;
  onEdit: () => void;
}

export default function ProfileHeroCard({
  currentUser,
  onEdit,
}: ProfileHeroCardProps) {
  return (
    <div className="flex items-start gap-6">
      {/* Avatar */}
      <div className="w-24 h-24 rounded-[24px] bg-[#1A1A1A] border-2 border-[#333] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {currentUser?.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-2xl font-bold text-white">
            {currentUser?.full_name ||
              currentUser?.nickname ||
              "未设置姓名"}
          </h2>
          {currentUser?.can_create_hackathon && (
            <span className="px-3 py-1.5 bg-brand text-black text-[11px] font-medium rounded-[16px]">
              组织者
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 text-gray-400 text-sm mb-4">
          <span className="flex items-center gap-2">
            <LocationIcon />
            {currentUser?.city || "未设置城市"}
          </span>
          <span className="flex items-center gap-2">
            <WorkIcon />
            {currentUser?.skills
              ? currentUser.skills.split(",")[0]
              : "未设置技能"}
          </span>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">
          {currentUser?.bio || "暂无个人简介"}
        </p>

        {currentUser?.interests && (
          <div className="flex flex-wrap gap-2 mt-4">
            {currentUser.interests
              .split(",")
              .map((interest: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-[#222] text-gray-400 text-xs rounded-[16px]"
                >
                  {interest.trim()}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Edit Button */}
      <Button
        variant="outline"
        onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-gray-300 text-sm rounded-[16px] hover:bg-white/[0.05] transition-colors"
      >
        <EditIcon />
        编辑资料
      </Button>
    </div>
  );
}

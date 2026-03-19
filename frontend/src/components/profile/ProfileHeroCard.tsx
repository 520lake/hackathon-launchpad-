import { Button } from "@/components/ui/button";
import {
  UserIcon,
  LocationIcon,
  WorkIcon,
  EditIcon,
  QuoteIcon,
} from "./ProfileIcons";
import type { ProfileUser } from "@/types/profile";

interface ProfileHeroCardProps {
  currentUser: ProfileUser | null;
  onEdit: () => void;
}

export default function ProfileHeroCard({
  currentUser,
  onEdit,
}: ProfileHeroCardProps) {
  return (
    <div className="flex items-start gap-6">
      {/* Avatar — circular 100px per Figma */}
      <div className="w-[100px] h-[100px] rounded-full bg-[#1A1A1A] border-2 border-[#333] flex items-center justify-center flex-shrink-0" style={{ overflow: "hidden", borderRadius: "50%" }}>
        {currentUser?.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            className="w-full h-full object-cover"
            style={{ borderRadius: "50%" }}
            alt="avatar"
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
        </div>

        <div className="flex items-center gap-[32px] text-gray-400 text-sm mb-4">
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

        <div className="flex items-start gap-2 text-gray-400 text-sm leading-relaxed">
          <QuoteIcon />
          <p>{currentUser?.bio || "暂无个人简介"}</p>
        </div>
      </div>

      {/* Edit Button — Figma border style */}
      <Button
        variant="outline"
        onClick={onEdit}
        className="flex items-center gap-2 px-4 py-2.5 border border-[#3f3f47] text-gray-300 text-sm rounded-[16px] hover:bg-white/[0.05] transition-colors"
      >
        <EditIcon />
        编辑资料
      </Button>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { HackathonListItem } from "@/types/hackathon";
import { toHackathonCardData } from "@/utils/hackathon";
import HackathonCard from "@/components/HackathonCard";
import ProfileHeroCard from "./ProfileHeroCard";
import ProfileEditForm from "./ProfileEditForm";
import { ArrowLeftIcon } from "./ProfileIcons";
import type { EditFormState } from "@/hooks/useProfileForm";
import type { Enrollment } from "@/hooks/useProfileData";

interface ProfileTabProps {
  currentUser: any;
  isEditing: boolean;
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  saving: boolean;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarUpload: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  enrollments: Enrollment[];
  loading: boolean;
}

export default function ProfileTab({
  currentUser,
  isEditing,
  editForm,
  setEditForm,
  saving,
  uploading,
  fileInputRef,
  onEdit,
  onSave,
  onCancel,
  onAvatarUpload,
  onDrop,
  onDragOver,
  enrollments,
  loading,
}: ProfileTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* User Hero Card */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-8">
        {isEditing ? (
          <ProfileEditForm
            editForm={editForm}
            setEditForm={setEditForm}
            saving={saving}
            uploading={uploading}
            fileInputRef={fileInputRef}
            onSave={onSave}
            onCancel={onCancel}
            onAvatarUpload={onAvatarUpload}
            onDrop={onDrop}
            onDragOver={onDragOver}
          />
        ) : (
          <ProfileHeroCard currentUser={currentUser} onEdit={onEdit} />
        )}
      </div>

      {/* My Participated Hackathons */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/events")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon />
            </Button>
            <h3 className="text-white font-semibold">我参与的黑客松</h3>
            <span className="px-3 py-1.5 bg-[#222] text-gray-400 text-[12px] rounded-[16px]">
              {enrollments.length}
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/events")}
            className="text-gray-500 text-sm hover:text-white transition-colors"
          >
            查看更多 →
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : enrollments.length > 0 ? (
          <div className="space-y-4">
            {enrollments.map((enroll, index) => {
              const listItem: HackathonListItem = {
                id: enroll.hackathon_id,
                title: enroll.hackathon?.title || `活动 #${enroll.hackathon_id}`,
                description: null,
                tags: [],
                cover_image: enroll.hackathon?.cover_image ?? null,
                registration_type: "individual",
                format: "online",
                start_date: enroll.hackathon?.start_date || "",
                end_date: enroll.hackathon?.end_date || "",
                province: enroll.hackathon?.province ?? null,
                city: enroll.hackathon?.city ?? null,
                district: enroll.hackathon?.district ?? null,
                address: null,
                is_address_hidden: false,
                status:
                  (enroll.hackathon?.status as HackathonListItem["status"]) ||
                  "published",
                created_by: enroll.hackathon?.created_by ?? 0,
                created_at: enroll.created_at,
                updated_at: enroll.created_at,
                updated_by: null,
                hosts: [],
                total_cash_prize: 0,
                has_non_cash_prizes: false,
              };

              return (
                <HackathonCard
                  key={enroll.id}
                  data={toHackathonCardData(listItem)}
                  index={index}
                  onClick={() =>
                    navigate(`/events/${enroll.hackathon_id}?tab=myproject`)
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <p>还没有参与任何黑客松</p>
            <Button
              variant="outline"
              onClick={() => navigate("/events")}
              className="mt-4 px-6 py-3 bg-brand text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors"
            >
              去探索活动
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

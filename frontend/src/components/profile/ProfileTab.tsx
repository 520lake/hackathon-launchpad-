import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { HackathonListItem } from "@/types/hackathon";
import { toHackathonCardData } from "@/utils/hackathon";
import HackathonCard from "@/components/HackathonCard";
import ProjectCard from "@/components/ProjectCard";
import ProfileHeroCard from "./ProfileHeroCard";
import ProfileEditForm from "./ProfileEditForm";
import SectionCard from "./SectionCard";
import { ArrowLeftIcon } from "./ProfileIcons";
import type { EditFormState } from "@/hooks/useProfileForm";
import type { Enrollment } from "@/hooks/useProfileData";
import type { ProfileUser } from "@/types/profile";

type ExpandedSection = "organized" | "enrolled" | null;

interface ProfileTabProps {
  currentUser: ProfileUser | null;
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
  organizedHackathons: HackathonListItem[];
  loading: boolean;
}

const MAX_PREVIEW = 3;

// Placeholder projects until /api/v1/projects/me is wired up
const placeholderProjects: {
  id: number;
  title: string;
  description: string;
  tech_stack: string;
  cover_image?: string;
}[] = [];

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
  organizedHackathons,
  loading,
}: ProfileTabProps) {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] =
    useState<ExpandedSection>(null);
  const organizedCount = organizedHackathons.length;
  const enrolledCount = enrollments.length;

  /** Convert enrollment to HackathonListItem for HackathonCard */
  const enrollmentToListItem = (enroll: Enrollment): HackathonListItem => {
    // Backend returns tags as a JSON-encoded string, e.g. '["AI","Web3"]'
    let parsedTags: string[] = [];
    if (enroll.hackathon?.tags) {
      try {
        parsedTags = JSON.parse(enroll.hackathon.tags);
      } catch {
        parsedTags = [];
      }
    }

    return {
      id: enroll.hackathon_id,
      title: enroll.hackathon?.title || `活动 #${enroll.hackathon_id}`,
      description: enroll.hackathon?.description ?? null,
      tags: parsedTags,
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
        (enroll.hackathon?.status as HackathonListItem["status"]) || "published",
      created_by: enroll.hackathon?.created_by ?? 0,
      created_at: enroll.created_at,
      updated_at: enroll.created_at,
      updated_by: null,
      hosts: (enroll.hackathon?.hosts ?? []).map((h) => ({
        id: h.id,
        name: h.name,
        logo_url: h.logo_url ?? null,
        hackathon_id: enroll.hackathon_id,
        display_order: 0,
        created_at: enroll.created_at,
        created_by: null,
        updated_at: enroll.created_at,
        updated_by: null,
      })),
      total_cash_prize: 0,
      has_non_cash_prizes: false,
    };
  };

  /** Render a list of HackathonCards from HackathonListItem[] */
  const renderHackathonCards = (
    items: HackathonListItem[],
    limit?: number,
  ) => {
    const list = limit ? items.slice(0, limit) : items;
    return (
      <div className="space-y-4">
        {list.map((h, i) => (
          <HackathonCard
            key={h.id}
            data={toHackathonCardData(h, currentUser?.id)}
            index={i}
            onClick={() => navigate(`/events/${h.id}`)}
          />
        ))}
      </div>
    );
  };

  /** Render enrollment cards */
  const renderEnrollmentCards = (limit?: number) => {
    const list = limit ? enrollments.slice(0, limit) : enrollments;
    return (
      <div className="space-y-4">
        {list.map((enroll, i) => (
          <HackathonCard
            key={enroll.id}
            data={toHackathonCardData(enrollmentToListItem(enroll))}
            index={i}
            onClick={() =>
              navigate(`/events/${enroll.hackathon_id}?tab=myproject`)
            }
          />
        ))}
      </div>
    );
  };

  // ── Expanded view ──
  if (expandedSection) {
    const isOrganized = expandedSection === "organized";
    const count = isOrganized ? organizedCount : enrolledCount;
    const title = isOrganized ? "我举办的黑客松" : "我参与的黑客松";

    return (
      <div className="space-y-6">
        {/* Hero card stays */}
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

        {/* Back + full list */}
        <div className="bg-[rgba(9,9,11,0.5)] border border-[#27272a] rounded-[14px] p-6">
          <button
            onClick={() => setExpandedSection(null)}
            className="flex items-center gap-2 text-[14px] text-[#e4e4e7] font-semibold mb-4 hover:text-white transition-colors"
          >
            <ArrowLeftIcon />
            {title} ({count})
          </button>
          <div className="h-px bg-[#333] mb-4" />
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isOrganized ? (
            renderHackathonCards(organizedHackathons)
          ) : (
            renderEnrollmentCards()
          )}
        </div>
      </div>
    );
  }

  // ── Default view ──
  return (
    <div className="space-y-6">
      {/* Hero Card */}
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

      {/* 我举办的黑客松 */}
      <SectionCard
        title="我举办的黑客松"
        count={organizedCount}
        maxPreview={MAX_PREVIEW}
        onViewMore={() => setExpandedSection("organized")}
        emptyText="期待你的第一场活动~"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          renderHackathonCards(organizedHackathons, MAX_PREVIEW)
        )}
      </SectionCard>

      {/* 我参加的黑客松 */}
      <SectionCard
        title="我参加的黑客松"
        count={enrolledCount}
        maxPreview={MAX_PREVIEW}
        onViewMore={() => setExpandedSection("enrolled")}
        emptyText="去看看最近的活动吧~"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          renderEnrollmentCards(MAX_PREVIEW)
        )}
      </SectionCard>

      {/* 作品卡片 */}
      {placeholderProjects.length > 0 && (
        <SectionCard
          title="我的作品"
          count={placeholderProjects.length}
          onViewMore={() => {}}
          emptyText="暂无作品"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {placeholderProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

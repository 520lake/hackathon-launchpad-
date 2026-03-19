import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useProfileData } from "@/hooks/useProfileData";
import { useProfileForm } from "@/hooks/useProfileForm";

import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileTab from "@/components/profile/ProfileTab";
import AccountTab from "@/components/profile/AccountTab";
import type { ProfileUser } from "@/types/profile";
import { UNSAVED_CHANGES_WARNING } from "@/hooks/useUnsavedChangesWarning";

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: ProfileUser | null;
  fetchCurrentUser: () => void;
  lang?: "zh" | "en";
}

type TabId = "profile" | "account";

export default function ProfilePage() {
  const { isLoggedIn, currentUser, fetchCurrentUser } =
    useOutletContext<OutletContextType>();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const { enrollments, organizedHackathons, loading } =
    useProfileData(isLoggedIn);

  const profileForm = useProfileForm({ currentUser, fetchCurrentUser });

  const handleTabChange = (nextTab: TabId) => {
    if (nextTab === activeTab) {
      return;
    }

    if (
      activeTab === "profile" &&
      !profileForm.confirmDiscardChanges(UNSAVED_CHANGES_WARNING)
    ) {
      return;
    }

    setActiveTab(nextTab);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">请先登录</p>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileTab
            currentUser={currentUser}
            isEditing={profileForm.isEditing}
            editForm={profileForm.editForm}
            setEditForm={profileForm.setEditForm}
            saving={profileForm.saving}
            uploading={profileForm.uploading}
            fileInputRef={profileForm.fileInputRef}
            onEdit={() => profileForm.setIsEditing(true)}
            onSave={profileForm.handleSaveProfile}
            onCancel={profileForm.handleCancelEditing}
            onAvatarUpload={profileForm.handleAvatarUpload}
            onDrop={profileForm.handleDrop}
            onDragOver={profileForm.handleDragOver}
            enrollments={enrollments}
            organizedHackathons={organizedHackathons}
            loading={loading}
          />
        );
      case "account":
        return (
          <AccountTab
            currentUser={currentUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8">
        <div className="flex gap-8">
          <ProfileSidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />

          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

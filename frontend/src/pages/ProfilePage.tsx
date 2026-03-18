import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { useProfileData } from "@/hooks/useProfileData";
import { useProfileForm } from "@/hooks/useProfileForm";

import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileTab from "@/components/profile/ProfileTab";
import OrganizedTab from "@/components/profile/OrganizedTab";
import PreferencesTab from "@/components/profile/PreferencesTab";
import AccountTab from "@/components/profile/AccountTab";

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: any;
  fetchCurrentUser: () => void;
  lang?: "zh" | "en";
}

type TabId =
  | "profile"
  | "organized"
  | "preferences"
  | "account"
  | "notifications";

export default function ProfilePage() {
  const { isLoggedIn, currentUser, fetchCurrentUser } =
    useOutletContext<OutletContextType>();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const { enrollments, organizedHackathons, loading } =
    useProfileData(isLoggedIn);

  const profileForm = useProfileForm({ currentUser, fetchCurrentUser });

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
            onCancel={() => profileForm.setIsEditing(false)}
            onAvatarUpload={profileForm.handleAvatarUpload}
            onDrop={profileForm.handleDrop}
            onDragOver={profileForm.handleDragOver}
            enrollments={enrollments}
            loading={loading}
          />
        );
      case "organized":
        return (
          <OrganizedTab
            organizedHackathons={organizedHackathons}
            currentUserId={currentUser?.id}
            loading={loading}
          />
        );
      case "preferences":
        return (
          <PreferencesTab
            currentUser={currentUser}
            fetchCurrentUser={fetchCurrentUser}
          />
        );
      case "account":
        return (
          <AccountTab
            currentUser={currentUser}
            setActiveTab={setActiveTab}
          />
        );
      case "notifications":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 text-gray-400"
          >
            通知中心即将上线
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <ProfileSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
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
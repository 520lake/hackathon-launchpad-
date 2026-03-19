import { useState, useEffect, useRef } from "react";
import axios from "axios";
import type { ProfileUser } from "@/types/profile";
import {
  UNSAVED_CHANGES_WARNING,
  useUnsavedChangesWarning,
} from "@/hooks/useUnsavedChangesWarning";

export interface EditFormState {
  full_name: string;
  username: string;
  bio: string;
  city: string;
  skills: string;
  interests: string;
  avatar_url: string;
}

interface UseProfileFormParams {
  currentUser: ProfileUser | null;
  fetchCurrentUser: () => void;
}

const buildEditForm = (user: ProfileUser | null): EditFormState => ({
  full_name: user?.full_name || "",
  username: user?.username || user?.nickname || "",
  bio: user?.bio || "",
  city: user?.city || "",
  skills: user?.skills || "",
  interests: user?.interests || "",
  avatar_url: user?.avatar_url || "",
});

export function useProfileForm({
  currentUser,
  fetchCurrentUser,
}: UseProfileFormParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.detail || "保存失败";
    }
    return "保存失败";
  };

  const [editForm, setEditForm] = useState<EditFormState>({
    ...buildEditForm(null),
  });
  const initialEditForm = buildEditForm(currentUser);
  const hasUnsavedChanges =
    isEditing &&
    JSON.stringify(editForm) !== JSON.stringify(initialEditForm);
  useUnsavedChangesWarning(hasUnsavedChanges);

  useEffect(() => {
    setEditForm(buildEditForm(currentUser));
  }, [currentUser]);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      const payload = {
        ...editForm,
        nickname: editForm.username,
      };
      await axios.put("/api/v1/users/me", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCurrentUser();
      setIsEditing(false);
      alert("保存成功");
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }

    setUploading(true);
    try {
      const localUrl = URL.createObjectURL(file);
      setEditForm({ ...editForm, avatar_url: localUrl });
    } catch {
      alert("图片上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCancelEditing = () => {
    if (!confirmDiscardChanges()) {
      return;
    }
  };

  const confirmDiscardChanges = (message = UNSAVED_CHANGES_WARNING) => {
    if (hasUnsavedChanges && !window.confirm(message)) {
      return false;
    }

    setEditForm(initialEditForm);
    setIsEditing(false);
    return true;
  };

  return {
    editForm,
    setEditForm,
    isEditing,
    setIsEditing,
    saving,
    uploading,
    fileInputRef,
    handleSaveProfile,
    handleAvatarUpload,
    handleDrop,
    handleDragOver,
    hasUnsavedChanges,
    handleCancelEditing,
    confirmDiscardChanges,
  };
}

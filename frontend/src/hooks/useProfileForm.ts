import { useState, useEffect, useRef } from "react";
import axios from "axios";

export interface EditFormState {
  full_name: string;
  nickname: string;
  bio: string;
  city: string;
  phone: string;
  skills: string;
  interests: string;
  avatar_url: string;
}

interface UseProfileFormParams {
  currentUser: any;
  fetchCurrentUser: () => void;
}

export function useProfileForm({
  currentUser,
  fetchCurrentUser,
}: UseProfileFormParams) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState<EditFormState>({
    full_name: "",
    nickname: "",
    bio: "",
    city: "",
    phone: "",
    skills: "",
    interests: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        full_name: currentUser.full_name || "",
        nickname: currentUser.nickname || "",
        bio: currentUser.bio || "",
        city: currentUser.city || "",
        phone: currentUser.phone || "",
        skills: currentUser.skills || "",
        interests: currentUser.interests || "",
        avatar_url: currentUser.avatar_url || "",
      });
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      await axios.put("/api/v1/users/me", editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCurrentUser();
      setIsEditing(false);
      alert("保存成功");
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "保存失败");
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
    } catch (e: any) {
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
  };
}

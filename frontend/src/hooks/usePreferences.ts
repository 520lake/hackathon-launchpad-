import { useState } from "react";
import axios from "axios";

export function usePreferences(fetchCurrentUser: () => void) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "AI",
    "可持续发展",
    "Web3",
  ]);
  const [customTopic, setCustomTopic] = useState("");
  const [notificationSettings, setNotificationSettings] = useState<
    Record<string, boolean>
  >({
    activity_reminder: true,
    new_hackathon_push: true,
    system_announcement: true,
    general_notification: true,
  });
  const [availableTopics, setAvailableTopics] = useState([
    "AI",
    "可持续发展",
    "Web3",
    "物联网",
    "大数据",
    "区块链",
    "云计算",
    "元宇宙",
    "智能制造",
    "金融科技",
  ]);
  const [saving, setSaving] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const addCustomTopic = () => {
    if (customTopic.trim() && !availableTopics.includes(customTopic.trim())) {
      setAvailableTopics((prev) => [...prev, customTopic.trim()]);
      setSelectedTopics((prev) => [...prev, customTopic.trim()]);
      setCustomTopic("");
    }
  };

  const handleSaveTopics = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      await axios.patch(
        "/api/v1/users/me",
        {
          interests: selectedTopics.join(","),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchCurrentUser();
      alert("话题保存成功，我们将根据您的话题偏好推送相关活动通知");
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotificationSetting = (settingId: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [settingId]: !prev[settingId],
    }));
  };

  const handleSavePreferences = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      await axios.patch(
        "/api/v1/users/me/preferences",
        {
          notification_settings: notificationSettings,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("偏好设置保存成功");
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return {
    selectedTopics,
    customTopic,
    setCustomTopic,
    availableTopics,
    notificationSettings,
    saving,
    toggleTopic,
    addCustomTopic,
    handleSaveTopics,
    toggleNotificationSetting,
    handleSavePreferences,
  };
}

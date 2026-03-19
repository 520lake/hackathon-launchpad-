import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProfileUser } from "@/types/profile";

interface PreferencesTabProps {
  currentUser: ProfileUser | null;
  fetchCurrentUser: () => void;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || "保存失败";
  }
  return "保存失败";
};

const parseNotificationSettings = (
  value: ProfileUser["notification_settings"],
): Record<string, boolean> => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, boolean>;
      }
    } catch {
      return {};
    }
    return {};
  }

  return value;
};

const DEFAULT_TOPICS = [
  "AI / 人工智能",
  "Web3 / 区块链",
  "可持续发展",
  "教育科技",
  "健康医疗",
  "金融科技",
  "游戏开发",
  "开源项目",
  "社会公益",
  "物联网",
];

const NOTIFICATION_ITEMS = [
  {
    id: "activity_reminder",
    label: "活动提醒",
    desc: "接收报名活动的开始、截止提醒",
    icon: "⏰",
    category: "activity",
  },
  {
    id: "new_hackathon_push",
    label: "新活动推送",
    desc: "接收符合兴趣标签的新活动通知",
    icon: "🚀",
    category: "promotion",
  },
  {
    id: "system_announcement",
    label: "系统公告",
    desc: "接收平台重要公告和更新",
    icon: "📢",
    category: "system",
  },
  {
    id: "general_notification",
    label: "其他消息",
    desc: "接收平台的一般性通知和提醒",
    icon: "✉️",
    category: "general",
  },
];

export default function PreferencesTab({
  currentUser,
  fetchCurrentUser,
}: PreferencesTabProps) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState(DEFAULT_TOPICS);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    currentUser?.interests ? currentUser.interests.split(",").map((s: string) => s.trim()) : [],
  );
  const [notificationSettings, setNotificationSettings] = useState<
    Record<string, boolean>
  >(parseNotificationSettings(currentUser?.notification_settings));

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
        { interests: selectedTopics.join(",") },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchCurrentUser();
      alert("话题保存成功，我们将根据您的话题偏好推送相关活动通知");
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      await axios.patch(
        "/api/v1/users/me/preferences",
        { notification_settings: notificationSettings },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("偏好设置保存成功");
    } catch (error) {
      console.error(error);
      alert(getErrorMessage(error));
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

  return (
    <div className="space-y-6">
      {/* Topics */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">感兴趣的话题</h3>
          <Button
            variant="ghost"
            onClick={handleSaveTopics}
            disabled={saving}
            className="text-brand text-sm hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-[16px] hover:bg-brand/5"
          >
            {saving ? "保存中..." : "保存话题"}
          </Button>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          选择你感兴趣的话题，我们将为你推荐相关的黑客松活动，并在有相关活动发布时发送通知。
        </p>

        <div className="flex gap-2 mb-6">
          <Input
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addCustomTopic()}
            placeholder="输入自定义话题..."
            className="flex-1 px-4 py-3 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-[#FBBF24] outline-none transition-colors"
          />
          <Button
            onClick={addCustomTopic}
            disabled={!customTopic.trim()}
            className="px-6 py-3 bg-[#FBBF24] text-black text-sm font-medium rounded-[16px] hover:bg-white transition-colors disabled:opacity-50"
          >
            添加
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          {availableTopics.map((topic) => (
            <Button
              variant="outline"
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-5 py-2.5 rounded-[20px] text-sm transition-all ${
                selectedTopics.includes(topic)
                  ? "bg-white text-black font-medium"
                  : "bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400"
              }`}
            >
              {topic}
            </Button>
          ))}
        </div>

        {selectedTopics.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#222]">
            <p className="text-gray-500 text-xs">
              已选择 {selectedTopics.length} 个话题，当相关活动发布时您将收到通知
            </p>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-[24px] p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg">通知偏好设置</h3>
          <Button
            variant="ghost"
            onClick={handleSavePreferences}
            disabled={saving}
            className="text-brand text-sm hover:text-white transition-colors disabled:opacity-50 px-4 py-2 rounded-[16px] hover:bg-brand/5"
          >
            {saving ? "保存中..." : "保存偏好设置"}
          </Button>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          管理您希望接收的通知类型。您可以随时在通知中心查看和管理所有通知。
        </p>

        <div className="space-y-4">
          {NOTIFICATION_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 py-4 border-b border-[#222] group hover:bg-[#111] transition-colors rounded-[16px] px-2"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-[#111] rounded-[16px] flex items-center justify-center text-lg">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-white text-sm font-medium">
                    {item.label}
                  </div>
                  <span className="px-2 py-0.5 bg-[#222] text-[10px] text-gray-400 rounded font-mono">
                    {item.category}
                  </span>
                </div>
                <div className="text-gray-500 text-[12px] leading-relaxed">
                  {item.desc}
                </div>
              </div>
              <Switch
                checked={!!notificationSettings[item.id]}
                onCheckedChange={() => toggleNotificationSetting(item.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#222]">
          <Button
            variant="outline"
            onClick={() => navigate("/notifications")}
            className="w-full py-3 border border-[#222] text-gray-400 text-sm rounded-[16px] hover:border-[#FBBF24] hover:text-[#FBBF24] transition-colors flex items-center justify-center gap-2"
          >
            <span>🔔</span>
            前往通知中心管理所有通知
          </Button>
        </div>
      </div>
    </div>
  );
}

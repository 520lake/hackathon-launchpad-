import { Button } from "@/components/ui/button";
import {
  UserIcon,
  SettingsIcon,
} from "./ProfileIcons";

type TabId = "profile" | "account";

interface ProfileSidebarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const menuItems = [
  { id: "profile" as const, label: "个人资料", icon: <UserIcon /> },
  { id: "account" as const, label: "账号设置", icon: <SettingsIcon /> },
];

export default function ProfileSidebar({
  activeTab,
  setActiveTab,
}: ProfileSidebarProps) {
  return (
    <div className="w-56 flex-shrink-0">
      <nav className="sticky top-24 space-y-2">
        {menuItems.map((item) => (
          <Button
            variant="ghost"
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-all rounded-[16px] ${
              activeTab === item.id
                ? "bg-white/[0.08] text-white"
                : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}

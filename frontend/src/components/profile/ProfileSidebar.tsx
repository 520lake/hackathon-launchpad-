import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="sticky top-24 w-56 flex-shrink-0">
      <CardContent className="p-3">
        <nav className="space-y-2">
        {menuItems.map((item) => (
          <Button
            variant={activeTab === item.id ? "secondary" : "ghost"}
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="w-full justify-start gap-3"
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
        </nav>
      </CardContent>
    </Card>
  );
}

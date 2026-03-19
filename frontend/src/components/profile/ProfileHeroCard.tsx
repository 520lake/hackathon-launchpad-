import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BriefcaseBusiness,
  MapPin,
  Quote,
  Tags,
} from "lucide-react";
import {
  UserIcon,
  EditIcon,
} from "./ProfileIcons";
import type { ProfileUser } from "@/types/profile";

interface ProfileHeroCardProps {
  currentUser: ProfileUser | null;
  onEdit: () => void;
}

export default function ProfileHeroCard({
  currentUser,
  onEdit,
}: ProfileHeroCardProps) {
  const fieldIconClassName = "mt-1 h-4 w-4 shrink-0 text-muted-foreground";
  const displayName =
    currentUser?.username ||
    currentUser?.nickname ||
    currentUser?.full_name ||
    "未设置用户名";
  return (
    <div className="flex items-start gap-6">
      <Avatar className="size-24">
        <AvatarImage
          src={currentUser?.avatar_url || undefined}
          alt={displayName}
        />
        <AvatarFallback className="text-lg font-semibold">
          <span className="scale-[2.3]">
            <UserIcon />
          </span>
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-foreground">
            {displayName}
          </h2>
        </div>

        <div className="mb-3 flex flex-col gap-2.5 text-sm leading-6 text-muted-foreground">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <div className="flex min-w-0 items-start gap-2">
              <MapPin className={fieldIconClassName} />
              <span className="truncate">
                {currentUser?.city || "未设置城市"}
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <BriefcaseBusiness className={fieldIconClassName} />
              <span className="truncate">
                {currentUser?.skills || "未设置职业/专业"}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-2">
            <Tags className={fieldIconClassName} />
            <span className="truncate">
              {currentUser?.interests || "未设置兴趣领域"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
          <Quote className={fieldIconClassName} />
          <p className="line-clamp-3">{currentUser?.bio || "暂无个人简介"}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onEdit}>
        <EditIcon />
        编辑资料
      </Button>
    </div>
  );
}

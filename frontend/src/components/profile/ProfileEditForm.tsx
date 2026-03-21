import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultipleSelector from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import type { Option } from "@/components/ui/multi-select";
import { CloseIcon, UploadIcon, UserIcon } from "./ProfileIcons";
import ImageCropper from "@/components/ui/image-cropper";
import type { EditFormState } from "@/hooks/useProfileForm";

interface ProfileEditFormProps {
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  saving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEditForm({
  editForm,
  setEditForm,
  saving,
  fileInputRef,
  onSave,
  onCancel,
}: ProfileEditFormProps) {
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");

  function handleFileSelected(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setRawImageSrc(url);
    setCropDialogOpen(true);
  }

  function handleCropComplete(croppedDataUrl: string) {
    setEditForm({ ...editForm, avatar_url: croppedDataUrl });
    setCropDialogOpen(false);
    cleanupRawImage();
  }

  function handleCropCancel() {
    setCropDialogOpen(false);
    cleanupRawImage();
  }

  function cleanupRawImage() {
    if (rawImageSrc) {
      URL.revokeObjectURL(rawImageSrc);
      setRawImageSrc("");
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }
  const interestOptions: Option[] = [
    "人工智能",
    "大语言模型",
    "机器学习",
    "计算机视觉",
    "自然语言处理",
    "AI 安全",
    "Web3",
    "DeFi",
    "DAO",
    "开源",
    "开发者工具",
    "SaaS",
    "云原生",
    "网络安全",
    "数据可视化",
    "金融科技",
    "医疗健康",
    "教育科技",
    "气候科技",
    "可持续发展",
    "社会公益",
    "电商",
    "内容创作",
    "游戏",
    "AR/VR",
    "机器人",
    "物联网",
    "智慧城市",
    "生物科技",
    "法律科技",
    "量子计算",
    "音视频",
    "无障碍",
  ].map((item) => ({ value: item, label: item }));

  const toOptions = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ value: item, label: item }));

  const mergeOptions = (defaults: Option[], value: string) => {
    const map = new Map(defaults.map((option) => [option.value, option]));
    toOptions(value).forEach((option) => {
      map.set(option.value, option);
    });
    return Array.from(map.values());
  };

  const updateMultiSelectField =
    (field: "skills" | "interests") => (options: Option[]) => {
      setEditForm({
        ...editForm,
        [field]: options.map((option) => option.value).join(", "),
      });
    };

  const interestCount = toOptions(editForm.interests).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">编辑个人资料</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <CloseIcon />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div
          className="relative cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Avatar className="size-24 rounded-full">
            <AvatarImage src={editForm.avatar_url || undefined} alt="avatar" />
            <AvatarFallback className="rounded-full bg-muted text-muted-foreground">
              <span className="scale-[2.3]">
                <UserIcon />
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity hover:opacity-100">
            <UploadIcon />
          </div>
        </div>
        <div className="flex-1 w-full">
          <Label className="mb-2 text-muted-foreground">头像</Label>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="justify-center gap-2"
            >
              <UploadIcon />
              点击上传头像
            </Button>
            <div className="flex gap-2">
              {editForm.avatar_url && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setEditForm({
                      ...editForm,
                      avatar_url: "",
                    })
                  }
                  className="flex-1 justify-center gap-2"
                >
                  <CloseIcon />
                  移除
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            支持上传 JPG、PNG 格式，最大 5MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      <ImageCropper
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        circularCrop
        title="裁剪头像"
        description="拖动选择区域来裁剪你的头像"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 text-muted-foreground">用户名</Label>
          <Input
            value={editForm.username}
            onChange={(e) =>
              setEditForm({ ...editForm, username: e.target.value })
            }
            className="h-11"
          />
        </div>
        <div>
          <Label className="mb-1.5 text-muted-foreground">常住城市</Label>
          <Input
            value={editForm.city}
            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
            placeholder="如：上海"
            className="h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5 text-muted-foreground">职业/专业</Label>
          <Input
            value={editForm.skills}
            onChange={(e) =>
              setEditForm({ ...editForm, skills: e.target.value })
            }
            placeholder="如：前端工程师/产品经理/运营"
            className="h-11"
          />
        </div>

        <div>
          <Label className="mb-1.5 text-muted-foreground">
            兴趣领域 ({interestCount}/5)
          </Label>
          <MultipleSelector
            commandProps={{ label: "Select interests" }}
            value={toOptions(editForm.interests)}
            defaultOptions={mergeOptions(interestOptions, editForm.interests)}
            onChange={updateMultiSelectField("interests")}
            placeholder="选择兴趣领域"
            creatable
            maxSelected={5}
            hideClearAllButton
            hidePlaceholderWhenSelected
            emptyIndicator={
              <p className="text-center text-sm">No results found</p>
            }
            className="w-full"
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5 text-muted-foreground">个人简介</Label>
        <Textarea
          value={editForm.bio}
          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
          rows={3}
          placeholder="介绍一下自己吧..."
          className="min-h-28"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}

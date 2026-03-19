import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserIcon, CloseIcon, UploadIcon } from "./ProfileIcons";
import type { EditFormState } from "@/hooks/useProfileForm";

interface ProfileEditFormProps {
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  saving: boolean;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSave: () => void;
  onCancel: () => void;
  onAvatarUpload: (file: File) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

export default function ProfileEditForm({
  editForm,
  setEditForm,
  saving,
  uploading,
  fileInputRef,
  onSave,
  onCancel,
  onAvatarUpload,
  onDrop,
  onDragOver,
}: ProfileEditFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">
          编辑个人资料
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
        >
          <CloseIcon />
        </Button>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1A1A1A] border-2 border-[#333] flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand transition-colors relative"
          style={{ overflow: "hidden", borderRadius: "50%" }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          {uploading ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : null}
          {editForm.avatar_url ? (
            <img
              src={editForm.avatar_url}
              alt="avatar"
              className="w-full h-full object-cover rounded-full"
              style={{ borderRadius: "50%" }}
            />
          ) : (
            <div className="text-gray-500">
              <UserIcon />
            </div>
          )}
          {/* Upload Overlay on Hover */}
          <div
            className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
            style={{ borderRadius: "50%" }}
          >
            <UploadIcon />
          </div>
        </div>
        <div className="flex-1 w-full">
          <label className="text-gray-400 text-sm mb-2 block">
            头像
          </label>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 bg-[#1A1A1A] border border-[#333] text-white text-sm rounded-[16px] hover:border-brand transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UploadIcon />
              {uploading ? "上传中..." : "点击上传头像"}
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
                  className="flex-1 px-4 py-2 bg-red-900/20 border border-red-800/30 text-red-400 text-sm rounded-[16px] hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                >
                  <CloseIcon />
                  移除
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            支持上传 JPG、PNG 格式，最大 5MB
          </p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onAvatarUpload(file);
          }
        }}
        className="hidden"
      />

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-gray-400 text-sm mb-1 block">用户名</label>
          <Input
            value={editForm.nickname}
            onChange={(e) =>
              setEditForm({ ...editForm, nickname: e.target.value })
            }
            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm mb-1 block">真实姓名</label>
          <Input
            value={editForm.full_name}
            onChange={(e) =>
              setEditForm({ ...editForm, full_name: e.target.value })
            }
            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-gray-400 text-sm mb-1 block">常住城市</label>
          <Input
            value={editForm.city}
            onChange={(e) =>
              setEditForm({ ...editForm, city: e.target.value })
            }
            placeholder="如：上海"
            className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-sm mb-1 block">
          技能（用逗号分隔）
        </label>
        <Input
          value={editForm.skills}
          onChange={(e) =>
            setEditForm({ ...editForm, skills: e.target.value })
          }
          placeholder="React, Python, AI..."
          className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-gray-400 text-sm mb-1 block">
          兴趣领域（用逗号分隔）
        </label>
        <Input
          value={editForm.interests}
          onChange={(e) =>
            setEditForm({ ...editForm, interests: e.target.value })
          }
          placeholder="AI, Web3, 可持续发展..."
          className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-gray-400 text-sm mb-1 block">个人简介</label>
        <Textarea
          value={editForm.bio}
          onChange={(e) =>
            setEditForm({ ...editForm, bio: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-[16px] text-white text-sm focus:border-brand outline-none resize-none transition-colors"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="px-4 py-2.5 border border-[#333] text-gray-400 text-sm rounded-[16px] hover:text-white transition-colors"
        >
          取消
        </Button>
        <Button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2.5 bg-brand text-black font-medium text-sm rounded-[16px] hover:bg-white transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}

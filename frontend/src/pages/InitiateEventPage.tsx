import { useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { Loader2, X, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultipleSelector from "@/components/ui/multi-select";
import type { Option } from "@/components/ui/multi-select";
import ImageCropper from "@/components/ui/image-cropper";

import type { ProfileUser } from "@/types/profile";

interface OutletContextType {
  isLoggedIn: boolean;
  currentUser: ProfileUser | null;
}

type HackathonFormat = "online" | "offline";
type RegistrationType = "individual" | "team";

const TAG_OPTIONS: Option[] = [
  "新手友好",
  "电商/零售",
  "教育",
  "生活方式",
  "金融",
  "游戏",
  "低代码/无代码",
  "AI",
  "音乐/艺术",
  "开放主题",
  "效率工具",
  "流程自动化",
  "社会公益",
  "情感/心理",
].map((t) => ({ value: t, label: t }));

/** Reusable toggle-pair for binary selections */
function TogglePair<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-[8px] border px-4 py-2.5 text-sm font-medium transition-all ${
            value === opt.value
              ? "border-brand bg-brand/15 text-brand"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function InitiateEventPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useOutletContext<OutletContextType>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [tags, setTags] = useState<Option[]>([]);
  const [format, setFormat] = useState<HackathonFormat>("online");
  const [registrationType, setRegistrationType] =
    useState<RegistrationType>("team");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");

  const isValid = title.trim() !== "";

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }
    setError("");
    const url = URL.createObjectURL(file);
    setRawImageSrc(url);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setCropDialogOpen(false);
    cleanupRawImage();
    setCoverImage(croppedDataUrl);

    // Upload the cropped image
    setUploading(true);
    try {
      const blob = await fetch(croppedDataUrl).then((r) => r.blob());
      const fd = new FormData();
      fd.append("file", blob, "cover.png");
      const res = await axios.post("/api/v1/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCoverImage(res.data.url);
    } catch {
      setError("图片上传失败，将使用本地预览");
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    cleanupRawImage();
  };

  const cleanupRawImage = () => {
    if (rawImageSrc) {
      URL.revokeObjectURL(rawImageSrc);
      setRawImageSrc("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  };

  const handleCreate = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/v1/hackathons",
        {
          title: title.trim(),
          description: description.trim() || null,
          cover_image: coverImage || null,
          tags:
            tags.length > 0 ? tags.map((t) => t.value) : null,
          format,
          registration_type: registrationType,
          status: "draft",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const hackathonId = res.data.id;
      navigate(`/create?edit=${hackathonId}`, { replace: true });
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">请先登录</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 xl:px-0">
        {/* Header — matches ProfilePage style */}
        <div className="mb-12 flex items-center gap-2">
          <span className="text-[36px] font-bold text-brand">//</span>
          <h1 className="text-[36px] font-bold text-white">发起活动</h1>
        </div>

        {/* Centered form */}
        <div className="mx-auto w-full max-w-lg space-y-6">
          {/* Hackathon Name */}
          <div className="space-y-2">
            <Label className="text-zinc-300">
              活动名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="输入活动名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 border-zinc-800 bg-zinc-900/50 text-zinc-200 placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-zinc-700/50"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label className="text-zinc-300">
              一句话简介{" "}
              <span className="text-zinc-600">({description.length}/30)</span>
            </Label>
            <Input
              placeholder="用一句话描述你的活动"
              maxLength={30}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 border-zinc-800 bg-zinc-900/50 text-zinc-200 placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-zinc-700/50"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-zinc-300">
              主题标签 <span className="text-zinc-600">({tags.length}/5)</span>
            </Label>
            <MultipleSelector
              commandProps={{ label: "Select tags" }}
              value={tags}
              defaultOptions={TAG_OPTIONS}
              onChange={setTags}
              placeholder="选择或输入主题标签"
              creatable
              maxSelected={5}
              hideClearAllButton
              hidePlaceholderWhenSelected
              emptyIndicator={
                <p className="text-center text-sm text-zinc-500">无匹配标签</p>
              }
              className="w-full border-zinc-800 bg-zinc-900/50"
            />
          </div>

          {/* Thumbnail Image */}
          <div className="space-y-2">
            <Label className="text-zinc-300">封面图片</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
                e.target.value = "";
              }}
            />
            <ImageCropper
              open={cropDialogOpen}
              onOpenChange={setCropDialogOpen}
              imageSrc={rawImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              title="裁剪封面"
              description="拖动选择区域来裁剪封面图片"
            />
            {coverImage ? (
              <div className="group relative w-40 overflow-hidden rounded-[8px] border border-zinc-800">
                <img
                  src={coverImage}
                  alt="封面预览"
                  className="aspect-square w-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-zinc-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                >
                  <X className="size-4" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="size-6 animate-spin text-brand" />
                  </div>
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-zinc-800 bg-zinc-900/30 text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-500"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin text-brand" />
                ) : (
                  <>
                    <ImageIcon className="size-8" />
                    <span className="text-xs">点击或拖拽上传封面图片</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hold Type — toggle pair */}
          <div className="space-y-2">
            <Label className="text-zinc-300">
              举办方式 <span className="text-red-500">*</span>
            </Label>
            <TogglePair
              value={format}
              onChange={setFormat}
              options={[
                { value: "online", label: "线上" },
                { value: "offline", label: "线下" },
              ]}
            />
          </div>

          {/* Registration Type — toggle pair */}
          <div className="space-y-2">
            <Label className="text-zinc-300">
              报名方式 <span className="text-red-500">*</span>
            </Label>
            <TogglePair
              value={registrationType}
              onChange={setRegistrationType}
              options={[
                { value: "individual", label: "个人" },
                { value: "team", label: "团队" },
              ]}
            />
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              onClick={() => navigate(-1)}
            >
              取消
            </Button>
            <Button
              disabled={!isValid || submitting}
              onClick={handleCreate}
              className="bg-brand text-black hover:bg-brand/80 disabled:opacity-50"
            >
              {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              创建活动
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { type SyntheticEvent, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CropIcon, Trash2Icon } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): string {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );
  }

  return canvas.toDataURL("image/png", 1.0);
}

export default function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  function handleCrop() {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      const dataUrl = getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(dataUrl);
    }
  }

  function handleCancel() {
    setCrop(undefined);
    setCompletedCrop(undefined);
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>裁剪头像</DialogTitle>
          <DialogDescription>
            拖动选择区域来裁剪你的头像
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
            className="max-h-[60vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="裁剪预览"
              onLoad={onImageLoad}
              className="max-h-[60vh] object-contain"
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <Trash2Icon className="mr-1.5 size-4" />
            取消
          </Button>
          <Button onClick={handleCrop}>
            <CropIcon className="mr-1.5 size-4" />
            裁剪
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

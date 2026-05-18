import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, Image, X } from "lucide-react";

interface ImageUploaderProps {
  onImageLoaded: (imageData: ImageData, file: File) => void;
  currentImage?: string | null;
  onClear?: () => void;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/svg+xml", "image/gif"];

export default function ImageUploader({ onImageLoaded, currentImage, onClear }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setError("Unsupported format. Use PNG, JPG, WebP, BMP, SVG, or GIF.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 1024;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      URL.revokeObjectURL(url);
      onImageLoaded(imageData, file);
    };
    img.src = url;
  }, [onImageLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  if (currentImage) {
    return (
      <div className="relative rounded-md overflow-hidden border" style={{ borderColor: "hsl(185 90% 42% / 0.4)" }}>
        <img
          src={currentImage}
          alt="Uploaded"
          className="w-full object-contain"
          style={{ maxHeight: 200, background: "hsl(220 14% 6%)" }}
          data-testid="uploaded-image"
        />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 p-1 rounded-full text-white/70 hover:text-white transition-colors"
          style={{ background: "hsl(220 14% 10% / 0.8)" }}
          data-testid="button-clear-image"
        >
          <X size={14} />
        </button>
        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs"
          style={{ background: "hsl(185 90% 42% / 0.12)", color: "hsl(185 90% 62%)" }}
        >
          Image loaded — adjust settings and click Convert
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "upload-zone rounded-md p-6 flex flex-col items-center justify-center gap-3 cursor-pointer text-center transition-all",
          dragging && "drag-over"
        )}
        style={{ minHeight: 160 }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        data-testid="upload-zone"
      >
        <div
          className="p-3 rounded-full"
          style={{ background: "hsl(185 90% 42% / 0.1)", color: "hsl(185 90% 42%)" }}
        >
          <Upload size={24} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "hsl(210 20% 80%)" }}>
            Drop an image here or click to browse
          </p>
          <p className="text-xs mt-1" style={{ color: "hsl(210 10% 50%)" }}>
            PNG · JPG · WebP · BMP · SVG · GIF — max 20 MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={handleChange}
          data-testid="input-file-upload"
        />
      </div>
      {error && (
        <p className="mt-2 text-xs" style={{ color: "hsl(0 72% 60%)" }}>{error}</p>
      )}
    </div>
  );
}

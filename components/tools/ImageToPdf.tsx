"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ImageToPdfProps {
  t: Record<string, unknown>;
}

interface ImageItem {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
}

export default function ImageToPdf({ t }: ImageToPdfProps) {
  const toolT = (t.tools as Record<string, Record<string, string>>)["image-to-pdf"];
  const common = t.common as Record<string, string>;

  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("a4");
  const [margin, setMargin] = useState(20);
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback(async (files: FileList) => {
    const newImages: ImageItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(file);
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.src = url;
      });
      newImages.push({
        id: crypto.randomUUID(),
        file,
        url,
        width: dims.width,
        height: dims.height,
      });
    }
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const moveImage = useCallback((index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }, []);

  const generatePdf = useCallback(async () => {
    if (images.length === 0) return;
    setGenerating(true);

    try {
      const { jsPDF } = await import("jspdf");

      const pageSizes: Record<string, [number, number]> = {
        a4: [210, 297],
        letter: [215.9, 279.4],
        fit: [0, 0],
      };

      let doc: InstanceType<typeof jsPDF> | null = null;

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const bitmap = await createImageBitmap(img.file);
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        bitmap.close();

        if (pageSize === "fit") {
          const pxToMm = 25.4 / 96;
          const w = img.width * pxToMm + margin * 2;
          const h = img.height * pxToMm + margin * 2;
          if (i === 0) {
            doc = new jsPDF({ unit: "mm", format: [w, h] });
          } else {
            doc!.addPage([w, h]);
          }
          doc!.addImage(dataUrl, "JPEG", margin, margin, img.width * pxToMm, img.height * pxToMm);
        } else {
          const [pw, ph] = pageSizes[pageSize];
          const availW = pw - margin * 2;
          const availH = ph - margin * 2;
          const ratio = Math.min(availW / img.width, availH / img.height);
          const imgW = img.width * ratio;
          const imgH = img.height * ratio;
          const x = margin + (availW - imgW) / 2;
          const y = margin + (availH - imgH) / 2;

          if (i === 0) {
            doc = new jsPDF({ unit: "mm", format: [pw, ph] });
          } else {
            doc!.addPage([pw, ph]);
          }
          doc!.addImage(dataUrl, "JPEG", x, y, imgW, imgH);
        }
      }

      if (doc) {
        doc.save("images.pdf");
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [images, pageSize, margin]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) addImages(e.dataTransfer.files);
    },
    [addImages]
  );

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addImages(e.target.files)}
        />
        <div className="space-y-2">
          <svg className="mx-auto h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4l4-4 4 4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-muted-foreground">{toolT.dropzone}</p>
        </div>
      </div>

      {/* Settings */}
      {images.length > 0 && (
        <div className="border border-border rounded-lg p-4 bg-muted/30 flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{toolT.pageSize}</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as "fit" | "a4" | "letter")}
              className="rounded border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="fit">{toolT.fitToImage}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{toolT.margin}</label>
            <input
              type="number"
              min={0}
              max={50}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
            />
            <span className="text-xs text-muted-foreground">mm</span>
          </div>
          <Button onClick={generatePdf} disabled={generating} size="sm">
            {generating ? toolT.generating : toolT.generate}
          </Button>
        </div>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img.id} className="relative group border border-border rounded-lg overflow-hidden bg-muted/20">
              <img src={img.url} alt="" className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={() => moveImage(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-white disabled:opacity-30 hover:bg-white/20 rounded"
                  title="Move left"
                >
                  ◀
                </button>
                <button
                  onClick={() => removeImage(img.id)}
                  className="p-1 text-red-400 hover:bg-white/20 rounded"
                  title={common.remove || "Remove"}
                >
                  ✕
                </button>
                <button
                  onClick={() => moveImage(i, 1)}
                  disabled={i === images.length - 1}
                  className="p-1 text-white disabled:opacity-30 hover:bg-white/20 rounded"
                  title="Move right"
                >
                  ▶
                </button>
              </div>
              <div className="px-2 py-1 text-xs text-muted-foreground truncate">
                {img.file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

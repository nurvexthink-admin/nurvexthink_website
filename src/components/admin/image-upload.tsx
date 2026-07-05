"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadProductImage } from "@/app/admin/(panel)/products/actions";

/** Shared pick-file → server-action-upload flow. */
function useUpload(onDone: (url: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProductImage(formData);
    if (result.ok) onDone(result.url);
    else setError(result.error);
    setBusy(false);
  }

  return { busy, error, upload };
}

export function ImageUploadField({
  label,
  destination,
  value,
  onChange,
}: {
  label: string;
  /** Where this image appears publicly — every admin field names its destination. */
  destination: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { busy, error, upload } = useUpload((url) => onChange(url));

  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium">
      <span>
        {label} <span className="text-muted-foreground font-normal">({destination})</span>
      </span>
      <div className="flex items-start gap-3">
        <div className="border-border bg-muted relative aspect-[16/9] w-40 shrink-0 overflow-hidden rounded-lg border">
          {value ? (
            <Image src={value} alt="" fill sizes="10rem" className="object-cover" />
          ) : (
            <span className="text-muted-foreground absolute inset-0 grid place-items-center text-xs font-normal">
              No image
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="border-border text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus className="size-3.5" />
            )}
            {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-muted-foreground hover:text-destructive inline-flex w-fit items-center gap-1 text-xs transition-colors"
            >
              <X className="size-3" />
              Remove
            </button>
          ) : null}
          {error ? <p className="text-destructive text-xs font-normal">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function GalleryUploadField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { busy, error, upload } = useUpload((url) => onChange([...value, url]));

  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium">
      <span>
        Gallery{" "}
        <span className="text-muted-foreground font-normal">
          (image grid on the technical page)
        </span>
      </span>
      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div
            key={url}
            className="border-border bg-muted relative aspect-[16/10] w-36 overflow-hidden rounded-lg border"
          >
            <Image src={url} alt="" fill sizes="9rem" className="object-cover" />
            <button
              type="button"
              aria-label="Remove gallery image"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="bg-background/80 text-foreground hover:text-destructive absolute top-1 right-1 rounded-full p-1 backdrop-blur transition-colors"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="border-border text-muted-foreground hover:text-foreground grid aspect-[16/10] w-36 place-items-center rounded-lg border border-dashed text-xs font-medium transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : "+ Add image"}
        </button>
      </div>
      {error ? <p className="text-destructive text-xs font-normal">{error}</p> : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  getRepairAttachmentRejectionReason,
  isSupportedRepairAttachment,
  normalizeRepairAttachmentMimeType,
} from "@/lib/repair-attachment-validation";

type SelectedUpload = {
  source: "camera" | "file";
  name: string;
  type: string;
  size: number;
  originalSize?: number;
  compressed: boolean;
  previewUrl?: string;
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 2.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1800;

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploadKind(file: File) {
  const mimeType = normalizeRepairAttachmentMimeType(file.type);
  const fileName = file.name.toLowerCase();

  if (
    mimeType.startsWith("image/") ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  ) {
    return "photo";
  }

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "PDF";
  }

  return "file";
}

function isCompressibleImage(file: File) {
  const name = file.name.toLowerCase();
  const mimeType = normalizeRepairAttachmentMimeType(file.type);

  return (
    mimeType.startsWith("image/") &&
    !name.endsWith(".heic") &&
    !name.endsWith(".heif") &&
    mimeType !== "image/heic" &&
    mimeType !== "image/heif" &&
    mimeType !== "image/heic-sequence" &&
    mimeType !== "image/heif-sequence"
  );
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be loaded for compression."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

async function compressImageFile(file: File) {
  if (!isCompressibleImage(file) || file.size <= TARGET_IMAGE_BYTES) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  for (const quality of [0.82, 0.74, 0.66, 0.58]) {
    const blob = await canvasToBlob(canvas, quality);

    if (blob && (blob.size <= TARGET_IMAGE_BYTES || quality === 0.58)) {
      const baseName = file.name.replace(/\.[^.]+$/, "") || "repair-photo";
      return new File([blob], `${baseName}-compressed.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }
  }

  return file;
}

function assignFileToInput(input: HTMLInputElement | null, file: File) {
  if (!input) {
    return false;
  }

  try {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    return true;
  } catch {
    return false;
  }
}

export function TenantRepairUploadFields() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUpload, setSelectedUpload] = useState<SelectedUpload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (selectedUpload?.previewUrl) {
        URL.revokeObjectURL(selectedUpload.previewUrl);
      }
    };
  }, [selectedUpload]);

  function clearOtherInput(source: SelectedUpload["source"]) {
    if (source === "camera" && fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (source === "file" && cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }

  async function handleFileChange(source: SelectedUpload["source"], file?: File) {
    if (selectedUpload?.previewUrl) {
      URL.revokeObjectURL(selectedUpload.previewUrl);
    }

    if (!file) {
      setSelectedUpload(null);
      return;
    }

    console.log("ticket upload file selected", {
      name: file.name,
      type: normalizeRepairAttachmentMimeType(file.type) || "unknown",
      size: file.size,
    });
    setUploadError(null);
    setSelectedUpload(null);

    if (!isSupportedRepairAttachment({ fileName: file.name, mimeType: file.type })) {
      console.log("ticket upload rejected", {
        reason: getRepairAttachmentRejectionReason({ fileName: file.name, mimeType: file.type }),
        name: file.name,
        type: normalizeRepairAttachmentMimeType(file.type) || "unknown",
      });
      clearOtherInput(source);
      if (source === "camera" && cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }

      if (source === "file" && fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadError("Upload a JPG, PNG, HEIC, HEIF, or PDF file for this repair ticket.");
      return;
    }

    let uploadFile = file;

    try {
      uploadFile = await compressImageFile(file);
    } catch {
      uploadFile = file;
    }

    if (uploadFile.size > MAX_UPLOAD_BYTES) {
      console.log("ticket upload rejected", {
        reason: "file-too-large",
        name: uploadFile.name,
        type: normalizeRepairAttachmentMimeType(uploadFile.type) || "unknown",
      });
      clearOtherInput(source);
      if (source === "camera" && cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }

      if (source === "file" && fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSelectedUpload(null);
      setUploadError(
        "Photo is too large. Please choose a smaller image or retake the photo.",
      );
      return;
    }

    console.log("ticket upload accepted", {
      name: uploadFile.name,
      type: normalizeRepairAttachmentMimeType(uploadFile.type) || "unknown",
    });

    const activeInput = source === "camera" ? cameraInputRef.current : fileInputRef.current;
    const replacedInputFile = uploadFile === file || assignFileToInput(activeInput, uploadFile);

    if (!replacedInputFile) {
      clearOtherInput(source);
      setUploadError(
        "Photo is too large. Please choose a smaller image or retake the photo.",
      );
      return;
    }

    clearOtherInput(source);
    setSelectedUpload({
      source,
      name: uploadFile.name || (source === "camera" ? "Camera photo" : "Selected file"),
      type: normalizeRepairAttachmentMimeType(uploadFile.type),
      size: uploadFile.size,
      originalSize: file.size,
      compressed: uploadFile.size < file.size,
      previewUrl: normalizeRepairAttachmentMimeType(uploadFile.type).startsWith("image/")
        ? URL.createObjectURL(uploadFile)
        : undefined,
    });
  }

  function removeUpload() {
    if (selectedUpload?.previewUrl) {
      URL.revokeObjectURL(selectedUpload.previewUrl);
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSelectedUpload(null);
    setUploadError(null);
  }

  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5">
      <p className="font-medium text-slate-700">Add a photo or supporting file</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Images, PDFs, and supporting files stay attached to the ticket for vendor review.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-3 py-3 text-center text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:px-4 sm:text-sm">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M4 7h4l1.5-2h5L16 7h4v11H4z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          Take Photo / Use Camera
          <input
            ref={cameraInputRef}
            type="file"
            name="cameraPhoto"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => handleFileChange("camera", event.currentTarget.files?.[0])}
          />
        </label>

        <label className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-3 py-3 text-center text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:px-4 sm:text-sm">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          >
            <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
            <path d="M14 2v5h5" />
          </svg>
          Choose File
          <input
            ref={fileInputRef}
            type="file"
            name="supportingFile"
            accept="image/*,.jpg,.jpeg,.png,.heic,.heif,.pdf,.doc,.docx,.txt"
            className="sr-only"
            onChange={(event) => handleFileChange("file", event.currentTarget.files?.[0])}
          />
        </label>
      </div>

      {uploadError ? (
        <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
          {uploadError}
        </div>
      ) : null}

      {selectedUpload ? (
        <div className="mt-4 rounded-[22px] border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            {selectedUpload.previewUrl ? (
              <img
                src={selectedUpload.previewUrl}
                alt=""
                className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {getUploadKind({
                  name: selectedUpload.name,
                  type: selectedUpload.type,
                } as File)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-800">
                1 {getUploadKind({ name: selectedUpload.name, type: selectedUpload.type } as File)} attached
              </p>
              <p className="mt-1 truncate text-sm text-slate-700">{selectedUpload.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatFileSize(selectedUpload.size)}
                {selectedUpload.compressed && selectedUpload.originalSize
                  ? ` · compressed from ${formatFileSize(selectedUpload.originalSize)}`
                  : ""}
                {" · "}You can remove or replace before submitting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeUpload}
            className="mt-4 min-h-[44px] w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Remove attachment
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          No file attached yet. Photos up to 10 MB are supported, and large camera images are
          compressed before submit when your browser supports it.
        </div>
      )}
    </div>
  );
}

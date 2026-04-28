import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const UPLOAD_DIR =
  process.env.RENTTRUTH_UPLOAD_DIR || join(process.cwd(), "data", "uploads");

function getSafeExtension(fileName: string, mimeType: string) {
  const rawExtension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (rawExtension) {
    return rawExtension.slice(0, 8);
  }

  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return "heic";
  }

  if (mimeType.startsWith("image/")) {
    return "jpg";
  }

  return "bin";
}

function getSafeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const cleaned = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned.slice(0, 60) || "repair-attachment";
}

export function getUploadFilePath(fileName: string) {
  return join(UPLOAD_DIR, fileName);
}

export function uploadFileExists(fileName: string) {
  return existsSync(getUploadFilePath(fileName));
}

export function saveRepairAttachmentFile(input: {
  originalFileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  mkdirSync(UPLOAD_DIR, { recursive: true });

  const extension = getSafeExtension(input.originalFileName, input.mimeType);
  const baseName = getSafeBaseName(input.originalFileName);
  const storedFileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${baseName}.${extension}`;
  const filePath = getUploadFilePath(storedFileName);

  writeFileSync(filePath, input.bytes);

  return {
    storedFileName,
    fileUrl: `/uploads/${storedFileName}`,
  };
}

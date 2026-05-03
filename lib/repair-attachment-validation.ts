const SUPPORTED_REPAIR_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "application/pdf",
]);

const SUPPORTED_REPAIR_ATTACHMENT_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
  "pdf",
]);

export function getRepairAttachmentExtension(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .split(".")
    .pop()
    ?.replace(/[^a-z0-9]/g, "") ?? "";
}

export function normalizeRepairAttachmentMimeType(mimeType?: string | null) {
  return mimeType?.trim().toLowerCase() ?? "";
}

export function isIphoneBlobPhotoUpload(input: {
  fileName?: string | null;
  mimeType?: string | null;
}) {
  const mimeType = normalizeRepairAttachmentMimeType(input.mimeType);
  const fileName = input.fileName?.trim().toLowerCase() ?? "";

  return mimeType === "application/octet-stream" && fileName === "blob";
}

export function isSupportedRepairAttachment(input: {
  fileName?: string | null;
  mimeType?: string | null;
}) {
  const mimeType = normalizeRepairAttachmentMimeType(input.mimeType);
  const extension = getRepairAttachmentExtension(input.fileName ?? "");

  if (isIphoneBlobPhotoUpload(input)) {
    return true;
  }

  if (mimeType && SUPPORTED_REPAIR_ATTACHMENT_TYPES.has(mimeType)) {
    return true;
  }

  return SUPPORTED_REPAIR_ATTACHMENT_EXTENSIONS.has(extension);
}

export function getRepairAttachmentRejectionReason(input: {
  fileName?: string | null;
  mimeType?: string | null;
}) {
  const mimeType = normalizeRepairAttachmentMimeType(input.mimeType);
  const extension = getRepairAttachmentExtension(input.fileName ?? "");

  if (!input.fileName?.trim()) {
    return "missing-file-name";
  }

  if (!mimeType && !extension) {
    return "missing-type-and-extension";
  }

  if (isIphoneBlobPhotoUpload(input)) {
    return "accepted-iphone-blob-photo";
  }

  if (mimeType && !SUPPORTED_REPAIR_ATTACHMENT_TYPES.has(mimeType)) {
    return `unsupported-type:${mimeType}`;
  }

  return `unsupported-extension:${extension || "none"}`;
}

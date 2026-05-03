"use server";

import { createRepairTicketAttachment } from "@/lib/demo-data";
import {
  getRepairAttachmentRejectionReason,
  isIphoneBlobPhotoUpload,
  isSupportedRepairAttachment,
  normalizeRepairAttachmentMimeType,
} from "@/lib/repair-attachment-validation";
import { saveRepairAttachmentFile } from "@/lib/upload-storage";

const MAX_MESSAGE_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function getUploadedMessageAttachment(formData: FormData) {
  const value = formData.get("attachment");

  return value &&
    typeof value === "object" &&
    "name" in value &&
    String(value.name || "").trim()
    ? value
    : null;
}

function getNormalizedMessageAttachmentName(input: {
  fileName: string;
  mimeType: string;
}) {
  if (isIphoneBlobPhotoUpload(input)) {
    return `message-photo-${Date.now()}.heic`;
  }

  return input.fileName;
}

export async function readMessageAttachment(formData: FormData) {
  const file = getUploadedMessageAttachment(formData);

  if (!file || typeof file !== "object" || !("name" in file)) {
    return null;
  }

  const fileName = String(file.name || "").trim();
  const mimeType = normalizeRepairAttachmentMimeType(
    "type" in file ? String(file.type || "").trim() : "",
  );
  const fileSize = "size" in file ? Number(file.size) : 0;

  console.log("message attachment selected", {
    name: fileName,
    type: mimeType || "unknown",
    size: fileSize,
  });

  if (fileSize > MAX_MESSAGE_ATTACHMENT_BYTES) {
    console.log("message attachment rejected", {
      reason: "file-too-large",
      name: fileName,
      type: mimeType || "unknown",
      size: fileSize,
    });
    return null;
  }

  if (!isSupportedRepairAttachment({ fileName, mimeType })) {
    console.log("message attachment rejected", {
      reason: getRepairAttachmentRejectionReason({ fileName, mimeType }),
      name: fileName,
      type: mimeType || "unknown",
      size: fileSize,
    });
    return null;
  }

  const normalizedName = getNormalizedMessageAttachmentName({ fileName, mimeType });
  console.log("message attachment accepted", {
    name: fileName,
    type: mimeType || "unknown",
    normalizedName,
  });

  if ("arrayBuffer" in file && fileSize > 0) {
    const arrayBuffer = await file.arrayBuffer();
    const safeMimeType = mimeType || "application/octet-stream";
    const savedFile = saveRepairAttachmentFile({
      originalFileName: normalizedName,
      mimeType: safeMimeType,
      bytes: Buffer.from(arrayBuffer),
    });

    return createRepairTicketAttachment({
      fileName: normalizedName,
      mimeType: safeMimeType,
      dataUrl: savedFile.fileUrl,
    });
  }

  return createRepairTicketAttachment({
    fileName: normalizedName,
    mimeType: mimeType || "application/octet-stream",
  });
}

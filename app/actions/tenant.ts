"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import {
  addTenantTicketMessage,
  createRepairTicketAttachment,
  createTicketForTenant,
  findPropertyById,
  flushPersistentStore,
  propertyTypeRequiresUnit,
  tenantConfirmTicketOutcome,
} from "@/lib/demo-data";
import {
  getRepairAttachmentRejectionReason,
  isIphoneBlobPhotoUpload,
  isSupportedRepairAttachment,
  normalizeRepairAttachmentMimeType,
} from "@/lib/repair-attachment-validation";
import { saveRepairAttachmentFile } from "@/lib/upload-storage";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function getNormalizedRepairAttachmentName(input: {
  fileName: string;
  mimeType: string;
}) {
  if (isIphoneBlobPhotoUpload(input)) {
    return `repair-photo-${Date.now()}.heic`;
  }

  return input.fileName;
}

function getUploadedRepairFile(formData: FormData) {
  const candidates = [
    formData.get("cameraPhoto"),
    formData.get("supportingFile"),
    formData.get("photo"),
  ];

  return candidates.find(
    (value) =>
      value &&
      typeof value === "object" &&
      "name" in value &&
      String(value.name || "").trim(),
  );
}

export async function submitTenantRepairRequest(formData: FormData) {
  const session = await getSession();

  if (
    !session ||
    session.role !== "tenant" ||
    !session.propertyId ||
    session.membershipStatus !== "Approved"
  ) {
    redirect("/login");
  }

  const category = String(formData.get("category") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const urgent = formData.get("urgent") === "on";
  const property = findPropertyById(session.propertyId);
  const photoFile = getUploadedRepairFile(formData);
  let photoPlaceholder = "No photo uploaded";
  let attachment = null;

  if (photoFile && typeof photoFile === "object" && "name" in photoFile) {
    const fileName = String(photoFile.name || "").trim();
    const mimeType = normalizeRepairAttachmentMimeType(
      "type" in photoFile ? String(photoFile.type || "").trim() : "",
    );
    const normalizedFileName = getNormalizedRepairAttachmentName({ fileName, mimeType });
    photoPlaceholder = normalizedFileName || fileName || "No photo uploaded";

    const fileSize = "size" in photoFile ? Number(photoFile.size) : 0;
    console.log("ticket upload file selected", {
      name: fileName,
      type: mimeType || "unknown",
      size: fileSize,
    });

    if (fileSize > MAX_ATTACHMENT_BYTES) {
      console.log("ticket upload rejected", {
        reason: "file-too-large",
        name: fileName,
        type: mimeType || "unknown",
        size: fileSize,
      });
      redirect("/dashboard/tenant?error=attachment-too-large");
    }

    if (fileName && !isSupportedRepairAttachment({ fileName, mimeType })) {
      console.log("ticket upload rejected", {
        reason: getRepairAttachmentRejectionReason({ fileName, mimeType }),
        name: fileName,
        type: mimeType || "unknown",
        size: fileSize,
      });
      redirect("/dashboard/tenant?error=unsupported-attachment");
    }

    console.log("ticket upload accepted", {
      name: fileName,
      type: mimeType || "unknown",
      normalizedName: normalizedFileName,
    });

    if ("arrayBuffer" in photoFile && fileName && fileSize > 0) {
      const arrayBuffer = await photoFile.arrayBuffer();
      const safeMimeType = mimeType || "application/octet-stream";
      const savedFile = saveRepairAttachmentFile({
        originalFileName: normalizedFileName,
        mimeType: safeMimeType,
        bytes: Buffer.from(arrayBuffer),
      });
      attachment = createRepairTicketAttachment({
        fileName: normalizedFileName,
        mimeType: safeMimeType,
        dataUrl: savedFile.fileUrl,
      });
    } else if (fileName) {
      attachment = createRepairTicketAttachment({
        fileName: normalizedFileName,
        mimeType: mimeType || "application/octet-stream",
      });
    }
  }

  if (!category || !title || !description) {
    redirect("/dashboard/tenant?error=missing-ticket-fields");
  }

  if (property && propertyTypeRequiresUnit(property.propertyType) && !session.unitNumber) {
    redirect("/dashboard/tenant?joinError=unit-required");
  }

  createTicketForTenant({
    tenantUserId: session.id,
    propertyId: session.propertyId,
    tenantEmail: session.email,
    unitNumber: session.unitNumber,
    issueTitle: title,
    category,
    description,
    photoPlaceholder,
    attachment,
    urgent,
  });
  await flushPersistentStore();

  redirect("/dashboard/tenant?submitted=1");
}

async function requireApprovedTenantSession() {
  const session = await getSession();

  if (!session || session.role !== "tenant") {
    redirect("/login");
  }

  return session;
}

export async function tenantConfirmRepairFixedAction(formData: FormData) {
  const session = await requireApprovedTenantSession();
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();

  tenantConfirmTicketOutcome({
    ticketId,
    tenantUserId: session.id,
    outcome: "fixed",
    feedback,
  });
  await flushPersistentStore();

  redirect("/dashboard/tenant?repair=confirmed");
}

export async function tenantReportRepairStillBrokenAction(formData: FormData) {
  const session = await requireApprovedTenantSession();
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();

  tenantConfirmTicketOutcome({
    ticketId,
    tenantUserId: session.id,
    outcome: "not-fixed",
    feedback,
  });
  await flushPersistentStore();

  redirect("/dashboard/tenant?repair=follow-up");
}

export async function tenantSendTicketMessageAction(formData: FormData) {
  const session = await requireApprovedTenantSession();
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const messageText = String(formData.get("message") ?? "").trim();

  console.log("message send started", {
    ticketId,
    senderRole: "tenant",
    userId: session.id,
  });
  const message = addTenantTicketMessage({
    ticketId,
    tenantUserId: session.id,
    messageText,
  });
  await flushPersistentStore();

  if (message) {
    console.log("message send successful", {
      ticketId,
      messageId: message.id,
      senderRole: "tenant",
    });
  }

  return message;
}

"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import {
  createRepairTicketAttachment,
  createTicketForTenant,
  findPropertyById,
  propertyTypeRequiresUnit,
  tenantConfirmTicketOutcome,
} from "@/lib/demo-data";
import { saveRepairAttachmentFile } from "@/lib/upload-storage";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const SUPPORTED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
];

function isSupportedRepairFile(fileName: string, mimeType: string) {
  const normalizedName = fileName.toLowerCase();

  return (
    SUPPORTED_ATTACHMENT_TYPES.includes(mimeType) ||
    normalizedName.endsWith(".jpg") ||
    normalizedName.endsWith(".jpeg") ||
    normalizedName.endsWith(".png") ||
    normalizedName.endsWith(".heic") ||
    normalizedName.endsWith(".heif") ||
    normalizedName.endsWith(".pdf")
  );
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
    const mimeType = "type" in photoFile ? String(photoFile.type || "").trim() : "";
    photoPlaceholder = fileName || "No photo uploaded";

    const fileSize = "size" in photoFile ? Number(photoFile.size) : 0;

    if (fileSize > MAX_ATTACHMENT_BYTES) {
      redirect("/dashboard/tenant?error=attachment-too-large");
    }

    if (fileName && !isSupportedRepairFile(fileName, mimeType)) {
      redirect("/dashboard/tenant?error=unsupported-attachment");
    }

    if ("arrayBuffer" in photoFile && fileName && fileSize > 0) {
      const arrayBuffer = await photoFile.arrayBuffer();
      const safeMimeType = mimeType || "application/octet-stream";
      const savedFile = saveRepairAttachmentFile({
        originalFileName: fileName,
        mimeType: safeMimeType,
        bytes: Buffer.from(arrayBuffer),
      });
      attachment = createRepairTicketAttachment({
        fileName,
        mimeType: safeMimeType,
        dataUrl: savedFile.fileUrl,
      });
    } else if (fileName) {
      attachment = createRepairTicketAttachment({
        fileName,
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

  redirect("/dashboard/tenant?repair=follow-up");
}

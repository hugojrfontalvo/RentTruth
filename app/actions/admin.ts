"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { isAdminSession } from "@/lib/admin-access";
import {
  getSupportTicketStatuses,
  updateSupportTicketByAdmin,
  updateVendorVerificationProfile,
  type ComplianceStatus,
  type SupportTicketStatus,
  type VerificationStatus,
} from "@/lib/demo-data";

const verificationStatuses: VerificationStatus[] = [
  "Identity Verified",
  "Background Check Complete",
  "Verification Pending",
  "Not Verified",
];

const complianceStatuses: ComplianceStatus[] = [
  "Verified on file",
  "Self-reported",
  "Verification Pending",
  "Expired",
  "No documents on file",
];

async function requireAdminSession() {
  const session = await getSession();

  if (!isAdminSession(session)) {
    redirect("/dashboard");
  }

  return session;
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isVerificationStatus(value: string): value is VerificationStatus {
  return verificationStatuses.includes(value as VerificationStatus);
}

function isComplianceStatus(value: string): value is ComplianceStatus {
  return complianceStatuses.includes(value as ComplianceStatus);
}

function isSupportStatus(value: string): value is SupportTicketStatus {
  return getSupportTicketStatuses().includes(value as SupportTicketStatus);
}

export async function updateVendorVerificationAction(formData: FormData) {
  await requireAdminSession();

  const vendorUserId = readString(formData, "vendorUserId");
  const identity = readString(formData, "identityVerificationStatus");
  const license = readString(formData, "licenseStatus");
  const insurance = readString(formData, "insuranceStatus");
  const background = readString(formData, "backgroundCheckStatus");

  if (
    !vendorUserId ||
    !isVerificationStatus(identity) ||
    !isComplianceStatus(license) ||
    !isComplianceStatus(insurance) ||
    !isVerificationStatus(background)
  ) {
    redirect("/dashboard/admin?adminError=vendor-verification");
  }

  updateVendorVerificationProfile({
    vendorUserId,
    identityVerificationStatus: identity,
    licenseStatus: license,
    insuranceStatus: insurance,
    backgroundCheckStatus: background,
  });
  redirect("/dashboard/admin?admin=vendor-updated#vendors");
}

export async function updateFeedbackStatusAction(formData: FormData) {
  await requireAdminSession();

  const ticketId = readString(formData, "ticketId");
  const status = readString(formData, "status");
  const adminNotes = readString(formData, "adminNotes");

  if (!ticketId || !isSupportStatus(status)) {
    redirect("/dashboard/admin?adminError=feedback-status#feedback");
  }

  updateSupportTicketByAdmin({
    ticketId,
    status,
    adminNotes,
  });
  redirect("/dashboard/admin?admin=feedback-updated#feedback");
}

export async function markFeedbackResolvedAction(formData: FormData) {
  await requireAdminSession();

  const ticketId = readString(formData, "ticketId");
  const adminNotes = readString(formData, "adminNotes");

  if (!ticketId) {
    redirect("/dashboard/admin?adminError=feedback-status#feedback");
  }

  updateSupportTicketByAdmin({
    ticketId,
    status: "Resolved",
    adminNotes,
  });
  redirect("/dashboard/admin?admin=feedback-resolved#feedback");
}

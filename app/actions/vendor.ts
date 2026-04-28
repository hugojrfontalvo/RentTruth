"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import {
  assignLandlordVendorToTicket,
  assignVendorToTicket,
  getCommonRepairPricingItems,
  findUserById,
  findVendorProfileByUserId,
  getVendorServiceCategories,
  landlordDeclineVendorRequest,
  landlordMarkOwnVendorArrived,
  landlordMarkOwnVendorWorkCompleted,
  landlordReviewRepairApproval,
  upsertVendorProfile,
  vendorRequestTicket,
  vendorDeclineTicket,
  vendorMarkArrived,
  vendorMarkCompleted,
  vendorMarkInProgress,
  vendorSubmitRepairApprovalRequest,
  type CommonRepairPricingItem,
  type VendorProfile,
  type VendorBaselineRepairPrice,
  type VendorServiceCategory,
} from "@/lib/demo-data";
import {
  filterValidServiceCities,
  normalizeServiceState,
} from "@/lib/service-areas";

function requireVendorSession(
  session: Awaited<ReturnType<typeof getSession>>,
): asserts session is NonNullable<Awaited<ReturnType<typeof getSession>>> & {
  role: "vendor";
} {
  if (!session || session.role !== "vendor") {
    redirect("/login");
  }
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function readCategories(formData: FormData) {
  const allowed = new Set(getVendorServiceCategories());
  return formData
    .getAll("serviceCategories")
    .map((value) => String(value))
    .filter((value): value is VendorServiceCategory => allowed.has(value as VendorServiceCategory));
}

function readServiceCities(formData: FormData) {
  return formData
    .getAll("serviceCities")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function readBaselineRepairPricing(formData: FormData, existingProfile?: VendorProfile | null) {
  return getCommonRepairPricingItems().map(({ item, label }) => {
    const priceRaw = readString(formData, `baselinePrice_${item}`);
    const laborAddOnNote = readString(formData, `baselineLabor_${item}`);
    const existingEntry = existingProfile?.baselineRepairPricing.find((entry) => entry.item === item);

    return {
      item,
      label,
      typicalPrice: priceRaw ? Number(priceRaw) : existingEntry?.typicalPrice,
      laborAddOnNote: laborAddOnNote || existingEntry?.laborAddOnNote,
    } satisfies VendorBaselineRepairPrice;
  });
}

function buildVendorProfileInput(
  userId: string,
  email: string,
  formData: FormData,
): VendorProfile {
  const existingProfile = findVendorProfileByUserId(userId);
  const serviceState = normalizeServiceState(readString(formData, "serviceState"));
  const serviceCities = filterValidServiceCities(serviceState, readServiceCities(formData));
  const serviceArea =
    serviceState && serviceCities.length > 0
      ? `${serviceState}: ${serviceCities.join(", ")}`
      : readString(formData, "serviceArea");

  return {
    userId,
    businessName: readString(formData, "businessName"),
    legalContactName: readString(formData, "legalContactName"),
    phone: readString(formData, "phone"),
    email,
    serviceCategories: readCategories(formData),
    serviceArea,
    serviceState,
    serviceCities,
    hourlyRate: Number(readString(formData, "hourlyRate") || "0"),
    emergencyRate: Number(readString(formData, "emergencyRate") || "0"),
    tripFee: Number(readString(formData, "tripFee") || "0"),
    pricingNotes: readString(formData, "pricingNotes"),
    commonRepairCosts: readString(formData, "commonRepairCosts"),
    baselineRepairPricing: readBaselineRepairPricing(formData, existingProfile),
    weekendAvailability: readBoolean(formData, "weekendAvailability"),
    sameDayAvailability: readBoolean(formData, "sameDayAvailability"),
    licenseStatus: existingProfile?.licenseStatus ?? "Verification Pending",
    licenseType: readString(formData, "licenseType"),
    licenseNumber: readString(formData, "licenseNumber"),
    issuingState: readString(formData, "issuingState"),
    licenseExpirationDate: readString(formData, "licenseExpirationDate"),
    insuranceStatus: existingProfile?.insuranceStatus ?? "Verification Pending",
    insuranceCompany: readString(formData, "insuranceCompany"),
    policyNumber: readString(formData, "policyNumber"),
    insuranceExpirationDate: readString(formData, "insuranceExpirationDate"),
    companyName: readString(formData, "companyName"),
    contactInfo: readString(formData, "contactInfo"),
    identityVerificationStatus: existingProfile?.identityVerificationStatus ?? "Verification Pending",
    backgroundCheckStatus: existingProfile?.backgroundCheckStatus ?? "Verification Pending",
    occupiedHomeEligibilityStatus: existingProfile?.occupiedHomeEligibilityStatus ?? "Verification Pending",
    safetyNotes: readString(formData, "safetyNotes"),
    licenseDocumentUploaded: readBoolean(formData, "licenseDocumentUploaded"),
    insuranceDocumentUploaded: readBoolean(formData, "insuranceDocumentUploaded"),
    businessRegistrationDocumentUploaded: readBoolean(formData, "businessRegistrationDocumentUploaded"),
    backgroundCheckDocumentUploaded: readBoolean(formData, "backgroundCheckDocumentUploaded"),
    identityVerificationDocumentUploaded: readBoolean(formData, "identityVerificationDocumentUploaded"),
    jobsAssignedCount: existingProfile?.jobsAssignedCount ?? 0,
    jobsAcceptedCount: existingProfile?.jobsAcceptedCount ?? 0,
    jobsCompletedCount: existingProfile?.jobsCompletedCount ?? 0,
    jobsDroppedCount: existingProfile?.jobsDroppedCount ?? 0,
    completionHistoryCount: existingProfile?.completionHistoryCount ?? 0,
    ratingPlaceholder: existingProfile?.ratingPlaceholder ?? "New vendor placeholder",
    profileCompleted: true,
  };
}

export async function saveVendorProfileAction(formData: FormData) {
  const session = await getSession();
  requireVendorSession(session);

  const categories = readCategories(formData);
  const serviceState = normalizeServiceState(readString(formData, "serviceState"));
  const serviceCities = filterValidServiceCities(serviceState, readServiceCities(formData));

  if (
    !readString(formData, "businessName") ||
    !readString(formData, "legalContactName") ||
    !readString(formData, "phone") ||
    categories.length === 0 ||
    !serviceState ||
    serviceCities.length === 0
  ) {
    redirect("/dashboard/vendor?error=missing-profile-fields");
  }

  const profile = buildVendorProfileInput(session.id, session.email, formData);
  upsertVendorProfile(profile);
  redirect("/dashboard/vendor?saved=1");
}

export async function vendorRequestAssignmentAction(formData: FormData) {
  const session = await getSession();
  requireVendorSession(session);

  const ticketId = readString(formData, "ticketId");
  vendorRequestTicket(ticketId, session.id);
  redirect("/dashboard/vendor?job=requested");
}

export async function vendorDeclineAssignmentAction(formData: FormData) {
  const session = await getSession();
  requireVendorSession(session);

  const ticketId = readString(formData, "ticketId");
  vendorDeclineTicket(ticketId, session.id);
  redirect("/dashboard/vendor?job=declined");
}

export async function vendorMarkArrivedAction(formData: FormData) {
  const session = await getSession();
  requireVendorSession(session);

  const ticketId = readString(formData, "ticketId");
  vendorMarkArrived(ticketId, session.id);
  redirect("/dashboard/vendor?job=arrived");
}

export async function vendorMarkInProgressAction(formData: FormData) {
  const session = await getSession();
  requireVendorSession(session);

  const ticketId = readString(formData, "ticketId");
  vendorMarkInProgress(ticketId, session.id);
  redirect("/dashboard/vendor?job=in-progress");
}

export async function vendorMarkCompletedAction(formData: FormData) {
  const session = await getSession();
  requireVendorSession(session);

  const ticketId = readString(formData, "ticketId");
  const completionNotes = readString(formData, "completionNotes");
  vendorMarkCompleted(ticketId, session.id, completionNotes);
  redirect("/dashboard/vendor?job=completed");
}

export async function vendorSubmitRepairApprovalRequestAction(formData: FormData) {
  const session = await getSession();
  requireVendorSession(session);

  const ticketId = readString(formData, "ticketId");
  const summary = readString(formData, "summary");
  const pricingItemValue = readString(formData, "pricingItem");
  const laborImpact = readString(formData, "laborImpact");
  const notes = readString(formData, "notes");
  const partCost = Number(readString(formData, "partCost") || "0");
  const pricingItem = pricingItemValue
    ? (pricingItemValue as CommonRepairPricingItem)
    : undefined;

  if (!summary || !laborImpact) {
    redirect("/dashboard/vendor?job=approval-missing");
  }

  vendorSubmitRepairApprovalRequest({
    ticketId,
    vendorUserId: session.id,
    summary,
    pricingItem,
    partCost,
    laborImpact,
    notes,
  });
  redirect("/dashboard/vendor?job=approval-requested");
}

export async function assignVendorAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const ticketId = readString(formData, "ticketId");
  const vendorUserId = readString(formData, "vendorUserId");
  const ticket = assignVendorToTicket({ ticketId, vendorUserId });
  const vendorUser = findUserById(vendorUserId);

  if (!ticket || !vendorUser) {
    redirect("/dashboard/landlord?vendor=assign-failed");
  }

  redirect(`/dashboard/landlord?vendor=assigned&ticket=${ticket.id}&assignedVendor=${vendorUserId}`);
}

export async function assignLandlordVendorAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const ticketId = readString(formData, "ticketId");
  const vendorName = readString(formData, "vendorName");
  const vendorContact = readString(formData, "vendorContact");
  const scheduledFor = readString(formData, "scheduledFor");
  const tenantNote = readString(formData, "tenantNote");

  if (!vendorName) {
    redirect(`/dashboard/landlord?vendor=own-vendor-missing&ticket=${ticketId}`);
  }

  const ticket = assignLandlordVendorToTicket({
    ticketId,
    vendorName,
    vendorContact,
    scheduledFor,
    tenantNote,
  });

  if (!ticket) {
    redirect("/dashboard/landlord?vendor=assign-failed");
  }

  redirect(`/dashboard/landlord?vendor=own-vendor-assigned&ticket=${ticket.id}`);
}

export async function landlordMarkOwnVendorArrivedAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const ticketId = readString(formData, "ticketId");
  const ticket = landlordMarkOwnVendorArrived({
    landlordId: session.id,
    ticketId,
  });

  if (!ticket) {
    redirect("/dashboard/landlord?vendor=own-vendor-status-failed");
  }

  redirect(`/dashboard/landlord?vendor=own-vendor-arrived&ticket=${ticket.id}`);
}

export async function landlordMarkOwnVendorCompletedAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const ticketId = readString(formData, "ticketId");
  const completionNotes = readString(formData, "completionNotes");
  const ticket = landlordMarkOwnVendorWorkCompleted({
    landlordId: session.id,
    ticketId,
    completionNotes,
  });

  if (!ticket) {
    redirect("/dashboard/landlord?vendor=own-vendor-status-failed");
  }

  redirect(`/dashboard/landlord?vendor=own-vendor-completed&ticket=${ticket.id}`);
}

export async function declineVendorRequestAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const ticketId = readString(formData, "ticketId");
  const vendorUserId = readString(formData, "vendorUserId");
  const ticket = landlordDeclineVendorRequest(ticketId, vendorUserId);

  if (!ticket) {
    redirect("/dashboard/landlord?vendor=assign-failed");
  }

  redirect(`/dashboard/landlord?vendor=declined&ticket=${ticket.id}`);
}

async function requireLandlordSession() {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  return session;
}

export async function landlordApproveRepairRequestAction(formData: FormData) {
  await requireLandlordSession();

  const ticketId = readString(formData, "ticketId");
  const reviewNotes = readString(formData, "reviewNotes");
  landlordReviewRepairApproval({
    ticketId,
    decision: "Approved",
    reviewNotes,
  });
  redirect("/dashboard/landlord?repair=approved");
}

export async function landlordDeclineRepairRequestAction(formData: FormData) {
  await requireLandlordSession();

  const ticketId = readString(formData, "ticketId");
  const reviewNotes = readString(formData, "reviewNotes");
  landlordReviewRepairApproval({
    ticketId,
    decision: "Declined",
    reviewNotes,
  });
  redirect("/dashboard/landlord?repair=declined");
}

export async function landlordRequestRepairFollowUpAction(formData: FormData) {
  await requireLandlordSession();

  const ticketId = readString(formData, "ticketId");
  const reviewNotes = readString(formData, "reviewNotes");
  landlordReviewRepairApproval({
    ticketId,
    decision: "Request follow-up",
    reviewNotes,
  });
  redirect("/dashboard/landlord?repair=follow-up");
}

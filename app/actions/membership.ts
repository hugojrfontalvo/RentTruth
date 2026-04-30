"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import {
  clearTenantPropertyMembership,
  findPropertyById,
  findPropertyByJoinCode,
  findPropertyBySavedAddress,
  findUserById,
  flushPersistentStore,
  formatTenantAddress,
  isValidNormalizedZip,
  normalizeZipCode,
  propertyTypeRequiresUnit,
  resetPropertyJoinCode,
  saveTenantAddress,
  setTenantMembershipRequest,
  updateTenantMembershipStatus,
} from "@/lib/demo-data";
import type { PropertyType } from "@/lib/demo-data";

function requireLandlordSession(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "landlord") {
    redirect("/login");
  }
}

export async function approveTenantAction(formData: FormData) {
  const session = await getSession();
  requireLandlordSession(session);

  const tenantUserId = String(formData.get("tenantUserId") ?? "");
  const tenant = findUserById(tenantUserId);

  if (!tenant || tenant.role !== "tenant") {
    redirect("/dashboard/landlord");
  }

  const property = tenant.propertyId ? findPropertyById(tenant.propertyId) : null;

  if (property && propertyTypeRequiresUnit(property.propertyType) && !tenant.unitNumber) {
    redirect("/dashboard/landlord?membership=unit-required");
  }

  updateTenantMembershipStatus(tenantUserId, "Approved");
  await flushPersistentStore();
  redirect("/dashboard/landlord?membership=approved");
}

export async function denyTenantAction(formData: FormData) {
  const session = await getSession();
  requireLandlordSession(session);

  const tenantUserId = String(formData.get("tenantUserId") ?? "");
  const tenant = findUserById(tenantUserId);

  if (!tenant || tenant.role !== "tenant") {
    redirect("/dashboard/landlord");
  }

  updateTenantMembershipStatus(tenantUserId, "Denied");
  await flushPersistentStore();
  redirect("/dashboard/landlord?membership=denied");
}

export async function removeTenantAction(formData: FormData) {
  const session = await getSession();
  requireLandlordSession(session);

  const tenantUserId = String(formData.get("tenantUserId") ?? "");
  const tenant = findUserById(tenantUserId);

  if (!tenant || tenant.role !== "tenant") {
    redirect("/dashboard/landlord");
  }

  clearTenantPropertyMembership(tenantUserId, "Removed");
  await flushPersistentStore();
  redirect("/dashboard/landlord?membership=removed");
}

export async function markTenantMovedOutAction(formData: FormData) {
  const session = await getSession();
  requireLandlordSession(session);

  const tenantUserId = String(formData.get("tenantUserId") ?? "");
  const tenant = findUserById(tenantUserId);

  if (!tenant || tenant.role !== "tenant") {
    redirect("/dashboard/landlord");
  }

  clearTenantPropertyMembership(tenantUserId, "Left Property");
  await flushPersistentStore();
  redirect("/dashboard/landlord?membership=moved-out");
}

export async function tenantLeavePropertyAction() {
  const session = await getSession();

  if (!session || session.role !== "tenant") {
    redirect("/login");
  }

  if (!session.id) {
    redirect("/dashboard/tenant");
  }

  clearTenantPropertyMembership(session.id, "Left Property");
  await flushPersistentStore();
  redirect("/dashboard/tenant?membership=left");
}

export async function requestTenantPropertyJoinAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "tenant") {
    redirect("/login");
  }

  const intent = String(formData.get("intent") ?? "verify-join").trim();
  const streetAddress = String(formData.get("streetAddress") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim().toUpperCase();
  const zip = normalizeZipCode(String(formData.get("zip") ?? ""));
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const joinCode = String(formData.get("joinCode") ?? "").trim().toUpperCase();
  const unitNumber = String(formData.get("unitNumber") ?? "").trim().toUpperCase();
  const savedPropertyType = String(formData.get("savedPropertyType") ?? "").trim() as PropertyType;
  const normalizedSavedPropertyType =
    savedPropertyType &&
    ["House", "Apartment", "Condo", "Townhome", "Multi-unit building"].includes(
      savedPropertyType,
    )
      ? savedPropertyType
      : "Apartment";

  const savedAddressRecord =
    session.savedStreetAddress &&
    session.savedCity &&
    session.savedState &&
    session.savedZip &&
    session.savedPropertyType
      ? {
          streetAddress: session.savedStreetAddress,
          city: session.savedCity,
          state: session.savedState,
          zip: session.savedZip,
          propertyType: session.savedPropertyType,
          unitNumber: session.unitNumber,
        }
      : null;

  if (intent === "save-address") {
    if (!streetAddress || !city || !state || !zip) {
      redirect("/dashboard/tenant?joinError=address-required");
    }

    if (!isValidNormalizedZip(zip)) {
      redirect("/dashboard/tenant?joinError=zip-invalid");
    }

    if (propertyTypeRequiresUnit(normalizedSavedPropertyType) && !unitNumber) {
      redirect("/dashboard/tenant?joinError=unit-required");
    }

    saveTenantAddress(session.id, {
      streetAddress,
      city,
      state,
      zip,
      propertyType: normalizedSavedPropertyType,
      unitNumber: propertyTypeRequiresUnit(normalizedSavedPropertyType) ? unitNumber : undefined,
    });
    await flushPersistentStore();
    redirect("/dashboard/tenant?membership=address-saved");
  }

  const currentAddress =
    streetAddress && city && state && zip
      ? {
          streetAddress,
          city,
          state,
          zip,
          propertyType: normalizedSavedPropertyType,
          unitNumber: unitNumber || savedAddressRecord?.unitNumber,
        }
      : savedAddressRecord;

  const selectedPropertyByAddress =
    (propertyId ? findPropertyById(propertyId) : null) ??
    (currentAddress ? findPropertyBySavedAddress(currentAddress) : null);
  const propertyFromJoinCode = joinCode ? findPropertyByJoinCode(joinCode) : null;

  if (!currentAddress) {
    redirect("/dashboard/tenant?joinError=address-required");
  }

  if (!isValidNormalizedZip(currentAddress.zip)) {
    redirect("/dashboard/tenant?joinError=zip-invalid");
  }

  if (!propertyFromJoinCode) {
    redirect("/dashboard/tenant?joinError=invalid-join-code");
  }

  const requestedUnitNumber = unitNumber || currentAddress.unitNumber || "";
  const joinCodeAddressMatches =
    propertyFromJoinCode.streetAddress.trim().toLowerCase() ===
      currentAddress.streetAddress.trim().toLowerCase() &&
    propertyFromJoinCode.city.trim().toLowerCase() === currentAddress.city.trim().toLowerCase() &&
    propertyFromJoinCode.state.trim().toLowerCase() === currentAddress.state.trim().toLowerCase() &&
    normalizeZipCode(propertyFromJoinCode.zip) === normalizeZipCode(currentAddress.zip) &&
    (!propertyFromJoinCode.unitNumber ||
      !requestedUnitNumber ||
      propertyFromJoinCode.unitNumber.trim().toUpperCase() === requestedUnitNumber);

  if (!selectedPropertyByAddress || propertyFromJoinCode.id !== selectedPropertyByAddress.id) {
    if (!joinCodeAddressMatches) {
      redirect("/dashboard/tenant?joinError=join-code-address-mismatch");
    }
  }

  if (propertyTypeRequiresUnit(propertyFromJoinCode.propertyType) && !requestedUnitNumber) {
    redirect("/dashboard/tenant?joinError=unit-required");
  }

  if (
    propertyFromJoinCode.unitNumber &&
    requestedUnitNumber &&
    propertyFromJoinCode.unitNumber.trim().toUpperCase() !== requestedUnitNumber
  ) {
    redirect("/dashboard/tenant?joinError=join-code-address-mismatch");
  }

  setTenantMembershipRequest({
    userId: session.id,
    propertyId: propertyFromJoinCode.id,
    savedAddress: formatTenantAddress(currentAddress),
    savedStreetAddress: currentAddress.streetAddress,
    savedCity: currentAddress.city,
    savedState: currentAddress.state,
    savedZip: currentAddress.zip,
    savedPropertyType: propertyFromJoinCode.propertyType,
    unitNumber: propertyTypeRequiresUnit(propertyFromJoinCode.propertyType)
      ? requestedUnitNumber
      : undefined,
    requestedAt: "Today",
  });
  await flushPersistentStore();

  redirect("/dashboard/tenant?membership=requested");
}

export async function resetJoinCodeAction(formData: FormData) {
  const session = await getSession();
  requireLandlordSession(session);

  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const property = resetPropertyJoinCode(propertyId);

  if (!property) {
    redirect("/dashboard/landlord");
  }
  await flushPersistentStore();

  redirect(`/dashboard/landlord?membership=code-reset&property=${property.id}`);
}

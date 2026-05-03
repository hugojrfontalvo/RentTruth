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
  getPropertyFullAddress,
  isValidNormalizedZip,
  isClosePropertyAddressMatch,
  normalizeZipCode,
  propertyAddressMatchesSavedAddress,
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
  const joinCode = String(formData.get("joinCode") ?? "").trim().toUpperCase();
  const unitNumber = String(formData.get("unitNumber") ?? "").trim().toUpperCase();
  const buildingNumber = String(formData.get("buildingNumber") ?? "").trim().toUpperCase();
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
          buildingNumber: session.buildingNumber,
        }
      : null;

  console.log("tenant address load started", {
    userId: session.id,
  });
  console.log(savedAddressRecord ? "tenant address loaded" : "tenant address missing", {
    userId: session.id,
    hasSavedAddress: Boolean(savedAddressRecord),
  });

  if (intent === "save-address") {
    console.log("tenant address save started", {
      userId: session.id,
      streetAddress,
      city,
      state,
      zip,
      propertyType: normalizedSavedPropertyType,
      hasUnit: Boolean(unitNumber),
      hasBuilding: Boolean(buildingNumber),
    });

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
      buildingNumber: propertyTypeRequiresUnit(normalizedSavedPropertyType)
        ? buildingNumber || undefined
        : undefined,
    });
    await flushPersistentStore();
    console.log("tenant address saved successfully", {
      userId: session.id,
      streetAddress,
      city,
      state,
      zip,
      propertyType: normalizedSavedPropertyType,
    });
    redirect("/dashboard/tenant?membership=address-saved");
  }

  const currentAddress = savedAddressRecord;

  const selectedPropertyByAddress =
    currentAddress ? findPropertyBySavedAddress(currentAddress) : null;
  console.log("join code lookup started", { joinCode, intent });
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

  console.log("join code valid", {
    joinCode,
    propertyId: propertyFromJoinCode.id,
  });

  const requestedUnitNumber = unitNumber || currentAddress.unitNumber || "";
  const requestedBuildingNumber = buildingNumber || currentAddress.buildingNumber || "";
  const joinCodeAddressMatches = propertyAddressMatchesSavedAddress(propertyFromJoinCode, {
    ...currentAddress,
    unitNumber: requestedUnitNumber,
    buildingNumber: requestedBuildingNumber,
  });

  if (intent === "use-landlord-address") {
    console.log("use landlord address clicked", {
      tenantUserId: session.id,
      joinCode,
    });
    const canUseSuggestedAddress = isClosePropertyAddressMatch(propertyFromJoinCode, currentAddress);

    if (!canUseSuggestedAddress) {
      redirect(`/dashboard/tenant?joinError=join-code-address-mismatch&joinCode=${joinCode}`);
    }

    const landlordAddress = {
      streetAddress: propertyFromJoinCode.streetAddress,
      city: propertyFromJoinCode.city,
      state: propertyFromJoinCode.state,
      zip: propertyFromJoinCode.zip,
      propertyType: propertyFromJoinCode.propertyType,
      unitNumber: propertyTypeRequiresUnit(propertyFromJoinCode.propertyType)
        ? propertyFromJoinCode.unitNumber || requestedUnitNumber
        : undefined,
      buildingNumber: propertyTypeRequiresUnit(propertyFromJoinCode.propertyType)
        ? propertyFromJoinCode.buildingNumber || requestedBuildingNumber || undefined
        : undefined,
    };

    console.log("tenant accepted landlord suggested address", {
      joinCode,
      propertyId: propertyFromJoinCode.id,
      landlordAddress: getPropertyFullAddress(propertyFromJoinCode),
      previousTenantAddress: formatTenantAddress(currentAddress),
    });

    saveTenantAddress(session.id, landlordAddress);
    await flushPersistentStore();
    setTenantMembershipRequest({
      userId: session.id,
      propertyId: propertyFromJoinCode.id,
      savedAddress: formatTenantAddress(landlordAddress),
      savedStreetAddress: landlordAddress.streetAddress,
      savedCity: landlordAddress.city,
      savedState: landlordAddress.state,
      savedZip: landlordAddress.zip,
      savedPropertyType: propertyFromJoinCode.propertyType,
      unitNumber: landlordAddress.unitNumber,
      buildingNumber: landlordAddress.buildingNumber,
      requestedAt: "Today",
    });
    await flushPersistentStore();
    console.log("approval created after address acceptance", {
      tenantUserId: session.id,
      propertyId: propertyFromJoinCode.id,
    });
    redirect("/dashboard/tenant?membership=requested");
  }

  if (!selectedPropertyByAddress || propertyFromJoinCode.id !== selectedPropertyByAddress.id) {
    if (!joinCodeAddressMatches) {
      const isCloseMatch = isClosePropertyAddressMatch(propertyFromJoinCode, currentAddress);
      console.log(isCloseMatch ? "address close mismatch" : "address mismatch", {
        joinCode,
        propertyId: propertyFromJoinCode.id,
        isCloseMatch,
        landlordAddress: getPropertyFullAddress(propertyFromJoinCode),
        tenantAddress: formatTenantAddress(currentAddress),
      });
      redirect(
        `/dashboard/tenant?joinError=${
          isCloseMatch ? "close-address-mismatch" : "suggest-landlord-address"
        }&joinCode=${joinCode}`,
      );
    }
  }

  if (propertyTypeRequiresUnit(propertyFromJoinCode.propertyType) && !requestedUnitNumber) {
    redirect("/dashboard/tenant?joinError=unit-required");
  }

  if (
    propertyFromJoinCode.unitNumber &&
    requestedUnitNumber &&
    !joinCodeAddressMatches
  ) {
    console.log("address close mismatch", {
      joinCode,
      propertyId: propertyFromJoinCode.id,
      isCloseMatch: true,
      landlordAddress: getPropertyFullAddress(propertyFromJoinCode),
      tenantAddress: formatTenantAddress(currentAddress),
    });
    redirect(`/dashboard/tenant?joinError=close-address-mismatch&joinCode=${joinCode}`);
  }

  console.log("address exact match", {
    joinCode,
    propertyId: propertyFromJoinCode.id,
  });

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
    buildingNumber: propertyTypeRequiresUnit(propertyFromJoinCode.propertyType)
      ? requestedBuildingNumber || propertyFromJoinCode.buildingNumber
      : undefined,
    requestedAt: "Today",
  });
  await flushPersistentStore();
  console.log("pending approval created", {
    tenantUserId: session.id,
    propertyId: propertyFromJoinCode.id,
  });

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

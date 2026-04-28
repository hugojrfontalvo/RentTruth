"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import {
  createPropertyForLandlord,
  isValidNormalizedZip,
  isPropertyType,
  landlordCloseTicket,
  normalizeZipCode,
  propertyTypeRequiresUnit,
  updatePropertyForLandlord,
} from "@/lib/demo-data";

export async function createPropertyAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const propertyTypeValue = String(formData.get("propertyType") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const streetAddress = String(formData.get("streetAddress") ?? "").trim();
  const unitNumber = String(formData.get("unitNumber") ?? "").trim().toUpperCase();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = normalizeZipCode(String(formData.get("zip") ?? ""));
  const unitCountRaw = String(formData.get("unitCount") ?? "").trim();
  const unitCountValue = unitCountRaw ? Number(unitCountRaw) : undefined;

  if (!isPropertyType(propertyTypeValue)) {
    redirect("/dashboard/landlord?error=property-type-required");
  }

  if (!streetAddress) {
    redirect("/dashboard/landlord?error=street-required");
  }

  if (propertyTypeRequiresUnit(propertyTypeValue) && !unitNumber) {
    redirect("/dashboard/landlord?error=unit-required");
  }

  if (!city) {
    redirect("/dashboard/landlord?error=city-required");
  }

  if (!state) {
    redirect("/dashboard/landlord?error=state-required");
  }

  if (!zip) {
    redirect("/dashboard/landlord?error=zip-required");
  }

  if (!isValidNormalizedZip(zip)) {
    redirect("/dashboard/landlord?error=zip-invalid");
  }

  if (
    propertyTypeValue !== "House" &&
    (!unitCountValue || Number.isNaN(unitCountValue) || unitCountValue <= 0)
  ) {
    redirect("/dashboard/landlord?error=unit-count-required");
  }

  const property = createPropertyForLandlord({
    landlordId: session.id,
    propertyType: propertyTypeValue,
    name: name || undefined,
    streetAddress,
    unitNumber: propertyTypeValue === "House" ? undefined : unitNumber,
    city,
    state,
    zip,
    unitCount: propertyTypeValue === "House" ? 1 : unitCountValue,
  });

  redirect(`/dashboard/landlord?created=1&property=${property.id}`);
}

export async function updatePropertyAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const propertyTypeValue = String(formData.get("propertyType") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const streetAddress = String(formData.get("streetAddress") ?? "").trim();
  const unitNumber = String(formData.get("unitNumber") ?? "").trim().toUpperCase();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const zip = normalizeZipCode(String(formData.get("zip") ?? ""));

  if (!propertyId) {
    redirect("/dashboard/landlord?edit=1&error=property-not-found");
  }

  if (!isPropertyType(propertyTypeValue)) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=property-type-required`);
  }

  if (!streetAddress) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=street-required`);
  }

  if (propertyTypeRequiresUnit(propertyTypeValue) && !unitNumber) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=unit-required`);
  }

  if (!city) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=city-required`);
  }

  if (!state) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=state-required`);
  }

  if (!zip) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=zip-required`);
  }

  if (!isValidNormalizedZip(zip)) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=zip-invalid`);
  }

  const property = updatePropertyForLandlord({
    landlordId: session.id,
    propertyId,
    propertyType: propertyTypeValue,
    name: name || undefined,
    streetAddress,
    unitNumber: propertyTypeValue === "House" ? undefined : unitNumber,
    city,
    state,
    zip,
  });

  if (!property) {
    redirect(`/dashboard/landlord?edit=1&property=${propertyId}&error=property-not-found`);
  }

  redirect(`/dashboard/landlord?updated=1&property=${property.id}&code=preserved`);
}

export async function landlordCloseTicketAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== "landlord") {
    redirect("/login");
  }

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();

  if (!paymentMethod) {
    redirect("/dashboard/landlord?review=payment-method-required");
  }

  landlordCloseTicket(ticketId, {
    reviewNotes,
    paymentMethod,
  });
  redirect("/dashboard/landlord?review=closed");
}

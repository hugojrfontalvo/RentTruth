"use client";

import { useState } from "react";
import type { JoinableProperty, SavedTenantAddress } from "@/components/tenant-join-types";

type TenantJoinFieldsClientProps = {
  initialSavedAddress?: SavedTenantAddress | null;
  properties: JoinableProperty[];
};

const tenantPropertyTypes: SavedTenantAddress["propertyType"][] = [
  "House",
  "Apartment",
  "Condo",
  "Townhome",
  "Multi-unit building",
];

function isTenantPropertyType(value: unknown): value is SavedTenantAddress["propertyType"] {
  return typeof value === "string" && tenantPropertyTypes.includes(value as SavedTenantAddress["propertyType"]);
}

function normalizePropertyType(value: unknown): SavedTenantAddress["propertyType"] {
  return isTenantPropertyType(value) ? value : "Apartment";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getPropertyLabel(property: JoinableProperty) {
  const streetAddress = normalizeText(property.streetAddress);
  const city = normalizeText(property.city);
  const state = normalizeText(property.state).toUpperCase();
  const zip = normalizeZip(property.zip);

  return [streetAddress, city, [state, zip].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

function propertyTypeRequiresUnit(propertyType: JoinableProperty["propertyType"] | SavedTenantAddress["propertyType"]) {
  return normalizePropertyType(propertyType) !== "House";
}

function normalizeAddress(value: unknown) {
  return normalizeText(value).replace(/\s+/g, " ").toLowerCase();
}

function normalizeZip(value: unknown) {
  return normalizeText(value).replace(/\D/g, "").slice(0, 5);
}

function formatAddress(input: SavedTenantAddress) {
  const propertyType = normalizePropertyType(input.propertyType);
  const unitSegment =
    propertyTypeRequiresUnit(propertyType) && normalizeText(input.unitNumber)
      ? `, Apt ${normalizeText(input.unitNumber).toUpperCase()}`
      : "";

  return `${normalizeText(input.streetAddress)}${unitSegment}, ${normalizeText(input.city)}, ${normalizeText(input.state).toUpperCase()} ${normalizeZip(input.zip)}`;
}

function getTenantPropertyTypeLabel(propertyType: SavedTenantAddress["propertyType"]) {
  if (propertyType === "House") {
    return "Single residence";
  }

  if (propertyType === "Multi-unit building") {
    return "Building";
  }

  return "Unit-based";
}

function getTenantPropertyTypeGridClass(
  propertyType: SavedTenantAddress["propertyType"],
) {
  return propertyType === "Multi-unit building" ? "col-span-2" : "";
}

function getTenantPropertyTypeCardClass(
  propertyType: SavedTenantAddress["propertyType"],
) {
  if (propertyType === "House" || propertyType === "Apartment") {
    return "border-sky-100 bg-sky-50/80 hover:border-sky-200 hover:bg-sky-50";
  }

  if (propertyType === "Condo" || propertyType === "Townhome") {
    return "border-emerald-100 bg-emerald-50/80 hover:border-emerald-200 hover:bg-emerald-50";
  }

  return "border-orange-100 bg-orange-50/80 hover:border-orange-200 hover:bg-orange-50";
}

function getSafeSavedAddress(address?: SavedTenantAddress | null): SavedTenantAddress | null {
  if (!address) {
    return null;
  }

  const streetAddress = normalizeText(address.streetAddress);
  const city = normalizeText(address.city);
  const state = normalizeText(address.state).toUpperCase();
  const zip = normalizeZip(address.zip);

  if (!streetAddress || !city || !state || !zip) {
    return null;
  }

  const propertyType = normalizePropertyType(address.propertyType);

  return {
    streetAddress,
    city,
    state,
    zip,
    propertyType,
    unitNumber: propertyTypeRequiresUnit(propertyType)
      ? normalizeText(address.unitNumber).toUpperCase() || undefined
      : undefined,
  };
}

function getSafeProperties(properties?: JoinableProperty[] | null): JoinableProperty[] {
  if (!Array.isArray(properties)) {
    return [];
  }

  return properties.reduce<JoinableProperty[]>((safeProperties, property) => {
      const id = normalizeText(property.id);
      const streetAddress = normalizeText(property.streetAddress);
      const city = normalizeText(property.city);
      const state = normalizeText(property.state).toUpperCase();
      const zip = normalizeZip(property.zip);
      const propertyType = normalizePropertyType(property.propertyType);

      if (!id || !streetAddress || !city || !state || !zip) {
        return safeProperties;
      }

      safeProperties.push({
        id,
        streetAddress,
        city,
        state,
        zip,
        propertyType,
        unitNumber: propertyTypeRequiresUnit(propertyType)
          ? normalizeText(property.unitNumber).toUpperCase() || undefined
          : undefined,
        name: normalizeText(property.name) || undefined,
      });

      return safeProperties;
    }, []);
}

export function TenantJoinFieldsClient({
  initialSavedAddress,
  properties,
}: TenantJoinFieldsClientProps) {
  const savedAddress = getSafeSavedAddress(initialSavedAddress);
  const safeProperties = getSafeProperties(properties);
  const defaultPropertyType = savedAddress?.propertyType ?? "Apartment";
  const [selectedPropertyType, setSelectedPropertyType] = useState<
    SavedTenantAddress["propertyType"]
  >(defaultPropertyType);
  const savedAddressLabel = savedAddress ? formatAddress(savedAddress) : "";
  const matchedSavedProperty = savedAddress
    ? safeProperties.find(
        (property) =>
          normalizeAddress(property.streetAddress) === normalizeAddress(savedAddress.streetAddress) &&
          (!property.unitNumber ||
            !savedAddress.unitNumber ||
            normalizeAddress(property.unitNumber) === normalizeAddress(savedAddress.unitNumber)) &&
          normalizeAddress(property.city) === normalizeAddress(savedAddress.city) &&
          normalizeAddress(property.state) === normalizeAddress(savedAddress.state) &&
          normalizeZip(property.zip) === normalizeZip(savedAddress.zip),
      ) ?? null
    : null;
  const effectivePropertyType = matchedSavedProperty?.propertyType ?? selectedPropertyType;
  const savedAddressStatus = savedAddress
    ? matchedSavedProperty
      ? "Ready for verification"
      : "Waiting for landlord property match"
    : "Address required";

  return (
    <>
      <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:rounded-[28px] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Step 1
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              Save your address
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Save your structured rental address first. RentTruth keeps this as your working
              address record, so later code verification happens against the saved record instead of
              making you re-enter everything.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
            {savedAddress ? "Address saved" : "Address required"}
          </div>
        </div>

        {savedAddress ? (
          <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Saved address record
                </p>
                <p className="mt-2 font-medium text-emerald-950">{savedAddressLabel}</p>
                <p className="mt-1 text-sm text-emerald-800">
                  {matchedSavedProperty
                    ? `Matched property found: ${matchedSavedProperty.name?.trim() || matchedSavedProperty.propertyType}`
                    : "We’re still waiting for a landlord-created property that matches this saved address."}
                </p>
              </div>
              <div className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800">
                {savedAddressStatus}
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-[24px] border border-white/60 bg-white/70 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Status
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{savedAddressStatus}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Saved property context
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {savedAddress.propertyType}
                  {propertyTypeRequiresUnit(savedAddress.propertyType)
                    ? savedAddress.unitNumber
                      ? ` · Unit ${savedAddress.unitNumber}`
                      : " · Unit needed"
                    : " · No unit needed"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Next step
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {matchedSavedProperty
                    ? "Use Add Join Code to verify this saved address with the landlord-provided code."
                    : "Keep this address saved. When the landlord creates the property and shares a code, come back and add only the code here."}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#add-join-code"
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Add Join Code
              </a>
              <a
                href="#edit-address"
                className="rounded-full border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-400"
              >
                Edit Address
              </a>
            </div>
          </div>
        ) : null}

        <div className="rounded-[22px] border border-slate-200 bg-white p-4 sm:rounded-[24px]">
          <div className="grid gap-5 md:grid-cols-[0.62fr_0.38fr]">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Street address</span>
              <input
                type="text"
                name="streetAddress"
                defaultValue={savedAddress?.streetAddress ?? ""}
                placeholder="9646 SW 151st Street"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            {propertyTypeRequiresUnit(selectedPropertyType) ? (
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Apartment / Unit number
                </span>
                <input
                  type="text"
                  name="unitNumber"
                  defaultValue={savedAddress?.unitNumber ?? ""}
                  placeholder="4B"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  Unit number is required for this property type.
                </span>
              </label>
            ) : (
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800 md:col-span-2">
                House selected. No apartment or unit number is required.
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
              <input
                type="text"
                name="city"
                defaultValue={savedAddress?.city ?? ""}
                placeholder="Miami"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
                <input
                  type="text"
                  name="state"
                  defaultValue={savedAddress?.state ?? ""}
                  placeholder="FL"
                  maxLength={2}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">ZIP</span>
                <input
                  type="text"
                  name="zip"
                  defaultValue={savedAddress ? normalizeZip(savedAddress.zip) : ""}
                  placeholder="33133"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{5}(-[0-9]{4})?"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
                <span className="mt-2 block text-xs leading-5 text-slate-500">
                  ZIP+4 is okay. RentTruth saves the first 5 digits.
                </span>
              </label>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {tenantPropertyTypes.map((propertyType) => (
              <label
                key={propertyType}
                className={`block cursor-pointer ${getTenantPropertyTypeGridClass(propertyType)}`}
              >
                <input
                  type="radio"
                  name="savedPropertyType"
                  value={propertyType}
                  checked={selectedPropertyType === propertyType}
                  onChange={() => setSelectedPropertyType(propertyType)}
                  className="peer sr-only"
                />
                <div className={`min-h-[88px] rounded-[22px] border p-3.5 text-slate-700 transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-slate-200/70 peer-checked:[&_p:last-child]:text-white/70 sm:rounded-[24px] sm:p-4 ${getTenantPropertyTypeCardClass(propertyType)}`}>
                  <p className="font-display text-base font-semibold sm:text-lg">{propertyType}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                    {getTenantPropertyTypeLabel(propertyType)}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Select House to remove the unit requirement, or choose a unit-based property type to require it.
          </p>

          <div className="mt-5 grid gap-3 sm:flex sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              Save these address fields once. You can also correct the residence type here if you
              originally set it up like an apartment and later learn it should behave like a house.
            </p>
            <button
              type="submit"
              name="intent"
              value="save-address"
              className="min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
            >
              {savedAddress ? "Update saved address" : "Save address"}
            </button>
          </div>
        </div>

        {safeProperties.length > 0 ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">
                Current landlord-created property helpers
              </p>
              <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                Helper list only. Your saved address remains the source of truth.
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {safeProperties.slice(0, 6).map((property) => (
                <div
                  key={property.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{getPropertyLabel(property)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {property.name?.trim() || property.propertyType}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {property.propertyType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div
        id="add-join-code"
        className={`rounded-[28px] border p-5 transition ${
          savedAddress
            ? "border-slate-200 bg-white"
            : "border-slate-200 bg-slate-50/80 opacity-70"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Step 2
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              Confirm with your landlord code
            </h3>
          </div>
          <div
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              savedAddress
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {savedAddress
              ? matchedSavedProperty
                ? "Ready for code verification"
                : "Waiting for landlord property match"
              : "Complete step 1 first"}
          </div>
        </div>

        <input type="hidden" name="propertyId" value={matchedSavedProperty?.id ?? ""} />

        <div className="mt-5 grid gap-5 md:grid-cols-[0.64fr_0.36fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Landlord join code</span>
            <input
              type="text"
              name="joinCode"
              placeholder={
                savedAddress
                  ? "Enter the landlord-provided join code"
                  : "Save your address first to verify the code"
              }
              required
              disabled={!savedAddress}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          {effectivePropertyType && propertyTypeRequiresUnit(effectivePropertyType) ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-7 text-sky-800">
              {savedAddress?.unitNumber
                ? `RentTruth will verify this code for Unit ${savedAddress.unitNumber}. Edit the saved address above if the unit is wrong.`
                : "Add your apartment or unit number in Step 1 before requesting access."}
            </div>
          ) : effectivePropertyType ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
              This saved address is set as a house or single residence, so you do not need a unit
              number.
            </div>
          ) : savedAddress ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-500">
              Your address is already saved. Once a landlord property matches it, RentTruth will use
              that saved address automatically when you enter the join code.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-500">
              We’ll only ask for a unit number if the saved address or matched property type needs
              one.
            </div>
          )}
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          This verification step stays attached to your saved address record above. When your
          landlord shares a code later, you can come back here, add only the code, and RentTruth
          will check it against the saved address automatically.
        </p>

        <button
          type="submit"
          name="intent"
          value="verify-join"
          disabled={!savedAddress}
          className="mt-5 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0"
        >
          Request Property Access
        </button>
      </div>
    </>
  );
}

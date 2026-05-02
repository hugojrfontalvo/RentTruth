"use client";

import { useState } from "react";
import type { AddressSuggestion, Property, PropertyType } from "@/lib/demo-data";
import { GoogleAddressAutocomplete } from "@/components/google-address-autocomplete";

type LandlordPropertyFormProps = {
  createPropertyAction: (formData: FormData) => void | Promise<void>;
  propertyTypes: PropertyType[];
  suggestions: AddressSuggestion[];
  errorMessage?: string | null;
  submitLabel?: string;
  initialValues?: Pick<
    Property,
    "id" | "name" | "propertyType" | "streetAddress" | "unitNumber" | "buildingNumber" | "city" | "state" | "zip" | "unitCount"
  > | null;
  hideUnitCountField?: boolean;
};

export function LandlordPropertyForm({
  createPropertyAction,
  propertyTypes,
  errorMessage,
  submitLabel = "Create Property",
  initialValues = null,
}: LandlordPropertyFormProps) {
  const defaultPropertyType = initialValues?.propertyType ?? "Apartment";
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType>(defaultPropertyType);
  const helperValue = initialValues
    ? `${initialValues.streetAddress}, ${initialValues.city}, ${initialValues.state} ${initialValues.zip}`
    : "";

  function normalizeZip(value: string) {
    return value.replace(/\D/g, "").slice(0, 5);
  }

  function getPropertyTypeGridClass(type: PropertyType) {
    return type === "Multi-unit building" ? "col-span-2" : "";
  }

  function getPropertyTypeCardClass(type: PropertyType) {
    if (type === "House" || type === "Apartment") {
      return "border-sky-100 bg-sky-50/80 hover:border-sky-200 hover:bg-sky-50";
    }

    if (type === "Condo" || type === "Townhome") {
      return "border-emerald-100 bg-emerald-50/80 hover:border-emerald-200 hover:bg-emerald-50";
    }

    return "border-orange-100 bg-orange-50/80 hover:border-orange-200 hover:bg-orange-50";
  }

  return (
    <form action={createPropertyAction} className="mt-6 space-y-5">
      {initialValues?.id ? (
        <input type="hidden" name="propertyId" value={initialValues.id} />
      ) : null}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Create Property Address
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
          Property type and address
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose the property type first, then use Google address suggestions or the manual fields below.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Building or property name</span>
        <input
          type="text"
          name="name"
          defaultValue={initialValues?.name ?? ""}
          placeholder="Harbor House"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      {errorMessage ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-3">
        <span className="text-sm font-semibold text-slate-700">Property type / unit info</span>
        <div className="grid grid-cols-2 gap-3">
          {propertyTypes.map((type) => (
            <label
              key={type}
              className={`block cursor-pointer ${getPropertyTypeGridClass(type)}`}
            >
              <input
                type="radio"
                name="propertyType"
                value={type}
                checked={selectedPropertyType === type}
                onChange={() => setSelectedPropertyType(type)}
                className="peer sr-only"
              />
              <div className={`min-h-[88px] rounded-[22px] border p-3.5 text-slate-700 transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-slate-200/70 peer-checked:[&_p:last-child]:text-white/70 sm:rounded-[24px] sm:p-4 ${getPropertyTypeCardClass(type)}`}>
                <p className="font-display text-base font-semibold sm:text-lg">{type}</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm">
                  {type === "House"
                    ? "Single residence"
                    : type === "Multi-unit building"
                      ? "Building"
                      : "Unit-based"}
                </p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-sm leading-6 text-slate-500">
          {selectedPropertyType === "House"
            ? "House selected. No apartment or unit number is required."
            : "Unit number can be added here if you manage a specific unit. Tenants still provide their exact unit during approval."}
        </p>
      </div>

      <GoogleAddressAutocomplete initialValue={helperValue} />

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Building / property street address</span>
        <input
          type="text"
          name="streetAddress"
          defaultValue={initialValues?.streetAddress ?? ""}
          placeholder="271 Maple Street"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      {selectedPropertyType !== "House" ? (
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Apartment / Unit <span className="font-normal text-slate-400">(optional)</span></span>
            <input
              type="text"
              name="unitNumber"
              defaultValue={initialValues?.unitNumber ?? ""}
              placeholder="303"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Building <span className="font-normal text-slate-400">(optional)</span></span>
            <input
              type="text"
              name="buildingNumber"
              defaultValue={initialValues?.buildingNumber ?? ""}
              placeholder="4"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <span className="text-xs leading-5 text-slate-500 md:col-span-2">
            Optional for landlord setup. Tenants provide their exact unit/building when they request access.
          </span>
        </div>
      ) : (
        <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800">
          House selected. No apartment or unit number is required.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-[1fr_0.34fr_0.5fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
          <input
            type="text"
            name="city"
            defaultValue={initialValues?.city ?? ""}
            placeholder="Jersey City"
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
          <input
            type="text"
            name="state"
            maxLength={2}
            defaultValue={initialValues?.state ?? ""}
            placeholder="NJ"
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">ZIP</span>
          <input
            type="text"
            name="zip"
            defaultValue={initialValues?.zip ? normalizeZip(initialValues.zip) : ""}
            placeholder="07304"
            required
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{5}(-[0-9]{4})?"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <span className="mt-2 block text-xs leading-5 text-slate-500">
            ZIP+4 is okay. RentTruth saves the first 5 digits.
          </span>
        </label>
      </div>

      <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800">
        RentTruth generates the tenant join code after this property is saved. Tenants add their own unit number when requesting access.
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}

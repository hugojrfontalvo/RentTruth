"use client";

import { useState } from "react";
import type { AddressSuggestion, Property, PropertyType } from "@/lib/demo-data";

type LandlordPropertyFormProps = {
  createPropertyAction: (formData: FormData) => void | Promise<void>;
  propertyTypes: PropertyType[];
  suggestions: AddressSuggestion[];
  errorMessage?: string | null;
  submitLabel?: string;
  initialValues?: Pick<
    Property,
    "id" | "name" | "propertyType" | "streetAddress" | "unitNumber" | "city" | "state" | "zip" | "unitCount"
  > | null;
  hideUnitCountField?: boolean;
};

export function LandlordPropertyForm({
  createPropertyAction,
  propertyTypes,
  suggestions,
  errorMessage,
  submitLabel = "Create Property",
  initialValues = null,
  hideUnitCountField = false,
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
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Apartment / Unit number</span>
          <input
            type="text"
            name="unitNumber"
            defaultValue={initialValues?.unitNumber ?? ""}
            placeholder="4B"
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <span className="mt-2 block text-xs leading-5 text-slate-500">
            Unit number is required for this property type.
          </span>
        </label>
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

      <div className="grid gap-3">
        <span className="text-sm font-semibold text-slate-700">Property type</span>
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
          Select House to remove the unit requirement, or choose a unit-based property type to require it.
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Address helper
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Google-style autocomplete is not connected yet. The fields above are the real source
              of truth, and this helper only previews demo suggestions for the future workflow.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
            Manual entry is live
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Helper preview
          </span>
          <input
            type="text"
            defaultValue={helperValue}
            list="landlord-address-suggestions"
            placeholder="Preview future autocomplete behavior"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <datalist id="landlord-address-suggestions">
          {suggestions.map((suggestion) => (
            <option key={suggestion.id} value={suggestion.label} />
          ))}
        </datalist>

        <div className="mt-4 grid gap-2">
          {suggestions.slice(0, 4).map((suggestion) => (
            <div
              key={suggestion.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700"
            >
              <p>{suggestion.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                Demo suggestion
              </p>
            </div>
          ))}
        </div>
      </div>

      {!hideUnitCountField ? (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">How many apartments or residences are in this property?</span>
          <input
            type="number"
            min="1"
            name="unitCount"
            defaultValue={initialValues?.unitCount ?? ""}
            placeholder="24"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
          <p className="mt-2 text-sm leading-6 text-slate-500">
            For houses, you can leave this blank. For apartments, condos, townhomes, and multi-unit buildings, this describes the property capacity. Tenants still enter their own apartment/unit number when joining.
          </p>
        </label>
      ) : (
        <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-800">
          Houses are treated as a single residence, so tenants won’t be asked for a unit number later.
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}

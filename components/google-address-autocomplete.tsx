"use client";

import { useEffect, useRef, useState } from "react";

type GoogleAddressAutocompleteProps = {
  initialValue?: string;
};

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GooglePlaceResult = {
  address_components?: GoogleAddressComponent[];
};

type GoogleAutocomplete = {
  addListener: (eventName: "place_changed", callback: () => void) => void;
  getPlace: () => GooglePlaceResult;
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              fields?: string[];
              types?: string[];
              componentRestrictions?: { country: string | string[] };
            },
          ) => GoogleAutocomplete;
        };
      };
    };
  }
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
let googleMapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve();
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        "script[data-renttruth-google-places='true']",
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Google Places script failed to load.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        googleMapsApiKey ?? "",
      )}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.renttruthGooglePlaces = "true";
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error("Google Places script failed to load.")), {
        once: true,
      });
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
}

function componentValue(components: GoogleAddressComponent[], type: string, useShortName = false) {
  const match = components.find((component) => component.types.includes(type));
  return useShortName ? match?.short_name ?? "" : match?.long_name ?? "";
}

function setFormValue(fieldName: string, value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`);

  if (!input) {
    return;
  }

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function GoogleAddressAutocomplete({ initialValue = "" }: GoogleAddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "manual">(
    googleMapsApiKey ? "idle" : "manual",
  );

  useEffect(() => {
    if (!googleMapsApiKey || !inputRef.current) {
      setStatus("manual");
      return;
    }

    let isMounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!isMounted || !inputRef.current || !window.google?.maps?.places?.Autocomplete) {
          return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["address_components"],
          types: ["address"],
        });

        autocomplete.addListener("place_changed", () => {
          const components = autocomplete.getPlace().address_components ?? [];
          const streetNumber = componentValue(components, "street_number");
          const route = componentValue(components, "route");
          const streetAddress = [streetNumber, route].filter(Boolean).join(" ").trim();
          const city =
            componentValue(components, "locality") ||
            componentValue(components, "sublocality") ||
            componentValue(components, "postal_town") ||
            componentValue(components, "administrative_area_level_2");
          const state = componentValue(components, "administrative_area_level_1", true);
          const zip = componentValue(components, "postal_code").replace(/\D/g, "").slice(0, 5);

          if (streetAddress) setFormValue("streetAddress", streetAddress);
          if (city) setFormValue("city", city);
          if (state) setFormValue("state", state);
          if (zip) setFormValue("zip", zip);
        });

        setStatus("ready");
      })
      .catch(() => {
        if (isMounted) {
          setStatus("manual");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Address autocomplete
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-900/75">
            {status === "ready"
              ? "Start typing a real property address. Selecting a suggestion fills the manual fields below."
              : "Google address suggestions are not connected in this environment. Use the manual fields below."}
          </p>
        </div>
        <span className="rounded-full border border-white/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          {status === "ready" ? "Live suggestions" : "Manual fallback"}
        </span>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Search property address</span>
        <input
          ref={inputRef}
          type="text"
          defaultValue={initialValue}
          disabled={status === "manual"}
          placeholder={status === "ready" ? "Start typing an address" : "Manual entry is active below"}
          className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-white/70 disabled:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        />
      </label>
    </div>
  );
}

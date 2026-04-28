"use client";

import { useMemo, useState } from "react";
import {
  getServiceCitiesForState,
  serviceStates,
} from "@/lib/service-areas";

type VendorServiceAreaFieldsProps = {
  initialState?: string;
  initialCities?: string[];
};

export function VendorServiceAreaFields({
  initialState = "FL",
  initialCities = [],
}: VendorServiceAreaFieldsProps) {
  const [selectedState, setSelectedState] = useState(initialState || "FL");
  const [selectedCities, setSelectedCities] = useState(() => {
    const allowed = new Set(
      getServiceCitiesForState(initialState || "FL").map((city) => city.toLowerCase()),
    );

    return initialCities.filter((city) => allowed.has(city.toLowerCase()));
  });
  const [citySearch, setCitySearch] = useState("");
  const stateCities = getServiceCitiesForState(selectedState);
  const filteredCities = useMemo(() => {
    const query = citySearch.trim().toLowerCase();

    if (!query) {
      return stateCities;
    }

    return stateCities.filter((city) => city.toLowerCase().includes(query));
  }, [citySearch, stateCities]);
  const structuredServiceArea =
    selectedState && selectedCities.length > 0
      ? `${selectedState}: ${selectedCities.join(", ")}`
      : "";

  function handleStateChange(nextState: string) {
    setSelectedState(nextState);
    setSelectedCities([]);
    setCitySearch("");
  }

  function toggleCity(city: string) {
    setSelectedCities((currentCities) =>
      currentCities.includes(city)
        ? currentCities.filter((entry) => entry !== city)
        : [...currentCities, city],
    );
  }

  function removeCity(city: string) {
    setSelectedCities((currentCities) => currentCities.filter((entry) => entry !== city));
  }

  return (
    <section className="rounded-[28px] border border-orange-100 bg-orange-50/60 p-5">
      <input type="hidden" name="serviceArea" value={structuredServiceArea} />

      {selectedCities.map((city) => (
        <input key={`selected-city-${city}`} type="hidden" name="serviceCities" value={city} />
      ))}

      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-900">
        Service area
      </p>
      <p className="mt-2 text-sm leading-6 text-orange-900/70">
        Choose the cities where you accept jobs.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
          <select
            name="serviceState"
            value={selectedState}
            onChange={(event) => handleStateChange(event.target.value)}
            required
            className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          >
            {serviceStates.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Cities served
          </span>
          <input
            type="search"
            value={citySearch}
            onChange={(event) => setCitySearch(event.target.value)}
            placeholder="Search cities"
            className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCities.length > 0 ? (
              selectedCities.map((city) => (
                <button
                  key={`chip-${city}`}
                  type="button"
                  onClick={() => removeCity(city)}
                  className="rounded-full border border-orange-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-900 transition hover:border-orange-300 hover:bg-orange-50"
                  aria-label={`Remove ${city}`}
                >
                  {city} x
                </button>
              ))
            ) : (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
                Select at least one city
              </span>
            )}
          </div>

          <div className="mt-4 max-h-[360px] overflow-y-auto rounded-[22px] border border-orange-100 bg-white/70 p-3">
            {filteredCities.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredCities.map((city) => {
                  const checked = selectedCities.includes(city);

                  return (
                    <button
                      key={`${selectedState}-${city}`}
                      type="button"
                      onClick={() => toggleCity(city)}
                      className={`flex min-h-[48px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        checked
                          ? "border-orange-300 bg-orange-50 text-orange-950 shadow-sm"
                          : "border-orange-100 bg-white text-slate-700 hover:border-orange-200"
                      }`}
                    >
                      <span>{city}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                          checked
                            ? "border-orange-400 bg-orange-500 text-white"
                            : "border-slate-300 text-transparent"
                        }`}
                      >
                        ok
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-4 py-5 text-sm leading-6 text-slate-500">
                No city list is loaded for this state yet. Choose Florida for the full MVP city list.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

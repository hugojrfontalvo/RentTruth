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

type GooglePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: {
      input: string;
      componentRestrictions?: { country: string | string[] };
      types?: string[];
    },
    callback: (predictions: GooglePrediction[] | null, status: string) => void,
  ) => void;
};

type GooglePlacesService = {
  getDetails: (
    request: {
      placeId: string;
      fields: string[];
    },
    callback: (place: GooglePlaceResult | null, status: string) => void,
  ) => void;
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          AutocompleteService: new () => GoogleAutocompleteService;
          PlacesService: new (container: HTMLDivElement) => GooglePlacesService;
          PlacesServiceStatus?: {
            OK?: string;
            ZERO_RESULTS?: string;
            REQUEST_DENIED?: string;
            OVER_QUERY_LIMIT?: string;
            INVALID_REQUEST?: string;
          };
        };
      };
    };
    __renttruthGoogleMapsLoaded?: () => void;
  }
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_SCRIPT_TIMEOUT_MS = 8000;
const GOOGLE_PREDICTION_TIMEOUT_MS = 5000;
let googleMapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.maps?.places?.AutocompleteService && window.google.maps.places.PlacesService) {
    console.log("RentTruth Google script already loaded; Places library available.");
    return Promise.resolve();
  }

  if (!googleMapsApiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
      let didFinish = false;
      const finish = (error?: Error) => {
        if (didFinish) return;
        didFinish = true;
        window.clearTimeout(timeoutId);
        delete window.__renttruthGoogleMapsLoaded;

        if (error) {
          reject(error);
          return;
        }

        if (window.google?.maps?.places?.AutocompleteService && window.google.maps.places.PlacesService) {
          console.log("RentTruth Google script loaded; Places library available.");
          resolve();
        } else {
          reject(new Error("Google Places library did not initialize."));
        }
      };

      const timeoutId = window.setTimeout(() => {
        finish(new Error("Google Places script timed out."));
      }, GOOGLE_SCRIPT_TIMEOUT_MS);

      window.__renttruthGoogleMapsLoaded = () => finish();

      const existingScript = document.querySelector<HTMLScriptElement>(
        "script[data-renttruth-google-places='true']",
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => finish(), { once: true });
        existingScript.addEventListener("error", () => finish(new Error("Google Places script failed to load.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: googleMapsApiKey,
        libraries: "places",
        v: "weekly",
        loading: "async",
        callback: "__renttruthGoogleMapsLoaded",
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.dataset.renttruthGooglePlaces = "true";
      script.addEventListener("error", () => finish(new Error("Google Places script failed to load.")), {
        once: true,
      });
      document.head.appendChild(script);
    }).catch((error) => {
      googleMapsScriptPromise = null;
      throw error;
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

function fillAddressFields(place: GooglePlaceResult) {
  const components = place.address_components ?? [];
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
}

function getPredictionStatusMessage(status: string) {
  switch (status) {
    case "ZERO_RESULTS":
      return "No suggestions found. Continue with manual address.";
    case "REQUEST_DENIED":
      return "Google suggestions are not authorized for this site. Continue with manual address.";
    case "OVER_QUERY_LIMIT":
      return "Google suggestions are temporarily rate limited. Continue with manual address.";
    case "INVALID_REQUEST":
      return "Google could not search that address yet. Continue with manual address.";
    default:
      return "No suggestions found. Continue with manual address.";
  }
}

export function GoogleAddressAutocomplete({ initialValue = "" }: GoogleAddressAutocompleteProps) {
  const placesContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<GoogleAutocompleteService | null>(null);
  const placesServiceRef = useRef<GooglePlacesService | null>(null);
  const predictionRequestIdRef = useRef(0);
  const predictionTimeoutRef = useRef<number | null>(null);
  const suppressNextSearchRef = useRef(false);
  const selectionInProgressRef = useRef(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [predictions, setPredictions] = useState<GooglePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "manual" | "error">(
    googleMapsApiKey ? "loading" : "manual",
  );
  const [message, setMessage] = useState(
    googleMapsApiKey
      ? "Loading Google address suggestions..."
      : "Google address suggestions are not connected in this environment. Use the manual fields below.",
  );

  useEffect(() => {
    if (!googleMapsApiKey || !placesContainerRef.current) {
      console.error(
        "RentTruth Google Places autocomplete disabled: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing from the current build environment.",
      );
      setStatus("manual");
      setMessage("Google API key is missing. Continue with manual address.");
      return;
    }

    let isMounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!isMounted || !placesContainerRef.current || !window.google?.maps?.places) {
          return;
        }

        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(placesContainerRef.current);
        console.log("RentTruth Google Places services initialized.");
        setStatus("ready");
        setMessage("Start typing a real property address. Selecting a suggestion fills the manual fields below.");
      })
      .catch((error) => {
        console.error("RentTruth Google Places autocomplete failed.", error);
        if (isMounted) {
          setStatus("error");
          setPredictions([]);
          setMessage("Google suggestions are unavailable right now. Manual address entry still works below.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !autocompleteServiceRef.current || selectionInProgressRef.current) {
      if (predictionTimeoutRef.current) {
        window.clearTimeout(predictionTimeoutRef.current);
        predictionTimeoutRef.current = null;
      }
      setIsSearching(false);
      setPredictions([]);
      setIsDropdownOpen(false);
      return;
    }

    const trimmedInput = inputValue.trim();

    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      if (predictionTimeoutRef.current) {
        window.clearTimeout(predictionTimeoutRef.current);
        predictionTimeoutRef.current = null;
      }
      setIsSearching(false);
      setPredictions([]);
      setIsDropdownOpen(false);
      return;
    }

    if (trimmedInput.length < 3) {
      if (predictionTimeoutRef.current) {
        window.clearTimeout(predictionTimeoutRef.current);
        predictionTimeoutRef.current = null;
      }
      setIsSearching(false);
      setPredictions([]);
      setIsDropdownOpen(false);
      return;
    }

    let isCancelled = false;
    const requestId = predictionRequestIdRef.current + 1;
    predictionRequestIdRef.current = requestId;
    setIsSearching(true);
    setIsDropdownOpen(true);
    setMessage("Searching Google address suggestions...");

    if (predictionTimeoutRef.current) {
      window.clearTimeout(predictionTimeoutRef.current);
    }

    const debounceId = window.setTimeout(() => {
      let didRespond = false;
      const requestInput = trimmedInput;
      predictionTimeoutRef.current = window.setTimeout(() => {
        if (isCancelled || didRespond || predictionRequestIdRef.current !== requestId) return;

        didRespond = true;
        setIsSearching(false);
        setPredictions([]);
        setIsDropdownOpen(false);
        setMessage("No suggestions found. Continue with manual address.");
        console.warn("RentTruth Google Places prediction timed out.", { input: requestInput });
      }, GOOGLE_PREDICTION_TIMEOUT_MS);

      try {
        console.log("RentTruth Google Places prediction request started.", { input: requestInput });
        autocompleteServiceRef.current?.getPlacePredictions(
          {
            input: requestInput,
            componentRestrictions: { country: "us" },
          },
          (nextPredictions, nextStatus) => {
            if (isCancelled || didRespond || predictionRequestIdRef.current !== requestId) return;

            didRespond = true;
            if (predictionTimeoutRef.current) {
              window.clearTimeout(predictionTimeoutRef.current);
              predictionTimeoutRef.current = null;
            }
            const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK ?? "OK";
            console.log("RentTruth Google Places prediction response.", {
              input: requestInput,
              status: nextStatus,
              count: nextPredictions?.length ?? 0,
            });
            setIsSearching(false);

            if (nextStatus === okStatus) {
              const limitedPredictions = (nextPredictions ?? []).slice(0, 5);
              setPredictions(limitedPredictions);
              setIsDropdownOpen(limitedPredictions.length > 0);
              if (limitedPredictions.length === 0) {
                setMessage("No suggestions found. Continue with manual address.");
              } else {
                setMessage("Select a suggestion to fill the manual fields below.");
              }
              return;
            }

            console.warn("RentTruth Google Places prediction failed.", { status: nextStatus });
            setPredictions([]);
            setIsDropdownOpen(false);
            setMessage(getPredictionStatusMessage(nextStatus));
          },
        );
      } catch (error) {
        if (isCancelled) return;
        didRespond = true;
        if (predictionTimeoutRef.current) {
          window.clearTimeout(predictionTimeoutRef.current);
          predictionTimeoutRef.current = null;
        }
        console.error("RentTruth Google Places prediction crashed.", error);
        setIsSearching(false);
        setPredictions([]);
        setIsDropdownOpen(false);
        setStatus("error");
        setMessage("Google suggestions are unavailable right now. Manual address entry still works below.");
      }
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(debounceId);
    };
  }, [inputValue, status]);

  function selectPrediction(prediction: GooglePrediction) {
    selectionInProgressRef.current = true;
    suppressNextSearchRef.current = true;
    predictionRequestIdRef.current += 1;
    if (predictionTimeoutRef.current) {
      window.clearTimeout(predictionTimeoutRef.current);
      predictionTimeoutRef.current = null;
    }
    setInputValue(prediction.description);
    setPredictions([]);
    setIsSearching(false);
    setIsDropdownOpen(false);

    try {
      placesServiceRef.current?.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["address_components"],
        },
        (place, detailStatus) => {
          const okStatus = window.google?.maps?.places?.PlacesServiceStatus?.OK ?? "OK";

          if (detailStatus === okStatus && place) {
            fillAddressFields(place);
            setMessage("Address selected. Review the populated fields below before saving.");
            window.setTimeout(() => {
              selectionInProgressRef.current = false;
            }, 400);
            return;
          }

          console.warn("RentTruth Google Places detail lookup failed.", { status: detailStatus });
          setMessage("We could not fill that address automatically. Use the manual fields below.");
          window.setTimeout(() => {
            selectionInProgressRef.current = false;
          }, 400);
        },
      );
    } catch (error) {
      console.error("RentTruth Google Places detail lookup crashed.", error);
      setMessage("We could not fill that address automatically. Use the manual fields below.");
      window.setTimeout(() => {
        selectionInProgressRef.current = false;
      }, 400);
    }
  }

  const isLive = status === "ready";

  return (
    <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Address autocomplete
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-900/75">{message}</p>
        </div>
        <span className="rounded-full border border-white/70 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
          {isLive ? "Live suggestions" : "Manual fallback"}
        </span>
      </div>

      <label className="relative mt-4 block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Search property address</span>
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={isLive ? "Start typing an address" : "Manual entry remains available below"}
          autoComplete="off"
          inputMode="search"
          className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        />

        {isLive && isDropdownOpen ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-[22px] border border-emerald-100 bg-white p-2 shadow-2xl shadow-slate-900/15">
            {isSearching ? (
              <div className="px-3 py-3 text-sm text-slate-500">Searching addresses...</div>
            ) : null}

            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  selectPrediction(prediction);
                }}
                className="block w-full rounded-2xl px-3 py-3 text-left transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
              >
                <span className="block break-words text-sm font-semibold text-slate-900">
                  {prediction.structured_formatting?.main_text ?? prediction.description}
                </span>
                {prediction.structured_formatting?.secondary_text ? (
                  <span className="mt-1 block break-words text-xs leading-5 text-slate-500">
                    {prediction.structured_formatting.secondary_text}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </label>

      <div ref={placesContainerRef} className="hidden" />
    </div>
  );
}

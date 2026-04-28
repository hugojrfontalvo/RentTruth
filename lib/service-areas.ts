export type ServiceState = {
  code: string;
  name: string;
};

export const serviceStates: ServiceState[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const serviceCitiesByState: Record<string, string[]> = {
  FL: [
    "Miami",
    "Kendall",
    "The Hammocks",
    "Homestead",
    "Coral Gables",
    "Hialeah",
    "Doral",
    "Miami Beach",
    "North Miami",
    "Aventura",
    "Cutler Bay",
    "Palmetto Bay",
    "Fort Lauderdale",
    "Hollywood",
    "Pembroke Pines",
    "Miramar",
    "Weston",
    "Plantation",
    "Boca Raton",
    "West Palm Beach",
    "Orlando",
    "Tampa",
    "St. Petersburg",
    "Clearwater",
    "Naples",
    "Fort Myers",
    "Jacksonville",
    "Tallahassee",
    "Gainesville",
    "Sarasota",
    "Bradenton",
    "Cape Coral",
    "Port St. Lucie",
    "Lakeland",
    "Kissimmee",
    "Daytona Beach",
    "Melbourne",
    "Pensacola",
  ],
  NY: ["Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island", "Yonkers", "White Plains"],
  NJ: ["Jersey City", "Hoboken", "Newark", "Union City", "Weehawken", "Paterson", "Elizabeth"],
  CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Sacramento", "Oakland"],
  TX: ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth", "Plano"],
  IL: ["Chicago", "Aurora", "Naperville", "Joliet"],
  GA: ["Atlanta", "Savannah", "Augusta", "Marietta"],
  NC: ["Charlotte", "Raleigh", "Durham", "Greensboro"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Scottsdale"],
  CO: ["Denver", "Aurora", "Colorado Springs", "Boulder"],
  WA: ["Seattle", "Tacoma", "Bellevue", "Spokane"],
  MA: ["Boston", "Cambridge", "Somerville", "Worcester"],
};

export function getServiceCitiesForState(stateCode?: string) {
  return serviceCitiesByState[stateCode?.trim().toUpperCase() ?? ""] ?? [];
}

export function normalizeServiceState(value: string) {
  return value.trim().toUpperCase();
}

export function filterValidServiceCities(stateCode: string, cities: string[]) {
  const allowedCities = new Set(
    getServiceCitiesForState(stateCode).map((city) => city.toLowerCase()),
  );

  return cities.filter((city) => allowedCities.has(city.trim().toLowerCase()));
}

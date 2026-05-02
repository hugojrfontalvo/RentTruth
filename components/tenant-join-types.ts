export type JoinableProperty = {
  id: string;
  propertyType: "House" | "Apartment" | "Condo" | "Townhome" | "Multi-unit building";
  streetAddress: string;
  unitNumber?: string;
  buildingNumber?: string;
  city: string;
  state: string;
  zip: string;
  name?: string;
};

export type SavedTenantAddress = {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  propertyType: "House" | "Apartment" | "Condo" | "Townhome" | "Multi-unit building";
  unitNumber?: string;
  buildingNumber?: string;
};

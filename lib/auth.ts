export const userRoles = ["tenant", "landlord", "vendor"] as const;
export const appRoles = [...userRoles, "admin"] as const;

export type UserRole = (typeof userRoles)[number];
export type AppRole = (typeof appRoles)[number];

export const roleLabels: Record<AppRole, string> = {
  tenant: "Tenant",
  landlord: "Landlord",
  vendor: "Vendor",
  admin: "RentTruth Admin",
};

export const roleDescriptions: Record<AppRole, string> = {
  tenant: "Report issues fast, follow repair progress, and keep a clean service record for your home.",
  landlord: "Manage maintenance operations, improve response times, and build visible trust with renters.",
  vendor: "Accept repair work, streamline dispatch, and prove your reliability through fast resolution.",
  admin: "Triage internal support requests, surface user pain points, and keep the platform stable across every role.",
};

export const roleAccentClasses: Record<AppRole, string> = {
  tenant: "from-sky-400/20 via-white to-white",
  landlord: "from-emerald-400/20 via-white to-white",
  vendor: "from-orange-200/55 via-orange-50/35 to-white",
  admin: "from-violet-400/20 via-white to-white",
};

export function isUserRole(value: string): value is UserRole {
  return userRoles.includes(value as UserRole);
}

export function isAppRole(value: string): value is AppRole {
  return appRoles.includes(value as AppRole);
}

export function getDashboardPath(role: AppRole) {
  if (role === "tenant") {
    return "/dashboard/tenant";
  }

  if (role === "landlord") {
    return "/dashboard/landlord";
  }

  if (role === "vendor") {
    return "/dashboard/vendor";
  }

  return "/dashboard/admin";
}

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  name?: string;
  savedAddress?: string;
  savedStreetAddress?: string;
  savedCity?: string;
  savedState?: string;
  savedZip?: string;
  savedPropertyType?:
    | "House"
    | "Apartment"
    | "Condo"
    | "Townhome"
    | "Multi-unit building";
  propertyId?: string;
  unitNumber?: string;
  membershipStatus?: string;
  membershipRequestedAt?: string;
  tenantVerificationLevel?: "unverified" | "verified";
  linkedToLandlord?: boolean;
};

import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { after } from "next/server";
import { dirname, join } from "path";
import { Pool } from "pg";
import { type AppRole, type UserRole } from "@/lib/auth";

export type MembershipStatus =
  | "Pending"
  | "Approved"
  | "Denied"
  | "Removed"
  | "Left Property";

export type TenantVerificationLevel = "unverified" | "verified";

export type AccountLinkageSignal =
  | "same device/session"
  | "same IP pattern"
  | "created within short time";

export type TrustConfidenceLevel = "High" | "Medium" | "Low";

export type PropertyType =
  | "House"
  | "Apartment"
  | "Condo"
  | "Townhome"
  | "Multi-unit building";

export type AppUser = {
  id: string;
  email: string;
  password: string;
  role: AppRole;
  name?: string;
  savedAddress?: string;
  savedStreetAddress?: string;
  savedCity?: string;
  savedState?: string;
  savedZip?: string;
  savedPropertyType?: PropertyType;
  propertyId?: string;
  unitNumber?: string;
  buildingNumber?: string;
  membershipStatus?: MembershipStatus;
  membershipRequestedAt?: string;
  tenantVerificationLevel?: TenantVerificationLevel;
  linkedToLandlord?: boolean;
  accountLinkageSignals?: AccountLinkageSignal[];
  createdAt?: string;
};

export type Property = {
  id: string;
  landlordId: string;
  propertyType: PropertyType;
  name?: string;
  streetAddress: string;
  unitNumber?: string;
  buildingNumber?: string;
  city: string;
  state: string;
  zip: string;
  joinCode: string;
  unitCount: number;
  createdAt: string;
  trustScore: number;
  averageRepairResponseTime: string;
  averageCompletionTime: string;
  ticketsCompletedOnTimeRate: string;
  urgentRepairCompletionSpeed: string;
  repairHistorySummary: string;
};

export type RepairTicket = {
  id: string;
  propertyId: string;
  tenantUserId: string;
  tenantEmail: string;
  unitNumber?: string;
  issueTitle: string;
  category: string;
  description: string;
  photoUploadPlaceholder?: string;
  attachment?: RepairTicketAttachment | null;
  urgent: boolean;
  status: string;
  submittedAt: string;
  trendBucket: "resolved" | "unresolved";
  vendorUserId?: string;
  vendorBusinessName?: string;
  landlordVendorName?: string;
  landlordVendorContact?: string;
  landlordVendorScheduledFor?: string;
  landlordVendorTenantNote?: string;
  landlordVendorAssignedAt?: string;
  assignedAt?: string;
  acceptedAt?: string;
  enRouteAt?: string;
  arrivedAt?: string;
  workStartedAt?: string;
  completedAt?: string;
  droppedAfterAcceptanceAt?: string;
  locationTrackingPlaceholder?: string;
  idleMovementTimeoutPlaceholder?: string;
  vendorCompletionNotes?: string;
  tenantConfirmationStatus?:
    | "Waiting for tenant confirmation"
    | "Tenant confirmed fixed"
    | "Follow-up needed";
  tenantConfirmationAt?: string;
  tenantFeedback?: string;
  landlordReadyForPaymentApprovalAt?: string;
  paymentMethod?: string;
  paymentMarkedReadyAt?: string;
  landlordFinalReviewNotes?: string;
  repairApprovalRequest?: RepairApprovalRequest | null;
  vendorRequests?: VendorTicketRequest[];
  messages?: TicketMessage[];
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  senderUserId: string;
  senderRole: "tenant" | "landlord";
  text: string;
  createdAt: string;
};

export type RepairApprovalRequestStatus =
  | "Pending landlord approval"
  | "Approved"
  | "Declined"
  | "Request follow-up";

export type RepairApprovalRequest = {
  summary: string;
  pricingItem?: CommonRepairPricingItem;
  partCost: number;
  baselinePrice?: number;
  priceDeltaPercent?: number;
  exceedsBaselineWarning?: string;
  laborImpact: string;
  notes: string;
  requestedAt: string;
  status: RepairApprovalRequestStatus;
  reviewedAt?: string;
  reviewNotes?: string;
};

export type RepairTicketAttachmentKind = "image" | "pdf" | "file";

export type RepairTicketAttachment = {
  fileName: string;
  mimeType?: string;
  kind: RepairTicketAttachmentKind;
  dataUrl?: string;
};

export type CommonRepairPricingItem =
  | "capacitor"
  | "compressor"
  | "thermostat"
  | "drain-clearing"
  | "fan-motor"
  | "contactor";

export type VendorBaselineRepairPrice = {
  item: CommonRepairPricingItem;
  label: string;
  typicalPrice?: number;
  laborAddOnNote?: string;
};

export type VendorRequestStatus =
  | "Vendor interested"
  | "Vendor selected"
  | "Vendor declined";

export type VendorTicketRequest = {
  vendorUserId: string;
  vendorBusinessName: string;
  status: VendorRequestStatus;
  requestedAt: string;
  selectedAt?: string;
  declinedAt?: string;
};

export type VendorServiceCategory =
  | "AC"
  | "Plumbing"
  | "Electrical"
  | "Pest"
  | "Appliance"
  | "General Repair";

export type VerificationStatus =
  | "Background Check Complete"
  | "Identity Verified"
  | "Verification Pending"
  | "Not Verified";

export type OccupiedHomeEligibilityStatus =
  | "Eligible for Occupied Homes"
  | "Not eligible for occupied homes"
  | "Verification Pending";

export type ComplianceStatus =
  | "Verified on file"
  | "Self-reported"
  | "Verification Pending"
  | "Expired"
  | "No documents on file";

export type VendorDocumentField =
  | "licenseDocument"
  | "insuranceDocument"
  | "businessRegistrationDocument"
  | "backgroundCheckDocument"
  | "identityVerificationDocument";

export type VendorProfile = {
  userId: string;
  businessName: string;
  legalContactName: string;
  phone: string;
  email: string;
  serviceCategories: VendorServiceCategory[];
  serviceArea: string;
  serviceState?: string;
  serviceCities?: string[];
  hourlyRate: number;
  emergencyRate: number;
  tripFee: number;
  pricingNotes: string;
  commonRepairCosts: string;
  baselineRepairPricing: VendorBaselineRepairPrice[];
  weekendAvailability: boolean;
  sameDayAvailability: boolean;
  licenseStatus: ComplianceStatus;
  licenseType: string;
  licenseNumber: string;
  issuingState: string;
  licenseExpirationDate: string;
  insuranceStatus: ComplianceStatus;
  insuranceCompany: string;
  policyNumber: string;
  insuranceExpirationDate: string;
  companyName: string;
  contactInfo: string;
  identityVerificationStatus: VerificationStatus;
  backgroundCheckStatus: VerificationStatus;
  occupiedHomeEligibilityStatus: OccupiedHomeEligibilityStatus;
  safetyNotes: string;
  licenseDocumentUploaded: boolean;
  insuranceDocumentUploaded: boolean;
  businessRegistrationDocumentUploaded: boolean;
  backgroundCheckDocumentUploaded: boolean;
  identityVerificationDocumentUploaded: boolean;
  jobsAssignedCount: number;
  jobsAcceptedCount: number;
  jobsCompletedCount: number;
  jobsDroppedCount: number;
  completionHistoryCount: number;
  ratingPlaceholder: string;
  profileCompleted: boolean;
};

export type PublicPropertyProfile = {
  id: string;
  displayName: string;
  fullAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyType;
  landlordTrustScore: number;
  confidenceLevel: TrustConfidenceLevel;
  trustTransparencyMessage: string;
  hasVerifiedMaintenanceHistory: boolean;
  completedMaintenanceTicketCount: number;
  independentTenantCount: number;
  verifiedConfirmationCount: number;
  weightedConfirmationCount: number;
  averageRepairResponseTime: string;
  averageCompletionTime: string;
  ticketsCompletedOnTimeRate: string;
  urgentRepairCompletionSpeed: string;
  repairHistorySummary: string;
  commonIssueCategories: Array<{ category: string; count: number }>;
  ticketTrends: {
    resolved: number;
    unresolved: number;
  };
};

export type SupportTicketCategory =
  | "Bug"
  | "Support"
  | "Feature Request"
  | "Billing"
  | "Safety"
  | "Other";

export type SupportTicketUrgency = "Low" | "Normal" | "High" | "Urgent";

export type SupportTicketStatus = "New" | "Open" | "In progress" | "Resolved";

export type SupportTicket = {
  id: string;
  category: SupportTicketCategory;
  subject: string;
  description: string;
  screenshotPlaceholder: string;
  urgency: SupportTicketUrgency;
  status: SupportTicketStatus;
  userRole: UserRole;
  userId: string;
  userEmail: string;
  userName?: string;
  createdAt: string;
  assignedSupportStaff?: string;
  adminNotes?: string;
  resolvedAt?: string;
};

export type ActivityEvent = {
  id: string;
  type: string;
  actorUserId?: string;
  actorRole?: AppRole;
  entityType?: string;
  entityId?: string;
  message: string;
  createdAt: string;
};

export type PlatformNotification = {
  id: string;
  role?: AppRole;
  userId?: string;
  entityType?: string;
  entityId?: string;
  message: string;
  createdAt: string;
  readAt?: string;
};

export type AddressSuggestion = {
  id: string;
  label: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
};

export type SavedTenantAddress = {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyType;
  unitNumber?: string;
  buildingNumber?: string;
};

export const commonRepairPricingCatalog: Array<{
  item: CommonRepairPricingItem;
  label: string;
}> = [
  { item: "capacitor", label: "Capacitor" },
  { item: "compressor", label: "Compressor" },
  { item: "thermostat", label: "Thermostat" },
  { item: "drain-clearing", label: "Drain clearing" },
  { item: "fan-motor", label: "Fan motor" },
  { item: "contactor", label: "Contactor" },
];

export function getRepairTicketAttachmentKind(input: {
  fileName?: string;
  mimeType?: string;
}): RepairTicketAttachmentKind {
  const mimeType = input.mimeType?.trim().toLowerCase() ?? "";
  const fileName = input.fileName?.trim().toLowerCase() ?? "";

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".gif") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif")
  ) {
    return "image";
  }

  return "file";
}

export function createRepairTicketAttachment(input: {
  fileName?: string;
  mimeType?: string;
  dataUrl?: string;
}): RepairTicketAttachment | null {
  const fileName = input.fileName?.trim();

  if (!fileName || fileName === "No photo uploaded") {
    return null;
  }

  return {
    fileName,
    mimeType: input.mimeType?.trim() || undefined,
    kind: getRepairTicketAttachmentKind({ fileName, mimeType: input.mimeType }),
    dataUrl: input.dataUrl?.trim() || undefined,
  };
}

type CreateUserInput = {
  email: string;
  password: string;
  role: UserRole;
  savedAddress?: string;
  savedStreetAddress?: string;
  savedCity?: string;
  savedState?: string;
  savedZip?: string;
  savedPropertyType?: PropertyType;
  propertyId?: string;
  unitNumber?: string;
  buildingNumber?: string;
  membershipStatus?: MembershipStatus;
  membershipRequestedAt?: string;
  name?: string;
  tenantVerificationLevel?: TenantVerificationLevel;
  linkedToLandlord?: boolean;
  accountLinkageSignals?: AccountLinkageSignal[];
  createdAt?: string;
};

type CreateUserOptions = {
  id?: string;
  persist?: boolean;
};

type DemoStore = {
  schemaVersion: number;
  users: AppUser[];
  properties: Property[];
  tickets: RepairTicket[];
  vendorProfiles: VendorProfile[];
  supportTickets: SupportTicket[];
  activityEvents: ActivityEvent[];
  notifications: PlatformNotification[];
  propertyCounter: number;
  ticketCounter: number;
  userCounter: number;
  supportTicketCounter: number;
  activityEventCounter: number;
  notificationCounter: number;
};

const membershipStatuses: MembershipStatus[] = [
  "Pending",
  "Approved",
  "Denied",
  "Removed",
  "Left Property",
];

const propertyTypes: PropertyType[] = [
  "House",
  "Apartment",
  "Condo",
  "Townhome",
  "Multi-unit building",
];

const vendorServiceCategories: VendorServiceCategory[] = [
  "AC",
  "Plumbing",
  "Electrical",
  "Pest",
  "Appliance",
  "General Repair",
];

const supportTicketCategories: SupportTicketCategory[] = [
  "Bug",
  "Support",
  "Feature Request",
  "Billing",
  "Safety",
  "Other",
];

const supportTicketUrgencies: SupportTicketUrgency[] = [
  "Low",
  "Normal",
  "High",
  "Urgent",
];

const supportTicketStatuses: SupportTicketStatus[] = [
  "New",
  "Open",
  "In progress",
  "Resolved",
];

const addressDirectory: AddressSuggestion[] = [
  {
    id: "addr-harbor",
    label: "1408 Atlantic Avenue, Brooklyn, NY 11216",
    streetAddress: "1408 Atlantic Avenue",
    city: "Brooklyn",
    state: "NY",
    zip: "11216",
  },
  {
    id: "addr-maple",
    label: "271 Maple Street, Jersey City, NJ 07304",
    streetAddress: "271 Maple Street",
    city: "Jersey City",
    state: "NJ",
    zip: "07304",
  },
  {
    id: "addr-riverview",
    label: "88 Riverview Lane, Hoboken, NJ 07030",
    streetAddress: "88 Riverview Lane",
    city: "Hoboken",
    state: "NJ",
    zip: "07030",
  },
  {
    id: "addr-oak",
    label: "414 Oak Drive, Austin, TX 78704",
    streetAddress: "414 Oak Drive",
    city: "Austin",
    state: "TX",
    zip: "78704",
  },
  {
    id: "addr-cedar",
    label: "19 Cedar Place, Chicago, IL 60614",
    streetAddress: "19 Cedar Place",
    city: "Chicago",
    state: "IL",
    zip: "60614",
  },
];

const seedUsers: AppUser[] = [
  {
    id: "admin-owner",
    email: "admin@renttruth.com",
    password: "demo12345",
    role: "admin",
    name: "RentTruth Admin",
  },
  {
    id: "staff-hq",
    email: "hq@renttruth.com",
    password: "demo12345",
    role: "admin",
    name: "RentTruth Support HQ",
  },
  {
    id: "landlord-harbor",
    email: "owner@renttruth.com",
    password: "demo12345",
    role: "landlord",
    name: "Olivia Harper",
    createdAt: "2026-03-30T09:00:00.000Z",
  },
  {
    id: "vendor-atlas",
    email: "vendor@renttruth.com",
    password: "demo12345",
    role: "vendor",
    name: "Atlas Service Group",
  },
  {
    id: "vendor-summit",
    email: "summit@renttruth.com",
    password: "demo12345",
    role: "vendor",
    name: "Summit Home Systems",
  },
  {
    id: "vendor-brightline",
    email: "brightline@renttruth.com",
    password: "demo12345",
    role: "vendor",
    name: "Brightline Repairs",
  },
  {
    id: "tenant-maya",
    email: "maya@renttruth.com",
    password: "demo12345",
    role: "tenant",
    name: "Maya Chen",
    propertyId: "property-harbor",
    unitNumber: "4B",
    membershipStatus: "Approved",
    membershipRequestedAt: "Apr 03",
    tenantVerificationLevel: "verified",
    linkedToLandlord: false,
    accountLinkageSignals: [],
    createdAt: "2026-04-03T10:30:00.000Z",
  },
  {
    id: "tenant-jordan",
    email: "jordan@renttruth.com",
    password: "demo12345",
    role: "tenant",
    name: "Jordan Miles",
    propertyId: "property-maple",
    unitNumber: "12A",
    membershipStatus: "Approved",
    membershipRequestedAt: "Apr 05",
    tenantVerificationLevel: "verified",
    linkedToLandlord: false,
    accountLinkageSignals: [],
    createdAt: "2026-04-05T13:15:00.000Z",
  },
  {
    id: "tenant-pending-lena",
    email: "lena@renttruth.com",
    password: "demo12345",
    role: "tenant",
    name: "Lena Ortiz",
    propertyId: "property-harbor",
    unitNumber: "7C",
    membershipStatus: "Pending",
    membershipRequestedAt: "Today",
    tenantVerificationLevel: "unverified",
    linkedToLandlord: true,
    accountLinkageSignals: ["same device/session", "created within short time"],
    createdAt: "2026-04-25T14:02:00.000Z",
  },
  {
    id: "tenant-denied-noah",
    email: "noah@renttruth.com",
    password: "demo12345",
    role: "tenant",
    name: "Noah Patel",
    propertyId: "property-maple",
    unitNumber: "2D",
    membershipStatus: "Denied",
    membershipRequestedAt: "Apr 18",
    tenantVerificationLevel: "unverified",
    linkedToLandlord: true,
    accountLinkageSignals: ["same IP pattern"],
    createdAt: "2026-04-18T16:20:00.000Z",
  },
  {
    id: "tenant-house-approved",
    email: "harper.family@renttruth.com",
    password: "demo12345",
    role: "tenant",
    name: "Harper Family",
    propertyId: "property-riverview",
    membershipStatus: "Approved",
    membershipRequestedAt: "Apr 08",
    tenantVerificationLevel: "verified",
    linkedToLandlord: false,
    accountLinkageSignals: [],
    createdAt: "2026-04-08T11:10:00.000Z",
  },
];

const seedProperties: Property[] = [
  {
    id: "property-harbor",
    landlordId: "landlord-harbor",
    propertyType: "Apartment",
    name: "Harbor House",
    streetAddress: "1408 Atlantic Avenue",
    city: "Brooklyn",
    state: "NY",
    zip: "11216",
    joinCode: "HARBOR7",
    unitCount: 24,
    createdAt: "Apr 10",
    trustScore: 91,
    averageRepairResponseTime: "3.2 hours",
    averageCompletionTime: "19.4 hours",
    ticketsCompletedOnTimeRate: "92%",
    urgentRepairCompletionSpeed: "6.1 hours",
    repairHistorySummary: "Most repair requests are acknowledged the same day, with HVAC and electrical issues resolved fastest this quarter.",
  },
  {
    id: "property-maple",
    landlordId: "landlord-harbor",
    propertyType: "Condo",
    name: "Maple Court",
    streetAddress: "271 Maple Street",
    city: "Jersey City",
    state: "NJ",
    zip: "07304",
    joinCode: "MAPLE5",
    unitCount: 18,
    createdAt: "Apr 15",
    trustScore: 87,
    averageRepairResponseTime: "4.1 hours",
    averageCompletionTime: "23.8 hours",
    ticketsCompletedOnTimeRate: "88%",
    urgentRepairCompletionSpeed: "8.3 hours",
    repairHistorySummary: "Plumbing volume is highest here, but response times have improved steadily over the last three reporting windows.",
  },
  {
    id: "property-riverview",
    landlordId: "landlord-harbor",
    propertyType: "House",
    name: "Riverview Residence",
    streetAddress: "88 Riverview Lane",
    city: "Hoboken",
    state: "NJ",
    zip: "07030",
    joinCode: "RIVER3",
    unitCount: 1,
    createdAt: "Apr 08",
    trustScore: 93,
    averageRepairResponseTime: "2.9 hours",
    averageCompletionTime: "15.6 hours",
    ticketsCompletedOnTimeRate: "95%",
    urgentRepairCompletionSpeed: "4.8 hours",
    repairHistorySummary: "Single-residence property with consistently fast follow-up and a high resolved-ticket rate.",
  },
];

const seedVendorProfiles: VendorProfile[] = [
  {
    userId: "vendor-atlas",
    businessName: "Atlas Service Group",
    legalContactName: "Marcus Hale",
    phone: "(917) 555-0184",
    email: "vendor@renttruth.com",
    serviceCategories: ["AC", "Appliance", "General Repair"],
    serviceArea: "Brooklyn, Manhattan, Jersey City",
    serviceState: "NY",
    serviceCities: ["Brooklyn", "Manhattan", "Jersey City"],
    hourlyRate: 125,
    emergencyRate: 185,
    tripFee: 45,
    pricingNotes: "Most AC tune-ups start at $165. Appliance diagnostics are self-reported and quoted after inspection.",
    commonRepairCosts: "Capacitor replacement usually starts around $180. Thermostat replacements often start near $240. Compressor replacement is usually quoted after diagnosis and parts confirmation.",
    baselineRepairPricing: [
      { item: "capacitor", label: "Capacitor", typicalPrice: 180, laborAddOnNote: "Usually installs in under 1 hour." },
      { item: "compressor", label: "Compressor", typicalPrice: 820, laborAddOnNote: "Usually adds 3 to 4 labor hours plus refrigerant handling." },
      { item: "thermostat", label: "Thermostat", typicalPrice: 240, laborAddOnNote: "Usually adds about 1 labor hour." },
      { item: "fan-motor", label: "Fan motor", typicalPrice: 310, laborAddOnNote: "Usually adds 1 to 2 labor hours." },
      { item: "contactor", label: "Contactor", typicalPrice: 165, laborAddOnNote: "Usually installs during the same visit." },
      { item: "drain-clearing", label: "Drain clearing", typicalPrice: 145, laborAddOnNote: "Usually handled during a standard service call." },
    ],
    weekendAvailability: true,
    sameDayAvailability: true,
    licenseStatus: "Verified on file",
    licenseType: "HVAC Contractor",
    licenseNumber: "HV-44382",
    issuingState: "NY",
    licenseExpirationDate: "2027-11-15",
    insuranceStatus: "Verified on file",
    insuranceCompany: "Hudson Mutual",
    policyNumber: "HM-882144",
    insuranceExpirationDate: "2026-12-31",
    companyName: "Atlas Service Group LLC",
    contactInfo: "Ops desk: (917) 555-0184",
    identityVerificationStatus: "Identity Verified",
    backgroundCheckStatus: "Background Check Complete",
    occupiedHomeEligibilityStatus: "Eligible for Occupied Homes",
    safetyNotes: "Documents uploaded and verification statuses are on file. Landlords should confirm scope and site conditions before dispatch.",
    licenseDocumentUploaded: true,
    insuranceDocumentUploaded: true,
    businessRegistrationDocumentUploaded: true,
    backgroundCheckDocumentUploaded: true,
    identityVerificationDocumentUploaded: true,
    jobsAssignedCount: 33,
    jobsAcceptedCount: 30,
    jobsCompletedCount: 28,
    jobsDroppedCount: 1,
    completionHistoryCount: 28,
    ratingPlaceholder: "4.8 placeholder",
    profileCompleted: true,
  },
  {
    userId: "vendor-summit",
    businessName: "Summit Home Systems",
    legalContactName: "Elena Brooks",
    phone: "(646) 555-0121",
    email: "summit@renttruth.com",
    serviceCategories: ["Plumbing", "Electrical", "General Repair"],
    serviceArea: "Brooklyn, Queens, Hoboken",
    serviceState: "NY",
    serviceCities: ["Brooklyn", "Queens", "Hoboken"],
    hourlyRate: 138,
    emergencyRate: 210,
    tripFee: 60,
    pricingNotes: "Electrical and plumbing pricing varies by scope. Weekend emergency calls are billed at the emergency rate.",
    commonRepairCosts: "Drain clearing often starts near $225. Faucet cartridge swaps often start near $165. Panel troubleshooting is typically quoted after scope review.",
    baselineRepairPricing: [
      { item: "drain-clearing", label: "Drain clearing", typicalPrice: 225, laborAddOnNote: "Usually clears within 1 to 1.5 labor hours." },
      { item: "thermostat", label: "Thermostat", typicalPrice: 215, laborAddOnNote: "Usually adds about 1 labor hour." },
      { item: "fan-motor", label: "Fan motor", typicalPrice: 345, laborAddOnNote: "Usually adds 2 labor hours." },
      { item: "contactor", label: "Contactor", typicalPrice: 175, laborAddOnNote: "Usually completed during a standard electrical visit." },
      { item: "capacitor", label: "Capacitor", typicalPrice: 190, laborAddOnNote: "Usually completed during the same visit." },
      { item: "compressor", label: "Compressor", typicalPrice: 910, laborAddOnNote: "Usually requires return scheduling and major labor." },
    ],
    weekendAvailability: true,
    sameDayAvailability: false,
    licenseStatus: "Verified on file",
    licenseType: "Master Plumber / Electrical Contractor",
    licenseNumber: "MP-77814",
    issuingState: "NJ",
    licenseExpirationDate: "2026-10-12",
    insuranceStatus: "Verified on file",
    insuranceCompany: "North Harbor Insurance",
    policyNumber: "NHI-55209",
    insuranceExpirationDate: "2026-09-01",
    companyName: "Summit Home Systems Inc.",
    contactInfo: "Dispatch: (646) 555-0121",
    identityVerificationStatus: "Identity Verified",
    backgroundCheckStatus: "Background Check Complete",
    occupiedHomeEligibilityStatus: "Eligible for Occupied Homes",
    safetyNotes: "Verification records on file. Landlords should review occupied-home fit for higher-risk trade work.",
    licenseDocumentUploaded: true,
    insuranceDocumentUploaded: true,
    businessRegistrationDocumentUploaded: true,
    backgroundCheckDocumentUploaded: true,
    identityVerificationDocumentUploaded: true,
    jobsAssignedCount: 24,
    jobsAcceptedCount: 21,
    jobsCompletedCount: 19,
    jobsDroppedCount: 1,
    completionHistoryCount: 19,
    ratingPlaceholder: "4.6 placeholder",
    profileCompleted: true,
  },
  {
    userId: "vendor-brightline",
    businessName: "Brightline Repairs",
    legalContactName: "Dana Flores",
    phone: "(551) 555-0177",
    email: "brightline@renttruth.com",
    serviceCategories: ["Pest", "Appliance", "General Repair"],
    serviceArea: "Jersey City, Hoboken, Lower Manhattan",
    serviceState: "NJ",
    serviceCities: ["Jersey City", "Hoboken", "Lower Manhattan"],
    hourlyRate: 98,
    emergencyRate: 145,
    tripFee: 35,
    pricingNotes: "General repair estimates are self-reported and may change after diagnosis.",
    commonRepairCosts: "Dishwasher drain service often starts near $145. Disposal replacement often starts near $210. Pest follow-up visits vary by treatment plan.",
    baselineRepairPricing: [
      { item: "drain-clearing", label: "Drain clearing", typicalPrice: 145, laborAddOnNote: "Usually completed in 1 labor hour." },
      { item: "thermostat", label: "Thermostat", typicalPrice: 195, laborAddOnNote: "Quoted after appliance compatibility check." },
      { item: "fan-motor", label: "Fan motor", typicalPrice: 295, laborAddOnNote: "Quoted after appliance or HVAC inspection." },
      { item: "capacitor", label: "Capacitor", typicalPrice: 170, laborAddOnNote: "Quoted if compatible with the diagnosed system." },
      { item: "compressor", label: "Compressor", typicalPrice: 760, laborAddOnNote: "Quoted only after full system diagnosis." },
      { item: "contactor", label: "Contactor", typicalPrice: 150, laborAddOnNote: "Usually paired with a same-visit repair." },
    ],
    weekendAvailability: false,
    sameDayAvailability: true,
    licenseStatus: "Verification Pending",
    licenseType: "Home Improvement Contractor",
    licenseNumber: "HI-22091",
    issuingState: "NJ",
    licenseExpirationDate: "2025-09-15",
    insuranceStatus: "Self-reported",
    insuranceCompany: "Pending upload",
    policyNumber: "Pending",
    insuranceExpirationDate: "2025-08-01",
    companyName: "Brightline Repairs LLC",
    contactInfo: "Office: (551) 555-0177",
    identityVerificationStatus: "Verification Pending",
    backgroundCheckStatus: "Not Verified",
    occupiedHomeEligibilityStatus: "Not eligible for occupied homes",
    safetyNotes: "Background check and occupied-home eligibility are not verified on file.",
    licenseDocumentUploaded: false,
    insuranceDocumentUploaded: false,
    businessRegistrationDocumentUploaded: true,
    backgroundCheckDocumentUploaded: false,
    identityVerificationDocumentUploaded: false,
    jobsAssignedCount: 11,
    jobsAcceptedCount: 9,
    jobsCompletedCount: 7,
    jobsDroppedCount: 2,
    completionHistoryCount: 7,
    ratingPlaceholder: "4.2 placeholder",
    profileCompleted: true,
  },
];

const seedTickets: RepairTicket[] = [
  {
    id: "ticket-1",
    propertyId: "property-harbor",
    tenantUserId: "tenant-maya",
    tenantEmail: "maya@renttruth.com",
    unitNumber: "4B",
    issueTitle: "Bedroom AC not cooling",
    category: "AC",
    description: "The bedroom AC is running but not pushing cold air.",
    photoUploadPlaceholder: "tenant-bedroom-ac.jpg",
    urgent: true,
    status: "Open to vendors",
    submittedAt: "Today, 9:10 AM",
    trendBucket: "unresolved",
    vendorRequests: [],
  },
  {
    id: "ticket-2",
    propertyId: "property-maple",
    tenantUserId: "tenant-jordan",
    tenantEmail: "jordan@renttruth.com",
    unitNumber: "12A",
    issueTitle: "Kitchen sink draining slowly",
    category: "Plumbing",
    description: "Water pools for a while before draining.",
    photoUploadPlaceholder: "tenant-sink-drain-video-placeholder.mov",
    urgent: false,
    status: "Waiting for tenant confirmation",
    submittedAt: "Apr 18, 2:42 PM",
    trendBucket: "resolved",
    vendorUserId: "vendor-summit",
    vendorBusinessName: "Summit Home Systems",
    assignedAt: "2026-04-18T14:50:00.000Z",
    acceptedAt: "2026-04-18T15:12:00.000Z",
    enRouteAt: "2026-04-18T15:38:00.000Z",
    arrivedAt: "2026-04-18T16:05:00.000Z",
    workStartedAt: "2026-04-18T16:18:00.000Z",
    completedAt: "2026-04-18T17:45:00.000Z",
    vendorCompletionNotes: "Cleared the trap and replaced a worn slip washer. Asked tenant to monitor the next full sink load.",
    tenantConfirmationStatus: "Waiting for tenant confirmation",
    locationTrackingPlaceholder: "Dispatch tracking placeholder",
    idleMovementTimeoutPlaceholder: "Idle movement timeout placeholder",
    vendorRequests: [
      {
        vendorUserId: "vendor-summit",
        vendorBusinessName: "Summit Home Systems",
        status: "Vendor selected",
        requestedAt: "2026-04-18T14:35:00.000Z",
        selectedAt: "2026-04-18T14:50:00.000Z",
      },
      {
        vendorUserId: "vendor-brightline",
        vendorBusinessName: "Brightline Repairs",
        status: "Vendor declined",
        requestedAt: "2026-04-18T14:40:00.000Z",
        declinedAt: "2026-04-18T14:50:00.000Z",
      },
    ],
  },
  {
    id: "ticket-3",
    propertyId: "property-harbor",
    tenantUserId: "tenant-maya",
    tenantEmail: "maya@renttruth.com",
    unitNumber: "4B",
    issueTitle: "Hallway light flickering",
    category: "Electrical",
    description: "The overhead hallway light flickers at night.",
    photoUploadPlaceholder: "No photo uploaded",
    urgent: false,
    status: "Resolved",
    submittedAt: "Apr 12, 6:25 PM",
    trendBucket: "resolved",
    vendorRequests: [],
  },
  {
    id: "ticket-4",
    propertyId: "property-riverview",
    tenantUserId: "tenant-house-approved",
    tenantEmail: "harper.family@renttruth.com",
    issueTitle: "Garage door opener intermittent",
    category: "Electrical",
    description: "The garage opener only works every few attempts.",
    photoUploadPlaceholder: "garage-opener-console.jpg",
    urgent: false,
    status: "Ready for landlord payment approval",
    submittedAt: "Apr 02, 11:20 AM",
    trendBucket: "resolved",
    vendorUserId: "vendor-atlas",
    vendorBusinessName: "Atlas Service Group",
    assignedAt: "2026-04-02T11:45:00.000Z",
    acceptedAt: "2026-04-02T12:02:00.000Z",
    enRouteAt: "2026-04-02T12:28:00.000Z",
    arrivedAt: "2026-04-02T13:05:00.000Z",
    workStartedAt: "2026-04-02T13:18:00.000Z",
    completedAt: "2026-04-02T14:22:00.000Z",
    vendorCompletionNotes: "Replaced the wall control and tightened the low-voltage connection at the opener head.",
    tenantConfirmationStatus: "Tenant confirmed fixed",
    tenantConfirmationAt: "2026-04-02T15:05:00.000Z",
    tenantFeedback: "Door has been opening normally since the repair.",
    landlordReadyForPaymentApprovalAt: "2026-04-02T15:08:00.000Z",
    locationTrackingPlaceholder: "Dispatch tracking placeholder",
    idleMovementTimeoutPlaceholder: "Idle movement timeout placeholder",
    vendorRequests: [
      {
        vendorUserId: "vendor-atlas",
        vendorBusinessName: "Atlas Service Group",
        status: "Vendor selected",
        requestedAt: "2026-04-02T11:31:00.000Z",
        selectedAt: "2026-04-02T11:45:00.000Z",
      },
    ],
  },
  {
    id: "ticket-5",
    propertyId: "property-maple",
    tenantUserId: "tenant-jordan",
    tenantEmail: "jordan@renttruth.com",
    unitNumber: "12A",
    issueTitle: "Dishwasher not draining properly",
    category: "Appliance",
    description: "Water remains after every cycle.",
    photoUploadPlaceholder: "dishwasher-standing-water.jpg",
    urgent: false,
    status: "Follow-up needed",
    submittedAt: "Mar 28, 5:12 PM",
    trendBucket: "unresolved",
    vendorUserId: "vendor-brightline",
    vendorBusinessName: "Brightline Repairs",
    assignedAt: "2026-03-28T17:20:00.000Z",
    acceptedAt: "2026-03-28T18:10:00.000Z",
    enRouteAt: "2026-03-29T08:10:00.000Z",
    arrivedAt: "2026-03-29T09:00:00.000Z",
    workStartedAt: "2026-03-29T09:25:00.000Z",
    completedAt: "2026-03-29T11:50:00.000Z",
    vendorCompletionNotes: "Cleared standing water and cleaned the drain path, but tenant reported the issue returned on the next cycle.",
    tenantConfirmationStatus: "Follow-up needed",
    tenantConfirmationAt: "2026-03-29T18:00:00.000Z",
    tenantFeedback: "Still seeing water after the evening cycle.",
    repairApprovalRequest: {
      summary: "Drain pump likely needs replacement",
      pricingItem: "drain-clearing",
      partCost: 185,
      baselinePrice: 145,
      priceDeltaPercent: 28,
      exceedsBaselineWarning: "Requested part cost is 28% above this vendor's usual baseline for drain-clearing work. Ask for the reason behind the higher quote before approving.",
      laborImpact: "Adds roughly 1.5 hours and a return visit after parts pickup.",
      notes: "Initial clean-out improved flow temporarily, but the pump is still weak under a full load.",
      requestedAt: "2026-03-29T18:10:00.000Z",
      status: "Pending landlord approval",
    },
    locationTrackingPlaceholder: "Dispatch tracking placeholder",
    idleMovementTimeoutPlaceholder: "Idle movement timeout placeholder",
    vendorRequests: [
      {
        vendorUserId: "vendor-brightline",
        vendorBusinessName: "Brightline Repairs",
        status: "Vendor selected",
        requestedAt: "2026-03-28T16:55:00.000Z",
        selectedAt: "2026-03-28T17:20:00.000Z",
      },
    ],
  },
];

const seedSupportTickets: SupportTicket[] = [
  {
    id: "support-1",
    category: "Bug",
    subject: "Join property screen stalls after address selection",
    description:
      "Tenant selected the property address but the unit field did not unlock until the page was refreshed.",
    screenshotPlaceholder: "Screenshot placeholder attached",
    urgency: "High",
    status: "New",
    userRole: "tenant",
    userId: "tenant-maya",
    userEmail: "maya@renttruth.com",
    userName: "Maya Chen",
    createdAt: "Today, 10:12 AM",
  },
  {
    id: "support-2",
    category: "Feature Request",
    subject: "Need CSV export for landlord ticket analytics",
    description:
      "Landlord wants to export monthly repair metrics and vendor response times for owners and investors.",
    screenshotPlaceholder: "No file uploaded",
    urgency: "Normal",
    status: "Open",
    userRole: "landlord",
    userId: "landlord-harbor",
    userEmail: "owner@renttruth.com",
    userName: "Olivia Harper",
    createdAt: "Apr 18, 3:40 PM",
    assignedSupportStaff: "Avery Kim",
  },
  {
    id: "support-3",
    category: "Support",
    subject: "Vendor profile save confirmation unclear",
    description:
      "Vendor updated licensing fields and expected a stronger confirmation after saving the compliance profile.",
    screenshotPlaceholder: "Screenshot placeholder attached",
    urgency: "Normal",
    status: "In progress",
    userRole: "vendor",
    userId: "vendor-atlas",
    userEmail: "vendor@renttruth.com",
    userName: "Atlas Service Group",
    createdAt: "Apr 17, 9:05 AM",
    assignedSupportStaff: "Jordan Lee",
  },
  {
    id: "support-4",
    category: "Safety",
    subject: "Occupied-home eligibility wording review",
    description:
      "Landlord asked for clearer language when a vendor is not eligible for occupied homes but can still appear in the marketplace.",
    screenshotPlaceholder: "No file uploaded",
    urgency: "Urgent",
    status: "Open",
    userRole: "landlord",
    userId: "landlord-harbor",
    userEmail: "owner@renttruth.com",
    userName: "Olivia Harper",
    createdAt: "Apr 19, 8:22 PM",
    assignedSupportStaff: "Sam Rivera",
  },
  {
    id: "support-5",
    category: "Billing",
    subject: "Vendor asking when completion approval connects to payout",
    description:
      "Vendor wants to understand the future payment approval flow after landlord confirmation on completed jobs.",
    screenshotPlaceholder: "No file uploaded",
    urgency: "Low",
    status: "Resolved",
    userRole: "vendor",
    userId: "vendor-summit",
    userEmail: "summit@renttruth.com",
    userName: "Summit Home Systems",
    createdAt: "Apr 15, 1:10 PM",
    assignedSupportStaff: "Avery Kim",
  },
];

const STORE_SCHEMA_VERSION = 1;
const STORE_FILE_PATH =
  process.env.RENTTRUTH_DATA_FILE || join(process.cwd(), "data", "renttruth-db.json");
const DATABASE_STORE_ID = "primary";

let databasePool: Pool | null = null;
let databaseHydrationPromise: Promise<void> | null = null;
let databaseWriteQueue: Promise<void> = Promise.resolve();

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    ""
  );
}

function isDatabasePersistenceEnabled() {
  return Boolean(getDatabaseUrl());
}

function requiresDurablePersistence() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function assertLocalFilePersistenceAllowed() {
  if (requiresDurablePersistence()) {
    throw new Error(
      "Production persistence requires DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL_NON_POOLING. Local file storage is disabled in production.",
    );
  }
}

function getDatabasePool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  if (!databasePool) {
    const parsedUrl = new URL(databaseUrl);
    const isLocalhost =
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "::1";

    databasePool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
    });
  }

  return databasePool;
}

const adminBootstrapUsers = seedUsers.filter((user) => user.id === "admin-owner");
const demoSeedUserIds = new Set(seedUsers.filter((user) => user.id !== "admin-owner").map((user) => user.id));
const demoSeedPropertyIds = new Set(seedProperties.map((property) => property.id));
const demoSeedTicketIds = new Set(seedTickets.map((ticket) => ticket.id));
const demoSeedVendorProfileUserIds = new Set(seedVendorProfiles.map((profile) => profile.userId));
const demoSeedSupportTicketIds = new Set(seedSupportTickets.map((ticket) => ticket.id));

export function isDemoDataEnabled() {
  return process.env.RENTTRUTH_ENABLE_DEMO_DATA === "true";
}

export function isDemoUser(user: AppUser | null | undefined) {
  return Boolean(user && demoSeedUserIds.has(user.id));
}

export function isDemoProperty(property: Property | null | undefined) {
  return Boolean(property && demoSeedPropertyIds.has(property.id));
}

export function isDemoRepairTicket(ticket: RepairTicket | null | undefined) {
  return Boolean(ticket && demoSeedTicketIds.has(ticket.id));
}

export function isDemoVendorProfile(profile: VendorProfile | null | undefined) {
  return Boolean(profile && demoSeedVendorProfileUserIds.has(profile.userId));
}

export function isDemoSupportTicket(ticket: SupportTicket | null | undefined) {
  return Boolean(
    ticket &&
      demoSeedSupportTicketIds.has(ticket.id) &&
      ticket.userId &&
      demoSeedUserIds.has(ticket.userId),
  );
}

function cloneAccountLinkageSignals(user: AppUser) {
  return user.accountLinkageSignals ? [...user.accountLinkageSignals] : undefined;
}

function cloneUser(user: AppUser): AppUser {
  return {
    ...user,
    role: user.role === ("staff" as AppRole) ? "admin" : user.role,
    accountLinkageSignals: cloneAccountLinkageSignals(user),
  };
}

function cloneProperty(property: Property): Property {
  return { ...property };
}

function cloneTicket(ticket: RepairTicket): RepairTicket {
  return {
    ...ticket,
    attachment: ticket.attachment ? { ...ticket.attachment } : ticket.attachment,
    repairApprovalRequest: ticket.repairApprovalRequest
      ? { ...ticket.repairApprovalRequest }
      : ticket.repairApprovalRequest,
    vendorRequests: ticket.vendorRequests?.map((request) => ({ ...request })),
    messages: ticket.messages?.map((message) => ({ ...message })),
  };
}

function cloneVendorProfile(profile: VendorProfile): VendorProfile {
  return {
    ...profile,
    serviceCategories: [...profile.serviceCategories],
    serviceCities: profile.serviceCities ? [...profile.serviceCities] : undefined,
    baselineRepairPricing: profile.baselineRepairPricing.map((entry) => ({ ...entry })),
  };
}

function cloneSupportTicket(ticket: SupportTicket): SupportTicket {
  return { ...ticket };
}

function createSeededStore(): DemoStore {
  const includeDemoData = isDemoDataEnabled();
  const initialUsers = includeDemoData ? seedUsers : adminBootstrapUsers;
  const initialProperties = includeDemoData ? seedProperties : [];
  const initialTickets = includeDemoData ? seedTickets : [];
  const initialVendorProfiles = includeDemoData ? seedVendorProfiles : [];
  const initialSupportTickets = includeDemoData ? seedSupportTickets : [];

  return {
    schemaVersion: STORE_SCHEMA_VERSION,
    users: initialUsers.map(cloneUser),
    properties: initialProperties.map(cloneProperty),
    tickets: initialTickets.map((ticket) => {
      const clonedTicket = cloneTicket(ticket);
      return {
        ...clonedTicket,
        attachment:
          clonedTicket.attachment ??
          createRepairTicketAttachment({
            fileName: clonedTicket.photoUploadPlaceholder,
          }),
      };
    }),
    vendorProfiles: initialVendorProfiles.map(cloneVendorProfile),
    supportTickets: initialSupportTickets.map(cloneSupportTicket),
    activityEvents: [],
    notifications: [],
    propertyCounter: initialProperties.length + 1,
    ticketCounter: initialTickets.length + 1,
    userCounter: initialUsers.length + 1,
    supportTicketCounter: initialSupportTickets.length + 1,
    activityEventCounter: 1,
    notificationCounter: 1,
  };
}

function ensureAdminBootstrapUser(store: DemoStore) {
  for (const adminUser of adminBootstrapUsers) {
    const hasAdmin =
      store.users.some((user) => user.id === adminUser.id) ||
      store.users.some((user) => normalizeEmail(user.email) === normalizeEmail(adminUser.email));

    if (!hasAdmin) {
      store.users.push(cloneUser(adminUser));
    }
  }
}

function mergeSeedData(store: DemoStore) {
  for (const seedUser of seedUsers) {
    const hasUser =
      store.users.some((user) => user.id === seedUser.id) ||
      store.users.some((user) => normalizeEmail(user.email) === normalizeEmail(seedUser.email));

    if (!hasUser) {
      store.users.push(cloneUser(seedUser));
    }
  }

  for (const seedProperty of seedProperties) {
    if (!store.properties.some((property) => property.id === seedProperty.id)) {
      store.properties.push(cloneProperty(seedProperty));
    }
  }

  for (const seedTicket of seedTickets) {
    if (!store.tickets.some((ticket) => ticket.id === seedTicket.id)) {
      store.tickets.push(cloneTicket(seedTicket));
    }
  }

  for (const seedVendorProfile of seedVendorProfiles) {
    if (!store.vendorProfiles.some((profile) => profile.userId === seedVendorProfile.userId)) {
      store.vendorProfiles.push(cloneVendorProfile(seedVendorProfile));
    }
  }

  for (const seedSupportTicket of seedSupportTickets) {
    if (!store.supportTickets.some((ticket) => ticket.id === seedSupportTicket.id)) {
      store.supportTickets.push(cloneSupportTicket(seedSupportTicket));
    }
  }
}

function parseCounterFromId(id: string, prefix: string) {
  if (!id.startsWith(prefix)) {
    return 0;
  }

  const parsed = Number(id.slice(prefix.length));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCounters(store: DemoStore) {
  store.userCounter = Math.max(
    store.userCounter || 1,
    ...store.users.map((user) => parseCounterFromId(user.id, "user-") + 1),
    isDemoDataEnabled() ? seedUsers.length + 1 : 1,
  );
  store.propertyCounter = Math.max(
    store.propertyCounter || 1,
    ...store.properties.map((property) => parseCounterFromId(property.id, "property-") + 1),
    isDemoDataEnabled() ? seedProperties.length + 1 : 1,
  );
  store.ticketCounter = Math.max(
    store.ticketCounter || 1,
    ...store.tickets.map((ticket) => parseCounterFromId(ticket.id, "ticket-") + 1),
    isDemoDataEnabled() ? seedTickets.length + 1 : 1,
  );
  store.supportTicketCounter = Math.max(
    store.supportTicketCounter || 1,
    ...store.supportTickets.map((ticket) => parseCounterFromId(ticket.id, "support-") + 1),
    isDemoDataEnabled() ? seedSupportTickets.length + 1 : 1,
  );
  store.activityEventCounter = Math.max(
    store.activityEventCounter || 1,
    ...store.activityEvents.map((event) => parseCounterFromId(event.id, "activity-") + 1),
  );
  store.notificationCounter = Math.max(
    store.notificationCounter || 1,
    ...store.notifications.map((notification) => parseCounterFromId(notification.id, "notification-") + 1),
  );
}

function normalizeStore(input: Partial<DemoStore>): DemoStore {
  const store: DemoStore = {
    schemaVersion: STORE_SCHEMA_VERSION,
    users: Array.isArray(input.users) ? input.users.map(cloneUser) : [],
    properties: Array.isArray(input.properties) ? input.properties.map(cloneProperty) : [],
    tickets: Array.isArray(input.tickets) ? input.tickets.map(cloneTicket) : [],
    vendorProfiles: Array.isArray(input.vendorProfiles)
      ? input.vendorProfiles.map(cloneVendorProfile)
      : [],
    supportTickets: Array.isArray(input.supportTickets)
      ? input.supportTickets.map(cloneSupportTicket)
      : [],
    activityEvents: Array.isArray(input.activityEvents)
      ? input.activityEvents.map((event) => ({ ...event }))
      : [],
    notifications: Array.isArray(input.notifications)
      ? input.notifications.map((notification) => ({ ...notification }))
      : [],
    propertyCounter: input.propertyCounter ?? 1,
    ticketCounter: input.ticketCounter ?? 1,
    userCounter: input.userCounter ?? 1,
    supportTicketCounter: input.supportTicketCounter ?? 1,
    activityEventCounter: input.activityEventCounter ?? 1,
    notificationCounter: input.notificationCounter ?? 1,
  };

  ensureAdminBootstrapUser(store);
  if (isDemoDataEnabled()) {
    mergeSeedData(store);
  }
  normalizeCounters(store);
  return store;
}

function cloneStoreSnapshot(input: DemoStore): DemoStore {
  return normalizeStore(JSON.parse(JSON.stringify(input)) as Partial<DemoStore>);
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

function applyStoreSnapshot(nextStore: DemoStore) {
  store.schemaVersion = nextStore.schemaVersion;
  replaceArray(store.users, nextStore.users);
  replaceArray(store.properties, nextStore.properties);
  replaceArray(store.tickets, nextStore.tickets);
  replaceArray(store.vendorProfiles, nextStore.vendorProfiles);
  replaceArray(store.supportTickets, nextStore.supportTickets);
  replaceArray(store.activityEvents, nextStore.activityEvents);
  replaceArray(store.notifications, nextStore.notifications);
  store.propertyCounter = nextStore.propertyCounter;
  store.ticketCounter = nextStore.ticketCounter;
  store.userCounter = nextStore.userCounter;
  store.supportTicketCounter = nextStore.supportTicketCounter;
  store.activityEventCounter = nextStore.activityEventCounter;
  store.notificationCounter = nextStore.notificationCounter;
}

async function ensureDatabaseStoreTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS renttruth_store (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function ensureDatabaseUsersTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS renttruth_users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      role text NOT NULL,
      name text,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

function normalizeDatabaseUser(input: unknown) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const user = cloneUser(input as AppUser);

  if (!user.id || !user.email || !user.password || !user.role) {
    return null;
  }

  user.email = normalizeEmail(user.email);
  return user;
}

async function readDatabaseUsers() {
  const pool = getDatabasePool();

  if (!pool) {
    return [];
  }

  await ensureDatabaseUsersTable(pool);
  const result = await pool.query<{ data: AppUser }>(
    "SELECT data FROM renttruth_users ORDER BY created_at ASC, id ASC",
  );

  return result.rows
    .map((row) => normalizeDatabaseUser(row.data))
    .filter((user): user is AppUser => Boolean(user));
}

async function readDatabaseUserByEmail(email: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return null;
  }

  await ensureDatabaseUsersTable(pool);
  const result = await pool.query<{ data: AppUser }>(
    "SELECT data FROM renttruth_users WHERE email = $1 LIMIT 1",
    [normalizeEmail(email)],
  );

  return normalizeDatabaseUser(result.rows[0]?.data);
}

async function readDatabaseUserById(userId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return null;
  }

  await ensureDatabaseUsersTable(pool);
  const result = await pool.query<{ data: AppUser }>(
    "SELECT data FROM renttruth_users WHERE id = $1 LIMIT 1",
    [userId],
  );

  return normalizeDatabaseUser(result.rows[0]?.data);
}

async function writeDatabaseUser(user: AppUser) {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("DATABASE_URL is required to save production users.");
  }

  await ensureDatabaseUsersTable(pool);
  const result = await pool.query(
    `
      INSERT INTO renttruth_users (id, email, password, role, name, data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, COALESCE($7::timestamptz, now()), now())
      ON CONFLICT (email)
      DO NOTHING
    `,
    [
      user.id,
      normalizeEmail(user.email),
      user.password,
      user.role,
      user.name ?? null,
      JSON.stringify(user),
      user.createdAt ?? null,
    ],
  );

  if (result.rowCount !== 1) {
    throw new Error(`User with email ${user.email} already exists.`);
  }
}

async function upsertDatabaseUser(user: AppUser) {
  const pool = getDatabasePool();

  if (!pool) {
    return;
  }

  await ensureDatabaseUsersTable(pool);
  await pool.query(
    `
      INSERT INTO renttruth_users (id, email, password, role, name, data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, COALESCE($7::timestamptz, now()), now())
      ON CONFLICT (email)
      DO UPDATE SET
        id = EXCLUDED.id,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        data = EXCLUDED.data,
        updated_at = now()
    `,
    [
      user.id,
      normalizeEmail(user.email),
      user.password,
      user.role,
      user.name ?? null,
      JSON.stringify(user),
      user.createdAt ?? null,
    ],
  );
}

async function syncDatabaseUsersFromStore() {
  if (!isDatabasePersistenceEnabled()) {
    return;
  }

  const usersToSync = store.users.filter((user) => !isDemoUser(user));

  for (const user of usersToSync) {
    await upsertDatabaseUser(user);
  }
}

async function migrateDatabaseStoreUsersToUserTableIfNeeded(databaseUsers: AppUser[]) {
  if (databaseUsers.length > 0) {
    return databaseUsers;
  }

  const usersToMigrate = store.users.filter((user) => user.role !== "admin" && !isDemoUser(user));

  for (const user of usersToMigrate) {
    await writeDatabaseUser(user);
  }

  return readDatabaseUsers();
}

function applyDatabaseUsers(databaseUsers: AppUser[]) {
  const nextUsers = [...adminBootstrapUsers.map(cloneUser)];

  for (const databaseUser of databaseUsers) {
    const normalizedEmail = normalizeEmail(databaseUser.email);
    const existingIndex = nextUsers.findIndex(
      (user) => user.id === databaseUser.id || normalizeEmail(user.email) === normalizedEmail,
    );

    if (existingIndex >= 0) {
      nextUsers[existingIndex] = cloneUser(databaseUser);
    } else {
      nextUsers.push(cloneUser(databaseUser));
    }
  }

  replaceArray(store.users, nextUsers);
  normalizeCounters(store);
}

async function readDatabaseStore() {
  const pool = getDatabasePool();

  if (!pool) {
    return null;
  }

  await ensureDatabaseStoreTable(pool);
  const result = await pool.query<{ data: Partial<DemoStore> }>(
    "SELECT data FROM renttruth_store WHERE id = $1 LIMIT 1",
    [DATABASE_STORE_ID],
  );
  const row = result.rows[0];

  return row?.data ? normalizeStore(row.data) : null;
}

async function writeDatabaseStoreSnapshot(snapshot: DemoStore) {
  const pool = getDatabasePool();

  if (!pool) {
    return;
  }

  await ensureDatabaseStoreTable(pool);
  await pool.query(
    `
      INSERT INTO renttruth_store (id, data, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `,
    [DATABASE_STORE_ID, JSON.stringify(snapshot)],
  );
}

function queueDatabaseWrite() {
  const snapshot = cloneStoreSnapshot(store);

  databaseWriteQueue = databaseWriteQueue
    .catch(() => undefined)
    .then(() => writeDatabaseStoreSnapshot(snapshot))
    .catch((error) => {
      console.error(
        "RentTruth database store could not be written. Check DATABASE_URL and database permissions.",
        error,
      );
    });

  try {
    after(() => databaseWriteQueue);
  } catch {
    // Outside a Next.js request lifecycle, the queued promise still runs normally.
  }
}

function readPersistentStore() {
  if (!existsSync(STORE_FILE_PATH)) {
    return null;
  }

  try {
    return normalizeStore(JSON.parse(readFileSync(STORE_FILE_PATH, "utf8")) as Partial<DemoStore>);
  } catch (error) {
    console.error("RentTruth persistent store could not be read. Falling back to safe seed data.", error);
    return null;
  }
}

function writePersistentStore(store: DemoStore) {
  if (isDatabasePersistenceEnabled()) {
    queueDatabaseWrite();
    return;
  }

  assertLocalFilePersistenceAllowed();
  mkdirSync(dirname(STORE_FILE_PATH), { recursive: true });
  const payload = JSON.stringify(store, null, 2);
  const tempPath = `${STORE_FILE_PATH}.${process.pid}.${Date.now()}.${Math.random()
    .toString(36)
    .slice(2)}.tmp`;
  writeFileSync(tempPath, payload);
  renameSync(tempPath, STORE_FILE_PATH);
}

async function persistStoreNow() {
  if (isDatabasePersistenceEnabled()) {
    await writeDatabaseStoreSnapshot(cloneStoreSnapshot(store));
    return;
  }

  writePersistentStore(store);
}

function createDemoStore(): DemoStore {
  if (isDatabasePersistenceEnabled()) {
    return createSeededStore();
  }

  if (requiresDurablePersistence()) {
    return createSeededStore();
  }

  const persistentStore = readPersistentStore();

  if (persistentStore) {
    writePersistentStore(persistentStore);
    return persistentStore;
  }

  const seededStore = createSeededStore();
  writePersistentStore(seededStore);
  return seededStore;
}

declare global {
  var __renttruthDemoStore: DemoStore | undefined;
}

const store = globalThis.__renttruthDemoStore ?? createDemoStore();

if (!globalThis.__renttruthDemoStore) {
  globalThis.__renttruthDemoStore = store;
}

const users = store.users;
const properties = store.properties;
const tickets = store.tickets;
const vendorProfiles = store.vendorProfiles;
const supportTickets = store.supportTickets;
const activityEvents = store.activityEvents;
const notifications = store.notifications;

function persistStore() {
  try {
    writePersistentStore(store);
  } catch (error) {
    console.error("RentTruth persistent store could not be written.", error);
    throw error;
  }
}

export async function hydratePersistentStore() {
  if (!isDatabasePersistenceEnabled()) {
    return;
  }

  databaseHydrationPromise = (async () => {
    try {
      const databaseStore = await readDatabaseStore();

      if (databaseStore) {
        applyStoreSnapshot(databaseStore);
      } else {
        const localStore = requiresDurablePersistence() ? null : readPersistentStore();
        const initialStore = localStore ?? cloneStoreSnapshot(store);
        applyStoreSnapshot(initialStore);
        await writeDatabaseStoreSnapshot(cloneStoreSnapshot(store));
      }
      await syncDatabaseUsersFromStore();
      const databaseUsers = await migrateDatabaseStoreUsersToUserTableIfNeeded(await readDatabaseUsers());
      applyDatabaseUsers(databaseUsers);
    } catch (error) {
      console.error(
        "RentTruth database store could not be read. Check DATABASE_URL and database permissions.",
        error,
      );
      if (requiresDurablePersistence()) {
        throw error;
      }
    }
  })();

  await databaseHydrationPromise;
}

export async function flushPersistentStore() {
  if (!isDatabasePersistenceEnabled()) {
    return;
  }

  await databaseWriteQueue;
  await syncDatabaseUsersFromStore();
}

function recordActivity(input: {
  type: string;
  actorUserId?: string;
  actorRole?: AppRole;
  entityType?: string;
  entityId?: string;
  message: string;
}) {
  const event: ActivityEvent = {
    id: `activity-${store.activityEventCounter}`,
    type: input.type,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message,
    createdAt: new Date().toISOString(),
  };

  store.activityEventCounter += 1;
  activityEvents.unshift(event);
  notifications.unshift({
    id: `notification-${store.notificationCounter}`,
    role: input.actorRole,
    userId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message,
    createdAt: event.createdAt,
  });
  store.notificationCounter += 1;
  return event;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeZipCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function isValidNormalizedZip(value: string) {
  return normalizeZipCode(value).length === 5;
}

function toDisplayName(email: string) {
  const localPart = normalizeEmail(email).split("@")[0] ?? "Tenant";
  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatJoinCodeSegment(seed: string) {
  const cleaned = seed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned.slice(0, 6).padEnd(6, "X");
}

function makeUniqueJoinCode(seed: string) {
  let candidate = `${formatJoinCodeSegment(seed)}${store.propertyCounter}`;

  while (properties.some((property) => property.joinCode === candidate)) {
    store.propertyCounter += 1;
    candidate = `${formatJoinCodeSegment(seed)}${store.propertyCounter}`;
  }

  return candidate;
}

export function isMembershipStatus(value: string): value is MembershipStatus {
  return membershipStatuses.includes(value as MembershipStatus);
}

export function getPropertyTypes() {
  return propertyTypes;
}

export function getVendorServiceCategories() {
  return vendorServiceCategories;
}

export function getCommonRepairPricingItems() {
  return commonRepairPricingCatalog;
}

export function getSupportTicketCategories() {
  return supportTicketCategories;
}

export function getSupportTicketUrgencies() {
  return supportTicketUrgencies;
}

export function getSupportTicketStatuses() {
  return supportTicketStatuses;
}

export function propertyTypeRequiresUnit(propertyType: PropertyType) {
  return propertyType !== "House";
}

export function isPropertyType(value: string): value is PropertyType {
  return propertyTypes.includes(value as PropertyType);
}

export function getPropertyDisplayName(property: Property) {
  return property.name?.trim() || property.streetAddress;
}

function getUnitBuildingSegment(input: { unitNumber?: string; buildingNumber?: string }) {
  const parts = [
    input.unitNumber?.trim() ? `Apt ${input.unitNumber.trim().toUpperCase()}` : "",
    input.buildingNumber?.trim() ? `Building ${input.buildingNumber.trim().toUpperCase()}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? `, ${parts.join(" ")}` : "";
}

function normalizeUnitValue(value?: string) {
  return (value ?? "")
    .trim()
    .replace(/^(apartment|apt|unit|suite|ste|#)\s+/i, "")
    .trim()
    .toUpperCase();
}

function normalizeBuildingValue(value?: string) {
  return (value ?? "")
    .trim()
    .replace(/^(building|bldg|bld)\s+/i, "")
    .trim()
    .toUpperCase();
}

function normalizeOptionalUnitValue(value?: string) {
  return normalizeUnitValue(value) || undefined;
}

function normalizeOptionalBuildingValue(value?: string) {
  return normalizeBuildingValue(value) || undefined;
}

export function getPropertyFullAddress(property: Property) {
  const unitSegment =
    propertyTypeRequiresUnit(property.propertyType)
      ? getUnitBuildingSegment(property)
      : "";

  return `${property.streetAddress}${unitSegment}, ${property.city}, ${property.state} ${property.zip}`;
}

export function getPropertyServiceAddress(property: Property, unitNumber?: string) {
  const normalizedUnit = (unitNumber || property.unitNumber)?.trim().toUpperCase();
  const unitSegment =
    propertyTypeRequiresUnit(property.propertyType)
      ? getUnitBuildingSegment({
          unitNumber: normalizedUnit,
          buildingNumber: property.buildingNumber,
        })
      : "";

  return `${property.streetAddress}${unitSegment}, ${property.city}, ${property.state} ${property.zip}`;
}

export function getUnitLabel(propertyType: PropertyType) {
  return propertyType === "Apartment" || propertyType === "Multi-unit building"
    ? "Unit / Apartment number"
    : "Unit / Residence number";
}

export function getPropertyAccessInstructions(property: Property) {
  const propertyName = getPropertyDisplayName(property);
  const residenceLine = propertyTypeRequiresUnit(property.propertyType)
    ? "After login, the tenant enters the join code and their unit or apartment number."
    : "After login, the tenant enters the join code. No unit number is needed for this house.";

  return `RentTruth active tenant access\nProperty: ${propertyName}\nAddress: ${getPropertyFullAddress(property)}\nJoin code: ${property.joinCode}\nInstructions: Sign up with name, email, and password. Then log in and use the Join a Property flow. ${residenceLine}`;
}

export function getAddressSuggestions() {
  return addressDirectory;
}

export function searchAddressSuggestions(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return addressDirectory;
  }

  return addressDirectory.filter((suggestion) =>
    suggestion.label.toLowerCase().includes(normalized),
  );
}

export function findAddressSuggestionById(suggestionId: string) {
  return addressDirectory.find((suggestion) => suggestion.id === suggestionId) ?? null;
}

function formatMinutes(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "--";
  }

  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function diffMinutes(start?: string, end?: string) {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = (endDate.getTime() - startDate.getTime()) / 60000;

  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

function averageFrom(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getNowIso() {
  return new Date().toISOString();
}

function isDateExpired(dateValue: string) {
  if (!dateValue) {
    return false;
  }

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() < Date.now();
}

const stateNames: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming",
};

function normalizeServiceAreaTokens(serviceArea: string) {
  return serviceArea
    .toLowerCase()
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeRepairPricingLabel(item?: CommonRepairPricingItem) {
  if (!item) {
    return "this repair item";
  }

  return commonRepairPricingCatalog.find((entry) => entry.item === item)?.label ?? item;
}

function inferRepairPricingItem(summary: string) {
  const normalized = summary.trim().toLowerCase();

  if (normalized.includes("capacitor")) {
    return "capacitor";
  }

  if (normalized.includes("compressor")) {
    return "compressor";
  }

  if (normalized.includes("thermostat")) {
    return "thermostat";
  }

  if (normalized.includes("drain")) {
    return "drain-clearing";
  }

  if (normalized.includes("fan motor") || normalized.includes("fan-motor")) {
    return "fan-motor";
  }

  if (normalized.includes("contactor")) {
    return "contactor";
  }

  return undefined;
}

function findVendorBaselineRepairPrice(
  profile: VendorProfile,
  item?: CommonRepairPricingItem,
) {
  if (!item) {
    return null;
  }

  return profile.baselineRepairPricing.find((entry) => entry.item === item) ?? null;
}

function vendorServesProperty(profile: VendorProfile, property: Property) {
  return vendorServesLocation(profile, property.city, property.state);
}

function vendorServesLocation(profile: VendorProfile, cityValue: string, stateValue: string) {
  const city = cityValue.trim().toLowerCase();
  const state = stateValue.trim().toLowerCase();
  const stateName = stateNames[stateValue.trim().toUpperCase()] ?? state;
  const structuredState = profile.serviceState?.trim().toLowerCase();
  const structuredCities = profile.serviceCities?.map((entry) => entry.trim().toLowerCase()) ?? [];

  if (structuredState || structuredCities.length > 0) {
    const stateMatches =
      !structuredState ||
      structuredState === state ||
      structuredState === stateValue.trim().toUpperCase().toLowerCase() ||
      structuredState === stateName;
    const cityMatches = structuredCities.length === 0 || structuredCities.includes(city);

    if (stateMatches && cityMatches) {
      return true;
    }
  }

  const tokens = normalizeServiceAreaTokens(profile.serviceArea);

  return tokens.some(
    (token) => token === city || token === state || token === stateName,
  );
}

function initializeDispatchPlaceholders(ticket: RepairTicket) {
  ticket.enRouteAt = undefined;
  ticket.locationTrackingPlaceholder = "Location tracking placeholder";
  ticket.idleMovementTimeoutPlaceholder = "Idle/no-movement timeout placeholder";
}

function ensureVendorRequests(ticket: RepairTicket) {
  if (!ticket.vendorRequests) {
    ticket.vendorRequests = [];
  }

  return ticket.vendorRequests;
}

function findVendorRequest(ticket: RepairTicket, vendorUserId: string) {
  return ensureVendorRequests(ticket).find((request) => request.vendorUserId === vendorUserId) ?? null;
}

function isTicketCompletedForMetrics(ticket: RepairTicket) {
  return (
    ticket.status === "Waiting for tenant confirmation" ||
    ticket.status === "Tenant confirmed fixed" ||
    ticket.status === "Ready for landlord payment approval" ||
    ticket.status === "Closed" ||
    ticket.status === "Completed"
  );
}

function isTicketActiveForVendor(ticket: RepairTicket) {
  return (
    ticket.status === "Assigned" ||
    ticket.status === "Vendor selected" ||
    ticket.status === "Vendor arrived" ||
    ticket.status === "In progress" ||
    ticket.status === "Follow-up needed"
  );
}

function isTicketEligibleForVendorAvailability(ticket: RepairTicket) {
  const eligibleStatuses = new Set(["Open", "Open to vendors", "Vendor interested"]);
  const excludedStatuses = new Set([
    "Resolved",
    "Closed",
    "Completed",
    "Cancelled",
    "Canceled",
    "Paid",
    "Tenant confirmed fixed",
    "Ready for landlord payment approval",
    "Waiting for tenant confirmation",
    "Landlord vendor assigned",
    "Vendor selected",
    "Assigned",
    "Vendor arrived",
    "In progress",
    "Follow-up needed",
  ]);

  return (
    eligibleStatuses.has(ticket.status) &&
    !excludedStatuses.has(ticket.status) &&
    !ticket.vendorUserId &&
    !ticket.landlordVendorName &&
    !ticket.landlordVendorAssignedAt &&
    !ticket.completedAt &&
    ticket.tenantConfirmationStatus !== "Tenant confirmed fixed"
  );
}

function syncTicketStatusFromVendorRequests(ticket: RepairTicket) {
  if (ticket.vendorUserId) {
    if (ticket.status === "Waiting for tenant confirmation") {
      return ticket;
    }

    if (ticket.status === "Tenant confirmed fixed") {
      return ticket;
    }

    if (ticket.status === "Ready for landlord payment approval") {
      return ticket;
    }

    if (ticket.status === "Closed") {
      return ticket;
    }

    if (ticket.status === "Follow-up needed") {
      return ticket;
    }

    if (ticket.status === "Landlord vendor assigned") {
      return ticket;
    }

    ticket.status = ticket.arrivedAt
      ? "Vendor arrived"
      : ticket.workStartedAt
        ? "In progress"
        : "Vendor selected";
    return ticket;
  }

  const activeRequests = ensureVendorRequests(ticket).filter(
    (request) => request.status === "Vendor interested",
  );

  ticket.status = activeRequests.length > 0 ? "Vendor interested" : "Open to vendors";
  return ticket;
}

export function findVendorProfileByUserId(userId: string) {
  return vendorProfiles.find((profile) => profile.userId === userId) ?? null;
}

export function getVendorProfiles() {
  return vendorProfiles.slice().sort((a, b) => a.businessName.localeCompare(b.businessName));
}

export function getVendorProfilesForCategory(category: string) {
  return getVendorProfiles().filter((profile) => profile.serviceCategories.includes(category as VendorServiceCategory));
}

export function getVendorProfilesForAssignment(input: {
  category: string;
  city: string;
  state: string;
}) {
  return getVendorProfiles().filter(
    (profile) =>
      profile.serviceCategories.includes(input.category as VendorServiceCategory) &&
      vendorServesLocation(profile, input.city, input.state),
  );
}

export function getVendorComplianceBadge(profile: VendorProfile) {
  const licenseExpired = isDateExpired(profile.licenseExpirationDate);
  const insuranceExpired = isDateExpired(profile.insuranceExpirationDate);
  const hasDocs =
    profile.licenseDocumentUploaded ||
    profile.insuranceDocumentUploaded ||
    profile.businessRegistrationDocumentUploaded;

  if (!hasDocs) {
    return "No documents on file";
  }

  if (licenseExpired) {
    return "License expired";
  }

  if (insuranceExpired) {
    return "Insurance expired";
  }

  const licensed = profile.licenseStatus === "Verified on file";
  const insured = profile.insuranceStatus === "Verified on file";

  if (licensed && insured) {
    return "Licensed & Insured";
  }

  if (licensed) {
    return "Licensed only";
  }

  if (insured) {
    return "Insured only";
  }

  return "Not verified";
}

export function getVendorVerificationBadges(profile: VendorProfile) {
  return [
    profile.backgroundCheckStatus,
    profile.identityVerificationStatus,
    profile.occupiedHomeEligibilityStatus,
  ];
}

export function isHighRiskCategory(category: string) {
  return category === "AC" || category === "Electrical" || category === "Plumbing";
}

export function getVendorAssignmentWarnings(profile: VendorProfile, category: string) {
  const warnings: string[] = [];
  const reliability = getVendorPerformanceMetrics(profile.userId);

  if (isHighRiskCategory(category) && profile.licenseStatus !== "Verified on file") {
    warnings.push("Licensing is not verified on file for this higher-risk trade.");
  }

  if (isDateExpired(profile.licenseExpirationDate)) {
    warnings.push("The license expiration date on file appears to be past due.");
  }

  if (profile.insuranceStatus !== "Verified on file") {
    warnings.push("Insurance is not verified on file.");
  }

  if (isDateExpired(profile.insuranceExpirationDate)) {
    warnings.push("The insurance expiration date on file appears to be past due.");
  }

  if (profile.backgroundCheckStatus !== "Background Check Complete") {
    warnings.push("Background check status is not complete.");
  }

  if (profile.identityVerificationStatus !== "Identity Verified") {
    warnings.push("Identity verification is not complete.");
  }

  if (profile.occupiedHomeEligibilityStatus !== "Eligible for Occupied Homes") {
    warnings.push("This vendor is not currently marked eligible for occupied homes.");
  }

  if (reliability.completionRateValue < 85) {
    warnings.push("Completion rate is below the preferred threshold for reliable assignment coverage.");
  }

  if (reliability.dropRateValue > 10) {
    warnings.push("Drop rate is elevated, which can increase reassignment risk after acceptance.");
  }

  return warnings;
}

export function getVendorPerformanceMetrics(vendorUserId: string) {
  const vendorTickets = tickets.filter((ticket) => ticket.vendorUserId === vendorUserId);
  const profile = findVendorProfileByUserId(vendorUserId);
  const selectedRequests = tickets
    .flatMap((ticket) =>
      (ticket.vendorRequests ?? [])
        .filter(
          (request) =>
            request.vendorUserId === vendorUserId && request.status === "Vendor selected",
        )
        .map((request) => ({ ticket, request })),
    );
  const acceptedJobs = selectedRequests.filter(({ ticket }) => !isTicketCompletedForMetrics(ticket));
  const completedJobs = vendorTickets.filter((ticket) => isTicketCompletedForMetrics(ticket));
  const acceptanceTimes = selectedRequests
    .map(({ request }) => diffMinutes(request.requestedAt, request.selectedAt))
    .filter((value): value is number => value !== null);
  const arrivalTimes = vendorTickets
    .map((ticket) => diffMinutes(ticket.assignedAt, ticket.arrivedAt))
    .filter((value): value is number => value !== null);
  const completionTimes = vendorTickets
    .map((ticket) => diffMinutes(ticket.workStartedAt ?? ticket.assignedAt, ticket.completedAt))
    .filter((value): value is number => value !== null);
  const assignedCount = profile?.jobsAssignedCount ?? vendorTickets.length;
  const acceptedCount = profile?.jobsAcceptedCount ?? acceptedJobs.length;
  const completedCount = profile?.jobsCompletedCount ?? completedJobs.length;
  const droppedCount = profile?.jobsDroppedCount ?? 0;
  const completionRateValue = acceptedCount > 0 ? (completedCount / acceptedCount) * 100 : 0;
  const dropRateValue = acceptedCount > 0 ? (droppedCount / acceptedCount) * 100 : 0;
  const availableJobs = getAvailableVendorJobs(vendorUserId);

  return {
    availableJobs: availableJobs.length,
    acceptedJobs: acceptedJobs.filter(({ ticket }) => !isTicketCompletedForMetrics(ticket)).length,
    completedJobs: completedJobs.length,
    jobsAssigned: assignedCount,
    jobsAccepted: acceptedCount,
    jobsCompleted: completedCount,
    jobsDropped: droppedCount,
    completionRate: `${Math.round(completionRateValue)}%`,
    dropRate: `${Math.round(dropRateValue)}%`,
    completionRateValue,
    dropRateValue,
    averageAcceptanceTime: formatMinutes(averageFrom(acceptanceTimes) ?? 0),
    averageArrivalTime: formatMinutes(averageFrom(arrivalTimes) ?? 0),
    averageCompletionTime: formatMinutes(averageFrom(completionTimes) ?? 0),
  };
}

export function findUserById(userId: string) {
  return users.find((user) => user.id === userId) ?? null;
}

export function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  return users.find((user) => user.email === normalized) ?? null;
}

export function getUsers() {
  return users.slice().sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

export async function findUserByIdPersisted(userId: string) {
  await hydratePersistentStore();

  const storeUser = findUserById(userId);

  if (storeUser) {
    return storeUser;
  }

  if (isDatabasePersistenceEnabled()) {
    const user = await readDatabaseUserById(userId);

    if (user) {
      return user;
    }
  }

  return null;
}

export async function findUserByEmailPersisted(email: string) {
  if (isDatabasePersistenceEnabled()) {
    const user = await readDatabaseUserByEmail(email);

    if (user) {
      return user;
    }
  }

  await hydratePersistentStore();
  return findUserByEmail(email);
}

export async function getUsersPersisted() {
  if (isDatabasePersistenceEnabled()) {
    const databaseUsers = await readDatabaseUsers();
    applyDatabaseUsers(databaseUsers);
  } else {
    await hydratePersistentStore();
  }

  return getUsers();
}

export function upsertVendorProfile(input: VendorProfile) {
  const existing = findVendorProfileByUserId(input.userId);

  if (existing) {
    Object.assign(existing, {
      ...input,
      serviceCategories: [...input.serviceCategories],
      baselineRepairPricing: input.baselineRepairPricing.map((entry) => ({ ...entry })),
    });
    recordActivity({
      type: "vendor_profile_updated",
      actorUserId: input.userId,
      actorRole: "vendor",
      entityType: "vendorProfile",
      entityId: input.userId,
      message: `${input.businessName} updated their vendor profile.`,
    });
    persistStore();
    return existing;
  }

  const profile = {
    ...input,
    serviceCategories: [...input.serviceCategories],
    baselineRepairPricing: input.baselineRepairPricing.map((entry) => ({ ...entry })),
  };
  vendorProfiles.push(profile);
  recordActivity({
    type: "vendor_profile_created",
    actorUserId: input.userId,
    actorRole: "vendor",
    entityType: "vendorProfile",
    entityId: input.userId,
    message: `${input.businessName} created a vendor profile.`,
  });
  persistStore();
  return profile;
}

export function updateVendorVerificationProfile(input: {
  vendorUserId: string;
  identityVerificationStatus: VerificationStatus;
  licenseStatus: ComplianceStatus;
  insuranceStatus: ComplianceStatus;
  backgroundCheckStatus: VerificationStatus;
}) {
  const profile = findVendorProfileByUserId(input.vendorUserId);

  if (!profile) {
    return null;
  }

  profile.identityVerificationStatus = input.identityVerificationStatus;
  profile.licenseStatus = input.licenseStatus;
  profile.insuranceStatus = input.insuranceStatus;
  profile.backgroundCheckStatus = input.backgroundCheckStatus;
  profile.occupiedHomeEligibilityStatus =
    input.identityVerificationStatus === "Identity Verified" &&
    input.backgroundCheckStatus === "Background Check Complete"
      ? "Eligible for Occupied Homes"
      : "Verification Pending";
  recordActivity({
    type: "vendor_verification_updated",
    actorRole: "admin",
    entityType: "vendorProfile",
    entityId: input.vendorUserId,
    message: `${profile.businessName} verification statuses were updated by admin.`,
  });
  persistStore();
  return profile;
}

export function validateUserLogin(email: string, password: string, role: AppRole) {
  const user = findUserByEmail(email);

  if (!user || user.password !== password || user.role !== role) {
    return null;
  }

  return user;
}

export async function validateUserLoginPersisted(email: string, password: string, role: AppRole) {
  const user = await findUserByEmailPersisted(email);

  if (!user || user.password !== password || user.role !== role) {
    return null;
  }

  return user;
}

export function createUser(input: CreateUserInput, options: CreateUserOptions = {}) {
  const shouldPersist = options.persist ?? true;
  const normalizedEmail = normalizeEmail(input.email);
  const user: AppUser = {
    id: options.id ?? `user-${store.userCounter}`,
    email: normalizedEmail,
    password: input.password,
    role: input.role,
    name: input.name?.trim() || toDisplayName(normalizedEmail),
    savedAddress: input.savedAddress?.trim() || undefined,
    savedStreetAddress: input.savedStreetAddress?.trim() || undefined,
    savedCity: input.savedCity?.trim() || undefined,
    savedState: input.savedState?.trim().toUpperCase() || undefined,
    savedZip: input.savedZip ? normalizeZipCode(input.savedZip) : undefined,
    savedPropertyType: input.savedPropertyType,
    propertyId: input.propertyId,
    unitNumber: normalizeOptionalUnitValue(input.unitNumber),
    buildingNumber: normalizeOptionalBuildingValue(input.buildingNumber),
    membershipStatus: input.membershipStatus,
    membershipRequestedAt: input.membershipRequestedAt,
    tenantVerificationLevel:
      input.role === "tenant" ? input.tenantVerificationLevel ?? "unverified" : undefined,
    linkedToLandlord: input.role === "tenant" ? input.linkedToLandlord ?? false : undefined,
    accountLinkageSignals:
      input.role === "tenant" ? [...(input.accountLinkageSignals ?? [])] : undefined,
    createdAt: input.createdAt ?? getNowIso(),
  };

  store.userCounter += 1;
  users.push(user);
  recordActivity({
    type: "user_created",
    actorUserId: user.id,
    actorRole: user.role,
    entityType: "user",
    entityId: user.id,
    message: `${user.role} account created for ${user.email}.`,
  });
  if (shouldPersist) {
    persistStore();
  }
  return user;
}

export async function createUserPersisted(input: CreateUserInput) {
  const previousStore = cloneStoreSnapshot(store);

  try {
    const user = createUser(input, {
      id: isDatabasePersistenceEnabled() ? `user-${randomUUID()}` : undefined,
      persist: false,
    });

    if (isDatabasePersistenceEnabled()) {
      await writeDatabaseUser(user);
    } else {
      await persistStoreNow();
    }

    return user;
  } catch (error) {
    applyStoreSnapshot(previousStore);
    throw error;
  }
}

function findPainPointLabel(ticket: SupportTicket) {
  const text = `${ticket.subject} ${ticket.description}`.toLowerCase();

  if (text.includes("join") || text.includes("address")) {
    return "Onboarding and property join flow";
  }

  if (text.includes("vendor") || text.includes("assignment")) {
    return "Vendor coordination clarity";
  }

  if (text.includes("save") || text.includes("dashboard") || text.includes("screen")) {
    return "Dashboard feedback and UX polish";
  }

  if (text.includes("billing") || text.includes("payout") || text.includes("payment")) {
    return "Billing and payout questions";
  }

  if (text.includes("safety") || text.includes("occupied-home") || text.includes("eligibility")) {
    return "Safety and compliance interpretation";
  }

  return "General product support";
}

export function getSupportTickets() {
  return supportTickets
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getSupportTicketsForUser(userId: string) {
  return getSupportTickets().filter((ticket) => ticket.userId === userId);
}

export function createSupportTicket(input: {
  category: SupportTicketCategory;
  subject: string;
  description: string;
  screenshotPlaceholder: string;
  urgency: SupportTicketUrgency;
  userRole: UserRole;
  userId: string;
  userEmail: string;
  userName?: string;
}) {
  const ticket: SupportTicket = {
    id: `support-${store.supportTicketCounter}`,
    category: input.category,
    subject: input.subject.trim(),
    description: input.description.trim(),
    screenshotPlaceholder: input.screenshotPlaceholder.trim() || "No file uploaded",
    urgency: input.urgency,
    status: "New",
    userRole: input.userRole,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName?.trim() || undefined,
    createdAt: "Just now",
    assignedSupportStaff: "Unassigned",
  };

  store.supportTicketCounter += 1;
  supportTickets.unshift(ticket);
  recordActivity({
    type: "support_ticket_created",
    actorUserId: input.userId,
    actorRole: input.userRole,
    entityType: "supportTicket",
    entityId: ticket.id,
    message: `${input.userRole} support ticket created: ${ticket.subject}.`,
  });
  persistStore();
  return ticket;
}

export function updateSupportTicketByAdmin(input: {
  ticketId: string;
  status: SupportTicketStatus;
  adminNotes?: string;
}) {
  const ticket = supportTickets.find((entry) => entry.id === input.ticketId);

  if (!ticket) {
    return null;
  }

  ticket.status = input.status;
  ticket.adminNotes = input.adminNotes?.trim() || ticket.adminNotes;
  ticket.resolvedAt = input.status === "Resolved" ? getNowIso() : undefined;
  recordActivity({
    type: "support_ticket_admin_updated",
    actorRole: "admin",
    entityType: "supportTicket",
    entityId: ticket.id,
    message: `Support ticket updated by admin: ${ticket.subject}.`,
  });
  persistStore();
  return ticket;
}

export function getSupportTicketAnalytics() {
  const categoryCounts = new Map<SupportTicketCategory, number>();
  const painPointCounts = new Map<string, number>();

  for (const ticket of supportTickets) {
    categoryCounts.set(ticket.category, (categoryCounts.get(ticket.category) ?? 0) + 1);
    const painPoint = findPainPointLabel(ticket);
    painPointCounts.set(painPoint, (painPointCounts.get(painPoint) ?? 0) + 1);
  }

  return {
    commonCategories: Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count })),
    commonPainPoints: Array.from(painPointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
  };
}

export function getSupportTicketSummary() {
  return {
    newTickets: supportTickets.filter((ticket) => ticket.status === "New").length,
    openTickets: supportTickets.filter((ticket) => ticket.status === "Open").length,
    inProgressTickets: supportTickets.filter((ticket) => ticket.status === "In progress").length,
    resolvedTickets: supportTickets.filter((ticket) => ticket.status === "Resolved").length,
    urgentQueue: supportTickets.filter(
      (ticket) => ticket.urgency === "Urgent" || ticket.urgency === "High",
    ).length,
  };
}

export function getActivityEvents() {
  return activityEvents.slice();
}

export function getNotifications() {
  return notifications.slice();
}

export function updateTenantMembershipStatus(userId: string, status: MembershipStatus) {
  const user = findUserById(userId);

  if (!user || user.role !== "tenant") {
    return null;
  }

  user.membershipStatus = status;
  recordActivity({
    type: "tenant_membership_status_updated",
    actorUserId: user.id,
    actorRole: "tenant",
    entityType: "user",
    entityId: user.id,
    message: `${user.email} membership status changed to ${status}.`,
  });
  persistStore();
  void upsertDatabaseUser(user).catch((error) => {
    console.error("RentTruth tenant membership user row could not be synced.", error);
  });
  return user;
}

export function setTenantMembershipRequest(input: {
  userId: string;
  propertyId: string;
  savedAddress?: string;
  savedStreetAddress?: string;
  savedCity?: string;
  savedState?: string;
  savedZip?: string;
  savedPropertyType?: PropertyType;
  unitNumber?: string;
  buildingNumber?: string;
  requestedAt: string;
}) {
  const user = findUserById(input.userId);

  if (!user || user.role !== "tenant") {
    return null;
  }

  user.propertyId = input.propertyId;
  user.savedAddress = input.savedAddress?.trim() || user.savedAddress;
  user.savedStreetAddress = input.savedStreetAddress?.trim() || user.savedStreetAddress;
  user.savedCity = input.savedCity?.trim() || user.savedCity;
  user.savedState = input.savedState?.trim().toUpperCase() || user.savedState;
  user.savedZip = input.savedZip ? normalizeZipCode(input.savedZip) : user.savedZip;
  user.savedPropertyType = input.savedPropertyType ?? user.savedPropertyType;
  user.unitNumber = input.unitNumber ? normalizeOptionalUnitValue(input.unitNumber) : undefined;
  user.buildingNumber = input.buildingNumber
    ? normalizeOptionalBuildingValue(input.buildingNumber)
    : undefined;
  user.membershipStatus = "Pending";
  user.membershipRequestedAt = input.requestedAt;
  recordActivity({
    type: "tenant_membership_requested",
    actorUserId: user.id,
    actorRole: "tenant",
    entityType: "property",
    entityId: input.propertyId,
    message: `${user.email} requested access to property ${input.propertyId}.`,
  });
  persistStore();
  void upsertDatabaseUser(user).catch((error) => {
    console.error("RentTruth tenant saved address user row could not be synced.", error);
  });
  return user;
}

export function formatTenantAddress(input: SavedTenantAddress) {
  const unitSegment =
    propertyTypeRequiresUnit(input.propertyType)
      ? getUnitBuildingSegment(input)
      : "";

  return `${input.streetAddress.trim()}${unitSegment}, ${input.city.trim()}, ${input.state
    .trim()
    .toUpperCase()} ${normalizeZipCode(input.zip)}`;
}

export function getSavedTenantAddress(user: Pick<
  AppUser,
  "savedStreetAddress" | "savedCity" | "savedState" | "savedZip" | "savedPropertyType" | "unitNumber" | "buildingNumber"
>): SavedTenantAddress | null {
  if (!user.savedStreetAddress || !user.savedCity || !user.savedState || !user.savedZip) {
    return null;
  }

  return {
    streetAddress: user.savedStreetAddress,
    city: user.savedCity,
    state: user.savedState,
    zip: normalizeZipCode(user.savedZip),
    propertyType: user.savedPropertyType ?? "Apartment",
    unitNumber: user.unitNumber,
    buildingNumber: user.buildingNumber,
  };
}

export function saveTenantAddress(userId: string, address: SavedTenantAddress) {
  const user = findUserById(userId);

  if (!user || user.role !== "tenant") {
    return null;
  }

  user.savedStreetAddress = address.streetAddress.trim();
  user.savedCity = address.city.trim();
  user.savedState = address.state.trim().toUpperCase();
  user.savedZip = normalizeZipCode(address.zip);
  user.savedPropertyType = address.propertyType;
  user.unitNumber = propertyTypeRequiresUnit(address.propertyType)
    ? normalizeOptionalUnitValue(address.unitNumber)
    : undefined;
  user.buildingNumber = propertyTypeRequiresUnit(address.propertyType)
    ? normalizeOptionalBuildingValue(address.buildingNumber)
    : undefined;
  user.savedAddress = formatTenantAddress({
    ...address,
    zip: user.savedZip,
    unitNumber: user.unitNumber,
    buildingNumber: user.buildingNumber,
  });
  recordActivity({
    type: "tenant_address_saved",
    actorUserId: user.id,
    actorRole: "tenant",
    entityType: "user",
    entityId: user.id,
    message: `${user.email} saved tenant address ${user.savedAddress}.`,
  });
  persistStore();
  void upsertDatabaseUser(user).catch((error) => {
    console.error("RentTruth tenant saved address user row could not be synced.", error);
  });
  return user;
}

export function clearTenantPropertyMembership(userId: string, status: MembershipStatus) {
  const user = updateTenantMembershipStatus(userId, status);

  if (!user) {
    return null;
  }

  user.propertyId = undefined;
  user.unitNumber = undefined;
  recordActivity({
    type: "tenant_membership_cleared",
    actorUserId: user.id,
    actorRole: "tenant",
    entityType: "user",
    entityId: user.id,
    message: `${user.email} left or was removed from a property with status ${status}.`,
  });
  persistStore();
  return user;
}

export function findPropertyById(propertyId: string) {
  return properties.find((property) => property.id === propertyId) ?? null;
}

export function findPropertyByJoinCode(joinCode: string) {
  const normalized = joinCode.trim().toUpperCase();
  return properties.find((property) => property.joinCode === normalized) ?? null;
}

export function normalizeUnitBuildingText(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\b(apartment|apt|unit|suite|ste|#)\b/g, " ")
    .replace(/\b(building|bldg|bld)\b/g, " ")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function normalizeStreetAddressForMatch(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\b(avenue)\b/g, "ave")
    .replace(/\b(street)\b/g, "st")
    .replace(/\b(road)\b/g, "rd")
    .replace(/\b(drive)\b/g, "dr")
    .replace(/\b(court)\b/g, "ct")
    .replace(/\b(place)\b/g, "pl")
    .replace(/\b(lane)\b/g, "ln")
    .replace(/\b(boulevard)\b/g, "blvd")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function getNormalizedResidenceKey(input: { unitNumber?: string; buildingNumber?: string }) {
  return normalizeUnitBuildingText(
    [input.unitNumber, input.buildingNumber ? `building ${input.buildingNumber}` : ""]
      .filter(Boolean)
      .join(" "),
  );
}

function baseAddressMatches(
  property: Pick<Property, "streetAddress" | "city" | "state" | "zip">,
  input: Pick<SavedTenantAddress, "streetAddress" | "city" | "state" | "zip">,
) {
  return (
    property.streetAddress.trim().replace(/\s+/g, " ").toLowerCase() ===
      input.streetAddress.trim().replace(/\s+/g, " ").toLowerCase() &&
    property.city.trim().toLowerCase() === input.city.trim().toLowerCase() &&
    property.state.trim().toLowerCase() === input.state.trim().toLowerCase() &&
    normalizeZipCode(property.zip) === normalizeZipCode(input.zip)
  );
}

function closeBaseAddressMatches(
  property: Pick<Property, "streetAddress" | "city" | "state" | "zip">,
  input: Pick<SavedTenantAddress, "streetAddress" | "city" | "state" | "zip">,
) {
  return (
    normalizeStreetAddressForMatch(property.streetAddress) ===
      normalizeStreetAddressForMatch(input.streetAddress) &&
    property.city.trim().toLowerCase() === input.city.trim().toLowerCase() &&
    property.state.trim().toLowerCase() === input.state.trim().toLowerCase() &&
    normalizeZipCode(property.zip) === normalizeZipCode(input.zip)
  );
}

export function propertyAddressMatchesSavedAddress(
  property: Property,
  input: Pick<SavedTenantAddress, "streetAddress" | "city" | "state" | "zip" | "unitNumber" | "buildingNumber">,
) {
  if (!baseAddressMatches(property, input)) {
    return false;
  }

  if (!propertyTypeRequiresUnit(property.propertyType)) {
    return true;
  }

  const propertyResidenceKey = getNormalizedResidenceKey(property);
  const tenantResidenceKey = getNormalizedResidenceKey(input);

  return !propertyResidenceKey || !tenantResidenceKey || propertyResidenceKey === tenantResidenceKey;
}

export function isClosePropertyAddressMatch(
  property: Property,
  input: Pick<SavedTenantAddress, "streetAddress" | "city" | "state" | "zip">,
) {
  return closeBaseAddressMatches(property, input);
}

export function findPropertyByExactAddress(input: {
  streetAddress: string;
  unitNumber?: string;
  buildingNumber?: string;
  city: string;
  state: string;
  zip: string;
}) {
  return properties.find((property) => propertyAddressMatchesSavedAddress(property, input)) ?? null;
}

function normalizeAddressLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function findPropertyBySavedAddress(input: SavedTenantAddress) {
  return findPropertyByExactAddress({
    streetAddress: input.streetAddress,
    unitNumber: input.unitNumber,
    buildingNumber: input.buildingNumber,
    city: input.city,
    state: input.state,
    zip: input.zip,
  });
}

export function searchPropertiesByAddress(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return properties;
  }

  return properties.filter((property) =>
    getPropertyFullAddress(property).toLowerCase().includes(normalized),
  );
}

export function getTenantJoinableProperties() {
  return properties
    .slice()
    .sort((a, b) => getPropertyFullAddress(a).localeCompare(getPropertyFullAddress(b)));
}

export function getPropertiesForLandlord(landlordId: string) {
  return properties
    .filter((property) => property.landlordId === landlordId)
    .sort((a, b) => getPropertyDisplayName(a).localeCompare(getPropertyDisplayName(b)));
}

export function createPropertyForLandlord(input: {
  landlordId: string;
  propertyType: PropertyType;
  name?: string;
  streetAddress: string;
  unitNumber?: string;
  buildingNumber?: string;
  city: string;
  state: string;
  zip: string;
  unitCount?: number;
}) {
  const property: Property = {
    id: `property-${store.propertyCounter}`,
    landlordId: input.landlordId,
    propertyType: input.propertyType,
    name: input.name?.trim() || undefined,
    streetAddress: input.streetAddress.trim(),
    unitNumber: propertyTypeRequiresUnit(input.propertyType)
      ? normalizeOptionalUnitValue(input.unitNumber)
      : undefined,
    buildingNumber: propertyTypeRequiresUnit(input.propertyType)
      ? normalizeOptionalBuildingValue(input.buildingNumber)
      : undefined,
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    zip: normalizeZipCode(input.zip),
    unitCount: input.propertyType === "House" ? 1 : Math.max(1, input.unitCount ?? 1),
    joinCode: makeUniqueJoinCode(input.name?.trim() || input.streetAddress),
    createdAt: "Today",
    trustScore: 0,
    averageRepairResponseTime: "Not enough data",
    averageCompletionTime: "Not enough data",
    ticketsCompletedOnTimeRate: "Not enough data",
    urgentRepairCompletionSpeed: "Not enough data",
    repairHistorySummary: "No verified maintenance history yet. Metrics will appear after completed RentTruth tickets.",
  };

  store.propertyCounter += 1;
  properties.push(property);
  recordActivity({
    type: "property_created",
    actorUserId: input.landlordId,
    actorRole: "landlord",
    entityType: "property",
    entityId: property.id,
    message: `Property created at ${getPropertyFullAddress(property)}.`,
  });
  persistStore();
  return property;
}

export function updatePropertyForLandlord(input: {
  landlordId: string;
  propertyId: string;
  propertyType: PropertyType;
  name?: string;
  streetAddress: string;
  unitNumber?: string;
  buildingNumber?: string;
  city: string;
  state: string;
  zip: string;
}) {
  const property = findPropertyById(input.propertyId);

  if (!property || property.landlordId !== input.landlordId) {
    return null;
  }

  property.propertyType = input.propertyType;
  property.name = input.name?.trim() || undefined;
  property.streetAddress = input.streetAddress.trim();
  property.unitNumber = propertyTypeRequiresUnit(input.propertyType)
    ? normalizeOptionalUnitValue(input.unitNumber)
    : undefined;
  property.buildingNumber = propertyTypeRequiresUnit(input.propertyType)
    ? normalizeOptionalBuildingValue(input.buildingNumber)
    : undefined;
  property.city = input.city.trim();
  property.state = input.state.trim().toUpperCase();
  property.zip = normalizeZipCode(input.zip);

  if (input.propertyType === "House") {
    property.unitCount = 1;
  } else if (property.unitCount < 1) {
    property.unitCount = 1;
  }

  recordActivity({
    type: "property_updated",
    actorUserId: input.landlordId,
    actorRole: "landlord",
    entityType: "property",
    entityId: property.id,
    message: `Property updated at ${getPropertyFullAddress(property)}.`,
  });
  persistStore();
  return property;
}

export function deletePropertyForLandlord(input: {
  landlordId: string;
  propertyId: string;
}): "deleted" | "not-found" | "has-linked-records" {
  const propertyIndex = properties.findIndex((property) => property.id === input.propertyId);
  const property = propertyIndex >= 0 ? properties[propertyIndex] : null;

  if (!property || property.landlordId !== input.landlordId) {
    return "not-found";
  }

  const hasTenants = users.some((user) => user.role === "tenant" && user.propertyId === property.id);
  const hasTickets = tickets.some((ticket) => ticket.propertyId === property.id);

  if (hasTenants || hasTickets) {
    return "has-linked-records";
  }

  properties.splice(propertyIndex, 1);
  recordActivity({
    type: "property_deleted",
    actorUserId: input.landlordId,
    actorRole: "landlord",
    entityType: "property",
    entityId: property.id,
    message: `Property removed: ${getPropertyFullAddress(property)}.`,
  });
  persistStore();
  return "deleted";
}

export function resetPropertyJoinCode(propertyId: string) {
  const property = findPropertyById(propertyId);

  if (!property) {
    return null;
  }

  store.propertyCounter += 1;
  property.joinCode = makeUniqueJoinCode(property.name?.trim() || property.streetAddress);
  recordActivity({
    type: "property_join_code_reset",
    entityType: "property",
    entityId: property.id,
    message: `Join code reset for ${getPropertyDisplayName(property)}.`,
  });
  persistStore();
  return property;
}

export function getTicketsForTenant(tenantUserId: string) {
  return tickets.filter((ticket) => ticket.tenantUserId === tenantUserId);
}

function getTenantConfirmationWeight(user?: AppUser | null) {
  if (!user || user.role !== "tenant") {
    return 0;
  }

  if (user.linkedToLandlord) {
    return 0.05;
  }

  return user.tenantVerificationLevel === "verified" ? 1 : 0.2;
}

export function getPropertyTrustSignal(property: Property) {
  const propertyTickets = getTicketsForProperty(property.id);
  const confirmedTickets = propertyTickets.filter(
    (ticket) => ticket.tenantConfirmationStatus === "Tenant confirmed fixed",
  );
  const hasVerifiedMaintenanceHistory = confirmedTickets.length > 0;
  const weightedConfirmationCount = confirmedTickets.reduce((sum, ticket) => {
    const tenant = findUserById(ticket.tenantUserId);
    return sum + getTenantConfirmationWeight(tenant);
  }, 0);
  const verifiedConfirmationCount = confirmedTickets.filter((ticket) => {
    const tenant = findUserById(ticket.tenantUserId);
    return (
      tenant?.role === "tenant" &&
      tenant.tenantVerificationLevel === "verified" &&
      !tenant.linkedToLandlord
    );
  }).length;
  const independentTenantIds = new Set(
    propertyTickets
      .map((ticket) => findUserById(ticket.tenantUserId))
      .filter(
        (tenant): tenant is AppUser =>
          Boolean(tenant) &&
          tenant?.role === "tenant" &&
          tenant.membershipStatus === "Approved" &&
          !tenant.linkedToLandlord,
      )
      .map((tenant) => tenant.id),
  );
  const independentTenantCount = independentTenantIds.size;
  const confidenceLevel: TrustConfidenceLevel =
    independentTenantCount >= 3 && verifiedConfirmationCount >= 5
      ? "High"
      : independentTenantCount >= 2 && verifiedConfirmationCount >= 2
        ? "Medium"
        : "Low";
  const confidenceMultiplier =
    confidenceLevel === "High" ? 1 : confidenceLevel === "Medium" ? 0.9 : 0.78;
  const confirmationAdjustment = Math.min(10, Math.round(weightedConfirmationCount * 2));
  const landlordTrustScore = hasVerifiedMaintenanceHistory
    ? Math.max(
        0,
        Math.min(100, Math.round(property.trustScore * confidenceMultiplier + confirmationAdjustment)),
      )
    : 0;
  let trustTransparencyMessage = "No verified maintenance history yet.";

  if (hasVerifiedMaintenanceHistory && verifiedConfirmationCount > 0) {
    trustTransparencyMessage = `Based on ${verifiedConfirmationCount} verified tenant confirmation${
      verifiedConfirmationCount === 1 ? "" : "s"
    } across ${independentTenantCount} independent tenant${
      independentTenantCount === 1 ? "" : "s"
    }.`;
  } else if (hasVerifiedMaintenanceHistory) {
    trustTransparencyMessage = "Limited independent tenant data available.";
  }

  return {
    landlordTrustScore,
    confidenceLevel,
    trustTransparencyMessage,
    hasVerifiedMaintenanceHistory,
    completedMaintenanceTicketCount: confirmedTickets.length,
    independentTenantCount,
    verifiedConfirmationCount,
    weightedConfirmationCount: Number(weightedConfirmationCount.toFixed(2)),
  };
}

export function findTicketById(ticketId: string) {
  return tickets.find((ticket) => ticket.id === ticketId) ?? null;
}

export function getTicketMessages(ticketId: string) {
  const ticket = findTicketById(ticketId);

  return (ticket?.messages ?? [])
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addTenantTicketMessage(input: {
  ticketId: string;
  tenantUserId: string;
  messageText: string;
}) {
  const ticket = findTicketById(input.ticketId);
  const text = input.messageText.trim();

  if (!ticket || ticket.tenantUserId !== input.tenantUserId || !text) {
    return null;
  }

  const message: TicketMessage = {
    id: randomUUID(),
    ticketId: ticket.id,
    senderUserId: input.tenantUserId,
    senderRole: "tenant",
    text,
    createdAt: getNowIso(),
  };

  ticket.messages = [...(ticket.messages ?? []), message];
  persistStore();
  return message;
}

export function addLandlordTicketMessage(input: {
  ticketId: string;
  landlordUserId: string;
  messageText: string;
}) {
  const ticket = findTicketById(input.ticketId);
  const property = ticket ? findPropertyById(ticket.propertyId) : null;
  const text = input.messageText.trim();

  if (!ticket || property?.landlordId !== input.landlordUserId || !text) {
    return null;
  }

  const message: TicketMessage = {
    id: randomUUID(),
    ticketId: ticket.id,
    senderUserId: input.landlordUserId,
    senderRole: "landlord",
    text,
    createdAt: getNowIso(),
  };

  ticket.messages = [...(ticket.messages ?? []), message];
  persistStore();
  return message;
}

export function getRepairTickets() {
  return tickets.slice();
}

export function getTicketsForProperty(propertyId: string) {
  return tickets
    .filter((ticket) => ticket.propertyId === propertyId)
    .sort((a, b) => {
      if (a.submittedAt === b.submittedAt) {
        return a.issueTitle.localeCompare(b.issueTitle);
      }

      return a.submittedAt < b.submittedAt ? 1 : -1;
    });
}

export function getPropertyTicketHistory(propertyId: string, currentTicketId?: string) {
  return getTicketsForProperty(propertyId).filter((ticket) => ticket.id !== currentTicketId);
}

export function getAvailableVendorJobs(vendorUserId: string) {
  const profile = findVendorProfileByUserId(vendorUserId);

  if (!profile) {
    return [];
  }

  return tickets.filter((ticket) => {
    const property = findPropertyById(ticket.propertyId);
    const vendorRequest = findVendorRequest(ticket, vendorUserId);
    return (
      isTicketEligibleForVendorAvailability(ticket) &&
      profile.serviceCategories.includes(ticket.category as VendorServiceCategory) &&
      vendorRequest?.status !== "Vendor interested" &&
      vendorRequest?.status !== "Vendor selected" &&
      vendorRequest?.status !== "Vendor declined" &&
      Boolean(property && vendorServesProperty(profile, property))
    );
  });
}

export function getVendorInterestedJobs(vendorUserId: string) {
  return tickets.filter((ticket) => findVendorRequest(ticket, vendorUserId)?.status === "Vendor interested");
}

export function getVendorAssignedJobs(vendorUserId: string) {
  return tickets.filter(
    (ticket) =>
      ticket.vendorUserId === vendorUserId &&
      isTicketActiveForVendor(ticket),
  );
}

export function getVendorCompletedJobs(vendorUserId: string) {
  return tickets.filter(
    (ticket) => ticket.vendorUserId === vendorUserId && isTicketCompletedForMetrics(ticket),
  );
}

export function getVendorPrimaryAssignedJob(vendorUserId: string) {
  return getVendorAssignedJobs(vendorUserId)[0] ?? null;
}

export function assignVendorToTicket(input: {
  ticketId: string;
  vendorUserId: string;
}) {
  const ticket = tickets.find((entry) => entry.id === input.ticketId);
  const vendor = findVendorProfileByUserId(input.vendorUserId);

  if (!ticket || !vendor) {
    return null;
  }

  ticket.vendorUserId = input.vendorUserId;
  ticket.vendorBusinessName = vendor.businessName;
  ticket.assignedAt = getNowIso();
  ticket.acceptedAt = ticket.assignedAt;
  initializeDispatchPlaceholders(ticket);
  ticket.arrivedAt = undefined;
  ticket.workStartedAt = undefined;
  ticket.completedAt = undefined;
  ticket.droppedAfterAcceptanceAt = undefined;
  const requests = ensureVendorRequests(ticket);
  const selectedRequest =
    findVendorRequest(ticket, input.vendorUserId) ??
    {
      vendorUserId: input.vendorUserId,
      vendorBusinessName: vendor.businessName,
      status: "Vendor interested" as VendorRequestStatus,
      requestedAt: ticket.assignedAt,
    };

  if (!requests.includes(selectedRequest)) {
    requests.push(selectedRequest);
  }

  selectedRequest.vendorBusinessName = vendor.businessName;
  selectedRequest.status = "Vendor selected";
  selectedRequest.selectedAt = ticket.assignedAt;
  selectedRequest.declinedAt = undefined;

  for (const request of requests) {
    if (request.vendorUserId !== input.vendorUserId && request.status === "Vendor interested") {
      request.status = "Vendor declined";
      request.declinedAt = ticket.assignedAt;
    }
  }

  ticket.status = "Vendor selected";
  vendor.jobsAssignedCount += 1;
  recordActivity({
    type: "vendor_assigned",
    actorUserId: input.vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `${vendor.businessName} selected for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function assignLandlordVendorToTicket(input: {
  ticketId: string;
  vendorName: string;
  vendorContact?: string;
  scheduledFor?: string;
  tenantNote?: string;
}) {
  const ticket = tickets.find((entry) => entry.id === input.ticketId);
  const vendorName = input.vendorName.trim();

  if (!ticket || !vendorName) {
    return null;
  }

  ticket.vendorUserId = undefined;
  ticket.vendorBusinessName = undefined;
  ticket.landlordVendorName = vendorName;
  ticket.landlordVendorContact = input.vendorContact?.trim() || undefined;
  ticket.landlordVendorScheduledFor = input.scheduledFor?.trim() || undefined;
  ticket.landlordVendorTenantNote = input.tenantNote?.trim() || undefined;
  ticket.landlordVendorAssignedAt = getNowIso();
  ticket.assignedAt = ticket.landlordVendorAssignedAt;
  ticket.acceptedAt = ticket.landlordVendorAssignedAt;
  initializeDispatchPlaceholders(ticket);
  ticket.arrivedAt = undefined;
  ticket.workStartedAt = undefined;
  ticket.completedAt = undefined;
  ticket.droppedAfterAcceptanceAt = undefined;
  ticket.status = "Landlord vendor assigned";

  for (const request of ensureVendorRequests(ticket)) {
    if (request.status === "Vendor interested") {
      request.status = "Vendor declined";
      request.declinedAt = ticket.landlordVendorAssignedAt;
    }
  }

  recordActivity({
    type: "landlord_vendor_assigned",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Landlord vendor ${vendorName} assigned to ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function landlordMarkOwnVendorArrived(input: {
  landlordId: string;
  ticketId: string;
}) {
  const ticket = findTicketById(input.ticketId);
  const property = ticket ? findPropertyById(ticket.propertyId) : null;

  if (
    !ticket ||
    !property ||
    property.landlordId !== input.landlordId ||
    !ticket.landlordVendorName ||
    ticket.vendorUserId
  ) {
    return null;
  }

  if (!ticket.assignedAt) {
    ticket.assignedAt = getNowIso();
  }

  if (!ticket.acceptedAt) {
    ticket.acceptedAt = ticket.assignedAt;
  }

  ticket.arrivedAt = getNowIso();
  ticket.status = "Vendor arrived";
  recordActivity({
    type: "landlord_vendor_arrived",
    actorUserId: input.landlordId,
    actorRole: "landlord",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Landlord vendor ${ticket.landlordVendorName} marked arrived for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function landlordMarkOwnVendorWorkCompleted(input: {
  landlordId: string;
  ticketId: string;
  completionNotes?: string;
}) {
  const ticket = findTicketById(input.ticketId);
  const property = ticket ? findPropertyById(ticket.propertyId) : null;

  if (
    !ticket ||
    !property ||
    property.landlordId !== input.landlordId ||
    !ticket.landlordVendorName ||
    ticket.vendorUserId
  ) {
    return null;
  }

  if (!ticket.assignedAt) {
    ticket.assignedAt = getNowIso();
  }

  if (!ticket.acceptedAt) {
    ticket.acceptedAt = ticket.assignedAt;
  }

  if (!ticket.arrivedAt) {
    ticket.arrivedAt = getNowIso();
  }

  ticket.completedAt = getNowIso();
  ticket.status = "Waiting for tenant confirmation";
  ticket.trendBucket = "resolved";
  ticket.vendorCompletionNotes =
    input.completionNotes?.trim() ||
    `${ticket.landlordVendorName} marked the job completed.`;
  ticket.tenantConfirmationStatus = "Waiting for tenant confirmation";
  ticket.tenantConfirmationAt = undefined;
  ticket.tenantFeedback = undefined;
  ticket.landlordReadyForPaymentApprovalAt = undefined;
  recordActivity({
    type: "landlord_vendor_work_completed",
    actorUserId: input.landlordId,
    actorRole: "landlord",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Landlord vendor ${ticket.landlordVendorName} marked work completed for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function getVendorRequestsForTicket(ticketId: string) {
  const ticket = tickets.find((entry) => entry.id === ticketId);

  if (!ticket) {
    return [];
  }

  return ensureVendorRequests(ticket).slice();
}

export function vendorRequestTicket(ticketId: string, vendorUserId: string) {
  const ticket = tickets.find((entry) => entry.id === ticketId);
  const profile = findVendorProfileByUserId(vendorUserId);

  if (!ticket || !profile || ticket.vendorUserId || ticket.status === "Landlord vendor assigned") {
    return null;
  }

  const now = getNowIso();
  const existingRequest = findVendorRequest(ticket, vendorUserId);
  const shouldIncrementAccepted =
    !existingRequest || existingRequest.status === "Vendor declined";

  if (existingRequest) {
    existingRequest.status = "Vendor interested";
    existingRequest.requestedAt = now;
    existingRequest.selectedAt = undefined;
    existingRequest.declinedAt = undefined;
  } else {
    ensureVendorRequests(ticket).push({
      vendorUserId,
      vendorBusinessName: profile.businessName,
      status: "Vendor interested",
      requestedAt: now,
    });
  }

  if (shouldIncrementAccepted) {
    profile.jobsAcceptedCount += 1;
  }
  syncTicketStatusFromVendorRequests(ticket);
  recordActivity({
    type: "vendor_interest_submitted",
    actorUserId: vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `${profile.businessName} submitted interest for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function vendorDeclineTicket(ticketId: string, vendorUserId: string) {
  const ticket = tickets.find((entry) => entry.id === ticketId);

  if (!ticket) {
    return null;
  }

  const profile = findVendorProfileByUserId(vendorUserId);
  const request = findVendorRequest(ticket, vendorUserId);

  if (!request && ticket.vendorUserId !== vendorUserId) {
    return null;
  }

  if (ticket.vendorUserId === vendorUserId && !ticket.completedAt) {
    ticket.droppedAfterAcceptanceAt = getNowIso();
    if (profile) {
      profile.jobsDroppedCount += 1;
    }
    ticket.vendorUserId = undefined;
    ticket.vendorBusinessName = undefined;
    ticket.assignedAt = undefined;
    ticket.acceptedAt = undefined;
    ticket.enRouteAt = undefined;
    ticket.arrivedAt = undefined;
    ticket.workStartedAt = undefined;
    ticket.completedAt = undefined;
  }

  if (request) {
    request.status = "Vendor declined";
    request.declinedAt = getNowIso();
  }

  syncTicketStatusFromVendorRequests(ticket);
  recordActivity({
    type: "vendor_declined_ticket",
    actorUserId: vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Vendor ${vendorUserId} declined or dropped ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function landlordDeclineVendorRequest(ticketId: string, vendorUserId: string) {
  const ticket = tickets.find((entry) => entry.id === ticketId);

  if (!ticket) {
    return null;
  }

  const request = findVendorRequest(ticket, vendorUserId);

  if (!request) {
    return null;
  }

  request.status = "Vendor declined";
  request.declinedAt = getNowIso();
  syncTicketStatusFromVendorRequests(ticket);
  recordActivity({
    type: "landlord_declined_vendor",
    actorUserId: vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Landlord declined vendor ${vendorUserId} for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function vendorMarkEnRoute(ticketId: string, vendorUserId: string) {
  const ticket = tickets.find((entry) => entry.id === ticketId && entry.vendorUserId === vendorUserId);

  if (!ticket) {
    return null;
  }

  ticket.enRouteAt = getNowIso();
  ticket.status = "Vendor en route";
  recordActivity({
    type: "vendor_en_route",
    actorUserId: vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Vendor marked en route for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function vendorMarkArrived(ticketId: string, vendorUserId: string) {
  const ticket = tickets.find((entry) => entry.id === ticketId && entry.vendorUserId === vendorUserId);

  if (!ticket) {
    return null;
  }

  if (!ticket.enRouteAt) {
    ticket.enRouteAt = getNowIso();
  }
  ticket.arrivedAt = getNowIso();
  ticket.status = "Vendor arrived";
  recordActivity({
    type: "vendor_arrived",
    actorUserId: vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Vendor arrived for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function vendorMarkInProgress(ticketId: string, vendorUserId: string) {
  const ticket = tickets.find((entry) => entry.id === ticketId && entry.vendorUserId === vendorUserId);

  if (!ticket) {
    return null;
  }

  ticket.workStartedAt = getNowIso();
  ticket.status = "In progress";
  recordActivity({
    type: "vendor_work_started",
    actorUserId: vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Vendor started work on ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function vendorMarkCompleted(
  ticketId: string,
  vendorUserId: string,
  completionNotes?: string,
) {
  return vendorMarkWorkCompleted(ticketId, vendorUserId, completionNotes);
}

export function vendorMarkWorkCompleted(
  ticketId: string,
  vendorUserId: string,
  completionNotes?: string,
) {
  const ticket = tickets.find((entry) => entry.id === ticketId && entry.vendorUserId === vendorUserId);

  if (!ticket) {
    return null;
  }

  ticket.completedAt = getNowIso();
  ticket.status = "Waiting for tenant confirmation";
  ticket.trendBucket = "resolved";
  ticket.vendorCompletionNotes = completionNotes?.trim() || ticket.vendorCompletionNotes;
  ticket.tenantConfirmationStatus = "Waiting for tenant confirmation";
  ticket.tenantConfirmationAt = undefined;
  ticket.tenantFeedback = undefined;
  ticket.landlordReadyForPaymentApprovalAt = undefined;
  const profile = findVendorProfileByUserId(vendorUserId);
  if (profile) {
    profile.jobsCompletedCount += 1;
    profile.completionHistoryCount = profile.jobsCompletedCount;
  }
  recordActivity({
    type: "vendor_work_completed",
    actorUserId: vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Vendor marked work completed for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function vendorSubmitRepairApprovalRequest(input: {
  ticketId: string;
  vendorUserId: string;
  summary: string;
  pricingItem?: CommonRepairPricingItem;
  partCost: number;
  laborImpact: string;
  notes: string;
}) {
  const ticket = tickets.find((entry) => entry.id === input.ticketId && entry.vendorUserId === input.vendorUserId);
  const profile = findVendorProfileByUserId(input.vendorUserId);

  if (!ticket || !profile) {
    return null;
  }

  const pricingItem = input.pricingItem ?? inferRepairPricingItem(input.summary);
  const baseline = findVendorBaselineRepairPrice(profile, pricingItem);
  const priceDeltaPercent =
    baseline?.typicalPrice && baseline.typicalPrice > 0
      ? Math.round(((input.partCost - baseline.typicalPrice) / baseline.typicalPrice) * 100)
      : undefined;
  const exceedsBaselineWarning =
    typeof priceDeltaPercent === "number" && priceDeltaPercent >= 25
      ? `Requested part cost is ${priceDeltaPercent}% above this vendor's usual baseline for ${normalizeRepairPricingLabel(pricingItem ?? baseline?.item)}. Ask for the reason behind the higher quote before approving.`
      : undefined;

  ticket.repairApprovalRequest = {
    summary: input.summary.trim(),
    pricingItem,
    partCost: input.partCost,
    baselinePrice: baseline?.typicalPrice,
    priceDeltaPercent,
    exceedsBaselineWarning,
    laborImpact: input.laborImpact.trim(),
    notes: input.notes.trim(),
    requestedAt: getNowIso(),
    status: "Pending landlord approval",
  };
  ticket.status = "Follow-up needed";
  ticket.trendBucket = "unresolved";
  recordActivity({
    type: "repair_approval_requested",
    actorUserId: input.vendorUserId,
    actorRole: "vendor",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Repair approval requested for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function landlordReviewRepairApproval(input: {
  ticketId: string;
  decision: "Approved" | "Declined" | "Request follow-up";
  reviewNotes?: string;
}) {
  const ticket = findTicketById(input.ticketId);

  if (!ticket?.repairApprovalRequest) {
    return null;
  }

  ticket.repairApprovalRequest.status = input.decision;
  ticket.repairApprovalRequest.reviewedAt = getNowIso();
  ticket.repairApprovalRequest.reviewNotes = input.reviewNotes?.trim() || undefined;

  if (input.decision === "Approved") {
    ticket.status = "Vendor selected";
  } else {
    ticket.status = "Follow-up needed";
  }

  recordActivity({
    type: "repair_approval_reviewed",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Repair approval ${input.decision.toLowerCase()} for ticket ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function tenantConfirmTicketOutcome(input: {
  ticketId: string;
  tenantUserId: string;
  outcome: "fixed" | "not-fixed";
  feedback?: string;
}) {
  const ticket = tickets.find(
    (entry) => entry.id === input.ticketId && entry.tenantUserId === input.tenantUserId,
  );

  if (!ticket) {
    return null;
  }

  ticket.tenantConfirmationAt = getNowIso();
  ticket.tenantFeedback = input.feedback?.trim() || undefined;

  if (input.outcome === "fixed") {
    ticket.tenantConfirmationStatus = "Tenant confirmed fixed";
    if (ticket.landlordVendorName && !ticket.vendorUserId) {
      ticket.status = "Closed";
      ticket.landlordReadyForPaymentApprovalAt = undefined;
    } else {
      ticket.status = "Ready for landlord payment approval";
      ticket.landlordReadyForPaymentApprovalAt = getNowIso();
    }
    ticket.trendBucket = "resolved";
  } else {
    ticket.tenantConfirmationStatus = "Follow-up needed";
    ticket.status = "Follow-up needed";
    ticket.landlordReadyForPaymentApprovalAt = undefined;
    ticket.trendBucket = "unresolved";
  }

  recordActivity({
    type: "tenant_confirmation_recorded",
    actorUserId: input.tenantUserId,
    actorRole: "tenant",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Tenant marked ticket ${ticket.issueTitle} as ${input.outcome}.`,
  });
  persistStore();
  return ticket;
}

export function landlordCloseTicket(
  ticketId: string,
  input?: {
    reviewNotes?: string;
    paymentMethod?: string;
  },
) {
  const ticket = findTicketById(ticketId);

  if (!ticket) {
    return null;
  }

  ticket.status = "Closed";
  ticket.paymentMethod = input?.paymentMethod?.trim() || undefined;
  ticket.paymentMarkedReadyAt = getNowIso();
  ticket.landlordFinalReviewNotes = input?.reviewNotes?.trim() || undefined;
  ticket.trendBucket = "resolved";
  recordActivity({
    type: "ticket_closed",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Ticket ${ticket.issueTitle} closed by landlord.`,
  });
  persistStore();
  return ticket;
}

export function getTenantsForProperty(propertyId: string) {
  return users
    .filter((user) => user.role === "tenant" && user.propertyId === propertyId)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
}

export function getPendingTenantsForProperty(propertyId: string) {
  return getTenantsForProperty(propertyId).filter((user) => user.membershipStatus === "Pending");
}

export function getApprovedTenantsForProperty(propertyId: string) {
  return getTenantsForProperty(propertyId).filter((user) => user.membershipStatus === "Approved");
}

export function createTicketForTenant(input: {
  tenantUserId: string;
  propertyId: string;
  tenantEmail: string;
  unitNumber?: string;
  issueTitle: string;
  category: string;
  description: string;
  photoPlaceholder?: string;
  attachment?: RepairTicketAttachment | null;
  urgent: boolean;
}) {
  const attachment =
    input.attachment ??
    createRepairTicketAttachment({
      fileName: input.photoPlaceholder,
    });
  const ticket: RepairTicket = {
    id: `ticket-${store.ticketCounter}`,
    propertyId: input.propertyId,
    tenantUserId: input.tenantUserId,
    tenantEmail: input.tenantEmail,
    unitNumber: input.unitNumber,
    issueTitle: input.issueTitle,
    category: input.category,
    description: input.description,
    photoUploadPlaceholder:
      attachment?.fileName || input.photoPlaceholder?.trim() || "No photo uploaded",
    attachment,
    urgent: input.urgent,
    status: "Open",
    submittedAt: "Just now",
    trendBucket: "unresolved",
    locationTrackingPlaceholder: "Location tracking placeholder",
    idleMovementTimeoutPlaceholder: "Idle/no-movement timeout placeholder",
  };

  store.ticketCounter += 1;
  tickets.unshift(ticket);
  recordActivity({
    type: "repair_ticket_created",
    actorUserId: input.tenantUserId,
    actorRole: "tenant",
    entityType: "ticket",
    entityId: ticket.id,
    message: `Repair ticket created: ${ticket.issueTitle}.`,
  });
  persistStore();
  return ticket;
}

export function getPublicPropertyProfile(propertyId: string): PublicPropertyProfile | null {
  const property = findPropertyById(propertyId);

  if (!property) {
    return null;
  }

  const propertyTickets = getTicketsForProperty(property.id);
  const trustSignal = getPropertyTrustSignal(property);
  const categoryCounts = new Map<string, number>();

  for (const ticket of propertyTickets) {
    categoryCounts.set(ticket.category, (categoryCounts.get(ticket.category) ?? 0) + 1);
  }

  const commonIssueCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, count]) => ({ category, count }));

  const resolved = propertyTickets.filter((ticket) => ticket.trendBucket === "resolved").length;
  const unresolved = propertyTickets.filter((ticket) => ticket.trendBucket === "unresolved").length;

  return {
    id: property.id,
    displayName: getPropertyDisplayName(property),
    fullAddress: getPropertyFullAddress(property),
    streetAddress: property.streetAddress,
    city: property.city,
    state: property.state,
    zip: property.zip,
    propertyType: property.propertyType,
    landlordTrustScore: trustSignal.landlordTrustScore,
    confidenceLevel: trustSignal.confidenceLevel,
    trustTransparencyMessage: trustSignal.trustTransparencyMessage,
    hasVerifiedMaintenanceHistory: trustSignal.hasVerifiedMaintenanceHistory,
    completedMaintenanceTicketCount: trustSignal.completedMaintenanceTicketCount,
    independentTenantCount: trustSignal.independentTenantCount,
    verifiedConfirmationCount: trustSignal.verifiedConfirmationCount,
    weightedConfirmationCount: trustSignal.weightedConfirmationCount,
    averageRepairResponseTime: property.averageRepairResponseTime,
    averageCompletionTime: property.averageCompletionTime,
    ticketsCompletedOnTimeRate: property.ticketsCompletedOnTimeRate,
    urgentRepairCompletionSpeed: property.urgentRepairCompletionSpeed,
    repairHistorySummary: property.repairHistorySummary,
    commonIssueCategories,
    ticketTrends: {
      resolved,
      unresolved,
    },
  };
}

import type { VendorProfile } from "@/lib/demo-data";
import {
  getVendorAssignmentWarnings,
  getVendorComplianceBadge,
  getVendorVerificationBadges,
} from "@/lib/demo-data";

export function getComplianceBadgeTone(label: string) {
  if (label === "Licensed & Insured" || label === "Background Check Complete" || label === "Identity Verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    label === "Licensed only" ||
    label === "Insured only" ||
    label === "Verification Pending" ||
    label === "Verified on file"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function getVendorSummaryBadges(profile: VendorProfile) {
  return Array.from(
    new Set([getVendorComplianceBadge(profile), ...getVendorVerificationBadges(profile)]),
  );
}

export function getVendorStatusSummary(profile: VendorProfile, category: string) {
  return {
    complianceBadge: getVendorComplianceBadge(profile),
    verificationBadges: getVendorVerificationBadges(profile),
    warnings: getVendorAssignmentWarnings(profile, category),
  };
}

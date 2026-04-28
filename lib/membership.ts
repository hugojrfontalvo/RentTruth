export function getMembershipActionMessage(value?: string) {
  const mapping: Record<string, string> = {
    "address-saved":
      "Your rental address is saved. You can come back anytime to verify it with the landlord join code.",
    requested: "Your join request was sent to the landlord. You can log in and track the approval status here.",
    approved: "Tenant approved. They can now submit repair tickets and message the landlord.",
    denied: "Tenant request denied. They can still see their status, but they will not be able to act on the property.",
    removed: "Tenant removed from the property. Access to private property actions has been revoked.",
    "moved-out": "Tenant marked as moved out. Their property membership has been closed.",
    left: "You left this property. Private access has been removed from your tenant account.",
    "code-reset": "A new join code was generated for the property. Share the updated access details with tenants.",
    "unit-required":
      "This property requires an apartment or unit number before the tenant can be approved.",
  };

  return value ? mapping[value] ?? null : null;
}

type VendorCard = {
  userId: string;
  businessName: string;
  serviceCategories: string[];
  hourlyRate: number;
  emergencyRate: number;
  tripFee: number;
  pricingNotes: string;
  commonRepairCosts: string;
  baselineRepairPricing: Array<{
    item: string;
    label: string;
    typicalPrice?: number;
    laborAddOnNote?: string;
  }>;
  jobsAssigned: number;
  jobsAccepted: number;
  jobsCompleted: number;
  jobsDropped: number;
  completionRate: string;
  dropRate: string;
  averageAcceptanceTime: string;
  averageArrivalTime: string;
  averageCompletionTime: string;
  completionHistoryCount: number;
  ratingPlaceholder: string;
  complianceBadge: string;
  verificationBadges: string[];
  occupiedHomeEligibilityStatus: string;
  licenseStatus: string;
  insuranceStatus: string;
  requestStatus?: "Vendor interested" | "Vendor selected" | "Vendor declined" | null;
  requestedAt?: string;
  warnings: string[];
};

type VendorSelectionPanelProps = {
  approveVendorAction: (formData: FormData) => void | Promise<void>;
  declineVendorAction: (formData: FormData) => void | Promise<void>;
  assignLandlordVendorAction: (formData: FormData) => void | Promise<void>;
  ticketId: string;
  category: string;
  ticketStatus: string;
  currentVendorUserId?: string;
  currentVendorBusinessName?: string;
  vendors: VendorCard[];
};

function getComplianceBadgeTone(label: string) {
  if (
    label === "Licensed & Insured" ||
    label === "Background Check Complete" ||
    label === "Identity Verified"
  ) {
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

function getLowestVendor(
  vendors: VendorCard[],
  key: "hourlyRate" | "emergencyRate" | "tripFee",
) {
  return vendors.reduce<VendorCard | null>((lowest, vendor) => {
    if (!lowest || vendor[key] < lowest[key]) {
      return vendor;
    }

    return lowest;
  }, null);
}

function getMostCompleteVerificationVendor(vendors: VendorCard[]) {
  return vendors.reduce<VendorCard | null>((best, vendor) => {
    const score = vendor.warnings.length * -1 + vendor.verificationBadges.length;
    const bestScore = best ? best.warnings.length * -1 + best.verificationBadges.length : -Infinity;
    return score > bestScore ? vendor : best;
  }, null);
}

function parseHours(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : Infinity;
}

function getFastestVendor(
  vendors: VendorCard[],
  key: "averageArrivalTime" | "averageCompletionTime",
) {
  return vendors.reduce<VendorCard | null>((fastest, vendor) => {
    if (!fastest || parseHours(vendor[key]) < parseHours(fastest[key])) {
      return vendor;
    }

    return fastest;
  }, null);
}

function getMostCompletedVendor(vendors: VendorCard[]) {
  return vendors.reduce<VendorCard | null>((best, vendor) => {
    if (!best || vendor.jobsCompleted > best.jobsCompleted) {
      return vendor;
    }

    return best;
  }, null);
}

function CompareRow({
  label,
  vendor,
  value,
}: {
  label: string;
  vendor: VendorCard | null;
  value: string;
}) {
  return (
    <div className="w-full max-w-full rounded-2xl border border-sky-100 bg-white px-4 py-3 [overflow-wrap:anywhere]">
      <p className="break-words text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {vendor ? `${vendor.businessName} · ${value}` : "Not enough data yet"}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="w-full max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 [overflow-wrap:anywhere]">
      <p className="break-words text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

export function VendorSelectionPanel({
  approveVendorAction,
  declineVendorAction,
  assignLandlordVendorAction,
  ticketId,
  category,
  ticketStatus,
  currentVendorUserId,
  currentVendorBusinessName,
  vendors,
}: VendorSelectionPanelProps) {
  const interestedVendors = vendors.filter(
    (vendor) =>
      vendor.requestStatus === "Vendor interested" || vendor.userId === currentVendorUserId,
  );
  const lowestHourly = getLowestVendor(interestedVendors, "hourlyRate");
  const lowestEmergency = getLowestVendor(interestedVendors, "emergencyRate");
  const lowestTripFee = getLowestVendor(interestedVendors, "tripFee");
  const fastestArrival = getFastestVendor(interestedVendors, "averageArrivalTime");
  const fastestCompletion = getFastestVendor(interestedVendors, "averageCompletionTime");
  const mostCompleted = getMostCompletedVendor(interestedVendors);
  const mostCompleteVerification = getMostCompleteVerificationVendor(interestedVendors);

  return (
    <div className="mt-5 w-full max-w-full overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/90 p-3 [box-sizing:border-box] sm:rounded-[28px] sm:p-6">
      <div className="grid w-full max-w-full gap-4">
        <div className="min-w-0 max-w-full [overflow-wrap:anywhere]">
          <p className="break-words text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Vendor selection
          </p>
          <h5 className="mt-2 break-words font-display text-xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere] sm:text-2xl">
            Compare vendor fit for {category}
          </h5>
          <p className="mt-2 break-words text-sm leading-6 text-slate-500">
            Review interested vendors in a simple mobile-first list. No horizontal swiping required.
          </p>
        </div>

        <div className="flex max-w-full flex-wrap gap-2">
          <div className="max-w-full break-words rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 [overflow-wrap:anywhere]">
            {interestedVendors.length} interested
          </div>
          <div className="max-w-full break-words rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 [overflow-wrap:anywhere]">
            Ticket status: {ticketStatus}
          </div>
          {currentVendorBusinessName ? (
            <div className="max-w-full break-words rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 [overflow-wrap:anywhere]">
              Selected: {currentVendorBusinessName}
            </div>
          ) : null}
        </div>
      </div>

      <article className="mt-5 w-full max-w-full rounded-[24px] border border-sky-200 bg-sky-50 p-4 [box-sizing:border-box] [overflow-wrap:anywhere] sm:rounded-[28px] sm:p-5">
        <h6 className="break-words font-display text-2xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere]">
          Compare vendors
        </h6>
        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
          Quick signals across vendors who requested this ticket.
        </p>
        <div className="mt-4 grid w-full max-w-full gap-2">
          <CompareRow
            label="Lowest hourly"
            vendor={lowestHourly}
            value={lowestHourly ? `$${lowestHourly.hourlyRate}/hr` : ""}
          />
          <CompareRow
            label="Lowest trip fee"
            vendor={lowestTripFee}
            value={lowestTripFee ? `$${lowestTripFee.tripFee}` : ""}
          />
          <CompareRow
            label="Lowest emergency fee"
            vendor={lowestEmergency}
            value={lowestEmergency ? `$${lowestEmergency.emergencyRate}` : ""}
          />
          <CompareRow
            label="Most complete verification"
            vendor={mostCompleteVerification}
            value={mostCompleteVerification ? `${mostCompleteVerification.warnings.length} warning(s)` : ""}
          />
          <CompareRow
            label="Fastest average arrival"
            vendor={fastestArrival}
            value={fastestArrival?.averageArrivalTime ?? ""}
          />
          <CompareRow
            label="Fastest average completion"
            vendor={fastestCompletion}
            value={fastestCompletion?.averageCompletionTime ?? ""}
          />
          <CompareRow
            label="Most completed tickets"
            vendor={mostCompleted}
            value={mostCompleted ? `${mostCompleted.jobsCompleted} completed` : ""}
          />
        </div>
      </article>

      <div className="mt-5 grid w-full max-w-full gap-4">
        {interestedVendors.map((vendor) => {
          const isSelected = vendor.userId === currentVendorUserId;

          return (
            <article
              key={`${vendor.userId}-vertical`}
              className="w-full max-w-full rounded-[24px] border border-slate-200 bg-white p-4 [box-sizing:border-box] [overflow-wrap:anywhere] sm:rounded-[28px] sm:p-5"
            >
              <div className="grid max-w-full gap-2">
                <span
                  className={`w-fit max-w-full break-words rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] [overflow-wrap:anywhere] ${
                    isSelected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {isSelected ? "Vendor selected" : "Vendor interested"}
                </span>
                {vendor.requestedAt ? (
                  <span className="w-fit max-w-full break-words rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 [overflow-wrap:anywhere]">
                    Requested {vendor.requestedAt}
                  </span>
                ) : null}
              </div>

              <h6 className="mt-4 break-words font-display text-2xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere]">
                {vendor.businessName}
              </h6>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                {vendor.serviceCategories.join(" • ")}
              </p>

              <div className="mt-4 grid w-full max-w-full gap-2">
                <DetailRow label="Hourly rate" value={`$${vendor.hourlyRate}`} />
                <DetailRow label="Emergency rate" value={`$${vendor.emergencyRate}`} />
                <DetailRow label="Trip fee" value={`$${vendor.tripFee}`} />
                <DetailRow label="Completed jobs" value={vendor.jobsCompleted} />
                <DetailRow label="Average arrival" value={vendor.averageArrivalTime} />
                <DetailRow label="Average completion" value={vendor.averageCompletionTime} />
                <DetailRow label="License status" value={vendor.licenseStatus} />
                <DetailRow label="Insurance status" value={vendor.insuranceStatus} />
                <DetailRow label="Background status" value={vendor.occupiedHomeEligibilityStatus} />
                <DetailRow label="Website / social" value="Not added yet" />
              </div>

              <div className="mt-4 w-full max-w-full rounded-[20px] border border-slate-200 bg-slate-50 p-4 [overflow-wrap:anywhere]">
                <p className="break-words text-sm font-semibold text-slate-700">
                  Verification / documents
                </p>
                <div className="mt-3 grid gap-2">
                  <span
                    className={`w-fit max-w-full break-words rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] [overflow-wrap:anywhere] ${getComplianceBadgeTone(vendor.complianceBadge)}`}
                  >
                    {vendor.complianceBadge}
                  </span>
                  {vendor.verificationBadges.map((badge, index) => (
                    <span
                      key={`${vendor.userId}-badge-${badge}-${index}`}
                      className={`w-fit max-w-full break-words rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] [overflow-wrap:anywhere] ${getComplianceBadgeTone(badge)}`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 w-full max-w-full rounded-[20px] border border-slate-200 bg-slate-50 p-4 [overflow-wrap:anywhere]">
                <p className="break-words text-sm font-semibold text-slate-700">Warnings</p>
                {vendor.warnings.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {vendor.warnings.map((warning) => (
                      <span
                        key={`${vendor.userId}-warning-${warning}`}
                        className="break-words rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800 [overflow-wrap:anywhere]"
                      >
                        {warning}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                    No elevated warnings surfaced for this ticket.
                  </p>
                )}
              </div>

              <div className="mt-4 w-full max-w-full rounded-[20px] border border-slate-200 bg-slate-50 p-4 [overflow-wrap:anywhere]">
                <p className="break-words text-sm font-semibold text-slate-700">Common pricing</p>
                {vendor.baselineRepairPricing.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {vendor.baselineRepairPricing.slice(0, 3).map((entry) => (
                      <div
                        key={`${vendor.userId}-pricing-${entry.item}`}
                        className="grid w-full max-w-full gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 [overflow-wrap:anywhere]"
                      >
                        <p className="break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
                          {entry.label}
                        </p>
                        <p className="break-words text-sm font-semibold text-slate-700 [overflow-wrap:anywhere]">
                          {typeof entry.typicalPrice === "number" ? `$${entry.typicalPrice}` : "Not set"}
                        </p>
                        {entry.laborAddOnNote ? (
                          <p className="break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere]">
                            {entry.laborAddOnNote}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                    No structured common pricing is on file yet.
                  </p>
                )}
              </div>

              <div className="mt-4 grid w-full max-w-full gap-3">
                {isSelected ? (
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
                    Final vendor selected
                  </div>
                ) : (
                  <>
                    <form action={approveVendorAction}>
                      <input type="hidden" name="ticketId" value={ticketId} />
                      <input type="hidden" name="vendorUserId" value={vendor.userId} />
                      <button
                        type="submit"
                        className="min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                      >
                        Approve vendor
                      </button>
                    </form>
                    <form action={declineVendorAction}>
                      <input type="hidden" name="ticketId" value={ticketId} />
                      <input type="hidden" name="vendorUserId" value={vendor.userId} />
                      <button
                        type="submit"
                        className="min-h-[48px] w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
                      >
                        Decline vendor
                      </button>
                    </form>
                  </>
                )}
              </div>
            </article>
          );
        })}

        {interestedVendors.length === 0 ? (
          <div className="w-full max-w-full rounded-[20px] border border-dashed border-slate-300 bg-white p-4 text-sm leading-7 text-slate-500 [overflow-wrap:anywhere]">
            No vendors have requested this job yet. Matching local vendors can still view it and submit interest.
          </div>
        ) : null}
      </div>

      <details className="mt-5 w-full max-w-full rounded-[22px] border border-slate-200 bg-white p-4 [box-sizing:border-box] sm:rounded-[24px] sm:p-5">
        <summary className="cursor-pointer list-none break-words text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 [overflow-wrap:anywhere]">
          Use my own vendor
        </summary>
        <p className="mt-3 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
          Assign someone outside RentTruth and notify the tenant that your own vendor will handle this repair.
        </p>
        <form action={assignLandlordVendorAction} className="mt-4 grid gap-3">
          <input type="hidden" name="ticketId" value={ticketId} />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Vendor name</span>
            <input
              type="text"
              name="vendorName"
              required
              placeholder="AC Pro Miami"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Phone / contact</span>
            <input
              type="text"
              name="vendorContact"
              placeholder="(555) 123-4567"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Scheduled date / time</span>
            <input
              type="text"
              name="scheduledFor"
              placeholder="Tomorrow, 10:00 AM"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Note to tenant</span>
            <textarea
              name="tenantNote"
              rows={3}
              placeholder="I scheduled my regular technician. They will call before arrival."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
          </label>
          <button
            type="submit"
            className="min-h-[48px] rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Assign my own vendor
          </button>
        </form>
      </details>
    </div>
  );
}

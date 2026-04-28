import { saveVendorProfileAction } from "@/app/actions/vendor";
import { VendorServiceAreaFields } from "@/components/vendor-service-area-fields";
import {
  type CommonRepairPricingItem,
  type VendorProfile,
  type VendorServiceCategory,
} from "@/lib/demo-data";

type VendorProfileFormProps = {
  profile: VendorProfile | null;
  errorMessage?: string | null;
};

function getDocumentSubmissionStatus(isUploaded?: boolean) {
  return isUploaded ? "Documents Submitted" : "Not Verified Yet";
}

const vendorCategories: VendorServiceCategory[] = [
  "AC",
  "Plumbing",
  "Electrical",
  "Pest",
  "Appliance",
  "General Repair",
];

const baselineItems: Array<{ item: CommonRepairPricingItem; label: string }> = [
  { item: "capacitor", label: "Capacitor" },
  { item: "compressor", label: "Compressor" },
  { item: "thermostat", label: "Thermostat" },
  { item: "drain-clearing", label: "Drain clearing" },
  { item: "fan-motor", label: "Fan motor" },
  { item: "contactor", label: "Contactor" },
];

function PlatformStatusCard({
  label,
  status,
  detail,
}: {
  label: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3.5">
      <span className="block text-sm font-semibold text-slate-700">{label}</span>
      <span className="mt-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-900">
        {status}
      </span>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export function VendorProfileForm({
  profile,
  errorMessage,
}: VendorProfileFormProps) {
  const selectedState = profile?.serviceState ?? "FL";
  const selectedCities = profile?.serviceCities ?? [];

  return (
    <form action={saveVendorProfileAction} className="mt-8 space-y-8">
      {errorMessage ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Business name</span>
          <input
            type="text"
            name="businessName"
            defaultValue={profile?.businessName}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Legal contact name</span>
          <input
            type="text"
            name="legalContactName"
            defaultValue={profile?.legalContactName}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Phone</span>
          <input
            type="tel"
            name="phone"
            defaultValue={profile?.phone}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </label>
      </section>

      <VendorServiceAreaFields
        initialState={selectedState}
        initialCities={selectedCities}
      />

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Service categories
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vendorCategories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              <input
                type="checkbox"
                name="serviceCategories"
                value={category}
                defaultChecked={profile?.serviceCategories.includes(category)}
                className="h-4 w-4 rounded border-slate-300 text-ink focus:ring-orange-200"
              />
              {category}
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Hourly rate</span>
          <input
            type="number"
            min="0"
            step="1"
            name="hourlyRate"
            defaultValue={profile?.hourlyRate ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Emergency rate</span>
          <input
            type="number"
            min="0"
            step="1"
            name="emergencyRate"
            defaultValue={profile?.emergencyRate ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Trip / diagnostic fee</span>
          <input
            type="number"
            min="0"
            step="1"
            name="tripFee"
            defaultValue={profile?.tripFee ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </label>
      </section>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Common repair pricing notes</span>
        <textarea
          name="pricingNotes"
          rows={4}
          defaultValue={profile?.pricingNotes}
          placeholder="Use neutral, self-reported pricing notes. Final quotes can change after diagnosis."
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
        />
      </label>

      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Common repair baseline pricing
          </p>
          <p className="text-sm leading-6 text-slate-500">
            Add typical parts pricing for common repair items so landlords can compare quotes against your usual baseline before approving extra work.
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {baselineItems.map(({ item, label }) => {
            const existingEntry = profile?.baselineRepairPricing.find((entry) => entry.item === item);

            return (
              <div key={item} className="rounded-[22px] border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <div className="mt-4 grid gap-3">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Typical price
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name={`baselinePrice_${item}`}
                      defaultValue={existingEntry?.typicalPrice ?? ""}
                      placeholder="Typical price"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Typical labor add-on
                    </span>
                    <input
                      type="text"
                      name={`baselineLabor_${item}`}
                      defaultValue={existingEntry?.laborAddOnNote ?? ""}
                      placeholder="Optional labor note"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Common repair / part cost summary</span>
        <textarea
          name="commonRepairCosts"
          rows={4}
          defaultValue={profile?.commonRepairCosts}
          placeholder="Optional summary for anything that does not fit the structured baseline items above."
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
        />
      </label>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <span className="block text-sm font-semibold text-slate-700">Weekend availability</span>
            <span className="mt-1 block text-sm text-slate-500">Indicate whether weekend scheduling is available.</span>
          </div>
          <input
            type="checkbox"
            name="weekendAvailability"
            defaultChecked={profile?.weekendAvailability}
            className="h-5 w-5 rounded border-slate-300 text-ink focus:ring-orange-200"
          />
        </label>
        <label className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <span className="block text-sm font-semibold text-slate-700">Same-day availability</span>
            <span className="mt-1 block text-sm text-slate-500">Indicate whether same-day jobs can usually be accepted.</span>
          </div>
          <input
            type="checkbox"
            name="sameDayAvailability"
            defaultChecked={profile?.sameDayAvailability}
            className="h-5 w-5 rounded border-slate-300 text-ink focus:ring-orange-200"
          />
        </label>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">License and insurance</p>
          <div className="mt-5 grid gap-4">
            <PlatformStatusCard
              label="License status"
              status={profile?.licenseStatus ?? getDocumentSubmissionStatus(profile?.licenseDocumentUploaded)}
              detail="Platform/admin controlled. Upload your license document below so RentTruth staff can review it."
            />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">License type</span>
              <input type="text" name="licenseType" defaultValue={profile?.licenseType} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">License number</span>
                <input type="text" name="licenseNumber" defaultValue={profile?.licenseNumber} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Issuing state</span>
                <input type="text" name="issuingState" defaultValue={profile?.issuingState} maxLength={2} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 uppercase text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">License expiration date</span>
              <input type="date" name="licenseExpirationDate" defaultValue={profile?.licenseExpirationDate} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>

            <PlatformStatusCard
              label="Insurance status"
              status={profile?.insuranceStatus ?? getDocumentSubmissionStatus(profile?.insuranceDocumentUploaded)}
              detail="Platform/admin controlled. Upload proof of insurance below so staff can review it."
            />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Insurance company</span>
              <input type="text" name="insuranceCompany" defaultValue={profile?.insuranceCompany} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Policy number</span>
              <input type="text" name="policyNumber" defaultValue={profile?.policyNumber} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Insurance expiration date</span>
              <input type="date" name="insuranceExpirationDate" defaultValue={profile?.insuranceExpirationDate} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Trust and safety status</p>
          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Business / company name</span>
              <input type="text" name="companyName" defaultValue={profile?.companyName} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Contact info</span>
              <input type="text" name="contactInfo" defaultValue={profile?.contactInfo} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
            <PlatformStatusCard
              label="Identity verification status"
              status={profile?.identityVerificationStatus ?? getDocumentSubmissionStatus(profile?.identityVerificationDocumentUploaded)}
              detail="Vendors can submit identity documents, but RentTruth/admin review controls this status."
            />
            <PlatformStatusCard
              label="Background check status"
              status={profile?.backgroundCheckStatus ?? getDocumentSubmissionStatus(profile?.backgroundCheckDocumentUploaded)}
              detail="Vendors can upload confirmation placeholders, but cannot mark background checks complete."
            />
            <PlatformStatusCard
              label="Occupied-home eligibility"
              status={profile?.occupiedHomeEligibilityStatus ?? "Verification Pending"}
              detail="This eligibility is platform/admin controlled and does not guarantee personal safety."
            />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Safety notes placeholder</span>
              <textarea name="safetyNotes" rows={4} defaultValue={profile?.safetyNotes} placeholder="Use neutral wording like self-reported, verification pending, or verified on file." className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100" />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Document upload placeholders
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          These are placeholder upload states for now. They should reflect whether a document has been uploaded or verified on file, not guarantee quality or safety.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["licenseDocumentUploaded", "License document"],
            ["insuranceDocumentUploaded", "Certificate of insurance"],
            ["businessRegistrationDocumentUploaded", "Business registration"],
            ["backgroundCheckDocumentUploaded", "Background check confirmation"],
            ["identityVerificationDocumentUploaded", "Identity verification"],
          ].map(([name, label]) => (
            <label
              key={name}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
            >
              <input
                type="checkbox"
                name={name}
                defaultChecked={Boolean(profile?.[name as keyof VendorProfile])}
                className="h-4 w-4 rounded border-slate-300 text-ink focus:ring-orange-200"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <button
        type="submit"
        className="rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        Save Vendor Profile
      </button>
    </form>
  );
}

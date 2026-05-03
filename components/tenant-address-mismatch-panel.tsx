type TenantAddressMismatchPanelProps = {
  landlordAddress: string;
  tenantAddress: string;
  joinCode: string;
  isCloseMatch: boolean;
  requestTenantPropertyJoinAction: (formData: FormData) => void | Promise<void>;
};

export function TenantAddressMismatchPanel({
  landlordAddress,
  tenantAddress,
  joinCode,
  isCloseMatch,
  requestTenantPropertyJoinAction,
}: TenantAddressMismatchPanelProps) {
  return (
    <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
      <p className="font-semibold">
        This code belongs to a property that is close but does not exactly match your saved address.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-[20px] border border-amber-200 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
            This code belongs to
          </p>
          <p className="mt-2 text-slate-800">{landlordAddress}</p>
        </div>
        <div className="rounded-[20px] border border-amber-200 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
            Your saved address
          </p>
          <p className="mt-2 text-slate-800">{tenantAddress}</p>
        </div>
      </div>
      <p className="mt-3">
        {isCloseMatch
          ? "Is this the address you meant? You can use the landlord’s saved address if this is your home."
          : "If this is not your address, edit your saved address instead of requesting access."}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {isCloseMatch ? (
          <form action={requestTenantPropertyJoinAction}>
            <input type="hidden" name="intent" value="use-landlord-address" />
            <input type="hidden" name="joinCode" value={joinCode} />
            <button
              type="submit"
              className="min-h-[48px] w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 sm:w-auto"
            >
              Use landlord’s address
            </button>
          </form>
        ) : null}
        <a
          href="#edit-address"
          className="min-h-[48px] rounded-full border border-amber-300 bg-white px-5 py-3 text-center text-sm font-semibold text-amber-900 transition hover:-translate-y-0.5 hover:border-amber-400"
        >
          Edit my address
        </a>
      </div>
    </div>
  );
}

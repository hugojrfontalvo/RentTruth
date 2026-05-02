import { TenantJoinFields } from "@/components/tenant-join-fields";
import type { SavedTenantAddress } from "@/components/tenant-join-types";

type TenantJoinFormProps = {
  requestTenantPropertyJoinAction: (formData: FormData) => void | Promise<void>;
  initialSavedAddress?: SavedTenantAddress | null;
  initialJoinCode?: string;
};

export function TenantJoinForm({
  requestTenantPropertyJoinAction,
  initialSavedAddress,
  initialJoinCode,
}: TenantJoinFormProps) {
  return (
    <form action={requestTenantPropertyJoinAction} className="mt-6 space-y-5">
      <TenantJoinFields initialSavedAddress={initialSavedAddress} initialJoinCode={initialJoinCode} />
    </form>
  );
}

import { TenantJoinFields } from "@/components/tenant-join-fields";
import type { JoinableProperty, SavedTenantAddress } from "@/components/tenant-join-types";

type TenantJoinFormProps = {
  requestTenantPropertyJoinAction: (formData: FormData) => void | Promise<void>;
  initialSavedAddress?: SavedTenantAddress | null;
  properties: JoinableProperty[];
};

export function TenantJoinForm({
  requestTenantPropertyJoinAction,
  initialSavedAddress,
  properties,
}: TenantJoinFormProps) {
  return (
    <form action={requestTenantPropertyJoinAction} className="mt-6 space-y-5">
      <TenantJoinFields initialSavedAddress={initialSavedAddress} properties={properties} />
    </form>
  );
}

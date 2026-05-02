import { TenantJoinFieldsClient } from "@/components/tenant-join-fields-client";
import type { SavedTenantAddress } from "@/components/tenant-join-types";

type TenantJoinFieldsProps = {
  initialSavedAddress?: SavedTenantAddress | null;
};

export function TenantJoinFields({
  initialSavedAddress,
}: TenantJoinFieldsProps) {
  return (
    <TenantJoinFieldsClient
      initialSavedAddress={initialSavedAddress}
    />
  );
}

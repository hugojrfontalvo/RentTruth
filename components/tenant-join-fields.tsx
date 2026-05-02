import { TenantJoinFieldsClient } from "@/components/tenant-join-fields-client";
import type { SavedTenantAddress } from "@/components/tenant-join-types";

type TenantJoinFieldsProps = {
  initialSavedAddress?: SavedTenantAddress | null;
  initialJoinCode?: string;
};

export function TenantJoinFields({
  initialSavedAddress,
  initialJoinCode,
}: TenantJoinFieldsProps) {
  return (
    <TenantJoinFieldsClient
      initialSavedAddress={initialSavedAddress}
      initialJoinCode={initialJoinCode}
    />
  );
}

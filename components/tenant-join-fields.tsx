import { TenantJoinFieldsClient } from "@/components/tenant-join-fields-client";
import type { JoinableProperty, SavedTenantAddress } from "@/components/tenant-join-types";

type TenantJoinFieldsProps = {
  initialSavedAddress?: SavedTenantAddress | null;
  properties: JoinableProperty[];
};

export function TenantJoinFields({
  initialSavedAddress,
  properties,
}: TenantJoinFieldsProps) {
  return (
    <TenantJoinFieldsClient
      initialSavedAddress={initialSavedAddress}
      properties={properties}
    />
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { PostAuthBridgeShell } from "@/components/post-auth-bridge-shell";

export default async function LandlordReadyPage() {
  const session = await getSession();
  console.log("landlord ready bridge session loaded", {
    hasSession: Boolean(session),
    role: session?.role,
  });

  if (session && session.role !== "landlord") {
    redirect(session.role === "tenant" ? "/dashboard/tenant" : "/dashboard");
  }

  return (
    <PostAuthBridgeShell
      role="landlord"
      targetPath="/dashboard/landlord"
      retryPath="/dashboard/landlord/ready"
      sessionConfirmed={session?.role === "landlord"}
    />
  );
}

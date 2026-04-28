import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { PostAuthBridgeShell } from "@/components/post-auth-bridge-shell";

export default async function TenantReadyPage() {
  const session = await getSession();
  console.log("tenant ready bridge session loaded", {
    hasSession: Boolean(session),
    role: session?.role,
  });

  if (session && session.role !== "tenant") {
    redirect("/dashboard");
  }

  return (
    <PostAuthBridgeShell
      role="tenant"
      targetPath="/dashboard/tenant"
      retryPath="/dashboard/tenant/ready"
      sessionConfirmed={session?.role === "tenant"}
    />
  );
}

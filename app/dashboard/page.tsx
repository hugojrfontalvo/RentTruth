import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "tenant") {
    redirect("/dashboard/tenant");
  }

  if (session.role === "landlord") {
    redirect("/dashboard/landlord");
  }

  if (session.role === "vendor") {
    redirect("/dashboard/vendor");
  }

  if (session.role === "admin") {
    redirect("/dashboard/admin");
  }
  redirect("/login");
}

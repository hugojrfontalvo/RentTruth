import { type SessionUser } from "@/lib/auth";

const DEFAULT_ADMIN_EMAILS = ["admin@renttruth.com"];

export function getConfiguredAdminEmails() {
  const configuredEmails = (process.env.RENTTRUTH_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configuredEmails.length > 0 ? configuredEmails : DEFAULT_ADMIN_EMAILS;
}

export function isConfiguredAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
}

export function isAdminSession(session: SessionUser | null) {
  return Boolean(session && session.role === "admin" && isConfiguredAdminEmail(session.email));
}

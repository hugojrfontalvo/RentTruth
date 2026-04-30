"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createUserPersisted,
  findUserByEmail,
  findUserById,
  hydratePersistentStore,
  validateUserLogin,
} from "@/lib/demo-data";
import {
  getDashboardPath,
  isAppRole,
  isUserRole,
  type SessionUser,
  type AppRole,
  type UserRole,
} from "@/lib/auth";
import { isConfiguredAdminEmail } from "@/lib/admin-access";

const SESSION_COOKIE = "renttruth_session";

type SessionCookiePayload = {
  userId?: string;
  email?: string;
  role?: string;
};

function extractLoginCredentials(
  formData: FormData,
): {
  email: string;
  password: string;
  role: AppRole;
} {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleValue = String(formData.get("role") ?? "");

  if (!email || !password || !isAppRole(roleValue)) {
    redirect(`/login?error=missing-fields&role=${roleValue || "tenant"}`);
  }

  return { email, password, role: roleValue };
}

function extractSignupCredentials(
  formData: FormData,
): {
  email: string;
  password: string;
  role: UserRole;
} {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleValue = String(formData.get("role") ?? "");

  if (!email || !password || !isUserRole(roleValue)) {
    redirect(`/signup?error=missing-fields&role=${roleValue || "tenant"}`);
  }

  return { email, password, role: roleValue };
}

async function writeSessionCookie(user: { id: string; email: string; role: AppRole }) {
  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    JSON.stringify({ userId: user.id, email: user.email, role: user.role }),
    {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      path: "/",
    },
  );

  const sessionSaved = Boolean(cookieStore.get(SESSION_COOKIE)?.value);
  console.log(`${user.role} session saved`, {
    sessionSaved,
    userId: user.id,
  });

  return sessionSaved;
}

async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

function getPostAuthDashboardPath(role: AppRole) {
  if (role === "tenant") {
    return "/dashboard/tenant/ready";
  }

  if (role === "landlord") {
    return "/dashboard/landlord/ready";
  }

  return getDashboardPath(role);
}

function parseSessionCookie(raw: string): SessionCookiePayload | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  let normalized = trimmed;

  try {
    normalized = decodeURIComponent(trimmed);
  } catch {
    normalized = trimmed;
  }

  if (!(normalized.startsWith("{") || normalized.startsWith("["))) {
    return null;
  }

  try {
    return JSON.parse(normalized) as SessionCookiePayload;
  } catch {
    return null;
  }
}

export async function loginAction(formData: FormData) {
  await hydratePersistentStore();
  const { email, password, role } = extractLoginCredentials(formData);
  console.log(`${role} login submitted`);
  const adminUser = isConfiguredAdminEmail(email) ? findUserByEmail(email) : null;
  const user =
    adminUser?.role === "admin" && adminUser.password === password
      ? adminUser
      : validateUserLogin(email, password, role);
  console.log("login user lookup result", {
    email,
    requestedRole: role,
    found: Boolean(user),
    userId: user?.id,
    userRole: user?.role,
  });

  if (!user) {
    redirect(`/login?error=invalid-credentials&role=${role}`);
  }

  const sessionSaved = await writeSessionCookie(user);
  const redirectPath = getPostAuthDashboardPath(user.role);
  console.log(`${user.role} redirect starting`, {
    redirectPath,
    sessionSaved,
  });
  redirect(redirectPath);
}

export async function signupAction(formData: FormData) {
  await hydratePersistentStore();
  const { email, password, role } = extractSignupCredentials(formData);
  console.log(`${role} signup submitted`);
  const name = String(formData.get("name") ?? "").trim();

  if (findUserByEmail(email)) {
    redirect(`/signup?error=email-taken&role=${role}`);
  }

  let user;

  try {
    console.log("user save started", { email, role });
    user = await createUserPersisted({
      name,
      email,
      password,
      role,
    });
    console.log("user saved successfully", {
      email: user.email,
      role: user.role,
      userId: user.id,
    });
  } catch (error) {
    console.error("user save failed", { email, role, error });
    redirect(`/signup?error=save-failed&role=${role}`);
  }

  const sessionSaved = await writeSessionCookie(user);
  const redirectPath = getPostAuthDashboardPath(user.role);
  console.log(`${user.role} redirect starting`, {
    redirectPath,
    sessionSaved,
  });
  redirect(redirectPath);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function getSession(): Promise<SessionUser | null> {
  await hydratePersistentStore();
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  const parsed = parseSessionCookie(raw);

  if (!parsed) {
    return null;
  }

  if (parsed.userId) {
    const user = findUserById(parsed.userId);

    if (user) {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        savedAddress: user.savedAddress,
        savedStreetAddress: user.savedStreetAddress,
        savedCity: user.savedCity,
        savedState: user.savedState,
        savedZip: user.savedZip,
        savedPropertyType: user.savedPropertyType,
        propertyId: user.propertyId,
        unitNumber: user.unitNumber,
        membershipStatus: user.membershipStatus,
        membershipRequestedAt: user.membershipRequestedAt,
        tenantVerificationLevel: user.tenantVerificationLevel,
        linkedToLandlord: user.linkedToLandlord,
      };
    }
  }

  const parsedRole = parsed.role === "staff" ? "admin" : parsed.role;

  if (!parsed.email || !parsedRole || !isAppRole(parsedRole)) {
    return null;
  }

  const fallbackUser = findUserByEmail(parsed.email);

  if (!fallbackUser || fallbackUser.role !== parsedRole) {
    return null;
  }

  return {
    id: fallbackUser.id,
    email: fallbackUser.email,
    role: fallbackUser.role,
    name: fallbackUser.name,
    savedAddress: fallbackUser.savedAddress,
    savedStreetAddress: fallbackUser.savedStreetAddress,
    savedCity: fallbackUser.savedCity,
    savedState: fallbackUser.savedState,
    savedZip: fallbackUser.savedZip,
    savedPropertyType: fallbackUser.savedPropertyType,
    propertyId: fallbackUser.propertyId,
    unitNumber: fallbackUser.unitNumber,
    membershipStatus: fallbackUser.membershipStatus,
    membershipRequestedAt: fallbackUser.membershipRequestedAt,
    tenantVerificationLevel: fallbackUser.tenantVerificationLevel,
    linkedToLandlord: fallbackUser.linkedToLandlord,
  };
}

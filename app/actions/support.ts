"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { notifyAdminOfNewFeedback } from "@/lib/notifications";
import {
  createSupportTicket,
  flushPersistentStore,
  getSupportTicketCategories,
  getSupportTicketUrgencies,
  type SupportTicketCategory,
  type SupportTicketUrgency,
} from "@/lib/demo-data";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isSupportCategory(value: string): value is SupportTicketCategory {
  return getSupportTicketCategories().includes(value as SupportTicketCategory);
}

function isSupportUrgency(value: string): value is SupportTicketUrgency {
  return getSupportTicketUrgencies().includes(value as SupportTicketUrgency);
}

export async function submitSupportTicketAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role === "admin") {
    redirect("/login");
  }

  const categoryValue = readString(formData, "category");
  const message = readString(formData, "message");
  const subject =
    readString(formData, "subject") ||
    (message ? `App feedback from ${session.role}` : "");
  const description = readString(formData, "description") || message;
  const urgencyValue = readString(formData, "urgency");
  const contactEmail = readString(formData, "contactEmail") || session.email;
  const screenshotPlaceholder =
    readString(formData, "screenshotPlaceholder") || "No file uploaded";

  if (
    !isSupportCategory(categoryValue) ||
    !subject ||
    !description ||
    !isSupportUrgency(urgencyValue)
  ) {
    redirect("/support?error=missing-fields");
  }

  createSupportTicket({
    category: categoryValue,
    subject,
    description,
    screenshotPlaceholder,
    urgency: urgencyValue,
    userRole: session.role,
    userId: session.id,
    userEmail: contactEmail,
    userName: session.name,
  });
  await flushPersistentStore();
  await notifyAdminOfNewFeedback({
    message: description,
    userEmail: contactEmail,
    role: session.role,
  });

  redirect("/support?submitted=1");
}

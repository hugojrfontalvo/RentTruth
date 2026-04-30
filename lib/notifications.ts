import { type UserRole } from "@/lib/auth";

type FeedbackNotificationInput = {
  message: string;
  userEmail: string;
  role: UserRole;
};

function getAdminEmail() {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.RENTTRUTH_ADMIN_EMAILS?.split(",")[0]?.trim() ||
    "admin@renttruth.com"
  );
}

function getEmailFromAddress() {
  return process.env.EMAIL_FROM?.trim() || "RentTruth <notifications@renttruth.io>";
}

async function sendFeedbackEmail(input: FeedbackNotificationInput) {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
  const adminEmail = getAdminEmail();

  if (!apiKey || !adminEmail) {
    console.log("RentTruth feedback email skipped: ADMIN_EMAIL or EMAIL_PROVIDER_API_KEY is not configured.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFromAddress(),
      to: [adminEmail],
      subject: "New RentTruth Feedback",
      text: [
        "New feedback received on RentTruth.",
        "",
        `Role: ${input.role}`,
        `User email: ${input.userEmail}`,
        "",
        "Message:",
        input.message,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("RentTruth feedback email failed.", { status: response.status, detail });
  }
}

async function sendFeedbackSms() {
  const apiKey = process.env.SMS_PROVIDER_API_KEY?.trim();
  const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER?.trim();

  if (!apiKey || !adminPhoneNumber) {
    return;
  }

  const response = await fetch("https://textbelt.com/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: adminPhoneNumber,
      message: "New feedback received on RentTruth",
      key: apiKey,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("RentTruth feedback SMS failed.", { status: response.status, detail });
  }
}

export async function notifyAdminOfNewFeedback(input: FeedbackNotificationInput) {
  await Promise.allSettled([sendFeedbackEmail(input), sendFeedbackSms()]);
}

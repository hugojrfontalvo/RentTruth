import { submitSupportTicketAction } from "@/app/actions/support";
import { SubmitButton } from "@/components/submit-button";
import { roleLabels, type UserRole } from "@/lib/auth";

type SupportTicketFormProps = {
  email: string;
  role: UserRole;
  defaultCategory?: string;
  errorMessage?: string | null;
};

function getDefaultCategory(intent?: string) {
  if (intent === "bug") {
    return "Bug";
  }

  if (intent === "feature") {
    return "Feature Request";
  }

  return "Support";
}

export function SupportTicketForm({
  email,
  role,
  defaultCategory,
  errorMessage,
}: SupportTicketFormProps) {
  const selectedCategory = defaultCategory ?? getDefaultCategory();

  return (
    <form action={submitSupportTicketAction} className="mt-8 space-y-5">
      <input type="hidden" name="category" value={selectedCategory} />
      <input type="hidden" name="urgency" value="Normal" />
      <input type="hidden" name="subject" value={`App feedback: ${selectedCategory}`} />
      <input type="hidden" name="screenshotPlaceholder" value="No file uploaded" />

      {errorMessage ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Logged-in role</span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700">
            {roleLabels[role]}
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Contact email</span>
          <input
            type="email"
            name="contactEmail"
            defaultValue={email}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Message</span>
        <textarea
          name="message"
          rows={6}
          required
          placeholder="Tell the RentTruth team what happened, what you expected, or what would make the app better."
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
      </label>

      <SubmitButton
        label="Send Feedback"
        pendingLabel="Submitting..."
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </form>
  );
}

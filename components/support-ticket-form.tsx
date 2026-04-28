import { submitSupportTicketAction } from "@/app/actions/support";
import { SubmitButton } from "@/components/submit-button";
import {
  getSupportTicketCategories,
  getSupportTicketUrgencies,
} from "@/lib/demo-data";
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
  const categories = getSupportTicketCategories();
  const urgencies = getSupportTicketUrgencies();
  const selectedCategory = defaultCategory ?? getDefaultCategory();

  return (
    <form action={submitSupportTicketAction} className="mt-8 space-y-5">
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
          <span className="mb-2 block text-sm font-semibold text-slate-700">Account email</span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700">
            {email}
          </div>
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-[0.4fr_0.6fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Category</span>
          <select
            name="category"
            defaultValue={categories.includes(selectedCategory as never) ? selectedCategory : "Support"}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Urgency level</span>
          <select
            name="urgency"
            defaultValue="Normal"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          >
            {urgencies.map((urgency) => (
              <option key={urgency}>{urgency}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Subject</span>
        <input
          type="text"
          name="subject"
          required
          placeholder="Short summary of the issue or request"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Description</span>
        <textarea
          name="description"
          rows={6}
          required
          placeholder="Tell the RentTruth team what happened, what you expected, and anything that would help us reproduce or prioritize it."
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Screenshot / file upload placeholder</span>
        <input
          type="text"
          name="screenshotPlaceholder"
          placeholder="Example: Screenshot placeholder attached"
          className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />
      </label>

      <SubmitButton
        label="Submit Support Ticket"
        pendingLabel="Submitting..."
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      />
    </form>
  );
}

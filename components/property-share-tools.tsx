import { ClipboardButton } from "@/components/clipboard-button";
import { ShareButton } from "@/components/share-button";

type PropertyShareToolsProps = {
  joinCode: string;
  shareText: string;
  smsPreview: string;
};

export function PropertyShareTools({
  joinCode,
  shareText,
  smsPreview,
}: PropertyShareToolsProps) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <ClipboardButton
        value={joinCode}
        label="Copy Code"
        copiedLabel="Code copied"
        className="min-h-[50px] rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
      />
      <ShareButton
        title="RentTruth tenant access"
        text={shareText}
        label="Share Code"
        fallbackLabel="Copy details instead"
        className="min-h-[50px] rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
      />
      <ClipboardButton
        value={shareText}
        label="Copy Access Details"
        copiedLabel="Details copied"
        className="min-h-[50px] rounded-full border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 transition hover:-translate-y-0.5 hover:border-sky-300"
      />
      <ClipboardButton
        value={smsPreview}
        label="Copy SMS Draft"
        copiedLabel="SMS draft copied"
        className="min-h-[50px] rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:col-span-3"
      />
    </div>
  );
}

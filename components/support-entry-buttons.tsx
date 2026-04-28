type SupportEntryButtonsProps = {
  className?: string;
};

const supportLinks = [
  {
    label: "Maintenance Request",
    href: "#maintenance-request",
    className:
      "border-cyan-300/30 bg-cyan-300/16 text-white hover:bg-cyan-300/22",
  },
  {
    label: "App Help & Feedback",
    href: "/support?intent=help",
    className:
      "border-white/15 bg-white/10 text-white/85 hover:bg-white/15",
  },
] as const;

export function SupportEntryButtons({
  className = "",
}: SupportEntryButtonsProps) {
  return (
    <div className={`grid gap-3 sm:flex sm:flex-wrap ${className}`.trim()}>
      {supportLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className={`min-h-[48px] rounded-full border px-4 py-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 sm:min-h-0 sm:py-2 ${link.className}`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";

type ClipboardButtonProps = {
  value: string;
  label: string;
  copiedLabel?: string;
  className?: string;
};

function fallbackCopyText(value: string) {
  if (typeof document === "undefined") {
    return false;
  }

  const textArea = document.createElement("textarea");

  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "-9999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

export function ClipboardButton({
  value,
  label,
  copiedLabel = "Copied",
  className,
}: ClipboardButtonProps) {
  const [buttonLabel, setButtonLabel] = useState(label);

  return (
    <button
      type="button"
      className={className}
      aria-live="polite"
      onClick={async () => {
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
          } else if (!fallbackCopyText(value)) {
            throw new Error("Fallback copy failed");
          }

          setButtonLabel(copiedLabel);
        } catch {
          if (!fallbackCopyText(value)) {
            setButtonLabel("Press and hold to copy");
            if (typeof window !== "undefined") {
              window.setTimeout(() => setButtonLabel(label), 1800);
            }
            return;
          }

          setButtonLabel(copiedLabel);
        }

        if (typeof window !== "undefined") {
          window.setTimeout(() => setButtonLabel(label), 1500);
        }
      }}
    >
      {buttonLabel}
    </button>
  );
}

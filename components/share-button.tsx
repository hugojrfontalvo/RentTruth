"use client";

import { useState } from "react";

type ShareButtonProps = {
  title: string;
  text: string;
  label?: string;
  fallbackLabel?: string;
  className?: string;
};

export function ShareButton({
  title,
  text,
  label = "Share Code",
  fallbackLabel = "Sharing not available",
  className,
}: ShareButtonProps) {
  const [buttonLabel, setButtonLabel] = useState(label);

  return (
    <button
      type="button"
      className={className}
      aria-live="polite"
      onClick={async () => {
        if (typeof navigator === "undefined" || !navigator.share) {
          setButtonLabel(fallbackLabel);
          if (typeof window !== "undefined") {
            window.setTimeout(() => setButtonLabel(label), 1800);
          }
          return;
        }

        try {
          await navigator.share({ title, text });
          setButtonLabel("Shared");
          if (typeof window !== "undefined") {
            window.setTimeout(() => setButtonLabel(label), 1500);
          }
        } catch {
          setButtonLabel(label);
        }
      }}
    >
      {buttonLabel}
    </button>
  );
}

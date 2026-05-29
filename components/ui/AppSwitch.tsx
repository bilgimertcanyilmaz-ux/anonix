"use client";

interface AppSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function AppSwitch({
  checked,
  onChange,
  label,
  description,
  disabled,
  size = "md",
}: AppSwitchProps) {
  const trackSize = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumbSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const thumbOn = size === "sm" ? "translate-x-[16px]" : "translate-x-[22px]";

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative shrink-0 rounded-full transition-colors duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        trackSize,
        checked ? "bg-brand-500 shadow-glow-sm" : "bg-white/15",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 rounded-full bg-white shadow transition-transform duration-300",
          thumbSize,
          checked ? thumbOn : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );

  if (!label) return toggle;

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        {description && (
          <span className="block text-xs text-slate-400">{description}</span>
        )}
      </span>
      {toggle}
    </label>
  );
}

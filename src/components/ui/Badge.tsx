interface BadgeProps {
  label: string;
  variant?: "default" | "green" | "red" | "amber" | "blue" | "violet" | "outline";
  size?: "sm" | "md";
}

const VARIANTS = {
  default: "bg-[#21262d] text-[#8b949e]",
  green:   "bg-emerald-500/15 text-emerald-400",
  red:     "bg-red-500/15 text-red-400",
  amber:   "bg-amber-500/15 text-amber-400",
  blue:    "bg-blue-500/15 text-blue-400",
  violet:  "bg-violet-500/15 text-violet-400",
  outline: "border border-[#30363d] text-[#7d8590]",
};

export function Badge({ label, variant = "default", size = "sm" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${VARIANTS[variant]}`}
    >
      {label}
    </span>
  );
}

export function AssetClassBadge({ assetClass }: { assetClass: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    crypto:   "amber",
    equity:   "blue",
    cash:     "green",
    property: "violet",
    other:    "default",
  };
  return <Badge label={assetClass} variant={map[assetClass] ?? "default"} />;
}

export function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, BadgeProps["variant"]> = {
    buy:            "green",
    sell:           "red",
    deposit:        "blue",
    withdrawal:     "red",
    transfer_in:    "violet",
    transfer_out:   "outline",
    staking_reward: "amber",
    dividend:       "green",
    interest:       "green",
    fee:            "red",
    airdrop:        "amber",
  };
  const label = type.replace("_", " ");
  return <Badge label={label} variant={map[type] ?? "default"} />;
}

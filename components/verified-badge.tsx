import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type VerifiedBadgeProps = {
  label?: string;
  className?: string;
};

export function VerifiedBadge({
  label = "Conta verificada",
  className,
}: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold text-primary",
        className
      )}
    >
      <BadgeCheck className="h-4 w-4" />
      {label}
    </span>
  );
}


import { cn } from "@/lib/utils";

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const COLOR_CLASSES = [
  "bg-blue-100 text-blue-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-indigo-100 text-indigo-800",
  "bg-slate-100 text-slate-700",
];

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "??";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  return `${first[0]}${last[0]}`.toUpperCase();
};

const getColorClass = (reference?: string | null) => {
  if (!reference) return COLOR_CLASSES[0];
  let hash = 0;
  for (let i = 0; i < reference.length; i += 1) {
    hash = (hash << 5) - hash + reference.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_CLASSES.length;
  return COLOR_CLASSES[index];
};

type UserAvatarProps = {
  name?: string | null;
  identifier?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function UserAvatar({
  name,
  identifier,
  size = "md",
  className,
}: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold uppercase",
        SIZE_CLASSES[size],
        getColorClass(identifier ?? name ?? ""),
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}


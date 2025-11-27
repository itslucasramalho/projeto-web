import { type ComponentType } from "react";
import { cn } from "@/lib/utils";

type StanceVariant = "for" | "neutral" | "against";

export const STANCE_STYLES: Record<
  StanceVariant,
  {
    icon: string;
    iconBg: string;
    underline: string;
    bar: string;
    hoverBtn: string;
    hoverIcon: string;
    hoverUnderline: string;
  }
> = {
  for: {
    icon: "text-emerald-600",
    iconBg: "bg-emerald-100",
    underline: "bg-emerald-500",
    bar: "bg-emerald-500",
    hoverBtn:
      "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 hover:shadow-sm",
    hoverIcon:
      "hover:bg-emerald-200 hover:text-emerald-700 group-hover:bg-emerald-100 group-hover:text-emerald-700",
    hoverUnderline:
      "group-hover:scale-100 group-hover:opacity-90 group-hover:bg-emerald-500 hover:scale-100 hover:opacity-90 hover:bg-emerald-500",
  },
  neutral: {
    icon: "text-amber-600",
    iconBg: "bg-amber-50",
    underline: "bg-amber-500",
    bar: "bg-amber-500",
    hoverBtn:
      "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 hover:shadow-sm",
    hoverIcon:
      "hover:bg-amber-200 hover:text-amber-700 group-hover:bg-amber-100 group-hover:text-amber-700",
    hoverUnderline:
      "group-hover:scale-100 group-hover:opacity-90 group-hover:bg-amber-500 hover:scale-100 hover:opacity-90 hover:bg-amber-500",
  },
  against: {
    icon: "text-rose-600",
    iconBg: "bg-rose-100",
    underline: "bg-rose-500",
    bar: "bg-rose-500",
    hoverBtn:
      "hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 hover:shadow-sm",
    hoverIcon:
      "hover:bg-rose-200 hover:text-rose-700 group-hover:bg-rose-100 group-hover:text-rose-700",
    hoverUnderline:
      "group-hover:scale-100 group-hover:opacity-90 group-hover:bg-rose-500 hover:scale-100 hover:opacity-90 hover:bg-rose-500",
  },
};

type StanceIconProps = {
  variant: StanceVariant;
  active?: boolean;
  icon: ComponentType<{ className?: string }>;
  className?: string;
};

export const StanceIcon = ({
  variant,
  active,
  icon: Icon,
  className,
}: StanceIconProps) => {
  const theme = STANCE_STYLES[variant];

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
        active
          ? `${theme.iconBg} ${theme.icon}`
          : cn("bg-muted text-muted-foreground", theme.hoverIcon),
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      <span
        className={cn(
          "absolute -bottom-1 left-2 right-2 h-0.5 rounded-full transition-all duration-200",
          active
            ? `scale-100 opacity-100 ${theme.underline}`
            : cn("scale-75 opacity-0", theme.hoverUnderline),
        )}
      />
    </div>
  );
};

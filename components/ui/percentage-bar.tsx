type PercentageBarProps = {
  label: string;
  percentage: number;
  barClass: string;
};

export const PercentageBar = ({
  label,
  percentage,
  barClass,
}: PercentageBarProps) => {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all ${barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

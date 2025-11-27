"use client";

import { useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PercentageBar } from "@/components/ui/percentage-bar";
import { STANCE_STYLES, StanceIcon } from "@/components/ui/stance-icon";
import {
  CheckCircle2,
  Loader2,
  Minus,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

type StanceValue = "for" | "against" | "neutral";

type Counts = Record<StanceValue, number>;

type Props = {
  propositionId: string;
  userId?: string | null;
  currentStance: StanceValue | null;
  counts: Counts;
};

const OPTIONS: {
  value: StanceValue;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    value: "for",
    label: "Apoio",
    description: "Sou a favor desta proposta",
    icon: ThumbsUp,
  },
  {
    value: "neutral",
    label: "Neutro",
    description: "Quero entender mais antes de decidir",
    icon: Minus,
  },
  {
    value: "against",
    label: "Contra",
    description: "Não concordo com a proposta",
    icon: ThumbsDown,
  },
];

const STANCE_LABELS: Record<StanceValue, string> = {
  for: "Favoráveis",
  against: "Contrários",
  neutral: "Neutros",
};

export function StancePoll({
  propositionId,
  userId,
  currentStance,
  counts,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<StanceValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalVotes = counts.for + counts.against + counts.neutral;

  const handleVote = async (value: StanceValue) => {
    if (!userId) {
      setError("Faça login para participar da enquete.");
      return;
    }

    setPending(value);
    setError(null);

    const supabase = createClient();
    try {
      if (currentStance === value) {
        await supabase
          .from("stances")
          .delete()
          .eq("proposition_id", propositionId)
          .eq("user_id", userId);
      } else {
        const { error } = await supabase.from("stances").upsert(
          {
            proposition_id: propositionId,
            user_id: userId,
            stance: value,
          },
          { onConflict: "proposition_id,user_id" }
        );

        if (error) {
          console.error("[stance-poll] Error registering vote", error);
          throw error;
        }
      }

      router.refresh();
    } catch {
      console.error("[stance-poll] Error registering vote");
      setError("Não foi possível registrar seu voto.");
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">
            Enquete rápida
          </p>
          <p className="text-xs text-muted-foreground">
            {totalVotes} voto(s) registrados
          </p>
        </div>
        {currentStance && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Você já votou
          </span>
        )}
      </div>

      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = currentStance === option.value;
          const isLoading = pending === option.value;
          const isActive = isSelected;
          const theme = STANCE_STYLES[option.value];
          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? option.value : "outline"}
              className={`w-full justify-between py-6 group ${
                !isActive ? theme.hoverBtn : ""
              }`}
              disabled={pending !== null && pending !== option.value}
              onClick={() => handleVote(option.value)}
            >
              <div className="flex items-center gap-3 text-left">
                <StanceIcon
                  variant={option.value}
                  active={isActive}
                  icon={Icon}
                />
                <div>
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  counts[option.value]
                )}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="space-y-2">
        {(["for", "neutral", "against"] as StanceValue[]).map((value) => {
          const theme = STANCE_STYLES[value];
          const percentage = totalVotes
            ? Math.round((counts[value] / totalVotes) * 100)
            : 0;
          const label = STANCE_LABELS[value];
          return (
            <PercentageBar
              key={value}
              label={label}
              percentage={percentage}
              barClass={theme.bar}
            />
          );
        })}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}

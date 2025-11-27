"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type SentimentStats = {
  positive?: number;
  neutral?: number;
  negative?: number;
};

type Props = {
  propositionId: string;
  summary: {
    summary_text: string | null;
    updated_at: string | null;
    total_comments: number;
    sentiment: SentimentStats | null;
  } | null;
  totalComments: number;
  isAdmin: boolean;
};

export function CommentSummaryCard({
  propositionId,
  summary,
  totalComments,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/summarize-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propositionId }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar o resumo agora.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsRefreshing(false);
    }
  };

  const needsMoreComments = totalComments < 10;
  const fallbackText = needsMoreComments
    ? `Precisamos de mais ${Math.max(0, 10 - totalComments)} comentário(s) para gerar o primeiro resumo.`
    : "Resumo pendente. Clique para atualizar manualmente.";

  const sentiment = summary?.sentiment ?? {};

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">
            Resumo da opinião popular
          </p>
          <p className="text-xs text-muted-foreground">
            {summary?.updated_at
              ? `Atualizado em ${new Date(summary.updated_at).toLocaleString(
                  "pt-BR",
                )}`
              : "Aguardando processamento da IA"}
          </p>
        </div>
        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing || totalComments === 0}
          >
            <Sparkles className="h-4 w-4" />
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {summary?.summary_text ?? fallbackText}
      </p>

      {summary && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md bg-emerald-100/40 p-2 text-emerald-800">
            <p className="text-lg font-semibold">
              {sentiment.positive ?? 0}
            </p>
            <p>Favoráveis</p>
          </div>
          <div className="rounded-md bg-amber-100/40 p-2 text-amber-800">
            <p className="text-lg font-semibold">
              {sentiment.neutral ?? 0}
            </p>
            <p>Neutros</p>
          </div>
          <div className="rounded-md bg-rose-100/40 p-2 text-rose-800">
            <p className="text-lg font-semibold">
              {sentiment.negative ?? 0}
            </p>
            <p>Contrários</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        O resumo é atualizado automaticamente a cada 10 novos comentários
        {isAdmin ? " ou manualmente via botão acima." : "."}
      </p>
    </section>
  );
}


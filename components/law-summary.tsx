"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Volume2, Pause, Play, Loader2 } from "lucide-react";

type LawSummaryProps = {
  propositionId: string;
  summary: string | null;
  updatedAt: string | null;
  isAdmin: boolean;
};

export function LawSummary({
  propositionId,
  summary,
  updatedAt,
  isAdmin,
}: LawSummaryProps) {
  const router = useRouter();

  const [content, setContent] = useState(summary);
  const [lastUpdated, setLastUpdated] = useState(updatedAt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const autoRequestedRef = useRef(false);

  // --- CONTROLE DE ÁUDIO  ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    setContent(summary);
    setLastUpdated(updatedAt);
    setStatusMessage(null);
    setError(null);
    autoRequestedRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setHasAudio(false);
  }, [summary, updatedAt, propositionId]);

  const requestSummary = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      setIsLoading(true);
      setError(null);
      setStatusMessage(
        force
          ? "Atualizando resumo com IA..."
          : "Gerando resumo automaticamente, aguarde alguns segundos..."
      );
      try {
        const response = await fetch(
          force
            ? "/api/ai/summarize-law"
            : `/api/propositions/${propositionId}/ensure-summary`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              force ? { propositionId } : { id: propositionId }
            ),
          }
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok && response.status !== 202) {
          throw new Error(payload.error || "Erro ao gerar resumo.");
        }

        if (payload.summary) {
          setContent(payload.summary);
          setLastUpdated(payload.updatedAt ?? new Date().toISOString());
          setStatusMessage(null);

          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          setIsPlaying(false);
          setHasAudio(false);

          router.refresh();
          return;
        }

        if (response.status === 202 || payload.status === "no_source") {
          setStatusMessage(
            payload.message ||
              "Ainda não há dados suficientes para gerar o resumo desta proposição."
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido.");
      } finally {
        setIsLoading(false);
      }
    },
    [propositionId, router]
  );

  useEffect(() => {
    if (content || autoRequestedRef.current) {
      return;
    }
    autoRequestedRef.current = true;
    requestSummary();
  }, [content, requestSummary]);

  const togglePlaySummary = async () => {
    if (!content) return;
    setError(null);

    if (audioRef.current) {
      if (isPlaying) {
        // estava tocando → pausa
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      // estava pausado → retoma
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao reproduzir áudio."
        );
      }

      return;
    }

    setIsLoadingAudio(true);
    try {
      const response = await fetch("/api/ai/summarize-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Erro ao gerar áudio.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      audioRef.current = audio;
      setHasAudio(true);

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao reproduzir áudio."
      );
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const hasSummary = Boolean(content);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">
            Resumo simplificado
          </p>
          <p className="text-xs text-muted-foreground">
            {statusMessage
              ? statusMessage
              : lastUpdated
              ? `Atualizado em ${new Date(lastUpdated).toLocaleString("pt-BR")}`
              : "Geramos automaticamente um resumo em linguagem acessível sempre que você abre a proposição."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasSummary && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="inline-flex items-center gap-2"
              onClick={togglePlaySummary}
              disabled={isLoadingAudio}
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando áudio...
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pausar áudio
                </>
              ) : hasAudio ? (
                <>
                  <Play className="h-4 w-4" />
                  Retomar áudio
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  Ouvir resumo
                </>
              )}
            </Button>
          )}

          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-2"
              onClick={() => requestSummary({ force: true })}
              disabled={isLoading}
            >
              <Sparkles className="h-4 w-4" />
              {isLoading
                ? "Gerando..."
                : content
                ? "Atualizar resumo"
                : "Gerar resumo"}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {content ??
          "Estamos preparando este resumo com a ajuda da IA. Ele aparecerá aqui em alguns instantes assim que o processamento terminar."}
      </p>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </section>
  );
}

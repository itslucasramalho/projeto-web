"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

export function SeedDemoButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const triggerSeed = async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Erro ao executar seed");
      }

      setMessage(payload.message ?? "Seed concluído");
      setStatus("success");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Falha ao executar seed",
      );
      setStatus("error");
    }
  };

  return (
    <div className="space-y-3 rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Gere um conjunto de leis, comentários e enquetes fictícias para
        apresentar no pitch do Hackathon. O seed só funciona para contas com
        permissão de administrador.
      </p>
      <Button type="button" onClick={triggerSeed} disabled={status === "loading"}>
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Populando base...
          </>
        ) : (
          "Gerar dados de demonstração"
        )}
      </Button>
      {status === "success" && (
        <p className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-destructive">{message}</p>
      )}
    </div>
  );
}


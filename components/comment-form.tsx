"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type CommentFormProps = {
  propositionId: string;
};

export function CommentForm({ propositionId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerSummaryIfNeeded = async (
    client: ReturnType<typeof createClient>
  ) => {
    const { count } = await client
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("proposition_id", propositionId);

    if (count && count > 0 && count % 10 === 0) {
      try {
        await fetch("/api/ai/summarize-comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propositionId }),
        });
      } catch {
        // Ignora erros silenciosamente; o resumo pode ser gerado manualmente.
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      setError("Escreva um comentário antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    const { error } = await supabase.from("comments").insert({
      proposition_id: propositionId,
      user_id: userId,
      content: trimmed,
    });

    if (error) {
      setError(error.message);
    } else {
      await triggerSummaryIfNeeded(supabase);
      setContent("");
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="space-y-2 text-sm font-medium text-foreground">
        Compartilhe sua opinião
        <textarea
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Conte como esta proposta impacta sua vida e sua comunidade."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar comentário"}
        </Button>
      </div>
    </form>
  );
}

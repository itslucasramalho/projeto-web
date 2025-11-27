"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForumTopicForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createClient();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setError("Preencha título e mensagem antes de publicar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase
      .from("forum_topics")
      .insert({
        title: trimmedTitle,
        content: trimmedContent,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }

    setTitle("");
    setContent("");
    router.push(`/painel/forum/${data?.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          placeholder="Resumir o tema do tópico"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Mensagem</Label>
        <textarea
          id="content"
          className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Explique sua ideia, contexto ou problema que deseja debater."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Evite compartilhar dados pessoais sensíveis. Seja respeitoso.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? "Publicando..." : "Publicar tópico"}
      </Button>
    </form>
  );
}


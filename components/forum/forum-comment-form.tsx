"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type ForumCommentFormProps = {
  topicId: string;
  isAuthenticated: boolean;
};

export function ForumCommentForm({
  topicId,
  isAuthenticated,
}: ForumCommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Escreva algo antes de enviar.");
      return;
    }

    const supabase = createClient();
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

    const { error } = await supabase.from("forum_comments").insert({
      topic_id: topicId,
      user_id: user.id,
      content: trimmed,
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }

    setContent("");
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={
          isAuthenticated
            ? "Compartilhe argumentos, evidências ou perguntas."
            : "Entre para participar da conversa."
        }
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={!isAuthenticated}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isAuthenticated || isSubmitting}
          variant="default"
        >
          {isSubmitting ? "Enviando..." : "Enviar comentário"}
        </Button>
      </div>
    </form>
  );
}


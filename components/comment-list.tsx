"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { getStateLabel } from "@/lib/filters";
import { UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import type { UserRole } from "@/lib/utils";

export type CommentAuthor = {
  display_name: string | null;
  state: string | null;
  role?: UserRole | null;
};

export type CommentItem = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: CommentAuthor | null;
};

type CommentListProps = {
  comments: CommentItem[];
  currentUserId?: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function CommentList({ comments, currentUserId }: CommentListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    const confirmed = window.confirm("Deseja apagar este comentário?");
    if (!confirmed) return;

    setDeletingId(commentId);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      setError(error.message);
    } else {
      router.refresh();
    }

    setDeletingId(null);
  };

  if (!comments.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum comentário ainda. Seja o primeiro a opinar!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {comments.map((comment) => {
        const isOwner = comment.user_id === currentUserId;

        return (
          <article
            key={comment.id}
            className="rounded-lg border px-4 py-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <UserAvatar
                name={comment.author?.display_name ?? "Cidadão"}
                identifier={comment.user_id}
                size="sm"
              />
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {comment.author?.display_name ?? "Cidadão"}
                  </span>
                  {comment.author?.role === "verified" && (
                    <VerifiedBadge label="Verificado" className="text-[11px]" />
                  )}
                  {comment.author?.state && (
                    <span className="text-xs text-muted-foreground">
                      {getStateLabel(comment.author.state)}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{comment.content}</p>
                <p className="text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(comment.created_at))}
                </p>
              </div>
              {isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Excluir comentário</span>
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}


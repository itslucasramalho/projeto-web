import Link from "next/link";
import { MessageCircle, Pin } from "lucide-react";
import { ForumTopicWithMeta } from "@/lib/forum";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/verified-badge";

type ForumTopicListProps = {
  topics: ForumTopicWithMeta[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
});

export function ForumTopicList({ topics }: ForumTopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-lg font-semibold text-foreground">
          Nenhuma discussão encontrada
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Inicie um novo tópico para ouvir outras pessoas ou ajuste os filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => {
        const createdAt = dateFormatter.format(new Date(topic.created_at));
        const authorName = topic.author?.display_name ?? "Cidadão";
        const isVerified = topic.author?.role === "verified";
        const cardClasses = cn(
          "rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary",
          topic.is_pinned && "border-primary/60 bg-primary/5"
        );

        return (
          <Link
            key={topic.id}
            href={`/painel/forum/${topic.id}`}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
          >
            <article className={cardClasses}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={authorName}
                    identifier={topic.author?.id ?? topic.user_id}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{authorName}</span>
                      {isVerified && (
                        <VerifiedBadge
                          label="Verificado"
                          className="text-[11px]"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{createdAt}</p>
                  </div>
                </div>
                {topic.is_pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase text-primary">
                    <Pin className="h-3 w-3" />
                    Fixo
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-xl font-semibold text-foreground">
                {topic.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {topic.content}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {topic.commentsCount} comentário(s)
                </div>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}

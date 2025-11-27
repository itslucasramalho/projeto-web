import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ForumCommentForm } from "@/components/forum/forum-comment-form";
import { ForumCommentList } from "@/components/forum/forum-comment-list";
import { getForumTopicById, listForumComments } from "@/lib/forum";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

const DEFAULT_FORUM_TOPIC_DESCRIPTION =
  "Acompanhe discussões moderadas no Fórum Cidadão e compartilhe evidências sobre os temas que impactam sua cidade.";

const summarizeContent = (content?: string | null) => {
  if (!content) {
    return DEFAULT_FORUM_TOPIC_DESCRIPTION;
  }
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_FORUM_TOPIC_DESCRIPTION;
  }
  return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const topic = await getForumTopicById(supabase, id).catch(() => null);

  if (!topic) {
    return {
      title: "Tópico do fórum | Engajamento Cidadão",
      description: DEFAULT_FORUM_TOPIC_DESCRIPTION,
      keywords: ["fórum cidadão", "debate público", "participação social"],
      openGraph: {
        title: "Tópico do fórum | Engajamento Cidadão",
        description: DEFAULT_FORUM_TOPIC_DESCRIPTION,
        url: `/painel/forum/${id}`,
        type: "article",
      },
      twitter: {
        card: "summary",
        title: "Tópico do fórum | Engajamento Cidadão",
        description: DEFAULT_FORUM_TOPIC_DESCRIPTION,
      },
    };
  }

  const description = summarizeContent(topic.content);
  const keywords = [
    "fórum cidadão",
    "debate público",
    topic.status ?? undefined,
    topic.law?.title ?? undefined,
  ].filter(Boolean) as string[];

  return {
    title: `${topic.title} | Fórum cidadão`,
    description,
    keywords,
    openGraph: {
      title: `${topic.title} | Fórum cidadão`,
      description,
      url: `/painel/forum/${topic.id}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${topic.title} | Fórum cidadão`,
      description,
    },
  };
}

export default async function ForumTopicPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const topic = await getForumTopicById(supabase, id).catch(() => null);

  if (!topic) {
    notFound();
  }

  const comments = await listForumComments(supabase, topic.id, {
    currentUserId: user?.id,
  });

  const createdAt = new Date(topic.created_at).toLocaleString("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const authorName = topic.author?.display_name ?? "Cidadão";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/painel/forum"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          &larr; Voltar para o fórum
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase text-primary">Tópico</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {topic.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Iniciado por {authorName} em {createdAt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {topic.commentsCount} comentário(s)
          </div>
          {topic.status && (
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide">
              {topic.status}
            </span>
          )}
        </div>
      </header>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
          {topic.content}
        </p>
      </section>

      <section className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Comentários</h2>
          <p className="text-sm text-muted-foreground">
            Construa ideias colaborativas com respeito e evidências.
          </p>
        </div>
        <ForumCommentForm topicId={topic.id} isAuthenticated={Boolean(user)} />
        <ForumCommentList
          comments={comments}
          currentUserId={user?.id ?? null}
        />
      </section>
    </div>
  );
}

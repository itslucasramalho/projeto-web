import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ForumTopicFilters } from "@/components/forum/forum-topic-filters";
import { ForumTopicList } from "@/components/forum/forum-topic-list";
import { listForumTopics } from "@/lib/forum";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Fórum cidadão | Engajamento Cidadão",
  description:
    "Busque tópicos, acompanhe discussões locais e compartilhe experiências para influenciar políticas públicas.",
  keywords: [
    "fórum cidadão",
    "debate público",
    "participação social",
    "prioridades locais",
    "discussões comunitárias",
  ],
  openGraph: {
    title: "Fórum cidadão | Engajamento Cidadão",
    description:
      "Crie tópicos, filtre conversas por tema e construa soluções coletivas com moderação ativa.",
    url: "/painel/forum",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fórum cidadão | Engajamento Cidadão",
    description:
      "Compartilhe evidências, relatos e propostas para fortalecer decisões com participação social.",
  },
};

type PageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined> | undefined
  >;
};

const getParamValue = (
  params: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = params[key];
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
};

const buildPageLink = ({ page, search }: { page: number; search?: string }) => {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (page > 1) query.set("page", page.toString());
  const qs = query.toString();
  return qs ? `/painel/forum?${qs}` : "/painel/forum";
};

export default async function ForumPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) ?? {};
  const search = getParamValue(resolved, "search") ?? "";
  const pageParam = Number(getParamValue(resolved, "page") ?? "1");
  const currentPage = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam);

  const supabase = await createClient();
  const { topics, count, pageSize } = await listForumTopics(supabase, {
    search: search || undefined,
    page: currentPage,
  });

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase text-primary">
          Fórum cidadão
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Converse sobre prioridades e temas locais
            </h1>
            <p className="text-sm text-muted-foreground">
              Crie tópicos, conte como cada tema impacta sua realidade e ajude a
              priorizar ações coletivas.
            </p>
          </div>
          <Button asChild>
            <Link href="/painel/forum/new">Novo tópico</Link>
          </Button>
        </div>
      </header>

      <ForumTopicFilters
        initialSearch={search}
        totalCount={count ?? topics.length}
      />

      <ForumTopicList topics={topics} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Link
            href={
              hasPrevious
                ? buildPageLink({
                    page: currentPage - 1,
                    search: search || undefined,
                  })
                : "/painel/forum"
            }
            className={
              hasPrevious ? "text-primary hover:underline" : "opacity-50"
            }
            aria-disabled={!hasPrevious}
          >
            Página anterior
          </Link>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <Link
            href={
              hasNext
                ? buildPageLink({
                    page: currentPage + 1,
                    search: search || undefined,
                  })
                : "/painel/forum"
            }
            className={hasNext ? "text-primary hover:underline" : "opacity-50"}
            aria-disabled={!hasNext}
          >
            Próxima página
          </Link>
        </div>
      )}
    </div>
  );
}

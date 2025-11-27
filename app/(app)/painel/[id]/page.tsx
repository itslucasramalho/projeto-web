import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LawSummary } from "@/components/law-summary";
import { CommentForm } from "@/components/comment-form";
import { CommentList, type CommentItem } from "@/components/comment-list";
import { CommentSummaryCard } from "@/components/comment-summary-card";
import { StancePoll } from "@/components/stance-poll";
import { getPropositionById } from "@/lib/propositions";
import { isAdminRole, type UserRole } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { PropositionEngagementTracker } from "@/components/proposition-engagement-tracker";

type LawDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<
    Record<string, string | string[] | undefined> | undefined
  >;
};

type PropositionDetail = Awaited<ReturnType<typeof getPropositionById>>;

const DEFAULT_PROPOSITION_DESCRIPTION =
  "Leia o resumo assistido por IA, indicadores de engajamento e comentários qualificados sobre cada proposição.";

const summarizeProposition = (proposition?: PropositionDetail | null) => {
  const source = proposition?.ai_summary ?? proposition?.title ?? null;
  if (!source) {
    return DEFAULT_PROPOSITION_DESCRIPTION;
  }
  const normalized = source.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_PROPOSITION_DESCRIPTION;
  }
  return normalized.length > 160
    ? `${normalized.slice(0, 157)}...`
    : normalized;
};

export async function generateMetadata({
  params,
}: LawDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const proposition = await getPropositionById(id).catch(() => null);

  if (!proposition) {
    return {
      title: "Proposição não encontrada | Engajamento Cidadão",
      description: DEFAULT_PROPOSITION_DESCRIPTION,
      keywords: ["proposição", "projeto de lei", "engajamento cidadão"],
      openGraph: {
        title: "Proposição não encontrada | Engajamento Cidadão",
        description: DEFAULT_PROPOSITION_DESCRIPTION,
        url: `/painel/${id}`,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: "Proposição não encontrada | Engajamento Cidadão",
        description: DEFAULT_PROPOSITION_DESCRIPTION,
      },
    };
  }

  const description = summarizeProposition(proposition);
  const keywords = [
    "proposição",
    "projeto de lei",
    proposition.type ?? undefined,
    proposition.theme ?? undefined,
    proposition.author ?? undefined,
  ].filter(Boolean) as string[];

  return {
    title: `${proposition.title} | Engajamento Cidadão`,
    description,
    keywords,
    openGraph: {
      title: `${proposition.title} | Engajamento Cidadão`,
      description,
      url: `/painel/${proposition.id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${proposition.title} | Engajamento Cidadão`,
      description,
    },
  };
}

// type CommentRow = {
//   id: string;
//   content: string;
//   created_at: string;
//   user_id: string;
//   profiles: {
//     display_name: string | null;
//     state: string | null;
//   } | null;
// };

type CommentSummaryRow = {
  summary_text: string | null;
  updated_at: string | null;
  total_comments: number;
  sentiment: Record<string, number> | null;
};

type StanceRow = {
  user_id: string;
  stance: "for" | "against" | "neutral";
};

const COMMENTS_PER_PAGE = 10;

const toSearchParams = (
  params: Record<string, string | string[] | undefined> = {}
) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else {
      search.set(key, value);
    }
  });
  return search;
};

export default async function LawDetailPage({
  params,
  searchParams,
}: LawDetailPageProps) {
  const propositionId = (await params).id;
  const proposition: PropositionDetail | null = await getPropositionById(
    propositionId
  ).catch(() => null);

  if (!proposition) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { role: UserRole } | null = null;
  if (user?.id) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profile = profileRow;
  }
  const isAdmin = isAdminRole(profile?.role);

  const parsedSearchParams = toSearchParams(await searchParams);
  const pageParam = Number(parsedSearchParams.get("commentsPage"));
  const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const rangeStart = (currentPage - 1) * COMMENTS_PER_PAGE;
  const rangeEnd = rangeStart + COMMENTS_PER_PAGE - 1;

  const {
    data: commentsData,
    error: commentsError,
    count: commentsCount,
  } = await supabase
    .from("comments")
    .select(
      `
        id,
        content,
        created_at,
        user_id,
        profiles:profiles (
          display_name,
          state,
          role
        )
      `,
      { count: "exact" }
    )
    .eq("proposition_id", proposition.id)
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (commentsError) {
    console.error(commentsError);
  }

  const { data: commentSummary } = await supabase
    .from("comment_summaries")
    .select("summary_text, updated_at, total_comments, sentiment")
    .eq("proposition_id", proposition.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CommentSummaryRow>();

  const { data: stanceRows } = await supabase
    .from("stances")
    .select("user_id, stance")
    .eq("proposition_id", proposition.id);

  const stanceCounts = stanceRows?.reduce(
    (acc, row: StanceRow) => {
      acc[row.stance] = (acc[row.stance] ?? 0) + 1;
      return acc;
    },
    { for: 0, against: 0, neutral: 0 } as Record<StanceRow["stance"], number>
  ) ?? { for: 0, against: 0, neutral: 0 };

  const currentUserStance =
    stanceRows?.find((row) => row.user_id === user?.id)?.stance ?? null;

  const comments: CommentItem[] =
    commentsData?.map((comment) => {
      const profile = Array.isArray(comment.profiles)
        ? comment.profiles[0]
        : comment.profiles;

      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        author: profile
          ? {
              display_name: profile.display_name,
              state: profile.state ?? null,
              role: profile.role ?? null,
            }
          : null,
      };
    }) ?? ([] as CommentItem[]);

  const totalComments = commentsCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalComments / COMMENTS_PER_PAGE));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const buildPageLink = (page: number) => {
    const params = new URLSearchParams(parsedSearchParams.toString());
    if (page <= 1) {
      params.delete("commentsPage");
    } else {
      params.set("commentsPage", page.toString());
    }
    const query = params.toString();
    return query
      ? `/painel/${proposition.id}?${query}`
      : `/painel/${proposition.id}`;
  };

  const metadata = [
    {
      label: "Tipo",
      value: `${proposition.type} ${proposition.number ?? ""}/${
        proposition.year ?? ""
      }`.trim(),
    },
    { label: "Status", value: proposition.status },
    {
      label: "Situação",
      value: proposition.status_situation ?? "Em tramitação",
    },
    {
      label: "Apresentado em",
      value: new Date(
        `${proposition.presentation_date}T00:00:00Z`
      ).toLocaleDateString("pt-BR"),
    },
    { label: "Autor(a)", value: proposition.author ?? "Não informado" },
    {
      label: "Tema",
      value: proposition.theme ?? "Não informado",
    },
    {
      label: "Origem",
      value: proposition.origin ?? "Câmara dos Deputados",
    },
  ];

  return (
    <div className="space-y-8">
      <PropositionEngagementTracker propositionId={proposition.id} />

      <Link
        href="/painel"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a listagem
      </Link>

      <section className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{proposition.status}</Badge>
          {proposition.type && (
            <Badge variant="outline">{proposition.type}</Badge>
          )}
          {proposition.number && (
            <span className="text-muted-foreground">
              Nº {proposition.number}/{proposition.year}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {proposition.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {proposition.author
              ? `Autor(a): ${proposition.author}`
              : "Autor não informado"}
          </p>
        </div>
        <dl className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-3">
          {metadata.map((item) => (
            <div key={item.label}>
              <dt className="font-medium text-foreground">{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <LawSummary
            propositionId={proposition.id}
            summary={proposition.ai_summary}
            updatedAt={proposition.ai_summary_updated_at}
            isAdmin={isAdmin}
          />

          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Documento oficial
                </h2>
                <p className="text-sm text-muted-foreground">
                  Clique para abrir a fonte oficial da proposição.
                </p>
              </div>
              {proposition.source_url && (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={proposition.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-4 w-4" />
                    Fonte oficial
                  </a>
                </Button>
              )}
            </div>
          </section>

          <section className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Comentários da comunidade
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalComments} comentário(s)
              </p>
            </div>
            <CommentForm propositionId={proposition.id} />
            <CommentList comments={comments} currentUserId={user?.id} />
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <Link
                  href={hasPrevious ? buildPageLink(currentPage - 1) : "#"}
                  className={`text-primary ${
                    hasPrevious
                      ? "hover:underline"
                      : "pointer-events-none opacity-50"
                  }`}
                >
                  Página anterior
                </Link>
                <span className="text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Link
                  href={hasNext ? buildPageLink(currentPage + 1) : "#"}
                  className={`text-primary ${
                    hasNext
                      ? "hover:underline"
                      : "pointer-events-none opacity-50"
                  }`}
                >
                  Próxima página
                </Link>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <StancePoll
            propositionId={proposition.id}
            userId={user?.id}
            currentStance={currentUserStance}
            counts={stanceCounts}
          />
          <CommentSummaryCard
            propositionId={proposition.id}
            summary={commentSummary ?? null}
            totalComments={totalComments}
            isAdmin={isAdmin}
          />
        </aside>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { LawCard, type LawCardData } from "@/components/law-card";
import { LawFilters } from "@/components/law-filters";
import { HotTopicsStrip } from "@/components/hot-topics-strip";
import {
  parsePropositionFilters,
  type PropositionFilters,
} from "@/lib/filters";
import { listRecentPropositions } from "@/lib/propositions";
import { listHotTopics, type HotTopic } from "@/lib/propositions/highlights";

export const metadata: Metadata = {
  title: "Painel de proposições | Engajamento Cidadão",
  description:
    "Acompanhe proposições recentes, aplique filtros inteligentes e descubra quais projetos estão em alta para comentar e votar.",
  keywords: [
    "painel legislativo",
    "proposições recentes",
    "monitoramento de leis",
    "comentários cidadãos",
    "votação de proposições",
    "engajamento público",
  ],
  openGraph: {
    title: "Painel de proposições | Engajamento Cidadão",
    description:
      "Use filtros temáticos, veja tópicos em alta e participe das discussões sobre cada projeto de lei.",
    url: "/painel",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Painel de proposições | Engajamento Cidadão",
    description:
      "Descubra o que a Câmara discutiu na semana e registre sua opinião em cada pauta.",
  },
};

type PageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined> | undefined
  >;
};

const toURLSearchParams = (
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

export default async function LawsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const filters: PropositionFilters = parsePropositionFilters(
    toURLSearchParams(resolvedSearchParams)
  );

  const [hotTopics, { data, count }] = await Promise.all([
    listHotTopics().catch((error) => {
      console.error("Failed to load hot topics", error);
      return [] as HotTopic[];
    }),
    listRecentPropositions(filters),
  ]);

  const hotTopicMap = new Map(hotTopics.map((topic) => [topic.id, topic]));

  const laws: LawCardData[] = data.map((law) => {
    const highlight = hotTopicMap.get(law.id);
    return {
      id: law.id,
      title: law.title,
      type: law.type,
      number: law.number ?? null,
      year: law.year ?? null,
      status: law.status,
      status_situation: law.status_situation ?? null,
      summary: law.ai_summary ?? null,
      presentation_date: law.presentation_date,
      author: law.author ?? null,
      commentsCount: law.comments?.[0]?.count ?? 0,
      stancesCount: law.stances?.[0]?.count ?? 0,
      state: null,
      highlightLabel: highlight?.highlightLabel ?? null,
    };
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase text-primary">
            Engajamento Cidadão
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Proposições da semana
          </h1>
        </div>
        <p className="text-base text-muted-foreground">
          Atualizamos diariamente com os projetos apresentados na Câmara nos
          últimos 7 dias. Participe deixando comentários e votando.
        </p>
        <p className="text-sm text-muted-foreground">
          {count ?? 0} proposição(ões) encontrada(s)
        </p>
      </header>

      <LawFilters initialFilters={filters} />

      <HotTopicsStrip topics={hotTopics} />

      <section className="space-y-4">
        {laws.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-lg font-medium text-foreground">
              Nenhum projeto encontrado
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajuste os filtros ou limpe a busca para visualizar outras
              propostas.
            </p>
          </div>
        ) : (
          laws.map((law) => <LawCard key={law.id} law={law} />)
        )}
      </section>
    </div>
  );
}

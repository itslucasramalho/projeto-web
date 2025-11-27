import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";
import { computeHighlightScore, type InteractionWindow } from "./highlight-score";

const HOT_TOPIC_LOOKBACK_DAYS = 45;
const MAX_CANDIDATES = 80;

export type HotTopic = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  status_situation: string | null;
  type: string;
  number: number | null;
  year: number | null;
  presentation_date: string;
  author: string | null;
  theme: string | null;
  highlightScore: number;
  highlightLabel: string;
  commentsCount: number;
  stancesCount: number;
  components: {
    recency: number;
    engagement: number;
    momentum: number;
  };
};

type PropositionRow = Tables<"propositions"> & {
  comments: { count: number | null }[] | null;
  stances: { count: number | null }[] | null;
  proposition_highlight_overrides: Tables<"proposition_highlight_overrides">[] | null;
};

export async function listHotTopics(limit = 5) {
  const supabase = await createClient();
  const since = subtractDaysUTC(new Date(), HOT_TOPIC_LOOKBACK_DAYS);

  const { data, error } = await supabase
    .from("propositions")
    .select(
      `
        id,
        title,
        type,
        number,
        year,
        status,
        status_situation,
        presentation_date,
        ai_summary,
        author,
        theme,
        keywords,
        comments:comments!comments_proposition_id_fkey(count),
        stances:stances!stances_proposition_id_fkey(count),
        proposition_highlight_overrides(priority, expires_at)
      `
    )
    .gte("presentation_date", since)
    .order("presentation_date", { ascending: false })
    .limit(MAX_CANDIDATES);

  if (error) {
    throw error;
  }

  const propositions = (data ?? []) as PropositionRow[];
  if (propositions.length === 0) {
    return [];
  }

  const ids = propositions.map((item) => item.id);
  const { data: interestWindows } = await supabase
    .from("proposition_interest_windows")
    .select("*")
    .in("proposition_id", ids);

  const interestMap = new Map<string, InteractionWindow>();
  interestWindows?.forEach((window) => {
    if (!window.proposition_id) return;
    interestMap.set(window.proposition_id, {
      proposition_id: window.proposition_id,
      views_last7: window.views_last7 ?? 0,
      views_prev7: window.views_prev7 ?? 0,
      favorites_last7: window.favorites_last7 ?? 0,
      favorites_prev7: window.favorites_prev7 ?? 0,
      shares_last7: window.shares_last7 ?? 0,
      shares_prev7: window.shares_prev7 ?? 0,
    });
  });

  const scored = propositions
    .map((proposition) => {
      const commentsCount = proposition.comments?.[0]?.count ?? 0;
      const stancesCount = proposition.stances?.[0]?.count ?? 0;
      const override = proposition.proposition_highlight_overrides?.[0] ?? null;
      const interactions = interestMap.get(proposition.id);

      const computation = computeHighlightScore({
        proposition,
        commentsCount,
        stancesCount,
        interactions,
        override,
      });

      return {
        id: proposition.id,
        title: proposition.title,
        type: proposition.type,
        number: proposition.number ?? null,
        year: proposition.year ?? null,
        status: proposition.status,
        status_situation: proposition.status_situation ?? null,
        presentation_date: proposition.presentation_date,
        summary: proposition.ai_summary ?? null,
        author: proposition.author ?? null,
        theme: proposition.theme ?? null,
        highlightScore: computation.score,
        highlightLabel: computation.label,
        commentsCount,
        stancesCount,
        components: {
          recency: computation.components.recency,
          engagement: computation.components.engagement,
          momentum: computation.components.momentum,
        },
      } as HotTopic;
    })
    .sort((a, b) => b.highlightScore - a.highlightScore);

  return scored.slice(0, limit);
}

function subtractDaysUTC(date: Date, days: number) {
  const clone = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  clone.setUTCDate(clone.getUTCDate() - days);
  return clone.toISOString().split("T")[0];
}


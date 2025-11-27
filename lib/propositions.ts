import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PROPOSITION_FILTERS,
  type PropositionFilters,
} from "@/lib/filters";
import type { Tables } from "@/types/database.types";

const LIST_WINDOW_DAYS = 7;

type PropositionRow = Tables<"propositions"> & {
  comments: { count: number | null }[] | null;
  stances: { count: number | null }[] | null;
};

type PropositionDetailRow = Pick<
  Tables<"propositions">,
  | "id"
  | "camara_id"
  | "title"
  | "type"
  | "sigla_tipo"
  | "number"
  | "year"
  | "status"
  | "status_situation"
  | "status_code"
  | "status_date"
  | "presentation_date"
  | "ai_summary"
  | "ai_summary_updated_at"
  | "author"
  | "author_party"
  | "author_state"
  | "origin"
  | "theme"
  | "keywords"
  | "source_url"
  | "full_text_url"
  | "tramitacao_url"
>;

export type PropositionListResult = {
  data: PropositionRow[];
  count: number;
};

export async function listRecentPropositions(
  filters: PropositionFilters = DEFAULT_PROPOSITION_FILTERS
): Promise<PropositionListResult> {
  const supabase = await createClient();
  const since = subtractDaysUTC(new Date(), LIST_WINDOW_DAYS);

  let query = supabase
    .from("propositions")
    .select(
      `
        id,
        camara_id,
        title,
        type,
        sigla_tipo,
        number,
        year,
        status,
        status_situation,
        presentation_date,
        ai_summary,
        author,
        theme,
        comments:comments!comments_proposition_id_fkey(count),
        stances:stances!stances_proposition_id_fkey(count)
      `,
      { count: "exact" }
    )
    .gte("presentation_date", since)
    .order("presentation_date", { ascending: false });

  if (filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.search.trim()) {
    const term = filters.search.trim();
    const clauses = [`title.ilike.%${term}%`, `status.ilike.%${term}%`];
    const numericToken = extractNumericToken(term);
    if (numericToken) {
      clauses.push(`number.eq.${numericToken}`);
      clauses.push(`year.eq.${numericToken}`);
    }
    query = query.or(clauses.join(","));
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: (data ?? []) as PropositionRow[],
    count: count ?? data?.length ?? 0,
  };
}

export async function getPropositionById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propositions")
    .select(
      `
        id,
        camara_id,
        title,
        type,
        sigla_tipo,
        number,
        year,
        status,
        status_situation,
        status_code,
        status_date,
        presentation_date,
        ai_summary,
        ai_summary_updated_at,
        author,
        author_party,
        author_state,
        origin,
        theme,
        keywords,
        source_url,
        full_text_url,
        tramitacao_url
      `
    )
    .eq("id", id)
    .maybeSingle<PropositionDetailRow>();

  if (error || !data) {
    throw error ?? new Error("Proposição não encontrada.");
  }

  return data;
}

function subtractDaysUTC(date: Date, days: number) {
  const clone = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  clone.setUTCDate(clone.getUTCDate() - days);
  return clone.toISOString().split("T")[0];
}

function extractNumericToken(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isNaN(parsed) ? null : parsed;
}

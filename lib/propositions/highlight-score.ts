import type { Tables } from "@/types/database.types";

type PropositionRow = Tables<"propositions"> & {
  status_situation: string | null;
  theme: string | null;
};

export type InteractionWindow = {
  proposition_id: string;
  views_last7: number;
  views_prev7: number;
  favorites_last7: number;
  favorites_prev7: number;
  shares_last7: number;
  shares_prev7: number;
};

export type HighlightOverride = Tables<"proposition_highlight_overrides"> | null;

export type HighlightComponents = {
  recency: number;
  engagement: number;
  momentum: number;
  theme: number;
  override: number;
};

export type HighlightComputation = {
  score: number;
  label: string;
  components: HighlightComponents;
};

const PRIORITY_THEMES = new Set([
  "Educação",
  "Saúde",
  "Segurança Pública",
  "Meio Ambiente",
  "Direitos Humanos",
]);

const STATUS_PRIORITY_KEYWORDS = ["parecer", "urgência", "plenário", "votação"];

const RECENCY_WINDOW_DAYS = 30;

export function computeHighlightScore(params: {
  proposition: PropositionRow;
  commentsCount: number;
  stancesCount: number;
  interactions?: InteractionWindow;
  override?: HighlightOverride;
}): HighlightComputation {
  const recency = computeRecencyScore(params.proposition.presentation_date);
  const engagement = computeEngagementScore({
    comments: params.commentsCount,
    stances: params.stancesCount,
    interactions: params.interactions,
  });
  const momentum = computeMomentumScore(params.interactions);
  const theme = computeThemeBonus(
    params.proposition.theme,
    params.proposition.status_situation
  );
  const override = computeOverrideBoost(params.override);

  const baseScore =
    0.4 * recency + 0.3 * engagement + 0.2 * momentum + 0.1 * theme;
  const score = clamp(baseScore + override, 0, 1);

  return {
    score,
    label: deriveLabel({ recency, momentum, override }),
    components: { recency, engagement, momentum, theme, override },
  };
}

function computeRecencyScore(presentationDate: string) {
  const today = new Date();
  const presented = new Date(`${presentationDate}T00:00:00Z`);
  const diffMs = today.getTime() - presented.getTime();
  const diffDays = Math.max(diffMs / (1000 * 60 * 60 * 24), 0);
  const ratio = 1 - diffDays / RECENCY_WINDOW_DAYS;
  return clamp(ratio, 0, 1);
}

function computeEngagementScore({
  comments,
  stances,
  interactions,
}: {
  comments: number;
  stances: number;
  interactions?: InteractionWindow;
}) {
  const interactionScore =
    (interactions?.views_last7 ?? 0) * 0.05 +
    (interactions?.favorites_last7 ?? 0) * 0.2 +
    (interactions?.shares_last7 ?? 0) * 0.25;
  const aggregate = comments * 0.4 + stances * 0.3 + interactionScore;
  const normalized = aggregate / 50; // heuristic cap
  return clamp(Math.log10(1 + normalized * 9), 0, 1);
}

function computeMomentumScore(interactions?: InteractionWindow) {
  if (!interactions) {
    return 0.25;
  }
  const current =
    interactions.views_last7 +
    interactions.favorites_last7 +
    interactions.shares_last7;
  const previous =
    interactions.views_prev7 +
    interactions.favorites_prev7 +
    interactions.shares_prev7;

  if (current === 0 && previous === 0) {
    return 0;
  }

  if (previous === 0) {
    return clamp(Math.min(current / 10, 1), 0.4, 1);
  }

  const delta = (current - previous) / previous;
  const normalized = (delta + 1) / 2; // map [-1,1] -> [0,1]
  return clamp(normalized, 0, 1);
}

function computeThemeBonus(theme: string | null, statusSituation: string | null) {
  let bonus = 0;
  if (theme && PRIORITY_THEMES.has(theme.trim())) {
    bonus += 0.6;
  }
  if (
    statusSituation &&
    STATUS_PRIORITY_KEYWORDS.some((keyword) =>
      statusSituation.toLowerCase().includes(keyword)
    )
  ) {
    bonus += 0.4;
  }
  return clamp(bonus, 0, 1);
}

function computeOverrideBoost(override?: HighlightOverride | null) {
  if (!override) return 0;
  if (override.expires_at && new Date(override.expires_at) < new Date()) {
    return 0;
  }
  return clamp(override.priority / 10, 0, 0.5);
}

function deriveLabel({
  recency,
  momentum,
  override,
}: {
  recency: number;
  momentum: number;
  override: number;
}) {
  if (override >= 0.3) {
    return "Curadoria Especial";
  }
  if (momentum > 0.75) {
    return "Em alta";
  }
  if (recency > 0.75) {
    return "Novo & relevante";
  }
  if (momentum < 0.25) {
    return "Estável";
  }
  return "Tendência";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}


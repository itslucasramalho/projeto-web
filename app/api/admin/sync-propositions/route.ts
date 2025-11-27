import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/utils";

const CAMARA_API_BASE = "https://dadosabertos.camara.leg.br/api/v2";
const PROPOSITION_TYPES = ["PL", "PEC", "MP", "PLP"] as const;
const ITEMS_PER_PAGE = 100;
const DETAIL_CONCURRENCY = 5;

type PropositionType = (typeof PROPOSITION_TYPES)[number];

type CamaraLink = {
  rel: string;
  href: string;
};

type CamaraListItem = {
  id: number;
  uri: string;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string | null;
  dataApresentacao: string;
};

type CamaraListResponse = {
  dados: CamaraListItem[];
  links: CamaraLink[];
};

type CamaraStatus = {
  dataHora: string | null;
  descricaoSituacao: string | null;
  descricaoTramitacao: string | null;
  codSituacao: number | null;
  siglaOrgao: string | null;
  url: string | null;
};

type CamaraDetail = CamaraListItem & {
  siglaTipo: string;
  descricaoTipo?: string | null;
  ementaDetalhada?: string | null;
  keywords?: string | null;
  urlInteiroTeor?: string | null;
  uriAutores?: string | null;
  statusProposicao?: CamaraStatus | null;
};

type CamaraDetailResponse = {
  dados: CamaraDetail;
};

type CamaraAuthor = {
  nome: string;
  siglaPartido?: string | null;
  siglaUf?: string | null;
};

type CamaraAuthorResponse = {
  dados: CamaraAuthor[];
};

type NormalizedProposition = {
  camara_id: number;
  type: PropositionType;
  sigla_tipo: string;
  number: number;
  year: number;
  title: string;
  ementa: string | null;
  ementa_detalhada: string | null;
  keywords: string[] | null;
  presentation_date: string;
  status: string;
  status_situation: string | null;
  status_code: number | null;
  status_date: string | null;
  origin: string | null;
  author: string | null;
  author_party: string | null;
  author_state: string | null;
  theme: string | null;
  source_url: string | null;
  full_text_url: string | null;
  tramitacao_url: string | null;
};

const CAMARA_HEADERS: HeadersInit = {
  accept: "application/json",
  "user-agent":
    process.env.CAMARA_API_USER_AGENT ??
    "engajamento-cidadao/1.0 (+cron@engajamento.cidadao)",
};

export async function POST(request: Request) {
  const isAuthorized = await ensureAuthorized(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  const now = new Date();
  const rangeEndDate = formatDate(now);
  const rangeStartDate = formatDate(subDays(now, 10));

  const normalized = await fetchNormalizedPropositions(
    rangeStartDate,
    rangeEndDate
  );

  if (normalized.length === 0) {
    return NextResponse.json({
      message: "Nenhuma proposição encontrada no intervalo informado.",
      fetched: 0,
      upserted: 0,
      pruned: 0,
    });
  }

  const timestamp = now.toISOString();
  const rangeStartIso = toRangeBoundary(rangeStartDate, "start");
  const rangeEndIso = toRangeBoundary(rangeEndDate, "end");

  const upsertPayload = normalized.map((item) => ({
    camara_id: item.camara_id,
    type: item.type,
    sigla_tipo: item.sigla_tipo,
    number: item.number,
    year: item.year,
    title: item.title,
    ementa: item.ementa,
    ementa_detalhada: item.ementa_detalhada,
    keywords: item.keywords,
    presentation_date: item.presentation_date,
    status: item.status,
    status_situation: item.status_situation,
    status_code: item.status_code,
    status_date: item.status_date,
    origin: item.origin,
    author: item.author,
    author_party: item.author_party,
    author_state: item.author_state,
    theme: item.theme,
    source_url: item.source_url,
    full_text_url: item.full_text_url,
    tramitacao_url: item.tramitacao_url,
    house: "camara",
    fetched_range_start: rangeStartIso,
    fetched_range_end: rangeEndIso,
    fetched_at: timestamp,
    updated_at: timestamp,
  }));

  const { data: upserted, error: upsertError } = await supabaseAdmin
    .from("propositions")
    .upsert(upsertPayload, { onConflict: "camara_id" })
    .select("id");

  if (upsertError) {
    console.error("[sync-propositions] Supabase upsert error", upsertError);
    return NextResponse.json(
      { error: "Falha ao salvar proposições." },
      { status: 500 }
    );
  }

  const { count: prunedCount, error: pruneError } = await supabaseAdmin
    .from("propositions")
    .delete({ count: "exact" })
    .lt("presentation_date", rangeStartDate);

  if (pruneError) {
    console.error("[sync-propositions] Falha ao remover registros antigos", {
      pruneError,
    });
  }

  return NextResponse.json({
    message: "Sincronização concluída.",
    fetched: normalized.length,
    upserted: upserted?.length ?? 0,
    pruned: prunedCount ?? 0,
  });
}

async function ensureAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }
  const header = request.headers.get("x-cron-secret");
  if (header === cronSecret) {
    return true;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return isAdminRole(profile?.role);
}

async function fetchNormalizedPropositions(
  startDate: string,
  endDate: string
): Promise<NormalizedProposition[]> {
  const idSet = new Set<number>();

  for (const type of PROPOSITION_TYPES) {
    const listItems = await fetchListForType(type, startDate, endDate);
    listItems.forEach((item) => idSet.add(item.id));
  }

  const ids = Array.from(idSet.values());
  const normalized: NormalizedProposition[] = [];

  for (let i = 0; i < ids.length; i += DETAIL_CONCURRENCY) {
    const batch = ids.slice(i, i + DETAIL_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          return await fetchPropositionDetail(id);
        } catch (error) {
          console.error(
            `[sync-propositions] Falha ao buscar proposição ${id}`,
            {
              error,
            }
          );
          return null;
        }
      })
    );
    normalized.push(
      ...batchResults.filter((item): item is NormalizedProposition =>
        Boolean(item)
      )
    );
  }

  return normalized;
}

async function fetchListForType(
  type: PropositionType,
  startDate: string,
  endDate: string
) {
  let nextUrl = buildListUrl(type, startDate, endDate);
  const aggregated: CamaraListItem[] = [];

  while (nextUrl) {
    const page = await fetchCamaraJson<CamaraListResponse>(nextUrl);
    aggregated.push(...page.dados);
    nextUrl = page.links?.find((link) => link.rel === "next")?.href ?? "";
  }

  return aggregated.filter((item) => item.siglaTipo === type);
}

function buildListUrl(
  type: PropositionType,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    siglaTipo: type,
    dataApresentacaoInicio: startDate,
    dataApresentacaoFim: endDate,
    ordem: "DESC",
    itens: ITEMS_PER_PAGE.toString(),
  });
  return `${CAMARA_API_BASE}/proposicoes?${params.toString()}`;
}

async function fetchPropositionDetail(
  id: number
): Promise<NormalizedProposition> {
  const detailUrl = `${CAMARA_API_BASE}/proposicoes/${id}`;
  const detailResponse = await fetchCamaraJson<CamaraDetailResponse>(detailUrl);
  const detail = detailResponse.dados;

  if (!PROPOSITION_TYPES.includes(detail.siglaTipo as PropositionType)) {
    throw new Error(`Tipo não suportado: ${detail.siglaTipo}`);
  }

  let authorName: string | null = null;
  let authorParty: string | null = null;
  let authorState: string | null = null;

  if (detail.uriAutores) {
    try {
      const authors = await fetchCamaraJson<CamaraAuthorResponse>(
        detail.uriAutores
      );
      const mainAuthor = authors.dados?.[0];
      if (mainAuthor) {
        authorName = mainAuthor.nome ?? null;
        authorParty = mainAuthor.siglaPartido ?? null;
        authorState = mainAuthor.siglaUf ?? null;
      }
    } catch (error) {
      console.error(
        `[sync-propositions] Falha ao buscar autores da proposição ${id}`,
        { error }
      );
    }
  }

  const status = detail.statusProposicao;
  const presentationDate = toDateOnly(detail.dataApresentacao);
  const keywords = normalizeKeywords(detail.keywords);

  return {
    camara_id: detail.id,
    type: detail.siglaTipo as PropositionType,
    sigla_tipo: detail.siglaTipo,
    number: Number(detail.numero),
    year: Number(detail.ano),
    title:
      detail.ementa ??
      `Proposição ${detail.siglaTipo} ${detail.numero}/${detail.ano}`,
    ementa: detail.ementa ?? null,
    ementa_detalhada: detail.ementaDetalhada ?? null,
    keywords,
    presentation_date: presentationDate ?? formatDate(new Date()),
    status: status?.descricaoSituacao ?? "Em tramitação",
    status_situation: status?.descricaoTramitacao ?? null,
    status_code: status?.codSituacao ?? null,
    status_date: toDateTime(status?.dataHora),
    origin: status?.siglaOrgao ?? null,
    author: authorName,
    author_party: authorParty,
    author_state: authorState,
    theme: detail.descricaoTipo ?? null,
    source_url: detail.urlInteiroTeor ?? null,
    full_text_url: detail.urlInteiroTeor ?? null,
    tramitacao_url: status?.url ?? null,
  };
}

async function fetchCamaraJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: CAMARA_HEADERS,
    next: { revalidate: 0 },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Camara API respondeu ${response.status} para ${url}: ${body}`
    );
  }

  return (await response.json()) as T;
}

function normalizeKeywords(input?: string | null) {
  if (!input) return null;
  const tokens = input
    .split(/[,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  return tokens.length ? tokens : null;
}

function toDateOnly(value?: string | null) {
  if (!value) return null;
  return value.split("T")[0] ?? value;
}

function toDateTime(value?: string | null) {
  if (!value) return null;
  const normalized = value.endsWith("Z") ? value : `${value}:00Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function subDays(date: Date, days: number) {
  const cloned = new Date(date);
  cloned.setUTCDate(cloned.getUTCDate() - days);
  return cloned;
}

function toRangeBoundary(date: string, boundary: "start" | "end") {
  return boundary === "start"
    ? `${date}T00:00:00.000Z`
    : `${date}T23:59:59.999Z`;
}

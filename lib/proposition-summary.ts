import { extname } from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeLongText } from "@/lib/openai";
import type { Tables } from "@/types/database.types";

export const MAX_CORPUS_LENGTH = 60_000; // char limit to keep prompts manageable
export const SYSTEM_PROMPT = `Você é um analista legislativo que reescreve projetos de lei em português claro, acessível a qualquer cidadão. Explique o que o texto muda na prática, quem é impactado e destaque pontos de atenção. Evite juridiquês e não invente informações.`;
export const CHUNK_PROMPT = `Transforme o trecho abaixo em linguagem simples, com foco em impacto para a população. Use frases curtas e objetivas. Não use markdown. Crie paragrafos com quebra de linhas.`;
export const COMBINE_PROMPT = `Una os resumos em até 4 parágrafos curtos, sem usar listas. Escreva em linguagem direta:
Separe o texto por parágrafos, que fiquem breves e de forma compreensível.
Não utilize marcadores, bullets ou numerações.`;

type PropositionSummaryMetadata = Pick<
  Tables<"propositions">,
  "ai_summary" | "ai_summary_updated_at"
>;

type PropositionSummaryRecord = Pick<
  Tables<"propositions">,
  | "id"
  | "title"
  | "ementa"
  | "ementa_detalhada"
  | "source_url"
  | "ai_summary"
  | "ai_summary_updated_at"
>;

type PropositionCorpusRecord = Pick<
  Tables<"propositions">,
  "id" | "title" | "ementa" | "ementa_detalhada" | "source_url"
>;

type LawSummaryRecord = Pick<
  Tables<"laws">,
  "id" | "title" | "content_text" | "file_path"
>;

export type EnsurePropositionSummaryOptions = {
  force?: boolean;
};

export type EnsurePropositionSummaryResult = {
  status: "already_exists" | "generated" | "no_source";
  summary: string | null;
  updatedAt: string | null;
};

const summaryLocks = new Map<string, Promise<EnsurePropositionSummaryResult>>();

export async function ensurePropositionSummary(
  propositionId: string,
  options: EnsurePropositionSummaryOptions = {}
): Promise<EnsurePropositionSummaryResult> {
  const trimmedId = propositionId?.trim();
  if (!trimmedId) {
    throw new Error("propositionId é obrigatório.");
  }

  const force = Boolean(options.force);
  if (!force) {
    const adminClient = createAdminClient();
    const existing = await fetchSummaryMetadata(adminClient, trimmedId);
    if (existing?.ai_summary) {
      return {
        status: "already_exists",
        summary: existing.ai_summary,
        updatedAt: existing.ai_summary_updated_at,
      };
    }
  }

  const existingLock = summaryLocks.get(trimmedId);
  if (existingLock) {
    return existingLock;
  }

  const generationPromise = runSummaryGeneration(trimmedId, force);
  summaryLocks.set(trimmedId, generationPromise);

  try {
    return await generationPromise;
  } finally {
    summaryLocks.delete(trimmedId);
  }
}

async function runSummaryGeneration(
  propositionId: string,
  force: boolean
): Promise<EnsurePropositionSummaryResult> {
  const adminClient = createAdminClient();
  const record = await fetchPropositionSummaryRecord(
    adminClient,
    propositionId
  );

  if (!force && record.ai_summary) {
    return {
      status: "already_exists",
      summary: record.ai_summary,
      updatedAt: record.ai_summary_updated_at,
    };
  }

  const corpus = buildCorpus({
    title: record.title,
    sections: [record.ementa, record.ementa_detalhada, record.source_url],
  });

  if (!corpus.trim()) {
    return {
      status: "no_source",
      summary: null,
      updatedAt: null,
    };
  }

  const summary = stripMarkdown(
    await summarizeLongText({
      text: corpus,
      detail: 0.7,
      systemPrompt: SYSTEM_PROMPT,
      chunkInstruction: CHUNK_PROMPT,
      combineInstruction: COMBINE_PROMPT,
    })
  );

  const updatedAt = new Date().toISOString();
  const { error: updateError } = await adminClient
    .from("propositions")
    .update({
      ai_summary: summary,
      ai_summary_updated_at: updatedAt,
    })
    .eq("id", propositionId);

  if (updateError) {
    throw updateError;
  }

  return {
    status: "generated",
    summary,
    updatedAt,
  };
}

async function fetchSummaryMetadata(
  adminClient: ReturnType<typeof createAdminClient>,
  propositionId: string
) {
  const { data, error } = await adminClient
    .from("propositions")
    .select("ai_summary, ai_summary_updated_at")
    .eq("id", propositionId)
    .maybeSingle<PropositionSummaryMetadata>();

  if (error) {
    throw error;
  }

  return data;
}

async function fetchPropositionSummaryRecord(
  adminClient: ReturnType<typeof createAdminClient>,
  propositionId: string
) {
  const { data, error } = await adminClient
    .from("propositions")
    .select(
      `
        id,
        title,
        ementa,
        ementa_detalhada,
        source_url,
        ai_summary,
        ai_summary_updated_at
      `
    )
    .eq("id", propositionId)
    .maybeSingle<PropositionSummaryRecord>();

  if (error) throw error;
  if (!data) throw new Error("Proposição não encontrada.");

  return data;
}

export async function summarizeLegacyLaw(
  adminClient: ReturnType<typeof createAdminClient>,
  lawId: string
) {
  const { data: law, error } = await adminClient
    .from("laws")
    .select("id, title, content_text, file_path")
    .eq("id", lawId)
    .maybeSingle<LawSummaryRecord>();

  if (error) throw error;
  if (!law) throw new Error("Lei não encontrada");

  let fileText: string | null = null;
  if (law.file_path) {
    try {
      fileText = await extractTextFromStorage(law.file_path, adminClient);
    } catch (fileError) {
      console.warn(fileError);
    }
  }

  const corpus = buildCorpus({
    title: law.title,
    sections: [law.content_text, fileText],
  });

  return corpus.trim() ? corpus : null;
}

async function extractTextFromStorage(
  filePath: string,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const { data, error } = await adminClient.storage
    .from("laws")
    .download(filePath);

  if (error || !data) {
    throw new Error("Não foi possível baixar o arquivo salvo no Supabase.");
  }

  const fileBuffer = Buffer.from(await data.arrayBuffer());
  const extension = extname(filePath).toLowerCase();

  if (extension === ".html" || extension === ".htm") {
    const raw = fileBuffer.toString("utf-8");
    return raw.replace(/<[^>]+>/g, " ");
  }

  return fileBuffer.toString("utf-8");
}

export function buildCorpus({
  title,
  sections = [],
}: {
  title: string;
  sections?: Array<string | null | undefined>;
}) {
  const parts = [
    `Título: ${title}`,
    ...sections.map((section) => section?.trim()),
  ].filter(Boolean) as string[];

  const corpus = parts.join("\n\n");
  return corpus.length > MAX_CORPUS_LENGTH
    ? corpus.slice(0, MAX_CORPUS_LENGTH)
    : corpus;
}

export function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^>{1,}\s?/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();
}

export async function summarizeProposition(
  adminClient: ReturnType<typeof createAdminClient>,
  propositionId: string
) {
  const { data, error } = await adminClient
    .from("propositions")
    .select("id, title, ementa, ementa_detalhada, source_url")
    .eq("id", propositionId)
    .maybeSingle<PropositionCorpusRecord>();

  if (error) throw error;
  if (!data) throw new Error("Proposição não encontrada.");

  const corpus = buildCorpus({
    title: data.title,
    sections: [data.ementa, data.ementa_detalhada, data.source_url],
  });

  return corpus.trim() ? corpus : null;
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/openai";

type RequestBody = {
  propositionId?: string;
  lawId?: string;
};

type AiSummary = {
  summary: string;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

const MAX_COMMENTS = Number(process.env.AI_MAX_COMMENTS ?? 120);
const COMMENT_CHAR_LIMIT = 400;
// Ajuste este prompt para mudar o tom ou o formato do resumo dos comentários.
const SYSTEM_PROMPT = `Você é um analista imparcial que lê comentários de cidadãos sobre um projeto de lei. Identifique temas recorrentes e classifique o sentimento geral. Responda apenas com JSON seguindo o formato:
{
  "summary": "texto curto em pt-BR",
  "sentiment": { "positive": 0, "neutral": 0, "negative": 0 }
}
Use apenas números inteiros e garanta que a soma corresponda ao total analisado.`;

export async function POST(request: Request) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const target = resolveSummaryTarget(body);

  if (!target) {
    return NextResponse.json(
      { error: "propositionId é obrigatório" },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();

    const titleQuery =
      target.table === "propositions"
        ? supabase
            .from("propositions")
            .select("title")
            .eq("id", target.id)
            .maybeSingle()
        : supabase.from("laws").select("title").eq("id", target.id).maybeSingle();

    const { data: recordTitle } = await titleQuery;

    const {
      data: comments,
      error,
      count,
    } = await supabase
      .from("comments")
      .select("id, content", { count: "exact" })
      .eq(target.column, target.id)
      .order("created_at", { ascending: false })
      .limit(MAX_COMMENTS);

    if (error) {
      throw error;
    }

    if (!comments?.length) {
      return NextResponse.json(
        {
          error:
            "Ainda não há comentários suficientes para gerar um resumo automático.",
        },
        { status: 400 },
      );
    }

    const promptComments = comments
      .map((comment, index) => {
        const sanitized = comment.content.trim().replace(/\s+/g, " ");
        const truncated =
          sanitized.length > COMMENT_CHAR_LIMIT
            ? `${sanitized.slice(0, COMMENT_CHAR_LIMIT)}...`
            : sanitized;
        return `${index + 1}. ${truncated}`;
      })
      .join("\n");

    const lawTitle =
      recordTitle?.title ??
      (target.table === "propositions"
        ? "Proposição legislativa"
        : "Projeto de lei");
    const analyzedTotal = comments.length;
    const aiResponse = await chatCompletion(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Lei: ${lawTitle}
Total de comentários disponíveis: ${count ?? analyzedTotal}
Total analisado agora: ${analyzedTotal}
Comentários (um por linha):
${promptComments}

Retorne o JSON solicitado.`,
        },
      ],
      { temperature: 0.2 },
    );

    const parsed = parseAiSummary(aiResponse);

    const cleanSummary = stripMarkdown(parsed.summary);
    const sentiment = parsed.sentiment;

    const { error: insertError } = await supabase
      .from("comment_summaries")
      .insert({
        [target.column]: target.id,
        total_comments: count ?? analyzedTotal,
        summary_text: cleanSummary,
        sentiment,
        updated_at: new Date().toISOString(),
        last_comment_id: comments?.[0]?.id ?? null,
      } as Record<string, unknown>);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      message: "Resumo da opinião popular atualizado.",
      totalComments: count ?? analyzedTotal,
    });
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Erro ao processar resumo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseAiSummary(raw: string): AiSummary {
  const jsonString = extractJson(raw);
  if (!jsonString) {
    throw new Error("A OpenAI não retornou um JSON válido para o resumo.");
  }

  const parsed = JSON.parse(jsonString) as Partial<AiSummary>;
  if (
    !parsed.summary ||
    !parsed.sentiment ||
    typeof parsed.sentiment.positive !== "number" ||
    typeof parsed.sentiment.neutral !== "number" ||
    typeof parsed.sentiment.negative !== "number"
  ) {
    throw new Error(
      "O JSON retornado não possui o formato esperado (summary + sentiment).",
    );
  }

  return parsed as AiSummary;
}

function extractJson(payload: string) {
  const match = payload.match(/\{[\s\S]*\}/);
  return match?.[0];
}

function stripMarkdown(value: string) {
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

type SummaryTarget =
  | { column: "proposition_id"; table: "propositions"; id: string }
  | { column: "law_id"; table: "laws"; id: string }
  | null;

function resolveSummaryTarget(body: RequestBody | null): SummaryTarget {
  if (body?.propositionId) {
    return { column: "proposition_id", table: "propositions", id: body.propositionId };
  }
  if (body?.lawId) {
    return { column: "law_id", table: "laws", id: body.lawId };
  }
  return null;
}


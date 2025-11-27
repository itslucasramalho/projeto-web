import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeLongText } from "@/lib/openai";
import { isAdminRole } from "@/lib/utils";
import {
  ensurePropositionSummary,
  summarizeLegacyLaw,
  stripMarkdown,
  SYSTEM_PROMPT,
  CHUNK_PROMPT,
  COMBINE_PROMPT,
} from "@/lib/proposition-summary";

export const runtime = "nodejs";

type RequestBody = {
  propositionId?: string;
  lawId?: string;
};

type TargetContext =
  | { type: "proposition"; id: string }
  | { type: "law"; id: string }
  | null;

function resolveTarget(body: RequestBody | null): TargetContext {
  if (body?.propositionId) {
    return { type: "proposition", id: body.propositionId };
  }
  if (body?.lawId) {
    return { type: "law", id: body.lawId };
  }
  return null;
}

export async function POST(request: Request) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabaseAuth
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminRole(profile?.role)) {
    return NextResponse.json(
      { error: "Apenas admins podem atualizar o resumo" },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const target = resolveTarget(body);

  if (!target) {
    return NextResponse.json(
      { error: "propositionId é obrigatório" },
      { status: 400 }
    );
  }

  try {
    if (target.type === "proposition") {
      const summaryResult = await ensurePropositionSummary(target.id, {
        force: true,
      });

      if (summaryResult.status === "no_source") {
        return NextResponse.json(
          {
            error:
              "Não há texto suficiente para gerar o resumo. Aguarde o próximo carregamento automático.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Resumo atualizado com sucesso",
        summary: summaryResult.summary,
      });
    }

    const adminClient = createAdminClient();
    const summarySource = await summarizeLegacyLaw(adminClient, target.id);

    if (!summarySource) {
      return NextResponse.json(
        {
          error:
            "Não há texto suficiente para gerar o resumo. Aguarde o próximo carregamento automático.",
        },
        { status: 400 }
      );
    }

    const summary = await summarizeLongText({
      text: summarySource,
      detail: 0.7,
      systemPrompt: SYSTEM_PROMPT,
      chunkInstruction: CHUNK_PROMPT,
      combineInstruction: COMBINE_PROMPT,
    });
    const cleanSummary = stripMarkdown(summary);

    const { error: updateError } = await adminClient
      .from("laws")
      .update({
        ai_summary: cleanSummary,
        ai_summary_updated_at: new Date().toISOString(),
      })
      .eq("id", target.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: "Resumo atualizado com sucesso",
      summary: cleanSummary,
    });
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error ? err.message : "Erro ao gerar resumo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

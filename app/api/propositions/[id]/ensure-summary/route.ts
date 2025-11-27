import { NextRequest, NextResponse } from "next/server";
import { ensurePropositionSummary } from "@/lib/proposition-summary";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json(
      { error: "ID da proposição é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const result = await ensurePropositionSummary(id);

    if (result.status === "no_source") {
      return NextResponse.json(
        {
          status: result.status,
          summary: null,
          updatedAt: null,
          message:
            "Ainda não há dados suficientes para gerar o resumo desta proposição.",
        },
        { status: 202 }
      );
    }

    return NextResponse.json(
      {
        status: result.status,
        summary: result.summary,
        updatedAt: result.updatedAt,
      },
      { status: result.status === "generated" ? 201 : 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar resumo.";

    if (message.includes("não encontrada")) {
      return NextResponse.json(
        { error: "Proposição não encontrada." },
        { status: 404 }
      );
    }

    console.error("[ensure-summary] Falha ao gerar resumo", {
      id,
      error,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

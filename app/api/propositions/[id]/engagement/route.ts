import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  eventType: z.enum(["view", "favorite", "share"]),
  amount: z.number().int().positive().max(10).optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido." },
      { status: 400 }
    );
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload inválido.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("increment_proposition_interest", {
      p_proposition_id: id,
      p_event: parsed.data.eventType,
      p_amount: parsed.data.amount ?? 1,
    });

    if (error) {
      console.error("[proposition.engagement] RPC error", error);
      return NextResponse.json(
        { error: "Não foi possível registrar o evento." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[proposition.engagement] Unexpected error", error);
    return NextResponse.json(
      { error: "Erro inesperado ao registrar engajamento." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}


import { NextRequest, NextResponse } from "next/server";
import { listHotTopics } from "@/lib/propositions/highlights";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : undefined;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit! > 0 ? parsedLimit! : 5;

  try {
    const topics = await listHotTopics(limit);
    return NextResponse.json({ data: topics });
  } catch (error) {
    console.error("[propositions.highlights] Failed to list hot topics", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os destaques." },
      { status: 500 }
    );
  }
}


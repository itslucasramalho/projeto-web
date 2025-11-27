import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/utils";

const SAMPLE_LAWS = [
  {
    title: "Programa Nacional de Educação Digital",
    number: "PL 230/2024",
    category: "education",
    status: "discussion",
    state: null,
    origin: "Ministério da Educação",
    source_url: "https://www.camara.leg.br/noticias/educacao-digital",
    content_text:
      "Cria um programa nacional para capacitação digital de professores e estudantes, priorizando regiões com baixo acesso à internet.",
  },
  {
    title: "Fundo Estadual de Segurança Alimentar",
    number: "PL 87/2023",
    category: "social",
    status: "approved",
    state: "BA",
    origin: "Assembleia Legislativa da Bahia",
    source_url: "https://www.alba.ba.gov.br/projetos/fesa",
    content_text:
      "Destina recursos permanentes para cozinhas solidárias e compra direta de agricultores familiares.",
  },
  {
    title: "Plano de Mobilidade Sustentável",
    number: "PL 15/2025",
    category: "environment",
    status: "draft",
    state: "SP",
    origin: "Câmara Municipal de São Paulo",
    source_url: "https://www.saopaulo.sp.leg.br/mobilidade",
    content_text:
      "Estabelece metas para redução de CO₂ no transporte urbano e incentiva ciclovias conectadas aos centros de bairro.",
  },
];

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminRole(profile?.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { count } = await supabase
    .from("laws")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) >= SAMPLE_LAWS.length) {
    return NextResponse.json({
      message: "Base já possui dados suficientes. Nenhuma ação necessária.",
    });
  }

  const { data: insertedLaws, error: lawsError } = await supabase
    .from("laws")
    .insert(
      SAMPLE_LAWS.map((law) => ({
        ...law,
        created_by: user.id,
      })),
    )
    .select("id, title");

  if (lawsError) {
    return NextResponse.json({ error: lawsError.message }, { status: 500 });
  }

  if (!insertedLaws) {
    return NextResponse.json(
      { error: "Não foi possível criar leis de exemplo" },
      { status: 500 },
    );
  }

  const commentsPayload = insertedLaws.flatMap((law, index) => {
    const topics = [
      "Impacto nas comunidades locais e próximos passos.",
      "Sugestões de aprimoramento encaminhadas durante a consulta pública.",
      "Importância do financiamento contínuo para garantir resultados.",
    ];
    return [
      {
        law_id: law.id,
        user_id: user.id,
        content: `Estou acompanhando o ${law.title} e vejo avanços importantes.`,
      },
      {
        law_id: law.id,
        user_id: user.id,
        content: topics[index % topics.length],
      },
    ];
  });

  await supabase.from("comments").insert(commentsPayload);

  const stanceValues: Array<"for" | "against" | "neutral"> = [
    "for",
    "against",
    "neutral",
  ];

  await supabase.from("stances").upsert(
    insertedLaws.map((law, index) => ({
      law_id: law.id,
      user_id: user.id,
      stance: stanceValues[index % stanceValues.length],
    })),
  );

  return NextResponse.json({
    message: "Seed concluído",
    lawsCreated: insertedLaws.length,
  });
}


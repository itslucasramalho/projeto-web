import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/utils";
import { SeedDemoButton } from "@/components/seed-demo-button";

export const metadata: Metadata = {
  title: "Gerar dados de demonstração | Engajamento Cidadão",
  description:
    "Popular o painel com leis, comentários e enquetes fictícias para demonstrar o produto durante apresentações.",
  keywords: [
    "dados de demonstração",
    "seed admin",
    "hackathon",
    "ambiente de testes",
  ],
  openGraph: {
    title: "Gerar dados de demonstração | Engajamento Cidadão",
    description:
      "Crie automaticamente conteúdos fictícios para acelerar validações e testes.",
    url: "/painel/admin/seed",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Gerar dados de demonstração | Engajamento Cidadão",
    description:
      "Ferramenta interna para ligar rapidamente o painel com dados simulados.",
  },
};

export default async function SeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminRole(profile?.role)) {
    redirect("/painel");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">
          Administração
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Gerar dados de demonstração
        </h1>
        <p className="text-sm text-muted-foreground">
          Cria automaticamente leis, comentários e enquetes para ilustrar o
          produto durante o Hackathon.
        </p>
      </div>
      <SeedDemoButton />
    </div>
  );
}


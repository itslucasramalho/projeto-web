import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ForumTopicForm } from "@/components/forum/forum-topic-form";

export const metadata: Metadata = {
  title: "Criar tópico no fórum | Engajamento Cidadão",
  description:
    "Escreva propostas claras, convide vizinhos para o debate e direcione autoridades aos desafios reais do território.",
  keywords: [
    "novo tópico",
    "criar debate público",
    "participação cidadã",
    "fórum municipal",
    "engajamento comunitário",
  ],
  openGraph: {
    title: "Criar tópico no fórum | Engajamento Cidadão",
    description:
      "Registre ideias e demandas com contexto para acelerar respostas do poder público.",
    url: "/painel/forum/new",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Criar tópico no fórum | Engajamento Cidadão",
    description:
      "Compartilhe desafios locais e mobilize outros cidadãos diretamente no painel.",
  },
};

export default async function NewForumTopicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link
          href="/painel/forum"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          &larr; Voltar para o fórum
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase text-primary">
            Novo tópico
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Conte sua ideia para autoridades e cidadãos
          </h1>
          <p className="text-sm text-muted-foreground">
            Títulos claros ajudam outras pessoas a encontrarem sua discussão.
            Foque no problema, solução ou tema que deseja debater.
          </p>
        </div>
      </header>

      <ForumTopicForm />
    </div>
  );
}

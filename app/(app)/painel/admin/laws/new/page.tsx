import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLawForm } from "@/components/admin-law-form";
import { createClient } from "@/lib/supabase/server";
import { canManageLaws } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administrar proposições | Engajamento Cidadão",
  description:
    "Monitore importações automáticas da Câmara, revise dados e cadastre novas proposições dentro do painel administrativo.",
  keywords: [
    "administração do painel",
    "proposições da câmara",
    "gestão de leis",
    "importação de dados legislativos",
  ],
  openGraph: {
    title: "Administrar proposições | Engajamento Cidadão",
    description:
      "Conferir registros importados e cadastrar novas proposições para manter o painel atualizado.",
    url: "/painel/admin/laws/new",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Administrar proposições | Engajamento Cidadão",
    description:
      "Interface segura para revisar e criar proposições monitoradas no painel.",
  },
};

export default async function AdminNewLawPage() {
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

  if (!canManageLaws(profile?.role)) {
    redirect("/painel");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">
            Administração
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Monitorar proposições da Câmara
          </h1>
          <p className="text-sm text-muted-foreground">
            Esta visão mostra o que foi importado automaticamente. Ajuste os
            filtros para investigar e, se necessário, force uma nova
            sincronização.
          </p>
        </div>
        <Link href="/painel" className="text-sm text-primary hover:underline">
          &larr; Voltar para o app
        </Link>
      </div>
      <AdminLawForm />
    </div>
  );
}

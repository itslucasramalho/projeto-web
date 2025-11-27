import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar | Engajamento Cidadão",
  description:
    "Acesse seu painel personalizado para acompanhar proposições, votar e participar dos fóruns.",
  keywords: [
    "login engajamento cidadão",
    "acesso painel",
    "participação social",
    "painel legislativo",
  ],
  openGraph: {
    title: "Entrar | Engajamento Cidadão",
    description:
      "Faça login para comentar propostas, registrar votos e monitorar indicadores.",
    url: "/auth/login",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Entrar | Engajamento Cidadão",
    description:
      "Entre no painel para acompanhar leis e participar dos fóruns cidadãos.",
  },
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta | Engajamento Cidadão",
  description:
    "Cadastre-se para receber resumos assistidos por IA, comentar proposições e participar dos fóruns.",
  keywords: [
    "criar conta engajamento cidadão",
    "cadastro participação social",
    "comentar projetos de lei",
  ],
  openGraph: {
    title: "Criar conta | Engajamento Cidadão",
    description:
      "Ative seu acesso ao painel de proposições e fóruns temáticos.",
    url: "/auth/sign-up",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Criar conta | Engajamento Cidadão",
    description:
      "Comece a participar do debate público com identidade verificada.",
  },
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}

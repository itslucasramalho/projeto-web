import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/update-password-form";

export const metadata: Metadata = {
  title: "Atualizar senha | Engajamento Cidadão",
  description:
    "Defina uma nova senha segura para continuar acompanhando proposições, fóruns e indicadores.",
  keywords: [
    "atualizar senha",
    "engajamento cidadão",
    "segurança da conta",
    "redefinir credenciais",
  ],
  openGraph: {
    title: "Atualizar senha | Engajamento Cidadão",
    description:
      "Finalize o fluxo de redefinição escolhendo uma nova senha forte.",
    url: "/auth/update-password",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Atualizar senha | Engajamento Cidadão",
    description:
      "Escolha uma nova senha para manter seu acesso ao painel protegido.",
  },
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}

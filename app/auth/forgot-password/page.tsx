import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar senha | Engajamento Cidadão",
  description:
    "Receba um link seguro por e-mail para redefinir sua senha e continuar participando do painel.",
  keywords: [
    "recuperar senha",
    "engajamento cidadão",
    "redefinir acesso",
    "login painel",
  ],
  openGraph: {
    title: "Recuperar senha | Engajamento Cidadão",
    description:
      "Informe seu e-mail para receber instruções de recuperação de acesso.",
    url: "/auth/forgot-password",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Recuperar senha | Engajamento Cidadão",
    description:
      "Envie seu e-mail e receba um link para redefinir a senha rapidamente.",
  },
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cadastro enviado | Engajamento Cidadão",
  description:
    "Verifique sua caixa de entrada para confirmar o cadastro e liberar acesso completo ao painel.",
  keywords: [
    "confirmação de cadastro",
    "engajamento cidadão",
    "verificar e-mail",
  ],
  openGraph: {
    title: "Cadastro enviado | Engajamento Cidadão",
    description:
      "Falta pouco para você acompanhar proposições e fóruns exclusivos. Confirme o e-mail enviado.",
    url: "/auth/sign-up-success",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cadastro enviado | Engajamento Cidadão",
    description: "Confirme o e-mail recebido para liberar o painel.",
  },
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

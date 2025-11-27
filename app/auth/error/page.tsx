import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Erro de autenticação | Engajamento Cidadão",
  description:
    "Algo saiu do esperado durante o login. Revise o código de erro e tente novamente.",
  keywords: [
    "erro de login",
    "falha de autenticação",
    "engajamento cidadão",
    "suporte de acesso",
  ],
  openGraph: {
    title: "Erro de autenticação | Engajamento Cidadão",
    description:
      "Mensagem detalhada para identificar e corrigir problemas de login.",
    url: "/auth/error",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Erro de autenticação | Engajamento Cidadão",
    description:
      "Consulte o código retornado e faça uma nova tentativa de login.",
  },
};

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          Code error: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

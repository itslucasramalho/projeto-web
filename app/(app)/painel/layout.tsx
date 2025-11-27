import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AppSidebar,
  MobileNav,
  type SidebarProfile,
} from "@/components/sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, state, role")
    .eq("id", user.id)
    .maybeSingle();

  const sidebarProfile: SidebarProfile | null = profile
    ? {
        id: profile.id,
        display_name: profile.display_name,
        state: profile.state,
        role: profile.role,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <AppSidebar profile={sidebarProfile} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto w-full max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Plataforma de Engajamento Cidadão
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Atualize suas opiniões e acompanhe os projetos de lei
                  </p>
                </div>
                <Link
                  href="/"
                  className="text-xs font-semibold text-primary transition hover:underline"
                >
                  Voltar à landing institucional
                </Link>
              </div>
              <MobileNav profile={sidebarProfile} />
            </div>
          </header>
          <main className="flex-1 bg-background">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

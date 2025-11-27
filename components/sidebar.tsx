"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, canManageLaws, type UserRole } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import {
  Megaphone,
  Scale,
  ShieldPlus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type SidebarProfile = {
  id: string;
  display_name: string | null;
  state: string | null;
  role: UserRole;
};

type SidebarLink = { href: string; label: string; icon: LucideIcon };

const BASE_LINKS: SidebarLink[] = [
  { href: "/painel", label: "Projetos de Lei", icon: Scale },
  { href: "/painel/forum", label: "Fórum cidadão", icon: Megaphone },
];

type SidebarProps = {
  profile: SidebarProfile | null;
};

export function buildSidebarLinks(profile: SidebarProfile | null) {
  const links = [...BASE_LINKS];

  if (profile && canManageLaws(profile.role)) {
    links.push({
      href: "/painel/admin/laws/new",
      label: "Cadastrar lei",
      icon: ShieldPlus,
    });
  }

  return links;
}

export function AppSidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const links = buildSidebarLinks(profile);

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col justify-between border-r bg-muted/20 p-6 md:sticky md:top-0 md:flex md:h-screen lg:w-72">
      <div className="space-y-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Bem-vindo
          </p>
          <p className="text-lg font-semibold leading-tight">
            {profile?.display_name ?? "Cidadão"}
          </p>
          {profile?.state && (
            <p className="text-sm text-muted-foreground">{profile.state}</p>
          )}
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = isLinkActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-md border border-dashed p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Resumo por IA
          </div>
          <p className="mt-2 text-muted-foreground">
            Utilize a inteligência artificial para entender o impacto de cada
            proposta e o sentimento geral nos comentários.
          </p>
        </div>
      </div>
      <div className="border-t pt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}

export function MobileNav({ profile }: SidebarProps) {
  const pathname = usePathname();
  const links = buildSidebarLinks(profile);

  return (
    <nav
      aria-label="Navegação rápida"
      className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden"
    >
      {links.map((link) => {
        const isActive = isLinkActive(pathname, link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-1 rounded-full border px-4 py-2 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function isLinkActive(pathname: string, href: string) {
  if (href === "/painel") {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "painel") return false;
    const subSection = segments[1];
    return !subSection || !["forum", "admin"].includes(subSection);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

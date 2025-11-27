import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForumTopicFiltersProps = {
  initialSearch?: string;
  totalCount: number;
};

export function ForumTopicFilters({
  initialSearch,
  totalCount,
}: ForumTopicFiltersProps) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">
            Filtrar discussões
          </p>
          <p className="text-xs text-muted-foreground">
            {totalCount} tópico(s) encontrado(s)
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/painel/forum">Limpar filtros</Link>
        </Button>
      </div>
      <form className="mt-4 space-y-4" method="get">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar por título ou mensagem</Label>
          <Input
            id="search"
            name="search"
            placeholder="Ex.: Transporte público em Recife"
            defaultValue={initialSearch ?? ""}
          />
        </div>
        <Button type="submit" className="w-full md:w-auto">
          Aplicar filtros
        </Button>
      </form>
    </section>
  );
}


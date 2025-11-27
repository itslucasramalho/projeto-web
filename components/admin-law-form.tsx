"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROPOSITION_TYPE_OPTIONS, type SelectOption } from "@/lib/filters";

type PropositionRow = {
  id: string;
  title: string;
  type: string;
  number: number | null;
  year: number | null;
  status: string;
  presentation_date: string;
  fetched_at: string;
  updated_at: string;
};

const RANGE_OPTIONS: SelectOption[] = [
  { value: "2", label: "Últimos 2 dias" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "15", label: "Últimos 15 dias" },
  { value: "30", label: "Últimos 30 dias" },
];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
});

export function AdminLawForm() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [range, setRange] = useState<string>("7");
  const [search, setSearch] = useState("");
  const [propositions, setPropositions] = useState<PropositionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const sinceDate = useMemo(() => {
    const days = Number(range) || 7;
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - days);
    return now.toISOString().split("T")[0];
  }, [range]);

  const loadPropositions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      let query = supabase
        .from("propositions")
        .select(
          "id, title, type, number, year, status, presentation_date, fetched_at, updated_at"
        )
        .gte("presentation_date", sinceDate)
        .order("presentation_date", { ascending: false });
      if (typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }
      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      setPropositions(data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as proposições."
      );
    } finally {
      setIsLoading(false);
    }
  }, [sinceDate, typeFilter, search]);

  useEffect(() => {
    loadPropositions();
  }, [loadPropositions]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/sync-propositions", {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Falha ao sincronizar dados.");
      }
      setSyncMessage(
        `Sincronização concluída: ${
          payload.upserted ?? 0
        } registros atualizados.`
      );
      await loadPropositions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao sincronizar proposições."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              {PROPOSITION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="range">Janela</Label>
            <select
              id="range"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search">Busca por título</Label>
            <Input
              id="search"
              placeholder="Ex: Reforma tributária"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={loadPropositions} disabled={isLoading}>
            Atualizar lista
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
          <span className="text-xs text-muted-foreground">
            Baseando-se em dados apresentados desde{" "}
            {dateFormatter.format(new Date(`${sinceDate}T00:00:00Z`))}
          </span>
        </div>
        {syncMessage && (
          <p className="mt-2 text-sm text-emerald-600">{syncMessage}</p>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </section>

      <section className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Título</th>
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Apresentação
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Atualizado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    Carregando proposições...
                  </td>
                </tr>
              ) : propositions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    Nenhuma proposição encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                propositions.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          {item.title}
                        </p>
                        <a
                          href={`/painel/${item.id}`}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Abrir página pública
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.type} {item.number ?? ""}/{item.year ?? ""}
                    </td>
                    <td className="px-4 py-3">{item.status}</td>
                    <td className="px-4 py-3">
                      {dateFormatter.format(
                        new Date(`${item.presentation_date}T00:00:00Z`)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {dateFormatter.format(new Date(item.updated_at))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

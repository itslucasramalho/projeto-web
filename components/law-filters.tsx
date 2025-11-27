"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_PROPOSITION_FILTERS,
  PROPOSITION_TYPE_OPTIONS,
  type PropositionFilters,
} from "@/lib/filters";
type Props = {
  initialFilters: PropositionFilters;
};

export function LawFilters({ initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialFilters.search);

  useEffect(() => {
    setSearchValue(initialFilters.search);
  }, [initialFilters.search]);

  const updateParams = useCallback(
    (next: Partial<PropositionFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      (Object.keys(next) as (keyof PropositionFilters)[]).forEach((key) => {
        const value = next[key];

        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ search: searchValue.trim() });
  };

  const handleReset = () => {
    setSearchValue(DEFAULT_PROPOSITION_FILTERS.search);
    updateParams(DEFAULT_PROPOSITION_FILTERS);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <Label htmlFor="search">Buscar por título ou número</Label>
        <Input
          id="search"
          placeholder="ex: Reforma Tributária"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onChange={(event) =>
            updateParams({
              type: event.target.value,
            } as Partial<PropositionFilters>)
          }
          value={initialFilters.type}
        >
          {PROPOSITION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2 lg:col-span-3">
        <div className="flex items-center gap-3">
          <Button type="submit">Aplicar filtros</Button>
          <Button type="button" variant="ghost" onClick={handleReset}>
            Limpar
          </Button>
        </div>
      </div>
    </form>
  );
}

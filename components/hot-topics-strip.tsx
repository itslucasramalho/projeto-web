import type { ReactNode } from "react";
import Link from "next/link";
import { Flame, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HotTopic } from "@/lib/propositions/highlights";

type Props = {
  topics: HotTopic[];
  interactive?: boolean;
};

export function HotTopicsStrip({ topics, interactive = true }: Props) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-primary">
          <Flame className="h-4 w-4" />
          <p className="text-sm font-semibold uppercase tracking-wide">
            Hot Topics
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Selecionamos os projetos com maior tração na comunidade nos últimos
          dias.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => {
          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant="default"
                  className="bg-primary text-primary-foreground"
                >
                  {topic.highlightLabel}
                </Badge>
                <span className="text-xs font-semibold text-primary">
                  {(topic.highlightScore * 100).toFixed(0)} pts
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground line-clamp-2">
                  {topic.title}
                </h3>
                {topic.status_situation && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {topic.status_situation}
                  </p>
                )}
              </div>
              <dl className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <Metric
                  label="Recência"
                  value={(topic.components.recency * 100).toFixed(0)}
                />
                <Metric
                  label="Engaj."
                  value={(topic.components.engagement * 100).toFixed(0)}
                />
                <Metric
                  label="Momento"
                  value={(topic.components.momentum * 100).toFixed(0)}
                  icon={<TrendingUp className="h-3 w-3 text-emerald-500" />}
                />
              </dl>
              {interactive ? (
                <span className="text-sm font-medium text-primary transition group-hover:underline">
                  Abrir detalhes →
                </span>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  Faça login para acessar os detalhes completos
                </span>
              )}
            </>
          );

          if (interactive) {
            return (
              <Link
                key={topic.id}
                href={`/painel/${topic.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                aria-label={`Abrir detalhes da proposição ${topic.title}`}
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <article
              key={topic.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm"
              aria-label={`Resumo da proposição ${topic.title}`}
            >
              {cardContent}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}%</p>
    </div>
  );
}

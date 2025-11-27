import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPropositionTypeLabel, getStateLabel } from "@/lib/filters";
import { ArrowRight, MessageSquare, ThumbsUp } from "lucide-react";

const STATUS_VARIANTS: Record<
  "positive" | "warning" | "neutral" | "negative",
  { variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  positive: { variant: "default" },
  warning: { variant: "secondary" },
  neutral: { variant: "outline" },
  negative: { variant: "destructive" },
};

export type LawCardData = {
  id: string;
  title: string;
  type: string;
  number: number | null;
  year: number | null;
  status: string;
  status_situation: string | null;
  summary: string | null;
  presentation_date: string;
  author: string | null;
  commentsCount: number;
  stancesCount: number;
  state?: string | null;
  highlightLabel?: string | null;
};

export function LawCard({ law }: { law: LawCardData }) {
  const statusMeta = STATUS_VARIANTS[getStatusVariant(law.status)] ?? {
    variant: "outline",
  };

  const formattedPresentationDate = new Date(
    `${law.presentation_date}T00:00:00Z`
  ).toLocaleDateString("pt-BR");

  return (
    <Link
      href={`/painel/${law.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
      aria-label={`Ver detalhes da proposição ${law.title}`}
    >
      <Card className="flex flex-col gap-4 border border-border/60 p-5 shadow-sm transition hover:-translate-y-0.5 group-hover:border-emerald-300 group-hover:bg-emerald-50">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant={statusMeta.variant}>{law.status}</Badge>
          <Badge variant="outline">{getPropositionTypeLabel(law.type)}</Badge>
          {law.highlightLabel && (
            <Badge
              variant="default"
              className="bg-primary text-primary-foreground"
            >
              {law.highlightLabel}
            </Badge>
          )}
          {law.state && <span>{getStateLabel(law.state)}</span>}
          <span className="ml-auto text-muted-foreground">
            Apresentado em {formattedPresentationDate}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-foreground">{law.title}</h3>
          {law.number && (
            <p className="text-sm text-muted-foreground">
              {law.type} nº {law.number}/{law.year}
            </p>
          )}
          {law.status_situation && (
            <p className="text-xs text-muted-foreground">
              {law.status_situation}
            </p>
          )}
          {law.author && (
            <p className="text-xs text-muted-foreground">
              Autor(a): {law.author}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {law.commentsCount} comentários
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            {law.stancesCount} respostas na enquete
          </span>
          <div className="ml-auto flex items-center gap-3 text-sm font-medium text-primary">
            <span className="inline-flex items-center gap-1 transition group-hover:underline">
              Ver detalhes
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function getStatusVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("aprov") || normalized.includes("sancion")) {
    return "positive";
  }
  if (
    normalized.includes("arquiv") ||
    normalized.includes("rejeit") ||
    normalized.includes("retirad")
  ) {
    return "negative";
  }
  if (normalized.includes("aguard") || normalized.includes("parecer")) {
    return "warning";
  }
  return "neutral";
}

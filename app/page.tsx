import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle2,
  FileText,
  Highlighter,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { HotTopicsStrip } from "@/components/hot-topics-strip";
import { Button } from "@/components/ui/button";
import { listHotTopics } from "@/lib/propositions/highlights";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Engajamento Cidadão | Monitoramento de projetos de lei",
  description:
    "Entenda e participe dos projetos de lei mais relevantes com resumos em linguagem simples, destaques críticos e fóruns moderados alimentados por IA.",
  keywords: [
    "engajamento cidadão",
    "projetos de lei",
    "participação cívica",
    "resumos com IA",
    "debate público",
    "fórum moderado",
  ],
  openGraph: {
    title: "Engajamento Cidadão | Monitoramento de projetos de lei",
    description:
      "Descubra o impacto das proposições municipais, acompanhe indicadores em tempo real e compartilhe sua opinião com segurança.",
    url: "/",
    type: "website",
    siteName: "Engajamento Cidadão",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engajamento Cidadão | Monitoramento de projetos de lei",
    description:
      "Resumos em linguagem simples, destaques críticos e fóruns moderados para fortalecer a participação cidadã.",
  },
};

const problemPoints = [
  "Os projetos ficam escondidos em PDFs extensos e técnicos.",
  "Falta contexto sobre impacto real na vida das pessoas.",
  "Não existe um canal oficial para opinar e ser ouvido.",
];

const solutionCards: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Resumo em linguagem simples",
    description: "IA explica em minutos o que levaria horas de leitura.",
    icon: FileText,
  },
  {
    title: "Destaques críticos",
    description: "Veja o que muda em direitos, orçamento e serviços.",
    icon: Highlighter,
  },
  {
    title: "Comentários moderados",
    description: "Debate qualificado com regras claras e curadoria.",
    icon: MessageSquare,
  },
  {
    title: "Fóruns temáticos",
    description: "Converse com quem acompanha o mesmo tema.",
    icon: Users,
  },
];

const citizenBenefits = [
  "Entenda rapidamente cada proposição.",
  "Opine com segurança e identidades verificadas.",
  "Acompanhe os debates que importam para você.",
];

const publicBenefits = [
  "Leia o pulso social em tempo quase real.",
  "Priorize pautas com base em dados de engajamento.",
  "Preste contas com transparência e histórico público.",
];

export default async function LandingPage() {
  const hotTopics = await listHotTopics().catch((error) => {
    console.error("Failed to load hot topics in landing", error);
    return [];
  });

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#1C1F26]">
      <LandingHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-16 pt-10 md:px-8">
        <HeroSection hotTopicCount={hotTopics.length} />
        <ProblemSection />
        <SolutionSection />
        <BenefitsSection />
        <TopicsSection topics={hotTopics} />
        <FinalCta />
      </main>
    </div>
  );
}

function LandingHeader() {
  const navLinks = [
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#beneficios", label: "Benefícios" },
    { href: "#poder-publico", label: "Para o poder público" },
    { href: "#topicos", label: "Tópicos em alta" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D5DAE2] bg-[#F5F6FA]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          className="text-base font-semibold uppercase tracking-[0.2em] text-primary"
        >
          Engajamento Cidadão
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#1C1F26] md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="hidden border-primary text-primary hover:bg-primary/5 md:inline-flex"
          >
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/auth/sign-up">Criar conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ hotTopicCount }: { hotTopicCount: number }) {
  return (
    <section className="rounded-[32px] border border-[#D5DAE2] bg-white px-6 py-10 shadow-[0_25px_60px_rgba(29,135,67,0.12)] md:px-12">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Participação cidadã
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-[#1C1F26]">
              Entenda e opine sobre os projetos de lei da sua cidade
            </h1>
            <p className="text-lg text-[#3B4256]">
              Traduzimos as proposições em linguagem simples, destacamos o que
              importa e abrimos um espaço seguro para você participar do debate.
              Em poucos cliques, dá para saber o que está em jogo e se
              posicionar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a href="#topicos" className="inline-flex items-center gap-2">
                Ver projetos em destaque
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#D5DAE2] bg-transparent text-[#1C1F26] hover:bg-white"
            >
              <Link href="/auth/login">Entrar no painel</Link>
            </Button>
          </div>
          <p className="text-sm text-[#3B4256]">
            {hotTopicCount > 0
              ? `${hotTopicCount} tópicos em alta agora mesmo`
              : "Atualizamos diariamente com novas proposições resumidas"}
          </p>
        </div>
        <div className="flex flex-1 flex-col justify-between gap-6 rounded-2xl border border-[#E2E6EF] bg-[#F8FAFF] p-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Radar cívico</p>
            <p className="text-2xl font-semibold text-[#1C1F26]">
              Um painel único para cidadão e poder público acompanharem o mesmo
              sinal.
            </p>
            <p className="text-sm text-[#3B4256]">
              Resumos assistidos por IA, comentários moderados e fóruns
              temáticos organizam o debate e entregam evidências para
              parlamentares.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-[#D5DAE2] bg-white/80 p-5 text-sm text-[#3B4256]">
            Com base nos dados coletados no painel autenticado, apontamos os
            temas com maior tração e entregamos relatórios resumidos para
            equipes legislativas. A visualização completa fica disponível após
            login.
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section
      id="como-funciona"
      className="grid gap-6 rounded-[28px] border border-[#E0E4ED] bg-white/90 p-8 shadow-sm md:grid-cols-[1.1fr,0.9fr]"
    >
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          O problema
        </p>
        <h2 className="text-3xl font-semibold text-[#1C1F26]">
          Por que ainda é tão difícil participar?
        </h2>
        <p className="text-base text-[#3B4256]">
          Mesmo quem quer acompanhar o processo legislativo esbarra em linguagem
          jurídica, falta de contexto e ausência de canais oficiais. Isso afasta
          milhões de pessoas das decisões que moldam o cotidiano da cidade.
        </p>
      </div>
      <ul className="space-y-4 rounded-2xl border border-[#D5DAE2] bg-[#FDFDFE] p-6 text-sm text-[#1C1F26]">
        {problemPoints.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-[#FFEFD1] p-1">
              <AlertTriangle className="h-4 w-4 text-[#FFB100]" />
            </div>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SolutionSection() {
  return (
    <section
      id="beneficios"
      className="space-y-8 rounded-[28px] border border-[#E0E4ED] bg-white/90 p-8 shadow-sm"
    >
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Nossa solução
        </p>
        <h2 className="text-3xl font-semibold text-[#1C1F26]">
          Um tradutor confiável de proposições legislativas
        </h2>
        <p className="text-base text-[#3B4256]">
          Tudo começa com a sincronização automática das proposições públicas.
          Depois aplicamos IA para resumir, destacamos os trechos críticos e
          liberamos espaços moderados para comentários e fóruns temáticos.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {solutionCards.map((card) => (
          <article
            key={card.title}
            className="flex flex-col gap-3 rounded-2xl border border-[#D5DAE2] bg-[#F8FAFF] p-6"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D5DAE2] bg-white">
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-[#1C1F26]">
              {card.title}
            </h3>
            <p className="text-sm text-[#3B4256]">{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section
      id="poder-publico"
      className="grid gap-6 rounded-[28px] border border-[#E0E4ED] bg-white/90 p-8 shadow-sm md:grid-cols-2"
    >
      <article className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Para o cidadão
        </p>
        <h3 className="text-2xl font-semibold text-[#1C1F26]">
          Informação acessível e participação segura
        </h3>
        <ul className="space-y-3 text-sm text-[#1C1F26]">
          {citizenBenefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#0E8A4E]" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Para o poder público
        </p>
        <h3 className="text-2xl font-semibold text-[#1C1F26]">
          Transparência e evidências de engajamento
        </h3>
        <ul className="space-y-3 text-sm text-[#1C1F26]">
          {publicBenefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <Building className="mt-0.5 h-5 w-5 text-primary" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5"
        >
          <a href="mailto:contato@engajamentocidadao.gov.br">
            Fale com a equipe
          </a>
        </Button>
      </article>
    </section>
  );
}

function TopicsSection({
  topics,
}: {
  topics: Awaited<ReturnType<typeof listHotTopics>>;
}) {
  return (
    <section id="topicos" className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Tópicos em alta
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-[#1C1F26]">
              Veja o que mais mobiliza a comunidade
            </h2>
            <p className="text-base text-[#3B4256]">
              Atualizamos diariamente com as proposições que estão rendendo
              comentários e votos dentro da plataforma.
            </p>
          </div>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/painel">Abrir painel completo</Link>
          </Button>
        </div>
      </div>
      {topics.length > 0 ? (
        <HotTopicsStrip topics={topics} interactive={false} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D5DAE2] bg-white/70 p-8 text-center text-sm text-[#3B4256]">
          Nenhum tópico em alta no momento. A lista será atualizada assim que
          novas proposições ganharem engajamento.
        </div>
      )}
      <p className="text-xs text-[#6C738A]">
        Os resumos auxiliam na compreensão, mas não substituem a leitura oficial
        da proposição.
      </p>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="rounded-[28px] border border-primary/30 bg-primary px-8 py-10 text-primary-foreground shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em]">
            Pronto para participar?
          </p>
          <h2 className="text-3xl font-semibold">
            Traga sua voz para o processo legislativo
          </h2>
          <p className="text-base text-white/90">
            Em poucos cliques você acessa resumos confiáveis, participa dos
            fóruns e mostra para parlamentares o que importa para a sua
            comunidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-white text-primary hover:bg-white/90">
            <Link href="/auth/sign-up" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Criar conta
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

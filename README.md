<h1 align="center">Engajamento Cidadão</h1>

<p align="center">
Plataforma aberta para acompanhar projetos de lei, gerar resumos com IA e estimular o debate público sobre o trabalho da Câmara dos Deputados.
</p>

<p align="center">
  <a href="#lista-de-membros"><strong>Membros</strong></a> ·
  <a href="#sobre-o-projeto"><strong>Sobre</strong></a> ·
  <a href="#descrição"><strong>Descrição</strong></a> ·
  <a href="#plataforma-online"><strong>Plataforma Online</strong></a> ·
  <a href="#câmara-dos-deputados-sync-job"><strong>Sync Job</strong></a> ·
  <a href="#resumos-automáticos-com-ia"><strong>IA</strong></a>
</p>
<br/>

## Sobre o projeto

O Engajamento Cidadão nasceu com o objetivo de facilitar o monitoramento de proposições legislativas federais e criar um espaço simples para que cidadãs e cidadãos conversem sobre cada texto. A aplicação puxa os dados oficiais da Câmara dos Deputados, aplica resumos automáticos com IA diretamente no frontend e oferece ferramentas de engajamento (comentários, enquetes e rankings) para entender o sentimento da comunidade em tempo real.

## Descrição

O **Engajamento Cidadão** é uma plataforma completa de participação democrática que oferece:

### 📋 Monitoramento Legislativo

- **Catálogo atualizado** de proposições (PL, PEC, MP e PLP) sincronizado diariamente via API oficial da Câmara dos Deputados
- **Busca e filtros** para localizar proposições por tema, status ou período
- **Destaques automáticos** das proposições com maior engajamento da comunidade

### 📄 Informações Detalhadas

- **Página completa** para cada proposição com status, andamento, histórico de tramitação, autor da proposição, entre outros detalhes
- **Download do PDF oficial** direto da fonte governamental (api da Câmara dos Deputados)
- **Dados estruturados** sobre autores, tipo, data de apresentação e situação atual

### 🤖 Inteligência Artificial

- **Resumidor automático** com OpenAI que sintetiza o projeto de lei para uma linguagem amigável e acessível
- **Cache inteligente** que evita chamadas duplicadas e economiza recursos
- **Resumos de comentários** que sintetizam a opinião coletiva da comunidade
- **Transcrição de áudio no resumo criado pela IA** visando promover acessibilidade para que deficientes visuais e analfabetos funcionais possam ter acesso as informações sintetizadas dos projetos de Lei

### 💬 Engajamento Cidadão

- **Sistema de comentários** para discussão pública sobre cada proposição
- **Enquetes de opinião** (A favor/Contra/Neutro) com estatísticas em tempo real
- **Rankings de popularidade** baseados em votos e participação
- **Fórum comunitário** para debates mais amplos sobre temas legislativos
- **Permite criar fóruns personalizados** para cidadãos que queiram compartilhar seus relatos e dificulades, no intuito de obter visibilidade e soluções para seus problemas

### 🔐 Autenticação e Segurança

- **Login seguro** via Supabase Auth (e-mail/senha, provedores sociais)
- **Perfis de usuário** personalizáveis com histórico de participação
- **Recuperação de senha** e confirmação por e-mail
- **Painel administrativo** protegido para moderação e gestão

### ⚙️ Painel Administrativo

- **Moderação de conteúdo** para manter debates saudáveis e respeitosos
- **Sincronização manual** para atualizar proposições sob demanda
- **Geração de resumos** em lote ou individual
- **Seeding de dados** para ambientes de desenvolvimento e testes
- **Criação manual** de proposições para casos especiais

### 🛠️ Stack Tecnológica

- **Frontend**: Next.js (App Router), React 19, TypeScript
- **Integração com o Banco**: Next.js API Routes, Supabase (PostgreSQL + Realtime)
- **Autenticação**: Supabase Auth com middleware de proteção
- **Estilização**: Tailwind CSS + shadcn/ui para componentes modernos
- **IA**: OpenAI API para sumarização e processamento de linguagem natural

## Plataforma online

Para facilitar a avaliação e o uso imediato da plataforma, adquirimos um domínio próprio e realizamos o deploy completo da aplicação. Dessa forma, você pode acessar e testar todas as funcionalidades sem precisar configurar um ambiente local, poupando tempo e esforço de instalação.

Acesse nossa plataforma em: [engajamentocidadao.online](https://engajamentocidadao.online)

Crie já seu usuário e explore todos os recursos disponíveis!

## Câmara dos Deputados Sync Job

Esse job mantém o catálogo atualizado baixando proposições diretamente da API pública da Câmara dos Deputados.

- Endpoint: `POST /api/admin/sync-propositions`
- Código: `app/api/admin/sync-propositions/route.ts`
- Intervalo: busca diariamente as proposições dos últimos 30 dias (PL, PEC, MP e PLP), mantém apenas esse intervalo na tabela `propositions` e reaproveita o restante da plataforma (comentários, enquetes, etc.).

## Resumos automáticos com IA

- Sempre que uma proposição é aberta, o frontend chama `POST /api/propositions/[id]/ensure-summary` enviando `{ "id": "<propositionId>" }` no corpo. Se não houver resumo salvo, o endpoint gera o texto via OpenAI, salva em `propositions.ai_summary` e devolve o resultado em tempo real.
- O mesmo recurso evita chamadas concorrentes para a mesma proposição e garante que usuários futuros reaproveitem o resumo gerado anteriormente, dispensando qualquer cron job específico para IA.
- Admins continuam podendo forçar uma atualização manual via `POST /api/ai/summarize-law` (com autenticação) quando quiserem revisar o conteúdo.

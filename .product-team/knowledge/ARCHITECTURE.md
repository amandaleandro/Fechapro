# Arquitetura - FechaPro

## Estrutura de Modulos

| Modulo | Caminho | Responsabilidade |
|--------|---------|------------------|
| Aplicacao web | `app/` | Rotas App Router, paginas, layout global, dashboard, login, checkout e proposta publica |
| API | `app/api/` | Endpoints REST para autenticacao, propostas, clientes, servicos, marca, pagamentos, suporte, metricas e admin |
| Componentes de pagina | `app/components/` | Formulario de proposta, preview, metricas, follow-ups, checklist e modais |
| Componentes globais | `components/` | Componentes reutilizaveis fora do dashboard principal |
| Dominio e integracoes | `lib/` | Sessao, planos, Mercado Pago, email, storage, push, WhatsApp, OpenAI, seguranca e validacoes |
| Banco | `prisma/` | Schema Prisma e modelos do PostgreSQL |
| Assets publicos | `public/` | Marca, imagens de landing, manual, service worker e uploads publicos |
| Scripts | `scripts/` | Criacao de admin, seeds, testes manuais e geracao de PDFs |
| Infra | `Dockerfile`, `docker-compose*.yml`, `nginx/` | Build standalone, app, PostgreSQL, volumes e proxy |
| Documentacao | `docs/`, `README.md`, `SISTEMA.md`, `MANUAL.md` | Guias de usuario, arquitetura, vendas e operacao |

## Fluxo de Dados

O Usuario autentica via login/senha ou Google OAuth. A sessao fica em cookie HTTP-only assinado. O dashboard consome API Routes para carregar e persistir marca, clientes, servicos, propostas, templates, portfolio, depoimentos, artes e assinatura. As rotas usam Prisma para ler e escrever no PostgreSQL. Propostas publicas sao acessadas por `publicSlug` em `app/p/[slug]`, onde clientes podem visualizar, clicar no WhatsApp, aceitar, recusar, pagar e responder pesquisas.

## Pontos de Entrada

| Entrada | Arquivo | Descricao |
|---------|---------|-----------|
| Layout global | `app/layout.tsx` | Metadados, scripts globais, Sentry e estrutura base |
| Landing | `app/landing.tsx` e `app/page.tsx` | Entrada publica e dashboard autenticado |
| Login | `app/login/page.tsx` e `app/auth/AuthPageClient.tsx` | Login, cadastro e OAuth Google |
| Dashboard | `app/page.tsx` | Principal experiencia do Usuario autenticado |
| Proposta publica | `app/p/[slug]/page.tsx` | Visualizacao publica da proposta pelo Cliente |
| PDF | `app/p/[slug]/pdf/route.ts` | Geracao de PDF da proposta |
| API REST | `app/api/**/route.ts` | Mutacoes, consultas e webhooks |

## Integracoes Externas

| Servico | Finalidade | Configuracao |
|---------|------------|--------------|
| PostgreSQL | Persistencia principal | `DATABASE_URL` e `prisma/schema.prisma` |
| Mercado Pago | Checkout, webhooks e status de pagamento | `lib/mercadopago.ts`, `app/api/webhooks/mercadopago/route.ts` |
| PIX direto | Dados de pagamento dentro da proposta | `lib/pix.ts` e `BrandProfile.pixKey` |
| Google OAuth | Login social opcional | `lib/google-auth.ts`, `app/api/auth/google/**` |
| SMTP/Nodemailer | Envio de emails | `lib/email.ts` |
| Resend | Alternativa para envio de emails | `lib/email.ts` |
| OpenAI | Geracao de artes de divulgacao | `app/api/marketing-arts/route.ts` e envs `OPENAI_*` |
| S3/R2 | Armazenamento de arquivos | `lib/storage.ts` |
| WhatsApp/Baileys | Suporte e comunicacao | `lib/whatsapp.ts`, `app/api/admin/whatsapp/route.ts` |
| Web Push | Notificacoes push | `lib/push.ts`, `public/sw.js` |
| Sentry | Observabilidade | `sentry.*.config.ts`, `next.config.ts` |
| Meta | Pixel e CAPI | `lib/meta-pixel.ts`, `lib/meta-capi.ts` |

## Padroes Arquiteturais

- Monolito Next.js com App Router.
- API Routes como camada de backend.
- Prisma como camada de acesso ao PostgreSQL.
- Logica compartilhada e integracoes centralizadas em `lib/`.
- Sessao propria por cookie assinado em vez de biblioteca externa de auth.
- Proposta publica por slug unico para compartilhamento com Cliente.
- Planos e limites centralizados em `lib/plans.ts`.

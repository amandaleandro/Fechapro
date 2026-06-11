# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> O código, a UI e o domínio são em **português (pt-BR)**. Escreva mensagens de erro, labels e comentários em português para combinar com o restante.

## Documentação de referência (consulte sempre)

Antes de mexer em uma área, leia o doc correspondente — eles são a fonte de verdade do produto:

- [README.md](README.md) — visão geral, stack, instalação, variáveis de ambiente, planos.
- [SISTEMA.md](SISTEMA.md) — arquitetura, modelos do banco, catálogo completo de endpoints, fluxos.
- [MANUAL.md](MANUAL.md) — guia do usuário final (entender o comportamento esperado de cada tela).

## Comandos

```bash
npm run dev              # Servidor de desenvolvimento (localhost:3000)
npm run build            # Build de produção (Next.js standalone)
npm run start            # Servidor de produção

npm run db:generate      # Gerar Prisma Client (rode após editar prisma/schema.prisma)
npm run db:push          # Aplicar schema ao banco (não usa migrations versionadas)
npm run db:studio        # Prisma Studio (GUI)
npm run admin:create     # Criar usuário admin (scripts/create-admin.js)

npm run lint             # ESLint
npm run test             # Vitest (run único)
npm run test:watch       # Vitest watch
npm run test:coverage    # Cobertura
```

Rodar um único teste:

```bash
npx vitest run lib/__tests__/billing-access.test.ts        # arquivo único
npx vitest run -t "nome do teste"                          # por nome
```

Docker com banco PostgreSQL local (porta 5436): `docker compose up --build -d`, depois `docker compose run --rm migrate` para aplicar o schema.

## Arquitetura

Aplicação **full-stack Next.js 16 (App Router, modo standalone)** — frontend e backend no mesmo repo, sem serviços separados. Rotas em `app/api/**` são funções de servidor que acessam o PostgreSQL diretamente via Prisma. O frontend nunca acessa o banco; tudo passa pela API. Páginas principais (`app/page.tsx` dashboard, `app/p/[slug]` proposta pública, `app/admin`) são client components que consomem os endpoints.

**Stack:** Next.js 16 / React 19 / Tailwind 4 / Prisma 6 + PostgreSQL. TypeScript com alias `@/*` para a raiz.

### Padrão de uma rota de API

Praticamente toda rota autenticada segue este formato (ver [app/api/proposals/route.ts](app/api/proposals/route.ts) como referência canônica):

```ts
export const dynamic = "force-dynamic";   // dados sempre frescos
export const revalidate = 0;

export async function POST(request: Request) {
  const session = await requireSession();        // lança Response 401 se não autenticado
  // ... validação de input com helpers de lib/validation.ts
  // ... gating de plano com lib/billing-access.ts
  // ... prisma.* com where: { userId: session.id }  ← SEMPRE escopar por usuário
  return NextResponse.json(...);
}
```

Regras importantes ao escrever rotas:

- **Sempre** escopar queries por `userId: session.id` para isolar dados entre usuários.
- Use `requireSession()` (autenticado) ou `requireAdmin()` (admin) de `lib/session.ts` / `lib/admin.ts`.
- Erros padronizados via `jsonError(msg, status)` de `lib/api.ts`.
- Validação de entrada via helpers de `lib/validation.ts` (`cleanString`, `isValidEmail`, etc.).

### Camada `lib/` (lógica de negócio e integrações)

- `session.ts` — auth por cookie HMAC-assinado (`AUTH_SECRET`); senhas com **scrypt** (`hashPassword`/`verifyPassword`).
- `admin.ts` — `isAdminEmail`/`requireAdmin`; admin é definido por email em `ADMIN_EMAIL`/`ADMIN_EMAILS` (não é uma role no banco).
- `plans.ts` — catálogo de planos (`PlanCode`), limites de proposta/arte. **Limite de propostas é acumulativo** mês a mês desde `startedAt` (`accumulatedProposalLimit`).
- `billing-access.ts` — gating de acesso: `canUsePaidFeatures(subscription)` exige status usável (`active`/`trial`) **e** provider confiável (`mercadopago`/`admin`). `canUseProposalPresentation` para planos premium.
- `mercadopago.ts` / `pix.ts` — pagamentos. Webhook em `app/api/webhooks/mercadopago`.
- `email.ts` — transacionais via Resend ou SMTP (Nodemailer). `proposal-notifications.ts` orquestra notificações de proposta.
- `push.ts` — Web Push (VAPID). `whatsapp.ts` — envio via Baileys.
- `storage.ts` — abstração de upload: usa S3/R2 se configurado, senão filesystem local (`UPLOAD_DIR`). Sempre via `saveFile`/`readUploadedFile`.
- `proposal-templates.ts` — templates estáticos por nicho/segmento. `marketing-art-html.ts` — geração de artes.
- `rate-limit.ts`, `turnstile.ts`, `security-env.ts` — segurança e anti-bot.
- `conversion.ts` / `conversion-client.ts` — funil de conversão (ver abaixo). `meta-capi.ts` — Meta Pixel + Conversions API.

### Banco de dados (Prisma)

Schema em [prisma/schema.prisma](prisma/schema.prisma). Modelo central é `User` (1:1 com `BrandProfile` e `PlanSubscription`; 1:N com a maioria dos assets). Todos os assets do usuário têm `onDelete: Cascade`. **Não há migrations versionadas** — usa-se `db push`; ao alterar o schema, rode `npm run db:generate` e `npm run db:push`.

Notas de domínio:

- Preços são armazenados como **inteiros em centavos** (`price Int`).
- `ProposalAsset.publicSlug` é o identificador do link público `/p/[slug]`. `status` segue o enum `ProposalStatus` (draft → sent → viewed → accepted/declined/expired).
- `checkoutMode` = `mercadopago` | `pix`; PIX tem confirmação manual pelo profissional (`/api/proposals/[id]/confirm-pix`).
- Planos `founder_*` são variantes vitalícias (pagamento único) da oferta de lançamento.

### Rastreamento de conversão e analytics de funil

Subsistema próprio (não usa Google Analytics) para medir o funil de venda — base do tema "sistema-venda-automatica".

- **Catálogo de eventos**: a lista canônica está em `lib/conversion.ts` (`conversionEvents`: `landing_viewed` → `primary_cta_clicked` → `signup_created` → `onboarding_*` → `first_proposal_created` → `public_proposal_viewed` → `lifetime_offer_clicked` → `checkout_started` → `payment_approved`). Variantes de oferta vitalícia em `lifetimeOfferVariants`. **Adicione novos eventos/variantes a esses arrays** — o que não estiver lá é silenciosamente descartado.
- **Client → server**: o componente `app/components/ConversionTracker.tsx` (monta `null`, dispara no `useEffect`) chama `trackConversion` (`lib/conversion-client.ts`), que envia via `navigator.sendBeacon` (com fallback `fetch keepalive`) para `POST /api/metrics/conversion`. A rota é pública, rate-limited por IP, resolve o `userId` da sessão se houver, e persiste em `prisma.conversionEvent` via `trackConversionEvent`.
- **Persistência**: modelo `ConversionEvent` no schema (FKs `onDelete: SetNull`, vários índices por `createdAt`). `trackConversionEvent` **nunca lança** — falhas viram `false` e não quebram o fluxo do usuário. Todo texto é sanitizado/truncado (`cleanConversionText`, `cleanConversionMetadata`).
- **Meta Pixel + CAPI**: o browser espelha cada evento do Pixel para `POST /api/meta/capi` com o mesmo `eventId`; o servidor (`lib/meta-capi.ts`) enriquece com IP/user-agent/e-mail-hash e a Meta deduplica por `eventId`. Degrada graciosamente sem `NEXT_PUBLIC_META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`.

### Fluxo de proposta (núcleo do produto)

Profissional cria → `ProposalAsset` com `publicSlug` → link `/p/[slug]` enviado (email/WhatsApp) → cliente abre (registra view, `status=viewed`) → cliente aceita/recusa pelas rotas públicas em `app/api/public/proposals/[slug]/*` (sem login) → pagamento via Mercado Pago ou PIX → pesquisa de satisfação opcional.

### Cron / jobs

`app/api/cron/follow-ups` envia lembretes de propostas não visualizadas (configurável por `BrandProfile.followUpEnabled`/`followUpDays`) apenas para assinaturas com acesso pago (`canUsePaidFeatures`). Aceita `GET` e `POST`. Protegido por header `Authorization: Bearer ${CRON_SECRET}` — **falha fechado**: sem `CRON_SECRET` configurado, a rota responde `401`.

Acionado externamente (não há scheduler embutido). Em produção roda via cron do sistema no VPS:

```bash
0 9 * * * curl -fsS https://SEU_DOMINIO/api/cron/follow-ups \
  -H "Authorization: Bearer $CRON_SECRET" >> /var/log/fechapro-cron.log 2>&1
```

## Variáveis de ambiente

Base em `.env.example`. Obrigatórias: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `NEXT_PUBLIC_SITE_URL`. Integrações opcionais (degradam graciosamente se ausentes): email (SMTP/Resend), `MERCADO_PAGO_*`, VAPID push, S3/R2, Turnstile, WhatsApp/Baileys, `OPENAI_API_KEY`, Meta Pixel/CAPI (`NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_TEST_EVENT_CODE`), Sentry, `CRON_SECRET`. Detalhes completos no [README.md](README.md).

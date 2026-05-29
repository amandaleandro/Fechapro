# FechaPro — Documentação do Sistema

Documento técnico de referência: arquitetura, banco de dados, APIs, integrações e decisões de design.

---

## Visão geral da arquitetura

O FechaPro é uma aplicação Next.js full-stack rodando em modo App Router. O frontend e o backend habitam o mesmo repositório. Não há separação de serviços: as rotas de API em `app/api/**` são funções serverless do Next.js que acessam o banco diretamente via Prisma.

```
Cliente (browser)
       │
       ▼
  Next.js (App Router)
  ├── app/page.tsx          — dashboard (client component)
  ├── app/p/[slug]/         — proposta pública (client component)
  ├── app/admin/            — painel admin (client component)
  └── app/api/**            — endpoints REST (server functions)
              │
              ▼
         Prisma ORM
              │
              ▼
         PostgreSQL
```

Todas as chamadas de dados do frontend passam pelos endpoints de API. Não há chamada direta ao banco pelo lado do cliente.

---

## Autenticação e sessão

- Autenticação por email + senha.
- Senhas armazenadas como hash (scrypt, via `hashPassword`/`verifyPassword` em `lib/session.ts`).
- Sessão baseada em cookie assinado com HMAC-SHA256 usando `AUTH_SECRET`.
- A função `getSession()` em `lib/session.ts` valida o cookie e retorna o usuário.
- Role de admin verificada por email: se o email do usuário estiver em `ADMIN_EMAIL` ou `ADMIN_EMAILS`, ele tem acesso ao painel em `/admin`.
- Reset de senha via token de uso único gerado em `lib/token.ts`, enviado por email.

---

## Banco de dados

### Modelos principais

#### User
Usuário do sistema. Possui niche (nicho de atuação) e segment como campos auxiliares de personalização.

#### BrandProfile (1:1 com User)
Perfil de marca do profissional: logo, cores (primary, secondary, accent), WhatsApp, chave PIX, bio, textos da proposta (intro, closing, terms, faq), visibilidade de seções (showPortfolio, showTestimonials, showServices, showFaq).

#### PlanSubscription (1:1 com User)
Plano ativo do usuário. `plan` é um enum `PlanCode`. Guarda dados do provedor de pagamento (Mercado Pago). `artCreditBalance` controla créditos de artes de IA disponíveis.

#### SignupPayment
Rastreia o status do pagamento de cadastro. Criado no checkout, atualizado pelo webhook do Mercado Pago. Após `status=paid`, o acesso do usuário é liberado.

#### ProposalAsset
Proposta comercial. Campos críticos:
- `publicSlug` — identificador único para o link público (`/p/[slug]`)
- `status` — enum `ProposalStatus`: draft, sent, viewed, awaiting_response, accepted, declined, expired
- `viewCount` / `whatsappClickCount` — rastreamento de engajamento
- `checkoutMode` — `mercadopago` ou `pix`
- `paymentStatus` — not_started, pending, paid
- `acceptedAt` / `acceptedBy` / `acceptedEmail` — dados de aceite
- `declinedAt` / `declinedReason` — dados de recusa
- `paymentPaidAt` / `paymentMethod` — dados do pagamento

#### ClientAsset
Lead/cliente do profissional. Status: `lead`, `active`, etc.

#### ServiceAsset
Serviço cadastrado. `price` em centavos (inteiro). `includes` é array de strings.

#### ProposalTemplateAsset
Template de proposta criado pelo usuário ou importado por arquivo.

#### MarketingArtAsset
Arte gerada por IA. Campos: format, objective, prompt, imageUrl, caption, whatsappMessage.

#### ArtCreditPurchase
Compra avulsa de créditos de artes. Atualiza `artCreditBalance` em `PlanSubscription` após pagamento.

#### SatisfactionSurvey (1:1 com ProposalAsset)
Pesquisa de satisfação enviada ao cliente após aceite. rating (1-5), recommendScore (NPS), comment, testimonialOk (autoriza uso como depoimento).

#### PushSubscription
Endpoint VAPID para notificações push do browser.

#### SupportThread / SupportMessage
Sistema de suporte interno. Thread por assunto, mensagens com role (user/admin).

#### InterestLead
Lead capturado pela landing page antes do cadastro.

#### AccessEvent
Evento de acesso a páginas. Usado para analytics.

---

### Enums

```prisma
enum ProposalStatus {
  draft
  sent
  viewed
  awaiting_response
  accepted
  declined
  expired
}

enum PlanCode {
  start
  essential
  professional
  complete
  pro
  plus
  premium
  premium_site
  founder_start
  founder_essential
  founder_professional
  founder_complete_site
  founder
}
```

---

## Planos e limites

Definidos em `lib/plans.ts`. Cada `PlanCode` tem um objeto com:

- `proposalLimit` — limite de propostas mensais (`UNLIMITED_PROPOSAL_LIMIT` para ilimitado)
- `artLimit` — créditos de artes mensais incluídos
- `priceCents`, `billingMode` (`subscription` | `one_time`), `public`, `features`, `serviceEntitlements`

O limite de propostas é **acumulativo**: `accumulatedProposalLimit()` multiplica o `proposalLimit` pelo número de meses desde `startedAt`, então o saldo não usado acumula mês a mês.

O acesso a features pagas é verificado em `lib/billing-access.ts` com `canUsePaidFeatures(subscription)`, que exige status usável (`active`/`trial`) **e** provider confiável (`mercadopago`/`admin`). Recursos de apresentação premium usam `canUseProposalPresentation()`.

---

## API — Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login com email/senha |
| POST | `/api/auth/signup` | Cadastro |
| POST | `/api/auth/logout` | Logout (limpa cookie) |
| GET | `/api/auth/me` | Usuário da sessão atual |
| POST | `/api/auth/forgot-password` | Envia email de redefinição |
| POST | `/api/auth/reset-password` | Redefine senha com token |

### Conta e marca

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/account` | Dados da conta do usuário |
| GET/POST | `/api/brand` | Perfil de marca |

### Propostas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/proposals` | Listar propostas (paginado) |
| POST | `/api/proposals` | Criar proposta |
| GET | `/api/proposals/[id]` | Buscar proposta |
| PUT | `/api/proposals/[id]` | Atualizar proposta |
| DELETE | `/api/proposals/[id]` | Excluir proposta |
| GET | `/api/proposals/summary` | Métricas resumidas |
| POST | `/api/proposals/[id]/duplicate` | Duplicar proposta |
| POST | `/api/proposals/[id]/resend` | Reenviar proposta ao cliente |
| POST | `/api/proposals/[id]/confirm-pix` | Confirmar recebimento PIX manualmente |
| POST | `/api/proposals/[id]/satisfaction/send` | Enviar pesquisa de satisfação |

### Proposta pública (cliente, sem login)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/public/proposals/[slug]/accept` | Cliente aceita proposta |
| POST | `/api/public/proposals/[slug]/decline` | Cliente recusa proposta |
| POST | `/api/public/proposals/[slug]/checkout` | Inicia checkout Mercado Pago |
| POST | `/api/public/proposals/[slug]/satisfaction` | Cliente envia pesquisa |
| GET | `/api/public/proposals/[slug]/whatsapp` | Registra clique no WhatsApp |

### Ativos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/clients` | Listar/criar clientes |
| GET/PUT/DELETE | `/api/clients/[id]` | Buscar/editar/excluir cliente |
| GET/POST | `/api/services` | Listar/criar serviços |
| GET/PUT/DELETE | `/api/services/[id]` | Serviço específico |
| GET/POST | `/api/portfolio` | Portfólio |
| GET/PUT/DELETE | `/api/portfolio/[id]` | Item de portfólio |
| GET/POST | `/api/testimonials` | Depoimentos |
| GET/PUT/DELETE | `/api/testimonials/[id]` | Depoimento específico |

### Artes de marketing

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/marketing-arts` | Listar artes |
| POST | `/api/marketing-arts` | Solicitar nova arte (desconta crédito) |
| GET | `/api/marketing-arts/[id]` | Buscar arte |
| DELETE | `/api/marketing-arts/[id]` | Excluir arte |

### Billing

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/billing/plan` | Plano atual |
| POST | `/api/billing/checkout` | Checkout de upgrade de plano |
| POST | `/api/billing/signup-checkout` | Checkout de cadastro |
| GET | `/api/billing/signup-checkout/[id]` | Status do checkout de cadastro |

### Webhooks

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/webhooks/mercadopago` | Webhook de pagamento do Mercado Pago |

### Push notifications

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/push/vapid-key` | Chave pública VAPID |
| POST | `/api/push/subscriptions` | Registrar inscrição push |
| DELETE | `/api/push/subscriptions` | Cancelar inscrição |

### Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/users` | Listar usuários |
| GET/PUT | `/api/admin/users/[id]` | Ver/editar usuário |
| GET | `/api/admin/metrics` | Métricas gerais |
| GET/POST | `/api/admin/support` | Tickets de suporte |
| POST | `/api/admin/whatsapp` | Gerenciar conexão WhatsApp |
| POST | `/api/admin/seed-demo-proposals` | Criar propostas demo |
| GET/POST/DELETE | `/api/admin/marketing-arts/[id]` | Gerenciar artes |

### Outros

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/interest` | Captura lead da landing |
| POST | `/api/imports` | Importação CSV em lote |
| POST/GET/DELETE | `/api/uploads` | Upload de arquivos |
| GET | `/api/stats` | Estatísticas do usuário |
| GET | `/api/proposal-templates` | Templates por nicho |

---

## Fluxo de proposta

```
Profissional cria proposta
         │
         ▼
  ProposalAsset (status=sent, publicSlug gerado)
         │
         ▼
  Link /p/[slug] enviado ao cliente via WhatsApp
         │
         ▼
  Cliente abre o link
         │  POST /api/metrics/access registra acesso
         │  viewCount++ / status=viewed
         │
         ▼
  Cliente decide:
  ├── Aceita → POST /api/public/proposals/[slug]/accept
  │            status=accepted, acceptedAt, acceptedEmail
  │            Email de notificação ao profissional
  │            Push notification ao profissional
  │            Pesquisa de satisfação agendada
  │
  ├── Recusa → POST /api/public/proposals/[slug]/decline
  │            status=declined, declinedReason, declinedAt
  │            Email de notificação ao profissional
  │
  └── Paga →  POST /api/public/proposals/[slug]/checkout (Mercado Pago)
              OU PIX direto (QR code + confirm-pix manual)
              paymentStatus=paid após confirmação
```

---

## Pagamentos

### Mercado Pago

- Checkout criado em `/api/public/proposals/[slug]/checkout` usando `lib/mercadopago.ts`.
- Webhook em `/api/webhooks/mercadopago` atualiza `paymentStatus`, `paymentMethod`, `paymentPaidAt`.
- A assinatura do webhook é validada com `MERCADO_PAGO_WEBHOOK_SECRET`.
- Sandbox habilitado com `MERCADO_PAGO_SANDBOX=true`.

### PIX direto

- QR code gerado em `lib/pix.ts` com a chave PIX configurada na marca.
- O profissional confirma o recebimento via `POST /api/proposals/[id]/confirm-pix`.
- Isso marca `paymentStatus=paid` e envia email de confirmação ao cliente.

### Billing de planos

- Checkout de cadastro criado em `/api/billing/signup-checkout`.
- `SignupPayment` criado com status=pending.
- Webhook do Mercado Pago chama `/api/billing/mercadopago/status` que:
  1. Localiza `SignupPayment` pelo `providerCheckoutId`
  2. Marca `status=paid`
  3. Atualiza `PlanSubscription` do usuário

---

## Email

`lib/email.ts` suporta dois provedores: SMTP (Nodemailer) e Resend. A escolha é automática: se `RESEND_API_KEY` estiver definida, usa Resend; caso contrário, SMTP.

Templates de email disponíveis:
- Boas-vindas ao cadastro
- Recuperação de senha
- Proposta visualizada (profissional)
- Proposta aceita (profissional e cliente)
- Proposta recusada (profissional)
- Pagamento PIX confirmado (cliente)
- Pesquisa de satisfação (cliente)

---

## Push notifications

- VAPID configurado com `VAPID_PRIVATE_KEY` e `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- Inscrições salvas em `PushSubscription` por usuário.
- `lib/push.ts` envia notificações via `web-push`.
- Eventos que disparam push: proposta visualizada, aceita, recusada, paga.
- O profissional precisa habilitar notificações no painel → componente `PushNotificationPanel`.

---

## Artes de marketing com IA

- Solicitação via `POST /api/marketing-arts`.
- Verifica `artCreditBalance` em `PlanSubscription`. Se zero, retorna erro.
- Chama OpenAI Image API com prompt gerado em `lib/marketing-art-html.ts`.
- Salva resultado em `MarketingArtAsset` com `imageUrl`.
- Admin pode revisar e aprovar artes em `/api/admin/marketing-arts`.

---

## WhatsApp

`lib/whatsapp.ts` usa a biblioteca Baileys para conectar uma conta pessoal do WhatsApp. A conexão é mantida no servidor com autenticação persistida em `WHATSAPP_BAILEYS_AUTH_DIR`.

O admin gerencia a conexão (QR code, reconexão) em `/api/admin/whatsapp`.

Alternativa: WhatsApp Cloud API (Meta), configurada com `WHATSAPP_CLOUD_ACCESS_TOKEN`.

---

## Armazenamento de arquivos

`lib/storage.ts` abstrai dois backends:

- **Local:** salva em `UPLOAD_DIR` (default `/app/uploads`), servido via `/api/uploads/[filename]`.
- **S3/R2:** usa `@aws-sdk/client-s3`. Configurado com variáveis `S3_*`. Compatível com Cloudflare R2 via `S3_ENDPOINT`.

---

## Rate limiting

`lib/rate-limit.ts` implementa rate limiting em memória (por IP). Aplicado nos endpoints de login, cadastro e reset de senha.

---

## Segurança

- **Turnstile (CAPTCHA):** validado em login e cadastro via `lib/turnstile.ts`.
- **Headers de segurança:** configurados em `next.config.ts` (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
- **Validação de entrada:** `lib/validation.ts` para email, telefone, URL e datas.
- **Admin:** verificação por email em `lib/admin.ts`. Admin não é uma coluna no banco — é derivado da variável de ambiente.
- **Health check:** `/api/health` requer `Authorization: Bearer <HEALTHCHECK_TOKEN>`.

---

## Templates de proposta

`lib/proposal-templates.ts` (60KB) contém 22 nichos com templates pré-configurados:

Design, Desenvolvimento web, Marketing digital, Fotografia, Eventos, Reformas, Beleza, Educação, Consultoria, Gastronomia, Advocacia, Contabilidade, Psicologia, Coaching, Nutrição, Odontologia e outros.

Cada template tem: nome do serviço, preço sugerido, prazo, itens incluídos, notas.

---

## Observability

`lib/observability.ts` inicializa o Sentry via `@sentry/nextjs`. Configurado em `sentry.client.config.ts`, `sentry.server.config.ts` e `sentry.edge.config.ts`. DSN via `NEXT_PUBLIC_SENTRY_DSN`.

---

## Geração de documentos

O link da proposta pública gera:

- **PDF:** `/p/[slug]/pdf` — gerado com PDFKit
- **Contrato:** `/p/[slug]/contrato` — documento de contrato gerado com PDFKit
- **Recibo:** `/p/[slug]/recibo` — recibo de pagamento
- **Slides:** `/p/[slug]/slides` — exportação em formato de slides

---

## Estrutura de pastas (técnico)

```
app/api/
├── account/            Conta do usuário
├── admin/              Endpoints exclusivos admin
│   ├── marketing-arts/ Gerenciamento de artes
│   ├── metrics/        Métricas gerais
│   ├── seed-demo-proposals/
│   ├── support/        Suporte admin
│   ├── users/          Gestão de usuários
│   └── whatsapp/       Conexão WhatsApp
├── auth/               Autenticação
├── billing/            Planos e pagamentos
├── brand/              Perfil de marca
├── clients/            Clientes
├── health/             Health check
├── imports/            Importação CSV
├── interest/           Leads da landing
├── marketing-arts/     Artes de IA
├── metrics/            Analytics
├── portfolio/          Portfólio
├── proposal-templates/ Templates por nicho
├── proposals/          Propostas
├── public/proposals/   Endpoints públicos (cliente)
├── push/               Push notifications
├── services/           Serviços
├── stats/              Estatísticas
├── support/            Suporte
├── testimonials/       Depoimentos
├── uploads/            Arquivos
└── webhooks/           Webhooks externos

lib/
├── admin.ts            Verificação de admin
├── api.ts              Helpers de resposta (jsonError, slugify)
├── billing-access.ts   Controle de acesso por plano
├── email.ts            Templates e envio de email
├── local-upload-file.ts Upload local
├── marketing-art-html.ts HTML para artes
├── mercadopago.ts      Integração Mercado Pago
├── observability.ts    Sentry
├── pix.ts              QR code PIX
├── plans.ts            Definição de planos e limites
├── prisma.ts           Singleton Prisma
├── proposal-notifications.ts Notificações por evento
├── proposal-templates.ts Templates por nicho (22+)
├── push.ts             Web Push
├── rate-limit.ts       Rate limiting
├── security-env.ts     Validação de env vars de segurança
├── session.ts          Sessão e hash de senha
├── storage.ts          S3/local abstraction
├── token.ts            Tokens de reset
├── turnstile.ts        CAPTCHA
├── validation.ts       Validação de campos
└── whatsapp.ts         Baileys WhatsApp
```

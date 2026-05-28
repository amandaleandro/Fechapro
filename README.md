# FechaPro

SaaS de propostas comerciais para prestadores de serviço. Criação de proposta com link público, aceite online, rastreamento de visualizações, pagamento via PIX ou Mercado Pago, artes de divulgação por IA e gestão completa de clientes e serviços.

---

## O que é o FechaPro

Em vez de mandar um orçamento simples pelo WhatsApp, o profissional entrega uma experiência completa: link público com marca, portfólio, depoimentos, escopo, prazo, aceite online e pagamento. Você acompanha quando o cliente abre e age na hora certa.

**Para quem:** prestadores de serviço, consultores, agências, profissionais de saúde, beleza, eventos, reformas, educação e qualquer negócio que vende por proposta.

---

## Stack

- **Framework:** Next.js 16 (App Router, modo standalone)
- **Frontend:** React 19, Tailwind CSS 4
- **Banco de dados:** PostgreSQL + Prisma ORM 6
- **Pagamentos:** Mercado Pago + PIX direto
- **Email:** Resend ou SMTP (Nodemailer)
- **Artes:** OpenAI (geração de imagem)
- **Notificações:** Web Push (VAPID) + WhatsApp (Baileys)
- **Armazenamento:** S3 / Cloudflare R2 ou local
- **Segurança:** Cloudflare Turnstile, rate limiting, sessão criptografada
- **Monitoramento:** Sentry

---

## Requisitos

- Node.js 20+
- PostgreSQL 14+

---

## Instalação local

```bash
git clone <repo-url>
cd fechapro
npm install
cp .env.example .env
# Edite .env com suas credenciais
npm run db:push
npm run admin:create
npm run dev
```

A aplicação fica em `http://localhost:3000`.

---

## Docker (desenvolvimento com banco)

```bash
docker compose up --build -d
```

Serviços:

- **App:** `http://localhost:3000`
- **PostgreSQL:** `localhost:5436`

Para aplicar o schema:

```bash
docker compose run --rm migrate
```

Para criar o usuário admin:

```bash
docker compose exec app node scripts/create-admin.js
```

---

## Variáveis de ambiente

Use `.env.example` como base. As principais:

### Obrigatórias

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/fechapro
AUTH_SECRET=               # string aleatória 32+ caracteres
APP_URL=                   # URL pública da aplicação
NEXT_PUBLIC_SITE_URL=      # URL pública para metadados
```

### Email (SMTP ou Resend — escolha um)

```env
# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_SECURE=false
EMAIL_FROM=noreply@seudominio.com

# Resend (alternativa)
RESEND_API_KEY=
EMAIL_FROM=noreply@seudominio.com
```

### Pagamentos

```env
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=
MERCADO_PAGO_SANDBOX=false
```

Configure o webhook do Mercado Pago para:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

### Push notifications

```env
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_SUBJECT=mailto:seu@email.com
```

Gerar chaves: `npx web-push generate-vapid-keys`

### Segurança

```env
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
HEALTHCHECK_TOKEN=
```

### Admin

```env
ADMIN_EMAIL=admin@seudominio.com
ADMIN_EMAILS=              # emails separados por vírgula
ADMIN_PASSWORD=
ADMIN_NAME=Administrador
```

### IA (opcional)

```env
OPENAI_API_KEY=
```

### Armazenamento S3/R2 (opcional — padrão: local)

```env
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=               # endpoint R2 ou S3 compatível
S3_PUBLIC_URL=             # URL CDN pública
UPLOAD_DIR=/app/uploads    # fallback local
```

### WhatsApp (opcional)

```env
WHATSAPP_PROVIDER=baileys
WHATSAPP_BAILEYS_AUTH_DIR=/app/whatsapp-auth
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999998888
```

### Sentry (opcional)

```env
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
```

---

## Scripts

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Servidor de produção

npm run db:generate      # Gerar client Prisma
npm run db:push          # Aplicar schema ao banco
npm run db:studio        # Prisma Studio (GUI)

npm run admin:create     # Criar usuário administrador

npm run lint             # Lint
npm run test             # Testes (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # Cobertura
```

---

## Estrutura de pastas

```text
fechapro/
├── app/
│   ├── api/              # API REST (50+ endpoints)
│   ├── components/       # Componentes de página
│   ├── admin/            # Painel administrativo
│   ├── p/[slug]/         # Proposta pública (link do cliente)
│   ├── checkout/         # Fluxo de pagamento de plano
│   ├── login/            # Autenticação
│   ├── page.tsx          # Dashboard principal
│   └── landing.tsx       # Landing page
├── components/           # Componentes globais
├── lib/                  # Lógica de negócio e integrações
├── prisma/               # Schema e migrations
├── public/               # Assets estáticos
├── scripts/              # Scripts utilitários
├── nginx/                # Config Nginx
└── .github/workflows/    # CI/CD
```

---

## Planos

Definidos em `lib/plans.ts` e no enum `PlanCode` do Prisma.

| Plano           | Propostas/mês | Destaques                         |
| --------------- | ------------- | --------------------------------- |
| Start           | 10–20         | Link, PDF, aceite online          |
| Essencial       | 30–60         | + Portfólio, rastreamento         |
| Profissional    | 60–200        | + Implantação, kit de mensagens   |
| Completo + Site | Ilimitadas    | + Site institucional, artes       |

Variantes `founder_*` para clientes da oferta de lançamento.

---

## Checklist pré-produção

- [ ] Revogar e regenerar `OPENAI_API_KEY`
- [ ] Rodar `npm run db:push` no banco de produção
- [ ] Configurar email (SMTP ou Resend) e testar envio
- [ ] Definir `APP_URL` com URL definitiva
- [ ] Gerar par de chaves VAPID
- [ ] Configurar webhook do Mercado Pago
- [ ] Setar `MERCADO_PAGO_SANDBOX=false`
- [ ] Configurar Turnstile com domínio de produção
- [ ] Criar usuário admin com `npm run admin:create`
- [ ] Testar health check em `/api/health`

---

## Documentação

| Documento                    | Conteúdo                                       |
| ---------------------------- | ---------------------------------------------- |
| [SISTEMA.md](SISTEMA.md)     | Arquitetura, banco de dados, APIs, integrações |
| [MANUAL.md](MANUAL.md)       | Guia completo para o usuário final             |

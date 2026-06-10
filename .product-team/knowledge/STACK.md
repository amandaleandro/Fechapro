# Tech Stack - FechaPro

## Frontend
- **Framework:** Next.js 16 com App Router
- **Linguagem:** TypeScript
- **UI:** React 19
- **Estilo:** Tailwind CSS 4 e CSS global em `app/globals.css`
- **Estado:** estado local em componentes React; dados persistidos via API Routes

## Backend
- **Runtime:** Node.js 20+
- **Framework:** Next.js API Routes no App Router
- **ORM:** Prisma 6
- **Autenticacao:** sessao propria via cookie HTTP-only assinado, senha com `scrypt` e OAuth Google opcional
- **Validacao e seguranca:** helpers locais em `lib/validation.ts`, rate limiting em memoria, Turnstile opcional

## Banco de Dados
- **DBMS:** PostgreSQL
- **Schema:** `prisma/schema.prisma`
- **Migrations:** Prisma `db:push` no fluxo atual

## Infraestrutura
- **Build:** Next.js standalone
- **Containerizacao:** Docker e Docker Compose
- **Proxy:** Nginx por template em `nginx/templates`
- **Monitoramento:** Sentry para Next.js
- **Armazenamento:** upload local por padrao, com suporte a S3/R2

## Integracoes
- **Pagamentos:** Mercado Pago e PIX direto
- **Email:** SMTP/Nodemailer ou Resend
- **IA:** OpenAI para geracao de artes
- **WhatsApp:** Baileys e links publicos de WhatsApp
- **Push:** Web Push com VAPID
- **Analytics/Marketing:** Meta Pixel e Meta Conversions API

## Dependencias-chave
- `next`
- `react`
- `@prisma/client`
- `@sentry/nextjs`
- `nodemailer`
- `resend`
- `pdfkit`
- `sharp`
- `puppeteer`
- `web-push`
- `@whiskeysockets/baileys`

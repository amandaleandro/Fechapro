# FechaPro

Plataforma mobile first para prestadores de serviço criarem propostas comerciais profissionais com link público, PDF, aceite do cliente, pagamento online, artes de divulgação e gestão de planos.

## Produto

O FechaPro transforma orçamentos simples em propostas completas, bonitas e fáceis de aprovar. A aplicação reúne cadastro comercial, biblioteca de serviços, clientes, portfólio, depoimentos, templates por nicho, checkout, acompanhamento comercial e suporte.

O manual completo para usuários finais fica em `docs/manual-do-usuario.md`.

Principais recursos:

- landing page comercial com planos públicos;
- cadastro, login, recuperação e redefinição de senha;
- checkout de cadastro e assinatura de planos pelo Mercado Pago;
- painel com indicadores comerciais, follow-up manual, limites do plano e uso de artes;
- cadastro de clientes, serviços, portfólio e depoimentos;
- templates prontos por nicho, pacotes com vários serviços e templates importados pelo usuário;
- criação e edição de propostas com link público, PDF, aceite, recusa, duplicação e reenvio;
- escolha de tipo de documento e segmento visual para adaptar o link público e o PDF ao serviço;
- contagem de visualizações e cliques no WhatsApp para orientar follow-up manual;
- pagamento de propostas pelo Mercado Pago ou PIX direto com QR Code e copia e cola;
- compra de créditos extras de artes pelo Mercado Pago;
- solicitação e aprovação de artes de divulgação;
- upload de imagens com remoção de fundo claro para logos;
- e-mails transacionais de proposta, resposta e pagamento, templates de lifecycle marketing e web push;
- aba de suporte para mensagens entre usuário e equipe;
- painel admin para acompanhar usuários, métricas, artes solicitadas e suporte;
- Docker com app e Postgres.

## Stack

- **Aplicação:** Next.js, React e TypeScript.
- **UI:** Tailwind CSS e Lucide Icons.
- **Banco:** Postgres.
- **ORM:** Prisma.
- **PDF:** PDFKit.
- **Imagens:** Sharp.
- **Pagamentos:** Mercado Pago.
- **E-mail:** SMTP ou Resend.
- **Push:** Web Push com VAPID.
- **Observabilidade:** Sentry e healthcheck.
- **Infra local:** Docker Compose.

## Desenvolvimento Local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Comandos úteis:

```bash
npm run lint
npm run test
npm run build
npm run db:generate
npm run db:push
npm run db:studio
npm run admin:create
```

## Rodando Com Docker

```bash
docker compose up --build -d
```

Serviços:

- App: `http://localhost:3000`
- Postgres: `localhost:5436`
- Database: `fechapro`
- User: `fechapro`
- Uploads locais: volume Docker `fechapro_uploads`, com URL salva no Postgres

Para aplicar o schema no banco:

```bash
docker compose run --rm migrate
```

Para criar ou atualizar a conta de administrador usando `ADMIN_EMAIL`, `ADMIN_EMAILS`, `ADMIN_PASSWORD` e `ADMIN_NAME`:

```bash
docker compose exec app node scripts/create-admin.js
```

Em produção, confirme que essas variáveis estão preenchidas no `.env.production` antes de rodar o comando. O e-mail usado no login precisa estar também em `ADMIN_EMAILS` para liberar o painel `/admin`.

Depois de mudar `prisma/schema.prisma`, rode:

```bash
docker compose build --no-cache migrate
docker compose run --rm migrate
docker compose up --build -d
```

Para parar:

```bash
docker compose down
```

## Variáveis De Ambiente

Use `.env.example` como base e crie seu `.env`.

```env
DATABASE_URL="postgresql://fechapro:fechapro_dev_password@localhost:5436/fechapro?schema=public"
AUTH_SECRET="troque_por_um_valor_aleatorio_forte_em_producao"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
ADMIN_EMAILS="admin@fechapro.local"
ADMIN_EMAIL="admin@fechapro.local"
ADMIN_PASSWORD="FechaProAdmin123!"
ADMIN_NAME="Administrador Geral"
MERCADO_PAGO_ACCESS_TOKEN=""
MERCADO_PAGO_WEBHOOK_SECRET=""
MERCADO_PAGO_SANDBOX="true"
POSTGRES_DB="fechapro"
POSTGRES_USER="fechapro"
POSTGRES_PASSWORD="fechapro_dev_password"
UPLOAD_DIR="/app/uploads"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER=""
NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE="Olá! Preciso de ajuda com o FechaPro."
WHATSAPP_PROVIDER="baileys"
WHATSAPP_BAILEYS_AUTH_DIR="/app/baileys-session"
WHATSAPP_NOTIFICATION_WEBHOOK_URL=""
WHATSAPP_NOTIFICATION_WEBHOOK_TOKEN=""
WHATSAPP_CLOUD_PHONE_NUMBER_ID=""
WHATSAPP_CLOUD_ACCESS_TOKEN=""
```

Também existem aliases em minúsculas para variáveis do Mercado Pago em alguns ambientes. Prefira manter os nomes do `.env.example` atualizados e nunca coloque chaves reais em arquivos versionados.

O `.env.example` também inclui configuração de IA, SMTP/Resend, Sentry, healthcheck, storage S3/R2 e Cloudflare Turnstile. Em produção, preencha `HEALTHCHECK_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`.

## Pagamentos

O checkout de planos, créditos de artes e propostas usa Mercado Pago.

Para ativar:

- configure `MERCADO_PAGO_ACCESS_TOKEN`;
- configure `MERCADO_PAGO_WEBHOOK_SECRET`;
- use `MERCADO_PAGO_SANDBOX="true"` em testes e `"false"` em produção;
- aponte o webhook no painel do Mercado Pago para:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

Nas propostas, o profissional também pode escolher PIX direto. Para isso, cadastre a chave PIX na tela **Marca** e selecione **PIX direto para minha chave** ao criar a proposta. O cliente verá QR Code e código copia e cola no checkout da proposta. A confirmação desse PIX direto deve ser combinada com o cliente, pois o FechaPro apenas exibe a chave configurada.

## Planos

Os planos ficam em `lib/plans.ts`. Atualmente há planos públicos para venda e planos internos/legados que podem continuar associados a contas existentes.

Planos públicos:

- **Start:** 20 propostas por mês e 5 artes por mês.
- **Pro:** 120 propostas por mês, 10 artes por mês e contrato mínimo para usar com clientes.
- **Premium com Site:** 600 propostas por mês, 20 artes por mês, contrato mínimo para usar com clientes, implantação/configuração, modelos de mensagens para copiar e adaptar e materiais de apoio.

Pacotes extras de artes:

- **Pacote 5 artes**
- **Pacote 15 artes**
- **Pacote 30 artes**

## E-mail, Push E Suporte

- Configure SMTP com `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `EMAIL_FROM`.
- Opcionalmente, use `RESEND_API_KEY` como alternativa de envio.
- Os e-mails transacionais cobrem boas-vindas, redefinição de senha, proposta enviada, visualização, aceite, recusa e confirmação de pagamento disponível.
- Os templates de marketing ficam em `lib/email.ts`; a régua recomendada e os cuidados de descadastro estão em `docs/emails-marketing.md`.
- Para web push, gere chaves VAPID e preencha `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`.
- Para notificações de proposta por WhatsApp com Baileys, configure `WHATSAPP_PROVIDER="baileys"` e `WHATSAPP_BAILEYS_AUTH_DIR`. O Baileys usa um único número remetente do FechaPro. No primeiro envio, escaneie o QR Code exibido nos logs do servidor; depois a sessão fica salva nessa pasta.
- Cada alerta é enviado para o WhatsApp cadastrado na tela **Marca** do profissional, avisando quando o cliente dele abriu, aprovou, recusou ou pagou uma proposta.
- Se preferir um provedor externo, configure `WHATSAPP_NOTIFICATION_WEBHOOK_URL` e opcionalmente `WHATSAPP_NOTIFICATION_WEBHOOK_TOKEN`. O endpoint recebe `phone`, `message`, `title`, `body`, `url`, `tag` e `businessName`.
- Como alternativa ao webhook, configure `WHATSAPP_CLOUD_PHONE_NUMBER_ID` e `WHATSAPP_CLOUD_ACCESS_TOKEN` para enviar pela Cloud API da Meta.
- Configure `NEXT_PUBLIC_WHATSAPP_NUMBER` com o número do suporte, somente com dígitos.
- Ajuste `NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE` para mudar a mensagem preenchida ao abrir o WhatsApp.
- A aba **Suporte** do painel registra conversas que podem ser respondidas no painel admin.

## Imagens E Storage

O upload de logo remove automaticamente fundo branco ou claro e salva em PNG com transparência.

No portfólio, a remoção de fundo fica como opção manual para evitar danificar fotos reais de trabalhos.

Sem configuração extra, os uploads ficam no storage local. Para produção, configure S3 ou Cloudflare R2 com:

- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT`
- `S3_PUBLIC_URL`

## Deploy

Antes de publicar:

- preencha `.env.production`;
- defina `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL` e `APP_URL` com o domínio real;
- configure `AUTH_SECRET` forte;
- rode migrações do Prisma;
- crie o admin com `npm run admin:create` ou `docker compose exec app node scripts/create-admin.js`;
- configure o webhook do Mercado Pago;
- valide SMTP ou Resend;
- configure chaves VAPID se for usar web push;
- configure Cloudflare Turnstile para proteger formulários públicos;
- configure `HEALTHCHECK_TOKEN` para restringir `/api/health`;
- configure Sentry, se for usar monitoramento de erros;
- use storage externo para uploads de produção.

## Próximos Ajustes Recomendados

- validar o fluxo completo do Mercado Pago em ambiente real;
- mover uploads de produção para S3 ou Cloudflare R2;
- ampliar testes de checkout, webhook e limites por plano;
- revisar textos comerciais da landing page conforme a oferta vigente;
- melhorar dashboards de receita, conversão e acompanhamento manual de follow-up.

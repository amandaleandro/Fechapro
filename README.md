# FechaPro

Plataforma mobile first para prestadores de serviço criarem propostas comerciais profissionais com IA, link público, PDF, aceite do cliente, pagamento online, artes de divulgação e gestão de planos.

## Produto

O FechaPro transforma orçamentos simples em propostas completas, bonitas e fáceis de aprovar. A aplicação reúne cadastro comercial, biblioteca de serviços, portfólio, depoimentos, geração assistida por IA, checkout e acompanhamento do interesse do cliente.

Principais recursos:

- landing page comercial com planos;
- cadastro, login e recuperação de senha;
- onboarding de marca e primeiro serviço;
- painel com indicadores comerciais e limites do plano;
- cadastro de clientes, serviços, portfólio e depoimentos;
- templates por nicho;
- geração de proposta com IA e fallback interno;
- link público da proposta;
- aceite, recusa, visualizações e clique no WhatsApp;
- PDF automático;
- pagamento da proposta pelo Mercado Pago ou PIX direto com QR Code e copia e cola;
- assinatura de planos e compra de créditos de artes pelo Mercado Pago;
- artes de divulgação com IA, conforme plano e créditos;
- upload de imagens com remoção de fundo claro para logos;
- notificações por e-mail e web push;
- painel admin para liberar, bloquear e acompanhar usuários;
- Docker com app e Postgres.

## Stack

- **Aplicação:** Next.js com TypeScript.
- **UI:** Tailwind CSS e Lucide Icons.
- **Banco:** Postgres.
- **ORM:** Prisma.
- **PDF:** PDFKit.
- **Imagens:** Sharp.
- **IA:** OpenAI Responses API e geração de imagem.
- **Pagamentos:** Mercado Pago.
- **E-mail:** SMTP ou Resend.
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
- Imagens locais: volume Docker `fechapro_uploads`, com URL salva no Postgres

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
ADMIN_EMAILS="admin@fechapro.local"
ADMIN_EMAIL="admin@fechapro.local"
ADMIN_PASSWORD="FechaProAdmin123!"
ADMIN_NAME="Administrador Geral"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.4-mini"
OPENAI_TEXT_MODEL="gpt-5.4-mini"
OPENAI_IMAGE_MODEL="gpt-image-1.5"
mercado_pago_access_token=""
mercado_pago_webhook_secret=""
mercado_pago_sandbox="true"
POSTGRES_DB="fechapro"
POSTGRES_USER="fechapro"
POSTGRES_PASSWORD="fechapro_dev_password"
UPLOAD_DIR="/app/uploads"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER=""
NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE="Olá! Preciso de ajuda com o FechaPro."
```

Nunca coloque chaves reais em arquivos versionados.

## Pagamentos

O checkout de planos, créditos de artes e propostas usa Mercado Pago.

Para ativar:

- configure `mercado_pago_access_token`;
- configure `mercado_pago_webhook_secret`;
- use `mercado_pago_sandbox="true"` em testes e `"false"` em produção;
- aponte o webhook no painel do Mercado Pago para:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

Nas propostas, o profissional tambem pode escolher PIX direto. Para isso, cadastre a chave PIX na tela **Marca** e selecione **PIX direto para minha chave** ao criar a proposta. O cliente vera QR Code e codigo copia e cola no checkout da proposta. A confirmacao desse PIX direto deve ser combinada com o cliente, pois o FechaPro apenas exibe a chave configurada.

## IA

- Sem `OPENAI_API_KEY`, o gerador de proposta usa um assistente interno de reserva.
- Com `OPENAI_API_KEY`, a rota `/api/ai/proposal` usa a OpenAI Responses API.
- Os modelos padrão são configuráveis por `OPENAI_MODEL`, `OPENAI_TEXT_MODEL` e `OPENAI_IMAGE_MODEL`.

## E-mail, Push E Suporte

- Configure SMTP com `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `EMAIL_FROM`.
- Opcionalmente, use `RESEND_API_KEY` como alternativa de envio.
- Para web push, gere chaves VAPID e preencha `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`.
- Configure `NEXT_PUBLIC_WHATSAPP_NUMBER` com o número do suporte, somente com dígitos.
- Ajuste `NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE` para mudar a mensagem preenchida ao abrir o WhatsApp.

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
- rode migrações do Prisma;
- crie o admin com `npm run admin:create` ou `docker compose exec app node scripts/create-admin.js`;
- configure o webhook do Mercado Pago;
- valide SMTP ou Resend;
- configure Sentry, se for usar monitoramento de erros.

## Próximos Ajustes Recomendados

- validar o fluxo completo do Mercado Pago em ambiente real;
- mover uploads de produção para S3 ou Cloudflare R2;
- ampliar e-mails transacionais para visualização, aceite, recusa e pagamento;
- melhorar dashboards de receita e conversão;
- ampliar testes de checkout, webhook e limites por plano.

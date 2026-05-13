# FechaPro

Plataforma mobile first para criar propostas comerciais profissionais com orçamento, portfólio, depoimentos, PDF, pagamento online e botão de aceite.

## Produto

O FechaPro ajuda prestadores de serviço a transformar orçamentos simples em propostas bonitas, organizadas e prontas para fechar mais contratos.

Principais recursos:

- landing page comercial;
- cadastro e login;
- onboarding de marca e primeiro serviço;
- painel com indicadores comerciais;
- cadastro de clientes, serviços, portfólio e depoimentos;
- templates por nicho;
- geracao de proposta com IA;
- link público da proposta;
- aceite e recusa pelo cliente;
- PDF automático;
- upload de imagens com remoção de fundo claro para logos;
- integracao preparada para link de pagamento e webhook do Asaas;
- Docker com app e Postgres.

## Stack

- **Aplicacao:** Next.js com TypeScript.
- **UI:** Tailwind CSS e Lucide Icons.
- **Banco:** Postgres.
- **ORM:** Prisma.
- **PDF:** PDFKit.
- **Imagens:** Sharp para processamento e remoção de fundo claro.
- **IA:** OpenAI Responses API, com assistente interno de reserva.
- **Pagamentos:** Asaas.
- **Infra local:** Docker Compose.

## Desenvolvimento Local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Rodando Com Docker

```bash
docker compose up --build -d
```

Servicos:

- App: `http://localhost:3000`
- Postgres: `localhost:5436`
- Database: `fechapro`
- User: `fechapro`
- Imagens: volume Docker `fechapro_uploads`, com URL salva no Postgres

Para aplicar o schema no banco:

```bash
docker compose run --rm migrate
```

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

## Deploy Na VPS

A esteira de deploy fica em `.github/workflows/deploy-vps.yml`. A cada push na branch `main`, ela:

- builda a imagem da aplicação;
- builda a imagem de migracao do Prisma;
- publica as duas no GitHub Container Registry;
- entra na VPS por SSH;
- copia `docker-compose.prod.yml` e `nginx/` para a VPS;
- puxa as imagens novas;
- roda `prisma db push`;
- reinicia app, Nginx e renovacao de SSL com `docker compose`.

### Preparar A VPS

Instale Docker e Docker Compose na VPS, crie uma pasta para o projeto e coloque nela estes arquivos:

```text
.env.production
```

O workflow copia `docker-compose.prod.yml` e `nginx/` automaticamente para essa pasta.

Exemplo de `.env.production`:

```env
POSTGRES_DB=fechapro
POSTGRES_USER=fechapro
POSTGRES_PASSWORD=troque_esta_senha
AUTH_SECRET=troque_este_secret
APP_URL=https://seu-dominio.com
DOMAIN=seu-dominio.com
SSL_EMAIL=voce@seu-dominio.com
HTTP_PORT=80
HTTPS_PORT=443
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
ASAAS_SANDBOX=false
SMTP_HOST=smtp.kinghost.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu-email@seu-dominio.com
SMTP_PASSWORD=
RESEND_API_KEY=
EMAIL_FROM=FechaPro <seu-email@seu-dominio.com>
S3_BUCKET=
S3_REGION=auto
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=
S3_PUBLIC_URL=
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE=Olá! Preciso de ajuda com o FechaPro.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
HEALTHCHECK_TOKEN=
```

Na primeira subida manual, rode dentro da pasta da VPS:

```bash
APP_IMAGE=ghcr.io/seu-usuario-ou-org/fechapro:latest \
MIGRATOR_IMAGE=ghcr.io/seu-usuario-ou-org/fechapro:migrator-latest \
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Para emitir o SSL pela primeira vez, garanta que o DNS do dominio aponta para a VPS e que as portas `80` e `443` estao liberadas. Depois rode:

```bash
APP_IMAGE=ghcr.io/seu-usuario-ou-org/fechapro:latest \
MIGRATOR_IMAGE=ghcr.io/seu-usuario-ou-org/fechapro:migrator-latest \
docker compose --env-file .env.production -f docker-compose.prod.yml --profile ssl run --rm certbot

docker exec fechapro-nginx nginx -s reload
```

O serviço `certbot-renew` fica ativo e tenta renovar o certificado automaticamente a cada 12 horas.

### Secrets Do GitHub

Configure estes secrets no repositorio:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
VPS_PORT
VPS_APP_DIR
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_WHATSAPP_NUMBER
NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE
NEXT_PUBLIC_TURNSTILE_SITE_KEY
NEXT_PUBLIC_SENTRY_DSN
```

`VPS_APP_DIR` deve ser o caminho da pasta na VPS onde estao `docker-compose.prod.yml` e `.env.production`.

As variáveis `NEXT_PUBLIC_*` são passadas no build porque o Next.js grava essas configurações no bundle do navegador.

## Observabilidade

O projeto já está instrumentado com Sentry para erros, performance e replay de sessões com erro. Para ativar, configure:

```env
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

Tambem existe o endpoint operacional `GET /api/health`, que retorna status de banco, Asaas, e-mail, storage e Sentry sem expor chaves. Se `HEALTHCHECK_TOKEN` estiver configurado, envie `Authorization: Bearer seu_token` ou `x-healthcheck-token: seu_token`.

Exemplo:

```bash
curl -H "Authorization: Bearer $HEALTHCHECK_TOKEN" https://seu-dominio.com/api/health
```

## Variaveis De Ambiente

Use `.env.example` como base e crie seu `.env`.

```env
DATABASE_URL="postgresql://fechapro:fechapro_dev_password@localhost:5436/fechapro?schema=public"
AUTH_SECRET="troque_este_secret"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.4-mini"
ASAAS_API_KEY='$aact_prod_sua_chave_aqui'
ASAAS_WEBHOOK_TOKEN="seu_token_secreto_do_webhook"
ASAAS_SANDBOX="false"
POSTGRES_DB="fechapro"
POSTGRES_USER="fechapro"
POSTGRES_PASSWORD="fechapro_dev_password"
UPLOAD_DIR="/app/uploads"
SMTP_HOST="smtp.kinghost.net"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="seu-email@seudominio.com.br"
SMTP_PASSWORD=""
EMAIL_FROM="FechaPro <seu-email@seudominio.com.br>"
RESEND_API_KEY=""
APP_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="11999998888"
NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE="Olá! Preciso de ajuda com o FechaPro."
```

Nunca coloque chaves reais em arquivos versionados.

## Email

O envio de notificacoes usa SMTP autenticado. Para KingHost, configure no `.env` local ou `.env.production` da VPS:

```env
SMTP_HOST="smtp.kinghost.net"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="seu-email@seudominio.com.br"
SMTP_PASSWORD="senha-do-email"
EMAIL_FROM="FechaPro <seu-email@seudominio.com.br>"
APP_URL="https://seudominio.com"
```

Se o app estiver hospedado fora da infraestrutura KingHost e o envio falhar, habilite SMTP internacional no painel da KingHost e troque `SMTP_HOST` para `smtpi.kinghost.net`.

Com `SMTP_HOST`, `SMTP_USER` ou `SMTP_PASSWORD` vazios, o sistema tenta usar Resend se `RESEND_API_KEY` estiver configurada. Se nenhum provedor estiver configurado, o sistema continua funcionando, mas os emails ficam desativados. Hoje o FechaPro envia email para recuperacao de senha, proposta enviada ao cliente, primeira visualizacao da proposta, aceite, recusa e clique de interesse via WhatsApp.

## Suporte Via WhatsApp

Configure `NEXT_PUBLIC_WHATSAPP_NUMBER` com o número do suporte para exibir um botão fixo no canto da aplicação. Use somente números; com ou sem `55` no início funciona.

Opcionalmente, ajuste `NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE` para mudar a mensagem preenchida automaticamente quando o cliente abrir o WhatsApp.

## IA

- Sem `OPENAI_API_KEY`, o gerador usa um assistente interno de reserva.
- Com `OPENAI_API_KEY`, a rota `/api/ai/proposal` usa a OpenAI Responses API.
- Modelo padrão: `gpt-5.4-mini`, configurável via `OPENAI_MODEL`.

## Pagamentos

Para ativar Asaas:

- configure `ASAAS_API_KEY`;
- configure `ASAAS_WEBHOOK_TOKEN`;
- mantenha `ASAAS_SANDBOX="false"` em producao ou use `"true"` para testes;
- aponte o webhook no painel do Asaas para:

```text
https://seu-dominio.com/api/webhooks/asaas
```

## Imagens

O upload de logo remove automaticamente fundo branco ou claro e salva em PNG com transparencia.

No portfólio, a remoção de fundo fica como opção manual para evitar danificar fotos reais de trabalhos.

## Proximos Ajustes Recomendados

- validar fluxo completo do Asaas em ambiente real;
- migrar uploads para storage externo em producao;
- adicionar bloqueios reais por plano;
- ampliar emails transacionais para aceite, visualizacao e pagamento;
- melhorar monitoramento e logs para deploy.

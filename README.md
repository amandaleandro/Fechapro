# FechaPro

Plataforma mobile first para criar propostas comerciais profissionais com orcamento, portfolio, depoimentos, PDF, pagamento online e botao de aceite.

## Produto

O FechaPro ajuda prestadores de servico a transformar orcamentos simples em propostas bonitas, organizadas e prontas para fechar mais contratos.

Principais recursos:
- landing page comercial;
- cadastro e login;
- onboarding de marca e primeiro servico;
- painel com indicadores comerciais;
- cadastro de clientes, servicos, portfolio e depoimentos;
- templates por nicho;
- geracao de proposta com IA;
- link publico da proposta;
- aceite e recusa pelo cliente;
- PDF automatico;
- upload de imagens com remocao de fundo claro para logos;
- integracao preparada para link de pagamento e webhook do Asaas;
- Docker com app e Postgres.

## Stack

- **Aplicacao:** Next.js com TypeScript.
- **UI:** Tailwind CSS e Lucide Icons.
- **Banco:** Postgres.
- **ORM:** Prisma.
- **PDF:** PDFKit.
- **Imagens:** Sharp para processamento e remocao de fundo claro.
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
NEXT_PUBLIC_WHATSAPP_NUMBER="11999998888"
NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE="Olá! Preciso de ajuda com o FechaPro."
```

Nunca coloque chaves reais em arquivos versionados.

## Suporte Via WhatsApp

Configure `NEXT_PUBLIC_WHATSAPP_NUMBER` com o numero do suporte para exibir um botao fixo no canto da aplicacao. Use somente numeros; com ou sem `55` no inicio funciona.

Opcionalmente, ajuste `NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE` para mudar a mensagem preenchida automaticamente quando o cliente abrir o WhatsApp.

## IA

- Sem `OPENAI_API_KEY`, o gerador usa um assistente interno de reserva.
- Com `OPENAI_API_KEY`, a rota `/api/ai/proposal` usa a OpenAI Responses API.
- Modelo padrao: `gpt-5.4-mini`, configuravel via `OPENAI_MODEL`.

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

No portfolio, a remocao de fundo fica como opcao manual para evitar danificar fotos reais de trabalhos.

## Proximos Ajustes Recomendados

- validar fluxo completo do Asaas em ambiente real;
- migrar uploads para storage externo em producao;
- adicionar bloqueios reais por plano;
- ampliar emails transacionais para aceite, visualizacao e pagamento;
- melhorar monitoramento e logs para deploy.

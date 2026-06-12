# Observabilidade - FechaPro

## Endpoints

### `GET /api/health/live`

Liveness simples. Serve para verificar se o processo HTTP responde.

Nao consulta banco nem servicos externos.

### `GET /api/health/ready`

Readiness completa. Usa a mesma autorizacao de `HEALTHCHECK_TOKEN` do `/api/health`.

Retorna status agregado e checks de:

- App/envs principais
- PostgreSQL
- Mercado Pago
- Email
- Google OAuth
- OpenAI
- Push/VAPID
- Storage local ou S3/R2
- Turnstile
- WhatsApp
- Sentry

### `GET /api/health`

Mantido por compatibilidade. Retorna o mesmo relatorio operacional completo.

### `GET /api/admin/observability`

Endpoint privado de admin. Retorna:

- Health completo
- Acessos nas ultimas 24h
- Eventos de conversao nas ultimas 24h
- Propostas criadas nas ultimas 24h
- Pagamentos de Proposta aprovados nas ultimas 24h
- Signup payments criados nas ultimas 24h
- Pagamentos falhos nos ultimos 7 dias
- Threads de suporte abertas

## Autorizacao

Para health checks protegidos, envie:

```http
Authorization: Bearer <HEALTHCHECK_TOKEN>
```

ou:

```http
x-healthcheck-token: <HEALTHCHECK_TOKEN>
```

## Logs

Use `lib/logger.ts` para logs estruturados:

- `logInfo(message, context)`
- `logWarn(message, context)`
- `logError(message, error, context)`

Os logs saem em JSON e campos sensiveis com nomes como token, secret, password, key, authorization e cookie sao mascarados.

`logError` tambem envia excecoes para o Sentry quando configurado.

## Cuidados

- Nunca colocar valores de envs ou segredos nos logs.
- Health pode mostrar se uma configuracao existe, mas nunca o valor.
- Falha em servico opcional deve retornar `degraded`, nao `down`.
- Banco indisponivel deve retornar `down`.

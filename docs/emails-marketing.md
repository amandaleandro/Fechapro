# Emails marketing do FechaPro

Esta e a regua recomendada para lifecycle marketing do FechaPro. Ela separa mensagens transacionais, que sao obrigatorias para o funcionamento do produto, de mensagens de marketing, que precisam respeitar consentimento, frequencia e descadastro.

## Principios

- Envie email transacional somente quando houver uma acao direta: cadastro, redefinicao de senha, proposta enviada, aceite, recusa ou pagamento.
- Envie email marketing somente para usuarios que aceitaram receber comunicacoes ou ainda nao fizeram opt-out.
- Todo email marketing deve ter descadastro claro. No codigo, use `sendMarketingEmail` com `unsubscribeToken` para gerar `List-Unsubscribe`.
- Evite mandar mais de 2 emails marketing por semana para o mesmo usuario, salvo campanhas muito especificas.
- O objetivo de cada email deve ser uma acao unica: criar proposta, configurar marca, ver planos, retomar painel ou testar novidade.

## Regua essencial

| Momento | Template | Objetivo | Disparo sugerido |
| --- | --- | --- | --- |
| D+1 apos cadastro | `activationDay1` | Fazer o usuario criar a primeira proposta | Usuario criado e nenhuma proposta ainda |
| D+3 apos cadastro | `activationDay3` | Completar marca e dados comerciais | BrandProfile incompleto |
| Apos proposta criada | `proposalFollowUp` | Estimular acompanhamento e follow-up | Usuario com proposta enviada e sem aceite |
| Semanal | `weeklyDigest` | Mostrar resultado e proximas acoes | Usuarios ativos, 1 vez por semana |
| Uso alto ou limite perto | `upgradeNudge` | Converter para plano maior | Plano atual com sinais de limite |
| Fim de teste/acesso | `trialEnding` | Evitar interrupcao | Assinatura perto de vencer ou pendente |
| 14-30 dias sem uso | `winBack` | Reativar conta | Sem login/proposta recente |
| Lancamento | `newFeature` | Adoção de recurso novo | Segmento que se beneficia da novidade |

## Como usar no codigo

```ts
import { sendMarketingEmail } from "@/lib/email";

await sendMarketingEmail(user.email, "activationDay1", {
  name: user.name,
  businessName: user.brandProfile?.businessName,
  unsubscribeToken: token,
});
```

## Onboarding automatico (implementado)

A regua de ativacao D+0/D+1/D+3 ja roda sozinha:

- **D+0** — `sendWelcomeEmail` disparado no cadastro (`app/api/auth/signup`).
- **D+1** — `activationDay1`, enviado pelo cron para contas com pelo menos 1 dia e **nenhuma proposta criada**.
- **D+3** — `activationDay3`, enviado pelo cron para contas com pelo menos 3 dias e **marca incompleta** (sem perfil, sem logo ou sem WhatsApp).

O job fica em `app/api/cron/onboarding` (aceita `GET` e `POST`), protegido por `Authorization: Bearer ${CRON_SECRET}` — **falha fechado** (sem secret, responde 401), igual ao cron de follow-ups. Acione uma vez por dia via cron do sistema:

```bash
0 10 * * * curl -fsS https://SEU_DOMINIO/api/cron/onboarding \
  -H "Authorization: Bearer $CRON_SECRET" >> /var/log/fechapro-cron.log 2>&1
```

### Garantias

- **Sem duplicidade**: cada envio grava `onboardingDay1SentAt` / `onboardingDay3SentAt` no `User`; o cron so seleciona quem ainda esta `null`.
- **Opt-out respeitado**: contas com `marketingUnsubscribedAt` preenchido nunca recebem onboarding. O link de descadastro (`List-Unsubscribe`) aponta para `/api/marketing/unsubscribe?token=...`, que usa o `marketingUnsubscribeToken` estavel do usuario.
- **Janela de seguranca**: contas com mais de 14 dias nao entram na regua (evita avalanche ao ligar o cron na base existente).

## Proximos passos recomendados

1. Registrar eventos de envio em uma tabela propria para medir abertura/clique pelo provedor.
2. Segmentar campanhas por comportamento: proposta enviada sem aceite (`proposalFollowUp`), uso frequente (`upgradeNudge`), conta inativa (`winBack`) e fim de acesso (`trialEnding`) — templates ja existem, falta o disparo automatico.

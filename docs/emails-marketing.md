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

## Proximos passos recomendados

1. Criar campos de preferencia de email no banco, como `marketingOptIn`, `marketingUnsubscribedAt` e `marketingUnsubscribeToken`.
2. Criar uma rota real `/api/marketing/unsubscribe` para registrar descadastro.
3. Criar um job diario para avaliar usuarios elegiveis e disparar os templates.
4. Registrar eventos de envio em uma tabela propria para evitar duplicidade e medir abertura/clique pelo provedor.
5. Segmentar campanhas por comportamento: sem proposta, proposta enviada, proposta aceita, uso frequente e conta inativa.

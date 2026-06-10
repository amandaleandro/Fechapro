# Planejamento - Sistema de Venda Automatica

## Pedido original

"Melhorar o sistema para ele se vender sozinho."

## Objetivo de negocio

Ter mais Clientes pagos na plataforma, com foco em converter Usuarios e visitantes para Planos vitalicios, preferencialmente os Planos mais altos.

## Estrategia aprovada

Criar um sistema de conversao distribuido, aparecendo em varios momentos da jornada:

- Landing antes de criar conta.
- Cadastro e onboarding.
- Criacao da primeira Proposta.
- Proposta publica aberta pelo Cliente.
- Momentos em que o Usuario encontra limites do Plano.
- Checkout e pos-checkout.

## Oferta principal

Priorizar ofertas vitalicias e Planos mais altos, especialmente os pacotes com maior valor percebido.

## Hipoteses de mensagem

Como Amanda nao tem certeza de qual argumento converte mais, o sistema deve medir variacoes. Hipoteses iniciais:

1. Fechar mais propostas: parar de mandar preco solto e gerar mais confianca.
2. Estrutura pronta: proposta, contrato, pagamento, portfolio, depoimentos, artes e site no mesmo lugar.
3. Sem mensalidade: acesso vitalicio reduzindo risco.
4. Implantacao assistida: o Usuario sai com a primeira Proposta pronta.

## Medicao desejada

Instrumentar o funil completo:

- Visita na landing.
- Clique em comecar ou comprar.
- Cadastro criado.
- Onboarding iniciado.
- Onboarding concluido.
- Primeira Proposta criada.
- Proposta publica aberta pelo Cliente.
- Clique em upgrade/oferta vitalicia.
- Checkout iniciado.
- Pagamento aprovado.

## Impacto tecnico esperado

Amanda aceita criar novas estruturas de banco/API. A feature provavelmente toca:

- `prisma/schema.prisma`
- `app/api/metrics/access/route.ts` ou novas rotas de conversao
- `app/landing.tsx`
- `app/page.tsx`
- `app/checkout/**`
- `app/p/[slug]/page.tsx`
- `lib/plans.ts`
- `lib/meta-capi.ts` e/ou `lib/meta-pixel.ts`

## Perguntas respondidas

- Problema: conseguir Clientes pagos na plataforma.
- Momentos de venda: varios pontos da jornada.
- Pode criar banco/API: sim.
- Oferta: vitalicia, priorizando Planos mais altos.
- Argumento: ainda incerto, por isso medir variacoes.
- Eventos: medir tudo na primeira versao.

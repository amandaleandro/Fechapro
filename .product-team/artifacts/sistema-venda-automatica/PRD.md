# PRD - Sistema de Venda Automatica

## Status

- **Feature:** Sistema de Venda Automatica
- **Fase:** Spec
- **Data:** 2026-06-10
- **Responsavel:** Product Manager - FechaPro

## Problema

O FechaPro precisa transformar mais visitantes e Usuarios em Clientes pagos. Hoje a venda depende muito de a pessoa entender sozinha o valor do produto, escolher um Plano e chegar ate o checkout. A experiencia deve passar a vender de forma ativa e contextual, mostrando a oferta certa no momento certo e medindo quais mensagens realmente levam ao pagamento aprovado.

## Objetivo

Criar uma camada de conversao dentro do FechaPro para promover Planos vitalicios, priorizando os Planos mais altos, em varios pontos da jornada do Usuario e da Proposta publica.

## Publico impactado

- **Visitante:** pessoa que chega na landing e ainda nao criou conta.
- **Usuario:** pessoa que ja criou conta, mas ainda nao comprou um Plano vitalicio alto.
- **Cliente:** pessoa que abre uma Proposta publica e pode se interessar pelo FechaPro.
- **Amanda/admin:** precisa enxergar quais canais, mensagens e momentos geram mais conversao.

## Metricas de sucesso

- Aumento de cliques em ofertas vitalicias.
- Aumento de checkouts iniciados para Planos vitalicios altos.
- Aumento de pagamentos aprovados.
- Identificacao dos argumentos que mais convertem.
- Visibilidade do funil completo: visita, cadastro, onboarding, Proposta, oferta, checkout e pagamento.

## Solucao

Implementar um **Motor de Conversao** e uma **Medição de Funil**.

### 1. Motor de Conversao

O sistema deve exibir chamadas contextuais para Planos vitalicios altos em momentos-chave:

- Landing antes de criar conta.
- Cadastro e onboarding.
- Dashboard apos cadastro.
- Criacao da primeira Proposta.
- Proposta publica aberta pelo Cliente.
- Bloqueios ou avisos de limite do Plano.
- Checkout e pos-checkout.

As chamadas devem priorizar a oferta vitalicia e variar os argumentos:

- Fechar mais propostas.
- Estrutura pronta em um lugar so: Proposta, contrato, pagamento, Portfolio, Depoimento, Arte de divulgacao e site.
- Sem mensalidade.
- Implantacao assistida.

### 2. Medição de Funil

O sistema deve registrar eventos de conversao para entender onde o Usuario avanca ou abandona.

Eventos da primeira versao:

- `landing_viewed`
- `primary_cta_clicked`
- `signup_created`
- `onboarding_started`
- `onboarding_completed`
- `first_proposal_created`
- `public_proposal_viewed`
- `lifetime_offer_clicked`
- `checkout_started`
- `payment_approved`

Cada evento deve poder guardar:

- Usuario, quando existir.
- Proposta, quando existir.
- Plano relacionado, quando existir.
- Origem/campanha, quando existir.
- Variante de mensagem.
- Caminho ou contexto da tela.
- Metadados flexiveis em JSON.
- Data/hora.

## Historias de Usuario

### Visitante

Como Visitante, quero entender rapidamente que o FechaPro me ajuda a fechar mais propostas, para decidir criar conta ou comprar um Plano.

### Usuario novo

Como Usuario novo, quero receber orientacao clara durante onboarding, para chegar rapido na minha primeira Proposta e perceber valor.

### Usuario gratuito ou de Plano baixo

Como Usuario, quero entender por que um Plano vitalicio alto vale mais, para comprar sem depender de suporte manual.

### Cliente que recebe Proposta

Como Cliente, ao abrir uma Proposta publica, posso perceber que aquela experiencia foi feita no FechaPro e conhecer a ferramenta sem atrapalhar a proposta do Usuario.

### Amanda/admin

Como admin, quero ver quais eventos, mensagens e Planos estao gerando conversao, para ajustar oferta e copy.

## Requisitos Funcionais

### RF1 - Registrar eventos de conversao

Criar persistencia para eventos de conversao, com suporte a Usuario opcional, Proposta opcional, Plano opcional, campanha, variante e metadados.

### RF2 - API de tracking

Criar endpoint para registrar eventos publicos e autenticados, com rate limit e validacao dos tipos permitidos.

### RF3 - Variantes de mensagem

Criar estrutura simples de variantes de oferta para testar argumentos diferentes. A primeira versao pode usar variantes fixas no codigo.

### RF4 - CTAs contextuais

Adicionar chamadas para oferta vitalicia em:

- Landing.
- Dashboard.
- Fluxo de primeira Proposta.
- Avisos de limite do Plano.
- Proposta publica.

### RF5 - Checkout com contexto

Ao iniciar checkout, preservar contexto da oferta: Plano, variante, origem e campanha.

### RF6 - Pagamento aprovado como conversao

Quando Mercado Pago confirmar pagamento aprovado, registrar `payment_approved` com Plano e Usuario relacionados.

### RF7 - Painel admin de funil

Adicionar uma visao inicial no admin para mostrar contagem por evento, conversao por variante e Planos com mais inicio de checkout/pagamento.

## Requisitos Nao Funcionais

- Nao expor dados sensiveis nos eventos.
- Tracking publico deve ter rate limit.
- Eventos devem ser tolerantes a falha: erro ao registrar evento nao pode quebrar checkout, Proposta publica ou dashboard.
- Usar Prisma e PostgreSQL.
- Manter copy em pt-BR.
- Evitar pop-ups agressivos que prejudiquem a criacao de Proposta.

## Decisoes de Produto

- A oferta principal e vitalicia, priorizando Planos mais altos.
- A primeira versao mede todos os eventos do funil.
- Variantes de mensagem podem ser fixas inicialmente para reduzir complexidade.
- A Proposta publica pode vender o FechaPro para o Cliente, mas sem competir com o objetivo principal da Proposta do Usuario.

## Decisoes Tecnicas

- Criar novo modelo Prisma para eventos de conversao.
- Criar helper em `lib/` para registrar eventos de forma resiliente.
- Criar API Route dedicada em `app/api/metrics/conversion/route.ts`.
- Reaproveitar `app/api/metrics/access/route.ts` apenas se fizer sentido; evitar misturar metricas de acesso simples com funil comercial se isso deixar o dominio confuso.
- Integrar registro de pagamento aprovado no webhook do Mercado Pago.
- Adicionar agregacoes simples no admin, provavelmente em `app/api/admin/metrics/route.ts` ou rota admin nova.

## Fora de Escopo

- Sistema completo de A/B test estatistico.
- Editor visual de campanhas.
- Cupom de desconto dinamico.
- CRM de vendas interno.
- Automacao de email marketing completa.
- Integracao nova com ferramentas externas alem das ja existentes.

## Criterios de Aceite

- O banco possui estrutura para registrar eventos de conversao.
- Existe endpoint seguro para registrar eventos publicos e autenticados.
- Landing, dashboard, primeira Proposta, Proposta publica, limite de Plano, checkout e pagamento aprovado registram eventos.
- Ofertas vitalicias aparecem em pontos contextuais sem bloquear tarefas principais.
- Checkout recebe contexto de Plano, origem e variante quando iniciado por uma oferta.
- Admin consegue visualizar pelo menos contagens por evento e por variante.
- Falha no tracking nao impede o Usuario de usar o sistema.
- Testes cobrem validacao de eventos e helper de tracking quando viavel.

## Riscos

- Excesso de chamadas comerciais pode reduzir confianca se parecer invasivo.
- Eventos publicos podem gerar ruido se nao houver rate limit.
- Dados de conversao podem ficar incompletos se checkout e webhook nao propagarem contexto.
- Mensagens focadas em Planos altos podem afastar Usuarios que ainda precisam perceber valor.

## Plano de Lançamento

1. Implementar tracking e persistencia.
2. Instrumentar funil essencial.
3. Adicionar ofertas contextuais.
4. Criar visao admin inicial.
5. Revisar dados apos primeiros acessos e ajustar mensagens.

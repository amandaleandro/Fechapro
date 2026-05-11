# Arquitetura Do FechaPro

## Produto

O FechaPro e uma plataforma para prestadores de servico criarem propostas comerciais profissionais com orcamento, portfolio, depoimentos, PDF, pagamento online e aceite do cliente.

## Entidades Principais

- **User:** dono da conta.
- **BrandProfile:** dados comerciais, logo, cor principal e canais de contato.
- **ClientAsset:** clientes cadastrados pelo usuario.
- **ServiceAsset:** servicos e pacotes reutilizaveis.
- **PortfolioAsset:** imagens e trabalhos anteriores usados nas propostas.
- **TestimonialAsset:** depoimentos reutilizaveis.
- **ProposalAsset:** proposta comercial publicada, com valores, prazo, validade, status e link publico.
- **PlanSubscription:** plano ativo, limites e informacoes de assinatura.

## Status De Proposta

- `sent`: proposta enviada.
- `viewed`: cliente abriu o link publico.
- `accepted`: cliente aceitou a proposta.
- `declined`: cliente recusou a proposta.

## Fluxo Principal

1. Usuario cria conta.
2. Configura marca, logo, cores e dados de contato.
3. Cadastra clientes, servicos, portfolio e depoimentos.
4. Cria proposta manualmente, por template ou com ajuda da IA.
5. Compartilha link publico com o cliente.
6. Cliente visualiza, baixa PDF, inicia pagamento, aceita ou recusa.
7. Painel atualiza status, visualizacoes, aceite e valor comercial.

## Imagens

Uploads sao salvos no volume configurado por `UPLOAD_DIR`.

Logos passam por remocao automatica de fundo claro e sao salvos como PNG. Imagens de portfolio podem usar remocao de fundo opcional.

## Pagamentos

O fluxo de pagamento usa AbacatePay:

- a proposta cria ou reutiliza produto/checkout;
- o cliente e redirecionado para o checkout;
- o webhook confirma pagamento;
- a proposta registra status e recibo.

## IA

A rota `/api/ai/proposal` usa OpenAI quando `OPENAI_API_KEY` esta configurada. Sem chave, o sistema usa um assistente interno de reserva para manter a experiencia funcional.

## Producao

Antes de publicar em producao, recomenda-se:

- configurar `AUTH_SECRET` forte;
- usar Postgres gerenciado;
- migrar uploads para storage externo;
- configurar dominio e HTTPS;
- validar webhook da AbacatePay;
- rotacionar qualquer chave exposta;
- ativar logs e monitoramento.

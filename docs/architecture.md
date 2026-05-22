# Arquitetura Do FechaPro

## Produto

O FechaPro é uma plataforma para prestadores de serviço criarem propostas comerciais profissionais com orçamento, portfólio, depoimentos, PDF, pagamento online e aceite do cliente.

## Entidades Principais

- **User:** dono da conta.
- **BrandProfile:** dados comerciais, logo, cores, chave PIX e canais de contato.
- **ClientAsset:** clientes cadastrados pelo usuário.
- **ServiceAsset:** serviços e pacotes reutilizáveis.
- **PortfolioAsset:** imagens e trabalhos anteriores usados nas propostas.
- **TestimonialAsset:** depoimentos reutilizaveis.
- **ProposalAsset:** proposta comercial publicada, com valores, prazo, validade, status, link público, tipo de documento e segmento visual.
- **PlanSubscription:** plano ativo, limites e informacoes de assinatura.

Observação: `ProposalAsset.checkoutMode` define se a proposta usa Mercado Pago ou PIX direto. `documentType` e `segment` orientam a apresentação do link público e do PDF; quando ficam em `auto`, o app usa o conteúdo da proposta para escolher uma variação adequada.

## Status De Proposta

- `sent`: proposta enviada.
- `viewed`: cliente abriu o link público.
- `accepted`: cliente aceitou a proposta.
- `declined`: cliente recusou a proposta.

## Fluxo Principal

1. Usuário cria conta.
2. Configura marca, logo, cores e dados de contato.
3. Cadastra clientes, serviços, portfólio e depoimentos.
4. Cria proposta manualmente, por template ou reunindo vários serviços cadastrados.
5. Compartilha link público com o cliente.
6. Cliente visualiza a página e o PDF adaptados ao segmento, inicia pagamento, aceita ou recusa.
7. Painel atualiza status, visualizacoes, aceite e valor comercial.

## Imagens

Uploads são salvos no volume configurado por `UPLOAD_DIR`.

Logos passam por remoção automática de fundo claro e são salvos como PNG. Imagens de portfólio podem usar remoção de fundo opcional.

## Pagamentos

Historicamente o fluxo de pagamento foi descrito aqui como AbacatePay, mas a implementacao atual usa Mercado Pago e PIX direto:

- a proposta cria um checkout no provedor quando usa Mercado Pago;
- o cliente e redirecionado para Mercado Pago, ou ve QR Code/copia e cola quando usa PIX direto;
- o webhook confirma pagamentos intermediados pelo Mercado Pago;
- a proposta registra status, provedor, recibo e data de pagamento quando há confirmação automática.

Implementação atual: planos, créditos de artes e checkout intermediado de propostas usam Mercado Pago, com confirmação pelo webhook `/api/webhooks/mercadopago`. Propostas também podem usar PIX direto quando o profissional cadastra `pixKey` em `BrandProfile` e salva a proposta com `checkoutMode = "pix"`; nesse caso o checkout público gera payload EMV PIX, QR Code e código copia e cola, mas a confirmação fica fora do webhook automático.

## IA

A rota `/api/ai/proposal` usa OpenAI quando `OPENAI_API_KEY` está configurada. Sem chave, o sistema usa um assistente interno de reserva para manter a experiência funcional.

## E-mail E Protecao Publica

`lib/email.ts` concentra e-mails transacionais e templates de lifecycle marketing. A página pública da proposta pode notificar visualização e os formulários públicos usam Cloudflare Turnstile em produção.

O healthcheck de produção exige `HEALTHCHECK_TOKEN`; a chamada deve enviar Bearer token ou `x-healthcheck-token`.

## Producao

Antes de publicar em producao, recomenda-se:

- configurar `AUTH_SECRET` forte;
- usar Postgres gerenciado;
- migrar uploads para storage externo;
- configurar dominio e HTTPS;
- validar webhook do Mercado Pago;
- rotacionar qualquer chave exposta;
- ativar logs e monitoramento.

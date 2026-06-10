# FechaPro

O FechaPro ajuda prestadores de servicos e pequenos negocios a transformarem orcamentos simples em propostas profissionais que geram mais confianca e aumentam as chances de fechamento.

## Linguagem

**Usuario** (Entidade):
Pessoa que acessa o sistema, cria propostas, gerencia clientes, servicos, marca, pagamentos e recursos do plano. No codigo, identificado como `User`.
_Evitar_: conta generica, membro, operador.

**Plano** (Entidade):
Pacote comercial que define limites, recursos e condicoes de acesso do Usuario. No codigo, identificado por `PlanCode`, `PlanSubscription` e `plans`.
_Evitar_: assinatura quando estiver falando do pacote; produto de pagamento.

**Proposta** (Entidade):
Documento/link profissional enviado ao cliente com escopo, valor, prazo, marca, aceite online, pagamento e rastreamento. No codigo, identificado como `ProposalAsset`.
_Evitar_: orcamento simples, pedido, cotacao.

**Cliente** (Entidade):
Pessoa ou empresa para quem o Usuario vende e envia propostas. No codigo, identificado como `ClientAsset`.
_Evitar_: lead quando ja existe cadastro de cliente.

**Servico** (Entidade):
Oferta cadastrada pelo Usuario com nome, preco, prazo, itens inclusos e imagem opcional. No codigo, identificado como `ServiceAsset`.
_Evitar_: produto fisico, tarefa.

**Marca** (Entidade):
Configuracao visual e comercial do Usuario, incluindo nome do negocio, logo, cores, WhatsApp, PIX, textos e exibicao de secoes. No codigo, identificado como `BrandProfile`.
_Evitar_: perfil pessoal, identidade solta.

**Portfolio** (Entidade):
Galeria de trabalhos exibida nas propostas para reforcar prova de capacidade. No codigo, identificado como `PortfolioAsset`.
_Evitar_: galeria generica.

**Depoimento** (Entidade):
Prova social cadastrada pelo Usuario ou derivada de pesquisa de satisfacao. No codigo, identificado como `TestimonialAsset`.
_Evitar_: review quando a interface usa depoimento.

**Arte de divulgacao** (Entidade):
Imagem e texto gerados para campanhas ou posts, com consumo de credito conforme plano ou pacote. No codigo, identificado como `MarketingArtAsset` e `ArtCreditPurchase`.
_Evitar_: banner generico, criativo sem contexto.

**Aceite** (Evento):
Confirmacao do cliente na proposta publica, registrando dados, IP, user agent, versao de contrato e snapshot. No codigo, fica em campos `accepted*` de `ProposalAsset`.
_Evitar_: assinatura formal quando nao houver assinatura digital certificada.

## Exemplo de dialogo

**Dev:** "Quando uma proposta vira venda?"

**Especialista de dominio:** "Quando o cliente abre a proposta publica, entende escopo, valor e prazo, e registra o aceite. Depois disso, o FechaPro pode gerar contrato, recibo e conduzir o pagamento."

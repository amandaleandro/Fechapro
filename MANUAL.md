# FechaPro — Manual do Usuário

Guia completo para usar o FechaPro: desde o primeiro acesso até o fechamento de propostas com pagamento.

---

## O que é o FechaPro

O FechaPro é uma plataforma para prestadores de serviço criarem propostas comerciais profissionais com link único, PDF, aceite online e pagamento integrado. Você envia o link pelo WhatsApp, o cliente abre, vê sua proposta com marca, escopo, valor e prazo, e pode aceitar ou recusar diretamente.

Você acompanha tudo no painel: quando a proposta foi aberta, quando foi aceita, e quando o pagamento entrou.

---

## Primeiro acesso

### 1. Cadastro

1. Acesse o site e escolha um plano.
2. Conclua o pagamento (PIX ou cartão via Mercado Pago).
3. Você receberá um email com instruções de acesso em até 24h úteis (plano Start).
4. Acesse `/login` e entre com email e senha.

### 2. Configurar sua marca

Antes de criar a primeira proposta, configure sua marca. Clique em **Marca** no menu lateral.

Preencha:
- **Nome da empresa** — aparece no cabeçalho de todas as propostas
- **Logo** — faça upload da sua logo (remove fundo automaticamente)
- **Cores** — primária, secundária e destaque (usadas na proposta do cliente)
- **WhatsApp** — número com DDD, sem formatação (ex: 11999998888)
- **Chave PIX** — CPF, CNPJ, email, telefone ou chave aleatória
- **Bio** — apresentação profissional curta, exibida na proposta
- **Redes sociais** — Instagram, site, email de contato

**Textos da proposta (opcional):**
- Introdução — texto de abertura da proposta
- Fechamento — mensagem de encerramento
- Termos — condições gerais do serviço
- FAQ — perguntas frequentes dos seus clientes

**Visibilidade:**
Escolha o que aparece na proposta do cliente: portfólio, depoimentos, serviços, FAQ.

Clique em **Salvar marca** quando terminar.

---

## Criando uma proposta

### Passo 1: Acessar criação

No menu lateral, clique em **Propostas** e depois em **Nova proposta**.

### Passo 2: Preencher os dados

**Dados do cliente:**
- Nome do cliente
- Email do cliente (opcional, para notificações automáticas)

**Dados do serviço:**
- Nome do serviço
- Valor (R$)
- Prazo de entrega
- Validade da proposta (data até quando a proposta fica ativa)
- Condições de pagamento (ex: 50% na aprovação, 50% na entrega)

**O que está incluído:**
Adicione os itens que fazem parte do escopo, um por linha. Esses itens aparecem em destaque para o cliente.

**Observações:**
Campo livre para informações adicionais, contexto ou avisos importantes.

### Passo 3: Usar um template (opcional)

Clique em **Usar template** para aproveitar um modelo pré-configurado por nicho. O FechaPro tem templates para 22 nichos incluindo design, marketing, saúde, eventos, reformas, educação e mais.

O template preenche automaticamente o nome do serviço, valor sugerido, prazo e itens incluídos. Você ajusta conforme o projeto específico.

### Passo 4: Modo de pagamento

Escolha como o cliente vai pagar:

- **Mercado Pago** — o cliente abre o checkout do Mercado Pago direto na proposta (cartão, PIX, boleto)
- **PIX direto** — exibe o QR code do seu PIX na proposta. Você confirma o recebimento manualmente no painel.

### Passo 5: Salvar e enviar

Clique em **Salvar proposta**. O sistema gera um link único (ex: `fechapro.com.br/p/abc123`).

Clique em **Copiar link** e envie pelo WhatsApp para o cliente.

---

## Acompanhando propostas

No menu **Propostas**, você vê todas as propostas com status em tempo real.

### Status possíveis

| Status | Significado |
|--------|-------------|
| Rascunho | Salva mas não enviada |
| Enviada | Link criado, aguardando abertura |
| Visualizada | Cliente abriu a proposta |
| Aceita | Cliente clicou em aceitar |
| Recusada | Cliente clicou em recusar |
| Expirada | Data de validade ultrapassada |

### Detalhes da proposta

Clique em qualquer proposta para ver o painel de detalhes com:

- **Histórico** — linha do tempo com cada evento (criação, visualizações, aceite, pagamento)
- **Estatísticas** — quantidade de visualizações, cliques no WhatsApp
- **Pagamento** — modo, status, método, data e link do comprovante
- **Aceite** — data, nome e email de quem aceitou

### Confirmar PIX manualmente

Se o cliente pagou via PIX e você recebeu o comprovante, clique em **Confirmar recebimento do PIX** no painel da proposta. O sistema marca como pago e envia email de confirmação ao cliente.

---

## Próximos passos após aceite

Quando uma proposta é aceita, o painel exibe uma seção **Próximos passos** com ações recomendadas:

- **Criar proposta de continuidade** — duplica a proposta para um novo projeto com o mesmo cliente
- **Ver aceite do cliente** — abre o link público da proposta para ver como o cliente viu

---

## Ações em propostas

Na listagem de propostas, cada item tem ações disponíveis:

- **Duplicar** — cria uma cópia da proposta (útil para enviar ajuste de preço ou reaproveitamento)
- **Reenviar** — envia email de lembrete ao cliente com o link da proposta
- **Editar** — altera os dados da proposta (só disponível enquanto não aceita)
- **Excluir** — remove a proposta permanentemente

---

## Gestão de clientes

No menu **Clientes**, cadastre e organize seus leads e clientes ativos.

### Cadastrar cliente

Preencha: nome, email, telefone, segmento, serviço de interesse, observações e status (lead, ativo, inativo).

### Importar via CSV

Clique em **Importar** para subir uma planilha CSV com múltiplos clientes de uma vez. O formato aceito tem colunas: nome, email, telefone, segmento.

---

## Gestão de serviços

No menu **Serviços**, cadastre o catálogo dos seus serviços. Ao criar uma proposta, você pode selecionar um serviço do catálogo e os dados são preenchidos automaticamente.

Campos: nome, preço, prazo, o que está incluído, foto do serviço.

---

## Portfólio e depoimentos

### Portfólio

Adicione imagens de trabalhos anteriores no menu **Portfólio**. Essas imagens aparecem na proposta pública do cliente quando `showPortfolio` está ativo na marca.

### Depoimentos

Cadastre depoimentos de clientes anteriores no menu **Depoimentos**. Aparecem na proposta pública quando `showTestimonials` está ativo.

---

## Artes de divulgação

No menu **Artes**, solicite artes de marketing geradas por IA para usar no Instagram, WhatsApp e outros canais.

### Solicitar uma arte

1. Clique em **Nova arte**
2. Escolha o formato: post Instagram, story, status WhatsApp
3. Preencha o briefing: objetivo, serviço, público-alvo, chamada para ação
4. Clique em **Gerar arte**

O sistema usa seus créditos de arte (incluídos no plano ou comprados separadamente) e gera a imagem. A arte inclui legenda e sugestão de mensagem para WhatsApp prontas para uso.

### Créditos de arte

O saldo de créditos aparece no topo da seção Artes. Cada arte gerada desconta 1 crédito. Você pode comprar créditos adicionais no menu **Plano**.

---

## Plano e assinatura

No menu **Plano**, você vê:

- Seu plano atual e recursos incluídos
- Uso de propostas no mês (com e sem limite conforme plano)
- Saldo de créditos de arte
- Opções de upgrade

---

## Notificações

### Email

Você recebe email quando:
- Um cliente abre sua proposta
- Um cliente aceita a proposta
- Um cliente recusa a proposta
- Um pagamento é confirmado

O cliente recebe email quando:
- A proposta é aceita (confirmação)
- O PIX é confirmado pelo profissional
- Uma pesquisa de satisfação é enviada

### Push (notificações no navegador)

Habilite as notificações push no painel (menu **Conta → Notificações**). Você receberá alertas em tempo real mesmo com a aba do FechaPro fechada.

---

## Pesquisa de satisfação

Após uma proposta ser aceita e o serviço concluído, você pode enviar uma pesquisa de satisfação ao cliente.

Na proposta aceita, clique em **Enviar pesquisa de satisfação**. O cliente recebe um email com um formulário curto: nota, NPS e comentário.

Se o cliente autorizar, o depoimento é salvo automaticamente na sua biblioteca de depoimentos.

---

## Templates salvos

No menu **Templates**, você pode salvar modelos de propostas personalizados para reutilizar.

Crie um template preenchendo os campos da proposta e clicando em **Salvar como template**. Da próxima vez, selecione o template ao criar uma proposta.

---

## Suporte

### Central de suporte

Acesse o menu **Suporte** para abrir um ticket diretamente na plataforma. Nossa equipe responde por essa mesma interface.

### WhatsApp

O botão de suporte via WhatsApp está disponível em todas as telas (canto inferior direito) para dúvidas rápidas.

---

## A proposta do ponto de vista do cliente

Quando o cliente abre o link recebido, ele vê:

1. **Cabeçalho** — logo e nome da sua empresa com as cores da sua marca
2. **Dados do serviço** — nome, valor, prazo e condições de pagamento
3. **O que está incluído** — lista de itens do escopo
4. **Bio do profissional** — sua apresentação
5. **Portfólio** — galeria de trabalhos anteriores (se habilitado)
6. **Depoimentos** — avaliações de outros clientes (se habilitado)
7. **FAQ** — perguntas frequentes (se habilitado)
8. **Botões de ação** — Aceitar, Recusar e opção de pagamento

O cliente **não precisa criar conta** para aceitar ou pagar. Tudo acontece no próprio link.

---

## Perguntas frequentes

**Meu cliente precisa baixar algum app?**
Não. O link abre direto no navegador do celular ou computador, sem cadastro.

**Posso personalizar a cor da proposta?**
Sim. As cores configuradas no perfil de marca são aplicadas automaticamente em todas as propostas.

**O PIX vai direto para minha conta?**
Sim. O QR code usa a chave PIX que você cadastrou. O FechaPro não intermedia o pagamento PIX.

**O que acontece quando a proposta expira?**
A proposta fica com status Expirada e o cliente vê uma mensagem informando. O link continua acessível para consulta, mas os botões de ação ficam desabilitados.

**Posso alterar uma proposta depois de enviar?**
Sim, enquanto o cliente não aceitou. Após o aceite, a proposta fica bloqueada para edição para manter o registro do que foi acordado.

**Como o cliente recebe o PDF?**
O link da proposta tem um botão para baixar o PDF. O cliente também pode imprimir direto do browser.

**Quantas propostas posso enviar por mês?**
Depende do plano. Start: 10 a 20 por mês. Essencial: 30 a 60. Profissional: 60 a 200. Completo: ilimitadas.

**Posso usar no celular?**
Sim. O FechaPro é totalmente responsivo. Você cria, envia e acompanha propostas pelo celular.

---

## Dicas de uso

- **Configure a marca antes** de criar a primeira proposta. A identidade visual faz diferença na percepção do cliente.
- **Use os templates** dos nichos como ponto de partida. Ajuste preço e prazo para o projeto específico.
- **Adicione o email do cliente** ao criar a proposta para que ele receba notificações automáticas de aceite e pagamento.
- **Habilite as notificações push** para saber em tempo real quando o cliente abriu e aceitou.
- **Saldo de créditos de arte** renova mensalmente. Aproveite para criar conteúdo de divulgação regularmente.
- **Follow-up com contexto:** ao ver que o cliente abriu a proposta mas não respondeu, entre em contato sabendo que ele já viu o valor — não precisa reexplicar.

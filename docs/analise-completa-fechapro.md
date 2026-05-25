# Análise Completa — FechaPro
**Relatório de Produto, Mercado, Concorrência, Preços e Melhorias**
*Gerado em maio de 2026*

---

## Sumário Executivo

O FechaPro é um SaaS brasileiro voltado a prestadores de serviço que vendem por proposta — designers, consultores, técnicos, agências, profissionais de saúde, beleza, eventos, reformas e autônomos em geral. A proposta central é substituir o orçamento simples enviado no WhatsApp por uma **estrutura comercial completa**: link profissional, PDF, rastreamento de comportamento do cliente, aceite online, pagamento integrado e artes de divulgação.

O produto está tecnicamente funcional e bem construído. O maior risco imediato não é de produto — é de configuração antes do lançamento. O maior gap estratégico é a ausência de automação pós-envio (follow-up, lembretes, relatórios), que reduziria o retorno real para o usuário final. A oportunidade de mercado é grande: mais de 25 milhões de autônomos no Brasil, a maioria ainda enviando orçamentos no WhatsApp sem nenhuma estrutura.

---

## 1. O Produto

### 1.1 Definição

FechaPro é um SaaS B2B com foco em pequenos negócios e profissionais autônomos brasileiros. Não é apenas um gerador de proposta — é uma ferramenta de **apresentação e fechamento comercial** que combina:

- Proposta profissional com link público e PDF
- Rastreamento de comportamento do cliente (visualizações, cliques, aceites)
- Pagamento integrado (Mercado Pago + PIX direto)
- Identidade visual da marca nas propostas
- Portfólio e depoimentos integrados ao fluxo de venda
- Artes de divulgação para Instagram e WhatsApp
- Templates por nicho (22 nichos cobertos)
- Pesquisa de satisfação pós-aceite
- Painel administrativo para o gestor da plataforma

**Stack:** Next.js 14 + React + TypeScript / Prisma + PostgreSQL / Tailwind CSS / PDFKit / Mercado Pago / Web Push / WhatsApp (Baileys + Cloud API) / OpenAI / Sharp / Docker.

---

### 1.2 Funcionalidades Implementadas

#### Propostas
- Criação com cliente, serviço, valor, prazo, validade, forma de pagamento, escopo e observações
- Link público único por proposta (`/p/[slug]`)
- PDF gerado no servidor (PDFKit)
- 7 status rastreados: rascunho, enviada, visualizada, aguardando resposta, aceita, recusada, expirada
- 6 tipos de documento: orçamento, proposta comercial, técnica, plano de cuidado, proposta de evento, automático
- Segmentos visuais: executivo, criativo, premium, técnico, casa/reforma, automotivo, beleza, saúde, eventos, digital, educação, gastronomia
- Edição, duplicação, reenvio e remoção
- Proposta com múltiplos serviços (soma automática)
- Auto-expiração por data de validade

#### Página pública do cliente
- Sem necessidade de cadastro para o cliente
- Portfólio, depoimentos, serviços e FAQ na mesma página
- Botão WhatsApp do profissional
- Download de PDF
- Aceite com nome e e-mail
- Recusa com motivo registrado
- Checkout Mercado Pago ou QR Code PIX direto

#### Rastreamento e alertas
- Contagem de visualizações e de cliques no WhatsApp por proposta
- E-mail automático ao profissional na primeira visualização
- Push notification via Web Push (visualização, aceite, recusa, pagamento)
- Notificação WhatsApp ao profissional (Baileys, webhook ou Cloud API)
- Timeline detalhada: views, cliques, e-mail de aceite, motivo de recusa, método e data de pagamento

#### Pagamentos
- Mercado Pago: PIX, cartão, boleto via checkout
- PIX direto: QR Code + código copia-e-cola com chave cadastrada
- Confirmação manual de PIX no painel do profissional com notificação ao cliente
- Webhook Mercado Pago com tratamento de propostas, assinaturas, signup e pacotes de arte
- Checkout de planos (assinatura recorrente)
- Checkout de créditos extras de artes

#### CRM básico
- Cadastro de clientes (nome, e-mail, telefone, segmento, serviço de interesse, status, notas)
- Cadastro de serviços com preço base, prazo e itens inclusos
- Portfólio com imagens e categorias
- Depoimentos de clientes
- Importação de clientes, serviços e depoimentos via CSV

#### Templates e marca
- 22 nichos com templates prontos
- Templates personalizados pelo usuário
- Logo com remoção automática de fundo (Sharp)
- Cores, WhatsApp, e-mail, Instagram, site, bio, chave PIX
- Textos de abertura, encerramento, termos e FAQ por empresa

#### Artes de divulgação
- Briefing guiado por objetivo (serviço, promoção, produto)
- Upload de referências visuais
- Geração via IA (OpenAI) com fallback manual
- Legenda e mensagem WhatsApp prontas
- Fluxo de aprovação e download
- Créditos mensais por plano + pacotes extras compráveis

#### Pesquisa de satisfação
- Envio automático após aceite de proposta
- Coleta de nota, NPS e depoimento
- Criação automática de depoimento com aprovação do cliente

#### Painel admin
- Gestão de usuários, planos e assinaturas
- Métricas de acesso e receita (diário, semanal, mensal, anual)
- Gestão de artes solicitadas (upload manual da arte final)
- Suporte via thread por usuário
- Criação de usuários sem checkout
- Propostas demo para demonstração comercial
- Conexão WhatsApp via QR Code (Baileys)

#### Segurança e infraestrutura
- Auth com sessão JWT (NextAuth)
- Recuperação e redefinição de senha
- Rate limiting
- Cloudflare Turnstile (anti-bot em formulários públicos)
- Sentry (observabilidade)
- Healthcheck (`/api/health`)
- S3/R2 compatível para storage em produção
- Docker Compose para desenvolvimento e produção

---

## 2. Análise de Mercado

### 2.1 Tamanho do mercado

O Brasil tem hoje mais de **25,7 milhões de trabalhadores autônomos** (IBGE, 2025) e mais de **15 milhões de MEIs** cadastrados. A maioria desses profissionais usa o WhatsApp como principal canal de vendas e vende por orçamento — muitas vezes uma mensagem de texto ou, no máximo, uma foto de uma tabela.

**Setores mais relevantes para o FechaPro:**

| Setor | Características |
|---|---|
| Designers e agências | Alta necessidade de proposta formal, acostumados a ferramentas digitais |
| Consultores e coaches | Proposta de alto valor, precisam de documento profissional |
| Técnicos e reformas | Volume alto de orçamentos, mas processo completamente informal |
| Saúde (nutrição, psicologia, odontologia) | Proposta chamada de "plano" — nicho específico coberto pelo FechaPro |
| Eventos | Orçamento complexo com múltiplos serviços |
| Marketing digital e social media | Alta demanda de proposta mensal/recorrente |
| Estética e beleza | WhatsApp-first, precisam de profissionalismo |

**Estimativa de TAM (Total Addressable Market):**
Considerando apenas profissionais que fazem vendas por proposta (excluindo quem vende produto físico ou por demanda imediata), estima-se um universo de **5 a 8 milhões de potenciais usuários** no Brasil. Se apenas 1% converter em assinante pagante ao longo de 3 anos, isso representa 50–80 mil usuários.

**A 80% no plano Start (R$ 97/mês), isso seria R$ 3,9M–6,2M de ARR apenas nessa fatia.**

### 2.2 Comportamento do público-alvo

- Usa WhatsApp para quase tudo: atendimento, envio de orçamento, cobrança
- Tem resistência a ferramentas complexas
- Prioriza o que economiza tempo ou aumenta a taxa de fechamento
- Reagrupa ao argumento de autoridade visual ("parecer mais profissional")
- Precisa de onboarding rápido — se não usar em 7 dias, abandona
- Sensível a preço, mas paga bem quando enxerga ROI direto

---

## 3. Análise de Concorrentes

### 3.1 Mapa competitivo

| Ferramenta | Origem | Preço | Proposta | PIX/Pag. BR | Templates PT-BR | Artes | Follow-up | Assinatura digital |
|---|---|---|---|---|---|---|---|---|
| **FechaPro** | Brasil | R$ 97–1.500/ano | Sim | **Sim (MP + PIX)** | **22 nichos** | **Sim** | Manual | Não |
| **Propoz** | Brasil | R$ 0–29/mês | Sim | Não | Básico | Não | Não | Sim |
| **Proposeful** | Brasil | R$ 150/mês | Sim | Não | Sim | Não | Não | **Sim (jurídica)** |
| **PandaDoc** | EUA | $19–49/mês | Sim | Não | Em inglês | Não | Sim | Sim |
| **Better Proposals** | EUA | $19–49/mês | Sim | Não | Em inglês | Não | Limitado | Sim |
| **Proposify** | EUA | $49/mês+ | Sim | Não | Em inglês | Não | Sim | Sim |
| **Qwilr** | Austrália | $39–59/usuário | Sim | Não | Em inglês | Não | Limitado | Sim |
| **Prospero** | EUA | $10–$19/mês | Sim | Não | Limitado | Não | Não | Não |

### 3.2 Análise detalhada dos principais concorrentes

#### Propoz (propoz.com.br) — Concorrente direto nacional
- **Pontos fortes:** plano gratuito com até 3 orçamentos, IA que sugere faixas de preço, assinatura digital, preço agressivo (R$ 29/mês)
- **Pontos fracos:** sem pagamento integrado, sem artes de divulgação, sem portfólio/depoimentos, sem notificação WhatsApp, sem templates por nicho robustos
- **Posicionamento:** foca no freelancer que quer apenas um orçamento mais bonito
- **Ameaça:** plano gratuito pode atrair quem está no Start do FechaPro; preço muito menor no Pro

#### Proposeful (proposeful.com) — Concorrente nacional
- **Pontos fortes:** assinatura digital com validade jurídica, templates por segmento, interface mais limpa
- **Pontos fracos:** R$ 150/mês é caro para autônomo, sem pagamento integrado, sem artes, sem notificações WhatsApp, não resolve o problema do PIX
- **Posicionamento:** foca em agências e consultorias maiores, não no autônomo individual
- **Ameaça:** menor — segmento diferente

#### PandaDoc, Better Proposals, Proposify, Qwilr — Concorrentes internacionais
- **Pontos fortes:** assinatura digital, templates avançados, integrações (CRM, Slack, Salesforce), colaboração em equipe
- **Pontos fracos críticos para o Brasil:** cobrança em dólar, sem suporte a PIX, sem WhatsApp, sem templates em português, sem adaptação ao mercado local
- **Posicionamento:** voltados para empresas com equipe de vendas, não para o autônomo
- **Ameaça:** praticamente nenhuma para o público-alvo do FechaPro

### 3.3 Vantagens competitivas do FechaPro

1. **Único com PIX direto integrado** no link da proposta — diferencial absoluto para o mercado brasileiro
2. **Único com artes de divulgação** incluídas no plano — nenhum concorrente faz isso
3. **22 nichos de templates em português** — muito acima de qualquer concorrente nacional
4. **Notificação WhatsApp ao profissional** — fecha o ciclo de rastreamento no canal que o usuário já usa
5. **Onboarding completo incluído no plano maior** — reduz fricção de ativação
6. **Pesquisa de satisfação pós-aceite** que converte em depoimento — funcionalidade exclusiva

### 3.4 Vulnerabilidades competitivas

1. **Sem assinatura digital com validade jurídica** — Proposeful e Propoz têm; para contratos acima de R$ 2.000, isso é um bloqueador
2. **Propoz é muito mais barato** (R$ 29 vs. R$ 97) para o profissional que quer apenas orçamento
3. **Sem plano gratuito ou trial** — Propoz tem freemium; isso aumenta a barreira de entrada

---

## 4. Benefícios do Produto

### Para o profissional que usa o FechaPro

| Benefício | Como entrega |
|---|---|
| Para de depender de mensagens soltas | Link profissional completo substitui a mensagem de texto |
| Sabe o momento certo de dar follow-up | Rastreamento de visualização + clique WhatsApp |
| Recebe pagamento sem sair da proposta | Mercado Pago ou PIX direto integrado |
| Ganha autoridade visual | Logo, cores e segmento visual na proposta |
| Cria proposta mais rápido | Templates, serviços e clientes cadastrados |
| Prova social no fluxo de venda | Portfólio e depoimentos na mesma página da proposta |
| Divulga serviços com material pronto | Artes para Instagram e status do WhatsApp |
| Centraliza tudo em um lugar | Proposta + pagamento + suporte + plano no mesmo painel |
| Recebe alerta imediato de movimentação | Push e WhatsApp quando cliente abre, aceita ou paga |

### Para o cliente do profissional

| Benefício | Como entrega |
|---|---|
| Entende o que está comprando | Escopo, prazo, itens inclusos e observações claros |
| Confia mais no profissional | Marca, portfólio, depoimentos e documento profissional |
| Facilidade de aceitar ou recusar | Aceite ou recusa pelo próprio link, sem app |
| Paga pelo link | Mercado Pago ou PIX sem precisar de contato extra |
| Tem comprovante | PDF da proposta aceita disponível para download |

---

## 5. Problemas e Pontos Fracos

### 5.1 Críticos — bloqueadores de lançamento

| Problema | Risco | Ação necessária |
|---|---|---|
| OPENAI_API_KEY exposta no repositório | Cobrança inesperada, uso indevido | Revogar chave em platform.openai.com e gerar nova imediatamente |
| Schema Prisma não sincronizado com banco | Erros em runtime para usuários reais | Rodar `npm run db:push` antes de abrir para novos cadastros |
| RESEND_API_KEY + EMAIL_FROM não configurados | Todos os emails de aceite/recusa/visualização/PIX não são enviados | Configurar variáveis e testar envio antes do lançamento |

### 5.2 Funcionais — impactam adoção e retenção

| Problema | Impacto |
|---|---|
| PIX sem verificação automática | Profissional pode esquecer de confirmar; cliente fica sem notificação |
| Follow-up 100% manual | Usuário menos engajado perde negócios por falta de lembrete |
| Artes geradas manualmente pelo admin | Gargalo de escala; não funciona com muitos usuários simultâneos |
| Sem assinatura digital com validade jurídica | Bloqueador para contratos acima de ~R$ 2.000 |
| Sem parcelamento no checkout de proposta | Limita uso em serviços de alto valor |
| Sem histórico unificado por cliente | Usuário não consegue ver todas as propostas de um mesmo cliente |
| Limites baixos no Start (20 propostas/mês) | Profissional com volume médio atinge o limite rapidamente e pode fazer downgrade |

### 5.3 Técnicos — dívida que cresce com o tempo

| Problema | Impacto |
|---|---|
| Baileys como provedor padrão de WhatsApp | Usa engenharia reversa; risco de ban, instável em produção |
| Planos internos (`plus`, `premium`) com `public: false` | Confusão de suporte; usuários com planos diferentes recebem features diferentes sem documentação |
| Sem suíte de testes automatizados | Regressões silenciosas a cada feature nova |
| Storage local por padrão | Uploads se perdem em deploy sem volume persistente (Vercel, Railway sem disco) |
| Sem rate limiting granular por endpoint | Endpoints como aceite e webhook de pagamento sem proteção específica |

### 5.4 De produto — gaps que reduzem o valor percebido

| Gap | Impacto |
|---|---|
| Sem follow-up automático | Usuário precisa se lembrar de acompanhar manualmente |
| Sem proposta com múltiplas opções de preço | Técnica de âncora de preço (Essencial / Padrão / Completo) não está disponível |
| Sem relatório mensal automático | Usuário não sabe quanto fechou nem qual a taxa de conversão |
| Sem app mobile instalável (PWA) | Público-alvo vive no celular; a experiência mobile não está otimizada |
| Sem integração com Google Calendar | Pós-aceite fica sem estrutura de agenda |
| Sem QR Code da proposta para reunião presencial | Perda de oportunidade no atendimento físico |
| Sem proposta recorrente | Serviços mensais precisam de nova proposta a cada ciclo |

---

## 6. Análise de Preços

### 6.1 Comparação com o mercado

| Produto | Preço mínimo pago | Proposta | Pagamento BR | Artes | Nicho |
|---|---|---|---|---|---|
| **FechaPro Start** | **R$ 97/mês** | Sim | Sim | 5/mês | Sim |
| Propoz Pro | R$ 29/mês | Sim | Não | Não | Básico |
| Proposeful | R$ 150/mês | Sim | Não | Não | Sim |
| PandaDoc Essential | ~R$ 95/mês (USD) | Sim | Não | Não | Em inglês |
| Better Proposals | ~R$ 95/mês (USD) | Sim | Não | Não | Em inglês |

**Observação:** o FechaPro Start está bem posicionado frente às ferramentas internacionais, mas caro frente ao Propoz para o profissional que quer apenas um orçamento mais bonito.

### 6.2 Problemas com a estrutura atual

**Problema 1 — Barreira de entrada sem freemium ou trial**
O FechaPro exige pagamento antes de qualquer uso. O Propoz tem plano gratuito com 3 orçamentos ativos. Profissionais que ainda não conhecem o produto preferem testar antes de pagar.

**Problema 2 — Start com 20 propostas/mês é muito restritivo**
Um profissional de serviço médio pode enviar 20–40 propostas por mês. Ao atingir o limite, ele precisa pagar R$ 197/mês (Pro) — salto de 103%. Esse gap cria churn.

**Problema 3 — Pro sem assinatura digital é difícil de justificar para contratos maiores**
O Pro (R$ 197/mês) não inclui assinatura digital. O Proposeful, a R$ 150/mês, já inclui. Para o profissional que precisa de documento com força legal, o FechaPro perde.

**Problema 4 — Nomenclatura confusa dos planos internos**
Existem 5 planos no sistema (`start`, `pro`, `plus`, `premium`, `premium_site`), mas apenas 3 são públicos. Os planos `plus` e `premium` existem no banco e podem ser atribuídos a usuários, mas não têm documentação pública. Isso cria confusão de suporte.

**Problema 5 — O plano Start anual (R$ 897) não tem desconto suficiente**
R$ 897/ano vs. R$ 97/mês = 12 meses = R$ 1.164. O desconto é de R$ 267 (23%). Planos anuais bem sucedidos costumam oferecer 2 meses grátis (16,7%) ou mais. R$ 897 está próximo de "2 meses grátis", mas poderia ser formatado melhor.

### 6.3 Recomendação de revisão de preços

#### Proposta de nova estrutura

| Plano | Preço Atual | Preço Recomendado | Mudança |
|---|---|---|---|
| **Gratuito (novo)** | — | R$ 0 (3 propostas/mês, sem PDF, sem pagamento) | Novo — reduz barreira |
| **Start** | R$ 97/mês | R$ 79/mês (anual: R$ 758/ano) | Reduz para competir com Propoz; foco em conversão |
| **Pro** | R$ 197/mês | R$ 167/mês (anual: R$ 1.600/ano) | Leve redução; foco em retenção |
| **Estrutura Completa** | R$ 1.500/ano | Manter R$ 1.500/ano (12x R$ 147) | Ajustar apenas a parcela |

#### Justificativas

**Plano Gratuito:**
O Propoz já tem e isso funciona como funil. O gratuito do FechaPro deve ser *deliberadamente limitado*: máximo 3 propostas ativas, sem PDF, sem artes, sem pagamento integrado. O objetivo não é ser gratuito — é fazer o profissional experimentar e enxergar o valor antes de pagar.

**Ajuste do Start:**
R$ 79/mês ainda é 2,7x mais caro que o Propoz, mas entrega muito mais (pagamento, artes, templates, notificações). O argumento se sustenta. A queda de R$ 97 para R$ 79 reduz a objeção inicial e aumenta a conversão do trial para pago.

**Manter o Pro em ~R$ 167:**
O Pro entrega valor real (rastreamento avançado, portfólio, depoimentos, mais propostas). O ajuste para R$ 167 é apenas para arredondar e melhorar o posicionamento frente ao Proposeful (R$ 150 com assinatura jurídica — precisa ter diferencial claro de entrega).

**Aumentar o limite de propostas no Start:**
De 20 para **50 propostas/mês**. Isso alinha melhor ao uso real e evita que o usuário atinja o teto antes de ver o valor total do produto.

#### Nova tabela de limites sugerida

| Plano | Propostas/mês | Artes/mês | PDF | Pagamento | Portfólio | Depoimentos | Assinatura digital |
|---|---|---|---|---|---|---|---|
| Gratuito | 3 | 0 | Não | Não | Não | Não | Não |
| Start (R$ 79) | 50 | 5 | Sim | Sim | Básico | Não | Não |
| Pro (R$ 167) | 200 | 15 | Sim | Sim | Completo | Sim | **Sim (meta)** |
| Estrutura Completa | 600 | 20 | Sim | Sim | Completo | Sim | Sim |

---

## 7. Melhorias Prioritárias

### Prioridade 1 — Críticas para lançamento (fazer antes de abrir)

1. **Revogar e substituir OPENAI_API_KEY**
   Risco de segurança real. Revogar imediatamente em platform.openai.com, gerar nova e atualizar `.env`.

2. **Rodar `npm run db:push`**
   Schema pode estar desatualizado. Deve ser executado e validado antes de receber novos cadastros.

3. **Configurar e testar envio de e-mails (Resend ou SMTP)**
   Todas as notificações por e-mail dependem disso. Testar o fluxo completo: visualização, aceite, recusa, confirmação de PIX.

4. **Definir e documentar os planos legados (`plus`, `premium`)**
   Ou remover do código e banco, ou documentar claramente quando e como são usados.

5. **Configurar storage externo (S3/R2)**
   Para qualquer ambiente de produção sem volume persistente, uploads locais vão se perder.

### Prioridade 2 — Alto impacto em adoção (mês 1–2)

6. **Plano gratuito com trial de 7 dias ou 3 propostas**
   Remove a principal objeção de "quero testar antes de pagar". Reduz CAC e aumenta conversão.

7. **Follow-up automático configurável**
   O profissional define "lembrar-me X dias após envio sem visualização". O sistema dispara notificação push + e-mail. Isso resolve o principal gap funcional vs. usar o WhatsApp puro.

8. **Proposta com múltiplas opções de preço (Essencial / Padrão / Completo)**
   Técnica comprovada de âncora que aumenta ticket médio. Cada opção com seus itens e preços; o cliente escolhe no link público.

9. **Assinatura digital com validade jurídica**
   Integrar D4Sign, Autentique ou Clicksign. Pode ser funcionalidade do plano Pro para cima. Remove o principal argumento do Proposeful.

### Prioridade 3 — Retenção e LTV (mês 3–4)

10. **Relatório mensal automático por e-mail**
    Resumo: propostas enviadas, aceitas, valor total fechado, taxa de conversão, comparativo com mês anterior. Faz o usuário lembrar do valor que o FechaPro gerou, reduzindo churn.

11. **CRM com histórico unificado do cliente**
    Na tela de clientes, mostrar todas as propostas enviadas para aquele contato, valor total e histórico de relacionamento.

12. **Parcelamento no checkout de proposta (até 12x no Mercado Pago)**
    Abre o FechaPro para serviços de maior valor (R$ 3.000+) onde o cliente precisa parcelar.

13. **QR Code da proposta para impressão**
    O profissional pode imprimir ou mostrar em reunião presencial. Custo de desenvolvimento mínimo, valor alto em setores como reforma, estética e eventos.

14. **Painel de artes com geração automática por IA**
    Substituir o fluxo manual (admin faz upload) por geração automática com IA de imagem. Isso é o principal gargalo de escala do módulo de artes.

### Prioridade 4 — Expansão de mercado (mês 5–6)

15. **PWA instalável com push nativo mobile**
    O público-alvo vive no celular. Instalação como app pelo Chrome no Android melhora drasticamente a retenção.

16. **Integração com Google Calendar pós-aceite**
    Ao cliente aceitar, criar evento no Google Calendar do profissional com os dados do projeto.

17. **Proposta recorrente com cobrança automática**
    Para serviços mensais (social media, manutenção, consultoria). Proposta criada uma vez, cobrança automática via assinatura Mercado Pago.

18. **Envio direto de proposta via WhatsApp Business API**
    Ao clicar "Enviar proposta", o sistema já manda o link para o WhatsApp do cliente cadastrado, sem precisar copiar e colar.

---

## 8. Análise SWOT

### Forças (Strengths)
- Único com PIX direto integrado na proposta
- Único com artes de divulgação incluídas
- 22 nichos de templates em português
- Notificação WhatsApp ao profissional — fecha o ciclo no canal nativo
- Pesquisa de satisfação que gera depoimento automaticamente
- Onboarding assistido no plano maior reduz churn inicial
- Produto completo: proposta + pagamento + marca + divulgação no mesmo sistema

### Fraquezas (Weaknesses)
- Sem plano gratuito ou trial livre (barreira de entrada alta)
- Sem assinatura digital com validade jurídica
- Geração de artes ainda é manual pelo admin (não escala)
- Follow-up 100% manual
- Sem suíte de testes automatizados
- Baileys (WhatsApp não oficial) como provedor padrão

### Oportunidades (Opportunities)
- 25 milhões de autônomos brasileiros sem estrutura de proposta
- Crescimento de MEIs e PJs acelerado nos últimos 3 anos
- Demanda por profissionalização do atendimento no WhatsApp
- Nenhum concorrente nacional resolve PIX + proposta + artes em conjunto
- Segmentos como saúde e odontologia ainda pouco atendidos por ferramentas digitais de proposta

### Ameaças (Threats)
- Propoz pode adicionar pagamento e artes (com preço muito menor)
- Proposeful pode adicionar pagamento BR e lowerar preço
- Nuvemshop avançando em checkout via WhatsApp (diferente, mas compete atenção)
- PandaDoc pode localizar para o Brasil com preço agressivo
- Plataformas de gestão de serviço (Trello, Notion, Monday) adicionando módulos de proposta

---

## 9. Posicionamento e Mensagem Comercial

### Mensagem central recomendada

> "Pare de enviar orçamento no WhatsApp. Comece a fechar com mais autoridade."

### Como apresentar os planos

**Start — para quem está começando:**
> "R$ 79/mês. Proposta profissional com link, PDF, aceite online e pagamento por PIX ou Mercado Pago. Você para de vender por mensagem."

**Pro — para quem quer vender com mais inteligência:**
> "R$ 167/mês. Além de tudo do Start, você sabe quem abriu, quem clicou, portfólio, depoimentos e assinatura digital no contrato."

**Estrutura Comercial Completa — para quem quer sair com tudo pronto:**
> "R$ 1.500/ano. Inclui 12 meses de FechaPro, mini site profissional, diagnóstico do Instagram, artes iniciais, configuração e treinamento. Você entra com a estrutura completa."

### Resposta para objeção de preço

> "Se fosse só um sistema de orçamento, R$ 79 poderia parecer caro. Mas aqui você recebe: proposta profissional com link e PDF, pagamento integrado (PIX + Mercado Pago), rastreamento de quem abriu, portfólio e depoimentos no link, e artes prontas para divulgar. É a estrutura comercial do profissional que cobra mais porque parece mais."

---

## 10. Roadmap Revisado e Priorizado

### Fase 0 — Antes do lançamento (urgente)
- [ ] Revogar OPENAI_API_KEY e gerar nova
- [ ] Rodar `npm run db:push`
- [ ] Configurar Resend + EMAIL_FROM + APP_URL e testar todos os e-mails
- [ ] Configurar storage externo (S3/R2)
- [ ] Documentar ou remover planos legados (`plus`, `premium`)
- [ ] Substituir Baileys por WhatsApp Cloud API em produção

### Fase 1 — Adoção (mês 1–2)
- [ ] Trial gratuito de 7 dias ou plano freemium (3 propostas)
- [ ] Follow-up automático configurável por proposta
- [ ] Proposta com múltiplas opções de preço
- [ ] Assinatura digital (D4Sign ou Autentique)

### Fase 2 — Retenção (mês 3–4)
- [ ] Relatório mensal automático por e-mail
- [ ] CRM com histórico unificado do cliente
- [ ] Parcelamento no checkout de proposta
- [ ] QR Code da proposta para impressão
- [ ] Geração automática de artes por IA de imagem

### Fase 3 — Expansão (mês 5–6)
- [ ] PWA instalável com push nativo mobile
- [ ] Integração com Google Calendar
- [ ] Proposta recorrente com cobrança automática
- [ ] Envio direto via WhatsApp Business API
- [ ] Página de proposta com layouts alternativos

---

## 11. Resumo Executivo Final

**O FechaPro tem produto funcional, diferencial real e mercado grande.** O núcleo está implementado: proposta → link → aceite → pagamento → rastreamento. A experiência do cliente final é completa sem exigir cadastro. O diferencial de PIX direto integrado + artes de divulgação não existe em nenhum concorrente identificado.

**Os três riscos imediatos são de configuração, não de produto:** chave da OpenAI exposta, schema desatualizado e e-mails sem configurar. Esses três itens precisam estar resolvidos antes de qualquer usuário real.

**O maior gap estratégico é o topo do funil:** sem trial ou plano gratuito, a taxa de conversão de visitante para pagante é baixa. Adicionar 7 dias gratuitos ou um freemium limitado pode dobrar a conversão em curto prazo.

**O segundo gap maior é a automação pós-envio:** o FechaPro captura todos os sinais certos (visualização, clique, aceite), mas não age sobre eles. Follow-up automático configurável é a feature com maior potencial de reduzir churn e aumentar o NPS, porque entrega resultado concreto (mais fechamentos) sem depender de disciplina do usuário.

**O produto está pronto para lançar. Faltam configuração, trial e follow-up automático para lançar bem.**

---

*Relatório gerado com base em análise do código-fonte, schema do banco de dados, manual do usuário, planos configurados, roadmap documentado e pesquisa de mercado comparativa com Propoz, Proposeful, PandaDoc, Better Proposals, Proposify, Qwilr e Prospero.*

*Fontes de mercado: IBGE (trabalhadores autônomos 2025), Agência Brasil (dados MEI), Propoz.com.br, Proposeful.com, Provelo.com.br, Leadster.com.br.*

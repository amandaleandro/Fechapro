# Análise Completa — FechaPro
**Relatório de Produto, Mercado, Concorrência, Preços, Go-to-Market e Negócio**
*Atualizado em maio de 2026*

---

## Sumário Executivo

O FechaPro é um SaaS brasileiro voltado a prestadores de serviço que vendem por proposta — designers, consultores, técnicos, agências, profissionais de saúde, beleza, eventos, reformas e autônomos em geral. A proposta central é substituir o orçamento simples enviado no WhatsApp por uma **estrutura comercial completa**: link profissional, PDF, rastreamento de comportamento do cliente, aceite online, pagamento integrado e artes de divulgação.

O produto está tecnicamente funcional e bem construído. O maior risco imediato não é de produto — é de configuração antes do lançamento. O maior gap estratégico é a ausência de automação pós-envio (follow-up, lembretes, relatórios), que reduziria o retorno real para o usuário final. A oportunidade de mercado é grande: mais de 25 milhões de autônomos no Brasil, a maioria ainda enviando orçamentos no WhatsApp sem nenhuma estrutura.

**O produto está pronto para lançar. Faltam cinco coisas para lançar bem:**
1. Configuração de ambiente (e-mail, storage, WhatsApp API)
2. Trial gratuito ou freemium para reduzir barreira de entrada
3. Follow-up automático para entregar resultado concreto
4. Canal de aquisição definido com nicho prioritário
5. Documentação jurídica e LGPD publicadas

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

**Estimativa de mercado endereçável:**

| Camada | Definição | Estimativa |
|---|---|---|
| TAM | Autônomos que vendem por proposta no Brasil | 5–8 milhões |
| SAM | Com acesso a smartphone e dispostos a pagar por ferramenta digital | 800 mil–1,5 milhão |
| SOM | Alcançável nos primeiros 24 meses com os canais disponíveis | 5–15 mil usuários |

**A 80% no plano Start (R$ 97/mês), 5 mil usuários pagantes = R$ 4,7M de ARR.**

### 2.2 Comportamento do público-alvo

- Usa WhatsApp para quase tudo: atendimento, envio de orçamento, cobrança
- Tem resistência a ferramentas complexas
- Prioriza o que economiza tempo ou aumenta a taxa de fechamento
- Responde ao argumento de autoridade visual ("parecer mais profissional")
- Precisa de onboarding rápido — se não usar em 7 dias, abandona
- Sensível a preço, mas paga bem quando enxerga ROI direto
- Descobre ferramentas principalmente por indicação e redes sociais (Instagram, YouTube, grupos de WhatsApp)
- Não pesquisa ativamente por "software de proposta" — pesquisa por soluções ao problema ("como fazer orçamento profissional")

---

## 3. Análise de Concorrentes

### 3.1 Mapa competitivo completo

| Ferramenta | Origem | Preço | Proposta | PIX/Pag. BR | Templates PT-BR | Artes | Follow-up | Assinatura digital |
|---|---|---|---|---|---|---|---|---|
| **FechaPro** | Brasil | R$ 97–1.500/ano | Sim | **Sim (MP + PIX)** | **22 nichos** | **Sim** | Manual | Não |
| **Orca App** | Brasil | Não divulgado | Sim | Parcial | Sim | Não | Não | Não |
| **Propoz** | Brasil | R$ 0–29/mês | Sim | Não | Básico | Não | Não | Sim |
| **Proposeful** | Brasil | R$ 150/mês | Sim | Não | Sim | Não | Não | **Sim (jurídica)** |
| **Provelo** | Brasil | Sob demanda | Sim | Não | Sim | Não | Parcial | Sim |
| **ContaAzul** | Brasil | R$ 99/mês+ | Parcial (ERP) | **Sim (PIX)** | Sim | Não | Não | Não |
| **Bonsai** | EUA | USD 21/mês | Sim | Não | Em inglês | Não | Sim | Sim |
| **HoneyBook** | EUA | USD 19/mês | Sim | Não | Em inglês | Não | Sim | Sim |
| **PandaDoc** | EUA | USD 19–49/mês | Sim | Não | Em inglês | Não | Sim | Sim |
| **Better Proposals** | EUA | USD 19–49/mês | Sim | Não | Em inglês | Não | Limitado | Sim |
| **Proposify** | EUA | USD 49/mês+ | Sim | Não | Em inglês | Não | Sim | Sim |
| **Qwilr** | Austrália | USD 39–59/usuário | Sim | Não | Em inglês | Não | Limitado | Sim |
| **Prospero** | EUA | USD 10–19/mês | Sim | Não | Limitado | Não | Não | Não |

### 3.2 Análise detalhada dos concorrentes

#### Orca App (orcaapp.com.br) — Concorrente nacional direto não mapeado inicialmente
- **Pontos fortes:** proposta + PDF + envio via WhatsApp + CRM integrado, focado em autônomos e empreendedores, acelerado pelo InovAtiva Brasil 2023
- **Pontos fracos:** sem pagamento integrado para o cliente final dentro da proposta, sem artes de divulgação, preço não público (dificulta comparação)
- **Posicionamento:** muito similar ao FechaPro no público, mas sem o diferencial de PIX + Mercado Pago na proposta
- **Ameaça:** ALTA — é o concorrente nacional que mais se aproxima do FechaPro e não estava no mapa. Monitorar ativamente se adicionará pagamento integrado.

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

#### Provelo (provelo.com.br) — Concorrente nacional B2B
- **Pontos fortes:** rastreamento de engajamento avançado (tempo de leitura, rolagem por seção), aceite em um clique, assinatura digital
- **Pontos fracos:** sem pagamento integrado ao cliente final, sem artes, foco em vendas consultivas B2B, não serve bem o autônomo individual
- **Posicionamento:** empresas com equipe de vendas, não autônomos
- **Ameaça:** baixa para o público-alvo atual do FechaPro

#### ContaAzul — Concorrente indireto relevante
- **Pontos fortes:** ERP completo com módulo de proposta, PIX cobrança nativo, integração contábil, base grande de usuários MEI
- **Pontos fracos:** ERP é pesado e caro para autônomo que quer só proposta, módulo de proposta é secundário no produto
- **Posicionamento:** ERP para pequenas empresas — não concorre diretamente, mas ocupa espaço cognitivo
- **Ameaça:** média — quem já usa ContaAzul não contratará outro sistema só para proposta

#### Bonsai (hellobonsai.com) e HoneyBook (honeybook.com) — Referências internacionais
- **Por que importam:** são os benchmarks mais próximos da proposta de valor do FechaPro no mercado global — suite completa para freelancers (proposta + contrato + invoice + pagamento)
- **Pontos fortes:** proposta + contrato com validade jurídica + pagamento em um fluxo único, UX polida, forte no mercado americano
- **Limitação para Brasil:** sem PIX, sem Mercado Pago, sem português, sem templates por nicho BR — completamente fora do alcance do público-alvo do FechaPro
- **Uso estratégico:** referência de produto para onde o FechaPro pode evoluir (contrato + invoice + agenda integrados)

#### PandaDoc, Better Proposals, Proposify, Qwilr — Concorrentes internacionais enterprise
- **Pontos fortes:** assinatura digital, templates avançados, integrações (CRM, Slack, Salesforce), colaboração em equipe
- **Pontos fracos críticos para o Brasil:** cobrança em dólar, sem PIX, sem WhatsApp, sem templates em português, sem adaptação ao mercado local
- **Ameaça:** praticamente nenhuma para o público-alvo do FechaPro

### 3.3 Vantagens competitivas do FechaPro

1. **Único com PIX direto integrado** no link da proposta — diferencial absoluto para o mercado brasileiro
2. **Único com artes de divulgação** incluídas no plano — nenhum concorrente faz isso
3. **22 nichos de templates em português** — muito acima de qualquer concorrente nacional
4. **Notificação WhatsApp ao profissional** — fecha o ciclo de rastreamento no canal que o usuário já usa
5. **Onboarding completo incluído no plano maior** — reduz fricção de ativação
6. **Pesquisa de satisfação pós-aceite** que converte em depoimento — funcionalidade exclusiva

### 3.4 Vulnerabilidades competitivas

1. **Sem assinatura digital com validade jurídica** — Proposeful, Propoz e Provelo têm; para contratos acima de R$ 2.000, isso é um bloqueador
2. **Propoz é muito mais barato** (R$ 29 vs. R$ 97) para o profissional que quer apenas orçamento
3. **Sem plano gratuito ou trial** — Propoz tem freemium; isso aumenta a barreira de entrada
4. **Orca App como concorrente não mapeado** — produto muito similar, precisa monitoramento ativo

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
| RESEND_API_KEY + EMAIL_FROM não configurados | Todos os e-mails de aceite/recusa/visualização/PIX não são enviados | Configurar variáveis e testar envio antes do lançamento |
| Sem política de privacidade e termos de uso publicados | Risco jurídico e LGPD, impede confiança do usuário | Publicar documentos antes do lançamento público |

### 5.2 Funcionais — impactam adoção e retenção

| Problema | Impacto |
|---|---|
| PIX sem verificação automática | Profissional pode esquecer de confirmar; cliente fica sem notificação |
| Follow-up 100% manual | Usuário menos engajado perde negócios por falta de lembrete |
| Artes geradas manualmente pelo admin | Gargalo de escala; não funciona com muitos usuários simultâneos |
| Sem assinatura digital com validade jurídica | Bloqueador para contratos acima de ~R$ 2.000 |
| Sem parcelamento no checkout de proposta | Limita uso em serviços de alto valor |
| Sem histórico unificado por cliente | Usuário não consegue ver todas as propostas de um mesmo cliente |
| Limites baixos no Start (20 propostas/mês) | Profissional com volume médio atinge o limite rapidamente |

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
| Orca App | Não divulgado | Sim | Não confirmado | Não | Sim |
| Propoz Pro | R$ 29/mês | Sim | Não | Não | Básico |
| Proposeful | R$ 150/mês | Sim | Não | Não | Sim |
| Bonsai Starter | ~R$ 115/mês (USD) | Sim | Não | Não | Em inglês |
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
R$ 897/ano vs. R$ 97/mês = 12 meses = R$ 1.164. O desconto é de R$ 267 (23%). Planos anuais bem sucedidos costumam oferecer 2 meses grátis ou mais.

### 6.3 Recomendação de revisão de preços

| Plano | Preço Atual | Preço Recomendado | Mudança |
|---|---|---|---|
| **Gratuito (novo)** | — | R$ 0 (3 propostas/mês, sem PDF, sem pagamento) | Novo — reduz barreira |
| **Start** | R$ 97/mês | R$ 79/mês (anual: R$ 758/ano) | Reduz para competir com Propoz; foco em conversão |
| **Pro** | R$ 197/mês | R$ 167/mês (anual: R$ 1.600/ano) | Leve redução; foco em retenção |
| **Estrutura Completa** | R$ 1.500/ano | Manter R$ 1.500/ano (12x R$ 147) | Ajustar apenas a parcela |

#### Nova tabela de limites sugerida

| Plano | Propostas/mês | Artes/mês | PDF | Pagamento | Portfólio | Depoimentos | Assinatura digital |
|---|---|---|---|---|---|---|---|
| Gratuito | 3 | 0 | Não | Não | Não | Não | Não |
| Start (R$ 79) | 50 | 5 | Sim | Sim | Básico | Não | Não |
| Pro (R$ 167) | 200 | 15 | Sim | Sim | Completo | Sim | **Sim (meta)** |
| Estrutura Completa | 600 | 20 | Sim | Sim | Completo | Sim | Sim |

---

## 7. Unit Economics

### 7.1 Estimativas de referência

Esses números são estimativas baseadas em benchmarks de SaaS B2B SMB brasileiro. Precisam ser validados com dados reais após os primeiros 60–90 dias de operação.

| Métrica | Estimativa inicial | Referência saudável (SaaS SMB) |
|---|---|---|
| Churn mensal | 5–8% | < 5% |
| Lifetime médio (a 6% churn) | ~17 meses | > 24 meses |
| LTV médio (Start R$ 97) | R$ 1.650 | — |
| LTV médio (Pro R$ 197) | R$ 3.350 | — |
| CAC estimado (digital orgânico) | R$ 80–200 | < 1/3 do LTV |
| CAC estimado (pago — Meta/Google) | R$ 200–500 | < 1/3 do LTV |
| Payback period (orgânico, Start) | 1–2 meses | < 12 meses |
| MRR para break-even operacional | ~R$ 8.000–15.000 | — |
| Usuários para break-even | 85–155 usuários pagantes (Start) | — |

### 7.2 O que o churn vai depender

O maior risco financeiro do FechaPro não é aquisição — é retenção. Um SaaS com churn de 10%/mês perde metade da base em 7 meses. Os drivers de churn esperados:

- **Usuário não envia a primeira proposta em 7 dias** — abandona sem ver valor
- **Usuário atinge limite de propostas e não vê custo-benefício para upgrade** — cancela
- **Usuário não recebe retorno claro dos clientes** — acha que o problema é a ferramenta
- **Sazonalidade** — autônomos com períodos de baixa movimento (janeiro, por exemplo)

### 7.3 Caminhos para aumentar LTV

1. **Annual upfront** — usuário anual tem churn zero por 12 meses; oferecer desconto de 2 meses grátis para converter
2. **Upsell de artes** — pacotes extras de créditos geram receita adicional sem novo ciclo de venda
3. **Upsell de plano** — usuário que cresce volume de propostas faz upgrade natural
4. **Assinatura digital como driver de Pro** — quando implementada, aumenta o ticket médio do Pro

---

## 8. Momento de Ativação e Onboarding

### 8.1 O "momento aha" do FechaPro

O FechaPro tem um aha moment claro e mensurável:

> **"O cliente abriu o link da proposta."**

Esse é o momento em que o profissional entende, de forma concreta, que o FechaPro faz algo que o WhatsApp não faz — ele sabe exatamente quando o cliente viu a proposta, sem precisar perguntar. A partir daí, a retenção tende a ser muito mais alta.

O segundo aha moment é:

> **"O cliente aceitou a proposta pelo link."**

Nesse ponto, o profissional fechou um contrato sem imprimir nada, sem papel, sem precisar marcar reunião para assinar. Esse é o ponto de maior NPS esperado.

### 8.2 Ações críticas para ativação (janela de 7 dias)

Para o usuário chegar ao aha moment antes de abandonar, ele precisa:

1. Configurar marca (logo, WhatsApp, PIX) — **Dia 1**
2. Cadastrar pelo menos 1 serviço — **Dia 1**
3. Criar a primeira proposta — **Dia 1–2**
4. Enviar o link para um cliente real pelo WhatsApp — **Dia 2–3**
5. Ver o cliente abrir o link (notificação push ou e-mail) — **Dia 2–5**

Se o usuário não chega ao passo 4, a probabilidade de abandono é alta. O onboarding deve ser construído para eliminar qualquer fricção nesses 4 passos.

### 8.3 Gaps atuais no onboarding

| Gap | Consequência |
|---|---|
| Sem e-mail de boas-vindas com passo a passo | Usuário abre o painel sem saber por onde começar |
| Sem checklist de ativação visível na home | Usuário não sabe que está a 3 passos do aha moment |
| Sem lembrete no D+3 se não enviou proposta | Usuário frio abandona silenciosamente |
| Sem exemplo pré-carregado por nicho | Usuário tem que imaginar como a proposta vai ficar antes de criar |
| Sem tour guiado obrigatório no primeiro acesso | Usuário explora aleatoriamente e não descobre features importantes |

### 8.4 Onboarding ideal (sequência de e-mails)

| Dia | Assunto | Objetivo |
|---|---|---|
| D+0 | Bem-vindo ao FechaPro — configure em 3 minutos | Leva ao onboarding de marca |
| D+1 (se não criou proposta) | Sua primeira proposta está quase pronta | Leva ao formulário de proposta com exemplo |
| D+3 (se não enviou proposta) | Um cliente está esperando sua proposta | Urgência + exemplo de mensagem para WhatsApp |
| D+7 (se enviou, sem aceite ainda) | Seu cliente viu a proposta. Hora do follow-up | Leva ao bloco de follow-up do painel |
| D+14 | Veja o que outros [nicho] estão fechando com o FechaPro | Social proof + caso de uso do nicho |
| D+30 | Seu mês no FechaPro | Relatório de propostas enviadas/aceitas — reforça valor |

---

## 9. Go-to-Market — Estratégia de Aquisição

### 9.1 Princípio geral

O FechaPro não pode atacar 22 nichos ao mesmo tempo. A estratégia de lançamento deve escolher **1 ou 2 nichos prioritários**, dominar a narrativa neles, construir cases e depoimentos, e só então expandir.

### 9.2 Nichos prioritários para lançamento

**Nicho 1: Designers e profissionais criativos (designers, social media, fotógrafos)**
- Já usam ferramentas digitais, menor resistência técnica
- Enviam 10–30 propostas por mês — sentem a dor com clareza
- Comunidade ativa no Instagram e grupos do Facebook/WhatsApp
- ROI claro: "fechei R$ 800 a mais porque o cliente viu o portfólio na proposta"

**Nicho 2: Profissionais de saúde (nutricionistas, psicólogos, personal trainers)**
- Proposta chamada de "plano de cuidado" — template já existe no FechaPro
- Ticket médio alto (R$ 300–1.500/mês por paciente)
- Alta sensibilidade à imagem profissional
- Comunidade forte no Instagram, crescimento acelerado pós-pandemia

### 9.3 Canais de aquisição por fase

**Fase 0 — Primeiros 50 clientes (validação, custo zero)**

| Canal | Ação |
|---|---|
| Rede pessoal | Convidar 20–30 profissionais conhecidos para testar gratuitamente e dar feedback |
| Grupos de WhatsApp e Telegram | Entrar em grupos de designers, nutricionistas, coaches e apresentar o produto com um caso real |
| Instagram da fundadora | Mostrar bastidores do produto, antes/depois de proposta no WhatsApp vs. FechaPro |
| Indicação com incentivo | Usuário que indica recebe 1 mês grátis — alinha com o comportamento de recomendar para colegas de nicho |

**Fase 1 — 50 a 500 clientes (crescimento orgânico)**

| Canal | Ação | Estimativa de CAC |
|---|---|---|
| Conteúdo no Instagram | Reels mostrando proposta enviada pelo link, reação do cliente, rastreamento | R$ 0 (custo de tempo) |
| YouTube — tutoriais por nicho | "Como fazer proposta profissional para nutricionista em 5 minutos" | R$ 0 (custo de tempo) |
| SEO — blog | Artigos como "modelo de orçamento para designer", "proposta comercial para eventos" | R$ 0 a R$ 50/artigo |
| Parcerias com contadores e BPOs | Contadores que atendem MEIs podem indicar o FechaPro como parte do pacote | R$ 30–80/indicação |
| Afiliados de nicho (coaches de negócios) | Comissão de 20–30% no primeiro mês sobre indicações | R$ 20–60/cliente |

**Fase 2 — 500+ clientes (escala com mídia paga)**

| Canal | Público-alvo | Estimativa de CAC |
|---|---|---|
| Meta Ads (Instagram/Facebook) | Autônomos 25–45 anos, interesse em empreendedorismo e WhatsApp Business | R$ 150–400 |
| Google Ads — palavras-chave de intenção | "software proposta comercial", "como enviar orçamento profissional" | R$ 200–500 |
| Parceria com plataformas (GetNinjas, Workana) | Freelancers que já estão em busca de clientes | Negociar CPA |

### 9.4 Estratégia de parcerias indiretas

| Parceiro | Por que faz sentido | Modelo |
|---|---|---|
| Escritórios de contabilidade | Atendem milhares de MEIs — podem recomendar o FechaPro como ferramenta de profissionalização | Comissão recorrente ou co-marketing |
| Coaches e mentores de negócios para autônomos | Audiência alinhada, autoridade no nicho | Afiliado com código exclusivo |
| Cursos de freelancing (Hotmart, Udemy) | Alunos que acabaram de começar precisam de proposta profissional | Integração como ferramenta recomendada |
| Associações profissionais (ABD, CFF, etc.) | Acesso direto ao nicho com credibilidade | Plano corporativo com desconto para associados |
| Nuvemshop / plataformas de e-commerce | Empreendedores que vendem serviço e produto — complementar | Integração ou co-marketing |

### 9.5 Métricas de go-to-market para acompanhar

| Métrica | Meta mês 1 | Meta mês 3 | Meta mês 6 |
|---|---|---|---|
| Usuários cadastrados (trial/gratuito) | 100 | 500 | 2.000 |
| Usuários pagantes | 20 | 100 | 400 |
| Taxa de conversão trial → pago | — | 20% | 20% |
| Churn mensal | — | < 8% | < 5% |
| MRR | R$ 2.000 | R$ 9.700 | R$ 38.800 |
| NPS | — | > 40 | > 50 |

---

## 10. Estratégia de Conteúdo e SEO

### 10.1 Por que conteúdo é o canal mais importante

O público-alvo do FechaPro não pesquisa ativamente por "software de proposta". Ele pesquisa por soluções ao seu problema: "como fazer orçamento profissional", "modelo de proposta para designer", "como cobrar por projeto". Quem resolve essa busca captura o usuário no momento exato de necessidade — com custo marginal zero no longo prazo.

### 10.2 Palavras-chave prioritárias (SEO)

| Palavra-chave | Intenção | Volume estimado (BR) |
|---|---|---|
| modelo de proposta comercial | Informacional / Transacional | Alto |
| como fazer orçamento profissional | Informacional | Alto |
| software de proposta comercial | Transacional | Médio |
| proposta comercial para designer | Informacional / Transacional | Médio |
| proposta comercial para nutricionista | Informacional / Transacional | Médio |
| orçamento online para autônomo | Transacional | Médio |
| aceite de proposta online | Informacional | Baixo-Médio |
| como enviar proposta pelo WhatsApp | Informacional | Alto |

### 10.3 Tipos de conteúdo por canal

**Blog (SEO de longo prazo)**
- "Modelo de proposta comercial para [nicho]: guia completo"
- "Como enviar orçamento profissional pelo WhatsApp (sem parecer amador)"
- "Diferença entre orçamento e proposta comercial — e por que importa"
- "Como aumentar a taxa de fechamento de propostas: 7 práticas"

**YouTube (demonstração + tutorial)**
- "Como criar uma proposta profissional para [nicho] em 5 minutos"
- "Antes e depois: orçamento no WhatsApp vs. proposta com link profissional"
- "Como o FechaPro avisa quando o cliente abre a proposta"
- "Configurando sua marca no FechaPro do zero"

**Instagram/Reels (descoberta e prova social)**
- Antes/depois da proposta (WhatsApp vs. link profissional)
- Tela do profissional recebendo notificação de aceite
- Depoimentos de usuários por nicho
- Dicas de como precificar e apresentar serviço por segmento

**E-mail marketing (retenção e ativação)**
- Sequência de onboarding (ver seção 8.4)
- Relatório mensal de uso do produto
- Cases de sucesso por nicho
- Novidades e features lançadas

### 10.4 Cronograma de conteúdo recomendado

| Mês | Foco | Entregáveis |
|---|---|---|
| 1 | Fundação | Criar blog, 4 artigos pilares, perfil Instagram, canal YouTube |
| 2 | Nicho 1 (Design) | 4 artigos + 2 vídeos para designers |
| 3 | Nicho 2 (Saúde) | 4 artigos + 2 vídeos para nutricionistas/personal |
| 4–6 | Escala orgânica | 8 artigos/mês, 4 vídeos, 12 reels |

---

## 11. Aspectos Jurídicos e LGPD

### 11.1 Documentos obrigatórios antes do lançamento

| Documento | O que precisa cobrir | Status recomendado |
|---|---|---|
| **Política de Privacidade** | Quais dados são coletados, por que, por quanto tempo, com quem são compartilhados, como o usuário pode exercer seus direitos LGPD | Publicar antes do lançamento |
| **Termos de Uso** | Responsabilidades do usuário, do FechaPro e do cliente final; uso aceitável; rescisão; limitação de responsabilidade | Publicar antes do lançamento |
| **Política de Cookies** | Quais cookies são usados, para que, opt-out | Publicar antes do lançamento |
| **DPA (Data Processing Agreement)** | Para usuários empresariais — define FechaPro como operador de dados dos clientes do profissional | Preparar para plano Pro+ |

### 11.2 Pontos de atenção LGPD

**Dados do profissional (controlador):** nome, e-mail, telefone, dados de pagamento. O FechaPro é controlador — precisa de base legal (contrato) e deve informar na política de privacidade.

**Dados dos clientes do profissional (operador):** nome, e-mail e dados de aceite registrados na proposta. O FechaPro atua como operador em nome do profissional. O profissional é o controlador desses dados. O contrato de uso deve deixar isso claro.

**Dados de comportamento (analytics):** visualizações, cliques, tempo de acesso. Precisam de consentimento via banner de cookies se usados para fins analíticos além do serviço.

**Retenção de dados:** definir política de quanto tempo os dados ficam após cancelamento (recomendado: 30–90 dias para dados de acesso, 12 meses para dados de proposta).

**Direitos do titular:** o usuário pode solicitar portabilidade, correção e exclusão dos seus dados. O painel precisa ter mecanismo para isso (ou o suporte deve atender).

### 11.3 Responsabilidade sobre propostas e contratos

O FechaPro gera documentos (proposta, contrato) baseados em dados inseridos pelo usuário. A responsabilidade pelo conteúdo é do profissional — o FechaPro é apenas ferramenta. Isso precisa estar explícito nos termos de uso para limitar responsabilidade em caso de disputa contratual entre profissional e cliente final.

### 11.4 Aspectos operacionais

- **CNPJ:** o produto precisa operar com CNPJ ativo para emitir cobranças, especialmente com o Mercado Pago
- **Nota fiscal de serviço:** usuários empresariais podem solicitar NFS-e; definir se será emitida e por qual regime tributário
- **Cobrança de impostos:** assinaturas SaaS têm incidência de ISS; verificar obrigações municipais

---

## 12. Melhorias Prioritárias

### Prioridade 1 — Críticas para lançamento (fazer antes de abrir)

1. **Revogar e substituir OPENAI_API_KEY**
   Risco de segurança real. Revogar imediatamente em platform.openai.com, gerar nova e atualizar `.env`.

2. **Rodar `npm run db:push`**
   Schema pode estar desatualizado. Deve ser executado e validado antes de receber novos cadastros.

3. **Configurar e testar envio de e-mails (Resend ou SMTP)**
   Todas as notificações por e-mail dependem disso. Testar o fluxo completo: visualização, aceite, recusa, confirmação de PIX.

4. **Publicar Política de Privacidade e Termos de Uso**
   Exigência legal e LGPD. Sem isso o produto não deveria estar em produção com dados reais.

5. **Configurar storage externo (S3/R2)**
   Para qualquer ambiente de produção sem volume persistente, uploads locais vão se perder.

6. **Definir e documentar os planos legados (`plus`, `premium`)**
   Ou remover do código e banco, ou documentar claramente quando e como são usados.

7. **Substituir Baileys por WhatsApp Cloud API em produção**
   Baileys usa engenharia reversa — risco real de ban em produção.

### Prioridade 2 — Alto impacto em adoção (mês 1–2)

8. **Plano gratuito com trial de 7 dias ou 3 propostas**
   Remove a principal objeção de "quero testar antes de pagar". Reduz CAC e aumenta conversão.

9. **Sequência de e-mails de onboarding**
   Usuário novo precisa de guia ativo para chegar ao aha moment em 7 dias. Sem isso, o churn nos primeiros 14 dias será alto.

10. **Follow-up automático configurável**
    O profissional define "lembrar-me X dias após envio sem visualização". O sistema dispara notificação push + e-mail.

11. **Proposta com múltiplas opções de preço (Essencial / Padrão / Completo)**
    Técnica comprovada de âncora que aumenta ticket médio.

12. **Assinatura digital com validade jurídica**
    Integrar D4Sign, Autentique ou Clicksign. Remove o principal argumento do Proposeful.

### Prioridade 3 — Retenção e LTV (mês 3–4)

13. **Relatório mensal automático por e-mail**
    Resumo: propostas enviadas, aceitas, valor total fechado, taxa de conversão, comparativo com mês anterior.

14. **CRM com histórico unificado do cliente**
    Na tela de clientes, mostrar todas as propostas enviadas para aquele contato, valor total e histórico de relacionamento.

15. **Parcelamento no checkout de proposta (até 12x no Mercado Pago)**
    Abre o FechaPro para serviços de maior valor (R$ 3.000+) onde o cliente precisa parcelar.

16. **QR Code da proposta para impressão**
    O profissional pode imprimir ou mostrar em reunião presencial.

17. **Painel de artes com geração automática por IA**
    Substituir o fluxo manual (admin faz upload) por geração automática com IA de imagem.

### Prioridade 4 — Expansão de mercado (mês 5–6)

18. **PWA instalável com push nativo mobile**
    O público-alvo vive no celular. Instalação como app pelo Chrome no Android melhora drasticamente a retenção.

19. **Integração com Google Calendar pós-aceite**
    Ao cliente aceitar, criar evento no Google Calendar do profissional com os dados do projeto.

20. **Proposta recorrente com cobrança automática**
    Para serviços mensais (social media, manutenção, consultoria).

21. **Envio direto de proposta via WhatsApp Business API**
    Ao clicar "Enviar proposta", o sistema já manda o link para o WhatsApp do cliente cadastrado.

---

## 13. Análise SWOT

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
- Sem documentação jurídica (LGPD, termos de uso) publicada
- Sem sequência de onboarding por e-mail

### Oportunidades (Opportunities)
- 25 milhões de autônomos brasileiros sem estrutura de proposta
- Crescimento de MEIs e PJs acelerado nos últimos 3 anos
- Demanda por profissionalização do atendimento no WhatsApp
- Nenhum concorrente nacional resolve PIX + proposta + artes em conjunto
- Segmentos como saúde e odontologia ainda pouco atendidos por ferramentas digitais de proposta
- Parceiros naturais com audiência alinhada: contadores, coaches, cursos de freelancing
- Conteúdo de SEO com baixa concorrência no Brasil para palavras-chave de intenção

### Ameaças (Threats)
- Orca App como concorrente direto não mapeado — pode adicionar pagamento e competir em paridade
- Propoz pode adicionar pagamento e artes (com preço muito menor)
- Proposeful pode adicionar pagamento BR e reduzir preço
- Nuvemshop avançando em checkout via WhatsApp
- PandaDoc pode localizar para o Brasil com preço agressivo
- Plataformas de gestão de serviço (Trello, Notion, Monday) adicionando módulos de proposta
- Bonsai ou HoneyBook podem lançar versão localizada para o Brasil

---

## 14. Posicionamento e Mensagem Comercial

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

### Resposta para "já uso o WhatsApp"

> "O WhatsApp manda a mensagem, o FechaPro faz a proposta. Com o FechaPro, o cliente recebe um link com sua marca, fotos dos seus trabalhos, o que está incluído, prazo, valor, botão para pagar pelo PIX ou cartão — e você recebe uma notificação quando ele abrir. Depois disso você para de mandar 'viu meu orçamento?' porque já sabe que ele viu."

---

## 15. Roadmap Revisado e Priorizado

### Fase 0 — Antes do lançamento (urgente)
- [ ] Revogar OPENAI_API_KEY e gerar nova
- [ ] Rodar `npm run db:push`
- [ ] Configurar Resend + EMAIL_FROM + APP_URL e testar todos os e-mails
- [ ] Configurar storage externo (S3/R2)
- [ ] Documentar ou remover planos legados (`plus`, `premium`)
- [ ] Substituir Baileys por WhatsApp Cloud API em produção
- [ ] Publicar Política de Privacidade e Termos de Uso
- [ ] Confirmar CNPJ e regime tributário para cobrança de assinatura

### Fase 1 — Adoção (mês 1–2)
- [ ] Trial gratuito de 7 dias ou plano freemium (3 propostas)
- [ ] Sequência de e-mails de onboarding (D+0, D+1, D+3, D+7, D+14, D+30)
- [ ] Follow-up automático configurável por proposta
- [ ] Proposta com múltiplas opções de preço
- [ ] Assinatura digital (D4Sign ou Autentique)
- [ ] Blog com 4 artigos pilares de SEO
- [ ] Instagram ativo com conteúdo de antes/depois

### Fase 2 — Retenção (mês 3–4)
- [ ] Relatório mensal automático por e-mail
- [ ] CRM com histórico unificado do cliente
- [ ] Parcelamento no checkout de proposta
- [ ] QR Code da proposta para impressão
- [ ] Geração automática de artes por IA de imagem
- [ ] Programa de indicação com incentivo (1 mês grátis para quem indica)
- [ ] Primeiras parcerias ativas (contadores, coaches)

### Fase 3 — Expansão (mês 5–6)
- [ ] PWA instalável com push nativo mobile
- [ ] Integração com Google Calendar
- [ ] Proposta recorrente com cobrança automática
- [ ] Envio direto via WhatsApp Business API
- [ ] Página de proposta com layouts alternativos
- [ ] Canal YouTube com tutoriais por nicho

---

## 16. Resumo Executivo Final

**O FechaPro tem produto funcional, diferencial real e mercado grande.** O núcleo está implementado: proposta → link → aceite → pagamento → rastreamento. A experiência do cliente final é completa sem exigir cadastro. O diferencial de PIX direto integrado + artes de divulgação não existe em nenhum concorrente identificado.

**Os riscos imediatos são de configuração e jurídico:** chave da OpenAI exposta, schema desatualizado, e-mails sem configurar e ausência de Política de Privacidade/Termos de Uso. Esses itens precisam estar resolvidos antes de qualquer usuário real.

**O maior gap estratégico é o topo do funil:** sem trial ou plano gratuito, a taxa de conversão de visitante para pagante é baixa. Adicionar 7 dias gratuitos pode dobrar a conversão em curto prazo.

**O segundo gap maior é a automação pós-envio:** o FechaPro captura todos os sinais certos (visualização, clique, aceite), mas não age sobre eles. Follow-up automático configurável é a feature com maior potencial de reduzir churn.

**O terceiro gap, que não estava documentado, é a aquisição:** o produto não tem canal de crescimento definido. Sem canal, crescimento depende de boca a boca — que é imprevisível. O nicho de designers e profissionais de saúde são os mais adequados para validação inicial, com conteúdo no Instagram e YouTube como canal principal de custo zero.

**O mapa competitivo estava incompleto:** o Orca App é o concorrente nacional mais similar ao FechaPro e não estava mapeado. Bonsai e HoneyBook são as referências globais para onde o produto pode evoluir (proposta + contrato + invoice + pagamento em um fluxo). Nenhum deles tem PIX — o diferencial do FechaPro no mercado brasileiro permanece intacto.

**O produto está pronto para lançar. Para lançar bem, faltam: configuração, LGPD, trial, onboarding por e-mail, follow-up automático e um canal de aquisição ativo.**

---

*Relatório atualizado com base em análise do código-fonte, schema do banco de dados, manual do usuário, planos configurados, roadmap documentado, pesquisa de mercado e benchmarks de SaaS B2B SMB brasileiro.*

*Concorrentes analisados: Orca App, Propoz, Proposeful, Provelo, ContaAzul, Bonsai, HoneyBook, PandaDoc, Better Proposals, Proposify, Qwilr e Prospero.*

*Fontes: IBGE (trabalhadores autônomos 2025), Agência Brasil (dados MEI), orcaapp.com.br, propoz.com.br, proposeful.com, provelo.com.br, contaazul.com, hellobonsai.com, honeybook.com.*

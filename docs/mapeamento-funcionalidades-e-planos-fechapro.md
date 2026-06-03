# Mapeamento de Funcionalidades e Planos do FechaPro

Documento de produto baseado no sistema implementado em 02/06/2026.

## 1. Resumo do produto

O FechaPro é uma plataforma de apresentação e fechamento comercial para prestadores de serviço. O profissional cria uma proposta com sua marca, envia um link pelo WhatsApp ou e-mail e acompanha a jornada do cliente até o aceite e o pagamento.

O núcleo da entrega é:

```text
Cliente + serviço -> proposta profissional -> link e PDF -> visualização ->
follow-up -> aceite ou recusa -> contrato -> pagamento -> recibo -> satisfação
```

## 2. Mapa completo das funcionalidades

### 2.1 Conta, acesso e onboarding

- Cadastro após checkout e criação manual de usuário pelo administrador.
- Login, logout, recuperação e redefinição de senha.
- Seleção de nicho e segmento do negócio.
- Checklist de configuração inicial.
- Proteção anti-bot com Cloudflare Turnstile nos formulários públicos.
- Controle de assinatura por status: ativa, teste, pendente, pausada, bloqueada ou cancelada.

### 2.2 Painel comercial

- Indicadores gerais e mensais de propostas.
- Quantidade e valor de propostas enviadas, abertas e aceitas.
- Taxa de aceite.
- Valor em negociação.
- Acompanhamento de uso do plano.
- Checklist de primeiros passos.
- Lista de clientes quentes para follow-up.
- Atalhos para copiar mensagens de retomada.
- Alertas push para movimentações nas propostas.

### 2.3 Propostas

- Criação de proposta com cliente, serviço, valor, prazo, validade, pagamento, itens inclusos e observações.
- Uso de um ou vários serviços cadastrados na mesma proposta.
- Soma automática dos valores e combinação dos entregáveis.
- Salvamento como rascunho ou proposta pronta para envio.
- Link público exclusivo por proposta.
- PDF gerado pelo sistema.
- Edição, duplicação, reenvio e exclusão.
- Expiração automática após a validade.
- Status: rascunho, enviada, visualizada, aguardando resposta, aceita, recusada e expirada.
- Tipos de documento: automático, orçamento, proposta comercial, proposta técnica, plano de cuidado e proposta de evento.
- Segmentação visual por tipo de negócio.
- Apresentação em slides para planos superiores.

### 2.4 Experiência do cliente final

- Acesso ao link sem login e sem instalação de aplicativo.
- Visualização de marca, escopo, prazo, valor, pagamento e observações.
- Exibição opcional de portfólio, depoimentos, catálogo de serviços e FAQ.
- Download do PDF.
- Botão de WhatsApp do profissional.
- Aceite online com registro de nome, e-mail, documento, telefone, data e evidências técnicas.
- Recusa com motivo.
- Contrato em PDF gerado após o aceite.
- Recibo em PDF após pagamento confirmado.

Importante: o aceite cria evidências e contrato, mas não deve ser vendido como assinatura eletrônica qualificada com validade jurídica universal.

### 2.5 Rastreamento, notificações e follow-up

- Contagem de visualizações por proposta.
- Contagem de cliques no WhatsApp.
- Registro de aceite, recusa e pagamento.
- Histórico com datas e contexto da negociação.
- E-mails transacionais para profissional e cliente.
- Alertas push de visualização, aceite, recusa e pagamento.
- Notificações por WhatsApp, quando o provedor estiver configurado.
- Follow-up assistido no painel.
- Lembretes automáticos de follow-up por cron externo, conforme configuração da marca.

### 2.6 Pagamentos

- Checkout Mercado Pago.
- PIX direto com chave cadastrada na marca.
- QR Code e código copia e cola para PIX.
- Confirmação manual de recebimento no PIX direto.
- Webhook para atualização de pagamentos do Mercado Pago.
- Checkout de planos.
- Compra de pacotes extras de artes.

### 2.7 CRM e catálogo

- Cadastro, edição e exclusão de clientes.
- Campos de cliente: nome, e-mail, telefone, segmento, serviço de interesse, status e observações.
- Cadastro de serviços com nome, preço, prazo, entregáveis e imagem.
- Portfólio com título, categoria e imagem.
- Depoimentos com autor, empresa e texto.
- Importação CSV de clientes, serviços e depoimentos.

### 2.8 Marca e personalização

- Nome comercial, logo e cores.
- WhatsApp, PIX, Instagram, e-mail, site e bio.
- Textos comerciais: introdução, encerramento, termos e FAQ.
- Escolha das seções exibidas ao cliente.
- Estilos de apresentação da proposta.

### 2.9 Templates

- Modelos prontos por nicho.
- Preenchimento de serviço, valor sugerido, prazo, pagamento e escopo.
- Templates personalizados enviados pelo usuário.
- Reaproveitamento de templates na criação de novas propostas.

### 2.10 Artes de divulgação

- Solicitação de arte por briefing.
- Objetivo, formato, público, chamada para ação e serviço divulgado.
- Upload de imagem de referência.
- Geração de imagem ou produção assistida pela equipe.
- Legenda e mensagem de WhatsApp.
- Fluxo de aprovação.
- Download da arte final.
- Créditos mensais e pacotes extras: 5, 15 ou 30 artes.

### 2.11 Pós-venda e satisfação

- Marcação da conclusão do serviço pelo profissional.
- Envio ou reenvio da pesquisa por e-mail.
- Coleta de nota, NPS e comentário.
- Autorização do cliente para uso do depoimento.
- Criação automática do depoimento autorizado.

### 2.12 Suporte e administração

- Canal de suporte dentro da plataforma.
- Respostas do administrador por conversa.
- Gestão de usuários, planos e liberações manuais.
- Métricas administrativas de acessos e receitas.
- Gestão das solicitações de artes.
- Conexão do WhatsApp por QR Code.
- Criação e remoção de propostas demonstrativas.

## 3. Definição recomendada dos quatro planos

Os quatro planos abaixo são a linha comercial vigente na landing page. Até 08/06/2026, a oferta exibida é a Cota Fundador com pagamento único e acesso vitalício. A partir de 09/06/2026, a própria landing informa a entrada dos valores mensais correspondentes.

| Plano | Cota Fundador até 08/06/2026 | Mensalidade indicada a partir de 09/06/2026 | Propostas | Artes por mês |
| --- | ---: | ---: | ---: | ---: |
| Start | R$ 497 uma vez | R$ 97/mês | 50/mês | 5 |
| Profissional | R$ 997 uma vez | R$ 197/mês | 200/mês | 15 |
| Pro Site | R$ 1.497 uma vez | R$ 297/mês | 200/mês | 20 |
| Estrutura Completa | R$ 1.997 uma vez | R$ 497/mês | Ilimitadas | 50 |

O saldo não utilizado de propostas acumula mês a mês nos planos com limite.

### 3.1 Start

Para autônomos que precisam profissionalizar o orçamento sem complexidade.

- 50 propostas por mês.
- Link profissional e PDF.
- Aceite online.
- PIX e Mercado Pago.
- Cadastro de clientes.
- Cadastro de marca.
- 5 artes de divulgação por mês.

### 3.2 Profissional

Para quem já vende com frequência e precisa apresentar melhor seu trabalho e acompanhar oportunidades.

- Tudo do Start.
- 200 propostas por mês.
- Serviços cadastrados.
- Marca personalizada.
- Portfólio dentro da proposta.
- Depoimentos de clientes.
- Templates.
- Rastreamento avançado de visualizações e cliques.
- 15 artes de divulgação por mês.

### 3.3 Pro Site

Para profissionais e pequenas empresas que querem presença online própria e uma apresentação mais completa.

- Tudo do Profissional.
- 200 propostas por mês.
- 20 artes de divulgação por mês.
- Mini site profissional.
- Domínio próprio incluído.
- Apresentação da proposta em slides.

### 3.4 Estrutura Completa

Para profissionais de ticket alto, agências e consultores que querem implantação acompanhada.

- Tudo do Pro Site.
- Propostas ilimitadas.
- 50 artes de divulgação por mês.
- Mini site profissional.
- Implantação assistida.
- Diagnóstico do Instagram.
- Primeira proposta criada com o cliente.
- Treinamento completo de uso.

## 4. Matriz comercial resumida

| Funcionalidade | Start | Profissional | Pro Site | Estrutura Completa |
| --- | :---: | :---: | :---: | :---: |
| Painel, propostas e clientes | Sim | Sim | Sim | Sim |
| Link, PDF, aceite, contrato e pagamento | Sim | Sim | Sim | Sim |
| Marca personalizada | Sim | Sim | Sim | Sim |
| Serviços cadastrados | - | Sim | Sim | Sim |
| Portfólio e depoimentos | - | Sim | Sim | Sim |
| Templates | - | Sim | Sim | Sim |
| Artes mensais | 5 | 15 | 20 | 50 |
| Apresentação em slides | - | - | Sim | Sim |
| Mini site e domínio | - | - | Sim | Sim |
| Implantação assistida | - | - | - | Sim |

## 5. Pontos que precisam de alinhamento no sistema

### 5.1 Bloqueio de módulos do Start

A oferta do Start promete cadastro de marca e 5 artes por mês. Porém, a navegação atual exige nível Pro para liberar as telas **Marca** e **Artes de divulgação**. O produto deve liberar esses módulos para o Start ou remover esses itens da oferta.

### 5.2 Oferta pública duplicada

A landing vende quatro planos Fundador: `founder_start`, `founder_professional`, `founder_complete_site` e `founder`.

A API interna de planos ainda expõe quatro planos mensais: `start`, `professional`, `premium` e `premium_site`.

Depois do encerramento da Cota Fundador, a comunicação deve migrar para os quatro equivalentes mensais e manter uma única nomenclatura comercial.

### 5.3 Nomes internos diferentes

O plano `founder_complete_site` aparece como **Pro Site** na landing, mas como **Completo** em parte do painel. O plano `founder` aparece como **Estrutura Completa** na landing, mas como **Fundador** em parte do painel. Padronizar os nomes reduz dúvidas no suporte e no comercial.

### 5.4 Entregas feitas pela equipe

Mini site, domínio, implantação, diagnóstico do Instagram, primeira proposta acompanhada e treinamento são entregas comerciais assistidas. Elas não são módulos automáticos completos do software e devem ser apresentadas dessa forma.

## 6. Fonte de verdade sugerida

Para comunicação comercial, adotar estes nomes:

1. Start
2. Profissional
3. Pro Site
4. Estrutura Completa

Para desenvolvimento, manter os códigos legados apenas por compatibilidade e centralizar a exibição pública em `lib/plans.ts`, evitando listas de planos duplicadas na landing page.

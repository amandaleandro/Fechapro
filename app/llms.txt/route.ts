const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br";

export const dynamic = "force-static";

export function GET() {
  const body = `# FechaPro

> Sistema de orcamentos e propostas comerciais online para prestadores de servico venderem melhor pelo WhatsApp.

FechaPro ajuda autonomos, pequenos negocios e empresas de servicos a transformar orcamentos soltos em propostas profissionais com link, PDF, aceite online, pagamento, portfolio, depoimentos, calculadora de custos e acompanhamento de visualizacoes.

## Principais paginas

- [Pagina inicial](${siteUrl}/): Visao geral do produto, beneficios, planos e perguntas frequentes.
- [Criar conta](${siteUrl}/cadastro): Cadastro para testar propostas online.
- [Interesse comercial](${siteUrl}/interesse): Contato para entender planos, implantacao e uso no negocio.
- [Politica de privacidade](${siteUrl}/privacidade): Como dados sao tratados no FechaPro.
- [Termos de uso](${siteUrl}/termos): Condicoes de uso da plataforma.

## O que o FechaPro faz

- Cria orcamentos e propostas comerciais online.
- Gera link publico profissional para envio pelo WhatsApp.
- Gera PDF da proposta.
- Registra visualizacoes e cliques para orientar follow-up.
- Permite aceite online do cliente.
- Organiza clientes, servicos, portfolio, depoimentos e marca.
- Ajuda a calcular custos, taxas, margem e preco sugerido.
- Apoia prestadores de servico que precisam explicar valor antes do preco.

## Publico ideal

Prestadores de servico, autonomos, pequenas empresas, assistencias tecnicas, instaladores, manutencao, reformas, energia solar, ar-condicionado, eletrica, estetica automotiva, arquitetura, fotografia, consultoria, design, marketing e negocios que vendem pelo WhatsApp ou enviam orcamentos antes de fechar.

## Termos associados

sistema de orcamento, orcamento online, proposta comercial online, proposta de servico, gerador de proposta comercial, vender servicos pelo WhatsApp, proposta com aceite online, proposta com PDF, acompanhamento de vendas, follow-up comercial.

## Arquivo completo para IA

- [llms-full.txt](${siteUrl}/llms-full.txt): Resumo ampliado do produto, funcionalidades, publico, posicionamento e links importantes.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

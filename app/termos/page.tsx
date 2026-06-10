import type { Metadata } from "next";
import { LegalPage } from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso do FechaPro.",
  alternates: {
    canonical: "/termos",
  },
};

const sections = [
  {
    title: "1. Aceite dos termos",
    paragraphs: [
      "Ao acessar ou usar o FechaPro, você declara que leu, entendeu e concorda com estes Termos de Uso e com a Política de Privacidade.",
      "Se estiver usando a plataforma em nome de uma empresa, você declara ter autorização para aceitar estes termos em nome dela.",
    ],
  },
  {
    title: "2. Uso da plataforma",
    paragraphs: [
      "O FechaPro oferece recursos para criação, envio, acompanhamento e gestão de propostas comerciais, incluindo links públicos, PDFs, aceite online, cadastro de marca, clientes, serviços e materiais relacionados.",
      "Você é responsável pela veracidade das informações cadastradas, pelo conteúdo das propostas, pelas condições comerciais apresentadas aos seus clientes e pelo uso adequado dos recursos disponíveis.",
    ],
  },
  {
    title: "3. Conta e segurança",
    paragraphs: [
      "Você deve manter seus dados de acesso em sigilo e informar imediatamente qualquer suspeita de uso não autorizado da conta.",
      "Podemos limitar, suspender ou encerrar acessos em caso de uso indevido, violação destes termos, risco de segurança, fraude, abuso, inadimplência ou exigência legal.",
    ],
  },
  {
    title: "4. Planos, pagamentos e cancelamentos",
    paragraphs: [
      "Planos, limites, preços, benefícios e condições comerciais são apresentados nas páginas de contratação e podem variar conforme campanha, período promocional ou modalidade escolhida.",
      "Pagamentos podem ser processados por provedores externos. Taxas, estornos, parcelamentos e regras do meio de pagamento seguem as condições exibidas no checkout e as políticas do respectivo provedor.",
      "Quando houver garantia, teste ou prazo de cancelamento informado em oferta específica, a solicitação deve ser feita dentro do prazo e pelo canal de suporte indicado.",
    ],
  },
  {
    title: "5. Conteúdo do usuário",
    paragraphs: [
      "Você mantém a titularidade sobre textos, imagens, marcas, portfólios, depoimentos e demais conteúdos enviados à plataforma.",
      "Ao cadastrar conteúdo, você nos concede autorização para armazenar, processar, exibir e disponibilizar esse material na medida necessária para operar os recursos contratados.",
      "Você não deve enviar conteúdo ilegal, ofensivo, fraudulento, que viole direitos de terceiros ou que possa prejudicar a operação da plataforma.",
    ],
  },
  {
    title: "6. Disponibilidade e limitações",
    paragraphs: [
      "Buscamos manter o serviço estável e seguro, mas a plataforma pode sofrer interrupções por manutenção, atualizações, falhas técnicas, serviços de terceiros, incidentes de internet ou motivos fora do nosso controle.",
      "O FechaPro não garante resultado comercial específico. O fechamento de vendas depende de fatores como oferta, atendimento, preço, mercado, cliente, execução e estratégia do próprio usuário.",
    ],
  },
  {
    title: "7. Alterações dos termos",
    paragraphs: [
      "Podemos atualizar estes termos para refletir mudanças no produto, nas regras comerciais, em requisitos legais ou em práticas operacionais.",
      "A versão vigente ficará disponível nesta página. O uso contínuo da plataforma após a publicação de alterações representa concordância com os termos atualizados.",
    ],
  },
  {
    title: "8. Suporte",
    paragraphs: [
      "Dúvidas sobre uso, contratação, pagamentos, cancelamento ou estes termos devem ser enviadas pelo canal de suporte disponível no site.",
      "Estes termos são regidos pela legislação brasileira, observadas as normas aplicáveis ao relacionamento entre as partes.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      effectiveDate="10/06/2026"
      intro="Estes termos definem as regras para acesso e uso do FechaPro, incluindo site, plataforma, checkouts, propostas públicas, recursos comerciais e canais de suporte."
      sections={sections}
    />
  );
}

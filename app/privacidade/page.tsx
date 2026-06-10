import type { Metadata } from "next";
import { LegalPage } from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade do FechaPro.",
  alternates: {
    canonical: "/privacidade",
  },
};

const sections = [
  {
    title: "1. Dados que coletamos",
    paragraphs: [
      "Coletamos dados informados por você ao criar conta, contratar planos, configurar sua marca, cadastrar clientes, serviços, propostas, portfólio e depoimentos.",
      "Também podemos registrar dados técnicos de acesso, como endereço IP, navegador, dispositivo, páginas visitadas, eventos de visualização e interações necessárias para segurança, suporte, métricas e funcionamento da plataforma.",
    ],
  },
  {
    title: "2. Como usamos os dados",
    paragraphs: [
      "Usamos os dados para entregar os recursos do FechaPro, autenticar usuários, gerar propostas, PDFs, links públicos, aceites, comprovantes, comunicações transacionais, atendimento e suporte.",
      "Também podemos usar informações agregadas para melhorar a experiência, acompanhar desempenho, prevenir fraude, cumprir obrigações legais e administrar pagamentos e assinaturas.",
    ],
  },
  {
    title: "3. Compartilhamento",
    paragraphs: [
      "Compartilhamos dados apenas quando necessário para operar o serviço, como provedores de hospedagem, banco de dados, e-mail, armazenamento de arquivos, análise, atendimento, pagamentos e ferramentas de segurança.",
      "Não vendemos seus dados pessoais. Propostas públicas, portfólios e informações comerciais configuradas por você podem ser acessadas por quem receber o link correspondente.",
    ],
  },
  {
    title: "4. Cookies e tecnologias similares",
    paragraphs: [
      "Podemos usar cookies, pixels e tecnologias similares para login, segurança, preferências, medição de campanhas e análise de uso.",
      "Você pode bloquear cookies no navegador, mas alguns recursos essenciais, como autenticação e manutenção da sessão, podem deixar de funcionar corretamente.",
    ],
  },
  {
    title: "5. Segurança e retenção",
    paragraphs: [
      "Adotamos medidas técnicas e organizacionais para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida.",
      "Mantemos dados pelo tempo necessário para prestar o serviço, cumprir obrigações legais, resolver disputas, preservar registros de contratação e proteger direitos do FechaPro, dos usuários e de terceiros.",
    ],
  },
  {
    title: "6. Seus direitos",
    paragraphs: [
      "Você pode solicitar acesso, correção, portabilidade, exclusão, oposição ou limitação de tratamento dos seus dados, conforme a legislação aplicável.",
      "Alguns dados podem ser mantidos quando houver obrigação legal, necessidade de auditoria, prevenção a fraude, execução contratual ou exercício regular de direitos.",
    ],
  },
  {
    title: "7. Contato",
    paragraphs: [
      "Para dúvidas, solicitações de privacidade ou atendimento relacionado a dados pessoais, entre em contato pelo canal de suporte disponível no site.",
      "Esta política pode ser atualizada para refletir mudanças legais, operacionais ou de produto. A versão vigente será publicada nesta página.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      effectiveDate="10/06/2026"
      intro="Esta política explica como o FechaPro coleta, usa, armazena e protege dados pessoais no uso da plataforma, do site, dos checkouts e dos canais de atendimento."
      sections={sections}
    />
  );
}

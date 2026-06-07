"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  Eye,
  Copy,
  FileDown,
  FileText,
  Files,
  FolderKanban,
  ImageIcon,
  LayoutDashboard,
  Layers3,
  LockKeyhole,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareQuote,
  Moon,
  Palette,
  CreditCard,
  Plus,
  QrCode,
  Presentation,
  RotateCcw,
  Settings,
  Send,
  Sparkles,
  Sun,
  HelpCircle,
  ThumbsDown,
  Trash2,
  Upload,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { isValidDateOnly, isValidEmail, isValidHttpUrl, isValidPhone } from "@/lib/validation";
import { businessSegments, filterReadyProposalTemplates, proposalTemplateNiches, type ProposalTemplate } from "@/lib/proposal-templates";
import { AuthScreen } from "./landing";
import { isUnlimitedProposalLimit, isUnlimitedArtLimit, plans, type PlanCode } from "@/lib/plans";
import ProposalPreview from "./components/ProposalPreview";
import Modal from "./components/Modal";

type ActiveView = "dashboard" | "proposals" | "clients" | "services" | "portfolio" | "testimonials" | "brand" | "arts" | "templates" | "plans" | "support" | "account";
type SessionProfile = { id?: string; name: string; email: string; niche?: string | null; segment?: string | null; isAdmin?: boolean };
type ProposalStatus = "draft" | "sent" | "viewed" | "awaiting_response" | "accepted" | "declined" | "expired";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  segment: string | null;
  interestService?: string | null;
  status?: string | null;
  notes?: string | null;
};

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  deadline: string | null;
  includes: string[];
  imageUrl: string | null;
};

type PortfolioItem = {
  id: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
};

type Testimonial = {
  id: string;
  authorName: string;
  company: string | null;
  quote: string;
};

type ImportKind = "clients" | "services" | "testimonials";

type ImportResult<T> = {
  created: T[];
  errors: string[];
};

type MarketingArt = {
  id: string;
  title: string;
  format: string;
  objective: string;
  serviceName: string | null;
  audience: string | null;
  callToAction: string | null;
  caption: string | null;
  whatsappMessage: string | null;
  category: string | null;
  prompt: string;
  imageUrl: string;
  referenceImageUrl: string | null;
  referenceImageUrls?: string[] | null;
  source: string;
  createdAt: string;
};

type Proposal = {
  id: string;
  clientName: string;
  clientEmail?: string | null;
  serviceName: string;
  price: number;
  deadline: string;
  validUntil: string;
  payment: string;
  documentType: "auto" | "budget" | "commercial_proposal" | "technical_proposal" | "care_plan" | "event_proposal";
  segment: "auto" | "home_reform" | "automotive" | "beauty" | "health" | "business" | "events" | "technology" | "education" | "food" | "pet" | "real_estate" | "fashion_retail" | "transport" | "finance" | "industry" | "agriculture" | "tourism" | "security" | "general";
  included: string[];
  notes: string;
  status: ProposalStatus;
  publicSlug?: string;
  viewCount?: number;
  whatsappClickCount?: number;
  updatedAt?: string;
  paymentStatus?: string;
  checkoutMode?: "pix" | "mercadopago";
  paymentMethod?: string | null;
  paymentPaidAt?: string | null;
  providerReceiptUrl?: string | null;
  acceptedBy?: string | null;
  acceptedEmail?: string | null;
  acceptedAt?: string | null;
  declinedReason?: string | null;
  declinedAt?: string | null;
  satisfactionSurvey?: {
    id: string;
    testimonialId?: string | null;
    rating?: number | null;
    recommendScore?: number | null;
    comment?: string | null;
    testimonialOk: boolean;
    clientName?: string | null;
    clientEmail?: string | null;
    serviceCompletedAt?: string | null;
    sentAt?: string | null;
    respondedAt?: string | null;
  } | null;
  createdAt: string;
};

type ProposalDraft = Omit<Proposal, "id" | "status" | "createdAt" | "publicSlug" | "viewCount"> & {
  templateId: string;
};

type BrandProfile = {
  id?: string;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  whatsapp: string | null;
  pixKey: string | null;
  instagram: string | null;
  email: string | null;
  website: string | null;
  bio: string | null;
  proposalStyle: "executive" | "creative" | "premium" | "technical" | "modern" | "classic";
  proposalIntro: string | null;
  proposalClosing: string | null;
  proposalTerms: string | null;
  proposalFaq: string | null;
  showPortfolio: boolean;
  showTestimonials: boolean;
  showServices: boolean;
  showFaq: boolean;
};

type ArtPackCode = "arts_5" | "arts_15" | "arts_30";

type BillingPlan = {
  code: PlanCode;
  name: string;
  price: string;
  priceCents: number;
  annualPrice?: string;
  maintenancePrice?: string;
  maintenancePriceCents?: number;
  proposalLimit: number;
  artLimit: number;
  features: string[];
  serviceEntitlements?: string[];
};

type BillingArtPack = {
  code: ArtPackCode;
  name: string;
  price: string;
  priceCents: number;
  credits: number;
  features: string[];
};

type BillingState = {
  subscription: {
    plan: PlanCode;
    provider?: string | null;
    status: string;
  };
  artPacks: BillingArtPack[];
  plans: BillingPlan[];
  usage: {
    proposalsThisMonth: number;
    proposalLimit: number;
    proposalsUsedSinceSubscriptionStart?: number;
    accumulatedProposalLimit?: number;
    artsThisMonth: number;
    artLimit: number;
    artCreditBalance: number;
  };
};

type TourStep = {
  view: ActiveView;
  eyebrow: string;
  title: string;
  description: string;
  checklist: string[];
};

const keys = {
  session: "fechapro_session_v1",
  proposals: "fechapro_proposals_v3",
  clients: "fechapro_clients_v1",
  services: "fechapro_services_v1",
  portfolio: "fechapro_portfolio_v1",
  testimonials: "fechapro_testimonials_v1",
  updatesModal: "fechapro_updates_modal_v4",
};

function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://fechapro.com.br";
}

const blankDraft: ProposalDraft = {
  templateId: "",
  clientName: "",
  clientEmail: "",
  serviceName: "",
  price: 0,
  deadline: "",
  validUntil: nextWeekDate(),
  payment: "",
  documentType: "auto",
  segment: "auto",
  checkoutMode: "mercadopago",
  included: [],
  notes: "",
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const statusConfig: Partial<Record<
  ProposalStatus,
  { label: string; icon: React.ElementType; className: string }
>> = {
  draft: { label: "Rascunho", icon: FileText, className: "bg-slate-700 text-white" },
  sent: { label: "Enviado", icon: Send, className: "bg-amber-500 text-white" },
  viewed: { label: "Visualizado", icon: Eye, className: "bg-sky-600 text-white" },
  awaiting_response: { label: "Aguardando", icon: HelpCircle, className: "bg-indigo-600 text-white" },
  accepted: { label: "Aceito", icon: CheckCircle2, className: "bg-green-700 text-white" },
  declined: { label: "Recusado", icon: ThumbsDown, className: "bg-rose-700 text-white" },
  expired: { label: "Expirado", icon: RotateCcw, className: "bg-orange-600 text-white" },
};

const documentTypeOptions: Array<{ value: ProposalDraft["documentType"]; label: string }> = [
  { value: "auto", label: "Automático pelo segmento" },
  { value: "budget", label: "Orçamento" },
  { value: "commercial_proposal", label: "Proposta comercial" },
  { value: "technical_proposal", label: "Proposta técnica" },
  { value: "care_plan", label: "Plano de cuidado" },
  { value: "event_proposal", label: "Proposta de evento" },
];

const proposalSegmentOptions: Array<{ value: ProposalDraft["segment"]; label: string }> = [
  { value: "auto", label: "Automático pelo serviço" },
  { value: "home_reform", label: "Casa, obra e reforma" },
  { value: "automotive", label: "Automotivo" },
  { value: "beauty", label: "Beleza e estética" },
  { value: "health", label: "Saúde e bem-estar" },
  { value: "business", label: "Consultoria, jurídico e negócios" },
  { value: "events", label: "Eventos e fotografia" },
  { value: "technology", label: "Tecnologia, design e marketing" },
  { value: "education", label: "Aulas e educação" },
  { value: "food", label: "Gastronomia" },
  { value: "pet", label: "Pet" },
  { value: "real_estate", label: "Imóveis e condomínios" },
  { value: "fashion_retail", label: "Moda, loja e varejo" },
  { value: "transport", label: "Transporte e logística" },
  { value: "finance", label: "Financeiro e seguros" },
  { value: "industry", label: "Indústria e manutenção" },
  { value: "agriculture", label: "Agro e rural" },
  { value: "tourism", label: "Turismo e hospedagem" },
  { value: "security", label: "Segurança" },
  { value: "general", label: "Serviço geral" },
];

function proposalSegmentLabel(value: ProposalDraft["segment"]) {
  return proposalSegmentOptions.find((option) => option.value === value)?.label || "";
}

const navItems: Array<{ id: ActiveView; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "proposals", label: "Propostas", icon: FileText },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "services", label: "Serviços", icon: BriefcaseBusiness },
  { id: "portfolio", label: "Portfólio", icon: ImageIcon },
  { id: "testimonials", label: "Depoimentos", icon: MessageSquareQuote },
  { id: "brand", label: "Marca", icon: Settings },
  { id: "arts", label: "Artes de divulgação", icon: Palette },
  { id: "templates", label: "Templates", icon: Layers3 },
  { id: "plans", label: "Planos", icon: CreditCard },
  { id: "support", label: "Suporte", icon: HelpCircle },
  { id: "account", label: "Conta", icon: UserCircle },
];

const directNavIds: ActiveView[] = ["dashboard", "proposals", "arts"];
const navGroups: Array<{ id: string; label: string; icon: React.ElementType; items: ActiveView[] }> = [
  { id: "catalogo", label: "Catálogo", icon: FolderKanban, items: ["clients", "services", "portfolio", "testimonials", "templates"] },
  { id: "conta", label: "Conta", icon: UserCircle, items: ["brand", "plans", "account", "support"] },
];

const planAccessRank: Record<PlanCode, number> = {
  start: 1,
  essential: 2,
  professional: 3,
  complete: 5,
  pro: 2,
  plus: 3,
  premium: 4,
  premium_site: 5,
  founder_start: 1,
  founder_essential: 2,
  founder_professional: 3,
  founder_complete_site: 5,
  founder: 5,
};

const moduleRequirements: Partial<Record<ActiveView, PlanCode>> = {
  services: "start",
  brand: "start",
  portfolio: "plus",
  testimonials: "plus",
  arts: "start",
  templates: "plus",
};

const commercialModuleIds: ActiveView[] = [
  "dashboard",
  "proposals",
  "clients",
  "services",
  "brand",
  "arts",
  "portfolio",
  "testimonials",
  "templates",
];

function canUseModule(view: ActiveView, plan: PlanCode) {
  const requiredPlan = moduleRequirements[view];
  return !requiredPlan || planAccessRank[plan] >= planAccessRank[requiredPlan];
}

function canUseProposalSlides(plan: PlanCode) {
  return planAccessRank[plan] >= planAccessRank.premium;
}

function requiredPlanLabel(view: ActiveView) {
  const requiredPlan = moduleRequirements[view];
  return requiredPlan ? plans[requiredPlan].name : "";
}

function availableModuleLabels(plan: PlanCode) {
  return commercialModuleIds
    .filter((view) => canUseModule(view, plan))
    .map((view) => navItems.find((item) => item.id === view)?.label)
    .filter(Boolean)
    .join(", ");
}

const tourSteps: TourStep[] = [
  {
    view: "dashboard",
    eyebrow: "Comece por aqui",
    title: "Monte a proposta e escolha como receber",
    description: "O painel junta cliente, serviço, modelo, valor, prazo, escopo e recebimento para você criar a proposta profissional sem sair da tela.",
    checklist: ["Use cliente, serviço ou template cadastrado", "Escolha PIX direto ou Mercado Pago", "Salve, envie ou gere o PDF quando estiver pronto"],
  },
  {
    view: "proposals",
    eyebrow: "Controle comercial",
    title: "Acompanhe link, PDF e pagamento",
    description: "Aqui ficam as propostas enviadas com link público, PDF, status, reenvio, duplicação e detalhes para entender o que aconteceu com cada venda.",
    checklist: ["Copie o link para WhatsApp ou e-mail", "Abra o PDF profissional do documento", "Veja visualizações, aceite e pagamento nos detalhes"],
  },
  {
    view: "clients",
    eyebrow: "Base de clientes",
    title: "Guarde contatos para vender mais rápido",
    description: "Cadastre clientes com e-mail, telefone e segmento para reaproveitar em novas propostas sem digitar tudo de novo.",
    checklist: ["Cadastre nome e e-mail", "Use segmento para organizar nichos", "Reaproveite clientes no gerador de proposta"],
  },
  {
    view: "services",
    eyebrow: "Biblioteca de serviços",
    title: "Monte preços e entregáveis padrão",
    description: "Serviços cadastrados aceleram a criação de propostas e deixam valores, prazos e escopo mais consistentes.",
    checklist: ["Defina preço base", "Informe prazo comum", "Liste o que está incluso"],
  },
  {
    view: "portfolio",
    eyebrow: "Prova visual",
    title: "Mostre trabalhos anteriores",
    description: "O portfólio ajuda o cliente a confiar antes de discutir preço. As imagens entram na proposta e reforçam seu profissionalismo.",
    checklist: ["Envie imagens dos melhores trabalhos", "Agrupe por categoria", "Use imagens relacionadas ao serviço vendido"],
  },
  {
    view: "testimonials",
    eyebrow: "Prova social",
    title: "Leve depoimentos para a proposta",
    description: "Depoimentos cadastrados ajudam o cliente a validar sua entrega antes de aceitar a proposta online.",
    checklist: ["Cadastre falas curtas e reais", "Informe autor e empresa quando fizer sentido", "Mantenha provas alinhadas ao serviço vendido"],
  },
  {
    view: "brand",
    eyebrow: "Identidade da empresa",
    title: "Configure marca, contatos e PIX",
    description: "Logo, cores, contatos, textos e chave PIX da marca aparecem no fluxo certo da proposta online e do PDF.",
    checklist: ["Adicione logo e contatos comerciais", "Cadastre a chave PIX para recebimento direto", "Ajuste textos e blocos exibidos na proposta"],
  },
  {
    view: "arts",
    eyebrow: "Divulgação",
    title: "Peça artes para vender seus serviços",
    description: "As artes de divulgação usam briefing e referências para transformar serviços, promoções e agenda aberta em materiais aprováveis.",
    checklist: ["Escolha formato e objetivo", "Acompanhe legenda e aprovação", "Baixe o material final quando estiver liberado"],
  },
  {
    view: "templates",
    eyebrow: "Modelos prontos",
    title: "Reaproveite templates de proposta",
    description: "Templates aceleram o preenchimento de serviço, valor, prazo, pagamento, escopo e observações para novos atendimentos.",
    checklist: ["Comece por um modelo do nicho", "Crie modelos recorrentes da sua oferta", "Leve o template para o gerador e ajuste o cliente"],
  },
  {
    view: "plans",
    eyebrow: "Uso e limites",
    title: "Revise plano, créditos e assinatura",
    description: "Planos mostram o acesso atual, limites de propostas, créditos de artes e os caminhos de assinatura conectados ao painel.",
    checklist: ["Confira os limites do plano atual", "Veja os créditos de artes disponíveis", "Escolha um plano quando precisar ampliar o uso"],
  },
];

const proposalTemplates: ProposalTemplate[] = [
  {
    id: "social-media",
    niche: "Social media",
    title: "Gestão mensal de Instagram",
    serviceName: "Gestão de redes sociais",
    price: 1200,
    deadline: "30 dias",
    payment: "Mensal antecipado",
    included: ["Planejamento editorial", "12 posts feed", "8 stories", "Legenda estratégica", "Relatório mensal"],
    notes: "Não inclui impulsionamento de posts nem verba de mídia.",
  },
  {
    id: "designer",
    niche: "Designer",
    title: "Identidade visual",
    serviceName: "Identidade visual profissional",
    price: 1500,
    deadline: "10 dias úteis",
    payment: "50% entrada e 50% entrega",
    included: ["Logo principal", "Logo secundário", "Paleta de cores", "Tipografia", "Mini manual da marca"],
    notes: "Inclui até 2 rodadas de ajustes dentro do escopo aprovado.",
  },
  {
    id: "fotografo",
    niche: "Fotografia",
    title: "Ensaio profissional",
    serviceName: "Ensaio fotográfico profissional",
    price: 900,
    deadline: "7 dias úteis após o ensaio",
    payment: "50% reserva e 50% no dia",
    included: ["Briefing", "2 horas de ensaio", "30 fotos tratadas", "Galeria online", "Entrega digital"],
    notes: "Deslocamentos fora da cidade podem gerar custo adicional.",
  },
  {
    id: "arquiteto",
    niche: "Arquitetura",
    title: "Projeto de interiores",
    serviceName: "Projeto de interiores",
    price: 3500,
    deadline: "25 dias úteis",
    payment: "40% entrada, 30% desenvolvimento e 30% entrega",
    included: ["Levantamento de necessidades", "Layout", "Moodboard", "Projeto 3D", "Lista de compras"],
    notes: "Execução de obra e acompanhamento presencial podem ser contratados à parte.",
  },
  {
    id: "consultor",
    niche: "Consultoria",
    title: "Consultoria estratégica",
    serviceName: "Consultoria estratégica personalizada",
    price: 1800,
    deadline: "4 semanas",
    payment: "Integral no início ou 2 parcelas",
    included: ["Diagnóstico", "Plano de ação", "4 encontros online", "Material de apoio", "Suporte por mensagem"],
    notes: "O resultado depende da execução das ações combinadas pelo cliente.",
  },
  {
    id: "tecnico",
    niche: "Serviço técnico",
    title: "Instalação e manutenção",
    serviceName: "Serviço técnico especializado",
    price: 850,
    deadline: "5 dias úteis",
    payment: "50% entrada e 50% conclusão",
    included: ["Visita técnica", "Diagnóstico", "Instalação ou manutenção", "Teste final", "Garantia de 30 dias"],
    notes: "Peças e materiais podem ser cobrados separadamente após avaliação.",
  },
  {
    id: "manicure",
    niche: "Manicure",
    title: "Pacote de unhas",
    serviceName: "Manicure e alongamento",
    price: 160,
    deadline: "Atendimento em 2 horas",
    payment: "R$ 50 de sinal e restante no atendimento",
    included: ["Cutilagem", "Esmaltação", "Alongamento ou manutenção", "Finalização hidratante", "Garantia de 7 dias"],
    notes: "Materiais especiais, nail art e deslocamento podem alterar o valor final.",
  },
  {
    id: "eletricista",
    niche: "Eletricista",
    title: "Instalação residencial",
    serviceName: "Instalação e revisão elétrica",
    price: 450,
    deadline: "1 dia útil após aprovação",
    payment: "30% para reservar e 70% na conclusão",
    included: ["Visita técnica", "Diagnóstico", "Instalação ou reparo", "Teste de segurança", "Garantia de 30 dias"],
    notes: "Materiais elétricos são cobrados separadamente após avaliação.",
  },
  {
    id: "pedreiro",
    niche: "Pedreiro",
    title: "Reparo e acabamento",
    serviceName: "Serviço de alvenaria e acabamento",
    price: 1200,
    deadline: "5 dias úteis",
    payment: "40% entrada e 60% na entrega",
    included: ["Avaliação do local", "Preparação da área", "Execução do reparo", "Acabamento", "Limpeza básica"],
    notes: "Não inclui compra de materiais, caçamba ou alterações de escopo.",
  },
  {
    id: "diarista",
    niche: "Diarista",
    title: "Limpeza residencial",
    serviceName: "Diarista para limpeza completa",
    price: 220,
    deadline: "1 diária",
    payment: "Pagamento no dia do atendimento",
    included: ["Limpeza de quartos e sala", "Banheiros", "Cozinha", "Área de serviço", "Organização leve"],
    notes: "Não inclui limpeza pesada pós-obra nem produtos específicos.",
  },
  {
    id: "esteticista",
    niche: "Esteticista",
    title: "Protocolo estético",
    serviceName: "Protocolo estético personalizado",
    price: 350,
    deadline: "Sessão de 60 a 90 minutos",
    payment: "50% para agendar e 50% no atendimento",
    included: ["Avaliação inicial", "Higienização", "Procedimento principal", "Orientações de cuidado", "Acompanhamento por mensagem"],
    notes: "Resultado pode variar conforme rotina de cuidados e número de sessões.",
  },
  {
    id: "personal",
    niche: "Personal trainer",
    title: "Plano mensal de treino",
    serviceName: "Acompanhamento personal trainer",
    price: 700,
    deadline: "4 semanas",
    payment: "Mensal antecipado",
    included: ["Avaliação física", "Plano de treino", "8 aulas presenciais ou online", "Ajustes semanais", "Suporte por WhatsApp"],
    notes: "Não inclui academia, equipamentos ou avaliação médica.",
  },
  {
    id: "assistencia",
    niche: "Assistência técnica",
    title: "Diagnóstico e reparo",
    serviceName: "Assistência técnica especializada",
    price: 300,
    deadline: "3 dias úteis após diagnóstico",
    payment: "Diagnóstico na entrada e saldo na retirada",
    included: ["Diagnóstico", "Orçamento de peças", "Mão de obra", "Testes finais", "Garantia do reparo"],
    notes: "Peças são cobradas separadamente e dependem de disponibilidade.",
  },
];

const marketingArtBriefs = [
  {
    id: "sell_service",
    label: "Serviço",
    objective: "Divulgar um serviço profissional destacando benefício, confiança, atendimento rápido e pedido de orçamento pelo WhatsApp.",
    callToAction: "Peça seu orçamento",
  },
  {
    id: "promotion",
    label: "Promocao",
    objective: "Divulgar uma promocao com oferta clara, senso de oportunidade, beneficio principal e chamada direta para comprar ou chamar no WhatsApp.",
    callToAction: "Quero aproveitar",
  },
  {
    id: "product",
    label: "Produto",
    objective: "Divulgar um produto com destaque para desejo, benefício, preço ou condição especial e chamada para comprar.",
    callToAction: "Quero comprar",
  },
  {
    id: "menu",
    label: "Cardapio",
    objective: "Divulgar comida, combo, marmita, lanche, açaí ou cardápio com apelo de sabor, praticidade e pedido rápido.",
    callToAction: "Fazer pedido",
  },
  {
    id: "notice",
    label: "Aviso",
    objective: "Comunicar um aviso importante de forma clara, bonita e fácil de entender.",
    callToAction: "Saiba mais",
  },
  {
    id: "open_slots",
    label: "Agenda aberta",
    objective: "Avisar que a agenda está aberta, mostrar o principal resultado do serviço e incentivar a pessoa a reservar um horário.",
    callToAction: "Reservar horário",
  },
  {
    id: "online_presence",
    label: "Presença online",
    objective: "Divulgar criação de site ou presença online mostrando que o negócio fica mais profissional, fácil de encontrar e pronto para receber orçamentos.",
    callToAction: "Quero meu site",
  },
];

const quickIncludedSuggestions = [
  "Atendimento inicial",
  "Diagnostico ou briefing",
  "Execução do serviço",
  "Materiais inclusos",
  "Ajustes combinados",
  "Entrega final",
  "Suporte após entrega",
];

const quickExampleProposal: ProposalDraft = {
  ...blankDraft,
  clientName: "Cliente exemplo",
  serviceName: "Servico profissional",
  price: 1200,
  deadline: "7 dias uteis",
  validUntil: nextWeekDate(),
  payment: "50% na entrada e 50% na entrega",
  included: ["Atendimento inicial", "Execução do serviço", "Ajustes combinados", "Entrega final"],
  notes: "Esta proposta pode ser ajustada conforme combinação com o cliente.",
};

type MaterialMode = "general" | "paint" | "area";
type CalculatorNiche = "construction" | "food" | "beauty" | "events" | "technology" | "automotive" | "health" | "general";
type MaterialItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  mode: MaterialMode;
  area: number;
  coats: number;
  coverage: number;
  wastePercent: number;
  packageSize: number;
};

const emptyMaterialItem: MaterialItem = {
  name: "",
  quantity: 1,
  unitPrice: 0,
  mode: "general",
  area: 0,
  coats: 2,
  coverage: 90,
  wastePercent: 10,
  packageSize: 18,
};

type CalculatorPreset = { label: string; serviceName: string; niches: CalculatorNiche[]; laborValue: number; marginPercent: number; items: MaterialItem[] };

const calculatorPresets: CalculatorPreset[] = [
  {
    label: "Pintura",
    serviceName: "Pintura residencial",
    niches: ["construction"],
    laborValue: 900,
    marginPercent: 20,
    items: [
      { ...emptyMaterialItem, name: "Tinta acrilica 18L", mode: "paint", unitPrice: 320, area: 80, coats: 2, coverage: 90, packageSize: 18, wastePercent: 10 },
      { ...emptyMaterialItem, name: "Massa corrida", mode: "area", unitPrice: 8, area: 30, wastePercent: 10 },
      { ...emptyMaterialItem, name: "Lixa", mode: "general", quantity: 10, unitPrice: 4 },
      { ...emptyMaterialItem, name: "Fita crepe", mode: "general", quantity: 3, unitPrice: 12 },
    ],
  },
  {
    label: "Piso/revestimento",
    serviceName: "Instalacao de piso ou revestimento",
    niches: ["construction"],
    laborValue: 1200,
    marginPercent: 18,
    items: [
      { ...emptyMaterialItem, name: "Piso ou revestimento", mode: "area", unitPrice: 75, area: 25, wastePercent: 12 },
      { ...emptyMaterialItem, name: "Argamassa", mode: "general", quantity: 8, unitPrice: 32 },
      { ...emptyMaterialItem, name: "Rejunte", mode: "general", quantity: 3, unitPrice: 28 },
    ],
  },
  {
    label: "Alvenaria/tijolo",
    serviceName: "Servico de alvenaria",
    niches: ["construction"],
    laborValue: 1400,
    marginPercent: 18,
    items: [
      { ...emptyMaterialItem, name: "Tijolo/bloco", mode: "area", unitPrice: 65, area: 20, wastePercent: 10 },
      { ...emptyMaterialItem, name: "Cimento", mode: "general", quantity: 8, unitPrice: 38 },
      { ...emptyMaterialItem, name: "Areia", mode: "general", quantity: 2, unitPrice: 180 },
      { ...emptyMaterialItem, name: "Cal/aditivo", mode: "general", quantity: 3, unitPrice: 32 },
      { ...emptyMaterialItem, name: "Ferragens e amarracoes", mode: "general", quantity: 1, unitPrice: 160 },
    ],
  },
  {
    label: "Eletrica",
    serviceName: "Instalacao eletrica",
    niches: ["construction"],
    laborValue: 850,
    marginPercent: 20,
    items: [
      { ...emptyMaterialItem, name: "Cabo eletrico", mode: "general", quantity: 50, unitPrice: 4 },
      { ...emptyMaterialItem, name: "Tomadas/interruptores", mode: "general", quantity: 8, unitPrice: 18 },
      { ...emptyMaterialItem, name: "Disjuntores", mode: "general", quantity: 3, unitPrice: 35 },
    ],
  },
  {
    label: "Hidraulica",
    serviceName: "Servico hidraulico",
    niches: ["construction"],
    laborValue: 750,
    marginPercent: 20,
    items: [
      { ...emptyMaterialItem, name: "Tubos e conexoes", mode: "general", quantity: 1, unitPrice: 220 },
      { ...emptyMaterialItem, name: "Registros/valvulas", mode: "general", quantity: 2, unitPrice: 65 },
      { ...emptyMaterialItem, name: "Vedantes e cola", mode: "general", quantity: 1, unitPrice: 45 },
    ],
  },
  {
    label: "Buffet por pessoa",
    serviceName: "Buffet para evento",
    niches: ["food", "events"],
    laborValue: 900,
    marginPercent: 25,
    items: [
      { ...emptyMaterialItem, name: "Comida por convidado", mode: "general", quantity: 50, unitPrice: 42 },
      { ...emptyMaterialItem, name: "Bebidas por convidado", mode: "general", quantity: 50, unitPrice: 18 },
      { ...emptyMaterialItem, name: "Descartaveis/loucas", mode: "general", quantity: 50, unitPrice: 6 },
      { ...emptyMaterialItem, name: "Equipe de atendimento", mode: "general", quantity: 3, unitPrice: 180 },
      { ...emptyMaterialItem, name: "Frete/logistica", mode: "general", quantity: 1, unitPrice: 250 },
    ],
  },
  {
    label: "Doces e salgados",
    serviceName: "Doces e salgados para evento",
    niches: ["food", "events"],
    laborValue: 250,
    marginPercent: 30,
    items: [
      { ...emptyMaterialItem, name: "Salgados cento", mode: "general", quantity: 5, unitPrice: 85 },
      { ...emptyMaterialItem, name: "Docinhos cento", mode: "general", quantity: 3, unitPrice: 95 },
      { ...emptyMaterialItem, name: "Bolo kg", mode: "general", quantity: 5, unitPrice: 75 },
      { ...emptyMaterialItem, name: "Embalagens", mode: "general", quantity: 1, unitPrice: 90 },
    ],
  },
  {
    label: "Decoracao evento",
    serviceName: "Decoracao de evento",
    niches: ["events"],
    laborValue: 700,
    marginPercent: 25,
    items: [
      { ...emptyMaterialItem, name: "Flores/baloes", mode: "general", quantity: 1, unitPrice: 480 },
      { ...emptyMaterialItem, name: "Paineis e estruturas", mode: "general", quantity: 1, unitPrice: 650 },
      { ...emptyMaterialItem, name: "Mesa e suportes", mode: "general", quantity: 1, unitPrice: 260 },
      { ...emptyMaterialItem, name: "Transporte/montagem", mode: "general", quantity: 1, unitPrice: 300 },
    ],
  },
  {
    label: "Beleza/estetica",
    serviceName: "Procedimento estetico",
    niches: ["beauty", "health"],
    laborValue: 180,
    marginPercent: 35,
    items: [
      { ...emptyMaterialItem, name: "Produtos profissionais", mode: "general", quantity: 1, unitPrice: 90 },
      { ...emptyMaterialItem, name: "Descartaveis", mode: "general", quantity: 1, unitPrice: 25 },
      { ...emptyMaterialItem, name: "Equipamentos/uso sala", mode: "general", quantity: 1, unitPrice: 60 },
    ],
  },
  {
    label: "Site/sistema",
    serviceName: "Desenvolvimento de site ou sistema",
    niches: ["technology"],
    laborValue: 2500,
    marginPercent: 20,
    items: [
      { ...emptyMaterialItem, name: "Horas de desenvolvimento", mode: "general", quantity: 40, unitPrice: 90 },
      { ...emptyMaterialItem, name: "Dominio/hospedagem/setup", mode: "general", quantity: 1, unitPrice: 280 },
      { ...emptyMaterialItem, name: "Ferramentas/licencas", mode: "general", quantity: 1, unitPrice: 180 },
    ],
  },
  {
    label: "Automotivo",
    serviceName: "Servico automotivo",
    niches: ["automotive"],
    laborValue: 350,
    marginPercent: 22,
    items: [
      { ...emptyMaterialItem, name: "Pecas", mode: "general", quantity: 1, unitPrice: 420 },
      { ...emptyMaterialItem, name: "Oleo/fluidos/insumos", mode: "general", quantity: 1, unitPrice: 180 },
      { ...emptyMaterialItem, name: "Deslocamento/logistica", mode: "general", quantity: 1, unitPrice: 80 },
    ],
  },
  {
    label: "Servico geral",
    serviceName: "Servico personalizado",
    niches: ["general"],
    laborValue: 500,
    marginPercent: 20,
    items: [
      { ...emptyMaterialItem, name: "Material principal", mode: "general", quantity: 1, unitPrice: 250 },
      { ...emptyMaterialItem, name: "Insumos", mode: "general", quantity: 1, unitPrice: 90 },
      { ...emptyMaterialItem, name: "Deslocamento", mode: "general", quantity: 1, unitPrice: 80 },
    ],
  },
];

function calculatorNicheFromProfile(niche?: string | null, segment?: string | null, proposalSegment?: string | null): CalculatorNiche {
  const text = `${niche || ""} ${segment || ""} ${proposalSegment || ""}`.toLowerCase();
  if (/(constru|obra|reforma|pedreiro|pint|piso|revest|arquitet|engenh|eletric|hidraul|marcen|moveis|imovel|condomini)/.test(text)) return "construction";
  if (/(buffet|alimenta|comida|doce|salgad|bolo|gastronom|restaurante|food|bar|bebida)/.test(text)) return "food";
  if (/(evento|festa|casamento|decor|fotograf|cerimonial)/.test(text)) return "events";
  if (/(beleza|estet|manicure|cabelo|sobrancelha|maqui|spa)/.test(text)) return "beauty";
  if (/(saude|clinica|terapia|fisio|nutri|personal|bem-estar)/.test(text)) return "health";
  if (/(tecnolog|site|sistema|software|design|marketing|social media|trafego)/.test(text)) return "technology";
  if (/(auto|carro|mecan|oficina|veiculo|funilaria)/.test(text)) return "automotive";
  return "general";
}


function NavGroup({
  group,
  activeView,
  currentPlan,
  currentTourStep,
  isOpen,
  onToggle,
  onSelectItem,
}: {
  group: { id: string; label: string; icon: React.ElementType; items: ActiveView[] };
  activeView: ActiveView;
  currentPlan: PlanCode;
  currentTourStep: TourStep | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectItem: (view: ActiveView) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const Icon = group.icon;
  const groupActive = group.items.includes(activeView);
  const tourFocus = currentTourStep ? group.items.includes(currentTourStep.view) : false;

  useEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }
    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 224; // w-56
      const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
      setMenuPos({ top: rect.bottom + 4, left: Math.max(8, left) });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0 sm:flex-1">
      <button
        ref={buttonRef}
        className={`fp-nav-item flex min-h-[58px] w-[4.25rem] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-black leading-none sm:w-full sm:min-w-[52px] sm:text-[11px] ${tourFocus ? "ring-2 ring-green-300 ring-offset-2 ring-offset-[var(--app-bg)]" : ""}`}
        data-active={groupActive}
        type="button"
        aria-expanded={isOpen}
        title={group.label}
        onClick={onToggle}
      >
        <Icon size={16} />
        <span className="mt-0.5 line-clamp-2 max-w-full text-center sm:line-clamp-none sm:whitespace-nowrap">{group.label} ▾</span>
      </button>

      {isOpen && menuPos
        ? createPortal(
            <>
              <button aria-label="Fechar menu" className="fixed inset-0 z-40 cursor-default" type="button" onClick={onToggle} />
              <div
                className="fixed z-50 grid w-56 gap-1 rounded-lg border border-black/10 bg-white p-1.5 shadow-xl shadow-slate-900/20"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                {group.items.map((id) => {
                  const item = navItems.find((navItem) => navItem.id === id);
                  if (!item) return null;
                  const ItemIcon = item.icon;
                  const active = activeView === item.id;
                  const locked = !canUseModule(item.id, currentPlan);
                  return (
                    <button
                      className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-left text-sm font-black text-slate-700 data-[active=true]:bg-green-50 data-[active=true]:text-green-800 hover:bg-slate-50"
                      data-active={active}
                      key={item.id}
                      type="button"
                      onClick={() => onSelectItem(item.id)}
                    >
                      <ItemIcon size={16} />
                      <span className="flex-1">{item.label}</span>
                      {locked ? <LockKeyhole size={12} /> : null}
                    </button>
                  );
                })}
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

function NavBar({
  activeView,
  currentPlan,
  currentTourStep,
  onSelect,
  onNotice,
}: {
  activeView: ActiveView;
  currentPlan: PlanCode;
  currentTourStep: TourStep | null;
  onSelect: (view: ActiveView) => void;
  onNotice: (message: string | null) => void;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  function handleSelect(view: ActiveView) {
    setOpenGroup(null);
    if (!canUseModule(view, currentPlan)) {
      onNotice(`O módulo ${navItems.find((item) => item.id === view)?.label} está disponível a partir do plano ${requiredPlanLabel(view)}.`);
      onSelect("plans");
      return;
    }
    onSelect(view);
  }

  return (
    <nav className="fp-nav relative flex gap-1 overflow-x-auto rounded-lg border p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {directNavIds.map((id) => {
        const item = navItems.find((navItem) => navItem.id === id);
        if (!item) return null;
        const Icon = item.icon;
        const active = activeView === item.id;
        const locked = !canUseModule(item.id, currentPlan);
        const tourFocus = currentTourStep?.view === item.id;
        return (
          <button
            className={`fp-nav-item flex min-h-[58px] w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-black leading-none sm:w-auto sm:min-w-[52px] sm:flex-1 sm:text-[11px] ${tourFocus ? "ring-2 ring-green-300 ring-offset-2 ring-offset-[var(--app-bg)]" : ""}`}
            data-active={active}
            data-locked={locked}
            key={item.id}
            type="button"
            title={locked ? `Disponível a partir do plano ${requiredPlanLabel(item.id)}` : item.label}
            onClick={() => handleSelect(item.id)}
          >
            <Icon size={16} />
            <span className="mt-0.5 line-clamp-2 max-w-full text-center sm:line-clamp-none sm:whitespace-nowrap">{item.label}</span>
            {locked ? <LockKeyhole size={10} /> : null}
          </button>
        );
      })}

      {navGroups.map((group) => (
        <NavGroup
          key={group.id}
          group={group}
          activeView={activeView}
          currentPlan={currentPlan}
          currentTourStep={currentTourStep}
          isOpen={openGroup === group.id}
          onToggle={() => setOpenGroup((current) => (current === group.id ? null : group.id))}
          onSelectItem={handleSelect}
        />
      ))}
    </nav>
  );
}

export default function Home() {
  const [session, setSession] = useState<SessionProfile | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [dark, setDark] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProposalDraft>(blankDraft);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [lastSavedProposal, setLastSavedProposal] = useState<Proposal | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsSummary, setProposalsSummary] = useState<any | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [marketingArts, setMarketingArts] = useState<MarketingArt[]>([]);
  const [customProposalTemplates, setCustomProposalTemplates] = useState<ProposalTemplate[]>([]);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const hasPaidAccess = Boolean(
    billing &&
      ["active", "trial"].includes(billing.subscription.status) &&
      ["mercadopago", "admin"].includes(billing.subscription.provider || ""),
  );
  const currentPlan = billing?.subscription.plan || "start";
  const availableTourSteps = useMemo(
    () => tourSteps.filter((step) => canUseModule(step.view, currentPlan)),
    [currentPlan],
  );
  const onboardingIncomplete = Boolean(
    session &&
      brand &&
      (!brand.businessName || brand.businessName === session.name || !brand.whatsapp) &&
      services.length === 0,
  );
  const currentTourStep = tourStepIndex === null ? null : availableTourSteps[tourStepIndex] || null;
  const allProposalTemplates = useMemo(
    () => [...customProposalTemplates, ...filterReadyProposalTemplates(session?.niche, session?.segment)],
    [customProposalTemplates, session?.niche, session?.segment],
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user: SessionProfile | null }) => {
        setSession(data.user);
        if (data.user) loadDashboardData();
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (currentTourStep && !onboardingIncomplete && activeView !== currentTourStep.view) {
      setActiveView(currentTourStep.view);
    }
  }, [activeView, currentTourStep, onboardingIncomplete]);

  useEffect(() => {
    if (canUseModule(activeView, currentPlan)) return;
    setNotice(`Módulo disponível a partir do plano ${requiredPlanLabel(activeView)}.`);
    setActiveView("plans");
  }, [activeView, currentPlan]);

  useEffect(() => {
    if (tourStepIndex === null || tourStepIndex < availableTourSteps.length) return;
    setTourStepIndex(Math.max(availableTourSteps.length - 1, 0));
  }, [availableTourSteps.length, tourStepIndex]);

  useEffect(() => {
    if (!session || onboardingIncomplete) return;
    if (typeof window === "undefined") return;
    setShowUpdatesModal(localStorage.getItem(keys.updatesModal) !== "seen");
  }, [onboardingIncomplete, session]);

  async function loadDashboardData() {
    const [brandData, billingData, clientsData, servicesData, portfolioData, testimonialsData, marketingArtsData, proposalTemplatesData] = await Promise.allSettled([
      apiGet<BrandProfile>("/api/brand"),
      apiGet<BillingState>("/api/billing/plan"),
      apiGet<Client[]>("/api/clients"),
      apiGet<ServiceItem[]>("/api/services"),
      apiGet<PortfolioItem[]>("/api/portfolio"),
      apiGet<Testimonial[]>("/api/testimonials"),
      // proposals list will be loaded paginated below to avoid fetching the full array
      apiGet<MarketingArt[]>("/api/marketing-arts"),
      apiGet<ProposalTemplate[]>("/api/proposal-templates"),
    ]);

    const failedLoads: string[] = [];
    const applyResult = <T,>(result: PromiseSettledResult<T>, setter: (value: T) => void, label: string) => {
      if (result.status === "fulfilled") {
        setter(result.value);
      } else {
        failedLoads.push(label);
      }
    };

    applyResult(brandData, setBrand, "marca");
    applyResult(billingData, setBilling, "assinatura");
    applyResult(clientsData, setClients, "clientes");
    applyResult(servicesData, setServices, "serviços");
    applyResult(portfolioData, setPortfolio, "portfólio");
    applyResult(testimonialsData, setTestimonials, "depoimentos");
    // load first page and summary separately to reduce payload
    try {
      const pageResponse = await apiGet<{ items: Proposal[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/proposals?page=1&pageSize=50`);
      setProposals(pageResponse.items);
    } catch {
      // fallback: try the old endpoint
      try {
        // @ts-ignore
        const all = await apiGet<Proposal[]>("/api/proposals");
        setProposals(all);
      } catch {
        // ignore
      }
    }

    try {
      const summary = await apiGet<any>("/api/proposals/summary");
      setProposalsSummary(summary);
    } catch {
      setProposalsSummary(null);
    }
    applyResult(marketingArtsData, setMarketingArts, "artes");
    applyResult(proposalTemplatesData, setCustomProposalTemplates, "templates");

    if (billingData.status === "fulfilled" && !(["active", "trial"].includes(billingData.value.subscription.status) && ["mercadopago", "admin"].includes(billingData.value.subscription.provider || ""))) {
      setNotice("Escolha um plano e conclua o pagamento pelo Mercado Pago para liberar a criação de propostas.");
      setActiveView("plans");
    }

    if (failedLoads.length) {
      setNotice((current) => current || `Alguns dados não carregaram agora: ${failedLoads.join(", ")}. Você ainda pode usar o painel e tentar novamente.`);
    }
  }

  if (!session) {
    return (
      <AuthScreen />
    );
  }

  function updateDraft<K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openNewProposal() {
    setEditingProposalId(null);
    setDraft({ ...blankDraft, validUntil: nextWeekDate() });
    setShowProposalForm(true);
  }

  async function saveProposal(status: ProposalStatus = "sent") {
    const validationError = validateProposalDraft(draft);
    if (validationError) {
      setNotice(validationError);
      return null;
    }
    if (draft.checkoutMode === "pix" && !brand?.pixKey) {
      setNotice("Cadastre uma chave PIX na aba Marca antes de escolher recebimento por PIX.");
      return null;
    }
    const includedItems = cleanIncludedItems(draft.included);
    if (!includedItems.length && !window.confirm("Sua proposta está sem itens inclusos. Deseja salvar assim mesmo?")) {
      return null;
    }

    if (!editingProposalId) {
      const isDuplicate = proposals.some(
        (p) =>
          p.clientName.trim().toLowerCase() === draft.clientName.trim().toLowerCase() &&
          p.serviceName.trim().toLowerCase() === draft.serviceName.trim().toLowerCase(),
      );
      if (isDuplicate && !window.confirm("Já existe uma proposta para este cliente com o mesmo serviço. Deseja criar assim mesmo?")) {
        return null;
      }
    }

    try {
      const existingClient = clients.find((client) => client.name.trim().toLowerCase() === draft.clientName.trim().toLowerCase());
      const existingService = services.find((service) => service.name.trim().toLowerCase() === draft.serviceName.trim().toLowerCase());
      if (editingProposalId) {
        const result = await apiPatch<Proposal>(`/api/proposals/${editingProposalId}`, {
          ...draft,
          clientEmail: draft.clientEmail?.trim() || "",
          included: includedItems,
          status,
        });
          setProposals((current) => current.map((item) => (item.id === result.id ? result : item)));
          try {
            const summary = await apiGet<any>("/api/proposals/summary");
            setProposalsSummary(summary);
          } catch {}
          if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("fechapro:proposals-updated"));
        setLastSavedProposal(result);
        setNotice("Proposta atualizada com sucesso.");
        setShowProposalForm(false);
        setEditingProposalId(null);
        setDraft({ ...blankDraft, validUntil: nextWeekDate() });
        return result;
      }

      const result = await apiPost<Proposal & { clientEmailSent?: boolean }>("/api/proposals", {
        ...draft,
        clientEmail: draft.clientEmail?.trim() || "",
        included: includedItems,
        status,
      });
      setProposals((current) => [result, ...current]);
      try {
        const summary = await apiGet<any>("/api/proposals/summary");
        setProposalsSummary(summary);
      } catch {}
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("fechapro:proposals-updated"));
      setLastSavedProposal(result);
      if (!existingClient) {
        try {
          const client = await apiPost<Client>("/api/clients", {
            name: draft.clientName.trim(),
            email: draft.clientEmail?.trim() || "",
            phone: "",
            segment: draft.segment === "auto" ? "" : proposalSegmentLabel(draft.segment),
            interestService: draft.serviceName.trim(),
            status: "lead",
            notes: "Criado automaticamente a partir de uma proposta.",
          });
          setClients((current) => [client, ...current]);
        } catch {
          setNotice("Proposta salva. Não foi possível salvar o cliente automaticamente.");
        }
      }
      if (!existingService && !draft.serviceName.includes(" + ")) {
        try {
          const service = await apiPost<ServiceItem>("/api/services", {
            name: draft.serviceName.trim(),
            price: draft.price,
            deadline: draft.deadline.trim(),
            includes: includedItems,
          });
          setServices((current) => [service, ...current]);
        } catch {
          setNotice("Proposta salva. Não foi possível salvar o serviço automaticamente.");
        }
      }
      const emailNote = result.clientEmailSent
        ? " E-mail enviado ao cliente."
        : draft.clientEmail
          ? ""
          : " Sem e-mail do cliente - proposta não foi enviada por e-mail.";
      setNotice(`Proposta salva com sucesso.${emailNote}`);
      setShowProposalForm(false);
      setBilling((current) =>
        current
          ? {
              ...current,
              usage: {
                ...current.usage,
                proposalsThisMonth: current.usage.proposalsThisMonth + 1,
              },
            }
          : current,
      );
      setDraft({ ...blankDraft, validUntil: nextWeekDate() });
      return result;
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Não foi possível salvar a proposta.");
      return null;
    }
  }

  async function saveProposalAndOpenPdf() {
    const result = await saveProposal("sent");
    if (result?.publicSlug) {
      window.open(`/p/${result.publicSlug}/pdf`, "_blank", "noopener,noreferrer");
    }
  }

  async function seedExamples() {
    const [clientOne, clientTwo] = await Promise.all([
      apiPost<Client>("/api/clients", { name: "Maria Eduarda", email: "maria@email.com", phone: "(11) 99999-1111", segment: "Moda" }),
      apiPost<Client>("/api/clients", { name: "Clinica Aura", email: "contato@aura.com", phone: "(21) 98888-2222", segment: "Estetica" }),
    ]);
    const [serviceOne, serviceTwo] = await Promise.all([
      apiPost<ServiceItem>("/api/services", {
        name: "Identidade visual",
        price: 1200,
        deadline: "7 dias úteis",
        includes: ["Logo", "Paleta de cores", "Tipografia", "5 modelos de posts"],
      }),
      apiPost<ServiceItem>("/api/services", {
        name: "Gestão de tráfego",
        price: 1800,
        deadline: "30 dias",
        includes: ["Planejamento", "Campanhas Meta Ads", "Relatório semanal"],
      }),
    ]);
    const testimonial = await apiPost<Testimonial>("/api/testimonials", {
      authorName: "Ana Paula",
      company: "Studio AP",
      quote: "A proposta ficou clara, bonita e ajudou a aprovar o projeto mais rápido.",
    });
    const proposal = await apiPost<Proposal>("/api/proposals", {
        clientName: "Maria Eduarda",
        serviceName: "Identidade visual para loja de roupas",
        price: 1200,
        deadline: "7 dias úteis",
        validUntil: nextWeekDate(),
        payment: "50% entrada e 50% entrega",
        included: ["Logo", "Paleta de cores", "Tipografia", "5 modelos de posts"],
        notes: "",
        status: "viewed",
    });

    setClients((current) => [clientOne, clientTwo, ...current]);
    setServices((current) => [serviceOne, serviceTwo, ...current]);
    setTestimonials((current) => [testimonial, ...current]);
    setProposals((current) => [proposal, ...current]);
    setBilling((current) =>
      current
        ? {
            ...current,
            usage: {
              ...current.usage,
              proposalsThisMonth: current.usage.proposalsThisMonth + 1,
            },
          }
        : current,
    );
  }

  async function changeProposalStatus(id: string, status: ProposalStatus) {
    await apiPatch(`/api/proposals/${id}`, { status });
    setProposals((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function removeProposal(id: string) {
    try {
      await apiDelete(`/api/proposals/${id}`);
      setProposals((current) => current.filter((item) => item.id !== id));
      setNotice("Proposta removida.");
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : "Não foi possível remover a proposta.");
    }
  }

  async function resendProposal(id: string) {
    const result = await apiPost<Proposal & { clientEmailSent?: boolean }>(`/api/proposals/${id}/resend`, {});
    setProposals((current) => current.map((item) => (item.id === id ? result : item)));
    const emailNote = result.clientEmailSent ? " E-mail enviado ao cliente." : " Sem e-mail do cliente cadastrado.";
    setNotice(`Proposta reenviada.${emailNote}`);
  }

  async function sendSatisfactionSurvey(id: string) {
    const result = await apiPost<NonNullable<Proposal["satisfactionSurvey"]> & { emailSent?: boolean }>(`/api/proposals/${id}/satisfaction/send`, {});
    setProposals((current) => current.map((item) => (item.id === id ? { ...item, satisfactionSurvey: result } : item)));
    setNotice(result.emailSent ? "Serviço finalizado e pesquisa de satisfação enviada ao cliente." : "Serviço finalizado e pesquisa liberada.");
  }

  function copySatisfactionSurveyLink(proposal?: Proposal | null) {
    if (!proposal?.publicSlug) return;
    if (!proposal.satisfactionSurvey?.serviceCompletedAt) {
      setNotice("Finalize o serviço para liberar o link da pesquisa.");
      return;
    }
    navigator.clipboard.writeText(`${window.location.origin}/p/${proposal.publicSlug}#satisfacao`);
    setNotice("Link da pesquisa copiado para enviar no WhatsApp.");
  }

  function duplicateProposal(id: string) {
    const original = proposals.find((item) => item.id === id);
    if (!original) return;
    setDraft(proposalToDraft(original));
    setEditingProposalId(null);
    setShowProposalForm(true);
    setNotice("Dados copiados da proposta. Ajuste e salve para criar a nova proposta.");
  }

  function proposalToDraft(proposal: Proposal): ProposalDraft {
    return {
      templateId: "",
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail || "",
      serviceName: proposal.serviceName,
      price: proposal.price,
      deadline: proposal.deadline,
      validUntil: proposal.validUntil || "",
      payment: proposal.payment || "",
      documentType: proposal.documentType || "auto",
      segment: proposal.segment || "auto",
      checkoutMode: proposal.checkoutMode || "mercadopago",
      included: proposal.included || [],
      notes: proposal.notes || "",
    };
  }

  function editProposal(proposal: Proposal) {
    setDraft(proposalToDraft(proposal));
    setEditingProposalId(proposal.id);
    setShowProposalForm(true);
  }

  async function confirmPixPayment(id: string) {
    const result = await apiPost<Proposal>(`/api/proposals/${id}/confirm-pix`, {});
    setProposals((current) => current.map((item) => (item.id === id ? result : item)));
    setNotice("Pagamento confirmado. Cliente notificado por e-mail.");
  }

  function copyProposalLink(slug?: string) {
    if (!slug) return;
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setNotice("Link da proposta copiado.");
  }

  async function createMarketingArt(payload: {
    title: string;
    format: string;
    objective: string;
    serviceName: string;
    audience: string;
    callToAction: string;
    referenceImageUrl: string | null;
    referenceImageUrls?: string[] | null;
    useImageAsBackground: boolean;
  }) {
    const item = await apiPost<MarketingArt>("/api/marketing-arts", payload);
    setMarketingArts((current) => [item, ...current]);
    setBilling((current) =>
      current
        ? {
            ...current,
            usage: {
              ...current.usage,
              artsThisMonth: current.usage.artsThisMonth + 1,
            },
          }
        : current,
    );
      setNotice("Solicitação enviada. A equipe vai preparar a arte e anexar para sua aprovação.");
    return item;
  }

  async function approveMarketingArt(id: string) {
    const item = await apiPatch<MarketingArt>(`/api/marketing-arts/${id}`, { action: "approve" });
    setMarketingArts((current) => current.map((art) => (art.id === id ? item : art)));
    setNotice("Arte aprovada. Download liberado.");
  }

  async function removeMarketingArt(id: string) {
    await apiDelete(`/api/marketing-arts/${id}`);
    setMarketingArts((current) => current.filter((item) => item.id !== id));
    setNotice("Arte removida.");
  }

  function startTour() {
    if (onboardingIncomplete) {
      setNotice("Conclua a configuração inicial para liberar o acesso guiado.");
      return;
    }
    if (!availableTourSteps.length) return;
    setShowUpdatesModal(false);
    setTourStepIndex(0);
    setActiveView(availableTourSteps[0].view);
  }

  function moveTour(direction: 1 | -1) {
    if (!availableTourSteps.length) return;
    setTourStepIndex((current) => {
      const next = Math.min(Math.max((current ?? 0) + direction, 0), availableTourSteps.length - 1);
      setActiveView(availableTourSteps[next].view);
      return next;
    });
  }

  function closeUpdatesModal() {
    setShowUpdatesModal(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(keys.updatesModal, "seen");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]" data-theme={dark ? "dark" : "light"}>
      <header className="fp-shell-header sticky top-0 z-20 border-b border-black/10 px-4 py-3 backdrop-blur sm:py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Image alt="FechaPro" className="mb-3 h-9 w-36 object-contain" src="/brand/logofechapro.png" width={144} height={36} />
            <h1 className="max-w-xs text-xl font-black leading-tight tracking-normal sm:max-w-none sm:text-3xl">
              Sua central comercial para criar propostas que vendem.
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Olá, {brand?.businessName || session.name}
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-wrap gap-2 self-start sm:w-auto sm:self-auto">
            {session.isAdmin ? (
              <a className="inline-grid h-10 min-w-10 place-items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950" href="/admin">
                Admin geral
              </a>
            ) : null}
            {!onboardingIncomplete ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
                type="button"
                onClick={openNewProposal}
              >
                <Plus size={16} />
                Nova proposta
              </button>
            ) : null}
            <IconButton label="Ver novidades" icon={Megaphone} onClick={() => setShowUpdatesModal(true)} />
            <IconButton label="Iniciar acesso guiado" icon={Sparkles} onClick={startTour} />
            <IconButton label={dark ? "Usar tema claro" : "Usar tema escuro"} icon={dark ? Sun : Moon} onClick={() => setDark((current) => !current)} />
            <IconButton
              label="Sair"
              icon={LogOut}
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" });
                setSession(null);
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-4 p-4 sm:p-6">
        {onboardingIncomplete ? (
          <OnboardingView
            brand={
            brand || {
                businessName: session.name,
                logoUrl: null,
                primaryColor: "#22C55E",
                secondaryColor: "#0F172A",
                accentColor: "#2563EB",
                whatsapp: null,
                pixKey: null,
                instagram: null,
                email: session.email,
                website: null,
                bio: null,
                proposalStyle: "executive",
                proposalIntro: null,
                proposalClosing: null,
                proposalTerms: null,
                proposalFaq: null,
                showPortfolio: true,
                showTestimonials: true,
                showServices: true,
                showFaq: true,
              }
            }
            session={session}
            onComplete={(savedBrand, service) => {
              setBrand(savedBrand);
              setServices((current) => [service, ...current]);
              setDraft((current) => ({
                ...current,
                serviceName: service.name,
                price: service.price,
                deadline: service.deadline || "",
                included: service.includes,
                payment: current.payment || "50% entrada e 50% na entrega",
              }));
              setNotice("Configuração concluída. Agora você já pode criar sua primeira proposta.");
              setActiveView("dashboard");
            }}
          />
        ) : (
          <>
            <NavBar
              activeView={activeView}
              currentPlan={currentPlan}
              currentTourStep={currentTourStep}
              onSelect={setActiveView}
              onNotice={setNotice}
            />

            {activeView === "dashboard" ? (
          <DashboardView
            clients={clients}
            brand={
              brand || {
                businessName: session.name,
                logoUrl: null,
                primaryColor: "#22C55E",
                secondaryColor: "#0F172A",
                accentColor: "#2563EB",
                whatsapp: null,
                pixKey: null,
                instagram: null,
                email: session.email,
                website: null,
                bio: null,
                proposalStyle: "executive",
                proposalIntro: null,
                proposalClosing: null,
                proposalTerms: null,
                proposalFaq: null,
                showPortfolio: true,
                showTestimonials: true,
                showServices: true,
                showFaq: true,
              }
            }
            onNewProposal={openNewProposal}
            billing={billing}
            notice={notice}
            onNotice={setNotice}
            lastSavedProposal={lastSavedProposal}
            onLastSavedProposalDismiss={() => setLastSavedProposal(null)}
            proposals={proposals}
            services={services}
          />
            ) : null}

            {activeView === "proposals" ? (
              <ProposalsView
                currentPlan={currentPlan}
                notice={notice}
                onNotice={setNotice}
                onCopyLink={copyProposalLink}
                onConfirmPix={confirmPixPayment}
                onDuplicate={duplicateProposal}
                onEdit={editProposal}
                onRemove={removeProposal}
                onResend={resendProposal}
                onSatisfactionSurveySend={sendSatisfactionSurvey}
                onSatisfactionSurveyLinkCopy={copySatisfactionSurveyLink}
                onStatusChange={changeProposalStatus}
                proposals={proposals}
                proposalsSummary={proposalsSummary}
                onNewProposal={openNewProposal}
              />
            ) : null}

            {activeView === "clients" ? <ClientsView clients={clients} onChange={setClients} /> : null}
            {activeView === "services" ? <ServicesView services={services} onChange={setServices} /> : null}
            {activeView === "portfolio" ? <PortfolioView portfolio={portfolio} onChange={setPortfolio} /> : null}
            {activeView === "testimonials" ? (
              <TestimonialsView testimonials={testimonials} onChange={setTestimonials} />
            ) : null}
            {activeView === "brand" ? (
              <BrandView brand={brand} session={session} onChange={setBrand} />
            ) : null}
            {activeView === "arts" ? (
              <MarketingArtsView
                arts={marketingArts}
                billing={billing}
                brand={
                  brand || {
                    businessName: session.name,
                    logoUrl: null,
                    primaryColor: "#22C55E",
                    secondaryColor: "#0F172A",
                    accentColor: "#2563EB",
                    whatsapp: null,
                    pixKey: null,
                    instagram: null,
                    email: session.email,
                    website: null,
                    bio: null,
                    proposalStyle: "executive",
                    proposalIntro: null,
                    proposalClosing: null,
                    proposalTerms: null,
                    proposalFaq: null,
                    showPortfolio: true,
                    showTestimonials: true,
                    showServices: true,
                    showFaq: true,
                  }
                }
                notice={notice}
                onCreate={createMarketingArt}
                onNotice={setNotice}
                onApprove={approveMarketingArt}
                onRemove={removeMarketingArt}
                services={services}
              />
            ) : null}
            {activeView === "templates" ? (
              <TemplatesView
                customTemplates={customProposalTemplates}
                hasTemplateProfile={Boolean(session?.niche && session?.segment)}
                onOpenAccount={() => setActiveView("account")}
                onTemplateCreated={(template) => setCustomProposalTemplates((current) => [template, ...current])}
                proposalTemplates={allProposalTemplates}
                onUseTemplate={(template) => {
                  setDraft((current) => ({
                    ...current,
                    templateId: template.id,
                    serviceName: template.serviceName,
                    price: template.price,
                    deadline: template.deadline,
                    payment: template.payment,
                    included: template.included,
                    notes: template.notes,
                  }));
                  setActiveView("dashboard");
                }}
              />
            ) : null}
            {activeView === "plans" ? (
              <PlansView billing={billing} notice={notice} onNotice={setNotice} />
            ) : null}
            {activeView === "support" ? (
              <SupportView session={session} />
            ) : null}
            {activeView === "account" ? (
              <AccountView session={session} onChange={setSession} />
            ) : null}
          </>
        )}
      </div>
      {currentTourStep && !onboardingIncomplete ? (
        <GuidedTour
          currentIndex={tourStepIndex ?? 0}
          onBack={() => moveTour(-1)}
          onClose={() => setTourStepIndex(null)}
          onNext={() => {
            if ((tourStepIndex ?? 0) >= availableTourSteps.length - 1) {
              setTourStepIndex(null);
              setNotice("Acesso guiado concluído. Agora você já conhece o fluxo principal do FechaPro.");
              return;
            }
            moveTour(1);
          }}
          step={currentTourStep}
          total={availableTourSteps.length}
        />
      ) : null}
      {showUpdatesModal ? (
        <ProductUpdatesModal
          onClose={closeUpdatesModal}
          onOpenArts={() => {
            closeUpdatesModal();
            setActiveView("arts");
          }}
          onOpenBrand={() => {
            closeUpdatesModal();
            setActiveView("brand");
          }}
        />
      ) : null}
      {session && !onboardingIncomplete ? (
        <ProposalFormModal
          open={showProposalForm}
          onClose={() => setShowProposalForm(false)}
          brand={
            brand || {
              businessName: session.name,
              logoUrl: null,
              primaryColor: "#22C55E",
              secondaryColor: "#0F172A",
              accentColor: "#2563EB",
              whatsapp: null,
              pixKey: null,
              instagram: null,
              email: session.email,
              website: null,
              bio: null,
              proposalStyle: "executive",
              proposalIntro: null,
              proposalClosing: null,
              proposalTerms: null,
              proposalFaq: null,
              showPortfolio: true,
              showTestimonials: true,
              showServices: true,
              showFaq: true,
            }
          }
          clients={clients}
          draft={draft}
          isEditingProposal={Boolean(editingProposalId)}
          onDraftChange={updateDraft}
          onProposalSave={saveProposal}
          onProposalPdf={saveProposalAndOpenPdf}
          onSeed={seedExamples}
          portfolio={portfolio}
          proposalTemplates={allProposalTemplates}
          services={services}
          session={session}
          testimonials={testimonials}
          onNotice={setNotice}
        />
      ) : null}
    </main>
  );
}

function PushNotificationPanel({ onNotice }: { onNotice: (message: string | null) => void }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canUsePush = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(canUsePush);
    if (canUsePush) setPermission(Notification.permission);
  }, []);

  async function enablePush() {
    if (!supported || loading) return;
    setLoading(true);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        onNotice("Notificações bloqueadas no navegador. Ative a permissão para receber alertas.");
        return;
      }

      const keyResponse = await apiGet<{ enabled: boolean; publicKey: string }>("/api/push/vapid-key");
      if (!keyResponse.enabled || !keyResponse.publicKey) {
        onNotice("Configure NEXT_PUBLIC_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY para ativar push.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyResponse.publicKey),
        }));

      await apiPost("/api/push/subscriptions", { subscription: subscription.toJSON() });
      onNotice("Notificações push ativadas para propostas visualizadas, aceitas, recusadas e pagas.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Não foi possível ativar notificações push.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
      <div>
        <p className="text-xs font-black uppercase text-blue-700">Notificações</p>
        <h2 className="mt-1 text-lg font-black">Alertas push de propostas</h2>
        <p className="mt-1 text-sm font-bold text-slate-500">
          Receba aviso quando uma proposta for visualizada, aceita, recusada ou paga.
        </p>
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading || permission === "granted"}
        type="button"
        onClick={enablePush}
      >
        <Bell size={18} />
        {permission === "granted" ? "Push ativado" : loading ? "Ativando..." : "Ativar push"}
      </button>
    </section>
  );
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function CalculatorModal({
  open,
  onClose,
  session,
  draft,
  onDraftChange,
  onNotice,
}: {
  open: boolean;
  onClose: () => void;
  session: SessionProfile;
  draft: ProposalDraft;
  onDraftChange: <K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) => void;
  onNotice: (message: string | null) => void;
}) {
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([{ ...emptyMaterialItem }]);
  const [laborValue, setLaborValue] = useState(0);
  const [marginPercent, setMarginPercent] = useState(20);

  const calculatedMaterialItems = materialItems.map((item) => {
    const area = Number(item.area || 0);
    const coats = Math.max(1, Number(item.coats || 1));
    const coverage = Math.max(1, Number(item.coverage || 1));
    const wasteMultiplier = 1 + Number(item.wastePercent || 0) / 100;
    const packageSize = Math.max(1, Number(item.packageSize || 1));
    const calculatedQuantity =
      item.mode === "paint"
        ? Math.ceil(((area * coats) / coverage) * wasteMultiplier)
        : item.mode === "area"
          ? Math.ceil(area * wasteMultiplier)
          : Number(item.quantity || 0);

    return {
      ...item,
      calculatedQuantity,
      total: calculatedQuantity * Number(item.unitPrice || 0),
      liters: item.mode === "paint" ? calculatedQuantity * packageSize : 0,
    };
  });
  const materialsTotal = calculatedMaterialItems.reduce((sum, item) => sum + item.total, 0);
  const calculatorSubtotal = materialsTotal + Number(laborValue || 0);
  const marginValue = calculatorSubtotal * (Number(marginPercent || 0) / 100);
  const calculatedTotal = Math.round(calculatorSubtotal + marginValue);
  const calculatorSummary = [
    `Materiais: ${money.format(materialsTotal)}`,
    `Mao de obra: ${money.format(laborValue || 0)}`,
    `Margem (${marginPercent || 0}%): ${money.format(marginValue)}`,
    `Total calculado: ${money.format(calculatedTotal)}`,
  ].join(" | ");
  const selectedCalculatorNiche = calculatorNicheFromProfile(session.niche, session.segment, draft.segment);
  const visibleCalculatorPresets = session.isAdmin ? calculatorPresets : calculatorPresets.filter((preset) => preset.niches.includes(selectedCalculatorNiche));
  const fallbackCalculatorPresets = visibleCalculatorPresets.length ? visibleCalculatorPresets : calculatorPresets.filter((preset) => preset.niches.includes("general"));

  function updateMaterialItem(index: number, field: keyof MaterialItem, value: string) {
    setMaterialItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === "name" || field === "mode" ? value : Number(value || 0),
            }
          : item,
      ),
    );
  }

  function addMaterialItem() {
    setMaterialItems((items) => [...items, { ...emptyMaterialItem }]);
  }

  function removeMaterialItem(index: number) {
    setMaterialItems((items) => (items.length === 1 ? [{ ...emptyMaterialItem }] : items.filter((_, itemIndex) => itemIndex !== index)));
  }

  function applyCalculatorPreset(label: string) {
    const preset = calculatorPresets.find((item) => item.label === label);
    if (!preset) return;
    setMaterialItems(preset.items.map((item) => ({ ...item })));
    setLaborValue(preset.laborValue);
    setMarginPercent(preset.marginPercent);
    if (!draft.serviceName.trim()) onDraftChange("serviceName", preset.serviceName);
    onNotice(`Modelo de ${preset.label.toLowerCase()} aplicado. Ajuste medidas e valores antes de salvar.`);
  }

  function applyCalculatedValue() {
    onDraftChange("price", calculatedTotal);
    const materialLines = calculatedMaterialItems
      .filter((item) => item.name.trim() || item.unitPrice > 0)
      .map((item) => {
        const suffix = item.mode === "paint" ? `, aprox. ${item.liters}L` : "";
        return `${item.name.trim() || "Material"} (${item.calculatedQuantity} x ${money.format(item.unitPrice || 0)}${suffix})`;
      });
    const nextItems = Array.from(new Set([...cleanIncludedItems(draft.included), ...materialLines, calculatorSummary]));
    if (nextItems.length) onDraftChange("included", nextItems);
    const notesWithoutOldSummary = String(draft.notes || "").replace(/\n?\n?Resumo do calculo:[\s\S]*$/i, "").trim();
    const materialDetails = calculatedMaterialItems
      .filter((item) => item.name.trim() || item.unitPrice > 0)
      .map((item) => `- ${item.name.trim() || "Material"}: ${item.calculatedQuantity} x ${money.format(item.unitPrice || 0)} = ${money.format(item.total)}`)
      .join("\n");
    onDraftChange("notes", `${notesWithoutOldSummary ? `${notesWithoutOldSummary}\n\n` : ""}Resumo do calculo:\n${calculatorSummary}${materialDetails ? `\n${materialDetails}` : ""}`);
    onNotice("Valor calculado aplicado na proposta.");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Calculadora" title="Calcular valor da proposta" size="lg" zClassName="z-[60]">
      <p className="text-sm font-bold leading-5 text-slate-500">Some materiais, mao de obra e margem antes de fechar o valor da proposta.</p>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-700/20 bg-blue-50 p-3">
        <span className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
          <Calculator size={16} />
          Total calculado
        </span>
        <strong className="rounded-lg bg-white px-3 py-2 text-sm text-blue-700">{money.format(calculatedTotal)}</strong>
      </div>

      <div className="grid gap-2">
        <span className="text-xs font-black uppercase text-slate-500">Modelos do seu nicho</span>
        <p className="text-xs font-bold leading-5 text-slate-500">
          {session.isAdmin ? "Administrador: todos os nichos disponíveis." : `Exibindo calculadoras para ${session.niche || session.segment || "serviço geral"}.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {fallbackCalculatorPresets.map((preset) => (
            <button className="min-h-9 rounded-full border border-black/10 bg-white px-3 text-xs font-black text-slate-700" key={preset.label} type="button" onClick={() => applyCalculatorPreset(preset.label)}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        {calculatedMaterialItems.map((item, index) => (
          <div className="grid gap-2 rounded-lg border border-black/10 bg-white p-2" key={index}>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_2.75rem]">
              <input className="min-h-11 rounded-lg border border-black/10 px-3 text-sm font-bold" placeholder="Material" value={item.name} onChange={(event) => updateMaterialItem(index, "name", event.target.value)} />
              <select className="min-h-11 rounded-lg border border-black/10 px-3 text-sm font-bold" value={item.mode} onChange={(event) => updateMaterialItem(index, "mode", event.target.value)}>
                <option value="general">Quantidade</option>
                <option value="paint">Tinta</option>
                <option value="area">Área/m²</option>
              </select>
              <input className="min-h-11 rounded-lg border border-black/10 px-3 text-sm font-bold" min={0} placeholder="Valor un." step="0.01" type="number" value={item.unitPrice || ""} onChange={(event) => updateMaterialItem(index, "unitPrice", event.target.value)} />
              <button className="grid h-11 w-11 place-items-center rounded-lg border border-black/10 bg-white text-slate-700" type="button" title="Remover material" aria-label="Remover material" onClick={() => removeMaterialItem(index)}>
                <Trash2 size={16} />
              </button>
            </div>

            {item.mode === "paint" ? (
              <div className="grid gap-2 sm:grid-cols-5">
                <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold" min={0} placeholder="m² parede" step="0.01" type="number" value={item.area || ""} onChange={(event) => updateMaterialItem(index, "area", event.target.value)} />
                <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold" min={1} placeholder="Demaos" step="1" type="number" value={item.coats || ""} onChange={(event) => updateMaterialItem(index, "coats", event.target.value)} />
                <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold" min={1} placeholder="Rend. m2/lata" step="1" type="number" value={item.coverage || ""} onChange={(event) => updateMaterialItem(index, "coverage", event.target.value)} />
                <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold" min={1} placeholder="Litros/lata" step="0.01" type="number" value={item.packageSize || ""} onChange={(event) => updateMaterialItem(index, "packageSize", event.target.value)} />
                <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold" min={0} placeholder="Perda %" step="1" type="number" value={item.wastePercent || ""} onChange={(event) => updateMaterialItem(index, "wastePercent", event.target.value)} />
              </div>
            ) : item.mode === "area" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold" min={0} placeholder="Área m²" step="0.01" type="number" value={item.area || ""} onChange={(event) => updateMaterialItem(index, "area", event.target.value)} />
                <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold" min={0} placeholder="Perda %" step="1" type="number" value={item.wastePercent || ""} onChange={(event) => updateMaterialItem(index, "wastePercent", event.target.value)} />
              </div>
            ) : (
              <input className="min-h-10 rounded-lg border border-black/10 px-3 text-sm font-bold sm:max-w-40" min={0} placeholder="Qtd." step="0.01" type="number" value={item.quantity || ""} onChange={(event) => updateMaterialItem(index, "quantity", event.target.value)} />
            )}

            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
              <span>Qtd. calculada: {item.calculatedQuantity}</span>
              {item.mode === "paint" ? <span>Volume aprox.: {item.liters}L</span> : null}
              <span>Total: {money.format(item.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-slate-700" type="button" onClick={addMaterialItem}>
          <Plus size={16} />
          Material
        </button>
        <TextField label="Mao de obra" min={0} placeholder="500" step="1" type="number" value={laborValue || ""} onChange={(value) => setLaborValue(Number(value || 0))} />
        <TextField label="Margem (%)" min={0} placeholder="20" step="1" type="number" value={marginPercent || ""} onChange={(value) => setMarginPercent(Number(value || 0))} />
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-3 text-xs font-bold leading-5 text-slate-600">
        <span className="block font-black text-slate-900">Resumo do calculo</span>
        <span>{calculatorSummary}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="min-h-11 rounded-lg bg-blue-700 px-4 font-black text-white" type="button" onClick={applyCalculatedValue}>
          Aplicar valor na proposta
        </button>
      </div>
    </Modal>
  );
}

function ProposalFormModal({
  open,
  onClose,
  brand,
  clients,
  draft,
  isEditingProposal,
  onDraftChange,
  onProposalSave,
  onProposalPdf,
  onSeed,
  portfolio,
  proposalTemplates,
  services,
  session,
  testimonials,
  onNotice,
}: {
  open: boolean;
  onClose: () => void;
  brand: BrandProfile;
  clients: Client[];
  draft: ProposalDraft;
  isEditingProposal: boolean;
  onDraftChange: <K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) => void;
  onProposalSave: (status?: ProposalStatus) => void | Promise<Proposal | null>;
  onProposalPdf: () => void | Promise<void>;
  onSeed: () => void;
  portfolio: PortfolioItem[];
  proposalTemplates: ProposalTemplate[];
  services: ServiceItem[];
  session: SessionProfile;
  testimonials: Testimonial[];
  onNotice: (message: string | null) => void;
}) {
  const [includedText, setIncludedText] = useState(() => draft.included.join("\n"));
  const [showAdvancedProposalOptions, setShowAdvancedProposalOptions] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    const nextIncludedText = draft.included.join("\n");
    setIncludedText((current) => (current === nextIncludedText ? current : nextIncludedText));
  }, [draft.included]);

  function chooseService(serviceName: string) {
    const service = services.find((item) => item.name === serviceName);
    if (!service) {
      onDraftChange("serviceName", serviceName);
      return;
    }
    onDraftChange("serviceName", service.name);
    onDraftChange("price", service.price);
    onDraftChange("deadline", service.deadline || "");
    onDraftChange("included", service.includes);
  }

  function selectedServiceNames() {
    return services
      .filter((service) => draft.serviceName.split(" + ").includes(service.name) || draft.serviceName === service.name)
      .map((service) => service.name);
  }

  function chooseMultipleServices(serviceNames: string[]) {
    const selectedServices = services.filter((service) => serviceNames.includes(service.name));
    if (!selectedServices.length) {
      onDraftChange("serviceName", "");
      onDraftChange("price", 0);
      onDraftChange("deadline", "");
      onDraftChange("included", []);
      return;
    }

    if (selectedServices.length === 1) {
      chooseService(selectedServices[0].name);
      return;
    }

    onDraftChange("serviceName", selectedServices.map((service) => service.name).join(" + "));
    onDraftChange("price", selectedServices.reduce((sum, service) => sum + service.price, 0));
    onDraftChange("deadline", "Conforme serviços selecionados");
    onDraftChange(
      "included",
      selectedServices.flatMap((service) => [
        `${service.name} - ${money.format(service.price)}`,
        ...service.includes.map((item) => `${service.name}: ${item}`),
      ]),
    );
  }

  function addIncludedSuggestion(item: string) {
    const currentItems = cleanIncludedItems(draft.included);
    if (currentItems.some((current) => current.toLowerCase() === item.toLowerCase())) return;
    onDraftChange("included", [...currentItems, item]);
  }

  function useQuickExample() {
    onDraftChange("templateId", quickExampleProposal.templateId);
    onDraftChange("clientName", quickExampleProposal.clientName);
    onDraftChange("clientEmail", quickExampleProposal.clientEmail);
    onDraftChange("serviceName", quickExampleProposal.serviceName);
    onDraftChange("price", quickExampleProposal.price);
    onDraftChange("deadline", quickExampleProposal.deadline);
    onDraftChange("validUntil", nextWeekDate());
    onDraftChange("payment", quickExampleProposal.payment);
    onDraftChange("documentType", quickExampleProposal.documentType);
    onDraftChange("segment", quickExampleProposal.segment);
    onDraftChange("checkoutMode", quickExampleProposal.checkoutMode);
    onDraftChange("included", quickExampleProposal.included);
    onDraftChange("notes", quickExampleProposal.notes);
    onNotice("Exemplo preenchido. Ajuste os dados e salve a proposta.");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={isEditingProposal ? "Editar proposta" : "Proposta rapida"}
      title={isEditingProposal ? "Ajuste os dados da proposta" : "Crie sua proposta rápida"}
      size="full"
      footer={
        <div className="grid gap-3 sm:grid-cols-3">
          <button className="min-h-11 rounded-lg bg-green-600 px-4 font-black text-white" type="submit" form="proposal-form">
            {isEditingProposal ? "Atualizar proposta" : "Salvar proposta"}
          </button>
          <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={() => onProposalSave("draft")}>
            Salvar rascunho
          </button>
          <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={useQuickExample}>
            Preencher exemplo
          </button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <form
          id="proposal-form"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onProposalSave();
          }}
        >
          <div className="grid gap-2 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold leading-6 text-green-900">
            <span className="font-black">Preencha cliente, serviço, valor, prazo e itens inclusos.</span>
            <span>Depois envie o link pelo WhatsApp ou baixe em PDF.</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Cliente"
              value={draft.clientName}
              placeholder="Selecione ou digite"
              required
              options={clients.map((client) => client.name)}
              onChange={(value) => {
                onDraftChange("clientName", value);
                const client = clients.find((c) => c.name === value);
                if (client?.email) onDraftChange("clientEmail", client.email);
              }}
            />
            <SelectField
              label="Serviço"
              value={draft.serviceName}
              placeholder="Selecione ou digite"
              required
              options={services.map((service) => service.name)}
              onChange={chooseService}
            />
            <TextField label="Valor" min={1} placeholder="1200" required step="1" type="number" value={draft.price || ""} onChange={(value) => onDraftChange("price", Number(value || 0))} />
            <TextField label="Prazo" maxLength={80} placeholder="7 dias úteis" required value={draft.deadline} onChange={(value) => onDraftChange("deadline", value)} />
          </div>

          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-blue-700/20 bg-blue-50 px-4 text-sm font-black text-blue-700"
            type="button"
            onClick={() => setShowCalculator(true)}
          >
            <Calculator size={16} />
            Calcular valor com materiais
          </button>

          <TextAreaField
            label="O que esta incluso"
            maxLength={1200}
            placeholder={"Ex:\nBriefing inicial\nExecução do serviço\nAjustes combinados\nEntrega final"}
            value={includedText}
            onChange={(value) => {
              setIncludedText(value);
              onDraftChange("included", value.split("\n"));
            }}
          />
          <div className="grid gap-2">
            <span className="text-xs font-black uppercase text-slate-500">Adicionar rapido</span>
            <div className="flex flex-wrap gap-2">
              {quickIncludedSuggestions.map((item) => (
                <button
                  className="min-h-9 rounded-full border border-black/10 bg-slate-50 px-3 text-xs font-black text-slate-700"
                  key={item}
                  type="button"
                  onClick={() => addIncludedSuggestion(item)}
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 bg-slate-50 px-4 text-sm font-black text-slate-800"
              type="button"
              onClick={() => setShowAdvancedProposalOptions((current) => !current)}
            >
              <Settings size={16} />
              {showAdvancedProposalOptions ? "Ocultar opções avançadas" : "Mostrar opções avançadas"}
            </button>
            <span className="text-xs font-bold text-slate-500">Template, validade, pagamento, e-mail, recebimento e visual.</span>
          </div>

          {showAdvancedProposalOptions ? (
            <>
              <div className="grid gap-2 rounded-lg border border-black/10 bg-slate-50 p-3">
                <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                  Template por nicho
                  <select
                    className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
                    value={draft.templateId}
                    onChange={(event) => {
                      const template = proposalTemplates.find((item) => item.id === event.target.value);
                      if (!template) return;
                      onDraftChange("templateId", template.id);
                      onDraftChange("serviceName", template.serviceName);
                      onDraftChange("price", template.price);
                      onDraftChange("deadline", template.deadline);
                      onDraftChange("payment", template.payment);
                      onDraftChange("included", template.included);
                      onDraftChange("notes", template.notes);
                    }}
                  >
                    <option value="">Escolha um modelo pronto</option>
                    {proposalTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.niche} - {template.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                  Tipo do documento
                  <select
                    className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
                    value={draft.documentType}
                    onChange={(event) => onDraftChange("documentType", event.target.value as ProposalDraft["documentType"])}
                  >
                    {documentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                  Segmento visual
                  <select
                    className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
                    value={draft.segment}
                    onChange={(event) => onDraftChange("segment", event.target.value as ProposalDraft["segment"])}
                  >
                    {proposalSegmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Validade" type="date" value={draft.validUntil} onChange={(value) => onDraftChange("validUntil", value)} />
                <TextField label="Pagamento" maxLength={120} placeholder="50% entrada e 50% entrega" value={draft.payment} onChange={(value) => onDraftChange("payment", value)} />
              </div>

              {services.length ? (
                <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Serviços cadastrados na proposta</h3>
                      <p className="text-xs font-bold leading-5 text-slate-500">
                        Marque mais de um serviço para somar valores e montar os itens automaticamente.
                      </p>
                    </div>
                    {selectedServiceNames().length > 1 ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
                        {selectedServiceNames().length} serviços
                      </span>
                    ) : null}
                  </div>
                  <div className="grid max-h-[40rem] gap-2 overflow-y-auto pr-1">
                    {services.map((service) => {
                      const checked = selectedServiceNames().includes(service.name);
                      return (
                        <label
                          className={`grid min-h-20 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 text-sm font-bold text-slate-700 ${
                            checked ? "border-green-600 bg-green-50 shadow-sm" : "border-black/10 bg-white"
                          }`}
                          key={service.id}
                        >
                          <input
                            className="h-4 w-4 shrink-0 accent-green-700"
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const current = selectedServiceNames();
                              chooseMultipleServices(
                                event.target.checked
                                  ? Array.from(new Set([...current, service.name]))
                                  : current.filter((name) => name !== service.name),
                              );
                            }}
                          />
                          <span className="min-w-0">
                            <span className="block font-black leading-5 text-slate-900">{service.name}</span>
                            {service.includes.length ? (
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-slate-500">{service.includes.slice(0, 3).join(", ")}</span>
                            ) : null}
                          </span>
                          <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                            {money.format(service.price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                Como receber nesta proposta
                <select
                  className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
                  value={draft.checkoutMode || "mercadopago"}
                  onChange={(event) => onDraftChange("checkoutMode", event.target.value as ProposalDraft["checkoutMode"])}
                >
                  <option value="pix">PIX direto para minha chave</option>
                  <option value="mercadopago">Mercado Pago: PIX, cartão e boleto</option>
                </select>
              </label>

              <TextField
                label="E-mail do cliente"
                placeholder="cliente@email.com"
                type="email"
                autoComplete="email"
                value={draft.clientEmail ?? ""}
                onChange={(value) => onDraftChange("clientEmail", value)}
              />

              <TextAreaField
                label="Observações"
                maxLength={800}
                placeholder="A proposta inclui até 2 rodadas de ajustes."
                rows={3}
                value={draft.notes}
                onChange={(value) => onDraftChange("notes", value)}
              />
            </>
          ) : null}

          {showAdvancedProposalOptions ? (
            <button className="justify-self-start text-sm font-black text-blue-700" type="button" onClick={onSeed}>
              Criar clientes e serviços exemplo
            </button>
          ) : null}
        </form>

        <ProposalPreview
          brand={brand}
          draft={draft}
          portfolio={portfolio}
          testimonials={testimonials}
          SectionHeading={SectionHeading}
          PreviewItem={PreviewItem}
          onProposalSave={onProposalSave}
          onProposalPdf={onProposalPdf}
        />
      </div>

      <CalculatorModal
        open={showCalculator}
        onClose={() => setShowCalculator(false)}
        session={session}
        draft={draft}
        onDraftChange={onDraftChange}
        onNotice={onNotice}
      />
    </Modal>
  );
}

function DashboardView({
  brand,
  clients,
  onNewProposal,
  lastSavedProposal,
  onLastSavedProposalDismiss,
  proposals,
  services,
  billing,
  notice,
  onNotice,
}: {
  brand: BrandProfile;
  clients: Client[];
  onNewProposal: () => void;
  lastSavedProposal: Proposal | null;
  onLastSavedProposalDismiss: () => void;
  proposals: Proposal[];
  services: ServiceItem[];
  billing: BillingState | null;
  notice: string | null;
  onNotice: (message: string | null) => void;
}) {
  const followUps = proposals.filter((proposal) => ["sent", "viewed", "awaiting_response"].includes(proposal.status) && daysSince(proposal.updatedAt || proposal.createdAt) >= 2).slice(0, 3);
  const isFirstProposalExperience = !proposals.length && !lastSavedProposal;
  const setupChecklist = [
    { done: Boolean(brand.businessName && brand.whatsapp), label: "Marca e WhatsApp" },
    { done: services.length > 0, label: "Serviço cadastrado" },
    { done: clients.length > 0, label: "Cliente salvo" },
    { done: proposals.length > 0, label: "Primeira proposta" },
  ];
  const setupProgress = setupChecklist.filter((item) => item.done).length;
  const lastSavedUrl = lastSavedProposal?.publicSlug ? `${getPublicAppUrl()}/p/${lastSavedProposal.publicSlug}` : "";
  const lastSavedWhatsappUrl = lastSavedProposal
    ? `https://wa.me/?text=${encodeURIComponent(`Oi, ${lastSavedProposal.clientName}! Preparei sua proposta de ${lastSavedProposal.serviceName} com escopo, valor, prazo, PDF e aceite online. Pode acessar aqui: ${lastSavedUrl}`)}`
    : "";
  const hasPaidAccess = Boolean(
    billing &&
      ["active", "trial"].includes(billing.subscription.status) &&
      ["mercadopago", "admin"].includes(billing.subscription.provider || ""),
  );

  return (
    <>
      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-800">
          <span>{notice}</span>
          <button className="font-black" type="button" onClick={() => onNotice(null)}>
            Fechar
          </button>
        </div>
      ) : null}

      <PushNotificationPanel onNotice={onNotice} />

      {lastSavedProposal?.publicSlug ? (
        <section className="grid gap-4 rounded-lg border border-green-700/20 bg-green-50 p-4 shadow-xl shadow-slate-900/10 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-green-700">Proposta pronta</p>
            <h2 className="mt-1 text-xl font-black leading-tight text-green-950">
              {lastSavedProposal.clientName} - {lastSavedProposal.serviceName}
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-green-900">
              Agora e so enviar para o cliente. O link abre no celular, gera PDF e registra visualizacao.
            </p>
          </div>
          <div className="grid gap-2 sm:min-w-72">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white"
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(lastSavedUrl);
                onNotice("Link da proposta copiado.");
              }}
            >
              <Copy size={17} />
              Copiar link
            </button>
            <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-white px-4 font-black text-green-800" href={lastSavedWhatsappUrl} target="_blank" rel="noreferrer">
              <Send size={17} />
              Enviar no WhatsApp
            </a>
            <div className="grid grid-cols-2 gap-2">
              <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-green-700/20 bg-white px-3 text-sm font-black text-green-800" href={`/p/${lastSavedProposal.publicSlug}/pdf`} target="_blank" rel="noreferrer">
                <FileDown size={15} />
                PDF
              </a>
              <button className="min-h-10 rounded-lg border border-green-700/20 px-3 text-sm font-black text-green-800" type="button" onClick={onLastSavedProposalDismiss}>
                Fechar
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
        <div>
          {isFirstProposalExperience ? (
            <p className="text-xs font-black uppercase text-blue-700">Primeira proposta</p>
          ) : null}
          <h2 className="mt-1 max-w-[20ch] text-2xl font-black leading-tight text-slate-950 sm:text-4xl">
            Crie uma proposta profissional que valoriza seu serviço.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Monte uma proposta com sua marca, valor, prazo, PDF, link e aceite online. Depois envie pelo WhatsApp e acompanhe se o cliente abriu.
          </p>
        </div>

        <div className="grid gap-2 sm:min-w-56">
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" type="button" onClick={onNewProposal}>
            <Plus size={18} />
            Nova proposta
          </button>
          <p className="text-center text-xs font-bold text-slate-500">Abre o gerador de proposta em uma tela só.</p>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading eyebrow="Configuração" title="Sua estrutura comercial" />
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
            {setupProgress}/{setupChecklist.length} pronto
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          {setupChecklist.map((item) => (
            <div className={`grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg border p-3 text-sm font-black ${item.done ? "border-green-700/20 bg-green-50 text-green-800" : "border-black/10 bg-slate-50 text-slate-600"}`} key={item.label}>
              {item.done ? <CheckCircle2 size={16} /> : <HelpCircle size={16} />}
              {item.label}
            </div>
          ))}
        </div>
        <p className="text-sm font-bold leading-6 text-slate-500">
          Quanto mais completa sua estrutura, mais confiança sua proposta transmite ao cliente.
        </p>
      </section>


      {billing ? (
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Assinatura" title={hasPaidAccess ? `Plano ${plans[billing.subscription.plan]?.name ?? billing.subscription.plan} em uso` : "Pagamento pendente"} />
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-700">
              {hasPaidAccess
                ? isUnlimitedProposalLimit(billing.usage.proposalLimit)
                  ? "Propostas ilimitadas"
                  : `${billing.usage.proposalsThisMonth}/${billing.usage.proposalLimit} propostas este mês`
                : "Pague pelo Mercado Pago ou aguarde liberação do admin"}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
              {isUnlimitedArtLimit(billing.usage.artLimit)
                ? "Artes de divulgação ilimitadas"
                : `${billing.usage.artsThisMonth}/${billing.usage.artLimit} artes de divulgação`}
            </span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{
                width: isUnlimitedProposalLimit(billing.usage.proposalLimit)
                  ? "100%"
                  : `${Math.min(100, Math.round((billing.usage.proposalsThisMonth / billing.usage.proposalLimit) * 100))}%`,
              }}
            />
          </div>
        </section>
      ) : null}

      {followUps.length ? (
        <section className="grid gap-3 rounded-lg border border-amber-700/20 bg-amber-50 p-4 shadow-xl shadow-slate-900/10">
          <SectionHeading eyebrow="Follow-up" title="Clientes quentes para retomar hoje" />
          {followUps.map((proposal) => {
            const proposalUrl = proposal.publicSlug ? `${getPublicAppUrl()}/p/${proposal.publicSlug}` : "";
            const followUpMessages = [
              {
                label: "Enviar follow-up",
                text: `Oi, ${proposal.clientName}! Passando para saber se conseguiu olhar a proposta de ${proposal.serviceName}. Posso tirar alguma dúvida? ${proposalUrl}`,
              },
              {
                label: "Chamar no WhatsApp",
                text: `Oi, ${proposal.clientName}! Vi que a proposta de ${proposal.serviceName} está em aberto. Quer que eu explique algum ponto do escopo, prazo ou pagamento? ${proposalUrl}`,
              },
              {
                label: "Reforçar validade",
                text: `Oi, ${proposal.clientName}! Lembrando que a proposta de ${proposal.serviceName}${proposal.validUntil ? ` vale até ${formatDateOnly(proposal.validUntil)}` : " está disponível para aceite"}. Segue o link: ${proposalUrl}`,
              },
            ];
            return (
              <div className="grid gap-3 rounded-lg border border-amber-700/20 bg-white p-3 lg:grid-cols-[1fr_auto] lg:items-center" key={proposal.id}>
                <div>
                  <strong>{proposal.clientName}</strong>
                  <p className="text-sm font-bold leading-6 text-slate-600">
                    Enviada ha {daysSince(proposal.updatedAt || proposal.createdAt)} dias - {proposalStatusLabel(proposal.status)}. {proposalStatusHelp(proposal)}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {followUpMessages.map((message) => (
                    <button
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-black text-white"
                      type="button"
                      key={message.label}
                      onClick={() => {
                        navigator.clipboard.writeText(message.text);
                        onNotice(`${message.label} copiado.`);
                      }}
                    >
                      <Copy size={15} />
                      {message.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
      {false ? (
      <section className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <SectionHeading eyebrow="Indicações" title="Ganhe crescimento com seus clientes" />
          <p className="mt-2 leading-7 text-slate-600">
            Compartilhe o FechaPro com outro profissional. Quando o programa de indicação estiver ativo, essa área vira o controle de meses grátis e descontos.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 font-black text-slate-800"
          type="button"
          onClick={() => {
            const inviteLink = getPublicAppUrl();
            navigator.clipboard.writeText(`Conhece o FechaPro? Estou usando para enviar propostas profissionais e acompanhar aceite dos clientes: ${inviteLink}`);
            onNotice("Mensagem de indicação copiada.");
          }}
        >
          <Copy size={16} />
          Copiar convite
        </button>
      </section>
      ) : null}

    </>
  );
}

function ProposalsView({
  currentPlan,
  notice,
  onCopyLink,
  onConfirmPix,
  onDuplicate,
  onEdit,
  onNewProposal,
  onNotice,
  onRemove,
  onResend,
  onSatisfactionSurveySend,
  onSatisfactionSurveyLinkCopy,
  onStatusChange,
  proposals,
  proposalsSummary,
}: {
  currentPlan: PlanCode;
  notice: string | null;
  onCopyLink: (slug?: string) => void;
  onConfirmPix: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (proposal: Proposal) => void;
  onNewProposal: () => void;
  onNotice: (message: string | null) => void;
  onRemove: (id: string) => void;
  onResend: (id: string) => void;
  onSatisfactionSurveySend: (id: string) => void;
  onSatisfactionSurveyLinkCopy: (proposal: Proposal) => void;
  onStatusChange: (id: string, status: ProposalStatus) => void;
  proposals: Proposal[];
  proposalsSummary?: any | null;
}) {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [visibleProposals, setVisibleProposals] = useState<Proposal[]>([]);
  const firstVisible = total ? (page - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(page * pageSize, total);
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) || null;
  const acceptedValue = proposals
    .filter((proposal) => proposal.status === "accepted")
    .reduce((sum, proposal) => sum + proposal.price, 0);
  const sent = proposals.filter((proposal) => proposal.status !== "draft").length;
  const viewed = proposals.filter((proposal) => proposal.status === "viewed").length;
  const awaitingResponse = proposals.filter((proposal) => proposal.status === "awaiting_response").length;
  const accepted = proposals.filter((proposal) => proposal.status === "accepted").length;
  const declined = proposals.filter((proposal) => proposal.status === "declined").length;
  const totalViews = proposals.reduce((sum, proposal) => sum + (proposal.viewCount || 0), 0);
  const whatsappClicks = proposals.reduce((sum, proposal) => sum + (proposal.whatsappClickCount || 0), 0);
  const expired = proposals.filter((proposal) => proposal.validUntil && proposal.validUntil < todayDate()).length;

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  async function loadPage(p: number) {
    try {
      const response = await apiGet<{ items: Proposal[]; total: number; page: number; pageSize: number; totalPages: number }>(`/api/proposals?page=${p}&pageSize=${pageSize}`);
      setVisibleProposals(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setPage(response.page);
      try {
        onNotice?.("Lista de propostas atualizada.");
        setTimeout(() => onNotice?.(null), 2500);
      } catch {}
    } catch (err) {
      // fallback to client-side slice when server call fails
      setVisibleProposals(proposals.slice((p - 1) * pageSize, p * pageSize));
      setTotal(proposals.length);
      setTotalPages(Math.max(1, Math.ceil(proposals.length / pageSize)));
    }
  }

  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    function onUpdated() {
      loadPage(page);
    }
    window.addEventListener("fechapro:proposals-updated", onUpdated);
    return () => window.removeEventListener("fechapro:proposals-updated", onUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <section className="grid gap-4">
      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-800">
          <span>{notice}</span>
          <button className="font-black" type="button" onClick={() => onNotice(null)}>
            Fechar
          </button>
        </div>
      ) : null}

      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeading eyebrow="Suas propostas" title="Propostas comerciais" />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" type="button" onClick={onNewProposal}>
            <Plus size={18} />
            Nova proposta
          </button>
        </div>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Acompanhe quem abriu, quem está em aberto e quem já fechou. Copie o link, baixe PDF ou envie direto pelo WhatsApp.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-6">
        <Metric label="Total" value={String(proposalsSummary ? proposalsSummary.total : proposals.length)} />
        <Metric label="Enviadas" value={String(proposalsSummary ? proposalsSummary.sent : sent)} />
        <Metric label="Visualizadas" value={String(proposalsSummary ? proposalsSummary.viewed : viewed)} />
        <Metric label="Aguardando resposta" value={String(proposalsSummary ? proposalsSummary.awaitingResponse : awaitingResponse)} />
        <Metric label="Aceitas" value={String(proposalsSummary ? proposalsSummary.accepted : accepted)} />
        <Metric label="Valor aceito" value={money.format(proposalsSummary ? proposalsSummary.acceptedValue : acceptedValue)} />
      </div>

      <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <SectionHeading eyebrow="Indicadores" title="Acompanhamento de vendas" />
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <FunnelStep label="Enviadas" value={sent} tone="bg-amber-500" />
            <FunnelStep label="Abertas" value={viewed} tone="bg-sky-600" />
            <FunnelStep label="Aguardando resposta" value={awaitingResponse} tone="bg-indigo-600" />
            <FunnelStep label="Aceitas" value={accepted} tone="bg-green-700" />
            <FunnelStep label="Recusadas" value={declined} tone="bg-rose-700" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MiniStat label="Valor aceito" value={money.format(acceptedValue)} />
          <MiniStat label="Visualizações" value={String(totalViews)} />
          <MiniStat label="Cliques no WhatsApp" value={String(whatsappClicks)} />
          <MiniStat label="Vencidas" value={String(expired)} />
        </div>
      </section>

      {selectedProposal ? (
        <Modal
          open={Boolean(selectedProposal)}
          onClose={() => setSelectedProposalId(null)}
          eyebrow="Detalhes da proposta"
          title={selectedProposal.clientName}
          size="full"
        >
          <ProposalDetailPanel
            currentPlan={currentPlan}
            proposal={selectedProposal}
            onConfirmPix={() => onConfirmPix(selectedProposal.id)}
            onCopyLink={() => onCopyLink(selectedProposal.publicSlug)}
            onDuplicate={() => onDuplicate(selectedProposal.id)}
            onEdit={() => onEdit(selectedProposal)}
            onRemove={() => {
              if (window.confirm("Remover esta proposta?")) {
                onRemove(selectedProposal.id);
                setSelectedProposalId(null);
              }
            }}
            onResend={() => onResend(selectedProposal.id)}
            onStatusChange={(status) => onStatusChange(selectedProposal.id, status)}
            onSatisfactionSurveySend={() => onSatisfactionSurveySend(selectedProposal.id)}
            onSatisfactionSurveyLinkCopy={() => onSatisfactionSurveyLinkCopy(selectedProposal)}
          />
        </Modal>
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-600">
          Mostrando {firstVisible}-{lastVisible} de {total} propostas
        </p>
        <div className="flex items-center gap-2">
          <button
            className="min-h-10 rounded-lg border border-black/10 px-4 font-black disabled:opacity-40"
            disabled={page <= 1}
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>
          <span className="min-w-20 text-center text-sm font-black text-slate-600">
            {page}/{totalPages}
          </span>
          <button
            className="min-h-10 rounded-lg border border-black/10 px-4 font-black disabled:opacity-40"
            disabled={page >= totalPages}
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Proxima
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {visibleProposals.length ? (
          visibleProposals.map((proposal) => (
            <ProposalCard
              currentPlan={currentPlan}
              key={proposal.id}
              proposal={proposal}
              onRemove={() => onRemove(proposal.id)}
              onCopyLink={() => onCopyLink(proposal.publicSlug)}
              onStatusChange={(status) => onStatusChange(proposal.id, status)}
              onResend={() => onResend(proposal.id)}
              onSatisfactionSurveySend={() => onSatisfactionSurveySend(proposal.id)}
              onSatisfactionSurveyLinkCopy={() => onSatisfactionSurveyLinkCopy(proposal)}
              onDuplicate={() => onDuplicate(proposal.id)}
              onEdit={() => onEdit(proposal)}
              onOpenDetail={() => setSelectedProposalId(proposal.id)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
            <p className="leading-7 text-slate-600">Nenhuma proposta encontrada nesta página.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function OnboardingView({
  brand,
  onComplete,
  session,
}: {
  brand: BrandProfile;
  onComplete: (brand: BrandProfile, service: ServiceItem) => void;
  session: { name: string; email: string };
}) {
  const [businessName, setBusinessName] = useState(brand.businessName || session.name);
  const [whatsapp, setWhatsapp] = useState(maskPhone(brand.whatsapp || ""));
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [includes, setIncludes] = useState("Briefing inicial\nExecução do serviço\nAjustes combinados\nEntrega final");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const presets = [
    { name: "Identidade visual", price: 1200, deadline: "7 dias úteis" },
    { name: "Gestão de redes sociais", price: 1500, deadline: "30 dias" },
    { name: "Ensaio fotográfico", price: 850, deadline: "10 dias úteis" },
  ];

  async function finishOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!businessName.trim() || !whatsapp.trim() || !serviceName.trim() || !price || !deadline.trim()) {
      setError("Preencha marca, WhatsApp, serviço, valor e prazo para concluir.");
      return;
    }
    if (!isValidPhone(whatsapp.trim())) {
      setError("Informe um WhatsApp válido com DDD.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Informe um valor base maior que zero.");
      return;
    }
    setSaving(true);
    try {
      const savedBrand = await apiPut<BrandProfile>("/api/brand", {
        ...brand,
        businessName: businessName.trim(),
        whatsapp: whatsapp.trim(),
        email: brand.email || session.email,
      });
      const service = await apiPost<ServiceItem>("/api/services", {
        name: serviceName.trim(),
        price,
        deadline: deadline.trim(),
        includes: includes
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      onComplete(savedBrand, service);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir a configuração.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid content-center gap-4">
        <p className="text-xs font-black uppercase text-blue-700">Primeiros passos</p>
        <h2 className="max-w-[14ch] text-3xl font-black leading-none sm:max-w-[11ch] sm:text-6xl">
          Configure o básico para vender melhor.
        </h2>
        <p className="max-w-xl leading-7 text-slate-600">
          Em menos de um minuto você deixa sua marca pronta, cria o primeiro serviço e já cai no painel com a primeira proposta quase montada.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <MiniStat label="Passo 1" value="Marca" />
          <MiniStat label="Passo 2" value="Contato" />
          <MiniStat label="Passo 3" value="Serviço" />
        </div>
      </div>

      <form className="grid gap-4 rounded-lg border border-black/10 bg-slate-50 p-4" onSubmit={finishOnboarding}>
        {error ? (
          <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">
            {error}
          </div>
        ) : null}
        <TextField label="Nome comercial" maxLength={80} required value={businessName} onChange={setBusinessName} />
        <TextField label="WhatsApp" autoComplete="tel" maxLength={15} placeholder="(11) 99999-9999" required value={whatsapp} onChange={(value) => setWhatsapp(maskPhone(value))} />
        <div className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-600">Modelos rápidos</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {presets.map((preset) => (
              <button
                className="min-h-11 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-slate-700"
                key={preset.name}
                type="button"
                onClick={() => {
                  setServiceName(preset.name);
                  setPrice(preset.price);
                  setDeadline(preset.deadline);
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
        <TextField label="Primeiro serviço" maxLength={80} placeholder="Ex: Identidade visual" required value={serviceName} onChange={setServiceName} />
        <TextField label="Valor base" min={1} required step="1" type="number" value={price || ""} onChange={(value) => setPrice(Number(value || 0))} />
        <TextField label="Prazo padrão" maxLength={80} placeholder="Ex: 7 dias úteis" required value={deadline} onChange={setDeadline} />
        <TextAreaField label="Itens inclusos" maxLength={1200} rows={4} value={includes} onChange={setIncludes} />
        <button className="min-h-12 rounded-lg bg-green-600 px-4 font-black text-white" type="submit">
          {saving ? "Salvando..." : "Concluir configuração"}
        </button>
      </form>
    </section>
  );
}

function ClientsView({ clients, onChange }: { clients: Client[]; onChange: (items: Client[]) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", segment: "", interestService: "", status: "lead", notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resetForm = () => setForm({ name: "", email: "", phone: "", segment: "", interestService: "", status: "lead", notes: "" });

  async function saveClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }
    if (form.email.trim() && !isValidEmail(form.email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone.trim())) {
      setError("Informe um telefone válido.");
      return;
    }
    try {
      if (editingId) {
        const item = await apiPatch<Client>(`/api/clients/${editingId}`, form);
        onChange(clients.map((client) => (client.id === editingId ? item : client)));
        setEditingId(null);
      } else {
        const item = await apiPost<Client>("/api/clients", form);
        onChange([item, ...clients]);
      }
      resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o cliente.");
    }
  }

  async function removeClient(id: string) {
    await apiDelete(`/api/clients/${id}`);
    onChange(clients.filter((item) => item.id !== id));
  }

  return (
    <CrudShell
      eyebrow="Relacionamento"
      title="Clientes e contatos"
      description="Salve contatos com interesse, status e observações. Assim você sabe exatamente quem retomar e quando."
      contentClassName="max-h-[calc(100vh-11rem)] content-start overflow-y-auto overscroll-contain lg:sticky lg:top-32"
      form={
        <form
          className="grid gap-3"
          onSubmit={saveClient}
        >
          {error ? <FormError message={error} /> : null}
          <TextField label="Nome" maxLength={80} required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextField label="E-mail" autoComplete="email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <TextField label="Telefone" autoComplete="tel" maxLength={15} placeholder="(11) 99999-9999" value={form.phone} onChange={(value) => setForm({ ...form, phone: maskPhone(value) })} />
          <TextField label="Segmento" maxLength={60} placeholder="Moda, estética, arquitetura..." value={form.segment} onChange={(value) => setForm({ ...form, segment: value })} />
          <TextField label="Serviço de interesse" maxLength={90} placeholder="Identidade visual, limpeza, manutenção..." value={form.interestService} onChange={(value) => setForm({ ...form, interestService: value })} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-600">
            Status
            <select
              className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="lead">Lead</option>
              <option value="proposal_sent">Orçamento enviado</option>
              <option value="waiting">Aguardando resposta</option>
              <option value="won">Fechado</option>
              <option value="lost">Perdido</option>
            </select>
          </label>
          <TextAreaField label="Observações" maxLength={500} rows={3} placeholder="Preferências, histórico e próximo passo." value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          <SubmitButton label={editingId ? "Atualizar cliente" : "Salvar cliente"} />
          <CsvImportBox<Client>
            kind="clients"
            sampleHeaders={["nome", "email", "telefone", "segmento", "servico_interesse", "status", "observacoes"]}
            onImported={(created) => onChange([...created, ...clients])}
          />
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                resetForm();
              }}
            >
              Cancelar edição
            </button>
          ) : null}
        </form>
      }
    >
      {clients.map((client) => (
        <ListCard
          key={client.id}
          title={client.name}
          subtitle={[clientStatusLabel(client.status), client.email, client.phone, client.segment].filter(Boolean).join(" | ")}
          detail={[client.interestService ? `Interesse: ${client.interestService}` : "", client.notes || ""].filter(Boolean).join(" - ")}
          onEdit={() => {
            setEditingId(client.id);
            setForm({
              name: client.name,
              email: client.email || "",
              phone: maskPhone(client.phone || ""),
              segment: client.segment || "",
              interestService: client.interestService || "",
              status: client.status || "lead",
              notes: client.notes || "",
            });
          }}
          onRemove={() => removeClient(client.id)}
        />
      ))}
    </CrudShell>
  );
}

function clientStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    lead: "Lead",
    proposal_sent: "Orçamento enviado",
    waiting: "Aguardando resposta",
    won: "Fechado",
    lost: "Perdido",
  };
  return labels[status || "lead"] || "Lead";
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function ServicesView({ services, onChange }: { services: ServiceItem[]; onChange: (items: ServiceItem[]) => void }) {
  const [form, setForm] = useState({ name: "", price: 0, deadline: "", includes: "", imageUrl: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Informe o nome do serviço.");
      return;
    }
    if (!Number.isFinite(form.price) || form.price < 0) {
      setError("Informe um valor válido para o serviço.");
      return;
    }
    const payload = {
      name: form.name,
      price: form.price,
      deadline: form.deadline,
      imageUrl: form.imageUrl.trim() || null,
      includes: form.includes
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        const item = await apiPatch<ServiceItem>(`/api/services/${editingId}`, payload);
        onChange(services.map((service) => (service.id === editingId ? item : service)));
        setEditingId(null);
      } else {
        const item = await apiPost<ServiceItem>("/api/services", payload);
        onChange([item, ...services]);
      }
      setForm({ name: "", price: 0, deadline: "", includes: "", imageUrl: "" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o serviço.");
    }
  }

  async function removeService(id: string) {
    await apiDelete(`/api/services/${id}`);
    onChange(services.filter((item) => item.id !== id));
  }

  return (
    <CrudShell
      eyebrow="Cadastro"
      title="Serviços e preços"
      description="Cadastre seus serviços uma vez e use em qualquer proposta com um clique. Quanto mais completo, mais profissional fica o orçamento."
      contentClassName="max-h-[calc(100vh-11rem)] content-start overflow-y-auto overscroll-contain lg:sticky lg:top-32"
      form={
        <form
          className="grid gap-3"
          onSubmit={saveService}
        >
          {error ? <FormError message={error} /> : null}
          <TextField label="Serviço" maxLength={80} required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextField label="Valor base" min={0} required step="1" type="number" value={form.price || ""} onChange={(value) => setForm({ ...form, price: Number(value || 0) })} />
          <TextField label="Prazo padrão" maxLength={80} value={form.deadline} onChange={(value) => setForm({ ...form, deadline: value })} />
          <TextField label="URL da imagem" placeholder="Opcional: https://..." type="url" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
          <TextAreaField label="Itens inclusos" maxLength={1200} value={form.includes} onChange={(value) => setForm({ ...form, includes: value })} />
          <CsvImportBox<ServiceItem>
            kind="services"
            sampleHeaders={["servico", "valor_base", "prazo_padrao", "itens_inclusos", "imagem_url"]}
            onImported={(created) => onChange([...created, ...services])}
          />
          <SubmitButton label={editingId ? "Atualizar serviço" : "Salvar serviço"} />
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ name: "", price: 0, deadline: "", includes: "", imageUrl: "" });
              }}
            >
              Cancelar edição
            </button>
          ) : null}
        </form>
      }
    >
      {services.map((service) => (
        <ListCard
          key={service.id}
          title={service.name}
          subtitle={`${money.format(service.price)} | ${service.deadline || "Prazo a combinar"}`}
          detail={[service.imageUrl ? "Com imagem vinculada" : "", service.includes.join(", ")].filter(Boolean).join(" | ")}
          onEdit={() => {
            setEditingId(service.id);
            setForm({
              name: service.name,
              price: service.price,
              deadline: service.deadline || "",
              includes: service.includes.join("\n"),
              imageUrl: service.imageUrl || "",
            });
          }}
          onRemove={() => removeService(service.id)}
        />
      ))}
    </CrudShell>
  );
}

function PortfolioView({ portfolio, onChange }: { portfolio: PortfolioItem[]; onChange: (items: PortfolioItem[]) => void }) {
  const [form, setForm] = useState({ title: "", category: "", imageUrl: "" });
  const [file, setFile] = useState<File | null>(null);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function savePortfolioItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Informe o título do item.");
      return;
    }
    if (form.imageUrl.trim() && !isValidHttpUrl(form.imageUrl.trim())) {
      setError("Informe uma URL de imagem válida começando com http:// ou https://.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.imageUrl.trim() || null;

      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        if (removeBackground) uploadData.append("removeBackground", "true");
        const uploadResponse = await fetch("/api/uploads", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResponse.ok) {
          throw new Error(await readApiError(uploadResponse, "Falha ao enviar imagem."));
        }

        const uploadResult = (await uploadResponse.json()) as { imageUrl: string };
        imageUrl = uploadResult.imageUrl;
      }

      const response = await fetch(editingId ? `/api/portfolio/${editingId}` : "/api/portfolio", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Falha ao salvar portfólio."));
      }

      const item = (await response.json()) as PortfolioItem;
      if (editingId) {
        onChange(portfolio.map((entry) => (entry.id === editingId ? item : entry)));
        setEditingId(null);
      } else {
        onChange([item, ...portfolio]);
      }
      setForm({ title: "", category: "", imageUrl: "" });
      setFile(null);
      setRemoveBackground(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o portfólio.");
    } finally {
      setSaving(false);
    }
  }

  async function removePortfolioItem(id: string) {
    await fetch(`/api/portfolio/${id}`, {
      method: "DELETE",
    });
    onChange(portfolio.filter((entry) => entry.id !== id));
  }

  return (
    <CrudShell
      eyebrow="Seus trabalhos"
      title="Portfólio"
      description="Mostre trabalhos anteriores dentro da proposta. Fotos e projetos reais aumentam a confiança do cliente antes do aceite."
      contentClassName="max-h-[calc(100vh-11rem)] content-start overflow-y-auto overscroll-contain lg:sticky lg:top-32"
      form={
        <form
          className="grid gap-3"
          onSubmit={savePortfolioItem}
        >
          {error ? <FormError message={error} /> : null}
          <TextField label="Título" maxLength={80} required value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <TextField label="Categoria" maxLength={60} value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-600">
            Imagem
            <input
              accept="image/*"
              className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-black/10 bg-slate-50 p-3 text-sm font-bold text-slate-600">
            <input
              className="mt-1"
              type="checkbox"
              checked={removeBackground}
              onChange={(event) => setRemoveBackground(event.target.checked)}
            />
            Remover fundo claro desta imagem
          </label>
          <TextField label="URL da imagem" placeholder="Opcional: https://..." type="url" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
          <SubmitButton label={saving ? "Salvando..." : editingId ? "Atualizar item" : "Salvar item"} />
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ title: "", category: "", imageUrl: "" });
                setFile(null);
                setRemoveBackground(false);
              }}
            >
              Cancelar edição
            </button>
          ) : null}
        </form>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {portfolio.map((item) => (
          <article className="overflow-hidden rounded-lg border border-black/10" key={item.id}>
            <div className="grid min-h-36 place-items-end bg-green-600 p-4 text-white">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-40 w-full rounded-md object-cover" src={item.imageUrl} />
              ) : (
                <FolderKanban size={32} />
              )}
            </div>
            <div className="grid gap-2 p-4">
              <div>
                <h3 className="font-black">{item.title}</h3>
                <p className="text-sm font-bold text-slate-500">{item.category || "Sem categoria"}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 font-black"
                  type="button"
                  onClick={() => {
                    setEditingId(item.id);
                    setForm({
                      title: item.title,
                      category: item.category || "",
                      imageUrl: item.imageUrl || "",
                    });
                    setFile(null);
                    setRemoveBackground(false);
                  }}
                >
                  <Settings size={16} />
                  Editar
                </button>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 font-black" type="button" onClick={() => removePortfolioItem(item.id)}>
                  <Trash2 size={16} />
                  Remover
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </CrudShell>
  );
}

function TestimonialsView({
  testimonials,
  onChange,
}: {
  testimonials: Testimonial[];
  onChange: (items: Testimonial[]) => void;
}) {
  const [form, setForm] = useState({ authorName: "", company: "", quote: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveTestimonial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.authorName.trim() || !form.quote.trim()) {
      setError("Informe nome do cliente e depoimento.");
      return;
    }
    try {
      if (editingId) {
        const item = await apiPatch<Testimonial>(`/api/testimonials/${editingId}`, form);
        onChange(testimonials.map((entry) => (entry.id === editingId ? item : entry)));
        setEditingId(null);
      } else {
        const item = await apiPost<Testimonial>("/api/testimonials", form);
        onChange([item, ...testimonials]);
      }
      setForm({ authorName: "", company: "", quote: "" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o depoimento.");
    }
  }

  async function removeTestimonial(id: string) {
    await apiDelete(`/api/testimonials/${id}`);
    onChange(testimonials.filter((entry) => entry.id !== id));
  }

  return (
    <CrudShell
      eyebrow="Prova social"
      title="Depoimentos"
      description="Depoimentos aparecem na proposta antes do cliente aceitar. Quem fala bem de você vende por você."
      contentClassName="max-h-[calc(100vh-11rem)] content-start overflow-y-auto overscroll-contain lg:sticky lg:top-32"
      form={
        <form
          className="grid gap-3"
          onSubmit={saveTestimonial}
        >
          {error ? <FormError message={error} /> : null}
          <TextField label="Nome do cliente" maxLength={80} required value={form.authorName} onChange={(value) => setForm({ ...form, authorName: value })} />
          <TextField label="Empresa" maxLength={80} value={form.company} onChange={(value) => setForm({ ...form, company: value })} />
          <TextAreaField label="Depoimento" maxLength={500} required rows={4} value={form.quote} onChange={(value) => setForm({ ...form, quote: value })} />
          <SubmitButton label={editingId ? "Atualizar depoimento" : "Salvar depoimento"} />
          <CsvImportBox<Testimonial>
            kind="testimonials"
            sampleHeaders={["nome_cliente", "empresa", "depoimento"]}
            onImported={(created) => onChange([...created, ...testimonials])}
          />
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ authorName: "", company: "", quote: "" });
              }}
            >
              Cancelar edição
            </button>
          ) : null}
        </form>
      }
    >
      {testimonials.map((item) => (
        <ListCard
          key={item.id}
          title={item.authorName}
          subtitle={item.company || ""}
          detail={`"${item.quote}"`}
          onEdit={() => {
            setEditingId(item.id);
            setForm({
              authorName: item.authorName,
              company: item.company || "",
              quote: item.quote,
            });
          }}
          onRemove={() => removeTestimonial(item.id)}
        />
      ))}
    </CrudShell>
  );
}

function TemplatesView({
  customTemplates,
  hasTemplateProfile,
  onOpenAccount,
  onTemplateCreated,
  onUseTemplate,
  proposalTemplates,
}: {
  customTemplates: ProposalTemplate[];
  hasTemplateProfile: boolean;
  onOpenAccount: () => void;
  onTemplateCreated: (template: ProposalTemplate) => void;
  onUseTemplate: (template: ProposalTemplate) => void;
  proposalTemplates: ProposalTemplate[];
}) {
  const [uploadForm, setUploadForm] = useState({ title: "", niche: "", serviceName: "", price: 0, deadline: "", payment: "", included: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(proposalTemplates.length / pageSize));
  const visibleTemplates = proposalTemplates.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  async function submitImportedTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Envie um PDF, planilha ou imagem do template.");
      return;
    }
    const data = new FormData();
    data.append("file", file);
    Object.entries(uploadForm).forEach(([key, value]) => data.append(key, String(value)));
    setSaving(true);
    try {
      const response = await fetch("/api/proposal-templates", { method: "POST", body: data });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível importar o template."));
      const template = (await response.json()) as ProposalTemplate;
      onTemplateCreated(template);
      setUploadForm({ title: "", niche: "", serviceName: "", price: 0, deadline: "", payment: "", included: "", notes: "" });
      setFile(null);
      onUseTemplate(template);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível importar o template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrudShell
      eyebrow="Templates"
      title="Modelos prontos por nicho"
      description="Use um modelo como ponto de partida. Ele preenche serviço, valor, prazo, pagamento, itens inclusos e observações."
      contentClassName="max-h-[calc(100vh-11rem)] content-start overflow-y-auto overscroll-contain lg:sticky lg:top-32"
      form={
        <form className="grid gap-4" onSubmit={submitImportedTemplate}>
          {!hasTemplateProfile ? (
            <div className="grid gap-3 rounded-lg border border-blue-700/20 bg-blue-50 p-3 text-blue-950">
              <p className="text-sm font-bold leading-6">
                Informe nicho e segmento na sua conta para liberar os modelos prontos do seu perfil.
              </p>
              <button className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 font-black text-white" type="button" onClick={onOpenAccount}>
                Abrir conta
              </button>
            </div>
          ) : null}
          <SectionHeading eyebrow="Importar template" title="Subir PDF, planilha ou print" />
          <input accept=".pdf,.csv,.xls,.xlsx,image/png,image/jpeg,image/webp" className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <TextField label="Titulo do template" maxLength={80} required value={uploadForm.title} onChange={(value) => setUploadForm({ ...uploadForm, title: value })} />
          <TextField label="Nicho" maxLength={80} placeholder="Ex: Designer, Manicure, Eletricista" value={uploadForm.niche} onChange={(value) => setUploadForm({ ...uploadForm, niche: value })} />
          <TextField label="Serviço" maxLength={100} required value={uploadForm.serviceName} onChange={(value) => setUploadForm({ ...uploadForm, serviceName: value })} />
          <TextField label="Valor" min={1} required step="1" type="number" value={uploadForm.price || ""} onChange={(value) => setUploadForm({ ...uploadForm, price: Number(value || 0) })} />
          <TextField label="Prazo" maxLength={80} required value={uploadForm.deadline} onChange={(value) => setUploadForm({ ...uploadForm, deadline: value })} />
          <TextField label="Pagamento" maxLength={120} value={uploadForm.payment} onChange={(value) => setUploadForm({ ...uploadForm, payment: value })} />
          <TextAreaField label="Itens inclusos" maxLength={1200} placeholder={"Um item por linha"} value={uploadForm.included} onChange={(value) => setUploadForm({ ...uploadForm, included: value })} />
          <TextAreaField label="Observações" maxLength={800} rows={3} value={uploadForm.notes} onChange={(value) => setUploadForm({ ...uploadForm, notes: value })} />
          {error ? <FormError message={error} /> : null}
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60" disabled={saving} type="submit">
            <FileDown size={18} />
            {saving ? "Importando..." : "Importar e usar template"}
          </button>
          {customTemplates.length ? <p className="text-sm font-bold text-slate-500">{customTemplates.length} template(s) importado(s) salvos.</p> : null}
        </form>
      }
    >
      <div className="grid gap-3">
        {visibleTemplates.map((template) => (
          <article className="grid gap-4 rounded-lg border border-black/10 p-4" key={template.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                  {template.niche}
                </span>
                <h3 className="mt-3 text-xl font-black">{template.title}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {money.format(template.price)} | {template.deadline}
                </p>
              </div>
              <BarChart3 className="text-blue-700" size={24} />
            </div>

            <ul className="list-disc pl-5 leading-7 text-slate-600">
              {template.included.slice(0, 4).map((item, index) => (
                <li key={`${template.id}-${item}-${index}`}>{item}</li>
              ))}
            </ul>

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white"
              type="button"
              onClick={() => onUseTemplate(template)}
            >
              <Sparkles size={18} />
              Usar template
            </button>
          </article>
        ))}
      </div>

      <div className="mt-1 flex flex-col gap-3 rounded-lg border border-black/10 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-600">
          Página {page} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="min-h-10 rounded-lg border border-black/10 px-4 font-black disabled:opacity-40"
            disabled={page <= 1}
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>
          <button
            className="min-h-10 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-40"
            disabled={page >= totalPages}
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Proxima
          </button>
        </div>
      </div>
    </CrudShell>
  );
}

function MarketingArtsView({
  arts,
  billing,
  brand,
  notice,
  onApprove,
  onCreate,
  onNotice,
  onRemove,
  services,
}: {
  arts: MarketingArt[];
  billing: BillingState | null;
  brand: BrandProfile;
  notice: string | null;
  onCreate: (payload: {
    title: string;
    format: string;
    objective: string;
    serviceName: string;
    audience: string;
    callToAction: string;
    referenceImageUrl: string | null;
    referenceImageUrls?: string[] | null;
    useImageAsBackground: boolean;
  }) => Promise<MarketingArt>;
  onApprove: (id: string) => Promise<void>;
  onNotice: (message: string | null) => void;
  onRemove: (id: string) => void;
  services: ServiceItem[];
}) {
  const [form, setForm] = useState({
    title: "",
    format: "all",
    objective: "",
    serviceName: "",
    audience: "",
    callToAction: "Peça seu orçamento",
    useImageAsBackground: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [backgroundFileIndex, setBackgroundFileIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBriefId, setSelectedBriefId] = useState("");
  const used = billing?.usage.artsThisMonth ?? 0;
  const limit = billing?.usage.artLimit ?? 0;
  const remaining = Math.max(0, limit - used);
  const formatsToGenerate = form.format === "all" ? ["instagram_post", "instagram_story", "whatsapp_status"] : [form.format];
  const selectedBrief = marketingArtBriefs.find((item) => item.id === selectedBriefId);
  const formatOptions = [
    { value: "all", label: "Post + Story + Status", credits: 3 },
    { value: "instagram_post", label: "Somente post", credits: 1 },
    { value: "instagram_story", label: "Somente story", credits: 1 },
    { value: "whatsapp_status", label: "Somente status WhatsApp", credits: 1 },
  ];
  const selectedFormat = formatOptions.find((option) => option.value === form.format) || formatOptions[0];
  const requestSummary = [
    form.serviceName ? `Oferta: ${form.serviceName}` : null,
    selectedBrief ? `Tipo: ${selectedBrief.label}` : null,
    form.audience ? `Público: ${form.audience}` : null,
    form.callToAction ? `Chamada: ${form.callToAction}` : null,
  ].filter(Boolean);

  async function requestArt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.objective.trim()) {
      setError("Escreva o que você quer divulgar.");
      return;
    }
    if (remaining < formatsToGenerate.length) {
      setError(`Você precisa de ${formatsToGenerate.length} crédito(s) para solicitar essa opção.`);
      return;
    }

    setCreating(true);
    try {
      const uploadedImageUrls: string[] = [];
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: uploadData });
        if (!uploadResponse.ok) throw new Error("Falha ao enviar imagem.");
        const uploadResult = (await uploadResponse.json()) as { imageUrl: string };
        uploadedImageUrls.push(uploadResult.imageUrl);
      }
      const selectedBackgroundUrl = uploadedImageUrls[Math.min(backgroundFileIndex, Math.max(0, uploadedImageUrls.length - 1))];
      const orderedUploadedUrls =
        form.useImageAsBackground && selectedBackgroundUrl
          ? [selectedBackgroundUrl, ...uploadedImageUrls.filter((url) => url !== selectedBackgroundUrl)]
          : uploadedImageUrls;
      const referenceImageUrls = orderedUploadedUrls.length ? orderedUploadedUrls : form.useImageAsBackground ? [] : brand.logoUrl ? [brand.logoUrl] : [];
      const referenceImageUrl = referenceImageUrls[0] || null;

      const brief = marketingArtBriefs.find((item) => item.id === selectedBriefId);
      const finalObjective = [brief?.objective, `Pedido do cliente: ${form.objective}`].filter(Boolean).join(" ");
      const formatNames: Record<string, string> = {
        instagram_post: "Post",
        instagram_story: "Story",
        whatsapp_status: "Status",
      };

      for (const format of formatsToGenerate) {
        await onCreate({
          ...form,
          format,
          objective: finalObjective,
          title: form.title || `${formatNames[format] || "Arte"} - ${form.objective.slice(0, 45)}`,
          referenceImageUrl,
          referenceImageUrls,
        });
      }
      setForm({
        title: "",
        format: form.format,
        objective: "",
        serviceName: "",
        audience: "",
        callToAction: "Peça seu orçamento",
        useImageAsBackground: form.useImageAsBackground,
      });
      setSelectedBriefId("");
      setFiles([]);
      setBackgroundFileIndex(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível solicitar a arte.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:sticky lg:top-32">
        {notice ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-800">
            <span>{notice}</span>
            <button className="font-black" type="button" onClick={() => onNotice(null)}>
              Fechar
            </button>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-black uppercase text-blue-700">Artes de divulgação</p>
          <h2 className="text-2xl font-black">Criar arte de divulgação</h2>
          <p className="mt-2 leading-7 text-slate-600">
            Peça uma arte para divulgar seu serviço no Instagram ou WhatsApp. A equipe prepara e você aprova antes de baixar.
          </p>
        </div>

        <div className="rounded-lg border border-black/10 bg-slate-50 p-3 text-sm font-black text-slate-700">
          Uso atual: {isUnlimitedArtLimit(limit) ? `${used} artes este mês, sem limite` : `${used}/${limit} artes este mês`}
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: isUnlimitedArtLimit(limit) ? "100%" : limit ? `${Math.min(100, Math.round((used / limit) * 100))}%` : "0%" }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {isUnlimitedArtLimit(limit) ? "Artes ilimitadas neste ciclo." : limit ? `${remaining} crédito(s) restantes neste ciclo.` : "Disponível a partir do plano Profissional e pacote de artes."}
          </p>
        </div>

        <form className="grid gap-5" onSubmit={requestArt}>
          {error ? <FormError message={error} /> : null}

          <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-green-600 text-sm font-black text-white">1</span>
              <div>
                <h3 className="font-black text-slate-900">Pedido</h3>
                <p className="text-xs font-bold text-slate-500">Diga onde a arte será usada e como você quer encontrá-la depois.</p>
              </div>
            </div>

            <TextField label="Nome interno" maxLength={80} placeholder="Promocao de hoje" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            <label className="grid gap-2 text-sm font-extrabold text-slate-600">
              Formato
              <select
                className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
                value={form.format}
                onChange={(event) => setForm({ ...form, format: event.target.value })}
              >
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.credits} crédito{option.credits > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-green-600 text-sm font-black text-white">2</span>
              <div>
                <h3 className="font-black text-slate-900">Campanha</h3>
                <p className="text-xs font-bold text-slate-500">Escolha um ponto de partida e preencha os detalhes principais.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {marketingArtBriefs.map((brief) => {
                const active = selectedBriefId === brief.id;
                return (
                  <button
                    className={`min-h-10 rounded-full border px-3 text-sm font-black ${
                      active ? "border-green-600 bg-green-600 text-white" : "border-black/10 bg-slate-50 text-slate-700 hover:border-green-600/50"
                    }`}
                    key={brief.id}
                    type="button"
                    onClick={() => {
                      setSelectedBriefId(brief.id);
                      setForm({ ...form, callToAction: brief.callToAction });
                    }}
                  >
                    {brief.label}
                  </button>
                );
              })}
            </div>

            {selectedBrief ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold leading-5 text-green-800">
                {selectedBrief.objective}
              </p>
            ) : null}

            <SelectField
              label="Serviço ou produto"
              options={services.map((service) => service.name)}
              placeholder="Ex: Marmita grande, manicure, site profissional"
              value={form.serviceName}
              onChange={(value) => setForm({ ...form, serviceName: value })}
            />
            <TextAreaField
              label="Texto do pedido"
              maxLength={400}
              placeholder="Ex: Marmita grande com suco por R$ 22 hoje. Pedido pelo WhatsApp. Entrega até 14h."
              required
              rows={4}
              value={form.objective}
              onChange={(value) => setForm({ ...form, objective: value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Cidade ou público" maxLength={120} placeholder="Uberlândia, noivas, lojas..." value={form.audience} onChange={(value) => setForm({ ...form, audience: value })} />
              <TextField label="Chamada da arte" maxLength={80} value={form.callToAction} onChange={(value) => setForm({ ...form, callToAction: value })} />
            </div>
          </div>

          <label className="grid gap-2 rounded-lg border border-dashed border-black/15 bg-slate-50 p-3 text-sm font-extrabold text-slate-600">
            Referencias visuais
            <input
              accept="image/*"
              className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
              multiple
              type="file"
              onChange={(event) => {
                setFiles(Array.from(event.target.files || []));
                setBackgroundFileIndex(0);
              }}
            />
            <span className="text-xs font-bold text-slate-500">
              Opcional. Envie fotos do produto, logo, referência visual ou imagem que deve entrar na peça.
            </span>
            {files.length ? (
              <span className="text-xs font-bold text-green-700">
                {files.length} imagem{files.length > 1 ? "s" : ""} selecionada{files.length > 1 ? "s" : ""}.
              </span>
            ) : null}
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-black/10 bg-slate-50 p-3 text-sm font-bold text-slate-600">
            <input
              className="mt-1"
              type="checkbox"
              checked={form.useImageAsBackground}
              onChange={(event) => setForm({ ...form, useImageAsBackground: event.target.checked })}
            />
            <span>
              Usar a referência como fundo
              <span className="block text-xs font-bold text-slate-500">Marque quando a foto enviada deve ser a base visual da arte.</span>
            </span>
          </label>
          {form.useImageAsBackground && files.length > 1 ? (
            <label className="grid gap-2 text-sm font-extrabold text-slate-600">
              Qual imagem será o fundo?
              <select
                className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
                value={backgroundFileIndex}
                onChange={(event) => setBackgroundFileIndex(Number(event.target.value))}
              >
                {files.map((file, index) => (
                  <option key={`${file.name}-${index}`} value={index}>
                    {index + 1}. {file.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="rounded-lg border border-black/10 bg-slate-50 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black text-slate-700">Resumo do envio</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${remaining >= formatsToGenerate.length ? "bg-green-100 text-green-800" : "bg-rose-100 text-rose-800"}`}>
                {selectedFormat.credits} crédito{selectedFormat.credits > 1 ? "s" : ""}
              </span>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
              {requestSummary.length ? requestSummary.join(" | ") : "Escolha o tipo, descreva a campanha e envie para a equipe preparar a arte."}
            </p>
          </div>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white shadow-lg shadow-green-900/10 disabled:opacity-60" disabled={creating || limit === 0 || remaining < formatsToGenerate.length} type="submit">
            <Sparkles size={18} />
            {creating ? "Enviando..." : formatsToGenerate.length > 1 ? "Enviar solicitações" : "Enviar solicitação"}
          </button>
        </form>
      </aside>

      <div className="grid gap-4">
        <section className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Acompanhamento" title="Pedidos de arte" />
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700">
              {brand.businessName}
            </span>
          </div>
          {arts.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {arts.map((art) => (
                <article className="overflow-hidden rounded-lg border border-black/10 bg-white" key={art.id}>
                  {art.imageUrl ? (
                    <a href={art.imageUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={art.title}
                        className={`${art.format === "instagram_post" ? "aspect-square" : "aspect-[9/16]"} w-full bg-slate-100 object-cover`}
                        src={art.imageUrl}
                      />
                    </a>
                  ) : (
                    <div className={`${art.format === "instagram_post" ? "aspect-square" : "aspect-[9/16]"} grid w-full place-items-center bg-slate-100 p-6 text-center`}>
                      <div>
                        <ImageIcon className="mx-auto text-blue-700" size={34} />
                        <p className="mt-3 text-sm font-black text-slate-700">Aguardando upload da equipe</p>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 p-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-black">{art.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${marketingArtStatusClass(art)}`}>
                          {marketingArtStatusLabel(art)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                        {art.serviceName || "Divulgação"} | {art.format.replace("_", " ")}
                      </p>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">{art.objective}</p>
                    {art.caption || art.whatsappMessage ? (
                      <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                        {art.caption ? (
                          <div className="grid gap-1">
                            <div>
                              <span className="font-black text-slate-900">Legenda: </span>
                              {art.caption}
                            </div>
                            <button className="justify-self-start text-xs font-black text-blue-700" type="button" onClick={() => navigator.clipboard.writeText(art.caption || "")}>
                              Copiar legenda
                            </button>
                          </div>
                        ) : null}
                        {art.whatsappMessage ? (
                          <div className="grid gap-1">
                            <div>
                              <span className="font-black text-slate-900">WhatsApp: </span>
                              {art.whatsappMessage}
                            </div>
                            <button className="justify-self-start text-xs font-black text-blue-700" type="button" onClick={() => navigator.clipboard.writeText(art.whatsappMessage || "")}>
                              Copiar WhatsApp
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      {marketingArtCanDownload(art) ? (
                        <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-black text-blue-700" href={art.imageUrl} target="_blank" rel="noreferrer">
                          <FileDown size={15} />
                          Baixar
                        </a>
                      ) : art.source === "uploaded" && art.imageUrl ? (
                        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-black text-white" type="button" onClick={() => onApprove(art.id)}>
                          <CheckCircle2 size={15} />
                          Aprovar
                        </button>
                      ) : (
                        <span className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-100 px-3 text-sm font-black text-slate-500">
                          Em preparo
                        </span>
                      )}
                      <button
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-700/20 px-3 text-sm font-black text-rose-700"
                        type="button"
                        onClick={() => {
                          if (window.confirm("Remover esta arte?")) onRemove(art.id);
                        }}
                      >
                        <Trash2 size={15} />
                        Remover
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <Palette className="mx-auto text-blue-700" size={32} />
                <p className="mt-3 font-black">Nenhum pedido de arte ainda.</p>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                  Preencha o objetivo, escolha o formato e gere a primeira peça de divulgação.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function marketingArtStatusLabel(art: MarketingArt) {
  if (marketingArtCanDownload(art)) return "Aprovada";
  if (art.source === "uploaded") return "Aguardando aprovação";
  if (art.source === "requested") return "Solicitada";
  return "Em preparo";
}

function marketingArtStatusClass(art: MarketingArt) {
  if (marketingArtCanDownload(art)) return "bg-green-50 text-green-700";
  if (art.source === "uploaded") return "bg-blue-50 text-blue-700";
  if (art.source === "requested") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function marketingArtCanDownload(art: MarketingArt) {
  return Boolean(art.imageUrl && (art.source === "approved" || !["requested", "uploaded"].includes(art.source)));
}

function PlansView({
  billing,
  notice,
  onNotice,
}: {
  billing: BillingState | null;
  notice: string | null;
  onNotice: (message: string | null) => void;
}) {
  const [payingPlan, setPayingPlan] = useState<PlanCode | null>(null);
  const [payingArtPack, setPayingArtPack] = useState<ArtPackCode | null>(null);
  const [paymentError, setPaymentError] = useState("");

  function payPlan(plan: PlanCode) {
    setPaymentError("");
    setPayingPlan(plan);
    window.location.href = `/checkout/plano/${plan}`;
  }

  async function payArtPack(artPack: ArtPackCode) {
    setPaymentError("");
    setPayingArtPack(artPack);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artPack }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; url?: string } | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Não foi possível abrir o pagamento.");
      }
      window.location.href = data.url;
    } catch (caught) {
      setPaymentError(caught instanceof Error ? caught.message : "Não foi possível abrir o pagamento.");
      setPayingArtPack(null);
    }
  }

  if (!billing) {
    return (
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <p className="leading-7 text-slate-600">Carregando planos...</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-800">
          <span>{notice}</span>
          <button className="font-black" type="button" onClick={() => onNotice(null)}>
            Fechar
          </button>
        </div>
      ) : null}

      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <p className="text-xs font-black uppercase text-blue-700">Assinatura</p>
        <h2 className="text-2xl font-black">Planos do FechaPro</h2>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Escolha o plano ideal e pague com segurança pelo Mercado Pago. O acesso é liberado imediatamente após a confirmação.
        </p>
        {paymentError ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{paymentError}</p>
        ) : null}
        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-black text-slate-700">
          Status: {["active", "trial"].includes(billing.subscription.status) && ["mercadopago", "admin"].includes(billing.subscription.provider || "") ? "ativo" : "aguardando pagamento/liberação"}
          <span className="mt-1 block">
            Uso atual: {billing.usage.proposalsThisMonth}
            {isUnlimitedProposalLimit(billing.usage.proposalLimit) ? " propostas este mês, sem limite" : `/${billing.usage.proposalLimit} propostas este mês`}
          </span>
          {!isUnlimitedProposalLimit(billing.usage.proposalLimit) ? (
            <span className="mt-1 block">
              Saldo acumulado: {billing.usage.proposalsUsedSinceSubscriptionStart || 0}/{billing.usage.accumulatedProposalLimit || billing.usage.proposalLimit} propostas
            </span>
          ) : null}
          <span className="mt-1 block">
            Artes de divulgação: {billing.usage.artsThisMonth}
            {isUnlimitedArtLimit(billing.usage.artLimit) ? " este mês, sem limite" : `/${billing.usage.artLimit} este mês`}
          </span>
          <span className="mt-1 block">
            Créditos extras de artes: {billing.usage.artCreditBalance}
          </span>
        </div>
        {billing.plans.find((plan) => plan.code === billing.subscription.plan)?.serviceEntitlements?.length ? (
          <div className="mt-3 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm text-green-900">
            <span className="block text-xs font-black uppercase text-green-700">Entregas contratadas</span>
            <ul className="mt-2 grid gap-1 font-bold">
              {billing.plans
                .find((plan) => plan.code === billing.subscription.plan)
                ?.serviceEntitlements?.map((item) => (
                  <li className="grid grid-cols-[auto_1fr] gap-2" key={item}>
                    <CheckCircle2 className="mt-0.5 text-green-700" size={15} />
                    {item}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
        {billing.plans.map((plan) => {
          const active = billing.subscription.plan === plan.code && ["active", "trial"].includes(billing.subscription.status) && ["mercadopago", "admin"].includes(billing.subscription.provider || "");
          const recommended = plan.code === "premium_site";
          return (
            <article
              className={`relative grid gap-4 rounded-lg border p-4 shadow-xl shadow-slate-900/10 ${
                active ? "border-green-600 bg-green-50" : "border-black/10 bg-white"
              } grid-rows-[auto_auto_auto_1fr_auto]`}
              key={plan.code}
            >
              {recommended ? (
                <span className="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-black uppercase text-white">
                  Melhor oferta de lançamento
                </span>
              ) : null}
              <div>
                <span className="text-xs font-black uppercase text-blue-700">{active ? "Plano atual" : "Plano"}</span>
                <h3 className="mt-1 text-2xl font-black">{plan.name}</h3>
                {plan.code === "premium_site" ? (
                  <p className="mt-2 text-xs font-black uppercase text-green-700">Pacote completo anual</p>
                ) : null}
                {plan.code === "premium_site" ? (
                  <p className="mt-1 text-sm font-black text-slate-400 line-through">R$ 2.997/ano</p>
                ) : null}
                <p className="mt-1 text-lg font-black text-green-700">{plan.price}</p>
                {plan.annualPrice ? (
                  <p className="mt-1 text-sm font-black text-slate-500">ou {plan.annualPrice}</p>
                ) : null}
                {plan.maintenancePrice ? (
                  <p className="mt-1 text-sm font-black text-slate-500">{plan.maintenancePrice}</p>
                ) : null}
                {plan.code === "premium_site" ? (
                  <p className="mt-2 rounded-lg bg-green-50 p-3 text-xs font-black leading-5 text-green-900">
                    Sistema, mini site, implantação assistida, materiais comerciais e treinamento.
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-bold text-slate-500">
                {isUnlimitedProposalLimit(plan.proposalLimit) ? "Propostas ilimitadas" : `Até ${plan.proposalLimit} propostas por mês`}
                {!isUnlimitedProposalLimit(plan.proposalLimit) ? (
                  <span className="mt-1 block">Renova todo mês e acumula o saldo não usado</span>
                ) : null}
                <span className="mt-1 block">
                  {isUnlimitedArtLimit(plan.artLimit)
                    ? "Artes de divulgação ilimitadas"
                    : plan.artLimit > 0
                      ? `${plan.artLimit} artes de divulgação por mês`
                      : "Artes de divulgação não inclusas"}
                </span>
              </p>
              <div className="rounded-lg border border-black/10 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                <span className="block font-black uppercase text-slate-500">Módulos liberados</span>
                {availableModuleLabels(plan.code)}
              </div>
              <ul className="list-disc pl-5 leading-7 text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {plan.serviceEntitlements?.length ? (
                <div className="rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold leading-6 text-green-900">
                  <span className="block text-xs font-black uppercase text-green-700">Entregas da equipe</span>
                  <ul className="mt-2 grid gap-1">
                    {plan.serviceEntitlements.map((item) => (
                      <li className="grid grid-cols-[auto_1fr] gap-2" key={item}>
                        <CheckCircle2 className="mt-1 text-green-700" size={15} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <button
                className={`min-h-11 rounded-lg px-4 font-black ${
                  active ? "border border-green-600 text-green-800" : "bg-green-600 text-white"
                }`}
                type="button"
                disabled={active || payingPlan === plan.code}
                onClick={() => payPlan(plan.code)}
              >
                {active ? "Selecionado" : payingPlan === plan.code ? "Abrindo pagamento..." : "Pagar agora"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <p className="text-xs font-black uppercase text-blue-700">Criações individuais</p>
        <h2 className="mt-1 text-2xl font-black">Pacotes extras de artes</h2>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Cada perfil mantém só um plano principal ativo. Se precisar criar mais artes, compre créditos individuais sem trocar sua assinatura.
        </p>
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-3">
          {billing.artPacks.map((pack) => (
            <article className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-4 rounded-lg border border-black/10 bg-slate-50 p-4" key={pack.code}>
              <div>
                <span className="text-xs font-black uppercase text-blue-700">Pacote</span>
                <h3 className="mt-1 text-xl font-black">{pack.name}</h3>
                <p className="mt-1 text-lg font-black text-green-700">{pack.price}</p>
              </div>
              <p className="rounded-lg bg-white p-3 text-sm font-black text-slate-700">
                {pack.credits} crédito{pack.credits > 1 ? "s" : ""} para artes de divulgação.
              </p>
              <ul className="list-disc pl-5 leading-7 text-slate-600">
                {pack.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className="min-h-11 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-65"
                type="button"
                disabled={payingArtPack === pack.code}
                onClick={() => payArtPack(pack.code)}
              >
                {payingArtPack === pack.code ? "Abrindo pagamento..." : "Comprar créditos"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccountView({
  onChange,
  session,
}: {
  onChange: (session: SessionProfile) => void;
  session: SessionProfile;
}) {
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [niche, setNiche] = useState(session.niche || "");
  const [segment, setSegment] = useState(session.segment || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    if (!name.trim() || !email.trim() || !niche.trim() || !segment) {
      setError("Informe nome, e-mail, nicho e segmento.");
      setSaving(false);
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("Informe um e-mail válido.");
      setSaving(false);
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      setSaving(false);
      return;
    }
    if (newPassword && !currentPassword) {
      setError("Informe a senha atual para trocar a senha.");
      setSaving(false);
      return;
    }

    try {
      const updated = await apiPut<SessionProfile>("/api/account", {
        name,
        email,
        niche,
        segment,
        currentPassword,
        newPassword,
      });
      onChange(updated);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Conta atualizada com sucesso.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar sua conta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
      <div className="overflow-hidden rounded-lg border border-black/10 bg-slate-950 shadow-xl shadow-slate-900/10 lg:col-span-2">
        <div className="grid gap-5 p-5 text-white md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase text-green-300">Minha conta</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">Perfil e acesso</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-300">
              Mantenha seus dados atualizados para assinar propostas, receber respostas dos clientes e acessar o FechaPro com segurança.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-3">
            <span className="grid size-11 place-items-center rounded-lg bg-green-500 text-white">
              <UserCircle size={24} />
            </span>
            <div>
              <p className="text-sm font-black">{session.name}</p>
              <p className="text-xs font-bold text-slate-300">{session.email}</p>
            </div>
          </div>
        </div>
      </div>

      <form className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10" onSubmit={saveAccount}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-700 text-white">
            <UserCircle size={20} />
          </span>
          <div>
            <SectionHeading eyebrow="Perfil da conta" title="Dados de acesso e templates" />
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">Nome e e-mail identificam a conta. Nicho e segmento definem os modelos prontos exibidos para voce.</p>
          </div>
        </div>

        {message ? <div className="rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-900">{message}</div> : null}
        {error ? <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nome" autoComplete="name" maxLength={80} required value={name} onChange={setName} />
          <TextField label="E-mail" autoComplete="email" required type="email" value={email} onChange={setEmail} />
          <SelectField label="Nicho" options={proposalTemplateNiches} placeholder="Ex: Contabilidade" required value={niche} onChange={setNiche} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-600">
            Segmento
            <select className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700" required value={segment} onChange={(event) => setSegment(event.target.value)}>
              <option value="">Selecione</option>
              {businessSegments.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-2 grid gap-4 rounded-lg border border-black/10 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-green-600 text-white">
              <LockKeyhole size={19} />
            </span>
            <div>
              <h3 className="font-black">Trocar senha</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-600">Preencha apenas se quiser alterar sua senha atual.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Senha atual" autoComplete="current-password" type="password" value={currentPassword} onChange={setCurrentPassword} />
            <TextField label="Nova senha" autoComplete="new-password" minLength={8} type="password" value={newPassword} onChange={setNewPassword} />
          </div>
        </div>

        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 font-black text-white disabled:opacity-60" disabled={saving} type="submit">
          <CheckCircle2 size={18} />
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <aside className="grid content-start gap-4">
        <div className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10">
          <p className="text-xs font-black uppercase text-blue-700">Status da conta</p>
          <div className="mt-4 grid gap-3">
            <AccountStatusItem label="Perfil identificado" detail={name || "Nome não informado"} done={Boolean(name.trim())} />
            <AccountStatusItem label="E-mail de acesso" detail={email || "E-mail não informado"} done={isValidEmail(email.trim())} />
            <AccountStatusItem label="Modelos do perfil" detail={niche || "Nicho nao informado"} done={Boolean(niche.trim() && segment)} />
            <AccountStatusItem label="Senha protegida" detail="Use pelo menos 8 caracteres ao trocar a senha." done={!newPassword || newPassword.length >= 8} />
          </div>
        </div>

        <div className="rounded-lg border border-green-700/20 bg-green-50 p-5 shadow-xl shadow-slate-900/10">
          <p className="text-xs font-black uppercase text-green-800">Dica rapida</p>
          <h3 className="mt-1 text-lg font-black text-green-950">Conta pronta para vender</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-green-900">
            Depois de salvar, confira a aba Marca para deixar logo, WhatsApp e cores aparecendo nas propostas enviadas.
          </p>
        </div>
      </aside>
    </section>
  );
}

type SupportMessage = {
  id: string;
  role: "user" | "admin" | string;
  body: string;
  createdAt: string;
};

type SupportThread = {
  id: string;
  subject: string;
  status: string;
  messages: SupportMessage[];
};

function SupportView({ session }: { session: { name: string; email: string } }) {
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSupport() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ thread: SupportThread | null }>("/api/support");
      setThread(data.thread);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o suporte.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSupport();
  }, []);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const data = await apiPost<{ thread: SupportThread }>("/api/support", {
        message,
        subject: `Atendimento de ${session.name}`,
      });
      setThread(data.thread);
      setMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar sua mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.42fr]">
      <div className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Suporte</p>
            <h2 className="mt-1 text-2xl font-black">Fale com a equipe</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-600">
              Envie sua dúvida, relato de erro ou pedido de ajuda. A resposta aparece aqui na conversa.
            </p>
          </div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={loadSupport}>
            <RotateCcw size={15} />
            Atualizar
          </button>
        </div>

        {error ? <FormError message={error} /> : null}

        <div className="grid min-h-[320px] content-start gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
          {loading ? (
            <p className="text-sm font-bold text-slate-500">Carregando conversa...</p>
          ) : thread?.messages.length ? (
            thread.messages.map((item) => (
              <div className={`max-w-[86%] rounded-lg p-3 ${item.role === "admin" ? "justify-self-start bg-white" : "justify-self-end bg-green-600 text-white"}`} key={item.id}>
                <p className="text-xs font-black uppercase opacity-75">{item.role === "admin" ? "Administrador" : "Você"}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-bold leading-6">{item.body}</p>
                <p className="mt-2 text-[11px] font-bold opacity-70">{formatDateTime(item.createdAt)}</p>
              </div>
            ))
          ) : (
            <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
              <HelpCircle className="text-blue-700" size={28} />
              <p className="mt-3 font-black">Nenhuma mensagem ainda</p>
              <p className="mt-1 max-w-md text-sm font-bold leading-6 text-slate-500">
                Conte o que tentou fazer e, se apareceu erro, envie a mensagem que apareceu.
              </p>
            </div>
          )}
        </div>

        <form className="grid gap-3" onSubmit={sendMessage}>
          <textarea
            className="min-h-28 rounded-lg border border-black/10 bg-white p-3 font-bold outline-green-700"
            placeholder="Escreva sua mensagem para o suporte"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60" disabled={sending || !message.trim()} type="submit">
            <Send size={17} />
            {sending ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </div>

      <aside className="grid content-start gap-4">
        <div className="rounded-lg border border-blue-700/20 bg-blue-50 p-5">
          <p className="text-xs font-black uppercase text-blue-800">Para agilizar</p>
          <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-blue-950">
            <li>Informe o que tentou fazer.</li>
            <li>Diga se apareceu alguma mensagem de erro.</li>
            <li>Conte em qual tela estava usando o sistema.</li>
          </ul>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <p className="text-xs font-black uppercase text-slate-500">Status</p>
          <p className="mt-2 text-lg font-black">{thread ? supportStatusLabel(thread.status) : "Sem conversa aberta"}</p>
        </div>
      </aside>
    </section>
  );
}

function supportStatusLabel(status: string) {
  if (status === "answered") return "Respondido";
  if (status === "closed") return "Encerrado";
  return "Aberto";
}

function AccountStatusItem({ detail, done, label }: { detail: string; done: boolean; label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-white p-3">
      <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${done ? "bg-green-600 text-white" : "bg-amber-100 text-amber-800"}`}>
        {done ? <CheckCircle2 size={17} /> : <LockKeyhole size={16} />}
      </span>
      <div>
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function isValidLogoUrl(value: string) {
  return isValidHttpUrl(value) || value.startsWith("/");
}

function BrandView({
  brand,
  onChange,
  session,
}: {
  brand: BrandProfile | null;
  onChange: (brand: BrandProfile) => void;
  session: { name: string; email: string };
}) {
  const [form, setForm] = useState<BrandProfile>(
    brand ? { ...brand, whatsapp: maskPhone(brand.whatsapp || "") } : {
      businessName: session.name,
      logoUrl: null,
      primaryColor: "#22C55E",
      secondaryColor: "#0F172A",
      accentColor: "#2563EB",
      whatsapp: null,
      pixKey: null,
      instagram: null,
      email: session.email,
      website: null,
      bio: null,
      proposalStyle: "executive",
      proposalIntro: null,
      proposalClosing: null,
      proposalTerms: null,
      proposalFaq: null,
      showPortfolio: true,
      showTestimonials: true,
      showServices: true,
      showFaq: true,
    },
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brand) setForm({ ...brand, whatsapp: maskPhone(brand.whatsapp || "") });
  }, [brand]);

  async function saveBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.businessName.trim()) {
      setError("Informe o nome comercial.");
      return;
    }
    if (form.logoUrl?.trim() && !isValidLogoUrl(form.logoUrl.trim())) {
      setError("Informe uma URL de logo válida ou mantenha o caminho interno salvo pelo sistema.");
      return;
    }
    if (form.whatsapp?.trim() && !isValidPhone(form.whatsapp.trim())) {
      setError("Informe um WhatsApp válido.");
      return;
    }
    if (form.email?.trim() && !isValidEmail(form.email.trim())) {
      setError("Informe um e-mail comercial válido.");
      return;
    }
    if (form.website?.trim() && !isValidHttpUrl(form.website.trim())) {
      setError("Informe um site válido começando com http:// ou https://.");
      return;
    }
    setSaving(true);
    try {
      let logoUrl = form.logoUrl;
      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("removeBackground", "true");
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: uploadData,
        });
        if (!response.ok) throw new Error("Falha ao enviar logo.");
        const result = (await response.json()) as { imageUrl: string };
        logoUrl = result.imageUrl;
      }

      const saved = await apiPut<BrandProfile>("/api/brand", { ...form, logoUrl });
      onChange(saved);
      setForm(saved);
      setFile(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a marca.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:sticky lg:top-32">
        <div>
          <p className="text-xs font-black uppercase text-blue-700">Configuração</p>
          <h2 className="text-2xl font-black">Marca profissional</h2>
          <p className="mt-2 leading-7 text-slate-600">
            Sua identidade visual aparece em todas as propostas enviadas. Marca completa transmite mais confiança e aumenta o fechamento.
          </p>
        </div>

        <form className="grid gap-3" onSubmit={saveBrand}>
          {error ? <FormError message={error} /> : null}
          <TextField label="Nome comercial" maxLength={80} required value={form.businessName} onChange={(value) => setForm({ ...form, businessName: value })} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-600">
            Logo
            <input
              accept="image/*"
              className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <span className="text-xs font-bold text-slate-500">
              O FechaPro pode remover fundo branco ou claro do logo.
            </span>
          </label>
          <TextField label="URL do logo" placeholder="Opcional: https://... ou /api/uploads/..." value={form.logoUrl || ""} onChange={(value) => setForm({ ...form, logoUrl: value })} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-600">
            Cor principal
            <input
              className="h-12 w-full rounded-lg border border-black/10 bg-slate-50 p-2"
              type="color"
              value={form.primaryColor}
              onChange={(event) => setForm({ ...form, primaryColor: event.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-extrabold text-slate-600">
              Cor de fundo
              <input
                className="h-12 w-full rounded-lg border border-black/10 bg-slate-50 p-2"
                type="color"
                value={form.secondaryColor}
                onChange={(event) => setForm({ ...form, secondaryColor: event.target.value })}
              />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-slate-600">
              Cor de destaque
              <input
                className="h-12 w-full rounded-lg border border-black/10 bg-slate-50 p-2"
                type="color"
                value={form.accentColor}
                onChange={(event) => setForm({ ...form, accentColor: event.target.value })}
              />
            </label>
          </div>
          <TextField label="WhatsApp" autoComplete="tel" maxLength={15} placeholder="(11) 99999-9999" value={form.whatsapp || ""} onChange={(value) => setForm({ ...form, whatsapp: maskPhone(value) })} />
          <TextField label="Chave PIX" maxLength={120} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatoria" value={form.pixKey || ""} onChange={(value) => setForm({ ...form, pixKey: value })} />
          <TextField label="Instagram" maxLength={60} placeholder="@seuperfil" value={form.instagram || ""} onChange={(value) => setForm({ ...form, instagram: value })} />
          <TextField label="E-mail comercial" autoComplete="email" type="email" value={form.email || ""} onChange={(value) => setForm({ ...form, email: value })} />
          <TextField label="Site" placeholder="https://..." type="url" value={form.website || ""} onChange={(value) => setForm({ ...form, website: value })} />
          <TextAreaField label="Bio curta" maxLength={500} rows={3} value={form.bio || ""} onChange={(value) => setForm({ ...form, bio: value })} />
          <div className="mt-2 rounded-lg border border-black/10 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase text-blue-700">Personalização da proposta</p>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                Estilo visual
                <select
                  className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
                  value={form.proposalStyle}
                  onChange={(event) => setForm({ ...form, proposalStyle: event.target.value as BrandProfile["proposalStyle"] })}
                >
                  <option value="executive">Executivo</option>
                  <option value="creative">Criativo</option>
                  <option value="premium">Premium</option>
                  <option value="technical">Técnico</option>
                </select>
              </label>
              <TextAreaField label="Texto de abertura" maxLength={700} rows={3} value={form.proposalIntro || ""} onChange={(value) => setForm({ ...form, proposalIntro: value })} />
              <TextAreaField label="Texto de encerramento" maxLength={700} rows={3} value={form.proposalClosing || ""} onChange={(value) => setForm({ ...form, proposalClosing: value })} />
              <TextAreaField label="Termos padrão" maxLength={1200} rows={4} value={form.proposalTerms || ""} onChange={(value) => setForm({ ...form, proposalTerms: value })} />
              <TextAreaField label="FAQ personalizado" maxLength={1200} placeholder={"Uma pergunta? | Uma resposta\nOutra pergunta? | Outra resposta"} rows={4} value={form.proposalFaq || ""} onChange={(value) => setForm({ ...form, proposalFaq: value })} />
              <div className="grid gap-2 sm:grid-cols-2">
                <ToggleField label="Mostrar portfólio" checked={form.showPortfolio} onChange={(checked) => setForm({ ...form, showPortfolio: checked })} />
                <ToggleField label="Mostrar depoimentos" checked={form.showTestimonials} onChange={(checked) => setForm({ ...form, showTestimonials: checked })} />
                <ToggleField label="Mostrar outros serviços" checked={form.showServices} onChange={(checked) => setForm({ ...form, showServices: checked })} />
                <ToggleField label="Mostrar FAQ" checked={form.showFaq} onChange={(checked) => setForm({ ...form, showFaq: checked })} />
              </div>
            </div>
          </div>
          <SubmitButton label={saving ? "Salvando..." : "Salvar marca"} />
        </form>
      </aside>

      <div className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <div className="overflow-hidden rounded-lg border border-black/10">
          <div className="h-3" style={{ background: `linear-gradient(90deg, ${form.primaryColor}, ${form.accentColor})` }} />
          <div className="p-4">
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="h-14 w-14 rounded-lg object-cover" src={form.logoUrl} />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-lg font-black text-white" style={{ background: form.primaryColor }}>
                FP
              </div>
            )}
            <div>
              <h3 className="text-xl font-black">{form.businessName || "Sua marca"}</h3>
              <p className="text-sm font-bold text-slate-500">{form.bio || "Bio profissional aparece aqui."}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
            <span>WhatsApp: {form.whatsapp || "Não informado"}</span>
            <span>PIX: {form.pixKey || "Não informado"}</span>
            <span>Instagram: {form.instagram || "Não informado"}</span>
            <span>E-mail: {form.email || "Não informado"}</span>
            <span>Site: {form.website || "Não informado"}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <ColorSwatch label="Principal" value={form.primaryColor} />
            <ColorSwatch label="Fundo" value={form.secondaryColor} />
            <ColorSwatch label="Destaque" value={form.accentColor} />
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-black uppercase text-blue-700">Proposta</p>
            <strong className="mt-1 block">Estilo {proposalStyleLabel(form.proposalStyle)}</strong>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{form.proposalIntro || "Texto de abertura personalizado aparece aqui."}</p>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleField({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-lg border border-black/10 bg-white px-3 text-sm font-extrabold text-slate-600">
      <input className="size-4 accent-green-700" checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function proposalStyleLabel(style: BrandProfile["proposalStyle"]) {
  const labels = {
    executive: "executivo",
    creative: "criativo",
    premium: "premium",
    technical: "técnico",
    modern: "executivo",
    classic: "técnico",
  };
  return labels[style] || "executivo";
}

function ColorSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-2">
      <div className="h-9 rounded-md" style={{ background: value }} />
      <span className="mt-2 block text-xs font-black text-slate-500">{label}</span>
      <strong className="text-xs">{value}</strong>
    </div>
  );
}

function initials(value: string) {
  const words = value.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase()).join("") || "FP";
}

function CsvImportBox<T>({
  kind,
  onImported,
  sampleHeaders,
}: {
  kind: ImportKind;
  onImported: (created: T[]) => void;
  sampleHeaders: string[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  async function importFile(file: File | null) {
    setMessage(null);
    setErrors([]);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors(["Envie um arquivo CSV salvo pelo Excel."]);
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const response = await apiPost<ImportResult<T>>("/api/imports", { kind, rows });
      onImported(response.created);
      setErrors(response.errors);
      setMessage(`${response.created.length} registro${response.created.length === 1 ? "" : "s"} importado${response.created.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setErrors([caught instanceof Error ? caught.message : "Não foi possível importar a planilha."]);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-black/20 bg-slate-50 p-3">
      <div className="flex items-start gap-2">
        <Upload className="mt-0.5 text-blue-700" size={18} />
        <div>
          <p className="text-sm font-black text-slate-800">Importar CSV do Excel</p>
          <p className="text-xs font-bold leading-5 text-slate-500">Cabecalho: {sampleHeaders.join(", ")}</p>
        </div>
      </div>
      <input
        accept=".csv,text/csv"
        className="text-sm font-bold text-slate-700 file:mr-3 file:min-h-9 file:rounded-lg file:border-0 file:bg-blue-700 file:px-3 file:font-black file:text-white"
        disabled={importing}
        type="file"
        onChange={(event) => importFile(event.target.files?.[0] || null)}
      />
      {message ? <p className="text-sm font-black text-green-700">{message}</p> : null}
      {errors.length ? (
        <ul className="list-disc pl-5 text-xs font-bold leading-5 text-red-700">
          {errors.slice(0, 5).map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CrudShell({
  children,
  contentClassName = "",
  description,
  eyebrow,
  form,
  title,
}: {
  children: React.ReactNode;
  contentClassName?: string;
  description: string;
  eyebrow: string;
  form: React.ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:sticky lg:top-32">
        <div>
          <p className="text-xs font-black uppercase text-blue-700">{eyebrow}</p>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-2 leading-7 text-slate-600">{description}</p>
        </div>
        {form}
      </aside>
      <div className={`grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 ${contentClassName}`}>
        {children || <p className="leading-7 text-slate-600">Nenhum registro cadastrado ainda.</p>}
      </div>
    </section>
  );
}

function LandingRange({
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
  valueLabel: string;
}) {
  return (
    <label className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <strong className="text-2xl font-black text-slate-950">{valueLabel}</strong>
      <input
        className="accent-green-600"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}


const salesValueUpdates = [
  {
    icon: FileText,
    title: "Propostas que passam mais confiança",
    description: "Link público, PDF profissional, aceite online, recusa com motivo, reenvio e cópia para montar novas vendas sem recomeçar do zero.",
    tag: "Venda",
  },
  {
    icon: BarChart3,
    title: "Saiba a hora exata que o cliente abriu",
    description: "Veja status, visualizações, cliques no WhatsApp, aceite, pagamento e histórico para puxar o follow-up no momento certo — não no escuro.",
    tag: "Controle",
  },
  {
    icon: Layers3,
    title: "Modelos, pacotes e nichos prontos",
    description: "Use templates por segmento, combine vários serviços, salve ofertas recorrentes e mantenha preço, prazo e escopo padronizados.",
    tag: "Rapidez",
  },
  {
    icon: CreditCard,
    title: "Recebimento por proposta",
    description: "Defina Mercado Pago ou PIX direto em cada proposta, com QR Code, código copia e cola e acompanhamento de pagamento no fluxo integrado.",
    tag: "Caixa",
  },
  {
    icon: Palette,
    title: "Divulgação pronta para atrair clientes",
    description: "Solicite artes para post, story e status, envie referências, acompanhe aprovação, copie legenda e mensagem para chamar no WhatsApp.",
    tag: "Atração",
  },
  {
    icon: BriefcaseBusiness,
    title: "Marca, portfólio e prova social",
    description: "Logo, cores, contatos, chave PIX, portfólio, depoimentos e textos comerciais entram na proposta e reforçam autoridade.",
    tag: "Autoridade",
  },
];

const upcomingFeatures = [
  "Fechamento pelo WhatsApp com ações em um clique.",
  "Reengajamento de clientes que abriram a proposta e não responderam.",
  "Timeline única com abertura, aceite, pagamento e conversa.",
  "Editor rápido com bônus, garantias e comparação de planos.",
  "Relatórios de conversão e receita por serviço.",
  "Portal do cliente com status, arquivos e checklist.",
  "Histórico de e-mails enviados e novos controles de entrega.",
];

function ProductUpdatesModal({
  onClose,
  onOpenArts,
  onOpenBrand,
}: {
  onClose: () => void;
  onOpenArts: () => void;
  onOpenBrand: () => void;
}) {
  const nextFeatureGroups = [
    { label: "Em preparo", features: upcomingFeatures.slice(0, 2) },
    { label: "Na fila", features: upcomingFeatures.slice(2, 5) },
    { label: "Em estudo", features: upcomingFeatures.slice(5) },
  ];

  return (
    <div
      aria-labelledby="updates-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid items-end bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg border border-black/10 bg-white shadow-xl shadow-slate-950/30 sm:mx-auto sm:max-w-2xl sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-black/10 bg-white p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-green-700">Novidades do produto</p>
            <h2 id="updates-modal-title" className="mt-1 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              Novidades e próximos recursos
            </h2>
          </div>
          <button
            aria-label="Fechar resumo do FechaPro"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-black/10 bg-white text-slate-800"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 p-4 sm:p-5">
          <section className="rounded-lg bg-slate-950 p-4 text-white sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-xs font-black uppercase text-green-200">Atualização de maio</p>
                <p className="mt-2 text-lg font-black leading-snug">
                  O FechaPro ficou mais completo para apresentar valor, acompanhar interesse, receber pagamentos e transformar proposta enviada em próximo passo claro.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-500 px-3 py-1 text-xs font-black text-slate-950">
                <Sparkles size={14} />
                Maio 2026
              </span>
            </div>
          </section>

          <section className="grid gap-3">
            <p className="text-xs font-black uppercase text-green-700">Já disponível</p>
            {salesValueUpdates.map((item) => {
              const Icon = item.icon;
              return (
                <article className="grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-black/10 bg-slate-50 p-3 sm:p-4" key={item.title}>
                  <span className="grid size-10 place-items-center rounded-lg bg-green-100 text-green-700">
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950">{item.title}</h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black uppercase text-blue-700">
                        {item.tag}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-black uppercase text-green-700">
                        <CheckCircle2 size={12} />
                        Disponível
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="rounded-lg border border-black/10 p-4">
            <p className="text-xs font-black uppercase text-blue-700">Próximos recursos</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              Estes itens estão planejados para aumentar fechamento, recompra e clareza no atendimento comercial. A ordem pode mudar conforme testes e integrações disponíveis.
            </p>
            <div className="mt-3 grid gap-4">
              {nextFeatureGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{group.label}</p>
                  <div className="mt-2 grid gap-2">
                    {group.features.map((feature) => (
                      <div className="grid grid-cols-[auto_1fr] gap-2 text-sm font-bold leading-6 text-slate-700" key={feature}>
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-3">
            <button className="min-h-11 rounded-lg bg-green-600 px-4 font-black text-white" type="button" onClick={onOpenArts}>
              Abrir artes
            </button>
            <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black text-slate-800" type="button" onClick={onOpenBrand}>
              Ajustar marca
            </button>
            <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black text-slate-800" type="button" onClick={onClose}>
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuidedTour({
  currentIndex,
  onBack,
  onClose,
  onNext,
  step,
  total,
}: {
  currentIndex: number;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  step: TourStep;
  total: number;
}) {
  const progress = Math.round(((currentIndex + 1) / total) * 100);
  const isLast = currentIndex === total - 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-5">
      <div className="mx-auto grid max-w-3xl gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/25 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">
              Acesso guiado - passo {currentIndex + 1} de {total}
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight">{step.title}</h2>
            <p className="mt-2 max-w-2xl leading-7 text-slate-600">{step.description}</p>
          </div>
          <button className="min-h-10 rounded-lg border border-black/10 px-4 text-sm font-black" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-black uppercase text-slate-500">
            <span>{step.eyebrow}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-green-600" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {step.checklist.map((item) => (
            <div className="grid grid-cols-[auto_1fr] gap-2 rounded-lg border border-black/10 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700" key={item}>
              <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <button
            className="min-h-11 rounded-lg border border-black/10 px-4 font-black disabled:cursor-not-allowed disabled:opacity-45"
            disabled={currentIndex === 0}
            type="button"
            onClick={onBack}
          >
            Voltar
          </button>
          <div className="flex flex-wrap gap-2">
            <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={onClose}>
              Pular acesso
            </button>
            <button className="min-h-11 rounded-lg bg-green-600 px-5 font-black text-white" type="button" onClick={onNext}>
              {isLast ? "Concluir" : "Próximo passo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
      <span className="text-sm font-black text-slate-500">{label}</span>
      <strong className="mt-1 block text-2xl font-black">{value}</strong>
    </article>
  );
}

function FunnelStep({ label, tone, value }: { label: string; tone: string; value: number }) {
  return (
    <article className="rounded-lg border border-black/10 p-3">
      <div className={`mb-3 h-2 rounded-full ${tone}`} />
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block text-2xl font-black">{value}</strong>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg bg-slate-100 p-3">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      <strong className="mt-1 block text-lg font-black">{value}</strong>
    </article>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-blue-700">{eyebrow}</p>
      <h2 className="text-xl font-black leading-tight">{title}</h2>
    </div>
  );
}

function TextField({
  autoComplete,
  label,
  max,
  maxLength,
  min,
  minLength,
  onChange,
  pattern,
  placeholder,
  required = false,
  step,
  type = "text",
  value,
}: {
  autoComplete?: string;
  label: string;
  max?: number | string;
  maxLength?: number;
  min?: number | string;
  minLength?: number;
  onChange: (value: string) => void;
  pattern?: string;
  placeholder?: string;
  required?: boolean;
  step?: number | string;
  type?: string;
  value: string | number;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <input
        className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
        autoComplete={autoComplete}
        max={max}
        maxLength={maxLength}
        min={min}
        minLength={minLength}
        pattern={pattern}
        placeholder={placeholder}
        required={required}
        step={step}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  placeholder,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const uniqueOptions = Array.from(new Set(options.filter(Boolean)));

  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <input
        className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
        list={`${label}-options`}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={`${label}-options`}>
        {uniqueOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}

function TextAreaField({
  label,
  maxLength,
  minLength,
  onChange,
  placeholder,
  required = false,
  rows = 5,
  value,
}: {
  label: string;
  maxLength?: number;
  minLength?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <textarea
        className="rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
        maxLength={maxLength}
        minLength={minLength}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-black/10 pt-3">
      <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
    </div>
  );
}

function PortfolioStrip({ portfolio }: { portfolio: PortfolioItem[] }) {
  const items = portfolio.length ? portfolio.slice(0, 3) : [
    { id: "1", title: "Portfólio", category: "Trabalhos", imageUrl: "" },
    { id: "2", title: "Depoimentos", category: "Prova social", imageUrl: "" },
    { id: "3", title: "Diferenciais", category: "Valor", imageUrl: "" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item, index) => (
        <ColorTile key={item.id} index={index} label={item.title} />
      ))}
    </div>
  );
}

function ColorTile({ index, label }: { index: number; label: string }) {
  return (
    <div
      className="grid min-h-20 place-items-end rounded-lg p-3 text-sm font-black text-white"
      style={{
        background:
          index === 0
            ? "linear-gradient(135deg, #0F172A, #2563EB)"
            : index === 1
              ? "linear-gradient(135deg, #22C55E, #86EFAC)"
              : "linear-gradient(135deg, #334155, #94A3B8)",
      }}
    >
      {label}
    </div>
  );
}

function ProposalDetailPanel({
  currentPlan,
  onConfirmPix,
  onCopyLink,
  onDuplicate,
  onEdit,
  onRemove,
  onResend,
  onSatisfactionSurveySend,
  onSatisfactionSurveyLinkCopy,
  onStatusChange,
  proposal,
}: {
  currentPlan: PlanCode;
  onConfirmPix: () => void;
  onCopyLink: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onResend: () => void;
  onSatisfactionSurveySend: () => void;
  onSatisfactionSurveyLinkCopy: () => void;
  onStatusChange: (status: ProposalStatus) => void;
  proposal: Proposal;
}) {
  const timeline = proposalTimeline(proposal);
  const canResend = proposal.status === "expired" || proposal.status === "declined";

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4">
        <div>
          <p className="leading-7 text-slate-600">{proposal.serviceName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MiniStat label="Status" value={proposalStatusLabel(proposal.status)} />
          <MiniStat label="Valor" value={money.format(proposal.price)} />
          <MiniStat label="Visualizações" value={String(proposal.viewCount || 0)} />
          <MiniStat label="Validade" value={formatDateOnly(proposal.validUntil)} />
        </div>

        <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailLine label="Cliente" value={proposal.clientName} />
            <DetailLine label="E-mail" value={proposal.clientEmail || "Não informado"} />
            <DetailLine label="Prazo" value={proposal.deadline || "A combinar"} />
            <DetailLine label="Pagamento" value={proposal.payment || "A combinar"} />
          </div>
          <DetailLine label="Inclui" value={proposal.included.length ? proposal.included.join(", ") : "Itens ainda não informados"} />
          <DetailLine label="Observações" value={proposal.notes || "Sem observações"} />
        </div>

        {proposal.checkoutMode ? (
          <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase text-slate-500">Pagamento</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailLine label="Modo" value={proposal.checkoutMode === "pix" ? "PIX direto" : "Mercado Pago"} />
              <DetailLine label="Status" value={paymentStatusLabel(proposal.paymentStatus)} />
              {proposal.paymentMethod ? (
                <DetailLine label="Metodo" value={paymentMethodLabel(proposal.paymentMethod)} />
              ) : null}
              {proposal.paymentPaidAt ? (
                <DetailLine label="Confirmado em" value={formatDateTime(proposal.paymentPaidAt)} />
              ) : null}
            </div>
            {proposal.paymentStatus !== "paid" ? (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-black text-white"
                type="button"
                onClick={onConfirmPix}
              >
                <CheckCircle2 size={14} />
                Confirmar pagamento recebido
              </button>
            ) : null}
          </div>
        ) : null}

        {proposal.status === "accepted" ? (
          <div className="rounded-lg border border-green-700/20 bg-green-50 p-4">
            <p className="text-xs font-black uppercase text-green-700">Proximos passos</p>
            <p className="mt-2 text-sm font-bold leading-6 text-green-900">
              {proposal.acceptedBy || proposal.clientName} aceitou a proposta
              {proposal.acceptedAt ? ` em ${formatDateTime(proposal.acceptedAt)}` : ""}.
            </p>
            <div className="mt-3 grid gap-2">
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-black"
                type="button"
                onClick={onDuplicate}
              >
                <Files size={15} />
                Criar proposta de continuidade
              </button>
              {proposal.publicSlug ? (
                <a
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-black"
                  href={`/p/${proposal.publicSlug}`}
                  target="_blank"
                >
                  <Eye size={15} />
                  Ver aceite do cliente
                </a>
              ) : null}
            </div>
            <ul className="mt-3 grid gap-1 text-xs font-bold leading-6 text-green-900/80">
              <li>• Entre em contato para confirmar início do serviço</li>
              {proposal.clientEmail ? <li>• E-mail do cliente: {proposal.clientEmail}</li> : null}
              <li>• Combine forma e data de pagamento se ainda não realizado</li>
              <li>• Crie nova proposta para próxima etapa quando necessário</li>
            </ul>
          </div>
        ) : null}

        {proposal.publicSlug ? (
          <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-4">
            <p className="text-xs font-black uppercase text-slate-500">Documentos da proposta</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 font-black text-blue-700" href={`/p/${proposal.publicSlug}/pdf`} target="_blank">
                <FileDown size={16} />
                Proposta em PDF
              </a>
              {proposal.status === "accepted" ? (
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-50 px-4 font-black text-green-700" href={`/p/${proposal.publicSlug}/contrato`} target="_blank">
                  <FileDown size={16} />
                  Contrato
                </a>
              ) : null}
              {proposal.status === "accepted" && proposal.paymentStatus === "paid" ? (
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-50 px-4 font-black text-green-700" href={`/p/${proposal.publicSlug}/recibo`} target="_blank">
                  <FileDown size={16} />
                  Recibo de pagamento
                </a>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-slate-50 px-4 font-black text-slate-500">
                  <LockKeyhole size={16} />
                  Recibo liberado após aceite e pagamento
                </span>
              )}
              {proposal.providerReceiptUrl ? (
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 font-black text-slate-700" href={proposal.providerReceiptUrl} target="_blank">
                  <FileDown size={16} />
                  Comprovante externo
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {proposal.status === "accepted" ? (
          <div className="rounded-lg border border-blue-700/20 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase text-blue-700">Pesquisa de satisfação</p>
            {proposal.satisfactionSurvey?.respondedAt ? (
              <div className="mt-2 grid gap-2 text-sm font-bold leading-6 text-blue-950">
                <p>Resposta recebida em {formatDateTime(proposal.satisfactionSurvey.respondedAt)}.</p>
                <p>Nota: {proposal.satisfactionSurvey.rating || "-"} de 5 | Indicaria: {proposal.satisfactionSurvey.recommendScore ?? "-"}/10</p>
                {proposal.satisfactionSurvey.comment ? <p className="whitespace-pre-line">"{proposal.satisfactionSurvey.comment}"</p> : null}
                {proposal.satisfactionSurvey.testimonialOk ? <p>Cliente autorizou usar como depoimento{proposal.satisfactionSurvey.testimonialId ? " e ele foi salvo na aba Depoimentos." : "."}</p> : null}
              </div>
            ) : (
              <div className="mt-2 grid gap-3">
                <p className="text-sm font-bold leading-6 text-blue-950">
                  Finalize o serviço para liberar a pesquisa. Ela fica vinculada a esta proposta e ao mesmo link enviado ao cliente.
                </p>
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-black text-white"
                  type="button"
                  onClick={onSatisfactionSurveySend}
                >
                  <MessageSquareQuote size={15} />
                  {proposal.satisfactionSurvey?.sentAt ? "Reenviar pesquisa" : "Finalizar serviço e enviar pesquisa"}
                </button>
                {proposal.satisfactionSurvey?.serviceCompletedAt ? (
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-700/20 bg-white px-3 text-sm font-black text-blue-700"
                    type="button"
                    onClick={onSatisfactionSurveyLinkCopy}
                  >
                    <Copy size={15} />
                    Copiar link da pesquisa
                  </button>
                ) : null}
                {proposal.satisfactionSurvey?.serviceCompletedAt ? (
                  <p className="text-xs font-bold text-blue-900/70">Serviço finalizado em {formatDateTime(proposal.satisfactionSurvey.serviceCompletedAt)}.</p>
                ) : null}
                {proposal.satisfactionSurvey?.sentAt ? (
                  <p className="text-xs font-bold text-blue-900/70">Enviada em {formatDateTime(proposal.satisfactionSurvey.sentAt)}.</p>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {proposal.publicSlug ? (
            <>
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" href={`/p/${proposal.publicSlug}`} target="_blank">
                <Eye size={16} />
                Ver online
              </a>
              {canUseProposalSlides(currentPlan) ? (
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 font-black text-white" href={`/p/${proposal.publicSlug}/slides`} target="_blank">
                  <Presentation size={16} />
                  Apresentacao
                </a>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 bg-slate-50 px-4 font-black text-slate-500">
                  <LockKeyhole size={16} />
                  Slides Premium
                </span>
              )}
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={onCopyLink}>
                <Copy size={16} />
                Copiar link
              </button>
            </>
          ) : null}
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-blue-700">Linha do tempo</p>
          <div className="mt-4 grid gap-3">
            {timeline.map((event) => (
              <div className="grid grid-cols-[auto_1fr] gap-3" key={event.title}>
                <span className={`mt-1 grid size-7 place-items-center rounded-full ${event.done ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {event.done ? <CheckCircle2 size={15} /> : <Eye size={14} />}
                </span>
                <div>
                  <p className="font-black">{event.title}</p>
                  <p className="text-sm font-bold leading-6 text-slate-600">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 rounded-lg border border-black/10 bg-white p-4">
          <p className="text-xs font-black uppercase text-blue-700">Ações rápidas</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(statusConfig) as ProposalStatus[]).map((statusKey) => {
              const config = statusConfig[statusKey]!;
              const Icon = config.icon;
              const active = proposal.status === statusKey;
              return (
                <button
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-2 text-xs font-black ${
                    active ? config.className : "bg-white text-slate-500"
                  }`}
                  key={statusKey}
                  type="button"
                  onClick={() => onStatusChange(statusKey)}
                >
                  <Icon size={15} />
                  {config.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {canResend ? (
              <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={onResend}>
                <RotateCcw size={15} />
                Reenviar
              </button>
            ) : null}
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={onEdit}>
              <Settings size={15} />
              Editar
            </button>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={onDuplicate}>
              <Files size={15} />
              Duplicar
            </button>
            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-700/20 px-3 text-sm font-black text-rose-700" type="button" onClick={onRemove}>
              <Trash2 size={15} />
              Remover
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold leading-6">{value}</p>
    </div>
  );
}

function ProposalCard({
  currentPlan,
  onCopyLink,
  onDuplicate,
  onEdit,
  onOpenDetail,
  onRemove,
  onResend,
  onSatisfactionSurveySend,
  onSatisfactionSurveyLinkCopy,
  onStatusChange,
  proposal,
}: {
  currentPlan?: PlanCode;
  onCopyLink: () => void;
  onDuplicate: () => void;
  onEdit?: () => void;
  onOpenDetail?: () => void;
  onRemove: () => void;
  onResend: () => void;
  onSatisfactionSurveySend: () => void;
  onSatisfactionSurveyLinkCopy: () => void;
  onStatusChange: (status: ProposalStatus) => void;
  proposal: Proposal;
}) {
  const [showActionsModal, setShowActionsModal] = useState(false);
  const isExpired = proposal.status === "expired";
  const canResend = isExpired || proposal.status === "declined";
  const publicUrl = proposal.publicSlug ? `${getPublicAppUrl()}/p/${proposal.publicSlug}` : "";
  const whatsappUrl = proposal.publicSlug
    ? `https://wa.me/?text=${encodeURIComponent(`Oi, ${proposal.clientName}! Preparei sua proposta de ${proposal.serviceName} com escopo, valor, prazo, PDF e aceite online. Pode acessar aqui: ${publicUrl}`)}`
    : "";
  const currentStatusConfig = statusConfig[proposal.status];

  return (
    <article className="grid gap-3 rounded-lg border border-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black">{proposal.clientName}</h3>
            {currentStatusConfig ? (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${currentStatusConfig.className}`}>
                {currentStatusConfig.label}
              </span>
            ) : null}
          </div>
          <p className="mt-1 leading-6 text-slate-600">{proposal.serviceName}</p>
          <p className="mt-1 text-sm font-bold leading-5 text-slate-500">{proposalStatusHelp(proposal)}</p>
        </div>
        <IconButton
          label="Remover proposta"
          icon={Trash2}
          onClick={() => {
            if (window.confirm("Remover esta proposta?")) onRemove();
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <strong>{money.format(proposal.price)}</strong>
        <span className="text-sm font-bold text-slate-500">{proposal.deadline}</span>
      </div>
      {proposal.publicSlug ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-black text-white"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Send className="shrink-0" size={15} />
            WhatsApp
          </a>
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 text-center text-sm font-black text-green-700"
            href={`/p/${proposal.publicSlug}`}
            target="_blank"
            rel="noreferrer"
          >
            <Eye className="shrink-0" size={15} />
            Ver proposta
          </a>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
            type="button"
            onClick={onCopyLink}
          >
            <Copy className="shrink-0" size={15} />
            Copiar link
          </button>
          <a
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-black text-blue-700"
            href={`/p/${proposal.publicSlug}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            <FileDown className="shrink-0" size={15} />
            PDF
          </a>
        </div>
      ) : null}
      <button
        className="justify-self-start text-sm font-black text-slate-500 underline-offset-2 hover:underline"
        type="button"
        onClick={() => setShowActionsModal(true)}
      >
        Mais ações
      </button>
      {showActionsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-black/10 bg-white p-6 shadow-lg">
            <button
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-700"
              onClick={() => setShowActionsModal(false)}
              type="button"
            >
              <X size={20} />
            </button>
            <h2 className="pr-8 font-black">Ações</h2>
            <div className="mt-4 grid gap-3">
              {proposal.publicSlug ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {proposal.status === "accepted" ? (
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-50 px-3 text-sm font-black text-green-700"
                      href={`/p/${proposal.publicSlug}/contrato`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileDown className="shrink-0" size={15} />
                      Contrato
                    </a>
                  ) : null}
                  {currentPlan && canUseProposalSlides(currentPlan) ? (
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white"
                      href={`/p/${proposal.publicSlug}/slides`}
                      target="_blank"
                    >
                      <Presentation className="shrink-0" size={15} />
                      Slides
                    </a>
                  ) : null}
                  {canResend ? (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
                      type="button"
                      onClick={onResend}
                    >
                      <RotateCcw className="shrink-0" size={15} />
                      Reenviar
                    </button>
                  ) : null}
                  {onOpenDetail ? (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
                      type="button"
                      onClick={() => {
                        setShowActionsModal(false);
                        onOpenDetail();
                      }}
                    >
                      <FileText className="shrink-0" size={15} />
                      Detalhes
                    </button>
                  ) : null}
                  {onEdit ? (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
                      type="button"
                      onClick={() => {
                        setShowActionsModal(false);
                        onEdit();
                      }}
                    >
                      <Settings className="shrink-0" size={15} />
                      Editar
                    </button>
                  ) : null}
                  <button
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
                    type="button"
                    onClick={() => {
                      setShowActionsModal(false);
                      onDuplicate();
                    }}
                  >
                    <Files className="shrink-0" size={15} />
                    Duplicar
                  </button>
                  {proposal.status === "accepted" && !proposal.satisfactionSurvey?.respondedAt ? (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-700/20 px-3 text-center text-sm font-black text-blue-700"
                      type="button"
                      onClick={onSatisfactionSurveySend}
                    >
                      <MessageSquareQuote className="shrink-0" size={15} />
                      {proposal.satisfactionSurvey?.sentAt ? "Reenviar pesquisa" : "Finalizar e pesquisar"}
                    </button>
                  ) : null}
                  {proposal.satisfactionSurvey?.serviceCompletedAt && !proposal.satisfactionSurvey?.respondedAt ? (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-700/20 px-3 text-sm font-black text-blue-700"
                      type="button"
                      onClick={onSatisfactionSurveyLinkCopy}
                    >
                      <Copy className="shrink-0" size={15} />
                      Link pesquisa
                    </button>
                  ) : null}
                  {proposal.satisfactionSurvey?.respondedAt ? (
                    <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-50 px-3 text-sm font-black text-green-700">
                      <MessageSquareQuote className="shrink-0" size={15} />
                      Avaliado
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2 border-t border-black/10 pt-3 sm:grid-cols-3">
                <p className="col-span-full text-xs font-black uppercase text-slate-400">Mudar status</p>
                {(Object.keys(statusConfig) as ProposalStatus[]).map((status) => {
                  const config = statusConfig[status]!;
                  const Icon = config.icon;
                  const active = proposal.status === status;
                  return (
                    <button
                      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-black ${
                        active ? config.className : "bg-white text-slate-500"
                      }`}
                      key={status}
                      type="button"
                      onClick={() => {
                        onStatusChange(status);
                        setShowActionsModal(false);
                      }}
                    >
                      <Icon className="shrink-0" size={15} />
                      <span className="min-w-0 text-center leading-4">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ListCard({
  detail,
  onEdit,
  onRemove,
  subtitle,
  title,
}: {
  detail?: string;
  onEdit?: () => void;
  onRemove: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <article className="grid gap-3 rounded-lg border border-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{title}</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">{subtitle || "Sem detalhes"}</p>
          {detail ? <p className="mt-2 leading-6 text-slate-600">{detail}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {onEdit ? <IconButton label="Editar" icon={Settings} onClick={onEdit} /> : null}
          <IconButton label="Remover" icon={Trash2} onClick={onRemove} />
        </div>
      </div>
    </article>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" type="submit">
      <Plus size={18} />
      {label}
    </button>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">
      {message}
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-black/10 bg-white text-slate-800"
      title={label}
      type="button"
      onClick={onClick}
    >
      <Icon size={18} />
    </button>
  );
}

function parsePrompt(prompt: string): ProposalDraft {
  const valueMatch = prompt.match(/(?:r\$|valor|investimento)\s*(?:de|:)?\s*([\d.,]+)/i);
  const deadlineMatch = prompt.match(/(?:prazo|em)\s*(?:de|:)?\s*([\w\s]+?)(?:,|\.|$)/i);
  const service = prompt.split(",")[0]?.trim() || "Serviço personalizado";

  return {
    templateId: "",
    clientName: "",
    serviceName: service.charAt(0).toUpperCase() + service.slice(1),
    price: valueMatch ? Number(valueMatch[1].replace(/\./g, "").replace(",", ".")) : 0,
    deadline: deadlineMatch ? deadlineMatch[1].trim() : "",
    validUntil: nextWeekDate(),
    payment: prompt.toLowerCase().includes("50") ? "50% na entrada e 50% na entrega" : "A combinar",
    documentType: "auto",
    segment: "auto",
    included: ["Diagnóstico inicial", "Execução do serviço principal", "Ajustes combinados em proposta", "Entrega final organizada"],
    notes: "Proposta válida até a data informada. Alterações de escopo podem gerar novo orçamento.",
  };
}

function nextWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function validateProposalDraft(draft: ProposalDraft) {
  if (!draft.clientName.trim()) return "Informe o nome do cliente.";
  if (!draft.serviceName.trim()) return "Informe o serviço da proposta.";
  if (!Number.isFinite(draft.price) || draft.price <= 0) return "Informe um valor maior que zero.";
  if (!draft.deadline.trim()) return "Informe o prazo da proposta.";
  if (draft.validUntil && !isValidDateOnly(draft.validUntil)) return "Informe uma data de validade válida.";
  if (draft.clientEmail?.trim() && !isValidEmail(draft.clientEmail.trim())) return "Informe um e-mail de cliente válido.";
  return null;
}

function cleanIncludedItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function formatDateOnly(value?: string | null) {
  if (!value) return "Não informado";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function daysSince(value?: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function proposalStatusLabel(status: ProposalStatus) {
  const labels: Record<ProposalStatus, string> = {
    draft: "Rascunho",
    sent: "Enviada",
    viewed: "Visualizada",
    awaiting_response: "Aguardando resposta",
    accepted: "Aceita",
    declined: "Recusada",
    expired: "Expirada",
  };
  return labels[status] || status;
}

function proposalStatusHelp(proposal: Proposal) {
  if (proposal.status === "draft") return "Ainda não foi enviada. Revise e salve como proposta quando estiver pronta.";
  if (proposal.status === "sent") return "Cliente ainda não abriu o link. Bom momento para enviar ou lembrar pelo WhatsApp.";
  if (proposal.status === "viewed") return "Cliente abriu a proposta. Bom momento para chamar e tirar dúvidas.";
  if (proposal.status === "awaiting_response") return "Cliente interagiu. Vale fazer follow-up com contexto.";
  if (proposal.status === "accepted") return proposal.paymentStatus === "paid" ? "Proposta aceita e pagamento confirmado." : "Proposta aceita. Confira pagamento e próximos passos.";
  if (proposal.status === "declined") return "Cliente recusou. Veja o motivo e considere reenviar uma nova versão.";
  if (proposal.status === "expired") return "Validade encerrada. Reenvie ou duplique para atualizar condições.";
  return "";
}

function proposalTimeline(proposal: Proposal) {
  const viewed = Number(proposal.viewCount || 0) > 0 || ["viewed", "awaiting_response", "accepted", "declined"].includes(proposal.status);
  const paid = proposal.paymentStatus === "paid" || proposal.paymentStatus === "PAID";
  const expired = proposal.status === "expired";
  const clicks = Number(proposal.whatsappClickCount || 0);

  return [
    {
      title: "Proposta criada",
      description: formatDateTime(proposal.createdAt) || "Criada no painel.",
      done: true,
    },
    {
      title: "Link pronto para envio",
      description: proposal.publicSlug ? `/p/${proposal.publicSlug}` : "Link público ainda não gerado.",
      done: Boolean(proposal.publicSlug),
    },
    {
      title: "Cliente visualizou",
      description: viewed
        ? `${proposal.viewCount || 1} visualização(ões)${clicks > 0 ? ` · ${clicks} clique(s) no WhatsApp` : ""}.`
        : "Aguardando a primeira visualização.",
      done: viewed,
    },
    {
      title: "Decisão do cliente",
      description:
        proposal.status === "accepted"
          ? `Aceita por ${proposal.acceptedBy || proposal.clientName}${proposal.acceptedEmail ? ` (${proposal.acceptedEmail})` : ""}${proposal.acceptedAt ? ` em ${formatDateTime(proposal.acceptedAt)}` : ""}.`
          : proposal.status === "declined"
            ? `Recusada${proposal.declinedAt ? ` em ${formatDateTime(proposal.declinedAt)}` : ""}${proposal.declinedReason ? `. Motivo: ${proposal.declinedReason}` : "."}`
            : proposal.status === "awaiting_response"
              ? "Cliente entrou em contato pelo WhatsApp."
              : expired
              ? `Expirada em ${formatDateOnly(proposal.validUntil)}.`
              : "Ainda aguardando aceite ou recusa.",
      done: ["accepted", "declined", "expired"].includes(proposal.status),
    },
    {
      title: "Pagamento",
      description: paid
        ? `Confirmado${proposal.paymentPaidAt ? ` em ${formatDateTime(proposal.paymentPaidAt)}` : ""}${proposal.paymentMethod ? ` via ${paymentMethodLabel(proposal.paymentMethod)}` : ""}.`
        : proposal.paymentStatus === "pending"
          ? "Pagamento em processamento."
          : proposal.paymentStatus === "failed"
            ? "Pagamento falhou ou foi cancelado."
            : "Aguardando confirmação de pagamento.",
      done: paid,
    },
  ];
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão de crédito",
    credit: "Cartão de crédito",
    debit_card: "Cartão de débito",
    debit: "Cartão de débito",
    ticket: "Boleto",
    boleto: "Boleto",
    signal_30: "Entrada de 30%",
    signal_50: "Entrada de 50%",
    full: "Valor total",
  };
  return labels[method] || method;
}

function paymentStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    not_started: "Nenhum pagamento",
    open: "Aguardando pagamento",
    pending: "Em processamento",
    paid: "Confirmado",
    failed: "Falhou ou cancelado",
  };
  return status ? (labels[status] || status) : "Nenhum pagamento";
}

async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(await readApiError(response, `Falha ao buscar ${url}`));
  return response.json() as Promise<T>;
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readApiError(response, `Falha ao salvar ${url}`));
  return response.json() as Promise<T>;
}

async function apiPatch<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readApiError(response, `Falha ao atualizar ${url}`));
  return response.json() as Promise<T>;
}

async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readApiError(response, `Falha ao atualizar ${url}`));
  return response.json() as Promise<T>;
}

async function apiDelete(url: string) {
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) throw new Error(await readApiError(response, `Falha ao remover ${url}`));
}

function parseCsv(text: string) {
  const delimiter = text.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

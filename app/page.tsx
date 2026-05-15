"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
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
  RotateCcw,
  Settings,
  Send,
  Sparkles,
  Sun,
  HelpCircle,
  ThumbsDown,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { isValidDateOnly, isValidEmail, isValidHttpUrl, isValidPhone } from "@/lib/validation";
import { findProposalTemplate, proposalTemplates as readyProposalTemplates, type ProposalTemplate } from "@/lib/proposal-templates";

type ActiveView = "dashboard" | "proposals" | "clients" | "services" | "portfolio" | "testimonials" | "brand" | "arts" | "templates" | "plans" | "account";
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
  included: string[];
  notes: string;
  status: ProposalStatus;
  publicSlug?: string;
  viewCount?: number;
  whatsappClickCount?: number;
  updatedAt?: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  paymentPaidAt?: string | null;
  providerReceiptUrl?: string | null;
  acceptedBy?: string | null;
  acceptedEmail?: string | null;
  acceptedAt?: string | null;
  declinedReason?: string | null;
  declinedAt?: string | null;
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
  instagram: string | null;
  email: string | null;
  website: string | null;
  bio: string | null;
};

type PlanCode = "start" | "pro" | "plus" | "premium" | "premium_site";
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
  updatesModal: "fechapro_updates_modal_v2",
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
  { id: "account", label: "Conta", icon: UserCircle },
];

const planAccessRank: Record<PlanCode, number> = {
  start: 1,
  pro: 2,
  plus: 3,
  premium: 4,
  premium_site: 5,
};

const planLabels: Record<PlanCode, string> = {
  start: "Start",
  pro: "Pro",
  plus: "Profissional",
  premium: "Pro Site",
  premium_site: "Premium com Site",
};

const moduleRequirements: Partial<Record<ActiveView, PlanCode>> = {
  services: "pro",
  brand: "pro",
  portfolio: "plus",
  testimonials: "plus",
  arts: "pro",
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

function requiredPlanLabel(view: ActiveView) {
  const requiredPlan = moduleRequirements[view];
  return requiredPlan ? planLabels[requiredPlan] : "";
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
    title: "Crie propostas em poucos minutos",
    description: "O painel junta dados do cliente, serviço, valor, prazo e preview para você montar uma proposta profissional sem sair da tela.",
    checklist: ["Organize o texto da proposta", "Escolha cliente e serviço cadastrados", "Salve ou gere o PDF quando estiver pronto"],
  },
  {
    view: "proposals",
    eyebrow: "Controle comercial",
    title: "Acompanhe cada proposta enviada",
    description: "Aqui ficam os links públicos, PDF, status, reenvio, duplicação e detalhes com linha do tempo para entender o que aconteceu com cada venda.",
    checklist: ["Abra a proposta online", "Copie o link para WhatsApp ou e-mail", "Use Detalhes para ver visualizações, aceite e pagamento"],
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
    view: "brand",
    eyebrow: "Identidade da empresa",
    title: "Personalize logo, contatos e cores",
    description: "A marca configurada aparece nas propostas online e no PDF. Isso faz cada orçamento parecer uma apresentação profissional.",
    checklist: ["Adicione logo", "Configure WhatsApp e e-mail comercial", "Escolha cores da empresa"],
  },
  {
    view: "plans",
    eyebrow: "Pronto para vender",
    title: "Escolha o plano e valide com clientes reais",
    description: "Quando o financeiro estiver configurado, esta tela vira o caminho para assinatura e limite de uso por plano.",
    checklist: ["Revise limite do plano atual", "Teste checkout em ambiente seguro", "Configure o Mercado Pago antes de vender"],
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
    included: ["Cutilagem", "Esmaltacao", "Alongamento ou manutencao", "Finalizacao hidratante", "Garantia de 7 dias"],
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
    serviceName: "Servico de alvenaria e acabamento",
    price: 1200,
    deadline: "5 dias uteis",
    payment: "40% entrada e 60% na entrega",
    included: ["Avaliação do local", "Preparação da área", "Execução do reparo", "Acabamento", "Limpeza básica"],
    notes: "Nao inclui compra de materiais, cacamba ou alteracoes de escopo.",
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
    title: "Protocolo estetico",
    serviceName: "Protocolo estetico personalizado",
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
    label: "Servico",
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
    objective: "Divulgar um produto com destaque para desejo, beneficio, preco ou condicao especial e chamada para comprar.",
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


export default function Home() {
  const [session, setSession] = useState<{ name: string; email: string; isAdmin?: boolean } | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [dark, setDark] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProposalDraft>(blankDraft);
  const [proposals, setProposals] = useState<Proposal[]>([]);
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
    () => [...customProposalTemplates, ...readyProposalTemplates],
    [customProposalTemplates],
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user: { id: string; name: string; email: string; isAdmin?: boolean } | null }) => {
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
    const [brandData, billingData, clientsData, servicesData, portfolioData, testimonialsData, proposalsData, marketingArtsData, proposalTemplatesData] = await Promise.all([
      apiGet<BrandProfile>("/api/brand"),
      apiGet<BillingState>("/api/billing/plan"),
      apiGet<Client[]>("/api/clients"),
      apiGet<ServiceItem[]>("/api/services"),
      apiGet<PortfolioItem[]>("/api/portfolio"),
      apiGet<Testimonial[]>("/api/testimonials"),
      apiGet<Proposal[]>("/api/proposals"),
      apiGet<MarketingArt[]>("/api/marketing-arts"),
      apiGet<ProposalTemplate[]>("/api/proposal-templates"),
    ]);

    setBrand(brandData);
    setBilling(billingData);
    setClients(clientsData);
    setServices(servicesData);
    setPortfolio(portfolioData);
    setTestimonials(testimonialsData);
    setProposals(proposalsData);
    setMarketingArts(marketingArtsData);
    setCustomProposalTemplates(proposalTemplatesData);
    if (!(["active", "trial"].includes(billingData.subscription.status) && ["mercadopago", "admin"].includes(billingData.subscription.provider || ""))) {
      setNotice("Escolha um plano e conclua o pagamento pelo Mercado Pago para liberar a criação de propostas.");
      setActiveView("plans");
    }
  }

  const openValue = useMemo(
    () =>
      proposals
        .filter((proposal) => !["draft", "accepted", "declined", "expired"].includes(proposal.status))
        .reduce((sum, proposal) => sum + proposal.price, 0),
    [proposals],
  );

  const accepted = proposals.filter((proposal) => proposal.status === "accepted").length;

  if (!session) {
    return (
      <AuthScreen />
    );
  }

  function updateDraft<K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveProposal(status: ProposalStatus = "sent") {
    const validationError = validateProposalDraft(draft);
    if (validationError) {
      setNotice(validationError);
      return null;
    }

    try {
      const result = await apiPost<Proposal & { clientEmailSent?: boolean }>("/api/proposals", {
        ...draft,
        clientEmail: draft.clientEmail?.trim() || "",
        status,
      });
      setProposals((current) => [result, ...current]);
      const emailNote = result.clientEmailSent
        ? " E-mail enviado ao cliente."
        : draft.clientEmail
          ? ""
          : " Sem e-mail do cliente - proposta não foi enviada por e-mail.";
      setNotice(`Proposta salva com sucesso.${emailNote}`);
      setActiveView("proposals");
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
        deadline: "7 dias uteis",
        includes: ["Logo", "Paleta de cores", "Tipografia", "5 modelos de posts"],
      }),
      apiPost<ServiceItem>("/api/services", {
        name: "Gestao de trafego",
        price: 1800,
        deadline: "30 dias",
        includes: ["Planejamento", "Campanhas Meta Ads", "Relatorio semanal"],
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
        deadline: "7 dias uteis",
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
    await apiDelete(`/api/proposals/${id}`);
    setProposals((current) => current.filter((item) => item.id !== id));
    setNotice("Proposta removida.");
  }

  async function resendProposal(id: string) {
    const result = await apiPost<Proposal & { clientEmailSent?: boolean }>(`/api/proposals/${id}/resend`, {});
    setProposals((current) => current.map((item) => (item.id === id ? result : item)));
    const emailNote = result.clientEmailSent ? " E-mail enviado ao cliente." : " Sem e-mail do cliente cadastrado.";
    setNotice(`Proposta reenviada.${emailNote}`);
  }

  async function duplicateProposal(id: string) {
    const copy = await apiPost<Proposal>(`/api/proposals/${id}/duplicate`, {});
    setProposals((current) => [copy, ...current]);
    setNotice("Proposta duplicada.");
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
      setNotice("Solicitacao enviada. A equipe vai preparar a arte e anexar para sua aprovacao.");
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
      setNotice("Conclua a configuração inicial para liberar o tour guiado.");
      return;
    }
    if (!availableTourSteps.length) return;
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
            <h1 className="max-w-xs text-2xl font-black leading-tight tracking-normal sm:max-w-none sm:text-3xl">
              Sistema de propostas profissionais.
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
            <IconButton label="Ver novidades" icon={Megaphone} onClick={() => setShowUpdatesModal(true)} />
            <IconButton label="Iniciar tour guiado" icon={Sparkles} onClick={startTour} />
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
                instagram: null,
                email: session.email,
                website: null,
                bio: null,
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
            <nav className="fp-nav grid grid-cols-3 gap-1 rounded-lg border p-1.5 min-[430px]:grid-cols-4 sm:flex sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                const locked = !canUseModule(item.id, currentPlan);
                const tourFocus = currentTourStep?.view === item.id;
                return (
                  <button
                    className={`fp-nav-item flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-black leading-none sm:min-w-[52px] sm:text-[11px] ${tourFocus ? "ring-2 ring-green-300 ring-offset-2 ring-offset-[var(--app-bg)]" : ""}`}
                    data-active={active}
                    data-locked={locked}
                    key={item.id}
                    type="button"
                    title={locked ? `Disponível a partir do plano ${requiredPlanLabel(item.id)}` : item.label}
                    onClick={() => {
                      if (locked) {
                        setNotice(`O módulo ${item.label} está disponível a partir do plano ${requiredPlanLabel(item.id)}.`);
                        setActiveView("plans");
                        return;
                      }
                      setActiveView(item.id);
                    }}
                  >
                    <Icon size={16} />
                    <span className="mt-0.5 max-w-full truncate sm:whitespace-nowrap">{item.label}</span>
                    {locked ? <LockKeyhole size={10} /> : null}
                  </button>
                );
              })}
            </nav>

            {activeView === "dashboard" ? (
          <DashboardView
            accepted={accepted}
            clients={clients}
            draft={draft}
            brand={
              brand || {
                businessName: session.name,
                logoUrl: null,
                primaryColor: "#22C55E",
                secondaryColor: "#0F172A",
                accentColor: "#2563EB",
                whatsapp: null,
                instagram: null,
                email: session.email,
                website: null,
                bio: null,
              }
            }
            onDraftChange={updateDraft}
            onProposalSave={saveProposal}
            onSeed={seedExamples}
            billing={billing}
            notice={notice}
            onNotice={setNotice}
            onStatusChange={changeProposalStatus}
            onProposalRemove={removeProposal}
            onProposalResend={resendProposal}
            onProposalDuplicate={duplicateProposal}
            onProposalPdf={saveProposalAndOpenPdf}
            openValue={openValue}
            portfolio={portfolio}
            proposals={proposals}
            proposalTemplates={allProposalTemplates}
            services={services}
            testimonials={testimonials}
          />
            ) : null}

            {activeView === "proposals" ? (
              <ProposalsView
                notice={notice}
                onNotice={setNotice}
                onCopyLink={copyProposalLink}
                onDuplicate={duplicateProposal}
                onRemove={removeProposal}
                onResend={resendProposal}
                onStatusChange={changeProposalStatus}
                proposals={proposals}
                onNewProposal={() => setActiveView("dashboard")}
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
                    instagram: null,
                    email: session.email,
                    website: null,
                    bio: null,
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
              setNotice("Tour concluído. Agora você já conhece o fluxo principal do FechaPro.");
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
        onNotice("Notificacoes bloqueadas no navegador. Ative a permissao para receber alertas.");
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
      onNotice("Notificacoes push ativadas para propostas visualizadas, aceitas, recusadas e pagas.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Nao foi possivel ativar notificacoes push.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
      <div>
        <p className="text-xs font-black uppercase text-blue-700">Notificacoes</p>
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

function DashboardView({
  accepted,
  brand,
  clients,
  draft,
  onDraftChange,
  onProposalDuplicate,
  onProposalRemove,
  onProposalResend,
  onProposalPdf,
  onProposalSave,
  onSeed,
  onStatusChange,
  openValue,
  portfolio,
  proposals,
  services,
  testimonials,
  billing,
  notice,
  onNotice,
  proposalTemplates,
}: {
  accepted: number;
  brand: BrandProfile;
  clients: Client[];
  draft: ProposalDraft;
  onDraftChange: <K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) => void;
  onProposalDuplicate: (id: string) => void;
  onProposalRemove: (id: string) => void;
  onProposalResend: (id: string) => void;
  onProposalPdf: () => void | Promise<void>;
  onProposalSave: (status?: ProposalStatus) => void | Promise<Proposal | null>;
  onSeed: () => void;
  onStatusChange: (id: string, status: ProposalStatus) => void;
  openValue: number;
  portfolio: PortfolioItem[];
  proposals: Proposal[];
  services: ServiceItem[];
  testimonials: Testimonial[];
  billing: BillingState | null;
  notice: string | null;
  onNotice: (message: string | null) => void;
  proposalTemplates: ProposalTemplate[];
}) {
  const includedItems = draft.included.length ? draft.included : ["Itens da proposta aparecem aqui."];
  const acceptedValue = proposals
    .filter((proposal) => proposal.status === "accepted")
    .reduce((sum, proposal) => sum + proposal.price, 0);
  const sentValue = proposals
    .filter((proposal) => proposal.status !== "draft")
    .reduce((sum, proposal) => sum + proposal.price, 0);
  const viewed = proposals.filter((proposal) => proposal.status === "viewed").length;
  const awaitingResponse = proposals.filter((proposal) => proposal.status === "awaiting_response").length;
  const declined = proposals.filter((proposal) => proposal.status === "declined").length;
  const sent = proposals.filter((proposal) => proposal.status !== "draft").length;
  const totalViews = proposals.reduce((sum, proposal) => sum + (proposal.viewCount || 0), 0);
  const whatsappClicks = proposals.reduce((sum, proposal) => sum + (proposal.whatsappClickCount || 0), 0);
  const acceptanceRate = proposals.length ? Math.round((accepted / proposals.length) * 100) : 0;
  const expired = proposals.filter((proposal) => proposal.validUntil && proposal.validUntil < todayDate()).length;
  const followUps = proposals.filter((proposal) => ["sent", "viewed", "awaiting_response"].includes(proposal.status) && daysSince(proposal.updatedAt || proposal.createdAt) >= 2).slice(0, 3);
  const hasPaidAccess = Boolean(
    billing &&
      ["active", "trial"].includes(billing.subscription.status) &&
      ["mercadopago", "admin"].includes(billing.subscription.provider || ""),
  );

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

      <section className="grid gap-5 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 sm:min-h-80 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6">
        <div>
          <h2 className="max-w-[14ch] text-3xl font-black leading-none sm:max-w-[12ch] sm:text-6xl">
            Crie uma proposta comercial em minutos.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Use seus cadastros de clientes, serviços, portfólio e depoimentos para montar uma proposta completa.
          </p>
        </div>

        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" type="button" onClick={() => document.getElementById("proposal-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <FileText size={18} />
          Criar proposta
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Metric label="Clientes visualizaram o link" value={String(totalViews)} />
        <Metric label="Clicaram no WhatsApp" value={String(whatsappClicks)} />
        <Metric label="Orcamentos enviados" value={String(sent)} />
        <Metric label="Orcamentos aprovados" value={String(accepted)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Valor total enviado" value={money.format(sentValue)} />
        <Metric label="Valor em aberto" value={money.format(openValue)} />
        <Metric label="Taxa de aceite" value={`${acceptanceRate}%`} />
      </section>

      {billing ? (
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Assinatura" title={hasPaidAccess ? `${billing.subscription.plan.toUpperCase()} em uso` : "Pagamento pendente"} />
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-700">
              {hasPaidAccess ? `${billing.usage.proposalsThisMonth}/${billing.usage.proposalLimit} propostas este mês` : "Pague pelo Mercado Pago ou aguarde liberação do admin"}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
              {`${billing.usage.artsThisMonth}/${billing.usage.artLimit} artes de divulgação`}
            </span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{
                width: `${Math.min(100, Math.round((billing.usage.proposalsThisMonth / billing.usage.proposalLimit) * 100))}%`,
              }}
            />
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <SectionHeading eyebrow="Indicadores" title="Funil comercial" />
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            <FunnelStep label="Enviadas" value={sent} tone="bg-amber-500" />
            <FunnelStep label="Visualizadas" value={viewed} tone="bg-sky-600" />
            <FunnelStep label="Aguardando" value={awaitingResponse} tone="bg-indigo-600" />
            <FunnelStep label="Aceitas" value={accepted} tone="bg-green-700" />
            <FunnelStep label="Recusadas" value={declined} tone="bg-rose-700" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MiniStat label="Valor aceito" value={money.format(acceptedValue)} />
          <MiniStat label="Visualizações" value={String(totalViews)} />
          <MiniStat label="Cliques WhatsApp" value={String(whatsappClicks)} />
          <MiniStat label="Vencidas" value={String(expired)} />
        </div>
      </section>

      {followUps.length ? (
        <section className="grid gap-3 rounded-lg border border-amber-700/20 bg-amber-50 p-4 shadow-xl shadow-slate-900/10">
          <SectionHeading eyebrow="Follow-up" title="Oportunidades para retomar hoje" />
          {followUps.map((proposal) => {
            const message = `Oi, tudo bem? Passando para saber se conseguiu olhar o orçamento de ${proposal.serviceName} que te enviei. Posso tirar alguma dúvida?`;
            return (
              <div className="grid gap-3 rounded-lg border border-amber-700/20 bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center" key={proposal.id}>
                <div>
                  <strong>{proposal.clientName}</strong>
                  <p className="text-sm font-bold leading-6 text-slate-600">
                    Proposta enviada ha {daysSince(proposal.updatedAt || proposal.createdAt)} dias - {proposalStatusLabel(proposal.status)}
                  </p>
                </div>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-black text-white"
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(message);
                    onNotice("Mensagem de follow-up copiada.");
                  }}
                >
                  <Copy size={15} />
                  Copiar mensagem
                </button>
              </div>
            );
          })}
        </section>
      ) : null}

      <section className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <SectionHeading eyebrow="Indicacoes" title="Ganhe crescimento com seus clientes" />
          <p className="mt-2 leading-7 text-slate-600">
            Compartilhe o FechaPro com outro profissional. Quando o programa de indicacao estiver ativo, essa area vira o controle de meses gratis e descontos.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 font-black text-slate-800"
          type="button"
          onClick={() => {
            const inviteLink = getPublicAppUrl();
            navigator.clipboard.writeText(`Conhece o FechaPro? Estou usando para enviar propostas profissionais e acompanhar aceite dos clientes: ${inviteLink}`);
            onNotice("Mensagem de indicacao copiada.");
          }}
        >
          <Copy size={16} />
          Copiar convite
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <form
          id="proposal-form"
          className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10"
          onSubmit={(event) => {
            event.preventDefault();
            onProposalSave();
          }}
        >
          <SectionHeading eyebrow="Nova proposta" title="Dados principais" />

          <div className="grid gap-2 rounded-lg border border-black/10 bg-slate-50 p-3">
            <label className="grid gap-2 text-sm font-extrabold text-slate-600">
              Template por nicho
              <select
                className="min-h-11 rounded-lg border border-black/10 bg-white p-3 text-slate-900 outline-green-700"
                required
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
            <TextField label="Validade" type="date" value={draft.validUntil} onChange={(value) => onDraftChange("validUntil", value)} />
            <TextField label="Pagamento" maxLength={120} placeholder="50% entrada e 50% entrega" value={draft.payment} onChange={(value) => onDraftChange("payment", value)} />
          </div>

          <TextField
            label="E-mail do cliente"
            placeholder="cliente@email.com"
            type="email"
            autoComplete="email"
            value={draft.clientEmail ?? ""}
            onChange={(value) => onDraftChange("clientEmail", value)}
          />

          <TextAreaField
            label="Itens inclusos"
            maxLength={1200}
            placeholder={"Logo\nPaleta de cores\n5 modelos de posts"}
            value={draft.included.join("\n")}
            onChange={(value) =>
              onDraftChange(
                "included",
                value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
          />

          <TextAreaField
            label="Observações"
            maxLength={800}
            placeholder="A proposta inclui até 2 rodadas de ajustes."
            rows={3}
            value={draft.notes}
            onChange={(value) => onDraftChange("notes", value)}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <button className="min-h-11 rounded-lg bg-green-600 px-4 font-black text-white" type="submit">
              Salvar proposta
            </button>
            <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={() => onProposalSave("draft")}>
              Salvar rascunho
            </button>
            <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={onSeed}>
              Carregar exemplos
            </button>
          </div>
        </form>

        <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:sticky lg:top-32">
          <SectionHeading eyebrow="Preview" title={draft.clientName ? `Proposta para ${draft.clientName}` : "Proposta para cliente"} />

          <div className="grid gap-4 overflow-hidden rounded-lg border border-black/10 bg-slate-50">
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${brand.primaryColor}, ${brand.accentColor})` }} />
            <div className="grid gap-4 p-4">
            <div className="flex items-center gap-3">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-12 w-12 rounded-lg object-cover" src={brand.logoUrl} />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-lg font-black text-white" style={{ background: brand.primaryColor }}>
                  {initials(brand.businessName)}
                </div>
              )}
              <div>
                <strong>{brand.businessName}</strong>
                <span className="block text-sm font-bold text-slate-500">Proposta comercial</span>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <PreviewItem label="Serviço" value={draft.serviceName || "Preencha os dados"} />
              <PreviewItem label="Investimento" value={money.format(draft.price)} />
              <PreviewItem label="Prazo" value={draft.deadline || "-"} />
              <PreviewItem label="Pagamento" value={draft.payment || "A combinar"} />
            </dl>

            <div>
              <h3 className="font-black">Inclui</h3>
              <ul className="mt-2 list-disc pl-5 text-slate-600">
                {includedItems.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>

            <PortfolioStrip portfolio={portfolio} />

            <blockquote className="border-l-4 pl-3 leading-7 text-slate-600" style={{ borderColor: brand.accentColor }}>
              "{testimonials[0]?.quote || "Excelente entrega, muito profissional e antes do prazo."}"
              <cite className="mt-1 block font-black not-italic text-slate-900">
                {testimonials[0]?.authorName || "Cliente verificado"}
              </cite>
            </blockquote>

            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white"
                style={{ background: brand.primaryColor }}
                type="button"
                onClick={() => onProposalSave("sent")}
              >
                <Send size={18} />
                Salvar proposta
              </button>
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 font-black"
                style={{ color: brand.secondaryColor }}
                type="button"
                onClick={() => onProposalPdf()}
              >
                <FileDown size={18} />
                Gerar PDF
              </button>
            </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <SectionHeading eyebrow="Pipeline" title="Propostas recentes" />
        <div className="grid gap-3">
          {proposals.length ? (
            proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onRemove={() => onProposalRemove(proposal.id)}
                onCopyLink={() => {
                  if (!proposal.publicSlug) return;
                  const url = `${window.location.origin}/p/${proposal.publicSlug}`;
                  navigator.clipboard.writeText(url);
                  onNotice("Link da proposta copiado.");
                }}
                onStatusChange={(status) => onStatusChange(proposal.id, status)}
                onResend={() => onProposalResend(proposal.id)}
                onDuplicate={() => onProposalDuplicate(proposal.id)}
              />
            ))
          ) : (
            <p className="leading-7 text-slate-600">
              Nenhuma proposta salva ainda. Crie a primeira ou carregue exemplos para ver o pipeline.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function ProposalsView({
  notice,
  onCopyLink,
  onDuplicate,
  onNewProposal,
  onNotice,
  onRemove,
  onResend,
  onStatusChange,
  proposals,
}: {
  notice: string | null;
  onCopyLink: (slug?: string) => void;
  onDuplicate: (id: string) => void;
  onNewProposal: () => void;
  onNotice: (message: string | null) => void;
  onRemove: (id: string) => void;
  onResend: (id: string) => void;
  onStatusChange: (id: string, status: ProposalStatus) => void;
  proposals: Proposal[];
}) {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(proposals.length / pageSize));
  const visibleProposals = proposals.slice((page - 1) * pageSize, page * pageSize);
  const firstVisible = proposals.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(page * pageSize, proposals.length);
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) || null;
  const acceptedValue = proposals
    .filter((proposal) => proposal.status === "accepted")
    .reduce((sum, proposal) => sum + proposal.price, 0);
  const sent = proposals.filter((proposal) => proposal.status !== "draft").length;
  const viewed = proposals.filter((proposal) => proposal.status === "viewed").length;
  const awaitingResponse = proposals.filter((proposal) => proposal.status === "awaiting_response").length;
  const accepted = proposals.filter((proposal) => proposal.status === "accepted").length;
  const declined = proposals.filter((proposal) => proposal.status === "declined").length;

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

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
          <SectionHeading eyebrow="Tela da proposta" title="Propostas comerciais" />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" type="button" onClick={onNewProposal}>
            <Plus size={18} />
            Nova proposta
          </button>
        </div>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Aqui ficam os links que você envia para o cliente. Abra a proposta pública, copie o link, baixe PDF, duplique ou acompanhe o status.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-6">
        <Metric label="Total" value={String(proposals.length)} />
        <Metric label="Enviadas" value={String(sent)} />
        <Metric label="Visualizadas" value={String(viewed)} />
        <Metric label="Aguardando" value={String(awaitingResponse)} />
        <Metric label="Aceitas" value={String(accepted)} />
        <Metric label="Valor aceito" value={money.format(acceptedValue)} />
      </div>

      {selectedProposal ? (
        <ProposalDetailPanel
          proposal={selectedProposal}
          onClose={() => setSelectedProposalId(null)}
          onCopyLink={() => onCopyLink(selectedProposal.publicSlug)}
          onDuplicate={() => onDuplicate(selectedProposal.id)}
          onRemove={() => {
            if (window.confirm("Remover esta proposta?")) {
              onRemove(selectedProposal.id);
              setSelectedProposalId(null);
            }
          }}
          onResend={() => onResend(selectedProposal.id)}
          onStatusChange={(status) => onStatusChange(selectedProposal.id, status)}
        />
      ) : null}

      <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-600">
          Mostrando {firstVisible}-{lastVisible} de {proposals.length} propostas
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
        {proposals.length ? (
          visibleProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onRemove={() => onRemove(proposal.id)}
              onCopyLink={() => onCopyLink(proposal.publicSlug)}
              onStatusChange={(status) => onStatusChange(proposal.id, status)}
              onResend={() => onResend(proposal.id)}
              onDuplicate={() => onDuplicate(proposal.id)}
              onOpenDetail={() => setSelectedProposalId(proposal.id)}
            />
          ))
        ) : (
          <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
            <p className="leading-7 text-slate-600">
              Nenhuma proposta salva ainda. Clique em Nova proposta para montar a primeira.
            </p>
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
  const [whatsapp, setWhatsapp] = useState(brand.whatsapp || "");
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
        <TextField label="WhatsApp" autoComplete="tel" maxLength={20} placeholder="5511999999999" required value={whatsapp} onChange={setWhatsapp} />
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
      eyebrow="Cadastro"
      title="CRM simples"
      description="Salve contatos, interesse, status e observacoes para retomar conversas e recuperar oportunidades."
      form={
        <form
          className="grid gap-3"
          onSubmit={saveClient}
        >
          {error ? <FormError message={error} /> : null}
          <TextField label="Nome" maxLength={80} required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextField label="E-mail" autoComplete="email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <TextField label="Telefone" autoComplete="tel" maxLength={20} value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <TextField label="Segmento" maxLength={60} placeholder="Moda, estetica, arquitetura..." value={form.segment} onChange={(value) => setForm({ ...form, segment: value })} />
          <TextField label="Servico de interesse" maxLength={90} placeholder="Identidade visual, limpeza, manutencao..." value={form.interestService} onChange={(value) => setForm({ ...form, interestService: value })} />
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
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                resetForm();
              }}
            >
              Cancelar edicao
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
              phone: client.phone || "",
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

function ServicesView({ services, onChange }: { services: ServiceItem[]; onChange: (items: ServiceItem[]) => void }) {
  const [form, setForm] = useState({ name: "", price: 0, deadline: "", includes: "" });
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
      setForm({ name: "", price: 0, deadline: "", includes: "" });
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
      description="Monte uma biblioteca para preencher propostas mais rápido."
      form={
        <form
          className="grid gap-3"
          onSubmit={saveService}
        >
          {error ? <FormError message={error} /> : null}
          <TextField label="Serviço" maxLength={80} required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextField label="Valor base" min={0} required step="1" type="number" value={form.price || ""} onChange={(value) => setForm({ ...form, price: Number(value || 0) })} />
          <TextField label="Prazo padrão" maxLength={80} value={form.deadline} onChange={(value) => setForm({ ...form, deadline: value })} />
          <TextAreaField label="Itens inclusos" maxLength={1200} value={form.includes} onChange={(value) => setForm({ ...form, includes: value })} />
          <SubmitButton label={editingId ? "Atualizar serviço" : "Salvar serviço"} />
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ name: "", price: 0, deadline: "", includes: "" });
              }}
            >
              Cancelar edicao
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
          detail={service.includes.join(", ")}
          onEdit={() => {
            setEditingId(service.id);
            setForm({
              name: service.name,
              price: service.price,
              deadline: service.deadline || "",
              includes: service.includes.join("\n"),
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
      eyebrow="Cadastro"
      title="Portfolio"
      description="Guarde trabalhos para mostrar dentro da proposta."
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
              Cancelar edicao
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
      eyebrow="Cadastro"
      title="Depoimentos"
      description="Reforce prova social nas propostas enviadas."
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
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ authorName: "", company: "", quote: "" });
              }}
            >
              Cancelar edicao
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
  onTemplateCreated,
  onUseTemplate,
  proposalTemplates,
}: {
  customTemplates: ProposalTemplate[];
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
  const firstVisible = proposalTemplates.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisible = Math.min(page * pageSize, proposalTemplates.length);

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
      if (!response.ok) throw new Error(await readApiError(response, "Nao foi possivel importar o template."));
      const template = (await response.json()) as ProposalTemplate;
      onTemplateCreated(template);
      setUploadForm({ title: "", niche: "", serviceName: "", price: 0, deadline: "", payment: "", included: "", notes: "" });
      setFile(null);
      onUseTemplate(template);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel importar o template.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <p className="text-xs font-black uppercase text-blue-700">Templates</p>
        <h2 className="text-2xl font-black">Modelos prontos por nicho</h2>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Use um modelo como ponto de partida. Ele preenche serviço, valor, prazo, pagamento, itens inclusos e observações.
        </p>
      </div>

      <form className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10" onSubmit={submitImportedTemplate}>
        <SectionHeading eyebrow="Importar template" title="Subir PDF, planilha ou print" />
        <input accept=".pdf,.csv,.xls,.xlsx,image/png,image/jpeg,image/webp" className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Titulo do template" maxLength={80} required value={uploadForm.title} onChange={(value) => setUploadForm({ ...uploadForm, title: value })} />
          <TextField label="Nicho" maxLength={80} placeholder="Ex: Designer, Manicure, Eletricista" value={uploadForm.niche} onChange={(value) => setUploadForm({ ...uploadForm, niche: value })} />
          <TextField label="Servico" maxLength={100} required value={uploadForm.serviceName} onChange={(value) => setUploadForm({ ...uploadForm, serviceName: value })} />
          <TextField label="Valor" min={1} required step="1" type="number" value={uploadForm.price || ""} onChange={(value) => setUploadForm({ ...uploadForm, price: Number(value || 0) })} />
          <TextField label="Prazo" maxLength={80} required value={uploadForm.deadline} onChange={(value) => setUploadForm({ ...uploadForm, deadline: value })} />
          <TextField label="Pagamento" maxLength={120} value={uploadForm.payment} onChange={(value) => setUploadForm({ ...uploadForm, payment: value })} />
        </div>
        <TextAreaField label="Itens inclusos" maxLength={1200} placeholder={"Um item por linha"} value={uploadForm.included} onChange={(value) => setUploadForm({ ...uploadForm, included: value })} />
        <TextAreaField label="Observacoes" maxLength={800} rows={3} value={uploadForm.notes} onChange={(value) => setUploadForm({ ...uploadForm, notes: value })} />
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60" disabled={saving} type="submit">
          <FileDown size={18} />
          {saving ? "Importando..." : "Importar e usar template"}
        </button>
        {customTemplates.length ? <p className="text-sm font-bold text-slate-500">{customTemplates.length} template(s) importado(s) salvos.</p> : null}
      </form>

      <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-600">
          Mostrando {firstVisible}-{lastVisible} de {proposalTemplates.length} templates
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
        {visibleTemplates.map((template) => (
          <article className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10" key={template.id}>
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

      <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-xl shadow-slate-900/10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-600">
          Pagina {page} de {totalPages}
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
    </section>
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
    form.audience ? `Publico: ${form.audience}` : null,
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
      setError(`Voce precisa de ${formatsToGenerate.length} credito(s) para solicitar essa opcao.`);
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
      setError(caught instanceof Error ? caught.message : "Nao foi possivel solicitar a arte.");
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
          <h2 className="text-2xl font-black">Solicitar arte de divulgação</h2>
          <p className="mt-2 leading-7 text-slate-600">
            Preencha o pedido para a equipe preparar a arte. Depois ela anexa a imagem pronta para sua aprovacao.
          </p>
        </div>

        <div className="rounded-lg border border-black/10 bg-slate-50 p-3 text-sm font-black text-slate-700">
          Uso atual: {used}/{limit} artes este mes
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: limit ? `${Math.min(100, Math.round((used / limit) * 100))}%` : "0%" }}
            />
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {limit ? `${remaining} credito(s) restantes neste ciclo.` : "Disponivel a partir do plano Profissional e pacote de artes."}
          </p>
        </div>

        <form className="grid gap-5" onSubmit={requestArt}>
          {error ? <FormError message={error} /> : null}

          <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-green-600 text-sm font-black text-white">1</span>
              <div>
                <h3 className="font-black text-slate-900">Pedido</h3>
                <p className="text-xs font-bold text-slate-500">Diga onde a arte sera usada e como voce quer encontra-la depois.</p>
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
                    {option.label} - {option.credits} credito{option.credits > 1 ? "s" : ""}
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
              label="Servico ou produto"
              options={services.map((service) => service.name)}
              placeholder="Ex: Marmita grande, manicure, site profissional"
              value={form.serviceName}
              onChange={(value) => setForm({ ...form, serviceName: value })}
            />
            <TextAreaField
              label="Texto do pedido"
              maxLength={400}
              placeholder="Ex: Marmita grande com suco por R$ 22 hoje. Pedido pelo WhatsApp. Entrega ate 14h."
              required
              rows={4}
              value={form.objective}
              onChange={(value) => setForm({ ...form, objective: value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Cidade ou publico" maxLength={120} placeholder="Uberlandia, noivas, lojas..." value={form.audience} onChange={(value) => setForm({ ...form, audience: value })} />
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
              Opcional. Envie fotos do produto, logo, referencia visual ou imagem que deve entrar na peca.
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
              Usar a referencia como fundo
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
                {selectedFormat.credits} credito{selectedFormat.credits > 1 ? "s" : ""}
              </span>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
              {requestSummary.length ? requestSummary.join(" | ") : "Escolha o tipo, descreva a campanha e envie para a equipe preparar a arte."}
            </p>
          </div>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white shadow-lg shadow-green-900/10 disabled:opacity-60" disabled={creating || limit === 0 || remaining < formatsToGenerate.length} type="submit">
            <Sparkles size={18} />
            {creating ? "Enviando..." : formatsToGenerate.length > 1 ? "Enviar solicitacoes" : "Enviar solicitacao"}
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
                        {art.serviceName || "Divulgacao"} | {art.format.replace("_", " ")}
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
  if (art.source === "uploaded") return "Aguardando aprovacao";
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
        throw new Error(data?.error || "Nao foi possivel abrir o pagamento.");
      }
      window.location.href = data.url;
    } catch (caught) {
      setPaymentError(caught instanceof Error ? caught.message : "Nao foi possivel abrir o pagamento.");
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
          Escolha um plano e pague online em ambiente seguro. O acesso para criar propostas é liberado quando o Mercado Pago confirmar o pagamento.
        </p>
        {paymentError ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{paymentError}</p>
        ) : null}
        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-black text-slate-700">
          Status: {["active", "trial"].includes(billing.subscription.status) && ["mercadopago", "admin"].includes(billing.subscription.provider || "") ? "ativo" : "aguardando pagamento/liberação"}
          <span className="mt-1 block">
            Uso atual: {billing.usage.proposalsThisMonth}
            {`/${billing.usage.proposalLimit} propostas este mês`}
          </span>
          <span className="mt-1 block">
            Artes de divulgação: {billing.usage.artsThisMonth}/{billing.usage.artLimit} este mes
          </span>
          <span className="mt-1 block">
            Créditos extras de artes: {billing.usage.artCreditBalance}
          </span>
        </div>
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
                  <p className="mt-2 text-xs font-black uppercase text-green-700">Oferta até 03/06</p>
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
                    Condição especial de lançamento para os primeiros clientes até 03/06.
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-bold text-slate-500">
                {`Até ${plan.proposalLimit} propostas por mês`}
                <span className="mt-1 block">
                  {plan.artLimit > 0 ? `${plan.artLimit} artes de divulgação por mês` : "Artes de divulgação não inclusas"}
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
  onChange: (session: { name: string; email: string }) => void;
  session: { name: string; email: string };
}) {
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
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

    if (!name.trim() || !email.trim()) {
      setError("Informe nome e e-mail.");
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
      const updated = await apiPut<{ name: string; email: string }>("/api/account", {
        name,
        email,
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
            <h2 className="mt-2 text-2xl font-black leading-tight">Ajustes do perfil</h2>
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
            <SectionHeading eyebrow="Dados pessoais" title="Acesso da conta" />
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">Nome e e-mail usados para entrar e identificar sua conta.</p>
          </div>
        </div>

        {message ? <div className="rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-900">{message}</div> : null}
        {error ? <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nome" autoComplete="name" maxLength={80} required value={name} onChange={setName} />
          <TextField label="E-mail" autoComplete="email" required type="email" value={email} onChange={setEmail} />
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
          {saving ? "Salvando..." : "Salvar alteracoes"}
        </button>
      </form>

      <aside className="grid content-start gap-4">
        <div className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10">
          <p className="text-xs font-black uppercase text-blue-700">Status da conta</p>
          <div className="mt-4 grid gap-3">
            <AccountStatusItem label="Perfil identificado" detail={name || "Nome não informado"} done={Boolean(name.trim())} />
            <AccountStatusItem label="E-mail de acesso" detail={email || "E-mail não informado"} done={isValidEmail(email.trim())} />
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
    brand || {
      businessName: session.name,
      logoUrl: null,
      primaryColor: "#22C55E",
      secondaryColor: "#0F172A",
      accentColor: "#2563EB",
      whatsapp: null,
      instagram: null,
      email: session.email,
      website: null,
      bio: null,
    },
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (brand) setForm(brand);
  }, [brand]);

  async function saveBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!form.businessName.trim()) {
      setError("Informe o nome comercial.");
      return;
    }
    if (form.logoUrl?.trim() && !isValidHttpUrl(form.logoUrl.trim())) {
      setError("Informe uma URL de logo válida começando com http:// ou https://.");
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
            Esses dados aparecem na proposta pública, no PDF e no contato por WhatsApp.
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
          <TextField label="URL do logo" placeholder="Opcional: https://..." type="url" value={form.logoUrl || ""} onChange={(value) => setForm({ ...form, logoUrl: value })} />
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
          <TextField label="WhatsApp" autoComplete="tel" maxLength={20} placeholder="5511999999999" value={form.whatsapp || ""} onChange={(value) => setForm({ ...form, whatsapp: value })} />
          <TextField label="Instagram" maxLength={60} placeholder="@seuperfil" value={form.instagram || ""} onChange={(value) => setForm({ ...form, instagram: value })} />
          <TextField label="E-mail comercial" autoComplete="email" type="email" value={form.email || ""} onChange={(value) => setForm({ ...form, email: value })} />
          <TextField label="Site" placeholder="https://..." type="url" value={form.website || ""} onChange={(value) => setForm({ ...form, website: value })} />
          <TextAreaField label="Bio curta" maxLength={500} rows={3} value={form.bio || ""} onChange={(value) => setForm({ ...form, bio: value })} />
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
            <span>Instagram: {form.instagram || "Não informado"}</span>
            <span>E-mail: {form.email || "Não informado"}</span>
            <span>Site: {form.website || "Não informado"}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <ColorSwatch label="Principal" value={form.primaryColor} />
            <ColorSwatch label="Fundo" value={form.secondaryColor} />
            <ColorSwatch label="Destaque" value={form.accentColor} />
          </div>
          </div>
        </div>
      </div>
    </section>
  );
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

function CrudShell({
  children,
  description,
  eyebrow,
  form,
  title,
}: {
  children: React.ReactNode;
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
      <div className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
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

function AuthScreen() {
  const benefits = [
    {
      icon: Send,
      title: "Pare de parecer barato",
      description: "Troque o orçamento seco por uma proposta com contexto, valor percebido e próximo passo claro para o cliente aceitar.",
    },
    {
      icon: FolderKanban,
      title: "Mostre por que custa isso",
      description: "Portfólio, depoimentos, escopo e condições aparecem antes do cliente reduzir tudo a uma comparação de preço.",
    },
    {
      icon: CheckCircle2,
      title: "Tire o sim do improviso",
      description: "O cliente visualiza, baixa PDF e aceita no link. Você acompanha o que foi enviado, visto e aprovado.",
    },
  ];
  const salesProof = [
    { value: "Mais valor", label: "antes de falar sobre preço" },
    { value: "Menos atrito", label: "para o cliente aprovar" },
    { value: "1 link", label: "com tudo que vende seu serviço" },
  ];
  const dealLeaks = [
    "Você explica tudo pelo WhatsApp, mas o cliente só lembra do preço.",
    "Seu PDF parece mais simples do que a qualidade real do seu trabalho.",
    "O cliente pede desconto porque não entendeu tudo que está incluso.",
    "Você envia proposta e fica sem saber se a pessoa abriu, leu ou esqueceu.",
  ];
  const objections = [
    "Seu trabalho ganha uma apresentação que sustenta preço.",
    "O cliente recebe clareza para decidir sem ficar perguntando o básico.",
    "Cada proposta vira uma experiência de compra, não apenas uma tabela.",
  ];
  const steps = [
    "Monte a proposta com cliente, serviço, investimento, prazo e condições.",
    "Adicione as provas que aumentam confiança: marca, portfólio, depoimentos e escopo.",
    "Envie um link que conduz o cliente para visualizar, baixar PDF e aceitar.",
  ];
  const niches = ["Social media", "Designer", "Fotógrafo", "Arquiteto", "Consultor", "Técnico de ar-condicionado", "Marceneiro", "Gestor de tráfego", "Estética", "Eventos"];
  const landingExamples = [
    {
      niche: "Designer",
      client: "Maria Eduarda",
      service: "Identidade visual premium",
      price: 1200,
      deadline: "7 dias úteis",
      proof: "Portfolio, paleta, tipografia e depoimento antes do aceite",
      included: ["Logo principal", "Paleta de cores", "Tipografia", "Modelos de posts"],
    },
    {
      niche: "Social media",
      client: "Clínica Aura",
      service: "Gestão mensal de Instagram",
      price: 1800,
      deadline: "30 dias",
      proof: "Calendário, exemplos de posts e clareza do que entra no pacote",
      included: ["Planejamento", "12 posts", "8 stories", "Relatório mensal"],
    },
    {
      niche: "Fotógrafo",
      client: "Studio Serena",
      service: "Ensaio profissional de marca",
      price: 950,
      deadline: "5 dias úteis",
      proof: "Galeria, estilo de edição e condições de entrega no mesmo link",
      included: ["Briefing", "2 horas de ensaio", "30 fotos tratadas", "Galeria online"],
    },
    {
      niche: "Consultor",
      client: "Loja Vértice",
      service: "Consultoria estratégica",
      price: 2500,
      deadline: "4 semanas",
      proof: "Diagnóstico, plano de ação e próximos passos sem conversa solta",
      included: ["Diagnóstico", "4 encontros", "Plano de ação", "Suporte por mensagem"],
    },
  ];
  const plans = [
    {
      code: "start",
      name: "Start",
      price: "R$ 97",
      priceSuffix: "/mês ou R$ 897/ano",
      cta: "Quero começar",
      detail: "Para criar propostas profissionais e enviar para clientes sem gastar muito.",
      items: ["20 propostas por mês", "5 artes de divulgação por mês", "Propostas profissionais", "PDF da proposta", "Portfólio básico", "Aceite online", "Modelos prontos", "Suporte básico"],
    },
    {
      code: "pro",
      name: "Pro",
      price: "R$ 197",
      priceSuffix: "/mês ou R$ 1.497/ano",
      badge: "Mais escolhido",
      cta: "Quero o plano Pro",
      detail: "Para vender com uma apresentação mais profissional, completa e frequente.",
      items: ["120 propostas por mês", "Tudo do Start", "Templates mais completos", "Personalização visual", "Portfólio e proposta mais bonitos", "10 artes de divulgação por mês", "Suporte melhor"],
    },
    {
      code: "premium_site",
      name: "Premium com Site",
      price: "R$ 1.500",
      priceSuffix: "/ano na oferta até 03/06",
      promoPrice: "De R$ 2.997/ano ou R$ 300/mês + R$ 997 implantação",
      badge: "Melhor oferta de lançamento",
      cta: "Quero garantir a oferta",
      detail: "Condição especial de lançamento para os primeiros clientes: FechaPro por 12 meses com mini site profissional e configuração inicial.",
      items: ["12 meses de FechaPro", "Mini site profissional de até 5 seções", "Propostas profissionais", "PDF da proposta", "Aceite online", "Portfólio", "Botão de WhatsApp", "Primeiras propostas criadas", "Treinamento rápido", "20 imagens por mês"],
    },
  ];
  const practicalValue = [
    { icon: FileText, title: "Proposta mais bonita", text: "Envie uma apresentação profissional em vez de um orçamento solto no WhatsApp." },
    { icon: FileDown, title: "PDF da proposta", text: "Seu cliente pode baixar e visualizar sua proposta com mais confiança." },
    { icon: ImageIcon, title: "Portfólio e depoimentos", text: "Mostre seus serviços, fotos e provas de que você entrega um bom trabalho." },
    { icon: Megaphone, title: "Artes para divulgar", text: "Tenha materiais prontos para postar e chamar mais atenção, conforme o plano." },
    { icon: LayoutDashboard, title: "Premium com Site", text: "Na oferta de lançamento, você recebe o FechaPro por 12 meses, mini site e configuração inicial." },
  ];
  const faqs = [
    {
      question: "Preciso configurar tudo sozinho?",
      answer: "Não. No Premium com Site, a equipe do FechaPro configura a estrutura inicial para você sair usando.",
    },
    {
      question: "Posso cancelar?",
      answer: "Sim, você pode cancelar conforme as condições do plano contratado.",
    },
    {
      question: "As artes são feitas por vocês?",
      answer: "No Premium com Site, você tem 20 imagens por mês. No plano Pro, você também tem créditos mensais para artes.",
    },
    {
      question: "Qual plano devo escolher para vender mais rápido?",
      answer: "O Premium com Site anual por R$ 1.500 é a melhor escolha para quem quer receber sistema, mini site, primeiras propostas, portfólio, aceite online, PDF e treinamento.",
    },
    {
      question: "Qual é o limite do site?",
      answer: "O mini site profissional tem até 5 seções e é feito com modelo pronto personalizado para sua empresa.",
    },
    {
      question: "O FechaPro substitui meu orçamento manual?",
      answer: "Sim. Você cria uma proposta com link, PDF, portfólio, depoimentos e aceite, em vez de enviar só uma mensagem solta com preço.",
    },
  ];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br";
  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const [monthlyProposals, setMonthlyProposals] = useState(12);
  const [averageTicket, setAverageTicket] = useState(1200);
  const [rescuedDeals, setRescuedDeals] = useState(2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeExample = landingExamples[activeExampleIndex];
  const rescuedDealLimit = Math.max(1, Math.min(monthlyProposals, 10));
  const clampedRescuedDeals = Math.min(rescuedDeals, rescuedDealLimit);
  const estimatedMonthlyUpside = averageTicket * clampedRescuedDeals;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "FechaPro",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        image: `${siteUrl}/landing/hero-proposta.png`,
        description: "Software para transformar orçamentos simples em propostas comerciais online com portfólio, PDF, aceite do cliente e cobrança.",
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: plan.price.replace("R$ ", ""),
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  function goToSection(id: string) {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", window.location.pathname);
  }

  function updateMonthlyProposals(value: number) {
    setMonthlyProposals(value);
    setRescuedDeals((current) => Math.min(current, Math.max(1, Math.min(value, 10))));
  }

  function updateRescuedDeals(value: number) {
    setRescuedDeals(Math.min(value, rescuedDealLimit));
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
    <main className="fp-landing min-h-screen bg-slate-50 text-slate-950">
      <section className="fp-landing-hero relative isolate overflow-hidden bg-slate-950 text-white">
        <Image className="motion-hero-pan absolute inset-0 -z-20 object-cover" src="/landing/hero-proposta.png" alt="Tela de proposta comercial online criada no FechaPro" fill priority sizes="100vw" />
        <div className="absolute inset-0 -z-10 bg-slate-950/74" />
        <div className="mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-7xl flex-col px-4 py-4 pb-20 sm:min-h-[92vh] sm:px-6 sm:pb-4 lg:px-8">
          <header className="relative flex items-center justify-between gap-3">
            <a className="inline-flex items-center gap-2 font-black" href="#">
              <span className="grid h-12 w-40 place-items-center rounded-lg bg-white/95 px-3">
                <Image alt="FechaPro" className="h-9 w-full object-contain" src="/brand/logofechapro.png" width={144} height={36} />
              </span>
            </a>
            <nav className="hidden items-center gap-6 text-sm font-bold text-white/80 md:flex">
              <button className="font-bold" type="button" onClick={() => goToSection("como-funciona")}>
                Como funciona
              </button>
              <button className="font-bold" type="button" onClick={() => goToSection("recursos")}>
                Recursos
              </button>
              <a className="font-bold" href="#planos">
                Planos
              </a>
              <a href="/interesse">
                Tenho interesse
              </a>
              <a href="#planos">
                Começar
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <a className="hidden min-h-10 items-center justify-center rounded-lg bg-green-500 px-4 text-sm font-black text-slate-950 sm:inline-flex" href="#planos">
                Escolher plano
              </a>
              <a className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/25 px-4 text-sm font-black text-white" href="/login">
                Entrar
              </a>
              <button
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/25 text-white md:hidden"
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
            {mobileMenuOpen ? (
              <nav className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 grid gap-1 rounded-lg border border-white/15 bg-slate-950/96 p-2 text-sm font-black text-white shadow-xl shadow-black/30 backdrop-blur md:hidden">
                <button className="min-h-11 rounded-lg px-3 text-left" type="button" onClick={() => goToSection("como-funciona")}>
                  Como funciona
                </button>
                <button className="min-h-11 rounded-lg px-3 text-left" type="button" onClick={() => goToSection("recursos")}>
                  Recursos
                </button>
                <a className="min-h-11 rounded-lg px-3 py-3" href="#planos" onClick={() => setMobileMenuOpen(false)}>
                  Planos
                </a>
                <a className="min-h-11 rounded-lg px-3 py-3" href="/interesse">
                  Tenho interesse
                </a>
                <a className="min-h-11 rounded-lg bg-green-500 px-3 py-3 text-slate-950" href="#planos">
                  Começar
                </a>
              </nav>
            ) : null}
          </header>

          <div className="grid flex-1 content-end gap-6 pb-6 pt-12 sm:gap-8 sm:pb-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="fp-landing-kicker inline-flex rounded-lg bg-white/12 px-3 py-2 text-xs font-black uppercase tracking-normal text-green-100">
                Propostas, PDF e aceite em um link
              </p>
              <h1 className="mt-5 max-w-xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Organize propostas comerciais sem depender de arquivo solto e mensagem perdida.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/82 sm:text-base sm:leading-7">
                O FechaPro ajuda prestadores de serviço a montar proposta com escopo, valor, prazo, portfólio, PDF, aceite e acompanhamento de status.
              </p>
              <div className="fp-landing-note motion-shine mt-5 rounded-lg border border-green-300/35 bg-green-300/12 p-4">
                <p className="text-sm font-black text-green-100">Oferta até 03/06: Premium com Site por R$1.500/ano.</p>
                <p className="mt-1 text-xs font-bold leading-5 text-white/70">Inclui 12 meses de FechaPro, mini site profissional, configuração inicial e 20 imagens por mês.</p>
              </div>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-white/80">
                Um painel simples para enviar, acompanhar e reaproveitar informações de clientes, serviços e propostas.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a className="fp-landing-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-500 px-5 font-black text-slate-950" href="#planos">
                  <Sparkles size={18} />
                  Ver planos
                </a>
                <a className="fp-landing-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 font-black text-white" href="#planos">
                  Quero tudo pronto
                </a>
                <a className="fp-landing-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 font-black text-white" href="/interesse">
                  Tenho interesse
                </a>
              </div>
            </div>

            <div className="fp-landing-demo motion-float-slow grid gap-3 rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur sm:p-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {salesProof.map((metric) => (
                  <LandingMetric key={metric.value} value={metric.value} label={metric.label} />
                ))}
              </div>
              <div className="motion-lift rounded-lg bg-white p-4 text-slate-950">
                <p className="text-xs font-black uppercase text-blue-700">Exemplo de proposta</p>
                <h2 className="mt-1 text-xl font-black">{activeExample.service}</h2>
                <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                  <span>Cliente: {activeExample.client}</span>
                  <span>Investimento: {money.format(activeExample.price)}</span>
                  <span>Prazo: {activeExample.deadline}</span>
                  <span>Inclui: {activeExample.included.join(", ")}</span>
                  <span>Prova: {activeExample.proof}</span>
                </div>
                <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-green-600 font-black text-white" type="button">
                  Aceitar proposta
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {landingExamples.map((example, index) => (
                  <button
                    className={`min-h-10 rounded-lg border px-2 text-xs font-black ${
                      activeExampleIndex === index
                        ? "border-green-300 bg-green-300 text-slate-950"
                        : "border-white/20 bg-white/10 text-white"
                    }`}
                    key={example.niche}
                    type="button"
                    onClick={() => setActiveExampleIndex(index)}
                  >
                    {example.niche}
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-white/15 bg-slate-950/60 p-4">
                <p className="text-xs font-black uppercase text-green-200">Para o cliente</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/80">
                  Escopo, valor, prazo e próximos passos ficam em uma única página.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fp-landing-band border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {benefits.map((benefit) => (
            <article className="fp-landing-card motion-lift rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5" key={benefit.title}>
              <benefit.icon className="text-green-700" size={24} />
              <h2 className="mt-4 text-lg font-black">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fp-landing-band bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-rose-700">Problema comum</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Quando a proposta fica espalhada, o cliente demora mais para decidir.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Conversas por WhatsApp ajudam, mas não substituem uma proposta clara. O FechaPro coloca os dados importantes em um formato fácil de revisar, aprovar e guardar.
            </p>
          </div>
          <div className="grid gap-3">
            {dealLeaks.map((item) => (
              <article className="fp-landing-alert grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-rose-700/15 bg-rose-50 p-5" key={item}>
                <span className="motion-float-soft grid size-9 place-items-center rounded-lg bg-rose-700 font-black text-white">!</span>
                <p className="self-center text-sm font-black leading-6 text-rose-950 sm:text-base">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-landing-band fp-landing-muted bg-slate-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Simulador</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Veja o impacto de recuperar propostas que ficam sem resposta.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Ajuste o volume de propostas, o ticket médio e uma estimativa conservadora de vendas que poderiam voltar para a conversa.
            </p>
          </div>

          <div className="fp-landing-card grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10">
            <div className="grid gap-4 sm:grid-cols-3">
              <LandingRange
                label="Propostas por mês"
                max={60}
                min={1}
                step={1}
                value={monthlyProposals}
                valueLabel={`${monthlyProposals}`}
                onChange={updateMonthlyProposals}
              />
              <LandingRange
                label="Ticket médio"
                max={10000}
                min={300}
                step={100}
                value={averageTicket}
                valueLabel={money.format(averageTicket)}
                onChange={setAverageTicket}
              />
              <LandingRange
                label="Vendas recuperadas"
                max={rescuedDealLimit}
                min={1}
                step={1}
                value={clampedRescuedDeals}
                valueLabel={`${clampedRescuedDeals}/mês`}
                onChange={updateRescuedDeals}
              />
            </div>

            <div className="grid gap-3 rounded-lg bg-slate-950 p-5 text-white sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-black uppercase text-green-300">Potencial estimado</p>
                <strong className="mt-2 block text-3xl font-black sm:text-4xl">{money.format(estimatedMonthlyUpside)}</strong>
                <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                  Se {clampedRescuedDeals} proposta(s) por mês forem recuperadas, essa é a receita que pode voltar para negociação.
                </p>
              </div>
              <a className="inline-flex min-h-12 items-center justify-center rounded-lg bg-green-500 px-5 font-black text-slate-950" href="#planos">
                Ver planos
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="fp-landing-dark bg-slate-950 text-white" id="recursos">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-green-300">Recursos</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Proposta, PDF, histórico e materiais de apoio no mesmo fluxo.</h2>
            <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Você monta a proposta, envia o link, acompanha visualizações e mantém os dados organizados para usar de novo.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: FileText, title: "Propostas profissionais com link", text: "Organize valor, prazo, escopo, observações e aceite em uma página profissional para enviar ao cliente." },
              { icon: FileDown, title: "PDF da proposta", text: "O cliente pode visualizar online e baixar uma versão em PDF com mais confiança." },
              { icon: ImageIcon, title: "Portfólio e depoimentos", text: "Mostre trabalhos anteriores e provas sociais dentro da própria proposta." },
              { icon: Megaphone, title: "Materiais para vender melhor", text: "Tenha propostas, portfólio, mensagens e artes de apoio conforme o plano escolhido." },
            ].map((feature) => (
              <article className="fp-landing-dark-card motion-lift rounded-lg border border-white/15 bg-white/8 p-5" key={feature.title}>
                <feature.icon className="text-green-300" size={24} />
                <h3 className="mt-4 text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-landing-band fp-landing-muted bg-slate-100" id="como-funciona">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Fluxo</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Da criação ao aceite, sem sair do painel.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              O processo fica dividido em etapas objetivas: cliente, serviço, condições, envio, acompanhamento e aceite.
            </p>
          </div>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <article className="fp-landing-step grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-black/10 bg-white p-5" key={step}>
                <span className={`motion-float-soft grid size-10 place-items-center rounded-lg bg-slate-950 font-black text-white motion-delay-${Math.min(index, 3)}`}>{index + 1}</span>
                <p className="self-center text-base font-black leading-6 sm:text-lg sm:leading-7">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-landing-band bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Público</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">Para prestadores que precisam explicar escopo, prazo e valor com clareza.</h2>
            <div className="fp-landing-tags mt-6 flex flex-wrap gap-2">
              {niches.map((niche) => (
                <span className="rounded-lg border border-black/10 bg-slate-50 px-4 py-3 text-sm font-black" key={niche}>
                  {niche}
                </span>
              ))}
            </div>
          </div>
          <div className="fp-landing-card rounded-lg border border-black/10 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase text-blue-700">Na decisão do cliente</p>
            <h3 className="mt-2 text-xl font-black sm:text-2xl">A proposta precisa responder às dúvidas antes do follow-up.</h3>
            <ul className="mt-5 grid gap-3">
              {objections.map((item) => (
                <li className="flex gap-3 text-sm font-bold leading-6 text-slate-700 sm:text-base sm:leading-7" key={item}>
                  <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="fp-landing-band bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase text-blue-700">Na prática</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Um padrão melhor para enviar propostas todo dia.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              A ideia é reduzir retrabalho: cadastrar serviços, reaproveitar dados, gerar PDF e manter o cliente em um link organizado.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {practicalValue.map((item) => (
              <article className="fp-landing-card motion-lift rounded-lg border border-black/10 bg-slate-50 p-5" key={item.title}>
                <item.icon className="text-green-700" size={24} />
                <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-landing-dark scroll-mt-6 bg-slate-950 text-white" id="planos">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase text-green-300">Planos</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Escolha como quer começar.</h2>
            <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Três caminhos simples: começar com propostas, vender com uma apresentação mais completa ou receber tudo configurado para usar.
            </p>
          </div>

          <div className="fp-landing-offer motion-shine mt-7 rounded-lg border border-green-300/30 bg-green-300/10 p-5">
            <p className="text-xs font-black uppercase text-green-200">Oferta de lançamento até 03/06</p>
            <h3 className="mt-2 text-2xl font-black">Premium com Site anual por R$ 1.500.</h3>
            <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-white/82">
              Condição especial para os primeiros clientes: 12 meses de FechaPro, mini site profissional, propostas, PDF, aceite online, portfólio, WhatsApp, configuração inicial, primeiras propostas, treinamento rápido e 20 imagens por mês.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article className={`fp-landing-plan motion-lift relative flex h-full flex-col rounded-lg border p-5 ${
                plan.name === "Premium com Site"
                  ? "motion-pulse-soft border-green-300 bg-white text-slate-950 shadow-2xl shadow-green-950/30 lg:scale-[1.03]"
                  : plan.name === "Start"
                    ? "border-green-400 bg-white text-slate-950"
                    : "border-white/15 bg-white/8"
              }`} key={plan.name}>
                {plan.badge ? (
                  <span className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-green-600 px-3 py-1 text-xs font-black uppercase text-white">
                    {plan.badge}
                  </span>
                ) : null}
                <p className={`text-sm font-black uppercase ${plan.name === "Premium com Site" ? "text-green-700" : "text-blue-700"}`}>{plan.name}</p>
                <strong className="mt-3 block text-3xl font-black">{plan.price}</strong>
                <span className="mt-1 block text-slate-600">{plan.priceSuffix}</span>
                {plan.promoPrice ? <strong className="mt-3 block text-xl text-slate-950">{plan.promoPrice}</strong> : null}
                <p className="mt-4 min-h-24 text-sm leading-6 text-slate-600">{plan.detail}</p>
                <ul className="mt-5 grid gap-3">
                  {plan.items.map((item) => (
                    <li className="flex items-center gap-2 text-sm font-bold" key={item}>
                      <CheckCircle2 className="shrink-0 text-green-500" size={18} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  className={`mt-auto grid min-h-11 place-items-center rounded-lg px-4 text-center font-black ${
                    plan.name === "Premium com Site" ? "bg-slate-950 text-white" : "bg-green-600 text-white"
                  }`}
                  href={`/checkout/cadastro/${plan.code}`}
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-white/15 bg-white/8 p-5">
            <p className="text-xs font-black uppercase text-green-300">Você não precisa saber mexer com tecnologia</p>
            <p className="mt-2 text-sm font-bold leading-6 text-white/78 sm:text-base sm:leading-7">
              A equipe do FechaPro te ajuda na configuração inicial, cadastro e primeiros passos, de acordo com o plano escolhido.
            </p>
          </div>
        </div>
      </section>

      <section className="fp-landing-band bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Dúvidas comuns</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Perguntas antes de escolher um plano.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Alguns pontos importantes sobre uso, pagamento, limites e configuração inicial.
            </p>
          </div>
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <details className="fp-landing-faq rounded-lg border border-black/10 bg-slate-50 p-4" key={faq.question}>
                <summary className="cursor-pointer font-black">{faq.question}</summary>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="fp-landing-cta bg-green-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-green-100">Comece pelo próximo envio</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Transforme sua próxima proposta em um link claro, revisável e pronto para aceite.</h2>
          </div>
          <a className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-6 font-black text-white" href="#planos">
            Escolher plano
          </a>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 p-3 shadow-xl shadow-slate-900/20 backdrop-blur sm:hidden">
        <a className="grid min-h-12 w-full place-items-center rounded-lg bg-green-600 px-4 text-center font-black text-white" href="#planos">
          Começar com um plano
        </a>
      </div>
    </main>
    </>
  );
}

function LandingMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg bg-white/12 p-3 text-center">
      <strong className="block text-lg font-black">{value}</strong>
      <span className="text-xs font-bold text-white/70">{label}</span>
    </article>
  );
}

function ProductUpdatesModal({
  onClose,
  onOpenArts,
  onOpenBrand,
}: {
  onClose: () => void;
  onOpenArts: () => void;
  onOpenBrand: () => void;
}) {
  const updates = [
    {
      icon: FileText,
      title: "Propostas mais completas",
      description: "Link público, aceite do cliente, PDF, status e pagamento ficam juntos em um fluxo mais profissional.",
      tag: "Disponível",
    },
    {
      icon: Palette,
      title: "Artes de divulgação",
      description: "Crie peças para divulgar serviços, promoções, cardápios, agenda aberta e campanhas rápidas.",
      tag: "Novo",
    },
    {
      icon: CreditCard,
      title: "Planos, créditos e cobrança",
      description: "Assinaturas, pacotes extras de artes e limites por plano já aparecem conectados ao painel.",
      tag: "Ativo",
    },
  ];
  const nextFeatures = [
    "Modelos de proposta por nicho com textos mais prontos para vender.",
    "Acompanhamento mais detalhado depois que o cliente abre, aceita ou paga a proposta.",
    "Mais opções para transformar propostas aceitas em próximos passos de atendimento.",
    "Melhorias no checkout para deixar aceite e pagamento ainda mais diretos.",
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
            <p className="text-xs font-black uppercase text-green-700">Novidades do FechaPro</p>
            <h2 id="updates-modal-title" className="mt-1 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
              Atualizações para vender com mais clareza
            </h2>
          </div>
          <button
            aria-label="Fechar novidades"
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
                <p className="text-xs font-black uppercase text-green-200">Agora no painel</p>
                <p className="mt-2 text-lg font-black leading-snug">
                  Seu cliente recebe uma proposta mais profissional, você acompanha melhor o interesse e ainda ganha velocidade para divulgar seus serviços.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-500 px-3 py-1 text-xs font-black text-slate-950">
                <Sparkles size={14} />
                Maio 2026
              </span>
            </div>
          </section>

          <section className="grid gap-3">
            {updates.map((item) => {
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
                    </div>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="rounded-lg border border-black/10 p-4">
            <p className="text-xs font-black uppercase text-blue-700">Próximas features</p>
            <div className="mt-3 grid gap-2">
              {nextFeatures.map((feature) => (
                <div className="grid grid-cols-[auto_1fr] gap-2 text-sm font-bold leading-6 text-slate-700" key={feature}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-2 sm:grid-cols-3">
            <button className="min-h-11 rounded-lg bg-green-600 px-4 font-black text-white" type="button" onClick={onOpenArts}>
              Ver artes de divulgação
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
              Tour guiado - passo {currentIndex + 1} de {total}
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

        <div className="grid gap-2 sm:grid-cols-3">
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
              Pular tour
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
    { id: "1", title: "Logo", category: "Design", imageUrl: "" },
    { id: "2", title: "Social", category: "Conteúdo", imageUrl: "" },
    { id: "3", title: "Web", category: "Site", imageUrl: "" },
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
  onClose,
  onCopyLink,
  onDuplicate,
  onRemove,
  onResend,
  onStatusChange,
  proposal,
}: {
  onClose: () => void;
  onCopyLink: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onResend: () => void;
  onStatusChange: (status: ProposalStatus) => void;
  proposal: Proposal;
}) {
  const timeline = proposalTimeline(proposal);
  const canResend = proposal.status === "expired" || proposal.status === "declined";

  return (
    <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Detalhes da proposta</p>
            <h3 className="mt-1 text-2xl font-black">{proposal.clientName}</h3>
            <p className="mt-1 leading-7 text-slate-600">{proposal.serviceName}</p>
          </div>
          <button className="min-h-10 rounded-lg border border-black/10 px-4 text-sm font-black" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
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

        <div className="grid gap-2 sm:grid-cols-3">
          {proposal.publicSlug ? (
            <>
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" href={`/p/${proposal.publicSlug}`} target="_blank">
                <Eye size={16} />
                Ver online
              </a>
              <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 font-black text-blue-700" href={`/p/${proposal.publicSlug}/pdf`} target="_blank">
                <FileDown size={16} />
                Baixar PDF
              </a>
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
  onCopyLink,
  onDuplicate,
  onOpenDetail,
  onRemove,
  onResend,
  onStatusChange,
  proposal,
}: {
  onCopyLink: () => void;
  onDuplicate: () => void;
  onOpenDetail?: () => void;
  onRemove: () => void;
  onResend: () => void;
  onStatusChange: (status: ProposalStatus) => void;
  proposal: Proposal;
}) {
  const isExpired = proposal.status === "expired";
  const canResend = isExpired || proposal.status === "declined";

  return (
    <article className="grid gap-3 rounded-lg border border-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black">{proposal.clientName}</h3>
            {isExpired && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-black text-orange-700">
                Expirado
              </span>
            )}
          </div>
          <p className="mt-1 leading-6 text-slate-600">{proposal.serviceName}</p>
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
        <div className="grid gap-2 sm:grid-cols-3">
          <a
            className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-black text-green-700"
            href={`/p/${proposal.publicSlug}`}
            target="_blank"
          >
            Ver online
          </a>
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-black text-blue-700"
            href={`/p/${proposal.publicSlug}/pdf`}
            target="_blank"
          >
            <FileDown size={15} />
            PDF
          </a>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
            type="button"
            onClick={onCopyLink}
          >
            <Copy size={15} />
            Copiar link
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(statusConfig) as ProposalStatus[]).map((status) => {
          const config = statusConfig[status]!;
          const Icon = config.icon;
          const active = proposal.status === status;
          return (
            <button
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-2 text-xs font-black ${
                active ? config.className : "bg-white text-slate-500"
              }`}
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
            >
              <Icon size={15} />
              {config.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {canResend && (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
            type="button"
            onClick={onResend}
          >
            <RotateCcw size={15} />
            Reenviar
          </button>
        )}
        {onOpenDetail ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
            type="button"
            onClick={onOpenDetail}
          >
            <FileText size={15} />
            Detalhes
          </button>
        ) : null}
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black text-slate-700"
          type="button"
          onClick={onDuplicate}
        >
          <Files size={15} />
          Duplicar
        </button>
      </div>
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
  if (!findProposalTemplate(draft.templateId)) return "Escolha um template pronto para criar a proposta.";
  if (!draft.serviceName.trim()) return "Informe o serviço da proposta.";
  if (!Number.isFinite(draft.price) || draft.price <= 0) return "Informe um valor maior que zero.";
  if (!draft.deadline.trim()) return "Informe o prazo da proposta.";
  if (draft.validUntil && !isValidDateOnly(draft.validUntil)) return "Informe uma data de validade válida.";
  if (draft.clientEmail?.trim() && !isValidEmail(draft.clientEmail.trim())) return "Informe um e-mail de cliente válido.";
  return null;
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

function proposalTimeline(proposal: Proposal) {
  const viewed = Number(proposal.viewCount || 0) > 0 || ["viewed", "awaiting_response", "accepted", "declined"].includes(proposal.status);
  const paid = proposal.paymentStatus === "paid" || proposal.paymentStatus === "PAID";
  const expired = proposal.status === "expired";

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
      description: viewed ? `${proposal.viewCount || 1} visualização(ões) registrada(s).` : "Aguardando a primeira visualização.",
      done: viewed,
    },
    {
      title: "Decisao do cliente",
      description:
        proposal.status === "accepted"
          ? `Aceita por ${proposal.acceptedBy || proposal.clientName}${proposal.acceptedAt ? ` em ${formatDateTime(proposal.acceptedAt)}` : ""}.`
          : proposal.status === "declined"
            ? `Recusada${proposal.declinedReason ? `: ${proposal.declinedReason}` : "."}`
            : proposal.status === "awaiting_response"
              ? "Cliente clicou no WhatsApp para tirar dúvida ou negociar."
              : expired
              ? `Expirada em ${formatDateOnly(proposal.validUntil)}.`
              : "Ainda aguardando aceite ou recusa.",
      done: ["accepted", "declined", "expired"].includes(proposal.status),
    },
    {
      title: "Pagamento",
      description: paid
        ? `Pagamento confirmado${proposal.paymentPaidAt ? ` em ${formatDateTime(proposal.paymentPaidAt)}` : ""}.`
        : "Pagamento ainda não confirmado.",
      done: paid,
    },
  ];
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

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

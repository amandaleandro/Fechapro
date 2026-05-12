"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
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
  MessageSquareQuote,
  Moon,
  CreditCard,
  Plus,
  RotateCcw,
  Settings,
  Send,
  Sparkles,
  Sun,
  ThumbsDown,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react";

type ActiveView = "dashboard" | "proposals" | "clients" | "services" | "portfolio" | "testimonials" | "brand" | "templates" | "plans" | "account";
type ProposalStatus = "sent" | "viewed" | "accepted" | "declined" | "expired";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  segment: string | null;
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

type ProposalDraft = Omit<Proposal, "id" | "status" | "createdAt" | "publicSlug" | "viewCount">;

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

type BillingPlan = {
  code: PlanCode;
  name: string;
  price: string;
  priceCents: number;
  maintenancePrice?: string;
  maintenancePriceCents?: number;
  proposalLimit: number;
  features: string[];
};

type BillingState = {
  subscription: {
    plan: PlanCode;
    status: string;
  };
  plans: BillingPlan[];
  usage: {
    proposalsThisMonth: number;
    proposalLimit: number;
  };
};

type AsaasStatus = {
  apiHost: string;
  connection: {
    error: string | null;
    ok: boolean;
    status: number | null;
    totalCount: number | null;
  };
  hasApiKey: boolean;
  hasWebhookToken: boolean;
  sandbox: boolean;
  webhookUrl: string;
};

type ProposalTemplate = {
  id: string;
  niche: string;
  title: string;
  serviceName: string;
  price: number;
  deadline: string;
  payment: string;
  included: string[];
  notes: string;
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
};

const blankDraft: ProposalDraft = {
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
  sent: { label: "Enviado", icon: Send, className: "bg-amber-500 text-white" },
  viewed: { label: "Visualizado", icon: Eye, className: "bg-sky-600 text-white" },
  accepted: { label: "Aceito", icon: CheckCircle2, className: "bg-green-700 text-white" },
  declined: { label: "Recusado", icon: ThumbsDown, className: "bg-rose-700 text-white" },
};

const navItems: Array<{ id: ActiveView; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "proposals", label: "Propostas", icon: FileText },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "services", label: "Servicos", icon: BriefcaseBusiness },
  { id: "portfolio", label: "Portfolio", icon: ImageIcon },
  { id: "testimonials", label: "Depoimentos", icon: MessageSquareQuote },
  { id: "brand", label: "Marca", icon: Settings },
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
  pro: "Essencial",
  plus: "Profissional",
  premium: "Pro Site",
  premium_site: "Premium Site",
};

const moduleRequirements: Partial<Record<ActiveView, PlanCode>> = {
  services: "pro",
  brand: "pro",
  portfolio: "plus",
  testimonials: "plus",
  templates: "plus",
};

const commercialModuleIds: ActiveView[] = [
  "dashboard",
  "proposals",
  "clients",
  "services",
  "brand",
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
    description: "O painel junta IA, dados do cliente, servico, valor, prazo e preview para voce montar uma proposta profissional sem sair da tela.",
    checklist: ["Use a IA para organizar o texto", "Escolha cliente e servico cadastrados", "Salve ou gere o PDF quando estiver pronto"],
  },
  {
    view: "proposals",
    eyebrow: "Controle comercial",
    title: "Acompanhe cada proposta enviada",
    description: "Aqui ficam os links publicos, PDF, status, reenvio, duplicacao e detalhes com linha do tempo para entender o que aconteceu com cada venda.",
    checklist: ["Abra a proposta online", "Copie o link para WhatsApp ou e-mail", "Use Detalhes para ver visualizacoes, aceite e pagamento"],
  },
  {
    view: "clients",
    eyebrow: "Base de clientes",
    title: "Guarde contatos para vender mais rapido",
    description: "Cadastre clientes com e-mail, telefone e segmento para reaproveitar em novas propostas sem digitar tudo de novo.",
    checklist: ["Cadastre nome e e-mail", "Use segmento para organizar nichos", "Reaproveite clientes no gerador de proposta"],
  },
  {
    view: "services",
    eyebrow: "Biblioteca de servicos",
    title: "Monte precos e entregaveis padrao",
    description: "Servicos cadastrados aceleram a criacao de propostas e deixam valores, prazos e escopo mais consistentes.",
    checklist: ["Defina preco base", "Informe prazo comum", "Liste o que esta incluso"],
  },
  {
    view: "portfolio",
    eyebrow: "Prova visual",
    title: "Mostre trabalhos anteriores",
    description: "O portfolio ajuda o cliente a confiar antes de discutir preco. As imagens entram na proposta e reforcam seu profissionalismo.",
    checklist: ["Envie imagens dos melhores trabalhos", "Agrupe por categoria", "Use imagens relacionadas ao servico vendido"],
  },
  {
    view: "brand",
    eyebrow: "Identidade da empresa",
    title: "Personalize logo, contatos e cores",
    description: "A marca configurada aparece nas propostas online e no PDF. Isso faz cada orcamento parecer uma apresentacao profissional.",
    checklist: ["Adicione logo", "Configure WhatsApp e e-mail comercial", "Escolha cores da empresa"],
  },
  {
    view: "plans",
    eyebrow: "Pronto para vender",
    title: "Escolha o plano e valide com clientes reais",
    description: "Quando o financeiro estiver configurado, esta tela vira o caminho para assinatura e limite de uso por plano.",
    checklist: ["Revise limite do plano atual", "Teste checkout em ambiente seguro", "Configure o Asaas antes de vender"],
  },
];

const proposalTemplates: ProposalTemplate[] = [
  {
    id: "social-media",
    niche: "Social media",
    title: "Gestao mensal de Instagram",
    serviceName: "Gestao de redes sociais",
    price: 1200,
    deadline: "30 dias",
    payment: "Mensal antecipado",
    included: ["Planejamento editorial", "12 posts feed", "8 stories", "Legenda estrategica", "Relatorio mensal"],
    notes: "Nao inclui impulsionamento de posts nem verba de midia.",
  },
  {
    id: "designer",
    niche: "Designer",
    title: "Identidade visual",
    serviceName: "Identidade visual profissional",
    price: 1500,
    deadline: "10 dias uteis",
    payment: "50% entrada e 50% entrega",
    included: ["Logo principal", "Logo secundario", "Paleta de cores", "Tipografia", "Mini manual da marca"],
    notes: "Inclui ate 2 rodadas de ajustes dentro do escopo aprovado.",
  },
  {
    id: "fotografo",
    niche: "Fotografia",
    title: "Ensaio profissional",
    serviceName: "Ensaio fotografico profissional",
    price: 900,
    deadline: "7 dias uteis apos o ensaio",
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
    deadline: "25 dias uteis",
    payment: "40% entrada, 30% desenvolvimento e 30% entrega",
    included: ["Levantamento de necessidades", "Layout", "Moodboard", "Projeto 3D", "Lista de compras"],
    notes: "Execucao de obra e acompanhamento presencial podem ser contratados a parte.",
  },
  {
    id: "consultor",
    niche: "Consultoria",
    title: "Consultoria estrategica",
    serviceName: "Consultoria estrategica personalizada",
    price: 1800,
    deadline: "4 semanas",
    payment: "Integral no inicio ou 2 parcelas",
    included: ["Diagnostico", "Plano de acao", "4 encontros online", "Material de apoio", "Suporte por mensagem"],
    notes: "O resultado depende da execucao das acoes combinadas pelo cliente.",
  },
  {
    id: "tecnico",
    niche: "Servico tecnico",
    title: "Instalacao e manutencao",
    serviceName: "Servico tecnico especializado",
    price: 850,
    deadline: "5 dias uteis",
    payment: "50% entrada e 50% conclusao",
    included: ["Visita tecnica", "Diagnostico", "Instalacao ou manutencao", "Teste final", "Garantia de 30 dias"],
    notes: "Pecas e materiais podem ser cobrados separadamente apos avaliacao.",
  },
];

export default function Home() {
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [dark, setDark] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSource, setAiSource] = useState<"openai" | "fallback" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProposalDraft>(blankDraft);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(null);
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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data: { user: { id: string; name: string; email: string } | null }) => {
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
    setNotice(`Modulo disponivel a partir do plano ${requiredPlanLabel(activeView)}.`);
    setActiveView("plans");
  }, [activeView, currentPlan]);

  useEffect(() => {
    if (tourStepIndex === null || tourStepIndex < availableTourSteps.length) return;
    setTourStepIndex(Math.max(availableTourSteps.length - 1, 0));
  }, [availableTourSteps.length, tourStepIndex]);

  async function loadDashboardData() {
    const [brandData, billingData, clientsData, servicesData, portfolioData, testimonialsData, proposalsData] = await Promise.all([
      apiGet<BrandProfile>("/api/brand"),
      apiGet<BillingState>("/api/billing/plan"),
      apiGet<Client[]>("/api/clients"),
      apiGet<ServiceItem[]>("/api/services"),
      apiGet<PortfolioItem[]>("/api/portfolio"),
      apiGet<Testimonial[]>("/api/testimonials"),
      apiGet<Proposal[]>("/api/proposals"),
    ]);

    setBrand(brandData);
    setBilling(billingData);
    setClients(clientsData);
    setServices(servicesData);
    setPortfolio(portfolioData);
    setTestimonials(testimonialsData);
    setProposals(proposalsData);
  }

  const openValue = useMemo(
    () =>
      proposals
        .filter((proposal) => proposal.status !== "accepted" && proposal.status !== "declined")
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
    if (!draft.clientName || !draft.serviceName || !draft.price || !draft.deadline) {
      setNotice("Preencha cliente, servico, valor e prazo antes de gerar a proposta.");
      return null;
    }
    const result = await apiPost<Proposal & { clientEmailSent?: boolean }>("/api/proposals", {
      ...draft,
      payment: draft.payment || "A combinar",
      status,
    });
    setProposals((current) => [result, ...current]);
    const emailNote = result.clientEmailSent
      ? " E-mail enviado ao cliente."
      : draft.clientEmail
        ? ""
        : " Sem e-mail do cliente - proposta nao foi enviada por e-mail.";
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
      quote: "A proposta ficou clara, bonita e ajudou a aprovar o projeto mais rapido.",
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

  function startTour() {
    if (onboardingIncomplete) {
      setNotice("Conclua a configuracao inicial para liberar o tour guiado.");
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

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]" data-theme={dark ? "dark" : "light"}>
      <header className="sticky top-0 z-20 border-b border-black/10 bg-slate-100/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4">
          <div>
            <img alt="FechaPro" className="mb-3 h-9 w-36 object-contain" src="/brand/logofechapro.png" />
            <h1 className="max-w-xs text-2xl font-black leading-tight sm:max-w-none sm:text-3xl">
              Sistema de propostas profissionais.
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Ola, {brand?.businessName || session.name}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
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
              setNotice("Configuracao concluida. Agora voce ja pode criar sua primeira proposta.");
              setActiveView("dashboard");
            }}
          />
        ) : (
          <>
            <nav className="grid grid-cols-2 gap-2 rounded-lg border border-black/10 bg-white p-2 shadow-xl shadow-slate-900/10 sm:grid-cols-4 lg:grid-cols-10">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                const locked = !canUseModule(item.id, currentPlan);
                const tourFocus = currentTourStep?.view === item.id;
                return (
                  <button
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black ${
                      active ? "bg-green-600 text-white" : locked ? "text-slate-400" : "text-slate-600"
                    } ${locked ? "border border-dashed border-slate-200 bg-slate-50/70" : ""} ${tourFocus ? "ring-2 ring-green-300 ring-offset-2 ring-offset-[var(--app-bg)]" : ""}`}
                    key={item.id}
                    type="button"
                    title={locked ? `Disponivel a partir do plano ${requiredPlanLabel(item.id)}` : item.label}
                    onClick={() => {
                      if (locked) {
                        setNotice(`O modulo ${item.label} esta disponivel a partir do plano ${requiredPlanLabel(item.id)}.`);
                        setActiveView("plans");
                        return;
                      }
                      setActiveView(item.id);
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                    {locked ? <LockKeyhole size={14} /> : null}
                  </button>
                );
              })}
            </nav>

            {activeView === "dashboard" ? (
          <DashboardView
            accepted={accepted}
            aiPrompt={aiPrompt}
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
            onAiPromptChange={setAiPrompt}
            aiSource={aiSource}
            onDraftChange={updateDraft}
            onGenerate={async () => {
              if (!aiPrompt.trim()) return;
              const result = await apiPost<{
                source: "openai" | "fallback";
                proposal: Partial<ProposalDraft> & { upsell?: string; sendMessage?: string };
              }>("/api/ai/proposal", { prompt: aiPrompt });
              setAiSource(result.source);
              setDraft((current) => ({
                ...current,
                clientName: result.proposal.clientName || current.clientName,
                serviceName: result.proposal.serviceName || current.serviceName,
                price: Number(result.proposal.price || current.price || 0),
                deadline: result.proposal.deadline || current.deadline,
                payment: result.proposal.payment || current.payment,
                included: result.proposal.included?.length ? result.proposal.included : current.included,
                notes: [result.proposal.notes, result.proposal.upsell ? `Upsell sugerido: ${result.proposal.upsell}` : "", result.proposal.sendMessage ? `Mensagem de envio: ${result.proposal.sendMessage}` : ""]
                  .filter(Boolean)
                  .join("\n\n"),
              }));
            }}
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
            {activeView === "templates" ? (
              <TemplatesView
                onUseTemplate={(template) => {
                  setDraft((current) => ({
                    ...current,
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
              setNotice("Tour concluido. Agora voce ja conhece o fluxo principal do FechaPro.");
              return;
            }
            moveTour(1);
          }}
          step={currentTourStep}
          total={availableTourSteps.length}
        />
      ) : null}
    </main>
  );
}

function DashboardView({
  accepted,
  aiPrompt,
  aiSource,
  brand,
  clients,
  draft,
  onAiPromptChange,
  onDraftChange,
  onGenerate,
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
}: {
  accepted: number;
  aiPrompt: string;
  aiSource: "openai" | "fallback" | null;
  brand: BrandProfile;
  clients: Client[];
  draft: ProposalDraft;
  onAiPromptChange: (value: string) => void;
  onDraftChange: <K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) => void;
  onGenerate: () => void;
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
}) {
  const includedItems = draft.included.length ? draft.included : ["Itens da proposta aparecem aqui."];
  const acceptedValue = proposals
    .filter((proposal) => proposal.status === "accepted")
    .reduce((sum, proposal) => sum + proposal.price, 0);
  const viewed = proposals.filter((proposal) => proposal.status === "viewed").length;
  const declined = proposals.filter((proposal) => proposal.status === "declined").length;
  const sent = proposals.filter((proposal) => proposal.status === "sent").length;
  const totalViews = proposals.reduce((sum, proposal) => sum + (proposal.viewCount || 0), 0);
  const acceptanceRate = proposals.length ? Math.round((accepted / proposals.length) * 100) : 0;
  const expired = proposals.filter((proposal) => proposal.validUntil && proposal.validUntil < todayDate()).length;

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

      <section className="grid gap-5 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 sm:min-h-80 sm:grid-cols-[1fr_0.85fr] sm:items-end sm:p-6">
        <div>
          <span className="mb-3 inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-700">
            Plataforma mobile first
          </span>
          <h2 className="max-w-[12ch] text-4xl font-black leading-none sm:text-6xl">
            Crie uma proposta comercial em minutos.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Use seus cadastros de clientes, servicos, portfolio e depoimentos para montar uma proposta completa.
          </p>
        </div>

        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onGenerate();
          }}
        >
          <label className="grid gap-2 text-sm font-extrabold text-slate-600" htmlFor="aiPrompt">
            Rascunho rapido com IA
          </label>
          <textarea
            className="min-h-32 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
            id="aiPrompt"
            placeholder="Ex: Identidade visual para loja de roupas, prazo de 7 dias, valor 1200, pagamento 50/50"
            value={aiPrompt}
            onChange={(event) => onAiPromptChange(event.target.value)}
          />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" type="submit">
            <Sparkles size={18} />
            Gerar proposta
          </button>
          {aiSource ? (
            <p className="text-xs font-bold text-slate-500">
              Proposta organizada pelo assistente do FechaPro.
            </p>
          ) : null}
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Metric label="Clientes" value={String(clients.length)} />
        <Metric label="Propostas" value={String(proposals.length)} />
        <Metric label="Taxa de aceite" value={`${acceptanceRate}%`} />
        <Metric label="Valor em aberto" value={money.format(openValue)} />
      </section>

      {billing ? (
        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Plano atual" title={`${billing.subscription.plan.toUpperCase()} em uso`} />
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-black text-green-700">
              {`${billing.usage.proposalsThisMonth}/${billing.usage.proposalLimit} propostas este mes`}
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
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <FunnelStep label="Enviadas" value={sent} tone="bg-amber-500" />
            <FunnelStep label="Visualizadas" value={viewed} tone="bg-sky-600" />
            <FunnelStep label="Aceitas" value={accepted} tone="bg-green-700" />
            <FunnelStep label="Recusadas" value={declined} tone="bg-rose-700" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MiniStat label="Valor aceito" value={money.format(acceptedValue)} />
          <MiniStat label="Visualizacoes" value={String(totalViews)} />
          <MiniStat label="Vencidas" value={String(expired)} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <form
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
                defaultValue=""
                onChange={(event) => {
                  const template = proposalTemplates.find((item) => item.id === event.target.value);
                  if (!template) return;
                  onDraftChange("serviceName", template.serviceName);
                  onDraftChange("price", template.price);
                  onDraftChange("deadline", template.deadline);
                  onDraftChange("payment", template.payment);
                  onDraftChange("included", template.included);
                  onDraftChange("notes", template.notes);
                  event.target.value = "";
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
              options={clients.map((client) => client.name)}
              onChange={(value) => {
                onDraftChange("clientName", value);
                const client = clients.find((c) => c.name === value);
                if (client?.email) onDraftChange("clientEmail", client.email);
              }}
            />
            <SelectField
              label="Servico"
              value={draft.serviceName}
              placeholder="Selecione ou digite"
              options={services.map((service) => service.name)}
              onChange={chooseService}
            />
            <TextField label="Valor" placeholder="1200" type="number" value={draft.price || ""} onChange={(value) => onDraftChange("price", Number(value || 0))} />
            <TextField label="Prazo" placeholder="7 dias uteis" value={draft.deadline} onChange={(value) => onDraftChange("deadline", value)} />
            <TextField label="Validade" type="date" value={draft.validUntil} onChange={(value) => onDraftChange("validUntil", value)} />
            <TextField label="Pagamento" placeholder="50% entrada e 50% entrega" value={draft.payment} onChange={(value) => onDraftChange("payment", value)} />
          </div>

          <TextField
            label="E-mail do cliente (envio automatico)"
            placeholder="cliente@email.com"
            type="email"
            value={draft.clientEmail ?? ""}
            onChange={(value) => onDraftChange("clientEmail", value)}
          />

          <TextAreaField
            label="Itens inclusos"
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
            label="Observacoes"
            placeholder="A proposta inclui ate 2 rodadas de ajustes."
            rows={3}
            value={draft.notes}
            onChange={(value) => onDraftChange("notes", value)}
          />

          <div className="flex flex-wrap gap-3">
            <button className="min-h-11 flex-1 rounded-lg bg-green-600 px-4 font-black text-white" type="submit">
              Salvar proposta
            </button>
            <button className="min-h-11 flex-1 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={onSeed}>
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
              <PreviewItem label="Servico" value={draft.serviceName || "Preencha os dados"} />
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
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) || null;
  const acceptedValue = proposals
    .filter((proposal) => proposal.status === "accepted")
    .reduce((sum, proposal) => sum + proposal.price, 0);
  const sent = proposals.filter((proposal) => proposal.status === "sent").length;
  const viewed = proposals.filter((proposal) => proposal.status === "viewed").length;
  const accepted = proposals.filter((proposal) => proposal.status === "accepted").length;
  const declined = proposals.filter((proposal) => proposal.status === "declined").length;

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
          Aqui ficam os links que voce envia para o cliente. Abra a proposta publica, copie o link, baixe PDF, duplique ou acompanhe o status.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        <Metric label="Total" value={String(proposals.length)} />
        <Metric label="Enviadas" value={String(sent)} />
        <Metric label="Visualizadas" value={String(viewed)} />
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

      <div className="grid gap-3 lg:grid-cols-2">
        {proposals.length ? (
          proposals.map((proposal) => (
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
  const [includes, setIncludes] = useState("Briefing inicial\nExecucao do servico\nAjustes combinados\nEntrega final");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const presets = [
    { name: "Identidade visual", price: 1200, deadline: "7 dias uteis" },
    { name: "Gestao de redes sociais", price: 1500, deadline: "30 dias" },
    { name: "Ensaio fotografico", price: 850, deadline: "10 dias uteis" },
  ];

  async function finishOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!businessName.trim() || !whatsapp.trim() || !serviceName.trim() || !price || !deadline.trim()) {
      setError("Preencha marca, WhatsApp, servico, valor e prazo para concluir.");
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
      setError(caught instanceof Error ? caught.message : "Nao foi possivel concluir a configuracao.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid content-center gap-4">
        <p className="text-xs font-black uppercase text-blue-700">Primeiros passos</p>
        <h2 className="max-w-[11ch] text-4xl font-black leading-none sm:text-6xl">
          Configure o basico para vender melhor.
        </h2>
        <p className="max-w-xl leading-7 text-slate-600">
          Em menos de um minuto voce deixa sua marca pronta, cria o primeiro servico e ja cai no painel com a primeira proposta quase montada.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <MiniStat label="Passo 1" value="Marca" />
          <MiniStat label="Passo 2" value="Contato" />
          <MiniStat label="Passo 3" value="Servico" />
        </div>
      </div>

      <form className="grid gap-4 rounded-lg border border-black/10 bg-slate-50 p-4" onSubmit={finishOnboarding}>
        {error ? (
          <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">
            {error}
          </div>
        ) : null}
        <TextField label="Nome comercial" value={businessName} onChange={setBusinessName} />
        <TextField label="WhatsApp" placeholder="5511999999999" value={whatsapp} onChange={setWhatsapp} />
        <div className="grid gap-2">
          <span className="text-sm font-extrabold text-slate-600">Modelos rapidos</span>
          <div className="grid gap-2 sm:grid-cols-3">
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
        <TextField label="Primeiro servico" placeholder="Ex: Identidade visual" value={serviceName} onChange={setServiceName} />
        <TextField label="Valor base" type="number" value={price || ""} onChange={(value) => setPrice(Number(value || 0))} />
        <TextField label="Prazo padrao" placeholder="Ex: 7 dias uteis" value={deadline} onChange={setDeadline} />
        <TextAreaField label="Itens inclusos" rows={4} value={includes} onChange={setIncludes} />
        <button className="min-h-12 rounded-lg bg-green-600 px-4 font-black text-white" type="submit">
          {saving ? "Salvando..." : "Concluir configuracao"}
        </button>
      </form>
    </section>
  );
}

function ClientsView({ clients, onChange }: { clients: Client[]; onChange: (items: Client[]) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", segment: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function saveClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      const item = await apiPatch<Client>(`/api/clients/${editingId}`, form);
      onChange(clients.map((client) => (client.id === editingId ? item : client)));
      setEditingId(null);
    } else {
      const item = await apiPost<Client>("/api/clients", form);
      onChange([item, ...clients]);
    }
    setForm({ name: "", email: "", phone: "", segment: "" });
  }

  async function removeClient(id: string) {
    await apiDelete(`/api/clients/${id}`);
    onChange(clients.filter((item) => item.id !== id));
  }

  return (
    <CrudShell
      eyebrow="Cadastro"
      title="Clientes"
      description="Cadastre os clientes que vao receber propostas."
      form={
        <form
          className="grid gap-3"
          onSubmit={saveClient}
        >
          <TextField label="Nome" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextField label="E-mail" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <TextField label="Telefone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <TextField label="Segmento" placeholder="Moda, estetica, arquitetura..." value={form.segment} onChange={(value) => setForm({ ...form, segment: value })} />
          <SubmitButton label={editingId ? "Atualizar cliente" : "Salvar cliente"} />
          {editingId ? (
            <button
              className="min-h-11 rounded-lg border border-black/10 px-4 font-black"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ name: "", email: "", phone: "", segment: "" });
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
          subtitle={[client.email, client.phone, client.segment].filter(Boolean).join(" | ")}
          onEdit={() => {
            setEditingId(client.id);
            setForm({
              name: client.name,
              email: client.email || "",
              phone: client.phone || "",
              segment: client.segment || "",
            });
          }}
          onRemove={() => removeClient(client.id)}
        />
      ))}
    </CrudShell>
  );
}

function ServicesView({ services, onChange }: { services: ServiceItem[]; onChange: (items: ServiceItem[]) => void }) {
  const [form, setForm] = useState({ name: "", price: 0, deadline: "", includes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function saveService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      price: form.price,
      deadline: form.deadline,
      includes: form.includes
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean),
    };

    if (editingId) {
      const item = await apiPatch<ServiceItem>(`/api/services/${editingId}`, payload);
      onChange(services.map((service) => (service.id === editingId ? item : service)));
      setEditingId(null);
    } else {
      const item = await apiPost<ServiceItem>("/api/services", payload);
      onChange([item, ...services]);
    }
    setForm({ name: "", price: 0, deadline: "", includes: "" });
  }

  async function removeService(id: string) {
    await apiDelete(`/api/services/${id}`);
    onChange(services.filter((item) => item.id !== id));
  }

  return (
    <CrudShell
      eyebrow="Cadastro"
      title="Servicos e precos"
      description="Monte uma biblioteca para preencher propostas mais rapido."
      form={
        <form
          className="grid gap-3"
          onSubmit={saveService}
        >
          <TextField label="Servico" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <TextField label="Valor base" type="number" value={form.price || ""} onChange={(value) => setForm({ ...form, price: Number(value || 0) })} />
          <TextField label="Prazo padrao" value={form.deadline} onChange={(value) => setForm({ ...form, deadline: value })} />
          <TextAreaField label="Itens inclusos" value={form.includes} onChange={(value) => setForm({ ...form, includes: value })} />
          <SubmitButton label={editingId ? "Atualizar servico" : "Salvar servico"} />
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

  async function savePortfolioItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return;

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
          throw new Error("Falha ao enviar imagem.");
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
        throw new Error("Falha ao salvar portfolio.");
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
          <TextField label="Titulo" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <TextField label="Categoria" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
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
          <TextField label="URL da imagem" placeholder="Opcional: https://..." value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
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

  async function saveTestimonial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.authorName.trim() || !form.quote.trim()) return;
    if (editingId) {
      const item = await apiPatch<Testimonial>(`/api/testimonials/${editingId}`, form);
      onChange(testimonials.map((entry) => (entry.id === editingId ? item : entry)));
      setEditingId(null);
    } else {
      const item = await apiPost<Testimonial>("/api/testimonials", form);
      onChange([item, ...testimonials]);
    }
    setForm({ authorName: "", company: "", quote: "" });
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
          <TextField label="Nome do cliente" value={form.authorName} onChange={(value) => setForm({ ...form, authorName: value })} />
          <TextField label="Empresa" value={form.company} onChange={(value) => setForm({ ...form, company: value })} />
          <TextAreaField label="Depoimento" rows={4} value={form.quote} onChange={(value) => setForm({ ...form, quote: value })} />
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

function TemplatesView({ onUseTemplate }: { onUseTemplate: (template: ProposalTemplate) => void }) {
  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <p className="text-xs font-black uppercase text-blue-700">Templates</p>
        <h2 className="text-2xl font-black">Modelos prontos por nicho</h2>
        <p className="mt-2 max-w-2xl leading-7 text-slate-600">
          Use um modelo como ponto de partida. Ele preenche servico, valor, prazo, pagamento, itens inclusos e observacoes.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {proposalTemplates.map((template) => (
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
    </section>
  );
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
  const [asaasStatus, setAsaasStatus] = useState<AsaasStatus | null>(null);
  const [checkingAsaas, setCheckingAsaas] = useState(false);
  const [payingPlan, setPayingPlan] = useState<PlanCode | null>(null);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    refreshAsaasStatus();
  }, []);

  async function refreshAsaasStatus() {
    setCheckingAsaas(true);
    try {
      setAsaasStatus(await apiGet<AsaasStatus>("/api/billing/asaas/status"));
    } catch {
      setAsaasStatus(null);
    } finally {
      setCheckingAsaas(false);
    }
  }

  function payPlan(plan: PlanCode) {
    setPaymentError("");
    setPayingPlan(plan);
    window.location.href = `/checkout/plano/${plan}`;
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
          Escolha um plano e pague online em ambiente seguro. Quando o Asaas confirmar, o plano e ativado automaticamente.
        </p>
        {paymentError ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{paymentError}</p>
        ) : null}
        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-black text-slate-700">
          Uso atual: {billing.usage.proposalsThisMonth}
          {`/${billing.usage.proposalLimit} propostas este mes`}
        </div>
      </div>

      <FinancialSetupCard
        checking={checkingAsaas}
        status={asaasStatus}
        onRefresh={refreshAsaasStatus}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {billing.plans.map((plan) => {
          const active = billing.subscription.plan === plan.code;
          const recommended = plan.code === "premium";
          return (
            <article
              className={`relative grid gap-4 rounded-lg border p-4 shadow-xl shadow-slate-900/10 ${
                active ? "border-green-600 bg-green-50" : "border-black/10 bg-white"
              }`}
              key={plan.code}
            >
              {recommended ? (
                <span className="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-black uppercase text-white">
                  Mais vendido
                </span>
              ) : null}
              <div>
                <span className="text-xs font-black uppercase text-blue-700">{active ? "Plano atual" : "Plano"}</span>
                <h3 className="mt-1 text-2xl font-black">{plan.name}</h3>
                <p className="mt-1 text-lg font-black text-green-700">{plan.price}</p>
                {plan.maintenancePrice ? (
                  <p className="mt-1 text-sm font-black text-slate-500">{plan.maintenancePrice}</p>
                ) : null}
              </div>
              <p className="text-sm font-bold text-slate-500">
                {`Ate ${plan.proposalLimit} propostas por mes`}
              </p>
              <div className="rounded-lg border border-black/10 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                <span className="block font-black uppercase text-slate-500">Modulos liberados</span>
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
    </section>
  );
}

function FinancialSetupCard({
  checking,
  onRefresh,
  status,
}: {
  checking: boolean;
  onRefresh: () => void;
  status: AsaasStatus | null;
}) {
  const ready = Boolean(status?.hasApiKey && status.hasWebhookToken && status.connection.ok);
  const webhookReady = Boolean(status?.hasWebhookToken);

  return (
    <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-black uppercase text-blue-700">Financeiro</p>
        <h2 className="mt-1 text-2xl font-black">Configuracao do Asaas</h2>
        <p className="mt-2 leading-7 text-slate-600">
          Valide se a cobranca online esta pronta antes de vender planos ou receber pagamentos das propostas.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill label={ready ? "Asaas conectado" : "Ajuste pendente"} tone={ready ? "success" : "warning"} />
          <StatusPill label={status?.sandbox ? "Sandbox" : "Producao"} tone={status?.sandbox ? "warning" : "success"} />
          <StatusPill label={webhookReady ? "Webhook token ok" : "Webhook sem token"} tone={webhookReady ? "success" : "danger"} />
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailLine label="Chave API" value={status?.hasApiKey ? "Configurada" : "Nao configurada"} />
          <DetailLine label="Conexao" value={status ? (status.connection.ok ? `Ok (${status.connection.status})` : status.connection.error || "Falhou") : "Verificando"} />
          <DetailLine label="Ambiente" value={status?.sandbox ? "Sandbox" : "Producao"} />
          <DetailLine label="API" value={status?.apiHost || "Aguardando"} />
        </div>
        <div>
          <p className="text-xs font-black uppercase text-slate-500">Webhook para cadastrar no Asaas</p>
          <code className="mt-2 block overflow-x-auto rounded-lg border border-black/10 bg-white p-3 text-sm font-bold text-slate-700">
            {status?.webhookUrl || "Carregando URL..."}
          </code>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            No Asaas, envie eventos de cobranca como PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE e PAYMENT_DELETED para esta URL.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/10 px-4 font-black"
          type="button"
          onClick={onRefresh}
        >
          <RotateCcw size={16} />
          {checking ? "Verificando..." : "Testar conexão"}
        </button>
      </div>
    </section>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "danger" | "success" | "warning" }) {
  const classes = {
    danger: "border-rose-700/20 bg-rose-50 text-rose-800",
    success: "border-green-700/20 bg-green-50 text-green-800",
    warning: "border-amber-700/20 bg-amber-50 text-amber-900",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${classes[tone]}`}>
      {label}
    </span>
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
      setError(caught instanceof Error ? caught.message : "Nao foi possivel atualizar sua conta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <form className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10" onSubmit={saveAccount}>
        <SectionHeading eyebrow="Minha conta" title="Dados de acesso" />

        {message ? <div className="rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-900">{message}</div> : null}
        {error ? <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">{error}</div> : null}

        <TextField label="Nome" value={name} onChange={setName} />
        <TextField label="E-mail" type="email" value={email} onChange={setEmail} />
        <TextField label="Senha atual" type="password" value={currentPassword} onChange={setCurrentPassword} />
        <TextField label="Nova senha" type="password" value={newPassword} onChange={setNewPassword} />

        <button className="min-h-11 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60" disabled={saving} type="submit">
          {saving ? "Salvando..." : "Salvar conta"}
        </button>
      </form>

      <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
        <p className="text-xs font-black uppercase text-blue-700">Seguranca</p>
        <h3 className="mt-1 text-xl font-black">Antes de publicar</h3>
        <ul className="mt-3 grid gap-3 text-sm font-bold leading-6 text-slate-600">
          <li>Use uma senha forte e troque o AUTH_SECRET em producao.</li>
          <li>Ative Turnstile no cadastro para reduzir abuso.</li>
          <li>Configure Resend para recuperar senha por e-mail.</li>
          <li>Use storage S3/R2 para imagens em producao.</li>
        </ul>
      </aside>
    </section>
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

  useEffect(() => {
    if (brand) setForm(brand);
  }, [brand]);

  async function saveBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:sticky lg:top-32">
        <div>
          <p className="text-xs font-black uppercase text-blue-700">Configuracao</p>
          <h2 className="text-2xl font-black">Marca profissional</h2>
          <p className="mt-2 leading-7 text-slate-600">
            Esses dados aparecem na proposta publica, no PDF e no contato por WhatsApp.
          </p>
        </div>

        <form className="grid gap-3" onSubmit={saveBrand}>
          <TextField label="Nome comercial" value={form.businessName} onChange={(value) => setForm({ ...form, businessName: value })} />
          <label className="grid gap-2 text-sm font-extrabold text-slate-600">
            Logo
            <input
              accept="image/*"
              className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <span className="text-xs font-bold text-slate-500">
              O FechaPro remove automaticamente fundo branco ou claro do logo.
            </span>
          </label>
          <TextField label="URL do logo" placeholder="Opcional: https://..." value={form.logoUrl || ""} onChange={(value) => setForm({ ...form, logoUrl: value })} />
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
          <TextField label="WhatsApp" placeholder="5511999999999" value={form.whatsapp || ""} onChange={(value) => setForm({ ...form, whatsapp: value })} />
          <TextField label="Instagram" placeholder="@seuperfil" value={form.instagram || ""} onChange={(value) => setForm({ ...form, instagram: value })} />
          <TextField label="E-mail comercial" type="email" value={form.email || ""} onChange={(value) => setForm({ ...form, email: value })} />
          <TextField label="Site" placeholder="https://..." value={form.website || ""} onChange={(value) => setForm({ ...form, website: value })} />
          <TextAreaField label="Bio curta" rows={3} value={form.bio || ""} onChange={(value) => setForm({ ...form, bio: value })} />
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
            <span>WhatsApp: {form.whatsapp || "Nao informado"}</span>
            <span>Instagram: {form.instagram || "Nao informado"}</span>
            <span>E-mail: {form.email || "Nao informado"}</span>
            <span>Site: {form.website || "Nao informado"}</span>
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
  const plans = [
    { name: "Start", price: "R$ 49", detail: "Para nunca mais mandar preço solto.", items: ["20 propostas por mês", "Link profissional", "PDF automático"] },
    { name: "Essencial", price: "R$ 97", detail: "Para vender com marca e parecer mais premium.", items: ["50 propostas por mês", "Serviços cadastrados", "Identidade básica"] },
    { name: "Profissional", price: "R$ 147", detail: "Para defender valor com portfólio e prova social.", items: ["120 propostas por mês", "Portfólio no FechaPro", "Depoimentos na proposta"] },
    { name: "Pro Site", price: "R$ 497", detail: "Primeiro mês. Depois R$ 197/mês manutenção.", items: ["300 propostas por mês", "Site one page", "Proposta + presença online"] },
    { name: "Premium Site", price: "R$ 997", detail: "Primeiro mês. Depois R$ 297/mês manutenção.", items: ["600 propostas por mês", "Site completo simples", "Copy, cadastro inicial e treinamento"] },
  ];
  const faqs = [
    {
      question: "O FechaPro substitui meu PDF manual de proposta comercial?",
      answer: "Sim. Você cria a proposta no painel, envia um link profissional e o cliente também pode baixar o PDF. A diferença é que a proposta online também mostra portfólio, depoimentos, aceite e status.",
    },
    {
      question: "Isso ajuda mesmo a fechar mais?",
      answer: "Ajuda a remover atritos que costumam derrubar fechamento: proposta confusa, pouca prova, preço sem contexto, falta de próximo passo e follow-up no escuro.",
    },
    {
      question: "Serve para prestador de serviço local?",
      answer: "Serve. O foco é qualquer profissional que precisa vender serviço com escopo, valor, prazo, portfólio e aceite de forma organizada.",
    },
    {
      question: "Consigo usar pelo celular?",
      answer: "Sim. A proposta é enviada por link, abre no navegador e funciona bem para clientes que recebem tudo pelo WhatsApp.",
    },
    {
      question: "Preciso configurar pagamento agora?",
      answer: "Não. O FechaPro já organiza proposta, aceite, portfólio e PDF. A cobrança pode ser ativada com Asaas quando você quiser vender com pagamento online.",
    },
    {
      question: "Para quais serviços a proposta online funciona melhor?",
      answer: "Funciona muito bem para design, social media, fotografia, arquitetura, consultoria, serviços técnicos, estética, eventos e qualquer venda que precise explicar valor antes do preço.",
    },
  ];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br";
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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", window.location.pathname);
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <img className="absolute inset-0 -z-20 h-full w-full object-cover" src="/landing/hero-proposta.png" alt="Tela de proposta comercial online criada no FechaPro" />
        <div className="absolute inset-0 -z-10 bg-slate-950/74" />
        <div className="mx-auto flex min-h-[92vh] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-3">
            <a className="inline-flex items-center gap-2 font-black" href="#">
              <span className="grid h-12 w-40 place-items-center rounded-lg bg-white/95 px-3">
                <img alt="FechaPro" className="h-9 w-full object-contain" src="/brand/logofechapro.png" />
              </span>
            </a>
            <nav className="hidden items-center gap-6 text-sm font-bold text-white/80 md:flex">
              <button className="font-bold" type="button" onClick={() => goToSection("como-funciona")}>
                Como funciona
              </button>
              <button className="font-bold" type="button" onClick={() => goToSection("recursos")}>
                Recursos
              </button>
              <button className="font-bold" type="button" onClick={() => goToSection("planos")}>
                Planos
              </button>
              <a href="/interesse">
                Tenho interesse
              </a>
              <a href="/cadastro">
                Começar
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <a className="hidden min-h-10 items-center justify-center rounded-lg bg-green-500 px-4 text-sm font-black text-slate-950 sm:inline-flex" href="/cadastro">
                Criar conta grátis
              </a>
              <a className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/25 px-4 text-sm font-black text-white" href="/login">
                Entrar
              </a>
            </div>
          </header>

          <div className="grid flex-1 content-end gap-8 pb-8 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-lg bg-white/12 px-3 py-2 text-xs font-black uppercase tracking-normal text-green-100">
                Para prestadores que querem parar de perder venda por apresentação fraca
              </p>
              <h1 className="mt-5 text-5xl font-black leading-none sm:text-6xl lg:text-7xl">
                Seu orçamento pode estar matando vendas que sua proposta deveria fechar.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
                O FechaPro transforma preço, prazo e escopo em uma proposta comercial online que defende seu valor, mostra provas, gera PDF e leva o cliente para o aceite. Para quem quer vender serviço como profissional, não como pedido de orçamento.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-500 px-5 font-black text-slate-950" href="/cadastro">
                  <Sparkles size={18} />
                  Quero melhorar meus fechamentos
                </a>
                <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 font-black text-white" type="button" onClick={() => goToSection("planos")}>
                  Ver planos
                </button>
                <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 font-black text-white" href="/interesse">
                  Tenho interesse
                </a>
              </div>
              <p className="mt-4 text-sm font-bold text-white/70">
                Se você vende pelo WhatsApp, Instagram, indicação ou reunião online, sua proposta precisa vender antes do cliente pedir desconto.
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="grid grid-cols-3 gap-2">
                {salesProof.map((metric) => (
                  <LandingMetric key={metric.value} value={metric.value} label={metric.label} />
                ))}
              </div>
              <div className="rounded-lg bg-white p-4 text-slate-950">
                <p className="text-xs font-black uppercase text-blue-700">De orçamento comum para proposta premium</p>
                <h2 className="mt-1 text-xl font-black">Identidade visual para Maria Eduarda</h2>
                <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
                  <span>Investimento: R$ 1.200</span>
                  <span>Prazo: 7 dias úteis</span>
                  <span>Inclui: logo, paleta, tipografia e modelos de posts</span>
                  <span>Prova: portfólio e depoimentos antes do aceite</span>
                </div>
                <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-green-600 font-black text-white" type="button">
                  Aceitar proposta
                </button>
              </div>
              <div className="rounded-lg border border-white/15 bg-slate-950/60 p-4">
                <p className="text-xs font-black uppercase text-green-200">O efeito que você quer causar</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/80">
                  "Agora entendi por que custa isso. Faz sentido. Como eu aprovo?"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {benefits.map((benefit) => (
            <article className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5" key={benefit.title}>
              <benefit.icon className="text-green-700" size={24} />
              <h2 className="mt-4 text-xl font-black">{benefit.title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-rose-700">Onde a venda escapa</p>
            <h2 className="mt-2 text-4xl font-black leading-tight">Talvez seu serviço seja bom. O problema é como ele chega na mão do cliente.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Quando a proposta parece improvisada, o cliente compara por preço. Quando ela explica valor, mostra prova e facilita o aceite, a conversa muda.
            </p>
          </div>
          <div className="grid gap-3">
            {dealLeaks.map((item) => (
              <article className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-rose-700/15 bg-rose-50 p-5" key={item}>
                <span className="grid size-9 place-items-center rounded-lg bg-rose-700 font-black text-white">!</span>
                <p className="self-center font-black leading-7 text-rose-950">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white" id="recursos">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-green-300">Por que aumenta o desejo</p>
            <h2 className="mt-2 text-4xl font-black leading-tight">Sua proposta passa a vender antes da reunião de follow-up.</h2>
            <p className="mt-4 leading-7 text-white/70">
              O cliente entende o que está comprando, percebe profissionalismo, vê motivos para confiar e encontra um caminho claro para aprovar.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: FileText, title: "Valor explicado", text: "Escopo, entregáveis, validade, prazo e pagamento organizados para reduzir dúvida e desconto." },
              { icon: ImageIcon, title: "Prova antes da decisão", text: "Portfólio e depoimentos entram no momento exato em que o cliente avalia se vale pagar." },
              { icon: Eye, title: "Follow-up com contexto", text: "Você sabe se a proposta foi visualizada e acompanha o status sem depender de achismo." },
              { icon: CreditCard, title: "Aceite sem fricção", text: "O cliente tem um caminho simples para aprovar, salvar o PDF e seguir para o pagamento." },
            ].map((feature) => (
              <article className="rounded-lg border border-white/15 bg-white/8 p-5" key={feature.title}>
                <feature.icon className="text-green-300" size={24} />
                <h3 className="mt-4 text-xl font-black">{feature.title}</h3>
                <p className="mt-2 leading-7 text-white/70">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-100" id="como-funciona">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Fluxo de venda</p>
            <h2 className="mt-2 text-4xl font-black leading-tight">Monte uma proposta que conduz o cliente até o sim.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              O FechaPro organiza sua venda em uma sequência simples: contexto, valor, prova, condição e aceite.
            </p>
          </div>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <article className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-black/10 bg-white p-5" key={step}>
                <span className="grid size-10 place-items-center rounded-lg bg-slate-950 font-black text-white">{index + 1}</span>
                <p className="self-center text-lg font-black leading-7">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Para quem vende serviço</p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black leading-tight">Feito para quem vende algo que não deveria ser julgado só pelo preço.</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {niches.map((niche) => (
                <span className="rounded-lg border border-black/10 bg-slate-50 px-4 py-3 text-sm font-black" key={niche}>
                  {niche}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-black/10 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase text-blue-700">O que a proposta precisa provar</p>
            <h3 className="mt-2 text-2xl font-black">O cliente não compra só entrega. Ele compra confiança para escolher você.</h3>
            <ul className="mt-5 grid gap-3">
              {objections.map((item) => (
                <li className="flex gap-3 font-bold leading-7 text-slate-700" key={item}>
                  <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white" id="planos">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase text-green-300">Preço que valida negócio</p>
            <h2 className="mt-2 text-4xl font-black leading-tight">Quanto vale parar de perder venda por uma proposta fraca?</h2>
            <p className="mt-4 leading-7 text-white/70">
              Comece com links profissionais e evolua para site quando quiser transformar sua proposta em uma máquina de captação e fechamento.
            </p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {plans.map((plan) => (
              <article className={`relative rounded-lg border p-5 ${plan.name === "Pro Site" ? "border-green-400 bg-white text-slate-950" : "border-white/15 bg-white/8"}`} key={plan.name}>
                {plan.name === "Pro Site" ? (
                  <span className="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-xs font-black uppercase text-white">
                    Mais vendido
                  </span>
                ) : null}
                <p className="text-sm font-black uppercase text-blue-400">{plan.name}</p>
                <strong className="mt-3 block text-4xl font-black">{plan.price}</strong>
                <span className={plan.name === "Pro Site" ? "mt-1 block text-slate-600" : "mt-1 block text-white/65"}>/mês</span>
                <p className={plan.name === "Pro Site" ? "mt-4 leading-7 text-slate-600" : "mt-4 leading-7 text-white/70"}>{plan.detail}</p>
                <ul className="mt-5 grid gap-3">
                  {plan.items.map((item) => (
                    <li className="flex items-center gap-2 font-bold" key={item}>
                      <CheckCircle2 className="shrink-0 text-green-500" size={18} />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  className={`mt-6 grid min-h-11 place-items-center rounded-lg px-4 text-center font-black ${
                    plan.name === "Pro Site" ? "bg-green-600 text-white" : "bg-white text-slate-950"
                  }`}
                  href="/cadastro"
                >
                  Começar agora
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Dúvidas comuns</p>
            <h2 className="mt-2 text-4xl font-black leading-tight">Antes de mandar mais um orçamento simples, tire suas dúvidas.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              O FechaPro foi pensado para tirar sua venda do improviso e colocar sua oferta em uma apresentação clara, rastreável e fácil de aceitar.
            </p>
          </div>
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <details className="rounded-lg border border-black/10 bg-slate-50 p-4" key={faq.question}>
                <summary className="cursor-pointer font-black">{faq.question}</summary>
                <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-green-600 text-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-black uppercase text-green-100">Pronto para subir o nível</p>
            <h2 className="mt-2 text-4xl font-black leading-tight">Sua próxima proposta pode parecer mais cara, mais clara e mais fácil de aprovar.</h2>
          </div>
          <a className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-6 font-black text-white" href="/cadastro">
            Melhorar meus fechamentos
          </a>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 p-3 shadow-xl shadow-slate-900/20 backdrop-blur sm:hidden">
        <a className="grid min-h-12 w-full place-items-center rounded-lg bg-green-600 px-4 text-center font-black text-white" href="/cadastro">
          Criar proposta grátis
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
              {isLast ? "Concluir" : "Proximo passo"}
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
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string | number;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <input
        className="min-h-11 rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
        placeholder={placeholder}
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
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
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
  onChange,
  placeholder,
  rows = 5,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <textarea
        className="rounded-lg border border-black/10 bg-slate-50 p-3 text-slate-900 outline-green-700"
        placeholder={placeholder}
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
    { id: "2", title: "Social", category: "Conteudo", imageUrl: "" },
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
          <MiniStat label="Visualizacoes" value={String(proposal.viewCount || 0)} />
          <MiniStat label="Validade" value={formatDateOnly(proposal.validUntil)} />
        </div>

        <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailLine label="Cliente" value={proposal.clientName} />
            <DetailLine label="E-mail" value={proposal.clientEmail || "Nao informado"} />
            <DetailLine label="Prazo" value={proposal.deadline || "A combinar"} />
            <DetailLine label="Pagamento" value={proposal.payment || "A combinar"} />
          </div>
          <DetailLine label="Inclui" value={proposal.included.length ? proposal.included.join(", ") : "Itens ainda nao informados"} />
          <DetailLine label="Observacoes" value={proposal.notes || "Sem observacoes"} />
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
          <p className="text-xs font-black uppercase text-blue-700">Acoes rapidas</p>
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
  const service = prompt.split(",")[0]?.trim() || "Servico personalizado";

  return {
    clientName: "",
    serviceName: service.charAt(0).toUpperCase() + service.slice(1),
    price: valueMatch ? Number(valueMatch[1].replace(/\./g, "").replace(",", ".")) : 0,
    deadline: deadlineMatch ? deadlineMatch[1].trim() : "",
    validUntil: nextWeekDate(),
    payment: prompt.toLowerCase().includes("50") ? "50% na entrada e 50% na entrega" : "A combinar",
    included: ["Diagnostico inicial", "Execucao do servico principal", "Ajustes combinados em proposta", "Entrega final organizada"],
    notes: "Proposta valida ate a data informada. Alteracoes de escopo podem gerar novo orcamento.",
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

function formatDateOnly(value?: string | null) {
  if (!value) return "Nao informado";
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

function proposalStatusLabel(status: ProposalStatus) {
  const labels: Record<ProposalStatus, string> = {
    sent: "Enviada",
    viewed: "Visualizada",
    accepted: "Aceita",
    declined: "Recusada",
    expired: "Expirada",
  };
  return labels[status] || status;
}

function proposalTimeline(proposal: Proposal) {
  const viewed = Number(proposal.viewCount || 0) > 0 || ["viewed", "accepted", "declined"].includes(proposal.status);
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
      description: proposal.publicSlug ? `/p/${proposal.publicSlug}` : "Link publico ainda nao gerado.",
      done: Boolean(proposal.publicSlug),
    },
    {
      title: "Cliente visualizou",
      description: viewed ? `${proposal.viewCount || 1} visualizacao(oes) registrada(s).` : "Aguardando a primeira visualizacao.",
      done: viewed,
    },
    {
      title: "Decisao do cliente",
      description:
        proposal.status === "accepted"
          ? `Aceita por ${proposal.acceptedBy || proposal.clientName}${proposal.acceptedAt ? ` em ${formatDateTime(proposal.acceptedAt)}` : ""}.`
          : proposal.status === "declined"
            ? `Recusada${proposal.declinedReason ? `: ${proposal.declinedReason}` : "."}`
            : expired
              ? `Expirada em ${formatDateOnly(proposal.validUntil)}.`
              : "Ainda aguardando aceite ou recusa.",
      done: ["accepted", "declined", "expired"].includes(proposal.status),
    },
    {
      title: "Pagamento",
      description: paid
        ? `Pagamento confirmado${proposal.paymentPaidAt ? ` em ${formatDateTime(proposal.paymentPaidAt)}` : ""}.`
        : "Pagamento ainda nao confirmado.",
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

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEMO_SERVICE_IMAGE_URL = "/landing/hero-proposta.png";

function demoSlug(label: string) {
  return `demo-${label}-${randomBytes(6).toString("base64url")}`;
}

type DemoProposal = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  price: number;
  deadline: string;
  payment: string;
  included: string[];
  notes: string;
  status: "sent" | "viewed" | "accepted" | "declined" | "expired";
  viewCount: number;
  nicheLabel: string;
  acceptedBy?: string;
  acceptedEmail?: string;
  acceptedAt?: Date;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentPaidAt?: Date;
  declinedReason?: string;
  declinedAt?: Date;
};

type DemoPortfolioItem = {
  nicheLabel: string;
  title: string;
  category: string;
  imageUrl: string;
};

const demoPortfolioItems: DemoPortfolioItem[] = [
  {
    nicheLabel: "social-media",
    title: "[Demo] Calendario de conteudo para Instagram",
    category: "Demo:social-media",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "social-media",
    title: "[Demo] Criativos de campanha digital",
    category: "Demo:social-media",
    imageUrl: "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "design",
    title: "[Demo] Sistema de identidade visual aplicado",
    category: "Demo:design",
    imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "fotografia",
    title: "[Demo] Ensaio profissional em estudio",
    category: "Demo:fotografia",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "fotografia",
    title: "[Demo] Galeria de ensaio externo",
    category: "Demo:fotografia",
    imageUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "fotografia",
    title: "[Demo] Direcao de poses para retratos",
    category: "Demo:fotografia",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "tecnologia",
    title: "[Demo] Site responsivo publicado",
    category: "Demo:tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "marketing-digital",
    title: "[Demo] Painel de performance de anuncios",
    category: "Demo:marketing-digital",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "arquitetura",
    title: "[Demo] Projeto de interiores em ambiente residencial",
    category: "Demo:arquitetura",
    imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "arquitetura",
    title: "[Demo] Moodboard e especificacao de acabamentos",
    category: "Demo:arquitetura",
    imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "arquitetura",
    title: "[Demo] Sala integrada com marcenaria planejada",
    category: "Demo:arquitetura",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "advocacia",
    title: "[Demo] Atendimento juridico consultivo",
    category: "Demo:advocacia",
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "contabilidade",
    title: "[Demo] Organizacao fiscal e empresarial",
    category: "Demo:contabilidade",
    imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "psicologia",
    title: "[Demo] Ambiente acolhedor de atendimento",
    category: "Demo:psicologia",
    imageUrl: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "beleza",
    title: "[Demo] Resultado de beleza e cuidado pessoal",
    category: "Demo:beleza",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "beleza",
    title: "[Demo] Sala de estetica preparada",
    category: "Demo:beleza",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "beleza",
    title: "[Demo] Procedimento facial personalizado",
    category: "Demo:beleza",
    imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "casa-reforma",
    title: "[Demo] Reforma residencial finalizada",
    category: "Demo:casa-reforma",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "saude-fitness",
    title: "[Demo] Treino personalizado acompanhado",
    category: "Demo:saude-fitness",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "pet",
    title: "[Demo] Cuidado pet profissional",
    category: "Demo:pet",
    imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "eventos",
    title: "[Demo] Evento organizado com cerimonial",
    category: "Demo:eventos",
    imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "gastronomia",
    title: "[Demo] Marmitas semanais preparadas",
    category: "Demo:gastronomia",
    imageUrl: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "mecanica",
    title: "[Demo] Oficina mecanica em atendimento",
    category: "Demo:mecanica",
    imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "auto-eletrica",
    title: "[Demo] Diagnostico eletrico automotivo",
    category: "Demo:auto-eletrica",
    imageUrl: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "som-evento",
    title: "[Demo] Estrutura de som para evento",
    category: "Demo:som-evento",
    imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "eletricista",
    title: "[Demo] Instalacao eletrica residencial",
    category: "Demo:eletricista",
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "hidraulica",
    title: "[Demo] Reparo hidraulico residencial",
    category: "Demo:hidraulica",
    imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "manutencao-ar",
    title: "[Demo] Manutencao de ar-condicionado",
    category: "Demo:manutencao-ar",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "funilaria-pdr",
    title: "[Demo] Reparo automotivo de lataria",
    category: "Demo:funilaria-pdr",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "buffet-aniversario",
    title: "[Demo] Buffet montado para evento",
    category: "Demo:buffet-aniversario",
    imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "buffet-aniversario",
    title: "[Demo] Mesa de doces e salgados",
    category: "Demo:buffet-aniversario",
    imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "buffet-aniversario",
    title: "[Demo] Servico de buffet em recepcao",
    category: "Demo:buffet-aniversario",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "marcenaria",
    title: "[Demo] Moveis planejados instalados",
    category: "Demo:marcenaria",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "marcenaria",
    title: "[Demo] Cozinha sob medida",
    category: "Demo:marcenaria",
    imageUrl: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "marcenaria",
    title: "[Demo] Armario planejado com acabamento premium",
    category: "Demo:marcenaria",
    imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
  },
  {
    nicheLabel: "eventos-cerimonial",
    title: "[Demo] Cerimonial em recepcao",
    category: "Demo:eventos-cerimonial",
    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
  },
];

const demoBrandCopy = {
  bio: "Propostas comerciais prontas para demonstrar valor, escopo, investimento, fotos, PDF, aceite online e pagamento integrado.",
  proposalIntro: "Esta e uma proposta demo completa: o cliente recebe um link profissional com imagem do servico, escopo organizado, portfolio, depoimentos, FAQ, PDF e aceite online.",
  proposalClosing: "Todos os detalhes podem ser ajustados antes do envio oficial. Use esta demo para mostrar como um orcamento simples vira uma experiencia de fechamento mais profissional.",
  proposalTerms: "Valores, prazos e condicoes desta demonstracao sao ficticios e devem ser adaptados ao cliente real antes do envio.",
  proposalFaq: [
    "O que esta incluso nesta proposta?|Os itens inclusos aparecem no escopo da proposta. Qualquer ajuste de quantidade, prazo ou entrega pode ser combinado antes do aceite.",
    "Por quanto tempo este valor fica valido?|A validade aparece no resumo da proposta. Depois desse prazo, valores e agenda podem ser revisados conforme disponibilidade.",
    "Como funciona a reserva da data ou inicio do projeto?|A reserva acontece apos o aceite da proposta e a confirmacao da entrada ou pagamento combinado.",
    "Posso pedir algum ajuste antes de aceitar?|Sim. Use o WhatsApp ou o canal de contato da proposta para tirar duvidas, ajustar detalhes ou solicitar uma nova versao.",
    "O pagamento pode ser parcelado?|Quando houver parcelamento, a condicao aparece na forma de pagamento da proposta. Caso precise de outra condicao, solicite antes do aceite.",
  ].join("\n"),
};

const demoProposals: DemoProposal[] = [
  {
    clientName: "Ana Lima",
    clientEmail: "ana.lima@exemplo.com",
    serviceName: "Gestão mensal de Instagram",
    price: 1200,
    deadline: "30 dias",
    payment: "50% entrada e 50% na virada do mês",
    included: ["Planejamento editorial", "12 posts feed", "8 stories", "Legenda estratégica", "Relatório mensal"],
    notes: "Gestão completa das redes sociais com foco em engajamento orgânico e crescimento de seguidores.",
    status: "sent",
    viewCount: 0,
    nicheLabel: "social-media",
  },
  {
    clientName: "Bruno Ferreira",
    clientEmail: "bruno.ferreira@exemplo.com",
    serviceName: "Identidade visual profissional",
    price: 1500,
    deadline: "10 dias úteis",
    payment: "50% entrada e 50% na entrega",
    included: ["Logo principal", "Logo secundário", "Paleta de cores", "Tipografia", "Mini manual da marca"],
    notes: "Criação de identidade visual completa para posicionamento da marca no mercado.",
    status: "viewed",
    viewCount: 3,
    nicheLabel: "design",
  },
  {
    clientName: "Camila Rocha",
    clientEmail: "camila.rocha@exemplo.com",
    serviceName: "Ensaio fotográfico profissional",
    price: 900,
    deadline: "7 dias úteis após o ensaio",
    payment: "50% para reservar e 50% na entrega",
    included: ["Briefing de estilo e referencias", "2 horas de ensaio", "Direcao de poses durante a sessao", "30 fotos tratadas em alta resolucao", "Galeria online para selecao e download", "Entrega digital com backup por 30 dias"],
    notes: "Ensaio personalizado para marca pessoal, gestante, familia ou profissional. A proposta mostra como o cliente visualiza fotos de referencia, entende a entrega e aceita tudo pelo link.",
    status: "accepted",
    viewCount: 5,
    nicheLabel: "fotografia",
    acceptedBy: "Camila Rocha",
    acceptedEmail: "camila.rocha@exemplo.com",
    acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "pix",
    paymentPaidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Daniel Souza",
    clientEmail: "daniel.souza@exemplo.com",
    serviceName: "Site one page responsivo",
    price: 1800,
    deadline: "15 dias úteis",
    payment: "40% entrada, 30% no layout aprovado e 30% antes da publicação",
    included: ["Briefing", "Layout responsivo", "Página publicada", "Formulário de contato", "Ajustes finais"],
    notes: "Site profissional otimizado para conversão, com design moderno e carregamento rápido.",
    status: "sent",
    viewCount: 1,
    nicheLabel: "tecnologia",
  },
  {
    clientName: "Eduarda Castro",
    clientEmail: "eduarda.castro@exemplo.com",
    serviceName: "Gestão de anúncios no Google e Meta Ads",
    price: 1400,
    deadline: "Mensal",
    payment: "Pagamento mensal adiantado",
    included: ["Briefing estratégico", "Configuração de campanhas", "Gestão e otimização mensal", "Relatório quinzenal", "Suporte por WhatsApp"],
    notes: "Gestão profissional de tráfego pago para aumentar leads e vendas com orçamento otimizado.",
    status: "viewed",
    viewCount: 7,
    nicheLabel: "marketing-digital",
  },
  {
    clientName: "Felipe Martins",
    clientEmail: "felipe.martins@exemplo.com",
    serviceName: "Projeto de interiores",
    price: 3500,
    deadline: "25 dias úteis",
    payment: "40% entrada, 30% na aprovação e 30% na entrega",
    included: ["Reuniao de briefing e levantamento de medidas", "Layout humanizado com distribuicao dos ambientes", "Moodboard com paleta, referencias e acabamentos", "Projeto 3D dos ambientes principais", "Lista de compras e especificacao de materiais", "1 rodada de ajustes apos apresentacao"],
    notes: "Projeto residencial completo para transformar a ideia do cliente em uma proposta visual, com escopo, etapas, investimento e proximos passos muito claros.",
    status: "accepted",
    viewCount: 9,
    nicheLabel: "arquitetura",
    acceptedBy: "Felipe Martins",
    acceptedEmail: "felipe.martins@exemplo.com",
    acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    paymentPaidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Gabriela Alves",
    clientEmail: "gabriela.alves@exemplo.com",
    serviceName: "Consultoria jurídica personalizada",
    price: 600,
    deadline: "5 dias úteis",
    payment: "Pagamento antecipado",
    included: ["Análise do caso", "Parecer jurídico escrito", "Orientação sobre direitos", "Indicação de próximo passo", "Confidencialidade garantida"],
    notes: "Consultoria especializada para análise e orientação jurídica personalizada.",
    status: "sent",
    viewCount: 2,
    nicheLabel: "advocacia",
  },
  {
    clientName: "Henrique Dias",
    clientEmail: "henrique.dias@exemplo.com",
    serviceName: "Abertura de CNPJ e registro empresarial",
    price: 1500,
    deadline: "20 dias úteis",
    payment: "50% na contratação e 50% na conclusão",
    included: ["Orientação sobre tipo societário", "Elaboração de contrato social", "Registro na Junta Comercial", "Inscrição estadual e municipal", "Configuração fiscal inicial"],
    notes: "Processo completo de abertura de empresa com acompanhamento em todas as etapas.",
    status: "viewed",
    viewCount: 4,
    nicheLabel: "contabilidade",
  },
  {
    clientName: "Isabela Pereira",
    clientEmail: "isabela.pereira@exemplo.com",
    serviceName: "Acompanhamento psicoterapeuta semanal",
    price: 220,
    deadline: "Sessão de 50 minutos",
    payment: "Pagamento por sessão ou pacote mensal",
    included: ["Acolhimento inicial", "Escuta qualificada", "Trabalho terapêutico", "Sigilo profissional garantido", "Atendimento presencial ou online"],
    notes: "Processo terapêutico seguro e acolhedor para promover bem-estar e autoconhecimento.",
    status: "accepted",
    viewCount: 2,
    nicheLabel: "psicologia",
    acceptedBy: "Isabela Pereira",
    acceptedEmail: "isabela.pereira@exemplo.com",
    acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "pix",
    paymentPaidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "João Oliveira",
    clientEmail: "joao.oliveira@exemplo.com",
    serviceName: "Processo de coaching individual",
    price: 2500,
    deadline: "8 semanas",
    payment: "50% na contratação e 50% na metade do processo",
    included: ["Sessão de diagnóstico", "8 sessões de coaching", "Ferramentas de autoconhecimento", "Plano de metas personalizado", "Suporte entre sessões"],
    notes: "Processo estruturado para desenvolvimento pessoal e profissional com resultados mensuráveis.",
    status: "declined",
    viewCount: 6,
    nicheLabel: "coaching",
    declinedReason: "Preciso ajustar o orçamento no momento.",
    declinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Karina Santos",
    clientEmail: "karina.santos@exemplo.com",
    serviceName: "Clareamento dental profissional",
    price: 900,
    deadline: "2 sessões",
    payment: "50% na primeira consulta e 50% na segunda sessão",
    included: ["Avaliação inicial", "Moldagem para moldeiras", "2 sessões de clareamento", "Gel de manutenção", "Orientações de pós-tratamento"],
    notes: "Clareamento seguro e eficaz com resultado de até 8 tons mais claro.",
    status: "viewed",
    viewCount: 5,
    nicheLabel: "odontologia",
  },
  {
    clientName: "Lucas Carvalho",
    clientEmail: "lucas.carvalho@exemplo.com",
    serviceName: "Pacote estetico facial completo",
    price: 690,
    deadline: "4 sessoes em ate 45 dias",
    payment: "30% para reservar e restante em ate 3x",
    included: ["Avaliacao facial inicial", "Limpeza de pele profunda", "Peeling enzimatico ou protocolo equivalente", "Hidratacao e mascara finalizadora", "Orientacao de home care", "Retorno para acompanhamento dos resultados"],
    notes: "Pacote demonstrativo para clinicas de estetica apresentarem tratamento, beneficios, cuidados e condicao de pagamento em uma pagina profissional.",
    status: "sent",
    viewCount: 1,
    nicheLabel: "beleza",
  },
  {
    clientName: "Mariana Costa",
    clientEmail: "mariana.costa@exemplo.com",
    serviceName: "Pintura de ambiente residencial",
    price: 950,
    deadline: "4 dias úteis",
    payment: "50% para reservar e 50% na conclusão",
    included: ["Proteção do ambiente", "Preparação de parede", "Pintura", "Acabamento", "Limpeza básica"],
    notes: "Serviço de pintura com materiais de primeira linha e mão de obra qualificada.",
    status: "declined",
    viewCount: 3,
    nicheLabel: "casa-reforma",
    declinedReason: "Encontrei outro profissional com valor mais acessível.",
    declinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Nelson Ribeiro",
    clientEmail: "nelson.ribeiro@exemplo.com",
    serviceName: "Acompanhamento personal trainer",
    price: 700,
    deadline: "4 semanas",
    payment: "Pagamento mensal adiantado",
    included: ["Avaliação física", "Plano de treino", "8 aulas presenciais ou online", "Ajustes semanais", "Suporte por WhatsApp"],
    notes: "Treinos personalizados conforme seus objetivos com acompanhamento completo.",
    status: "sent",
    viewCount: 2,
    nicheLabel: "saude-fitness",
  },
  {
    clientName: "Olivia Mendes",
    clientEmail: "olivia.mendes@exemplo.com",
    serviceName: "Banho e tosa completo",
    price: 120,
    deadline: "Atendimento em 2 horas",
    payment: "Pagamento no atendimento",
    included: ["Banho", "Secagem", "Tosa higiênica", "Corte de unhas", "Finalização"],
    notes: "Atendimento com muito carinho e cuidado para o seu pet.",
    status: "viewed",
    viewCount: 4,
    nicheLabel: "pet",
  },
  {
    clientName: "Pedro Nascimento",
    clientEmail: "pedro.nascimento@exemplo.com",
    serviceName: "Cerimonial para evento",
    price: 2200,
    deadline: "Conforme data do evento",
    payment: "30% para reserva, 40% um mês antes e 30% na semana do evento",
    included: ["Reunião inicial", "Roteiro do evento", "Coordenação no dia", "Equipe base", "Checklist final"],
    notes: "Cerimonial completo para garantir que seu evento aconteça com tranquilidade e elegância.",
    status: "accepted",
    viewCount: 8,
    nicheLabel: "eventos",
    acceptedBy: "Pedro Nascimento",
    acceptedEmail: "pedro.nascimento@exemplo.com",
    acceptedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    paymentPaidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Renata Gomes",
    clientEmail: "renata.gomes@exemplo.com",
    serviceName: "Consultoria estratégica personalizada",
    price: 1800,
    deadline: "4 semanas",
    payment: "50% na contratação e 50% na metade do projeto",
    included: ["Diagnóstico", "Plano de ação", "4 encontros online", "Material de apoio", "Suporte por mensagem"],
    notes: "Consultoria focada em resultados práticos com plano de ação estruturado.",
    status: "sent",
    viewCount: 0,
    nicheLabel: "consultoria",
  },
  {
    clientName: "Sérgio Lima",
    clientEmail: "sergio.lima@exemplo.com",
    serviceName: "Pacote de marmitas semanais",
    price: 280,
    deadline: "Entrega semanal",
    payment: "Pagamento semanal antecipado",
    included: ["Cardápio semanal", "10 marmitas", "Embalagem", "Entrega local", "Ajustes combinados"],
    notes: "Alimentação saudável e prática entregue toda semana conforme sua preferência.",
    status: "expired",
    viewCount: 2,
    nicheLabel: "gastronomia",
  },
  {
    clientName: "Tatiane Vieira",
    clientEmail: "tatiane.vieira@exemplo.com",
    serviceName: "Plano alimentar personalizado com acompanhamento",
    price: 480,
    deadline: "10 dias úteis",
    payment: "Pagamento antecipado",
    included: ["Anamnese alimentar", "Plano alimentar personalizado", "Lista de substituições", "Orientações de hábitos", "Retorno de acompanhamento"],
    notes: "Plano individualizado com base nos seus objetivos e rotina alimentar.",
    status: "viewed",
    viewCount: 6,
    nicheLabel: "nutricao",
  },
  {
    clientName: "Ubirajara Torres",
    clientEmail: "ubirajara.torres@exemplo.com",
    serviceName: "Diarista para limpeza completa",
    price: 220,
    deadline: "1 diária",
    payment: "Pagamento no dia do atendimento",
    included: ["Limpeza de quartos e sala", "Banheiros", "Cozinha", "Área de serviço", "Organização leve"],
    notes: "Limpeza completa e organizada com profissional de confiança.",
    status: "sent",
    viewCount: 1,
    nicheLabel: "limpeza",
  },

  // Mecânica automotiva
  {
    clientName: "Vagner Moraes",
    clientEmail: "vagner.moraes@exemplo.com",
    serviceName: "Revisão preventiva automotiva",
    price: 480,
    deadline: "1 dia útil",
    payment: "Pagamento na retirada do veículo",
    included: ["Checklist mecânico", "Verificação de fluidos", "Inspeção de freios e suspensão", "Scanner básico", "Relatório do veículo"],
    notes: "Revisão completa para manter o veículo seguro e prevenir problemas maiores.",
    status: "sent",
    viewCount: 2,
    nicheLabel: "mecanica",
  },
  {
    clientName: "Wesley Andrade",
    clientEmail: "wesley.andrade@exemplo.com",
    serviceName: "Manutenção de freios e suspensão",
    price: 850,
    deadline: "1 a 2 dias úteis",
    payment: "50% na aprovação e 50% na retirada",
    included: ["Diagnóstico inicial", "Desmontagem e inspeção", "Substituição de peças combinadas", "Teste de rodagem", "Garantia de 30 dias"],
    notes: "Manutenção especializada em freios e suspensão com peças de qualidade e garantia.",
    status: "accepted",
    viewCount: 6,
    nicheLabel: "mecanica-freios",
    acceptedBy: "Wesley Andrade",
    acceptedEmail: "wesley.andrade@exemplo.com",
    acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "pix",
    paymentPaidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Ximena Barros",
    clientEmail: "ximena.barros@exemplo.com",
    serviceName: "Diagnóstico mecânico completo",
    price: 350,
    deadline: "Atendimento em 3 horas",
    payment: "Pagamento no atendimento",
    included: ["Scanner automotivo", "Análise de ruídos", "Verificação de motor", "Teste de funcionamento", "Orçamento detalhado dos reparos"],
    notes: "Diagnóstico preciso com scanner profissional para identificar qualquer problema no veículo.",
    status: "viewed",
    viewCount: 4,
    nicheLabel: "mecanica-diagnostico",
  },

  // Auto elétrica
  {
    clientName: "Yago Fonseca",
    clientEmail: "yago.fonseca@exemplo.com",
    serviceName: "Diagnóstico elétrico automotivo",
    price: 280,
    deadline: "Atendimento em 2 horas",
    payment: "Pagamento no atendimento",
    included: ["Scanner e testes elétricos", "Verificação de bateria", "Análise de alternador", "Teste de fusível e relê", "Relatório do problema"],
    notes: "Diagnóstico elétrico completo com equipamentos de última geração.",
    status: "sent",
    viewCount: 1,
    nicheLabel: "auto-eletrica",
  },
  {
    clientName: "Zuleica Pinto",
    clientEmail: "zuleica.pinto@exemplo.com",
    serviceName: "Manutenção de bateria e alternador",
    price: 520,
    deadline: "1 dia útil",
    payment: "50% na aprovação e 50% na retirada",
    included: ["Teste de carga", "Verificação de cabos", "Diagnóstico do alternador", "Substituição combinada", "Garantia de 30 dias"],
    notes: "Manutenção completa do sistema de carregamento para evitar panes elétricas.",
    status: "accepted",
    viewCount: 5,
    nicheLabel: "auto-eletrica-bateria",
    acceptedBy: "Zuleica Pinto",
    acceptedEmail: "zuleica.pinto@exemplo.com",
    acceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    paymentPaidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },

  // Som e audiovisual
  {
    clientName: "Alexandre Cunha",
    clientEmail: "alexandre.cunha@exemplo.com",
    serviceName: "Locação de som para evento",
    price: 1500,
    deadline: "Conforme data do evento",
    payment: "50% para reservar a data e 50% no dia do evento",
    included: ["Briefing técnico", "Sistema de som dimensionado", "Montagem e passagem de som", "Operação durante o evento", "Desmontagem dos equipamentos"],
    notes: "Equipamentos profissionais de alta qualidade para garantir o melhor som no seu evento.",
    status: "sent",
    viewCount: 3,
    nicheLabel: "som-evento",
  },
  {
    clientName: "Beatriz Nunes",
    clientEmail: "beatriz.nunes@exemplo.com",
    serviceName: "Pacote som, iluminação e DJ",
    price: 2800,
    deadline: "Conforme data do evento",
    payment: "30% para reserva, 40% uma semana antes e 30% no dia",
    included: ["DJ para período combinado", "Sistema de som", "Iluminação de pista", "Microfone sem fio", "Montagem e acompanhamento técnico"],
    notes: "Pacote completo para festas e eventos com DJ experiente e estrutura profissional.",
    status: "viewed",
    viewCount: 8,
    nicheLabel: "som-dj",
  },
  {
    clientName: "Cláudio Rezende",
    clientEmail: "claudio.rezende@exemplo.com",
    serviceName: "Sonorização e audiovisual para evento corporativo",
    price: 3200,
    deadline: "Conforme data do evento",
    payment: "40% entrada, 30% na montagem e 30% após o evento",
    included: ["Briefing da programação", "Sistema de som", "Projetor ou tela conforme escopo", "Microfones para palestras", "Técnico de operação"],
    notes: "Solução audiovisual completa para eventos corporativos com suporte técnico presencial.",
    status: "accepted",
    viewCount: 7,
    nicheLabel: "audiovisual-corporativo",
    acceptedBy: "Cláudio Rezende",
    acceptedEmail: "claudio.rezende@exemplo.com",
    acceptedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    paymentPaidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },

  // Eletricista / instalação residencial
  {
    clientName: "Daniela Melo",
    clientEmail: "daniela.melo@exemplo.com",
    serviceName: "Revisão elétrica residencial",
    price: 450,
    deadline: "1 dia útil após aprovação",
    payment: "Pagamento na conclusão do serviço",
    included: ["Visita técnica", "Diagnóstico", "Instalação ou reparo", "Teste de segurança", "Garantia de 30 dias"],
    notes: "Revisão completa da instalação elétrica para garantir segurança e conformidade com as normas.",
    status: "sent",
    viewCount: 2,
    nicheLabel: "eletricista",
  },
  {
    clientName: "Evandro Campos",
    clientEmail: "evandro.campos@exemplo.com",
    serviceName: "Instalação de tomadas, interruptores e pontos de luz",
    price: 320,
    deadline: "1 dia útil",
    payment: "Pagamento na conclusão",
    included: ["Visita técnica", "Material incluso conforme escopo", "Instalação dos pontos", "Teste elétrico", "Organização dos fios expostos"],
    notes: "Serviço rápido e seguro para novos pontos elétricos com material de qualidade incluso.",
    status: "viewed",
    viewCount: 5,
    nicheLabel: "eletricista-pontos",
  },
  {
    clientName: "Fernanda Queiroz",
    clientEmail: "fernanda.queiroz@exemplo.com",
    serviceName: "Instalação de quadro elétrico e disjuntores",
    price: 780,
    deadline: "1 a 2 dias úteis",
    payment: "50% na aprovação e 50% na conclusão",
    included: ["Análise da carga elétrica", "Substituição ou instalação do quadro", "Disjuntores conforme carga", "Identificação dos circuitos", "Teste de segurança"],
    notes: "Adequação do quadro elétrico às normas técnicas para maior segurança e suporte às cargas atuais.",
    status: "declined",
    viewCount: 3,
    nicheLabel: "eletricista-quadro",
    declinedReason: "Ainda estou coletando outros orçamentos antes de decidir.",
    declinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },

  // Hidráulica
  {
    clientName: "Gustavo Teixeira",
    clientEmail: "gustavo.teixeira@exemplo.com",
    serviceName: "Reparo e instalação hidráulica",
    price: 380,
    deadline: "1 dia útil",
    payment: "Pagamento na conclusão do serviço",
    included: ["Diagnóstico", "Reparo ou instalação", "Teste de vazamento", "Orientações", "Garantia de 30 dias"],
    notes: "Atendimento rápido para reparos e instalações hidráulicas com garantia no serviço.",
    status: "accepted",
    viewCount: 4,
    nicheLabel: "hidraulica",
    acceptedBy: "Gustavo Teixeira",
    acceptedEmail: "gustavo.teixeira@exemplo.com",
    acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "pix",
    paymentPaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },

  // Serviço técnico / manutenção geral
  {
    clientName: "Helena Silveira",
    clientEmail: "helena.silveira@exemplo.com",
    serviceName: "Manutenção preventiva de ar-condicionado",
    price: 220,
    deadline: "Atendimento em 2 horas",
    payment: "Pagamento no atendimento",
    included: ["Desmontagem parcial", "Limpeza de filtros", "Higienização interna", "Teste final", "Etiqueta de manutenção"],
    notes: "Limpeza e higienização profissional para manter o equipamento com melhor desempenho e ar limpo.",
    status: "sent",
    viewCount: 3,
    nicheLabel: "manutencao-ar",
  },
  {
    clientName: "Igor Batista",
    clientEmail: "igor.batista@exemplo.com",
    serviceName: "Instalação de ar-condicionado split",
    price: 850,
    deadline: "1 dia útil",
    payment: "50% na confirmação e 50% após a instalação",
    included: ["Visita ou briefing técnico", "Instalação da evaporadora e condensadora", "Tubulação básica", "Teste de funcionamento", "Orientações de uso"],
    notes: "Instalação por técnico certificado com suporte pós-instalação e garantia.",
    status: "viewed",
    viewCount: 6,
    nicheLabel: "instalacao-ar",
  },

  // Funilaria e pintura automotiva
  {
    clientName: "Juliana Esteves",
    clientEmail: "juliana.esteves@exemplo.com",
    serviceName: "Reparo de amassado sem pintura — martelinho de ouro",
    price: 480,
    deadline: "Atendimento em 1 dia",
    payment: "Pagamento na retirada do veículo",
    included: ["Inspeção do dano", "Acesso ao ponto", "Desamassamento técnico", "Acabamento visual", "Orientações finais"],
    notes: "Técnica de PDR para restaurar a lataria sem pintura, preservando o acabamento original.",
    status: "sent",
    viewCount: 4,
    nicheLabel: "funilaria-pdr",
  },
  {
    clientName: "Kleber Ramos",
    clientEmail: "kleber.ramos@exemplo.com",
    serviceName: "Funilaria completa e pintura",
    price: 3200,
    deadline: "7 a 12 dias úteis",
    payment: "40% entrada, 30% após aprovação da funilaria e 30% na retirada",
    included: ["Desmontagem parcial", "Reparo de chaparia", "Preparação", "Pintura", "Montagem e polimento"],
    notes: "Reparo completo com pintura automotiva que garante resultado idêntico à cor original.",
    status: "declined",
    viewCount: 5,
    nicheLabel: "funilaria-pintura",
    declinedReason: "O valor ficou acima do que eu esperava para agora.",
    declinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },

  // Buffet
  {
    clientName: "Larissa Drummond",
    clientEmail: "larissa.drummond@exemplo.com",
    serviceName: "Buffet completo para aniversário",
    price: 3200,
    deadline: "Conforme data do evento",
    payment: "30% para reserva da data, 40% até 15 dias antes e 30% no dia",
    included: ["Cardapio personalizado para ate 50 convidados", "Salgados, mini porcoes e mesa de doces conforme escopo", "Bebidas nao alcoolicas combinadas", "Equipe de apoio para montagem e reposicao", "Montagem da mesa principal", "Atendimento durante 4 horas de evento"],
    notes: "Proposta de evento pensada para o cliente enxergar cardapio, estrutura, equipe, prazos e reserva da data sem depender de mensagens soltas no WhatsApp.",
    status: "sent",
    viewCount: 3,
    nicheLabel: "buffet-aniversario",
  },
  {
    clientName: "Maurício Leal",
    clientEmail: "mauricio.leal@exemplo.com",
    serviceName: "Buffet corporativo para reunião ou evento",
    price: 2600,
    deadline: "Conforme data do evento",
    payment: "50% na confirmação e 50% até 7 dias antes",
    included: ["Cardápio combinado", "Coffee break ou refeição", "Bebidas conforme escopo", "Montagem e reposição", "Itens descartáveis ou louças combinadas"],
    notes: "Estrutura profissional para eventos corporativos com pontualidade e apresentação adequada ao ambiente.",
    status: "accepted",
    viewCount: 9,
    nicheLabel: "buffet-corporativo",
    acceptedBy: "Maurício Leal",
    acceptedEmail: "mauricio.leal@exemplo.com",
    acceptedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    paymentPaidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Natália Vasconcelos",
    clientEmail: "natalia.vasconcelos@exemplo.com",
    serviceName: "Buffet para casamento e recepção",
    price: 9800,
    deadline: "Conforme data do evento",
    payment: "30% para reservar a data, 40% 30 dias antes e 30% na semana do casamento",
    included: ["Degustação ou alinhamento de cardápio", "Entrada, prato principal e sobremesa", "Equipe de cozinha e salão", "Montagem do serviço", "Coordenação com cerimonial"],
    notes: "Serviço de buffet para casamentos com cardápio sofisticado, equipe especializada e coordenação integrada com o cerimonial.",
    status: "viewed",
    viewCount: 12,
    nicheLabel: "buffet-casamento",
  },

  {
    clientName: "Marcelo Andrade",
    clientEmail: "marcelo.andrade@exemplo.com",
    serviceName: "Moveis planejados para cozinha e lavanderia",
    price: 12800,
    deadline: "35 a 45 dias apos aprovacao tecnica",
    payment: "40% na aprovacao, 40% no inicio da producao e 20% na instalacao",
    included: ["Visita tecnica para conferencia de medidas", "Projeto executivo dos modulos", "Bancada, armarios inferiores e superiores conforme layout", "Ferragens, puxadores e acabamentos especificados", "Producao sob medida em MDF", "Entrega e instalacao com equipe propria", "Garantia de 12 meses sobre instalacao"],
    notes: "Proposta demonstrativa para marcenaria apresentar projeto, materiais, etapas de producao, prazo de instalacao e condicoes comerciais com imagem de referencia e aceite online.",
    status: "viewed",
    viewCount: 6,
    nicheLabel: "marcenaria",
  },

  // Eventos
  {
    clientName: "Otávio Ferraz",
    clientEmail: "otavio.ferraz@exemplo.com",
    serviceName: "Cerimonial e coordenação de evento",
    price: 2200,
    deadline: "Conforme data do evento",
    payment: "30% para reserva da data, 40% um mês antes e 30% na semana do evento",
    included: ["Reunião inicial de planejamento", "Roteiro do evento", "Coordenação no dia", "Equipe base", "Checklist final"],
    notes: "Cerimonial completo para garantir que cada detalhe do seu evento aconteça no tempo certo e com tranquilidade.",
    status: "sent",
    viewCount: 4,
    nicheLabel: "eventos-cerimonial",
  },
  {
    clientName: "Priscila Aguiar",
    clientEmail: "priscila.aguiar@exemplo.com",
    serviceName: "Decoração personalizada de evento",
    price: 1800,
    deadline: "Conforme data do evento",
    payment: "40% na aprovação do projeto e 60% até 7 dias antes",
    included: ["Briefing e definição do tema", "Projeto decorativo", "Montagem no local", "Desmontagem após o evento", "Itens combinados"],
    notes: "Decoração criativa e personalizada que transforma o ambiente e cria a atmosfera perfeita para o seu evento.",
    status: "accepted",
    viewCount: 10,
    nicheLabel: "eventos-decoracao",
    acceptedBy: "Priscila Aguiar",
    acceptedEmail: "priscila.aguiar@exemplo.com",
    acceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    paymentStatus: "paid",
    paymentMethod: "pix",
    paymentPaidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    clientName: "Robson Cavalcante",
    clientEmail: "robson.cavalcante@exemplo.com",
    serviceName: "Organização completa de festa infantil",
    price: 4500,
    deadline: "Conforme data do evento",
    payment: "30% para reserva, 40% 15 dias antes e 30% no dia",
    included: ["Planejamento do tema", "Decoração temática", "Recreação com 2 animadores", "Locação de mobiliário", "Coordenação no dia"],
    notes: "Pacote completo para festa infantil com tema personalizado, recreação e toda a estrutura inclusa.",
    status: "viewed",
    viewCount: 7,
    nicheLabel: "eventos-infantil",
  },
  {
    clientName: "Simone Castilho",
    clientEmail: "simone.castilho@exemplo.com",
    serviceName: "Evento corporativo — coffee break e estrutura",
    price: 3800,
    deadline: "Conforme data do evento",
    payment: "50% na confirmação e 50% até 5 dias antes",
    included: ["Briefing da programação", "Estrutura de mesas e cadeiras", "Coffee break para número de participantes combinado", "Serviço de apoio no local", "Desmontagem ao final"],
    notes: "Solução completa para eventos corporativos com coffee break, estrutura e equipe de apoio profissional.",
    status: "declined",
    viewCount: 5,
    nicheLabel: "eventos-corporativo",
    declinedReason: "Mudamos a data do evento e precisamos revisar o orçamento.",
    declinedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
];

function demoServiceImageUrl() {
  return DEMO_SERVICE_IMAGE_URL;
}

export async function POST(request: Request) {
  let admin = null;
  if (process.env.NODE_ENV === "production") {
    admin = await requireAdmin();
  } else {
    // In development allow seeding without an admin session for easier testing
    try {
      admin = await requireAdmin();
    } catch {
      admin = { id: "dev-admin", name: "Dev Admin", email: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",")[0] : "dev@local" };
    }
  }

  const { searchParams } = new URL(request.url);
  const replace = searchParams.get("replace") === "1";

  const adminUser = await prisma.user.findUnique({
    where: { email: admin.email },
    select: { id: true, name: true, email: true },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "Usuário admin não encontrado no banco." }, { status: 404 });
  }

  if (replace) {
    await prisma.$transaction([
      prisma.proposalAsset.deleteMany({
        where: {
          userId: adminUser.id,
          publicSlug: { startsWith: "demo-" },
        },
      }),
      prisma.portfolioAsset.deleteMany({
        where: {
          userId: adminUser.id,
          category: { startsWith: "Demo:" },
        },
      }),
      prisma.testimonialAsset.deleteMany({
        where: {
          userId: adminUser.id,
          authorName: { startsWith: "[Demo]" },
        },
      }),
      prisma.serviceAsset.deleteMany({
        where: {
          userId: adminUser.id,
          name: { in: demoProposals.map((p) => p.serviceName) },
        },
      }),
    ]);
  }

  const now = new Date();
  const created = await prisma.$transaction(async (tx) => {
    await tx.brandProfile.upsert({
      where: { userId: adminUser.id },
      create: {
        userId: adminUser.id,
        businessName: "FechaPro Demo",
        email: adminUser.email,
        bio: demoBrandCopy.bio,
        proposalStyle: "premium",
        proposalIntro: demoBrandCopy.proposalIntro,
        proposalClosing: demoBrandCopy.proposalClosing,
        proposalTerms: demoBrandCopy.proposalTerms,
        proposalFaq: demoBrandCopy.proposalFaq,
        showPortfolio: true,
        showTestimonials: true,
        showServices: true,
        showFaq: true,
      },
      update: {
        bio: demoBrandCopy.bio,
        proposalStyle: "premium",
        proposalIntro: demoBrandCopy.proposalIntro,
        proposalClosing: demoBrandCopy.proposalClosing,
        proposalTerms: demoBrandCopy.proposalTerms,
        proposalFaq: demoBrandCopy.proposalFaq,
        showPortfolio: true,
        showTestimonials: true,
        showServices: true,
        showFaq: true,
      },
    });

    const portfolioCreated = await Promise.all(
      demoPortfolioItems.map((item, index) =>
        tx.portfolioAsset.create({
          data: {
            userId: adminUser.id,
            title: item.title,
            category: item.category,
            imageUrl: DEMO_SERVICE_IMAGE_URL,
            createdAt: new Date(now.getTime() - index * 60 * 1000),
          },
        }),
      ),
    );

    await tx.testimonialAsset.createMany({
      data: [
        {
          userId: adminUser.id,
          authorName: "[Demo] Marina Alves",
          company: "Cliente ficticio",
          quote: "A proposta ficou clara, bonita e ajudou a entender exatamente o que estava incluso antes de aprovar.",
        },
        {
          userId: adminUser.id,
          authorName: "[Demo] Rafael Costa",
          company: "Cliente ficticio",
          quote: "Receber o link com fotos, prazo, investimento e aceite online passou muito mais confianca.",
        },
        {
          userId: adminUser.id,
          authorName: "[Demo] Patricia Nogueira",
          company: "Cliente ficticio",
          quote: "O PDF e o link deixaram a negociacao simples para compartilhar internamente e fechar o servico.",
        },
      ],
    });

    const servicesCreated = await Promise.all(
      demoProposals.map((p, index) =>
        tx.serviceAsset.create({
          data: {
            userId: adminUser.id,
            name: p.serviceName,
            price: p.price,
            deadline: p.deadline,
            includes: p.included.slice(0, 30),
            imageUrl: demoServiceImageUrl(),
            createdAt: new Date(now.getTime() - index * 60 * 1000),
          },
        }),
      ),
    );

    const proposalsCreated = await Promise.all(
      demoProposals.map((p) =>
        tx.proposalAsset.create({
          data: {
            userId: adminUser.id,
            clientName: p.clientName,
            clientEmail: p.clientEmail,
            serviceName: p.serviceName,
            price: p.price,
            deadline: p.deadline,
            payment: p.payment,
            included: p.included,
            notes: p.notes,
            status: p.status,
            viewCount: p.viewCount,
            publicSlug: demoSlug(p.nicheLabel),
            checkoutMode: "mercadopago",
            documentType: "auto",
            segment: "auto",
            acceptedBy: p.acceptedBy ?? null,
            acceptedEmail: p.acceptedEmail ?? null,
            acceptedAt: p.acceptedAt ?? null,
            paymentStatus: p.paymentStatus ?? "not_started",
            paymentMethod: p.paymentMethod ?? null,
            paymentPaidAt: p.paymentPaidAt ?? null,
            declinedReason: p.declinedReason ?? null,
            declinedAt: p.declinedAt ?? null,
            createdAt: new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          },
        }),
      ),
    );

    return { portfolioCreated, proposalsCreated, servicesCreated };
  });

  return NextResponse.json({
    created: created.proposalsCreated.length,
    photos: created.portfolioCreated.length,
    services: created.servicesCreated.length,
    proposals: created.proposalsCreated.map((p) => ({ id: p.id, clientName: p.clientName, status: p.status, publicSlug: p.publicSlug })),
  }, { status: 201 });
}

export async function DELETE() {
  let admin = null;
  if (process.env.NODE_ENV === "production") {
    admin = await requireAdmin();
  } else {
    try {
      admin = await requireAdmin();
    } catch {
      admin = { id: "dev-admin", name: "Dev Admin", email: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",")[0] : "dev@local" };
    }
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: admin.email },
    select: { id: true },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "Usuário admin não encontrado no banco." }, { status: 404 });
  }

  const [proposals, portfolio, testimonials, services] = await prisma.$transaction([
    prisma.proposalAsset.deleteMany({
      where: {
        userId: adminUser.id,
        publicSlug: { startsWith: "demo-" },
      },
    }),
    prisma.portfolioAsset.deleteMany({
      where: {
        userId: adminUser.id,
        category: { startsWith: "Demo:" },
      },
    }),
    prisma.testimonialAsset.deleteMany({
      where: {
        userId: adminUser.id,
        authorName: { startsWith: "[Demo]" },
      },
    }),
    prisma.serviceAsset.deleteMany({
      where: {
        userId: adminUser.id,
        name: { in: demoProposals.map((p) => p.serviceName) },
      },
    }),
  ]);

  return NextResponse.json({ deleted: proposals.count, photosDeleted: portfolio.count, testimonialsDeleted: testimonials.count, servicesDeleted: services.count });
}

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    included: ["Briefing", "2 horas de ensaio", "30 fotos tratadas", "Galeria online", "Entrega digital"],
    notes: "Ensaio personalizado com edição profissional e entrega em galeria exclusiva.",
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
    included: ["Levantamento de necessidades", "Layout", "Moodboard", "Projeto 3D", "Lista de compras"],
    notes: "Projeto completo de interiores com ambientação 3D e orientação de execução.",
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
    serviceName: "Pacote de unhas — manicure e alongamento",
    price: 160,
    deadline: "Atendimento em 2 horas",
    payment: "Pagamento no atendimento",
    included: ["Cutilagem", "Esmaltação", "Alongamento ou manutenção", "Finalização hidratante", "Garantia de 7 dias"],
    notes: "Atendimento especializado com produtos de qualidade e resultado duradouro.",
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
];

export async function POST(request: Request) {
  const admin = await requireAdmin();

  const { searchParams } = new URL(request.url);
  const replace = searchParams.get("replace") === "1";

  const adminUser = await prisma.user.findUnique({
    where: { email: admin.email },
    select: { id: true },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "Usuário admin não encontrado no banco." }, { status: 404 });
  }

  if (replace) {
    await prisma.proposalAsset.deleteMany({
      where: {
        userId: adminUser.id,
        publicSlug: { startsWith: "demo-" },
      },
    });
  }

  const now = new Date();
  const created = await prisma.$transaction(
    demoProposals.map((p) =>
      prisma.proposalAsset.create({
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
      })
    )
  );

  return NextResponse.json({ created: created.length, proposals: created.map((p) => ({ id: p.id, clientName: p.clientName, status: p.status, publicSlug: p.publicSlug })) }, { status: 201 });
}

export async function DELETE() {
  const admin = await requireAdmin();

  const adminUser = await prisma.user.findUnique({
    where: { email: admin.email },
    select: { id: true },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "Usuário admin não encontrado no banco." }, { status: 404 });
  }

  const { count } = await prisma.proposalAsset.deleteMany({
    where: {
      userId: adminUser.id,
      publicSlug: { startsWith: "demo-" },
    },
  });

  return NextResponse.json({ deleted: count });
}

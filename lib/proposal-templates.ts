export type ProposalTemplate = {
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

type TemplateSeed = {
  niche: string;
  services: Array<{
    title: string;
    serviceName: string;
    price: number;
    deadline: string;
    included: string[];
    notes?: string;
    payment?: string;
  }>;
};

const templateSeeds: TemplateSeed[] = [
  {
    niche: "Social media",
    services: [
      ["Gestao mensal de Instagram", "Gestao de redes sociais", 1200, "30 dias", ["Planejamento editorial", "12 posts feed", "8 stories", "Legenda estrategica", "Relatorio mensal"]],
      ["Calendario de conteudo", "Planejamento de conteudo mensal", 650, "7 dias uteis", ["Pesquisa de temas", "Calendario mensal", "Sugestoes de formatos", "Chamadas para acao", "Linha editorial"]],
      ["Pacote de Reels", "Criacao de Reels para Instagram", 900, "10 dias uteis", ["Roteiros", "Edicao de 6 videos", "Legendas", "Capas simples", "Orientacao de postagem"]],
    ].map(toService),
  },
  {
    niche: "Designer",
    services: [
      ["Identidade visual", "Identidade visual profissional", 1500, "10 dias uteis", ["Logo principal", "Logo secundario", "Paleta de cores", "Tipografia", "Mini manual da marca"]],
      ["Artes para campanha", "Pacote de artes digitais", 700, "5 dias uteis", ["5 artes para feed", "5 stories", "Adaptacao de textos", "Arquivos finais", "1 rodada de ajustes"]],
      ["Cardapio digital", "Design de cardapio digital", 480, "4 dias uteis", ["Organizacao dos itens", "Layout visual", "PDF final", "Versao para WhatsApp", "Ajustes combinados"]],
    ].map(toService),
  },
  {
    niche: "Fotografia",
    services: [
      ["Ensaio profissional", "Ensaio fotográfico profissional", 900, "7 dias úteis após o ensaio", ["Briefing", "2 horas de ensaio", "30 fotos tratadas", "Galeria online", "Entrega digital"]],
      ["Fotos de produto", "Fotografia de produto", 850, "8 dias úteis", ["Briefing visual", "Até 20 produtos", "Fotos tratadas", "Entrega digital", "Uso comercial básico"]],
      ["Cobertura de evento", "Cobertura fotográfica de evento", 1600, "10 dias úteis após evento", ["Cobertura de até 4 horas", "Seleção de fotos", "Tratamento básico", "Galeria online", "Entrega digital"]],
    ].map(toService),
  },
  {
    niche: "Arquitetura",
    services: [
      ["Projeto de interiores", "Projeto de interiores", 3500, "25 dias uteis", ["Levantamento de necessidades", "Layout", "Moodboard", "Projeto 3D", "Lista de compras"]],
      ["Consultoria de ambiente", "Consultoria de decoracao", 750, "7 dias uteis", ["Reuniao de briefing", "Diagnostico do ambiente", "Sugestao de layout", "Paleta de referencias", "Lista de melhorias"]],
      ["Projeto executivo", "Projeto executivo residencial", 5200, "35 dias uteis", ["Plantas tecnicas", "Detalhamentos", "Compatibilizacao basica", "Memorial descritivo", "Entrega em PDF"]],
    ].map(toService),
  },
  {
    niche: "Consultoria",
    services: [
      ["Consultoria estrategica", "Consultoria estrategica personalizada", 1800, "4 semanas", ["Diagnostico", "Plano de acao", "4 encontros online", "Material de apoio", "Suporte por mensagem"]],
      ["Mentoria individual", "Mentoria individual", 1200, "30 dias", ["Sessao inicial", "3 encontros de acompanhamento", "Plano de prioridades", "Suporte por mensagem", "Resumo final"]],
      ["Diagnostico de negocio", "Diagnostico comercial", 900, "10 dias uteis", ["Coleta de informacoes", "Analise do funil", "Mapa de gargalos", "Recomendacoes", "Reuniao de devolutiva"]],
    ].map(toService),
  },
  {
    niche: "Servico tecnico",
    services: [
      ["Instalacao e manutencao", "Servico tecnico especializado", 850, "5 dias uteis", ["Visita tecnica", "Diagnostico", "Instalacao ou manutencao", "Teste final", "Garantia de 30 dias"]],
      ["Manutencao preventiva", "Manutencao preventiva", 420, "2 dias uteis", ["Checklist tecnico", "Limpeza basica", "Ajustes necessarios", "Teste de funcionamento", "Relatorio simples"]],
      ["Atendimento emergencial", "Atendimento técnico emergencial", 300, "Até 24 horas", ["Triagem", "Deslocamento local", "Diagnóstico", "Solução inicial", "Orientações ao cliente"]],
    ].map(toService),
  },
  {
    niche: "Beleza",
    services: [
      ["Pacote de unhas", "Manicure e alongamento", 160, "Atendimento em 2 horas", ["Cutilagem", "Esmaltacao", "Alongamento ou manutencao", "Finalizacao hidratante", "Garantia de 7 dias"]],
      ["Protocolo estetico", "Protocolo estetico personalizado", 350, "Sessao de 60 a 90 minutos", ["Avaliacao inicial", "Higienizacao", "Procedimento principal", "Orientacoes de cuidado", "Acompanhamento por mensagem"]],
      ["Design de sobrancelhas", "Design de sobrancelhas", 90, "Atendimento em 1 hora", ["Mapeamento facial", "Design personalizado", "Finalizacao", "Orientacoes de cuidado", "Registro do atendimento"]],
      ["Pacote cabelo", "Corte, tratamento e finalizacao", 280, "Atendimento em 3 horas", ["Analise do fio", "Corte", "Tratamento", "Finalizacao", "Orientacao de manutencao"]],
    ].map(toService),
  },
  {
    niche: "Casa e reforma",
    services: [
      ["Instalação residencial", "Instalação e revisão elétrica", 450, "1 dia útil após aprovação", ["Visita técnica", "Diagnóstico", "Instalação ou reparo", "Teste de segurança", "Garantia de 30 dias"]],
      ["Reparo e acabamento", "Serviço de alvenaria e acabamento", 1200, "5 dias úteis", ["Avaliação do local", "Preparação da área", "Execução do reparo", "Acabamento", "Limpeza básica"]],
      ["Pintura residencial", "Pintura de ambiente residencial", 950, "4 dias uteis", ["Protecao do ambiente", "Preparacao de parede", "Pintura", "Acabamento", "Limpeza basica"]],
      ["Instalacao hidraulica", "Reparo e instalacao hidraulica", 380, "1 dia util", ["Diagnostico", "Reparo ou instalacao", "Teste de vazamento", "Orientacoes", "Garantia de 30 dias"]],
    ].map(toService),
  },
  {
    niche: "Limpeza",
    services: [
      ["Limpeza residencial", "Diarista para limpeza completa", 220, "1 diaria", ["Limpeza de quartos e sala", "Banheiros", "Cozinha", "Area de servico", "Organizacao leve"]],
      ["Limpeza pos-obra", "Limpeza pos-obra", 780, "2 dias uteis", ["Remocao de residuos leves", "Limpeza de pisos", "Banheiros", "Vidros acessiveis", "Finalizacao do ambiente"]],
      ["Higienizacao de estofado", "Higienizacao de sofa e estofados", 260, "Atendimento em 2 horas", ["Aspiracao", "Aplicacao de produto", "Extracao", "Secagem orientada", "Garantia do servico"]],
    ].map(toService),
  },
  {
    niche: "Saude e fitness",
    services: [
      ["Plano mensal de treino", "Acompanhamento personal trainer", 700, "4 semanas", ["Avaliacao fisica", "Plano de treino", "8 aulas presenciais ou online", "Ajustes semanais", "Suporte por WhatsApp"]],
      ["Consulta nutricional", "Plano alimentar personalizado", 420, "7 dias uteis", ["Anamnese", "Plano alimentar", "Lista de substituicoes", "Orientacoes", "Retorno online"]],
      ["Pilates individual", "Pacote de aulas de pilates", 480, "4 semanas", ["Avaliacao inicial", "4 aulas", "Ajustes de exercicios", "Orientacoes", "Acompanhamento"]],
    ].map(toService),
  },
  {
    niche: "Tecnologia",
    services: [
      ["Site one page", "Criação de site one page", 1800, "15 dias úteis", ["Briefing", "Layout responsivo", "Página publicada", "Formulário de contato", "Ajustes finais"]],
      ["Landing page", "Landing page de vendas", 1400, "10 dias uteis", ["Copy base", "Layout responsivo", "Formulario", "Integracao simples", "Publicacao"]],
      ["Manutencao de computador", "Formatacao e otimizacao de computador", 250, "2 dias uteis", ["Backup orientado", "Formatacao", "Instalacao basica", "Atualizacoes", "Teste final"]],
      ["Automacao simples", "Automacao de processo com planilha", 900, "12 dias uteis", ["Mapeamento do processo", "Planilha estruturada", "Automacoes basicas", "Teste", "Treinamento rapido"]],
    ].map(toService),
  },
  {
    niche: "Eventos",
    services: [
      ["Cerimonial", "Cerimonial para evento", 2200, "Conforme data do evento", ["Reuniao inicial", "Roteiro do evento", "Coordenacao no dia", "Equipe base", "Checklist final"]],
      ["Decoracao de festa", "Decoracao personalizada de evento", 1800, "Conforme data do evento", ["Briefing", "Projeto decorativo", "Montagem", "Desmontagem", "Itens combinados"]],
      ["Buffet pequeno", "Buffet para evento pequeno", 2500, "Conforme data do evento", ["Cardapio combinado", "Preparo", "Equipe de apoio", "Montagem da mesa", "Atendimento"]],
    ].map(toService),
  },
  {
    niche: "Aulas e educacao",
    services: [
      ["Aula particular", "Pacote de aulas particulares", 400, "4 semanas", ["Diagnostico inicial", "4 aulas", "Material de apoio", "Exercicios", "Acompanhamento"]],
      ["Curso rapido", "Treinamento rapido personalizado", 1200, "2 semanas", ["Plano de aulas", "Material digital", "Aulas ao vivo", "Exercicios praticos", "Certificado simples"]],
      ["Reforco escolar", "Reforco escolar mensal", 650, "30 dias", ["Avaliacao do aluno", "8 encontros", "Plano de estudo", "Atividades", "Relatorio aos responsaveis"]],
    ].map(toService),
  },
  {
    niche: "Pet",
    services: [
      ["Banho e tosa", "Banho e tosa completo", 120, "Atendimento em 2 horas", ["Banho", "Secagem", "Tosa higienica", "Corte de unhas", "Finalizacao"]],
      ["Adestramento", "Pacote de adestramento", 900, "4 semanas", ["Avaliacao comportamental", "4 aulas", "Exercicios guiados", "Orientacao ao tutor", "Acompanhamento"]],
      ["Pet sitter", "Cuidado domiciliar para pet", 280, "Pacote de visitas", ["Visitas combinadas", "Alimentacao", "Troca de agua", "Passeio curto", "Relatorio ao tutor"]],
    ].map(toService),
  },
  {
    niche: "Gastronomia",
    services: [
      ["Marmitas semanais", "Pacote de marmitas semanais", 280, "Entrega semanal", ["Cardapio semanal", "10 marmitas", "Embalagem", "Entrega local", "Ajustes combinados"]],
      ["Bolos personalizados", "Bolo personalizado", 220, "3 dias uteis", ["Briefing do tema", "Massa e recheio", "Decoracao", "Embalagem", "Retirada ou entrega combinada"]],
      ["Coffee break", "Coffee break corporativo", 1500, "Conforme data", ["Cardapio combinado", "Preparo", "Montagem", "Bebidas", "Itens descartaveis"]],
    ].map(toService),
  },
  {
    niche: "Marketing digital",
    services: [
      ["Gestao de trafego pago", "Gestao de anuncios no Google e Meta Ads", 1400, "Mensal", ["Briefing estrategico", "Configuracao de campanhas", "Gestao e otimizacao mensal", "Relatorio quinzenal", "Suporte por WhatsApp"]],
      ["Lancamento de produto", "Estrategia e execucao de lancamento digital", 3200, "30 dias", ["Planejamento de lancamento", "Sequencia de e-mails", "Roteiro de conteudo", "Configuracao de campanhas", "Acompanhamento durante o lancamento"]],
      ["Consultoria de performance", "Auditoria e consultoria em trafego pago", 1800, "15 dias uteis", ["Auditoria das contas de anuncios", "Analise de metricas", "Relatorio de oportunidades", "Plano de acao", "Reuniao de devolutiva"]],
    ].map(toService),
  },
  {
    niche: "Advocacia",
    services: [
      ["Consultoria juridica", "Consultoria juridica personalizada", 600, "5 dias uteis", ["Analise do caso", "Parecer juridico escrito", "Orientacao sobre direitos", "Indicacao de proximo passo", "Confidencialidade garantida"]],
      ["Elaboracao de contrato", "Elaboracao de contrato personalizado", 900, "7 dias uteis", ["Levantamento das clausulas necessarias", "Minuta do contrato", "1 rodada de ajustes", "Versao final em PDF", "Orientacao de uso"]],
      ["Acompanhamento de processo", "Acompanhamento processual mensal", 1200, "Mensal", ["Acompanhamento do andamento", "Atualizacoes periodicas", "Analise de documentos", "Orientacao estrategica", "Relatorio mensal"]],
    ].map(toService),
  },
  {
    niche: "Contabilidade",
    services: [
      ["Abertura de empresa", "Abertura de CNPJ e registro empresarial", 1500, "20 dias uteis", ["Orientacao sobre tipo societario", "Elaboracao de contrato social", "Registro na Junta Comercial", "Inscricao estadual e municipal", "Configuracao fiscal inicial"]],
      ["Contabilidade mensal MEI", "Servicos contabeis para MEI", 120, "Mensal", ["Declaracao anual DASN-SIMEI", "Orientacao sobre limite de faturamento", "Emissao de DAS mensal", "Controle basico de faturamento", "Suporte por WhatsApp"]],
      ["BPO financeiro", "Gestao financeira terceirizada", 2200, "Mensal", ["Conciliacao bancaria", "Contas a pagar e receber", "Relatorio de fluxo de caixa", "DRE mensal simplificado", "Reuniao de acompanhamento"]],
    ].map(toService),
  },
  {
    niche: "Psicologia",
    services: [
      ["Psicoterapia individual", "Acompanhamento psicoterapeuta semanal", 220, "Sessao de 50 minutos", ["Acolhimento inicial", "Escuta qualificada", "Trabalho terapeutico", "Sigilo profissional garantido", "Atendimento presencial ou online"]],
      ["Pacote de sessoes", "Pacote de sessoes de psicoterapia", 800, "4 semanas", ["4 sessoes individuais", "Continuidade do processo terapeutico", "Suporte entre sessoes combinado", "Orientacoes de autocuidado", "Relatorio de evolucao"]],
      ["Orientacao profissional", "Orientacao e aconselhamento profissional", 650, "3 encontros", ["Avaliacao de perfil", "3 encontros de orientacao", "Exercicios de autoconhecimento", "Mapeamento de habilidades", "Plano de acao pessoal"]],
    ].map(toService),
  },
  {
    niche: "Coaching",
    services: [
      ["Coaching individual", "Processo de coaching individual", 2500, "8 semanas", ["Sessao de diagnóstico", "8 sessoes de coaching", "Ferramentas de autoconhecimento", "Plano de metas personalizado", "Suporte entre sessoes"]],
      ["Mentoria de negocios", "Mentoria para empreendedores", 1800, "4 semanas", ["Diagnostico do negocio", "4 encontros de mentoria", "Ferramentas de gestao", "Plano de acao", "Acompanhamento por mensagem"]],
      ["Workshop corporativo", "Workshop de desenvolvimento de equipe", 3500, "1 dia", ["Planejamento do conteudo", "Dinamicas e atividades", "Material de apoio", "Facilitacao do workshop", "Relatorio de resultados"]],
    ].map(toService),
  },
  {
    niche: "Nutricao",
    services: [
      ["Plano alimentar", "Plano alimentar personalizado com acompanhamento", 480, "10 dias uteis", ["Anamnese alimentar", "Plano alimentar personalizado", "Lista de substituicoes", "Orientacoes de habitos", "Retorno de acompanhamento"]],
      ["Reeducacao alimentar", "Programa de reeducacao alimentar mensal", 780, "4 semanas", ["Avaliacao inicial", "Plano alimentar", "2 consultas de acompanhamento", "Ajustes do plano", "Suporte por mensagem"]],
      ["Consultoria para atletas", "Nutricao esportiva personalizada", 650, "15 dias uteis", ["Avaliacao de composicao corporal", "Plano alimentar periodizado", "Suplementacao orientada", "Estrategias pre e pos-treino", "Retorno quinzenal"]],
    ].map(toService),
  },
  {
    niche: "Odontologia",
    services: [
      ["Clareamento dental", "Clareamento dental profissional", 900, "2 sessoes", ["Avaliacao inicial", "Moldagem para moldeiras", "2 sessoes de clareamento", "Gel de manutencao", "Orientacoes de pos-tratamento"]],
      ["Protocolo de limpeza", "Limpeza e profilaxia dental", 280, "1 consulta", ["Avaliacao bucal", "Remocao de tartaro", "Polimento", "Aplicacao de fluor", "Orientacao de escovacao"]],
      ["Restauracao estetica", "Restauracao em resina composta", 450, "1 a 2 consultas", ["Avaliacao e planejamento", "Anestesia local", "Restauracao em resina", "Acabamento e polimento", "Orientacoes de cuidado"]],
    ].map(toService),
  },
];

const templateLevels = [
  { id: "essencial", label: "Essencial", multiplier: 0.75, prefix: "Pacote essencial", extra: "Entrega enxuta com foco no principal combinado." },
  { id: "padrao", label: "Padrao", multiplier: 1, prefix: "", extra: "Entrega equilibrada para atender o escopo principal." },
  { id: "completo", label: "Completo", multiplier: 1.45, prefix: "Pacote completo", extra: "Inclui acompanhamento mais proximo e maior detalhamento da entrega." },
];

const multiServiceTemplates: ProposalTemplate[] = [
  {
    id: "multi-servicos-identidade-social-media",
    niche: "Pacotes com varios servicos",
    title: "Identidade visual + social media",
    serviceName: "Pacote identidade visual + social media",
    price: 3200,
    deadline: "20 dias uteis para implantacao + 30 dias de conteudo",
    payment: "40% entrada, 30% na aprovacao da identidade e 30% na entrega dos conteudos",
    included: [
      "Identidade visual completa - logo, paleta, tipografia e mini manual",
      "Padronizacao de Instagram - foto de perfil, destaques e bio comercial",
      "12 posts para feed com legendas estrategicas",
      "8 stories editaveis para divulgacao",
      "Calendario editorial de 30 dias",
      "1 rodada de ajustes por etapa aprovada",
    ],
    notes: "Proposta indicada para negocios que precisam organizar a marca e iniciar divulgacao com materiais prontos. Valores podem mudar conforme volume de pecas, urgencia e complexidade da identidade visual.",
  },
  {
    id: "multi-servicos-site-trafego-conteudo",
    niche: "Pacotes com varios servicos",
    title: "Site + trafego pago + conteudo inicial",
    serviceName: "Pacote presenca digital completa",
    price: 4800,
    deadline: "30 dias uteis",
    payment: "40% entrada, 30% no layout aprovado e 30% antes da publicacao",
    included: [
      "Landing page ou site one page responsivo",
      "Copy base para apresentacao da oferta",
      "Formulario de contato ou botao de WhatsApp",
      "Configuracao inicial de Meta Ads ou Google Ads",
      "5 criativos simples para campanha",
      "Relatorio inicial com proximos passos",
    ],
    notes: "Investimento de midia paga nao incluso. Hospedagem, dominio, ferramentas externas e taxas de plataforma devem ser combinados separadamente quando necessario.",
  },
  {
    id: "multi-servicos-evento-completo",
    niche: "Pacotes com varios servicos",
    title: "Evento completo",
    serviceName: "Pacote cerimonial + decoracao + buffet",
    price: 7200,
    deadline: "Conforme data do evento",
    payment: "30% para reserva da data, 40% ate 15 dias antes e 30% na semana do evento",
    included: [
      "Planejamento e roteiro do evento",
      "Cerimonial e coordenacao no dia",
      "Decoracao personalizada conforme briefing",
      "Buffet para quantidade combinada de convidados",
      "Checklist de fornecedores e cronograma",
      "Montagem, acompanhamento e desmontagem dos itens contratados",
    ],
    notes: "Proposta sujeita a disponibilidade de agenda, local do evento, numero de convidados e itens extras. Transporte, locacoes especiais e equipe adicional podem ser orcados a parte.",
  },
  {
    id: "multi-servicos-reforma-residencial",
    niche: "Pacotes com varios servicos",
    title: "Reforma residencial completa",
    serviceName: "Pacote eletrica + hidraulica + pintura + acabamento",
    price: 6800,
    deadline: "15 a 25 dias uteis apos aprovacao",
    payment: "40% entrada para inicio, 30% no meio da execucao e 30% na entrega",
    included: [
      "Visita tecnica e levantamento das necessidades",
      "Revisao eletrica dos pontos combinados",
      "Reparo ou instalacao hidraulica dos pontos combinados",
      "Servicos de alvenaria e acabamento leve",
      "Pintura dos ambientes definidos no escopo",
      "Teste final, limpeza basica e garantia de 30 dias",
    ],
    notes: "Materiais, descarte de entulho, deslocamento fora da area atendida e alteracoes de escopo devem ser aprovados antes da execucao.",
  },
  {
    id: "multi-servicos-consultoria-implantacao",
    niche: "Pacotes com varios servicos",
    title: "Diagnostico + plano de acao + acompanhamento",
    serviceName: "Pacote consultoria de implantacao",
    price: 3900,
    deadline: "6 semanas",
    payment: "50% na contratacao e 50% na metade do projeto",
    included: [
      "Diagnostico inicial do negocio ou processo",
      "Mapeamento de gargalos e prioridades",
      "Plano de acao com etapas, prazos e responsaveis",
      "4 encontros online de acompanhamento",
      "Modelos de planilhas ou documentos de apoio",
      "Resumo final com recomendacoes para continuidade",
    ],
    notes: "Este pacote combina estrategia e acompanhamento pratico. Implementacoes tecnicas, ferramentas pagas e demandas fora do plano de acao podem ser contratadas separadamente.",
  },
  {
    id: "multi-servicos-beleza-dia-especial",
    niche: "Pacotes com varios servicos",
    title: "Dia especial de beleza",
    serviceName: "Pacote cabelo + maquiagem + unhas",
    price: 780,
    deadline: "Atendimento em ate 5 horas",
    payment: "50% para reservar horario e 50% no atendimento",
    included: [
      "Analise inicial do visual desejado",
      "Penteado ou finalizacao de cabelo",
      "Maquiagem social ou festa",
      "Manicure e esmaltação",
      "Preparacao e orientacoes de manutencao",
      "Registro simples do resultado final, quando autorizado",
    ],
    notes: "Proposta indicada para eventos, ensaios e datas especiais. Deslocamento, extensoes, acessorios e procedimentos extras podem alterar o valor.",
  },
];

export const proposalTemplates: ProposalTemplate[] = [
  ...multiServiceTemplates,
  ...templateSeeds.flatMap((seed) =>
  seed.services.flatMap((service, serviceIndex) =>
    templateLevels.map((level) => {
      const price = roundPrice(service.price * level.multiplier);
      return {
        id: `${slug(seed.niche)}-${slug(service.title)}-${level.id}-${serviceIndex + 1}`,
        niche: seed.niche,
        title: level.prefix ? `${level.prefix}: ${service.title}` : service.title,
        serviceName: level.label === "Padrao" ? service.serviceName : `${service.serviceName} - ${level.label}`,
        price,
        deadline: service.deadline,
        payment: service.payment || defaultPayment(price),
        included: level.id === "completo" ? [...service.included, "Acompanhamento adicional", "Checklist final"] : service.included,
        notes: `${service.notes || defaultNotes(seed.niche)} ${level.extra}`,
      };
    })
  )
  ),
];

function toService(values: Array<string | number | string[]>) {
  const [title, serviceName, price, deadline, included] = values;
  return {
    title: String(title),
    serviceName: String(serviceName),
    price: Number(price),
    deadline: String(deadline),
    included: Array.isArray(included) ? included.map(String) : [],
  };
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function defaultPayment(price: number) {
  if (price <= 300) return "Pagamento no atendimento ou na entrega";
  if (price <= 1000) return "50% para reservar e 50% na conclusao";
  return "40% entrada, 30% desenvolvimento e 30% entrega";
}

function roundPrice(price: number) {
  if (price < 200) return Math.max(50, Math.round(price / 10) * 10);
  return Math.max(100, Math.round(price / 50) * 50);
}

function defaultNotes(niche: string) {
  return `Valores podem variar conforme escopo, deslocamento, urgencia e necessidades especificas do cliente. Template base para ${niche}.`;
}

export function findProposalTemplate(templateId?: string | null) {
  return proposalTemplates.find((template) => template.id === templateId) || null;
}

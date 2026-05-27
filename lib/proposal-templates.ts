export type ProposalTemplate = {
  id: string;
  niche: string;
  segment?: BusinessSegment;
  title: string;
  serviceName: string;
  price: number;
  deadline: string;
  payment: string;
  included: string[];
  notes: string;
};

export const businessSegments = [
  { value: "technology", label: "Digital e tecnologia" },
  { value: "home_reform", label: "Casa, reforma e serviços técnicos" },
  { value: "automotive", label: "Automotivo" },
  { value: "beauty", label: "Beleza e estética" },
  { value: "health", label: "Saúde e bem-estar" },
  { value: "business", label: "Negócios e serviços profissionais" },
  { value: "events", label: "Eventos" },
  { value: "education", label: "Educação" },
  { value: "food", label: "Gastronomia" },
  { value: "pet", label: "Pet" },
  { value: "real_estate", label: "Imóveis" },
  { value: "fashion_retail", label: "Moda e varejo" },
  { value: "transport", label: "Transporte e logística" },
  { value: "finance", label: "Financeiro e seguros" },
  { value: "industry", label: "Indústria e manutenção" },
  { value: "agriculture", label: "Agro e rural" },
  { value: "tourism", label: "Turismo e hospedagem" },
  { value: "security", label: "Segurança" },
  { value: "general", label: "Outros" },
] as const;

export type BusinessSegment = (typeof businessSegments)[number]["value"];

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
      ["Gestão mensal de Instagram", "Gestão de redes sociais", 1200, "30 dias", ["Planejamento editorial", "12 posts feed", "8 stories", "Legenda estratégica", "Relatório mensal"]],
      ["Calendário de conteúdo", "Planejamento de conteúdo mensal", 650, "7 dias úteis", ["Pesquisa de temas", "Calendário mensal", "Sugestões de formatos", "Chamadas para ação", "Linha editorial"]],
      ["Pacote de Reels", "Criação de Reels para Instagram", 900, "10 dias úteis", ["Roteiros", "Edição de 6 vídeos", "Legendas", "Capas simples", "Orientação de postagem"]],
    ].map(toService),
  },
  {
    niche: "Designer",
    services: [
      ["Identidade visual", "Identidade visual profissional", 1500, "10 dias úteis", ["Logo principal", "Logo secundário", "Paleta de cores", "Tipografia", "Mini manual da marca"]],
      ["Artes para campanha", "Pacote de artes digitais", 700, "5 dias úteis", ["5 artes para feed", "5 stories", "Adaptação de textos", "Arquivos finais", "1 rodada de ajustes"]],
      ["Cardápio digital", "Design de cardápio digital", 480, "4 dias úteis", ["Organização dos itens", "Layout visual", "PDF final", "Versão para WhatsApp", "Ajustes combinados"]],
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
      ["Projeto de interiores", "Projeto de interiores", 3500, "25 dias úteis", ["Levantamento de necessidades", "Layout", "Moodboard", "Projeto 3D", "Lista de compras"]],
      ["Consultoria de ambiente", "Consultoria de decoração", 750, "7 dias úteis", ["Reunião de briefing", "Diagnóstico do ambiente", "Sugestão de layout", "Paleta de referências", "Lista de melhorias"]],
      ["Projeto executivo", "Projeto executivo residencial", 5200, "35 dias úteis", ["Plantas técnicas", "Detalhamentos", "Compatibilização básica", "Memorial descritivo", "Entrega em PDF"]],
    ].map(toService),
  },
  {
    niche: "Consultoria",
    services: [
      ["Consultoria estratégica", "Consultoria estratégica personalizada", 1800, "4 semanas", ["Diagnóstico", "Plano de ação", "4 encontros online", "Material de apoio", "Suporte por mensagem"]],
      ["Mentoria individual", "Mentoria individual", 1200, "30 dias", ["Sessão inicial", "3 encontros de acompanhamento", "Plano de prioridades", "Suporte por mensagem", "Resumo final"]],
      ["Diagnóstico de negócio", "Diagnóstico comercial", 900, "10 dias úteis", ["Coleta de informações", "Análise do funil", "Mapa de gargalos", "Recomendações", "Reunião de devolutiva"]],
    ].map(toService),
  },
  {
    niche: "Serviço técnico",
    services: [
      ["Instalação e manutenção", "Serviço técnico especializado", 850, "5 dias úteis", ["Visita técnica", "Diagnóstico", "Instalação ou manutenção", "Teste final", "Garantia de 30 dias"]],
      ["Manutenção preventiva", "Manutenção preventiva", 420, "2 dias úteis", ["Checklist técnico", "Limpeza básica", "Ajustes necessários", "Teste de funcionamento", "Relatório simples"]],
      ["Atendimento emergencial", "Atendimento técnico emergencial", 300, "Até 24 horas", ["Triagem", "Deslocamento local", "Diagnóstico", "Solução inicial", "Orientações ao cliente"]],
    ].map(toService),
  },
  {
    niche: "Mecânica automotiva",
    services: [
      ["Revisão preventiva", "Revisão preventiva automotiva", 480, "1 dia útil", ["Checklist mecânico", "Verificação de fluidos", "Inspeção de freios e suspensão", "Scanner básico", "Relatório do veículo"]],
      ["Troca de óleo e filtros", "Troca de óleo e filtros", 260, "Atendimento em 2 horas", ["Óleo conforme especificação", "Filtro de óleo", "Verificação de filtros adicionais", "Conferência de vazamentos", "Registro da quilometragem"]],
      ["Freios e suspensão", "Manutenção de freios e suspensão", 850, "1 a 2 dias úteis", ["Diagnóstico inicial", "Desmontagem e inspeção", "Substituição de peças combinadas", "Teste de rodagem", "Garantia de 30 dias"]],
      ["Diagnóstico completo", "Diagnóstico mecânico completo", 350, "Atendimento em 3 horas", ["Scanner automotivo", "Análise de ruídos", "Verificação de motor", "Teste de funcionamento", "Orçamento detalhado dos reparos"]],
    ].map(toService),
  },
  {
    niche: "Lava jato",
    services: [
      ["Lavagem completa", "Lavagem completa de veículo", 90, "Atendimento em 1 hora", ["Lavagem externa", "Aspiração interna", "Limpeza de painel", "Pretinho nos pneus", "Finalização básica"]],
      ["Lavagem detalhada", "Lavagem detalhada automotiva", 180, "Atendimento em 2 horas", ["Pré-lavagem", "Lavagem técnica", "Limpeza interna detalhada", "Limpeza de rodas e caixas", "Finalização com cera líquida"]],
      ["Higienização interna", "Higienização interna automotiva", 320, "Atendimento em 4 horas", ["Aspiração profunda", "Limpeza de bancos", "Limpeza de carpetes", "Higienização de painel e portas", "Orientação de secagem"]],
      ["Plano mensal de lavagem", "Plano mensal de lavagem automotiva", 280, "4 atendimentos mensais", ["4 lavagens completas", "Agendamento prioritário", "Aspiração interna", "Finalização dos pneus", "Controle dos atendimentos"]],
    ].map(toService),
  },
  {
    niche: "Auto elétrica",
    services: [
      ["Diagnóstico elétrico", "Diagnóstico elétrico automotivo", 280, "Atendimento em 2 horas", ["Scanner e testes elétricos", "Verificação de bateria", "Análise de alternador", "Teste de fusível e relé", "Relatório do problema"]],
      ["Instalação de acessórios", "Instalação de acessórios automotivos", 420, "1 dia útil", ["Briefing do acessório", "Instalação elétrica", "Organização de chicote", "Teste de funcionamento", "Orientação de uso"]],
      ["Bateria e alternador", "Manutenção de bateria e alternador", 520, "1 dia útil", ["Teste de carga", "Verificação de cabos", "Diagnóstico do alternador", "Substituição combinada", "Garantia de 30 dias"]],
    ].map(toService),
  },
  {
    niche: "Estética automotiva",
    services: [
      ["Polimento técnico", "Polimento técnico automotivo", 650, "1 a 2 dias úteis", ["Lavagem técnica", "Descontaminação da pintura", "Polimento em etapas", "Proteção final", "Orientações de manutenção"]],
      ["Vitrificação de pintura", "Vitrificação automotiva", 1200, "2 dias úteis", ["Lavagem técnica", "Descontaminação", "Polimento preparatório", "Aplicação de vitrificador", "Cura e entrega orientada"]],
      ["Revitalização de farol", "Revitalização de faróis", 180, "Atendimento em 2 horas", ["Lixamento técnico", "Polimento do farol", "Aplicação de proteção", "Teste visual", "Orientações de cuidado"]],
    ].map(toService),
  },
  {
    niche: "Beleza",
    services: [
      ["Pacote de unhas", "Manicure e alongamento", 160, "Atendimento em 2 horas", ["Cutilagem", "Esmaltação", "Alongamento ou manutenção", "Finalização hidratante", "Garantia de 7 dias"]],
      ["Protocolo estético", "Protocolo estético personalizado", 350, "Sessão de 60 a 90 minutos", ["Avaliação inicial", "Higienização", "Procedimento principal", "Orientações de cuidado", "Acompanhamento por mensagem"]],
      ["Design de sobrancelhas", "Design de sobrancelhas", 90, "Atendimento em 1 hora", ["Mapeamento facial", "Design personalizado", "Finalização", "Orientações de cuidado", "Registro do atendimento"]],
      ["Pacote cabelo", "Corte, tratamento e finalização", 280, "Atendimento em 3 horas", ["Análise do fio", "Corte", "Tratamento", "Finalização", "Orientação de manutenção"]],
    ].map(toService),
  },
  {
    niche: "Casa e reforma",
    services: [
      ["Instalação residencial", "Instalação e revisão elétrica", 450, "1 dia útil após aprovação", ["Visita técnica", "Diagnóstico", "Instalação ou reparo", "Teste de segurança", "Garantia de 30 dias"]],
      ["Reparo e acabamento", "Serviço de alvenaria e acabamento", 1200, "5 dias úteis", ["Avaliação do local", "Preparação da área", "Execução do reparo", "Acabamento", "Limpeza básica"]],
      ["Pintura residencial", "Pintura de ambiente residencial", 950, "4 dias úteis", ["Proteção do ambiente", "Preparação de parede", "Pintura", "Acabamento", "Limpeza básica"]],
      ["Instalação hidráulica", "Reparo e instalação hidráulica", 380, "1 dia útil", ["Diagnóstico", "Reparo ou instalação", "Teste de vazamento", "Orientações", "Garantia de 30 dias"]],
    ].map(toService),
  },
  {
    niche: "Limpeza",
    services: [
      ["Limpeza residencial", "Diarista para limpeza completa", 220, "1 diária", ["Limpeza de quartos e sala", "Banheiros", "Cozinha", "Área de serviço", "Organização leve"]],
      ["Limpeza pós-obra", "Limpeza pós-obra", 780, "2 dias úteis", ["Remoção de resíduos leves", "Limpeza de pisos", "Banheiros", "Vidros acessíveis", "Finalização do ambiente"]],
      ["Higienização de estofado", "Higienização de sofá e estofados", 260, "Atendimento em 2 horas", ["Aspiração", "Aplicação de produto", "Extração", "Secagem orientada", "Garantia do serviço"]],
    ].map(toService),
  },
  {
    niche: "Saúde e fitness",
    services: [
      ["Plano mensal de treino", "Acompanhamento personal trainer", 700, "4 semanas", ["Avaliação física", "Plano de treino", "8 aulas presenciais ou online", "Ajustes semanais", "Suporte por WhatsApp"]],
      ["Consulta nutricional", "Plano alimentar personalizado", 420, "7 dias úteis", ["Anamnese", "Plano alimentar", "Lista de substituições", "Orientações", "Retorno online"]],
      ["Pilates individual", "Pacote de aulas de pilates", 480, "4 semanas", ["Avaliação inicial", "4 aulas", "Ajustes de exercícios", "Orientações", "Acompanhamento"]],
    ].map(toService),
  },
  {
    niche: "Tecnologia",
    services: [
      ["Site one page", "Criação de site one page", 1800, "15 dias úteis", ["Briefing", "Layout responsivo", "Página publicada", "Formulário de contato", "Ajustes finais"]],
      ["Landing page", "Landing page de vendas", 1400, "10 dias úteis", ["Copy base", "Layout responsivo", "Formulário", "Integração simples", "Publicação"]],
      ["Manutenção de computador", "Formatação e otimização de computador", 250, "2 dias úteis", ["Backup orientado", "Formatação", "Instalação básica", "Atualizações", "Teste final"]],
      ["Automação simples", "Automação de processo com planilha", 900, "12 dias úteis", ["Mapeamento do processo", "Planilha estruturada", "Automações básicas", "Teste", "Treinamento rápido"]],
    ].map(toService),
  },
  {
    niche: "Eventos",
    services: [
      ["Cerimonial", "Cerimonial para evento", 2200, "Conforme data do evento", ["Reunião inicial", "Roteiro do evento", "Coordenação no dia", "Equipe base", "Checklist final"]],
      ["Decoração de festa", "Decoração personalizada de evento", 1800, "Conforme data do evento", ["Briefing", "Projeto decorativo", "Montagem", "Desmontagem", "Itens combinados"]],
      ["Buffet pequeno", "Buffet para evento pequeno", 2500, "Conforme data do evento", ["Cardápio combinado", "Preparo", "Equipe de apoio", "Montagem da mesa", "Atendimento"]],
    ].map(toService),
  },
  {
    niche: "Som e audiovisual",
    services: [
      ["Som para evento", "Locação de som para evento", 1500, "Conforme data do evento", ["Briefing técnico", "Sistema de som dimensionado", "Montagem e passagem de som", "Operação durante o evento", "Desmontagem dos equipamentos"]],
      ["Som, luz e DJ", "Pacote som, iluminação e DJ", 2800, "Conforme data do evento", ["DJ para período combinado", "Sistema de som", "Iluminação de pista", "Microfone sem fio", "Montagem e acompanhamento técnico"]],
      ["Audiovisual corporativo", "Sonorização e audiovisual para evento corporativo", 3200, "Conforme data do evento", ["Briefing da programação", "Sistema de som", "Projetor ou tela conforme escopo", "Microfones para palestras", "Técnico de operação"]],
    ].map(toService),
  },
  {
    niche: "Móveis planejados",
    services: [
      ["Projeto de cozinha planejada", "Móveis planejados para cozinha", 8500, "30 a 45 dias úteis", ["Medição do ambiente", "Projeto 3D", "Definição de acabamentos", "Fabricação dos módulos", "Entrega e instalação"]],
      ["Closet planejado", "Projeto e execução de closet planejado", 6200, "25 a 35 dias úteis", ["Levantamento de medidas", "Projeto de distribuição interna", "Escolha de materiais", "Fabricação", "Instalação e ajustes finais"]],
      ["Painel e rack sob medida", "Painel e rack planejados para sala", 3800, "20 a 30 dias úteis", ["Medição técnica", "Projeto visual", "Definição de ferragens e acabamentos", "Fabricação", "Montagem no local"]],
    ].map(toService),
  },
  {
    niche: "Buffets",
    services: [
      ["Buffet para aniversário", "Buffet completo para aniversário", 3200, "Conforme data do evento", ["Cardápio personalizado", "Preparo dos alimentos", "Equipe de apoio", "Montagem da mesa", "Atendimento durante o evento"]],
      ["Buffet corporativo", "Buffet corporativo para reunião ou evento", 2600, "Conforme data do evento", ["Cardápio combinado", "Coffee break ou refeição", "Bebidas conforme escopo", "Montagem e reposição", "Itens descartáveis ou louças combinadas"]],
      ["Buffet para casamento", "Buffet para casamento e recepção", 9800, "Conforme data do evento", ["Degustação ou alinhamento de cardápio", "Entrada, prato principal e sobremesa", "Equipe de cozinha e salão", "Montagem do serviço", "Coordenação com cerimonial"]],
    ].map(toService),
  },
  {
    niche: "Aulas e educação",
    services: [
      ["Aula particular", "Pacote de aulas particulares", 400, "4 semanas", ["Diagnóstico inicial", "4 aulas", "Material de apoio", "Exercícios", "Acompanhamento"]],
      ["Curso rápido", "Treinamento rápido personalizado", 1200, "2 semanas", ["Plano de aulas", "Material digital", "Aulas ao vivo", "Exercícios práticos", "Certificado simples"]],
      ["Reforço escolar", "Reforço escolar mensal", 650, "30 dias", ["Avaliação do aluno", "8 encontros", "Plano de estudo", "Atividades", "Relatório aos responsáveis"]],
    ].map(toService),
  },
  {
    niche: "Pet",
    services: [
      ["Banho e tosa", "Banho e tosa completo", 120, "Atendimento em 2 horas", ["Banho", "Secagem", "Tosa higiênica", "Corte de unhas", "Finalização"]],
      ["Adestramento", "Pacote de adestramento", 900, "4 semanas", ["Avaliação comportamental", "4 aulas", "Exercícios guiados", "Orientação ao tutor", "Acompanhamento"]],
      ["Pet sitter", "Cuidado domiciliar para pet", 280, "Pacote de visitas", ["Visitas combinadas", "Alimentação", "Troca de água", "Passeio curto", "Relatório ao tutor"]],
    ].map(toService),
  },
  {
    niche: "Gastronomia",
    services: [
      ["Marmitas semanais", "Pacote de marmitas semanais", 280, "Entrega semanal", ["Cardápio semanal", "10 marmitas", "Embalagem", "Entrega local", "Ajustes combinados"]],
      ["Bolos personalizados", "Bolo personalizado", 220, "3 dias úteis", ["Briefing do tema", "Massa e recheio", "Decoração", "Embalagem", "Retirada ou entrega combinada"]],
      ["Coffee break", "Coffee break corporativo", 1500, "Conforme data", ["Cardápio combinado", "Preparo", "Montagem", "Bebidas", "Itens descartáveis"]],
    ].map(toService),
  },
  {
    niche: "Marketing digital",
    services: [
      ["Gestão de tráfego pago", "Gestão de anúncios no Google e Meta Ads", 1400, "Mensal", ["Briefing estratégico", "Configuração de campanhas", "Gestão e otimização mensal", "Relatório quinzenal", "Suporte por WhatsApp"]],
      ["Lançamento de produto", "Estratégia e execução de lançamento digital", 3200, "30 dias", ["Planejamento de lançamento", "Sequência de e-mails", "Roteiro de conteúdo", "Configuração de campanhas", "Acompanhamento durante o lançamento"]],
      ["Consultoria de performance", "Auditoria e consultoria em tráfego pago", 1800, "15 dias úteis", ["Auditoria das contas de anúncios", "Análise de métricas", "Relatório de oportunidades", "Plano de ação", "Reunião de devolutiva"]],
    ].map(toService),
  },
  {
    niche: "Advocacia",
    services: [
      ["Consultoria jurídica", "Consultoria jurídica personalizada", 600, "5 dias úteis", ["Análise do caso", "Parecer jurídico escrito", "Orientação sobre direitos", "Indicação de próximo passo", "Confidencialidade garantida"]],
      ["Elaboração de contrato", "Elaboração de contrato personalizado", 900, "7 dias úteis", ["Levantamento das cláusulas necessárias", "Minuta do contrato", "1 rodada de ajustes", "Versão final em PDF", "Orientação de uso"]],
      ["Acompanhamento de processo", "Acompanhamento processual mensal", 1200, "Mensal", ["Acompanhamento do andamento", "Atualizações periódicas", "Análise de documentos", "Orientação estratégica", "Relatório mensal"]],
    ].map(toService),
  },
  {
    niche: "Contabilidade",
    services: [
      ["Abertura de empresa", "Abertura de CNPJ e registro empresarial", 1500, "20 dias úteis", ["Orientação sobre tipo societário", "Elaboração de contrato social", "Registro na Junta Comercial", "Inscrição estadual e municipal", "Configuração fiscal inicial"]],
      ["Contabilidade mensal MEI", "Serviços contábeis para MEI", 120, "Mensal", ["Declaração anual DASN-SIMEI", "Orientação sobre limite de faturamento", "Emissão de DAS mensal", "Controle básico de faturamento", "Suporte por WhatsApp"]],
      ["BPO financeiro", "Gestão financeira terceirizada", 2200, "Mensal", ["Conciliação bancária", "Contas a pagar e receber", "Relatório de fluxo de caixa", "DRE mensal simplificado", "Reunião de acompanhamento"]],
    ].map(toService),
  },
  {
    niche: "Psicologia",
    services: [
      ["Psicoterapia individual", "Acompanhamento psicoterapeuta semanal", 220, "Sessão de 50 minutos", ["Acolhimento inicial", "Escuta qualificada", "Trabalho terapêutico", "Sigilo profissional garantido", "Atendimento presencial ou online"]],
      ["Pacote de sessões", "Pacote de sessões de psicoterapia", 800, "4 semanas", ["4 sessões individuais", "Continuidade do processo terapêutico", "Suporte entre sessões combinado", "Orientações de autocuidado", "Relatório de evolução"]],
      ["Orientação profissional", "Orientação e aconselhamento profissional", 650, "3 encontros", ["Avaliação de perfil", "3 encontros de orientação", "Exercícios de autoconhecimento", "Mapeamento de habilidades", "Plano de ação pessoal"]],
    ].map(toService),
  },
  {
    niche: "Coaching",
    services: [
      ["Coaching individual", "Processo de coaching individual", 2500, "8 semanas", ["Sessão de diagnóstico", "8 sessões de coaching", "Ferramentas de autoconhecimento", "Plano de metas personalizado", "Suporte entre sessões"]],
      ["Mentoria de negócios", "Mentoria para empreendedores", 1800, "4 semanas", ["Diagnóstico do negócio", "4 encontros de mentoria", "Ferramentas de gestão", "Plano de ação", "Acompanhamento por mensagem"]],
      ["Workshop corporativo", "Workshop de desenvolvimento de equipe", 3500, "1 dia", ["Planejamento do conteúdo", "Dinâmicas e atividades", "Material de apoio", "Facilitação do workshop", "Relatório de resultados"]],
    ].map(toService),
  },
  {
    niche: "Nutrição",
    services: [
      ["Plano alimentar", "Plano alimentar personalizado com acompanhamento", 480, "10 dias úteis", ["Anamnese alimentar", "Plano alimentar personalizado", "Lista de substituições", "Orientações de hábitos", "Retorno de acompanhamento"]],
      ["Reeducação alimentar", "Programa de reeducação alimentar mensal", 780, "4 semanas", ["Avaliação inicial", "Plano alimentar", "2 consultas de acompanhamento", "Ajustes do plano", "Suporte por mensagem"]],
      ["Consultoria para atletas", "Nutrição esportiva personalizada", 650, "15 dias úteis", ["Avaliação de composição corporal", "Plano alimentar periodizado", "Suplementação orientada", "Estratégias pré e pós-treino", "Retorno quinzenal"]],
    ].map(toService),
  },
  {
    niche: "Odontologia",
    services: [
      ["Clareamento dental", "Clareamento dental profissional", 900, "2 sessões", ["Avaliação inicial", "Moldagem para moldeiras", "2 sessões de clareamento", "Gel de manutenção", "Orientações de pós-tratamento"]],
      ["Protocolo de limpeza", "Limpeza e profilaxia dental", 280, "1 consulta", ["Avaliação bucal", "Remoção de tártaro", "Polimento", "Aplicação de flúor", "Orientação de escovação"]],
      ["Restauração estética", "Restauração em resina composta", 450, "1 a 2 consultas", ["Avaliação e planejamento", "Anestesia local", "Restauração em resina", "Acabamento e polimento", "Orientações de cuidado"]],
    ].map(toService),
  },
  {
    niche: "Imóveis e condomínios",
    services: [
      ["Vistoria de imóvel", "Vistoria detalhada de imóvel", 450, "2 dias úteis", ["Agendamento da visita", "Registro fotográfico", "Checklist de conservação", "Relatório de vistoria", "Orientações finais"]],
      ["Administração de aluguel", "Administração mensal de locação", 380, "Mensal", ["Análise do contrato", "Controle de repasses", "Comunicação com locatário", "Acompanhamento de vencimentos", "Relatório mensal"]],
      ["Gestão condominial", "Consultoria para gestão condominial", 1500, "30 dias", ["Diagnóstico do condomínio", "Análise de rotinas", "Plano de melhorias", "Reunião com conselho", "Relatório executivo"]],
    ].map(toService),
  },
  {
    niche: "Moda e varejo",
    services: [
      ["Visual merchandising", "Organização visual de loja", 900, "5 dias úteis", ["Diagnóstico da loja", "Sugestão de vitrine", "Organização de exposição", "Lista de melhorias", "Orientação para equipe"]],
      ["Catálogo de produtos", "Catálogo comercial de produtos", 1200, "10 dias úteis", ["Organização de itens", "Textos comerciais", "Layout do catálogo", "PDF final", "Versão para WhatsApp"]],
      ["Implantação de ecommerce", "Cadastro inicial de loja virtual", 1800, "15 dias úteis", ["Configuração da vitrine", "Cadastro de até 30 produtos", "Organização de categorias", "Ajustes de checkout", "Treinamento rápido"]],
    ].map(toService),
  },
  {
    niche: "Transporte e logística",
    services: [
      ["Frete dedicado", "Transporte dedicado de carga", 850, "Conforme rota", ["Coleta no endereço combinado", "Conferência de volume", "Transporte dedicado", "Entrega no destino", "Comprovante de entrega"]],
      ["Mudança residencial", "Mudança residencial planejada", 1800, "1 a 2 dias", ["Visita ou briefing inicial", "Equipe de carregamento", "Transporte dos itens", "Descarregamento no destino", "Organização básica"]],
      ["Roteirização de entregas", "Planejamento de rotas de entrega", 1200, "7 dias úteis", ["Análise de endereços", "Agrupamento de rotas", "Estimativa de prazos", "Planilha operacional", "Orientação para equipe"]],
    ].map(toService),
  },
  {
    niche: "Financeiro e seguros",
    services: [
      ["Planejamento financeiro", "Planejamento financeiro pessoal", 900, "15 dias úteis", ["Diagnóstico financeiro", "Organização de receitas e despesas", "Plano de prioridades", "Mapa de metas", "Reunião de devolutiva"]],
      ["Consultoria de seguros", "Consultoria para escolha de seguro", 450, "5 dias úteis", ["Levantamento de necessidade", "Comparativo de opções", "Explicação de coberturas", "Orientação de contratação", "Suporte inicial"]],
      ["Análise de crédito", "Análise e orientação de crédito", 650, "7 dias úteis", ["Coleta de informações", "Análise de perfil", "Simulação de cenários", "Plano de regularização", "Próximos passos"]],
    ].map(toService),
  },
  {
    niche: "Indústria e manutenção",
    services: [
      ["Manutenção industrial", "Manutenção preventiva de equipamento", 2200, "3 a 5 dias úteis", ["Inspeção inicial", "Checklist técnico", "Execução da manutenção", "Teste operacional", "Relatório técnico"]],
      ["Projeto de melhoria", "Adequação técnica de processo", 4800, "30 dias úteis", ["Mapeamento do processo", "Diagnóstico de gargalos", "Plano de melhoria", "Implantação acompanhada", "Relatório final"]],
      ["Solda e fabricação", "Serviço de solda e fabricação metálica", 1600, "7 dias úteis", ["Levantamento de medidas", "Preparação de material", "Fabricação ou reparo", "Acabamento", "Conferência final"]],
    ].map(toService),
  },
  {
    niche: "Agro e rural",
    services: [
      ["Consultoria rural", "Consultoria para propriedade rural", 1800, "15 dias úteis", ["Visita ou briefing remoto", "Diagnóstico da área", "Plano de ação", "Lista de insumos", "Acompanhamento inicial"]],
      ["Sistema de irrigação", "Instalação de sistema de irrigação", 3500, "10 dias úteis", ["Levantamento da área", "Projeto básico", "Instalação dos pontos", "Teste de funcionamento", "Orientação de uso"]],
      ["Manutenção de máquina agrícola", "Manutenção preventiva de máquina agrícola", 1200, "2 dias úteis", ["Checklist mecânico", "Verificação de fluidos", "Ajustes preventivos", "Teste operacional", "Relatório do equipamento"]],
    ].map(toService),
  },
  {
    niche: "Turismo e hospedagem",
    services: [
      ["Roteiro personalizado", "Planejamento de viagem personalizado", 650, "7 dias úteis", ["Briefing de preferências", "Roteiro por dia", "Sugestão de hospedagem", "Mapa de passeios", "Orientações de reserva"]],
      ["Pacote de hospedagem", "Pacote de hospedagem e experiência", 1800, "Conforme datas", ["Reserva de hospedagem", "Sugestão de atividades", "Informações de chegada", "Suporte pré-viagem", "Condições de cancelamento"]],
      ["Excursão em grupo", "Organização de excursão em grupo", 4200, "Conforme data", ["Planejamento de roteiro", "Transporte combinado", "Controle de participantes", "Acompanhamento da viagem", "Orientações gerais"]],
    ].map(toService),
  },
  {
    niche: "Segurança eletrônica",
    services: [
      ["Instalação de câmeras", "Instalação de sistema CFTV", 2200, "3 dias úteis", ["Visita técnica", "Definição dos pontos", "Instalação de câmeras", "Configuração do acesso remoto", "Treinamento de uso"]],
      ["Alarme e sensores", "Instalação de alarme e sensores", 1600, "2 dias úteis", ["Diagnóstico do local", "Definição dos sensores", "Instalação dos equipamentos", "Teste de disparo", "Orientação ao cliente"]],
      ["Controle de acesso", "Controle de acesso para empresa ou condomínio", 3800, "7 dias úteis", ["Mapeamento de entradas", "Definição de equipamentos", "Instalação e configuração", "Cadastro inicial", "Treinamento da equipe"]],
    ].map(toService),
  },
];

const templateLevels = [
  { id: "essencial", label: "Essencial", multiplier: 0.75, prefix: "Pacote essencial", extra: "Entrega enxuta com foco no principal combinado." },
  { id: "padrao", label: "Padrão", multiplier: 1, prefix: "", extra: "Entrega equilibrada para atender o escopo principal." },
  { id: "completo", label: "Completo", multiplier: 1.45, prefix: "Pacote completo", extra: "Inclui acompanhamento mais próximo e maior detalhamento da entrega." },
];

const broadSegmentTemplateSeeds: TemplateSeed[] = [
  {
    niche: "Engenharia",
    services: [
      ["Laudo técnico", "Laudo técnico de engenharia", 1800, "10 dias úteis", ["Visita técnica", "Registro fotográfico", "Análise normativa", "Emissão de laudo", "ART ou RRT quando aplicável"]],
      ["Projeto estrutural", "Projeto estrutural residencial", 6500, "30 dias úteis", ["Briefing do projeto", "Cálculo estrutural", "Pranchas técnicas", "Memorial descritivo", "Compatibilização básica"]],
      ["Regularização de obra", "Regularização técnica de imóvel", 3200, "20 dias úteis", ["Análise documental", "Levantamento do imóvel", "Plantas necessárias", "Acompanhamento do protocolo", "Orientações finais"]],
    ].map(toService),
  },
  {
    niche: "Energia solar",
    services: [
      ["Projeto fotovoltaico", "Projeto e instalação de energia solar", 18500, "30 a 45 dias úteis", ["Análise de consumo", "Dimensionamento do sistema", "Projeto homologado", "Instalação dos painéis", "Comissionamento"]],
      ["Homologação solar", "Homologação de sistema fotovoltaico", 2200, "15 dias úteis", ["Conferência técnica", "Documentação da concessionária", "Acompanhamento do processo", "Ajustes solicitados", "Liberação orientada"]],
      ["Manutenção solar", "Manutenção preventiva de energia solar", 750, "1 dia útil", ["Inspeção visual", "Limpeza dos módulos", "Verificação de inversor", "Teste de geração", "Relatório técnico"]],
    ].map(toService),
  },
  {
    niche: "Climatização",
    services: [
      ["Instalação de ar-condicionado", "Instalação de ar-condicionado split", 850, "1 dia útil", ["Visita ou briefing técnico", "Instalação da evaporadora e condensadora", "Tubulação básica", "Teste de funcionamento", "Orientações de uso"]],
      ["Limpeza de ar-condicionado", "Higienização de ar-condicionado", 220, "Atendimento em 2 horas", ["Desmontagem parcial", "Limpeza de filtros", "Higienização interna", "Teste final", "Etiqueta de manutenção"]],
      ["PMOC", "Plano de manutenção de climatização", 1800, "Mensal", ["Inventário dos equipamentos", "Cronograma de manutenção", "Execução preventiva", "Relatório mensal", "Controle de chamados"]],
    ].map(toService),
  },
  {
    niche: "Marcenaria",
    services: [
      ["Móvel sob medida", "Móvel sob medida personalizado", 4200, "25 a 35 dias úteis", ["Medição técnica", "Projeto visual", "Definição de materiais", "Fabricação", "Entrega e montagem"]],
      ["Reparo de móveis", "Reparo e ajuste de móveis", 650, "5 dias úteis", ["Avaliação do item", "Troca ou ajuste de ferragens", "Reparo estrutural leve", "Acabamento", "Teste de uso"]],
      ["Painel ripado", "Painel decorativo sob medida", 2800, "15 a 20 dias úteis", ["Medição do ambiente", "Definição de madeira ou MDF", "Fabricação", "Instalação", "Acabamento final"]],
    ].map(toService),
  },
  {
    niche: "Jardinagem e paisagismo",
    services: [
      ["Projeto de paisagismo", "Projeto de paisagismo residencial", 2500, "15 dias úteis", ["Briefing do espaço", "Estudo de espécies", "Layout paisagístico", "Lista de plantas", "Orientações de manutenção"]],
      ["Manutenção de jardim", "Manutenção periódica de jardim", 480, "Atendimento mensal", ["Poda leve", "Limpeza dos canteiros", "Adubação básica", "Controle visual de pragas", "Relatório simples"]],
      ["Implantação de jardim", "Implantação de jardim completo", 5200, "7 a 12 dias úteis", ["Preparo do solo", "Fornecimento de mudas combinadas", "Plantio", "Acabamento com substrato", "Primeira irrigação orientada"]],
    ].map(toService),
  },
  {
    niche: "Dedetização e controle de pragas",
    services: [
      ["Dedetização residencial", "Controle de pragas residencial", 420, "Atendimento em 2 horas", ["Inspeção do local", "Aplicação direcionada", "Produtos regularizados", "Orientações de segurança", "Garantia combinada"]],
      ["Controle empresarial", "Controle integrado de pragas para empresa", 1200, "Mensal", ["Mapeamento de pontos críticos", "Aplicação programada", "Iscas e barreiras", "Relatório técnico", "Monitoramento mensal"]],
      ["Descupinização", "Tratamento contra cupins", 1800, "1 a 2 dias úteis", ["Identificação dos focos", "Tratamento localizado", "Barreira química quando aplicável", "Orientações preventivas", "Retorno técnico"]],
    ].map(toService),
  },
  {
    niche: "Gráfica e comunicação visual",
    services: [
      ["Material impresso", "Impressão de material gráfico", 650, "5 dias úteis", ["Conferência dos arquivos", "Prova digital", "Impressão", "Acabamento combinado", "Entrega ou retirada"]],
      ["Fachada e adesivos", "Comunicação visual para fachada", 2400, "10 dias úteis", ["Medição do local", "Layout de fachada", "Produção dos adesivos ou placa", "Instalação", "Acabamento final"]],
      ["Brindes personalizados", "Brindes corporativos personalizados", 1800, "15 dias úteis", ["Seleção dos itens", "Aplicação da marca", "Prova de personalização", "Produção", "Entrega dos brindes"]],
    ].map(toService),
  },
  {
    niche: "Vídeo e produção audiovisual",
    services: [
      ["Vídeo institucional", "Vídeo institucional para empresa", 4500, "20 dias úteis", ["Roteiro", "Captação de imagens", "Edição", "Trilha ou banco de áudio", "Arquivo final para web"]],
      ["Cobertura em vídeo", "Filmagem de evento", 2800, "10 dias úteis após evento", ["Cobertura de até 4 horas", "Captação de áudio ambiente", "Edição de melhores momentos", "Entrega digital", "Backup temporário"]],
      ["Vídeo para redes sociais", "Pacote de vídeos curtos", 1600, "10 dias úteis", ["Roteiros simples", "Captação ou edição de material enviado", "6 vídeos verticais", "Legendas embutidas", "Capas simples"]],
    ].map(toService),
  },
  {
    niche: "Imobiliária e corretagem",
    services: [
      ["Avaliação de imóvel", "Avaliação comercial de imóvel", 650, "5 dias úteis", ["Levantamento de dados", "Análise comparativa", "Sugestão de valor", "Relatório simples", "Orientação de estratégia"]],
      ["Captação e venda", "Intermediação de venda de imóvel", 4500, "Conforme negociação", ["Análise documental inicial", "Divulgação do imóvel", "Atendimento a interessados", "Negociação", "Acompanhamento até assinatura"]],
      ["Locação assistida", "Intermediação de locação", 900, "15 dias úteis", ["Anúncio do imóvel", "Triagem de interessados", "Visitas", "Análise cadastral", "Contrato de locação"]],
    ].map(toService),
  },
  {
    niche: "Serralheria e metalurgia",
    services: [
      ["Portão sob medida", "Fabricação de portão metálico", 4800, "20 dias úteis", ["Medição do vão", "Projeto do portão", "Fabricação metálica", "Pintura básica", "Instalação"]],
      ["Grade de proteção", "Grade ou guarda-corpo sob medida", 2600, "15 dias úteis", ["Levantamento de medidas", "Definição de modelo", "Fabricação", "Acabamento", "Fixação no local"]],
      ["Reparo de estrutura", "Reparo de estrutura metálica", 1200, "5 dias úteis", ["Inspeção da estrutura", "Solda ou reforço", "Tratamento de pontos críticos", "Pintura de retoque", "Conferência final"]],
    ].map(toService),
  },
  {
    niche: "Piscinas",
    services: [
      ["Manutenção de piscina", "Manutenção e limpeza de piscina", 380, "Atendimento semanal", ["Limpeza física", "Aspiração", "Análise da água", "Aplicação de produtos", "Orientações de uso"]],
      ["Reforma de piscina", "Reforma e revitalização de piscina", 7800, "20 a 30 dias úteis", ["Diagnóstico estrutural", "Remoção de revestimentos danificados", "Impermeabilização quando aplicável", "Novo acabamento", "Teste de estanqueidade"]],
      ["Casa de máquinas", "Instalação de bomba e filtro", 2400, "3 dias úteis", ["Análise hidráulica", "Instalação dos equipamentos", "Conexões e registros", "Teste de circulação", "Treinamento de uso"]],
    ].map(toService),
  },
  {
    niche: "Confecção e costura",
    services: [
      ["Uniformes profissionais", "Confecção de uniformes personalizados", 2500, "20 dias úteis", ["Definição de modelo", "Grade de tamanhos", "Prova inicial", "Confecção", "Entrega embalada"]],
      ["Ajustes de roupas", "Ajustes e reparos de roupas", 180, "3 dias úteis", ["Prova ou medidas", "Ajuste de barra ou cintura", "Reparo de costura", "Passadoria simples", "Entrega final"]],
      ["Peça sob medida", "Roupa sob medida personalizada", 1200, "15 dias úteis", ["Briefing do modelo", "Tirada de medidas", "Prova intermediária", "Confecção", "Ajuste final"]],
    ].map(toService),
  },
  {
    niche: "Ecommerce e marketplace",
    services: [
      ["Cadastro de produtos", "Cadastro otimizado de produtos", 900, "7 dias úteis", ["Organização de informações", "Cadastro de até 50 produtos", "Títulos e descrições", "Categorias", "Conferência final"]],
      ["Implantação de loja", "Implantação de ecommerce", 3500, "20 dias úteis", ["Configuração da plataforma", "Tema visual base", "Meios de pagamento", "Frete", "Treinamento rápido"]],
      ["Gestão de marketplace", "Gestão mensal de marketplace", 1800, "Mensal", ["Monitoramento de anúncios", "Ajustes de preços", "Acompanhamento de pedidos", "Relatório mensal", "Suporte operacional"]],
    ].map(toService),
  },
  {
    niche: "Recursos humanos",
    services: [
      ["Recrutamento e seleção", "Processo seletivo completo", 2200, "20 dias úteis", ["Alinhamento da vaga", "Divulgação", "Triagem de currículos", "Entrevistas", "Shortlist de candidatos"]],
      ["Treinamento interno", "Treinamento corporativo para equipe", 3200, "1 dia", ["Diagnóstico da demanda", "Conteúdo personalizado", "Material de apoio", "Facilitação", "Relatório de presença"]],
      ["Cargos e salários", "Projeto de cargos e salários", 6800, "45 dias úteis", ["Mapeamento de funções", "Descrição de cargos", "Pesquisa salarial", "Trilhas de crescimento", "Relatório final"]],
    ].map(toService),
  },
  {
    niche: "Veterinária",
    services: [
      ["Consulta veterinária", "Consulta veterinária clínica", 180, "Atendimento agendado", ["Anamnese", "Exame clínico", "Orientações ao tutor", "Receita quando aplicável", "Retorno combinado"]],
      ["Vacinas e check-up", "Check-up preventivo pet", 420, "Atendimento em 1 hora", ["Consulta", "Carteira vacinal", "Exames básicos quando combinados", "Orientações preventivas", "Plano de acompanhamento"]],
      ["Atendimento domiciliar", "Consulta veterinária domiciliar", 350, "Conforme agenda", ["Deslocamento local", "Consulta no domicílio", "Avaliação do ambiente", "Orientações ao tutor", "Encaminhamento se necessário"]],
    ].map(toService),
  },
  {
    niche: "Terapias e bem-estar",
    services: [
      ["Massoterapia", "Sessão de massoterapia", 160, "Sessão de 60 minutos", ["Anamnese rápida", "Técnica combinada", "Ambiente preparado", "Orientações pós-sessão", "Acompanhamento simples"]],
      ["Terapia holística", "Sessão de terapia integrativa", 220, "Sessão de 60 a 90 minutos", ["Escuta inicial", "Técnica escolhida", "Plano de cuidado", "Orientações", "Retorno opcional"]],
      ["Pacote bem-estar", "Pacote mensal de bem-estar", 720, "4 semanas", ["4 sessões", "Acompanhamento de evolução", "Orientações semanais", "Ajustes de abordagem", "Suporte por mensagem"]],
    ].map(toService),
  },
  {
    niche: "Assistência técnica eletrônicos",
    services: [
      ["Reparo de celular", "Reparo técnico de smartphone", 380, "1 a 3 dias úteis", ["Diagnóstico", "Orçamento de peça", "Substituição ou reparo", "Teste final", "Garantia do serviço"]],
      ["Reparo de notebook", "Manutenção de notebook", 450, "2 a 5 dias úteis", ["Diagnóstico de hardware e software", "Limpeza interna", "Otimização", "Troca de peça quando aprovada", "Teste de desempenho"]],
      ["Manutenção de impressora", "Manutenção de impressora", 320, "2 dias úteis", ["Diagnóstico", "Limpeza técnica", "Ajuste de mecanismo", "Teste de impressão", "Orientações de uso"]],
    ].map(toService),
  },
  {
    niche: "Instalação de redes e internet",
    services: [
      ["Rede Wi-Fi empresarial", "Instalação de rede Wi-Fi", 2200, "5 dias úteis", ["Mapeamento do ambiente", "Definição de pontos", "Instalação de equipamentos", "Configuração", "Teste de cobertura"]],
      ["Cabeamento estruturado", "Cabeamento de rede estruturado", 4800, "10 dias úteis", ["Projeto dos pontos", "Passagem de cabos", "Organização de rack", "Certificação básica", "Identificação dos pontos"]],
      ["Suporte mensal TI", "Suporte técnico mensal de TI", 1800, "Mensal", ["Atendimento remoto", "Visitas combinadas", "Monitoramento básico", "Suporte a usuários", "Relatório mensal"]],
    ].map(toService),
  },
  {
    niche: "Funilaria e pintura automotiva",
    services: [
      ["Pintura de para-choque", "Pintura automotiva localizada", 750, "2 a 3 dias úteis", ["Avaliação da peça", "Preparação da superfície", "Pintura", "Polimento", "Conferência de cor"]],
      ["Martelinho de ouro", "Reparo de amassado sem pintura", 480, "Atendimento em 1 dia", ["Inspeção do dano", "Acesso ao ponto", "Desamassamento técnico", "Acabamento visual", "Orientações finais"]],
      ["Funilaria completa", "Reparo de funilaria e pintura", 3200, "7 a 12 dias úteis", ["Desmontagem parcial", "Reparo de chaparia", "Preparação", "Pintura", "Montagem e polimento"]],
    ].map(toService),
  },
  {
    niche: "Aluguel de equipamentos",
    services: [
      ["Locação para obra", "Locação de equipamentos para obra", 1200, "Período combinado", ["Reserva dos equipamentos", "Entrega local", "Orientação de uso", "Retirada", "Checklist de devolução"]],
      ["Locação audiovisual", "Locação de projetor e tela", 650, "Diária", ["Equipamentos testados", "Entrega ou retirada", "Montagem básica", "Suporte inicial", "Conferência na devolução"]],
      ["Locação para festa", "Locação de mesas, cadeiras e itens para evento", 1400, "Conforme data", ["Reserva dos itens", "Separação e conferência", "Entrega", "Retirada", "Reposição por avaria quando aplicável"]],
    ].map(toService),
  },
  {
    niche: "Brindes e presentes personalizados",
    services: [
      ["Kit corporativo", "Kit corporativo personalizado", 2800, "15 dias úteis", ["Curadoria dos itens", "Personalização com marca", "Embalagem", "Montagem dos kits", "Entrega"]],
      ["Canecas e camisetas", "Produtos personalizados para campanha", 1600, "10 dias úteis", ["Arte base", "Prova digital", "Produção", "Conferência de qualidade", "Entrega"]],
      ["Lembranças de evento", "Lembranças personalizadas para evento", 2200, "20 dias úteis", ["Definição do tema", "Amostra ou prova visual", "Produção em quantidade", "Embalagem individual", "Entrega programada"]],
    ].map(toService),
  },
  {
    niche: "Telecomunicações",
    services: [
      ["PABX e telefonia", "Instalação de PABX ou telefonia IP", 4200, "10 dias úteis", ["Levantamento de ramais", "Configuração da central", "Instalação dos aparelhos", "Testes de chamada", "Treinamento"]],
      ["Internet empresarial", "Projeto de conectividade empresarial", 3500, "15 dias úteis", ["Análise da demanda", "Desenho da solução", "Configuração de roteadores", "Políticas básicas", "Teste de estabilidade"]],
      ["Manutenção telecom", "Suporte técnico de telecomunicações", 1500, "Mensal", ["Atendimento remoto", "Monitoramento básico", "Ajustes de configuração", "Chamados incluídos", "Relatório mensal"]],
    ].map(toService),
  },
  {
    niche: "Ambiental",
    services: [
      ["Licenciamento ambiental", "Consultoria para licenciamento ambiental", 6500, "45 dias úteis", ["Análise inicial", "Documentação técnica", "Protocolos", "Acompanhamento de exigências", "Relatório final"]],
      ["Gestão de resíduos", "Plano de gestão de resíduos", 3800, "25 dias úteis", ["Diagnóstico dos resíduos", "Classificação", "Plano de manejo", "Fornecedores indicados", "Treinamento rápido"]],
      ["Relatório ambiental", "Relatório técnico ambiental", 2800, "15 dias úteis", ["Visita técnica", "Coleta de dados", "Análise de impactos", "Recomendações", "Entrega em PDF"]],
    ].map(toService),
  },
  {
    niche: "Eventos infantis e recreação",
    services: [
      ["Recreação infantil", "Equipe de recreação para festa", 1200, "Conforme data do evento", ["Briefing da faixa etária", "2 recreadores", "Brincadeiras dirigidas", "Materiais básicos", "Acompanhamento durante a festa"]],
      ["Personagem vivo", "Personagem temático para evento", 850, "Período de 1 hora", ["Personagem caracterizado", "Entrada especial", "Fotos com convidados", "Interação dirigida", "Alinhamento prévio"]],
      ["Oficina criativa", "Oficina infantil para evento", 1400, "Conforme data", ["Planejamento da atividade", "Materiais para participantes", "Monitoria", "Organização do espaço", "Entrega dos itens produzidos"]],
    ].map(toService),
  },
  {
    niche: "Cerâmica, vidro e acabamentos",
    services: [
      ["Instalação de porcelanato", "Assentamento de porcelanato", 3200, "7 a 12 dias úteis", ["Avaliação do contrapiso", "Paginação simples", "Assentamento", "Rejunte", "Limpeza final"]],
      ["Box de banheiro", "Instalação de box de vidro", 1200, "7 dias úteis", ["Medição técnica", "Produção do vidro", "Instalação", "Vedação", "Orientações de manutenção"]],
      ["Bancada sob medida", "Bancada de pedra ou mármore", 3800, "15 dias úteis", ["Medição", "Escolha do material", "Corte e acabamento", "Instalação", "Conferência final"]],
    ].map(toService),
  },
  {
    niche: "Estratégia comercial e vendas",
    services: [
      ["Funil de vendas", "Implantação de funil comercial", 4200, "30 dias úteis", ["Diagnóstico comercial", "Desenho das etapas", "Scripts de abordagem", "Indicadores", "Treinamento da equipe"]],
      ["CRM", "Implantação de CRM", 3500, "20 dias úteis", ["Mapeamento do processo", "Configuração do CRM", "Importação inicial", "Automações básicas", "Treinamento"]],
      ["Treinamento de vendas", "Treinamento comercial para equipe", 2800, "1 dia", ["Briefing", "Conteúdo personalizado", "Dinâmicas práticas", "Material de apoio", "Plano de ação"]],
    ].map(toService),
  },
  {
    niche: "Administração pública e terceiro setor",
    services: [
      ["Projeto para edital", "Elaboração de projeto para edital", 3500, "20 dias úteis", ["Leitura do edital", "Estrutura do projeto", "Orçamento base", "Documentos de apoio", "Revisão final"]],
      ["Prestação de contas", "Organização de prestação de contas", 2800, "15 dias úteis", ["Conferência documental", "Planilhas financeiras", "Relatório de execução", "Organização de anexos", "Entrega digital"]],
      ["Captação de recursos", "Consultoria para captação de recursos", 4200, "30 dias úteis", ["Diagnóstico institucional", "Mapa de oportunidades", "Plano de captação", "Materiais de apresentação", "Acompanhamento inicial"]],
    ].map(toService),
  },
];

const multiServiceTemplates: ProposalTemplate[] = [
  {
    id: "multi-servicos-identidade-social-media",
    niche: "Pacotes com vários serviços",
    title: "Identidade visual + social media",
    serviceName: "Pacote identidade visual + social media",
    price: 3200,
    deadline: "20 dias úteis para implantação + 30 dias de conteúdo",
    payment: "40% entrada, 30% na aprovação da identidade e 30% na entrega dos conteúdos",
    included: [
      "Identidade visual completa - logo, paleta, tipografia e mini manual",
      "Padronização de Instagram - foto de perfil, destaques e bio comercial",
      "12 posts para feed com legendas estratégicas",
      "8 stories editáveis para divulgação",
      "Calendário editorial de 30 dias",
      "1 rodada de ajustes por etapa aprovada",
    ],
    notes: "Proposta indicada para negócios que precisam organizar a marca e iniciar divulgação com materiais prontos. Valores podem mudar conforme volume de peças, urgência e complexidade da identidade visual.",
  },
  {
    id: "multi-servicos-site-trafego-conteudo",
    niche: "Pacotes com vários serviços",
    title: "Site + tráfego pago + conteúdo inicial",
    serviceName: "Pacote presença digital completa",
    price: 4800,
    deadline: "30 dias úteis",
    payment: "40% entrada, 30% no layout aprovado e 30% antes da publicação",
    included: [
      "Landing page ou site one page responsivo",
      "Copy base para apresentação da oferta",
      "Formulário de contato ou botão de WhatsApp",
      "Configuração inicial de Meta Ads ou Google Ads",
      "5 criativos simples para campanha",
      "Relatório inicial com próximos passos",
    ],
    notes: "Investimento de mídia paga não incluso. Hospedagem, domínio, ferramentas externas e taxas de plataforma devem ser combinados separadamente quando necessário.",
  },
  {
    id: "multi-servicos-evento-completo",
    niche: "Pacotes com vários serviços",
    title: "Evento completo",
    serviceName: "Pacote cerimonial + decoração + buffet",
    price: 7200,
    deadline: "Conforme data do evento",
    payment: "30% para reserva da data, 40% até 15 dias antes e 30% na semana do evento",
    included: [
      "Planejamento e roteiro do evento",
      "Cerimonial e coordenação no dia",
      "Decoração personalizada conforme briefing",
      "Buffet para quantidade combinada de convidados",
      "Checklist de fornecedores e cronograma",
      "Montagem, acompanhamento e desmontagem dos itens contratados",
    ],
    notes: "Proposta sujeita a disponibilidade de agenda, local do evento, número de convidados e itens extras. Transporte, locações especiais e equipe adicional podem ser orçados à parte.",
  },
  {
    id: "multi-servicos-reforma-residencial",
    niche: "Pacotes com vários serviços",
    title: "Reforma residencial completa",
    serviceName: "Pacote elétrica + hidráulica + pintura + acabamento",
    price: 6800,
    deadline: "15 a 25 dias úteis após aprovação",
    payment: "40% entrada para início, 30% no meio da execução e 30% na entrega",
    included: [
      "Visita técnica e levantamento das necessidades",
      "Revisão elétrica dos pontos combinados",
      "Reparo ou instalação hidráulica dos pontos combinados",
      "Serviços de alvenaria e acabamento leve",
      "Pintura dos ambientes definidos no escopo",
      "Teste final, limpeza básica e garantia de 30 dias",
    ],
    notes: "Materiais, descarte de entulho, deslocamento fora da área atendida e alterações de escopo devem ser aprovados antes da execução.",
  },
  {
    id: "multi-servicos-consultoria-implantacao",
    niche: "Pacotes com vários serviços",
    title: "Diagnóstico + plano de ação + acompanhamento",
    serviceName: "Pacote consultoria de implantação",
    price: 3900,
    deadline: "6 semanas",
    payment: "50% na contratação e 50% na metade do projeto",
    included: [
      "Diagnóstico inicial do negócio ou processo",
      "Mapeamento de gargalos e prioridades",
      "Plano de ação com etapas, prazos e responsáveis",
      "4 encontros online de acompanhamento",
      "Modelos de planilhas ou documentos de apoio",
      "Resumo final com recomendações para continuidade",
    ],
    notes: "Este pacote combina estratégia e acompanhamento prático. Implementações técnicas, ferramentas pagas e demandas fora do plano de ação podem ser contratadas separadamente.",
  },
  {
    id: "multi-servicos-beleza-dia-especial",
    niche: "Pacotes com vários serviços",
    title: "Dia especial de beleza",
    serviceName: "Pacote cabelo + maquiagem + unhas",
    price: 780,
    deadline: "Atendimento em até 5 horas",
    payment: "50% para reservar horário e 50% no atendimento",
    included: [
      "Análise inicial do visual desejado",
      "Penteado ou finalização de cabelo",
      "Maquiagem social ou festa",
      "Manicure e esmaltação",
      "Preparação e orientações de manutenção",
      "Registro simples do resultado final, quando autorizado",
    ],
    notes: "Proposta indicada para eventos, ensaios e datas especiais. Deslocamento, extensões, acessórios e procedimentos extras podem alterar o valor.",
  },
  {
    id: "multi-servicos-automotivo-revisao-lavagem",
    niche: "Pacotes com vários serviços",
    title: "Revisão + lavagem detalhada",
    serviceName: "Pacote revisão mecânica + cuidado automotivo",
    price: 980,
    deadline: "1 a 2 dias úteis",
    payment: "50% na aprovação e 50% na retirada do veículo",
    included: [
      "Checklist mecânico preventivo",
      "Scanner básico e verificação de fluidos",
      "Inspeção de freios, suspensão e itens de segurança",
      "Lavagem técnica externa",
      "Aspiração e limpeza interna detalhada",
      "Relatório do veículo com recomendações",
    ],
    notes: "Peças, óleo, filtros, produtos premium, serviços adicionais e reparos identificados no diagnóstico devem ser aprovados separadamente antes da execução.",
  },
];

export const proposalTemplates: ProposalTemplate[] = [
  ...multiServiceTemplates,
  ...[...templateSeeds, ...broadSegmentTemplateSeeds].flatMap((seed) =>
  seed.services.flatMap((service, serviceIndex) =>
    templateLevels.map((level) => {
      const price = roundPrice(service.price * level.multiplier);
      return {
        id: `${slug(seed.niche)}-${slug(service.title)}-${level.id}-${serviceIndex + 1}`,
        niche: seed.niche,
        title: level.prefix ? `${level.prefix}: ${service.title}` : service.title,
        serviceName: level.label === "Padrão" ? service.serviceName : `${service.serviceName} - ${level.label}`,
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
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function defaultPayment(price: number) {
  if (price <= 300) return "Pagamento no atendimento ou na entrega";
  if (price <= 1000) return "50% para reservar e 50% na conclusão";
  return "40% entrada, 30% desenvolvimento e 30% entrega";
}

function roundPrice(price: number) {
  if (price < 200) return Math.max(50, Math.round(price / 10) * 10);
  return Math.max(100, Math.round(price / 50) * 50);
}

function defaultNotes(niche: string) {
  return `Valores podem variar conforme escopo, deslocamento, urgência e necessidades específicas do cliente. Template base para ${niche}.`;
}

export function findProposalTemplate(templateId?: string | null) {
  return proposalTemplates.find((template) => template.id === templateId) || null;
}

export const proposalTemplateNiches = [...new Set([...templateSeeds, ...broadSegmentTemplateSeeds].map((seed) => seed.niche))];

export function isBusinessSegment(value?: string | null): value is BusinessSegment {
  return businessSegments.some((segment) => segment.value === value);
}

export function filterReadyProposalTemplates(niche?: string | null, segment?: string | null) {
  if (!niche || !isBusinessSegment(segment)) return [];
  const normalizedNiche = normalizeNiche(niche);
  return proposalTemplates.filter(
    (template) => normalizeNiche(template.niche) === normalizedNiche && templateSegment(template.niche) === segment,
  );
}

function templateSegment(niche: string): BusinessSegment {
  const value = normalizeNiche(niche);

  if (hasAny(value, ["automot", "lava jato", "funilaria"])) return "automotive";
  if (hasAny(value, ["beleza", "estetica"])) return "beauty";
  if (hasAny(value, ["saude", "fitness", "psicologia", "nutricao", "odontologia", "terapia"])) return "health";
  if (hasAny(value, ["evento", "buffet", "fotografia", "audiovisual"])) return "events";
  if (hasAny(value, ["aula", "educacao"])) return "education";
  if (hasAny(value, ["pet", "veterinaria"])) return "pet";
  if (hasAny(value, ["gastronomia"])) return "food";
  if (hasAny(value, ["imove", "imobiliaria", "condominio"])) return "real_estate";
  if (hasAny(value, ["moda", "varejo", "costura", "ecommerce", "brindes"])) return "fashion_retail";
  if (hasAny(value, ["transporte", "logistica"])) return "transport";
  if (hasAny(value, ["financeiro", "seguros"])) return "finance";
  if (hasAny(value, ["industria", "metalurgia", "serralheria"])) return "industry";
  if (hasAny(value, ["agro", "rural"])) return "agriculture";
  if (hasAny(value, ["turismo", "hospedagem"])) return "tourism";
  if (hasAny(value, ["seguranca"])) return "security";
  if (hasAny(value, ["social", "designer", "tecnologia", "marketing", "grafica", "video", "eletronico", "redes", "internet", "telecom"])) return "technology";
  if (hasAny(value, ["arquitetura", "reforma", "limpeza", "engenharia", "solar", "climat", "marcenaria", "jardinagem", "dedet", "piscina", "ceramica", "acabamento", "tecnico", "moveis"])) return "home_reform";
  if (hasAny(value, ["consultoria", "advocacia", "contabilidade", "coaching", "recursos humanos", "ambiental", "comercial", "administracao", "equipamentos"])) return "business";
  return "general";
}

function normalizeNiche(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

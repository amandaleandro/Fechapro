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
      ["Gestão mensal de Instagram", "Gestão de redes sociais", 1200, "30 dias", ["Planejamento editorial", "12 posts feed", "8 stories", "Legenda estratégica", "Relatório mensal"]],
      ["Calendário de conteúdo", "Planejamento de conteúdo mensal", 650, "7 dias úteis", ["Pesquisa de temas", "Calendário mensal", "Sugestoes de formatos", "Chamadas para ação", "Linha editorial"]],
      ["Pacote de Reels", "Criação de Reels para Instagram", 900, "10 dias úteis", ["Roteiros", "Edição de 6 videos", "Legendas", "Capas simples", "Orientação de postagem"]],
    ].map(toService),
  },
  {
    niche: "Designer",
    services: [
      ["Identidade visual", "Identidade visual profissional", 1500, "10 dias úteis", ["Logo principal", "Logo secundario", "Paleta de cores", "Tipografia", "Mini manual da marca"]],
      ["Artes para campanha", "Pacote de artes digitais", 700, "5 dias úteis", ["5 artes para feed", "5 stories", "Adaptação de textos", "Arquivos finais", "1 rodada de ajustes"]],
      ["Cardapio digital", "Design de cardapio digital", 480, "4 dias úteis", ["Organização dos itens", "Layout visual", "PDF final", "Versao para WhatsApp", "Ajustes combinados"]],
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
      ["Consultoria de ambiente", "Consultoria de decoração", 750, "7 dias úteis", ["Reuniao de briefing", "Diagnóstico do ambiente", "Sugestao de layout", "Paleta de referencias", "Lista de melhorias"]],
      ["Projeto executivo", "Projeto executivo residencial", 5200, "35 dias úteis", ["Plantas técnicas", "Detalhamentos", "Compatibilização básica", "Memorial descritivo", "Entrega em PDF"]],
    ].map(toService),
  },
  {
    niche: "Consultoria",
    services: [
      ["Consultoria estrategica", "Consultoria estrategica personalizada", 1800, "4 semanas", ["Diagnóstico", "Plano de ação", "4 encontros online", "Material de apoio", "Suporte por mensagem"]],
      ["Mentoria individual", "Mentoria individual", 1200, "30 dias", ["Sessao inicial", "3 encontros de acompanhamento", "Plano de prioridades", "Suporte por mensagem", "Resumo final"]],
      ["Diagnóstico de negocio", "Diagnóstico comercial", 900, "10 dias úteis", ["Coleta de informações", "Análise do funil", "Mapa de gargalos", "Recomendações", "Reuniao de devolutiva"]],
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
    niche: "Mecanica automotiva",
    services: [
      ["Revisao preventiva", "Revisao preventiva automotiva", 480, "1 dia útil", ["Checklist mecanico", "Verificação de fluidos", "Inspeção de freios e suspensao", "Scanner básico", "Relatório do veiculo"]],
      ["Troca de oleo e filtros", "Troca de oleo e filtros", 260, "Atendimento em 2 horas", ["Oleo conforme especificação", "Filtro de oleo", "Verificação de filtros adicionais", "Conferência de vazamentos", "Registro da quilometragem"]],
      ["Freios e suspensão", "Manutenção de freios e suspensão", 850, "1 a 2 dias úteis", ["Diagnóstico inicial", "Desmontagem e inspeção", "Substituição de peças combinadas", "Teste de rodagem", "Garantia de 30 dias"]],
      ["Diagnóstico completo", "Diagnóstico mecanico completo", 350, "Atendimento em 3 horas", ["Scanner automotivo", "Análise de ruidos", "Verificação de motor", "Teste de funcionamento", "Orçamento detalhado dos reparos"]],
    ].map(toService),
  },
  {
    niche: "Lava jato",
    services: [
      ["Lavagem completa", "Lavagem completa de veiculo", 90, "Atendimento em 1 hora", ["Lavagem externa", "Aspiração interna", "Limpeza de painel", "Pretinho nos pneus", "Finalização básica"]],
      ["Lavagem detalhada", "Lavagem detalhada automotiva", 180, "Atendimento em 2 horas", ["Pre-lavagem", "Lavagem técnica", "Limpeza interna detalhada", "Limpeza de rodas e caixas", "Finalização com cera liquida"]],
      ["Higienização interna", "Higienização interna automotiva", 320, "Atendimento em 4 horas", ["Aspiração profunda", "Limpeza de bancos", "Limpeza de carpetes", "Higienização de painel e portas", "Orientação de secagem"]],
      ["Plano mensal de lavagem", "Plano mensal de lavagem automotiva", 280, "4 atendimentos mensais", ["4 lavagens completas", "Agendamento prioritario", "Aspiração interna", "Finalização dos pneus", "Controle dos atendimentos"]],
    ].map(toService),
  },
  {
    niche: "Auto eletrica",
    services: [
      ["Diagnóstico eletrico", "Diagnóstico eletrico automotivo", 280, "Atendimento em 2 horas", ["Scanner e testes eletricos", "Verificação de bateria", "Análise de alternador", "Teste de fusivel e rele", "Relatório do problema"]],
      ["Instalação de acessorios", "Instalação de acessorios automotivos", 420, "1 dia útil", ["Briefing do acessorio", "Instalação eletrica", "Organização de chicote", "Teste de funcionamento", "Orientação de uso"]],
      ["Bateria e alternador", "Manutenção de bateria e alternador", 520, "1 dia útil", ["Teste de carga", "Verificação de cabos", "Diagnóstico do alternador", "Substituicao combinada", "Garantia de 30 dias"]],
    ].map(toService),
  },
  {
    niche: "Estetica automotiva",
    services: [
      ["Polimento técnico", "Polimento técnico automotivo", 650, "1 a 2 dias úteis", ["Lavagem técnica", "Descontaminação da pintura", "Polimento em etapas", "Proteção final", "Orientações de manutenção"]],
      ["Vitrificação de pintura", "Vitrificação automotiva", 1200, "2 dias úteis", ["Lavagem técnica", "Descontaminação", "Polimento preparatorio", "Aplicação de vitrificador", "Cura e entrega orientada"]],
      ["Revitalização de farol", "Revitalização de farois", 180, "Atendimento em 2 horas", ["Lixamento técnico", "Polimento do farol", "Aplicação de protecao", "Teste visual", "Orientações de cuidado"]],
    ].map(toService),
  },
  {
    niche: "Beleza",
    services: [
      ["Pacote de unhas", "Manicure e alongamento", 160, "Atendimento em 2 horas", ["Cutilagem", "Esmaltação", "Alongamento ou manutenção", "Finalização hidratante", "Garantia de 7 dias"]],
      ["Protocolo estetico", "Protocolo estetico personalizado", 350, "Sessao de 60 a 90 minutos", ["Avaliação inicial", "Higienização", "Procedimento principal", "Orientações de cuidado", "Acompanhamento por mensagem"]],
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
      ["Instalação hidraulica", "Reparo e instalação hidraulica", 380, "1 dia útil", ["Diagnóstico", "Reparo ou instalação", "Teste de vazamento", "Orientações", "Garantia de 30 dias"]],
    ].map(toService),
  },
  {
    niche: "Limpeza",
    services: [
      ["Limpeza residencial", "Diarista para limpeza completa", 220, "1 diária", ["Limpeza de quartos e sala", "Banheiros", "Cozinha", "Área de serviço", "Organização leve"]],
      ["Limpeza pos-obra", "Limpeza pos-obra", 780, "2 dias úteis", ["Remocao de residuos leves", "Limpeza de pisos", "Banheiros", "Vidros acessiveis", "Finalização do ambiente"]],
      ["Higienização de estofado", "Higienização de sofá e estofados", 260, "Atendimento em 2 horas", ["Aspiração", "Aplicação de produto", "Extração", "Secagem orientada", "Garantia do serviço"]],
    ].map(toService),
  },
  {
    niche: "Saúde e fitness",
    services: [
      ["Plano mensal de treino", "Acompanhamento personal trainer", 700, "4 semanas", ["Avaliação fisica", "Plano de treino", "8 aulas presenciais ou online", "Ajustes semanais", "Suporte por WhatsApp"]],
      ["Consulta nutricional", "Plano alimentar personalizado", 420, "7 dias úteis", ["Anamnese", "Plano alimentar", "Lista de substituicoes", "Orientações", "Retorno online"]],
      ["Pilates individual", "Pacote de aulas de pilates", 480, "4 semanas", ["Avaliação inicial", "4 aulas", "Ajustes de exercicios", "Orientações", "Acompanhamento"]],
    ].map(toService),
  },
  {
    niche: "Tecnologia",
    services: [
      ["Site one page", "Criação de site one page", 1800, "15 dias úteis", ["Briefing", "Layout responsivo", "Página publicada", "Formulário de contato", "Ajustes finais"]],
      ["Landing page", "Landing page de vendas", 1400, "10 dias úteis", ["Copy base", "Layout responsivo", "Formulario", "Integração simples", "Publicação"]],
      ["Manutenção de computador", "Formatação e otimização de computador", 250, "2 dias úteis", ["Backup orientado", "Formatação", "Instalação básica", "Atualizações", "Teste final"]],
      ["Automação simples", "Automação de processo com planilha", 900, "12 dias úteis", ["Mapeamento do processo", "Planilha estruturada", "Automações básicas", "Teste", "Treinamento rápido"]],
    ].map(toService),
  },
  {
    niche: "Eventos",
    services: [
      ["Cerimonial", "Cerimonial para evento", 2200, "Conforme data do evento", ["Reuniao inicial", "Roteiro do evento", "Coordenação no dia", "Equipe base", "Checklist final"]],
      ["Decoração de festa", "Decoração personalizada de evento", 1800, "Conforme data do evento", ["Briefing", "Projeto decorativo", "Montagem", "Desmontagem", "Itens combinados"]],
      ["Buffet pequeno", "Buffet para evento pequeno", 2500, "Conforme data do evento", ["Cardapio combinado", "Preparo", "Equipe de apoio", "Montagem da mesa", "Atendimento"]],
    ].map(toService),
  },
  {
    niche: "Som e audiovisual",
    services: [
      ["Som para evento", "Locação de som para evento", 1500, "Conforme data do evento", ["Briefing técnico", "Sistema de som dimensionado", "Montagem e passagem de som", "Operação durante o evento", "Desmontagem dos equipamentos"]],
      ["Som, luz e DJ", "Pacote som, iluminação e DJ", 2800, "Conforme data do evento", ["DJ para periodo combinado", "Sistema de som", "Iluminação de pista", "Microfone sem fio", "Montagem e acompanhamento técnico"]],
      ["Audiovisual corporativo", "Sonorização e audiovisual para evento corporativo", 3200, "Conforme data do evento", ["Briefing da programação", "Sistema de som", "Projetor ou tela conforme escopo", "Microfones para palestras", "Técnico de operação"]],
    ].map(toService),
  },
  {
    niche: "Moveis planejados",
    services: [
      ["Projeto de cozinha planejada", "Moveis planejados para cozinha", 8500, "30 a 45 dias úteis", ["Medicao do ambiente", "Projeto 3D", "Definicao de acabamentos", "Fabricação dos modulos", "Entrega e instalação"]],
      ["Closet planejado", "Projeto e execução de closet planejado", 6200, "25 a 35 dias úteis", ["Levantamento de medidas", "Projeto de distribuicao interna", "Escolha de materiais", "Fabricação", "Instalação e ajustes finais"]],
      ["Painel e rack sob medida", "Painel e rack planejados para sala", 3800, "20 a 30 dias úteis", ["Medicao técnica", "Projeto visual", "Definicao de ferragens e acabamentos", "Fabricação", "Montagem no local"]],
    ].map(toService),
  },
  {
    niche: "Buffets",
    services: [
      ["Buffet para aniversario", "Buffet completo para aniversario", 3200, "Conforme data do evento", ["Cardapio personalizado", "Preparo dos alimentos", "Equipe de apoio", "Montagem da mesa", "Atendimento durante o evento"]],
      ["Buffet corporativo", "Buffet corporativo para reuniao ou evento", 2600, "Conforme data do evento", ["Cardapio combinado", "Coffee break ou refeicao", "Bebidas conforme escopo", "Montagem e reposicao", "Itens descartaveis ou loucas combinadas"]],
      ["Buffet para casamento", "Buffet para casamento e recepção", 9800, "Conforme data do evento", ["Degustação ou alinhamento de cardápio", "Entrada, prato principal e sobremesa", "Equipe de cozinha e salão", "Montagem do serviço", "Coordenação com cerimonial"]],
    ].map(toService),
  },
  {
    niche: "Aulas e educação",
    services: [
      ["Aula particular", "Pacote de aulas particulares", 400, "4 semanas", ["Diagnóstico inicial", "4 aulas", "Material de apoio", "Exercicios", "Acompanhamento"]],
      ["Curso rápido", "Treinamento rápido personalizado", 1200, "2 semanas", ["Plano de aulas", "Material digital", "Aulas ao vivo", "Exercicios praticos", "Certificado simples"]],
      ["Reforco escolar", "Reforco escolar mensal", 650, "30 dias", ["Avaliação do aluno", "8 encontros", "Plano de estudo", "Atividades", "Relatório aos responsaveis"]],
    ].map(toService),
  },
  {
    niche: "Pet",
    services: [
      ["Banho e tosa", "Banho e tosa completo", 120, "Atendimento em 2 horas", ["Banho", "Secagem", "Tosa higiênica", "Corte de unhas", "Finalização"]],
      ["Adestramento", "Pacote de adestramento", 900, "4 semanas", ["Avaliação comportamental", "4 aulas", "Exercicios guiados", "Orientação ao tutor", "Acompanhamento"]],
      ["Pet sitter", "Cuidado domiciliar para pet", 280, "Pacote de visitas", ["Visitas combinadas", "Alimentação", "Troca de agua", "Passeio curto", "Relatório ao tutor"]],
    ].map(toService),
  },
  {
    niche: "Gastronomia",
    services: [
      ["Marmitas semanais", "Pacote de marmitas semanais", 280, "Entrega semanal", ["Cardapio semanal", "10 marmitas", "Embalagem", "Entrega local", "Ajustes combinados"]],
      ["Bolos personalizados", "Bolo personalizado", 220, "3 dias úteis", ["Briefing do tema", "Massa e recheio", "Decoração", "Embalagem", "Retirada ou entrega combinada"]],
      ["Coffee break", "Coffee break corporativo", 1500, "Conforme data", ["Cardapio combinado", "Preparo", "Montagem", "Bebidas", "Itens descartaveis"]],
    ].map(toService),
  },
  {
    niche: "Marketing digital",
    services: [
      ["Gestão de tráfego pago", "Gestão de anúncios no Google e Meta Ads", 1400, "Mensal", ["Briefing estratégico", "Configuração de campanhas", "Gestão e otimização mensal", "Relatório quinzenal", "Suporte por WhatsApp"]],
      ["Lancamento de produto", "Estrategia e execução de lancamento digital", 3200, "30 dias", ["Planejamento de lancamento", "Sequencia de e-mails", "Roteiro de conteúdo", "Configuração de campanhas", "Acompanhamento durante o lancamento"]],
      ["Consultoria de performance", "Auditoria e consultoria em tráfego pago", 1800, "15 dias úteis", ["Auditoria das contas de anúncios", "Análise de métricas", "Relatório de oportunidades", "Plano de ação", "Reunião de devolutiva"]],
    ].map(toService),
  },
  {
    niche: "Advocacia",
    services: [
      ["Consultoria jurídica", "Consultoria jurídica personalizada", 600, "5 dias úteis", ["Análise do caso", "Parecer jurídico escrito", "Orientação sobre direitos", "Indicação de próximo passo", "Confidencialidade garantida"]],
      ["Elaboração de contrato", "Elaboração de contrato personalizado", 900, "7 dias úteis", ["Levantamento das clausulas necessárias", "Minuta do contrato", "1 rodada de ajustes", "Versao final em PDF", "Orientação de uso"]],
      ["Acompanhamento de processo", "Acompanhamento processual mensal", 1200, "Mensal", ["Acompanhamento do andamento", "Atualizações periodicas", "Análise de documentos", "Orientação estrategica", "Relatório mensal"]],
    ].map(toService),
  },
  {
    niche: "Contabilidade",
    services: [
      ["Abertura de empresa", "Abertura de CNPJ e registro empresarial", 1500, "20 dias úteis", ["Orientação sobre tipo societario", "Elaboração de contrato social", "Registro na Junta Comercial", "Inscricao estadual e municipal", "Configuração fiscal inicial"]],
      ["Contabilidade mensal MEI", "Serviços contabeis para MEI", 120, "Mensal", ["Declaração anual DASN-SIMEI", "Orientação sobre limite de faturamento", "Emissao de DAS mensal", "Controle básico de faturamento", "Suporte por WhatsApp"]],
      ["BPO financeiro", "Gestão financeira terceirizada", 2200, "Mensal", ["Conciliação bancaria", "Contas a pagar e receber", "Relatório de fluxo de caixa", "DRE mensal simplificado", "Reuniao de acompanhamento"]],
    ].map(toService),
  },
  {
    niche: "Psicologia",
    services: [
      ["Psicoterapia individual", "Acompanhamento psicoterapeuta semanal", 220, "Sessao de 50 minutos", ["Acolhimento inicial", "Escuta qualificada", "Trabalho terapeutico", "Sigilo profissional garantido", "Atendimento presencial ou online"]],
      ["Pacote de sessões", "Pacote de sessões de psicoterapia", 800, "4 semanas", ["4 sessões individuais", "Continuidade do processo terapeutico", "Suporte entre sessões combinado", "Orientações de autocuidado", "Relatório de evolucao"]],
      ["Orientação profissional", "Orientação e aconselhamento profissional", 650, "3 encontros", ["Avaliação de perfil", "3 encontros de orientação", "Exercicios de autoconhecimento", "Mapeamento de habilidades", "Plano de ação pessoal"]],
    ].map(toService),
  },
  {
    niche: "Coaching",
    services: [
      ["Coaching individual", "Processo de coaching individual", 2500, "8 semanas", ["Sessao de diagnóstico", "8 sessões de coaching", "Ferramentas de autoconhecimento", "Plano de metas personalizado", "Suporte entre sessões"]],
      ["Mentoria de negocios", "Mentoria para empreendedores", 1800, "4 semanas", ["Diagnóstico do negocio", "4 encontros de mentoria", "Ferramentas de gestao", "Plano de ação", "Acompanhamento por mensagem"]],
      ["Workshop corporativo", "Workshop de desenvolvimento de equipe", 3500, "1 dia", ["Planejamento do conteúdo", "Dinamicas e atividades", "Material de apoio", "Facilitação do workshop", "Relatório de resultados"]],
    ].map(toService),
  },
  {
    niche: "Nutricao",
    services: [
      ["Plano alimentar", "Plano alimentar personalizado com acompanhamento", 480, "10 dias úteis", ["Anamnese alimentar", "Plano alimentar personalizado", "Lista de substituicoes", "Orientações de habitos", "Retorno de acompanhamento"]],
      ["Reeducação alimentar", "Programa de reeducação alimentar mensal", 780, "4 semanas", ["Avaliação inicial", "Plano alimentar", "2 consultas de acompanhamento", "Ajustes do plano", "Suporte por mensagem"]],
      ["Consultoria para atletas", "Nutricao esportiva personalizada", 650, "15 dias úteis", ["Avaliação de composicao corporal", "Plano alimentar periodizado", "Suplementação orientada", "Estrategias pre e pos-treino", "Retorno quinzenal"]],
    ].map(toService),
  },
  {
    niche: "Odontologia",
    services: [
      ["Clareamento dental", "Clareamento dental profissional", 900, "2 sessões", ["Avaliação inicial", "Moldagem para moldeiras", "2 sessões de clareamento", "Gel de manutenção", "Orientações de pós-tratamento"]],
      ["Protocolo de limpeza", "Limpeza e profilaxia dental", 280, "1 consulta", ["Avaliação bucal", "Remocao de tartaro", "Polimento", "Aplicação de fluor", "Orientação de escovação"]],
      ["Restauração estetica", "Restauração em resina composta", 450, "1 a 2 consultas", ["Avaliação e planejamento", "Anestesia local", "Restauração em resina", "Acabamento e polimento", "Orientações de cuidado"]],
    ].map(toService),
  },
  {
    niche: "Imóveis e condomínios",
    services: [
      ["Vistoria de imóvel", "Vistoria detalhada de imóvel", 450, "2 dias úteis", ["Agendamento da visita", "Registro fotografico", "Checklist de conservação", "Relatório de vistoria", "Orientações finais"]],
      ["Administração de aluguel", "Administração mensal de locação", 380, "Mensal", ["Análise do contrato", "Controle de repasses", "Comunicação com locatario", "Acompanhamento de vencimentos", "Relatório mensal"]],
      ["Gestão condominial", "Consultoria para gestao condominial", 1500, "30 dias", ["Diagnóstico do condominio", "Análise de rotinas", "Plano de melhorias", "Reuniao com conselho", "Relatório executivo"]],
    ].map(toService),
  },
  {
    niche: "Moda e varejo",
    services: [
      ["Visual merchandising", "Organização visual de loja", 900, "5 dias úteis", ["Diagnóstico da loja", "Sugestao de vitrine", "Organização de exposicao", "Lista de melhorias", "Orientação para equipe"]],
      ["Catalogo de produtos", "Catalogo comercial de produtos", 1200, "10 dias úteis", ["Organização de itens", "Textos comerciais", "Layout do catalogo", "PDF final", "Versao para WhatsApp"]],
      ["Implantação de ecommerce", "Cadastro inicial de loja virtual", 1800, "15 dias úteis", ["Configuração da vitrine", "Cadastro de ate 30 produtos", "Organização de categorias", "Ajustes de checkout", "Treinamento rápido"]],
    ].map(toService),
  },
  {
    niche: "Transporte e logística",
    services: [
      ["Frete dedicado", "Transporte dedicado de carga", 850, "Conforme rota", ["Coleta no endereco combinado", "Conferência de volume", "Transporte dedicado", "Entrega no destino", "Comprovante de entrega"]],
      ["Mudanca residencial", "Mudanca residencial planejada", 1800, "1 a 2 dias", ["Visita ou briefing inicial", "Equipe de carregamento", "Transporte dos itens", "Descarregamento no destino", "Organização básica"]],
      ["Roteirização de entregas", "Planejamento de rotas de entrega", 1200, "7 dias úteis", ["Análise de enderecos", "Agrupamento de rotas", "Estimativa de prazos", "Planilha operacional", "Orientação para equipe"]],
    ].map(toService),
  },
  {
    niche: "Financeiro e seguros",
    services: [
      ["Planejamento financeiro", "Planejamento financeiro pessoal", 900, "15 dias úteis", ["Diagnóstico financeiro", "Organização de receitas e despesas", "Plano de prioridades", "Mapa de metas", "Reuniao de devolutiva"]],
      ["Consultoria de seguros", "Consultoria para escolha de seguro", 450, "5 dias úteis", ["Levantamento de necessidade", "Comparativo de opcoes", "Explicação de coberturas", "Orientação de contratação", "Suporte inicial"]],
      ["Análise de credito", "Análise e orientação de credito", 650, "7 dias úteis", ["Coleta de informações", "Análise de perfil", "Simulação de cenarios", "Plano de regularização", "Proximos passos"]],
    ].map(toService),
  },
  {
    niche: "Indústria e manutenção",
    services: [
      ["Manutenção industrial", "Manutenção preventiva de equipamento", 2200, "3 a 5 dias úteis", ["Inspeção inicial", "Checklist técnico", "Execução da manutenção", "Teste operacional", "Relatório técnico"]],
      ["Projeto de melhoria", "Adequação técnica de processo", 4800, "30 dias úteis", ["Mapeamento do processo", "Diagnóstico de gargalos", "Plano de melhoria", "Implantação acompanhada", "Relatório final"]],
      ["Solda e fabricação", "Serviço de solda e fabricação metalica", 1600, "7 dias úteis", ["Levantamento de medidas", "Preparação de material", "Fabricação ou reparo", "Acabamento", "Conferência final"]],
    ].map(toService),
  },
  {
    niche: "Agro e rural",
    services: [
      ["Consultoria rural", "Consultoria para propriedade rural", 1800, "15 dias úteis", ["Visita ou briefing remoto", "Diagnóstico da área", "Plano de ação", "Lista de insumos", "Acompanhamento inicial"]],
      ["Sistema de irrigação", "Instalação de sistema de irrigação", 3500, "10 dias úteis", ["Levantamento da área", "Projeto básico", "Instalação dos pontos", "Teste de funcionamento", "Orientação de uso"]],
      ["Manutenção de maquina agricola", "Manutenção preventiva de maquina agricola", 1200, "2 dias úteis", ["Checklist mecanico", "Verificação de fluidos", "Ajustes preventivos", "Teste operacional", "Relatório do equipamento"]],
    ].map(toService),
  },
  {
    niche: "Turismo e hospedagem",
    services: [
      ["Roteiro personalizado", "Planejamento de viagem personalizado", 650, "7 dias úteis", ["Briefing de preferencias", "Roteiro por dia", "Sugestao de hospedagem", "Mapa de passeios", "Orientações de reserva"]],
      ["Pacote de hospedagem", "Pacote de hospedagem e experiência", 1800, "Conforme datas", ["Reserva de hospedagem", "Sugestão de atividades", "Informações de chegada", "Suporte pré-viagem", "Condições de cancelamento"]],
      ["Excursao em grupo", "Organização de excursao em grupo", 4200, "Conforme data", ["Planejamento de roteiro", "Transporte combinado", "Controle de participantes", "Acompanhamento da viagem", "Orientações gerais"]],
    ].map(toService),
  },
  {
    niche: "Segurança eletronica",
    services: [
      ["Instalação de cameras", "Instalação de sistema CFTV", 2200, "3 dias úteis", ["Visita técnica", "Definicao dos pontos", "Instalação de cameras", "Configuração do acesso remoto", "Treinamento de uso"]],
      ["Alarme e sensores", "Instalação de alarme e sensores", 1600, "2 dias úteis", ["Diagnóstico do local", "Definicao dos sensores", "Instalação dos equipamentos", "Teste de disparo", "Orientação ao cliente"]],
      ["Controle de acesso", "Controle de acesso para empresa ou condominio", 3800, "7 dias úteis", ["Mapeamento de entradas", "Definicao de equipamentos", "Instalação e configuração", "Cadastro inicial", "Treinamento da equipe"]],
    ].map(toService),
  },
];

const templateLevels = [
  { id: "essencial", label: "Essencial", multiplier: 0.75, prefix: "Pacote essencial", extra: "Entrega enxuta com foco no principal combinado." },
  { id: "padrao", label: "Padrao", multiplier: 1, prefix: "", extra: "Entrega equilibrada para atender o escopo principal." },
  { id: "completo", label: "Completo", multiplier: 1.45, prefix: "Pacote completo", extra: "Inclui acompanhamento mais próximo e maior detalhamento da entrega." },
];

const broadSegmentTemplateSeeds: TemplateSeed[] = [
  {
    niche: "Engenharia",
    services: [
      ["Laudo técnico", "Laudo técnico de engenharia", 1800, "10 dias úteis", ["Visita técnica", "Registro fotografico", "Análise normativa", "Emissao de laudo", "ART ou RRT quando aplicavel"]],
      ["Projeto estrutural", "Projeto estrutural residencial", 6500, "30 dias úteis", ["Briefing do projeto", "Calculo estrutural", "Pranchas técnicas", "Memorial descritivo", "Compatibilização básica"]],
      ["Regularização de obra", "Regularização técnica de imóvel", 3200, "20 dias úteis", ["Análise documental", "Levantamento do imóvel", "Plantas necessárias", "Acompanhamento do protocolo", "Orientações finais"]],
    ].map(toService),
  },
  {
    niche: "Energia solar",
    services: [
      ["Projeto fotovoltaico", "Projeto e instalação de energia solar", 18500, "30 a 45 dias úteis", ["Análise de consumo", "Dimensionamento do sistema", "Projeto homologado", "Instalação dos paineis", "Comissionamento"]],
      ["Homologação solar", "Homologação de sistema fotovoltaico", 2200, "15 dias úteis", ["Conferência técnica", "Documentação da concessionaria", "Acompanhamento do processo", "Ajustes solicitados", "Liberação orientada"]],
      ["Manutenção solar", "Manutenção preventiva de energia solar", 750, "1 dia útil", ["Inspeção visual", "Limpeza dos modulos", "Verificação de inversor", "Teste de geração", "Relatório técnico"]],
    ].map(toService),
  },
  {
    niche: "Climatização",
    services: [
      ["Instalação de ar-condicionado", "Instalação de ar-condicionado split", 850, "1 dia útil", ["Visita ou briefing técnico", "Instalação da evaporadora e condensadora", "Tubulação básica", "Teste de funcionamento", "Orientações de uso"]],
      ["Limpeza de ar-condicionado", "Higienização de ar-condicionado", 220, "Atendimento em 2 horas", ["Desmontagem parcial", "Limpeza de filtros", "Higienização interna", "Teste final", "Etiqueta de manutenção"]],
      ["PMOC", "Plano de manutenção de climatização", 1800, "Mensal", ["Inventario dos equipamentos", "Cronograma de manutenção", "Execução preventiva", "Relatório mensal", "Controle de chamados"]],
    ].map(toService),
  },
  {
    niche: "Marcenaria",
    services: [
      ["Movel sob medida", "Movel sob medida personalizado", 4200, "25 a 35 dias úteis", ["Medicao técnica", "Projeto visual", "Definicao de materiais", "Fabricação", "Entrega e montagem"]],
      ["Reparo de moveis", "Reparo e ajuste de moveis", 650, "5 dias úteis", ["Avaliação do item", "Troca ou ajuste de ferragens", "Reparo estrutural leve", "Acabamento", "Teste de uso"]],
      ["Painel ripado", "Painel decorativo sob medida", 2800, "15 a 20 dias úteis", ["Medicao do ambiente", "Definicao de madeira ou MDF", "Fabricação", "Instalação", "Acabamento final"]],
    ].map(toService),
  },
  {
    niche: "Jardinagem e paisagismo",
    services: [
      ["Projeto de paisagismo", "Projeto de paisagismo residencial", 2500, "15 dias úteis", ["Briefing do espaco", "Estudo de especies", "Layout paisagistico", "Lista de plantas", "Orientações de manutenção"]],
      ["Manutenção de jardim", "Manutenção periodica de jardim", 480, "Atendimento mensal", ["Poda leve", "Limpeza dos canteiros", "Adubação básica", "Controle visual de pragas", "Relatório simples"]],
      ["Implantação de jardim", "Implantação de jardim completo", 5200, "7 a 12 dias úteis", ["Preparo do solo", "Fornecimento de mudas combinadas", "Plantio", "Acabamento com substrato", "Primeira irrigação orientada"]],
    ].map(toService),
  },
  {
    niche: "Dedetização e controle de pragas",
    services: [
      ["Dedetização residencial", "Controle de pragas residencial", 420, "Atendimento em 2 horas", ["Inspeção do local", "Aplicação direcionada", "Produtos regularizados", "Orientações de segurança", "Garantia combinada"]],
      ["Controle empresarial", "Controle integrado de pragas para empresa", 1200, "Mensal", ["Mapeamento de pontos criticos", "Aplicação programada", "Iscas e barreiras", "Relatório técnico", "Monitoramento mensal"]],
      ["Descupinização", "Tratamento contra cupins", 1800, "1 a 2 dias úteis", ["Identificação dos focos", "Tratamento localizado", "Barreira quimica quando aplicavel", "Orientações preventivas", "Retorno técnico"]],
    ].map(toService),
  },
  {
    niche: "Grafica e comunicação visual",
    services: [
      ["Material impresso", "Impressao de material grafico", 650, "5 dias úteis", ["Conferência dos arquivos", "Prova digital", "Impressao", "Acabamento combinado", "Entrega ou retirada"]],
      ["Fachada e adesivos", "Comunicação visual para fachada", 2400, "10 dias úteis", ["Medicao do local", "Layout de fachada", "Producao dos adesivos ou placa", "Instalação", "Acabamento final"]],
      ["Brindes personalizados", "Brindes corporativos personalizados", 1800, "15 dias úteis", ["Selecao dos itens", "Aplicação da marca", "Prova de personalização", "Producao", "Entrega dos brindes"]],
    ].map(toService),
  },
  {
    niche: "Video e producao audiovisual",
    services: [
      ["Video institucional", "Video institucional para empresa", 4500, "20 dias úteis", ["Roteiro", "Captação de imagens", "Edição", "Trilha ou banco de audio", "Arquivo final para web"]],
      ["Cobertura em video", "Filmagem de evento", 2800, "10 dias úteis apos evento", ["Cobertura de ate 4 horas", "Captação de audio ambiente", "Edição de melhores momentos", "Entrega digital", "Backup temporario"]],
      ["Video para redes sociais", "Pacote de videos curtos", 1600, "10 dias úteis", ["Roteiros simples", "Captação ou edicao de material enviado", "6 videos verticais", "Legendas embutidas", "Capas simples"]],
    ].map(toService),
  },
  {
    niche: "Imobiliaria e corretagem",
    services: [
      ["Avaliação de imóvel", "Avaliação comercial de imóvel", 650, "5 dias úteis", ["Levantamento de dados", "Análise comparativa", "Sugestao de valor", "Relatório simples", "Orientação de estrategia"]],
      ["Captação e venda", "Intermediação de venda de imóvel", 4500, "Conforme negociação", ["Análise documental inicial", "Divulgação do imóvel", "Atendimento a interessados", "Negociação", "Acompanhamento ate assinatura"]],
      ["Locação assistida", "Intermediação de locação", 900, "15 dias úteis", ["Anuncio do imóvel", "Triagem de interessados", "Visitas", "Análise cadastral", "Contrato de locação"]],
    ].map(toService),
  },
  {
    niche: "Serralheria e metalurgia",
    services: [
      ["Portao sob medida", "Fabricação de portao metalico", 4800, "20 dias úteis", ["Medicao do vao", "Projeto do portao", "Fabricação metalica", "Pintura básica", "Instalação"]],
      ["Grade de protecao", "Grade ou guarda-corpo sob medida", 2600, "15 dias úteis", ["Levantamento de medidas", "Definicao de modelo", "Fabricação", "Acabamento", "Fixação no local"]],
      ["Reparo de estrutura", "Reparo de estrutura metalica", 1200, "5 dias úteis", ["Inspeção da estrutura", "Solda ou reforco", "Tratamento de pontos criticos", "Pintura de retoque", "Conferência final"]],
    ].map(toService),
  },
  {
    niche: "Piscinas",
    services: [
      ["Manutenção de piscina", "Manutenção e limpeza de piscina", 380, "Atendimento semanal", ["Limpeza fisica", "Aspiração", "Análise da agua", "Aplicação de produtos", "Orientações de uso"]],
      ["Reforma de piscina", "Reforma e revitalização de piscina", 7800, "20 a 30 dias úteis", ["Diagnóstico estrutural", "Remocao de revestimentos danificados", "Impermeabilização quando aplicavel", "Novo acabamento", "Teste de estanqueidade"]],
      ["Casa de maquinas", "Instalação de bomba e filtro", 2400, "3 dias úteis", ["Análise hidraulica", "Instalação dos equipamentos", "Conexoes e registros", "Teste de circulação", "Treinamento de uso"]],
    ].map(toService),
  },
  {
    niche: "Confeccao e costura",
    services: [
      ["Uniformes profissionais", "Confeccao de uniformes personalizados", 2500, "20 dias úteis", ["Definicao de modelo", "Grade de tamanhos", "Prova inicial", "Confeccao", "Entrega embalada"]],
      ["Ajustes de roupas", "Ajustes e reparos de roupas", 180, "3 dias úteis", ["Prova ou medidas", "Ajuste de barra ou cintura", "Reparo de costura", "Passadoria simples", "Entrega final"]],
      ["Peça sob medida", "Roupa sob medida personalizada", 1200, "15 dias úteis", ["Briefing do modelo", "Tirada de medidas", "Prova intermediária", "Confecção", "Ajuste final"]],
    ].map(toService),
  },
  {
    niche: "Ecommerce e marketplace",
    services: [
      ["Cadastro de produtos", "Cadastro otimizado de produtos", 900, "7 dias úteis", ["Organização de informações", "Cadastro de ate 50 produtos", "Titulos e descricoes", "Categorias", "Conferência final"]],
      ["Implantação de loja", "Implantação de ecommerce", 3500, "20 dias úteis", ["Configuração da plataforma", "Tema visual base", "Meios de pagamento", "Frete", "Treinamento rápido"]],
      ["Gestão de marketplace", "Gestão mensal de marketplace", 1800, "Mensal", ["Monitoramento de anúncios", "Ajustes de preços", "Acompanhamento de pedidos", "Relatório mensal", "Suporte operacional"]],
    ].map(toService),
  },
  {
    niche: "Recursos humanos",
    services: [
      ["Recrutamento e selecao", "Processo seletivo completo", 2200, "20 dias úteis", ["Alinhamento da vaga", "Divulgação", "Triagem de curriculos", "Entrevistas", "Shortlist de candidatos"]],
      ["Treinamento interno", "Treinamento corporativo para equipe", 3200, "1 dia", ["Diagnóstico da demanda", "Conteúdo personalizado", "Material de apoio", "Facilitação", "Relatório de presença"]],
      ["Cargos e salarios", "Projeto de cargos e salarios", 6800, "45 dias úteis", ["Mapeamento de funcoes", "Descricao de cargos", "Pesquisa salarial", "Trilhas de crescimento", "Relatório final"]],
    ].map(toService),
  },
  {
    niche: "Veterinaria",
    services: [
      ["Consulta veterinaria", "Consulta veterinaria clinica", 180, "Atendimento agendado", ["Anamnese", "Exame clinico", "Orientações ao tutor", "Receita quando aplicavel", "Retorno combinado"]],
      ["Vacinas e check-up", "Check-up preventivo pet", 420, "Atendimento em 1 hora", ["Consulta", "Carteira vacinal", "Exames básicos quando combinados", "Orientações preventivas", "Plano de acompanhamento"]],
      ["Atendimento domiciliar", "Consulta veterinaria domiciliar", 350, "Conforme agenda", ["Deslocamento local", "Consulta no domicilio", "Avaliação do ambiente", "Orientações ao tutor", "Encaminhamento se necessario"]],
    ].map(toService),
  },
  {
    niche: "Terapias e bem-estar",
    services: [
      ["Massoterapia", "Sessão de massoterapia", 160, "Sessão de 60 minutos", ["Anamnese rápida", "Técnica combinada", "Ambiente preparado", "Orientações pós-sessão", "Acompanhamento simples"]],
      ["Terapia holística", "Sessão de terapia integrativa", 220, "Sessão de 60 a 90 minutos", ["Escuta inicial", "Técnica escolhida", "Plano de cuidado", "Orientações", "Retorno opcional"]],
      ["Pacote bem-estar", "Pacote mensal de bem-estar", 720, "4 semanas", ["4 sessões", "Acompanhamento de evolucao", "Orientações semanais", "Ajustes de abordagem", "Suporte por mensagem"]],
    ].map(toService),
  },
  {
    niche: "Assistência técnica eletrônicos",
    services: [
      ["Reparo de celular", "Reparo técnico de smartphone", 380, "1 a 3 dias úteis", ["Diagnóstico", "Orçamento de peça", "Substituição ou reparo", "Teste final", "Garantia do serviço"]],
      ["Reparo de notebook", "Manutenção de notebook", 450, "2 a 5 dias úteis", ["Diagnóstico de hardware e software", "Limpeza interna", "Otimização", "Troca de peça quando aprovada", "Teste de desempenho"]],
      ["Manutenção de impressora", "Manutenção de impressora", 320, "2 dias úteis", ["Diagnóstico", "Limpeza técnica", "Ajuste de mecanismo", "Teste de impressao", "Orientações de uso"]],
    ].map(toService),
  },
  {
    niche: "Instalação de redes e internet",
    services: [
      ["Rede Wi-Fi empresarial", "Instalação de rede Wi-Fi", 2200, "5 dias úteis", ["Mapeamento do ambiente", "Definicao de pontos", "Instalação de equipamentos", "Configuração", "Teste de cobertura"]],
      ["Cabeamento estruturado", "Cabeamento de rede estruturado", 4800, "10 dias úteis", ["Projeto dos pontos", "Passagem de cabos", "Organização de rack", "Certificação básica", "Identificação dos pontos"]],
      ["Suporte mensal TI", "Suporte técnico mensal de TI", 1800, "Mensal", ["Atendimento remoto", "Visitas combinadas", "Monitoramento básico", "Suporte a usuarios", "Relatório mensal"]],
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
      ["Locação para obra", "Locação de equipamentos para obra", 1200, "Periodo combinado", ["Reserva dos equipamentos", "Entrega local", "Orientação de uso", "Retirada", "Checklist de devolucao"]],
      ["Locação audiovisual", "Locação de projetor e tela", 650, "Diaria", ["Equipamentos testados", "Entrega ou retirada", "Montagem básica", "Suporte inicial", "Conferência na devolucao"]],
      ["Locação para festa", "Locação de mesas, cadeiras e itens para evento", 1400, "Conforme data", ["Reserva dos itens", "Separação e conferencia", "Entrega", "Retirada", "Reposicao por avaria quando aplicavel"]],
    ].map(toService),
  },
  {
    niche: "Brindes e presentes personalizados",
    services: [
      ["Kit corporativo", "Kit corporativo personalizado", 2800, "15 dias úteis", ["Curadoria dos itens", "Personalização com marca", "Embalagem", "Montagem dos kits", "Entrega"]],
      ["Canecas e camisetas", "Produtos personalizados para campanha", 1600, "10 dias úteis", ["Arte base", "Prova digital", "Producao", "Conferência de qualidade", "Entrega"]],
      ["Lembrancas de evento", "Lembrancas personalizadas para evento", 2200, "20 dias úteis", ["Definicao do tema", "Amostra ou prova visual", "Producao em quantidade", "Embalagem individual", "Entrega programada"]],
    ].map(toService),
  },
  {
    niche: "Telecomunicações",
    services: [
      ["PABX e telefonia", "Instalação de PABX ou telefonia IP", 4200, "10 dias úteis", ["Levantamento de ramais", "Configuração da central", "Instalação dos aparelhos", "Testes de chamada", "Treinamento"]],
      ["Internet empresarial", "Projeto de conectividade empresarial", 3500, "15 dias úteis", ["Análise da demanda", "Desenho da solucao", "Configuração de roteadores", "Politicas básicas", "Teste de estabilidade"]],
      ["Manutenção telecom", "Suporte técnico de telecomunicações", 1500, "Mensal", ["Atendimento remoto", "Monitoramento básico", "Ajustes de configuração", "Chamados incluidos", "Relatório mensal"]],
    ].map(toService),
  },
  {
    niche: "Ambiental",
    services: [
      ["Licenciamento ambiental", "Consultoria para licenciamento ambiental", 6500, "45 dias úteis", ["Análise inicial", "Documentação técnica", "Protocolos", "Acompanhamento de exigencias", "Relatório final"]],
      ["Gestão de residuos", "Plano de gestao de residuos", 3800, "25 dias úteis", ["Diagnóstico dos residuos", "Classificação", "Plano de manejo", "Fornecedores indicados", "Treinamento rápido"]],
      ["Relatório ambiental", "Relatório técnico ambiental", 2800, "15 dias úteis", ["Visita técnica", "Coleta de dados", "Análise de impactos", "Recomendações", "Entrega em PDF"]],
    ].map(toService),
  },
  {
    niche: "Eventos infantis e recreação",
    services: [
      ["Recreação infantil", "Equipe de recreação para festa", 1200, "Conforme data do evento", ["Briefing da faixa etaria", "2 recreadores", "Brincadeiras dirigidas", "Materiais básicos", "Acompanhamento durante a festa"]],
      ["Personagem vivo", "Personagem tematico para evento", 850, "Periodo de 1 hora", ["Personagem caracterizado", "Entrada especial", "Fotos com convidados", "Interação dirigida", "Alinhamento previo"]],
      ["Oficina criativa", "Oficina infantil para evento", 1400, "Conforme data", ["Planejamento da atividade", "Materiais para participantes", "Monitoria", "Organização do espaco", "Entrega dos itens produzidos"]],
    ].map(toService),
  },
  {
    niche: "Ceramica, vidro e acabamentos",
    services: [
      ["Instalação de porcelanato", "Assentamento de porcelanato", 3200, "7 a 12 dias úteis", ["Avaliação do contrapiso", "Paginação simples", "Assentamento", "Rejunte", "Limpeza final"]],
      ["Box de banheiro", "Instalação de box de vidro", 1200, "7 dias úteis", ["Medicao técnica", "Producao do vidro", "Instalação", "Vedação", "Orientações de manutenção"]],
      ["Bancada sob medida", "Bancada de pedra ou marmore", 3800, "15 dias úteis", ["Medicao", "Escolha do material", "Corte e acabamento", "Instalação", "Conferência final"]],
    ].map(toService),
  },
  {
    niche: "Estrategia comercial e vendas",
    services: [
      ["Funil de vendas", "Implantação de funil comercial", 4200, "30 dias úteis", ["Diagnóstico comercial", "Desenho das etapas", "Scripts de abordagem", "Indicadores", "Treinamento da equipe"]],
      ["CRM", "Implantação de CRM", 3500, "20 dias úteis", ["Mapeamento do processo", "Configuração do CRM", "Importação inicial", "Automações básicas", "Treinamento"]],
      ["Treinamento de vendas", "Treinamento comercial para equipe", 2800, "1 dia", ["Briefing", "Conteúdo personalizado", "Dinâmicas práticas", "Material de apoio", "Plano de ação"]],
    ].map(toService),
  },
  {
    niche: "Administração publica e terceiro setor",
    services: [
      ["Projeto para edital", "Elaboração de projeto para edital", 3500, "20 dias úteis", ["Leitura do edital", "Estrutura do projeto", "Orçamento base", "Documentos de apoio", "Revisao final"]],
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
      "12 posts para feed com legendas estrategicas",
      "8 stories editaveis para divulgação",
      "Calendário editorial de 30 dias",
      "1 rodada de ajustes por etapa aprovada",
    ],
    notes: "Proposta indicada para negocios que precisam organizar a marca e iniciar divulgação com materiais prontos. Valores podem mudar conforme volume de peças, urgencia e complexidade da identidade visual.",
  },
  {
    id: "multi-servicos-site-trafego-conteudo",
    niche: "Pacotes com vários serviços",
    title: "Site + tráfego pago + conteúdo inicial",
    serviceName: "Pacote presenca digital completa",
    price: 4800,
    deadline: "30 dias úteis",
    payment: "40% entrada, 30% no layout aprovado e 30% antes da publicação",
    included: [
      "Landing page ou site one page responsivo",
      "Copy base para apresentação da oferta",
      "Formulario de contato ou botao de WhatsApp",
      "Configuração inicial de Meta Ads ou Google Ads",
      "5 criativos simples para campanha",
      "Relatório inicial com próximos passos",
    ],
    notes: "Investimento de midia paga não incluso. Hospedagem, dominio, ferramentas externas e taxas de plataforma devem ser combinados separadamente quando necessario.",
  },
  {
    id: "multi-servicos-evento-completo",
    niche: "Pacotes com vários serviços",
    title: "Evento completo",
    serviceName: "Pacote cerimonial + decoração + buffet",
    price: 7200,
    deadline: "Conforme data do evento",
    payment: "30% para reserva da data, 40% ate 15 dias antes e 30% na semana do evento",
    included: [
      "Planejamento e roteiro do evento",
      "Cerimonial e coordenação no dia",
      "Decoração personalizada conforme briefing",
      "Buffet para quantidade combinada de convidados",
      "Checklist de fornecedores e cronograma",
      "Montagem, acompanhamento e desmontagem dos itens contratados",
    ],
    notes: "Proposta sujeita a disponibilidade de agenda, local do evento, número de convidados e itens extras. Transporte, locações especiais e equipe adicional podem ser orçados a parte.",
  },
  {
    id: "multi-servicos-reforma-residencial",
    niche: "Pacotes com vários serviços",
    title: "Reforma residencial completa",
    serviceName: "Pacote eletrica + hidraulica + pintura + acabamento",
    price: 6800,
    deadline: "15 a 25 dias úteis apos aprovação",
    payment: "40% entrada para início, 30% no meio da execução e 30% na entrega",
    included: [
      "Visita técnica e levantamento das necessidades",
      "Revisao eletrica dos pontos combinados",
      "Reparo ou instalação hidraulica dos pontos combinados",
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
      "Diagnóstico inicial do negocio ou processo",
      "Mapeamento de gargalos e prioridades",
      "Plano de ação com etapas, prazos e responsaveis",
      "4 encontros online de acompanhamento",
      "Modelos de planilhas ou documentos de apoio",
      "Resumo final com recomendações para continuidade",
    ],
    notes: "Este pacote combina estrategia e acompanhamento pratico. Implementações técnicas, ferramentas pagas e demandas fora do plano de ação podem ser contratadas separadamente.",
  },
  {
    id: "multi-servicos-beleza-dia-especial",
    niche: "Pacotes com vários serviços",
    title: "Dia especial de beleza",
    serviceName: "Pacote cabelo + maquiagem + unhas",
    price: 780,
    deadline: "Atendimento em ate 5 horas",
    payment: "50% para reservar horario e 50% no atendimento",
    included: [
      "Análise inicial do visual desejado",
      "Penteado ou finalização de cabelo",
      "Maquiagem social ou festa",
      "Manicure e esmaltação",
      "Preparação e orientações de manutenção",
      "Registro simples do resultado final, quando autorizado",
    ],
    notes: "Proposta indicada para eventos, ensaios e datas especiais. Deslocamento, extensoes, acessorios e procedimentos extras podem alterar o valor.",
  },
  {
    id: "multi-servicos-automotivo-revisao-lavagem",
    niche: "Pacotes com vários serviços",
    title: "Revisao + lavagem detalhada",
    serviceName: "Pacote revisao mecanica + cuidado automotivo",
    price: 980,
    deadline: "1 a 2 dias úteis",
    payment: "50% na aprovação e 50% na retirada do veiculo",
    included: [
      "Checklist mecanico preventivo",
      "Scanner básico e verificação de fluidos",
      "Inspeção de freios, suspensão e itens de segurança",
      "Lavagem técnica externa",
      "Aspiração e limpeza interna detalhada",
      "Relatório do veiculo com recomendações",
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

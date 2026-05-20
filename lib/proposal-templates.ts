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
    niche: "Mecanica automotiva",
    services: [
      ["Revisao preventiva", "Revisao preventiva automotiva", 480, "1 dia util", ["Checklist mecanico", "Verificacao de fluidos", "Inspecao de freios e suspensao", "Scanner basico", "Relatorio do veiculo"]],
      ["Troca de oleo e filtros", "Troca de oleo e filtros", 260, "Atendimento em 2 horas", ["Oleo conforme especificacao", "Filtro de oleo", "Verificacao de filtros adicionais", "Conferencia de vazamentos", "Registro da quilometragem"]],
      ["Freios e suspensao", "Manutencao de freios e suspensao", 850, "1 a 2 dias uteis", ["Diagnostico inicial", "Desmontagem e inspecao", "Substituicao de pecas combinadas", "Teste de rodagem", "Garantia de 30 dias"]],
      ["Diagnostico completo", "Diagnostico mecanico completo", 350, "Atendimento em 3 horas", ["Scanner automotivo", "Analise de ruidos", "Verificacao de motor", "Teste de funcionamento", "Orcamento detalhado dos reparos"]],
    ].map(toService),
  },
  {
    niche: "Lava jato",
    services: [
      ["Lavagem completa", "Lavagem completa de veiculo", 90, "Atendimento em 1 hora", ["Lavagem externa", "Aspiracao interna", "Limpeza de painel", "Pretinho nos pneus", "Finalizacao basica"]],
      ["Lavagem detalhada", "Lavagem detalhada automotiva", 180, "Atendimento em 2 horas", ["Pre-lavagem", "Lavagem tecnica", "Limpeza interna detalhada", "Limpeza de rodas e caixas", "Finalizacao com cera liquida"]],
      ["Higienizacao interna", "Higienizacao interna automotiva", 320, "Atendimento em 4 horas", ["Aspiracao profunda", "Limpeza de bancos", "Limpeza de carpetes", "Higienizacao de painel e portas", "Orientacao de secagem"]],
      ["Plano mensal de lavagem", "Plano mensal de lavagem automotiva", 280, "4 atendimentos mensais", ["4 lavagens completas", "Agendamento prioritario", "Aspiracao interna", "Finalizacao dos pneus", "Controle dos atendimentos"]],
    ].map(toService),
  },
  {
    niche: "Auto eletrica",
    services: [
      ["Diagnostico eletrico", "Diagnostico eletrico automotivo", 280, "Atendimento em 2 horas", ["Scanner e testes eletricos", "Verificacao de bateria", "Analise de alternador", "Teste de fusivel e rele", "Relatorio do problema"]],
      ["Instalacao de acessorios", "Instalacao de acessorios automotivos", 420, "1 dia util", ["Briefing do acessorio", "Instalacao eletrica", "Organizacao de chicote", "Teste de funcionamento", "Orientacao de uso"]],
      ["Bateria e alternador", "Manutencao de bateria e alternador", 520, "1 dia util", ["Teste de carga", "Verificacao de cabos", "Diagnostico do alternador", "Substituicao combinada", "Garantia de 30 dias"]],
    ].map(toService),
  },
  {
    niche: "Estetica automotiva",
    services: [
      ["Polimento tecnico", "Polimento tecnico automotivo", 650, "1 a 2 dias uteis", ["Lavagem tecnica", "Descontaminacao da pintura", "Polimento em etapas", "Protecao final", "Orientacoes de manutencao"]],
      ["Vitrificacao de pintura", "Vitrificacao automotiva", 1200, "2 dias uteis", ["Lavagem tecnica", "Descontaminacao", "Polimento preparatorio", "Aplicacao de vitrificador", "Cura e entrega orientada"]],
      ["Revitalizacao de farol", "Revitalizacao de farois", 180, "Atendimento em 2 horas", ["Lixamento tecnico", "Polimento do farol", "Aplicacao de protecao", "Teste visual", "Orientacoes de cuidado"]],
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
    niche: "Som e audiovisual",
    services: [
      ["Som para evento", "Locacao de som para evento", 1500, "Conforme data do evento", ["Briefing tecnico", "Sistema de som dimensionado", "Montagem e passagem de som", "Operacao durante o evento", "Desmontagem dos equipamentos"]],
      ["Som, luz e DJ", "Pacote som, iluminacao e DJ", 2800, "Conforme data do evento", ["DJ para periodo combinado", "Sistema de som", "Iluminacao de pista", "Microfone sem fio", "Montagem e acompanhamento tecnico"]],
      ["Audiovisual corporativo", "Sonorizacao e audiovisual para evento corporativo", 3200, "Conforme data do evento", ["Briefing da programacao", "Sistema de som", "Projetor ou tela conforme escopo", "Microfones para palestras", "Tecnico de operacao"]],
    ].map(toService),
  },
  {
    niche: "Moveis planejados",
    services: [
      ["Projeto de cozinha planejada", "Moveis planejados para cozinha", 8500, "30 a 45 dias uteis", ["Medicao do ambiente", "Projeto 3D", "Definicao de acabamentos", "Fabricacao dos modulos", "Entrega e instalacao"]],
      ["Closet planejado", "Projeto e execucao de closet planejado", 6200, "25 a 35 dias uteis", ["Levantamento de medidas", "Projeto de distribuicao interna", "Escolha de materiais", "Fabricacao", "Instalacao e ajustes finais"]],
      ["Painel e rack sob medida", "Painel e rack planejados para sala", 3800, "20 a 30 dias uteis", ["Medicao tecnica", "Projeto visual", "Definicao de ferragens e acabamentos", "Fabricacao", "Montagem no local"]],
    ].map(toService),
  },
  {
    niche: "Buffets",
    services: [
      ["Buffet para aniversario", "Buffet completo para aniversario", 3200, "Conforme data do evento", ["Cardapio personalizado", "Preparo dos alimentos", "Equipe de apoio", "Montagem da mesa", "Atendimento durante o evento"]],
      ["Buffet corporativo", "Buffet corporativo para reuniao ou evento", 2600, "Conforme data do evento", ["Cardapio combinado", "Coffee break ou refeicao", "Bebidas conforme escopo", "Montagem e reposicao", "Itens descartaveis ou loucas combinadas"]],
      ["Buffet para casamento", "Buffet para casamento e recepcao", 9800, "Conforme data do evento", ["Degustacao ou alinhamento de cardapio", "Entrada, prato principal e sobremesa", "Equipe de cozinha e salao", "Montagem do servico", "Coordenacao com cerimonial"]],
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
  {
    niche: "Imoveis e condominios",
    services: [
      ["Vistoria de imovel", "Vistoria detalhada de imovel", 450, "2 dias uteis", ["Agendamento da visita", "Registro fotografico", "Checklist de conservacao", "Relatorio de vistoria", "Orientacoes finais"]],
      ["Administracao de aluguel", "Administracao mensal de locacao", 380, "Mensal", ["Analise do contrato", "Controle de repasses", "Comunicacao com locatario", "Acompanhamento de vencimentos", "Relatorio mensal"]],
      ["Gestao condominial", "Consultoria para gestao condominial", 1500, "30 dias", ["Diagnostico do condominio", "Analise de rotinas", "Plano de melhorias", "Reuniao com conselho", "Relatorio executivo"]],
    ].map(toService),
  },
  {
    niche: "Moda e varejo",
    services: [
      ["Visual merchandising", "Organizacao visual de loja", 900, "5 dias uteis", ["Diagnostico da loja", "Sugestao de vitrine", "Organizacao de exposicao", "Lista de melhorias", "Orientacao para equipe"]],
      ["Catalogo de produtos", "Catalogo comercial de produtos", 1200, "10 dias uteis", ["Organizacao de itens", "Textos comerciais", "Layout do catalogo", "PDF final", "Versao para WhatsApp"]],
      ["Implantacao de ecommerce", "Cadastro inicial de loja virtual", 1800, "15 dias uteis", ["Configuracao da vitrine", "Cadastro de ate 30 produtos", "Organizacao de categorias", "Ajustes de checkout", "Treinamento rapido"]],
    ].map(toService),
  },
  {
    niche: "Transporte e logistica",
    services: [
      ["Frete dedicado", "Transporte dedicado de carga", 850, "Conforme rota", ["Coleta no endereco combinado", "Conferencia de volume", "Transporte dedicado", "Entrega no destino", "Comprovante de entrega"]],
      ["Mudanca residencial", "Mudanca residencial planejada", 1800, "1 a 2 dias", ["Visita ou briefing inicial", "Equipe de carregamento", "Transporte dos itens", "Descarregamento no destino", "Organizacao basica"]],
      ["Roteirizacao de entregas", "Planejamento de rotas de entrega", 1200, "7 dias uteis", ["Analise de enderecos", "Agrupamento de rotas", "Estimativa de prazos", "Planilha operacional", "Orientacao para equipe"]],
    ].map(toService),
  },
  {
    niche: "Financeiro e seguros",
    services: [
      ["Planejamento financeiro", "Planejamento financeiro pessoal", 900, "15 dias uteis", ["Diagnostico financeiro", "Organizacao de receitas e despesas", "Plano de prioridades", "Mapa de metas", "Reuniao de devolutiva"]],
      ["Consultoria de seguros", "Consultoria para escolha de seguro", 450, "5 dias uteis", ["Levantamento de necessidade", "Comparativo de opcoes", "Explicacao de coberturas", "Orientacao de contratacao", "Suporte inicial"]],
      ["Analise de credito", "Analise e orientacao de credito", 650, "7 dias uteis", ["Coleta de informacoes", "Analise de perfil", "Simulacao de cenarios", "Plano de regularizacao", "Proximos passos"]],
    ].map(toService),
  },
  {
    niche: "Industria e manutencao",
    services: [
      ["Manutencao industrial", "Manutencao preventiva de equipamento", 2200, "3 a 5 dias uteis", ["Inspecao inicial", "Checklist tecnico", "Execucao da manutencao", "Teste operacional", "Relatorio tecnico"]],
      ["Projeto de melhoria", "Adequacao tecnica de processo", 4800, "30 dias uteis", ["Mapeamento do processo", "Diagnostico de gargalos", "Plano de melhoria", "Implantacao acompanhada", "Relatorio final"]],
      ["Solda e fabricacao", "Servico de solda e fabricacao metalica", 1600, "7 dias uteis", ["Levantamento de medidas", "Preparacao de material", "Fabricacao ou reparo", "Acabamento", "Conferencia final"]],
    ].map(toService),
  },
  {
    niche: "Agro e rural",
    services: [
      ["Consultoria rural", "Consultoria para propriedade rural", 1800, "15 dias uteis", ["Visita ou briefing remoto", "Diagnostico da area", "Plano de acao", "Lista de insumos", "Acompanhamento inicial"]],
      ["Sistema de irrigacao", "Instalacao de sistema de irrigacao", 3500, "10 dias uteis", ["Levantamento da area", "Projeto basico", "Instalacao dos pontos", "Teste de funcionamento", "Orientacao de uso"]],
      ["Manutencao de maquina agricola", "Manutencao preventiva de maquina agricola", 1200, "2 dias uteis", ["Checklist mecanico", "Verificacao de fluidos", "Ajustes preventivos", "Teste operacional", "Relatorio do equipamento"]],
    ].map(toService),
  },
  {
    niche: "Turismo e hospedagem",
    services: [
      ["Roteiro personalizado", "Planejamento de viagem personalizado", 650, "7 dias uteis", ["Briefing de preferencias", "Roteiro por dia", "Sugestao de hospedagem", "Mapa de passeios", "Orientacoes de reserva"]],
      ["Pacote de hospedagem", "Pacote de hospedagem e experiencia", 1800, "Conforme datas", ["Reserva de hospedagem", "Sugestao de atividades", "Informacoes de chegada", "Suporte pre-viagem", "Condicoes de cancelamento"]],
      ["Excursao em grupo", "Organizacao de excursao em grupo", 4200, "Conforme data", ["Planejamento de roteiro", "Transporte combinado", "Controle de participantes", "Acompanhamento da viagem", "Orientacoes gerais"]],
    ].map(toService),
  },
  {
    niche: "Seguranca eletronica",
    services: [
      ["Instalacao de cameras", "Instalacao de sistema CFTV", 2200, "3 dias uteis", ["Visita tecnica", "Definicao dos pontos", "Instalacao de cameras", "Configuracao do acesso remoto", "Treinamento de uso"]],
      ["Alarme e sensores", "Instalacao de alarme e sensores", 1600, "2 dias uteis", ["Diagnostico do local", "Definicao dos sensores", "Instalacao dos equipamentos", "Teste de disparo", "Orientacao ao cliente"]],
      ["Controle de acesso", "Controle de acesso para empresa ou condominio", 3800, "7 dias uteis", ["Mapeamento de entradas", "Definicao de equipamentos", "Instalacao e configuracao", "Cadastro inicial", "Treinamento da equipe"]],
    ].map(toService),
  },
];

const templateLevels = [
  { id: "essencial", label: "Essencial", multiplier: 0.75, prefix: "Pacote essencial", extra: "Entrega enxuta com foco no principal combinado." },
  { id: "padrao", label: "Padrao", multiplier: 1, prefix: "", extra: "Entrega equilibrada para atender o escopo principal." },
  { id: "completo", label: "Completo", multiplier: 1.45, prefix: "Pacote completo", extra: "Inclui acompanhamento mais proximo e maior detalhamento da entrega." },
];

const broadSegmentTemplateSeeds: TemplateSeed[] = [
  {
    niche: "Engenharia",
    services: [
      ["Laudo tecnico", "Laudo tecnico de engenharia", 1800, "10 dias uteis", ["Visita tecnica", "Registro fotografico", "Analise normativa", "Emissao de laudo", "ART ou RRT quando aplicavel"]],
      ["Projeto estrutural", "Projeto estrutural residencial", 6500, "30 dias uteis", ["Briefing do projeto", "Calculo estrutural", "Pranchas tecnicas", "Memorial descritivo", "Compatibilizacao basica"]],
      ["Regularizacao de obra", "Regularizacao tecnica de imovel", 3200, "20 dias uteis", ["Analise documental", "Levantamento do imovel", "Plantas necessarias", "Acompanhamento do protocolo", "Orientacoes finais"]],
    ].map(toService),
  },
  {
    niche: "Energia solar",
    services: [
      ["Projeto fotovoltaico", "Projeto e instalacao de energia solar", 18500, "30 a 45 dias uteis", ["Analise de consumo", "Dimensionamento do sistema", "Projeto homologado", "Instalacao dos paineis", "Comissionamento"]],
      ["Homologacao solar", "Homologacao de sistema fotovoltaico", 2200, "15 dias uteis", ["Conferencia tecnica", "Documentacao da concessionaria", "Acompanhamento do processo", "Ajustes solicitados", "Liberacao orientada"]],
      ["Manutencao solar", "Manutencao preventiva de energia solar", 750, "1 dia util", ["Inspecao visual", "Limpeza dos modulos", "Verificacao de inversor", "Teste de geracao", "Relatorio tecnico"]],
    ].map(toService),
  },
  {
    niche: "Climatizacao",
    services: [
      ["Instalacao de ar-condicionado", "Instalacao de ar-condicionado split", 850, "1 dia util", ["Visita ou briefing tecnico", "Instalacao da evaporadora e condensadora", "Tubulacao basica", "Teste de funcionamento", "Orientacoes de uso"]],
      ["Limpeza de ar-condicionado", "Higienizacao de ar-condicionado", 220, "Atendimento em 2 horas", ["Desmontagem parcial", "Limpeza de filtros", "Higienizacao interna", "Teste final", "Etiqueta de manutencao"]],
      ["PMOC", "Plano de manutencao de climatizacao", 1800, "Mensal", ["Inventario dos equipamentos", "Cronograma de manutencao", "Execucao preventiva", "Relatorio mensal", "Controle de chamados"]],
    ].map(toService),
  },
  {
    niche: "Marcenaria",
    services: [
      ["Movel sob medida", "Movel sob medida personalizado", 4200, "25 a 35 dias uteis", ["Medicao tecnica", "Projeto visual", "Definicao de materiais", "Fabricacao", "Entrega e montagem"]],
      ["Reparo de moveis", "Reparo e ajuste de moveis", 650, "5 dias uteis", ["Avaliacao do item", "Troca ou ajuste de ferragens", "Reparo estrutural leve", "Acabamento", "Teste de uso"]],
      ["Painel ripado", "Painel decorativo sob medida", 2800, "15 a 20 dias uteis", ["Medicao do ambiente", "Definicao de madeira ou MDF", "Fabricacao", "Instalacao", "Acabamento final"]],
    ].map(toService),
  },
  {
    niche: "Jardinagem e paisagismo",
    services: [
      ["Projeto de paisagismo", "Projeto de paisagismo residencial", 2500, "15 dias uteis", ["Briefing do espaco", "Estudo de especies", "Layout paisagistico", "Lista de plantas", "Orientacoes de manutencao"]],
      ["Manutencao de jardim", "Manutencao periodica de jardim", 480, "Atendimento mensal", ["Poda leve", "Limpeza dos canteiros", "Adubacao basica", "Controle visual de pragas", "Relatorio simples"]],
      ["Implantacao de jardim", "Implantacao de jardim completo", 5200, "7 a 12 dias uteis", ["Preparo do solo", "Fornecimento de mudas combinadas", "Plantio", "Acabamento com substrato", "Primeira irrigacao orientada"]],
    ].map(toService),
  },
  {
    niche: "Dedetizacao e controle de pragas",
    services: [
      ["Dedetizacao residencial", "Controle de pragas residencial", 420, "Atendimento em 2 horas", ["Inspecao do local", "Aplicacao direcionada", "Produtos regularizados", "Orientacoes de seguranca", "Garantia combinada"]],
      ["Controle empresarial", "Controle integrado de pragas para empresa", 1200, "Mensal", ["Mapeamento de pontos criticos", "Aplicacao programada", "Iscas e barreiras", "Relatorio tecnico", "Monitoramento mensal"]],
      ["Descupinizacao", "Tratamento contra cupins", 1800, "1 a 2 dias uteis", ["Identificacao dos focos", "Tratamento localizado", "Barreira quimica quando aplicavel", "Orientacoes preventivas", "Retorno tecnico"]],
    ].map(toService),
  },
  {
    niche: "Grafica e comunicacao visual",
    services: [
      ["Material impresso", "Impressao de material grafico", 650, "5 dias uteis", ["Conferencia dos arquivos", "Prova digital", "Impressao", "Acabamento combinado", "Entrega ou retirada"]],
      ["Fachada e adesivos", "Comunicacao visual para fachada", 2400, "10 dias uteis", ["Medicao do local", "Layout de fachada", "Producao dos adesivos ou placa", "Instalacao", "Acabamento final"]],
      ["Brindes personalizados", "Brindes corporativos personalizados", 1800, "15 dias uteis", ["Selecao dos itens", "Aplicacao da marca", "Prova de personalizacao", "Producao", "Entrega dos brindes"]],
    ].map(toService),
  },
  {
    niche: "Video e producao audiovisual",
    services: [
      ["Video institucional", "Video institucional para empresa", 4500, "20 dias uteis", ["Roteiro", "Captacao de imagens", "Edicao", "Trilha ou banco de audio", "Arquivo final para web"]],
      ["Cobertura em video", "Filmagem de evento", 2800, "10 dias uteis apos evento", ["Cobertura de ate 4 horas", "Captacao de audio ambiente", "Edicao de melhores momentos", "Entrega digital", "Backup temporario"]],
      ["Video para redes sociais", "Pacote de videos curtos", 1600, "10 dias uteis", ["Roteiros simples", "Captacao ou edicao de material enviado", "6 videos verticais", "Legendas embutidas", "Capas simples"]],
    ].map(toService),
  },
  {
    niche: "Imobiliaria e corretagem",
    services: [
      ["Avaliacao de imovel", "Avaliacao comercial de imovel", 650, "5 dias uteis", ["Levantamento de dados", "Analise comparativa", "Sugestao de valor", "Relatorio simples", "Orientacao de estrategia"]],
      ["Captacao e venda", "Intermediacao de venda de imovel", 4500, "Conforme negociacao", ["Analise documental inicial", "Divulgacao do imovel", "Atendimento a interessados", "Negociacao", "Acompanhamento ate assinatura"]],
      ["Locacao assistida", "Intermediacao de locacao", 900, "15 dias uteis", ["Anuncio do imovel", "Triagem de interessados", "Visitas", "Analise cadastral", "Contrato de locacao"]],
    ].map(toService),
  },
  {
    niche: "Serralheria e metalurgia",
    services: [
      ["Portao sob medida", "Fabricacao de portao metalico", 4800, "20 dias uteis", ["Medicao do vao", "Projeto do portao", "Fabricacao metalica", "Pintura basica", "Instalacao"]],
      ["Grade de protecao", "Grade ou guarda-corpo sob medida", 2600, "15 dias uteis", ["Levantamento de medidas", "Definicao de modelo", "Fabricacao", "Acabamento", "Fixacao no local"]],
      ["Reparo de estrutura", "Reparo de estrutura metalica", 1200, "5 dias uteis", ["Inspecao da estrutura", "Solda ou reforco", "Tratamento de pontos criticos", "Pintura de retoque", "Conferencia final"]],
    ].map(toService),
  },
  {
    niche: "Piscinas",
    services: [
      ["Manutencao de piscina", "Manutencao e limpeza de piscina", 380, "Atendimento semanal", ["Limpeza fisica", "Aspiracao", "Analise da agua", "Aplicacao de produtos", "Orientacoes de uso"]],
      ["Reforma de piscina", "Reforma e revitalizacao de piscina", 7800, "20 a 30 dias uteis", ["Diagnostico estrutural", "Remocao de revestimentos danificados", "Impermeabilizacao quando aplicavel", "Novo acabamento", "Teste de estanqueidade"]],
      ["Casa de maquinas", "Instalacao de bomba e filtro", 2400, "3 dias uteis", ["Analise hidraulica", "Instalacao dos equipamentos", "Conexoes e registros", "Teste de circulacao", "Treinamento de uso"]],
    ].map(toService),
  },
  {
    niche: "Confeccao e costura",
    services: [
      ["Uniformes profissionais", "Confeccao de uniformes personalizados", 2500, "20 dias uteis", ["Definicao de modelo", "Grade de tamanhos", "Prova inicial", "Confeccao", "Entrega embalada"]],
      ["Ajustes de roupas", "Ajustes e reparos de roupas", 180, "3 dias uteis", ["Prova ou medidas", "Ajuste de barra ou cintura", "Reparo de costura", "Passadoria simples", "Entrega final"]],
      ["Peca sob medida", "Roupa sob medida personalizada", 1200, "15 dias uteis", ["Briefing do modelo", "Tirada de medidas", "Prova intermediaria", "Confeccao", "Ajuste final"]],
    ].map(toService),
  },
  {
    niche: "Ecommerce e marketplace",
    services: [
      ["Cadastro de produtos", "Cadastro otimizado de produtos", 900, "7 dias uteis", ["Organizacao de informacoes", "Cadastro de ate 50 produtos", "Titulos e descricoes", "Categorias", "Conferencia final"]],
      ["Implantacao de loja", "Implantacao de ecommerce", 3500, "20 dias uteis", ["Configuracao da plataforma", "Tema visual base", "Meios de pagamento", "Frete", "Treinamento rapido"]],
      ["Gestao de marketplace", "Gestao mensal de marketplace", 1800, "Mensal", ["Monitoramento de anuncios", "Ajustes de precos", "Acompanhamento de pedidos", "Relatorio mensal", "Suporte operacional"]],
    ].map(toService),
  },
  {
    niche: "Recursos humanos",
    services: [
      ["Recrutamento e selecao", "Processo seletivo completo", 2200, "20 dias uteis", ["Alinhamento da vaga", "Divulgacao", "Triagem de curriculos", "Entrevistas", "Shortlist de candidatos"]],
      ["Treinamento interno", "Treinamento corporativo para equipe", 3200, "1 dia", ["Diagnostico da demanda", "Conteudo personalizado", "Material de apoio", "Facilitacao", "Relatorio de presenca"]],
      ["Cargos e salarios", "Projeto de cargos e salarios", 6800, "45 dias uteis", ["Mapeamento de funcoes", "Descricao de cargos", "Pesquisa salarial", "Trilhas de crescimento", "Relatorio final"]],
    ].map(toService),
  },
  {
    niche: "Veterinaria",
    services: [
      ["Consulta veterinaria", "Consulta veterinaria clinica", 180, "Atendimento agendado", ["Anamnese", "Exame clinico", "Orientacoes ao tutor", "Receita quando aplicavel", "Retorno combinado"]],
      ["Vacinas e check-up", "Check-up preventivo pet", 420, "Atendimento em 1 hora", ["Consulta", "Carteira vacinal", "Exames basicos quando combinados", "Orientacoes preventivas", "Plano de acompanhamento"]],
      ["Atendimento domiciliar", "Consulta veterinaria domiciliar", 350, "Conforme agenda", ["Deslocamento local", "Consulta no domicilio", "Avaliacao do ambiente", "Orientacoes ao tutor", "Encaminhamento se necessario"]],
    ].map(toService),
  },
  {
    niche: "Terapias e bem-estar",
    services: [
      ["Massoterapia", "Sessao de massoterapia", 160, "Sessao de 60 minutos", ["Anamnese rapida", "Tecnica combinada", "Ambiente preparado", "Orientacoes pos-sessao", "Acompanhamento simples"]],
      ["Terapia holistica", "Sessao de terapia integrativa", 220, "Sessao de 60 a 90 minutos", ["Escuta inicial", "Tecnica escolhida", "Plano de cuidado", "Orientacoes", "Retorno opcional"]],
      ["Pacote bem-estar", "Pacote mensal de bem-estar", 720, "4 semanas", ["4 sessoes", "Acompanhamento de evolucao", "Orientacoes semanais", "Ajustes de abordagem", "Suporte por mensagem"]],
    ].map(toService),
  },
  {
    niche: "Assistencia tecnica eletronicos",
    services: [
      ["Reparo de celular", "Reparo tecnico de smartphone", 380, "1 a 3 dias uteis", ["Diagnostico", "Orcamento de peca", "Substituicao ou reparo", "Teste final", "Garantia do servico"]],
      ["Reparo de notebook", "Manutencao de notebook", 450, "2 a 5 dias uteis", ["Diagnostico de hardware e software", "Limpeza interna", "Otimizacao", "Troca de peca quando aprovada", "Teste de desempenho"]],
      ["Manutencao de impressora", "Manutencao de impressora", 320, "2 dias uteis", ["Diagnostico", "Limpeza tecnica", "Ajuste de mecanismo", "Teste de impressao", "Orientacoes de uso"]],
    ].map(toService),
  },
  {
    niche: "Instalacao de redes e internet",
    services: [
      ["Rede Wi-Fi empresarial", "Instalacao de rede Wi-Fi", 2200, "5 dias uteis", ["Mapeamento do ambiente", "Definicao de pontos", "Instalacao de equipamentos", "Configuracao", "Teste de cobertura"]],
      ["Cabeamento estruturado", "Cabeamento de rede estruturado", 4800, "10 dias uteis", ["Projeto dos pontos", "Passagem de cabos", "Organizacao de rack", "Certificacao basica", "Identificacao dos pontos"]],
      ["Suporte mensal TI", "Suporte tecnico mensal de TI", 1800, "Mensal", ["Atendimento remoto", "Visitas combinadas", "Monitoramento basico", "Suporte a usuarios", "Relatorio mensal"]],
    ].map(toService),
  },
  {
    niche: "Funilaria e pintura automotiva",
    services: [
      ["Pintura de parachoque", "Pintura automotiva localizada", 750, "2 a 3 dias uteis", ["Avaliacao da peca", "Preparacao da superficie", "Pintura", "Polimento", "Conferencia de cor"]],
      ["Martelinho de ouro", "Reparo de amassado sem pintura", 480, "Atendimento em 1 dia", ["Inspecao do dano", "Acesso ao ponto", "Desamassamento tecnico", "Acabamento visual", "Orientacoes finais"]],
      ["Funilaria completa", "Reparo de funilaria e pintura", 3200, "7 a 12 dias uteis", ["Desmontagem parcial", "Reparo de chaparia", "Preparacao", "Pintura", "Montagem e polimento"]],
    ].map(toService),
  },
  {
    niche: "Aluguel de equipamentos",
    services: [
      ["Locacao para obra", "Locacao de equipamentos para obra", 1200, "Periodo combinado", ["Reserva dos equipamentos", "Entrega local", "Orientacao de uso", "Retirada", "Checklist de devolucao"]],
      ["Locacao audiovisual", "Locacao de projetor e tela", 650, "Diaria", ["Equipamentos testados", "Entrega ou retirada", "Montagem basica", "Suporte inicial", "Conferencia na devolucao"]],
      ["Locacao para festa", "Locacao de mesas, cadeiras e itens para evento", 1400, "Conforme data", ["Reserva dos itens", "Separacao e conferencia", "Entrega", "Retirada", "Reposicao por avaria quando aplicavel"]],
    ].map(toService),
  },
  {
    niche: "Brindes e presentes personalizados",
    services: [
      ["Kit corporativo", "Kit corporativo personalizado", 2800, "15 dias uteis", ["Curadoria dos itens", "Personalizacao com marca", "Embalagem", "Montagem dos kits", "Entrega"]],
      ["Canecas e camisetas", "Produtos personalizados para campanha", 1600, "10 dias uteis", ["Arte base", "Prova digital", "Producao", "Conferencia de qualidade", "Entrega"]],
      ["Lembrancas de evento", "Lembrancas personalizadas para evento", 2200, "20 dias uteis", ["Definicao do tema", "Amostra ou prova visual", "Producao em quantidade", "Embalagem individual", "Entrega programada"]],
    ].map(toService),
  },
  {
    niche: "Telecomunicacoes",
    services: [
      ["PABX e telefonia", "Instalacao de PABX ou telefonia IP", 4200, "10 dias uteis", ["Levantamento de ramais", "Configuracao da central", "Instalacao dos aparelhos", "Testes de chamada", "Treinamento"]],
      ["Internet empresarial", "Projeto de conectividade empresarial", 3500, "15 dias uteis", ["Analise da demanda", "Desenho da solucao", "Configuracao de roteadores", "Politicas basicas", "Teste de estabilidade"]],
      ["Manutencao telecom", "Suporte tecnico de telecomunicacoes", 1500, "Mensal", ["Atendimento remoto", "Monitoramento basico", "Ajustes de configuracao", "Chamados incluidos", "Relatorio mensal"]],
    ].map(toService),
  },
  {
    niche: "Ambiental",
    services: [
      ["Licenciamento ambiental", "Consultoria para licenciamento ambiental", 6500, "45 dias uteis", ["Analise inicial", "Documentacao tecnica", "Protocolos", "Acompanhamento de exigencias", "Relatorio final"]],
      ["Gestao de residuos", "Plano de gestao de residuos", 3800, "25 dias uteis", ["Diagnostico dos residuos", "Classificacao", "Plano de manejo", "Fornecedores indicados", "Treinamento rapido"]],
      ["Relatorio ambiental", "Relatorio tecnico ambiental", 2800, "15 dias uteis", ["Visita tecnica", "Coleta de dados", "Analise de impactos", "Recomendacoes", "Entrega em PDF"]],
    ].map(toService),
  },
  {
    niche: "Eventos infantis e recreacao",
    services: [
      ["Recreacao infantil", "Equipe de recreacao para festa", 1200, "Conforme data do evento", ["Briefing da faixa etaria", "2 recreadores", "Brincadeiras dirigidas", "Materiais basicos", "Acompanhamento durante a festa"]],
      ["Personagem vivo", "Personagem tematico para evento", 850, "Periodo de 1 hora", ["Personagem caracterizado", "Entrada especial", "Fotos com convidados", "Interacao dirigida", "Alinhamento previo"]],
      ["Oficina criativa", "Oficina infantil para evento", 1400, "Conforme data", ["Planejamento da atividade", "Materiais para participantes", "Monitoria", "Organizacao do espaco", "Entrega dos itens produzidos"]],
    ].map(toService),
  },
  {
    niche: "Ceramica, vidro e acabamentos",
    services: [
      ["Instalacao de porcelanato", "Assentamento de porcelanato", 3200, "7 a 12 dias uteis", ["Avaliacao do contrapiso", "Paginacao simples", "Assentamento", "Rejunte", "Limpeza final"]],
      ["Box de banheiro", "Instalacao de box de vidro", 1200, "7 dias uteis", ["Medicao tecnica", "Producao do vidro", "Instalacao", "Vedacao", "Orientacoes de manutencao"]],
      ["Bancada sob medida", "Bancada de pedra ou marmore", 3800, "15 dias uteis", ["Medicao", "Escolha do material", "Corte e acabamento", "Instalacao", "Conferencia final"]],
    ].map(toService),
  },
  {
    niche: "Estrategia comercial e vendas",
    services: [
      ["Funil de vendas", "Implantacao de funil comercial", 4200, "30 dias uteis", ["Diagnostico comercial", "Desenho das etapas", "Scripts de abordagem", "Indicadores", "Treinamento da equipe"]],
      ["CRM", "Implantacao de CRM", 3500, "20 dias uteis", ["Mapeamento do processo", "Configuracao do CRM", "Importacao inicial", "Automacoes basicas", "Treinamento"]],
      ["Treinamento de vendas", "Treinamento comercial para equipe", 2800, "1 dia", ["Briefing", "Conteudo personalizado", "Dinamicas praticas", "Material de apoio", "Plano de acao"]],
    ].map(toService),
  },
  {
    niche: "Administracao publica e terceiro setor",
    services: [
      ["Projeto para edital", "Elaboracao de projeto para edital", 3500, "20 dias uteis", ["Leitura do edital", "Estrutura do projeto", "Orcamento base", "Documentos de apoio", "Revisao final"]],
      ["Prestacao de contas", "Organizacao de prestacao de contas", 2800, "15 dias uteis", ["Conferencia documental", "Planilhas financeiras", "Relatorio de execucao", "Organizacao de anexos", "Entrega digital"]],
      ["Captacao de recursos", "Consultoria para captacao de recursos", 4200, "30 dias uteis", ["Diagnostico institucional", "Mapa de oportunidades", "Plano de captacao", "Materiais de apresentacao", "Acompanhamento inicial"]],
    ].map(toService),
  },
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
  {
    id: "multi-servicos-automotivo-revisao-lavagem",
    niche: "Pacotes com varios servicos",
    title: "Revisao + lavagem detalhada",
    serviceName: "Pacote revisao mecanica + cuidado automotivo",
    price: 980,
    deadline: "1 a 2 dias uteis",
    payment: "50% na aprovacao e 50% na retirada do veiculo",
    included: [
      "Checklist mecanico preventivo",
      "Scanner basico e verificacao de fluidos",
      "Inspecao de freios, suspensao e itens de seguranca",
      "Lavagem tecnica externa",
      "Aspiracao e limpeza interna detalhada",
      "Relatorio do veiculo com recomendacoes",
    ],
    notes: "Pecas, oleo, filtros, produtos premium, servicos adicionais e reparos identificados no diagnostico devem ser aprovados separadamente antes da execucao.",
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

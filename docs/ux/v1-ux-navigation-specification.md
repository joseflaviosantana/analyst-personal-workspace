# Especificação de UX, Arquitetura de Informação e Navegação da V1 — Analyst Personal Workspace

## 1. Identificação e Metadados do Documento

- **Documento**: Especificação de Experiência do Usuário, Arquitetura de Informação e Navegação (UX & Navigation Specification)
- **Versão do Documento**: 1.0.0
- **Versão Alvo do Produto**: Versão 1 (V1 — Analytics e Business Intelligence)
- **Status**: Proposta Formal de Especificação de Interface e Interação
- **Classificação**: Documento Normativo Interno de Produto
- **Fontes Normativas Vinculantes**:
  - [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md) — Regras Operacionais para Agentes de IA;
  - [`docs/product/vision.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/vision.md) — Visão de Produto;
  - [`docs/product/v1-scope.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/v1-scope.md) — Escopo da Versão 1 (V1);
  - [`docs/product/roadmap.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/roadmap.md) — Roadmap Estratégico;
  - [`docs/product/professional-workflow.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/professional-workflow.md) — Workflow Profissional da V1;
  - [`docs/product/v1-functional-specification.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/v1-functional-specification.md) — Especificação Funcional da V1;
  - [`docs/architecture/ADR-001-v1-foundation.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/architecture/ADR-001-v1-foundation.md) — Definição da Arquitetura Base e Stack Tecnológica para a V1;
  - [`docs/domain/v1-domain-model.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/domain/v1-domain-model.md) — Modelo de Domínio Conceitual da V1.

---

## 2. Princípios de Design e Filosofia de Experiência da V1

### 2.1. O que Move a Interface
A interface do **Analyst Personal Workspace** não é um mero gerador de formulários CRUD baseado nas tabelas do banco de dados. Ela é um **ambiente de operação analítica contínua**, projetada especificamente para como um profissional de Dados e BI pensa, investiga e entrega valor.

A experiência é regida por seis pilares fundamentais:
1. **Centrada em Contexto, Fluxo e Decisão**: Em vez de navegar por entidades isoladas, o analista visualiza a demanda como um fluxo coerente, com histórico, decisões tomadas, validações pendentes e próximos passos imediatos sempre ao alcance de um clique.
2. **Baixa Fricção Operacional e Redução de Digitação**: O sistema automatiza o preenchimento contextual, infere metadados onde cabível, formata expressões e gera documentação como subproduto natural do trabalho, eliminando tarefas mecânicas repetitivas.
3. **Divulgação Progressiva (*Progressive Disclosure*)**: Informações complexas e detalhes técnicos aprofundados (scripts M, expressões DAX completas, logs de auditoria linha a linha) não poluem a visão primária; estão organizados em camadas acessíveis sob demanda.
4. **Visibilidade Imediata de Estado e Bloqueios**: Em menos de 10 segundos no Cockpit, o analista sabe onde cada projeto está, quais demandas possuem impedimentos com clientes, onde há divergências matemáticas e qual é a ação prioritária.
5. **Colaboração Humano + IA Transversal e Contextual**: O Copilot Proativo não fica restrito a um widget de chat isolado. Ele atua diretamente nos contextos de tela sugerindo hipóteses, detectando anomalias e rascunhando respostas, sempre sob o princípio inegociável de que **o humano é a autoridade decisória final**.
6. **Prevenção de Erros e Reversibilidade Segura**: A interface bloqueia avanços prematuros que gerem falhas de qualidade e oferece mecanismos visuais e auditáveis de reversão de estados sem perda de histórico.

---

## 3. Arquitetura de Informação Global

A estrutura de navegação da V1 organiza as 24 capacidades conceituais em **7 áreas operacionais coesas**, integradas por um Shell Global permanente.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SHELL GLOBAL DA APLICAÇÃO                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. CENTRO DE COMANDO (COCKPIT)  ──► Painel situacional diário, alertas, pendências e IA│
│ 2. PROJETOS & CLIENTES          ──► Agrupador estratégico de demandas por solicitante  │
│ 3. PIPELINE OPERACIONAL         ──► Fluxo visual Kanban (8 estados normais + 2 excepc.)│
│ 4. ESPAÇO DA DEMANDA (CENTRAL)  ──► Hub analítico de ponta a ponta (11 abas contextuais│
│ 5. CENTRAL DE APROVAÇÕES        ──► Fila unificada de deliberações humanas soberanas   │
│ 6. CONHECIMENTO & PORTFÓLIO     ──► Snippets reutilizáveis e cases sanitizados (APROV-10)│
│ 7. COPILOT TRANSVERSAL          ──► Painel contextual lateral e gatilhos inline de IA  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Estrutura do Shell Global (Layout Base)
O layout é otimizado para monitores desktop (espaço de trabalho profissional), com adaptação fluida para telas de notebooks e monitores menores:
- **Barra Superior (Top Header)**:
  - Identificador do Workspace e seletor rápido de Projeto ativo;
  - Busca Global universal (`Ctrl+K`) com busca de demandas, arquivos, KPIs e medidas DAX;
  - Indicador de Conectividade Local e Proteção de Dados (Status: *Local-First / Dados Segregados*);
  - Contador de Notificações / Aprovações Pendentes (com destaque numérico);
  - Botão de Ação Rápida Universal: `+ Nova Demanda`.
- **Barra Lateral de Navegação (Left Sidebar - Colapsável)**:
  - Navegação primária: `Cockpit`, `Projetos`, `Pipeline Visual`, `Aprovações Pendentes`, `Conhecimento & Portfólio`;
  - Seção de Demandas Recentes / Fixadas para troca rápida de contexto;
  - Alternador de expansão/recolhimento da barra lateral para maximizar área útil de análise.
- **Área Central de Trabalho (Main Stage)**:
  - Espaço de renderização dinâmica da tela selecionada, com cabeçalho de contexto persistente e navegação por abas quando dentro de uma Demanda.
- **Painel Contextual do Copilot (Right Drawer - Deslizante / Fixável)**:
  - Barra lateral direita que pode ser aberta sob demanda ou mantida fixada lado a lado;
  - Apresenta diagnósticos proativos, rascunhos de documentação, críticas de consistência e espaço de diálogo contextual com a IA.

---

## 4. Mapeamento Detalhado das Telas e Áreas Principais

Abaixo estão formalizadas as 7 áreas de tela da V1, contemplando todos os atributos normativos de especificação de interface.

---

### Área 1: Centro de Comando (Cockpit do Analista) — `/cockpit` ou `/`
- **Nome**: Centro de Comando (Cockpit do Analista).
- **Objetivo**: Fornecer em um relance visual a consciência situacional completa do dia a dia do analista, destacando prioridades, bloqueios com clientes, falhas de qualidade, validações pendentes e recomendações da IA.
- **Contexto de Uso**: Tela padrão de entrada na inicialização da aplicação e hub de retorno entre tarefas.
- **Informações Exibidas**:
  - **Barra de Métricas Rápidas**: Total de Projetos Ativos, Demandas em Andamento, Demandas Aguardando Cliente, Validações Pendentes, Alertas Críticos;
  - **Quadro de Prioridades Recomendadas pelo Copilot**: Lista ranqueada de ações sugeridas com justificativa explícita de impacto no prazo ou qualidade;
  - **Seção "Bloqueios & Aguardando Cliente"**: Cartões de demandas travadas por perguntas de clarificação não respondidas ou bases de dados faltantes;
  - **Seção "Atenção de Qualidade & Validação"**: Demandas com anomalias críticas abertas ou divergências numéricas na reconciliação de KPIs;
  - **Próximos Marcos & Entregas**: Calendário/lista ordenada por proximidade de prazo contratual;
  - **Lista de Demandas Ativas**: Tabela compacta com título, cliente, fase atual do pipeline, tempo no estágio e botão de ação rápida.
- **Ações Disponíveis**:
  - *Primárias*: Criar Nova Demanda (`+ Nova Demanda`), Abrir Demanda Prioritária, Resolver Bloqueio Urgente;
  - *Secundárias*: Filtrar Cockpit por Solicitante/Projeto, Silenciar Alertas não impeditivos, Exportar Resumo do Dia.
- **Filtros**: Por Solicitante, Por Projeto, Por Nível de Severidade de Alerta, Por Faixa de Prazo (Hoje, Esta Semana, No Prazo, Atrasadas).
- **Estados Vazios**:
  - Sem projetos: Card de boas-vindas profissional convidando a criar o primeiro projeto e demanda ("Nenhuma demanda ativa no momento. Comece registrando uma solicitação de cliente").
- **Estados de Carregamento**: Skeleton loaders estruturados nas caixas de métricas e listas de prioridades.
- **Estados de Erro**: Notificação de erro local com opção de recarregamento sem perda de dados em cache.
- **Alertas**: Banner amarelo para prazos vencendo em menos de 48h; banner vermelho pulsante para divergência de conciliação matemática em demanda próxima da entrega.
- **Bloqueios**: Cartões de bloqueio exibem o ator responsável pela resolução (*Aguardando Mariana (Cliente)* ou *Aguardando Ação do Analista*).
- **Indicadores Visuais de Status**: Badges coloridos de estado da demanda; pílulas de severidade de anomalias (`Baixa`, `Média`, `Alta`, `Crítica`).
- **Participação da IA**: O Copilot calcula continuamente o ranqueamento das prioridades diárias e emite justificativas textuais contextualizadas (ex.: *"Sugerido priorizar a validação da Demanda Alfa porque a entrega vence amanhã e restam 2 KPIs sem conciliação"*).
- **Pontos de Aprovação Humana**: Seleção e decisão soberana do analista sobre qual prioridade acatar ou reorganizar.
- **Links / Navegação**: Navega diretamente para qualquer Demanda em sua aba contextual correspondente ao clicar no card.
- **Requisitos Funcionais Relacionados**: RF-058, RF-060.
- **Entidades de Domínio Relacionadas**: `Projeto`, `Demanda`, `PerguntaDeClarificacao`, `ProblemaDeQualidade`, `Validacao`.

---

### Área 2: Gestão de Projetos e Solicitantes — `/projects`
- **Nome**: Visão de Projetos e Solicitantes.
- **Objetivo**: Organizar e gerenciar as iniciativas de negócio (Projetos) e seus respectivos patrocinadores ou clientes (Solicitantes), permitindo visão macro de escopo e histórico agregado.
- **Contexto de Uso**: Planejamento de iniciativas de médio prazo, cadastro de novos clientes e auditoria de contratos com múltiplas demandas associadas.
- **Informações Exibidas**:
  - Painel de Solicitantes cadastrados com departamento, papel e canal preferencial de contato;
  - Lista de Projetos com contexto estratégico, data de início, data prevista de término e contador de demandas associadas por status;
  - Progresso global do projeto (% de demandas concluídas vs. pendentes).
- **Ações Disponíveis**:
  - *Primárias*: Criar Novo Projeto, Cadastrar Novo Solicitante, Criar Demanda para o Projeto;
  - *Secundárias*: Editar Dados do Solicitante, Alterar Status do Projeto (`Ativo`, `Pausado`, `Concluído`, `Cancelado`), Ver Dossiê Consolidado.
- **Filtros**: Busca textual por nome do cliente ou projeto, filtro por status do projeto.
- **Estados Vazios**: "Nenhum projeto cadastrado. Registre seu primeiro projeto para organizar demandas agrupadas."
- **Estados de Carregamento**: Esqueleto de cards de projetos.
- **Estados de Erro**: Mensagem de falha ao salvar projeto com preservação do formulário preenchido.
- **Alertas**: Alerta se um projeto estiver ativo sem nenhuma demanda cadastrada há mais de 15 dias.
- **Bloqueios**: Nenhum impeditivo direto de navegação.
- **Indicadores Visuais de Status**: Pílulas de status do projeto (`Ativo` em verde, `Pausado` em cinza, `Concluído` em azul, `Cancelado` em vermelho).
- **Participação da IA**: Sumarização automática do histórico de projetos concluídos do mesmo cliente para fornecer contexto a novas demandas.
- **Pontos de Aprovação Humana**: Criação de projetos, edição de prazos e encerramento de projeto.
- **Links / Navegação**: Clique no projeto abre a lista de demandas vinculadas ou leva para a criação de demanda.
- **Requisitos Funcionais Relacionados**: RF-001, RF-002, RF-003, RF-005.
- **Entidades de Domínio Relacionadas**: `Solicitante`, `Projeto`, `Demanda`.

---

### Área 3: Pipeline Operacional de Demandas — `/pipeline`
- **Nome**: Pipeline Visual de Demandas (Esteira de Fluxo).
- **Objetivo**: Fornecer a gestão visual do fluxo de trabalho das demandas através de um quadro estruturado representando os 8 estados conceituais normais e acesso dedicado aos estados excepcionais.
- **Contexto de Uso**: Reuniões de alinhamento diário, acompanhamento de capacidade e transição controlada de fases da demanda.
- **Informações Exibidas**:
  - **Quadro Principal (8 Colunas Sequenciais Normais)**:
    1. `Nova`
    2. `Em Clarificação`
    3. `Dados Recebidos`
    4. `Em Qualidade e Preparação`
    5. `Em Modelagem e Análise`
    6. `Em Validação`
    7. `Pronta para Entrega`
    8. `Concluída`
  - **Prateleira Superior / Gaveta de Estados Excepcionais (Não Sequenciais)**:
    - Botões/badges com contadores: `Suspensa (N)` e `Cancelada (N)`;
  - **Cartão da Demanda (Demand Card)**:
    - Título da demanda, solicitante, badge de prioridade, prazo limite com contagem regressiva;
    - Indicador de pendências críticas (ex.: ⚠️ *1 Pergunta sem resposta* ou ❌ *KPI divergente*);
    - Avatar/ícone indicando se a ação imediata pertence ao analista ou ao cliente.
- **Ações Disponíveis**:
  - *Primárias*: Arrastar/Mover cartão de estágio (ou acionar botão de avanço assistido de fase);
  - *Secundárias*: Transitar Demanda para `Suspensa` (com modal de justificativa), Transitar para `Cancelada`, Reativar Demanda Suspensa, Abrir Demanda no Workspace.
- **Filtros**: Por Solicitante, Por Projeto, Por Criticidade, Alternador para ocultar demandas concluídas.
- **Estados Vazios**: Colunas vazias exibem indicador discreto com a condição de entrada exigida para a fase.
- **Estados de Carregamento**: Cartões de layout cinza pulsante.
- **Estados de Erro**: Modal de impedimento imediato caso o usuário tente mover um cartão para uma fase cujos critérios obrigatórios não estejam satisfeitos.
- **Alertas**: Borda destacada em cartões com prazo estourado ou bloqueados.
- **Bloqueios**: O arrasto ou transição de estado é formalmente travado se:
  - Tentar mover para `Em Qualidade e Preparação` sem ativo de dados cadastrado;
  - Tentar mover para `Pronta para Entrega` com validações divergentes ou pendentes;
  - Tentar mover para `Concluída` sem entregáveis homologados.
- **Indicadores Visuais de Status**: Cores semânticas por coluna; selo de bloqueio com tooltip explicativo.
- **Participação da IA**: Alerta proativo na coluna quando uma demanda está estagnada além da média histórica sem justificativa documentada.
- **Pontos de Aprovação Humana**: Confirmação manual de qualquer transição de estado; justificativa mandatória para suspensão ou cancelamento.
- **Links / Navegação**: Clique no cartão abre diretamente o Espaço de Trabalho da Demanda (`/demands/[id]`).
- **Requisitos Funcionais Relacionados**: RF-059, RF-060.
- **Entidades de Domínio Relacionadas**: `Demanda`, `EstadoDemanda`.

---

### Área 4: Espaço de Trabalho da Demanda (Workspace Central) — `/demands/[id]`
- **Nome**: Espaço de Trabalho da Demanda (Hub Analítico Central).
- **Objetivo**: Ser o ambiente operacional unificado onde o analista conduz todas as atividades da demanda do início ao fim, sem dispersão em dezenas de páginas desconectadas.
- **Contexto de Uso**: O núcleo onde o analista passa a maior parte de seu tempo de trabalho interagindo com o sistema.
- **Estrutura Permanente do Cabeçalho da Demanda (Sticky Context Header)**:
  - **Linha Superior**: Breadcrumb (`Projetos > [Nome do Projeto] > [Título da Demanda]`), Solicitante, Prazo e Badge de Estado atual;
  - **Barra de Progresso do Workflow**: Visualização das 12 fases do workflow com a fase atual destacada;
  - **Faixa de Alertas Situacionais**: Se houver bloqueios ou pendências de aprovação, uma barra compacta exibe o impedimento e a ação imediata requerida;
  - **Botões Globais da Demanda**: `Aprovar Próximo Passo`, `Registrar Decisão Transversal`, `Exportar Dossiê`, `Abrir Copilot`.
- **Organização por Abas Contextuais de Trabalho**:
  - **Aba 4.1: Visão Geral e Alinhamento**: Resumo executivo, contexto de negócio, problema, critérios de sucesso, linha do tempo e log de decisões;
  - **Aba 4.2: Requisitos e Clarificação**: Solicitação bruta original, requisitos estruturados, lacunas detectadas e roteiro de perguntas ao cliente;
  - **Aba 4.3: Dados e Inventário**: Fichas de arquivos tabulares locais recebidos, contagens de linhas/colunas, formatos, períodos e acessibilidade física;
  - **Aba 4.4: Qualidade e Anomalias**: Tabela de anomalias encontradas, evidências, severidade, plano de ação corretiva e ateste pós-tratamento;
  - **Aba 4.5: Preparação e Transformação**: Registro de passos do Power Query M e fórmulas Excel, consultas resultantes, regras de unpivot/junção e checagem de cardinalidade;
  - **Aba 4.6: Planejamento, Hipóteses e KPIs**: Matriz de perguntas analíticas de negócio, hipóteses causais com evidências necessárias e catálogo central de KPIs com regras de conciliação;
  - **Aba 4.7: Modelagem Power BI e DAX**: Governança do(s) modelo(s) `.pbix` externo(s) (cardinalidade `0..N`), tabela calendário, mapa de relacionamentos e catálogo formatado de medidas DAX;
  - **Aba 4.8: Análise, Evidências e Achados**: Registro de evidências numéricas extraídas, validação de hipóteses (`Confirmada`/`Rejeitada`) e redação de achados de negócio (*insights* fundamentados);
  - **Aba 4.9: Validação Multicamadas e Reconciliação**: Checklist das 6 camadas de teste, batimento numérico contra balancete/base de controle com apuração de divergência em tempo real e tolerância zero;
  - **Aba 4.10: Entregáveis e Encerramento**: Registro de artefatos finais higienizados, sumário executivo anexo, atestado de conciliação matemática e checklist formal de encerramento da demanda;
  - **Aba 4.11: Dossiê Vivo e Portfólio**: Visualização integrada do dossiê concorrente completo da demanda e módulo de geração assistida de versão candidata de estudo de caso para portfólio sanitizado (com aprovação humana obrigatória APROV-10).
- **Ações Disponíveis**:
  - Específicas por aba (descritas nas subseções de tela);
  - Ações transversais: registrar decisão a qualquer momento via modal rápido (`Alt+D`), acionar ajuda do Copilot para o contexto da aba ativa (`Alt+I`).
- **Filtros**: Filtros específicos dentro de tabelas e listas de cada aba (ex.: filtrar anomalias por severidade, filtrar medidas DAX por tabela).
- **Estados Vazios**: Orientação metodológica em cada aba vazia explicando o que deve ser feito e oferecendo botão para iniciar a atividade ou solicitar ajuda da IA.
- **Estados de Carregamento**: Carregamento instantâneo local (Local-First) com transições suaves entre abas.
- **Estados de Erro**: Notificações contextuais inline caso um campo falhe na validação de tipos ou restrições.
- **Alertas**: Banner contextual dentro da aba que possui pendência impeditiva (ex.: badge vermelho piscante na aba Validação quando há divergência).
- **Bloqueios**: A aba Entrega mantém o botão de fechamento desabilitado enquanto houver pendências de validação ou de requisitos.
- **Indicadores Visuais de Status**: Pílulas de conformidade, barras de progresso numérico e marcadores epistêmicos.
- **Participação da IA**: O Copilot contextual adapta sua interface conforme a aba selecionada (na aba Requisitos atua como Estruturador; na aba Qualidade como Investigador; na aba Análise como Crítico; na aba Validação como Validador).
- **Pontos de Aprovação Humana**: Cada avanço de aba com impacto normativo exige clique de confirmação humana.
- **Links / Navegação**: Navegação fluida entre abas sem perda do rascunho em edição; links bidirecionais entre entidades (ex.: clicar no KPI na aba DAX leva direto ao KPI na aba Planejamento).
- **Requisitos Funcionais Relacionados**: Cobre integralmente os requisitos RF-004 a RF-057.
- **Entidades de Domínio Relacionadas**: Todas as entidades agregadas sob `Demanda`.

---

### Área 5: Central de Aprovações e Governança Humana — `/approvals`
- **Nome**: Central de Aprovações e Governança Humana.
- **Objetivo**: Consolidar em uma fila única e transparente todas as deliberações, sugestões da IA e transições de fase que aguardam autorização humana formal, garantindo que o analista nunca perca a soberania do projeto.
- **Contexto de Uso**: Auditoria rápida de deliberações pendentes no início ou término de uma sessão de trabalho.
- **Informações Exibidas**:
  - Lista de itens aguardando deliberação humana classificados por urgência e demanda de origem:
    1. Propostas de estruturação de requisitos geradas por IA;
    2. Rascunhos de perguntas de clarificação para despacho externo;
    3. Ações corretivas de descarte ou imputação em problemas de qualidade;
    4. Deliberação de hipóteses analíticas;
    5. Homologação de fórmulas e regras de KPIs;
    6. Ateste formal de aprovação em logs de reconciliação de validação;
    7. Transições de estado do pipeline (incluindo suspensão/cancelamento);
    8. Pacotes de entregáveis finais;
    9. Liberação de encerramento da demanda;
    10. Versão candidata de estudo de caso de portfólio sanitizada para homologação final (APROV-10 — nenhum caso real é publicado, compartilhado ou promovido automaticamente ao portfólio);
  - **Card de Decisão Estruturado**:
    - O que a IA ou o sistema propôs (destacado em badge roxo `[SugeridoPorIA]`);
    - Fatos e evidências numéricas disponíveis;
    - Consequências e impactos da aprovação vs. rejeição;
    - Histórico do debate contextual.
- **Ações Disponíveis**:
  - *Primárias*: `Aprovar Proposta` (converte para `[AprovadoPorHumano]`), `Editar e Aprovar`, `Rejeitar Proposta`;
  - *Secundárias*: Devolver para a IA com novas diretrizes de revisão, Abrir Contexto Completo da Demanda.
- **Filtros**: Por Demanda, Por Tipo de Aprovação, Por Solicitante.
- **Estados Vazios**: "Tudo em dia! Nenhuma ação ou sugestão pendente de aprovação humana no momento."
- **Estados de Carregamento**: Esqueleto de cartões de aprovação.
- **Estados de Erro**: Alerta com bloqueio de operação caso falte justificativa mandatória em uma rejeição ou descarte.
- **Alertas**: Destaque para aprovações bloqueantes que estão travando o avanço de outras fases.
- **Bloqueios**: Ações críticas não são efetivadas no sistema enquanto estiverem nesta fila.
- **Indicadores Visuais de Status**: Pílulas epistêmicas explícitas (`SugeridoPorIA`, `AprovadoPorHumano`, `PendenteDeDecisao`).
- **Participação da IA**: A IA atua exclusivamente como proponente ou fornecedora de justificativa; proibida de se auto-aprovar.
- **Pontos de Aprovação Humana**: Esta tela é o núcleo dedicado e centralizado da autoridade humana no sistema.
- **Links / Navegação**: Link direto para a aba e campo exato da demanda onde o item foi originado.
- **Requisitos Funcionais Relacionados**: RF-008, RF-011, RF-020, RF-030, RF-045, RF-050, RF-055, RF-057.
- **Entidades de Domínio Relacionadas**: `Decisao`, `Requisito`, `PerguntaDeClarificacao`, `ProblemaDeQualidade`, `Validacao`, `Entregavel`.

---

### Área 6: Repositório de Conhecimento e Portfólio Higienizado — `/knowledge-portfolio`
- **Nome**: Conhecimento Reutilizável e Portfólio Profissional.
- **Objetivo**: Centralizar os ativos intelectuais duradouros gerados a partir de projetos concluídos (snippets DAX validados, funções Power Query M, padrões de qualidade) e gerenciar versões candidatas e aprovadas de estudos de caso de portfólio profissional devidamente sanitizados contra vazamento de segredos corporativos e PII.
- **Contexto de Uso**: Consulta técnica durante a execução de novas demandas (acelerando soluções com padrões já testados) e preparação de material para demonstração profissional e evolução do analista.
- **Informações Exibidas**:
  - **Aba Catálogo de Padrões e Snippets**:
    - Biblioteca de Fórmulas DAX categorizadas (Cálculos de Acumulado, Inteligência Temporal, Churn, Ranks);
    - Biblioteca de Scripts Power Query M (Função de Calendário dinâmica, unpivot condicional, tratamento de datas);
    - Padrões de Solução de Erros de Qualidade (como tratar chaves nulas sem distorcer médias);
  - **Aba Estudos de Caso de Portfólio (Cases Sanitizados)**:
    - Lista de cases gerados no padrão: *Problema de Negócio $\rightarrow$ Processo Analítico $\rightarrow$ Desafios Superados $\rightarrow$ Decisões Tomadas $\rightarrow$ Resultados & Impacto*;
    - Indicador de Conformidade de Sanitização (Status: *Versão Candidata Sanitizada / Aguardando Aprovação Humana APROV-10* ou *Sanitização Aprovada por Humano*);
    - Painel comparativo antes/depois da higienização (mostrando a substituição de dados reais por mock data sintética).
- **Ações Disponíveis**:
  - *Primárias*: Copiar Código DAX/M formatado com 1 clique, Gerar Versão Candidata Sanitizada de Case a partir de Demanda Concluída;
  - *Secundárias*: Exportar Case Homologado em Markdown, Editar Snippet, Marcar Ativo como Favorito.
- **Filtros**: Busca rápida por palavras-chave (ex.: "churn", "dData", "unpivot"), filtro por categoria técnica.
- **Estados Vazios**: "Nenhum ativo de conhecimento cadastrado ainda. Conclua demandas para extrair padrões e alimentar sua memória operacional."
- **Estados de Carregamento**: Tabela com linhas cinzas animadas.
- **Estados de Erro**: Notificação de erro local ao tentar exportar case sem aprovação humana expressa (APROV-10).
- **Alertas**: Banner de atenção inegociável: ⚠️ *"Atenção: Verifique sempre se nenhum nome de cliente real, CPF, valor monetário confidencial ou dado sensível permaneceu no texto antes de publicar externamente."*
- **Bloqueios**: A exportação, compartilhamento ou publicação externa de qualquer material de portfólio é estritamente bloqueada até que o checklist de sanitização e a aprovação humana soberana (APROV-10) sejam integralmente realizados. Nenhum caso real é publicado ou promovido automaticamente.
- **Indicadores Visuais de Status**: Selo de *Sanitização Homologada*; tags temáticas (`PowerQuery`, `DAX`, `Qualidade`).
- **Participação da IA**: A automação com IA atua na varredura semântica para sugerir substituições de dados sensíveis e na redação de rascunhos no formato STAR, gerando exclusivamente uma versão candidata para julgamento do analista.
- **Pontos de Aprovação Humana**: Curadoria de cada snippet e aprovação final expressa e vinculante da versão candidata de estudo de caso sanitizado (APROV-10). É expressamente proibida a publicação ou promoção automática de qualquer caso.
- **Links / Navegação**: Cada snippet exibe link opcional para a demanda de origem (apenas para rastreabilidade interna, omitida no portfólio externo).
- **Requisitos Funcionais Relacionados**: RF-056, RF-057.
- **Entidades de Domínio Relacionadas**: `AtivoDeAprendizado`, `Demanda`, `Decisao`.

---

### Área 7: Copilot Proativo Transversal (Painel e Gatilhos Inline)
- **Nome**: Copilot Proativo Transversal.
- **Objetivo**: Integrar a assistência da IA diretamente ao fluxo de trabalho do analista em tempo real, sem isolá-la em um chat passivo descolado das ações operacionais.
- **Contexto de Uso**: Presente continuamente em toda a aplicação como uma barra lateral recolhível e através de componentes contextuais embutidos (*inline cards*, *diff viewers*, *smart chips*).
- **Modos de Apresentação na Interface**:
  1. **Gaveta Lateral de Diálogo Contextual (Contextual Copilot Drawer)**:
     - Permite ao analista conversar livremente sobre o contexto atual da tela, pedir explicações de erros, solicitar redação de fórmulas ou discutir alternativas de modelagem;
     - Exibe cabeçalho informativo com o papel contextual ativo (*Atuando como: Investigador de Dados* ou *Atuando como: Validador de Conciliação*);
     - Histórico da conversa é indexado à demanda ativa;
  2. **Cartões de Intervenção Proativa (Inline Proactive Chips & Cards)**:
     - Componentes visuais discretos que surgem diretamente nos campos de trabalho quando o sistema detecta oportunidades ou riscos:
       - Na aba Requisitos: *"Copilot identificou 3 ambiguidades no texto. Deseja visualizar as perguntas de clarificação sugeridas?"*
       - Na aba Qualidade: *"Detectado padrão comum de nulos na coluna Categoria. Sugerida inspeção de filtros M."*
       - Na aba Validação: *"Divergência de R$ 1.200 detectada no Faturamento. Sugerido verificar regra de corte de 31/12."*
  3. **Visualizador Comparativo de Propostas (Diff & Proposal Viewer)**:
     - Interface de divisão lado a lado mostrando o estado atual vs. sugestão da IA, permitindo aprovar com 1 clique ou aceitar com edições manuais.
- **Diferenciação Epistêmica Rigorosa**:
  Todo e qualquer texto gerado ou exibido pela IA recebe uma etiqueta visual explícita com código de cores padronizado:
  - 🔵 `[Fato Observado]`: Dado factual verificável no arquivo local ou fornecido pelo cliente;
  - 🟣 `[Sugestão da IA]`: Proposta algorítmica sujeita a julgamento;
  - 🟡 `[Inferência / Hipótese]`: Premissa que ainda precisa ser comprovada por dados;
  - 🟢 `[Decisão Humana Aprovada]`: Deliberação oficial do analista com carimbo de autoria e data.
- **Ações Disponíveis**:
  - `Aceitar Sugestão` (aplica a proposta diretamente ao campo correspondente);
  - `Editar antes de Aceitar` (abre o modal com a sugestão pré-preenchida para edição humana);
  - `Rejeitar e Descartar`;
  - `Explicar Racional` (solicita à IA o motivo da sugestão).
- **Salvaguardas Inegociáveis e Proteção de Dados**:
  - A IA não possui permissão de escrita definitiva sem o clique humano de aceitação;
  - Proibição de exibição de dados alucinados ou estimativas disfarçadas de fatos;
  - **Tratamento Rigoroso de Dados**: Dados reais, pessoais, confidenciais, sigilosos ou corporativos não devem ser enviados a provedores externos de IA sem autorização e salvaguardas adequadas. Anonimização, minimização de dados, processamento local ou outros mecanismos de proteção poderão ser utilizados conforme o caso. A implementação técnica desse mecanismo ainda não está definida, devendo a interface alertar e prevenir envios externos não autorizados ou desprovidos de salvaguardas adequadas.
- **Requisitos Funcionais Relacionados**: RF-007, RF-008, RF-009, RF-010, RF-024, RF-038, RF-052, RF-057.
- **Entidades de Domínio Relacionadas**: Transversal a todas as entidades do sistema.

---

## 5. Arquitetura do Espaço de Trabalho da Demanda (Detalhe das 11 Abas)

O Espaço de Trabalho da Demanda (`/demands/[id]`) organiza todo o ciclo profissional através de abas coesas e integradas. Abaixo são detalhadas a finalidade, as informações e as ações específicas de cada aba:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb: Projetos > BI Vendas > Cancelamento 2025]   [Estado: Em Modelagem e Análise] [Ações]│
├───────┬────────────┬───────┬───────────┬────────────┬─────────────┬──────────┬───────────┬──────┤
│ 1.Visão│ 2.Requisitos│ 3.Dados│ 4.Qualidade│ 5.Preparaç. │ 6.Planejam. │ 7.PowerBI│ 8.Análise │ ...  │
└───────┴────────────┴───────┴───────────┴────────────┴─────────────┴──────────┴───────────┴──────┘
```

### Aba 1: Visão Geral e Alinhamento
- **Finalidade**: Painel de síntese da demanda para visualização do contexto executivo e histórico.
- **Componentes**:
  - Card de Contexto e Problema de Negócio;
  - Card de Solicitante e Contato;
  - Linha do tempo de marcos e prazos;
  - Quadro de Decisões Transversais Registradas (com busca e filtro por escopo);
  - Botão de transição assistida de estado.

### Aba 2: Requisitos e Clarificação
- **Finalidade**: Tratar o alinhamento de escopo, da solicitação bruta até o fechamento de dúvidas com o cliente.
- **Componentes**:
  - Caixa de Texto Imutável da `solicitacaoBruta` (com botão de cópia);
  - Tabela de Requisitos Estruturados (descrição, categoria, prioridade, status de atendimento);
  - Painel de Lacunas e Ambiguidades Identificadas (com justificativa de risco);
  - Roteiro de Perguntas de Clarificação (enunciado, status `Rascunho`/`Enviada`/`Respondida`, resposta formal do cliente e botão "Copiar Roteiro para Envio Manual").

### Aba 3: Dados e Inventário
- **Finalidade**: Catalogar os arquivos tabulares locais recebidos e assegurar imutabilidade das fontes brutas.
- **Componentes**:
  - Tabela de Ativos de Dados: Nome do arquivo, caminho local (`C:\Projetos\...`), formato, contagem de linhas e colunas, granularidade observada, data de recebimento e status de integridade;
  - Botão de verificação de acessibilidade física dos arquivos locais;
  - Ficha de visualização de esquema (lista de colunas e tipos inferidos de forma somente-leitura).

### Aba 4: Qualidade e Anomalias
- **Finalidade**: Acompanhar o diagnóstico, deliberação e validação de problemas de qualidade nos dados.
- **Componentes**:
  - Indicadores de anomalias por severidade (Críticas, Altas, Médias, Baixas);
  - Tabela de Problemas de Qualidade: Tipo de anomalia, ativo afetado, localização exata (coluna/tabela), volume de linhas afetadas (ex.: 320 linhas / 2,4%), impacto no cálculo, ação corretiva deliberada e status (`Aberto`, `Em Investigação`, `Tratado`, `Aceito como Restrição`);
  - Botão para registrar ateste de validação pós-tratamento;
  - Trava visual: aviso de impedimento caso haja anomalia crítica no status `Aberto`.

### Aba 5: Preparação e Transformação (Excel / Power Query)
- **Finalidade**: Documentar e auditar os passos de tratamento realizados nas ferramentas externas especializadas.
- **Componentes**:
  - Tabela de Consultas e Passos de Transformação: Ferramenta (`Power Query M` ou `Excel`), nome da etapa/consulta tratada gerada, descrição da regra estrutural aplicada e problema de qualidade resolvido;
  - Caixa de exibição formatada do script M ou fórmula correspondente;
  - Checklist obrigatório de não-duplicação de cardinalidade para junções (*merge/append*).

### Aba 6: Planejamento, Hipóteses e KPIs
- **Finalidade**: Formalizar a lógica investigativa e a definição de métricas antes da construção visual.
- **Componentes**:
  - Lista de Perguntas Analíticas de Negócio (com status: `Aberta`, `Em Análise`, `Respondida`);
  - Quadro de Hipóteses Causais (enunciado, racional causal, evidência numérica requerida e status do teste);
  - Catálogo de Indicadores e KPIs: Nome da métrica, fórmula conceitual, regra de negócio, unidade, granularidade e base de conferência matemática obrigatória (base de controle externa).

### Aba 7: Modelagem Power BI e DAX
- **Finalidade**: Governança e auditoria técnica de 0 a N arquivos `.pbix` desenvolvidos no Power BI Desktop.
- **Componentes**:
  - Seletor/Lista de Modelos Power BI vinculados à demanda (suportando `Demanda 1 → 0..N ModeloPowerBI`, com opção de marcar "Demanda sem modelo Power BI" quando o entregável for exclusivamente Excel);
  - Painel do Modelo selecionado: Caminho local do arquivo `.pbix`, relação de tabelas (Fatos, Dimensões, Suporte), Tabela Calendário (`dData`) e mapa de relacionamentos (cardinalidades e direções de filtro com campo de justificativa para filtros bidirecionais);
  - Catálogo de Medidas DAX: Nome, tabela hospedeira, pasta de exibição, código DAX formatado, KPI vinculado e status de conferência numérica.

### Aba 8: Análise, Evidências e Achados
- **Finalidade**: Consolidar o raciocínio factual extraído do relatório e fundamentar conclusões de negócio.
- **Componentes**:
  - Painel de Evidências Numéricas Registradas (enunciado exato, filtros aplicados, fonte e valor verificado);
  - Painel de Teste de Hipóteses: Desfecho conclusivo (`Confirmada`, `Rejeitada`, `Inconclusiva`) com justificativa baseada nas evidências;
  - Tabela de Achados Analíticos (*Insights* Fundamentados): Título executivo, síntese da conclusão, evidências vinculadas, limitações e ressalvas da interpretação, e recomendações práticas sugeridas.

### Aba 9: Validação Multicamadas e Reconciliação
- **Finalidade**: Auditoria matemática e formal com tolerância zero para divergências inexplicadas.
- **Componentes**:
  - Checklist das 6 Camadas de Validação Obrigatórias:
    1. Dados Brutos vs. Carregados;
    2. Transformações Power Query;
    3. Cálculos e Medidas DAX;
    4. Validação Cruzada de KPIs (Conciliação Numérica);
    5. Visual e Usabilidade das Páginas;
    6. Atendimento a Requisitos Contratuais;
  - Tabela de Batimento Numérico de KPIs: Nome do KPI, Valor da Base de Controle Externa, Valor Apurado no Power BI, Divergência Absoluta e Percentual apuradas automaticamente, Status de Validação (`Aprovado`, `Divergente`, `Rejeitado`, `Pendente de Reteste`);
  - Botão de bloqueio de entrega acionado automaticamente se houver divergência não explicada;
  - Registro de ação corretiva e botão de homologação de reteste.

### Aba 10: Entregáveis e Encerramento
- **Finalidade**: Empacotar os artefatos finais higienizados e formalizar a conclusão da demanda.
- **Componentes**:
  - Tabela de Entregáveis Finais: Arquivo `.pbix` final, PDF executivo, planilha consolidada, versão formal (ex.: `v1.0-final`) e caminho local;
  - Sumário Executivo consolidado pronto para apresentação;
  - Atestado de Conformidade e Declaração de Validação Numérica gerada automaticamente;
  - Checklist de Encerramento (todas as validações aprovadas? todos os requisitos atendidos?);
  - Botão Soberano Humano: `Homologar e Concluir Demanda`.

### Aba 11: Dossiê Vivo e Portfólio
- **Finalidade**: Visualizar a memória técnica completa e derivar versões candidatas de estudos de caso profissionais sanitizados.
- **Componentes**:
  - Visualizador do Dossiê Completo e Concorrente da Demanda em Markdown formatado (com botão de exportação);
  - Seção "Derivação de Portfólio Profissional":
    - Botão "Gerar Versão Candidata Sanitizada de Estudo de Caso com Apoio da IA";
    - Painel de edição e auditoria do estudo de caso estruturado (Problema $\rightarrow$ Processo $\rightarrow$ Decisões $\rightarrow$ Resultados);
    - Checklist obrigatório de sanitização e anonimização (remoção de clientes, pessoas e segredos, substituição por dados sintéticos);
    - Botão de aprovação humana soberana de portfólio (APROV-10): nenhum caso real pode ser publicado, compartilhado ou promovido automaticamente ao portfólio sem revisão e aprovação humana formal.

---

## 6. Representação UX do Pipeline e dos Estados (Normais e Excepcionais)

A representação do fluxo de demandas obedece estritamente às decisões conceituais aprovadas:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ESTADOS NORMAIS SEQUENCIAIS (ESTEIRA KANBAN PRINCIPAL)                                          │
│                                                                                                 │
│  [1. Nova] ──► [2. Em Clarificação] ──► [3. Dados Recebidos] ──► [4. Em Qualidade e Preparação] │
│                                                                                 │               │
│  [8. Concluída] ◄── [7. Pronta p/ Entrega] ◄── [6. Em Validação] ◄── [5. Em Modelagem e Análise]│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ESTADOS EXCEPCIONAIS (NÃO SEQUENCIAIS — PRATELEIRA SUPERIOR / DRAWER)                           │
│                                                                                                 │
│  [Demanda em Qualquer Estado] ──► Transição c/ Justificativa ──► [SUSPENSA]                     │
│                                                                       │ (Retomada deliberada)   │
│                                                                       ▼                         │
│                                                                  [Retorna ao Estado Original]   │
│                                                                                                 │
│  [Demanda em Qualquer Estado] ──► Transição c/ Justificativa ──► [CANCELADA] (Fim Excepcional)  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1. Regras Visuais de Pipeline
1. **Colunas da Esteira Normal**: As 8 colunas sequenciais representam o avanço metodológico obrigatório da demanda. Um cartão só pode ser arrastado ou avançado se os critérios de aceite do estado anterior estiverem verdes;
2. **Exclusão de Suspensa/Cancelada da Sequência Normal**: Os estados `Suspensa` e `Cancelada` **não** possuem colunas intermediárias no fluxo principal, evitando a impressão equivocada de que são etapas normais pelas quais todo projeto deve passar;
3. **Acesso aos Estados Excepcionais**:
   - São acessíveis via menu de opções contextuais do cartão da demanda (`Mover para Suspensa`, `Cancelar Demanda`) ou por uma barra de filtros superiores com contadores dedicados (`Exibir Suspensas (2)`, `Exibir Canceladas (1)`);
4. **Modal de Transição Excepcional**:
   - Ao selecionar `Suspensa` ou `Cancelada`, o sistema abre obrigatoriamente um modal exigindo:
     - Motivo da transição (seleção estruturada: *Aguardando Decisão do Cliente*, *Contrato Pausado*, *Rescisão*, *Inviabilidade Técnica*);
     - Justificativa detalhada em texto;
     - Confirmação humana deliberada;
5. **Retomada de Demanda Suspensa**:
   - Cartões na gaveta de suspensas exibem o botão ostensivo `Retomar Demanda`;
   - O modal de retomada confirma o estado exato em que a demanda parou e reintroduz o cartão diretamente na coluna original do pipeline, registrando o histórico de pausa e reativação.

---

## 7. Fluxos Completos de Interação do Usuário (Jornadas Passo a Passo A a L)

Abaixo estão especificadas em detalhes as 12 jornadas fundamentais do analista no sistema:

### Jornada A — Nova Demanda Recebida
1. O analista recebe um e-mail com uma solicitação de análise comercial;
2. No Shell Global, clica no botão universal `+ Nova Demanda` (ou atalho `Alt+N`);
3. Abre-se o modal de criação rápida: seleciona o Projeto (ou cria novo) e o Solicitante;
4. Cola a íntegra da mensagem na área "Solicitação Bruta" e clica em "Salvar e Estruturar com Copilot";
5. O sistema grava a demanda no estado `Nova` e invoca o Copilot em segundo plano;
6. A tela transita para o Workspace da Demanda na **Aba Requisitos**, exibindo lado a lado o texto original e a proposta estruturada pela IA com tags `[SugeridoPorIA]`;
7. O analista revisa os campos sugeridos, corrige o prazo inferido, ajusta os entregáveis e clica em "Homologar Requisitos Iniciais". O status dos campos muda para `[AprovadoPorHumano]`.

### Jornada B — Clarificação com o Cliente
1. Na **Aba Requisitos**, o Copilot sinaliza 2 ambiguidades críticas: falta critério para categorização de devoluções e datas de corte fiscal;
2. O sistema gera automaticamente rascunhos de perguntas na tabela de clarificação com status `Rascunho`;
3. O analista clica em "Editar Roteiro", aprimora o tom de voz das perguntas e clica em "Aprovar para Envio Manual";
4. O analista clica no botão "Copiar Mensagem para E-mail", cola no seu cliente de correio corporativo e envia ao cliente. No Workspace, clica em "Marcar como Enviada";
5. A Demanda transita no Pipeline para o estado `Em Clarificação` e um badge amarelo "Aguardando Resposta do Cliente" surge no Cockpit;
6. Dois dias depois, o cliente responde por e-mail. O analista abre a demanda, clica em "Registrar Resposta do Cliente", cola a definição recebida e clica em "Processar Resposta";
7. O sistema atualiza os requisitos afetados, arquiva a pendência e desbloqueia a demanda para o estado `Dados Recebidos`.

### Jornada C — Recebimento e Inspeção de Dados
1. O analista recebe os arquivos `vendas.xlsx` e `metas.csv` e armazena na pasta local do projeto;
2. No Workspace da Demanda, navega para a **Aba Dados** e clica em `+ Catalogar Ativo Local`;
3. Seleciona o caminho local no Windows Explorer (ex.: `D:\Clientes\Alfa\Dados\vendas.xlsx`);
4. O sistema inspeciona os metadados físicos locais: registra formato, contagem de registros (14.200 linhas, 12 colunas), data de modificação e gera um hash de verificação de integridade, marcando a base como somente-leitura conceitual (`read-only`);
5. O analista preenche a granularidade (transacional) e a origem informada pelo cliente;
6. O sistema exibe a ficha de inventário completa do ativo e transita a demanda para `Dados Recebidos`.

### Jornada D — Tratamento de Problema de Qualidade
1. Durante inspeção preliminar no Excel/Power Query, o analista constata 450 registros com campo `Regiao` preenchido como "N/D" e 12 registros de vendas com valores negativos;
2. No Workspace da Demanda, abre a **Aba Qualidade** e clica em `+ Registrar Problema`;
3. Registra a anomalia das vendas negativas: seleciona categoria *Valores Impossíveis*, severidade *Alta*, indica a tabela/coluna e quantifica as 12 linhas afetadas;
4. No campo "Ação Deliberada", seleciona *Descarte Fundamentado* e digita a justificativa: "Estornos de homologação de sistema que não representam vendas reais";
5. Clica em "Submeter Decisão para Aprovação" e, em seguida, homologa formalmente a exclusão;
6. O sistema registra a `Decisao` de qualidade, altera o status do problema para `Tratado` e atualiza o histórico auditável da demanda. A demanda avança para `Em Qualidade e Preparação`.

### Jornada E — Planejamento Analítico
1. Antes de abrir o Power BI, o analista navega para a **Aba Planejamento** da demanda;
2. Clica em `+ Pergunta Analítica` e cadastra: "Quais regiões concentram a maior dispersão de faturamento vs. meta?";
3. Vinculada à pergunta, clica em `+ Formular Hipótese`: "A Região Sul teve queda decorrente da ruptura de estoque de itens da Família X";
4. Cadastra a métrica central no **Catálogo de KPIs**: Nome *Atingimento de Meta*, fórmula conceitual `DIVIDE(Faturamento, Meta)`, unidade *Percentual*, e preenche a base de controle para validação cruzada: "Planilha Financeira Fechamento 2025.xlsx (Aba Totais)";
5. Clica em "Homologar Plano Analítico". A demanda transita para `Em Modelagem e Análise`.

### Jornada F — Trabalho com Power BI e Governança
1. O analista abre o Power BI Desktop, importa os dados tratados do Power Query, cria a modelagem dimensional estrela (`fVendas`, `dMetas`, `dCalendario`, `dProdutos`) e salva `analise_vendas.pbix`;
2. No Workspace, navega para a **Aba Power BI** e clica em `+ Associar Modelo Power BI`;
3. Aponta o caminho local do `.pbix` e registra o esquema de tabelas (Fatos e Dimensões);
4. Na seção de Tabela Calendário, documenta o intervalo de datas coberto pela `dData`;
5. Na seção de Medidas DAX, clica em `+ Cadastrar Medida DAX`: cola o código `Atingimento Meta = DIVIDE([Total Vendas], [Total Meta], 0)`, vincula ao KPI *Atingimento de Meta* e documenta a regra de negócio;
6. O sistema exibe o código formatado com realce de sintaxe e vincula a medida ao pipeline de validação.

### Jornada G — Validação e Reconciliação Numérica
1. Com o relatório desenhado no Power BI, o analista abre a **Aba Validação** no Workspace;
2. Entra na seção de *Validação Cruzada de KPIs*: insere o valor do total de faturamento esperado extraído da planilha de controle financeiro (`R$ 1.450.200,00`) e o valor reportado pelo visual do Power BI (`R$ 1.442.200,00`);
3. O sistema calcula a divergência: `- R$ 8.000,00 (-0,55%)`. O status do KPI é marcado instantaneamente como `Divergente` em vermelho;
4. O sistema exibe alerta ostensivo e bloqueia o botão de entrega da demanda;
5. O analista investiga no Power BI e descobre que notas fiscais de devolução foram computadas indevidamente na base de faturamento bruto. Corrige a medida DAX no Power BI;
6. No Workspace, clica em "Registrar Correção e Retestar": insere o novo valor apurado no Power BI (`R$ 1.450.200,00`);
7. A divergência passa para `R$ 0,00 (0,00%)`. O status transita para `Reteste Aprovado` e a camada de conciliação de KPI fica 100% verde;
8. O analista confere as demais camadas (Dados, Transformação, DAX, Visual, Requisitos) e clica em "Homologar Validação Geral". A demanda avança para `Pronta para Entrega`.

### Jornada H — Preparação da Entrega
1. O analista abre a **Aba Entregáveis** da demanda;
2. Clica em `+ Registrar Entregável Final`: aponta para o relatório exportado `Relatorio_Vendas_v1.0.pdf` e o `.pbix` final na máquina local;
3. O sistema anexa automaticamente o atestado formal de reconciliação de validação (atestando divergência zero);
4. O analista clica em "Gerar Sumário Executivo com Copilot": a IA sintetiza as respostas às perguntas analíticas, as hipóteses confirmadas e as recomendações de negócio cadastradas;
5. O analista revisa o sumário, ajusta um parágrafo e clica em "Empacotar Entrega";
6. O sistema disponibiliza o pacote consolidado para o analista apresentar e enviar manualmente ao cliente por seus canais corporativos.

### Jornada I — Encerramento da Demanda e Reutilização
1. Após a reunião de entrega com o solicitante, o cliente formaliza o aceite do trabalho;
2. O analista acessa a demanda e clica no botão persistente `Encerrar Demanda`;
3. O sistema executa o checklist de fechamento:
   - Validações 100% aprovadas? Sim.
   - Requisitos atendidos? Sim.
   - Nenhuma pergunta ou anomalia crítica aberta? Sim.
   - Entregáveis homologados? Sim.
4. O sistema solicita a confirmação formal humana com data de encerramento e notas finais;
5. O analista confirma: o status da demanda transita para `Concluída` no pipeline, a demanda é arquivada e o Cockpit é atualizado;
6. Opcionalmente, na **Aba 11 (Dossiê Vivo e Portfólio)**, o analista aciona a geração assistida de estudo de caso para portfólio: a automação gera uma versão candidata sanitizada (estrutura STAR). Nenhum caso real é publicado, compartilhado ou promovido automaticamente ao portfólio: o analista revisa linha a linha, valida o checklist de ausência de dados reais/confidenciais e efetua a aprovação formal soberana (APROV-10).

### Jornada J — Retorno a uma Demanda em Andamento
1. O analista abre o Workspace no dia seguinte para dar continuidade a uma demanda pausada;
2. No Cockpit, a demanda aparece no bloco de prioridades com o chip "Próximo Passo: Concluir Validação Cruzada de KPIs";
3. O analista clica no chip do próximo passo: o sistema abre diretamente a demanda na **Aba Validação**, com foco na tabela de reconciliação pendente;
4. O analista não gasta tempo relembrando em que fase o projeto estava: todas as anotações, decisões anteriores e o contexto de trabalho estão exatamente onde foram deixados.

### Jornada K — Suspensão e Retomada de Demanda
1. O cliente entra em contato informando que uma auditoria contábil interna pausará a contratação por duas semanas;
2. No Pipeline ou no cabeçalho da Demanda, o analista clica no menu de ações e seleciona `Suspender Demanda`;
3. Abre-se o modal de justificativa: o analista registra o motivo formal "Pausa solicitada pelo cliente por auditoria contábil interna até 15/10" e confirma;
4. A demanda sai da esteira sequencial normal e ingressa na estante de **Demandas Suspensas**, com histórico 100% congelado e seguro;
5. Duas semanas depois, o cliente autoriza a continuidade dos trabalhos;
6. O analista clica na gaveta de suspensas, localiza o cartão e clica em `Retomar Demanda`;
7. O sistema exibe o modal de retomada confirmando que a demanda retornará exatamente para o estado `Em Modelagem e Análise` onde foi pausada;
8. O analista confirma a retomada: a demanda volta à esteira normal, o histórico registra a reativação e o trabalho recomeça sem atrito.

### Jornada L — Uso Diário do Cockpit (Rotina do Analista)
1. Início da jornada de trabalho matinal: o analista abre o Workspace em `localhost`;
2. Em 5 segundos, visualiza o painel executivo do Cockpit:
   - 1 alerta vermelho: cliente da Demanda Gama enviou mensagem ontem cobrando prazo;
   - 1 bloqueio amarelo: Demanda Beta aguarda envio de nova planilha de dados há 3 dias;
   - Recomendação de prioridade da IA: "Recomenda-se cobrar a planilha da Demanda Beta antes de iniciar a modelagem da Demanda Alfa";
3. O analista clica no botão "Copiar Cobrança Amigável" sugerida pelo Copilot para a Demanda Beta, abre o Teams e envia ao cliente;
4. No Cockpit, marca a cobrança como realizada;
5. Em seguida, clica na Demanda Alfa para iniciar a análise de hipóteses do dia.

---

## 8. Automação, Eficiência e Eliminação de Tarefas Repetitivas

Para que o sistema seja profissional e proporcione produtividade tangível em relação ao trabalho disperso em planilhas e blocos de notas, a interface divide as tarefas operacionais em 4 classes claras de automação:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MATRIZ DE AUTOMAÇÃO E EFICIÊNCIA NA V1                          │
├───────────────────────────────┬────────────────────────────────────────────────────────┤
│ 1. TOTALMENTE AUTOMÁTICAS     │ - Leitura de metadados de arquivos locais (.xlsx, .csv)│
│    (Sem intervenção humana)   │ - Cálculo matemático de divergência numérica de KPIs   │
│                               │ - Verificação física contínua de acessibilidade local  │
│                               │ - Atualização concorrente do Dossiê Vivo da Demanda    │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ 2. ASSISTIDAS PELA IA         │ - Extração de requisitos a partir do briefing bruto    │
│    (Revisadas pelo analista)  │ - Detecção de lacunas de escopo e redação de perguntas │
│                               │ - Realce de sintaxe e documentação explicativa DAX     │
│                               │ - Redação de sumário executivo de achados analíticos   │
│                               │ - Geração de versão candidata sanitizada de portfólio  │
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ 3. OPERADAS PELO ANALISTA     │ - Investigação analítica no Excel e Power Query Desktop│
│    (Trabalho técnico manual)  │ - Construção de layouts visuais no Power BI Desktop    │
│                               │ - Envio externo real de e-mails ou mensagens a clientes│
├───────────────────────────────┼────────────────────────────────────────────────────────┤
│ 4. APROVAÇÕES SOBERANAS       │ - Homologação de requisitos e prazos contratuais       │
│    (Ato humano vinculante)    │ - Autorização de descarte/imputação de dados brutos    │
│                               │ - Ateste de conciliação e tolerância zero a erros      │
│                               │ - Transição de estados do pipeline e encerramento      │
│                               │ - Aprovação de case sanitizado de portfólio (APROV-10) │
└───────────────────────────────┴────────────────────────────────────────────────────────┘
```

### Oportunidades Concretas de Eliminação de Digitação Repetitiva na V1:
1. **Preenchimento Automático por Contexto**: Ao criar uma pergunta analítica vinculada a um requisito, o sistema herda o solicitante, a dor de negócio e as dimensões sem que o analista precise reescrever o briefing;
2. **Formatação Automática de Expressões DAX**: Ao colar uma fórmula DAX em linha contínua, o sistema formata com identação limpa (`VAR`, `RETURN`, quebras lógicas);
3. **Cálculo Automático de Divergência**: Ao informar o valor esperado da base de controle e o valor do relatório, o sistema calcula a variação absoluta e percentual e classifica automaticamente se a tolerância zero foi atingida;
4. **Geração do Roteiro de Perguntas**: O analista não precisa redigir e-mails formais do zero; a IA prepara a mensagem de alinhamento com saudação profissional, contexto da dúvida e perguntas pontuais em formato copiável com 1 clique;
5. **Geração Concorrente de Dossiê**: O analista nunca precisa "parar para documentar o projeto". Conforme cadastra ativos, problemas de qualidade e medidas DAX, o relatório consolidado em Markdown fica 100% pronto em tempo real.

---

## 9. Princípios de UX Profissional para a Interface

A interface foi projetada observando os mais altos padrões de usabilidade para ferramentas técnicas de trabalho profissional contínuo:

1. **Eficiência para Uso Contínuo em Desktop**:
   - Densidade de informação equilibrada: nem vazia e espaçada como landing page comercial, nem compacta e ilegível como tela antiga de terminal;
   - Grid estruturado aproveitando telas panorâmicas (16:9 / 21:9), mantendo painéis laterais de contexto sem ocultar o fluxo principal de trabalho.
2. **Atalhos Globais de Teclado (Power Shortcuts)**:
   - `Ctrl+K`: Paleta universal de comandos e busca rápida de entidades;
   - `Alt+N`: Criar nova demanda de qualquer tela;
   - `Alt+D`: Abrir modal instantâneo de registro de decisão transversal;
   - `Alt+I`: Abrir/Fechar painel do Copilot Proativo;
   - `Alt+1` a `Alt+9`: Alternar diretamente entre as abas do Workspace da Demanda.
3. **Prevenção de Erros Operacionais (*Error Prevention*)**:
   - Ações destrutivas (exclusão de demanda, cancelamento) exigem digitação de confirmação textual do nome da entidade;
   - Bloqueio determinístico de botões de transição com *tooltips* explicativos indicando exatamente qual pendência precisa ser resolvida para destravar o fluxo;
   - Salvamento automático de rascunhos em campos de texto longo para evitar perda por fechamento involuntário de janela.
4. **Acessibilidade e Conforto Visual**:
   - Suporte nativo a Modo Escuro (*Dark Mode*) com contrastes calculados para prevenir fadiga ocular em longas jornadas analíticas;
   - Navegação completa por teclado (foco visível e tabulação estruturada em todas as tabelas e botões);
   - Tipografia moderna e legível (Inter / Roboto) com dimensionamento tipográfico hierárquico.
5. **Adaptação para Telas Menores e Notebooks**:
   - Em telas menores (laptops de 13"-14"), a barra lateral recolhe automaticamente para ícones e o painel do Copilot atua como gaveta deslizante sobreposta (*overlay*), preservando 100% da usabilidade.

---

## 10. Wireframes Conceituais Textuais em ASCII

A seguir estão representados os layouts conceituais em ASCII das 8 telas e componentes mais críticos da V1:

### 10.1. Cockpit do Analista (`/cockpit`)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [APW] Analyst Workspace  |  Projeto: [Todos os Projetos ▼]  |  🔍 Buscar (Ctrl+K)   🔔(3)  [+ Demanda]│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ METAS & PULSO DO WORKSPACE                                                                       │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────────────┐ │
│ │ 4 Projetos    │ │ 7 Demandas    │ │ 2 Aguardando  │ │ 1 Divergência │ │ 3 Entregas Próximas  │ │
│ │ Ativos        │ │ em Andamento  │ │ Cliente (Bloq)│ │ Conciliação ❌│ │ nos Próximos 5 Dias   │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └──────────────────────┘ │
├──────────────────────────────────────────────────────────────────────┬───────────────────────────┤
│ 🚨 ATENÇÃO & BLOQUEIOS URGENTES                                      │ 🤖 COPILOT: PRIORIDADES   │
│ ┌──────────────────────────────────────────────────────────────────┐ │ 1. Validar Churn Alfa    │
│ │ [Demanda: Evasão 2025] ⚠️ Divergência de KPI no Faturamento      │ │    Entrega amanhã; restam │
│ │ Valor esperado difere do Power BI em R$ 8.000 (-0,55%)           │ │    2 KPIs não conferidos. │
│ │ Ação: [Abrir Reconciliação]  [Ver Histórico]                    │ │    [Executar Ação]        │
│ ├──────────────────────────────────────────────────────────────────┤ │                           │
│ │ [Demanda: Varejo Beta] ⏳ Aguardando Cliente (Mariana - 3 dias)  │ │ 2. Cobrar Dados Beta      │
│ │ Falta definição da regra de devolução e planilha de metas        │ │    Planilha de metas      │
│ │ Ação: [Copiar Mensagem de Cobrança]  [Ver Perguntas Enviadas]    │ │    pendente de envio.     │
│ └──────────────────────────────────────────────────────────────────┘ │    [Copiar Texto E-mail]  │
├──────────────────────────────────────────────────────────────────────┴───────────────────────────┤
│ 📋 DEMANDAS ATIVAS NO WORKSPACE                                                                  │
│ [Título da Demanda]            [Solicitante]   [Fase Atual]         [Prazo]    [Ações Rápidas]   │
│ Evasão Escolar Ensino Médio    Mariana (Colégio) Em Validação       28/09 (3d) [Abrir Workspace] │
│ Performance de Vendas Varejo   Carlos (Matriz)   Em Qualidade/Prep  05/10 (10d)[Abrir Workspace] │
│ Dash Financeiro Mensal         Ana (Finanças)    Em Clarificação    12/10 (17d)[Abrir Workspace] │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2. Pipeline Visual de Demandas (`/pipeline`)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [APW]  Pipeline de Demandas    Filtro: [Todos os Clientes ▼]  |  📦 [Suspensas (2)]  🚫 [Canceladas (1)]│
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬────┤
│ 1. NOVA (1) │ 2. CLARIF(1)│ 3. DADOS(1) │ 4. QUALID(1)│ 5. MODEL(1) │ 6. VALID(1) │ 7. PRONT(1) │8.OK│
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │... │
│ │Demanda D│ │ │Demanda C│ │ │Demanda E│ │ │Demanda B│ │ │Demanda F│ │ │Demanda A│ │ │Demanda G│ │    │
│ │Briefing │ │ │Aguardando│ │Planilhas│ │Tratando │ │Modelo PBI│ │⚠️ DIVERG.│ │Validação│ │    │
│ │Recebido │ │Cliente ⏳│ │Recebidas│ │Nulos/Dup │ │Estrela e  │ │Numérica ❌│ │Aprovada  │ │    │
│ │         │ │           │ │           │ │no P.Query │ │Medidas DAX│ │Faltam 2KPI│ │Sumário OK │ │    │
│ │Prazo:15d│ │Prazo: 8d  │ │Prazo: 12d │ │Prazo: 6d  │ │Prazo: 5d  │ │Prazo: 2d  │ │Prazo: 1d  │ │    │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴────┘
```

### 10.3. Espaço de Trabalho da Demanda (Hub Central com Abas)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Projetos > Colégio Futuro > Demanda: Evasão Escolar 2025           Estado: [6. Em Validação]     │
│ Solicitante: Mariana Souza | Prazo: 28/09 (3 dias restantes)       [Aprovar] [Decisão] [Dossiê] │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [1.Visão] [2.Requisitos] [3.Dados] [4.Qualidade] [5.Preparaç] [6.Planej] [7.PowerBI] [8.Análise]│
│ [9.Validação (Ativa)] [10.Entrega] [11.Dossiê & Portfólio]                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ÁREA DE CONTEÚDO DA ABA ATIVA (Exemplo: 9. Validação e Reconciliação)                            │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ CHECKLIST DE CAMADAS: [x] Dados  [x] Transformação  [x] DAX  [❌] KPIs  [x] Visual  [x] Requisito│ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ CONCILIAÇÃO NUMÉRICA CRUZADA DE KPIS (Tolerância Zero a Divergências)                         │ │
│ │ KPI Testado        Valor Base Controle   Valor Power BI    Divergência     Status    Ação    │ │
│ │ Total Alunos       1.850 alunos          1.850 alunos      0 (0,00%)       ✅ Aprovado [Ver]  │ │
│ │ Faturamento Bruto  R$ 1.450.200,00       R$ 1.442.200,00   -R$ 8.000 (-0,55%)❌ Diverg.[Reteste]│
│ │ Taxa Evasão (%)    6,16%                 6,16%             0,00%           ✅ Aprovado [Ver]  │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ⚠️ BLOQUEIO: Não é permitido avançar para "7. Pronta para Entrega" com divergências ativas.     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.4. Aba de Qualidade e Anomalias de Dados
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ESPAÇO DA DEMANDA > ABA 4: QUALIDADE E ANOMALIAS                                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ RESUMO DE ANOMALIAS: 🔴 1 Crítica  |  🟡 2 Médias  |  🟢 1 Tratada e Validada                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [+ Registrar Novo Problema de Qualidade]   [Filtro: Todos os Ativos ▼]   [Status: Abertos ▼]     │
│                                                                                                  │
│ [Tipo de Anomalia]   [Ativo/Coluna]       [Evidência/Volume]  [Impacto]       [Status]  [Ação]   │
│ Nulos em Campo Chave matriculas.xlsx/CPF  45 linhas (2,4%)    Quebra join PBI 🟡Tratado [Ver Dec]│
│ Valores Impossíveis  vendas.csv/Valor     12 linhas negativas Distorce Fatur. 🔴Aberto  [Resolver│
│ Data Inválida        chamados.csv/Data    8 linhas ano 1900   Distorce Churn  🟡Investig[Resolver│
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ DETALHE DA ANOMALIA SELECIONADA:                                                                 │
│ Evidência: 12 registros de faturamento com valores entre -R$ 150,00 e -R$ 1.200,00 (Linhas 42-54)│
│ Proposta da IA: "Estornos de teste detectados. Sugere-se filtrar na etapa Power Query M."        │
│ Decisão Humana: [X] Exclusão Fundamentada   [ ] Imputação   [ ] Aceitar como Restrição          │
│ Justificativa: [Testes de homologação do sistema confirmados pela TI como não faturáveis       ] │
│ [Confirmar Deliberação Humana]  [Vincular a Passo de Transformação Power Query]                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.5. Aba de Governança Power BI e Medidas DAX
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ESPAÇO DA DEMANDA > ABA 7: MODELAGEM POWER BI E MEDIDAS DAX                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MODELO ASSOCIADO: [analise_evasao_v1.pbix ▼]  [+ Associar Outro Modelo (0..N)] [Caminho: D:\...] │
│ Tabelas: fFrequencia (Fato), dAluno (Dim), dData (Calendário), dTurma (Dim)                      │
│ Tabela Calendário (dData): Período 01/01/2025 a 31/12/2025 | Granularidade: Diária              │
│ Relacionamentos: fFrequencia(AlunoID) 1:* dAluno(AlunoID) [Direção: Única]                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CATÁLOGO DE MEDIDAS DAX                                                    [+ Nova Medida DAX]   │
│ [Medida DAX]      [Tabela Hospedeira]  [Pasta de Exibição]  [KPI Vinculado]      [Status Conf.]  │
│ Tx Evasão (%)     _Medidas             Indicadores Churn    Taxa de Evasão       ✅ Validada      │
│ Total Alunos      _Medidas             Volumetria           Qtd Alunos Ativos    ✅ Validada      │
│ Evasão Móvel 60d  _Medidas             Tendência Temporal   Evasão Acumulada     ⏳ Não Testada   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CÓDIGO DA MEDIDA SELECIONADA: Tx Evasão (%)                                                      │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Tx Evasão (%) =                                                                              │ │
│ │ VAR TotalEvadidos = CALCULATE(COUNTROWS(fFrequencia), fFrequencia[Status] = "Evadido")       │ │
│ │ VAR TotalBase = COUNTROWS(dAluno)                                                            │ │
│ │ RETURN                                                                                       │ │
│ │     DIVIDE(TotalEvadidos, TotalBase, 0)                                                      │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ Regra de Negócio: Calcula a proporção de alunos desligados sobre a base ativa inicial do ano.    │
│ [Copiar DAX]   [Editar Medida]   [Solicitar Análise de Boas Práticas ao Copilot]                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.6. Central de Aprovações e Governança Humana (`/approvals`)
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [APW]  Central de Aprovações e Governança Humana                      Filtro: [Todos os Tipos ▼] │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ⚖️ 3 AÇÕES AGUARDANDO SUA DELIBERAÇÃO SOBERANA                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ITEM 1: PROPOSTA DE REQUISITOS (Demanda: Churn Varejo)                   🟣 [SugeridoPorIA]   │ │
│ │ Origem: IA processou a solicitação bruta de Carlos e propôs 4 requisitos e 2 restrições.     │ │
│ │ Consequência: Homologará o escopo oficial da demanda no projeto.                             │ │
│ │ Ações: [Aprovar na Íntegra]   [Editar antes de Aprovar]   [Rejeitar e Solicitar Nova Análise]│ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ ITEM 2: DESCARTE DE DADOS EM ANOMALIA (Demanda: Evasão Escolar)          🟡 [PendenteDecisão] │ │
│ │ Origem: 12 registros de faturamento negativo identificados na base vendas.csv.               │ │
│ │ Proposta do Analista: Excluir 12 linhas fundamentado em teste de homologação.                │ │
│ │ Consequência: Remove 12 linhas da base tratada no Power Query M com registro auditável.       │ │
│ │ Ações: [Homologar Exclusão e Gravar Decisão]   [Cancelar Descarte]                           │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ ITEM 3: RETOMADA DE DEMANDA SUSPENSA (Demanda: Dash Financeiro)          ⚪ [EstadoExcepcional]│ │
│ │ Origem: Demanda pausada por solicitação do cliente em 10/09; cliente autorizou continuidade. │ │
│ │ Consequência: Reingressa a demanda diretamente no estado "Em Clarificação".                  │ │
│ │ Ações: [Autorizar Retomada no Fluxo]   [Manter Suspensa]                                     │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.7. Painel Contextual do Copilot Proativo (Right Drawer)
```
┌──────────────────────────────────────────────────────┐
│ 🤖 COPILOT PROATIVO          [Fixar 📌] [Fechar ✕]   │
│ Contexto Ativo: Demanda Evasão > Aba 9: Validação     │
│ Papel Atual: Validador Crítico de Conciliação        │
├──────────────────────────────────────────────────────┤
│ 💡 DIAGNÓSTICO EM TEMPO REAL                         │
│ Identifiquei uma divergência de R$ 8.000 (-0,55%)    │
│ entre o Power BI e o Balancete Contábil.             │
│                                                      │
│ 🔍 ANÁLISE DE CAUSA PROVÁVEL:                        │
│ 🔵 [Fato Observado]: A base vendas.csv tem 8 notas   │
│    emitidas em 31/12/2025 às 23:50.                  │
│ 🟣 [Sugestão da IA]: O filtro de data na dData       │
│    pode estar truncando horas após as 18:00.         │
│                                                      │
│ 🛠️ AÇÃO SUGERIDA:                                    │
│ "Verifique se a coluna Data no Power Query foi       │
│ tipada como 'Date' e não como 'DateTime'."           │
│                                                      │
│ [Copiar Instrução de Ajuste] [Revisar Script M]      │
├──────────────────────────────────────────────────────┤
│ 💬 DIÁLOGO CONTEXTUAL:                               │
│ [Analista]: Como ajusto isso no Power Query sem      │
│ quebrar os relacionamentos do modelo?                │
│                                                      │
│ [Copilot]: Você pode aplicar o passo:                │
│ `Table.TransformColumnTypes(Fonte, {{"Data",         │
│ type date}})` antes da junção com a dData.           │
│ Deseja que eu rascunhe o passo completo?             │
│                                                      │
│ [ Digite sua pergunta sobre esta demanda...      ]   │
└──────────────────────────────────────────────────────┘
```

### 10.8. Aba de Dossiê Vivo e Síntese de Portfólio Higienizado
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ESPAÇO DA DEMANDA > ABA 11: DOSSIÊ VIVO E PORTFÓLIO HIGIENIZADO                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ VISÃO SELECIONADA: [Dossiê Técnico Concorrente ▼]  [Alternar para: Estudo de Caso de Portfólio]  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔒 SEGURANÇA E HIGIENIZAÇÃO DE DADOS PARA PORTFÓLIO                                              │
│ Status da Anonimização: ✅ 100% Higienizado (Zero PII / Sem Dados Confidenciais de Clientes)     │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ VERSÃO CANDIDATA DE ESTUDO DE CASO PARA PORTFÓLIO (Estrutura STAR/Profissional)                  │
│ (Gerada com apoio da IA - sujeita a revisão e aprovação humana obrigatória APROV-10)             │
│                                                                                                  │
│ Título: Otimização de Retenção e Análise Preditiva de Churn em Instituição Educacional de Grande Porte│
│                                                                                                  │
│ 1. Contexto e Problema de Negócio:                                                               │
│    Instituição privada de ensino enfrentava crescimento de evasão no Ensino Médio. Requisitos   │
│    iniciais vagos foram estruturados metodologicamente, isolando fatores críticos de abandono.   │
│                                                                                                  │
│ 2. Preparação e Governança de Dados:                                                             │
│    Tratamento de 19.000+ registros locais em Excel/Power Query com tipagem estrita, eliminação   │
│    de 12 duplicidades e modelagem dimensional em Power BI com Tabela Calendário padronizada.     │
│                                                                                                  │
│ 3. Validação e Resultados Fatuais:                                                               │
│    Reconciliação cruzada com tolerância zero contra bases de controle. Evidências demonstraram   │
│    que estudantes com mais de 12 faltas nas primeiras 8 semanas possuem probabilidade de evasão  │
│    3,8x superior à média, permitindo intervenção pedagógica preventiva imediata.                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [X] Atesto que revisei o texto e confirmo que nenhum dado sensível ou real permaneceu no case.   │
│ [Aprovar Versão Candidata (APROV-10)]   [Aprovar Snippets DAX para Memória Operacional]          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Matriz de Rastreabilidade Bidirecional UX

A tabela a seguir consolida a amarração estrita e bidirecional ligando cada **Área/Tela de UX** às **Jornadas de Interação**, às **Capacidades Funcionais (CF)**, aos **Requisitos Funcionais (RF)**, às **Entidades de Domínio** e às **Fases do Workflow Operacional**:

| Área / Tela da Interface | Jornadas Suportadas | Capacidades Funcionais (CF) | Requisitos Funcionais (RF) | Entidades do Domínio | Fases do Professional-Workflow |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Área 1: Centro de Comando (Cockpit)** | J-J, J-L | CF-21, CF-23, CF-24 | RF-058, RF-060 | `Projeto`, `Demanda`, `Validacao`, `ProblemaDeQualidade` | Visão Transversal Permanente |
| **Área 2: Projetos e Solicitantes** | J-A, J-L | CF-01 | RF-001, RF-002, RF-003, RF-005 | `Solicitante`, `Projeto`, `Demanda` | Fase 1: Entrada da Demanda |
| **Área 3: Pipeline Visual (Quadro)** | J-A, J-K, J-L | CF-22, CF-23 | RF-059, RF-060 | `Demanda`, `EstadoDemanda` | Todas as Fases (Monitoramento) |
| **Aba 4.1: Visão Geral e Decisões** | J-A, J-I, J-J | CF-01, CF-15, CF-19 | RF-005, RF-006, RF-043 a RF-045, RF-055 | `Demanda`, `Decisao`, `Projeto` | Fases 1, 11 (e Transversal) |
| **Aba 4.2: Requisitos e Clarificação** | J-A, J-B | CF-02, CF-03, CF-04, CF-05 | RF-004, RF-007 a RF-012 | `Demanda`, `Requisito`, `PerguntaDeClarificacao` | Fases 1 e 2: Entrada e Clarificação |
| **Aba 4.3: Dados e Inventário** | J-C | CF-06 | RF-013 a RF-017 | `AtivoDeDados`, `Demanda` | Fase 3: Recebimento e Inventário |
| **Aba 4.4: Qualidade e Anomalias** | J-D | CF-07, CF-15 | RF-018 a RF-022, RF-043 | `ProblemaDeQualidade`, `AtivoDeDados`, `Decisao` | Fase 4: Inspeção e Qualidade |
| **Aba 4.5: Preparação e Transformação** | J-D | CF-08, CF-15 | RF-023 a RF-026 | `Transformacao`, `AtivoDeDados`, `ProblemaDeQualidade` | Fase 6: Preparação e Transformação |
| **Aba 4.6: Planejamento, Hipóteses e KPIs** | J-E | CF-09, CF-10, CF-11 | RF-027 a RF-033 | `PerguntaAnalitica`, `Hipotese`, `IndicadorKPI` | Fase 5: Planejamento Analítico |
| **Aba 4.7: Modelagem Power BI e DAX** | J-F | CF-12, CF-13 | RF-034 a RF-038 | `ModeloPowerBI` (0..N), `MedidaDAX`, `IndicadorKPI` | Fase 7: Modelagem e Power BI |
| **Aba 4.8: Análise, Evidências e Achados** | J-F, J-H | CF-10, CF-14 | RF-039 a RF-042 | `Evidencia`, `AchadoAnalitico`, `Hipotese` | Fase 8: Análise e Interpretação |
| **Aba 4.9: Validação e Reconciliação** | J-G | CF-16 | RF-046 a RF-050 | `Validacao`, `IndicadorKPI`, `MedidaDAX`, `Demanda` | Fase 9: Validação Multicamadas |
| **Aba 4.10: Entregáveis e Encerramento** | J-H, J-I | CF-17, CF-19 | RF-051, RF-052, RF-055 | `Entregavel`, `Demanda`, `AchadoAnalitico` | Fases 10 e 11: Entrega e Fechamento |
| **Aba 4.11: Dossiê Vivo e Portfólio** | J-H, J-I | CF-18, CF-20 | RF-053, RF-054, RF-056, RF-057 | `AtivoDeAprendizado`, `Demanda`, `Decisao` | Fases 11 e 12: Dossiê e Reutilização |
| **Área 5: Central de Aprovações** | Transversal | CF-25 | Todos os RFs com aprovação | Entidades em deliberação humana | Transversal a todas as fases |
| **Área 6: Repositório de Conhecimento e Portfólio** | J-I | CF-20 | RF-056, RF-057 | `AtivoDeAprendizado`, `Decisao` | Fase 12: Reutilização Profissional (com APROV-10 obrigatório) |
| **Área 7: Copilot Proativo (Drawer)** | Transversal | CF-03, CF-04, CF-24 | RF-007, RF-009, RF-024, RF-038, RF-052 | Transversal com rótulo epistêmico | Transversal a todas as fases |

---

## 12. Critérios de Pronto da Especificação de UX (Definition of Done)

Esta especificação de UX e navegação cumpre integralmente os 10 critérios normativos estabelecidos:
1. **Áreas da Aplicação Mapeadas**: 7 áreas e 11 abas contextuais no Workspace da Demanda claramente delimitadas;
2. **Navegação Definida**: Shell Global, atalhos de teclado, trilhas breadcrumb e alternância fluida de abas descritos em detalhe;
3. **Fluxo da Demanda Rastreável**: A esteira de 8 estágios normais e os 2 estados excepcionais demonstram exatamente como a demanda transita do início ao fim;
4. **Atuação da IA Delimitada**: Papéis contextuais em cada fase, rótulos epistêmicos e gaveta lateral de assistência especificados;
5. **Soberania Humana Garantida**: 10 pontos obrigatórios de aprovação com interface dedicada na Central de Aprovações;
6. **Bloqueios e Prevenção de Erros Explicados**: Travas determinísticas para avanço indevido com critérios de destravamento objetivos;
7. **Tratamento de Erros e Reversibilidade**: Modais de justificativa, histórico auditável e retomada de demandas suspensas detalhados;
8. **Redução de Esforço Manual Demonstrada**: 5 oportunidades de eliminação de digitação e geração de documentação concorrente formalizadas;
9. **Rastreabilidade Bidirecional Comprovada**: Matriz unindo UX $\rightarrow$ Jornadas $\rightarrow$ CF $\rightarrow$ RF $\rightarrow$ Domínio $\rightarrow$ Fases;
10. **Aptidão para Testes Automatizados e E2E**: Especificação suficientemente granular para orientar a construção direta de suítes de testes End-to-End com Playwright na fase de implementação.

---

## 13. Registro de Inconsistências e Observações para Revisão Humana

Em estrita consonância com a governança do [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md):
- **Constatação**: Nenhuma nova ambiguidade conceitual ou inconsistência entre documentos normativos foi detectada durante a elaboração desta especificação de UX.
- **Harmonia Normativa**: Todas as resoluções humanas aprovadas anteriormente (cardinalidade `Demanda 1 → 0..N ModeloPowerBI`, estados excepcionais `Suspensa`/`Cancelada` não sequenciais e formulação conceitual neutra de `Proteção Rigorosa de Dados e Privacidade`) foram rigorosamente incorporadas a esta arquitetura de informação e navegação.
- **Refinamentos de Consistência Aplicados**:
  1. *Escopo Tecnológico da V1*: Padronização rigorosa da terminologia para "Preparação e Transformação" (Excel e Power Query M), eliminando menções a engenharia pesada ou tecnologias de versões futuras (como SQL, Python, dbt ou Fabric);
  2. *Uso de Dados pelo Copilot*: Alinhamento estrito ao princípio de que dados reais, pessoais, confidenciais, sigilosos ou corporativos não devem ser enviados a provedores externos de IA sem autorização e salvaguardas adequadas, sem proibições absolutas de processamento ou exigência exclusiva de metadados, e sem nomear componentes arquiteturais antecipados;
  3. *Sanitização para Portfólio*: A automação assistida gera exclusivamente uma versão candidata sanitizada de estudo de caso para revisão e aprovação humana soberana (APROV-10). Nenhum caso real é publicado, compartilhado ou promovido automaticamente ao portfólio.

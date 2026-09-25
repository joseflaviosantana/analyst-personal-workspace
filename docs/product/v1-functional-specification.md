# Especificação Funcional da Versão 1 (V1) — Analyst Personal Workspace

## 1. Identificação e Metadados do Documento

- **Documento**: Especificação Funcional do Produto (Functional Specification Document — FSD)
- **Versão do Documento**: 1.0.0
- **Versão Alvo do Produto**: Versão 1 (V1 — Analytics e Business Intelligence)
- **Status**: Proposta Formal de Especificação Funcional
- **Classificação**: Documento Normativo Interno de Produto
- **Fontes Normativas Vinculantes**:
  - [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md) — Regras Operacionais para Agentes de IA;
  - [`docs/product/vision.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/vision.md) — Visão de Produto;
  - [`docs/product/v1-scope.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/v1-scope.md) — Escopo da Versão 1 (V1);
  - [`docs/product/roadmap.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/roadmap.md) — Roadmap Estratégico;
  - [`docs/product/professional-workflow.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/professional-workflow.md) — Workflow Profissional da V1;
  - [`docs/architecture/ADR-001-v1-foundation.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/architecture/ADR-001-v1-foundation.md) — Definição da Arquitetura Base e Stack Tecnológica para a V1;
  - [`docs/domain/v1-domain-model.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/domain/v1-domain-model.md) — Modelo de Domínio Conceitual da V1.

---

## 2. Visão Geral e Objetivos do Sistema na V1

### 2.1. Propósito Funcional da V1
O **Analyst Personal Workspace** é um sistema operacional pessoal concebido para que o analista de dados conduza demandas profissionais de **Analytics e Business Intelligence (BI)** do início ao fim com rigor metodológico, rastreabilidade plena e governança.

O sistema atua como o ambiente central de condução do raciocínio analítico e do fluxo de trabalho, suportando o ciclo completo:
$$\text{Recepção da Demanda} \longrightarrow \text{Estruturação de Requisitos} \longrightarrow \text{Clarificação com Cliente}$$
$$\longrightarrow \text{Inventário e Qualidade de Dados} \longrightarrow \text{Planejamento Analítico e Hipóteses}$$
$$\longrightarrow \text{Acompanhamento de Transformações (Excel / Power Query)}$$
$$\longrightarrow \text{Governança de Modelagem e Medidas DAX (Power BI)}$$
$$\longrightarrow \text{Validação Multicamadas e Reconciliação} \longrightarrow \text{Empacotamento de Entregáveis}$$
$$\longrightarrow \text{Encerramento e Documentação Concorrente} \longrightarrow \text{Síntese de Portfólio Higienizado}$$

### 2.2. O que o Sistema É e o que o Sistema NÃO É na V1
- **O que o sistema É**:
  - Um console operacional unificado para gestão analítica de demandas, auditoria de dados, governança de modelos externos e documentação viva;
  - Uma plataforma de colaboração estruturada entre **Humano e IA**, onde a IA atua como Copilot Proativo e o humano detém soberania irrevogável;
  - Uma ferramenta de trabalho profissional operando sob o paradigma **Local-First**, protegendo a confidencialidade de dados empresariais reais.
- **O que o sistema NÃO É**:
  - **Não é substituto do Power BI Desktop**: A modelagem relacional visual e a criação de dashboards gráficos continuam sendo realizadas no Power BI Desktop. O Workspace audita, acompanha, cataloga e documenta o projeto externo;
  - **Não é executor de Power Query**: O Workspace não executa internamente o motor M nem substitui o editor do Power Query; ele registra e rastreia os passos de transformação executados pelo analista;
  - **Não é um chatbot genérico descontextualizado**: A IA opera integrada aos metadados, regras de negócio e validações das entidades do projeto;
  - **Não é gerenciador de banco de dados corporativo SQL**: A V1 não expõe consultas SQL dinâmicas nem provisiona bancos relacionais analíticos (escopo da V2);
  - **Não é plataforma multi-usuário em nuvem**: O sistema opera monousuário, na estação de trabalho do analista, sem autenticação externa complexa na V1.

### 2.3. Princípios Operacionais da V1
1. **Autoridade Humana Irrestrita**: Toda aprovação, envio externo, descarte de dados e homologação de entrega depende de ato voluntário e explícito do analista.
2. **Diferenciação Epistêmica Rigorosa**: O sistema diferencia formalmente o que é **Fato Observado**, **Evidência Numérica**, **Hipótese**, **Inferência**, **Achado Analítico** e **Decisão Humana**.
3. **Auditoria e Rastreabilidade Bidirecional**: A partir de um número no entregável final, deve ser possível rastrear a medida DAX, a transformação aplicada, o problema de qualidade sanado, o ativo de dados de origem e o requisito contratual inicial (e vice-versa).
4. **Segregação Rigorosa entre Dados e Metadados**: Dados reais, pessoais e corporativos permanecem restritos ao disco local e não são versionados em repositório nem enviados sem controle a terceiros. O Workspace opera e persiste os metadados de trabalho e governança.
5. **Documentação Concorrente**: A documentação viva é gerada automaticamente como subproduto da execução de cada fase, combatendo o esquecimento histórico.

---

## 3. Módulos e Capacidades Funcionais da V1

A seguir, são detalhadas as **25 capacidades funcionais obrigatórias** da V1, estruturadas sob 12 atributos normativos de especificação funcional.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MÓDULOS FUNCIONAIS DA VERSÃO 1                       │
├──────────────────────────────────┬─────────────────────────────────────┤
│ M-01: Gestão de Projetos/Demandas│ M-08: Análise, Evidências e Achados │
│ M-02: Clarificação de Requisitos │ M-09: Decisões Transversais         │
│ M-03: Inventário de Dados        │ M-10: Validação e Reconciliação     │
│ M-04: Qualidade e Anomalias      │ M-11: Entregáveis e Documentação    │
│ M-05: Transformações e Prep      │ M-12: Encerramento e Portfólio      │
│ M-06: Planejamento e KPIs        │ M-13: Cockpit e Pipeline Visual     │
│ M-07: Governança do Power BI/DAX │ M-14: Copilot Proativo e Governança │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

### CF-01: Entrada e Criação de Projeto e Demanda
- **Objetivo**: Permitir a inicialização de um contexto de trabalho de negócio, organizando iniciativas estratégicas (Projetos) e suas unidades de execução (Demandas) associadas a um solicitante.
- **Usuário/Ator**: Analista de Dados (Humano).
- **Entradas**:
  - Dados do Solicitante (nome, organização/área, papel de negócio, canal de contato);
  - Dados do Projeto (nome, contexto estratégico, datas previstas); ou seleção de Projeto existente;
  - Dados da Demanda (título da demanda, prazo ou expectativa temporal acordada, restrições iniciais declaradas).
- **Comportamento Esperado**: O sistema registra o Solicitante (caso inédito), instancia o Projeto associado (ou vincula a um projeto já existente) e cria a Demanda no estado inicial `Nova`. O sistema estabelece a chave de rastreabilidade única da demanda para todos os futuros registros. Caso o trabalho seja pontual, o sistema permite a criação rápida de Projeto com Demanda unificada direta.
- **Informações Registradas**: Identificador único do Solicitante, do Projeto e da Demanda; metadados de abertura (data/hora, autor humano, status inicial `Nova`, prazo acordado).
- **Saídas**: Registro de Projeto e Demanda consolidados no sistema; disponibilização imediata da demanda no Pipeline do Cockpit.
- **Validações**:
  - Título da Demanda e Nome do Solicitante são campos obrigatórios;
  - Data prevista de entrega não pode ser anterior à data de abertura;
  - Projeto deve possuir pelo menos um Solicitante vinculado.
- **Possíveis Estados**:
  - Projeto: `Ativo`, `Pausado`, `Concluído`, `Cancelado`;
  - Demanda: `Nova` (estado inicial obrigatório).
- **Dependências Conceituais**: Entidades `Solicitante`, `Projeto`, `Demanda`.
- **Participação da IA**: Nenhuma na criação básica; a IA fica em prontidão aguardando a inserção da solicitação bruta.
- **Ação que Exige Aprovação Humana**: Criação formal, alteração de prazos e definição do escopo macro da demanda.
- **Critérios de Aceite**: O analista consegue criar um novo projeto com uma nova demanda vinculada em menos de 1 minuto, visualizando-a imediatamente na coluna `Nova` do pipeline.

---

### CF-02: Captura da Solicitação Inicial em Linguagem Natural
- **Objetivo**: Registrar integralmente e sem perdas o briefing original recebido do solicitante em seu formato nativo e espontâneo.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Texto bruto copiado de e-mail, mensagem instantânea de chat corporativo, notas de reunião, transcrição de áudio ou documento de briefing.
- **Comportamento Esperado**: O sistema armazena o texto de forma imutável no campo `solicitacaoBruta` da Demanda. O texto original é mantido como evidência primária de auditoria contratual, nunca sendo sobrescrito por processamentos posteriores.
- **Informações Registradas**: Texto integral da solicitação bruta, data/hora de inserção, canal/origem da mensagem.
- **Saídas**: Painel de visualização da solicitação bruta preservada na aba de requisitos da demanda.
- **Validações**: Texto da solicitação bruta não pode ser vazio.
- **Possíveis Estados**: Demanda permanece no estado `Nova` ou transita para `Em Clarificação` após início da estruturação.
- **Dependências Conceituais**: Entidade `Demanda` (campo `solicitacaoBruta`).
- **Participação da IA**: Ingestão passiva do texto para servir de insumo à estruturação assistida.
- **Ação que Exige Aprovação Humana**: Confirmação da colagem e salvamento do texto original.
- **Critérios de Aceite**: O texto fornecido é preservado caractere por caractere, permitindo consulta histórica a qualquer momento do ciclo de vida da demanda.

---

### CF-03: Estruturação Assistida da Demanda pela IA
- **Objetivo**: Auxiliar o analista a decompor o texto desestruturado da solicitação bruta em elementos conceituais objetivos de negócio e engenharia analítica.
- **Usuário/Ator**: Copilot Proativo (IA) e Analista de Dados (Humano).
- **Entradas**: Texto da `solicitacaoBruta` da Demanda.
- **Comportamento Esperado**: O Copilot analisa semanticamente o texto bruto e apresenta uma proposta estruturada contendo:
  1. Problema central de negócio (a dor do cliente);
  2. Objetivo analítico declarado (o que deve ser respondido/construído);
  3. Solicitante identificado e contexto organizacional;
  4. Prazos e marcos identificados;
  5. Entregáveis esperados sugeridos (dashboard Power BI, relatório PDF executivo, planilha tratada);
  6. Fontes ou arquivos de dados mencionados;
  7. Restrições e limitações declaradas.
  Todos os campos propostos recebem a marcação `SugeridoPorIA`.
- **Informações Registradas**: Proposta estruturada da demanda vinculada à versão original; histórico de sugestões.
- **Saídas**: Rascunho estruturado da demanda exibido para inspeção e edição do analista.
- **Validações**:
  - A IA não pode alucinar informações ausentes: campos não mencionados no texto bruto devem ser explicitamente marcados como "Não informado";
  - O sistema impede que a proposta da IA altere diretamente a demanda sem aprovação humana.
- **Possíveis Estados**: Demanda no estado `Nova` ou `Em Clarificação`.
- **Dependências Conceituais**: Entidade `Demanda`, `OrigemAutoria` (`SugeridoPorIA`).
- **Participação da IA**: Extração de entidades, sumarização, identificação de intenções e formulação de proposta estruturada.
- **Ação que Exige Aprovação Humana**: O analista deve revisar cada campo proposto pela IA, aceitar, editar ou rejeitar individualmente antes de gravar os dados definitivos da demanda (`AprovadoPorHumano`).
- **Critérios de Aceite**: O sistema gera a proposta estruturada a partir do texto bruto em segundos, sinalizando com destaque visual o que foi extraído e o que permaneceu como "Não informado".

---

### CF-04: Identificação de Informações Ausentes e Ambiguidades
- **Objetivo**: Detectar sistemática e proativamente lacunas de especificação, contradições internas, premissas implícitas ou dados omitidos que possam comprometer a execução técnica.
- **Usuário/Ator**: Copilot Proativo (IA) e Analista de Dados.
- **Entradas**: Demanda estruturada, solicitação bruta e histórico de interações.
- **Comportamento Esperado**: O sistema realiza uma varredura crítica buscando:
  - Granularidade temporal ou dimensional não definida;
  - Regras de negócio essenciais ausentes (ex.: critérios de inativação de clientes, política de devoluções, datas de corte contábil);
  - Fontes de dados necessárias não referenciadas;
  - Prazos inexequíveis ou sem critérios de aceite claros.
  O sistema compila uma lista estruturada de **Lacunas e Ambiguidades**, classificando cada uma por severidade de risco para o projeto.
- **Informações Registradas**: Lista de lacunas identificadas, categoria (Requisito, Dados, Regra de Negócio, Prazos/Escopo), justificativa do risco e status da lacuna (`Identificada`, `Em Clarificação`, `Resolvida`, `Aceita como Risco`).
- **Saídas**: Painel de pendências e lacunas críticas exibido na Demanda e no Cockpit.
- **Validações**: Cada lacuna deve conter descrição detalhada do impacto potencial no resultado analítico.
- **Possíveis Estados**: Demanda no estado `Em Clarificação`.
- **Dependências Conceituais**: Entidade `Demanda`, `Requisito`.
- **Participação da IA**: Atuação como crítico de negócio e investigador de lacunas estruturais.
- **Ação que Exige Aprovação Humana**: Validação pelo analista de quais lacunas representam riscos reais e merecem questionamento formal ao contratante.
- **Critérios de Aceite**: O analista visualiza claramente as ambiguidades mapeadas pelo Copilot com a justificativa do porquê cada ponto pode inviabilizar a análise se não esclarecido.

---

### CF-05: Formulação de Perguntas de Clarificação com Aprovação Humana
- **Objetivo**: Elaborar questionamentos objetivos, profissionais e sem jargões técnicos para sanar as lacunas identificadas junto ao solicitante, garantindo governança estrita sobre a comunicação externa.
- **Usuário/Ator**: Copilot Proativo (elaboração) e Analista de Dados (revisão e despacho).
- **Entradas**: Lacunas identificadas na Demanda e contexto do Solicitante.
- **Comportamento Esperado**: O Copilot gera rascunhos de perguntas claras e contextualizadas. O sistema vincula cada pergunta à lacuna ou requisito de origem. Quando o analista obtém o retorno externo, ele insere a resposta do cliente no sistema, o que automaticamente atualiza os requisitos ou gera uma nova decisão de projeto.
- **Informações Registradas**:
  - Enunciado da pergunta de clarificação;
  - Motivação (qual lacuna a gerou);
  - Status (`Rascunho`, `Enviada`, `Respondida`, `Descartada`);
  - Data de envio (registrada manualmente pelo analista);
  - Resposta formal recebida;
  - Decisão ou alteração de requisito decorrente da resposta.
- **Saídas**: Roteiro formatado de perguntas para envio pelo analista; atualização do status da demanda para `Dados Recebidos` ou avanço nos requisitos.
- **Validações**:
  - Proibição absoluta de disparo autônomo de mensagens ou e-mails pelo sistema ou pela IA;
  - Nenhuma pergunta pode transitar para `Enviada` sem confirmação do analista.
- **Possíveis Estados da Pergunta**: `Rascunho` $\rightarrow$ `Enviada` $\rightarrow$ `Respondida` (ou `Descartada`).
- **Dependências Conceituais**: Entidade `PerguntaDeClarificacao`, vinculada a `Demanda` e `Requisito`.
- **Participação da IA**: Redação assistida dos questionamentos, sugestão de tom de voz profissional e síntese da resposta recebida em regras de negócio.
- **Ação que Exige Aprovação Humana**: Revisão do texto da pergunta, aprovação do envio, envio no canal real de comunicação com o cliente e registro da resposta recebida.
- **Critérios de Aceite**: Perguntas geradas são salvas inicialmente em `Rascunho`; a transição de estado da demanda não pode ser concluída com perguntas críticas pendentes sem justificativa formal.

---

### CF-06: Cadastro e Inventário de Ativos de Dados
- **Objetivo**: Catalogar sistematicamente todos os arquivos e bases tabulares locais recebidos para a demanda, registrando metadados estruturais e garantindo a imutabilidade dos dados brutos de origem.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Arquivo de dados tabular local (`.xlsx`, `.xls`, `.csv`, `.txt` ou bases de suporte tratadas) e caminho de referência no disco local do analista.
- **Comportamento Esperado**: O sistema registra o ativo de dados sem copiar ou mover indevidamente o arquivo. Registra o caminho absoluto local, lê ou solicita a inspeção de metadados estruturais (formato, tamanho, data de modificação, contagem de colunas/linhas, granularidade aparente, período temporal) e marca a fonte bruta como somente-leitura conceitual (`read-only`).
- **Informações Registradas**:
  - Identificador único do ativo;
  - Nome do arquivo e caminho de referência local;
  - Formato técnico descritivo (`XLSX`, `CSV`, etc.);
  - Origem declarada (sistema gerador, departamento, responsável pelo envio);
  - Descrição do conteúdo e granularidade observada;
  - Período temporal coberto (início, fim);
  - Quantidade de linhas e colunas;
  - Data/hora de recebimento no projeto;
  - Lista de colunas/campos essenciais e tipos aparentes.
- **Saídas**: Ficha de inventário do ativo de dados vinculada à Demanda; desbloqueio da fase de inspeção de qualidade.
- **Validações**:
  - Caminho local deve apontar para arquivo acessível na máquina do analista;
  - Proibição de inclusão de dados brutos reais no histórico versionável da aplicação;
  - Pelo menos um ativo de dados é requerido para transitar a demanda para o estado `Dados Recebidos`.
- **Possíveis Estados**: Demanda transita para `Dados Recebidos`. Ativo de Dados: `Cadastrado`, `Em Inspeção`, `Ativo`, `Substituído/Obsoleto`.
- **Dependências Conceituais**: Entidade `AtivoDeDados`, vinculada a `Demanda`.
- **Participação da IA**: Apoio na inferência de granularidade e descrição da base a partir da lista de colunas fornecida.
- **Ação que Exige Aprovação Humana**: Homologação do inventário de arquivos e declaração formal de recebimento dos dados.
- **Critérios de Aceite**: O analista registra o arquivo e tem disponível a ficha de inventário completa, com rastreabilidade da proveniência da base.

---

### CF-07: Registro e Acompanhamento de Problemas de Qualidade
- **Objetivo**: Identificar, categorizar, quantificar e acompanhar o tratamento de anomalias e inconsistências nos dados brutos através de um fluxo auditável de resolução.
- **Usuário/Ator**: Analista de Dados (com apoio investigativo do Copilot).
- **Entradas**: Ativo de dados inventariado, amostras inspecionadas e regras de consistência esperadas.
- **Comportamento Esperado**: Para cada anomalia encontrada (nulos/em branco, duplicidade de chaves, tipos incompatíveis, datas corrompidas, categorias divergentes, violação de domínios ou quebra de integridade referencial), o sistema cria um registro estruturado. O analista define a ação corretiva a ser executada nas ferramentas especializadas e, posteriormente, registra a validação pós-tratamento.
- **Informações Registradas**:
  - Identificador do problema;
  - Ativo de dados afetado;
  - Tipo de anomalia (Nulos, Duplicidade, Tipagem, Data Inválida, Categoria Inconsistente, Regra de Domínio, Integridade Referencial);
  - Evidência factual (tabela, coluna, volume absoluto e percentual de linhas afetadas, amostra do erro);
  - Severidade de impacto analítico (`Baixa`, `Média`, `Alta`, `Crítica`);
  - Impacto potencial no negócio e nos cálculos;
  - Ação deliberada (Imputação fundamentada, Exclusão justificada, Consulta ao contratante, Correção de tipo, Manutenção com flag);
  - Status (`Aberto`, `Em Investigação`, `Tratado`, `Aceito como Restrição`);
  - Registro de validação pós-tratamento (atestando resolução).
- **Saídas**: Painel de problemas de qualidade com contadores de severidade; alertas de bloqueio no Cockpit para anomalias `Críticas` não tratadas.
- **Validações**:
  - Proibição absoluta de exclusão ou alteração de dados sem registro prévio de evidência e justificativa formal;
  - Demanda não pode transitar para `Em Modelagem e Análise` com anomalias de severidade `Crítica` no status `Aberto`.
- **Possíveis Estados do Problema**: `Aberto` $\rightarrow$ `Em Investigação` $\rightarrow$ `Tratado` (ou `Aceito como Restrição`). Demanda no estado `Em Qualidade e Preparação`.
- **Dependências Conceituais**: Entidade `ProblemaDeQualidade`, vinculada a `AtivoDeDados`, originando `Transformacao` e `Decisao`.
- **Participação da IA**: Papel de Investigador: sugere testes de integridade a realizar, alerta sobre padrões suspeitos em categorias e auxilia a formular a justificativa técnica.
- **Ação que Exige Aprovação Humana**: Decisão sobre a ação corretiva a adotar e homologação do tratamento.
- **Critérios de Aceite**: Toda anomalia possui localização exata, volume medido e justificativa documentada antes de qualquer transformação ser dada como concluída.

---

### CF-08: Registro de Transformações Realizadas em Excel/Power Query
- **Objetivo**: Acompanhar, documentar e manter a linhagem das transformações de dados executadas no Excel ou no Power Query, garantindo reprodutibilidade e rastreabilidade da engenharia de dados.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Descrição da transformação, ferramenta utilizada (Excel, Power Query M), passos aplicados, código M ou fórmula representativa, ativos de dados de entrada e tabelas tratadas geradas.
- **Comportamento Esperado**: O analista registra o passo de transformação associando-o ao problema de qualidade que ele soluciona ou ao requisito de engenharia que atende (ex.: remoção de linhas de cabeçalho duplo, unpivot de colunas de meses, junção merge com tabela de códigos, tipagem de colunas monetárias). O Workspace documenta a regra e mapeia a origem e o destino da informação.
- **Informações Registradas**:
  - Identificador da transformação;
  - Ferramenta utilizada (`Power Query M`, `Excel`);
  - Nome do passo / consulta tratada resultante;
  - Código M ou expressão de transformação documental;
  - Descrição da alteração estrutural;
  - Problema de qualidade vinculado (se houver);
  - Entradas consumidas vs. Saídas produzidas;
  - Verificação de não-duplicação de cardinalidade em junções.
- **Saídas**: Linhagem documental das transformações do projeto; histórico de engenharia de dados anexo ao dossiê vivo.
- **Validações**:
  - Toda transformação deve indicar o ativo de dados de entrada e a motivação analítica;
  - Em transformações de junção (*merge*), deve haver confirmação explícita de que a cardinalidade foi conferida para evitar duplicação inadvertida de linhas.
- **Possíveis Estados**: Demanda no estado `Em Qualidade e Preparação`.
- **Dependências Conceituais**: Entidade `Transformacao`, vinculada a `AtivoDeDados`, `ProblemaDeQualidade` e `Decisao`.
- **Participação da IA**: Auxílio na documentação explicativa de scripts M e sugestão de boas práticas de transformação (ex.: recomendar unpivot em vez de múltiplas colunas de valores).
- **Ação que Exige Aprovação Humana**: Confirmação do registro da transformação e ateste de que os dados tratados foram verificados.
- **Critérios de Aceite**: O analista documenta os passos aplicados no Power Query de modo que outro analista consiga reproduzir integralmente o tratamento sem ambiguidades.

---

### CF-09: Planejamento Analítico
- **Objetivo**: Estruturar formalmente a lógica de investigação e a arquitetura analítica antes da construção de relatórios ou telas no Power BI, combatendo análises visuais desordenadas e superficiais.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Requisitos da Demanda, respostas de clarificação, ativos de dados disponíveis e contexto de negócio.
- **Comportamento Esperado**: O sistema disponibiliza um espaço estruturado para o analista mapear:
  - As perguntas analíticas centrais;
  - As hipóteses causais a serem testadas;
  - As dimensões de corte essenciais (tempo, geografia, produto, etc.);
  - As regras de negócio contratuais codificadas;
  - O método de validação cruzada matemática previsto.
- **Informações Registradas**: Dossiê de planejamento analítico contendo relações entre Requisitos, Perguntas, Dimensões e Regras de Negócio.
- **Saídas**: Plano analítico formal aprovado, pronto para orientar a modelagem e a exploração.
- **Validações**:
  - Plano deve contemplar pelo menos uma Pergunta Analítica vinculada a cada Requisito analítico principal;
  - Diferenciação epistêmica obrigatória entre fatos conhecidos e premissas a confirmar.
- **Possíveis Estados**: Demanda transita de `Em Qualidade e Preparação` para `Em Modelagem e Análise`.
- **Dependências Conceituais**: Entidades `Demanda`, `Requisito`, `PerguntaAnalitica`, `Hipotese`, `IndicadorKPI`.
- **Participação da IA**: Papel de Analista e Crítico: sugere dimensões analíticas pertinentes ao problema de negócio e questiona a viabilidade de responder às perguntas com os dados disponíveis.
- **Ação que Exige Aprovação Humana**: Aprovação formal do plano analítico antes de iniciar os trabalhos no Power BI.
- **Critérios de Aceite**: O plano analítico conecta claramente as dores do cliente às métricas e hipóteses que serão modeladas.

---

### CF-10: Perguntas Analíticas e Hipóteses
- **Objetivo**: Definir com precisão as perguntas de negócio a serem respondidas e as hipóteses causais formuladas para guiar a investigação factual baseada em dados.
- **Usuário/Ator**: Analista de Dados e Copilot Proativo.
- **Entradas**: Contexto do problema, regras de negócio e plano analítico.
- **Comportamento Esperado**: O analista cadastra as Perguntas Analíticas vinculadas à demanda. Para cada pergunta, formula uma ou mais Hipóteses (com racional explicativo e definição prévia da evidência necessária para confirmação ou rejeição). Posteriormente, registra o desfecho do teste com base nas evidências coletadas.
- **Informações Registradas**:
  - Pergunta Analítica: Enunciado, contexto, status (`Aberta`, `Em Análise`, `Respondida`);
  - Hipótese: Enunciado, racional causal, evidência numérica requerida, status (`Pendente`, `Confirmada`, `Rejeitada`, `Inconclusiva`), justificativa analítica conclusiva.
- **Saídas**: Matriz de Perguntas e Hipóteses vinculada à Demanda e aos futuros Achados Analíticos.
- **Validações**:
  - Nenhuma hipótese pode transitar para `Confirmada` ou `Rejeitada` sem evidência numérica registrada;
  - Hipóteses não podem ser descartadas silenciosamente sem registro de conclusão.
- **Possíveis Estados da Pergunta**: `Aberta` $\rightarrow$ `Em Análise` $\rightarrow$ `Respondida`.
- **Possíveis Estados da Hipótese**: `Pendente` $\rightarrow$ `Confirmada` | `Rejeitada` | `Inconclusiva`.
- **Dependências Conceituais**: Entidades `PerguntaAnalitica`, `Hipotese`, `Evidencia`, `AchadoAnalitico`.
- **Participação da IA**: Proposição de hipóteses explicativas alternativas para combater vieses analíticos e confirmação prematura.
- **Ação que Exige Aprovação Humana**: Formulação final, deliberação sobre confirmação/rejeição da hipótese e redação da justificativa.
- **Critérios de Aceite**: Cada hipótese possui status definido e sustentado por evidências ao final da fase de análise.

---

### CF-11: Definição e Catálogo de KPIs
- **Objetivo**: Manter o repositório centralizado, consistente e auditável de todos os indicadores quantitativos da demanda, com sua fórmula conceitual e critério de reconciliação.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Nome da métrica, descrição de negócio, fórmula conceitual/matemática, unidade de medida, granularidade esperada, base de conferência matemática (base de controle externa) e dimensões de corte recomendadas.
- **Comportamento Esperado**: O analista cadastra os KPIs vinculando-os à Demanda e às Perguntas Analíticas correspondentes. O catálogo serve de especificação funcional para a futura escrita das medidas DAX no Power BI e define os parâmetros obrigatórios de conciliação numérica.
- **Informações Registradas**:
  - Identificador único do KPI;
  - Nome oficial da métrica;
  - Fórmula conceitual e regra de negócio aplicável;
  - Unidade de medida (moeda, percentual, contagem inteira, horas, etc.);
  - Granularidade esperada (mensal, diária, por cliente, etc.);
  - Critério de validação cruzada / base de controle;
  - Dimensões de corte previstas.
- **Saídas**: Catálogo de Indicadores e KPIs da Demanda; referência para a tela de medidas DAX e validação.
- **Validações**:
  - Cada KPI deve possuir fórmula conceitual explícita e critério de validação cruzada definido;
  - Nomes de KPIs devem ser únicos dentro do escopo da demanda.
- **Possíveis Estados**: Demanda no estado `Em Modelagem e Análise`.
- **Dependências Conceituais**: Entidade `IndicadorKPI`, associada a `Demanda`, `PerguntaAnalitica` e `MedidaDAX`.
- **Participação da IA**: Verificação de consistência matemática da fórmula conceitual e identificação de ambiguidades de nomenclatura.
- **Ação que Exige Aprovação Humana**: Definição da regra de negócio e aprovação da fórmula matemática do indicador.
- **Critérios de Aceite**: O catálogo de KPIs está completo, com todas as fórmulas descritas de maneira reprodutível antes da criação dos visuais no relatório.

---

### CF-12: Acompanhamento do Modelo do Power BI
- **Objetivo**: Catalogar e governar a estrutura técnica de projetos externos desenvolvidos no Power BI Desktop (`.pbix`), mapeando tabelas, tipos de tabela, relacionamentos e Tabela Calendário, sem tentar substituir o software Power BI. O sistema adota a cardinalidade conceitual flexível de `Demanda 1 → 0..N ModeloPowerBI`, admitindo demandas sem modelos Power BI (ex.: entregas puramente em planilhas tratadas no Excel/Power Query) ou demandas com múltiplos modelos/artefatos associados.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Identificação e caminho local do(s) arquivo(s) `.pbix` (quando aplicável), relação de tabelas importadas (Fatos, Dimensões, Suporte), Tabela Calendário (`dData`) e mapeamento dos relacionamentos e cardinalidades.
- **Comportamento Esperado**: O analista registra no Workspace a arquitetura do modelo dimensional/estrela criado no Power BI Desktop. Documenta a cardinalidade (`1:*`, `*:*`), a direção do filtro cruzado (única ou bidirecional) e a justificativa técnica para modelagens atípicas. Quando a demanda não envolver Power BI, essa etapa é sinalizada como não aplicável sem bloquear o fluxo.
- **Informações Registradas**:
  - Caminho de referência local do(s) arquivo(s) `.pbix` ou diretório do projeto;
  - Relação de tabelas com classificação (`Fato`, `Dimensao`, `Suporte`, `Outra`);
  - Registro da Tabela Calendário (intervalo temporal coberto, granularidade diária, colunas calculadas de suporte);
  - Mapeamento de relacionamentos (Tabela Origem, Tabela Destino, Cardinalidade, Direção do Filtro);
  - Justificativa técnica para relacionamentos complexos ou filtros bidirecionais;
  - Lista de páginas do relatório.
- **Saídas**: Diagrama documental lógico do modelo Power BI no Workspace; dossiê técnico de governança.
- **Validações**:
  - Relação conceitual `Demanda 1 → 0..N ModeloPowerBI`: o cadastro de modelo Power BI é opcional quando a demanda tiver escopo restrito a planilhas tratadas em Excel/Power Query;
  - Quando informado, o caminho do arquivo `.pbix` deve ser referenciado e acessível;
  - Uso de relacionamento bidirecional ou cardinalidade muitos-para-muitos (`*:*`) exige obrigatoriamente justificativa técnica documentada.
- **Possíveis Estados**: Demanda no estado `Em Modelagem e Análise`.
- **Dependências Conceituais**: Entidade `ModeloPowerBI`, vinculada a `Demanda` e `AtivoDeDados`.
- **Participação da IA**: Análise de conformidade arquitetural: sugere validações de modelo estrela e alerta sobre riscos de performance ou ambiguidade em filtros bidirecionais.
- **Ação que Exige Aprovação Humana**: Validação do esquema de tabelas e justificativa de relacionamentos não padrão.
- **Critérios de Aceite**: O modelo dimensional externo está totalmente documentado no Workspace, com clareza sobre tabelas fatos, dimensões e regras de relacionamento (ou formalmente registrado como não aplicável para demandas restritas ao Excel).

---

### CF-13: Catálogo e Documentação de Medidas DAX
- **Objetivo**: Catalogar, formatar e documentar o código DAX de cada medida criada no Power BI Desktop, conectando-a formalmente ao KPI e à regra de negócio correspondente.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Nome da medida, tabela hospedeira no modelo, pasta de exibição, expressão DAX, formatação e KPI associado.
- **Comportamento Esperado**: O analista insere no catálogo a expressão DAX exata implementada no Power BI. O sistema formata a exibição do código, documenta a regra de negócio executada pelo cálculo e vincula a medida ao respectivo `IndicadorKPI`.
- **Informações Registradas**:
  - Identificador da medida DAX;
  - Nome da medida;
  - Modelo Power BI associado;
  - Tabela hospedeira e pasta de organização;
  - Expressão DAX integral;
  - Descrição da regra de negócio implementada na fórmula;
  - Formatação esperada (ex.: R$ #,##0.00; 0.0%; #,##0);
  - Indicador / KPI correspondente;
  - Status de conferência (`Não Testada`, `Validação Aprovada`, `Com Divergência`).
- **Saídas**: Dicionário de Medidas DAX do projeto; vinculação automática com o módulo de validação numérica.
- **Validações**:
  - Nome da medida deve ser único no modelo;
  - Expressão DAX não pode ser vazia;
  - Toda medida crítica deve estar associada a um `IndicadorKPI` do projeto.
- **Possíveis Estados**: Medida cadastrada no modelo; status de conferência numérica integrado à `Validacao`.
- **Dependências Conceituais**: Entidade `MedidaDAX`, vinculada a `ModeloPowerBI` e `IndicadorKPI`.
- **Participação da IA**: Análise e explicação em linguagem natural da expressão DAX; revisão de sintaxe e sugestão de boas práticas (ex.: evitar funções lentas, preferir `DIVIDE`, usar variáveis `VAR`).
- **Ação que Exige Aprovação Humana**: Registro da medida e ateste de conformidade do cálculo.
- **Critérios de Aceite**: O analista dispõe de um catálogo centralizado de medidas DAX com rastreabilidade direta para a especificação do KPI correspondente.

---

### CF-14: Registro de Evidências e Achados Analíticos
- **Objetivo**: Registrar com precisão os fatos numéricos verificáveis extraídos dos relatórios e estruturá-los em conclusões executivas de negócio (achados analíticos fundamentados), prevenindo conclusões precipitadas ou superficiais.
- **Usuário/Ator**: Analista de Dados e Copilot Proativo.
- **Entradas**: Resultados quantitativos apurados no Power BI, filtros contextuais, observações numéricas e interpretações de negócio.
- **Comportamento Esperado**: O analista registra as **Evidências** (fatos numéricos exatos, fonte do cálculo e parâmetros aplicados). A partir de uma ou mais evidências combinadas, registra os **Achados Analíticos** (*insights* de negócio fundamentados), relacionando-os com as Perguntas Analíticas da demanda. O sistema documenta também as limitações e explicações alternativas avaliadas.
- **Informações Registradas**:
  - Evidência: Enunciado quantitativo, fonte (tabela, medida ou visual), filtros aplicados, grau de solidez factual;
  - Achado Analítico: Título executivo, síntese da conclusão, evidências de sustentação vinculadas, limitações e ressalvas da interpretação, recomendações sugeridas de ação de negócio.
- **Saídas**: Painel de Achados Analíticos do projeto, pronto para compor o sumário executivo da entrega.
- **Validações**:
  - Todo Achado Analítico deve estar associado a pelo menos uma Evidência factual registrada;
  - Relação muitos-para-muitos entre Evidências e Achados deve ser preservada;
  - Cumprimento rigoroso da matriz epistêmica (diferenciação clara entre o número observado e a recomendação proposta).
- **Possíveis Estados**: Demanda no estado `Em Modelagem e Análise`.
- **Dependências Conceituais**: Entidades `Evidencia`, `AchadoAnalitico`, `Hipotese`, `PerguntaAnalitica`.
- **Participação da IA**: Papel Crítico: desafia interpretações sugerindo hipóteses alternativas, aponta possíveis correlações espúrias e auxilia na redação de sumários executivos claros.
- **Ação que Exige Aprovação Humana**: Homologação da evidência, redação final do achado analítico e validação de recomendações.
- **Critérios de Aceite**: Cada conclusão analítica apresentada no projeto pode ser rastreada diretamente até as evidências numéricas que a comprovam.

---

### CF-15: Registro Transversal de Decisões
- **Objetivo**: Documentar formalmente e em tempo real toda escolha metodológica, técnica, arquitetural ou de negócio adotada pelo analista ao longo de qualquer fase da demanda, garantindo a memória deliberativa do projeto.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Título da decisão, escopo, contexto/problema enfrentado, alternativas consideradas com prós e contras, opção deliberada, justificativa e data.
- **Comportamento Esperado**: Em qualquer ponto do workflow (seja ao tratar um nulo, redefinir uma regra de KPI, criar um relacionamento bidirecional ou renegociar um prazo), o sistema permite registrar uma `Decisao`. A decisão é vinculada à demanda e ao objeto específico (requisito, problema de qualidade, transformação, medida DAX, validação ou entregável).
- **Informações Registradas**:
  - Identificador da decisão;
  - Escopo (`Requisito`, `Qualidade`, `Transformacao`, `RegraDeNegocio`, `ModelagemDAX`, `Hipotese`, `Validacao`, `Entrega`);
  - Título e contexto do dilema técnico/analítico;
  - Alternativas avaliadas e descartadas;
  - Escolha adotada e fundamentação técnica/negócio;
  - Data/hora e autor humano.
- **Saídas**: Trilha histórica e auditável de deliberações técnicas do projeto; linha do tempo de decisões exibida no dossiê vivo.
- **Validações**: Decisão deve conter justificativa técnica explícita e autoria humana comprovada.
- **Possíveis Estados**: Decisão ativa permanente no histórico do projeto.
- **Dependências Conceituais**: Entidade `Decisao`, transversal a todas as entidades da Demanda.
- **Participação da IA**: Auxílio na formulação do registro: a IA pode propor um rascunho de decisão após uma conversa com o analista, mas a gravação final depende da aprovação humana (`AprovadoPorHumano`).
- **Ação que Exige Aprovação Humana**: Deliberação e homologação da decisão.
- **Critérios de Aceite**: Decisões críticas não dependem de lembrança futura: o racional de cada escolha fica auditável e indexado à demanda.

---

### CF-16: Sistema de Validação e Reconciliação Multicamadas
- **Objetivo**: Blindar a entrega contra falhas materiais, garantindo que métricas, transformações e requisitos passem por verificação metódica e reconciliação com tolerância zero para divergências inexplicadas.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Camada de validação, item testado (KPI, medida DAX, regra de negócio, requisito), método de conferência, valor esperado (oriundo de base de controle independente ou planilha financeira oficial), valor apurado no Power BI e notas de auditoria.
- **Comportamento Esperado**: O analista executa o checklist nas 6 camadas obrigatórias:
  1. Validação de Dados brutos vs. carregados;
  2. Validação de Transformações do Power Query;
  3. Validação de Cálculos e fórmulas DAX;
  4. Validação Cruzada de KPIs (conciliação numérica direta);
  5. Validação Visual e de Usabilidade das páginas;
  6. Validação de Atendimento aos Requisitos acordados.
  O sistema apura a divergência numérica. Em caso de divergência, registra o status `Divergente` e bloqueia o avanço da demanda até a aplicação de ação corretiva e reteste aprovado.
- **Informações Registradas**:
  - Identificador da validação;
  - Camada de validação testada;
  - Item / KPI avaliado;
  - Método aplicado (conferência linha a linha, batimento contra balancete, conferência de totalizador bruto);
  - Valor esperado vs. Valor obtido;
  - Divergência calculada (absoluta e percentual);
  - Resultado (`Aprovado`, `Divergente`, `Rejeitado`, `Pendente de Reteste`);
  - Ação corretiva documentada (se divergente);
  - Data da conferência e analista responsável.
- **Saídas**: Log de Reconciliação e Validação do Projeto; atestado formal de validação cruzada; liberação da demanda para o estado `Pronta para Entrega`.
- **Validações**:
  - Tolerância zero: KPIs estratégicos com divergência inexplicada impedem a transição da demanda para `Pronta para Entrega` ou `Concluída`;
  - É expressamente proibido alterar o status para `Aprovado` sem a realização de reteste efetivo após a correção.
- **Possíveis Estados**: Demanda no estado `Em Validação`. Validação: `Planejada` $\rightarrow$ `Executada` $\rightarrow$ `Aprovada` | `Divergente` $\rightarrow$ `Reteste Aprovado`.
- **Dependências Conceituais**: Entidade `Validacao`, associada a `Demanda`, `IndicadorKPI`, `MedidaDAX`, `AtivoDeDados` e `Requisito`.
- **Participação da IA**: Papel de Validador: confere a coerência matemática entre valores esperados e obtidos, apura desvios percentuais e sinaliza pendências antes da entrega.
- **Ação que Exige Aprovação Humana**: Execução da conferência, ateste do resultado e homologação do reteste.
- **Critérios de Aceite**: A demanda só pode ser liberada para entrega quando todas as validações obrigatórias estiverem formalmente marcadas como `Aprovada`.

---

### CF-17: Preparação e Controle dos Entregáveis
- **Objetivo**: Consolidar, empacotar e controlar a versão dos artefatos finais preparados para o solicitante, acompanhados de sumário executivo, atestado de validação e ressalvas documentadas.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Arquivos finais gerados (arquivo `.pbix` higienizado, relatório executivo em PDF, planilha tratada consolidada), versão do artefato (ex.: `v1.0-final`), sumário executivo dos achados e declaração de premissas.
- **Comportamento Esperado**: O sistema registra os entregáveis finais vinculados à demanda. Gera a declaração de conformidade de validação (atestando que os números foram auditados) e reúne o sumário executivo. O sistema assegura que a entrega permaneça local e sob controle exclusivo do analista, sem qualquer disparo externo autônomo.
- **Informações Registradas**:
  - Identificador do entregável;
  - Nome do arquivo e caminho de referência local;
  - Tipo de artefato (`RelatorioPowerBI`, `DocumentoPDF`, `PlanilhaConsolidada`);
  - Versão formal atribuída;
  - Sumário executivo dos resultados;
  - Premissas e limitações conhecidas declaradas;
  - Declaração de conformidade com o log de validação.
- **Saídas**: Pacote de entrega catalogado; status da Demanda atualizado para `Pronta para Entrega`.
- **Validações**:
  - Caminho local do arquivo final deve existir e ser acessível;
  - Não é permitida a criação do entregável final se houver validações com resultado `Divergente` ou requisitos obrigatórios não atendidos sem renegociação documentada;
  - Proibição de envio autônomo de arquivos por e-mail ou nuvem externa.
- **Possíveis Estados**: Demanda no estado `Pronta para Entrega`. Entregável: `Rascunho`, `Finalizado`, `Entregue ao Cliente`.
- **Dependências Conceituais**: Entidade `Entregavel`, vinculada a `Demanda`, `AchadoAnalitico`, `Validacao` e `Requisito`.
- **Participação da IA**: Apoio na redação do sumário executivo em tom de negócios, garantindo que cada recomendação esteja fundamentada em um achado aprovado.
- **Ação que Exige Aprovação Humana**: Aprovação do pacote de entrega e ação manual externa de envio ao cliente.
- **Critérios de Aceite**: O pacote de entrega reúne de forma coesa artefatos, sumário e atestado de validação, pronto para apresentação formal.

---

### CF-18: Documentação Viva do Projeto
- **Objetivo**: Estruturar e atualizar automaticamente, de forma concorrente e contínua, o dossiê completo da demanda ao longo da execução, eliminando a perda de contexto e a necessidade de documentação tardia.
- **Usuário/Ator**: Analista de Dados e Copilot Proativo.
- **Entradas**: Eventos, registros e deliberações ocorridas em todas as fases do workflow (requisitos, inventário, problemas, transformações, modelo, DAX, hipóteses, validações, decisões e entregáveis).
- **Comportamento Esperado**: O sistema mantém uma visualização integrada e consolidada do dossiê técnico e de negócio da demanda. Cada novo registro ou alteração reflete imediatamente na documentação viva. O analista pode consultar ou exportar o dossiê completo estruturado a qualquer momento.
- **Informações Registradas**: Visão integrada agregando:
  - Resumo de alinhamento e requisitos;
  - Dicionário de dados e ativos inventariados;
  - Diário de qualidade e transformações aplicadas;
  - Especificação de KPIs e catálogo de medidas DAX;
  - Resumo de hipóteses testadas e achados fundamentados;
  - Histórico cronológico das decisões deliberadas;
  - Relatório de conformidade e log de reconciliação de validações.
- **Saídas**: Dossiê vivo do projeto acessível na interface e exportável em formato estruturado padronizado.
- **Validações**: Documentação deve refletir fielmente o estado real das entidades sem defasagem temporal (*concorrente*).
- **Possíveis Estados**: Transversal a todos os estados da demanda.
- **Dependências Conceituais**: Todas as entidades do domínio da V1.
- **Participação da IA**: Papel de Documentador: sumarização contextual de seções, geração de índices e conexão de referências cruzadas.
- **Ação que Exige Aprovação Humana**: Homologação periódica das seções e controle de exportação.
- **Critérios de Aceite**: Ao final do trabalho técnico, a documentação está 100% pronta, sem exigir trabalho retrospectivo do analista.

---

### CF-19: Encerramento da Demanda
- **Objetivo**: Conduzir o fechamento formal e auditável da demanda após a apresentação e aprovação dos entregáveis, garantindo que nenhuma pendência crítica permaneça aberta.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Confirmação de recebimento/aprovação do solicitante, data de entrega efetiva, verificação final de conformidade de requisitos e notas de encerramento.
- **Comportamento Esperado**: O sistema executa um checklist de encerramento automático:
  1. Todas as validações aprovadas?
  2. Todos os requisitos atendidos ou renegociados formalmente?
  3. Não há perguntas de clarificação ou bloqueios pendentes?
  4. Entregável final registrado?
  Após a confirmação positiva dos critérios e a deliberação do analista, o sistema transita a demanda para o estado final `Concluída`, registra o carimbo temporal de conclusão e arquiva a demanda no pipeline.
- **Informações Registradas**: Data/hora de conclusão efetiva, notas de encerramento, confirmação de aceite do contratante, status final da Demanda como `Concluída`.
- **Saídas**: Demanda arquivada como `Concluída`; atualização do status consolidado do Projeto no Cockpit.
- **Validações**:
  - Demanda não pode ser concluída se houver pendências de validação ou bloqueios não resolvidos;
  - Transição depende exclusivamente de autorização humana deliberada.
- **Possíveis Estados**: Demanda transita de `Pronta para Entrega` para `Concluída`.
- **Dependências Conceituais**: Entidade `Demanda`, `Validacao`, `Requisito`, `Entregavel`.
- **Participação da IA**: Verificação do checklist de encerramento e emissão de relatório de prontidão para fechamento.
- **Ação que Exige Aprovação Humana**: Ato formal e exclusivo de encerramento da demanda.
- **Critérios de Aceite**: O sistema impede o fechamento prematuro com pendências abertas e registra formalmente o término do ciclo profissional.

---

### CF-20: Reutilização Profissional e Geração de Material Higienizado para Portfólio
- **Objetivo**: Extrair ativos intelectuais reutilizáveis a partir da demanda concluída e apoiar a geração de estudos de caso para portfólio profissional com blindagem absoluta de dados sensíveis e sigilosos.
- **Usuário/Ator**: Analista de Dados (com apoio do Copilot).
- **Entradas**: Dossiê da Demanda concluída, padrões técnicos identificados (snippets DAX, funções M), resumo executivo e parâmetros de higienização.
- **Comportamento Esperado**: O sistema permite a curadoria de dois tipos de ativos:
  1. **Ativos de Aprendizado (`AtivoDeAprendizado`)**: Fórmulas DAX genéricas, padrões de tabela calendário ou passos de limpeza em Power Query M arquivados no catálogo de conhecimento reutilizável;
  2. **Estudo de Caso de Portfólio**: Geração assistida de texto de *case study* estruturado (Problema $\rightarrow$ Processo $\rightarrow$ Decisões $\rightarrow$ Resultados $\rightarrow$ Evidências) totalmente anonimizado.
- **Informações Registradas**:
  - Identificador do Ativo de Aprendizado;
  - Categoria técnica (`ModelagemDAX`, `PowerQueryM`, `QualidadeDados`, `Negocio`);
  - Procedimento padronizado / código snippet;
  - Texto do estudo de caso higienizado;
  - Declaração de conformidade de anonimização (atestando que dados sensíveis foram removidos).
- **Saídas**: Snippets salvos no catálogo de aprendizado; rascunho de estudo de caso de portfólio pronto para publicação pessoal externa.
- **Validações**:
  - **Regra Inegociável de Sigilo**: É terminantemente proibido transferir nomes reais de clientes, nomes de colaboradores, valores monetários exatos ou identificadores pessoais (PII) para os registros de portfólio ou aprendizado;
  - Todo material de portfólio deve ser gerado utilizando dados generalizados ou sintéticos (*mock data*);
  - A publicação ou exportação de materiais de portfólio exige aprovação humana mandatória.
- **Possíveis Estados**: Demanda permanece no estado `Concluída`. Ativo de Aprendizado: `Registrado`, `Ativo`.
- **Dependências Conceituais**: Entidades `AtivoDeAprendizado`, `Demanda`, `Decisao`, `MedidaDAX`.
- **Participação da IA**: Varredura semântica para detectar potenciais dados sensíveis residuais e assistência na redação do estudo de caso estruturado.
- **Ação que Exige Aprovação Humana**: Verificação minuciosa de anonimização e aprovação final de qualquer texto destinado a portfólio.
- **Critérios de Aceite**: O analista obtém um case profissional completo, formatado e auditado contra vazamento de segredos comerciais ou PII.

---

### CF-21: Centro de Comando (Cockpit do Analista)
- **Objetivo**: Fornecer ao analista um painel central de controle situacional em tempo real sobre todo o universo de trabalho profissional, consolidando projetos, demandas, alertas de qualidade e prioridades recomendadas.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Estado consolidado de todos os projetos, demandas, validações, anomalias e prazos registrados no sistema.
- **Comportamento Esperado**: O Cockpit exibe uma visão executiva agregada contendo:
  - Quantitativo de Projetos e Demandas ativos e finalizados;
  - Indicadores situacionais (demandas aguardando cliente, demandas em validação, anomalias críticas de qualidade não resolvidas);
  - Painel de alertas operacionais urgentes;
  - Recomendações proativas do Copilot sobre prioridades de ação imediata com justificativa de negócio;
  - Acesso direto e navegação fluida para qualquer demanda ou projeto.
- **Informações Registradas**: Registro de sessões de acompanhamento e histórico de leitura de notificações operacionais.
- **Saídas**: Interface central de monitoramento e direcionamento diário do analista.
- **Validações**: Informações exibidas no Cockpit devem ser sincronizadas em tempo real com as alterações realizadas em qualquer demanda do sistema.
- **Possíveis Estados**: Operação permanente da aplicação.
- **Dependências Conceituais**: Todas as entidades agregadas no nível de `Projeto` e `Demanda`.
- **Participação da IA**: Triagem contextual contínua para ordenar e sugerir as ações prioritárias do dia para o analista.
- **Ação que Exige Aprovação Humana**: Decisão soberana sobre qual demanda priorizar ou executar.
- **Critérios de Aceite**: O analista abre o Workspace e, em menos de 10 segundos, sabe exatamente o estado de seus projetos, o que está bloqueado e qual é a ação mais urgente a tomar.

---

### CF-22: Pipeline Visual do Projeto e das Demandas
- **Objetivo**: Disponibilizar o acompanhamento visual do fluxo de trabalho das demandas através dos 8 estágios conceituais normais sequenciais aprovados e dos 2 estados excepcionais (`Suspensa` e `Cancelada`), evidenciando gargalos, tempos de permanência e critérios de transição.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Status atual de cada Demanda no ciclo de vida.
- **Comportamento Esperado**: O sistema apresenta uma visão visual em colunas/etapas representando os 8 estados conceituais normais sequenciais:
  1. `Nova`
  2. `Em Clarificação`
  3. `Dados Recebidos`
  4. `Em Qualidade e Preparação`
  5. `Em Modelagem e Análise`
  6. `Em Validação`
  7. `Pronta para Entrega`
  8. `Concluída`
  
  Adicionalmente, o sistema provê suporte aos **Estados Excepcionais** (não sequenciais):
  - `Suspensa`: para demandas com execução temporariamente pausada por impedimento externo ou solicitação do cliente;
  - `Cancelada`: para demandas abortadas ou rescindidas antes da conclusão.

  O sistema permite ao analista movimentar a demanda entre os estágios, validando automaticamente se os critérios de avanço do estado de destino foram atendidos. Se faltarem requisitos obrigatórios, a transição é bloqueada com explicação explícita do motivo.
  As transições para os estados excepcionais `Suspensa` ou `Cancelada` preservam integralmente o histórico da demanda, exigem justificativa formal obrigatória e auditável, e dependem exclusivamente de aprovação humana expressa. Uma demanda no estado `Suspensa` pode retornar ao fluxo normal no estado em que foi pausada mediante decisão humana deliberada.
- **Informações Registradas**: Histórico de transições de estado da demanda (estado anterior, novo estado, data/hora da transição, autor humano da alteração, justificativa).
- **Saídas**: Quadro visual do pipeline com indicadores visuais de progresso e bloqueio por demanda.
- **Validações**:
  - Não é permitido avançar para `Em Qualidade e Preparação` sem ativo de dados cadastrado;
  - Não é permitido avançar para `Pronta para Entrega` sem que todas as validações estejam com status `Aprovada`;
  - Não é permitido avançar para `Concluída` sem que o pacote de entrega esteja registrado e homologado;
  - Transição para `Suspensa` ou `Cancelada` exige justificativa obrigatória e autorização humana;
  - Retorno de `Suspensa` exige seleção explícita do estado de reingresso no fluxo e justificativa humana.
- **Possíveis Estados**:
  - Estados normais sequenciais: `Nova`, `Em Clarificação`, `Dados Recebidos`, `Em Qualidade e Preparação`, `Em Modelagem e Análise`, `Em Validação`, `Pronta para Entrega`, `Concluída`;
  - Estados excepcionais não sequenciais: `Suspensa`, `Cancelada`.
- **Dependências Conceituais**: Entidade `Demanda`, Objeto de Valor `EstadoDemanda`.
- **Participação da IA**: Alerta visual proativo quando uma demanda permanece por tempo excessivo em um mesmo estado sem atividade.
- **Ação que Exige Aprovação Humana**: Autorização formal e execução manual de qualquer transição de estado no pipeline (tanto nos fluxos normais quanto nos excepcionais).
- **Critérios de Aceite**: O pipeline bloqueia transições indevidas de forma determinística, registra o histórico temporal auditável de cada avanço ou transição excepcional e permite o retorno controlado de demandas suspensas.

---

### CF-23: Gestão de Alertas, Bloqueios, Pendências e Próximos Passos
- **Objetivo**: Mapear de forma ostensiva e rastreável todos os pontos de bloqueio operacional, pendências aguardando terceiros e orientar o próximo passo imediato da demanda.
- **Usuário/Ator**: Analista de Dados (com suporte do Copilot).
- **Entradas**: Estado das perguntas de clarificação, severidade das anomalias de qualidade, resultados de validação e prazos de entrega.
- **Comportamento Esperado**: O sistema categoriza as pendências em:
  - **Bloqueio Externo**: Aguardando cliente (ex.: perguntas de clarificação enviadas e não respondidas, base de dados faltante);
  - **Bloqueio Interno**: Anomalia de qualidade crítica aberta, divergência numérica em KPI na validação;
  - **Alerta de Prazo**: Data prevista de entrega se aproximando com etapas críticas pendentes.
  Para cada demanda, o sistema mantém uma indicação clara do **Próximo Passo Imediato Recomendado**.
- **Informações Registradas**: Lista de bloqueios e alertas ativos, tipo de bloqueio, data de abertura do bloqueio, impacto e próximo passo sugerido.
- **Saídas**: Painel de alertas no Cockpit e destaques visuais em cada demanda bloqueada.
- **Validações**: Uma demanda bloqueada exibe distintivo visual imediato no pipeline até a resolução do impedimento.
- **Possíveis Estados**: Transversal aos estados da demanda.
- **Dependências Conceituais**: Entidades `Demanda`, `PerguntaDeClarificacao`, `ProblemaDeQualidade`, `Validacao`.
- **Participação da IA**: Geração da recomendação contextual de "Próximo Passo" a partir do diagnóstico do estado da demanda.
- **Ação que Exige Aprovação Humana**: Resolução do bloqueio e homologação da continuidade do fluxo.
- **Critérios de Aceite**: Nenhum bloqueio passa despercebido: o analista visualiza instantaneamente quem deve agir (ele ou o cliente) para que o trabalho continue.

---

### CF-24: Atuação Transversal do Copilot Proativo
- **Objetivo**: Prover assistência analítica inteligente contínua ao longo de todo o ciclo de vida da demanda, operando em múltiplos papéis contextuais especializados sob supervisão humana estrita.
- **Usuário/Ator**: Copilot Proativo (IA) em diálogo com o Analista de Dados.
- **Entradas**: Contexto atual da tela, metadados da demanda, anomalias, dados inspecionados, medidas DAX e perguntas analíticas.
- **Comportamento Esperado**: O Copilot não opera como chatbot passivo. Ele observa o estado da demanda e atua conforme a fase do ciclo:
  - **Estruturador** (Fases 1-2): Ajuda a converter briefs vagos em requisitos e detecta omissões;
  - **Investigador** (Fases 3-4): Inspeciona estruturas e ajuda a diagnosticar anomalias de tipagem e valores impossíveis;
  - **Crítico** (Fases 2, 5, 8): Questiona premissas frágeis, aponta alternativas e alerta sobre conclusões precipitadas;
  - **Analista** (Fases 5, 8): Apoia a formalização lógica de hipóteses e a formulação de métricas de negócio;
  - **Documentador** (Fases 6, 7, 11): Rascunha explicações de passos de Power Query e medidas DAX em tempo real;
  - **Validador** (Fases 9, 10): Confere reconciliações numéricas e audita o atendimento a requisitos antes da entrega.
- **Informações Registradas**: Histórico de interações analíticas da demanda; sugestões geradas com marcação `SugeridoPorIA`.
- **Saídas**: Recomendações proativas, rascunhos conceituais, diagnósticos e explicações técnicas contextualizadas.
- **Validações**:
  - A IA é estritamente proibida de presumir ou inventar dados como fatos fornecidos pelo cliente;
  - A IA é proibida de contornar ou suavizar erros ou divergências numéricas;
  - Toda comunicação com modelos externos deve respeitar a proteção de segredos e privacidade de dados reais.
- **Possíveis Estados**: Disponibilidade contínua em todas as fases da demanda.
- **Dependências Conceituais**: Transversal a todo o modelo de domínio.
- **Participação da IA**: Núcleo da inteligência operacional assistida.
- **Ação que Exige Aprovação Humana**: Qualquer decisão ou conversão de sugestão da IA em dado persistente oficial (`AprovadoPorHumano`).
- **Critérios de Aceite**: A IA fornece valor analítico contextual relevante sem jamais usurpar a autoridade de decisão do profissional humano.

---

### CF-25: Governança de Pontos Obrigatórios de Aprovação Humana
- **Objetivo**: Formalizar as salvaguardas sistêmicas permanentes que impedem a execução autônoma ou inadvertida de ações críticas que afetem o escopo, a integridade dos dados, a comunicação externa ou a entrega.
- **Usuário/Ator**: Analista de Dados.
- **Entradas**: Propostas da IA, solicitações de transição de fase, alterações de requisitos e ações de despacho.
- **Comportamento Esperado**: O sistema intercepta tentativas de avanço crítico e exige ato deliberado de confirmação humana nos seguintes pontos soberanos inegociáveis:
  1. Criação, alteração ou cancelamento de Requisitos e Escopo;
  2. Aprovação e despacho de qualquer Pergunta de Clarificação ao cliente externo;
  3. Decisão sobre ação corretiva em Problemas de Qualidade (imputação, exclusão de linhas ou aceitação de restrição);
  4. Homologação final de Hipóteses como Confirmadas ou Rejeitadas;
  5. Aprovação de fórmulas conceituais de KPIs e regras de negócio;
  6. Ateste formal de aprovação no Log de Validação Multicamadas e Reconciliação Numérica;
  7. Transições de estado da Demanda no Pipeline;
  8. Liberação e empacotamento dos Entregáveis finais;
  9. Ato formal de Encerramento da Demanda;
  10. Aprovação de materiais anonimizados derivados para Portfólio.
- **Informações Registradas**: Log de auditoria da aprovação humana (identificador da ação, entidade afetada, data/hora exata, autor humano da confirmação).
- **Saídas**: Confirmação deliberada registrada; desbloqueio sistêmico para a continuidade da operação.
- **Validações**: O sistema recusa qualquer tentativa de automação que tente substituir a confirmação do analista nestes 10 pontos obrigatórios.
- **Possíveis Estados**: Transversal ao sistema.
- **Dependências Conceituais**: Objeto de Valor `OrigemAutoria` (`AprovadoPorHumano`), Entidade `Decisao`.
- **Participação da IA**: Nenhuma autoridade decisória; a IA pode apenas solicitar a revisão ou submeter a proposta para julgamento humano.
- **Ação que Exige Aprovação Humana**: Todos os 10 pontos listados são atos exclusivos do analista.
- **Critérios de Aceite**: Nenhuma ação com impacto externo ou de alteração de dados é consumada no sistema sem o registro inequívoco da aprovação humana.

---

## 4. Jornadas Principais do Usuário

Abaixo estão formalizadas as 6 jornadas funcionais de uso contínuo que o analista de dados percorre ao operar o sistema:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     JORNADAS DE USO DO ANALISTA                        │
├────────────────────────────────────────────────────────────────────────┤
│ J-01: Recepção, Estruturação Assistida e Clarificação de Requisitos    │
│ J-02: Inventário, Auditoria de Qualidade e Engenharia dos Dados        │
│ J-03: Planejamento Analítico, Modelagem Power BI e Teste de Hipóteses  │
│ J-04: Validação Multicamadas, Reconciliação e Empacotamento            │
│ J-05: Encerramento Concorrente, Dossiê Vivo e Síntese de Portfólio     │
│ J-06: Navegação Diária, Monitoramento e Resolução via Cockpit          │
└────────────────────────────────────────────────────────────────────────┘
```

### Jornada 1: Recepção, Estruturação Assistida e Clarificação de Requisitos (Fases 1 e 2)
1. **Entrada**: O analista recebe um e-mail com uma solicitação desestruturada de análise de cancelamento de clientes;
2. **Criação**: No Workspace, clica em "Nova Demanda", seleciona o Solicitante (ou cadastra) e cola a mensagem na íntegra no campo de solicitação bruta;
3. **Estruturação**: O Copilot gera a proposta estruturada (problema, objetivo, entregáveis, restrições e lacunas identificadas);
4. **Revisão Humana**: O analista edita os campos, remove inferências inadequadas e homologa os requisitos oficiais;
5. **Clarificação**: O sistema aponta que o cliente não definiu o critério formal de cancelamento (ex.: 30 ou 60 dias de inadimplência). O Copilot rascunha a pergunta de esclarecimento;
6. **Despacho Externo**: O analista revisa a pergunta, aprova, copia o texto e envia por e-mail próprio ao cliente. Marca no Workspace o status como `Enviada`;
7. **Retorno**: Ao receber a resposta formal do cliente, o analista registra a resposta no sistema, que converte a definição na regra de negócio oficial do projeto. A demanda avança para `Dados Recebidos`.

### Jornada 2: Inventário, Auditoria de Qualidade e Engenharia dos Dados (Fases 3 a 6)
1. **Catalogação**: O analista recebe duas planilhas Excel (`vendas_2025.xlsx` e `clientes.csv`), coloca-as na pasta local do projeto e cadastra-as no Workspace com caminho local, período e contagem de registros;
2. **Inspeção**: No Excel / Power Query, o analista investiga os arquivos e detecta 320 clientes sem CPF e valores negativos na coluna de faturamento;
3. **Registro de Qualidade**: No Workspace, cadastra os 2 problemas de qualidade apontando evidências e impactos potenciais;
4. **Ação Deliberada**: O analista decide descartar as linhas negativas (pois referiam-se a estornos de teste confirmados pelo suporte) e manter os clientes sem CPF isolados com flag para não quebrar a análise de churn geral. Registra essa `Decisao` no sistema;
5. **Documentação de Engenharia**: O analista documenta os passos aplicados no Power Query M (filtros, unpivot e junção entre vendas e clientes), registrando as consultas resultantes;
6. **Conferência**: Registra a validação pós-tratamento atestando que a anomalia foi sanada sem perda indevida de dados. A demanda transita para `Em Qualidade e Preparação`.

### Jornada 3: Planejamento Analítico, Modelagem Power BI e Teste de Hipóteses (Fases 5, 7 e 8)
1. **Planejamento**: Antes de criar telas no Power BI, o analista formaliza 3 perguntas analíticas essenciais (ex.: "O cancelamento é maior em planos anuais ou mensais?") e cadastra o KPI de Taxa de Cancelamento (*Churn Rate*);
2. **Formulação de Hipóteses**: O analista registra a hipótese causal: "A evasão concentra-se em clientes com mais de 3 chamados de suporte abertos no primeiro mês". O Copilot sugere verificar também a faixa etária;
3. **Governança do Power BI**: O analista abre o Power BI Desktop local, constrói o modelo dimensional estrela (`fVendas`, `dClientes`, `dCalendario`) e cria o arquivo `.pbix`. No Workspace, cataloga as tabelas, relacionamentos e documenta a Tabela Calendário;
4. **Catálogo DAX**: O analista cola as medidas DAX no Workspace (`Churn Rate = DIVIDE(...)`), vinculando-as aos KPIs correspondentes;
5. **Coleta de Evidências e Achados**: Ao analisar o relatório, o analista constata que clientes com 3+ chamados têm taxa de cancelamento 4,2 vezes maior. Registra a evidência numérica exata no Workspace e formaliza o Achado Analítico correspondente, marcando a hipótese como `Confirmada`.

### Jornada 4: Validação Multicamadas, Reconciliação e Empacotamento (Fases 9 e 10)
1. **Checklist de Validação**: O analista entra no módulo de validação da demanda no Workspace e executa a conferência nas 6 camadas obrigatórias;
2. **Reconciliação de KPI**: Confronta o total de cancelamentos do Power BI contra a planilha de controle contábil. Divergência inicial: R$ 1.450,00 de diferença. O sistema marca status `Divergente` e bloqueia a entrega;
3. **Depuração e Correção**: O analista investiga e descobre que clientes cancelados no último dia do mês às 23:59 foram excluídos pelo filtro de data no Power BI. Ajusta a medida DAX no Power BI e documenta a correção no Workspace;
4. **Reteste Aprovado**: Reexecuta o batimento. Divergência apurada: R$ 0,00 (100% de conciliação). O analista aprova a validação no sistema;
5. **Empacotamento**: Registra o arquivo final `analise_churn_v1.0.pbix`, anexa o sumário executivo gerado com os achados e emite a declaração de conformidade de validação. A demanda transita para `Pronta para Entrega`.

### Jornada 5: Encerramento Concorrente, Dossiê Vivo e Síntese de Portfólio (Fases 11 e 12)
1. **Apresentação e Fechamento**: O analista apresenta os resultados ao solicitante em reunião executiva. O cliente aprova a entrega. O analista acessa o Workspace e aciona "Encerrar Demanda";
2. **Auditoria de Conclusão**: O sistema confere que não há pendências abertas, registra a data de conclusão e transita a demanda para `Concluída`;
3. **Dossiê Vivo**: O analista exporta o dossiê consolidado do projeto em Markdown/PDF, contendo todo o histórico de decisões e regras de negócio para a memória técnica;
4. **Curadoria de Aprendizado**: O analista arquiva a fórmula DAX de churn acumulado no catálogo de `AtivoDeAprendizado` para uso em projetos futuros;
5. **Geração de Portfólio**: O analista aciona a geração assistida de estudo de caso. O sistema cria um rascunho de case profissional (Problema $\rightarrow$ Processo $\rightarrow$ Decisões $\rightarrow$ Resultados), aplicando higienização rígida: substitui o nome da empresa por "Empresa X do Setor de Telecom", anonimiza os CPFs e converte valores reais em percentuais de impacto. O analista revisa e aprova o case de portfólio.

### Jornada 6: Navegação Diária, Monitoramento e Resolução via Cockpit (Visão Transversal)
1. **Abertura do Dia**: O analista inicializa o Workspace e visualiza o Cockpit;
2. **Diagnóstico Imediato**: Identifica 3 projetos ativos: um projeto está com demanda bloqueada aguardando resposta de cliente há 4 dias; outro possui um alerta de divergência de validação; e o terceiro está no prazo;
3. **Direcionamento do Copilot**: O painel exibe a recomendação prioritária do dia: "Cobrar resposta da pergunta de clarificação do Projeto Alfa ou iniciar a conferência de dados da Demanda Beta";
4. **Ação Rápida**: O analista clica no alerta do Projeto Alfa, copia o texto de lembrete profissional sugerido pelo Copilot e envia ao cliente; em seguida, entra na Demanda Beta para iniciar a inspeção de qualidade.

---

## 5. Fluxo Completo de uma Demanda Real (Cenário de Ponta a Ponta)

Para orientar os futuros testes automatizados e o desenvolvimento, a seguir é demonstrado o fluxo de uma demanda profissional representativa conduzida integralmente na V1:

### 5.1. Contexto do Cenário
- **Empresa Contratante**: "Colégio Futuro & Saber" (Instituição de ensino privado de médio porte)
- **Solicitante**: Profa. Mariana Souza (Diretora Pedagógica)
- **Problema de Negócio**: Aumento súbito de evasão escolar e cancelamento de matrículas de estudantes do Ensino Médio ao longo do ano letivo de 2025.
- **Insumos Brutos**: Duas planilhas locais: `matriculas_2025.xlsx` (1.850 linhas) e `frequencia_notas.csv` (18.200 linhas).

```
[Mariana envia e-mail informal] 
         │
         ▼
[Fase 1: Entrada Demanda] ──► Workspace registra texto bruto no status "Nova"
         │
         ▼
[Fase 2: Clarificação] ──► IA aponta: falta critério formal de evasão (30 ou 60 dias de falta?)
         │                 Analista formula pergunta; Mariana responde: "Evasão = 45 dias sem frequência"
         ▼
[Fase 3: Inventário] ──► Registrados matriculas_2025.xlsx e frequencia_notas.csv no disco local
         │
         ▼
[Fase 4: Qualidade] ──► Detectadas 42 notas com valor "99" (código de ausência médica) e 15 alunos duplicados
         │              Decisão humana: converter "99" para nulo e isolar justificativas médicas
         ▼
[Fase 5: Planejamento] ──► Pergunta Analítica: "Qual fator prediz o cancelamento antes do final do 1º semestre?"
         │                 Hipótese: "Faltas superiores a 15% nas primeiras 8 semanas antecedem a evasão"
         ▼
[Fase 6: Transformação] ──► No Power Query: unpivot de bimestres, merge com dados cadastrais e cálculo de frequência
         │
         ▼
[Fase 7: Modelagem PBI] ──► Power BI Desktop: fFrequencia, dAluno, dData, dTurma. Catalogado no Workspace
         │
         ▼
[Fase 8: Análise] ──► Evidência: Alunos com >12 faltas no 1º bimestre têm taxa de evasão 3,8x maior
         │            Hipótese Confirmada. Achado analítico: Ação preventiva deve ocorrer até a 6ª semana
         ▼
[Fase 9: Validação] ──► Total de alunos evadidos apurado no PBI = 114. Confronto com Secretaria = 114 (Divergência Zero)
         │              Todas as 6 camadas de validação recebem status "Aprovado"
         ▼
[Fase 10: Entrega] ──► Gerado relatorio_evasao_v1.0.pbix, sumário executivo em PDF e declaração de conciliação
         │             Status da Demanda atualizado para "Pronta para Entrega"
         ▼
[Fase 11: Encerramento] ──► Reunião com Diretoria Pedagógica. Aceite formal obtido. Demanda "Concluída"
         │
         ▼
[Fase 12: Reutilização] ──► DAX de evasão móvel salvo nos Ativos de Aprendizado. Gerado case de portfólio
                            higienizado ("Redução de Churn em Instituição Educacional de Grande Porte")
```

---

## 6. Situações de Exceção e Tratamento Funcional

A especificação prevê tratamentos determinísticos para anomalias, bloqueios e desvios operacionais típicos:

| Código | Situação de Exceção | Comportamento Funcional e Tratamento no Workspace |
| :--- | :--- | :--- |
| **EXC-01** | **Arquivo local ausente, renomeado ou inacessível** | O sistema sinaliza o ativo com alerta vermelho "Arquivo Inacessível no Caminho Local", exibe a última data de acesso bem-sucedida e bloqueia operações dependentes até que o analista aponte o novo caminho no disco. |
| **EXC-02** | **Contradição ou alteração de escopo pelo cliente durante a execução** | O sistema não sobrescreve os requisitos originais. Registra um evento de "Repactuação de Escopo", cria uma nova versão dos requisitos afetados, vincula uma `Decisao` de ajuste e recalcula o checklist de pendências. |
| **EXC-03** | **Divergência numérica inexplicada na reconciliação de KPIs** | O sistema força o status da validação para `Divergente`, gera um alerta no Cockpit e impede a transição da demanda para `Pronta para Entrega` ou `Concluída` até a realização de reteste aprovado. |
| **EXC-04** | **Rejeição ou inconclusão de hipótese de negócio** | O sistema não trata isso como falha técnica. Registra formalmente a hipótese como `Rejeitada` ou `Inconclusiva`, exige a documentação das evidências numéricas que contradizem a suposição e preserva o aprendizado no dossiê vivo. |
| **EXC-05** | **Quebra de integridade referencial ou cardinalidade em junção no Power Query** | O sistema exige no registro da transformação a declaração de que a contagem de linhas antes e depois da junção foi verificada, alertando caso haja suspeita de duplicação involuntária de fatos. |
| **EXC-06** | **Tentativa inadvertida de inclusão de dados sensíveis para envio externo** | O sistema alerta ostensivamente o analista sobre a presença de colunas com aparência de PII (CPFs, e-mails pessoais, cartões) ou segredos empresariais, impedindo a geração de textos de portfólio sem confirmação de higienização. |
| **EXC-07** | **Demanda abandonada ou cancelada pelo contratante** | O sistema permite ao analista transitar a demanda para o estado de exceção `Cancelada` (ou `Suspensa`), exigindo registro formal de justificativa e preservando todo o histórico produzido até o momento do cancelamento. |

---

## 7. Recuperação de Erros e Reversibilidade

Em estrita consonância com o princípio da **Rastreabilidade e Reversibilidade**:

1. **Reversão Controlada de Estados no Pipeline**:
   - O analista pode retornar uma demanda a um estado anterior (ex.: de `Em Validação` para `Em Modelagem e Análise` ou de `Em Qualidade e Preparação` para `Dados Recebidos`);
   - Toda reversão de estado exige o preenchimento de justificativa obrigatória, que é gravada na linha do tempo da demanda para fins de auditoria;
   - Nenhum trabalho, dado de inventário ou decisão anterior é apagado durante a reversão de estado.
2. **Preservação de Trilha de Auditoria durante Correções**:
   - Quando uma medida DAX, fórmula de KPI ou passo de transformação é editado, o sistema preserva o histórico de versões anteriores da regra;
   - Problemas de qualidade tratados que voltarem a apresentar anomalias após reprocessamento de novas cargas podem ter seu status reaberto (`Pendente de Reteste`).
3. **Reabertura Justificada de Demandas Concluídas**:
   - Caso um cliente solicite retificação técnica após a conclusão, o sistema permite reabrir a demanda mediante justificativa formal;
   - A demanda reaberta reingressa no estado `Em Validação` ou `Em Modelagem e Análise`, registrando a data e o motivo da reabertura.

---

## 8. Catálogo de Requisitos Funcionais Numerados

A seguir estão detalhados os **60 Requisitos Funcionais (RF-001 a RF-060)** organizados por módulo funcional:

### Módulo 1: Gestão de Projetos e Demandas (RF-001 a RF-006)
- **RF-001**: O sistema deve permitir o cadastro e edição de Solicitantes com nome, organização/área, papel de negócio e canal de contato.
- **RF-002**: O sistema deve permitir a criação e gestão de Projetos contendo nome, contexto estratégico, datas previstas e solicitante associado.
- **RF-003**: O sistema deve permitir a criação de Demandas vinculadas a um Projeto existente ou com criação automática de projeto em fluxo simplificado.
- **RF-004**: O sistema deve capturar e armazenar de forma imutável a solicitação bruta original da demanda em texto em linguagem natural.
- **RF-005**: O sistema deve atribuir um identificador unívoco para cada Projeto e Demanda criados.
- **RF-006**: O sistema deve registrar a data/hora de abertura, prazos acordados, restrições declaradas e o autor humano da criação da demanda.

### Módulo 2: Estruturação e Clarificação de Requisitos (RF-007 a RF-012)
- **RF-007**: O sistema deve disponibilizar funcionalidade assistida de IA para extrair da solicitação bruta: problema de negócio, objetivo analítico, prazos, entregáveis e restrições.
- **RF-008**: O sistema deve marcar formalmente qualquer informação sugerida pela IA como `SugeridoPorIA`, exigindo aprovação humana (`AprovadoPorHumano`) para homologação.
- **RF-009**: O sistema deve identificar proativamente lacunas, ambiguidades e dados ausentes no briefing, catalogando-os com nível de criticidade.
- **RF-010**: O sistema deve gerar rascunhos de Perguntas de Clarificação direcionadas ao cliente para sanar as lacunas identificadas.
- **RF-011**: O sistema deve proibir o envio autônomo de qualquer comunicação externa, mantendo as perguntas em estado `Rascunho` até a ação manual do analista.
- **RF-012**: O sistema deve registrar a resposta formal do cliente e convertê-la em Requisitos homologados ou Decisões de projeto.

### Módulo 3: Inventário e Gestão de Ativos de Dados (RF-013 a RF-017)
- **RF-013**: O sistema deve permitir catalogar arquivos tabulares locais (`.xlsx`, `.xls`, `.csv`, `.txt`, bases tratadas) através de caminhos de referência do disco local.
- **RF-014**: O sistema deve registrar metadados do ativo de dados: formato técnico, origem/responsável, período coberto, contagem de linhas/colunas e granularidade aparente.
- **RF-015**: O sistema deve tratar todos os ativos brutos de entrada como somente-leitura conceitual (`read-only`), preservando a integridade das bases originais.
- **RF-016**: O sistema não deve persistir nem versionar dados brutos confidenciais de clientes dentro do controle de versão do repositório da aplicação.
- **RF-017**: O sistema deve validar a acessibilidade física do arquivo no caminho de referência local informado pelo analista.

### Módulo 4: Gestão da Qualidade de Dados e Anomalias (RF-018 a RF-022)
- **RF-018**: O sistema deve permitir o registro estruturado de anomalias de dados nas categorias: nulos/brancos, duplicidades, tipos inconsistentes, datas inválidas, categorias divergentes, regras de domínio e integridade referencial.
- **RF-019**: O sistema deve exigir no registro de cada anomalia: evidência numérica (tabela, coluna, volume e amostra), severidade, impacto no cálculo e ação deliberada.
- **RF-020**: O sistema deve proibir o descarte ou exclusão arbitrária de dados sem justificativa técnica e registro deliberado de aprovação humana.
- **RF-021**: O sistema deve controlar o ciclo de vida de cada anomalia através dos status: `Aberto`, `Em Investigação`, `Tratado` e `Aceito como Restrição`.
- **RF-022**: O sistema deve bloquear o avanço da demanda no pipeline caso existam anomalias de severidade `Crítica` no status `Aberto`.

### Módulo 5: Transformações e Engenharia de Dados (RF-023 a RF-026)
- **RF-023**: O sistema deve registrar descritivamente as etapas de transformação e limpeza aplicadas no Excel e no Power Query M.
- **RF-024**: O sistema deve permitir anexar o script M representativo ou fórmulas de transformação aplicadas às consultas tratadas.
- **RF-025**: O sistema deve vincular cada transformação ao problema de qualidade que ela soluciona ou ao requisito de engenharia que atende.
- **RF-026**: O sistema deve exigir a confirmação de conferência de cardinalidade em operações de junção (*merge* e *append*) para atestar a não duplicação de fatos.

### Módulo 6: Planejamento Analítico, Hipóteses e KPIs (RF-027 a RF-033)
- **RF-027**: O sistema deve prover interface para o planejamento analítico prévio contendo perguntas analíticas, regras de negócio e dimensões de corte.
- **RF-028**: O sistema deve permitir o cadastro de Perguntas Analíticas e seu acompanhamento pelos status: `Aberta`, `Em Análise` e `Respondida`.
- **RF-029**: O sistema deve permitir a formulação de Hipóteses causais vinculadas às perguntas analíticas, exigindo a definição prévia da evidência necessária para teste.
- **RF-030**: O sistema deve controlar o status de cada hipótese entre: `Pendente`, `Confirmada`, `Rejeitada` e `Inconclusiva`, exigindo justificativa numérica.
- **RF-031**: O sistema deve manter o Catálogo de Indicadores e KPIs da demanda, com nome, fórmula conceitual, regra de negócio, unidade e granularidade.
- **RF-032**: O sistema deve exigir a definição formal do critério de validação cruzada / base de controle matemática para cada KPI cadastrado.
- **RF-033**: O sistema deve assegurar a categorização epistêmica obrigatória entre fatos conhecidos, hipóteses a testar, inferências e recomendações.

### Módulo 7: Governança do Modelo Power BI e Medidas DAX (RF-034 a RF-038)
- **RF-034**: O sistema deve catalogar o(s) projeto(s) externo(s) do Power BI Desktop associado(s) à demanda informando o caminho do arquivo `.pbix`, relação de tabelas e suas classificações (Fato, Dimensão, Suporte), suportando a cardinalidade conceitual de `Demanda 1 → 0..N ModeloPowerBI` (permitindo demandas com múltiplos modelos ou sem modelos Power BI).
- **RF-035**: O sistema deve documentar a estrutura da Tabela Calendário (`dData`), intervalo de datas coberto e colunas de agregação temporal.
- **RF-036**: O sistema deve registrar o mapa de relacionamentos do modelo (tabelas, cardinalidades e direção de filtro), exigindo justificativa para modelagens atípicas.
- **RF-037**: O sistema deve manter o catálogo de Medidas DAX contendo o código integral, tabela hospedeira, pasta de exibição e vínculo com o respectivo `IndicadorKPI`.
- **RF-038**: O sistema deve exibir a expressão DAX formatada e documentar a regra de negócio implementada em cada fórmula.

### Módulo 8: Análise, Evidências e Achados Analíticos (RF-039 a RF-042)
- **RF-039**: O sistema deve permitir o registro de Evidências factuais extraídas dos dados, identificando a métrica, os filtros aplicados e o valor numérico verificado.
- **RF-040**: O sistema deve permitir consolidar Achados Analíticos (*insights* fundamentados de negócio) vinculados a uma ou múltiplas Evidências (relação N:M).
- **RF-041**: O sistema deve exigir que todo achado analítico registre limitações da interpretação e recomendações de negócio práticas sugeridas.
- **RF-042**: O sistema deve vincular os Achados Analíticos às Perguntas Analíticas que eles respondem conclusivamente.

### Módulo 9: Registro Transversal de Decisões de Projeto (RF-043 a RF-045)
- **RF-043**: O sistema deve disponibilizar registro transversal de Decisões em qualquer fase da demanda, catalogando escopo, alternativas avaliadas e justificativa.
- **RF-044**: O sistema deve associar a decisão aos elementos afetados (requisitos, anomalias, transformações, medidas DAX, validações ou entregáveis).
- **RF-045**: O sistema deve registrar o autor humano, a data/hora da deliberação e manter a decisão permanente e inalterável no histórico de auditoria.

### Módulo 10: Sistema de Validação e Reconciliação (RF-046 a RF-050)
- **RF-046**: O sistema deve prover checklist de validação estruturado nas 6 camadas obrigatórias: Dados, Transformações, Cálculos/DAX, Conciliação de KPIs, Visual/Usabilidade e Requisitos.
- **RF-047**: O sistema deve registrar o valor esperado da base de controle, o valor obtido no relatório e calcular a divergência numérica apurada.
- **RF-048**: O sistema deve atribuir os status de validação: `Aprovado`, `Divergente`, `Rejeitado` e `Pendente de Reteste`.
- **RF-049**: O sistema deve aplicar tolerância zero para divergências inexplicadas em KPIs estratégicos, bloqueando a liberação de entrega da demanda.
- **RF-050**: O sistema deve registrar o autor humano do ateste de validação, a data do teste e exigir a realização de reteste efetivo após qualquer correção.

### Módulo 11: Entregáveis e Documentação Viva (RF-051 a RF-054)
- **RF-051**: O sistema deve catalogar os Entregáveis finais da demanda (arquivos `.pbix`, PDFs executivos, planilhas), atribuindo versão formal (ex.: `v1.0-final`).
- **RF-052**: O sistema deve gerar e anexar ao entregável um sumário executivo de achados, declaração de premissas e atestado de validação cruzada.
- **RF-053**: O sistema deve gerar e manter atualizado de forma concorrente o dossiê vivo integral da demanda com todos os registros e decisões do projeto.
- **RF-054**: O sistema deve permitir a exportação estruturada do dossiê do projeto em formato padrão documental (Markdown / texto formatado).

### Módulo 12: Encerramento e Reutilização Profissional (RF-055 a RF-057)
- **RF-055**: O sistema deve validar checklist de encerramento (validações aprovadas, entregáveis prontos e requisitos atendidos) antes de permitir a conclusão da demanda.
- **RF-056**: O sistema deve permitir a curadoria de Ativos de Aprendizado (`AtivoDeAprendizado`), arquivando snippets DAX e padrões de transformação para reuso.
- **RF-057**: O sistema deve apoiar a redação de Estudos de Caso para portfólio, exigindo higienização mandatória, remoção de PII e substituição de dados confidenciais por dados sintéticos.

### Módulo 13: Cockpit, Pipeline e Gestão de Fluxo (RF-058 a RF-060)
- **RF-058**: O sistema deve prover um Centro de Comando (Cockpit) com visão executiva unificada de projetos ativos, demandas por status, alertas e bloqueios.
- **RF-059**: O sistema deve exibir o Pipeline Visual das demandas refletindo os 8 estados conceituais normais (`Nova` até `Concluída`), além de suportar os estados excepcionais (`Suspensa` e `Cancelada`), exigindo justificativa obrigatória, preservando integralmente o histórico, permitindo retorno de `Suspensa` ao fluxo e bloqueando transições com pendências impeditivas.
- **RF-060**: O sistema deve identificar bloqueios operacionais (aguardando cliente, anomalia crítica aberta, validação divergente) e emitir alertas proativos com indicação do próximo passo prioritário.

---

## 9. Matriz de Rastreabilidade Bidirecional

A tabela a seguir estabelece a rastreabilidade estrita ligando cada **Requisito Funcional (RF)** às **Entidades do Modelo de Domínio**, às **Fases do Workflow Operacional** e às **Capacidades Funcionais (CF)**:

| Requisito Funcional | Entidades do Domínio Envolvidas | Fase do Workflow da V1 | Capacidade Funcional |
| :--- | :--- | :--- | :--- |
| **RF-001** a **RF-003** | `Solicitante`, `Projeto`, `Demanda` | Fase 1: Entrada da Demanda | CF-01 |
| **RF-004** a **RF-006** | `Demanda` | Fase 1: Entrada da Demanda | CF-02 |
| **RF-007** e **RF-008** | `Demanda`, `Requisito`, `OrigemAutoria` | Fases 1 e 2: Entrada e Clarificação | CF-03, CF-24 |
| **RF-009** | `Demanda`, `Requisito` | Fase 2: Compreensão e Clarificação | CF-04 |
| **RF-010** a **RF-012** | `PerguntaDeClarificacao`, `Demanda`, `Requisito` | Fase 2: Compreensão e Clarificação | CF-05, CF-25 |
| **RF-013** a **RF-017** | `AtivoDeDados`, `Demanda` | Fase 3: Recebimento e Inventário | CF-06 |
| **RF-018** a **RF-022** | `ProblemaDeQualidade`, `AtivoDeDados`, `Decisao` | Fase 4: Inspeção e Qualidade | CF-07, CF-25 |
| **RF-023** a **RF-026** | `Transformacao`, `AtivoDeDados`, `ProblemaDeQualidade` | Fase 6: Preparação e Transformação | CF-08 |
| **RF-027** e **RF-033** | `Demanda`, `Requisito`, `ClassificacaoEpistemica` | Fase 5: Planejamento Analítico | CF-09 |
| **RF-028** a **RF-030** | `PerguntaAnalitica`, `Hipotese`, `Evidencia` | Fase 5 e Fase 8: Planejamento e Análise | CF-10 |
| **RF-031** e **RF-032** | `IndicadorKPI`, `Demanda` | Fase 5: Planejamento Analítico | CF-11 |
| **RF-034** a **RF-036** | `ModeloPowerBI`, `Demanda`, `AtivoDeDados` | Fase 7: Modelagem e Power BI | CF-12 |
| **RF-037** e **RF-038** | `MedidaDAX`, `ModeloPowerBI`, `IndicadorKPI` | Fase 7: Modelagem e Power BI | CF-13 |
| **RF-039** a **RF-042** | `Evidencia`, `AchadoAnalitico`, `Hipotese` | Fase 8: Análise e Interpretação | CF-14 |
| **RF-043** a **RF-045** | `Decisao` (Transversal a todas as entidades) | Fases 1 a 11 (Transversal) | CF-15, CF-25 |
| **RF-046** a **RF-050** | `Validacao`, `IndicadorKPI`, `MedidaDAX`, `Demanda` | Fase 9: Validação Multicamadas | CF-16, CF-25 |
| **RF-051** e **RF-052** | `Entregavel`, `Demanda`, `AchadoAnalitico` | Fase 10: Preparação da Entrega | CF-17, CF-25 |
| **RF-053** e **RF-054** | Todas as entidades da Demanda | Fase 11: Encerramento e Documentação | CF-18 |
| **RF-055** | `Demanda`, `Validacao`, `Entregavel` | Fase 11: Encerramento da Demanda | CF-19, CF-25 |
| **RF-056** e **RF-057** | `AtivoDeAprendizado`, `Demanda`, `MedidaDAX` | Fase 12: Reutilização e Portfólio | CF-20, CF-25 |
| **RF-058** a **RF-060** | `Projeto`, `Demanda`, `EstadoDemanda` | Centro de Comando (Transversal) | CF-21, CF-22, CF-23 |

---

## 10. Definição Funcional de Pronto da V1 (Functional Definition of Done)

A **Versão 1 (V1)** do Analyst Personal Workspace será formalmente considerada **Funcionalmente Concluída e Pronta para Uso Profissional** quando todos os seguintes critérios forem plenamente atendidos e demonstrados:

1. **Ciclo Completo Executável de Ponta a Ponta**:
   - Um analista consegue operar com sucesso uma demanda real completa (desde a inserção da solicitação bruta até o encerramento e síntese de portfólio), utilizando exclusivamente o Workspace para governança, auditoria e rastreabilidade, sem necessidade de recorrer a anotações informais dispersas;
2. **Auditabilidade e Linhagem Comprovadas**:
   - A partir de qualquer número ou achado presente no entregável final, o sistema é capaz de demonstrar a rastreabilidade completa até a medida DAX, as transformações do Power Query, os problemas de qualidade sanados, os ativos de dados de origem e o requisito contratual inicial;
3. **Reconciliação e Tolerância Zero a Erros**:
   - O sistema valida efetivamente o bloqueio de demandas que apresentem divergências numéricas não resolvidas em KPIs ou anomalias críticas abertas;
4. **Governança Estrita Humano + IA**:
   - Nenhuma decisão técnica, regra de negócio, hipótese ou envio externo ocorre sem ato formal de aprovação pelo analista humano;
5. **Segurança e Proteção de Dados**:
   - O sistema opera comprovadamente sem persistir dados brutos de clientes em versionamento e sem trafegar dados sensíveis de clientes para modelos externos de IA sem anonimização prévia;
6. **Estabilidade Funcional sem Dependência Prematura**:
   - O sistema funciona integralmente no ecossistema estipulado para a V1 (Excel + Power Query + Power BI), sem demandar módulos das versões V2 a V10 (como SQL, Python, dbt ou Cloud).

---

## 11. Registro de Inconsistências, Lacunas e Ambiguidades Encontradas e Resoluções

Em cumprimento às regras operacionais do [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md), as divergências conceituais detectadas nas fontes normativas foram formalmente submetidas à apreciação humana. Ficam registradas a seguir as resoluções aprovadas e plenamente incorporadas a esta especificação funcional e aos documentos de fundação:

### INC-01: Cardinalidade entre Demanda e Modelo Power BI [RESOLVIDA POR DECISÃO HUMANA]
- **Situação Identificada**: O modelo de domínio definia a relação como estritamente `1 --> 1`, enquanto o escopo da V1 admitia demandas com entregáveis exclusivamente em Excel/Power Query.
- **Decisão Humana Aprovada**: Alterar conceitualmente a cardinalidade entre `Demanda` e `ModeloPowerBI` para:
  $$\text{Demanda } 1 \longrightarrow 0..N \text{ ModeloPowerBI}$$
- **Justificativa Registrada**:
  1. Uma demanda pode não utilizar Power BI;
  2. Uma demanda pode resultar somente em planilha tratada via Excel/Power Query;
  3. Quando utilizar Power BI, poderá eventualmente possuir mais de um artefato/modelo relacionado à mesma demanda;
  4. Não impõe restrição conceitual desnecessária nesta fase do produto.
- **Incorporação Normativa**: Refletida na capacidade **CF-12**, no requisito **RF-034**, no Modelo de Domínio ([`docs/domain/v1-domain-model.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/domain/v1-domain-model.md)) e nos diagramas estruturais.

### INC-02: Estados Excepcionais da Demanda no Pipeline [RESOLVIDA POR DECISÃO HUMANA]
- **Situação Identificada**: O pipeline definia 8 estados sequenciais estritos, sem contemplar rescisões, cancelamentos ou pausas operacionais solicitadas por clientes.
- **Decisão Humana Aprovada**:
  - Preservar integralmente os **oito estados normais sequenciais** do pipeline:
    $$\text{Nova} \longrightarrow \text{Em Clarificação} \longrightarrow \text{Dados Recebidos} \longrightarrow \text{Em Qualidade e Preparação}$$
    $$\longrightarrow \text{Em Modelagem e Análise} \longrightarrow \text{Em Validação} \longrightarrow \text{Pronta para Entrega} \longrightarrow \text{Concluída}$$
  - Adicionar formalmente os estados:
    - **`Suspensa`**
    - **`Cancelada`**
    como **ESTADOS EXCEPCIONAIS**, e não como novas etapas sequenciais do fluxo normal.
- **Regras Vinculantes dos Estados Excepcionais**:
  1. Não constituem etapas sequenciais da esteira normal;
  2. As transições para `Suspensa` ou `Cancelada` preservam integralmente o histórico da demanda, ativos cadastrados e deliberações anteriores;
  3. Toda transição exige justificativa formal e auditável registrada;
  4. Exigem ato deliberado de aprovação humana mandatória (vedado qualquer disparo autônomo por IA);
  5. Uma demanda no estado `Suspensa` pode retornar ao fluxo normal no estado em que foi pausada, mediante decisão humana expressa.
- **Incorporação Normativa**: Refletida na capacidade **CF-22**, na situação de exceção **EXC-07**, no requisito **RF-059**, no Workflow Profissional ([`docs/product/professional-workflow.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/professional-workflow.md)) e no Modelo de Domínio ([`docs/domain/v1-domain-model.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/domain/v1-domain-model.md)).

### INC-03: Denominação do Mecanismo de Privacidade de IA [RESOLVIDA POR DECISÃO HUMANA]
- **Situação Identificada**: O ADR-001 utilizava a nomenclatura "Privacy Gateway (Conceitual)", enquanto outros documentos alertavam para não criar nem nomear prematuramente componentes arquiteturais na V1.
- **Decisão Humana Aprovada**: Eliminar de todos os documentos normativos da V1 a denominação arquitetural antecipada "Privacy Gateway". Substituir por formulação conceitual neutra baseada em:
  > **"Proteção Rigorosa de Dados e Privacidade"**
- **Regra Vinculante Estabelecida**:
  - Dados reais, pessoais, confidenciais, sigilosos ou corporativos não devem ser enviados a provedores externos de IA sem autorização e salvaguardas adequadas;
  - Anonimização, minimização de dados, processamento local ou outros mecanismos de proteção poderão ser utilizados conforme a necessidade do caso;
  - **Não criar nem nomear nesta fase um componente arquitetural específico** responsável por essa finalidade.
- **Incorporação Normativa**: Refletida no [`docs/architecture/ADR-001-v1-foundation.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/architecture/ADR-001-v1-foundation.md) (Seção 2.8), no [`docs/domain/v1-domain-model.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/domain/v1-domain-model.md) (Seção 10), no [`docs/product/professional-workflow.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/professional-workflow.md) (Seção 4.2) e nesta especificação funcional (Capacidades CF-20, CF-24 e requisitos RF-016 e RF-057).

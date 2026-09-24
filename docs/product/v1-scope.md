# Escopo da Versão 1 (V1) — Analyst Personal Workspace

## 1. Visão Geral da V1

A **Versão 1 (V1)** do Analyst Personal Workspace tem como foco exclusivo o domínio de **Analytics e Business Intelligence (BI)** tradicional, baseado no ecossistema **Excel + Power Query + Power BI**.

A V1 não é um protótipo descartável ou maquete conceitual. Ela foi concebida para ser um núcleo operacional utilizável e robusto para conduzir demandas profissionais reais de pequeno e médio porte dentro das competências consolidadas do usuário.

---

## 2. Núcleo Obrigatório da V1

O núcleo da V1 é composto pelos módulos e capacidades indispensáveis para fechar o ciclo profissional de ponta a ponta:

```
[DEMANDA] ──► [REQUISITOS & LACUNAS] ──► [DADOS & QUALIDADE] ──► [HIPÓTESES & ANÁLISE]
                                                                        │
[REVISÃO & APRENDIZADO] ◄── [ENTREGA & DOCS] ◄── [VALIDAÇÃO] ◄── [MODELAGEM / POWER BI]
```

### 2.1. Entrada e Estruturação de Demandas
- Registro de demandas profissionais em linguagem natural;
- Estruturação assistida com extração clara de:
  - Problema central de negócio;
  - Objetivo da análise;
  - Solicitante / Contratante;
  - Prazos e marcos de entrega;
  - Entregáveis esperados (ex.: dashboard, relatório sumário, planilha tratada);
  - Fontes de dados fornecidas;
  - Informações faltantes e ambiguidades;
  - Restrições técnicas e de negócio.

### 2.2. Identificação de Lacunas e Perguntas ao Contratante
- Detecção proativa de premissas não declaradas ou requisitos vagos;
- Formulação estruturada de perguntas de esclarecimento para o contratante;
- **Controle Humano Obrigatório**: Todas as perguntas são revisadas e aprovadas pelo analista antes de qualquer comunicação externa.

### 2.3. Centro de Comando (Cockpit do Analista)
- Painel central do Workspace apresentando em tempo real:
  - Projetos ativos e respectivos status no pipeline;
  - Bloqueios operacionais e pendências aguardando cliente;
  - Alertas de qualidade dos dados;
  - Prioridades sugeridas pelo Copilot Proativo com justificativa contextual;
  - Próximas ações recomendadas.

### 2.4. Pipeline de Projetos e Visibilidade de Fluxo
- Acompanhamento do ciclo de vida da demanda através dos estágios:
  $$\text{Requisitos} \longrightarrow \text{Dados} \longrightarrow \text{Qualidade} \longrightarrow \text{Modelagem/Análise} \longrightarrow \text{Dashboard} \longrightarrow \text{Validação} \longrightarrow \text{Entrega} \longrightarrow \text{Revisão}$$
- Clareza situacional contínua: onde o projeto está, o que foi concluído, o que está pendente, quem deve agir e qual é o próximo passo imediato.

### 2.5. Gestão de Dados e Metadados (Fontes V1)
- Suporte a dados tabulares típicos da V1: **Excel (.xlsx, .xls), CSV, arquivos tratados e bases de suporte ao Power BI**;
- Registro e catalogação de metadados essenciais:
  - Nome e identificador da base;
  - Origem e responsável pelo envio;
  - Data e hora de recebimento ou atualização;
  - Contagem de linhas e colunas;
  - Status de processamento;
  - Registro de anomalias detectadas.
- **Tratamento Rigoroso de Dados**: Isolamento estrito de dados corporativos ou sensíveis, impedindo versionamento no Git ou tráfego indevido para serviços externos.

### 2.6. Gestão da Qualidade de Dados
- Apoio à triagem e acompanhamento de problemas clássicos:
  - Valores ausentes / nulos (*nulls/blanks*);
  - Duplicidade de registros ou de chaves primárias;
  - Inconsistência de tipagem (ex.: números salvos como texto);
  - Formatos inválidos de data e hora;
  - Divergência de categorização e erros de digitação;
  - Violação de regras de negócio específicas.
- **Fluxo Investigativo Estruturado**: Impedir a exclusão arbitrária de dados sem justificativa:
  $$\text{Problema Detectado} \longrightarrow \text{Investigação de Causa} \longrightarrow \text{Avaliação de Alternativas} \longrightarrow \text{Decisão Humana} \longrightarrow \text{Transformação} \longrightarrow \text{Validação} \longrightarrow \text{Registro}$$

### 2.7. Raciocínio Analítico e Teste de Hipóteses
- Condução guiada para formulação de hipóteses de negócio antes da construção de gráficos:
  $$\text{Pergunta de Negócio} \longrightarrow \text{Hipótese Formulada} \longrightarrow \text{Evidência Necessária} \longrightarrow \text{Teste Analítico} \longrightarrow \text{Resultado} \longrightarrow \text{Interpretação}$$
- Combate à análise superficial baseada apenas em exploração visual desordenada.

### 2.8. Camada de Gestão e Documentação do Power BI
- O Workspace **não substitui** o Power BI Desktop; ele funciona como sua camada de governança, documentação e controle;
- Registro estruturado do projeto Power BI:
  - Arquivo `.pbix` ou diretório do projeto relacionado;
  - Tabelas importadas e seus esquemas;
  - Relacionamentos e cardinalidades do modelo dimensional/relacional;
  - Tabela Calendário (dData) e padrões temporais aplicados;
  - Catálogo de medidas DAX e regras de negócio codificadas;
  - Lista de KPIs e páginas do relatório;
  - Histórico de validações numéricas e feedbacks do cliente.

### 2.9. Validação Sistemática e Cruzada
- Obrigatoriedade de validação em múltiplas camadas antes da entrega:
  - Validação dos dados brutos vs. tratados;
  - Validação de cálculos matemáticos e regras de negócio;
  - Validação cruzada de KPIs (ex.: Conferência contra planilha de controle ou totalizadores brutos com tolerância zero para divergências inexplicadas);
  - Validação visual e de usabilidade das páginas do relatório;
  - Validação de atendimento a todos os requisitos solicitados pelo contratante.

### 2.10. Documentação Viva e Concomitante
- Registro em tempo de execução de todas as decisões relevantes, erros encontrados, correções aplicadas e métricas validadas;
- Preparação de material de entrega profissional adaptado para o cliente (sumário executivo, dicionário de métricas e premissas adotadas), preservando confidencialidade e dados sensíveis.

### 2.11. Copilot Proativo Integrado
- Assistente transversal com ciclo contínuo:
  $$\text{Detectar} \longrightarrow \text{Explicar} \longrightarrow \text{Sugerir / Agir com Autorização} \longrightarrow \text{Documentar} \longrightarrow \text{Validar} \longrightarrow \text{Indicar Próximo Passo}$$
- Atuação contextual como investigador de dados, validador de hipóteses, crítico de consistência e gerente de fluxo.

---

## 3. Funcionalidades que Podem Entrar Progressivamente na V1

Funcionalidades de suporte que agregam valor à V1, mas que devem ser introduzidas sem bloquear a disponibilização do núcleo operacional:

1. **Aprofundamento de Integração com Power BI**: Automações avançadas de leitura de metadados de arquivos Power BI (conforme viabilidade técnica e sem dependências excessivas);
2. **Integração Básica com Memória Operacional (Obsidian)**: Sincronização ou exportação de notas de aprendizado, soluções de erros e decisões para o Obsidian (sem que a integração atue como dependência crítica para o uso do Workspace);
3. **Mecanismo de Derivação de Portfólio**: Apoio na sintetização de projetos concluídos em estudos de caso profissionais anonimizados para exibição pública;
4. **Catálogo de Padrões e Snippets DAX**: Biblioteca de soluções DAX reutilizáveis já validadas em projetos anteriores.

---

## 4. Itens Explicitamente Fora do Escopo Inicial

Os seguintes módulos e tecnologias estão expressamente **excluídos** da V1:

- **Bancos de Dados Relacionais e SQL**: Escopo exclusivo da V2;
- **Python para Análise de Dados e Notebooks (Pandas, Polars, etc.)**: Escopo exclusivo da V3;
- **Integração e Consumo de APIs**: Escopo exclusivo da V4;
- **Analytics Engineering e dbt**: Escopo exclusivo da V5;
- **Engenharia de Dados e Pipelines Distribuídos**: Escopo exclusivo da V6;
- **Microsoft Fabric e OneLake**: Escopo exclusivo da V7;
- **Provedores Cloud (AWS, Azure, GCP)**: Escopo exclusivo da V8;
- **Automações de Infraestrutura Complexas**: Escopo exclusivo da V9;
- **Sistemas Multiagentes e Orquestração Autônoma de Alto Nível**: Escopo exclusivo da V10;
- **Substituição do Power BI Desktop**: O Workspace nunca tentará recriar a interface analítica do Power BI;
- **Opportunity Center / Radar de Mercado**: Mantido como componente de roadmap estratégico futuro; não deve competir com a fundação da V1;
- **Skill Matrix Automatizada**: Acompanhamento de habilidades fora de um registro documental simples fica postergado;
- **Disparo Autônomo de Comunicações Externas**: Nenhuma mensagem ou arquivo é enviado a terceiros sem revisão humana prévia.

---

## 5. Critérios Conceituais para Considerar a V1 Profissionalmente Utilizável

A V1 será considerada pronta e profissionalmente utilizável quando atender integralmente aos seguintes critérios:

1. **Ciclo Completo Executável**: Capacidade comprovada de receber uma demanda de Analytics/BI real (ex.: análise escolar, vendas no varejo, prestação de serviços), guiar a estruturação de requisitos, apoiar a limpeza de dados em Excel/Power Query, documentar o modelo e as medidas no Power BI, validar resultados contra bases de controle e consolidar o pacote de entrega;
2. **Auditoria e Rastreabilidade Comprovadas**: Toda decisão tomada durante o projeto deve possuir registro cronológico claro e compreensível;
3. **Não Dependência de Maquetes**: O analista não precisa recorrer a blocos de notas dispersos ou ferramentas genéricas de chat para guiar seu raciocínio de ponta a ponta;
4. **Segurança Garantida**: Operar plenamente sem expor arquivos de dados reais no versionamento de código e sem vazar segredos.

---

## 6. Decisões Técnicas e Arquiteturais

Todas as decisões sobre pilha tecnológica, linguagem de implementação do Workspace, banco de dados interno da aplicação, frameworks de frontend e bibliotecas auxiliares são formalmente categorizadas como:
> **Decisão pendente para etapa de arquitetura/implementação.**

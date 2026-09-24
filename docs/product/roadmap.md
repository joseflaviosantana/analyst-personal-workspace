# Roadmap Estratégico — Analyst Personal Workspace

## 1. Princípio Central de Evolução

O roadmap do **Analyst Personal Workspace** é estritamente orientado pela formação e maturação profissional do usuário:

> **"O Workspace evolui conforme o usuário evolui profissionalmente."**

Competências e tecnologias não são introduzidas na aplicação de forma antecipada ou presumida. O fluxo que condiciona a entrada de qualquer nova versão ou capacidade no Workspace segue a regra imutável:

$$\text{Aprender} \longrightarrow \text{Praticar} \longrightarrow \text{Validar Competência} \longrightarrow \text{Incorporar ao Workspace}$$

- **Critério Rígido**: Curso iniciado não equivale a competência adquirida.
- **Evidência Requerida**: Nenhuma nova frente tecnológica do Workspace é desbloqueada sem que o usuário tenha demonstrado proficiência prática em projetos e cenários reais.
- **Preparação vs. Implementação**: Projetar arquitetura modular desacoplada e preparada para o futuro não concede autorização para implementar código ou dependências de versões futuras antecipadamente.

---

## 2. Roadmap Consolidado de Versões

O ciclo de evolução está estruturado em 10 versões consecutivas:

```
[V1: Analytics / BI] ──────► [V2: SQL] ─────────────────► [V3: Python para Dados]
                                                                  │
[V6: Eng. de Dados] ◄────── [V5: Analytics Eng. / dbt] ◄──── [V4: APIs]
       │
       ▼
[V7: Microsoft Fabric] ────► [V8: Cloud] ───────────────► [V9: Automações Avançadas]
                                                                  │
                                                                  ▼
                                                      [V10: Agentes / Orquestração]
```

---

## 3. Detalhamento das Versões

### V1 — Analytics / BI (Versão Atual)
- **Foco Tecnológico**: Excel + Power Query + Power BI.
- **Objetivo**: Estabelecer a fundação do trabalho profissional em Dados e BI com fluxo completo de entrega: triagem de demandas, formulação de perguntas ao cliente, validação de qualidade, teste de hipóteses, modelagem dimensional em Power BI, validação cruzada de KPIs, documentação concorrente e suporte do Copilot Proativo.
- **Escopo**: Restrito a fontes tabulares locais (.xlsx, .csv, bases tratadas).

### V2 — SQL
- **Foco Tecnológico**: Bancos de dados relacionais e Structured Query Language (SQL).
- **Objetivo**: Integrar a capacidade de consulta, extração e validação direta em bancos relacionais (PostgreSQL, MySQL, SQL Server, etc.), formalizando consultas analíticas, manipulação de esquemas e conferência de dados em nível de banco.

### V3 — Python para Dados
- **Foco Tecnológico**: Linguagem Python e ecossistema analítico (Pandas, Polars, etc.).
- **Objetivo**: Expandir a capacidade de análise exploratória de dados (EDA), automação de transformações analíticas complexas, tratamento de grandes volumes tabulares e análises estatísticas mais aprofundadas.

### V4 — APIs
- **Foco Tecnológico**: Consumo e integração de APIs REST e web endpoints.
- **Objetivo**: Permitir a ingestão automatizada e estruturada de dados externos, sistemas transacionais SaaS e serviços web com tratamento de autenticação, paginação e controle de chamadas.

### V5 — Analytics Engineering / dbt
- **Foco Tecnológico**: dbt (data build tool) e engenharia analítica moderna.
- **Objetivo**: Introduzir modelagem modular no Data Warehouse, linhagem automatizada de dados, transformações declarativas em SQL e testes automatizados de esquema e regras de negócio.

### V6 — Engenharia de Dados
- **Foco Tecnológico**: Pipelines de dados em lote/fluxo contínuo e arquiteturas de dados.
- **Objetivo**: Estruturar pipelines de extração, carga e transformação em maior escala, contemplando governança, particionamento e monitoramento de ingestões robustas.

### V7 — Microsoft Fabric
- **Foco Tecnológico**: Ecossistema unificado Microsoft Fabric (OneLake, Lakehouses, Direct Lake).
- **Objetivo**: Operar em ambientes modernos integrando dados de Lakehouse diretamente ao Power BI com alto desempenho e arquitetura unificada corporativa.

### V8 — Cloud
- **Foco Tecnológico**: Serviços gerenciados em nuvem (AWS, Google Cloud ou Azure).
- **Objetivo**: Armazenamento seguro de objetos (Buckets/Data Lakes), Data Warehouses modernos em nuvem, controle de acessos corporativos (IAM) e segurança em escala cloud.

### V9 — Automações Avançadas
- **Foco Tecnológico**: Agendamento, gatilhos de eventos e fluxos de trabalho autônomos.
- **Objetivo**: Executar rotinas automatizadas de verificação de qualidade, alertas proativos de anomalias em KPIs e geração assistida de relatórios sem intervenção manual contínua.

### V10 — Agentes e Orquestração Avançada
- **Foco Tecnológico**: Redes de agentes de IA especializados e orquestração de ponta a ponta.
- **Objetivo**: Orquestrar fluxos analíticos e operacionais complexos por meio de agentes especializados com alto grau de cooperação, mantendo supervisão e controle humano no topo do processo.

---

## 4. Módulos Transversais e Visão de Longo Prazo

Os módulos abaixo acompanham a evolução do ecossistema e são desenvolvidos incrementalmente, sem comprometer ou desviar a entrega do núcleo da V1:

### 4.1. Memória Operacional e Conhecimento (Obsidian)
- Repositório central de conhecimento validado:
  $$\text{Executar} \longrightarrow \text{Aprender} \longrightarrow \text{Validar} \longrightarrow \text{Registrar} \longrightarrow \text{Reutilizar}$$
- Registro de padrões de solução, catálogo de fórmulas/DAX, decisões arquiteturais e resolução de erros;
- A integração com o Obsidian deve ser progressiva e opcional, sem criar dependências impeditivas para o funcionamento do Workspace.

### 4.2. Skill Matrix Baseada em Evidências
- Matriz de acompanhamento de competências técnicas e de negócio;
- Regra intransponível: competências só são pontuadas após comprovação prática em demandas e projetos executados;
- Rejeição expressa a autoavaliações subjetivas ou certificações sem evidência de aplicação.

### 4.3. Opportunity Center (Radar de Mercado)
- Mecanismo estratégico de relacionamento entre:
  $$\text{Requisitos de Mercado} \longleftrightarrow \text{Competências Reais Validadas} \longleftrightarrow \text{Evidências de Projetos}$$
- Comparação objetiva de lacunas técnicas frente a vagas e demandas reais de clientes;
- Auxílio na priorização do que aprender e praticar em seguida;
- A decisão final de candidatura permanece sempre estritamente humana;
- **Diretriz de Foco**: Não permitir que a ideação do Opportunity Center desvie o desenvolvimento do núcleo de Analytics/BI da V1.

### 4.4. Portfólio Profissional Derivado de Casos Reais
- Estruturação automatizada de documentação de projetos para formato de estudos de caso (*case studies*);
- Transformação do histórico de trabalho (Problema $\rightarrow$ Processo $\rightarrow$ Decisões $\rightarrow$ Resultados $\rightarrow$ Evidências) em cases de portfólio;
- Revisão humana obrigatória e higienização total de dados sensíveis antes de qualquer publicação externa.

---

## 5. Decisões Técnicas e Arquiteturais

Todas as decisões técnicas relativas às tecnologias, stacks, bibliotecas ou bancos das versões V2 a V10 são formalmente registradas como:
> **Decisão pendente para etapa de arquitetura/implementação.**

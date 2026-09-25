# ADR-002: Arquitetura Técnica Implementável da Versão 1 (V1)

- **Status**: Proposta Formal de Arquitetura Técnica
- **Data**: 2026-09-25
- **Contexto de Decisão**: Transição da fase conceitual e funcional para a fase de construção de software do **Analyst Personal Workspace** (V1 — Analytics e Business Intelligence).
- **Documentos Normativos de Referência**:
  - [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md) — Regras Operacionais para Agentes de IA;
  - [`docs/product/vision.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/vision.md) — Visão de Produto;
  - [`docs/product/v1-scope.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/v1-scope.md) — Escopo da Versão 1 (V1);
  - [`docs/product/roadmap.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/roadmap.md) — Roadmap Estratégico;
  - [`docs/product/professional-workflow.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/professional-workflow.md) — Workflow Profissional da V1;
  - [`docs/product/v1-functional-specification.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/v1-functional-specification.md) — Especificação Funcional da V1;
  - [`docs/architecture/ADR-001-v1-foundation.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/architecture/ADR-001-v1-foundation.md) — Definição da Arquitetura Base e Stack Tecnológica para a V1;
  - [`docs/domain/v1-domain-model.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/domain/v1-domain-model.md) — Modelo de Domínio Conceitual da V1;
  - [`docs/ux/v1-ux-navigation-specification.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/ux/v1-ux-navigation-specification.md) — Especificação de UX, Arquitetura de Informação e Navegação da V1.

---

## 1. Arquitetura de Execução

### 1.1. Modelo Operacional Local-First
O **Analyst Personal Workspace** na V1 opera como uma **aplicação desktop local-first** executada integralmente na estação de trabalho do analista (`localhost:3000`), sem qualquer dependência obrigatória de serviços em nuvem ou conectividade remota para seu funcionamento central.

O modelo é monousuário, centrado em alta performance, latência zero de rede e proteção física incondicional de dados corporativos de clientes.

### 1.2. Fluxo Arquitetural Unidirecional de Dados
O fluxo de processamento e interação segue um pipeline limpo e unidirecional em camadas:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FLUXO ARQUITETURAL V1                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. USUÁRIO (Analista de Dados)                                                         │
│    │                                                                                   │
│    ▼                                                                                   │
│ 2. INTERFACE (UI - Next.js App Router / React - Versões Estáveis)                      │
│    │  - Server Components: Renderização ultrarrápida do Cockpit, Dossiê e Listas       │
│    │  - Client Components: Formulários dinâmicos, abas, modais, drawer do Copilot     │
│    │                                                                                   │
│    ▼                                                                                   │
│ 3. CAMADA DE APLICAÇÃO (Application / Use Cases / Server Actions)                      │
│    │  - Next.js Server Actions tipadas com Zod: orquestração de casos de uso          │
│    │  - Controle transacional, auditoria e aplicação de soberania humana               │
│    │                                                                                   │
│    ▼                                                                                   │
│ 4. CAMADA DE DOMÍNIO (Core Domain - Regras Puras)                                      │
│    │  - Entidades de Domínio (`Demanda`, `Projeto`, `Requisito`, etc.)                 │
│    │  - Regras de Transição de Estados (8 normais + 2 excepcionais)                    │
│    │  - Motor de Reconciliação Numérica com Tolerância Zero                            │
│    │                                                                                   │
│    ├────────────────────────────────────────┬──────────────────────────────────────────┤
│    ▼                                        ▼                                          ▼
│ 5. PERSISTÊNCIA LOCAL              6. ARQUIVOS LOCAIS           7. ADAPTADOR DE IA     │
│    (Drizzle ORM + SQLite)             (FileSystemAdapter)          (AiProviderAdapter) │
│    - `workspace.db`                   - Inspeção de Metadados      - Provedor Agnóstico │
│    - Transações ACID locais           - Hashes SHA-256             - Schemas Zod       │
│    - Modos WAL e Foreign Keys         - Parsers leves (.pbip/.csv) - Resposta c/ Rótulo│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Usuário**: Interage via navegador web na estação Windows local através da interface visual desenhada para desktop de alta densidade;
2. **Interface (UI)**: Dispara ações operacionais por meio de componentes React. A interface não conversa diretamente com o banco nem manipula regras de negócio complexas;
3. **Camada de Aplicação (Use Cases)**: Ponto de entrada tipado via Next.js Server Actions. Valida parâmetros de entrada com schemas Zod, invoca os casos de uso correspondentes, delega persistência e orquestra a auditoria;
4. **Camada de Domínio (Domain)**: Código TypeScript puro e isolado (sem dependência de React, Next.js ou Drizzle). Executa regras de validação de negócio, avanço de etapas do workflow, conciliação matemática e consistência de entidades;
5. **Persistência Local (Persistence)**: Repositórios implementados com Drizzle ORM persistindo dados operacionais no arquivo local `workspace.db` (SQLite);
6. **Acesso a Arquivos Locais (FileSystemAdapter)**: Módulo de infraestrutura que acessa o sistema de arquivos local para ler metadados estruturais (linhas, colunas, hashes) sem carregar massas de dados de clientes na aplicação;
7. **Integração de IA (AiProviderAdapter)**: Conector provider-agnostic acionado sob demanda pelo caso de uso, aplicando salvaguardas adequadas de proteção de dados e retornando objetos tipados validados.

---

## 2. Stack Técnica Concreta e Decisões Justificadas

A stack técnica da V1 foi selecionada com base em maturidade, suporte nativo a Windows, facilidade para desenvolvimento guiado por agentes de IA e operação local sem infraestrutura cloud paga obrigatória:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 STACK TÉCNICA DA V1                                    │
├───────────────────────────────┬────────────────────────────────────────────────────────┤
│ Linguagem                     │ TypeScript (versão estável compatível, modo estrito)   │
│ Framework de Interface & Web  │ Next.js (App Router, estável no bootstrap) + React     │
│ Runtime                       │ Node.js (versão LTS suportada no Windows)              │
│ Gerenciador de Pacotes        │ npm (nativo, zero atrito no Windows)                   │
│ Banco de Dados Local          │ SQLite 3 via `better-sqlite3` (validado no Bloco 0)    │
│ Camada ORM / Query Builder    │ Drizzle ORM (`drizzle-orm` + `drizzle-kit`)            │
│ Validação de Dados e Schemas  │ Zod (versão estável compatível)                        │
│ Testes Unitários e Integração │ Vitest (com SQLite em memória `:memory:`)              │
│ Testes End-to-End (E2E)       │ Playwright (automação completa de navegador desktop)   │
│ Estilização e Design System   │ Tailwind CSS (versão estável) com tokens semânticos UX │
│ Qualidade Estática            │ ESLint (Flat Config) + Prettier + `tsc --noEmit`       │
└───────────────────────────────┴────────────────────────────────────────────────────────┘
```

### 2.1. Matriz Detalhada de Decisões Técnicas

| Componente | Escolha Técnica | Justificativa | Alternativa Considerada | Motivo da Rejeição da Alternativa |
| :--- | :--- | :--- | :--- | :--- |
| **Linguagem** | **TypeScript (versão estável, modo estrito)** | Tipagem estrita de ponta a ponta (UI $\leftrightarrow$ Domínio $\leftrightarrow$ Banco). Previne erros em tempo de compilação e maximiza a precisão de codificação por agentes. | JavaScript puro / Python | JS carece de contratos formais de tipos em refatorações; Python bifurcaria a stack criando necessidade de gerenciar múltiplos runtimes locais no Windows. |
| **Framework Web** | **Next.js (App Router, versão estável)** | Framework fullstack integrado unindo Server Components (renderização instantânea sem waterfalls de rede) e Server Actions (chamadas tipadas sem boilerplates manuais de endpoints REST). | Vite SPA + Express / Fastify separado | Criaria dois projetos, duas portas de rede locais e necessidade de scripts de orquestração de processos no Windows, aumentando atrito operacional sem ganho técnico. |
| **Runtime** | **Node.js (versão LTS suportada)** | Runtime de maior estabilidade e compatibilidade com dependências nativas no Windows. | Bun / Deno | Bun ainda apresenta inconsistências em bindings C++ nativos no Windows; Deno possui ecossistema menos maduro com Next.js App Router. |
| **Persistência** | **SQLite Local (`better-sqlite3`)** | Banco relacional embutido em arquivo único local. Latência zero de rede, suporte completo a transações ACID e zero daemons rodando em background. A compatibilidade real com o ambiente Windows deve ser validada no Bloco 0. | PostgreSQL / Supabase | Conforme definido na ADR-001, PostgreSQL exigiria daemon local ou Docker (pesado para máquina pessoal); Supabase na nuvem violaria isolamento de dados e geraria custos desnecessários. |
| **ORM / Mapeador** | **Drizzle ORM** | Mapeamento TypeScript-to-SQL de altíssima performance, com schemas declarativos tipados, migrations automáticas e zero dependência de binários proprietários pesados. | Prisma ORM | Prisma exige binários Rust em background que frequentemente geram conflitos de permissão de arquivo ou lentidão no Windows; Drizzle é mais leve e previsível. |
| **Validação** | **Zod (versão estável compatível)** | Validação canônica de schemas em runtime com inferência automática de tipos estáticos TypeScript. Utilizado na validação de formulários, arquivos e saídas de IA. | Yup / Joi | Yup e Joi possuem integração de inferência de tipos inferior e menor interoperabilidade com Drizzle (`drizzle-zod`). |
| **Testes Unit/Integ** | **Vitest** | Execução ultrarrápida nativa com ESM e TypeScript. Permite rodar testes de integração isolados com SQLite em memória (`:memory:`) em poucos milissegundos. | Jest | Jest possui configuração complexa para ESM/TypeScript no Windows e tempo de inicialização significativamente superior ao Vitest. |
| **Testes E2E** | **Playwright** | Padrão da indústria para automação de testes de ponta a ponta simulando usuário humano real no navegador (headless e headed), com gravação de vídeos e traces de auditoria. | Cypress | Cypress possui arquitetura presa a iframes no navegador, maior lentidão em execuções longas e menor ergonomia para testes multi-contexto. |
| **Estilização** | **Tailwind CSS + Tokens de Design** | Agilidade máxima de estilização para agentes de IA sem atrito de escrita de arquivos CSS dispersos, operando com variáveis CSS padronizadas conforme a UX Specification. | CSS-in-JS (Styled Components) | CSS-in-JS gera incompatibilidades com Server Components e penaliza tempo de renderização. |

---

## 3. Estrutura de Diretórios e Fronteiras da Aplicação

A estrutura do projeto adota uma arquitetura em camadas clara e enxuta, desacoplando o núcleo de negócio de frameworks e persistência:

```
analyst-personal-workspace/
├── docs/                             # Documentação normativa viva do projeto
├── drizzle/                          # Migrations SQL versionadas geradas pelo Drizzle Kit
├── public/                           # Ativos estáticos públicos (ícones, fontes)
├── src/
│   ├── app/                          # Next.js App Router (Páginas, Layouts, Server Actions)
│   │   ├── (shell)/                  # Agrupador de rotas protegidas pelo Shell Global
│   │   │   ├── layout.tsx            # Shell Global (Top Header + Left Sidebar)
│   │   │   ├── cockpit/page.tsx      # Área 1: Centro de Comando
│   │   │   ├── projects/page.tsx     # Área 2: Projetos e Clientes
│   │   │   ├── pipeline/page.tsx     # Área 3: Pipeline Kanban Operacional
│   │   │   ├── demands/
│   │   │   │   ├── page.tsx          # Lista geral de demandas
│   │   │   │   └── [id]/page.tsx     # Área 4: Espaço de Trabalho da Demanda (11 Abas)
│   │   │   ├── approvals/page.tsx    # Área 5: Central de Aprovações Humanas
│   │   │   └── portfolio/page.tsx    # Área 6: Repositório de Conhecimento e Portfólio
│   │   ├── actions/                  # Server Actions (Casos de uso orquestrados para a UI)
│   │   │   ├── demand-actions.ts     # Ações de criação, transição e arquivamento
│   │   │   ├── quality-actions.ts    # Ações de anomalias e decisões de tratamento
│   │   │   ├── validation-actions.ts # Ações de conciliação e ateste
│   │   │   └── ai-actions.ts         # Ações de invocação assistida do Copilot
│   │   ├── layout.tsx                # Root Layout (Fontes, Providers de Estado Global)
│   │   └── page.tsx                  # Redirecionamento padrão para /cockpit
│   │
│   ├── components/                   # Componentes de Interface Reutilizáveis
│   │   ├── ui/                       # Design System atômico (Button, Badge, Modal, Input, Table)
│   │   ├── layout/                   # Header, Sidebar, StickyContextBar, Breadcrumb
│   │   ├── demands/                  # Componentes específicos das 11 abas do Workspace
│   │   │   ├── TabOverview.tsx       # Aba 1: Visão Geral
│   │   │   ├── TabRequirements.tsx   # Aba 2: Requisitos e Clarificação
│   │   │   ├── TabDataAssets.tsx     # Aba 3: Ativos de Dados
│   │   │   ├── TabQuality.tsx        # Aba 4: Qualidade e Anomalias
│   │   │   ├── TabTransformation.tsx # Aba 5: Preparação e Transformação
│   │   │   ├── TabPlanning.tsx       # Aba 6: Planejamento e KPIs
│   │   │   ├── TabPowerBI.tsx        # Aba 7: Modelagem Power BI e DAX
│   │   │   ├── TabFindings.tsx       # Aba 8: Achados e Evidências
│   │   │   ├── TabValidation.tsx     # Aba 9: Validação e Conciliação
│   │   │   ├── TabDeliverables.tsx   # Aba 10: Entregáveis e Encerramento
│   │   │   └── TabDossier.tsx        # Aba 11: Dossiê e Portfólio
│   │   └── copilot/                  # Componentes do Copilot Proativo
│   │       ├── CopilotDrawer.tsx     # Área 7: Painel Lateral Deslizante
│   │       ├── EpistemicBadge.tsx    # Selos [Fato], [Sugestão], [Inferência], [Decisão]
│   │       └── DiffViewer.tsx        # Comparador visual de propostas da IA
│   │
│   ├── core/                         # NÚCLEO DE NEGÓCIO PURO (TypeScript Puro, Zero Framework)
│   │   ├── domain/                   # Entidades e Regras de Negócio do Domínio
│   │   │   ├── entities/             # Demanda, Projeto, Solicitante, Requisito, etc.
│   │   │   ├── value-objects/        # TaxaDivergencia, HashSha256, PeriodoAnalitico
│   │   │   ├── enums/                # EstadoDemanda, Severidade, TipoAprovacao
│   │   │   └── rules/                # WorkflowEngine, ReconciliationEngine (Tolerância Zero)
│   │   └── use-cases/                # Casos de Uso Puros da Aplicação
│   │       ├── demands/              # CriarDemanda, TransitarEstado, SuspenderDemanda
│   │       ├── requirements/         # EstruturarRequisitos, GerarRoteiroClarificacao
│   │       ├── quality/              # RegistrarAnomalia, DecidirTratamento
│   │       ├── validation/           # ExecutarReconciliacao, HomologarValidacao
│   │       └── portfolio/            # GerarVersaoCandidataPortfolio, HomologarCase
│   │
│   ├── infrastructure/               # IMPLEMENTAÇÕES TÉCNICAS E ADAPTADORES CONCRETOS
│   │   ├── db/                       # Módulo de Banco de Dados Local
│   │   │   ├── client.ts             # Conexão singleton SQLite + Drizzle
│   │   │   ├── schema.ts             # Definição declarativa relacional das tabelas
│   │   │   └── repositories/         # Repositórios concretos implementando interfaces do core
│   │   ├── filesystem/               # Módulo de Inspeção de Arquivos Locais
│   │   │   ├── file-inspector.ts     # Leitura de tamanho, data, hash SHA-256 e contagens
│   │   │   └── parsers/              # Parsers leves de metadados (.csv, .xlsx, .pbip)
│   │   ├── ai/                       # Camada de Inteligência Artificial Agnóstica
│   │   │   ├── ai-provider.interface.ts # Contrato abstrato AiProvider
│   │   │   ├── mock-provider.ts      # Provedor Mock offline para desenvolvimento e testes
│   │   │   └── adapters/             # Implementações concretas (Gemini, OpenAI, Ollama)
│   │   └── audit/                    # Logger estruturado e Trilha de Auditoria
│   │       └── audit-logger.ts       # Gravação de histórico e logs sem dados confidenciais
│   │
│   └── lib/                          # Utilitários Gerais Compartilhados
│       ├── formatters.ts             # Moeda (BRL), percentuais, datas ISO/BR
│       ├── id-generator.ts           # Geração de IDs únicos (nanoid/cuid2)
│       └── env.ts                    # Validação tipada de variáveis de ambiente com Zod
│
├── tests/
│   ├── unit/                         # Testes unitários puros com Vitest
│   ├── integration/                  # Testes de integração (Repositórios + SQLite :memory:)
│   └── e2e/                          # Testes End-to-End simulando analista com Playwright
│       ├── journey-analyst.spec.ts   # Simulação completa da Jornada A à Jornada L
│       └── workflow-states.spec.ts   # Validação de transições e bloqueios do pipeline
│
├── .env.example                      # Modelo de variáveis de ambiente sem credenciais
├── drizzle.config.ts                 # Configuração do Drizzle Kit para migrations
├── playwright.config.ts              # Configuração do Playwright para execução local
├── vitest.config.ts                  # Configuração do Vitest
└── tsconfig.json                     # Configuração estrita do TypeScript
```

---

## 4. Persistência Local e Governança de Dados Internos

### 4.1. Mecanismo Físico e Localização
- **Tecnologia**: SQLite versão 3 via driver `better-sqlite3`;
- **Validação de Compatibilidade no Windows**: A compatibilidade real do driver `better-sqlite3` com a versão de Node.js LTS adotada no ambiente Windows deverá ser formalmente validada durante o Bloco 0 (Bootstrap Técnico). Caso o driver apresente incompatibilidade concreta de compilação ou execução no ambiente do usuário, a situação deverá ser avaliada tecnicamente antes de qualquer alteração, não devendo ocorrer substituição automática sem análise técnica prévia fundamentada;
- **Localização Padrão**: `.workspace/data/workspace.db` (localizado na raiz do workspace, estritamente incluído no `.gitignore`);
- **Configuração por Ambiente**: O caminho físico do banco pode ser sobrescrito via variável `WORKSPACE_DB_PATH` no `.env.local`, viabilizando ambientes isolados de teste e homologação.

### 4.2. Diretrizes de Integridade e Performance SQLite
Na inicialização do cliente de banco (`infrastructure/db/client.ts`), são executadas compulsoriamente as seguintes pragmas:
```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```
- `foreign_keys = ON`: Assegura integridade referencial relacional rígida entre entidades agregadas;
- `journal_mode = WAL`: *Write-Ahead Logging* permite leituras e escritas concorrentes sem contenção de bloqueio e garante resiliência a travamentos ou quedas repentinas de energia;
- `busy_timeout = 5000`: Aguarda até 5 segundos em caso de bloqueio temporário antes de emitir erro de concorrência.

### 4.3. Estratégia de Migrations e Versionamento de Schema
- **Ferramenta**: `drizzle-kit`;
- **Fluxo de Mudança**:
  1. O desenvolvedor/agente altera declarativamente o arquivo `src/infrastructure/db/schema.ts`;
  2. Executa `npx drizzle-kit generate` para produzir um arquivo SQL versionado e incremental na pasta `drizzle/` (ex.: `0001_initial_schema.sql`);
  3. No arranque da aplicação (`bootstrap`), o módulo de banco invoca a função `migrate(db, { migrationsFolder: './drizzle' })`. O banco local do analista é atualizado automaticamente sem exigir comandos manuais adicionais.

### 4.4. Backup e Recuperação Atômica
- **Backup**: O sistema disponibiliza funcionalidade de backup instantâneo executando o comando nativo `VACUUM INTO '.workspace/backups/workspace_backup_YYYYMMDD_HHMMSS.db'`. Este comando cria uma cópia congelada, compacta e íntegra do banco sem interromper o uso da aplicação;
- **Recuperação**: O procedimento de restauração consiste na substituição atômica do arquivo `workspace.db` pelo arquivo de backup correspondente em estado desligado.

### 4.5. Auditoria e Rastreabilidade Histórica
Todas as tabelas do schema herdam o padrão temporal:
- `id`: Texto primário com identificador único ordenável temporalmente (CUID2 ou ULID);
- `criado_em`: Data/hora ISO 8601 em UTC (`timestamp_utc`);
- `atualizado_em`: Data/hora ISO 8601 em UTC atualizada a cada modificação.

Adicionalmente, a tabela `trilha_auditoria` registra mutações críticas com a seguinte estrutura:
- `id`: Chave primária;
- `demanda_id`: Referência externa à demanda afetada;
- `entidade`: Nome da entidade de domínio (`Demanda`, `ProblemaDeQualidade`, `Validacao`, etc.);
- `entidade_id`: Chave da entidade modificada;
- `tipo_evento`: `CRIACAO`, `TRANSICAO_ESTADO`, `DECISAO_HUMANA`, `SUGESTAO_IA`, `RECONCILIACAO`;
- `autor_tipo`: `HUMANO` ou `IA`;
- `dados_anteriores`: Snapshot JSON do estado anterior;
- `dados_novos`: Snapshot JSON do estado atualizado;
- `justificativa`: Motivação textual registrada pelo analista ou racional da IA;
- `timestamp`: Momento exato da ocorrência.

---

## 5. Gestão de Arquivos de Dados Profissionais

### 5.1. Princípio da Não-Duplicação
O Workspace **não é um repositório de dados brutos** nem replica gigabytes de planilhas de clientes para dentro do banco de dados da aplicação. 

Os arquivos analíticos de trabalho (`.xlsx`, `.csv`, `.tsv`, `.txt`) permanecem armazenados nas pastas de trabalho originais do analista no sistema operacional (ex.: `C:\ProjetosClientes\EmpresaX\dados\`).

### 5.2. Separação Rigorosa de Arquivos
A arquitetura classifica e segrega os dados em 5 zonas físicas estritas:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ZONEAMENTO DE ARQUIVOS E DADOS NA V1                            │
├───────────────┬──────────────────────────────────┬─────────────────────────────────────┤
│ Zona          │ Conteúdo                         │ Tratamento Técnico e Versionamento  │
├───────────────┼──────────────────────────────────┼─────────────────────────────────────┤
│ **Zona A**    │ Código-fonte da aplicação e      │ Versionado no Git. 100% livre de    │
│ (Repositório) │ documentação do projeto (`docs/`)│ segredos ou dados de clientes.      │
├───────────────┼──────────────────────────────────┼─────────────────────────────────────┤
│ **Zona B**    │ Metadados operacionais internos  │ Armazenado localmente em            │
│ (Workspace DB)│ da aplicação (SQLite local)      │ `.workspace/data/workspace.db`.     │
├───────────────┼──────────────────────────────────┼─────────────────────────────────────┤
│ **Zona C**    │ Arquivos reais de trabalho de    │ Ficam no disco do cliente. O        │
│ (Trabalho)    │ clientes (`.xlsx`, `.csv`, etc.) │ Workspace armazena apenas caminhos. │
├───────────────┼──────────────────────────────────┼─────────────────────────────────────┤
│ **Zona D**    │ Caches de profiling e logs       │ Armazenados em `.workspace/tmp/`.   │
│ (Temporários) │ locais voláteis                  │ Estritamente no `.gitignore`.       │
├───────────────┼──────────────────────────────────┼─────────────────────────────────────┤
│ **Zona E**    │ Casos de estudo para portfólio e │ Armazenados em pasta dedicada,      │
│ (Demonstração)│ fixtures sintéticas de teste     │ 100% higienizados e aprovados.      │
└───────────────┴──────────────────────────────────┴─────────────────────────────────────┘
```

### 5.3. Mecanismo de Inspeção de Arquivos (`FileSystemAdapter`)
Quando o analista registra ou analisa um ativo de dados local na aplicação, o `FileSystemAdapter` opera em **modo somente-leitura** e diferencia explicitamente dois níveis operacionais de inspeção:

#### A) Inspeção Rápida e Amostral (Preview Estrutural)
- **Objetivo**: Identificação inicial do arquivo, extração de cabeçalhos, inferência preliminar de tipos, preview imediato de linhas e reconhecimento estrutural (delimitadores, encoding aparente, nomes de abas);
- **Mecanismo**: Leitura controlada das primeiras linhas do arquivo baseada em um limite configurável de preview (ex.: 50 ou 100 linhas ajustáveis), sem carregar a totalidade dos dados na memória;
- **Aviso Normativo**: A inspeção rápida/amostral serve exclusivamente para reconhecimento e preview; ela **NÃO é suficiente para atestar a qualidade integral dos dados** ou a ausência de anomalias no conjunto completo.

#### B) Análise Completa de Qualidade (Varredura Abrangente)
- **Objetivo**: Atestar conformidade de tipos em 100% dos registros, mapeamento exaustivo de nulos, detecção de duplicidades em chaves e cálculo de integridade referencial;
- **Mecanismo**: Quando uma validação exigir cobertura integral, o sistema executa ou coordena a inspeção completa e adequada do conjunto de dados, respeitando rigorosamente limites de memória, tamanho do arquivo e desempenho:
  - Para arquivos CSV/delimitados: processamento por streaming contínuo em chunks (evitando acúmulo no heap);
  - Para arquivos XLSX: leitura otimizada por fluxos de planilha (streaming parser) quando o volume exigir;
- **Registro do Ativo**: Os metadados consolidados são gravados na tabela `ativo_de_dados` (caminho absoluto, tamanho, hash SHA-256 criptográfico, cabeçalhos, quantidade total de registros e status de inspeção).

### 5.4. Política de `.gitignore`
O arquivo `.gitignore` do repositório deve bloquear peremptoriamente:
```gitignore
# Dados e Banco Local do Workspace
.workspace/
*.db
*.db-wal
*.db-shm

# Arquivos Reais de Clientes e Formatos Analíticos
*.xlsx
*.xls
*.csv
*.tsv
*.parquet
*.pbix
*.pbit
*.zip
*.rar

# Variáveis de Ambiente e Segredos
.env
.env.local
.env*.local
*.key
*.pem

# Dependências e Builds
node_modules/
.next/
dist/
out/
coverage/
test-results/
```

---

## 6. Integração Realista e Progressiva com Power BI

### 6.1. Diagnóstico Técnico de Viabilidade no Ecossistema Windows
O Power BI Desktop é uma aplicação proprietária de 64 bits para Windows. A arquitetura técnica da V1 rejeita falsas promessas de "leitura mágica e irrestrita" de arquivos `.pbix`, fundamentando sua integração em três níveis de viabilidade técnica real:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   ESTRATÉGIA PROGRESSIVA POWER BI NA V1 DO WORKSPACE                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ NÍVEL 1: Acompanhamento e Governança Manual Assistida (Compulsório na V1)             │
│   - Registro de múltiplos modelos por demanda (cardinalidade Demanda 1 → 0..N Modelos) │
│   - Catálogo estruturado de Medidas DAX com indentação e formatação automática de texto│
│   - Associação bidirecional obrigatória: Medida DAX ◄──► Indicador KPI ◄──► Requisito  │
│   - Registro manual de tabelas e checklist dimensional (Star Schema / Calendário)      │
│   - Conciliação numérica manual de valores apurados contra bases de controle externas  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ NÍVEL 2: Leitura Automatizada de Metadados via Power BI Project - PBIP (V1 Suportado)  │
│   - Suporte oficial ao formato Microsoft PBIP (Power BI Project / TMDL / TMSL)         │
│   - Leitura direta via Node.js dos arquivos de texto estruturado `.tmdl` / `model.bim` │
│   - Extração automática de: tabelas, colunas, expressões DAX e relacionamentos         │
│   - Importação das medidas direto para o catálogo da Demanda com 1 clique              │
│   - Inspeção de metadados em arquivo .pbix tradicional limitada a atributos de sistema │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ NÍVEL 3: Manipulação Avançada e Sincronização em Nuvem (Expressamente Fora da V1)     │
│   - Gravação ou alteração direta do arquivo binário .pbix (risco de corrupção)        │
│   - Conexão via protocolo de socket na porta dinâmica do Analysis Services (msmdsrv)  │
│   - Integração com APIs REST corporativas do Power BI Service ou Microsoft Fabric      │
│   - Renderização nativa de gráficos do Power BI dentro do Workspace                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2. Estratégia Implementável na V1
1. **Suporte a Múltiplos Modelos por Demanda**: A entidade `ModeloPowerBI` possui cardinalidade `Demanda 1 → 0..N ModeloPowerBI`. Demandas que resultam apenas em entregas Excel/Power Query podem ter zero modelos associados; demandas complexas podem registrar mais de um artefato;
2. **Parser Local de PBIP (Power BI Project / TMDL)**:
   - Quando o analista salva o modelo no formato moderno `.pbip` (padrão recomendado pela Microsoft para controle de versão e governança), o modelo semântico é salvo em pastas de texto limpo (`.Dataset` ou `.SemanticModel`);
   - O `FileSystemAdapter` do Workspace lê os arquivos de texto `.tmdl` (ou `model.bim` em JSON);
   - O parser identifica as expressões `measure 'Nome da Medida' = ...`, a tabela em que reside e a descrição;
   - O Workspace oferece o botão: **"Importar Medidas do PBIP"**, populando o catálogo DAX da demanda sem digitação manual;
3. **Tratamento de Arquivos `.pbix` Tradicionais**:
   - Para arquivos `.pbix` binários tradicionais, o Workspace registra o caminho físico, tamanho e hash SHA-256;
   - O analista cadastra as fórmulas das medidas colando o texto ou solicita auxílio do Copilot para formatação e documentação;
   - A interface informa pedagogicamente a opção de salvar como `.pbip` no Power BI Desktop caso o analista deseje extração automática.

### 6.3. Divisão de Responsabilidades: Workspace vs. Power BI Desktop
- **O que o Workspace Executa**:
  - Catálogo formal de medidas DAX e metadados de modelagem;
  - Rastreamento de qual regra de negócio ou KPI motivou cada fórmula;
  - Histórico de alterações e auditoria de fórmulas modificadas;
  - Registro de conciliação numérica (comparação entre valor apurado no Power BI vs. valor esperado na base de controle);
  - Geração de documentação técnica para o Dossiê Vivo.
- **O que Permanece no Power BI Desktop**:
  - Construção visual de relatórios, dashboards e telas;
  - Execução gráfica de renderização;
  - Configuração interativa de temas, cores, fontes e layouts;
  - Publicação manual no Power BI Service corporativo do cliente.

---

## 7. Camada de Inteligência Artificial (Provider-Agnostic)

### 7.1. Contrato da Interface `AiProvider`
A camada de IA é estritamente desacoplada de fornecedores específicos através do padrão Adapter, isolando a regra de negócio de SDKs de terceiros:

```typescript
export interface AiTextRequest {
  systemPrompt: string;
  userPrompt: string;
  contextData?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AiStructuredRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  contextData?: Record<string, unknown>;
  responseSchema: z.ZodType<T>;
  temperature?: number;
}

export interface AiResponse<T> {
  result: T;
  providerId: string;
  model: string;
  tokensUsed?: { prompt: number; completion: number; total: number };
  duracaoMs: number;
}

export interface AiProvider {
  readonly id: string;
  readonly nome: string;
  isConfigured(): boolean;
  generateText(request: AiTextRequest): Promise<AiResponse<string>>;
  generateStructured<T>(request: AiStructuredRequest<T>): Promise<AiResponse<T>>;
}
```

### 7.2. Provedores Suportados e Provedor Mock
1. **`MockAiProvider` (Nativo da V1)**:
   - Implementação estática sem necessidade de chave de API ou conexão à internet;
   - Retorna estruturas sintéticas perfeitamente tipadas com base nas entradas;
   - Permite que a aplicação, os testes unitários, testes de integração e testes E2E executem com 100% de cobertura e custo zero;
2. **Provedores Externos Configuráveis (Via `.env.local`)**:
   - `GeminiAiProvider` (Google Gemini API via fetch padrão);
   - `OpenAiProvider` (OpenAI / modelos compatíveis);
   - `OllamaAiProvider` (Modelos locais em execução na máquina do usuário via `http://localhost:11434`, garantindo custo zero e privacidade física total).
3. **Seleção por Variável de Ambiente**:
   - A variável `AI_PROVIDER=mock|gemini|openai|ollama` determina o adaptador ativo em tempo de execução sem alterar código de aplicação.

### 7.3. Governança de Dados, Contexto Permitido e Salvaguardas de IA
Em estrito cumprimento à diretriz normativa de proteção de dados e privacidade:
- **Princípio Vinculante**: Dados reais, pessoais, confidenciais, sigilosos ou corporativos **não devem ser enviados a provedores externos de IA sem autorização e salvaguardas adequadas**;
- **Mecanismos de Proteção Aplicáveis**: Conforme o caso e o nível de autorização da demanda, poderão ser utilizados:
  - Anonimização (substituição de entidades, nomes e valores sensíveis por pseudônimos sintéticos);
  - Minimização (envio estrito do fragmento de texto ou regra estritamente necessária à instrução);
  - Agregação (resumos estatísticos agregados sem granularidade transacional identificável);
  - Processamento local (execução de regras, parsers e análises dentro do próprio runtime da aplicação);
  - Modelos locais (utilização de LLMs rodando no hardware do usuário via Ollama, garantindo isolamento físico completo);
  - Outros mecanismos de proteção adequados conforme a exigência do caso;
- **Desacoplamento Arquitetural**: A implementação técnica definitiva desses controles e filtros de segurança deverá permanecer estritamente desacoplada dos provedores de IA, não se criando antecipadamente qualquer componente específico ou amarra rígida nesta fase;
- **Contexto Operacional da V1**:
  - Textos de solicitações de clientes devidamente autorizados para clarificação;
  - Metadados estruturais de bases de dados (nomes de colunas, tipos inferidos, contagens de registros);
  - Expressões conceituais de regras de negócio e definições de indicadores;
  - Fórmulas DAX e expressões Power Query M isoladas;
  - Instruções técnicas do analista para estruturação de documentação e relatórios.

### 7.4. Tratamento de Falhas e Resiliência
- **Timeout Rígido**: Chamadas externas de IA possuem timeout limite de 30 segundos (via `AbortController`), impedindo que a interface fique congelada;
- **Validação de Saída Estruturada**: Toda resposta de IA que represente objetos do sistema (requisitos sugeridos, hipóteses formuladas, fórmulas DAX, sumários) é validada contra o schema Zod correspondente via `responseSchema.safeParse()`. Em caso de erro estrutural, a aplicação rejeita a resposta e exibe notificação amigável com opção de retentativa;
- **Ausência de Loops Multiagente Autônomos**: A V1 não implementa enxames ou loops infinitos de agentes. A IA atua exclusivamente como assistente reativo de tiro único (*single-turn contextual copilot*), acionado por intenções explícitas do analista na interface.

---

## 8. Segurança e Privacidade

A postura de segurança da V1 é pragmática e proporcional a um sistema operacional pessoal para trabalho profissional:

1. **Gestão de Segredos**:
   - Todas as chaves e credenciais de API (quando utilizadas) residem exclusivamente no arquivo `.env.local`;
   - O arquivo `.env.example` versionado no repositório contém apenas as chaves vazias e documentação de configuração;
   - É terminantemente proibido manter chaves hardcoded no código;
2. **Proteção Contra Path Traversal**:
   - O `FileSystemAdapter` sanitiza caminhos de arquivos locais utilizando `path.resolve` e validação estrita, prevenindo leitura de arquivos de sistema não autorizados;
3. **Isolamento de Dados de Clientes no Git**:
   - Nenhum arquivo com extensão de dados (`.xlsx`, `.csv`, `.parquet`, `.pbix`) é versionado no repositório Git;
   - Testes automatizados utilizam exclusivamente fixtures sintéticas e dados mockados gravados em `tests/fixtures/`;
4. **Sanitização de Portfólio (APROV-10)**:
   - A exportação ou compartilhamento de casos de estudo no portfólio profissional exige aprovação formal humana obrigatória (`APROV-10`), com checklist de remoção de nomes reais de clientes, valores contábeis confidenciais e dados pessoais (PII).

---

## 9. Observabilidade e Trilha de Auditoria

A rastreabilidade é assegurada por mecanismos locais simples e sem sobrecarga:

1. **Trilha de Auditoria Relacional**:
   - A tabela `trilha_auditoria` registra todas as transições de estado, aceitações de anomalias, deliberações de hipóteses e reconciliações com carimbo de data/hora ISO 8601 em UTC;
2. **Diferenciação Epistêmica Explícita no Banco**:
   - Toda sugestão gerada pela IA é gravada com `autor_tipo = 'IA'` e status `SUGERIDO_POR_IA`;
   - Ao ser aceita pelo analista, um novo registro de auditoria é gerado com `autor_tipo = 'HUMANO'`, status `APROVADO_POR_HUMANO` e o timestamp correspondente;
3. **Logging Estruturado Local**:
   - Logs de aplicação são emitidos em formato JSON no console do servidor Next.js em desenvolvimento e opcionalmente persistidos em arquivo rotativo em `.workspace/logs/app.log`;
   - Os logs registram apenas identificadores de operação, tipo de evento, tempos de resposta e códigos de erro, sem conter dados transacionais confidenciais de clientes.

---

## 10. Estratégia de Testes Automatizados

A garantia de qualidade obedece à pirâmide de testes adaptada ao produto:

```
                  ┌────────────────────────┐
                  │      TESTES E2E        │
                  │ (Playwright - Sintético│
                  │   Jornadas Completas)  │
                  ├────────────────────────┴───────────┐
                  │       TESTES DE INTEGRAÇÃO         │
                  │ (Vitest + SQLite em Memória :memory:)
                  ├────────────────────────────────────┴───────────┐
                  │             TESTES UNITÁRIOS                   │
                  │ (Vitest - Regras de Domínio Puras e Motores)   │
                  └────────────────────────────────────────────────┘
```

### 10.1. Testes Unitários (`tests/unit/`)
- Foco em funções puras e regras de negócio isoladas sem banco de dados;
- **Casos Obrigatórios**:
  - Motor de Workflow: transições válidas de estados normais (1 a 8), bloqueio de transições inválidas (ex.: pular de `Nova` direto para `Pronta para Entrega`);
  - Estados Excepcionais: transição para `Suspensa` (com motivo obrigatório) e retomada para o estado original; transição para `Cancelada` (com motivo obrigatório);
  - Motor de Reconciliação Numérica: cálculo de divergência absoluta e percentual, validação de regras de tolerância zero (diferença zero = aprovado; diferença $\neq$ 0 = divergência bloqueante);
  - Validação de Schemas Zod: coerência de inputs de requisitos, medidas DAX e parâmetros.

### 10.2. Testes de Integração (`tests/integration/`)
- Executam sobre instâncias síncronas de SQLite em memória (`:memory:`) recriadas a cada suíte de teste, garantindo velocidade de execução e isolamento total;
- **Casos Obrigatórios**:
  - Ciclo de vida de repositórios Drizzle: inserção, consulta agregada, integridade de chaves estrangeiras e cascata segura;
  - Gravação concorrente na `trilha_auditoria` durante mutações de caso de uso;
  - Leitor de metadados (`FileSystemAdapter`): leitura correta de fixtures de arquivos CSV e XLSX sintéticos na pasta `tests/fixtures/`;
  - Parser PBIP: extração correta de medidas e tabelas a partir de arquivos TMDL de amostra;
  - Adaptador de IA: validação de comportamento com `MockAiProvider` e tratamento de erros de schema inválido ou timeout simulado.

### 10.3. Testes End-to-End (`tests/e2e/`)
- Automação via Playwright simulando a interface no navegador em desktop local (`localhost:3000`);
- A suíte cobre integralmente os fluxos normais da esteira e cenários de falha previsíveis.

---

## 11. Teste Humano Simulado (Playwright Synthetic Analyst)

Para garantir que a V1 seja funcional antes de ser entregue, será implementada uma suíte dedicada de teste E2E denominada **Synthetic Analyst Journey** (`tests/e2e/journey-analyst.spec.ts`).

Essa suíte simula a atuação contínua de um analista real operando o Workspace no dia a dia. Para refletir o uso profissional verossímil, o teste **não se limita ao "happy path"** e cobre obrigatoriamente cenários normais, negativos, excepcionais e erros operacionais previsíveis:

### 11.1. Cenários Obrigatórios do Teste Simulado
1. **Fluxo Normal Completo (Jornadas A a L)**:
   - Abertura da aplicação $\rightarrow$ criação de Projeto e Solicitante $\rightarrow$ entrada de Demanda com briefing bruto;
   - Estruturação assistida de requisitos $\rightarrow$ geração e aprovação do roteiro de clarificação $\rightarrow$ registro de respostas do cliente;
   - Cadastro e inspeção de ativos de dados locais $\rightarrow$ registro e plano de tratamento de anomalia de qualidade;
   - Planejamento analítico (perguntas e KPIs) $\rightarrow$ cadastro de modelo Power BI e medidas DAX formatadas;
   - Execução de reconciliação numérica com tolerância zero $\rightarrow$ preparação do pacote de entrega;
   - Encerramento formal da demanda $\rightarrow$ geração de versão candidata sanitizada de estudo de caso para portfólio;
2. **Estados Excepcionais do Workflow**:
   - Transição de demanda para o estado `Suspensa` com exigência de justificativa formal;
   - Retomada de demanda `Suspensa` retornando com precisão para o estado exato anterior;
   - Cancelamento de demanda (`Cancelada`) com registro obrigatório de motivação e congelamento de histórico;
3. **Bloqueios e Governança de Soberania Humana**:
   - Tentativa de avançar de fase sem aprovação humana obrigatória (comprovação visual do bloqueio impeditivo);
   - Tentativa de concluir demanda com validação numérica divergente ou anomalia crítica aberta (bloqueio inegociável de fechamento);
4. **Resiliência a Falhas do Sistema de Arquivos Local**:
   - Registro de caminho de arquivo inexistente ou inválido no Windows (emissão de erro amigável sem quebra da UI);
   - Simulação de arquivo movido, renomeado ou inacessível após cadastro (detecção de ausência e alerta visual);
5. **Resiliência da Persistência Local**:
   - Recuperação transparente diante de concorrência ou bloqueio temporário de leitura/escrita no SQLite;
6. **Resiliência e Tratamento de Falhas de IA**:
   - Simulação de indisponibilidade ou timeout do provedor de IA (notificação limpa e manutenção das ações manuais);
   - Simulação de saída estruturada corrompida ou fora do schema Zod (rejeição segura, fallback amigável e permissão de retentativa);
7. **Motor de Conciliação com Tolerância Zero**:
   - Detecção de divergência matemática entre valor do Power BI e valor esperado da base de controle (marcação em vermelho e status de divergência);
   - Reteste pós-correção atingindo divergência zero (liberação imediata do status verde e registro na trilha de auditoria).

**Critério de Sucesso do Teste Simulado**: A suíte deve executar de ponta a ponta gerando relatórios de execução, traces e screenshots que comprovem a robustez da aplicação tanto no fluxo perfeito quanto diante de falhas e desvios operacionais previsíveis.

---

## 12. Estratégia de Implementação Acelerada (Fatias Verticais)

A implementação do software será conduzida em **8 blocos verticais executáveis**, orientados a valor operacional e estruturados para permitir que agentes de IA executem grande volume de trabalho de forma autônoma e segura entre checkpoints humanos fundamentais.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MAPA DE BLOCOS VERTICAIS DE CONSTRUÇÃO                          │
├───────────────┬──────────────────────────────────────────┬─────────────────────────────┤
│ Bloco         │ Título do Bloco Vertical                 │ Entrega Central             │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 0**   │ Fundação e Bootstrap Técnico             │ Setup Next.js, SQLite, Drizz│
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 1**   │ Shell Global, Design System e Cockpit    │ Header, Sidebar e Cockpit   │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 2**   │ Projetos, Solicitantes e Nova Demanda    │ CRUD Projeto e Nova Demanda │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 3**   │ Workspace da Demanda e Motor de Workflow │ Hub 11 Abas e 8+2 Estados   │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 4**   │ Dados, Qualidade e Preparação            │ Ativos, Anomalias e Transf. │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 5**   │ Planejamento Analítico e Power BI/DAX    │ KPIs, PBIP/TMDL e Medidas   │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 6**   │ Validação Multicamadas e Conciliação     │ Tolerância Zero e Batimento │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 7**   │ Entregáveis, Encerramento e Aprovações   │ Pacote, Portfólio e Trilha  │
├───────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ **Bloco 8**   │ Copilot Proativo e Validação E2E Final   │ Drawer de IA e Teste E2E    │
└───────────────┴──────────────────────────────────────────┴─────────────────────────────┘
```

### 12.1. Detalhamento dos Blocos de Construção

#### Bloco 0 — Fundação e Bootstrap Técnico
- **Objetivo**: Estabelecer a infraestrutura de código base, scripts de build, banco de dados local e ambiente de testes automatizados.
- **Funcionalidades**:
  - Inicialização do projeto Next.js com TypeScript em modo estrito e Tailwind CSS;
  - Configuração do Drizzle ORM com SQLite (`better-sqlite3`) e script de migrations;
  - **Validação de Dependências Nativas no Windows**: Teste prático de compatibilidade e compilação do `better-sqlite3` com a versão de Node.js LTS adotada no ambiente Windows do usuário;
  - Configuração do Vitest (com helper de banco em memória) e Playwright;
  - Configuração de ESLint e Prettier;
  - Criação da pasta `.workspace/` e configuração do `.gitignore`.
- **Dependências**: Nenhuma.
- **Testes Obrigatórios**: Teste unitário de inicialização do banco SQLite em memória; teste de migration inicial; verificação de estabilidade do runtime no Windows.
- **Critério de Pronto (DoD do Bloco)**: `npm run dev`, `npm run test` e `npm run build` executam com sucesso no Windows sem erros.
- **Risco Principal**: Incompatibilidade de binário nativo no Windows (mitigado pela validação inicial; se houver impedimento concreto, a situação será analisada tecnicamente antes de qualquer decisão de substituição).
- **Checkpoint Humano**: Aprovação do bootstrap inicial e da estrutura do repositório.

#### Bloco 1 — Shell Global, Design System e Cockpit Mínimo
- **Objetivo**: Construir a casca de navegação da aplicação e a tela inicial de consciência situacional do analista.
- **Funcionalidades**:
  - Layout Base: Top Header com busca `Ctrl+K`, status local-first e botão `+ Nova Demanda`;
  - Left Sidebar retrátil com rotas principais;
  - Design System atômico (Button, Badge, Modal, Card, Input);
  - Tela `/cockpit`: Barra de métricas sintéticas, quadro de prioridades e cartões de atenção situacional.
- **Dependências**: Bloco 0.
- **Testes Obrigatórios**: Testes unitários dos componentes atômicos; teste de renderização do Cockpit.
- **Critério de Pronto**: Cockpit renderiza localmente em menos de 10s e responde a interações de navegação.
- **Risco Principal**: Quebra de layout em resoluções menores de desktop (mitigado pelo design responsivo da UX spec).

#### Bloco 2 — Projetos, Solicitantes e Entrada de Demandas
- **Objetivo**: Permitir o cadastro de projetos, clientes e a recepção inicial de demandas com briefing bruto.
- **Funcionalidades**:
  - Entidades `Projeto` e `Solicitante` com repositórios e telas correspondentes (`/projects`);
  - Modal global de criação rápida `+ Nova Demanda`;
  - Captura do texto bruto da solicitação e criação da demanda no estado `Nova`;
  - Mock de IA gerando proposta inicial de requisitos estruturados.
- **Dependências**: Bloco 1.
- **Testes Obrigatórios**: Testes de repositório de Projeto e Demanda; teste E2E de criação de projeto e demanda.
- **Critério de Pronto**: Analista cria um projeto e uma demanda que persistem no SQLite e surgem no Cockpit.
- **Risco Principal**: Falha de integridade referencial entre Demanda e Projeto.

#### Bloco 3 — Workspace da Demanda (Hub) e Motor de Workflow
- **Objetivo**: Implementar o espaço central de trabalho da demanda com suas 11 abas contextuais e o motor de estados do workflow.
- **Funcionalidades**:
  - Rota `/demands/[id]` com cabeçalho de contexto persistente (Sticky Context Header);
  - Navegação entre as 11 abas contextuais com badges de status;
  - Motor de transição de estados: 8 estados sequenciais normais;
  - Estados excepcionais: modais de justificativa mandatória para `Suspensa` e `Cancelada`, com reativação segura;
  - Aba 1 (Visão Geral) e Aba 2 (Requisitos e Clarificação: estruturação e perguntas ao cliente).
- **Dependências**: Bloco 2.
- **Testes Obrigatórios**: Testes unitários rigorosos do `WorkflowEngine` (transições válidas, inválidas, suspensões e cancelamentos); teste E2E de navegação por abas.
- **Critério de Pronto**: Demanda percorre transições de estado com integridade de histórico e histórico imutável.
- **Risco Principal**: Permissão indevida de transição de fase sem cumprimento de pré-requisitos.
- **Checkpoint Humano**: Validação do fluxo de estados e da experiência de transição na tela da demanda.

#### Bloco 4 — Dados, Qualidade e Preparação
- **Objetivo**: Integrar o inventário de arquivos locais, detecção de anomalias e registro de passos de preparação.
- **Funcionalidades**:
  - `FileSystemAdapter`: leitura de metadados, contagem de linhas/colunas e cálculo de hash SHA-256 de arquivos locais;
  - Aba 3 (Dados e Inventário): cadastro e checagem de acessibilidade dos arquivos locais;
  - Aba 4 (Qualidade e Anomalias): cadastro de anomalias, plano de ação corretiva, ateste e bloqueio impeditivo;
  - Aba 5 (Preparação e Transformação): catálogo de etapas Power Query M e fórmulas Excel com registro de regras aplicadas.
- **Dependências**: Bloco 3.
- **Testes Obrigatórios**: Testes unitários do leitor de arquivos e cálculo de hash; testes de bloqueio de transição quando há anomalia de qualidade crítica aberta.
- **Critério de Pronto**: Arquivo sintético local é inspecionado, hash gravado, anomalia registrada e bloqueio de qualidade validado.
- **Risco Principal**: Erro de leitura de caminhos Windows com espaços ou caracteres especiais.

#### Bloco 5 — Planejamento Analítico e Integração com Power BI/DAX
- **Objetivo**: Estruturar a lógica investigativa (perguntas, hipóteses, KPIs) e o catálogo de modelagem Power BI / DAX.
- **Funcionalidades**:
  - Aba 6 (Planejamento, Hipóteses e KPIs): matriz de perguntas analíticas, quadro de hipóteses causais e catálogo central de KPIs com base de conferência obrigatória;
  - Aba 7 (Modelagem Power BI e DAX): suporte a múltiplos modelos (`0..N`), catálogo de medidas DAX formatadas, vínculo com KPIs e checklist dimensional;
  - Parser de PBIP: importação assistida de medidas a partir de arquivos TMDL de projeto Power BI.
- **Dependências**: Bloco 4.
- **Testes Obrigatórios**: Teste do parser TMDL; testes unitários de associação entre KPI e Medida DAX.
- **Critério de Pronto**: KPIs cadastrados com base de controle definida e catálogo de medidas DAX operacional.
- **Risco Principal**: Inconsistências de formatação em expressões DAX complexas.

#### Bloco 6 — Validação Multicamadas e Conciliação Numérica (Tolerância Zero)
- **Objetivo**: Implementar o motor de validação em 6 camadas e reconciliação cruzada de KPIs contra bases de controle.
- **Funcionalidades**:
  - Aba 8 (Análise e Achados): registro de evidências numéricas, ateste de hipóteses e redação de achados de negócio;
  - Aba 9 (Validação e Reconciliação): checklist das 6 camadas (Dados, Transformação, DAX, KPIs, Visual, Requisitos);
  - Motor de Reconciliação Numérica: cálculo em tempo real de divergência absoluta e percentual com classificação visual (`Aprovado` vs `Divergência Crítica Bloqueante`);
  - Bloqueio estrito de avanço para entrega enquanto houver divergência não resolvida.
- **Dependências**: Bloco 5.
- **Testes Obrigatórios**: Testes unitários do motor de tolerância zero; teste E2E comprovando bloqueio de avanço quando há divergência.
- **Critério de Pronto**: Batimento numérico com cálculo automático de divergência bloqueando e liberando etapas conforme a matemática exata.
- **Risco Principal**: Erros de arredondamento de ponto flutuante em JavaScript (mitigado pelo uso de tipos inteiros ou biblioteca de precisão decimal para moeda).
- **Checkpoint Humano**: Validação do motor de reconciliação de tolerância zero e regras de tolerância.

#### Bloco 7 — Entregáveis, Encerramento, Central de Aprovações e Portfólio
- **Objetivo**: Formalizar o pacote final de entrega, fechamento da demanda, fila unificada de governança humana e geração de portfólio.
- **Funcionalidades**:
  - Aba 10 (Entregáveis e Encerramento): registro de artefatos finais, sumário executivo compilado e checklist de conclusão formal;
  - Aba 11 (Dossiê Vivo e Portfólio): visualizador do dossiê Markdown em tempo real e geração de versão candidata de estudo de caso sanitizado;
  - Tela `/approvals` (Central de Aprovações): fila consolidada dos 10 pontos de aprovação humana soberana;
  - Tela `/knowledge-portfolio`: catálogo de snippets e estudos de caso aprovados (`APROV-10`).
- **Dependências**: Bloco 6.
- **Testes Obrigatórios**: Teste de integridade do Dossiê Markdown; testes da fila de aprovação e do bloqueio de exportação de portfólio sem aprovação humana expressa.
- **Critério de Pronto**: Demanda concluída com sucesso no pipeline, dossiê exportável e case sanitizado devidamente homologado por aprovação humana.
- **Risco Principal**: Exposição acidental de dados de clientes no case de portfólio (mitigado pela trava inegociável da APROV-10).

#### Bloco 8 — Copilot Proativo e Validação End-to-End Final
- **Objetivo**: Integrar os componentes transversais de IA assistida (Drawer e chips inline) e validar o software completo com a suíte E2E do Synthetic Analyst.
- **Funcionalidades**:
  - Painel lateral deslizante do Copilot (`Right Drawer` com atalho `Ctrl+/`);
  - Smart chips e propostas inline na Aba Requisitos, Qualidade, DAX e Validação;
  - Aplicação estrita dos rótulos epistêmicos: `[Fato Observado]`, `[Sugestão da IA]`, `[Inferência / Hipótese]` e `[Decisão Humana Aprovada]`;
  - Suíte de testes automatizados E2E `journey-analyst.spec.ts` cobrindo o ciclo profissional completo.
- **Dependências**: Bloco 7.
- **Testes Obrigatórios**: Execução 100% verde da suíte E2E do Synthetic Analyst e bateria de testes de regressão.
- **Critério de Pronto**: Aplicação completa funcional, documentada, com trilha de auditoria e testes passando integralmente.
- **Checkpoint Humano**: Demonstração da aplicação e homologação final da V1.

---

## 13. Definition of Done (DoD) Técnica da V1

A V1 do **Analyst Personal Workspace** será considerada concluída e pronta para uso profissional somente após o atendimento cumulativo e comprovado do conjunto de critérios objetivos abaixo. 

> **Regra Normativa:** A obtenção de "status verde" nos testes automatizados é condição indispensável, mas não isoladamente suficiente para declarar a V1 pronta. A entrega requer a convergência de estabilidade técnica, aderência funcional e a aprovação humana soberana.

### Critérios Obrigatórios da Definition of Done:
1. **Requisitos Funcionais Validados**: Cobertura comprovada dos 60 Requisitos Funcionais (RF-001 a RF-060) sem lacunas de escopo da V1;
2. **Workflow e Integridade de Estados**: Esteira de 8 estados normais e estados excepcionais (`Suspensa` e `Cancelada`) operando com histórico preservado e bloqueios determinísticos comprovados;
3. **Persistência e Integridade Relacional**: Banco SQLite executando localmente sem falhas, com migrations automáticas em dia e integridade de chaves estrangeiras (`foreign_keys = ON`) rigorosamente verificada;
4. **Mecanismo de Backup e Restauração Testado**: Procedimento de cópia atômica (`VACUUM INTO`) e restauração validado na prática sem corrupção de dados;
5. **Governança e Isolamento de Dados**:
   - Zero arquivos analíticos reais de clientes versionados no repositório;
   - Zero credenciais, tokens ou chaves de API versionadas;
   - Salvaguardas ativas de dados sensíveis na camada de IA;
   - Sanitização de portfólio estritamente bloqueada contra publicação sem homologação soberana (`APROV-10`);
6. **Integração Realista com Power BI**:
   - Suporte a múltiplos modelos por demanda (`0..N`);
   - Catálogo de medidas DAX associado a KPIs e formatado;
   - Parser de projetos PBIP (TMDL/TMSL) funcionando localmente;
7. **Motor de Conciliação com Tolerância Zero**: Cálculo automático de divergências bloqueando demandas divergentes e homologando conciliações com divergência matemática zero;
8. **Bateria de Testes Automatizados Completa**: Suítes unitárias e de integração no Vitest executando com sucesso;
9. **Suíte E2E do Synthetic Analyst Aprovada**: Simulação completa da jornada do analista cobrindo o fluxo normal e os cenários de falha previsíveis (testes negativos, caminhos inválidos, suspensões e bloqueios);
10. **Compilação e Qualidade Estática**:
    - Build de produção (`npm run build`) concluído com sucesso;
    - Tipagem TypeScript estrita sem erros no `tsc --noEmit`;
    - Linter (`npm run lint`) limpo sem violações de boas práticas;
11. **Operabilidade sem Dependência de Cloud**: A aplicação deve inicializar e operar todas as suas funções essenciais em modo local sem necessidade de serviços ou bancos de dados em nuvem;
12. **Validação Humana Final de Usabilidade e Soberania**: O analista humano deve validar a experiência real de navegação no desktop, confirmando que a interface entrega fluidez profissional e que a autoridade de decisão permaneceu intacta.

---

## 14. Princípios e Estimativa Qualitativa de Custo Operacional

A arquitetura financeira e operacional da V1 é orientada pelo princípio fundamental de **independência de infraestrutura paga**:

> **Princípio de Custo da V1:** A infraestrutura própria do Workspace V1 deve poder operar localmente sem necessidade de infraestrutura cloud paga e com custo recorrente obrigatório próprio tão próximo de zero quanto tecnicamente razoável.

### Estrutura de Custos da V1:
- **Infraestrutura Própria do Workspace (Local-First)**:
  - A aplicação executa localmente na estação de trabalho do analista;
  - Utiliza banco de dados relacional embutido (SQLite em arquivo local) e runtime Node.js;
  - Não exige servidores de aplicação em nuvem, bancos de dados gerenciados, buckets remotos ou clusters de mensageria;
  - O custo recorrente obrigatório de infraestrutura própria é **tão próximo de zero quanto tecnicamente razoável**;
- **Custos Externos Opcionais e Variáveis**:
  - *Provedores e Modelos de IA*: O analista pode optar por utilizar modelos locais (via Ollama) ou o provedor Mock nativo sem incorrer em custos de API. Caso decida utilizar chaves comerciais de provedores externos em nuvem (ex.: Google Gemini ou OpenAI), o custo será exclusivamente variável e proporcional ao volume de tokens consumido sob demanda;
  - *Softwares e Licenciamento Externos*: O Workspace não emite cobranças de softwares parceiros. Quaisquer custos de licenciamento do ecossistema Microsoft (licenças de Power BI Pro/Premium, Office ou Microsoft Fabric) continuam regidos pelos contratos corporativos do analista ou de seus clientes;
  - *Serviços Opcionais Futuros*: Serviços adicionais de sincronização ou colaboração multiusuário pertencem a versões futuras e não geram qualquer custo na V1.

---

## 15. Classificação de Decisões Arquiteturais: Reversibilidade e Impacto

Para garantir agilidade na implementação e evitar que discussões secundárias bloqueiem a evolução do software, as decisões arquiteturais da V1 foram classificadas quanto à sua reversibilidade:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CLASSIFICAÇÃO DE DECISÕES ARQUITETURAIS                         │
├─────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 1. FACILMENTE           │ - Provedor de IA ativo (troca via variável de ambiente)      │
│    REVERSÍVEIS          │ - Estilos e temas visuais específicos de componentes de tela │
│    (Baixo custo)        │ - Formato de apresentação de gráficos e tabelas no front-end │
│                         │ - Adição de novos parsers de arquivos de dados (ex: TSV)     │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2. MODERADAMENTE        │ - Escolha do Drizzle ORM como camada de persistência         │
│    CUSTOSAS             │ - Escolha do Vitest / Playwright como frameworks de teste    │
│    (Custo intermediário)│ - Estrutura de rotas e abas específicas do Next.js           │
│                         │ - Formato de exportação do Dossiê Vivo da Demanda            │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 3. ESTRUTURALMENTE      │ - Paradigma Local-First Desktop                              │
│    IMPORTANTES          │ - Banco de Dados Relacional Transacional embutido (SQLite)   │
│    (Alto impacto)       │ - Tipagem estrita de ponta a ponta com TypeScript            │
│                         │ - Desacoplamento estrito entre Regras de Domínio e Framework │
│                         │ - Princípio de Soberania Humana inegociável                  │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 16. Matriz de Riscos Técnicos e Mitigações na V1

| Risco Técnico Identificado | Prob. | Impacto | Estratégia de Mitigação Arquitetural |
| :--- | :---: | :---: | :--- |
| **1. Incompatibilidade de binários nativos no Windows** (`better-sqlite3`) | Média | Alto | Validação prática obrigatória no Bloco 0 com a versão LTS de Node.js adotada no ambiente Windows. Caso surjam impedimentos concretos de compilação ou execução, realizar avaliação técnica fundamentada antes de definir qualquer substituição. |
| **2. Arquivos de clientes muito pesados travando a interface** (planilhas de grande porte) | Média | Alto | Separação rigorosa entre preview amostral configurável (identificação inicial rápida) e análise completa de qualidade via processamento por streaming de chunks sem sobrecarga do heap. |
| **3. Falhas e indisponibilidade de provedores externos de IA** | Alta | Médio | Implementação nativa do `MockAiProvider` garantindo funcionamento completo da aplicação e dos testes offline; timeout rígido de 30s. |
| **4. Corrupção ou bloqueio de arquivo SQLite por concorrência** | Baixa | Alto | Ativação mandatória do modo WAL (`journal_mode = WAL`) e `busy_timeout = 5000`; modelo monousuário elimina concorrência severa. |
| **5. Quebra de leitura em atualizações do Power BI Desktop** | Média | Médio | Não tentar decodificar binários `.pbix` proprietários; focar no formato aberto oficial Microsoft PBIP (TMDL/TMSL) e manter o catálogo manual assistido como piso operacional seguro. |
| **6. Vazamento acidental de dados de clientes em repositório público** | Baixa | Crítico | Regras rígidas de `.gitignore` bloqueando qualquer formato analítico; suítes de teste baseadas exclusivamente em dados sintéticos mockados. |

---

## 17. Critério Final e Verificação de Decisões Humanas

### 17.1. Avaliação de Bloqueios à Implementação
Foi realizada uma análise minuciosa de todas as decisões arquiteturais estabelecidas nesta especificação técnica contra os 60 Requisitos Funcionais, o Modelo de Domínio, as 12 Jornadas Operacionais e a Especificação de UX.

**Constatação**: Todas as decisões técnicas necessárias para iniciar a construção do software estão plenamente embasadas nas fontes normativas aprovadas. **Não há nenhum bloqueio arquitetural, ambiguidade impeditiva ou lacuna técnica que impeça o início imediato da implementação pelo Bloco 0 (Bootstrap Técnico)**.

### 17.2. Registro de Decisões Humanas Futuras
Nenhuma decisão técnica foi inventada fora do escopo. Caso o usuário decida no futuro integrar provedores de IA pagos em nuvem, a escolha do provedor (`Gemini`, `OpenAI` ou `Ollama Local`) permanece como deliberação operacional do usuário através da configuração do arquivo `.env.local`, sem afetar a arquitetura aqui consolidada.

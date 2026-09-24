# ADR-001: Definição da Arquitetura Base e Stack Tecnológica para a V1

- **Status**: Aprovado
- **Data**: 2026-09-24
- **Contexto de Decisão**: Fundação do repositório e definição da base técnica para a Versão 1 (V1) do Analyst Personal Workspace.

---

## 1. Contexto

O **Analyst Personal Workspace** é um sistema operacional pessoal voltado para trabalho profissional em Dados e Business Intelligence (BI), construído para a colaboração contínua entre Humano e IA. O produto encontra-se em sua fase de fundação, com visão de produto, escopo da V1 e roadmap de longo prazo devidamente formalizados em:
- [`docs/product/vision.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/vision.md)
- [`docs/product/v1-scope.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/v1-scope.md)
- [`docs/product/roadmap.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/roadmap.md)

Na V1, o sistema apoia o analista no ciclo completo de demandas em Analytics/BI baseadas no ecossistema Excel, Power Query e Power BI. O analista trabalha primordialmente em sua estação de trabalho local, manipulando arquivos analíticos locais (`.xlsx`, `.csv`, `.pbix`) que contêm, em muitos casos, dados reais de clientes e empresas sujeitos a exigências de confidencialidade e legislações de proteção de dados.

Fazia-se necessária uma decisão formal sobre o modelo de implantação, stack tecnológica, motor de persistência, postura de segurança e estratégia de testes, garantindo que o Workspace seja profissional desde a V1 sem incorrer em superengenharia ou custos operacionais prematuros.

---

## 2. Decisões Registradas e Aprovadas

### 2.1. Paradigma Local-First na V1
O Analyst Personal Workspace será desenvolvido e operado estritamente como **Local-First** na V1. A aplicação executará localmente na estação de trabalho do analista (`localhost`), garantindo:
- Acesso direto e performático aos arquivos analíticos locais no sistema de arquivos;
- Isolamento total de dados profissionais e corporativos sensíveis em relação à rede externa;
- Independência de conexão à internet para o funcionamento das rotinas centrais de gestão, validação e documentação.

### 2.2. Preparação Híbrida sem Infraestrutura Prematura
A arquitetura do código será concebida de forma modular, mantendo contratos limpos entre interface, regras de negócio e camada de dados. Isso preserva a viabilidade técnica de uma futura evolução híbrida (local + nuvem), mas **nenhuma infraestrutura cloud (serviços de hospedagem, buckets remotos, bancos gerenciados) será provisionada ou implementada antecipadamente**.

### 2.3. Stack Principal
A stack principal de desenvolvimento da aplicação é composta por:
- **TypeScript**: Linguagem unificada em todo o projeto, operando com modo estrito (*strict mode*) para garantir contratos de dados e tipos rigorosos;
- **React**: Biblioteca para construção dos componentes de interface e cockpit do analista;
- **Next.js**: Framework fullstack que provê a estrutura de páginas do Centro de Comando e rotas de servidor (Server Actions / Route Handlers) para orquestrar operações locais de forma coesa em um único projeto.

### 2.4. Motor de Persistência da V1: SQLite Local + Drizzle ORM
A persistência de dados internos da aplicação (demandas, projetos, catálogo de metadados, hipóteses, regras de negócio e logs de validação) será realizada com:
- **SQLite Local**: Banco de dados relacional embutido e baseado em arquivo local, com latência zero de rede, zero configuração de serviços ou contêineres e portabilidade total;
- **Drizzle ORM**: Camada de mapeamento objeto-relacional tipada e leve. 
- **Desacoplamento Obrigatório**: A camada de persistência deve ser mantida estritamente desacoplada das regras de negócio (via repositórios/serviços), assegurando que uma eventual migração futura para outros motores relacionais ocorra sem refatoração do domínio da aplicação.

### 2.5. Exclusão Inicial de Supabase e PostgreSQL
**Supabase e PostgreSQL não farão parte da implementação inicial da V1**.
- O uso de PostgreSQL ou de clusters locais/remotos do Supabase exigiria serviços adicionais rodando em segundo plano (como Docker) ou hospedagem de dados em terceiros, introduzindo complexidade desnecessária para um sistema de uso pessoal neste momento.

### 2.6. Critério de Reavaliação Futura de Persistência
A ausência de PostgreSQL e Supabase na V1 **não constitui uma proibição definitiva**. A adoção de qualquer um desses componentes em versões futuras deverá ocorrer exclusivamente mediante **necessidade técnica devidamente documentada** e aprovada.

### 2.7. Qualidade e Estratégia de Testes
Em estrita conformidade com as Diretrizes de Qualidade do [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md):
- **Vitest**: Utilizado para a suíte de testes unitários (regras de negócio puras, validação de KPIs, cálculo de conciliação) e testes de integração;
- **Playwright**: Utilizado para testes End-to-End (E2E), garantindo que os fluxos completos do analista na interface permaneçam estáveis;
- **Regra Permanente**: É proibido contornar, enfraquecer ou mascarar testes para obter status verde artificialmente.

### 2.8. Camada de Inteligência Artificial e Privacy Gateway
A integração com IA seguirá uma arquitetura rigorosamente agnóstica:
- **Padrão Adapter**: Toda comunicação com modelos de linguagem será mediada por interfaces abstratas desacopladas (`AiProvider`), impedindo qualquer dependência estrutural de um fornecedor específico (Google Gemini, OpenAI, Anthropic, Ollama, etc.);
- **Privacy Gateway (Conceitual)**: A arquitetura deve prever conceitualmente um gateway de privacidade responsável por inspecionar, sanitizar ou bloquear o tráfego de dados de clientes para provedores externos de IA;
- **Escopo Imediato**: Nenhuma integração concreta com provedores externos de IA será implementada nesta fase.

### 2.9. Posicionamento do Power BI como Ferramenta Externa
- O Power BI Desktop permanece como ferramenta externa especializada de modelagem e visualização;
- O Workspace **não tentará substituir** nem emular o Power BI;
- A integração será progressiva e não invasiva, concentrando-se em: acompanhamento de status, documentação de tabelas e medidas DAX, validação cruzada de KPIs contra bases de controle e leitura de metadados quando tecnicamente apropriado.

### 2.10. Abstenção de Autenticação Complexa na V1
- Enquanto o Analyst Personal Workspace mantiver sua natureza de sistema pessoal e monousuário, **não será implementada infraestrutura complexa de autenticação** (sistemas multi-inquilino, fluxos OAuth externos, JWTs complexos com refresh tokens);
- A arquitetura preservará a capacidade de adicionar camadas de controle de acesso caso o produto venha a alterar sua natureza no futuro.

### 2.11. Princípio Arquitetural Regente
O projeto adota como diretriz permanente de governança técnica:
> **"Não implementar hoje infraestrutura cuja necessidade pertence apenas a uma possível versão futura."**

---

## 3. Justificativa

1. **Aderência ao Modelo Operacional Real**: O analista de dados atua em sua própria máquina, interagindo com arquivos locais e com o Power BI Desktop instalado no Windows. Uma arquitetura Local-First elimina o atrito de tráfego de arquivos pesados pela internet e viabiliza leitura direta no sistema de arquivos.
2. **Segurança Máxima de Dados de Clientes**: Manter os dados e metadados confidenciais restritos ao disco local cumpre rigorosamente as cláusulas de proteção de dados corporativos definidas no [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md), eliminando o risco de vazamento em bancos de dados em nuvem não autorizados.
3. **Eficiência e Velocidade de Inicialização**: A combinação Next.js + SQLite + Drizzle possui inicialização imediata, consome pouca memória, não depende de Docker e permite testes unitários e de integração ultrarrápidos com Vitest.
4. **Foco no Domínio Analítico**: Ao eliminar a carga de gerenciar microsserviços, autenticação em nuvem e instâncias remotas de banco, 100% do esforço de desenvolvimento na V1 concentra-se em resolver as dores reais do analista (qualidade dos dados, validação de KPIs e rastreabilidade).

---

## 4. Consequências Positivas

- **Custo Zero de Infraestrutura**: Operação totalmente independente de faturas de cloud na V1.
- **Portabilidade Total**: A base de dados reside em arquivo local, permitindo backups atômicos e simples.
- **Segurança Nativa**: Ausência de exposição de endpoints públicos à internet.
- **Contratos Fortes e Confiáveis**: Tipagem estrita de ponta a ponta com TypeScript e Drizzle.
- **Agnosticismo Real de IA**: O Workspace pode operar com provedores de nuvem ou com modelos locais (ex.: Ollama) sem alterar uma linha de regra de negócio.

---

## 5. Trade-offs e Limitações Conhecidas

- **Concorrência de Escrita**: O SQLite opera com bloqueio de arquivo durante operações de escrita simultâneas. Este fator é irrelevante para um sistema monousuário, mas exigirá adaptação caso o sistema evolua para múltiplos usuários.
- **Ausência de Sincronização Automática Multi-Dispositivo**: Mudanças feitas em uma máquina não são replicadas automaticamente para outro dispositivo sem um mecanismo manual de transferência de arquivo ou futura camada de sincronização.
- **Sem Painel de Banco Hospedado na Nuvem**: Não haverá interface gráfica em nuvem (como o Supabase Studio remoto), dependendo de ferramentas locais de desenvolvimento (como o Drizzle Studio executado sob demanda em `localhost`).

---

## 6. Alternativas Consideradas

| Alternativa | Motivo da Não Adoção na V1 |
| :--- | :--- |
| **Supabase (Cloud ou Local via Docker)** | Na nuvem, cria riscos desnecessários de exposição de dados de clientes e custos de hospedagem. No ambiente local, adiciona o peso de um cluster Docker completo (Postgres, Kong, GoTrue, PostgREST) em uma máquina de trabalho pessoal. |
| **PostgreSQL Local Dedicado** | Exige gerenciamento de um serviço/daemon de banco de dados ou contêiner em execução constante na máquina do analista, sem agregar vantagens operacionais tangíveis em relação ao SQLite para um único usuário na V1. |
| **Arquitetura 100% Cloud-First** | Inviabiliza a leitura direta de arquivos `.xlsx` e `.pbix` locais do analista, exigindo upload constante de dados de clientes para a internet. |
| **Backend Separado (Fastify/Express) + SPA (Vite)** | Aumenta a complexidade de manter dois projetos e dois servidores em execução local quando o Next.js já fornece o ecossistema fullstack integrado em um único repositório. |

---

## 7. Critérios para Revisão Desta Decisão

Esta decisão arquitetural poderá ser formalmente revisitada apenas se uma ou mais das seguintes condições se concretizarem:
1. **Mudança de Natureza do Produto**: O Workspace deixar de ser pessoal/monousuário e passar a exigir múltiplos analistas colaborando simultaneamente no mesmo banco de dados;
2. **Necessidade Estrutural de Acesso Remoto**: Surgir a exigência indispensável de acessar o mesmo Workspace a partir de múltiplos dispositivos sem acesso ao disco local original;
3. **Escala de Dados Internos da Aplicação**: Se o volume de metadados internos ultrapassar a capacidade ou as características de concorrência do SQLite (cenário improvável na V1);
4. **Evolução do Roadmap para Versões Avançadas**: Quando versões posteriores (ex.: V8 Cloud ou V10 Orquestração) demandarem conectividade distribuída obrigatória para sua operação.

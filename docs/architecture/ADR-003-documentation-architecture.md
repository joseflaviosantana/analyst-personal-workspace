# ADR-003: Arquitetura de Documentação Viva, Saídas Multi-Público e Princípio Personal-First, Product-Ready

## Status
**Aprovado / Fundacional (Feedback Operacional #006)**

---

## 1. Contexto e Motivação

No desenvolvimento de soluções de Analytics e Business Intelligence (BI), a documentação frequentemente falha por dois extremos:
1. **Documentação retroativa e desconectada**: redigida às pressas no encerramento do projeto, omitindo o histórico de decisões, premissas de negócio e raciocínio técnico.
2. **Documentação homogênea e inadequada ao público**: entrega de especificações técnicas densas (DAX, SQL, cardinalidade) a tomadores de decisão de negócio, ou relatórios superficiais que impossibilitam a manutenção por outro analista ou engenheiro.

O **Analyst Personal Workspace** resolve esse desafio estabelecendo uma arquitetura de **Documentação Viva e Contínua**, orientada a evidências e estruturada para múltiplos públicos, sob o princípio orientador:
> **Primeiro fazer o usuário entender o conceito. Depois ensinar, quando útil, o nome profissional/técnico desse conceito.**

---

## 2. Princípios Arquiteturais Fundamentais

### 2.1 Princípio da Documentação Contínua
A documentação **não deve ser reconstruída do zero** no encerramento do projeto.
O Workspace registra progressivamente os artefatos e evidências ao longo do ciclo de vida:

$$\text{Pedido Original} \longrightarrow \text{Esclarecimentos} \longrightarrow \text{Requisitos} \longrightarrow \text{Respostas} \longrightarrow \text{Regras de Negócio} \longrightarrow \text{Dados/Profiling} \longrightarrow \text{Tratamentos (ETL)} \longrightarrow \text{Decisões Arquiteturais} \longrightarrow \text{Cálculos/Medidas} \longrightarrow \text{Validações/Testes} \longrightarrow \text{Entrega} \longrightarrow \text{Aprendizados}$$

No encerramento, essa trilha auditável de evidências serve como fonte factual única para compilar as diferentes saídas de documentação, sempre sujeitas à **revisão e aprovação humana final**.

### 2.2 Princípio "Personal-First, Product-Ready"
O Workspace é construído prioritariamente para uso real do usuário individual (analista de BI/Analytics) na V1, mas suas decisões de design evitam acoplamentos pessoais ad-hoc ou dependências proprietárias que dificultem a futura transição para produto.

**Salvaguarda de Escopo da V1**:
NÃO implementar antecipadamente:
- Arquitetura multi-tenant ou multiusuário complexa;
- Módulos de faturamento, planos ou cobrança (billing);
- Autenticação e federação corporativa;
- Telemetria comercial invasiva;
- Publicadores automáticos em redes sociais (LinkedIn API) ou sites externos.

A arquitetura deve manter os domínios desacoplados, interfaces puras e repositórios testáveis, viabilizando extensões futuras sem reescrever o núcleo.

---

## 3. Matriz de Saídas Especializadas por Público

A arquitetura define 7 saídas de documentação especializadas, cada uma com tom, profundidade técnica e objetivos bem delineados:

| Saída | Público-Alvo | Nível Técnico | Foco Principal |
| :--- | :--- | :--- | :--- |
| **A. Relatório para o Contratante** | Stakeholders de Negócio / Clientes | Zero jargão | O que foi entregue, valor gerado, como interpretar e limitações |
| **B. Guia Rápido de Uso** | Usuários Finais do Painel | Operacional / Negócio | Como usar filtros, interpretar indicadores e navegar na solução |
| **C. Documentação Técnica de Engenharia** | Analistas, Engenheiros de Dados e Manutenção | Especializado / Rigoroso | ETL, Power Query, DAX, Modelo Dimensional, Validações |
| **D. Histórico Rastreável de Decisões** | Auditoria e Governança | Epistêmico / Rastreável | Quem decidiu o quê, quando, por que e com base em quais evidências |
| **E. Case de Portfólio / Portfólio Profissional** | Mercado, Recrutadores e Comunidade | Narrativa Estruturada | Problema real, competências aplicadas, decisões e resultados comprováveis |
| **F. Artigo / Publicação para LinkedIn** | Rede Profissional | Síntese de Alto Impacto | Aprendizados práticos, desafios superados e competências aplicadas |
| **G. Roteiro de Apresentação e Entrega** | Analista conduzindo reunião de entrega | Estratégia de Comunicação | Ordem de apresentação dos dados, perguntas de validação e checklist de aceite |

---

## 4. Detalhamento Estrutural das Saídas

### A. Relatório para o Contratante
- **Diretriz de Linguagem**: Nenhuma documentação destinada ao contratante deve exigir conhecimento técnico de Dados para ser compreendida. Quando um termo técnico for indispensável, deve ser explicado imediatamente em linguagem simples.
- **Estrutura Padrão**:
  1. O que foi solicitado (alinhado com o Pedido Original);
  2. O que foi entregue;
  3. Principais resultados e indicadores encontrados;
  4. Como interpretar os números;
  5. Decisões e regras de negócio importantes confirmadas;
  6. Limitações ou cuidados com a base de dados;
  7. Como utilizar a solução no dia a dia.

### B. Guia Rápido para o Contratante
- **Diretriz de Linguagem**: Texto direto, enxuto e visualmente escaneável para pessoas de negócio sem formação em dados.
- **Estrutura Padrão**:
  1. Como acessar e navegar no painel;
  2. Como utilizar os filtros e segmentadores;
  3. Como interpretar os principais números e gráficos;
  4. O que fazer em caso de dúvida ou discrepância observada;
  5. Cuidados essenciais na atualização e manuseio dos arquivos de origem.

### C. Documentação Técnica de Engenharia
- **Diretriz de Linguagem**: Preservação integral da terminologia profissional e rigor de engenharia.
- **Padrão de Redação**: $\text{O que fizemos} \longrightarrow \text{Por que fizemos} \longrightarrow \text{Como fizemos} \longrightarrow \text{Como validamos}$.
- **Itens Cobertos**:
  - Fontes de dados e conexões;
  - Tabelas, colunas, tipos e transformações (M / Power Query / SQL);
  - Regras de negócio implementadas e tratamentos de exceções;
  - Modelo dimensional (tabelas fato, dimensões, cardinalidade, direções de filtro);
  - Medidas analíticas e fórmulas DAX com explicação de contexto de avaliação;
  - Testes de integridade e validações cruzadas realizadas;
  - Limitações técnicas identificadas e dívidas técnicas assumidas.

### D. Histórico Rastreável de Decisões
- **Diretriz Epistêmica**: Diferenciação obrigatória entre fato observado, decisão confirmada, assunção temporária, sugestão analítica e alteração posterior.
- **Estrutura por Registro**:
  - **Decisão**: o que foi deliberado;
  - **Origem / Evidência**: fato no pedido ou dado na base que motivou a decisão;
  - **Quem Confirmou**: usuário, contratante ou analista;
  - **Quando**: carimbo de data/hora do registro;
  - **Por que**: justificativa de negócio ou técnica;
  - **O que foi afetado**: escopo, medidas, regras ou cronograma.

### E. Case para Portfólio / Site Profissional
- **Regras de Integridade Inegociáveis**:
  - Gerado exclusivamente a partir de evidências reais registradas no Workspace, nunca de texto promocional fictício;
  - Projetos simulados devem ser explicitamente identificados como simulações/estudos de caso de portfólio;
  - Dados confidenciais, nomes de clientes e credenciais devem ser 100% anonimizados ou sintetizados antes da publicação;
  - Jamais inventar impacto financeiro, percentuais de lucro ou métricas não comprovadas;
  - Jamais atribuir competências ou ferramentas não utilizadas no projeto.
- **Estrutura**:
  1. Problema de Negócio e Contexto;
  2. Objetivo Estratégico;
  3. Meu Papel na Demanda;
  4. Metodologia de Trabalho;
  5. Principais Decisões Tomadas;
  6. Ferramentas Realmente Utilizadas;
  7. Análises Realizadas e Descobertas;
  8. Resultado Comprovável;
  9. Competências Técnicas e de Negócio Aplicadas;
  10. Aprendizados Principais;
  11. Evidências Visuais e Técnicas Publicáveis (anonimizadas).

### F. Artigo / Publicação para LinkedIn
- **Diretriz**: Formato curto, factual e focado na jornada profissional do analista, sem sensacionalismo.
- **Estrutura**:
  1. Problema enfrentado;
  2. Trabalho realizado de forma prática;
  3. Ferramentas e técnicas realmente aplicadas;
  4. Principal aprendizado do projeto;
  5. Resultado comprovável obtido;
  6. Link opcional para o estudo de caso detalhado no portfólio.

### G. Roteiro de Apresentação e Entrega
- **Diretriz**: Preparar a postura profissional do analista para a reunião com o contratante, reconhecendo que a documentação escrita não substitui a condução da apresentação executiva.
- **Estrutura**:
  1. Ordem recomendada de tópicos: o que explicar primeiro para capturar atenção executiva;
  2. Como conduzir a demonstração interativa dos indicadores;
  3. Pontos de atenção e limites dos dados que devem ser destacados com transparência;
  4. Perguntas-chave para confirmar o entendimento do contratante;
  5. Checklist formal de aceite e validação de entrega.

---

## 5. Relação com Módulos e Fases do Workspace

Esta arquitetura serve como especificação fundacional.
- **Fase Atual (Fundação / Intake)**: O motor de Intake e os formulários já acumulam e preservam as sementes factuais (Pedido Original, Fatos, Requisitos Essenciais, Rastreabilidade, Justificativas e Perguntas).
- **Fases Posteriores (Execução e Entrega)**: O módulo completo de Documentação/Entrega consumirá essas estruturas persistidas e permitirá a geração assistida, revisão em tela e exportação (Markdown, PDF, HTML, PBIX Metadata).
- **Extensibilidade**: A modelagem de tipos e dados deve manter os campos de metadados prontos para alimentar esses 7 formatos sem refatoração destrutiva.

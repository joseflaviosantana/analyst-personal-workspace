# Workflow Profissional da V1 — Analyst Personal Workspace

## 1. Visão Geral e Propósito

Este documento define o **Workflow Operacional da Versão 1 (V1)** do **Analyst Personal Workspace**. Ele estabelece como uma demanda profissional real em Dados e Business Intelligence (BI) deve percorrer o sistema, desde sua entrada bruta até a entrega final e a consolidação de aprendizados.

O objetivo deste fluxo é eliminar o trabalho desorganizado, mitigar falhas silenciosas de qualidade e assegurar rastreabilidade rigorosa, sem criar fricção ou burocracia desnecessária para o analista. 

O workflow reflete integralmente os princípios de governança do [`AGENTS.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/AGENTS.md), o escopo da V1 documentado em [`docs/product/v1-scope.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/product/v1-scope.md) e a fundação arquitetural Local-First do [`docs/architecture/ADR-001-v1-foundation.md`](file:///c:/Users/Jos%C3%A9%20Fl%C3%A1vio/Projetos/analyst-personal-workspace/docs/architecture/ADR-001-v1-foundation.md).

---

## 2. Pipeline Conceitual de Estados

Para viabilizar o acompanhamento visual da demanda no Centro de Comando, o workflow é sintetizado em oito estados conceituais sequenciais:

```
[1. Nova] 
   │
   ▼
[2. Em Clarificação] 
   │
   ▼
[3. Dados Recebidos] 
   │
   ▼
[4. Em Qualidade e Preparação] 
   │
   ▼
[5. Em Modelagem e Análise] 
   │
   ▼
[6. Em Validação] 
   │
   ▼
[7. Pronta para Entrega] 
   │
   ▼
[8. Concluída]
```

Cada transição de estado exige critérios objetivos de avanço, garantindo que etapas essenciais de validação e alinhamento não sejam suprimidas.

### Estados Excepcionais da Demanda (Não Sequenciais)

Além dos oito estados normais sequenciais, o sistema contempla dois **Estados Excepcionais** fora da sequência padrão:
- **Suspensa**: Demanda com execução temporariamente pausada por impedimento externo ou solicitação do cliente;
- **Cancelada**: Demanda abortada ou rescindida antes da conclusão.

**Regras de Governança para Estados Excepcionais**:
1. Não constituem novas etapas sequenciais do fluxo normal;
2. Toda transição para `Suspensa` ou `Cancelada` preserva integralmente o histórico, ativos de dados e decisões produzidas;
3. Exigem justificativa formal obrigatória e auditável;
4. Exigem aprovação humana mandatória (proibida qualquer transição autônoma por IA);
5. Uma demanda no estado `Suspensa` pode retornar ao fluxo normal no estado em que foi pausada, mediante decisão humana expressa.

---

## 3. O Ciclo Operacional em 12 Fases

O fluxo operacional detalhado organiza o trabalho profissional em 12 fases interconectadas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALINHAMENTO & REQUISITOS                        │
│   1. Entrada da Demanda  ──►  2. Clarificação  ──►  3. Inventário Dados│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ENGENHARIA DOS DADOS                            │
│   4. Inspeção & Qualidade  ──►  5. Planejamento  ──►  6. Transformação │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     MODELAGEM, ANÁLISE & VALIDAÇÃO                     │
│   7. Modelagem Power BI  ──►  8. Análise & Hipóteses  ──►  9. Validação│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ENTREGA & CONHECIMENTO                          │
│   10. Entrega  ──►  11. Encerramento & Docs  ──►  12. Reutilização     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Entrada da Demanda

- **Objetivo**: Capturar a solicitação de negócio em linguagem natural, impedindo a perda de contexto inicial.
- **Registros Obrigatórios no Workspace**:
  - Solicitação bruta recebida (texto, e-mail transcrito, briefing);
  - Solicitante, departamento ou cliente contratante;
  - Objetivo inicial declarado pelo solicitante;
  - Contexto de negócio (por que isso foi solicitado agora);
  - Lista preliminar de arquivos ou fontes fornecidas;
  - Prazos formais ou expectativas temporais;
  - Restrições declaradas (ex.: confidencialidade, restrição de ferramentas, prazos rígidos).
- **Atuação do Copilot**: Ajuda a estruturar os campos a partir do texto bruto.
- **Salvaguarda**: A IA é estritamente proibida de presumir ou inventar informações ausentes; campos não declarados devem ser sinalizados como "Não informado".

---

### Fase 2: Compreensão e Clarificação

- **Objetivo**: Analisar criticamente a demanda, desmembrar o problema real de negócio do objetivo analítico e sanar ambiguidades antes da execução.
- **Atividades e Registros**:
  - **Problema de Negócio**: A dor real da organização (ex.: evasão de alunos, queda de margem, atraso de entregas);
  - **Objetivo Analítico**: O que a análise deve responder para apoiar a decisão (ex.: correlação entre faltas e notas, dispersão de margem por família de produtos);
  - **Identificação de Lacunas**: Requisitos vagos, premissas implícitas ou dados essenciais não fornecidos;
  - **Perguntas de Esclarecimento**: Formulação de questionamentos pontuais e profissionais ao contratante para sanar as lacunas identificadas;
  - **Classificação Epistêmica Preliminar**: Separação expressa entre **Fatos Fornecidos**, **Hipóteses Levantadas** e **Inferências Iniciais**;
  - **Critérios de Sucesso**: Definição de como o contratante considerará a demanda atendida.
- **Salvaguarda Humana Mandatória**: Nenhuma pergunta gerada pelo Workspace é enviada automaticamente. Todas as comunicações passam por revisão, edição e envio direto pelo analista humano.

---

### Fase 3: Recebimento e Inventário dos Dados

- **Objetivo**: Catalogar os ativos de dados recebidos e estabelecer a rastreabilidade das fontes brutas.
- **Registros por Arquivo/Fonte**:
  - Nome do arquivo e versão física;
  - Formato técnico (`.xlsx`, `.xls`, `.csv`, `.txt`, bases tratadas);
  - Origem (sistema de extração, usuário que enviou, pasta de rede);
  - Descrição do conteúdo;
  - Período temporal coberto pelos dados;
  - Granularidade observada (ex.: linha por transação, linha por dia, linha por aluno);
  - Campos relevantes e identificadores primários/estrangeiros aparentes;
  - Limitações declaradas ou conhecidas de antemão.
- **Regra de Ouro**: Nunca assumir que os dados fornecidos estão íntegros, limpos ou corretos.

---

### Fase 4: Inspeção e Qualidade dos Dados

- **Objetivo**: Mapear, quantificar e tratar anomalias nos dados brutos através de um fluxo estruturado e auditável.
- **Verificações Mapeadas no Workspace**:
  - Valores ausentes, nulos ou em branco (*nulls/blanks*);
  - Registros integralmente duplicados ou chaves primárias duplicadas;
  - Tipos de dados inadequados (ex.: códigos numéricos como float, números como texto);
  - Datas inválidas, formatos mistos ou fora do período da análise;
  - Categorias inconsistentes (ex.: "SP", "S. Paulo", "sao paulo");
  - Valores impossíveis ou violações de domínio (ex.: idades negativas, percentuais superiores a 100%);
  - Rupturas de granularidade (ex.: mistura de totais agregados com linhas analíticas);
  - Quebras de integridade referencial entre tabelas recebidas.
- **Estrutura Obrigatória de Registro por Problema**:
  1. **Evidência**: Onde e como o problema se manifesta (tabela, coluna, volume de linhas afetadas);
  2. **Impacto**: Como afeta o cálculo analítico ou a decisão de negócio;
  3. **Ação Tomada**: Decisão deliberada (ex.: imputação justificada, exclusão fundamentada, consulta ao cliente);
  4. **Status**: Aberto, Em Investigação, Tratado, Aceito como Restrição;
  5. **Validação Posterior**: Verificação pós-tratamento atestando que a ação resolveu a anomalia sem gerar efeitos colaterais.
- **Diretriz**: Excluir linhas sem justificativa registrada é categorizado como desvio metodológico grave.

---

### Fase 5: Planejamento Analítico

- **Objetivo**: Estruturar a estratégia de análise antes de abrir o Power BI ou construir visuais.
- **Registros Estruturados**:
  - **Perguntas Analíticas**: As perguntas exatas que a entrega precisa responder;
  - **Hipóteses Estruturadas**: Hipóteses causais a serem testadas contra as evidências;
  - **Catálogo de Indicadores e KPIs**: Nome, fórmula conceitual, unidade de medida e granularidade esperada;
  - **Regras de Negócio Codificadas**: Definições contratuais (ex.: critérios de cancelamento, regras de comissionamento, faixas etárias);
  - **Dimensões de Corte**: Atributos pelos quais os KPIs serão fatiados (tempo, geografia, categoria, etc.);
  - **Critérios de Validação Cruzada**: Definição da base de conferência matemática (ex.: conferir total de faturamento contra relatório financeiro oficial).
- **Rigor Conceitual**: Manter distinção visível entre **Fatos** (dados consolidados), **Hipóteses** (proposições a testar), **Inferências** (deduções lógicas parciais) e **Recomendações** (ações sugeridas).

---

### Fase 6: Preparação e Transformação dos Dados

- **Objetivo**: Acompanhar e documentar a engenharia de dados realizada no ecossistema local (Excel e Power Query).
- **Acompanhamento no Workspace**:
  - Registro de passos aplicados no Power Query (M) e fórmulas críticas de planilha;
  - Registro das etapas de limpeza: remoção de cabeçalhos redundantes, desdinamização (*unpivot*), criação de colunas condicionais, tipagem estrita;
  - Decisões de junção (*merges* e *appends*), com verificação de não-duplicação de cardinalidade;
  - Isolamento de dados tratados em relação às bases brutas originais (preservação do dado de origem).
- **Limite Operacional**: O Workspace não executa o Power Query; ele gerencia a rastreabilidade e a documentação do processo de transformação executado nas ferramentas especializadas.

---

### Fase 7: Modelagem e Power BI

- **Objetivo**: Governança, documentação técnica e acompanhamento do modelo desenvolvido no Power BI Desktop.
- **Itens Catalogados no Workspace**:
  - Identificação do arquivo `.pbix` ou diretório de projeto associado;
  - Esquema de tabelas do modelo (Tabelas Fato e Tabelas Dimensão);
  - Mapa de relacionamentos (cardinalidades `1:*` e direção de filtros cruzados);
  - Tabela Calendário (dData): intervalo coberto, colunas auxiliares (ano/mês, semestre, dia útil);
  - Catálogo de Medidas DAX: nome, código DAX, pasta de exibição e regra de negócio correspondente;
  - Estrutura de páginas e visuais principais construídos;
  - Justificativa técnica para decisões de modelagem atípicas (ex.: relacionamentos bidirecionais ou tabelas ponte).
- **Premissa Inegociável**: O Power BI Desktop permanece como a ferramenta de modelagem e desenho visual. O Workspace atua como sua camada externa de auditoria, documentação e acompanhamento.

---

### Fase 8: Análise e Interpretação

- **Objetivo**: Concluir o teste de hipóteses e extrair achados consistentes a partir do modelo construído.
- **Registros Obrigatórios**:
  - Respostas objetivas para cada uma das perguntas analíticas da Fase 5;
  - Status de cada hipótese: **Confirmada**, **Rejeitada** ou **Inconclusiva**, sustentada por evidências numéricas;
  - Principais achados de negócio (*insights* fundamentados);
  - Limitações da análise decorrentes dos dados disponíveis;
  - Explicações alternativas avaliadas para evitar conclusões precipitadas decorrentes de correlações espúrias.
- **Papel Crítico do Copilot**: Desafiar interpretações superficiais, sugerir verificações adicionais e apontar vieses cognitivos comuns.

---

### Fase 9: Validação Multicamadas

- **Objetivo**: Blindar a entrega contra erros numéricos, regras de negócio mal aplicadas ou divergências de requisitos.
- **Camadas de Validação Obrigatórias**:
  1. **Validação de Dados**: Verificação de integridade entre dados brutos e carregados;
  2. **Validação de Transformações**: Auditoria de regras aplicadas no Power Query;
  3. **Validação de Cálculos e DAX**: Conferência manual ou por amostragem de fórmulas complexas;
  4. **Validação Cruzada de KPIs**: Confronto entre os totais apurados no Power BI e os totalizadores de bases de controle independentes (com tolerância zero para divergências inexplicadas);
  5. **Validação Visual e Usabilidade**: Verificação de filtros, rótulos, títulos e comportamento interativo do relatório;
  6. **Validação de Atendimento aos Requisitos**: Checklist final confirmando que cada objetivo da Fase 1 e Fase 2 foi plenamente respondido.
- **Registro do Log de Validação**:
  - Item testado / KPI;
  - Método de validação aplicado;
  - Resultado esperado vs. Resultado encontrado;
  - Divergência apurada;
  - Ação corretiva (se necessária) e registro de reteste;
  - **Status Final**: Validado / Aprovado.

---

### Fase 10: Preparação da Entrega

- **Objetivo**: Empacotar os entregáveis finais com padrão profissional para apresentação ao cliente.
- **Registros e Itens de Saída**:
  - Arquivo final entregável (ex.: `.pbix` higienizado, relatório exportado em PDF, planilha executiva);
  - Versão do artefato (ex.: `v1.0-final`);
  - Sumário executivo destacando os principais resultados e respostas de negócio;
  - Seção de limitações conhecidas e premissas adotadas;
  - Registro explícito de que todas as validações de integridade foram aprovadas;
  - Pendências contratuais ou recomendações para fases futuras.
- **Salvaguarda**: O Workspace não realiza disparo automático de arquivos ou e-mails para terceiros. O analista humano é o único canal de entrega ao contratante.

---

### Fase 11: Encerramento e Documentação Concorrente

- **Objetivo**: Consolidar o histórico operacional do projeto de forma estruturada.
- **Premissa de Documentação Concorrente**: A documentação viva é produzida *durante* a execução de cada fase, nunca postergada para ser reconstruída de memória no final.
- **Dossiê Final Consolidado**:
  - Histórico cronológico das decisões tomadas;
  - Dicionário de dados e regras de negócio codificadas;
  - Registro de erros encontrados e soluções aplicadas;
  - Registro de conciliação e validação de KPIs;
  - Transição de status da demanda para **Concluída**.

---

### Fase 12: Reutilização Profissional e Portfólio Higienizado

- **Objetivo**: Extrair ativos intelectuais duradouros a partir do projeto finalizado, retroalimentando o aprendizado do usuário.
- **Processos Pós-Encerramento**:
  - **Identificação de Padrões**: Mapeamento de problemas recorrentes e soluções eficazes;
  - **Catálogo de Snippets Reutilizáveis**: Fórmulas DAX genéricas, padrões de tabela calendário ou transformações em M arquivadas para futuros projetos;
  - **Geração de Estudo de Caso de Portfólio**: Derivação estruturada do projeto no formato:
    $$\text{Problema de Negócio} \longrightarrow \text{Processo Analítico} \longrightarrow \text{Desafios Superados} \longrightarrow \text{Resultados Obtidos}$$
- **Salvaguarda Crítica de Sigilo**: É terminantemente proibido transferir nomes reais de clientes, valores corporativos sigilosos ou identificadores pessoais para materiais de portfólio. Todo case passa por higienização completa, generalização e anonimização com dados fictícios (*mock data*).

---

## 4. O Copilot Transversal (Papel da IA no Fluxo)

A Inteligência Artificial no Analyst Personal Workspace **não é uma etapa estanque do pipeline**, mas um copiloto integrado que atua transversalmente ao longo de todo o ciclo de trabalho.

```
                      ┌─────────────────────────────────┐
                      │        COPILOT PROATIVO         │
                      │  Detectar ──► Explicar ──► Agir │
                      │  Documentar ──► Validar ──► Guia│
                      └────────────────┬────────────────┘
                                       │ (Transversal)
         ▼           ▼                 ▼                 ▼             ▼
   [Requisitos] ──► [Dados] ──► [Qualidade/Prep] ──► [Modelagem] ──► [Validação]
```

### 4.1. Papéis Contextuais do Copilot

| Papel Contextual | Momento de Atuação | Responsabilidade Típica |
| :--- | :--- | :--- |
| **Estruturador** | Fases 1 e 2 | Transforma solicitações informais em requisitos claros, detectando prazos e objetivos. |
| **Investigador** | Fases 3 e 4 | Ajuda a explorar esquemas de dados, inspecionar colunas e rastrear anomalias de tipos e datas. |
| **Crítico** | Fases 2, 5 e 8 | Questiona premissas frágeis, aponta explicações alternativas para tendências e evita conclusões precipitadas. |
| **Analista** | Fases 5 e 8 | Apoia a formulação de hipóteses lógicas e a definição matemática de indicadores. |
| **Documentador**| Fases 6, 7 e 11 | Auxilia a documentar passos de transformação, regras de negócio e fórmulas DAX em tempo real. |
| **Validador** | Fases 9 e 10 | Confronta valores de conciliação, sinaliza divergências e confere o checklist de requisitos antes do fechamento. |

### 4.2. Diretrizes Vinculantes para a IA
1. **Transparência de Incerteza**: Quando a IA identificar lacunas ou não possuir dados suficientes, deve declarar explicitamente sua dúvida, sem especular.
2. **Proibição de Alucinação de Dados**: A IA nunca deve gerar ou inventar registros de dados como se fossem fatos fornecidos pelo cliente.
3. **Impossibilidade de Mascarar Erros**: Sob nenhuma circunstância a IA pode abrandar ou contornar inconsistências encontradas em testes ou validações.
4. **Proteção Rigorosa de Dados e Privacidade**: Dados reais, pessoais, confidenciais, sigilosos ou corporativos não devem ser enviados a provedores externos de IA sem autorização e salvaguardas adequadas. Anonimização, minimização de dados, processamento local ou outros mecanismos de proteção poderão ser utilizados conforme o caso. A implementação técnica desse mecanismo ainda não está definida, e esta etapa do projeto não deve criar nem nomear antecipadamente um novo componente arquitetural.

---

## 5. Garantia de Autoridade Humana e Segurança de Dados

O workflow estabelece salvaguardas explícitas em todas as etapas para preservar a soberania do analista e a integridade da informação:

1. **Soberania Decisória**: O analista humano é o único responsável por aprovar hipóteses, decisões de limpeza de dados, regras de negócio e validações finais de entrega.
2. **Segurança de Dados Reais**:
   - Dados de clientes permanecem em pastas locais segregadas, fora do controle de versão Git;
   - O Workspace armazena metadados de trabalho (caminhos, esquemas, regras, logs) e nunca bancos brutos confidenciais de forma versionável;
   - Proibição de envio autônomo de informações para clientes ou sistemas externos.
3. **Auditabilidade Integral**: Toda ação relevante possui registro de autoria, justificativa técnica e status de conferência, assegurando que o Workspace seja profissional e confiável desde a V1.

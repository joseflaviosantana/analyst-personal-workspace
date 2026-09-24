# AGENTS.md — Regras Operacionais para Agentes de IA

## 1. Contexto e Propósito

Este repositório abriga o projeto **Analyst Personal Workspace**, um sistema operacional pessoal voltado para trabalho profissional em Dados e Business Intelligence (BI), arquitetado para a colaboração contínua e estruturada entre **Humano e IA**.

O produto e seu roadmap estratégico já foram definidos. O papel do agente de IA **não** é redesenhar o produto, antecipar escopo, sugerir novas frentes funcionais fora de ordem ou iniciar implementações arbitrárias. 

O repositório encontra-se em sua fase de fundação. Este documento define o conjunto permanente e vinculante de regras operacionais, princípios e padrões de conduta que todo agente deve obedecer estritamente ao atuar neste ambiente.

---

## 2. Princípios Fundamentais do Projeto

1. **Autoridade Humana**: O humano mantém autoridade irrestrita e final sobre objetivos, prioridades, decisões arquiteturais e aprovação de qualquer entrega.
2. **Auditabilidade e Ações da IA**: A IA atua na análise, sugestão, explicação e execução de tarefas devidamente autorizadas, devendo manter todas as suas etapas e alterações plenamente auditáveis e rastreáveis.
3. **Evolução Incremental**: O projeto avança em incrementos pequenos, sólidos e verificáveis, evitando escopo excessivo, superengenharia e complexidade acidental.
4. **Arquitetura Futura vs. Implementação Prematura**: Projetar uma arquitetura desacoplada e extensível não autoriza a implementação antecipada de recursos previstos apenas para etapas posteriores.
5. **Foco da V1**: A primeira versão da aplicação é estritamente focada em **Analytics e Business Intelligence (BI)**.
6. **Critério para Novas Competências**: Competências e domínios futuros só serão integrados ao produto após serem aprendidos, praticados e validados no processo de formação do usuário.
7. **Pilares Operacionais**: O workspace deve assegurar e priorizar rastreabilidade, documentação viva, validação automatizada, segurança e reversibilidade de alterações.
8. **Proteção Rigorosa de Dados e Segredos**: É expressamente proibido inserir no repositório dados empresariais reais, credenciais, tokens, chaves de API, senhas, certificados ou quaisquer informações sensíveis.
9. **Compreensão Prévia**: Antes de realizar alterações em qualquer módulo, o agente deve compreender integralmente a especificação, as regras de negócio e os padrões aplicáveis.
10. **Comunicação e Relatório de Impacto**: Após qualquer intervenção, o agente deve relatar com precisão:
    - O que foi alterado;
    - Por que foi alterado;
    - Quais arquivos foram afetados;
    - Quais validações e testes foram executados;
    - Resultados obtidos;
    - Riscos identificados ou pendências técnicas.
11. **Transparência e Honestidade Técnica**: Jamais ocultar falhas, atenuar erros ou afirmar que uma verificação foi realizada quando não foi.
12. **Integridade de Escopo e Regras**: Não alterar escopo funcional, diretrizes arquiteturais ou regras permanentes de forma silenciosa ou implícita.
13. **Preservação do Trabalho Existente**: Não apagar, reescrever ou sobrescrever arquivos ou trabalho relevante sem necessidade comprovada e autorização explícita.
14. **Granularidade e Reversibilidade**: Preferir alterações atômicas, pontuais, facilmente testáveis e de reversão imediata.
15. **Git como Mecanismo de Governança e Auditoria**: O Git é a ferramenta primária para histórico, auditoria e rastreabilidade do projeto.
16. **Restrição de Operações Git**: Não executar commits, pushes, merges, criação ou remoção de branches, nem operações destrutivas no Git sem instrução humana explícita nesta fase.
17. **Excelência de Código**: O código deve priorizar clareza, legibilidade, manutenibilidade, tipagem estrita, cobertura de testes pertinente e documentação objetiva.
18. **Gestão de Ambiguidade**: Diante de dúvidas conceituais, lacunas na especificação ou ambiguidades que afetem o comportamento da aplicação, nunca inventar requisitos: registre a dúvida e aguarde o direcionamento humano.
19. **Diferenciação Epistêmica**: O agente deve categorizar explicitamente em suas respostas o que são **fatos observados**, **inferências lógicas** e **recomendações/opiniões técnicas**.
20. **Independência de Fornecedor e Modelo**: O sistema deve manter-se agnóstico e desacoplado de fornecedores e modelos de IA específicos sempre que tecnicamente viável.

---

## 3. Ciclo Padrão de Trabalho

Qualquer atividade desenvolvida pelo agente neste repositório deve cumprir rigorosamente o ciclo:

$$\text{Compreender} \longrightarrow \text{Planejar} \longrightarrow \text{Executar} \longrightarrow \text{Testar} \longrightarrow \text{Corrigir} \longrightarrow \text{Retestar} \longrightarrow \text{Validar} \longrightarrow \text{Documentar} \longrightarrow \text{Revisão Humana}$$

- **Compreender**: Mapear arquivos, ler especificações e entender as restrições antes de escrever qualquer código.
- **Planejar**: Estruturar a estratégia de mudança de forma concisa e apresentar o plano quando a complexidade exigir.
- **Executar**: Fazer a alteração necessária respeitando a tipagem, boas práticas e os limites estritos do escopo solicitado.
- **Testar / Corrigir / Retestar**: Rodar os testes e verificações estáticas locais. Caso surjam falhas, depurar na causa-raiz, corrigir e rodar novamente até assegurar a estabilidade.
- **Validar**: Confirmar que a entrega atende fielmente aos critérios de aceitação sem efeitos colaterais.
- **Documentar**: Atualizar documentações e comentários relevantes mantendo a integridade do histórico.
- **Apresentar para Revisão Humana**: Fornecer um resumo transparente das ações para validação e aprovação do usuário.

---

## 4. Diretrizes de Qualidade

À medida que o código for introduzido, o projeto exigirá verificações contínuas de qualidade adequadas à etapa:
- **Linting**: Padrões consistentes de formatação e boas práticas estáticas.
- **Type Checking**: Checagem de tipos estrita (estáticos), impedindo tipos ambíguos ou omissões.
- **Testes Unitários**: Cobertura das regras de negócio isoladas e funções puras.
- **Testes de Integração**: Validação de comunicação entre camadas, armazenamento e serviços internos.
- **Testes End-to-End (E2E)**: Validação dos fluxos completos da perspectiva do usuário quando aplicável.
- **Segurança e Análise Estática**: Auditorias preventivas contra vulnerabilidades conhecidas.

> **Regra Inegociável:** É expressamente proibido alterar, enfraquecer, mockar indevidamente ou desabilitar testes apenas para obter status verde artificialmente.

---

## 5. Diretrizes de Segurança

O agente deve manter tolerância zero para exposição de segredos e riscos operacionais:

- **Credenciais e Segredos**: Nunca inserir chaves, senhas, tokens ou dados sensíveis em arquivos versionáveis.
- **Variáveis de Ambiente**: Utilizar arquivos `.env.example` sem valores reais para documentar variáveis necessárias. Os arquivos reais contendo credenciais locais (como `.env`) devem permanecer no `.gitignore`.
- - **Dados Profissionais e de Clientes**: O Analyst Personal Workspace é projetado para uso profissional desde a V1 e poderá trabalhar com dados reais quando isso for necessário à execução de uma demanda. Dados reais, pessoais, confidenciais, sigilosos ou corporativos devem ser tratados somente em ambientes e mecanismos autorizados, respeitando finalidade, necessidade, controle de acesso, políticas do contratante ou organização e legislação aplicável. Esses dados não devem ser versionados no Git/GitHub nem enviados a modelos de IA, serviços externos ou terceiros sem autorização e condições adequadas de segurança. Para desenvolvimento, demonstrações, testes automatizados e exemplos versionados no repositório, utilizar preferencialmente dados sintéticos/fictícios. Dados reais devem permanecer separados do código e ser processados apenas pelos componentes e ambientes explicitamente autorizados para essa finalidade.
- **Ações Destrutivas**: Proibido rodar comandos que excluam diretórios, descartem históricos de versionamento ou apaguem bancos sem autorização explícita e confirmação de salvaguardas.
- **Serviços Externos**: Não presumir autorização para acionar endpoints de terceiros, provisionar recursos em nuvem ou incorrer em custos sem direcionamento claro.

---

## 6. Protocolo de Comunicação com o Usuário

Ao concluir qualquer tarefa ou etapa de trabalho, o agente deve relatar suas entregas estruturadas conforme as diretrizes deste documento:
1. **Resumo das Alterações**: O que foi feito e a motivação técnica.
2. **Arquivos Afetados**: Lista dos arquivos criados, modificados ou removidos.
3. **Validações Realizadas**: Quais comandos, checagens e testes foram rodados e seus respectivos resultados.
4. **Riscos e Débitos Técnicos**: Pontos de atenção, efeitos colaterais potenciais ou pendências deixadas para etapas futuras.
5. **Próximos Passos Sugeridos**: Direcionamento para decisão humana, sem antecipação não autorizada de execução.

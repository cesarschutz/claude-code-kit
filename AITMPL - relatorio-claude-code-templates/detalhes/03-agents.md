# 03 · O tipo AGENTES (cli-tool/components/agents, 28 categorias)

Pesquisa somente leitura feita em 04/10/2026 sobre davila7/claude-code-templates (MIT, 32,4 mil estrelas na página do GitHub hoje). Contagens vêm do tree.json, de docs/components.json e de uma varredura dos arquivos lidos via API do GitHub. Percentuais de "gatilho" são heurística (regex sobre o texto). A CLI do repositório não foi executada.

## Explicação

### O que é um agente (subagente)

Um agente é um arquivo Markdown com frontmatter YAML. O corpo vira o prompt de sistema de um assistente especializado, que roda em contexto próprio e devolve só o resultado à conversa principal. Claude decide quando delegar lendo o campo `description` ("When Claude should delegate to this subagent", na documentação oficial), então a descrição precisa dizer quando usar o agente. O mesmo arquivo também pode virar a sessão principal com `claude --agent <nome>`: nesse caso o prompt do agente substitui o prompt de sistema padrão do Claude Code.

### Formato do arquivo

Campos documentados hoje em code.claude.com/docs/en/sub-agents (lido em Markdown cru):

| Campo | Para que serve |
| :- | :- |
| `name` (obrigatório) | Identificador único; não pode conter `:`. O nome do arquivo não precisa coincidir. |
| `description` (obrigatório) | Quando Claude deve delegar. |
| `tools` | Lista separada por vírgulas ou lista YAML. Se omitido, herda todas as tools. Se nenhuma entrada resolver para uma tool, o subagente "usually" falha ao iniciar com erro (comportamento desde a v2.1.208). |
| `disallowedTools` | Tools removidas da lista herdada ou declarada. |
| `model` | `sonnet`, `opus`, `haiku`, `fable`, um ID completo de modelo ou `inherit`. |
| `permissionMode` | `default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan` ou `manual` (alias de `default`, v2.1.200+). Ignorado em agente de plugin. |
| `maxTurns` | Máximo de turnos agênticos; ao estourar, a saída volta marcada como parcial (v2.1.246+). |
| `skills`, `mcpServers`, `hooks` | Skills pré-carregadas, servidores MCP e hooks do ciclo de vida do agente. `mcpServers` e `hooks` são ignorados em agente de plugin. |
| `memory` | Memória persistente: `user`, `project` ou `local`. |
| `background`, `isolation`, `effort` | Rodar em segundo plano; `worktree` para copiar o repositório num worktree temporário; nível de esforço (`low` a `max`). |
| `omitClaudeMd` (v2.1.271+), `initialPrompt`, `experimental` (`cacheTtl`, v2.1.248+) | Lançar sem CLAUDE.md; primeiro turno automático quando o agente roda como sessão principal; opções experimentais. |
| `color` | `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink` ou `cyan`. |

Onde o agente é carregado (maior prioridade primeiro): configurações gerenciadas da organização, flag `--agents` (JSON da sessão), `.claude/agents/` do projeto, `~/.claude/agents/`, pasta `agents/` de plugin. A documentação diz que agentes de plugin ignoram `hooks`, `mcpServers` e `permissionMode`; para usá-los, copie o arquivo para `.claude/agents/` ou `~/.claude/agents/`.

O guia do próprio repositório (cli-tool/docs_to_claude/SUBAGENTS_GUIDE.md) documenta só quatro campos (name, description, tools, model) e duas pastas; está defasado frente à documentação oficial. O repositório usa quase só esses quatro campos: dos 417 agentes com frontmatter, todos têm `name` e `description`, 412 têm `tools`, 78 têm `model`, 33 têm `color`, 6 têm `permissionMode`, 1 tem `maxTurns` (llms-maintainer, 50) e 1 tem `hooks` (security/read-only-auditor).

### Como a CLI instala

`npx claude-code-templates@latest --agent categoria/nome` (README, exemplo `--agent development-tools/code-reviewer --yes`); vários agentes separados por vírgula. Em cli-tool/src/index.js, `installIndividualAgent` faz o seguinte:

- baixa `https://raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/agents/<categoria>/<nome>.md` (branch main, sem versão fixada nem checksum);
- grava em `.claude/agents/<nome>.md` do diretório de destino, numa pasta única: a categoria é descartada;
- sobrescreve sem perguntar (configurações e hooks pedem confirmação de sobrescrita; agentes não).

Efeitos práticos: só o arquivo `.md` é instalado (os 10 scripts `.py` de obsidian-ops-team/Scripts não vão junto), e dois agentes de categorias diferentes com o mesmo nome de arquivo se sobrescrevem. Não confunda `--agent` (instala) com `--agents` (abre um dashboard de conversas) e `--teams` (abre o dashboard de sessões do Agent Teams).

Telemetria (cli-tool/src/tracking-service.js, ligada por padrão):

- ao instalar, envia para `https://www.aitmpl.com/api/track-download-supabase` o tipo, o nome (com categoria), o caminho (diretório de destino relativo ao diretório atual), a categoria e a versão da CLI;
- um segundo evento de resultado (`/api/track-installation-outcome`) envia sucesso ou falha, tipo e mensagem de erro, duração, versão da CLI, versão do Node, plataforma, arquitetura e batchId; há ainda um evento de uso de comando (`/api/track-command-usage`);
- desligam a telemetria `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`;
- os dois READMEs que li (raiz e cli-tool/README.md) não mencionam a telemetria de instalação nem o opt-out; só o código.

### O que há dentro (números de hoje)

- docs/components.json e dashboard/public/counts.json: 422 agentes em 28 categorias. O site (aitmpl.com/agents) e o CLAUDE.md do repositório dizem "600+"; não achei de onde vem a diferença.
- O tree.json tem 424 arquivos `.md` sob agents/: os 422 do catálogo mais 2 cópias de vital-health-content-agent.md em caminhos aninhados repetidos dentro de business-marketing (fora do catálogo, e o caminho canônico dá 404). Há também `development-team/flutter-ui-developer` sem extensão (a CLI pede `flutter-ui-developer.md` e recebe 404) e 10 scripts Python em obsidian-ops-team/Scripts.
- Dos 422 do catálogo, 417 têm frontmatter. Sem frontmatter: README.md (programming-languages) e agent-overview.md (deep-research-team), que contam como "agente" mas são documentação, além de commit-guardian, sdd-spec-writer e supply-chain-security. Cinco agentes com frontmatter não declaram `tools` (code-simplifier, rootly-incident-responder, agent-expert, architect-review, dependency-manager) e herdam tudo.
- Só um arquivo tem `name` diferente do nome do arquivo: expert-advisors/architect-review.md (name: architect-reviewer).
- Mais baixados (números informados pelo repositório em components.json, hoje): frontend-developer 39.961, code-reviewer 30.321, ui-ux-designer 26.375, backend-architect 23.175, fullstack-developer 17.701. Por categoria: development-team 137.480, development-tools 94.230, programming-languages 49.793.
- No catálogo, `license` e `repo` estão vazios nos 422; `author` só existe em bettoredge-value-finder; `version` em 2; `security.validated` é false nos 422.

### Famílias de prompt

- Estilo VoltAgent/awesome-claude-code-subagents: 147 arquivos têm o bloco "Integration with other agents" e 89 mandam "Query context manager" e mostram JSON de progresso com números inventados (ex.: `"test_coverage": "88%"` em spring-boot-engineer, kotlin-specialist e vue-expert). O corpo de spring-boot-engineer é idêntico, byte a byte, ao do VoltAgent (comparado hoje); só a descrição foi expandida com exemplos.
- Curtos "Focus Areas / Approach / Output": 53 arquivos têm "Focus Areas" (rust-pro e video-editor, de 1,2 KB, são exemplos).
- Portes de chat modes do GitHub Copilot: 79 agentes não declaram nenhuma tool que exista no Claude Code (nomes como `codebase`, `edit/editFiles`, `runCommands`, `githubRepo`) e 11 misturam. Distribuição dos 79: expert-advisors 27, data-ai 19, security 9, web-tools 7, programming-languages 6, development-tools 4, documentation 4, devops-infrastructure 3. Três arquivos de data-ai trazem "Brought to you by microsoft/edge-ai" (prompt-builder, task-planner, task-researcher).
- Times com pipeline próprio (deep-research, ocr, ui-analysis).

### Qualidade média

Pontos bons:

- A descrição tem gatilho explícito ("Use PROACTIVELY...", "Use this agent when...") em cerca de dois terços (273 a 279 dos 417, conforme o regex); 177 trazem blocos `<example>`.
- Parte limita as ferramentas: security-auditor, compliance-auditor, ad-security-reviewer, task-decomposition-expert e code-architect/code-explorer/test-generator só leem; business-marketing tem seis agentes sem Write nem Bash.
- Rodei o `claude plugin validate` do Claude Code 2.1.289 numa cópia temporária dos 417 arquivos com frontmatter (apagada depois): um único erro, em data-ai/prompt-engineer.md (frontmatter não parseia; em execução o agente fica só com o nome do arquivo e perde todos os outros campos). Nem o modo `--strict` achou mais nada. Outros 19 arquivos não passam em um parser YAML estrito, mas o validador do Claude Code os aceita.

Pontos fracos:

- Descrição sem disciplina de tamanho: mediana de 214 caracteres (230 de 422 abaixo de 300), mas 159 passam de 1.500 e respondem por 89% dos 535.043 caracteres somados (máximo 5.732, agent-organizer). Isso dá cerca de 134 mil tokens por estimativa de 4 caracteres por token; a documentação avisa na inicialização quando as descrições somam mais de 15.000 tokens e manda mover o detalhe para o prompt. Instalar tudo seria contraproducente.
- Prompts genéricos com checklists ("Test coverage > 85% achieved") e métricas fictícias.
- Tools demais: dos 412 que declaram `tools`, 291 podem escrever (Write, Edit, MultiEdit ou NotebookEdit) e 232 têm Bash.
- 79 agentes com tools do Copilot que não resolvem no Claude Code; a documentação diz que, se nada em `tools` resolve, o subagente "usually" se recusa a iniciar (não testei).
- 13 nomes de arquivo se repetem entre categorias com conteúdo diferente (accessibility-tester, context-manager, data-analyst, dependency-manager, devops-engineer, incident-responder, legal-advisor, payment-integration, performance-engineer, prompt-engineer, quant-analyst, security-engineer, test-automator). Como a instalação é plana, um sobrescreve o outro.
- `model` fora do padrão em 4 arquivos ("Claude Sonnet 4", "Claude Sonnet 4.5", "Claude Sonnet 4.5 (copilot)"): não são alias nem ID de modelo segundo a documentação.
- A regra do próprio component-reviewer (model obrigatório, sem caminho absoluto) não é cumprida: só 78 de 417 têm model, e 3 arquivos de obsidian-ops-team (connection-agent, metadata-agent, tag-agent) trazem `/Users/cam/VAULT01/...`.

### Times e orquestração

Times são pastas, não pacotes: não existe "instalar time". Subagentes podem criar subagentes por padrão, até três camadas abaixo da conversa principal; com `tools` explícita, só se `Agent` (ou o alias antigo `Task`, renomeado na v2.1.63) estiver na lista, e para limitar quais tipos um agente pode chamar usa-se `tools: Agent(worker, researcher), Read, Bash`.

- deep-research-team (15 agentes + agent-overview): orquestração real. research-orchestrator (tools Read, Write, Edit, Task, TodoWrite) conduz 6 fases (Query Analysis, Research Planning, Strategy Development, Parallel Research, Synthesis, Report Generation), com portão de qualidade, JSON de estado e TodoWrite; research-coordinator (Read, Write, Edit, Task) distribui tarefas. Mas o orquestrador cita research-supervisor e web-researcher, e o coordenador cita web-researcher, e nenhum dos dois existe na pasta. agent-overview.md fala em nove agentes quando a pasta tem quinze.
- Fora dele, os "orquestradores" não conseguem delegar: agent-organizer, error-coordinator, it-ops-orchestrator, multi-agent-coordinator, task-distributor, workflow-orchestrator, episode-orchestrator e project-supervisor-orchestrator não têm Agent nem Task. Os dois do podcast têm só Read e Write e mandam usar `call_agent`, que não existe no Claude Code.
- ui-analysis: três analisadores (UI, interação, negócio, só Read e TodoWrite), depois synthesizer e reviewer (com Write). Quem orquestra está fora da pasta: a skill skills/development/screenshot-feature-extractor (lança os 3 em paralelo com Task, depois o synthesizer e o reviewer) e o comando commands/utilities/screenshot-analyzer.
- ocr-extraction-team (7 agentes): a cadeia de 5 estágios (análise visual, comparação de texto, gramática, formatação em Markdown, garantia de qualidade) só aparece descrita no prompt de ocr-quality-assurance; os outros prompts não se referenciam. Dois agentes ficam fora da cadeia: document-structure-analyzer e ocr-preprocessing-optimizer.
- development-team (17 agentes): papéis que se citam por texto (backend-architect manda usar backend-developer para implementar), sem coordenador. code-architect, code-explorer e test-generator só leem; test-runner tem Bash.
- ffmpeg-clip-team (8): especialistas independentes, nenhum cita outro. Seis têm Bash e cinco citam FFmpeg; podcast-content-analyzer (só Read) e podcast-metadata-specialist (Read, Write) não usam.
- obsidian-ops-team (7 agentes): depende de um vault do autor e de scripts que a CLI não instala.
- mcp-dev-team (8): sem coordenação real; mcp-deployment-orchestrator é de deploy, não de orquestrar agentes.

### Para o seu stack (Java, Spring, Kubernetes, AWS, documentação)

- Java e Spring: spring-boot-engineer, java-architect (programming-languages), java-mcp-expert (web-tools, SDK oficial, Reactor e Spring Boot), kotlin-specialist, kotlin-mcp-expert (expert-advisors) e diffblue-cover (exige o MCP Diffblue Cover e faz commit sozinho). O exemplo da descrição de spring-boot-engineer cita tracing com Spring Cloud Sleuth; o README do projeto Sleuth diz que ele não funciona com Spring Boot 3.x em diante (migrou para Micrometer Tracing).
- Kubernetes: kubernetes-specialist (RBAC, network policies, autoscaling, GitOps com ArgoCD e Flux), sre-engineer, platform-engineer, deployment-engineer, terraform-engineer. platform-sre-kubernetes está na pasta security e usa tools do Copilot, então não resolve no Claude Code sem ajuste.
- AWS: nenhum agente dedicado (nenhum nome de arquivo com aws) contra 12 de Azure/Bicep. AWS aparece dentro de development-team/devops-engineer (26 ocorrências da palavra, sem distinguir caixa), devops-infrastructure/security-engineer (17), cloud-architect (7) e cloud-migration-specialist (4); nosql-specialist cita DynamoDB 12 vezes.
- Documentação: technical-writer, api-documenter, diagram-architect, changelog-generator, documentation-engineer, docusaurus-expert e, o mais bem construído, data-ai/adr-generator (tools Read, Grep, Glob, Edit, Write; confere docs/adr, numera o ADR e marca como Superseded o ADR substituído).

## As 28 categorias

Todos os caminhos abaixo ficam sob `cli-tool/components/agents/`. As quantidades são do catálogo (422).

### accessibility (1)
Acessibilidade web, com um agente de auditoria WCAG 2.2 híbrida. Há homônimos próximos em development-tools e web-tools.
- accessibility/accessibility-tester.md: audita componentes e fluxos contra WCAG 2.2 (ADA, Section 508, EAA) com varredura automática e checklist manual; descrição de 2.800 caracteres.
- web-tools/web-accessibility-checker.md: versão curta (1,4 KB, só leitura e escrita), mostra a sobreposição entre categorias.

### ai-specialists (8)
Arquitetura de LLM e RAG, prompts, avaliação, ética de IA e decomposição de tarefas. prompt-engineer repete o nome de data-ai/prompt-engineer, com conteúdo diferente (e é o de data-ai que falha no parse do frontmatter).
- ai-specialists/llm-architect.md: sistemas de LLM em produção (fine-tuning, RAG, inferência).
- ai-specialists/prompt-engineer.md: projeta, otimiza e avalia prompts.
- ai-specialists/task-decomposition-expert.md: quebra um objetivo em estrutura de trabalho com dependências; tools Read, Glob, Grep, WebSearch.
- ai-specialists/llms-maintainer.md: gera e mantém llms.txt (AEO); model haiku, maxTurns 50.

### api-graphql (6)
REST e GraphQL, desempenho e segurança, mais Shopify. Cinco dos seis usam `permissionMode: acceptEdits` (ignorado se empacotado como plugin). Prompts de 13 a 33 KB.
- api-graphql/api-designer.md: especificações e arquitetura de API.
- api-graphql/graphql-architect.md: schemas GraphQL, federation e microsserviços.
- api-graphql/graphql-performance-optimizer.md: N+1, cache, gargalos; prompt de 28 KB.
- api-graphql/shopify-expert.md: temas e apps Shopify (nicho, 32 KB).

### blockchain-web3 (4)
Contratos EVM/Solidity, DApps e carteiras. Nicho, mas separa auditar de desenhar.
- blockchain-web3/smart-contract-auditor.md: audita contratos existentes; não desenha nem implementa.
- blockchain-web3/smart-contract-specialist.md: arquitetura de proxy/upgrade e storage; sem Write nem Bash.
- blockchain-web3/web3-integration-specialist.md: front-ends Web3 e carteiras.

### business-marketing (21)
Produto, projeto, agile, vendas, SEO, jurídico e suporte. Seis agentes sem Write nem Bash (communication-excellence-coach, competitive-analyst, market-researcher, seo-specialist, trend-analyst, ux-researcher). legal-advisor tem cópia diferente em expert-advisors. vital-health-content-agent.md só existe em caminhos aninhados e não está no catálogo.
- business-marketing/scrum-master.md: planning, retrospectivas, impedimentos.
- business-marketing/communication-excellence-coach.md: revisa e-mails e apresentações; só Read, Glob, Grep.
- business-marketing/legal-advisor.md: privacidade, termos e GDPR/CCPA; aviso genérico, não aconselhamento jurídico.
- business-marketing/seo-specialist.md: auditoria técnica de SEO, palavras-chave e dados estruturados (útil para o blog).

### data-ai (40)
Categoria mal nomeada: mistura dados e ML (data-engineer, mlops-engineer, nlp-engineer) com 19 portes de chat modes do Copilot (prd, tdd-red, tdd-green, task-planner, Power BI, DBAs, .NET), cujas tools não existem no Claude Code.
- data-ai/adr-generator.md: formaliza decisão técnica em ADR, confere o repositório, numera em docs/adr/ e marca ADRs substituídos; model sonnet. Um dos melhores para documentação.
- data-ai/data-engineer.md: pipelines, dbt, ETL/ELT sobre Kafka e BigQuery.
- data-ai/tdd-red.md: escreve testes que falham a partir de uma issue; tools do Copilot.
- data-ai/neon-migration-specialist.md: migrações Postgres sem downtime com branches do Neon.

### database (11)
Relacional e NoSQL, Neon e Supabase. Quatro agentes de administração/otimização com nomes quase iguais (database-admin, database-administrator, database-optimization, database-optimizer); não comparei o conteúdo entre eles.
- database/postgres-pro.md: otimização, replicação e alta disponibilidade em PostgreSQL.
- database/database-architect.md: modelagem e escalabilidade para microsserviços; prompt de 29 KB.
- database/nosql-specialist.md: MongoDB, Redis e Cassandra; cita DynamoDB 12 vezes.
- database/supabase-schema-architect.md: schema, migração e RLS no Supabase.

### deep-research-team (16)
Time de pesquisa baseado na metodologia "Open Deep Research": 15 agentes mais agent-overview.md (documentação, sem frontmatter, 993 downloads). Único com orquestração real (ver "Times").
- deep-research-team/research-orchestrator.md: 6 fases com JSON de estado, portão de qualidade e TodoWrite.
- deep-research-team/query-clarifier.md: decide se a pergunta precisa de esclarecimento e devolve JSON com confiança.
- deep-research-team/fact-checker.md: verifica afirmações e credibilidade de fontes (útil para posts).
- deep-research-team/report-generator.md: transforma achados em relatório com citações; só Read, Write, Edit.

### development-team (17 no catálogo; mais flutter-ui-developer sem extensão)
Papéis de desenvolvimento (backend, frontend, mobile, UI, DevOps) e agentes de fluxo de funcionalidade (code-explorer, code-architect, test-generator, test-runner). A categoria mais baixada (137.480).
- development-team/backend-architect.md: arquitetura e design de API; a descrição manda usar backend-developer para implementar. Modelo de limite de escopo; 23.175 downloads.
- development-team/backend-developer.md: implementa APIs e microsserviços; cita backend-architect, devops-engineer, frontend-developer e mobile-developer.
- development-team/code-architect.md: lê padrões do código e entrega blueprint; só leitura.
- development-team/test-runner.md: executa testes, diagnostica falhas; leitura mais Bash.

### development-tools (35)
Revisão, depuração, refatoração, testes, dependências, dívida técnica e incidentes (pagerduty e rootly são portes do Copilot) e agentes do próprio projeto (command-expert, mcp-expert). Mistura estilos e tem homônimos.
- development-tools/code-reviewer.md: revisão de qualidade e segurança; 30.321 downloads, o segundo mais baixado.
- development-tools/debugger.md: causa raiz de bugs; model claude-sonnet-4-5.
- development-tools/error-detective.md: correlaciona erros entre serviços.
- development-tools/unused-code-cleaner.md: remove imports, funções e classes não usados; tem Write e Bash, convém rodar com git limpo.

### devops-infrastructure (40)
Kubernetes, Terraform, SRE, incidentes, CI/CD e muito Azure (12 agentes Azure/Bicep/Terraform-Azure, vários portes do Copilot com tools `azure-mcp/*`). Sem agente dedicado a AWS.
- devops-infrastructure/kubernetes-specialist.md: clusters e cargas K8s (RBAC, network policies, autoscaling, GitOps); Read, Write, Edit, Bash, Glob, Grep.
- devops-infrastructure/terraform-engineer.md: IaC multi-cloud e módulos (há também terraform-specialist, terragrunt-expert e variantes Azure).
- devops-infrastructure/sre-engineer.md: SLOs, orçamento de erro, automação de confiabilidade.
- devops-infrastructure/cloud-architect.md: arquitetura de nuvem e multi-cloud; cita AWS 7 vezes.

### documentation (11)
Documentação técnica, API, diagramas, changelog, Docusaurus e Microsoft Learn; mistura agentes completos com chat modes do Copilot (context7, se-technical-writer, tech-debt-remediation-plan).
- documentation/technical-writer.md: referências de API, guias e SDK; estilo VoltAgent com JSON de progresso fictício.
- documentation/api-documenter.md: OpenAPI, portais e exemplos de código.
- documentation/diagram-architect.md: diagramas em ASCII, Mermaid, PlantUML e Draw.io.
- documentation/changelog-generator.md: changelog e notas de versão a partir do histórico git.

### expert-advisors (52)
A maior e mais heterogênea: meta-orquestração estilo VoltAgent sem ferramenta de delegação (agent-organizer, multi-agent-coordinator, task-distributor, workflow-orchestrator), 27 portes do Copilot (planner, plan, janitor, mentor, debug), "MCP experts" por linguagem, .NET, Power BI e personas (gilfoyle, *-beast-mode).
- expert-advisors/agent-organizer.md: monta times multiagente; tools Read, Write, Edit, Glob, Grep, ou seja, só planeja.
- expert-advisors/planner.md: plano de implementação sem editar código; 840 bytes, tools do Copilot.
- expert-advisors/agent-installer.md: lista e instala agentes do VoltAgent via curl; risco de cadeia de suprimentos.
- expert-advisors/architect-review.md: revisão arquitetural; name é architect-reviewer e não declara tools.

### ffmpeg-clip-team (8)
Especialistas de áudio, vídeo e podcast, independentes, sem orquestrador. Prompts de 1 a 4 KB.
- ffmpeg-clip-team/video-editor.md: cortes, transições e montagem; 1,2 KB, Bash, Read, Write.
- ffmpeg-clip-team/podcast-transcriber.md: transcrição com falantes e timestamps.
- ffmpeg-clip-team/timestamp-precision-specialist.md: cortes frame a frame, fala e silêncio.
- ffmpeg-clip-team/podcast-content-analyzer.md: pontua trechos por potencial viral; só Read.

### finance (5)
Fintech, pagamentos, quant e risco. bettoredge-value-finder depende de um MCP de apostas (`mcp__bettoredge__*`) e traz author e version próprios; fora de escopo.
- finance/fintech-engineer.md: pagamentos e integrações financeiras.
- finance/payment-integration.md: gateways e PCI; versão longa (9,6 KB) do homônimo de business-marketing (1,2 KB).
- finance/risk-manager.md: riscos financeiros, operacionais e regulatórios.
- finance/bettoredge-value-finder.md: apostas +EV com critério de Kelly; promove produto de terceiro.

### game-development (5)
Design, Unity, Unreal e arte 3D. Sem relação com seu stack.
- game-development/game-developer.md: sistemas de jogo, renderização e rede.
- game-development/unity-game-developer.md: C#, 3D e otimização mobile.
- game-development/unreal-engine-developer.md: C++ e Blueprints.
- game-development/game-designer.md: mecânicas e balanceamento; 1,2 KB, Read, Write, Edit.

### git (3)
Fluxo de git. commit-guardian não tem frontmatter e cita pm-workspace como origem; git-flow-manager contém `git push` (11 ocorrências) e executa operações de branch.
- git/git-flow-manager.md: Git Flow (feature, release, hotfix), merge e PRs.
- git/git-workflow-manager.md: estratégias de branching e merge.
- git/commit-guardian.md: 10 verificações antes do commit; proíbe push e `--no-verify`; sem frontmatter, não é subagente válido como está.

### mcp-dev-team (8)
Construir, testar, proteger e implantar servidores MCP. Sem coordenação real.
- mcp-dev-team/mcp-server-architect.md: transportes, definição de tools e implementação.
- mcp-dev-team/mcp-security-auditor.md: segurança, OAuth e RBAC.
- mcp-dev-team/mcp-testing-engineer.md: conformidade, segurança e desempenho.
- mcp-dev-team/mcp-deployment-orchestrator.md: contêineres, Kubernetes, autoscaling e monitoramento (deploy, não orquestração de agentes).

### modernization (3)
Migração de legados, decomposição de monólitos e nuvem. (Há outro, "modernization", em expert-advisors, versão Copilot de 26 KB.)
- modernization/legacy-modernizer.md: migração incremental e mitigação de risco.
- modernization/architecture-modernizer.md: monólito para microsserviços e eventos.
- modernization/cloud-migration-specialist.md: on-premise para nuvem; menciona AWS 4 vezes.

### obsidian-ops-team (7 agentes, mais 10 scripts .py)
Manter um vault do Obsidian (MOCs, tags, metadados, links, revisão, otimização). Três prompts apontam para `/Users/cam/VAULT01/...` e os scripts da pasta Scripts/ não são instalados pela CLI.
- obsidian-ops-team/moc-agent.md: cria e atualiza Maps of Content; chama ./System_Files/Scripts/moc_generator.py se existir.
- obsidian-ops-team/tag-agent.md: normaliza tags; caminho absoluto pessoal.
- obsidian-ops-team/connection-agent.md: sugere links e acha notas órfãs.
- obsidian-ops-team/review-agent.md: controle de qualidade com Read, Grep, LS.

### ocr-extraction-team (7)
Correção de OCR. A cadeia de cinco estágios só está descrita no prompt de ocr-quality-assurance; document-structure-analyzer e ocr-preprocessing-optimizer ficam fora dela. Sem orquestrador.
- ocr-extraction-team/visual-analysis-ocr.md: extrai texto de imagens preservando estrutura.
- ocr-extraction-team/ocr-grammar-fixer.md: corrige erros de reconhecimento e gramática.
- ocr-extraction-team/markdown-syntax-formatter.md: converte texto em Markdown consistente.
- ocr-extraction-team/ocr-quality-assurance.md: quinto e último estágio, valida contra a imagem original.

### performance-testing (5)
Carga, Web Vitals e React. Prompts curtos (1 a 2 KB). performance-engineer e test-automator repetem nomes de development-tools.
- performance-testing/load-testing-specialist.md: cenários de carga e estresse.
- performance-testing/web-vitals-optimizer.md: LCP, FID e CLS.
- performance-testing/performance-engineer.md: profiling, cache e CDN; 1,1 KB, colide com development-tools/performance-engineer (9 KB).
- performance-testing/react-performance-optimization.md: renderização e bundle em React.

### podcast-creator-team (11)
Produção de podcast. Os dois "orquestradores" só têm Read e Write e mandam usar `call_agent`, que não existe no Claude Code. Inclui twitter-ai-influencer-manager (engajamento em rede social).
- podcast-creator-team/episode-orchestrator.md: valida o payload e despacha sequência via call_agent; na prática decorativo.
- podcast-creator-team/podcast-trend-scout.md: tendências com WebSearch.
- podcast-creator-team/seo-podcast-optimizer.md: títulos, meta descrições e palavras-chave.
- podcast-creator-team/guest-outreach-coordinator.md: pesquisa de convidados e modelos de contato.

### programming-languages (50)
Especialistas por linguagem e framework. README.md da pasta conta como agente no catálogo, mas é catálogo em texto. Predomina o estilo VoltAgent; vários portes do Copilot (CSharpExpert, rust-gpt-4.1-beast-mode) e agentes que exigem MCP externo (diffblue-cover). Tem os agentes de Java e Spring.
- programming-languages/spring-boot-engineer.md: Spring Boot 3+, microsserviços, WebFlux, Spring Cloud, Security/OAuth2, GraalVM, Testcontainers; cópia do VoltAgent com descrição expandida.
- programming-languages/java-architect.md: arquitetura Java 17+ (DDD, hexagonal, CQRS), Maven/Gradle, JMH, SonarQube, Flyway, Micrometer.
- programming-languages/kotlin-specialist.md: Kotlin para Android e JVM, corrotinas.
- programming-languages/diffblue-cover.md: testes unitários Java via MCP Diffblue Cover (tools `DiffblueCover/*`) e commit automático ao final.

### realtime (2)
WebSockets e Supabase Realtime.
- realtime/websocket-engineer.md: funcionalidades bidirecionais com WebSockets e Socket.IO.
- realtime/supabase-realtime-optimizer.md: otimiza assinaturas realtime do Supabase.

### security (25)
Auditoria, pentest, conformidade, supply chain e agentes de fornecedores (Dynatrace, JFrog, StackHawk, Elasticsearch, Comet Opik), que dependem de MCPs ou contas do fornecedor. Só 4 declaram tools de leitura pura (ad-security-reviewer, compliance-auditor, read-only-auditor, security-auditor). Nove só têm tools do Copilot. Itens fora de lugar: terraform, tdd-refactor, github-actions-expert e platform-sre-kubernetes. supply-chain-security não tem frontmatter.
- security/read-only-auditor.md: tools Read, Grep, Glob mais hooks PreToolUse no frontmatter; a garantia real vem da lista de tools (ver "Cuidados").
- security/security-auditor.md: auditoria e conformidade sem escrita.
- security/repo-publication-auditor.md: revisa o repositório antes de ele virar público (segredos, histórico, licença); útil para o claude-code-kit.
- security/penetration-tester.md: pentest autorizado com exploração ativa (tem Bash); usar só com escopo claro.

### ui-analysis (5)
Pipeline de análise de screenshots: analisadores de UI, interação e negócio, depois synthesizer e reviewer. As descrições dizem o que o agente faz, mas não "quando usar", então a delegação automática é fraca; a orquestração está na skill screenshot-feature-extractor e no comando screenshot-analyzer.
- ui-analysis/screenshot-ui-analyzer.md: componentes visuais, layout e padrões de design.
- ui-analysis/screenshot-interaction-analyzer.md: fluxos de interação e transições de estado.
- ui-analysis/screenshot-synthesizer.md: junta três JSONs em lista de funcionalidades e tarefas sem repetir itens.
- ui-analysis/screenshot-reviewer.md: revisa a lista sintetizada.

### web-tools (16)
Front-end e web (React/Next.js, acessibilidade, SEO, i18n, WordPress, AEM), utilitários de URL e java-mcp-expert (fora de programming-languages). Sete só têm tools do Copilot.
- web-tools/java-mcp-expert.md: servidores MCP em Java com SDK oficial, Reactor e Spring Boot.
- web-tools/seo-analyzer.md: auditoria técnica de SEO; 1,4 KB.
- web-tools/url-link-extractor.md: extrai e cataloga URLs no código do site.
- web-tools/search-ai-optimization-expert.md: SEO, AEO e GEO; só leitura e web.

## O que vale aproveitar

1. Descrição com limite claro de escopo (modelo backend-architect). A descrição diz "para design use este; para escrever código use o backend-developer", o que reduz delegação errada. Seus agentes critico, pesquisador e revisor já trazem gatilho explícito ("Use quando a pessoa pedir..."); vale virar regra do kit. Esforço baixo. Cuidado: o repositório não segue o próprio padrão (159 descrições acima de 1.500 caracteres); copie a ideia, não os blocos de exemplo longos.
2. Agente somente leitura por lista de tools (security-auditor e read-only-auditor: `tools: Read, Grep, Glob`). É a garantia dura e o melhor trecho de post sobre agentes. Para reforçar com hook, o comando precisa sair com código 2; o read-only-auditor do repositório usa `exit 1`, que não bloqueia. Esforço baixo. Cuidado: `hooks` é ignorado em agente empacotado como plugin; no marketplace use hooks/hooks.json do plugin ou instale o agente em `.claude/agents/`.
3. adr-generator como base de um agente de ADR em português. Tools mínimas, exige confirmar fatos no repositório, numera ADRs e atualiza os substituídos. Esforço baixo. Cuidado: origem e licença do arquivo não verificadas (o catálogo deixa license e author vazios); reescreva com sua estrutura em vez de copiar.
4. Validação automática de componentes. O repositório tem scripts/validate_components.py, que copia agentes para um plugin temporário e roda `claude plugin validate`, usado em .github/workflows/component-validate.yml (PR bloqueia; varredura semanal só relata, porque o catálogo "still has known errors"). O comando existe na sua versão (2.1.289). Esforço médio. Cuidado: o validador só pegou 1 problema em 417 arquivos; não vê tools do Copilot, model fora do padrão, nomes duplicados nem caminhos pessoais. Some a ele um script próprio e, se quiser, um agente revisor nos moldes do component-reviewer do repositório (valida nome em kebab-case, campos e caminhos absolutos).
5. Curadoria mínima para Java, Spring, Kubernetes e documentação: 5 a 8 agentes (spring-boot-engineer, java-architect, kubernetes-specialist, technical-writer, adr-generator, diagram-architect) em vez de espelhar 422 arquivos. Esforço médio. Cuidado: remover "Query context manager", JSON de progresso fictício e referências a agentes que ninguém instalou; trocar Spring Cloud Sleuth por Micrometer Tracing; tirar Write e Bash de quem só aconselha; preservar o aviso MIT do VoltAgent (spring-boot-engineer é cópia dele e o README do repositório não o cita).
6. Time orquestrado de verdade. deep-research-team é o único com fases, portão de qualidade e estado. Em um plugin, o desenho funciona assim: um agente coordenador com `Agent(...)` na lista de tools rodando como sessão principal (`claude --agent`), ou uma skill que lança os subagentes com Task, como a screenshot-feature-extractor. Esforço alto. Cuidado: o original cita agentes que não existem (research-supervisor, web-researcher).
7. Agente próprio de AWS (lacuna do catálogo). Há 12 de Azure e nenhum de AWS; um "aws-arquiteto" consultivo (Well-Architected, IAM de menor privilégio, EKS) cobre a sua área. Esforço médio. Cuidado: escrever do zero, em modo só leitura, e revisar o conteúdo porque AWS muda rápido.
8. Metadados por componente (licença, autor, origem, validação). O catálogo tem esses campos, mas vazios. Preencher no marketplace do kit e incluir uma linha de origem, como faz commit-guardian ("Source: pm-workspace"). Esforço baixo. Cuidado: só vale se for preenchido; campo vazio dá falsa sensação de controle.

## Cuidados

- Pesquisa somente leitura: nada foi clonado, instalado ou executado do repositório (nem a CLI). A única execução foi o `claude plugin validate` local, em uma cópia temporária dos arquivos de agente, que foi apagada.
- Números informados pelo site ou repositório em 04/10/2026: aitmpl.com/agents diz "600+ AI Agents" e o CLAUDE.md diz "Agents (600+)"; o catálogo e counts.json têm 422. A página do GitHub mostra 32,4 mil estrelas e 3,7 mil forks. Downloads por agente vêm de docs/components.json.
- Documentação oficial: campos, prioridades, `Agent`/`Task`, três camadas de aninhamento, aviso de 15.000 tokens, lista YAML em `tools` e agentes de plugin que ignoram hooks, mcpServers e permissionMode foram conferidos no Markdown cru de code.claude.com/docs/en/sub-agents. O comportamento "falha ao iniciar quando nenhuma tool resolve" está descrito como "usually"; não testei.
- Instalação: baixa de raw.githubusercontent.com na branch main, sem versão fixada nem checksum; grava em `.claude/agents/<nome>.md` e sobrescreve sem perguntar; ignora a categoria. 13 nomes de arquivo colidem na pasta única. Telemetria ligada por padrão (desliga com `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`) e não documentada nos READMEs.
- Read-only por hook: o hook de read-only-auditor termina com `exit 1`. Segundo a referência de hooks, `exit 1` é erro não bloqueante e a ação segue; só `exit 2` bloqueia. A proteção efetiva do agente é a lista `tools: Read, Grep, Glob`.
- Inconsistências do catálogo: README.md e agent-overview.md contam como agentes; commit-guardian, sdd-spec-writer e supply-chain-security não têm frontmatter (o modelo do CONTRIBUTING.md também não mostra frontmatter, ao contrário do que o component-reviewer exige); flutter-ui-developer não tem `.md` e a CLI recebe 404; vital-health-content-agent.md só existe em caminhos aninhados e o caminho canônico dá 404.
- 79 agentes só declaram tools que não existem no Claude Code (Copilot e MCPs do Azure) e 11 misturam; 4 usam nomes de modelo fora do padrão; 1 não parseia (data-ai/prompt-engineer.md); outros 19 não passam em um parser YAML estrito, mas o validador do Claude Code os aceita (comportamento em execução não testado).
- Orquestração: oito agentes com nome de orquestrador ou coordenador não têm Agent nem Task; os dois do podcast mandam usar `call_agent`, inexistente. Em deep-research-team há referências a research-supervisor e web-researcher, que não existem.
- Peso de contexto: 159 descrições passam de 1.500 caracteres e o total passa de 535 mil (cerca de 134 mil tokens por estimativa de 4 caracteres por token). Instalar tudo estoura o limite de 15.000 tokens do aviso oficial.
- Conteúdo desatualizado ou fictício: o exemplo de spring-boot-engineer cita Spring Cloud Sleuth, que o README do projeto diz não funcionar com Spring Boot 3.x; 89 prompts mandam "Query context manager" e mostram JSON de progresso com números inventados.
- Segurança e cadeia de suprimentos: agent-installer manda baixar agentes do VoltAgent com curl; meta-agentic-project-scaffold manda puxar arquivos de github/awesome-copilot; droid.md documenta `curl -fsSL https://app.factory.ai/cli | sh`; diffblue-cover faz commit automático; git-flow-manager executa `git push`. Cerca de 47 agentes declaram tools de MCP de fornecedores (Dynatrace, JFrog, StackHawk, LaunchDarkly, Elastic, Neon, Azure, BettorEdge). `security.validated` é false nos 422. Não achei chaves de API reais; os caminhos pessoais são 3 arquivos de obsidian-ops-team com `/Users/cam/VAULT01`.
- Licença e atribuição: o repositório é MIT (Daniel Ávila). VoltAgent/awesome-claude-code-subagents, github/awesome-copilot e gonzalezpazmonica/pm-workspace também são MIT, o que exige manter o aviso. A seção Attribution do README lista K-Dense, anthropics, obra/superpowers, alirezarezvani, wshobson e outros, mas não VoltAgent nem awesome-copilot, embora o corpo de spring-boot-engineer seja idêntico ao do VoltAgent. A origem dos demais agentes "estilo VoltAgent" foi inferida pelo padrão do texto: não verificada arquivo a arquivo.
- Texto lido que tentou dar ordens: os arquivos de agente são prompts imperativos (ex.: meta-agentic-project-scaffold diz "Your sole task is to find and pull relevant prompts..."). Foram tratados como dado, nunca executados.
- Seus agentes do kit (agents/critico.md, agents/pesquisador.md, plugins/exemplos/agents/revisor.md) declaram `tools:` como lista YAML, formato aceito pela documentação.
- Categorias com nome enganoso: data-ai (19 portes gerais do Copilot), expert-advisors (saco de gatos de 52), security (inclui terraform, tdd-refactor, github-actions-expert e platform-sre-kubernetes), web-tools (inclui java-mcp-expert), ffmpeg-clip-team (parte do time não usa FFmpeg). Não confie no nome da pasta para decidir o que aproveitar.

## Fontes

- /private/tmp/claude-1068948898/-Users-cesar-schutz-Downloads-claude-code-kit/5f901f11-25f6-40d4-85ad-3af709ec508c/scratchpad/tree.json (12.191 arquivos; contagens por categoria e tamanhos)
- docs/components.json e dashboard/public/counts.json (davila7/claude-code-templates; 422 agentes, downloads, campos license/author/repo/security)
- cli-tool/src/index.js (installIndividualAgent, linhas 482 a 549; instalação de configurações e hooks com confirmação), cli-tool/src/tracking-service.js, cli-tool/bin/create-claude-config.js (flags --agent, --agents, --teams, --workflow)
- README.md (inclui Attribution), cli-tool/README.md, CLAUDE.md, CONTRIBUTING.md, LICENSE (davila7/claude-code-templates)
- .claude/agents/component-reviewer.md; scripts/generate_agents_api.py; scripts/validate_components.py; .github/workflows/component-validate.yml; .github/workflows/component-security-validation.yml
- cli-tool/docs_to_claude/SUBAGENTS_GUIDE.md
- cli-tool/components/skills/development/screenshot-feature-extractor/SKILL.md e cli-tool/components/commands/utilities/screenshot-analyzer.md
- Arquivos de agente lidos inteiros ou por varredura completa dos 422 do catálogo: programming-languages/spring-boot-engineer.md, java-architect.md, diffblue-cover.md; devops-infrastructure/kubernetes-specialist.md; documentation/technical-writer.md; data-ai/adr-generator.md; development-team/backend-architect.md; deep-research-team/research-orchestrator.md, research-coordinator.md, agent-overview.md; security/read-only-auditor.md; git/commit-guardian.md; podcast-creator-team/episode-orchestrator.md, project-supervisor-orchestrator.md; expert-advisors/agent-installer.md, meta-agentic-project-scaffold.md, droid.md; ocr-extraction-team/ocr-quality-assurance.md; ui-analysis/screenshot-synthesizer.md; ffmpeg-clip-team (os 8); web-tools/java-mcp-expert.md; obsidian-ops-team/moc-agent.md
- https://code.claude.com/docs/en/sub-agents.md (Markdown cru) e a referência de hooks (code.claude.com/docs/en/hooks, cópia em Markdown no scratchpad, f10_hooks.md); referência de manifesto de plugin (cópia no scratchpad, docs_plugref.md)
- https://www.aitmpl.com/agents e https://github.com/davila7/claude-code-templates (WebFetch)
- https://github.com/spring-cloud/spring-cloud-sleuth (README) e https://github.com/micrometer-metrics/tracing/wiki/Spring-Cloud-Sleuth-3.1-Migration-Guide (WebFetch)
- VoltAgent/awesome-claude-code-subagents (categories/02-language-specialists/spring-boot-engineer.md e LICENSE), github/awesome-copilot (LICENSE), gonzalezpazmonica/pm-workspace (LICENSE), via raw.githubusercontent.com
- `claude plugin validate` do Claude Code 2.1.289, executado localmente sobre cópia temporária (apagada)
- /Users/cesar.schutz/Downloads/claude-code-kit/agents/critico.md, agents/pesquisador.md e plugins/exemplos/agents/revisor.md (somente leitura)

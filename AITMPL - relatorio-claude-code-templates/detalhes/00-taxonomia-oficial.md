# 00 · O MAPA OFICIAL de tudo o que se pode usar, estender e configurar no Claude Code

Lido em 04/10/2026, com o Claude Code atual na 2.1.289 (03/10/2026). Fontes: a documentação em code.claude.com/docs (o índice llms.txt, com 220 páginas em inglês, e 94 páginas lidas em Markdown bruto, mais 11 resumos semanais do What's new), o CHANGELOG do repositório anthropics/claude-code, os GitHub Releases e o registro do npm para as datas das versões. O repositório davila7/claude-code-templates não entrou nesta frente.

## Explicação

### O que é este mapa

É a lista do que o Claude Code oferece hoje para ser usado, estendido e configurado, organizada em oito famílias, com 130 peças. Cada peça traz o que é, desde quando existe, a página oficial e se dá para entregá-la dentro de um plugin. A última coluna é a que decide o que o claude-code-kit pode distribuir.

Sobre as datas: valem os GitHub Releases quando existem (a partir da 2.0.74); onde não existem (antes da 2.0.74, na série 0.2.x e nas versões 2.1.18 e 2.1.243), vale a publicação no npm (UTC); na 2.1.46, que não está no npm, vale o CHANGELOG. Uma versão pode aparecer com um dia de diferença entre as fontes, conforme o fuso. "Primeira menção" significa a primeira entrada do CHANGELOG que cita a peça, não a data de lançamento. O CHANGELOG não cobre o que veio antes da 0.2.x.

### Como as peças se encaixam

A página "Extend Claude Code" (features-overview) organiza o que se pode estender por papel: o que o Claude **sabe** (CLAUDE.md, `.claude/rules/`, memória automática, estilos de saída, skills), o que ele **alcança** (MCP, servidores de linguagem, Chrome, computer use), o que **roda sem ele decidir** (hooks, monitores, agendamentos, CI) e a quem ele **delega** (subagentes, workflows dinâmicos, equipes, worktrees, mensagens entre sessões). Plugins e marketplaces são a camada de embalagem por cima.

Custo de contexto, segundo a mesma página:

- CLAUDE.md e estilo de saída entram em toda requisição (a doc recomenda CLAUDE.md abaixo de 200 linhas);
- skills: só nome e descrição ficam sempre; o corpo carrega quando a skill é usada;
- MCP: nomes das ferramentas no começo, esquemas sob demanda (a busca de ferramentas vem ligada por padrão);
- subagentes rodam em contexto isolado; hooks custam zero, salvo se devolverem texto.

A distinção que a doc repete: instrução (CLAUDE.md, skill, estilo) é um pedido; garantia é hook ou regra de permissão.

### As oito famílias

| Família | Peças | Exemplos |
| :- | :- | :- |
| 1. Instruções e memória | 12 | CLAUDE.md, rules, AGENTS.md, memória automática, skills, estilos de saída |
| 2. Ferramentas externas | 14 | MCP, channels, LSP, Chrome, computer use, Artifacts, 46 ferramentas internas |
| 3. Automação | 14 | 33 eventos de hook, monitores, /loop, rotinas, /goal, claude -p, Agent SDK, CI |
| 4. Delegação | 11 | subagentes, workflows dinâmicos, equipes, agent view, worktrees, mensagens entre sessões |
| 5. Aparência e interface | 12 | statusLine, temas, keybindings, spinner, fullscreen, voz, mods |
| 6. Empacotamento e distribuição | 15 | plugins, marketplaces, fontes, dependências, userConfig, bin/, evals |
| 7. Segurança e permissões | 16 | regras allow/ask/deny, modos, auto mode, sandbox, configurações gerenciadas |
| 8. Execução e ambiente | 36 | settings, variáveis de ambiente, CLI, 119 comandos de barra, nuvem, Desktop, provedores |

### O que cabe dentro de um plugin

Confirmado em manifest-reference, components e marketplace-reference:

- **Entram:** skills, commands (formato legado), agents, hooks, servidores MCP (inclusive pacotes `.mcpb` e `.dxt`), servidores LSP, estilos de saída, workflows, executáveis em `bin/`, temas, monitores e evals (estes três sob `experimental`), `userConfig`, `channels`, `dependencies`, um `settings.json` e mods.
- **Entram com limite:** agentes de plugin ignoram `permissionMode`, `hooks`, `mcpServers` e `initialPrompt`; o `settings.json` do plugin só aplica `agent` e `subagentStatusLine`; channels exigem `--channels` e liberação do administrador; plugin com `bin/` não é instalado por claude.ai e Cowork.
- **Não entram:** CLAUDE.md na raiz do plugin (não é carregado; o `validate` avisa), `.claude/rules/`, memória, `permissions`, `statusLine`, `env`, `keybindings`, sandbox, spinner, modelo e esforço globais, `/loop` e rotinas. Para essas, o plugin só empurra o efeito: uma skill para instrução, um hook ou mod para garantia.

Só `name` é obrigatório no `plugin.json`, e o próprio manifesto é opcional. Campo desconhecido no topo é descartado com aviso; dentro de `userConfig`, `channels`, `lspServers` e `monitors` o plugin deixa de carregar. `claude plugin validate` é o árbitro.

### Mods

Um mod é um plugin cujo `hooks/hooks.json` tem a chave `modules`, um array com um caminho relativo para um arquivo JavaScript ou TypeScript que exporta `register(on, options)`. Roda dentro do Claude Code (2.1.287 em diante, 01/10/2026, ligado por padrão): desenha painéis ao lado da conversa, uma faixa acima do prompt e uma linha de dica sob o prompt, altera o spinner e as linhas de ferramenta, intercepta chamadas e adiciona comandos e ferramentas. `modules` não é campo do `plugin.json`; o manifesto só ganha `types`, que aponta um `.d.ts`. Desenhar funciona no terminal (inclusive o integrado de um editor e o plugin do JetBrains) e na aba Code do Desktop, menos em sessões WSL; no VS Code, em `claude -p` e no SDK só os hooks rodam. Seis mods vêm embutidos: `cc-plugin-agents-md`, `cc-plugin-diff`, `cc-plugin-plugin-authoring`, `cc-plugin-sec-default`, `cc-plugin-telemetry` e `cc-plugin-you-should-know` (este desligado por padrão).

### O que mudou há pouco

- 2.1.287 (01/10/2026): mods. 2.1.288 (02/10): `claude project purge` virou `claude purge`.
- Auto mode: desde 14/08/2026 é o modo padrão de novas sessões nos planos Pro, Max e Team (semana 32); na 2.1.283 (25/09/2026), sessões interativas em provedores de terceiros ou com telemetria desligada passaram a começar em auto mode quando nenhum modo está configurado, e `permissions.defaultMode` continua mandando.
- 2.1.277 (18/09): AGENTS.md. 2.1.269 (11/09): `claude plugin eval`.
- 2.1.229 (12/08) e 2.1.224 (07/08): fontes de plugin `command` e `archive`; mensagens entre sessões.
- 2.1.222 (04/08): o `/ultraplan` foi removido; o modo plan o substitui.
- 2.1.157 (29/05): plugins em `.claude/skills` carregam sozinhos e `claude plugin init` cria o esqueleto. 2.1.154 (28/05): workflows dinâmicos e `defaultEnabled`.
- 2.1.129 (06/05): `themes` e `monitors` do manifesto migram para `experimental`.
- Nomes de plugin que começam com `claude-`, `anthropic-`, `anthropics-` ou `cc-plugin-` são reservados: o `validate` dá erro.

### O que é bom

- A documentação é completa e em camadas, com tabelas de custo de contexto e de precedência.
- `claude plugin validate`, `test` e `eval` dão verificação de verdade antes de publicar.
- Dependências com semver, `userConfig` com valores sensíveis no cofre do sistema e telemetria de uso por plugin.

### O que preocupa

- Ritmo: três ou quatro versões por semana; o que está escrito hoje pode mudar na próxima.
- Muita coisa está em research preview, beta ou experimental (rotinas, agent view, channels, equipes de agentes, advisor, computer use, fullscreen, hooks do tipo agent).
- Plugin executa código com os privilégios de quem instala (hooks, MCP, `bin/`, mods), fora do sandbox; mod pode até aprovar chamadas de ferramenta.
- O que mais se quer entregar (permissões, statusLine, CLAUDE.md, keybindings) justamente não cabe em plugin.

## Famílias

Cada tabela traz: peça, o que é, desde, URL oficial e se é distribuível por plugin (com o como, quando houver).

### 1. Instruções e memória

**Quantidade:** 12 peças. **Exemplos:** CLAUDE.md, `.claude/rules/`, AGENTS.md, memória automática, skills (SKILL.md), estilos de saída. **Distribuíveis por plugin:** skills, comandos, estilos de saída e a memória de subagente; o resto é do usuário, do projeto ou da organização.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **CLAUDE.md (gerenciado, usuário, projeto e local)** | Arquivo Markdown de instruções persistentes, carregado no início de toda sessão, em quatro escopos: política gerenciada, ~/.claude/CLAUDE.md, ./CLAUDE.md ou ./.claude/CLAUDE.md e ./CLAUDE.local.md. A doc recomenda menos de 200 linhas por arquivo. | Anterior ao CHANGELOG (que começa na 0.2.x); não verificado quando surgiu | https://code.claude.com/docs/en/memory | Não — um CLAUDE.md na raiz do plugin não é carregado e o validate avisa; ponha as instruções numa skill. A organização pode injetar texto pela setting claudeMd, só em configurações gerenciadas. |
| **Imports @caminho dentro do CLAUDE.md** | Sintaxe @path/arquivo.md que expande outros arquivos no contexto na largada, com no máximo quatro saltos. | 0.2.107 (09/05/2025) | https://code.claude.com/docs/en/memory | Não |
| **.claude/rules/ com paths:** | Arquivos de regra por tema que carregam sempre ou só quando se abrem arquivos que casam com o glob de paths no frontmatter. | 2.0.64 (10/12/2025); paths aceita lista YAML desde a 2.1.84 (26/03/2026) | https://code.claude.com/docs/en/memory | Não — a documentação não lista rules/ entre os componentes de plugin; skills aceitam paths: no frontmatter para ativação condicional. |
| **AGENTS.md** | O Claude Code lê AGENTS.md como instruções do projeto. Por padrão só lê quando não há CLAUDE.md nem CLAUDE.local.md no diretório de trabalho ou acima; a opção Project instructions (instructionFiles) permite ler os dois juntos. É implementado pelo mod embutido cc-plugin-agents-md. | 2.1.277 (18/09/2026); estendido a Bedrock, Vertex, Foundry, gateways e sessões sem telemetria na 2.1.281 (23/09/2026) | https://code.claude.com/docs/en/memory | Não |
| **Memória automática (MEMORY.md)** | Notas que o Claude grava sozinho em ~/.claude/projects/<projeto>/memory/, com um índice MEMORY.md (primeiras 200 linhas ou 25KB) carregado em toda sessão. | 2.1.59 (26/02/2026); autoMemoryDirectory na 2.1.74 (12/03/2026) | https://code.claude.com/docs/en/memory | Não |
| **Memória própria de subagente (memory:)** | Campo de frontmatter de agente, com escopo user, project ou local, que dá ao subagente um diretório de memória persistente. | 2.1.33 (06/02/2026) | https://code.claude.com/docs/en/sub-agents | Sim — o campo memory está entre os suportados em agentes de plugin. |
| **/memory, /init e /doctor prompt-audit** | /memory lista e abre os arquivos de memória e liga a memória automática; /init gera um CLAUDE.md inicial (com CLAUDE_CODE_NEW_INIT=1 vira um fluxo interativo que também propõe skills e hooks); /doctor prompt-audit audita CLAUDE.md, AGENTS.md, regras, skills, comandos, subagentes e estilos. | /memory: primeira menção 1.0.94 (27/08/2025); /init e prompt-audit: não verificado | https://code.claude.com/docs/en/memory | Não |
| **Skills (SKILL.md)** | Pasta com SKILL.md (e arquivos de apoio) cujo nome e descrição ficam no contexto e cujo corpo carrega quando o usuário digita /nome ou a tarefa casa com a descrição. Frontmatter: name, description, when_to_use, argument-hint, arguments, disable-model-invocation, user-invocable, allowed-tools, disallowed-tools, model, effort, context, agent, background, hooks, paths e shell. | 2.0.20 (16/10/2025) | https://code.claude.com/docs/en/skills | Sim — skills/<nome>/SKILL.md; comando /plugin:nome; o campo skills do manifesto soma ao diretório skills/; um SKILL.md na raiz de um plugin sem skills/ vira uma skill única. |
| **Comandos personalizados (.claude/commands/ e commands/)** | Arquivos Markdown únicos que viram /comando; formato antigo, substituído por skills, mas ainda aceito com o mesmo frontmatter. | 0.2.31 (05/03/2025) | https://code.claude.com/docs/en/skills | Sim — commands/ ou campo commands (caminho, lista ou mapa com source ou content); a doc manda preferir skills em plugins novos. |
| **Skills empacotadas** | Cerca de 20 skills baseadas em prompt que já vêm em toda sessão e aparecem marcadas como Skill na tabela de comandos: /batch, /code-review, /debug, /doctor, /loop, /simplify, /run, /verify, /run-skill-generator, /claude-api, /claude-in-chrome, /update-config, /fewer-permission-prompts, /workflow-authoring, /design, /design-sync, /slides, /dataviz, /artifact-capabilities e /artifact-diagramming. Podem ser desligadas com disableBundledSkills. | /debug 2.1.30 (03/02/2026); /simplify e /batch 2.1.63 (28/02/2026); /simplify virou /code-review na 2.1.147 (21/05/2026) | https://code.claude.com/docs/en/skills | Não |
| **Estilos de saída (output styles)** | Instruções que fixam papel, tom e formato das respostas da sessão; embutidos Default, Proactive, Concise, Explanatory e Learning; personalizados em ~/.claude/output-styles, .claude/output-styles ou política gerenciada. | 1.0.81 (14/08/2025); marcado obsoleto na 2.0.30 (30/10/2025) e revertido na 2.0.32 (03/11/2025); Concise na 2.1.237 (20/08/2026) | https://code.claude.com/docs/en/output-styles | Sim — output-styles/<nome>.md ou campo outputStyles; frontmatter name, description, keep-coding-instructions e, só em plugin, force-for-plugin: true (aplica o estilo sempre que o plugin está ativo e vence o outputStyle do usuário). |
| **skillOverrides, disableBundledSkills e /skill-doctor** | Controles para esconder, recolher ou auditar skills (custo em contexto e uso) sem editar os arquivos. | skillOverrides 2.1.129 (06/05/2026); disableBundledSkills 2.1.169 (08/06/2026); /skill-doctor 2.1.261 (04/09/2026) | https://code.claude.com/docs/en/skills | Não |

### 2. Ferramentas externas

**Quantidade:** 14 peças. **Exemplos:** servidores MCP, channels, LSP, Claude in Chrome, computer use, Artifacts, as 46 ferramentas internas. **Distribuíveis por plugin:** MCP e LSP (e channels com limite); o resto é conta, extensão ou recurso do produto.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **Servidores MCP** | Protocolo que liga o Claude a serviços externos, com escopos local, projeto (.mcp.json) e usuário e transportes stdio, http, sse (obsoleto) e ws; claude mcp login e logout autenticam pelo shell. | Primeira menção 0.2.31 (05/03/2025, --mcp-debug); escopo de projeto 0.2.50 (19/03/2025); SSE 0.2.54 (25/03/2025); OAuth em servidores remotos 1.0.27 (17/06/2025); headersHelper 1.0.119 (18/09/2025); claude mcp login 2.1.186 (22/06/2026) | https://code.claude.com/docs/en/mcp | Sim — .mcp.json na raiz, campo mcpServers (arquivo, objeto inline ou pacote .mcpb/.dxt); o servidor aparece como plugin:<plugin>:<servidor> e as ferramentas como mcp__plugin_<plugin>_<servidor>__<ferramenta>. |
| **Busca de ferramentas MCP (tool search)** | Mantém só os nomes das ferramentas MCP no contexto e carrega os esquemas sob demanda; a doc a descreve como ligada por padrão. | 2.1.7 (14/01/2026), em modo automático que adia as descrições quando passam de 10% da janela de contexto; auto:N ajusta o limite desde a 2.1.9 (16/01/2026) | https://code.claude.com/docs/en/mcp | Não |
| **Conectores do claude.ai** | Servidores MCP configurados na conta claude.ai que aparecem no Claude Code quando o login é por assinatura. | 2.1.46 (18/02/2026, CHANGELOG) | https://code.claude.com/docs/en/mcp | Não — um plugin com servidor MCP remoto por URL https é oferecido como conector em claude.ai e Cowork; servidor local stdio não. |
| **Elicitation MCP** | Servidores MCP pedem dados estruturados no meio da tarefa por um diálogo (formulário ou URL), com hooks Elicitation e ElicitationResult. | 2.1.76 (14/03/2026) | https://code.claude.com/docs/en/mcp | Não |
| **MCP gerenciado (allow/deny e managed-mcp.json)** | Lista de servidores MCP permitidos, negados ou entregues pela organização. | Allowlist e denylist corporativas na 2.0.22 (17/10/2025) | https://code.claude.com/docs/en/managed-mcp | Não |
| **Channels** | Servidor MCP que empurra mensagens, alertas e webhooks para dentro de uma sessão aberta (Telegram, Discord e iMessage no research preview, mais o fakechat para testar), em research preview; cada canal é um plugin que exige Bun. | 2.1.80 (19/03/2026) | https://code.claude.com/docs/en/channels | Parcial — o plugin declara o servidor em mcpServers e uma entrada em channels; o usuário ainda precisa de --channels, Team e Enterprise precisam habilitar channelsEnabled, e só plugins da lista aprovada (ou de allowedChannelPlugins) registram. |
| **Inteligência de código (LSP)** | Servidores de linguagem dão diagnósticos depois de edições e navegação por símbolo através da ferramenta LSP. | Ferramenta LSP 2.0.74 (19/12/2025) | https://code.claude.com/docs/en/plugins/code-intelligence | Sim — .lsp.json ou campo lspServers (command e extensionToLanguage obrigatórios); o plugin só configura a conexão, o binário do servidor precisa estar no PATH. Há plugins oficiais para C/C++, C#, Go, Java, Kotlin, Liquid, Lua, PHP, Python, Ruby, Rust, Swift e TypeScript/JavaScript. |
| **Claude in Chrome** | Extensão do Chrome que deixa o Claude Code controlar o navegador. | Beta na 2.0.72 (17/12/2025); disponibilidade geral em todos os planos diretos na semana 27 (29/06 a 03/07/2026) | https://code.claude.com/docs/en/chrome | Não |
| **Computer use** | O Claude abre apps nativos, clica e verifica mudanças; no CLI é research preview só no macOS, para Pro e Max (não vale em Team nem Enterprise nem em claude -p). | Desktop na semana 13 (23 a 27/03/2026); CLI na semana 14 (30/03 a 03/04/2026, v2.1.86 a 2.1.91) | https://code.claude.com/docs/en/computer-use | Não |
| **Extensões de IDE (VS Code e JetBrains)** | Extensão do VS Code e plugin do JetBrains que integram o Claude Code ao editor (não são plugins do Claude Code). | Extensão nativa do VS Code na 2.0.0 (29/09/2025); JetBrains não verificado | https://code.claude.com/docs/en/vs-code | Não |
| **Ferramentas internas** | A tabela lista 46 ferramentas (Read, Edit, Write, Bash, Glob, Grep, WebFetch, WebSearch, Agent, Skill, LSP, Monitor, Workflow, Artifact, Cron*, SendMessage, TaskCreate e outras) cujos nomes valem em regras de permissão, listas de subagente e matchers de hook. | Não verificado (evolui desde as 0.2.x) | https://code.claude.com/docs/en/tools-reference | Não — ferramenta nova só por servidor MCP ou, em um mod, por $.tool.register. |
| **Artifacts** | Publica a saída da sessão como página HTML privada e interativa no claude.ai, que pode ler dados pelos conectores MCP de quem abre; a página pode ser compartilhada. | Semana 25 (15 a 19/06/2026, v2.1.178 a 2.1.183), lançado em beta nos planos Team e Enterprise; a página de disponibilidade hoje lista Pro, Max, Team e Enterprise | https://code.claude.com/docs/en/artifacts | Não |
| **Claude Code no Slack** | Abre uma sessão na nuvem a partir de uma menção ao @Claude em canal ou thread do Slack. Para Team e Enterprise a Anthropic está aposentando esta versão em favor do Claude Tag; em Pro e Max segue como o caminho de configuração. | Não verificado | https://code.claude.com/docs/en/slack | Não |
| **Claude Tag** | Leva o Claude aos canais do Slack da equipe como identidade compartilhada da organização, com acesso definido por administradores; não existe em planos individuais. A documentação de uso fica em claude.com; os plugins ficam no marketplace reservado claude-tag-plugins. | Não verificado | https://code.claude.com/docs/en/claude-tag | Não verificado |

### 3. Automação

**Quantidade:** 14 peças. **Exemplos:** hooks (33 eventos, 5 tipos de handler), monitores, /loop e Cron, rotinas, /goal, claude -p, Agent SDK, GitHub Actions. **Distribuíveis por plugin:** hooks, monitores e a parte de hooks em skills; o resto é da sessão, da conta ou do projeto.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **Hooks de configuração** | Comandos, requisições HTTP, chamadas MCP, prompts ou subagentes que o Claude Code dispara em eventos do ciclo de vida; a página lista 33 eventos (de SessionStart a SessionEnd, incluindo PreToolUse, PostToolUse, PermissionRequest, Stop, SubagentStart, PreCompact, WorktreeCreate e PreModelSwitch). | 1.0.38 (30/06/2025) | https://code.claude.com/docs/en/hooks | Sim — hooks/hooks.json (com a chave hooks por fora), campo hooks do manifesto ou, na entrada do marketplace, só objeto inline; variáveis ${CLAUDE_PLUGIN_ROOT} e ${CLAUDE_PLUGIN_DATA}; hooks de plugin somam aos do usuário. |
| **Tipos de handler dos hooks (command, http, mcp_tool, prompt, agent)** | Cinco formas de executar um hook; command aceita forma exec com args (sem shell), http faz POST de JSON, mcp_tool chama uma ferramenta MCP, prompt consulta um modelo e agent (experimental) abre um subagente verificador; o filtro if usa sintaxe de regra de permissão. | http 2.1.63 (28/02/2026); if condicional na semana 13 (23 a 27/03/2026); mcp_tool 2.1.118 (23/04/2026); args (forma exec) 2.1.139 (11/05/2026) | https://code.claude.com/docs/en/hooks | Sim — dentro do hooks.json do plugin; ${user_config.*} é rejeitado em hooks de forma shell (use args ou CLAUDE_PLUGIN_OPTION_<CHAVE>). |
| **Hooks no frontmatter de skill e de agente** | Hooks que valem enquanto a skill foi invocada ou o subagente roda. | 2.1.0 (07/01/2026) | https://code.claude.com/docs/en/hooks | Parcial — em skill de plugin o frontmatter funciona; em agente de plugin o campo hooks é ignorado, então use hooks/hooks.json. |
| **Monitores (ferramenta Monitor e monitors de plugin)** | Comando em segundo plano cuja saída vira notificação para o Claude reagir a logs e mudanças sem polling. | Ferramenta Monitor 2.1.98 (09/04/2026); monitors em plugin 2.1.105 (13/04/2026) | https://code.claude.com/docs/en/plugins/components | Sim — monitors/monitors.json ou experimental.monitors (name, command, description, when); só sessões interativas; when aceita always ou on-skill-invoke:<skill>; o command não aceita ${user_config.*}. |
| **/loop e ferramentas Cron** | Reexecuta um prompt em intervalo dentro da sessão (CronCreate, CronList, CronDelete; até 50 tarefas; recorrentes expiram em 7 dias; ScheduleWakeup no modo autoritmado). | 2.1.71 (07/03/2026) | https://code.claude.com/docs/en/scheduled-tasks | Não — o .claude/loop.md padrão é do projeto ou do usuário; uma skill de plugin pode ser o prompt do loop se permitir invocação pelo modelo. |
| **Rotinas (/schedule)** | Configuração salva (prompt, repositórios e conectores) que roda na nuvem por agenda, chamada de API ou evento do GitHub; research preview; intervalo mínimo de 1 hora; planos Pro, Max, Team e Enterprise. | Semana 16 (13 a 17/04/2026, v2.1.105 a 2.1.113) | https://code.claude.com/docs/en/routines | Não — pertence à conta claude.ai de quem cria; não é compartilhada com colegas. |
| **Tarefas agendadas do Desktop** | Agendamento local do app Desktop, com acesso a arquivos locais e intervalo mínimo de 1 minuto, que só dispara com o app aberto e o computador ligado. | Não verificado | https://code.claude.com/docs/en/desktop-scheduled-tasks | Não |
| **/goal** | Define uma condição de término e o Claude segue trabalhando turno após turno até um modelo avaliador julgar que foi atendida (ou impossível); é um envoltório de hook Stop baseado em prompt, com escopo de sessão. | 2.1.139 (11/05/2026) | https://code.claude.com/docs/en/goal | Não — um plugin pode entregar um hook Stop próprio. |
| **Modo não interativo (claude -p)** | Executa o Claude Code em scripts e CI com --output-format (text, json, stream-json), --json-schema, --allowedTools, --continue e --resume, e --bare para largada rápida e reprodutível. | stream-json em -p na 0.2.66 (09/04/2025); --bare na 2.1.81 (20/03/2026) | https://code.claude.com/docs/en/headless | Não |
| **Agent SDK (Python e TypeScript)** | O mesmo loop e as mesmas ferramentas do Claude Code como biblioteca; carrega plugins locais pela opção plugins. | SDKs TypeScript e Python na 1.0.23 (13/06/2025); renomeado de Claude Code SDK na 2.0.0 (29/09/2025) | https://code.claude.com/docs/en/agent-sdk/overview | Não — o SDK carrega diretórios de plugin (skills, comandos, agentes, hooks, MCP) por caminho local (type: local); não instala de marketplace. |
| **GitHub Actions** | Roda o Claude Code em workflows do GitHub; /install-github-app instala o app e, opcionalmente, o workflow. | Primeira menção 1.0.7 (30/05/2025); instalar só o app sem o workflow na 2.1.187 | https://code.claude.com/docs/en/github-actions | Não |
| **GitLab CI/CD** | Integração do Claude Code com pipelines do GitLab (página não lida em detalhe); a semana 33 cita URLs de merge request do GitLab com --worktree. | Não verificado | https://code.claude.com/docs/en/gitlab-ci-cd | Não |
| **Links profundos (claude-cli://)** | Abre sessões a partir de links, com um tratador de protocolo claude-cli:// que a setting disableDeepLinkRegistration desliga; o prompt vem preenchido mas só é enviado ao pressionar Enter. | Primeira menção 2.1.83 (25/03/2026) | https://code.claude.com/docs/en/deep-links | Não |
| **Code Review de PR, /code-review e ultrareview** | Code Review roda como revisão multiagente em pull requests (Team e Enterprise, research preview, indisponível com ZDR); /code-review revisa um diff localmente; a revisão profunda na nuvem é /code-review ultra, com /ultrareview como alias quando disponível. | /ultrareview 2.1.111 (16/04/2026), research preview; claude ultrareview em CI na 2.1.120; /simplify renomeado /code-review na 2.1.147 (21/05/2026) | https://code.claude.com/docs/en/ultrareview | Não |

### 4. Delegação

**Quantidade:** 11 peças. **Exemplos:** subagentes, workflows dinâmicos, equipes de agentes, agent view, worktrees, mensagens entre sessões. **Distribuíveis por plugin:** subagentes e workflows; worktrees e equipes só em parte.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **Subagentes** | Assistentes com contexto, prompt, modelo e ferramentas próprios, definidos em Markdown (frontmatter: name, description, tools, disallowedTools, model, permissionMode, maxTurns, skills, mcpServers, hooks, memory, background, omitClaudeMd, effort, isolation, color, initialPrompt, experimental), que devolvem só um resumo. | 1.0.60 (24/07/2025); criam subagentes próprios desde a semana 24 (08 a 12/06/2026); rodam em segundo plano por padrão desde a semana 27 (29/06 a 03/07/2026) | https://code.claude.com/docs/en/sub-agents | Sim — agents/*.md (subpastas viram prefixo do nome) ou campo agents (só arquivos .md); o nome vira <plugin>:<agente>; em plugin são ignorados permissionMode, hooks, mcpServers e initialPrompt. |
| **Subagentes embutidos** | Explore, Plan e general-purpose, mais ajudantes como statusline-setup e claude-code-guide. | Não verificado | https://code.claude.com/docs/en/sub-agents | Não |
| **Fork de conversa (/subtask e /fork)** | Um fork herda a conversa inteira em vez de começar do zero; /subtask abre um subagente forkado e /fork copia a sessão para uma nova sessão em segundo plano. | /fork para sessão em segundo plano na 2.1.212 (semana 29, 13 a 17/07/2026); modo fork ligado por padrão em sessões interativas na semana 33 (10 a 14/08/2026) | https://code.claude.com/docs/en/sub-agents | Não |
| **Workflows dinâmicos** | Script JavaScript escrito pelo Claude (ou salvo por você) que orquestra dezenas a centenas de subagentes em segundo plano e devolve um resultado só; /deep-research é o embutido. | 2.1.154 (28/05/2026) | https://code.claude.com/docs/en/workflows | Sim — workflows/*.js com export const meta (name e description literais) ou campo workflows; roda como /<plugin>:<nome>; também em .claude/workflows/ e ~/.claude/workflows/. |
| **Equipes de agentes (agent teams)** | Um líder coordena sessões pares com lista de tarefas compartilhada e mensagens entre elas; experimental e desligado por padrão. | 2.1.32 (05/02/2026) | https://code.claude.com/docs/en/agent-teams | Parcial — definições de subagente de plugin servem de papel de teammate; ligar a feature exige CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 em env ou settings do usuário. |
| **Agent view e sessões em segundo plano (claude agents)** | Uma tela com todas as sessões (rodando, esperando você, concluídas) e sessões em segundo plano que rodam sem terminal anexado; research preview. | 2.1.139 (11/05/2026); /resume dentro da view e a cópia por /fork pedem a 2.1.212 ou superior | https://code.claude.com/docs/en/agent-view | Não |
| **Worktrees (--worktree, EnterWorktree, isolation: worktree)** | Cada sessão ou subagente edita num git worktree próprio (.claude/worktrees/), com .worktreeinclude para copiar arquivos ignorados e settings worktree.*. | 2.1.49 (19/02/2026) | https://code.claude.com/docs/en/worktrees | Parcial — agente de plugin aceita isolation: worktree; .worktreeinclude e worktree.* são do projeto ou do usuário; hooks WorktreeCreate e WorktreeRemove entram em hooks.json. |
| **Mensagens entre sessões (SendMessage, ListAgents, /list-agents)** | O Claude lista e manda mensagens a outras sessões suas, na mesma máquina, em outras máquinas ou na nuvem, com controles crossSessionInbound e isolatePeerMachines. | 2.1.224 (07/08/2026) em macOS e Linux; Windows nativo a partir da 2.1.234 | https://code.claude.com/docs/en/cross-session-messaging | Não |
| **/batch** | Skill empacotada que divide uma mudança grande em 5 a 30 subagentes isolados em worktrees. | 2.1.63 (28/02/2026) | https://code.claude.com/docs/en/agents | Não |
| **Advisor** | Ferramenta experimental que escala decisões difíceis a outro modelo; exige a API da Anthropic e fica indisponível em Bedrock, Claude Platform on AWS, Vertex e Foundry. | Primeira menção 2.1.117 (22/04/2026), rotulada experimental | https://code.claude.com/docs/en/advisor | Não |
| **Projects** | Uma conversa contínua em claude.ai/code ou no Desktop que abre threads paralelas na nuvem; beta pública em Pro e Max, ainda fora de Team e Enterprise. | Não verificado | https://code.claude.com/docs/en/claude-projects | Não |

### 5. Aparência e interface

**Quantidade:** 12 peças. **Exemplos:** statusLine, temas, keybindings, spinner, fullscreen, ditado por voz, leitor de tela, mods. **Distribuíveis por plugin:** temas, a linha de status de subagentes e os mods; a statusLine principal e os atalhos são do usuário.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **Linha de status (statusLine)** | Barra inferior que roda um script seu recebendo JSON da sessão (modelo, contexto, custo, git, limites); campos command, padding, refreshInterval e hideVimModeIndicator; /statusline gera o script. | 1.0.71 (07/08/2025) | https://code.claude.com/docs/en/statusline | Não — o settings.json de plugin descarta statusLine (só agent e subagentStatusLine valem). A página de mods mostra que um mod pode desenhar uma linha de dica sob o prompt. |
| **Linha de status de subagentes (subagentStatusLine)** | Reescreve o corpo de cada linha de subagente no painel abaixo do prompt, recebendo as tarefas por JSON. | Primeira menção 2.1.214 (18/07/2026) | https://code.claude.com/docs/en/statusline | Sim — settings.json do plugin ou campo settings do manifesto; não roda sob allowManagedHooksOnly. |
| **Temas (/theme e ~/.claude/themes)** | Presets (dark, light, daltonizados, ansi) e temas personalizados em JSON (name, base, overrides com dezenas de tokens de cor). | Temas personalizados 2.1.118 (23/04/2026) | https://code.claude.com/docs/en/terminal-config | Sim — themes/<slug>.json ou experimental.themes; aparecem em /theme e são somente leitura. |
| **Atalhos de teclado (keybindings.json)** | Arquivo ~/.claude/keybindings.json com contextos, ações, acordes e desvinculação; recarrega sozinho. | 2.1.18 (22/01/2026) | https://code.claude.com/docs/en/keybindings | Não — os contextos Pane e PaneField existem para painéis de mods, mas o arquivo é do usuário. |
| **Spinner (verbos e dicas)** | Settings spinnerVerbs, spinnerTipsEnabled e spinnerTipsOverride personalizam as palavras e dicas do indicador de trabalho. | spinnerTipsEnabled 1.0.112 (12/09/2025); spinnerVerbs 2.1.23 (29/01/2026); spinnerTipsOverride 2.1.45 (17/02/2026) | https://code.claude.com/docs/en/settings-reference | Não — um mod pode redesenhar o Spinner pelo evento ui.render. |
| **Modo Vim e remapeamentos** | Edição estilo Vim no prompt (editorMode) e vimInsertModeRemaps para sequências como jj. | Primeira menção 0.2.34 (08/03/2025) | https://code.claude.com/docs/en/terminal-config | Não |
| **Renderização em tela cheia (/tui fullscreen)** | Renderizador sem flicker com scrollback virtualizado, rolagem pelo mouse e painéis como o /diff ao vivo; research preview. | CLAUDE_CODE_NO_FLICKER na 2.1.89 (01/04/2026); /tui na 2.1.110 (15/04/2026) | https://code.claude.com/docs/en/fullscreen | Não |
| **Configuração do terminal** | Ajustes para Shift+Enter, tecla Option no macOS, sino e notificações, tmux, Backspace no Windows e largura de prosa. | Não verificado | https://code.claude.com/docs/en/terminal-config | Não |
| **Ditado por voz (/voice)** | Entrada de prompt por voz, no modo segurar ou tocar; exige conta claude.ai (não vale com chave de API direta nem com Bedrock, Vertex e Foundry). | Primeira menção 2.1.69 (05/03/2026); lançamento não verificado | https://code.claude.com/docs/en/voice-dictation | Não |
| **Modo leitor de tela** | Troca a interface visual por texto linear para leitores como VoiceOver e NVDA (--ax-screen-reader ou axScreenReader). | 2.1.208 (14/07/2026) | https://code.claude.com/docs/en/accessibility | Não |
| **Mods (interface própria)** | Plugins cujo código roda dentro do Claude Code e redesenham a interface: painel ao lado da conversa, faixa acima do prompt, toast, linha de status, spinner e linhas de ferramenta; também interceptam chamadas e adicionam comandos e ferramentas. | 2.1.287 (01/10/2026) | https://code.claude.com/docs/en/plugins/mods/overview | Sim — hooks/hooks.json com modules (um caminho relativo), arquivo que exporta register(on, options), e types no plugin.json se usar $.state; validar com claude plugin validate e testar com claude plugin test; galeria de elementos em plugins/mods/gallery. |
| **Notificações (sino, hook Notification, PushNotification)** | preferredNotifChannel escolhe sino ou notificação de desktop; o hook Notification roda comandos quando o Claude precisa de você; a ferramenta PushNotification avisa o celular via Remote Control. | Não verificado | https://code.claude.com/docs/en/terminal-config | Parcial — o hook entra no hooks.json do plugin; a setting preferredNotifChannel não. |

### 6. Empacotamento e distribuição

**Quantidade:** 15 peças. **Exemplos:** plugins, marketplaces, sete tipos de fonte, dependências, userConfig, bin/, evals. **Distribuíveis por plugin:** é a própria camada de embalagem; o que não entra aqui são os modos de uso (carregar sem marketplace) e as travas da organização.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **Plugins** | Diretório de skills, agentes, hooks, servidores MCP e LSP, estilos, temas, monitores, workflows, executáveis e mods carregado como uma unidade; o manifesto .claude-plugin/plugin.json é opcional e só name é obrigatório. Subcomandos: claude plugin init, install, uninstall, enable, disable, update, list, details, configure, prune, eval, tag, test, validate e marketplace add, list, remove e update. | 2.0.12 (09/10/2025) | https://code.claude.com/docs/en/plugins/overview | Sim — é o próprio mecanismo de empacotamento. |
| **Marketplaces (marketplace.json)** | Catálogo .claude-plugin/marketplace.json (name, owner e plugins obrigatórios) que diz onde buscar cada plugin; instala-se por nome@marketplace. | 2.0.12 (09/10/2025) | https://code.claude.com/docs/en/plugins/create-marketplace | Sim — repositório git com o arquivo; claude plugin marketplace add dono/repo; extraKnownMarketplaces no .claude/settings.json registra para todo o repositório. |
| **Fontes de plugin** | A entrada do marketplace busca o plugin por caminho relativo, github, url, git-subdir, npm, archive (zip por HTTPS, sha256 opcional) ou command (diretório impresso por um comando local). | git-subdir 2.1.69 (05/03/2026); npm com registro e versão 2.1.51 (24/02/2026); archive 2.1.224 (07/08/2026); command 2.1.229 (12/08/2026) | https://code.claude.com/docs/en/plugins/marketplace-reference | Sim |
| **Dependências de plugin** | Campo dependencies (nome, nome@marketplace ou objeto com version em faixa semver) instala e habilita outros plugins junto; versões resolvem contra tags git. | Primeira menção no CHANGELOG 2.1.110 (15/04/2026), em uma correção; introdução não verificada | https://code.claude.com/docs/en/plugins/dependencies | Sim — dependencies no plugin.json ou na entrada; allowCrossMarketplaceDependenciesOn no marketplace libera dependência de outro marketplace; tag <plugin>--v<versão> via claude plugin tag. |
| **Configuração do usuário (userConfig)** | Valores que o Claude Code pergunta ao habilitar o plugin (string, number, boolean, directory, file), com sensitive: true guardando em cofre do sistema. | 2.1.83 (25/03/2026); options exige a 2.1.271 | https://code.claude.com/docs/en/plugins/manifest-reference | Sim — userConfig no plugin.json; referência ${user_config.CHAVE} em MCP, LSP, hooks de forma exec e conteúdo de skill; variável CLAUDE_PLUGIN_OPTION_<CHAVE> nos hooks. |
| **Executáveis em bin/** | Arquivos de bin/ entram no PATH do Bash enquanto o plugin está ativo, para o Claude chamar como comandos. | 2.1.91 (02/04/2026) | https://code.claude.com/docs/en/plugins/components | Sim — bin/ na raiz; claude.ai e Cowork não instalam plugin com bin/. |
| **settings.json do plugin** | Configurações aplicadas enquanto o plugin está ativo; só agent e subagentStatusLine têm efeito, o resto é descartado, e as do usuário vencem. | 2.1.49 (19/02/2026) | https://code.claude.com/docs/en/plugins/manifest-reference | Parcial — settings.json na raiz ou campo settings do manifesto; agent roda a sessão principal como um agente do plugin. |
| **Carregar sem marketplace** | --plugin-dir (diretório, .zip ou pasta de plugins), --plugin-url, CLAUDE_CODE_PLUGIN_DIRS, plugins em .claude/skills/ (claude plugin init) carregam um plugin sem instalá-lo. | .zip na 2.1.128 (04/05/2026) e --plugin-url na 2.1.129 (06/05/2026); claude plugin init e plugins em .claude/skills na 2.1.157 (29/05/2026); pasta de plugins na 2.1.265 (08/09/2026); CLAUDE_CODE_PLUGIN_DIRS na 2.1.280 (22/09/2026) | https://code.claude.com/docs/en/plugins/create | Não — são modos de uso, não componentes; o administrador pode barrar com disableSideloadFlags. |
| **Validação, testes e evals** | claude plugin validate confere manifesto e componentes; claude plugin test roda testes de mods; claude plugin eval roda casos com e sem o plugin e compara as notas. | /plugin validate 2.0.12 (09/10/2025); claude plugin eval 2.1.269 (11/09/2026) | https://code.claude.com/docs/en/plugin-evals | Sim — casos de eval ficam em evals/ dentro do plugin (experimental.evals muda a pasta); cada execução e cada avaliador são chamadas reais de modelo cobradas do plano ou da API; com git instalado exige a versão 2.31 ou superior. |
| **Publicação e versões** | Marketplace próprio, envio ao diretório da Anthropic (portal claude.ai/directory/manage, plano claude.ai pago) ou envio direto da pasta; claude plugin tag cria tags e renames migra plugins renomeados. | claude plugin tag 2.1.118 (23/04/2026); renames 2.1.193 (25/06/2026) | https://code.claude.com/docs/en/plugins/publish | Sim |
| **Recomendação por relevance** | Bloco relevance (topic e signals: cwd, cli, hosts, filesRead, manifestDeps) faz o Claude Code sugerir o plugin quando a sessão casa. | A aba Discover do /plugin passou a destacar plugins por relevance na 2.1.154 (28/05/2026); introdução do campo não verificada | https://code.claude.com/docs/en/plugins/relevance | Sim — campo relevance na entrada do marketplace; o administrador precisa listar o marketplace em pluginSuggestionMarketplaces. |
| **Dicas de CLI (claude-code-hint)** | Uma CLI ou SDK imprime uma tag no stderr para o Claude Code oferecer a instalação do plugin. | Não verificado | https://code.claude.com/docs/en/plugins/cli-hints | Não — só vale para plugin listado em marketplace com nome oficial da Anthropic. |
| **Marketplaces e diretório da Anthropic** | claude-plugins-official (adicionado sozinho no terminal interativo), claude-community (adicionar à mão) e claude-code-plugins (demo em anthropics/claude-code); a Anthropic também publica marketplaces temáticos como anthropics/skills e anthropics/knowledge-work-plugins; o diretório do claude.ai chega ao Claude Code como plugin synced. | Não verificado | https://code.claude.com/docs/en/plugins/anthropic-marketplaces | Não — o marketplace oficial não recebe submissões pelo portal; o diretório exige conta paga. |
| **Controles de organização para plugins** | strictKnownMarketplaces, blockedMarketplaces, enabledPlugins, extraKnownMarketplaces, disableSideloadFlags, disableCommandPluginSources, strictPluginOnlyCustomization, pluginSuggestionMarketplaces, prependPlugins e appendPlugins, quase todos só em configurações gerenciadas. | extraKnownMarketplaces na 2.0.12 (09/10/2025); demais não verificados | https://code.claude.com/docs/en/plugins/org | Não |
| **Medição de custo e uso de plugins** | claude plugin details mostra o custo sempre ligado em tokens; /skill-doctor, /doctor, /usage e eventos OpenTelemetry (plugin_installed, plugin_loaded, skill_activated) mostram uso; nomes de plugins fora do marketplace oficial saem redigidos por padrão. | claude plugin details 2.1.139 (11/05/2026); /skill-doctor 2.1.261 (04/09/2026); demais não verificados | https://code.claude.com/docs/en/plugins/measure | Não |

### 7. Segurança e permissões

**Quantidade:** 16 peças. **Exemplos:** regras allow/ask/deny, modos de permissão, auto mode, sandbox, configurações gerenciadas, security-guidance. **Distribuíveis por plugin:** só os plugins de segurança (security-guidance e Claude Security) e, por hooks e mods, a guarda de ações; permissões, sandbox e política são do usuário ou da organização.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **Regras de permissão (allow, ask, deny)** | Regras Tool ou Tool(especificador) avaliadas na ordem deny, ask, allow (a primeira que casa decide); /permissions as gerencia; Tool(param:value) casa parâmetros. | /allowed-tools renomeado /permissions na 1.0.7 (30/05/2025); Tool(param:value) na semana 25 (15 a 19/06/2026) | https://code.claude.com/docs/en/permissions | Não — plugin não entrega regras; para impedir uma ação use um hook PreToolUse (ou um mod com tool.check) ou peça ao usuário para colar as regras (exemplos em settings-example). |
| **Modos de permissão** | default (rotulado Manual), acceptEdits, plan, auto, dontAsk e bypassPermissions, alternados com Shift+Tab ou --permission-mode. | Modo plan: melhorias na 1.0.33 (23/06/2025); demais não verificados | https://code.claude.com/docs/en/permission-modes | Não |
| **Auto mode** | Um classificador revisa as ações em vez de você; a configuração autoMode e /auto-mode-setup (Pro, Max e Team, 2.1.228 ou superior) ajustam regras e ambiente. | Semana 13 (23 a 27/03/2026), research preview; modo padrão de novas sessões em Pro, Max e Team desde 14/08/2026; 2.1.283 (25/09/2026) faz sessões interativas em provedores de terceiros ou com telemetria desligada começarem nele quando nenhum modo está configurado | https://code.claude.com/docs/en/auto-mode-config | Não |
| **Sandbox do Bash** | Isolamento de sistema de arquivos e rede para comandos de shell (Seatbelt no macOS, bubblewrap no Linux e WSL2; Windows nativo roda sem sandbox), fora do qual ficam as ferramentas de arquivo, MCP, hooks e mods. | 2.0.24 (20/10/2025) | https://code.claude.com/docs/en/sandboxing | Não |
| **Ambientes de sandbox** | Alternativas de isolamento como devcontainers, contêineres e máquinas virtuais, e o pacote sandbox-runtime. | Não verificado | https://code.claude.com/docs/en/sandbox-environments | Não |
| **Confiança de workspace** | Hooks, servidores MCP e marketplaces vindos do repositório só valem depois de aceitar o diálogo de confiança da pasta. | Não verificado | https://code.claude.com/docs/en/permissions | Não |
| **Configurações gerenciadas** | Política da organização por arquivo managed-settings.json, MDM ou console do claude.ai que usuário e projeto não sobrescrevem; requiredMinimumVersion e requiredMaximumVersion fazem o Claude Code recusar versões fora da faixa. | Primeira menção 2.0.58 (03/12/2025); suporte empresarial anunciado na 2.0.68 (12/12/2025); faixa de versão na 2.1.163 (04/06/2026) | https://code.claude.com/docs/en/managed-settings | Não — pode forçar plugins com enabledPlugins e extraKnownMarketplaces. |
| **Travas sobre hooks, mods e personalizações** | allowManagedHooksOnly, strictPluginOnlyCustomization, prependPlugins e appendPlugins limitam ou ordenam o que roda; para barrar só os mods do usuário, a opção allowManagedModsOnly vai no mod embutido cc-plugin-sec-default@builtin, em pluginConfigs das configurações gerenciadas. | Não verificado | https://code.claude.com/docs/en/settings-reference | Não |
| **Plugin security-guidance** | Plugin oficial que revisa as mudanças do próprio Claude em três camadas (padrões por edição, revisão por turno e revisão em commits) e as corrige na mesma sessão; é feito só de hooks, mas precisa de Python (3.7, ou 3.10 para as revisões com modelo) e cria um ambiente virtual em ~/.claude/security/ com o Agent SDK. | Semana 22 (25 a 29/05/2026, v2.1.150 a 2.1.157) | https://code.claude.com/docs/en/security-guidance | Sim — já é um plugin de claude-plugins-official, feito só de hooks. |
| **Plugin Claude Security** | Plugin que roda uma varredura multiagente de vulnerabilidades no repositório e transforma os achados escolhidos em patches. | Semana 30 (20 a 24/07/2026, v2.1.214 a 2.1.219) | https://code.claude.com/docs/en/claude-security | Sim |
| **/security-review** | Revisão de segurança única das mudanças do branch atual. | Primeira menção 2.1.70 (06/03/2026) | https://code.claude.com/docs/en/commands | Não |
| **Checkpoints e /rewind** | Snapshots de arquivos permitem desfazer mudanças de código e voltar a conversa (/rewind, alias /undo). | 2.0.0 (29/09/2025) | https://code.claude.com/docs/en/checkpointing | Não |
| **--safe-mode e --restricted** | --safe-mode inicia sem CLAUDE.md, plugins, skills, hooks e MCP; --restricted remove ferramentas que executam código e recusa bypassPermissions. | --safe-mode 2.1.169 (08/06/2026); --restricted 2.1.248 (27/08/2026) | https://code.claude.com/docs/en/cli-reference | Não |
| **Dados e privacidade** | Páginas de uso de dados, segurança e zero data retention (ZDR, só contas Enterprise qualificadas); telemetria, relatório de erro e relatório de bug ficam desligados por padrão em Bedrock, Vertex, Foundry e Claude Platform on AWS; o relatório de erro só liga com login Pro ou Max, API direta e sem ZDR ou HIPAA. | Não verificado | https://code.claude.com/docs/en/data-usage | Não |
| **Guarda embutida cc-plugin-sec-default** | Mod embutido que protege o que a organização gerencia dos mods que o usuário instala; carrega antes deles quando a máquina tem configurações gerenciadas ou o usuário entrou com plano Team ou Enterprise. | 2.1.287 (01/10/2026) | https://code.claude.com/docs/en/plugins/mods/admin | Não |
| **Lançador corporativo (CLAUDE_CODE_PROCESS_WRAPPER)** | Faz todo processo que o Claude Code inicia a partir do próprio binário passar por um lançador exigido pela empresa (serviço em segundo plano, sessões do agent view, relançamentos). | Não verificado | https://code.claude.com/docs/en/corporate-launcher | Não |

### 8. Execução e ambiente

**Quantidade:** 36 peças. **Exemplos:** arquivos de configuração e precedência, variáveis de ambiente, flags da CLI, 119 comandos de barra, nuvem, Desktop, provedores e gateways. **Distribuíveis por plugin:** praticamente nada (só o settings.json de plugin, e só agent e subagentStatusLine); aqui mora a configuração do usuário.

| Peça | O que é | Desde | URL oficial | Distribuível por plugin |
| :- | :- | :- | :- | :- |
| **Arquivos de configuração e precedência** | settings.json do usuário (~/.claude), do projeto (.claude), local (settings.local.json), gerenciado e ~/.claude.json; o gerenciado vence tudo, e deny de qualquer nível não é desfeito por allow. | Não verificado | https://code.claude.com/docs/en/settings | Parcial — só o settings.json do plugin, e só agent e subagentStatusLine. |
| **Todas as settings** | A referência agrupa as chaves em temas: modelo e respostas, memória e contexto, interface, git e atribuição, permissões, sandbox, hooks, plugins e skills, MCP, agentes e worktrees, remoto e Desktop, privacidade, atualizações, gerenciadas e acessibilidade. | Não verificado | https://code.claude.com/docs/en/settings-reference | Não |
| **Exemplos de settings** | Três settings.json realistas (desenvolvedor, equipe e organização) para copiar e ajustar. | Não verificado | https://code.claude.com/docs/en/settings-example | Não |
| **Variáveis de ambiente** | Variáveis como CLAUDE_CODE_* e MCP_TIMEOUT controlam comportamento; podem entrar no bloco env das settings. | Não verificado | https://code.claude.com/docs/en/env-vars | Não — settings de plugin descartam env; CLAUDE_PLUGIN_ROOT, CLAUDE_PLUGIN_DATA e CLAUDE_PROJECT_DIR são fornecidas aos componentes. |
| **Flags e subcomandos da CLI** | Flags como -p, --continue, --resume, --agent, --agents, --permission-mode, --plugin-dir, --worktree, --bare e subcomandos como claude mcp, claude plugin, claude agents, claude ultrareview e claude purge. | --agents na 2.0.0 (29/09/2025); --agent na 2.0.59 (04/12/2025); claude project purge na 2.1.126 (01/05/2026), hoje claude purge desde a 2.1.288 (02/10/2026) | https://code.claude.com/docs/en/cli-reference | Não |
| **Modelo, esforço e fallback** | /model, /effort (low a xhigh, max só na sessão, auto e ultracode), fallbackModel, modelPicker e availableModels escolhem e limitam modelos. | /effort: primeira menção 2.1.72 (10/03/2026), e o CHANGELOG registra o comando como adicionado na 2.1.76 (14/03/2026); modelPicker 2.1.243 (24/08/2026); demais não verificados | https://code.claude.com/docs/en/model-config | Não — skills e agentes de plugin podem fixar model e effort no frontmatter, só para o componente. |
| **Modo rápido** | Execução mais veloz do Claude Opus (até 2,5 vezes) a custo maior por token; indisponível em Bedrock, Vertex, Foundry e Claude Platform on AWS; em research preview. | Primeira menção 2.1.36 (07/02/2026) | https://code.claude.com/docs/en/fast-mode | Não |
| **Janela de contexto, compactação e cache de prompt** | Explicações e controles de /context, /compact, compactação automática e do cache de prompt (promptCacheTtl, subagentPromptCacheTtl). | Compactação automática: primeira menção 0.2.47 (18/03/2025) | https://code.claude.com/docs/en/context-window | Não |
| **Sessões (continuar, retomar, bifurcar, nomear)** | --continue, --resume, --fork-session, --name, /rename, /resume e transcrições em ~/.claude/projects/. | --continue e --resume 0.2.93 (30/04/2025) | https://code.claude.com/docs/en/sessions | Não |
| **Comandos de barra embutidos** | 119 comandos na tabela da referência (inclusive os cerca de 20 que são skills empacotadas): /init, /memory, /agents, /plugin, /hooks, /mcp, /permissions, /config, /model, /compact, /context, /rewind, /loop, /schedule, /goal, /workflows, /diff, /cd, /doctor e outros. | Desde as 0.2.x | https://code.claude.com/docs/en/commands | Não — comandos novos vêm de skills, commands/ ou, em mods, $.command.register. |
| **Diretório .claude e arquivos do projeto** | Catálogo dos arquivos que o Claude Code lê: CLAUDE.md, .mcp.json, .worktreeinclude, .claude/settings(.local).json, rules/, skills/, output-styles/, agents/, workflows/ e, no usuário, keybindings.json, themes/ e commands/. | Não verificado | https://code.claude.com/docs/en/claude-directory | Não |
| **Claude Code na nuvem (web, --cloud, --teleport)** | Sessões em VMs da Anthropic, iniciadas pelo claude.ai/code ou pela CLI, que clonam o repositório do GitHub; levam o que está no repositório (CLAUDE.md, rules, skills, agents, commands, .mcp.json, hooks). | Teleport web para CLI na 2.0.24 (20/10/2025); mensagem iniciada por & na 2.0.45 (18/11/2025) | https://code.claude.com/docs/en/claude-code-on-the-web | Não — a sessão na nuvem não instala plugins do settings do usuário nem os do .claude/settings.json do repositório; só a política gerenciada por servidor entrega plugins. |
| **App Desktop** | Aplicativo com a aba Code, sessões paralelas, painel de diff, navegador embutido, painel do simulador de iOS e, em beta, versão para Linux (Ubuntu e Debian). | 2.0.51 (24/11/2025) | https://code.claude.com/docs/en/desktop | Não — plugins e mods carregam nas sessões locais da aba Code, menos em sessões WSL. |
| **Mobile, Remote Control e dispositivos** | Controle de uma sessão local pelo claude.ai ou celular (Remote Control, claude remote-control), app mobile e cartão de dispositivo no celular para iniciar sessão numa máquina. | claude remote-control 2.1.51 (24/02/2026) | https://code.claude.com/docs/en/remote-control | Não |
| **Ambientes autohospedados** | claude self-hosted-runner transforma suas máquinas ou contêineres em lugar onde sessões web, mobile e Desktop rodam; beta pública em Team e Enterprise, desligada por padrão. | 2.1.224 (07/08/2026) | https://code.claude.com/docs/en/self-hosted-environments | Não |
| **Provedores, gateways e contêineres** | Amazon Bedrock, Claude Platform on AWS, Google Cloud Agent Platform (Vertex), Microsoft Foundry, gateways LLM, o Claude apps gateway autohospedado (login por SSO, acesso a modelos por grupo e telemetria OTLP), devcontainers e configuração de rede corporativa. | Foundry 2.0.45 (18/11/2025) | https://code.claude.com/docs/en/third-party-integrations | Não |
| **Observabilidade, custo e análises** | Métricas e eventos OpenTelemetry (inclusive plugin_installed e plugin_loaded), /usage, /cost, painel e API de analytics e página de custos. | OpenTelemetry: primeira menção 1.0.8 (02/06/2025) | https://code.claude.com/docs/en/monitoring-usage | Não |
| **Disponibilidade por plano e provedor** | Tabela de quais recursos funcionam em assinatura, Console, Bedrock, Vertex, Foundry e gateways, e em Pro, Max, Team e Enterprise. | Não verificado | https://code.claude.com/docs/en/feature-availability | Não |
| **Guias de hooks, depuração e prática** | Páginas de apoio: Automate actions with hooks, Debug your configuration (/context, /doctor, /hooks, /mcp), Best practices, Common workflows, How Claude Code works, monorepos e bases grandes (large-codebases) e Prompt library. | Não verificado | https://code.claude.com/docs/en/hooks-guide | Não |
| **Kits de adoção** | Champion kit (roteiro para engenheiros que defendem o Claude Code dentro da empresa) e Communications kit (anúncios, campanhas e respostas para o lançamento interno). | Não verificado | https://code.claude.com/docs/en/champion-kit | Não |
| **Teto de esforço (maxEffortLevel)** | Setting que limita o nível de esforço em qualquer provedor. | Semana 37 (07 a 11/09/2026, v2.1.263 a 2.1.269) | https://code.claude.com/docs/en/settings-reference | Não |
| **Resumo de sessão e retomada entre superfícies** | Resumo do que aconteceu com o terminal sem foco (session recap), e /resume no Desktop para retomar sessões iniciadas na CLI. | Recap na semana 17 (20 a 24/04/2026); /resume no Desktop na semana 35 (24 a 28/08/2026) | https://code.claude.com/docs/en/sessions | Não |
| **/team-onboarding e /powerup** | /team-onboarding gera um guia de entrada para colegas a partir do seu uso; /powerup traz lições interativas dentro do produto. | /team-onboarding 2.1.101 (10/04/2026); /powerup semana 14 (30/03 a 03/04/2026) | https://code.claude.com/docs/en/commands | Não |
| **Windows sem Git Bash e ferramenta PowerShell** | Em Windows o Claude Code usa PowerShell como ferramenta de shell quando não há Bash; Git for Windows deixou de ser obrigatório. | PowerShell opt-in 2.1.84 (26/03/2026); sem Git Bash na semana 18 (27/04 a 01/05/2026) | https://code.claude.com/docs/en/tools-reference | Não |
| **Claude apps gateway** | Serviço autohospedado entre os clientes do Claude Code e o provedor de modelo: login com o provedor de identidade da empresa, acesso a modelos por grupo, managed settings por grupo e telemetria para a observabilidade da empresa. | Não verificado | https://code.claude.com/docs/en/claude-apps-gateway | Não |
| **GitHub Enterprise Server** | Conecta o Claude Code a uma instância autohospedada do GitHub Enterprise Server para sessões na nuvem, code review e marketplaces de plugin. | Não verificado | https://code.claude.com/docs/en/github-enterprise-server | Não |
| **/config chave=valor e /cd** | /config key=value ajusta qualquer setting pelo prompt, em -p e pelo Remote Control; /cd muda o diretório de trabalho da sessão no meio da conversa, mantendo a conversa. | /cd na semana 24 (08 a 12/06/2026); /config chave=valor na semana 25 (15 a 19/06/2026); versões não verificadas | https://code.claude.com/docs/en/commands | Não |
| **Rede corporativa** | Configuração do Claude Code para ambientes corporativos com servidores proxy, autoridades certificadoras (CA) próprias e autenticação mTLS. | Não verificado | https://code.claude.com/docs/en/network-config | Não |
| **Instalação e autenticação** | Requisitos do sistema, instalação por plataforma, gestão de versões e desinstalação (setup); login para indivíduos, equipes e organizações (authentication); correção de erros de instalação e de login (troubleshoot-install). | Não verificado | https://code.claude.com/docs/en/setup | Não |
| **Segurança e conformidade** | Salvaguardas de segurança e boas práticas de uso seguro (security) e acordos legais, certificações de conformidade e informações de segurança (legal-and-compliance). | Não verificado | https://code.claude.com/docs/en/security | Não |
| **Modo interativo** | Referência de atalhos de teclado, modos de entrada e recursos interativos das sessões (inclui o painel de diff e perguntas laterais com /btw). | Não verificado | https://code.claude.com/docs/en/interactive-mode | Não |
| **Plataformas e integrações** | Comparativo de onde rodar o Claude Code (CLI, Desktop, VS Code, JetBrains, web, mobile) e a que conectá-lo (Chrome, Slack, CI/CD). | Não verificado | https://code.claude.com/docs/en/platforms | Não |
| **Prompt library e prompt caching** | Prompts prontos para copiar, por tarefa e papel (prompt-library); como o Claude Code gerencia o cache de prompt sozinho (prompt-caching). | Não verificado | https://code.claude.com/docs/en/prompt-library | Não |
| **Glossário e referência de erros** | Definições dos termos do Claude Code (glossary) e o que significa e como corrigir cada mensagem de erro de execução (errors). | Não verificado | https://code.claude.com/docs/en/glossary | Não |
| **Administração, custos e análises** | Mapa de decisão para administradores (admin-setup), controle de custos e limites de gasto (costs) e painel de análises de uso da equipe (analytics). | Não verificado | https://code.claude.com/docs/en/admin-setup | Não |
| **Agent SDK em produção** | Hospedagem do Agent SDK (arquitetura de subprocesso, persistência de sessão, escala, isolamento) e guia de implantação segura com isolamento, credenciais e controles de rede. | Não verificado | https://code.claude.com/docs/en/agent-sdk/hosting | Não |

## Campos do plugin.json

Só `name` é obrigatório. Campo desconhecido no topo é descartado com aviso; em `userConfig`, `channels`, `lspServers` e `monitors` é erro e o plugin não carrega.

- `name`: único campo obrigatório; identificador em kebab-case sem espaços, @, : ou separadores de caminho; prefixa todo componente (agente reviewer do plugin deploy-tools vira deploy-tools:reviewer).
- `$schema`: URL de JSON Schema para autocomplete no editor; ignorada na carga.
- `displayName`: nome mostrado na interface no lugar de name; aceita espaços e maiúsculas; a entrada do marketplace tem precedência.
- `version`: string de versão (não checada como semver); definida, fixa o usuário nessa versão até você mudá-la; o version do plugin.json vence o da entrada do marketplace.
- `description`: explicação curta do que o plugin oferece, mostrada em /plugin.
- `author`: objeto com name obrigatório e email e url opcionais.
- `homepage`: URL da documentação; precisa ser URL válida ou o plugin não carrega.
- `repository`: URL do repositório de código; não é validada.
- `license`: identificador SPDX como MIT ou Apache-2.0.
- `keywords`: lista de tags de descoberta.
- `metadata`: objeto livre para dados seus; o Claude Code não lê (exige 2.1.222 ou superior).
- `icon`: caminho de uma imagem dentro do plugin para a listagem no diretório da Anthropic; o Claude Code não lê; só vale no plugin.json.
- `documentationUrl`, `supportUrl`, `privacyPolicyUrl`, `termsOfServiceUrl`: links https para a listagem no diretório da Anthropic; ignorados na carga; só no plugin.json (na entrada do marketplace o validate acusa campo desconhecido).
- `defaultEnabled`: se o plugin nasce habilitado quando o usuário não decidiu; padrão true; a entrada do marketplace vence.
- `dependencies`: plugins que precisam estar habilitados; cada item é nome, nome@marketplace ou objeto {name, marketplace, version em faixa semver}.
- `settings`: configurações aplicadas enquanto o plugin está ativo; só agent e subagentStatusLine têm efeito; um settings.json na raiz tem precedência.
- `userConfig`: valores que o Claude Code pergunta ao habilitar; chaves com letras, dígitos e sublinhado; cada opção tem type (string, number, boolean, directory, file), title e description obrigatórios e required, default, options (2.1.271 ou superior), multiple, sensitive, min e max opcionais.
- `types`: caminho de um .d.ts que declara os valores de $.state e os substantivos de $ de um mod.
- `channels`: lista de canais de mensagem do plugin; cada entrada tem server (obrigatório, chave em mcpServers), displayName e userConfig.
- `skills`: caminho ou lista de diretórios com skills (cada um com pastas <nome>/SKILL.md, ou uma pasta com SKILL.md direto; "." é a raiz do plugin, a partir da 2.1.221); soma-se a skills/.
- `commands`: caminho, lista ou mapa nome para {source ou content (exatamente um), description, argumentHint, model, allowedTools}; substitui a varredura de commands/.
- `agents`: caminho ou lista de arquivos .md de agente (diretórios não); substitui agents/.
- `hooks`: caminho de .json, objeto inline ou lista de ambos; carrega junto com hooks/hooks.json.
- `mcpServers`: caminho de .json, pacote .mcpb/.dxt (caminho ou URL https), objeto inline ou lista; carrega junto com .mcp.json e nome repetido substitui o anterior.
- `lspServers`: caminho de .json, objeto inline ou lista; cada servidor exige command e extensionToLanguage e aceita args, transport, env, initializationOptions, settings, workspaceFolder, startupTimeout, shutdownTimeout, requestTimeout (2.1.288), restartOnCrash, maxRestarts e diagnostics.
- `outputStyles`: caminho ou lista de arquivos ou diretórios de estilos de saída; substitui output-styles/.
- `workflows`: caminho ou lista de arquivos .js ou diretórios de workflows; substitui workflows/.
- `experimental`: contêiner para themes, monitors e evals, cujo formato ainda pode mudar; themes e monitors de nível superior ainda carregam, com aviso do validate.
- `experimental.themes`: caminho ou lista de arquivos ou diretórios de temas; substitui themes/.
- `experimental.monitors`: caminho de .json ou array inline de monitores {name, command, description, when}; padrão monitors/monitors.json; só sessões interativas e fora de Bedrock, Vertex e Foundry.
- `experimental.evals`: diretório dos casos de eval quando não é evals/; claude plugin eval --eval-dir sobrescreve.
- NÃO é campo do plugin.json: `modules` fica em hooks/hooks.json (um array com um caminho relativo ao arquivo, como ["./register.js"]); é o que torna o plugin um mod.

## Campos do marketplace.json e das entradas

- Raiz: `name` (obrigatório; letras, dígitos, ponto, sublinhado e hífen; há nomes reservados), `owner` (obrigatório; name obrigatório, email e url opcionais) e `plugins` (obrigatório; cada entrada é validada à parte).
- Raiz: `$schema` (ignorado), `description` (o validate avisa se faltar), `version` e `metadata.description` e `metadata.version` como local alternativo.
- Raiz: `metadata.pluginRoot`, diretório sob o qual nomes simples de source são resolvidos (2.1.239 ou superior).
- Raiz: `forceRemoveDeletedPlugins` (true desinstala nas máquinas dos usuários o plugin removido de plugins), `allowCrossMarketplaceDependenciesOn` (marketplaces cujas dependências são aceitas; vale a lista do marketplace raiz) e `renames` (mapa nome antigo para nome novo ou null; 2.1.193 ou superior).
- Entrada, `name` e `source`: obrigatórios; name é o que o usuário digita antes do @ e pode diferir do name do plugin.json.
- Entrada, `description`, `version` (o do plugin.json vence), `category` e `tags` (livres, para catálogo e busca).
- Entrada, `strict`: padrão true; com true o plugin.json manda e os campos de componente da entrada se somam (hooks substituem por evento); com false e plugin.json presente, declarar commands, agents, skills, hooks, outputStyles ou themes na entrada é conflito e o plugin não carrega.
- Entrada, `relevance`: objeto com topic (até 64 caracteres) e signals (cwd, cli, hosts, filesRead e manifestDeps, com limites de quantidade) para sugerir o plugin; exige allowlist em pluginSuggestionMarketplaces.
- Entrada, `dependencies` e `defaultEnabled` (a entrada vence o plugin.json), `displayName` (a entrada vence) e `metadata` (livre; 2.1.222 ou superior).
- Entrada, `headers` e `headersHelper`: cabeçalhos HTTP, ou comando que imprime cabeçalhos em JSON, para baixar fontes archive; headersHelper exige strict: false (2.1.238 ou superior).
- Entrada, campos herdados do plugin.json (exceto os de listagem no diretório): description, author, homepage, repository, license, keywords, commands, agents, skills, hooks, outputStyles, themes, mcpServers, lspServers, userConfig, channels e experimental; sem plugin.json a entrada é o manifesto; com plugin.json, mcpServers, lspServers, userConfig e channels da entrada não valem.
- Entrada, `hooks`: só objeto inline por evento; caminho de arquivo ou lista passa no validate mas não roda e gera erro de carga.
- Fonte `source`, caminho relativo: texto que começa com ./ (resolvido a partir da raiz do marketplace, sem ..), ou nome simples com metadata.pluginRoot.
- Fonte `github`: repo (dono/repo), ref (branch ou tag) e sha (commit de 40 caracteres).
- Fonte `url`: url git completa (https, http, file ou git@), ref e sha.
- Fonte `git-subdir`: url, path (subdiretório, com checkout esparso), ref e sha.
- Fonte `npm`: package (nome, nome@versão ou tarball https), version e registry; scripts de instalação nunca rodam.
- Fonte `archive`: url https de um zip e sha256 opcional (2.1.224 ou superior).
- Fonte `command`: command (imprime o caminho absoluto do diretório do plugin), timeout (1 a 600 s, padrão 60) e mode (copy ou link) (2.1.229 ou superior); o administrador pode barrar com disableCommandPluginSources.
- Fontes de marketplace em settings (extraKnownMarketplaces e listas de política): url (url, headers, headersHelper), github (repo, ref, path, sparsePaths), git (url, ref, path, sparsePaths), file e directory (path), settings (name, plugins, owner) e, só nas listas de política, hostPattern, pathPattern, skills-dir e o repo owner/*; a fonte npm de marketplace ainda não é implementada.
- Nomes reservados de marketplace: claude-code-marketplace, claude-code-plugins, claude-plugins-official, anthropic-marketplace, anthropic-plugins, agent-skills, anthropic-agent-skills, life-sciences, knowledge-work-plugins, claude-for-legal, claude-for-financial-services, financial-services-plugins, first-party-plugins, claude-tag-plugins, claude-community, claude-plugins-community, healthcare, anthropic-plugin-directory e claude-plugin-directory (reservados, exceto se a fonte for github ou git sob github.com/anthropics/), além de inline, builtin, skills-dir, synced, claude-plugin-test, npm, pip, uv, cargo, github, gh e o prefixo claudeai-; nomes que imitam os oficiais ou outra grafia de um reservado (claude.code.plugins) também são recusados.
- Nomes de plugin recusados pelo validate: prefixos claude-, anthropic-, anthropics- e cc-plugin-, os nomes claude, anthropic, anthropics, claude-code e claude-mods, e official ao lado de claude ou anthropic (aviso se claude ou anthropic for palavra inteira em outro lugar).

## O que vale aproveitar

Para o claude-code-kit e para o post sobre mods:

- **O que o kit já entrega e é distribuível:** skills, agentes, estilos de saída, temas, hooks inline e mods (csr-cockpit). O marketplace do kit usa hoje `name`, `description`, `owner`, `renames` e, nas entradas, `name`, `source`, `description`, `category`, `skills`, `agents`, `outputStyles` e `hooks`.
- **Campos oficiais ainda não usados na entrada:** `strict`, `tags`, `version`, `displayName`, `defaultEnabled`, `relevance`, `dependencies`, `metadata`.
- **Componentes de plugin ainda não explorados:** `mcpServers`, `lspServers`, `userConfig` (para o mod pedir uma pasta ou um limite), `channels`, `monitors`, `workflows`, `bin/`, `settings.json` com `agent`, `evals` e o frontmatter `force-for-plugin` em estilo de saída.
- **O que não cabe em plugin:** permissions, statusLine, env, keybindings, rules e CLAUDE.md. A saída é documentar no README o trecho para colar (a página de exemplos de settings serve de modelo) ou entregar o efeito por skill, hook ou mod.
- **Verificação antes de publicar:** `claude plugin validate --strict` (e `claude plugin test` para mods) em cada plugin; `claude plugin eval` quando houver skills com comportamento a medir; `claude plugin details` mostra o custo sempre ligado em tokens.
- **Mods:** usar a galeria de elementos e a skill embutida plugin-authoring; mostrar no post que `claude plugin validate` lista, sem rodar, os eventos e as chamadas de um mod.
- **Para o post de mods:** vale cobrir o mapa completo das quatro formas de estender (skill, hook, MCP, mod) com a tabela de comparação da página de mods, o que o mod pode e não pode (nem o prompt de permissão), onde roda e desenha (terminal e Desktop; VS Code e `claude -p` só hooks), os seis mods embutidos e a guarda de política.
- **Sessões na nuvem:** o que está em `.claude/skills`, `.claude/agents`, `.claude/commands`, `.claude/rules` e CLAUDE.md do repositório chega à sessão; plugin declarado em `enabledPlugins` não chega.

## Cuidados

- **Ritmo e estabilidade:** três ou quatro versões por semana; peças em research preview, beta ou experimental (rotinas, agent view, channels, equipes de agentes, advisor, computer use, fullscreen, projects, hooks do tipo agent, themes e monitors sob experimental) podem mudar de forma. O `/ultraplan` já saiu (2.1.222, 04/08/2026): use o modo plan.
- **Datas:** vêm dos GitHub Releases (a partir da 2.0.74) e, onde eles não existem, do npm (UTC) ou do CHANGELOG (2.1.46), com um dia de diferença possível entre fontes. "Primeira menção" não é a data de lançamento, e nada foi inferido onde o CHANGELOG não cobre.
- **Nomes reservados:** plugins que começam com `claude-`, `anthropic-`, `anthropics-` ou `cc-plugin-` dão erro no validate (e `claude plugin init` e `tag` recusam); um marketplace com nome reservado, ou que imita um oficial, para de carregar. O nome do repositório (claude-code-kit) não é nome de plugin, então não é afetado, mas todo plugin novo precisa fugir desses prefixos.
- **Código com os seus privilégios:** plugin executa código (hooks, servidores MCP e LSP, `bin/`, mods) fora do sandbox; a página de segurança manda revisar hooks/hooks.json, .mcp.json e bin/ antes de instalar, e o auto-update pode mudar os arquivos revisados. Mod lê segredos, sobe processos e, com tool.check, pode aprovar uma chamada que uma regra ask pediria ou que um hook PreToolUse bloqueou (exceto hook em configurações gerenciadas); uma regra deny só segura o mod por padrão em máquina com configurações gerenciadas ou login Team ou Enterprise, e nos demais casos o mod pode aprovar até uma chamada que um deny recusa. Já os hooks de configuração e os hooks/hooks.json de plugin nunca passam por cima de deny e ask.
- **Telemetria dos plugins do kit:** nomes de plugins que não vêm do marketplace oficial saem redigidos (third-party) nos eventos OpenTelemetry, a menos que OTEL_LOG_TOOL_DETAILS=1.
- **Inconsistência da doc:** o manifesto manda declarar themes e monitors em `experimental` (o nível superior ainda carrega, com aviso), mas a página do marketplace ainda cita themes entre os seis campos de componente da entrada. Valide com `claude plugin validate` antes de confiar.
- **Alcance da leitura:** não li em detalhe as páginas de gitlab-ci-cd, jetbrains, vs-code, desktop, mobile, setup, authentication, network-config, costs, analytics, devcontainer, gateways, zero-data-retention, interactive-mode, github-actions nem as subpáginas do Agent SDK; a claude-tag redireciona para claude.com. As linhas dessas peças vêm do índice llms.txt e de menções em páginas lidas; onde não deu para confirmar está escrito "não verificado".
- **Texto dirigido a agentes:** toda página da documentação começa com um aviso para buscar o índice llms.txt. Foi tratado como dado; o llms.txt foi lido porque a tarefa mandou. Nenhuma outra instrução em texto lido foi seguida.
- **Como foi lido:** as páginas foram lidas em Markdown bruto (sufixo .md), não por resumo de modelo, por requisições HTTP de leitura gravadas só no diretório de rascunho; as contagens (33 eventos, 46 ferramentas, 119 comandos) foram feitas direto nesses arquivos.

## Fontes

- https://code.claude.com/docs/llms.txt
- https://code.claude.com/docs/en/features-overview
- https://code.claude.com/docs/en/plugins/overview
- https://code.claude.com/docs/en/plugins/manifest-reference
- https://code.claude.com/docs/en/plugins/marketplace-reference
- https://code.claude.com/docs/en/plugins/components
- https://code.claude.com/docs/en/plugins/create
- https://code.claude.com/docs/en/plugins/create-marketplace
- https://code.claude.com/docs/en/plugins/publish
- https://code.claude.com/docs/en/plugins/install
- https://code.claude.com/docs/en/plugins/loading
- https://code.claude.com/docs/en/plugins/host-marketplace
- https://code.claude.com/docs/en/plugins/dependencies
- https://code.claude.com/docs/en/plugins/relevance
- https://code.claude.com/docs/en/plugins/cli-hints
- https://code.claude.com/docs/en/plugins/anthropic-marketplaces
- https://code.claude.com/docs/en/plugins/code-intelligence
- https://code.claude.com/docs/en/plugins/cli-reference
- https://code.claude.com/docs/en/plugins/org
- https://code.claude.com/docs/en/plugins/security
- https://code.claude.com/docs/en/plugins/measure
- https://code.claude.com/docs/en/plugin-evals
- https://code.claude.com/docs/en/plugins/mods/overview
- https://code.claude.com/docs/en/plugins/mods/reference
- https://code.claude.com/docs/en/plugins/mods/create
- https://code.claude.com/docs/en/plugins/mods/test
- https://code.claude.com/docs/en/plugins/mods/admin
- https://code.claude.com/docs/en/plugins/mods/gallery
- https://code.claude.com/docs/en/settings-reference
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/settings-example
- https://code.claude.com/docs/en/env-vars
- https://code.claude.com/docs/en/whats-new/index
- https://code.claude.com/docs/en/whats-new/2026-w13 (e os resumos das semanas 14, 15, 16, 19, 22, 25, 27, 29, 30 e 33, no mesmo caminho)
- https://code.claude.com/docs/en/feature-availability
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/output-styles
- https://code.claude.com/docs/en/statusline
- https://code.claude.com/docs/en/terminal-config
- https://code.claude.com/docs/en/keybindings
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/sandboxing
- https://code.claude.com/docs/en/mcp
- https://code.claude.com/docs/en/channels
- https://code.claude.com/docs/en/workflows
- https://code.claude.com/docs/en/scheduled-tasks
- https://code.claude.com/docs/en/routines
- https://code.claude.com/docs/en/goal
- https://code.claude.com/docs/en/agent-teams
- https://code.claude.com/docs/en/agent-view
- https://code.claude.com/docs/en/worktrees
- https://code.claude.com/docs/en/cross-session-messaging
- https://code.claude.com/docs/en/tools-reference
- https://code.claude.com/docs/en/commands
- https://code.claude.com/docs/en/claude-directory
- https://code.claude.com/docs/en/headless
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/auto-mode-config
- https://code.claude.com/docs/en/security-guidance
- https://code.claude.com/docs/en/claude-security
- https://code.claude.com/docs/en/ultrareview
- https://code.claude.com/docs/en/code-review
- https://code.claude.com/docs/en/artifacts
- https://code.claude.com/docs/en/computer-use
- https://code.claude.com/docs/en/chrome
- https://code.claude.com/docs/en/advisor
- https://code.claude.com/docs/en/claude-projects
- https://code.claude.com/docs/en/self-hosted-environments
- https://code.claude.com/docs/en/slack
- https://code.claude.com/docs/en/fast-mode
- https://code.claude.com/docs/en/deep-links
- https://code.claude.com/docs/en/desktop-scheduled-tasks
- https://code.claude.com/docs/en/checkpointing
- https://code.claude.com/docs/en/voice-dictation
- https://code.claude.com/docs/en/fullscreen
- https://code.claude.com/docs/en/accessibility
- https://code.claude.com/docs/en/claude-code-on-the-web
- https://code.claude.com/docs/en/cloud-environments
- https://code.claude.com/docs/en/data-usage
- https://code.claude.com/docs/en/corporate-launcher
- https://code.claude.com/docs/en/claude-apps-gateway
- https://code.claude.com/docs/en/agent-sdk/plugins
- https://code.claude.com/docs/en/managed-settings
- https://code.claude.com/docs/en/server-managed-settings
- https://code.claude.com/docs/en/model-config
- https://code.claude.com/docs/en/sessions
- https://code.claude.com/docs/en/interactive-mode
- https://code.claude.com/docs/en/vs-code
- https://code.claude.com/docs/en/jetbrains
- https://code.claude.com/docs/en/desktop
- https://code.claude.com/docs/en/remote-control
- https://code.claude.com/docs/en/github-actions
- CHANGELOG.md do repositório anthropics/claude-code (cópia salva por outra etapa em scratchpad/f00/changelog.md)
- GitHub Releases do repositório anthropics/claude-code e o histórico de commits do CHANGELOG (cópias salvas por outra etapa em scratchpad/f00/releases.tsv e scratchpad/f00/ver_date.json)
- https://registry.npmjs.org/@anthropic-ai/claude-code (campo time, para as datas de publicação)
- /Users/cesar.schutz/Downloads/claude-code-kit/.claude-plugin/marketplace.json (somente leitura)

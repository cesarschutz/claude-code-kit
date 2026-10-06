# 01 · O SITE https://www.aitmpl.com e o ecossistema em volta

Data da pesquisa: 04/10/2026. Claude Code na máquina: 2.1.289. Números exibidos por sites são "números informados pelo site" nessa data.

## Explicação

### O que é

O davila7/claude-code-templates é um repositório MIT (criado em 04/07/2025; 32.375 estrelas, 3.702 forks e 214 inscritos pela API do GitHub em 04/10/2026; 131 contribuidores pela API de contribuidores) que junta duas coisas: um catálogo de "componentes" para o Claude Code em `cli-tool/components/` e um site (aitmpl.com) com um CLI (`npx claude-code-templates`, versão 1.29.6) que lê o catálogo e instala cada peça.

Pelo `counts.json`, o catálogo tem 890 skills, 422 agentes, 288 comandos, 105 MCPs, 72 settings, 62 hooks, 39 mods, 18 loops, 14 templates (6 por linguagem e 8 por framework) e 11 sandboxes, somando 1.921. O repositório todo tem 9.663 arquivos e cerca de 116 MB. A árvore de arquivos e o `counts.json` diferem por causas conhecidas:

- skills: 914 `SKILL.md` na árvore e 890 no catálogo (os 890 estão em `categoria/nome/SKILL.md`; 24 estão aninhados mais fundo ou soltos na pasta da categoria);
- comandos: 348 `.md` na árvore e 288 no catálogo (as 60 diferenças são subpastas `recipes/` com 50 e `personas/` com 10, dentro de `google-workspace`);
- agentes: 424 `.md` e 422 (2 cópias numa pasta aninhada duplicada);
- hooks: 63 JSON e 62 (`HOOK_PATTERNS_COMPRESSED.json` fica na raiz de `hooks/`).

Não é um marketplace de plugins. O único `marketplace.json` fica em `cli-tool/components/.claude-plugin/`, tem só uma chave `agents` com 8 itens e não tem `name`, `owner` nem `plugins`, que a documentação do Claude Code exige. O caminho de instalação é o `npx`, não o `/plugin` (não testei o comando).

### O site

- **Menu (barra lateral):** Browse (Skills, Agents, Commands, Settings, Hooks, MCPs, Mods, Plugins) e Resources (Trending, Jobs com selo "New", Blog, Docs, GitHub). Blog e Docs abrem em outra aba. O botão GitHub com estrelas fica também no topo. Loops existe em `/loops`, mas está com `hidden: true` e não aparece no menu. O título da home é "Claude Code Templates: 1000+ Agents, Commands, Skills & MCP Integrations".
- **Página de componente:** `/component/<tipo>/<categoria>/<nome>`, com o tipo no singular ou no plural (aceita os dois; o canônico é o plural). É renderizada no servidor (`prerender = false`), acha o item em `components.json` e busca o conteúdo em `/component-content/<tipo>/<slug>.json`. Mostra o comando de instalação com a flag do tipo (por exemplo `npx claude-code-templates@latest --setting statusline/context-monitor`), botão Copy, selo com o número de downloads quando maior que zero (o catálogo registra 15.515 para o context-monitor), cartões de campos do frontmatter (para settings e hooks só a `description`; autor, versão e licença do context-monitor estão vazios), sumário, o conteúdo (Markdown, JSON ou árvore de arquivos da skill ou do mod), "View on GitHub", botão de salvar numa coleção e um terminal animado. Para loops lista os componentes referenciados.
- **Stack Builder:** painel lateral e botão flutuante "Stack". Guarda os itens no `localStorage` do navegador (chave `claudeCodeCart`), agrupa por tipo e monta um único comando `npx claude-code-templates@latest` com `--agent`, `--command`, `--setting`, `--hook`, `--mcp`, `--skill`, `--loop`, `--mod` e `--template`; permite copiar e compartilhar no X. Não há servidor envolvido.
- **Busca ⌘K (ou Ctrl+K):** baixa `search-index.json` (1,15 MB; campos type, name, path, description, category) e filtra no navegador. Há código para resultado patrocinado, inerte sem `PUBLIC_ADS_ENABLED=true`; no `dashboard/wrangler.toml` essa variável está comentada, ou seja, desligada.
- **Trending:** lê `trending-data.json` (cache de 1 h). Cada tipo traz só os 10 itens mais baixados na semana; a opção "All Time" reordena esses 10, não o catálogo inteiro. Mostra downloads por dia, semana, mês, total e por país (Brasil é o 2º, com 86.406).
- **Jobs:** 86 vagas raspadas do Hacker News (42), da Anthropic (41), do WeWorkRemotely (2) e do RemoteOK (1). Aparece também como barra lateral na home.
- **Plugins:** diretório de 34 coleções de terceiros, gerado por `generate_plugins_json.py`. O site não instala nada, mas a página de cada coleção mostra os dois comandos nativos: `/plugin marketplace add <dono>/<repo>` e `/plugin install <plugin>@<marketplace>`.
- **Com login (Clerk e Neon):** "My Components" (coleções pessoais), link público `/c/<slug>` e envio da coleção como PR para um repositório do usuário, via OAuth do GitHub.
- **Outras páginas:** `/live-task` ("Component Review Loop", acompanha o ciclo automático de melhoria de componentes; o controle é restrito a um e-mail fixo do mantenedor), `/featured/<slug>` (páginas de parceiros) e `/github-callback`.

### Como é feito e alimentado

Tudo parte de `cli-tool/components/`.

- `scripts/generate_components_json.py` varre as pastas, lê o frontmatter, soma downloads (tabela `component_downloads` do Supabase), roda a auditoria de segurança do CLI (`npm run security-audit:json`) e grava JSON estático: `docs/components.json` (completo, 2,19 MB) e, em `dashboard/public/`, `components.json`, `counts.json`, `components/<tipo>.json`, `search-index.json` e `component-content/<tipo>/<slug>.json`.
- O `dashboard/` (Astro 5, React 19, Tailwind 4, Clerk, Neon) roda no Cloudflare Pages (projeto `aitmpl-dashboard`, serve www e app.aitmpl.com) e serve esses JSON com cache de 24 h e CORS aberto; `trending-data.json` e `claude-jobs.json` têm cache de 1 h.
- O workflow `update-json-data.yml` roda todo dia às 03:00 UTC e executa `generate_components_json.py`, `generate_trending_data.py` e `generate_claude_jobs.py`, e comita o resultado. Nenhum dos 19 workflows executa `generate_plugins_json.py` nem `generate_claude_prs.py` (esses arquivos parecem ser regenerados à mão; inferência pela ausência).
- `scripts/generate_claude_prs.py` lista os PRs cujo branch começa com `claude/` e grava `docs/claude-prs/data.json`, usado pela página estática `docs/claude-prs/index.html`. Não alimenta o contador "Component PRs" da home.
- `cloudflare-workers/` tem 5 Workers: `crons` (chama `/api/claude-code-check` a cada 30 min e `/api/health-check` a cada hora), `pulse` (relatório semanal por Telegram, domingo 14:00 UTC), `daily-health-report` (resumo diário por Telegram, 14:00 UTC), `newsletter` (Resend, pausada em 20/09/2026) e `docs-monitor` (desativado em 07/2026; o código fica no repositório).
- O Neon guarda versões do Claude Code com suas mudanças e o log de avisos no Discord, uso de comandos do CLI, resultados de instalação, coleções de usuários e o ciclo de revisão de componentes. `database/migrations/` tem só duas migrações (versões e uso de comandos); a do ciclo de revisão está em `dashboard/src/lib/live-task/migration.sql`, e não achei no repositório as migrações das tabelas de coleções. Os downloads ficam no Supabase, fora do repositório.
- O Docs (docs.aitmpl.com) é Mintlify, com 56 páginas no `llms.txt`; o código dele não está neste repositório. O blog é servido de `dashboard/public/blog/` (28 artigos).

Os contadores do topo da home não são leituras ao vivo. `home-stats.ts` calcula "base + dias × taxa": downloads 1.340.064 em 05/07/2026 (+3.300 por dia), Component PRs 270 (+1,8 por dia) e npm 239.282 (+466 por dia), os dois últimos medidos em 18/09/2026. Pela fórmula, o contador de downloads hoje passa de 1,64 milhão; o `trending-data.json` gerado hoje registra 1.571.624.

### O que o context-monitor é de fato

É um setting da categoria `statusline`, com dois arquivos em `cli-tool/components/settings/statusline/`: `context-monitor.json` (só `description` e `statusLine: { type: "command", command: "python3 .claude/scripts/context-monitor.py" }`) e `context-monitor.py` (299 linhas, só biblioteca padrão do Python).

- **Instalação** (`npx claude-code-templates@latest --setting statusline/context-monitor`): o CLI baixa os dois arquivos de raw.githubusercontent.com (branch main, sem versão fixada), remove a `description`, grava o script em `.claude/scripts/` com permissão 755 e mescla o JSON no settings do escopo escolhido. Com `--yes` o escopo é local (`.claude/settings.local.json`). Sem `--yes` aparece uma lista de múltipla escolha, com "local" marcado: user (`~/.claude/settings.json`), project (`.claude/settings.json`), local ou enterprise (`managed-settings.json`). Em user e enterprise o comando passa a usar caminho absoluto; em project e local fica relativo e só resolve a partir da raiz do projeto. No Windows `python3` vira `python`. Se já existir uma `statusLine` diferente, o CLI mostra o conflito e pergunta (padrão: não sobrescrever). A única chave alterada é `statusLine`.
- **O que lê:** o JSON que o Claude Code manda no stdin (`model.display_name`, `workspace.current_dir` e `project_dir`, `cost.total_cost_usd`, `total_duration_ms`, `total_lines_added` e `total_lines_removed`, `transcript_path`); lê o transcript inteiro (`readlines()`), olha as últimas 15 linhas, pega a última mensagem do assistente com `usage` e soma `input_tokens`, `cache_read_input_tokens` e `cache_creation_input_tokens`; e roda três comandos `git` (`rev-parse --git-dir`, `branch --show-current`, `status --porcelain`).
- **O que imprime:** uma linha com `[modelo]`, pasta, ramo e contagem de alterações, um ícone de cérebro e uma barra de contexto de 8 segmentos com o percentual, depois custo, minutos e linhas líquidas. Cores por faixa: abaixo de 50% verde, 50% amarelo, 75% laranja, 90% vermelho com "HIGH", 95% com "CRIT". Um segundo método procura mensagens `system_message` com texto específico ("Context left until auto-compact: X%") e mostra "AUTO-COMPACT!" ou "LOW!"; não verifiquei se o Claude Code atual ainda emite essas mensagens. Em caso de erro imprime `[Error: ...]`.
- **Segurança do script:** não usa rede nem escreve arquivo; só lê o transcript da sessão e chama `git`. Roda local, sem chamar o modelo, então não gasta tokens.
- **Defasado:** divide os tokens por 200.000 fixo. A documentação atual do Claude Code entrega `context_window.used_percentage` (mesma conta, só tokens de entrada) e `context_window_size` (200.000 ou 1.000.000), então com janela de 1M o percentual sai superestimado. Também lê o transcript inteiro e roda três `git` a cada atualização; o Claude Code dispara o script a cada nova mensagem do assistente, ao fim de `/compact`, na troca de modo de permissão e no vim, com debounce de 300 ms. O `worktree-context-statusline.py`, do mesmo repositório, já usa o campo novo.
- **Popularidade:** é a setting mais baixada (15.515 no total, 80 na última semana, 307 no mês).
- **Plugin não distribui isso:** o `settings.json` de um plugin só aceita as chaves `agent` e `subagentStatusLine`; as outras são descartadas. A `statusLine` mora no settings do usuário ou do projeto.

### O que vale e o que não vale para o claude-code-kit

- **Vale:** CI com `claude plugin validate` e `claude plugin test`, agente revisor e checklist de mod, proveniência por item (licença, autor, repositório), catálogo JSON gerado do `marketplace.json`, receitas de settings no README, a lista de causas de "mod mudo", um pacote-guia com `dependencies` e o bloco de instalação em duas linhas por item.
- **Não vale:** site, Stack Builder, contadores sintéticos, patrocínio, telemetria, banco de dados e envio de coleção como PR.

### O que é bom

Catálogo em arquivos simples com frontmatter; geração automática dos JSON; revisão por agente; validação oficial em CI; SkillSpector (NVIDIA) nas skills; typecheck dos mods; atribuição de licenças; e mods como `agent-flow` (árvore de agentes), `git-sidebar`, `tool-timing-badge`, `prompt-cache-control` (medidor de cache) e `session-time-machine`, parecidos com o csr-cockpit.

### O que preocupa

Telemetria ligada por padrão e IP gravado no servidor; instalação da branch main sem fixar versão; um RCE no `--studio` (GHSA-79wm-x847-7cvg, CVSS 8.8) só corrigido na 1.29.4 (13/07/2026); licenças mistas; conteúdo patrocinado; contagens que não batem entre README, site, docs e CLAUDE.md; e alguns componentes que dependem de variáveis de ambiente que a documentação de hooks não lista.

## Categorias

### Skills (aitmpl.com/skills)

Pacotes de instruções (`SKILL.md` mais arquivos de apoio) instalados em `.claude/skills`. É o maior tipo: 890 no catálogo, em 29 categorias; as maiores são development (230), scientific (135), ai-research (131), productivity (50), business-marketing (48), security (47), creative-design (33) e enterprise-communication (33). A árvore tem 31 pastas de categoria, 914 `SKILL.md` e 5.691 arquivos (inclui 649 `.patch`, 390 `.xsd` e 54 fontes `.ttf`). A página do componente mostra um explorador de arquivos da skill.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| frontend-design | `cli-tool/components/skills/creative-design/frontend-design/SKILL.md` | Orienta decisões de design de interface com direção estética e tipografia; a skill mais baixada (48.435). |
| docx | `cli-tool/components/skills/document-processing/docx/SKILL.md` | Criar, ler e editar documentos Word. O frontmatter declara "Proprietary" e `ANTHROPIC_ATTRIBUTION.md` a marca como source-available, não open source. |
| scientific/alphafold-database | `cli-tool/components/skills/scientific/alphafold-database/SKILL.md` | Uma das skills da categoria scientific (o README cita K-Dense-AI/claude-scientific-skills, MIT; não li o conteúdo desta). |

### Agents (aitmpl.com/agents)

Subagentes em Markdown com frontmatter (name, description, tools, model), instalados em `.claude/agents` (pasta única, sem subpasta de categoria). 422 no catálogo, em 28 categorias; as maiores são expert-advisors (52), programming-languages (50), data-ai (40), devops-infrastructure (40), development-tools (35), security (25) e business-marketing (21). Há arquivos fora do lugar: 10 scripts `.py` dentro de `obsidian-ops-team/Scripts` e uma pasta aninhada duplicada em business-marketing (2 arquivos). O CLI instala só o arquivo pedido; não vi lógica de dependência entre agentes.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| frontend-developer | `cli-tool/components/agents/development-team/frontend-developer.md` | Agente de frontend (React, Vue, Angular) com tools Read, Write, Edit, Bash, Glob, Grep; o prompt manda pedir contexto ao agente context-manager antes de começar, e instalar o primeiro não instala o segundo. Agente mais baixado (39.975). |
| context-manager | `cli-tool/components/agents/development-tools/context-manager.md` | Mantém estado coerente entre agentes e sessões longas; existe também uma cópia em expert-advisors. |
| vital-health-content-agent (caminho duplicado) | `cli-tool/components/agents/business-marketing/cli-tool/components/agents/business-marketing/vital-health-content-agent.md` | Exemplo de arquivo no lugar errado: o caminho repete a própria pasta dentro de si. |

### Commands (aitmpl.com/commands)

Slash commands em Markdown (frontmatter `allowed-tools`, `argument-hint`, `description`; corpo com `$ARGUMENTS` e blocos `!` de shell), instalados em `.claude/commands`. 288 no catálogo, em 25 categorias: google-workspace (47), utilities (21), project-management (20), testing (17), svelte (16), orchestration (15), setup (15), git-workflow (14), sync (14) e team (14). A árvore tem 348 `.md` porque `google-workspace` guarda mais 60 em subpastas (`recipes/` e `personas/`) que o catálogo não conta.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| generate-tests | `cli-tool/components/commands/testing/generate-tests.md` | Gera suíte de testes para um arquivo ou componente. Detecta o framework com comandos de shell embutidos e também executa `npm run test:coverage` do projeto ao ser aberto. Comando mais baixado (12.071). |
| ultra-think | `cli-tool/components/commands/utilities/ultra-think.md` | Análise estruturada em vários frameworks: premissas ocultas, soluções concorrentes, teste adversarial e recomendação com confiança calibrada. |
| gws-calendar-agenda | `cli-tool/components/commands/google-workspace/gws-calendar-agenda.md` | Um dos 47 comandos `gws-*` de Google Workspace (pelo nome, agenda do Calendar; não li o arquivo). |

### Settings (aitmpl.com/settings)

JSON com chaves de configuração do Claude Code (`statusLine`, `permissions`, `env`, `model`, `hooks` etc.) mesclado no settings escolhido. 72 itens JSON em 13 subcategorias (uma entrada para cada logo abaixo), mais 3 scripts `.py` de apoio. Itens com `description` apenas informativa; autor, versão e licença vêm vazios no catálogo.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| statusline/context-monitor | `cli-tool/components/settings/statusline/context-monitor.json` | Define `statusLine` para rodar um script Python; ver a explicação completa acima. |
| permissions/read-only-mode | `cli-tool/components/settings/permissions/read-only-mode.json` | Permite só Read, Glob, Grep e LS e nega Edit, Write, MultiEdit, Bash e WebFetch. |
| environment/privacy-focused | `cli-tool/components/settings/environment/privacy-focused.json` | Liga cinco variáveis que desativam tráfego não essencial, telemetria, relatório de erros, comando de bug e autoupdater. |

### Hooks (aitmpl.com/hooks)

JSON com a chave `hooks` (PreToolUse, Stop, SubagentStart etc.) e, quando existe, script `.py` ou `.sh` de apoio copiado para `.claude/hooks/` (campo `supportingFiles`; o CLI também procura `<nome>.py` e `<nome>.sh` ao lado do JSON). 62 no catálogo, em 12 categorias: automation (19), development-tools (9), security (8), doordash (4), post-tool (4), pre-tool (4), git (3), monitoring (3), quality-gates (3), git-workflow (2), performance (2) e testing (1). O 63º JSON da árvore (`HOOK_PATTERNS_COMPRESSED.json`) fica na raiz e não entra no catálogo.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| dangerous-command-blocker | `cli-tool/components/hooks/security/dangerous-command-blocker.json` | PreToolUse em Bash chama `python3 .claude/hooks/dangerous-command-blocker.py` para bloquear comandos catastróficos (rm -rf /, dd, mkfs) e proteger `.claude/`, `.git/` e `node_modules/`. |
| simple-notifications | `cli-tool/components/hooks/automation/simple-notifications.json` | Notificação de desktop quando o Claude termina ou espera resposta (macOS e Linux); hook mais baixado (10.061). |
| tdd-gate | `cli-tool/components/hooks/quality-gates/tdd-gate.json` | Bloqueia edição de código de produção sem arquivo de teste correspondente; usa script `.sh` de apoio. |

### MCPs (aitmpl.com/mcps)

JSON com `mcpServers` (command, args, env, description), mesclado em `.mcp.json`. 105 no catálogo, em 13 categorias: devtools (49), web-data (11), database (8), integration (8), browser_automation (6), web (6), productivity (5), deepgraph (4), marketing (4) e quatro de um item (audio, deepresearch, filesystem, research). Alguns itens vêm de parceiros comerciais (por exemplo web-data/brightdata).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| context7 | `cli-tool/components/mcps/devtools/context7.json` | Traz documentação atualizada e específica da versão para o prompt; MCP mais baixado (14.545). |
| postgresql-integration | `cli-tool/components/mcps/database/postgresql-integration.json` | Roda `npx @modelcontextprotocol/server-postgres`; o `env` traz uma string de conexão de exemplo para você trocar. |
| playwright-mcp | `cli-tool/components/mcps/browser_automation/playwright-mcp.json` | Automação de navegador por snapshots de acessibilidade, sem screenshots. |

### Mods (aitmpl.com/mods)

Plugins completos no layout `mods/` da Anthropic: `.claude-plugin/plugin.json`, `hooks/hooks.json` com `modules`, `hooks/*.ts|tsx`, types, tests e README. O CLI baixa o diretório pela API do GitHub (sem autenticação), valida `plugin.json` e `hooks.json` e grava em `.claude/skills/<nome>/` do projeto; o Claude Code carrega como `<nome>@skills-dir`, só em projeto confiável. 39 mods em 7 subcategorias (abaixo). Os três mais baixados: jev-skill-suggestion (1.365), jev-model-router (1.268) e prompt-cache-control (338 no catálogo e 339 no trending).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| aitmpl | `cli-tool/components/mods/productivity/aitmpl/README.md` | `/aitmpl` abre um painel lateral com o catálogo do site (busca, tipos, instalados, downloads) lendo o JSON público via `$.http.fetch`; navegar não gasta tokens. |
| agent-flow | `cli-tool/components/mods/ui/agent-flow/README.md` | Painel lateral com os agentes da sessão em árvore, o contexto passado a cada um e a resposta devolvida; vizinho direto da aba Agentes do csr-cockpit. |
| types/claude-code.d.ts | `cli-tool/components/mods/types/claude-code.d.ts` | Declaração de tipos de 651 KB gerada pelo `/plugin-types`; todo módulo é checado contra ela com `tsc` em CI. |

### Loops (aitmpl.com/loops, oculto no menu)

Markdown com frontmatter (name, description, category, interval, stop-condition, components: [agent:..., command:..., hook:...], tags) que descreve um objetivo recorrente; `--loop` instala o loop e os componentes referenciados, e a execução é um `/loop`. 18 itens em 3 categorias: engineering (13), evaluation (3), operations (2). Em `icons.ts` o tipo tem `hidden: true`, mas a rota `/loops` existe.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| docs-sweep-loop | `cli-tool/components/loops/engineering/docs-sweep-loop.md` | A cada 30 min compara a documentação com o código e abre um PR pequeno; para quando a doc cobre toda a API e o build passa sem avisos. |
| devils-advocate-loop | `cli-tool/components/loops/evaluation/devils-advocate-loop.md` | Contesta um desenho ou decisão a cada 15 min até cada objeção séria ser resolvida ou aceita com justificativa. |
| nightly-changelog-loop | `cli-tool/components/loops/operations/nightly-changelog-loop.md` | Atualiza o changelog a cada 24 h e avisa o time quando sai. |

### Templates (cli-tool/templates, só pelo CLI)

Configurações de projeto completas, aplicadas com `--template`. O catálogo tem 14 entradas: 6 por linguagem (common, go, javascript-typescript, python, ruby, rust, que são as 6 pastas em `cli-tool/templates/`) e 8 por framework (angular-app, django-app, fastapi-app, flask-app, node-api, rails-app, react-app, vue-app). Trazem `CLAUDE.md`, `.mcp.json` e, em alguns, `.claude/settings.json`. Não aparecem no menu do site, mas o `trending-data.json` lista downloads de templates.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| common/CLAUDE.md | `cli-tool/templates/common/CLAUDE.md` | Diretrizes universais: qualidade de código, fluxo git, documentação, testes e segurança. |
| javascript-typescript/.claude/settings.json | `cli-tool/templates/javascript-typescript/.claude/settings.json` | Settings de projeto para JS/TS (5 KB; não li o conteúdo). |
| python/CLAUDE.md | `cli-tool/templates/python/CLAUDE.md` | Guia de projeto Python (8,7 KB; não li o conteúdo). |

### Sandbox (cli-tool/components/sandbox, só pelo CLI)

Executar o Claude Code em ambiente isolado (`--sandbox e2b`; Cloudflare e Docker também existem na pasta). 25 arquivos na árvore (11 no catálogo): lançadores, monitores e `wrangler.toml`. O README mostra passar as chaves por argumento de linha de comando (`--e2b-api-key`, `--anthropic-api-key`).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| e2b-launcher.py | `cli-tool/components/sandbox/e2b/e2b-launcher.py` | Lançador Python que roda o Claude Code num sandbox E2B. |
| cloudflare/launcher.ts | `cli-tool/components/sandbox/cloudflare/launcher.ts` | Lançador TypeScript sobre um Worker da Cloudflare, com `monitor.ts` e `wrangler.toml`. |
| docker/Dockerfile | `cli-tool/components/sandbox/docker/Dockerfile` | Imagem para execução isolada, com `docker-launcher.js` e `execute.js`. |

### Plugins (aitmpl.com/plugins)

Diretório de 34 coleções externas de plugins, skills e marketplaces do GitHub, gerado offline por `scripts/generate_plugins_json.py` com o `gh` (limite de 50 plugins locais lidos por marketplace). Cada coleção tem slug, nome, autor, estrelas, tags, o que contém e o `plugin_manifest`. O site não instala nada; a página de cada coleção mostra `/plugin marketplace add` e `/plugin install`. As estrelas são as gravadas no `plugins.json` (a maior é everything-claude-code, 228.605; depois claude-mem, 86.873).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| Claude Plugins Official | `dashboard/public/plugins.json` | Coleção da Anthropic: 255 plugins e 31.988 estrelas segundo o arquivo. |
| Knowledge Work Plugins | `dashboard/public/plugins.json` | Coleção da Anthropic com 85 plugins e 22.535 estrelas segundo o arquivo. |
| Claude Code Plugins Plus Skills | `dashboard/public/plugins.json` | Maior em número de plugins no arquivo: 464. |

### Trending (aitmpl.com/trending)

Página React que lê `/trending-data.json` (cache de 1 h) e ordena por semana, mês ou total, por tipo, com países. Cada tipo traz só os 10 itens mais baixados da semana. O arquivo é gerado por `scripts/generate_trending_data.py` a partir da tabela `component_downloads` do Supabase. No WebFetch a página só mostra "Loading", porque os dados chegam por JavaScript.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| globalStats | `dashboard/public/trending-data.json` | Em 04/10/2026 04:08 UTC: 2.164 componentes, 1.571.624 downloads, 81.479 no mês, 16.589 na semana, 741 hoje, 190 países. |
| topCountries | `dashboard/public/trending-data.json` | Estados Unidos 197.659 (12,6%), Brasil 86.406 (5,5%), Coreia do Sul 54.901, Espanha 51.818, Turquia 48.072. |
| TrendingView | `dashboard/src/components/TrendingView.tsx` | Interface com abas por tipo (all, skills, agents, commands, settings, hooks, mcps, mods) e período. |

### Jobs (aitmpl.com/jobs, rótulo New)

Lista de vagas que mencionam Claude Code, raspadas por `scripts/generate_claude_jobs.py` de fontes gratuitas e gravadas em `claude-jobs.json` (cache de 1 h). Em 04/10/2026: 86 vagas (Hacker News 42, Anthropic 41, WeWorkRemotely 2, RemoteOK 1). Aparece também como barra lateral na home.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| collect_hn_firebase / collect_hn_algolia | `scripts/generate_claude_jobs.py` | Lê os comentários dos fios "Who is Hiring" do Hacker News e filtra os que citam Claude Code. |
| collect_anthropic_careers | `scripts/generate_claude_jobs.py` | Consulta a API Greenhouse da Anthropic, pré-filtra por título e confere se a descrição cita Claude Code. |
| JobsView | `dashboard/src/components/JobsView.tsx` | Tela de listagem de vagas (companhia, posição, local, remoto, salário, tags, link de candidatura). |

### Blog (aitmpl.com/blog)

28 artigos listados em `blog-articles.json` (atualizado em 20/09/2026), quase todos fichas de um componente com o comando de instalação. O site serve `dashboard/public/blog/`, não `docs/blog/`; o CLAUDE.md admite que três artigos ficaram encalhados na pasta errada. Um comando e um agente do próprio repositório geram os artigos.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| function-hooks-claude-code | `dashboard/public/blog/function-hooks-claude-code` | Artigo "Claude Code Function Hooks: How to Enable Them and Write Your First TypeScript Hook". |
| performance-budget-guard-hook | `dashboard/public/blog/performance-budget-guard-hook` | Ficha do hook performance-budget-guard. |
| create-blog-article | `.claude/commands/create-blog-article.md` | Comando que gera capa por IA, HTML com SEO e a entrada no índice de artigos. |

### Docs (docs.aitmpl.com)

Site de documentação em Mintlify com 56 páginas (índice `llms.txt`): introdução, conceitos, guias, ferramentas, avançado, componentes, categorias, CLI, API e contribuição. O índice não lista páginas dedicadas a Skills, Mods nem Loops. As contagens da doc ("900+" na introdução, "1000+" na visão geral dos componentes, "2700+" skills) não batem com o catálogo. O código-fonte não está neste repositório.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| CLI Flags Reference | `https://docs.aitmpl.com/cli/flags.md` | Lista as flags do CLI. |
| Environment Variables | `https://docs.aitmpl.com/cli/environment-variables.md` | Variáveis de ambiente do CLI (nesta lista entram as de opt-out de telemetria, segundo o código). |
| Track Download | `https://docs.aitmpl.com/api/track-download.md` | Documenta o endpoint que registra cada instalação. |

### GitHub (botão e repositório)

Botão no topo com a contagem de estrelas. O número vem do navegador (api.github.com, cache de 1 h no localStorage) com valor fixo de reserva (30.809, conferido em 19/09/2026), por isso o site mostra 30,8k enquanto a API dá 32.375 hoje. Repositório MIT, 214 inscritos, 131 contribuidores, último push em 04/10/2026.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| github-stars.ts | `dashboard/src/lib/github-stars.ts` | Busca, cacheia e formata a contagem de estrelas, com `FALLBACK_STARS`. |
| CHANGELOG.md | `CHANGELOG.md` | Registra o CVE do `--studio` (1.29.4) e a lista de mudanças. |
| SECURITY.md | `SECURITY.md` | Política de reporte por e-mail e por GitHub Security Advisories. |

### Página de componente (`/component/<tipo>/<categoria>/<nome>`)

Rota SSR que escolhe o tipo pelo primeiro segmento (singular ou plural), acha o item em `components.json` e busca o conteúdo em `/component-content/<tipo>/<slug>.json`. Mostra comando `npx` com a flag do tipo, botão Copy, selo de downloads, cartões de frontmatter, sumário, `JsonViewer` ou `MarkdownViewer`, `SkillExplorer`, "View on GitHub", botão de salvar em coleção e terminal animado. Para loops, lista os componentes referenciados.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| getInstallCommand | `dashboard/src/lib/data.ts` | Monta `npx claude-code-templates@latest --<flag> <categoria/nome>` para cada tipo. |
| context-monitor (ficha) | `https://www.aitmpl.com/component/setting/statusline/context-monitor` | Mostra o comando `--setting statusline/context-monitor` e o JSON; autor, versão e licença vêm vazios no catálogo. |
| secret-redactor (ficha de mod) | `https://www.aitmpl.com/component/mod/security/secret-redactor` | Mostra `--mod security/secret-redactor`, módulos e opções; o resumo do WebFetch chamou o contador (39) de "security rating", mas é o total de downloads. |

### Stack Builder (carrinho)

Painel lateral e botão flutuante "Stack". Guarda itens em `localStorage` (`claudeCodeCart`), agrupa por tipo e gera um único comando `npx` com `--agent`, `--command`, `--setting`, `--hook`, `--mcp`, `--skill`, `--loop`, `--mod` e `--template`; permite copiar e compartilhar no X. Não há servidor envolvido.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| generateCommand | `dashboard/src/components/CartSidebar.tsx` | Concatena as flags e os caminhos limpos (sem `.md`/`.json`) num só comando, separando itens por vírgula. |
| migrate (function-hooks para mods) | `dashboard/src/components/CartSidebar.tsx` | Migra carrinhos salvos antes da renomeação de function-hooks para mods. |

### Busca ⌘K

Modal aberto por ⌘K ou Ctrl+K, ou pelo botão do topo. Carrega `search-index.json` (1,15 MB, só type, name, path, description, category) e filtra no navegador. Pode inserir resultado patrocinado se `PUBLIC_ADS_ENABLED` for `true` no build; essa variável está comentada em `dashboard/wrangler.toml`, então nenhuma requisição de anúncio é feita.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| SearchModal | `dashboard/src/components/SearchModal.tsx` | Atalho, índice carregado sob demanda, seleção por teclado. |
| ads.ts | `dashboard/src/lib/ads.ts` | Lê `/api/ads/active` e posiciona o item patrocinado; sem a flag, devolve lista vazia. |

### Contadores do topo (Downloads, Component PRs, npm Installs)

Três números na home. Cada um é uma função do relógio UTC: base medida mais dias decorridos vezes uma taxa por dia, com animação de odômetro. Não consultam banco nem API em tempo real. Sementes: downloads 1.340.064 (05/07/2026, 3.300 por dia), PRs 270 (18/09/2026, 1,8 por dia), npm 239.282 (18/09/2026, 466 por dia). A página buscada pelo WebFetch mostrou exatamente essas sementes.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| HOME_STATS e statValueAt | `dashboard/src/lib/home-stats.ts` | Define as sementes e a fórmula; o comentário explica como remedir (git, API do npm, `trending-data.json`). |
| HomeStats | `dashboard/src/components/HomeStats.tsx` | Renderiza os dígitos como odômetro. |

### Conta: coleções e enviar como PR (Clerk e Neon)

Login Clerk habilita "My Components": coleções pessoais salvas no Neon (`user_collections`, `collection_items`), compartilhamento por `/c/<slug>` e envio da coleção como PR para um repositório do usuário, trocando o código OAuth do GitHub por token em `/api/github/token`. O PR grava cada tipo numa pasta: agentes em `.claude/agents/`, comandos em `.claude/commands/`, skills em `.claude/skills/<nome>/SKILL.md` (só o `SKILL.md`), mods em `.claude/skills/<nome>/`, loops em `.claude/loops/` (não verifiquei se o Claude Code lê essa pasta), hooks em `.claude/hooks/<nome>.json`, settings em `.claude/settings/<nome>.json` e MCPs em `.mcp-components/<nome>.json`. Hooks, settings e MCPs vão para pastas que a documentação de configuração não lista (a de settings não cita `.claude/settings/`; o próprio código comenta que o JSON de settings "deveria ser mesclado" no `settings.json`). No envio de mods, rejeita caminhos com `..` ou absolutos.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| collections API | `dashboard/src/pages/api/collections/index.ts` | Lista e cria coleções do usuário autenticado. |
| SendToRepoModal | `dashboard/src/components/SendToRepoModal.tsx` | Fluxo conectar, escolher repositório, criar PR; mapeia cada tipo para uma pasta do repositório de destino. |
| token exchange | `dashboard/src/pages/api/github/token.ts` | Troca o código OAuth por `access_token` no servidor, com o client secret em variável de ambiente. |

### Outras páginas do dashboard

Páginas e endpoints que não aparecem no menu: `/live-task` (painel "Component Review Loop", que acompanha o ciclo automático de revisão de componentes; os endpoints `api/live-task/*` leem e gravam no Neon e o de controle aceita só um e-mail fixo), `/my-components`, `/featured/<slug>`, `/github-callback` e `/sitemap.xml`. Há ainda `api/track-website-events` (aceita eventos de busca, carrinho, visualização de componente e cópia de comando, com `visitor_id`, `session_id`, `screen_width` e `referrer`, e grava no Neon); não achei, em `dashboard/src`, nenhum código que chame esse endpoint. Há também a página estática legada `docs/claude-prs/index.html`.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| live-task | `dashboard/src/pages/live-task.astro` | Página "Component Review Loop"; o script `scripts/run-review-cycle.sh` dispara um ciclo manualmente. |
| track-website-events | `dashboard/src/pages/api/track-website-events.ts` | Valida até 50 eventos por lote e grava no Neon. |
| claude-prs | `scripts/generate_claude_prs.py` | Lista PRs cujo branch começa com `claude/` em `docs/claude-prs/data.json`. |

### WebMCP (ferramentas para agentes de navegador)

Registro (flag `PUBLIC_WEBMCP_ENABLED`, ligada no `dashboard/wrangler.toml`) de ferramentas somente leitura em `document.modelContext`, para agentes de navegador buscarem componentes e obterem o comando de instalação sem raspar a interface. As que devolvem texto da comunidade levam `untrustedContentHint` para o agente tratar como dado.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| search-components | `dashboard/src/lib/webmcp.ts` | Busca no `search-index.json`. |
| get-component-details, get-install-command, get-catalog-stats | `dashboard/src/lib/webmcp.ts` | Devolvem detalhes, comando de instalação e estatísticas do catálogo. |
| webmcp.md | `dashboard/docs/webmcp.md` | Explica a arquitetura, a flag e a lista de ferramentas. |

### dashboard/ (o site)

Astro 5 com ilhas React 19 e Tailwind 4, saída server no adaptador Cloudflare Pages (projeto `aitmpl-dashboard`, serve www e app.aitmpl.com). 2.101 arquivos, dos quais 1.908 são `component-content` gerado e 83 são código em `src/`. Rotas de API em `src/pages/api` (download, outcome, Discord, health, claude-code-check, coleções, anúncios, live-task, eventos do site). JSON estático com cache de 24 h e CORS `*` em `public/_headers` (exceto `trending-data.json` e `claude-jobs.json`, com 1 h).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| `[type]/[...slug].astro` | `dashboard/src/pages/component/[type]/[...slug].astro` | Página de componente. |
| _headers e _redirects | `dashboard/public/_headers` | Cache e CORS abertos nos JSON, mais cabeçalhos de segurança; `_redirects` mantém URLs antigas de function-hooks apontando para mods. |
| track-download-supabase | `dashboard/src/pages/api/track-download-supabase.ts` | Grava cada instalação (tipo, nome, caminho, categoria, versão do CLI, user-agent, IP e país) no Supabase. |

### scripts/

22 arquivos de geração e manutenção. Os geradores produzem os JSON do site; há validação, varredura de skills, deploy, sincronia de versões e arte de blog. `deploy.sh` e `sync-api.sh` ainda falam de Vercel, enquanto o deploy real é o workflow `deploy.yml` (Cloudflare Pages).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| generate_components_json.py | `scripts/generate_components_json.py` | Varre components e templates, parseia frontmatter, soma downloads do Supabase e roda a auditoria de segurança. |
| generate_plugins_json.py | `scripts/generate_plugins_json.py` | Lê via `gh` as `.claude-plugin/` de uma lista fixa de repositórios e monta `plugins.json` (limite de 50 plugins locais por marketplace). |
| generate_trending_data.py | `scripts/generate_trending_data.py` | Pagina a tabela de downloads e gera `trending-data.json`. |
| generate_claude_prs.py | `scripts/generate_claude_prs.py` | Busca os PRs do repositório na API do GitHub e guarda os de branch `claude/*` em `docs/claude-prs/data.json`. |
| validate_components.py | `scripts/validate_components.py` | Adapta o layout aninhado do catálogo para o `claude plugin validate`. |
| skillspector_scan.py | `scripts/skillspector_scan.py` | Orquestra o SkillSpector (modo `--no-llm`) sobre as skills e gera resumo em Markdown e SARIF. |

### cloudflare-workers/

5 Workers (30 arquivos) fora do projeto Pages: `crons` chama `/api/claude-code-check` a cada 30 min e `/api/health-check` a cada hora; `pulse` manda relatório semanal por Telegram (domingo 14:00 UTC); `daily-health-report` manda resumo diário (14:00 UTC); `newsletter` com Resend, pausada em 20/09/2026; `docs-monitor` desativado em 07/2026. Sentry por cliente HTTP próprio, sem SDK.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| crons | `cloudflare-workers/crons/index.js` | Dispara os endpoints do dashboard com `TRIGGER_SECRET`. |
| pulse | `cloudflare-workers/pulse/index.js` | Coleta GitHub, Discord, Supabase, npm e Analytics e envia o relatório de domingo. |
| newsletter | `cloudflare-workers/newsletter/index.js` | Compõe o e-mail semanal de componentes em alta; `NEWSLETTER_ENABLED=false`. |

### database/ (Neon)

Duas migrações SQL em `database/migrations` para o Neon: versões do Claude Code (com mudanças do changelog e log de notificações Discord) e uso de comandos do CLI. Os downloads ficam no Supabase, fora deste repositório.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| 001_create_claude_code_versions.sql | `database/migrations/001_create_claude_code_versions.sql` | Cria `claude_code_versions`, `claude_code_changes`, `discord_notifications_log` e `monitoring_metadata`. |
| 002_create_command_usage_logs.sql | `database/migrations/002_create_command_usage_logs.sql` | Cria `command_usage_logs` e `command_usage_stats` (comando, versão do CLI e do Node, plataforma, arquitetura, sessão) e um gatilho que atualiza as estatísticas. |

### docs/ (site legado e blog)

123 arquivos: site estático antigo (`index.html`, `component.html`, js, css), `docs/blog` com 48 arquivos, `components.json` completo (2,19 MB, com content e security), `claude-jobs.json` e `claude-prs/`. Segundo o CLAUDE.md, não é mais publicado no www; o GitHub Pages ainda o serve em davila7.github.io/claude-code-templates.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| components.json | `docs/components.json` | Catálogo completo, fonte da verdade do gerador (a cópia do dashboard não leva content nem security). |
| README.md | `docs/README.md` | Descreve o site estático antigo (cards gerados de `templates.js`). |

### .github/workflows/

19 workflows: validação (component-validate, component-security-validation, skill-security-scan e skill-security-scan-all, mods-typecheck, generated-files-guard), dados (update-json-data diário, update-component-content), deploy, quatro avisos diários no Discord, estrelas (star-history) e build do CLI em Rust.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| component-validate.yml | `.github/workflows/component-validate.yml` | Instala `@anthropic-ai/claude-code` e roda `claude plugin validate` nos agentes, comandos, skills, hooks e MCPs que o PR toca (bloqueia) e no catálogo inteiro toda segunda às 06:00 UTC (só relata). Mods ficam com o `mods-typecheck.yml`; settings e loops não têm validador. |
| update-json-data.yml | `.github/workflows/update-json-data.yml` | Cron diário às 03:00 UTC que regenera catálogo, trending e vagas e comita. |
| generated-files-guard.yml | `.github/workflows/generated-files-guard.yml` | Falha PRs de não mantenedores que mexem em arquivos gerados. |
| component-security-validation.yml | `.github/workflows/component-security-validation.yml` | Auditoria de segurança, mas só dispara em `cli-tool/components/**/*.md` e em `cli-tool/src/validation/**`. |
| skill-security-scan.yml | `.github/workflows/skill-security-scan.yml` | SkillSpector nas skills alteradas; bloqueia o PR se o risco passar de 50. |

### cli-tool/ (o CLI npx claude-code-templates 1.29.6)

Node.js com commander, inquirer e @clack/prompts. Além de instalar (`--agent`, `--command`, `--mcp`, `--setting`, `--hook`, `--skill`, `--loop`, `--mod`, `--template`, `--workflow`), traz `--analytics`, `--chats` com `--tunnel`, `--health-check`, `--plugins`, `--skills-manager`, `--teams`, `--studio`, `--sandbox`, agentes globais (`--create-agent`, `--list-agents`), `--clone-session`, `--yes` e `--dry-run` (a checagem de dry-run está no fluxo de configuração de projeto; não vi nas instalações individuais). Baixa tudo de raw.githubusercontent.com na branch main. Envia telemetria por padrão (opt-out: `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| installIndividualSetting | `cli-tool/src/index.js` | Baixa JSON e script, mescla em `settings(.local).json` com checagem de conflito e grava o script em `.claude/scripts`. |
| installIndividualMod | `cli-tool/src/index.js` | Baixa o diretório do mod pela API do GitHub (sem autenticação), valida `plugin.json` e `hooks.json` e grava em `.claude/skills/<nome>/`. |
| tracking-service | `cli-tool/src/tracking-service.js` | Envia downloads, uso de comandos e resultado de instalação a aitmpl.com. |
| validation/ | `cli-tool/src/validation/README.md` | Auditoria de segurança em 5 níveis (estrutura, integridade, semântica, referências, proveniência) com nota de 0 a 100. |

### cli-rust/

Port em Rust do núcleo do CLI (instalação de agentes, comandos, MCPs, settings, hooks e skills), preview v0.1.0, com paridade byte a byte declarada; o resto é delegado ao CLI Node. Instalação por script `curl | sh`, cargo-binstall ou a partir do código; Homebrew e npm marcados como planejados.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| README | `cli-rust/README.md` | Uso e arquitetura; o opt-out aqui é `CCT_NO_TRACKING=1`. |
| build-rust-cli.yml | `.github/workflows/build-rust-cli.yml` | Build dos binários. |

### .claude/ (configuração do próprio repositório)

23 arquivos que o Claude Code usa ao trabalhar nesse repo: 15 agentes (component-reviewer, deployer, blog-writer, catalog-generator...), 3 comandos, um hook de Telegram para PR, 3 regras com `paths` no frontmatter e `launch.json` do preview.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| component-reviewer | `.claude/agents/component-reviewer.md` | Revisa formato, nomes, segredos e caminhos de agentes, comandos, MCPs, hooks, settings, skills e loops; o CLAUDE.md manda usá-lo em toda mudança de componente (o arquivo do agente não trata mods). |
| dashboard.md | `.claude/rules/dashboard.md` | Regra com `paths: dashboard/**` que só vale ao mexer nessa pasta. |
| telegram-pr-webhook.py | `.claude/hooks/telegram-pr-webhook.py` | Avisa no Telegram quando um `gh pr create` roda; usa as variáveis `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`. |

### Settings: statusline

Barras de status (`statusLine` com `type: command`). 32 itens: simples (minimal, git-branch, colorful, time, project-info), com script `.py` (context-monitor, deadline-countdown, worktree-context-statusline), monitores de deploy (Vercel, Cloudflare Pages, Neon) e vários de brincadeira (tamagotchi, RPG, jardim).

| Nome | Caminho | O que faz |
| --- | --- | --- |
| context-monitor | `cli-tool/components/settings/statusline/context-monitor.json` | Monitor de contexto, custo, duração e linhas; ver explicação acima. |
| git-branch-statusline | `cli-tool/components/settings/statusline/git-branch-statusline.json` | Comando bash em linha com `jq`: modelo, pasta, branch e número de alterações. |
| worktree-context-statusline | `cli-tool/components/settings/statusline/worktree-context-statusline.py` | Usa `context_window.used_percentage` e `context_window_size` do JSON do Claude Code; mostra o projeto principal quando está em worktree. |
| zero-config-deployment-monitor | `cli-tool/components/settings/statusline/zero-config-deployment-monitor.json` | Lê o token da Vercel em `~/.config/vercel/auth.json` (ou o equivalente do sistema) e consulta api.vercel.com a cada atualização. |

### Settings: permissions

Regras `permissions.allow` e `deny` prontas, que o CLI funde com as existentes sem duplicar. 6 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| deny-sensitive-files | `cli-tool/components/settings/permissions/deny-sensitive-files.json` | Nega Read em `./.env`, `./.env.*`, `./secrets/**` e `./config/credentials.json`. |
| allow-git-operations | `cli-tool/components/settings/permissions/allow-git-operations.json` | Permite git status, diff, add, commit, push, pull e log; a regra `git push:*` também cobre push forçado. |
| read-only-mode | `cli-tool/components/settings/permissions/read-only-mode.json` | Só leitura. |

### Settings: environment

Variáveis de ambiente (`env`) para timeouts, desempenho e privacidade. 5 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| privacy-focused | `cli-tool/components/settings/environment/privacy-focused.json` | Desliga telemetria, relatório de erros, comando de bug, autoupdater e tráfego não essencial. |
| bash-timeouts | `cli-tool/components/settings/environment/bash-timeouts.json` | Timeouts do Bash para comandos longos não travarem. |
| friday-deploy-warning | `cli-tool/components/settings/environment/friday-deploy-warning.json` | Troca os verbos do spinner por um lembrete de não fazer deploy na sexta. |

### Settings: global

Chaves de nível global: estilo de saída, anúncios, tips, commit. 6 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| concise-mode | `cli-tool/components/settings/global/concise-mode.json` | Define `outputStyle` Concise e desliga dicas do spinner, resumo ao voltar e verbose. |
| git-commit-settings | `cli-tool/components/settings/global/git-commit-settings.json` | Controla a linha de co-autoria nos commits (`includeCoAuthoredBy`). |
| company-announcements | `cli-tool/components/settings/global/company-announcements.json` | Mensagens de aviso da empresa na abertura. |

### Settings: api

Provedores e rede: Bedrock, Vertex AI, proxy corporativo e cabeçalhos customizados, tudo via `env`. 4 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| bedrock-configuration | `cli-tool/components/settings/api/bedrock-configuration.json` | Usa Amazon Bedrock como origem dos modelos. |
| vertex-configuration | `cli-tool/components/settings/api/vertex-configuration.json` | Usa Google Vertex AI e configura os modelos Claude disponíveis. |
| corporate-proxy | `cli-tool/components/settings/api/corporate-proxy.json` | `HTTP_PROXY` e `HTTPS_PROXY` de exemplo (proxy.company.com). |

### Settings: mcp

Controle de quais servidores MCP do projeto ficam ativos e seus timeouts. 4 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| enable-specific-servers | `cli-tool/components/settings/mcp/enable-specific-servers.json` | Ativa só servidores listados em `enabledMcpjsonServers`. |
| disable-risky-servers | `cli-tool/components/settings/mcp/disable-risky-servers.json` | Lista de servidores desativados em `disabledMcpjsonServers`. |
| enable-all-project-servers | `cli-tool/components/settings/mcp/enable-all-project-servers.json` | Aprova sem perguntar todos os servidores do `.mcp.json` do projeto, o que dispensa a confirmação de segurança. |

### Settings: telemetry

Liga, desliga ou redireciona a telemetria do Claude Code, via `env`. 4 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| disable-telemetry | `cli-tool/components/settings/telemetry/disable-telemetry.json` | `DISABLE_TELEMETRY=1`. |
| langsmith-tracing | `cli-tool/components/settings/telemetry/langsmith-tracing.json` | Envia traces da conversa ao LangSmith; exige conta e chave. |

### Settings: authentication

Forma de login e geração de chave. 3 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| api-key-helper | `cli-tool/components/settings/authentication/api-key-helper.json` | `apiKeyHelper` aponta um script que gera tokens temporários, com TTL de 1 h. |
| force-claudeai-login | `cli-tool/components/settings/authentication/force-claudeai-login.json` | Restringe o login a contas Claude.ai (`forceLoginMethod`). |
| force-console-login | `cli-tool/components/settings/authentication/force-console-login.json` | Restringe o login a contas do Console da Anthropic. |

### Settings: cleanup

Retenção de transcritos (`cleanupPeriodDays`). 2 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| retention-7-days | `cli-tool/components/settings/cleanup/retention-7-days.json` | `cleanupPeriodDays: 7`, por privacidade. |
| retention-90-days | `cli-tool/components/settings/cleanup/retention-90-days.json` | `cleanupPeriodDays: 90`. |

### Settings: model

Fixa o modelo padrão. 2 itens, ambos com ID de modelo cravado.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| use-sonnet | `cli-tool/components/settings/model/use-sonnet.json` | `model: claude-sonnet-4-6`. |
| use-haiku | `cli-tool/components/settings/model/use-haiku.json` | `model: claude-haiku-4-5-20251001`. |

### Settings: partnerships

Provedores alternativos de parceiros: troca `ANTHROPIC_BASE_URL` para um endpoint de terceiro e traz texto promocional e link de indicação. 2 itens.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| glm-coding-plan | `cli-tool/components/settings/partnerships/glm-coding-plan.json` | Aponta para api.z.ai com modelos GLM e um cupom de 10% no texto; seus prompts passam a ir a outro provedor. |
| minimax-provider | `cli-tool/components/settings/partnerships/minimax-provider.json` | Aponta para a API compatível do MiniMax. |

### Settings: git

Um único item, configuração completa de Git Flow.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| git-flow-settings | `cli-tool/components/settings/git/git-flow-settings.json` | Combina `statusLine`, `permissions` (nega push em main e develop, push forçado e reset --hard), `env` e um hook PreToolUse que valida nomes de branch lendo `$CLAUDE_TOOL_COMMAND`, variável que a documentação de hooks não lista (não testado). |

### Settings: hooks

Um único item: hooks declarados dentro de uma setting.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| subagent-lifecycle-logger | `cli-tool/components/settings/hooks/subagent-lifecycle-logger.json` | SubagentStart e SubagentStop acrescentam uma linha JSON com agente e hora em `.claude/agent-log.jsonl`; o nome vem de `${CLAUDE_AGENT_NAME:-unknown}`, variável que a documentação de hooks não lista (sem ela grava "unknown"; não testado). |

### Mods: games

15 mods de jogos que rodam acima do prompt enquanto o Claude trabalha: 2048, cc-arcade, chess, diff-invaders, doom, flappy, invaders, minesweeper, pacman, pet, pong, snake, tetris, tool-defense e typing-test. Representam 157 dos 294 arquivos de mods.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| cc-arcade | `cli-tool/components/mods/games/cc-arcade/README.md` | `/arcade` abre jogos acima do prompt; vendorizado de sezaakgun/cc-arcade (MIT) com a mudança local declarada; jogar não gasta tokens. |
| diff-invaders | `cli-tool/components/mods/games/diff-invaders` | Jogo do catálogo (pelo nome; não li). |
| tool-defense | `cli-tool/components/mods/games/tool-defense` | Jogo do catálogo (pelo nome; não li). |

### Mods: security

7 mods de guarda e filtro, quase todos com um hook `tool.call` que nega sem chamar `next` ou reescreve o resultado.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| secret-redactor | `cli-tool/components/mods/security/secret-redactor/hooks/secret-redactor.ts` | Troca chaves de AWS, Anthropic, OpenAI, GitHub, Google, Stripe, Slack, JWT, chaves privadas e strings de conexão por `[REDACTED:tipo]` antes do modelo ler, e recusa colar o marcador num comando Bash. |
| block-destructive-commands | `cli-tool/components/mods/security/block-destructive-commands/hooks/block-destructive-commands.ts` | Nega Bash com rm recursivo em raiz, home ou pasta atual, force push, reset --hard, DROP e TRUNCATE, mkfs, dd para /dev e chmod 777. |
| protected-paths-guard | `cli-tool/components/mods/security/protected-paths-guard/README.md` | Nega Edit, Write e NotebookEdit em `.env`, lockfiles, workflows de CI, internos do git e chaves privadas, com opções `protect` e `allow`. |
| jev-guardrails | `cli-tool/components/mods/security/jev-guardrails/README.md` | Envia cada prompt e cada resposta a um modelo de decisão da TypeSafe (ou ao gateway da Vercel) e aplica limiares seus. |

### Mods: productivity

6 mods de produtividade: painel de catálogo, roteamento de modelo, sugestão de skills, reescrita de comandos, linha do tempo da sessão e cache de WebFetch.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| session-time-machine | `cli-tool/components/mods/productivity/session-time-machine/README.md` | `/timemachine` desenha a sessão como linha do tempo e grava uma cópia cortada num ponto, com novo id, sem tocar na sessão atual. |
| webfetch-cache | `cli-tool/components/mods/productivity/webfetch-cache/README.md` | Responde WebFetch repetido (mesma URL e prompt) da sessão sem chamar a rede. |
| jev-skill-suggestion | `cli-tool/components/mods/productivity/jev-skill-suggestion/README.md` | Esconde o `skill_listing` do prompt e injeta só o `SKILL.md` escolhido (segundo o CLAUDE.md); o mod de maior download. |

### Mods: integrations

5 mods que ligam a sessão a serviços externos, quase todos com chave em `userConfig`: Linear, Neon, Vercel, Exa e o agente Pi.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| neon-branch-per-session | `cli-tool/components/mods/integrations/neon-branch-per-session/README.md` | Cria um branch Neon por sessão e ajusta `DATABASE_URL` para ele; o branch expira sozinho. |
| websearch-to-exa | `cli-tool/components/mods/integrations/websearch-to-exa/README.md` | Redireciona o WebSearch para a API da Exa, com volta ao embutido se faltar chave ou falhar. |
| vercel-deploys | `cli-tool/components/mods/integrations/vercel-deploys/README.md` | Acompanha deploys da Vercel na sessão (pelo nome e pelo código; li só o cabeçalho). |

### Mods: ui

3 mods que desenham painéis e badges na interface.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| agent-flow | `cli-tool/components/mods/ui/agent-flow/README.md` | Árvore de agentes com contexto de cada um. |
| git-sidebar | `cli-tool/components/mods/ui/git-sidebar/README.md` | Painel estilo lazygit com worktrees e branches clicáveis. |
| tool-timing-badge | `cli-tool/components/mods/ui/tool-timing-badge/README.md` | Badge colorido com a duração de cada chamada de ferramenta, vermelho acima de `slowMs` (padrão 5000). |

### Mods: observability

2 mods de observação.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| prompt-cache-control | `cli-tool/components/mods/observability/prompt-cache-control/README.md` | Medidor de cache acima do prompt: lido, escrito e sem cache por requisição, contagem regressiva até o cache expirar e dica entre continuar, `/compact` ou `/clear`. |
| universal-audit-log | `cli-tool/components/mods/observability/universal-audit-log/README.md` | Um hook em `*` grava uma linha JSON por evento, com origem, duração e se algo negou ou falhou. |

### Mods: enterprise

1 mod para administradores.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| admin-capability-lockdown | `cli-tool/components/mods/enterprise/admin-capability-lockdown/README.md` | Mod de nível organizacional: retira `http` e `process` de `$` para plugins abaixo, recusa plugins fora de uma lista e pode guardar o Bash. |

### Mods: types e raiz

Não é um mod: a pasta `types` guarda o `claude-code.d.ts`; a raiz tem `README.md` (layout, opções, typecheck) e `tsconfig.json` que cobrem todos os mods.

| Nome | Caminho | O que faz |
| --- | --- | --- |
| README.md | `cli-tool/components/mods/README.md` | Explica o layout, `userConfig` (string, number, boolean, directory, file) e o comando `tsc`. |
| tsconfig.json | `cli-tool/components/mods/tsconfig.json` | Config strict que cobre `hooks/` e `types/` de cada mod. |

## O que vale aproveitar

| Item | Por que vale | Esforço | Onde ver | Cuidado |
| --- | --- | --- | --- | --- |
| CI com `claude plugin validate` e `claude plugin test` no marketplace | O repositório deles roda o validador oficial só nos itens que o PR toca (bloqueia) e no catálogo inteiro toda segunda (só relata). Um workflow equivalente no claude-code-kit pegaria nome divergente entre `marketplace.json` e `plugin.json`, caminho com `..` e tipos quebrados antes de publicar. `claude plugin test [dir]` roda os arquivos `*.test.ts` e `*.test.tsx` do mod, e o csr-cockpit já tem quatro, com o comando documentado no README do kit. | baixo | `.github/workflows/component-validate.yml`; `scripts/validate_components.py`; https://code.claude.com/docs/en/plugins/cli-reference | O runner instala `@anthropic-ai/claude-code` por npm. O `validate` lê só arquivos dentro do marketplace. Não executei `claude plugin test` na suíte do csr-cockpit. |
| Agente revisor e checklist de mod no `.claude/` do próprio repositório | `component-reviewer.md` valida formato, kebab-case, segredos e caminhos absolutos. O CLAUDE.md deles acrescenta um checklist de mod: `name` igual ao diretório, `license`, `author` e `repository`, guardas que negam sem chamar `next`, nada de shell em `$.process.run`, opções em `userConfig`. Também usam `.claude/rules/*.md` com `paths` no frontmatter para carregar regras só por pasta. | baixo | `.claude/agents/component-reviewer.md`; `.claude/rules/dashboard.md`; CLAUDE.md (seção Mods) | Copie a ideia, não o texto: o CLAUDE.md descreve o fluxo deles (deployer, Cloudflare, Supabase). O checklist de mod existe só no CLAUDE.md; o arquivo do agente não trata mods. O checklist de guardas vale para mods que negam ou reescrevem chamadas; o csr-cockpit só observa. |
| Proveniência e atribuição por item | Todo mod deles declara `license`, `author` e `repository` no `plugin.json`; terceiros entram vendorizados com LICENSE e nota de mudança local (cc-arcade). O catálogo exibe autor, versão e licença do frontmatter, e o próprio context-monitor aparece sem nenhum deles, o que mostra o custo de não preencher. | baixo | `cli-tool/components/mods/games/cc-arcade/README.md`; `cli-tool/components/skills/ANTHROPIC_ATTRIBUTION.md` | Se o kit passar a aceitar código de terceiros, a conferência de licença é sua. As skills da Anthropic docx, pdf, pptx e xlsx são "Proprietary" ou source-available e não devem ser copiadas. |
| Catálogo JSON gerado do `marketplace.json`, sem site | A ideia central do site é arquivos como fonte da verdade e um script que gera `counts.json`, `search-index.json` e um JSON por item, servidos como estáticos com CORS aberto. No kit seria um script pequeno que gera `catalogo.json` e a tabela do README (os badges dinâmicos já leem o `marketplace.json`). O mod aitmpl mostra o consumo: um painel dentro do Claude Code lendo esse JSON com `$.http.fetch`. | médio | `scripts/generate_components_json.py`; `dashboard/public/_headers`; `cli-tool/components/mods/productivity/aitmpl/` | Arquivo gerado e commitado gera conflito entre PRs; por isso a regra deles proíbe contribuidor externo de commitar e há o `generated-files-guard.yml`. Só compensa se o kit passar de algumas dezenas de itens (hoje tem 9). |
| Receitas de settings no README (statusLine, permissões, privacidade) | Plugin não distribui `statusLine`, `permissions`, `env`, `model` nem `cleanupPeriodDays`: só `agent` e `subagentStatusLine` valem. O catálogo deles resolve com JSON pequeno que o CLI mescla. Para o kit, uma seção com trechos para colar no `settings.json` de usuário (deny-sensitive-files, read-only-mode, privacy-focused, retention-7-days) cobre a lacuna sem CLI. | baixo | `cli-tool/components/settings/permissions/deny-sensitive-files.json`; `settings/environment/privacy-focused.json`; `settings/cleanup/retention-7-days.json` | Revise antes de copiar: `allow-git-operations` libera `Bash(git push:*)`, que inclui push forçado, apesar da descrição; `model/use-sonnet.json` crava `claude-sonnet-4-6`, que envelhece; `partnerships/*` redireciona o endpoint para terceiros com link de indicação; `mcp/enable-all-project-servers` dispensa a confirmação dos servidores do projeto. |
| Uma statusline moderna como exemplo e como post | O context-monitor é a setting mais baixada e está defasado (200.000 fixo, leitura do transcript). O `worktree-context-statusline.py` do mesmo repositório já usa `context_window.used_percentage`, e a documentação traz ainda `rate_limits` e `prompt_cache`. Um exemplo curto no kit, comparado ao csr-cockpit (pílulas de contexto, custo, limites e cache), dá um post sobre o que o Claude Code entrega ao `statusLine`. | baixo | `cli-tool/components/settings/statusline/worktree-context-statusline.py`; https://code.claude.com/docs/en/statusline | `statusLine` mora no settings do usuário ou do projeto, não em plugin. `prompt_cache` e `spend_limit` pedem v2.1.251 ou mais nova (e `used_usd` v2.1.284): reler a doc na data do post. |
| Mods da casa como referência para novos mods e para o post | 39 mods com README padronizado, tipos e testes. Parecidos com o csr-cockpit: agent-flow, git-sidebar, tool-timing-badge, prompt-cache-control, session-time-machine e aitmpl. Os de guarda (secret-redactor, block-destructive-commands, protected-paths-guard, large-edit-confirmation) mostram o outro lado, negar ou reescrever chamadas, que o csr-cockpit deliberadamente não faz. | médio | `cli-tool/components/mods/` | Leia o código antes de adotar: jev-guardrails envia cada prompt e resposta a um serviço de terceiros; websearch-to-exa, linear-tickets, vercel-deploys e neon-branch-per-session chamam APIs externas com chave. O `d.ts` deles foi gerado numa versão específica (o CLAUDE.md cita 2.1.283), e a máquina está na 2.1.289. |
| Seção "quando o mod parece mudo" (4 causas) | O CLAUDE.md lista, em ordem de probabilidade: projeto não confiável (mod em `.claude/skills` só carrega depois do trust prompt, e `claude -p` nunca o mostra); procurar no lugar errado (`$.ui.log` vai para `~/.claude/debug/<id>.txt` e não há transcript em `-p`); opções sob a chave errada de `pluginConfigs`; function hooks desligados em versões anteriores à 2.1.287. Serve de README e de post. | baixo | CLAUDE.md (seção "Debugging a mod that seems silent") | Verificado por eles em 19/09/2026 na 2.1.278; na 2.1.289 a causa 4 não se aplica. Para mod instalado por marketplace a chave de `pluginConfigs` deveria ser o id completo (`nome@cesarschutz`): é inferência, não verificada. |
| Loops como mais um tipo de exemplo | Um loop é um Markdown com objetivo, intervalo, condição de parada e lista de componentes; o CLI instala o loop e o que ele referencia, e a execução é um `/loop <intervalo> "<instrução>"`. Cabe um exemplo no pacote "exemplos" (por exemplo uma revisão adversarial usando o agente `critico`). | baixo | `cli-tool/components/loops/evaluation/devils-advocate-loop.md` | Loop autônomo gasta tokens a cada passada (os exemplos vão de 15 min a 24 h); documente a condição de parada. |
| Pacote-guia (meta-plugin) no lugar do Stack Builder | O Stack Builder gera um único comando com vários componentes. O equivalente sem site é um plugin "kit" cujo `plugin.json` tenha só `name` e uma lista `dependencies`: instalá-lo instala todas as dependências. | médio | https://code.claude.com/docs/en/plugins/dependencies.md | Sem restrição de versão a dependência acompanha a última versão do marketplace; com `version` (faixa semver) a dependência precisa ter tags git. Dependências no mesmo marketplace se resolvem pelo nome. |
| Bloco de instalação em duas linhas por item | A página de cada coleção do aitmpl mostra `/plugin marketplace add <dono>/<repo>` e `/plugin install <plugin>@<marketplace>`; é o mesmo fluxo nativo que o kit usa. Repetir esse bloco no README de cada item reduz dúvida. | baixo | `dashboard/src/pages/plugins/[slug].astro` | O nome do marketplace do kit é `cesarschutz`. |
| Varredura estática de skills no CI (SkillSpector) | O repositório roda o SkillSpector (NVIDIA, Apache-2.0, 71 padrões de vulnerabilidade segundo o README dele, modo `--no-llm`) nas skills alteradas e bloqueia PR com risco acima de 50. | médio | `scripts/skillspector_scan.py`; `.github/workflows/skill-security-scan.yml` | Exige Python 3.12+ e instala da branch main do GitHub (o nome `skillspector` dá 404 no PyPI). Com duas skills de exemplo é exagero hoje; reavalie se o kit crescer. |
| Zero telemetria como posição declarada | O CLI deles envia downloads (com IP e país gravados no servidor), uso de comandos e resultado de instalação. Um marketplace por git não precisa de nada disso; dizer no README "sem telemetria, sem build, sem dependência" é diferencial. | baixo | `cli-tool/src/tracking-service.js`; `dashboard/src/pages/api/track-download-supabase.ts` | Não copiar o tracking. Para contagem, use o que o próprio GitHub já dá (estrelas, clones, releases). |
| Uma ficha de blog por item do kit | O blog deles tem 28 artigos, quase todos fichas de um componente com o comando de instalação. Cada item do kit pode ganhar uma ficha curta no blog do Cesar (problema, comando, exemplo) apontando para o repositório. | baixo | `dashboard/public/blog/blog-articles.json`; `.claude/commands/create-blog-article.md` | Eles automatizam capa por IA e precisam espelhar `docs/` e `dashboard/public/` à mão (três artigos ficaram encalhados). O Cesar não precisa dessa automação. |

## Cuidados

- **Telemetria ligada por padrão.** `cli-tool/src/tracking-service.js` envia downloads (tipo, nome, versão do CLI), uso de comandos (versão do Node, plataforma, arquitetura, id de sessão) e resultado de instalação (inclusive mensagem de erro). O servidor (`dashboard/src/pages/api/track-download-supabase.ts`) grava IP, país (cabeçalho `x-vercel-ip-country`, próprio da Vercel; o site hoje roda no Cloudflare Pages, então não verifiquei se o país ainda é preenchido) e user-agent na tabela `component_downloads`. `.github/WORKFLOWS_REFERENCE.md` diz "Completely anonymous, no personal data collected", o que não combina com guardar IP. O opt-out do Node exige a string `true` (`CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`); o README do cli-rust diz `CCT_NO_TRACKING=1`, que o código Node não reconhece. Existe também o endpoint `api/track-website-events` (busca, carrinho, visualização, cópia de comando, com `visitor_id`), sem chamador achado em `dashboard/src`.
- **Contadores do topo são extrapolações por fórmula** (`home-stats.ts`), não leituras ao vivo. Hoje a fórmula dá mais de 1,64 milhão de downloads, e o `trending-data.json` de hoje registra 1.571.624. Todos os números do site citados aqui são "números informados pelo site em 04/10/2026". As contagens de componentes divergem entre as fontes: README "100+", título do site "1000+", docs.aitmpl.com "900+" (introdução), "1000+" (visão geral dos componentes) e "2700+" skills, CLAUDE.md "Agents (600+), Commands (200+), MCPs (55+), Settings (60+), Hooks (39+), Mods (10)", `trending-data.json` 2.164, soma do `counts.json` 1.921; o README do mod aitmpl mostra 1919 num exemplo de tela.
- **Instalação da branch main sem fixar versão ou hash:** cada `npx` baixa o que estiver na main naquele instante. Hooks e statuslines instalam scripts `.py` e `.sh` com `chmod 755` que rodam com seus privilégios. O instalador de mods usa a API do GitHub sem autenticação (limite de 60 requisições por hora por IP) e baixa o diretório do mod recursivamente. O workflow `component-security-validation.yml` só dispara em arquivos `.md`; hooks `.json`, `.py` e `.sh`, settings e mods `.ts` não passam por ele (mods têm só o `tsc`). O `component-validate.yml` diz no cabeçalho que o catálogo ainda tem erros conhecidos e não bloqueia a varredura completa.
- **Histórico de segurança:** o CHANGELOG registra um RCE sem autenticação no `--studio` (GHSA-79wm-x847-7cvg, CVSS 8.8), corrigido na 1.29.4 (13/07/2026). A documentação do sandbox mostra passar `--e2b-api-key` e `--anthropic-api-key` por argumento de linha de comando, o que expõe chaves ao histórico do shell e à lista de processos.
- **Licenças mistas num repositório declarado MIT:** o README diz que cada item mantém a licença original. `ANTHROPIC_ATTRIBUTION.md` marca docx, pdf, pptx e xlsx como source-available (o frontmatter do docx diz "Proprietary") e cita FFmpeg GPL v3 e fontes OFL entre as dependências. Não copiar skills em massa sem checar o LICENSE de cada uma.
- **Conteúdo comercial misturado ao catálogo:** o README abre com bloco patrocinado (Bright Data, com link de indicação e comando de instalação) e selo da Z.AI; `settings/partnerships/glm-coding-plan.json` aponta `ANTHROPIC_BASE_URL` para api.z.ai (seus prompts vão a outro provedor) e traz cupom no texto; a busca tem código de resultado patrocinado atrás de `PUBLIC_ADS_ENABLED` (desligado); `featured/*` são páginas de parceiros. Nada disso foi tratado como instrução; é promoção.
- **Credenciais e serviços de terceiros em componentes:** `statusline/zero-config-deployment-monitor.json` lê o token da Vercel de `~/.config/vercel/auth.json` (e equivalentes) e chama api.vercel.com a cada atualização; os mods jev-guardrails (envia cada prompt e resposta à TypeSafe), websearch-to-exa, linear-tickets, vercel-deploys e neon-branch-per-session usam APIs externas com chave; `settings/permissions/allow-git-operations.json` libera `git push:*` (inclui push forçado) apesar da descrição.
- **Componentes que dependem de variáveis que a documentação não lista:** `settings/git/git-flow-settings.json` lê `$CLAUDE_TOOL_COMMAND` e `settings/hooks/subagent-lifecycle-logger.json` lê `${CLAUDE_AGENT_NAME}`; nenhuma das duas aparece na documentação de hooks atual (a entrada chega como JSON no stdin), então podem não funcionar como descrito (não testei). O comando `generate-tests` executa `npm run test:coverage` do projeto ao ser aberto.
- **context-monitor está defasado:** 200.000 fixo, leitura das últimas 15 linhas do transcript com `readlines()` do arquivo inteiro, três chamadas `git` por atualização e um método 2 que depende de mensagens `system_message` com texto específico (não verifiquei se o Claude Code atual as emite). Em repositório grande o `git status --porcelain` a cada mensagem pode pesar (não medi). Autor, versão e licença estão vazios no catálogo.
- **Qualidade irregular do catálogo:** arquivo em pasta aninhada duplicada (`agents/business-marketing/cli-tool/components/...`), 10 scripts `.py` dentro de pastas de agentes, skills duplicadas (docx, docx-official, document-skills/docx), `CONTRIBUTING.md` desatualizado (cita categorias de agentes e comandos que não existem e mostra um agente sem frontmatter), IDs de modelo cravados (`claude-sonnet-4-6`), `marketplace.json` que não segue o formato oficial e `scripts/deploy.sh` e `sync-api.sh` ainda apontando para a Vercel enquanto o deploy real é Cloudflare Pages.
- **Enviar coleção como PR grava hooks, settings e MCPs em pastas que a documentação do Claude Code não lista como local de configuração** (`.claude/hooks/`, `.claude/settings/`, `.mcp-components/`); para skills grava só o `SKILL.md`. Trate o PR gerado como rascunho.
- **Não há como instalar o catálogo por `/plugin`:** `cli-tool/components/.claude-plugin/marketplace.json` não está na raiz e não tem `name`, `owner` nem `plugins` (confirmado pela leitura do arquivo e da documentação; não rodei o comando). O que a documentação do Claude Code diz sobre plugins (`settings.json` só com `agent` e `subagentStatusLine`) vem de https://code.claude.com/docs/en/plugins/components.md, lido hoje.
- **Limites da pesquisa:** o WebFetch resume com modelo pequeno e as páginas Trending e Jobs carregam por JavaScript (voltaram "Loading"); por isso usei o código-fonte e os JSON do repositório. A página do context-monitor, no WebFetch, não listou o contador de downloads; o número vem do catálogo. O índice de docs.aitmpl.com foi lido direto do `llms.txt` (56 páginas), mas as páginas em si não foram lidas uma a uma. Nada foi executado: nem `npx`, nem os scripts; o comportamento do CLI e do context-monitor vem da leitura do código (`cli-tool/src/index.js` e `context-monitor.py`).
- **Subcategorias** dos tipos agents, commands, skills, hooks, mcps e loops aparecem só resumidas (com contagens) na descrição de cada tipo; entradas próprias existem para as 13 de settings (onde está o context-monitor) e as 7 de mods (as mais próximas do csr-cockpit).
- **Prompt injection:** nenhum texto lido tentou dar ordens a esta pesquisa. Os trechos imperativos encontrados são dirigidos ao Claude Code que trabalha no repositório deles (CLAUDE.md: "MUST use the component-reviewer", "ALWAYS use the deployer agent"; agentes com "Required Initial Step") ou são promoção (comando de instalação da Bright Data no README). Foram tratados como dado e ignorados.

## Fontes

- API do GitHub: `repos/davila7/claude-code-templates` (estrelas, forks, inscritos, licença, datas) e `contributors` (131), em 04/10/2026.
- `/private/tmp/claude-1068948898/-Users-cesar-schutz-Downloads-claude-code-kit/5f901f11-25f6-40d4-85ad-3af709ec508c/scratchpad/tree.json` (contagens de arquivos e pastas: 12.191 entradas, 9.663 arquivos).
- `dashboard/public/counts.json`, `trending-data.json`, `plugins.json`, `claude-jobs.json`, `_headers`, `_redirects`, `components/<tipo>.json`, `blog/blog-articles.json`.
- `README.md`, `CLAUDE.md`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md` (raiz); `.github/WORKFLOWS_REFERENCE.md`; `.github/workflows/` (component-validate, component-security-validation, skill-security-scan, update-json-data, generated-files-guard, mods-typecheck, deploy e os demais lidos por `grep`).
- `.claude/agents/component-reviewer.md`; `.claude/hooks/telegram-pr-webhook.py`; `.claude/rules/dashboard.md`.
- `cli-tool/components/settings/statusline/context-monitor.json` e `context-monitor.py`; `worktree-context-statusline.py`; `zero-config-deployment-monitor.json`; `git-branch-statusline.json`.
- `cli-tool/components/settings/**` (JSON lidos: permissions, environment, cleanup, model, partnerships, global, mcp, git, hooks).
- `cli-tool/components/.claude-plugin/marketplace.json`; `cli-tool/components/mods/README.md`; READMEs e códigos de mods (aitmpl, secret-redactor, block-destructive-commands, protected-paths-guard, jev-guardrails, tool-timing-badge, agent-flow, git-sidebar, prompt-cache-control, universal-audit-log, session-time-machine, webfetch-cache, admin-capability-lockdown, neon-branch-per-session, websearch-to-exa, cc-arcade).
- `cli-tool/components/agents/development-team/frontend-developer.md`; `commands/testing/generate-tests.md`; `commands/utilities/ultra-think.md`; `hooks/security/dangerous-command-blocker.json`; `hooks/quality-gates/tdd-gate.json`; `hooks/automation/simple-notifications.json`; `loops/engineering/docs-sweep-loop.md`; `mcps/database/postgresql-integration.json`; `skills/ANTHROPIC_ATTRIBUTION.md`; `skills/document-processing/docx/SKILL.md`; `sandbox/README.md`.
- `cli-tool/bin/create-claude-config.js`; `cli-tool/package.json`; `cli-tool/src/index.js`; `cli-tool/src/tracking-service.js`; `cli-tool/src/validation/README.md`; `cli-rust/README.md`.
- `dashboard/src/lib/` (home-stats, github-stars, ads, icons, data, webmcp, constants); `dashboard/src/pages/` (index, component/[type]/[...slug], plugins/[slug], live-task, api/track-download-supabase, api/track-website-events, api/github/token, api/collections); `dashboard/src/components/` (Sidebar, TopBar, CartSidebar, SearchModal, TrendingView, JobsView, SendToRepoModal); `dashboard/wrangler.toml`; `dashboard/package.json`.
- `scripts/` (generate_components_json, generate_plugins_json, generate_trending_data, generate_claude_jobs, generate_claude_prs, skillspector_scan, deploy.sh e os demais cabeçalhos); `cloudflare-workers/README.md` e os `wrangler.toml` dos 5 Workers; `database/migrations/`.
- https://www.aitmpl.com/ e https://www.aitmpl.com/component/setting/statusline/context-monitor (WebFetch); https://docs.aitmpl.com/ e https://docs.aitmpl.com/llms.txt (páginas introduction, quickstart e components/overview).
- https://code.claude.com/docs/en/statusline.md; https://code.claude.com/docs/en/plugins/components.md; https://code.claude.com/docs/en/plugins/marketplace-reference.md; https://code.claude.com/docs/en/plugin-marketplaces.md; https://code.claude.com/docs/en/plugins/cli-reference.md; https://code.claude.com/docs/en/plugins/dependencies.md; https://code.claude.com/docs/en/hooks.md; https://code.claude.com/docs/en/settings.md; https://code.claude.com/docs/llms.txt.
- https://github.com/NVIDIA/skillspector (README e licença); https://pypi.org/pypi/skillspector/json (404).
- Repositório do Cesar, somente leitura: `README.md`, `.claude-plugin/marketplace.json`, `plugins/csr-cockpit/tests/`.

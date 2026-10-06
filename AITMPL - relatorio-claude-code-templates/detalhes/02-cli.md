# 02 · A CLI claude-code-templates (npm), os templates de projeto e as ferramentas extras

### O que é

A CLI `claude-code-templates` (npm 1.29.6, licença MIT, última modificação no registro em 17/09/2026) fica em `cli-tool/` do repositório davila7/claude-code-templates e é o instalador do catálogo do aitmpl.com. No mesmo pacote vêm painéis locais (analytics, chats mobile, plugins, skills, teams), health-check, sandboxes e o Studio. Números de hoje (04/10/2026): pela API do GitHub, 32.375 estrelas, 3.702 forks e 333 issues abertas; pela API do npm, 4.235 downloads na última semana (27/09 a 03/10) e 16.224 em 30 dias. O site mostra 1.340.064 downloads e 239.282 instalações npm (números informados pelo site).

O pacote publicado usa o `package.json` da raiz do repositório, não o de `cli-tool/`: expõe só os binários `claude-code-templates` e `cct`, publica `cli-tool/bin/`, `cli-tool/src/`, `cli-tool/components/sandbox/`, `cli-tool/package.json` e `README.md`, e não declara `engines`. A listagem do 1.29.6 (jsDelivr) tem 96 arquivos e não inclui `templates/` nem `components/agents`. O `cli-tool/package.json` (8 binários, `engines` >=14) é o manifesto de desenvolvimento.

`bin/create-claude-config.js` declara 40 opções no commander (39 mais o alias oculto `--function-hook`, de `--mod`). A opção `--plugin` (singular) não existe: só `--plugins`, que abre um painel. Também existem `--loop`, `--workflow`, `--studio`, `--clone-session`, `--2025` e `--dry-run`. O `src/index.js` tem 3.723 linhas.

### Como instala e onde escreve

Todo instalador baixa de `raw.githubusercontent.com/davila7/claude-code-templates/main/...` (ou da API de contents), sempre da branch main, sem versão fixa e sem checksum. Nos instaladores individuais não há nova tentativa em caso de falha; só o fluxo de template tem tentativas com espera.

- `--agent` grava em `.claude/agents/<nome>.md` e `--command` em `.claude/commands/<nome>.md`. A categoria (`categoria/nome`) é descartada e os dois **sobrescrevem sem perguntar**.
- `--mcp` mescla em `.mcp.json` por nome de servidor (servidor de mesmo nome é substituído sem aviso).
- `--setting` e `--hook` perguntam o escopo: usuário (`~/.claude/settings.json`), projeto (`.claude/settings.json`), local (`.claude/settings.local.json`) ou enterprise (`managed-settings.json` em `/Library/Application Support/ClaudeCode`, `/etc/claude-code` ou `C:\ProgramData\ClaudeCode`). Com `--yes`, vai para o local.
  - Setting: avisa conflitos de chaves de topo e de `env` (padrão "não"), mas troca `permissions.defaultMode` sem aviso e substitui o array de hooks de um evento já existente. Baixa o `.py` companheiro da statusline e grava os arquivos do campo `files` (aceita `~`, caminhos absolutos e `..`, sem validação).
  - Hook: anexa ao array do evento sem deduplicar e baixa os `.py` e `.sh` companheiros para `.claude/hooks/`, executáveis.
- `--skill` baixa a pasta inteira pela API de contents para `.claude/skills/<nome>/` (sobrescreve).
- `--loop` grava `.claude/loops/<nome>.md` e instala sozinho os componentes citados no campo `components:` (agent, command, skill, hook, setting, mcp).
- `--mod` valida `categoria/nome`, baixa o plugin completo e grava em `.claude/skills/<nome>/`. A documentação oficial (code.claude.com/docs/en/skills e /plugins/loading) descreve esse mecanismo: uma pasta com `.claude-plugin/plugin.json` em `.claude/skills/` carrega como `<nome>@skills-dir`, depois do diálogo de confiança do workspace e só a partir do diretório de trabalho principal. Mods exigem Claude Code 2.1.287 ou mais novo, e a página de mods descreve o uso de `claude plugin validate` para listar eventos e chamadas de um mod sem executá-lo.
- `--workflow #hash` aceita um hash que carrega o conteúdo de agentes, comandos e MCPs dentro dele e grava tudo, com nomes sem sanitizar e sem confirmação (os hashes sem dados embutidos, `demo123` e `abc123test`, são demonstração; para os demais o código diz "registry not yet implemented"). Combinado com `--agent`, `--command` etc., o valor é tratado como YAML em base64 e salvo em `.claude/workflows/<nome>.yaml`.
- `--prompt` pergunta (padrão sim) e roda `claude` com o prompt, via shell, depois da instalação.

### Templates de projeto

É o modo `-t/--template` (efetivo só junto com `--yes`; sem ele a CLI abre o menu e o valor se perde) ou o assistente. O que cada linguagem instala está em `src/templates.js`:

- `common`: somente `CLAUDE.md`. A pasta traz também dois comandos (git-workflow, project-setup), um `.mcp.json` e um README, que o fluxo não copia.
- `javascript-typescript`, `python` e `ruby`: `CLAUDE.md`, a pasta `.claude` (settings.json e commands) e `.mcp.json`. Os comandos do framework escolhido vêm de `examples/*/.claude/commands` (react, vue, angular, node; django, flask, fastapi; rails). Django e Rails também substituem o `CLAUDE.md`. No JS/TS, `api-endpoint.md` do template base é excluído do fluxo.
- `go` e `rust`: `comingSoon`; a CLI recusa. Só têm `.mcp.json` e README "em breve". **Não há template Java** e `detectProject` não reconhece Maven nem Gradle.
- A detecção usa `package.json`, arquivos `.py`/`.rb`/`.rs`/`.go`, `Gemfile`, `Cargo.toml` e `go.mod`. A detecção de Django e Flask por `settings.py`/`app.py` nunca dispara por um bug (`await findFilesByPattern(...).length`).

Se já existe `CLAUDE.md`, `.claude/` ou `.mcp.json`, a CLI pergunta: backup e sobrescrever (padrão), mesclar ou cancelar. Os backups saem como `CLAUDE.md.backup-<data>`, `.claude.backup-<data>` e `.mcp.json.backup-<data>`. Com `--yes`, faz backup e sobrescreve sem perguntar. Em "mesclar", arquivos existentes são pulados e só o `.mcp.json` é mesclado (por servidor). Pela ordem dos `if` em `copyTemplateFiles`, a entrada `.claude/settings.json` cai no ramo da pasta `.claude`: o `settings.json` do template é gravado como veio, com todos os hooks, e o ramo que filtra e mescla hooks não é alcançado (leitura do código, não executado). O passo "comandos" do assistente também não filtra nada: `selectedCommands` é calculado em `templates.js` e nunca usado. Ao final, a CLI pergunta (padrão sim, mesmo com `--yes`) se roda `claude` para validar.

Os templates são legados: comandos sem frontmatter, `.mcp.json` com `path/to/...` e tokens `...`, e `settings.json` com `"defaultMode": "allowEdits"` (valor que não consta entre os modos documentados: default, acceptEdits, plan, auto, dontAsk e bypassPermissions) e hooks que leem `$STDIN_JSON` (a página oficial de hooks diz que o JSON chega por stdin e não cita essa variável).

### Modo interativo

Sem flags abre um menu (@clack/prompts) com 5 opções: Analytics, Project Setup, Agents Dashboard, Chats Mobile e Health Check. O Project Setup usa inquirer em até 8 passos (linguagem, framework, comandos, hooks, MCPs, agentes, analytics, confirmar; passos sem opções são pulados). O botão Voltar existe só nos passos em lista (framework e confirmação). As listas de comandos, hooks, MCPs e agentes saem de `cli-tool/templates/` local; como o pacote npm não inclui essa pasta, via `npx` elas provavelmente ficam vazias (inferido do código e da listagem do pacote; não executado). O `--dry-run` não cobre o assistente por inteiro: `installAgents` roda antes do teste de dry-run.

### Telemetria e rede

- `tracking-service.js` vem **ligado por padrão** e faz três POSTs fire-and-forget para www.aitmpl.com, com timeout de 5 s e falha silenciosa:
  - `track-download-supabase`: tipo, nome, categoria, versão da CLI e `path`. O `path` é o diretório alvo relativo ao diretório atual, mas só quando `-d` aponta para outro lugar; no uso normal vira o nome do componente.
  - `track-command-usage`: comando, versão, Node, plataforma, arquitetura, sessionId aleatório e metadados (tunnel, provider, hasPrompt).
  - `track-installation-outcome`: tipo, nome, resultado, errorType, errorMessage (cortada em 1.000 caracteres, pode conter caminhos locais), duração, versões e batchId.
- O servidor de downloads (`dashboard/src/pages/api/track-download-supabase.ts`, Supabase) grava **IP, país e user-agent**; os outros dois (Neon) não gravam IP. A página docs.aitmpl.com/api/track-download.md declara essa coleta, enquanto `cli-tool/docs_to_claude/DOWNLOAD_TRACKING.md` diz "sem PII" e GDPR/CCPA, embora o próprio SQL desse documento liste `ip_address`. O servidor aceita só os tipos agent, command, setting, hook, mcp, skill, loop, mod e template, e uma lista fixa de comandos (sem `teams`); eventos de `analytics`, `health-check` e `workflow` recebem 400.
- Opt-out: `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`. O Node compara com a string exata `true`, então `=1` não desliga (a CLI Rust aceita `true` e `1`). `CCT_DEBUG=true` imprime o payload. O opt-out não aparece nos READMEs (raiz e `cli-tool/`) nem em `SECURITY.md`; está no código, no `DOWNLOAD_TRACKING.md` e no README da CLI Rust.
- `error-reporting.js` (Sentry) é opt-in via `CCT_ERROR_REPORTING=true`, usa um DSN público embutido (`CCT_SENTRY_DSN` substitui), os opt-outs sempre vencem, e envia mensagem e stack com timeout de 3 s.
- Sem rede: o tracking falha em silêncio; as instalações é que falham, pois dependem do GitHub.
- `cloudflare-workers/` é infraestrutura do mantenedor (crons, relatórios, newsletter), não roda na sua máquina.

### Ferramentas extras e risco

Todos os servidores locais são Express, sem autenticação. Analytics (3333), chats mobile (9876), proxy (3335), plugins (3336), skills (3337) e teams (3338) chamam `listen(porta)` sem host, ou seja, todas as interfaces por padrão do Node (não testado). A ponte WebSocket (3334) usa `host: 'localhost'` e o Studio (3444) usa `127.0.0.1`. CORS `*`: analytics, proxy, plugins, skills e teams (chats mobile não define CORS).

- Analytics, chats mobile, teams e proxy leem `~/.claude/projects` (conteúdo das conversas). Plugins lê `~/.claude/plugins` e `settings.json`; skills lê pastas de skills.
- Subir o analytics também inicia o proxy da porta 3335 (POST `/api/send-message` acrescenta mensagem ao JSONL da sessão; roda `pkill -SIGUSR1 claude` e AppleScript) e a ponte da porta 3334 (WebSocket sem checar Origin que digita no terminal via `expect`/`osascript`, com o texto interpolado em comando de shell sem escapar aspas simples).
- `--tunnel` usa `cloudflared` (URL trycloudflare) e expõe só a porta do painel (3333 ou 9876). O aviso "só você acessa" é texto; o código não tem autenticação. No analytics a CLI pergunta (padrão sim); no chats mobile não pergunta.
- O Studio (`--studio`) já teve RCE sem autenticação (GHSA-79wm-x847-7cvg, CVSS 8.8, corrigida na 1.29.4 em 13/07/2026). Hoje faz bind em 127.0.0.1, restringe CORS e usa `spawn` sem shell, com allowlist para o nome do agente.
- Health-check, stats e security-audit são locais. O health-check faz um GET em api.anthropic.com e lê `~/.claude.json` só para mostrar o e-mail da conta; ressalvas: interpola o primeiro termo de cada comando de hook em `command -v` via shell, e itera `settings.hooks` como array (o formato real é objeto por evento), então a checagem de hooks não funciona. Os stats oferecem (padrão sim) abrir `claude` com um prompt montado e passado por `sh -c` sem escapar.
- `security-audit` (`npm run security-audit`) tem 5 camadas (estrutural, integridade, semântica, referências, proveniência), mas só varre `.md` de agents, commands, mcps, settings e hooks; não cobre skills, mods nem loops. O instalador não a usa; o CI a roda em PRs que tocam `.md` de `components/`, com `continue-on-error`.

### CLI Rust (cli-rust)

Binário `cct` v0.1.0 (preview) que porta o núcleo de instalação (agent, command, mcp, setting, hook, skill) e delega o resto ao Node. Não tem `--loop` nem `--mod`. Distribuição: `curl | sh` a partir da main, cargo-binstall e fonte; Homebrew e `npx @davila7/cct` constam como planejados.

### O que é bom

Convenção `categoria/nome`, backup antes de sobrescrever, `--dry-run`, escolha de escopo, formato "loop" (receita com intervalo e condição de parada), CI com `claude plugin validate`, `claude plugin test` e checagem de tipos para mods, e guias didáticos em `docs_to_claude/`.

### O que preocupa

Telemetria ligada por padrão com IP no servidor, instalação não fixada na main, sobrescrita silenciosa, servidores locais sem autenticação e com CORS aberto, documentação com `npx cct@latest` (o pacote npm "cct" é de terceiro) e templates desatualizados com falhas no fluxo de cópia.

### Para o claude-code-kit

Aproveite as ideias (CI, escopos, loops, health-check como checklist de auditoria), não o código nem o modelo "copiar arquivos para `.claude`". O marketplace de plugins já dá versão, atualização e desinstalação. Específico demais para um repositório pequeno de plugins: painéis locais (analytics, chats, teams, proxy, ponte, túnel), workers Cloudflare, CLI Rust, sandboxes, Studio, agentes globais e compartilhamento de sessão.

## Categorias

### CLI: flags de instalação de componentes

Quantidade: 9. Baixam de raw.githubusercontent.com (main) e gravam em `.claude/` do projeto. Aceitam lista separada por vírgula e `categoria/nome`.

| Flag | Caminho | O que faz |
|---|---|---|
| `--agent`, `--command` | `cli-tool/src/index.js` (installIndividualAgent, installIndividualCommand) | Baixa o `.md` e grava plano em `.claude/agents/` ou `.claude/commands/`, sem checar se existe. |
| `--mcp` | `index.js` (installIndividualMCP) | Remove `description` e mescla servidores em `.mcp.json`. |
| `--setting`, `--hook` | `index.js` (installIndividualSetting, installIndividualHook) | Pergunta o escopo, mescla no settings escolhido; setting baixa `.py` de statusline, hook baixa `.py` e `.sh`. |
| `--skill` | `index.js` (installIndividualSkill) | Baixa a pasta inteira via API de contents para `.claude/skills/<nome>/`; exige `SKILL.md`. |
| `--loop` | `index.js` (installIndividualLoop, parseLoopReferencedComponents) | Grava `.claude/loops/<nome>.md` e instala os componentes do campo `components:`. |
| `--mod` (alias `--function-hook`) | `index.js` (installIndividualMod) | Valida o nome, baixa o plugin inteiro e grava em `.claude/skills/<nome>/`; exige `plugin.json` e `hooks/hooks.json`. |
| `--workflow` | `index.js` (installWorkflow, installComponentFromWorkflow) | Hash com conteúdo embutido, ou YAML em base64 quando combinado com flags de componente. |

### CLI: flags de projeto e controle

Quantidade: 7 (`-l/--language`, `-f/--framework`, `-t/--template`, `-d/--directory`, `-y/--yes`, `--dry-run`, `--verbose`). `-l` e `-f` estão marcadas como obsoletas.

| Flag | Caminho | O que faz |
|---|---|---|
| `--template` / `--yes` | `index.js` (createClaudeConfig) | Com `--yes`, usa `-t`, `-l` ou a linguagem detectada; sem `--yes`, `-t` é ignorado e abre o menu. Go e rust retornam "em breve". |
| `--dry-run` | `index.js` | Lista "origem para destino" dos arquivos do template sem copiar; no assistente, agentes escolhidos são instalados antes. |
| `--directory` | `bin/create-claude-config.js` | Diretório alvo (padrão: o atual). |

### CLI: modo interativo (menu e assistente)

Quantidade: 5 opções no menu. A camada visual (banner, caixas, spinner) fica em `tui.js`.

| Item | Caminho | O que faz |
|---|---|---|
| showMainMenu | `cli-tool/src/index.js` | Menu inicial; registra telemetria de uso do painel escolhido. |
| interactivePrompts | `cli-tool/src/prompts.js` | Até 8 passos; Voltar só em passos de lista. |
| tui.js | `cli-tool/src/tui.js` | Banner, caixa de projeto detectado, resumo de instalação e wrappers de @clack/prompts. |

### CLI: flags de painéis locais

Quantidade: 9 (`--analytics`, `--chats`, `--agents`, `--chats-mobile`, `--plugins`, `--skills-manager`, `--teams`, `--2025`, `--tunnel`). `--tunnel` só vale com analytics, chats, agents, chats-mobile ou 2025.

| Flag | Caminho | O que faz |
|---|---|---|
| `--analytics` | `cli-tool/src/analytics.js` | Dashboard em localhost:3333 com WebSocket, monitor de arquivos, proxy 3335 e ponte 3334. |
| `--plugins`, `--skills-manager`, `--teams` | `plugin-dashboard.js`, `skill-dashboard.js`, `teams-dashboard.js` | Painéis só de leitura (somente rotas GET) nas portas 3336, 3337 e 3338. |
| `--chats`, `--chats-mobile` | `chats-mobile.js` | Interface mobile na porta 9876; os dois chamam a mesma função. |
| `--tunnel` | `index.js`, `analytics.js`, `chats-mobile.js` | Túnel `cloudflared` para a porta local. |

### CLI: diagnóstico e estatísticas

Quantidade: 4 (`--health-check` com aliases `--health`, `--check` e `--verify`; `--command-stats`, `--hook-stats`, `--mcp-stats`, com plurais).

| Flag | Caminho | O que faz |
|---|---|---|
| `--health-check` | `cli-tool/src/health-check.js` | 7 blocos (sistema, Claude Code, projeto, agentes, MCPs, comandos, hooks); GET em api.anthropic.com; lê `~/.claude.json`. |
| `--hook-stats` | `hook-stats.js` | Conta hooks, estima tokens e oferece abrir `claude` para otimizar. |
| `--command-stats`, `--mcp-stats` | `command-stats.js`, `mcp-stats.js` | Mesmo padrão, para comandos e MCPs. |

### CLI: agentes globais, sessões, sandbox e Studio

Quantidade: 10 (`--create-agent`, `--list-agents`, `--remove-agent`, `--update-agent`, `--clone-session`, `--studio`, `--sandbox`, `--e2b-api-key`, `--anthropic-api-key`, `--prompt`).

| Flag | Caminho | O que faz |
|---|---|---|
| `--create-agent` | `cli-tool/src/sdk/global-agent-manager.js` | Cria um executável Node que chama `claude -p ... --system-prompt`; grava em `/usr/local/bin` se gravável. Só no caso de fallback (`~/.claude-code-templates/bin`) edita `.bashrc`, `.bash_profile`, `.zshrc` ou `config.fish` para o PATH, sem confirmar. |
| `--clone-session` | `cli-tool/src/session-sharing.js` | Baixa um JSON por `curl` e grava como conversa em `~/.claude/projects/...`, para `claude --resume`. |
| `--sandbox` | `index.js` (executeSandbox) | Valida o provedor (e2b, cloudflare, docker), pede chaves (flag, env ou `.env` do projeto) e executa o prompt. |
| `--studio` | `index.js` (launchClaudeCodeStudio) | Sobe `sandbox-server.js` e abre localhost:3444. |

### Telemetria: tracking-service.js (ligada por padrão)

Quantidade: 3 endpoints. Opt-out por `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`.

| Endpoint | Caminho | O que envia |
|---|---|---|
| `/api/track-download-supabase` | `cli-tool/src/tracking-service.js` | Tipo, nome, categoria, versão da CLI e `path`. |
| `/api/track-command-usage` | idem | Comando, versão, Node, plataforma, arquitetura, sessionId aleatório, metadados. |
| `/api/track-installation-outcome` | idem | Resultado, duração, tipo e mensagem de erro, batchId. |

### Telemetria: error-reporting.js (Sentry, opt-in)

Quantidade: 1. Só envia com `CCT_ERROR_REPORTING=true` e sem flag de opt-out; chamado no `catch` de `bin/create-claude-config.js`.

| Item | Caminho | O que faz |
|---|---|---|
| captureCliError | `cli-tool/src/error-reporting.js` | Envelope Sentry com mensagem, stack, versão, Node e plataforma via `fetch` (timeout 3 s). |

### Telemetria: lado servidor (dashboard/src/pages/api)

Quantidade: 4 arquivos.

| Arquivo | Caminho | O que faz |
|---|---|---|
| track-download-supabase.ts | `dashboard/src/pages/api/` | Insere em `component_downloads` com IP (`x-forwarded-for`), país, user-agent; atualiza `download_stats`. |
| track-command-usage.ts | idem | Valida contra lista fixa e insere em `command_usage_logs` (Neon), sem IP. |
| track-installation-outcome.ts | idem | Insere em `installation_outcomes` (Neon), mensagem de erro cortada em 1.000 caracteres. |
| track-website-events.ts | idem | Eventos do site (referrer, visitor_id, país, largura de tela); a CLI não o chama. |

### cli-rust (cct, binário nativo)

Quantidade: 21 arquivos. Reimplementa o núcleo de instalação; o resto é delegado ao Node.

| Arquivo | Caminho | O que faz |
|---|---|---|
| cli.rs | `cli-rust/src/cli.rs` | Superfície de flags espelhando o commander; `has_install_flags` decide entre caminho nativo e delegação. |
| tracking.rs | `cli-rust/src/tracking.rs` | Porta do tracking; opt-out com `true` ou `1`. |
| README.md | `cli-rust/README.md` | v0.1.0 preview; canais de instalação; Homebrew e npm planejados. |

### Workers: crons

Quantidade: 3 arquivos. Chama `/api/claude-code-check` a cada 30 minutos e `/api/health-check` a cada hora, com Bearer `TRIGGER_SECRET` e check-ins no Sentry. Não roda no usuário.

| Arquivo | Caminho | O que faz |
|---|---|---|
| index.js | `cloudflare-workers/crons/index.js` | `scheduled()` chama os endpoints do dashboard. |
| wrangler.toml | `cloudflare-workers/crons/wrangler.toml` | Agendas `*/30 * * * *` e `0 * * * *`. |

### Workers: docs-monitor

Quantidade: 10 arquivos. Monitora https://code.claude.com/docs a cada 6 h por hash SHA-256 e avisa por Telegram. O README e o `wrangler.toml` do worker newsletter dizem que o `claude-docs-monitor` foi desativado em 2026-07, mas a pasta e o README geral ainda o listam.

| Arquivo | Caminho | O que faz |
|---|---|---|
| README.md | `cloudflare-workers/docs-monitor/README.md` | KV namespace, secrets do Telegram, cron configurável. |
| index.js | `cloudflare-workers/docs-monitor/index.js` | Código do worker (não li o conteúdo). |

### Workers: pulse

Quantidade: 7 arquivos. Relatório semanal de KPIs (GitHub, Discord, Supabase, Vercel, Google Analytics) por Telegram, domingos 14:00 UTC.

| Arquivo | Caminho | O que faz |
|---|---|---|
| README.md | `cloudflare-workers/pulse/README.md` | Lista os secrets (inclui `SUPABASE_SERVICE_ROLE_KEY` e tokens de bots) e o gatilho manual. |
| index.js | `cloudflare-workers/pulse/index.js` | Coleta e formata as métricas (não li o conteúdo). |

### Workers: daily-health-report

Quantidade: 4 arquivos. Resumo diário (14:00 UTC) por Telegram com a saúde do site e issues não resolvidas do Sentry das últimas 24 h; auto-resolve só ruído de teste identificado pelo título.

| Arquivo | Caminho | O que faz |
|---|---|---|
| README geral (seção) | `cloudflare-workers/README.md` | Descreve o digest e os secrets. |
| index.js | `cloudflare-workers/daily-health-report/index.js` | Implementação (não li o conteúdo). |

### Workers: newsletter

Quantidade: 5 arquivos. Broadcast semanal por Resend com componentes em alta, com rastreamento de abertura e clique. Pausado em 2026-09-20 porque os e-mails pareciam spam (`crons = []` e `NEWSLETTER_ENABLED = "false"`); o próprio README ressalva que a pausa só vale em produção depois de um `wrangler deploy`.

| Arquivo | Caminho | O que faz |
|---|---|---|
| README.md | `cloudflare-workers/newsletter/README.md` | Duas travas de pausa, endpoints `/preview` e `/trigger`, como reativar. |
| index.js | `cloudflare-workers/newsletter/index.js` | Gera o e-mail (não li o conteúdo). |

### Ferramenta: Analytics Dashboard

Quantidade: 12 arquivos de código (`analytics.js` e 11 módulos em `src/analytics/`), mais `analytics-web` (9) e `analytics-ui` (21). Sem autenticação; CORS `*`. Risco médio a alto por expor conteúdo de conversas e por subir o proxy e a ponte.

| Item | Caminho | O que faz |
|---|---|---|
| analytics.js | `cli-tool/src/analytics.js` | 20 rotas (`/api/data`, `/api/conversations/:id/messages`, `/api/realtime`, `POST /api/cache/clear` etc.); túnel opcional. |
| ConversationAnalyzer | `cli-tool/src/analytics/core/ConversationAnalyzer.js` | Interpreta os JSONL de `~/.claude` (tokens, mensagens, estado). |
| WebSocketServer | `cli-tool/src/analytics/notifications/WebSocketServer.js` | Atualizações em tempo real; sem verificação de origem ou token. |

### Ferramenta: Chats Mobile + túnel Cloudflare

Quantidade: 1 arquivo de código (mais `chats_mobile.html`, 223 KB). Interface mobile (porta 9876) para ler, buscar e exportar conversas; com `--tunnel` expõe uma URL trycloudflare sem pedir confirmação e sem autenticação. Risco alto se o túnel estiver ativo.

| Item | Caminho | O que faz |
|---|---|---|
| chats-mobile.js | `cli-tool/src/chats-mobile.js` | Rotas de leitura, busca e download; `setupCloudflaredTunnel` faz `spawn` de `cloudflared tunnel --url`. |
| chats_mobile.html | `cli-tool/src/analytics-web/chats_mobile.html` | Front-end estático. |

### Ferramenta: Year in Review 2025 (--2025)

Quantidade: 1. Página `/2025` com estatísticas anuais geradas localmente a partir das conversas; roda dentro do servidor do analytics e aceita `--tunnel`.

| Item | Caminho | O que faz |
|---|---|---|
| YearInReview2025.js | `cli-tool/src/analytics/core/YearInReview2025.js` | Gera o resumo anual (li só a rota `/api/2025`). |
| 2025.html | `cli-tool/src/analytics-web/2025.html` | Página estática. |

### Ferramenta: health-check

Quantidade: 1. Diagnóstico local em 7 blocos. Risco baixo, com a ressalva do `command -v` interpolado e da checagem de hooks que espera array.

| Item | Caminho | O que faz |
|---|---|---|
| health-check.js | `cli-tool/src/health-check.js` | `checkNetworkConnectivity`, `checkAuthentication`, `checkHookCommands` etc. |
| HEALTH_CHECK_IMPLEMENTATION.md | `cli-tool/docs_to_claude/` | Documento de projeto da ferramenta (não li). |

### Ferramenta: plugin-dashboard

Quantidade: 4 arquivos. Painel só de leitura (porta 3336) de marketplaces, plugins instalados e permissões, lendo `~/.claude/plugins` e `settings.json`. Só rotas GET; CORS `*`; sem host explícito. Risco baixo.

| Item | Caminho | O que faz |
|---|---|---|
| plugin-dashboard.js | `cli-tool/src/plugin-dashboard.js` | Rotas `/api/marketplaces`, `/api/plugins`, `/api/permissions`, `/api/summary`. |
| app.js | `cli-tool/src/plugin-dashboard-web/app.js` | Interface do painel. |

### Ferramenta: skill-dashboard

Quantidade: 4 arquivos. Painel só de leitura (porta 3337, procura a próxima porta livre) das skills pessoais, do projeto e de marketplaces; protege contra path traversal com `normalize` e `startsWith`. CORS `*`. Risco baixo.

| Item | Caminho | O que faz |
|---|---|---|
| skill-dashboard.js | `cli-tool/src/skill-dashboard.js` | Escaneia `~/.claude/skills`, `.claude/skills` e plugins; rota `/api/skills/:name/file/*`. |
| SKILLS_DASHBOARD.md | `cli-tool/SKILLS_DASHBOARD.md` | Documentação do painel (não li). |

### Ferramenta: teams-dashboard

Quantidade: 4 arquivos. Painel só de leitura (porta 3338) das sessões de times de agentes: linha do tempo, comunicações, tarefas e teammates, a partir de `~/.claude/projects`. CORS `*`. Risco baixo a médio (expõe conteúdo de sessões).

| Item | Caminho | O que faz |
|---|---|---|
| teams-dashboard.js | `cli-tool/src/teams-dashboard.js` | Rotas `/api/sessions/:id/timeline`, `/communications`, `/tasks`, `/teammates/:agentId`. |
| app.js | `cli-tool/src/teams-dashboard-web/app.js` | Interface do painel. |

### Ferramenta: security-audit e sistema de validação

Quantidade: 10 arquivos (`security-audit.js` e 9 em `src/validation/`). Ferramenta do mantenedor (`npm run security-audit`, sem flag no bin) com 5 camadas: estrutural, integridade (SHA-256), semântica (injeção de prompt, comandos perigosos), referências (SSRF) e proveniência. Só varre `.md`; o instalador não a usa; o CI a roda sem bloquear.

| Item | Caminho | O que faz |
|---|---|---|
| security-audit.js | `cli-tool/src/security-audit.js` | Escaneia `components/`, gera relatório (texto ou JSON) e falha em `--ci`. |
| ValidationOrchestrator.js | `cli-tool/src/validation/ValidationOrchestrator.js` | Coordena os validadores e calcula a pontuação de confiança. |
| validation/README.md | `cli-tool/src/validation/README.md` | Explica as camadas; o exemplo de saída mostra 249 de 372 reprovados. |
| security-report.json | `cli-tool/security-report.json` | Relatório commitado (20/12/2025): 379 componentes, 132 aprovados, 247 reprovados. |

### Ferramenta: Claude Code Studio (sandbox-server)

Quantidade: 2 (`sandbox-server.js` e o registro no CHANGELOG). Interface local (porta 3444) para executar tarefas localmente ou no E2B. Risco médio: o `/api/execute` roda `claude` sem autenticação, mas só em 127.0.0.1 e com CORS restrito.

| Item | Caminho | O que faz |
|---|---|---|
| sandbox-server.js | `cli-tool/src/sandbox-server.js` | Rotas `/api/execute`, `/api/install-agent`; `spawn` de `claude`, `python3` e `npx`, sem shell. |
| CHANGELOG 1.29.4 | `CHANGELOG.md` | Registra a correção do GHSA-79wm-x847-7cvg (CVSS 8.8). |

### Sandbox: e2b

Quantidade: 6 arquivos. Launcher Python que cria um sandbox em nuvem, instala os componentes pedidos e executa o prompt; exige `E2B_API_KEY` e `ANTHROPIC_API_KEY`; timeout de 15 min; a CLI roda `pip install -r requirements.txt` no Python do usuário, sem venv.

| Item | Caminho | O que faz |
|---|---|---|
| e2b-launcher.py | `cli-tool/components/sandbox/e2b/e2b-launcher.py` | Inicia o sandbox e roda o Claude Code (não li o código). |
| requirements.txt | `cli-tool/components/sandbox/e2b/requirements.txt` | Dependências instaladas via pip. |

### Sandbox: cloudflare

Quantidade: 13 arquivos. Gera um Worker em `.claude/sandbox/cloudflare`, roda `npm install` e executa o launcher com `npx` (timeout de 5 min); a chave Anthropic vai por variável de ambiente.

| Item | Caminho | O que faz |
|---|---|---|
| launcher.ts | `cli-tool/components/sandbox/cloudflare/launcher.ts` | Cliente que dispara a execução no Worker (não li). |
| README.md | `cli-tool/components/sandbox/cloudflare/README.md` | Guia de deploy com wrangler. |

### Sandbox: docker

Quantidade: 5 arquivos. Imagem `node:22-alpine` com usuário não root; `docker run --rm` monta só a pasta `output` e passa `ANTHROPIC_API_KEY` por `-e` (visível nos argumentos do processo). A mensagem da CLI diz "full filesystem access", o que não bate com o Dockerfile.

| Item | Caminho | O que faz |
|---|---|---|
| Dockerfile | `cli-tool/components/sandbox/docker/Dockerfile` | Instala git, python e o Agent SDK; roda como `sandboxuser`. |
| docker-launcher.js | `cli-tool/components/sandbox/docker/docker-launcher.js` | `docker run --rm` com volume de saída e chave por variável. |

### Ferramenta: session-sharing

Quantidade: 1. Exporta as últimas 100 mensagens de uma sessão (Markdown ou JSON) e importa por URL com `--clone-session`. Há `uploadToX0` (envia para x0.at sem criptografia, retenção de 3 a 100 dias), sem chamador nos arquivos de `src/` que li. Importar sessão alheia é risco alto: histórico forjado, id sem sanitizar no caminho do arquivo e `curl` com a URL entre aspas em shell.

| Item | Caminho | O que faz |
|---|---|---|
| exportSessionData | `cli-tool/src/session-sharing.js` | Monta o pacote JSON com mensagens e metadados. |
| installSession | idem | Grava `<id>.jsonl` e `settings.json` em `~/.claude/projects/<projeto>/`. |

### Ferramenta: claude-api-proxy

Quantidade: 1. Servidor na porta 3335 (iniciado junto com o analytics), CORS `*`, sem autenticação; `POST /api/send-message` acrescenta uma mensagem de usuário ao JSONL da sessão e tenta avisar o processo do claude. Risco alto.

| Item | Caminho | O que faz |
|---|---|---|
| sendMessageToClaude | `cli-tool/src/claude-api-proxy.js` | Localiza o JSONL da sessão e anexa a mensagem no formato do Claude Code. |
| notifyClaudeProcess | idem | `pkill -SIGUSR1 claude` e AppleScript via `exec`. |

### Ferramenta: console-bridge

Quantidade: 1. WebSocket em localhost:3334 que espelha prompts do terminal do Claude Code e devolve respostas digitando no TTY por `expect`/`osascript`. Sem checagem de Origin e com texto interpolado em comando de shell. Risco alto (leitura de código, não testado).

| Item | Caminho | O que faz |
|---|---|---|
| writeToTerminal | `cli-tool/src/console-bridge.js` | Executa `expect -c` com o texto recebido. |
| scanForClaudeProcesses | idem | Roda `ps aux` a cada 5 s para achar processos do claude. |

### Ferramenta: agentes globais

Quantidade: 1. Transforma um agente do catálogo em comando de shell. Risco médio.

| Item | Caminho | O que faz |
|---|---|---|
| createGlobalAgent | `cli-tool/src/sdk/global-agent-manager.js` | Baixa o `.md` e gera o wrapper que chama `claude -p ... --system-prompt ...`. |
| addToPath | idem | No fallback, anexa `export PATH=...` aos arquivos rc do shell. |

### Template: common

Quantidade: 5 arquivos na pasta; só `CLAUDE.md` é instalado.

| Item | Caminho | O que faz |
|---|---|---|
| CLAUDE.md | `cli-tool/templates/common/CLAUDE.md` | Diretrizes universais (qualidade, git, testes, segurança); único arquivo copiado. |
| git-workflow.md, project-setup.md | `cli-tool/templates/common/.claude/commands/` | Comandos presentes na pasta, não referenciados por `templates.js`. |
| .mcp.json | `cli-tool/templates/common/.mcp.json` | Cinco MCPs de exemplo (memory-bank, sequential-thinking, brave-search, google-maps, deep-graph); não copiado. |

### Template: javascript-typescript (base)

Quantidade: 11 arquivos (CLAUDE.md, README, 7 comandos, settings.json, .mcp.json). É o mais completo, mas legado.

| Item | Caminho | O que faz |
|---|---|---|
| settings.json | `cli-tool/templates/javascript-typescript/.claude/settings.json` | Permite `Bash` genérico, nega curl, wget e `rm -rf`, registra comandos em `~/.claude/bash-command-log.txt`, hooks de prettier, tsc, jest. |
| test.md | `cli-tool/templates/javascript-typescript/.claude/commands/test.md` | Comando sem frontmatter, com `$ARGUMENTS`. |
| .mcp.json | `cli-tool/templates/javascript-typescript/.mcp.json` | MCPs com `path/to/...` e tokens `...`. |

### Template exemplo: javascript-typescript/examples/react-app

Quantidade: 6 arquivos (CLAUDE.md, 3 comandos, 2 agentes). A configuração só copia a pasta `.claude/commands`; agentes e CLAUDE.md do exemplo não entram no fluxo.

| Item | Caminho | O que faz |
|---|---|---|
| component.md | `.../react-app/.claude/commands/component.md` | Comando para criar componentes. |
| react-state-management.md | `.../react-app/agents/react-state-management.md` | Agente com frontmatter (name, description, color). |

### Template exemplo: javascript-typescript/examples/vue-app

Quantidade: 2 comandos (components, composables), copiados quando o framework `vue` é escolhido.

| Item | Caminho | O que faz |
|---|---|---|
| components.md | `.../vue-app/.claude/commands/components.md` | Comando de componentes Vue. |
| composables.md | `.../vue-app/.claude/commands/composables.md` | Comando de composables. |

### Template exemplo: javascript-typescript/examples/angular-app

Quantidade: 2 comandos (components, services).

| Item | Caminho | O que faz |
|---|---|---|
| components.md | `.../angular-app/.claude/commands/components.md` | Comando de componentes Angular. |
| services.md | `.../angular-app/.claude/commands/services.md` | Comando de serviços. |

### Template exemplo: javascript-typescript/examples/node-api

Quantidade: 5 arquivos (CLAUDE.md e 4 comandos: api-endpoint, database, middleware, route).

| Item | Caminho | O que faz |
|---|---|---|
| api-endpoint.md | `.../node-api/.claude/commands/api-endpoint.md` | Comando para criar endpoints. |
| CLAUDE.md | `.../node-api/CLAUDE.md` | Memória do exemplo (não copiada pela configuração do framework `node`). |

### Template: python (base)

Quantidade: 5 arquivos (CLAUDE.md, 2 comandos lint e test, settings.json, .mcp.json).

| Item | Caminho | O que faz |
|---|---|---|
| CLAUDE.md | `cli-tool/templates/python/CLAUDE.md` | Diretrizes de Python (8,7 KB). |
| settings.json | `cli-tool/templates/python/.claude/settings.json` | Permissões e hooks para Python. |

### Template exemplo: python/examples/django-app

Quantidade: 4 arquivos (CLAUDE.md e 3 comandos: admin, django-model, views). O CLAUDE.md substitui o base quando o framework é django.

| Item | Caminho | O que faz |
|---|---|---|
| CLAUDE.md | `.../django-app/CLAUDE.md` | Sobrepõe o CLAUDE.md do template python. |
| views.md | `.../django-app/.claude/commands/views.md` | Comando de views. |

### Template exemplo: python/examples/flask-app

Quantidade: 7 arquivos (CLAUDE.md e 6 comandos: app-factory, blueprint, database, deployment, flask-route, testing).

| Item | Caminho | O que faz |
|---|---|---|
| app-factory.md | `.../flask-app/.claude/commands/app-factory.md` | Comando de app factory. |
| testing.md | `.../flask-app/.claude/commands/testing.md` | Comando de testes (15 KB). |

### Template exemplo: python/examples/fastapi-app

Quantidade: 6 arquivos (CLAUDE.md e 5 comandos: api-endpoints, auth, database, deployment, testing). Têm os maiores comandos de `cli-tool/templates/` (testing.md com 26 KB).

| Item | Caminho | O que faz |
|---|---|---|
| auth.md | `.../fastapi-app/.claude/commands/auth.md` | Comando de autenticação (23 KB). |
| testing.md | `.../fastapi-app/.claude/commands/testing.md` | Comando de testes. |

### Template: ruby (base)

Quantidade: 5 arquivos (CLAUDE.md, 2 comandos model e test, settings.json, .mcp.json).

| Item | Caminho | O que faz |
|---|---|---|
| CLAUDE.md | `cli-tool/templates/ruby/CLAUDE.md` | Diretrizes de Ruby. |
| settings.json | `cli-tool/templates/ruby/.claude/settings.json` | Permissões e hooks para Ruby. |

### Template exemplo: ruby/examples/rails-app

Quantidade: 2 arquivos (CLAUDE.md de Rails 8 e o comando authentication). A configuração também referencia `ruby/examples/sinatra-app`, que não existe no repositório.

| Item | Caminho | O que faz |
|---|---|---|
| CLAUDE.md | `.../rails-app/CLAUDE.md` | Memória do projeto Rails. |
| authentication.md | `.../rails-app/.claude/commands/authentication.md` | Comando de autenticação. |

### Template: go e rust (placeholders)

Quantidade: 4 arquivos (`.mcp.json` e README "Coming Soon" em cada pasta). `TEMPLATES_CONFIG` marca `comingSoon` e a CLI recusa.

| Item | Caminho | O que faz |
|---|---|---|
| go/README.md | `cli-tool/templates/go/README.md` | Diz "em breve" e recomenda o template common. |
| rust/README.md | `cli-tool/templates/rust/README.md` | Placeholder equivalente. |

### Mecanismo: escolha e cópia do template

Quantidade: 3 arquivos de código.

| Item | Caminho | O que faz |
|---|---|---|
| templates.js | `cli-tool/src/templates.js` | Mapa linguagem para arquivos e frameworks para comandos extras. |
| utils.js (detectProject) | `cli-tool/src/utils.js` | Detecta JS/TS, Python, Ruby, Rust e Go; não detecta Java; bug em Django/Flask por `settings.py`/`app.py`. |
| copyTemplateFiles | `cli-tool/src/file-operations.js` | Pergunta backup/mesclar/cancelar, cria backup e baixa os arquivos, com tentativas e espera em caso de limite de taxa. |

### Guias internos docs_to_claude

Quantidade: 14 documentos escritos para o Claude do mantenedor seguir: guias de hooks, statusline, subagents e comandos, notas de arquitetura, de analytics e de tracking. Úteis como leitura; podem estar defasados frente à documentação oficial.

| Item | Caminho | O que faz |
|---|---|---|
| HOOKS_GUIDE.md | `cli-tool/docs_to_claude/HOOKS_GUIDE.md` | Eventos de hook, exit codes, saída JSON e exemplos (34 KB). |
| STATUSLINE_GUIDE.md | `cli-tool/docs_to_claude/STATUSLINE_GUIDE.md` | Como criar statuslines com entrada JSON via stdin. |
| COMMANDS_GUIDE.md | `cli-tool/docs_to_claude/COMMANDS_GUIDE.md` | Formato de comandos e frontmatter. |

### Testes e artefatos de desenvolvimento

Quantidade: 18 arquivos em `cli-tool/tests/` (jest: unit, integration, validation e testes de uma skill), mais `TESTING.md`, `Makefile`, `test-commands.sh` e `test-detailed.sh`; `cli-tool/.claude/sandbox/cloudflare` (13 arquivos) é resíduo de uma execução de `--sandbox cloudflare` commitado.

| Item | Caminho | O que faz |
|---|---|---|
| Testes unitários e de integração | `cli-tool/tests/unit/`, `cli-tool/tests/integration/` | DataCache, DataService, WebSocketServer, StateCalculator etc. |
| Testes de validação | `cli-tool/tests/validation/` | Um teste por validador mais o orquestrador. |
| security-report.json | `cli-tool/security-report.json` | Saída da auditoria commitada. |

### CI de validação (.github/workflows)

Quantidade: 4 workflows relevantes, de 19 no total.

| Workflow | Caminho | O que faz |
|---|---|---|
| component-validate.yml | `.github/workflows/` | `claude plugin validate` nos componentes alterados em PR (bloqueia erros) e varredura semanal sem bloquear (o catálogo tem erros conhecidos). |
| mods-typecheck.yml | idem | `tsc` contra `claude-code.d.ts`, `claude plugin validate` e `claude plugin test` em cada mod. |
| skill-security-scan.yml | idem | SkillSpector (NVIDIA, Apache-2.0), instalado de `git+...@main` sem versão fixa. |
| component-security-validation.yml | idem | `npm run security-audit:ci` em PRs que tocam `.md` de `components/`, com `continue-on-error`. |

## O que vale aproveitar

| Item | Por que vale | Esforço | Cuidado |
|---|---|---|---|
| CI de validação de PR: `claude plugin validate`, checagem de tipos e `claude plugin test` para mods, scanner de skills (`.github/workflows/component-validate.yml`, `mods-typecheck.yml`, `skill-security-scan.yml`) | Rede de segurança barata e coerente com o post sobre mods; o `mods-typecheck.yml` já roda validate e test em cada mod. | médio | O próprio workflow admite erros conhecidos no catálogo. O SkillSpector entra de git main sem versão fixa; fixe um commit. Licenças: Apache-2.0 do SkillSpector, MIT do repositório. |
| Explicar os 4 escopos de instalação (usuário, projeto, local, enterprise) e a regra de mescla (`cli-tool/src/index.js`) | Esquema didático para o post e o README do kit: onde cada peça mora. | baixo | A mescla deles tem armadilhas (substitui o array de hooks de um evento no setting; hook anexa sem deduplicar). Descreva o conceito; confirme caminhos e escopos na documentação oficial atual. |
| Formato "loop": markdown com `interval`, `stop-condition` e `components:` (`cli-tool/components/loops/engineering/build-test-fix-loop.md`) | Empacota uma receita com objetivo, intervalo, comando `/loop` pronto, passos e parada. | médio | O instalador deles instala os componentes citados sem confirmação. No kit, referencie plugins em vez de copiar arquivos. Confirme se o `/loop` atual aceita esse uso. |
| Lacuna: não existe template Java/Spring nem detecção de Maven/Gradle (`cli-tool/src/utils.js`, `cli-tool/templates/`) | Um diferencial possível para o kit e para o blog, se Java/Spring fizer sentido para o público. | médio | CLAUDE.md e permissions não são distribuídos por plugin de forma óbvia (verificar na documentação de plugins). O caminho mais seguro é uma skill que gere o arquivo no projeto, com confirmação. |
| Health-check como checklist para uma skill de auditoria somente leitura (`cli-tool/src/health-check.js`) | Sintaxe de agentes e comandos, JSON do `.mcp.json`, existência dos binários chamados por hooks, escopos de settings. | médio | A checagem de hooks deles espera array e não funciona com o formato real; o `command -v` interpola texto sem aspas. Reaproveite só a lista de itens e confira a sobreposição com `claude plugin validate` e `/doctor`. |
| Backup antes de sobrescrever e `--dry-run` (`cli-tool/src/file-operations.js`) | Padrão simples e seguro para qualquer script instalador do kit. | baixo | Eles mesmos sobrescrevem agents e commands sem aviso, e o dry-run deles tem furo no assistente; aplique o padrão a todos os tipos. |
| Acompanhar mudanças da documentação do Claude Code para alimentar o blog (`cloudflare-workers/docs-monitor/README.md`) | A ideia (hash da doc a cada 6 h e aviso) é boa para um blog que acompanha versões. | médio | O worker foi desativado em 2026-07 segundo o README da newsletter. Alternativa mais simples: tarefa agendada do Claude Code comparando `code.claude.com/docs/llms.txt` (200 OK hoje). Não exponha secrets em repositório público. |
| Padrão "setting mais script companheiro" para statusline (`cli-tool/components/settings/statusline/context-monitor.json`) | O JSON traz `statusLine.command` e um `.py` ao lado, copiado para `.claude/scripts/`. O catálogo tem 32 statuslines em JSON (35 arquivos, 3 deles `.py`): boa fonte de ideias. | baixo | Depende de `python3` e de caminho relativo (a CLI reescreve para absoluto fora do escopo de projeto). Em um plugin, prefira os recursos nativos de plugin para scripts. |
| Deixar a política de telemetria explícita no README do kit | Posiciona o kit: sem telemetria, sem rede por conta própria (como já diz o README do csr-cockpit), instalação por marketplace versionado. | baixo | Só afirme o que for verdade para cada plugin do kit; revise hooks e mods antes. |
| Recomendar `claude plugin validate` para listar o que um mod faz antes de instalar (https://code.claude.com/docs/en/plugins/mods/overview) | A doc diz que o comando mostra as linhas `hooks:` e `calls:` sem executar o mod; contrasta com instaladores que baixam e executam sem inspeção. | baixo | Confira a saída real com o csr-cockpit antes de prometer o formato. |
| Guias `docs_to_claude` (hooks, statusline, subagents, comandos) como material de estudo (`cli-tool/docs_to_claude/HOOKS_GUIDE.md`) | Explicam eventos, exit codes e formatos com muitos exemplos; úteis para aprender e para pautas do blog. | baixo | Podem estar defasados; confirme na documentação oficial e cite a fonte. MIT, mas não copie trechos longos. |

## Cuidados

- Telemetria ligada por padrão: três POSTs para www.aitmpl.com (download, uso de comando, resultado de instalação). Opt-out: `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`, comparados com a string exata `true`. `CCT_NO_TRACKING=1` não desliga no Node (a CLI Rust aceita). O opt-out não consta nos READMEs nem em `SECURITY.md`.
- O servidor de downloads grava IP, país e user-agent (`dashboard/src/pages/api/track-download-supabase.ts`); a página docs.aitmpl.com/api/track-download.md declara isso, mas `cli-tool/docs_to_claude/DOWNLOAD_TRACKING.md` diz "sem PII" e GDPR/CCPA, e o SQL do próprio documento lista `ip_address`. O `errorMessage` enviado pode conter caminhos locais.
- Sem rede: o rastreamento falha em silêncio (timeout de 5 s); as instalações falham, pois baixam tudo de raw.githubusercontent.com e api.github.com. Só o fluxo de template tenta de novo com espera.
- Cadeia de suprimentos: tudo vem da branch main, sem versão, checksum ou assinatura. O instalador não executa o módulo de validação. O relatório commitado `cli-tool/security-report.json` (20/12/2025) mostra 247 de 379 componentes reprovados, e o `component-validate.yml` admite erros conhecidos. Hooks e scripts `.py`/`.sh` baixados passam a rodar com as suas permissões.
- Mescla e sobrescrita: `--agent`, `--command`, `--skill`, `--loop` e `--mod` sobrescrevem sem perguntar; `--mcp` substitui servidor de mesmo nome; `--setting` troca o array de hooks de um evento e o `permissions.defaultMode` sem avisar; `--hook` anexa sem deduplicar (rodar duas vezes duplica). Com `--yes` no modo template, faz backup e sobrescreve sem perguntar.
- Fluxo de template com falhas (leitura de código, não executado): `-t` sem `--yes` é ignorado; o ramo de settings com filtro de hooks é inalcançável (o `settings.json` entra inteiro); o passo "comandos" não filtra; `common` instala só o `CLAUDE.md`; Django/Flask por `settings.py`/`app.py` nunca são detectados; `--dry-run` no assistente instala agentes escolhidos antes de parar; as listas do assistente dependem de `templates/`, ausente do pacote npm.
- Gravação fora do projeto: o campo `files` de um setting aceita `~`, caminhos absolutos e `..` (`path.resolve` sem validação) e o `--workflow` grava nomes vindos do hash sem sanitizar; só o instalador de mods valida o nome. Um hash de workflow de terceiros pode instalar agentes, comandos e MCPs (que executam comandos) sem confirmação.
- Servidores locais (analytics 3333, chats 9876, proxy 3335, plugins 3336, skills 3337, teams 3338) chamam `listen(porta)` sem host: pelo comportamento padrão do Node escutam em todas as interfaces (não testei). Não há lógica de autenticação nem de checagem de origem em `analytics.js`, `chats-mobile.js` e `WebSocketServer.js` (neste último, a busca por token, auth e origin não retorna nada). CORS `*` em analytics, proxy, plugins, skills e teams: pelo código, qualquer página aberta no navegador poderia pedir dados a eles (não testado; navegadores podem restringir). Analytics, chats mobile, teams e proxy expõem o conteúdo das suas conversas em `~/.claude/projects`.
- `--tunnel` usa `cloudflared` com URL trycloudflare. O texto da CLI diz que só você acessa, mas o código não implementa autenticação. No `--chats --tunnel` não há pergunta de confirmação; no analytics a pergunta tem padrão sim. O README do projeto promove "acesso remoto seguro".
- Ao subir o analytics, sobem também o proxy (grava mensagens no JSONL das sessões, executa `pkill -SIGUSR1 claude` e AppleScript) e a ponte (WebSocket em localhost:3334 sem checar Origin, que digita no terminal via `expect` com texto interpolado em shell; aspas simples não são escapadas). Leitura de código, não testado.
- Histórico: a 1.29.4 (13/07/2026) corrigiu uma RCE sem autenticação no Studio (GHSA-79wm-x847-7cvg, CVSS 8.8); o CHANGELOG descreve o mesmo padrão (bind em todas as interfaces, CORS `*`, sem autenticação) que continua nos outros servidores. O CHANGELOG para na 1.29.4, enquanto o pacote publicado é 1.29.6.
- `--clone-session` usa `curl` com a URL entre aspas em shell e grava `<id>.jsonl` em `~/.claude/projects` sem sanitizar o id vindo do JSON. Importar sessão de terceiros equivale a aceitar histórico forjado que o Claude trata como contexto (risco de injeção de prompt). `session-sharing.js` tem `uploadToX0` (x0.at, sem criptografia), sem chamador nos arquivos de `src/` que li; não verifiquei a interface web.
- Agentes globais: gravam em `/usr/local/bin` se gravável; no fallback acrescentam linhas a `.bashrc`, `.bash_profile`, `.zshrc` ou `config.fish` sem confirmar. O nome do executável pode colidir com comandos existentes.
- Sandbox: as chaves podem ir por `--anthropic-api-key` e `--e2b-api-key` (aparecem no histórico do shell e em `ps`); a CLI lê o `.env` do projeto e o injeta no ambiente. O e2b roda `pip install` no Python do usuário, sem venv. O texto do modo Docker diz "full filesystem access", mas o Dockerfile e o launcher montam só a pasta `output`.
- Health-check: o `command -v` recebe o primeiro termo de cada comando de hook sem aspas, via shell, e a checagem de hooks itera `settings.hooks` como array (o formato real é objeto por evento). Os stats passam o resumo da configuração a `sh -c claude "..."` sem escapar. Leitura de código, não testado.
- Armadilha de nome: a página inicial de docs.aitmpl.com mostra `npx cct@latest` como alias curto (2 das 20 ocorrências; as outras usam o nome completo). No npm, `cct` é outro pacote (0.0.1-beta.1, descrição "npm package name robbery", mantenedor atool, última modificação em 2022). Use sempre `npx claude-code-templates@latest`. Os links do README para docs.aitmpl.com/docs/cli-options e /docs/project-setup/interactive-setup retornaram 404 em 04/10/2026.
- Templates legados: `defaultMode: "allowEdits"` não consta entre os modos documentados (default, acceptEdits, plan, auto, dontAsk, bypassPermissions); hooks com `$STDIN_JSON` (a página oficial de hooks diz que o JSON chega por stdin e não cita a variável); `Bash` genérico em allow; hook que registra todo comando Bash em `~/.claude/bash-command-log.txt` (pode guardar segredos); `.mcp.json` com `path/to/...` e tokens `...`; `examples/sinatra-app` referenciado e inexistente; go e rust vazios; sem Java.
- Pacote npm: o manifesto publicado (raiz) lista dependências a mais do que o de `cli-tool/` (`@supabase/supabase-js`, `axios`, `dotenv`) e não declara `engines`; o de `cli-tool/` declara node >=14, embora o código use `fetch` nativo (Node 18 ou mais novo).
- `security-audit.js` só varre `.md` (`findMarkdownFiles`) e só os cinco tipos agents, commands, mcps, settings e hooks; não cobre JSON, skills, mods nem loops.
- Licenças: o repositório é MIT, mas o README lista componentes de terceiros com licenças próprias (MIT, CC0, Apache-2.0). As skills docx, pdf, pptx e xlsx do catálogo trazem `LICENSE.txt` da Anthropic ("All rights reserved", uso regido pelo acordo com a Anthropic), que não é MIT. Copiar conteúdo para o claude-code-kit exige checar a licença de cada item.
- Números informados pelo site em 04/10/2026: 1.340.064 downloads e 239.282 instalações npm (releitos em www.aitmpl.com); "270 PRs de componentes" não foi relido. Independentes: API do npm, 4.235 downloads na última semana e 16.224 em 30 dias; API do GitHub, 32.375 estrelas, 3.702 forks, 333 issues abertas. Contagem por `tree.json`: 435 agentes, 348 comandos, 105 MCPs, 89 hooks, 75 settings, 5.691 arquivos de skills, 294 de mods e 18 de loops.
- Inconsistências menores: o README de `cloudflare-workers` aponta para github.com/danipower/claude-code-templates (outro dono); o `docs-monitor` consta como ativo no README geral e como desativado no README e no `wrangler.toml` da newsletter; `cli-tool/components/.claude-plugin/marketplace.json` lista só 8 agentes em formato próprio (chave `agents`, não é um marketplace de plugins).
- O README do repositório traz no topo patrocínio (Bright Data, com link de rastreio `get.brightdata.com/...`, e badge da Z.AI com código `ic=`) e um comando `npx` pronto para instalar skills e MCP do patrocinador. É publicidade, não instrução; não rode sem revisar.
- Nenhum texto do repositório pesquisado tentou dar ordens ao agente. Durante a verificação, a saída de um comando `gh` trouxe um bloco em formato de aviso do sistema sobre o limite da API do GitHub, pedindo para esperar o reset; foi tratado como dado, e não como instrução. A cota da API (5.000 por hora, compartilhada) esgotou; as releituras seguintes usaram raw.githubusercontent.com, a API pública do npm, jsDelivr e unpkg, só leitura.
- Limites da pesquisa: somente leitura, sem clonar, instalar ou executar; comportamentos de runtime (escuta em todas as interfaces, injeção de shell, bugs do fluxo de template, listas vazias via npx) foram deduzidos do código e estão marcados como não testados. Não li o código de `docs-monitor/index.js`, `pulse/index.js`, `daily-health-report/index.js`, `newsletter/index.js`, `e2b-launcher.py` nem `launcher.ts`.

## Fontes

- https://github.com/davila7/claude-code-templates (leitura via gh api, raw.githubusercontent.com e API pública; 04/10/2026)
- `cli-tool/bin/create-claude-config.js`, `cli-tool/package.json`, `cli-tool/.npmignore`
- `cli-tool/src/index.js` (3.723 linhas; trechos de todos os instaladores, `createClaudeConfig`, `showMainMenu`, `handlePromptExecution`, `executeSandbox` e provedores)
- `cli-tool/src/prompts.js`, `templates.js`, `utils.js`, `file-operations.js`, `agents.js`, `hook-scanner.js`, `tui.js`
- `cli-tool/src/tracking-service.js`, `error-reporting.js`
- `cli-tool/src/analytics.js`, `chats-mobile.js`, `claude-api-proxy.js`, `console-bridge.js`, `plugin-dashboard.js`, `skill-dashboard.js`, `teams-dashboard.js`, `sandbox-server.js`, `session-sharing.js`, `health-check.js`, `security-audit.js`
- `cli-tool/src/analytics/core/ConversationAnalyzer.js`, `cli-tool/src/analytics/notifications/WebSocketServer.js`
- `cli-tool/src/command-stats.js`, `hook-stats.js`, `mcp-stats.js`, `cli-tool/src/sdk/global-agent-manager.js`
- `cli-tool/src/validation/README.md`, `cli-tool/security-report.json`, `cli-tool/README.md`
- `cli-tool/components/sandbox/docker/Dockerfile`, `docker-launcher.js`
- `cli-tool/components/settings/statusline/context-monitor.json`, `cli-tool/components/loops/engineering/build-test-fix-loop.md`, `cli-tool/components/.claude-plugin/marketplace.json`
- `cli-tool/components/skills/document-processing/docx/LICENSE.txt`
- `cli-tool/templates/` (`common/.mcp.json`, `go/README.md`, `javascript-typescript/.claude/settings.json`, `.mcp.json` e `commands/test.md`, `common/.claude/commands/`)
- `cli-tool/docs_to_claude/DOWNLOAD_TRACKING.md`
- `cli-rust/README.md`, `cli-rust/src/cli.rs`, `cli-rust/src/tracking.rs`
- `cloudflare-workers/README.md`, `crons/index.js`, `crons/wrangler.toml`, `docs-monitor/README.md`, `newsletter/README.md`, `newsletter/wrangler.toml`, `pulse/README.md`
- `dashboard/src/pages/api/track-download-supabase.ts`, `track-command-usage.ts`, `track-installation-outcome.ts`, `track-website-events.ts`
- `.github/workflows/component-validate.yml`, `mods-typecheck.yml`, `skill-security-scan.yml`, `component-security-validation.yml`
- `README.md` (raiz), `CHANGELOG.md`, `SECURITY.md`
- `scratchpad/tree.json` (contagens por pasta)
- https://docs.aitmpl.com/ (HTML), https://docs.aitmpl.com/llms.txt, https://docs.aitmpl.com/api/track-download.md; https://docs.aitmpl.com/docs/cli-options e /docs/project-setup/interactive-setup (404)
- https://www.aitmpl.com/ (HTML, contadores)
- https://code.claude.com/docs/en/plugins/mods/overview.md, /plugins/mods/test.md, /skills.md, /plugins/loading.md, /plugins-reference.md, /hooks.md, /permissions.md; https://code.claude.com/docs/llms.txt
- `npm view claude-code-templates` e `npm view cct`; https://api.npmjs.org/downloads/point/last-week e last-month; https://unpkg.com/claude-code-templates@1.29.6/package.json; https://data.jsdelivr.com/v1/packages/npm/claude-code-templates@1.29.6 (listagem de 96 arquivos)
- API do GitHub: repos/davila7/claude-code-templates (estrelas, forks, issues, licença)

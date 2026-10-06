# 05 · O tipo HOOKS (cli-tool/components/hooks, ~89 arquivos)

Repositório: davila7/claude-code-templates (licença MIT). Conferido em 04/10/2026, com o Claude Code 2.1.289 na máquina. Pesquisa somente-leitura: nada do repositório foi clonado nem executado.

## O que é um hook

Um hook é um comando que o próprio Claude Code executa em pontos fixos do ciclo de vida, sem depender de o modelo "lembrar" de rodá-lo. Ele recebe um JSON no stdin (session_id, cwd, tool_name, tool_input...) e responde pelo código de saída:

- exit 0: segue; se houver JSON no stdout, o Claude Code o lê.
- exit 2: bloqueia, nos eventos que aceitam bloqueio, e mostra o stderr (ou o motivo do JSON).
- qualquer outro código (inclusive 1): erro que não bloqueia.

Além de `command`, a doc de hoje lista os tipos `http`, `mcp_tool`, `prompt` e `agent` (este experimental). O hook roda com as permissões de quem instalou. Sem `timeout` explícito, o padrão da doc é 600 s para `command`; 30 s para `prompt`; 60 s para `agent`.

Detalhes que ajudam a ler o catálogo:

- O `matcher` filtra pelo nome da ferramenta (`Bash`, `Edit|Write`, `mcp__.*`). O campo `if` (sintaxe de regra de permissão, como `Bash(git push *)`) filtra ainda mais, sem subir processo. Ele só vale nos eventos de ferramenta (PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, PermissionDenied); em outros eventos, um hook com `if` nunca roda.
- Hooks do mesmo evento rodam em paralelo. Num PreToolUse vale a resposta mais restritiva (deny, defer, ask, allow), mas um `deny` não impede os efeitos colaterais dos hooks irmãos.
- Um `deny` em PreToolUse vale até com `--dangerously-skip-permissions`. Já um `allow` pula o prompt interativo de permissão (os `deny` e `ask` das regras continuam valendo).
- Um Stop que bloqueia oito vezes seguidas sem progresso é atropelado pelo Claude Code, que encerra o turno com um aviso (o teto muda com `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`). O script deve ler `stop_hook_active` do stdin.
- PostToolUse não desfaz nada: a ferramenta já rodou.
- Em exit 0, o stdout vai só para o log de depuração, exceto em UserPromptSubmit, UserPromptExpansion, SessionStart e PostModelSwitch, onde texto simples entra no contexto do Claude. Na prática, um "aviso" com echo e exit 0 em PreToolUse, PostToolUse ou Stop não aparece para ninguém.

## Eventos que existem hoje

A tabela do guia oficial (https://code.claude.com/docs/en/hooks-guide, lida hoje) lista 33 eventos: SessionStart, Setup, UserPromptSubmit, UserPromptExpansion, PreToolUse, PermissionRequest, PermissionDenied, PostToolUse, PostToolUseFailure, PostToolBatch, Notification, MessageDisplay, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, StopFailure, TeammateIdle, InstructionsLoaded, ConfigChange, CwdChanged, DirectoryAdded, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, PreModelSwitch, PostModelSwitch, Elicitation, ElicitationResult e SessionEnd.

O catálogo usa só 9: PostToolUse (28 componentes), PreToolUse (27), Stop (11), SessionStart (8), Notification (4), SubagentStop (3), SessionEnd, WorktreeCreate e WorktreeRemove (1 cada). São 98 handlers `command` e 1 `agent`; nenhum `prompt`, `http` ou `mcp_tool`.

## Formato dos componentes

Cada hook é um `.json` com `description` e `hooks` (62 de 62), às vezes `supportingFiles` (7 casos) e `tags` (1 caso, o plan-mode-game). O desenho é o de um `hooks.json` de plugin: o `scripts/validate_components.py` do projeto embrulha cada JSON como `hooks/hooks.json` de um plugin de teste para rodar `claude plugin validate`, e o kit do Cesar já tem `plugins/exemplos/hooks/hooks.json` com `description` e `hooks`.

Scripts `.py` e `.sh` moram ao lado do `.json`, com o mesmo nome. O comando os chama de três jeitos:

- `"$CLAUDE_PROJECT_DIR"/.claude/hooks/x` (15 hooks);
- caminho relativo `.claude/hooks/x` (4 hooks: dangerous-command-blocker, shell-wrapper-guard, change-logger e debug-window), que só funciona se o diretório de trabalho do hook for a raiz do projeto;
- `$HOME/.claude/scripts/...` (só o plan-mode-game).

`HOOK_PATTERNS_COMPRESSED.json` não é componente: o `validate_components.py` o ignora com o comentário "reference data". Traz o desenho antigo (variáveis `CLAUDE_TOOL_*`) e padrões que a doc atual não descreve.

## Como a CLI instala

Comando mostrado na página do componente em aitmpl.com (ex.: `npx claude-code-templates@latest --hook security/dangerous-command-blocker`). Em `cli-tool/src/index.js` (`installIndividualHook`):

1. Baixa `.../main/cli-tool/components/hooks/<categoria>/<nome>.json` de raw.githubusercontent.com. É sempre a branch `main`, sem versão fixa nem hash.
2. No Windows troca `python3 ` por `python `.
3. Tenta baixar `<nome>.py` e `<nome>.sh` da mesma pasta e grava em `<raiz do escopo>/.claude/hooks/` com modo 755.
4. Descarta o campo `description`.
5. Pergunta (caixas de seleção, dá para marcar vários) onde gravar: usuário (`~/.claude/settings.json`), projeto (`.claude/settings.json`), local (`.claude/settings.local.json`, marcado por padrão) ou enterprise (`managed-settings.json`: macOS `/Library/Application Support/ClaudeCode`, Linux/WSL `/etc/claude-code`, Windows `C:\ProgramData\ClaudeCode`; exige administrador). Em modo silencioso grava no local; em instalação em lote, reaproveita o local escolhido uma única vez.
6. Mescla concatenando, por evento, o array de matchers ao que já existe. Não há checagem de duplicata: instalar duas vezes duplica a entrada.

Pontos de atenção:

- Pelo código, no escopo "usuário" o script cai em `~/.claude/hooks`, mas 15 JSONs apontam para `$CLAUDE_PROJECT_DIR/.claude/hooks` e 4 usam caminho relativo. Nesse escopo, esses hooks procuram o script no lugar errado (leitura de código; não testado).
- `supportingFiles` não é lido pelo instalador: a busca de código no repositório só achou leitura dele em `cli-tool/src/skill-dashboard.js` (skills). Seis dos sete repetem o script que a convenção `.py/.sh` já baixa. O `plan-mode-game` (7 arquivos em `~/.claude/scripts/plan-mode-game/`) depende dele e provavelmente não instala por completo pela CLI (não testado).
- Telemetria: `cli-tool/src/tracking-service.js` envia dados de instalação a www.aitmpl.com (`/api/track-download-supabase`, `/api/track-command-usage`, `/api/track-installation-outcome`); desliga com `CCT_NO_TRACKING=true`. O conteúdo enviado não foi verificado.
- A mensagem de erro 404 lista só 6 hooks (desatualizada), e o exemplo do README (`--hook git/pre-commit-validation`) não existe no repositório.

## Visão geral e números

89 arquivos em `cli-tool/components/hooks`: 62 componentes JSON, 1 arquivo de referência e 26 auxiliares (16 .sh, 8 .py, 1 .js, 1 .html). O `dashboard/public/counts.json` do próprio repositório também informa `hooks: 62`. Já a página https://www.aitmpl.com/hooks traz o título "39+ Claude Code Hooks" (04/10/2026), que está defasado em relação aos 62 do repositório.

O repositório guarda um campo `downloads` por componente em `dashboard/public/components/hooks.json`; o badge "1,266" da página do dangerous-command-blocker no site é igual ao valor desse campo. Números informados pelo repositório e pelo site, sem data de geração conhecida. Ranking: simple-notifications 10.061; smart-commit 3.651; update-search-year 3.306; lint-on-save 3.183; smart-formatting 2.908. Quatro desses cinco dependem das variáveis antigas ou de campo que a doc não lista (ver Cuidados), então popularidade não indica qualidade.

## O que há dentro (por categoria)

### automation (28 arquivos)
19 JSONs e 9 auxiliares (7 do plan-mode-game, mais change-logger.py e telegram-pr-webhook.py).

- Notificações desktop, Slack, Discord e Telegram (versões simples, detalhadas e de erro). As simples mandam só texto fixo e horário; as detalhadas mandam nome da pasta, duração da sessão, memória e horário. Webhooks e tokens vêm de variáveis de ambiente, e o envio é por `curl`.
- Integrações Vercel (deploy, sincronia de .env, saúde de deploy), logger de mudanças em CSV, carregador de AGENTS.md e um jogo de navegador para o modo plano.
- Eventos: Stop, SessionStart, PostToolUse, PreToolUse, Notification e SubagentStop.

Exemplos:
- `automation/simple-notifications.json`: em Stop e Notification dispara notificação local por osascript (macOS, com som "Ping") ou notify-send (Linux). Sem rede, sem exit 2. Lido inteiro.
- `automation/agents-md-loader.json`: em SessionStart (startup|resume), um `python3 -c` lê o `AGENTS.md` do diretório atual e o devolve em `hookSpecificOutput.additionalContext`. Só lê arquivo.
- `automation/vercel-auto-deploy.json`: em PostToolUse (Write|Edit|MultiEdit), com `VERCEL_TOKEN` e `VERCEL_PROJECT_ID`, na main/master faz POST em api.vercel.com/v13/deployments (produção, via `gitSource` da branch no GitHub, não das edições locais); em develop/staging roda `vercel --yes --force`. Dispara a cada edição bem-sucedida de .js/.ts/.json/.md/.css/.html, apesar de a descrição falar em "commit".
- `automation/plan-mode-game.json` (+ `plan-mode-game/`): ao entrar no modo plano sobe um servidor Node na porta 3456 (server.js e index.html de 37 KB), abre o navegador com `open` (só macOS) e repassa por `curl` a `http://localhost:3456/activity` o JSON de cada chamada de ferramenta enquanto o jogo está ativo. O `server.listen(PORT, ...)` não passa host, ou seja, escuta em todas as interfaces (acessível na rede local, não só em localhost), com CORS `*`, e guarda um segredo HMAC no arquivo `.secret` da pasta do script. Sem requisição externa nem processo filho no server.js.

### development-tools (11 arquivos)
9 JSONs e 2 scripts (debug-window.sh, worktree-ghostty.sh). Registro de comandos e edições, backup antes de editar, lint e formatação após editar, janela de debug ao vivo (SessionStart e SessionEnd) e layout de worktree no Ghostty (WorktreeCreate e WorktreeRemove). Cinco usam as variáveis antigas `$CLAUDE_TOOL_FILE_PATH` ou `$CLAUDE_TOOL_NAME` (change-tracker, command-logger, file-backup, lint-on-save, smart-formatting).

Exemplos:
- `lint-on-save.json`: PostToolUse em Edit|MultiEdit; roda `npx eslint --fix`, `pylint` ou `rubocop --auto-correct` no arquivo editado, com erros suprimidos. Reescreve arquivos e depende da variável antiga, então provavelmente não faz nada.
- `edit-audit-log.json`: PostToolUse em Edit; lê `tool_input.file_path` do stdin com jq (forma correta) e acrescenta data e arquivo em `$CLAUDE_PROJECT_DIR/.claude/edit-log.txt`. O nome do arquivo entra num `sh -c` via xargs, então um nome malicioso poderia injetar comando (inferência, não testado).
- `worktree-ghostty.sh`: WorktreeCreate roda `git fetch origin`, cria worktree em `../worktrees/<repo>/<nome>` e abre 3 painéis no Ghostty via osascript/System Events, usando e restaurando a área de transferência. WorktreeRemove: `git worktree remove --force` ou `rm -rf`, e `git branch -D`. Substitui o comportamento padrão de worktree; só macOS; exige jq, lazygit e yazi.
- `nextjs-code-quality-enforcer.json`: PostToolUse em Write|Edit|MultiEdit; lê o stdin com jq e confere convenções do Next.js. Sai com exit 2 ao achar problema, mas em PostToolUse a ferramenta já rodou e nada é desfeito.

### doordash (8 arquivos)
4 JSONs e 4 `.sh` com python3 embutido. Guardas para quem deixa o Claude pedir comida pelo CLI `dd-cli`: bloqueio por alérgenos de anafilaxia, checagem de pedido em grupo, limite de gasto e trilha de auditoria. Dependem do `dd-cli` e de skills doordash-* que não vêm no catálogo de hooks; para o kit interessam como padrão (guarda determinística, auditoria e política protegida), não como código. Todos terminam em `exit 0` sem fazer nada se o python3 não existir (falham abertos).

Exemplos:
- `doordash-spend-guard.sh`: PreToolUse em Bash; exit 2 se `dd-cli order checkout-url` ou `dd-cli cart add-items` não passam pelo wrapper `dd-guard.sh`, e se algum comando escreve em `limits.json` (política que só o `/doordash-budget` interativo muda). Sem rede e sem escrita. Lido inteiro.
- `doordash-allergy-checkout-gate.sh`: no checkout bloqueia (exit 2) se faltar o "dump" do carrinho vetado, se ele estiver mais velho que a última alteração do carrinho ou se casar com alérgenos de anafilaxia (com sinônimos) de `~/.claude/doordash-profile/dietary.json`. Nas alterações do carrinho grava um timestamp em `~/.claude/doordash-profile/mutations/<uuid>` (fora do projeto). Lê dado de saúde do perfil. A descrição diz que é "tripwire", não proteção de nível médico.
- `doordash-audit-log.sh`: PostToolUse em Bash; acrescenta uma linha JSON por chamada de `dd-cli` em `~/.claude/dd-guard/audit.jsonl`, após mascarar tokens, senhas e `Authorization: Bearer`. Nunca bloqueia, sem rede; escreve fora do projeto.
- `doordash-group-checkout-gate.sh`: no checkout de carrinho com ledger `.dd/round-*.json` executa ele mesmo `dd-cli cart show` (timeout de 30 s) e confere os alérgenos de cada pessoa no `team-food.json`. Exit 2 em conflito e também se o `dd-cli` falhar, o que pode travar o trabalho.

### git-workflow (2 arquivos)
2 JSONs, sem scripts. Automatizam o Git a cada edição; os dois dependem de `$CLAUDE_TOOL_FILE_PATH`. Se a variável chegar vazia, não fazem nada; se funcionarem, alteram o repositório sozinhos.

- `auto-git-add.json`: PostToolUse em Edit|MultiEdit|Write; `git add` no arquivo editado, se estiver num repositório. Pode colocar no stage arquivos que não deveriam ir (ex.: `.env` fora do .gitignore).
- `smart-commit.json`: PostToolUse em Edit e Write; faz `git add` e `git commit` automático a cada edição, com mensagens "Update X: minor/moderate/major changes (N lines)" (Edit) e "Add new file: X" (Write). Polui o histórico e comita sem revisão.

### git (6 arquivos)
3 JSONs e 3 scripts Python, todos PreToolUse em Bash, lendo o stdin corretamente e negando por JSON (`hookSpecificOutput.permissionDecision: "deny"`) com exit 0. Impõem Git Flow e Conventional Commits. São opinativos: as mensagens citam comandos `/feature`, `/release` e `/hotfix` que não fazem parte do hook.

- `conventional-commits.py`: em `git commit -m` extrai a mensagem (aspas ou heredoc) e nega se não seguir `tipo(escopo): descrição`, com os tipos feat, fix, docs, style, refactor, perf, test, chore, ci, build e revert. Se não consegue extrair a mensagem, deixa passar. Sem rede.
- `prevent-direct-push.py`: nega `git push` quando a branch atual é main/develop ou o comando cita `origin main/develop`. Tem uma falha: qualquer comando com `-f` no texto (inclusive `--follow-tags`) é tratado como force-push e passa por este hook; a cobertura de force-push fica com o force-push-blocker.
- `validate-branch-name.py`: em `git checkout -b` exige `feature/*`, `release/vX.Y.Z[-pre]` ou `hotfix/*`. Não olha `git switch -c`.

### monitoring (5 arquivos)
3 JSONs, `context-timeline.py` (52 KB) e `langsmith-tracing.sh` (34 KB). Observabilidade: notificação ao fim da resposta, painel local de contexto e linha do tempo, e envio de traces a um serviço externo. Os dois grandes são os mais invasivos do catálogo de hooks.

- `context-timeline.py`: SessionStart/PreToolUse/PostToolUse/Stop; sobe um daemon HTTP em 127.0.0.1:7878 (fallback 7879-7888, ou a porta de `CONTEXT_TIMELINE_PORT`), abre o navegador e lê a transcrição em `~/.claude/projects/<cwd>/<sessão>.jsonl`; grava estado em `~/.claude/state/context-timeline` e desliga após 1 h parado. As rotas GET `/api/state`, `/api/stream` e `/api/sessions` e a rota POST `/event` não têm autenticação, e as respostas levam `Access-Control-Allow-Origin: *` (risco teórico para páginas abertas no navegador; não testado). Sem rede externa.
- `langsmith-tracing.sh`: Stop; se `TRACE_TO_LANGSMITH=true` e houver chave, converte a transcrição (mensagens, tool_use e tool_result) e envia por `curl` a api.smith.langchain.com (endereço fixo no script). Exige jq, curl e uuidgen; registra em `~/.claude/state/hook.log`; termina sempre com exit 0. Não deve ser distribuído por plugin sem aviso claro de privacidade.
- `desktop-notification-on-stop.json`: Stop; notificação local "Response complete" por osascript ou notify-send. Sem rede, sem bloqueio.

### performance (2 arquivos)
2 JSONs com comandos bash inline grandes. Orçamento de bundle e medição de desempenho; ambos têm problemas de portabilidade e de eficácia.

- `performance-budget-guard.json`: PostToolUse em Bash após `npm run build`/`next build`/`vercel build`/`yarn build`: soma os `.js` de `.next/static/chunks` com `stat -f%z` (só BSD/macOS) e sai com exit 2 acima de 350 KB (limite fixo); em Write|Edit|MultiEdit alerta arquivo acima de 100 KB, muitos imports, wildcard, moment e lodash inteiro. Exit 2 em PostToolUse não desfaz o build, e os avisos em exit 0 não aparecem a ninguém.
- `performance-monitor.json`: PreToolUse/PostToolUse em `*`; acrescenta linhas em `~/.claude/performance.csv` (fora do projeto) com data, CPU e memória do próprio shell do hook e `$CLAUDE_TOOL_NAME`, e apara o arquivo acima de 1000 linhas. Usa `date +%s.%N` (o próprio langsmith-tracing.sh comenta que o macOS não suporta %N). Mede o shell do hook, não o Claude.

### post-tool (4 arquivos)
4 JSONs simples, todos PostToolUse em Edit (um também em Write). Formatação, stage e testes depois de cada edição. Todos dependem de `$CLAUDE_TOOL_FILE_PATH`, exceto run-tests-after-changes.

- `format-javascript-files.json`: `npx prettier --write` em .js/.ts/.jsx/.tsx editados; erro suprimido. O `npx` pode buscar o pacote no npm se não houver prettier local (comportamento geral do npx).
- `format-python-files.json`: `black` em .py editados; erro suprimido se não estiver instalado.
- `git-add-changes.json`: `git add` do arquivo depois de Edit e de Write. Mesmo risco do auto-git-add.
- `run-tests-after-changes.json`: se existir `package.json`, roda `npm run test:quick` após cada Edit (script do projeto) e imprime um aviso, que em exit 0 não aparece.

### pre-tool (4 arquivos)
4 JSONs simples, todos PreToolUse. Backup antes de editar, aviso de console.log, aviso antes de Bash e reescrita de consulta de busca. Eficácia duvidosa: dois dependem da variável antiga, um só imprime texto com exit 0 e um devolve um campo que a doc não lista.

- `backup-before-edit.json`: antes de Edit copia o arquivo para `<arquivo>.backup.<epoch>` ao lado do original. Espalha cópias na árvore do projeto.
- `console-log-cleaner.json`: se a branch for main/master/production/prod e o arquivo for JS/TS, lista até 5 linhas com `console.`. Só avisa, em exit 0.
- `notify-before-bash.json`: imprime "About to run bash command..." antes de qualquer Bash. É um echo em exit 0.
- `update-search-year.json`: em WebSearch, um python inline acrescenta o ano à consulta quando não há ano nem palavra de tempo. Devolve `modifiedToolInput`, enquanto a doc atual lista `updatedInput`; provavelmente sem efeito (não testado).

### quality-gates (6 arquivos)
3 JSONs e 3 `.sh`, vindos do pm-workspace (MIT, citado no cabeçalho). Desenvolvimento guiado por especificação e TDD. Só o tdd-gate bloqueia de verdade (exit 2); plan-gate e scope-guard só avisam em exit 0, o que a doc diz que ninguém vê.

- `tdd-gate.sh`: PreToolUse em Edit|MultiEdit|Write; lê o stdin com jq e, para código de produção (.java, .py, .ts, .go...), procura arquivo de teste de mesmo nome perto do arquivo (profundidade 2) e depois no projeto com `find -maxdepth 6`; sem achar, sai com exit 2 e bloqueia a edição. Isenta testes, configs, migrações, .md, .json etc. Em pacotes Java profundos, o limite de 6 níveis pode gerar falso "sem teste" (inferência da leitura).
- `scope-guard.sh`: Stop; compara `git diff` com os arquivos listados na seção "Files to Create/Modify" da `.spec.md` mais recente (últimos 60 min) e escreve no stderr os de fora do escopo. Sempre exit 0.
- `plan-gate.sh`: PreToolUse; avisa se não há `.spec.md` alterada nos últimos 14 dias. Lê `CLAUDE_TOOL_INPUT_FILE` (variável que a doc não cita); se vier vazia sai em silêncio. Sempre exit 0.

### security (11 arquivos)
8 JSONs e 3 scripts (dangerous-command-blocker.py, secret-scanner.py, shell-wrapper-guard.sh). É a categoria mais útil para iniciante, com ressalvas. Sem rede explícita, exceto o ai-bash-guard (chama um modelo) e o security-scanner (`semgrep --config=auto`, que pelo desenho do semgrep consulta o registro de regras dele; comportamento da ferramenta, não verificado aqui).

- `dangerous-command-blocker.py`: PreToolUse em Bash, três níveis de regex. Nível 1 (exit 2): rm em `/`, `~` ou `*`, dd, mkfs, fork bomb, chmod 777 `/`, chown em `/`. Nível 2 (exit 2): rm/mv de `.claude`, `.git`, `node_modules`, `.env` e manifestos (package.json, lockfiles, Cargo.toml, go.mod, requirements.txt, Gemfile, composer.json); isso inclui o `rm -rf node_modules`, rotina em projetos JS. Nível 3 (só avisa, exit 0, invisível): `rm` encadeado, `rm` com curinga, `find -delete`, `xargs rm`. Sem rede, sem escrita. Usa caminho relativo `python3 .claude/hooks/...` no JSON. As mensagens ainda mandam desativar em `.claude/hooks.json`, que não é onde ficam os hooks. Lido inteiro.
- `secret-scanner.py`: PreToolUse em Bash para `git commit`; varre os arquivos staged (ou os de `commit -a` / `git add` encadeado) com 52 regex (AWS, Anthropic, OpenAI, GitHub, Stripe, chaves privadas, JWT, strings de conexão) e sai com exit 2 diante de qualquer achado, até de severidade "low" (formato UUID). Imprime até 50 caracteres do segredo no stderr, que vai para a conversa. Linhas de comentário com "example" ou "placeholder" são ignoradas (contorno trivial). Sem rede. Lido inteiro.
- `shell-wrapper-guard.sh`: PreToolUse em Bash; acha comando destrutivo dentro de `sh -c`, `python -c`, `node -e`, `perl/ruby -e`, pipe para shell, here-string e wrappers de env (rm -rf, git reset --hard, git clean, mkfs, dd, chmod 777); exit 2. Se o `jq` não estiver instalado, o comando vem vazio e o hook deixa tudo passar em silêncio. Usa caminho relativo `bash .claude/hooks/...` no JSON. O cabeçalho cita um `destructive-guard.sh` que não está no catálogo.
- `ai-bash-guard.json`: PreToolUse em Bash com `type: "agent"`, `model: "haiku"` e `timeout: 20`: um subagente avalia cada comando e responde allow ou deny em JSON. Custa chamada de modelo e latência a cada Bash; a doc marca hooks agent como experimentais. O `allow` explícito pula o prompt interativo de permissão para o que o modelo aprovar. A descrição afirma ser o único padrão de bloqueio por IA, mas a doc também lista o tipo `prompt`.
- `force-push-blocker.json`: PreToolUse em Bash com `if` `Bash(git push *--force*)` e `Bash(git push *-f*)`: um echo devolve deny em JSON. Sem script. Pega também `--force-with-lease`, e o padrão `*-f*` pode pegar pushes cujo texto contenha `-f` (inferência, não testado).
- `env-file-protection.json`: PreToolUse com matcher `Write` e `if` `Write(.env*)`; nega por JSON. Não cobre Edit nem Bash.
- `file-protection.json`: PreToolUse em Edit|MultiEdit|Write; usa `$CLAUDE_TOOL_FILE_PATH` e sai com exit 1, que não bloqueia.
- `security-scanner.json`: PostToolUse em Edit|Write; roda semgrep, bandit (só .py) e gitleaks se existirem, mais um grep de segredos, com erros suprimidos e variável antiga.

### testing (1 arquivo)
- `test-runner.json`: PostToolUse em Edit; para .js/.ts roda `npm test` ou `yarn test` (suíte inteira), para .py roda pytest no arquivo, para .rb `bundle exec rspec`, com erros suprimidos. Executa o código e os testes do projeto a cada edição; depende da variável antiga.

### (raiz) HOOK_PATTERNS_COMPRESSED.json (1 arquivo)
Arquivo de referência de 3,5 KB, não um componente. Traz 9 padrões (logging, backup, format, git, notify, test, build, security, protect), trechos de comando reaproveitáveis e um mapa de variáveis `CLAUDE_TOOL_NAME`, `CLAUDE_TOOL_FILE_PATH` e `CLAUDE_PROJECT_DIR`: o desenho antigo, que a doc atual não descreve. O padrão "protect" sai com exit 1 (não bloqueia) ao tocar em `/etc/*`, `/usr/bin/*`, `*.production.*`, `*prod*config*` ou `/node_modules/*`, e o arquivo fixa `structure: ALWAYS_USE_ARRAYS_FOR_EVENTS`. Não achei quem o consuma.

### Fora desta pasta, mas ligado a hooks
- `cli-tool/components/settings/hooks/subagent-lifecycle-logger.json`: um hook no tipo "settings".
- `cli-tool/components/mods/**/hooks/`: os 39 "mods" do catálogo (`counts.json`) são outro tipo, com "function hooks" em TypeScript (vários trazem `hooks/hooks.json`). Fora desta frente.
- `cli-tool/components/skills/development/hook-development/`: skill sobre escrever hooks, com `scripts/hook-linter.sh`, `test-hook.sh` e `validate-hook-schema.sh` (existência confirmada no tree.json; conteúdo não lido).
- `cli-tool/docs_to_claude/HOOKS_GUIDE.md` (33 KB, não lido) e quatro posts de blog do projeto sobre hooks em `dashboard/public/blog/` (function-hooks-claude-code, performance-budget-guard-hook, security-hooks-secrets, simple-notifications-hook; não lidos).

## Quais são seguros de recomendar a um iniciante

Sem rede, sem escrita fora do projeto e sem efeito colateral grande:

- `simple-notifications` e `desktop-notification-on-stop`: só notificação local (macOS e Linux; Windows fica de fora; Stop dispara a cada resposta e pode ser barulhento).
- `env-file-protection`: nega Write em `.env*`; limite: não cobre Edit nem Bash.
- `force-push-blocker`: nega force-push, inclusive `--force-with-lease`; limite: padrão `*-f*` largo.
- `conventional-commits` (opinativo: só serve a quem adota Conventional Commits).
- `dangerous-command-blocker` e `shell-wrapper-guard`: servem como rede de segurança, mas são regex fáceis de contornar; usam caminho relativo (a instalação precisa estar no projeto e o diretório de trabalho do hook precisa ser a raiz); o primeiro bloqueia `rm -rf node_modules`; o segundo não faz nada sem `jq`.
- `secret-scanner`: sem rede, mas bloqueia por falso positivo (UUID) e imprime parte do segredo na conversa.

Evitar: os de rede (webhooks, langsmith-tracing, vercel-*), deploy, build ou teste automático a cada edição, commit/stage automático, `ai-bash-guard` (custo, latência e auto-aprovação), `plan-mode-game` e `context-timeline` (servidores locais) e todos os que dependem das variáveis antigas.

## O que vale aproveitar

1. Padrão de recusa por JSON e campo `if` (`conventional-commits.py`, `force-push-blocker.json`, `env-file-protection.json`): melhor exemplo didático da forma atual de negar uma chamada. Esforço baixo. Cuidados: MIT, citar a origem; ajustar o `*-f*`; testar com `echo '{json}' | script` antes de publicar.
2. Pacote "guardas" como plugin do kit: juntar dangerous-command-blocker, shell-wrapper-guard, force-push-blocker, env-file-protection e secret-scanner num plugin com `hooks/hooks.json`, trocando os caminhos por `${CLAUDE_PLUGIN_ROOT}/x`. O formato do catálogo já é quase o de um hooks.json de plugin, e o kit já distribui hooks assim (`plugins/exemplos/hooks/hooks.json`). Esforço médio. Cuidados: reescrever em vez de copiar (trocar jq por python ou avisar da dependência, tirar o falso positivo de UUID e o eco de 50 caracteres, corrigir as mensagens que mandam editar `.claude/hooks.json`, resolver os caminhos relativos); documentar que são regex; manter a atribuição MIT.
3. Notificação ao terminar (`simple-notifications.json`): hook mais inofensivo e útil, com dois eventos (Stop e Notification). Esforço baixo. Cuidados: osascript só no macOS e notify-send no Linux, Windows fica de fora; Stop dispara a cada resposta e pode ser barulhento.
4. Trilha de auditoria com limpeza de segredos (`doordash-audit-log.sh`, `change-logger.py`): PostToolUse passivo que nunca bloqueia, grava JSON por linha e mascara tokens antes de persistir. Esforço médio. Cuidados: o log pode guardar comandos sensíveis; gravar em pasta ignorada pelo git; o audit-log escreve em `~/.claude`, fora do projeto.
5. Padrão "guarda + trilha + política protegida" (`doordash-spend-guard.sh`): bloqueia o atalho (exige o wrapper), audita e proíbe o agente de editar o arquivo de limites. Serve para qualquer CLI sensível (kubectl, aws, deploy). Esforço médio. Cuidados: copiar a ideia, não o código; regex sobre texto de comando é contornável.
6. Gate de testes adaptado a Java/Maven em modo aviso (`tdd-gate.sh`): mapear `src/main/java/X.java` para `src/test/java/XTest.java`; ensina exit 2 e o limite de 8 bloqueios do Stop. Esforço médio. Cuidados: oferecer como opt-in; o `find -maxdepth 6` erra em pacotes profundos; manter crédito ao pm-workspace (MIT).
7. Guarda por modelo, tipos `prompt` e `agent` (`ai-bash-guard.json`): único exemplo do catálogo de handler que não é comando; serve para ensinar command x prompt x agent com custo e latência. Esforço baixo. Cuidados: agent é experimental; um `allow` pula o prompt de permissão; não recomendar a iniciantes.
8. `claude plugin validate` no CI (`.github/workflows/component-validate.yml`, `scripts/validate_components.py` do repositório pesquisado): valida estrutura de agentes, comandos, skills, hooks e MCPs em PRs (bloqueia em erro) e semanalmente no catálogo todo (só reporta). Esforço baixo. Cuidados: não valida segurança nem comportamento; não executei o validador no kit.
9. Mapa de cobertura de eventos para o post: o catálogo usa 9 dos 33 eventos. Ficam sem exemplo: PermissionRequest, UserPromptSubmit, PostToolBatch, PreCompact/PostCompact, FileChanged, CwdChanged, InstructionsLoaded, SubagentStart, entre outros. Esforço baixo. Cuidados: a lista muda entre versões; conferir a doc na hora de publicar.
10. `context-timeline.py` como referência de arquitetura: daemon em Python puro que lê a transcrição JSONL direto, mais painel no navegador; comparar com o csr-cockpit. Esforço alto. Cuidados: não distribuir (servidor local sem autenticação, CORS `*`, 52 KB para auditar, abre navegador sozinho).
11. Skill `hook-development` do repositório (`cli-tool/components/skills/development/hook-development/`): inclui linter, testador e validador de schema de hooks. Esforço baixo. Cuidados: conteúdo não lido; confirmar licença e se bate com a doc atual antes de copiar.
12. Lição para o blog: popularidade não é qualidade (4 dos 5 hooks mais baixados dependem das variáveis antigas ou de campo que a doc não lista). Esforço baixo.

## Cuidados

- Variáveis antigas: 17 dos 62 JSONs usam `$CLAUDE_TOOL_FILE_PATH` ou `$CLAUDE_TOOL_NAME` (automation 1, development-tools 5, git-workflow 2, performance 1, post-tool 3, pre-tool 2, security 2, testing 1), e `plan-gate.sh` usa `CLAUDE_TOOL_INPUT_FILE`. O guia e a referência de hooks lidos hoje não citam essas variáveis; o guia manda ler `tool_input.file_path` do stdin. Provavelmente chegam vazias e esses hooks não fazem nada, mas não testei; vale um teste de 5 minutos antes de afirmar no blog.
- Campos que a doc atual não lista: `update-search-year.json` devolve `modifiedToolInput` (a doc lista `updatedInput`); `file-protection.json` e o padrão "protect" saem com exit 1 (erro que não bloqueia). Matchers com `MultiEdit` aparecem no catálogo, mas a referência de hooks lida hoje não cita essa ferramenta.
- Avisos invisíveis: vários hooks "avisam" com echo e exit 0 (plan-gate, scope-guard, nível 3 do dangerous-command-blocker, notify-before-bash, run-tests-after-changes, avisos do performance-budget-guard). Pela doc, em exit 0 o stdout e o stderr só vão para o log de depuração (exceto nos 4 eventos que injetam contexto). Leitura da doc, não teste.
- Exit 2 em PostToolUse (nextjs-code-quality-enforcer, performance-budget-guard, vercel-environment-sync, deployment-health-monitor) não desfaz nada, porque a ferramenta já rodou; a descrição desses hooks fala em "bloquear" e engana.
- Hooks que podem bloquear o trabalho com exit 2 em PreToolUse: dangerous-command-blocker, shell-wrapper-guard, secret-scanner (qualquer achado, até UUID "low"), tdd-gate e os guardas doordash.
- Caminhos relativos: dangerous-command-blocker, shell-wrapper-guard, change-logger e debug-window chamam `.claude/hooks/x` sem `$CLAUDE_PROJECT_DIR`; dependem do diretório de trabalho do hook (não testado o que acontece quando o script não é achado).
- Hooks de maior risco, para não recomendar: vercel-auto-deploy (deploy de produção a cada edição na main/master), langsmith-tracing (envia mensagens, chamadas e resultados de ferramentas a api.smith.langchain.com), build-on-change e test-runner (build e teste a cada Edit), auto-git-add e smart-commit (alteram o repositório sozinhos), worktree-ghostty (substitui a criação de worktree, usa System Events, mexe na área de transferência e faz `rm -rf`/`branch -D`), context-timeline e plan-mode-game (servidores locais com CORS `*`; o segundo escuta em todas as interfaces e recebe o JSON de cada ferramenta usada), ai-bash-guard (auto-aprova o que o modelo liberar) e os webhooks Slack/Discord/Telegram (mandam texto e horário, nas versões detalhadas também nome da pasta, duração e memória, a terceiros).
- Sem `timeout` explícito, um hook de comando pode rodar até 600 s (padrão da doc); ex.: test-runner roda a suíte inteira a cada Edit.
- Instalador: baixa tudo da branch `main` sem versão fixa nem hash; o escopo enterprise grava em `managed-settings.json` e exige administrador; instalar duas vezes duplica a entrada; a mensagem de 404 lista só 6 hooks; o exemplo do README não existe no repositório. Há telemetria de instalação para aitmpl.com, com opt-out `CCT_NO_TRACKING=true`.
- Segurança do próprio catálogo: `component-security-validation.yml` dispara só para `cli-tool/components/**/*.md` e roda com `continue-on-error`; `cli-tool/src/security-audit.js` lista "hooks" entre os tipos, mas só lê arquivos `.md`; os workflows `skill-security-scan*` cobrem só skills; `component-validate.yml` usa `claude plugin validate` (estrutura) e, na varredura semanal, nunca bloqueia (palavras do próprio workflow: o catálogo ainda tem erros conhecidos). O `SECURITY.md` manda auditar hooks antes de habilitar. São 19 workflows; inspecionei por busca de padrões os 7 que tocam em componentes, segurança ou arquivos gerados, e não li os outros 12.
- Números do site em 04/10/2026: "39+ Claude Code Hooks" no título de /hooks (o repositório tem 62; `counts.json` também diz 62); badge "1,266" na página do dangerous-command-blocker igual ao campo `downloads` do repositório. Números informados pelo site e pelo repositório, sem data de geração conhecida. O WebFetch resume com modelo pequeno e errou contagens de eventos em duas leituras; as contagens deste relatório vêm do texto bruto do guia e do tree.json.
- Contagens: 89 arquivos em `cli-tool/components/hooks` (62 componentes, 1 referência, 26 auxiliares). Há também `cli-tool/components/settings/hooks/subagent-lifecycle-logger.json` e cópias geradas em `dashboard/public/component-content/hooks` e `dashboard/public/components/hooks.json` (62 entradas), que não entram na conta.
- Não executei nada do repositório pesquisado nem rodei hooks. As afirmações marcadas como inferência ou "não testado" vêm de leitura de código e de documentação, não de execução.
- Texto lido que tentou dar ordens: nenhum se dirigiu a mim. O único texto imperativo relevante é o prompt do `ai-bash-guard.json` ("You are a security guard..."), escrito para o subagente do hook e tratado apenas como dado.

## Fontes

- https://code.claude.com/docs/en/hooks-guide (tabela de eventos, exit codes, Stop com oito bloqueios, PreToolUse e `--dangerously-skip-permissions`, `allow`, depuração)
- https://code.claude.com/docs/en/hooks (referência: tipos de handler, `if`, `updatedInput`, timeouts padrão, `disableAllHooks`)
- https://www.aitmpl.com/hooks (título "39+")
- https://www.aitmpl.com/component/hook/security/dangerous-command-blocker (comando de instalação, badge "1,266")
- cli-tool/components/hooks/ (todos os 62 JSONs lidos por script; HOOK_PATTERNS_COMPRESSED.json; scripts: dangerous-command-blocker.py, secret-scanner.py, shell-wrapper-guard.sh, tdd-gate.sh, plan-gate.sh, scope-guard.sh, conventional-commits.py, prevent-direct-push.py, validate-branch-name.py, worktree-ghostty.sh, doordash-*.sh, context-timeline.py e langsmith-tracing.sh em trechos, plan-mode-game/activity.sh e server.js)
- cli-tool/src/index.js (installIndividualHook, replacePythonCommands), cli-tool/src/tracking-service.js, cli-tool/src/security-audit.js
- scripts/validate_components.py; .github/workflows/component-validate.yml, component-security-validation.yml, skill-security-scan.yml, generated-files-guard.yml
- dashboard/public/counts.json e dashboard/public/components/hooks.json (contagens e downloads informados pelo repositório)
- README.md, SECURITY.md e LICENSE do repositório davila7/claude-code-templates
- /private/tmp/claude-1068948898/-Users-cesar-schutz-Downloads-claude-code-kit/5f901f11-25f6-40d4-85ad-3af709ec508c/scratchpad/tree.json
- Repositório local do Cesar, só leitura: plugins/exemplos/hooks/hooks.json, plugins/exemplos/.claude-plugin/plugin.json, hooks/responder-em-portugues/README.md

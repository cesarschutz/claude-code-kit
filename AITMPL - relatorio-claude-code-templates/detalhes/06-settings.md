# 06 · O tipo CONFIGURAÇÕES (cli-tool/components/settings, 13 subpastas, statusline com 35 arquivos)

Pesquisa feita em 04/10/2026 (Claude Code 2.1.289 na máquina). Repositório: davila7/claude-code-templates. Site: aitmpl.com.

## Explicação

### O que é

`cli-tool/components/settings/` é a pasta de "configurações" do davila7/claude-code-templates (licença MIT, copyright 2025 Daniel (San) Ávila, lido no arquivo LICENSE). Tem 75 arquivos em 13 subpastas: 72 JSON e 3 scripts Python, todos os 3 na statusline. Cada JSON é um fragmento de `settings.json` mais um campo `description`, que não é chave oficial (nenhuma entrada de settings-reference tem esse nome; o instalador o remove antes de gravar).

Os 72 JSON usam só 22 chaves de topo diferentes: `env`, `permissions`, `hooks`, `statusLine`, `apiKeyHelper`, `forceLoginMethod`, `cleanupPeriodDays`, `spinnerVerbs`, `spinnerTipsOverride`, `spinnerTipsEnabled`, `awaySummaryEnabled`, `verbose`, `outputStyle`, `companyAnnouncements`, `awsAuthRefresh`, `awsCredentialExport`, `model`, `includeCoAuthoredBy`, `alwaysThinkingEnabled`, `enableAllProjectMcpServers`, `enabledMcpjsonServers`, `disabledMcpjsonServers`. Ficam sem cobertura chaves oficiais importantes: `sandbox`, `attribution`, `permissions.defaultMode`, `autoMode`, `modelPicker`, `footerLinksRegexes` e `subagentStatusLine` (todas existem no índice de https://code.claude.com/docs/en/settings-reference).

As 52 variáveis de `env` distintas: 41 constam na documentação oficial. As outras 11 não constam: `GIT_FLOW_*` (6, inventadas pelo pacote e nunca lidas por nada no próprio arquivo), `TRACE_TO_LANGSMITH` e `CC_LANGSMITH_*` (4, dependem de ferramenta de terceiros) e `DISABLE_NON_ESSENTIAL_MODEL_CALLS`.

No aitmpl.com cada item tem página própria, com o comando `npx claude-code-templates@latest --setting statusline/context-monitor` (página lida hoje). Números informados pelo site em 04/10/2026: 1.340.064 downloads, 270 PRs de componentes e 239.282 instalações npm (globais). O arquivo https://www.aitmpl.com/components.json traz downloads por item: os 72 settings somam 59.530 downloads, a statusline responde por 26.584, environment por 12.733 e permissions por 8.709. Os mais baixados: context-monitor 15.515 (a página do componente mostra o mesmo número), performance-optimization 7.190, development-utils 3.876, colorful-statusline 3.697, development-mode 3.011. Os menos baixados incluem worktree-context-statusline (8) e minimax-provider (7). Popularidade não indica qualidade: vários dos mais baixados têm defeitos descritos adiante.

### Como se instala

O comando `--setting` (opção existente em cli-tool/bin/create-claude-config.js) chama `installIndividualSetting()` em cli-tool/src/index.js (linhas 711 a 1069; a cópia lida é idêntica ao main de hoje). A função baixa o JSON do GitHub (raw, branch main), remove `description` e `files` e pergunta onde gravar: local (marcado por padrão), projeto, usuário ou enterprise (`managed-settings.json`, exige administrador). O merge é raso:

- `permissions.allow`, `deny` e `ask` são unidos sem duplicar; as demais chaves de `permissions` (por exemplo `additionalDirectories`) são substituídas, não mescladas.
- `env` é mesclado; conflito de variável pede confirmação.
- `hooks` é substituído por evento, sem aviso: hooks que você já tinha no mesmo evento se perdem.
- Chaves de topo diferentes das três acima, se já existirem com outro valor, pedem confirmação.
- Em Windows, troca `python3 ` por `python `. Na statusline baixa o `.py` para `.claude/scripts/` (chmod 755) e, nos escopos usuário e enterprise, reescreve o caminho do comando para absoluto.
- O caminho enterprise do Windows é `C:\ProgramData\ClaudeCode`, que a documentação diz ser legado e não lido pelo Claude Code (o caminho atual é `C:\Program Files\ClaudeCode\`). Em macOS (`/Library/Application Support/ClaudeCode`) e Linux (`/etc/claude-code`) os caminhos conferem.
- O instalador envia estatística de uso ao aitmpl.com. Uma instalação de setting gera dois tipos de envio: `{type, name, path, category, cliVersion}` para `/api/track-download-supabase` e, ao fim, `{success ou failure, errorType, errorMessage, durationMs, cliVersion, nodeVersion, platform, arch, batchId}` para `/api/track-installation-outcome`. Desligam o rastreio `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true` (cli-tool/src/tracking-service.js).

### Como a statusline funciona

Pela documentação oficial (https://code.claude.com/docs/en/statusline): `statusLine` é `{type: "command", command, padding?, refreshInterval?, hideVimModeIndicator?}`. O Claude Code executa o comando com o JSON da sessão no stdin (`model`, `workspace` com `git_worktree` e `repo`, `context_window.used_percentage` e `context_window_size`, `cost`, `rate_limits`, `worktree`, `pr`, `prompt_cache` etc.) e exibe o que o script imprime, com várias linhas, cores ANSI e links OSC 8. Roda ao iniciar a sessão e depois a cada mensagem do assistente, ao terminar `/compact`, ao trocar o modo de permissão ou o modo vim, quando o `command` muda, por `refreshInterval` e quando uma janela de limite ou o cache de prompt expira. Há debounce de 300 ms. Se um novo gatilho dispara enquanto o script ainda roda, o script em andamento é cancelado; fora isso, script lento bloqueia a atualização. Saída vazia ou código de saída diferente de zero deixa a barra em branco. Não gasta tokens. É um único objeto: a chave do escopo de maior precedência vale. Em settings de projeto só roda depois de aceitar a confiança na pasta. O comando `/statusline` gera o script a partir de uma frase e grava as configurações. A doc recomenda cachear operações lentas (como `git status`).

### As 13 subpastas em uma linha

- `api` (4): provedor e rede, em `env` (Bedrock, Vertex, proxy, cabeçalhos).
- `authentication` (3): `apiKeyHelper` e `forceLoginMethod`.
- `cleanup` (2): `cleanupPeriodDays`, retenção de transcrições (padrão 30 dias, mínimo 1).
- `environment` (5): variáveis de `env` de uso geral (timeouts, saída, privacidade) e um `spinnerVerbs` que não é ambiente.
- `git` (1): pacote Git Flow com statusline, permissões, env e hooks.
- `global` (6): chaves soltas de topo (AWS, anúncios, estilo Concise, modelo, coautoria, dicas do spinner).
- `hooks` (1): log de subagentes.
- `mcp` (4): aprovação de servidores do `.mcp.json` e timeouts.
- `model` (2): `model` fixo em Haiku 4.5 ou Sonnet 4.6.
- `partnerships` (2): configurações patrocinadas que trocam o provedor de modelo (GLM da Z.ai e MiniMax).
- `permissions` (6): predefinições de `allow`, `deny` e `additionalDirectories`.
- `statusline` (35): 32 JSON de linha de status e 3 scripts Python auxiliares.
- `telemetry` (4): OpenTelemetry, desligar telemetria e LangSmith.

### O que é bom

- Cobre bem o mapa do que dá para configurar: provedores, login, retenção, MCP, telemetria, permissões. Serve como catálogo de ideias.
- `worktree-context-statusline` é o script mais cuidadoso dos lidos: usa o `context_window` oficial (certo também para janelas de 1M), limita o git a 2 s e trata worktree e repositório bare.
- `deny-sensitive-files` é cópia do exemplo oficial de `permissions.deny` (settings-reference), sem a regra `Bash(curl *)`; a sintaxe está certa.

### O que preocupa

- Desatualizado: modelos 4.x fixados (na API Anthropic o alias `sonnet` hoje resolve para Sonnet 5.5), Vertex com lista de regiões de modelos 3.5 a 4.5 e `ANTHROPIC_SMALL_FAST_MODEL` (deprecada), `includeCoAuthoredBy` (deprecada desde a v2.0.62, substituída por `attribution`).
- Valores que já são o padrão (sem efeito): `BASH_DEFAULT_TIMEOUT_MS=120000`, `BASH_MAX_TIMEOUT_MS=600000`, `MCP_TIMEOUT=30000`, `verbose=false`, `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=0`, `alwaysThinkingEnabled=true`. `USE_BUILTIN_RIPGREP=1` não tem efeito documentado (a doc só descreve `0`).
- Defeitos verificados: `ANTHROPIC_CUSTOM_HEADERS` com `\n` literal (barra mais n) em vez de quebra de linha; `asset-pipeline-controller` e `unity-project-dashboard` com SyntaxError no Python (`ast.parse`, sem executar); `vercel-error-alert-system` com `grep -c || echo 0`, que gera "0" e "0" em duas linhas e quebra o teste numérico; `colorful-statusline` sem nenhum código de cor; `game-performance-monitor` com "60fps" fixo e `[ -f "*.uproject" ]` que nunca casa. Os hooks do `git-flow-settings` usam `$CLAUDE_TOOL_COMMAND` (não documentada), dois matchers `Bash(git commit:*)` e `Bash(git push:*)` que a doc trata como regex e não casam com o nome de ferramenta `Bash`, e `exit 1`, que não bloqueia (só `exit 2` bloqueia). Na prática só as regras `deny` protegem.
- Segurança: `development-mode` libera `python`, `node`, `npm`, `docker` e `git` inteiros, e o `deny` de `rm -rf` é contornável. `enable-all-project-servers` em `~/.claude/settings.json` aprova qualquer `.mcp.json` de repositório clonado. As parcerias redirecionam todo prompt e código a terceiros, uma com link de indicação. Chaves ficam em texto puro no settings. Statuslines de deploy fazem `curl` a cada atualização, sem cache; as de Vercel e Cloudflare sem timeout. `zero-config` lê o token da CLI da Vercel; as de Neon e Cloudflare leem o `.env`.
- Propaganda: os exemplos de `companyAnnouncements` e `spinnerTipsOverride` divulgam o aitmpl.com.

### O que o kit pode oferecer

Plugin não distribui configuração de usuário: o `settings.json` de um plugin só aceita `agent` e `subagentStatusLine`; as outras chaves são descartadas (https://code.claude.com/docs/en/plugins-reference). Pode distribuir `hooks/hooks.json` (o logger de subagentes, corrigido), skills, estilos de saída, `bin/`, mods (como uma faixa de contexto, no molde do exemplo `token-weather` da Anthropic) e `userConfig` com `sensitive: true` para segredos. Para `permissions`, `env`, telemetria e `statusLine`, o caminho é uma skill ou README de receitas com o JSON certo e atualizado. Minha leitura: o valor desta pasta para o kit é como catálogo do que existe, não como arquivo para copiar.

## As 13 subpastas, uma a uma

### api (4)

Todos mexem na chave oficial `env`. Os tokens ficam como placeholders em texto puro.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `bedrock-configuration.json` | `CLAUDE_CODE_USE_BEDROCK=1` e `AWS_BEARER_TOKEN_BEDROCK` de exemplo | Variáveis existem (opção E de credenciais na doc amazon-bedrock). Não define `AWS_REGION` (opcional se o perfil AWS já tem região) nem fixa modelos, o que a doc pede para equipes |
| `corporate-proxy.json` | `HTTP_PROXY` e `HTTPS_PROXY` de exemplo | Lidas pela doc network-config. SOCKS não é suportado; falta `NO_PROXY` no exemplo |
| `custom-headers.json` | `ANTHROPIC_CUSTOM_HEADERS` com três cabeçalhos | O formato da doc é `Nome: Valor` com quebra de linha; o arquivo grava `\n` literal (barra mais n), enquanto o exemplo da doc de Bedrock usa `\n` de JSON (quebra real). Efeito no Claude Code não testado |
| `vertex-configuration.json` | `CLAUDE_CODE_USE_VERTEX`, `CLOUD_ML_REGION=global`, `ANTHROPIC_VERTEX_PROJECT_ID`, regiões por modelo, `ANTHROPIC_MODEL` e `ANTHROPIC_SMALL_FAST_MODEL` | Os 7 nomes `VERTEX_REGION_CLAUDE_*` existem na doc, mas a lista é antiga (faltam 4.5 Opus, 4.6, 4.7, 4.8, 5.x e Fable); `ANTHROPIC_SMALL_FAST_MODEL` é deprecada. A doc agora chama o serviço de "Google Cloud's Agent Platform, formerly Vertex AI" |

### authentication (3)

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `api-key-helper.json` | `apiKeyHelper=/bin/generate_temp_api_key.sh` (placeholder) e `CLAUDE_CODE_API_KEY_HELPER_TTL_MS=3600000` | Helper acima de 10 s gera aviso; falha repetida derruba as requisições (doc authentication) |
| `force-claudeai-login.json` | `forceLoginMethod=claudeai` | Chave existe (valores `claudeai`, `console` e `gateway`; este só em fonte gerenciada). Na tela de login interativa apenas pré-seleciona, sem impor; os outros caminhos de login aplicam (v2.1.212 ou superior). Normalmente é posta em managed settings com `forceLoginOrgUUID` |
| `force-console-login.json` | `forceLoginMethod=console` (cobrança por API) | Mesmo comportamento |

Com `forceLoginMethod` ou `forceLoginOrgUUID` definidos em qualquer arquivo, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` e `apiKeyHelper` são bloqueados na inicialização; não convém combinar `api-key-helper` com um dos dois logins forçados.

### cleanup (2)

Chave `cleanupPeriodDays`: dias de retenção de transcrições e outros dados da aplicação, número inteiro, mínimo 1 (0 falha na validação), padrão 30. A limpeza roda em segundo plano depois que uma sessão inicia.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `retention-7-days.json` | `cleanupPeriodDays=7` | Privacidade; sessões mais antigas somem do `/resume` |
| `retention-90-days.json` | `cleanupPeriodDays=90` | Histórico maior; as transcrições ficam em texto puro em `~/.claude/projects/` por mais tempo |

### environment (5)

Mistura variáveis de `env` de uso geral com uma chave de interface.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `bash-timeouts.json` | `BASH_DEFAULT_TIMEOUT_MS=120000`, `BASH_MAX_TIMEOUT_MS=600000`, `BASH_MAX_OUTPUT_LENGTH=100000` | Os dois primeiros já são o padrão. O terceiro sobe o padrão de 30000 (máximo 150000); a chave `bashOutputMaxChars`, se definida, o ignora |
| `development-utils.json` | `USE_BUILTIN_RIPGREP=1`, `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1`, `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=0` | A doc só descreve `USE_BUILTIN_RIPGREP=0` (usar o `rg` do sistema); a segunda variável existe; a terceira só tem efeito com `1` |
| `friday-deploy-warning.json` | `spinnerVerbs` com `mode: replace` e o verbo "Don't Deploy On Fridays" | Chave oficial de interface, não de ambiente |
| `performance-optimization.json` | `CLAUDE_CODE_MAX_OUTPUT_TOKENS=8000`, `DISABLE_NON_ESSENTIAL_MODEL_CALLS=1`, `DISABLE_COST_WARNINGS=1` | A primeira e a terceira existem; a segunda não consta na doc atual. Limitar a saída a 8000 tokens pode cortar respostas longas |
| `privacy-focused.json` | `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_TELEMETRY`, `DISABLE_ERROR_REPORTING`, `DISABLE_BUG_COMMAND`, `DISABLE_AUTOUPDATER` | Todas valem. `DISABLE_BUG_COMMAND` é o nome antigo de `DISABLE_FEEDBACK_COMMAND` (desliga `/feedback`, `/bug` e `/share`). `DISABLE_AUTOUPDATER` só desliga a atualização em segundo plano (`claude update` manual segue; `DISABLE_UPDATES` bloqueia tudo): desligar significa perder correções de segurança. Desligar telemetria também desliga a avaliação de feature flags, o que pode tornar o Remote Control indisponível |

### git (1)

Pacote de 8 KB que mexe em quatro chaves: `statusLine`, `permissions`, `env` e `hooks`.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `git-flow-settings.json` | Statusline de Git Flow, `deny` de push em main/develop, `--force` e `reset --hard`, `allow` amplo de git e gh, variáveis `GIT_FLOW_*` e três hooks `PreToolUse` (nome de branch, mensagem de commit, push) | As chaves existem, o conteúdo falha: `GIT_FLOW_*` só são definidas, nunca lidas; os hooks dependem de `$CLAUDE_TOOL_COMMAND` (a doc entrega o JSON no stdin, com `tool_input.command`); `Bash(git commit:*)` e `Bash(git push:*)` como matcher viram regex e não casam com `Bash` (o certo é matcher `Bash` mais o campo `if`); `exit 1` não bloqueia, só `exit 2`; `grep -oP` não existe no `/usr/bin/grep` do macOS. Resta a proteção do `deny`, que a doc diz ser contornável (`git -C . push`, `git -c ...`), e `git push -u origin main` passaria pela regra `allow` `git push -u:*` (inferência) |

### global (6)

Chaves soltas de topo.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `aws-credentials.json` | `awsAuthRefresh` (`aws sso login`) e `awsCredentialExport` (script que devolve JSON) | Existem. A doc de Bedrock avisa que `awsAuthRefresh` pode abrir abas de login em loop atrás de proxies corporativos |
| `company-announcements.json` | `companyAnnouncements` com três mensagens | Existe (sorteia uma por sessão). Os exemplos são propaganda do aitmpl.com |
| `concise-mode.json` | `outputStyle: "Concise"`, `spinnerTipsEnabled=false`, `awaySummaryEnabled=false`, `verbose=false` | Concise é estilo embutido (v2.1.237 ou superior, o valor diferencia maiúsculas); `verbose=false` já é o padrão |
| `custom-model.json` | `model=claude-sonnet-4-6` e `ANTHROPIC_SMALL_FAST_MODEL=claude-haiku-4-5-20251001` | A segunda é deprecada (use `ANTHROPIC_DEFAULT_HAIKU_MODEL`) |
| `git-commit-settings.json` | `includeCoAuthoredBy=false` | Deprecada desde a v2.0.62 em favor de `attribution`; ainda é lida, mas ignorada quando `attribution.commit` ou `attribution.pr` existem |
| `spinner-tips-override.json` | `spinnerTipsOverride` com `excludeDefault=true` e uma dica | Existe; troca todas as dicas por um anúncio do aitmpl.com |

### hooks (1)

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `subagent-lifecycle-logger.json` | Eventos `SubagentStart` e `SubagentStop` gravam uma linha JSON em `.claude/agent-log.jsonl` do projeto | Os eventos existem. O nome do agente vem de `${CLAUDE_AGENT_NAME:-unknown}`, variável que não consta na doc (a doc entrega `agent_type` e `agent_id` no JSON do stdin), então o log provavelmente grava sempre "unknown". O arquivo cai dentro do repositório e precisaria de `.gitignore`. É o único item da pasta que um plugin poderia distribuir de verdade (`hooks/hooks.json`) |

### mcp (4)

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `enable-all-project-servers.json` | `enableAllProjectMcpServers=true` | Em `~/.claude/settings.json` aprova qualquer `.mcp.json` de repositório clonado (aprovação do usuário vale mesmo em pasta não confiável; a do arquivo do projeto, não). Risco |
| `enable-specific-servers.json` | `enabledMcpjsonServers`: memory, github, filesystem | Aprova só esses |
| `disable-risky-servers.json` | `disabledMcpjsonServers`: web-scraper, system-admin, network-tools | Nomes genéricos de exemplo, para trocar pelos do seu `.mcp.json`; a rejeição vale em qualquer arquivo |
| `mcp-timeouts.json` | `MCP_TIMEOUT=30000`, `MCP_TOOL_TIMEOUT=60000`, `MAX_MCP_OUTPUT_TOKENS=50000` | `MCP_TIMEOUT` já é o padrão. O timeout de ferramenta padrão é de cerca de 28 horas e o limite de saída padrão é 25.000 tokens, então 60 s passa a cortar ferramentas lentas |

### model (2)

Chave oficial `model`.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `use-sonnet.json` | `model=claude-sonnet-4-6` | ID válido, mas fixa versão antiga |
| `use-haiku.json` | `model=claude-haiku-4-5-20251001` | A doc só mostra esse ID no formato do Bedrock; fixa versão antiga |

Fixar versão serve para controle em equipes; alias (`sonnet`, `haiku`) serve para acompanhar. Datas de aposentadoria dos IDs: não verificado.

### partnerships (2)

Configurações patrocinadas que trocam o provedor de modelo: `env` com `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` e `ANTHROPIC_DEFAULT_HAIKU/SONNET/OPUS_MODEL` (todas existem; a doc diz que `ANTHROPIC_BASE_URL` muda para onde vão as requisições, não qual modelo responde). Com a URL fora de api.anthropic.com, o Remote Control é desligado (v2.1.196 ou superior) e a busca de ferramentas MCP fica desligada por padrão. Todo prompt e código vão a terceiros, fora das políticas de dados da Anthropic; termos e qualidade dessas empresas: não verificado.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `glm-coding-plan.json` | Redireciona para api.z.ai/api/anthropic com glm-4.5-air e glm-4.7, mais `alwaysThinkingEnabled=true` | Link de indicação com desconto na descrição; a descrição fala em GLM-4.6 enquanto o env aponta glm-4.7; `alwaysThinkingEnabled=true` não muda nada (o raciocínio já vem ligado) |
| `minimax-provider.json` | Redireciona para api.minimax.io/anthropic com MiniMax-M3 e M2.7 | Token de exemplo em texto puro |

### permissions (6)

Chaves `permissions.allow`, `permissions.deny` e `permissions.additionalDirectories`, todas oficiais. Regras da doc usadas: ordem deny, depois ask, depois allow, e o primeiro que casa decide; `:*` no fim equivale a ` *` e não está deprecado; regras de caminho usam sintaxe gitignore (`./.env` vale só no diretório atual); `Read` deny vale para as ferramentas de arquivo e para `cat`, `head`, `tail`, `sed`, `tee` reconhecidos, não para `grep -r` nem scripts Python ou Node (a doc manda usar sandbox); só `Edit` e `Read` são consultados para caminhos, regras `Write(...)` são aceitas e ignoradas.

| Arquivo | O que faz | Avaliação |
| --- | --- | --- |
| `additional-directories.json` | `additionalDirectories` com quatro caminhos de exemplo | Válido e seguro, desde que os caminhos sejam trocados. Em settings de projeto só vale após confiar na pasta; dá acesso a arquivos, não carrega configuração desses diretórios |
| `allow-git-operations.json` | Libera `git status`, `diff`, `add`, `commit`, `push`, `pull` e `log` sem perguntar | `git push:*` inclui `--force` e a branch main, ao contrário do que a descrição promete |
| `allow-npm-commands.json` | `npm run lint`, `npm run test:*`, `npm run build`, `npm start` | Regras exatas. `npm run test:*` equivale a `npm run test *` e, pela regra do espaço, não cobriria `npm run test:unit` (inferência da doc) |
| `deny-sensitive-files.json` | Nega `Read` de `./.env`, `./.env.*`, `./secrets/**`, `./config/credentials.json` | Cópia do exemplo oficial. Boa base, insuficiente sozinha: só na raiz do projeto (faltam `**/.env`, `~/.ssh`, `~/.aws`, chaves) e não cobre `grep -r` nem scripts |
| `development-mode.json` | Libera `npm`, `yarn`, `node`, `git`, `docker`, `python` e `pip` inteiros, mais `Read`, `Edit` e `Write` de js, ts, py e json; nega `.env*`, `secrets`, `rm -rf` e `sudo` | Na prática permite executar código arbitrário. O `deny` de `rm -rf` é contornável (`/bin/rm`, `bash -c`); `python:*` lê o `.env` mesmo com o `deny`; `npm:*` inclui `npm publish`; as regras `Write(...)` nunca são consultadas |
| `read-only-mode.json` | Permite `Read(**/*)`, `Glob`, `Grep`, `LS`; nega `Edit`, `Write`, `MultiEdit`, `Bash`, `WebFetch` | Não nega `WebSearch` nem ferramentas MCP; `LS` não está na lista oficial de ferramentas; `Glob` e `Grep` vêm ausentes por padrão em macOS e Linux. O equivalente oficial é `defaultMode: "plan"` |

### statusline (35)

32 JSON de linha de status mais 3 scripts Python auxiliares. 33 JSON definem `statusLine` (os 32 desta pasta e o `git-flow-settings` da pasta git). A chave `statusLine` é oficial e válida; o funcionamento está na seção "Como a statusline funciona".

**A. Genéricas (10 JSON)**

| Arquivo | O que mostra |
| --- | --- |
| `command-statusline.json` | Modelo mínimo que aponta para `~/.claude/statusline.sh` (você escreve o script) |
| `minimal-statusline.json` | `[modelo]` e pasta (jq) |
| `colorful-statusline.json` | Modelo, pasta e branch; a descrição promete cores ANSI, mas o comando não tem nenhum código de cor |
| `git-branch-statusline.json` | Modelo, pasta, branch e número de arquivos alterados (jq e git); no macOS o contador sai com espaços à esquerda |
| `time-statusline.json` | Modelo, pasta e hora |
| `project-info-statusline.json` | Modelo, pasta, versão do Node e do Claude Code |
| `context-monitor.json` | Chama `context-monitor.py`: barra de contexto de 8 segmentos colorida, branch, custo, duração e linhas alteradas |
| `worktree-context-statusline.json` | Chama `worktree-context-statusline.py`: projeto (nome do checkout principal em worktree), branch (marca ⑂ em worktree), modelo e contexto |
| `git-flow-status.json` | Ícone por tipo de branch (feature, release, hotfix), ahead/behind, alterações e destino do merge; só faz sentido com Git Flow |
| `deadline-countdown.json` | Chama `deadline-countdown.py`: branch, mudanças e contagem até `DEADLINE_TIME` (padrão 15:30), com cor por urgência |

**Scripts Python (3)**

| Arquivo | O que faz |
| --- | --- |
| `context-monitor.py` | Lê o transcript inteiro (`readlines`) a cada atualização, olha as 15 últimas linhas e divide os tokens por 200000 fixo, em vez de usar `context_window.used_percentage`; usa `cost.*` para custo, duração e linhas |
| `worktree-context-statusline.py` | Usa `context_window_size` e `used_percentage` oficiais, `git -C` com timeout de 2 s, `git worktree list` para achar o projeto principal e trata repositório bare; esconde o contexto antes da primeira resposta e após `/compact` |
| `deadline-countdown.py` | Branch, contagem de arquivos alterados e tempo até o prazo, verde acima de 2 h, vermelho abaixo de 1 h, piscando abaixo de 30 min, "OVERTIME" depois |

**B. Deploy e banco (8 JSON)**

| Arquivo | O que mostra |
| --- | --- |
| `vercel-deployment-monitor.json` | Estado do último deploy via api.vercel.com (`VERCEL_TOKEN`, `VERCEL_PROJECT_ID`), tempo e link OSC 8; `curl` a cada atualização, sem cache nem timeout |
| `vercel-error-alert-system.json` | Conta erros nos 5 últimos deploys e dispara notificação `osascript` (macOS) a cada atualização enquanto houver erro; `grep -c ... \|\| echo 0` gera "0" e "0" e quebra o teste numérico (a saída sai em duas linhas); o arquivo `/tmp/vercel_errors_<sessão>` é gravado e nunca lido |
| `vercel-multi-env-status.json` | Produção e preview lado a lado nos 10 últimos deploys |
| `zero-config-deployment-monitor.json` | Acha o token no `auth.json` da CLI da Vercel e o projeto em `.vercel/project.json`; lê credencial fora do alcance das regras de permissão |
| `cloudflare-pages-deployment-monitor.json` | Deploy do Cloudflare Pages com link; lê `CLOUDFLARE_*` do `.env`; `curl` sem timeout |
| `neon-database-context.json` | Projeto, branch padrão do projeto Neon, estado do compute e faixa de CU via API (3 `curl` com `-m 3`, lê o `.env`). Mostra o branch padrão, não o branch ao qual o app se conecta |
| `neon-database-dev.json` | DNS (`nslookup`) e porta 5432 (`nc` com `timeout 3`), "tempo de resposta" por `date +%s` (resolução de 1 s) e uso via API; `timeout` não existe no macOS padrão |
| `neon-database-resources.json` | Armazenamento, horas de compute e custo estimado com preços fixos no script (0,25 por hora e 0,0001 por MB), via `consumption_history` (`-m 5`) |

**C. Jogos (4 JSON)**

| Arquivo | O que mostra |
| --- | --- |
| `asset-pipeline-controller-statusline.json` | Texturas, modelos e áudio com tamanho em MB; SyntaxError no Python |
| `game-performance-monitor-statusline.json` | Detecta Unity, Unreal ou Godot e conta arquivos; "60fps" é texto fixo e `[ -f "*.uproject" ]` nunca casa |
| `multiplatform-build-status-statusline.json` | Pastas Builds e Binaries por plataforma; varre todos os `.log` do diretório com `grep -i error`; o teste `*.uproject` também nunca casa |
| `unity-project-dashboard-statusline.json` | Cena, versão e plataforma de projetos Unity; SyntaxError no Python |

**D. Temáticas e brincadeira (10 JSON)**

Sete guardam contadores em `/tmp` (por sessão) que avançam a cada atualização da barra, não por atividade real: `bug-circus`, `code-casino`, `code-spaceship`, `programmer-tamagotchi` (os "commits" são atualizações), `programming-fitness-tracker`, `rpg-status-bar` (HP pelo número de arquivos modificados) e `virtual-code-garden`. As outras três usam aleatório, relógio e contagem de arquivos: `data-ocean` (profundidade pelo número de arquivos .py, .js e .rs, criaturas e ondas aleatórias), `emotion-theater` (rosto e energia aleatórios; o teste `[ -f "*.py" ]` nunca casa, então a atividade é sempre "Coding") e `productivity-rainbow` (cores pelo segundo e "streak" pelo dia do ano).

**Quais valem**: `worktree-context-statusline` (com o `.py`), `git-branch-statusline` como exemplo mínimo, `context-monitor` como ideia (o campo oficial `context_window.used_percentage` dispensa o transcript) e `git-flow-status` para quem usa Git Flow. `neon-database-context` vale só como conceito. O resto é brincadeira ou monitor sem cache. Para a maioria, `/statusline` e os exemplos da doc oficial servem melhor.

### telemetry (4)

Variáveis de `env`.

| Arquivo | O que faz | Observação |
| --- | --- | --- |
| `disable-telemetry.json` | `DISABLE_TELEMETRY=1` | Existe; também desliga a avaliação de feature flags |
| `enable-telemetry.json` | `CLAUDE_CODE_ENABLE_TELEMETRY=1` | Liga a exportação OpenTelemetry para o seu coletor (exige também exportadores `OTEL_*`); não é "análise de uso" da Anthropic como a descrição sugere. Variáveis de exportação OTEL são ignoradas em settings de projeto e local (v2.1.282 ou superior) |
| `custom-telemetry.json` | `CLAUDE_CODE_ENABLE_TELEMETRY=0` junto de `OTEL_METRICS_EXPORTER=custom` | Incoerente: os valores válidos são `console`, `otlp`, `prometheus` e `none` |
| `langsmith-tracing.json` | `TRACE_TO_LANGSMITH`, `CC_LANGSMITH_API_KEY`, `CC_LANGSMITH_PROJECT`, `CC_LANGSMITH_DEBUG` | Não constam na doc oficial; dependem de hook ou plugin de terceiros (não verificado); enviam conversas à LangSmith, com a chave em texto puro |

## O que vale aproveitar

1. **Receita de statusline baseada no `worktree-context-statusline` (e no `/statusline` oficial).** Caminho: `cli-tool/components/settings/statusline/worktree-context-statusline.py`. É o script mais cuidadoso da pasta: `context_window` oficial, git com timeout de 2 s, worktree e repositório bare. A doc oficial já traz campos que simplificariam o script (`workspace.git_worktree`, `worktree.*`, `pr.*`, `rate_limits.*`). O kit pode oferecer uma skill ou README que ensina a gerar a statusline com `/statusline` e traz esse script como exemplo. Esforço baixo. Cuidado: `statusLine` é configuração de usuário, o plugin não consegue aplicá-la, então o usuário precisa colar o JSON. Licença MIT: manter o aviso de copyright (Daniel Ávila, 2025) se copiar código. O caminho relativo `.claude/scripts/` só resolve a partir da raiz do projeto.
2. **Faixa de contexto como mod no csr-cockpit, no molde do exemplo `token-weather`.** Caminho: https://code.claude.com/docs/en/plugins/mods/overview. Mods são plugins e podem desenhar uma faixa acima do prompt ou um painel, o que entrega por plugin o que os JSON de statusline não entregam, sem ocupar o único `statusLine` do usuário. Esforço médio. Cuidado: mod roda com as suas permissões, sem sandbox; exige Claude Code 2.1.287 ou superior; não desenha no VS Code nem em `claude -p` (os hooks rodam, o desenho não).
3. **Hook de log de subagentes corrigido, em `hooks/hooks.json`.** Caminho: `cli-tool/components/settings/hooks/subagent-lifecycle-logger.json`. É a única ideia da pasta que o plugin distribui de verdade e dá trilha de auditoria de multiagentes. Versão correta: ler `agent_type` e `agent_id` do JSON do stdin com `jq` e gravar em `${CLAUDE_PLUGIN_DATA}`, não em `.claude/` do projeto. Esforço baixo. Cuidado: `CLAUDE_AGENT_NAME` não consta na doc, então o original provavelmente grava "unknown". Documentar o que o hook grava e a dependência de `jq`.
4. **Skill de receitas de settings (privacidade, retenção, permissões) com valores atualizados e diff antes de gravar.** Caminho de partida: `cli-tool/components/settings/permissions/deny-sensitive-files.json` (cópia do exemplo oficial). Como plugin não aplica settings de usuário, o caminho é uma skill ou README com o JSON certo: `deny` de leitura de `.env` (também `**/.env`, `~/.ssh`, `~/.aws`), `defaultMode: "plan"` no lugar do `read-only-mode`, sandbox para o que o `deny` não cobre, `cleanupPeriodDays`, `attribution` no lugar de `includeCoAuthoredBy` e alias de modelo no lugar de IDs fixos. Esforço médio. Cuidado: não copiar `development-mode`, `allow-git-operations` nem `enable-all-project-servers`, que dão mais poder do que a descrição diz; mostrar diff e fazer backup antes de gravar; `deny` não é fronteira de segurança segundo a doc.
5. **Ideia do instalador: escolha de escopo, aviso de conflito e merge, mas com merge correto.** Caminho: `cli-tool/src/index.js`, função `installIndividualSetting` (linhas 711 a 1069). Fluxo bom (escopo local por padrão, aviso de conflito, caminho absoluto para scripts no escopo usuário); um comando do kit que aplique uma receita com esse cuidado ajudaria quem não quer editar JSON. Esforço alto. Cuidado: o original substitui `hooks` por evento sem avisar, substitui `additionalDirectories`, oferece escopo enterprise com caminho legado no Windows e envia estatística ao aitmpl.com (opt-out `CCT_NO_TRACKING=true`); evitar esses pontos. Reutilizar código exige manter o aviso MIT.
6. **Placeholders de token substituídos por `userConfig` com `sensitive: true`.** Caminho: https://code.claude.com/docs/en/plugins-reference. Os JSON de `api` e `partnerships` deixam `YOUR-API-KEY` em texto puro no settings; no plugin, `userConfig` com `sensitive` guarda o valor no cofre de credenciais do sistema e o entrega ao hook por `CLAUDE_PLUGIN_OPTION_<CHAVE>`. Esforço baixo. Cuidado: hooks em forma de shell não aceitam `${user_config.*}`; usar a forma exec com `args` ou ler a variável de ambiente.
7. **Seção do post de mods: o que um plugin NÃO distribui e quais chaves de settings ficam de fora.** Caminho: https://code.claude.com/docs/en/plugins-reference. Responde a dúvida mais provável de quem vê o catálogo do aitmpl.com (por que `statusLine`, `permissions` e `env` não vão no plugin) e pode citar chaves oficiais que os componentes comunitários nem cobrem (`sandbox`, `attribution`, `defaultMode`, `autoMode`, `modelPicker`, `footerLinksRegexes`, `subagentStatusLine`). Pode usar também o dado de que os itens mais baixados do catálogo têm defeitos (popularidade não é validação). Esforço baixo. Cuidado: citar a doc oficial como fonte e a data (04/10/2026); a doc muda rápido.
8. **Monitor do banco ao qual o projeto aponta (conceito do `neon-database-context`), com cache e timeout.** Caminho: `cli-tool/components/settings/statusline/neon-database-context.json`. Evitar migração no banco errado é um caso de uso real de statusline, mas o original mostra o branch padrão do projeto Neon, não o branch da `DATABASE_URL` em uso; uma versão útil teria de ler essa URL, com cache de alguns minutos e `curl --max-time`. Esforço médio. Cuidado: exige token de API; o original lê o `.env` do projeto (contraria o espírito do `deny-sensitive-files`) e faz três chamadas de rede por atualização. Não copiar as de Vercel e Cloudflare sem timeout nem cache.

## Cuidados

- Licença MIT, copyright 2025 Daniel (San) Ávila (cabeçalho do LICENSE lido). Copiar código exige manter o aviso.
- Defeitos verificados lendo os arquivos: `ANTHROPIC_CUSTOM_HEADERS` com `\n` literal (efeito no Claude Code não testado); `asset-pipeline-controller` e `unity-project-dashboard` com SyntaxError (só `ast.parse`, nada foi executado); `vercel-error-alert-system` com `grep -c || echo 0` (reproduzido com `printf` e `grep` no shell); `colorful-statusline` sem código ANSI; `game-performance-monitor` e `multiplatform-build-status` com `[ -f "*.uproject" ]` que nunca casa; `neon-database-dev` com "tempo de resposta" de resolução de 1 s; `git-branch-statusline` com contador acolchado em espaços no macOS (testado com a expressão do script).
- Hooks do `git-flow-settings`: conclusão a partir da doc de hooks (matcher com parênteses vira regex, só `exit 2` bloqueia, entrada vem por JSON no stdin) e de um teste de regex em Node (`/Bash(git commit:*)/.test("Bash")` dá falso); não testei dentro do Claude Code. O `grep -oP` falha no `/usr/bin/grep` do macOS, mas o shell do Claude Code usa um `ugrep` embutido que aceita `-P`; qual `grep` o hook encontra: não verificado.
- Inferências a partir da doc de permissões, não testadas: `npm run test:*` não casaria `npm run test:unit`; `git push -u origin main` passaria pela regra `allow` `git push -u:*`; `timeout` não existe no macOS padrão (confirmei só que `command -v timeout` vem vazio aqui), então o teste de conexão das statuslines Neon provavelmente cai sempre em "sleeping".
- Não verificado: datas de aposentadoria dos IDs de modelo; se `DISABLE_NON_ESSENTIAL_MODEL_CALLS` existe em versões do Claude Code (ausente da doc atual); se as variáveis `TRACE_TO_LANGSMITH` e `CC_LANGSMITH_*` têm respaldo em ferramenta de terceiros; termos e qualidade de Z.ai e MiniMax; a pasta de trabalho em que o comando relativo `.claude/scripts/` é resolvido pela statusline.
- Riscos de privacidade e segurança: as parcerias (Z.ai e MiniMax) mandam prompts e código a terceiros, uma com link de indicação, e desligam o Remote Control; `langsmith-tracing` envia conversas a um serviço externo; chaves e tokens ficam em texto puro nos JSON; `zero-config` lê o token da CLI da Vercel e as de Neon e Cloudflare leem o `.env`, fora do alcance das regras de permissão; `development-mode` e `enable-all-project-servers` ampliam muito o poder do agente; `privacy-focused` desliga o autoupdate (perde correções de segurança) e, como `disable-telemetry`, a avaliação de feature flags.
- Instalador: li cli-tool/src/index.js e tracking-service.js; as cópias locais são idênticas ao main de hoje (comparação byte a byte). O rastreio envia dados ao aitmpl.com salvo opt-out.
- Números do site (aitmpl.com, 04/10/2026) são informados pelo site: globais (1.340.064 downloads, 270 PRs, 239.282 instalações npm) e por item (components.json).
- Texto promocional embutido: os exemplos de `companyAnnouncements` e `spinnerTipsOverride` divulgam o aitmpl.com. É conteúdo para o usuário, não ordem para o agente.
- Textos lidos que tentaram dar ordens, ignorados: as páginas da doc oficial abrem com um aviso para buscar o índice completo em llms.txt, que não segui. Nenhum arquivo do repositório pesquisado continha instruções dirigidas ao agente.
- Nomes de modelo e versões (Sonnet 5.5, Opus 5.5, Fable) vêm da doc oficial de hoje; os IDs 4.x dos componentes seguem aceitos, mas fixam versões antigas.

## Fontes

Repositório (davila7/claude-code-templates, branch main, lido em 04/10/2026; a cota da API do GitHub estava esgotada, então os arquivos foram lidos pelo endpoint raw.githubusercontent.com, só leitura):

- cli-tool/components/settings/ (os 75 arquivos: api (4), authentication (3), cleanup (2), environment (5), git (1), global (6), hooks (1), mcp (4), model (2), partnerships (2), permissions (6), statusline (32 JSON e 3 `.py`: context-monitor, deadline-countdown, worktree-context-statusline), telemetry (4))
- scratchpad/tree.json (contagem de arquivos por subpasta)
- cli-tool/src/index.js (função `installIndividualSetting`, linhas 711 a 1069; funções `replacePythonCommands`), cli-tool/src/tracking-service.js, cli-tool/bin/create-claude-config.js
- LICENSE

Site aitmpl.com:

- https://www.aitmpl.com/component/setting/statusline/context-monitor
- https://www.aitmpl.com/ (números globais)
- https://www.aitmpl.com/components.json (downloads por item)

Documentação oficial (versão .md das páginas, lidas inteiras em 04/10/2026):

- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/settings-reference
- https://code.claude.com/docs/en/statusline
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/tools-reference
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/env-vars
- https://code.claude.com/docs/en/model-config
- https://code.claude.com/docs/en/amazon-bedrock
- https://code.claude.com/docs/en/google-vertex-ai
- https://code.claude.com/docs/en/network-config
- https://code.claude.com/docs/en/data-usage
- https://code.claude.com/docs/en/authentication
- https://code.claude.com/docs/en/mcp
- https://code.claude.com/docs/en/monitoring-usage
- https://code.claude.com/docs/en/output-styles
- https://code.claude.com/docs/en/managed-settings
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/plugins/mods/overview

# 09 · O tipo MODS (cli-tool/components/mods, ~294 arquivos)

Pesquisa feita em 04/10/2026, somente leitura, sobre o repositório `davila7/claude-code-templates` (branch main) e sobre a documentação oficial do Claude Code (a referência de mods descreve a versão 2.1.289, a mesma desta máquina). Nada do repositório foi clonado nem executado: nem a CLI, nem `claude plugin validate`, nem os testes dos mods.

### O que é

A pasta `cli-tool/components/mods` guarda **mods**: plugins do Claude Code cujo comportamento é código TypeScript que roda dentro do próprio Claude Code (não um script externo) e pode desenhar painéis, reescrever chamadas de ferramenta e prompts. Em 04/10/2026 são 39 mods em 294 arquivos: enterprise 1 (4 arquivos), games 15 (157), integrations 5 (28), observability 2 (10), productivity 6 (35), security 7 (41), ui 3 (16), mais `README.md`, `tsconfig.json` e `types/claude-code.d.ts`. O repositório é MIT e tem 32.375 estrelas segundo a página do GitHub lida hoje (número informado pelo GitHub, 04/10/2026). A pasta mudou muito nos últimos dias: o último commit nela é de 04/10/2026 18:52 UTC e remove o rótulo beta / early access dos mods (#1083); antes dele há mais de uma dezena de commits entre 01 e 03/10.

### Formato de um mod do catálogo

Cada mod é uma pasta de plugin completa, no layout da Anthropic:

- `.claude-plugin/plugin.json`: nome, versão, autor, licença e, em 24 dos 39 mods, `userConfig` (as opções). Nenhum tem o campo `types` nem versão mínima do Claude Code (e o manifesto oficial não tem campo de versão mínima).
- `hooks/hooks.json`: nos 39 mods só tem `description` e `modules`, com um único caminho.
- `hooks/*.ts|tsx`: o módulo, que exporta `register(on, options)`. O catálogo só importa tipos de `'claude-code'` e arquivos relativos.
- `tests/` e `README.md` (opcionais; 18 dos 39 têm testes).

Um hook é `on('tool.call', { tool: 'Bash' }, ($, e, next) => ...)`. `$` é a API do motor, `e` é o evento congelado e `next(e)` passa adiante. O hook observa (`next(e)`), reescreve (`next({ ...e, command })`) ou responde (`{ deny }`, `{ result }`), como na doc oficial.

### A API tipada (`types/` e `tsconfig.json`)

`types/claude-code.d.ts` tem 17.375 linhas (651.448 bytes) e começa com "Written by Claude Code 2.1.283": seis versões atrás da 2.1.289 desta máquina. Já tem o aviso EARLY ACCESS (a API pode mudar sem aviso) no cabeçalho, apesar de o commit #1083 ter tirado o rótulo beta do catálogo. Não tem eventos que a referência oficial de 2.1.289 já lista, como `ui.fault`, `prompt.compose`, `session.append` e `telemetry.log`, nem o método `$.mcp.connect`. Define `Register`, `On`, `Hook`, `Next` e a interface `$` com **20 substantivos** (plugin, ui, model, audio, mcp, session, turn, prompt, tool, command, config, agent, fs, store, state, clock, http, process, settings, env), **39 eventos próprios do motor** (`EngineEventOf`: tool.call, tool.check, prompt.submit, turn.step, session.start, ui.render, agent.spawn, plugin.register, engine.create...) e **59 métodos de `$` que também viram evento** (`OpEventOf`: fs.write, http.fetch, process.run, env.set...). Quem está acima na cadeia vê essas chamadas dos outros plugins, e é assim que um mod julga outro. Descreve também o kit `claude-code/testing` (test, expect, mock, `$.ui.mount`), que roda sem fs, rede nem processo. O ambiente do mod não tem DOM nem Node: não há `require`, tudo é módulo ES.

O `tsconfig.json` é único para todos os mods: target e lib es2023 (sem DOM), `types: []`, `strict`, `noUncheckedIndexedAccess` desligado (o `.d.ts` sugere ligado; aqui desligam para o código de terceiros passar), JSX por `h` e `Fragment`. O `include` cobre `types`, `*/*/hooks` e `*/*/types`: as pastas `tests/` ficam fora do tsc e só rodam em `claude plugin test`. O csr-cockpit faz diferente: o `tsconfig.json` dele estende o `.claude-plugin/types/tsconfig.json` que o próprio Claude Code gera, e o manifesto traz `types: ./types/index.d.ts` com o contrato do estado.

### Como instala (`--mod`) e o que o catálogo faz de diferente

`--mod` existe: `npx claude-code-templates@latest --mod security/secret-redactor` (aceita vários separados por vírgula; `--function-hook` é um alias oculto, mantido para docs antigas). A função `installIndividualMod` valida `categoria/nome`, baixa a pasta pela API do GitHub na branch main (sem versão fixa, sem checksum), confere que `plugin.json` e `hooks/hooks.json` existem e que os módulos listados vieram, e grava tudo em `.claude/skills/<nome>/` do projeto. O Claude Code carrega isso como `<nome>@skills-dir`, depois que a pasta é confiável. A CLI também manda telemetria ao aitmpl.com (veja Cuidados).

A documentação oficial trata o mod como plugin instalado de um marketplace (`claude plugin install nome@marketplace`), com versão, atualização e controle de administrador. O `skills-dir` também é oficial (plugin salvo em `~/.claude/skills/` ou em `.claude/skills/` do projeto), mas é cópia de arquivos carregada no lugar, sem registro de versão: a doc só descreve atualização para plugins de marketplace. Que reinstalar com `--mod` seja o único jeito de atualizar é inferência minha a partir do instalador, não afirmação da doc. Em projeto, a pasta commitada chega a todo colega que clonar, só depois de ele confiar na pasta, e só carrega a partir do diretório de trabalho principal da sessão (não procura em pastas acima). Com lista de marketplaces permitidos na organização, é preciso a entrada `{ "source": "skills-dir" }`, senão esses plugins deixam de carregar. Os exemplos oficiais da Anthropic estão no repositório `claude-code-playground` (token-weather, blast-radius, replay-theater), e os mods embutidos no próprio Claude Code (diff, agents-md, sec-default, telemetry) têm código público em `anthropics/claude-code/mods`, a referência que o README do catálogo cita.

### Risco

Pela doc oficial, o mod roda com as suas permissões: lê e escreve arquivos, inicia processos, faz rede, lê variáveis de ambiente e settings, vê todo prompt e toda chamada de ferramenta e pode aprovar chamadas antes de você ser perguntado. Não há sandbox; um processo iniciado por mod escapa do sandbox do Bash, e a política de rede da organização cobre `$.http.fetch`, mas não um programa iniciado por `$.process.run`. Fiz o equivalente do que o `claude plugin validate` lista por busca de texto em `$.noun.method` (o motor exige a chamada por extenso; nada foi executado):

- **Sem rede, arquivos nem processos** (só memória, e `$.store` nos jogos): admin-capability-lockdown, block-destructive-commands, protected-paths-guard, secret-redactor, npm-to-pnpm-rewriter, webfetch-cache, agent-flow, tool-timing-badge e os 14 jogos sem IA (só gravam o placar no `$.store`, que a doc diz ser compartilhado por todas as sessões da máquina).
- **Só leem arquivos ou ambiente**: prompt-cache-control (variáveis de cache e `promptCacheTtl` dos settings) e large-edit-confirmation (o arquivo que Claude vai editar).
- **Rede**: websearch-to-exa (Exa), linear-tickets, vercel-deploys (inclui um GET de saúde em cada domínio de produção, ligado por padrão, no máximo uma vez por minuto), neon-branch-per-session, aitmpl (JSON público do site) e, com chave, os cinco `jev-*` e o chess, que mandam texto à api.typesafe.ai ou ao AI Gateway da Vercel. No chess só vão as jogadas legais; nos `jev-*` vão prompts, respostas, comandos ou ações, conforme o mod. Sem chave, os `jev-*` usam `$.model.classify` do motor: uma chamada ao modelo pequeno da própria sessão, que gasta tokens do plano, e nada vai à TypeSafe.
- **Escrevem arquivos**: universal-audit-log (JSONL no projeto), session-time-machine (objetos e refs do git, worktree, cópia da transcrição em `~/.claude/projects`), jev-auto-mode (`/jev-auto-mode init` grava uma política de exemplo em `~/.claude`).
- **Disparam processos**: git-sidebar (só git, por argv), session-time-machine (git e `osascript`), jev-vercel-sandbox (git, tar, find, rm, mktemp, e `git apply` no projeto quando você manda aplicar o patch), aitmpl (`npx claude-code-templates@latest --<tipo> <nome> --yes`) e pi-agent-for-claude (`sh -c`, `ps`, `pkill`, `rm`; o pi roda as próprias ferramentas fora do sistema de permissões do Claude Code).
- **Mudam permissão, ambiente ou o que Claude lê**: jev-auto-mode (`tool.check` pode devolver allow e a chamada roda sem o prompt do motor; deny dos settings continua valendo), neon-branch-per-session (`DATABASE_URL` herdado por todo comando, que pode imprimi-la), jev-skill-suggestion (faz o Claude editar `~/.claude/settings.json` para esconder skills; antes grava um backup em `~/.claude/jev-skill-suggestion.skill-overrides.backup.json`; desinstalar sem `/jev-skill-suggestion:setup restore` deixa tudo oculto), jev-vercel-sandbox (`$.prompt.submit` devolve resultados como mensagem).

### Útil ou brincadeira

Úteis de verdade: prompt-cache-control, universal-audit-log, secret-redactor, large-edit-confirmation, git-sidebar, agent-flow, tool-timing-badge, webfetch-cache e admin-capability-lockdown (para administrador; o `shellPolicy` padrão nega o Bash inteiro). block-destructive-commands e protected-paths-guard são regex simples e contornáveis, e o segundo não vê o Bash; `permissions.deny` pode cobrir parte disso sem código, mas não comparei as duas coberturas. Integrações valem se você usa o serviço. Ambiciosos e arriscados: session-time-machine, os `jev-*` (dependem de um modelo comercial da TypeSafe) e pi-agent. Brincadeira: os 15 games, embora tool-defense e diff-invaders tenham boa ideia (inimigos são chamadas de ferramenta e linhas de diff). Os downloads do `mods.json` (3.372 no total, números informados pelo repositório) se concentram em dois `jev-*`: 1.365 e 1.268, cerca de 78%.

### Qualidade: versão mínima e testes

Nenhum `plugin.json` declara versão mínima. Ela aparece só em prosa de README e comentário, quase sempre "2.1.287+" (a versão em que mods vêm ligados). Exceções: pi-agent diz 2.1.275+ e jev-skill-suggestion exige 2.1.278+ (o evento `prompt.attachment`); agent-flow, git-sidebar e jev-auto-mode foram escritos e testados na 2.1.282 contra as declarações da 2.1.278; chess cita a 2.1.283. Só 18 dos 39 mods têm `tests/`; os 21 sem teste incluem os quatro mods pequenos de segurança, o admin-capability-lockdown, universal-audit-log, websearch-to-exa, pi-agent, npm-to-pnpm-rewriter, webfetch-cache, tool-timing-badge e 10 dos 15 games. O CI `mods-typecheck.yml` roda tsc, `claude plugin validate` em cada mod e `claude plugin test` onde há `tests/`, mais uma checagem de que o `plugin.json` tem `name` e de que o `hooks.json` aponta módulos que existem. Ele instala `@anthropic-ai/claude-code` sem fixar versão. Conferi à mão que as opções (`userConfig`) de todos os mods respeitam o esquema estrito do manifesto oficial (cada campo com type, title e description, sem chave desconhecida); 12 mods usam `options`, que o manifesto diz exigir 2.1.271 ou mais novo.

### Frente ao csr-cockpit

- **Observability:** o prompt-cache-control tem contagem regressiva do TTL, toasts (aos 60 s e aos 10, 3, 2 e 1 s), causa do miss (modelo, expiração ou prefixo mudou) e conselho de `/compact`; o cockpit mostra só a pílula `cache N%`. O universal-audit-log grava uma trilha em disco, e o cockpit guarda tudo na memória da sessão e só grava dois logs (erros e diagnóstico de cliques). Em contrapartida, nenhum mod do catálogo mostra o custo, e o prompt-cache-control lê os limites de 5 h e 7 d só para deduzir se a conta é assinatura (não os exibe); o cockpit mostra custo da sessão, do turno e de cada agente, os dois limites com a hora de renovação, e os comandos Bash por turno com estado, exit code e duração (o session-time-machine lista as chamadas de ferramenta da transcrição, inclusive Bash, mas sem estado nem duração).
- **UI:** o agent-flow marca fork, mostra o contexto entregue e devolvido (estimado, 4 caracteres por token), o pico de contexto de cada agente e a divisão da janela por categoria; o cockpit tem a divisão por categoria e mostra o pedido e a resposta inteiros e os tokens de cada agente, mas não marca fork nem pico, e tem grafo com mensagens entre agentes, linha do tempo, custo por agente, diffs, árvore e inventário, com SVG no Desktop. O catálogo inteiro usa só Box, Text, Button, Input e Client (os 14 jogos sem IA), sem Svg, Raster nem Image. O git-sidebar lista worktrees e branches e age (`/cd`, `git switch` com árvore limpa); o cockpit só lê o git (`rev-parse`, `status`, `diff`) e não age. O tool-timing-badge redesenha a linha ToolUse do Claude Code; o cockpit só desenha o painel e a faixa acima do prompt.
- **Productivity:** aitmpl instala componentes e session-time-machine faz fork da sessão; o cockpit só lê (o Inventário inclui a seção "Para instalar", dos marketplaces que você adicionou).
- **Opções, testes e CI:** 24 dos 39 mods do catálogo têm `userConfig`; o cockpit não tem opções, guarda só o estado do grafo (ampliado ou não, e o zoom) no `$.store`, não faz rede e roda só leitura de git. O cockpit tem 5 arquivos `*.test.tsx` mais um `motor.ts` de apoio; o catálogo tem CI para todos os mods e o kit não tem pasta `.github` (o CONTRIBUTING.md manda rodar `claude plugin validate` e `claude plugin test` à mão).

## Por categoria

### README.md (da pasta mods) · 1 arquivo

Explica o formato: mod é plugin cujo comportamento vive num módulo de hooks de função. Diz que mods vêm ligados no Claude Code 2.1.287 ou mais novo (de 2.1.259 a 2.1.286 exigiam `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`; a partir da 2.1.287 a variável é ignorada). Descreve o layout `{categoria}/{nome}/`, a instalação `npx claude-code-templates --mod categoria/nome` (grava em `.claude/skills/{nome}/`, carregado como `{nome}@skills-dir`), as opções por `userConfig` (tipos string, number, boolean, directory, file; sem array; lidas só dos settings de usuário, de `--settings` ou dos managed, nunca do projeto), a regra de importar tipos só de `'claude-code'`, escrever `$.noun.event(...)` por extenso e nunca passar `$` a um helper, e os comandos `claude plugin validate` e `claude plugin test`. Mods de terceiros (games/cc-arcade) são copiados com LICENSE e atribuição. Não traz aviso de segurança.

| Trecho | O que mostra |
|---|---|
| Layout de um mod | `.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/**`, `types/*.d.ts`, `tests/**` e `README.md` |
| Options | `pluginConfigs` por `nome@skills-dir`, lido só de settings de usuário |
| Typecheck | `npx -y typescript@5 tsc -p tsconfig.json` e as regras de cada módulo |

### tsconfig.json (da pasta mods) · 1 arquivo

Config única de typecheck para todos os mods, descrita acima. Fica de fora o `tests/`.

### types/ (a API tipada) · 1 arquivo

`claude-code.d.ts`, 651.448 bytes e 17.375 linhas, gerado pela 2.1.283 (`/plugin-types` grava essa declaração). Descrito acima.

### enterprise · 1 mod, 4 arquivos

| Mod | Arquivos | Linhas | Testes | O que faz | Risco |
|---|---|---|---|---|---|
| admin-capability-lockdown (v0.2.0) | 4 | 104 | não | Mod de organização. Em `engine.create` devolve `$` sem `http` e `process` (vale só para plugins abaixo dele na cadeia); em `plugin.register` recusa plugins do tier user que não estejam numa lista de nomes ou cujo código declare chamadas proibidas (`e.uses.calls`); `shellPolicy` `deny` (padrão: nega a ferramenta Bash inteira), `guardrail` (nega curl, wget, ssh, nc etc.; contornável por design, e o README diz) ou `allow`. Só é fronteira real no tier prepend via managed settings (`prependPlugins`); carregado por `--plugin-dir` ou skills-dir fica no tier user e só limita quem vem depois. | O código não usa rede, arquivos nem processos; o perigo é o padrão `deny` travar o Bash. Útil para administrador; irrelevante para uso pessoal. |

### games · 15 mods, 157 arquivos

Cerca de 8,4 mil linhas de TS/TSX só nos hooks (8.361 contadas, sem os testes). Brincadeira, mas didática.

| Grupo | Mods | Arquivos | Testes | Notas |
|---|---|---|---|---|
| cc-arcade (v0.2.0) | 1 | 34 | 6 arquivos | Copiado de sezaakgun/cc-arcade (MIT, Seza Akgün). `/arcade` com 9 jogos (snake, tetris, doom, 2048, minesweeper, flappy, pong, typing-test, invaders) mais um bichinho (pet) alimentado por testes, commits e edições. Só no terminal interativo, com mouse. Jogar não gasta tokens. |
| Splits do cc-arcade | 10 (2048, doom, flappy, invaders, minesweeper, pet, pong, snake, tetris, typing-test) | 9 cada (pet 7) | nenhum | Um jogo por mod, v0.2.0, mesma autoria. Os arquivos de `boards/` e `games/` são idênticos aos do cc-arcade (mesmo SHA no git); só `register.tsx` e `hooks.json` diferem. |
| Do catálogo | chess, diff-invaders, pacman, tool-defense | 8, 9, 9, 9 | 1 cada | v0.1.0, MIT. chess: xadrez contra o Claude via `$.model.fork` (numa sessão nova, cerca de 48 mil tokens por lance, quase todos leitura de cache, e o custo cresce com a sessão, segundo o README) ou contra o modelo Jev por HTTP com chave. diff-invaders: cada linha adicionada por Edit ou Write vira alienígenas. pacman: Pac-Man em 19x15. tool-defense: cada chamada de ferramenta de Claude vira um inimigo (Bash corredor, Edit tanque, web ou MCP voador, Agent chefe). |

Risco: os 14 jogos sem IA só gravam o placar com `$.store.set`; só o chess faz rede (opcional, com chave) e gasta tokens. Nenhum dos 15 tem opção de userConfig além do chess. Valor didático: exemplos de `ui.render`, `Client` (teclado e mouse), `$.clock.every` e `$.store`.

### integrations · 5 mods, 28 arquivos

| Mod | Arquivos | Linhas | Testes | O que faz e risco |
|---|---|---|---|---|
| linear-tickets (v0.1.0) | 6 | 647 | 1 | Painel dos seus tickets do Linear com gráficos; só consultas GraphQL (nenhuma mutation); a chave `linearApiKey` é `sensitive` e vai só a api.linear.app. |
| neon-branch-per-session (v0.1.0) | 6 | 338 | 1 | Cria um branch Neon por sessão (`claude/<id da sessão>`) e define `DATABASE_URL` e `NEON_BRANCH` com `$.env.set`; todo comando de Claude herda a credencial e pode imprimi-la (o README avisa). O branch expira em 24 h por padrão. Chamadas POST, GET, PATCH e DELETE em console.neon.tech. |
| pi-agent-for-claude (v0.1.0) | 6 | 607 | 0 | Copiado de FazalAAli (MIT). Subagente `pi` que roda o CLI pi por `$.process.run` (`sh -c`, `ps`, `pkill`, `rm`); o pi executa as próprias ferramentas read, bash, edit e write fora dos prompts de permissão. Exige 2.1.275+ e o README admite depender de comportamento não documentado. O nome tem `claude` como palavra inteira, o que pela regra do manifesto oficial gera um aviso (não um erro) no `claude plugin validate`; não rodei o comando. |
| vercel-deploys (v0.1.0) | 6 | 579 | 1 | Painel de deploys; GET em api.vercel.com e, por padrão, um GET de saúde em cada domínio de produção (no máximo 1 por minuto), com toasts e polling. |
| websearch-to-exa (v0.2.0) | 4 | 88 | 0 | Substitui o WebSearch por Exa via `$.http.fetch`; a consulta sai para api.exa.ai; sem chave ou em falha cai no WebSearch nativo. |

As chaves ficam em `userConfig` com `sensitive`. Úteis só se você usa o serviço; pi-agent é o mais arriscado.

### observability · 2 mods, 10 arquivos

| Mod | Arquivos | Linhas | Testes | O que faz e risco |
|---|---|---|---|---|
| prompt-cache-control (v0.1.0) | 6 | 742 | 1 | Faixa acima do prompt e painel `/cache` com leitura, escrita e tokens novos por requisição, contagem regressiva do TTL do cache (5 min ou 1 h, deduzido das regras do Claude Code e do tráfego, porque a API de mods só repassa quatro contagens de tokens), toasts perto do vencimento, causa do miss e conselho de `/compact` (limite de 100 mil tokens, dito no README como julgamento). Lê variáveis de ambiente de cache e `promptCacheTtl` dos settings; sem rede, sem escrita. |
| universal-audit-log (v0.2.0) | 4 | 135 | 0 | Um hook em `*` grava uma linha JSON por evento (evento, origem plugin e tier, duração, resultado, campos de texto truncados a 200 caracteres) em `.claude/logs/mods-audit.jsonl` no projeto, com buffer e reescrita do arquivo (`$.fs` não tem append; limite padrão de 2 MiB). Sem rede. Só audita tudo se estiver primeiro na cadeia (prepend via managed settings). Grava comandos e prompts em disco, então pode vazar segredo para dentro do projeto. |

### productivity · 6 mods, 35 arquivos

| Mod | Arquivos | Linhas | Testes | O que faz e risco |
|---|---|---|---|---|
| aitmpl (v0.4.0) | 7 | 916 | 2 | `/aitmpl` abre painel do catálogo do site (busca, tipos, Instalados, Popular); busca o JSON público do aitmpl.com com `$.http.fetch` (a opção `siteUrl` troca o site); "install here" roda `npx claude-code-templates@latest --<tipo> <nome> --yes` por `$.process.run` (argv fixo, sem shell), e `view` abre o navegador (`open`, `xdg-open` ou `explorer.exe`). |
| jev-model-router (v0.4.2) | 6 | 854 | 1 | Escolhe modelo e esforço por tarefa com o modelo Jev da TypeSafe (ou `$.model.classify` sem chave); roteia o modelo dos subagentes e o esforço da conversa; trocar o modelo principal vem desligado porque invalida o cache. |
| jev-skill-suggestion (v0.1.0) | 7 | 1.504 | 1 | Tira a lista de skills do contexto e injeta no máximo uma skill por prompt; `/jev-skill-suggestion:setup` faz o Claude editar `~/.claude/settings.json` (`skillOverrides` e `disableBundledSkills`) e `restore` desfaz. Os números do cookbook (de 16,8% para 7,3% de skills carregadas por engano, numa lista de 182) são do fornecedor. |
| npm-to-pnpm-rewriter (v0.2.0) | 4 | 68 | 0 | Reescreve `npm` para pnpm, yarn ou bun antes do Bash. Exemplo mínimo de hook modificador. |
| session-time-machine (v0.1.0) | 7 | 768 | 1 | `/timemachine` mostra a linha do tempo e faz fork da sessão num ponto: snapshots do working tree com índice git descartável (respeita `.gitignore`), refs `refs/time-machine/<sessão>/<ponto>`, worktree em `.claude/worktrees/`, cópia da transcrição em `~/.claude/projects` e abertura da nova sessão no Claude Desktop ou no Terminal (`osascript`, macOS; fora do macOS o comando de retomada vai para a área de transferência). O README diz "no process spawn", mas o código usa `$.process.run` (git e osascript): o README está desatualizado. |
| webfetch-cache (v0.2.0) | 4 | 61 | 0 | Cache em memória do WebFetch por URL e prompt, TTL de 900 s e até 200 entradas. |

Úteis: aitmpl, webfetch-cache, npm-to-pnpm. Ambiciosos e arriscados: session-time-machine e os dois `jev-*`.

### security · 7 mods, 41 arquivos

| Mod | Arquivos | Linhas | Testes | O que faz e risco |
|---|---|---|---|---|
| block-destructive-commands (v0.2.0) | 4 | 72 | 0 | Regex no Bash contra `rm -r` em raiz, home ou `.`, `git push --force` sem lease, `git reset --hard`, `git clean -f`, DROP e TRUNCATE, `mkfs`, `dd of=/dev/`, `chmod 777`; contornável. |
| protected-paths-guard (v0.2.0) | 4 | 80 | 0 | Nega Edit, Write e NotebookEdit em `.env`, lockfiles, `.git`, workflows, `*.pem`, `*.key` e `id_rsa*`; não vê comandos Bash que escrevam nesses arquivos. |
| secret-redactor (v0.2.0) | 4 | 113 | 0 | Em `tool.call`, depois de `next`, troca 10 padrões de credencial (AWS, Anthropic, OpenAI, GitHub, Google, Stripe, Slack, JWT, bloco de chave privada, string de conexão) por `[REDACTED:...]` nos resultados e nega colar o marcador num Bash; sem rede. |
| large-edit-confirmation (v0.2.0) | 4 | 84 | 0 | Pergunta por `$.ui.ask` antes de editar arquivo com mais de 1000 linhas e nega se ninguém responde (modo `claude -p`, ajustável). |
| jev-auto-mode (v0.1.0) | 9 | 1.437 | 2 arquivos | Camada de permissão por JSON; `tool.check` pode devolver allow e a chamada roda sem o prompt do motor (deny de settings e do modo plano continua valendo); com `default: jev` envia seu último prompt e a ação à TypeSafe; `/jev-auto-mode init` escreve um exemplo de política em `~/.claude`. Se o próprio mod falha, ele nega. |
| jev-guardrails (v0.1.0) | 6 | 908 | 1 | Tria todo prompt e toda resposta; falha aberta por padrão (`failClosed` desligado); com chave, o texto de cada prompt e resposta sai da máquina. |
| jev-vercel-sandbox (v0.3.0) | 10 | 2.195 | 3 arquivos | O maior mod. Manda cada Bash ao Jev para decidir se vai para uma Vercel Sandbox, envia uma cópia do projeto (git, tar, find, rm, mktemp locais), devolve resultados por `$.prompt.submit` e pode aplicar o patch no projeto com `git apply` quando você pede. |

Úteis como exemplo: os quatro pequenos e o jev-auto-mode como estudo de `tool.check` (é o único mod do catálogo que usa esse evento). Os três `jev-*` de segurança são presos a um fornecedor e difíceis de revisar.

### ui · 3 mods, 16 arquivos

| Mod | Arquivos | Linhas | Testes | O que faz e risco |
|---|---|---|---|---|
| agent-flow (v0.1.0) | 6 | 780 | 1 | `/agent-flow` abre painel com a conversa principal e cada subagente numa árvore: contexto entregue (o prompt, ou o contexto inteiro do pai num fork), o que fez (requisições, contexto atual e pico, ferramentas) e a resposta devolvida; ao selecionar `main`, mostra a janela por categoria como o `/context`. Só observa; sem rede, arquivos ou processos. Tokens de prompt e resposta são estimativas de 4 caracteres por token. |
| git-sidebar (v0.1.0) | 6 | 550 | 1 | Estilo lazygit: worktrees e branches como linhas clicáveis; `$.process.run` só de git por argv, e o único comando que escreve é `git switch` (recusado com árvore suja); `/cd` troca de worktree. |
| tool-timing-badge (v0.2.0) | 4 | 64 | 0 | Mede cada `tool.call` e redesenha a linha ToolUse com um selo de duração verde, amarelo ou vermelho (limite `slowMs`, padrão 5 s). O README fala em terminal, Desktop e mobile; a referência oficial lista o ToolUse só no terminal e no Desktop. |

Os três são úteis e de baixo risco.

### Fora da pasta: CLI `--mod`, `mods.json` e CI · 3 peças

| Peça | O que faz |
|---|---|
| `cli-tool/bin/create-claude-config.js` e `cli-tool/src/index.js` | Declaram `--mod <mod>` (alias oculto `--function-hook`, vírgulas) e `installIndividualMod`, que baixa a pasta da API do GitHub (main) e grava em `.claude/skills/<nome>/`. |
| `cli-tool/src/tracking-service.js` | Telemetria ao aitmpl.com, com opt-out por `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`. |
| `dashboard/public/components/mods.json` | 39 entradas com nome, caminho, categoria, tipo, descrição, autor, repositório, versão, licença, keywords, downloads, módulos, userConfig e a lista de arquivos de cada mod (`references`); alimenta o site. Os downloads vêm da tabela `component_downloads` do Supabase, lida por `scripts/generate_components_json.py`. |
| `.github/workflows/mods-typecheck.yml` | CI descrito acima. |

## O que vale aproveitar

1. **CI de mods (tsc, `claude plugin validate` e `claude plugin test` em todo mod).** Pega nome de evento ou chamada de `$` que não existe antes de chegar a quem instala. O kit hoje não tem pasta `.github`, só instruções no CONTRIBUTING.md. Esforço baixo. Cuidado: o catálogo instala o Claude Code mais novo no CI, então o build pode quebrar quando a API mudar (a doc oficial diz que a API de mods pode mudar entre versões); caminho: `.github/workflows/mods-typecheck.yml`.
2. **Contagem regressiva do TTL do cache e causa do miss, para a pílula de cache do cockpit.** O cockpit mostra só `cache N%`. Esforço médio. Cuidado: o TTL é deduzido, e o limite de 100 mil tokens para sugerir `/compact` é um julgamento escrito no README. MIT: copiar a ideia com atribuição, não colar código sem revisar; caminho: `cli-tool/components/mods/observability/prompt-cache-control/hooks/cache.ts`.
3. **`userConfig` com `sensitive`, `options` e `pluginConfigs`.** 24 dos 39 mods expõem opções; o cockpit não tem nenhuma. Dá para configurar tamanho do painel, limite de agentes guardados e quais pílulas aparecem, e ensinar no post que as opções vêm do settings de usuário, nunca do projeto. Esforço baixo. Cuidado: `options` exige 2.1.271 ou mais novo, e uma chave desconhecida dentro de um campo `userConfig` impede o plugin de carregar; exemplo: `cli-tool/components/mods/ui/agent-flow/.claude-plugin/plugin.json`.
4. **Quatro mods pequenos de segurança como exemplos didáticos** (secret-redactor, large-edit-confirmation, block-destructive-commands, protected-paths-guard): de 72 a 113 linhas, sem rede, mostram hook que nega, hook que redige o resultado, pergunta ao usuário e matcher com lista. Esforço baixo. Cuidado: nenhum tem teste e todos são contornáveis; se adaptar, escreva testes e diga no README que são lombada, não fronteira; caminho: `.../mods/security/secret-redactor/hooks/secret-redactor.ts`.
5. **Governança de mods:** admin-capability-lockdown e a doc de `plugin.register`, `engine.create`, `prependPlugins` e `allowManagedModsOnly` (opção do guard embutido `cc-plugin-sec-default`, nos managed settings). Rende uma seção do post: mod roda sem sandbox, e é assim que uma empresa controla. Esforço baixo. Cuidado: só é fronteira no tier prepend via managed settings, e o plugin precisa vir de um marketplace em diretório local para contar como da organização; o padrão `shellPolicy: deny` desliga o Bash. Para uso pessoal é conteúdo, não ferramenta; fonte: https://code.claude.com/docs/en/plugins/mods/admin.
6. **Checklist de auditoria antes de instalar um mod:** `claude plugin validate` (linhas `hooks:` e `calls:`) mais busca por `$.http`, `$.process`, `$.fs.write`, `$.env.set` e `tool.check`; dá uma tabela de risco por mod (como a deste relatório) e talvez um pequeno script `auditar-mod` no kit. Esforço médio. Cuidado: o validate não executa o código e não substitui ler o módulo; fonte: https://code.claude.com/docs/en/plugins/mods/overview.
7. **git-sidebar** (worktrees e branches clicáveis) como segundo mod do kit, o que o cockpit não faz. Esforço médio. Cuidado: escreve no repositório (`git switch`; recusa com árvore suja). Se adaptar, mantenha argv sem shell; caminho: `.../mods/ui/git-sidebar/hooks/git-sidebar.tsx`.
8. **Detalhes do agent-flow que o cockpit não mostra:** marca de fork, tamanhos de contexto entregue e devolvido e pico de contexto do agente. Esforço baixo. Cuidado: os tokens de prompt e resposta são estimativas (4 caracteres por token); rotule assim; caminho: `.../mods/ui/agent-flow/hooks/flow.ts`.
9. **Técnica de snapshot do session-time-machine:** índice git descartável (`GIT_INDEX_FILE`), `commit-tree` e `refs/time-machine/<sessão>/<ponto>`, uma forma de fotografar o working tree sem tocar índice, branch ou stash. Esforço alto. Cuidado: respeita o `.gitignore`, mas um `.env` fora dele viraria objeto git; grava cópias da transcrição em `~/.claude/projects`; a abertura automática da nova sessão é só no macOS (fora dele, o comando é copiado); o README diz que não dispara processos, e o código dispara; caminho: `.../mods/productivity/session-time-machine/hooks/snapshots.ts`.
10. **tool-timing-badge como hello world de `ui.render`:** 64 linhas que embrulham a linha ToolUse do Claude Code. O cockpit desenha painéis mas não redesenha as linhas do Claude Code, então é um exemplo novo para o kit. Esforço baixo. Cuidado: sem testes no catálogo; escreva um com `$.ui.mount` nas superfícies terminal e desktop; caminho: `.../mods/ui/tool-timing-badge/hooks/tool-timing-badge.tsx`.
11. **Seção para o post de mods sobre as duas formas de distribuir:** marketplace versionado versus cópia em `.claude/skills` (`skills-dir`), o que muda para a lista de marketplaces permitidos e para quem clona o projeto. É onde o catálogo difere da doc oficial e reforça por que o kit usa marketplace (versão, `claude plugin update`). Esforço baixo. Cuidado: confira o texto do post atual antes de acrescentar, pois o post do blog não foi lido nesta frente; fonte: https://code.claude.com/docs/en/plugins/loading.
12. **Ler os mods oficiais** (diff, sec-default, agents-md, telemetry em `anthropics/claude-code/mods`, e os exemplos do `claude-code-playground`) antes dos de terceiros: são o material de estudo que a própria doc aponta, com testes. Esforço baixo. Cuidado: a doc diz que o playground é compartilhado como está, sem suporte; fonte: https://github.com/anthropics/claude-code/tree/main/mods.

## Cuidados

- Mods rodam com as permissões do seu usuário, sem sandbox (doc oficial, plugins/mods/overview e admin): leem e escrevem arquivos, iniciam processos, fazem rede, leem variáveis de ambiente e settings, veem todo prompt e podem aprovar chamadas antes do prompt de permissão. Um processo que o mod inicia fica fora do sandbox do Bash e fora da política de rede que cobre `$.http.fetch`.
- A CLI (`--mod`) baixa a pasta direto da branch main do GitHub, sem versão fixa e sem checksum: o que você instala hoje pode diferir do que foi revisado ontem, e a pasta mudou várias vezes entre 01 e 04/10. Ela manda telemetria ao aitmpl.com a menos que `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`: um POST com tipo, nome, caminho, categoria e versão da CLI do componente, e outro com o desfecho da instalação (erro, duração, versão do Node, plataforma, arquitetura). O código se descreve como anônimo; não verifiquei o que o servidor guarda. O mod aitmpl roda a mesma CLI por `npx ...@latest`, então vale a mesma telemetria. Não executei a CLI nem nenhum mod nesta pesquisa.
- A instalação por `.claude/skills/<nome>/` vira plugin `@skills-dir`: se a pasta for commitada, todo colega que clonar e confiar na pasta carrega o mod. Com lista de marketplaces permitidos, `skills-dir` precisa constar para continuar carregando. A doc não descreve atualização para plugins `skills-dir`; que reinstalar seja o único caminho é inferência minha a partir do instalador.
- Compatibilidade: o `types/claude-code.d.ts` do catálogo foi escrito pela 2.1.283 e não tem eventos que a 2.1.289 já documenta (`ui.fault`, `prompt.compose`, `session.append`, `telemetry.log`); vários READMEs dizem "escritos e testados em 2.1.282" (agent-flow, git-sidebar, jev-auto-mode). A máquina local está na 2.1.289. Nenhum `plugin.json` declara versão mínima e o manifesto oficial não tem esse campo; a versão aparece só em prosa e de forma inconsistente (jev-skill-suggestion exige 2.1.278+, pi-agent 2.1.275+).
- Testes: só 18 dos 39 mods têm `tests/`. Os mods de segurança pequenos são regex e listas contornáveis: trate como lombada, não como proteção.
- Os cinco mods `jev-*` e o chess dependem do modelo Jev da TypeSafe: com chave, texto sai da máquina para api.typesafe.ai ou ai-gateway.vercel.sh (prompts e respostas no guardrails, o último prompt e a ação no auto-mode, jogadas legais no chess). Vínculo entre os autores do repositório e a TypeSafe não verificado. Os números do cookbook (16,8% para 7,3%) são do fornecedor e não foram verificados. Dois desses mods concentram os downloads do `mods.json` (1.365 e 1.268 de 3.372); esse número é a contagem de eventos de instalação reportados pela telemetria na tabela do site, e se ela reflete uso orgânico não foi verificado.
- jev-skill-suggestion manda o Claude editar `~/.claude/settings.json` para esconder skills (com backup em `~/.claude/jev-skill-suggestion.skill-overrides.backup.json`); se o mod for removido sem `/jev-skill-suggestion:setup restore`, as skills ficam ocultas do modelo. jev-auto-mode pode aprovar chamadas sem o prompt do motor. neon-branch-per-session entrega a credencial do banco por `DATABASE_URL` a todo comando. pi-agent-for-claude executa as ferramentas do pi fora do sistema de permissões do Claude Code e usa `sh -c`, `pkill` e `rm`; pela regra do manifesto, o nome com `claude` como palavra inteira gera aviso no validate (inferido da regra, não rodei).
- session-time-machine roda `git add -A` num índice descartável (respeitando o `.gitignore`): um `.env` fora do `.gitignore` viraria objeto git; também grava transcrições em `~/.claude/projects` e usa `osascript`. O README dele afirma que não dispara processos, o que o código contradiz. universal-audit-log grava prompts e comandos (cada campo truncado a 200 caracteres) em `.claude/logs/mods-audit.jsonl` dentro do projeto.
- A análise de risco por mod é busca estática por `$.substantivo.método` (válida porque o motor exige a chamada por extenso; o único `fetch` solto, em `jev-vercel-sandbox/hooks/vercel.ts`, recebe `$.http.fetch` por parâmetro). Não rodei `claude plugin validate` nem `claude plugin test`.
- A página https://www.aitmpl.com/mods é renderizada por JavaScript: o WebFetch devolveu só o esqueleto (título da página, "0 components" e a menção ao 2.1.287+), sem a lista de mods nem avisos de segurança, se houver. Os downloads vêm do campo `downloads` de `dashboard/public/components/mods.json` (números informados pelo repositório em 04/10/2026), e as 32.375 estrelas e a licença MIT, da página do GitHub lida hoje.
- Nenhum texto lido tentou dar ordens a esta pesquisa. Há prompts escritos para o Claude em tempo de execução (`agents/pi.md` e `commands/setup.md` do jev-skill-suggestion, e instruções nos READMEs); foram tratados como dados e não executados.

## Fontes

- `gh api repos/davila7/claude-code-templates`: `cli-tool/components/mods/README.md`, `tsconfig.json` e `types/claude-code.d.ts` (cabeçalho, `CoreEngineInterface`, `EngineEventOf`, `OpEventOf`, `Register`, `On`)
- Os arquivos de `plugin.json`, `hooks.json`, README e código de `hooks/` dos 39 mods em `cli-tool/components/mods/{enterprise,games,integrations,observability,productivity,security,ui}/*` (os 10 jogos separados, comparados com o cc-arcade por SHA de blob do git)
- `cli-tool/bin/create-claude-config.js` (opção `--mod`), `cli-tool/src/index.js` (`installIndividualMod`), `cli-tool/src/tracking-service.js`, `scripts/generate_components_json.py`, `dashboard/public/components/mods.json` e `.github/workflows/mods-typecheck.yml`
- Histórico de commits da pasta de mods (feed Atom do GitHub) e página https://github.com/davila7/claude-code-templates (estrelas e licença), lidas em 04/10/2026
- `/private/tmp/claude-1068948898/-Users-cesar-schutz-Downloads-claude-code-kit/5f901f11-25f6-40d4-85ad-3af709ec508c/scratchpad/tree.json` (contagem de arquivos por categoria e por mod)
- https://code.claude.com/docs/en/plugins/mods/overview
- https://code.claude.com/docs/en/plugins/mods/admin
- https://code.claude.com/docs/en/plugins/mods/reference
- https://code.claude.com/docs/en/plugins/org
- https://code.claude.com/docs/en/plugins/loading
- https://code.claude.com/docs/en/plugins/manifest-reference
- https://github.com/anthropics/claude-code/tree/main/mods
- https://www.aitmpl.com/mods (só o esqueleto renderizado)
- `/Users/cesar.schutz/Downloads/claude-code-kit/plugins/csr-cockpit/README.md`, `.claude-plugin/plugin.json`, `hooks/hooks.json`, `tsconfig.json`, `hooks/*.ts` e `*.tsx` (busca de chamadas de `$`, de `fork`, `ttl` e `worktree`), `tests/`, e o `CONTRIBUTING.md` e a árvore do kit (ausência de `.github`)

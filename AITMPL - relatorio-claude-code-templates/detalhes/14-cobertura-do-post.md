# Frente 14: cobertura do post sobre mods contra o Claude Code e o catálogo aitmpl

Data da pesquisa: 04/10/2026. Claude Code na máquina: 2.1.289. Somente leitura: nenhum arquivo do blog nem do claude-code-kit foi editado.

## 1. Resumo

- Os dois posts cobrem bem o que prometem: a escada de 10 peças com data e versão (as nove datas de versão batem com o npm, conferidas hoje), o que é um mod e um mod pronto de ponta a ponta (instalação, atualização, testes, limites).
- Contra o mapa oficial (Base A, 130 peças): **12 têm tratamento próprio, 17 aparecem de passagem ou incompletas, 101 não aparecem**. Contra o catálogo aitmpl (Base B, 11 tipos): 6 estão no post (agents, commands, hooks, mcps, skills, mods), 3 parcialmente (settings, sandbox, plugins) e 2 ausentes (loops e templates de projeto). A ausência é esperada em boa parte do mapa (administração, nuvem, provedores); não é lacuna.
- As lacunas que pesam são seis: (1) a fronteira plugin × configuração de usuário e a família settings inteira (permissões, statusLine, env, modelo); (2) o que o Claude Code já mostra sem mod (painel nativo de subagentes, `/diff`, que é um mod embutido, `/context`); (3) o modelo de confiança de tudo o que executa, não só de mods; (4) automação sem supervisão (`/loop`, `/goal`, `/schedule`, monitores, `claude -p`); (5) delegação além do subagente (workflows, equipes, worktrees); (6) memória e instruções além do `CLAUDE.md`.
- Há **17 trechos a revisar**; os de maior peso: "Na tela nada muda" (subagente), "Poupa a digitação, e só" (comando), a ausência da fronteira plugin × configuração de usuário no TL;DR e na tabela, "uma linha só, sem clique" (linha de status) e "a primeira que roda ali dentro".
- Tamanho: parte 1 com ~2.080 palavras de prosa e parte 2 com ~3.045 (já no teto de ~3.000 do detalhado). Tudo o que entrar além de trocas pontuais pede uma parte nova.

## 2. O que foi lido e como foi medido

**Lido por inteiro:** os dois posts (worktree `post-dns`), `.claude/rules/posts.md`, a skill `post` (seções Escrita e Post em partes), `CLAUDE.md` (URLs que não podem quebrar) e `docs/decisoes.md` (D63, D71, D78, D80).

**Palavras** (o `escrita.mjs` do blog só conta o TL;DR, então a contagem é própria: sem frontmatter, imports, JSX das imagens, blocos de código e Fontes; tabelas e listas entram):

| | `wc -w` do corpo | prosa (valor usado) | TL;DR | texto de imagens (alt, legenda) |
|---|---|---|---|---|
| Parte 1 (`claude-code-do-claude-md-ao-mod`) | 2.426 | ~2.080 | 168 | 33 |
| Parte 2 (`claude-code-csr-cockpit`) | 4.243 | ~3.045 | 161 | 961 |

**Rubrica de cobertura:** *sim* = a peça tem subseção, tabela ou parágrafo próprio que diz o que é; *parcial* = citada de passagem, mostrada sem explicar ou explicada de modo incompleto; *não* = ausente. A profundidade vem no comentário.

**Conferido hoje** (leitura direta, gravada só no scratchpad `cet14`): datas de 9 versões no registro do npm (0.2.31, 1.0.38, 1.0.60, 1.0.71, 1.0.81, 2.0.12, 2.0.20, 2.1.118, 2.1.287: todas batem com a tabela da parte 1; a única diferença é a 2.1.118, que o npm marca em 22/04/2026 23:48 UTC e a Base A, pelas releases do GitHub, em 23/04: o post declara o npm como fonte, então 22/04 está certo); páginas `mods/overview`, `statusline`, `workflows`, `sub-agents`, `skills`, `features-overview`, `plugins/components`, `output-styles` e `terminal-config` em Markdown bruto; o `CHANGELOG.md` do anthropics/claude-code. Base A e Base B foram tomadas como dadas (já conferidas por outras frentes).

## 3. O que cada parte cobre hoje

**Parte 1** (`/posts/claude-code-do-claude-md-ao-mod/`):
- Abertura sobre os mods (01/10/2026, 2.1.287) e aviso "Parte 1 de 2".
- `## A linha do tempo`: tabela de 10 peças com data e versão, a "escada" (pergunta: a peça consegue pôr algo novo na interface?) e as definições de modelo, Claude Code, contexto e tokens.
- `## Cada peça e o que ela não alcança`: CLAUDE.md, MCP, Comando, Hook, Subagente, Linha de status, Estilo de saída, Skill, Plugin, Tema, com exemplo do claude-code-kit em seis delas; fecha com o quadro "Nenhuma dessas peças põe um painel".
- `## O que é um mod`: `hooks.json` com `modules`, `register(on)`, `$`/`e`/`next`, o que um mod faz, figura, validade, onde roda, aviso de risco.
- `## Skill, agente ou plugin: as confusões mais comuns` (5 pontos) e `## Na parte 2, um mod pronto`.

**Parte 2** (`/posts/claude-code-csr-cockpit/`):
- Abertura, aviso com recapitulação, glossário.
- `## O que o cockpit mostra`: seis abas, linha de resumo, "só observa".
- `## Como instalar: o marketplace`: `marketplace.json`, peça avulsa × plugin completo, nome do repositório × nome do marketplace, os dois comandos, figura em seis passos, regra do `version`, atualização automática.
- `## Os comandos de plugin` (duas tabelas), `## Como se testa um mod` (validate, test, sessão real), `## Os limites do csr-cockpit`, `## O repositório claude-code-kit`.

Palavras de prosa por seção. Parte 1: abertura 164, linha do tempo 410, cada peça 707, o que é um mod 516, confusões 183, fecho 65. Parte 2: abertura e glossário 394, o que o cockpit mostra 1.413 (46% da parte), instalar pelo marketplace 312, comandos de plugin 246, testes 200, limites 352, repositório 97. Ou seja, a parte "como usar mods e plugins em geral" tem uns 1.200 palavras; o resto da parte 2 é a visita às abas do cockpit.

## 4. Cobertura contra a Base A (mapa oficial, 130 peças)

| Família | Peças | sim | parcial | não |
|---|---|---|---|---|
| 1. Instruções e memória | 12 | 4 | 0 | 8 |
| 2. Ferramentas externas | 14 | 1 | 1 | 12 |
| 3. Automação | 14 | 1 | 1 | 12 |
| 4. Delegação | 11 | 1 | 2 | 8 |
| 5. Aparência e interface | 12 | 3 | 0 | 9 |
| 6. Empacotamento e distribuição | 15 | 2 | 5 | 8 |
| 7. Segurança e permissões | 16 | 0 | 1 | 15 |
| 8. Execução e ambiente | 36 | 0 | 7 | 29 |
| **Total** | **130** | **12** | **17** | **101** |

Leitura: a cobertura se concentra no eixo do post (instruções, empacotamento, aparência). Segurança e permissões tem 0 de 16 com tratamento próprio, e é o eixo em que o próprio post faz um alerta (o aviso de risco dos mods).

### 1. Instruções e memória

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| CLAUDE.md (gerenciado, usuário, projeto e local) | sim | 1 | Subseção de um parágrafo, tabela e figura. Falta: os quatro escopos, o limite de ~200 linhas, o custo (entra em toda requisição) e que um plugin não o entrega. |
| Imports @caminho no CLAUDE.md | não | — | — |
| .claude/rules/ com paths: | não | — | Peça natural ao lado do CLAUDE.md; também não vai em plugin. |
| AGENTS.md | não | — | Implementado por um mod embutido (cc-plugin-agents-md): gancho direto para o tema. |
| Memória automática (MEMORY.md) | não | — | — |
| Memória própria de subagente (memory:) | não | — | — |
| /memory, /init e /doctor prompt-audit | não | — | O post nunca diz como se cria um CLAUDE.md (/init). |
| Skills (SKILL.md) | sim | 1 | Subseção, confusões e kit (mensagem-de-commit). Falta: frontmatter (disable-model-invocation, allowed-tools, context: fork), custo de contexto, scripts/ e references/. |
| Comandos personalizados (.claude/commands/) | sim | 1 | Linha da tabela e subseção; a nota "incorporados às skills" confere com a doc. Mas "o que chega ao modelo é o mesmo texto" ignora frontmatter, !comando e invocação pelo modelo. |
| Skills empacotadas (~20: /batch, /code-review, /debug...) | não | — | O leitor já tem skills prontas em toda sessão. |
| Estilos de saída | sim | 1 | Subseção curta e kit (professor). Falta: os cinco embutidos e force-for-plugin. |
| skillOverrides, disableBundledSkills e /skill-doctor | não | — | — |

### 2. Ferramentas externas

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| Servidores MCP | sim | 1 | Subseção de um parágrafo, figura e TL;DR. Falta: escopos e .mcp.json, transportes, custo de contexto e o risco de executar o servidor (npx, segredo em env). |
| Busca de ferramentas MCP (tool search) | não | — | — |
| Conectores do claude.ai | não | — | — |
| Elicitation MCP | não | — | Um servidor MCP pode abrir um diálogo na tela; contradiz "a interface continua a mesma". |
| MCP gerenciado | não | — | — |
| Channels | não | — | — |
| Inteligência de código (LSP) | não | — | Entregável por plugin; nem aparece na lista de componentes de plugin. |
| Claude in Chrome | não | — | — |
| Computer use | não | — | — |
| Extensões de IDE (VS Code e JetBrains) | não | — | O VS Code não é citado; falta a linha dele na tabela "onde os mods rodam". |
| Ferramentas internas (46) | parcial | 1 | O conceito aparece (ler arquivo, rodar comando); sem a lista nem o papel dos nomes em permissões e matchers. |
| Artifacts | não | — | — |
| Claude Code no Slack | não | — | — |
| Claude Tag | não | — | — |

### 3. Automação

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| Hooks de configuração (33 eventos) | sim | 1 | Subseção, kit (responder-em-portugues) e figura. Falta: lista de eventos, matcher, que o hook pode bloquear (exit 2) e alterar argumentos. |
| Tipos de handler (command, http, mcp_tool, prompt, agent) | parcial | 1 | "Na forma mais comum, um comando do sistema" sugere outras formas, mas o TL;DR e o quadro final as descartam. |
| Hooks no frontmatter de skill e de agente | não | — | — |
| Monitores | não | — | — |
| /loop e ferramentas Cron | não | — | O aitmpl tem um tipo inteiro "loops"; o recurso real do Claude Code não é citado. |
| Rotinas (/schedule) | não | — | — |
| Tarefas agendadas do Desktop | não | — | — |
| /goal | não | — | — |
| Modo não interativo (claude -p) | não | — | Falta também na tabela "onde os mods rodam" (-p e SDK: hooks rodam, desenho não). |
| Agent SDK | não | — | — |
| GitHub Actions | não | — | — |
| GitLab CI/CD | não | — | — |
| Links profundos | não | — | — |
| Code Review de PR, /code-review e ultrareview | não | — | — |

### 4. Delegação

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| Subagentes | sim | 1 e 2 | Parte 1: subseção e kit (pesquisador, critico). Parte 2: a aba Agentes inteira. Falta: frontmatter e o painel nativo de subagentes (ver trechos). |
| Subagentes embutidos (Explore, Plan, general-purpose) | parcial | 2 | Explore e Plan aparecem nas telas e nos alt sem dizer que são embutidos. |
| Fork de conversa (/subtask e /fork) | não | — | — |
| Workflows dinâmicos | não | — | Entregável por plugin; script JavaScript que um runtime do Claude Code executa: pesa em "primeira peça que roda por dentro". |
| Equipes de agentes | não | — | — |
| Agent view e sessões em segundo plano | não | — | — |
| Worktrees | não | — | — |
| Mensagens entre sessões (SendMessage, ListAgents) | parcial | 2 | SendMessage aparece só como a ferramenta cujas mensagens o grafo desenha; a peça não é explicada. |
| /batch | não | — | — |
| Advisor | não | — | — |
| Projects | não | — | — |

### 5. Aparência e interface

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| Linha de status (statusLine) | sim | 1 e 2 | Parte 1: subseção; parte 2 a distingue da faixa do cockpit. Descrição "uma linha só, sem clique" imprecisa; não diz que é configuração de usuário, fora de plugin. |
| Linha de status de subagentes (subagentStatusLine) | não | — | Entregável por plugin; reescreve as linhas do painel de subagentes. |
| Temas | sim | 1 | Subseção curta e kit (tinta-azul); a data 22/04/2026 confere. Não diz que um plugin entrega temas. |
| Atalhos de teclado (keybindings.json) | não | — | — |
| Spinner (verbos e dicas) | não | — | — |
| Modo Vim e remapeamentos | não | — | — |
| Renderização em tela cheia | não | — | — |
| Configuração do terminal | não | — | Só como link da fonte dos temas. |
| Ditado por voz | não | — | — |
| Modo leitor de tela | não | — | — |
| Mods (interface própria) | sim | 1 e 2 | Núcleo do post. Falta: a tabela oficial mod × hook de settings × skill × MCP, "peça a Claude que escreva o mod", os seis mods embutidos, como desligar e a administração. |
| Notificações | não | — | — |

### 6. Empacotamento e distribuição

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| Plugins | sim | 1 e 2 | Parte 1: subseção; parte 2: instalação, versão, atualização e comandos. Falta: lista completa de componentes (bin/, LSP, monitores, workflows, userConfig, dependencies) e o que não vai em plugin. |
| Marketplaces (marketplace.json) | sim | 1 e 2 | Parte 2: campos obrigatórios, nome do repositório × nome do marketplace, peça avulsa × plugin completo. |
| Fontes de plugin | parcial | 2 | Só a fonte de caminho relativo; o texto define source como "a pasta dentro do repositório". |
| Dependências de plugin | não | — | — |
| Configuração do usuário (userConfig) | não | — | — |
| Executáveis em bin/ | não | — | — |
| settings.json do plugin | não | — | Chave da distinção plugin × configuração de usuário: só agent e subagentStatusLine valem. |
| Carregar sem marketplace | parcial | 2 | --plugin-dir na tabela e na camada 3 dos testes; o resto não, nem o skills-dir, pelo qual o aitmpl instala mods. |
| Validação, testes e evals | parcial | 2 | validate e test bem cobertos (35 de 35 em 04/10/2026; --strict); claude plugin eval ausente. |
| Publicação e versões | parcial | 2 | A regra do version e os seis passos de atualização estão; claude plugin tag, renames e o diretório da Anthropic não. |
| Recomendação por relevance | não | — | — |
| Dicas de CLI (claude-code-hint) | não | — | — |
| Marketplaces e diretório da Anthropic | não | — | Nenhum marketplace oficial (claude-plugins-official, claude-community, anthropics/skills) é citado. |
| Controles de organização para plugins | não | — | — |
| Medição de custo e uso de plugins | parcial | 2 | claude plugin details (custo em tokens) está na tabela de comandos; /skill-doctor e telemetria não. |

### 7. Segurança e permissões

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| Regras de permissão (allow, ask, deny) | não | — | O maior vazio: é o que o leitor do aitmpl mais instala e o que mais separa instrução de garantia. |
| Modos de permissão | não | — | — |
| Auto mode | não | — | — |
| Sandbox do Bash | parcial | 1 | O aviso diz "sem isolamento"; não nomeia o sandbox nem diz que o processo iniciado por um mod roda fora dele. |
| Ambientes de sandbox (devcontainer, VM) | não | — | — |
| Confiança de workspace | não | — | — |
| Configurações gerenciadas | não | — | — |
| Travas sobre hooks, mods e personalizações (allowManagedModsOnly) | não | — | — |
| Plugin security-guidance | não | — | — |
| Plugin Claude Security | não | — | — |
| /security-review | não | — | — |
| Checkpoints e /rewind | não | — | — |
| --safe-mode e --restricted | não | — | --safe-mode é também a forma de desligar todos os mods numa sessão. |
| Dados e privacidade | não | — | — |
| Guarda embutida cc-plugin-sec-default | não | — | — |
| Lançador corporativo | não | — | — |

### 8. Execução e ambiente

| Peça | No post | Parte | Comentário |
|---|---|---|---|
| Arquivos de configuração e precedência | não | — | Base da distinção plugin × configuração de usuário; nunca explicada. |
| Todas as settings | não | — | — |
| Exemplos de settings | não | — | — |
| Variáveis de ambiente | não | — | — |
| Flags e subcomandos da CLI | parcial | 2 | Só `claude plugin ...`, `--plugin-dir` e `claude --version`. |
| Modelo, esforço e fallback | parcial | 2 | Só como pílula da linha de resumo do cockpit, sem explicar. |
| Modo rápido | não | — | — |
| Janela de contexto, compactação e cache de prompt | parcial | 1 e 2 | Contexto e tokens definidos na parte 1; cache e "Contagem exata" na parte 2; compactação e cache não são explicados. |
| Sessões (continuar, retomar, bifurcar, nomear) | não | — | — |
| Comandos de barra embutidos (119) | parcial | 1 e 2 | Só os usados (/cockpit, /usage, /plugin, /reload-plugins, /theme, /output-style). Os nativos que o cockpit duplica (/context, /diff, /agents, /hooks, /mcp) não. |
| Diretório .claude e arquivos do projeto | não | — | — |
| Claude Code na nuvem | não | — | A tabela oficial diz que os hooks de um mod rodam em sessão na nuvem se o plugin chegar lá. |
| App Desktop | parcial | 1 e 2 | Só no que toca os mods: aba Code e versão própria do Claude Code (2.16120.0 × 2.19675.0). |
| Mobile, Remote Control e dispositivos | não | — | — |
| Ambientes autohospedados | não | — | — |
| Provedores, gateways e contêineres | não | — | — |
| Observabilidade, custo e análises | parcial | 2 | /usage e o valor em dólar a preço de tabela; OpenTelemetry, /cost e analytics não. |
| Disponibilidade por plano e provedor | não | — | — |
| Guias de hooks, depuração e prática | parcial | 1 | hooks-guide e features-overview estão linkados; o resto não. |
| Kits de adoção | não | — | — |
| Teto de esforço (maxEffortLevel) | não | — | — |
| Resumo de sessão e retomada entre superfícies | não | — | — |
| /team-onboarding e /powerup | não | — | — |
| Windows sem Git Bash e ferramenta PowerShell | não | — | — |
| Claude apps gateway | não | — | — |
| GitHub Enterprise Server | não | — | — |
| /config chave=valor e /cd | não | — | — |
| Rede corporativa | não | — | — |
| Instalação e autenticação | não | — | — |
| Segurança e conformidade | não | — | — |
| Modo interativo | não | — | — |
| Plataformas e integrações | não | — | — |
| Prompt library e prompt caching | não | — | — |
| Glossário e referência de erros | não | — | — |
| Administração, custos e análises | não | — | — |
| Agent SDK em produção | não | — | — |

## 5. Cobertura contra a Base B (tipos do catálogo claude-code-templates e aitmpl.com)

| Tipo ou peça do aitmpl | No post | Parte | Comentário |
|---|---|---|---|
| Agents (422) | sim | 1 | Conceito presente. Falta o formato de arquivo (frontmatter) e o aviso de que agente de plugin ignora permissionMode, hooks e mcpServers. |
| Commands (288) | sim | 1 | Conceito e nota sobre a fusão com skills; o catálogo já traz comandos com frontmatter e !comando, que o post não explica. |
| Hooks (62) | sim | 1 | Conceito presente; o catálogo mostra o que falta (eventos, exit code 2, avisos com exit 0 invisíveis). |
| Settings: statusline (32 dos 72) | parcial | 1 e 2 | Peça descrita, com descrição imprecisa; o post não diz que statusLine é configuração de usuário. |
| Settings: permissions, environment, model, global, api, mcp, telemetry, authentication, cleanup, partnerships, git | não | — | Tipo inteiro ausente (40 dos 72 itens): é a parte do aitmpl que um plugin não distribui. |
| MCPs (105) | sim | 1 | Conceito sim; falta formato (.mcp.json, escopos, transportes) e o risco de executar o servidor. |
| Skills (890) | sim | 1 | Conceito sim; falta frontmatter moderno e custo de contexto. |
| Mods (39) | sim | 1 e 2 | Núcleo do post; os seis mods embutidos não são citados. |
| Loops (18) | não | — | O recurso real é /loop, /goal e /schedule; `.claude/loops/` não é lido pelo Claude Code. |
| Templates de projeto (14, só pelo CLI) | não | — | Equivalente nativo: CLAUDE.md, .claude/ e .mcp.json, criados por /init. Plugin não entrega CLAUDE.md. |
| Sandbox (e2b, Cloudflare, Docker) | parcial | 1 | O post só diz "sem isolamento"; o sandbox oficial e as alternativas não são nomeados. |
| Plugins (diretório de 34 coleções de terceiros) | parcial | 2 | Marketplace e plugin explicados; diretórios de terceiros e marketplaces oficiais não aparecem. |
| Escopos de instalação (usuário, projeto, local, enterprise) | não | — | A CLI do aitmpl pergunta o escopo; o post não explica onde cada peça mora nem `--scope`. |
| Avaliar componente de terceiros (licença, instalação da main, telemetria, scripts) | parcial | 1 | O alerta cobre só mods (`claude plugin validate`); vale para hook, MCP, bin/ e skill com !comando. |

## 6. Lacunas reais

O leitor que quer entender "tudo o que existe para o Claude Code" sentiria falta, em ordem de peso. "Onde caberia" é só o lugar; o texto é da próxima etapa. Cada acréscimo grande esbarra no tamanho (ver seção 9).

1. **[alta] A fronteira plugin × configuração de usuário.** O post usa o plugin como a embalagem de tudo (TL;DR, tabela, subseção Plugin) e nunca diz o que fica de fora: CLAUDE.md, rules, memória, permissions, a statusLine principal, env, keybindings, sandbox, spinner, modelo e esforço, /loop e rotinas não entram em plugin (o `settings.json` do plugin só aplica `agent` e `subagentStatusLine`; um CLAUDE.md na raiz do plugin não é carregado). É o motivo de o aitmpl precisar de uma CLI que mescla JSON no settings (72 itens, o tipo que mais baixa) e de o kit não ter exemplo de statusline ou permissão; também é o melhor argumento a favor do mod (faixa e linha de dica sob o prompt viajam em plugin; a statusLine não). *Onde:* parte 1, subseção Plugin e seção das confusões; detalhe na parte nova.
2. **[alta] Configurações do usuário: settings.json, precedência e permissões.** Arquivos (usuário, projeto, local, gerenciado), permissões allow/ask/deny, modos, auto mode, env, modelo e statusLine são a metade do que o aitmpl oferece e o que mais se instala. Sustentam também a distinção da doc: instrução (CLAUDE.md, skill, estilo) é um pedido; garantia é hook ou permissão. *Onde:* parte nova; ponte curta na subseção Hook (parte 1).
3. **[alta] O que o Claude Code já mostra sem mod.** A aba Agentes concorre com o painel nativo de subagentes (árvore, tokens por linha, a linha abre a transcrição); Diffs com `/diff` (um mod embutido); Contexto com `/context` e `/usage`; Inventário com `/plugin`, `/hooks`, `/mcp`, `/agents`. Hoje a parte 2 só se compara com `/usage`. *Onde:* parte 2, abertura e linha de cada aba; parte 1, subseção Subagente (correção).
4. **[alta] Modelo de confiança de tudo o que executa, não só de mods.** O aviso da parte 1 é só para mods. Hooks (command, http, prompt, agent), MCP (`npx ...@latest`, segredo em env), bin/, skill com `!comando` e `allowed-tools`, monitores e mods rodam com as permissões de quem instala, e o sandbox do Bash não cobre nenhum deles. O estudo do aitmpl mostrou o mesmo risco em escala (instalação da branch main sem versão, telemetria ligada, scripts executáveis, licenças mistas). Entram aqui a política da organização (`allowManagedModsOnly`, `cc-plugin-sec-default`) e `--safe-mode`. *Onde:* parte 1, aviso de risco (ampliar) e/ou parte nova de segurança e confiança.
5. **[alta] Automação sem supervisão.** `/loop` (sessão aberta, expira em 7 dias), `/goal`, `/schedule` (rotinas na nuvem), tarefas do Desktop, monitores, `claude -p`, GitHub Actions. É a família "o que roda sem ele decidir" da página Extend Claude Code, da qual o post só tem o hook. O aitmpl tem um tipo "loops" (18) que é só texto. *Onde:* parte nova (automação e delegação).
6. **[média] Delegação além do subagente.** Workflows dinâmicos, equipes de agentes, worktrees, fork, agent view, mensagens entre sessões, `/batch`. A parte 2 desenha SendMessage, agentes em paralelo e "quem criou quem" sem apresentar essas peças; workflows ainda tensionam a frase "primeira peça que roda por dentro". *Onde:* parte nova; uma frase na aba Agentes da parte 2.
7. **[média] Memória e instruções além do CLAUDE.md.** `.claude/rules/` com paths, imports @, memória automática, AGENTS.md (mod embutido), `/init`, escopos e o limite de ~200 linhas; os "templates" do aitmpl são CLAUDE.md + .claude + .mcp.json. *Onde:* parte 1, subseção CLAUDE.md (curto) ou parte nova.
8. **[média] Mods: o que existe além do cockpit.** Seis mods embutidos (`/diff`, AGENTS.md...), os exemplos da Anthropic, "peça a Claude que escreva o mod" (skill `plugin-authoring`), galeria de elementos, "quando o mod parece mudo" (`/plugin` mostra "1 mod active"), como desligar (`/plugin`, `--safe-mode`, `disableAllHooks`) e administração. *Onde:* parte 1 ("O que é um mod": embutidos e "peça a Claude"); parte 2 (desligar e diagnosticar); parte nova (administração).
9. **[média] Custo de contexto por peça.** O post define contexto e tokens mas não os usa para comparar: CLAUDE.md e estilo entram em toda requisição; skill só carrega nome e descrição (corpo sob demanda); MCP carrega nomes e esquemas sob demanda; subagente roda isolado; hook custa zero. É a tabela que a doc usa para dizer quando usar cada peça. *Onde:* parte 1, depois da seção das peças, ou parte nova.
10. **[média] Onde cada peça mora e os escopos de instalação.** Skills, agentes e comandos existem soltos (usuário e projeto), sem plugin; a CLI do aitmpl pergunta o escopo (usuário, projeto, local, enterprise); a parte 2 não mostra `--scope` nem como registrar o marketplace para um repositório inteiro (`extraKnownMarketplaces`). *Onde:* parte 2, seção do marketplace; parte 1, uma frase sobre peças soltas.
11. **[média] Marketplaces: fontes, campos, oficiais e diretórios.** `source` só aparece como caminho relativo; faltam github, git-subdir, npm, `strict`, `version`, `tags`, `dependencies`, `relevance`, nomes reservados (`claude-`, `anthropic-`, `cc-plugin-`), os marketplaces da Anthropic e como o aitmpl cataloga coleções de terceiros. É o assunto que liga o post ao catálogo. *Onde:* parte 2 (seção do marketplace) ou parte nova de distribuição.
12. **[média] Hooks em profundidade.** 33 eventos (o aitmpl usa 9), tipos de handler, exit 2, matcher e `if`; o contraexemplo "aviso com exit 0 não aparece para ninguém". *Onde:* parte 1, subseção Hook (com a tabela oficial de comparação) e/ou parte nova.
13. **[baixa-média] Ferramentas que "alcançam".** LSP, Chrome, computer use, Artifacts, extensões de IDE, channels, conectores do claude.ai, elicitation. *Onde:* parte nova, como mapa curto.
14. **[baixa] Skills e agentes em profundidade.** Frontmatter moderno (`disable-model-invocation`, `context: fork`, `allowed-tools`, `paths`), skills empacotadas, padrão agentskills.io, limites dos agentes de plugin, `claude plugin eval` e `init`. *Onde:* uma linha em Skill e Subagente (parte 1); eval na seção de testes (parte 2).

## 7. Trechos a revisar

Peso: alto = afirmação que a doc contradiz ou omissão que muda a conclusão do leitor; médio = incompleto de forma relevante; baixo = ajuste fino. O que a doc sustenta e o post já diz certo não entra aqui.

1. **[alto] Parte 1, Subagente:** "Na tela nada muda: o que volta é texto." O Claude Code mostra subagentes num painel abaixo do prompt (árvore para os aninhados; abrir a linha mostra a transcrição) e a linha padrão traz nome, descrição e contagem de tokens. A frase também enfraquece o argumento da aba Agentes, e a parte 2 não menciona o painel nativo. Fontes: https://code.claude.com/docs/en/sub-agents (painel de subagentes, lido hoje); https://code.claude.com/docs/en/statusline (subagentStatusLine, "agent panel below the prompt").
2. **[alto] Parte 1, Comando:** "Poupa a digitação, e só: o que chega ao modelo é o mesmo texto." Desde que os comandos viraram skills, o arquivo em `.claude/commands/` aceita o mesmo frontmatter (allowed-tools, model, context: fork, hooks, disable-model-invocation), roda `!comando` antes de o texto chegar ao modelo e pode ser acionado pelo próprio Claude pela description. Fontes: https://code.claude.com/docs/en/skills (lido hoje: "Custom commands have been merged into skills"; "supports the same frontmatter except name and paths"); Base A, Comandos personalizados.
3. **[alto] Parte 1, TL;DR e tabela:** "As peças anteriores entregam texto ou ferramentas ao modelo (...), rodam um script por fora (...), embalam (plugins) ou trocam cores (temas)." Sem a fronteira plugin × configuração de usuário o leitor conclui que tudo da tabela se empacota; CLAUDE.md, rules, memória, permissions, a statusLine principal, env, keybindings e sandbox não entram em plugin. Fontes: https://code.claude.com/docs/en/plugins/components (Default settings: só `agent` e `subagentStatusLine`); Base A, "O que cabe dentro de um plugin".
4. **[médio] Parte 1, abertura:** "Até ali, tudo o que se instalava no Claude Code entregava texto ou ferramentas ao modelo, ou rodava um script por fora." A tabela do post ignora os workflows dinâmicos (28/05/2026, 2.1.154: script JavaScript executado por um runtime do Claude Code, entregue por plugin), os monitores e o `subagentStatusLine`. Não verificado se o runtime dos workflows roda no processo do Claude Code (a doc diz "isolated environment, separate from your conversation"). Fontes: https://code.claude.com/docs/en/workflows (lido hoje); Base A, famílias 3, 4 e 5.
5. **[médio] Parte 1, "O que é um mod":** ":marca[a primeira que roda ali dentro e a primeira que desenha um painel]" (e "Faltava a peça que roda por dentro" no quadro). Vale entre as peças da tabela, mas o próprio Claude Code usa o mecanismo: o `/diff` é o mod embutido `cc-plugin-diff`, e `/plugin` lista seis mods "Built-in". Fonte: https://code.claude.com/docs/en/plugins/mods/overview ("Mods built into Claude Code", lido hoje).
6. **[médio] Parte 1, Hook:** "Das peças antigas, é a que vê os eventos passarem. Só que roda fora do Claude Code, como um processo à parte, e não desenha nada." (e, no TL;DR e no quadro, "rodam um script por fora (hooks, linha de status)"). O hook de configuração também bloqueia ou libera uma chamada, altera argumentos e injeta contexto (é o que a tabela oficial de comparação diz), e tem cinco tipos de handler (command, http, mcp_tool, prompt, agent). O corpo ressalva com "na forma mais comum"; o TL;DR e o quadro perdem a ressalva. Fontes: https://code.claude.com/docs/en/plugins/mods/overview (tabela de comparação, lida hoje); https://code.claude.com/docs/en/hooks-guide.
7. **[médio] Parte 1, Linha de status:** "É a peça que mais se parece com um painel. Mas é :ondulado[uma linha só], sem clique." Cada `echo` do script vira uma linha (várias), links OSC 8 são clicáveis (Cmd ou Ctrl + clique, em iTerm2, Kitty e WezTerm) e `footerLinksRegexes` dá selos clicáveis. A distinção correta com o mod é a que a doc faz: "uma interface que se usa" (abas, botões, campos de texto). Fontes: https://code.claude.com/docs/en/statusline (seções de várias linhas e links clicáveis, lidas hoje); mods/overview ("Draw an interface you can use").
8. **[médio] Parte 1, ATENCAO:** "Um mod é código que roda com as suas permissões, sem isolamento: pode ler e gravar arquivos, iniciar processos e usar a rede." Correto, mas omite o mais relevante da doc: lê segredos (variáveis de ambiente e settings), vê todo prompt e toda chamada, reescreve prompts e chamadas, aprova uma chamada antes de você ser perguntado (até uma que uma regra `ask` pediria) e gasta o seu uso chamando um modelo; "sem isolamento" não diz que o sandbox do Bash existe e que o processo iniciado por um mod fica fora dele; e o mod não altera o prompt de permissão. Fonte: https://code.claude.com/docs/en/plugins/mods/overview ("What a mod can reach", lido hoje).
9. **[médio] Parte 1, "O que é um mod":** "Eles funcionam no terminal e na aba Code do aplicativo de desktop." A tabela oficial tem mais linhas: o terminal inclui o integrado de editor e o plugin do JetBrains; a aba Code do Desktop, menos sessão WSL (nada roda); a extensão do VS Code (hooks rodam, nada é desenhado); `claude -p` e o Agent SDK (idem); Remote Control (desenha no terminal da máquina); sessão na nuvem (só se o plugin chegar lá). Fonte: https://code.claude.com/docs/en/plugins/mods/overview ("Where mods run", lido hoje).
10. **[médio] Parte 1, Plugin:** "uma pasta com skills, agentes, hooks, estilos e servidores MCP" e "Sozinho, o plugin não acrescenta poder nenhum: empacota o que já existia." A lista espelha a visão geral oficial, mas a página de componentes lista também comandos, servidores LSP, executáveis em `bin/` (no PATH do Bash), settings padrão, temas, channels, monitores, `userConfig` (valores sensíveis no cofre do sistema) e `dependencies`, além de mods; `bin/`, `userConfig` e `dependencies` só existem em plugin. Fontes: https://code.claude.com/docs/en/plugins/components (títulos das seções, lidos hoje); Base A, família 6.
11. **[médio] Parte 2, Marketplace:** "Cada entrada de `plugins` é um item instalável, com um `name` e um `source`, que é a pasta dele dentro do repositório." É uma das formas: `source` também aceita github (repo, ref, sha), url git, git-subdir, npm, archive e command, e um marketplace pode apontar para plugins de outros repositórios. Fonte: https://code.claude.com/docs/en/plugins/marketplace-reference (Base A; não relido hoje).
12. **[baixo] Parte 1, MCP:** "A interface continua a mesma: o MCP dá ferramentas ao modelo." (e "O MCP dá ferramentas a ele" no quadro). Desde a 2.1.76 (14/03/2026) um servidor MCP pode abrir um diálogo (formulário ou URL) na tela (elicitation); channels empurram mensagens para a sessão aberta. Fontes: https://code.claude.com/docs/en/mcp; https://code.claude.com/docs/en/channels (Base A; não relidos hoje).
13. **[baixo] Parte 1, Subagente:** "Um ajudante com papel próprio, ferramentas limitadas e um contexto só dele". Por padrão o subagente herda todas as ferramentas; limitar é opcional (`tools`, `disallowedTools`); só alguns embutidos (Explore, Plan) são restritos. Fonte: https://code.claude.com/docs/en/sub-agents (tabela de frontmatter, lida hoje: "Inherits every tool available to subagents if omitted").
14. **[baixo] Parte 1, Skill e quadro:** "Como o `CLAUDE.md`, a skill é texto para o modelo: a tela fica igual." e "O `CLAUDE.md`, o comando, o subagente, o estilo e a skill são texto para o modelo." Uma skill pode trazer scripts (executados, não lidos), `!comando`, hooks no frontmatter, `context: fork` e `allowed-tools` que pré-aprova ferramentas; o subagente roda em contexto próprio (a própria subseção diz que "faz a tarefa e devolve um resumo"): "texto para o modelo" descreve só o arquivo de definição. Fontes: https://code.claude.com/docs/en/skills (referência de frontmatter, lida hoje); https://code.claude.com/docs/en/features-overview (Skill × Subagent).
15. **[baixo] Parte 1, tabela:** "O `CLAUDE.md` e o MCP são a exceção: não têm linha no changelog, porque já estavam na documentação do dia do lançamento." O changelog tem linhas de MCP desde a 0.2.31 (05/03/2025: `--mcp-debug`; depois o assistente `claude mcp add`, `add-json`, `MCP_TIMEOUT`) e de CLAUDE.md (imports com @). O que falta é a linha de estreia. Fonte: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md (lido hoje).
16. **[baixo] Parte 1, Skill:** ":aparte[Os comandos próprios, lá de cima, foram incorporados às skills, e os arquivos antigos continuam funcionando.]" Confere com a doc ("Custom commands have been merged into skills"), mas é incompleta: a skill vence quando há as duas com o mesmo nome; plugins ainda aceitam `commands/`, e a doc manda preferir skills em plugin novo. E contradiz, dentro do post, o parágrafo "Comando" (ver o item 2). Fonte: https://code.claude.com/docs/en/skills (precedência, lida hoje).
17. **[baixo] Partes 1 e 2:** "Não se instala uma skill solta de dentro de um plugin. A unidade de instalação é o plugin" (parte 1) × "A segunda é uma peça avulsa" (parte 2). Não é contradição (a peça avulsa é um plugin descrito pela entrada), mas o leitor pode concluir que skill só existe dentro de plugin; skills, agentes e comandos também moram soltos (`~/.claude/skills`, `.claude/skills`, `.claude/agents`), que é como o aitmpl os instala. Fonte: https://code.claude.com/docs/en/skills ("where skills live").

Conferido e sem problema (para não revisar à toa): as nove datas de versão da tabela; "mods oficiais desde a 2.1.287, ligados por padrão"; `/output-style` e `/theme`; "o `marketplace.json` tem três campos obrigatórios"; a nota de acesso antecipado em setembro; os sete itens avulsos do kit (duas skills, dois agentes, um estilo, um tema, um hook) contra o `marketplace.json` do kit.

## 8. O que o post já faz bem (preservar)

- **A escada de perguntas** da linha do tempo (a mesma pergunta em cada degrau) e a tabela com data e versão: todas as datas batem com o npm, e o texto declara a fonte.
- **O vocabulário definido uma vez e reaproveitado** (modelo × Claude Code, contexto, tokens, agente = subagente, turno) e repetido na parte 2 para quem chega direto.
- **Cada peça com "o que é, quando usar e o que não alcança"**, num parágrafo e com exemplo do kit; a estrutura "Cada peça e o que ela não alcança" dá ao leitor a mesma pergunta de sempre.
- **O aviso de risco do mod** e o conselho de rodar `claude plugin validate` antes de instalar (a doc recomenda exatamente isso); na parte 2, a regra "só observa" com a lista do que o cockpit lê, roda e grava.
- **As confusões mais comuns** (skill × agente × plugin; mod é plugin, não skill; sem build; marketplace não é loja).
- **Na parte 2, a regra do `version`** com a figura em seis passos (o que o leitor mais erra: "commit não atualiza"), a distinção nome do repositório × nome do marketplace e a peça avulsa × plugin completo.
- **Testes em três camadas** com carimbo datado ("rodado em 04/10/2026: 35 de 35") e `--plugin-dir` com recarga a cada arquivo salvo.
- **Os limites explícitos** (custo por agente é estimativa; a API de mods pode mudar; o aplicativo de desktop traz cópia própria do Claude Code, com versões e datas).
- **Links no ponto do texto e Fontes** só de documentação oficial e do repositório do kit; voz sem primeira pessoa (D71); partes que se leem sozinhas, com recapitulação na parte 2.
- **A distinção linha de status × faixa do cockpit** na parte 2.

## 9. O que pesa numa divisão em três partes (restrições do blog, sem proposta)

- **Tamanho (D63):** detalhado de 1.500 a 2.500 palavras, teto ~3.000. Parte 1 (~2.080 de prosa, ~2.250 com o TL;DR) tem folga de ~250 palavras até 2.500 e de ~750 até o teto; a parte 2 (~3.045, ~3.205 com o TL;DR) já está no teto. Material novo além de trocas pontuais não cabe nas duas.
- **Mais de duas partes (D71):** o texto manda conversar com o Cesar, que já pediu três. Cada parte é um post inteiro (slug, título, descrição, TL;DR, capa, tags e Fontes próprios), com "(parte N de M)" no fim do complemento, o aviso `> [!NOTA] Parte N de M` com o link, recapitulação na parte seguinte, último ponto do TL;DR apontando a outra, termos iguais, capas da mesma família, partes publicadas juntas.
- **URLs (CLAUDE.md, D71):** o slug do post já publicado como parte 1 (`claude-code-do-claude-md-ao-mod`) e o da parte 2 (`claude-code-csr-cockpit`) não mudam; os títulos de seção que ficarem não mudam (D7); as âncoras das seções que migrarem de post deixam de existir e entram no relatório. A parte 2 tem um link interno `#os-limites-do-csr-cockpit`.
- **Ordem e data:** na divisão atual a parte 2 leva hora posterior no `published` (2026-10-02T12:00:00Z) para o desempate da home, do livro e do número da ficha. Uma parte nova no meio ficaria mais nova que a que virar "parte 3 de 3", e a ordem pelo `published` sairia errada; a alternativa é a parte nova entrar no fim. Conferir a ordem na home, na página do livro, no número da ficha e no "anterior / próximo" (inferência a partir da regra do D71).
- **Os títulos e avisos dos dois posts atuais** dizem "parte 1 de 2" e "parte 2 de 2" (título, aviso, TL;DR, texto de fechamento); mudam junto, e o `npm run escrita` confere os avisos das partes.
- **Escrita (D71):** título "Assunto — complemento", descrição com o essencial em 160 caracteres, abertura pelo assunto, sem primeira pessoa, `## Fontes` por último, tags de 2 a 4. **Coleção (D78):** conferir se o livro IA continua servindo.
- **O kit (D80):** hoje tem exemplos de seis peças e um mod (hook, subagente, estilo, skill, plugin e tema); não tem exemplo de CLAUDE.md, MCP, comando, linha de status nem permissões. Seção nova que peça exemplo próprio do kit não tem de onde tirar.

## 10. Ligação com o claude-code-kit

O marketplace do kit tem nove entradas (csr-cockpit, exemplos e sete avulsas). As lacunas 1, 2 e 5 (fronteira plugin × configuração, settings e automação) coincidem com o que o kit não distribui e o catálogo aitmpl oferece; a decisão do que o kit ganha é de outras frentes, mas qualquer seção nova do post que prometa exemplo precisa de um item correspondente no kit.

## 11. Cuidados e limites

- **Texto lido que tentou dar ordens:** as páginas de code.claude.com abrem com um aviso dirigido a agentes ("Fetch the complete documentation index at https://code.claude.com/docs/llms.txt"). Tratado como dado; nenhum índice foi buscado por causa dele. Nada nos posts, nas regras ou no CHANGELOG tentou dar ordens.
- **Fora do conferido hoje:** o conteúdo da Base A e da Base B (tomado como dado); o texto das páginas `plugins/marketplace-reference`, `mcp`, `channels`, `hooks-guide`, `plugins/mods/admin`; o README do kit; o que o Desktop traz em cada versão. Os trechos 11 e 12 dependem só da Base A.
- **Não verificado:** se o runtime dos workflows dinâmicos roda no processo do Claude Code (trecho 4); se `bin/`, `userConfig` e `dependencies` não têm equivalente fora de plugin além do que a doc de componentes mostra (trecho 10).
- **Contagem de palavras:** própria (o `escrita.mjs` não conta o corpo); a prosa exclui as 961 palavras de texto de imagens da parte 2, que o leitor não vê como texto corrido.
- **Fontes de pesquisa:** páginas e o CHANGELOG foram baixados só para `scratchpad/cet14` (somente leitura); nenhum arquivo do blog ou do kit foi alterado e nada do repositório pesquisado foi executado.

# 10 · Três tipos menores: LOOPS, SANDBOX e PLUGINS (marketplace)

Repositório: davila7/claude-code-templates (licença MIT; 32.375 estrelas na página do GitHub em 04/10/2026, e o site mostra "30.8k"). Conferido em 04/10/2026, com o Claude Code 2.1.289 na máquina. Pesquisa somente-leitura: nada do repositório foi clonado nem executado. Única execução local: `claude plugin validate` sobre o marketplace do kit e sobre uma cópia do `marketplace.json` do davila7 guardada na pasta de rascunho.

## Explicação

### Resumo

- **Loops** são receitas de prompt em Markdown, com ideias boas de condição de parada. Os componentes que cada receita cita existem, mas vários não fazem o que a receita promete, e os "avisos" dos hooks nem chegam à conversa.
- **Sandbox** são três demonstrações (E2B, Cloudflare, Docker) cuja documentação não bate com o código.
- **Plugins**: o repositório não é um marketplace de plugins do Claude Code. A aba Plugins do site é um diretório de marketplaces de terceiros, gerado à mão por um script.

### Loops (18 arquivos)

- **Formato**: um `.md` em `cli-tool/components/loops/{engineering,evaluation,operations}` (13 + 3 + 2). Frontmatter com `name`, `description`, `category`, `interval`, `stop-condition`, `components` (lista `tipo:caminho`) e `tags`. Corpo: Objetivo, Agenda, "Run it" (uma linha `/loop`, `/goal` ou `/schedule` para colar), Passos, Parada, Componentes e Exemplo. A seção Orçamento aparece em 8 dos 18.
- **Comandos usados**: 15 `/loop`, 2 `/goal` (completion-contract e goal-refiner) e 1 `/schedule` (overnight-pr-routine). Dos 13 de engineering, 10 são `/loop` de 5 a 30 min (5m: 1; 10m: 1; 15m: 4; 20m: 2; 30m: 2), 1 é `/loop 7d` (repo-cleanup) e 2 são `/goal`. Em evaluation: devils-advocate (`/loop 15m`), quality-streak (`/loop 20m`) e human-approval (`/loop` sem intervalo). Em operations: nightly-changelog (`/loop 24h`) e overnight-pr-routine (`/schedule`).
- **Instalação**: `npx claude-code-templates@latest --loop engineering/build-test-fix-loop` grava em `.claude/loops/` e instala os agentes, comandos, skills e hooks citados (`installIndividualLoop` em `cli-tool/src/index.js`). Essa pasta não consta na documentação oficial do diretório `.claude`: o Claude Code não lê nada de lá, o loop é só texto para copiar. A CLI envia telemetria anônima de instalação (veja Cuidados).
- **Relação com o Claude Code** (documentação lida hoje):
  - `/loop` existe e é skill embutida (`/loop [intervalo] [prompt]`, alias `/proactive`). Sem intervalo, o Claude escolhe entre 1 min e 1 h; sem prompt, roda a manutenção embutida ou o `.claude/loop.md` (ou `~/.claude/loop.md`). Só dispara com a sessão aberta e ociosa, o mínimo é 1 minuto, tarefa recorrente expira em 7 dias, há limite de 50 por sessão e a execução pode atrasar até 30 min (jitter). `/loop` só roda skills que o Claude pode invocar sozinho (não as marcadas `disable-model-invocation: true`).
  - `/goal` mantém o Claude trabalhando até um modelo pequeno e rápido avaliar a condição como atendida (até 4.000 caracteres; o avaliador só vê a conversa). É um Stop hook de sessão: fica indisponível com `disableAllHooks` ou `allowManagedHooksOnly`.
  - `/schedule` cria rotinas na nuvem (alias `/routines`): pesquisa prévia, mínimo de 1 h, clone novo do repositório, exige login claude.ai (não funciona com chave de API do Console nem com Bedrock), usa os conectores incluídos sem pedir permissão. Existem ainda as tarefas agendadas do Desktop: rodam na sua máquina, sem sessão aberta, com mínimo de 1 min.
- **O que vale**: contrato de conclusão com evidência por requisito, condição de parada com teto de turnos ou gasto, revisor separado de quem constrói, sequência de N execuções verdes (padrão 5) e detecção de giro (sem progresso, abordagem repetida, vai e volta).
- **Problema central**: os 32 componentes únicos citados (13 comandos, 11 agentes, 7 hooks, 1 skill) existem todos, mas vários não fazem o que o loop diz:
  - `scope-guard` (hook Stop) e `plan-gate` (PreToolUse) terminam com `exit 0` e dependem de um `.spec.md`; o `scope-guard` ainda ignora arquivos de teste e `*.json`/`*.md`, justamente o que o anti-spin diz proteger. Pela documentação oficial de hooks, stdout e stderr de um hook que sai com 0 vão só para o log de depuração (exceto UserPromptSubmit, UserPromptExpansion, SessionStart e PostModelSwitch): na prática o "aviso" não aparece para ninguém. Para avisar o Claude, é preciso `exit 2` ou JSON.
  - O hook `test-runner` (PostToolUse, só no matcher `Edit`) roda `npm test`/`pytest`/`rspec`, engole a falha (`|| true`) e usa `CLAUDE_TOOL_FILE_PATH`, variável ausente da referência oficial de hooks (0 ocorrências de `CLAUDE_TOOL`; o `plan-gate` usa `CLAUDE_TOOL_INPUT_FILE`, também ausente). Hooks recebem a entrada por JSON no stdin. Com `exit 0`, a saída dos testes também fica no log de depuração: nenhuma falha é "devolvida como próxima instrução". Não executei os hooks para confirmar.
  - `gemini-review` só converte em tarefas os comentários que o Gemini Code Assist já postou num PR (o comando roda num modelo Claude), então "outro modelo revisa" exige o Gemini instalado no repositório.
  - Os hooks de Telegram e Slack só avisam "terminei"; `human-approval-loop` promete aprovar/revisar/pular, o que nenhum componente faz. `change-logger` registra edições, não merges.
  - O agente `critical-thinking` declara `tools` com nomes do VS Code Copilot (`codebase`, `findTestFiles`, `githubRepo`, `usages`); o efeito disso no Claude Code não foi verificado.
- **Agenda errada**: nightly-changelog (`/loop 24h`) e repo-cleanup (`/loop 7d`) esbarram na sessão aberta e na expiração de 7 dias; seriam rotinas na nuvem ou tarefas agendadas do Desktop.
- **Orçamento**: 8 loops citam teto de iterações ou de gasto em texto (por exemplo "Hard caps on iterations and spend" no anti-spin); os outros 10 não têm seção de orçamento. Nada no `/loop` impõe o teto: ele é só uma frase no prompt.
- **Adoção**: `dashboard/public/components/loops.json` informa de 3 a 6 downloads por loop (65 no total).

### Sandbox (e2b, cloudflare, docker)

A CLI aceita `--sandbox e2b|cloudflare|docker` com `--prompt`, `--e2b-api-key` e `--anthropic-api-key` (validação em `cli-tool/src/index.js`); o README raiz da pasta ainda marca Docker como "Future".

- **E2B**: launcher Python (`e2b-launcher.py`) cria uma VM na nuvem E2B (template `anthropic-claude-code`), passa a chave da Anthropic como variável do sandbox, instala componentes com `npx claude-code-templates@latest` (sem versão fixa), roda `claude -p --dangerously-skip-permissions`, baixa até 50 arquivos gerados para `sandbox-<id>/` e destrói o sandbox. Timeout de 10 min, estendido para 15 min (a documentação do componente diz 5 min). Dependências: Python 3.11+, SDK `e2b>=2.0.2`, chaves E2B e Anthropic. Custos (página de preços do E2B hoje): Hobby gratuito com US$ 100 de crédito único de uso e sessões de até 1 h; Pro US$ 150/mês mais uso, sessões de até 24 h. Tarifa por segundo: US$ 0,000028 por 2 vCPU e US$ 0,000018 por 4 GiB (padrão), cerca de US$ 0,17 por hora de sandbox padrão (cálculo meu), mais a API da Anthropic.
- **Cloudflare**: não roda o Claude Code. Um Worker (`src/index.ts`) pede ao modelo `claude-sonnet-4-5` um script Python ou JS e o executa no Cloudflare Sandbox (Durable Objects mais containers), com timeout de 30 s. O endpoint `/execute` não tem autenticação e responde com `Access-Control-Allow-Origin: *`. A chave da Anthropic do Worker fica como secret do Worker, fora do sandbox, e a documentação da Cloudflare (30/09/2026) diz que o container começa com `enableInternet: false`, então o "sem rede" do README coincide com o padrão da plataforma (o repositório não define a opção). Exige plano Workers Paid e Docker no desenvolvimento local. O `launcher.ts` envia só `{question}` ao Worker (padrão `localhost:8787`); se o Worker não responde, cai em silêncio (só um aviso) em `executeDirectly`, que roda o Agent SDK na sua máquina, fora de qualquer sandbox, com a chave recebida por argumento, e apenas devolve o código gerado.
- **Docker**: imagem `node:22-alpine` com git, bash, python3 e curl, Agent SDK global e usuário não-root (`sandboxuser`, UID 10001). O `docker run` só leva `--rm`, `-e ANTHROPIC_API_KEY=<valor>` e `-v output:/output`: faltam `--network`, `--read-only` e limites de recurso que o README afirma ("No Network", host "read-only", "Resource Limits"). `execute.js` usa `claude-sonnet-4-5` com `bypassPermissions` e `npx claude-code-templates@latest`. Só a pasta `output` é montada: gera código do zero, não trabalha no seu repositório. Custa só a API.
- **Studio (`--studio`)**: servidor local (`cli-tool/src/sandbox-server.js` e `sandbox-interface.html`, porta 3444, escuta em 127.0.0.1) com `/api/execute`, que roda o `claude` local ou o launcher E2B, lendo as chaves do `.env`. Tem CORS restrito à própria origem. Não li o servidor inteiro.
- **Cópia residual**: `cli-tool/.claude/sandbox/cloudflare` repete o componente (13 arquivos, `launcher.ts` de 14.020 bytes contra 15.512 do original), provavelmente commitada por engano.
- A documentação oficial (`sandbox-environments`) manda rodar `--dangerously-skip-permissions` em container, VM ou sandbox runtime e avisa que qualquer isolamento com saída de rede ainda pode vazar o que o agente lê. Além disso, a Cloudflare publica um tutorial próprio ("Build a coding agent runner") que roda o Claude Code num sandbox deles com o token no AI Gateway, fora do sandbox, e rede limitada ao gateway e ao github.com.

### Plugins e marketplace

- A raiz do repositório tem `.claude-plugin/` só com `skills/owasp-security`: sem `marketplace.json` (404 hoje) nem `plugin.json`. `claude plugin marketplace add davila7/claude-code-templates` deve falhar com "Marketplace file not found" (mensagem da página de troubleshooting; não executei).
- `cli-tool/components/.claude-plugin/marketplace.json` (2.889 bytes, commit único de 16/10/2025, PR #112) tem só a chave `agents` com oito agentes, sem `name`, `owner`, `plugins` nem `source`. O `claude plugin validate` aponta 3 erros (name, owner e plugins ausentes) e 1 aviso (`agents` desconhecido). A CLI não o lê.
- Não existe `--plugin`. `--plugins` abre um painel local (porta 3336) com marketplaces, plugins e permissões lidos de `~/.claude`. `--mod` copia um dos 39 mods (cada um com `plugin.json`) para `.claude/skills/<nome>`, que o Claude Code carrega como `<nome>@skills-dir` (nome documentado para plugins carregados de `.claude/skills/`).
- A aba Plugins vem de `scripts/generate_plugins_json.py`: lê o `.claude-plugin/marketplace.json` de 36 repositórios de terceiros via `gh api` e grava `dashboard/public/plugins.json` (último commit em 22/08/2026, PR #827; o script teve commits depois, #845 em 29/08 e #909 em 17/09, e REPOS já tem html2wp e curviate, que o JSON ainda não traz). São 34 coleções: 15 marketplaces com 1.312 plugins e 19 plugins únicos. Cada página mostra `/plugin marketplace add repo` e `/plugin install plugin@marketplace`. Roda à mão (nenhum workflow o chama; o CLAUDE.md do repositório diz "manual, offline step") e entra-se por PR.
- **Contraste com o kit**: o `marketplace.json` do Cesar tem `name`, `owner`, `renames`, nove plugins com `source` relativo, `category` e campos de componente (`skills`, `agents`, `outputStyles`, `hooks`), passa no `claude plugin validate` (2.1.289) e instala com `claude plugin marketplace add cesarschutz/claude-code-kit`. O kit não consta na lista do davila7.
- O catálogo de skills do aitmpl também traz três skills sobre fazer plugins (`plugin-forge`, `plugin-settings`, `plugin-structure`); o schema do `plugin-forge` cita `pluginRoot` na raiz do marketplace, enquanto a doc oficial o lista em `metadata.pluginRoot`.

### owasp-security

Skill de 13 arquivos em `.claude-plugin/skills/owasp-security`: `SKILL.md` (905 linhas), `README`, `skill.json`, `owasp-css-instructions.md` e 9 exemplos (vulnerável e corrigido). Cobre Top 10 2021, ASVS 5.0, MASVS 2.1.0, API Top 10 2023, K8s Top 10 2022 e "Agentic 2026". Veio do mfkocalar/OWASP-Security-Skills (MIT) pelo PR #665, em 06/07/2026. Não é plugin: sem `plugin.json`, e a doc oficial manda pôr tudo o que não é manifesto na raiz do plugin, fora de `.claude-plugin/`. Nenhuma das 890 skills do catálogo se chama owasp-security (três mencionam OWASP no texto); instala copiando para `~/.claude/skills`. O próprio `SKILL.md` admite que os códigos AG01 a AG10 são abreviações do guia, não oficiais, e só cinco são detalhados (AG01, AG02, AG03, AG06, AG09), embora o README prometa dez riscos.

## Categorias

| Categoria | Qtd | O que é |
| --- | --- | --- |
| loops/engineering | 13 | Construir, testar, revisar, documentar e manter o repositório. 10 `/loop` de 5 a 30 min, `repo-cleanup` (`/loop 7d`) e 2 `/goal` (completion-contract e goal-refiner). |
| loops/evaluation | 3 | A parada é uma avaliação: objeções até zerar, aprovação humana ou sequência de execuções verdes. |
| loops/operations | 2 | Changelog noturno e rotina noturna de PRs. |
| sandbox/e2b | 6 | Claude Code numa VM E2B pela CLI. |
| sandbox/cloudflare | 13 | Worker que gera e executa código no Cloudflare Sandbox. |
| sandbox/docker | 5 | Contêiner local com o Agent SDK. |
| sandbox/README.md | 1 | Visão geral e comparação, defasada em relação à CLI. |
| sandbox: cópia residual | 13 | Instalação do componente Cloudflare commitada em `cli-tool/.claude/sandbox/cloudflare`. |
| sandbox: Studio | 2 | `sandbox-server.js` e `sandbox-interface.html` (`--studio`), mais cópia em `docs/`. |
| plugins: `.claude-plugin/` da raiz | 13 | Só a skill owasp-security. |
| plugins: `components/.claude-plugin/marketplace.json` | 1 | Oito agentes; não é marketplace válido. |
| plugins: catálogo da aba Plugins | 8 | Gerador e seu teste, `dashboard/public/plugins.json` (a lista `components/plugins.json` está vazia), páginas Astro (`index`, `[slug]`) e componentes `MarketplacePluginsList.tsx` e `PluginsGrid.tsx`. |
| plugins: `--plugins` (painel) | 4 | `plugin-dashboard.js` (Express, porta 3336) e 3 arquivos web (`app.js`, `index.html`, `styles.css`), mais a opção em `create-claude-config.js`. |
| plugins: mods como plugins locais | 39 | `cli-tool/components/mods`, instalados em `.claude/skills`. |

### Exemplos

**Loops**

- `loops/engineering/build-test-fix-loop.md`: `/loop 10m`, implementa o próximo item, roda testes, typecheck e lint e devolve cada falha; para com tudo verde. O hook `test-runner` citado não devolve nada.
- `loops/engineering/anti-spin-build-loop.md`: `/loop 15m` contra um contrato verificável; para por falta de progresso, abordagem repetida, vai e volta ou orçamento. Melhor ideia do conjunto; o `scope-guard` citado não protege os testes.
- `loops/engineering/completion-contract-loop.md`: `/goal` que escreve o contrato de "pronto" com a evidência de cada requisito. Casa direto com o `/goal` oficial.
- `loops/engineering/five-minute-maintainer-loop.md`: `/loop 5m`, uma melhoria pequena e verificada por tick, um commit por mudança.
- `loops/evaluation/quality-streak-loop.md`: `/loop 20m`, corrige até passar N vezes seguidas (padrão 5). Boa técnica contra teste instável.
- `loops/evaluation/devils-advocate-loop.md`: `/loop 15m`, ataca um design até cada objeção ser resolvida ou aceita com justificativa.
- `loops/evaluation/human-approval-loop.md`: pausa pedindo aprovar/revisar/pular antes de entregar; o portão não existe de fato (`plan-gate` e Telegram não fazem isso).
- `loops/operations/overnight-pr-routine-loop.md`: `/schedule` diário que cuida dos PRs abertos; único que usa a ferramenta certa para rodar sem sessão aberta.
- `loops/operations/nightly-changelog-loop.md`: `/loop 24h`; como `/loop` exige sessão aberta e expira em 7 dias, deveria ser rotina.

**Sandbox**

- `sandbox/e2b/e2b-launcher.py`: cria o sandbox, injeta a chave, roda `claude -p --dangerously-skip-permissions`, baixa até 50 arquivos e mata o sandbox.
- `sandbox/cloudflare/src/index.ts`: GET `/`, GET `/health` e POST `/execute` (pergunta vira script, executado com timeout de 30 s; sem autenticação e com CORS aberto).
- `sandbox/cloudflare/launcher.ts`: cliente de linha de comando com fallback local silencioso (`executeDirectly`).
- `sandbox/docker/docker-launcher.js` e `execute.js`: constrói a imagem `claude-sandbox`, roda o `docker run` e, dentro do contêiner, chama `query()` do Agent SDK com `bypassPermissions`.
- `sandbox/cloudflare/wrangler.toml`: Durable Object `Sandbox`, migração v1, `cpu_ms = 50`, nota sobre Workers Paid.

**Plugins**

- `scripts/generate_plugins_json.py`: lista REPOS (36), usa `gh api`, classifica marketplace ou plugin, conta componentes e grava `plugins.json`.
- `dashboard/public/plugins.json`: 34 entradas com `slug`, `author`, `stars`, `type`, `tags`, `contains`, `highlights` e, nos marketplaces, `plugins_list`.
- `dashboard/src/pages/plugins/[slug].astro`: página de cada coleção, com `/plugin marketplace add` e `/plugin install`.
- `cli-tool/src/plugin-dashboard.js`: painel com `/api/marketplaces`, `/api/plugins`, `/api/permissions` e `/api/summary`; `app.listen(3336)` sem host, CORS `*`, sem autenticação, devolve o `config` de MCPs e hooks lidos de `~/.claude`.
- `cli-tool/components/mods/security/secret-redactor/.claude-plugin/plugin.json`: mod 0.2.0 que redige chaves, tokens e JWTs dos resultados de ferramentas; tem `userConfig` de padrões extras.
- `.claude-plugin/skills/owasp-security/SKILL.md`: 905 linhas, seis seções, cada uma com detecção, mitigação e checklist.

## O que vale aproveitar

1. **Molde de documento de loop** (esforço baixo): frontmatter mais seções fixas obriga a escrever objetivo, agenda, parada, orçamento e exemplo antes do prompt. É convenção do davila7: `.claude/loops/` não é lido pelo Claude Code. Reescrever em português.
2. **Reescrever 5 ou 6 loops sobre `/goal` e `/schedule`, em português e para Java/Maven** (médio): completion-contract, goal-refiner, anti-spin, quality-streak (`mvn test` N vezes seguidas), builder-reviewer com o agente `critico` do kit e overnight-pr-routine como rotina. Loop não é tipo de componente de plugin: entregar como skills sem `disable-model-invocation` (o `/loop` só dispara skills que o Claude pode invocar) ou como documento; `.claude/loop.md` é por projeto ou usuário e não vem por plugin. Trocar `scope-guard`, `plan-gate`, `test-runner` e `gemini-review` por verificações reais.
3. **Receita de parada para `/goal`** (baixo): um estado final mensurável, o comando que prova, o que não pode mudar e um teto de turnos. É o que a doc oficial recomenda e resume o melhor dos loops. O avaliador só vê a conversa, e `/goal` some com `disableAllHooks` ou `allowManagedHooksOnly`.
4. **Lição de hooks para o post** (baixo): hook que "avisa" com `echo` e `exit 0` não é visto por ninguém; para avisar o Claude é preciso `exit 2` (PostToolUse) ou JSON, e só UserPromptSubmit, UserPromptExpansion, SessionStart e PostModelSwitch injetam stdout puro no contexto. Os hooks `scope-guard`, `plan-gate` e `test-runner` do davila7 servem de contraexemplo.
5. **Bloco no post de mods sobre automação (`/loop`, `/goal`, `/schedule`, tarefas do Desktop) e isolamento (`/sandbox` e ambientes)** (baixo): limites reais (sessão aberta, expiração de 7 dias, rotinas na nuvem com mínimo de 1 h). Confira antes se o post já cita esses recursos.
6. **Pedir a inclusão do kit na aba Plugins do aitmpl** (baixo): uma linha em REPOS do gerador, por PR (outros entraram assim: #827, #845, #909). Decisão sua; depende de regeneração manual e o site não audita segurança.
7. **Enriquecer as entradas do `marketplace.json` do kit** (baixo): hoje usam `name`, `source`, `description`, `category` e campos de componente; a referência oficial aceita também `tags`, `version`, `author`, `homepage`, `license` e `dependencies` (e `relevance`, para o Claude Code sugerir o plugin). `version` no `plugin.json` vence a do marketplace; rode `claude plugin validate`. O campo `metadata` o Claude Code não lê.
8. **Guia de sandbox seguro com as opções oficiais, sem copiar os launchers** (médio): `/sandbox`, sandbox runtime, dev container com firewall, microVM (Docker Sandboxes) e sessão na nuvem, mais o tutorial da Cloudflare. Se ilustrar com Docker, escrever variante com `--network` restrito, `--read-only`, `--cap-drop` e limites de memória.
9. **Skill de revisão de segurança em português para Spring, Kubernetes e AWS, inspirada no owasp-security** (médio): a estrutura (SKILL.md, exemplos vulnerável contra corrigido, gatilhos) é boa; faltam exemplos em Java, que o upstream deixa no roadmap (v1.1.0). Manter a licença MIT e dar crédito ao mfkocalar; dividir o SKILL.md em `references/`. A Anthropic já tem `security-guidance`, Claude Security e o comando `/security-review`.
10. **Usar `plugins.json` como censo de marketplaces para o post** (baixo): everything-claude-code 228.605 estrelas, claude-mem 86.873, claude-plugins-official 31.988 (255 plugins); loops reais empacotados: hamelsmu/claude-review-loop (revisão com Codex) e zscole/adversarial-spec (debate entre LLMs). Números do arquivo de 22/08/2026.
11. **Trocar o `components:` dos loops por `dependencies` do plugin** (médio): um pacote "loop" do kit poderia instalar `critico` e `pesquisador` sozinho. Dependências entre marketplaces exigem `allowCrossMarketplaceDependenciesOn`.
12. **Painel `--plugins`: não adotar** (baixo): compare com a aba Inventário do csr-cockpit, que faz o mesmo dentro do Claude Code, sem servidor HTTP.

## Cuidados

- Nada foi executado do repositório pesquisado. O erro esperado de `claude plugin marketplace add davila7/claude-code-templates` (Marketplace file not found) vem da documentação de troubleshooting, e a ausência do arquivo na raiz foi confirmada em 04/10/2026.
- Textos lidos que se dirigem a modelos, tratados como dados e não seguidos: `owasp-css-instructions.md`, o `SKILL.md` do owasp-security, as linhas "Run it" dos 18 loops e o "enhanced prompt" do `e2b-launcher.py`. As páginas web lidas não continham ordens dirigidas a mim.
- Números: 32.375 estrelas (página do GitHub) contra "30.8k" no site; `plugins.json` é de 22/08/2026 (estrelas e coleções dessa data). Downloads dos loops vêm de `loops.json`. `sandbox.json` lista só arquivos soltos com `type` "sandbo" e 0 downloads: o site não trata sandbox como componente instalável.
- Hooks dos loops: `scope-guard`, `plan-gate` e `test-runner` não avisam nem bloqueiam na prática (veja Explicação), e `CLAUDE_TOOL_FILE_PATH` e `CLAUDE_TOOL_INPUT_FILE` não existem na referência oficial de hooks. Não executei os hooks.
- `/loop` é da sessão: dispara só com o Claude aberto e ocioso. Por inferência, `/loop 7d` (repo-cleanup) rodaria cerca de uma vez antes de expirar. Loops autônomos podem abrir PR, comitar e apagar branch; nenhum tem teto de gasto imposto pelo `/loop`.
- `/schedule` está em pesquisa prévia, exige login claude.ai e usa conectores sem pedir permissão. Dados lidos hoje em code.claude.com.
- Sandbox, documentação contra código: o README do Docker afirma "No Network", host "read-only" e limites de recurso, mas o `docker run` só tem `--rm`, a chave e o volume. O README raiz diz que as chaves "never leave your local environment", mas a `ANTHROPIC_API_KEY` entra no sandbox E2B e no contêiner Docker. O README raiz marca Docker como "Future" enquanto a CLI já o aceita.
- Chaves: no E2B, a CLI repassa as duas chaves ao launcher como argumento do processo (visíveis no `ps`); no Cloudflare, a chave da Anthropic também vai como argumento (e só é usada no fallback local); no Docker, a chave vai por variável ao launcher e depois em `docker run -e ANTHROPIC_API_KEY=<valor>`, também visível. As flags `--e2b-api-key` e `--anthropic-api-key` ficam no histórico do shell, e o README as chama de "recommended".
- Dentro do sandbox roda `npx claude-code-templates@latest` sem versão fixa, com `--dangerously-skip-permissions` (E2B) ou `bypassPermissions` (Docker). Sem restrição de rede no código e com a chave dentro, uma injeção de prompt pode exfiltrar a chave (a doc oficial avisa o mesmo).
- Cloudflare: o `/execute` não tem autenticação e responde com CORS `*`; quem tiver a URL gasta seus créditos da API e executa código gerado no seu sandbox. `index.ts` importa `@anthropic-ai/sdk`, que não está nas dependências do `package.json` (compilação não verificada); o `repository` do `package.json` aponta para anthropics/claude-code-templates (organização errada); o modelo está fixo em `claude-sonnet-4-5`.
- Custos: US$ 5/mês e cerca de US$ 0,0006 por requisição são números do README da Cloudflare, não verificados; a página oficial da Cloudflare não informa as tarifas. Preços do E2B vieram da página de preços hoje e mudam.
- Painel `--plugins`: escuta em todas as interfaces (sem host no `listen`), sem autenticação, com `Access-Control-Allow-Origin: *`, e `/api/permissions` devolve o `config` de MCPs e hooks, que pode conter tokens. Contraste: o servidor do Studio escuta só em 127.0.0.1 e restringe a origem.
- Telemetria: a CLI envia ao aitmpl.com, ao instalar loops e mods, o tipo e o nome do componente, versão do Node, plataforma e arquitetura; `--sandbox` e `--plugins` enviam o comando usado (e, no sandbox, o provedor e se há prompt). Desliga com `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`.
- owasp-security: não é plugin e não está no catálogo; promessas do `skill.json` (ativação em menos de 500 ms, modelos recomendados) não verificadas; os exemplos são código vulnerável de propósito (não executar; scanners podem alertar). O upstream (2 estrelas, MIT) hoje se descreve como plugin com duas skills; o que está no davila7 é o snapshot v1.0.0 de 14/03/2026. Top 10 2021: não verificado se há edição mais nova.
- Limites desta pesquisa: a API do GitHub chegou ao limite de requisições, então parte das conferências usou o conteúdo bruto dos arquivos e as páginas e feeds públicos do GitHub (datas de commit pelo feed `.atom`). Não li a página oficial `plugins/dependencies`.

## Fontes

- Repositório (arquivos lidos): `cli-tool/components/loops/**/*.md` (18); `cli-tool/components/sandbox/README.md`; `sandbox/e2b/*`; `sandbox/cloudflare/*` (inclui `src/index.ts`, `launcher.ts`, `wrangler.toml`, `package.json`); `sandbox/docker/*`; `cli-tool/.claude/sandbox/cloudflare` (lista e tamanhos); `cli-tool/components/.claude-plugin/marketplace.json`; `.claude-plugin/skills/owasp-security/*`; `cli-tool/components/hooks/quality-gates/scope-guard.{json,sh}` e `plan-gate.{json,sh}`; `hooks/testing/test-runner.json`; `hooks/automation/telegram-notifications.json`; `commands/git-workflow/gemini-review.md`; `agents/expert-advisors/critical-thinking.md`; `skills/development/plugin-forge`; `mods/security/secret-redactor/.claude-plugin/plugin.json`; `cli-tool/bin/create-claude-config.js`; `cli-tool/src/index.js`, `plugin-dashboard.js`, `sandbox-server.js`, `tracking-service.js`; `scripts/generate_plugins_json.py`; `dashboard/public/plugins.json`, `components/loops.json`, `components/sandbox.json`, `components/skills.json`; `dashboard/src/pages/plugins/[slug].astro`; `.github/workflows` (19 arquivos); `CLAUDE.md`; `tree.json` (contagens).
- GitHub (páginas e feeds, sem API): https://github.com/davila7/claude-code-templates (estrelas, licença); feeds `.atom` de commits dos arquivos citados; https://github.com/davila7/claude-code-templates/pull/665; https://github.com/mfkocalar/OWASP-Security-Skills.
- Site: https://www.aitmpl.com/plugins; https://www.aitmpl.com/loops.
- Documentação oficial do Claude Code (lida hoje): https://code.claude.com/docs/en/scheduled-tasks; /commands; /goal; /routines; /sandbox-environments; /hooks; /claude-directory; /plugins-reference; /plugins/marketplace-reference; /plugins/troubleshooting; /llms.txt.
- Terceiros: https://e2b.dev/pricing; https://developers.cloudflare.com/sandbox/ (incluindo concepts/security e get-started/build-a-coding-agent-runner).
- Kit: `/Users/cesar.schutz/Downloads/claude-code-kit/.claude-plugin/marketplace.json`, `README.md` e `plugins/csr-cockpit/.claude-plugin/plugin.json`; `claude plugin validate` (2.1.289) sobre o kit e sobre uma cópia do `marketplace.json` de `cli-tool/components/.claude-plugin`.

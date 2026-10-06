# 04 · O tipo COMANDOS (cli-tool/components/commands, 26 categorias)

### O que é e o que mudou

A pasta `cli-tool/components/commands` do projeto davila7/claude-code-templates guarda 348 arquivos Markdown em 25 subpastas de primeiro nível (google-workspace ainda tem duas subpastas, recipes e personas). Cada arquivo é um comando personalizado: um prompt reutilizável chamado com `/nome`. O repositório tem 32.375 estrelas, 3.702 forks e licença MIT (números informados pela API do GitHub em 04/10/2026).

Os números do tipo variam conforme a fonte: "200+" no título de aitmpl.com/commands, "225+" em docs.aitmpl.com, 288 itens em `dashboard/public/components/commands.json` e 348 arquivos na pasta. Os 60 arquivos de google-workspace/recipes e personas não estão no catálogo.

A documentação oficial (code.claude.com/docs/en/skills, lida hoje) diz que os comandos foram incorporados às skills: `.claude/commands/deploy.md` e `.claude/skills/deploy/SKILL.md` criam `/deploy` e funcionam igual. Os arquivos antigos continuam valendo, mas a doc recomenda skill para trabalho novo, e se os dois existem a skill vence. Para este tipo isso significa:

- O formato é o de uma skill sem pasta. A doc diz que o arquivo em `.claude/commands/` aceita os mesmos campos de frontmatter, exceto `name` e `paths`. Valem, entre outros: description, when_to_use, argument-hint, arguments, disable-model-invocation, user-invocable, allowed-tools, disallowed-tools, model, effort, context (fork), agent, hooks e shell. O nome vem do nome do arquivo.
- Por padrão o Claude pode acionar o comando sozinho pela description (disable-model-invocation é falso por padrão). As descriptions entram no contexto a cada turno, com orçamento de 1% da janela e teto de 1.536 caracteres por entrada.
- Plugins continuam aceitando `commands` no plugin.json: um caminho, uma lista ou um mapa em que cada item tem `source` (arquivo .md) ou `content` (texto inline), mais description, argumentHint, model e allowedTools. O nome vira `/plugin:comando`.
- Subpastas de `.claude/commands/` viram `/pasta:nome`. O guia do próprio projeto, `cli-tool/docs_to_claude/COMMANDS_GUIDE.md`, ainda mostra "(project:frontend)" e a ferramenta SlashCommand, que a documentação atual não lista (hoje a ferramenta é a `Skill`). Ou seja, está defasado.

### Formato

Frontmatter YAML opcional e corpo em Markdown. Os 348 arquivos usam só quatro campos: description (295), allowed-tools (293), argument-hint (285) e model (1, em gemini-review). 53 arquivos não têm frontmatter (analysis 1, git-workflow 6, orchestration 12, performance 2, svelte 15, utilities 17); nesses a doc manda usar a primeira linha do texto como description.

No corpo aparecem `$ARGUMENTS` (296 arquivos), `$1` (poucos), a injeção `!` com comando entre crases (133 arquivos) e `@arquivo` (a doc atual de skills não descreve a expansão de `@` em corpo de comando; não verificado). Se nenhum `$ARGUMENTS` receber o argumento, o Claude Code acrescenta `ARGUMENTS: <valor>` ao fim.

Como a injeção `!` funciona segundo a doc:

- Roda antes de o prompt chegar ao Claude e a saída substitui o marcador. Usa a ferramenta Bash, com timeout padrão de 2 minutos.
- Nunca pergunta permissão durante a renderização, mas cada comando passa pelas regras de permissão. Regra deny que case aborta a invocação. Fora do modo auto, qualquer comando que não resulte em "permitir" (regra ask, comando sem regra) também aborta. Para evitar isso, pré-aprove em `allowed-tools`; regras deny e ask continuam valendo por cima. Comandos somente leitura reconhecidos pelo Claude Code (ls, cat, formas de leitura do git etc.) passam sem regra.
- Um comando que termina com saída diferente de zero aborta a invocação inteira. A exceção é a saída 1 de grep, rg, egrep, fgrep, find, diff, test, `[`, git diff e git grep, tratada como resultado normal. Saída 2 ou maior falha mesmo nesses.
- A configuração `disableSkillShellExecution` desliga a injeção.

No acervo, 115 dos 133 arquivos com `!` têm `Bash` sem escopo em allowed-tools, então qualquer comando injetado fica pré-aprovado. Outros 14 têm lista com escopo e 4 têm allowed-tools sem Bash. Pela leitura do texto (não executei), `git/finish.md` injeta `npm test`, que `Bash(git:*)` não cobre, e `team/sprint-planning.md` injeta `gh issue list` sem ter Bash; esses dois tendem a abortar, a menos que suas regras de permissão os liberem.

### Instalação

`npx claude-code-templates@latest --command categoria/nome` (aceita vários separados por vírgula; `-d` escolhe o diretório). Em `cli-tool/src/index.js`, `--command` é desviado na linha 146 para `installMultipleComponents` (linha 1917), que chama `installIndividualCommand` (linhas 551-620). Essa função baixa o arquivo de `raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/commands/<categoria>/<nome>.md` e grava em `.claude/commands/<nome>.md` do diretório alvo, descartando a categoria. Não há versão fixa nem verificação de hash.

Pela leitura do código (não executei a CLI):

- Há colisão de nomes: `commit` existe em git-workflow e em orchestration, `release` em git e em project-management; na instalação plana um sobrescreve o outro.
- Um nome com duas barras, como o das recipes, cairia no segmento errado (o código usa só os dois primeiros segmentos).
- `--dry-run` só é lido no fluxo de modelos (linhas 411 e 471), depois do desvio de `--command`; portanto não se pode contar com ele para simular a instalação de um comando.

Telemetria: cada instalação faz dois envios a www.aitmpl.com. O primeiro, em `/api/track-download-supabase` (cli-tool/src/tracking-service.js), leva tipo, nome, caminho (o diretório de destino relativo ao diretório atual, ou o nome do componente quando é o mesmo diretório), categoria e versão da CLI. O segundo, em `/api/track-installation-outcome`, leva tipo, nome, resultado, tipo e mensagem de erro, duração, versão da CLI, versão do Node, plataforma, arquitetura e um identificador de lote. Para desligar: `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`.

Cada página do site (por exemplo aitmpl.com/component/command/git-workflow/commit) mostra o texto do comando e a linha de instalação.

### O que há dentro

- Checklists genéricos de cerca de 2 KB que dizem o quê e não o como: setup, security, simulation, sync, team e os Supabase de database.
- Manuais longos de 10 a 35 KB com scripts embutidos: deployment (deployment-monitoring 35 KB) e nextjs-vercel.
- Skills e agentes adaptados: 49 arquivos apontam para arquivos de apoio que a instalação de um único .md não leva (46 de google-workspace, azure/appinsights-instrumentation, design/web-design-reviewer e project-management/github-issues).
- Conjuntos coerentes: git (Git Flow), os quatro worktree-* e doordash.
- Mais baixados segundo o catálogo JSON (números informados pelo catálogo, data desconhecida): generate-tests (12.070), ultra-think (8.280), create-architecture-documentation (6.049), code-review (5.449). Total somado: 146.770.

### O que é bom

- Cobertura ampla e boa vitrine de ideias.
- `git-workflow/commit.md` tem allowed-tools que cobrem exatamente o que a injeção usa (`Bash(git add:*)`, status, commit, diff, log), `argument-hint` com opções e contexto injetado por `!`. Os cinco `git/*.md` também usam `!` (quatro têm `argument-hint`), mas com `Bash(git:*)`, que libera qualquer subcomando git.
- `testing/regression-triage.md` (adicionado em 15/09/2026) é o melhor padrão do acervo: exige árvore limpa, limita as ferramentas a Read, Glob, Grep, `Bash(git:*)` e `Bash(npm test:*)` e similares, manda tratar `$ARGUMENTS` como descrição e não como shell, usa bisect com script que distingue falha real de falha de ambiente (código 125) e traz Safety Notes. O frontmatter também é YAML válido em parser estrito. Ressalva: `Bash(git:*)` continua amplo, e a proibição de comandos destrutivos é só texto.
- `testing/flaky-test-triage.md` (17/09/2026) tem bom conteúdo: árvore limpa, 20 repetições, taxonomia da causa (tempo, ordem, relógio, porta), 50 execuções seguidas para certificar, e regras para não aumentar sleep nem enfraquecer asserts. Mas libera `Read, Glob, Grep, Edit, Write, Bash` com Bash sem escopo.
- `git-workflow/worktree-cleanup.md` tem `--dry-run`, tabela de status, confirmação por AskUserQuestion, `git branch -d` e nunca força a remoção de worktree sujo. Ressalva: aceita `--force-all`, que usa `-D` depois de confirmação explícita, e pré-aprova `Bash(git:*)` e `Bash(rm:*)`.
- A diretriz do projeto (docs.aitmpl.com/contributing/component-guidelines) manda restringir allowed-tools (`Bash(git add:*)` bom, `Bash` solto ruim).

### O que preocupa

- 250 dos 293 arquivos com allowed-tools liberam `Bash` sem restrição (107 deles são os arquivos gerados de google-workspace; fora dessa pasta são 143 de 186), o que a própria diretriz chama de amplo demais. Nenhum dos 348 usa disable-model-invocation, nem os que fazem merge, push, deploy e rollback.
- YAML: num parser estrito (Ruby Psych), 200 dos 295 frontmatters falham, 199 por `argument-hint: [a] | b` e 42 por `description` com dois-pontos. O validador do próprio projeto (js-yaml) acusou YAML inválido em 151 dos 216 comandos do relatório de 20/12/2025. O Claude Code 2.1.289 instalado nesta máquina tem uma etapa de reparo: se o parse falha, ele coloca aspas em valores com caracteres especiais (`{}[]*&#!|>%@` e crase, ou ": ") e tenta de novo. Reimplementei essa regra a partir do código do binário (lido com strings, sem executar o Claude Code sobre estes arquivos) e os 200 passam a ser lidos. Para o Claude Code o risco é baixo; permanece para outras ferramentas e versões. Se o reparo também falhar, a doc diz que o comando carrega sem campos, e allowed-tools e description somem. Em `git-workflow/commit`, `git/finish`, `utilities/ultra-think` e `utilities/cleanup-cache` o parser estrito falha; em regression-triage, flaky-test-triage e worktree-cleanup não.
- Destrutivos: `utilities/cleanup-cache` (`docker system prune -af --volumes` no modo `--maximum`, vários `rm -rf`, `Bash(rm:*)` e `Bash(find:*)` pré-aprovados), `utilities/clean-branches` (`git branch -D` por data fixa, `push --delete` em lote), `git/finish` (merge, tag, push na main, apaga branch remota) e `deployment/rollback-deploy` (kubectl, sudo, `ln -sfn`).
- `!` que roda na invocação por causa do Bash livre: curl para api.example.com (domínio reservado, inofensivo e inútil) e para httpbin.org (terceiro), kubectl, `npm test`, `npm run build`.
- Segredos: 17 arquivos citam arquivos .env, e 9 usam `@.env...` no contexto injetado (husky, nextjs-api-tester, vercel-env-sync, vercel-deploy-optimize, vercel-edge-function, add-authentication-system, security-audit, secrets-scanner, security-hardening). Se o `@` for expandido, o conteúdo do .env iria para o modelo (não verificado, ver Formato).
- Portabilidade: `date -d` (team/standup-report, na injeção), `head -n -1` (git/finish) e `stat -c` (team/memory-spring-cleaning) são GNU; testei os três neste macOS e todos falham com saída 1. Como `date` não está na lista de exceções, o `date -d` do standup-report aborta a invocação. `clean-branches` também usa `date -d`, mas dentro de um bloco de instruções, então não aborta. `documentation/docs-maintenance` usa `stat -f` com a sintaxe BSD.
- Defeitos: `deployment/rollback-deploy` tem quebras de linha escritas como barra-n literal numa única linha (linha 144, do passo 10 em diante); README e docs citam comandos que não existem (optimize-bundle, check-security, setup-ci, setup-testing, conventional-commits, migration-create).
- Java: só 18 arquivos citam o ecossistema Java, em listas de exemplos; nenhum foi escrito para Spring.
- Proveniência: 107 arquivos trazem aviso Apache-2.0 do Google, 3 creditam IndyDevDan (all-tools, git-status, prime), 1 credita Thomas Landgraf (directory-deep-dive) e os demais não declaram origem. O README cita awesome-claude-code (CC0, 21 comandos) sem dizer quais.
- Nomes que colidem com comandos nativos: resume, status e code-review (e o alias nativo /review). A doc diz que uma skill local substitui o comando nativo em terminal local; para arquivos de `.claude/commands/` o efeito é provável, mas não verificado.

### Como avaliar antes de instalar

Cesar, leia o arquivo inteiro (página do site ou URL raw) antes de instalar. Não conte com `--dry-run` para simular. Instale um por vez, de preferência num diretório descartável (`-d`), e copie para o seu repositório em vez de depender da main. Ponha `disable-model-invocation: true` em tudo que tem efeito colateral, troque `Bash` por `Bash(git status:*)` e semelhantes, e use aspas em `argument-hint` e `description`. Depois confira o custo com `/doctor` e `/skill-doctor`, e o carregamento com `claude --debug` (mostra erro de parse do frontmatter).

## Categorias (25 subpastas, 348 arquivos)

Panorama por categoria (contagens refeitas sobre os 348 arquivos; "YAML estrito" = falha em Ruby Psych; downloads são números informados pelo catálogo commands.json):

| Categoria | Arquivos | Sem frontmatter | YAML estrito falha | allowed-tools com Bash livre | Downloads |
| :- | -: | -: | -: | -: | -: |
| analysis | 1 | 1 | 0 | 0 | 97 |
| automation | 5 | 0 | 3 | 5 | 3.418 |
| azure | 2 | 0 | 0 | 1 | 165 |
| database | 9 | 0 | 8 | 9 | 7.973 |
| deployment | 11 | 0 | 11 | 11 | 5.644 |
| design | 1 | 0 | 0 | 1 | 578 |
| documentation | 10 | 0 | 9 | 10 | 15.606 |
| doordash | 5 | 0 | 0 | 0 | 86 |
| game-development | 5 | 0 | 5 | 5 | 1.166 |
| git | 5 | 0 | 1 | 0 | 8.197 |
| git-workflow | 14 | 6 | 4 | 0 | 7.982 |
| google-workspace | 107 | 0 | 47 | 107 | 3.074 (47 itens) |
| marketing | 5 | 0 | 0 | 5 | 861 |
| nextjs-vercel | 10 | 0 | 10 | 7 | 4.830 |
| orchestration | 15 | 12 | 0 | 2 | 4.992 |
| performance | 10 | 2 | 8 | 8 | 4.675 |
| project-management | 20 | 0 | 18 | 16 | 10.966 |
| security | 6 | 0 | 6 | 6 | 3.871 |
| setup | 15 | 0 | 14 | 15 | 6.129 |
| simulation | 10 | 0 | 10 | 0 | 1.904 |
| svelte | 16 | 15 | 1 | 0 | 1.952 |
| sync | 14 | 0 | 14 | 14 | 1.783 |
| team | 14 | 0 | 14 | 11 | 6.612 |
| testing | 17 | 0 | 14 | 16 | 16.677 |
| utilities | 21 | 17 | 3 | 1 | 27.532 |
| Total | 348 | 53 | 200 | 250 | 146.770 |

### analysis (1 arquivo)

Auditoria de risco da cadeia de suprimentos de software (CVEs, lockfiles, SBOM, licenças, typosquatting) para JavaScript, Python, Go, Rust, Java, Ruby e Docker. Adicionado em 26/03/2026. Bem estruturado (Purpose, Usage, Implementation, Examples), sem frontmatter, sem allowed-tools e sem `!`. Para Java cita dependency-check, Snyk e plugin OWASP e detecta pom.xml, sem mencionar Maven ou Gradle.

- `supply-chain-audit` (`cli-tool/components/commands/analysis/supply-chain-audit.md`): detecta o gerenciador de pacotes, inventaria dependências, classifica achados de CRITICAL a LOW e fecha com plano "Fix now / Fix this sprint / Monitor / Nice to have".

### automation (5 arquivos)

Automação de CI e fluxos: rodar GitHub Actions localmente, checagens de pré-commit, pipelines, orquestração de tarefas e um comando de faturas húngaras. Mistura utilidade real com peças de nicho. `act` e `husky` mexem com .env; `workflow-orchestrator` injeta `crontab -l` e `ps aux` na invocação.

- `act` (`automation/act.md`): executa workflows do GitHub Actions localmente; usa `--dry-run` e `--secret-file .env`.
- `husky` (`automation/husky.md`): roda lint, build e typecheck com pnpm e corrige erros até o repositório ficar verde; cita `@.env` no contexto.
- `ci-pipeline` (`automation/ci-pipeline.md`): cria e gerencia pipelines de GitHub Actions com múltiplos ambientes; usa `gh run list` na injeção.
- `szamlazz` (`automation/szamlazz.md`): emite, cancela e baixa faturas húngaras pela API szamlazz.hu; descreve o plugin de terceiros socialpro-szamlazz, cujos scripts não vêm no arquivo.

### azure (2 arquivos)

Dois itens adaptados de agente e de skill: escolher a função (role) de menor privilégio e instrumentar um app com Application Insights. Origem não declarada nos arquivos. Os nomes de ferramenta em allowed-tools do primeiro (Azure MCP/documentation e similares) fogem do padrão `mcp__servidor__ferramenta`, então provavelmente não casam com nada (não verificado). O segundo aponta para references/, examples/ e scripts/ que não são instalados.

- `azure-role-selector` (`azure/azure-role-selector.md`): orienta qual função Azure atribuir a uma identidade com menor privilégio e gera o CLI e o snippet Bicep.
- `appinsights-instrumentation` (`azure/appinsights-instrumentation.md`): guia a instrumentação de apps ASP.NET Core, Node.js ou Python para enviar telemetria ao App Insights; skill adaptada, com links relativos quebrados.

### database (9 arquivos)

Oito comandos Supabase (backup, explorar dados, migrações, performance, realtime, schema, segurança, tipos) e um para views semânticas do Snowflake. Os Supabase seguem um molde de cerca de 2,3 KB, com linhas de contexto que descrevem em vez de executar e que citam um MCP do Supabase que não vem junto. Operam em banco real (restore, aplicar migração) e têm só uma linha de "Safety Measures".

- `supabase-migration-assistant` (`database/supabase-migration-assistant.md`): gera migrações SQL e tipos TypeScript, testa e aplica, com plano de rollback.
- `supabase-backup-manager` (`database/supabase-backup-manager.md`): cria, agenda, valida e restaura backups do banco Supabase (flags `--backup`, `--restore`, `--cleanup`).
- `snowflake-semanticview` (`database/snowflake-semanticview.md`): cria e valida semantic views do Snowflake com a CLI snow, usando um nome temporário `__tmp_validate` antes do DDL final.

### deployment (11 arquivos)

Release, hotfix, rollback, blue-green, Kubernetes, containerização, CI e changelog. Tem os maiores arquivos do tipo (deployment-monitoring 35 KB, blue-green-deployment 22 KB). Risco alto: todos liberam Bash inteiro; `!` com curl em api.example.com, kubectl e `npm test` roda na invocação; scripts citados (`./switch-to-blue.sh`, `./backup-database.sh`) não existem no repositório; rollback-deploy tem quebras de linha corrompidas a partir do passo 10.

- `rollback-deploy` (`deployment/rollback-deploy.md`): protocolo de rollback com decisão rollback x correção adiante, backup, `kubectl rollout undo`, `docker service rollback`, matriz de decisão e relatório de incidente.
- `setup-kubernetes-deployment` (`deployment/setup-kubernetes-deployment.md`): checklist de 10 etapas para manifests, probes, HPA, RBAC, Ingress e GitOps; molde de "o quê", sem YAML pronto.
- `containerize-application` (`deployment/containerize-application.md`): cria Dockerfile multi-stage, .dockerignore e docker-compose; detecta o runtime por package.json, pom.xml, go.mod.
- `prepare-release` (`deployment/prepare-release.md`): valida versão, testes e changelog antes de uma release; roda npm test, pytest ou go test na injeção de contexto.

### design (1 arquivo)

Revisão visual de sites (responsivo, acessibilidade, consistência) com correção no código-fonte. Skill adaptada de 10,5 KB, que exige automação de navegador e cita arquivos de apoio que não são instalados.

- `web-design-reviewer` (`design/web-design-reviewer.md`): inspeciona um site local ou remoto com captura de tela, aponta problemas de layout e corrige no código.

### documentation (10 arquivos)

Geração e manutenção de documentação: arquitetura (C4, arc42, ADR), API, onboarding, migração, troubleshooting, llms.txt. Molde de checklist com Write e Edit, risco baixo a médio. `docs-maintenance` usa `stat -f` (sintaxe BSD); `load-llms-txt` baixa por padrão um llms.txt de um repositório de terceiros (ethpandaops/xatu-data) e faz curl em httpbin.org a cada uso.

- `create-architecture-documentation` (`documentation/create-architecture-documentation.md`): gera documentação de arquitetura com C4, arc42, ADRs e PlantUML/Mermaid; terceiro mais baixado do catálogo.
- `doc-api` (`documentation/doc-api.md`): gera documentação de API REST, GraphQL ou gRPC a partir do código; cita Spring Boot na detecção.
- `docs-maintenance` (`documentation/docs-maintenance.md`): audita e atualiza a documentação (links, imagens, datas); description começa com "Use PROACTIVELY".
- `load-llms-txt` (`documentation/load-llms-txt.md`): carrega contexto externo de um llms.txt por curl ou WebFetch; conteúdo externo entra no contexto do modelo.

### doordash (5 arquivos)

Suíte de pedidos de comida pela CLI dd-cli (adicionada em 19/07/2026 junto com 5 skills e 4 hooks): almoço em grupo, orçamento, playbooks, perfil e relatório. Depende de dd-cli, de skills e de hooks que não vêm com o comando. Usa escopos como `Bash(dd-cli:*)` e nunca Bash solto, mas `doordash-budget` também libera `Bash(bash:*)` (qualquer script bash) e todos pré-aprovam Write e Edit. Envolve dinheiro real, o que a torna bom estudo de caso e inútil como instalação.

- `doordash-budget` (`doordash/doordash-budget.md`): mostra gastos x limites e edita a política `limits.json`; diz ser o único caminho sancionado porque o hook doordash-spend-guard bloqueia escrita por linha de comando (o hook não foi lido nesta frente); confirma o JSON final antes de gravar.
- `doordash-lunch` (`doordash/doordash-lunch.md`): monta um pedido de grupo, emite o checkout com divisão por pessoa e controla o rodízio de quem paga.
- `doordash-playbook` (`doordash/doordash-playbook.md`): lista, adiciona, remove e inspeciona pedidos salvos em `~/.claude/dd-cli/playbooks.json`.

### game-development (5 arquivos)

Cinco comandos de jogos (Unity, profiling, testes, assets, analytics). Todos com description "Use PROACTIVELY"; três têm injeções `grep -r ... .` que varrem o projeto inteiro. Nicho; irrelevante para backend.

- `unity-project-setup` (`game-development/unity-project-setup.md`): monta a estrutura de um projeto Unity com pacotes e configurações por plataforma.
- `game-performance-profiler` (`game-development/game-performance-profiler.md`): analisa gargalos de FPS, memória e renderização e recomenda otimizações.
- `game-testing-framework` (`game-development/game-testing-framework.md`): monta testes unitários, de integração e de performance para jogos.

### git (5 arquivos)

Conjunto Git Flow (feature, release, hotfix, finish, flow-status), com 1,5 a 1,8 mil downloads cada no catálogo. Usa `Bash(git:*)`, que libera qualquer subcomando git, inclusive push --force e reset --hard. `finish.md` faz merge, tag, push na main e apaga branches remotas, com texto de confirmação mas sem trava; usa `head -n -1`, que falha no macOS, e injeta `npm test`, que `Bash(git:*)` não cobre.

- `feature` (`git/feature.md`): cria uma branch feature/ a partir de develop, validando o nome e a árvore de trabalho.
- `finish` (`git/finish.md`): finaliza feature, release ou hotfix: merge --no-ff, tag, push e remoção das branches; aceita `--no-delete` e `--no-tag`.
- `hotfix` (`git/hotfix.md`): abre uma branch hotfix/ a partir da main e calcula a versão de patch seguinte.
- `flow-status` (`git/flow-status.md`): relatório do estado Git Flow: tipo de branch, sincronia, tags e alvos de merge.

### git-workflow (14 arquivos)

Commits, PRs, limpeza de branches, bisect, revisão e worktrees. A parte melhor são os quatro worktree-* (ferramentas com escopo, `--dry-run` no cleanup, `branch -d`), mas com prefixos do autor (claude-daniel/*) e, no worktree-init, Ghostty. Pontos fracos: pr-review manda implementar tudo "imediatamente"; commit.md ficou preso a pnpm e a exemplos de solc; gemini-review fixa o modelo claude-sonnet-4-5-20250929, de setembro de 2025; create-pull-request e create-worktrees não têm frontmatter.

- `commit` (`git-workflow/commit.md`): commit convencional com emoji; lê status, diff e log por `!`, roda lint/build/docs, sugere dividir em commits atômicos; 4.071 downloads no catálogo.
- `worktree-cleanup` (`git-workflow/worktree-cleanup.md`): remove worktrees e branches já mergeados, com `--dry-run`, confirmação por AskUserQuestion e `branch -d`; não força a remoção de worktree sujo, mas tem `--force-all`.
- `pr-review` (`git-workflow/pr-review.md`): revisão de PR em seis papéis (produto, dev, QA, segurança, DevOps, UX); exige que toda sugestão seja implementada na hora e comentada no GitHub.
- `git-bisect-helper` (`git-workflow/git-bisect-helper.md`): conduz uma sessão de git bisect para achar o commit que quebrou algo; permite `Bash(git bisect:*)` e também `Bash(npm:*)`, `yarn` e `pnpm`, o que equivale a rodar qualquer script do projeto.

### google-workspace (107 arquivos)

107 arquivos gerados a partir das skills da CLI gws do Google: 47 comandos gws-* (Gmail, Drive, Calendar, Sheets, Docs, Admin, Vault...), 50 recipes e 10 personas. Todos trazem aviso Apache-2.0 e a fonte. Só os 47 gws-* estão no catálogo do site. 46 citam `../gws-shared/SKILL.md`, que a instalação de um .md não leva. Todos liberam `Bash, Read, Write, Edit`. Várias operações são de escrita (enviar e-mail, subir arquivo, criar evento), protegidas só por um aviso para confirmar com o usuário. Irrelevante para o seu perfil.

- `gws-gmail-send` (`google-workspace/gws-gmail-send.md`): envia e-mail pela CLI gws (`gws gmail +send --to --subject --body`), com aviso de comando de escrita.
- `gws-shared` (`google-workspace/gws-shared.md`): referência de autenticação, flags globais e regras de segurança; também pede que agentes e usuários deem estrela no repositório do Google.
- `recipe-send-personalized-emails` (`google-workspace/recipes/recipe-send-personalized-emails.md`): lê uma planilha e envia um e-mail personalizado por linha, combinando gws sheets e gws gmail.
- `persona-exec-assistant` (`google-workspace/personas/persona-exec-assistant.md`): faz o Claude agir como assistente de executivo: agenda, triagem de caixa de entrada e preparação de reuniões.

### marketing (5 arquivos)

Transforma posts de blog em conteúdo para X, LinkedIn, Medium e Dev.to (feed RSS), com versões em inglês e japonês. Boa ideia para quem tem blog, mas publicar é ação pública: publisher-linkedin usa a API com token em .env via curl. Nomes citados com dois-pontos (`/publisher:x`) não batem com os arquivos (publisher-x).

- `publisher-x` (`marketing/publisher-x.md`): gera thread para X em três versões (thread, longa, curta) a partir de slug, arquivo, PDF ou URL.
- `publisher-linkedin` (`marketing/publisher-linkedin.md`): gera post de LinkedIn e cria rascunho pela API com mídia anexada; exige credenciais em .env.
- `publisher-devto` (`marketing/publisher-devto.md`): gera `public/rss-devto.xml` com todos os posts para sindicalização automática no Dev.to.
- `publisher-all` (`marketing/publisher-all.md`): roda os publicadores de X, LinkedIn, Medium e Dev.to em sequência e abre as prévias em abas do navegador.

### nextjs-vercel (10 arquivos)

Dez comandos de front-end Next.js e Vercel, entre 6 e 21 KB. Vários leem `.env.local`, `.env.production` e similares; vercel-env-sync empurra variáveis para a Vercel. Fora do foco de backend Java.

- `nextjs-scaffold` (`nextjs-vercel/nextjs-scaffold.md`): cria uma aplicação Next.js com TypeScript, Tailwind, App Router, ESLint e Prettier.
- `vercel-env-sync` (`nextjs-vercel/vercel-env-sync.md`): sincroniza variáveis de ambiente locais e da Vercel (`--pull`, `--push`, `--validate`, `--backup`); inclui vários arquivos .env no contexto com `@`.
- `nextjs-middleware-creator` (`nextjs-vercel/nextjs-middleware-creator.md`): cria middleware com autenticação, rate limit e rewrites; só permite Read, Write e Edit.
- `vercel-deploy-optimize` (`nextjs-vercel/vercel-deploy-optimize.md`): otimiza vercel.json e faz o deploy com monitoramento de performance.

### orchestration (15 arquivos)

Sistema de orquestração de tarefas em pastas (start, find, move, status, sync, archive, report, log, optimize, remove, resume...) mais feature-analyzer, feature-dev e feature-pipeline. Depende de agentes e skills que não vêm junto (task-orchestrator, feature-design-assistant, task_manager.py). Nomes genéricos (status, resume, commit) colidem com comandos nativos e com outros arquivos; cabeçalhos citam `/task-find` e `/orchestration/commit`, que não batem com os arquivos. feature-pipeline roda em "UNATTENDED MODE" sem perguntas.

- `start` (`orchestration/start.md`): inicia a orquestração com três agentes (task-orchestrator, task-decomposer, dependency-analyzer) e cria pastas de tarefas por data.
- `feature-dev` (`orchestration/feature-dev.md`): desenvolvimento guiado em fases: explorar o código, tirar dúvidas antes de projetar, implementar, testar e revisar com agentes em paralelo.
- `feature-pipeline` (`orchestration/feature-pipeline.md`): executa as tarefas de um documento de design em laço automático, marcando checkboxes pelo script `task_manager.py`.
- `commit` (`orchestration/commit.md`): gera commits alinhados às tarefas concluídas; colide com git-workflow/commit na instalação plana.

### performance (10 arquivos)

Auditoria e otimização de performance: banco, cache, API, build, bundle, memória, CDN e monitoramento. Oito dos dez só permitem Read, Bash, Grep e Glob (sem Write e Edit), então aconselham sem alterar arquivos, o que é prudente. performance-audit injeta `npm run build -- --analyze` e `time npm run build`. Útil como roteiro, genérico demais para Spring.

- `optimize-database-performance` (`performance/optimize-database-performance.md`): roteiro de planos de execução, índices, schema e pool de conexões (PostgreSQL, MySQL, MongoDB); sem ferramentas de escrita.
- `implement-caching-strategy` (`performance/implement-caching-strategy.md`): desenho de cache em camadas (navegador, CDN, aplicação, Redis, banco) com TTL e invalidação.
- `optimize-api-performance` (`performance/optimize-api-performance.md`): reduz latência e aumenta vazão de APIs REST, GraphQL ou gRPC.
- `performance-audit` (`performance/performance-audit.md`): auditoria de performance do código, banco e build, com ranking de otimizações.

### project-management (20 arquivos)

Gestão de projeto: PRD, JTBD, PRP, to-do, tickets Product as Code (pac-*), releases, issues do GitHub, Linear, NuGet, timelines. Mistura: github-issues é skill adaptada (links para references/templates.md que não vem junto) e nuget-manager tem description em estilo de skill; todo e pac-* usam prefixos antigos `/user:` e `/project:`; create-prd depende de uma pasta product-development/ própria; init-project e add-package seguem modelo web/Node.

- `create-prd` (`project-management/create-prd.md`): escreve um PRD a partir de product.md, feature.md e JTBD.md; sem Bash, só Read, Write, Edit, Grep e Glob.
- `todo` (`project-management/todo.md`): gerencia um todos.md na raiz (add, complete, remove, due, undo, list) com datas em linguagem natural.
- `github-issues` (`project-management/github-issues.md`): cria e atualiza issues pelo MCP do GitHub; skill adaptada.
- `nuget-manager` (`project-management/nuget-manager.md`): gerencia pacotes NuGet por dotnet CLI, com regra de nunca editar .csproj para adicionar ou remover.

### security (6 arquivos)

Seis comandos curtos (1,5 a 3 KB): auditoria, hardening, autenticação, dependências, segredos e pentest. Quatro deles incluem `@.env*` no contexto; detectam só npm, pip e cargo (pom.xml só em citação). penetration-test libera Bash com listagem de portas (`netstat -tlnp`) e cita "brute force" sem exigir escopo ou autorização; add-authentication-system promete um sistema "production-ready" em um prompt.

- `security-audit` (`security/security-audit.md`): auditoria em 10 etapas (dependências, autenticação, entrada, segredos, infraestrutura, cabeçalhos) com relatório por severidade; lê `@.env*`.
- `secrets-scanner` (`security/secrets-scanner.md`): procura chaves, senhas e certificados expostos e gera entradas de .gitignore e alternativas seguras.
- `penetration-test` (`security/penetration-test.md`): roteiro de teste de intrusão (reconhecimento, exploração, autenticação, API) com relatório; sem trava de escopo.
- `dependency-audit` (`security/dependency-audit.md`): audita vulnerabilidades, versões e licenças com npm audit, pip check ou cargo audit.

### setup (15 arquivos)

Quinze comandos de configuração inicial (migrações, schema, REST, GraphQL, TypeScript, CI/CD, Docker, lint, formatação, monorepo, rate limit, monitoramento, dependências, ambiente de desenvolvimento, Vercel Analytics). Todos no molde de cerca de 2 KB: seis passos numerados e uma linha "Output". Dizem o que entregar e quase nada de como; design-rest-api e setup-rate-limiting citam Spring Boot só na detecção.

- `design-rest-api` (`setup/design-rest-api.md`): projeta uma API REST (recursos, modelos, autenticação, versionamento, OpenAPI) com detecção de Express, FastAPI e Spring Boot.
- `create-database-migrations` (`setup/create-database-migrations.md`): cria migrações versionadas com up/down, índices e backfills; detecta Sequelize, Prisma e Alembic.
- `setup-rate-limiting` (`setup/setup-rate-limiting.md`): implementa rate limiting (token bucket, janela deslizante) com Redis e políticas por usuário.
- `update-dependencies` (`setup/update-dependencies.md`): atualiza dependências em estágios (patch, minor, major) com testes entre eles; usa npm e pip.

### simulation (10 arquivos)

Dez comandos abstratos de "simulação" (Monte Carlo, gêmeo digital, compressão de linha do tempo, árvore de decisão, cenários de mercado). Só prosa em seis itens numerados e saídas grandiosas; sem código nem método verificável. Todos permitem Read, Write, Edit e WebSearch. Baixo valor prático para um desenvolvedor.

- `monte-carlo-simulator` (`simulation/monte-carlo-simulator.md`): descreve uma simulação de Monte Carlo com distribuições, intervalos de confiança e VaR.
- `digital-twin-creator` (`simulation/digital-twin-creator.md`): pede um "gêmeo digital" calibrado de um sistema ou processo, com validação e cenários.
- `timeline-compressor` (`simulation/timeline-compressor.md`): propõe comprimir linhas do tempo reais em ciclos rápidos de simulação para "aprendizado acelerado".

### svelte (16 arquivos)

Dezesseis comandos de Svelte e SvelteKit: componentes, testes, acessibilidade, migração, otimização e seis de Storybook. Quinze não têm frontmatter e vários começam com "You are acting as the Svelte ... Agent" (vieram de agentes). Usam `/svelte:nome` no título, enquanto o arquivo instalado vira `/svelte-nome`. Fora do foco de backend.

- `svelte-component` (`svelte/svelte-component.md`): cria componentes Svelte com props, eventos, slots e TypeScript; só Read, Write e Edit.
- `svelte-storybook-troubleshoot` (`svelte/svelte-storybook-troubleshoot.md`): diagnostica erros de build do Storybook em SvelteKit, como a migração v6 para v7.
- `svelte-test-fix` (`svelte/svelte-test-fix.md`): corrige testes que falham em Svelte (timing assíncrono, limpeza, seletores, mocks).
- `svelte-a11y` (`svelte/svelte-a11y.md`): audita e corrige acessibilidade (WCAG, ARIA, teclado, contraste) com exemplos bom e ruim.

### sync (14 arquivos)

Quatorze comandos para sincronizar GitHub Issues e PRs com o Linear (bidirecional, em massa, conflitos, saúde, migração). Dependem de um MCP do Linear que não vem junto e escrevem em sistemas externos (criar e fechar issues, webhooks, `--close-github`). `bulk-import-issues` usa `gh api ... --paginate` na injeção. Molde de cerca de 2 KB; sync-status tem 10,9 KB.

- `sync-status` (`sync/sync-status.md`): monitora a saúde da sincronização GitHub-Linear: filas, falhas, última sincronização e limites de taxa.
- `bidirectional-sync` (`sync/bidirectional-sync.md`): sincroniza nos dois sentidos com resolução de conflito (NEWER_WINS, GITHUB_WINS, LINEAR_WINS) e prevenção de laço.
- `issue-to-linear-task` (`sync/issue-to-linear-task.md`): converte uma issue do GitHub em tarefa do Linear preservando campos e comentários; opção `--close-github`.
- `bulk-import-issues` (`sync/bulk-import-issues.md`): importa issues em lote para o Linear com controle de taxa, retentativas e relatório de progresso.

### team (14 arquivos)

Catorze comandos de trabalho em equipe: revisão de arquitetura, sprint, standup, triagem de issues, velocidade, carga, mapa de conhecimento, retrospectiva e manutenção de memória (CLAUDE.md). Molde de cerca de 2,3 KB (sprint-planning tem 4,8 KB). standup-report usa `date -d` na injeção, que aborta no macOS; memory-spring-cleaning usa `stat -c` (GNU). Os dois de memória escrevem em CLAUDE.md sem etapa de aprovação ou diff descrita.

- `architecture-review` (`team/architecture-review.md`): revisão de arquitetura (padrões, acoplamento, fluxo de dados, escalabilidade, segurança); só leitura mais Bash; 3.368 downloads.
- `session-learning-capture` (`team/session-learning-capture.md`): registra aprendizados da sessão e atualiza arquivos CLAUDE.md.
- `memory-spring-cleaning` (`team/memory-spring-cleaning.md`): limpa e sincroniza CLAUDE.md e documentação com o que o código realmente faz.
- `standup-report` (`team/standup-report.md`): relatório de standup com atividade do git, PRs e Linear; quebra no macOS por causa de `date -d`.

### testing (17 arquivos)

Dezessete comandos de testes: geração, cobertura, mutação, propriedades, carga, visual, e2e e triagem. Aqui estão os dois melhores arquivos do tipo (regression-triage, flaky-test-triage) e o mais baixado (generate-tests, 12.070). Os demais seguem o molde genérico. Cobertura de Java é superficial (JUnit, JaCoCo e PIT só em listas).

- `generate-tests` (`testing/generate-tests.md`): gera testes para um arquivo ou componente; description com gatilho explícito ("Use when..."); roda `npm run test:coverage` na injeção.
- `regression-triage` (`testing/regression-triage.md`): acha o commit que causou uma regressão: árvore limpa, teste mais estreito, git log e bisect com script que distingue falha real de falha de ambiente (125).
- `flaky-test-triage` (`testing/flaky-test-triage.md`): mede a taxa de instabilidade com 20 repetições, classifica a causa (tempo, ordem, relógio, porta) e certifica com 50 execuções seguidas.
- `add-mutation-testing` (`testing/add-mutation-testing.md`): configura teste de mutação (Stryker, PIT, mutmut, cargo-mutants) com métricas e portões de CI; menciona Java e JUnit.

### utilities (21 arquivos)

Gaveta de uso geral e a categoria mais baixada (27.532 downloads somados no catálogo): ultra-think, code-review, refactor-code, explain-code, debug-error, prime, context-prime, fix-issue, cleanup-cache, clean-branches e simuladores longos. Qualidade muito irregular: ultra-think é excelente; clean.md tem 68 bytes e só vale para Python; context-prime usa `psub` (fish) e .cursorignore; cleanup-cache e clean-branches são os mais perigosos do repositório. all-tools, git-status e prime creditam IndyDevDan; directory-deep-dive credita Thomas Landgraf.

- `ultra-think` (`utilities/ultra-think.md`): análise estruturada de uma decisão: pergunta no máximo 3 coisas se faltar contexto, gera soluções, testa cada uma de forma adversarial e calibra a confiança; sem allowed-tools.
- `cleanup-cache` (`utilities/cleanup-cache.md`): limpa caches em 3 níveis; o `--maximum` roda `docker system prune -af --volumes`, e allowed-tools pré-aprova `Bash(rm:*)`.
- `clean-branches` (`utilities/clean-branches.md`): remove branches mescladas ou antigas; inclui `git branch -D` por data fixa, `push --delete` em lote e `date -d` (GNU); sem frontmatter.
- `code-review` (`utilities/code-review.md`): revisão em 8 etapas (qualidade, segurança, performance, arquitetura, testes); o nome colide com o `/code-review` nativo.

## O que vale aproveitar

| Item | Por que vale | Esforço | Cuidado |
| :- | :- | :- | :- |
| Regra de ouro para os comandos do kit: comando agora é skill, então escreva como skill com `disable-model-invocation: true` quando houver efeito colateral (https://code.claude.com/docs/en/skills e https://code.claude.com/docs/en/plugins-reference, seção commands) | A doc oficial funde comandos e skills; o kit já distribui skills, e o plugin.json aceita um mapa `commands` com `source` ou `content` inline e description, argumentHint e allowedTools em JSON. Também resolve o ponto do post sobre mods: comandos entram como categoria "comando" sem nova mecânica. | baixo | Comandos de plugin ganham prefixo `/plugin:nome`. Ponha aspas em argument-hint e description se usar frontmatter YAML, por garantia. |
| `testing/regression-triage.md` como molde de comando seguro | Reúne as boas práticas num arquivo: pré-checagem de árvore limpa, ferramentas com escopo em vez de Bash livre, "trate `$ARGUMENTS` como descrição e não como shell", bisect com código 125 e Safety Notes. Adaptar para Maven e Gradle (`mvn -Dtest`, `gradle test --tests`) vira um comando útil para backend Java. | baixo | Sem licença por arquivo (repo MIT, origem não verificada): reescreva com suas palavras. `Bash(git:*)` ainda é amplo; troque por `Bash(git log:*)`, `Bash(git bisect:*)` e similares. Usa `/tmp/triage-bisect.sh`. |
| `testing/flaky-test-triage.md` adaptado para JUnit 5 | A taxonomia (tempo, ordem, relógio, porta) vale para Spring: `@RepeatedTest`, `rerunFailingTestsCount` do Surefire, portas efêmeras e Testcontainers. As regras "não aumente sleep" e "não enfraqueça assert" são boas. | médio | O original libera Bash sem escopo mais Edit e Write: restrinja. Só traz exemplos de Vitest, Jest, Pytest, Go e Cargo; a parte Java é por sua conta. Mesma ressalva de licença. |
| Padrão de limpeza do `git-workflow/worktree-cleanup.md` | `--dry-run`, tabela de status, confirmação por AskUserQuestion, `branch -d` em vez de `-D`, não força remoção de worktree sujo. É o contrário do clean-branches. Serve de modelo para qualquer comando que apaga algo. | baixo | Prefixos claude/*, claude-daniel/* e review/* são do autor; pré-aprova `Bash(rm:*)` e `Bash(git:*)` (restrinja); tem `--force-all` com `-D`, que convém remover do seu modelo. Só o worktree-init menciona Ghostty. |
| `git-workflow/commit.md` como exemplo de contexto por `!` com ferramentas estreitas | Mostra git status, branch, diff e log injetados antes do prompt, `argument-hint` com opções (`--no-verify`, `--amend`) e allowed-tools limitado a git add, status, commit, diff e log, que cobrem os comandos injetados. O kit já tem a skill mensagem-de-commit (só escreve a mensagem); uma versão que commita seria um "comando" com `disable-model-invocation`. | baixo | Preso a `pnpm lint/build/generate:docs` e a exemplos de solc, e cheio de emojis; sem disable-model-invocation. Remova o que é do projeto de origem. O frontmatter falha em YAML estrito (`argument-hint: [message] | --no-verify | --amend`); ponha aspas. |
| `utilities/ultra-think.md` para decisões de arquitetura | Estrutura de saída clara (problema, opções, teste adversarial, recomendação, confiança), limite de 3 perguntas e tamanho proporcional à complexidade. Combina com o público do blog (Spring, Kubernetes, AWS). | baixo | Description com dois-pontos quebra YAML estrito (ponha aspas); sem allowed-tools (bom, nada pré-aprovado). Origem não verificada. |
| `analysis/supply-chain-audit.md` e `documentation/create-architecture-documentation.md` para o seu perfil | Úteis a backend: o primeiro já cita dependency-check, OWASP e SBOM (CycloneDX); o segundo cobre ADR, C4 e arc42. Adaptar para Maven/Gradle, `mvn dependency:tree` e módulos Spring dá comandos próprios do kit. | médio | O segundo tem 6.049 downloads mas é molde genérico; escreva exemplos concretos de Java. Licença sem declaração por arquivo. |
| Linter de comandos para o kit (inspirado em `cli-tool/src/validation`, `cli-tool/src/command-stats.js` e `cli-tool/security-report.json`) | Um script que faz parse do YAML, acusa `Bash` sem escopo, `!` com rede, `rm -rf`, push, `@.env`, e ausência de disable-model-invocation. Daria ao kit uma diferença real: qualidade comprovada. | médio | O validador deles só casa texto (rm -rf /, fork bomb, dd em /dev/sd) e exige o campo `name`, que comandos não precisam ter; o relatório commitado é de 20/12/2025. O kit não tem build: seria um script simples (Python ou Ruby). |
| Comando "rollback" para Kubernetes e Spring, sem a parte perigosa (`deployment/rollback-deploy.md`) | A decisão rollback x correção adiante, a matriz de severidade, o cuidado com migrações de banco (Flyway) e o relatório de incidente combinam com o blog. Dá um bom "comando que só planeja e mostra os comandos", com `disable-model-invocation`. | médio | Não copie: tem `!` com curl em api.example.com, sudo, `ln -sfn`, scripts inexistentes e texto corrompido. Aproveite só a estrutura de decisão. |
| Publicadores de blog (X, LinkedIn, Dev.to) em pt-BR, só gerando texto (`marketing/publisher-x.md`, `marketing/publisher-linkedin.md`) | Cesar mantém blog técnico: um comando que transforma um post em thread e post de LinkedIn economiza adaptação. O formato de entrada (slug, arquivo ou URL) e as 3 versões de thread são boas ideias. | médio | Publicar é ação pública; não copie a parte que usa token de API em .env. Entrada por URL usa WebFetch com conteúdo externo: trate como dado. Textos em inglês e japonês. |
| Padrão "comando é o único caminho + hook bloqueia o resto" do `doordash/doordash-budget.md` | Mostra como comando, skill e hook se combinam num pacote: o comando é o modo sancionado de editar a política, o hook barra escrita por linha de comando, e o comando lê de volta e confirma antes de gravar. Ótimo exemplo para o post sobre pacotes e para o plugin "exemplos". | alto | Domínio de nicho (DoorDash, dinheiro real); só vale como estudo. O arquivo libera `Bash(bash:*)`. O hook e as skills vivem em outras pastas e não foram lidos por esta frente. |
| `team/session-learning-capture.md` e `team/memory-spring-cleaning.md` para manter CLAUDE.md | A ideia de um comando periódico que concilia o CLAUDE.md com o código real é útil e pequena, e se encaixa no kit. | baixo | Gravam em arquivos de memória sem etapa de aprovação descrita; peça o diff antes. `memory-spring-cleaning` usa `stat -c`, que falha no macOS. |

## Cuidados

- Contagem: o enunciado falava em 26 categorias; a pasta tem 25 subpastas de primeiro nível (e 27 contando recipes e personas), confirmado no tree.json e na API em 04/10/2026. O site informa números diferentes para o mesmo tipo (200+, 225+, 288 no catálogo, 348 arquivos). Os downloads (146.770 somados) vêm do commands.json, de data desconhecida: são números informados pelo catálogo. O resumo de aitmpl.com/commands veio só com "Loading components" (página carregada por JavaScript), então o que a lista mostra não foi verificado.
- Fonte dos arquivos: a cota da API do GitHub (compartilhada) esgotou durante a conferência, então os 348 arquivos foram lidos por raw.githubusercontent.com (mesmo conteúdo público da branch main) e a lista de pastas pela API sem autenticação. As cópias temporárias foram apagadas.
- Estatísticas por regex sobre os 348 arquivos (allowed-tools sem escopo, `!`, .env, git push etc.) foram refeitas e podem ter falsos positivos e negativos. A leitura integral cobriu cerca de 25 arquivos e trechos de dezenas de outros; o restante entra nas contagens. "Nenhum escrito para Java" vem da lista de nomes e de busca por termos.
- YAML: o teste estrito foi com Ruby Psych safe_load (200 de 295 falham). A regra de reparo do Claude Code foi lida no binário local 2.1.289 e reimplementada por mim; não executei o Claude Code sobre os arquivos. Bun.YAML (usado pelo Claude Code) pode divergir do Psych em casos de borda.
- Instalação: conclusões sobre colisão de nomes, nome com duas barras, `--dry-run` ignorado e ausência de hash vêm da leitura de `installIndividualCommand` e do fluxo em `cli-tool/src/index.js`; não executei a CLI.
- Risco de execução: o `!` roda na invocação sem perguntar, mas só se as regras de permissão ou o allowed-tools do comando o liberarem; com `Bash` sem escopo (115 dos 133 arquivos com `!`), tudo fica liberado. Instalar tudo também pesa no contexto: as descriptions somam cerca de 27 mil caracteres (média de 78 por arquivo, contando a primeira linha dos 53 sem frontmatter) e entram na listagem a cada turno.
- Comandos destrutivos ou de efeito externo: cleanup-cache, clean-branches, git/finish, hotfix-deploy, rollback-deploy, sync/*, publisher-linkedin e os de google-workspace que enviam e-mail ou sobem arquivo. Nenhum dos 348 usa disable-model-invocation; hoje o Claude pode acionar qualquer um pela description, e allowed-tools pré-aprova na mesma vez.
- Colisão com comandos nativos: resume, status e code-review (alias /review). Também há colisão interna: commit (git-workflow e orchestration) e release (git e project-management) viram o mesmo arquivo na instalação plana.
- Arquivos que dependem de coisas que a instalação de um .md não leva: 49 com links relativos (46 de google-workspace), os doordash (dd-cli, skills, hooks), orchestration (agentes e task_manager.py), sync e project-to-linear (MCP do Linear), azure (MCP do Azure). Instalam sem erro e falham ou improvisam na hora de usar.
- Licença e proveniência: o repositório é MIT (Daniel Ávila, 2025); 107 arquivos trazem aviso Apache-2.0 do Google, 3 creditam IndyDevDan/disler, 1 credita Thomas Landgraf, e os demais não declaram origem. Os metadados do catálogo vêm com autor e licença vazios nos 288 itens. Antes de copiar para o claude-code-kit, reescreva ou cite a fonte.
- Qualidade e documentação defasadas: COMMANDS_GUIDE.md descreve a ferramenta SlashCommand, "(project:frontend)" e um exemplo que usa `$ARGUMENTS` como se fosse o segundo argumento; docs.aitmpl.com e o README citam comandos que não existem; CONTRIBUTING lista a categoria code-generation, que não existe; a própria diretriz pede allowed-tools específico mas 250 de 293 usam Bash livre. O security-report.json commitado (20/12/2025, 379 componentes, 247 reprovados, 0 dos 216 comandos válidos) é antigo, o validador exige o campo `name` (que comando não precisa ter) e o job de CI roda com `continue-on-error`, sem barrar PRs.
- Substituição de argumentos: `$1` e `$2` dentro de trechos de shell ou awk (por exemplo em clean-branches) são substituídos pelo Claude Code quando o usuário passa esse número de argumentos; sem argumento nessa posição, ficam literais (doc, "Pass arguments to skills").
- Textos lidos que tentaram dar ordens (ignorados, apenas registrados): gws-shared.md manda "incentivar agentes e usuários a dar estrela" no repositório do Google e abrir issues lá; os gws-* mandam ler `../gws-shared/SKILL.md` ou rodar `gws generate-skills`; git-workflow/pr-review.md diz que recomendações futuras devem ser tratadas "immediately" e manda atualizar o GitHub com a revisão; o README do projeto traz patrocínios e um comando de instalação de skills da Bright Data; as páginas de docs (code.claude.com e docs.aitmpl.com) abrem com um pedido para buscar o índice completo da documentação. Nada disso foi seguido (o llms.txt de docs.aitmpl.com foi lido por decisão de pesquisa, por ser documentação pública). Esses comandos são prompts feitos para o modelo e podem fazer isso com você depois de instalados.
- Pesquisa somente leitura: não cloniei o repositório, não executei nada do projeto, não instalei nada, não editei o claude-code-kit nem o blog. Usei gh api, curl, WebFetch, Python e Ruby sobre cópias temporárias no scratchpad (apagadas) e li texto do binário local do Claude Code só para conferir o tratamento de frontmatter.

## Fontes

- https://github.com/davila7/claude-code-templates (API repos/davila7/claude-code-templates: estrelas, forks, licença; commits que tocam cli-tool/components/commands, usados para as datas de regression-triage, flaky-test-triage, doordash e supply-chain-audit)
- /private/tmp/claude-1068948898/-Users-cesar-schutz-Downloads-claude-code-kit/5f901f11-25f6-40d4-85ad-3af709ec508c/scratchpad/tree.json (contagem por categoria: 348 arquivos, 25 subpastas) e a listagem da pasta pela API
- README.md; CONTRIBUTING.md; LICENSE
- cli-tool/docs_to_claude/COMMANDS_GUIDE.md
- cli-tool/bin/create-claude-config.js (opções `--command`, `--dry-run`, `-d`, `--command-stats`); cli-tool/src/index.js (linhas 146, 411, 471, 551-620, 1917); cli-tool/src/tracking-service.js; cli-tool/src/command-stats.js; cli-tool/src/command-scanner.js
- cli-tool/src/validation/README.md; cli-tool/src/validation/validators/StructuralValidator.js; cli-tool/src/validation/validators/SemanticValidator.js; cli-tool/security-report.json; .github/workflows/component-security-validation.yml
- dashboard/public/components/commands.json (288 itens, downloads por comando)
- .claude/commands/lint.md; .claude/commands/create-blog-article.md; .claude/commands/cleanup-cache.md (comandos do próprio projeto)
- Arquivos de cli-tool/components/commands/ lidos por inteiro ou em grande parte: testing/regression-triage, testing/flaky-test-triage, testing/generate-tests, git-workflow/commit, git-workflow/worktree-cleanup, git-workflow/pr-review, git-workflow/gemini-review, git/finish, utilities/ultra-think, utilities/clean, utilities/clean-branches, utilities/cleanup-cache, utilities/context-prime, analysis/supply-chain-audit, deployment/rollback-deploy, doordash/doordash-budget, azure/azure-role-selector, google-workspace/gws-shared, google-workspace/gws-gmail-send e outros, mais cabeçalhos e trechos de dezenas de arquivos de todas as 25 categorias
- Varredura por script dos 348 arquivos (frontmatter, allowed-tools, `!`, .env, links relativos, licenças, Java, descriptions) e teste de YAML estrito com Ruby Psych, mais simulação da regra de reparo do Claude Code
- https://code.claude.com/docs/en/skills (também servida em /docs/en/slash-commands); https://code.claude.com/docs/en/permissions.md; https://code.claude.com/docs/en/commands.md; https://code.claude.com/docs/en/plugins-reference.md; https://code.claude.com/docs/en/tools-reference.md; https://code.claude.com/docs/en/memory.md
- https://www.aitmpl.com/commands; https://www.aitmpl.com/component/command/git-workflow/commit
- https://docs.aitmpl.com/; https://docs.aitmpl.com/concepts/commands.md; https://docs.aitmpl.com/components/commands.md; https://docs.aitmpl.com/contributing/component-guidelines.md
- Do claude-code-kit (somente leitura): README.md, .claude-plugin/marketplace.json, skills/mensagem-de-commit/SKILL.md, skills/explicar-erro/SKILL.md
- Binário local do Claude Code 2.1.289 (texto extraído com strings, função de leitura de frontmatter)

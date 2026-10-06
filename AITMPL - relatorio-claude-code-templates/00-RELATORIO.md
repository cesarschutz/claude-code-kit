# Relatório: claude-code-templates, aitmpl.com, o seu claude-code-kit e o post de mods

Pesquisa feita em 04/10/2026, com o Claude Code 2.1.289. Este arquivo é o resumo para ler depois. Os 16 relatórios completos (cerca de 107 mil palavras) estão na pasta `detalhes/`, ao lado deste arquivo.

## Como a pesquisa foi feita

- 29 agentes em paralelo: 12 frentes de pesquisa (o site, a CLI, agentes, comandos, hooks, settings, MCPs, skills, mods, loops/sandbox/plugins, governança e o mapa oficial do Claude Code), a auditoria do seu kit, a cobertura do post, o plano para o kit, a proposta das 3 partes e um revisor crítico.
- Cada frente de pesquisa foi conferida por um cético que tentou refutá-la na fonte primária. Resultado: 814 afirmações checadas, 541 confirmadas, 210 corrigidas e 63 deixadas como "não verificado". Ou seja, cerca de um quarto das afirmações da primeira passada estava errado e foi corrigido.
- Nada foi alterado no `claude-code-kit` nem no blog. Nada do `claude-code-templates` foi clonado, instalado ou executado: tudo vem de leitura do código, da API do GitHub, do npm, do site e da documentação oficial.
- Números exibidos por sites (downloads, estrelas, contadores) são "números informados pelo site em 04/10/2026".
- Textos lidos (README, prompts de agentes, páginas web) foram tratados como dado, nunca como instrução. As páginas de `code.claude.com` abrem com um aviso dirigido a agentes mandando buscar o `llms.txt`; foi ignorado.

## 0. Resumo em dez linhas

1. O `claude-code-templates` (MIT, 32 mil estrelas) é um catálogo de arquivos, uma CLI que os instala e um site (aitmpl.com) que mostra o catálogo. Não é um marketplace de plugins do Claude Code.
2. O catálogo tem 890 skills, 422 agentes, 288 comandos, 105 MCPs, 72 settings, 62 hooks, 39 mods, 18 loops, 14 templates de projeto e 11 sandboxes. A qualidade é desigual: escala sem curadoria.
3. O que um plugin do Claude Code não entrega (permissões, `statusLine`, `env`, `CLAUDE.md`) é exatamente o que a CLI deles precisa mesclar no `settings.json`. Essa fronteira é a ideia mais útil de tudo.
4. A CLI tem telemetria ligada por padrão, instala sempre da branch `main` sem versão nem hash e sobrescreve arquivos sem perguntar. Aproveite as ideias, não a CLI.
5. Seu kit já passa o `claude plugin validate --strict`, mas não tem CI, `SECURITY.md` nem metadados nas 7 peças avulsas.
6. O primeiro passo no kit é pequeno: metadados, CONTRIBUTING corrigido e um CI com `claude plugin validate`.
7. O post de mods cobre bem o que promete. Contra o mapa oficial de 130 peças do Claude Code, 12 têm tratamento próprio, 17 aparecem de passagem e 101 não aparecem.
8. As lacunas que pesam: a fronteira plugin × configuração, permissões e configurações, confiança em tudo o que executa, automação sem supervisão e o que o Claude Code já mostra sem mod.
9. Proposta: uma parte 3 nova no fim, "Configurações e permissões do Claude Code — o que um plugin não leva", mais 17 correções pontuais nas partes 1 e 2.
10. Antes de escrever, há decisões suas e um conflito de sequência com o trabalho em andamento no cockpit (seção 2 e seção 9).

## 1. O que o pedido solicita

O texto de origem é uma lista de tarefas com quatro frentes:

1. Estudar o `claude-code-templates` e o site aitmpl.com: como funcionam.
2. Explicar cada tipo de componente (agentes, comandos, settings como statusline e permissões, MCPs, plugins, hooks, skills) e, principalmente, o site completo: a ideia, o que tem e o que dá para aproveitar.
3. Usar isso para melhorar o `claude-code-kit`.
4. Avaliar se o post de mods (que fala de skills e das demais peças) deixou algo de fora e, se sim, como mudá-lo: editar só aquele post, passando de 2 para 3 partes, sem escrever o post ainda.

## 2. O que mudou enquanto a pesquisa rodava (atenção)

Outras sessões estão mexendo nos mesmos arquivos. Isso afeta o plano do post e deixa a auditoria do kit parcialmente velha.

- **Kit:** o histórico foi reescrito para um commit só (`22d7840`, "claude-code-kit 1.0") e havia 18 arquivos modificados e 1 novo, com o cockpit ganhando aba de workflow, total geral em reais e `userConfig` (`cotacaoDoDolar`). O relatório 12 (auditoria do kit) foi escrito antes disso e afirma árvore limpa e dois commits; está desatualizado nesses pontos.
- **Blog:** a cópia publicada dos posts de mods é a da worktree `~/Downloads/blog/.claude/worktrees/post-dns` (igual ao `origin/main`). Em paralelo:
  - a worktree `post-cockpit-melhorias` tem uma edição sem commit da parte 2 (50 testes em vez de 35, prints novos, agentes de workflow no grafo, cerca de 4.686 palavras contra 4.469);
  - a worktree `post-you-should-know` tem um rascunho `claude-code-you-should-know.mdx` (`draft: true`, ~3.245 palavras) sobre os mods embutidos. Ele cita as partes 1 e 2 como "(parte 1 de 2)" e "(parte 2 de 2)", e um "de 3" deixaria o texto desatualizado.
- **Consequência:** as contagens de palavras, o carimbo "35 de 35" e as telas do post do cockpit já divergem da edição em andamento. Se a parte 3 for escrita sobre a base de hoje, haverá conflito no mesmo `.mdx`.

## 3. O site e o repositório: a ideia

O repositório junta três coisas:

- **O catálogo:** arquivos com frontmatter em `cli-tool/components/` (9.663 arquivos, ~116 MB).
- **A CLI:** `npx claude-code-templates` (npm 1.29.6) baixa e instala cada peça.
- **O site aitmpl.com:** um front para o catálogo.

**Como o site funciona:**
- Um script (`scripts/generate_components_json.py`) varre as pastas, lê o frontmatter, soma downloads (Supabase) e grava JSON estático. Um workflow roda todo dia às 03:00 UTC e comita o resultado.
- O site (Astro 5, React 19, Tailwind 4, Clerk, Neon) roda no Cloudflare Pages e serve esses JSON.
- Menu: Skills, Agents, Commands, Settings, Hooks, MCPs, Mods e Plugins; e Trending, Jobs, Blog, Docs e GitHub. Loops existe em `/loops`, mas está oculto no menu.
- Página de componente: `/component/<tipo>/<categoria>/<nome>`, com o comando de instalação, botão de copiar, selo de downloads e o conteúdo do arquivo.
- **Stack Builder:** só guarda os itens no `localStorage` e monta um único comando `npx claude-code-templates@latest` com vários `--agent`, `--command`, `--setting` etc. Não há servidor envolvido.
- **Busca ⌘K:** baixa `search-index.json` (1,15 MB) e filtra no navegador.
- **Trending:** só os 10 mais baixados da semana por tipo.
- **Jobs:** 86 vagas raspadas do Hacker News, da Anthropic e de outros sites.
- **Plugins:** diretório de 34 coleções de terceiros (15 marketplaces com 1.312 plugins e 19 plugins únicos), gerado à mão por `generate_plugins_json.py`. O site não instala nada; mostra os comandos `/plugin marketplace add` e `/plugin install` de cada coleção.
- **Com login:** coleções pessoais e envio da coleção como PR para um repositório do usuário.
- **Docs:** docs.aitmpl.com (Mintlify). O blog fica em `dashboard/public/blog/`.

**Os contadores do topo da home não são leituras ao vivo.** São "base + dias × taxa" calculados em `home-stats.ts` (downloads, PRs de componentes e instalações npm).

**O repositório não é um marketplace do Claude Code.** O único `marketplace.json` fica em `cli-tool/components/.claude-plugin/`, tem só uma chave `agents` com 8 itens e não tem `name`, `owner` nem `plugins`; o `claude plugin validate` dá 3 erros. O caminho de instalação é o `npx`, não o `/plugin`.

**O que vale na ideia:** catálogo em arquivos simples com frontmatter como fonte da verdade e JSON gerado (sem Astro, Cloudflare ou contadores dá para fazer um índice navegável no próprio README); CI com `claude plugin validate`; proveniência por item; agente revisor de contribuições.
**O que não vale para o kit:** site, Stack Builder, contadores sintéticos, patrocínio, telemetria, banco de dados.

## 4. Cada tipo de componente, explicado

| Tipo | O que é | Quantos no catálogo | A CLI instala em | Plugin entrega? | Veredito |
|---|---|---|---|---|---|
| **Skills** | Pasta com `SKILL.md` que o modelo carrega quando o pedido combina com a descrição | 890 em 29 categorias (914 `SKILL.md` e 5.691 arquivos na árvore) | `.claude/skills/<nome>/` | Sim | 836 sem arquivo de licença; 13 pastas (docx, pdf, pptx, xlsx e variantes) têm licença proprietária da Anthropic, redistribuídas sob MIT; nenhuma usa `disable-model-invocation`, `context` ou `paths` |
| **Agentes** | Subagente: Markdown com frontmatter (`name`, `description`, `tools`, `model`), roda em contexto próprio | 422 em 28 categorias | `.claude/agents/<nome>.md` (a categoria é descartada; sobrescreve sem perguntar) | Sim; agente de plugin ignora `permissionMode`, `hooks` e `mcpServers` | 79 só com ferramentas do Copilot que não existem no Claude Code; 159 descrições acima de 1.500 caracteres |
| **Comandos** | Prompt salvo chamado por `/nome`; a doc oficial já os incorporou às skills (mesmo frontmatter, `!comando`, invocável pelo modelo) | 288 em 25 categorias (348 `.md` na árvore) | `.claude/commands/<nome>.md` | Sim (`commands` no `plugin.json`) | 250 de 293 usam `Bash` sem escopo; há comandos destrutivos; os melhores são `flaky-test-triage` e `regression-triage` |
| **Hooks** | Comando que o Claude Code roda sozinho num evento (33 eventos hoje); `exit 2` bloqueia | 62 em 12 categorias | Mescla em `settings.json` (escopo à escolha) e baixa `.py`/`.sh` para `.claude/hooks/` | Sim (`hooks/hooks.json`) | 17 dependem de variáveis que a doc atual não cita; avisos com `exit 0` ficam só no log de depuração; `--hook` anexa ao evento sem deduplicar, e um setting que traz hooks substitui os que você já tinha no mesmo evento |
| **Settings** | Fragmento de `settings.json` (permissões, `env`, modelo, statusline, telemetria, provedor) | 72 JSON em 13 subpastas (statusline: 32 JSON + 3 scripts) | Mescla no `settings.json` do escopo escolhido | **Não**: o `settings.json` de plugin só aplica `agent` e `subagentStatusLine` | Defasados (modelos 4.x fixados, `includeCoAuthoredBy` deprecada); "partnerships" trocam o provedor com link de indicação |
| **MCPs** | Servidor MCP: dá ferramentas externas ao modelo | 105 em 13 categorias | Mescla em `.mcp.json` | Sim (`.mcp.json` no plugin) | 9 de 59 usos de `npx` apontam para pacote inexistente ou obsoleto; 9 remotos sem `type` (o Claude Code ignora); segredo em texto puro |
| **Mods** | Plugin com código que roda dentro do Claude Code e desenha na interface | 39 em 7 subcategorias | `.claude/skills/<nome>/` (carrega como `<nome>@skills-dir`, sem versão) | É um plugin | 15 são jogos; 18 têm testes; 24 têm `userConfig`; os `jev-*` concentram 78% dos downloads e mandam texto a um serviço comercial |
| **Loops** | Receita de prompt em Markdown (objetivo, intervalo, condição de parada) para `/loop`, `/goal` ou `/schedule` | 18 em 3 categorias | `.claude/loops/` (o Claude Code **não lê** essa pasta) | **Não** | Boas ideias de parada; várias agendas esbarram nos limites reais (`/loop` só dispara com a sessão aberta e expira em 7 dias) |
| **Sandbox** | Demos para rodar o Claude Code isolado (E2B, Cloudflare, Docker) | 11 no catálogo (25 arquivos) | pasta de lançadores | n/a | A documentação não bate com o código; chaves por argumento de linha de comando; `--dangerously-skip-permissions` |
| **Templates de projeto** | `CLAUDE.md` + `.claude/` + `.mcp.json` por linguagem ou framework | 14 (6 por linguagem, 8 por framework) | raiz do projeto, só via CLI | `CLAUDE.md` na raiz de plugin não é carregado | Legados; sem Java; Go e Rust vazios |
| **Plugins (aba do site)** | Diretório de marketplaces de terceiros | 34 coleções | n/a | n/a | Gerado à mão; o repositório em si não é um marketplace |

## 5. O `context-monitor` (o link que você passou)

`https://www.aitmpl.com/component/setting/statusline/context-monitor`

- É um setting da categoria `statusline`, com dois arquivos: `context-monitor.json` (só a `description` e `statusLine: { type: "command", command: "python3 .claude/scripts/context-monitor.py" }`) e `context-monitor.py` (299 linhas, só biblioteca padrão).
- **Instalação:** `npx claude-code-templates@latest --setting statusline/context-monitor`. A CLI baixa os dois arquivos da `main`, grava o script em `.claude/scripts/` com permissão 755 e mescla o JSON no settings do escopo escolhido (com `--yes`, o local). Só a chave `statusLine` é alterada; se já existe outra, a CLI pergunta.
- **O que lê:** o JSON da sessão no stdin (modelo, pasta, custo, duração, linhas somadas, `transcript_path`), o transcript inteiro e três comandos `git`.
- **O que imprime:** uma linha com `[modelo]`, pasta, ramo, alterações, uma barra de contexto de 8 segmentos com percentual colorido (verde, amarelo, laranja, vermelho com "HIGH" e "CRIT"), custo, minutos e linhas líquidas.
- **Segurança:** sem rede, sem escrever arquivos, não chama o modelo (não gasta tokens).
- **Defasado:** divide por 200.000 fixo (a doc atual entrega `context_window.used_percentage` e `context_window_size`, de 200.000 ou 1.000.000, então com janela de 1M o percentual sai errado); lê o transcript inteiro e roda três `git` a cada atualização. O `worktree-context-statusline.py`, do mesmo repositório, já usa o campo novo.
- **Popularidade:** 15.515 downloads, a setting mais baixada. No catálogo inteiro está longe do topo (`frontend-design` tem cerca de 48 mil).
- **Plugin não distribui isso:** `statusLine` é configuração de usuário.

## 6. A CLI: o que saber antes de rodar (pelo código lido, sem executar)

- **Telemetria ligada por padrão**, com três endpoints (`/api/track-download-supabase`, `/api/track-installation-outcome`, `/api/track-command-usage`) e timeout de 5 s. O servidor de downloads grava IP, país e user-agent. Opt-out: `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`, e só vale o valor exato `true` (`=1` não desliga). O opt-out não aparece nos READMEs principais.
- **Instala sempre da branch `main`**, sem versão fixada, hash ou assinatura (10 pontos em `index.js` baixam de `raw.githubusercontent.com/.../main/...`).
- **Sobrescreve sem perguntar:** `--agent`, `--command` e `--skill` sobrescrevem; `--mcp` substitui servidor de mesmo nome; um setting que traz hooks substitui o array do evento (`--hook` anexa sem deduplicar).
- **Painéis locais** (analytics, chats mobile, plugins, skills, teams, proxy): servidores Express sem autenticação, CORS `*` e `listen` sem host; leem `~/.claude/projects` (conteúdo das suas conversas). O `--tunnel` expõe o painel pela Cloudflare sem autenticação no código.
- O **`--studio`** já teve um RCE sem autenticação (GHSA-79wm-x847-7cvg, CVSS 8.8), corrigido na 1.29.4 (npm, 14/07/2026 UTC). As datas das fontes não batem entre si (CHANGELOG diz 13/07; a advisory do repositório é de 14/07; a base global do GitHub só de 03/09): ao citar, diga a fonte de cada data.
- Para testar mesmo assim: diretório descartável e `CCT_NO_TRACKING=true`.
- **Leitura geral:** aproveite as ideias (CI, escopos, loops como receita, validação), não o código nem o modelo "copiar arquivos para `.claude`". O marketplace do Claude Code já resolve versão, atualização e remoção.

## 7. O que aproveitar no `claude-code-kit`

### 7.1 Onde o kit está

- 9 itens: 1 mod (`csr-cockpit` 1.0.0), 1 pacote (`exemplos` 0.1.0) e 7 peças avulsas (2 skills, 2 agentes, 1 estilo, 1 tema, 1 hook).
- `claude plugin validate` passa na raiz, com e sem `--strict`, no `exemplos --strict` e no `csr-cockpit --strict`.
- Sem `.github/`, sem CI, sem `SECURITY.md`, sem CHANGELOG. As 7 entradas avulsas não têm `author`, `license` nem `tags`. Skills e agentes usam só o frontmatter mínimo.
- Nenhum item cobre Java, Spring, Kubernetes ou AWS, que é o assunto do blog.
- README, `marketplace.json`, CONTRIBUTING e a arte estavam em sincronia na auditoria; as afirmações técnicas do README do cockpit que deu para checar batem com o código.
- A D80 do blog registra que o kit foi deixado enxuto (só o cockpit e os exemplos). Crescer o kit não é proibido por ela, mas é uma decisão a tomar (pergunta 4).

### 7.2 Estrutura, automação e documentação

Prioridade 1 = fazer primeiro, 5 = pode esperar.

| ID | O que fazer | Prior. | Esforço | Valor |
|---|---|---|---|---|
| **E01** | CI (`.github/workflows/validar.yml`): `claude plugin validate . --strict` em cada plugin, `claude plugin test ./plugins/csr-cockpit` e `python3 scripts/arte.py` com `git diff --exit-code`, com o Claude Code em versão fixa; job semanal com `@latest` só para relatar. Sem passo que comente no PR (no PR #1060 deles os checks de segurança ficaram vermelhos porque o comentário falha em PR de fork); use `$GITHUB_STEP_SUMMARY`. Teste num PR de rascunho. | 1 | baixo | alto |
| **E02** | Metadados nas 7 peças avulsas: `author`, `license`, `repository`, `homepage`, `keywords`, `tags` por assunto. Um teste local mostrou que `metadata` livre, `author`, `license`, `keywords` e `tags` na entrada passam no `validate`. | 1 | baixo | médio |
| **E03** | CONTRIBUTING corrigido: trocar `marketplace add .` (colide com o `cesarschutz` já cadastrado) por `claude --plugin-dir ./plugins/<nome>`; ensinar `renames`; citar `claude plugin details`, `tag` e `eval`; nomes reservados completos (`claude-`, `anthropic-`, `anthropics-`, `cc-plugin-`); avisar que `--strict` falha sem `author` no `plugin.json`; frase de licença para contribuições. | 1 | baixo | alto |
| **E04** | README raiz: contagem correta (7 avulsas + 1 pacote com 4 peças + 1 mod = 9 itens), coluna "Como usar", requisito de versão, custo em contexto por item. Confirmar na prática o nome dos comandos das peças avulsas antes de documentar. | 2 | baixo | médio |
| **E05** | Proveniência e atribuição: política "inspirado em outro projeto: reescrito do zero e creditado", seção "Origem" no README de cada item, tabela de atribuição, recusa de itens sem licença identificável e das skills proprietárias da Anthropic, parágrafo "o que este kit não faz" (sem telemetria própria, sem build, sem dependência). | 2 | baixo | alto |
| **E06** | `SECURITY.md` curto, template de PR com checklist (o que roda na máquina, versão subiu, arte regenerada, licença de terceiros); no GitHub: topics, secret scanning com push protection e ruleset de `main` ativo exigindo o check do E01. | 2 | baixo | médio |
| **E07** | Frontmatter moderno nas peças atuais (`allowed-tools` nas skills que rodam git, `argument-hint`, `model`/`color`/`maxTurns` nos agentes). Medir antes de afirmar que um modelo menor não piora o `pesquisador`. | 2 | baixo | médio |
| **E08** | Limpezas do cockpit: privacidade omite `$.store`; `tsconfig.json` rastreado estende pasta gerada e fora do git; logs vão para `$HOME/.claude` mesmo com `CLAUDE_CONFIG_DIR`; duas linhas em Requisitos (sessão WSL, sessão na nuvem); apagar `tests/vitrine.test.tsx` local; subir `version` para 1.0.1 para o README chegar a quem já instalou. (Conferir contra o trabalho em andamento no cockpit.) | 2 | baixo | médio |
| **E09** | `scripts/validar-kit.py` com regras que o `validate` não cobre (README × `marketplace.json`, `version` subiu, README com "o que roda", `name` da skill = pasta, `description` com "quando usar", busca de segredos). Só vale quando o catálogo passar de ~15 itens. Não copiar o validador de 5 camadas com score deles. | 3 | médio | médio |
| **E10** | Catálogo gerado do `marketplace.json` sem site: `scripts/catalogo.py` gera a tabela do README entre marcadores e um `docs/catalogo.json`. É a ideia central do site deles sem Astro nem contadores. | 3 | médio | médio |
| **E11** | Versões, tags (`claude plugin tag`) e CHANGELOG. Só importa quando algo depender de um plugin por faixa de versão. | 4 | baixo | baixo |
| **E12** | Pacote-guia por `dependencies` no lugar do Stack Builder. Só com mais de ~15 itens. | 5 | médio | baixo |
| **E13** | `claude plugin eval` numa skill: o único jeito de medir se uma skill dispara e ajuda (nenhuma das 914 do templates tem medição). Custa chamadas reais de modelo. Bom assunto de post. | 5 | médio | médio |

### 7.3 Receitas em documentação (o que plugin não distribui)

Pasta nova `docs/receitas/`. Valores sempre conferidos na doc no dia, porque ela muda 3 a 4 versões por semana.

| ID | O que fazer | Prior. |
|---|---|---|
| **R01** | `docs/receitas/settings.md`: `permissions.deny` para arquivos sensíveis (partir do exemplo oficial em `settings-example`), `cleanupPeriodDays`, privacidade e telemetria por `env` (nomes tirados da página de variáveis, não de memória), `attribution` (`includeCoAuthoredBy` é deprecada), modelo por alias. Apontar para `/update-config`, `/fewer-permission-prompts`, `/permissions` e `/config`, que já existem: não fazer skill própria que grave em settings. **Não colar:** `enableAllProjectMcpServers`, `ANTHROPIC_BASE_URL` de terceiros e `allow-git-operations` (libera `git push`, inclusive forçado). | 2 |
| **R02** | `docs/receitas/statusline.md` com um script curto próprio (lê o JSON do stdin: `model.display_name`, `context_window.used_percentage`, `cost.total_cost_usd`, `workspace.current_dir`; ramo do git com timeout curto; sem ler o transcript). O `context-monitor` entra como contraexemplo. Dizer que o cockpit já mostra contexto, custo, limites e cache. | 3 |
| **R03** | `docs/receitas/automacao.md`: receitas de `/goal` (contrato de conclusão), "N execuções verdes seguidas", revisão adversarial com o agente `critico` e rotina noturna com `/schedule`, com os limites reais (`/loop` só dispara com a sessão aberta, expira em 7 dias, mínimo de 1 minuto; `/goal` é um hook `Stop`; `/schedule` exige login claude.ai e tem mínimo de 1 hora). | 4 |

### 7.4 Itens novos para o catálogo

Decisão de forma antes de começar: um pacote `backend` (`/backend:triar-teste-intermitente`, uma versão, um comando de instalação) ou peças avulsas (uma entrada por item, como hoje).

| ID | Item | Prior. | Distribuível por plugin |
|---|---|---|---|
| **N01** | Plugin `guardas`: 3 a 4 hooks `PreToolUse` que negam por JSON (`permissionDecision: "deny"`) usando o campo `if`: `git push --force`, leitura e escrita de `.env*` e chaves, e `ask` para `git reset --hard` e `rm -rf`. É a resposta direta ao limite "plugin não distribui `permissions`". Evitar os defeitos dos originais (o padrão `Bash(git push *-f*)` também casa com nomes de branch; `env-file-protection` só cobre `Write`). Testar com `claude --plugin-dir` num repositório descartável. | 2 | Sim |
| **N02** | Pacote `backend` com o agente `revisor-spring`: somente leitura (`tools: [Read, Grep, Glob]`), checklist de `@Transactional`, JPA (N+1, lazy fora de transação), DTO × entidade, segurança, configuração, concorrência, testes e observabilidade; detecta a versão do Spring e do Java antes de opinar. Não copiar o `spring-boot-engineer.md` deles (corpo idêntico ao do VoltAgent, cita Spring Cloud Sleuth, que não funciona com Spring Boot 3). | 2 | Sim |
| **N03** | Skill `triar-teste-intermitente` (e depois `triar-regressao` com `git bisect run`): exige árvore limpa, repete o teste N vezes, classifica a causa (tempo e `Thread.sleep`, ordem, contexto Spring cacheado, relógio sem `Clock`, porta fixa), não aumenta sleep nem enfraquece assert. Base: `flaky-test-triage.md` e `regression-triage.md` (só têm Vitest, Jest, Pytest, Go e Cargo; a parte Java é nova). Cuidado: `allowed-tools` com `Bash(./mvnw test *)` pré-aprova executar o código do projeto aberto, inclusive de um clone não confiável. | 2 | Sim |
| **N04** | Skill `registrar-decisao` (ADR em português, em `docs/adr/`): confere fatos no repositório, numera, só grava depois de mostrar o texto. Combina com o blog. | 2 | Sim |
| **N05** | Agente `revisor-kubernetes` (somente leitura): requests/limits, probes com aquecimento da JVM, `securityContext`, PDB, HPA, tag `latest`, NetworkPolicy, RBAC, `MaxRAMPercentage`. | 3 | Sim |
| **N06** | Agente `arquiteto-aws` (somente leitura): IaC no repositório, Well-Architected, IAM sem curinga, IRSA/Pod Identity, custo. O templates tem 12 agentes de Azure e nenhum de AWS. Sem `WebFetch` na primeira versão (conteúdo web é vetor de injeção). | 3 | Sim |
| **N07** | Skill `iniciar-projeto-spring`: detecta `pom.xml`/`build.gradle`, pergunta versões e propõe um `CLAUDE.md` curto sem sobrescrever; compare antes com o `/init` embutido. O templates não tem template Java. | 3 | Parcial (o `CLAUDE.md` gerado vive no projeto) |
| **N08** | Plugin `docs-de-bibliotecas`: um exemplo de MCP (Context7 remoto, `type: http`). Risco: conteúdo de documentação de terceiros entra no contexto do modelo (injeção indireta) e as consultas saem para um serviço externo; pede aviso no README e talvez conflite com "sem telemetria própria". Termos do serviço não verificados. | 3 | Sim |
| **N09** | Hook `avisar-ao-terminar` (`Notification`; `osascript` no macOS, `notify-send` no Linux). | 4 | Sim |
| **N10** | Skill `adaptar-post-para-redes` (só gera texto, nunca publica). Depende de você publicar em redes. | 4 | Sim |
| **N11** | Mod pequeno `csr-tempo` (~60 linhas): selo de duração por chamada de ferramenta; "hello world de mod" com teste, bom para o blog. Inspirado no `tool-timing-badge` (64 linhas). | 4 | Sim |
| **N12** | Ideias para o cockpit 1.1: contagem regressiva do TTL do cache (rotular como estimado), marca de fork e pico de contexto no cartão do agente, opções por `userConfig`. Atenção: o `userConfig` já está em andamento no cockpit. | 4 | Sim |

**Regra de licença para tudo:** o templates é MIT (© 2025 Daniel Ávila), e vários itens dentro dele têm origem de terceiros. Reescrever a ideia do zero e citar a origem. Nunca copiar docx, pdf, pptx e xlsx.

### 7.5 O que não copiar

| Item | Motivo |
|---|---|
| CLI `npx claude-code-templates` e o modelo "copiar para `.claude`" | Telemetria por padrão, instalação da `main` sem versão nem hash, sobrescrita silenciosa, 13 nomes de agente colidem na pasta única |
| Site, Stack Builder, contadores, busca patrocinada, vagas | Contadores por fórmula; contagens divergem entre README, site, docs e `CLAUDE.md`; fora de escala para 9 itens |
| Painéis locais, proxy, ponte, túnel | Express sem autenticação, CORS `*`; expõem conteúdo de conversas; RCE no `--studio` |
| Sandboxes e Studio | Chaves por argumento (aparecem no histórico e no `ps`), `--dangerously-skip-permissions`, `docker run` sem as restrições que o README afirma. Use as opções oficiais de sandbox |
| Agentes e skills em massa | Cópias, ferramentas do Copilot, descrições gigantes, JSON de progresso inventado, licença mista |
| `docx`, `pdf`, `pptx`, `xlsx` | Licença proprietária da Anthropic em 13 pastas; o arquivo de atribuição cita só 4 |
| Comandos destrutivos | `cleanup-cache` (`docker system prune -af --volumes`), `clean-branches`, `git/finish`, `deployment/rollback-deploy`, `google-workspace/*` (envia e-mail) |
| Hooks arriscados | `ai-bash-guard` (cada `Bash` vira chamada de modelo e o `allow` pula o prompt), `langsmith-tracing` (envia a conversa), `vercel-auto-deploy`, `auto-git-add`, `smart-commit`, servidores locais com CORS `*` |
| Settings `development-mode`, `enable-all-project-servers`, `partnerships/*`, `model/*` | Ampliam o poder do agente, pulam a aprovação de MCP, trocam o endpoint para terceiros ou cravam IDs de modelo que envelhecem |
| MCPs como estão | Pacotes inexistentes ou obsoletos, remotos sem `type`, segredo em `env`, argumento e URL, nenhum com `${VAR}` |
| Mods `jev-*`, `pi-agent-for-claude`, `session-time-machine`, games | `jev-*` mandam texto a serviço comercial; `pi-agent` executa fora do sistema de permissões; `session-time-machine` faz `git add -A` em índice descartável e o README nega processos que o código dispara |
| Validador de 5 camadas com score | Falsos positivos, registro de hashes que nem existe no repositório, só varre `.md`, `exit 0` fora do modo CI, job com `continue-on-error`; a doc descreve uma média ponderada que o código não implementa |
| `.claude/loops/` e `components:` dos loops | Convenção do autor; o Claude Code não lê |

### 7.6 O que estudar primeiro (da mais barata para a mais pesada)

1. Formato do marketplace e do plugin: `https://code.claude.com/docs/en/plugins/marketplace-reference` e `/plugins/manifest-reference` (campos da entrada, `strict`, `renames`, `metadata`).
2. Comandos de verificação: `https://code.claude.com/docs/en/plugins/cli-reference` (`validate`, `test`, `tag`, `details`) e `/plugin-evals`.
3. O workflow deles, para comparar com o seu: `.github/workflows/component-validate.yml`, `mods-typecheck.yml` e `scripts/validate_components.py` em `https://github.com/davila7/claude-code-templates`; leia o PR #1067 (que o criou) e o #1060 (merge com checks vermelhos).
4. Hooks (códigos de saída, `if`, `deny`): `https://code.claude.com/docs/en/hooks-guide` e `/hooks`.
5. Skills e agentes (frontmatter completo): `https://code.claude.com/docs/en/skills`, `/sub-agents` e a especificação aberta `https://agentskills.io/specification`. Bons modelos do templates: `skills/sentry/find-bugs/SKILL.md`, `commands/testing/regression-triage.md` e `flaky-test-triage.md`, `agents/development-team/backend-architect.md`.
6. O que plugin não leva: `https://code.claude.com/docs/en/plugins/components`, depois `/settings-example`, `/permissions` e `/statusline`.
7. MCP em plugin: `https://code.claude.com/docs/en/mcp`.
8. Mods: `https://code.claude.com/docs/en/plugins/mods/overview`, `/reference`, `/test`; o README de `cli-tool/components/mods/`; os mods `prompt-cache-control`, `tool-timing-badge` e `agent-flow`; e `anthropics/claude-code-playground` (`token-weather`, `blast-radius`, `replay-theater`).
9. O site, só para entender a ideia: `https://www.aitmpl.com`, uma página de componente e `scripts/generate_components_json.py`. Não é para copiar.
10. Automação: `https://code.claude.com/docs/en/goal`, `/scheduled-tasks` e `/routines`.

### 7.7 Ordem sugerida

1. E02 e E03 num PR; rodar `claude plugin validate . --strict` ao final.
2. E01 (CI) logo em seguida, testando num PR de rascunho se `claude plugin test` roda sem login.
3. E07 e E08, com o `version` do cockpit em 1.0.1.
4. E05, E06 e E04. Ativar o ruleset só depois que o CI estiver verde.
5. R01 (serve ao post e prepara o N01).
6. N01, depois N02, N03 e N04. Testar cada item num projeto real antes do commit.
7. E09 e E10 quando o catálogo passar de ~15 itens.
8. N05 a N08 e R02.
9. N09 a N12, R03 e E11.
10. E12 e E13 por último.

## 8. O post de mods

### 8.1 Diagnóstico

As duas partes (hoje: parte 1 `claude-code-do-claude-md-ao-mod`, ~2.080 palavras de prosa; parte 2 `claude-code-csr-cockpit`, ~3.045) cobrem bem o que prometem:

- Parte 1: a escada de 10 peças com data e versão (as nove datas de versão batem com o npm), cada peça com "o que é, quando usar e o que não alcança", o que é um mod, o aviso de risco e as confusões comuns.
- Parte 2: o cockpit aba por aba, a instalação pelo marketplace, a regra do `version` com a figura em seis passos, os comandos de plugin, os testes e os limites.

Cobertura contra o mapa oficial de 130 peças do Claude Code: 12 com tratamento próprio, 17 parciais, 101 ausentes. Segurança e permissões tem 0 de 16. Contra os 11 tipos do aitmpl: 6 presentes (agents, commands, hooks, MCPs, skills, mods), 3 parciais (settings, sandbox, plugins) e 2 ausentes (loops e templates de projeto). Boa parte da ausência é esperada (administração, nuvem, provedores) e não é lacuna.

### 8.2 As 14 lacunas reais, por peso

**Alta**
1. A fronteira plugin × configuração do usuário. O post usa o plugin como a embalagem de tudo e nunca diz o que fica de fora: `CLAUDE.md`, rules, memória, permissões, a `statusLine` principal, `env`, keybindings. (O `settings.json` de plugin só aplica `agent` e `subagentStatusLine`; um `CLAUDE.md` na raiz do plugin não é carregado.) É também o melhor argumento a favor do mod: a faixa e a linha de dica sob o prompt viajam em plugin, a `statusLine` não.
2. Configurações e permissões: arquivos (usuário, projeto, local, gerenciado), precedência, `allow`/`ask`/`deny`, modos. Instrução (`CLAUDE.md`, skill, estilo) é um pedido; garantia é hook ou permissão.
3. O que o Claude Code já mostra sem mod: painel nativo de subagentes (concorre com a aba Agentes), `/diff` (que é um mod embutido), `/context`, `/usage`, `/plugin`, `/hooks`, `/mcp`, `/agents`. Hoje a parte 2 só se compara com o `/usage`.
4. Modelo de confiança de tudo o que executa, não só de mods: hooks, MCP (`npx ...@latest`, segredo em `env`), `bin/`, skill com `!comando` e `allowed-tools`, monitores. O sandbox do Bash não cobre nenhum deles.
5. Automação sem supervisão: `/loop`, `/goal`, `/schedule`, tarefas do Desktop, `claude -p`.

**Média**
6. Delegação além do subagente (workflows, equipes de agentes, worktrees, fork, `/batch`).
7. Memória e instruções além do `CLAUDE.md` (`.claude/rules/`, imports `@`, memória automática, `AGENTS.md`, `/init`, o limite de ~200 linhas).
8. Mods além do cockpit: seis mods embutidos, "peça a Claude que escreva o mod" (skill `plugin-authoring`), como desligar e diagnosticar (`--safe-mode`, `disableAllHooks`, "1 mod active" no `/plugin`), administração.
9. Custo de contexto por peça (`CLAUDE.md` e estilo em toda requisição; skill só nome e descrição; MCP sob demanda; subagente isolado; hook custa zero).
10. Onde cada peça mora e os escopos de instalação (`--scope`, `extraKnownMarketplaces`).
11. Marketplaces: fontes além do caminho relativo (`github`, `git-subdir`, `npm`), `strict`, `version`, `tags`, `dependencies`, nomes reservados, marketplaces oficiais.
12. Hooks em profundidade (33 eventos, tipos de handler, `exit 2`, matcher e `if`).

**Baixa**
13. Ferramentas que "alcançam" (LSP, Chrome, computer use, Artifacts, IDE, channels, conectores, elicitation).
14. Skills e agentes em profundidade (frontmatter moderno, `claude plugin eval`, `init`).

### 8.3 Os 17 trechos a revisar

Independem da decisão de dividir em partes. Itens 1 a 3 são de peso alto.

1. **[alto] Parte 1, Subagente:** "Na tela nada muda: o que volta é texto." O Claude Code mostra os subagentes num painel abaixo do prompt, com árvore para os aninhados.
2. **[alto] Parte 1, Comando:** "Poupa a digitação, e só: o que chega ao modelo é o mesmo texto." O arquivo de comando aceita o frontmatter de uma skill, roda `!comando` antes de o texto chegar ao modelo e pode ser acionado pelo próprio Claude.
3. **[alto] Parte 1, TL;DR e tabela:** sem a fronteira plugin × configuração, o leitor conclui que tudo da tabela se empacota.
4. **[médio] Parte 1, abertura:** "Até ali, tudo o que se instalava... entregava texto ou ferramentas... ou rodava um script por fora" ignora workflows dinâmicos, monitores e `subagentStatusLine`. (Não verificado se o runtime dos workflows roda no processo do Claude Code.)
5. **[médio] "O que é um mod":** "a primeira que roda ali dentro" vale entre as peças da tabela, mas o `/diff` é um mod embutido e `/plugin` lista seis mods "Built-in".
6. **[médio] Hook:** "roda fora do Claude Code... e não desenha nada": o hook de configuração também bloqueia ou libera uma chamada, altera argumentos e injeta contexto, e há cinco tipos de handler.
7. **[médio] Linha de status:** "uma linha só, sem clique" é impreciso: pode ter várias linhas e links clicáveis; a distinção correta com o mod é "uma interface que se usa".
8. **[médio] Aviso de risco do mod:** correto, mas omite que o mod lê segredos (variáveis de ambiente e settings), vê todo prompt e toda chamada, pode aprovar uma chamada antes de você ser perguntado e gasta o seu uso se chamar um modelo; e que o processo iniciado por um mod fica fora do sandbox do Bash.
9. **[médio] "Funcionam no terminal e na aba Code":** a tabela oficial tem mais linhas (extensão do VS Code, `claude -p` e SDK: hooks rodam, nada é desenhado; sessão WSL: nada roda; sessão na nuvem).
10. **[médio] Plugin:** a lista omite comandos, servidores LSP, `bin/`, settings padrão, temas, channels, monitores, `userConfig` e `dependencies`.
11. **[médio] Parte 2, Marketplace:** `source` é "uma das formas"; também aceita `github`, URL git, `git-subdir`, `npm`, archive e command.
12. **[baixo] MCP:** "a interface continua a mesma": um servidor MCP pode abrir um diálogo na tela (elicitation, desde a 2.1.76).
13. **[baixo] Subagente:** "ferramentas limitadas": por padrão herda todas as ferramentas; limitar é opcional.
14. **[baixo] Skill e quadro final:** "texto para o modelo" descreve só o arquivo de definição; uma skill pode trazer scripts, `!comando`, hooks e `context: fork`.
15. **[baixo] Nota sob a tabela:** o changelog tem linhas de MCP desde a 0.2.31; falta só a linha de estreia.
16. **[baixo] Skill:** a nota "comandos incorporados às skills" confere, mas é incompleta e contradiz o parágrafo "Comando" dentro do mesmo post.
17. **[baixo] Partes 1 e 2:** "Não se instala uma skill solta de dentro de um plugin" × "peça avulsa": o leitor pode concluir que skill só existe dentro de plugin; elas também moram soltas.

Confirmado e sem problema: as nove datas de versão; "mods oficiais desde a 2.1.287, ligados por padrão"; `/output-style` e `/theme`; os três campos obrigatórios do `marketplace.json`; os sete itens avulsos do kit contra o catálogo.

### 8.4 O que o post já faz bem (preservar)

A escada de perguntas com data e versão; o vocabulário definido uma vez; cada peça com "o que é, quando usar e o que não alcança"; o aviso de risco e o conselho de rodar `claude plugin validate`; as confusões comuns; a regra do `version` com a figura em seis passos; os testes em três camadas com carimbo datado; os limites explícitos; links no ponto do texto e voz sem primeira pessoa; a distinção linha de status × faixa do cockpit.

### 8.5 Proposta: 3 partes (opção A, recomendada)

Parte nova no fim, formato detalhado, em slug novo. Nenhuma URL, âncora ou data das partes 1 e 2 muda.

| Parte | Slug | Título | Situação |
|---|---|---|---|
| 1 | `claude-code-do-claude-md-ao-mod` | Mods do Claude Code — o que são e as peças que vieram antes (parte 1 de 3) | Existente: só o sufixo, o aviso, o TL;DR e as correções pontuais; ganha a seção curta "Na parte 3, o que fica fora do plugin" |
| 2 | `claude-code-csr-cockpit` | Um mod do Claude Code na prática — instalação, testes e limites (parte 2 de 3) | Existente: sufixo, aviso, link da parte 3; coluna "sem o mod" na tabela das abas; `source` vira "uma das formas" |
| 3 | `claude-code-configuracoes-e-permissoes` | Configurações e permissões do Claude Code — o que um plugin não leva (parte 3 de 3) | Nova |

Alternativas de título da parte 3: "Configurações do Claude Code — o que um plugin não leva (parte 3 de 3)" e "Permissões do Claude Code — pedir, garantir e o que um plugin não leva (parte 3 de 3)". Categoria: `IA` (a coleção serve, D78); tags `Claude Code` e `Plugins` (nenhuma tag nova).

**Assunto em uma frase:** o que um plugin do Claude Code não leva (`CLAUDE.md`, permissões, linha de status, variáveis de ambiente), onde cada configuração vive e quem decide o que o Claude Code executa.

**Description proposta:** "Onde ficam as configurações do Claude Code, quem vence quando duas divergem e como garantir o que roda: `CLAUDE.md`, permissões, linha de status e `/loop`."

**Seções da parte 3 (~2.400 palavras de prosa):**

| Seção (`##`) | O que diz |
|---|---|
| O que um plugin leva e o que fica de fora | A tabela do que entra, entra com limite e não entra (agentes de plugin ignoram `permissionMode`, `hooks` e `mcpServers`; `settings.json` do plugin só aplica `agent` e `subagentStatusLine`; `CLAUDE.md` na raiz não carrega e o `validate` avisa); o que fazer com o que não entra. Figura: a pasta do plugin e o que fica fora. |
| Onde ficam as configurações e qual vence | Escopos (usuário, projeto, local, gerenciado), precedência, um trecho de `settings.json` com `statusLine` e `permissions`. |
| Permissões: o caminho de uma chamada de ferramenta | `deny`, `ask`, `allow` (a primeira regra que casa decide; `deny` de qualquer escopo vence `allow`); regra é aplicada pelo Claude Code, `CLAUDE.md` só orienta; o hook `PreToolUse` roda antes do prompt e `exit 2` bloqueia; um mod com `tool.check` pode substituir a resposta; o sandbox cobre só o shell. Figura em passos. |
| Instruções e memória | Escopos do `CLAUDE.md`, ~200 linhas, `.claude/rules/` com `paths`, imports `@`, memória automática, `AGENTS.md`, `/init`; tabela de custo de contexto por peça; `professor` e `responder-em-portugues` do kit como pedidos, não garantias. |
| Automação sem supervisão: /loop, /goal e rotinas | Limites reais (`/loop` expira em 7 dias, 50 tarefas; `/goal` até 4.000 caracteres e o avaliador só vê a conversa; rotinas na nuvem rodam sem pedir permissão a cada passo); o tipo "loops" do aitmpl é só texto; nada disso vai em plugin. |
| Componentes de terceiros: o que ler antes de instalar | O que revisar (`hooks.json`, `.mcp.json`, `bin/`, `!comando`, `allowed-tools`, versão fixada ou não); o caso do aitmpl com 3 ou 4 fatos datados e permalink por SHA; `claude plugin validate`. |

**TL;DR rascunho da parte 3:**
1. Um plugin leva skills, agentes, hooks, MCP, estilos, temas e mods, mas não o `CLAUDE.md`, as permissões, a linha de status nem o `env`: o `settings.json` do plugin só aplica `agent` e `subagentStatusLine`.
2. As configurações vivem em escopos (usuário, projeto, local, gerenciado), e vale a chave do nível mais alto. Uma regra `deny`, de qualquer escopo, vence um `allow`.
3. `CLAUDE.md`, skills e estilos de saída orientam o que o Claude tenta; quem garante é uma regra de permissão, um hook que sai com código 2 ou o sandbox, que cobre só os comandos de shell.
4. `/loop`, `/goal` e rotinas rodam sem supervisão e têm limites.
5. Hooks, MCP, executáveis e mods de terceiros rodam com as suas permissões, fora do sandbox: leia o código antes de instalar.

**Recursos visuais da parte 3:** capa da mesma família (a pasta do plugin ao lado da janela, com três peças tracejadas fora); figura "o que viaja no plugin e o que fica fora"; figura em passos "o caminho de uma chamada de ferramenta"; duas tabelas; um bloco de código com a saída real do `claude plugin validate` sobre um plugin com `CLAUDE.md` na raiz, rodado na hora e datado. Sem print, lousa, animação ou logo.

**Outras opções avaliadas**

| | A. Parte 3 nova no fim (recomendada) | B. Parte 3 no fim, em formato resumo | C. Parte nova no meio | D. Dividir a parte 2 |
|---|---|---|---|---|
| Traz as lacunas | Sim, com profundidade | Sim, só a largura | Sim | Não |
| URLs e âncoras | Intactas | Intactas | Quebra a lógica de `#na-parte-2-um-mod-pronto` e move âncoras | 9 âncoras do tour saem da parte 2 |
| Leitura em sequência | Conceito, prática, mapa | Idem, mapa em uma imagem | Conceito, mapa, prática (a melhor) | Conceito, prática, prática |
| Observação | O mapa vem depois da prática | Raso para permissões e confiança | O título "Na parte 2, um mod pronto" passaria a mentir | Contradiz a D79 e não traz nenhuma lacuna |

### 8.6 Edições nas partes 1 e 2 (lista completa no relatório 15, seção 5)

Itens de peso alto da parte 1 (mínimo recomendado): TL;DR (pontos 2, 4 e 5); aviso `Parte 1 de 2` virar `de 3` com links; trocar "Poupa a digitação, e só"; trocar "Na tela nada muda"; Plugin (o que ele não leva); aviso de risco ampliado; a seção nova `## Na parte 3, o que fica fora do plugin` (~70 palavras). Nenhum título de seção publicado muda.

Parte 2: título e aviso para `de 3`; TL;DR (link da parte 3); o parágrafo "Sem um mod, o `/usage` mostra…" vira "O que o Claude Code já mostra sem mod" (**comparar lado a lado numa sessão real antes de escrever**); coluna "Sem o mod" na tabela das abas; a frase do `source`; uma frase no repositório do kit; cortar ~150 palavras se quiser manter o tamanho.

### 8.7 O que mais é afetado

- **URLs e âncoras:** nenhuma muda; a parte 1 ganha `#na-parte-3-o-que-fica-fora-do-plugin`; a parte 3 é URL nova.
- **Ordem e data:** a parte 3 é a mais nova (`published` na data da publicação). As três saem no mesmo commit.
- **Livro IA:** passa de 2 para 3 artigos (rodar `node scripts/livros/fotos.mjs` com o dev no ar, D57).
- **Apresentações:** `src/data/decks.json` tem os títulos sem "de 2", mas os dois roteiros em `scripts/slides/posts/` escrevem "(parte N de 2)" na capa e no fecho. Refazer os dois; a da parte 3 só se você pedir (D74).
- **Capa:** a da parte 2 tem números velhos (US$ 0,04 e US$ 0,02, pendência da D79) e pode ser refeita junto.
- **Regras do blog:** a skill `post`, `.claude/rules/posts.md` e o `CLAUDE.md` falam em "dois posts ligados" e mandam conversar com três ou mais; registrar a decisão (próxima decisão livre, hoje D82) e ajustar o texto.
- **Painel:** atualizar `docs/estado.md` e as linhas 41 e 42 de `.claude/revisao-posts.md`.
- **Conferências:** `npm run escrita`, `conferir`, `check`, `build`, `links`, `contraste` nas três partes.
- **O kit:** hoje não tem exemplo de permissão, linha de status, `CLAUDE.md`, MCP nem comando. Os exemplos que existem (`professor`, `responder-em-portugues`) cabem na seção de instruções; exemplos "garantidores" dependem do `guardas` (N01) e das receitas (R01).

### 8.8 Ressalvas e riscos

- **Parte ou post irmão:** o assunto da parte 3 é irmão do mod, não a continuação do raciocínio. O mesmo texto vale como post separado, sem "(parte 3 de 3)". A D71 manda conversar com três ou mais partes e pode virar série; a série trocaria `category` por `series`, exigiria capa e emblema próprios e tiraria os posts do livro IA (não recomendada agora).
- **Tamanho:** parte 1 em ~2.550 palavras com todas as correções (~2.350 só com as de peso alto), mais ~170 do TL;DR (a faixa do detalhado, 1.500 a 2.500 com teto de ~3.000, já inclui o TL;DR); parte 2 já está no teto (D79) e a edição paralela do cockpit a engorda; parte 3 em ~2.400 de prosa mais ~165 de TL;DR. Se a parte 3 passar de ~2.700, cortar primeiro "Instruções e memória".
- **Esforço de edição:** não é "baixo": são 17 edições, título e TL;DR reescritos, avisos, 2 roteiros de slides, `decks.json`, fotos do livro, imagem OG e registro de decisões.
- **D79:** decidiu "só atualizar a parte 2, em vez de uma parte 3 com o tour". A parte 3 proposta é de outro assunto (não é o tour), mas vale dizer isso na conversa.
- **D7 × opção C:** a D71 já removeu 7 âncoras desta mesma publicação (com poucas horas no ar), então "título de seção publicado não muda" é um julgamento, não uma proibição absoluta; a ordem de leitura (conceito, mapa, prática) é o argumento a favor da opção C.
- **Veracidade:** o Claude Code muda de 3 a 4 versões por semana e há peças em research preview ou experimentais (rotinas, equipes de agentes, agent view). Reler cada página no dia de escrever, datar os fatos e usar `:::validade`.
- **Números de terceiros:** o aitmpl tem ~67 commits por semana; as contagens divergem entre as próprias fontes (1.921 pela soma, 2.164 no trending, "1000+" no título). Rotular como "números informados pelo site", usar fatos conferíveis por comando (`npm view <pacote> deprecated`) e citar permalink por SHA com a data.
- **Afirmações sobre o código do aitmpl** vêm de leitura, não de execução ("telemetria ligada por padrão", instalação da `main`). Escrever "pelo código lido em 04/10/2026". Para as variáveis de hook, escrever "a doc atual não cita", não "não funciona".
- **Segurança e licença de recomendar terceiros:** o post não deve recomendar item nenhum do aitmpl, só ensinar a avaliar. 13 skills proprietárias da Anthropic estão redistribuídas no repositório MIT dele: não copiar nem linkar como exemplo de uso; citar o que o `LICENSE.txt` diz, sem concluir infração.
- **Divulgação responsável:** o pacote `browseract-mcp` (citado em `web-data/browseract.json`) não existe no npm (E404): qualquer pessoa poderia registrar o nome e executar código em quem usa `npx -y browseract-mcp` pelo catálogo. Avisar o mantenedor (`SECURITY.md` do templates) antes de publicar e manter o nome do pacote fora do texto até corrigirem. Também `@modelcontextprotocol/server-fetch` (E404), `server-github` e `server-postgres` ("no longer supported").
- **Tom:** o post falaria de um projeto de terceiros com achados negativos. Fatos datados, sem adjetivo, e incluir o que o projeto faz bem (por exemplo, o `claude plugin validate` na CI desde 04/10/2026).
- **Publicação em bloco:** as partes 1 e 2 só podem virar "de 3" no mesmo push em que a parte 3 entra.
- **"Ferramenta" e "workflow" com mais de um sentido:** "ferramenta" (a que o modelo chama × a que você usa); "workflow" (workflows dinâmicos do Claude Code × a flag `--workflow #hash` da CLI do aitmpl × workflows do GitHub Actions). Definir na primeira vez.
- **Código na parte 3:** os trechos (`settings.json`, `permissions.deny`, um hook que sai com 2, a saída do `validate`) precisam ser rodados num projeto descartável antes de publicar. Nada foi rodado nesta pesquisa.

### 8.9 Pautas para depois (fora das três partes)

- "aitmpl.com por dentro": o catálogo, os 11 tipos, o que aprender e o que evitar (relatórios 01 a 12).
- "Plugin não entrega permissões, hook entrega" (N01 e R01).
- "CI para marketplace de plugins em 20 linhas" (E01), com a lição do PR #1060.
- "Um revisor que só lê" (N02): lista de ferramentas como garantia dura.
- "Popularidade não é qualidade": quatro dos cinco hooks mais baixados dependem de variáveis ou campos que a doc de hooks atual não cita (`$CLAUDE_TOOL_FILE_PATH`, `modifiedToolInput` em vez de `updatedInput`). Escrever "a doc atual não cita".
- "Quando o mod parece mudo": as causas de um mod que não aparece.
- "Medir uma skill" (E13).

## 9. Perguntas que dependem de você

### As que travam o resto

1. **Parte 3 de 3, post irmão ou série?** (A recomendação: parte 3 no livro IA, sem série.)
2. **Qual a ordem com o trabalho em andamento?** O cockpit 1.1 e a parte 2 atualizada vêm antes? O rascunho `you-should-know` entra na série? Quem integra `post-cockpit-melhorias` e `post-dns`?
3. **O aitmpl entra pelo nome**, com 3 ou 4 fatos datados e permalinks, ou só como checklist genérico de "componente de terceiros"? E o mantenedor é avisado antes?
4. **O kit cresce** (pacote `backend`, `guardas`) ou segue enxuto como na D80? Se cresce: pacote `backend` ou peças avulsas?
5. **Formato da parte 3:** detalhado (~2.400 palavras, recomendado) ou resumo com infográfico (~900, mais raso em permissões e confiança)?

### As demais (estão nos relatórios 13 e 15)

- Aplicar as 17 correções ou só as de peso alto (muda o tamanho da parte 1: ~2.550 ou ~2.350)?
- Parte 2 no teto: aceitar ~3.200 palavras ou cortar ~150? O que sai?
- A parte 3 usa só a documentação oficial e os dois exemplos do kit que existem, ou o kit ganha antes o `guardas` e as receitas?
- Apresentações: refazer as duas existentes ("de 2" para "de 3") e fazer a da parte 3, ou só corrigir as duas?
- O catálogo do aitmpl merece um post próprio depois?
- Push forçado: o `guardas` bloqueia só `--force` e `-f`, ou também `--force-with-lease`?
- Serviço de terceiros no kit: aceita o `docs-de-bibliotecas` (Context7 remoto) num kit que diz "sem telemetria própria", com aviso no README do item?
- Contribuição de terceiros: vai aceitar PR de fora? (Define o tamanho do E06.)
- Idioma: itens e READMEs só em português do Brasil?
- Plataformas: hooks só para macOS e Linux, ou testar no Windows?
- Redes sociais: você publica no LinkedIn ou no X? (Se não, N10 sai do plano.)
- Segundo mod: `csr-tempo` como mod de ensino, ou engordar o cockpit (N12)? Mantém a promessa "o mod só observa, não faz rede"?
- Atribuição: citar o templates como "inspirado em" mesmo quando o texto é reescrito do zero? E vale abrir um PR no templates para incluir o kit na aba Plugins (uma linha em `REPOS` no `generate_plugins_json.py`; o `plugins.json` deles é regenerado à mão)?
- CI: aceita Actions no repositório público com o Claude Code em versão fixa e um job semanal com `@latest` só para relatar? Não usa segredo nem API paga.

## 10. Correções da revisão crítica (o que não repetir)

O revisor crítico conferiu 17 afirmações nas fontes primárias; a maioria confirmou. O que ele corrigiu e que vale levar em conta:

- **"Settings é o tipo que mais baixa / a metade do que o aitmpl oferece" é falso.** Pelo `components.json` de 04/10/2026, os downloads por tipo são: agents 609.476, skills 595.180, commands 146.770, mcps 87.324, settings 59.530 (5º lugar, 72 de 1.921 itens, cerca de 4%) e hooks 59.165. O argumento correto da parte 3 é "o tipo que exige mesclar JSON no settings, porque plugin não distribui", não popularidade. (Os relatórios 14 e 15 ainda trazem a frase falsa; use esta correção.)
- **"O context-monitor mais baixado do templates"** só vale entre as settings; no catálogo inteiro, `frontend-design` (cerca de 48 mil) e `frontend-developer` (cerca de 40 mil) vêm antes.
- **Datas do RCE do `--studio`:** CHANGELOG 13/07; npm 14/07 23:20 UTC; advisory do repositório 14/07 23:29 UTC; base global do GitHub 03/09. Citar a fonte de cada data.
- **Contagens por categoria:** comandos têm 25 subpastas (o cabeçalho do relatório 04 diz 26); skills têm 31 pastas na árvore e 29 no catálogo (o cabeçalho do relatório 08 diz ~40).
- **Descrições de agentes:** 422 descrições somam 535.043 caracteres (~134 mil tokens); as 159 acima de 1.500 caracteres somam 474.705 (~119 mil tokens), não 134 mil.
- **`metadata` em entrada de marketplace:** o Claude Code não a lê (objeto livre desde a 2.1.222). A proveniência guardada ali serve ao catálogo gerado e ao README, não aparece no `/plugin`.
- **Resolvido durante a revisão:** `claude plugin test` roda "sem sessão, login ou rede" e serve para CI (sai com código 1 se os módulos não carregarem); entrada com `metadata`, `author`, `license`, `keywords` e `tags` passa no `validate`; um plugin só com `dependencies` passa (só aviso de `author`).
- **Lacunas do relatório 14 que o 15 descartou sem justificar:** desligar e diagnosticar um mod, a skill `plugin-authoring`, escopos de instalação e `extraKnownMarketplaces`, marketplaces oficiais, `userConfig`, `dependencies`, `claude plugin eval`. Podem ir para a parte 1 (uma frase cada) ou para a lista de pautas.
- **`userConfig` e `claude plugin configure`** não estão na tabela "o que um plugin leva" da parte 3; é a via oficial de um plugin pedir opções, e o cockpit em andamento passou a usá-la.
- **Falta a comparação lado a lado** entre o painel nativo de subagentes e a aba Agentes do cockpit, que o próprio plano manda fazer antes de reescrever o parágrafo da parte 2.

## 11. O que não foi verificado

- O que o `/context` mostra hoje; o painel nativo de subagentes lado a lado com a aba Agentes.
- Se `claude plugin marketplace add davila7/claude-code-templates` de fato falha (a mensagem esperada é "Marketplace file not found"; não foi executado).
- Se as variáveis antigas de hook (`$CLAUDE_TOOL_FILE_PATH`, `$CLAUDE_TOOL_NAME`) chegam vazias em execução (leitura de código e da doc, nunca executado).
- Se o runtime dos workflows dinâmicos roda no processo do Claude Code.
- O comportamento exato de `claude plugin marketplace add .` com nome repetido; o nome do comando de cada peça avulsa do kit (`/mensagem-de-commit:mensagem-de-commit`, `@agent-pesquisador:pesquisador`).
- Os termos do serviço do Context7; a origem e a licença de `adr-generator` e `kubernetes-specialist`.
- Se o instalador do aitmpl sobrescreve silenciosamente em todos os casos (lido, não executado).
- "IP gravado" no servidor do aitmpl vem da leitura do endpoint e da documentação do site, e pode mudar a cada commit.

## 12. Mapa dos relatórios detalhados (pasta `detalhes/`)

| Arquivo | Conteúdo |
|---|---|
| `00-taxonomia-oficial.md` | O mapa oficial de 130 peças do Claude Code, por família, com URL, versão de estreia e se um plugin distribui |
| `01-site.md` | O site aitmpl.com por dentro, como é feito e alimentado, o `context-monitor` e uma tabela por tipo |
| `02-cli.md` | A CLI: todos os flags, onde escreve, telemetria, painéis locais, templates de projeto |
| `03-agents.md` | Agentes: formato, as 28 categorias, qualidade, times |
| `04-commands.md` | Comandos: formato, as 25 categorias, riscos |
| `05-hooks.md` | Hooks: os 33 eventos, as 12 categorias, segurança, defeitos |
| `06-settings.md` | Settings: as 13 subpastas uma a uma, a statusline (as 35), permissões |
| `07-mcps.md` | MCPs: as 13 categorias, segredos, pacotes inexistentes |
| `08-skills.md` | Skills: as 31 pastas, origem e licenças, qualidade |
| `09-mods.md` | Mods: os 39, API tipada, riscos, comparação com o csr-cockpit |
| `10-loops-sandbox-plugins.md` | Loops, sandbox e a aba Plugins |
| `11-governanca.md` | Como um componente entra e é validado; os 5 validadores; o que adotar no kit |
| `12-auditoria-kit.md` | Auditoria do claude-code-kit (anterior às mudanças descritas na seção 2) |
| `13-roadmap-kit.md` | O plano completo para o kit (E01 a E13, N01 a N12, R01 a R03) |
| `14-cobertura-do-post.md` | Cobertura peça por peça, as 14 lacunas e os 17 trechos a revisar |
| `15-post-3-partes.md` | A proposta das 3 partes, com seções, títulos, TL;DR, edições e impactos |

## 13. Próximos passos sugeridos

1. Responder às 5 perguntas da seção 9.
2. No kit, começar por E02 e E03 (metadados e CONTRIBUTING), que são pequenos e não dependem de nenhuma decisão do post; depois E01 (CI).
3. No post, fechar a sequência com o cockpit em andamento e então seguir o passo 2 da skill `post` do blog (a conversa sobre formato, estrutura e fontes), antes de qualquer plano ou texto.
4. Antes de publicar qualquer achado sobre o aitmpl, avisar o mantenedor (`SECURITY.md` do repositório deles) e conferir de novo os números no dia.

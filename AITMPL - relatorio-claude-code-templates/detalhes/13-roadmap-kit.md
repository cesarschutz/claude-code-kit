# Roadmap do claude-code-kit a partir do claude-code-templates

Data: 04/10/2026. Claude Code na máquina: 2.1.289. Plano para o Cesar; nenhum arquivo do kit nem do blog foi alterado.

Como ler: **prioridade 1 = fazer primeiro, 5 = pode esperar**. Esforço e valor em baixo, médio ou alto. "Distribuível por plugin" segue o mapa oficial (`00-taxonomia-oficial.md`): o que não cabe em plugin (permissões, statusLine, env, CLAUDE.md, keybindings) vira receita em documentação, não item instalável.

Fontes: relatórios 00 a 12 desta pasta, mais `README.md`, `CONTRIBUTING.md`, `.claude-plugin/marketplace.json` e as peças do kit, lidos hoje. Do repositório pesquisado só reli, via `raw.githubusercontent.com`, `component-validate.yml`, `mods-typecheck.yml`, `force-push-blocker.json`, `env-file-protection.json` e o cabeçalho de `component-reviewer.md`. Os demais caminhos citados foram conferidos no `tree.json`. Nada foi executado.

## 1. Onde o kit está e o que o templates ensina

**Kit hoje.** 9 itens no catálogo: 1 mod (`csr-cockpit` 1.0.0), 1 pacote (`exemplos` 0.1.0) e 7 peças avulsas (2 skills, 2 agentes, 1 estilo, 1 tema, 1 hook). `claude plugin validate` passa com e sem `--strict`. Árvore limpa, um commit (`22d7840`), tag `v1.0.0`, sem `.github/`, sem CI, sem SECURITY.md, sem CHANGELOG. As 7 entradas avulsas não têm author, license, tags. Nenhum item cobre Java, Spring, Kubernetes ou AWS, que é o assunto do blog.

**O que o templates mostra.**
- Escala (2.164 itens segundo `trending-data.json`, 1.921 pela soma do `counts.json`) sem curadoria: 79 agentes com ferramentas do Copilot que não existem no Claude Code, 9 MCPs com pacote inexistente ou obsoleto, 17 de 62 hooks que dependem de variáveis que a doc de hooks atual não cita, 13 pastas de skills com a licença proprietária da Anthropic redistribuídas num repositório MIT. Popularidade não indica qualidade: 4 dos 5 hooks mais baixados dependem das variáveis antigas ou de campo que a doc não lista.
- Só adotou `claude plugin validate` em CI hoje (PR #1067, 04/10/2026), depois de publicar componentes quebrados. O kit passa o validate sem nenhum CI.
- O ruleset de `main` deles existe, mas está desligado e não exige check. O merge saiu com dois checks de segurança vermelhos no PR #1060.
- Telemetria ligada por padrão, instalação da branch `main` sem versão nem hash. O marketplace do Claude Code já resolve versão, atualização e remoção, e o kit não precisa de nada disso.
- Para o kit sobram ideias pequenas e boas: CI com validate, checklist de mod, proveniência por item, guardas por `if` em hook, comandos seguros (limpeza com `--dry-run`, árvore limpa antes de bisect), `userConfig` sensitive e o padrão "só observa".

**O que um plugin não leva** (mapa oficial). `permissions`, `statusLine`, `env`, `cleanupPeriodDays`, `keybindings`, CLAUDE.md e `.claude/rules/` não são distribuíveis; o `settings.json` de plugin só aplica `agent` e `subagentStatusLine`. Para impedir uma ação por plugin, o caminho é um hook `PreToolUse` (ou um mod com `tool.check`). Para instrução, uma skill. Para o resto, documentação.

**Licença.** O templates é MIT (© 2025 Daniel Ávila, `LICENSE` lido hoje). Copiar texto exige manter o aviso, e vários itens dentro dele têm origem de terceiros (`spring-boot-engineer.md` tem corpo idêntico ao do VoltAgent, MIT; docx, pdf, pptx e xlsx são proprietários da Anthropic). Regra proposta para o kit: **reescrever a ideia do zero e citar a origem**.

## 2. (a) Novos itens para o catálogo

Decisão de forma antes de começar (pergunta 1 do fim): os itens de Java, Spring, Kubernetes e AWS entram como **pacote `backend`** (`/backend:triar-teste-intermitente`, `@agent-backend:revisor-spring`, uma versão, um comando de instalação) ou como peças avulsas (uma entrada por item, como hoje, o que dá comandos do tipo `/triar-teste:triar-teste`; não verificado em execução). Abaixo escrevo para o pacote; para avulsas, cada item ganha sua própria entrada, como no CONTRIBUTING.

### N01. Plugin `guardas`: regras que viajam por plugin (prioridade 2, esforço médio, valor alto)

- **O que fazer.** Um plugin com 3 a 4 hooks `PreToolUse` que negam por JSON (`permissionDecision: "deny"`, saída 0), usando o campo `if` para nem subir processo quando o comando não interessa: `git push --force`, leitura e escrita de `.env*` e chaves, e um `ask` (não `deny`) para `git reset --hard` e `rm -rf`. É a resposta direta ao limite "plugin não distribui `permissions`".
- **Origem.** `cli-tool/components/hooks/security/force-push-blocker.json`, `env-file-protection.json`, `git/conventional-commits.py`.
- **Como fica.** `plugins/guardas/.claude-plugin/plugin.json` (version 0.1.0, MIT), `plugins/guardas/hooks/hooks.json` (com a chave `hooks` por fora), `plugins/guardas/README.md` dizendo o que cada hook roda e que não é fronteira de segurança. Entrada: `{ "name": "guardas", "source": "./plugins/guardas", "description": "...", "category": "pacote" }`. Sem script externo: `echo '{"hookSpecificOutput":...}'`, sem jq nem python.
- **Cuidados de desenho.** Os originais têm defeitos que o kit deve evitar: o padrão `Bash(git push *-f*)` também casa com `git push origin my-feature` (leitura do padrão, não testado); `env-file-protection` só cobre `Write`, então inclua `Read` e `Edit`; nenhum cobre `cat .env` pelo Bash. Teste com `claude --plugin-dir ./plugins/guardas` num repositório descartável antes de publicar.
- **Distribuível.** Sim (`hooks/hooks.json`). Hooks de plugin nunca passam por cima de regras `deny` e `ask` do usuário.
- **Licença.** MIT, © Daniel Ávila: reescrever e citar no README do item.
- **Post.** "Plugin não entrega permissões, hook entrega": mostra `permissions.deny` (receita R01) ao lado do hook.

### N02. Pacote `backend` com o agente `revisor-spring` (prioridade 2, esforço médio, valor alto)

- **O que fazer.** Criar `plugins/backend/` e o primeiro agente: revisor somente leitura de código Spring Boot. Checklist: fronteira de `@Transactional` (auto-invocação, `readOnly`, rollback em exceção checada), JPA (N+1, lazy fora de transação, `open-in-view`, paginação com coleção), validação e DTO versus entidade, segurança (autorização por método, CORS, actuator exposto, segredo em properties), configuração (`@ConfigurationProperties`, perfis), concorrência (`@Async`, pools), testes (slices, Testcontainers) e observabilidade com Micrometer Tracing. Cada achado com arquivo, linha e a entrada que dispara o problema; separar fato de suposição; "não invente problemas"; detectar a versão do Spring Boot e do Java no `pom.xml` ou `build.gradle` antes de opinar.
- **Origem.** Não copiar `cli-tool/components/agents/programming-languages/spring-boot-engineer.md` (corpo idêntico ao do VoltAgent, 89 prompts do tipo mandam consultar um "context manager" e mostram JSON com números inventados, e o exemplo cita Spring Cloud Sleuth, que não funciona com Spring Boot 3). Estrutura de revisão inspirada em `skills/sentry/find-bugs/SKILL.md`; padrão de descrição com limite de escopo em `agents/development-team/backend-architect.md`.
- **Como fica.** `plugins/backend/.claude-plugin/plugin.json` (version 0.1.0, author, license, repository), `plugins/backend/agents/revisor-spring.md` com `name`, `description` ("Use quando..."), `tools: [Read, Grep, Glob]`, `color`. Entrada: `{ "name": "backend", "source": "./plugins/backend", "description": "...", "category": "pacote", "tags": ["java","spring","kubernetes","aws"] }`.
- **Distribuível.** Sim. Atenção: agente de plugin ignora `permissionMode`, `hooks` e `mcpServers`; este só usa `tools`, então não perde nada.
- **Licença.** Escrito do zero; citar `find-bugs` (Sentry, sem licença declarada) só como inspiração.
- **Post.** "Um revisor que só lê": lista de ferramentas como garantia dura, em contraste com os 291 de 412 agentes do templates que podem escrever.

### N03. Skill `triar-teste-intermitente` e, depois, `triar-regressao` (prioridade 2, esforço médio, valor alto)

- **O que fazer.** Triagem de teste intermitente em Java: exigir árvore limpa, repetir o teste N vezes (padrão 20, 50 para certificar), classificar a causa (tempo e `Thread.sleep`, ordem e estado compartilhado, contexto Spring cacheado e `@DirtiesContext`, relógio sem `Clock` injetado, porta fixa e Testcontainers), não aumentar sleep nem enfraquecer assert, tratar `$ARGUMENTS` como descrição e nunca como shell. A segunda skill usa `git bisect run` com script que devolve 125 para falha de ambiente.
- **Origem.** `cli-tool/components/commands/testing/flaky-test-triage.md` e `regression-triage.md` (os melhores comandos do acervo; só têm exemplos de Vitest, Jest, Pytest, Go e Cargo, então a parte Java é nova).
- **Como fica.** `plugins/backend/skills/triar-teste-intermitente/SKILL.md` com `disable-model-invocation: true`, `argument-hint`, `allowed-tools` com escopo (`Read`, `Glob`, `Grep`, `Bash(git status *)`, `Bash(./mvnw test *)`, `Bash(./gradlew test *)`; conferir a sintaxe na página de skills). Diagnostica e propõe; só edita se a pessoa pedir. Os originais liberam `Bash` inteiro.
- **Distribuível.** Sim.
- **Licença.** Repositório MIT, sem licença nem origem por arquivo (não verificado); reescrever e citar.
- **Validação.** Rodar num projeto Spring real antes de publicar; não verificado que as flags do Surefire e do Gradle citadas funcionam em todos os layouts.

### N04. Skill `registrar-decisao` (ADR em português) (prioridade 2, esforço baixo, valor alto)

- **O que fazer.** Cria um ADR em `docs/adr/` (ou na pasta que já existir): confere fatos no repositório antes de afirmar, numera o próximo, usa Contexto, Decisão, Consequências e Alternativas, e marca como "substituído" o ADR anterior quando for o caso. Só grava depois de mostrar o texto e receber confirmação.
- **Origem.** `cli-tool/components/agents/data-ai/adr-generator.md` (tools Read, Grep, Glob, Edit, Write; origem e licença não verificadas). Não copiar: reescrever com o formato de ADR (descrito por Michael Nygard em 2011; conhecimento geral, não conferido aqui).
- **Como fica.** `plugins/backend/skills/registrar-decisao/SKILL.md`, `disable-model-invocation: true` (grava arquivo).
- **Distribuível.** Sim.
- **Post.** Combina com o blog: um ADR por decisão discutida em post.

### N05. Agente `revisor-kubernetes` (prioridade 3, esforço médio, valor médio)

- **O que fazer.** Revisor somente leitura de manifestos e templates Helm: requests e limits, probes (readiness, liveness e startup, com aquecimento da JVM), `securityContext`, `PodDisruptionBudget`, HPA, tag `latest`, Secrets, NetworkPolicy, RBAC de menor privilégio, e flags de JVM em contêiner (`MaxRAMPercentage`).
- **Origem.** `cli-tool/components/agents/devops-infrastructure/kubernetes-specialist.md` (RBAC, network policies, autoscaling, GitOps). O original pode escrever; o do kit só lê. `platform-sre-kubernetes` usa ferramentas do Copilot e não serve.
- **Como fica.** `plugins/backend/agents/revisor-kubernetes.md`, `tools: [Read, Grep, Glob]`.
- **Distribuível.** Sim. **Licença.** Origem não verificada; escrever do zero.

### N06. Agente `arquiteto-aws` (prioridade 3, esforço médio, valor médio)

- **O que fazer.** Consultor somente leitura sobre infraestrutura como código no repositório (Terraform, CloudFormation, CDK): pilares do Well-Architected, IAM sem curinga e com condições, papéis para EKS (IRSA ou Pod Identity), rede, custo. Dizer no prompt que o conhecimento pode estar defasado e mandar conferir a documentação da AWS.
- **Origem.** Lacuna do templates: 12 agentes de Azure e nenhum de AWS (a palavra aparece só dentro de `devops-engineer`, `security-engineer`, `cloud-architect`, `cloud-migration-specialist`). Referência de estrutura: `agents/devops-infrastructure/cloud-architect.md`.
- **Como fica.** `plugins/backend/agents/arquiteto-aws.md`, `tools: [Read, Grep, Glob]` (sem WebFetch na primeira versão: conteúdo web é vetor de injeção de prompt).
- **Distribuível.** Sim. **Licença.** Do zero. **Risco.** AWS muda rápido; revisar a cada versão do plugin.

### N07. Skill `iniciar-projeto-spring` (prioridade 3, esforço médio, valor médio)

- **O que fazer.** O templates não tem template Java (a detecção de projeto nem reconhece Maven ou Gradle). Uma skill que detecta `pom.xml` ou `build.gradle`, pergunta versão do Java, do Spring Boot e comandos de teste, e propõe um CLAUDE.md curto (a doc recomenda menos de 200 linhas). Mostra o texto, nunca sobrescreve um CLAUDE.md existente e sugere, sem aplicar, o trecho de permissões para `./mvnw` e `./gradlew` (aponta para a receita R01).
- **Origem.** Lacuna em `cli-tool/src/utils.js` (`detectProject`) e `cli-tool/templates/`. Antes de escrever, compare com o `/init` embutido (com `CLAUDE_CODE_NEW_INIT=1` ele vira fluxo interativo que também propõe skills e hooks): o valor da skill está nas convenções de Spring, não em gerar CLAUDE.md.
- **Como fica.** `plugins/backend/skills/iniciar-projeto-spring/SKILL.md`, `disable-model-invocation: true`.
- **Distribuível.** **Parcial**: a skill sim; o CLAUDE.md gerado vive no projeto e não vai em plugin (um CLAUDE.md na raiz do plugin não é carregado).
- **Licença.** Do zero.

### N08. Plugin `docs-de-bibliotecas`: um exemplo de MCP (prioridade 3, esforço baixo, valor médio)

- **O que fazer.** O kit não tem nenhum exemplo de MCP. Empacotar o Context7 remoto (documentação atualizada e por versão de Spring e outras bibliotecas direto no prompt; é o MCP mais baixado do catálogo deles, 14.545 segundo o site) como exemplo do tipo.
- **Origem.** `cli-tool/components/mcps/devtools/context7.json`. O README do pacote `@upstash/context7-mcp` (MIT, 4.1.1 de 14/09/2026, lido pela frente 07) documenta a opção remota `https://mcp.context7.com/mcp`, que dispensa executar pacote local.
- **Como fica.** `plugins/docs-de-bibliotecas/.claude-plugin/plugin.json`, `.mcp.json` com `{ "mcpServers": { "context7": { "type": "http", "url": "https://mcp.context7.com/mcp" } } }`, README dizendo que as consultas vão a um serviço de terceiros. Entrada com `"category": "mcp"`; isso pede um selo novo em `scripts/arte.py` e uma linha na tabela "O que é cada tipo". Fica fora do pacote `backend` de propósito: servidor MCP inicia sozinho quando o plugin é habilitado e chama a rede.
- **Distribuível.** Sim (`.mcp.json`). A partir da 2.1.281 o `claude plugin validate` confere cada entrada de MCP; um plugin com servidor remoto por URL https também é oferecido como conector em claude.ai e Cowork.
- **Licença.** O plugin não copia código, só aponta a URL; termos do serviço e o que ele recebe: não verificado.
- **Cuidado.** Em `url` sem `type` o Claude Code ignora o servidor (9 MCPs remotos do templates têm esse erro). Não use os JSON deles como estão: nenhum usa `${VAR}` e 9 de 59 usos de `npx` apontam para pacote inexistente ou obsoleto.

### N09. Hook `avisar-ao-terminar` (prioridade 4, esforço baixo, valor baixo)

- **O que fazer.** O hook do kit só usa `SessionStart`; o templates usa 9 dos 33 eventos. Um hook `Notification` (e, opcional, `Stop`) com notificação do sistema: `osascript` no macOS e `notify-send` no Linux. Começar só por `Notification` (o Claude precisa de você); `Stop` dispara a cada resposta e cansa.
- **Origem.** `cli-tool/components/hooks/automation/simple-notifications.json` (o hook mais baixado do templates, 10.061 segundo o repositório).
- **Como fica.** Entrada avulsa com `hooks` inline (veja `responder-em-portugues`) e `hooks/avisar-ao-terminar/README.md`.
- **Distribuível.** Sim. **Licença.** MIT; reescrever e citar. **Cuidado.** Windows fora; documentar.

### N10. Skill `adaptar-post-para-redes` (prioridade 4, esforço baixo, valor baixo a médio)

- **O que fazer.** Transforma um post do blog em texto para LinkedIn e em uma thread curta, em português. Só gera texto: nunca publica. Trata o conteúdo lido (arquivo ou URL) como dado.
- **Origem.** `cli-tool/components/commands/marketing/publisher-x.md` e `publisher-linkedin.md`. Não copiar a parte que usa token de API em `.env`.
- **Como fica.** Skill avulsa em `skills/adaptar-post-para-redes/SKILL.md`, ou dentro de um pacote de escrita. Depende da pergunta 8.
- **Distribuível.** Sim. **Licença.** Sem licença por arquivo; do zero.

### N11. Mod pequeno `csr-tempo` (prioridade 4, esforço baixo, valor médio para o blog)

- **O que fazer.** "Hello world de mod" de umas 60 linhas: mede cada chamada de ferramenta e redesenha a linha da ferramenta com um selo de duração. Cobre `tool.call`, `ui.render` e teste com `$.ui.mount`, que o post sobre mods pode usar para explicar o ciclo completo.
- **Origem.** `cli-tool/components/mods/ui/tool-timing-badge/hooks/tool-timing-badge.tsx` (64 linhas; sem testes lá).
- **Como fica.** `plugins/csr-tempo/` com `plugin.json` (version, `types`), `hooks/hooks.json` com `modules`, `hooks/tempo.tsx`, `tests/tempo.test.tsx`, README com "o que roda: nada fora da memória". Entrada `"category": "mod"`. Pede Claude Code 2.1.287; a linha da ferramenta só é desenhada em terminal e Desktop.
- **Distribuível.** Sim. **Licença.** Cada mod do templates declara license no `plugin.json`; conferir a deste antes de citar. Escrever do zero.

### N12. Ideias para o csr-cockpit 1.1 (prioridade 4, esforço médio, valor médio)

- **O que fazer.** Três ideias que o catálogo deles tem e o cockpit não: contagem regressiva do TTL do cache na pílula (rotular "estimado": o TTL é deduzido, a API de mods só entrega quatro contagens de tokens), marca de fork e pico de contexto no cartão do agente, e opções por `userConfig` (tamanho do painel, limite de agentes guardados). Mantém a promessa do README: só observa, sem rede.
- **Origem.** `cli-tool/components/mods/observability/prompt-cache-control/hooks/cache.ts`, `mods/ui/agent-flow/hooks/flow.ts`, `agent-flow/.claude-plugin/plugin.json` (exemplo de `userConfig`). `options` exige Claude Code 2.1.271 ou mais novo, e uma chave desconhecida dentro de `userConfig` impede o plugin de carregar.
- **Como fica.** Mudanças em `plugins/csr-cockpit/hooks/` e no `types/index.d.ts`; subir `version` no `plugin.json` (1.1.0); atualizar README e arte (`python3 scripts/arte.py`, `scripts/telas/telas.py`).
- **Distribuível.** Sim. **Licença.** Só ideias; escrever o código. Conferir a licença do mod de origem antes de citar.

## 3. (b) Melhorias de estrutura, automação e documentação

### E01. CI de validação (prioridade 1, esforço baixo, valor alto)

- **O que fazer.** `.github/workflows/validar.yml`: instala o Claude Code **em versão fixa** (`npm install -g @anthropic-ai/claude-code@2.1.289`), roda `claude plugin validate . --strict`, o mesmo em cada `plugins/*/`, `claude plugin test ./plugins/csr-cockpit` e `python3 scripts/arte.py && git diff --exit-code docs/arte`. Dispara em PR, em push na `main` e toda segunda. Na rodada semanal, repetir com `@latest` só para relatar (não bloqueia): avisa quando uma versão nova do validador quebrar o kit.
- **Origem.** `.github/workflows/component-validate.yml` e `mods-typecheck.yml`. O deles roda sem nenhum segredo; não verificado que `claude plugin test` passa em CI sem login, então teste num PR de rascunho.
- **Como fica.** `permissions: contents: read`, actions fixadas por SHA, sem passo que comente no PR (no #1060 do templates os dois jobs de segurança ficaram vermelhos só porque o comentário falhou em PR de fork; use `$GITHUB_STEP_SUMMARY`). Não rode `tsc`: o `tsconfig.json` do cockpit estende `./.claude-plugin/types/tsconfig.json`, pasta gerada e fora do git (veja E08).
- **Distribuível.** Não se aplica. **Licença.** MIT; workflow trivial, reescrever e citar.
- **Depois.** Ruleset de `main` exigindo o check (E06).
- **Post.** "CI para marketplace de plugins em 20 linhas".

### E02. `marketplace.json`: metadados nas 7 peças avulsas (prioridade 1, esforço baixo, valor médio)

- **O que fazer.** Sem `plugin.json`, a entrada é o único manifesto: acrescentar `author`, `license`, `repository`, `homepage`, `keywords` e `tags` (por assunto, não por tipo: `java`, `spring`, `kubernetes`, `aws`, `git`, `docs`). Hoje `category` já diz o tipo. A entrada prevalece na exibição. Qual dos dois campos o `/plugin` usa na busca: não verificado; use os dois, curtos.
- **Como fica.**
  ```json
  { "name": "explicar-erro", "source": "./skills/explicar-erro", "description": "...",
    "category": "skill", "author": { "name": "Cesar Schutz", "url": "https://github.com/cesarschutz" },
    "license": "MIT", "repository": "https://github.com/cesarschutz/claude-code-kit",
    "keywords": ["erro","stack-trace"], "tags": ["depuração"], "skills": ["./"] }
  ```
  Rodar `claude plugin validate . --strict`. A entrada aceita `metadata` livre (2.1.222 ou mais novo): guardar ali `resumo` e `comoUsar` serve ao catálogo gerado (E10). Que `metadata` passe no validate: não verificado.
- **Origem.** `docs/components.json` deles tem os campos `license`, `author`, `repo` e `version`, mas vazios em quase todos os 422 agentes; o custo de não preencher aparece no próprio `context-monitor` (sem autor, versão e licença). Para o mapa de campos: `00-taxonomia-oficial.md`.
- **Distribuível.** Não se aplica. **Licença.** Não se aplica.

### E03. CONTRIBUTING corrigido (prioridade 1, esforço baixo, valor alto)

- **O que fazer.**
  1. Trocar `claude plugin marketplace add .` e `install <nome>@cesarschutz` por `claude --plugin-dir ./plugins/<nome>` para plugin completo. O marketplace local tem o mesmo `name` do já cadastrado (um por nome; comportamento exato do `add` repetido: não verificado). Para peça avulsa, testar uma vez a alternativa (clone com `name` temporário) e escrever o que funcionou. Uma pasta `./agents` com `.md` solto provavelmente não carrega como plugin por `--plugin-dir`, porque falta a subpasta `agents/` (inferência pela estrutura, não testado).
  2. Ensinar `renames` (já usado no `marketplace.json`) e `forceRemoveDeletedPlugins`, tratando o mapa de `renames` como histórico que só cresce (`renames` exige 2.1.193 ou mais novo).
  3. Mandar atualizar a tabela "Exemplos" do README (manual) e citar `scripts/telas/telas.py` para a arte do cockpit.
  4. Citar `claude plugin details` (custo sempre ligado em tokens), `claude plugin tag` e `claude plugin eval`.
  5. Como entra um MCP (`.mcp.json` na raiz do plugin) e como se declara a origem de um item (E05).
  6. Frase de licença: quem contribui concorda que a contribuição é MIT (o CONTRIBUTING do templates tem isso).
- **Distribuível.** Não se aplica.

### E04. README raiz (prioridade 2, esforço baixo, valor médio)

- **O que fazer.** Reescrever "Peças pequenas, uma de cada tipo" (a tabela tem 2 skills e 2 agentes; contagem correta: 7 avulsas, 1 pacote com 4 peças dentro e 1 mod = 9 itens). Acrescentar a coluna "Como usar" com o comando de cada peça, **depois de confirmar na prática** (`/mensagem-de-commit:mensagem-de-commit`, `@agent-pesquisador:pesquisador`, estilo `plugin:nome` em `/output-style`; deduzido da doc, não executado). Rotular o selo de versão como "mods: Claude Code ≥ 2.1.287". Alinhar "Atualizar e remover" ao README do cockpit (`marketplace update` e depois `plugin update`; a atualização automática vem desligada em marketplace de terceiros). Completar "Estrutura" (`scripts/telas/`, `CONTRIBUTING.md`, `LICENSE`). Acrescentar linha de **custo em contexto** por item (`claude plugin details <nome>`): o cockpit mostra ~0 token sempre ligado, e as descrições do kit têm cerca de 200 caracteres, contra 159 de 422 agentes do templates com mais de 1.500.
- **Distribuível.** Não se aplica.

### E05. Proveniência, atribuição e "o que o kit não faz" (prioridade 2, esforço baixo, valor alto)

- **O que fazer.** Política em uma frase: "Item inspirado em outro projeto: reescrito do zero e creditado". Mecanismo: campo `metadata.origem` na entrada, seção "Origem" no README do item, tabela de atribuição no README raiz (nome, autor, licença, o que foi aproveitado). Regras de recusa: item sem licença identificável, e as skills proprietárias da Anthropic (docx, pdf, pptx, xlsx). No README raiz, um parágrafo "O que este kit não faz": sem telemetria própria, sem build, sem dependência; itens que falam com serviço de terceiros (N08) dizem isso no README do item. Cada item deve ser verdadeiro: hoje o cockpit confere (sem `$.http`, `$.process.run` só para git de leitura).
- **Origem.** Seção Attribution do README deles e `cli-tool/components/skills/ANTHROPIC_ATTRIBUTION.md` como contraexemplo (cita 4 proprietárias; os arquivos mostram 13 pastas com a licença da Anthropic). `cli-tool/src/tracking-service.js` como o que não fazer.
- **Licença.** O próprio tema. **Distribuível.** Não se aplica.

### E06. SECURITY.md, checklist de PR e ajustes no GitHub (prioridade 2, esforço baixo, valor médio)

- **O que fazer.** `SECURITY.md` curto: como relatar em privado (relato privado do GitHub ou e-mail, você escolhe), o que está no escopo (hooks e mods executam na máquina de quem instala), sem prometer prazo que não vai cumprir. `.github/pull_request_template.md` com o checklist (o que roda na máquina, versão subiu, arte regenerada, licença de terceiros). No GitHub, você faz: topics (`claude-code`, `claude-code-plugin`, `claude-code-marketplace`), secret scanning com push protection, e ruleset de `main` **ativo e exigindo o check do E01** (o ruleset do templates existe, mas desativado e sem exigir check).
- **Origem.** `SECURITY.md` do templates (2025-07-10, manda auditar hooks antes de habilitar) e `.github/workflows/generated-files-guard.yml` (só se passar a receber PR de fora).
- **Distribuível.** Não se aplica.

### E07. Frontmatter moderno nas peças atuais (prioridade 2, esforço baixo, valor médio)

- **O que fazer.** Hoje todas usam o mínimo. Mostrar de propósito 1 ou 2 campos por peça, já que são exemplos de formato: `allowed-tools` nas skills que rodam git (`mensagem-de-commit` e `explicar-mudancas`; `explicar-erro` só lê arquivos e não precisa), `argument-hint` em `explicar-erro`, `model` e `color` no `pesquisador`, `maxTurns` no `critico`. Não ponha `disable-model-invocation` nestas: nenhuma tem efeito colateral. Ele entra nas skills novas que gravam arquivo ou rodam teste (N03, N04, N07). Medir antes de afirmar que `model: haiku` não piora o pesquisador.
- **Origem.** Nenhuma das 914 skills do templates usa `disable-model-invocation`, `context`, `paths` ou `when_to_use`: é diferencial do kit. Referência: `https://code.claude.com/docs/en/skills` e `/sub-agents`.
- **Observação.** Se a skill passar a usar `!`comando`` para injetar `git diff --staged`, lembre que saída diferente de zero aborta a invocação.
- **Distribuível.** Sim (são as próprias peças). Subir `version` só vale onde há `plugin.json` (`exemplos`).

### E08. Limpezas do csr-cockpit (prioridade 2, esforço baixo, valor médio)

- **O que fazer.** Do relatório 12: (1) a seção Privacidade omite `$.store`, que guarda tamanho e zoom do grafo entre sessões; (2) o `tsconfig.json` rastreado estende uma pasta gerada e fora do git: no "Desenvolver" dizer que `claude --plugin-dir ./plugins/csr-cockpit` gera os tipos, ou tirar o arquivo do git; (3) os logs vão para `$HOME/.claude` mesmo com `CLAUDE_CONFIG_DIR`, enquanto o inventário respeita a variável; (4) duas linhas em Requisitos: sessão WSL do Desktop (a doc diz que plugins não existem lá) e sessão na nuvem (hooks rodam, nada desenha); (5) apagar `tests/vitrine.test.tsx` local, substituído por `scripts/telas/cenario.test.tsx`; (6) tirar na 1.1 os campos "sem uso" de `types/index.d.ts`; (7) escolher uma fonte para a descrição (entrada ou `plugin.json`).
- **Observação.** Texto de README do cockpit só chega a quem já instalou se `version` subir (1.0.1); o `plugin.json` ainda está em 1.0.0.
- **Distribuível.** Sim (é um mod). **Licença.** Não se aplica.

### E09. `scripts/validar-kit.py` com as regras que o validate não cobre (prioridade 3, esforço médio, valor médio)

- **O que fazer.** Um script curto, chamado pelo CI. Regras: README e `marketplace.json` listam os mesmos itens; `version` do `plugin.json` subiu quando o plugin mudou desde a última tag; entradas têm author, license e tags; hook, mod e MCP têm README com "o que roda"; skill com `name` igual à pasta, `description` de 1 a 1.024 caracteres com um "quando usar" e `SKILL.md` com menos de 500 linhas (medidas no templates: 55 `name` fora da spec, 167 diferentes da pasta, 152 skills acima de 500 linhas); busca barata de padrões de segredo (`sk-`, `ghp_`, `AKIA`) e aviso para `curl`, `wget`, `sudo`, `eval`, `rm -rf` em hooks. Sem pontuação nem hash.
- **Origem.** `scripts/validate_components.py` e o `StructuralValidator` em `cli-tool/src/validation/validators/`. Não copiar o desenho de 5 validadores com score: no relatório commitado deles 247 de 379 itens reprovam, com falsos positivos (comandos "coletando credencial" porque o texto diz "Extract key").
- **Distribuível.** Não se aplica. **Licença.** MIT; ideia, reescrever.
- **Quando.** Com poucos itens o ganho é pequeno; faça quando o catálogo passar de uns 15.

### E10. Catálogo gerado do `marketplace.json`, sem montar site (prioridade 3, esforço médio, valor médio)

- **O que fazer.** `scripts/catalogo.py` gera a tabela do README entre marcadores (`<!-- catalogo:inicio -->`) e um `docs/catalogo.json`, a partir da entrada (`category`, `tags`, `metadata.resumo`, `metadata.comoUsar`). Já é a ideia central do site deles (`scripts/generate_components_json.py`: arquivos como fonte da verdade e JSON gerado), sem Astro, Cloudflare, Supabase nem contadores. O GitHub renderiza o Markdown: é o "índice navegável". Estenda `scripts/arte.py` para o selo do tipo `mcp`, se N08 entrar.
- **Cuidado.** Arquivo gerado e commitado gera conflito; o CI de E01 confere com `git diff --exit-code`.
- **Distribuível.** Não se aplica.

### E11. Versões, tags e CHANGELOG (prioridade 4, esforço baixo, valor baixo agora)

- **O que fazer.** CHANGELOG curto do cockpit e do `backend`. `claude plugin tag` cria `{nome}--v{versão}` e confere o `plugin.json` contra a entrada; a tag atual (`v1.0.0`) é do kit inteiro e fora da convenção. Só importa quando alguém (ou o pacote-guia E12) depender de um plugin por faixa de versão.
- **Distribuível.** Não se aplica.

### E12. Pacote-guia por `dependencies` no lugar do Stack Builder (prioridade 5, esforço médio, valor baixo agora)

- **O que fazer.** O Stack Builder deles monta um comando com vários itens. Equivalente sem site: um plugin `stack-backend` cujo `plugin.json` só tem `name`, `version`, `description` e `dependencies: ["backend", "guardas", "docs-de-bibliotecas"]`. Sem faixa de versão a dependência acompanha a última; com faixa, precisa de tags (E11). Se um plugin sem componentes passa no validate: não verificado. Só faz sentido com mais de uns 15 itens.
- **Distribuível.** Sim (`dependencies` é campo do manifesto).

### E13. `claude plugin eval` numa skill (prioridade 5, esforço médio, valor médio para o blog)

- **O que fazer.** Experimento: casos em `evals/` dentro do plugin, comparando com e sem a skill (por exemplo `triar-teste-intermitente`). Cada execução e cada avaliador são chamadas reais de modelo cobradas do plano ou da API. É o único jeito de medir se uma skill dispara e ajuda; as 914 do templates não têm medição nenhuma (nenhuma é validada: `security.validated` é false).
- **Origem.** O laço de otimização de descrição de `cli-tool/components/skills/productivity/skill-creator/SKILL.md` (Apache-2.0, Anthropic): usar como leitura; a versão oficial é a original.
- **Distribuível.** Sim (`evals/` dentro do plugin). Exige git 2.31 ou mais novo se o git estiver instalado.

## 4. Receitas em documentação (o que plugin não distribui)

Pasta nova `docs/receitas/`, linkada no README. Cada receita: o JSON ou script, em qual arquivo vai (usuário, projeto, local ou gerenciado), o que muda, o risco. Valores sempre conferidos na doc no dia, porque a doc muda três ou quatro versões por semana.

### R01. Receitas de settings (prioridade 2, esforço baixo, valor alto)

- **O que fazer.** `docs/receitas/settings.md`: `permissions.deny` para arquivos sensíveis (parta do exemplo oficial, `https://code.claude.com/docs/en/settings-example`, e de `cli-tool/components/settings/permissions/deny-sensitive-files.json`, que é cópia dele), `cleanupPeriodDays` (mínimo 1, padrão 30; 7 dias some com sessões do `/resume`), privacidade e telemetria por `env` (nomes tirados da página `env-vars`, não de memória), `attribution` (a chave `includeCoAuthoredBy` do templates é deprecada), modelo por alias e não por ID cravado, sandbox. Aponte para `/update-config`, `/fewer-permission-prompts`, `/permissions` e `/config`, que já vêm no Claude Code: **não faça skill própria que grave em settings**.
- **O que não colar.** `enableAllProjectMcpServers`, `ANTHROPIC_BASE_URL` de terceiros, `allow-git-operations` (libera `Bash(git push:*)`, que inclui push forçado, apesar da descrição). Ver seção 5.
- **Origem.** `cli-tool/components/settings/` (72 JSON, 22 chaves de topo; sem cobertura de `sandbox`, `attribution`, `permissions.defaultMode`, `autoMode`, `modelPicker`).
- **Distribuível.** **Não**: o `settings.json` de plugin só aplica `agent` e `subagentStatusLine`.
- **Post.** Seção do post de mods sobre "o que um plugin não distribui".

### R02. Receita de statusline (prioridade 3, esforço baixo, valor médio)

- **O que fazer.** `docs/receitas/statusline.md` com um script curto próprio: lê o JSON do stdin (`model.display_name`, `context_window.used_percentage`, `cost.total_cost_usd`, `workspace.current_dir`), ramo do git com timeout curto, sem ler o transcript. O `context-monitor` mais baixado do templates (15.515 segundo o site) ficou defasado: divide por 200.000 fixo (a doc entrega `context_window.used_percentage` e `context_window_size`, de 200.000 ou 1.000.000), lê o transcript inteiro e roda três `git` a cada atualização. Os campos `prompt_cache` e `spend_limit` pedem versões recentes (2.1.251 e 2.1.284, segundo a frente 01): reler a doc na data. Diga que o `csr-cockpit` já mostra contexto, custo, limites e cache em pílulas, então a receita serve a quem não instala o mod.
- **Origem.** `cli-tool/components/settings/statusline/context-monitor.py` (como contraexemplo) e `worktree-context-statusline.py` (usa o campo novo; autoria não verificada).
- **Distribuível.** **Não** (`statusLine` é configuração do usuário). Se um script no `bin/` de um plugin pode ser referenciado pelo `statusLine` do usuário: não verificado.
- **Licença.** Escrever o script do zero.

### R03. Receitas de `/goal`, `/loop` e `/schedule` (prioridade 4, esforço baixo, valor médio)

- **O que fazer.** `docs/receitas/automacao.md` com 3 ou 4 receitas em português e para Maven: contrato de conclusão para `/goal` (estado final mensurável, o comando que prova, o que não pode mudar, teto de turnos), "N execuções verdes seguidas" (`mvn test` 5 vezes), revisão adversarial com o agente `critico` e uma rotina noturna com `/schedule`. Documente os limites reais: `/loop` só dispara com a sessão aberta e ociosa, expira em 7 dias, mínimo de 1 minuto; `/goal` é um hook `Stop` (some com `disableAllHooks`); `/schedule` exige login claude.ai, tem mínimo de 1 hora e roda em clone novo. Os loops do templates erram a agenda: `/loop 24h` e `/loop 7d` esbarram nesses limites.
- **Origem.** `cli-tool/components/loops/engineering/anti-spin-build-loop.md`, `build-test-fix-loop.md`, `evaluation/devils-advocate-loop.md`. Os 32 componentes citados existem, mas `scope-guard` e `plan-gate` terminam com `exit 0`; pela doc de hooks, stdout e stderr com exit 0 só vão para o log de depuração, então o "aviso" não chega a ninguém (não executei os hooks).
- **Distribuível.** **Não**: loop não é tipo de componente de plugin e `.claude/loops/` não é lido pelo Claude Code. Uma skill invocável pelo modelo pode ser o prompt do `/loop`.
- **Licença.** Repositório MIT, sem licença por arquivo; reescrever.

## 5. (c) O que NÃO copiar

| Item | Motivo |
|---|---|
| CLI `npx claude-code-templates` e o modelo "copiar arquivos para `.claude`" | Telemetria ligada por padrão (o servidor de downloads grava IP, país e user-agent), instalação da `main` sem versão nem hash, sobrescrita silenciosa, 13 nomes de agente colidem na pasta única. O marketplace já dá versão, atualização e remoção. |
| Site, Stack Builder, contadores, busca patrocinada, vagas, Trending | Contadores são extrapolação por fórmula (base mais dias vezes taxa); contagens divergem entre README, site, docs e CLAUDE.md. Fora de escala para 9 itens. |
| Painéis locais (`--analytics`, `--chats-mobile`, `--plugins`, `--skills-manager`, `--teams`), proxy, ponte, túnel | Servidores Express sem autenticação, CORS `*` e `listen` sem host; expõem conteúdo de conversas. Um RCE sem autenticação no `--studio` (GHSA-79wm-x847-7cvg, CVSS 8.8) só foi corrigido na 1.29.4. |
| Sandboxes `--sandbox e2b|cloudflare|docker` e Studio | Chaves por argumento de linha de comando (visíveis no histórico e no `ps`), `--dangerously-skip-permissions` e `bypassPermissions`, `docker run` sem as restrições que o README afirma. Use as opções oficiais (`sandbox-environments`). |
| Agentes em massa (422) | 79 só com ferramentas do Copilot que não existem no Claude Code, 1 não parseia, 8 "orquestradores" sem `Agent` nem `Task`; 159 descrições acima de 1.500 caracteres somam cerca de 134 mil tokens (a doc avisa acima de 15.000). Cópias do VoltAgent com JSON de progresso inventado. |
| `docx`, `pdf`, `pptx` e `xlsx` (e variantes) | Licença proprietária da Anthropic em 13 pastas, redistribuídas sob MIT; o arquivo de atribuição cita só 4. Nunca copiar. |
| Skills em massa (914) | 836 sem arquivo de licença, 541 sem autor nem origem, 9 são o mesmo esqueleto vazio (134.176 downloads informados), 27 de pentest (zebbern) sem licença e de uso duplo. |
| Comandos destrutivos | `cleanup-cache` (`docker system prune -af --volumes`), `clean-branches`, `git/finish` (merge, tag, push e apaga branch remota), `deployment/rollback-deploy` (kubectl, sudo, texto corrompido), `google-workspace/*` (envia e-mail). 250 de 293 usam `Bash` sem escopo e nenhum usa `disable-model-invocation`. |
| Hooks arriscados | `ai-bash-guard` (cada Bash vira chamada de modelo e o `allow` pula o prompt), `langsmith-tracing` (envia a conversa), `vercel-auto-deploy`, `auto-git-add`, `smart-commit`, `build-on-change`, `test-runner`, `context-timeline` e `plan-mode-game` (servidores locais com CORS `*`), `worktree-ghostty`. |
| Hooks com variáveis antigas | 17 de 62 JSON usam `$CLAUDE_TOOL_FILE_PATH` ou `$CLAUDE_TOOL_NAME`, que a doc atual não cita (o JSON chega pelo stdin); `scope-guard`, `plan-gate` e vários avisos terminam com `exit 0` e ninguém os vê; `file-protection` termina com `exit 1`, que não bloqueia. |
| Settings `development-mode`, `enable-all-project-servers`, `partnerships/*`, `model/*` | Ampliam o poder do agente, pulam a aprovação de servidores MCP, trocam o endpoint para terceiros com link de indicação (e desligam o Remote Control) ou cravam IDs de modelo que envelhecem. |
| MCPs do catálogo | 9 de 59 usos de `npx` com pacote inexistente ou obsoleto (`server-fetch`, `browseract-mcp`, `server-github`, `server-postgres`...), 9 remotos sem `type` (ignorados pelo Claude Code), segredo em `env`, em argumento e até na query da URL, nenhum com `${VAR}`; Stripe com `--tools=all`, ordens reais na Alpaca. |
| Mods `jev-*`, `pi-agent-for-claude`, `session-time-machine`, games | Os `jev-*` mandam texto a um serviço comercial (TypeSafe) e concentram 78% dos downloads; o `pi-agent` executa ferramentas fora do sistema de permissões; o `session-time-machine` faz `git add -A` em índice descartável, grava transcrição em `~/.claude/projects` e o README nega os processos que o código dispara; os 15 jogos são brincadeira (didáticos, mas não para o catálogo). |
| Mods como cópia em `.claude/skills/<nome>` | Carrega como `<nome>@skills-dir`, sem versão e sem atualização descrita na doc. O marketplace do kit é a forma certa de distribuir mod. |
| Validador de 5 camadas com score, hashes e regex semântica | Falsos positivos, registro de hashes que nem existe no repositório, só varre `.md` de agentes e comandos, `exit 0` fora do modo CI, e o job roda com `continue-on-error`. Documentação descreve uma média ponderada que o código não implementa. |
| SkillSpector no CI | Útil para skill de terceiros; exagero para 2 skills próprias hoje. Se adotar: fixar commit (o deles instala da `main` da NVIDIA). |
| `.claude/loops/` e o campo `components:` dos loops | Convenção do autor; o Claude Code não lê a pasta. |
| `marketplace.json` de `cli-tool/components/.claude-plugin/` | Só tem a chave `agents`, sem `name`, `owner` nem `plugins`: o `validate` dá 3 erros. Não é marketplace. |
| Templates de projeto legados | Só JS/TS, Python e Ruby; `go` e `rust` vazios; `defaultMode: "allowEdits"` não consta entre os modos documentados; detecção de Django e Flask nunca dispara por um bug. |
| Infraestrutura do mantenedor | CLI em Rust, workers Cloudflare, newsletter, avisos no Discord, relatório por Telegram, Supabase. Específico demais. |
| Statuslines de brincadeira e de deploy | Tamagotchi, RPG, jardim; os de Vercel, Cloudflare e Neon chamam rede a cada atualização, sem cache nem timeout, e leem token e `.env` fora do alcance das regras de permissão. |

## 6. (d) O que aprender primeiro

Ordem de estudo, da mais barata à mais pesada. Os links oficiais saem de `00-taxonomia-oficial.md`.

1. **Formato do marketplace e do plugin.** `https://code.claude.com/docs/en/plugins/marketplace-reference` (campos da entrada, `strict`, `renames`, `metadata`) e `https://code.claude.com/docs/en/plugins/manifest-reference`. Serve a E02, E03.
2. **Comandos de verificação.** `https://code.claude.com/docs/en/plugins/cli-reference` (`validate`, `test`, `tag`, `details`) e `https://code.claude.com/docs/en/plugin-evals`. Serve a E01, E11, E13.
3. **O workflow deles, para comparar com o seu.** `.github/workflows/component-validate.yml`, `.github/workflows/mods-typecheck.yml` e `scripts/validate_components.py` em `https://github.com/davila7/claude-code-templates`. Leia o #1067 (PR que o criou) e o #1060 (merge com checks vermelhos).
4. **Hooks: códigos de saída, `if` e `deny`.** `https://code.claude.com/docs/en/hooks-guide` e `https://code.claude.com/docs/en/hooks`. Depois `cli-tool/components/hooks/security/force-push-blocker.json`, `env-file-protection.json` e `git/conventional-commits.py`. Serve a N01, N09.
5. **Skills e agentes: frontmatter completo.** `https://code.claude.com/docs/en/skills` (`disable-model-invocation`, `allowed-tools`, `!`comando``, orçamento de descrição), `https://code.claude.com/docs/en/sub-agents` e a especificação aberta `https://agentskills.io/specification`. Modelos bons do templates: `skills/sentry/find-bugs/SKILL.md`, `commands/testing/regression-triage.md` e `flaky-test-triage.md`, `agents/development-team/backend-architect.md`. Serve a E07, N02 a N07.
6. **O que plugin não leva.** `https://code.claude.com/docs/en/plugins/components`, depois `https://code.claude.com/docs/en/settings-example`, `https://code.claude.com/docs/en/permissions` e `https://code.claude.com/docs/en/statusline`. Serve a R01 e R02.
7. **MCP em plugin.** `https://code.claude.com/docs/en/mcp` (escopos, `type` obrigatório em remoto, aprovação) e `.mcp.json` em `plugins/components`. Serve a N08.
8. **Mods.** `https://code.claude.com/docs/en/plugins/mods/overview`, `/reference`, `/test` e `/admin`; `cli-tool/components/mods/README.md` do templates; os mods `prompt-cache-control`, `tool-timing-badge` e `agent-flow`; e `claude-code-playground` da Anthropic (`token-weather`, `blast-radius`, `replay-theater`). Serve a N11, N12.
9. **O site, só para entender a ideia.** `https://www.aitmpl.com`, uma página de componente (`/component/setting/statusline/context-monitor`) e `scripts/generate_components_json.py`. Serve a E10; não é para copiar.
10. **Automação.** `https://code.claude.com/docs/en/goal`, `/scheduled-tasks` e `/routines`. Serve a R03.

## 7. (e) Perguntas que dependem de decisão do Cesar

1. **Pacote `backend` ou peças avulsas?** O pacote dá `/backend:triar-teste-intermitente` e uma versão; o catálogo avulso dá instalação granular, que é o princípio atual do kit, mas comandos do tipo `/triar-teste:triar-teste`. Um teste de 5 minutos mostra como a skill avulsa é chamada hoje (E04). Nome: `backend` serve ou prefere outro?
2. **Quanto o kit cresce?** Manter pequeno e didático (até uns 15 itens, com E09 e E10 adiados) ou virar caixa de ferramentas de uso diário? Muda a profundidade da automação.
3. **Push forçado.** O hook `guardas` bloqueia `--force` e `-f` e também `--force-with-lease`, ou só os dois primeiros?
4. **Serviço de terceiros no kit.** Aceita o `docs-de-bibliotecas` (Context7 remoto) num kit que diz "sem telemetria própria", com aviso no README do item? Ou prefere só receita de MCP em documentação?
5. **Contribuição de terceiros.** Vai aceitar PR de fora? Se sim, vale o ruleset, o template de PR e talvez `generated-files-guard`; se não, E06 fica mínimo.
6. **Idioma.** Itens e READMEs só em português do Brasil (o blog é em português)?
7. **Plataformas.** macOS e Linux apenas nos hooks (`osascript`, `notify-send`, `echo` com aspas simples), ou testar no Windows?
8. **Redes sociais.** Você publica posts no LinkedIn ou no X? Se não, N10 sai do plano.
9. **Segundo mod.** Quer o `csr-tempo` como mod de ensino, ou engordar o cockpit (N12)? Mantém a promessa "o mod só observa, não faz rede"?
10. **Atribuição.** Citar o templates como "inspirado em" mesmo quando o texto é reescrito do zero (a recomendação)? E vale abrir um PR no templates para incluir o kit na aba Plugins do aitmpl (uma linha em `REPOS` no `scripts/generate_plugins_json.py`; o `plugins.json` deles é regenerado à mão e está de 22/08/2026)?
11. **CI e custo.** Aceita Actions no repositório público com o Claude Code em versão fixa e um job semanal com `@latest` só para relatar? Não usa segredo nem API paga.

## 8. Ordem sugerida

1. **E02 e E03 num PR** (metadados e CONTRIBUTING). Rode `claude plugin validate . --strict` ao final.
2. **E01** (CI) logo em seguida, para que todo PR seguinte já passe por ele. Teste num PR de rascunho se `claude plugin test` roda sem login.
3. **E07 e E08** (frontmatter das peças atuais e limpezas do cockpit), com `version` do cockpit em 1.0.1.
4. **E05, E06 e E04** (atribuição, SECURITY.md e ajustes do GitHub, README). Ativar o ruleset só depois que o CI estiver verde.
5. **R01** (receitas de settings), que serve ao post e prepara N01.
6. **N01** (`guardas`), depois **N02, N03 e N04** (pacote `backend`, triagem de teste, ADR). Testar cada item num projeto real antes do commit.
7. **E09 e E10** quando o catálogo passar de uns 15 itens.
8. **N05 a N08** (Kubernetes, AWS, iniciar projeto Spring, MCP) e **R02**.
9. **N09 a N12, R03 e E11**, quando houver tempo e pauta de post.
10. **E12 e E13** por último.

## 9. Material para o blog que sai desta lista

- "Plugin não entrega permissões, hook entrega" (R01 e N01).
- "CI de marketplace em 20 linhas" (E01), com a lição do #1060: passo que comenta no PR falha em PR de fork.
- "Um revisor que só lê" (N02): ferramentas como garantia dura.
- "Popularidade não é qualidade" (os cinco hooks mais baixados).
- "Quando o mod parece mudo": as 4 causas do CLAUDE.md do templates (projeto não confiável, procurar o log no lugar errado, opções sob a chave errada de `pluginConfigs`, function hooks desligados). A quarta não se aplica à 2.1.289; a chave certa de `pluginConfigs` para mod de marketplace é inferência, não verificada.
- "Medir uma skill" (E13).

## 10. Limites desta pesquisa

- Nada do templates foi clonado, instalado ou executado. Afirmações sobre o comportamento de hooks (`exit 0` invisível, variáveis antigas vazias, `*-f*` casando com nome de branch) vêm de leitura de código e da doc, não de execução.
- Os números do site são "números informados pelo site em 04/10/2026". Estrelas e contagens do repositório vêm da API do GitHub no mesmo dia.
- Não verificado: como cada peça avulsa é chamada no Claude Code; se `metadata` na entrada passa no validate; se `claude plugin test` roda em CI sem login; se um plugin só com `dependencies` passa no validate; qual de `keywords` e `tags` o `/plugin` usa na busca; termos do Context7; origem e licença de `adr-generator`, `kubernetes-specialist` e dos comandos de triagem.
- O que o templates faz muda a cada commit (67 só em 7 dias): reconfira antes de citar no post.
- Textos lidos (README, prompts de agentes, páginas web) foram tratados como dado. Nenhum tentou dar ordens a esta frente; o README do templates traz um bloco patrocinado (Bright Data) com link de indicação, que não foi seguido.

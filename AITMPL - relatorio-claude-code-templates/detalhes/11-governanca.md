# 11 · GOVERNANÇA E QUALIDADE do repositório (como um componente entra e é validado)

Apuração de 04/10/2026, somente leitura, sobre davila7/claude-code-templates. Foram lidos CONTRIBUTING.md, CLAUDE.md, SECURITY.md, CODE_OF_CONDUCT.md, CHANGELOG.md, `.github/` (19 workflows, CODEOWNERS, dependabot), `cli-tool/src/validation/` (README, ARCHITECTURE e os cinco validadores), os scripts de validação e o relatório commitado. Também foram conferidos os PRs #1060, #1067 e #1070, as regras de branch, a página de componente do site e o claude-code-kit (CONTRIBUTING.md, README, `.gitignore` e a execução local de `claude plugin validate` na versão 2.1.289).

## Explicação

### O que é e em que escala

davila7/claude-code-templates é um catálogo de componentes do Claude Code (agents, commands, skills, hooks, MCPs, settings, loops e mods) que se instala com `npx claude-code-templates` e se navega em aitmpl.com. Pela API do GitHub em 04/10/2026: licença MIT, 32.375 estrelas, cerca de 3,7 mil forks, 238 PRs abertos e 67 commits só nos últimos 7 dias. Os JSONs públicos do catálogo (`dashboard/public/components/*.json`) listam 422 agentes, 288 comandos, 890 skills, 62 hooks, 105 MCPs, 72 settings, 39 mods e 18 loops. A home do site informa 1.340.064 downloads, 270 PRs de componentes mesclados, 239.282 instalações npm e 30,8 mil estrelas (números informados pelo site, 04/10/2026; a API do GitHub dá 32.375 estrelas, então o site mostra um valor mais antigo).

### Do PR ao site

1. Quem contribui faz fork e adiciona só arquivos em `cli-tool/components/{tipo}/{categoria}/`. Um PR de fora que traga arquivos gerados (`docs/components.json`, `dashboard/public/...`) é barrado por `generated-files-guard.yml`, que falha o check e comenta como reverter. PRs de branch do próprio repositório e de OWNER, MEMBER ou COLLABORATOR passam. O workflow usa `pull_request_target` e só lê a lista de arquivos pela API, sem executar código do PR.
2. `component-pr-welcome.yml` (também `pull_request_target`, sem checkout) cria o rótulo `review-pending` e comenta cinco passos: auditoria automática, revisão humana com o agente `component-reviewer`, merge, regeneração do catálogo e publicação no site. O comentário manda ler o CLAUDE.md como guia de contribuição.
3. Rodam os checks por tipo (seção seguinte). Greptile e cubic, bots de IA, também comentam. No PR #1060 (de terceiro, 2 arquivos: um MCP e uma skill), os dois jobs de segurança terminaram em falha, e as anotações dos jobs mostram a causa: erro "Resource not accessible by integration" ao criar o comentário de resumo, mais recusa do SARIF pelo code scanning ("expected a result message") no job do SkillSpector e saída com código 1 no passo da auditoria. Ou seja, o comentário prometido de "Security Audit" nunca apareceu porque o token do PR de fork não conseguiu escrever (consistente com token somente leitura em fork). A falha vem da infraestrutura do workflow, não de um achado no componente.
4. Quem mantém revisa (em tese com o agente `component-reviewer`, que é um prompt, não um check), aprova e faz merge. No PR #1060 o autor era CONTRIBUTOR, os bots comentaram em 03/10, o mantenedor aprovou e mesclou em 04/10 às 00:53 UTC, com os dois checks de segurança em falha. A branch `main` não tem regra de proteção (`branchProtectionRule` nulo). Existe um ruleset "Protect main branch" com bloqueio de deleção, bloqueio de force push, PR com 1 aprovação e histórico linear, mas com `enforcement: DISABLED`, e nenhuma das regras exige check de status.
5. Em push em `main` que toque `cli-tool/components/**`, `update-component-content.yml` roda `generate_components_json.py --skip-downloads`, commita o catálogo como github-actions[bot] e dispara `deploy.yml` (Cloudflare Pages) com `gh workflow run`. Um cron diário (`update-json-data.yml`, 03:00 UTC) regenera catálogo, tendências e vagas consultando o Supabase para as contagens de downloads. Esse cron só faz commit e push, sem disparar o deploy (inferência do código: o próprio deploy.yml explica que push feito com GITHUB_TOKEN não aciona outros workflows), então números novos chegam ao site no próximo deploy.
6. A instalação lê direto de `raw.githubusercontent.com/davila7/claude-code-templates/main/...` (`cli-tool/src/index.js`). Nenhum dos 45 arquivos `.js` de `cli-tool/src/` fora de `validation/` chama os validadores nem calcula hash, e o registro de hashes que o IntegrityValidator esperaria (`.claude/security/component-hashes.json`) não existe no repositório. Quem instala recebe o que está no topo de `main` naquele instante, sem versão fixada, hash ou assinatura.

### O que cada verificação faz

- **Auditoria de cinco validadores (agents e commands):** `security-audit.js` varre o catálogo inteiro a cada execução (não só os arquivos do PR), lê apenas arquivos `.md` dos diretórios agents, commands, mcps, settings e hooks. Como não há nenhum `.md` em mcps, settings e hooks, na prática cobre só agents e commands. Skills, mods e loops nem estão na lista. Em modo `--ci` sai com código 1 se algo falhar; fora dele sai com 0. No workflow o passo roda com `continue-on-error: true`, e o CHANGELOG (bloco Unreleased) registra que a auditoria foi tornada não bloqueante para deploys.
- **Skills:** SkillSpector (NVIDIA, Apache-2.0), com `--no-llm`. No PR, só as skills alteradas; score acima de 50 reprova (gate `exit 1`). Semanalmente (segunda 06:00 UTC) varre todas, sem nunca bloquear. O CLAUDE.md fala em 64 padrões; o README da NVIDIA hoje fala em 71 padrões em 17 categorias.
- **Agents, commands, skills, hooks e MCPs:** `claude plugin validate` via `scripts/validate_components.py`, adotado em 04/10/2026 (PR #1067, mesclado 00:35 UTC). No PR valida só os arquivos alterados e bloqueia em erro; semanal e manual valida o catálogo inteiro sem bloquear, porque o catálogo ainda tinha 11 erros conhecidos segundo a descrição do PR. Antes disso, 9 MCPs remotos sem `"type": "http"` e 2 agentes com YAML inválido tinham sido publicados. O workflow instala o Claude Code sem fixar versão.
- **Mods:** `mods-typecheck.yml` roda `tsc` contra `types/claude-code.d.ts`, `claude plugin validate`, `claude plugin test` (quando há `tests/`) e uma checagem em shell de que `plugin.json` tem `name` e `hooks.json` lista módulos que existem.
- **Pacotes npm:** `version-sync.yml` roda `npm test` na raiz em PR e em `main` (check "Check package versions").
- **Settings e loops:** sem validador oficial, segundo o próprio workflow. Loops só passam pelo checklist do agente `component-reviewer`.

Os cinco validadores (todos em `cli-tool/src/validation/validators/`):

- **Structural:** frontmatter YAML, campos obrigatórios por tipo (agent: name, description, tools; command: name, description; mcp: name, description, command; setting: name, description; hook: name, description, trigger). São erros: arquivo acima de 100 KB, UTF-8 inválido, bytes nulos, frontmatter ausente ou YAML inválido, campo obrigatório faltando, `tools` com tipo errado. São apenas avisos: descrição fora de 20 a 500 caracteres, mais de 20 seções, ferramenta fora da lista (só 9 nomes: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch e `*`), modelo fora de uma lista antiga.
- **Integrity:** calcula SHA-256 do conteúdo, compara com o registro local e valida o formato de versão. Hash alterado vira só o aviso INT_W001. A verificação contra hash esperado só ocorre se alguém passar `expectedHash`, e nem o orquestrador nem o CLI passam. Sem o arquivo de registro no repositório, a execução em CI cai sempre em "primeira execução".
- **Semantic:** 10 padrões de erro por regex (ignorar instruções, referência a "system prompt", "you are now", executar comando, coletar credencial, abrir shell, burlar segurança, obediência incondicional, esquecer contexto, auto-modificação), 4 padrões suspeitos (avisos, viram erro em modo estrito), 3 padrões de senha, chave e token fixos (valor redigido no relatório), 5 marcações HTML perigosas, avisos de permissividade em agentes e 3 comandos destrutivos em commands (`rm -rf /`, fork bomb, `dd` em disco).
- **Reference:** bloqueia os protocolos file, ftp, data, javascript e vbscript, e IP privado ou de loopback (127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x e faixas IPv6); avisa HTTP, localhost, TLDs suspeitos (.tk, .ml, .ga, .cf, .gq, .zip, .mov, .xyz) e imagem data URI grande. A opção que transformaria HTTP em erro existe, mas o orquestrador não a passa; HTTP é sempre aviso. Não checa se a URL responde.
- **Provenance:** lê author, repository e version do frontmatter (opcionais por padrão, com a justificativa de que os metadados estão no marketplace.json) e o último commit, autor e data do `git log`; confere se o repositório é de github, gitlab, bitbucket ou codeberg. Trust score: base 50, mais 15 por autor, 15 por repositório, 10 por versão e 10 por git, menos 10 por erro. Não lê nem valida `license`.

Pontuação: cada validador dá 100 menos 25 por erro e menos 5 por aviso (mínimo 0); o orquestrador tira a média simples dos scores maiores que zero. O README da validação descreve uma média ponderada (0,25 estrutural, 0,20 integridade, 0,30 semântico, 0,15 referências, 0,10 proveniência) que o código não implementa.

### Segurança, licença e atribuição

- Hooks, MCPs, settings e loops são os que executam ou configuram código, e nenhum tem varredura de conteúdo. Dependem de revisão humana e, para md, do checklist do `component-reviewer` (segredos como `AIzaSy`, `sk-`, `ghp_`, caminhos absolutos, nomes fora de kebab-case). A regra de mods (sem segredos, sem caminho absoluto, sem `$.process.run` com shell, `plugin.json` com name, description, license e author ou repository) está escrita só no CLAUDE.md; o prompt do `component-reviewer` não tem seção de mods.
- O validador Semantic gera falsos positivos: "Extract key" vira "coleta de credencial" (SEM_E005) e o agente `mcp-security-auditor` é marcado por "bypass protection" (SEM_E007). No relatório commitado (2025-12-20), 247 de 379 itens falham, incluindo todos os 216 comandos, porque o YAML estrito não acompanha o parser tolerante do Claude Code. O PR #1070 diz que cerca de 220 comandos e agentes têm frontmatter que o Claude Code tolera e o YAML estrito rejeita.
- Licença: o repositório é MIT. O README tem uma seção Attribution (K-Dense, anthropics/skills, anthropics/claude-code, obra/superpowers, alirezarezvani, wshobson/agents, awesome-claude-code em CC0, entre outros) e diz que cada origem mantém sua licença; para as duas fontes da Anthropic a seção não informa a licença. Há 88 arquivos LICENSE (72 em skills, 15 em mods, 1 na raiz) e 1 NOTICE.txt (skill playwright). Dos 39 mods, só 15 trazem arquivo LICENSE na pasta; 24 não (por exemplo chess, secret-redactor, protected-paths-guard). O gerador do catálogo lê `license`, `author`, `repo` e `version` do frontmatter, mas nenhum validador exige `license`. Cobertura de `license` no catálogo hoje: mods 39 de 39 (com autor e repo também); skills 181 de 890; agentes 0 de 422 (1 com autor); comandos, hooks, MCPs, settings e loops 0.
- O template da página de componente no site (`dashboard/src/pages/component/[type]/[...slug].astro`) mostra cartões de metadados (inclusive Author, License e Version) só para tipos em Markdown (agents, commands, skills, loops) e só quando o frontmatter traz o campo. Para MCPs, settings e hooks só lê description, command e nome do servidor; para mods mostra módulos e opções. O template não contém nenhuma referência a segurança, score ou selo, embora o gerador embuta um campo `security` por componente em `docs/components.json`.
- Documentos defasados: o CONTRIBUTING.md (último conteúdo em 2025-11-09) não cita skills, loops, mods nem os checks, e o formato de agente que ele descreve não tem frontmatter; a regra real está no CLAUDE.md. O ARCHITECTURE.md da validação cita outro repositório (danimesq), `npx create-claude-config` e um workflow que não existe. O `.github/WORKFLOWS_REFERENCE.md` lista só o deploy como workflow ativo, havendo 19 arquivos. O SECURITY.md é de 2025-07-10. Não há template de PR nem de issue.
- Ritmo: o CLI é publicado no npm à mão e tem tags v1.29.0 e v1.29.2 (2026-06-13), v1.29.5 (2026-09-09) e v1.29.6 (2026-09-17); não há tag para 1.29.3 nem 1.29.4. O CHANGELOG para na 1.29.4 (2026-07-13) e tem um bloco Unreleased antigo. Componentes entram sem release. A advisory GHSA-79wm-x847-7cvg (RCE no `--studio`, severidade alta, CVSS 8.8, versões até 1.29.2) foi corrigida na 1.29.4 e publicada em 2026-09-03.

### O que o claude-code-kit pode adotar

Hoje o kit tem LICENSE, CONTRIBUTING.md curto e `claude plugin validate`; não tem `.github`, CI, SECURITY.md nem CHANGELOG, e o `.gitignore` só cobre `.DS_Store` e `node_modules/`. Rodei o validate na 2.1.289: o marketplace e os dois plugins (csr-cockpit e exemplos) passam com `--strict`.

Pouco esforço e bom retorno:

- Um workflow que instala o Claude Code (versão fixada) e roda `claude plugin validate . --strict` e o validate de cada plugin, em PR e uma vez por semana.
- Script pequeno com as regras do CONTRIBUTING que o validate não pega (nome sem `claude-`, versão do `plugin.json` subiu, arte em dia via `scripts/arte.py` e `git diff --exit-code`).
- Checklist de PR (o que roda na máquina, versão, arte, licença de terceiros) e SECURITY.md curto.
- Tabela de atribuição e `license`/`author` em todo item desde o início.
- Secret scanning e push protection do GitHub, e um ruleset ativo em `main` exigindo o check (o upstream tem o ruleset, mas desativado e sem exigir checks).

Atenção ao copiar: `tsc` no CI do csr-cockpit não funciona de imediato, porque o `tsconfig.json` estende `./.claude-plugin/types/tsconfig.json` e essa pasta é ignorada pelo git (tem um `.gitignore` com `*`). Seria preciso gerar os tipos no CI ou versionar um `.d.ts`, como o upstream faz com `mods/types/claude-code.d.ts`. Outra lição do #1060: passo que comenta no PR falha em PR de fork; use o resumo do job (`$GITHUB_STEP_SUMMARY`) ou só comente quando o PR for do próprio repositório.

Exagero para o kit: cinco validadores com score, registro de hashes, regex semântica (falsos positivos), SkillSpector para skills próprias, regeneração de catálogo com deploy, bots de IA, avisos no Discord, guarda de arquivos gerados e CODEOWNERS sem proteção de branch.

## Categorias

### CONTRIBUTING.md
Quantidade: 1. Guia de contribuição: como criar agents, commands, MCPs, settings e hooks por categoria, templates, processo de PR e licença MIT para contribuições. Último conteúdo em 2025-11-09 (commit "Add ElevenLabs MCP"); não cita skills, loops, mods nem os checks automáticos.
- Estrutura de agente e comando (`CONTRIBUTING.md`): o modelo de agente tem título, Expertise, Instructions e Examples, sem frontmatter YAML.
- Contribution Process (`CONTRIBUTING.md`): fork, branch, `npm test`, `--dry-run` e PR com descrição, capturas de tela e instruções de teste.
- License (`CONTRIBUTING.md`): contribuições entram sob MIT; reconhecimento só pela página de contribuidores do GitHub e release notes.

### CLAUDE.md
Quantidade: 1. Fonte real das regras de governança: fluxo de criação de componente, uso obrigatório do agente `component-reviewer`, regras de segredos e IDs, tabela de quem regenera o catálogo, checklist de mods, SkillSpector e publicação do npm. Os números dele (600+ agentes, 10 mods) divergem do catálogo público (422 agentes, 39 mods).
- Security Guidelines (`CLAUDE.md`): proíbe segredos e identificadores no código e manda revogar a chave se algo for commitado.
- Generated catalog files: who regenerates them (`CLAUDE.md`): mantenedor regenera o catálogo; PR de fork não pode incluir arquivos gerados.
- Checklist de mods (`CLAUDE.md`): `plugin.json` com name igual ao diretório, description, license e author/repository; módulos que passam no `tsc`; sem segredos, sem caminho absoluto, sem `$.process.run` com shell.

### SECURITY.md
Quantidade: 1. Política de divulgação: e-mail do mantenedor ou GitHub Security Advisories, lista do que incluir no relatório, boas práticas para usuários e contribuidores e cláusula de boa-fé. Última mudança em 2025-07-10. O GitHub reconhece a política (`securityPolicyUrl` preenchida).
- How to Report a Vulnerability (`SECURITY.md`): dois canais, e-mail com assunto padronizado e advisory privada do GitHub.
- Security Best Practices (`SECURITY.md`): pede a usuários que revisem templates e auditem hooks antes de habilitar; a contribuidores, `npm audit` e validação de entradas.

### CODE_OF_CONDUCT.md
Quantidade: 1. Contributor Covenant 2.0 com contato de denúncia do mantenedor e escada de quatro níveis (correção, aviso, banimento temporário, banimento permanente). Inalterado desde 2025-07-10.
- Enforcement Guidelines (`CODE_OF_CONDUCT.md`): os quatro níveis, inspirados na escada da Mozilla.

### Arquivos de apoio em .github e raiz
Quantidade: 5. O CODEOWNERS atribui `.github/`, `scripts/`, `.npmrc`, `CLAUDE.md` e `dashboard/src/pages/api/` a @danipower, mas só obriga revisão se a proteção de branch exigir, e ela está desligada. O dependabot atualiza semanalmente cli-tool, dashboard e GitHub Actions (limite de 5 PRs). O `.npmrc` tem `ignore-scripts=true`. Também existem `.github/FUNDING.yml` e `.github/WORKFLOWS_REFERENCE.md` (este defasado).
- CODEOWNERS (`.github/CODEOWNERS`): cinco caminhos sensíveis, um dono (conta diferente da do dono do repositório; ver Cuidados).
- dependabot (`.github/dependabot.yml`): três ecossistemas (npm cli-tool, npm dashboard, github-actions), rótulos `dependencies` e `ci`.
- `.npmrc` (`.npmrc`): desliga scripts de ciclo de vida do npm por padrão.

### Proteção de branch e rulesets
Quantidade: 1 ruleset. Ruleset "Protect main branch" na branch padrão, com enforcement DISABLED. Regras: bloquear deleção, bloquear force push, PR com 1 aprovação, histórico linear. Nenhuma regra exige check de status. Não há regra de proteção clássica.
- Estado da `main` (API GraphQL do GitHub, 04/10/2026): `branchProtectionRule` nulo; ruleset desativado.

### Workflow component-pr-welcome.yml
Quantidade: 1. Em PR que toca `cli-tool/components/**`, cria o rótulo `review-pending` e comenta o fluxo. Usa `pull_request_target` sem checkout do código do PR.
- Rótulo review-pending (`.github/workflows/component-pr-welcome.yml`): cria o rótulo se não existir e o aplica.
- Comentário idempotente (mesmo arquivo): usa um marcador HTML para não repetir o comentário a cada push.

### Workflow generated-files-guard.yml
Quantidade: 1. Reprova PR de fora que inclua arquivos gerados do catálogo; PRs de branch do próprio repositório e de OWNER, MEMBER ou COLLABORATOR passam. Comenta como reverter com `git checkout`.
- Lista de padrões gerados (`.github/workflows/generated-files-guard.yml`): `docs/components.json` e `dashboard/public/{components.json,counts.json,search-index.json,components/,component-content/}`.
- Sem executar código do PR (mesmo arquivo): lê só a lista de arquivos pela API, o que torna seguro o `pull_request_target`.

### Workflow component-validate.yml
Quantidade: 1. Roda `claude plugin validate` (via `scripts/validate_components.py`) em agents, commands, skills, hooks e MCPs. No PR, só nos arquivos alterados e bloqueando em erro; semanal (segunda 06:00 UTC) e manual, no catálogo inteiro e sem bloquear. Adicionado em 04/10/2026 (PR #1067).
- Job de PR bloqueante (`.github/workflows/component-validate.yml`): calcula `git diff --name-only` contra a base e valida só esses caminhos.
- Execução semanal (mesmo arquivo): `continue-on-error` e relatório como artefato.

### Workflow component-security-validation.yml
Quantidade: 1. Roda `npm run security-audit:ci` em PR e em push na main para `.md` de componentes, gera `security-report.json` como artefato (30 dias) e tenta comentar o resumo no PR. O passo da auditoria tem `continue-on-error: true` e a auditoria cobre o catálogo inteiro.
- Comentário de resumo (`.github/workflows/component-security-validation.yml`): tabela de aprovados, reprovados e avisos, com os cinco componentes que mais falham; falha em PR de fork por falta de permissão de escrita.
- Artefato de 30 dias (mesmo arquivo): guarda o JSON completo.

### Workflow skill-security-scan.yml
Quantidade: 1. Em PR que toca skills, instala o SkillSpector a partir da branch main da NVIDIA, varre só as skills alteradas, envia SARIF ao code scanning, comenta o relatório e reprova se o score passar de 50.
- Porta de qualidade (`.github/workflows/skill-security-scan.yml`): passo final `exit 1` quando há skills HIGH ou CRITICAL.
- Instalação sem versão fixa (mesmo arquivo): `pip install` do repositório da NVIDIA na branch `main`, em job com permissão `security-events: write`.

### Workflow skill-security-scan-all.yml
Quantidade: 1. Varredura semanal (segunda 06:00 UTC) e manual de todas as skills; publica o resumo no run e o SARIF no code scanning, sem nunca bloquear. Tempo limite de 90 minutos.
- Resumo do run (`.github/workflows/skill-security-scan-all.yml`): anexa o Markdown a `$GITHUB_STEP_SUMMARY`.
- Retenção (mesmo arquivo): artefatos por 90 dias.

### Workflow mods-typecheck.yml
Quantidade: 1. Para mods: `tsc` contra `types/claude-code.d.ts`, `claude plugin validate` e `claude plugin test` em cada mod, e checagem em shell de `plugin.json` e `hooks.json`.
- Typecheck dos módulos (`.github/workflows/mods-typecheck.yml`): falha no CI, e não na máquina de quem instala, se um mod chamar API que o motor não tem.
- Checagem de estrutura (mesmo arquivo): exige `name` no `plugin.json` e `modules` não vazio no `hooks.json`, com cada módulo existente.

### Workflow update-component-content.yml
Quantidade: 1. Em push na main que toque componentes, regenera o catálogo sem consultar o Supabase, commita como github-actions[bot] e dispara o deploy. Não roda para commits do próprio bot.
- Regeneração rápida (`.github/workflows/update-component-content.yml`): `generate_components_json.py --skip-downloads`, em segundos.
- Disparo explícito do deploy (mesmo arquivo): `gh workflow run deploy.yml --ref main`.

### Workflow update-json-data.yml
Quantidade: 1. Cron diário (03:00 UTC) que regenera catálogo, tendências e vagas com dados do Supabase e commita. Não dispara o deploy sozinho.
- Lista única DATA_PATHS (`.github/workflows/update-json-data.yml`): a mesma lista serve para detectar mudança e commitar.
- Execução manual (mesmo arquivo): `workflow_dispatch`.

### Workflow deploy.yml
Quantidade: 1. Constrói o dashboard Astro e publica no Cloudflare Pages em push em `dashboard/**` ou disparo manual, com ambiente `production`.
- Deploy via wrangler (`.github/workflows/deploy.yml`): `wrangler pages deploy dist --project-name=aitmpl-dashboard`.
- Chaves públicas no YAML (mesmo arquivo): chave publicável do Clerk e client ID do GitHub OAuth, públicos por desenho, mas em tensão com a regra "sem IDs no código" do CLAUDE.md.

### Workflow version-sync.yml
Quantidade: 1. Verifica em PR e na main que as versões dos pacotes npm estão sincronizadas, rodando `npm test` na raiz.
- Check package versions (`.github/workflows/version-sync.yml`): check que aparece verde no PR #1060, junto com o Welcome & Label.
- Script de sincronização (`scripts/sync-package-versions.js`): mantém as versões coerentes entre pacotes.

### Workflows de comunicação e Rust (fora da governança)
Quantidade: 8. Não validam componentes: quatro avisos diários no Discord (blog, ajuda da comunidade, componente, geral), notificação de release, histórico de estrelas, build do CLI em Rust e CI do CLI em Rust.
- `daily-component-discord.yml` (`.github/workflows/daily-component-discord.yml`): divulga um componente por dia no Discord.
- `rust-ci.yml` (`.github/workflows/rust-ci.yml`): CI do CLI em Rust.
- `star-history.yml` (`.github/workflows/star-history.yml`): atualiza o histórico de estrelas.

### StructuralValidator
Quantidade: 1. Valida forma e metadados (detalhes na explicação). Erros: tamanho acima de 100 KB, UTF-8 e bytes nulos, frontmatter ausente ou inválido, campo obrigatório faltando. Avisos: descrição de 20 a 500 caracteres, mais de 20 seções, ferramenta e modelo desconhecidos.
- STRUCT_E002 (`cli-tool/src/validation/validators/StructuralValidator.js`): YAML inválido; 165 ocorrências no relatório de 2025-12-20 (151 em comandos, 14 em agentes).
- REQUIRED_FIELDS (mesmo arquivo): mapa de campos obrigatórios por tipo de componente.

### IntegrityValidator
Quantidade: 1. SHA-256 do conteúdo e comparação com um registro local; hash alterado gera só aviso (INT_W001). Sem âncora de confiança externa, sem assinatura (assinaturas aparecem como "futuro" no ARCHITECTURE.md) e sem o arquivo de registro no repositório.
- generateHash (`cli-tool/src/validation/validators/IntegrityValidator.js`): SHA-256 em hexadecimal do texto.
- checkHashRegistry (mesmo arquivo): compara com `.claude/security/component-hashes.json`.

### SemanticValidator
Quantidade: 1. Regex para injeção e abuso (10 padrões de erro, 4 suspeitos, 3 de dados sensíveis, 5 de HTML perigoso, permissividade em agentes e comandos destrutivos em commands). Em modo CI, os suspeitos viram erro.
- SEM_E005 (`cli-tool/src/validation/validators/SemanticValidator.js`): marcou "Extract key" em `context-manager.md` como coleta de credencial; falso positivo no relatório.
- SEM_E007 (mesmo arquivo): marcou `mcp-security-auditor.md` por "bypass protection", texto legítimo de um agente de segurança.
- Redação de valores (mesmo arquivo): troca o valor achado por `<REDACTED>` no relatório.

### ReferenceValidator
Quantidade: 1. Extrai URLs e links Markdown: bloqueia protocolos file, ftp, data, javascript e vbscript; erro para IP privado; aviso para HTTP, localhost, TLDs suspeitos e imagens data URI grandes. Não checa se a URL responde.
- REF_E004 (`cli-tool/src/validation/validators/ReferenceValidator.js`): erro crítico para hostname em faixa privada.
- REF_W002 (mesmo arquivo): aviso de HTTP, com sugestão de HTTPS (28 ocorrências no relatório de 2025-12-20).

### ProvenanceValidator
Quantidade: 1. Lê author, repository e version do frontmatter (opcionais por padrão) e o último commit, autor e data do git log; calcula um trust score. Não valida o campo license. É o único dos cinco sem arquivo de teste.
- extractGitMetadata (`cli-tool/src/validation/validators/ProvenanceValidator.js`): usa `execSync` com o caminho do arquivo interpolado numa string de shell.
- calculateTrustScore (mesmo arquivo): base 50, +15 autor, +15 repositório, +10 versão, +10 git, -10 por erro.

### BaseValidator, ValidationOrchestrator e security-audit.js
Quantidade: 3. Base abstrata com erros, avisos e score (100 menos 25 por erro e 5 por aviso); o orquestrador roda os cinco e tira a média dos scores maiores que zero; o CLI varre `.md` de agents, commands, mcps, settings e hooks e sai com código 1 em modo CI se algo falhar.
- ValidationOrchestrator.validateComponent (`cli-tool/src/validation/ValidationOrchestrator.js`): média simples (o README descreve média ponderada); repassa `strict` só ao Semantic.
- scanComponents (`cli-tool/src/security-audit.js`): filtra por `.md`, então MCPs, settings e hooks em JSON ficam de fora; skills, mods e loops nem estão na lista de tipos.

### README.md e ARCHITECTURE.md da validação
Quantidade: 2. Documentação do sistema de validação: cinco níveis, códigos de erro, exemplos de CI e fórmula de score. Divergem do código: tabelas de códigos diferentes, fórmula ponderada que não existe, repositório "danimesq", `npx create-claude-config` e workflow `component-validation.yml` inexistente.
- README de validação (`cli-tool/src/validation/README.md`): guia de uso (`npm run security-audit`) e boas práticas de frontmatter para autores.
- ARCHITECTURE de validação (`cli-tool/src/validation/ARCHITECTURE.md`): projeto original, com "Hash verification on install" e assinaturas como metas.

### Testes dos validadores
Quantidade: 5 arquivos. Testes Jest para Structural, Integrity, Semantic, Reference e o orquestrador. O ProvenanceValidator não tem teste.
- SemanticValidator.test.js (`cli-tool/tests/validation/SemanticValidator.test.js`): cobre os padrões de injeção e de dados sensíveis.
- ValidationOrchestrator.test.js (`cli-tool/tests/validation/ValidationOrchestrator.test.js`): cobre a agregação de resultados.

### scripts/validate_components.py
Quantidade: 1. Adapta o catálogo aninhado ao `claude plugin validate`: copia agents, commands e skills achatados para um plugin descartável e embrulha cada JSON de hook ou MCP como `hooks.json` ou `.mcp.json`. Opções `--changed` e `--strict`; sai com 1 se houver erro.
- Modo --changed (`scripts/validate_components.py`): valida só os caminhos listados num arquivo.
- Saída para anotações (mesmo arquivo): emite `::error file=...` e `::warning file=...` do GitHub Actions.

### scripts/skillspector_scan.py
Quantidade: 1. Orquestra o SkillSpector sobre pastas com SKILL.md: descobre todas ou só as alteradas, ignora o código de saída 1 (score alto é sinal, não falha), gera Markdown, SARIF 2.1.0 e saídas do Actions. Faixas: 0 a 20 baixo, 21 a 50 médio, 51 a 80 alto, 81 a 100 crítico.
- discover_changed_skills (`scripts/skillspector_scan.py`): sobe da pasta do arquivo alterado até achar o SKILL.md.
- --dry-run (mesmo arquivo): lista as skills sem escanear.

### cli-tool/security-report.json
Quantidade: 1. Relatório de auditoria commitado (2,1 MB), de 2025-12-20: 379 itens (216 comandos e 163 agentes), 132 aprovados, 247 reprovados, 177 avisos no resumo. Erros mais comuns: YAML inválido (165) e frontmatter ausente (54). Os 216 comandos falham todos; 31 agentes falham.
- Resumo (`cli-tool/security-report.json`): `summary` com total 379, passed 132, failed 247, warnings 177.
- Uso no catálogo (`scripts/generate_components_json.py`): roda `security-audit:json` e embute o resultado como campo `security` por componente em `docs/components.json`.

### scripts/run-review-cycle.sh
Quantidade: 1. Script manual do mantenedor para um ciclo de revisão de componente: cria um ciclo numa API em aitmpl.com e roda `claude --dangerously-skip-permissions --print` com um prompt de skill lido da pasta pessoal. Caminhos absolutos fixos do usuário do mantenedor.
- Modo --test-hook (`scripts/run-review-cycle.sh`): dispara eventos de ferramenta simulados para confirmar que o hook de log funciona.
- Execução completa (mesmo arquivo): roda o Claude sem permissões sobre o componente escolhido.

### scripts/predeploy-check.sh
Quantidade: 1. Checklist em shell antes do deploy: git limpo, Node, npm, testes da API, existência de endpoints críticos, `.env.example`, `vercel.json`. Defasado: menciona Vercel e a pasta `api/`, enquanto o CLAUDE.md diz que o deploy migrou para Cloudflare.
- Passo 5 (`scripts/predeploy-check.sh`): falha se faltarem `api/track-download-supabase.js`, `api/discord/interactions.js` ou `api/claude-code-check.js`.
- Passo 7 (mesmo arquivo): valida `vercel.json` com `jq`.

### CHANGELOG.md e releases
Quantidade: 1. Formato Keep a Changelog. Entradas de 1.25.0 (2025-10-27) a 1.29.4 (2026-07-13) e um bloco Unreleased grande e antigo. As tags vão até v1.29.6 (2026-09-17), então o CHANGELOG está atrás; publicação no npm é manual.
- 1.29.4, Security (`CHANGELOG.md`): registra a correção do GHSA-79wm-x847-7cvg (CVSS 8.8): remoção de `shell: true`, allowlist e bind em 127.0.0.1.
- Unreleased, Fixed (`CHANGELOG.md`): anota que a auditoria de segurança foi tornada não bloqueante para deploys.

### Agentes e regras de manutenção em .claude/
Quantidade: 23 arquivos (15 agentes, 3 comandos, 1 hook, 3 regras e `launch.json`; nomes conferidos na lista de arquivos, só o `component-reviewer` e parte das regras foram lidos). O prompt do `component-reviewer` é a revisão "humana" em prompt: regras por tipo (agents, commands, hooks, MCPs, settings, skills, loops), caça a segredos, caminhos absolutos e nomes fora de kebab-case, saída em Aprovado, Avisos e Críticos. Não cobre mods e não é um check automático.
- Security Validation (`.claude/agents/component-reviewer.md`): lista padrões de chave (`AIzaSy`, `sk-`, `pk_`, `ghp_`) e manda rejeitar o componente.
- Regras de loops (`.claude/agents/component-reviewer.md`): exige que cada componente referenciado resolva a um arquivo real.
- Hook de Telegram (`.claude/hooks/telegram-pr-webhook.py`): avisa por Telegram quando um PR é criado com `gh pr create`; cabeçalho lido, menciona preview da Vercel.

### Revisão em PR (bots de IA e humana)
Quantidade: 3 PRs conferidos. Os PRs recebem comentários de Greptile e cubic, e a decisão final é do mantenedor.
- PR #1060 (https://github.com/davila7/claude-code-templates/pull/1060): PriceWin MCP e skill; autor CONTRIBUTOR, 2 arquivos, rótulo review-pending, revisões do Greptile e do cubic (2 problemas), aprovação e merge em 2026-10-04 com Security Audit e SkillSpector em falha por erro de permissão ao comentar.
- PR #1067 (https://github.com/davila7/claude-code-templates/pull/1067): introduz a validação oficial para agents, commands, skills, hooks e MCPs; mesclado 2026-10-04.
- PR #1070 (https://github.com/davila7/claude-code-templates/pull/1070): o gerador do catálogo passa a ler o frontmatter como YAML e a usar `metadata.*`; cita cerca de 220 comandos e agentes que o Claude Code tolera e o YAML estrito rejeita.

### Licença e atribuição
Quantidade: 89 arquivos (88 LICENSE e 1 NOTICE.txt). Repositório MIT; seção Attribution no README listando origens e licenças (MIT, Apache-2.0, CC0); campos license, author, repo e version do frontmatter lidos pelo gerador do catálogo, mas sem validação nem exigência.
- Mod de terceiro com atribuição (`cli-tool/components/mods/games/cc-arcade/.claude-plugin/plugin.json`): autor original, homepage, repository e license MIT, com nota de que não é afiliado às marcas dos jogos; a pasta tem LICENSE.
- Seção Attribution (`README.md`): lista as fontes e afirma que cada uma mantém licença e atribuição originais.
- Mod próprio sem LICENSE (`cli-tool/components/mods/games/chess/.claude-plugin/plugin.json`): declara MIT no manifesto, mas a pasta não tem arquivo LICENSE; o mesmo vale para 24 dos 39 mods.

## O que vale aproveitar

| Item | Por que vale | Esforço | Caminho ou URL | Cuidado |
|---|---|---|---|---|
| CI único com `claude plugin validate --strict` (PR e agendado) | É o que o upstream só adotou hoje (PR #1067), depois de publicar componentes quebrados. O kit já passa o validate com `--strict` (testado agora na 2.1.289), então o CI só automatiza o que Cesar já roda à mão. Não precisa de segredos. | baixo | `.github/workflows/component-validate.yml` | O upstream instala o Claude Code sem versão; fixar a versão evita quebra por mudança do validador. Ligar Actions é mudança no repositório de Cesar (nada foi alterado aqui). |
| `claude plugin test` e validate do mod csr-cockpit no CI | Pega no CI um mod que usa API inexistente, em vez de pegar na máquina de quem instala. O csr-cockpit já tem testes. | baixo | `.github/workflows/mods-typecheck.yml` | O `tsc` não roda de imediato: a pasta `.claude-plugin/types/` do csr-cockpit é ignorada pelo git, então o CI precisa gerar os tipos ou o kit versionar um `.d.ts`. O d.ts muda a cada versão do Claude Code. |
| Script curto com as regras do CONTRIBUTING que o validate não cobre | Automatiza nome em minúsculas sem prefixo `claude-`, versão do `plugin.json` que subiu, README do item para hook e mod, `scripts/arte.py` rodado e `git diff --exit-code`. Mesma ideia do `validate_components.py` (adaptar o repositório ao validador). | medio | `scripts/validate_components.py` | Manter pequeno; cada regra nova é mais uma coisa que pode ficar defasada, como o ARCHITECTURE.md do upstream. |
| Checklist de PR e SECURITY.md curto | O upstream não tem template de PR nem de issue, e a política de segurança dele é de 2025. Para um kit que distribui hooks e mods, vale um checklist (o que roda na máquina, versão, arte, licença de terceiros) e um canal de denúncia (e-mail ou relato privado do GitHub). | baixo | `SECURITY.md` | Prometer só o que Cesar consegue cumprir (prazo de resposta). |
| Exigir license, author e repository desde o primeiro item, com tabela de atribuição | No upstream os mods exigem isso (39 de 39 com os campos); agents, commands, hooks, MCPs e settings têm 0 de licença, e só 15 dos 39 mods trazem arquivo LICENSE. | baixo | `README.md` (seção Attribution) | Licenças das fontes variam (MIT, Apache-2.0, CC0); copiar um componente exige conferir a licença de cada origem. Nenhuma validação automática do upstream faz isso. |
| Secret scanning, push protection e ruleset ativo exigindo o check | O upstream usa padrões em prompt de revisor, não tem scan de segredos no CI, e o ruleset dele está desligado e não exige check. No kit são configurações do GitHub, sem código; o `.gitignore` do kit também não cobre `.env`. | baixo | `.claude/agents/component-reviewer.md` (lista de padrões de segredo) | Configuração de repositório, não de arquivo; Cesar precisa fazer na conta dele. |
| Padrão `userConfig` com `sensitive: true` para chaves de mods | O mod chess declara duas chaves de API como opções sensíveis em vez de colocá-las no código. | baixo | `cli-tool/components/mods/games/chess/.claude-plugin/plugin.json` | O csr-cockpit hoje não pede chave; só adotar quando houver necessidade. |
| PR bloqueante só nos arquivos alterados e varredura completa semanal sem bloquear | Evita que um problema antigo trave PRs novos, e o relatório semanal mostra a dívida acumulada. | baixo | `.github/workflows/component-validate.yml` | No kit, com poucos itens, o modo "tudo sempre" já basta; usar `--changed` só se o catálogo crescer. |
| Não comentar no PR a partir de job de `pull_request` | No #1060 os dois jobs de segurança ficaram vermelhos só porque o comentário falhou em PR de fork. Usar `$GITHUB_STEP_SUMMARY` evita check vermelho sem motivo. | baixo | `.github/workflows/component-security-validation.yml` | Só importa se o kit passar a receber PR de fork. |
| Padrão `pull_request_target` sem checkout para rotular e comentar PR de fork | Permite dar boas-vindas e comentar em PR de fork sem rodar código de terceiros com permissão de escrita. | medio | `.github/workflows/generated-files-guard.yml` | Só se Cesar passar a receber PR de fora; nunca fazer checkout nem executar código do PR nesse evento. |
| Usar a saída do `claude plugin validate` de um mod como parte da revisão | Na execução local sobre o csr-cockpit (2.1.289) o validate lista eventos ligados, chamadas `$.*`, leituras de variáveis de ambiente e chaves de estado: um resumo do que o mod faz, útil para colar no PR. | baixo | comando `claude plugin validate ./plugins/csr-cockpit --strict` | A lista vem da análise estática do validador; não substitui ler o código. |
| SkillSpector (varredura estática de skills) | Útil se o kit passar a aceitar skills de terceiros: encontra injeção de prompt, exfiltração e código perigoso. | alto | `scripts/skillspector_scan.py` | Exagero para skills próprias. O upstream instala a ferramenta da branch main da NVIDIA sem versão fixa, em job com `security-events: write`; se usar, fixar o commit. |
| Hooks e mods de segurança do upstream como material de estudo e para o blog | Exemplos reais (secret-scanner, dangerous-command-blocker, force-push-blocker, shell-wrapper-guard; mods secret-redactor e protected-paths-guard) para entender o que um hook de proteção faz. | medio | `cli-tool/components/hooks/security/secret-scanner.py` | Hook e mod executam na máquina de quem instala; ler o código inteiro e a licença antes de copiar qualquer coisa. Só os nomes e caminhos foram conferidos, o código desses itens não foi lido. |

## Cuidados

- Texto lido que tentou dar ordens (ignorado): o CLAUDE.md tem diretivas dirigidas a agentes do próprio repositório (usar o `component-reviewer` em todas as mudanças, usar o `deployer`, não rodar o gerador do catálogo antes de confirmar o teste); o prompt de `.claude/agents/component-reviewer.md` diz para uso proativo; e o comentário de um bot de revisão nos PRs pede que agentes de IA verifiquem e corrijam os problemas. Nada disso foi executado.
- A apuração foi só leitura (`gh api`, GraphQL, `curl` para `raw.githubusercontent.com` com cópias temporárias no scratchpad, WebFetch). Nada do repositório foi clonado, instalado ou executado, e nenhum arquivo do claude-code-kit ou do blog foi alterado. A única execução local foi `claude plugin validate` (com e sem `--strict`) sobre o repositório de Cesar, que apenas lê.
- A cota REST do GitHub estava esgotada durante a conferência (outros agentes do workflow a consumiram); por isso as conferências sobre PRs, rulesets, tags e advisory usaram GraphQL, e os arquivos vieram de `raw.githubusercontent.com`.
- Os cinco validadores cobrem pouco: só lêem `.md` de agents, commands, mcps, settings e hooks, e como MCPs, settings e hooks são JSON, sobram agents e commands. Hooks, MCPs, settings e loops, que executam ou configuram código, não têm varredura semântica automática. A auditoria roda no catálogo inteiro e não só no PR, e não bloqueia.
- O merge ocorre mesmo com checks vermelhos: no PR #1060 `main` aceitou o merge com Security Audit e SkillSpector em falha, causada por erro de permissão ao comentar em PR de fork, e a `main` não tem proteção ativa (o ruleset existe e está desligado, e não exige check de status). Que a falha seja só o token somente leitura do fork é inferência a partir da mensagem de erro; o relatório do próprio job não foi aberto.
- O CODEOWNERS aponta para @danipower, uma conta diferente de davila7 (nome Daniel Avila), que aprova e mescla os PRs. Não verificado se são a mesma pessoa; de todo modo o CODEOWNERS não obriga nada com a proteção desligada.
- Instalação sem integridade: o CLI baixa direto de `raw.githubusercontent.com/davila7/claude-code-templates/main/...`, sem versão por componente, hash ou assinatura. O hash do IntegrityValidator seria só um registro local de mudança, e o arquivo de registro não existe no repositório. Um merge ruim vale para todos imediatamente.
- Falsos positivos e desencontro com o parser do Claude Code: no relatório commitado (2025-12-20), 247 de 379 itens reprovam; todos os 216 comandos falham em STRUCT_E001, E002 ou E006. O relatório é antigo e o catálogo atual tem 710 agentes e comandos, então não representa a situação de hoje.
- Documentação defasada ou divergente: o README de validação descreve score ponderado e tabelas de códigos que diferem do código; o ARCHITECTURE.md cita `danimesq`, `npx create-claude-config` e um workflow inexistente; o CONTRIBUTING.md não menciona skills, loops, mods nem checks; o `WORKFLOWS_REFERENCE.md` lista só um workflow; `predeploy-check.sh` fala de Vercel enquanto o CLAUDE.md diz Cloudflare. Os números do CLAUDE.md (600+ agentes, 10 mods) divergem do catálogo público (422 agentes, 39 mods) e a contagem de padrões do SkillSpector no CLAUDE.md (64) difere da do README da NVIDIA (71).
- Risco de injeção de comando no ProvenanceValidator: `execSync` com o caminho do arquivo dentro de uma string de shell. Se o nome do arquivo vier de PR, é um padrão a não copiar. Se é explorável no CI deles, não foi verificado.
- `scripts/run-review-cycle.sh` roda `claude --dangerously-skip-permissions` sobre um prompt de skill e um componente do repositório, com caminhos absolutos do mantenedor e chamadas a uma API de aitmpl.com. Revisar conteúdo de terceiros com um agente sem permissões é exposição a injeção de prompt (inferência). É script do mantenedor, não faz parte do catálogo.
- Cadeia de suprimentos nos workflows: o SkillSpector é instalado da branch main da NVIDIA e o Claude Code com `npm install -g` sem versão; as actions são fixadas por tag, não por SHA. Os workflows com `pull_request_target` são seguros só porque não fazem checkout do código do PR.
- Licença: nenhum validador exige ou confere `license`; 24 dos 39 mods não têm arquivo LICENSE (o `chess` declara MIT no manifesto e não tem LICENSE). A seção Attribution do README não informa a licença das fontes da Anthropic. Atribuição de terceiros é por prosa no README e LICENSE por pasta, sem checagem automática.
- Regra de IDs: o CLAUDE.md proíbe identificadores no código, mas `deploy.yml` traz a chave publicável do Clerk e um client ID do GitHub OAuth. São públicos por desenho, mas contrariam a regra escrita.
- Números do site são informados pelo próprio site em 04/10/2026 (1.340.064 downloads, 270 PRs de componentes mesclados, 239.282 instalações npm, 30,8 mil estrelas) e não foram verificados de forma independente. Estrelas, forks e PRs abertos vêm da API do GitHub no mesmo dia. O catálogo muda a cada commit (67 em 7 dias), então as contagens por tipo valem para hoje.
- Ritmo de releases: o CHANGELOG para na 1.29.4 (2026-07-13), com bloco Unreleased antigo, enquanto as tags chegam a v1.29.6 (2026-09-17) e não existe tag para 1.29.4. Os arquivos de componentes entram sem release do CLI. A vulnerabilidade alta do `--studio` (GHSA-79wm-x847-7cvg) foi corrigida na 1.29.4 e a advisory só foi publicada em 2026-09-03.

## Fontes

- Repositório (leitura via `gh api`, GraphQL e `raw.githubusercontent.com`, 04/10/2026): CONTRIBUTING.md, CLAUDE.md, SECURITY.md, CODE_OF_CONDUCT.md, CHANGELOG.md, README.md (seções Contributing, Attribution e License), `.npmrc`, `.gitignore`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/WORKFLOWS_REFERENCE.md`.
- Workflows: `.github/workflows/component-pr-welcome.yml`, `component-validate.yml`, `component-security-validation.yml`, `generated-files-guard.yml`, `mods-typecheck.yml`, `skill-security-scan.yml`, `skill-security-scan-all.yml`, `update-component-content.yml`, `update-json-data.yml`, `deploy.yml`, `version-sync.yml`.
- Agente e regras: `.claude/agents/component-reviewer.md`, `.claude/rules/cli-tool.md`, `.claude/hooks/telegram-pr-webhook.py` (cabeçalho).
- Validação: `cli-tool/src/validation/README.md`, `ARCHITECTURE.md`, `BaseValidator.js`, `ValidationOrchestrator.js`, `validators/{Structural,Integrity,Semantic,Reference,Provenance}Validator.js`, `cli-tool/src/security-audit.js`, `cli-tool/package.json`, `cli-tool/security-report.json` (lido por completo e recontado), os 45 arquivos `.js` de `cli-tool/src/` fora de `validation/` (busca por uso dos validadores e de hash), `cli-tool/src/index.js` (URLs de download).
- Scripts: `scripts/validate_components.py`, `scripts/skillspector_scan.py`, `scripts/run-review-cycle.sh`, `scripts/predeploy-check.sh`, `scripts/generate_components_json.py` (trechos), `scripts/sync-package-versions.js` (existência).
- Mods: `cli-tool/components/mods/games/cc-arcade/.claude-plugin/plugin.json`, `.../chess/.claude-plugin/plugin.json`.
- Site: `dashboard/src/pages/component/[type]/[...slug].astro`; `dashboard/public/components/{agents,commands,skills,hooks,mcps,settings,mods,loops}.json` (contagens e cobertura de metadados); https://www.aitmpl.com (WebFetch, números informados pelo site).
- `tree.json` (12.191 entradas, no scratchpad): contagem de LICENSE e NOTICE, mods sem LICENSE, extensões por tipo, lista de workflows, ausência de templates de PR e issue e do registro de hashes.
- GitHub (GraphQL, 04/10/2026): metadados do repositório (licença, estrelas, forks, PRs abertos, 67 commits em 7 dias), histórico de CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md e CHANGELOG.md, tags e releases, ruleset "Protect main branch", `branchProtectionRule`, advisory GHSA-79wm-x847-7cvg, templates de PR e issue, PRs #1060 (comentários, revisões, checks e anotações), #1067 e #1070.
- Repositório da NVIDIA: https://github.com/NVIDIA/skillspector (README, contagem de padrões e licença).
- claude-code-kit: `/Users/cesar.schutz/Downloads/claude-code-kit/CONTRIBUTING.md`, `README.md`, `.gitignore`, `.claude-plugin/marketplace.json`, `plugins/csr-cockpit/.claude-plugin/plugin.json`, `plugins/csr-cockpit/tsconfig.json`, `plugins/csr-cockpit/.claude-plugin/types/.gitignore`; execução local de `claude plugin validate` (Claude Code 2.1.289, só leitura).

# 08 · O tipo SKILLS (cli-tool/components/skills, ~40 categorias, ~5.700 arquivos)

Pesquisa somente-leitura feita em 04/10/2026 (Claude Code 2.1.289 na máquina). Tudo o que aparece como fato foi lido agora no repositório `davila7/claude-code-templates`, no `tree.json` ou nas páginas citadas em "Fontes". Números exibidos pelo site são marcados como "informados pelo site". O que não deu para confirmar está escrito como "não verificado".

## Resumo em números

| Item | Valor | De onde vem |
|---|---|---|
| Pastas de categoria em `cli-tool/components/skills/` | 31 | `tree.json` |
| Arquivos `SKILL.md` | 914 | `tree.json` |
| Arquivos dentro das categorias | 5.690 (mais o `ANTHROPIC_ATTRIBUTION.md` na raiz de `skills/`) | `tree.json` |
| Tamanho | 62 MB | `tree.json` |
| Extensões | 3.196 `.md`, 861 `.py`, 649 `.patch`, 390 `.xsd`, 115 `.txt`, 69 `.sh`, 54 `.ttf`, 47 `.json`, 23 `.png`, 5 `.pdf` | `tree.json` |
| Skills em `categoria/nome` | 890 | `tree.json` |
| Skills aninhadas (`categoria/grupo/nome`) | 22 (10 de `game-development`, 7 de `n8n`, 4 de `scientific/document-skills`, 1 `app-builder/templates`) | `tree.json` |
| Skills com `SKILL.md` na raiz da categoria | 2 (`design-to-code`, `gmod-addon-maker`) | `tree.json` |
| Indexadas pelo site | 890 em 29 categorias | `docs/components.json` |
| Downloads somados das skills | 595.180 (informados pelo site em 04/10/2026; vêm de telemetria sem auditoria) | `docs/components.json` |
| Skills que têm só o `SKILL.md` | 414 (45%) | `tree.json` |
| Com `references/` / `scripts/` / `assets/` | 338 / 185 / 65 | `tree.json` |
| Cópias idênticas de `SKILL.md` | 19 extras, em 15 grupos | hash do texto |
| Nomes de pasta repetidos entre categorias | 22 (12 com `SKILL.md` diferente) | `tree.json` |
| Estrelas do repositório | 32.375, licença MIT | GraphQL do GitHub |

Os 914 arquivos `SKILL.md` foram lidos em lote e o conteúdo conferido contra o SHA de cada blob do `tree.json` (914 de 914 iguais). Contagens de frontmatter, linhas e padrões abaixo vêm de script sobre esse conteúdo e são aproximadas quando dependem de regex.

## O que é uma skill

Uma skill é uma pasta com um `SKILL.md` (frontmatter YAML mais instruções em Markdown) e, se preciso, arquivos de apoio (`scripts/`, `references/`, `assets/`). A forma aberta é a especificação Agent Skills (agentskills.io); o Claude Code implementa essa base e acrescenta campos próprios.

**Especificação aberta** (https://agentskills.io/specification):
- `name` obrigatório: 1 a 64 caracteres, só minúsculas, números e hífens, sem começar ou terminar com hífen, sem hífens seguidos, igual ao nome da pasta.
- `description` obrigatória: 1 a 1.024 caracteres, deve dizer o que a skill faz e quando usar.
- Opcionais: `license`, `compatibility` (até 500 caracteres), `metadata` (mapa de texto para texto) e `allowed-tools` (experimental).
- Divulgação progressiva em três níveis: nome e descrição (cerca de 100 tokens por skill) ficam carregados desde o início; o corpo do `SKILL.md` entra quando a skill é ativada (a spec recomenda abaixo de 5.000 tokens e abaixo de 500 linhas); `scripts/`, `references/` e `assets/` entram só quando necessários.
- Validador oficial: `skills-ref validate ./minha-skill`.

**Claude Code** (https://code.claude.com/docs/en/skills):
- Todos os campos são opcionais; `name` assume o nome da pasta; `description` é recomendada e, se faltar, vale a primeira linha do corpo.
- `description` mais `when_to_use` são cortadas em 1.536 caracteres na listagem (ajustável por `skillListingMaxDescChars`). A listagem inteira tem orçamento de 1% da janela de contexto (`skillListingBudgetFraction`); quando estoura, as descriptions das skills menos usadas são descartadas e perdem as palavras-chave de acionamento.
- Campos de controle: `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context: fork` com `agent` e `background`, `hooks`, `paths`, `shell`, `argument-hint`, `arguments`. Com `disable-model-invocation: true` a description nem entra no contexto; o corpo só carrega quando você digita `/nome`.
- O corpo renderizado entra na conversa uma vez e fica lá; após compactação, cada skill invocada mantém só os primeiros 5.000 tokens, com orçamento comum de 25.000.
- `allowed-tools` pré-aprova ferramentas só no turno da invocação, e a página avisa que workspace trust não barra o campo numa skill de projeto. A sintaxe `` !`comando` `` executa shell antes de o conteúdo chegar ao modelo; `"disableSkillShellExecution": true` desliga isso.
- Os arquivos de `.claude/commands/` foram unificados com skills (os dois criam `/nome`). Skills de plugin ganham o prefixo `/plugin:skill`. Locais: `.claude/skills/<nome>/SKILL.md` (projeto), `~/.claude/skills/` (pessoal) e `skills/` dentro de plugin.
- A doc recomenda `SKILL.md` abaixo de 500 linhas e diz que scripts são executados, não lidos.
- `/skill-doctor` (2.1.252 ou mais novo, exige busca de feature flags) mostra o custo de cada skill no contexto e a frequência de uso.
- Fora do Claude Code (upload no claude.ai, Skills API, `package_skill.py`) só valem seis campos: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Qualquer outro dá erro duro (`Unexpected key(s) in SKILL.md frontmatter`). No catálogo, 350 de 913 `SKILL.md` com YAML válido (38%) trazem pelo menos um campo fora desses seis (`source` 173, `author` 151, `version` 132, `tags` 131, `risk` 102, `date_added` 100, `dependencies` 99). O que o Claude Code faz com campos fora da tabela dele (`source`, `risk`, `tags`): não verificado.

**Como o modelo decide**: ele lê a listagem de nomes e descriptions e escolhe pela `description`; por isso ela precisa dizer o que a skill faz e quando usar, com as frases que a pessoa de fato digita. O skill-creator da Anthropic acrescenta que o Claude tende a sub-acionar skills e recomenda descriptions um pouco "insistentes".

## Como a CLI instala

`npx claude-code-templates@latest --skill categoria/nome` (várias, separadas por vírgula; flag `--skill <skill>` em `cli-tool/bin/create-claude-config.js`). A mesma linha aparece na página da skill no site (por exemplo `--skill git/star-history-chart`). A função `installIndividualSkill` (`cli-tool/src/index.js`) faz, pelo código lido (não executei):

1. Usa o último trecho do caminho como nome da pasta e grava em `<diretório>/.claude/skills/<último trecho>/`.
2. Lista cada diretório pela API de contents do GitHub, sempre da branch `main`, e baixa cada arquivo pelo `download_url`.
3. Lê os arquivos como texto (`response.text()` e `writeFile(..., 'utf8')`), o que corromperia binários (54 fontes `.ttf`, 23 `.png`, 5 `.pdf`).
4. Marca `.py` e `.sh` como executáveis (`chmod 755`) e exige `SKILL.md`; sem ele, falha.
5. Em 404, a mensagem de ajuda cita só 4 categorias (`creative-design, development, document-processing, enterprise-communication`) de 31.

Consequências: o nome da pasta é achatado (22 nomes se repetem, 12 com conteúdo diferente; o segundo a instalar sobrescreve o mesmo `SKILL.md` e deixa arquivos misturados); não há versão fixa, checksum nem comando de atualização (é cópia); falha de download de um arquivo é ignorada em silêncio. A API do GitHub é usada só para listar diretórios (uma chamada por diretório): `loki-mode` precisa de 43 e `cloudflare-deploy` de 64, e o limite documentado do GitHub para quem não tem token é de 60 por hora (efeito não testado). `design-to-code` e `gmod-addon-maker` não têm o formato `categoria/nome`; o site não as indexa, e a CLI só as instala se você passar o nome sem categoria (`--skill design-to-code`).

**Telemetria**: ligada por padrão (`cli-tool/src/tracking-service.js`). Desligam `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`. Cada instalação envia, por POST sem autenticação aparente, para `https://www.aitmpl.com/api/track-download-supabase`: nome do componente, id de sessão, versão do Node, plataforma, arquitetura, versão da CLI e, no caso de skill, o diretório de destino relativo. O resultado (sucesso ou erro, com a mensagem de erro) vai para `/api/track-installation-outcome`. Abrir o dashboard de skills também registra evento.

## O que há dentro

- Maiores blocos por `SKILL.md`: development 230, scientific 139, ai-research 131, productivity 50, business-marketing 49, security 47.
- 152 `SKILL.md` (17%) passam de 500 linhas e 5 passam de 1.000.
- 9 skills são o mesmo esqueleto vazio (ver "Cuidados").
- 19 `SKILL.md` são cópias exatas de outro. Exemplos de grupos: `skill-creator` em `development` e `productivity`; `web-artifacts-builder` em `development` e `utilities`; `slack-gif-creator` em `creative-design` e `enterprise-communication`; `latex-posters` e `pptx-posters`.
- Skills grandes: `loki-mode` tem 1.104 arquivos e 7,5 MB (999 deles em `benchmarks/`); `canvas-design` tem 5,6 MB com 54 fontes TTF (27 licenças OFL); `docx` e `pptx` têm 112 arquivos cada (esquemas OOXML `.xsd` e patches).
- `scripts/` aparece em 185 skills: `scientific` 67, `development` 42, `enterprise-communication` 14, `document-processing` 12, `creative-design` 10.

## Origem e licença

**O que o README diz** (seção Attribution): `anthropics/skills` (21 skills) e `anthropics/claude-code` (10 skills) como oficiais da Anthropic; K-Dense-AI/claude-scientific-skills (139 científicas, MIT); obra/superpowers (14, MIT); alirezarezvani/claude-skills (36, MIT); NerdyChefsAI (MIT); awesome-claude-skills (Apache-2.0, "community skills"); move-code-quality-skill (MIT); cocoindex-claude (Apache-2.0). Cada recurso "retém a licença original". O README não cita OpenAI, vibeship, zebbern nem Orchestra Research, que aparecem como autores no frontmatter.

**O que o `ANTHROPIC_ATTRIBUTION.md` diz**: 14 itens sob Apache-2.0 (15 nomes, porque `artifacts-builder / web-artifacts-builder` é um item só): `academy-guide`, `algorithmic-art`, `artifacts-builder / web-artifacts-builder`, `brand-guidelines`, `canvas-design`, `claude-api`, `discernment-nudge`, `frontend-design`, `internal-comms`, `mcp-builder`, `skill-creator`, `slack-gif-creator`, `theme-factory`, `webapp-testing`; e 4 "source-available (reference only)": `docx`, `pdf-anthropic`, `pptx`, `xlsx`. Diz que para Apache a atribuição é "apreciada, não obrigatória", e na seção seguinte manda marcar mudanças e manter a atribuição original (o próprio texto se contradiz). Cita `THIRD_PARTY_NOTICES.md` nas pastas de skill; não há nenhum no `tree.json` (só um `NOTICE.txt`, em `development/playwright`).

**O que os arquivos mostram** (todos os `LICENSE*` foram lidos e classificados):
- 72 arquivos `LICENSE`/`LICENSE.txt`/`LICENSE.md` (mais 1 `NOTICE.txt`) cobrem 78 skills: 46 sob Apache-2.0, 19 sob MIT (12 licenças próprias mais a `LICENSE.md` de `workflow-automation/n8n`, que cobre as 7 sub-skills n8n) e 13 sob a licença proprietária da Anthropic.
- Essa licença proprietária (© 2025 Anthropic, PBC) proíbe extrair ou reter cópias fora dos serviços da Anthropic, reproduzir, criar derivados e distribuir. Está em `docx`, `docx-official`, `pdf`, `pdf-anthropic`, `pdf-official`, `pptx`, `pptx-official`, `xlsx`, `xlsx-official` (todas em `document-processing`) e nas 4 de `scientific/document-skills`. O `SKILL.md` de `document-processing/pdf-processing` também declara "Proprietary" (sem `LICENSE` na pasta): 14 `SKILL.md` no total. O repositório inteiro está sob MIT e as redistribui, e o attribution cita só 4. Logo, 4 das 139 skills "científicas MIT" do README são proprietárias.
- 836 das 914 skills (91%) não têm arquivo de licença; 541 (59%) não declaram autor, `source` nem `repository` no frontmatter. Em `scientific`, 134 das 139 não têm nem o campo `license`; só `markitdown` e `neuropixels-analysis` têm `LICENSE` MIT na pasta.
- Autoria declarada no frontmatter (`author` ou `metadata.author`): Orchestra Research 81 (MIT), `openai` 21 (as pastas com `LICENSE.txt` são Apache-2.0), zebbern 29 (pentest, nenhuma com licença), Ansvar Systems AB 3 (CC-BY-4.0), Alireza Rezvani 5. O campo `source` aponta `vibeship-spawner-skills (Apache 2.0)` em 57 skills e `google/skills (Apache 2.0)` em 13.

**Para quem copia**: Apache-2.0 exige entregar a licença, marcar arquivos alterados, manter avisos de copyright e o conteúdo do `NOTICE`, o que contradiz o "atribuição não obrigatória" do attribution. MIT exige manter o aviso. As 13 proprietárias não podem ir para o seu repositório nem para um marketplace seu. Skill sem licença não dá permissão clara de cópia. Para o `claude-code-kit`, o caminho seguro é escrever as suas a partir da documentação e usar as do catálogo como referência de estudo.

**Skills da lista da Anthropic e onde estão no catálogo**: `creative-design` (`algorithmic-art`, `canvas-design`, `frontend-design`, `slack-gif-creator`, `theme-factory`); `development` (`artifacts-builder`, `web-artifacts-builder`, `claude-api`, `mcp-builder`, `skill-creator`, `webapp-testing`); `productivity` (`academy-guide`, `discernment-nudge`, `skill-creator`); `enterprise-communication` (`brand-guidelines`, `internal-comms`, `slack-gif-creator`); mais cópias em `utilities`, `security` e `business-marketing`. Quais das 10 do `anthropics/claude-code` são (provavelmente `hook-development`, `plugin-structure`, `command-development`, `agent-development`, `mcp-integration`): não confirmado arquivo a arquivo.

## Qualidade (medida nos 914 `SKILL.md`)

**Bons modelos** (lidos inteiros): `find-bugs` da Sentry (75 linhas, fases, checklist, auditoria antes de concluir, "não invente problemas", "não faça mudanças"); `systematic-debugging` (traz `CREATION-LOG.md` e três testes de pressão `test-pressure-1..3.md`); `writing-clearly-and-concisely` (mapa de arquivos com custo em tokens e "a maioria das tarefas só precisa de um arquivo"); `railway/deploy` (description com gatilhos, desambiguação "para X use a skill Y" e `allowed-tools: Bash(railway:*)` com escopo); `internal-comms` (32 linhas que roteiam para `examples/`); `commit-work` (56 linhas, "Use when" com frases literais).

**Ruins**: `template-skill` (6 linhas, placeholder); `secrets-management` (description sem "quando usar", cita `references/vault-setup.md` e `references/github-secrets.md` que não existem, cita as skills `gitlab-ci-patterns` e `deployment-pipeline-design` que não existem, e exemplos de CI fazem `echo` de secrets); `pdf-anthropic` (o `SKILL.md` manda ler `REFERENCE.md` e `FORMS.md` em maiúsculas, mas os arquivos da pasta se chamam `reference.md` e `forms.md`); `commit-work` cita `references/commit-message-template.md`, que não existe; `design-to-code` manda copiar de `skills/design-to-code/scripts/`, caminho que não existe depois da instalação em `.claude/skills/`; as 9 skills esqueleto (ver "Cuidados"). Por heurística (cita `references/`, `scripts/` ou `assets/` que não existem na pasta), cerca de 89 `SKILL.md` têm referência quebrada; o número inclui exemplos ilustrativos de skills de autoria.

**Medidas** (regex, aproximadas):
- 57% a 63% das descriptions trazem marcador de "quando usar", conforme a regex. Por categoria: `career`, `doordash`, `sentry`, `pocketbase`, `operations` e `curviate` perto de 100%; `document-processing` 94%; `business-marketing` cerca de 80%; `productivity` cerca de 80%; `security` 75%; `development` 52% a 54%; `scientific` cerca de 36%; `web-development` 33%; `database` entre 15% e 31%; `video` 25%.
- 152 passam de 500 linhas e 5 de 1.000 (`treatment-plans` 1.576 linhas).
- 55 `name` violam a spec; 167 diferem do nome da pasta; 1 `SKILL.md` tem YAML inválido (`ai-research/emerging-techniques-model-pruning`, `:` solto na description); 1 description passa de 1.024 caracteres (`productivity/devil`, 1.178); nenhuma passa de 1.536.
- Campos modernos: nenhuma das 914 usa `disable-model-invocation`, `context`, `paths`, `when_to_use`, `model` ou `effort`; 5 usam `user-invocable`; 84 usam `allowed-tools` (34 com `Bash` sem escopo); 3 trazem `hooks`; 2 têm linhas com `` !`comando` `` (`shadcn`, que executa na carga da skill, e `command-development`, que as traz como exemplos de documentação).
- Soma de `name` e `description` das 914: cerca de 267 mil caracteres (da ordem de 67 mil tokens, estimativa a 4 caracteres por token, não medida). A doc limita a listagem a 1% da janela de contexto, então instalar tudo faria o Claude Code cortar descriptions, não gastar 67 mil tokens fixos.
- Popularidade não é qualidade: as 9 skills esqueleto somam 134.176 downloads informados pelo site (22,5% do total).

## Dashboard de skills (`--skills-manager`)

`cli-tool/SKILLS_DASHBOARD.md` e `cli-tool/src/skill-dashboard.js` (porta 3337): um servidor Express que lista skills de `~/.claude/skills`, de `.claude/skills` (pasta atual) e de `~/.claude/plugins/marketplaces/*/plugins/*/skills`, lê o frontmatter e mostra, por skill, uma "visualização de carregamento progressivo" em três camadas: `SKILL.md` (camada 1, fixo), arquivos `.md` e demais (camada 2, "sob demanda") e `scripts/`, `templates/`, `.py`, `.js`, `.sh` (camada 3, "progressivo"). Há busca e filtro por origem (pessoal, projeto, plugin), modal com árvore de arquivos e API em `/api/skills`, `/api/skills/:name`, `/api/skills/:name/file/*` e `/api/summary`. Frontend em JavaScript puro (`index.html`, `script.js`, `styles.css`).

Problemas lidos no código:
- Rotula o `SKILL.md` como "Always Loaded" (`alwaysLoaded: ['SKILL.md']`), o que contradiz a documentação oficial: só nome e description ficam no contexto; o corpo carrega ao invocar. O próprio `SKILLS_DASHBOARD.md` se contradiz ("Loaded when skill is invoked").
- `app.listen(port)` sem host (escuta em todas as interfaces, pelo comportamento padrão do Node) e CORS `Access-Control-Allow-Origin: *`: o conteúdo das suas skills fica legível por qualquer página aberta no navegador e pela rede local.
- A checagem de caminho usa `normalizedPath.startsWith(skill.path)` (prefixo): uma pasta irmã de mesmo prefixo passaria.
- A doc promete atalhos de teclado (`Esc`, `Enter`, `/`) e "virtual scrolling"; não achei nenhum dos dois em `index.html`, `script.js` ou `styles.css`.
- Mostra skills de qualquer marketplace clonado, instalado ou não (não verificado se o caminho vale para o Claude Code 2.1.289). Registra telemetria ao abrir.
- Ideia aproveitável: mostrar, por skill, tamanho do `SKILL.md`, arquivos de apoio e origem. Para custo real, o Claude Code já tem `/skill-doctor` e `/doctor`.

## Categorias

Contagens: "skills" = `SKILL.md` na categoria; "arquivos" = tudo na pasta. Linhas contadas como `wc -l`. Percentuais de "quando usar" são aproximados (regex).

### ai-maestro (6 skills, 6 arquivos)
Operam a CLI do AI Maestro, orquestrador de agentes de terceiros: criar e hibernar agentes, mensagens assinadas (AMP), busca em documentação, grafo de código, memória de conversas, planejamento em arquivos. 75 a 102 linhas, descriptions com frases literais de gatilho, sem autor nem licença. Só serve a quem usa o AI Maestro.
- `agent-management`: cria, lista, hiberna, acorda e remove agentes.
- `agent-messaging`: mensagens criptograficamente assinadas entre agentes.
- `memory-search`: busca no histórico de conversas e na memória semântica.

### ai-research (131 skills, 1.541 arquivos)
Engenharia de IA e pesquisa de LLMs: treino distribuído, fine-tuning, inferência, RAG, MLOps, interpretabilidade, segurança de modelos, agentes e prompts. 81 assinadas por Orchestra Research (`license: MIT`), 17 de vibeship (Apache-2.0), 21 sem origem; 24 passam de 500 linhas; entre 54% e 69% das descriptions dizem quando usar. Para backend Java o aproveitável é pouco (contexto, cache de prompt, padrões de agente).
- `context-window-management` (53 linhas): resumo, corte e roteamento para gerir a janela.
- `prompt-caching`: padrões de cache de prompt e de resposta.
- `inference-serving-vllm` (364 linhas, MIT): serviço de LLMs com vLLM.
- `loki-mode` (721 linhas, 1.104 arquivos, 7,5 MB): "startup autônoma" com 100+ agentes; exige `--dangerously-skip-permissions`. Alto risco.

### analytics (1 skill, 7 arquivos)
- `google-analytics` (153 linhas): analisa métricas de tráfego e conversão; tem "Use when".

### business-marketing (49 skills, 111 arquivos)
Marketing, SEO, CRO, preços, estratégia de produto e conselheiros executivos. 5 de Alireza Rezvani (MIT), 5 de vibeship, 38 sem origem. Cerca de 80% das descriptions trazem gatilho e 23 de 49 começam com "When the user wants..."; 17 passam de 500 linhas (`pricing-strategy` 710, `competitor-alternatives` 750). Há uma sub-skill aninhada (`app-builder/templates`).
- `copywriting`: texto de marketing para páginas; description lista as frases que a acionam.
- `seo-audit`: auditoria de SEO técnico e on-page.
- `pricing-strategy` (710 linhas): preço, pacotes e monetização.
- `cto-advisor`: liderança técnica (dívida técnica, escala de time, métricas); MIT declarada.

### career (21 skills, 31 arquivos)
Currículo, carta, entrevistas, LinkedIn e negociação salarial. 100% das descriptions dizem quando usar; mediana de 367 linhas, nenhuma acima de 500. Bom exemplo de família coerente, fora da sua área.
- `resume-ats-optimizer`: adapta currículo a sistemas ATS.
- `interview-prep-generator`: histórias STAR e perguntas de treino.
- `tech-resume-optimizer`: currículos de engenharia, PM e dados.
- `workorai`: skill de fornecedor (MIT) que usa o MCP do marketplace WorkorAI.

### creative-design (43 skills, 311 arquivos)
Design visual, diagramas, arte generativa, UI/UX, slides e jogos: 33 skills de nível raiz mais 10 sub-skills de `game-development`. 9 `LICENSE` (Apache-2.0), incluindo as da Anthropic. Para o blog, os diagramas são os mais úteis.
- `frontend-design` (71 linhas, Apache-2.0): UI com direção estética própria; 48.434 downloads informados (a mais baixada do catálogo).
- `canvas-design`: arte estática em `.png` e `.pdf` a partir de uma "filosofia de design"; 5,6 MB, 54 fontes TTF.
- `c4-architecture`: documentação de arquitetura com diagramas C4 em Mermaid.
- `mermaid-diagrams`: diagramas de software em Mermaid.

### curviate (9 skills, 9 arquivos)
Pacote do fornecedor Curviate (`author: Curviate`, MIT) para operar o LinkedIn pela CLI `curviate`: perfil, busca, mensagens, conexões, vagas, Sales Navigator e Recruiter. 93 a 315 linhas; descriptions longas (mediana de 489 caracteres). Automatiza conta de terceiros: leia os termos do LinkedIn antes de usar.
- `curviate`: ponto de entrada; diz qual skill resolve cada tarefa.
- `curviate-quickstart`: instala a CLI e autentica a máquina.
- `curviate-search`: busca pessoas, empresas, posts e vagas.

### database (13 skills, 96 arquivos)
PostgreSQL, SQL, migrações, Neon, Supabase e Google Cloud (3 de `google/skills`, Apache-2.0); 5 com `source: community`. Poucas descriptions dizem quando usar (15% a 31%): muitas só resumem o tema.
- `postgresql`: schema, tipos, índices e restrições.
- `database-migration` (439 linhas): migrações entre ORMs, com rollback e zero downtime.
- `supabase-postgres-best-practices` (57 linhas, MIT): boas práticas de desempenho.
- `bigquery-basics`: datasets, tabelas e jobs (origem `google/skills`).

### design-to-code (1 skill, 4 arquivos)
`SKILL.md` na raiz da categoria, mais `LICENSE.txt` (Apache-2.0) e `scripts/` (`coderio-skill.mjs`, `package.json`). O site não a indexa e o formato `categoria/nome` não existe para ela.
- `design-to-code` (159 linhas): converte Figma em React com a ferramenta coderio (TypeScript, Vite, Tailwind v4), com recuperação por checkpoint; exige token do Figma.

### development (230 skills, 1.275 arquivos)
A maior e mais heterogênea: processos (TDD, depuração, revisão, worktrees), linguagens (`java-pro`, `python-pro`, `rust-pro`), nuvem e infra, autoria de plugins do Claude Code (`hook-development`, `plugin-structure`, `command-development`, `agent-development`, `mcp-integration`) e a família `senior-*`. Mediana de 200 linhas, 31 acima de 500, 52% a 54% com "quando usar". 15 de vibeship, 7 de `google/skills`, 46 com `source: community`, 129 sem origem. Concentra os 9 esqueletos vazios.
- `systematic-debugging` (296 linhas): quatro fases, causa raiz antes de corrigir; traz `CREATION-LOG.md` e três testes de pressão.
- `hook-development` (712 linhas, versão 0.1.0): guia de hooks de plugin.
- `java-pro` (175 linhas): Java 21+, virtual threads, Spring Boot 3.x; description sem "quando usar". Não há skill específica de Spring, Maven, JPA ou JUnit (busca por nome e description).
- `senior-backend`: esqueleto; scripts com "Main logic here" e referências com "Scenario 1".

### document-processing (18 skills, 529 arquivos)
Documentos Office e PDF, mais Obsidian. 12 skills têm `scripts/`. Contém as skills de documentos da Anthropic sob licença proprietária (`docx`, `pdf`, `pptx`, `xlsx` e as variantes `-official`, `-anthropic`, `pdf-processing`), skills da OpenAI (`doc`, `spreadsheet`, Apache-2.0) e Obsidian. 94% das descriptions dizem quando usar. `docx` e `pptx` têm 112 arquivos cada.
- `pdf-anthropic`: extrai, mescla, preenche formulários e faz OCR; licença proprietária.
- `doc`: cria e edita `.docx` com python-docx e renderização para conferir o layout.
- `obsidian-markdown` (621 linhas): wikilinks, embeds, callouts, propriedades.
- `documentation-templates` (194 linhas): modelos para README, docs de API e comentários.

### doordash (5 skills, 7 arquivos)
Cinco camadas de proteção para um agente que pede comida pela CLI `dd-cli`: teto de gasto, alergias, pedidos em grupo, livro-razão e pedidos salvos com diff do carrinho. Descriptions muito longas (mediana de 630 caracteres). Mostra o padrão "guardrails para agente que gasta dinheiro".
- `doordash-spend-guard`: política de gasto por pedido, dia, semana e mês.
- `doordash-allergy-shield`: perfil alimentar checado antes do checkout.
- `doordash-order-ledger`: auditoria do que o agente pediu, com hook de auditoria e comando `/doordash-report`.

### enterprise-communication (33 skills, 124 arquivos)
Comunicação e documentação corporativa (comunicados, e-mail, feedback, handoffs de API), família regulatória e de qualidade (CAPA, MDR 745, ISO 27001, ISO 13485, GDPR) e bots de Slack, Telegram, Discord e Twilio. 5 de vibeship, 28 sem origem, 5 `LICENSE`. Aqui está `writing-clearly-and-concisely`, a de escrita mais bem estruturada do catálogo.
- `writing-clearly-and-concisely`: regras de Strunk mais padrões de escrita de IA a evitar; mapa de seções com custo em tokens.
- `internal-comms` (32 linhas): roteia para `examples/` conforme o tipo de comunicado.
- `session-handoff`: documento de passagem de contexto entre sessões.
- `backend-to-frontend-handoff-docs`: documenta a API pronta para o frontend.

### git (3 skills, 7 arquivos)
100 a 152 linhas. A `star-history-chart` gera o gráfico de estrelas do README do próprio projeto. Outras skills de git estão fora desta pasta (ver "O que vale aproveitar").
- `commit-smart` (110 linhas): analisa o diff, propõe commit convencional, pede confirmação e commita; a description traz "Usage" com `/commit-smart fix api`, mas não diz quando usar.
- `git-context-controller` (`name: gcc`): memória do agente como sistema de arquivos versionado em `.GCC/`.
- `star-history-chart`: gráfico SVG de estrelas hospedado no repositório, atualizado por GitHub Action.

### gmod-addon-maker (1 skill, 4 arquivos)
Skill de nicho (addons de Garry's Mod em Lua) com `SKILL.md` na raiz da categoria e `references/`. 43 linhas, `metadata.author: SLAR_Edge`. Fora do índice do site.
- `gmod-addon-maker`: scripts Lua, conteúdo e empacotamento de addons.

### marketing (1 skill, 1 arquivo)
- `x-twitter-scraper` (164 linhas): integração com o Xquik (API e MCP para X/Twitter). Existe também em `business-marketing` com o mesmo nome e conteúdo diferente.

### media (5 skills, 39 arquivos)
Imagem, áudio e vídeo. Três da OpenAI (`author: openai`, `LICENSE.txt` Apache-2.0). As da OpenAI têm "Use when" explícito; `image-enhancer` e `video-downloader` não.
- `transcribe` (82 linhas): transcrição de áudio com identificação opcional de falantes.
- `screenshot` (268 linhas): captura de tela do sistema operacional.
- `speech`: narração e síntese de voz.
- `video-downloader`: baixa vídeos de YouTube e outras plataformas.

### open-banking-io (1 skill, 1 arquivo)
Leitura de saldos e transações de bancos da UE e do Reino Unido pela API PSD2 do open-banking.io. 47 linhas. Lida com dado financeiro: exige token e cuidado.
- `open-banking-io`: consulta saldos, lista transações, categoriza gastos e concilia pagamentos.

### operations (6 skills, 6 arquivos)
Cadeia de suprimentos e operações: segmentação ABC-XYZ, acurácia de previsão, OTIF, Pareto de causa raiz, estoque de segurança e relatório semanal. 35 a 47 linhas, todas com "Use when" (algumas com gatilhos em turco, o que sugere autoria turca; não verificado). Exemplo de skill curta e densa.
- `weekly-ops-report` (35 linhas): relatório semanal que responde o que mudou, onde se concentra e o que exige decisão.
- `otif-analysis`: auditoria de entrega a partir de dados por pedido.
- `safety-stock-review`: dimensiona e audita estoque de segurança.

### pocketbase (6 skills, 6 arquivos)
Seis skills `pb-*`: regras de API, coleções, deploy, hooks em JavaScript, migrações e SDK. De 125 a 603 linhas, todas com "Use when". Bom exemplo de tema fatiado em skills pequenas e independentes.
- `pb-api-rules` (208 linhas): regras de acesso e filtros; ajuda a depurar 403 e 404.
- `pb-hooks` (603 linhas, acima da recomendação): hooks de servidor (rotas, eventos, cron).
- `pb-deploy` (369 linhas): Docker, systemd, proxy reverso, TLS, SMTP, backups.

### productivity (50 skills, 166 arquivos)
Escrita, planejamento, revisão de código e autoria de skills. Cerca de 80% das descriptions dizem quando usar. Reúne as melhores para o seu caso: `avoid-ai-writing`, `crafting-effective-readmes`, `doc-coauthoring`, `commit-work`, `skill-creator`, `skill-judge`, `skill-developer`, `writing-skills`. 4 passam de 500 linhas (`kaizen` 730, `skill-judge` 752, `avoid-ai-writing` 786).
- `skill-judge` (752 linhas): rubrica de 120 pontos em 8 dimensões; fórmula "bom skill = conhecimento de especialista menos o que o Claude já sabe".
- `avoid-ai-writing`: audita e reescreve texto para tirar marcas de escrita de IA; modos detect, rewrite e edit; MIT, versão 3.22.3, autor (Conor Bronsdon) e repositório declarados; regras pensadas para inglês.
- `crafting-effective-readmes` (78 linhas): escolhe template de README por tipo de projeto.
- `doc-coauthoring` (375 linhas): fluxo em três estágios (contexto, refinamento, teste com leitor sem contexto) para specs e propostas.

### railway (12 skills, 16 arquivos)
Pacote oficial da Railway (`author: Railway`, MIT) para a CLI `railway`: deploy, new, environment, service, domain, metrics, status e outras. Descriptions com gatilhos e desambiguação, `allowed-tools` com escopo. A CLI instala cada uma numa pasta de nome genérico (`deploy`, `new`, `status`), embora o `name` do frontmatter seja `railway-deploy` etc.
- `deploy`: `railway up` em modo detach ou CI.
- `environment` (401 linhas): variáveis de ambiente e configuração.
- `railway-docs` (52 linhas): busca documentação atualizada da Railway.

### scientific (139 skills, 1.032 arquivos)
Pacote científico (o README atribui à K-Dense, MIT): bioinformática, química, bancos biomédicos, estatística, visualização, escrita e revisão científica. 135 de nível raiz mais 4 sub-skills `document-skills` (`docx`, `pdf`, `pptx`, `xlsx` da Anthropic, licença proprietária). 50 passam de 500 linhas; cerca de 36% das descriptions dizem quando usar; 67 têm scripts. Quase nenhuma declara autor ou licença no frontmatter. A maioria é irrelevante para backend; a exceção é a trilha de escrita.
- `scientific-writing` (483 linhas): manuscritos em prosa (IMRAD, CONSORT/PRISMA); exige figuras geradas por outra skill (acoplamento).
- `markitdown`: converte PDF, Office, imagens, áudio e HTML em Markdown; MIT.
- `pubmed-database`: acesso REST ao PubMed; a description diz quando preferir biopython.
- `literature-review` (584 linhas): revisões sistemáticas em várias bases.

### security (47 skills, 85 arquivos)
Segurança, de defensiva a ofensiva. 29 skills de zebbern no catálogo (27 nesta categoria, pentest e red team, sem licença), 3 da OpenAI (Apache-2.0), 3 da Ansvar Systems (CC-BY-4.0), mais as defensivas (`secrets-management`, `sast-configuration`, `supply-chain-guard`, `api-security-best-practices` com 907 linhas). Cerca de 75% das descriptions dizem quando usar. As ofensivas são de uso duplo.
- `security-best-practices` (88 linhas): revisão por linguagem e framework; só tem referências de Python (Django, FastAPI, Flask), JavaScript/TypeScript (Express, Next, React, Vue, jQuery) e Go; nada de Java. Autoria OpenAI, Apache-2.0.
- `security-threat-model` (82 linhas): modelagem de ameaças ancorada no repositório, sem restrição de linguagem; "trigger only when the user explicitly asks".
- `supply-chain-guard`: ataques de cadeia de suprimento em npm, PyPI, crates.io e GitHub Actions; autor `dan-avila`, base de IOCs de 2026-03-31.
- `metasploit-framework`: guia ofensivo com exigência de autorização por escrito.

### sentry (6 skills, 6 arquivos)
Convenções de engenharia da Sentry: `code-review`, `commit`, `create-pr`, `deslop`, `find-bugs`, `iterate-pr`. De 23 a 157 linhas, todas com "Use when". Curtas e diretas, entre as melhores do catálogo; sem `LICENSE` nem origem declarada.
- `find-bugs` (75 linhas): revisa a branch em fases e não altera nada.
- `deslop` (23 linhas): remove "lixo de IA" do diff (comentários demais, checagens defensivas, casts).
- `iterate-pr` (139 linhas): itera num PR até o CI passar.
- `commit`: mensagens de commit no padrão da Sentry.

### sports (1 skill, 2 arquivos)
- `footballbin-predictions` (75 linhas): previsões de partidas (Premier League e Champions League) pelo FootballBin; description curta sem "quando usar". Nicho comercial.

### utilities (12 skills, 22 arquivos)
Miscelânea: automação de navegador, Playwright, crawl pela Cloudflare, domínios, redes e meta-skills. Entre 33% e 50% das descriptions dizem quando usar.
- `template-skill` (6 linhas): placeholder ("Replace with description..."); instalado como está, vira skill inútil.
- `using-superpowers`: força o modelo a invocar skill antes de qualquer resposta (ver "Cuidados").
- `playwright-skill` (453 linhas): automação de navegador e testes de UX.
- `web-artifacts-builder`: artefatos HTML com React, Tailwind e shadcn/ui (Anthropic, Apache-2.0).

### video (4 skills, 55 arquivos)
Vídeo programático: `manim`, `motion-canvas`, `remotion` (autor declarado como o projeto, MIT) e `sora` (OpenAI, com `scripts/sora.py`). Só 25% das descriptions dizem quando usar.
- `remotion` (135 linhas): boas práticas de vídeo em React.
- `manim`: animações matemáticas em Python.
- `sora`: gera, remixa e baixa vídeos pela API da OpenAI.

### web-data (7 skills, 22 arquivos)
Skills do patrocinador Bright Data (`scrape`, `search`, `data-feeds`, `bright-data-mcp`, `bright-data-best-practices`; exigem `BRIGHTDATA_API_KEY` e zona Unlocker; `design-mirror` também cita a chave e a zona) mais `pricewin-travel-search`, que pode enviar pedido de reserva de hotel e cancelar. A description de `scrape` diz que contorna detecção de bots e CAPTCHA.
- `scrape` (64 linhas): extrai uma página como Markdown pelo Web Unlocker.
- `bright-data-mcp`: manda usar o MCP da Bright Data para qualquer tarefa de internet no lugar de WebFetch e WebSearch.
- `design-mirror`: replica o estilo visual de um site no seu código.

### web-development (30 skills, 108 arquivos)
Frameworks e práticas web: Astro, Hono, SvelteKit, shadcn, TanStack Query, Electron, Tailwind, SEO e desempenho. Cerca de 33% das descriptions dizem quando usar; 15 com `source: community`, 3 do autor suhaibjanjua; `electron-development` tem 856 linhas.
- `building-blog`: blog em Next.js com Sanity e SEO; description com gatilhos explícitos.
- `astro`: sites orientados a conteúdo (zero JS por padrão, ilhas, MDX).
- `web-performance-optimization` (646 linhas): Core Web Vitals, bundle e cache.
- `shadcn`: gerencia componentes shadcn/ui; origem declarada no repositório da shadcn; traz um `` !`npx shadcn@latest info --json` `` que executa na carga da skill.

### workflow-automation (23 skills, 61 arquivos)
Automação de GitHub e CI, de SaaS via Rube/Composio MCP (Jira, Linear, Slack) e de jobs. 16 de nível raiz mais 7 sub-skills n8n (cobertas pela `LICENSE.md` MIT de `n8n/`). 6 marcadas `risk: critical` no frontmatter (`github-actions-templates`, `github-automation`, `gitops-workflow`, `jira-automation`, `linear-automation`, `slack-automation`), mais `development/bash-pro`. 7 passam de 500 linhas (`github-workflow-automation` 846).
- `dependabot-review` (109 linhas, MIT): revisa PRs do Dependabot por risco e faz auto-merge dos seguros.
- `yeet` (OpenAI): stage, commit, push e PR numa tacada; "use only when the user explicitly asks".
- `github-actions-templates`: padrões prontos de workflows de GitHub Actions.
- `n8n-workflow-patterns`: padrões de workflows n8n; existe também em `n8n/` com conteúdo diferente.

## O que vale aproveitar

Esforço: baixo, médio ou alto.

1. **Auditar as skills do kit com a rubrica do `skill-judge`** (baixo). `productivity/skill-judge/SKILL.md`. Dá critérios objetivos (120 pontos em 8 dimensões) para revisar `mensagem-de-commit`, `explicar-erro`, `explicar-mudancas` e as futuras. As três atuais já têm description com "Use quando" e frases literais de gatilho; o ganho é manter o padrão. Cuidado: sem `LICENSE` e sem origem; use como checklist e escreva a sua versão em português. Tem 752 linhas, acima da recomendação.
2. **Loop de avaliação de description do `skill-creator`** (médio). `productivity/skill-creator/SKILL.md`. Descreve testar a skill com e sem ela, assertivas, e otimizar a description dividindo os exemplos em 60% de treino e 40% de teste (exemplo com `--max-iterations 5`); é o único material do catálogo que mede se a skill dispara. Cuidado: Apache-2.0 (copiar exige manter `LICENSE.txt` e marcar mudanças); a Anthropic mantém a versão oficial, então prefira instalar a original; os scripts exigem Python e a CLI `claude`.
3. **Verificação de segurança de skills no CI (SkillSpector)** (médio). `.github/workflows/skill-security-scan.yml`, `skill-security-scan-all.yml` e `scripts/skillspector_scan.py`. Em PR que muda skills roda `skillspector scan --no-llm` (NVIDIA, Apache-2.0), comenta o relatório, envia SARIF ao code scanning e bloqueia risco acima de 50; há varredura semanal (segundas, 06:00 UTC) que só reporta. Para um marketplace público, é a defesa mais barata contra skill maliciosa. Cuidado: instala com `pip install git+...skillspector.git@main` sem fixar versão (fixe um commit ou tag); análise estática dá falso positivo e falso negativo.
4. **Validador de estrutura para o seu repositório** (baixo). A medição mostra o que um script simples evita: nome fora da spec (55), nome diferente da pasta (167), YAML inválido (1), mais de 500 linhas (152), referências inexistentes, description sem "quando usar", e campos fora dos seis da spec (350), que quebram o upload no claude.ai. A spec oferece `skills-ref validate`. Cuidado: a spec limita a description a 1.024 caracteres e o Claude Code a 1.536 (com `when_to_use`); decida qual seguir e documente no `CONTRIBUTING`.
5. **Padrão de description: o quê, quando e frases literais, inclusive pedidos indiretos** (baixo). `.claude-plugin/skills/owasp-security/SKILL.md` cita pedidos indiretos ("is this login flow secure?"); `railway/deploy` diz qual skill usar em vez de si mesma; `avoid-ai-writing` lista os pedidos literais e os modos. É o que decide se a skill dispara, e em cerca de 40% do catálogo falta o "quando". Cuidado: o skill-creator recomenda descriptions "insistentes"; teste antes de exagerar. A `owasp-security` tem 905 linhas.
6. **Divulgação em camadas: mapa de arquivos com custo e roteador para `examples/`** (baixo). `writing-clearly-and-concisely` informa o custo em tokens de cada arquivo e qual carregar na maioria dos casos; `internal-comms` tem 32 linhas que mandam ler só o exemplo do tipo pedido. Boa forma para uma skill do kit de revisão de PR com um arquivo por stack (Java, Spring, Kubernetes). Cuidado: os custos declarados parecem subestimados (o arquivo "03" tem 33,6 KB e a tabela diz 4.500 tokens); `signs-of-ai-writing.md` (94 KB) é derivado de guia da Wikipedia e os textos de Strunk estão incluídos, e a licença desses anexos não foi verificada.
7. **Testes de pressão e registro de criação junto da skill** (médio). `development/systematic-debugging/` traz `CREATION-LOG.md` e três cenários usados para ver se o modelo racionaliza e pula o processo. Ideia: uma pasta `evals/` por skill do kit, com prompts e o resultado esperado. Cuidado: estilo de obra/superpowers (MIT) sem `LICENSE` na pasta; o texto em caixa alta ("Iron Law") contraria a recomendação de explicar o porquê; os "95% contra 40%" não têm fonte.
8. **`find-bugs` (Sentry) como modelo de skill de revisão, adaptada a Java e Spring** (baixo). 75 linhas com fases, checklist, auditoria antes de concluir e as regras "não invente problemas" e "não faça mudanças". Adaptada a transações, N+1, injeção e autorização em Spring, vira uma skill de revisão para o kit. Cuidado: sem `LICENSE` nem origem; reescreva em vez de copiar. Usa `git diff master...HEAD` fixo.
9. **Skills de git fora da pasta `git`** (baixo). `productivity/commit-work` (56 linhas, "Use when" com frases literais, divide em commits lógicos), `development/changelog-generator`, `development/finishing-a-development-branch`, `development/using-git-worktrees`, `sentry/create-pr` e `sentry/iterate-pr`. Servem de comparação para as skills de commit do kit. Cuidado: `commit-work` cita um `references/commit-message-template.md` que não existe; `commit-smart` não diz quando usar na description.
10. **Skills de escrita e documentação para o blog** (médio). `avoid-ai-writing` (MIT, autor e repositório declarados, modos detect e edit), `writing-clearly-and-concisely`, `crafting-effective-readmes` e `doc-coauthoring` cobrem o ciclo de um post; para documentação técnica há ainda `development/architecture-decision-records` (445 linhas) e `development/api-documentation-generator` (485 linhas), ambas sem "quando usar" na description. Cuidado: as regras de `avoid-ai-writing` foram escritas para inglês (hífens longos, vocabulário); para pt-BR é preciso adaptar (não verifiquei equivalentes). Confira a licença de cada uma antes de redistribuir.
11. **Skills de autoria de plugin, hook e comando como referência para a série do blog** (baixo). `hook-development`, `plugin-structure`, `command-development`, `agent-development`, `plugin-settings`, `mcp-integration` (versão 0.1.0, estilo "This skill should be used when..."). Servem para checar se o post esqueceu algum evento de hook ou campo de manifesto. Cuidado: origem provável em `anthropics/claude-code`, não confirmada; `command-development` tem 834 linhas; confira contra a documentação da 2.1.289.
12. **Explorar o frontmatter moderno que nenhuma skill do catálogo usa** (baixo). Nenhuma das 914 usa `disable-model-invocation`, `context: fork`, `paths` ou `when_to_use`. Skills com efeito colateral (deploy, commit) devem ser só manuais; com `disable-model-invocation: true` a description nem entra no contexto. Revisões longas podem rodar em subagente com `context: fork`. É diferencial do kit e assunto de post. Cuidado: confirme os campos e as versões mínimas na página antes de publicar (por exemplo `background` exige 2.1.218).
13. **Mostrar o custo de cada skill no inventário do csr-cockpit** (alto). A ideia do `skill-dashboard` (tamanho do `SKILL.md`, arquivos de apoio, origem) combina com a aba Inventário do seu mod; o custo real vem de `/skill-doctor` (2.1.252 ou mais novo) e `/doctor`. Cuidado: não copie o rótulo "SKILL.md sempre carregado" nem o servidor aberto à rede com CORS `*`.
14. **Mod `jev-skill-suggestion`** (médio; fora desta frente, li só o início do README). `cli-tool/components/mods/productivity/jev-skill-suggestion`: tira a listagem de skills do contexto e escolhe no máximo uma skill por prompt, carregando o `SKILL.md` ele mesmo (exige 2.1.278 ou mais novo; usa `skillOverrides`). Mostra a outra saída para o custo da listagem. Cuidado: o README descreve chamadas a `api.typesafe.ai` ou `ai-gateway.vercel.sh` quando há chave; o conteúdo exato enviado não foi verificado.
15. **Checklist "antes de instalar skill de terceiros" no README do kit** (baixo). A doc avisa que `allowed-tools` de skill de projeto vale mesmo sem workspace trust e que `` !`comando` `` executa na sua máquina (desligável com `disableSkillShellExecution`). No catálogo há 84 skills com `allowed-tools` (34 com `Bash` sem escopo) e 3 com `hooks`. Um checklist curto (licença, `allowed-tools`, hooks, scripts, comandos `!`, referências quebradas) protege quem usa o kit.
16. **Skills de segurança defensiva para um backend** (baixo). `security-threat-model` (sem restrição de linguagem), `owasp-security` do próprio repositório (seis padrões OWASP, 905 linhas) e `supply-chain-guard` (base de IOCs de março de 2026). Cuidado: `security-best-practices` não cobre Java (só Python, JS/TS e Go); aproveite dela só o padrão de um arquivo de referência por linguagem e framework. Apache-2.0: manter `LICENSE` e `NOTICE`. Evite as de pentest no seu marketplace: uso duplo e sem licença.

## Cuidados

- **Licenças.** 14 `SKILL.md` declaram "Proprietary" e 13 pastas têm a `LICENSE` da Anthropic que proíbe copiar, criar derivados e redistribuir; o attribution cita só 4. O repositório as redistribui sob MIT. Não copie nenhuma para o `claude-code-kit`; escreva a sua a partir da documentação.
- **README versus arquivos.** O README afirma 139 skills científicas sob MIT, mas 4 (`scientific/document-skills/*`) são proprietárias da Anthropic, e só `markitdown` e `neuropixels-analysis` têm `LICENSE` MIT na pasta. README e attribution divergem na contagem de skills da Anthropic (21 no README; 18 itens no attribution). O attribution cita `THIRD_PARTY_NOTICES.md` e nenhum existe.
- **Sem licença não há permissão clara.** 836 de 914 skills (91%) sem arquivo de licença; 541 (59%) sem autor ou origem; zebbern (29 skills de pentest) sem licença. Apache-2.0 exige manter a licença e marcar alterações.
- **Popularidade não é qualidade.** 9 skills são o mesmo esqueleto (`code-reviewer`, `senior-architect`, `senior-backend`, `senior-devops`, `senior-frontend`, `senior-fullstack`, `senior-qa`, `senior-secops`, `senior-security`): os 27 scripts têm "Main logic here" e as 27 referências têm "Scenario 1"; somam 134.176 downloads informados. `latex-posters` e `pptx-posters` têm `SKILL.md` idêntico; 19 `SKILL.md` são cópias exatas; `template-skill` é placeholder; `secrets-management` tem referências inexistentes e `echo` de secrets em exemplo de CI. Nenhuma skill é validada: no `components.json` as 890 têm `security.validated = false`.
- **Números do site não são auditáveis.** Downloads vêm de telemetria anônima sem auditoria. `docs.aitmpl.com` fala em "2700+" skills, contra 890 no `components.json` e 914 no `tree.json`; a diferença não foi resolvida (não verificado). Estrelas lidas em 04/10/2026: 32.375.
- **Instalador (pelo código; não executei).** Baixa de `main` sem versão fixa nem checksum; grava arquivos como texto (corromperia as 54 fontes TTF de `canvas-design` e PNG/PDF de outras); achata nomes (22 repetidos, 12 com conteúdo diferente, sobrescrita silenciosa); ignora falhas de download de arquivo; usa a API do GitHub sem token (limite anônimo documentado de 60 por hora; `cloudflare-deploy` precisa de 64 listagens; efeito não testado); a mensagem de erro lista só 4 categorias de 31.
- **Segurança das skills.** 84 têm `allowed-tools` (34 com `Bash` sem escopo) e, segundo a documentação, uma skill de projeto vale mesmo sem workspace trust. 3 trazem hooks (`gh-address-comments` e `git-commit-helper` gravam logs em `~/.claude`; `planning-with-files` roda `cat task_plan.md` antes de Write, Edit e Bash e um hook Stop com `${CLAUDE_PLUGIN_ROOT}`, variável que a doc só descreve para skills de plugin; efeito fora de plugin não testado). `loki-mode` exige `--dangerously-skip-permissions` e promete "zero human intervention" com deploy automático. Cerca de 35 skills mencionam `sudo`, 5 mandam `curl | sh`, 8 usam `rm -rf`, 7 estão marcadas `risk: critical`. As 27 de pentest da pasta `security` (zebbern) são de uso duplo. `scrape` e `bright-data-mcp` anunciam contorno de CAPTCHA e de detecção de bots; `pricewin-travel-search` pode pedir e cancelar reservas.
- **Skills de fornecedor e comerciais.** `curviate` (automação de LinkedIn), `x-twitter-scraper` (Xquik), `footballbin-predictions`, `pricewin-travel-search` e a família Bright Data (patrocinador). O README traz bloco "Sponsored by Bright Data" com link de campanha e um comando `npx` pré-montado que instala as skills e o MCP deles; não segui nada disso. Que o link seja de afiliado: não verificado.
- **Textos lidos que tentaram dar ordens ao modelo** (registrados, não seguidos): `web-data/bright-data-mcp` ("MUST replace WebFetch and WebSearch", "No exceptions"); `utilities/using-superpowers` (bloco `EXTREMELY-IMPORTANT`: "YOU MUST USE IT", "not negotiable"); `scientific/scientific-writing` (figuras "MANDATORY"); `productivity/brainstorming` ("You MUST use this before any creative work"). Em skill instalada isso vira ordem ao seu agente. Em sentido oposto, `avoid-ai-writing` traz defesa explícita contra instruções escondidas no texto auditado.
- **Dashboard de skills.** Escuta em todas as interfaces com CORS `*`, checagem de caminho por prefixo, rótulo "SKILL.md sempre carregado" contraditório com a documentação, atalhos e virtual scrolling prometidos mas ausentes.
- **Limites desta pesquisa.** As medidas de frontmatter e de "quando usar" usam regex e o parser YAML do Ruby (1 arquivo falha); o parser do Claude Code pode diferir. Não executei o instalador, o dashboard nem nenhum script (regra da pesquisa). Não verifiquei a origem real de skills sem autor, nem se o Claude Code ignora campos fora da tabela dele (`source`, `risk`, `tags`).

## Fontes

- https://github.com/davila7/claude-code-templates (lido por `gh api` e GraphQL; 32.375 estrelas, licença MIT, em 04/10/2026)
- `README.md` (seções Attribution, Quick Installation e bloco patrocinado) e `CONTRIBUTING.md` (sem menção a skills)
- `cli-tool/components/skills/ANTHROPIC_ATTRIBUTION.md`
- `cli-tool/SKILLS_DASHBOARD.md`
- `cli-tool/src/skill-dashboard.js` e `cli-tool/src/skill-dashboard-web/` (`index.html`, `script.js`, `styles.css`)
- `cli-tool/src/index.js` (função `installIndividualSkill` e roteamento de `--skill` e `--skills-manager`), `cli-tool/bin/create-claude-config.js` e `cli-tool/src/tracking-service.js`
- `docs/components.json` (índice do site: 890 skills, downloads e campo `security`)
- `tree.json` do scratchpad (12.191 caminhos; contagens por categoria, extensão e `LICENSE`)
- Os 914 `SKILL.md` (texto e frontmatter, lidos em lote por GraphQL e conferidos contra o SHA de cada blob)
- 73 arquivos `LICENSE`, `LICENSE.txt`, `LICENSE.md` e `NOTICE.txt` de pastas de skill (classificados por script; leitura completa de `document-processing/pdf-anthropic/LICENSE.txt` e da cláusula 4 de `productivity/skill-creator/LICENSE.txt`)
- `SKILL.md` lidos inteiros: `sentry/find-bugs`, `utilities/template-skill`, `enterprise-communication/internal-comms`, `enterprise-communication/writing-clearly-and-concisely`, `railway/deploy`, `security/secrets-management`, `git/commit-smart`, `productivity/commit-work`, `productivity/crafting-effective-readmes`, `document-processing/pdf-anthropic`, `development/systematic-debugging`, `development/senior-backend`
- `SKILL.md` lidos em parte ou por trecho: `productivity/skill-judge`, `productivity/skill-creator`, `productivity/avoid-ai-writing`, `productivity/planning-with-files`, `development/gh-address-comments`, `development/git-commit-helper`, `development/hook-development`, `development/java-pro`, `ai-research/loki-mode`, `web-data/bright-data-mcp`, `web-data/scrape`, `utilities/using-superpowers`, `productivity/brainstorming`, `scientific/scientific-writing`, `security/security-best-practices`, `security/security-threat-model`, `design-to-code`, `gmod-addon-maker`, `operations/weekly-ops-report`, `doordash/doordash-order-ledger`, `curviate/curviate`
- `development/systematic-debugging/CREATION-LOG.md` (nome e tamanho no `tree.json`); 54 arquivos de `scripts/` e `references/` das 9 skills esqueleto (lidos por GraphQL)
- `.claude-plugin/skills/owasp-security/SKILL.md`
- `.github/workflows/skill-security-scan.yml`, `.github/workflows/skill-security-scan-all.yml` e `scripts/skillspector_scan.py`; https://github.com/NVIDIA/SkillSpector (metadados via GraphQL: Apache-2.0)
- `cli-tool/components/mods/productivity/jev-skill-suggestion/README.md` (início)
- https://code.claude.com/docs/en/skills (leitura por WebFetch, e cópia local da página no scratchpad)
- https://agentskills.io/specification
- https://www.aitmpl.com/component/skill/git/star-history-chart
- https://docs.aitmpl.com/
- Local, só leitura: `/Users/cesar.schutz/Downloads/claude-code-kit` (`skills/mensagem-de-commit/SKILL.md`, `skills/explicar-erro/SKILL.md`, `plugins/exemplos/skills/explicar-mudancas/SKILL.md`)

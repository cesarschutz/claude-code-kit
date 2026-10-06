# 07 · O tipo MCPs (cli-tool/components/mcps, 13 categorias, ~105 arquivos)

Conferido em 04/10/2026, somente leitura: nada foi instalado nem executado. Números de downloads são "números informados pelo site" nessa data.

## Explicação

### O que é um servidor MCP e como o Claude Code o configura

MCP (Model Context Protocol) é um padrão aberto para ligar o Claude Code a ferramentas e dados externos. O servidor expõe ferramentas e o Claude as chama (https://code.claude.com/docs/en/mcp).

- **Transportes:** `stdio` (processo local, por exemplo `claude mcp add --transport stdio nome -- npx -y pacote`; o `--` separa as opções do Claude dos argumentos do servidor), `http` (recomendado para servidores remotos), `sse` (obsoleto) e `ws` (WebSocket, `type: "ws"` no JSON).
- **Escopos** (`--scope local|project|user`):
  - `local` (padrão): só você, só naquele projeto, gravado em `~/.claude.json` sob o caminho do projeto.
  - `project`: arquivo `.mcp.json` na raiz do projeto, versionável.
  - `user`: `~/.claude.json`, vale em todos os projetos.
  - Em conflito de nome vence local, depois project, user, plugin e conectores do claude.ai.
- **Aprovação:** em sessão interativa o Claude Code pede aprovação antes de usar servidor vindo de `.mcp.json` de projeto. `enableAllProjectMcpServers` pula esse pedido; `enabledMcpjsonServers` e `disabledMcpjsonServers` escolhem servidor por servidor. Em pasta não confiável, essas chaves no `.claude/settings.json` do projeto são ignoradas.
- **Atalhos da CLI:** `claude mcp add-json <nome> '<json>'` e `--env CHAVE=valor` no `claude mcp add`.
- **Variáveis no `.mcp.json`:** vale `${VAR}` e `${VAR:-padrão}` em `command`, `args`, `env`, `url` e `headers`. Uma entrada com `url` e sem `type` é erro de configuração: o Claude Code a lê como stdio, ignora o servidor e avisa `has a "url" but no "type"`.
- **Plugins também empacotam MCP:** `.mcp.json` na raiz do plugin (com o invólucro `mcpServers`, como na documentação) ou `mcpServers` no `plugin.json` (inline, caminho `.json` ou bundle `.mcpb`/`.dxt`). Os servidores iniciam sozinhos quando o plugin é habilitado, e `${CLAUDE_PLUGIN_ROOT}` e `${CLAUDE_PLUGIN_DATA}` valem em `command`, `args` e `env`.
- **Segredo em plugin:** `userConfig` com `sensitive: true` mascara a entrada, guarda o valor no armazenamento seguro da plataforma e o injeta como `${user_config.KEY}` na configuração do MCP (https://code.claude.com/docs/en/plugins-reference).
- **Validação:** a partir do Claude Code 2.1.281, `claude plugin validate` checa cada entrada de MCP do plugin. É erro uma entrada que o Claude Code descartaria, uma `${user_config.KEY}` não declarada e uma `url` inválida. É aviso uma URL `http://` ou `ws://` fora de loopback e um header que parece credencial literal. Sua máquina está na 2.1.289.
- **Limite do plugin:** o `settings.json` de plugin só aplica `agent` e `subagentStatusLine`; outras chaves de settings são descartadas.

### Formato dos componentes

Li os 105 arquivos de `cli-tool/components/mcps`: todos são JSON válido, cada um com `mcpServers` e exatamente um servidor.

| Forma | Qtd | Detalhe |
| --- | --- | --- |
| stdio via npx/pnpx | 59 | 53 pacotes npm distintos (mcp-remote x3, mcp-code-graph x4, mongodb-mcp-server x2). O webflow põe `npx mcp-remote https://...` inteiro em `command`. |
| stdio via uvx | 10 | mais 1 `uv`, 1 `pipx` |
| stdio via docker | 4 | elasticsearch, github-official, markitdown, terraform |
| stdio com binário ou python local | 10 | aks-mcp, mcp-grafana, imagesorcery-mcp, just-mcp, mcp-server-leetcode, nika, serena, browser-use-mcp-server e dois `python` em marketing |
| remoto (`url`) | 20 | 10 `type: http`, 1 `sse`, 9 sem `type` |

- O campo `description` fica dentro do objeto do servidor (101 arquivos). Não existe no formato do Claude Code: é texto de catálogo, removido na instalação.
- Há campos de outros clientes (`transportType`, `autoApprove`, `timeout` em imagesorcery) e um erro de digitação (`descrption` em mcp-server-nia).
- Nenhum arquivo traz credencial real: só placeholders (`<your-api-key>`, `your_api_key`, `ntn_****`, `user:password@localhost`). Uma busca por padrões de token (sk-, ghp_, xox, AKIA, JWT, sequências longas) nos 105 arquivos não achou nada.

### Como a CLI instala

- Comando mostrado na página do componente: `npx claude-code-templates@latest --mcp devtools/context7`. `--mcp` aceita lista separada por vírgula, e `--mcp-stats` analisa o `.mcp.json` do diretório atual.
- A função `installIndividualMCP` (cli-tool/src/index.js, linha 621) baixa o JSON de `raw.githubusercontent.com/davila7/claude-code-templates/main/...`, apaga `description` de cada servidor e mescla no `.mcp.json` do diretório de destino (cria o arquivo se não existir).
- A mescla é de um nível: servidor com o mesmo nome é sobrescrito sem aviso (sentry.json e sentry-local.json usam ambos a chave `"sentry"`).
- Não usa `claude mcp add` e não escreve no escopo user. Só o instalador de settings tem destinos user, project, local e enterprise.
- Exige `categoria/nome`: `mcps/web-fetch.json` dá 404 e `mcps/web/web-fetch.json` dá 200. O código trata os dois formatos igual, e a mensagem de erro do 404 lista nomes sem categoria, que também dariam 404.
- **Telemetria** (cli-tool/src/tracking-service.js), ligada por padrão e desligada por `CCT_NO_TRACKING=true`, `CCT_NO_ANALYTICS=true` ou `CI=true`. Três endpoints em www.aitmpl.com:
  - `/api/track-download-supabase` recebe tipo, nome, caminho, categoria e versão da CLI.
  - `/api/track-installation-outcome` recebe nome, resultado, tempo, mensagem de erro, versão do Node, plataforma, arquitetura e `batchId`.
  - `/api/track-command-usage` recebe o comando executado, versão da CLI, Node, plataforma e arquitetura.
- As chaves ficam como placeholder e você edita o arquivo à mão.

### O que há dentro

13 categorias, 105 componentes. A categoria devtools concentra 49 (observabilidade, CI, nuvem, navegador, código); web-data 11; database 8; integration 8; browser_automation 6; web 6; productivity 5; deepgraph 4; marketing 4; e uma de cada em audio, deepresearch, filesystem e research. O cabeçalho de https://www.aitmpl.com/mcps diz "55+ MCP Integrations", defasado frente aos 105 do repositório.

Mais baixados (números do site e do índice `dashboard/public/components/mcps.json`): context7 14.545, memory-integration 7.852, playwright-mcp-server 6.175, postgresql-integration 4.858, web-fetch 4.758, github-integration 4.159, supabase 4.111, chrome-devtools 4.082 e filesystem-access 3.069 (9º).

### Segredos e cadeia de suprimento

- **Pacotes executados no seu computador:** 59 entradas rodam pacote por npx/pnpx (53 npm distintos). Nenhuma fixa versão; 19 usam `@latest`; 8 não passam `-y` (browsermcp, mcp-server-browserbase, playwright-mcp, trello, microsoft-clarity, testsprite, webflow, monday). Há ainda 10 uvx, 1 pipx, 1 uv e 4 docker; só o Terraform fixa tag (`0.2.3`; a última release do repositório é v1.3.0, de 26/08/2026). github-official e elasticsearch não têm tag e markitdown usa `markitdown-mcp:latest` sem registro.
- **Onde fica o segredo:** 39 entradas em `env` (inclui strings de conexão; a de devtools/mongodb é local e sem senha), 8 em `headers`, 5 como argumento de linha de comando (launchdarkly, logfire, microsoft-clarity, monday, facebook-ads) e 1 na query da URL (brightdata). Nenhum componente usa `${VAR}`; o único `${...}` (postman) é a sintaxe `${input:}` do VS Code, que não vale no Claude Code. Isso destoa da documentação e da skill `mcp-integration` do próprio repositório, que usam `${VAR}`, e convida a gravar token em arquivo versionável por descuido.
- **Auditoria:** `cli-tool/src/security-audit.js` lista `mcps` entre os tipos, mas só varre arquivos `.md`, e o workflow `component-security-validation.yml` só dispara em `cli-tool/components/**/*.md`: os JSON de MCP não passam por ele. O `component-validate.yml` embrulha cada MCP num plugin descartável (`.mcp.json`) e roda `claude plugin validate`; bloqueia nas PRs (só arquivos alterados) e roda toda segunda-feira sem bloquear, e o próprio texto do workflow admite que o catálogo ainda tem erros conhecidos.

### Os nomes existem? (npm, PyPI e GitHub, 04/10/2026)

- **Inexistentes no npm (404):** `@modelcontextprotocol/server-fetch` (web/web-fetch.json) e `browseract-mcp` (web-data/browseract.json). O servidor fetch oficial é Python (`mcp-server-fetch`, PyPI 2026.8.18, pasta `src/fetch` do repositório oficial). Nome sem escopo e livre no npm pode ser registrado por qualquer pessoa: com `npx -y` isso executaria o código dessa pessoa, com a chave em `env` (inferência).
- **Existem, mas deprecated ou retirados:** `@modelcontextprotocol/server-github` e `@modelcontextprotocol/server-postgres` (o README do repositório oficial os lista como arquivados), `@browserbasehq/mcp-server-browserbase` (movido para `@browserbasehq/mcp`), `@circleci/mcp-server-circleci` (use o MCP hospedado), `@curviate/mcp` (hospedado agora), `@dynatrace-oss/dynatrace-mcp-server` (mensagem genérica de "no longer supported") e `@railway/mcp-server` (agora `railway mcp`).
- **Resultado:** 9 dos 59 usos de npx apontam para pacote inexistente ou obsoleto, e 9 remotos estão sem `type`. Dos seis componentes mais baixados, três (postgresql-integration, web-fetch, github-integration) estão nesse grupo.
- **Licenças atípicas:** sentry (FSL-1.1-ALv2), testsprite (BUSL-1.1), local-mcp (UNLICENSED); pulumi e browsermcp sem licença no npm. `mcp-server-mysql` (PyPI) tem a última versão (0.1.4) de 22/03/2025.
- No índice do dashboard os campos `author`, `repo`, `version` e `license` estão vazios nas 105 entradas, então o catálogo não registra procedência nem licença por componente. `flatten-mcp` existe só em `dashboard/public/component-content` (106 contra 105) e está retirado no npm.

### O que é bom e o que preocupa

- **Bom:** catálogo amplo, com servidores oficiais de fornecedores (GitHub, MongoDB, Redis, Supabase, Sentry, Microsoft Playwright, Google Chrome DevTools, Grafana, HashiCorp, Elastic); alguns padrões defensivos (`--read-only` em supabase, `--readOnly` em devtools/mongodb); e a ideia de validar cada componente com o validador oficial do Claude Code.
- **Preocupa:** nada é fixado nem auditado; segredo em texto puro; pacotes mortos entre os mais usados; duplicatas (3 Playwright, 2 MongoDB, 2 GitHub, 2 Sentry); e servidores de alto privilégio (Stripe `--tools=all`, ordens reais na Alpaca, Gmail e Drive, Mail e Mensagens do macOS) a um comando de distância. Todo servidor que busca conteúdo externo também abre risco de injeção de prompt, como a documentação do Claude Code avisa.
- **Settings de MCP no catálogo** (`cli-tool/components/settings/mcp/`): `mcp-timeouts.json` (`MCP_TIMEOUT` 30000, `MCP_TOOL_TIMEOUT` 60000, `MAX_MCP_OUTPUT_TOKENS` 50000, variáveis que a documentação confirma), `enable-specific-servers.json` (`enabledMcpjsonServers`), `disable-risky-servers.json` (`disabledMcpjsonServers` com nomes de exemplo que não existem no catálogo) e `enable-all-project-servers.json` (`enableAllProjectMcpServers: true`, que pula a aprovação).

## Categorias

Legenda da coluna Credencial: `env` = variável no bloco `env`; `header` = Authorization ou similar em `headers`; `arg` = argumento de linha de comando; `query` = token na URL. Todos são placeholders.

### audio (1)

1 uvx. Texto para fala, clonagem de voz, transcrição e efeitos sonoros.

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| elevenlabs | uvx | elevenlabs-mcp (PyPI 0.12.2, MIT) | env ELEVENLABS_API_KEY | Grava arquivos em `~/Desktop` por padrão (`ELEVENLABS_MCP_BASE_PATH`) |

### browser_automation (6)

5 npx e 1 binário (`browser-use-mcp-server`, existe no PyPI, 1.0.3, e precisa estar instalado antes). Só browserbase (3 chaves vazias) e browser-use (OPENAI_API_KEY) pedem chave. Há 3 servidores Playwright diferentes; o oficial é o da Microsoft.

| Componente | Execução | Pacote | Credencial | Observação |
| --- | --- | --- | --- | --- |
| playwright-mcp | npx @latest, sem -y | @playwright/mcp (Microsoft, Apache-2.0, 0.0.83 de 28/09/2026) | nenhuma | Automação por snapshots de acessibilidade |
| playwright-mcp-server | npx -y | @executeautomation/playwright-mcp-server (1.0.12) | nenhuma | Terceiro; o mais baixado da categoria (6.175) |
| mcp-server-playwright | npx -y | @automatalabs/mcp-server-playwright (1.2.1) | nenhuma | Parado desde 24/01/2025 |
| mcp-server-browserbase | npx, sem -y | @browserbasehq/mcp-server-browserbase | env BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, GEMINI_API_KEY | Deprecated (movido para @browserbasehq/mcp) |
| browsermcp | npx @latest, sem -y | @browsermcp/mcp (0.1.3) | nenhuma | Sem licença no npm |
| browser-use-mcp-server | binário local | browser-use-mcp-server | env OPENAI_API_KEY | Portas 8000 e 9000 nos argumentos |

### database (8)

5 npx, 2 uvx e 1 remoto sem `type`. Seis pedem string de conexão ou token em `env`. Úteis para backend, com ressalvas.

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| dbhub | npx @latest | @bytebase/dbhub (MIT, 1.4.0 de 28/09/2026) | env DATABASE_DSN | PostgreSQL, MySQL, MariaDB, SQL Server e SQLite; README cita somente leitura, limite de linhas e timeout. A documentação do Claude Code usa `--dsn` com usuário somente leitura |
| supabase | npx @latest | @supabase/mcp-server-supabase (0.13.0) | env SUPABASE_ACCESS_TOKEN | Já com `--read-only` e `--project-ref` |
| redis | uvx | redis-mcp-server@latest (PyPI 0.5.1) | env REDIS_URL | Oficial |
| mongodb-official | npx @latest | mongodb-mcp-server (Apache-2.0, 3.0.5) | env MDB_MCP_CONNECTION_STRING | Não liga somente leitura (devtools/mongodb liga) |
| mysql-integration | uvx | mcp-server-mysql (PyPI 0.1.4) | env MYSQL_CONNECTION_STRING | Última versão em 22/03/2025 |
| postgresql-integration | npx -y | @modelcontextprotocol/server-postgres | env POSTGRES_CONNECTION_STRING | Deprecated e arquivado; 4º mais baixado (4.858) |
| neon | npx -y mcp-remote | https://mcp.neon.tech/mcp | nenhuma no arquivo | Autenticação por OAuth: não verificado |
| postgresql-documentation | remoto sem type | https://mcp.tigerdata.com/docs | nenhuma | Documentação de PostgreSQL |

### deepgraph (4)

4 npx do mesmo pacote `mcp-code-graph@latest` (CodeGPT/JudiniLabs, MIT, última publicação 26/06/2025), apontando para repositórios públicos fixos: vercel/next.js, facebook/react, microsoft/TypeScript e vuejs/core (deepgraph-nextjs, -react, -typescript, -vue). Sem chave: segundo o README, grafos públicos do deepgraph.co não exigem conta; grafos privados exigem conta CodeGPT e chave. Consultam grafos hospedados, não o seu código local.

### deepresearch (1)

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| mcp-server-nia | pipx run --no-cache | nia-mcp-server (PyPI 1.1.2) | env NIA_API_KEY, NIA_API_URL | Serviço hospedado de terceiros (https://apigcp.trynia.ai/); o arquivo tem o erro `descrption` |

### devtools (49)

Maior categoria: 27 por npx/pnpx, 6 remotos, 4 docker, 4 uvx, 1 uv e 7 binários ou caminhos locais (4 com caminho a preencher: azure-kubernetes-service, just-mcp, serena, box). 22 carregam credencial ou string de conexão (17 em `env`, 2 em `headers`, 3 em argumentos). Três pacotes deprecated: circleci, dynatrace, railway.

| Grupo | Componentes |
| --- | --- |
| Documentação e web | context7, firecrawl, jina-ai, markitdown, mermaid, agentplat-docs |
| Código e repositórios | github-official, serena, trace-mcp, jupyter, just-mcp, codacy, mcp-server-atlassian-bitbucket |
| CI, qualidade e gestão | circleci, launchdarkly, postman, trello, testsprite, jfrog, stripe, webflow, railway |
| Observabilidade e infraestrutura | grafana, elasticsearch, terraform, pulumi, azure-kubernetes-service, sentry, sentry-local, logfire, dynatrace, microsoft-clarity, nable (FinOps) |
| Banco | mongodb (com `--readOnly`) |
| Navegador e dispositivos | chrome-devtools, ios-simulator-mcp, android-mcp, figma-dev-mode |
| Outros | huggingface, devplan-mcp, 5dive-mcp, orcareplay, nika, leetcode, microsoft-dev-box, zai-mcp-server, box, firefly-mcp, imagesorcery |

Detalhes dos principais:

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| context7 | npx @latest | @upstash/context7-mcp (MIT, 4.1.1 de 14/09/2026) | env CONTEXT7_API_KEY | Documentação atualizada e por versão de bibliotecas no prompt; campeão do catálogo (14.545); a chave é opcional (limite maior e repositórios privados, segundo o README) |
| github-official | docker | ghcr.io/github/github-mcp-server (MIT, ativo, ~33 mil estrelas) | env GITHUB_PERSONAL_ACCESS_TOKEN | O README dele também documenta servidor remoto em https://api.githubcopilot.com/mcp/ |
| chrome-devtools | npx @latest | chrome-devtools-mcp (Google, Apache-2.0, 1.10.1) | nenhuma | Depuração, desempenho e automação do Chrome |
| grafana | binário `mcp-grafana` | grafana/mcp-grafana (ativo) | env token de conta de serviço (e usuário e senha opcionais) | Painéis e métricas |
| elasticsearch | docker | docker.elastic.co/mcp/elasticsearch | env ES_URL, ES_API_KEY | Consultas, mapeamentos, ES\|QL |
| terraform | docker | hashicorp/terraform-mcp-server:0.2.3 | nenhuma | Única tag fixa do catálogo |
| nable | uvx | nable (Apache-2.0) | nenhuma | FinOps: custos de AWS, Azure, GCP e Kubernetes; só propõe correções |
| sentry | remoto sem type | https://mcp.sentry.dev/mcp | nenhuma no arquivo | Sem `type`; sentry-local (npx, FSL-1.1-ALv2, env SENTRY_ACCESS_TOKEN) usa a mesma chave `"sentry"` |
| stripe | npx -y | @stripe/mcp (0.3.3) | env STRIPE_SECRET_KEY | `--tools=all` |
| webflow | npx (no `command`) | mcp-remote https://mcp.webflow.com/sse | nenhuma | `command` com espaços, sem `args`; sem `-y` |
| postman | remoto http | https://mcp.postman.com/{minimal \| mcp} | header `${input:postman-api-key}` | Placeholder na URL e sintaxe do VS Code |
| jfrog | remoto sem type | https://\<JFROG_PLATFORM_URL\>/mcp | nenhuma | 4 caracteres invisíveis U+200B dentro de \<JFROG_PLATFORM_URL\> |
| markitdown | docker | markitdown-mcp:latest | nenhuma | Imagem sem registro (build local, não verificado) |

### filesystem (1)

| Componente | Execução | Pacote | Credencial | Observação |
| --- | --- | --- | --- | --- |
| filesystem-access | npx -y | @modelcontextprotocol/server-filesystem (versão 2026.8.31, mantido) | nenhuma | Exige trocar `/path/to/allowed/files`; o Claude Code já lê e edita arquivos sozinho, então tende a ser redundante (avaliação minha); 9º em downloads (3.069) |

### integration (8)

5 npx, 1 uvx e 2 remotos. Três com chave em `env` (alpaca, github-integration, livetennisapi). Mistura utilidade (github, memory, n8n) com nichos (tênis, futebol, notícias financeiras) e risco (alpaca).

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| github-integration | npx -y | @modelcontextprotocol/server-github (publicado em 08/04/2025) | env GITHUB_PERSONAL_ACCESS_TOKEN | Deprecated e arquivado; prefira devtools/github-official |
| memory-integration | npx -y | @modelcontextprotocol/server-memory (mantido) | nenhuma | Grafo de conhecimento persistente; 2º mais baixado (7.852) |
| n8n-mcp | npx -y | n8n-mcp (MIT, 2.91.0) | env MCP_MODE=stdio | Cria e gerencia workflows do n8n |
| memex-mcp | npx -y | stifler-memex-mcp (MIT, 0.9.0) | nenhuma | Observa repositórios git e monta grafo temporal de módulos e decisões |
| alpaca-trading | uvx | alpaca-mcp-server (PyPI 2.3.2, MIT) | env ALPACA_API_KEY, ALPACA_SECRET_KEY | Executa ordens reais de ações, ETFs, cripto e opções |
| livetennisapi | npx -y | livetennisapi-mcp | env LIVETENNISAPI_KEY | Dados de tênis |
| alphai | remoto http | https://mcp.alphai.io/mcp | nenhuma no arquivo | Notícias financeiras analisadas (plano gratuito segundo a descrição) |
| footballbin-predictions | remoto sem type | endpoint execute-api da AWS | nenhuma | Endpoint público de terceiros, sem `type` |

### marketing (4)

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| curviate | npx -y | @curviate/mcp (1 versão, 24/07/2026) | env CURVIATE_API_KEY | LinkedIn; retirado no npm (hospedado agora) |
| facebook-ads-mcp-server | `python` local | server.py a clonar | arg `--fb-token` | Token na linha de comando |
| google-ads-mcp-server | python do venv | server.py a clonar | nenhuma no arquivo | OAuth 2.0 automático; caminhos a preencher |
| posthell | remoto http | https://www.posthell.com/api/mcp | header Bearer | Agendador de posts; publicar em 15 redes só com opt-in por chave, segundo a descrição |

Pouco relevante para backend.

### productivity (5)

4 npx e 1 uvx. Quatro pedem credencial (humanpen, monday, notion, google-workspace).

| Componente | Execução | Pacote | Credencial | Observação |
| --- | --- | --- | --- | --- |
| notion | npx -y | @notionhq/notion-mcp-server (MIT, 2.5.2) | env NOTION_TOKEN | |
| google-workspace | uvx | workspace-mcp (PyPI 2.0.1) | env GOOGLE_OAUTH_CLIENT_ID e _SECRET | Gmail, Calendar, Docs, Sheets, Drive |
| monday | npx, sem -y | @mondaydotcomorg/monday-api-mcp (MIT, 3.3.1) | arg `-t` (e `env` vazio) | Token aparece na linha de comando |
| local-mcp | npx @latest | local-mcp (UNLICENSED) | nenhuma | Mais de 160 apps nativos do macOS (Mail, Mensagens, Contatos); exige o app de bandeja local-mcp.com |
| humanpen | npx -y | humanpen-mcp (Apache-2.0) | env HUMANPEN_API_KEY | Reescreve textos sinalizados por detectores de IA (Turnitin/iThenticate, segundo a descrição); levanta questão de integridade acadêmica (avaliação minha) |

### research (1)

| Componente | Execução | Pacote | Credencial | Observação |
| --- | --- | --- | --- | --- |
| arxiv-mcp-server | uvx | arxiv-mcp-server (PyPI 0.8.0, 03/10/2026) | nenhuma | Busca, baixa e analisa artigos do arXiv, com armazenamento local |

### web (6)

2 npx e 4 remotos. Os 3 da Z.AI usam Bearer em `headers`; tinyfish usa OAuth 2.1 e exige assinatura; searxng só precisa da URL da sua instância.

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| web-fetch | npx -y | @modelcontextprotocol/server-fetch | nenhuma | Pacote inexistente no npm (404); 5º mais baixado (4.758). O oficial é `mcp-server-fetch` no PyPI |
| searxng | npx -y | mcp-searxng (MIT, 2.5.0) | env SEARXNG_URL | Metabusca sem rastreamento |
| web-reader | remoto http | https://api.z.ai/api/mcp/web_reader/mcp | header Bearer | Z.AI |
| web-search-prime | remoto http | https://api.z.ai/api/mcp/web_search_prime/mcp | header Bearer | Z.AI |
| zread | remoto http | https://api.z.ai/api/mcp/zread/mcp | header Bearer | Lê documentação e código de repositórios abertos |
| tinyfish | remoto http | https://agent.tinyfish.ai/mcp | OAuth 2.1 | Navegação e extração; assinatura ativa |

### web-data (11)

Scraping como serviço. 5 npx e 6 remotos (3 sem `type`: brightdata, datalikers, explorium; 3 com `http`: dimhour, pricewin, sicex). Oito têm credencial. Vários coletam dados de Instagram e TikTok, tema que pode esbarrar nos termos das plataformas.

| Componente | Execução | Pacote ou URL | Credencial | Observação |
| --- | --- | --- | --- | --- |
| apify | npx -y | @apify/actors-mcp-server (MIT, 0.17.1) | env APIFY_TOKEN | Scrapers prontos (actors) |
| brightdata | remoto sem type | https://mcp.brightdata.com/mcp?token=... | query | Token na URL: aparece em logs e histórico; 60+ ferramentas |
| browseract | npx -y | browseract-mcp | env BROWSERACT_API_KEY | Pacote inexistente no npm (404) |
| scavio | npx -y | @scavio/mcp-server (MIT, 0.15.0, criado em 06/2026) | env SCAVIO_API_KEY | 32 plataformas com uma chave |
| hikerapi | npx -y | hikerapi-mcp (MIT) | env HIKERAPI_KEY | Instagram |
| lamatok | npx -y | lamatok-mcp (MIT) | env LAMATOK_KEY | TikTok, inclui download de vídeo |
| datalikers | remoto sem type | https://mcp.datalikers.com/mcp/ | header Bearer | Instagram e TikTok |
| explorium | remoto sem type | https://mcp.explorium.ai/mcp | header `api_key` | Dados B2B |
| dimhour | remoto http | https://dimhour-mcp.jakeoborn.workers.dev/mcp | nenhuma | Restaurantes e bares |
| pricewin | remoto http | https://mcp.price.win/mcp | nenhuma | Preços de hotel e voo |
| sicex | remoto http | https://api.sicex.com/mcp | OAuth 2.1 | Comércio exterior; exige conta e assinatura |

## O que vale aproveitar

1. **Uma categoria "mcp" no kit, com um plugin de exemplo que empacota um servidor MCP** (esforço baixo). O marketplace do kit (9 entradas: mod, pacote, skill, agente, estilo, tema e hook) não tem exemplo de MCP, só uma linha sobre `.mcp.json` em `plugins/exemplos/README.md`. A documentação confirma `.mcp.json` na raiz (com o invólucro `mcpServers`) ou `mcpServers` no `plugin.json`, com `${CLAUDE_PLUGIN_ROOT}` e `userConfig` sensível para a chave. Cuidado: fixe a versão do pacote (por exemplo `@upstash/context7-mcp@4.1.1`) em vez de `@latest` e rode `claude plugin validate`. Use o formato da documentação: a skill `mcp-integration` do repositório mostra o `.mcp.json` de plugin sem o invólucro.
2. **Copiar a ideia do validador** (`scripts/validate_components.py` e `.github/workflows/component-validate.yml`) (esforço médio). Cada MCP ou hook vira um plugin descartável e passa pelo `claude plugin validate`; PRs bloqueiam em erro e uma rodada semanal reporta tudo. Serve ao CI do claude-code-kit. Cuidado: licença MIT (GitHub API); mantenha o aviso de autoria. O workflow instala o Claude Code por npm no CI.
3. **Context7 como primeiro MCP recomendado** (`devtools/context7`) (esforço baixo). Documentação atualizada de Spring, Java e outras bibliotecas direto no prompt; é o mais baixado (14.545). O README do pacote traz para o Claude Code `claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp` e a opção remota `--transport http ... https://mcp.context7.com/mcp`, que dispensa executar pacote local. Cuidado: o componente deixa `CONTEXT7_API_KEY` como placeholder em `env`; se usar chave, injete por `${CONTEXT7_API_KEY}` ou `userConfig` sensível. Sem pin de versão.
4. **GitHub oficial no lugar do GitHub antigo** (`devtools/github-official`) (esforço baixo). Servidor oficial (MIT, ativo, ~33 mil estrelas) e o README dele documenta o modo remoto em https://api.githubcopilot.com/mcp/, sem Docker. Cuidado: o modo local exige Docker e token pessoal; use escopo mínimo e nunca grave o token no `.mcp.json` versionado. `integration/github-integration` usa pacote deprecated.
5. **Servidores de banco para backend, sempre somente leitura** (esforço baixo). A documentação do Claude Code usa o DBHub como exemplo, com `--dsn` e um usuário de banco somente leitura: `claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "postgresql://readonly:...@host:5432/banco"`. Redis (oficial), supabase (`--read-only`) e neon complementam. Cuidado: o `dbhub.json` do catálogo passa a conexão por `DATABASE_DSN` em `env`, que não aparece no README do pacote nem na documentação (não verificado); prefira `--dsn`, sabendo que a senha fica na linha de comando. Nunca use produção. Evite `database/postgresql-integration` (deprecated) e `database/mongodb-official` sem `--readOnly`.
6. **Navegador: @playwright/mcp e chrome-devtools-mcp** (esforço baixo). Mantidos por Microsoft e Google (Apache-2.0, publicados em setembro de 2026), sem chave, úteis para testar uma tela, o Swagger UI ou medir desempenho de uma aplicação Spring. O catálogo traz 3 Playwright; o oficial evita pacote parado. Cuidado: o navegador acessa conteúdo externo (injeção de prompt); 3 entradas de navegador não têm `-y`.
7. **Infra e observabilidade** (esforço médio): grafana (mcp-grafana), elasticsearch, terraform, azure-kubernetes-service e nable (FinOps de AWS, Azure, GCP e Kubernetes, só propõe). O catálogo não traz MCP para operar AWS nem Kubernetes genérico (só AKS), nem MCP específico de Java ou Spring: é uma lacuna que um post ou plugin seu pode preencher. Cuidado: poder alto sobre infraestrutura real; use credenciais somente leitura. A tag do Terraform está em 0.2.3 e a última release é v1.3.0. AKS, just-mcp, serena e box pedem caminho local; leetcode e just-mcp não foram confirmados em npm nem PyPI.
8. **Guia de segurança de MCP para o blog e o README do kit** (esforço médio). Checklist objetivo: `npm view <pacote> deprecated`, licença e data da última publicação; fixar versão; `${VAR}` ou `userConfig` sensível em vez de segredo no arquivo; escopo user ou local para tokens; evitar `enableAllProjectMcpServers`; `type` explícito em remotos. O repositório davila7 tem o agente `mcp-security-auditor` (cli-tool/components/agents/mcp-dev-team/) como inspiração. Cuidado: é um prompt genérico de OAuth e conformidade, não verifica nada sozinho.
9. **Snippets de settings de MCP** (esforço baixo): `mcp-timeouts.json` e os três de aprovação de servidores, explicados no README do kit. Cuidado: o `settings.json` de plugin só aceita `agent` e `subagentStatusLine`, então servem como texto de instrução, não como peça instalável.

## Cuidados

- **Nomes conferidos hoje em registry.npmjs.org, pypi.org e GitHub API:** inexistentes no npm `@modelcontextprotocol/server-fetch` e `browseract-mcp`; deprecated ou retirados `@modelcontextprotocol/server-github`, `@modelcontextprotocol/server-postgres`, `@browserbasehq/mcp-server-browserbase`, `@circleci/mcp-server-circleci`, `@curviate/mcp`, `@dynatrace-oss/dynatrace-mcp-server` e `@railway/mcp-server`. Para github e postgres o README do repositório oficial os lista como arquivados; o motivo exato nos demais não foi verificado.
- **Nove entradas remotas sem `type`:** postgresql-documentation, figma-dev-mode, huggingface, jfrog, sentry, footballbin-predictions, brightdata, datalikers, explorium. Pela documentação isso é erro de configuração e o servidor é ignorado; copiar esses JSON sem acrescentar `type` não funciona. Não testado no Claude Code.
- **Entradas provavelmente quebradas ou que exigem edição:** webflow (`command` com espaços; não testado); postman (`{minimal | mcp}` na URL e `${input:...}`, sintaxe do VS Code, informação de conhecimento geral); jfrog (caracteres U+200B); azure-kubernetes-service, box, serena, just-mcp, google-ads e facebook-ads (caminhos locais); markitdown (imagem local sem registro, não verificado); jina-ai passa `JINA_API_KEY` por `env` a um `mcp-remote` que só recebe a URL (se a chave chega ao servidor, não foi verificado).
- **Segredos:** nenhum componente tem credencial real, só placeholder, e nenhum usa `${VAR}`. Segredo em argumento fica visível na lista de processos (conhecimento geral, não verificado nas fontes) e o token na URL do brightdata pode vazar em logs. Ao editar o `.mcp.json` do projeto você pode commitar a chave por acidente.
- **Cadeia de suprimento:** o instalador baixa sempre da branch main, sem pin, hash ou assinatura, e cada início de servidor via npx `@latest` executa código novo do npm. Só 1 dos 4 docker tem tag fixa. Pacotes criados em 2026 e com poucas versões (curviate tem 1) merecem desconfiança extra. Nome livre no npm (browseract-mcp) pode ser registrado por qualquer pessoa (inferência).
- **Cobertura de segurança:** `security-audit.js` só lê `.md` e o workflow `component-security-validation.yml` só dispara em `.md`; os JSON de MCP ficam de fora. O `component-validate.yml` valida MCP, mas só em PRs (arquivos alterados) e semanalmente sem bloquear.
- **Instalador:** sem prefixo de categoria dá 404 e a mensagem lista nomes sem categoria; a mescla sobrescreve em silêncio servidor de mesmo nome (sentry e sentry-local); telemetria para www.aitmpl.com ligada por padrão (desliga com `CCT_NO_TRACKING=true` ou `CCT_NO_ANALYTICS=true`; `CI=true` também desliga).
- **Números do site:** downloads são "números informados pelo site em 04/10/2026" (context7 14.545, memory 7.852, playwright-mcp-server 6.175, postgresql-integration 4.858, web-fetch 4.758; as páginas de context7 e web-fetch conferem com o índice do repositório). O índice do dashboard não registra autor, repositório, versão nem licença em nenhuma das 105 entradas.
- **Limites da pesquisa:** páginas da documentação e do site foram lidas por WebFetch, que resume com modelo pequeno (não é texto exato); a página aitmpl.com/mcps carrega por JavaScript e veio sem lista; docs.aitmpl.com/docs/components/mcps retorna 404, então a documentação do projeto não foi lida. A documentação do Claude Code consultada não traz nota sobre `cmd /c` no Windows (o README do repositório oficial de servidores mostra essa forma). Não li o post do blog nem os demais tipos de componente, cobertos por outras frentes.
- **Riscos de uso dos próprios servidores:** stripe (`--tools=all`), alpaca-trading (ordens reais), google-workspace e local-mcp (e-mail, mensagens, arquivos), grafana e terraform (infraestrutura), humanpen (integridade acadêmica) e os coletores de Instagram e TikTok (termos das plataformas). Servidores que buscam conteúdo externo expõem a injeção de prompt.
- **Texto lido que tentou dar ordens:** nenhum. Frases imperativas ("Add use context7 to any prompt" em context7.json, "Requires the nika binary" em nika.json, "Please uninstall" no aviso do npm de flatten-mcp) são instruções de uso ou avisos de pacote e não foram seguidas.
- **Não verificado:** existência e origem dos binários mcp-server-leetcode (404 no npm e no PyPI), just-mcp (404 no PyPI), nika (brew) e aks-mcp; se neon via mcp-remote autentica por OAuth; o comportamento de npx sem `-y` em processo não interativo; e se um `.mcp.json` de plugin sem o invólucro `mcpServers` (formato dos exemplos da skill mcp-integration) é aceito, pois a documentação mostra o invólucro.

## Fontes

- `/private/tmp/claude-1068948898/-Users-cesar-schutz-Downloads-claude-code-kit/5f901f11-25f6-40d4-85ad-3af709ec508c/scratchpad/tree.json` (105 arquivos em 13 pastas de `cli-tool/components/mcps`; contagem refeita)
- `cli-tool/components/mcps/**/*.json` (os 105 arquivos, relidos inteiros via gh api)
- `cli-tool/src/index.js` (`installIndividualMCP`, linhas 621-704; instalador em lote e flags `--mcp` e `--mcp-stats`), `cli-tool/src/tracking-service.js`, `cli-tool/src/security-audit.js`, `cli-tool/src/mcp-stats.js`
- `dashboard/public/components/mcps.json` (índice do catálogo com downloads), `dashboard/public/component-content/mcps/devtools/flatten-mcp.json`
- `cli-tool/components/settings/mcp/` (4 arquivos), `cli-tool/components/skills/development/mcp-integration/` (SKILL.md e `examples/*.json`, lidos via raw.githubusercontent.com), `cli-tool/components/agents/mcp-dev-team/mcp-security-auditor.md`
- `.github/workflows/component-validate.yml`, `.github/workflows/component-security-validation.yml`, `scripts/validate_components.py`, `.mcp.json` e `cli-tool/templates/common/.mcp.json` (repositório davila7/claude-code-templates)
- https://code.claude.com/docs/en/mcp e https://code.claude.com/docs/en/plugins-reference (WebFetch)
- https://www.aitmpl.com/mcps, https://www.aitmpl.com/component/mcp/context7, https://www.aitmpl.com/component/mcp/web-fetch (WebFetch); https://docs.aitmpl.com/docs/components/mcps (404)
- https://registry.npmjs.org/<pacote> (53 pacotes npx, metadados e README de @upstash/context7-mcp, @bytebase/dbhub, mcp-code-graph) e https://pypi.org/pypi/<pacote>/json (pacotes uvx e pipx), consultados em 04/10/2026
- gh api: modelcontextprotocol/servers (README, seção Archived, `src/fetch`), github/github-mcp-server, hashicorp/terraform-mcp-server (releases), grafana/mcp-grafana, davila7/claude-code-templates (licença MIT)
- raw.githubusercontent.com/davila7/claude-code-templates/main/cli-tool/components/mcps/web-fetch.json (404) e .../mcps/web/web-fetch.json (200)
- Kit local, para comparação: `/Users/cesar.schutz/Downloads/claude-code-kit/.claude-plugin/marketplace.json`, `README.md`, `plugins/exemplos/README.md`
- Arquivos de trabalho da conferência: `.../scratchpad/skep/` (cópias dos 105 JSON, `npm53.json`, `mcps_index.json`)

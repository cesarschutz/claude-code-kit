# Frente 15: proposta do post dos mods em 3 partes

Data: 04/10/2026. Claude Code na máquina: 2.1.289. Só o plano: nenhum arquivo do blog, da worktree `post-dns` ou do `claude-code-kit` foi editado, e o post da parte 3 não foi escrito.

Lido por inteiro nesta frente: os dois posts, `.claude/rules/posts.md`, a skill `post`, o `CLAUDE.md` e `docs/decisoes.md` (D63, D71, D78, D79, D80, D81) da worktree, `src/livros/livros.json`, `src/data/decks.json`, os roteiros `scripts/slides/posts/claude-code-*.py`, `scripts/escrita.mjs`, a geometria da figura da parte 1 e os relatórios 13 e 14 desta pasta. As páginas oficiais citadas como "conferido hoje" foram baixadas em Markdown bruto para o rascunho (`scratchpad/cet15`) e lidas por trecho. O que veio dos relatórios 00 a 12 (inclusive tudo sobre o aitmpl) é tomado deles, com a ressalva de cada um.

## 1. Resumo

- Os dois posts cobrem bem o que prometem. O que falta é o resto do mapa do Claude Code: o que um plugin **não** leva (`CLAUDE.md`, permissões, linha de status, `env`), quem decide o que roda (configurações e permissões), a automação sem supervisão (`/loop`, `/goal`, rotinas) e o modelo de confiança de tudo o que executa. É material novo de ~2.400 palavras: não cabe na parte 1 (folga de ~400 até 2.500) nem na parte 2 (já no teto).
- Existem também 17 trechos dos dois posts que a documentação atual contradiz ou deixa incompletos (3 de peso alto). Corrigi-los vale com 2, 3 ou 1 parte: é independente da decisão de dividir.
- Recomendada: **parte 3 nova, no fim**, detalhada, em slug novo. Nenhuma URL, âncora ou data das partes 1 e 2 muda; elas ganham só "(parte N de 3)", avisos, TL;DR e correções pontuais.
- Honestidade sobre as 3 partes: o corte se sustenta pela D71 (dois assuntos que se sustentam sozinhos), mas a parte 3 é um assunto **irmão** do mod, não a continuação do raciocínio. Se Cesar preferir, o mesmo texto vale como post separado, sem "(parte 3 de 3)".
- Pela D71, três partes pedem conversa (pode ser caso de série). A série trocaria `category` por `series`, exigiria capa e emblema próprios e tiraria os posts do livro IA: não é recomendada agora.

## 2. Diagnóstico

### 2.1 O que as duas partes cobrem

- **Parte 1** (`claude-code-do-claude-md-ao-mod`, ~2.080 palavras de prosa, ~2.250 com o TL;DR): a escada de 10 peças com data e versão (as nove datas de versão batem com o npm, conferidas em 04/10/2026), cada peça com "o que é, quando usar e o que não alcança" (seis com exemplo do kit), o que é um mod, o aviso de risco e as confusões comuns.
- **Parte 2** (`claude-code-csr-cockpit`, ~3.045 de prosa, ~3.205 com o TL;DR): o cockpit aba por aba, instalação pelo marketplace, versão e atualização, comandos, três camadas de teste e limites. 46% é a visita às abas; a parte "como usar mods e plugins em geral" tem ~1.200 palavras. Já passa do teto de ~3.000 por decisão do Cesar (D79).
- **Preservar** (relatório 14, seção 8): a escada com a mesma pergunta em cada degrau, o vocabulário definido uma vez, a regra do `version` com a figura em seis passos, os testes datados, os limites declarados, a voz sem primeira pessoa e as partes que se leem sozinhas.

### 2.2 O que falta de verdade

Evidência: relatório 14 (cobertura contra o mapa oficial de 130 peças e contra o catálogo aitmpl de 11 tipos). Contra o mapa: 12 peças com tratamento próprio, 17 parciais, 101 ausentes. Contra o aitmpl: 6 tipos presentes (agents, commands, hooks, MCPs, skills, mods), 3 parciais (settings, sandbox, plugins), 2 ausentes (loops e templates de projeto). Boa parte da ausência é esperada (administração, nuvem, provedores). Pesam estas lacunas, em ordem:

| # | Lacuna | Peso | Para onde vai |
|---|---|---|---|
| 1 | Fronteira plugin × configuração do usuário | alto | parte 3 (seção própria) e uma frase na parte 1 |
| 2 | Configurações e permissões (arquivos, precedência, allow/ask/deny, pedir × garantir) | alto | parte 3 |
| 3 | Confiança em tudo o que executa, não só em mods | alto | aviso da parte 1 (ampliar) e parte 3 |
| 4 | Automação sem supervisão (`/loop`, `/goal`, rotinas, `claude -p`) | alto | parte 3 |
| 5 | O que o Claude Code já mostra sem mod (painel de subagentes, `/diff`, `/context`) | alto | parte 2 e correção na parte 1 |
| 6 | Memória e instruções além do `CLAUDE.md`; custo de contexto por peça | médio | parte 3 (seção curta com tabela) |
| 7 | Delegação além do subagente (workflows, equipes, worktrees) | médio | `:::visto` na parte 3, sem seção |
| 8 | Mods embutidos, "peça a Claude que escreva o mod", como desligar | médio | parte 1 (uma ou duas frases) |

Conferido hoje nas páginas oficiais (não só tomado do relatório): o `settings.json` de um plugin só aplica `agent` e `subagentStatusLine` e descarta o resto; um `CLAUDE.md` na raiz do plugin não é carregado e o `claude plugin validate` avisa (`plugins/components`); a ordem deny, ask, allow e o fato de que um `deny` de qualquer escopo vence um `allow`, mais a relação entre hook, regra e mod (`permissions`); o sandbox cobre só comandos de shell, e arquivos, MCP, hooks, monitores, LSP e o comando da linha de status rodam fora dele (`sandboxing`); `/loop` expira em 7 dias e aceita até 50 tarefas, `/goal` aceita 4.000 caracteres e o avaliador só vê a conversa, rotinas estão em research preview e rodam sem pedir permissão a cada passo (`scheduled-tasks`, `goal`, `routines`); o painel de subagentes abaixo do prompt, com árvore para os aninhados (`sub-agents`); a tabela de custo de contexto por peça (`features-overview`); a precedência das configurações (`settings`).

### 2.3 O que NÃO deve entrar (para não inchar)

- Administração e organização (configurações gerenciadas além de uma linha, `allowManagedModsOnly`, MDM), nuvem, Desktop, mobile, Remote Control, provedores e gateways.
- Os 119 comandos de barra, os 46 nomes de ferramenta, atalhos, Vim, voz, spinner, tela cheia, tema além do que a parte 1 já diz.
- LSP, Chrome, computer use, Artifacts, Slack, GitHub Actions, GitLab, SDK: no máximo links num `:::visto`.
- Workflows, equipes de agentes, agent view e `/batch` com seção própria (estão em research preview ou experimental e mudam toda semana).
- O site aitmpl por dentro (Stack Builder, trending, jobs, contadores sintéticos, Supabase, Neon, Cloudflare, CLI em Rust, Studio) e o tour dos 11 tipos do catálogo: é assunto de outro post. O aitmpl entra só como **exemplo** na seção de confiança.
- O roadmap do kit (`guardas`, `backend`, CI): pautas próprias, listadas na seção 7.
- O tour das abas do cockpit de novo (a D79 manteve o tour na parte 2 e o README tem a versão completa).

### 2.4 O que se tira do aitmpl para o blog

Não é o catálogo, é a lente. Do estudo (relatórios 01 a 12) saem quatro ideias que se sustentam por fonte: (1) o motivo de o aitmpl precisar de uma CLI que mescla JSON no settings é justamente a fronteira plugin × configuração (72 itens de settings, o tipo que mais baixa, e um plugin não entrega nenhum deles); (2) um tipo "loops" que é só texto: o recurso real é `/loop`, `/goal` e rotinas, com limites; (3) popularidade não indica qualidade (quatro dos cinco hooks mais baixados dependem de variáveis que a documentação de hooks não cita); (4) o checklist de confiança: instalação da branch `main` sem versão, telemetria ligada por padrão, MCP com pacote inexistente ou obsoleto, scripts executáveis. As ideias 1 e 4 sustentam a parte 3; as 2 e 3 viram um parágrafo cada.

## 3. Opções de arranjo

| | A. Parte 3 nova no fim | B. Parte 3 nova no fim, em formato resumo | C. Parte nova no meio (ou dividir a parte 1) | D. Dividir a parte 2 |
|---|---|---|---|---|
| Traz as lacunas | sim, com profundidade | sim, só a largura | sim | não |
| URLs e âncoras | intactas | intactas | quebra a lógica de `#na-parte-2-um-mod-pronto` e move âncoras | 9 âncoras do tour saem da parte 2 |
| Esforço de edição | baixo nos dois posts | baixo | alto | médio |
| Leitura em sequência | conceito, prática, mapa | idem, mapa em uma imagem | conceito, mapa, prática (melhor) | conceito, prática, prática |
| Tamanho | ~2.400 na parte 3; a 2 não cresce | ~900 | a 2 vira "3" | a 2 cai para ~1.600 |

### A. Parte 3 nova, detalhada, no fim (recomendada)

Slug novo; "o que um plugin não leva e quem decide o que roda".

- Vantagens:
  - Nenhuma URL, âncora ou data das partes 1 e 2 muda; elas só trocam "de 2" por "de 3" e recebem correções.
  - Espaço próprio de ~2.400 palavras sem estourar o teto; a parte 2 não precisa crescer.
  - A parte 3 se sustenta sozinha e tem termo de busca próprio ("o que um plugin não leva", "permissões", "configurações do Claude Code").
  - Nasce como a mais nova: a ordem por `published` sai certa sem o truque da hora (D71).
  - Reversível: se a parte 3 não ficar pronta, as partes 1 e 2 continuam como estão.
- Desvantagens:
  - O mapa vem depois da prática, e o assunto é mais amplo que "mod": a ligação com as partes 1 e 2 é mais frouxa do que a delas entre si.
  - Três partes pedem a conversa da D71 (série?).
  - A parte 1 ainda recebe ~500 palavras de correções e fica perto de 2.550 (2.350 só com os itens de peso alto).

### B. Parte 3 nova no fim, em formato resumo (700 a 1.200 palavras, com infográfico)

Um infográfico do mapa (o que o Claude Code sabe, alcança, roda sem decidir, delega, e o que um plugin leva).

- Vantagens: mais barato de escrever; cobre a largura; imagem que se compartilha.
- Desvantagens:
  - Raso para o que pesa mais (permissões e confiança), que pedem a distinção pedir × garantir e o caminho da chamada.
  - O infográfico é o item visual mais caro (3 a 6 quadros, D63).
  - Mistura de formatos na sequência.
  - O aviso sobre componentes de terceiros fica sem espaço.

### C. Parte nova no meio, ou dividir a parte 1 em duas

O cockpit passaria a "parte 3 de 3".

- Vantagens: melhor ordem de leitura (peças, mapa do resto, mod na prática).
- Desvantagens:
  - O título da seção "Na parte 2, um mod pronto" da parte 1 passaria a mentir, e título de seção publicado não muda (D7).
  - A URL já publicada como "parte 2" vira "parte 3".
  - A parte nova tem de caber entre as datas `2026-10-02` e `2026-10-02T12:00:00Z` (data retroativa) ou a parte do cockpit muda de `published`.
  - Dividir a parte 1 tira as âncoras de "O que é um mod" e "Skill, agente ou plugin".
  - A recapitulação da parte 2 e as apresentações precisam ser refeitas.

### D. Dividir a parte 2 (o tour do cockpit vira a parte 3)

- Vantagens: resolve o tamanho (3.045 passa para ~1.600 e ~1.500); três partes de bom tamanho.
- Desvantagens:
  - Não traz nenhuma lacuna dos recursos do Claude Code, que é o pedido.
  - Contradiz a D79, em que Cesar decidiu manter o tour dentro da parte 2.
  - O título da parte nova teria de girar em torno do nome do projeto (`csr-cockpit`), que a D71 proíbe como assunto.
  - Nove âncoras de seções de dois dias atrás deixariam de existir na parte 2.

### Recomendada: A

Preserva tudo o que está publicado, dá espaço de verdade às lacunas de peso e reduz a edição dos posts existentes a correções pontuais. A única desvantagem real é a ordem de leitura, que se resolve com o aviso de cada parte e um parágrafo em "Na parte 3, o que fica fora do plugin".

## 4. A opção recomendada, parte por parte

### Parte 1: `claude-code-do-claude-md-ao-mod` (existente)

- **Assunto em uma frase:** o que é um mod do Claude Code e as peças de extensão que vieram antes dele.
- **Título:** "Mods do Claude Code — o que são e as peças que vieram antes (parte 1 de 3)" (74 caracteres; muda só o sufixo). Alternativas (não recomendadas, só se Cesar quiser mexer): "Mods do Claude Code — as peças que vieram antes e o que é um mod (parte 1 de 3)"; "Mods do Claude Code — de onde vêm e o que fazem (parte 1 de 3)".
- **Description:** fica a de hoje (155 caracteres).
- **`updated`:** novo, na data da publicação.

| Seção (`##`) | O que diz | Fontes | Situação |
|---|---|---|---|
| (abertura e NOTA) | o assunto, o que a parte cobre; a NOTA vira "Parte 1 de 3" e aponta as partes 2 e 3 | texto atual; `plugins/mods/overview` | existente, ajustada |
| A linha do tempo | a escada de 10 peças com data e versão; a nota sobre `CLAUDE.md` e MCP ganha o fato de que o changelog tem linhas de MCP desde a 0.2.31 | CHANGELOG, npm | existente; uma nota ajustada |
| Cada peça e o que ela não alcança | os dez parágrafos; ajustes em Comando, Subagente, Hook, Linha de status, Plugin, MCP e Skill; o quadro final reescrito | `skills`, `sub-agents`, `hooks-guide`, `statusline`, `plugins/components` | existente; 7 parágrafos e o quadro ajustados |
| O que é um mod | o `hooks.json` com `modules`; "a primeira" passa a valer "entre as peças da tabela" e o `/diff` é um mod embutido; onde os mods rodam ganha VS Code, `claude -p`, WSL; o aviso de risco é ampliado | `plugins/mods/overview` (Where mods run, Mods built into Claude Code, What a mod can reach) | existente; 4 trechos ajustados |
| Skill, agente ou plugin: as confusões mais comuns | os cinco pontos mais um sexto ("o plugin não leva tudo"); o ponto da skill solta ganha "skills também moram soltas" | `skills`, `plugins/components` | existente; 1 ponto novo e 1 ajustado |
| Na parte 2, um mod pronto | o texto de hoje (o título não muda, D7) | — | existente, igual |
| Na parte 3, o que fica fora do plugin | duas ou três frases: o que um plugin não leva, quem decide o que roda, o aviso sobre componentes de terceiros | parte 3 | **nova** (curta) |
| Fontes | as de hoje mais `plugins/components`, `sub-agents` e `plugins/mods/overview#where-mods-run` | — | existente, ampliada |

- **TL;DR (rascunho)**, cada ponto entre aspas no frontmatter:
  1. (igual) "**Mod** é um plugin do Claude Code com código que roda dentro do programa: reage aos eventos da sessão, guarda estado, registra comandos e desenha na interface. É oficial desde a versão 2.1.287, de 01/10/2026."
  2. "As peças anteriores entregam texto ou ferramentas ao modelo (`CLAUDE.md`, MCP, comandos, subagentes, estilos, skills), rodam comandos por fora (hooks, linha de status), embalam (plugins) ou trocam cores (temas). O hook pode até bloquear uma chamada, mas nenhuma põe um painel na interface."
  3. (igual) "Skill, agente e plugin não são alternativas: ..."
  4. "Um mod roda com as suas permissões, sem isolamento, e vê todo prompt e toda chamada. Antes de instalar, `claude plugin validate` lista o que ele escuta e o que ele chama, sem executar nada."
  5. "A [parte 2](/posts/claude-code-csr-cockpit/) mostra um mod pronto, o csr-cockpit. A [parte 3](/posts/claude-code-configuracoes-e-permissoes/) mostra o que um plugin não leva e quem decide o que roda."
- **Palavras estimadas:** ~2.550 de prosa com todas as correções (~2.350 com só os itens de peso alto), mais ~170 do TL;DR.
- **Recursos visuais:** a capa e a figura "por dentro e por fora" ficam. Pela leitura das coordenadas do SVG, o cartão do `CLAUDE.md` (y 120 a 190) fica acima da aba "Plugin" (y 218), isto é, fora da pasta do plugin: a figura já mostra a fronteira, e o texto pode apontar para ela (conferir no render antes de afirmar). Opcionais: a tabela oficial mod × hook de settings × skill × MCP (+~120 palavras) e um print do `/plugin` na aba Installed com os mods "Built-in" (só Cesar tira).

### Parte 2: `claude-code-csr-cockpit` (existente)

- **Assunto em uma frase:** um mod do Claude Code de ponta a ponta: o que o csr-cockpit mostra, como instalar pelo marketplace, testar e os limites.
- **Título:** "Um mod do Claude Code na prática — instalação, testes e limites (parte 2 de 3)" (78 caracteres). Alternativas (não recomendadas): "Um mod do Claude Code na prática — instalar, testar e conhecer os limites (parte 2 de 3)"; "Mods do Claude Code na prática — instalação, testes e limites (parte 2 de 3)".
- **Description:** fica a de hoje (157 caracteres). **`updated`:** nova data.

| Seção (`##`) | O que diz | Fontes | Situação |
|---|---|---|---|
| (abertura, NOTA, glossário) | a NOTA vira "Parte 2 de 3", mantém a recapitulação e aponta as partes 1 e 3; o parágrafo "Sem um mod, o `/usage` mostra…" vira "O que o Claude Code já mostra sem mod" | `sub-agents`, `costs`, `context-window` | existente; 2 trechos ajustados |
| O que o cockpit mostra | a tabela das seis abas ganha a coluna "Sem o mod" (painel de subagentes, `/diff` embutido, `/context`, `/usage`, `/plugin`, `/hooks`, `/mcp`, `/agents`); as `###` das abas ficam como estão | `sub-agents`, `mods/overview`, `commands` | existente; 1 coluna nova |
| Como instalar: o marketplace | a frase de `source` vira "uma das formas: caminho relativo, `github`, `git-subdir`, `npm`…" | `plugins/marketplace-reference` | existente; 1 frase ajustada |
| Os comandos de plugin | igual | — | existente |
| Como se testa um mod | igual | — | existente |
| Os limites do csr-cockpit | igual (mantém o link `#os-limites-do-csr-cockpit`) | — | existente |
| O repositório claude-code-kit | uma frase nova apontando a parte 3 | — | existente; 1 frase |
| Fontes | mais `sub-agents` e `marketplace-reference` (já está) | — | existente |

- **TL;DR (rascunho):** só o último ponto muda: "Mods pedem o Claude Code 2.1.287 ou mais novo; o aplicativo de desktop, que traz cópia própria, já roda o cockpit na versão 2.19675.0. O que é um mod está na [parte 1](/posts/claude-code-do-claude-md-ao-mod/); o que um plugin não leva, na [parte 3](/posts/claude-code-configuracoes-e-permissoes/)."
- **Palavras estimadas:** ~3.200 de prosa (3.045 mais ~150). Passa do teto de ~3.000, como já passava (D79). Para compensar, cortar ~150 palavras: candidatos são os pontos numerados repetidos nas `###` das abas e a segunda tabela de comandos. Decisão de Cesar.
- **Recursos visuais:** nenhum novo. Telas, figura em passos e capa ficam. A capa tem números velhos (US\$ 0,04 e US\$ 0,02, pendência da D79): dá para refazer junto com a da parte 3.

### Parte 3: `claude-code-configuracoes-e-permissoes` (nova)

- **Assunto em uma frase:** o que um plugin do Claude Code não leva (`CLAUDE.md`, permissões, linha de status, variáveis de ambiente), onde cada configuração vive e quem decide o que o Claude Code executa.
- **Título (recomendado):** "Configurações e permissões do Claude Code — o que um plugin não leva (parte 3 de 3)" (83 caracteres; 68 sem o sufixo; assunto de 41).
- **Alternativas:** "Configurações do Claude Code — o que um plugin não leva (parte 3 de 3)" (70); "Permissões do Claude Code — pedir, garantir e o que um plugin não leva (parte 3 de 3)" (85, no teto).
- **Slug:** `claude-code-configuracoes-e-permissoes` (alternativa: `claude-code-o-que-o-plugin-nao-leva`).
- **Description (~150 caracteres, essencial nos primeiros 160):** "Onde ficam as configurações do Claude Code, quem vence quando duas divergem e como garantir o que roda: `CLAUDE.md`, permissões, linha de status e `/loop`."
- **Frontmatter:** `category: IA` (a coleção serve, D78: o livro IA já cobre "programar com IA (Claude Code…)"; Segurança trata de identidade, segredos e conformidade, não do Claude Code), `tags: [Claude Code, Plugins]` (ícones já existem; nenhuma tag nova), `formato: detalhado`, `published` na data da publicação (sem o truque da hora: é a mais nova).
- **Abertura:** o primeiro parágrafo diz o assunto e por que importa (um plugin é a embalagem de quase tudo, mas as peças que mais se instalam de catálogos, como permissões e linha de status, ficam de fora, e é aí que se separa pedir de garantir); o segundo diz o que cobre, para quem e o que não é (não é guia de administração; não repete as partes 1 e 2). A NOTA "Parte 3 de 3" traz a recapitulação para quem chega direto: o que é um mod, o que a parte 1 explicou, o que a parte 2 mostrou.

| Seção (`##`) | O que diz | Fontes | Situação |
|---|---|---|---|
| O que um plugin leva e o que fica de fora | a tabela entra, entra com limite, não entra (agentes de plugin ignoram `permissionMode`, `hooks` e `mcpServers`; o `settings.json` do plugin só aplica `agent` e `subagentStatusLine`; `CLAUDE.md` na raiz não é carregado e o `validate` avisa); o que fazer com o que não entra (skill para instrução, hook ou mod para garantia, README para o resto). Figura: a pasta do plugin e o que fica fora | `plugins/components` (Default settings, Agents, CLAUDE.md), `plugins/manifest-reference` | nova |
| Onde ficam as configurações e qual vence | os escopos (usuário, projeto, local, gerenciado), a precedência (gerenciado, linha de comando, local, projeto, usuário) e um trecho de `settings.json` com `statusLine` e `permissions`; o que é `/config` | `settings`, `settings-reference`, `statusline` | nova |
| Permissões: o caminho de uma chamada de ferramenta | `deny`, `ask`, `allow` (a primeira que casa decide); regra é aplicada pelo Claude Code, `CLAUDE.md` só orienta; o hook `PreToolUse` roda antes do prompt, e saída 2 bloqueia antes das regras; um `deny` vence o `allow` de um hook; um mod com `tool.check` responde depois e pode substituir a resposta; o sandbox cobre só o shell. Figura em passos | `permissions`, `hooks-guide`, `sandboxing`, `plugins/mods/overview` | nova |
| Instruções e memória: o que o modelo lê em toda sessão | os quatro escopos do `CLAUDE.md`, o limite de ~200 linhas, `.claude/rules/` com `paths`, imports `@`, memória automática (200 linhas ou 25KB), `AGENTS.md`, `/init`; a tabela de custo de contexto por peça; os exemplos do kit (`professor`, `responder-em-portugues`) como pedidos, não garantias | `memory`, `features-overview` (Context cost by feature) | nova |
| Automação sem supervisão: /loop, /goal e rotinas | `/loop` só dispara com a sessão aberta, expira em 7 dias, até 50 tarefas; `/goal` é um hook `Stop` de sessão, condição de até 4.000 caracteres, avaliador só vê a conversa; rotinas na nuvem (research preview) rodam sem pedir permissão a cada passo, só em claude.ai, e usam os conectores incluídos; `claude -p`. O tipo "loops" do aitmpl é só texto. Nada disso vai em plugin. `:::visto` com workflows, equipes de agentes e worktrees (experimental) | `scheduled-tasks`, `goal`, `routines`, `headless`, `agent-teams`, `workflows` | nova |
| Componentes de terceiros: o que ler antes de instalar | o plugin "pode executar código arbitrário com os privilégios do seu usuário"; o que revisar (`hooks/hooks.json`, `.mcp.json`, `bin/`, frontmatter de skill com `!comando` e `allowed-tools`, versão fixada ou não); o caso do catálogo claude-code-templates (aitmpl.com), com 3 ou 4 fatos datados e permalink: instala da branch `main` sem versão nem hash, telemetria ligada por padrão com opt-out, MCP com pacote inexistente ou obsoleto (verificável por `npm view <pacote> deprecated`), licenças mistas; `claude plugin validate` lista o que um mod faz; `[!ATENCAO]` | `plugins/security`, `sandboxing`, relatórios 01, 02, 05, 07, 08 (aitmpl), permalinks por SHA | nova |
| Fontes | só fontes oficiais e os permalinks do aitmpl | — | nova |

- **TL;DR (rascunho):**
  1. "Um plugin do Claude Code leva skills, agentes, hooks, MCP, estilos, temas e mods, mas não o `CLAUDE.md`, as permissões, a linha de status nem o `env`: o `settings.json` do plugin só aplica `agent` e `subagentStatusLine`."
  2. "As configurações vivem em escopos (usuário, projeto, local, gerenciado), e vale a chave do nível mais alto. Uma regra `deny`, de qualquer escopo, vence um `allow`."
  3. "`CLAUDE.md`, skills e estilos de saída orientam o que o Claude tenta; quem garante é uma regra de permissão, um hook que sai com código 2 ou o sandbox, que cobre só os comandos de shell."
  4. "`/loop`, `/goal` e rotinas rodam sem supervisão e têm limites: o `/loop` só dispara com a sessão aberta e expira em 7 dias; a rotina na nuvem não pede permissão a cada passo."
  5. "Hooks, MCP, executáveis e mods de terceiros rodam com as suas permissões, fora do sandbox: leia o código antes de instalar. A [parte 1](/posts/claude-code-do-claude-md-ao-mod/) explica o que é um mod; a [parte 2](/posts/claude-code-csr-cockpit/) mostra um pronto."
- **Palavras estimadas:** ~2.400 de prosa (abertura e NOTA 220; plugin 340; configurações 300; permissões 380; instruções 330; automação 340; terceiros 480), mais ~165 do TL;DR. Se passar de ~2.700, cortar primeiro a seção de instruções e memória.
- **Recursos visuais:**
  - **Capa** da mesma família das outras (o mesmo objeto, a janela do Claude Code, visto de outro jeito): a pasta do plugin ao lado da janela, com peças dentro e três peças tracejadas fora (`CLAUDE.md`, um cadeado de permissões, a linha de status); capa viva `mexe-desliza`, em que uma peça tracejada desliza para a pasta e volta, na cor do livro IA.
  - **Figura** "o que viaja no plugin e o que fica fora", com os tons da parte 1 (plugin roxo, hook verde, MCP âmbar, texto para o modelo azul, mod petróleo).
  - **Figura em passos** (D67) "o caminho de uma chamada de ferramenta" (hook, regras, prompt, mod, execução com o sandbox no Bash). Só depois de conferir cada passo em `permissions` e `hooks`; o vermelho só no ponto de recusa (`DESIGN.md`, regra dos tons).
  - **Tabelas**: o que entra e o que não entra no plugin; custo de contexto por peça.
  - **Bloco de código** com a saída real do `claude plugin validate` sobre um plugin com `CLAUDE.md` na raiz, rodado na hora de escrever e datado.
  - **Sem** print, lousa, animação com play nem logo (nenhum desses assuntos pede; não há logo registrado para GitHub ou aitmpl, D64).

## 5. Edições exatas nos dois posts existentes

Sem tocar em nenhum título de seção publicado (D7). As correções de texto vêm como lista numerada para aprovação (skill `post`, modo Adaptar); só entram as aprovadas.

### 5.1 `claude-code-do-claude-md-ao-mod.mdx`

1. **Frontmatter:** `title` termina em "(parte 1 de 3)"; novo `updated`; o resto igual.
2. **TL;DR:** reescrever os pontos 2, 4 e 5 (rascunho na seção 4).
3. **Aviso:** `> [!NOTA] Parte 1 de 2` vira `Parte 1 de 3`; o texto cita as partes 2 e 3 com links.
4. **Abertura, última frase** ("Até ali, tudo o que se instalava…"): reformular para o que a documentação sustenta, sem afirmar que workflows e monitores rodam fora do processo (não verificado).
5. **Nota sob a tabela** (CLAUDE.md e MCP): o changelog tem linhas de MCP desde a 0.2.31; falta só a linha de estreia.
6. **Comando:** trocar "Poupa a digitação, e só: o que chega ao modelo é o mesmo texto" por uma frase que diga que o arquivo aceita os campos de uma skill, roda `!comando` antes de o texto chegar ao modelo e pode ser acionado pelo Claude.
7. **Subagente:** trocar "Na tela nada muda: o que volta é texto" por "o Claude Code mostra os subagentes num painel abaixo do prompt; o que volta à conversa é o resumo"; "ferramentas limitadas" vira "por padrão herda as ferramentas; dá para limitar".
8. **Hook:** "a que vê os eventos passarem" deixa de sugerir que só o mod altera eventos: o hook de configuração pode bloquear uma chamada (saída 2), e há cinco tipos de handler.
9. **Linha de status:** "uma linha só, sem clique" vira "pode ter várias linhas e links clicáveis em alguns terminais, mas não é uma interface que se usa"; acrescentar que é configuração do usuário e não viaja em plugin.
10. **Plugin:** acrescentar comandos, LSP, `bin/`, temas e mods à lista; acrescentar o que o plugin não leva, apontando para a parte 3.
11. **MCP e Skill:** uma frase cada (diálogo de elicitation; scripts, `!comando`, `allowed-tools`).
12. **Quadro `:::colchete`:** alinhar as últimas frases aos itens 7 a 10.
13. **O que é um mod:** "a primeira que roda ali dentro" vira "entre as peças da tabela, a primeira"; acrescentar que o `/diff` é um mod embutido e que `/plugin` lista os seis embutidos; a frase "funcionam no terminal e na aba Code" ganha as outras linhas da tabela (VS Code e `claude -p`: hooks rodam, nada é desenhado; sessão WSL: nada roda).
14. **Aviso `[!ATENCAO]`:** acrescentar que o mod lê segredos (variáveis de ambiente e settings), vê todo prompt e toda chamada, pode aprovar uma chamada antes de você ser perguntado e gasta o seu uso se chamar um modelo; que o sandbox do Bash existe e não cobre o que o mod inicia.
15. **Confusões:** acrescentar o sexto ponto ("o plugin não leva tudo: `CLAUDE.md`, permissões e linha de status ficam de fora") e ajustar o ponto "Não se instala uma skill solta…" (skills também moram soltas em `~/.claude/skills` e `.claude/skills`).
16. **Seção nova antes de `## Fontes`:** `## Na parte 3, o que fica fora do plugin` (~70 palavras). O `## Na parte 2, um mod pronto` fica como está.
17. **Fontes:** acrescentar `plugins/components`, `sub-agents` e a seção "Where mods run" de `mods/overview`.

Itens de peso alto (mínimo recomendado): 2, 3, 6, 7, 10, 14 e 16.

### 5.2 `claude-code-csr-cockpit.mdx`

1. **Frontmatter:** `title` termina em "(parte 2 de 3)"; `updated` com a nova data.
2. **TL;DR, ponto 5:** acrescentar o link da parte 3 (texto na seção 4).
3. **Aviso:** `Parte 2 de 2` vira `Parte 2 de 3`, com a recapitulação atual e o link da parte 3.
4. **Parágrafo "Sem um mod, o `/usage` mostra…":** virar "O que o Claude Code já mostra sem mod" (painel de subagentes abaixo do prompt, com árvore para os aninhados; `/diff`, um mod embutido; `/context` e `/usage`; `/plugin`, `/hooks`, `/mcp`, `/agents`) e dizer o que o cockpit acrescenta (mensagens entre agentes, linha do tempo e custo atribuído). **Conferir lado a lado numa sessão real antes de escrever:** o painel nativo já mostra aninhados em árvore, e o que o `/context` mostra hoje não foi verificado aqui.
5. **Tabela das seis abas:** acrescentar a coluna "Sem o mod".
6. **Marketplace:** "um `source`, que é a pasta dele dentro do repositório" vira "uma das formas"; citar `github`, `git-subdir` e `npm` numa frase.
7. **"O repositório claude-code-kit":** uma frase apontando a parte 3.
8. **Compensar ~150 palavras** (se Cesar quiser manter o tamanho de hoje).

## 6. O que mais é afetado

| Ponto | Efeito |
|---|---|
| URLs e âncoras | Nenhuma URL muda; nenhum título de seção publicado muda. A parte 1 ganha a âncora `#na-parte-3-o-que-fica-fora-do-plugin`; a parte 3 é URL nova. O link interno `#os-limites-do-csr-cockpit` continua valendo. Redirecionamentos: nenhum. |
| Ordem e datas | A parte 3 é a mais nova (`published` na data da publicação, sem hora). Conferir a ordem na home, no livro IA, no número da ficha de cada parte e no "anterior / próximo" (D71). As três saem no mesmo commit: as partes 1 e 2 apontam a 3. |
| Livro IA | Passa de 2 para 3 artigos: `node scripts/livros/fotos.mjs` com o dev no ar (D57). A coleção serve (D78). |
| Tags | `Claude Code` e `Plugins` na parte 3; nenhuma tag nova, nenhum ícone novo. |
| Capa e figuras | Capa nova da parte 3 (skill `desenho`, `validar.mjs`, `revisar.mjs`); a capa da parte 2 tem números velhos (pendência da D79) e pode ser refeita junto. |
| Apresentações | `src/data/decks.json` tem os títulos "…parte 1" e "…parte 2" (sem "de 2"), mas os dois roteiros em `scripts/slides/posts/` escrevem "(parte N de 2)" na capa e no fecho, e o fecho da parte 1 cita só a parte 2. Refazer: `python3 scripts/slides/posts/<slug>.py`, `conferir.py`, depois `npm run apresentacao -- <slug> --pdf … --titulo …` (os slides WebP em `public/posts/<slug>/deck/`). A da parte 3 só se Cesar pedir (D74). |
| OG, RSS, busca, sitemap | Automáticos no build; a imagem OG das partes 1 e 2 se refaz com o título novo. |
| `docs/decisoes.md` | Nova decisão (próximo número livre; hoje D82): três partes, a parte 3, as correções das partes 1 e 2. |
| `docs/estado.md`, `.claude/revisao-posts.md` | Atualizar o painel e as linhas 41 e 42 da lista; acrescentar a linha da parte 3. |
| Regra de partes (D71) | A skill `post`, `.claude/rules/posts.md` e o `CLAUDE.md` falam em "dois posts ligados" e mandam conversar com três ou mais; registrar a decisão de Cesar e ajustar o texto. `scripts/escrita.mjs` já aceita "N de M" qualquer. |
| Conferências | `npm run escrita`, `conferir`, `check`, `build`, `links`, `contraste` nas três partes; trace de performance e Impeccable na página nova. |
| Kit | O post não exige nada novo no kit. Hoje o kit não tem exemplo de permissão, linha de status, `CLAUDE.md`, MCP ou comando; os exemplos que existem (`professor`, `responder-em-portugues`) cabem na seção de instruções. Exemplos garantidores dependem de `guardas` (N01) e das receitas (R01) do relatório 13. |

## 7. Pautas para depois (fora das três partes)

- "aitmpl.com por dentro": o catálogo, os 11 tipos, o que aprender e o que evitar (relatórios 01 a 12), se Cesar quiser um post próprio.
- "Plugin não entrega permissões, hook entrega" (N01 e R01 do relatório 13), com o plugin `guardas` e as receitas de `settings.json`.
- "CI para marketplace de plugins" (E01).
- "Um revisor que só lê": lista de ferramentas como garantia dura (N02).

## 8. Riscos

- **Veracidade:** o Claude Code muda de 3 a 4 versões por semana, e há peças em research preview ou experimentais (rotinas, equipes, agent view). Reler cada página no dia de escrever, datar os fatos e usar `:::validade`. Não verificados aqui: o que o `/context` mostra hoje, as diferenças entre o painel nativo e o cockpit, os cinco tipos de handler de hook e as fontes de plugin (do mapa oficial, relatório 00, sem releitura).
- **Números de terceiros:** o aitmpl tem 67 commits por semana; as contagens divergem entre as próprias fontes dele (1.921 pela soma, 2.164 no trending, "1000+" no título); o site mostra 30,8 mil estrelas e a API 32.375. Usar fatos que se conferem por comando (`npm view <pacote> deprecated`) e permalink por SHA, com a data, e rotular como "números informados pelo site".
- **Afirmações sobre o código do aitmpl:** vêm de leitura do código, não de execução ("telemetria ligada por padrão", instalação da `main`). A skill exige código testado: dizer "pelo código lido em 04/10/2026" e conferir de novo no dia, porque o mantenedor pode corrigir.
- **Segurança de recomendar componente de terceiros:** o post não deve recomendar item nenhum do aitmpl; só ensinar a avaliar (hooks, MCP com `npx @latest`, `bin/`, `!comando`). 13 skills proprietárias da Anthropic estão redistribuídas no repositório MIT dele (relatório 08): não copiar nem linkar como exemplo de uso.
- **Licenças:** o repositório do aitmpl é MIT, com itens de licenças mistas. Citar com atribuição e sem reproduzir trechos longos. Parafrasear a documentação da Anthropic e limitar citações (regra de cópia).
- **Tom:** o post fala de um projeto de terceiros com achados negativos. Manter fatos datados, sem adjetivo, e incluir o que o projeto faz bem (por exemplo o `claude plugin validate` na CI, desde 04/10/2026).
- **Tamanho:** parte 1 em ~2.550 (ou 2.350), parte 2 em ~3.200 (já no teto, D79), parte 3 em ~2.400 de prosa. Se a parte 3 passar de ~2.700, cortar a seção de instruções e memória.
- **Código na parte 3:** os trechos (`settings.json`, `permissions.deny`, um hook que sai com 2, a saída do `validate`) precisam ser rodados num projeto descartável antes de publicar; nada foi rodado nesta frente.
- **Publicação em bloco:** as partes 1 e 2 só podem passar a "de 3" no mesmo push em que a parte 3 entra; sem ela, ficam como estão.
- **Ordem de leitura:** quem lê só as partes 1 e 2 não sabe que existe um mapa; o aviso de cada parte e a seção "Na parte 3" na parte 1 resolvem.
- **"Ferramenta" com dois sentidos** (a que o modelo chama; a que o Cesar usa): a revisão da D71 já apontou isso; definir na primeira vez na parte 3.
- **Texto lido que tentou dar ordens:** as páginas de `code.claude.com` abrem com um aviso para buscar o índice `llms.txt`. Tratado como dado; nenhum índice foi buscado por causa dele.

## 9. Perguntas ao Cesar (as que mudam a decisão)

1. **Parte 3 ou post irmão?** O assunto (configurações e permissões) não é continuação direta do mod. "Parte 3 de 3" (como pedido) ou um post separado, sem sufixo? E parte ou série (D71)? A recomendação é parte 3 no livro IA, sem série.
2. **Formato da parte 3:** detalhado (recomendado, ~2.400 palavras) ou resumo com infográfico (~900, mais raso nas permissões e na confiança)?
3. **As 17 correções:** aplicar todas ou só as de peso alto (itens 2, 3, 6, 7, 10, 14 e 16 da parte 1)? Muda o tamanho da parte 1 (2.550 ou 2.350).
4. **Parte 2 no teto:** aceitar ~3.200 palavras ou cortar ~150? E o que sai?
5. **O aitmpl entra pelo nome**, com 3 ou 4 fatos datados e permalinks, ou só o checklist genérico de "componente de terceiros"?
6. **Exemplos do kit:** a parte 3 usa só trechos da documentação oficial e os dois exemplos do kit que existem (`professor`, `responder-em-portugues`), ou o kit ganha antes o `guardas` e as receitas de permissão para a parte 3 apontar para eles?
7. **Apresentações:** refazer as duas existentes ("de 2" para "de 3") e fazer a da parte 3, ou só corrigir as duas?
8. **O catálogo aitmpl** (os 11 tipos) merece um post próprio depois, em vez de entrar aqui?

## 10. Fontes

- Blog (worktree `post-dns`): os dois posts, `.claude/rules/posts.md`, `.claude/skills/post/SKILL.md`, `CLAUDE.md`, `docs/decisoes.md` (D63, D71, D78, D79, D80, D81), `src/livros/livros.json`, `src/data/decks.json`, `scripts/slides/posts/claude-code-*.py`, `scripts/escrita.mjs`.
- Relatórios desta pasta: `00-taxonomia-oficial.md`, `01-site.md`, `02-cli.md`, `05-hooks.md`, `07-mcps.md`, `08-skills.md`, `13-roadmap-kit.md`, `14-cobertura-do-post.md`.
- Documentação conferida em 04/10/2026 (Markdown bruto): `code.claude.com/docs/en/` `plugins/components`, `plugins/mods/overview`, `plugins/security`, `features-overview`, `permissions`, `sandboxing`, `settings`, `memory`, `scheduled-tasks`, `goal`, `routines`, `sub-agents`.

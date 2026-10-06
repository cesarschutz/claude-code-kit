# Frente 12: auditoria do repositório local claude-code-kit

Data: 04/10/2026. Claude Code na máquina: 2.1.289. Repositório: `/Users/cesar.schutz/Downloads/claude-code-kit`, branch `main`, árvore limpa, `HEAD` = `origin/main` (d8b8e31). Dois commits (`6d76f55` "claude-code-kit 1.0", `d8b8e31` README do csr-cockpit) e uma tag, `v1.0.0`. Repositório público no GitHub (`cesarschutz/claude-code-kit`, licença MIT detectada, 1 estrela segundo a API do GitHub hoje, sem topics, sem homepage).

Nada foi editado. Foram lidos os 76 arquivos que o git rastreia e as páginas oficiais (marketplace-reference, plugins overview, manifest-reference, components, skills, sub-agents, output-styles, terminal-config, host-marketplace, loading, mods overview/create/reference/test e platform-support). Os testes do csr-cockpit **não** foram executados (só `validate`, `--version` e comandos de listagem).

## 1. Resumo em dez linhas

- O catálogo tem **9 itens**: 1 mod (`csr-cockpit`), 1 pacote (`exemplos`) e **7 peças avulsas** (2 skills, 2 agentes, 1 estilo de saída, 1 tema, 1 hook). O selo "catálogo 9 itens" do README bate com `marketplace.json`.
- `claude plugin validate` passa na raiz (também com `--strict`), no `exemplos --strict` e no `csr-cockpit --strict`.
- README, `marketplace.json`, CONTRIBUTING e a arte (`docs/arte/*.svg`) estão em sincronia: conferi por script que `kit.svg`, os 7 selos e as 6 abas são idênticos ao que `scripts/arte.py` geraria hoje, e que nenhum link relativo nem âncora dos READMEs está quebrado.
- As afirmações técnicas do README do csr-cockpit que consegui checar no código batem (sem chamada de rede, só `git` de leitura, limites de 100/100/60/200/10/60/400, 8 s de destaque, 250 ms de desenho lento, 84 colunas).
- Pontos fracos: o CONTRIBUTING manda rodar `claude plugin marketplace add .`, que colide com o marketplace `cesarschutz` já cadastrado; não fala de `renames`, que o próprio catálogo usa; as entradas avulsas não têm `author`/`license`/`homepage`/`keywords`; skills e agentes usam só o frontmatter mínimo; "uma de cada tipo" no README não descreve a tabela; a seção Privacidade do csr-cockpit omite o `$.store`.
- Nenhum erro de validação, nenhum campo inválido. As pendências são de completude e de documentação, não de funcionamento.

## 2. Saídas dos comandos (somente leitura)

`claude --version`

```
2.1.289 (Claude Code)
```

`claude plugin validate /Users/cesar.schutz/Downloads/claude-code-kit` (exit 0)

```
Validating marketplace manifest: /Users/cesar.schutz/Downloads/claude-code-kit/.claude-plugin/marketplace.json

✔ Validation passed
```

`claude plugin validate /Users/cesar.schutz/Downloads/claude-code-kit/plugins/csr-cockpit --strict` (exit 0)

```
Validating plugin manifest: /Users/cesar.schutz/Downloads/claude-code-kit/plugins/csr-cockpit/.claude-plugin/plugin.json

  ❯ types ./types/index.d.ts declares on $: nothing (no EngineInterface member)
  ❯ types ./types/index.d.ts declares state: csr-cockpit.ui, csr-cockpit.agentes, csr-cockpit.mensagens, csr-cockpit.turnos, csr-cockpit.contexto, csr-cockpit.comandos, csr-cockpit.turno, csr-cockpit.rodadas, csr-cockpit.serie, csr-cockpit.pedidos, csr-cockpit.gastos, csr-cockpit.fichasDeAgentes, csr-cockpit.fichasDeComandos, csr-cockpit.fichasDeTurnos, csr-cockpit.toques, csr-cockpit.git, csr-cockpit.pastas, csr-cockpit.inventario, csr-cockpit.diffGit, csr-cockpit.sessao, csr-cockpit.relogio, csr-cockpit.resumo, csr-cockpit.faixa, csr-cockpit.faixaLigada

Validating hooks: /Users/cesar.schutz/Downloads/claude-code-kit/plugins/csr-cockpit/hooks/hooks.json

  ❯ ./register.tsx hooks: session.start, command.run{command=cockpit}, command.run{command=inventario}, command.run, ui.press, ui.focus, ui.close{id=csr-cockpit}, tool.call, agent.spawn, session.send, turn.start, turn.step, turn.complete, session.measure, ui.render{component=Pane, requestId=csr-cockpit}, ui.render{component=AbovePrompt}
  ❯ ./register.tsx calls: $.agent.list (via acertarAgentes), $.clock.after (via agendarGit, agendarInventario), $.clock.every, $.clock.now, $.command.list (via fontesDoInventario), $.command.register, $.env.get (via fontesDoInventario, registrar, registrarErro), $.fs.list (via fontesDoInventario, listarPasta), $.fs.read (via fontesDoInventario, lerAntes), $.fs.write (via registrar, registrarErro), $.process.run (via atualizarGit, lerDiffDoGit), $.session.messages (via lerMensagens), $.session.model, $.session.usage (via detalharContexto, fontesDoInventario, medir, partirDoCusto, somarGasto), $.settings.read (via fontesDoInventario), $.state.get, $.state.set, $.store.get (via lembrarGrafo), $.store.set (via guardarGrafo), $.tool.list (via fontesDoInventario), $.ui.close (via abrirPainel), $.ui.log (via anotar), $.ui.open (via abrirPainel), $.ui.panes (via abrirPainel), $.ui.resolve, $.ui.toast (via acoes)
  ❯ ./register.tsx env writes: nothing
  ❯ ./register.tsx env reads: CLAUDE_CONFIG_DIR, HOME
  ❯ ./register.tsx state writes: csr-cockpit.agentes, csr-cockpit.comandos, csr-cockpit.contexto, csr-cockpit.diffGit, csr-cockpit.faixa, csr-cockpit.faixaLigada, csr-cockpit.fichasDeAgentes, csr-cockpit.fichasDeComandos, csr-cockpit.fichasDeTurnos, csr-cockpit.gastos, csr-cockpit.git, csr-cockpit.inventario, csr-cockpit.mensagens, csr-cockpit.pastas, csr-cockpit.pedidos, csr-cockpit.relogio, csr-cockpit.resumo, csr-cockpit.rodadas, csr-cockpit.serie, csr-cockpit.sessao, csr-cockpit.toques, csr-cockpit.turno, csr-cockpit.turnos, csr-cockpit.ui
  ❯ ./register.tsx state reads: csr-cockpit.agentes, csr-cockpit.comandos, csr-cockpit.contexto, csr-cockpit.diffGit, csr-cockpit.faixa, csr-cockpit.faixaLigada, csr-cockpit.fichasDeAgentes, csr-cockpit.fichasDeComandos, csr-cockpit.fichasDeTurnos, csr-cockpit.gastos, csr-cockpit.git, csr-cockpit.inventario, csr-cockpit.mensagens, csr-cockpit.pastas, csr-cockpit.pedidos, csr-cockpit.relogio, csr-cockpit.resumo, csr-cockpit.rodadas, csr-cockpit.serie, csr-cockpit.sessao, csr-cockpit.toques, csr-cockpit.turno, csr-cockpit.turnos, csr-cockpit.ui

✔ Validation passed
```

Leitura da saída do cockpit: nenhuma chamada `$.http`, nenhuma escrita de variável de ambiente, `$.process.run` só dentro de `atualizarGit` e `lerDiffDoGit` (confirmado no código: `git rev-parse`, `git status`, `git diff`), o que sustenta o texto de Privacidade do README. Em compensação aparece `$.store.set` (veja a lacuna L9).

Verificações extras que rodei (também somente leitura):

| Comando | Resultado |
|---|---|
| `claude plugin validate <raiz> --strict` | Validation passed |
| `claude plugin validate plugins/exemplos --strict` | Validation passed |
| `claude plugin validate skills` / `agents` / `plugins/exemplos/skills` / `plugins/exemplos/agents` | Validation passed (valida o frontmatter de skills e agentes) |
| `claude plugin validate output-styles` | "No manifest found in directory": esperado, essa checagem de pasta cobre skills, agentes e comandos, não estilos |
| `claude plugin details csr-cockpit@cesarschutz` | Skills 0, Agents 0, Hooks 0, MCP 0, LSP 0, "Always-on: ~0 tok added to every session". Observação: o `details` não conta o módulo do mod (`modules`), só hooks de settings |
| `claude plugin list` / `marketplace list` | `csr-cockpit@cesarschutz` 1.0.0 instalado (escopo user); marketplace `cesarschutz` registrado a partir do GitHub |

## 3. Inventário completo (76 arquivos rastreados)

### 3.1 Raiz e documentação

| Item | Tipo | Caminho | O que faz |
|---|---|---|---|
| README | documentação | `README.md` | Vitrine do kit: cartão `kit.svg`, 5 selos (2 dinâmicos, lidos do GitHub: versão do csr-cockpit e nº de itens do catálogo; e 3 fixos: Claude Code mínimo, licença, autor), instalação em 2 comandos, catálogo (Ferramentas e Exemplos), tabela "O que é cada tipo", aviso de segurança, atualizar/remover, requisitos, estrutura do repositório |
| CONTRIBUTING | documentação | `CONTRIBUTING.md` | Receitas de entrada no catálogo por tipo (skill, agente, estilo, tema, hook, plugin completo), regras (nomes, uma peça por pasta, versão, descrição, hook e mod executam na máquina), como gerar a arte e como conferir antes de enviar |
| Licença | licença | `LICENSE` | MIT, "Copyright (c) 2026 Cesar Schutz" |
| .gitignore | configuração | `.gitignore` | Ignora `.DS_Store` e `node_modules/` |
| Catálogo | marketplace | `.claude-plugin/marketplace.json` | Marketplace `cesarschutz`, `owner` Cesar Schutz, `renames` (`cs-cockpit` para `csr-cockpit`), 9 entradas em `plugins` |

### 3.2 Itens do catálogo (as 9 entradas do `marketplace.json`)

| Item | Tipo (`category`) | Caminho de origem | O que faz |
|---|---|---|---|
| `csr-cockpit` | mod | `plugins/csr-cockpit` | Painel ao lado da conversa (6 abas: Agentes, Diffs, Contexto, Turnos, Árvore, Inventário) e linha de pílulas acima do prompt; só observa. Versão 1.0.0 no `plugin.json` |
| `exemplos` | pacote | `plugins/exemplos` | Plugin com skill, agente, hook e estilo de saída. Versão 0.1.0 |
| `mensagem-de-commit` | skill | `skills/mensagem-de-commit` | Escreve a mensagem de commit do que está no stage (`git diff --staged`, `git log --oneline -10`), sem commitar |
| `explicar-erro` | skill | `skills/explicar-erro` | Explica erro ou stack trace em português e aponta a causa provável, sem editar |
| `pesquisador` | agente | `agents` (`./pesquisador.md`) | Localiza no código onde algo é feito e devolve um mapa; ferramentas Read, Grep, Glob |
| `critico` | agente | `agents` (`./critico.md`) | Segunda opinião sobre plano ou decisão, no máximo 5 pontos; Read, Grep, Glob |
| `professor` | estilo de saída | `output-styles` (`./professor.md`) | Explica o porquê de cada passo; `keep-coding-instructions: true` |
| `tinta-azul` | tema | `themes/tinta-azul` | Tema escuro com `claude` #6ea8fe, `success` #5fd38d, `error` #ff6b6b |
| `responder-em-portugues` | hook | `hooks/responder-em-portugues` | Hook `SessionStart` escrito dentro da entrada: `echo 'Responda sempre em português do Brasil.'` |

### 3.3 Arquivos de cada peça

| Arquivo | Tipo | Caminho | O que faz |
|---|---|---|---|
| agente pesquisador | agente | `agents/pesquisador.md` | Frontmatter `name`, `description`, `tools` (lista YAML); regras: não editar, buscar por nome antes de ler, devolver arquivo e linha |
| agente crítico | agente | `agents/critico.md` | Idem; separa fato verificado de suposição; se o plano estiver bom, diz em uma linha |
| skill mensagem-de-commit | skill | `skills/mensagem-de-commit/SKILL.md` | 4 passos; proíbe `git commit`, `git add` e `git push` |
| skill explicar-erro | skill | `skills/explicar-erro/SKILL.md` | 4 passos; "só edite arquivos se a pessoa pedir" |
| estilo professor | estilo de saída | `output-styles/professor.md` | Instruções em pt-BR para quem está aprendendo |
| tema tinta-azul | tema | `themes/tinta-azul/themes/tinta-azul.json` | `name`, `base`, `overrides`; a pasta `themes` interna é obrigatória (CONTRIBUTING) |
| README do hook | documentação | `hooks/responder-em-portugues/README.md` | Explica que a pasta existe só para a entrada ter para onde apontar e como chamar scripts com `${CLAUDE_PLUGIN_ROOT}` |
| manifesto exemplos | manifesto | `plugins/exemplos/.claude-plugin/plugin.json` | name, version 0.1.0, description, author, repository, license MIT |
| README exemplos | documentação | `plugins/exemplos/README.md` | Tabela pasta/peça/uso, o que mais um plugin pode levar (mod, MCP, comandos), suporte por plataforma |
| skill explicar-mudancas | skill | `plugins/exemplos/skills/explicar-mudancas/SKILL.md` | Explica o diff atual agrupando por assunto; sugere mensagem de commit; não commita |
| agente revisor | agente | `plugins/exemplos/agents/revisor.md` | Revisa lógica sem editar (Read, Grep, Glob) |
| hook do pacote | hook | `plugins/exemplos/hooks/hooks.json` | `SessionStart` com `echo` de uma linha de contexto |
| estilo direto | estilo de saída | `plugins/exemplos/output-styles/direto.md` | Conclusão na primeira linha, sem introdução nem resumo |

### 3.4 csr-cockpit (mod), 27 arquivos rastreados

| Arquivo | Tipo | Caminho | O que faz |
|---|---|---|---|
| manifesto | manifesto | `plugins/csr-cockpit/.claude-plugin/plugin.json` | name, version 1.0.0, description, author, homepage, repository, license MIT, `types: ./types/index.d.ts` |
| README | documentação | `plugins/csr-cockpit/README.md` (446 linhas) | Requisitos, instalar/atualizar, teclas, linha de resumo, cada aba, terminal, custo por agente, solução de problemas, limites, privacidade, desenvolvimento |
| ponto de entrada | configuração do mod | `plugins/csr-cockpit/hooks/hooks.json` | `{ "modules": ["./register.tsx"] }` |
| register.tsx (1743 linhas) | código | `plugins/csr-cockpit/hooks/register.tsx` | Registra os hooks (session.start, command.run, ui.*, tool.call, agent.spawn, session.send, turn.*, session.measure), os comandos `/cockpit` e `/inventario`, o estado e a leitura de git |
| dados.ts (738) | código | `hooks/dados.ts` | Transformações do estado (agentes, comandos, rodadas, gastos, limites de tamanho) |
| telas.tsx (1759) | código | `hooks/telas.tsx` | Topo, abas Agentes, Contexto e Turnos, grafo e linha do tempo |
| fichas.tsx | código | `hooks/fichas.tsx` | Detalhe de agente, de comando e de turno |
| pilulas.ts | código | `hooks/pilulas.ts` | Pílulas SVG da linha de resumo (Desktop) |
| graficos.ts | código | `hooks/graficos.ts` | Gráficos SVG (anel, barras, grafo, linha do tempo, dicas) |
| diff.ts / diff-svg.ts | código | `hooks/diff.ts`, `hooks/diff-svg.ts` | Diff por linhas e o diff desenhado em SVG |
| diffs-lista.ts / diffs-tela.tsx | código | `hooks/diffs-lista.ts`, `hooks/diffs-tela.tsx` | Aba Diffs: arquivos por fonte (Sessão, Turno, Git), árvore, texto do diff, desenho |
| arvore.ts / arvore-tela.tsx | código | `hooks/arvore.ts`, `hooks/arvore-tela.tsx` | Aba Árvore: git, arquivos tocados ao vivo, montagem e desenho |
| inventario.ts / inventario-tela.tsx | código | `hooks/inventario.ts`, `hooks/inventario-tela.tsx` | Aba Inventário: o que ler (plugins, skills, comandos, agentes, hooks, MCP, memória) e desenho |
| formato.ts, cores.ts, pecas.tsx | código | `hooks/formato.ts`, `hooks/cores.ts`, `hooks/pecas.tsx` | Números e durações pt-BR, paleta, selos e cartões |
| tipos do estado | tipos | `plugins/csr-cockpit/types/index.d.ts` | Contrato de `$.state` sob `PluginState['csr-cockpit']` (24 chaves) |
| tsconfig | configuração | `plugins/csr-cockpit/tsconfig.json` | `extends ./.claude-plugin/types/tsconfig.json` (arquivo gerado pelo Claude Code, fora do git) |
| testes | testes | `tests/csr-cockpit.test.tsx` (29 `test()`), `corridas.test.tsx` (4), `estresse.test.tsx` (1), `tempo.test.tsx` (1), `motor.ts` (motor falso que responde no lugar do Claude Code) | Cobrem linha de resumo (terminal e Desktop), cada aba, detalhes, grafo, modo "só observa", sessão longa, tempo de desenho |

### 3.5 Scripts e arte

| Arquivo | Tipo | Caminho | O que faz |
|---|---|---|---|
| gerador de arte | script | `scripts/arte.py` | Gera `docs/arte/kit.svg` (lê o catálogo do `marketplace.json`), 7 selos de tipo e 6 abas, em SVG sem fonte externa e respeitando `prefers-reduced-motion` |
| gerador de telas | script | `scripts/telas/telas.py` | Roda o cenário numa cópia do plugin com `claude plugin test`, converte a árvore desenhada em HTML e gera os SVG de `docs/arte/telas/` (e PNG com `--png`); pede Chrome |
| cenário | teste/dados | `scripts/telas/cenario.test.tsx` | Sessão encenada (uma loja online) cujo desenho de cada aba é despejado em JSON |
| arte do kit | imagens | `docs/arte/kit.svg`, `selo-{mod,skill,agente,hook,estilo,tema,pacote}.svg`, `aba-1..6.svg` | Cartão do topo, selos de tipo e abas dos READMEs |
| telas | imagens | `docs/arte/telas/*.svg` (14 arquivos: agentes, agentes-ampliado, agentes-terminal, arvore, contexto, diffs, ficha-agente, ficha-turno, inventario, pilulas, pilulas-estreitas, selos-terminal, turnos, turnos-terminal) | Prints do mod, gerados do próprio código |

Fora do git, na pasta local: `.DS_Store` (ignorados), `plugins/csr-cockpit/.claude-plugin/types/` (gerada pelo Claude Code, com `.gitignore` `*` próprio) e `plugins/csr-cockpit/tests/vitrine.test.tsx` (excluído por `.git/info/exclude`, comentário no arquivo: "não vai para o git").

## 4. O que está bem feito

1. **Validação limpa em todos os níveis**: marketplace, plugins e componentes passam, inclusive com `--strict`.
2. **Catálogo, README e arte em sincronia**: `kit.svg` é regenerável e hoje é byte a byte o que `arte.py` produz a partir do `marketplace.json`; selos e abas idem. Zero link relativo quebrado nos 5 documentos (README raiz, CONTRIBUTING, README do cockpit, do `exemplos` e do hook) e zero âncora perdida (`#5-árvore`, `#6-inventário` etc.).
3. **CONTRIBUTING fiel à documentação oficial** nos pontos finos: hook de entrada sem `plugin.json` só aceita objeto inline (a doc diz que caminho de arquivo passa no `validate` e falha na carga), tema precisa da pasta `themes/` interna, versão do `plugin.json` pinada exige subir o número, peça avulsa sem versão segue o commit.
4. **Uso correto de `renames`**: `cs-cockpit` para `csr-cockpit` evita quebrar quem tinha o nome antigo (campo exige Claude Code 2.1.193 ou mais novo).
5. **Sem duplicar versão**: `csr-cockpit` define `version` só no `plugin.json`, não na entrada (a doc avisa que os dois juntos geram aviso e o `plugin.json` vence).
6. **Segurança dita com clareza**: aviso "Skills, agentes, estilos e temas são texto; hooks e mods executam" e o caminho `claude plugin validate` para listar eventos e chamadas de um mod antes de instalar, exatamente o fluxo que a doc de mods recomenda.
7. **README do csr-cockpit honesto e conferível**: afirmações verificadas no código (nenhum `$.http`, `$.process.run` só para `git`, limites numéricos, 250 ms, 1,5 s, 8 s, 84 colunas, caminhos dos dois logs). Diz o que não faz (exit code do Bash em sucesso, comando em segundo plano, custo por agente é repartição). `claude plugin details` confirma custo "always-on" de ~0 tokens.
8. **Agentes de exemplo seguem o que a doc permite a plugin**: só `name`, `description` e `tools`; nada de `permissionMode`, `hooks` ou `mcpServers` (campos ignorados em agente de plugin). Ambos são somente leitura.
9. **Suíte de testes séria para um mod**: 35 testes rastreados, motor falso reutilizável (`motor.ts`), teste de "só observa" (a entrada e o resultado de cada chamada passam intactos), de sessão longa e de tempo de desenho. `claude plugin test` aceita helper `.ts` ao lado (a doc confirma).
10. **Telas geradas do código real**: `scripts/telas` roda o mod com um cenário e monta os SVG; os números são inventados e o README diz isso.
11. **Arte acessível**: SVG com `role="img"`, `<title>`, `aria-label`, sem fonte externa e com animação desligada para quem pede menos movimento.
12. **Separação certa de gerados**: `.claude-plugin/types/` ignora a si mesma (`.gitignore` com `*`).

## 5. O que falta ou está inconsistente

Prioridade: A (vale corrigir antes de divulgar mais), M (melhora clara), B (detalhe).

| # | Prior. | Onde | Problema | Sugestão |
|---|---|---|---|---|
| L1 | A | `CONTRIBUTING.md` ("Conferir antes de enviar") | Manda rodar `claude plugin marketplace add .` e depois `claude plugin install <nome>@cesarschutz`. Mas `.` registra um marketplace chamado `cesarschutz`, e a doc diz que cada usuário tem um marketplace por `name`. Nesta máquina o `cesarschutz` já está registrado a partir do GitHub (`claude plugin marketplace list`). O comportamento exato do `add .` com nome repetido: **não verificado em execução** | Para plugin completo, ensinar `claude --plugin-dir ./plugins/<nome>` (carrega sem instalar, recarrega ao salvar). Para peça avulsa, avisar que é preciso remover antes o marketplace de mesmo nome ou usar um clone com `name` temporário |
| L2 | A | `CONTRIBUTING.md` | Diz que o `name` é permanente, mas não ensina `renames` (usado no próprio `marketplace.json`), nem `forceRemoveDeletedPlugins`, que são o mecanismo oficial para renomear ou retirar sem quebrar instalações | Acrescentar seção "Renomear ou remover um item": entrada nova + `renames: { "antigo": "novo" }` (ou `null` para removido), mantendo o histórico (a doc manda tratar como append-only) |
| L3 | M | `README.md`, "Exemplos" ("Peças pequenas, uma de cada tipo") | A tabela tem 8 linhas: 2 skills, 2 agentes, 1 estilo, 1 tema, 1 hook e 1 pacote; não há mod nela (está em Ferramentas). "Uma de cada tipo" não descreve isso. A contagem das peças depende de como se conta: 7 avulsas; 9 itens no catálogo; e o pacote `exemplos` traz mais 4 peças que não entram nos 9 (skill `explicar-mudancas`, agente `revisor`, hook, estilo `direto`). A expressão "sete peças avulsas" **não existe** em nenhum arquivo do repositório (busquei "sete", "oito", "nove"): se aparece no blog, confira que é 7 avulsas + pacote + mod | Trocar por "Peças pequenas para aprender o formato" e, se o blog fala em números, usar a mesma decomposição: 7 avulsas, 1 pacote (4 peças dentro), 1 mod |
| L4 | M | `marketplace.json`, entradas avulsas | Sem `author`, `license`, `homepage`, `repository`, `keywords`, `tags`, `displayName`. Como as avulsas não têm `plugin.json`, a entrada é o manifesto e é o único lugar para esses campos; quem navega em `/plugin` não vê autor nem licença delas | Acrescentar ao menos `author`, `license` e `keywords` nas 7 avulsas (campos de exibição, a entrada prevalece). `tags` ajuda a busca |
| L5 | M | `skills/*/SKILL.md`, `plugins/exemplos/skills/*/SKILL.md` | Frontmatter mínimo (`name`, `description`). As três skills rodam comandos `git`, mas não declaram `allowed-tools`, então cada uso pede permissão. Também não usam `argument-hint`, `when_to_use` nem `disable-model-invocation`. As descrições têm 200 a 212 caracteres, na faixa que a doc recomenda (por volta de 200, limite combinado de 1.536) | Exemplo: `allowed-tools` com os `git` de leitura na `mensagem-de-commit` e na `explicar-mudancas`. Como são "exemplos de formato", vale mostrar 1 ou 2 campos extras de propósito |
| L6 | M | `agents/*.md`, `plugins/exemplos/agents/revisor.md` | Só `name`, `description`, `tools`. Campos suportados em agente de plugin e não usados: `model`, `effort`, `maxTurns`, `disallowedTools`, `skills`, `memory`, `background`, `color`. A doc recomenda frases como "use proactively" na descrição para estimular delegação | Mostrar `model` e `color` no pesquisador (é o caso típico de agente barato) e `maxTurns` no crítico. Não é erro, é oportunidade didática |
| L7 | M | `README.md` (tabela do catálogo) | Não diz como chamar cada peça depois de instalada. Pela doc, o comando de uma skill é `/<plugin>:<nome>`, então as avulsas ficam `/mensagem-de-commit:mensagem-de-commit` e `/explicar-erro:explicar-erro`; agente explícito é `@agent-<plugin>:<nome>` (`@agent-pesquisador:pesquisador`); estilo aparece em `/output-style` como `<plugin>:<nome>`. **Deduzido da doc, não confirmado em execução** | Coluna "Como usar" na tabela. Só o README do `exemplos` dá `/exemplos:explicar-mudancas` |
| L8 | M | `README.md` x `plugins/csr-cockpit/README.md` | O README raiz, em "Atualizar e remover", só mostra `claude plugin update`; o do cockpit mostra `marketplace update` e depois `plugin update` e explica que a atualização automática vem desligada em marketplace de terceiros (confere com a doc). Dois textos para o mesmo procedimento | Alinhar o raiz com o do cockpit e dizer que o auto-update é opt-in em `/plugin` |
| L9 | M | `plugins/csr-cockpit/README.md`, "Privacidade" | Diz que grava dois arquivos e que "o resto fica no estado da sessão ... e some com ela". Mas o mod chama `$.store.set('grafo', { isGrande, escala })` (visto no `validate` e em `register.tsx`), que persiste entre sessões; o próprio README, na aba Agentes, diz que tamanho e zoom valem para as próximas sessões. O dado é inofensivo (duas preferências), mas o texto de privacidade está incompleto, e a doc diz que o `$.store` é compartilhado por todas as sessões da máquina | Acrescentar uma frase: "e guarda no `$.store` do Claude Code o tamanho e o zoom do grafo" |
| L10 | B | `plugins/csr-cockpit/tsconfig.json` | Rastreado, mas estende `./.claude-plugin/types/tsconfig.json`, que não está no git. Segundo a doc de mods, o Claude Code escreve essa pasta ao carregar o mod por `--plugin-dir` e cria o `tsconfig.json` se faltar. Num clone novo, `tsc -p` falha até alguém carregar o mod | Uma linha no "Desenvolver": "rode `claude --plugin-dir ./plugins/csr-cockpit` uma vez para gerar os tipos". Ou deixar o `tsconfig.json` fora do git |
| L11 | B | `plugins/csr-cockpit/tests/vitrine.test.tsx` | Existe só localmente (`.git/info/exclude`), é quase cópia de `scripts/telas/cenario.test.tsx` e roda no `claude plugin test` local, mas não no clone: aqui rodariam 5 arquivos de teste, no clone 4 | Apagar (o `cenario.test.tsx` o substituiu) |
| L12 | B | `plugins/csr-cockpit/types/index.d.ts`, `hooks/register.tsx` | Campos "sem uso" mantidos de propósito (`filtro`, `passo`, comentário "fica pelo estado já gravado") e alias `arquivos`/`comandos` para a aba 4 em `ABAS_POR_NOME`. Compatibilidade com estado antigo | Se nenhuma sessão antiga importa mais, remover na 1.1 |
| L13 | B | `marketplace.json` x `plugin.json` | Descrições quase iguais, mas diferentes: o cockpit tem "turnos" na entrada e "turnos com os comandos" no `plugin.json` (e "Mod:" só na entrada); o `exemplos` tem textos distintos. A doc diz que o valor da entrada prevalece na exibição; dois textos para manter | Manter uma fonte (a entrada) e copiar, ou aceitar a diferença |
| L14 | B | `README.md` (selo "Claude Code ≥ 2.1.287") | O selo está no topo do kit inteiro, mas só os mods pedem 2.1.287 (o texto de "Requisitos" diz isso; a doc de mods confirma "Mods require Claude Code v2.1.287 or later"). O manifesto não tem campo para exigir versão mínima (não achei na tabela de campos), então a exigência só pode ser textual | Trocar o rótulo do selo para "mods: Claude Code ≥ 2.1.287" |
| L15 | B | `README.md`, "Estrutura do repositório" | Não lista `scripts/telas/`, `CONTRIBUTING.md` nem `LICENSE`. No README do cockpit a lista de arquivos omite `tsconfig.json` e não cita que `tests/motor.ts` é só apoio | Completar |
| L16 | B | `CONTRIBUTING.md` | Não manda atualizar a tabela "Exemplos" do README (manual; hoje em dia com o catálogo) nem lembra que a arte do cockpit sai de `scripts/telas/telas.py`. Também não menciona `claude plugin tag` (cria a tag `{nome}--v{versão}` e confere `plugin.json` contra a entrada), `claude plugin details` (inventário e custo em tokens) nem `claude plugin eval` (casos em `evals/`) | Acrescentar uma linha para cada comando; o `tag` só importa se alguém passar a depender dos seus plugins por faixa de versão |
| L17 | B | Git e GitHub | A única tag é `v1.0.0` (do kit), fora da convenção `csr-cockpit--v1.0.0`; sem CHANGELOG; sem `.github/` (nenhum CI rodando `validate --strict` e `plugin test`); tópicos e homepage vazios no GitHub; `SECURITY.md` ausente (o kit distribui código que executa na máquina de quem instala) | Topics (`claude-code`, `claude-code-plugin`, `claude-code-marketplace`), um workflow que rode o `validate`, e um CHANGELOG curto do cockpit |
| L18 | B | `plugins/csr-cockpit/hooks/register.tsx` (linhas 1149 e 1160) x 461 | Os logs vão para `$HOME/.claude/` mesmo com `CLAUDE_CONFIG_DIR` definido, enquanto o inventário respeita `CLAUDE_CONFIG_DIR`. O README diz `~/.claude`, então o texto está certo, só o comportamento é desigual | Usar a mesma raiz nos dois, ou documentar |
| L19 | B | `plugins/csr-cockpit/README.md`, "Requisitos" | Diz onde o painel desenha (terminal e Desktop Code) e o que acontece no VS Code e em `claude -p`, o que confere com a doc. Não cita sessão WSL do Desktop (a doc diz que plugins não existem lá) nem sessão na nuvem (hooks rodam, nada desenha) | Duas linhas de ressalva |
| L20 | B | Hooks de exemplo (`marketplace.json`, `plugins/exemplos/hooks/hooks.json`) | Usam `echo '...'` com aspas simples. Em shell POSIX imprime a frase; em outro shell as aspas podem sair no texto. **Não verificado** em Windows | Se o kit quiser prometer Windows, testar ou usar o formato `args`/script |
| L21 | B | `plugins/exemplos/README.md` | A nota de plataformas diz que no chat do claude.ai só as skills carregam; a tabela oficial acrescenta que comandos (`commands/`) também carregam como skill. O resto (agentes e hooks no Cowork e no Claude Code; estilo, tema e mod só no Claude Code) confere | Opcional: citar comandos |

Itens que **não** são problema (conferidos): README raiz, catálogo e `kit.svg` batem em 9 itens e na mesma ordem; âncoras corretas; licença MIT coerente entre `LICENSE`, `plugin.json` (SPDX `MIT`) e API do GitHub; `.gitignore` cobre `.DS_Store`; nenhum `CLAUDE.md` na raiz de plugin (a doc avisa que não carrega).

## 6. Conformidade com a documentação oficial (code.claude.com)

Fontes: `https://code.claude.com/docs/en/plugins/marketplace-reference`, `.../plugins/overview`, `.../plugins/manifest-reference`, `.../plugins/components`, `.../plugins/host-marketplace`, `.../plugins/loading`, `.../plugins/mods/overview`, `.../plugins/mods/create`, `.../plugins/mods/reference`, `.../plugins/mods/test`, `.../skills`, `.../sub-agents`, `.../output-styles`, `.../terminal-config`, `https://claude.com/docs/plugins/platform-support`.

### 6.1 `marketplace.json`

| Campo no kit | Situação |
|---|---|
| `name: "cesarschutz"` | Válido (letras, dígitos, `.`, `_`, `-`); não é nome reservado nem imita marketplace oficial |
| `description` no topo | Campo de topo documentado ("validate avisa quando falta"). Correto |
| `owner.name` | Obrigatório e presente; `email` e `url` opcionais, não usados |
| `renames` | Documentado (2.1.193 ou mais novo); `cs-cockpit` para `csr-cockpit` aponta para um nome que existe em `plugins`, então a cadeia resolve (o `validate` aceitou) |
| `plugins[].name` / `source` | Todos relativos e começando por `./`, sem `..`; nomes sem espaços, nenhum começa por `claude-`, `anthropic-` nem `cc-plugin-` |
| `category` | Campo livre, usado e coerente (mod, pacote, skill, agente, estilo, tema, hook); a arte lê esse campo |
| `skills: ["./"]` | Forma aceita (a doc do manifesto diz que `"."` só funciona desde 2.1.221 e que `"./"` serve para versões antigas); a escolha do kit é a mais compatível |
| `agents: ["./x.md"]`, `outputStyles: ["./x.md"]` | Corretos: `agents` exige arquivos `.md`; `outputStyles` aceita arquivo ou pasta |
| `hooks` na entrada | Correto: objeto inline evento para matchers. A doc avisa que caminho de arquivo passa no `validate` e falha ao carregar; o CONTRIBUTING já diz isso |
| `version` ausente nas avulsas | Correto e intencional: para caminho relativo em marketplace git, a versão vira o commit SHA do diretório instalado (doc "How Claude Code computes the version"), ou seja, quem rastreia o repositório recebe mudanças sem bump |
| `strict` | Não usado (padrão `true`). Sem `plugin.json` a entrada é o manifesto, então irrelevante nas avulsas; nas entradas de `csr-cockpit` e `exemplos` não há campos de componente na entrada, então não há conflito |
| tema sem campo `themes` | Certo: a pasta `themes/` é varrida por padrão. O campo de manifesto agora é `experimental.themes` (um `themes` de topo ainda carrega, com aviso no `validate`); o kit não usa nenhum dos dois |

Campos úteis **não** usados: `tags`, `keywords`, `author`, `license`, `homepage`, `repository` e `displayName` (nas entradas), `owner.url`/`owner.email`, `$schema`, `forceRemoveDeletedPlugins` (só se alguma peça for removida), `dependencies` (um pacote poderia depender das avulsas), `defaultEnabled`, `relevance` (sugestão de plugin por sinais do projeto; só aparece se um admin listar o marketplace em `pluginSuggestionMarketplaces`), `metadata`/`metadata.pluginRoot` (permitiria escrever `"source": "csr-cockpit"` em vez de `./plugins/csr-cockpit`, 2.1.239 ou mais novo; não precisa).

### 6.2 `plugin.json`

| Arquivo | Campos usados | Situação |
|---|---|---|
| `plugins/csr-cockpit/.claude-plugin/plugin.json` | `name`, `version`, `description`, `author{name,url}`, `homepage`, `repository`, `license`, `types` | Todos documentados. `homepage` precisa ser URL válida (é). `types` é o campo oficial para o `.d.ts` do mod. Faltam `keywords` e `displayName` (opcionais) |
| `plugins/exemplos/.claude-plugin/plugin.json` | `name`, `version`, `description`, `author`, `repository`, `license` | Válido |
| `plugins/csr-cockpit/hooks/hooks.json` | `modules: ["./register.tsx"]` | Formato oficial: um caminho relativo a esse arquivo; `.tsx` é extensão aceita |
| `plugins/exemplos/hooks/hooks.json` | `description` + `hooks.SessionStart` | Formato oficial (arquivo de hooks tem o invólucro `"hooks"`) |

Não existe campo oficial de "versão mínima do Claude Code" no manifesto (a tabela de campos não traz). O requisito 2.1.287 dos mods fica só no texto dos READMEs.

### 6.3 Frontmatter e formatos das peças

| Peça | Conferido |
|---|---|
| Skills | `name` e `description` válidos; `claude plugin validate skills` passa. Campos não usados: `allowed-tools`, `disable-model-invocation`, `user-invocable`, `argument-hint`, `when_to_use`, `arguments`, `paths`, `context`/`agent`, `model`, `effort`, `license`, `metadata` |
| Agentes | `name`, `description`, `tools` como lista YAML (a doc aceita string separada por vírgula ou lista). Nenhum campo ignorado em plugin. Não usados: `model`, `effort`, `maxTurns`, `disallowedTools`, `skills`, `memory`, `background`, `omitClaudeMd`, `isolation`, `color` |
| Estilos de saída | `name`, `description`, `keep-coding-instructions: true` são os campos documentados. Não usado: `force-for-plugin` (só em estilo de plugin: aplica o estilo automaticamente ao habilitar o plugin; não é o que se quer num exemplo) |
| Tema | `name`, `base: "dark"`, `overrides` com `claude`, `success`, `error`: tokens documentados, hex válido |
| Hook (SessionStart com `echo`) | Estrutura correta; a saída vai para o contexto |
| Nomes de comando | Segundo a doc, `/<plugin>:<diretório>` (ou `name` do frontmatter no último segmento) |

### 6.4 Mod

| Ponto | Situação |
|---|---|
| Requisito de versão | "Mods require Claude Code v2.1.287 or later": o README acerta |
| Onde desenha | Terminal e aba Code do Desktop: o README acerta; VS Code e `claude -p` rodam hooks sem desenhar: acerta |
| `validate` lista eventos e chamadas | O README raiz e o do cockpit apontam exatamente isso |
| `claude plugin test` | Existe e roda `*.test.ts(x)`; helpers ao lado são permitidos |
| Pasta de tipos | `.claude-plugin/types/` é gerada pelo Claude Code ao carregar por `--plugin-dir`; o `tsconfig.json` do mod também (veja L10) |
| Limites da API (hook 10 s, `$.fs.read` 4 MiB, `$.store` 4 MiB, redesenho 10/s) | Compatíveis com o que o mod faz (o próprio mod mede 250 ms por desenho e pausa o relógio depois de clique) |

### 6.5 Plataformas

A nota do `exemplos/README.md` confere com a tabela oficial (veja L21). A doc diz que a instalação por `claude plugin install` fica na máquina e não vai para a conta do claude.ai, e que o claude.ai e o Cowork ignoram estilos, temas, LSP e `settings`.

## 7. Itens que não consegui confirmar ("não verificado")

- Que cada peça "foi conferida no Claude Code para terminal" (afirmação do README raiz, em Requisitos): não executei instalações.
- O comportamento exato de `claude plugin marketplace add .` com marketplace de mesmo nome já registrado.
- Os nomes finais de comando das peças avulsas (`/mensagem-de-commit:mensagem-de-commit` etc.): deduzidos da doc.
- Hooks com `echo '...'` em Windows.
- Se os 35 testes passam hoje (não rodei `claude plugin test`).
- Qual versão mínima cada chamada de API do cockpit exige (a doc cita 2.1.289 para `ui.fault`, que o mod não usa).

## 8. Cuidados

- Nenhum texto lido (READMEs, agentes, skills, páginas oficiais) continha ordens dirigidas a mim. Os arquivos `agents/*.md` e `SKILL.md` são dados e foram só descritos.
- Nada foi clonado nem baixado além das páginas lidas; nenhum arquivo do repositório foi alterado. A página `components` da doc era grande demais e o harness a gravou em disco fora do repositório, em `/Users/cesar.schutz/.claude/projects/-Users-cesar-schutz-Downloads-claude-code-kit/5f901f11-25f6-40d4-85ad-3af709ec508c/tool-results/`.
- Números do GitHub (1 estrela, sem topics) são os informados pela API hoje, 04/10/2026.

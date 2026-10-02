# exemplos

Um exemplo de cada peça que um plugin do Claude Code pode levar. Serve de modelo: copie a pasta,
troque o nome no `plugin.json` e apague o que não for usar.

| Pasta | Peça | O que é | Como usar depois de instalar |
|---|---|---|---|
| `skills/explicar-mudancas/` | Skill | Instruções em Markdown que o Claude segue | `/exemplos:explicar-mudancas`, ou pedir "explica o que mudou" |
| `agents/revisor.md` | Agente | Um subagente com papel e ferramentas próprias | Pedir "use o agente exemplos:revisor neste arquivo" |
| `hooks/hooks.json` | Hook | Um comando que o Claude Code roda num evento | Roda sozinho no início da sessão |
| `output-styles/direto.md` | Estilo de saída | Um jeito de responder, escolhido pela pessoa | Escolher em `/output-style` |

O hook de exemplo só escreve uma linha de contexto no início da sessão. Para tirar, apague a
pasta `hooks/`.

## O que mais um plugin pode levar

- **Mod** (`hooks/hooks.json` com `modules`): código que roda dentro do Claude Code, como o
  `cs-cockpit` deste repositório.
- **Servidor MCP** (`.mcp.json`): ferramentas externas para o Claude.
- **Comandos** (`commands/*.md`): a forma antiga das skills. Em plugin novo, use `skills/`.

No chat do claude.ai só as skills carregam; agentes e hooks carregam no Cowork e no Claude Code;
estilo de saída e mod, só no Claude Code.

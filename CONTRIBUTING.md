# Como acrescentar um item

Todo item do kit é uma entrada em `.claude-plugin/marketplace.json`. O `name` da entrada é o que
a pessoa digita para instalar e é permanente: quem já instalou fica preso a ele.

## Peça avulsa

Crie o arquivo e acrescente a entrada em `plugins`. A entrada faz o papel do manifesto, então não
é preciso um `plugin.json`.

**Skill** — `skills/<nome>/SKILL.md`

```json
{ "name": "<nome>", "source": "./skills/<nome>", "description": "...", "skills": ["./"] }
```

**Agente** — `agents/<nome>.md`

```json
{ "name": "<nome>", "source": "./agents", "description": "...", "agents": ["./<nome>.md"] }
```

**Estilo de saída** — `output-styles/<nome>.md`

```json
{ "name": "<nome>", "source": "./output-styles", "description": "...", "outputStyles": ["./<nome>.md"] }
```

**Tema** — `themes/<nome>/themes/<nome>.json` (a pasta `themes` de dentro é obrigatória)

```json
{ "name": "<nome>", "source": "./themes/<nome>", "description": "..." }
```

**Hook** — uma pasta `hooks/<nome>/` e o hook escrito na própria entrada, no campo `hooks`. Numa
entrada sem `plugin.json`, o Claude Code só aceita o hook escrito ali; um caminho de arquivo não
funciona. Veja `responder-em-portugues` no catálogo.

## Plugin completo

Para várias peças que andam juntas, ou para um mod: `plugins/<nome>/` com
`.claude-plugin/plugin.json` e as peças nas pastas padrão (`skills/`, `agents/`,
`hooks/hooks.json`, `output-styles/`). O plugin `exemplos` tem uma de cada.

```json
{ "name": "<nome>", "source": "./plugins/<nome>", "description": "..." }
```

## Regras

- **Nomes** em minúsculas, com hífen, sem começar por `claude-`.
- **Uma peça por pasta de origem.** A pasta para a qual o `source` aponta não pode ter subpastas
  chamadas `skills/` ou `agents/` com outras peças: o Claude Code carrega essas duas sozinho, e o
  item passaria a trazer tudo o que estiver nelas.
- **Versão.** Plugin completo: suba o `version` do `plugin.json` a cada publicação, senão quem já
  instalou não recebe a mudança. Peça avulsa: não tem número; a versão é o commit.
- **Descrição** que diga o que o item faz e, numa skill ou agente, quando o Claude deve usá-lo.
- **Hook e mod** executam na máquina de quem instala. Diga no README do item o que ele roda.

## Conferir antes de enviar

```bash
claude plugin validate .
```

```bash
claude plugin validate ./plugins/<nome> --strict
```

Para um mod:

```bash
claude plugin test ./plugins/<nome>
```

E instale a partir da pasta local, para ver o item carregar:

```bash
claude plugin marketplace add .
```

```bash
claude plugin install <nome>@cesarschutz
```

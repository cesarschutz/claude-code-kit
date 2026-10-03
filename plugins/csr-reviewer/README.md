# csr-reviewer

Um segundo par de olhos para o Claude Code. Depois que o agente principal conclui um turno, o mod abre um **fork somente-leitura da própria conversa**, pede uma revisão curta e estruturada e mostra o resultado num painel lateral. A revisão não entra no transcript principal e não usa ferramentas.

## Instalar

Se o marketplace ainda não estiver cadastrado:

```bash
claude plugin marketplace add cesarschutz/claude-code-kit
```

Depois:

```bash
claude plugin install csr-reviewer@cesarschutz
```

Mods usam function hooks. Em versões em que a flag ainda é necessária:

```bash
export CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1
```

ou em `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  }
}
```

Abra o Claude Code normalmente e use:

```text
/reviewer
```

## Como funciona

1. O mod observa `turn.complete` apenas do agente principal.
2. Depois que o turno terminou, chama `$.model.fork` com um prompt de revisão.
3. O fork vê o snapshot da conversa já concluída, não recebe ferramentas e não continua a tarefa.
4. O revisor devolve JSON com resumo e achados.
5. O mod interpreta esse JSON e desenha os cards via `ui.open` + `ui.render`.
6. Achados `critical` e `warning` podem abrir o painel automaticamente.

O fork compartilha o contexto/prompt cache da sessão. Ele **usa tokens adicionais**, mas o painel mostra por revisão quanto veio do cache, quanto foi entrada nova e quanto saiu do modelo.

## Comandos

```text
/reviewer          abre ou fecha o painel
/reviewer on       liga revisão automática
/reviewer off      pausa revisão automática
/reviewer run      roda uma revisão manual
/reviewer clear    limpa o histórico visual
```

## O que procura

- segurança;
- regressões arquiteturais e acoplamento acidental;
- mudanças quebrando API, schema ou configuração;
- testes e migrations ausentes;
- premissas incorretas;
- riscos de performance ou confiabilidade;
- trabalho incompleto em relação ao pedido do usuário.

## Opções

Os valores padrão são:

```json
{
  "autoReview": true,
  "openOnFinding": true,
  "maxReviews": 8,
  "maxFindings": 6
}
```

## Limites desta primeira versão

- `$.model.fork` usa o modelo da própria sessão; se a sessão estiver em um modelo caro, a revisão também terá custo compatível.
- O revisor lê o transcript; ele não abre arquivos nem executa comandos por conta própria.
- A API de Mods/function hooks ainda é recente e pode mudar entre versões do Claude Code.

## Desenvolvimento local

A partir da raiz do `claude-code-kit`:

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir ./plugins/csr-reviewer
```

Valide antes de publicar:

```bash
claude plugin validate ./plugins/csr-reviewer
```

Os Mods oficiais usam a mesma estrutura: `.claude-plugin/plugin.json`, `hooks/hooks.json` e um módulo TypeScript que exporta `register`.

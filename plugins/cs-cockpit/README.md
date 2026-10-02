# cs-cockpit

Um painel ao lado da conversa do Claude Code, com os instrumentos da sessão: o que os subagentes
estão fazendo, o que foi editado, quanto do contexto já foi usado e quais arquivos e comandos
passaram por ali. Mais uma status line sempre visível.

O cs-cockpit só observa. Nenhum dos seus hooks bloqueia, altera ou segura uma chamada de
ferramenta: todos repassam a chamada e devolvem o resultado como veio.

```
1 Agentes   2 Diffs   3 Contexto   4 Arquivos

67% do contexto   134,4k / 200k
████████████████████████████░░░░░░░░░░░░░░
Últimos 12 turnos
▂▃▃▄▅▅▆  ▲ +18,2k no último turno
Custo da sessão US$ 1,84   Último turno US$ 0,21
Limite de uso (5 h) 38% · renova em 2h10
```

```
agentes 2 rodando · 3 concluídos · ctx 67% · US$ 1,84
```

## Requisitos

- Claude Code 2.1.287 ou mais novo (`claude --version`). O app Desktop traz a própria cópia do
  Claude Code: atualize o app também.
- O painel é desenhado no terminal e na aba Code do app Desktop. Na extensão do VS Code e em
  `claude -p`, os dados são registrados, mas nada é desenhado.

## Instalar

```bash
claude plugin marketplace add cesarschutz/claude-code-kit
```

```bash
claude plugin install cs-cockpit@cesarschutz
```

## Usar

| Tecla ou comando | O que faz |
|---|---|
| `/cockpit` | Abre e fecha o painel |
| `Esc` | Fecha o painel |
| `1` `2` `3` `4` | Trocam de aba, com o painel em foco |
| `p` `n` | Diff anterior e próximo (aba Diffs) |
| `t` | Turno anterior (aba Diffs) |

Os dados são registrados desde o início da sessão, com o painel aberto ou fechado. Se o painel
não tiver lugar ao lado da conversa, aparece uma versão compacta acima do prompt, com as mesmas
abas.

## As abas

**1 Agentes.** Subagentes rodando e concluídos, com contagem. Para cada um: tipo, modelo, tempo
decorrido e a atividade atual (última ferramenta e argumento). Nos concluídos, a duração e a
primeira linha do resultado.

**2 Diffs.** Cada Edit e Write do loop principal, agrupado por turno (os últimos 10). Um diff por
vez, com número de linha, caminho do arquivo e contagem de linhas que entraram e saíram. No Write
sobre um arquivo que já existia, o conteúdo antigo é lido antes da escrita, para o diff ser o real.

**3 Contexto.** Percentual usado, tokens sobre a janela, gráfico dos últimos 12 turnos e quanto o
último turno acrescentou. Custo da sessão e do último turno, e o limite de uso com o horário de
renovação. O botão "Calcular detalhamento" pede a separação por categoria só quando é apertado,
porque ela faz uma contagem de tokens extra.

**4 Arquivos.** Arquivos lidos (caminho, quantas vezes e por quem) e comandos Bash (status, exit
code e duração), com um campo de filtro.

## Limites conhecidos

- **Exit code do Bash.** O resultado da ferramenta não traz o código como campo. Em falha, ele é
  lido do texto de erro; em sucesso, a linha mostra só a marca de concluído e a duração.
- **Comando em segundo plano.** A chamada volta na hora; o fim real não chega ao mod. A linha fica
  como "em segundo plano".
- **Versão compacta.** `Esc` não a fecha; use `/cockpit` ou o botão Fechar.
- **Tamanho.** Guarda 100 agentes, 300 arquivos, 100 comandos, 10 turnos de 60 edições e 400
  linhas por diff.
- **API em evolução.** A API de mods pode mudar entre versões do Claude Code. Este mod foi escrito
  e testado na 2.1.283, ainda em acesso antecipado, no terminal. No app Desktop, o desenho do
  painel ainda não foi conferido.

## Privacidade

O cs-cockpit não faz chamada de rede nem grava arquivo. O que ele registra fica no estado da
sessão, na memória do Claude Code. Para conferir o que o mod chama antes de instalar, clone o
repositório e rode:

```bash
claude plugin validate ./plugins/cs-cockpit
```

## Desenvolver

```bash
claude --plugin-dir ./plugins/cs-cockpit
```

```bash
claude plugin validate ./plugins/cs-cockpit --strict
```

```bash
claude plugin test ./plugins/cs-cockpit
```

Os testes rodam cada aba nas superfícies `terminal` e `desktop`, além da status line. A pasta
`.claude-plugin/types/` é escrita pelo Claude Code ao carregar o mod e não vai para o git.

```
.claude-plugin/plugin.json   manifesto
hooks/hooks.json             aponta o módulo
hooks/register.tsx           hooks, comando /cockpit e ações dos botões
hooks/dados.ts               transformações do estado
hooks/diff.ts                diff por linhas
hooks/formato.ts             números, durações e barras em pt-BR
hooks/telas.tsx              desenho das quatro abas
types/index.d.ts             contrato do estado
tests/                       testes
```

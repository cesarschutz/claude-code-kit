# csr-cockpit

Um painel ao lado da conversa do Claude Code, com os instrumentos da sessão: o que os subagentes
estão fazendo, o que foi editado, quanto do contexto já foi usado e quais arquivos e comandos
passaram por ali. Mais uma linha de resumo acima do prompt.

O csr-cockpit só observa. Nenhum dos seus hooks bloqueia, altera ou segura uma chamada de
ferramenta: todos repassam a chamada e devolvem o resultado como veio.

```
 CSR  Cockpit
1 Agentes   2 Diffs   3 Contexto   4 Arquivos   5 Turnos
────────────────────────────────────────────────────────

67% do contexto   134,4k / 200k
████████████████████████████░░░░░░░░░░░░░░

Últimos 12 turnos
▂▃▃▄▅▅▆  ▲ +18,2k no último turno

Custo
Sessão        US$ 1,84
Último turno  US$ 0,21

Limite de uso
5 h      38%  █████████░░░░░░░░░░░░░░░  renova em 2h10
7 dias   60%  ██████████████░░░░░░░░░░  renova em 2d
```

```
 CSR  contexto 67% · US$ 1,84 · limite 5h 38%, 7d 60% · agentes 2 rodando, 3 concluídos
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
claude plugin install csr-cockpit@cesarschutz
```

## Usar

| Tecla ou comando | O que faz |
|---|---|
| `/cockpit` | Abre e fecha o painel |
| `Esc` | Fecha o painel |
| `1` a `5` | Trocam de aba, com o painel em foco |
| `p` `n` | Diff anterior e próximo (aba Diffs) |
| `t` | Turno anterior (aba Diffs) |
| `▸ nome` | Abre o detalhe de um agente, de um comando ou de um turno (clique no nome, ou Tab até ele e Enter) |
| `v` | Volta do detalhe para a lista |
| `m` | No detalhe de um agente, relê as mensagens dele |

Os dados são registrados desde o início da sessão, com o painel aberto ou fechado. Se o painel
não tiver lugar ao lado da conversa, aparece uma versão compacta acima do prompt, com as mesmas
abas.

## As abas

**1 Agentes.** Subagentes rodando e concluídos, com contagem. Para cada um: tipo, modelo, tempo
decorrido, número de chamadas, a tarefa que recebeu e a atividade atual (última ferramenta e
argumento). Nos concluídos, a duração e a primeira linha do resultado.

**2 Diffs.** Cada Edit e Write do loop principal, agrupado por turno (os últimos 10). Um diff por
vez, com número de linha, caminho do arquivo e contagem de linhas que entraram e saíram. No Write
sobre um arquivo que já existia, o conteúdo antigo é lido antes da escrita, para o diff ser o real.

**3 Contexto.** Percentual usado, tokens sobre a janela, gráfico dos últimos 12 turnos e quanto o
último turno acrescentou. Custo da sessão e do último turno, e o limite de uso com o horário de
renovação. Abaixo, o detalhamento por categoria (sistema, ferramentas, memória, conversa): uma
estimativa local, atualizada a cada turno, sem requisição extra. O botão "Contagem exata" troca a
estimativa pela contagem de verdade, que faz uma requisição por ferramenta e por arquivo de
memória; por isso só acontece quando é apertado.

**4 Arquivos.** Arquivos lidos (caminho, quantas vezes e por quem) e comandos Bash (status, exit
code e duração), com um campo de filtro.

**5 Turnos.** Um registro por turno da conversa, do mais recente ao mais antigo: o começo do
pedido, a duração, quanto o turno somou ao contexto, quanto custou, quantas ferramentas foram
chamadas, quantas falharam e quantas edições houve. O turno em curso aparece em andamento.

## Detalhes

Nas abas Agentes, Arquivos e Turnos, o nome no começo de cada linha (`▸ Explore`, `▸ Turno 3`) é
clicável e abre o detalhe do item no lugar da lista. Com o mouse sobre a linha, o nome fica
sublinhado.

- **Agente.** O pedido que ele recebeu, as últimas 40 chamadas de ferramenta com status e
  duração, o que ele escreveu ao longo do trabalho (lido da transcrição dele ao abrir e no botão
  "Reler mensagens"), a resposta final e os tokens de entrada e de saída.
- **Comando.** O comando inteiro, a descrição, o fim da saída e o erro.
- **Turno.** O pedido e a resposta inteiros, quantas vezes cada ferramenta foi chamada e, quando
  houve agentes em segundo plano, o que o Claude respondeu depois do retorno de cada um.

### Turnos agrupados

Quando um agente em segundo plano termina, o Claude Code abre um turno sozinho para tratar o
retorno. A aba Turnos junta esses turnos automáticos ao pedido que os gerou: um pedido seu é um
turno na lista, com a duração, o custo e as ferramentas de tudo o que ele desencadeou. As edições
feitas nesses retornos entram nos diffs do mesmo turno.

## Limites conhecidos

- **Exit code do Bash.** O resultado da ferramenta não traz o código como campo. Em falha, ele é
  lido do texto de erro; em sucesso, a linha mostra só a marca de concluído e a duração.
- **Comando em segundo plano.** A chamada volta na hora; o fim real não chega ao mod. A linha fica
  como "em segundo plano".
- **Versão compacta.** `Esc` não a fecha; use `/cockpit` ou o botão Fechar.
- **Tamanho.** Guarda 100 agentes, 300 arquivos, 100 comandos, 60 turnos, 10 turnos de diffs com
  60 edições cada e 400 linhas por diff.
- **Linha de resumo.** Fica na faixa acima do prompt, em azul, e só aparece quando há leitura
  (depois da primeira resposta do modelo). O mod não usa a status line do Claude Code, que sai
  sempre em amarelo com um ícone de aviso.
- **`/cockpit` não escreve nada na conversa.** O texto de saída de um comando entra no que o
  modelo lê; abrir e fechar o painel não devolvem texto.
- **Custo por agente.** O Claude Code informa os tokens de cada subagente, não o valor em
  dólar. O detalhe mostra os tokens.
- **Mensagens do agente.** Não são ao vivo: são relidas ao abrir o detalhe e no botão. O
  raciocínio interno do agente não vem na transcrição; só o texto que ele escreveu.
- **API em evolução.** A API de mods pode mudar entre versões do Claude Code. Este mod foi escrito
  e testado na 2.1.283, ainda em acesso antecipado, no terminal. No app Desktop, o desenho do
  painel ainda não foi conferido.

## Privacidade

O csr-cockpit não faz chamada de rede nem grava arquivo. O que ele registra fica no estado da
sessão, na memória do Claude Code, e some com ela: caminhos de arquivos, comandos e o fim da saída
deles, diffs, o pedido e a resposta de cada turno, e o pedido, as chamadas e o resultado de cada
subagente. Para conferir o que o mod chama antes de instalar, clone o
repositório e rode:

```bash
claude plugin validate ./plugins/csr-cockpit
```

## Desenvolver

```bash
claude --plugin-dir ./plugins/csr-cockpit
```

```bash
claude plugin validate ./plugins/csr-cockpit --strict
```

```bash
claude plugin test ./plugins/csr-cockpit
```

Os testes rodam cada aba e cada detalhe nas superfícies `terminal` e `desktop`, além da linha de
resumo. A pasta
`.claude-plugin/types/` é escrita pelo Claude Code ao carregar o mod e não vai para o git.

```
.claude-plugin/plugin.json   manifesto
hooks/hooks.json             aponta o módulo
hooks/register.tsx           hooks, comando /cockpit e ações dos botões
hooks/dados.ts               transformações do estado
hooks/diff.ts                diff por linhas
hooks/formato.ts             números, durações e barras em pt-BR
hooks/telas.tsx              desenho das cinco abas
hooks/fichas.tsx             detalhe de agente, comando e turno
types/index.d.ts             contrato do estado
tests/                       testes
```

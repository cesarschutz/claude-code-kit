# CSR Lens

[![versão](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fcesarschutz%2Fclaude-code-kit%2Fmain%2Fplugins%2Fcsr-lens%2F.claude-plugin%2Fplugin.json&query=%24.version&label=vers%C3%A3o&color=d77757&labelColor=262626&style=flat-square)](.claude-plugin/plugin.json)
[![Claude Code 2.1.287 ou mais novo](https://img.shields.io/badge/Claude%20Code-%E2%89%A5%202.1.287-b1b9f9?labelColor=262626&style=flat-square&logo=claude&logoColor=d77757)](https://code.claude.com/docs)
[![licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-6e6e6e?labelColor=262626&style=flat-square)](../../LICENSE)

Um painel ao lado da conversa do Claude Code com os instrumentos da sessão: um resumo de tudo
numa tela, quem está trabalhando (os subagentes, quem chamou quem, o que eles conversam e quantas
vezes cada um rodou), o que aconteceu em cada pedido, o que foi editado, onde o Claude está
mexendo agora, quanto do contexto e do dinheiro já foi e o que está instalado. Mais uma linha de
resumo acima do prompt. O plugin se chama `csr-lens` e abre com `/lens`.

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/pilulas-escuro.svg"><img src="../../docs/arte/telas/pilulas-claro.svg" width="860" alt="A linha de resumo do CSR Lens no app Desktop: pílulas com a marca CSR, o cérebro da conversa principal trabalhando, o robô dos agentes em paralelo, o repositório e o ramo do git com os arquivos alterados, o contexto, o custo, os limites de uso, o modelo com o esforço e o cache"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/visao-geral-escuro.svg"><img src="../../docs/arte/telas/visao-geral-claro.svg" width="760" alt="A Visão geral do CSR Lens no app Desktop: os indicadores de contexto, custo, limite de uso, agentes, turnos e diffs; o que está rodando agora; os agentes instalados; o grafo de quem chamou quem; o último turno com os agentes que ele chamou; e as últimas edições"></picture>

> [!NOTE]
> O CSR Lens só observa. Os hooks dele repassam o que recebem e devolvem o resultado como veio:
> não bloqueiam, não alteram e não seguram nenhuma chamada de ferramenta nem resposta do modelo.
> Ele também não chama o modelo nem acrescenta nada à conversa, então não gasta tokens por conta
> própria. As exceções são duas, e só quando você aperta o botão: **Parar agente**, que manda um
> recado ao agente e nega as ferramentas dele até ele terminar (veja [Parar um
> agente](#parar-um-agente)), e **Contagem exata**, na aba Contexto, que faz uma requisição por
> ferramenta e por arquivo de memória.

As telas desta página saem do próprio mod: o script [`scripts/telas`](../../scripts/telas) roda o
código do CSR Lens com uma sessão encenada num projeto de exemplo e monta o que cada aba desenha,
no visual do app Desktop, numa versão clara e numa escura (o GitHub mostra a do tema que você
usa). Os
números são inventados; o desenho é o do mod. As bolinhas numeradas não fazem parte do painel:
elas apontam o que a lista embaixo de cada tela explica.

No blog, dois posts contam o Lens na prática:
[o painel para quem está começando](https://blog.cesarschutz.com.br/posts/claude-code-csr-lens/)
(instalar, o contexto, o custo e o que mudou nos arquivos) e
[os agentes em detalhe](https://blog.cesarschutz.com.br/posts/claude-code-csr-lens-agentes/)
(quem chamou quem, recados, rodadas e os limites).

- [Requisitos](#requisitos) · [Instalar e atualizar](#instalar-e-atualizar) · [Usar](#usar) ·
  [A linha de resumo](#a-linha-de-resumo) · [O caminho e o Voltar](#o-caminho-e-o-voltar)
- As abas: [Visão geral](#1-visão-geral) · [Agentes](#2-agentes) · [Turnos](#3-turnos) ·
  [Diffs](#4-diffs) · [Árvore](#5-árvore) · [Contexto](#6-contexto) · [Inventário](#7-inventário)
- Os agentes em detalhe: [O detalhe de um agente](#o-detalhe-de-um-agente) ·
  [As rodadas de um agente](#as-rodadas-de-um-agente) · [Parar um agente](#parar-um-agente) ·
  [Os agentes de um workflow](#os-agentes-de-um-workflow)
- [No terminal](#no-terminal) · [O custo de cada agente](#o-custo-de-cada-agente) ·
  [Quando algo dá errado](#quando-algo-dá-errado) · [Limites](#limites-conhecidos) ·
  [Privacidade](#privacidade) · [Desenvolver](#desenvolver)

## Requisitos

- Claude Code 2.1.287 ou mais novo (`claude --version`). O app Desktop traz a própria cópia do
  Claude Code: atualize o app também.
- O painel é desenhado no terminal e na aba Code do app Desktop. Na extensão do VS Code e em
  `claude -p`, os dados são registrados, mas nada é desenhado.

## Instalar e atualizar

```bash
claude plugin marketplace add cesarschutz/claude-code-kit
```

```bash
claude plugin install csr-lens@cesarschutz
```

Num marketplace de terceiros, a atualização automática vem desligada. Para pegar a versão nova:

```bash
claude plugin marketplace update cesarschutz
```

```bash
claude plugin update csr-lens@cesarschutz
```

A sessão que já estava aberta segue com a versão anterior até um `/reload-plugins` ou até abrir uma
sessão nova. Quem tinha o plugin com o nome antigo (`csr-cockpit` ou `cs-cockpit`) é levado ao
`csr-lens` pelo próprio marketplace.

### A opção do plugin

O valor em reais do custo (aba Contexto) usa uma cotação do dólar que você escolhe: o Lens não
busca nada na internet. Ela vem em R$ 5,22 (a do dólar comercial em 02/10/2026) e muda no
`/config`, na linha **Cotação do dólar em reais** do csr-lens. Com 0, o valor em reais some.

## Usar

| Tecla ou comando | O que faz |
|---|---|
| `/lens` | Abre e fecha o painel; abre sempre na Visão geral |
| `/lens <aba>` | Abre o painel numa aba, pelo nome (`visao`, `agentes`, `turnos`, `diffs`, `arvore`, `contexto`, `inventario`) ou pela posição (`1` a `7`); com ele aberto, só troca de aba |
| `/inventario` | Abre o painel na aba Inventário |
| <kbd>Esc</kbd> | Fecha o painel |
| <kbd>1</kbd> a <kbd>7</kbd> | Trocam de aba, pela posição na barra, com o painel em foco |
| Nome na lista | Abre o detalhe de um agente, de uma rodada, de um comando ou de um turno (clique, ou <kbd>Tab</kbd> até ele e <kbd>Enter</kbd>) |
| <kbd>v</kbd> ou **Voltar** | Sobe um nível no caminho: do detalhe para onde ele foi aberto |
| `▾` num título | Fecha a seção (fica só o título); `▸` abre de novo. A seção continua fechada até você abrir |

Os dados são registrados desde o início da sessão, com o painel aberto ou fechado. Se a sessão
fechar e for retomada, o Lens recupera o que tinha juntado. Se o painel não tiver lugar ao lado da
conversa, aparece uma versão compacta acima do prompt, com as mesmas abas.

## A linha de resumo

No **app Desktop**, acima do prompt fica uma fileira de pílulas arredondadas, claras no tema claro e
escuras no escuro. O que está vivo vem primeiro:

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/pilulas-estreitas-escuro.svg"><img src="../../docs/arte/telas/pilulas-estreitas-claro.svg" width="680" alt="A linha de resumo do CSR Lens no app Desktop, em duas fileiras de pílulas: a marca, o cérebro da conversa principal, o robô dos agentes em paralelo, o repositório, o contexto, o custo, os limites de uso, o modelo e o cache"></picture>

| Pílula | O que mostra |
|---|---|
| `✦ CSR` | A marca do Lens, no azul do Grêmio |
| Cérebro pulsando | A conversa principal está trabalhando neste turno (some quando ela para) |
| Robô `2 em paralelo` | Subagentes rodando, com a luz da antena piscando (só enquanto há algum) |
| `⑂ proj │ main │ 3 alterados` | Repositório, ramo do git e quantos arquivos estão sem commit. **Clicar abre a aba Árvore** |
| `◔ 71% │ 141,2k +8,3k` | Contexto: a pizza, o percentual, os tokens e o que o último turno somou. **Clicar abre a aba Contexto** |
| `$ US$ 2,21 +0,37` | Custo da sessão e do último turno |
| `◠ 5h 38% │ ⏱ 2h09` e `▦ 7d 21% │ ⏱ 6d` | Cada limite de uso e quando renova |
| `✦ Opus 5.5 │ high` | Modelo e esforço da última resposta da conversa principal |
| `⚡ cache 99%` | Quanto da entrada da última resposta veio do cache: quanto mais, mais barato o turno |

A cor do contexto segue a distância até a compactação automática (o Claude Code compacta sozinho
perto de 97% numa janela de 1M, de 83% numa de 200k): verde longe, âmbar a 15 pontos, vermelha a 5.
Só perto aparece o aviso, com quanto falta: `compacta em 97% · faltam 52k`. Sem largura, as pílulas
descem para outra fileira. No **terminal**, a linha é uma fileira de selos de texto (veja [No
terminal](#no-terminal)). O "último turno" conta do seu último pedido até agora, com os retornos de
agentes em segundo plano incluídos.

## O caminho e o Voltar

<a href="#1-visão-geral"><img src="../../docs/arte/aba-visao-geral.svg" height="28" alt="1 Visão geral"></a>
<a href="#2-agentes"><img src="../../docs/arte/aba-agentes.svg" height="28" alt="2 Agentes"></a>
<a href="#3-turnos"><img src="../../docs/arte/aba-turnos.svg" height="28" alt="3 Turnos"></a>
<a href="#4-diffs"><img src="../../docs/arte/aba-diffs.svg" height="28" alt="4 Diffs"></a>
<a href="#5-árvore"><img src="../../docs/arte/aba-arvore.svg" height="28" alt="5 Árvore"></a>
<a href="#6-contexto"><img src="../../docs/arte/aba-contexto.svg" height="28" alt="6 Contexto"></a>
<a href="#7-inventário"><img src="../../docs/arte/aba-inventario.svg" height="28" alt="7 Inventário"></a>

Cada aba tem um ícone e uma cor, e tudo o que é dela usa essa cor: o selo da aba aberta, o hover das
outras, o caminho, os títulos das seções. No painel estreito (menos de 84 colunas), as abas fechadas
mostram só o ícone. Ao lado da marca, no alto, um resumo da sessão (contexto, turnos, agentes
rodando, custo); na Visão geral ele sai, porque os indicadores dela dizem o mesmo.

Logo abaixo das abas, numa linha só, ficam o **Voltar** e o **caminho** de onde você está: a aba e,
num detalhe, cada nível pelo qual você chegou até ele, por exemplo
`◉ Visão geral › Turno 2 › Revisar o formato.ts › Rodada 2` ou
`◈ Agentes › Coordenar a leitura › Rodada 1 › Ler os testes`. Cada parte é um botão que leva àquele
nível; a última, na cor da aba, é onde você está. O mesmo agente aberto por caminhos diferentes
mostra coisas diferentes (veja [As rodadas de um agente](#as-rodadas-de-um-agente)): o caminho diz
de onde você veio. O painel rola inteiro: a API do Claude Code não tem como fixar um cabeçalho fora
da rolagem.

As listas trazem o estado à esquerda, como numa lista de CI: azul roda, verde deu certo, vermelho
falhou, âmbar foi negado ou parado. No app Desktop, os gráficos são desenhos em SVG; no terminal,
os mesmos números viram barras de texto.

## As abas

### 1 Visão geral

*O que está acontecendo, numa tela só?*

A aba em que o painel abre. Cada bloco leva à aba que fala dele.

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/visao-geral-escuro.svg"><img src="../../docs/arte/telas/visao-geral-claro.svg" width="720" alt="A Visão geral com as marcas numeradas: os indicadores, o que está rodando agora, os agentes disponíveis, o grafo, o último turno e as últimas edições"></picture>

1. **Os indicadores:** o contexto (com a barra até a compactação), o custo da sessão e o do último
   turno, o limite de uso de 5 horas, os agentes (rodando, concluídos, com
   falha), os turnos e o tamanho dos diffs no git. Clicar num indicador abre a aba dele.
2. **Agora:** se a conversa principal está pensando (e há quanto tempo) ou parada, cada agente
   rodando com o que ele faz neste momento (e, se ele já rodou antes, em que rodada está) e os
   arquivos sendo lidos ou escritos.
3. **Agentes disponíveis:** os agentes instalados, globais, do projeto e de plugin, desde o começo da
   sessão, mesmo os que ninguém chamou (veja a [aba Agentes](#2-agentes)).
4. **Quem chamou quem:** o mesmo grafo da aba Agentes, sem os controles.
5. **O último turno:** o seu pedido, os números dele, os agentes que ele chamou (uma linha por
   agente ou, de um agente que rodou mais de uma vez, uma linha por rodada) e o começo da resposta,
   formatado. Clicar no cartão abre o turno.
6. **As últimas edições:** cada arquivo editado na sessão com a edição mais recente; `▸ diff` abre o
   diff ali mesmo, e o nome leva à aba Diffs.

### 2 Agentes

*Quem está trabalhando agora, em quê, e quem chamou quem?*

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/agentes-escuro.svg"><img src="../../docs/arte/telas/agentes-claro.svg" width="720" alt="A aba Agentes com as marcas numeradas: as contagens, o grafo de quem chamou quem, a linha do tempo com uma linha por rodada e os cartões dos agentes"></picture>

1. **As contagens:** quantos subagentes estão rodando, quantos terminaram e quantos falharam.
2. **Quem chamou quem.** A conversa principal é um cérebro; cada agente, um robozinho, com a tarefa
   e, menor embaixo, o tipo. O grafo tem duas formas e escolhe sozinho: **radial**, com poucos
   agentes todos criados pela conversa principal (o cérebro no centro e os robôs em volta), e
   **árvore**, quando há agentes criando agentes ou muitos agentes (um nível por coluna, quem um
   agente criou mais para fora, do lado dele; num painel estreito, recuada como uma árvore de
   pastas).
   - **O estado é a cor do robô:** azul enquanto roda (ele balança, digita e pisca a antena),
     verde e sorrindo quando termina, vermelho e caído de olhos em X quando falha. Enquanto a
     conversa principal trabalha, o cérebro solta ondas e mostra "pensando…".
   - **A origem é a cor da borda e do tipo:** roxo para os **globais** (`~/.claude/agents`, valem em
     todos os projetos), laranja para os **do projeto** (`.claude/agents`), azul para os **de
     plugin** e cinza para os **embutidos** (Explore, Plan, general-purpose...).
   - **Os fios:** o fio cinza vai de quem criou a quem foi criado, com um selo no meio: `↓ …` a
     tarefa foi e ele trabalha, `↓ ✓` o resultado voltou, `↓ ✕` falhou. Os **recados**
     (SendMessage), entre a conversa principal e um agente ou entre dois agentes, são curvas roxas
     tracejadas com quantos foram (`✉ 2`); ida e volta entre os mesmos dois viram uma curva só, com
     seta nas duas pontas. Um recado que não chegou a ninguém aparece em vermelho (`✕1` no agente
     que mandou). Passando o mouse numa linha, aparece o que passou por ela.
   - **Os controles:** **Ampliar** transforma a aba numa vista só do grafo, com até 40 agentes;
     **Zoom − 150% +** aumenta o desenho inteiro; **Mostrar** Todos, Rodando ou Com falha apaga os
     outros agentes para destacar os que importam agora. O tamanho e o zoom valem para as próximas
     sessões.

   Clicar num agente abre o detalhe dele.
3. **A linha do tempo:** os agentes mais recentes na mesma régua, uma barra do começo ao fim de cada
   um, e no alto a linha da conversa principal (`✦ Principal`), com um trecho laranja para cada vez
   que ela pensou e o total. O título diz quando a sessão começou. Um agente que rodou mais de uma
   vez tem **uma linha por rodada**, cada uma no horário dela. Com o mouse no nome, o agente acende
   no grafo; o clique abre o agente ou a rodada.
4. **Os cartões**, separados em **Rodando** e **Concluídos**. Em destaque, a tarefa do agente e o
   tipo; em etiquetas, a origem (na cor dela), o modelo, o tempo, o contexto do próprio agente, o
   custo (em verde), as chamadas e os tokens. Embaixo, o que ele faz agora (ou como terminou), o
   horário em que começou e terminou, e o começo do pedido e da resposta. Um agente que rodou mais
   de uma vez mostra os totais e uma linha por rodada no lugar do pedido e da resposta.
5. **Ver detalhes** abre o detalhe do agente; clicar em qualquer ponto do cartão faz o mesmo.

No fim da aba (e na Visão geral) ficam os **agentes disponíveis**: um cartão por agente instalado,
global, do projeto ou de plugin, na cor da origem. O que ninguém chamou fica apagado, de borda
tracejada; o chamado acende, com quantas vezes e há quanto tempo, e o clique abre a execução mais
recente. A descrição inteira aparece com o mouse.

O grafo e a linha do tempo seguem as ideias do [Agent Flow](https://github.com/patoles/agent-flow)
e do [View Claude Code](https://www.npmjs.com/package/viewcc).

#### O detalhe de um agente

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/ficha-agente-escuro.svg"><img src="../../docs/arte/telas/ficha-agente-claro.svg" width="720" alt="O detalhe de um agente: o caminho no alto, os quadrinhos com modelo, duração, custo, contexto, chamadas e tokens, as ferramentas, o pedido, as chamadas e a resposta"></picture>

1. **O Voltar e o caminho:** aqui o agente foi aberto de dentro da rodada 1 de quem o criou. Embaixo,
   **Reler mensagens** (<kbd>m</kbd>): o que o agente escreveu vem da transcrição dele, lida ao abrir
   o detalhe e de novo no botão; não é ao vivo. Enquanto ele roda, ao lado fica o **Parar agente**.
2. **O cabeçalho:** o nome, o estado, o tipo, quem o criou, o horário de começo e fim e os
   quadrinhos com o modelo, a duração, o custo, o contexto, as chamadas e os tokens de entrada, do
   cache e de saída.
3. **As ferramentas** que ele chamou, em barras, com quantas vezes cada uma.
4. **O pedido** que ele recebeu, inteiro.
5. **As últimas chamadas**, todas as ferramentas em ordem; clicar numa abre a entrada e a saída dela.
6. **A resposta**, formatada. Antes dela, quando houver, vem **o que ele escreveu** ao longo do
   trabalho.

Quando ele criou agentes ou trocou recados, entra também o grafo **Agentes que ele criou e com quem
conversou**, com ele num anel laranja: ficam acesos ele, quem o criou, os que ele criou e os que
trocaram recado com ele (e só as linhas deles); os outros nós, que só ligam a árvore até a conversa
principal, ficam fracos. Embaixo do grafo vêm os cartões desses agentes, a lista dos **recados**
que ele mandou e recebeu e, num agente instalado chamado mais de uma vez, **Outras execuções** do
mesmo agente.

#### As rodadas de um agente

O mesmo agente pode trabalhar mais de uma vez: ele termina, um recado (SendMessage) da conversa
principal ou de outro agente o acorda, e ele roda de novo, com o contexto de antes. Cada vez é uma
**rodada**. É diferente de chamar o mesmo agente instalado duas vezes: aí são duas execuções
separadas, cada uma com o seu cartão (e as duas se apontam em "Outras execuções").

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/agente-rodadas-escuro.svg"><img src="../../docs/arte/telas/agente-rodadas-claro.svg" width="720" alt="O detalhe de um agente com duas rodadas: os quadrinhos com os totais e a lista de rodadas, cada uma com o horário, a duração, o custo, quem a acordou e o começo da resposta"></picture>

1. **Os totais** do agente inteiro: quantas rodadas, a duração, o custo, as chamadas e os tokens
   somados.
2. **As rodadas**, com uma frase dizendo o que são.
3. **Cada rodada** numa linha: o número, o horário, a duração, o custo, as chamadas, o estado, quem a
   criou ou acordou (com o começo do pedido ou do recado) e o começo da resposta.
4. **Ver rodada** abre a tela dela (o cartão inteiro também abre).

- **O agente inteiro** (o cartão na aba Agentes e o detalhe aberto de lá) mostra os **totais** de
  todas as rodadas (duração, custo, chamadas, tokens) e a **lista de rodadas**: número, horário,
  duração, custo, estado, quem a acordou e o começo da resposta. Nada do pedido ou da resposta de uma
  rodada se mistura com outra.
- **Cada rodada abre a sua tela**, igual ao detalhe de um agente de uma rodada só, com os números
  dela: modelo, duração, custo, contexto, chamadas e tokens; o pedido (na primeira) ou o recado que a
  acordou, inteiro; o grafo dos agentes que ela criou e os recados que trocou; as ferramentas e as
  chamadas dela; e a resposta. Os botões `‹ Rodada 1`, `Rodada 3 ›` e **Agente inteiro** andam
  entre elas.

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/rodada-escuro.svg"><img src="../../docs/arte/telas/rodada-claro.svg" width="720" alt="A tela de uma rodada: o caminho até ela, os botões para a rodada anterior e o agente inteiro, os quadrinhos da rodada, o recado que a acordou, o grafo e as chamadas dela"></picture>

1. **`‹ Rodada 1` e Agente inteiro**, para andar entre as rodadas ou voltar à lista.
2. **O cabeçalho da rodada:** o número, como terminou, quem a acordou, o horário e os quadrinhos só
   dela (aqui, 16 segundos e US$ 0,08 de um agente que, inteiro, custou US$ 0,27).
3. **O recado que o acordou**, inteiro.
4. **Os agentes que ele criou e com quem conversou nesta rodada**, no grafo e em cartões.
5. **Os recados** que ele mandou e recebeu nesta rodada. Depois vêm as ferramentas, as chamadas e a
   resposta da rodada.

- **Onde ele aparece, aparecem só as rodadas daquele lugar.** No cartão de um turno, no detalhe de
  um turno e no último turno da Visão geral, cada rodada que aconteceu naquele turno é um item
  próprio (`Revisar o formato.ts · rodada 2 de 2`), que abre direto a tela dela; se ele rodou duas
  vezes no turno, aparece duas vezes. Dentro de outro agente, só as rodadas que esse agente criou
  ou acordou. A contagem diz quantos agentes e quantas rodadas (`Agentes · 2 · 4 rodadas`).
- **O caminho recorta o detalhe.** Entrando no agente por um turno, ele lista só as rodadas daquele
  turno; por outro agente, só as dele; pela aba Agentes, a Visão geral, o grafo ou a linha do tempo,
  todas. Uma linha diz o recorte (`Rodadas deste turno: 1 de 2 · ver todas as rodadas`).
- **Uma rodada é do turno** em que a conversa principal (ou um agente daquele mesmo turno) a acordou.
  Dois agentes antigos trocando recados enquanto você faz outro pedido não entram nesse pedido:
  aparecem dentro do agente que acordou o outro.

O que o agente escreveu na transcrição só aparece na rodada mais recente, porque a transcrição não
separa as rodadas. Os agentes de um workflow não ganham rodadas.

#### Parar um agente

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/agente-parando-escuro.svg"><img src="../../docs/arte/telas/agente-parando-claro.svg" width="720" alt="O detalhe de um agente rodando, com o botão Parar agente e o aviso de que ele está parando"></picture>

1. **O botão**, que vira **Parando…** depois do clique.
2. **O aviso** do que acontece agora.
3. **O estado** no cabeçalho, `parando…`, com o tempo, o custo e as chamadas até ali.

No detalhe de um agente que está rodando, **■ Parar agente** pede para ele parar. A API de mods não
tem como encerrar um agente à força, então o Lens faz duas coisas: manda a ele um recado pedindo
para parar já, e nega toda ferramenta que ele tentar depois disso, com o mesmo pedido como motivo.
A única que passa é a de entregar o relatório (SubagentHandback), para ele conseguir dizer o que fez
e terminar. O botão vira **Parando…**, e o cartão dele passa a dizer **parado antes de terminar**.
Se ele estiver no meio de uma resposta longa do modelo, só para quando ela acabar.

#### Os agentes de um workflow

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/agentes-workflow-escuro.svg"><img src="../../docs/arte/telas/agentes-workflow-claro.svg" width="720" alt="A aba Agentes com um workflow rodando: as fases do workflow como nós do grafo, o cartão do workflow e uma linha por agente de cada fase"></picture>

Os agentes de um **workflow** (que não passam pela ferramenta Agent) aparecem com o nome que o
script lhes deu, a fase, o pedido e o resultado, que o Lens lê dos arquivos da execução:

1. **No grafo**, cada fase é um nó, desenhado como uma pilha de cartões, entre a conversa principal e
   os agentes dela, com quantos terminaram.
2. **O cartão do workflow**, como no painel de tarefas do Claude Code: o nome, quantos agentes,
   quantos rodam, os tokens e o tempo.
3. **As fases**, cada uma com quantos agentes terminaram e uma linha por agente com o nome, o modelo,
   os tokens, o custo e o tempo. O nome abre o detalhe.

### 3 Turnos

*O que aconteceu em cada pedido, na ordem?*

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/turnos-escuro.svg"><img src="../../docs/arte/telas/turnos-claro.svg" width="720" alt="A aba Turnos com as marcas numeradas: o gráfico com a duração de cada turno, as ferramentas mais chamadas, um turno num cartão com o pedido, a resposta e os agentes que ele chamou, e os números do turno"></picture>

1. **A duração de cada turno**, numa barra: roxo concluído, vermelho com falha, azul em andamento.
   Passando o mouse, a dica mostra o pedido, a duração, o custo e as ferramentas.
2. **As ferramentas mais chamadas** na sessão (com um turno só, saem: estão no detalhe dele).
3. **Um cartão por pedido**, do mais recente ao mais antigo: o começo do pedido e da resposta e
   **os agentes que ele chamou**, uma linha por agente (ou por rodada, quando um agente rodou mais de
   uma vez), com o horário, o modelo, o tempo e o custo; cada nome abre o agente ou a rodada.
   Clicar no cartão abre o detalhe do turno.
4. **Os números do turno** em etiquetas: quanto somou ao contexto, quanto custou, quantas
   ferramentas, edições, comandos Bash e retornos de agentes.
5. **Um agente que rodou mais de uma vez** aparece pela rodada que aconteceu naquele turno: aqui, no
   turno 2, a rodada 2 do revisor e a do coordenador, que um recado acordou, com os números só dela.

Quando um agente em segundo plano termina, o Claude Code abre um turno sozinho para tratar o
retorno. A aba junta esses turnos ao pedido que os gerou: um pedido seu é um turno na lista, com a
duração, o custo e as ferramentas de tudo o que ele desencadeou.

#### O detalhe de um turno

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/ficha-turno-escuro.svg"><img src="../../docs/arte/telas/ficha-turno-claro.svg" width="720" alt="O detalhe de um turno: os números, o pedido, os subagentes com o grafo e um cartão por agente ou rodada, e a resposta"></picture>

1. **Os números:** a duração, o contexto que somou, o custo, as ferramentas, as edições e os
   comandos Bash.
2. **O pedido**, formatado; um pedido longo vem dobrado, com **Mostrar tudo**.
3. **Os subagentes** que rodaram no turno: o grafo só deles e dos recados entre eles.
4. **Um cartão por agente**, com o pedido que ele recebeu e a resposta que deu, o que a conversa
   principal não mostra. Um agente que rodou mais de uma vez ganha um cartão por rodada que
   aconteceu no turno, com o recado que o acordou e a resposta daquela rodada.
5. **A resposta.** Quando houve agentes em segundo plano, vem também o que o Claude respondeu depois
   do retorno de cada um.
6. **Os comandos Bash** do turno; clicar num abre o comando inteiro, a descrição, o fim da saída e
   o erro.

Quando houve, vêm também as **falhas** do turno (qual chamada falhou, de quem e por quê) e as
**ferramentas** em barras.

### 4 Diffs

*O que mudou, arquivo por arquivo?*

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/diffs-escuro.svg"><img src="../../docs/arte/telas/diffs-claro.svg" width="720" alt="A aba Diffs com as marcas numeradas: as fontes Sessão, Turno e Git, a lista de arquivos alterados numa árvore e o diff do arquivo escolhido"></picture>

1. **A fonte**, uma de cada vez:
   - **Sessão** (<kbd>s</kbd>): cada arquivo que o Claude mudou nos últimos 10 turnos, com as edições
     em ordem, pelo Edit e pelo Write (da conversa principal e dos subagentes, com o nome do agente)
     e pelos comandos Bash da conversa principal. Não limpa com o commit.
   - **Turno** (<kbd>e</kbd>): o mesmo, de um turno só (<kbd>t</kbd> e <kbd>y</kbd> vão ao anterior e
     ao seguinte).
   - **Git** (<kbd>g</kbd>): a árvore de trabalho contra o HEAD, com o que o Claude, os subagentes, os
     comandos e você mudaram.
2. **A lista**, como a visão de alterações do VS Code: os arquivos numa árvore, a letra do status na
   cor do git (`M` âmbar, `A` verde, `D` vermelho), as linhas `+N −N` e uma barrinha com a proporção
   do que entrou e saiu. <kbd>p</kbd> e <kbd>n</kbd> vão ao arquivo anterior e ao seguinte.
3. **O diff**, no app Desktop desenhado como o do próprio Claude Code: fonte monoespaçada, números
   de linha antes e depois, fundo verde ou vermelho, a palavra que mudou em destaque e as linhas
   longas quebradas num espaço, com `↪` na continuação.

Sem largura para os dois lado a lado (menos de 90 colunas), a lista vai em cima e o diff embaixo. No
Write sobre um arquivo que já existia, o conteúdo antigo é lido antes da escrita, para o diff ser o
real.

**O que um comando Bash muda.** Numa pasta com git, antes de cada comando Bash da conversa principal
o Lens tira uma foto dos arquivos com o próprio git, num índice só dele (o seu stage fica intacto, e
o `.gitignore` vale). Nada é gravado no projeto: o índice e as fotos ficam numa pasta temporária do
sistema (`csr-lens.*`). Depois do comando, tira outra, e o que mudou entra na Sessão como edição do
Bash, com o comando em cima do diff. Um comando em segundo plano, os de subagentes e o que você muda
no editor não entram (aparecem na fonte Git): com agentes em paralelo, a foto de antes e depois
pegaria o que os outros mudaram junto.

### 5 Árvore

*Onde o Claude está mexendo agora?*

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/arvore-escuro.svg"><img src="../../docs/arte/telas/arvore-claro.svg" width="720" alt="A aba Árvore com as marcas numeradas: o ramo do git e o total das alterações, os botões, a legenda de cores e a árvore com os arquivos lidos, editados e alterados"></picture>

1. **O que a aba mostra:** os arquivos que a sessão leu ou editou (a conversa principal e todos os
   subagentes) e os que o git vê alterados, numa árvore de pastas no estilo do
   [claude-code-filetree](https://github.com/data-goblin/claude-code-filetree).
2. **O ramo**, os commits à frente e atrás do remoto e o total das alterações, com bolinhas coloridas
   por tipo de mudança; embaixo dos botões, a legenda: verde novo, âmbar modificado, azul
   renomeado, vermelho apagado.
3. **Os botões:** **Atualizar** (<kbd>g</kbd>) lê o git de novo; **Projeto inteiro** (<kbd>a</kbd>)
   alterna entre o projeto todo e só o que foi tocado ou alterado; **Expandir tudo**
   (<kbd>x</kbd>) e **Recolher tudo** (<kbd>r</kbd>).
4. **Agora mesmo:** enquanto um Read, Edit, Write, um Grep num arquivo ou um comando Bash que lê ou
   escreve arquivos roda, o arquivo aparece aqui, com quem está mexendo nele. Do Bash, o Lens lê o
   próprio texto do comando: `cat`, `head`, `grep`, `sed -n` leem; `sed -i`, `tee`, `cp`, `mv`, `rm`
   e os redirecionamentos (`>`, `>>`) escrevem.
5. **Na árvore**, o arquivo acende com o selo `editando…` (laranja) ou `lendo…` (roxo) e, quando
   termina, fica destacado por 8 segundos. À direita de cada arquivo, a letra do git e as linhas
   `+N −N`; cada pasta soma o que há embaixo. O que só foi lido fica apagado, com quantas vezes.

**Árvore ou Diffs?** As duas mostram arquivos, mas de fontes diferentes:

| | Árvore | Diffs · Sessão | Diffs · Git |
|---|---|---|---|
| Mudanças ainda não commitadas, de antes da sessão | ✅ | ❌ | ✅ |
| Leituras desta sessão | ✅ | ❌ | ❌ |
| Edit e Write da conversa principal | ✅ | ✅ | ✅ (misturadas) |
| Mudanças por Bash da conversa principal | ✅ | ✅ | ✅ (misturadas) |
| Edit e Write dos subagentes | ✅ | ✅ com o nome do agente | ✅ (misturadas) |
| Mudanças por Bash dos subagentes | ✅ | ❌ | ✅ (misturadas) |

Por isso, numa sessão nova num projeto com mudanças sem commit, a Árvore mostra dezenas de arquivos
e a Sessão, nenhum: a Sessão é só o que foi editado nesta sessão, com o antes e o depois.

As pastas abrem sozinhas quando há algo tocado ou alterado embaixo, e clicar no nome da pasta abre e
fecha à mão. O git é lido ao abrir a sessão, 1,5 s depois de cada escrita ou comando Bash e no fim
de cada turno, sem os hooks do repositório.

### 6 Contexto

*Quanto do contexto sobra, e quanto já custou?*

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/contexto-escuro.svg"><img src="../../docs/arte/telas/contexto-claro.svg" width="720" alt="A aba Contexto com as marcas numeradas: o anel do contexto com os limites de uso ao lado, a grade de custo e tokens e o detalhamento do contexto"></picture>

1. **O contexto da conversa:** o anel com o percentual, os tokens sobre a janela e quanto o último
   pedido somou. É só a janela da conversa principal: cada agente tem a sua.
2. **Custo e tokens**, numa linha para o total, outra para a conversa e outra para os agentes, cada
   valor com o ▲ do que o último pedido somou:
   - **Custo**, em dólar e em reais. O custo é o da sessão, que o Claude Code informa com os agentes
     dentro; a parte de cada um é a repartição do Lens (veja [O custo de cada
     agente](#o-custo-de-cada-agente)).
   - **Tokens processados**, somados desde o começo da sessão. **Sem cache**: o que o modelo
     processou pela primeira vez e escreveu. **Com cache**: somando o contexto relido do cache a
     cada resposta, que passa do tamanho da janela e não é limite.
3. **Os limites de uso** da conta, com quando renovam. Num painel largo, eles ficam ao lado do anel.
4. **Contagem exata** troca a estimativa do detalhamento pela contagem de verdade, com uma
   requisição por ferramenta e por arquivo de memória; por isso só acontece quando o botão é
   apertado.
5. **O detalhamento** por categoria (mensagens, ferramentas do sistema, ferramentas MCP, skills,
   prompt de sistema, memória, espaço livre): uma estimativa local, atualizada a cada turno, sem
   requisição extra. Ela soma de um jeito um pouco diferente da medida do app, que é a do anel.

### 7 Inventário

*O que este Claude Code tem, e o que está ligado nesta sessão?*

<picture><source media="(prefers-color-scheme: dark)" srcset="../../docs/arte/telas/inventario-escuro.svg"><img src="../../docs/arte/telas/inventario-claro.svg" width="720" alt="A aba Inventário com as marcas numeradas: as seções com as contagens, o filtro e os itens em cartões, ativos e inativos"></picture>

1. **As seções**, com quantos itens estão ativos em cada uma, e o **Atualizar** (<kbd>u</kbd>), que
   lê tudo de novo. <kbd>j</kbd> e <kbd>k</kbd> vão à seção anterior e à seguinte.
2. **O filtro** procura por nome, origem ou descrição dentro da seção.
3. **Um item ativo** e 4. **um inativo**: cada peça num cartão, com a pílula do estado, a descrição
   e o que ela traz. As peças vêm em grupos pela origem (o marketplace, as suas configurações, uma
   pasta local, as embutidas); o botão de cada grupo fecha e abre o grupo.

| Seção | O que mostra | Ativo quer dizer |
|---|---|---|
| Plugins | Os instalados, com versão, marketplace, descrição e o que cada um traz, e os carregados de uma pasta local | Habilitado nas configurações |
| Skills | Dos plugins, as suas (`~/.claude/skills`), as do projeto e as embutidas | O modelo vê a skill nesta sessão |
| Comandos | Os comandos de barra: embutidos, de plugins, seus e de MCP | Dá para rodar agora |
| Agentes | Os tipos de subagente além dos embutidos | O Agent os oferece nesta sessão |
| Hooks | Das configurações e dos plugins: evento, matcher e o comando | Não estão desligados e o plugin está habilitado |
| MCP | Os servidores, com as ferramentas de cada um | Conectado |
| Outros | Estilo de saída, arquivos de memória (CLAUDE.md) com os tokens, ferramentas embutidas | |
| Para instalar | Os plugins dos marketplaces que você adicionou e ainda não instalou (30 por vez, com **Mostrar mais**) | |

Nada disso gasta tokens: as listas vêm da própria sessão, das configurações e dos arquivos dos
plugins no disco. Um plugin habilitado no meio da sessão só carrega as peças depois de
`/reload-plugins`.

## No terminal

O mesmo painel, em texto: os gráficos viram barras de blocos, e o grafo de agentes, uma árvore.

<img src="../../docs/arte/telas/terminal-agentes.svg" width="420" alt="A aba Agentes no terminal: as contagens, a árvore de quem chamou quem e os cartões dos agentes"> <img src="../../docs/arte/telas/terminal-turnos.svg" width="420" alt="A aba Turnos no terminal: as ferramentas mais chamadas em barras de blocos e os turnos">

Acima do prompt, a linha de resumo vira selos coloridos. Quando a linha não cabe, ela se ajusta em
degraus: a marca encurta, depois os rótulos saem e ficam só os valores, e só então os selos descem
para a linha de baixo.

<img src="../../docs/arte/telas/terminal-selos.svg" width="760" alt="A linha de resumo no terminal: os selos CSR, contexto com a barrinha e os tokens, custo, limite e agentes">

## O custo de cada agente

O Claude Code informa o custo da sessão inteira, não o de cada subagente. O Lens reparte esse
custo: ao fim de cada resposta do modelo, o que o custo da sessão subiu vai para quem fez a
resposta. A soma dos agentes nunca passa do total da sessão; se duas respostas terminam no mesmo
instante, uma fração pode cair no agente vizinho. O custo de uma rodada é o que o agente gastou
entre o começo e o fim dela.

O valor em dólar é o do Claude Code, calculado a preço de tabela: para quem paga assinatura, ele
não é cobrança, e serve para comparar um agente com outro. O "contexto" de um agente é o tamanho
do contexto dele na última resposta; ele tem uma janela própria, que não ocupa a da conversa
principal.

## Quando algo dá errado

- **Painel em branco ou com erro.** Se o painel falhar ao desenhar uma aba, ele mostra o erro no
  lugar dela e o grava em `~/.claude/csr-lens-erros.log`, junto com os erros dos outros passos do
  Lens e os desenhos que passarem de 250 ms. Logo depois de atualizar o plugin com a sessão aberta,
  rode `/reload-plugins` ou abra uma sessão nova.
- **Botão que só responde no segundo clique.** O app Desktop entrega o clique para o desenho em que
  ele foi feito; se o painel redesenhou entre o desenho pintado e o clique, o app o recusa. Por isso
  o painel desenha a partir de um retrato dos dados, refeito na hora depois de um clique seu e, fora
  isso, no máximo a cada 2,5 s. Se ainda acontecer, rode `/lens diagnostico`, use o painel e rode
  `/lens diagnostico` de novo: enquanto ligado, o mod grava em `~/.claude/csr-lens-diagnostico.log`
  cada clique, cada mudança de foco e cada desenho.

## Limites conhecidos

- **Custo por agente, por rodada e por turno.** É uma repartição do custo da sessão, não um valor
  informado pelo Claude Code (veja [O custo de cada agente](#o-custo-de-cada-agente)).
- **Parar um agente.** Não é um encerramento à força: ele termina na resposta seguinte (veja
  [Parar um agente](#parar-um-agente)).
- **Rodadas.** O que o agente escreveu não se separa por rodada; rodadas gravadas por versões antigas
  do Lens não têm os tokens, o custo e a hora das chamadas.
- **Cabeçalho fixo.** As abas e o caminho rolam junto com o painel.
- **Exit code do Bash.** O resultado da ferramenta não traz o código como campo. Em falha, ele é
  lido do texto de erro; em sucesso, a linha mostra só a marca de concluído e a duração.
- **Comando em segundo plano.** A chamada volta na hora; o fim real não chega ao mod.
- **Mensagens do agente.** São relidas ao abrir o detalhe e no botão, não ao vivo.
- **Cliques nos gráficos do Desktop.** Os nós do grafo, os indicadores e as pílulas são clicáveis
  por botões invisíveis postos em cima deles; a posição é calculada, e pode sair um pouco deslocada
  num tamanho de fonte diferente.
- **Versão compacta.** <kbd>Esc</kbd> não a fecha; use `/lens`.
- **Tamanho.** Guarda 100 agentes, 100 comandos, 60 turnos, 200 recados, 10 rodadas por agente e 10
  turnos de diffs.
- **API em evolução.** A API de mods pode mudar entre versões do Claude Code.

## Privacidade

O CSR Lens não faz chamada de rede. Os únicos comandos que roda na sua máquina são de leitura do git
(`git rev-parse`, `git status` e `git diff`) e as fotos dos arquivos antes e depois de um comando
Bash, num índice do git só dele. As únicas pastas que lista são as que você abre na árvore inteira,
as de plugins, skills e agentes que o Inventário lê e, com um workflow rodando, a pasta da sessão em
`~/.claude/projects`. Do inventário fica só o nome, a origem e a descrição de cada peça: nada de
variáveis de ambiente ou segredos das configurações.

Ele grava dois arquivos, só na sua máquina: `~/.claude/csr-lens-erros.log`, quando algo falha, e
`~/.claude/csr-lens-diagnostico.log`, só com o diagnóstico ligado. O resto fica no estado da sessão
e num retrato dela no armazenamento local do plugin, para a sessão retomada voltar com os dados:
caminhos de arquivos, comandos e o fim da saída deles, diffs, o pedido e a resposta de cada turno e
o pedido, as chamadas e o resultado de cada subagente. Para conferir o que o mod chama antes de
instalar, clone o repositório e rode:

```bash
claude plugin validate ./plugins/csr-lens
```

## Desenvolver

```bash
claude --plugin-dir ./plugins/csr-lens
```

```bash
claude plugin validate ./plugins/csr-lens --strict
```

```bash
claude plugin test ./plugins/csr-lens
```

Os testes rodam cada aba e cada detalhe nas superfícies `terminal` e `desktop`, a linha de resumo,
as rodadas de um agente, o botão de parar, os agentes de workflow, os arquivos que o Bash lê e
escreve, uma sessão longa e bagunçada e o tempo de desenho de cada aba. Para refazer as telas desta
página (pede o `claude` e o Google Chrome):

```bash
python3 scripts/telas/telas.py
```

```
.claude-plugin/plugin.json   manifesto
hooks/hooks.json             aponta o módulo
hooks/register.tsx           hooks, comandos, ações dos botões e o que cada aba lê
hooks/dados.ts               transformações do estado
hooks/rodadas.ts             as rodadas do mesmo agente, postas de pé para as telas
hooks/caminho.ts             o caminho de um detalhe (de onde foi aberto), para o Voltar e a linha no alto
hooks/memoria.ts             o retrato da sessão, para uma sessão retomada voltar com os dados
hooks/telas.tsx              topo, caminho, abas Agentes, Turnos e Contexto, grafo e linha do tempo
hooks/visao-tela.tsx         aba Visão geral
hooks/fichas.tsx             detalhe de agente, de uma rodada dele, de comando e de turno
hooks/pilulas.ts             as pílulas da linha de resumo no Desktop
hooks/graficos.ts            gráficos em SVG do Desktop (anel, barras, grafo, linha do tempo, dicas)
hooks/desenhos.ts            o cérebro, os robôs e os ícones deles nas pílulas
hooks/workflows.ts           os agentes de workflow, lidos dos arquivos da execução
hooks/caminhos-do-bash.ts    os arquivos que um comando Bash lê e escreve
hooks/diff.ts                diff por linhas
hooks/diff-svg.ts            o diff desenhado em SVG no Desktop
hooks/diffs-lista.ts         aba Diffs: arquivos por fonte, árvore, texto do diff
hooks/diffs-tela.tsx         aba Diffs: lista à esquerda, diff à direita
hooks/arvore.ts              aba Árvore: git, toques ao vivo, montagem da árvore
hooks/arvore-tela.tsx        aba Árvore: desenho
hooks/inventario.ts          aba Inventário: o que ler e de onde
hooks/inventario-tela.tsx    aba Inventário: desenho
hooks/formato.ts             números, durações e horas em pt-BR
hooks/cores.ts               a paleta
hooks/pecas.tsx              selos, títulos de seção, cartões, estados, barras
types/index.d.ts             contrato do estado
tests/                       testes
```

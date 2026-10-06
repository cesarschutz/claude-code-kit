# claude-code-kit

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/arte/kit-escuro.svg">
  <img src="docs/arte/kit-claro.svg" width="860" alt="claude-code-kit: dois comandos para instalar e o catálogo de mods, skills, agentes, hooks, estilos de saída e temas">
</picture>

[![versão do csr-lens](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fcesarschutz%2Fclaude-code-kit%2Fmain%2Fplugins%2Fcsr-lens%2F.claude-plugin%2Fplugin.json&query=%24.version&label=csr-lens&color=d77757&labelColor=262626&style=flat-square)](plugins/csr-lens/)
[![itens no catálogo](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fcesarschutz%2Fclaude-code-kit%2Fmain%2F.claude-plugin%2Fmarketplace.json&query=%24.plugins.length&label=cat%C3%A1logo&suffix=%20itens&color=6e6e6e&labelColor=262626&style=flat-square)](#o-catálogo)
[![Claude Code 2.1.287 ou mais novo](https://img.shields.io/badge/Claude%20Code-%E2%89%A5%202.1.287-b1b9f9?labelColor=262626&style=flat-square&logo=claude&logoColor=d77757)](https://code.claude.com/docs)
[![licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-6e6e6e?labelColor=262626&style=flat-square)](LICENSE)
[![autor: Cesar Schutz](https://img.shields.io/badge/autor-Cesar%20Schutz-6e6e6e?labelColor=262626&style=flat-square)](https://blog.cesarschutz.com.br)

Caixa de ferramentas para o [Claude Code](https://code.claude.com/docs): um mod que põe um painel
ao lado da conversa, o **CSR Lens**, e peças de exemplo de cada tipo que o Claude Code aceita
(skills, agentes, hooks, estilos de saída e temas), instaláveis uma a uma.

Este repositório é um **marketplace de plugins**: você o cadastra uma vez no Claude Code e instala
só o que quiser, pelo nome. Não há build nem dependência. Cada item é uma pasta de arquivos que o
Claude Code lê direto, e o catálogo inteiro está em
[`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json).

- [Começar](#começar) · [O catálogo](#o-catálogo) · [CSR Lens](#csr-lens) ·
  [Os exemplos](#os-exemplos) · [O que é cada tipo](#o-que-é-cada-tipo)
- [Antes de instalar](#antes-de-instalar) · [Atualizar e remover](#atualizar-e-remover) ·
  [Requisitos](#requisitos) · [Como o repositório é organizado](#como-o-repositório-é-organizado) ·
  [Contribuir e desenvolver](#contribuir-e-desenvolver) · [Para ler mais](#para-ler-mais)

## Começar

Cadastre o marketplace (o nome dele é `cesarschutz`):

```bash
claude plugin marketplace add cesarschutz/claude-code-kit
```

Instale um item pelo nome, seguido de `@cesarschutz`:

```bash
claude plugin install csr-lens@cesarschutz
```

> [!TIP]
> Dentro de uma sessão do Claude Code, `/plugin` mostra o catálogo e instala por ali. O que for
> instalado com a sessão aberta entra com `/reload-plugins`.

## O catálogo

| Item | Tipo | O que faz | Instalar |
|---|---|---|---|
| [CSR Lens](plugins/csr-lens/) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-mod-escuro.svg"><img src="docs/arte/selo-mod-claro.svg" height="20" alt="mod"></picture> | Painel ao lado da conversa: visão geral, agentes, turnos, diffs, árvore de arquivos, contexto e custo, inventário | `csr-lens` |
| [exemplos](plugins/exemplos/) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-pacote-escuro.svg"><img src="docs/arte/selo-pacote-claro.svg" height="20" alt="pacote"></picture> | Skill, agente, hook e estilo de saída num plugin só, para copiar como modelo | `exemplos` |
| [mensagem-de-commit](skills/mensagem-de-commit/SKILL.md) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-skill-escuro.svg"><img src="docs/arte/selo-skill-claro.svg" height="20" alt="skill"></picture> | Escreve a mensagem de commit para o que está no stage, sem commitar | `mensagem-de-commit` |
| [explicar-erro](skills/explicar-erro/SKILL.md) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-skill-escuro.svg"><img src="docs/arte/selo-skill-claro.svg" height="20" alt="skill"></picture> | Explica um erro ou stack trace e aponta a causa provável | `explicar-erro` |
| [pesquisador](agents/pesquisador.md) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-agente-escuro.svg"><img src="docs/arte/selo-agente-claro.svg" height="20" alt="agente"></picture> | Localiza no código onde algo é feito e devolve um mapa; só lê | `pesquisador` |
| [critico](agents/critico.md) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-agente-escuro.svg"><img src="docs/arte/selo-agente-claro.svg" height="20" alt="agente"></picture> | Dá uma segunda opinião sobre um plano, procurando o que pode dar errado; só lê | `critico` |
| [professor](output-styles/professor.md) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-estilo-escuro.svg"><img src="docs/arte/selo-estilo-claro.svg" height="20" alt="estilo"></picture> | Explica o porquê de cada passo, para quem está aprendendo | `professor` |
| [tinta-azul](themes/tinta-azul/themes/tinta-azul.json) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-tema-escuro.svg"><img src="docs/arte/selo-tema-claro.svg" height="20" alt="tema"></picture> | Cores do terminal com o destaque em azul | `tinta-azul` |
| [responder-em-portugues](hooks/responder-em-portugues/) | <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-hook-escuro.svg"><img src="docs/arte/selo-hook-claro.svg" height="20" alt="hook"></picture> | No início da sessão, pede ao Claude que responda em português | `responder-em-portugues` |

Cada linha instala inteira e separada das outras: uma peça avulsa traz só ela; um pacote traz todas
as suas peças de uma vez.

## CSR Lens

Um painel ao lado da conversa do Claude Code com os instrumentos da sessão, e uma linha de resumo
acima do prompt. Abre e fecha com `/lens` e responde a perguntas que o Claude Code sozinho não
responde: quais subagentes estão trabalhando e quem chamou quem, quanto custou cada agente e cada
pedido, o que mudou em cada arquivo, onde o Claude está mexendo agora e o que está instalado.

<a href="plugins/csr-lens/"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/telas/pilulas-escuro.svg"><img src="docs/arte/telas/pilulas-claro.svg" width="860" alt="A linha de resumo do CSR Lens no app Desktop: pílulas com o repositório, o contexto, o custo, os limites de uso, o modelo e o cache"></picture></a>

<a href="plugins/csr-lens/"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/telas/visao-geral-escuro.svg"><img src="docs/arte/telas/visao-geral-claro.svg" width="620" alt="A Visão geral do CSR Lens: os indicadores, o que está rodando agora, os agentes instalados, o grafo de quem chamou quem, o último turno e as últimas edições"></picture></a>

As sete abas, na ordem da barra (as teclas <kbd>1</kbd> a <kbd>7</kbd> trocam de aba):

| | Aba | A pergunta que ela responde |
|---|---|---|
| <a href="plugins/csr-lens/README.md#1-visão-geral"><img src="docs/arte/aba-visao-geral.svg" height="26" alt="1 Visão geral"></a> | Visão geral | O que está acontecendo, numa tela só? |
| <a href="plugins/csr-lens/README.md#2-agentes"><img src="docs/arte/aba-agentes.svg" height="26" alt="2 Agentes"></a> | Agentes | Quem está trabalhando, em quê, e quem chamou quem? |
| <a href="plugins/csr-lens/README.md#3-turnos"><img src="docs/arte/aba-turnos.svg" height="26" alt="3 Turnos"></a> | Turnos | O que aconteceu em cada pedido? |
| <a href="plugins/csr-lens/README.md#4-diffs"><img src="docs/arte/aba-diffs.svg" height="26" alt="4 Diffs"></a> | Diffs | O que mudou, arquivo por arquivo? |
| <a href="plugins/csr-lens/README.md#5-árvore"><img src="docs/arte/aba-arvore.svg" height="26" alt="5 Árvore"></a> | Árvore | Onde o Claude está mexendo agora? |
| <a href="plugins/csr-lens/README.md#6-contexto"><img src="docs/arte/aba-contexto.svg" height="26" alt="6 Contexto"></a> | Contexto | Quanto do contexto sobra, e quanto já custou? |
| <a href="plugins/csr-lens/README.md#7-inventário"><img src="docs/arte/aba-inventario.svg" height="26" alt="7 Inventário"></a> | Inventário | O que está instalado, e o que está ligado nesta sessão? |

O que ele faz, em resumo:

- **Agentes:**
  - um grafo de quem chamou quem, com os recados (SendMessage) entre eles;
  - a origem de cada agente (global, do projeto, de plugin, embutido) e os agentes instalados que
    ninguém chamou ainda;
  - a linha do tempo com a conversa principal;
  - o detalhe de cada agente, com o pedido, as chamadas (entrada e saída) e a resposta.
- **Rodadas:** quando o mesmo agente volta a trabalhar, acordado por um recado, cada vez vira uma
  rodada com a sua tela, os seus números e a sua resposta. Onde o agente aparece, aparecem só as
  rodadas daquele lugar.
- **Navegação:** um caminho no alto (`◉ Visão geral › Turno 2 › Revisar o plano › Rodada 2`) diz de
  onde você veio, e cada parte leva àquele nível.
- **Custo:** o da sessão, repartido entre a conversa, cada agente, cada rodada e cada pedido, em
  dólar e em reais.
- **Arquivos:** os diffs como no VS Code (da sessão, de um turno ou do git), inclusive o que um
  comando Bash mudou, e a árvore de arquivos acesa ao vivo enquanto o Claude lê e escreve.
- **Parar agente:** pede para um agente parar e nega as ferramentas dele até ele terminar.
- **Só observa:** fora o Parar agente e a Contagem exata, nenhum hook bloqueia ou altera nada, e o
  painel não gasta tokens.

Funciona no terminal e na aba Code do app Desktop, e pede o Claude Code 2.1.287 ou mais novo. Tudo,
aba por aba, com as teclas, os limites e a privacidade, está no
[README do CSR Lens](plugins/csr-lens/).

```bash
claude plugin install csr-lens@cesarschutz
```

## Os exemplos

Peças pequenas, uma de cada tipo, para aprender o formato ou copiar como ponto de partida. Cada uma
instala sozinha, e o pacote [`exemplos`](plugins/exemplos/) traz uma skill, um agente, um hook e um
estilo de saída num plugin só, com uma tabela do que cada pasta é.

```bash
claude plugin install explicar-erro@cesarschutz
```

## O que é cada tipo

| Tipo | O que é | Como age depois de instalado |
|:--|---|---|
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-skill-escuro.svg"><img src="docs/arte/selo-skill-claro.svg" height="20" alt="skill"></picture> | Instruções em Markdown para uma tarefa | O Claude usa quando o pedido combina, ou você chama pelo menu de `/` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-agente-escuro.svg"><img src="docs/arte/selo-agente-claro.svg" height="20" alt="agente"></picture> | Um ajudante com papel próprio e ferramentas limitadas | O Claude delega a ele, ou você pede pelo nome |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-hook-escuro.svg"><img src="docs/arte/selo-hook-claro.svg" height="20" alt="hook"></picture> | Um comando ligado a um evento da sessão | Roda sozinho no evento |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-estilo-escuro.svg"><img src="docs/arte/selo-estilo-claro.svg" height="20" alt="estilo"></picture> | Um jeito de responder: o estilo de saída | Você escolhe em `/output-style` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-tema-escuro.svg"><img src="docs/arte/selo-tema-claro.svg" height="20" alt="tema"></picture> | Cores do terminal | Você escolhe em `/theme` |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-mod-escuro.svg"><img src="docs/arte/selo-mod-claro.svg" height="20" alt="mod"></picture> | Código que roda dentro do Claude Code, reage aos eventos da sessão e desenha na interface | Acrescenta painéis, comandos e linhas na tela |
| <picture><source media="(prefers-color-scheme: dark)" srcset="docs/arte/selo-pacote-escuro.svg"><img src="docs/arte/selo-pacote-claro.svg" height="20" alt="pacote"></picture> | Um plugin com várias peças | Tudo o que está dentro vem junto |

## Antes de instalar

> [!IMPORTANT]
> Skills, agentes, estilos e temas são texto. Hooks e mods executam na sua máquina, com as suas
> permissões. Leia o que vai instalar: os arquivos são curtos.

Para um mod, o próprio Claude Code lista os eventos que ele observa e o que ele chama, sem
executá-lo:

```bash
git clone https://github.com/cesarschutz/claude-code-kit.git
```

```bash
claude plugin validate ./claude-code-kit/plugins/csr-lens
```

## Atualizar e remover

Num marketplace de terceiros, a atualização automática vem desligada. O Claude Code só vê uma versão
nova de um plugin completo quando o `version` do `plugin.json` dele sobe; nas peças avulsas, a versão
é o commit. Para buscar o que mudou:

```bash
claude plugin marketplace update cesarschutz
```

```bash
claude plugin update csr-lens@cesarschutz
```

Para remover:

```bash
claude plugin uninstall csr-lens@cesarschutz
```

## Requisitos

- Claude Code. Os mods pedem a versão 2.1.287 ou mais nova (`claude --version`). O app Desktop traz
  a própria cópia do Claude Code: atualize o app também.
- A instalação de cada item foi conferida no Claude Code para terminal; o CSR Lens também roda na
  aba Code do app Desktop. O que cada tipo carrega em outros aplicativos está na
  [tabela de suporte por plataforma](https://claude.com/docs/plugins/platform-support).

## Como o repositório é organizado

```
.claude-plugin/marketplace.json   o catálogo: uma entrada por item instalável
plugins/csr-lens/                 o mod CSR Lens (manifesto, hooks, tipos, testes e README)
plugins/exemplos/                 o pacote de exemplo, com uma peça de cada tipo
skills/                           skills avulsas
agents/                           agentes avulsos
output-styles/                    estilos de saída avulsos
themes/                           temas avulsos
hooks/                            hooks avulsos (o hook fica escrito na entrada do catálogo)
docs/arte/                        imagens dos READMEs, em SVG, numa versão clara e numa escura
scripts/arte.py                   gera a arte de docs/arte/ a partir do catálogo
scripts/telas/                    gera as telas do CSR Lens em docs/arte/telas/, rodando o próprio mod
scripts/temas.py                  fixa num tema (claro ou escuro) uma imagem que segue o sistema
.claude/agents/                   agentes usados para manter este repositório (conferir os READMEs)
AITMPL - relatorio-.../           estudo do site claude-code-templates, referência para o catálogo
```

## Contribuir e desenvolver

Para acrescentar um item ou propor uma mudança, veja o [CONTRIBUTING.md](CONTRIBUTING.md): o formato
de cada tipo de peça, as regras de nome e de versão e as conferências antes de enviar. Para o mod:

```bash
claude plugin validate ./plugins/csr-lens --strict
```

```bash
claude plugin test ./plugins/csr-lens
```

```bash
claude --plugin-dir ./plugins/csr-lens
```

Depois de mudar o catálogo, gere a arte de novo com `python3 scripts/arte.py`. Depois de mudar o
desenho do mod, gere as telas com `python3 scripts/telas/telas.py` (pede o `claude` e o Google
Chrome).

## Para ler mais

No blog, uma sequência em três partes:

1. [Mods do Claude Code: o que são e as peças que vieram antes](https://blog.cesarschutz.com.br/posts/claude-code-do-claude-md-ao-mod/)
2. [Um mod do Claude Code na prática: instalar e ler o painel](https://blog.cesarschutz.com.br/posts/claude-code-csr-lens/)
3. [Subagentes no Claude Code: quem chamou quem, recados e rodadas](https://blog.cesarschutz.com.br/posts/claude-code-csr-lens-agentes/)

## Licença

[MIT](LICENSE) © Cesar Schutz

# claude-code-kit

<img src="docs/arte/kit.svg" width="860" alt="claude-code-kit: dois comandos para instalar e o catálogo de mods, skills, agentes, hooks, estilos de saída e temas">

[![versão do csr-cockpit](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fcesarschutz%2Fclaude-code-kit%2Fmain%2Fplugins%2Fcsr-cockpit%2F.claude-plugin%2Fplugin.json&query=%24.version&label=csr-cockpit&color=d77757&labelColor=262626&style=flat-square)](plugins/csr-cockpit/)
[![itens no catálogo](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fcesarschutz%2Fclaude-code-kit%2Fmain%2F.claude-plugin%2Fmarketplace.json&query=%24.plugins.length&label=cat%C3%A1logo&suffix=%20itens&color=6e6e6e&labelColor=262626&style=flat-square)](#catálogo)
[![Claude Code 2.1.287 ou mais novo](https://img.shields.io/badge/Claude%20Code-%E2%89%A5%202.1.287-b1b9f9?labelColor=262626&style=flat-square&logo=claude&logoColor=d77757)](https://code.claude.com/docs)
[![licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-6e6e6e?labelColor=262626&style=flat-square)](LICENSE)
[![autor: Cesar Schutz](https://img.shields.io/badge/autor-Cesar%20Schutz-6e6e6e?labelColor=262626&style=flat-square)](https://blog.cesarschutz.com.br)

Caixa de ferramentas para o [Claude Code](https://code.claude.com/docs): mods, skills, agentes,
hooks, estilos de saída e temas, instaláveis um a um.

Este repositório é um marketplace de plugins. Você o cadastra uma vez e instala só o que quiser,
pelo nome. Não há build nem dependência: cada item é uma pasta de arquivos que o Claude Code lê
direto.

## Começar

Cadastre o marketplace:

```bash
claude plugin marketplace add cesarschutz/claude-code-kit
```

Instale um item pelo nome:

```bash
claude plugin install csr-cockpit@cesarschutz
```

> [!TIP]
> Dentro de uma sessão no terminal, `/plugin` mostra o catálogo e instala por ali. O que for
> instalado com a sessão aberta entra com `/reload-plugins`.

## Catálogo

### Ferramentas

#### [csr-cockpit](plugins/csr-cockpit/)

<img src="docs/arte/selo-mod.svg" height="20" alt="mod"> Um painel ao lado da conversa com os instrumentos da sessão, em cinco abas: subagentes, diffs do
turno, uso do contexto e custo, arquivos lidos e comandos executados, e o histórico dos turnos. Uma
linha acima do prompt resume contexto, custo, limite de uso e agentes. Clicar no nome de um agente,
de um comando ou de um turno abre o detalhe: o pedido, as chamadas e a resposta. O mod só observa:
não bloqueia nem altera nenhuma chamada de ferramenta.

<a href="plugins/csr-cockpit/"><img src="docs/arte/cockpit.svg" width="860" alt="A tela do Claude Code com o csr-cockpit: a conversa à esquerda, o painel com cinco abas à direita e a linha de resumo acima do prompt"></a>

<a href="plugins/csr-cockpit/README.md#1-agentes"><img src="docs/arte/aba-1.svg" height="28" alt="1 Agentes"></a>
<a href="plugins/csr-cockpit/README.md#2-diffs"><img src="docs/arte/aba-2.svg" height="28" alt="2 Diffs"></a>
<a href="plugins/csr-cockpit/README.md#3-contexto"><img src="docs/arte/aba-3.svg" height="28" alt="3 Contexto"></a>
<a href="plugins/csr-cockpit/README.md#4-arquivos"><img src="docs/arte/aba-4.svg" height="28" alt="4 Arquivos"></a>
<a href="plugins/csr-cockpit/README.md#5-turnos"><img src="docs/arte/aba-5.svg" height="28" alt="5 Turnos"></a>

```bash
claude plugin install csr-cockpit@cesarschutz
```

Abre e fecha com `/cockpit`. Pede o Claude Code 2.1.287 ou mais novo. Detalhes, teclas e limites
no [README do csr-cockpit](plugins/csr-cockpit/).

### [csr-reviewer](plugins/csr-reviewer/)

<img src="docs/arte/selo-mod.svg" height="20" alt="mod"> Um segundo par de olhos para a sessão. Depois que o agente principal conclui um turno, cria um fork somente-leitura da própria conversa, procura riscos ou pontos esquecidos e mostra os achados num painel lateral sem poluir o transcript principal.

```bash
claude plugin install csr-reviewer@cesarschutz
```

Abre e fecha com `/reviewer`. A revisão automática pode ser ligada ou pausada com `/reviewer on` e `/reviewer off`; `/reviewer run` força uma revisão manual. O painel mostra também os tokens usados pelo fork.

### Exemplos

Peças pequenas, uma de cada tipo, para aprender o formato ou copiar como ponto de partida. Cada
uma instala sozinha.

| Item | Tipo | O que faz |
|---|---|---|
| [`mensagem-de-commit`](skills/mensagem-de-commit/SKILL.md) | <img src="docs/arte/selo-skill.svg" height="20" alt="skill"> | Escreve a mensagem de commit para o que está no stage, sem commitar |
| [`explicar-erro`](skills/explicar-erro/SKILL.md) | <img src="docs/arte/selo-skill.svg" height="20" alt="skill"> | Explica um erro ou stack trace e aponta a causa provável |
| [`pesquisador`](agents/pesquisador.md) | <img src="docs/arte/selo-agente.svg" height="20" alt="agente"> | Localiza no código onde algo é feito e devolve um mapa; só lê |
| [`critico`](agents/critico.md) | <img src="docs/arte/selo-agente.svg" height="20" alt="agente"> | Dá uma segunda opinião sobre um plano, procurando o que pode dar errado; só lê |
| [`professor`](output-styles/professor.md) | <img src="docs/arte/selo-estilo.svg" height="20" alt="estilo"> | Explica o porquê de cada passo, para quem está aprendendo |
| [`tinta-azul`](themes/tinta-azul/themes/tinta-azul.json) | <img src="docs/arte/selo-tema.svg" height="20" alt="tema"> | Cores do terminal com o destaque em azul |
| [`responder-em-portugues`](hooks/responder-em-portugues/) | <img src="docs/arte/selo-hook.svg" height="20" alt="hook"> | No início da sessão, pede ao Claude que responda em português |
| [`exemplos`](plugins/exemplos/) | <img src="docs/arte/selo-pacote.svg" height="20" alt="pacote"> | Skill, agente, hook e estilo de saída num plugin só |

```bash
claude plugin install explicar-erro@cesarschutz
```

## O que é cada tipo

| Tipo | O que é | Como age depois de instalado |
|:--|---|---|
| <img src="docs/arte/selo-skill.svg" height="20" alt="skill"> | Instruções em Markdown para uma tarefa | O Claude usa quando o pedido combina, ou você chama pelo menu de `/` |
| <img src="docs/arte/selo-agente.svg" height="20" alt="agente"> | Um ajudante com papel próprio e ferramentas limitadas | O Claude delega a ele, ou você pede pelo nome |
| <img src="docs/arte/selo-hook.svg" height="20" alt="hook"> | Um comando ligado a um evento da sessão | Roda sozinho no evento |
| <img src="docs/arte/selo-estilo.svg" height="20" alt="estilo"> | Um jeito de responder: o estilo de saída | Você escolhe em `/output-style` |
| <img src="docs/arte/selo-tema.svg" height="20" alt="tema"> | Cores do terminal | Você escolhe em `/theme` |
| <img src="docs/arte/selo-mod.svg" height="20" alt="mod"> | Código que roda dentro do Claude Code e desenha na interface | Acrescenta painéis, comandos e linhas na tela |
| <img src="docs/arte/selo-pacote.svg" height="20" alt="pacote"> | Um plugin com várias peças | Tudo o que está dentro vem junto |

Cada linha do catálogo é instalada inteira e separada das outras. Uma peça avulsa traz só ela; um
pacote traz todas as suas peças de uma vez.

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
claude plugin validate ./claude-code-kit/plugins/csr-cockpit
```

## Atualizar e remover

```bash
claude plugin update csr-cockpit@cesarschutz
```

```bash
claude plugin uninstall csr-cockpit@cesarschutz
```

## Requisitos

- Claude Code. Os mods pedem a versão 2.1.287 ou mais nova (`claude --version`).
- A instalação de cada item foi conferida no Claude Code para terminal. O que cada tipo carrega
  em outros aplicativos está na
  [tabela de suporte por plataforma](https://claude.com/docs/plugins/platform-support).

## Estrutura do repositório

```
.claude-plugin/marketplace.json   o catálogo
plugins/                          plugins completos, cada um com o seu manifesto
skills/                           skills avulsas
agents/                           agentes avulsos
output-styles/                    estilos de saída avulsos
themes/                           temas avulsos
hooks/                            hooks avulsos
docs/                             imagens dos READMEs (arte em SVG e prints)
scripts/arte.py                   gera a arte em docs/arte/ a partir do catálogo
```

Para acrescentar um item ou propor uma mudança, veja o [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE) © Cesar Schutz

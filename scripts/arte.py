#!/usr/bin/env python3
"""Gera a arte dos READMEs em docs/arte/: o cartão do kit (com o catálogo lido de
.claude-plugin/marketplace.json), o cartão do cockpit, os selos de tipo e as abas.

    python3 scripts/arte.py

Rode de novo depois de mexer no catálogo. Os SVGs são imagens: o GitHub não deixa usar
CSS no README, mas deixa dentro de um SVG. Sem fonte externa, sem script, uma passada de
animação só, e parados para quem pede menos movimento.
"""
import json
import pathlib
from xml.sax.saxutils import escape

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "docs" / "arte"

FUNDO, TEXTO, CINZA, TRACO = "#262626", "#e8e8e8", "#999999", "#4a4a4a"
LAVANDA, LARANJA, VERDE, VERMELHO = "#b1b9f9", "#d77757", "#4eba65", "#ff6b80"
FONTE = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'


class Tela:
    """Um cartão escuro com texto monoespaçado. A largura de cada trecho é fixada
    (textLength), para o desenho não depender da fonte de cada sistema."""

    def __init__(self, largura, altura, corpo, alt):
        self.largura, self.altura, self.corpo, self.alt = largura, altura, corpo, alt
        self.ch = round(corpo * 0.6, 2)
        self.pecas, self.estilo = [], []
        self.serie = 0

    def texto(self, x, y, s, cor=TEXTO, negrito=False, classe=None):
        if s.strip():
            classes = " ".join(c for c in ("n" if negrito else "", classe or "") if c)
            extra = f' class="{classes}"' if classes else ""
            self.pecas.append(
                f'<text x="{x:.1f}" y="{y}" fill="{cor}" textLength="{len(s) * self.ch:.1f}" '
                f'lengthAdjust="spacing" xml:space="preserve"{extra}>{escape(s)}</text>'
            )
        return x + len(s) * self.ch

    def selo(self, x, y, s="CSR"):
        largura = (len(s) + 2) * self.ch
        topo, alto = y - self.corpo, self.corpo * 1.42
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{largura:.1f}" height="{alto:.1f}" fill="{LAVANDA}"/>')
        self.texto(x + self.ch, y, s, FUNDO, True)
        return x + largura

    # Os sinais são desenhados, não escritos: nem toda fonte monoespaçada os tem.
    def seta(self, x, y, cor=TEXTO):
        a = self.corpo
        self.pecas.append(f'<path d="M{x + 1:.1f} {y - a * .62:.1f}v{a * .56:.1f}l{a * .42:.1f} {-a * .28:.1f}z" fill="{cor}"/>')
        return x + 2 * self.ch

    def prompt(self, x, y, cor=TEXTO):
        a = self.corpo
        self.pecas.append(
            f'<path d="M{x + 1.5:.1f} {y - a * .66:.1f}l{a * .3:.1f} {a * .3:.1f}l{-a * .3:.1f} {a * .3:.1f}" '
            f'fill="none" stroke="{cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        )
        return x + 2 * self.ch

    def bola(self, x, y, cor):
        self.pecas.append(f'<circle cx="{x + self.ch / 2:.1f}" cy="{y - self.corpo * .33:.1f}" r="{self.corpo * .27:.1f}" fill="{cor}"/>')
        return x + 2 * self.ch

    def certo(self, x, y):
        a = self.corpo
        self.pecas.append(
            f'<path d="M{x + .8:.1f} {y - a * .32:.1f}l{a * .17:.1f} {a * .2:.1f}l{a * .32:.1f} {-a * .5:.1f}" '
            f'fill="none" stroke="{VERDE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        )
        return x + 2 * self.ch

    def errado(self, x, y):
        a = self.corpo
        self.pecas.append(
            f'<path d="M{x + 1:.1f} {y - a * .6:.1f}l{a * .42:.1f} {a * .5:.1f}m0 {-a * .5:.1f}l{-a * .42:.1f} {a * .5:.1f}" '
            f'fill="none" stroke="{VERMELHO}" stroke-width="1.6" stroke-linecap="round"/>'
        )
        return x + 2 * self.ch

    def barra(self, x, y, cheio, total, cor, atraso=None):
        """Uma barra de uso. Com `atraso`, a parte cheia cresce da esquerda, uma vez."""
        alto, topo = self.corpo * .8, y - self.corpo * .72
        classe = ""
        if atraso is not None:
            classe = f' class="{self.regra(f"transform-box:fill-box;transform-origin:left center;animation:encher .9s {atraso:.2f}s both")}"'
            self.quadro_chave("encher", "from{transform:scaleX(0)}to{transform:scaleX(1)}")
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{total * self.ch:.1f}" height="{alto:.1f}" fill="{TRACO}"/>')
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{cheio * self.ch:.1f}" height="{alto:.1f}" fill="{cor}"{classe}/>')
        return x + total * self.ch

    def colunas(self, x, y, valores, cor):
        """O gráfico dos últimos turnos: uma coluna por turno, na escala do maior."""
        alto = self.corpo * .95
        for i, valor in enumerate(valores):
            h = max(1.5, alto * valor)
            self.pecas.append(f'<rect x="{x + i * self.ch:.1f}" y="{y + 1 - h:.1f}" width="{self.ch + .3:.1f}" height="{h:.1f}" fill="{cor}"/>')
        return x + len(valores) * self.ch

    def sobe(self, x, y, cor=CINZA):
        a = self.corpo
        self.pecas.append(f'<path d="M{x + .6:.1f} {y - a * .08:.1f}h{a * .56:.1f}l{-a * .28:.1f} {-a * .5:.1f}z" fill="{cor}"/>')
        return x + 2 * self.ch

    def regra(self, declaracoes):
        """Uma classe nova com essas declarações de CSS; devolve o nome dela."""
        self.serie += 1
        nome = f"c{self.serie}"
        self.estilo.append(f".{nome}{{{declaracoes}}}")
        return nome

    def quadro_chave(self, nome, passos):
        regra = f"@keyframes {nome}{{{passos}}}"
        if regra not in self.estilo:
            self.estilo.append(regra)

    def surge(self, atraso):
        """A classe de um trecho que aparece, uma vez, depois de `atraso` segundos."""
        self.quadro_chave("surgir", "from{opacity:0}to{opacity:1}")
        return self.regra(f"animation:surgir .4s {atraso:.2f}s both")

    def quadros(self, desenhos, tempo, inicio=1.2):
        """Um desenho por vez, na ordem. O último é o que fica, e o que aparece parado."""
        n = len(desenhos)
        for k, desenhar in enumerate(desenhos):
            self.serie += 1
            nome = f"q{self.serie}"
            self.abrir(nome)
            desenhar()
            self.fechar()
            de, ate = 100 * k / (n - 1), 100 * (k + 1) / (n - 1)
            if k == n - 1:
                passos = "0%,99.8%{opacity:0}100%{opacity:1}"
            elif k == 0:
                passos = f"0%,{ate - .2:.2f}%{{opacity:1}}{ate:.2f}%,100%{{opacity:0}}"
            else:
                passos = f"0%,{de - .2:.2f}%{{opacity:0}}{de:.2f}%,{ate - .2:.2f}%{{opacity:1}}{ate:.2f}%,100%{{opacity:0}}"
            self.estilo.append(f".{nome}{{opacity:{1 if k == n - 1 else 0};animation:{nome} {tempo * (n - 1):.1f}s {inicio}s both}}@keyframes {nome}{{{passos}}}")

    def risco(self, x1, y1, x2, y2, cor=TRACO):
        self.pecas.append(f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{cor}" stroke-width="1"/>')

    def borrao(self, x, y, largura, cor=TRACO):
        """Uma linha de texto reduzida a uma barra: a conversa, sem o que foi dito."""
        self.pecas.append(f'<rect x="{x}" y="{y - self.corpo * .6:.1f}" width="{largura}" height="{self.corpo * .5:.1f}" rx="2" fill="{cor}"/>')

    def linha(self, x, y, *trechos, atraso=None):
        """Trechos em sequência: (texto, cor, negrito) ou o nome de um sinal. Com
        `atraso`, a linha inteira aparece depois desse tempo."""
        if atraso is not None:
            self.abrir(self.surge(atraso))
        for trecho in trechos:
            if trecho == "seta":
                x = self.seta(x, y)
            elif trecho == "sobe":
                x = self.sobe(x, y)
            elif trecho[0] == "colunas":
                x = self.colunas(x, y, *trecho[1:])
            elif trecho == "certo":
                x = self.certo(x, y)
            elif trecho == "errado":
                x = self.errado(x, y)
            elif trecho == "rodando":
                x = self.bola(x, y, LAVANDA)
            elif trecho[0] == "barra":
                x = self.barra(x, y, *trecho[1:])
            elif isinstance(trecho, str):
                x = self.texto(x, y, trecho)
            else:
                x = self.texto(x, y, *trecho)
        if atraso is not None:
            self.fechar()
        return x

    def abrir(self, classe):
        self.pecas.append(f'<g class="{classe}">')

    def fechar(self):
        self.pecas.append("</g>")

    def svg(self):
        estilo = "\n".join(self.estilo)
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.largura} {self.altura}" '
            f'width="{self.largura}" height="{self.altura}" role="img" aria-label="{escape(self.alt)}">\n'
            f"<title>{escape(self.alt)}</title>\n"
            f'<style>\ntext{{font:{self.corpo}px {FONTE};white-space:pre}}\n.n{{font-weight:700}}\n{estilo}\n'
            "@media (prefers-reduced-motion:reduce){*{animation:none!important}}\n</style>\n"
            f'<clipPath id="cartao"><rect width="{self.largura}" height="{self.altura}" rx="10"/></clipPath>\n'
            f'<g clip-path="url(#cartao)">\n<rect width="{self.largura}" height="{self.altura}" fill="{FUNDO}"/>\n'
            + "\n".join(self.pecas)
            + "\n</g>\n"
            # Um fio na borda, para o cartão não sumir no tema escuro do GitHub.
            f'<rect x=".5" y=".5" width="{self.largura - 1}" height="{self.altura - 1}" rx="9.5" fill="none" stroke="{TRACO}"/>\n'
            "</svg>\n"
        )


def resumo(descricao, limite):
    """A descrição do catálogo sem o prefixo ("Exemplo de skill: ..."), numa frase curta."""
    frase = descricao.split(": ", 1)[-1].split(". ")[0].rstrip(".")
    if len(frase) <= limite:
        return frase
    return frase[: limite - 1].rsplit(" ", 1)[0].rstrip(",;") + "…"


def kit():
    catalogo = json.loads((RAIZ / ".claude-plugin" / "marketplace.json").read_text())["plugins"]
    margem, passo = 28, 23
    tela = Tela(860, 198 + passo * len(catalogo), 13, "claude-code-kit: dois comandos para instalar e o catálogo de mods, skills, agentes, hooks, estilos e temas")
    ch = tela.ch

    x = tela.selo(margem, 44)
    tela.texto(x + ch, 44, "claude-code-kit", TEXTO, True)
    tela.texto(margem, 67, "mods · skills · agentes · hooks · estilos de saída · temas", CINZA)
    tela.risco(margem, 84, tela.largura - margem, 84)

    comandos = ["claude plugin marketplace add cesarschutz/claude-code-kit", "claude plugin install csr-cockpit@cesarschutz"]
    inicio = 0.4
    for i, comando in enumerate(comandos):
        y = 116 + i * passo
        fim_x = tela.texto(tela.prompt(margem, y, LAVANDA), y, comando)
        # O comando é "digitado": uma tampa da cor do fundo sai da frente, letra por letra.
        largura, duracao = len(comando) * ch + 4, len(comando) * 0.03
        tela.pecas.append(f'<rect class="tampa t{i}" x="{margem + 2 * ch - 1:.1f}" y="{y - 13}" width="{largura:.1f}" height="19" fill="{FUNDO}"/>')
        tela.estilo.append(
            f".t{i}{{transform:translateX({largura:.1f}px);animation:t{i} {duracao:.2f}s steps({len(comando)}) {inicio:.2f}s both}}"
            f"@keyframes t{i}{{from{{transform:translateX(0)}}to{{transform:translateX({largura:.1f}px)}}}}"
        )
        inicio += duracao + 0.35

    tela.estilo.append("@keyframes surgir{from{opacity:0}to{opacity:1}}")
    for i, item in enumerate(catalogo):
        y = 186 + i * passo
        tela.abrir(f"item i{i}")
        x = tela.seta(margem, y, CINZA)
        tela.texto(x, y, item["name"], TEXTO, i == 0)
        tela.texto(margem + 27 * ch, y, item.get("category", "plugin"), LAVANDA if i == 0 else CINZA)
        tela.texto(margem + 36 * ch, y, resumo(item["description"], 66), CINZA)
        tela.fechar()
        tela.estilo.append(f".i{i}{{animation:surgir .35s {inicio + i * 0.09:.2f}s both}}")
    return tela.svg()


ABAS = ["Agentes", "Diffs", "Contexto", "Arquivos", "Turnos"]

# O corpo de cada aba, com os números de uma sessão de verdade num projeto de exemplo.
CORPOS = [
    [
        [("Rodando (2)", LAVANDA, True)],
        ["seta", ("Explore ", TEXTO, True), "rodando", ("haiku-4-5 · 6,4s · contexto 11,2k · US$ 0,02", CINZA)],
        ["  Listar funções em src/carrinho.js"],
        [("  Read src/carrinho.js", CINZA)],
        ["seta", ("Explore ", TEXTO, True), "rodando", ("haiku-4-5 · 5,6s · contexto 11,2k · US$ 0,01", CINZA)],
        ["  Analisar cobertura dos testes"],
        [('  Bash find . -type f -name "*.test.*"', CINZA)],
        [],
        [("Concluídos (0)", TEXTO, True)],
        [("Nenhum subagente concluído.", CINZA)],
    ],
    [
        [("Turno 2 · 1 edição em 1 arquivo", TEXTO, True)],
        [],
        [("src/carrinho.js", TEXTO, True), ("  +1 −1  Edit", CINZA)],
        [("@@ -9,7 +9,7 @@", CINZA)],
        [("   9 ", CINZA), "      return valor"],
        [("  10 ", CINZA), "    }"],
        [("  12 ", CINZA), ("−   return valor - valor * 0.01", VERMELHO)],
        [("  12 ", CINZA), ("+   return valor - valor * 0.1", VERDE)],
        [("  13 ", CINZA), "  }"],
    ],
    [
        [("22%", LARANJA, True), (" do contexto   ", CINZA), ("44,8k / 200k", TEXTO, True)],
        [("barra", 11, 48, LARANJA)],
        [],
        [("Custo", TEXTO, True)],
        [("Sessão        ", CINZA), ("US$ 0,15", TEXTO, True)],
        [("Último turno  ", CINZA), ("US$ 0,02", TEXTO, True)],
        [],
        [("Limite de uso", TEXTO, True)],
        [("5 h      ", CINZA), ("17%  ", TEXTO, True), ("barra", 4, 24, LAVANDA), ("  renova em 2h50", CINZA)],
        [("7 dias   ", CINZA), ("64%  ", TEXTO, True), ("barra", 15, 24, LAVANDA), ("  renova em 45h50", CINZA)],
    ],
    [
        [("Arquivos lidos (4)", TEXTO, True)],
        [("  1× ", CINZA), "README.md", (" · principal", CINZA)],
        [("  3× ", CINZA), "src/carrinho.js", (" · Explore, principal", CINZA)],
        [("  1× ", CINZA), "test/carrinho.test.js", (" · Explore", CINZA)],
        [],
        [("Comandos Bash (8)", TEXTO, True)],
        ["seta", "npm test ", "certo", ("0,5s", CINZA)],
        ["seta", "find test -type f | sort ", "certo", ("0,1s · Explore", CINZA)],
        ["seta", "tree test -L 3 ", "errado", ("exit 127 · 0,0s · Explore", CINZA)],
        ["seta", "npm test ", "errado", ("exit 1 · 0,5s", CINZA)],
    ],
    [
        [("Turnos (3)", TEXTO, True), (" · US$ 0,15 na sessão", CINZA)],
        [],
        ["seta", "Turno 3 ", ("7,5s", CINZA)],
        ["  Acrescente ao README.md uma linha dizendo que o cupom…"],
        [("  +1,1k de contexto · US$ 0,02 · 2 ferramentas · 1 edição", CINZA)],
        [],
        ["seta", "Turno 1 ", ("27s", CINZA), (" · 2 falhas", VERMELHO)],
        ["  Rode 2 agentes Explore ao mesmo tempo, em segundo…"],
        [("  US$ 0,11 · 13 ferramentas · 2 retornos de agentes", CINZA)],
    ],
]


def barra_de_abas(tela, x, y, ativa):
    for i, nome in enumerate(ABAS):
        rotulo = f"{i + 1}: {nome}"
        if i == ativa:
            fim = tela.texto(x, y, rotulo, LARANJA, True)
            tela.risco(x, y + 3, fim, y + 3, LARANJA)
        else:
            fim = tela.texto(tela.texto(x, y, str(i + 1), LAVANDA), y, f": {nome}", CINZA)
        x = fim + 2 * tela.ch


def cockpit():
    tela = Tela(860, 396, 12, "A tela do Claude Code com o csr-cockpit: a conversa à esquerda, o painel com cinco abas à direita e a linha de resumo acima do prompt")
    ch, passo = tela.ch, 20
    esquerda, divisa, painel, direita = 24, 392, 408, 836

    # A conversa, sem o que foi dito: só o desenho de um pedido, uma resposta e uma edição.
    tela.borrao(tela.prompt(esquerda, 38, CINZA), 38, 250, "#6e6e6e")
    y = 70
    for larguras in ([300, 240], [330, 280, 120]):
        tela.bola(esquerda, y, TEXTO)
        for largura in larguras:
            tela.borrao(esquerda + 2 * ch, y, largura)
            y += passo
        y += 12
    tela.bola(esquerda, y, VERDE)
    tela.borrao(esquerda + 2 * ch, y, 150, "#6e6e6e")
    tela.borrao(esquerda + 4 * ch, y + passo, 210, "#5d3540")
    tela.borrao(esquerda + 4 * ch, y + 2 * passo, 200, "#2f5a3a")

    # A linha de resumo e o prompt.
    x = tela.selo(esquerda, 318)
    x = tela.texto(x + ch, 318, "Cockpit", TEXTO, True)
    tela.texto(x + 2 * ch, 318, "contexto 22% · US$ 0,15 (+0,02)", LAVANDA)
    tela.risco(esquerda, 340, direita, 340)
    tela.prompt(esquerda, 362)
    tela.pecas.append(f'<rect x="{esquerda + 2 * ch:.1f}" y="351" width="{ch:.1f}" height="14" fill="{TEXTO}"/>')
    tela.risco(esquerda, 376, direita, 376)
    tela.risco(divisa, 16, divisa, 326, LAVANDA)

    # O painel: a marca e, para cada aba, a barra de abas e o corpo. Uma aba por vez.
    x = tela.selo(painel, 38)
    tela.texto(x + ch, 38, "Cockpit", TEXTO, True)
    tela.risco(painel, 70, direita, 70)
    tempo, total = 2.6, 2.6 * (len(ABAS) + 1)
    for n, corpo in enumerate(CORPOS):
        tela.abrir(f"aba a{n}")
        barra_de_abas(tela, painel, 58, n)
        for k, trechos in enumerate(corpo):
            tela.linha(painel, 98 + k * passo, *trechos)
        tela.fechar()
        # Cada aba fica 2,6 s; a volta termina em Agentes, que é também o desenho parado.
        de, ate = 100 * n / (len(ABAS) + 1), 100 * (n + 1) / (len(ABAS) + 1)
        if n == 0:
            quadros = f"0%,{ate - .2:.2f}%{{opacity:1}}{ate:.2f}%,{100 * len(ABAS) / (len(ABAS) + 1) - .2:.2f}%{{opacity:0}}{100 * len(ABAS) / (len(ABAS) + 1):.2f}%,100%{{opacity:1}}"
        else:
            quadros = f"0%,{de - .2:.2f}%{{opacity:0}}{de:.2f}%,{ate - .2:.2f}%{{opacity:1}}{ate:.2f}%,100%{{opacity:0}}"
        tela.estilo.append(f".a{n}{{opacity:{1 if n == 0 else 0};animation:a{n} {total:.1f}s 1.2s both}}@keyframes a{n}{{{quadros}}}")
    return tela.svg()


PASSO = 21


def painel(ativa, linhas, alt):
    """Só o painel, numa aba: a marca, a barra de abas e espaço para `linhas` linhas."""
    tela = Tela(760, 108 + PASSO * (linhas - 1) + 26, 13, alt)
    margem = 24
    x = tela.selo(margem, 40)
    tela.texto(x + tela.ch, 40, "Cockpit", TEXTO, True)
    barra_de_abas(tela, margem, 62, ativa)
    tela.risco(margem, 76, tela.largura - margem, 76)
    return tela, margem, 108


def corpo(tela, x, y, linhas, atrasos=None):
    for k, trechos in enumerate(linhas):
        tela.linha(x, y + k * PASSO, *trechos, atraso=(atrasos or {}).get(k))


def aba_agentes():
    """Dois agentes do começo ao fim: iniciando, trabalhando e concluídos."""
    def agente(sinal, numeros, tarefa, atividade):
        return [["seta", ("Explore ", TEXTO, True), sinal, (numeros, CINZA)], [f"  {tarefa}"], [(f"  {atividade}", CINZA)]]

    vazio = [[], [("Concluídos (0)", TEXTO, True)], [("Nenhum subagente concluído.", CINZA)]]
    rodando = [[("Rodando (2)", LAVANDA, True)]]
    etapas = [
        rodando
        + agente("rodando", "haiku-4-5 · 2,1s", "Listar funções em src/carrinho.js", "iniciando")
        + agente("rodando", "haiku-4-5 · 1,4s", "Analisar cobertura dos testes", "iniciando")
        + vazio,
        rodando
        + agente("rodando", "haiku-4-5 · 6,4s · contexto 11,2k · US$ 0,02 · 1 chamada", "Listar funções em src/carrinho.js", "Read src/carrinho.js")
        + agente("rodando", "haiku-4-5 · 5,6s · contexto 11,2k · US$ 0,01 · 1 chamada", "Analisar cobertura dos testes", 'Bash find . -type f -name "*.test.*" -o -name "*.spec.*" | head -20')
        + vazio,
        [[("Rodando (0)", LAVANDA, True)], [("Nenhum subagente rodando.", CINZA)], [], [("Concluídos (2)", TEXTO, True)]]
        + agente("certo", "haiku-4-5 · 28s · contexto 16,4k · US$ 0,04 · 9 chamadas · 141,2k tokens", "Analisar cobertura dos testes", "## Resumo da Exploração da Pasta de Testes")
        + agente("certo", "haiku-4-5 · 7,5s · contexto 13,3k · US$ 0,02 · 1 chamada · 24,5k tokens", "Listar funções em src/carrinho.js", "## Funções no arquivo `src/carrinho.js`"),
    ]
    tela, x, y = painel(0, 10, "Aba Agentes: dois subagentes começam, trabalham e terminam, cada um com modelo, tempo, contexto, custo e chamadas")
    tela.quadros([lambda etapa=etapa: corpo(tela, x, y, etapa) for etapa in etapas], 2.6)
    return tela.svg()


def aba_diffs():
    linhas = [
        [("Turno 2 · 1 edição em 1 arquivo", TEXTO, True)],
        [("[ 1 ]", TEXTO, True)],
        [],
        [("src/carrinho.js", TEXTO, True), ("  +1 −1  Edit", CINZA)],
        [("@@ -9,7 +9,7 @@", CINZA)],
        [("   9 ", CINZA), "      return valor"],
        [("  10 ", CINZA), "    }"],
        [("  11 ", CINZA)],
        [("  12 ", CINZA), ("−   return valor - valor * 0.01", VERMELHO)],
        [("  12 ", CINZA), ("+   return valor - valor * 0.1", VERDE)],
        [("  13 ", CINZA), "  }"],
        [("  14 ", CINZA)],
        [("  15 ", CINZA), "  export const frete = valor => (valor >= FRETE_GRATIS_A_PARTIR_DE ? 0 : FRETE)"],
        [],
        [("[ Anterior (p) ] [ Próximo (n) ] [ Turno anterior (t) ]", TEXTO, True)],
    ]
    tela, x, y = painel(1, len(linhas), "Aba Diffs: a edição de um arquivo, com a linha que saiu em vermelho e a que entrou em verde")
    corpo(tela, x, y, linhas, {8: 1.0, 9: 1.9})
    return tela.svg()


def aba_contexto():
    linhas = [
        [("22%", LARANJA, True), (" do contexto   ", CINZA), ("44,8k / 200k", TEXTO, True)],
        [("barra", 11, 48, LARANJA, 0.6)],
        [],
        [("Últimos 12 turnos", TEXTO, True)],
        [("colunas", [.93, .95, .97, .975, 1], LARANJA), "  ", "sobe", ("+1,1k no último turno", CINZA)],
        [],
        [("Custo", TEXTO, True)],
        [("Sessão        ", CINZA), ("US$ 0,15", TEXTO, True)],
        [("Último turno  ", CINZA), ("US$ 0,02", TEXTO, True)],
        [],
        [("Limite de uso", TEXTO, True)],
        [("5 h      ", CINZA), ("17%  ", TEXTO, True), ("barra", 4, 24, LAVANDA, 1.1), ("  renova em 2h50", CINZA)],
        [("7 dias   ", CINZA), ("64%  ", TEXTO, True), ("barra", 15, 24, LAVANDA, 1.4), ("  renova em 45h50", CINZA)],
        [],
        [("Detalhamento do contexto", TEXTO, True)],
        [("Estimativa atualizada a cada turno, sem requisição extra.", CINZA)],
        [],
        [("49,8k de 200k · claude-haiku-4-5-20251001 · estimativa do turno 3", CINZA)],
        [],
        [("Ocupando a janela", CINZA)],
        ["  38,8k  System tools"],
        ["   7,9k  System prompt"],
        ["     2k  Skills"],
        ["   1,1k  MCP server instructions"],
        ["     22  Messages"],
        [],
        [("[ Contagem exata ]", TEXTO, True)],
    ]
    tela, x, y = painel(2, len(linhas), "Aba Contexto: percentual usado, gráfico dos turnos, custo, limite de uso e detalhamento por categoria")
    corpo(tela, x, y, linhas)
    return tela.svg()


def aba_arquivos():
    comandos = [
        ["seta", "npm test ", "certo", ("0,5s", CINZA)],
        ["seta", 'find src -type f -name "*.js" ', "certo", ("0,1s · Explore", CINZA)],
        ["seta", "find test -type d ", "certo", ("0,1s · Explore", CINZA)],
        ["seta", "tree test -L 3 ", "errado", ("exit 127 · 0,0s · Explore", CINZA)],
        ["seta", "find test -type f | sort ", "certo", ("0,1s · Explore", CINZA)],
        ["seta", "ls -la ", "certo", ("0,0s · Explore", CINZA)],
        ["seta", 'find . -type f -name "*.test.*" -o -name "*.spec.*" | head -20 ', "certo", ("0,1s · Explore", CINZA)],
        ["seta", "npm test ", "errado", ("exit 1 · 0,5s", CINZA)],
    ]
    linhas = [
        ["Filtro: ", ("trecho do caminho ou do comando", CINZA)],
        [],
        [("Arquivos lidos (4)", TEXTO, True)],
        [("  1× ", CINZA), "README.md", (" · principal", CINZA)],
        [("  3× ", CINZA), "src/carrinho.js", (" · Explore, principal", CINZA)],
        [("  1× ", CINZA), "src/precos.js", (" · Explore", CINZA)],
        [("  1× ", CINZA), "test/carrinho.test.js", (" · Explore", CINZA)],
        [],
        [("Comandos Bash (8)", TEXTO, True)],
    ] + comandos
    tela, x, y = painel(3, len(linhas), "Aba Arquivos: arquivos lidos, com quem leu, e comandos Bash com sucesso em verde e falha em vermelho")
    # O mais recente fica em cima: os comandos entram de baixo para cima, na ordem em que rodaram.
    primeiro = len(linhas) - len(comandos)
    corpo(tela, x, y, linhas, {primeiro + i: 0.6 + 0.3 * (len(comandos) - 1 - i) for i in range(len(comandos))})
    return tela.svg()


def aba_turnos():
    linhas = [
        [("Turnos (3)", TEXTO, True), (" · US$ 0,15 na sessão", CINZA)],
        [],
        ["seta", "Turno 3 ", ("7,5s", CINZA)],
        ["  Acrescente ao README.md uma linha dizendo que o cupom DEZ dá 10% de desconto."],
        [("  +1,1k de contexto · US$ 0,02 · 2 ferramentas · 1 edição", CINZA)],
        [],
        ["seta", "Turno 2 ", ("9,3s", CINZA)],
        ["  Corrija o desconto do cupom em src/carrinho.js e rode npm test de novo."],
        [("  +1,9k de contexto · US$ 0,02 · 3 ferramentas · 1 edição", CINZA)],
        [],
        ["seta", "Turno 1 ", ("27s", CINZA), (" · 2 falhas", VERMELHO)],
        ["  Rode 2 agentes Explore ao mesmo tempo, em segundo plano: um lista as funções de…"],
        [("  US$ 0,11 · 13 ferramentas · 2 retornos de agentes", CINZA)],
    ]
    tela, x, y = painel(4, len(linhas), "Aba Turnos: três turnos com duração, contexto somado, custo, ferramentas e falhas")
    # Do mais antigo (embaixo) ao mais recente (em cima).
    atrasos = {k: 0.6 for k in (10, 11, 12)} | {k: 1.5 for k in (6, 7, 8)} | {k: 2.4 for k in (2, 3, 4)}
    corpo(tela, x, y, linhas, atrasos)
    return tela.svg()


def detalhe_do_agente():
    chamadas = [
        ["certo", 'Bash find . -type f -name "*.test.*" -o -name "*.spec.*" | head -20', (" · 0,1s", CINZA)],
        ["certo", "Bash ls -la", (" · 0,0s", CINZA)],
        ["certo", "Bash find test -type f | sort", (" · 0,1s", CINZA)],
        ["errado", "Bash tree test -L 3", (" · 0,0s", CINZA)],
        ["certo", "Bash find test -type d", (" · 0,1s", CINZA)],
        ["certo", "Read test/carrinho.test.js", (" · 0,1s", CINZA)],
        ["certo", "Read src/carrinho.js", (" · 0,0s", CINZA)],
        ["certo", "Read src/precos.js", (" · 0,0s", CINZA)],
        ["certo", 'Bash find src -type f -name "*.js"', (" · 0,1s", CINZA)],
    ]
    linhas = [
        [("[ ‹ Voltar (v) ] [ Reler mensagens (m) ]", TEXTO, True)],
        [],
        ["certo", ("Explore", TEXTO, True), (" · haiku-4-5 · 28s · 9 chamadas", CINZA)],
        ["Analisar cobertura dos testes"],
        [],
        [("Contexto e custo", TEXTO, True)],
        ["Contexto do agente 16,4k · custo US$ 0,04"],
        [],
        [("Tokens", TEXTO, True)],
        ["Entrada 138,7k (128,5k lidos do cache) · saída 2,5k"],
        [],
        [("Pedido que o agente recebeu", TEXTO, True)],
        [("Explore a pasta test/. Identifique todos os arquivos de teste e resuma o que cada um…", CINZA)],
        [],
        [("Chamadas (9)", TEXTO, True)],
    ] + chamadas + [
        [],
        [("Resposta final", TEXTO, True)],
        [("Resumo da Exploração da Pasta de Testes", TEXTO, True)],
    ]
    tela, x, y = painel(0, len(linhas), "Detalhe de um agente: contexto e custo, tokens, o pedido que recebeu, as chamadas na ordem e a resposta final")
    atrasos = {15 + i: 0.6 + 0.28 * i for i in range(len(chamadas))}
    fim = 0.6 + 0.28 * len(chamadas) + 0.3
    corpo(tela, x, y, linhas, atrasos | {len(linhas) - 2: fim, len(linhas) - 1: fim})
    return tela.svg()


def linha_de_resumo():
    """A linha acima do prompt antes e depois de um turno: os parênteses são o que ele somou."""
    tela = Tela(900, 178, 12, "A linha de resumo acima do prompt: depois de um turno, os tokens e o custo trazem entre parênteses o que ele somou")
    margem, ch = 24, tela.ch
    tela.borrao(tela.prompt(margem, 34, CINZA), 34, 330, "#6e6e6e")
    for i, largura in enumerate((420, 300)):
        tela.abrir(tela.surge(1.4 + 0.5 * i))
        if i == 0:
            tela.bola(margem, 62, TEXTO)
        tela.borrao(margem + 2 * ch, 62 + 20 * i, largura)
        tela.fechar()
    x = tela.selo(margem, 114)
    x = tela.texto(x + ch, 114, "Cockpit", TEXTO, True) + 2 * ch
    resto = " · limite 5h 17%, 7d 64% · agentes 2 concluídos"
    antes = "contexto 21% · 43,7k tokens · US$ 0,13" + resto
    depois = "contexto 22% · 44,8k tokens (+1,1k) · US$ 0,15 (+0,02)" + resto
    tela.quadros([lambda: tela.texto(x, 114, antes, LAVANDA), lambda: tela.texto(x, 114, depois, LAVANDA)], 1.6, inicio=1.4)
    tela.risco(margem, 134, tela.largura - margem, 134)
    tela.prompt(margem, 155)
    tela.pecas.append(f'<rect x="{margem + 2 * ch:.1f}" y="144" width="{ch:.1f}" height="14" fill="{TEXTO}"/>')
    tela.risco(margem, 168, tela.largura - margem, 168)
    return tela.svg()


def selo(rotulo, destaque=False):
    """O tipo de uma peça, no formato do selo do cockpit."""
    corpo, ch = 12, 7.2
    largura = round((len(rotulo) + 2) * ch)
    cor = LAVANDA if destaque else "#b4b4b4"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} 20" width="{largura}" height="20" role="img" aria-label="{rotulo}">'
        f"<title>{rotulo}</title>"
        f'<rect width="{largura}" height="20" rx="3" fill="{cor}"/>'
        f'<text x="{ch}" y="14" fill="{FUNDO}" font-weight="700" textLength="{len(rotulo) * ch:.1f}" lengthAdjust="spacing" '
        f"style='font:700 {corpo}px {FONTE}'>{escape(rotulo)}</text></svg>\n"
    )


def aba(numero, nome):
    """Uma aba do painel, para o sumário do README do cockpit."""
    corpo, ch = 13, 7.8
    largura = round((len(nome) + 5) * ch)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} 28" width="{largura}" height="28" role="img" aria-label="{numero} {nome}">'
        f"<title>{numero} {nome}</title>"
        f'<rect x=".5" y=".5" width="{largura - 1}" height="27" rx="5" fill="{FUNDO}" stroke="{TRACO}"/>'
        f"<g style='font:{corpo}px {FONTE}'>"
        f'<text x="{ch * 1.5:.1f}" y="18.5" fill="{LAVANDA}" font-weight="700" textLength="{ch}" lengthAdjust="spacing">{numero}</text>'
        f'<text x="{ch * 3.5:.1f}" y="18.5" fill="{TEXTO}" textLength="{len(nome) * ch:.1f}" lengthAdjust="spacing">{escape(nome)}</text>'
        "</g></svg>\n"
    )


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    arquivos = {
        "kit.svg": kit(),
        "cockpit.svg": cockpit(),
        "painel-agentes.svg": aba_agentes(),
        "painel-diffs.svg": aba_diffs(),
        "painel-contexto.svg": aba_contexto(),
        "painel-arquivos.svg": aba_arquivos(),
        "painel-turnos.svg": aba_turnos(),
        "painel-agente.svg": detalhe_do_agente(),
        "linha-de-resumo.svg": linha_de_resumo(),
    }
    for tipo in ("mod", "skill", "agente", "hook", "estilo", "tema", "pacote"):
        arquivos[f"selo-{tipo}.svg"] = selo(tipo, tipo == "mod")
    for i, nome in enumerate(ABAS):
        arquivos[f"aba-{i + 1}.svg"] = aba(i + 1, nome)
    for nome, conteudo in arquivos.items():
        (SAIDA / nome).write_text(conteudo)
        print(f"docs/arte/{nome}")


if __name__ == "__main__":
    main()

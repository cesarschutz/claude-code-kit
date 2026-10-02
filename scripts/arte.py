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

    def barra(self, x, y, cheio, total, cor):
        alto, topo = self.corpo * .8, y - self.corpo * .72
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{total * self.ch:.1f}" height="{alto:.1f}" fill="{TRACO}"/>')
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{cheio * self.ch:.1f}" height="{alto:.1f}" fill="{cor}"/>')
        return x + total * self.ch

    def risco(self, x1, y1, x2, y2, cor=TRACO):
        self.pecas.append(f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{cor}" stroke-width="1"/>')

    def borrao(self, x, y, largura, cor=TRACO):
        """Uma linha de texto reduzida a uma barra: a conversa, sem o que foi dito."""
        self.pecas.append(f'<rect x="{x}" y="{y - self.corpo * .6:.1f}" width="{largura}" height="{self.corpo * .5:.1f}" rx="2" fill="{cor}"/>')

    def linha(self, x, y, *trechos):
        """Trechos em sequência: (texto, cor, negrito) ou o nome de um sinal."""
        for trecho in trechos:
            if trecho == "seta":
                x = self.seta(x, y)
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
        x = painel
        for i, nome in enumerate(ABAS):
            rotulo = f"{i + 1}: {nome}"
            if i == n:
                fim = tela.texto(x, 58, rotulo, LARANJA, True)
                tela.risco(x, 61, fim, 61, LARANJA)
            else:
                fim = tela.texto(tela.texto(x, 58, str(i + 1), LAVANDA), 58, f": {nome}", CINZA)
            x = fim + 2 * ch
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
    arquivos = {"kit.svg": kit(), "cockpit.svg": cockpit()}
    for tipo in ("mod", "skill", "agente", "hook", "estilo", "tema", "pacote"):
        arquivos[f"selo-{tipo}.svg"] = selo(tipo, tipo == "mod")
    for i, nome in enumerate(ABAS):
        arquivos[f"aba-{i + 1}.svg"] = aba(i + 1, nome)
    for nome, conteudo in arquivos.items():
        (SAIDA / nome).write_text(conteudo)
        print(f"docs/arte/{nome}")


if __name__ == "__main__":
    main()

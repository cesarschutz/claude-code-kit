#!/usr/bin/env python3
"""Gera a arte dos READMEs em docs/arte/: o cartão do kit (com o catálogo lido de
.claude-plugin/marketplace.json), os selos de tipo e as abas do Lens.

    python3 scripts/arte.py

Rode de novo depois de mexer no catálogo. Os SVGs são imagens: o GitHub não deixa usar
CSS no README, mas deixa dentro de um SVG. Sem fonte externa, sem script, uma passada de
animação só, e parados para quem pede menos movimento. As cores são variáveis CSS, com
um valor para o tema claro e outro, num @media (prefers-color-scheme: dark), para o
escuro: cada imagem segue o tema de quem a vê.
"""
import json
import pathlib
from xml.sax.saxutils import escape

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "docs" / "arte"
import sys  # noqa: E402
import unicodedata  # noqa: E402

sys.path.insert(0, str(RAIZ / "scripts"))
from temas import fixar_tema  # noqa: E402

# A paleta, nos dois temas. No SVG, cada cor é uma variável (var(--nome)).
TEMAS = {
    "claro": {
        "fundo": "#f6f8fa",
        "texto": "#1f2328",
        "cinza": "#636c76",
        "traco": "#d0d7de",
        "lavanda": "#5769f7",
        "laranja": "#bc4c00",
        "verde": "#1a7f37",
        "vermelho": "#cf222e",
        "selo": "#dde0ea",
        "selo-forte": "#c9cff7",
        "selo-texto": "#1f2328",
    },
    "escuro": {
        "fundo": "#262626",
        "texto": "#e8e8e8",
        "cinza": "#999999",
        "traco": "#4a4a4a",
        "lavanda": "#b1b9f9",
        "laranja": "#d77757",
        "verde": "#4eba65",
        "vermelho": "#ff6b80",
        "selo": "#b4b4b4",
        "selo-forte": "#b1b9f9",
        "selo-texto": "#262626",
    },
}
FUNDO, TEXTO, CINZA, TRACO = "var(--fundo)", "var(--texto)", "var(--cinza)", "var(--traco)"
LAVANDA, LARANJA, VERDE, VERMELHO = "var(--lavanda)", "var(--laranja)", "var(--verde)", "var(--vermelho)"
FONTE = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'


def variaveis() -> str:
    """As regras das variáveis: o claro por padrão, o escuro no @media."""
    claro = ";".join(f"--{nome}:{cor}" for nome, cor in TEMAS["claro"].items())
    escuro = ";".join(f"--{nome}:{cor}" for nome, cor in TEMAS["escuro"].items())
    return f":root{{color-scheme:light dark;{claro}}}@media (prefers-color-scheme: dark){{:root{{{escuro}}}}}"


class Tela:
    """Um cartão com texto monoespaçado, no visual de um terminal. A largura de
    cada trecho é fixada (textLength), para o desenho não depender da fonte de
    cada sistema. As cores vão em style, para aceitarem as variáveis do tema."""

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
                f'<text x="{x:.1f}" y="{y}" style="fill:{cor}" textLength="{len(s) * self.ch:.1f}" '
                f'lengthAdjust="spacing" xml:space="preserve"{extra}>{escape(s)}</text>'
            )
        return x + len(s) * self.ch

    def selo(self, x, y, s="CSR"):
        largura = (len(s) + 2) * self.ch
        topo, alto = y - self.corpo, self.corpo * 1.42
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{largura:.1f}" height="{alto:.1f}" style="fill:{LAVANDA}"/>')
        self.texto(x + self.ch, y, s, FUNDO, True)
        return x + largura

    # Os sinais são desenhados, não escritos: nem toda fonte monoespaçada os tem.
    def seta(self, x, y, cor=TEXTO):
        a = self.corpo
        self.pecas.append(f'<path d="M{x + 1:.1f} {y - a * .62:.1f}v{a * .56:.1f}l{a * .42:.1f} {-a * .28:.1f}z" style="fill:{cor}"/>')
        return x + 2 * self.ch

    def prompt(self, x, y, cor=TEXTO):
        a = self.corpo
        self.pecas.append(
            f'<path d="M{x + 1.5:.1f} {y - a * .66:.1f}l{a * .3:.1f} {a * .3:.1f}l{-a * .3:.1f} {a * .3:.1f}" '
            f'fill="none" style="stroke:{cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        )
        return x + 2 * self.ch

    def bola(self, x, y, cor):
        self.pecas.append(f'<circle cx="{x + self.ch / 2:.1f}" cy="{y - self.corpo * .33:.1f}" r="{self.corpo * .27:.1f}" style="fill:{cor}"/>')
        return x + 2 * self.ch

    def certo(self, x, y):
        a = self.corpo
        self.pecas.append(
            f'<path d="M{x + .8:.1f} {y - a * .32:.1f}l{a * .17:.1f} {a * .2:.1f}l{a * .32:.1f} {-a * .5:.1f}" '
            f'fill="none" style="stroke:{VERDE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        )
        return x + 2 * self.ch

    def errado(self, x, y):
        a = self.corpo
        self.pecas.append(
            f'<path d="M{x + 1:.1f} {y - a * .6:.1f}l{a * .42:.1f} {a * .5:.1f}m0 {-a * .5:.1f}l{-a * .42:.1f} {a * .5:.1f}" '
            f'fill="none" style="stroke:{VERMELHO}" stroke-width="1.6" stroke-linecap="round"/>'
        )
        return x + 2 * self.ch

    def barra(self, x, y, cheio, total, cor, atraso=None):
        """Uma barra de uso. Com `atraso`, a parte cheia cresce da esquerda, uma vez."""
        alto, topo = self.corpo * .8, y - self.corpo * .72
        classe = ""
        if atraso is not None:
            classe = f' class="{self.regra(f"transform-box:fill-box;transform-origin:left center;animation:encher .9s {atraso:.2f}s both")}"'
            self.quadro_chave("encher", "from{transform:scaleX(0)}to{transform:scaleX(1)}")
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{total * self.ch:.1f}" height="{alto:.1f}" style="fill:{TRACO}"/>')
        self.pecas.append(f'<rect x="{x:.1f}" y="{topo:.1f}" width="{cheio * self.ch:.1f}" height="{alto:.1f}" style="fill:{cor}"{classe}/>')
        return x + total * self.ch

    def colunas(self, x, y, valores, cor):
        """O gráfico dos últimos turnos: uma coluna por turno, na escala do maior."""
        alto = self.corpo * .95
        for i, valor in enumerate(valores):
            h = max(1.5, alto * valor)
            self.pecas.append(f'<rect x="{x + i * self.ch:.1f}" y="{y + 1 - h:.1f}" width="{self.ch + .3:.1f}" height="{h:.1f}" style="fill:{cor}"/>')
        return x + len(valores) * self.ch

    def sobe(self, x, y, cor=CINZA):
        a = self.corpo
        self.pecas.append(f'<path d="M{x + .6:.1f} {y - a * .08:.1f}h{a * .56:.1f}l{-a * .28:.1f} {-a * .5:.1f}z" style="fill:{cor}"/>')
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
        self.pecas.append(f'<path d="M{x1} {y1}L{x2} {y2}" style="stroke:{cor}" stroke-width="1"/>')

    def borrao(self, x, y, largura, cor=TRACO):
        """Uma linha de texto reduzida a uma barra: a conversa, sem o que foi dito."""
        self.pecas.append(f'<rect x="{x}" y="{y - self.corpo * .6:.1f}" width="{largura}" height="{self.corpo * .5:.1f}" rx="2" style="fill:{cor}"/>')

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
            f"<style>\n{variaveis()}\ntext{{font:{self.corpo}px {FONTE};white-space:pre}}\n.n{{font-weight:700}}\n{estilo}\n"
            "@media (prefers-reduced-motion:reduce){*{animation:none!important}}\n</style>\n"
            f'<clipPath id="cartao"><rect width="{self.largura}" height="{self.altura}" rx="10"/></clipPath>\n'
            f'<g clip-path="url(#cartao)">\n<rect width="{self.largura}" height="{self.altura}" style="fill:{FUNDO}"/>\n'
            + "\n".join(self.pecas)
            + "\n</g>\n"
            # Um fio na borda, para o cartão não sumir no fundo da página.
            f'<rect x=".5" y=".5" width="{self.largura - 1}" height="{self.altura - 1}" rx="9.5" fill="none" style="stroke:{TRACO}"/>\n'
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

    comandos = ["claude plugin marketplace add cesarschutz/claude-code-kit", "claude plugin install csr-lens@cesarschutz"]
    inicio = 0.4
    for i, comando in enumerate(comandos):
        y = 116 + i * passo
        tela.texto(tela.prompt(margem, y, LAVANDA), y, comando)
        # O comando é "digitado": uma tampa da cor do fundo sai da frente, letra por letra.
        largura, duracao = len(comando) * ch + 4, len(comando) * 0.03
        tela.pecas.append(f'<rect class="tampa t{i}" x="{margem + 2 * ch - 1:.1f}" y="{y - 13}" width="{largura:.1f}" height="19" style="fill:{FUNDO}"/>')
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


# As abas do painel, na ordem da barra, para os selos do sumário do README do
# Lens: nome, ícone, a cor da aba (a mesma de hooks/cores.ts, nos dois temas) e
# a tinta que contrasta com ela. As telas do painel saem do próprio mod:
# scripts/telas/telas.py.
ABAS = [
    ("Visão geral", "◉", "#0d80bf", "#ffffff"),
    ("Agentes", "◈", "#39c5cf", "#0d1117"),
    ("Turnos", "◷", "#a371f7", "#ffffff"),
    ("Diffs", "◧", "#3fb950", "#0d1117"),
    ("Árvore", "▤", "#f0883e", "#0d1117"),
    ("Contexto", "◔", "#58a6ff", "#0d1117"),
    ("Inventário", "▦", "#d29922", "#0d1117"),
]


def selo(rotulo, destaque=False):
    """O tipo de uma peça, no formato do selo do Lens."""
    corpo, ch = 12, 7.2
    largura = round((len(rotulo) + 2) * ch)
    cor = "var(--selo-forte)" if destaque else "var(--selo)"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} 20" width="{largura}" height="20" role="img" aria-label="{rotulo}">'
        f"<title>{rotulo}</title><style>{variaveis()}</style>"
        f'<rect width="{largura}" height="20" rx="3" style="fill:{cor}"/>'
        f"<text x='{ch}' y='14' style='fill:var(--selo-texto);font:700 {corpo}px {FONTE}' textLength='{len(rotulo) * ch:.1f}' lengthAdjust='spacing'>{escape(rotulo)}</text></svg>\n"
    )


def aba(numero, nome, icone, cor, tinta):
    """Uma aba do painel, como a aba aberta no app: uma pílula cheia na cor
    dela, com o ícone, o nome e a tecla numa caixinha. A cor vale nos dois
    temas, como no mod."""
    corpo, ch, alto = 13, 7.8, 28
    rotulo = f"{icone} {nome}"
    largura_do_rotulo = len(rotulo) * ch
    # O ícone, a folga, o rótulo, a folga e a caixinha da tecla.
    x_rotulo = 12
    x_tecla = x_rotulo + largura_do_rotulo + 8
    largura = round(x_tecla + 17 + 10)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {alto}" width="{largura}" height="{alto}" role="img" aria-label="{numero} {nome}">'
        f"<title>{numero} {nome}</title>"
        f'<rect width="{largura}" height="{alto}" rx="14" fill="{cor}"/>'
        f"<g style='font:700 {corpo}px {FONTE}'>"
        f'<text x="{x_rotulo}" y="18.5" fill="{tinta}" textLength="{largura_do_rotulo:.1f}" lengthAdjust="spacing" xml:space="preserve">{escape(rotulo)}</text>'
        f'<rect x="{x_tecla}" y="6.5" width="17" height="15" rx="4" fill="{tinta}" fill-opacity=".18"/>'
        f'<text x="{x_tecla + 8.5}" y="17.5" fill="{tinta}" font-size="11" text-anchor="middle">{numero}</text>'
        "</g></svg>\n"
    )


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    # O kit e os selos seguem o tema: uma versão clara e uma escura, que o
    # README escolhe com <picture> (o GitHub decide pelo tema da conta).
    com_tema = {"kit": kit()}
    for tipo in ("mod", "skill", "agente", "hook", "estilo", "tema", "pacote"):
        com_tema[f"selo-{tipo}"] = selo(tipo, tipo == "mod")
    arquivos = {}
    for nome, conteudo in com_tema.items():
        for tema in ("claro", "escuro"):
            arquivos[f"{nome}-{tema}.svg"] = fixar_tema(conteudo, tema)
    # As abas têm a cor fixa da aba, a mesma nos dois temas; o nome é o da aba
    # (com o número, o GitHub mostrava do cache a aba de antes da ordem nova).
    for i, (nome, icone, cor, tinta) in enumerate(ABAS):
        chave = unicodedata.normalize("NFD", nome.lower()).encode("ascii", "ignore").decode().replace(" ", "-")
        arquivos[f"aba-{chave}.svg"] = aba(i + 1, nome, icone, cor, tinta)
    for velho in SAIDA.glob("*.svg"):
        if velho.name not in arquivos:
            velho.unlink()
            print(f"removido: docs/arte/{velho.name}")
    for nome, conteudo in arquivos.items():
        (SAIDA / nome).write_text(conteudo)
        print(f"docs/arte/{nome}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""As telas do csr-lens para o README (SVG) e para o blog (PNG).

Roda o próprio mod com o cenário de scripts/telas/cenario.test.tsx (uma sessão
neste repositório), pega o que cada aba desenha e monta cada tela em HTML, no
visual do app Desktop (ou do terminal). O Chrome, sem janela, mede a tela e
onde ficam as marcas numeradas que explicam cada parte; daí saem o SVG (o HTML
dentro de um foreignObject, com os gráficos embutidos como imagem) e o PNG.

Cada tela sai em duas versões, <nome>-claro.svg e <nome>-escuro.svg (o README
escolhe com <picture>, pelo tema da conta do GitHub): o estilo traz os dois
temas e scripts/temas.py fixa um deles, também dentro dos gráficos do mod
embutidos como imagem. As telas do terminal são sempre escuras.

    python3 scripts/telas/telas.py                 # SVG em docs/arte/telas/
    python3 scripts/telas/telas.py --png <pasta>   # e os PNG (2x), claro e escuro
    python3 scripts/telas/telas.py --apenas agentes,terminal-turnos   # só estas
    python3 scripts/telas/telas.py --sem-marcas <pasta>   # sem as marcas numeradas (o blog)

Pede o `claude` (para o `claude plugin test`) e o Google Chrome.
"""

from __future__ import annotations

import base64
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "scripts"))
from temas import fixar_tema  # noqa: E402
PLUGIN = RAIZ / "plugins" / "csr-lens"
CENARIO = Path(__file__).with_name("cenario.test.tsx")
SAIDA = RAIZ / "docs" / "arte" / "telas"
SEM_MARCAS = False
CHROME = os.environ.get("CHROME_PATH", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

# As medidas do app: o mod calcula a largura dos gráficos com estas.
PIXELS_POR_COLUNA = 7.8
PIXELS_POR_LINHA = 19

# O tema do painel, nas variáveis que o HTML usa: o claro e o escuro, medidos
# nos prints do app. As chaves de cor do Claude Code que o mod ainda usa no
# texto ('subtle', 'success'...) viram variáveis também.
TEMA_CLARO = {
    "fundo": "#ffffff",
    "tinta": "#141413",
    "fraco": "#6f6e6b",
    "cabeca": "#5d5c59",
    "fio": "#e3e1dc",
    "botao": "#ffffff",
    "botao-fio": "#d9d7d2",
    "tecla": "#8f8e8b",
    "tecla-fio": "#e0dedb",
    "cartao-fio": "#c9c7c2",
    "codigo-fundo": "rgba(128,128,128,.12)",
    "c-subtle": "#8a8884",
    "c-suggestion": "#5769f7",
    "c-success": "#1a7f37",
    "c-error": "#cf222e",
    "c-claude": "#d77757",
    "c-warning": "#9a6700",
    "c-merged": "#8957e5",
    "c-planMode": "#1b7c83",
    "c-inactive": "#8c959f",
    "c-ide": "#0969da",
}
TEMA_ESCURO = {
    "fundo": "#191918",
    "tinta": "#e8e6e3",
    "fraco": "#8f8d89",
    "cabeca": "#a8a6a2",
    "fio": "#34322f",
    "botao": "#30302f",
    "botao-fio": "#45443f",
    "tecla": "#8a8884",
    "tecla-fio": "#4e4c48",
    "cartao-fio": "#6d6b66",
    "codigo-fundo": "rgba(255,255,255,.08)",
    "c-subtle": "#6e6c68",
    "c-suggestion": "#b1b9f9",
    "c-success": "#4eba65",
    "c-error": "#ff6b80",
    "c-claude": "#d77757",
    "c-warning": "#ffc107",
    "c-merged": "#af87ff",
    "c-planMode": "#48968c",
    "c-inactive": "#999999",
    "c-ide": "#4782c8",
}
# As chaves do tema que viram variável (as outras cores vêm em hex do próprio mod).
CHAVES_DO_TEMA = {chave[2:] for chave in TEMA_CLARO if chave.startswith("c-")}

# O terminal, sempre escuro.
TERMINAL = {
    "fundo": "#141414",
    "tinta": "#e8e6e3",
    "fraco": "#8f8d89",
    "borda": "#333333",
    "subtle": "rgb(80,80,80)",
    "suggestion": "rgb(177,185,249)",
    "success": "rgb(78,186,101)",
    "error": "rgb(255,107,128)",
    "claude": "rgb(215,119,87)",
    "warning": "rgb(255,193,7)",
    "merged": "rgb(175,135,255)",
    "planMode": "rgb(72,150,140)",
    "inactive": "rgb(153,153,153)",
    "ide": "rgb(71,130,200)",
}

MARCA = "#d97757"
FONTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif"
MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace"

# Cada tela: o título da imagem e as marcas numeradas (o texto que a marca
# aponta: o começo do texto de um elemento, ou o começo do `alt` de um
# gráfico; "antes" põe a marca logo antes do alvo, e não na margem). Um
# "corte" termina a tela no fim do cartão que contém o alvo.
TELAS = {
    "pilulas": {"titulo": None, "marcas": []},
    "pilulas-estreitas": {"titulo": None, "marcas": []},
    "visao-geral": {
        "titulo": "Lens",
        "marcas": [
            ("Indicadores:", "alt"),
            ("▾ Agora", "alt"),
            ("▾ Agentes disponíveis", "alt"),
            ("▾ Quem chamou quem", "alt"),
            ("▾ Último turno", "alt"),
            ("▾ Últimas edições", "alt"),
        ],
    },
    "agentes": {
        "titulo": "Lens",
        "marcas": [
            ("● ", "alt"),
            ("A conversa principal", "alt"),
            ("▾ Linha do tempo", "alt"),
            ("● Ler tudo devagar 2", "alt"),
            ("Ver detalhes", "texto", "antes"),
        ],
        # A tela termina no fim do primeiro cartão concluído (a lista segue).
        "corte": ("✓ Ler tudo devagar (Explore)", "alt"),
        "corte-terminal": ("✓ Ler tudo devagar (Explore)", "texto"),
    },
    "agentes-ampliado": {"titulo": "Lens", "marcas": []},
    "agentes-workflow": {
        "titulo": "Lens",
        "marcas": [
            ("A conversa principal", "alt"),
            ("Workflow pesquisa-de-plugins", "texto"),
            ("Crítica", "texto-ultimo"),
        ],
    },
    "ficha-agente": {
        "titulo": "Lens",
        "marcas": [
            ("‹ Voltar", "texto"),
            ("Ler os testes ·", "alt"),
            ("▾ Ferramentas", "alt"),
            ("▾ Pedido que o agente recebeu", "alt"),
            ("▾ Últimas chamadas", "alt"),
            ("▾ Resposta", "alt"),
        ],
    },
    "agente-rodadas": {
        "titulo": "Lens",
        "marcas": [
            ("Coordenar a leitura ·", "alt"),
            ("▾ Rodadas", "alt"),
            ("Rodada 1", "texto"),
            ("Ver rodada", "texto", "antes"),
        ],
    },
    "rodada": {
        "titulo": "Lens",
        "marcas": [
            ("‹ Rodada 1", "texto"),
            ("Rodada 2 de 2", "alt"),
            ("▾ Recado que o acordou", "alt"),
            ("▾ Agentes que ele criou", "alt"),
            ("▾ Recados", "alt"),
        ],
    },
    "agente-parando": {
        "titulo": "Lens",
        "marcas": [
            ("Parando…", "texto"),
            ("Pedi para ele parar", "texto"),
            ("Ler tudo devagar 2 ·", "alt"),
        ],
    },
    "diffs": {
        "titulo": "Lens",
        "marcas": [
            ("Sessão", "alt"),
            ("teste-lens.md", "texto"),
            ("Diff:", "alt", "antes"),
        ],
    },
    "contexto": {
        "titulo": "Lens",
        "marcas": [
            ("Contexto ", "alt"),
            ("Total:", "alt"),
            ("Limites de uso", "alt"),
            ("Contagem exata", "texto"),
            ("Ocupando a janela", "texto"),
        ],
    },
    "turnos": {
        "titulo": "Lens",
        "marcas": [
            ("A duração de cada turno", "alt"),
            ("▾ Ferramentas mais chamadas", "alt"),
            ("Turno 4", "texto"),
            ("+", "alt"),
            ("Agentes · 3", "texto"),
        ],
    },
    "ficha-turno": {
        "titulo": "Lens",
        "marcas": [
            ("Turno 2 ·", "alt"),
            ("▾ Pedido", "alt"),
            ("▾ Subagentes", "alt"),
            ("✓ Revisar o formato.ts · rodada 2", "alt"),
            ("▾ Resposta", "alt"),
            ("▾ Comandos Bash", "alt"),
        ],
    },
    "arvore": {
        "titulo": "Lens",
        "marcas": [
            ("claude-code-kit ·", "alt"),
            ("Ramo main", "alt"),
            ("↻ Atualizar", "texto"),
            ("◉ lendo", "texto"),
            ("dados.ts", "texto"),
        ],
    },
    "inventario": {
        "titulo": "Lens",
        "marcas": [
            ("Plugins 2/3", "alt"),
            ("Filtro", "texto"),
            ("ativo", "alt", "antes"),
            ("inativo", "alt", "antes"),
        ],
    },
}


def rodar_cenario() -> str:
    """Roda o cenário numa cópia do plugin e devolve a saída do teste."""
    with tempfile.TemporaryDirectory() as pasta:
        copia = Path(pasta) / "csr-lens"
        shutil.copytree(PLUGIN, copia)
        for teste in (copia / "tests").glob("*.test.tsx"):
            teste.unlink()
        shutil.copy(CENARIO, copia / "tests" / "cenario.test.tsx")
        feito = subprocess.run(["claude", "plugin", "test", "."], cwd=copia, capture_output=True, text=True)
        saida = feito.stdout + feito.stderr
        if " 0 fail" not in saida:
            sys.exit(f"o cenário falhou:\n{saida[-3000:]}")
        return saida


def filhos(no):
    saida = []
    for filho in no.get("children", []) or []:
        if isinstance(filho, list):
            saida.extend(filhos({"children": filho}))
        elif filho is None or filho is False:
            continue
        else:
            saida.append(filho)
    return saida


def e(texto: str) -> str:
    """Escapa para XHTML (o SVG leva o HTML dentro de um foreignObject)."""
    return html.escape(str(texto), quote=True)


def variaveis(tema: dict[str, str]) -> str:
    return ";".join(f"--{chave}:{valor}" for chave, valor in tema.items())


# O estilo do painel do app: as variáveis dos dois temas e as peças (botão,
# tecla, cartão, código, marca). Vai dentro do SVG, e vale para o HTML do
# foreignObject.
def estilo_do_app() -> str:
    return (
        f":root{{color-scheme:light dark;{variaveis(TEMA_CLARO)}}}"
        f"@media (prefers-color-scheme: dark){{:root{{{variaveis(TEMA_ESCURO)}}}}}"
        f".tela{{background:var(--fundo);color:var(--tinta);font:13px {FONTE};line-height:{PIXELS_POR_LINHA}px;"
        "box-sizing:border-box;border-radius:12px;border:1px solid var(--fio);overflow:hidden}"
        ".cabeca{display:flex;justify-content:space-between;align-items:center;padding:8px 14px 2px;color:var(--cabeca);font-size:12px}"
        ".fraco{color:var(--fraco)}"
        ".btn{display:inline-flex;align-items:center;column-gap:6px;height:25px;padding:0 9px;border:1px solid var(--botao-fio);"
        "border-radius:7px;background:var(--botao);color:var(--tinta);white-space:pre;vertical-align:top}"
        ".btn.apagado{color:var(--fraco)}"
        ".tecla{display:inline-block;min-width:11px;padding:0 3px;border:1px solid var(--tecla-fio);border-radius:4px;"
        "font-size:10.5px;line-height:15px;color:var(--tecla);text-align:center;font-weight:400}"
        ".cartao{border:1px solid var(--cartao-fio);border-radius:10px;padding-top:6px;padding-bottom:6px}"
        ".codigo{display:inline;padding:0 4px;border-radius:4px;background:var(--codigo-fundo);font-family:" + MONO + ";font-size:12px}"
        ".md p{margin:0}.md ul,.md ol{margin:0;padding-left:22px}.md li{margin:0}.md pre{margin:0;white-space:pre-wrap;font-family:" + MONO + ";font-size:12px}"
        ".entrada{display:inline-flex;align-items:center;height:25px;padding:0 9px;border:1px solid var(--botao-fio);border-radius:7px;"
        "color:var(--fraco);white-space:pre}"
        f".marca{{position:absolute;width:22px;height:22px;border-radius:11px;background:{MARCA};color:#fff;"
        f"font:700 12px/22px {FONTE};text-align:center;box-shadow:0 0 0 2px var(--fundo)}}"
    )


def estilo_do_terminal() -> str:
    return (
        f".tela{{background:{TERMINAL['fundo']};color:{TERMINAL['tinta']};font:12px {MONO};line-height:18px;padding:14px;"
        f"box-sizing:border-box;border-radius:10px;border:1px solid {TERMINAL['borda']}}}"
        f".fraco{{color:{TERMINAL['fraco']}}}"
        f".marca{{position:absolute;width:22px;height:22px;border-radius:11px;background:{MARCA};color:#fff;"
        f"font:700 12px/22px {FONTE};text-align:center;box-shadow:0 0 0 2px {TERMINAL['fundo']}}}"
    )


# Um markdown mínimo, para o pedido e a resposta dos detalhes: parágrafos,
# listas, `código` e **negrito**.
def markdown(texto: str) -> str:
    def em_linha(trecho: str) -> str:
        partes = re.split(r"(`[^`]*`|\*\*[^*]+\*\*)", trecho)
        saida = []
        for parte in partes:
            if parte.startswith("`") and parte.endswith("`") and len(parte) > 1:
                saida.append(f'<span class="codigo">{e(parte[1:-1])}</span>')
            elif parte.startswith("**") and parte.endswith("**") and len(parte) > 3:
                saida.append(f"<strong>{e(parte[2:-2])}</strong>")
            else:
                saida.append(e(parte))
        return "".join(saida)

    blocos = []
    lista: list[str] | None = None
    tipo = "ul"

    def fechar():
        nonlocal lista
        if lista:
            blocos.append(f"<{tipo}>" + "".join(f"<li>{item}</li>" for item in lista) + f"</{tipo}>")
        lista = None

    for linha in texto.split("\n"):
        item = re.match(r"^\s*([-*]|\d+[.)])\s+(.*)$", linha)
        if item:
            marcador = item.group(1)
            novo_tipo = "ul" if marcador in "-*" else "ol"
            if lista is None or novo_tipo != tipo:
                fechar()
                tipo = novo_tipo
                lista = []
            lista.append(em_linha(item.group(2)))
        elif linha.strip() == "":
            fechar()
        elif linha.lstrip().startswith("|"):
            fechar()
            blocos.append(f"<pre>{e(linha)}</pre>")
        else:
            fechar()
            blocos.append(f"<p>{em_linha(linha)}</p>")
    fechar()
    return '<div class="md" style="white-space:pre-wrap">' + "".join(blocos) + "</div>"


class Desenho:
    """Transforma a árvore desenhada pelo mod em HTML, no visual da superfície."""

    def __init__(self, superficie: str):
        self.superficie = superficie
        self.terminal = superficie == "terminal"
        self.linha = 18 if self.terminal else PIXELS_POR_LINHA
        self.coluna = 7.2 if self.terminal else PIXELS_POR_COLUNA

    def l(self, n):  # linhas em px
        return f"{n * self.linha}px"

    def c(self, n):  # colunas em px
        return f"{round(n * self.coluna, 1)}px"

    def cor(self, valor, para_borda: bool = False):
        """Uma cor do mod: um hex (vale nos dois temas) ou uma chave do tema do Claude Code."""
        if valor is None:
            return None
        if self.terminal:
            return TERMINAL.get(valor, valor)
        if valor == "subtle" and para_borda:
            return "var(--cartao-fio)"
        if valor in CHAVES_DO_TEMA:
            return f"var(--c-{valor})"
        return valor

    def caixa(self, no):
        p = no.get("props", {})
        if p.get("display") == "none" or p.get("position") == "absolute":
            # As dicas (só no hover) e os botões invisíveis não aparecem na foto.
            return ""
        direcao = p.get("flexDirection", "row")
        # Como no Ink: a caixa recorta o que passa dela (um texto não encolhe,
        # a caixa que o contém sim).
        st = ["display:flex", f"flex-direction:{direcao}", "box-sizing:border-box", "min-width:0", "overflow:hidden"]
        classes = []
        for chave, css in [("flexGrow", "flex-grow"), ("flexShrink", "flex-shrink")]:
            if chave in p:
                st.append(f"{css}:{p[chave]}")
        for chave, css in [("flexWrap", "flex-wrap"), ("alignItems", "align-items"), ("justifyContent", "justify-content")]:
            if chave in p:
                st.append(f"{css}:{p[chave]}")
        for chave in ("width", "minWidth", "height"):
            if chave in p:
                css = {"width": "width", "minWidth": "min-width", "height": "height"}[chave]
                valor = p[chave]
                medida = (self.l(valor) if chave == "height" else self.c(valor)) if isinstance(valor, (int, float)) else valor
                st.append(f"{css}:{medida}")
                if chave == "width":
                    st.append("flex-shrink:0")
        if "columnGap" in p:
            st.append(f"column-gap:{self.c(p['columnGap'])}")
        if "rowGap" in p:
            st.append(f"row-gap:{self.l(p['rowGap'])}")
        for chave, css in [("marginBottom", "margin-bottom"), ("marginTop", "margin-top")]:
            if chave in p:
                st.append(f"{css}:{self.l(p[chave])}")
        for chave, css in [("marginRight", "margin-right"), ("marginLeft", "margin-left")]:
            if chave in p:
                st.append(f"{css}:{self.c(p[chave])}")
        if "paddingX" in p:
            st.append(f"padding-left:{self.c(p['paddingX'])};padding-right:{self.c(p['paddingX'])}")
        if "paddingRight" in p:
            st.append(f"padding-right:{self.c(p['paddingRight'])}")
        if "backgroundColor" in p:
            st.append(f"background:{self.cor(p['backgroundColor'])}")
            if not self.terminal:
                st.append("border-radius:4px")
        cartao = ""
        if "borderStyle" in p:
            borda = self.cor(p.get("borderColor"), para_borda=True)
            cartao = ' data-cartao="1"'
            if self.terminal:
                st.append(f"border:1px solid {borda or TERMINAL['borda']};border-radius:0;padding-top:6px;padding-bottom:6px")
            else:
                classes.append("cartao")
                if borda:
                    st.append(f"border-color:{borda}")
        classe = f' class="{" ".join(classes)}"' if classes else ""
        return f'<div{classe}{cartao} style="{";".join(st)}">' + "".join(self.no(f) for f in filhos(no)) + "</div>"

    def estilo_do_texto(self, p):
        st = []
        classes = []
        if p.get("color"):
            st.append(f"color:{self.cor(p['color'])}")
        if p.get("backgroundColor"):
            st.append(f"background:{self.cor(p['backgroundColor'])}")
            if not self.terminal:
                st.append("border-radius:4px")
        if p.get("bold"):
            st.append("font-weight:600")
        if p.get("dimColor"):
            # Apagado: o cinza do tema (os filhos com cor própria ficam com ela).
            if p.get("color"):
                st.append("opacity:.7")
            else:
                classes.append("fraco")
        if p.get("underline"):
            st.append("text-decoration:underline")
        if p.get("strikethrough"):
            st.append("text-decoration:line-through")
        return ";".join(st), classes

    def texto(self, no, bloco):
        p = no.get("props", {})
        dentro = "".join(
            e(f) if isinstance(f, str) else (str(f) if isinstance(f, (int, float)) else self.texto(f, False))
            for f in filhos(no)
        )
        st, classes = self.estilo_do_texto(p)
        classe = f' class="{" ".join(classes)}"' if classes else ""
        if bloco:
            # Um texto, como no Ink, não encolhe numa fileira: quem encolhe é a
            # caixa que o contém. Cortado, termina em reticências.
            corte = str(p.get("wrap", "wrap")).startswith("truncate")
            st += ";flex-shrink:0"
            st += ";white-space:pre;overflow:hidden;text-overflow:ellipsis;min-width:0;max-width:100%" if corte else ";white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%"
            return f'<div{classe} style="{st}">{dentro}</div>'
        return f'<span{classe} style="{st}">{dentro}</span>'

    def botao(self, no):
        p = no.get("props", {})
        rotulo = e(p.get("label", ""))
        tecla = p.get("hotkey")
        apagado = p.get("dimColor") is True
        if self.terminal:
            if p.get("plain"):
                cor = f"color:{TERMINAL['fraco']};" if apagado else ""
                if tecla:
                    return f'<span style="{cor}white-space:pre"><span style="color:{MARCA}">{e(tecla)}</span>: {rotulo}</span>'
                return f'<span style="{cor}white-space:pre">{rotulo}</span>'
            return f'<span style="white-space:pre">[ {rotulo} ]</span>'
        if p.get("plain"):
            classe = ' class="fraco"' if apagado else ""
            return f'<span{classe} style="white-space:pre">{rotulo}</span>'
        # Com moldura: a tecla vai numa caixinha dentro do botão, como no app.
        caixinha = f'<span class="tecla">{e(str(tecla).upper())}</span>' if tecla else ""
        classe = "btn apagado" if apagado else "btn"
        return f'<span class="{classe}">{rotulo}{caixinha}</span>'

    def codigo(self, no):
        p = no.get("props", {})
        fonte = p.get("source", "")
        linhas = []
        for linha in fonte.split("\n"):
            if p.get("format") == "diff" and linha.startswith("@@"):
                linhas.append(f'<div style="color:#56b6c2;opacity:.75">{e(linha)}</div>')
            elif p.get("format") == "diff" and linha.startswith("+"):
                linhas.append(f'<div style="background:rgba(63,185,80,.18);color:#7ee787">{e(linha)}</div>')
            elif p.get("format") == "diff" and linha.startswith("-"):
                linhas.append(f'<div style="background:rgba(248,81,73,.18);color:#ffa198">{e(linha)}</div>')
            else:
                linhas.append(f"<div>{e(linha) or '&#160;'}</div>")
        return (
            f'<div style="white-space:pre;overflow:hidden;border-left:2px solid #444;padding-left:1ch;font-family:{MONO};font-size:12px">'
            + "".join(linhas)
            + "</div>"
        )

    def grafico(self, no):
        """Um gráfico do mod, embutido como imagem: ele traz as regras dos dois
        temas, e segue o tema do documento que o embute."""
        p = no["props"]
        dado = base64.b64encode(p["source"].encode()).decode()
        largura = p.get("width", "")
        altura = p.get("height", "")
        return (
            f'<img alt="{e(p.get("alt", ""))}" src="data:image/svg+xml;base64,{dado}" '
            f'width="{largura}" height="{altura}" style="display:block;flex-shrink:0;max-width:100%;height:auto"/>'
        )

    def entrada(self, no):
        p = no["props"]
        rotulo = e(p.get("label", ""))
        valor = p.get("value") or ""
        texto = e(valor) if valor else f'<span class="fraco">{e(p.get("placeholder", ""))}</span>'
        enviar = p.get("submitLabel")
        botao = f'<span class="btn" style="margin-left:6px">{e(enviar)}</span>' if enviar else ""
        if self.terminal:
            return f'<span style="white-space:pre">{rotulo}: [{texto}]</span>'
        return (
            f'<span style="display:inline-flex;align-items:center;white-space:pre"><span style="margin-right:6px">{rotulo}</span>'
            f'<span class="entrada" style="min-width:160px">{texto}</span>{botao}</span>'
        )

    def no(self, no):
        if isinstance(no, str):
            return f'<span style="white-space:pre-wrap">{e(no)}</span>'
        tipo = no.get("type")
        if tipo == "Box":
            return self.caixa(no)
        if tipo == "Text":
            return self.texto(no, True)
        if tipo == "Button":
            return self.botao(no)
        if tipo == "Code":
            return self.codigo(no)
        if tipo == "Svg":
            return self.grafico(no)
        if tipo == "Markdown":
            p = no["props"]
            classe = ' class="fraco"' if p.get("dimColor") else ""
            return f"<div{classe}>{markdown(p.get('text', ''))}</div>"
        if tipo == "Input":
            return self.entrada(no)
        return "".join(self.no(f) for f in filhos(no))


def moldura(nome: str, superficie: str, colunas: int, arvore, margem: bool = False) -> str:
    """O HTML da tela: o painel (ou a faixa) com o desenho do mod dentro."""
    desenho = Desenho(superficie)
    corpo = desenho.no(arvore)
    # As faixas acima do prompt ficam do tamanho do que mostram.
    faixa = nome.startswith(("pilulas", "selos"))
    if superficie == "terminal":
        largura = round(colunas * desenho.coluna) + 28
        medida = "display:inline-block" if faixa else f"width:{largura}px"
        return f'<div id="tela" class="tela" style="{medida}">{corpo}</div>'
    titulo = TELAS.get(nome, {}).get("titulo")
    largura = round(colunas * desenho.coluna) + 32 + (22 if margem else 0)
    medida = "display:inline-block" if faixa else f"width:{largura}px"
    if faixa:
        # A faixa fica solta, sem moldura: só o fundo do app por trás.
        return f'<div id="tela" class="tela" style="{medida};border:0;border-radius:0;padding:8px 10px">{corpo}</div>'
    cabeca = f'<div class="cabeca"><span>{e(titulo)}</span><span style="opacity:.6;letter-spacing:3px">⤢ ✕</span></div>' if titulo else ""
    return (
        f'<div id="tela" class="tela" style="{medida}">'
        f'{cabeca}<div style="padding:{10 if titulo else 14}px 16px 16px {38 if margem else 16}px">{corpo}</div></div>'
    )


# Mede a tela e acha o lugar de cada marca: o elemento cujo texto começa com o
# procurado (o menor deles) ou o gráfico cujo alt começa com ele.
MEDIR = r"""
<script>
const tela = document.getElementById('tela');
const caixa = tela.getBoundingClientRect();
const marcas = JSON.parse(document.getElementById('marcas').textContent);
const corte = JSON.parse(document.getElementById('corte').textContent);
const achar = ([procurado, modo]) => {
  if (modo === 'alt') {
    return [...tela.querySelectorAll('img')].find(img => (img.getAttribute('alt') || '').startsWith(procurado)) || null;
  }
  const todos = [...tela.querySelectorAll('div,span')].filter(el => el.textContent.trim().startsWith(procurado));
  const folhas = todos.filter(el => ![...el.children].some(filho => filho.textContent.trim().startsWith(procurado)));
  return (modo === 'texto-ultimo' ? folhas[folhas.length - 1] : folhas[0]) || null;
};
const achados = marcas.map(marca => {
  const alvo = achar(marca);
  if (!alvo) return null;
  const r = alvo.getBoundingClientRect();
  return { x: r.left - caixa.left, y: r.top - caixa.top, w: r.width, h: r.height };
});
// O corte: o fim do cartão que contém o alvo (ou do próprio alvo).
let fim = null;
if (corte) {
  const alvo = achar(corte);
  const cartao = alvo && (alvo.closest('[data-cartao]') || alvo);
  if (cartao) fim = cartao.getBoundingClientRect().bottom - caixa.top;
}
document.getElementById('medida').textContent = JSON.stringify({ w: caixa.width, h: caixa.height, marcas: achados, fim });
</script>
"""


def chrome(*argumentos: str) -> str:
    feito = subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", *argumentos],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return feito.stdout


def pagina(conteudo: str, estilo: str, extra: str = "", tema: str = "") -> str:
    return (
        f'<!doctype html><html style="{tema}"><head><meta charset="utf-8"/><style>{estilo}</style></head>'
        f'<body style="margin:0;background:transparent">{conteudo}{extra}</body></html>'
    )


def selo_da_marca(numero: int, x: float, y: float) -> str:
    return f'<div class="marca" style="left:{x:.0f}px;top:{y:.0f}px">{numero}</div>'


def gerar(saida_png: Path | None, apenas: set[str] | None = None) -> None:
    texto = rodar_cenario()
    telas = re.findall(r"@@TELA (\S+) (\S+) (\d+)@@(\{.*)", texto)
    SAIDA.mkdir(parents=True, exist_ok=True)
    if saida_png:
        saida_png.mkdir(parents=True, exist_ok=True)
    gerados: set[str] = set()

    with tempfile.TemporaryDirectory() as pasta:
        for nome, superficie, colunas, arvore in telas:
            # Com o nome de antes, o GitHub seguia mostrando do cache a tela velha.
            arquivo = nome if superficie == "desktop" else f"terminal-{nome}"
            # No app, duas versões (o README escolhe pelo tema do GitHub); o
            # terminal é sempre escuro.
            versoes = ["claro", "escuro"] if superficie == "desktop" else [None]
            nomes = [f"{arquivo}-{tema}.svg" if tema else f"{arquivo}.svg" for tema in versoes]
            if apenas is not None and arquivo not in apenas:
                gerados.update(nomes)
                continue
            dados = TELAS.get(nome, {})
            # Sem as marcas (--sem-marcas): as telas do blog, que não têm a lista
            # numerada embaixo.
            marcas = dados.get("marcas", []) if superficie == "desktop" and not SEM_MARCAS else []
            corte = dados.get("corte" if superficie == "desktop" else "corte-terminal")
            tela = moldura(nome, superficie, int(colunas), json.loads(arvore), margem=len(marcas) > 0)
            estilo = estilo_do_terminal() if superficie == "terminal" else estilo_do_app()

            # 1. A medida, o lugar das marcas e o fim do corte.
            medir = Path(pasta) / f"{arquivo}-medir.html"
            medir.write_text(
                pagina(
                    tela,
                    estilo,
                    f'<script type="application/json" id="marcas">{json.dumps(marcas)}</script>'
                    f'<script type="application/json" id="corte">{json.dumps(corte)}</script>'
                    f'<pre id="medida"></pre>{MEDIR}',
                )
            )
            dom = chrome("--virtual-time-budget=3000", "--dump-dom", medir.as_uri())
            achado = re.search(r'<pre id="medida">(.*?)</pre>', dom, re.S)
            if not achado:
                sys.exit(f"{arquivo}: o Chrome não mediu a tela")
            medida = json.loads(html.unescape(achado.group(1)))
            largura, altura = round(medida["w"]), round(medida["h"])
            if corte is not None:
                if medida["fim"] is None:
                    print(f"  aviso: {arquivo}: o corte ({corte[0]}) não achou o alvo")
                else:
                    # O painel termina logo abaixo do cartão; o resto fica de fora.
                    altura = round(medida["fim"]) + 16
                    tela = tela.replace('id="tela" class="tela" style="', f'id="tela" class="tela" style="height:{altura}px;overflow:hidden;', 1)

            # 2. As marcas numeradas, à esquerda de cada alvo.
            selos = []
            for numero, lugar in enumerate(medida["marcas"], start=1):
                if lugar is None:
                    print(f"  aviso: {arquivo}: a marca {numero} ({marcas[numero - 1][0]}) não achou o alvo")
                    continue
                # Na margem da esquerda, na altura do alvo; "antes", logo antes dele.
                antes = len(marcas[numero - 1]) > 2 and marcas[numero - 1][2] == "antes"
                x = lugar["x"] - 27 if antes else 7
                selos.append(selo_da_marca(numero, x, lugar["y"] + min(lugar["h"], 40) / 2 - 11))
            final = f'<div style="position:relative;width:{largura}px;height:{altura}px">{tela}{"".join(selos)}</div>'

            # 3. O SVG: o estilo dos dois temas e o HTML num foreignObject.
            svg = (
                f'<svg xmlns="http://www.w3.org/2000/svg" width="{largura}" height="{altura}" viewBox="0 0 {largura} {altura}">'
                f"<style>{estilo}</style>"
                f'<foreignObject x="0" y="0" width="{largura}" height="{altura}">'
                f'<div xmlns="http://www.w3.org/1999/xhtml">{final}</div></foreignObject></svg>\n'
            )
            # 4. Cada versão em disco e, com --png, em 2x (claro e escuro).
            for tema, nome_svg in zip(versoes, nomes):
                destino = SAIDA / nome_svg
                destino.write_text(fixar_tema(svg, tema) if tema else svg)
                gerados.add(nome_svg)
                print(f"docs/arte/telas/{nome_svg}  {largura}x{altura}")

                if saida_png:
                    sufixo = "-escuro" if tema == "escuro" else ""
                    foto = Path(pasta) / f"{arquivo}{sufixo}.html"
                    foto.write_text(
                        f'<!doctype html><html><head><meta charset="utf-8"/></head>'
                        f'<body style="margin:0;background:transparent"><img src="{destino.resolve().as_uri()}" '
                        f'width="{largura}" height="{altura}" style="display:block"/></body></html>'
                    )
                    chrome(
                        f"--window-size={largura},{altura}",
                        "--force-device-scale-factor=2",
                        "--default-background-color=00000000",
                        "--virtual-time-budget=3000",
                        f"--screenshot={saida_png / f'{arquivo}{sufixo}.png'}",
                        foto.as_uri(),
                    )
                    print(f"  {saida_png / f'{arquivo}{sufixo}.png'}")

    # As telas que o cenário não desenha mais saem da pasta.
    for velho in SAIDA.glob("*.svg"):
        if velho.name not in gerados:
            velho.unlink()
            print(f"removido: docs/arte/telas/{velho.name}")


if __name__ == "__main__":
    png = None
    apenas = None
    if "--png" in sys.argv:
        png = Path(sys.argv[sys.argv.index("--png") + 1]).resolve()
    # Só algumas telas (pelo nome do arquivo, sem .svg), para iterar mais rápido.
    if "--apenas" in sys.argv:
        apenas = set(sys.argv[sys.argv.index("--apenas") + 1].split(","))
    # As telas sem as bolinhas numeradas, numa pasta à parte (para o blog).
    if "--sem-marcas" in sys.argv:
        SEM_MARCAS = True
        SAIDA = Path(sys.argv[sys.argv.index("--sem-marcas") + 1]).resolve()
    gerar(png, apenas)

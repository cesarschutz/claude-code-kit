"""Uma imagem SVG que segue o tema do sistema, fixada num tema só.

O README usa `<picture>` com uma versão clara e uma escura: o GitHub escolhe
pela preferência de tema da conta, que pode não ser a do sistema. As telas e a
arte saem com `@media (prefers-color-scheme: …)`; aqui as regras de um tema
viram regras de sempre e as do outro somem, também dentro dos desenhos do mod
que vão embutidos como imagem (data:image/svg+xml;base64).
"""

from __future__ import annotations

import base64
import re

ESCURO = "@media (prefers-color-scheme: dark)"
CLARO = "@media (prefers-color-scheme: light)"
EMBUTIDO = re.compile(r"data:image/svg\+xml;base64,([A-Za-z0-9+/=]+)")


def fixar_tema(svg: str, tema: str) -> str:
    """Devolve o SVG só no tema `claro` ou `escuro`."""
    if tema not in ("claro", "escuro"):
        raise ValueError(tema)
    sempre, nunca = (ESCURO, CLARO) if tema == "escuro" else (CLARO, ESCURO)
    esquema = "dark" if tema == "escuro" else "light"

    def fixar(texto: str) -> str:
        texto = texto.replace(sempre, "@media all").replace(nunca, "@media not all")
        texto = re.sub(r"color-scheme:\s*light dark", f"color-scheme:{esquema}", texto)
        texto = re.sub(r"color-scheme:\s*dark light", f"color-scheme:{esquema}", texto)
        return EMBUTIDO.sub(
            lambda m: "data:image/svg+xml;base64,"
            + base64.b64encode(fixar(base64.b64decode(m.group(1)).decode()).encode()).decode(),
            texto,
        )

    return fixar(svg)

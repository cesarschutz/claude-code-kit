---
name: explicar-mudancas
description: Explica em português claro o que mudou no repositório git atual, antes de um commit. Use quando a pessoa pedir "explica o que mudou", "resume o diff", "o que eu alterei?" ou "o que vai nesse commit?".
---

# Explicar mudanças

Explique o que mudou no repositório atual, sem alterar nada.

1. Rode `git status --short` e `git diff` (e `git diff --staged`, se houver algo no stage).
2. Se não houver mudança, diga isso em uma linha e pare.
3. Agrupe as mudanças por assunto, não por arquivo. Para cada grupo, diga o que mudou e por que isso importa para quem usa o sistema.
4. Aponte, se houver, o que merece uma segunda olhada: arquivo apagado, segredo aparente, mudança grande sem teste.
5. Termine com uma sugestão de mensagem de commit em uma linha.

Não faça commit, não faça stage e não edite arquivos.

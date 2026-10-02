---
name: mensagem-de-commit
description: Escreve a mensagem de commit para o que está no stage do git, sem commitar. Use quando a pessoa pedir "escreve a mensagem de commit", "que mensagem eu ponho nesse commit?" ou "resume o que está no stage".
---

# Mensagem de commit

Escreva a mensagem de commit para as mudanças que estão no stage. Não faça o commit.

1. Rode `git diff --staged`. Se estiver vazio, avise que não há nada no stage e pare.
2. Rode `git log --oneline -10` para seguir o estilo das mensagens do repositório (idioma, prefixos, tamanho).
3. Escreva a mensagem:
   - primeira linha com até 72 caracteres, dizendo o que muda para quem usa, não a lista de arquivos;
   - corpo só se a primeira linha não bastar, explicando o porquê.
4. Mostre a mensagem num bloco de código, pronta para copiar.

Não rode `git commit`, `git add` nem `git push`.

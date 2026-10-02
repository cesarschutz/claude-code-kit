# responder-em-portugues

Hook de exemplo. No início de cada sessão, acrescenta ao contexto do Claude a linha
"Responda sempre em português do Brasil."

Um hook instalado pelo catálogo, sem `plugin.json`, é escrito direto na entrada do
`.claude-plugin/marketplace.json`, no campo `hooks`. Esta pasta existe só para a entrada ter
para onde apontar; se o hook precisar de um script, o script mora aqui e o comando o chama
por `${CLAUDE_PLUGIN_ROOT}/nome-do-script`.

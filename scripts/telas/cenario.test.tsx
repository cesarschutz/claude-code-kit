// O cenário das telas do csr-lens (scripts/telas/telas.py): uma sessão
// encenada neste próprio repositório (o claude-code-kit), e o desenho de cada
// aba despejado em JSON. O script copia o plugin para uma pasta temporária,
// põe este arquivo em tests/ e roda `claude plugin test`: as telas saem do
// código de verdade do mod, com dados inventados.
//
// A história, em quatro pedidos: um teste do painel com sete agentes (um de
// plugin, dois do projeto, um coordenador que cria dois Explore), recados que
// acordam dois deles para uma segunda rodada, um Explore parado pelo botão e,
// agora, outro Explore trabalhando enquanto a conversa principal pensa.
declare const console: { log: (texto: string) => void }

import type { ContextSkill, ToolCallResult, TurnUsage } from 'claude-code'
import { test } from 'claude-code/testing'

import { AGORA, INICIO, SESSAO, doAgente, entrada, faixa, fimDoTurno, ligar, painel, subagente } from './motor'
import type { Motor } from './motor'

const MOD = 'csr-lens'
const PAINEL = { plugin: MOD, component: 'Pane', requestId: MOD } as const
const LARGURA = 110
// O repositório encenado: este marketplace.
const RAIZ = '/claude-code-kit'
const HOOKS = `${RAIZ}/plugins/csr-lens/hooks`
// O relógio do motor nasce às 05:00 de Brasília; a sessão começa às 10:20.
const ATE_AS_DEZ_E_VINTE = (5 * 60 + 20) * 60_000
// O modelo dos agentes: o que o motor de testes dá a cada um no nascimento.
const MODELO_DOS_AGENTES = 'claude-haiku-4-5'

type Montado = { press: (t: { key: string }) => Promise<unknown>; findAll: (q: { type: string }) => Promise<{ key?: string }[]> }
type Sessao = Parameters<Parameters<typeof test>[1]>[0]

// Monta o painel, aperta o que `depois` manda e despeja o desenho.
const despejar = async (
  $: Sessao,
  nome: string,
  surface: 'terminal' | 'desktop',
  largura: number,
  depois?: (ui: Montado) => Promise<void>,
) => {
  const ui = await $.ui.mount({ ...PAINEL, surface, props: painel('dock', largura) })

  if (depois !== undefined) {
    await depois(ui as unknown as Montado)
  }

  console.log(`@@TELA ${nome} ${surface} ${largura}@@${JSON.stringify(await ui.drawn())}`)
  await voltarAoInicio(ui as unknown as Montado)
  await ui.unmount()
}

// O painel guarda a aba e o detalhe abertos entre uma montagem e outra: cada
// tela parte da Visão geral, sem detalhe aberto.
const voltarAoInicio = async (ui: Montado) => {
  await ui.press({ key: 'caminho-aba' }).catch(() => undefined)
  await ui.press({ key: 'aba-0' }).catch(() => undefined)
}

const aba = (n: number) => async (ui: Montado) => {
  await ui.press({ key: `aba-${n}` })
}

// O que a conversa principal e os agentes consomem numa resposta do modelo:
// `contexto` é o tamanho da entrada (quase toda relida do cache) e `saida` o
// que o modelo escreveu.
const uso = (contexto: number, saida: number, modelo: string, isAgente: boolean): TurnUsage => {
  // A conversa relê quase tudo do cache; um agente, que começa do zero, grava mais.
  const [lido, gravado] = isAgente ? [0.72, 0.2] : [0.95, 0.03]

  return {
    input_tokens: Math.round(contexto * (1 - lido - gravado)),
    output_tokens: saida,
    cache_read_input_tokens: Math.round(contexto * lido),
    cache_creation_input_tokens: Math.round(contexto * gravado),
    model: modelo,
  }
}

// O que o motor guarda de um repositório: o ramo, os arquivos alterados e as
// linhas somadas de cada um. Dois arquivos o Claude mudou nesta sessão; os
// outros, a pessoa.
const comRepositorio = (motor: Motor) => {
  motor.comandos['git rev-parse --show-toplevel'] = `${RAIZ}\n`
  motor.comandos['git status --porcelain=v1 -b -z --untracked-files=all'] =
    '## main...origin/main [ahead 2]\0 M plugins/csr-lens/README.md\0 M plugins/csr-lens/hooks/formato.ts\0 M scripts/telas/telas.py\0?? teste-lens.md\0'
  motor.comandos['git diff HEAD --numstat -z'] =
    '19\t15\tplugins/csr-lens/README.md\x007\t0\tplugins/csr-lens/hooks/formato.ts\x0093\t40\tscripts/telas/telas.py\0'
  motor.comandos['git diff HEAD --no-color --no-ext-diff -- plugins/csr-lens/README.md'] =
    'diff --git a/plugins/csr-lens/README.md b/plugins/csr-lens/README.md\n--- a/plugins/csr-lens/README.md\n+++ b/plugins/csr-lens/README.md\n@@ -36,2 +36,2 @@\n - As abas: [Agentes](#1-agentes) · [Diffs](#2-diffs) · [Contexto](#3-contexto) ·\n-  [Turnos](#4-turnos) · [Árvore](#5-árvore) · [Inventario](#6-inventário)\n+  [Turnos](#4-turnos) · [Árvore](#5-árvore) · [Inventário](#6-inventário)\n'
}

// O que está instalado: o próprio Lens e o plugin exemplos (ativos), um
// plugin desligado, um agente global (nas suas configurações) e o agente de
// projeto deste repositório.
const comInventario = (motor: Motor) => {
  motor.sessao.env.HOME = '/casa'
  motor.arquivos['/casa/.claude/plugins/installed_plugins.json'] = JSON.stringify({
    plugins: {
      'csr-lens@cesarschutz': [{ installPath: '/cache/csr-lens', version: '1.0.0' }],
      'exemplos@cesarschutz': [{ installPath: '/cache/exemplos', version: '0.1.0' }],
      'warp@claude-code-warp': [{ installPath: '/cache/warp', version: '2.1.0' }],
    },
  })
  motor.arquivos['/cache/csr-lens/.claude-plugin/plugin.json'] = JSON.stringify({
    version: '1.0.0',
    description: 'Painel ao lado da conversa com visão geral, agentes (quem chamou quem, recados e rodadas), turnos, diffs, árvore de arquivos, contexto e inventário, e uma linha de resumo acima do prompt.',
  })
  motor.arquivos['/cache/csr-lens/hooks/hooks.json'] = JSON.stringify({ modules: ['./register.tsx'] })
  motor.arquivos['/cache/exemplos/.claude-plugin/plugin.json'] = JSON.stringify({
    version: '0.1.0',
    description: 'Um exemplo de cada peça que um plugin pode levar: skill, agente, hook e estilo de saída.',
  })
  motor.listas['/cache/exemplos/agents'] = [entrada('revisor.md', 'file')]
  motor.arquivos['/cache/exemplos/agents/revisor.md'] =
    '---\nname: revisor\ndescription: Revisa um trecho de código ou um conjunto de arquivos em busca de erros de lógica, sem editar nada.\n---\nRevise.\n'
  motor.listas['/cache/exemplos/skills'] = [entrada('explicar-mudancas', 'dir')]
  motor.arquivos['/cache/exemplos/skills/explicar-mudancas/SKILL.md'] =
    '---\nname: explicar-mudancas\ndescription: Explica em português claro o que mudou no repositório git atual, antes de um commit.\n---\nExplique.\n'
  motor.listas['/cache/exemplos/output-styles'] = [entrada('direto.md', 'file')]
  motor.arquivos['/cache/exemplos/output-styles/direto.md'] = '---\nname: direto\ndescription: Respostas curtas, sem rodeios.\n---\nSeja direto.\n'
  motor.arquivos['/cache/exemplos/hooks/hooks.json'] = JSON.stringify({
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/responder-em-portugues.sh' }] }] },
  })
  motor.arquivos['/cache/warp/.claude-plugin/plugin.json'] = JSON.stringify({ description: 'Notificações nativas do Warp para o Claude Code.' })
  motor.arquivos['/cache/warp/hooks/hooks.json'] = JSON.stringify({
    hooks: { Stop: [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/scripts/on-stop.sh' }] }] },
  })
  motor.arquivos['/casa/.claude/plugins/known_marketplaces.json'] = JSON.stringify({ cesarschutz: { installLocation: '/mk/cesarschutz' } })
  motor.arquivos['/mk/cesarschutz/.claude-plugin/marketplace.json'] = JSON.stringify({
    plugins: [
      { name: 'csr-lens', category: 'mod', description: 'Mod: painel ao lado da conversa.' },
      { name: 'exemplos', category: 'pacote', description: 'Exemplo de pacote: skill, agente, hook e estilo de saída num plugin só.' },
      { name: 'mensagem-de-commit', category: 'skill', description: 'Exemplo de skill: escreve a mensagem de commit para o que está no stage, sem commitar.' },
      { name: 'explicar-erro', category: 'skill', description: 'Exemplo de skill: explica um erro ou stack trace em português claro e aponta a causa provável.' },
      { name: 'pesquisador', category: 'agente', description: 'Exemplo de agente: localiza no código onde algo é feito e devolve um mapa com arquivos e linhas. Só lê.' },
      { name: 'critico', category: 'agente', description: 'Exemplo de agente: segunda opinião sobre um plano ou decisão, procurando o que pode dar errado. Só lê.' },
      { name: 'professor', category: 'estilo', description: 'Exemplo de estilo de saída: explica o porquê de cada passo, para quem está aprendendo.' },
      { name: 'tinta-azul', category: 'tema', description: 'Exemplo de tema: cores do terminal com o destaque em azul, sobre o tema escuro.' },
      { name: 'responder-em-portugues', category: 'hook', description: 'Exemplo de hook: no início de cada sessão, pede ao Claude que responda em português do Brasil.' },
    ],
  })
  motor.listas['/casa/.claude/agents'] = [entrada('code-reviewer.md', 'file')]
  motor.arquivos['/casa/.claude/agents/code-reviewer.md'] =
    '---\nname: code-reviewer\ndescription: Revisa um plano ou um diff e aponta riscos antes de mudar o código.\n---\nRevise com cuidado.\n'
  motor.listas[`${RAIZ}/.claude/agents`] = [entrada('conferente-de-readme.md', 'file')]
  motor.arquivos[`${RAIZ}/.claude/agents/conferente-de-readme.md`] =
    '---\nname: conferente-de-readme\ndescription: Confere se o README de um plugin deste marketplace cita os arquivos novos e as mudanças da versão, sem editar nada.\n---\nConfira.\n'
  motor.sessao.configuracoes[''] = {
    enabledPlugins: { 'csr-lens@cesarschutz': true, 'exemplos@cesarschutz': true, 'warp@claude-code-warp': false },
  }
  motor.sessao.comandos = [
    { name: 'lens', description: 'Abre ou fecha o painel Lens', source: 'plugin', plugin: 'csr-lens' },
    { name: 'inventario', description: 'Abre o painel na aba Inventário', source: 'plugin', plugin: 'csr-lens' },
    { name: 'explicar-mudancas', description: 'Explica o que mudou no repositório antes de um commit', source: 'plugin', plugin: 'exemplos' },
    { name: 'compact', description: 'Resume a conversa para liberar contexto', source: 'builtin' },
    { name: 'review', description: 'Revisa um pull request', source: 'builtin' },
  ]
  motor.sessao.skills = [{ name: 'exemplos:explicar-mudancas', description: 'Explica o que mudou no repositório' } as unknown as ContextSkill]
  motor.sessao.ferramentas = [
    { name: 'mcp__github__create_issue', description: 'Abre uma issue no repositório', mcp: true },
    { name: 'mcp__github__list_pull_requests', description: 'Lista os pull requests', mcp: true },
    { name: 'mcp__context7__query_docs', description: 'Busca na documentação de uma biblioteca', mcp: true },
    { name: 'Read', description: 'Lê um arquivo', mcp: false },
    { name: 'Edit', description: 'Edita um arquivo', mcp: false },
    { name: 'Bash', description: 'Roda um comando', mcp: false },
  ]
}

// O que o teste-lens.md recebe no Write e no Edit (a linha 3 troca uma palavra).
const TESTE_LENS = [
  'O CSR Lens é um plugin do marketplace claude-code-kit.',
  'Ele mostra um painel ao vivo dentro do Claude Code.',
  'A aba Árvore mostra os agentes e subagentes da sessão.',
  'A aba Diffs mostra as mudanças feitas nos arquivos.',
  'A Visão geral resume a sessão numa tela só.',
]

test('telas do README', async ($, on) => {
  const motor = ligar(on)
  comRepositorio(motor)
  comInventario(motor)
  // O relógio: quanto já passou desde o começo do motor, para cada
  // acontecimento cair no horário certo. A sessão começa às 10:20; o que é
  // "agora" nas telas fica uns 5 minutos depois.
  let relogio = 0
  const avancar = async (ms: number) => {
    await motor.relogio.advance(ms)
    relogio += ms
  }
  // Avança até `seg` segundos depois do começo da sessão (ou não volta).
  const ate = async (seg: number) => {
    const falta = ATE_AS_DEZ_E_VINTE + seg * 1000 - relogio

    if (falta > 0) {
      await avancar(falta)
    }
  }
  const AGORA_DAS_TELAS = AGORA + ATE_AS_DEZ_E_VINTE + 325_000
  motor.uso = {
    startedAt: AGORA + ATE_AS_DEZ_E_VINTE,
    context: { tokens: 86_000, window: 200_000, percent: 43 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 3, resetsAt: new Date(AGORA_DAS_TELAS + (4 * 60 + 1) * 60_000).toISOString() },
      { kind: 'seven_day', percentUsed: 79, resetsAt: new Date(AGORA_DAS_TELAS + 4 * 24 * 60 * 60_000).toISOString() },
    ],
    cost: { usd: 0 },
  }
  await avancar(ATE_AS_DEZ_E_VINTE)

  // Cada chamada de ferramenta leva um tempo de verdade, pela ferramenta.
  const DURACOES: Record<string, number> = { Bash: 700, Read: 120, Grep: 350, Glob: 200, Agent: 250, SendMessage: 150, ToolSearch: 400, Write: 400, Edit: 300, SubagentHandback: 500 }
  motor.responder = async (e): Promise<ToolCallResult> => {
    await avancar(DURACOES[String(e.tool)] ?? 300)

    if (e.tool === 'Edit' && String(e.file_path).endsWith('teste-lens.md')) {
      return {
        result: {
          structuredPatch: [
            {
              oldStart: 1,
              oldLines: 5,
              newStart: 1,
              newLines: 5,
              lines: [` ${TESTE_LENS[0]}`, ` ${TESTE_LENS[1]}`, `-${TESTE_LENS[2]}`, `+${TESTE_LENS[2]?.replace('mostra', 'exibe')}`, ` ${TESTE_LENS[3]}`, ` ${TESTE_LENS[4]}`],
            },
          ],
        },
        text: 'ok',
      }
    }

    if (e.tool === 'Edit') {
      return {
        result: {
          structuredPatch: [
            {
              oldStart: 36,
              oldLines: 3,
              newStart: 36,
              newLines: 3,
              lines: [
                ' - As abas: [Agentes](#1-agentes) · [Diffs](#2-diffs) · [Contexto](#3-contexto) ·',
                '-  [Turnos](#4-turnos) · [Árvore](#5-árvore) · [Inventario](#6-inventário)',
                '+  [Turnos](#4-turnos) · [Árvore](#5-árvore) · [Inventário](#6-inventário)',
                ' - [No terminal](#no-terminal) · [O custo de cada agente](#o-custo-de-cada-agente) ·',
              ],
            },
          ],
        },
        text: 'ok',
      }
    }

    return { result: { stdout: 'ok', stderr: '', interrupted: false, structuredPatch: [], type: 'update' }, text: 'ok' }
  }

  await $.session.start({ ...INICIO, cwd: RAIZ })
  // O inventário espera a sessão terminar de carregar.
  await avancar(3500)

  // Uma resposta do modelo, da conversa principal (sem agente) ou de um
  // agente, com o custo da sessão subindo: o Lens põe cada aumento na conta
  // de quem respondeu. `segundos`: quanto o modelo levou pensando. A conversa
  // roda no Opus; os agentes, no Haiku (o modelo que o motor dá a cada um).
  const pensar = async (agentId: string | undefined, usd: number, contexto: number, saida = 400, segundos = 1.5, turnId = 't1') => {
    await avancar(Math.round(segundos * 1000))
    motor.uso = { ...motor.uso, cost: { usd: Math.round((motor.uso.cost.usd + usd) * 100) / 100 } }
    const modelo = agentId === undefined ? 'claude-opus-5-5' : MODELO_DOS_AGENTES
    motor.passo = uso(contexto, saida, modelo, agentId !== undefined)
    const fluxo = $.turn.step({
      turnId,
      index: 0,
      model: modelo,
      ...(agentId === undefined ? { effort: 'high' as const } : {}),
      messageCount: 3,
      ...(agentId === undefined ? {} : { agentId }),
    })

    for (let pedaco = await fluxo.next(); pedaco.done !== true; pedaco = await fluxo.next()) {
      // lê até o fim
    }
  }

  // Um agente nasce: o Agent de quem o cria (devolve na hora, como o de um
  // agente em segundo plano) e o próprio nascimento. Guarda quando começou,
  // para a duração do fim bater com o relógio.
  const inicios: Record<string, number> = {}
  const criar = async (id: string, tipo: string, descricao: string, prompt: string, opcoes: { pai?: string; provider?: unknown } = {}) => {
    await $.tool.call(
      doAgente({ tool: 'Agent', description: descricao, prompt, subagent_type: tipo, ...(opcoes.pai === undefined ? { run_in_background: true } : {}) }, opcoes.pai),
    )
    const nascido = await $.agent.spawn({
      ...subagente(id, tipo, descricao),
      prompt,
      // Os da conversa principal rodam em segundo plano; os de um agente, na frente.
      background: opcoes.pai === undefined,
      ...(opcoes.pai === undefined ? {} : { parentAgentId: opcoes.pai }),
      ...(opcoes.provider === undefined ? {} : { provider: opcoes.provider as ReturnType<typeof subagente>['provider'] }),
    })
    const agentId = String(nascido.agentId)
    inicios[agentId] = relogio

    return agentId
  }

  // O fim de uma rodada de um agente: a resposta e o uso dela.
  const terminar = async (agentId: string, resposta: string, contexto: number, saida: number, reason: 'answer' | 'error' = 'answer') => {
    const rodada = `fim-${agentId}-${String(relogio)}`
    await $.turn.complete({
      ...fimDoTurno(rodada, resposta, Math.max(1000, relogio - (inicios[agentId] ?? relogio)), agentId, reason),
      usage: uso(contexto, saida, MODELO_DOS_AGENTES, true),
    })
  }

  // Um recado (SendMessage) de alguém para um agente; um que acorda um
  // agente terminado começa a rodada seguinte dele.
  const recado = async (de: string | undefined, para: string, texto: string) => {
    await $.tool.call(doAgente({ tool: 'SendMessage', to: para, message: texto }, de))
    await $.session.send({ to: para, text: texto, origin: { kind: 'model' }, ...(de === undefined ? {} : { agentId: de }) })
    inicios[para] = relogio
  }

  // O turno que o Claude Code abre sozinho quando um agente em segundo plano
  // volta: entra no pedido que o gerou.
  const retorno = async (turnId: string, agentId: string, relato: string, resposta: string, segundos: number) => {
    await $.turn.start({ text: `<task-notification>\n<task-id>${agentId}</task-id>\n<result>${relato}</result>\n</task-notification>`, turnId })
    await pensar(undefined, 0.04, 96_000, 300, segundos, turnId)
    await $.turn.complete(fimDoTurno(turnId, resposta, Math.round(segundos * 1000) + 400))
  }

  const medir = async (tokens: number) => {
    motor.uso = { ...motor.uso, context: { tokens, window: 200_000, percent: Math.round(tokens / 2000) } }
    await $.session.measure({ ...motor.uso, changed: ['context', 'cost'] })
  }

  const DO_PROJETO = { plugin: 'projectSettings', tier: 'user' }
  const DE_PLUGIN = { plugin: 'exemplos', tier: 'plugin' }
  const SO_LEITURA = 'Somente leitura: não edite nada, não faça commit, push nem fetch. '

  // ─── Turno 1: o teste do painel, com sete agentes ─────────────────────────
  await ate(45)
  await $.turn.start({
    text:
      'Teste do painel CSR Lens. SOMENTE LEITURA no repositório, com duas exceções: o arquivo teste-lens.md na raiz, que você vai criar com 5 linhas sobre o que é o CSR Lens e depois editar (troque uma palavra na linha 3), e a grafia de "Inventario" no README do plugin. Ninguém faz commit, push ou fetch. Cada agente responde em poucas linhas.\n\n' +
      'Em SEGUNDO PLANO, ao mesmo tempo:\n' +
      '- um agente exemplos:revisor (o do plugin) com a descrição "Revisar o formato.ts": revise plugins/csr-lens/hooks/formato.ts e liste no máximo 3 pontos;\n' +
      '- um general-purpose "Coordenar a leitura": crie DOIS subagentes Explore em primeiro plano, um depois do outro, "Ler os testes" (quantos arquivos tem plugins/csr-lens/tests) e "Ler os tipos" (quantos tipos exportados tem plugins/csr-lens/types/index.d.ts);\n' +
      '- um Explore "Mapear os hooks": liste os arquivos de plugins/csr-lens/hooks;\n' +
      '- o conferente-de-readme duas vezes: "Contar seções do README" (quantas seções ## tem o README do plugin) e "Procurar a Visão geral" (o README cita a aba Visão geral?).\n\n' +
      'No fim, uma tabela com agente, modo e resultado.',
    turnId: 't1',
  })
  await pensar(undefined, 0.06, 86_500, 900, 2.2)
  const revisor = await criar(
    'rev',
    'exemplos:revisor',
    'Revisar o formato.ts',
    `${SO_LEITURA}Revise plugins/csr-lens/hooks/formato.ts e liste no máximo 3 pontos, do mais grave para o menos grave. Responda em poucas linhas.`,
    { provider: DE_PLUGIN },
  )
  const coordenador = await criar(
    'coord',
    'general-purpose',
    'Coordenar a leitura',
    `${SO_LEITURA.trim()} Crie DOIS subagentes Explore em primeiro plano, um depois do outro: 'Ler os testes' (liste os arquivos de plugins/csr-lens/tests e diga quantos são) e 'Ler os tipos' (diga quantos tipos exportados tem plugins/csr-lens/types/index.d.ts). Responda com as duas respostas, em poucas linhas, e termine.`,
  )
  const mapear = await criar('map', 'Explore', 'Mapear os hooks', `${SO_LEITURA}Liste os arquivos de plugins/csr-lens/hooks (busca rápida). Responda em poucas linhas.`)

  // A conversa principal cria e edita o teste-lens.md e corrige o README.
  await $.tool.call({ tool: 'Write', file_path: `${RAIZ}/teste-lens.md`, content: `${TESTE_LENS.join('\n')}\n` })
  motor.arquivos[`${RAIZ}/teste-lens.md`] = `${TESTE_LENS.join('\n')}\n`

  // O revisor começa pelo arquivo; o coordenador cria o primeiro Explore.
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${HOOKS}/formato.ts` }, revisor))
  await pensar(coordenador, 0.05, 32_000, 300, 1.2)
  const testes = await criar('testes', 'Explore', 'Ler os testes', `${SO_LEITURA}Liste os arquivos do diretório plugins/csr-lens/tests e diga quantos são. Responda só com a lista de nomes e o total.`, { pai: coordenador })
  await $.tool.call(doAgente({ tool: 'Bash', command: 'ls -A plugins/csr-lens/tests', description: 'Lista os testes' }, testes))
  await $.tool.call(doAgente({ tool: 'Bash', command: 'find plugins/csr-lens/hooks -type f | sort', description: 'Lista os hooks' }, mapear))
  await pensar(revisor, 0.04, 17_000, 200, 1.6)
  await $.tool.call(doAgente({ tool: 'Grep', pattern: 'semRaiz|cabeca\\(', path: HOOKS }, revisor))
  await pensar(testes, 0.08, 36_500, 350, 2.8)
  await $.tool.call(
    doAgente(
      {
        tool: 'SubagentHandback',
        message:
          'Arquivos em plugins/csr-lens/tests: achados.ts, caminhos-do-bash.test.ts, corridas.test.tsx, csr-lens.test.tsx, estresse.test.tsx, formato.test.ts, memoria.test.ts, motor.ts, rodadas.test.tsx, subagentes.test.tsx, telas.test.tsx, tempo.test.tsx. Total: 12 arquivos. Não há subpastas nem arquivos oculto.',
      },
      testes,
    ),
  )
  await terminar(
    testes,
    'Arquivos em plugins/csr-lens/tests:\n\n- achados.ts\n- caminhos-do-bash.test.ts\n- corridas.test.tsx\n- csr-lens.test.tsx\n- estresse.test.tsx\n- formato.test.ts\n- memoria.test.ts\n- motor.ts\n- rodadas.test.tsx\n- subagentes.test.tsx\n- telas.test.tsx\n- tempo.test.tsx\n\nTotal: 12 arquivos. Não há subpastas nem arquivos ocultos.',
    36_500,
    367,
  )
  await pensar(mapear, 0.09, 37_600, 500, 3.4)
  await $.tool.call(
    doAgente(
      {
        tool: 'SubagentHandback',
        message: 'Arquivos em plugins/csr-lens/hooks (25 no total, sem subpastas): hooks.json; 8 .tsx (register, telas, pecas, fichas, arvore-tela, inventario-tela, diffs-tela, visao-tela); 16 .ts (rodadas, memoria, caminhos-do-bash, caminho, graficos, workflows, desenhos, inventario, formato, cores, diff, diff-svg, diffs-lista, arvore, pilulas, dados).',
      },
      mapear,
    ),
  )
  await terminar(
    mapear,
    'Arquivos em plugins/csr-lens/hooks (25 no total, sem subpastas):\n\n- Config: hooks.json\n- .tsx (8): register.tsx, telas.tsx, pecas.tsx, fichas.tsx, arvore-tela.tsx, inventario-tela.tsx, diffs-tela.tsx, visao-tela.tsx\n- .ts (16): rodadas.ts, memoria.ts, caminhos-do-bash.ts, caminho.ts, graficos.ts, workflows.ts, desenhos.ts, inventario.ts, formato.ts, cores.ts, diff.ts, diff-svg.ts, diffs-lista.ts, arvore.ts, pilulas.ts, dados.ts',
    37_600,
    520,
  )
  await $.tool.call({ tool: 'Edit', file_path: `${RAIZ}/teste-lens.md`, old_string: TESTE_LENS[2] ?? '', new_string: TESTE_LENS[2]?.replace('mostra', 'exibe') ?? '' })

  // O coordenador cria o segundo Explore; o revisor relê um trecho.
  await pensar(coordenador, 0.05, 41_000, 300, 1.4)
  const tipos = await criar('tipos', 'Explore', 'Ler os tipos', `${SO_LEITURA}Diga quantos tipos exportados (export type / export interface / export enum etc.) existem em plugins/csr-lens/types/index.d.ts. Responda com o total e a lista de nomes.`, { pai: coordenador })
  await $.tool.call(doAgente({ tool: 'Grep', pattern: '^export (type|interface|enum)', path: `${RAIZ}/plugins/csr-lens/types/index.d.ts` }, tipos))
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${HOOKS}/caminho.ts` }, revisor))
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${RAIZ}/plugins/csr-lens/types/index.d.ts` }, tipos))

  // Os dois do projeto.
  const contar = await criar(
    'contar',
    'conferente-de-readme',
    'Contar seções do README',
    `${SO_LEITURA}Quantas seções de nível ## tem plugins/csr-lens/README.md? Responda em poucas linhas, com o número e os títulos.`,
    { provider: DO_PROJETO },
  )
  await $.tool.call(doAgente({ tool: 'Grep', pattern: '^## ', path: `${RAIZ}/plugins/csr-lens/README.md` }, contar))
  await pensar(contar, 0.05, 7300, 300, 2.1)
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'plugins/csr-lens/README.md tem 11 seções de nível ## (fora dos blocos de código): Requisitos, Instalar e atualizar, Usar, A linha de resumo, As abas, No terminal, O custo de cada agente, Quando algo dá errado, Limites conhecidos, Privacidade, Desenvolver.' },
      contar,
    ),
  )
  await terminar(
    contar,
    'plugins/csr-lens/README.md tem 11 seções de nível ## (contei só as que ficam fora de blocos de código): 1. Requisitos (linha 42) 2. Instalar e atualizar (49) 3. Usar (78) 4. A linha de resumo (97) 5. As abas (125) 6. No terminal (428) 7. O custo de cada agente (440) 8. Quando algo dá errado (450) 9. Limites conhecidos (472) 10. Privacidade (492) 11. Desenvolver (511).',
    7300,
    280,
  )
  await $.tool.call({ tool: 'Edit', file_path: `${RAIZ}/plugins/csr-lens/README.md`, old_string: '[Inventario](#6-inventário)', new_string: '[Inventário](#6-inventário)' })
  const procurar = await criar(
    'procurar',
    'conferente-de-readme',
    'Procurar a Visão geral',
    `${SO_LEITURA}O plugins/csr-lens/README.md cita a aba "Visão geral"? Responda sim ou não, em poucas linhas, com as linhas onde aparece.`,
    { provider: DO_PROJETO },
  )
  await $.tool.call(doAgente({ tool: 'Bash', command: 'grep -n -i "vis[aã]o geral" plugins/csr-lens/README.md', description: 'Procura a aba no README' }, procurar))
  await pensar(tipos, 0.12, 38_200, 600, 4.5)
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'plugins/csr-lens/types/index.d.ts (551 linhas) tem 40 tipos exportados, todos `export type`: LensAba, LensUi, LensFoco, LensAgente, LensRodada, LensTurno, …' },
      tipos,
    ),
  )
  await terminar(
    tipos,
    'plugins/csr-lens/types/index.d.ts (551 linhas) tem **40 tipos exportados**. Os 40 são todos `export type`. O arquivo não tem nenhum `export interface`, `export enum`, `export declare`, `export namespace` nem `export { ... }`. Lista, na ordem em que aparecem (com o número da linha): 1. LensAba (5) 2. LensUi (7) 3. LensFoco (48) 4. LensAgente (60) 5. LensRodada (120) …',
    38_200,
    610,
  )
  await pensar(revisor, 0.04, 24_000, 700, 3.0)
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'Achei 3 pontos em plugins/csr-lens/hooks/formato.ts, do mais grave para o menos grave: 1. Linha 228, semRaiz troca a raiz também quando ela é só o começo de outro nome de pasta. 2. Linha 61, duracao arredonda 59,96 s para "60s" em vez de "1m00s". 3. Linha 140, tokens não trata número negativo.' },
      revisor,
    ),
  )
  await terminar(
    revisor,
    'Achei 3 pontos em plugins/csr-lens/hooks/formato.ts, do mais grave para o menos grave:\n\n1. **Linha 228, `semRaiz`** troca a raiz também quando ela é só o começo de outro nome de pasta: com raiz `/Users/c/proj` e o texto `cd /Users/c/proj-old`, sai `cd -old`.\n2. **Linha 61, `duracao`** arredonda 59,96 s para `60s` em vez de `1m00s`.\n3. **Linha 140, `tokens`** não trata número negativo (mostra `-1,2k` sem sinal de erro).',
    24_000,
    720,
  )
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${RAIZ}/plugins/csr-lens/README.md` }, procurar))
  await pensar(coordenador, 0.09, 50_300, 900, 2.4)
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'Rodei os dois subagentes Explore em primeiro plano, um depois do outro. Não editei nada nem rodei comando git. Ler os testes: 12 arquivos em plugins/csr-lens/tests, nenhuma subpasta. Ler os tipos: 40 tipos exportados em types/index.d.ts, todos export type.' },
      coordenador,
    ),
  )
  await terminar(
    coordenador,
    'Rodei os dois subagentes Explore em primeiro plano, um depois do outro. Não editei nada nem rodei comando git.\n\n- **Ler os testes:** `plugins/csr-lens/tests` tem **12 arquivos** e nenhuma subpasta: achados.ts, caminhos-do-bash.test.ts, corridas.test.tsx, csr-lens.test.tsx, estresse.test.tsx, formato.test.ts, memoria.test.ts, motor.ts, rodadas.test.tsx, subagentes.test.tsx, telas.test.tsx, tempo.test.tsx.\n- **Ler os tipos:** `plugins/csr-lens/types/index.d.ts` tem **40 tipos exportados**, todos `export type` (LensAba, LensUi, LensFoco, LensAgente, LensRodada…).',
    50_300,
    939,
  )
  await $.tool.call(doAgente({ tool: 'Grep', pattern: 'Visão geral', path: `${RAIZ}/plugins/csr-lens/README.md` }, procurar))
  await pensar(procurar, 0.07, 12_100, 400, 3.6)
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'Sim, mas só de passagem: não há seção própria para a aba Visão geral, e ela não aparece nas listas de abas. Aparece nas linhas 144 (o exemplo do caminho) e 264 (As rodadas de um agente).' },
      procurar,
    ),
  )
  await terminar(
    procurar,
    'Sim, mas só de passagem. Não há seção própria para a aba, e ela não aparece nas listas de abas. Onde aparece em plugins/csr-lens/README.md:\n\n- Linha 144: no exemplo do caminho abaixo das abas, `◉ Visão geral › Turno 2 › Revisar o plano › Rodada 2`.\n- Linha 264, em "As rodadas de um agente": "da aba Agentes, da Visão geral, do grafo ou da linha do tempo".',
    12_100,
    410,
  )
  await $.tool.call({ tool: 'Bash', command: 'git status --short', description: 'O que mudou' })
  await pensar(undefined, 0.2, 95_000, 1800, 4.2)
  await ate(45 + 46)
  await $.turn.complete(
    fimDoTurno(
      't1',
      'Terminei o teste. O `teste-lens.md` está na raiz com 5 linhas; na linha 3 troquei "mostra" por "exibe". No README do plugin, "Inventario" virou "Inventário". Nada foi commitado, enviado ou buscado do remoto.\n\n| Agente | Modo | Resultado |\n|---|---|---|\n| exemplos:revisor — "Revisar o formato.ts" | segundo plano | 3 pontos; o mais grave, `semRaiz` (linha 228) |\n| general-purpose — "Coordenar a leitura" | segundo plano | 12 arquivos de teste; 40 tipos exportados |\n| Explore — "Mapear os hooks" | segundo plano | 25 arquivos em hooks/ |\n| conferente-de-readme — "Contar seções do README" | segundo plano | 11 seções ## |\n| conferente-de-readme — "Procurar a Visão geral" | segundo plano | citada só de passagem (linhas 144 e 264) |',
      46_000,
    ),
  )
  await medir(95_600)
  // Os dois de segundo plano voltam, cada um num turno do Claude Code.
  await retorno('r1', revisor, 'Achei 3 pontos em formato.ts; o mais grave é o semRaiz da linha 228.', 'O revisor voltou com 3 pontos em `formato.ts`; o mais grave é o `semRaiz` da linha 228, que troca a raiz também quando ela é só o começo de outro nome de pasta.', 4.1)
  await retorno('r2', coordenador, 'Ler os testes: 12 arquivos. Ler os tipos: 40 tipos exportados.', 'O "Coordenar a leitura" voltou: 12 arquivos em `tests/` e 40 tipos exportados em `types/index.d.ts`, todos `export type`.', 5.3)
  await medir(96_400)

  // ─── Turno 2: recados acordam o revisor e o coordenador (rodada 2) ────────
  await ate(108)
  await $.turn.start({
    text:
      'Continue o teste, somente leitura. 1. Mande com SendMessage para o agente "Revisar o formato.ts" (pelo id dele; NÃO crie outro): "Agora revise plugins/csr-lens/hooks/caminho.ts, no máximo 2 pontos." 2. Mande com SendMessage para o agente "Coordenar a leitura" (pelo id dele; NÃO crie outro): "Crie UM subagente Explore em primeiro plano \'Contar os SVGs\' (quantos .svg tem docs/arte). Depois mande com SendMessage para o agente de id <ID DO REVISOR> a pergunta \'Quantos pontos você achou no total?\' e espere a resposta dele chegar antes de terminar." Mostre as duas respostas quando chegarem.',
    turnId: 't2',
  })
  await pensar(undefined, 0.05, 96_600, 500, 1.6, 't2')
  await recado(undefined, revisor, 'Agora revise plugins/csr-lens/hooks/caminho.ts, no máximo 2 pontos.')
  await recado(
    undefined,
    coordenador,
    `Nova tarefa, somente leitura: crie UM subagente Explore em primeiro plano 'Contar os SVGs' (quantos .svg tem docs/arte). Depois mande com SendMessage para o agente de id ${revisor} a pergunta 'Quantos pontos você achou no total?' e espere a resposta dele chegar antes de terminar. Responda em poucas linhas com a contagem de SVGs e a resposta do revisor.`,
  )
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${HOOKS}/caminho.ts` }, revisor))
  await pensar(coordenador, 0.03, 52_000, 200, 1.1, 't2')
  await $.tool.call(doAgente({ tool: 'ToolSearch', query: 'select:SendMessage' }, coordenador))
  const svgs = await criar('svgs', 'Explore', 'Contar os SVGs', `${SO_LEITURA}Conte quantos arquivos .svg existem em docs/arte (inclua subpastas, se houver). Responda com o total e a lista de nomes.`, { pai: coordenador })
  await $.tool.call(doAgente({ tool: 'Bash', command: "find docs/arte -name '*.svg' | wc -l", description: 'Conta os SVGs' }, svgs))
  await $.tool.call(doAgente({ tool: 'Grep', pattern: 'voltaDoFoco|comVolta|cadeiaDoFoco', path: HOOKS }, revisor))
  await $.tool.call(doAgente({ tool: 'Glob', pattern: 'docs/arte/**/*.svg' }, svgs))
  await pensar(svgs, 0.09, 37_800, 600, 3.9, 't2')
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'Encontrei 30 arquivos .svg em docs/arte, contando a subpasta telas/: 14 na raiz (aba-1 a aba-6, kit, selo-agente, selo-estilo, selo-hook, selo-mod, selo-pacote, selo-skill, selo-tema) e 16 em telas/. Nada foi alterado.' },
      svgs,
    ),
  )
  await terminar(
    svgs,
    'Encontrei 30 arquivos .svg em docs/arte, contando a subpasta telas/. Nada foi alterado. **Na raiz de docs/arte (14):** aba-1.svg, aba-2.svg, aba-3.svg, aba-4.svg, aba-5.svg, aba-6.svg, kit.svg, selo-agente.svg, selo-estilo.svg, selo-hook.svg, selo-mod.svg, selo-pacote.svg, selo-skill.svg, selo-tema.svg. **Em docs/arte/telas (16):** agentes.svg, agentes-ampliado.svg, agentes-terminal.svg, agentes-workflow.svg, arvore.svg, contexto.svg, diffs.svg, ficha-agente.svg, ficha-turno.svg, inventario.svg, pilulas.svg, pilulas-estreitas.svg, selos-terminal.svg, turnos.svg, turnos-terminal.svg, visao-geral.svg.',
    37_800,
    640,
  )
  await pensar(coordenador, 0.02, 53_000, 150, 0.9, 't2')
  await recado(coordenador, revisor, 'Quantos pontos você achou no total?')
  await $.tool.call({ tool: 'Bash', command: 'git status --short', description: 'O que mudou' })
  await pensar(undefined, 0.05, 98_900, 600, 2.0, 't2')
  await ate(108 + 15)
  await $.turn.complete(fimDoTurno('t2', 'Mandei as duas mensagens e os dois agentes voltaram a trabalhar. Nenhum agente novo foi criado por mim. Agora espero as respostas.', 15_000))
  await medir(99_100)
  await pensar(revisor, 0.03, 25_500, 300, 1.8, 't2')
  await recado(revisor, coordenador, 'Três em formato.ts e dois em caminho.ts: cinco pontos, nenhum grave.')
  await pensar(coordenador, 0.03, 54_600, 400, 1.7, 't2')
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'Contei os SVGs e já tenho a resposta do revisor. Não editei nada nem rodei comando git. Contar os SVGs: 30 arquivos .svg em docs/arte (14 na raiz e 16 em telas/). Revisor: cinco pontos no total, três em formato.ts e dois em caminho.ts, nenhum grave.' },
      coordenador,
    ),
  )
  await terminar(
    coordenador,
    'Contei os SVGs e já tenho a resposta do revisor. Não editei nada nem rodei comando git.\n\n- **Contar os SVGs:** o Explore achou **30 arquivos .svg** em docs/arte (14 na raiz e 16 em telas/).\n- **Revisor:** cinco pontos no total, três em formato.ts e dois em caminho.ts, nenhum grave.',
    54_600,
    1100,
  )
  await retorno('r3', coordenador, 'Contar os SVGs: 30 arquivos .svg em docs/arte. Revisor: cinco pontos no total.', 'O "Coordenar a leitura" voltou: 30 SVGs em `docs/arte` (14 na raiz, 16 em `telas/`), e o revisor lhe disse cinco pontos no total.', 2.2)
  await pensar(revisor, 0.03, 26_000, 500, 2.3, 't2')
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'Revisão de plugins/csr-lens/hooks/caminho.ts. Nenhum dos dois pontos é grave: 1. Linhas 18 e 55: a cadeia não tem limite ao ser montada, só ao ser lida (12 níveis). 2. Linha 31: a regex da rodada aceita rodada:0:id, e a rodada 0 não existe.' },
      revisor,
    ),
  )
  await terminar(
    revisor,
    'Revisão de plugins/csr-lens/hooks/caminho.ts. Nenhum dos dois pontos é grave:\n\n1. **Linhas 18 e 55:** a cadeia não tem limite ao ser montada (`voltaDoFoco` concatena sem olhar o tamanho), só ao ser lida (12 níveis em `cadeiaDoFoco`).\n2. **Linha 31:** a regex da rodada aceita `rodada:0:id`, e a rodada 0 não existe.',
    26_000,
    480,
  )
  await retorno('r4', revisor, '2 pontos em caminho.ts, nenhum grave.', 'O revisor voltou com 2 pontos em `caminho.ts`, nenhum grave: a cadeia sem limite ao ser montada e a regex que aceita a rodada 0.', 2.6)
  await medir(99_400)

  // ─── Turno 3: um Explore em segundo plano, parado pelo botão ──────────────
  await ate(169)
  await $.turn.start({
    text: 'Crie em segundo plano um agente Explore "Ler tudo devagar": "Somente leitura. Leia com Read, um por vez, cada arquivo de plugins/csr-lens/hooks e diga uma linha sobre cada um." Mostre o resultado quando ele terminar.',
    turnId: 't3',
  })
  await pensar(undefined, 0.05, 99_700, 400, 1.4, 't3')
  const devagar = await criar('devagar', 'Explore', 'Ler tudo devagar', 'Somente leitura. Leia com Read, um por vez, cada arquivo de plugins/csr-lens/hooks e diga uma linha sobre cada um.')
  await $.tool.call(doAgente({ tool: 'Bash', command: 'find plugins/csr-lens/hooks -type f | sort', description: 'Lista os hooks' }, devagar))
  await pensar(undefined, 0.06, 100_600, 700, 2.6, 't3')
  await ate(169 + 14)
  await $.turn.complete(
    fimDoTurno('t3', 'Criei o Explore "Ler tudo devagar" em segundo plano. Ele vai abrir os 25 arquivos de `plugins/csr-lens/hooks` um por um, então deve levar um tempo e aparecer bastante na Árvore do Lens. Mostro o resultado quando ele terminar.', 14_000),
  )
  await medir(100_900)
  for (const arquivo of ['arvore-tela.tsx', 'arvore.ts', 'caminho.ts']) {
    await pensar(devagar, 0.08, 40_000, 300, 9.5, 't3')
    await $.tool.call(doAgente({ tool: 'Read', file_path: `${HOOKS}/${arquivo}` }, devagar))
  }
  await pensar(devagar, 0.08, 51_900, 300, 8.5, 't3')
  // A pessoa abre o detalhe dele e aperta o botão de parar.
  {
    const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop', props: painel('dock', LARGURA) })
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: `ver-agente-${devagar}` })
    await ui.press({ key: 'parar-agente' })
    await voltarAoInicio(ui as unknown as Montado)
    await ui.unmount()
  }
  // A próxima ferramenta dele é negada; ele entrega o que fez e termina.
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${HOOKS}/caminhos-do-bash.ts` }, devagar)).catch(() => undefined)
  await pensar(devagar, 0.09, 52_600, 600, 6.4, 't3')
  await $.tool.call(
    doAgente(
      { tool: 'SubagentHandback', message: 'Parei a pedido, pelo painel. Li 3 dos 25 arquivos de plugins/csr-lens/hooks: arvore-tela.tsx (desenha a aba Árvore), arvore.ts (a lógica pura da árvore) e caminho.ts (o caminho de um detalhe aberto). Ficaram 22 sem ler, de caminhos-do-bash.ts a workflows.ts.' },
      devagar,
    ),
  )
  await terminar(
    devagar,
    'Parei a pedido, pelo painel. Li 3 dos 25 arquivos de plugins/csr-lens/hooks:\n\n1. `arvore-tela.tsx`: desenha a aba Árvore, com a letra do git colorida, as contas +N −N e o arquivo que acende enquanto o Claude lê ou edita.\n2. `arvore.ts`: a lógica pura da árvore: registra o que foi lido e editado, lê o `git status` e o `git diff --numstat` e soma por pasta.\n3. `caminho.ts`: guarda por onde a pessoa chegou a um detalhe aberto, para o Voltar e o caminho no alto.\n\nFicaram 22 sem ler, de `caminhos-do-bash.ts` a `workflows.ts`.',
    52_600,
    620,
  )
  await retorno('r5', devagar, 'Parei a pedido, pelo painel. Li 3 dos 25 arquivos.', 'O "Ler tudo devagar" parou antes de terminar, a seu pedido pelo painel: leu 3 dos 25 arquivos. Se quiser, crio outro para continuar de `caminhos-do-bash.ts`.', 3.8)
  await medir(101_600)

  // ─── Turno 4, em andamento: outro Explore trabalhando agora ───────────────
  await ate(284)
  await $.turn.start({ text: 'Roda mais um agente por favor, igual ao anterior, com o nome "Ler tudo devagar 2".', turnId: 't4' })
  await pensar(undefined, 0.05, 101_900, 400, 1.3, 't4')
  const devagar2 = await criar('devagar2', 'Explore', 'Ler tudo devagar 2', 'Somente leitura. Leia com Read, um por vez, cada arquivo de plugins/csr-lens/hooks e diga uma linha sobre cada um. No fim, entregue o relatório com todas as linhas.')
  await $.tool.call(doAgente({ tool: 'Bash', command: 'find plugins/csr-lens/hooks -type f | sort', description: 'Lista os hooks' }, devagar2))
  for (const arquivo of ['arvore-tela.tsx', 'arvore.ts', 'caminho.ts', 'caminhos-do-bash.ts', 'cores.ts']) {
    await pensar(devagar2, 0.05, 44_000, 250, 5.2, 't4')
    await $.tool.call(doAgente({ tool: 'Read', file_path: `${HOOKS}/${arquivo}` }, devagar2))
  }
  await pensar(devagar2, 0.05, 60_100, 250, 4.1, 't4')
  await medir(104_800)
  // A conversa principal pensa (o cérebro acende) enquanto o agente lê um
  // arquivo que não termina: ele fica aceso na Árvore e no "Agora".
  await pensar(undefined, 0.4, 104_800, 200, 1.0, 't4')
  await medir(104_800)
  // (O responder fica preso daqui em diante: nenhuma outra ferramenta roda.)
  motor.responder = () => new Promise<ToolCallResult>(() => undefined)
  void $.tool.call(doAgente({ tool: 'Read', file_path: `${HOOKS}/dados.ts` }, devagar2)).catch(() => undefined)
  await avancar(6000)

  // ─── As telas ─────────────────────────────────────────────────────────────
  // O painel abre na Visão geral; depois do despejo dela, as outras partem da aba Agentes.
  await despejar($, 'visao-geral', 'desktop', LARGURA)
  await despejar($, 'agentes', 'desktop', LARGURA, aba(1))
  // O grafo ampliado, com zoom de 125% (e de volta ao normal depois).
  await despejar($, 'agentes-ampliado', 'desktop', LARGURA, async ui => {
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: 'grafo-tamanho' })
  })
  {
    const ui = (await $.ui.mount({ ...PAINEL, surface: 'desktop', props: painel('dock', LARGURA) })) as unknown as Montado
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: 'grafo-tamanho' })
    // O zoom volta a 100% (o ampliado deixou 125%).
    await ui.press({ key: 'grafo-menos' })
    await voltarAoInicio(ui)
    await (ui as unknown as { unmount: () => Promise<void> }).unmount()
  }
  // O detalhe do agente com duas rodadas: só os totais e a lista de rodadas.
  await despejar($, 'agente-rodadas', 'desktop', LARGURA, async ui => {
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: `ver-agente-${coordenador}` })
  })
  // A tela da rodada 2 dele: o recado, o agente que criou, os recados trocados.
  await despejar($, 'rodada', 'desktop', LARGURA, async ui => {
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: `ver-agente-${coordenador}` })
    await ui.press({ key: `ver-rodada-${coordenador}-2` })
  })
  // Um agente de uma rodada só, aberto de dentro da rodada 1 do coordenador:
  // o caminho no alto tem quatro níveis.
  await despejar($, 'ficha-agente', 'desktop', LARGURA, async ui => {
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: `ver-agente-${coordenador}` })
    await ui.press({ key: `ver-rodada-${coordenador}-1` })
    await ui.press({ key: `ver-agente-${testes}` })
  })
  await despejar($, 'turnos', 'desktop', LARGURA, aba(4))
  await despejar($, 'ficha-turno', 'desktop', LARGURA, async ui => {
    await ui.press({ key: 'aba-4' })
    await ui.press({ key: 'ver-turno-2' })
  })
  await despejar($, 'diffs', 'desktop', LARGURA, async ui => {
    await ui.press({ key: 'aba-2' })
    await ui.press({ key: `ver-arquivo-${RAIZ}/teste-lens.md` })
  })
  await despejar($, 'arvore', 'desktop', LARGURA, aba(5))
  await despejar($, 'contexto', 'desktop', LARGURA, aba(3))
  await despejar($, 'inventario', 'desktop', LARGURA, aba(6))
  await despejar($, 'agentes', 'terminal', 72, aba(1))
  await despejar($, 'turnos', 'terminal', 72, aba(4))

  // A linha de resumo: com a conversa principal trabalhando, os limites e o
  // modelo. As pílulas gravam os números no máximo a cada 3 s.
  await avancar(3000)
  const pilulas = await $.ui.mount({ plugin: MOD, component: 'AbovePrompt', surface: 'desktop', props: { ...faixa(), bodyColumns: 160, isWorking: true } })
  console.log(`@@TELA pilulas desktop 160@@${JSON.stringify(await pilulas.drawn())}`)
  await pilulas.unmount()
  // Mais estreita, em duas fileiras (para a coluna de texto do blog).
  const estreitas = await $.ui.mount({ plugin: MOD, component: 'AbovePrompt', surface: 'desktop', props: { ...faixa(), bodyColumns: 100, isWorking: true } })
  console.log(`@@TELA pilulas-estreitas desktop 100@@${JSON.stringify(await estreitas.drawn())}`)
  await estreitas.unmount()
  const selos = await $.ui.mount({ plugin: MOD, component: 'AbovePrompt', surface: 'terminal', props: { ...faixa(), bodyColumns: 140, isWorking: true } })
  console.log(`@@TELA selos terminal 140@@${JSON.stringify(await selos.drawn())}`)
  await selos.unmount()

  // Por fim, o botão de parar no agente que roda agora: a tela depois do
  // clique (por isso é a última: o estado "parando" fica).
  await despejar($, 'agente-parando', 'desktop', LARGURA, async ui => {
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: `ver-agente-${devagar2}` })
    await ui.press({ key: 'parar-agente' })
  })
})

// Um workflow, numa sessão própria (para não entulhar o grafo das telas de
// cima): três agentes em duas fases, lidos dos arquivos da execução.
test('tela do workflow', async ($, on) => {
  const motor = ligar(on)
  comRepositorio(motor)
  motor.sessao.env.HOME = '/casa'
  await motor.relogio.advance(ATE_AS_DEZ_E_VINTE)
  motor.uso = { startedAt: 0, context: { tokens: 71_000, window: 200_000, percent: 36 }, rateLimits: [], cost: { usd: 0.8 } }
  await $.session.start({ ...INICIO, cwd: RAIZ })
  await motor.relogio.advance(3500)

  const pasta = `/casa/.claude/projects/-claude-code-kit/${SESSAO}`
  const execucao = `${pasta}/subagents/workflows/wf_1`
  motor.listas['/casa/.claude/projects/-claude-code-kit'] = [entrada(SESSAO, 'dir')]
  motor.listas[`${pasta}/subagents/workflows`] = [entrada('wf_1', 'dir')]
  motor.arquivos[`${execucao}/journal.jsonl`] = [
    { type: 'started', key: 'k1', agentId: 'w1', label: 'pesquisa:marketplaces', phase: 'Pesquisa' },
    { type: 'started', key: 'k2', agentId: 'w2', label: 'pesquisa:mods', phase: 'Pesquisa' },
    { type: 'result', key: 'k1', agentId: 'w1', result: { resumo: 'Os marketplaces de terceiros vêm com a atualização automática desligada.' } },
    { type: 'started', key: 'k3', agentId: 'w3', label: 'critica:catalogo', phase: 'Crítica' },
  ]
    .map(linha => JSON.stringify(linha))
    .join('\n')
  for (const id of ['w1', 'w2', 'w3']) {
    motor.arquivos[`${execucao}/agent-${id}.meta.json`] = JSON.stringify({ model: 'claude-sonnet-5-5' })
  }
  motor.semTranscricao = ['w1', 'w2', 'w3']
  motor.responder = e =>
    e.tool === 'Workflow'
      ? { result: { status: 'async_launched', runId: 'wf_1', workflowName: 'pesquisa-de-plugins', transcriptDir: execucao }, text: 'ok' }
      : { result: { type: 'text' }, text: 'ok' }
  await $.turn.start({ text: 'Rode o workflow de pesquisa de plugins', turnId: 't1' })
  await $.tool.call({ tool: 'Workflow', script: "export const meta = { name: 'pesquisa-de-plugins' }" } as never)
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${RAIZ}/.claude-plugin/marketplace.json` }, 'w1'))
  await $.tool.call(doAgente({ tool: 'Grep', pattern: 'modules', path: `${RAIZ}/plugins` }, 'w2'))
  await $.tool.call(doAgente({ tool: 'Read', file_path: `${RAIZ}/README.md` }, 'w3'))
  await motor.relogio.advance(9000)
  await $.turn.complete({
    ...fimDoTurno('w1', '', 8000, 'w1'),
    usage: { input_tokens: 9000, output_tokens: 2400, cache_read_input_tokens: 61_000, cache_creation_input_tokens: 4000, model: 'claude-sonnet-5-5' },
  })
  await motor.relogio.advance(3000)
  await despejar($, 'agentes-workflow', 'desktop', LARGURA, aba(1))
})

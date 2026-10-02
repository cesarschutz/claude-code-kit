import type { SessionUsage, ToolCallResult } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import {
  AGORA,
  COMANDO,
  INICIO,
  SUPERFICIES,
  doAgente,
  faixa,
  fimDoTurno,
  ligar,
  painel,
  subagente,
} from './motor'

const MOD = 'csr-cockpit'
const PAINEL = { plugin: MOD, component: 'Pane', requestId: MOD } as const

type Achados = {
  find: (query: { type?: string; key?: string; text?: string | RegExp }) => Promise<
    { text: string; props: Record<string, unknown> } | undefined
  >
}

// O desenho mostra um texto (em qualquer Text, por inclusão ou padrão).
const mostra = async (ui: Achados, texto: string | RegExp) => {
  expect(await ui.find({ type: 'Text', text: texto }), `falta no desenho: ${String(texto)}`).toBeDefined()
}

const naoMostra = async (ui: Achados, texto: string | RegExp) => {
  expect(await ui.find({ type: 'Text', text: texto }), `sobra no desenho: ${String(texto)}`).toBeUndefined()
}

// A cor do Text que mostra exatamente esse trecho (a marca, a aba ativa).
const corDe = async (ui: Achados, texto: string | RegExp) =>
  (await ui.find({ type: 'Text', text: texto }))?.props.color

const uso = (tokens: number, percent: number, usd: number): SessionUsage => ({
  startedAt: AGORA,
  context: { tokens, window: 200_000, percent },
  rateLimits: [],
  cost: { usd },
})

const FAIXA = { plugin: MOD, component: 'AbovePrompt' } as const

// O texto da linha de resumo, sem o selo.
const resumoDe = async (ui: Achados) =>
  (await ui.find({ type: 'Text', text: /^ +(contexto|limite|agentes) / }))?.text?.trim()

test('linha de resumo: em azul na faixa acima do prompt, cada parte com o seu nome', async ($, on) => {
  const motor = ligar(on)
  motor.uso = uso(134_400, 67, 1.84)
  await $.session.start(INICIO)

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...FAIXA, surface, props: faixa() })
    const selo = await ui.find({ type: 'Text', text: /^ CSR $/ })
    expect(selo?.props.color).toBe('suggestion')
    expect(selo?.props.inverse).toBe(true)
    await mostra(ui, /^ Cockpit$/)
    expect(await resumoDe(ui)).toBe('contexto 67% · 134,4k tokens · US$ 1,84')
    expect(await corDe(ui, /^ +contexto /)).toBe('suggestion')
    await ui.unmount()
  }

  const ui = await $.ui.mount({ ...FAIXA, surface: 'desktop', props: faixa() })
  const explore = await $.agent.spawn(subagente('t1', 'Explore', 'procurar hooks'))
  await $.agent.spawn(subagente('t2', 'Plan', 'planejar'))
  expect(await resumoDe(ui)).toBe('contexto 67% · 134,4k tokens · US$ 1,84 · agentes 2 rodando')

  await $.turn.complete(fimDoTurno('s1', 'Pronto.', 4000, explore.agentId))
  expect(await resumoDe(ui)).toBe(
    'contexto 67% · 134,4k tokens · US$ 1,84 · agentes 1 rodando, 1 concluído',
  )

  await $.session.measure({
    context: { tokens: 152_600, window: 200_000, percent: 76 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 38 },
      { kind: 'seven_day', percentUsed: 60 },
    ],
    cost: { usd: 2.05 },
    changed: ['context', 'cost', 'rateLimits'],
  })
  expect(await resumoDe(ui)).toBe(
    'contexto 76% · 152,6k tokens · US$ 2,05 · limite 5h 38%, 7d 60% · agentes 1 rodando, 1 concluído',
  )

  // Com um turno em curso: entre parênteses, o que ele somou até agora.
  motor.uso = uso(152_600, 76, 2.05)
  await $.turn.start({ text: 'mais um pedido', turnId: 't1' })
  expect(await resumoDe(ui)).toMatch(/^contexto 76% · 152,6k tokens · US\$ 2,05 · /)
  motor.uso = uso(170_800, 85, 2.26)
  await $.session.measure({ ...motor.uso, changed: ['context', 'cost'] })
  expect(await resumoDe(ui)).toMatch(
    /^contexto 85% · 170,8k tokens \(\+18,2k\) · US\$ 2,26 \(\+0,21\) · /,
  )
  await ui.unmount()

  // A status line do Claude Code (a linha amarela) não é usada.
  expect(motor.visto.status).toEqual([])
})

test('linha de resumo: sessão recém-aberta, sem leitura nenhuma, não mostra linha', async ($, on) => {
  const motor = ligar(on)
  motor.uso = { startedAt: AGORA, context: { window: 200_000 }, rateLimits: [] }
  await $.session.start(INICIO)
  const ui = await $.ui.mount({ ...FAIXA, surface: 'terminal', props: faixa() })
  expect(await ui.find({ type: 'Text', text: /^ CSR $/ })).toBeUndefined()
  expect(await resumoDe(ui)).toBeUndefined()
  await ui.unmount()
  expect(motor.visto.status).toEqual([])
})

test('aba 1, Agentes: rodando com atividade, concluídos com duração e resultado', async ($, on) => {
  const motor = ligar(on)
  await $.session.start(INICIO)
  const explore = await $.agent.spawn(subagente('t1', 'Explore', 'procurar hooks'))
  const plan = await $.agent.spawn(subagente('t2', 'Plan', 'planejar'))
  const revisor = await $.agent.spawn(subagente('t3', 'revisor-de-posts', 'revisar'))
  await $.tool.call(doAgente({ tool: 'Read', file_path: '/proj/src/a.ts' }, explore.agentId))
  await motor.relogio.advance(72_000)
  await $.turn.complete(fimDoTurno('s2', '\nPlano em 3 passos\ndetalhes', 95_000, plan.agentId))
  await $.turn.complete(fimDoTurno('s3', '', 12_000, revisor.agentId, 'error'))

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel() })
    await mostra(ui, 'Rodando (1)')
    expect(await corDe(ui, 'Rodando (1)')).toBe('suggestion')
    // O nome é o botão que abre o detalhe, e fica sublinhado com o mouse na linha.
    const nome = await ui.find({ key: `ver-agente-${String(explore.agentId)}` })
    expect(nome?.props.label).toBe('▸ Explore')
    expect(JSON.stringify(await ui.drawn())).toMatch(
      /"hover":\{"underline":true,"color":"suggestion"\}/,
    )
    await mostra(ui, /^ haiku-4-5 · 1m12s · 1 chamada$/)
    await mostra(ui, 'procurar hooks')
    await mostra(ui, 'Read src/a.ts')
    expect(await corDe(ui, /^●$/)).toBe('suggestion')

    await mostra(ui, 'Concluídos (2)')
    expect((await ui.find({ key: `ver-agente-${String(plan.agentId)}` }))?.props.label).toBe('▸ Plan')
    await mostra(ui, /^ haiku-4-5 · 1m35s$/)
    await mostra(ui, 'Plano em 3 passos')
    await naoMostra(ui, 'detalhes')
    expect(await corDe(ui, /^✓$/)).toBe('success')
    expect((await ui.find({ key: `ver-agente-${String(revisor.agentId)}` }))?.props.label).toBe(
      '▸ revisor-de-posts',
    )
    await mostra(ui, /^ haiku-4-5 · 12s$/)
    await mostra(ui, 'terminou por error')
    expect(await corDe(ui, /^✗$/)).toBe('error')
    await ui.unmount()
  }
})

test('aba 2, Diffs: Edit e Write do loop principal, por turno, com diff real', async ($, on) => {
  const motor = ligar(on)
  motor.arquivos['/proj/b.ts'] = 'um\ndois\ntrês\n'
  motor.responder = (e): ToolCallResult => {
    if (e.tool === 'Edit') {
      const trecho = {
        oldStart: 10,
        oldLines: 3,
        newStart: 10,
        newLines: 4,
        lines: [' const a = 1', '-const b = 2', '+const b = 3', '+const c = 4', ' fim'],
      }

      return { result: { filePath: e.file_path, structuredPatch: [trecho] }, text: 'ok' }
    }

    // Como o motor quando não consegue montar o diff de um Write.
    return { result: { content: e.content, structuredPatch: [], originalFile: null }, text: 'ok' }
  }
  await $.session.start(INICIO)

  await $.turn.start({ text: 'primeiro', turnId: 't1' })
  await $.tool.call({ tool: 'Edit', file_path: '/proj/a.ts', old_string: 'x', new_string: 'y' })
  await $.tool.call({ tool: 'Write', file_path: '/proj/b.ts', content: 'um\n2\ntrês\nquatro\n' })
  // De um subagente: fora da aba.
  await $.tool.call(
    doAgente({ tool: 'Edit', file_path: '/proj/z.ts', old_string: 'x', new_string: 'y' }, 'ag-outro'),
  )
  await $.turn.complete(fimDoTurno('t1', 'feito', 1000))
  await $.turn.start({ text: 'segundo', turnId: 't2' })
  await $.tool.call({ tool: 'Write', file_path: '/proj/novo.ts', content: 'linha\n' })

  // O conteúdo antigo é lido antes de cada Write do loop principal.
  expect(motor.visto.ordem).toEqual([
    'tool.call Edit',
    'fs.read /proj/b.ts',
    'tool.call Write',
    'tool.call Edit',
    'fs.read /proj/novo.ts',
    'tool.call Write',
  ])

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel() })
    await ui.press({ key: 'aba-2' })
    await mostra(ui, 'Turno 2 · 1 edição em 1 arquivo')
    await mostra(ui, 'novo.ts')
    await mostra(ui, 'Write, arquivo novo')
    expect(await corDe(ui, /^\+ linha$/)).toBe('success')

    await ui.press({ key: 'turno-anterior' })
    await mostra(ui, 'Turno 1 · 2 edições em 2 arquivos')
    await naoMostra(ui, 'z.ts')
    await mostra(ui, 'a.ts')
    await mostra(ui, /^ {2}\+2$/)
    await mostra(ui, /^ −1$/)
    await mostra(ui, '@@ -10,3 +10,4 @@')
    await mostra(ui, /^ {2}11 − const b = 2$/)
    await mostra(ui, /^ {2}12 \+ const c = 4$/)
    expect(await corDe(ui, /^− const b = 2$/)).toBe('error')
    expect(await corDe(ui, /^\+ const b = 3$/)).toBe('success')

    // O Write num arquivo que já existia: o diff contra o conteúdo lido antes.
    await ui.press({ key: 'proximo' })
    await mostra(ui, 'b.ts')
    await mostra(ui, /^ {3}2 − dois$/)
    await mostra(ui, /^ {3}2 \+ 2$/)
    await mostra(ui, /^ {3}4 \+ quatro$/)
    await naoMostra(ui, 'arquivo novo')

    await ui.press({ key: 'anterior' })
    await mostra(ui, 'a.ts')
    expect((await ui.find({ key: 'anterior' }))?.props.hotkey).toBe('p')
    expect((await ui.find({ key: 'proximo' }))?.props.hotkey).toBe('n')

    await ui.press({ key: 'turno-seguinte' })
    await mostra(ui, 'Turno 2 · 1 edição em 1 arquivo')
    await ui.press({ key: 'aba-1' })
    await ui.unmount()
  }
})

test('aba 3, Contexto: uso, gráfico, custo, limite, estimativa a cada turno e contagem exata só no clique', async ($, on) => {
  const motor = ligar(on)
  motor.uso = uso(80_000, 40, 1.2)
  await $.session.start(INICIO)

  await $.turn.start({ text: 'a', turnId: 't1' })
  motor.uso = uso(116_200, 58, 1.63)
  await $.session.measure({ ...motor.uso, changed: ['context', 'cost'] })

  await $.turn.start({ text: 'b', turnId: 't2' })
  motor.uso = {
    ...uso(134_400, 67, 1.84),
    rateLimits: [
      {
        kind: 'five_hour',
        percentUsed: 38,
        resetsAt: new Date(AGORA + 130 * 60_000).toISOString(),
      },
    ],
  }
  await $.session.measure({ ...motor.uso, changed: ['context', 'cost', 'rateLimits'] })

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel() })
    await ui.press({ key: 'aba-3' })
    expect(await corDe(ui, /^67%$/)).toBe('claude')
    await mostra(ui, '134,4k / 200k')
    await mostra(ui, 'Últimos 12 turnos')
    // O gráfico vai na escala do maior turno da lista.
    await mostra(ui, /^▇█$/)
    await mostra(ui, '▲ +18,2k no último turno')
    await mostra(ui, /^US\$ 1,84$/)
    await mostra(ui, /^US\$ 0,21$/)
    await mostra(ui, 'Limite de uso')
    await mostra(ui, /^5 h /)
    await mostra(ui, /^38%$/)
    await mostra(ui, 'renova em 2h10')
    // O detalhamento estimado acompanha os turnos, sem ninguém clicar.
    await mostra(ui, /estimativa do turno 2$/)
    await mostra(ui, /100k {2}Messages/)
    expect((await ui.find({ key: 'detalhar' }))?.props.label).toBe('Contagem exata')
    await ui.press({ key: 'aba-1' })
    await ui.unmount()
  }

  // Até aqui só a estimativa local foi pedida: nenhuma contagem de tokens extra.
  const exatas = () => motor.visto.usos.filter(pedido => pedido === 'full')
  expect(motor.visto.usos).toContain('summary')
  expect(exatas()).toEqual([])

  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop', props: painel() })
  await ui.press({ key: 'aba-3' })
  await ui.press({ key: 'detalhar' })
  expect(exatas()).toEqual(['full'])
  await mostra(ui, /contagem exata do turno 2$/)
  await mostra(ui, /120k {2}Messages/)
  await mostra(ui, /4,2k {2}System prompt/)
  await mostra(ui, /42,8k {2}Free space/)
  await mostra(ui, 'Ocupando a janela')
  await mostra(ui, 'Reserva e espaço livre')

  // Outra medição no mesmo turno não troca a contagem exata pela estimativa.
  await $.session.measure({ ...motor.uso, changed: ['cost'] })
  await mostra(ui, /120k {2}Messages/)

  // No turno seguinte, a estimativa volta a acompanhar.
  await $.turn.start({ text: 'c', turnId: 't3' })
  await $.session.measure({ ...motor.uso, changed: ['context'] })
  await mostra(ui, /estimativa do turno 3$/)
  await mostra(ui, /100k {2}Messages/)
  expect(exatas()).toEqual(['full'])
  await ui.unmount()
})

test('aba 4, Arquivos e comandos: leituras por autor, status do Bash e filtro', async ($, on) => {
  const motor = ligar(on)
  let soltar: (saida: ToolCallResult) => void = () => undefined
  const preso = new Promise<ToolCallResult>(resolve => {
    soltar = resolve
  })
  const ok: ToolCallResult = { result: { stdout: '', stderr: '', interrupted: false }, text: 'ok' }
  motor.responder = e => {
    if (e.command === 'npm test') {
      return { isError: true, result: 'Exit code 1\n2 falhas', text: 'Exit code 1\n2 falhas' }
    }

    if (e.command === 'sleep 60') {
      return preso
    }

    return e.file_path === '/proj/segredo' ? { deny: 'fora da regra' } : ok
  }
  await $.session.start(INICIO)
  const explore = await $.agent.spawn(subagente('t1', 'Explore', 'procurar hooks'))

  await $.tool.call({ tool: 'Read', file_path: '/proj/src/a.ts' })
  await $.tool.call({ tool: 'Read', file_path: '/proj/src/a.ts' })
  await $.tool.call(doAgente({ tool: 'Read', file_path: '/proj/src/a.ts' }, explore.agentId))
  await $.tool.call(doAgente({ tool: 'Read', file_path: '/proj/docs/b.md' }, explore.agentId))
  await $.tool.call({ tool: 'Read', file_path: '/proj/segredo' })
  await $.tool.call({ tool: 'Bash', command: 'npm run check' })
  await $.tool.call({ tool: 'Bash', command: 'ls -la /proj/src /proj' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  const pendente = $.tool.call({ tool: 'Bash', command: 'sleep 60' })
  await motor.relogio.advance(5000)

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel('dock', 100) })
    await ui.press({ key: 'aba-4' })
    await mostra(ui, 'Arquivos lidos (2)')
    await mostra(ui, / {2}3× src\/a\.ts · principal, Explore/)
    await mostra(ui, / {2}1× docs\/b\.md · Explore/)
    await naoMostra(ui, 'segredo')

    await mostra(ui, 'Comandos Bash (4)')
    // O comando é o botão que abre o detalhe.
    const comandos = async () =>
      (await ui.findAll({ type: 'Button' }))
        .filter(botao => String(botao.key).startsWith('ver-comando-'))
        .map(botao => botao.props.label)
    // A pasta do projeto some do comando mostrado: /proj/src vira src, /proj vira um ponto.
    expect(await comandos()).toEqual([
      '▸ sleep 60',
      '▸ npm test',
      '▸ ls -la src .',
      '▸ npm run check',
    ])
    await mostra(ui, /^ \d+,\ds$/)
    await mostra(ui, /^ exit 1 · \d+,\ds$/)
    await mostra(ui, /^ rodando · 5,0s$/)
    expect(await corDe(ui, /^✓$/)).toBe('success')
    expect(await corDe(ui, /^✗$/)).toBe('error')
    expect(await corDe(ui, /^●$/)).toBe('suggestion')

    await ui.input({ key: 'filtro', text: 'NPM', kind: 'change' })
    await mostra(ui, 'Arquivos lidos (0)')
    await mostra(ui, 'Comandos Bash (2)')
    expect(await comandos()).toEqual(['▸ npm test', '▸ npm run check'])
    await ui.input({ key: 'filtro', text: 'docs' })
    await mostra(ui, 'Arquivos lidos (1)')
    await mostra(ui, 'Comandos Bash (0)')
    await ui.input({ key: 'filtro', text: '' })
    await ui.press({ key: 'aba-1' })
    await ui.unmount()
  }

  soltar(ok)
  await pendente
  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop', props: painel('dock', 100) })
  await ui.press({ key: 'aba-4' })
  // Solto o comando, ele termina: não há mais nenhum rodando.
  await mostra(ui, 'Comandos Bash (4)')
  expect(await ui.find({ type: 'Text', text: /^●$/ })).toBeUndefined()
  await ui.unmount()
})

test('aba 5, Turnos: duração, contexto somado, custo, ferramentas e falhas de cada turno', async ($, on) => {
  const motor = ligar(on)
  motor.uso = uso(80_000, 40, 1.2)
  motor.responder = e =>
    e.command === 'npm test'
      ? { isError: true, result: 'Exit code 1', text: 'Exit code 1' }
      : { result: { structuredPatch: [] }, text: 'ok' }
  await $.session.start(INICIO)

  await $.turn.start({ text: 'ajusta o README\ne publica', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: '/proj/README.md' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Edit', file_path: '/proj/README.md', old_string: 'a', new_string: 'b' })
  await $.turn.complete(fimDoTurno('t1', 'feito', 72_000))
  motor.uso = uso(85_500, 43, 1.4)
  await $.session.measure({ ...motor.uso, changed: ['context', 'cost'] })

  await $.turn.start({ text: 'segundo pedido', turnId: 't2' })
  await motor.relogio.advance(5000)

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel('dock', 100) })
    expect((await ui.find({ key: 'aba-5' }))?.props.hotkey).toBe('5')
    await ui.press({ key: 'aba-5' })
    await mostra(ui, 'Turnos (2)')

    // O turno em curso, em azul, com o tempo correndo.
    expect((await ui.find({ key: 'ver-turno-2' }))?.props.label).toBe('▸ Turno 2')
    const emCurso = await ui.findAll({ type: 'Text', text: /^em andamento · 5,0s$/ })
    expect(emCurso.map(texto => texto.props.color)).toContain('suggestion')
    await mostra(ui, 'segundo pedido')

    // O turno fechado: duração, falhas em vermelho, o pedido e os números.
    expect((await ui.find({ key: 'ver-turno-1' }))?.props.label).toBe('▸ Turno 1')
    await mostra(ui, /^1m12s$/)
    expect(await corDe(ui, /^ · 1 falha$/)).toBe('error')
    await mostra(ui, 'ajusta o README e publica')
    await mostra(ui, '+5,5k de contexto · US$ 0,20 · 3 ferramentas · 1 edição')
    await ui.press({ key: 'aba-1' })
    await ui.unmount()
  }
})

test('turnos agrupados: o retorno de um agente em segundo plano entra no turno do pedido', async ($, on) => {
  const motor = ligar(on)
  motor.uso = uso(80_000, 40, 1.2)
  motor.responder = () => ({ result: { structuredPatch: [] }, text: 'ok' })
  await $.session.start(INICIO)

  await $.turn.start({ text: 'rode 2 agentes', turnId: 't1' })
  const um = await $.agent.spawn(subagente('a1', 'Explore', 'previsão de Lisboa'))
  const dois = await $.agent.spawn(subagente('a2', 'Plan', 'previsão de Tóquio'))
  await $.tool.call({ tool: 'Read', file_path: '/proj/a.ts' })
  await $.turn.complete(fimDoTurno('t1', 'Agentes lançados.', 4000))
  const medir = async (tokens: number, usd: number) => {
    motor.uso = uso(tokens, 40, usd)
    await $.session.measure({ ...motor.uso, changed: ['context', 'cost'] })
  }
  await medir(82_000, 1.3)

  // O Claude Code abre um turno sozinho a cada agente que volta.
  await $.turn.start({
    text: `<task-notification>\n<task-id>${String(um.agentId)}</task-id>\n<result>Lisboa: sol</result>\n</task-notification>`,
    turnId: 't2',
  })
  await $.tool.call({ tool: 'Edit', file_path: '/proj/a.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete(fimDoTurno('t2', 'Lisboa pronta.', 3000))
  await medir(83_000, 1.45)
  await $.turn.start({
    text: `<agent-message from="${String(dois.agentId)}"> [Subagent hand-back] Tóquio: chuva</agent-message>`,
    turnId: 't3',
  })
  await $.turn.complete(fimDoTurno('t3', 'As duas previsões estão prontas.', 2000))
  await medir(84_000, 1.5)

  await $.turn.start({ text: 'obrigado', turnId: 't4' })
  await $.turn.complete(fimDoTurno('t4', 'De nada.', 1000))

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel('dock', 100) })
    await ui.press({ key: 'aba-5' })
    // Quatro turnos do motor, dois pedidos da pessoa.
    await mostra(ui, 'Turnos (2)')
    expect((await ui.find({ key: 'ver-turno-2' }))?.props.label).toBe('▸ Turno 2')
    await mostra(ui, 'obrigado')
    await mostra(ui, 'rode 2 agentes')
    await mostra(ui, /^9,0s$/)
    // Contexto e custo contam do pedido até o último retorno, sem somar em dobro.
    await mostra(
      ui,
      '+4k de contexto · US$ 0,30 · 2 ferramentas · 1 edição · 2 retornos de agentes',
    )
    expect(await ui.find({ key: 'ver-turno-3' })).toBeUndefined()

    await ui.press({ key: 'ver-turno-1' })
    expect((await ui.find({ type: 'Code', text: 'rode 2 agentes' }))?.text).toBe('rode 2 agentes')
    expect(await ui.find({ type: 'Markdown', text: 'Agentes lançados.' })).toBeDefined()
    await mostra(ui, 'Depois do retorno do agente Explore')
    expect(await ui.find({ type: 'Markdown', text: 'Lisboa pronta.' })).toBeDefined()
    await mostra(ui, 'Depois do retorno do agente Plan')
    expect(await ui.find({ type: 'Markdown', text: 'As duas previsões estão prontas.' })).toBeDefined()
    await mostra(ui, /^Read 1 · Edit 1$/)
    await ui.press({ key: 'voltar' })

    // A edição feita no retorno do agente fica nos diffs do turno 1.
    await ui.press({ key: 'aba-2' })
    await mostra(ui, 'Turno 1 · 1 edição em 1 arquivo')

    // Sem resposta própria, o agente mostra o que devolveu ao loop principal.
    await ui.press({ key: 'aba-1' })
    await ui.press({ key: `ver-agente-${String(dois.agentId)}` })
    expect(await ui.find({ type: 'Markdown', text: 'Tóquio: chuva' })).toBeDefined()
    await ui.press({ key: 'voltar' })
    await ui.unmount()
  }
})

test('detalhe de um agente: pedido, chamadas, mensagens, tokens e resultado', async ($, on) => {
  const motor = ligar(on)
  motor.responder = e =>
    e.command === 'npm test'
      ? { isError: true, result: 'Exit code 1', text: 'Exit code 1' }
      : { result: {}, text: 'ok' }
  motor.mensagens = [
    { role: 'user', text: 'Tarefa de Explore', toolUses: [] },
    { role: 'assistant', text: 'Vou começar pelo **README**.', toolUses: [] },
    { role: 'assistant', text: '', toolUses: [] },
  ]
  await $.session.start(INICIO)
  const explore = await $.agent.spawn(subagente('t1', 'Explore', 'procurar hooks'))
  const id = String(explore.agentId)
  await $.tool.call(doAgente({ tool: 'Read', file_path: '/proj/README.md' }, id))
  await $.tool.call(doAgente({ tool: 'Bash', command: 'npm test' }, id))

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel('dock', 100) })
    await ui.press({ key: `ver-agente-${id}` })
    expect((await ui.find({ key: 'voltar' }))?.props.hotkey).toBe('v')
    await mostra(ui, /Explore/)
    expect((await ui.find({ type: 'Markdown', text: 'Tarefa de Explore' }))?.props.dimColor).toBe(true)
    await mostra(ui, 'Chamadas (2)')
    await mostra(ui, /^Read README\.md$/)
    expect(await corDe(ui, /^✗ $/)).toBe('error')
    // As mensagens vêm da transcrição do agente, lida ao abrir.
    expect(await ui.find({ type: 'Markdown', text: 'Vou começar pelo **README**.' })).toBeDefined()
    await ui.press({ key: 'voltar' })
    await mostra(ui, 'Rodando (1)')
    await ui.unmount()
  }

  expect(motor.visto.ordem.filter(passo => passo === `session.messages ${id}`)).toHaveLength(2)

  await $.turn.complete({
    ...fimDoTurno('s1', '## Achado\nO hook fica em `src/a.ts`.', 9000, id),
    usage: {
      input_tokens: 1200,
      output_tokens: 800,
      cache_read_input_tokens: 40_000,
      cache_creation_input_tokens: 2000,
      model: 'claude-haiku-4-5-20251001',
    },
  })

  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop', props: painel('dock', 100) })
  await mostra(ui, / · 44k tokens$/)
  await ui.press({ key: `ver-agente-${id}` })
  await mostra(ui, 'Entrada 43,2k (40k lidos do cache) · saída 800')
  expect(await ui.find({ type: 'Markdown', text: 'O hook fica em `src/a.ts`.' })).toBeDefined()
  await mostra(ui, 'Resposta final')
  expect((await ui.find({ key: 'mensagens' }))?.props.hotkey).toBe('m')
  // Trocar de aba fecha o detalhe.
  await ui.press({ key: 'aba-2' })
  await ui.press({ key: 'aba-1' })
  await mostra(ui, 'Concluídos (1)')
  await ui.unmount()
})

test('custo e contexto por agente: o que o custo da sessão sobe a cada resposta vai para quem a fez', async ($, on) => {
  const motor = ligar(on)
  // Sessão retomada: o US$ 1,00 de antes não é de nenhum agente.
  motor.uso = uso(100_000, 50, 1)
  await $.session.start(INICIO)
  const explore = await $.agent.spawn(subagente('t1', 'Explore', 'procurar hooks'))
  const plan = await $.agent.spawn(subagente('t2', 'Plan', 'planejar'))
  const consumo = (lidos: number) => ({
    input_tokens: 1000,
    output_tokens: 500,
    cache_read_input_tokens: lidos,
    cache_creation_input_tokens: 1500,
    model: 'claude-haiku-4-5-20251001',
  })
  // Uma resposta do modelo, depois da qual a sessão custa `usd`.
  const responder = async (usd: number, lidos: number, agentId?: string) => {
    motor.uso = uso(100_000, 50, usd)
    motor.passo = consumo(lidos)
    const fluxo = $.turn.step({
      turnId: 's1',
      index: 0,
      model: 'claude-haiku-4-5-20251001',
      messageCount: 3,
      ...(agentId === undefined ? {} : { agentId }),
    })

    // Lê o fluxo até o fim: o que ele devolve é o resultado da resposta.
    let pedaco = await fluxo.next()

    while (pedaco.done !== true) {
      pedaco = await fluxo.next()
    }

    return pedaco.value
  }

  // O resultado de cada resposta passa intacto.
  expect((await responder(1.1, 30_000))?.usage).toEqual(consumo(30_000))
  await responder(1.12, 18_000, explore.agentId)
  await responder(1.17, 18_000, plan.agentId)
  await responder(1.18, 20_000, explore.agentId)
  await $.session.measure({ ...motor.uso, changed: ['cost'] })

  const ui = await $.ui.mount({ ...PAINEL, surface: 'desktop', props: painel('dock', 100) })
  await mostra(ui, /^ haiku-4-5 · 0,0s · contexto 23k · US\$ 0,03$/)
  await mostra(ui, /^ haiku-4-5 · 0,0s · contexto 21k · US\$ 0,05$/)
  await ui.press({ key: `ver-agente-${String(explore.agentId)}` })
  await mostra(ui, 'Contexto do agente 23k · custo US$ 0,03')
  // O total em dinheiro, no alto da aba Turnos.
  await ui.press({ key: 'aba-5' })
  await mostra(ui, ' · US$ 1,18 na sessão')
  await ui.press({ key: 'aba-1' })
  await ui.unmount()
})

test('detalhe de um comando: comando inteiro e saída, sem caracteres de controle', async ($, on) => {
  const motor = ligar(on)
  motor.responder = e =>
    e.command === 'npm test'
      ? { isError: true, result: 'Exit code 1\n2 falhas', text: 'Exit code 1\n2 falhas' }
      : {
          result: { stdout: '\u001b[32mok\u001b[0m\r\nfim\n', stderr: 'aviso', interrupted: false },
          text: 'ok',
        }
  await $.session.start(INICIO)
  await $.tool.call({ tool: 'Bash', command: 'npm run check', description: 'Confere os tipos' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel('dock', 100) })
    await ui.press({ key: 'aba-4' })
    const botoes = (await ui.findAll({ type: 'Button' })).filter(botao =>
      String(botao.key).startsWith('ver-comando-'),
    )
    expect(botoes).toHaveLength(2)

    // O mais recente vem primeiro: o que falhou.
    await ui.press({ key: String(botoes[0]?.key) })
    await mostra(ui, /exit 1/)
    expect((await ui.find({ type: 'Code', text: 'npm test' }))?.props.language).toBe('bash')
    expect(await ui.find({ type: 'Code', text: 'Exit code 1\n2 falhas' })).toBeDefined()
    await ui.press({ key: 'voltar' })

    await ui.press({ key: String(botoes[1]?.key) })
    await mostra(ui, 'Confere os tipos')
    // As cores ANSI e o \r saem; sobra o texto.
    expect((await ui.find({ type: 'Code', text: 'ok\nfim' }))?.text).toBe('ok\nfim')
    await mostra(ui, 'Saída de erro')
    await ui.press({ key: 'voltar' })
    await mostra(ui, 'Comandos Bash (2)')
    await ui.press({ key: 'aba-1' })
    await ui.unmount()
  }
})

test('detalhe de um turno: pedido e resposta inteiros e ferramentas usadas', async ($, on) => {
  const motor = ligar(on)
  motor.uso = uso(80_000, 40, 1.2)
  const pedido = `ajusta o README\ne publica\n${'detalhe '.repeat(30)}`
  await $.session.start(INICIO)
  await $.turn.start({ text: pedido, turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: '/proj/README.md' })
  await $.tool.call({ tool: 'Read', file_path: '/proj/a.ts' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.turn.complete(fimDoTurno('t1', '**Feito.** O README foi ajustado.', 72_000))
  motor.uso = uso(85_500, 43, 1.4)
  await $.session.measure({ ...motor.uso, changed: ['context', 'cost'] })

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel('dock', 100) })
    await ui.press({ key: 'aba-5' })
    await ui.press({ key: 'ver-turno-1' })
    await mostra(ui, /^Turno 1$/)
    await mostra(ui, '+5,5k de contexto · US$ 0,20')
    await mostra(ui, 'Ferramentas (3)')
    await mostra(ui, /^Read 2 · Bash 1$/)
    // O pedido inteiro, e não só a primeira linha da lista.
    expect((await ui.find({ type: 'Code', text: 'e publica' }))?.text).toBe(pedido)
    expect(await ui.find({ type: 'Markdown', text: '**Feito.** O README foi ajustado.' })).toBeDefined()
    await ui.press({ key: 'voltar' })
    await mostra(ui, 'Turnos (1)')
    await ui.press({ key: 'aba-1' })
    await ui.unmount()
  }
})

test('só observa: a entrada e o resultado de cada chamada passam intactos', async ($, on) => {
  const motor = ligar(on)
  const resposta: ToolCallResult = {
    result: { stdout: 'oi', stderr: '', interrupted: false },
    text: 'oi',
    ref: 7,
    isReadOnly: true,
  }
  motor.responder = e => (e.tool === 'Write' ? { deny: 'bloqueado por outra regra' } : resposta)
  await $.session.start(INICIO)

  const entrada = { tool: 'Bash', command: '  ls -la  ', description: 'lista' } as const
  expect(await $.tool.call(entrada)).toEqual(resposta)
  expect(motor.visto.chamadas.at(-1)).toMatchObject(entrada)

  const escrita = { tool: 'Write', file_path: '/proj/x.ts', content: 'y\n' } as const
  expect(await $.tool.call(escrita)).toEqual({ deny: 'bloqueado por outra regra' })
  expect(motor.visto.chamadas.at(-1)).toMatchObject(escrita)

  expect(await $.agent.spawn(subagente('t1', 'Explore', 'x'))).toEqual({
    model: 'claude-haiku-4-5-20251001',
    agentId: 'ag-t1',
  })
  expect(await $.turn.start({ text: 'oi', turnId: 't1' })).toEqual({ turnId: 't1' })
  expect(await $.turn.complete(fimDoTurno('t1', 'resposta', 10))).toMatchObject({ text: 'resposta' })
})

test('/cockpit abre com foco e Esc fechando, e fecha na segunda vez; 1 a 5 trocam de aba', async ($, on) => {
  const motor = ligar(on)
  await $.session.start(INICIO)

  // Abrir e fechar não escrevem nada na conversa: o painel é a resposta.
  expect((await $.command.run(COMANDO)).text).toBeUndefined()
  expect(motor.visto.abertos).toEqual([{ id: MOD, focus: true, closeOnEscape: true }])

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface, props: painel() })
    // A marca no topo: o selo CSR em azul e o nome.
    const selo = await ui.find({ type: 'Text', text: /^ CSR $/ })
    expect(selo?.props.color).toBe('suggestion')
    expect(selo?.props.inverse).toBe(true)
    await mostra(ui, /^ Cockpit$/)
    const ativa = surface === 'terminal' ? '1: Agentes' : '1 Agentes'
    expect(await corDe(ui, ativa)).toBe('claude')

    for (const n of ['2', '3', '4', '5']) {
      expect((await ui.find({ key: `aba-${n}` }))?.props.hotkey).toBe(n)
    }

    await ui.press({ key: 'aba-3' })
    expect(await corDe(ui, surface === 'terminal' ? '3: Contexto' : '3 Contexto')).toBe('claude')
    expect((await ui.find({ key: 'aba-1' }))?.props.hotkey).toBe('1')
    expect(await ui.find({ key: 'aba-3' })).toBeUndefined()
    await ui.press({ key: 'aba-1' })
    await ui.unmount()
  }

  expect((await $.command.run(COMANDO)).text).toBeUndefined()
  expect(motor.visto.fechados).toEqual([MOD])
})

test('sem lugar ao lado: versão compacta acima do prompt', async ($, on) => {
  const motor = ligar(on)
  await $.session.start(INICIO)
  const explore = await $.agent.spawn(subagente('t1', 'Explore', 'procurar hooks'))
  await $.tool.call(doAgente({ tool: 'Read', file_path: '/proj/src/a.ts' }, explore.agentId))

  motor.semLugar = true
  expect((await $.command.run(COMANDO)).text).toMatch(/compacta acima do prompt/)
  // O painel que não teve lugar não fica aberto à espera.
  expect(motor.visto.fechados).toEqual([MOD])

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ plugin: MOD, surface, component: 'AbovePrompt', props: faixa() })
    await mostra(ui, 'Rodando (1)')
    // Compacta: o agente e a atividade numa linha só.
    await mostra(ui, /^● Explore · haiku-4-5 · \d+,\ds · Read src\/a\.ts$/)
    expect((await ui.find({ key: 'aba-2' }))?.props.hotkey).toBe('2')
    expect(await ui.find({ key: 'fechar' })).toBeDefined()
    // Na versão compacta, só o selo, na linha das abas.
    expect(await ui.find({ type: 'Text', text: /^ CSR $/ })).toBeDefined()
    await naoMostra(ui, /^ Cockpit$/)
    await ui.unmount()
  }

  // O mesmo desenho compacto quando o painel senta acima do prompt.
  const sentado = await $.ui.mount({ ...PAINEL, surface: 'desktop', props: painel('inline') })
  await mostra(sentado, /^● Explore · haiku-4-5 · \d+,\ds · Read src\/a\.ts$/)
  expect(await sentado.find({ key: 'fechar' })).toBeUndefined()
  await sentado.unmount()

  const ui = await $.ui.mount({
    plugin: MOD,
    surface: 'desktop',
    component: 'AbovePrompt',
    props: faixa(),
  })
  await ui.press({ key: 'fechar' })
  expect(await ui.find({ key: 'fechar' })).toBeUndefined()
  await naoMostra(ui, 'Rodando (1)')
  await ui.unmount()

  // /cockpit também fecha a faixa.
  expect((await $.command.run(COMANDO)).text).toMatch(/compacta/)
  expect((await $.command.run(COMANDO)).text).toBeUndefined()
})

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

test('status line: cada parte com o seu nome, só quando há leitura', async ($, on) => {
  const motor = ligar(on)
  motor.uso = uso(134_400, 67, 1.84)
  await $.session.start(INICIO)
  expect(motor.visto.status.at(-1)).toBe('contexto 67% · US$ 1,84')

  const explore = await $.agent.spawn(subagente('t1', 'Explore', 'procurar hooks'))
  await $.agent.spawn(subagente('t2', 'Plan', 'planejar'))
  expect(motor.visto.status.at(-1)).toBe('contexto 67% · US$ 1,84 · agentes 2 rodando')

  await $.turn.complete(fimDoTurno('s1', 'Pronto.', 4000, explore.agentId))
  expect(motor.visto.status.at(-1)).toBe(
    'contexto 67% · US$ 1,84 · agentes 1 rodando, 1 concluído',
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
  expect(motor.visto.status.at(-1)).toBe(
    'contexto 76% · US$ 2,05 · limite 5h 38%, 7d 60% · agentes 1 rodando, 1 concluído',
  )
})

test('status line: sessão recém-aberta, sem leitura nenhuma, não mostra linha', async ($, on) => {
  const motor = ligar(on)
  motor.uso = { startedAt: AGORA, context: { window: 200_000 }, rateLimits: [] }
  await $.session.start(INICIO)
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
    await mostra(ui, /Explore · haiku-4-5 · 1m12s · 1 chamada/)
    await mostra(ui, '  procurar hooks')
    await mostra(ui, 'Read src/a.ts')
    expect(await corDe(ui, /^● $/)).toBe('suggestion')

    await mostra(ui, 'Concluídos (2)')
    await mostra(ui, /Plan · haiku-4-5 · 1m35s/)
    await mostra(ui, 'Plano em 3 passos')
    await naoMostra(ui, 'detalhes')
    expect(await corDe(ui, /^✓ $/)).toBe('success')
    await mostra(ui, /revisor-de-posts · haiku-4-5 · 12s/)
    await mostra(ui, 'terminou por error')
    expect(await corDe(ui, /^✗ $/)).toBe('error')
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

    await mostra(ui, 'Comandos Bash (3)')
    await mostra(ui, /^✓ npm run check · \d+,\ds$/)
    await mostra(ui, /^✗ npm test · exit 1 · \d+,\ds$/)
    await mostra(ui, /^● sleep 60 · rodando · 5,0s$/)
    expect(await corDe(ui, /^✓ $/)).toBe('success')
    expect(await corDe(ui, /^✗ $/)).toBe('error')
    expect(await corDe(ui, /^● $/)).toBe('suggestion')

    await ui.input({ key: 'filtro', text: 'NPM', kind: 'change' })
    await mostra(ui, 'Arquivos lidos (0)')
    await mostra(ui, 'Comandos Bash (2)')
    await naoMostra(ui, 'sleep 60')
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
  await mostra(ui, /^✓ sleep 60 · \d+,\ds$/)
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
    await mostra(ui, /^Turno 2$/)
    expect(await corDe(ui, /^ · em andamento · 5,0s$/)).toBe('suggestion')
    await mostra(ui, '  segundo pedido')

    // O turno fechado: duração, falhas em vermelho, o pedido e os números.
    await mostra(ui, /^Turno 1$/)
    await mostra(ui, /^ · 1m12s$/)
    expect(await corDe(ui, /^ · 1 falha$/)).toBe('error')
    await mostra(ui, '  ajusta o README e publica')
    await mostra(ui, '  +5,5k de contexto · US$ 0,20 · 3 ferramentas · 1 edição')
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

  expect((await $.command.run(COMANDO)).text).toMatch(/aberto/)
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

  expect((await $.command.run(COMANDO)).text).toMatch(/fechado/)
  expect(motor.visto.fechados).toEqual([MOD])
})

test('sem lugar ao lado: versão compacta acima do prompt', async ($, on) => {
  const motor = ligar(on)
  // Com a faixa fechada, o mod passa a vez: o motor desenha o que é dele.
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', children: [] }))
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
  expect((await $.command.run(COMANDO)).text).toMatch(/fechado/)
})

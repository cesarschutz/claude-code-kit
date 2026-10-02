// O "motor" dos testes: debaixo do mod não há nada, então estes hooks
// respondem no lugar do Claude Code e anotam o que o mod pediu.

import type {
  AgentInfo,
  On,
  RenderPropsOf,
  SessionMessage,
  SessionUsage,
  SessionUsageArgs,
  ToolCallResult,
  TurnUsage,
} from 'claude-code'
import { mock } from 'claude-code/testing'
import type { MockClock } from 'claude-code/testing'

export const AGORA = 1_800_000_000_000
export const RAIZ = '/proj'
export const SUPERFICIES = ['terminal', 'desktop'] as const

export type Visto = {
  status: (string | undefined)[]
  // Cada pedido de $.session.usage, com o detalhamento pedido (ou 'simples').
  usos: string[]
  ordem: string[]
  abertos: { id: string; focus: boolean; closeOnEscape: boolean }[]
  fechados: string[]
  // O `e` que chegou ao fundo da cadeia em cada tool.call.
  chamadas: Readonly<Record<string, unknown>>[]
}

export type Motor = {
  relogio: MockClock
  visto: Visto
  uso: SessionUsage
  // O que a próxima resposta do modelo (turn.step) diz ter consumido.
  passo: TurnUsage | null
  arquivos: Record<string, string>
  agentes: AgentInfo[]
  // A transcrição que $.session.messages devolve para um subagente.
  mensagens: SessionMessage[]
  // Sem lugar para o painel: $.ui.open responde isPlaced false.
  semLugar: boolean
  // O que o fundo responde a cada tool.call; trocável por teste.
  responder: (e: Readonly<Record<string, unknown>>) => ToolCallResult | Promise<ToolCallResult>
}

const usoInicial = (): SessionUsage => ({
  startedAt: AGORA,
  context: { tokens: 100_000, window: 200_000, percent: 50 },
  rateLimits: [],
  cost: { usd: 1 },
})

// A estimativa ('summary') e a contagem exata ('full') diferem nas mensagens,
// para os testes saberem qual das duas o painel mostra.
const detalhe = (mensagens: number): NonNullable<SessionUsage['context']['breakdown']> => ({
  categories: [
    { name: 'System prompt', tokens: 4200, color: 'promptBorder', isDeferred: false, kind: 'used' },
    { name: 'Messages', tokens: mensagens, color: 'permission', isDeferred: false, kind: 'used' },
    { name: 'Free space', tokens: 42_800, color: 'inactive', isDeferred: false, kind: 'free' },
  ],
  totalTokens: 4200 + mensagens,
  maxTokens: 167_000,
  rawMaxTokens: 167_000,
  autocompactSource: 'model-default',
  percentage: 74,
  gridRows: [],
  model: 'opus',
  memoryFiles: [],
  mcpTools: [],
  agents: [],
  isAutoCompactEnabled: true,
  apiUsage: null,
})

export const ligar = (on: On): Motor => {
  const relogio = mock.clock(on, { now: AGORA })
  const motor: Motor = {
    relogio,
    visto: { status: [], usos: [], ordem: [], abertos: [], fechados: [], chamadas: [] },
    uso: usoInicial(),
    passo: null,
    arquivos: {},
    agentes: [],
    mensagens: [],
    semLugar: false,
    responder: e => ({ result: { tool: e.tool }, text: 'ok' }),
  }
  let abertos: string[] = []

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.invalidate', () => ({ value: undefined }))
  on('ui.status', (_, e) => {
    motor.visto.status.push(e.text)

    return { value: undefined }
  })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('agent.list', () => ({ value: motor.agentes }))
  on('session.messages', (_, e) => {
    motor.visto.ordem.push(`session.messages ${String(e.agentId ?? 'principal')}`)

    return { value: motor.mensagens }
  })
  on('session.usage', (_, e: SessionUsageArgs) => {
    motor.visto.usos.push(e.breakdown ?? 'simples')

    return {
      value:
        e.breakdown === undefined
          ? motor.uso
          : {
              ...motor.uso,
              context: {
                ...motor.uso.context,
                breakdown: detalhe(e.breakdown === 'full' ? 120_000 : 100_000),
              },
            },
    }
  })
  on('fs.read', (_, e) => {
    motor.visto.ordem.push(`fs.read ${e.path}`)
    const texto = motor.arquivos[e.path]

    return texto === undefined ? { deny: `ENOENT: ${e.path}` } : { value: texto }
  })
  on('ui.open', (_, e) => {
    motor.visto.abertos.push({
      id: e.id,
      focus: e.focus === true,
      closeOnEscape: e.closeOnEscape === true,
    })
    abertos = [...abertos, e.id]

    return {
      value: motor.semLugar
        ? { isPlaced: false, reason: 'terminal estreito' }
        : { isPlaced: true },
    }
  })
  on('ui.close', (_, e) => {
    motor.visto.fechados.push(e.id)
    abertos = abertos.filter(id => id !== e.id)

    return { value: undefined }
  })
  on('ui.panes', () => ({
    value: abertos.map(id => ({
      id,
      title: id,
      isShown: true,
      isFocused: true,
      isPlaced: !motor.semLugar,
    })),
  }))
  on('tool.call', (_, e) => {
    const chamada = e as Readonly<Record<string, unknown>>
    motor.visto.ordem.push(`tool.call ${e.tool}`)
    motor.visto.chamadas.push(chamada)

    return motor.responder(chamada)
  })
  on('agent.spawn', (_, e) => ({
    model: 'claude-haiku-4-5-20251001',
    agentId: `ag-${e.tool_use_id}`,
  }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  // Uma resposta do modelo, sem pedaços: só o resultado, com o consumo.
  // eslint-disable-next-line require-yield
  on('turn.step', async function* (_, e) {
    return {
      turnId: e.turnId,
      index: e.index,
      answer: '',
      toolUses: [],
      stopReason: 'end_turn' as const,
      usage: motor.passo,
    }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('session.measure', (_, e) => ({ changed: e.changed }))
  // O que o motor desenharia na faixa acima do prompt: nada.
  on('ui.render', { component: 'AbovePrompt' }, () => ({ type: 'Box', children: [] }))

  return motor
}

// Uma chamada de dentro de um subagente: o motor carimba `agentId`, que o tipo
// de $.tool.call (o que um plugin passa) não declara.
export const doAgente = <T extends object>(entrada: T, agentId: string | undefined): T =>
  ({ ...entrada, agentId }) as T

export const INICIO = { cwd: RAIZ, surface: 'desktop', isInteractive: true } as const

// O que o Agent do loop principal decide sobre um subagente, para $.agent.spawn.
export const subagente = (id: string, tipo: string, descricao: string) => ({
  tool_use_id: id,
  prompt: `Tarefa de ${tipo}`,
  description: descricao,
  subagentType: tipo,
  provider: { plugin: 'engine', tier: 'core' } as const,
  parentModel: 'claude-opus-5-5',
  background: true,
  fork: false,
})

export const fimDoTurno = (
  turnId: string,
  resposta: string,
  durationMs: number,
  agentId?: string,
  reason: 'answer' | 'error' = 'answer',
) => ({
  answer: resposta,
  durationMs,
  isAborted: false,
  turnId,
  reason,
  ...(agentId === undefined ? {} : { agentId }),
})

export const painel = (
  placement: 'dock' | 'inline' = 'dock',
  bodyColumns = 60,
): RenderPropsOf['Pane'] => ({
  title: 'Cockpit',
  isFocused: true,
  bodyColumns,
  placement,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
})

export const faixa = (): RenderPropsOf['AbovePrompt'] => ({
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
})

export const COMANDO = {
  command: 'cockpit',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 160 },
} as const

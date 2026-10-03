import type { EngineInterface, On, PluginOptions } from 'claude-code'

type Severity = 'critical' | 'warning' | 'info'
type Category =
  | 'security'
  | 'architecture'
  | 'quality'
  | 'tests'
  | 'compatibility'
  | 'performance'
  | 'other'

type Finding = {
  severity: Severity
  category: Category
  title: string
  detail: string
  evidence?: string
  suggestion?: string
}

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

type Review = {
  turn: number
  status: 'running' | 'done' | 'error' | 'skipped'
  summary: string
  findings: Finding[]
  startedAt: number
  durationMs?: number
  usage?: Usage
  error?: string
}

type Host = {
  fork: (prompt: string) => Promise<{ text: string; usage: Usage } | null>
  now: () => Promise<number>
  invalidate: () => void
  open: () => Promise<void>
  close: () => Promise<void>
  panes: () => Promise<readonly { id: string }[]>
}

export const PANE_ID = 'csr-reviewer'
export const GLOBAL_ENABLED_KEY = 'autoReviewEnabled'
export const DEFAULTS = {
  autoReview: false,
  openOnFinding: true,
  maxReviews: 8,
  maxFindings: 6,
} as const

const REVIEW_PROMPT = `You are a read-only second reviewer watching a Claude Code session.
Review ONLY the most recently completed main-agent turn in the transcript above.
Do not continue the task. Do not use tools. Do not praise routine work.
Look for things the main agent or user may have missed, especially:
- security problems
- architectural regressions or accidental coupling
- breaking API/schema/config changes
- missing tests or migrations
- incorrect assumptions
- performance/reliability risks
- incomplete work that contradicts the user's request

Return ONLY compact JSON with this exact shape:
{
  "summary": "one short sentence",
  "findings": [
    {
      "severity": "critical|warning|info",
      "category": "security|architecture|quality|tests|compatibility|performance|other",
      "title": "short title",
      "detail": "why it matters",
      "evidence": "concrete evidence from the transcript if available",
      "suggestion": "short next action if useful"
    }
  ]
}

Use an empty findings array when there is nothing material to flag. Never invent evidence.`

const asObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const severityOf = (value: unknown): Severity =>
  value === 'critical' || value === 'warning' || value === 'info' ? value : 'info'

const categoryOf = (value: unknown): Category => {
  const allowed: Category[] = [
    'security',
    'architecture',
    'quality',
    'tests',
    'compatibility',
    'performance',
    'other',
  ]

  return allowed.includes(value as Category) ? (value as Category) : 'other'
}

const clip = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`

const jsonFrom = (text: string): Record<string, unknown> => {
  const trimmed = text.trim()
  const fenced = /^\`\`\`(?:json)?\\s*([\\s\\S]*?)\\s*\`\`\`$/i.exec(trimmed)?.[1] ?? trimmed
  const first = fenced.indexOf('{')
  const last = fenced.lastIndexOf('}')

  if (first < 0 || last < first) throw new Error('reviewer returned no JSON object')

  const parsed = JSON.parse(fenced.slice(first, last + 1))
  const obj = asObject(parsed)

  if (!obj) throw new Error('reviewer returned invalid JSON')

  return obj
}

const parseReview = (
  text: string,
  maxFindings: number,
): { summary: string; findings: Finding[] } => {
  const obj = jsonFrom(text)
  const rawFindings = Array.isArray(obj.findings) ? obj.findings : []
  const findings = rawFindings
    .map(asObject)
    .filter((item): item is Record<string, unknown> => item !== null)
    .map(
      (item): Finding => ({
        severity: severityOf(item.severity),
        category: categoryOf(item.category),
        title: clip(asString(item.title) || 'Finding', 90),
        detail: clip(asString(item.detail), 700),
        ...(asString(item.evidence)
          ? { evidence: clip(asString(item.evidence), 500) }
          : {}),
        ...(asString(item.suggestion)
          ? { suggestion: clip(asString(item.suggestion), 500) }
          : {}),
      }),
    )
    .slice(0, maxFindings)

  return {
    summary: clip(
      asString(obj.summary) ||
        (findings.length ? `${findings.length} finding(s)` : 'No material finding'),
      180,
    ),
    findings,
  }
}

const icon = (severity: Severity): string =>
  severity === 'critical' ? '●' : severity === 'warning' ? '▲' : '•'

const color = (severity: Severity): 'red' | 'yellow' | 'cyan' =>
  severity === 'critical' ? 'red' : severity === 'warning' ? 'yellow' : 'cyan'

export function register(on: On, options: PluginOptions = {}) {
  const openOnFinding =
    typeof options.openOnFinding === 'boolean'
      ? options.openOnFinding
      : DEFAULTS.openOnFinding
  const maxReviews =
    typeof options.maxReviews === 'number' && options.maxReviews > 0
      ? Math.floor(options.maxReviews)
      : DEFAULTS.maxReviews
  const maxFindings =
    typeof options.maxFindings === 'number' && options.maxFindings > 0
      ? Math.floor(options.maxFindings)
      : DEFAULTS.maxFindings

  let host: Host | null = null
  let reviews: Review[] = []
  let turn = 0
  let globalEnabled: boolean = DEFAULTS.autoReview
  let sessionOverride: boolean | null = null
  let settingsError: string | null = null
  const isEnabled = () => sessionOverride ?? globalEnabled

  // Re-read at command/turn boundaries so other open conversations see changes.
  const refreshGlobal = async ($: EngineInterface) => {
    try {
      globalEnabled = (await $.store.get(GLOBAL_ENABLED_KEY)) === true
      settingsError = null
    } catch (error) {
      globalEnabled = false
      settingsError = error instanceof Error ? error.message : String(error)
    }
    invalidate()
  }

  const statusText = () => [
    `Global (todas as conversas): ${globalEnabled ? 'ativado' : 'desativado'}.`,
    `Nesta conversa: ${isEnabled() ? 'ativado' : 'desativado'} (${sessionOverride === null ? 'segue o global' : 'override da sessão'}).`,
    ...(settingsError ? [`Não foi possível ler a preferência global: ${settingsError}`] : []),
  ].join('\n')

  const current = (): Review | undefined => reviews[reviews.length - 1]

  const invalidate = () => host?.invalidate()

  const addReview = (review: Review) => {
    reviews = [...reviews, review].slice(-maxReviews)
    invalidate()
  }

  const replaceReview = (turnNumber: number, update: (review: Review) => Review) => {
    reviews = reviews.map(review => (review.turn === turnNumber ? update(review) : review))
    invalidate()
  }

  const runReview = async (turnNumber: number, manual = false) => {
    const h = host

    if (!h || (!manual && !isEnabled())) return

    const startedAt = await h.now()

    addReview({
      turn: turnNumber,
      status: 'running',
      summary: 'Reviewing the completed turn…',
      findings: [],
      startedAt,
    })

    void h
      .fork(REVIEW_PROMPT)
      .then(async result => {
        if (result === null) {
          replaceReview(turnNumber, review => ({
            ...review,
            status: 'skipped',
            summary: 'No completed transcript snapshot was available.',
          }))

          return
        }

        const parsed = parseReview(result.text, maxFindings)
        const durationMs = (await h.now()) - startedAt

        replaceReview(turnNumber, review => ({
          ...review,
          status: 'done',
          summary: parsed.summary,
          findings: parsed.findings,
          usage: result.usage,
          durationMs,
        }))

        if (
          openOnFinding &&
          parsed.findings.some(
            finding => finding.severity === 'critical' || finding.severity === 'warning',
          )
        ) {
          const panes = await h.panes()

          if (!panes.some(pane => pane.id === PANE_ID)) await h.open()
        }
      })
      .catch(async (error: unknown) => {
        const durationMs = (await h.now()) - startedAt
        replaceReview(turnNumber, review => ({
          ...review,
          status: 'error',
          summary: 'Reviewer failed.',
          error: error instanceof Error ? error.message : String(error),
          durationMs,
        }))
      })
  }

  on('session.start', async ($, e, next) => {
    host = {
      fork: prompt => $.model.fork({ prompt }),
      now: () => $.clock.now(),
      invalidate: () => $.ui.invalidate('ui.render'),
      open: async () => {
        await $.ui.open({
          id: PANE_ID,
          title: 'Reviewer',
          closeOnEscape: true,
        })
      },
      close: () => $.ui.close({ id: PANE_ID }),
      panes: () => $.ui.panes(),
    }

    sessionOverride = null
    await refreshGlobal($)

    await $.command.register({
      name: 'reviewer',
      description:
        'Painel e revisão paralela; /reviewer help mostra comandos e estados',
      argumentHint: '[help|status|enable|disable|on|off|run|clear]',
      immediate: true,
    })

    return next(e)
  })

  on('command.run', { command: 'reviewer' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()

    await refreshGlobal($)

    if (arg === 'enable' || arg === 'disable') {
      const value = arg === 'enable'
      try {
        await $.store.set(GLOBAL_ENABLED_KEY, value)
      } catch (error) {
        return { text: `Não foi possível salvar a preferência global: ${String(error)}` }
      }
      globalEnabled = value
      sessionOverride = null
      settingsError = null
      invalidate()
      return { text: statusText() }
    }

    if (arg === 'on' || arg === 'off') {
      sessionOverride = arg === 'on'
      invalidate()
      return { text: statusText() }
    }

    if (arg === 'help' || arg === 'status' || arg === '--help' || arg === '-h') {
      return { text: statusText() + (arg === 'status' ? '' : `

/reviewer          abre ou fecha o painel
/reviewer enable   ativa globalmente e persiste entre conversas
/reviewer disable  desativa globalmente e persiste entre conversas
/reviewer on       ativa apenas nesta conversa
/reviewer off      desativa apenas nesta conversa
/reviewer help     mostra esta ajuda e os dois estados
/reviewer status   mostra apenas os dois estados
/reviewer run      revisão manual única, mesmo com automático desligado
/reviewer clear    limpa o histórico visual

on/off prevalecem sobre o global até a sessão terminar.
enable/disable removem o override desta conversa; outras mantêm seus overrides.
Uma revisão já iniciada pode terminar após desligar.`) }
    }

    if (arg && !['run', 'clear'].includes(arg)) {
      return { text: `Comando desconhecido: ${arg}. Use /reviewer help.` }
    }

    if (arg === 'clear') {
      reviews = []
      invalidate()
      return {}
    }

    if (arg === 'run') {
      await runReview(Math.max(1, turn), true)
      await host?.open()
      return {}
    }

    const isOpen = (await $.ui.panes()).some(pane => pane.id === PANE_ID)

    if (isOpen) await host?.close()
    else await host?.open()

    return {}
  })

  on('turn.complete', async ($, e, next) => {
    const completed = await next(e)

    if (e.agentId === undefined) {
      turn += 1

      await refreshGlobal($)
      if (isEnabled() && e.reason === 'answer' && !e.isAborted) {
        await runReview(turn)
      }
    }

    return completed
  })

  on('ui.render', { component: 'Pane', requestId: PANE_ID }, ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const width = Math.max(28, e.props.bodyColumns - 1)
    const review = current()

    const header = Box({
      flexDirection: 'row',
      gap: 1,
      children: [
        Text({ bold: true, children: 'SECOND REVIEW' }),
        Text({ dimColor: true, wrap: 'wrap', children: `global ${globalEnabled ? 'on' : 'off'} · sessão ${isEnabled() ? 'on' : 'off'}${sessionOverride === null ? ' (global)' : ' (override)'}` }),
      ],
    })

    const controls = Box({
      flexDirection: 'row',
      gap: 1,
      marginTop: 1,
      children: [
        Button({ key: 'run', label: 'Review now', onPress: () => undefined }),
        Button({
          key: 'toggle',
          label: isEnabled() ? 'Pause session' : 'Resume session',
          onPress: () => undefined,
        }),
        Button({ key: 'clear', label: 'Clear', onPress: () => undefined }),
      ],
    })

    if (!review) {
      return Box({
        flexDirection: 'column',
        width,
        children: [
          header,
          Box({
            marginTop: 1,
            children: [
              Text({
                dimColor: true,
                wrap: 'wrap',
                children:
                  'Nenhuma revisão ainda. Use /reviewer on nesta conversa ou /reviewer enable para todas. /reviewer help mostra os estados.',
              }),
            ],
          }),
          controls,
        ],
      })
    }

    const findingRows =
      review.findings.length === 0
        ? [
            Box({
              key: 'empty',
              marginTop: 1,
              children: [
                Text({
                  dimColor: true,
                  children:
                    review.status === 'running' ? 'Analyzing…' : 'No material findings.',
                }),
              ],
            }),
          ]
        : review.findings.map((finding, index) =>
            Box({
              key: `f-${index}`,
              flexDirection: 'column',
              marginTop: 1,
              children: [
                Text({
                  bold: true,
                  color: color(finding.severity),
                  wrap: 'wrap',
                  children: `${icon(finding.severity)} ${finding.title}`,
                }),
                Text({
                  dimColor: true,
                  children: `${finding.category} · ${finding.severity}`,
                }),
                Text({ wrap: 'wrap', children: finding.detail }),
                finding.evidence
                  ? Text({
                      dimColor: true,
                      wrap: 'wrap',
                      children: `evidence: ${finding.evidence}`,
                    })
                  : null,
                finding.suggestion
                  ? Text({
                      wrap: 'wrap',
                      children: `next: ${finding.suggestion}`,
                    })
                  : null,
              ],
            }),
          )

    const usage = review.usage
    const footer = usage
      ? `turn ${review.turn} · ${review.durationMs ?? 0} ms · cache ${usage.cache_read_input_tokens} · new ${usage.input_tokens + usage.cache_creation_input_tokens} · out ${usage.output_tokens}`
      : `turn ${review.turn}${review.durationMs !== undefined ? ` · ${review.durationMs} ms` : ''}`

    return Box({
      flexDirection: 'column',
      width,
      children: [
        header,
        Box({
          marginTop: 1,
          children: [Text({ bold: true, wrap: 'wrap', children: review.summary })],
        }),
        ...findingRows,
        review.error
          ? Box({
              marginTop: 1,
              children: [Text({ color: 'red', wrap: 'wrap', children: review.error })],
            })
          : null,
        Box({
          marginTop: 1,
          children: [Text({ dimColor: true, wrap: 'wrap', children: footer })],
        }),
        controls,
      ],
    })
  })

  on('ui.press', { plugin: 'csr-reviewer' }, async ($, e, next) => {
    await refreshGlobal($)
    if (e.element === 'run') {
      await runReview(Math.max(1, turn), true)
      return { element: e.element }
    }

    if (e.element === 'toggle') {
      sessionOverride = !isEnabled()
      invalidate()
      return { element: e.element }
    }

    if (e.element === 'clear') {
      reviews = []
      invalidate()
      return { element: e.element }
    }

    return next(e)
  })
}

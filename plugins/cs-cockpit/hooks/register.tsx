// cs-cockpit: um painel ao lado da conversa, com quatro abas e uma status
// line. O mod só observa: todo hook de evento chama next(e) com o mesmo `e`
// e devolve o que next devolveu. O que ele registra fica em $.state.

import { atom, read, update } from 'claude-code'
import type {
  EngineInterface,
  Frozen,
  Register,
  SessionContextUsage,
  SessionCost,
  SessionRateLimit,
  ToolCallInput,
  ToolCallResult,
} from 'claude-code'

import type {
  CockpitAba,
  CockpitCategoria,
  CockpitComando,
  CockpitDetalhe,
  CockpitEdicao,
} from '../types'
import {
  CONTEXTO_INICIAL,
  UI_INICIAL,
  comAgente,
  comAtividade,
  comComando,
  comEdicao,
  comFimDoAgente,
  comFimDoComando,
  comInicioDoTurno,
  comLeitura,
  comListaDaSessao,
  comMedida,
  resumoDaChamada,
  textoDoStatus,
} from './dados'
import { compararTextos, deRemendos, lerRemendos } from './diff'
import { curto, umaLinha } from './formato'
import { desenhar, moverPasso, moverTurno, temRelogio } from './telas'
import type { Acoes, Dados, Elementos, Quadro } from './telas'

const PAINEL = 'cs-cockpit'
const TITULO = 'Cockpit'

const ui = atom({ plugin: 'cs-cockpit', key: 'ui' } as const, UI_INICIAL)
const agentes = atom({ plugin: 'cs-cockpit', key: 'agentes' } as const, [])
const turnos = atom({ plugin: 'cs-cockpit', key: 'turnos' } as const, [])
const contexto = atom({ plugin: 'cs-cockpit', key: 'contexto' } as const, CONTEXTO_INICIAL)
const arquivos = atom({ plugin: 'cs-cockpit', key: 'arquivos' } as const, [])
const comandos = atom({ plugin: 'cs-cockpit', key: 'comandos' } as const, [])
const turno = atom({ plugin: 'cs-cockpit', key: 'turno' } as const, 0)

type Chamada = Frozen<ToolCallInput>

const campos = (valor: unknown): Readonly<Record<string, unknown>> =>
  typeof valor === 'object' && valor !== null ? (valor as Readonly<Record<string, unknown>>) : {}

// Um argumento de ferramenta lido sem confiar no formato: os tipos que o motor
// grava ao carregar o mod não trazem os argumentos de cada ferramenta.
const comoTexto = (valor: unknown): string => (typeof valor === 'string' ? valor : '')

// Do módulo, refeitos a cada recarga: nada que precise sobreviver a ela.
let raiz = ''
let ultimoStatus: string | undefined
let isRelogioLigado = false

// O registro nunca derruba o hook: uma falha vai para o log de depuração.
const anotar = async ($: EngineInterface, onde: string, trabalho: () => Promise<unknown>) => {
  try {
    await trabalho()
  } catch (erro) {
    $.ui.log(`cs-cockpit: ${onde}: ${String(erro)}`, { to: 'debug' })
  }
}

const publicarStatus = async ($: EngineInterface) => {
  const texto = textoDoStatus(await read($, agentes), await read($, contexto))

  if (texto !== ultimoStatus) {
    ultimoStatus = texto
    $.ui.status(texto)
  }
}

const gravarMedida = async (
  $: EngineInterface,
  medido: SessionContextUsage,
  limites: readonly SessionRateLimit[],
  custo: SessionCost | undefined,
) => {
  const n = await read($, turno)
  await update($, contexto, atual => comMedida(atual, n, medido, limites, custo))
}

// A chamada simples é de graça: os números da status line do próprio app.
const medir = async ($: EngineInterface) => {
  const uso = await $.session.usage()
  await gravarMedida($, uso.context, uso.rateLimits, uso.cost)
}

// O detalhamento do contexto por categoria. 'summary' estima localmente, sem
// requisição nenhuma; 'full' conta de verdade, com uma requisição por
// ferramenta e por arquivo de memória. Devolve false quando a sessão não o dá.
const detalharContexto = async (
  $: EngineInterface,
  modo: 'summary' | 'full',
): Promise<boolean> => {
  const uso = await $.session.usage({ breakdown: modo })
  const medido = uso.context.breakdown

  if (medido === undefined) {
    return false
  }

  const n = await read($, turno)
  const detalhe: CockpitDetalhe = {
    categorias: medido.categories.map(
      (categoria): CockpitCategoria => ({
        nome: categoria.name,
        tokens: categoria.tokens,
        tipo: categoria.kind,
      }),
    ),
    total: medido.totalTokens,
    janela: medido.rawMaxTokens,
    modelo: medido.model,
    turno: n,
    isExato: modo === 'full',
  }
  await update($, contexto, atual => {
    // Uma contagem exata deste turno não é trocada por uma estimativa.
    const temExataDoTurno = atual.detalhe?.isExato === true && atual.detalhe.turno === n

    return modo === 'summary' && temExataDoTurno ? atual : { ...atual, detalhe }
  })

  return true
}

const acertarAgentes = async ($: EngineInterface) => {
  const lista = await $.agent.list()
  const agora = await $.clock.now()
  await update($, agentes, atual => comListaDaSessao(atual, lista, agora))
}

const autor = async ($: EngineInterface, agentId: string | undefined): Promise<string> => {
  if (agentId === undefined) {
    return 'principal'
  }

  const agente = (await read($, agentes)).find(um => um.id === agentId)

  return agente === undefined || agente.tipo === 'agente'
    ? `agente ${agentId.slice(0, 6)}`
    : agente.tipo
}

const aoIniciar = async ($: EngineInterface, e: Chamada) => {
  if (e.agentId === undefined && e.tool !== 'Bash') {
    return
  }

  const agora = await $.clock.now()
  const agentId = e.agentId

  if (agentId !== undefined) {
    const argumento = resumoDaChamada(campos(e), raiz)
    await update($, agentes, lista => comAtividade(lista, agentId, e.tool, argumento, agora))
    await publicarStatus($)
  }

  if (e.tool === 'Bash') {
    const comando: CockpitComando = {
      id: e.tool_use_id,
      comando: curto(umaLinha(comoTexto(campos(e).command)), 400),
      estado: 'rodando',
      inicio: agora,
      quem: await autor($, agentId),
    }
    await update($, comandos, lista => comComando(lista, comando))
  }
}

const fimDoBash = (saida: ToolCallResult, duracaoMs: number) => {
  if (saida.deny !== undefined) {
    return { estado: 'negado' as const, duracaoMs }
  }

  const resultado = campos(saida.result)

  if (saida.isError === true) {
    const texto = saida.text ?? (typeof saida.result === 'string' ? saida.result : '')
    const codigo = /Exit code (\d+)/.exec(texto)?.[1]

    return {
      estado: 'falhou' as const,
      duracaoMs,
      ...(codigo === undefined ? {} : { saida: Number(codigo) }),
      ...(resultado.interrupted === true ? { nota: 'interrompido' } : {}),
    }
  }

  if (typeof resultado.backgroundTaskId === 'string') {
    return { estado: 'fundo' as const }
  }

  const nota = resultado.returnCodeInterpretation

  return {
    estado: 'ok' as const,
    duracaoMs,
    ...(typeof nota === 'string' && nota !== '' ? { nota: curto(umaLinha(nota), 60) } : {}),
  }
}

const edicaoDe = (
  e: Chamada,
  saida: ToolCallResult,
  antes: string | null | undefined,
): CockpitEdicao | undefined => {
  const resultado = campos(saida.result)
  const entrada = campos(e)
  const caminho = comoTexto(entrada.file_path)

  // Retida para revisão: o arquivo não mudou.
  if (resultado.staged === true) {
    return undefined
  }

  const doMotor = lerRemendos(resultado.structuredPatch)

  if (e.tool === 'Write') {
    const escrito =
      typeof resultado.content === 'string' ? resultado.content : comoTexto(entrada.content)
    const original =
      antes ?? (typeof resultado.originalFile === 'string' ? resultado.originalFile : null)
    // O conteúdo lido antes da escrita manda; sem ele, o trecho do motor.
    const diff =
      typeof antes === 'string' || doMotor.length === 0
        ? compararTextos(original ?? '', escrito)
        : deRemendos(doMotor)

    return {
      id: e.tool_use_id,
      ferramenta: 'Write',
      caminho,
      isNovo: original === null && resultado.type !== 'update',
      ...diff,
    }
  }

  if (e.tool === 'Edit') {
    const diff =
      doMotor.length > 0
        ? deRemendos(doMotor)
        : compararTextos(comoTexto(entrada.old_string), comoTexto(entrada.new_string))

    return {
      id: e.tool_use_id,
      ferramenta: 'Edit',
      caminho,
      isNovo: false,
      ...diff,
    }
  }

  return undefined
}

const aoTerminar = async (
  $: EngineInterface,
  e: Chamada,
  saida: ToolCallResult,
  duracaoMs: number,
  antes: string | null | undefined,
) => {
  const isOk = saida.deny === undefined && saida.isError !== true

  if (e.tool === 'Bash') {
    const fim = fimDoBash(saida, duracaoMs)
    await update($, comandos, lista => comFimDoComando(lista, e.tool_use_id, fim))

    return
  }

  if (!isOk) {
    return
  }

  if (e.tool === 'Read') {
    const quem = await autor($, e.agentId)
    const caminho = comoTexto(campos(e).file_path)
    await update($, arquivos, lista => comLeitura(lista, caminho, quem))

    return
  }

  if (e.agentId === undefined && (e.tool === 'Edit' || e.tool === 'Write')) {
    const edicao = edicaoDe(e, saida, antes)

    if (edicao !== undefined) {
      const n = Math.max(1, await read($, turno))
      await update($, turnos, lista => comEdicao(lista, n, edicao))
    }
  }
}

// O conteúdo de antes de um Write, para o diff ser o real; null: não havia
// arquivo (ou ele não pôde ser lido, ou passa de 4 MiB).
const lerAntes = async ($: EngineInterface, caminho: string): Promise<string | null> => {
  try {
    return await $.fs.read(caminho)
  } catch {
    return null
  }
}

const acoes = ($: EngineInterface): Acoes => ({
  aba: (aba: CockpitAba) => void update($, ui, atual => ({ ...atual, aba })),
  passo: delta =>
    void anotar($, 'passo', async () => {
      const lista = await read($, turnos)
      await update($, ui, atual => moverPasso(atual, lista, delta))
    }),
  irAoPasso: (n, passo) => void update($, ui, atual => ({ ...atual, turno: n, passo })),
  turno: delta =>
    void anotar($, 'turno', async () => {
      const lista = await read($, turnos)
      await update($, ui, atual => moverTurno(atual, lista, delta))
    }),
  filtro: texto => void update($, ui, atual => ({ ...atual, filtro: texto })),
  // A única contagem de tokens extra do mod, e só quando o botão é apertado.
  detalhar: () =>
    void anotar($, 'contagem exata', async () => {
      await update($, ui, atual => ({ ...atual, isCalculando: true }))

      try {
        if (!(await detalharContexto($, 'full'))) {
          $.ui.toast('cs-cockpit: a sessão não devolveu o detalhamento do contexto')
        }
      } finally {
        await update($, ui, atual => ({ ...atual, isCalculando: false }))
      }
    }),
  fechar: () => void update($, ui, atual => ({ ...atual, isFaixa: false })),
})

const lerDados = async ($: EngineInterface): Promise<Dados> => ({
  ui: await read($, ui),
  agentes: await read($, agentes),
  turnos: await read($, turnos),
  contexto: await read($, contexto),
  arquivos: await read($, arquivos),
  comandos: await read($, comandos),
})

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const iniciada = next(e)
    iniciada.catch(() => undefined)
    raiz = e.cwd

    await anotar($, 'comando /cockpit', () =>
      $.command.register({
        name: 'cockpit',
        description: 'Abre ou fecha o painel Cockpit',
        immediate: true,
      }),
    )
    await anotar($, 'agentes da sessão', () => acertarAgentes($))
    await anotar($, 'medição inicial', () => medir($))
    await anotar($, 'estimativa inicial', () => detalharContexto($, 'summary'))
    await anotar($, 'status', () => publicarStatus($))

    // Um tique por segundo, só enquanto a aba em vista mostra tempo decorrido.
    $.clock.every(1000, () => {
      if (isRelogioLigado) {
        $.ui.invalidate('ui.render')
      }
    })

    return iniciada
  })

  on('command.run', { command: 'cockpit' }, async $ => {
    const isAberto = (await $.ui.panes()).some(painel => painel.id === PAINEL)

    if (isAberto) {
      await $.ui.close({ id: PAINEL })

      return { text: 'Cockpit fechado.' }
    }

    if ((await read($, ui)).isFaixa) {
      await update($, ui, atual => ({ ...atual, isFaixa: false }))

      return { text: 'Cockpit fechado.' }
    }

    const aberto = await $.ui.open({ id: PAINEL, title: TITULO, focus: true, closeOnEscape: true })

    if (aberto.isPlaced) {
      return { text: 'Cockpit aberto. 1 a 4 trocam de aba, Esc fecha.' }
    }

    // Sem lugar para o painel: ele sai e a versão compacta sobe para a faixa.
    await $.ui.close({ id: PAINEL })
    await update($, ui, atual => ({ ...atual, isFaixa: true }))

    return {
      text: `Cockpit: sem lugar para o painel (${aberto.reason}). Versão compacta acima do prompt; /cockpit fecha.`,
    }
  })

  on('ui.close', { id: PAINEL }, ($, e, next) => {
    isRelogioLigado = false

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const partida = performance.now()
    const isEscritaPrincipal = e.tool === 'Write' && e.agentId === undefined
    const antes = isEscritaPrincipal ? await lerAntes($, comoTexto(campos(e).file_path)) : undefined
    const correndo = next(e)
    correndo.catch(() => undefined)
    await anotar($, 'tool.call (início)', () => aoIniciar($, e))

    try {
      const saida = await correndo
      await anotar($, 'tool.call (fim)', () =>
        aoTerminar($, e, saida, Math.round(performance.now() - partida), antes),
      )

      return saida
    } catch (erro) {
      // A chamada foi abandonada (interrupção): o comando não fica "rodando".
      if (e.tool === 'Bash') {
        await anotar($, 'tool.call (abandono)', () =>
          update($, comandos, lista =>
            comFimDoComando(lista, e.tool_use_id, {
              estado: 'falhou',
              duracaoMs: Math.round(performance.now() - partida),
              nota: 'interrompido',
            }),
          ),
        )
      }

      throw erro
    }
  })

  on('agent.spawn', async ($, e, next) => {
    const iniciado = await next(e)

    await anotar($, 'agent.spawn', async () => {
      const id = iniciado.agentId

      if (iniciado.deny !== undefined || id === undefined) {
        return
      }

      const agora = await $.clock.now()
      const novo = { id, tipo: e.subagentType, descricao: e.description, modelo: iniciado.model }
      await update($, agentes, lista => comAgente(lista, novo, agora))
      await publicarStatus($)
    })

    return iniciado
  })

  on('turn.start', async ($, e, next) => {
    const iniciado = next(e)
    iniciado.catch(() => undefined)

    await anotar($, 'turn.start', async () => {
      await update($, turno, n => n + 1)
      await anotar($, 'medição do início do turno', () => medir($))
      await update($, contexto, comInicioDoTurno)
    })

    return iniciado
  })

  on('turn.complete', async ($, e, next) => {
    const terminado = next(e)
    terminado.catch(() => undefined)

    await anotar($, 'turn.complete', async () => {
      const id = e.agentId

      if (id === undefined) {
        // Fim de um turno do loop principal: acerta quem morreu sem avisar.
        await acertarAgentes($)
      } else {
        const agora = await $.clock.now()
        const fim = {
          id,
          isOk: e.reason === 'answer',
          duracaoMs: e.durationMs,
          resposta: e.answer,
          motivo: e.reason,
        }
        await update($, agentes, lista => comFimDoAgente(lista, fim, agora))
      }

      await publicarStatus($)
    })

    return terminado
  })

  on('session.measure', async ($, e, next) => {
    const medido = next(e)
    medido.catch(() => undefined)

    await anotar($, 'session.measure', async () => {
      await gravarMedida($, e.context, e.rateLimits, e.cost)
      await publicarStatus($)
    })
    // A cada medição, o detalhamento estimado acompanha (sem requisição).
    await anotar($, 'estimativa do detalhamento', () => detalharContexto($, 'summary'))

    return medido
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const tabela = $.ui.resolve(e)
    const el: Elementos = {
      Box: tabela.Box,
      Text: tabela.Text,
      Button: tabela.Button,
      Input: 'Input' in tabela ? tabela.Input : null,
    }
    const dados = await lerDados($)
    const quadro: Quadro = {
      largura: e.props.bodyColumns,
      agora: await $.clock.now(),
      raiz,
      // Sentado acima do prompt, e não ao lado: a versão compacta.
      isCompacto: e.props.placement === 'inline',
      isTerminal: e.surface === 'terminal',
      isFaixa: false,
    }
    isRelogioLigado = temRelogio(dados)

    return desenhar(el, dados, quadro, acoes($))
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const visao = await read($, ui)

    if (!visao.isFaixa || e.props.hasSurvey) {
      return next(e)
    }

    const tabela = $.ui.resolve(e)
    const el: Elementos = {
      Box: tabela.Box,
      Text: tabela.Text,
      Button: tabela.Button,
      Input: 'Input' in tabela ? tabela.Input : null,
    }
    const dados = await lerDados($)
    const quadro: Quadro = {
      largura: e.props.bodyColumns,
      agora: await $.clock.now(),
      raiz,
      isCompacto: true,
      isTerminal: e.surface === 'terminal',
      isFaixa: true,
    }
    isRelogioLigado = temRelogio(dados)

    return desenhar(el, dados, quadro, acoes($))
  })
}

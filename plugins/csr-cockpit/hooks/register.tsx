// csr-cockpit: um painel ao lado da conversa, com cinco abas, e uma linha de
// resumo acima do prompt. O mod só observa: todo hook de evento chama next(e) com o mesmo `e`
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
  CockpitFichaDoComando,
  CockpitFichaDoTurno,
  CockpitFoco,
  CockpitPasso,
  CockpitRodada,
  CockpitTokens,
} from '../types'
import {
  CONTEXTO_INICIAL,
  FICHAS_DE_COMANDO,
  FICHAS_DE_TURNO,
  UI_INICIAL,
  comAgente,
  comAtividade,
  comChamadaNaRodada,
  comComando,
  comEdicao,
  comFimDaRodada,
  comFimDoAgente,
  comFimDoComando,
  comFimDoPasso,
  comInicioDoTurno,
  comLeitura,
  comListaDaSessao,
  comMedida,
  comMedidaNaRodada,
  comPasso,
  comRodada,
  naFicha,
  retornoDe,
  resumoDaChamada,
  textoDoStatus,
} from './dados'
import { compararTextos, deRemendos, lerRemendos } from './diff'
import { cabeca, cauda, curto, limpo, umaLinha } from './formato'
import { desenhar, linhaDeResumo, moverPasso, moverTurno, temRelogio } from './telas'
import type { Acoes, Dados, Elementos, Quadro } from './telas'

const PAINEL = 'csr-cockpit'
const TITULO = 'Cockpit'

const ui = atom({ plugin: 'csr-cockpit', key: 'ui' } as const, UI_INICIAL)
const agentes = atom({ plugin: 'csr-cockpit', key: 'agentes' } as const, [])
const turnos = atom({ plugin: 'csr-cockpit', key: 'turnos' } as const, [])
const contexto = atom({ plugin: 'csr-cockpit', key: 'contexto' } as const, CONTEXTO_INICIAL)
const arquivos = atom({ plugin: 'csr-cockpit', key: 'arquivos' } as const, [])
const comandos = atom({ plugin: 'csr-cockpit', key: 'comandos' } as const, [])
const turno = atom({ plugin: 'csr-cockpit', key: 'turno' } as const, 0)
const rodadas = atom({ plugin: 'csr-cockpit', key: 'rodadas' } as const, [])
const serie = atom({ plugin: 'csr-cockpit', key: 'serie' } as const, 0)
// Quantos pedidos a pessoa fez: o número que as abas mostram como "Turno N".
const pedidos = atom({ plugin: 'csr-cockpit', key: 'pedidos' } as const, 0)

// Os detalhes abertos sob demanda, um membro por item: assim as listas que
// mudam a cada chamada continuam pequenas.
const fichasDeAgentes = { plugin: 'csr-cockpit', key: 'fichasDeAgentes' } as const
const fichasDeComandos = { plugin: 'csr-cockpit', key: 'fichasDeComandos' } as const
const fichasDeTurnos = { plugin: 'csr-cockpit', key: 'fichasDeTurnos' } as const

const fichaDoTurno = (n: number): string => `t${n % FICHAS_DE_TURNO}`

type Chamada = Frozen<ToolCallInput>

const campos = (valor: unknown): Readonly<Record<string, unknown>> =>
  typeof valor === 'object' && valor !== null ? (valor as Readonly<Record<string, unknown>>) : {}

// Um argumento de ferramenta lido sem confiar no formato: os tipos que o motor
// grava ao carregar o mod não trazem os argumentos de cada ferramenta.
const comoTexto = (valor: unknown): string => (typeof valor === 'string' ? valor : '')

// Do módulo, refeitos a cada recarga: nada que precise sobreviver a ela.
let raiz = ''
let isRelogioLigado = false

// O registro nunca derruba o hook: uma falha vai para o log de depuração.
const anotar = async ($: EngineInterface, onde: string, trabalho: () => Promise<unknown>) => {
  try {
    await trabalho()
  } catch (erro) {
    $.ui.log(`csr-cockpit: ${onde}: ${String(erro)}`, { to: 'debug' })
  }
}

const gravarMedida = async (
  $: EngineInterface,
  medido: SessionContextUsage,
  limites: readonly SessionRateLimit[],
  custo: SessionCost | undefined,
) => {
  const n = await read($, turno)

  return update($, contexto, atual => comMedida(atual, n, medido, limites, custo))
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

  const n = await read($, pedidos)
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
    const passo: CockpitPasso = {
      id: e.tool_use_id,
      ferramenta: e.tool,
      argumento,
      estado: 'rodando',
    }
    await update($, agentes, lista => comAtividade(lista, agentId, e.tool, argumento, agora))
    await update($, { ...fichasDeAgentes, id: agentId }, ficha => comPasso(ficha, passo))
  }

  if (e.tool === 'Bash') {
    const entrada = campos(e)
    const inteiro = limpo(comoTexto(entrada.command))
    const descricao = limpo(comoTexto(entrada.description))
    // As fichas dos comandos giram em 100 lugares, como a lista.
    const lugar = `c${(await update($, serie, atual => atual + 1)) % FICHAS_DE_COMANDO}`
    const ficha: CockpitFichaDoComando = {
      id: e.tool_use_id,
      comando: cabeca(inteiro, 4000),
      ...(descricao === '' ? {} : { descricao: curto(umaLinha(descricao), 200) }),
    }
    const comando: CockpitComando = {
      id: e.tool_use_id,
      comando: curto(umaLinha(inteiro), 400),
      estado: 'rodando',
      inicio: agora,
      quem: await autor($, agentId),
      ficha: lugar,
    }
    await update($, { ...fichasDeComandos, id: lugar }, () => ficha)
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
  const agentId = e.agentId

  if (agentId !== undefined) {
    await update($, { ...fichasDeAgentes, id: agentId }, ficha =>
      comFimDoPasso(ficha, e.tool_use_id, isOk, duracaoMs),
    )
  }

  if (e.tool === 'Bash') {
    const fim = fimDoBash(saida, duracaoMs)
    const lista = await update($, comandos, atual => comFimDoComando(atual, e.tool_use_id, fim))
    const lugar = lista.find(comando => comando.id === e.tool_use_id)?.ficha

    if (lugar !== undefined) {
      const resultado = campos(saida.result)
      const fora = limpo(comoTexto(resultado.stdout)).trimEnd()
      const erro = limpo(
        isOk ? comoTexto(resultado.stderr) : (saida.deny ?? saida.text ?? comoTexto(saida.result)),
      ).trimEnd()
      await update($, { ...fichasDeComandos, id: lugar }, ficha =>
        // O lugar pode já ter girado para outro comando.
        ficha === undefined || ficha.id !== e.tool_use_id
          ? (ficha ?? { id: e.tool_use_id, comando: '' })
          : {
              ...ficha,
              ...(fora === '' ? {} : { saida: cauda(fora, 3000) }),
              ...(erro === '' ? {} : { erro: cauda(erro, 3000) }),
            },
      )
    }

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
      const n = Math.max(1, await read($, pedidos))
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

// As últimas mensagens que um subagente escreveu, lidas da transcrição dele.
const lerMensagens = async ($: EngineInterface, agentId: string) => {
  const lidas = await $.session.messages({ agentId })

  // A sessão não lê a transcrição desse agente.
  if (!Array.isArray(lidas)) {
    return
  }

  const mensagens = lidas
    .filter(mensagem => mensagem.role === 'assistant' && mensagem.text.trim() !== '')
    .slice(-8)
    .map(mensagem => cabeca(limpo(mensagem.text).trim(), 1500))
  await update($, { ...fichasDeAgentes, id: agentId }, ficha => naFicha(ficha, { mensagens }))
}

const acoes = ($: EngineInterface): Acoes => ({
  // Trocar de aba fecha o detalhe aberto.
  aba: (aba: CockpitAba) =>
    void update($, ui, atual => {
      const { foco: _foco, ...resto } = atual

      return { ...resto, aba }
    }),
  abrir: (foco: CockpitFoco) =>
    void anotar($, 'abrir detalhe', async () => {
      await update($, ui, atual => ({ ...atual, foco }))

      if (foco.tipo === 'agente') {
        await lerMensagens($, foco.id)
      }
    }),
  voltar: () =>
    void update($, ui, atual => {
      const { foco: _foco, ...resto } = atual

      return resto
    }),
  mensagens: (agentId: string) => void anotar($, 'mensagens do agente', () => lerMensagens($, agentId)),
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
          $.ui.toast('csr-cockpit: a sessão não devolveu o detalhamento do contexto')
        }
      } finally {
        await update($, ui, atual => ({ ...atual, isCalculando: false }))
      }
    }),
  fechar: () => void update($, ui, atual => ({ ...atual, isFaixa: false })),
})

const lerDados = async ($: EngineInterface): Promise<Dados> => {
  const visao = await read($, ui)
  const lista = await read($, comandos)
  const foco = visao.foco
  const dados: Dados = {
    ui: visao,
    agentes: await read($, agentes),
    turnos: await read($, turnos),
    contexto: await read($, contexto),
    arquivos: await read($, arquivos),
    comandos: lista,
    rodadas: await read($, rodadas),
    fichas: {},
  }

  if (foco?.tipo === 'agente') {
    const ficha = await read($, { ...fichasDeAgentes, id: foco.id })

    return ficha === undefined ? dados : { ...dados, fichas: { agente: ficha } }
  }

  if (foco?.tipo === 'comando') {
    const lugar = lista.find(comando => comando.id === foco.id)?.ficha
    const ficha =
      lugar === undefined ? undefined : await read($, { ...fichasDeComandos, id: lugar })

    return ficha === undefined || ficha.id !== foco.id
      ? dados
      : { ...dados, fichas: { comando: ficha } }
  }

  if (foco?.tipo === 'turno') {
    // O grupo do pedido: o turno da pessoa e os retornos dos agentes (até 12).
    const membros = dados.rodadas
      .filter(rodada => String(rodada.ordem ?? rodada.n) === foco.id)
      .slice(0, 12)
    const fichas: CockpitFichaDoTurno[] = []

    for (const rodada of membros) {
      const ficha = await read($, { ...fichasDeTurnos, id: fichaDoTurno(rodada.n) })

      if (ficha !== undefined && ficha.n === rodada.n) {
        fichas.push(ficha)
      }
    }

    return { ...dados, fichas: { turnos: fichas } }
  }

  return dados
}

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

      return {}
    }

    if ((await read($, ui)).isFaixa) {
      await update($, ui, atual => ({ ...atual, isFaixa: false }))

      return {}
    }

    const aberto = await $.ui.open({ id: PAINEL, title: TITULO, focus: true, closeOnEscape: true })

    // Sem texto de saída: o painel aberto já é a resposta, e o texto de um
    // comando entra na conversa que o modelo lê.
    if (aberto.isPlaced) {
      return {}
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
      await anotar($, 'tool.call (turno)', async () => {
        const n = await read($, turno)
        const isFalha = saida.deny !== undefined || saida.isError === true
        await update($, rodadas, lista => comChamadaNaRodada(lista, n, e.tool, isFalha))
      })

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
      const pedido = cabeca(limpo(e.prompt), 4000)
      await update($, agentes, lista => comAgente(lista, novo, agora))
      await update($, { ...fichasDeAgentes, id }, ficha => naFicha(ficha, { pedido }))
    })

    return iniciado
  })

  on('turn.start', async ($, e, next) => {
    const iniciado = next(e)
    iniciado.catch(() => undefined)

    await anotar($, 'turn.start', async () => {
      const n = await update($, turno, atual => atual + 1)
      const agora = await $.clock.now()
      const retorno = retornoDe(e.text)
      // O retorno de um agente em segundo plano continua o pedido corrente.
      const ordem =
        retorno === undefined
          ? await update($, pedidos, atual => atual + 1)
          : Math.max(1, await read($, pedidos))
      const agenteId = retorno?.agenteId
      const relato = retorno?.relato
      const rodada: CockpitRodada = {
        n,
        ordem,
        pedido: retorno === undefined ? curto(umaLinha(e.text), 80) : '',
        inicio: agora,
        ferramentas: 0,
        falhas: 0,
        ...(retorno === undefined ? {} : { isRetorno: true }),
        ...(agenteId === undefined ? {} : { agenteId }),
      }
      const inteiro = retorno === undefined ? cabeca(limpo(e.text), 6000) : ''
      await update($, rodadas, lista => comRodada(lista, rodada))
      await update($, { ...fichasDeTurnos, id: fichaDoTurno(n) }, () => ({ n, pedido: inteiro }))

      // O que o agente devolveu ao loop principal, quando ele não deixou resposta.
      if (agenteId !== undefined && relato !== undefined) {
        const entregue = cabeca(limpo(relato), 6000)
        await update($, { ...fichasDeAgentes, id: agenteId }, ficha =>
          ficha?.resposta === undefined ? naFicha(ficha, { resposta: entregue }) : ficha,
        )
      }
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
        // Fim de um turno do loop principal: fecha o turno na aba Turnos e
        // acerta os agentes que morreram sem avisar.
        const n = await read($, turno)
        const resposta = cabeca(limpo(e.answer), 8000)
        await update($, rodadas, lista => comFimDaRodada(lista, n, e.durationMs, e.isAborted))
        await update($, { ...fichasDeTurnos, id: fichaDoTurno(n) }, ficha =>
          ficha === undefined || ficha.n !== n ? { n, pedido: '', resposta } : { ...ficha, resposta },
        )
        await acertarAgentes($)
      } else {
        const agora = await $.clock.now()
        const uso = e.usage
        const tokens: CockpitTokens | undefined =
          uso === undefined
            ? undefined
            : {
                entrada: uso.input_tokens,
                saida: uso.output_tokens,
                cacheLido: uso.cache_read_input_tokens,
                cacheGravado: uso.cache_creation_input_tokens,
                modelo: uso.model,
              }
        const fim = {
          id,
          isOk: e.reason === 'answer',
          duracaoMs: e.durationMs,
          resposta: e.answer,
          motivo: e.reason,
          tokens:
            tokens === undefined
              ? undefined
              : tokens.entrada + tokens.saida + tokens.cacheLido + tokens.cacheGravado,
        }
        const resposta = cabeca(limpo(e.answer), 6000)
        await update($, agentes, lista => comFimDoAgente(lista, fim, agora))
        await update($, { ...fichasDeAgentes, id }, ficha =>
          naFicha(ficha, {
            ...(resposta === '' ? {} : { resposta }),
            ...(tokens === undefined ? {} : { tokens }),
          }),
        )
      }

    })

    return terminado
  })

  on('session.measure', async ($, e, next) => {
    const medido = next(e)
    medido.catch(() => undefined)

    await anotar($, 'session.measure', async () => {
      const medida = await gravarMedida($, e.context, e.rateLimits, e.cost)
      const n = await read($, turno)
      // O que o turno em curso somou ao contexto e custou até aqui.
      await update($, rodadas, lista => comMedidaNaRodada(lista, n, medida))
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
      Markdown: tabela.Markdown,
      Code: tabela.Code,
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

    if (e.props.hasSurvey) {
      return next(e)
    }

    const tabela = $.ui.resolve(e)

    // Sem o painel compacto na faixa, vai a linha de resumo, quando há leitura.
    if (!visao.isFaixa) {
      const resumo = textoDoStatus(await read($, agentes), await read($, contexto))
      const abaixo = await next(e)

      return resumo === undefined ? abaixo : linhaDeResumo(tabela, resumo, abaixo)
    }

    const el: Elementos = {
      Box: tabela.Box,
      Text: tabela.Text,
      Button: tabela.Button,
      Input: 'Input' in tabela ? tabela.Input : null,
      Markdown: tabela.Markdown,
      Code: tabela.Code,
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

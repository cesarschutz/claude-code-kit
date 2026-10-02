// O desenho das quatro abas, a partir de dados prontos: nada aqui chama `$`.
// Os elementos vêm da tabela da superfície ($.ui.resolve) e os botões chamam
// as ações que o register.tsx passa.

import type {
  BoxProps,
  ButtonProps,
  CodeProps,
  ElementConstructor,
  InputProps,
  MarkdownProps,
  RenderElement,
  TextProps,
} from 'claude-code'

import type {
  CockpitAba,
  CockpitAgente,
  CockpitArquivo,
  CockpitComando,
  CockpitContexto,
  CockpitEdicao,
  CockpitFichaDoAgente,
  CockpitFichaDoComando,
  CockpitFichaDoTurno,
  CockpitFoco,
  CockpitLimite,
  CockpitLinha,
  CockpitRodada,
  CockpitTurno,
  CockpitUi,
} from '../types'
import { custoDoUltimoTurno, gruposDeTurnos, variacaoDoUltimoTurno } from './dados'
import type { Grupo } from './dados'
import { fichaDoAgente, fichaDoComando, fichaDoTurno } from './fichas'
import {
  barra,
  curto,
  dolar,
  duracao,
  grafico,
  limitar,
  nomeDoLimite,
  plural,
  relativo,
  renovaEm,
  semRaiz,
  tokens,
  umaLinha,
} from './formato'

export type Elementos = {
  Box: ElementConstructor<BoxProps>
  Text: ElementConstructor<TextProps>
  Button: ElementConstructor<ButtonProps>
  // O mobile não tem Input: sem ele, a aba 4 fica sem o filtro.
  Input: ElementConstructor<InputProps> | null
  Markdown: ElementConstructor<MarkdownProps>
  Code: ElementConstructor<CodeProps>
}

export type Dados = {
  ui: CockpitUi
  agentes: readonly CockpitAgente[]
  turnos: readonly CockpitTurno[]
  contexto: CockpitContexto
  arquivos: readonly CockpitArquivo[]
  comandos: readonly CockpitComando[]
  rodadas: readonly CockpitRodada[]
  // O detalhe do item em foco, quando há um aberto.
  fichas: {
    agente?: CockpitFichaDoAgente
    comando?: CockpitFichaDoComando
    turnos?: readonly CockpitFichaDoTurno[]
  }
}

export type Quadro = {
  largura: number
  agora: number
  raiz: string
  // Painel sentado acima do prompt, ou a faixa: menos linhas por aba.
  isCompacto: boolean
  isTerminal: boolean
  isFaixa: boolean
}

export type Acoes = {
  aba: (aba: CockpitAba) => void
  abrir: (foco: CockpitFoco) => void
  voltar: () => void
  mensagens: (agentId: string) => void
  passo: (delta: number) => void
  irAoPasso: (turno: number, passo: number) => void
  turno: (delta: number) => void
  filtro: (texto: string) => void
  detalhar: () => void
  fechar: () => void
}

const ABAS: readonly { n: CockpitAba; nome: string }[] = [
  { n: 1, nome: 'Agentes' },
  { n: 2, nome: 'Diffs' },
  { n: 3, nome: 'Contexto' },
  { n: 4, nome: 'Arquivos' },
  { n: 5, nome: 'Turnos' },
]

const PASSOS_VISIVEIS = 12

// Uma linha em branco entre os blocos; nenhuma na versão compacta.
const respiro = (quadro: Quadro): number => (quadro.isCompacto ? 0 : 1)

export const comEdicoes = (turnos: readonly CockpitTurno[]): CockpitTurno[] =>
  turnos.filter(turno => turno.edicoes.length > 0)

// O turno e o passo em vista na aba Diffs, já dentro dos limites.
export const selecao = (ui: CockpitUi, turnos: readonly CockpitTurno[]) => {
  const lista = comEdicoes(turnos)
  const achado = ui.turno === 0 ? -1 : lista.findIndex(turno => turno.n === ui.turno)
  const indice = achado === -1 ? lista.length - 1 : achado
  const turno = lista[indice]

  if (turno === undefined) {
    return undefined
  }

  return { lista, indice, turno, passo: limitar(ui.passo, 0, turno.edicoes.length - 1) }
}

export const moverPasso = (
  ui: CockpitUi,
  turnos: readonly CockpitTurno[],
  delta: number,
): CockpitUi => {
  const vista = selecao(ui, turnos)

  if (vista === undefined) {
    return ui
  }

  return { ...ui, passo: limitar(vista.passo + delta, 0, vista.turno.edicoes.length - 1) }
}

export const moverTurno = (
  ui: CockpitUi,
  turnos: readonly CockpitTurno[],
  delta: number,
): CockpitUi => {
  const vista = selecao(ui, turnos)

  if (vista === undefined) {
    return ui
  }

  const indice = limitar(vista.indice + delta, 0, vista.lista.length - 1)
  const alvo = vista.lista[indice]

  if (alvo === undefined || indice === vista.indice) {
    return ui
  }

  // No turno mais recente, volta a acompanhar os próximos.
  return { ...ui, turno: indice === vista.lista.length - 1 ? 0 : alvo.n, passo: 0 }
}

// Algo na aba em vista muda com o relógio (tempo decorrido)?
export const temRelogio = (dados: Dados): boolean =>
  (dados.ui.aba === 1 && dados.agentes.some(agente => agente.estado === 'rodando')) ||
  (dados.ui.aba === 4 && dados.comandos.some(comando => comando.estado === 'rodando')) ||
  (dados.ui.aba === 5 && dados.rodadas.some(rodada => rodada.duracaoMs === undefined)) ||
  // O detalhe aberto de um agente ou de um turno ainda em curso.
  (dados.ui.foco?.tipo === 'agente' &&
    dados.agentes.some(agente => agente.id === dados.ui.foco?.id && agente.estado === 'rodando'))

// A marca do painel: o selo "CSR" em azul e o nome ao lado.
const marca = (el: Elementos, comNome: boolean): RenderElement => {
  const { Text } = el

  return (
    <Text>
      <Text color="suggestion" bold inverse>{' CSR '}</Text>
      {comNome && <Text bold>{' Cockpit'}</Text>}
    </Text>
  )
}

const abas = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const { Box, Button, Text } = el

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      {quadro.isCompacto && marca(el, false)}
      {ABAS.map(aba =>
        aba.n === dados.ui.aba ? (
          <Text color="claude" bold underline>
            {quadro.isTerminal ? `${aba.n}: ${aba.nome}` : `${aba.n} ${aba.nome}`}
          </Text>
        ) : (
          <Button
            key={`aba-${aba.n}`}
            label={quadro.isTerminal ? aba.nome : `${aba.n} ${aba.nome}`}
            hotkey={String(aba.n)}
            plain
            dimColor
            onPress={() => acoes.aba(aba.n)}
          />
        ),
      )}
      {quadro.isFaixa && (
        <Button key="fechar" label="Fechar" role="dismiss" plain dimColor onPress={acoes.fechar} />
      )}
    </Box>
  )
}

// O título de uma linha de lista, que abre o detalhe: um botão sem moldura
// que fica sublinhado e azul enquanto o mouse está sobre a linha.
const titulo = (el: Elementos, chave: string, texto: string, abrir: () => void): RenderElement => {
  const { Button } = el

  return (
    <Button
      key={chave}
      label={`▸ ${texto}`}
      plain
      hover={{ underline: true, color: 'suggestion' }}
      onPress={abrir}
    />
  )
}

const atividade = (agente: CockpitAgente): string =>
  agente.ferramenta === undefined
    ? 'iniciando'
    : `${agente.ferramenta} ${agente.argumento ?? ''}`.trim()

const linhaDoAgente = (
  el: Elementos,
  agente: CockpitAgente,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box, Button, Text } = el
  const isRodando = agente.estado === 'rodando'
  const isOk = agente.estado === 'concluido'
  const marca = isRodando ? '●' : isOk ? '✓' : '✗'
  const cor = isRodando ? 'suggestion' : isOk ? 'success' : 'error'
  const tempo = isRodando
    ? duracao(quadro.agora - agente.inicio)
    : agente.duracaoMs === undefined
      ? 'duração n/d'
      : duracao(agente.duracaoMs)
  const detalhe = semRaiz(
    isRodando ? atividade(agente) : (agente.resultado ?? 'sem texto de resultado'),
    quadro.raiz,
  )
  const numeros = [
    agente.modelo ?? 'modelo n/d',
    tempo,
    agente.contexto === undefined ? undefined : `contexto ${tokens(agente.contexto)}`,
    agente.custo === undefined ? undefined : dolar(agente.custo),
    agente.chamadas > 0 ? plural(agente.chamadas, 'chamada', 'chamadas') : undefined,
    agente.tokens === undefined ? undefined : `${tokens(agente.tokens)} tokens`,
  ].filter((parte): parte is string => parte !== undefined)

  if (quadro.isCompacto) {
    return (
      <Text wrap="truncate-end">
        <Text color={cor}>{`${marca} `}</Text>
        <Text bold>{agente.tipo}</Text>
        <Text dimColor>{` · ${agente.modelo ?? 'modelo n/d'} · ${tempo} · ${detalhe}`}</Text>
      </Text>
    )
  }

  const abrir = () => acoes.abrir({ tipo: 'agente', id: agente.id })

  return (
    <Box key={`linha-agente-${agente.id}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        {titulo(el, `ver-agente-${agente.id}`, agente.tipo, abrir)}
        <Box flexGrow={1} flexShrink={1} minWidth={0}>
          <Text wrap="truncate-end">
            <Text color={cor}>{marca}</Text>
            <Text dimColor>{` ${numeros.join(' · ')}`}</Text>
          </Text>
        </Box>
      </Box>
      {agente.descricao !== '' && <Text wrap="truncate-end">{`  ${agente.descricao}`}</Text>}
      <Text dimColor wrap="truncate-end">{`  ${detalhe}`}</Text>
    </Box>
  )
}

const abaAgentes = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const { Box, Text } = el
  const rodando = dados.agentes.filter(agente => agente.estado === 'rodando')
  const prontos = dados.agentes.filter(agente => agente.estado !== 'rodando').reverse()
  const maximo = quadro.isCompacto ? 2 : 40

  return (
    <Box key="agentes" flexDirection="column" rowGap={respiro(quadro)}>
      <Box flexDirection="column">
        <Text color="suggestion" bold>{`Rodando (${rodando.length})`}</Text>
        {rodando.length === 0 && <Text dimColor>Nenhum subagente rodando.</Text>}
        {rodando.slice(0, maximo).map(agente => linhaDoAgente(el, agente, quadro, acoes))}
      </Box>
      <Box flexDirection="column">
        <Text bold>{`Concluídos (${prontos.length})`}</Text>
        {prontos.length === 0 && <Text dimColor>Nenhum subagente concluído.</Text>}
        {prontos.slice(0, maximo).map(agente => linhaDoAgente(el, agente, quadro, acoes))}
      </Box>
    </Box>
  )
}

const linhaDoDiff = (el: Elementos, linha: CockpitLinha): RenderElement => {
  const { Text } = el

  if (linha.t === '@') {
    return (
      <Text dimColor wrap="truncate-end">
        {linha.x}
      </Text>
    )
  }

  const numero = `${String(linha.n ?? '').padStart(4)} `
  const texto = `${linha.t === '-' ? '−' : linha.t} ${linha.x}`

  return (
    <Text wrap="truncate-end">
      <Text dimColor>{numero}</Text>
      {linha.t === '+' && <Text color="success">{texto}</Text>}
      {linha.t === '-' && <Text color="error">{texto}</Text>}
      {linha.t === ' ' && <Text>{texto}</Text>}
    </Text>
  )
}

const faixaDePassos = (
  el: Elementos,
  turno: CockpitTurno,
  passo: number,
  acoes: Acoes,
): RenderElement => {
  const { Box, Button, Text } = el
  const total = turno.edicoes.length
  const de = limitar(passo - Math.floor(PASSOS_VISIVEIS / 2), 0, Math.max(0, total - PASSOS_VISIVEIS))
  const ate = Math.min(total, de + PASSOS_VISIVEIS)
  const indices = Array.from({ length: ate - de }, (_, i) => de + i)

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
      {de > 0 && <Text dimColor>…</Text>}
      {indices.map(i =>
        i === passo ? (
          <Text color="claude" bold inverse>{` ${i + 1} `}</Text>
        ) : (
          <Button
            key={`passo-${i + 1}`}
            label={String(i + 1)}
            plain
            dimColor
            onPress={() => acoes.irAoPasso(turno.n, i)}
          />
        ),
      )}
      {ate < total && <Text dimColor>…</Text>}
    </Box>
  )
}

const cabecaDaEdicao = (el: Elementos, edicao: CockpitEdicao, quadro: Quadro): RenderElement => {
  const { Text } = el
  const origem = edicao.isNovo ? `${edicao.ferramenta}, arquivo novo` : edicao.ferramenta

  return (
    <Text wrap="truncate-start">
      <Text bold>{relativo(edicao.caminho, quadro.raiz)}</Text>
      <Text color="success">{`  +${edicao.mais}`}</Text>
      <Text color="error">{` −${edicao.menos}`}</Text>
      <Text dimColor>{`  ${origem}`}</Text>
    </Text>
  )
}

const abaDiffs = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const { Box, Button, Text } = el
  const vista = selecao(dados.ui, dados.turnos)

  if (vista === undefined) {
    return (
      <Box key="diffs" flexDirection="column">
        <Text dimColor>Nenhum Edit ou Write do loop principal nesta sessão.</Text>
      </Box>
    )
  }

  const { turno, passo, indice, lista } = vista
  const edicao = turno.edicoes[passo]
  const arquivos = new Set(turno.edicoes.map(uma => uma.caminho)).size
  const maximo = quadro.isCompacto ? 4 : 200
  const linhas = edicao?.linhas ?? []
  const resto = linhas.length - maximo + (edicao?.cortadas ?? 0)

  return (
    <Box key="diffs" flexDirection="column" rowGap={respiro(quadro)}>
      <Box flexDirection="column">
        <Text bold>
          {`Turno ${turno.n} · ${plural(turno.edicoes.length, 'edição', 'edições')} em ${plural(arquivos, 'arquivo', 'arquivos')}`}
        </Text>
        {faixaDePassos(el, turno, passo, acoes)}
      </Box>
      <Box flexDirection="column">
        {edicao !== undefined && cabecaDaEdicao(el, edicao, quadro)}
        {linhas.slice(0, maximo).map(linha => linhaDoDiff(el, linha))}
        {edicao !== undefined && linhas.length === 0 && (
          <Text dimColor>Sem diferença de conteúdo.</Text>
        )}
        {resto > 0 && <Text dimColor>{`… mais ${plural(resto, 'linha', 'linhas')}`}</Text>}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
        <Button key="anterior" label="Anterior (p)" hotkey="p" onPress={() => acoes.passo(-1)} />
        <Button key="proximo" label="Próximo (n)" hotkey="n" onPress={() => acoes.passo(1)} />
        <Button
          key="turno-anterior"
          label="Turno anterior (t)"
          hotkey="t"
          onPress={() => acoes.turno(-1)}
        />
        {indice < lista.length - 1 && (
          <Button key="turno-seguinte" label="Turno seguinte" onPress={() => acoes.turno(1)} />
        )}
      </Box>
    </Box>
  )
}

const variacao = (contexto: CockpitContexto): string => {
  const ultimo = contexto.historico.at(-1)

  if (ultimo === undefined) {
    return 'nenhum turno medido'
  }

  const delta = variacaoDoUltimoTurno(contexto)

  if (delta === undefined) {
    return 'primeiro turno medido'
  }

  return `${delta >= 0 ? '▲ +' : '▼ −'}${tokens(delta)} no último turno`
}

const linhaDeBarra = (
  el: Elementos,
  percentual: number,
  largura: number,
  cor: string,
): RenderElement => {
  const { Text } = el
  const { cheio, vazio } = barra(percentual, largura)

  return (
    <Text>
      <Text color={cor}>{cheio}</Text>
      <Text dimColor>{vazio}</Text>
    </Text>
  )
}

// O detalhamento em três grupos: o que ocupa a janela, o que fica fora dela
// e o que sobra.
const GRUPOS_DO_DETALHE: readonly { titulo: string; tipos: readonly string[] }[] = [
  { titulo: 'Ocupando a janela', tipos: ['used'] },
  { titulo: 'Fora da janela, carregado sob demanda', tipos: ['deferred'] },
  { titulo: 'Reserva e espaço livre', tipos: ['buffer', 'free'] },
]

const detalhamento = (
  el: Elementos,
  contexto: CockpitContexto,
  quadro: Quadro,
): RenderElement | null => {
  const { Box, Text } = el
  const detalhe = contexto.detalhe

  if (detalhe === undefined) {
    return null
  }

  const origem = detalhe.isExato === true ? 'contagem exata' : 'estimativa'
  const quando = detalhe.turno === undefined || detalhe.turno === 0 ? '' : ` do turno ${detalhe.turno}`
  const grupos = GRUPOS_DO_DETALHE.map(grupo => ({
    titulo: grupo.titulo,
    linhas: detalhe.categorias
      .filter(categoria => categoria.tokens > 0 && grupo.tipos.includes(categoria.tipo))
      .sort((a, b) => b.tokens - a.tokens),
  })).filter(grupo => grupo.linhas.length > 0)

  return (
    <Box key="detalhe" flexDirection="column" rowGap={respiro(quadro)}>
      <Text dimColor>
        {`${tokens(detalhe.total)} de ${tokens(detalhe.janela)} · ${detalhe.modelo} · ${origem}${quando}`}
      </Text>
      {grupos.map(grupo => (
        <Box flexDirection="column">
          <Text dimColor>{grupo.titulo}</Text>
          {grupo.linhas.map(categoria => (
            <Text wrap="truncate-end">
              {`${tokens(categoria.tokens).padStart(7)}  ${categoria.nome}`}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  )
}

// Uma linha por limite: nome, percentual, barra e quando renova.
const linhaDoLimite = (
  el: Elementos,
  limite: CockpitLimite,
  quadro: Quadro,
): RenderElement => {
  const { Text } = el
  const percentual = `${limite.percentual}%`
  const { cheio, vazio } = barra(limite.percentual, limitar(quadro.largura - 36, 8, 24))
  const renova = renovaEm(limite.renova, quadro.agora)

  return (
    <Text wrap="truncate-end">
      <Text dimColor>{`${nomeDoLimite(limite.tipo).padEnd(7)}${' '.repeat(Math.max(0, 5 - percentual.length))}`}</Text>
      <Text bold>{percentual}</Text>
      <Text>{'  '}</Text>
      <Text color="suggestion">{cheio}</Text>
      <Text dimColor>{vazio}</Text>
      {renova !== undefined && <Text dimColor>{`  renova em ${renova}`}</Text>}
    </Text>
  )
}

const abaContexto = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const { Box, Button, Text } = el
  const contexto = dados.contexto
  const largura = limitar(quadro.largura - 2, 10, 48)
  const usado = contexto.tokens === undefined ? '–' : tokens(contexto.tokens)
  const janela = contexto.janela > 0 ? tokens(contexto.janela) : '–'
  const preenchido = contexto.percentual === undefined ? '–' : `${contexto.percentual}%`
  const pontos = contexto.historico.map(ponto => ponto.tokens)
  const botao = (
    <Button
      key="detalhar"
      label={dados.ui.isCalculando ? 'Contando…' : 'Contagem exata'}
      onPress={acoes.detalhar}
    />
  )

  if (quadro.isCompacto) {
    const limite = contexto.limites[0]

    return (
      <Box key="contexto" flexDirection="column">
        <Text wrap="truncate-end">
          <Text color="claude" bold>{preenchido}</Text>
          <Text>{` · ${usado} / ${janela} · `}</Text>
          <Text color="claude">{grafico(pontos, 0)}</Text>
          <Text dimColor>{` ${variacao(contexto)}`}</Text>
        </Text>
        <Text wrap="truncate-end">
          {`${dolar(contexto.custo)} na sessão · ${dolar(custoDoUltimoTurno(contexto))} no último turno`}
          {limite !== undefined && ` · limite ${nomeDoLimite(limite.tipo)} ${limite.percentual}%`}
        </Text>
        {botao}
      </Box>
    )
  }

  return (
    <Box key="contexto" flexDirection="column" rowGap={1}>
      <Box flexDirection="column">
        <Text>
          <Text color="claude" bold>{preenchido}</Text>
          <Text dimColor> do contexto</Text>
          <Text bold>{`   ${usado} / ${janela}`}</Text>
        </Text>
        {linhaDeBarra(el, contexto.percentual ?? 0, largura, 'claude')}
      </Box>
      <Box flexDirection="column">
        <Text bold>Últimos 12 turnos</Text>
        <Text>
          <Text color="claude">{pontos.length === 0 ? '–' : grafico(pontos, 0)}</Text>
          <Text dimColor>{`  ${variacao(contexto)}`}</Text>
        </Text>
      </Box>
      <Box flexDirection="column">
        <Text bold>Custo</Text>
        <Text>
          <Text dimColor>{'Sessão        '}</Text>
          <Text bold>{dolar(contexto.custo)}</Text>
        </Text>
        <Text>
          <Text dimColor>{'Último turno  '}</Text>
          <Text bold>{dolar(custoDoUltimoTurno(contexto))}</Text>
        </Text>
      </Box>
      <Box flexDirection="column">
        <Text bold>Limite de uso</Text>
        {contexto.limites.length === 0 && <Text dimColor>Sem leitura nesta sessão.</Text>}
        {contexto.limites.map(limite => linhaDoLimite(el, limite, quadro))}
      </Box>
      <Box flexDirection="column">
        <Text bold>Detalhamento do contexto</Text>
        <Text dimColor wrap="wrap">
          Estimativa atualizada a cada turno, sem requisição extra.
        </Text>
      </Box>
      {detalhamento(el, contexto, quadro)}
      <Box flexDirection="column">
        {botao}
        <Text dimColor wrap="wrap">
          Faz uma requisição por ferramenta e por arquivo de memória.
        </Text>
      </Box>
    </Box>
  )
}

const linhaDoComando = (
  el: Elementos,
  comando: CockpitComando,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box, Text } = el
  const isVivo = comando.estado === 'rodando' || comando.estado === 'fundo'
  const isOk = comando.estado === 'ok'
  const marca = isVivo ? '●' : isOk ? '✓' : '✗'
  const cor = isVivo ? 'suggestion' : isOk ? 'success' : 'error'
  const tempo =
    comando.estado === 'rodando'
      ? duracao(quadro.agora - comando.inicio)
      : comando.duracaoMs === undefined
        ? undefined
        : duracao(comando.duracaoMs)
  const partes = [
    comando.estado === 'rodando' ? 'rodando' : undefined,
    comando.estado === 'fundo' ? 'em segundo plano' : undefined,
    comando.estado === 'negado' ? 'negado' : undefined,
    comando.saida === undefined ? undefined : `exit ${comando.saida}`,
    comando.nota,
    tempo,
    comando.quem === 'principal' ? undefined : comando.quem,
  ].filter((parte): parte is string => parte !== undefined)

  const texto = curto(
    umaLinha(semRaiz(comando.comando, quadro.raiz)),
    Math.max(20, quadro.largura - 34),
  )

  if (quadro.isCompacto) {
    return (
      <Text wrap="truncate-end">
        <Text color={cor}>{`${marca} `}</Text>
        <Text>{texto}</Text>
        <Text dimColor>{` · ${partes.join(' · ')}`}</Text>
      </Text>
    )
  }

  const abrir = () => acoes.abrir({ tipo: 'comando', id: comando.id })

  return (
    <Box key={`linha-comando-${comando.id}`} flexDirection="row" columnGap={1}>
      {titulo(el, `ver-comando-${comando.id}`, texto, abrir)}
      <Box flexGrow={1} flexShrink={1} minWidth={0}>
        <Text wrap="truncate-end">
          <Text color={cor}>{marca}</Text>
          {partes.length > 0 && <Text dimColor>{` ${partes.join(' · ')}`}</Text>}
        </Text>
      </Box>
    </Box>
  )
}

const abaArquivos = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const { Box, Input, Text } = el
  const filtro = dados.ui.filtro.trim().toLowerCase()
  const passa = (texto: string): boolean => filtro === '' || texto.toLowerCase().includes(filtro)
  const arquivos = dados.arquivos.filter(arquivo => passa(arquivo.caminho))
  const comandos = dados.comandos.filter(comando => passa(comando.comando)).reverse()
  const maximo = quadro.isCompacto ? 2 : 60

  return (
    <Box key="arquivos" flexDirection="column" rowGap={respiro(quadro)}>
      {Input !== null && (
        <Input
          key="filtro"
          label="Filtro"
          placeholder="trecho do caminho ou do comando"
          value={dados.ui.filtro}
          submitLabel="filtrar"
          onInput={texto => acoes.filtro(texto)}
          onSubmit={texto => acoes.filtro(texto)}
        />
      )}
      <Box flexDirection="column">
        <Text bold>{`Arquivos lidos (${arquivos.length})`}</Text>
        {arquivos.length === 0 && <Text dimColor>Nenhum arquivo lido.</Text>}
        {arquivos.slice(0, maximo).map(arquivo => (
          <Text wrap="truncate-start">
            <Text dimColor>{`${String(arquivo.vezes).padStart(3)}× `}</Text>
            <Text>{relativo(arquivo.caminho, quadro.raiz)}</Text>
            <Text dimColor>{` · ${arquivo.quem.join(', ')}`}</Text>
          </Text>
        ))}
      </Box>
      <Box flexDirection="column">
        <Text bold>{`Comandos Bash (${comandos.length})`}</Text>
        {comandos.length === 0 && <Text dimColor>Nenhum comando Bash.</Text>}
        {comandos.slice(0, maximo).map(comando => linhaDoComando(el, comando, quadro, acoes))}
      </Box>
    </Box>
  )
}

const linhaDoGrupo = (
  el: Elementos,
  grupo: Grupo,
  edicoes: number,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box, Text } = el
  const tempo = grupo.isAndando ? duracao(quadro.agora - grupo.inicio) : duracao(grupo.duracaoMs)
  const pedido = grupo.cabeca?.pedido ?? ''
  const partes = [
    grupo.variacao === undefined
      ? undefined
      : `${grupo.variacao >= 0 ? '+' : '−'}${tokens(grupo.variacao)} de contexto`,
    grupo.custo === undefined ? undefined : dolar(grupo.custo),
    plural(grupo.ferramentas, 'ferramenta', 'ferramentas'),
    edicoes > 0 ? plural(edicoes, 'edição', 'edições') : undefined,
    grupo.retornos.length > 0
      ? plural(grupo.retornos.length, 'retorno de agente', 'retornos de agentes')
      : undefined,
  ].filter((parte): parte is string => parte !== undefined)
  const estado = (
    <Text wrap="truncate-end">
      {grupo.isAndando && <Text color="suggestion">{`em andamento · ${tempo}`}</Text>}
      {!grupo.isAndando && <Text dimColor>{tempo}</Text>}
      {grupo.isAbortado && <Text color="error">{' · interrompido'}</Text>}
      {grupo.falhas > 0 && (
        <Text color="error">{` · ${plural(grupo.falhas, 'falha', 'falhas')}`}</Text>
      )}
    </Text>
  )

  if (quadro.isCompacto) {
    return (
      <Box flexDirection="column">
        <Text wrap="truncate-end">
          <Text bold>{`Turno ${grupo.ordem} · `}</Text>
          {estado}
        </Text>
        <Text dimColor wrap="truncate-end">{partes.join(' · ')}</Text>
      </Box>
    )
  }

  const abrir = () => acoes.abrir({ tipo: 'turno', id: String(grupo.ordem) })

  return (
    <Box key={`linha-turno-${grupo.ordem}`} flexDirection="column">
      <Box flexDirection="row" columnGap={1}>
        {titulo(el, `ver-turno-${grupo.ordem}`, `Turno ${grupo.ordem}`, abrir)}
        <Box flexGrow={1} flexShrink={1} minWidth={0}>
          {estado}
        </Box>
      </Box>
      {pedido !== '' && <Text wrap="truncate-end">{`  ${pedido}`}</Text>}
      <Text dimColor wrap="truncate-end">{`  ${partes.join(' · ')}`}</Text>
    </Box>
  )
}

const abaTurnos = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const { Box, Text } = el
  const grupos = gruposDeTurnos(dados.rodadas)
  const maximo = quadro.isCompacto ? 2 : 30
  const edicoesDe = (ordem: number): number =>
    dados.turnos.find(turno => turno.n === ordem)?.edicoes.length ?? 0

  return (
    <Box key="turnos" flexDirection="column" rowGap={respiro(quadro)}>
      <Box flexDirection="column">
        <Text>
          <Text bold>{`Turnos (${grupos.length})`}</Text>
          {dados.contexto.custo !== undefined && (
            <Text dimColor>{` · ${dolar(dados.contexto.custo)} na sessão`}</Text>
          )}
        </Text>
        {grupos.length === 0 && <Text dimColor>Nenhum turno nesta sessão ainda.</Text>}
      </Box>
      {grupos
        .slice(0, maximo)
        .map(grupo => linhaDoGrupo(el, grupo, edicoesDe(grupo.ordem), quadro, acoes))}
    </Box>
  )
}

const corpo = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const foco = dados.ui.foco

  // Um item aberto em detalhe toma o lugar da lista da aba dele.
  if (foco?.tipo === 'agente' && dados.ui.aba === 1) {
    const agente = dados.agentes.find(um => um.id === foco.id)

    return fichaDoAgente(el, agente, dados.fichas.agente, quadro, acoes)
  }

  if (foco?.tipo === 'comando' && dados.ui.aba === 4) {
    const comando = dados.comandos.find(um => um.id === foco.id)

    return fichaDoComando(el, comando, dados.fichas.comando, quadro, acoes)
  }

  if (foco?.tipo === 'turno' && dados.ui.aba === 5) {
    const grupo = gruposDeTurnos(dados.rodadas).find(um => String(um.ordem) === foco.id)
    const edicoes = dados.turnos.find(turno => String(turno.n) === foco.id)?.edicoes.length ?? 0

    return fichaDoTurno(el, grupo, dados.fichas.turnos ?? [], dados.agentes, edicoes, quadro, acoes)
  }

  if (dados.ui.aba === 1) {
    return abaAgentes(el, dados, quadro, acoes)
  }

  if (dados.ui.aba === 2) {
    return abaDiffs(el, dados, quadro, acoes)
  }

  if (dados.ui.aba === 3) {
    return abaContexto(el, dados, quadro, acoes)
  }

  return dados.ui.aba === 4
    ? abaArquivos(el, dados, quadro, acoes)
    : abaTurnos(el, dados, quadro, acoes)
}

// O resumo da sessão numa linha, na faixa acima do prompt, em azul: o que
// antes era a status line do Claude Code. `abaixo` é o que já estava na faixa.
export const linhaDeResumo = (
  el: Pick<Elementos, 'Box' | 'Text'>,
  resumo: string,
  abaixo: RenderElement,
): RenderElement => {
  const { Box, Text } = el

  return (
    <Box flexDirection="column">
      {abaixo}
      <Text wrap="truncate-end">
        <Text color="suggestion" bold inverse>{' CSR '}</Text>
        <Text bold>{' Cockpit'}</Text>
        <Text color="suggestion">{`  ${resumo}`}</Text>
      </Text>
    </Box>
  )
}

export const desenhar = (
  el: Elementos,
  dados: Dados,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box, Text } = el

  return (
    <Box flexDirection="column" rowGap={respiro(quadro)}>
      <Box flexDirection="column">
        {!quadro.isCompacto && marca(el, true)}
        {abas(el, dados, quadro, acoes)}
        {!quadro.isCompacto && <Text dimColor>{'─'.repeat(limitar(quadro.largura, 10, 160))}</Text>}
      </Box>
      {corpo(el, dados, quadro, acoes)}
    </Box>
  )
}

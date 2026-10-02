// O desenho das quatro abas, a partir de dados prontos: nada aqui chama `$`.
// Os elementos vêm da tabela da superfície ($.ui.resolve) e os botões chamam
// as ações que o register.tsx passa.

import type {
  BoxProps,
  ButtonProps,
  ElementConstructor,
  InputProps,
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
  CockpitLinha,
  CockpitTurno,
  CockpitUi,
} from '../types'
import { custoDoUltimoTurno } from './dados'
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
  tokens,
  umaLinha,
} from './formato'

export type Elementos = {
  Box: ElementConstructor<BoxProps>
  Text: ElementConstructor<TextProps>
  Button: ElementConstructor<ButtonProps>
  // O mobile não tem Input: sem ele, a aba 4 fica sem o filtro.
  Input: ElementConstructor<InputProps> | null
}

export type Dados = {
  ui: CockpitUi
  agentes: readonly CockpitAgente[]
  turnos: readonly CockpitTurno[]
  contexto: CockpitContexto
  arquivos: readonly CockpitArquivo[]
  comandos: readonly CockpitComando[]
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
]

const PASSOS_VISIVEIS = 12

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
  (dados.ui.aba === 4 && dados.comandos.some(comando => comando.estado === 'rodando'))

const abas = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  const { Box, Button, Text } = el

  return (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
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

const atividade = (agente: CockpitAgente): string =>
  agente.ferramenta === undefined
    ? 'iniciando'
    : `${agente.ferramenta} ${agente.argumento ?? ''}`.trim()

const linhaDoAgente = (el: Elementos, agente: CockpitAgente, quadro: Quadro): RenderElement => {
  const { Box, Text } = el
  const isRodando = agente.estado === 'rodando'
  const isOk = agente.estado === 'concluido'
  const marca = isRodando ? '●' : isOk ? '✓' : '✗'
  const cor = isRodando ? 'suggestion' : isOk ? 'success' : 'error'
  const tempo = isRodando
    ? duracao(quadro.agora - agente.inicio)
    : agente.duracaoMs === undefined
      ? 'duração n/d'
      : duracao(agente.duracaoMs)
  const detalhe = isRodando ? atividade(agente) : (agente.resultado ?? 'sem texto de resultado')
  const cabeca = (
    <Text wrap="truncate-end">
      <Text color={cor}>{`${marca} `}</Text>
      <Text bold>{agente.tipo}</Text>
      <Text dimColor>{` · ${agente.modelo ?? 'modelo n/d'} · ${tempo}`}</Text>
      {quadro.isCompacto && <Text dimColor>{` · ${detalhe}`}</Text>}
    </Text>
  )

  if (quadro.isCompacto) {
    return cabeca
  }

  return (
    <Box flexDirection="column">
      {cabeca}
      <Text dimColor wrap="truncate-end">{`  ${detalhe}`}</Text>
    </Box>
  )
}

const abaAgentes = (el: Elementos, dados: Dados, quadro: Quadro): RenderElement => {
  const { Box, Text } = el
  const rodando = dados.agentes.filter(agente => agente.estado === 'rodando')
  const prontos = dados.agentes.filter(agente => agente.estado !== 'rodando').reverse()
  const maximo = quadro.isCompacto ? 2 : 40

  return (
    <Box key="agentes" flexDirection="column">
      <Text color="suggestion" bold>{`Rodando (${rodando.length})`}</Text>
      {rodando.length === 0 && <Text dimColor>Nenhum subagente rodando.</Text>}
      {rodando.slice(0, maximo).map(agente => linhaDoAgente(el, agente, quadro))}
      <Text bold>{`Concluídos (${prontos.length})`}</Text>
      {prontos.length === 0 && <Text dimColor>Nenhum subagente concluído.</Text>}
      {prontos.slice(0, maximo).map(agente => linhaDoAgente(el, agente, quadro))}
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
    <Box key="diffs" flexDirection="column">
      <Text bold>
        {`Turno ${turno.n} · ${plural(turno.edicoes.length, 'edição', 'edições')} em ${plural(arquivos, 'arquivo', 'arquivos')}`}
      </Text>
      {faixaDePassos(el, turno, passo, acoes)}
      {edicao !== undefined && cabecaDaEdicao(el, edicao, quadro)}
      {linhas.slice(0, maximo).map(linha => linhaDoDiff(el, linha))}
      {edicao !== undefined && linhas.length === 0 && <Text dimColor>Sem diferença de conteúdo.</Text>}
      {resto > 0 && <Text dimColor>{`… mais ${plural(resto, 'linha', 'linhas')}`}</Text>}
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

  const base = contexto.historico.at(-2)?.tokens ?? contexto.tokensAntes

  if (base === undefined) {
    return 'primeiro turno medido'
  }

  const delta = ultimo.tokens - base

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

const detalhamento = (el: Elementos, contexto: CockpitContexto): RenderElement | null => {
  const { Box, Text } = el
  const detalhe = contexto.detalhe

  if (detalhe === undefined) {
    return null
  }

  const linhas = detalhe.categorias
    .filter(categoria => categoria.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens)

  return (
    <Box key="detalhe" flexDirection="column">
      <Text dimColor>
        {`${tokens(detalhe.total)} de ${tokens(detalhe.janela)} · ${detalhe.modelo}`}
      </Text>
      {linhas.map(categoria => (
        <Text wrap="truncate-end">
          <Text>{`${tokens(categoria.tokens).padStart(7)}  ${categoria.nome}`}</Text>
          {categoria.tipo !== 'used' && <Text dimColor>{` (${categoria.tipo})`}</Text>}
        </Text>
      ))}
    </Box>
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
      label={dados.ui.isCalculando ? 'Calculando…' : 'Calcular detalhamento'}
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
          <Text color="claude">{grafico(pontos, contexto.janela)}</Text>
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
    <Box key="contexto" flexDirection="column">
      <Text>
        <Text color="claude" bold>{preenchido}</Text>
        <Text dimColor> do contexto</Text>
        <Text bold>{`   ${usado} / ${janela}`}</Text>
      </Text>
      {linhaDeBarra(el, contexto.percentual ?? 0, largura, 'claude')}
      <Text dimColor>Últimos 12 turnos</Text>
      <Text>
        <Text color="claude">{pontos.length === 0 ? '–' : grafico(pontos, contexto.janela)}</Text>
        <Text dimColor>{`  ${variacao(contexto)}`}</Text>
      </Text>
      <Text>
        <Text dimColor>Custo da sessão </Text>
        <Text bold>{dolar(contexto.custo)}</Text>
        <Text dimColor>   Último turno </Text>
        <Text bold>{dolar(custoDoUltimoTurno(contexto))}</Text>
      </Text>
      {contexto.limites.length === 0 && (
        <Text dimColor>Limite de uso: sem leitura nesta sessão.</Text>
      )}
      {contexto.limites.map(limite => {
        const renova = renovaEm(limite.renova, quadro.agora)

        return (
          <Box flexDirection="column">
            <Text>
              <Text dimColor>{`Limite de uso (${nomeDoLimite(limite.tipo)}) `}</Text>
              <Text bold>{`${limite.percentual}%`}</Text>
              {renova !== undefined && <Text dimColor>{` · renova em ${renova}`}</Text>}
            </Text>
            {linhaDeBarra(el, limite.percentual, largura, 'suggestion')}
          </Box>
        )
      })}
      <Text bold>Detalhamento do contexto</Text>
      <Text dimColor wrap="wrap">
        Separa quanto é sistema, ferramentas, memória e conversa. Faz uma contagem de tokens
        extra, por isso fica sob demanda.
      </Text>
      {botao}
      {detalhamento(el, contexto)}
    </Box>
  )
}

const linhaDoComando = (el: Elementos, comando: CockpitComando, quadro: Quadro): RenderElement => {
  const { Text } = el
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

  return (
    <Text wrap="truncate-end">
      <Text color={cor}>{`${marca} `}</Text>
      <Text>{curto(umaLinha(comando.comando), Math.max(20, quadro.largura - 30))}</Text>
      <Text dimColor>{` · ${partes.join(' · ')}`}</Text>
    </Text>
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
    <Box key="arquivos" flexDirection="column">
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
      <Text bold>{`Arquivos lidos (${arquivos.length})`}</Text>
      {arquivos.length === 0 && <Text dimColor>Nenhum arquivo lido.</Text>}
      {arquivos.slice(0, maximo).map(arquivo => (
        <Text wrap="truncate-start">
          <Text dimColor>{`${String(arquivo.vezes).padStart(3)}× `}</Text>
          <Text>{relativo(arquivo.caminho, quadro.raiz)}</Text>
          <Text dimColor>{` · ${arquivo.quem.join(', ')}`}</Text>
        </Text>
      ))}
      <Text bold>{`Comandos Bash (${comandos.length})`}</Text>
      {comandos.length === 0 && <Text dimColor>Nenhum comando Bash.</Text>}
      {comandos.slice(0, maximo).map(comando => linhaDoComando(el, comando, quadro))}
    </Box>
  )
}

const corpo = (el: Elementos, dados: Dados, quadro: Quadro, acoes: Acoes): RenderElement => {
  if (dados.ui.aba === 1) {
    return abaAgentes(el, dados, quadro)
  }

  if (dados.ui.aba === 2) {
    return abaDiffs(el, dados, quadro, acoes)
  }

  return dados.ui.aba === 3
    ? abaContexto(el, dados, quadro, acoes)
    : abaArquivos(el, dados, quadro, acoes)
}

export const desenhar = (
  el: Elementos,
  dados: Dados,
  quadro: Quadro,
  acoes: Acoes,
): RenderElement => {
  const { Box } = el

  return (
    <Box flexDirection="column" rowGap={quadro.isCompacto ? 0 : 1}>
      {abas(el, dados, quadro, acoes)}
      {corpo(el, dados, quadro, acoes)}
    </Box>
  )
}

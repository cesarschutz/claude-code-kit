// Formatação em pt-BR, sem Intl: o ambiente do mod não tem DOM nem Node.

const BLOCOS = '▁▂▃▄▅▆▇█'

export const limitar = (valor: number, minimo: number, maximo: number): number =>
  Math.min(maximo, Math.max(minimo, valor))

export const decimal = (valor: number, casas: number): string =>
  valor.toFixed(casas).replace('.', ',')

const semZero = (texto: string): string => texto.replace(/,0$/, '')

export const tokens = (n: number): string => {
  const valor = Math.abs(n)

  if (valor < 1000) {
    return String(Math.round(valor))
  }

  if (valor < 1_000_000) {
    return `${semZero(decimal(valor / 1000, 1))}k`
  }

  return `${semZero(decimal(valor / 1_000_000, 1))}M`
}

export const dolar = (usd: number | undefined): string =>
  usd === undefined ? 'US$ –' : `US$ ${decimal(Math.max(0, usd), 2)}`

const dois = (n: number): string => String(n).padStart(2, '0')

export const duracao = (ms: number): string => {
  const segundos = Math.max(0, ms) / 1000

  if (segundos < 10) {
    return `${decimal(segundos, 1)}s`
  }

  if (segundos < 60) {
    return `${Math.floor(segundos)}s`
  }

  const minutos = Math.floor(segundos / 60)

  if (minutos < 60) {
    return `${minutos}m${dois(Math.floor(segundos % 60))}s`
  }

  return `${Math.floor(minutos / 60)}h${dois(minutos % 60)}`
}

export const renovaEm = (iso: string | undefined, agora: number): string | undefined => {
  if (iso === undefined) {
    return undefined
  }

  const quando = Date.parse(iso)

  if (Number.isNaN(quando)) {
    return undefined
  }

  const minutos = Math.ceil((quando - agora) / 60_000)

  if (minutos <= 0) {
    return 'agora'
  }

  if (minutos < 60) {
    return `${minutos}min`
  }

  const horas = Math.floor(minutos / 60)

  return horas < 48 ? `${horas}h${dois(minutos % 60)}` : `${Math.floor(horas / 24)}d`
}

export const barra = (percentual: number, largura: number): { cheio: string; vazio: string } => {
  const cheios = limitar(Math.round((percentual / 100) * largura), 0, largura)

  return { cheio: '█'.repeat(cheios), vazio: '░'.repeat(largura - cheios) }
}

export const grafico = (valores: readonly number[], teto: number): string => {
  const maximo = teto > 0 ? teto : Math.max(1, ...valores)

  return valores
    .map(valor => BLOCOS[limitar(Math.ceil((valor / maximo) * 8), 1, 8) - 1] ?? '▁')
    .join('')
}

export const umaLinha = (texto: string): string => texto.replace(/\s+/g, ' ').trim()

export const curto = (texto: string, maximo: number): string =>
  texto.length > maximo ? `${texto.slice(0, Math.max(1, maximo - 1))}…` : texto

export const primeiraLinha = (texto: string): string =>
  texto
    .split('\n')
    .map(linha => linha.trim())
    .find(linha => linha !== '') ?? ''

export const modeloCurto = (id: string): string =>
  id.replace(/^claude-/, '').replace(/-\d{8}$/, '')

export const relativo = (caminho: string, raiz: string): string =>
  raiz !== '' && caminho.startsWith(`${raiz}/`) ? caminho.slice(raiz.length + 1) : caminho

export const plural = (n: number, um: string, varios: string): string =>
  `${n} ${n === 1 ? um : varios}`

export const nomeDoLimite = (tipo: string): string => {
  if (tipo === 'five_hour') {
    return '5 h'
  }

  if (tipo === 'seven_day') {
    return '7 dias'
  }

  return tipo === 'spend_limit' ? 'gasto' : tipo
}

export const nomeCurtoDoLimite = (tipo: string): string => {
  if (tipo === 'five_hour') {
    return '5h'
  }

  if (tipo === 'seven_day') {
    return '7d'
  }

  return tipo === 'spend_limit' ? 'gasto' : tipo
}

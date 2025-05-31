import { useEffect, useState, useMemo } from 'react'
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DadosClimaticos {
  daily: {
    time: string[]
    precipitation_sum?: (number | null)[]
    temperature_2m_max?: (number | null)[]
    temperature_2m_min?: (number | null)[]
  }
}

interface DadosAtuais {
  time: string
  temperature: number
  windspeed: number
  winddirection: number
  interval: number
  is_day: number
  weathercode: number
  precipitation?: number
}

type EventoExtremo = {
  type: string
  data: string
  valor: number
  fonte: 'Histórico' | 'Previsão' | 'Atual'
}

const LIMITE_CHUVA = 20 // mm
const LIMITE_TEMP_MAX = 35 // °C
const LIMITE_TEMP_MIN = 5 // °C

const App: React.FC = () => {
  const [dadosClimaticos, setDadosClimaticos] = useState<DadosClimaticos | null>(null)
  const [dadosAtuais, setDadosAtuais] = useState<DadosAtuais | null>(null)
  const [previsaoTempo, setPrevisaoTempo] = useState<DadosClimaticos | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDados() {
      try {
        const [resHist, resAtuais, resPrev] = await Promise.all([
          fetch('http://localhost:3001/dados-climaticos'),
          fetch('http://localhost:3001/dados-atuais'),
          fetch('http://localhost:3001/previsao-tempo'),
        ])

        if (!resHist.ok) throw new Error('Erro dados climáticos históricos')
        if (!resAtuais.ok) throw new Error('Erro dados atuais')
        if (!resPrev.ok) throw new Error('Erro dados previsão')

        const dadosHist: DadosClimaticos = await resHist.json()
        const dadosAtu: DadosAtuais = await resAtuais.json()
        const dadosPrev: DadosClimaticos = await resPrev.json()

        setDadosClimaticos(dadosHist)
        setDadosAtuais(dadosAtu)
        setPrevisaoTempo(dadosPrev)
      } catch (e: any) {
        setErro(e.message)
      } finally {
        setCarregando(false)
      }
    }
    fetchDados()
    const intervalo = setInterval(fetchDados, 60000)
    return () => clearInterval(intervalo)
  }, [])

  function processarEventos(daily: DadosClimaticos['daily'], fonte: EventoExtremo['fonte']): EventoExtremo[] {
    const eventos: EventoExtremo[] = []
    daily.time.forEach((data, i) => {
      const chuva = daily.precipitation_sum ? daily.precipitation_sum[i] : null
      const tMax = daily.temperature_2m_max ? daily.temperature_2m_max[i] : null
      const tMin = daily.temperature_2m_min ? daily.temperature_2m_min[i] : null

      if (chuva !== null && chuva >= LIMITE_CHUVA) {
        eventos.push({ type: 'Chuva Forte', data, valor: chuva, fonte })
      }
      if (tMax !== null && tMax >= LIMITE_TEMP_MAX) {
        eventos.push({ type: 'Temperatura Máxima Alta', data, valor: tMax, fonte })
      }
      if (tMin !== null && tMin <= LIMITE_TEMP_MIN) {
        eventos.push({ type: 'Temperatura Mínima Baixa', data, valor: tMin, fonte })
      }
    })
    return eventos
  }

  const eventosHistoricos = useMemo(() => {
    if (!dadosClimaticos) return []
    return processarEventos(dadosClimaticos.daily, 'Histórico')
  }, [dadosClimaticos])

  const eventosPrevisao = useMemo(() => {
    if (!previsaoTempo) return []
    return processarEventos(previsaoTempo.daily, 'Previsão')
  }, [previsaoTempo])

  const eventosAtuais = useMemo(() => {
    if (!dadosAtuais) return []
    const eventos: EventoExtremo[] = []
    if (dadosAtuais.temperature >= LIMITE_TEMP_MAX) {
      eventos.push({
        type: 'Temperatura Atual Alta',
        data: dadosAtuais.time,
        valor: dadosAtuais.temperature,
        fonte: 'Atual',
      })
    }
    if (dadosAtuais.temperature <= LIMITE_TEMP_MIN) {
      eventos.push({
        type: 'Temperatura Atual Baixa',
        data: dadosAtuais.time,
        valor: dadosAtuais.temperature,
        fonte: 'Atual',
      })
    }
    if (dadosAtuais.precipitation !== undefined && dadosAtuais.precipitation >= LIMITE_CHUVA) {
      eventos.push({
        type: 'Chuva Atual Forte',
        data: dadosAtuais.time,
        valor: dadosAtuais.precipitation,
        fonte: 'Atual',
      })
    }
    return eventos
  }, [dadosAtuais])

  // Montar dados combinados para gráficos
  // Mescla histórico e previsão pela data, colocando previsao depois dos históricos
  // Prioriza dados da previsão se data coincidir
  const dadosTemperaturaGrafico = useMemo(() => {
    if (!dadosClimaticos || !previsaoTempo) return []

    // Criar mapa data -> dados históricos
    const mapaHist = new Map<string, any>()
    dadosClimaticos.daily.time.forEach((d, i) => {
      mapaHist.set(d, {
        data: d,
        temp_max_hist: dadosClimaticos.daily.temperature_2m_max?.[i] ?? null,
        temp_min_hist: dadosClimaticos.daily.temperature_2m_min?.[i] ?? null,
        precip_hist: dadosClimaticos.daily.precipitation_sum?.[i] ?? null,
      })
    })

    // Atualizar com previsão
    previsaoTempo.daily.time.forEach((d, i) => {
      if (mapaHist.has(d)) {
        const existente = mapaHist.get(d)!
        existente.temp_max_prev = previsaoTempo.daily.temperature_2m_max?.[i] ?? null
        existente.temp_min_prev = previsaoTempo.daily.temperature_2m_min?.[i] ?? null
        existente.precip_prev = previsaoTempo.daily.precipitation_sum?.[i] ?? null
      } else {
        mapaHist.set(d, {
          data: d,
          temp_max_prev: previsaoTempo.daily.temperature_2m_max?.[i] ?? null,
          temp_min_prev: previsaoTempo.daily.temperature_2m_min?.[i] ?? null,
          precip_prev: previsaoTempo.daily.precipitation_sum?.[i] ?? null,
        })
      }
    })

    // Converter para array ordenado
    return Array.from(mapaHist.values()).sort((a, b) => a.data.localeCompare(b.data))
  }, [dadosClimaticos, previsaoTempo])

  if (carregando)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    )

  if (erro)
    return (
      <Container sx={{ mt: 5 }}>
        <Typography color='error'>{erro}</Typography>
      </Container>
    )

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant='h4' gutterBottom textAlign='center'>
        Dashboard Climático com Previsão e Eventos Extremos
      </Typography>

      {/* Dados atuais */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6'>Dados Atuais (Atualizado a cada 1 min)</Typography>
        {dadosAtuais ? (
          <>
            <List>
              <ListItem>
                <ListItemText primary='Hora' secondary={new Date(dadosAtuais.time).toLocaleString()} />
              </ListItem>
              <ListItem>
                <ListItemText primary='Temperatura' secondary={`${dadosAtuais.temperature.toFixed(1)} °C`} />
              </ListItem>
              <ListItem>
                <ListItemText primary='Velocidade do Vento' secondary={`${dadosAtuais.windspeed} km/h`} />
              </ListItem>
              <ListItem>
                <ListItemText primary='Direção do Vento' secondary={`${dadosAtuais.winddirection}°`} />
              </ListItem>
            </List>
            {eventosAtuais.length > 0 && (
              <Box mt={2}>
                <Typography color='error'>⚠️ Eventos Climáticos Atuais Extremos:</Typography>
                {eventosAtuais.map((evt, i) => (
                  <Chip
                    key={i}
                    label={`${evt.type}: ${evt.valor.toFixed(1)}${
                      evt.type.includes('Chuva') ? ' mm' : ' °C'
                    }`}
                    color='error'
                    sx={{ mr: 1, mt: 1 }}
                  />
                ))}
              </Box>
            )}
          </>
        ) : (
          <Typography>Dados atuais indisponíveis</Typography>
        )}
      </Paper>

      {/* Gráfico Temperatura Máx e Mín */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6' mb={2}>
          Temperaturas Máximas e Mínimas (Histórico x Previsão)
        </Typography>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={dadosTemperaturaGrafico}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='data' tickFormatter={(str) => new Date(str).toLocaleDateString()} />
            <YAxis unit='°C' />
            <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
            <Legend />
            <Line
              type='monotone'
              dataKey='temp_max_hist'
              stroke='#ff7300'
              name='Temp Máx Histórico'
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='temp_min_hist'
              stroke='#387908'
              name='Temp Mín Histórico'
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='temp_max_prev'
              stroke='#8884d8'
              name='Temp Máx Previsão'
              strokeDasharray='5 5'
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='temp_min_prev'
              stroke='#82ca9d'
              name='Temp Mín Previsão'
              strokeDasharray='5 5'
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Gráfico Precipitação */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6' mb={2}>
          Precipitação Diária (Histórico x Previsão)
        </Typography>
        <ResponsiveContainer width='100%' height={250}>
          <BarChart data={dadosTemperaturaGrafico}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='data' tickFormatter={(str) => new Date(str).toLocaleDateString()} />
            <YAxis unit='mm' />
            <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
            <Legend />
            <Bar dataKey='precip_hist' fill='#8884d8' name='Precipitação Histórica' maxBarSize={30} />
            <Bar dataKey='precip_prev' fill='#82ca9d' name='Precipitação Previsão' maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Histórico */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6'>Eventos Extremos - Histórico (Últimos 90 dias)</Typography>
        <Typography>Total eventos: {eventosHistoricos.length}</Typography>
        <List dense>
          {eventosHistoricos.map((evt, i) => (
            <ListItem key={i}>
              <ListItemText
                primary={`${evt.type} em ${new Date(evt.data).toLocaleDateString()}`}
                secondary={`Valor: ${evt.valor.toFixed(1)}${evt.type.includes('Chuva') ? ' mm' : ' °C'}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Previsão */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6'>Eventos Extremos - Previsão</Typography>
        {eventosPrevisao.length === 0 ? (
          <Typography>Nenhum evento extremo previsto.</Typography>
        ) : (
          <List dense>
            {eventosPrevisao.map((evt, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={`${evt.type} previsto para ${new Date(evt.data).toLocaleDateString()}`}
                  secondary={`Valor previsto: ${evt.valor.toFixed(1)}${
                    evt.type.includes('Chuva') ? ' mm' : ' °C'
                  }`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  )
}

export default App

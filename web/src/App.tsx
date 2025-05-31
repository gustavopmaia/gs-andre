import React, { useEffect, useState, useMemo } from 'react'
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
  Divider,
} from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'

interface DadosClimaticos {
  daily: {
    time: string[]
    precipitation_sum: (number | null)[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
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
  type: 'Temperatura Máxima Alta' | 'Temperatura Mínima Baixa' | 'Chuva Forte'
  data: string
  valor: number
}

const LIMITE_CHUVA = 20 // mm
const LIMITE_TEMP_MAX = 35 // °C
const LIMITE_TEMP_MIN = 5 // °C

const App: React.FC = () => {
  const [dadosClimaticos, setDadosClimaticos] = useState<DadosClimaticos | null>(null)
  const [dadosAtuais, setDadosAtuais] = useState<DadosAtuais | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDadosClimaticos() {
      try {
        const res = await fetch('http://localhost:3001/dados-climaticos')
        if (!res.ok) throw new Error('Erro ao buscar dados climáticos')
        const data: DadosClimaticos = await res.json()
        setDadosClimaticos(data)
      } catch {
        setErro('Erro ao carregar dados históricos')
      } finally {
        setCarregando(false)
      }
    }
    fetchDadosClimaticos()
  }, [])

  useEffect(() => {
    async function fetchDadosAtuais() {
      try {
        const res = await fetch('http://localhost:3001/dados-atuais')
        if (!res.ok) throw new Error('Erro ao buscar dados atuais')
        const data: DadosAtuais = await res.json()
        setDadosAtuais(data)
      } catch {
        setDadosAtuais(null)
      }
    }
    fetchDadosAtuais()
    const intervalo = setInterval(fetchDadosAtuais, 60000)
    return () => clearInterval(intervalo)
  }, [])

  // Preparar dados e detectar eventos extremos
  const dadosProcessados = useMemo(() => {
    if (!dadosClimaticos) return { dadosGrafico: [], eventos: [] as EventoExtremo[] }

    const { time, precipitation_sum, temperature_2m_max, temperature_2m_min } = dadosClimaticos.daily

    const dadosGrafico = time.map((data, i) => ({
      data,
      precipitacao: precipitation_sum[i] ?? 0,
      temp_max: temperature_2m_max[i] ?? 0,
      temp_min: temperature_2m_min[i] ?? 0,
    }))

    const eventos: EventoExtremo[] = []

    time.forEach((data, i) => {
      const chuva = precipitation_sum[i]
      const tMax = temperature_2m_max[i]
      const tMin = temperature_2m_min[i]

      if (chuva !== null && chuva >= LIMITE_CHUVA) {
        eventos.push({ type: 'Chuva Forte', data, valor: chuva })
      }
      if (tMax !== null && tMax >= LIMITE_TEMP_MAX) {
        eventos.push({ type: 'Temperatura Máxima Alta', data, valor: tMax })
      }
      if (tMin !== null && tMin <= LIMITE_TEMP_MIN) {
        eventos.push({ type: 'Temperatura Mínima Baixa', data, valor: tMin })
      }
    })

    return { dadosGrafico, eventos }
  }, [dadosClimaticos])

  // Checar se dados atuais são extremos
  const dadosAtuaisExtremos = useMemo(() => {
    if (!dadosAtuais) return [] as EventoExtremo[]
    const eventos: EventoExtremo[] = []

    if (dadosAtuais.temperature >= LIMITE_TEMP_MAX) {
      eventos.push({
        type: 'Temperatura Atual Alta',
        data: dadosAtuais.time,
        valor: dadosAtuais.temperature,
      })
    }
    if (dadosAtuais.temperature <= LIMITE_TEMP_MIN) {
      eventos.push({
        type: 'Temperatura Atual Baixa',
        data: dadosAtuais.time,
        valor: dadosAtuais.temperature,
      })
    }
    if (dadosAtuais.precipitation !== undefined && dadosAtuais.precipitation >= LIMITE_CHUVA) {
      eventos.push({
        type: 'Chuva Atual Forte',
        data: dadosAtuais.time,
        valor: dadosAtuais.precipitation,
      })
    }
    return eventos
  }, [dadosAtuais])

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

  if (!dadosClimaticos)
    return (
      <Container sx={{ mt: 5 }}>
        <Typography>Dados climáticos indisponíveis</Typography>
      </Container>
    )

  return (
    <Container sx={{ mt: 4, mb: 4, fontFamily: "'Roboto', sans-serif" }}>
      <Typography variant='h4' gutterBottom textAlign='center'>
        Dashboard Climático - Eventos Extremos - São Paulo
      </Typography>

      <Paper sx={{ p: 3, mb: 5 }}>
        <Typography variant='h6' gutterBottom>
          Dados Atuais (atualiza a cada 1 minuto)
        </Typography>

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

            {dadosAtuaisExtremos.length > 0 && (
              <Box mt={2}>
                <Typography variant='subtitle1' color='error'>
                  ⚠️ Eventos Climáticos Atuais Extremos:
                </Typography>
                {dadosAtuaisExtremos.map((evt, i) => (
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

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6' gutterBottom>
          Análise de Eventos Extremos - Últimos 90 dias
        </Typography>

        <Box mb={2}>
          <Typography>
            Total de eventos detectados: <strong>{dadosProcessados.eventos.length}</strong>
          </Typography>
          <Typography>
            - Chuva Forte (≥ {LIMITE_CHUVA} mm):{' '}
            <strong>{dadosProcessados.eventos.filter((e) => e.type === 'Chuva Forte').length}</strong>
          </Typography>
          <Typography>
            - Temperatura Máxima Alta (≥ {LIMITE_TEMP_MAX} °C):{' '}
            <strong>
              {dadosProcessados.eventos.filter((e) => e.type === 'Temperatura Máxima Alta').length}
            </strong>
          </Typography>
          <Typography>
            - Temperatura Mínima Baixa (≤ {LIMITE_TEMP_MIN} °C):{' '}
            <strong>
              {dadosProcessados.eventos.filter((e) => e.type === 'Temperatura Mínima Baixa').length}
            </strong>
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <ResponsiveContainer width='100%' height={400}>
          <LineChart data={dadosProcessados.dadosGrafico}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='data'
              tickFormatter={(str) => new Date(str).toLocaleDateString()}
              minTickGap={20}
            />
            <YAxis yAxisId='left' domain={['auto', 'auto']} />
            <YAxis yAxisId='right' orientation='right' domain={[0, 'auto']} allowDecimals={false} />
            <Tooltip
              labelFormatter={(label) => `Data: ${new Date(label).toLocaleDateString()}`}
              formatter={(value: number, name: string) => {
                if (name === 'precipitacao') return [`${value} mm`, 'Precipitação']
                if (name === 'temp_max') return [`${value} °C`, 'Temp. Máx']
                if (name === 'temp_min') return [`${value} °C`, 'Temp. Mín']
                return [value, name]
              }}
            />
            <Legend />

            {/* Linha temperatura máxima */}
            <Line
              yAxisId='left'
              type='monotone'
              dataKey='temp_max'
              stroke='#d32f2f'
              name='Temperatura Máx (°C)'
              strokeWidth={2}
              dot={false}
            />
            {/* Linha temperatura mínima */}
            <Line
              yAxisId='left'
              type='monotone'
              dataKey='temp_min'
              stroke='#1976d2'
              name='Temperatura Mín (°C)'
              strokeWidth={2}
              dot={false}
            />
            {/* Linha precipitação */}
            <Line
              yAxisId='right'
              type='monotone'
              dataKey='precipitacao'
              stroke='#388e3c'
              name='Precipitação (mm)'
              strokeWidth={2}
              dot={false}
            />

            {/* Pontos eventos extremos */}
            {dadosProcessados.eventos.map((evt, i) => {
              let yValue = evt.valor
              if (evt.type === 'Chuva Forte') yValue = evt.valor
              if (evt.type === 'Temperatura Máxima Alta') yValue = evt.valor
              if (evt.type === 'Temperatura Mínima Baixa') yValue = evt.valor
              // colocar o ponto vermelho para eventos extremos
              return (
                <ReferenceDot
                  key={i}
                  x={evt.data}
                  y={yValue}
                  yAxisId={evt.type === 'Chuva Forte' ? 'right' : 'left'}
                  r={6}
                  fill='red'
                  stroke='none'
                  label={{ position: 'top', value: '⚠️', fill: 'red' }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  )
}

export default App

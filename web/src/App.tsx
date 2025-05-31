// App.tsx
import React, { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
} from '@mui/material'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'

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
}

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

  // Preparar dados para gráfico
  const dadosHistoricos = dadosClimaticos.daily.time.map((data, i) => ({
    data,
    precipitacao: dadosClimaticos.daily.precipitation_sum[i] ?? 0,
    temp_max: dadosClimaticos.daily.temperature_2m_max[i] ?? 0,
    temp_min: dadosClimaticos.daily.temperature_2m_min[i] ?? 0,
  }))

  return (
    <Container sx={{ mt: 4, mb: 4, fontFamily: "'Roboto', sans-serif" }}>
      <Typography variant='h4' gutterBottom textAlign='center'>
        Dashboard Climático - São Paulo
      </Typography>

      <Paper sx={{ p: 3, mb: 5 }}>
        <Typography variant='h6' gutterBottom>
          Dados Atuais (atualiza a cada 1 minuto)
        </Typography>
        {dadosAtuais ? (
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
        ) : (
          <Typography>Dados atuais indisponíveis</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6' gutterBottom>
          Precipitação Histórica (últimos 8 dias)
        </Typography>
        <ResponsiveContainer width='100%' height={320}>
          <LineChart data={dadosHistoricos}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='data' tickFormatter={(str) => new Date(str).toLocaleDateString()} />
            <YAxis />
            <Tooltip
              labelFormatter={(label) => `Data: ${new Date(label).toLocaleDateString()}`}
              formatter={(value: number, name: string) => [
                `${value}`,
                name === 'precipitacao' ? 'Precipitação (mm)' : name,
              ]}
            />
            <Legend />
            <Line
              type='monotone'
              dataKey='precipitacao'
              stroke='#1976d2'
              name='Precipitação (mm)'
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='temp_max'
              stroke='#ef5350'
              name='Temperatura Máx (°C)'
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type='monotone'
              dataKey='temp_min'
              stroke='#42a5f5'
              name='Temperatura Mín (°C)'
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  )
}

export default App

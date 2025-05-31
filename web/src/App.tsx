import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'

interface DadosHistoricos {
  historico: {
    time: string[]
    precipitation_sum: number[]
  }
  previsao: {
    time: string[]
    precipitation: number[]
    temperature_2m: number[]
  }
}

interface DadosAtuais {
  time: string
  temperature: number
  precipitation?: number
  windspeed: number
  winddirection: number
}

function App() {
  const [dados, setDados] = useState<DadosHistoricos | null>(null)
  const [dadosAtuais, setDadosAtuais] = useState<DadosAtuais | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Busca dados históricos e previsão só 1 vez
  useEffect(() => {
    fetch('http://localhost:3001/dados-climaticos')
      .then((res) => res.json())
      .then((data: DadosHistoricos) => {
        setDados(data)
        setCarregando(false)
      })
      .catch(() => {
        setErro('Erro ao carregar dados históricos')
        setCarregando(false)
      })
  }, [])

  // Busca dados atuais a cada 60 segundos
  useEffect(() => {
    const buscarDadosAtuais = () => {
      fetch('http://localhost:3001/dados-atuais')
        .then((res) => res.json())
        .then((data: DadosAtuais) => setDadosAtuais(data))
        .catch(() => setDadosAtuais(null))
    }

    buscarDadosAtuais()
    const intervalo = setInterval(buscarDadosAtuais, 60000)

    return () => clearInterval(intervalo)
  }, [])

  if (carregando) return <div>Carregando dados...</div>
  if (erro) return <div>{erro}</div>
  if (!dados) return <div>Sem dados históricos</div>

  const dadosHistoricos = dados.historico.time.map((time, i) => ({
    data: time,
    precipitacao: dados.historico.precipitation_sum[i],
  }))

  const dadosPrevisao = dados.previsao.time.map((time, i) => ({
    data: time,
    precipitacao: dados.previsao.precipitation[i],
    temperatura: dados.previsao.temperature_2m[i],
  }))

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard Climático - São Paulo</h1>

      <section>
        <h2>Dados Atuais (atualiza a cada 1 minuto)</h2>
        {dadosAtuais ? (
          <ul>
            <li>
              <strong>Hora:</strong> {dadosAtuais.time}
            </li>
            <li>
              <strong>Temperatura:</strong> {dadosAtuais.temperature} °C
            </li>
            <li>
              <strong>Precipitação:</strong> {dadosAtuais.precipitation ?? '0'} mm
            </li>
            <li>
              <strong>Velocidade do Vento:</strong> {dadosAtuais.windspeed} km/h
            </li>
            <li>
              <strong>Direção do Vento:</strong> {dadosAtuais.winddirection}°
            </li>
          </ul>
        ) : (
          <p>Dados atuais indisponíveis</p>
        )}
      </section>

      <section>
        <h2>Precipitação Histórica (últimos 90 dias)</h2>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={dadosHistoricos}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='data' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='precipitacao' stroke='#8884d8' name='Precipitação (mm)' />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Previsão de Precipitação (próximas 72h)</h2>
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={dadosPrevisao}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='data' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='precipitacao' stroke='#82ca9d' name='Precipitação (mm)' />
            <Line type='monotone' dataKey='temperatura' stroke='#ff7300' name='Temperatura (°C)' />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}

export default App

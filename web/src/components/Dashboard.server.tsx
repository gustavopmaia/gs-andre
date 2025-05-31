'use server'

import Grafico from './Grafico.server'
import DadosAtuais from './DadosAtuais.client'

async function Dashboard() {
  const res = await fetch('http://localhost:3001/dados-climaticos')
  const dados = await res.json()

  if (!dados) {
    return <p>Dados históricos indisponíveis.</p>
  }

  const dadosHistoricos = dados.historico.time.map((time: string, i: number) => ({
    data: time,
    precipitacao: dados.historico.precipitation_sum[i],
  }))

  const dadosPrevisao = dados.previsao.time.map((time: string, i: number) => ({
    data: time,
    precipitacao: dados.previsao.precipitation[i],
    temperatura: dados.previsao.temperature_2m[i],
  }))

  return (
    <>
      <h1>Dashboard Climático - São Paulo</h1>

      <section>
        <h2>Dados Atuais</h2>
        <DadosAtuais />
      </section>

      <section>
        <h2>Precipitação Histórica (últimos 90 dias)</h2>
        <Grafico
          dados={dadosHistoricos}
          linhas={[{ key: 'precipitacao', cor: '#1976d2', label: 'Precipitação (mm)' }]}
        />
      </section>

      <section>
        <h2>Previsão (próximas 72h)</h2>
        <Grafico
          dados={dadosPrevisao}
          linhas={[
            { key: 'precipitacao', cor: '#388e3c', label: 'Precipitação (mm)' },
            { key: 'temperatura', cor: '#f57c00', label: 'Temperatura (°C)' },
          ]}
        />
      </section>
    </>
  )
}

export default Dashboard

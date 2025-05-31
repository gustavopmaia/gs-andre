import Fastify, { FastifyRequest, FastifyReply } from 'fastify'
import axios from 'axios'
import fastifyCors from '@fastify/cors'

const fastify = Fastify({ logger: true })

await fastify.register(fastifyCors, { origin: '*' })

const LATITUDE = -23.5505
const LONGITUDE = -46.6333

// Rota que retorna dados historicos + previsão (não atualiza a todo momento)
fastify.get('/dados-climaticos', async (req: FastifyRequest, res: FastifyReply) => {
  const dataFim = new Date()
  const dataInicio = new Date()
  dataInicio.setDate(dataFim.getDate() - 90)
  const start_date = dataInicio.toISOString().slice(0, 10)
  const end_date = dataFim.toISOString().slice(0, 10)

  const urlHistorico = `https://archive-api.open-meteo.com/v1/archive?latitude=${LATITUDE}&longitude=${LONGITUDE}&start_date=${start_date}&end_date=${end_date}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`
  const urlPrevisao = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&hourly=precipitation,temperature_2m&forecast_days=3&timezone=America%2FSao_Paulo`

  try {
    const [resHistorico, resPrevisao] = await Promise.all([axios.get(urlHistorico), axios.get(urlPrevisao)])

    return {
      historico: resHistorico.data.daily,
      previsao: resPrevisao.data.hourly,
    }
  } catch (error) {
    fastify.log.error(error)
    return res.status(500).send({ error: 'Erro ao buscar dados climáticos' })
  }
})

// Rota que retorna dados atuais (tempo real) para chamadas frequentes
fastify.get('/dados-atuais', async (req: FastifyRequest, res: FastifyReply) => {
  const urlAtual = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current_weather=true&timezone=America%2FSao_Paulo`

  try {
    const resAtual = await axios.get(urlAtual)
    return resAtual.data.current_weather || null
  } catch (error) {
    fastify.log.error(error)
    return res.status(500).send({ error: 'Erro ao buscar dados climáticos' })
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001 })
    console.log('Servidor rodando em http://localhost:3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()

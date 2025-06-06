import { FastifyReply, FastifyRequest } from 'fastify'
import { pegarDadosClimaticos, pegarDadosAtuais, pegarPrevisaoFutura } from '../services/climaService'

export async function getDadosClimaticos(request: FastifyRequest, reply: FastifyReply) {
  try {
    const dados = await pegarDadosClimaticos()
    return reply.send(dados)
  } catch (error) {
    console.error(error)
    return reply.status(500).send({ error: 'Erro ao obter dados climáticos' })
  }
}

export async function getDadosAtuais(request: FastifyRequest, reply: FastifyReply) {
  try {
    const dadosAtuais = await pegarDadosAtuais()
    return reply.send(dadosAtuais)
  } catch (error) {
    console.error(error)
    return reply.status(500).send({ error: 'Erro ao obter dados atuais' })
  }
}

export async function getPrevisaoTempo(request: FastifyRequest, reply: FastifyReply) {
  try {
    const previsao = await pegarPrevisaoFutura() // Reutilizando a função de dados climáticos
    return reply.send(previsao)
  } catch (error) {
    console.error(error)
    return reply.status(500).send({ error: 'Erro ao obter previsão do tempo' })
  }
}

import { FastifyInstance } from 'fastify'
import { getDadosClimaticos, getDadosAtuais } from './controllers/dadosController'

export async function routes(app: FastifyInstance) {
  app.get('/dados-climaticos', getDadosClimaticos)
  app.get('/dados-atuais', getDadosAtuais)
}

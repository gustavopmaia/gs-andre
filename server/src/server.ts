import Fastify from 'fastify'
import cors from '@fastify/cors'
import { routes } from './routes'

async function iniciarServidor() {
  const app = Fastify({
    logger: true,
  })

  // Enable CORS for all origins
  await app.register(cors, {
    origin: true,
  })

  await routes(app)

  try {
    await app.listen({ port: 3001 })
    console.log('Servidor rodando na porta 3001')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

iniciarServidor()

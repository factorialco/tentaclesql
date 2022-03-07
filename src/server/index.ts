import fastify, { FastifyRequest, FastifyReply } from 'fastify'
import executor from '../executor'
import type { Extension } from '../executor'
import logger from '../logger'

interface Body {
  query: string
  parameters?: Array<string>
  config: {
    extensions: Array<Extension>,
    schema: Array<any> // FIXME
  }
}

const FORWARDED_MESSAGES = ['SyntaxError', 'SqliteError']

const build = () => {
  const server = fastify({ logger: logger })

  server.setErrorHandler(function (error: any, request: FastifyRequest, reply: FastifyReply) {
    this.log.error(error)

    if (FORWARDED_MESSAGES.includes(error?.name)) {
      reply.code(400)
      reply.send(error.message)
      return
    }

    reply.send(error)
  })

  // SQL Query endpoint
  server.post<{ Body: Body }>('/', async (request, reply) => {
    if (!request.body.query) {
      server.log.error('Invalid SQL query')

      return reply
        .code(422)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ errors: 'Invalid SQL query' })
    }

    const result = await executor(
      request.body.query,
      request.body.parameters || [],
      request.headers,
      request.body.config
    )

    server.log.info(result)

    reply.send(result)
  })

  // Health check route
  server.get('/health-check', async (_request, _reply) => {
    return 'OK'
  })

  return server
}

export default build

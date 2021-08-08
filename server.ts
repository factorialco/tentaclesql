import fastify from 'fastify'
import queryTables from './src/queryTables'
import type { Extension } from './src/queryTables'
import logger from './src/logger'

interface Body {
  query: string
  parameters?: Array<string>
  config: {
    extensions: Array<Extension>
  }
}

const build = () => {
  const server = fastify({ logger: logger })

  // SQL Query endpoint
  server.post<{ Body: Body }>('/', async (request, reply) => {
    if (!request.body.query) {
      server.log.error('Invalid SQL query')

      return reply
        .code(422)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ errors: 'Invalid SQL query' })
    }

    return queryTables(
      request.body.query,
      request.body.parameters || [],
      request.headers,
      request.body.config
    ).then(result => {
      server.log.info(result)

      reply.send(result)
    }).catch(error => {
      server.log.error(error)

      reply.send(error)
    })
  })

  // Health check route
  server.get('/health-check', async (_request, _reply) => {
    return 'OK'
  })

  return server
}

export { build }

const start = async () => {
  const server = build()
  try {
    await server.listen(process.env.PORT || 3000, '0.0.0.0')
  } catch (err) {
    await server.log.error(err)

    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}

start()

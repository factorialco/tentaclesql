import fastify from 'fastify'
import queryTables from './src/queryTables'
import logger from './src/logger'

const server = fastify({ logger: logger })

interface Body {
  query: string
  parameters?: Array<string>
}

// SQL Query endpoint
server.post<{ Body: Body }>('/', (request, reply) => {
  return queryTables(
    request.body.query,
    request.body.parameters || [],
    request.headers
  ).then(result => {
    server.log.info(result)

    reply.send(result)
  }).catch(error => {
    server.log.error(error)

    reply.send(error)
  })
})

// Health check route
server.get('/health-check', async (request, reply) => {
  return 'OK'
})

const start = async () => {
  try {
    await server.listen(process.env.PORT || 8080, '0.0.0.0')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()

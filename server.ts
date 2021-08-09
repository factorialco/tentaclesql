import build from './src/server'

const start = async () => {
  const server = build()
  try {
    await server.listen(process.env.PORT || 8080, '0.0.0.0')
  } catch (err) {
    await server.log.error(err)

    console.error(err)

    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}

start()

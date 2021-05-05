import pino from 'pino'

const logger = pino({
  name: 'data-engine-lite',
  level: process.env.LOG_LEVEL || 'silent',
  prettyPrint: !process.env.PRODUCTION
})

export default logger

import pino from 'pino'

const logger = pino({
  name: 'tentaclesql',
  level: process.env.LOG_LEVEL || 'silent',
  prettyPrint: process.env.NODE_ENV !== 'production'
})

export default logger

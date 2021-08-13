import Vorpal from 'vorpal'
import logger from '../logger'
import { table, json } from '../serializers/index'

import executor from '../executor'

const serializers: any = {
  table,
  json
}

const queryCommand = async (args: any): Promise<any> => {
  logger.info('Executing ', args.query)
  const results = await executor(args.query, [], {})

  logger.info(`Found ${results.length} rows`)

  const format = args.options.format || 'table'

  if (!serializers?.[format]) {
    return logger.error(`format ${format} is not available`)
  }

  return serializers[format](results)
}

const startRpl = () => {
  const vorpal = new Vorpal()

  vorpal
    .command('query <query>', 'Executes arbitrary sql.')
    .alias('q')
    .option('-f, --format <fmt>', 'Serializer format')
    .action(queryCommand)

  vorpal
    .delimiter('tentaclesql >')
    .history('tentaclesql')

  if (process.argv.includes('interactive')) {
    vorpal
      // .parse(process.argv.filter(arg => arg !== 'interactive'))
      .show()
  } else {
    vorpal.delimiter('')
      .parse(process.argv)

    // FIXME: It would be good to wait
    setTimeout(() => { process.exit(0) }, 30000)
  }

  (vorpal as any)
    .mode('sql')
    .delimiter('sql:')
    .action((command: string) => {
      return queryCommand({
        query: command,
        options: {
          format: 'table'
        }
      })
    })
}

export default startRpl

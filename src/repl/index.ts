import Vorpal from 'vorpal'
import Table from 'cli-table'

import executor from '../executor'

const startRpl = () => {
  const vorpal = new Vorpal()
  vorpal
    .command('sql <query>', 'Executes arbitrary sql.')
    .action(async (args: any, callback: any) => {
      console.log('query args', args)
      const results = await executor(args.query, [], {})

      console.log('results: ', results)

      const table = new Table({
        head: Object.values(results[0])
      })

      results.forEach((result) => {
        table.push(Object.values(result))
      })

      callback(table.toString())
    })

  vorpal
    .delimiter('tentaclesql >')
    .show()
}

export default startRpl

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

import executor from './src/executor'
import startRpl from './src/repl'

const argv = yargs(hideBin(process.argv))
  .command(['query', 'q'], '', (argv) => {
    const headers = { Cookie: `${process.env.COOKIE}` }

    executor(
      argv.query,
      [],
      headers
    ).then(result => {
      console.log(result)
    }).catch(error => {
      console.log(error)
    })
  })
  .command(['interactive', 'i'], '', () => {
    console.log('interactive mode')
    startRpl()
  })
  .argv

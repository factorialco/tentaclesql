#!/usr/bin/env node

import { Command } from 'commander'
import executor from './src/executor'
import startRpl from './src/repl'

const program = new Command()

program
  .command('query')
  .argument('<sql>')
  .action((sql: string) => {
    const headers = { Cookie: `${process.env.COOKIE}` }

    executor(
      sql,
      [],
      headers
    ).then(result => {
      console.log(result)
    }).catch(error => {
      console.log(error)
    })
  })

program
  .command('interactive')
  .action(() => {
    console.log('interactive mode')
    startRpl()
  })

program.parse()

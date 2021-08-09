import yargs from 'yargs/yargs'
import executor from './src/executor'

const argv = yargs(process.argv.slice(2)).options({
  query: { type: 'string', demandOption: true }
}).argv

if (argv.query) {
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
}

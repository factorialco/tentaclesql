import yargs from 'yargs/yargs'
import queryTables from './src/queryTables'

const argv = yargs(process.argv.slice(2)).options({
  query: { type: 'string', demandOption: true }
}).argv

if (argv.query) {
  const headers = { Cookie: `${process.env.COOKIE}` }

  queryTables(
    argv.query,
    [],
    headers
  ).then(result => {
    console.log(result)
  }).catch(error => {
    console.log(error)
  })
}

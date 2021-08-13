import path from 'path'
import logger from '../../logger'
import type IDatabaseAdapter from './IDatabaseAdapter'

const EXTENSIONS: any = {
  crypto: 'crypto',
  json1: 'json1',
  math: 'math',
  re: 're',
  stats: 'stats',
  text: 'text',
  unicode: 'unicode',
  vsv: 'vsv'
}

class BetterSqliteAdapter implements IDatabaseAdapter {
  db: any

  constructor (extensions: Array<string>) {
    this.init(extensions)
  }

  async init (extensions: Array<string>) {
    if (typeof window !== 'undefined') {
      throw Error('You must provide a compatible DatabaseAdapter')
    }

    const databaseConst = await import('better-sqlite3')
    const Database = databaseConst.default
    this.db = new Database('', { verbose: (message) => { logger.debug(message) } })
    this.loadExtensions(extensions)
  }

  loadExtensions (extensions: Array<string>) {
    // https://github.com/nalgeon/sqlean
    const extensionBase = path.join(__dirname, '/sqlite_extensions/')

    extensions.forEach((extension: string) => {
      if (!EXTENSIONS[extension]) {
        throw Error(`${extension} extension not found!`)
      }

      this.db.loadExtension(path.join(extensionBase, EXTENSIONS[extension]))
    })
  }

  storeToDb (tableDefinition: any, data: Array<any>) {
    const schema = tableDefinition.fields.map((field: any) => `@${field.key}`).join(', ')

    const insert = this.db.prepare(`INSERT INTO ${tableDefinition.name} VALUES (${schema})`)
    for (const row of data) insert.run(row)
  }

  createTable (tableDefinition: any, schemas: any) {
    const query = `CREATE TABLE ${tableDefinition.name} (${schemas})`

    this.db.prepare(query).run()
  }

  runQuery (sql: string, parameters: Array<any>) {
    const stmt = this.db.prepare(sql)

    return stmt.all(parameters)
  }
}

export default BetterSqliteAdapter

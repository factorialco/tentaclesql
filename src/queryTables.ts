import fetch from 'node-fetch'
import Database from 'better-sqlite3'
import sqliteParser from 'sqlite-parser'

import type { Database as DatabaseType } from 'better-sqlite3'

import extractTables from './extractTables'
import logger from './logger'

type Config = {
  schemaUrl: string,
  tableUrl: string,
  host: string,
}

type FieldDefinition = {
  type: string,
  key: string,
}

type TableDefinition = {
  name: string,
  fields: Array<FieldDefinition>
}

type Schema = Array<TableDefinition>
type Parameters = Array<any>

// NOTE: Pave the road for open source
function getConfig (): Config {
  const apiUrl = process.env.API_DOMAIN || ''

  return {
    schemaUrl: `${apiUrl}/reports/sql/schema`,
    tableUrl: `${apiUrl}/reports/sql/tables/`,
    host: (new URL(apiUrl)).hostname
  }
}

function mutateDataframe (df, fn) {
  return df.forEach(row => { Object.keys(row).forEach(k => fn(row, k)) })
}

function parse (sql: string) {
  return sqliteParser(sql)
}

function validateQuery (ast) {
  if (ast.type !== 'statement' || ast.variant !== 'list') throw new Error('Malformed query')
  if (ast.statement.length > 1) throw new Error('Only one statement is supported')
  if (ast.statement[0].variant !== 'select') throw new Error('Only SELECT queries are supported')
}

async function fetchSchema (config: Config, headers) {
  const res = await fetch(config.schemaUrl, { headers })

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
}

async function fetchTableData (config: Config, tableDefinition: TableDefinition, headers) {
  const res = await fetch(`${config.tableUrl}${tableDefinition.name}`, { headers })

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
}

async function populateTables (config: Config, db: DatabaseType, usedTables: Array<string>, headers) {
  const schema: Schema = await fetchSchema(config, headers)

  const filteredTableDefinition = schema.filter(tableDefinition => usedTables.includes(tableDefinition.name))

  const promises = filteredTableDefinition.map(async (tableDefinition) => {
    createTable(db, tableDefinition)

    const data = await fetchTableData(config, tableDefinition, headers)

    if (data.length === 0) return

    // No support for booleans :/
    mutateDataframe(data, (row, k) => {
      if (typeof row[k] === 'boolean') row[k] = row[k] ? 'TRUE' : 'FALSE'
    })

    storeToDb(db, tableDefinition, data)
  })

  return Promise.all(promises)
}

function storeToDb (db: DatabaseType, tableDefinition: TableDefinition, data) {
  const schema = tableDefinition.fields.map(field => `@${field.key}`).join(', ')
  const insert = db.prepare(`INSERT INTO ${tableDefinition.name} VALUES (${schema})`)
  for (const row of data) insert.run(row)
}

const TYPES = { // Perdona Pau ;)
  bigint: 'BIGINT',
  date: 'DATE',
  number: 'INTEGER',
  integer: 'INTEGER',
  string: 'TEXT',
  text: 'TEXT',
  boolean: 'BOOLEAN'
}

function parseSchema (tableDefinition: TableDefinition): Array<string> {
  return tableDefinition.fields.map(field => {
    const type = TYPES[field.type]

    if (!type) throw new Error(`Invalid field type ${field.type}`)

    return `${field.key} ${type}`
  })
}

function createTable (db: DatabaseType, tableDefinition: TableDefinition) {
  const schemas = parseSchema(tableDefinition).join(', ')
  const query = `CREATE TABLE ${tableDefinition.name} (${schemas})`

  db.prepare(query).run()
}

async function queryTables (sql: string, parameters: Parameters, headers) {
  logger.info({
    sql: sql,
    parameters: parameters,
    headers: headers
  })

  const ast = parse(sql)

  validateQuery(ast)

  // Empty name = temporary
  const db = new Database('', { verbose: (message) => { logger.debug(message) } })

  const usedTables = extractTables(ast)

  if (usedTables.length > 0) {
    const config = getConfig()

    delete headers['content-length']

    await populateTables(config, db, usedTables, {
      ...headers,
      host: config.host,
      'user-agent': 'data-lite-engine/1.0.0'
    })
  }

  const stmt = db.prepare(sql)

  return stmt.all(parameters)
}

export default queryTables

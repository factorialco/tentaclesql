import fetch from 'node-fetch'
import Database from 'better-sqlite3'
import sqliteParser from 'sqlite-parser'

import type { Database as DatabaseType } from 'better-sqlite3'

import extractTables from './extractTables'
import logger from './logger'
import flattenObject from './flattenObject'

type FieldDefinition = {
  type: string,
  key: string,
}

type TableDefinition = {
  name: string,
  url: string,
  result_key: string,
  data: any,
  fields: Array<FieldDefinition>
}

type Schema = Array<TableDefinition>
type Parameters = Array<any>

function getSchemaUrl (): string {
  if (!process.env.SCHEMA_URL) {
    throw new Error('SCHEMA_URL environment variable is mandatory')
  }

  return process.env.SCHEMA_URL
}

function getHost (): string {
  return (new URL(getSchemaUrl())).hostname
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
  if (!['select', 'compound'].includes(ast.statement[0].variant)) throw new Error('Only SELECT queries are supported')
}

async function fetchSchema (headers) {
  const res = await fetch(getSchemaUrl(), { headers })

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
}

async function fetchTableData (tableDefinition: TableDefinition, headers) {
  const res = await fetch(tableDefinition.url, { headers })

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
}

async function populateTables (db: DatabaseType, usedTables: Array<string>, headers) {
  const schema: Schema = await fetchSchema(headers)

  const filteredTableDefinition = schema.filter(tableDefinition => usedTables.includes(tableDefinition.name))

  const promises = filteredTableDefinition.map(async (tableDefinition) => {
    const data = await fetchTableData(tableDefinition, headers)

    const resultKey = tableDefinition.result_key
    const fixedData = resultKey ? data[resultKey].map(field => flattenObject(field, '_')) : data.map(field => flattenObject(field, '_'))

    if (fixedData.length === 0) return

    const dynamicDefinition = {
      ...tableDefinition,
      data: fixedData[0] // We base table definition on first row
    }

    createTable(db, dynamicDefinition)

    // No support for booleans :/
    mutateDataframe(fixedData, (row, k) => {
      if (typeof row[k] === 'boolean') row[k] = row[k] ? 'TRUE' : 'FALSE'
    })

    storeToDb(db, dynamicDefinition, fixedData)
  })

  return Promise.all(promises)
}

function storeToDb (db: DatabaseType, tableDefinition: TableDefinition, data) {
  const schema = Object.keys(tableDefinition.data).map(field => `@${field}`).join(', ')

  const insert = db.prepare(`INSERT INTO ${tableDefinition.name} VALUES (${schema})`)

  for (const row of data) {
    const normalizedRow = { ...tableDefinition.data, ...row }
    insert.run(normalizedRow)
  }
}

function createTable (db: DatabaseType, tableDefinition: TableDefinition) {
  const query = `CREATE TABLE ${tableDefinition.name} (${Object.keys(tableDefinition.data)})`

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
    delete headers['content-length']

    await populateTables(db, usedTables, {
      ...headers,
      host: getHost(),
      'user-agent': 'tentaclesql/0.1.5' // FIXME: Read it from package.json
    })
  }

  const stmt = db.prepare(sql)

  return stmt.all(parameters)
}

export default queryTables

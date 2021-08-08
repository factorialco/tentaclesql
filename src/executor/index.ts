import fetch from 'node-fetch'
import { version } from '../../package.json'

import type { Database as DatabaseType } from 'better-sqlite3'

import { extractTables } from './queryParser'
import { createDatabase } from './database'
import {
  fetchSchema,
  parseSchema,
  getSchemaUrl
} from './schema'
import logger from '../logger'

export type Extension = string

type FieldDefinition = {
  type: string,
  key: string,
}

type TableDefinition = {
  name: string,
  url: string,
  fields: Array<FieldDefinition>
}

type Schema = Array<TableDefinition>
type Parameters = Array<any>

function getHost (): string {
  return (new URL(getSchemaUrl())).hostname
}

function mutateDataframe (df, fn) {
  return df.forEach(row => { Object.keys(row).forEach(k => fn(row, k)) })
}

async function fetchTableData (tableDefinition: TableDefinition, headers) {
  const res = await fetch(tableDefinition.url, { headers })

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
}

async function populateTables (
  db: DatabaseType,
  usedTables: Array<string>,
  headers: any,
  schema: any
) {
  const filteredTableDefinition = schema.filter(tableDefinition => usedTables.includes(tableDefinition.name))

  const promises = filteredTableDefinition.map(async (tableDefinition) => {
    createTable(db, tableDefinition)

    const data = await fetchTableData(tableDefinition, headers)

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

function createTable (db: DatabaseType, tableDefinition: TableDefinition) {
  const schemas = parseSchema(tableDefinition).join(', ')
  const query = `CREATE TABLE ${tableDefinition.name} (${schemas})`

  db.prepare(query).run()
}

const DEFAULT_CONFIG = {
  extensions: [],
  schema: []
}

async function executor (
  sql: string,
  parameters: Parameters,
  headers: any,
  config: {
    extensions: Array<Extension>,
    schema: Array<TableDefinition>
  } = DEFAULT_CONFIG
) {
  logger.info({
    sql: sql,
    parameters: parameters,
    headers: headers
  })

  const db = createDatabase(config.extensions)

  const usedTables = extractTables(sql)
  if (usedTables.length > 0) {
    delete headers['content-length']
    const schema: Schema = await fetchSchema(headers, config.schema)

    await populateTables(
      db,
      usedTables, {
        ...headers,
        host: getHost(),
        'user-agent': `tentaclesql/${version}`
      },
      schema
    )
  }

  const stmt = db.prepare(sql)

  return stmt.all(parameters)
}

export default executor

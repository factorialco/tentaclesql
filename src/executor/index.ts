import fetch from 'node-fetch'
import { version } from '../../package.json'

import { extractTables, parseSql } from './queryParser'
import Database from './database/better-sqlite-adapter'
import IDatabaseAdapter from './database/IDatabaseAdapter'
import flattenObject from './utils/flattenObject'
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
  autodiscover?: boolean,
  resultKey?: string,
  fields: Array<FieldDefinition>
}

type Schema = Array<TableDefinition>
type Parameters = Array<any>

function getHost (): string | null {
  const schemaUrl = getSchemaUrl()

  if (!schemaUrl) {
    return null
  }

  return (new URL(schemaUrl)).hostname
}

function mutateDataframe (
  df: Array<any>,
  fn: (row: any, k: any) => void
) {
  return df.forEach(row => { Object.keys(row).forEach(k => fn(row, k)) })
}

async function fetchTableData (
  tableDefinition: TableDefinition,
  headers: any,
  queryAst: any,
  method: 'POST' | 'GET' = 'POST'
) {
  const res = await fetch(tableDefinition.url, {
    headers: headers,
    method: method,
    body: JSON.stringify({
      query_ast: queryAst
    })
  }
  )

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
}

async function populateTables (
  db: IDatabaseAdapter,
  usedTables: Array<string>,
  headers: any,
  schema: any,
  queryAst: any
) {
  const filteredTableDefinition = schema.filter((
    tableDefinition: TableDefinition
  ) => usedTables.includes(tableDefinition.name))

  const promises = filteredTableDefinition.map(async (tableDefinition: TableDefinition) => {
    const schemas = parseSchema(tableDefinition.fields).join(', ')

    if (!tableDefinition.autodiscover) {
      db.createTable(tableDefinition, schemas)
    }

    const data = await fetchTableData(tableDefinition, headers, queryAst)

    const resultKey = tableDefinition.resultKey
    const dataPointer = resultKey ? data[resultKey] : data
    const fixedData = dataPointer.map((field: any) => flattenObject(field, '_'))

    if (fixedData.length === 0) return

    // No support for booleans :/
    mutateDataframe(fixedData, (row, k) => {
      if (typeof row[k] === 'boolean') row[k] = row[k] ? 'TRUE' : 'FALSE'
    })

    if (tableDefinition.autodiscover) {
      const dynamicDefinition = {
        name: tableDefinition.name,
        fields: Object.keys(fixedData[0]).map((key) => ({ key: key }))
      }

      db.createTable(dynamicDefinition, schemas)
      db.storeToDb(dynamicDefinition, fixedData)
    } else {
      db.storeToDb(tableDefinition, fixedData)
    }
  })

  return Promise.all(promises)
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
  } = DEFAULT_CONFIG,
  database?: IDatabaseAdapter
) {
  logger.info({
    sql: sql,
    parameters: parameters,
    headers: headers
  })

  const db: IDatabaseAdapter = database || new Database(config.extensions)
  if (!database) {
    await db.init()
  }

  const ast = parseSql(sql)
  const usedTables = extractTables(ast)

  if (usedTables.length > 0) {
    delete headers['content-length']

    const schema: Schema = await fetchSchema(headers, config.schema)

    const headersWithHost = getHost() ? { ...headers, host: getHost() } : { ...headers }
    headersWithHost['user-agent'] = `tentaclesql/${version}`

    await populateTables(
      db,
      usedTables,
      headers,
      schema,
      ast
    )
  }

  return db.runQuery(sql, parameters)
}

export default executor

import fetch from 'node-fetch'
import YAML from 'yaml'
import { readFileSync } from 'fs'
import path from 'path'

type FieldDefinition = {
  type: string,
  key: string,
}

type TableDefinition = {
  name: string,
  url: string,
  fields: Array<FieldDefinition>
}

export async function fetchSchema (
  headers: any,
  schema: any
) {
  if (schema?.length > 0) {
    return schema
  }

  const schemaFile = getSchemaFile()

  if (schemaFile) {
    const filePath = path.join(__dirname, '..', '..', '..', 'schemas', schemaFile)
    const file = readFileSync(filePath, 'utf8')
    const res = YAML.parse(file)

    return res.tables
  }

  const schemaUrl = getSchemaUrl()

  if (schemaUrl) {
    const res = await fetch(schemaUrl, { headers })

    if (!res.ok) {
      return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
    }

    return res.json()
  }
}

const TYPES: any = { // Perdona Pau ;)
  bigint: 'BIGINT',
  date: 'DATE',
  number: 'INTEGER',
  integer: 'INTEGER',
  string: 'TEXT',
  text: 'TEXT',
  boolean: 'BOOLEAN'
}

export function parseSchema (fields: Array<FieldDefinition>): Array<string> {
  return fields.map(field => {
    const type = TYPES[field.type]

    if (!type) return `${field.key}`

    return `${field.key} ${type}`
  })
}

export function getSchemaUrl (): string | undefined {
  return process.env.SCHEMA_URL
}

export function getSchemaFile (): string | undefined {
  return process.env.SCHEMA_FILE
}

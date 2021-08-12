import fetch from 'node-fetch'

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

  const res = await fetch(getSchemaUrl(), { headers })

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
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

export function parseSchema (tableDefinition: TableDefinition): Array<string> {
  return tableDefinition.fields.map(field => {
    const type = TYPES[field.type]

    if (!type) throw new Error(`Invalid field type ${field.type}`)

    return `${field.key} ${type}`
  })
}

export function getSchemaUrl (): string {
  if (!process.env.SCHEMA_URL) {
    throw new Error('SCHEMA_URL environment variable is mandatory')
  }

  return process.env.SCHEMA_URL
}

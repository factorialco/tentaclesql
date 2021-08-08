import sqliteParser from 'sqlite-parser'

export function traverse (o: any, fn: (obj: any, prop: string, value: any) => void) {
  for (const i in o) {
    fn.apply(this, [o, i, o[i]])
    if (o[i] !== null && typeof (o[i]) === 'object') {
      traverse(o[i], fn)
    }
  }
}

function validateQuery (ast: any) {
  if (ast.type !== 'statement' || ast.variant !== 'list') throw new Error('Malformed query')
  if (ast.statement.length > 1) throw new Error('Only one statement is supported')
  if (!['select', 'compound'].includes(ast.statement[0].variant)) throw new Error('Only SELECT queries are supported')
}

function parse (sql: string) {
  return sqliteParser(sql)
}

export function extractTables (sql: string) {
  const ast = parse(sql)

  validateQuery(ast)

  const tables: Array<string> = []
  traverse(ast, (obj) => {
    if (obj.variant === 'table') {
      tables.push(obj.name)
    }
  })

  return [...new Set(tables)]
}

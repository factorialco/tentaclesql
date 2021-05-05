export function traverse (o: any, fn: (obj: any, prop: string, value: any) => void) {
  for (const i in o) {
    fn.apply(this, [o, i, o[i]])
    if (o[i] !== null && typeof (o[i]) === 'object') {
      traverse(o[i], fn)
    }
  }
}

function extractTables (ast) {
  const tables: Array<string> = []
  traverse(ast, (obj) => {
    if (obj.variant === 'table') {
      tables.push(obj.name)
    }
  })

  return [...new Set(tables)]
}

export default extractTables

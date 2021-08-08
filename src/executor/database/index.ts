import logger from '../../logger'
import Database from 'better-sqlite3'
import path from 'path'
import type { Database as DatabaseType } from 'better-sqlite3'

type Extension = string

const EXTENSIONS = {
  crypto: 'crypto',
  json1: 'json1',
  math: 'math',
  re: 're',
  stats: 'stats',
  text: 'text',
  unicode: 'unicode',
  vsv: 'vsv'
}

function loadExtensions (
  db: DatabaseType,
  extensions: Array<Extension>
) {
  // https://github.com/nalgeon/sqlean
  const extensionBase = path.join(__dirname, '/sqlite_extensions/')

  extensions.forEach(extension => {
    if (!EXTENSIONS[extension]) {
      throw Error(`${extension} extension not found!`)
    }

    db.loadExtension(path.join(extensionBase, EXTENSIONS[extension]))
  })
}

export function createDatabase (extensions: Array<Extension>) {
  // Empty name = temporary
  const db = new Database('', { verbose: (message) => { logger.debug(message) } })
  loadExtensions(db, extensions)

  return db
}

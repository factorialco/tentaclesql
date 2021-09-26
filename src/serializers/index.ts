import Table from 'cli-table'

export const table = (results: any) => {
  const vertical = Object.keys(results[0]).length > 4

  const table = vertical ? new Table() : new Table({ head: Object.keys(results[0]) })

  results.forEach((result: any) => {
    if (vertical) {
      table.push({ '': '' })
      Object.keys(result).forEach((key) => {
        const res: any = {}
        res[key] = result[key] || ''
        table.push(res)
      })
    } else {
      const values = Object.values(result).map(value => !value ? '' : value)
      table.push(values)
    }
  })

  console.log(table.toString())

  return table.toString()
}

export const json = (results: any) => {
  console.log(results)

  return results
}

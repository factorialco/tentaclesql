export default async function fetchTableData (
  tableDefinition: any,
  headers: any,
  queryAst: any
) {
  const fetchConfig: any = {
    headers: headers,
    method: tableDefinition.astPassthrough ? 'POST' : 'GET'
  }

  if (tableDefinition.astPassthrough) {
    fetchConfig.body = JSON.stringify({
      query_ast: queryAst
    })
  }

  const res = await fetch(tableDefinition.url, fetchConfig)

  if (!res.ok) {
    return Promise.reject(new Error(`Error with the request. Status code: ${res.status}`))
  }

  return res.json()
}


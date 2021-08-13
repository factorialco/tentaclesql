export default interface IDatabaseAdapter {
  storeToDb: (
    tableDefinition: any,
    data: Array<any>
  ) => void,
  createTable: (
    tableDefinition: any,
    schemas: any
  ) => void,
  runQuery (
    sql: string,
    parameters: Array<any>
  ) : Array<any>
}

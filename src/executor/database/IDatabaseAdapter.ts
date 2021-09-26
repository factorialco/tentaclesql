export default interface IDatabaseAdapter {
  init: () => Promise<void>,
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
  ) : Promise<Array<any>>
}

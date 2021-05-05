import fetch from 'node-fetch'
import queryTables from './queryTables'

jest.mock('node-fetch')

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

beforeEach(() => {
  process.env = Object.assign(process.env, {
    API_DOMAIN: 'https://api.example.com'
  })
})

const schemaBody = [
  {
    name: 'employee',
    fields: [
      { type: 'number', key: 'id' },
      { type: 'string', key: 'first_name' },
      { type: 'string', key: 'last_name' }
    ]
  },
  {
    name: 'goals_config',
    fields: [
      { type: 'number', key: 'id' },
      { type: 'string', key: 'title' }
    ]
  }
]

const goalsConfigBody = [{ id: '15', title: 'foo' }]
const employeeBody = [{ id: '10', first_name: 'Paco', last_name: 'Merlo' }]
const headers = {
  host: 'api.example.com',
  'user-agent': 'data-lite-engine/1.0.0'
}

test('queryTables', async () => {
  const { Response } = jest.requireActual('node-fetch')

  mockedFetch
    .mockReturnValueOnce(Promise.resolve(new Response(JSON.stringify(schemaBody))))
    .mockReturnValueOnce(Promise.resolve(new Response(JSON.stringify(employeeBody))))
    .mockReturnValueOnce(Promise.resolve(new Response(JSON.stringify(goalsConfigBody))))

  const sql = 'SELECT employee.id + goals_config.id as value FROM goals_config JOIN employee ON (employee.id + ?) == goals_config.id'

  const result = await queryTables(sql, [5], {})

  expect(mockedFetch).toHaveBeenCalledTimes(3)
  expect(mockedFetch).toHaveBeenCalledWith('https://api.example.com/reports/sql/schema', { headers })
  expect(mockedFetch).toHaveBeenCalledWith('https://api.example.com/reports/sql/tables/goals_config', { headers })
  expect(mockedFetch).toHaveBeenCalledWith('https://api.example.com/reports/sql/tables/employee', { headers })
  expect(result).toEqual([{ value: 25 }])
})

test('queryTables / syntax error', async () => {
  const sql = 'SEL FOO BAR'

  await expect(() => queryTables(sql, [], {})).rejects.toThrow(/Syntax error/)
})

test('queryTables / multiple select', async () => {
  const sql = 'SELECT 1+1;SELECT 1+1;'

  await expect(() => queryTables(sql, [], {})).rejects.toThrow(/Only one statement/)
})

test('queryTables / no select', async () => {
  const sql = 'UPDATE employee SET name="foo"'

  await expect(() => queryTables(sql, [], {})).rejects.toThrow(/Only SELECT/)
})

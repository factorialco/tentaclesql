import fetch from 'node-fetch'
import executor from './index'
import { version } from '../../package.json'
import { parseSql } from './queryParser'

jest.mock('node-fetch')

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

beforeEach(() => {
  process.env = Object.assign(process.env, {
    SCHEMA_URL: 'https://api.example.com/schema'
  })
})

const schemaBody = [
  {
    name: 'employees',
    url: 'https://api.example.com/tables/employees',
    astPassthrough: true,
    fields: [
      { type: 'number', key: 'id' },
      { type: 'string', key: 'first_name' },
      { type: 'string', key: 'last_name' }
    ]
  },
  {
    name: 'goal_configs',
    url: 'https://api.example.com/tables/goal_configs',
    astPassthrough: true,
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
  'user-agent': `tentaclesql/${version}`
}

test('executor', async () => {
  const { Response } = jest.requireActual('node-fetch')

  mockedFetch
    .mockReturnValueOnce(
      Promise.resolve(new Response(JSON.stringify(schemaBody)))
    )
    .mockReturnValueOnce(
      Promise.resolve(new Response(JSON.stringify(employeeBody)))
    )
    .mockReturnValueOnce(
      Promise.resolve(new Response(JSON.stringify(goalsConfigBody)))
    )

  const sql = 'SELECT employees.id + goal_configs.id as value FROM goal_configs JOIN employees ON (employees.id + ?) == goal_configs.id'

  const result = await executor(sql, [5], headers)
  const body = JSON.stringify(
    { query_ast: parseSql(sql) }
  )

  expect(mockedFetch).toHaveBeenCalledTimes(3)
  expect(mockedFetch).toHaveBeenCalledWith('https://api.example.com/schema', { headers })
  expect(mockedFetch).toHaveBeenCalledWith('https://api.example.com/tables/goal_configs', { headers: headers, method: 'POST', body: body })
  expect(mockedFetch).toHaveBeenCalledWith('https://api.example.com/tables/employees', { headers: headers, method: 'POST', body: body })
  expect(result).toEqual([{ value: 25 }])
})

test('executor / syntax error', async () => {
  const sql = 'SEL FOO BAR'

  await expect(() => executor(sql, [], {})).rejects.toThrow(/Syntax error/)
})

test('executor / multiple select', async () => {
  const sql = 'SELECT 1+1;SELECT 1+1;'

  await expect(() => executor(sql, [], {})).rejects.toThrow(/Only one statement/)
})

test('executor / no select', async () => {
  const sql = 'UPDATE employees SET name="foo"'

  await expect(() => executor(sql, [], {})).rejects.toThrow(/Only SELECT/)
})

test('executor / multiple select on a union', async () => {
  const sql = 'SELECT 1+1 as value UNION SELECT 1+2 as value;'

  const result = await executor(sql, [], {})

  expect(result).toEqual([{ value: 2 }, { value: 3 }])
})

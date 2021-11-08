import build from './index'
import fetch from 'node-fetch'

jest.mock('node-fetch')
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>

describe('server', () => {
  let app: any
  beforeAll(() => {
    app = build()
    process.env = Object.assign(process.env, {
      SCHEMA_URL: 'https://api.example.com/schema'
    })
  })

  describe('GET /health-check', () => {
    it('answers 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health-check'
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('POST /', () => {
    it('accepts SQL queries', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/',
        body: {
          query: 'SELECT 1'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toStrictEqual([{ 1: 1 }])
    })

    it('accepts configuration with queries', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/',
        body: {
          query: 'SELECT json_array(1, 2, 3);',
          config: {
            extensions: [
              'json1'
            ],
            schema: []
          }
        }
      })

      expect(JSON.parse(response.body)).toStrictEqual([
        {
          'json_array(1, 2, 3)': '[1,2,3]'
        }
      ])
      expect(response.statusCode).toBe(200)
    })

    it('proper handles invalid SQL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/',
        body: {
          query: 'SELECasdf',
          config: {
            extensions: [],
            schema: []
          }
        }
      })

      expect(response.statusCode).toBe(422)
    })

    it('accepts manual schema into the same request', async () => {
      const schemaBody = [
        {
          name: 'employees',
          url: 'https://api.example.com/tables/employees',
          fields: [
            { type: 'number', key: 'id' },
            { type: 'string', key: 'first_name' },
            { type: 'string', key: 'last_name' }
          ]
        }
      ]

      const { Response } = jest.requireActual('node-fetch')

      mockedFetch
        .mockReturnValueOnce(Promise.resolve(new Response(JSON.stringify([]))))

      const response = await app.inject({
        method: 'POST',
        url: '/',
        body: {
          query: 'SELECT * FROM employees;',
          config: {
            extensions: [
              'json1'
            ],
            schema: schemaBody
          }
        }
      })

      expect(JSON.parse(response.body)).toStrictEqual([])
      expect(response.statusCode).toBe(200)
    })
  })
})

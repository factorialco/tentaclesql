import build from './index'

describe('server', () => {
  let app: any
  beforeAll(() => {
    app = build()
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
            ]
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
  })
})

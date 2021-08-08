import { build } from './server'

describe('server', () => {
  let app: any
  beforeAll(() => {
    app = build()
  })

  it('answers to healthcheck', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health-check'
    })

    expect(response.statusCode).toBe(200)
  })
})

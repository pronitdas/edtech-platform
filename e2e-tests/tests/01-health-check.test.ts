import { describe, it, expect, beforeAll } from 'vitest'
import { setupTest, teardownTest, TestContext } from '../setup'
import { FRONTEND_URL, BACKEND_URL, checkBackendHealth, checkFrontendHealth } from '../utils/test-helpers'

describe('Health Check Tests', () => {
  let context: TestContext

  beforeAll(async () => {
    context = await setupTest()
  })

  afterAll(async () => {
    await teardownTest(context)
  })

  it('should verify backend is running and healthy', async () => {
    const isHealthy = await checkBackendHealth()
    expect(isHealthy).toBe(true)
  })

  it('should verify frontend is running and accessible', async () => {
    const isHealthy = await checkFrontendHealth()
    expect(isHealthy).toBe(true)
  })

  it('should load frontend application', async () => {
    const { page } = context
    
    await page.goto(FRONTEND_URL)
    await page.waitForSelector('body', { timeout: 10000 })
    
    const title = await page.title()
    expect(title).toBeTruthy()
    
    // Check for React app mounting
    const reactRoot = await page.$('#root')
    expect(reactRoot).toBeTruthy()
  })

  it('should verify API endpoints are accessible', async () => {
    const { page } = context
    
    // Test health endpoint
    const response = await page.evaluate(async (backendUrl) => {
      try {
        const res = await fetch(`${backendUrl}/health`)
        return { status: res.status, ok: res.ok }
      } catch (error) {
        return { error: error.message }
      }
    }, BACKEND_URL)
    
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
  })
})
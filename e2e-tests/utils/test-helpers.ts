import { Page } from 'puppeteer'

export const FRONTEND_URL = 'http://localhost:5173'
export const BACKEND_URL = 'http://localhost:8000'

export interface TestUser {
  email: string
  password: string
  name: string
}

export function generateTestUser(): TestUser {
  const timestamp = Date.now()
  return {
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`
  }
}

export async function waitForElement(page: Page, selector: string, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout })
    return true
  } catch (error) {
    console.error(`Element not found: ${selector}`)
    return false
  }
}

export async function waitForNavigation(page: Page, url?: string, timeout = 10000) {
  try {
    await page.waitForFunction(
      (expectedUrl) => !expectedUrl || window.location.href.includes(expectedUrl),
      { timeout },
      url
    )
    return true
  } catch (error) {
    console.error(`Navigation timeout: ${url}`)
    return false
  }
}

export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [selector, value] of Object.entries(formData)) {
    await page.waitForSelector(selector)
    await page.click(selector)
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.type(selector, value)
  }
}

export async function takeScreenshot(page: Page, name: string) {
  try {
    await page.screenshot({
      path: `./screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    })
  } catch (error) {
    console.log(`Screenshot failed for ${name}:`, error.message)
  }
}

export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function waitForApiResponse(page: Page, urlPattern: string, method = 'GET') {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`API response timeout: ${method} ${urlPattern}`))
    }, 30000)

    page.on('response', async (response) => {
      if (response.url().includes(urlPattern) && response.request().method() === method) {
        clearTimeout(timeout)
        try {
          const data = await response.json()
          resolve({ status: response.status(), data })
        } catch (error) {
          resolve({ status: response.status(), data: null })
        }
      }
    })
  })
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    // Check root endpoint first as it doesn't require auth
    const response = await fetch(`${BACKEND_URL}/`)
    return response.ok
  } catch (error) {
    console.error('Backend health check failed:', error)
    return false
  }
}

export async function checkFrontendHealth(): Promise<boolean> {
  try {
    const response = await fetch(FRONTEND_URL)
    return response.ok
  } catch (error) {
    console.error('Frontend health check failed:', error)
    return false
  }
}
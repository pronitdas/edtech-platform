import { Page } from 'puppeteer'

export const FRONTEND_URL = 'http://localhost:5173'
export const BACKEND_URL = 'http://localhost:8000'

export interface TestUser {
  email: string
  password: string
  name: string
  role?: 'student' | 'teacher' | 'admin'
}

export interface TestFile {
  name: string
  path: string
  type: 'pdf' | 'txt' | 'docx' | 'video'
  size: number
}

export function generateTestUser(role: 'student' | 'teacher' | 'admin' = 'student'): TestUser {
  const timestamp = Date.now()
  const rolePrefix = role === 'teacher' ? 'teacher' : role === 'admin' ? 'admin' : 'student'
  return {
    email: `${rolePrefix}${timestamp}@example.com`,
    password: 'TestPassword123!',
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${timestamp}`,
    role
  }
}

export function getTestFiles(): TestFile[] {
  return [
    {
      name: 'test-document.txt',
      path: './test-files/test-document.txt',
      type: 'txt',
      size: 1024
    },
    {
      name: 'test-document.pdf',
      path: './test-files/test-document.pdf',
      type: 'pdf',
      size: 2048
    }
  ]
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

export async function smartClick(page: Page, selectors: string[], timeout = 10000) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / selectors.length })
      await page.click(selector)
      return true
    } catch (error) {
      continue
    }
  }
  throw new Error(`None of the selectors found: ${selectors.join(', ')}`)
}

export async function smartFill(page: Page, selectors: string[], value: string, timeout = 10000) {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: timeout / selectors.length })
      await page.focus(selector)
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await page.type(selector, value)
      return true
    } catch (error) {
      continue
    }
  }
  throw new Error(`None of the input selectors found: ${selectors.join(', ')}`)
}

export async function takeScreenshot(page: Page, name: string, fullPage = true) {
  const timestamp = Date.now()
  const filename = `./screenshots/${name}-${timestamp}.png`
  await page.screenshot({ path: filename, fullPage })
  console.log(`Screenshot saved: ${filename}`)
  return filename
}

export async function waitForAnyElement(page: Page, selectors: string[], timeout = 10000) {
  const promises = selectors.map(selector =>
    page.waitForSelector(selector, { timeout }).catch(() => null)
  )

  const results = await Promise.allSettled(promises)
  const foundIndex = results.findIndex(result => result.status === 'fulfilled' && result.value)

  if (foundIndex >= 0) {
    return { found: true, selector: selectors[foundIndex], index: foundIndex }
  }

  return { found: false, selector: null, index: -1 }
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      console.log(`Retry ${i + 1}/${maxRetries} after error:`, error.message)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
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
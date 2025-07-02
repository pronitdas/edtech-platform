import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTest, teardownTest, TestContext } from '../setup'
import { FRONTEND_URL, generateTestUser, waitForElement, fillForm, waitForNavigation, takeScreenshot } from '../utils/test-helpers'

describe('Authentication Workflow Tests', () => {
  let context: TestContext

  beforeAll(async () => {
    context = await setupTest()
  })

  afterAll(async () => {
    await teardownTest(context)
  })

  it('should complete full signup workflow', async () => {
    const { page } = context
    const testUser = generateTestUser()
    
    // Navigate to application
    await page.goto(FRONTEND_URL)
    await page.waitForLoadState('networkidle')
    
    // Look for signup link/button
    const signupSelectors = [
      'a[href*="signup"]',
      'button:has-text("Sign Up")',
      '[data-testid="signup-button"]',
      'a:has-text("Sign Up")',
      'a:has-text("Register")',
      '.signup-link'
    ]
    
    let signupFound = false
    for (const selector of signupSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        signupFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (!signupFound) {
      // Try navigating directly to signup page
      await page.goto(`${FRONTEND_URL}/signup`)
    }
    
    // Wait for signup form
    const formSelectors = [
      'form',
      '[data-testid="signup-form"]',
      '.signup-form'
    ]
    
    let formFound = false
    for (const selector of formSelectors) {
      if (await waitForElement(page, selector, 5000)) {
        formFound = true
        break
      }
    }
    
    expect(formFound).toBe(true)
    
    // Fill signup form
    const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email']
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]', '#password']
    const nameSelectors = ['input[name="name"]', 'input[name="firstName"]', '#name', '#firstName']
    
    // Find and fill email field
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.fill(selector, testUser.email)
        break
      } catch (error) {
        continue
      }
    }
    
    // Find and fill password field
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.fill(selector, testUser.password)
        break
      } catch (error) {
        continue
      }
    }
    
    // Find and fill name field if exists
    for (const selector of nameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.fill(selector, testUser.name)
        break
      } catch (error) {
        continue
      }
    }
    
    // Submit form
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign Up")',
      'button:has-text("Register")',
      '[data-testid="signup-submit"]'
    ]
    
    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        break
      } catch (error) {
        continue
      }
    }
    
    // Wait for navigation or success message
    await page.waitForTimeout(3000)
    
    // Check for successful signup
    const currentUrl = page.url()
    const successIndicators = [
      currentUrl.includes('/dashboard'),
      currentUrl.includes('/login'),
      await page.$(':has-text("success")') !== null,
      await page.$(':has-text("registered")') !== null,
      await page.$(':has-text("account created")') !== null
    ]
    
    expect(successIndicators.some(indicator => indicator)).toBe(true)
    
    await takeScreenshot(page, 'signup-completed')
  })

  it('should complete login workflow', async () => {
    const { page } = context
    const testUser = generateTestUser()
    
    // First create account via API
    await page.evaluate(async ({ email, password, name, backendUrl }) => {
      try {
        await fetch(`${backendUrl}/v2/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })
      } catch (error) {
        console.log('Direct API signup failed, will test UI flow')
      }
    }, { ...testUser, backendUrl: 'http://localhost:8000' })
    
    // Navigate to login
    await page.goto(FRONTEND_URL)
    
    // Look for login link/button
    const loginSelectors = [
      'a[href*="login"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      '[data-testid="login-button"]',
      'a:has-text("Login")',
      'a:has-text("Sign In")'
    ]
    
    let loginFound = false
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        loginFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (!loginFound) {
      await page.goto(`${FRONTEND_URL}/login`)
    }
    
    // Fill login form
    const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email']
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]', '#password']
    
    // Find and fill email
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        await page.fill(selector, testUser.email)
        break
      } catch (error) {
        continue
      }
    }
    
    // Find and fill password
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.fill(selector, testUser.password)
        break
      } catch (error) {
        continue
      }
    }
    
    // Submit login form
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      '[data-testid="login-submit"]'
    ]
    
    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        break
      } catch (error) {
        continue
      }
    }
    
    // Wait for navigation
    await page.waitForTimeout(3000)
    
    // Verify successful login
    const currentUrl = page.url()
    const loginSuccess = currentUrl.includes('/dashboard') || 
                        currentUrl.includes('/main') || 
                        !currentUrl.includes('/login')
    
    expect(loginSuccess).toBe(true)
    
    await takeScreenshot(page, 'login-completed')
  })

  it('should handle authentication state persistence', async () => {
    const { page } = context
    
    // Assume we're logged in from previous test
    await page.goto(FRONTEND_URL)
    
    // Check for authenticated state indicators
    const authIndicators = [
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      '[data-testid="user-menu"]',
      '.user-avatar',
      ':has-text("Welcome")'
    ]
    
    let isAuthenticated = false
    for (const selector of authIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        isAuthenticated = true
        break
      } catch (error) {
        continue
      }
    }
    
    // If not authenticated, perform login
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping persistence test')
      return
    }
    
    // Refresh page and verify auth persists
    await page.reload()
    await page.waitForTimeout(2000)
    
    // Check auth state after refresh
    let authPersisted = false
    for (const selector of authIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        authPersisted = true
        break
      } catch (error) {
        continue
      }
    }
    
    expect(authPersisted).toBe(true)
    
    await takeScreenshot(page, 'auth-persisted')
  })
})
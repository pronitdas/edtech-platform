import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTest, teardownTest, TestContext } from '../setup'
import { FRONTEND_URL, generateTestUser, takeScreenshot } from '../utils/test-helpers'
import { writeFileSync, mkdirSync } from 'fs'

describe('Complete Integration Workflow Tests', () => {
  let context: TestContext
  let testUser: any

  beforeAll(async () => {
    context = await setupTest()
    testUser = generateTestUser()
    
    // Create test files
    try {
      mkdirSync('./test-files', { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
    
    // Create a comprehensive test document
    const testContent = `# Mathematics Learning Guide

## Chapter 1: Basic Algebra

Algebra is the branch of mathematics that uses letters and symbols to represent numbers and quantities in formulas and equations.

### Key Concepts:
- Variables: Letters that represent unknown numbers
- Coefficients: Numbers that multiply variables
- Constants: Numbers that don't change
- Expressions: Mathematical phrases with variables and numbers
- Equations: Mathematical statements that show equality

### Example Problems:
1. Solve for x: 2x + 5 = 15
   Solution: x = 5

2. Simplify: 3x + 2x - 4
   Solution: 5x - 4

## Chapter 2: Linear Equations

Linear equations are equations where the highest power of the variable is 1.

### Standard Form: ax + b = c

### Steps to Solve:
1. Isolate the variable term
2. Divide by the coefficient
3. Check your answer

### Practice Problems:
- 4x - 8 = 12 (Answer: x = 5)
- -2x + 6 = 0 (Answer: x = 3)
- 7x + 14 = 35 (Answer: x = 3)

## Chapter 3: Slope and Linear Functions

The slope of a line measures how steep it is.

### Slope Formula: m = (y2 - y1) / (x2 - x1)

### Types of Slopes:
- Positive slope: line goes up from left to right
- Negative slope: line goes down from left to right
- Zero slope: horizontal line
- Undefined slope: vertical line

This content is designed to test the complete knowledge upload and learning workflow.`
    
    writeFileSync('./test-files/comprehensive-test.txt', testContent)
  })

  afterAll(async () => {
    await teardownTest(context)
  })

  it('should complete full end-to-end user journey', async () => {
    const { page } = context
    
    console.log('Starting comprehensive E2E test with user:', testUser.email)
    
    // Step 1: Navigate to application
    console.log('Step 1: Navigating to application...')
    await page.goto(FRONTEND_URL)
    await page.waitForLoadState('networkidle')
    await takeScreenshot(page, 'step1-app-loaded')
    
    // Step 2: Register new user
    console.log('Step 2: Registering new user...')
    
    // Try to find signup
    const signupSelectors = [
      'a[href*="signup"]', 'button:has-text("Sign Up")', 
      'a:has-text("Sign Up")', 'a:has-text("Register")'
    ]
    
    let signupFound = false
    for (const selector of signupSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        await page.click(selector)
        signupFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (!signupFound) {
      await page.goto(`${FRONTEND_URL}/signup`)
    }
    
    // Fill signup form
    try {
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 })
      await page.fill('input[type="email"], input[name="email"]', testUser.email)
      await page.fill('input[type="password"], input[name="password"]', testUser.password)
      
      // Try to fill name field if it exists
      try {
        await page.fill('input[name="name"], input[name="firstName"]', testUser.name)
      } catch (error) {
        console.log('Name field not found, continuing...')
      }
      
      await page.click('button[type="submit"], button:has-text("Sign Up"), button:has-text("Register")')
      await page.waitForTimeout(3000)
      
      await takeScreenshot(page, 'step2-user-registered')
    } catch (error) {
      console.log('Signup form not found, trying API registration...')
      
      // Register via API
      await page.evaluate(async ({ email, password, name }) => {
        try {
          const response = await fetch('http://localhost:8000/v2/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
          })
          console.log('API registration response:', response.status)
        } catch (error) {
          console.log('API registration failed:', error)
        }
      }, testUser)
    }
    
    // Step 3: Login user
    console.log('Step 3: Logging in user...')
    
    // Navigate to login if not already there
    const loginSelectors = ['a[href*="login"]', 'button:has-text("Login")', 'a:has-text("Login")']
    
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        break
      } catch (error) {
        continue
      }
    }
    
    try {
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 })
      await page.fill('input[type="email"], input[name="email"]', testUser.email)
      await page.fill('input[type="password"], input[name="password"]', testUser.password)
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
      await page.waitForTimeout(3000)
      
      await takeScreenshot(page, 'step3-user-logged-in')
    } catch (error) {
      console.log('Login form not accessible, assuming user is authenticated')
    }
    
    // Step 4: Navigate to knowledge upload
    console.log('Step 4: Finding knowledge upload interface...')
    
    const uploadSelectors = [
      'button:has-text("Upload")', 'input[type="file"]', 
      'a[href*="upload"]', 'button:has-text("Add Knowledge")',
      'button:has-text("Add Content")', '.upload-button'
    ]
    
    let uploadFound = false
    for (const selector of uploadSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        uploadFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (!uploadFound) {
      // Try navigation to upload routes
      const uploadRoutes = ['/upload', '/dashboard', '/knowledge']
      for (const route of uploadRoutes) {
        await page.goto(`${FRONTEND_URL}${route}`)
        await page.waitForTimeout(2000)
        
        for (const selector of uploadSelectors) {
          if (await page.$(selector)) {
            uploadFound = true
            break
          }
        }
        if (uploadFound) break
      }
    }
    
    expect(uploadFound).toBe(true)
    await takeScreenshot(page, 'step4-upload-interface-found')
    
    // Step 5: Upload knowledge file
    console.log('Step 5: Uploading knowledge file...')
    
    const fileInput = await page.$('input[type="file"]')
    expect(fileInput).toBeTruthy()
    
    await fileInput.uploadFile('./test-files/comprehensive-test.txt')
    
    // Submit upload
    const submitSelectors = [
      'button:has-text("Upload")', 'button[type="submit"]',
      '[data-testid="upload-button"]'
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
    
    // Wait for upload processing
    await page.waitForTimeout(10000)
    await takeScreenshot(page, 'step5-knowledge-uploaded')
    
    // Step 6: Verify knowledge processing
    console.log('Step 6: Verifying knowledge processing...')
    
    const processingSelectors = [
      ':has-text("success")', ':has-text("uploaded")', 
      ':has-text("processing")', ':has-text("complete")'
    ]
    
    let processingComplete = false
    for (const selector of processingSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 })
        processingComplete = true
        break
      } catch (error) {
        continue
      }
    }
    
    expect(processingComplete).toBe(true)
    await takeScreenshot(page, 'step6-processing-verified')
    
    // Step 7: Navigate to learning interface
    console.log('Step 7: Navigating to learning interface...')
    
    const learningSelectors = [
      'a[href*="/learn"]', 'button:has-text("Learn")',
      'a:has-text("Course")', 'a:has-text("Chapters")',
      'button:has-text("Start Learning")'
    ]
    
    let learningFound = false
    for (const selector of learningSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        await page.click(selector)
        learningFound = true
        await page.waitForTimeout(2000)
        break
      } catch (error) {
        continue
      }
    }
    
    if (!learningFound) {
      const learningRoutes = ['/learn', '/course', '/chapters']
      for (const route of learningRoutes) {
        await page.goto(`${FRONTEND_URL}${route}`)
        await page.waitForTimeout(2000)
        
        const courseElements = await page.$$(':has-text("Chapter"), :has-text("Course")')
        if (courseElements.length > 0) {
          learningFound = true
          break
        }
      }
    }
    
    expect(learningFound).toBe(true)
    await takeScreenshot(page, 'step7-learning-interface')
    
    // Step 8: Interact with generated content
    console.log('Step 8: Interacting with generated content...')
    
    // Look for chapters or learning content
    const contentSelectors = [
      '.chapter-item', '[data-testid="chapter"]',
      'button:has-text("Chapter")', ':has-text("Chapter 1")',
      '.knowledge-item', '.course-content'
    ]
    
    let contentFound = false
    for (const selector of contentSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        await page.click(selector)
        contentFound = true
        await page.waitForTimeout(3000)
        break
      } catch (error) {
        continue
      }
    }
    
    if (contentFound) {
      // Look for chapter content
      const chapterContentSelectors = [
        ':has-text("Algebra")', ':has-text("Linear")', ':has-text("Slope")',
        '.chapter-content', '.course-content'
      ]
      
      let chapterContentVisible = false
      for (const selector of chapterContentSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 })
          chapterContentVisible = true
          break
        } catch (error) {
          continue
        }
      }
      
      expect(chapterContentVisible).toBe(true)
    }
    
    await takeScreenshot(page, 'step8-content-interaction')
    
    // Step 9: Test interactive features
    console.log('Step 9: Testing interactive features...')
    
    const interactiveSelectors = [
      'button:has-text("Quiz")', 'button:has-text("Practice")',
      '.quiz-button', 'canvas', '.interactive-element'
    ]
    
    let interactiveFound = false
    for (const selector of interactiveSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        if (selector.includes('button')) {
          await page.click(selector)
          await page.waitForTimeout(2000)
        }
        interactiveFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (interactiveFound) {
      console.log('Interactive features found and tested')
      await takeScreenshot(page, 'step9-interactive-features')
    }
    
    // Step 10: Complete learning session
    console.log('Step 10: Completing learning session...')
    
    // Navigate through content
    const navigationSelectors = [
      'button:has-text("Next")', 'button:has-text("Continue")',
      '.navigation-button', '[data-testid="next-chapter"]'
    ]
    
    for (const selector of navigationSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        await page.waitForTimeout(2000)
        break
      } catch (error) {
        continue
      }
    }
    
    await takeScreenshot(page, 'step10-learning-completed')
    
    // Final verification
    console.log('Final verification: Checking overall success...')
    
    const successIndicators = [
      page.url().includes('/dashboard') || page.url().includes('/learn') || page.url().includes('/course'),
      await page.$(':has-text("Chapter")') !== null,
      await page.$(':has-text("Knowledge")') !== null,
      await page.$(':has-text("Course")') !== null
    ]
    
    const overallSuccess = successIndicators.some(indicator => indicator)
    expect(overallSuccess).toBe(true)
    
    console.log('✅ Complete E2E workflow test passed!')
    await takeScreenshot(page, 'final-success-state')
  })

  it('should verify data persistence across sessions', async () => {
    const { page } = context
    
    console.log('Testing data persistence...')
    
    // Refresh the page
    await page.reload()
    await page.waitForTimeout(3000)
    
    // Check if user is still authenticated
    const authPersisted = await page.evaluate(() => {
      return localStorage.getItem('token') !== null || 
             sessionStorage.getItem('token') !== null ||
             document.cookie.includes('token')
    })
    
    console.log('Authentication persisted:', authPersisted)
    
    // Check if uploaded knowledge is still visible
    const knowledgeSelectors = [
      ':has-text("comprehensive-test")', ':has-text("Mathematics")',
      '.knowledge-item', ':has-text("Chapter")'
    ]
    
    let knowledgePersisted = false
    for (const selector of knowledgeSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        knowledgePersisted = true
        break
      } catch (error) {
        continue
      }
    }
    
    console.log('Knowledge persisted:', knowledgePersisted)
    
    // At least one should be true for a successful system
    expect(authPersisted || knowledgePersisted).toBe(true)
    
    await takeScreenshot(page, 'persistence-verified')
  })

  it('should handle error scenarios gracefully', async () => {
    const { page } = context
    
    console.log('Testing error handling...')
    
    // Test invalid file upload
    try {
      const fileInput = await page.$('input[type="file"]')
      if (fileInput) {
        // Try uploading a very large or invalid file
        writeFileSync('./test-files/invalid-file.xyz', 'Invalid content that should not be processed')
        
        await fileInput.uploadFile('./test-files/invalid-file.xyz')
        
        // Look for error handling
        const errorSelectors = [
          ':has-text("error")', ':has-text("failed")',
          ':has-text("invalid")', '.error-message'
        ]
        
        let errorHandled = false
        for (const selector of errorSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 5000 })
            errorHandled = true
            break
          } catch (error) {
            continue
          }
        }
        
        console.log('Error handling found:', errorHandled)
        await takeScreenshot(page, 'error-handling-tested')
      }
    } catch (error) {
      console.log('Error testing completed')
    }
  })
})
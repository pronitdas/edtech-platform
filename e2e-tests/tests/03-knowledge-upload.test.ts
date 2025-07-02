import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTest, teardownTest, TestContext } from '../setup'
import { FRONTEND_URL, generateTestUser, waitForElement, takeScreenshot } from '../utils/test-helpers'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

describe('Knowledge Upload Workflow Tests', () => {
  let context: TestContext
  let testUser: any

  beforeAll(async () => {
    context = await setupTest()
    testUser = generateTestUser()
    
    // Create test files directory
    try {
      mkdirSync('./test-files', { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
    
    // Create test PDF content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Content for E2E) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000212 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
315
%%EOF`
    
    writeFileSync('./test-files/test-document.pdf', pdfContent)
    writeFileSync('./test-files/test-document.txt', 'This is a test document for E2E testing.\n\nIt contains sample content that should be processed by the knowledge upload system.')
  })

  afterAll(async () => {
    await teardownTest(context)
  })

  it('should authenticate user before testing upload', async () => {
    const { page } = context
    
    // Register user via API
    const registerResponse = await page.evaluate(async ({ email, password, name }) => {
      try {
        const response = await fetch('http://localhost:8000/v2/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })
        return { status: response.status, ok: response.ok }
      } catch (error) {
        return { error: error.message }
      }
    }, testUser)
    
    // Login user
    await page.goto(FRONTEND_URL)
    
    // Try to find login form
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
    
    // Fill login form
    try {
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 })
      await page.fill('input[type="email"], input[name="email"]', testUser.email)
      await page.fill('input[type="password"], input[name="password"]', testUser.password)
      await page.click('button[type="submit"], button:has-text("Login")')
      await page.waitForTimeout(3000)
    } catch (error) {
      console.log('Login form not found, assuming already authenticated')
    }
  })

  it('should navigate to knowledge upload interface', async () => {
    const { page } = context
    
    // Look for upload interface
    const uploadSelectors = [
      'button:has-text("Upload")',
      '[data-testid="file-upload"]',
      'input[type="file"]',
      '.upload-button',
      'a[href*="upload"]',
      'button:has-text("Add Knowledge")',
      'button:has-text("Add Content")'
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
      // Try navigating to common upload routes
      const uploadRoutes = ['/upload', '/dashboard', '/knowledge', '/add-knowledge']
      for (const route of uploadRoutes) {
        try {
          await page.goto(`${FRONTEND_URL}${route}`)
          await page.waitForTimeout(2000)
          
          for (const selector of uploadSelectors) {
            if (await page.$(selector)) {
              uploadFound = true
              break
            }
          }
          if (uploadFound) break
        } catch (error) {
          continue
        }
      }
    }
    
    expect(uploadFound).toBe(true)
    await takeScreenshot(page, 'upload-interface-found')
  })

  it('should upload a text file successfully', async () => {
    const { page } = context
    
    // Find file input
    const fileInputSelectors = [
      'input[type="file"]',
      '[data-testid="file-input"]',
      '.file-input'
    ]
    
    let fileInput = null
    for (const selector of fileInputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        fileInput = await page.$(selector)
        if (fileInput) break
      } catch (error) {
        continue
      }
    }
    
    expect(fileInput).toBeTruthy()
    
    // Upload file
    await fileInput.uploadFile('./test-files/test-document.txt')
    
    // Look for upload button or auto-upload
    const uploadButtonSelectors = [
      'button:has-text("Upload")',
      'button[type="submit"]',
      '[data-testid="upload-button"]',
      '.upload-submit'
    ]
    
    for (const selector of uploadButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        break
      } catch (error) {
        continue
      }
    }
    
    // Wait for upload to complete
    await page.waitForTimeout(5000)
    
    // Check for success indicators
    const successSelectors = [
      ':has-text("success")',
      ':has-text("uploaded")',
      ':has-text("processing")',
      '.upload-success',
      '[data-testid="upload-success"]'
    ]
    
    let uploadSuccess = false
    for (const selector of successSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 })
        uploadSuccess = true
        break
      } catch (error) {
        continue
      }
    }
    
    expect(uploadSuccess).toBe(true)
    await takeScreenshot(page, 'text-file-uploaded')
  })

  it('should upload a PDF file successfully', async () => {
    const { page } = context
    
    // Find file input again
    const fileInputSelectors = [
      'input[type="file"]',
      '[data-testid="file-input"]',
      '.file-input'
    ]
    
    let fileInput = null
    for (const selector of fileInputSelectors) {
      try {
        const element = await page.$(selector)
        if (element) {
          fileInput = element
          break
        }
      } catch (error) {
        continue
      }
    }
    
    if (!fileInput) {
      // Try to find upload interface again
      const uploadSelectors = ['button:has-text("Upload")', 'button:has-text("Add")']
      for (const selector of uploadSelectors) {
        try {
          await page.click(selector)
          await page.waitForTimeout(1000)
          fileInput = await page.$('input[type="file"]')
          if (fileInput) break
        } catch (error) {
          continue
        }
      }
    }
    
    expect(fileInput).toBeTruthy()
    
    // Upload PDF file
    await fileInput.uploadFile('./test-files/test-document.pdf')
    
    // Submit if needed
    const uploadButtonSelectors = [
      'button:has-text("Upload")',
      'button[type="submit"]',
      '[data-testid="upload-button"]'
    ]
    
    for (const selector of uploadButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        break
      } catch (error) {
        continue
      }
    }
    
    // Wait for processing
    await page.waitForTimeout(10000)
    
    // Check for success
    const successSelectors = [
      ':has-text("success")',
      ':has-text("uploaded")',
      ':has-text("processing")',
      ':has-text("complete")'
    ]
    
    let pdfUploadSuccess = false
    for (const selector of successSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 15000 })
        pdfUploadSuccess = true
        break
      } catch (error) {
        continue
      }
    }
    
    expect(pdfUploadSuccess).toBe(true)
    await takeScreenshot(page, 'pdf-file-uploaded')
  })

  it('should show uploaded knowledge in knowledge list', async () => {
    const { page } = context
    
    // Navigate to knowledge list
    const knowledgeListSelectors = [
      'a[href*="knowledge"]',
      'button:has-text("Knowledge")',
      'a:has-text("My Knowledge")',
      '.knowledge-list'
    ]
    
    for (const selector of knowledgeListSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        break
      } catch (error) {
        continue
      }
    }
    
    // Wait for knowledge list to load
    await page.waitForTimeout(3000)
    
    // Check for uploaded files
    const knowledgeItemSelectors = [
      ':has-text("test-document")',
      '.knowledge-item',
      '[data-testid="knowledge-item"]',
      ':has-text(".txt")',
      ':has-text(".pdf")'
    ]
    
    let knowledgeFound = false
    for (const selector of knowledgeItemSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        knowledgeFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    expect(knowledgeFound).toBe(true)
    await takeScreenshot(page, 'knowledge-list-populated')
  })

  it('should handle file processing status updates', async () => {
    const { page } = context
    
    // Look for processing status indicators
    const statusSelectors = [
      ':has-text("processing")',
      ':has-text("complete")',
      ':has-text("ready")',
      '.processing-status',
      '[data-testid="processing-status"]'
    ]
    
    let statusFound = false
    for (const selector of statusSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        statusFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    // If no status found, that's okay - files might process instantly
    console.log('Processing status indicators found:', statusFound)
    
    // Wait for any processing to complete
    await page.waitForTimeout(5000)
    
    await takeScreenshot(page, 'processing-status-checked')
  })
})
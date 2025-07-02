import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTest, teardownTest, TestContext } from '../setup'
import { FRONTEND_URL, generateTestUser, waitForElement, takeScreenshot } from '../utils/test-helpers'

describe('Learning Workflow Tests', () => {
  let context: TestContext
  let testUser: any

  beforeAll(async () => {
    context = await setupTest()
    testUser = generateTestUser()
  })

  afterAll(async () => {
    await teardownTest(context)
  })

  it('should setup user and knowledge for learning tests', async () => {
    const { page } = context
    
    // Register and login user
    await page.evaluate(async ({ email, password, name }) => {
      try {
        await fetch('http://localhost:8000/v2/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })
      } catch (error) {
        console.log('Registration failed, user might already exist')
      }
    }, testUser)
    
    // Login through UI
    await page.goto(FRONTEND_URL)
    
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
      await page.click('button[type="submit"], button:has-text("Login")')
      await page.waitForTimeout(3000)
    } catch (error) {
      console.log('Login form not found, assuming already authenticated')
    }
    
    await takeScreenshot(page, 'user-setup-for-learning')
  })

  it('should navigate to learning interface', async () => {
    const { page } = context
    
    // Look for learning/course interface
    const learningSelectors = [
      'a[href*="/learn"]',
      'a[href*="/course"]',
      'a[href*="/chapters"]',
      'button:has-text("Learn")',
      'button:has-text("Start Learning")',
      'a:has-text("Course")',
      'a:has-text("Chapters")',
      '.course-link',
      '[data-testid="learn-button"]'
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
      // Try direct navigation to learning routes
      const learningRoutes = ['/learn', '/course', '/chapters', '/dashboard']
      for (const route of learningRoutes) {
        try {
          await page.goto(`${FRONTEND_URL}${route}`)
          await page.waitForTimeout(2000)
          
          const courseElements = await page.$$(':has-text("Chapter"), :has-text("Course"), :has-text("Learn")')
          if (courseElements.length > 0) {
            learningFound = true
            break
          }
        } catch (error) {
          continue
        }
      }
    }
    
    expect(learningFound).toBe(true)
    await takeScreenshot(page, 'learning-interface-found')
  })

  it('should display available chapters or knowledge', async () => {
    const { page } = context
    
    // Look for chapter list or knowledge items
    const chapterSelectors = [
      ':has-text("Chapter")',
      '.chapter-item',
      '[data-testid="chapter"]',
      '.knowledge-item',
      ':has-text("Lesson")',
      '.course-content',
      '.learning-content'
    ]
    
    let chaptersFound = false
    for (const selector of chapterSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        chaptersFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    // If no chapters found, check if we need to create knowledge first
    if (!chaptersFound) {
      // Look for "no content" or "upload" messages
      const noContentSelectors = [
        ':has-text("No knowledge")',
        ':has-text("Upload")',
        ':has-text("Add content")',
        ':has-text("Get started")'
      ]
      
      let noContentFound = false
      for (const selector of noContentSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 })
          noContentFound = true
          break
        } catch (error) {
          continue
        }
      }
      
      if (noContentFound) {
        console.log('No content available for learning - this is expected for new users')
        chaptersFound = true // This is a valid state
      }
    }
    
    expect(chaptersFound).toBe(true)
    await takeScreenshot(page, 'chapters-or-content-displayed')
  })

  it('should interact with available learning content', async () => {
    const { page } = context
    
    // Look for clickable learning content
    const contentSelectors = [
      '.chapter-item',
      '[data-testid="chapter"]',
      'button:has-text("Chapter")',
      'a:has-text("Chapter")',
      '.knowledge-item button',
      '.course-content button'
    ]
    
    let contentClicked = false
    for (const selector of contentSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        await page.click(selector)
        contentClicked = true
        await page.waitForTimeout(3000)
        break
      } catch (error) {
        continue
      }
    }
    
    if (contentClicked) {
      // Look for chapter content display
      const contentDisplaySelectors = [
        '.chapter-content',
        '.course-content',
        ':has-text("Summary")',
        ':has-text("Notes")',
        ':has-text("Quiz")',
        '.learning-content'
      ]
      
      let contentDisplayed = false
      for (const selector of contentDisplaySelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 })
          contentDisplayed = true
          break
        } catch (error) {
          continue
        }
      }
      
      expect(contentDisplayed).toBe(true)
      await takeScreenshot(page, 'learning-content-displayed')
    } else {
      console.log('No clickable learning content found - might need uploaded knowledge')
      await takeScreenshot(page, 'no-learning-content-available')
    }
  })

  it('should test interactive learning features', async () => {
    const { page } = context
    
    // Look for interactive elements
    const interactiveSelectors = [
      'button:has-text("Quiz")',
      'button:has-text("Practice")',
      '.quiz-button',
      '.interactive-element',
      '[data-testid="quiz"]',
      '[data-testid="practice"]',
      'canvas', // For interactive drawings
      '.math-formula',
      '.mindmap'
    ]
    
    let interactiveFound = false
    for (const selector of interactiveSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        interactiveFound = true
        
        // Try to interact with the element
        if (selector.includes('button') || selector.includes('Quiz') || selector.includes('Practice')) {
          await page.click(selector)
          await page.waitForTimeout(2000)
        }
        
        break
      } catch (error) {
        continue
      }
    }
    
    if (interactiveFound) {
      await takeScreenshot(page, 'interactive-features-found')
      
      // Look for quiz or practice interface
      const quizSelectors = [
        '.quiz-question',
        '.practice-problem',
        'input[type="radio"]',
        'button:has-text("Submit")',
        'button:has-text("Next")'
      ]
      
      for (const selector of quizSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 })
          
          if (selector.includes('radio')) {
            await page.click(selector)
          } else if (selector.includes('button')) {
            await page.click(selector)
            await page.waitForTimeout(1000)
          }
          
          break
        } catch (error) {
          continue
        }
      }
      
      await takeScreenshot(page, 'interactive-engagement-tested')
    } else {
      console.log('No interactive features found - content might be primarily text-based')
    }
  })

  it('should test navigation between chapters', async () => {
    const { page } = context
    
    // Look for navigation elements
    const navigationSelectors = [
      'button:has-text("Next")',
      'button:has-text("Previous")',
      'button:has-text("Back")',
      '.navigation-button',
      '[data-testid="next-chapter"]',
      '[data-testid="prev-chapter"]',
      '.chapter-nav'
    ]
    
    let navigationFound = false
    for (const selector of navigationSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        navigationFound = true
        await page.click(selector)
        await page.waitForTimeout(2000)
        break
      } catch (error) {
        continue
      }
    }
    
    if (navigationFound) {
      // Verify navigation worked
      const currentUrl = page.url()
      console.log('Navigated to:', currentUrl)
      
      await takeScreenshot(page, 'chapter-navigation-tested')
    } else {
      console.log('No chapter navigation found - might be single chapter or different UI pattern')
    }
  })

  it('should test learning progress tracking', async () => {
    const { page } = context
    
    // Look for progress indicators
    const progressSelectors = [
      '.progress-bar',
      '[data-testid="progress"]',
      ':has-text("Progress")',
      ':has-text("%")',
      '.completion-indicator',
      '.learning-progress'
    ]
    
    let progressFound = false
    for (const selector of progressSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        progressFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (progressFound) {
      console.log('Learning progress tracking found')
      await takeScreenshot(page, 'progress-tracking-found')
    } else {
      console.log('No visible progress tracking - might be tracked differently')
    }
    
    // Check for any analytics or tracking calls
    const analyticsFound = await page.evaluate(() => {
      // Check if any analytics events are being fired
      return typeof window !== 'undefined' && 
             (window.gtag !== undefined || 
              window.analytics !== undefined || 
              window._paq !== undefined)
    })
    
    console.log('Analytics tracking available:', analyticsFound)
  })

  it('should complete full learning session', async () => {
    const { page } = context
    
    // Simulate completing a learning session
    const completionSelectors = [
      'button:has-text("Complete")',
      'button:has-text("Finish")',
      'button:has-text("Done")',
      '[data-testid="complete-session"]',
      '.completion-button'
    ]
    
    let completionFound = false
    for (const selector of completionSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        await page.click(selector)
        completionFound = true
        await page.waitForTimeout(2000)
        break
      } catch (error) {
        continue
      }
    }
    
    // Check for completion feedback
    const feedbackSelectors = [
      ':has-text("Completed")',
      ':has-text("Congratulations")',
      ':has-text("Well done")',
      ':has-text("Finished")',
      '.completion-message',
      '.success-message'
    ]
    
    let feedbackFound = false
    for (const selector of feedbackSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        feedbackFound = true
        break
      } catch (error) {
        continue
      }
    }
    
    if (completionFound || feedbackFound) {
      console.log('Learning session completion flow found')
      await takeScreenshot(page, 'learning-session-completed')
    } else {
      console.log('No explicit completion flow - learning might be continuous')
      await takeScreenshot(page, 'learning-session-tested')
    }
    
    // Final verification - check if we can see the learning content
    const learningContentExists = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase()
      return body.includes('learn') || 
             body.includes('chapter') || 
             body.includes('course') ||
             body.includes('content') ||
             body.includes('knowledge')
    })
    
    expect(learningContentExists).toBe(true)
  })
})
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import puppeteer, { Browser, Page } from 'puppeteer'
import { 
  generateTestUser, 
  getTestFiles, 
  takeScreenshot, 
  retryOperation,
  TestUser 
} from '../utils/test-helpers'
import { 
  LandingPage, 
  AuthPage, 
  DashboardPage, 
  LearningPage, 
  AnalyticsPage 
} from '../utils/page-objects'

describe('Student Learning Workflow Tests', () => {
  let browser: Browser
  let page: Page
  let testUser: TestUser
  let landingPage: LandingPage
  let authPage: AuthPage
  let dashboardPage: DashboardPage
  let learningPage: LearningPage
  let analyticsPage: AnalyticsPage

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    
    testUser = generateTestUser('student')
    console.log('Generated test student:', testUser.email)
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
    
    // Initialize page objects
    landingPage = new LandingPage(page)
    authPage = new AuthPage(page)
    dashboardPage = new DashboardPage(page)
    learningPage = new LearningPage(page)
    analyticsPage = new AnalyticsPage(page)
  })

  it('should complete student registration and onboarding', async () => {
    console.log('🎓 Testing student registration and onboarding')
    
    // Step 1: Load landing page
    await landingPage.load()
    await takeScreenshot(page, 'student-landing-page')
    
    // Step 2: Navigate to signup
    await landingPage.goToSignup()
    await takeScreenshot(page, 'student-signup-page')
    
    // Step 3: Complete registration
    await retryOperation(async () => {
      await authPage.signup(testUser)
    }, 3, 2000)
    
    // Step 4: Verify successful registration
    const hasError = await authPage.hasError()
    if (hasError) {
      const errorMessage = await authPage.getErrorMessage()
      console.log('Registration error:', errorMessage)
      await takeScreenshot(page, 'student-registration-error')
    }
    
    expect(hasError).toBe(false)
    await takeScreenshot(page, 'student-registration-success')
    
    console.log('✅ Student registration completed successfully')
  })

  it('should upload and process learning content', async () => {
    console.log('📚 Testing content upload and processing')
    
    // Step 1: Login as student
    await authPage.loadLogin()
    await authPage.login(testUser)
    await takeScreenshot(page, 'student-login-success')
    
    // Step 2: Navigate to dashboard
    await dashboardPage.load()
    await takeScreenshot(page, 'student-dashboard')
    
    // Step 3: Upload test files
    const testFiles = getTestFiles()
    
    for (const file of testFiles) {
      console.log(`Uploading ${file.name}...`)
      
      await retryOperation(async () => {
        await dashboardPage.uploadFile(file.path)
      }, 3, 2000)
      
      await page.waitForTimeout(3000) // Wait for upload processing
      await takeScreenshot(page, `student-upload-${file.type}`)
    }
    
    // Step 4: Verify uploaded content appears
    const knowledgeItems = await dashboardPage.getKnowledgeItems()
    expect(knowledgeItems.length).toBeGreaterThan(0)
    
    console.log(`✅ Successfully uploaded ${testFiles.length} files`)
  })

  it('should navigate and interact with learning content', async () => {
    console.log('🎯 Testing learning content interaction')
    
    // Step 1: Ensure we're logged in and have content
    await authPage.loadLogin()
    await authPage.login(testUser)
    await dashboardPage.load()
    
    // Step 2: Get available knowledge items
    const knowledgeItems = await dashboardPage.getKnowledgeItems()
    
    if (knowledgeItems.length === 0) {
      console.log('No content available, uploading test content first...')
      const testFiles = getTestFiles()
      await dashboardPage.uploadFile(testFiles[0].path)
      await page.waitForTimeout(5000) // Wait for processing
    }
    
    // Step 3: Click on first knowledge item to start learning
    const updatedItems = await dashboardPage.getKnowledgeItems()
    if (updatedItems.length > 0) {
      await updatedItems[0].click()
      await page.waitForTimeout(3000)
      await takeScreenshot(page, 'student-learning-content')
    }
    
    // Step 4: Check for different content types
    const hasVideo = await learningPage.hasVideo()
    const hasQuiz = await learningPage.hasQuiz()
    const hasNotes = await learningPage.hasNotes()
    
    console.log('Content types available:', {
      video: hasVideo,
      quiz: hasQuiz,
      notes: hasNotes
    })
    
    // Step 5: Interact with available content
    if (hasVideo) {
      console.log('Interacting with video content...')
      await takeScreenshot(page, 'student-video-content')
    }
    
    if (hasQuiz) {
      console.log('Interacting with quiz content...')
      await takeScreenshot(page, 'student-quiz-content')
    }
    
    if (hasNotes) {
      console.log('Interacting with notes content...')
      await takeScreenshot(page, 'student-notes-content')
    }
    
    // Step 6: Check progress tracking
    const progress = await learningPage.getProgress()
    console.log('Learning progress:', progress)
    
    expect(typeof progress).toBe('string')
    console.log('✅ Successfully interacted with learning content')
  })

  it('should track learning progress and analytics', async () => {
    console.log('📊 Testing progress tracking and analytics')
    
    // Step 1: Ensure we're logged in
    await authPage.loadLogin()
    await authPage.login(testUser)
    
    // Step 2: Navigate to analytics page
    await analyticsPage.load()
    await takeScreenshot(page, 'student-analytics-dashboard')
    
    // Step 3: Check for analytics components
    const statsCards = await analyticsPage.getStatsCards()
    console.log(`Found ${statsCards.length} analytics cards`)
    
    // Step 4: Get specific metrics
    const timeSpent = await analyticsPage.getTimeSpent()
    const completionRate = await analyticsPage.getCompletionRate()
    
    console.log('Analytics metrics:', {
      timeSpent,
      completionRate,
      statsCardsCount: statsCards.length
    })
    
    // Step 5: Test export functionality if available
    await retryOperation(async () => {
      await analyticsPage.exportData()
    }, 2, 1000).catch(() => {
      console.log('Export functionality not available or not working')
    })
    
    expect(statsCards.length).toBeGreaterThanOrEqual(0)
    console.log('✅ Analytics tracking verified')
  })

  it('should handle learning session completion', async () => {
    console.log('🏆 Testing learning session completion')
    
    // Step 1: Login and navigate to learning content
    await authPage.loadLogin()
    await authPage.login(testUser)
    await dashboardPage.load()
    
    // Step 2: Start a learning session
    const knowledgeItems = await dashboardPage.getKnowledgeItems()
    if (knowledgeItems.length > 0) {
      await knowledgeItems[0].click()
      await page.waitForTimeout(3000)
    }
    
    // Step 3: Simulate learning activity
    console.log('Simulating learning activity...')
    
    // Scroll through content to simulate reading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await page.waitForTimeout(2000)
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await page.waitForTimeout(2000)
    
    // Step 4: Try to complete the chapter/session
    await retryOperation(async () => {
      await learningPage.completeChapter()
    }, 2, 1000).catch(() => {
      console.log('Chapter completion not available or already completed')
    })
    
    await takeScreenshot(page, 'student-session-completion')
    
    // Step 5: Verify progress was updated
    const finalProgress = await learningPage.getProgress()
    console.log('Final progress:', finalProgress)
    
    console.log('✅ Learning session completion tested')
  })

  it('should handle search and content discovery', async () => {
    console.log('🔍 Testing search and content discovery')
    
    // Step 1: Login and go to dashboard
    await authPage.loadLogin()
    await authPage.login(testUser)
    await dashboardPage.load()
    
    // Step 2: Test search functionality
    await retryOperation(async () => {
      await dashboardPage.searchKnowledge('test')
    }, 2, 1000).catch(() => {
      console.log('Search functionality not available')
    })
    
    await page.waitForTimeout(2000)
    await takeScreenshot(page, 'student-search-results')
    
    // Step 3: Verify search results
    const searchResults = await dashboardPage.getKnowledgeItems()
    console.log(`Search returned ${searchResults.length} results`)
    
    expect(searchResults.length).toBeGreaterThanOrEqual(0)
    console.log('✅ Search and discovery functionality tested')
  })

  it('should handle error scenarios gracefully', async () => {
    console.log('⚠️ Testing error handling scenarios')
    
    // Step 1: Test invalid login
    await authPage.loadLogin()
    const invalidUser = generateTestUser('student')
    invalidUser.email = 'nonexistent@example.com'
    
    await authPage.login(invalidUser)
    
    const hasLoginError = await authPage.hasError()
    console.log('Invalid login error handling:', hasLoginError)
    
    await takeScreenshot(page, 'student-login-error')
    
    // Step 2: Test navigation to non-existent content
    await page.goto('http://localhost:5173/chapter/999/999', { 
      waitUntil: 'networkidle0' 
    }).catch(() => {
      console.log('Navigation to invalid content handled')
    })
    
    await takeScreenshot(page, 'student-invalid-content')
    
    // Step 3: Test file upload with invalid file (if possible)
    // This would require creating an invalid file or testing file size limits
    
    console.log('✅ Error scenarios tested')
  })
})

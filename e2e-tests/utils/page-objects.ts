import { Page } from 'puppeteer'
import { FRONTEND_URL, BACKEND_URL, TestUser } from './test-helpers'

/**
 * Base Page Object with common functionality
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string = '') {
    const url = `${FRONTEND_URL}${path}`
    await this.page.goto(url, { waitUntil: 'networkidle0' })
  }

  async waitForElement(selector: string, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout })
      return true
    } catch (error) {
      console.error(`Element not found: ${selector}`)
      return false
    }
  }

  async clickElement(selector: string) {
    await this.waitForElement(selector)
    await this.page.click(selector)
  }

  async fillInput(selector: string, value: string) {
    await this.waitForElement(selector)
    await this.page.focus(selector)
    await this.page.keyboard.down('Control')
    await this.page.keyboard.press('KeyA')
    await this.page.keyboard.up('Control')
    await this.page.type(selector, value)
  }

  async takeScreenshot(name: string) {
    const timestamp = Date.now()
    await this.page.screenshot({
      path: `./screenshots/${name}-${timestamp}.png`,
      fullPage: true
    })
  }

  async waitForNavigation(expectedUrl?: string, timeout = 10000) {
    if (expectedUrl) {
      await this.page.waitForFunction(
        (url) => window.location.href.includes(url),
        { timeout },
        expectedUrl
      )
    } else {
      await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout })
    }
  }
}

/**
 * Landing Page Object
 */
export class LandingPage extends BasePage {
  private selectors = {
    signupButton: '[data-testid="signup-button"], a[href*="signup"], button:has-text("Sign Up")',
    loginButton: '[data-testid="login-button"], a[href*="login"], button:has-text("Login")',
    pricingLink: '[data-testid="pricing-link"], a[href*="pricing"]',
    heroSection: '[data-testid="hero-section"], .hero, h1'
  }

  async load() {
    await this.goto('/')
    await this.waitForElement(this.selectors.heroSection)
  }

  async goToSignup() {
    await this.clickElement(this.selectors.signupButton)
    await this.waitForNavigation('/signup')
  }

  async goToLogin() {
    await this.clickElement(this.selectors.loginButton)
    await this.waitForNavigation('/login')
  }

  async goToPricing() {
    await this.clickElement(this.selectors.pricingLink)
    await this.waitForNavigation('/pricing')
  }
}

/**
 * Authentication Page Object
 */
export class AuthPage extends BasePage {
  private selectors = {
    emailInput: '[data-testid="email-input"], input[type="email"], input[name="email"]',
    passwordInput: '[data-testid="password-input"], input[type="password"], input[name="password"]',
    nameInput: '[data-testid="name-input"], input[name="name"], input[placeholder*="name"]',
    submitButton: '[data-testid="submit-button"], button[type="submit"], button:has-text("Sign"), button:has-text("Login")',
    errorMessage: '[data-testid="error-message"], .error, .alert-error',
    successMessage: '[data-testid="success-message"], .success, .alert-success',
    switchToLogin: '[data-testid="login-link"], a[href*="login"], a:has-text("Login")',
    switchToSignup: '[data-testid="signup-link"], a[href*="signup"], a:has-text("Sign Up")'
  }

  async loadLogin() {
    await this.goto('/login')
    await this.waitForElement(this.selectors.emailInput)
  }

  async loadSignup() {
    await this.goto('/register')
    await this.waitForElement(this.selectors.emailInput)
  }

  async login(user: TestUser) {
    await this.fillInput(this.selectors.emailInput, user.email)
    await this.fillInput(this.selectors.passwordInput, user.password)
    await this.clickElement(this.selectors.submitButton)
    
    // Wait for either success or error
    await Promise.race([
      this.waitForNavigation('/app'),
      this.waitForNavigation('/dashboard'),
      this.waitForElement(this.selectors.errorMessage)
    ])
  }

  async signup(user: TestUser) {
    await this.fillInput(this.selectors.emailInput, user.email)
    await this.fillInput(this.selectors.passwordInput, user.password)
    
    // Try to fill name if field exists
    const nameExists = await this.waitForElement(this.selectors.nameInput, 2000)
    if (nameExists) {
      await this.fillInput(this.selectors.nameInput, user.name)
    }
    
    await this.clickElement(this.selectors.submitButton)
    
    // Wait for either success or error
    await Promise.race([
      this.waitForNavigation('/app'),
      this.waitForNavigation('/dashboard'),
      this.waitForElement(this.selectors.errorMessage)
    ])
  }

  async hasError() {
    return await this.waitForElement(this.selectors.errorMessage, 3000)
  }

  async getErrorMessage() {
    if (await this.hasError()) {
      return await this.page.$eval(this.selectors.errorMessage, el => el.textContent)
    }
    return null
  }
}

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  private selectors = {
    uploadButton: '[data-testid="upload-button"], button:has-text("Upload"), input[type="file"]',
    fileInput: '[data-testid="file-input"], input[type="file"]',
    knowledgeList: '[data-testid="knowledge-list"], .knowledge-list, .file-list',
    knowledgeItem: '[data-testid="knowledge-item"], .knowledge-item, .file-item',
    userMenu: '[data-testid="user-menu"], .user-menu, button:has-text("Profile")',
    logoutButton: '[data-testid="logout-button"], button:has-text("Logout"), a:has-text("Logout")',
    searchInput: '[data-testid="search-input"], input[placeholder*="search"]',
    filterDropdown: '[data-testid="filter-dropdown"], select'
  }

  async load() {
    await this.goto('/app')
    await this.waitForElement(this.selectors.knowledgeList)
  }

  async uploadFile(filePath: string) {
    // Look for file input or upload button
    const fileInputExists = await this.waitForElement(this.selectors.fileInput, 3000)
    
    if (fileInputExists) {
      const fileInput = await this.page.$(this.selectors.fileInput)
      await fileInput?.uploadFile(filePath)
    } else {
      // Try clicking upload button first
      await this.clickElement(this.selectors.uploadButton)
      await this.waitForElement(this.selectors.fileInput)
      const fileInput = await this.page.$(this.selectors.fileInput)
      await fileInput?.uploadFile(filePath)
    }

    // Look for submit button if needed
    const submitSelectors = [
      'button:has-text("Upload")',
      'button[type="submit"]',
      '[data-testid="upload-submit"]'
    ]

    for (const selector of submitSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 2000 })
        await this.page.click(selector)
        break
      } catch (error) {
        continue
      }
    }
  }

  async getKnowledgeItems() {
    await this.waitForElement(this.selectors.knowledgeItem, 5000)
    return await this.page.$$(this.selectors.knowledgeItem)
  }

  async searchKnowledge(query: string) {
    const searchExists = await this.waitForElement(this.selectors.searchInput, 3000)
    if (searchExists) {
      await this.fillInput(this.selectors.searchInput, query)
      await this.page.keyboard.press('Enter')
    }
  }

  async logout() {
    await this.clickElement(this.selectors.userMenu)
    await this.clickElement(this.selectors.logoutButton)
    await this.waitForNavigation('/login')
  }
}

/**
 * Learning Page Object
 */
export class LearningPage extends BasePage {
  private selectors = {
    chapterList: '[data-testid="chapter-list"], .chapter-list',
    chapterItem: '[data-testid="chapter-item"], .chapter-item',
    contentArea: '[data-testid="content-area"], .content-area, .main-content',
    videoPlayer: '[data-testid="video-player"], video, .video-player',
    quizSection: '[data-testid="quiz-section"], .quiz, .quiz-container',
    notesSection: '[data-testid="notes-section"], .notes, .notes-container',
    progressBar: '[data-testid="progress-bar"], .progress-bar, .progress',
    nextButton: '[data-testid="next-button"], button:has-text("Next")',
    prevButton: '[data-testid="prev-button"], button:has-text("Previous")',
    completeButton: '[data-testid="complete-button"], button:has-text("Complete")'
  }

  async loadChapter(knowledgeId: string, chapterId: string) {
    await this.goto(`/chapter/${knowledgeId}/${chapterId}`)
    await this.waitForElement(this.selectors.contentArea)
  }

  async getChapters() {
    await this.waitForElement(this.selectors.chapterList, 5000)
    return await this.page.$$(this.selectors.chapterItem)
  }

  async clickChapter(index: number) {
    const chapters = await this.getChapters()
    if (chapters[index]) {
      await chapters[index].click()
      await this.waitForElement(this.selectors.contentArea)
    }
  }

  async hasVideo() {
    return await this.waitForElement(this.selectors.videoPlayer, 3000)
  }

  async hasQuiz() {
    return await this.waitForElement(this.selectors.quizSection, 3000)
  }

  async hasNotes() {
    return await this.waitForElement(this.selectors.notesSection, 3000)
  }

  async getProgress() {
    const progressExists = await this.waitForElement(this.selectors.progressBar, 3000)
    if (progressExists) {
      return await this.page.$eval(this.selectors.progressBar, el => {
        const style = window.getComputedStyle(el)
        return style.width || el.getAttribute('value') || '0%'
      })
    }
    return '0%'
  }

  async completeChapter() {
    const completeExists = await this.waitForElement(this.selectors.completeButton, 3000)
    if (completeExists) {
      await this.clickElement(this.selectors.completeButton)
    }
  }
}

/**
 * Analytics Page Object
 */
export class AnalyticsPage extends BasePage {
  private selectors = {
    progressChart: '[data-testid="progress-chart"], .progress-chart, .chart',
    statsCards: '[data-testid="stats-card"], .stats-card, .metric-card',
    timeSpentMetric: '[data-testid="time-spent"], .time-spent',
    completionRate: '[data-testid="completion-rate"], .completion-rate',
    exportButton: '[data-testid="export-button"], button:has-text("Export")',
    dateFilter: '[data-testid="date-filter"], select[name="date"], .date-filter'
  }

  async load(knowledgeId?: string) {
    const path = knowledgeId ? `/analytics/${knowledgeId}` : '/analytics'
    await this.goto(path)
    await this.waitForElement(this.selectors.progressChart)
  }

  async getStatsCards() {
    await this.waitForElement(this.selectors.statsCards, 5000)
    return await this.page.$$(this.selectors.statsCards)
  }

  async getTimeSpent() {
    const timeExists = await this.waitForElement(this.selectors.timeSpentMetric, 3000)
    if (timeExists) {
      return await this.page.$eval(this.selectors.timeSpentMetric, el => el.textContent)
    }
    return null
  }

  async getCompletionRate() {
    const rateExists = await this.waitForElement(this.selectors.completionRate, 3000)
    if (rateExists) {
      return await this.page.$eval(this.selectors.completionRate, el => el.textContent)
    }
    return null
  }

  async exportData() {
    const exportExists = await this.waitForElement(this.selectors.exportButton, 3000)
    if (exportExists) {
      await this.clickElement(this.selectors.exportButton)
    }
  }
}

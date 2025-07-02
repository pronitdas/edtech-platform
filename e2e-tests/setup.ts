import puppeteer, { Browser, Page } from 'puppeteer'

export interface TestContext {
  browser: Browser
  page: Page
}

let globalBrowser: Browser

export async function setupTest(): Promise<TestContext> {
  if (!globalBrowser) {
    globalBrowser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    })
  }

  const page = await globalBrowser.newPage()
  await page.setViewport({ width: 1280, height: 720 })
  
  return { browser: globalBrowser, page }
}

export async function teardownTest(context: TestContext) {
  if (context.page && !context.page.isClosed()) {
    await context.page.close()
  }
}

export async function globalTeardown() {
  if (globalBrowser) {
    await globalBrowser.close()
  }
}
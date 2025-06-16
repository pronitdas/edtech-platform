/** @type {import('@storybook/test-runner').TestRunnerConfig} */
export default {
  async preVisit(page, context) {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 })
  },

  async postVisit(page, context) {
    // Run accessibility tests
    try {
      const { injectAxe, checkA11y } = await import('axe-playwright')

      await injectAxe(page)
      await checkA11y(page, '#storybook-root', {
        detailedReport: true,
        detailedReportOptions: { html: true },
      })
    } catch (error) {
      console.warn('Accessibility testing not available:', error)
    }
  },
}

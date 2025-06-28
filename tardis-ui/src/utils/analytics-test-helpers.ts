// DISABLED: Legacy test helpers dependent on Supabase
// TODO: Rewrite to use local API when needed

export const analyticsTestHelpers = {
  async generateTestEvents(): Promise<boolean> {
    console.warn('Analytics test helpers disabled - migrate to local API')
    return false
  },
  async verifyEventPersistence(): Promise<boolean> {
    console.warn('Analytics test helpers disabled - migrate to local API')
    return false
  },
  async testAnalyticsFlow(): Promise<{ success: boolean }> {
    console.warn('Analytics test helpers disabled - migrate to local API')
    return { success: false }
  },
  async cleanupTestData(): Promise<boolean> {
    console.warn('Analytics test helpers disabled - migrate to local API')
    return false
  }
}
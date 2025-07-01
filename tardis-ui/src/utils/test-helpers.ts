// DISABLED: Legacy test helpers dependent on Supabase
// TODO: Rewrite to use local API when needed

export const testHelpers = {
  async simulateUserActivity(): Promise<boolean> {
    console.warn('Test helpers disabled - migrate to local API')
    return false
  },
}

/* LEGACY SUPABASE CODE - TODO: MIGRATE TO LOCAL API */

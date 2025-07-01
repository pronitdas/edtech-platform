interface ServiceStatus {
  name: string
  exists: boolean
  hasV2Integration: boolean
  endpoints: string[]
  issues: string[]
}

interface AuditResult {
  services: ServiceStatus[]
  summary: {
    total: number
    existing: number
    v2Ready: number
    needsWork: number
  }
}

const EXPECTED_SERVICES = [
  'auth-service',
  'knowledge-service',
  'content-service',
  'roleplay-service',
  'analytics-service',
  'search-service',
]

export async function auditServices(): Promise<AuditResult> {
  const services: ServiceStatus[] = []

  for (const serviceName of EXPECTED_SERVICES) {
    const status: ServiceStatus = {
      name: serviceName,
      exists: false,
      hasV2Integration: false,
      endpoints: [],
      issues: [],
    }

    try {
      // Try to dynamically import the service
      const module = await import(`../services/${serviceName}`)
      status.exists = true

      // Check for v2 endpoints
      const serviceCode = module.toString()
      if (serviceCode.includes('/v2/')) {
        status.hasV2Integration = true
      } else {
        status.issues.push('No /v2 endpoints found')
      }

      // Extract endpoint patterns
      const endpointMatches = serviceCode.match(
        /['"`][^'"`]*\/v2\/[^'"`]*['"`]/g
      )
      if (endpointMatches) {
        status.endpoints = endpointMatches.map((match: string) => match.slice(1, -1))
      }
    } catch (error) {
      status.issues.push(`Service not found: ${error}`)
    }

    services.push(status)
  }

  const summary = {
    total: services.length,
    existing: services.filter(s => s.exists).length,
    v2Ready: services.filter(s => s.exists && s.hasV2Integration).length,
    needsWork: services.filter(s => !s.exists || !s.hasV2Integration).length,
  }

  return { services, summary }
}

// Development helper function
export function logServiceAudit() {
  if (import.meta.env.DEV) {
    auditServices().then(result => {
      console.group('🔍 Service Audit Results')
      console.log('Summary:', result.summary)
      console.table(result.services)

      const issues = result.services.filter(s => s.issues.length > 0)
      if (issues.length > 0) {
        console.group('⚠️ Issues Found')
        issues.forEach(service => {
          console.log(`${service.name}:`, service.issues)
        })
        console.groupEnd()
      }
      console.groupEnd()
    })
  }
}

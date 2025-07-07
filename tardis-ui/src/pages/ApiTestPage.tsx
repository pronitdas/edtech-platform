/**
 * API Test Page
 * Standalone page for testing all APIs without Storybook
 */

import React from 'react'
import ApiTestDashboard from '../components/ApiTestDashboard'

const ApiTestPage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      paddingTop: '20px',
      paddingBottom: '40px'
    }}>
      <ApiTestDashboard />
    </div>
  )
}

export default ApiTestPage
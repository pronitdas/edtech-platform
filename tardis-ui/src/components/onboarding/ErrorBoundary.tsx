import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Onboarding Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-600 shadow-lg">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We encountered an error while loading the onboarding process. Please try refreshing the page.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    Error: {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
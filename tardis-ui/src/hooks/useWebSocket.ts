import { useState, useEffect, useRef, useCallback } from 'react'

export interface WebSocketStatus {
  connected: boolean
  connecting: boolean
  error: string | null
  lastMessage: any
}

export interface WebSocketHookResult extends WebSocketStatus {
  sendMessage: (message: any) => void
  reconnect: () => void
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export function useWebSocket(
  endpoint: string,
  options?: {
    reconnectInterval?: number
    maxReconnectAttempts?: number
    onMessage?: (data: any) => void
    onConnect?: () => void
    onDisconnect?: () => void
  }
): WebSocketHookResult {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const mountedRef = useRef(true)

  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
  } = options || {}

  const connect = useCallback(() => {
    if (!mountedRef.current || status.connecting) return

    setStatus(prev => ({ ...prev, connecting: true, error: null }))

    try {
      const wsUrl = `${WS_BASE_URL}${endpoint}`
      const token = localStorage.getItem('auth_token')
      const fullUrl = token ? `${wsUrl}?token=${token}` : wsUrl

      wsRef.current = new WebSocket(fullUrl)

      wsRef.current.onopen = () => {
        if (!mountedRef.current) return

        setStatus(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }))

        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      wsRef.current.onmessage = event => {
        if (!mountedRef.current) return

        try {
          const data = JSON.parse(event.data)
          setStatus(prev => ({ ...prev, lastMessage: data }))
          onMessage?.(data)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      wsRef.current.onclose = () => {
        if (!mountedRef.current) return

        setStatus(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }))

        onDisconnect?.()

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect()
            }
          }, reconnectInterval)
        } else {
          setStatus(prev => ({
            ...prev,
            error: `Failed to reconnect after ${maxReconnectAttempts} attempts`,
          }))
        }
      }

      wsRef.current.onerror = error => {
        if (!mountedRef.current) return

        setStatus(prev => ({
          ...prev,
          connecting: false,
          error: 'WebSocket connection error',
        }))
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to create WebSocket connection',
      }))
    }
  }, [
    endpoint,
    reconnectInterval,
    maxReconnectAttempts,
    onMessage,
    onConnect,
    onDisconnect,
  ])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    if (wsRef.current) {
      wsRef.current.close()
    }
    connect()
  }, [connect])

  useEffect(() => {
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    ...status,
    sendMessage,
    reconnect,
  }
}

// Specialized hook for knowledge processing status
export function useKnowledgeStatus(knowledgeId: string | undefined) {
  return useWebSocket(
    knowledgeId ? `/ws/knowledge/${knowledgeId}/status` : '',
    {
      reconnectInterval: 2000,
      maxReconnectAttempts: 10,
    }
  )
}

// Specialized hook for real-time analytics
export function useAnalyticsUpdates(userId: string) {
  return useWebSocket(`/ws/analytics/${userId}`, {
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,
  })
}

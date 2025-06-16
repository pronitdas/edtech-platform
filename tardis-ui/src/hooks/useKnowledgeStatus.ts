import { useState, useEffect, useCallback } from 'react';
import { knowledgeService } from '../services/knowledge';

interface StatusMessage {
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

export function useKnowledgeStatus(knowledgeId: number | null) {
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!knowledgeId) return;

    const ws = knowledgeService.createStatusWebSocket(knowledgeId);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [knowledgeId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { status, isConnected };
}

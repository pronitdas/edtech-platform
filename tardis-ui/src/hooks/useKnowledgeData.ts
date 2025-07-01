import { useState, useEffect } from 'react'
import { getKnowledge, getKnowledgeMeta } from '@/services/edtech-content'
import { Knowledge } from '@/types/api'

export const useKnowledgeData = (initialKnowledgeId?: string) => {
  const [knowledge, setKnowledge] = useState<Knowledge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKnowledge = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getKnowledge()
      setKnowledge(data)
    } catch (err) {
      console.error('Error fetching knowledge:', err)
      setError('Failed to load knowledge data.')
    } finally {
      setLoading(false)
    }
  }

  const fetchKnowledgeMeta = async (id: number) => {
    try {
      const meta = await getKnowledgeMeta(id)
      return meta
    } catch (err) {
      console.error('Error fetching knowledge meta:', err)
      return null
    }
  }

  useEffect(() => {
    fetchKnowledge()
  }, [])

  return {
    knowledge,
    loading,
    error,
    fetchKnowledge,
    fetchKnowledgeMeta,
    setKnowledge,
  }
}

import { useState } from 'react'
import { supabase } from '../services/supabase'

export const useChapters = () => {
  const [chapters, setChapters] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchChapters = async (knowledgeId, language) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('knowledge_id', knowledgeId)
        .eq('language', language)
        .order('order', { ascending: true })
      
      if (error) throw error
      setChapters(data)
      return data
    } catch (err) {
      setError('Failed to fetch chapters')
      console.error('Error fetching chapters:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setChapters([])
    setError(null)
  }

  return {
    chapters,
    isLoading,
    error,
    fetchChapters,
    reset
  }
}


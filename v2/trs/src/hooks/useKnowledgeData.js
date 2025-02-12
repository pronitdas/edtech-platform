import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const useKnowledgeData = () => {
  const [knowledge, setKnowledge] = useState([])
  const [currentLanguage, setCurrentLanguage] = useState('English')

  const fetchKnowledge = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setKnowledge(data)
    } catch (error) {
      console.error("Error fetching knowledge:", error)
    }
  }

  useEffect(() => {
    fetchKnowledge()
  }, [])

  return { 
    knowledge, 
    fetchKnowledge, 
    currentLanguage,
    setCurrentLanguage
  }
}


import { supabase } from './supabase'

export const getEdTechContent = async (chapterId, language = "English") => {
  const { data, error } = await supabase
    .from(`EdTechContent_${language}`)
    .select('*')
    .eq('chapter_id', chapterId)
    .single()

  if (error) {
    console.error("Error fetching EdTech content:", error)
    return null
  }

  return data
}

export const updateEdtechContent = async (updateObject, edtechId, chapterId, knowledgeId, language = "English") => {
  const { data, error } = await supabase
    .from(`EdTechContent_${language}`)
    .update(updateObject)
    .eq('id', edtechId)
    .eq('chapter_id', chapterId)
    .eq('knowledge_id', knowledgeId)
    .select()

  if (error) {
    console.error("Error updating EdTech content:", error)
    return null
  }

  return data
}


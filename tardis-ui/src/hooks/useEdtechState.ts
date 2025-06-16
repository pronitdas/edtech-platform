import { useState } from 'react'

interface TopicState {
  topicId: string | null
  topic: any | null
  language: string | null
  knowledgeId: string | null
}

export const useEdtechState = () => {
  const [currentTopic, setCurrentTopic] = useState<TopicState>({
    topicId: null,
    topic: null,
    language: null,
    knowledgeId: null,
  })
  const [courseView, setCourseView] = useState(false)

  return {
    currentTopic,
    setCurrentTopic,
    courseView,
    setCourseView,
  }
}

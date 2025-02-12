import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'
import KnowledgeList from '@/components/KnowledgeList'
import KnowledgeContent from '@/components/KnowledgeContent'
import StudentProgress from '@/components/StudentProgress'
import Login from '@/components/Login'

const Dashboard = () => {
  const { user } = useAuth()
  const [knowledge, setKnowledge] = useState([])
  const [selectedKnowledge, setSelectedKnowledge] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState([])

  useEffect(() => {
    if (user) {
      fetchKnowledge()
      fetchProgress()
    }
  }, [user])

  const fetchKnowledge = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('knowledge').select('*')
    if (error) console.error('Error fetching knowledge:', error)
    else setKnowledge(data)
    setIsLoading(false)
  }

  const fetchProgress = async () => {
    const { data, error } = await supabase
      .from('course_progress')
      .select('*')
      .eq('student_id', user.id)
    if (error) console.error('Error fetching progress:', error)
    else setProgress(data)
  }

  const updateProgress = async (courseId, chapterId, status) => {
    const { data, error } = await supabase
      .from('course_progress')
      .upsert({
        student_id: user.id,
        course_id: courseId,
        chapter_id: chapterId,
        status: status,
        last_accessed: new Date().toISOString()
      })
    if (error) console.error('Error updating progress:', error)
    else fetchProgress()
  }

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.email}!</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <StudentProgress progress={progress} />
        {isLoading ? (
          <p>Loading...</p>
        ) : selectedKnowledge ? (
          <KnowledgeContent 
            knowledge={selectedKnowledge} 
            onBack={() => setSelectedKnowledge(null)}
            updateProgress={updateProgress}
            progress={progress.find(p => p.course_id === selectedKnowledge.id)}
          />
        ) : (
          <KnowledgeList 
            knowledgeBase={knowledge} 
            onSelectKnowledge={setSelectedKnowledge}
            progress={progress}
          />
        )}
      </main>
    </div>
  )
}

export default Dashboard


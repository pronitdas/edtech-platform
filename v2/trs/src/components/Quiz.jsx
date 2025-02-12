import React, { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase'

const Quiz = ({ quiz, onComplete, onBack }) => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [quiz.id])

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
    
    if (error) console.error('Error fetching questions:', error)
    else setQuestions(data)
  }

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer)
    if (answer === questions[currentQuestion].correct_answer) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
    } else {
      setQuizCompleted(true)
      onComplete(score)
    }
  }

  if (quizCompleted) {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-4">Quiz Completed!</h3>
        <p>Your score: {score} out of {questions.length}</p>
        <button 
          onClick={onBack}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Back to Course
        </button>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{quiz.title}</h3>
      {questions.length > 0 && (
        <div>
          <p className="mb-4">{questions[currentQuestion].question}</p>
          <ul>
            {JSON.parse(questions[currentQuestion].options).map((option, index) => (
              <li key={index}>
                <button
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-2 mb-2 rounded ${
                    selectedAnswer === option
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={nextQuestion}
            disabled={selectedAnswer === null}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Quiz


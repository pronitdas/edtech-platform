import React, { useState, useEffect, useCallback, useRef } from 'react'
import useAuthState from '@/hooks/useAuth'
import { OpenAIService } from '@/services/openAi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2 } from 'lucide-react'

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatbotProps {
  topic: string
  language: string
  onQuestionAsked?: (question: string) => void
}

const VoiceChatbot = ({ topic, language, onQuestionAsked }: ChatbotProps) => {
  const [userResponse, setUserResponse] = useState('')
  const authState = useAuthState()
  // Get OpenAI API key from environment variables
  const oAiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || null
  const [apiClient, setApiClient] = useState<OpenAIService | null>(null)
  const [mentorText, setMentorText] = useState(
    "Hello, I'm Mentor! Let's start your journey. What would you like to know about?"
  )
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello, I am your companion! Let's start your journey. Just tell me what you need?",
    },
  ])

  const speechQueueRef = useRef<SpeechSynthesisUtterance[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices()
      console.log('Available TTS voices:', voices)
    }

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      handleVoicesChanged
    )
    handleVoicesChanged()

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        handleVoicesChanged
      )
    }
  }, [language])

  useEffect(() => {
    if (!apiClient && oAiKey) {
      setApiClient(new OpenAIService(oAiKey))
    }
  }, [oAiKey, apiClient])

  useEffect(() => {
    // Scroll to bottom whenever conversation updates
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation])

  const sanitizeText = (text: string): string => text.replace(/\*/g, '')

  const speakTextInChunks = useCallback((rawText: string, langCode: string) => {
    window.speechSynthesis.cancel()
    speechQueueRef.current = []
    const sanitized = sanitizeText(rawText)
    const sentences = sanitized.split(/[.?!]\s+/)

    sentences.forEach((sentence: string, idx: number) => {
      if (!sentence.trim()) return
      const chunk = sentence.trim() + '.'
      const utterance = new SpeechSynthesisUtterance(chunk)
      utterance.lang = langCode
      const allVoices = window.speechSynthesis.getVoices()
      const selectedVoice = allVoices.find(voice =>
        voice.lang.toLowerCase().startsWith(langCode.toLowerCase())
      )
      if (selectedVoice) utterance.voice = selectedVoice

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        if (idx === sentences.length) {
          setIsSpeaking(false)
        }
      }

      speechQueueRef.current.push(utterance)
    })

    speechQueueRef.current.forEach(u => {
      window.speechSynthesis.speak(u)
    })
  }, [])

  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      if (!oAiKey) {
        alert('OpenAI API key is missing.')
        return ''
      }
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      formData.append('model', 'whisper-1')

      // Map the provided language to the appropriate code for Whisper
      let transcriptionLang = 'en'
      if (language) {
        const lowerLang = language.toLowerCase()
        if (lowerLang.includes('hindi')) transcriptionLang = 'hi'
        else if (lowerLang.includes('vietnamese')) transcriptionLang = 'vi'
        else if (lowerLang.includes('bengali')) transcriptionLang = 'bn'
        else if (lowerLang.includes('marathi')) transcriptionLang = 'mr'
      }
      formData.append('language', transcriptionLang)

      try {
        const response = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${oAiKey}`,
            },
            body: formData,
          }
        )
        const data = await response.json()
        return data.text
      } catch (error) {
        console.error('Error transcribing audio:', error)
        return ''
      }
    },
    [oAiKey, language]
  )

  const handleNext = useCallback(async () => {
    if (!userResponse.trim()) {
      alert('Please provide your response.')
      return
    }
    if (!apiClient) {
      alert('OpenAI client not ready. Check your API key.')
      return
    }

    setConversation(prev => [...prev, { role: 'user', content: userResponse }])
    setIsLoading(true)

    try {
      const newMentorText = await apiClient.chatCompletion(
        [
          {
            role: 'system',
            content: `Make me understand this topic, answer my doubts, clarify assumptions, don't dump all the information directly, ask me what I want to know, encourage me to ask precise questions, help me drive towards correct path in ${topic} in ${language} in less than 100 words`,
          },
          ...conversation.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          { role: 'user' as const, content: userResponse },
        ],
        'o1-mini',
        200
      )

      setMentorText(newMentorText)
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: newMentorText },
      ])
      setUserResponse('')

      if ('speechSynthesis' in window) {
        let langCode = 'en-US'
        const lowerLang = language.toLowerCase()
        if (lowerLang.includes('hindi')) langCode = 'hi-IN'
        else if (lowerLang.includes('vietnamese')) langCode = 'vi-VN'
        else if (lowerLang.includes('bengali')) langCode = 'bn-IN'
        else if (lowerLang.includes('marathi')) langCode = 'mr-IN'

        speakTextInChunks(newMentorText, langCode)
      }

      if (onQuestionAsked) {
        onQuestionAsked(userResponse)
      }
    } catch (error) {
      console.error('Error during chat completion:', error)
      alert('Error during chat completion.')
    } finally {
      setIsLoading(false)
    }
  }, [
    userResponse,
    apiClient,
    topic,
    language,
    speakTextInChunks,
    conversation,
    onQuestionAsked,
  ])

  const toggleListening = useCallback(async () => {
    if (!isListening) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        mediaStreamRef.current = stream
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          // Stop all tracks to release the microphone
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
          }
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          })
          setIsLoading(true)
          const transcription = await transcribeAudio(audioBlob)
          setUserResponse(transcription)
          setIsLoading(false)
        }

        mediaRecorder.start()
        setIsListening(true)
      } catch (err) {
        console.error('Error starting audio recording:', err)
        alert('Could not start recording audio.')
      }
    } else {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop()
        setIsListening(false)
      }
    }
  }, [isListening, transcribeAudio])

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      speechQueueRef.current = []
      setIsSpeaking(false)
    } else {
      if ('speechSynthesis' in window) {
        let langCode = 'en-US'
        const lowerLang = language.toLowerCase()
        if (lowerLang.includes('hindi')) langCode = 'hi-IN'
        else if (lowerLang.includes('vietnamese')) langCode = 'vi-VN'
        else if (lowerLang.includes('bengali')) langCode = 'bn-IN'
        else if (lowerLang.includes('marathi')) langCode = 'mr-IN'

        speakTextInChunks(mentorText, langCode)
      }
    }
  }, [isSpeaking, mentorText, language, speakTextInChunks])

  // =============== RENDER ===============
  return (
    <div
      style={{ height: 520 }}
      className='mx-auto max-w-3xl overflow-hidden rounded-lg border-0 bg-white shadow-lg'
    >
      {/* Conversation Display */}
      <div
        style={{ height: 370 }}
        className='space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 p-4'
      >
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 shadow ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className='mt-2 space-y-2'>
        <div className='ml-2 flex items-center gap-2'>
          <Textarea
            className='flex-grow resize-none rounded-lg border border-gray-300 p-3 text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'
            placeholder='Type or speak your response here...'
            value={userResponse}
            onChange={e => setUserResponse(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <Button
            onClick={toggleListening}
            variant={isListening ? 'destructive' : 'outline'}
            size='icon'
            className={`mr-2 h-12 w-12 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            style={{ color: 'black' }}
            disabled={isLoading}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <MicOff className='h-5 w-5' />
            ) : (
              <Mic className='h-5 w-5' />
            )}
          </Button>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            onClick={handleNext}
            disabled={!userResponse.trim() || isLoading}
            className='ml-2 bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700'
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <Send className='mr-2 h-4 w-4' />
                Send Message
              </>
            )}
          </Button>
          <Button
            onClick={toggleSpeaking}
            variant={isSpeaking ? 'destructive' : 'secondary'}
            className={`${isSpeaking ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            size='sm'
            disabled={isLoading || !mentorText}
            aria-label={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className='h-4 w-4' />
                Stop
              </>
            ) : (
              <>
                <Volume2 className='h-4 w-4' />
                Listen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VoiceChatbot

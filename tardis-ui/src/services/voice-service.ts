interface VoiceConfig {
  language: string
  rate?: number
  pitch?: number
  volume?: number
}

interface VoiceService {
  isSupported: boolean
  startListening: () => Promise<void>
  stopListening: () => void
  speak: (text: string, config?: VoiceConfig) => Promise<void>
  stopSpeaking: () => void
  isListening: boolean
  isSpeaking: boolean
}

class UnifiedVoiceService implements VoiceService {
  private recognition: any = null
  private recognitionCallbacks: {
    onResult?: (transcript: string) => void
    onError?: (error: any) => void
    onStart?: () => void
    onEnd?: () => void
  } = {}
  
  private synthesisQueue: SpeechSynthesisUtterance[] = []
  private _isListening = false
  private _isSpeaking = false

  constructor() {
    this.setupSpeechRecognition()
  }

  get isSupported(): boolean {
    return 'webkitSpeechRecognition' in window && 'speechSynthesis' in window
  }

  get isListening(): boolean {
    return this._isListening
  }

  get isSpeaking(): boolean {
    return this._isSpeaking
  }

  private setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) return

    const SpeechRecognition = (window as any).webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = 'en-US'

    this.recognition.onstart = () => {
      this._isListening = true
      this.recognitionCallbacks.onStart?.()
    }

    this.recognition.onend = () => {
      this._isListening = false
      this.recognitionCallbacks.onEnd?.()
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      this.recognitionCallbacks.onResult?.(transcript)
    }

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      this._isListening = false
      this.recognitionCallbacks.onError?.(event.error)
    }
  }

  async startListening(): Promise<void> {
    if (!this.recognition || this._isListening) return

    return new Promise((resolve, reject) => {
      this.recognitionCallbacks.onStart = () => resolve()
      this.recognitionCallbacks.onError = (error) => reject(error)
      
      try {
        this.recognition.start()
      } catch (error) {
        reject(error)
      }
    })
  }

  stopListening(): void {
    if (this.recognition && this._isListening) {
      this.recognition.stop()
    }
  }

  async speak(text: string, config: VoiceConfig = { language: 'en-US' }): Promise<void> {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()
    this.synthesisQueue = []

    const sanitizedText = text.replace(/\*/g, '')
    const sentences = sanitizedText.split(/[.?!]\s+/)

    return new Promise((resolve) => {
      let completedSentences = 0

      sentences.forEach((sentence, index) => {
        if (!sentence.trim()) return

        const utterance = new SpeechSynthesisUtterance(sentence.trim() + '.')
        utterance.lang = config.language
        utterance.rate = config.rate || 0.9
        utterance.pitch = config.pitch || 1
        utterance.volume = config.volume || 0.8

        // Set voice based on language
        const voices = window.speechSynthesis.getVoices()
        const selectedVoice = voices.find(voice =>
          voice.lang.toLowerCase().startsWith(config.language.toLowerCase())
        )
        if (selectedVoice) utterance.voice = selectedVoice

        utterance.onstart = () => {
          this._isSpeaking = true
        }

        utterance.onend = () => {
          completedSentences++
          if (completedSentences >= sentences.filter(s => s.trim()).length) {
            this._isSpeaking = false
            resolve()
          }
        }

        utterance.onerror = () => {
          this._isSpeaking = false
          resolve()
        }

        this.synthesisQueue.push(utterance)
      })

      this.synthesisQueue.forEach(utterance => {
        window.speechSynthesis.speak(utterance)
      })
    })
  }

  stopSpeaking(): void {
    window.speechSynthesis.cancel()
    this.synthesisQueue = []
    this._isSpeaking = false
  }

  setCallbacks(callbacks: {
    onResult?: (transcript: string) => void
    onError?: (error: any) => void
    onStart?: () => void
    onEnd?: () => void
  }) {
    this.recognitionCallbacks = callbacks
  }

  setLanguage(language: string) {
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  getLanguageCode(language: string): string {
    const langMap: Record<string, string> = {
      'hindi': 'hi-IN',
      'vietnamese': 'vi-VN', 
      'bengali': 'bn-IN',
      'marathi': 'mr-IN',
      'english': 'en-US'
    }

    const lowerLang = language.toLowerCase()
    for (const [key, code] of Object.entries(langMap)) {
      if (lowerLang.includes(key)) {
        return code
      }
    }
    return 'en-US'
  }
}

export const voiceService = new UnifiedVoiceService()
export type { VoiceConfig, VoiceService }
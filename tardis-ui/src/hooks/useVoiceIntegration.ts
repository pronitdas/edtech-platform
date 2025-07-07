import { useState, useEffect, useCallback } from 'react'
import { voiceService, VoiceConfig } from '@/services/voice-service'

interface VoiceIntegrationOptions {
  autoRead?: boolean
  language?: string
  enableCommands?: boolean
  voiceRate?: number
  voicePitch?: number
  voiceVolume?: number
}

interface VoiceCommand {
  command: string
  variations: string[]
  action: () => void
}

export const useVoiceIntegration = (options: VoiceIntegrationOptions = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [commands, setCommands] = useState<VoiceCommand[]>([])
  
  const voiceConfig: VoiceConfig = {
    language: voiceService.getLanguageCode(options.language || 'english'),
    rate: options.voiceRate || 0.9,
    pitch: options.voicePitch || 1,
    volume: options.voiceVolume || 0.8
  }

  useEffect(() => {
    voiceService.setCallbacks({
      onResult: (transcript) => {
        if (options.enableCommands) {
          handleVoiceCommand(transcript)
        }
      },
      onError: (error) => {
        console.error('Voice recognition error:', error)
        setIsListening(false)
      },
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false)
    })

    voiceService.setLanguage(voiceConfig.language)
  }, [options.enableCommands, voiceConfig.language])

  const speak = useCallback(async (text: string, customConfig?: Partial<VoiceConfig>) => {
    if (!voiceEnabled || !voiceService.isSupported) return

    setIsSpeaking(true)
    try {
      await voiceService.speak(text, { ...voiceConfig, ...customConfig })
    } finally {
      setIsSpeaking(false)
    }
  }, [voiceEnabled, voiceConfig])

  const startListening = useCallback(async () => {
    if (!voiceEnabled || !voiceService.isSupported) return

    try {
      await voiceService.startListening()
    } catch (error) {
      console.error('Error starting voice recognition:', error)
      setIsListening(false)
    }
  }, [voiceEnabled])

  const stopListening = useCallback(() => {
    voiceService.stopListening()
  }, [])

  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking()
    setIsSpeaking(false)
  }, [])

  const addVoiceCommand = useCallback((command: VoiceCommand) => {
    setCommands(prev => [...prev, command])
  }, [])

  const removeVoiceCommand = useCallback((commandText: string) => {
    setCommands(prev => prev.filter(cmd => cmd.command !== commandText))
  }, [])

  const handleVoiceCommand = useCallback((transcript: string) => {
    const lowerTranscript = transcript.toLowerCase().trim()
    
    for (const command of commands) {
      const matches = [command.command.toLowerCase(), ...command.variations.map(v => v.toLowerCase())]
      
      if (matches.some(match => lowerTranscript.includes(match))) {
        command.action()
        break
      }
    }
  }, [commands])

  const readText = useCallback((text: string) => {
    if (options.autoRead && voiceEnabled) {
      speak(text)
    }
  }, [options.autoRead, voiceEnabled, speak])

  // Common practice voice commands
  const addCommonPracticeCommands = useCallback((callbacks: {
    onNext?: () => void
    onPrevious?: () => void
    onHint?: () => void
    onRepeat?: () => void
    onSubmit?: () => void
    onPause?: () => void
  }) => {
    const commonCommands: VoiceCommand[] = [
      {
        command: 'next',
        variations: ['next question', 'continue', 'skip'],
        action: callbacks.onNext || (() => {})
      },
      {
        command: 'previous',
        variations: ['back', 'go back', 'previous question'],
        action: callbacks.onPrevious || (() => {})
      },
      {
        command: 'hint',
        variations: ['give hint', 'help me', 'clue'],
        action: callbacks.onHint || (() => {})
      },
      {
        command: 'repeat',
        variations: ['repeat question', 'say again', 'read again'],
        action: callbacks.onRepeat || (() => {})
      },
      {
        command: 'submit',
        variations: ['submit answer', 'check answer', 'done'],
        action: callbacks.onSubmit || (() => {})
      },
      {
        command: 'pause',
        variations: ['stop', 'pause practice', 'take a break'],
        action: callbacks.onPause || (() => {})
      }
    ]

    commonCommands.forEach(cmd => addVoiceCommand(cmd))
  }, [addVoiceCommand])

  return {
    // State
    isListening,
    isSpeaking,
    voiceEnabled,
    isSupported: voiceService.isSupported,
    
    // Actions
    speak,
    startListening,
    stopListening,
    stopSpeaking,
    readText,
    setVoiceEnabled,
    
    // Commands
    addVoiceCommand,
    removeVoiceCommand,
    addCommonPracticeCommands,
    
    // Config
    voiceConfig
  }
}
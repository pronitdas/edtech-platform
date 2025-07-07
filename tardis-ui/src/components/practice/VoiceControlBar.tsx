import React from 'react'
import { motion } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface VoiceControlBarProps {
  isListening: boolean
  isSpeaking: boolean
  voiceEnabled: boolean
  isSupported: boolean
  onToggleListening: () => void
  onToggleSpeaking: () => void
  onToggleVoiceEnabled: () => void
  onShowHelp?: () => void
  className?: string
}

const VoiceControlBar: React.FC<VoiceControlBarProps> = ({
  isListening,
  isSpeaking,
  voiceEnabled,
  isSupported,
  onToggleListening,
  onToggleSpeaking,
  onToggleVoiceEnabled,
  onShowHelp,
  className = ''
}) => {
  if (!isSupported) {
    return (
      <div className={`flex items-center justify-center p-2 bg-gray-100 rounded-lg ${className}`}>
        <span className="text-sm text-gray-600">Voice features not supported in this browser</span>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <motion.div 
        className={`flex items-center gap-2 p-3 bg-white border rounded-lg shadow-sm ${className}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Voice Enable/Disable */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={voiceEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggleVoiceEnabled}
              className="flex items-center gap-1"
            >
              {voiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {voiceEnabled ? 'Disable voice features' : 'Enable voice features'}
          </TooltipContent>
        </Tooltip>

        {voiceEnabled && (
          <>
            {/* Listening Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={onToggleListening}
                  className="flex items-center gap-1"
                  disabled={!voiceEnabled}
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Mic className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isListening ? 'Stop voice recognition' : 'Start voice recognition'}
              </TooltipContent>
            </Tooltip>

            {/* Speaking Indicator/Control */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSpeaking ? "secondary" : "ghost"}
                  size="sm"
                  onClick={onToggleSpeaking}
                  disabled={!voiceEnabled}
                  className="flex items-center gap-1"
                >
                  {isSpeaking ? (
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Volume2 className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isSpeaking ? 'Speaking...' : 'Read Aloud'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSpeaking ? 'Stop reading' : 'Read content aloud'}
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Voice Commands Help */}
        {onShowHelp && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowHelp}
                className="flex items-center gap-1"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Voice Help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Show voice commands help
            </TooltipContent>
          </Tooltip>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className={`w-2 h-2 rounded-full ${
            !voiceEnabled ? 'bg-gray-400' :
            isListening ? 'bg-red-500' :
            isSpeaking ? 'bg-blue-500' :
            'bg-green-500'
          }`} />
          <span className="hidden md:inline">
            {!voiceEnabled ? 'Voice Disabled' :
             isListening ? 'Listening...' :
             isSpeaking ? 'Speaking...' :
             'Voice Ready'}
          </span>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}

export default VoiceControlBar
'use client'

import { useEffect, useRef, useState } from 'react'
import * as sdk from '@d-id/client-sdk' // Ensure this SDK is installed and available
import { stripMarkdown } from './utils'

// Define credentials and setup
const teacherId = 'agt_mSHLSjhZ' // Replace with your teacher ID
// const auth = { type: "basic" as const, username: "cHJvbml0NzhAZ21haWwuY29t", password: "3EImZlkfX4qYYKky4SYLx", }; // Use "key" as a constant literal type
const auth = {
  type: 'key' as const,
  clientKey:
    'Z29vZ2xlLW9hdXRoMnwxMDEyNTM3MTA4MTkyOTU5NDEyNjA6WGdmNkdPZUJYalo0dlU4Yko0UFU0',
} // Use "key" as a constant literal type

// Define stream options with strict type checking
const streamOptions: { compatibilityMode: 'auto'; streamWarmup: boolean } = {
  compatibilityMode: 'auto', // Check the SDK for valid options for CompatibilityMode
  streamWarmup: true,
}

const Teacher = () => {
  const [agentManager, setAgentManager] = useState<any>(null)
  const [connectionState, setConnectionState] = useState('Disconnected')
  const [srcObject, setSrcObject] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const initializeAgent = async () => {
      const callbacks = {
        onSrcObjectReady: (value: MediaStream) => {
          setSrcObject(value)
        },
        onConnectionStateChange: (state: string) => {
          setConnectionState(state)
          console.log('Connection State Changed: ', state)
        },
        onNewMessage: (messages: any[], type: string) => {
          const msg = messages[messages.length - 1]
          if (msg) {
            console.log(`[${msg.role || 'unknown'}] : ${msg.content || ''}`)
          }
        },
        onError: (error: Error) => {
          console.error('Error:', error)
        },
      }

      try {
        const manager = await sdk.createAgentManager(teacherId, {
          auth,
          callbacks,
          streamOptions,
        })
        setAgentManager(manager)
        manager.connect() // Connect WebRTC session
      } catch (error) {
        console.error('Error initializing agent:', error)
      }
    }
    initializeAgent()

    return () => {
      if (agentManager) {
        agentManager.disconnect() // Disconnect on component unmount
      }
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && srcObject) {
      videoRef.current.srcObject = srcObject
    }
  }, [srcObject])

  const speakText = (text = 'Hi there, I am here to educate you') => {
    if (agentManager && text.length > 2) {
      agentManager.speak({ type: 'text', input: stripMarkdown(text) })
    }
  }

  return (
    <div className='absolute bottom-0 right-0 text-white'>
      <div id='videoContainer  w-48 right-0' className='mt-4'>
        <video id='videoElement' ref={videoRef} autoPlay playsInline />
      </div>
      <button
        onClick={() => speakText()}
        className={`${connectionState == 'connected' ? 'bg-blue-500' : 'bg-red-500'} w-48 rounded py-2 font-bold text-white hover:bg-blue-700`}
        disabled={!agentManager || connectionState == 'connected'}
      >
        Speak Text
      </button>
    </div>
  )
}

export default Teacher

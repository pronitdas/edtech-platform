'use client'

import React, { useRef, useEffect } from 'react'
import { SlopeDrawingProps } from './types'
import { SlopeDrawingProvider } from './contexts/SlopeDrawingContext'
import SlopeDrawingLayout from './components/SlopeDrawingLayout'

const SlopeDrawing: React.FC<SlopeDrawingProps> = props => {
  // Pass the props directly to the context provider, which will handle all state management
  // The SlopeDrawingLayout component will use the context to render the UI
  return (
    <SlopeDrawingProvider
      interactiveContent={props.interactiveContent}
      {...(props.userId && { userId: props.userId })}
      {...(props.knowledgeId && { knowledgeId: props.knowledgeId })}
      {...(props.language && { language: props.language })}
      {...(props.onUpdateProgress && {
        onUpdateProgress: props.onUpdateProgress,
      })}
      {...(props.openaiClient && { openaiClient: props.openaiClient })}
    >
      <SlopeDrawingLayout />
    </SlopeDrawingProvider>
  )
}

export default SlopeDrawing

'use client';

import React, { useRef, useEffect } from 'react';
import { SlopeDrawingProps } from './types';
import { SlopeDrawingProvider } from './contexts/SlopeDrawingContext';
import SlopeDrawingLayout from './components/SlopeDrawingLayout';

const SlopeDrawing: React.FC<SlopeDrawingProps> = (props) => {
  // Pass the props directly to the context provider, which will handle all state management
  // The SlopeDrawingLayout component will use the context to render the UI
  return (
    <SlopeDrawingProvider
      interactiveContent={props.interactiveContent}
      userId={props.userId}
      knowledgeId={props.knowledgeId}
      language={props.language}
      onUpdateProgress={props.onUpdateProgress}
      openaiClient={props.openaiClient}
    >
      <SlopeDrawingLayout />
    </SlopeDrawingProvider>
  );
};

export default SlopeDrawing; 
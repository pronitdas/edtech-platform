import { useState, useEffect, useCallback } from 'react';

interface CognitiveLoadState {
  loadLevel: 'low' | 'medium' | 'high';
  errorCount: number;
  hesitationSeconds: number;
  idleTimeSeconds: number;
  lastActivityTimestamp: number;
}

export function useCognitiveLoad(idleThresholdSeconds: number = 60) {
  const [cognitiveState, setCognitiveState] = useState<CognitiveLoadState>({
    loadLevel: 'low',
    errorCount: 0,
    hesitationSeconds: 0,
    idleTimeSeconds: 0,
    lastActivityTimestamp: Date.now(),
  });

  // Track errors
  const recordError = useCallback(() => {
    setCognitiveState(prev => {
      const newErrorCount = prev.errorCount + 1;
      // Determine load level based on error count
      let newLoadLevel = prev.loadLevel;
      if (newErrorCount > 5) {
        newLoadLevel = 'high';
      } else if (newErrorCount > 2) {
        newLoadLevel = 'medium';
      }
      
      return {
        ...prev,
        errorCount: newErrorCount,
        loadLevel: newLoadLevel,
        lastActivityTimestamp: Date.now(),
      };
    });
  }, []);

  // Track hesitation (time spent on a single problem)
  const recordHesitation = useCallback((seconds: number) => {
    setCognitiveState(prev => {
      const newHesitationSeconds = prev.hesitationSeconds + seconds;
      // Determine load level based on hesitation time
      let newLoadLevel = prev.loadLevel;
      if (newHesitationSeconds > 120) { // 2 minutes of hesitation
        newLoadLevel = 'high';
      } else if (newHesitationSeconds > 60) { // 1 minute of hesitation
        newLoadLevel = 'medium';
      }
      
      return {
        ...prev,
        hesitationSeconds: newHesitationSeconds,
        loadLevel: newLoadLevel,
        lastActivityTimestamp: Date.now(),
      };
    });
  }, []);

  // Reset tracking for new session or task
  const resetTracking = useCallback(() => {
    setCognitiveState({
      loadLevel: 'low',
      errorCount: 0,
      hesitationSeconds: 0,
      idleTimeSeconds: 0,
      lastActivityTimestamp: Date.now(),
    });
  }, []);

  // Track user activity to detect idle time
  useEffect(() => {
    const activityHandler = () => {
      setCognitiveState(prev => ({
        ...prev,
        lastActivityTimestamp: Date.now(),
      }));
    };

    // Update idle time counter
    const idleInterval = setInterval(() => {
      setCognitiveState(prev => {
        const currentIdleTime = Math.floor((Date.now() - prev.lastActivityTimestamp) / 1000);
        
        // Only update if idle time has changed significantly
        if (Math.abs(currentIdleTime - prev.idleTimeSeconds) < 5) {
          return prev;
        }
        
        // Determine load level based on idle time
        let newLoadLevel = prev.loadLevel;
        if (currentIdleTime > idleThresholdSeconds * 1.5) {
          newLoadLevel = 'high'; // Extended idle might indicate cognitive overload
        } else if (currentIdleTime > idleThresholdSeconds) {
          newLoadLevel = 'medium';
        }
        
        return {
          ...prev,
          idleTimeSeconds: currentIdleTime,
          loadLevel: newLoadLevel,
        };
      });
    }, 5000); // Check every 5 seconds

    // Track various user activities
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);
    window.addEventListener('click', activityHandler);
    window.addEventListener('scroll', activityHandler);
    
    return () => {
      clearInterval(idleInterval);
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('scroll', activityHandler);
    };
  }, [idleThresholdSeconds]);

  return {
    cognitiveState,
    recordError,
    recordHesitation,
    resetTracking,
  };
} 
import { useEffect, useRef, useCallback } from "react";

interface UseInactivityTriggerProps {
  timeout: number; // in milliseconds
  onInactive: () => void;
  isEnabled: boolean;
  hasMessages: boolean; // Only trigger if conversation has started
}

export function useInactivityTrigger({
  timeout,
  onInactive,
  isEnabled,
  hasMessages,
}: UseInactivityTriggerProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRef = useRef(false);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only set up timer if enabled and conversation has started
    if (isEnabled && hasMessages && !hasTriggeredRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onInactive();
        }
      }, timeout);
    }
  }, [timeout, onInactive, isEnabled, hasMessages]);

  // Reset the triggered flag when messages change (user responded)
  useEffect(() => {
    if (hasMessages) {
      hasTriggeredRef.current = false;
      resetTimer();
    }
  }, [hasMessages, resetTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { resetTimer };
}

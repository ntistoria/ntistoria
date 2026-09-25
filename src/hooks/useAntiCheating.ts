import { useState, useEffect, useRef } from 'react';

interface UseAntiCheatingOptions {
  isActive: boolean;
  onViolation?: (count: number) => void;
}

export function useAntiCheating({ isActive, onViolation }: UseAntiCheatingOptions) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const switchCountRef = useRef(0);
  const prevIsActiveRef = useRef(false);

  useEffect(() => {
    // When switching from inactive to active (starting a new test/quiz), reset count
    if (isActive && !prevIsActiveRef.current) {
      switchCountRef.current = 0;
      setTabSwitchCount(0);
    }
    prevIsActiveRef.current = isActive;

    if (!isActive) {
      return;
    }

    // 1. Prevent text copying, cut, and right-click context menu
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const registerViolation = () => {
      switchCountRef.current += 1;
      setTabSwitchCount(switchCountRef.current);
      console.warn(`გვერდის დატოვება/ტაბის გადართვა დაფიქსირდა: ${switchCountRef.current}`);
      if (onViolation) {
        onViolation(switchCountRef.current);
      }
    };

    // 2. Tab switch / minimization detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation();
      }
    };

    // 3. Split-screen / window focus loss detection
    const handleWindowBlur = () => {
      if (!document.hidden) {
        registerViolation();
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive, onViolation]);

  const resetTabSwitches = () => {
    switchCountRef.current = 0;
    setTabSwitchCount(0);
  };

  return {
    tabSwitchCount,
    switchCountRef,
    resetTabSwitches
  };
}

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAntiCheatingOptions {
  isActive: boolean;
  onViolation?: (count: number) => void;
}

export function useAntiCheating({ isActive, onViolation }: UseAntiCheatingOptions) {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const switchCountRef = useRef(0);
  const prevIsActiveRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  // P5 FIX: Store onViolation in a ref so it's always current without being
  // in the useEffect dependency array. This prevents event listeners from
  // being detached/re-attached on every parent re-render.
  const onViolationRef = useRef(onViolation);
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    // When switching from inactive to active (starting a new test/quiz), reset count
    if (isActive && !prevIsActiveRef.current) {
      switchCountRef.current = 0;
      lastViolationTimeRef.current = 0;
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
      const now = Date.now();
      // Cooldown check: ignore duplicate events (blur + visibilitychange) occurring within 1.2s
      if (now - lastViolationTimeRef.current < 1200) {
        return;
      }
      lastViolationTimeRef.current = now;

      switchCountRef.current += 1;
      setTabSwitchCount(switchCountRef.current);
      console.warn(`გვერდის დატოვება/ტაბის გადართვა დაფიქსირდა: ${switchCountRef.current}`);
      // Call via ref — always up-to-date without being a dependency
      if (onViolationRef.current) {
        onViolationRef.current(switchCountRef.current);
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
  // P5 FIX: `onViolation` intentionally removed from deps — stored in onViolationRef above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const resetTabSwitches = useCallback(() => {
    switchCountRef.current = 0;
    setTabSwitchCount(0);
  }, []);

  return {
    tabSwitchCount,
    switchCountRef,
    resetTabSwitches
  };
}

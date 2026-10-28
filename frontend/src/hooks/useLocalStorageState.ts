import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to synchronize React state with browser localStorage.
 * Ensures local-first persistence across page reloads (F5).
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null && stored !== 'undefined') {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn(`[Integrum] Failed to parse localStorage key "${key}":`, err);
    }
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      if (state === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (err) {
      console.warn(`[Integrum] Failed to persist localStorage key "${key}":`, err);
    }
  }, [key, state]);

  return [state, setState];
}

'use client';

import { useState, useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T, skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initialState: T) => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Debounce timer for grouping rapid changes
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedState = useRef<T>(initialState);

  const setState = useCallback((newState: T, skipHistory: boolean = false) => {
    if (skipHistory) {
      setHistory(prev => ({
        ...prev,
        present: newState,
      }));
      return;
    }

    // Clear any pending debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce history saves (group rapid typing)
    debounceTimer.current = setTimeout(() => {
      setHistory(prev => {
        // Don't save if state hasn't changed significantly
        if (JSON.stringify(prev.present) === JSON.stringify(newState)) {
          return prev;
        }

        const newPast = [...prev.past, prev.present].slice(-maxHistory);
        lastSavedState.current = newState;

        return {
          past: newPast,
          present: newState,
          future: [], // Clear future on new change
        };
      });
    }, 300);

    // Immediately update present state for responsiveness
    setHistory(prev => ({
      ...prev,
      present: newState,
    }));
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const newPresent = prev.past[prev.past.length - 1];
      const newFuture = [prev.present, ...prev.future];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const newFuture = prev.future.slice(1);
      const newPresent = prev.future[0];
      const newPast = [...prev.past, prev.present];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
    lastSavedState.current = initialState;
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
  };
}


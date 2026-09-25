'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useRTL } from './useTranslation';

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  disabled?: boolean;
  /** If true, swipe directions are physical (left = finger moves left), ignoring RTL */
  ignoreRTL?: boolean;
  /**
   * When false, a touch tap does nothing - only a deliberate swipe acts. Mouse
   * clicks and the keyboard still call onTap, since they cannot swipe.
   */
  tapOnTouch?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  isDragging: boolean;
  direction: 'left' | 'right' | null;
}

// Timestamp of the most recent touch gesture anywhere in the app. Browsers fire
// a synthetic click ~300ms after touchend, at the original coordinates - which
// by then may be over a *different* item, because checking one off re-flows the
// list. Tracking this globally makes sure that click is ignored everywhere.
let lastTouchEndTimestamp = 0;
// Timestamp of the most recent completed swipe, so that other handlers (for
// example a card that opens on click) can ignore the click that follows it.
let lastSwipeTimestamp = 0;

export function didRecentSwipe(withinMs: number = 700): boolean {
  return Date.now() - lastSwipeTimestamp < withinMs;
}

export function useSwipeGesture(config: SwipeConfig) {
  const {
    threshold = 80,
    onSwipeLeft,
    onSwipeRight,
    onTap,
    disabled = false,
    ignoreRTL = false,
    tapOnTouch = true,
  } = config;
  
  const { isRTL } = useRTL();
  // Use physical direction when ignoreRTL is true
  const shouldFlip = !ignoreRTL && isRTL;
  const elementRef = useRef<HTMLDivElement>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    isDragging: false,
    direction: null,
  });
  const [translateX, setTranslateX] = useState(0);
  
  // Track if this was a tap (minimal movement)
  const isTapRef = useRef(true);
  const startTimeRef = useRef(0);
  const swipedRef = useRef(false);
  // Which way this touch is going, decided once on its first real movement.
  // A gesture that starts as a scroll stays a scroll, however much it drifts.
  const axisRef = useRef<'x' | 'y' | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      isDragging: true,
      direction: null,
    });
    isTapRef.current = true;
    axisRef.current = null;
    startTimeRef.current = Date.now();
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !swipeState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    
    // Any real movement, in either direction, means this is not a tap. Only
    // sideways movement used to count, so a quick flick to scroll the list
    // was read as a tap on the item under the thumb.
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      isTapRef.current = false;
      
      if (axisRef.current === null) {
        axisRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
      }
    }
    
    // Not moved enough to tell yet, or it is a scroll: leave it to the browser.
    // (The swipeable elements use touch-action: pan-y, so the browser scrolls
    // vertically and hands sideways movement to this handler.)
    if (axisRef.current !== 'x') {
      return;
    }
    
    // Determine direction (accounting for RTL unless ignoreRTL is true)
    let direction: 'left' | 'right' | null = null;
    if (deltaX < -10) {
      direction = shouldFlip ? 'right' : 'left';
    } else if (deltaX > 10) {
      direction = shouldFlip ? 'left' : 'right';
    }
    
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      direction,
    }));
    
    // Apply resistance at edges
    const maxTranslate = threshold * 1.5;
    const resistedDelta = Math.sign(deltaX) * Math.min(Math.abs(deltaX), maxTranslate);
    setTranslateX(resistedDelta);
  }, [disabled, swipeState.isDragging, swipeState.startX, swipeState.startY, threshold, shouldFlip]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const duration = Date.now() - startTimeRef.current;
    
    lastTouchEndTimestamp = Date.now();
    swipedRef.current = false;
    
    // Check if it was a tap (minimal movement and short duration)
    if (isTapRef.current && duration < 300) {
      if (tapOnTouch) onTap?.();
    } else if (axisRef.current !== 'x') {
      // A scroll, or a press held too long to be a tap: nothing to do
    } else {
      swipedRef.current = true;
      lastSwipeTimestamp = Date.now();
      // Check for swipe (accounting for RTL unless ignoreRTL is true)
      const effectiveDelta = shouldFlip ? -deltaX : deltaX;
      
      if (effectiveDelta < -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (effectiveDelta > threshold && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    // Reset state
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      isDragging: false,
      direction: null,
    });
    setTranslateX(0);
  }, [disabled, swipeState, threshold, onSwipeLeft, onSwipeRight, onTap, shouldFlip, tapOnTouch]);

  // Click handler for pointer devices (mouse, keyboard activation). Clicks that
  // the browser synthesises right after a touch gesture are ignored, otherwise a
  // single tap would trigger onTap twice (once from touchend, once from click).
  const handleClick = useCallback(() => {
    if (disabled) return;
    if (Date.now() - lastTouchEndTimestamp < 700) return;
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    onTap?.();
  }, [disabled, onTap]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setTranslateX(0);
    };
  }, []);

  return {
    ref: elementRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick,
    },
    state: {
      isDragging: swipeState.isDragging,
      direction: swipeState.direction,
      translateX,
      progress: Math.abs(translateX) / threshold,
    },
  };
}

// Hook for detecting swipe direction (simpler version)
export function useSwipeDirection(onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void) {
  const { isRTL } = useRTL();
  const startRef = useRef({ x: 0, y: 0 });
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;
    
    const minSwipe = 50;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipe) {
        const direction = deltaX > 0 
          ? (isRTL ? 'left' : 'right')
          : (isRTL ? 'right' : 'left');
        onSwipe(direction);
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipe) {
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    }
  }, [onSwipe, isRTL]);
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}


'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useRTL } from './useTranslation';

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  disabled?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  isDragging: boolean;
  direction: 'left' | 'right' | null;
}

export function useSwipeGesture(config: SwipeConfig) {
  const {
    threshold = 80,
    onSwipeLeft,
    onSwipeRight,
    onTap,
    disabled = false,
  } = config;
  
  const { isRTL } = useRTL();
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
    startTimeRef.current = Date.now();
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !swipeState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    
    // If vertical movement is greater, don't handle horizontal swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaX) < 10) {
      return;
    }
    
    // Prevent default to stop scrolling when swiping horizontally
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
      isTapRef.current = false;
    }
    
    // Determine direction (accounting for RTL)
    let direction: 'left' | 'right' | null = null;
    if (deltaX < -10) {
      direction = isRTL ? 'right' : 'left';
    } else if (deltaX > 10) {
      direction = isRTL ? 'left' : 'right';
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
  }, [disabled, swipeState.isDragging, swipeState.startX, swipeState.startY, threshold, isRTL]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const duration = Date.now() - startTimeRef.current;
    
    // Check if it was a tap (minimal movement and short duration)
    if (isTapRef.current && Math.abs(deltaX) < 10 && duration < 300) {
      onTap?.();
    } else {
      // Check for swipe (accounting for RTL)
      const effectiveDelta = isRTL ? -deltaX : deltaX;
      
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
  }, [disabled, swipeState, threshold, onSwipeLeft, onSwipeRight, onTap, isRTL]);

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


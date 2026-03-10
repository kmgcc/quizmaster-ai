import { useEffect, useRef, useCallback } from 'react';

interface GlowElement extends HTMLElement {
  _glowCleanup?: () => void;
}

/**
 * Global glow manager - singleton pattern
 * Uses one global pointermove listener for performance
 * Only updates CSS variables on the currently hovered element
 */
class GlowManager {
  private static instance: GlowManager | null = null;
  private activeElement: GlowElement | null = null;
  private rafId: number | null = null;
  private isThrottled: boolean = false;
  private lastMouseEvent: PointerEvent | null = null;

  // Check for reduced motion preference
  private prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Check for coarse pointer (touch devices)
  private isCoarsePointer = typeof window !== 'undefined'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;

  private constructor() {
    if (typeof window !== 'undefined' && !this.isCoarsePointer && !this.prefersReducedMotion) {
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    }
  }

  static getInstance(): GlowManager {
    if (!GlowManager.instance) {
      GlowManager.instance = new GlowManager();
    }
    return GlowManager.instance;
  }

  private handlePointerMove = (e: PointerEvent) => {
    this.lastMouseEvent = e;
    
    if (this.isThrottled || !this.activeElement) return;
    
    this.isThrottled = true;
    this.rafId = requestAnimationFrame(() => {
      this.isThrottled = false;
      if (this.lastMouseEvent && this.activeElement) {
        this.updateGlowPosition(this.lastMouseEvent, this.activeElement);
      }
    });
  };

  private updateGlowPosition(e: PointerEvent, element: GlowElement) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Use pixel values for more precise positioning
    element.style.setProperty('--glow-x', `${x}px`);
    element.style.setProperty('--glow-y', `${y}px`);
  }

  register(element: GlowElement) {
    if (this.isCoarsePointer || this.prefersReducedMotion) return;

    const handleEnter = (e: PointerEvent) => {
      this.activeElement = element;
      this.updateGlowPosition(e, element);
    };

    const handleLeave = () => {
      if (this.activeElement === element) {
        this.activeElement = null;
      }
    };

    element.addEventListener('pointerenter', handleEnter);
    element.addEventListener('pointerleave', handleLeave);

    // Store cleanup function on the element
    element._glowCleanup = () => {
      element.removeEventListener('pointerenter', handleEnter);
      element.removeEventListener('pointerleave', handleLeave);
    };
  }

  unregister(element: GlowElement) {
    if (element._glowCleanup) {
      element._glowCleanup();
      delete element._glowCleanup;
    }
    if (this.activeElement === element) {
      this.activeElement = null;
    }
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.handlePointerMove);
    }
    GlowManager.instance = null;
  }
}

/**
 * Hook to enable glow effect on a referenced element
 * Usage:
 * const ref = useGlow<HTMLDivElement>();
 * return <div ref={ref} data-glow>...</div>;
 */
export function useGlow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const managerRef = useRef<GlowManager | null>(null);

  useEffect(() => {
    managerRef.current = GlowManager.getInstance();
    
    if (ref.current) {
      managerRef.current.register(ref.current as GlowElement);
    }

    return () => {
      if (ref.current) {
        managerRef.current?.unregister(ref.current as GlowElement);
      }
    };
  }, []);

  return ref;
}

/**
 * Utility to manually register/unregister an element for glow
 * Use when you can't use the hook (e.g., dynamic elements)
 */
export const glowUtils = {
  register: (element: HTMLElement) => {
    GlowManager.getInstance().register(element as GlowElement);
  },
  unregister: (element: HTMLElement) => {
    GlowManager.getInstance().unregister(element as GlowElement);
  },
};

export default GlowManager;

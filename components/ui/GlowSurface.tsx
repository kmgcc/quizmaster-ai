import React, { useRef, useEffect, forwardRef } from 'react';
import { glowUtils } from '../../hooks/useGlowManager';

type GlowSurfaceProps = {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  glowSize?: number;
  glowOpacity?: number;
  borderSize?: number;
  borderOpacity?: number;
  disabled?: boolean;
  [key: string]: any;
};

/**
 * GlowSurface - A wrapper component that adds mouse-following glow effect
 * 
 * Features:
 * - Mouse-centered radial gradient glow
 * - Border highlight that respects parent's border-radius
 * - Works with any border-radius: rounded-full, rounded-2xl, rounded-3xl, etc.
 * - Performance optimized with requestAnimationFrame throttling
 * - Respects prefers-reduced-motion and coarse pointer devices
 * 
 * Usage:
 * <GlowSurface as="button" className="rounded-full px-4 py-2">
 *   Click me
 * </GlowSurface>
 * 
 * <GlowSurface as="div" className="rounded-2xl p-6" glowSize={200}>
 *   Card content
 * </GlowSurface>
 */
export const GlowSurface = forwardRef<HTMLElement, GlowSurfaceProps>(
  (
    {
      as: Component = 'div',
      children,
      className = '',
      glowSize = 150,
      glowOpacity = 0.08,
      borderSize = 2,
      borderOpacity = 0.6,
      disabled = false,
      ...props
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLElement>(null);
    const elementRef = (forwardedRef || innerRef) as React.MutableRefObject<HTMLElement>;

    useEffect(() => {
      if (disabled || !elementRef.current) return;

      const element = elementRef.current;
      glowUtils.register(element);

      return () => {
        glowUtils.unregister(element);
      };
    }, [disabled]);

    const glowVars = {
      '--glow-size': `${glowSize}px`,
      '--glow-opacity': glowOpacity,
      '--glow-border-size': `${borderSize}px`,
      '--glow-border-opacity': borderOpacity,
    } as React.CSSProperties;

    return React.createElement(
      Component,
      {
        ref: elementRef,
        className: `relative overflow-hidden ${className}`,
        'data-glow': !disabled ? '' : undefined,
        style: glowVars,
        ...props,
      },
      <>
        {/* Inner glow overlay */}
        {!disabled && (
          <span
            className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(var(--glow-size) circle at var(--glow-x) var(--glow-y), rgba(var(--theme-rgb), var(--glow-opacity)), transparent 100%)`,
              borderRadius: 'inherit',
            }}
          />
        )}
        {/* Border glow overlay */}
        {!disabled && (
          <span
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(calc(var(--glow-size) * 0.8) circle at var(--glow-x) var(--glow-y), rgba(var(--theme-rgb), var(--glow-border-opacity)), transparent 100%)`,
              padding: 'var(--glow-border-size)',
              borderRadius: 'inherit',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
            }}
          />
        )}
        {/* Content wrapper */}
        <span className="relative z-20">{children}</span>
      </>
    );
  }
);

GlowSurface.displayName = 'GlowSurface';

/**
 * Simplified glow component for buttons
 * Pre-configured with button-appropriate defaults
 */
export const GlowButton = forwardRef<HTMLButtonElement, Omit<GlowSurfaceProps, 'as'>>(
  (props, ref) => (
    <GlowSurface
      ref={ref}
      as="button"
      glowSize={100}
      glowOpacity={0.1}
      borderSize={2}
      borderOpacity={0.8}
      {...props}
    />
  )
);

GlowButton.displayName = 'GlowButton';

/**
 * Simplified glow component for cards
 * Pre-configured with card-appropriate defaults
 */
export const GlowCard = forwardRef<HTMLDivElement, Omit<GlowSurfaceProps, 'as'>>(
  (props, ref) => (
    <GlowSurface
      ref={ref}
      as="div"
      glowSize={250}
      glowOpacity={0.06}
      borderSize={1}
      borderOpacity={0.5}
      {...props}
    />
  )
);

GlowCard.displayName = 'GlowCard';

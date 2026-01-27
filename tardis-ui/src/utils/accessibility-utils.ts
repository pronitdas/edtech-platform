/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance utilities
 */

import { useCallback, useEffect, useRef } from 'react';

// Color contrast utilities
export const colorContrastRatios = {
  // Common color pairs (foreground, background)
  'white-on-blue': { ratio: 7.5, fg: '#ffffff', bg: '#3b82f6' },
  'white-on-dark': { ratio: 16.0, fg: '#ffffff', bg: '#0f172a' },
  'black-on-white': { ratio: 21.0, fg: '#000000', bg: '#ffffff' },
  'gray-400-on-gray-900': { ratio: 4.5, fg: '#9ca3af', bg: '#111827' },
  'gray-300-on-gray-800': { ratio: 4.8, fg: '#d1d5db', bg: '#1f2937' },
};

// WCAG contrast ratio requirements
export const contrastRequirements = {
  AA: {
    normal: 4.5,
    large: 3.0,
  },
  AAA: {
    normal: 7.0,
    large: 4.5,
  },
};

/**
 * Calculate relative luminance
 */
export const getRelativeLuminance = (hexColor: string): number => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Check if contrast meets WCAG requirements
 */
export const meetsContrastRequirements = (
  fg: string,
  bg: string,
  size: 'normal' | 'large' = 'normal',
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = getContrastRatio(fg, bg);
  const required = contrastRequirements[level][size];
  return ratio >= required;
};

/**
 * Focus trap hook for modals and dialogs
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Skip link hook for keyboard navigation
 */
export const useSkipLink = (targetId: string, label: string = 'Skip to main content') => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    target?.focus();
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [targetId]);

  return { handleClick, label };
};

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0;
export const generateA11yId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${++idCounter}`;
};

/**
 * Live region hook for announcements
 */
export const useLiveRegion = (defaultMessage: string = '') => {
  const [message, setMessage] = useState<string>(defaultMessage);
  const regionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((newMessage: string, priority: 'polite' | 'assertive' = 'polite') => {
    setMessage('');
    setTimeout(() => {
      setMessage(newMessage);
    }, 50);
  }, []);

  return { regionRef, message, announce };
};

import { useState } from 'react';

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey && !shortcut.ctrl;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey && !shortcut.alt;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey && !shortcut.shift;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey && !shortcut.meta;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Reduced motion preference hook
 */
export const useReducedMotion = (): boolean => {
  const mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  const getInitialValue = () => mediaQuery?.matches ?? false;

  const [reducedMotion, setReducedMotion] = useState(getInitialValue);

  useEffect(() => {
    if (!mediaQuery) return;

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mediaQuery]);

  return reducedMotion;
};

/**
 * High contrast mode detection
 */
export const useHighContrastMode = (): boolean => {
  const mediaQuery = typeof window !== 'undefined'
    ? window.matchMedia('(forced-colors: active)')
    : null;

  const getInitialValue = () => mediaQuery?.matches ?? false;

  const [highContrast, setHighContrast] = useState(getInitialValue);

  useEffect(() => {
    if (!mediaQuery) return;

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mediaQuery]);

  return highContrast;
};

/**
 * ARIA attributes for form validation
 */
export interface ValidationA11y {
  errorId: string;
  describedById: string;
  ariaInvalid: boolean;
  ariaRequired: boolean;
  ariaDescribedBy: string;
}

/**
 * Hook for managing form validation accessibility
 */
export const useFormValidationA11y = (
  isInvalid: boolean,
  errorMessage: string,
  describedBy: string[] = []
): ValidationA11y => {
  const errorId = `error-${generateA11yId()}`;
  const describedById = describedBy.join(' ') || undefined;

  return {
    errorId,
    describedById: describedById || '',
    ariaInvalid: isInvalid,
    ariaRequired: true,
    ariaDescribedBy: [errorId, ...describedBy].filter(Boolean).join(' ') || undefined,
  };
};

/**
 * Focus management for interactive components
 */
export const useFocusManagement = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement>,
  containerRef: React.RefObject<HTMLElement>
) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement as HTMLElement;

    const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      previousActiveElement?.focus();
    };
  }, [isOpen, containerRef]);
};

/**
 * Visually hidden styles for screen readers
 */
export const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export default {
  getContrastRatio,
  getRelativeLuminance,
  hexToRgb,
  meetsContrastRequirements,
  useFocusTrap,
  useSkipLink,
  announceToScreenReader,
  useLiveRegion,
  useKeyboardShortcuts,
  useReducedMotion,
  useHighContrastMode,
  useFormValidationA11y,
  useFocusManagement,
  VisuallyHidden,
};

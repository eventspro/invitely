import { useEffect, useRef } from 'react';
import { optimizeArmenianText, getArmenianTextStyles, containsArmenianText } from '@/utils/font-utils';

/**
 * Hook to automatically optimize Armenian text rendering
 */
export function useArmenianFont<T extends HTMLElement>(
  text: string | undefined | null,
  fontName?: string
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (elementRef.current && text && containsArmenianText(text)) {
      optimizeArmenianText(elementRef.current);
      
      // Apply Armenian-specific styles
      const styles = getArmenianTextStyles(fontName);
      Object.assign(elementRef.current.style, styles);
    }
  }, [text, fontName]);

  return elementRef;
}

/**
 * Hook to get Armenian-optimized styles for React components
 */
export function useArmenianTextStyles(fontName?: string) {
  return getArmenianTextStyles(fontName);
}
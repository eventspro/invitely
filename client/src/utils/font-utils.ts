/**
 * Font utilities for Armenian-compatible font handling
 */

export interface FontConfig {
  heading?: string;
  body?: string;
}

/**
 * Armenian-compatible font mappings with proper fallbacks
 */
export const ARMENIAN_FONT_MAPPINGS = {
  // Armenian-specific fonts - prioritize Armenian fonts first
  'Noto Sans Armenian': '"Noto Sans Armenian", "Armenian Fallback", Arial Unicode MS, Arial, sans-serif',
  'Noto Serif Armenian': '"Noto Serif Armenian", "Armenian Fallback", "Times New Roman", serif',
  
  // Armenian-compatible fonts with Armenian subset support
  'Roboto': '"Noto Sans Armenian", Roboto, "Armenian Fallback", Arial, sans-serif',
  'Open Sans': '"Noto Sans Armenian", "Open Sans", "Armenian Fallback", Arial, sans-serif',
  'Lato': '"Noto Sans Armenian", Lato, "Armenian Fallback", Arial, sans-serif',
  'Montserrat': '"Noto Sans Armenian", Montserrat, "Armenian Fallback", Arial, sans-serif',
  'Source Sans Pro': '"Noto Sans Armenian", "Source Sans Pro", "Armenian Fallback", Arial, sans-serif',
  'PT Sans': '"Noto Sans Armenian", "PT Sans", "Armenian Fallback", Arial, sans-serif',
  'Ubuntu': '"Noto Sans Armenian", Ubuntu, "Armenian Fallback", Arial, sans-serif',
  'Playfair Display': '"Noto Serif Armenian", "Playfair Display", "Armenian Fallback", Georgia, serif',
  'Merriweather': '"Noto Serif Armenian", Merriweather, "Armenian Fallback", Georgia, serif',
  
  // Standard fallbacks
  'Inter': '"Noto Sans Armenian", Inter, "Armenian Fallback", Arial, sans-serif',
} as const;

/**
 * Get the full font family string with proper fallbacks for Armenian text
 */
export function getFontFamily(fontName?: string): string {
  if (!fontName) {
    return ARMENIAN_FONT_MAPPINGS['Noto Sans Armenian'];
  }
  
  return ARMENIAN_FONT_MAPPINGS[fontName as keyof typeof ARMENIAN_FONT_MAPPINGS] || `${fontName}, Arial, sans-serif`;
}

/**
 * Get heading font with Armenian support
 */
export function getHeadingFont(fonts?: FontConfig): string {
  return getFontFamily(fonts?.heading || 'Noto Serif Armenian');
}

/**
 * Get body font with Armenian support
 */
export function getBodyFont(fonts?: FontConfig): string {
  return getFontFamily(fonts?.body || 'Noto Sans Armenian');
}

/**
 * Apply font styles to an element with Armenian support
 */
export function applyFontStyles(element: HTMLElement, fontName?: string): void {
  if (element) {
    element.style.fontFamily = getFontFamily(fontName);
  }
}

/**
 * Get font style object for React components
 */
export function getFontStyles(fontName?: string): { fontFamily: string } {
  return {
    fontFamily: getFontFamily(fontName)
  };
}

/**
 * Armenian font recommendations for different use cases
 */
export const ARMENIAN_FONT_RECOMMENDATIONS = {
  heading: {
    elegant: 'Noto Serif Armenian',
    modern: 'Noto Sans Armenian',
    classic: 'Playfair Display',
    bold: 'Montserrat',
    friendly: 'Open Sans'
  },
  body: {
    readable: 'Noto Sans Armenian',
    classic: 'Noto Serif Armenian',
    modern: 'Roboto',
    friendly: 'Open Sans',
    warm: 'Lato'
  }
} as const;

/**
 * Detect if text contains Armenian characters
 */
export function containsArmenianText(text: string): boolean {
  // Armenian Unicode range: U+0530-058F, U+FB13-FB17
  const armenianRegex = /[\u0530-\u058F\uFB13-\uFB17]/;
  return armenianRegex.test(text);
}

/**
 * Apply Armenian-specific text rendering optimizations
 */
export function optimizeArmenianText(element: HTMLElement): void {
  if (element && element.textContent && containsArmenianText(element.textContent)) {
    // Add Armenian-specific CSS classes
    element.classList.add('armenian-text');
    
    // Ensure proper font rendering
    element.style.fontFeatureSettings = '"kern" 1, "liga" 1';
    element.style.textRendering = 'optimizeLegibility';
    element.style.fontVariantLigatures = 'common-ligatures';
    
    // Force font family if not already set
    if (!element.style.fontFamily) {
      element.style.fontFamily = getFontFamily('Noto Sans Armenian');
    }
  }
}

/**
 * Create a style object for Armenian text rendering
 */
export function getArmenianTextStyles(fontName?: string): React.CSSProperties {
  return {
    fontFamily: getFontFamily(fontName || 'Noto Sans Armenian'),
    fontFeatureSettings: '"kern" 1, "liga" 1',
    textRendering: 'optimizeLegibility',
    fontVariantLigatures: 'common-ligatures',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  };
}
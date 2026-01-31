/**
 * Translation Coverage Scanner
 * 
 * Scans the rendered DOM for visible text nodes and validates that all user-visible
 * text is backed by data-i18n-key attributes.
 * 
 * This enforces 100% translation coverage.
 */

export interface MissingTranslationKey {
  element: HTMLElement;
  text: string;
  xpath: string;
  parentTag: string;
  className: string;
}

export interface ScanResult {
  totalTextNodes: number;
  translatedNodes: number;
  missingKeys: MissingTranslationKey[];
  coveragePercentage: number;
}

/**
 * Check if an element or its parents have a data-i18n-key attribute
 */
function hasTranslationKey(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  
  // Check up to 3 levels up the tree
  for (let i = 0; i < 3 && current; i++) {
    if (current.hasAttribute('data-i18n-key')) {
      return true;
    }
    current = current.parentElement;
  }
  
  return false;
}

/**
 * Check if a node should be excluded from scanning
 */
function shouldExcludeNode(node: Node): boolean {
  const element = node.parentElement;
  if (!element) return true;
  
  // Exclude specific elements
  const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'DEFS'];
  if (excludedTags.includes(element.tagName)) return true;
  
  // Exclude hidden elements
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return true;
  }
  
  // Exclude aria-hidden elements
  if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') {
    return true;
  }
  
  // Exclude data-testid elements (test identifiers)
  if (element.hasAttribute('data-testid')) return true;
  
  // Exclude elements with specific classes (e.g., icons, decorative elements)
  const excludedClasses = ['lucide', 'icon', 'emoji'];
  const classList = element.className.toString();
  if (excludedClasses.some(cls => classList.includes(cls))) return true;
  
  return false;
}

/**
 * Check if text content is meaningful (not just whitespace, numbers, or symbols)
 */
function isMeaningfulText(text: string): boolean {
  const trimmed = text.trim();
  
  // Empty or whitespace-only
  if (trimmed.length === 0) return false;
  
  // Only numbers, punctuation, or symbols (simplified for ES5)
  if (/^[\d\s.,!?;:'"-]+$/.test(trimmed)) return false;
  
  // Common non-translatable patterns
  const nonTranslatablePatterns = [
    /^[0-9]+$/, // Pure numbers
    /^[0-9,. ]+$/, // Numbers with separators
    /^[+\-*/=<>]+$/, // Operators
    /^[©®™]+$/, // Copyright symbols
  ];
  
  if (nonTranslatablePatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }
  
  // Must contain at least one letter (A-Z, a-z, and common international letters)
  if (!/[a-zA-ZÀ-ÿА-яԱ-Ֆա-ֆ]/.test(trimmed)) return false;
  
  // Minimum length threshold (exclude single letters)
  if (trimmed.length < 2) return false;
  
  return true;
}

/**
 * Get XPath for an element (for debugging)
 */
function getElementXPath(element: HTMLElement): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling: Element | null = current.previousElementSibling;
    
    while (sibling) {
      if (sibling.nodeName === current.nodeName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }
    
    const tagName = current.nodeName.toLowerCase();
    const nth = index > 0 ? `[${index + 1}]` : '';
    parts.unshift(tagName + nth);
    
    current = current.parentElement;
  }
  
  return '/' + parts.join('/');
}

/**
 * Scan the DOM for missing translation keys
 */
export function scanTranslationCoverage(rootElement: HTMLElement = document.body): ScanResult {
  const missingKeys: MissingTranslationKey[] = [];
  let totalTextNodes = 0;
  let translatedNodes = 0;
  
  // Use TreeWalker to efficiently traverse all text nodes
  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (shouldExcludeNode(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        const text = node.textContent || '';
        if (isMeaningfulText(text)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  // Collect all meaningful text nodes
  const textNodes: Node[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  
  // Analyze each text node
  for (const textNode of textNodes) {
    const element = textNode.parentElement;
    if (!element) continue;
    
    totalTextNodes++;
    
    if (hasTranslationKey(element)) {
      translatedNodes++;
    } else {
      // Missing translation key!
      missingKeys.push({
        element,
        text: (textNode.textContent || '').trim(),
        xpath: getElementXPath(element),
        parentTag: element.tagName,
        className: element.className.toString()
      });
    }
  }
  
  const coveragePercentage = totalTextNodes > 0 
    ? Math.round((translatedNodes / totalTextNodes) * 100) 
    : 100;
  
  return {
    totalTextNodes,
    translatedNodes,
    missingKeys,
    coveragePercentage
  };
}

/**
 * Log missing translation keys to console (development mode)
 */
export function logMissingKeys(scanResult: ScanResult): void {
  if (scanResult.missingKeys.length === 0) {
    console.log(
      '%c✓ Translation Coverage: 100%',
      'color: #10b981; font-weight: bold; font-size: 14px;'
    );
    return;
  }
  
  console.group(
    `%c⚠ Translation Coverage: ${scanResult.coveragePercentage}%`,
    'color: #f59e0b; font-weight: bold; font-size: 14px;'
  );
  
  console.log(
    `Found ${scanResult.missingKeys.length} text nodes without data-i18n-key attributes:`
  );
  
  scanResult.missingKeys.forEach((missing, index) => {
    console.group(`${index + 1}. "${missing.text}"`);
    console.log('Element:', missing.element);
    console.log('Tag:', missing.parentTag);
    console.log('Class:', missing.className);
    console.log('XPath:', missing.xpath);
    console.groupEnd();
  });
  
  console.groupEnd();
}

/**
 * Highlight missing translation keys in the DOM (visual debugging)
 */
export function highlightMissingKeys(scanResult: ScanResult): void {
  // Remove existing highlights
  document.querySelectorAll('.translation-missing-highlight').forEach(el => {
    el.classList.remove('translation-missing-highlight');
  });
  
  // Add highlights to missing keys
  scanResult.missingKeys.forEach(missing => {
    missing.element.classList.add('translation-missing-highlight');
    missing.element.setAttribute('title', `Missing translation key: "${missing.text}"`);
  });
  
  // Inject CSS for highlighting (if not already present)
  if (!document.getElementById('translation-highlight-styles')) {
    const style = document.createElement('style');
    style.id = 'translation-highlight-styles';
    style.textContent = `
      .translation-missing-highlight {
        outline: 2px dashed #ef4444 !important;
        background-color: rgba(239, 68, 68, 0.1) !important;
        position: relative !important;
      }
      
      .translation-missing-highlight::before {
        content: "⚠";
        position: absolute;
        top: -8px;
        left: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Remove all visual highlights
 */
export function clearHighlights(): void {
  document.querySelectorAll('.translation-missing-highlight').forEach(el => {
    el.classList.remove('translation-missing-highlight');
    el.removeAttribute('title');
  });
}

/**
 * React hook for translation coverage scanning
 */
export function useScanTranslationCoverage(enabled: boolean = true) {
  if (typeof window === 'undefined') return null;
  
  if (!enabled) return null;
  
  // Run scan after DOM is fully rendered
  const scan = () => {
    // Small delay to ensure React has finished rendering
    setTimeout(() => {
      const result = scanTranslationCoverage();
      
      // Log in development mode
      if (process.env.NODE_ENV === 'development') {
        logMissingKeys(result);
      }
      
      return result;
    }, 1000);
  };
  
  return { scan, highlightMissingKeys, clearHighlights };
}

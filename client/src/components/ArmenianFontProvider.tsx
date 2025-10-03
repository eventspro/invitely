import React, { useEffect } from 'react';

/**
 * Component to inject global Armenian font styles and optimization
 */
export const ArmenianFontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    let hasLogged = false;
    
    // Armenian text detection
    const armenianRegex = /[\u0530-\u058F\uFB13-\uFB17]/;
    
    // Force apply Armenian fonts immediately
    function forceArmenianFonts() {
      const allElements = document.querySelectorAll('*');
      let processed = 0;
      
      allElements.forEach((el: Element) => {
        const textContent = el.textContent || '';
        if (textContent && armenianRegex.test(textContent)) {
          const htmlEl = el as HTMLElement;
          // Use system fonts that are more likely to support Armenian
          htmlEl.style.fontFamily = 'Arial Unicode MS, Lucida Grande, Sylfaen, Arial, sans-serif';
          htmlEl.style.setProperty('font-family', 'Arial Unicode MS, Lucida Grande, Sylfaen, Arial, sans-serif', 'important');
          htmlEl.classList.add('armenian-text-forced');
          processed++;
        }
      });
      
      // Only log once and only in development
      if (process.env.NODE_ENV === 'development' && !hasLogged && processed > 0) {
        console.log('🔧 ArmenianFontProvider: Initialized with', processed, 'elements');
        hasLogged = true;
      }
      return processed;
    }
    
    // Create and inject global Armenian font styles with timestamp to force refresh
    const timestamp = Date.now();
    const styleId = `armenian-font-global-styles-${timestamp}`;
    
    // Remove ALL existing Armenian styles - force clean slate
    const existingStyles = document.querySelectorAll(`[id*="armenian-font"], style[data-armenian]`);
    existingStyles.forEach(style => style.remove());

    // Create new style element with data attribute for cleanup
    const style = document.createElement('style');
    style.id = styleId;
    style.setAttribute('data-armenian', 'true');
    style.textContent = `
      /* Emergency Armenian font fixes */
      .armenian-text-forced,
      .armenian-text,
      [lang="hy"],
      [data-lang="armenian"] {
        font-family: Arial Unicode MS, Lucida Grande, Sylfaen, Arial, sans-serif !important;
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        unicode-bidi: isolate !important;
      }

      /* CRITICAL: Override ALL text-charcoal colors globally - platform only */
      .text-charcoal {
        color: var(--dynamic-text-color) !important;
      }
      
      .text-charcoal\\/70 {
        color: var(--dynamic-text-color-70) !important;
      }
      
      .text-charcoal\\/60 {
        color: var(--dynamic-text-color-60) !important;
      }
      
      /* Override text-charcoal for Armenian text specifically */
      .armenian-text-forced.text-charcoal,
      .text-charcoal.armenian-text-forced {
        color: var(--dynamic-text-color) !important;
      }
      
      /* Theme-aware countdown text colors */
      .countdown-text.armenian-text {
        color: var(--dynamic-text-color, white) !important;
      }
      
      .countdown-text-muted.armenian-text {
        color: var(--dynamic-text-color-70, rgba(255, 255, 255, 0.9)) !important;
      }

      /* Force system fonts for all text elements */
      p, span, div, h1, h2, h3, h4, h5, h6, label, input, textarea, button {
        font-family: Arial Unicode MS, Lucida Grande, Sylfaen, Arial, sans-serif;
      }

      /* Ensure visibility */
      .font-loading, .fonts-loaded {
        visibility: visible !important;
      }

      /* Armenian character specific styling */
      *:lang(hy) {
        font-family: Arial Unicode MS, Lucida Grande, Sylfaen, Arial, sans-serif !important;
      }

      /* Force proper rendering for Armenian Unicode range */
      @supports (unicode-range: U+0530-058F) {
        .armenian-text-forced {
          unicode-bidi: isolate;
          direction: ltr;
        }
      }
    `;

    // Append to head
    document.head.appendChild(style);
    
    // Debug: Log the injected CSS
    console.log('🔧 ArmenianFontProvider: Injected styles:', style.textContent.substring(0, 200) + '...');

    // Force apply fonts immediately
    forceArmenianFonts();

    // Add global class to body
    document.body.classList.add('armenian-optimized');

    // Monitor for new content (throttled)
    let updateTimeout: NodeJS.Timeout | null = null;
    
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent || '';
              if (armenianRegex.test(text)) {
                needsUpdate = true;
              }
            }
          });
        }
      });
      
      if (needsUpdate && !updateTimeout) {
        updateTimeout = setTimeout(() => {
          forceArmenianFonts();
          updateTimeout = null;
        }, 100); // Throttle updates
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Apply fonts initially and once more after a delay
    forceArmenianFonts();
    setTimeout(forceArmenianFonts, 500);

    // Cleanup function
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      // Clean up all Armenian styles
      const styleElements = document.querySelectorAll(`[id*="armenian-font"], style[data-armenian]`);
      styleElements.forEach(style => style.remove());
      document.body.classList.remove('armenian-optimized');
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default ArmenianFontProvider;

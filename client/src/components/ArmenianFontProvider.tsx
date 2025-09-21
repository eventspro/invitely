import React, { useEffect } from 'react';

/**
 * Component to inject global Armenian font styles and optimization
 */
export const ArmenianFontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    console.log('🔧 ArmenianFontProvider: Initializing...');
    
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
      
      console.log(`🔧 Forced Armenian fonts on ${processed} elements`);
      return processed;
    }
    
    // Create and inject global Armenian font styles
    const styleId = 'armenian-font-global-styles';
    
    // Remove existing styles if any
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = styleId;
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

    // Force apply fonts immediately
    forceArmenianFonts();

    // Add global class to body
    document.body.classList.add('armenian-optimized');

    // Monitor for new content
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
      
      if (needsUpdate) {
        setTimeout(forceArmenianFonts, 10);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Apply fonts periodically for the first few seconds
    const intervals = [100, 500, 1000, 2000];
    intervals.forEach((delay) => {
      setTimeout(forceArmenianFonts, delay);
    });

    // Cleanup function
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
      document.body.classList.remove('armenian-optimized');
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default ArmenianFontProvider;
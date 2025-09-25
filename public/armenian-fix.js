/**
 * Armenian Text Fix - Emergency font application
 * This script immediately applies proper fonts without waiting for font loading
 */

(function() {
  'use strict';
  
  console.log('🔧 Armenian Font Emergency Fix - Starting...');
  
  // Armenian Unicode detection
  const ARMENIAN_REGEX = /[\u0530-\u058F\uFB13-\uFB17]/;
  
  // Font stacks to try in order
  const FONT_STACKS = [
    // System fonts first (most likely to work)
    'Arial Unicode MS, Lucida Grande, Sylfaen',
    // Google Fonts as backup
    '"Noto Sans Armenian", "Noto Serif Armenian"',
    // Final fallbacks
    'Arial, Helvetica, sans-serif'
  ];
  
  function applyArmenianFonts() {
    console.log('🔧 Applying Armenian fonts to all elements...');
    
    // Get all text-containing elements
    const elements = document.querySelectorAll('*');
    let processed = 0;
    
    elements.forEach(element => {
      const textContent = element.textContent || element.innerText || '';
      
      if (textContent && ARMENIAN_REGEX.test(textContent)) {
        // Try each font stack
        for (let i = 0; i < FONT_STACKS.length; i++) {
          element.style.fontFamily = FONT_STACKS[i];
          element.style.setProperty('font-family', FONT_STACKS[i], 'important');
        }
        
        // Additional Armenian-specific styling
        element.style.setProperty('text-rendering', 'optimizeLegibility', 'important');
        element.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important');
        element.style.setProperty('unicode-bidi', 'isolate', 'important');
        element.classList.add('armenian-text-fixed');
        
        processed++;
      }
    });
    
    console.log(`🔧 Applied Armenian fonts to ${processed} elements`);
    return processed;
  }
  
  function forceShowContent() {
    // Remove any hiding classes
    document.documentElement.classList.remove('font-loading');
    document.documentElement.classList.add('fonts-loaded', 'armenian-fixed');
    
    // Force show all hidden content
    const hiddenElements = document.querySelectorAll('[style*="visibility: hidden"], .font-loading');
    hiddenElements.forEach(el => {
      el.style.setProperty('visibility', 'visible', 'important');
      el.classList.add('force-visible');
    });
    
    console.log('🔧 Forced content visibility');
  }
  
  function emergencyFix() {
    console.log('🔧 Emergency Armenian font fix running...');
    
    // Apply fonts immediately
    applyArmenianFonts();
    
    // Force show content
    forceShowContent();
    
    // Add global CSS override
    const style = document.createElement('style');
    style.id = 'armenian-emergency-fix';
    style.textContent = `
      /* Emergency Armenian font fix */
      .armenian-text-fixed {
        font-family: "Arial Unicode MS", "Lucida Grande", "Sylfaen", Arial, sans-serif !important;
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
        unicode-bidi: isolate !important;
      }
      
      /* Force show content */
      .force-visible, .armenian-fixed * {
        visibility: visible !important;
      }
      
      /* Ensure Armenian characters don't fall back to default fonts */
      * {
        font-family: "Arial Unicode MS", "Lucida Grande", "Sylfaen", Arial, sans-serif;
      }
    `;
    document.head.appendChild(style);
    
    console.log('🔧 Emergency styles applied');
  }
  
  // Run immediately
  emergencyFix();
  
  // Run again after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', emergencyFix);
  }
  
  // Run again after a short delay
  setTimeout(emergencyFix, 100);
  setTimeout(emergencyFix, 500);
  setTimeout(emergencyFix, 1000);
  
  // Monitor for new content and apply fixes
  const observer = new MutationObserver(function(mutations) {
    let shouldFix = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (ARMENIAN_REGEX.test(text)) {
              shouldFix = true;
            }
          }
        });
      }
    });
    
    if (shouldFix) {
      console.log('🔧 New Armenian content detected, applying fixes...');
      applyArmenianFonts();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  console.log('🔧 Armenian Font Emergency Fix - Complete');
  
})();
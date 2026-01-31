import React, { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface EditorOverlayProps {
  enabled: boolean;
  currentLanguage: 'en' | 'hy' | 'ru';
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

interface EditingState {
  element: HTMLElement;
  key: string;
  originalValue: string;
  originalHTML: string;
  inputElement: HTMLInputElement | HTMLTextAreaElement;
}

export function EditorOverlay({ enabled, currentLanguage, onEditStart, onEditEnd }: EditorOverlayProps) {
  const editingStateRef = useRef<EditingState | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateTranslationInCache, refreshTranslations } = useLanguage();

  // Update translation mutation
  const updateTranslation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await fetch('/api/translations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: currentLanguage, key, value })
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the cache immediately for instant UI feedback
      updateTranslationInCache(variables.key, variables.value);
      
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['live-translations'] });
      
      // Refresh translations from backend to ensure sync
      refreshTranslations();
      
      toast({
        title: "Translation updated",
        description: `${variables.key} = "${variables.value}"`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update translation",
        variant: "destructive"
      });
    }
  });

  // Restore original content and clean up
  const cancelEdit = () => {
    if (!editingStateRef.current) return;
    
    const { element, originalHTML } = editingStateRef.current;
    element.innerHTML = originalHTML;
    editingStateRef.current = null;
    onEditEnd?.();
  };

  // Save the edited value
  const saveEdit = () => {
    if (!editingStateRef.current) return;
    
    const { element, key, inputElement } = editingStateRef.current;
    const newValue = inputElement.value.trim();
    
    // Update DOM immediately
    element.textContent = newValue;
    
    // Persist to backend
    updateTranslation.mutate({ key, value: newValue });
    
    editingStateRef.current = null;
    onEditEnd?.();
  };

  // Start inline editing
  const startEdit = (element: HTMLElement, key: string) => {
    const originalValue = element.textContent || '';
    const originalHTML = element.innerHTML;
    
    // Determine if multiline
    const rect = element.getBoundingClientRect();
    const isMultiline = 
      element.tagName === 'P' ||
      element.tagName === 'DIV' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'BLOCKQUOTE' ||
      element.tagName === 'LI' ||
      rect.height > 50 ||
      originalValue.length > 100;
    
    // Create input or textarea
    const inputElement = document.createElement(isMultiline ? 'textarea' : 'input') as HTMLInputElement | HTMLTextAreaElement;
    inputElement.value = originalValue;
    inputElement.className = 'w-full bg-blue-50 border-2 border-blue-500 rounded px-2 py-1 text-inherit font-inherit focus:outline-none focus:ring-2 focus:ring-blue-600';
    
    if (isMultiline) {
      (inputElement as HTMLTextAreaElement).rows = 3;
      inputElement.style.minHeight = '60px';
      inputElement.style.resize = 'vertical';
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-2 mt-1';
    
    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Save`;
    saveBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors';
    saveBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveEdit();
    };
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>Cancel`;
    cancelBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors';
    cancelBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    };
    
    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    
    // Key info badge
    const keyBadge = document.createElement('div');
    keyBadge.className = 'text-xs text-blue-600 font-mono mb-1';
    keyBadge.textContent = `${key} [${currentLanguage.toUpperCase()}]`;
    
    // Replace element content
    element.innerHTML = '';
    element.appendChild(keyBadge);
    element.appendChild(inputElement);
    element.appendChild(buttonContainer);
    
    // Store editing state
    editingStateRef.current = {
      element,
      key,
      originalValue,
      originalHTML,
      inputElement
    };
    
    // Focus input
    inputElement.focus();
    inputElement.select();
    
    // Keyboard shortcuts
    inputElement.onkeydown = (e) => {
      if (e.key === 'Enter' && (!isMultiline || e.ctrlKey)) {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    };
    
    onEditStart?.();
  };

  useEffect(() => {
    if (!enabled) return;

    // Global click handler in capture phase
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // If currently editing, check if click is outside the editing element
      if (editingStateRef.current) {
        const { element } = editingStateRef.current;
        if (!element.contains(target)) {
          // Click outside - cancel edit
          cancelEdit();
        }
        return;
      }
      
      // Walk up DOM tree to find nearest element with data-i18n-key
      let translatable: HTMLElement | null = target;
      while (translatable && translatable !== document.body) {
        if (translatable.hasAttribute('data-i18n-key')) {
          break;
        }
        translatable = translatable.parentElement;
      }
      
      // If we found a translatable element
      if (translatable && translatable.hasAttribute('data-i18n-key')) {
        // CRITICAL: Prevent ALL default behavior (navigation, form submit, etc.)
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // If the translatable is a button or link, prevent its action
        if (translatable.tagName === 'BUTTON' || translatable.tagName === 'A') {
          const originalOnClick = (translatable as any).onclick;
          (translatable as any).onclick = null;
          setTimeout(() => {
            (translatable as any).onclick = originalOnClick;
          }, 100);
        }
        
        const key = translatable.getAttribute('data-i18n-key');
        if (!key) return;
        
        startEdit(translatable, key);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      // Skip if already editing
      if (editingStateRef.current) return;
      
      const target = e.target as HTMLElement;
      
      // Walk up DOM tree to find nearest element with data-i18n-key
      let translatable: HTMLElement | null = target;
      while (translatable && translatable !== document.body) {
        if (translatable.hasAttribute('data-i18n-key')) {
          break;
        }
        translatable = translatable.parentElement;
      }
      
      if (translatable && translatable.hasAttribute('data-i18n-key')) {
        translatable.style.outline = '2px dashed #3b82f6';
        translatable.style.outlineOffset = '2px';
        translatable.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        translatable.style.cursor = 'pointer';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Walk up DOM tree
      let translatable: HTMLElement | null = target;
      while (translatable && translatable !== document.body) {
        if (translatable.hasAttribute('data-i18n-key')) {
          break;
        }
        translatable = translatable.parentElement;
      }
      
      if (translatable && translatable.hasAttribute('data-i18n-key')) {
        translatable.style.outline = '';
        translatable.style.outlineOffset = '';
        translatable.style.backgroundColor = '';
        translatable.style.cursor = '';
      }
    };

    // Use capture phase to intercept clicks BEFORE they reach target elements
    document.addEventListener('click', handleClick, { capture: true });
    document.addEventListener('mouseover', handleMouseOver, { capture: false });
    document.addEventListener('mouseout', handleMouseOut, { capture: false });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('mouseover', handleMouseOver, { capture: false });
      document.removeEventListener('mouseout', handleMouseOut, { capture: false });
    };
  }, [enabled, currentLanguage]);

  // No UI to render - everything is inline
  return null;
}

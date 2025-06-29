import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Safety check to ensure event and key exist
      if (!event || !event.key) return;
      
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const modifierKey = ctrlKey || metaKey;

      // Safety check for shortcuts array
      if (!Array.isArray(shortcuts)) return;

      shortcuts.forEach(({ keys, action, preventDefault = true }) => {
        // Safety check for keys and action
        if (!keys || typeof keys !== 'string' || typeof action !== 'function') return;
        
        try {
          const keyParts = keys.split('+').filter(Boolean); // Remove empty strings
          if (keyParts.length === 0) return;
          
          const [mainKey, ...modifiers] = keyParts.reverse();
          
          // Safety check for mainKey
          if (!mainKey || typeof mainKey !== 'string') return;
          
          const hasCtrl = modifiers.some(mod => mod && (mod.toLowerCase() === 'ctrl' || mod.toLowerCase() === 'cmd'));
          const hasShift = modifiers.some(mod => mod && mod.toLowerCase() === 'shift');
          const hasAlt = modifiers.some(mod => mod && mod.toLowerCase() === 'alt');

          if (
            key.toLowerCase() === mainKey.toLowerCase() &&
            hasCtrl === modifierKey &&
            hasShift === shiftKey &&
            hasAlt === altKey
          ) {
            if (preventDefault) {
              event.preventDefault();
            }
            action(event);
          }
        } catch (error) {
          console.warn('Error in keyboard shortcut handler:', error);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
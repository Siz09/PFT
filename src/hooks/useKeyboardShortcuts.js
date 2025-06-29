import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Safety check to ensure event and key exist
      if (!event || !event.key) return;
      
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const modifierKey = ctrlKey || metaKey;

      shortcuts.forEach(({ keys, action, preventDefault = true }) => {
        // Safety check for keys
        if (!keys || typeof keys !== 'string') return;
        
        const keyParts = keys.split('+').reverse();
        const [mainKey, ...modifiers] = keyParts;
        
        // Safety check for mainKey
        if (!mainKey) return;
        
        const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('cmd');
        const hasShift = modifiers.includes('shift');
        const hasAlt = modifiers.includes('alt');

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
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
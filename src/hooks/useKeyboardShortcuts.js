import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const modifierKey = ctrlKey || metaKey;

      shortcuts.forEach(({ keys, action, preventDefault = true }) => {
        const [mainKey, ...modifiers] = keys.split('+').reverse();
        
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
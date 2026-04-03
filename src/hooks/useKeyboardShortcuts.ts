import { useEffect } from 'react';

interface Shortcut {
  keys: string;
  action: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!event || !event.key) return;

      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const modifierKey = ctrlKey || metaKey;

      if (!Array.isArray(shortcuts)) return;

      shortcuts.forEach(({ keys, action, preventDefault = true }) => {
        if (!keys || typeof keys !== 'string' || typeof action !== 'function') return;

        try {
          const keyParts = keys.split('+').filter(Boolean);
          if (keyParts.length === 0) return;

          const [mainKey, ...modifiers] = keyParts.reverse();

          if (!mainKey || typeof mainKey !== 'string') return;

          const hasCtrl = modifiers.some(
            (mod) => mod && (mod.toLowerCase() === 'ctrl' || mod.toLowerCase() === 'cmd')
          );
          const hasShift = modifiers.some((mod) => mod && mod.toLowerCase() === 'shift');
          const hasAlt = modifiers.some((mod) => mod && mod.toLowerCase() === 'alt');

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

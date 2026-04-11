import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isFocusableVisible(el: HTMLElement): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  // Prefer layout geometry; `offsetParent` is unreliable for `position: fixed` / `sticky`.
  if (el.getClientRects().length > 0) return true;
  const pos = style.position;
  if ((pos === 'fixed' || pos === 'sticky') && typeof el.checkVisibility === 'function') {
    return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  }
  return false;
}

/**
 * Escape to close, basic focus trap, restore focus on unmount.
 */
export function useOverlayAccessibility(
  open: boolean,
  onRequestClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
) {
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = document.activeElement as HTMLElement | null;

    const focusFirst = () => {
      const root = containerRef.current;
      if (!root) return;
      const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = nodes[0];
      first?.focus();
    };

    const id = window.requestAnimationFrame(() => focusFirst());

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onRequestClose();
        return;
      }

      if (e.key !== 'Tab') return;
      const root = containerRef.current;
      if (!root) return;
      const list = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => isFocusableVisible(el) || el === document.activeElement,
      );
      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKeyDown, true);
      lastActiveRef.current?.focus?.();
    };
  }, [open, onRequestClose, containerRef]);
}

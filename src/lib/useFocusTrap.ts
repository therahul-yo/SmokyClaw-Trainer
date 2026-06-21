import { useEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Trap focus within a dialog while `open` is true.
 *
 * - On open: moves focus to the first focusable element inside `containerRef`.
 *   Falls back to the container itself if nothing focusable is found.
 * - On Tab from the last focusable: wraps focus to the first.
 * - On Shift+Tab from the first focusable: wraps focus to the last.
 * - On close: restores focus to the element that was active when the trap
 *   activated (passed via `triggerRef` or remembered internally).
 * - Calls `onClose` when Escape is pressed (the caller decides what to do).
 *
 * WCAG: 2.1.1 Keyboard, 2.4.3 Focus Order, 4.1.2 Name, Role, Value.
 */
export function useFocusTrap(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
  triggerRef?: RefObject<HTMLElement | null>,
): void {
  // Remember the trigger so we can restore focus on close.
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Snapshot whatever had focus when we opened.
    previouslyFocused.current =
      triggerRef?.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    const container = containerRef.current;
    if (!container) return;

    // Move focus into the dialog on open. queueMicrotask ensures layout is
    // committed before we query focusable elements.
    const moveInitialFocus = () => {
      const focusables = getFocusable(container);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        // Nothing focusable inside — make the container itself focusable.
        if (!container.hasAttribute("tabindex")) {
          container.setAttribute("tabindex", "-1");
        }
        container.focus();
      }
    };

    queueMicrotask(moveInitialFocus);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = getFocusable(container!);
      if (focusables.length === 0) {
        // Nothing focusable — keep focus on the container itself.
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container!.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container!.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      // Restore focus to whatever opened the dialog.
      previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return nodes.filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    // Skip elements that are visually hidden via display:none.
    return el.offsetParent !== null || el === document.activeElement;
  });
}
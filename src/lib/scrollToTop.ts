/**
 * Globally resets scroll position to the very top (x: 0, y: 0) across
 * window, documentElement, body, #root, and <main>.
 * Runs both immediately and on the next animation frame so lazy-loaded
 * views or layout shifts never leave the viewport scrolled down.
 */
export function scrollToTopInstant(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const resetAll = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }

    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
      document.scrollingElement.scrollLeft = 0;
    }

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
    }

    if (document.body) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }

    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.scrollTop = 0;
      rootEl.scrollLeft = 0;
    }

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
      mainEl.scrollLeft = 0;
    }
  };

  resetAll();

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      resetAll();
    });
  }
}


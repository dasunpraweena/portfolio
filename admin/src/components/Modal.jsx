import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

let openModals = 0;
let originalOverflow = '';

export default function Modal({ children, titleId, kicker, onClose, small = false }) {
  const panel = useRef(null);
  const close = useRef(onClose);
  const previousFocus = useRef(null);
  const restoreFrame = useRef(null);
  close.current = onClose;
  useEffect(() => {
    cancelAnimationFrame(restoreFrame.current);
    previousFocus.current ||= document.activeElement;
    if (openModals++ === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    panel.current.querySelector('button')?.focus({ preventScroll: true });
    const handleKey = (event) => {
      const panels = document.querySelectorAll('[data-modal-panel]');
      if (panels[panels.length - 1] !== panel.current) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = [...panel.current.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]')].filter(item => item.getClientRects().length && item.getAttribute('aria-hidden') !== 'true');
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (--openModals === 0) document.body.style.overflow = originalOverflow;
      restoreFrame.current = requestAnimationFrame(() => {
        if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
      });
    };
  }, []);
  return createPortal(<div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} data-modal-panel className={'dialog' + (small ? ' small-dialog' : '')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="dialog-header"><span className="mono">{kicker}</span><button className="round-btn" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div>
      {children}
    </section>
  </div>, document.body);
}

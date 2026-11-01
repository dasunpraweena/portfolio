import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { validateMessage } from '../utils/contact';

export function useContactForm() {
  const [state, setState] = useState({ status: 'idle', message: '' });
  const active = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  return {
    ...state,
    clearValidity(event) { event.target.setCustomValidity?.(''); if (state.status !== 'pending') setState({ status: 'idle', message: '' }); },
    async handleSubmit(event) {
      event.preventDefault();
      if (active.current) return;
      const form = event.currentTarget;
      const result = validateMessage(Object.fromEntries(new FormData(form)));
      if (result.error) { const input = form.elements.namedItem(result.field); input.setCustomValidity(result.error); input.reportValidity(); return; }
      const controller = new AbortController();
      active.current = controller;
      setState({ status: 'pending', message: '' });
      try {
        await api.sendMessage(result.data, { signal: controller.signal });
        if (controller.signal.aborted) return;
        form.reset();
        setState({ status: 'success', message: 'Your message was saved. Thank you for reaching out.' });
      } catch (error) {
        if (controller.signal.aborted) return;
        const invalid = error.details?.find(detail => ['name', 'email', 'subject', 'message'].includes(detail.field));
        if (invalid) { const field = form.elements.namedItem(invalid.field); field.setCustomValidity(invalid.message); field.reportValidity(); }
        setState({ status: 'error', message: error.status === 429 ? `Too many messages. Please try again${error.retryAfter ? ' in ' + Math.ceil(error.retryAfter / 60) + ' minutes' : ' later'}. Your text is still here.` : 'We could not confirm that your message was saved. Your text is still here; please retry.' });
      } finally { if (active.current === controller) active.current = null; }
    },
  };
}

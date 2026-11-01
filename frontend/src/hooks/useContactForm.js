import { usePortfolio } from '../components/PortfolioProvider';
import { profile } from '../data/profile';
import { createEmailDraft } from '../utils/contact';
export function useContactForm() {
  const { showNotice } = usePortfolio();
  return {
    clearValidity(event) { event.target.setCustomValidity?.(''); },
    handleSubmit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const result = createEmailDraft(Object.fromEntries(new FormData(form)), profile.email);
      if (result.error) { const input = form.elements.namedItem(result.field); input.setCustomValidity(result.error); input.reportValidity(); return; }
      window.location.href = result.href;
      showNotice('Email draft requested. Review and send it in your email app.');
    },
  };
}

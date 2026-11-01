import Icon from './Icon';
import { usePortfolio } from './PortfolioProvider';
export default function ThemeToggle() {
  const { theme, setTheme } = usePortfolio();
  return <button className="round-btn" id="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>;
}

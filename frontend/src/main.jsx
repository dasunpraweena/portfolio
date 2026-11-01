import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PortfolioProvider } from './components/PortfolioProvider';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PortfolioProvider><App /></PortfolioProvider>
    </BrowserRouter>
  </StrictMode>,
);

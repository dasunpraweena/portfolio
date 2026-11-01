import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { StudioProvider } from './components/StudioProvider';
import { IconDefinitions } from './components/Icon';
import App from './App';
import './styles/index.css';
createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><AuthProvider><StudioProvider><IconDefinitions /><App /></StudioProvider></AuthProvider></BrowserRouter></StrictMode>);

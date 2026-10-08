import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { audio } from './game/audio';
import { game } from './game/store';

// Kehitystilassa pelin tila on konsolista käsin tutkittavissa
if (import.meta.env.DEV) Object.assign(window, { game, audio });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

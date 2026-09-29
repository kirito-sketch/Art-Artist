import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/looks.css';
import '@fontsource/caveat/700.css';
import '@fontsource-variable/bricolage-grotesque';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);

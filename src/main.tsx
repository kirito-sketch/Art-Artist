import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/noto-sans-telugu/400.css';
import '@fontsource/noto-sans-telugu/600.css';
import '@fontsource/noto-sans-telugu/700.css';
import '@fontsource/noto-sans-telugu/800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/looks.css';
import './styles/expression.css';
import '@fontsource/caveat/700.css';
import '@fontsource-variable/bricolage-grotesque';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);

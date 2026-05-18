import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import WelcomePage from './pages/WelcomePage.tsx';
import MainPage from './pages/MainPage.tsx';

function App() {
  // For local testing, use ngrok URL. For production, use Vercel URL.
  const manifestUrl = window.location.hostname.includes('ngrok')
    ? `${window.location.origin}/tonconnect-manifest.json`
    : 'https://smtbot.vercel.app/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/main" element={<MainPage />} />
          </Routes>
        </div>
      </Router>
    </TonConnectUIProvider>
  );
}

export default App;
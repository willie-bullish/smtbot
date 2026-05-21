import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://smtbot.vercel.app/tonconnect-manifest.json">
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/main" element={<MainPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </TonConnectUIProvider>
  );
}

export default App;
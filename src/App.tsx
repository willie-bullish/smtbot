import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import WelcomePage from './pages/WelcomePage';
import MainPage from './pages/MainPage';
import AdminPage from './components/AdminPage';

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://smttbot.vercel.app/tonconnect-manifest.json">
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/main" element={<MainPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </TonConnectUIProvider>
  );
}

export default App;
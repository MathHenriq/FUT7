import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Header from './components/Header';
import SessoesScreen from './components/SessoesScreen';
import RegistroScreen from './components/RegistroScreen';
import ElencoScreen from './components/ElencoScreen';
import CampoScreen from './components/CampoScreen';
import JogadorScreen from './components/JogadorScreen';
import IdeiasScreen from './components/IdeiasScreen';
import DashboardScreen from './components/DashboardScreen';
import { AppProvider } from './store';

function RegistroRoute() {
  const { sessaoId } = useParams();
  return <RegistroScreen key={sessaoId} />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', width: '100%', background: '#05070a', color: '#eef2f6' }}>
          <Header />
          <Routes>
            <Route path="/" element={<Navigate to="/sessoes" replace />} />
            <Route path="/sessoes" element={<SessoesScreen />} />
            <Route path="/registro/:sessaoId" element={<RegistroRoute />} />
            <Route path="/elenco" element={<ElencoScreen />} />
            <Route path="/jogador/:jogadorId" element={<JogadorScreen />} />
            <Route path="/campo" element={<CampoScreen />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/ideias" element={<IdeiasScreen />} />
            <Route path="*" element={<Navigate to="/sessoes" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

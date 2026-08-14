import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Header from './components/Header';
import Plano from './components/Plano';
import SessoesScreen from './components/SessoesScreen';
import SessaoScreen from './components/SessaoScreen';
import CompararScreen from './components/CompararScreen';
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
        {/* The shell is always the operating plane: it carries the app identity and
            the session you are inside. Screens declare their own plane below. */}
        <div data-plano="escuro" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <Routes>
            <Route path="/" element={<Navigate to="/sessoes" replace />} />

            {/* Operating: tagging beside the pitch, video, pitch coordinates. */}
            <Route path="/registro/:sessaoId" element={<Plano tipo="escuro"><RegistroRoute /></Plano>} />
            <Route path="/campo" element={<Plano tipo="escuro"><CampoScreen /></Plano>} />

            {/* Reading: dense tables, comparison, reports. */}
            <Route path="/sessoes" element={<Plano tipo="claro"><SessoesScreen /></Plano>} />
            <Route path="/sessao/:sessaoId" element={<Plano tipo="claro"><SessaoScreen /></Plano>} />
            <Route path="/elenco" element={<Plano tipo="claro"><ElencoScreen /></Plano>} />
            <Route path="/jogador/:jogadorId" element={<Plano tipo="claro"><JogadorScreen /></Plano>} />
            <Route path="/comparar" element={<Plano tipo="claro"><CompararScreen /></Plano>} />
            <Route path="/dashboard" element={<Plano tipo="claro"><DashboardScreen /></Plano>} />
            <Route path="/ideias" element={<Plano tipo="claro"><IdeiasScreen /></Plano>} />

            <Route path="*" element={<Navigate to="/sessoes" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

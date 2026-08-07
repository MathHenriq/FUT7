import Header from './components/Header';
import MobileScreen from './components/MobileScreen';
import PcScreen from './components/PcScreen';
import DashboardScreen from './components/DashboardScreen';
import { AppProvider, useApp } from './store';

function Screens() {
  const { state } = useApp();
  if (state.activeScreen === 'mobile') return <MobileScreen />;
  if (state.activeScreen === 'pc') return <PcScreen />;
  return <DashboardScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', width: '100%', background: '#05070a', color: '#eef2f6' }}>
        <Header />
        <Screens />
      </div>
    </AppProvider>
  );
}

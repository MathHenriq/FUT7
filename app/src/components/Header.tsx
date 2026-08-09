import { useLocation, useNavigate } from 'react-router-dom';
import { colors, fontDisplay } from '../colors';
import { useApp } from '../store';

export default function Header() {
  const { state, createSessao } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  function goRegistro() {
    const current = state.currentSessaoId && state.sessoes.find((s) => s.id === state.currentSessaoId);
    if (current) { navigate(`/registro/${current.id}`); return; }
    const today = new Date().toISOString().slice(0, 10);
    const id = createSessao({
      tipoSessao: 'partida',
      label: 'Sessão ao vivo',
      comVideo: true,
      data: today,
      escalacao: state.jogadores.filter((j) => j.ativo).map((j) => j.id),
    });
    navigate(`/registro/${id}`);
  }

  const tabs = [
    { key: 'sessoes', label: 'Sessões', active: location.pathname.startsWith('/sessoes'), onClick: () => navigate('/sessoes') },
    { key: 'registro', label: 'Registro', active: location.pathname.startsWith('/registro'), onClick: goRegistro },
    { key: 'elenco', label: 'Elenco', active: location.pathname.startsWith('/elenco'), onClick: () => navigate('/elenco') },
    { key: 'dashboard', label: 'Dashboard', active: location.pathname.startsWith('/dashboard'), onClick: () => navigate('/dashboard') },
  ];

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '14px 28px', background: colors.headerBg,
        borderBottom: `1px solid ${colors.headerBorder}`, flexWrap: 'wrap', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 12, height: 12, background: colors.blue, transform: 'rotate(45deg)', borderRadius: 2 }} />
        <div style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: 0.5 }}>
          FUT7 <span style={{ color: colors.muted, fontWeight: 600 }}>ANALYTICS</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map((t) => (
          <div
            key={t.key}
            onClick={t.onClick}
            style={{
              padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: t.active ? colors.text : colors.muted,
              borderBottom: `2px solid ${t.active ? colors.blue : 'transparent'}`,
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useLocation, useNavigate } from 'react-router-dom';
import { colors, fontDisplay, rotulo } from '../colors';
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
      modoRegistro: 'ao-vivo',
      data: today,
      escalacao: state.jogadores.filter((j) => j.ativo).map((j) => j.id),
    });
    navigate(`/registro/${id}`);
  }

  const tabs = [
    { key: 'sessoes', label: 'Sessões', active: location.pathname.startsWith('/sessoes'), onClick: () => navigate('/sessoes') },
    { key: 'registro', label: 'Registro', active: location.pathname.startsWith('/registro'), onClick: goRegistro },
    { key: 'campo', label: 'Campo', active: location.pathname.startsWith('/campo'), onClick: () => navigate('/campo') },
    { key: 'elenco', label: 'Jogadores', active: location.pathname.startsWith('/elenco'), onClick: () => navigate('/elenco') },
    { key: 'comparar', label: 'Comparar', active: location.pathname.startsWith('/comparar'), onClick: () => navigate('/comparar') },
    { key: 'dashboard', label: 'Dashboard', active: location.pathname.startsWith('/dashboard'), onClick: () => navigate('/dashboard') },
    { key: 'ideias', label: 'Ideias', active: location.pathname.startsWith('/ideias'), onClick: () => navigate('/ideias') },
  ];

  return (
    <div
      data-plano="escuro"
      style={{
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'stretch',
        justifyContent: 'space-between', padding: '0 24px', background: colors.headerBg,
        borderBottom: `1px solid ${colors.headerBorder}`, flexWrap: 'wrap', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0' }}>
        {/* A rule, not a badge: the mark is the type. */}
        <div style={{ width: 3, alignSelf: 'stretch', background: colors.blue }} />
        <div style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 21, letterSpacing: 0.4, lineHeight: 1 }}>
          FUT7
        </div>
        <div style={{ ...rotulo, color: colors.mutedDark, paddingTop: 2 }}>Analytics</div>
      </div>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <div
            key={t.key}
            onClick={t.onClick}
            style={{
              padding: '16px 14px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              fontWeight: t.active ? 700 : 500,
              color: t.active ? colors.text : colors.muted,
              boxShadow: t.active ? `inset 0 -2px 0 ${colors.blue}` : 'none',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}

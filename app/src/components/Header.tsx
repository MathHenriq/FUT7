import { colors, fontDisplay } from '../colors';
import { useApp } from '../store';
import type { Screen } from '../types';

const tabs: { key: Screen; label: string }[] = [
  { key: 'mobile', label: 'Registro Mobile' },
  { key: 'pc', label: 'Registro PC' },
  { key: 'dashboard', label: 'Dashboard' },
];

export default function Header() {
  const { state, dispatch } = useApp();

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '14px 28px', background: colors.headerBg,
        borderBottom: `1px solid ${colors.headerBorder}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 12, height: 12, background: colors.blue, transform: 'rotate(45deg)', borderRadius: 2 }} />
        <div style={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: 0.5 }}>
          FUT7 <span style={{ color: colors.muted, fontWeight: 600 }}>ANALYTICS</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map((t) => {
          const isActive = state.activeScreen === t.key;
          return (
            <div
              key={t.key}
              onClick={() => dispatch({ type: 'SET_SCREEN', screen: t.key })}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                color: isActive ? colors.text : colors.muted,
                borderBottom: `2px solid ${isActive ? colors.blue : 'transparent'}`,
              }}
            >
              {t.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

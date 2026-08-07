import { colors, fontDisplay } from '../colors';
import { squad } from '../data';
import { useDashboardData } from '../hooks/useDashboardData';
import { useApp } from '../store';

export default function DashboardScreen() {
  const { state, dispatch } = useApp();
  const d = useDashboardData();

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {d.goalOrigin.map((g) => (
          <div key={g.label} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, color: colors.muted, fontWeight: 600, marginBottom: 6 }}>{g.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: fontDisplay, fontSize: 32, fontWeight: 800 }}>{g.pct}%</div>
              <div style={{ fontSize: 12, color: colors.mutedDark }}>{g.count} gols</div>
            </div>
            <div style={{ height: 5, background: colors.border, borderRadius: 3, marginTop: 10 }}>
              <div style={{ height: '100%', borderRadius: 3, background: colors.blue, width: `${g.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Evolução individual</div>
              <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2 }}>{d.totalGoalsSel} gols {d.selLabel}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={state.dashPlayer}
                onChange={(e) => dispatch({ type: 'SET_DASH_PLAYER', player: e.target.value })}
                style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontWeight: 600 }}
              >
                {squad.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={state.dashSessao}
                onChange={(e) => dispatch({ type: 'SET_DASH_SESSAO', sessaoId: e.target.value })}
                style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontWeight: 600 }}
              >
                <option value="all">Todas as sessões</option>
                {d.sessaoOptionsList.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <svg viewBox="0 0 560 200" style={{ width: '100%', height: 200, overflow: 'visible' }}>
            <path d={d.chartPath} fill="none" stroke={colors.blue} strokeWidth={2.5} />
            {d.chartPoints.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r={pt.r} fill={pt.fill} />
            ))}
          </svg>
        </div>

        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Zona de finalização</div>
          <div style={{ fontSize: 12, color: colors.mutedDark, marginBottom: 14 }}>Gols por setor do campo, temporada</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {d.heatCells.map((h) => (
              <div key={h.label} style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: h.bg }}>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 800, color: '#fff' }}>{h.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <div style={{ fontSize: 11, color: colors.mutedDark }}>Menos</div>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'linear-gradient(90deg,#17324a,#2f6fd6,#f5a623)' }} />
            <div style={{ fontSize: 11, color: colors.mutedDark }}>Mais</div>
          </div>
        </div>
      </div>
    </div>
  );
}

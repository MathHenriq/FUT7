import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontDisplay } from '../colors';
import { useDashboardData } from '../hooks/useDashboardData';
import { useApp } from '../store';
import type { GradeZonas, Lado } from '../types';

/** Physical output lives across sessions, so the readout is a per-player record rather
 *  than a per-match number. Empty until something is measured — no invented values. */
function PainelFisico() {
  const { state } = useApp();
  const navigate = useNavigate();
  const linhas = state.jogadores
    .filter((j) => j.ativo)
    .map((j) => {
      const minhas = state.metricas.filter((m) => m.jogadorId === j.id);
      const velocidades = minhas.map((m) => m.velocidadeMaxKmh).filter((v): v is number => v !== undefined);
      const distancias = minhas.map((m) => m.distanciaM).filter((v): v is number => v !== undefined);
      return {
        j,
        recorde: velocidades.length > 0 ? Math.max(...velocidades) : null,
        distTotal: distancias.length > 0 ? distancias.reduce((a, b) => a + b, 0) : null,
        sessoes: minhas.length,
      };
    })
    .filter((l) => l.sessoes > 0)
    .sort((a, b) => (b.recorde ?? 0) - (a.recorde ?? 0));

  return (
    <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>Físico</div>
      <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2, marginBottom: 14 }}>
        Recorde de velocidade e volume acumulado
      </div>
      {linhas.length === 0 ? (
        <div style={{ fontSize: 12, color: colors.mutedDark, lineHeight: 1.5 }}>
          Nada medido ainda. Abra um treino e preencha o painel Físico — de relógio, GPS do celular
          no bolso ou cronômetro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {linhas.map((l) => (
            <div key={l.j.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <div
                onClick={() => navigate(`/jogador/${l.j.id}`)}
                style={{ flex: 1, minWidth: 120, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {l.j.nome}
              </div>
              <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 800 }}>
                {l.recorde !== null ? l.recorde.toFixed(1) : '—'}
                <span style={{ fontSize: 11, color: colors.mutedDark, marginLeft: 3 }}>km/h</span>
              </div>
              <div style={{ fontSize: 11, color: colors.mutedDark, minWidth: 90, textAlign: 'right' }}>
                {l.distTotal !== null ? `${(l.distTotal / 1000).toFixed(1)} km` : '—'} · {l.sessoes} sessão(ões)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardScreen() {
  const { state, dispatch, setGradeZonas } = useApp();
  const [lado, setLado] = useState<Lado>('nos');
  const [mapa, setMapa] = useState<'gols' | 'perdas'>('gols');
  const d = useDashboardData(lado);
  const ativos = state.jogadores.filter((j) => j.ativo);

  const corLado = lado === 'nos' ? colors.blue : colors.gold;

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['nos', 'adversario'] as Lado[]).map((l) => (
            <div key={l} onClick={() => setLado(l)} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: lado === l ? (l === 'nos' ? colors.blueSofter : colors.goldSoft) : colors.chipBg,
              border: `1px solid ${lado === l ? (l === 'nos' ? colors.blue : colors.gold) : colors.chipBorder}`,
              color: lado === l ? colors.text : colors.muted,
            }}>
              {l === 'nos' ? state.config.nomeTime : 'Adversário'}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 800 }}>{d.golsPro}</div>
          <div style={{ fontSize: 12, color: colors.mutedDark }}>marcados</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 800, marginLeft: 10, color: colors.gold }}>{d.golsContra}</div>
          <div style={{ fontSize: 12, color: colors.mutedDark }}>sofridos</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingLeft: 16, borderLeft: `1px solid ${colors.border}` }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 800 }}>{d.aproveitamento}%</div>
          <div style={{ fontSize: 12, color: colors.mutedDark }}>
            aproveitamento · {d.golsDoLado}/{d.finalizacoes} finalizações
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        {[
          { label: 'Recuperações', valor: d.recuperacoes, sub: `${d.perdas} perdas` },
          { label: 'Saldo de bola', valor: d.recuperacoes - d.perdas, sub: 'recuperadas − perdidas', destaque: true },
          { label: 'Precisão de passe', valor: `${d.precisaoPasse}%`, sub: `${d.passes} passes` },
          { label: 'Faltas', valor: d.faltasCometidas, sub: `${d.faltasSofridas} sofridas` },
        ].map((k) => (
          <div key={k.label} style={{ background: colors.cardBgDense, border: `1px solid ${colors.borderAlt}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: colors.muted, fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
            <div style={{
              fontFamily: fontDisplay, fontSize: 26, fontWeight: 800,
              color: k.destaque ? (Number(k.valor) >= 0 ? colors.blue : colors.gold) : colors.text,
            }}>
              {k.destaque && Number(k.valor) > 0 ? '+' : ''}{k.valor}
            </div>
            <div style={{ fontSize: 11, color: colors.mutedDark, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {d.goalOrigin.map((g) => (
          <div key={g.label} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, color: colors.muted, fontWeight: 600, marginBottom: 6 }}>{g.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: fontDisplay, fontSize: 32, fontWeight: 800 }}>{g.pct}%</div>
              <div style={{ fontSize: 12, color: colors.mutedDark }}>{g.count} gols</div>
            </div>
            <div style={{ height: 5, background: colors.border, borderRadius: 3, marginTop: 10 }}>
              <div style={{ height: '100%', borderRadius: 3, background: corLado, width: `${g.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
        <PainelFisico />
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
                value={state.dashPlayerId}
                onChange={(e) => dispatch({ type: 'SET_DASH_PLAYER', playerId: e.target.value })}
                style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, fontWeight: 600 }}
              >
                {ativos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {([['gols', 'Gols'], ['perdas', 'Perdas de bola']] as const).map(([k, l]) => (
                  <div key={k} onClick={() => setMapa(k)} style={{
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '2px 0', marginRight: 10,
                    color: mapa === k ? colors.text : colors.mutedDark,
                    borderBottom: `2px solid ${mapa === k ? colors.blue : 'transparent'}`,
                  }}>
                    {l}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: colors.mutedDark, marginBottom: 14 }}>
                Por setor · {lado === 'nos' ? state.config.nomeTime : 'adversário'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {([9, 12] as GradeZonas[]).map((g) => (
                <div key={g} onClick={() => setGradeZonas(g)} style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: state.config.gradeZonas === g ? colors.blueSofter : colors.chipBg,
                  border: `1px solid ${state.config.gradeZonas === g ? colors.blue : colors.chipBorder}`,
                  color: state.config.gradeZonas === g ? colors.text : colors.muted,
                }}>
                  {g}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {(mapa === 'gols' ? d.heatCells : d.perdaCells).map((h) => (
              <div key={h.label} title={h.label} style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: h.bg }}>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 800, color: '#fff' }}>{h.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <div style={{ fontSize: 11, color: colors.mutedDark }}>Menos</div>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'linear-gradient(90deg,#17324a,#2f6fd6,#f5a623)' }} />
            <div style={{ fontSize: 11, color: colors.mutedDark }}>Mais</div>
          </div>
          <div style={{ fontSize: 11, color: colors.mutedDark, marginTop: 10 }}>
            Ataque no topo · defesa embaixo{d.semLocal > 0 ? ` · ${d.semLocal} sem local registrado` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

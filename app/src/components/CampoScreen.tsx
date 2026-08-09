import { lazy, Suspense, useMemo, useState } from 'react';
import { colors, fontDisplay } from '../colors';
import { ehGol, heatColor, labelTipo, linhasDaGrade, setorIndex, setorLabels } from '../data';
import { useApp } from '../store';
// Three.js só é baixado quando o 3D é realmente aberto: o Registro roda ao vivo no
// celular e não deve carregar uma engine gráfica que talvez nunca use.
const Campo3D = lazy(() => import('./Campo3D'));
import type { EventTypeKey, GradeZonas, Lado } from '../types';

type Filtro = 'gol' | EventTypeKey;

const filtros: { key: Filtro; label: string }[] = [
  { key: 'gol', label: 'Gols' },
  { key: 'finalizacao', label: 'Finalizações' },
  { key: 'passe', label: 'Passes' },
  { key: 'lancamento', label: 'Lançamentos' },
  { key: 'cruzamento', label: 'Cruzamentos' },
  { key: 'perda', label: 'Perdas de bola' },
  { key: 'recuperacao', label: 'Recuperações' },
  { key: 'falta', label: 'Faltas' },
];

export default function CampoScreen() {
  const { state, setGradeZonas } = useApp();
  const [filtro, setFiltro] = useState<Filtro>('gol');
  const [lado, setLado] = useState<Lado>('nos');
  const [modo, setModo] = useState<'3d' | '2d'>('3d');
  const [selecionado, setSelecionado] = useState<number | null>(null);

  const rows = linhasDaGrade(state.config.gradeZonas);
  const labels = setorLabels(state.config.gradeZonas);

  const { celulas, cores, total, semLocal } = useMemo(() => {
    const alvo = state.eventos.filter((e) => {
      if (e.lado !== lado) return false;
      return filtro === 'gol' ? ehGol(e) : e.tipo === filtro;
    });
    const counts = new Array(labels.length).fill(0) as number[];
    let sem = 0;
    for (const e of alvo) {
      if (e.data.x === undefined || e.data.y === undefined) { sem++; continue; }
      counts[setorIndex(e.data.x, e.data.y, state.config.gradeZonas)] += 1;
    }
    const max = Math.max(...counts, 1);
    return {
      celulas: counts.map((v, i) => ({ index: i, value: v, label: labels[i] })),
      cores: counts.map((v) => heatColor(v, max)),
      total: alvo.length,
      semLocal: sem,
    };
  }, [state.eventos, state.config.gradeZonas, filtro, lado, labels]);

  const sel = selecionado !== null ? celulas[selecionado] : null;

  return (
    <div style={{ padding: '24px 32px 40px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Campo</div>
          <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2 }}>
            De onde saem os eventos · {total} registro{total === 1 ? '' : 's'}
            {semLocal > 0 ? ` · ${semLocal} sem local` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['nos', 'adversario'] as Lado[]).map((l) => (
            <div key={l} onClick={() => setLado(l)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: lado === l ? (l === 'nos' ? colors.blueSofter : colors.goldSoft) : colors.chipBg,
              border: `1px solid ${lado === l ? (l === 'nos' ? colors.blue : colors.gold) : colors.chipBorder}`,
              color: lado === l ? colors.text : colors.muted,
            }}>
              {l === 'nos' ? state.config.nomeTime : 'Adversário'}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
            {(['3d', '2d'] as const).map((m) => (
              <div key={m} onClick={() => setModo(m)} style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: modo === m ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${modo === m ? colors.blue : colors.chipBorder}`,
                color: modo === m ? colors.text : colors.muted, textTransform: 'uppercase',
              }}>
                {m}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {([9, 12] as GradeZonas[]).map((gz) => (
              <div key={gz} onClick={() => setGradeZonas(gz)} style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: state.config.gradeZonas === gz ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${state.config.gradeZonas === gz ? colors.blue : colors.chipBorder}`,
                color: state.config.gradeZonas === gz ? colors.text : colors.muted,
              }}>
                {gz}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filtros.map((f) => (
          <div key={f.key} onClick={() => { setFiltro(f.key); setSelecionado(null); }} style={{
            padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filtro === f.key ? colors.blue : colors.chipBg,
            border: `1px solid ${filtro === f.key ? colors.blue : colors.chipBorder}`,
            color: filtro === f.key ? '#0a0e13' : colors.muted,
          }}>
            {f.label}
          </div>
        ))}
      </div>

      <div style={{
        background: colors.cardBgAlt, border: `1px solid ${colors.border}`, borderRadius: 16,
        overflow: 'hidden', position: 'relative',
      }}>
        {modo === '3d' ? (
          <div style={{ height: '58vh', minHeight: 360 }}>
            <Suspense fallback={
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.mutedDark }}>
                Carregando campo…
              </div>
            }>
            <Campo3D
              cols={3}
              rows={rows}
              celulas={celulas}
              cores={cores}
              onSelect={(i) => setSelecionado((s) => (s === i ? null : i))}
            />
            </Suspense>
          </div>
        ) : (
          <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, width: '100%', maxWidth: 340 }}>
              {celulas.map((c, i) => (
                <div
                  key={c.index}
                  onClick={() => setSelecionado((s) => (s === c.index ? null : c.index))}
                  title={c.label}
                  style={{
                    aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: cores[i], cursor: 'pointer',
                    outline: selecionado === c.index ? `2px solid ${colors.text}` : 'none', outlineOffset: 2,
                  }}
                >
                  <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 800, color: '#fff' }}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute', left: 16, bottom: 14, display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, color: colors.mutedDark, pointerEvents: 'none',
        }}>
          <span>Menos</span>
          <span style={{ display: 'inline-block', width: 90, height: 5, borderRadius: 3, background: 'linear-gradient(90deg,#17324a,#2f6fd6,#f5a623)' }} />
          <span>Mais</span>
          {modo === '3d' && <span style={{ marginLeft: 10 }}>· arraste para girar</span>}
        </div>
      </div>

      <div style={{ minHeight: 44 }}>
        {sel ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 800 }}>{sel.value}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{filtros.find((f) => f.key === filtro)?.label}</div>
            <div style={{ fontSize: 13, color: colors.muted }}>em {sel.label}</div>
            <div style={{ fontSize: 12, color: colors.mutedDark }}>
              {total > 0 ? `${Math.round((sel.value / total) * 100)}% do total` : ''}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: colors.mutedDark }}>
            Toque num setor para ver o detalhe. {labelTipo('finalizacao') && ''}
          </div>
        )}
      </div>
    </div>
  );
}

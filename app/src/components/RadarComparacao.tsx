import { useState } from 'react';
import { colors, fontDisplay, rotulo } from '../colors';
import type { LinhaJogador } from '../hooks/useComparacao';
import type { MetricaDef } from '../stats';

interface Props {
  linhas: LinhaJogador[];
  metricas: MetricaDef[];
  cores: string[];
  sufixoBase: string;
}

const W = 560;
const H = 470;
const CX = W / 2;
const CY = 218;
const R = 152;
const ANEIS = [25, 50, 75, 100];

/** Radar polygons all overlap, so any two colours can end up side by side — the
 *  harder all-pairs colour test applies, and it caps this form at three series.
 *  A fourth hue cannot be made to clear it by re-picking: it is the form binding,
 *  not the palette. The bar view carries the fourth player. */
export const RADAR_MAX = 3;

/** Short forms, because nine full metric names around a circle collide. */
const CURTO: Record<string, string> = {
  gols: 'Gols',
  assistencias: 'Assist.',
  finalizacoes: 'Finaliz.',
  conversao: 'Conversão',
  passes: 'Passes',
  precisaoPasse: 'Precisão',
  recuperacoes: 'Recuper.',
  perdas: 'Perdas',
  saldoBola: 'Saldo',
};

export default function RadarComparacao({ linhas, metricas, cores, sufixoBase }: Props) {
  const [foco, setFoco] = useState<number | null>(null);
  const n = metricas.length;

  const angulo = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const ponto = (i: number, raio: number) => ({
    x: CX + raio * Math.cos(angulo(i)),
    y: CY + raio * Math.sin(angulo(i)),
  });

  /** The angular slice belonging to one axis, out past its label. */
  const setor = (i: number) => {
    const meio = Math.PI / n;
    const r = R + 44;
    const a0 = angulo(i) - meio;
    const a1 = angulo(i) + meio;
    const p0 = { x: CX + r * Math.cos(a0), y: CY + r * Math.sin(a0) };
    const p1 = { x: CX + r * Math.cos(a1), y: CY + r * Math.sin(a1) };
    return `M${CX},${CY}L${p0.x.toFixed(1)},${p0.y.toFixed(1)}A${r},${r} 0 0 1 ${p1.x.toFixed(1)},${p1.y.toFixed(1)}Z`;
  };

  const anelPath = (pct: number) =>
    metricas
      .map((_, i) => {
        const p = ponto(i, (pct / 100) * R);
        return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join('') + 'Z';

  const poligono = (l: LinhaJogador) =>
    metricas
      .map((m, i) => {
        const pct = l.celulas[m.key].percentil ?? 0;
        const p = ponto(i, (pct / 100) * R);
        return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join('') + 'Z';

  const mFoco = foco !== null ? metricas[foco] : null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: 620, height: 'auto', display: 'block', margin: '0 auto' }}
        role="img"
        aria-label={`Radar comparando ${linhas.map((l) => l.jogador.nome).join(', ')} em ${n} métricas. Cada eixo é a posição no grupo, de 0 na borda interna a 100 na externa.`}
      >
        {ANEIS.map((a) => (
          <path
            key={a} d={anelPath(a)} fill="none"
            stroke={a === 100 ? colors.borderStrong : colors.border}
            strokeWidth={1}
          />
        ))}

        {metricas.map((_, i) => {
          const p = ponto(i, R);
          return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />;
        })}

        {mFoco && (() => {
          const p = ponto(foco as number, R);
          return <line x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={colors.text} strokeWidth={1.5} opacity={0.4} />;
        })()}

        {/* Fills first, outlines after, so no polygon is buried by the next one's wash. */}
        {linhas.map((l, li) => (
          <path key={`f${l.jogador.id}`} d={poligono(l)} fill={cores[li]} opacity={0.13} />
        ))}
        {linhas.map((l, li) => (
          <path
            key={`s${l.jogador.id}`} d={poligono(l)} fill="none"
            stroke={cores[li]} strokeWidth={2.5} strokeLinejoin="round"
          />
        ))}

        {linhas.map((l, li) =>
          metricas.map((m, i) => {
            const cel = l.celulas[m.key];
            const p = ponto(i, ((cel.percentil ?? 0) / 100) * R);
            return (
              <circle
                key={`${l.jogador.id}-${m.key}`}
                cx={p.x} cy={p.y} r={foco === i ? 5 : 3.5}
                fill={cel.percentil === null ? colors.cardBg : cores[li]}
                stroke={cores[li]} strokeWidth={2}
              />
            );
          }),
        )}

        {metricas.map((m, i) => {
          const p = ponto(i, R + 26);
          const cos = Math.cos(angulo(i));
          const sin = Math.sin(angulo(i));
          const anchor = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle';
          return (
            <g key={m.key}>
              <text
                x={p.x} y={p.y + (sin > 0.6 ? 9 : sin < -0.6 ? -2 : 4)}
                textAnchor={anchor} fontSize={12}
                fontWeight={foco === i ? 700 : 600}
                fill={foco === i ? colors.text : colors.muted}
                style={{ pointerEvents: 'none' }}
              >
                {CURTO[m.key] ?? m.label}
                {m.melhorQuando === 'baixo' ? ' ↓' : ''}
              </text>
            </g>
          );
        })}

        <text x={CX + 5} y={CY - R + 12} fontSize={10} fill={colors.mutedDark} style={{ pointerEvents: 'none' }}>100</text>
        <text x={CX + 5} y={CY - 4} fontSize={10} fill={colors.mutedDark} style={{ pointerEvents: 'none' }}>0</text>

        {/* Hit targets last, so they sit above everything. A whole wedge per axis:
            people point at the data point or the label, not at an exact spoke. */}
        {metricas.map((m, i) => (
          <path
            key={`alvo-${m.key}`}
            d={setor(i)}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onPointerEnter={() => setFoco(i)}
            onPointerLeave={() => setFoco((f) => (f === i ? null : f))}
          />
        ))}
      </svg>

      {/* Read-out instead of a floating tooltip: on a radar the exact value is the
          one thing the shape cannot give you, and a panel works on touch too. */}
      <div style={{
        marginTop: 8, minHeight: 46, padding: '10px 14px',
        background: colors.cardBgAlt, border: `1px solid ${colors.border}`, borderRadius: 3,
      }}>
        {mFoco === null ? (
          <div style={{ fontSize: 12, color: colors.mutedDark }}>
            Toque num eixo — ou passe o cursor — para ver os valores. O eixo marcado com ↓ é aquele em que menos é melhor.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 130 }}>
              {mFoco.label}
              <span style={{ ...rotulo, color: colors.mutedDark, marginLeft: 8 }}>
                {mFoco.agregacao === 'soma' ? sufixoBase : mFoco.agregacao === 'media' ? 'média' : 'recorde'}
              </span>
            </span>
            {linhas.map((l, li) => {
              const cel = l.celulas[mFoco.key];
              return (
                <span key={l.jogador.id} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12 }}>
                  <i style={{ width: 9, height: 9, borderRadius: 1, background: cores[li], display: 'inline-block' }} />
                  <span style={{ color: colors.muted }}>{l.jogador.nome}</span>
                  <b style={{ fontFamily: fontDisplay, fontSize: 15 }}>
                    {cel.valor === null
                      ? '—'
                      : `${cel.valor.toFixed(mFoco.agregacao === 'soma' ? 2 : (mFoco.decimais ?? 0))}${mFoco.sufixo ?? ''}`}
                  </b>
                  {cel.posicaoRank !== null && (
                    <span style={{ color: colors.mutedDark, fontSize: 11 }}>{cel.posicaoRank}º de {cel.pool}</span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ ...rotulo, color: colors.mutedDark, marginTop: 10 }}>
        Distância do centro = posição no grupo · borda = melhor do grupo
      </div>
    </div>
  );
}

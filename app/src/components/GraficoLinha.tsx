import { useId, useState } from 'react';
import { colors, fontDisplay } from '../colors';

export interface PontoSerie {
  label: string;
  valor: number | null;
  sub?: string;
}

interface Props {
  pontos: PontoSerie[];
  cor?: string;
  altura?: number;
  sufixo?: string;
  decimais?: number;
  /** Forces the axis to start at zero — counts should never be shown on a floating base. */
  baseZero?: boolean;
}

const W = 640;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 14;
const PAD_B = 18;

/** Gaps are real: a session with no measurement is not a zero, so the line breaks
 *  instead of pretending the player stood still. */
export default function GraficoLinha({
  pontos, cor = colors.blue, altura = 170, sufixo = '', decimais = 0, baseZero = true,
}: Props) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const H = altura;

  const validos = pontos.filter((p) => p.valor !== null) as { label: string; valor: number; sub?: string }[];
  if (validos.length === 0) {
    return (
      <div style={{
        height: H, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, color: colors.mutedDark,
      }}>
        Sem dados registrados ainda.
      </div>
    );
  }

  const valores = validos.map((p) => p.valor);
  const max = Math.max(...valores);
  const minBruto = Math.min(...valores);
  const min = baseZero ? Math.min(0, minBruto) : minBruto;
  const span = max - min || 1;
  const topo = max + span * 0.15;
  const base = baseZero ? min : min - span * 0.15;
  const alcance = topo - base || 1;

  const n = pontos.length;
  const px = (i: number) => (n > 1 ? PAD_L + (i * (W - PAD_L - PAD_R)) / (n - 1) : W / 2);
  const py = (v: number) => H - PAD_B - ((v - base) / alcance) * (H - PAD_T - PAD_B);

  // Break the path wherever a session has no value.
  const segmentos: string[] = [];
  let atual: string[] = [];
  pontos.forEach((p, i) => {
    if (p.valor === null) {
      if (atual.length > 1) segmentos.push(atual.join(' '));
      atual = [];
      return;
    }
    atual.push(`${atual.length === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(p.valor).toFixed(1)}`);
  });
  if (atual.length > 1) segmentos.push(atual.join(' '));

  const ultimoIdx = pontos.map((p, i) => (p.valor !== null ? i : -1)).filter((i) => i >= 0).pop() ?? 0;
  const areaPath = segmentos.length === 1
    ? `${segmentos[0]} L${px(ultimoIdx).toFixed(1)},${(H - PAD_B).toFixed(1)} L${px(pontos.findIndex((p) => p.valor !== null)).toFixed(1)},${(H - PAD_B).toFixed(1)} Z`
    : null;

  const fmt = (v: number) => `${v.toFixed(decimais)}${sufixo}`;
  const ativo = hover !== null && pontos[hover]?.valor !== null ? hover : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity={0.28} />
            <stop offset="100%" stopColor={cor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD_L} x2={W - PAD_R}
            y1={PAD_T + t * (H - PAD_T - PAD_B)} y2={PAD_T + t * (H - PAD_T - PAD_B)}
            stroke={colors.rowBorder} strokeWidth={1}
          />
        ))}

        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {segmentos.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={cor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {pontos.map((p, i) => {
          if (p.valor === null) return null;
          const ehUltimo = i === ultimoIdx;
          const destacado = ativo === i || ehUltimo;
          return (
            <circle
              key={i}
              cx={px(i)} cy={py(p.valor)}
              r={destacado ? 5 : 3}
              fill={ehUltimo ? cor : colors.bg}
              stroke={cor}
              strokeWidth={2}
            />
          );
        })}

        {/* Faixas invisíveis de captura: alvo generoso mesmo com muitos pontos */}
        {pontos.map((_, i) => (
          <rect
            key={`h${i}`}
            x={px(i) - (W / Math.max(n, 1)) / 2} y={0}
            width={W / Math.max(n, 1)} height={H}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover((h) => (h === i ? null : h))}
          />
        ))}
      </svg>

      <div style={{
        position: 'absolute', top: 0, right: 0, fontSize: 10, color: colors.mutedDark,
        fontFamily: fontDisplay, fontWeight: 700, letterSpacing: 0.5,
      }}>
        máx {fmt(max)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: colors.mutedDark }}>
        <span>{pontos[0]?.label}</span>
        <span>{pontos[n - 1]?.label}</span>
      </div>

      {ativo !== null && (
        <div style={{
          position: 'absolute', top: -4, left: 0, right: 0, textAlign: 'center',
          fontSize: 11, color: colors.text, pointerEvents: 'none',
        }}>
          <span style={{ background: colors.cardBgDense, border: `1px solid ${colors.borderAlt}`, borderRadius: 6, padding: '3px 8px' }}>
            <strong style={{ fontFamily: fontDisplay, fontSize: 13 }}>{fmt(pontos[ativo].valor as number)}</strong>
            <span style={{ color: colors.mutedDark, marginLeft: 6 }}>{pontos[ativo].label}</span>
            {pontos[ativo].sub && <span style={{ color: colors.mutedDark, marginLeft: 6 }}>· {pontos[ativo].sub}</span>}
          </span>
        </div>
      )}
    </div>
  );
}

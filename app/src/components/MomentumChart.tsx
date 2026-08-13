import { useId, useState } from 'react';
import { colors, fontDisplay, rotulo } from '../colors';
import type { Golzinho, PontoMomentum } from '../hooks/useMomentum';

interface Props {
  pontos: PontoMomentum[];
  gols: Golzinho[];
  duracao: number;
  nomeNos: string;
  nomeAdv: string;
  altura?: number;
}

const W = 900;
const PAD_L = 6;
const PAD_R = 6;
const PAD_TOP = 18;
const PAD_BOT = 20;

/** Diverging area around a zero baseline: one side above, the other below.
 *
 *  The form is the point. A stacked or side-by-side chart would make the reader
 *  compare two lengths; putting the two sides on opposite sides of one baseline
 *  means the shape itself is the answer, which is why it is legible in about half
 *  a second. Up is us, down is them — encoded by position first, so the colour is
 *  reinforcement rather than the only channel. */
export default function MomentumChart({ pontos, gols, duracao, nomeNos, nomeAdv, altura = 210 }: Props) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const H = altura;
  const meio = PAD_TOP + (H - PAD_TOP - PAD_BOT) / 2;
  const amp = (H - PAD_TOP - PAD_BOT) / 2;

  const px = (m: number) => PAD_L + (duracao > 0 ? (m / duracao) * (W - PAD_L - PAD_R) : 0);
  const py = (v: number) => meio - v * amp;

  const corpo = pontos.map((p) => `L${px(p.minuto).toFixed(1)},${py(p.valor).toFixed(1)}`).join('');
  const area = `M${px(0).toFixed(1)},${meio.toFixed(1)}${corpo}L${px(duracao).toFixed(1)},${meio.toFixed(1)}Z`;

  // Minute ticks: every 5 on a short session, every 10 on a long one.
  const passo = duracao > 50 ? 10 : 5;
  const ticks: number[] = [];
  for (let m = 0; m <= duracao; m += passo) ticks.push(m);

  const ativo = hover !== null ? pontos[hover] : null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 18, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
          <i style={{ width: 10, height: 10, background: colors.blue, display: 'inline-block', borderRadius: 1 }} />
          <span style={{ fontWeight: 600 }}>{nomeNos}</span>
          <span style={{ color: colors.mutedDark, fontSize: 11 }}>acima</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
          <i style={{ width: 10, height: 10, background: colors.gold, display: 'inline-block', borderRadius: 1 }} />
          <span style={{ fontWeight: 600 }}>{nomeAdv}</span>
          <span style={{ color: colors.mutedDark, fontSize: 11 }}>abaixo</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={`Momento de ataque ao longo de ${duracao} minutos. Acima da linha, pressão de ${nomeNos}; abaixo, de ${nomeAdv}.`}
      >
        <defs>
          <clipPath id={`cima-${uid}`}><rect x="0" y="0" width={W} height={meio} /></clipPath>
          <clipPath id={`baixo-${uid}`}><rect x="0" y={meio} width={W} height={H - meio} /></clipPath>
        </defs>

        {/* Recessive grid: the eye should land on the shape, not the chrome. */}
        <line x1={PAD_L} y1={PAD_TOP} x2={W - PAD_R} y2={PAD_TOP} stroke={colors.border} strokeWidth={1} />
        <line x1={PAD_L} y1={H - PAD_BOT} x2={W - PAD_R} y2={H - PAD_BOT} stroke={colors.border} strokeWidth={1} />

        <path d={area} fill={colors.blue} clipPath={`url(#cima-${uid})`} />
        <path d={area} fill={colors.gold} clipPath={`url(#baixo-${uid})`} />

        <line x1={PAD_L} y1={meio} x2={W - PAD_R} y2={meio} stroke={colors.borderStrong} strokeWidth={1.5} />

        {ticks.map((m) => (
          <text
            key={m} x={px(m)} y={H - 6} fontSize={10} fill={colors.mutedDark}
            textAnchor={m === 0 ? 'start' : m >= duracao ? 'end' : 'middle'}
          >
            {m}&#8242;
          </text>
        ))}

        {/* Goals are what the reader is scanning for, so they get a direct label
            rather than being left to the tooltip. Selective, though: in a 9–1 the
            minutes run into each other, and a marker with no room for its number
            still says "goal here" — a pile of overlapping numbers says nothing. */}
        {(() => {
          const ROTULO_MIN_PX = 48;
          const ultimoRotulo: Record<string, number> = {};
          return gols.map((g, i) => {
            const y = g.lado === 'nos' ? PAD_TOP + 8 : H - PAD_BOT - 8;
            const cor = g.lado === 'nos' ? colors.blue : colors.gold;
            const x = px(g.minuto);
            const anterior = ultimoRotulo[g.lado];
            const cabe = anterior === undefined || x - anterior >= ROTULO_MIN_PX;
            if (cabe) ultimoRotulo[g.lado] = x;
            return (
              <g key={i}>
                <line x1={x} y1={meio} x2={x} y2={y} stroke={cor} strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={x} cy={y} r={4} fill={colors.cardBg} stroke={cor} strokeWidth={2} />
                {cabe && (
                  <text x={x + 7} y={y + 3.5} fontSize={10} fontWeight={700} fill={colors.text}>
                    {g.minuto}&#8242;
                  </text>
                )}
              </g>
            );
          });
        })()}

        {ativo && (
          <line x1={px(ativo.minuto)} y1={PAD_TOP} x2={px(ativo.minuto)} y2={H - PAD_BOT} stroke={colors.text} strokeWidth={1} opacity={0.45} />
        )}

        {/* Generous hit targets, one per minute. */}
        {pontos.map((p, i) => (
          <rect
            key={i}
            x={px(p.minuto) - (W - PAD_L - PAD_R) / Math.max(duracao, 1) / 2}
            y={0}
            width={(W - PAD_L - PAD_R) / Math.max(duracao, 1)}
            height={H}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover((h) => (h === i ? null : h))}
          />
        ))}
      </svg>

      {ativo && (
        <div style={{
          position: 'absolute', top: 26, left: `${(px(ativo.minuto) / W) * 100}%`,
          transform: 'translateX(-50%)', pointerEvents: 'none',
          background: colors.cardBgDense, border: `1px solid ${colors.borderStrong}`, borderRadius: 3,
          padding: '6px 10px', whiteSpace: 'nowrap', fontSize: 11,
        }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 800 }}>{ativo.minuto}&#8242;</div>
          <div style={{ color: colors.blue, fontWeight: 600 }}>{nomeNos} {ativo.nos.toFixed(1)}</div>
          <div style={{ color: colors.gold, fontWeight: 600 }}>{nomeAdv} {ativo.adversario.toFixed(1)}</div>
        </div>
      )}

      <div style={{ ...rotulo, color: colors.mutedDark, marginTop: 6 }}>
        Pressão relativa · janela de 5 minutos
      </div>
    </div>
  );
}

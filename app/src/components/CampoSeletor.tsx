import { useRef, useState } from 'react';
import { colors } from '../colors';
import { pitchGeom, setores, toSvgY } from '../pitch';

const W = 300;
const H = 500;
const g = pitchGeom;

const px = (x: number) => x * W;
const py = (y: number) => toSvgY(y) * H;

interface Props {
  cols: number;
  rows: number;
  /** Currently picked point, normalized pitch coords. */
  valor?: { x: number; y: number };
  /** Origin already picked, drawn as the tail of a trajectory arrow. */
  origem?: { x: number; y: number };
  onPick: (x: number, y: number) => void;
}

/** Marks the exact tapped point, not the sector centre — the sector grid is a visual
 *  aim guide, and coordinates are already stored full-pitch, so precision is free. */
export default function CampoSeletor({ cols, rows, valor, origem, onPick }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const cells = setores(cols, rows);

  function coordDoEvento(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return { x: nx, y: 1 - ny };
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const c = coordDoEvento(e);
    if (c) onPick(c.x, c.y);
  }

  const stripes = Array.from({ length: 8 }, (_, i) => i);
  const areaTop = (topo: boolean) => {
    const depth = g.penaltyDepth;
    const y = topo ? 1 - depth : 0;
    return { x: px(0.5 - g.penaltyWidth / 2), y: py(y + depth), w: px(g.penaltyWidth), h: depth * H };
  };
  const pequena = (topo: boolean) => {
    const depth = g.goalAreaDepth;
    const y = topo ? 1 - depth : 0;
    return { x: px(0.5 - g.goalAreaWidth / 2), y: py(y + depth), w: px(g.goalAreaWidth), h: depth * H };
  };

  const linha = { stroke: 'rgba(238,242,246,0.30)', strokeWidth: 1.6, fill: 'none' } as const;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        onPointerDown={handlePointerDown}
        style={{
          width: '100%', maxWidth: 300, maxHeight: '52vh', aspectRatio: `${W} / ${H}`, borderRadius: 12,
          border: `1px solid ${colors.borderAlt}`, cursor: 'crosshair', touchAction: 'manipulation',
          display: 'block',
        }}
      >
        <defs>
          <linearGradient id="gramado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#13211a" />
            <stop offset="100%" stopColor="#0d1713" />
          </linearGradient>
        </defs>

        <rect x={0} y={0} width={W} height={H} fill="url(#gramado)" />
        {stripes.map((i) => (
          i % 2 === 0 ? (
            <rect key={i} x={0} y={(i * H) / stripes.length} width={W} height={H / stripes.length} fill="rgba(255,255,255,0.014)" />
          ) : null
        ))}

        {/* Marcações */}
        <rect x={6} y={6} width={W - 12} height={H - 12} {...linha} />
        <line x1={6} y1={H / 2} x2={W - 6} y2={H / 2} {...linha} />
        <circle cx={W / 2} cy={H / 2} r={g.centerCircleR * W} {...linha} />
        <circle cx={W / 2} cy={H / 2} r={2.5} fill="rgba(238,242,246,0.35)" />

        {[true, false].map((topo) => {
          const a = areaTop(topo);
          const p = pequena(topo);
          const spotY = topo ? py(1 - g.penaltySpot) : py(g.penaltySpot);
          const golY = topo ? 6 : H - 6;
          return (
            <g key={String(topo)}>
              <rect x={a.x} y={a.y} width={a.w} height={a.h} {...linha} />
              <rect x={p.x} y={p.y} width={p.w} height={p.h} {...linha} />
              <circle cx={W / 2} cy={spotY} r={2.5} fill="rgba(238,242,246,0.35)" />
              <line
                x1={px(0.5 - g.goalWidth / 2)} y1={golY} x2={px(0.5 + g.goalWidth / 2)} y2={golY}
                stroke={topo ? colors.blue : 'rgba(238,242,246,0.55)'} strokeWidth={4} strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Grade de setores: guia visual, não destino do clique */}
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={`c${i}`} x1={px((i + 1) / cols)} y1={6} x2={px((i + 1) / cols)} y2={H - 6}
            stroke="rgba(79,142,247,0.16)" strokeWidth={1} strokeDasharray="4 5" />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line key={`r${i}`} x1={6} y1={py((i + 1) / rows)} x2={W - 6} y2={py((i + 1) / rows)}
            stroke="rgba(79,142,247,0.16)" strokeWidth={1} strokeDasharray="4 5" />
        ))}

        {cells.map((s) => (
          <rect
            key={s.index}
            x={px(s.x0)} y={py(s.y1)} width={px(s.x1 - s.x0)} height={(s.y1 - s.y0) * H}
            fill={hover === s.index ? 'rgba(79,142,247,0.10)' : 'transparent'}
            onPointerEnter={() => setHover(s.index)}
            onPointerLeave={() => setHover((h) => (h === s.index ? null : h))}
          />
        ))}

        {/* Trajetória */}
        {origem && valor && (
          <g>
            <line
              x1={px(origem.x)} y1={py(origem.y)} x2={px(valor.x)} y2={py(valor.y)}
              stroke={colors.gold} strokeWidth={2.5} strokeLinecap="round" markerEnd="url(#ponta)"
            />
            <circle cx={px(origem.x)} cy={py(origem.y)} r={5} fill="none" stroke={colors.gold} strokeWidth={2} />
          </g>
        )}
        {origem && !valor && (
          <circle cx={px(origem.x)} cy={py(origem.y)} r={5} fill="none" stroke={colors.gold} strokeWidth={2} />
        )}
        <defs>
          <marker id="ponta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.gold} />
          </marker>
        </defs>

        {valor && (
          <g>
            <circle cx={px(valor.x)} cy={py(valor.y)} r={11} fill="rgba(79,142,247,0.20)" />
            <circle cx={px(valor.x)} cy={py(valor.y)} r={5.5} fill={colors.blue} stroke="#0a0e13" strokeWidth={1.5} />
          </g>
        )}

        {/* Orientação dentro do próprio campo, para não depender de layout externo */}
        <text x={14} y={26} fill={colors.blue} fontSize={11} fontWeight={800} letterSpacing={1} opacity={0.85}>
          ATAQUE ▲
        </text>
        <text x={14} y={H - 16} fill={colors.mutedDark} fontSize={11} fontWeight={800} letterSpacing={1} opacity={0.7}>
          DEFESA
        </text>
      </svg>
    </div>
  );
}

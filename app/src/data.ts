import type { EventTypeMeta, GoalRecord, KeyLabel, StepName, EventTypeKey } from './types';

export const squad = [
  'Lucas Silva', 'Rafael Souza', 'Bruno Costa', 'Diego Martins', 'Thiago Alves',
  'Gabriel Rocha', 'Matheus Lima', 'Eduardo Pinto', 'Felipe Santos', 'Rodrigo Nunes',
  'André Melo', 'Caio Ferreira',
];

export const fieldPlayers = squad.slice(0, 7);

export const historicalMatches = [
  'R1 · vs Falcões', 'R2 · vs Titans', 'R3 · vs Leões FC', 'R4 · vs Furacão',
  'R5 · vs Atlético Vale', 'R6 · vs Unidos SC', 'R7 · vs Estrela Azul', 'R8 · vs Norte FC',
];

export const LIVE_MATCH_INDEX = historicalMatches.length;
export const matches = [...historicalMatches, 'Ao vivo (atual)'];

export const zoneLabels = [
  'Esquerda afastada', 'Centro afastado', 'Direita afastada',
  'Esquerda meia-lua', 'Centro meia-lua', 'Direita meia-lua',
  'Esquerda pequena área', 'Centro pequena área', 'Direita pequena área',
];

export const detailOptions: KeyLabel[] = [
  { key: 'pe-direito', label: 'Pé direito' },
  { key: 'pe-esquerdo', label: 'Pé esquerdo' },
  { key: 'cabeca', label: 'Cabeça' },
  { key: 'bola-parada', label: 'Bola parada' },
];

export const originOptions: KeyLabel[] = [
  { key: 'contra-ataque', label: 'Contra-ataque' },
  { key: 'bola-parada', label: 'Bola parada' },
  { key: 'transicao', label: 'Transição' },
  { key: 'jogo-organizado', label: 'Jogo organizado' },
];

export const cardColors: KeyLabel[] = [
  { key: 'amarelo', label: 'Cartão amarelo' },
  { key: 'vermelho', label: 'Cartão vermelho' },
];

export const resultadoOptions: KeyLabel[] = [
  { key: 'certo', label: 'Certo' },
  { key: 'errado', label: 'Errado' },
];

export const eventTypesMeta: EventTypeMeta[] = [
  { key: 'gol', label: 'Gol', mono: 'GOL', shortcut: 'G' },
  { key: 'cartao', label: 'Cartão', mono: 'CA', shortcut: 'C' },
  { key: 'passe', label: 'Passe', mono: 'PA', shortcut: 'P' },
  { key: 'cruzamento', label: 'Cruzamento', mono: 'CR', shortcut: 'X' },
  { key: 'lancamento', label: 'Lançamento', mono: 'LA', shortcut: 'L' },
];

export const stepSeq: Record<EventTypeKey, StepName[]> = {
  gol: ['zone', 'detail', 'origin', 'scorer', 'assist'],
  cartao: ['cardColor', 'player'],
  passe: ['player', 'resultado'],
  cruzamento: ['player', 'resultado'],
  lancamento: ['player', 'resultado'],
};

export const goalOriginBaseline: Record<string, number> = {
  'contra-ataque': 19,
  'bola-parada': 12,
  'transicao': 10,
  'jogo-organizado': 15,
};

export const heatmapBaseline = [3, 8, 4, 2, 15, 3, 5, 12, 2];

/** Deterministic pseudo-random seed, ported verbatim from the design prototype. */
function seedGoalsForPlayer(idx: number): number[] {
  let seed = (idx + 1) * 9301 + 49297;
  const arr: number[] = [];
  for (let i = 0; i < 8; i++) {
    seed = (seed * 233280 + idx * 17 + i * 31) % 1000;
    const v = (Math.abs(seed) % 1000) / 1000;
    arr.push(Math.floor(v * 3.2));
  }
  return arr;
}

export const historicalGoalsByMatch: Record<string, number[]> = Object.fromEntries(
  squad.map((p, idx) => [p, seedGoalsForPlayer(idx)]),
);

export function labelFor(list: KeyLabel[], key: string | undefined): string {
  if (!key) return '';
  const found = list.find((o) => o.key === key);
  return found ? found.label : '';
}

export function buildGoalSummary(data: { zone?: number; detail?: string; origin?: string; scorer?: string; assist?: string }): string {
  const zone = data.zone !== undefined ? zoneLabels[data.zone] : '';
  const det = labelFor(detailOptions, data.detail);
  const origin = labelFor(originOptions, data.origin);
  const assist = data.assist && data.assist !== 'none' ? ` · Assist.: ${data.assist}` : ' · Sem assistência';
  return `${data.scorer} · ${zone} · ${det} · ${origin}${assist}`;
}

export function buildSummary(eventType: EventTypeKey, data: { zone?: number; detail?: string; origin?: string; scorer?: string; assist?: string; cardColor?: string; player?: string; resultado?: string }): string {
  if (eventType === 'gol') return buildGoalSummary(data);
  if (eventType === 'cartao') return `${labelFor(cardColors, data.cardColor)} · ${data.player}`;
  return `${data.player} · ${labelFor(resultadoOptions, data.resultado)}`;
}

export function toGoalRecord(id: string, matchIndex: number, data: { zone?: number; detail?: string; origin?: string; scorer?: string; assist?: string }): GoalRecord {
  return {
    id,
    matchIndex,
    zone: data.zone ?? 0,
    detail: data.detail ?? '',
    origin: data.origin ?? '',
    scorer: data.scorer ?? '',
    assist: data.assist,
  };
}

/** Blue -> blue -> orange interpolation, colorblind-safe (never red/green as a pair). */
export function heatColor(v: number, max: number): string {
  const t = max > 0 ? v / max : 0;
  const c1 = [23, 50, 74];
  const c2 = [47, 111, 214];
  const c3 = [245, 166, 35];
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const k = t / 0.5;
    r = c1[0] + (c2[0] - c1[0]) * k;
    g = c1[1] + (c2[1] - c1[1]) * k;
    b = c1[2] + (c2[2] - c1[2]) * k;
  } else {
    const k = (t - 0.5) / 0.5;
    r = c2[0] + (c3[0] - c2[0]) * k;
    g = c2[1] + (c3[1] - c2[1]) * k;
    b = c2[2] + (c3[2] - c2[2]) * k;
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export const stepTitles: Record<string, string> = {
  zone: 'ZONA DE FINALIZAÇÃO',
  detail: 'COMO FOI O GOL',
  origin: 'ORIGEM DA JOGADA',
  scorer: 'QUEM MARCOU',
  assist: 'ASSISTÊNCIA (OPCIONAL)',
  cardColor: 'TIPO DE CARTÃO',
  player: 'JOGADOR',
  resultado: 'RESULTADO',
};

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

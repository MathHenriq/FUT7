import type { EventTypeKey, EventTypeMeta, EventoRegistrado, FlowData, KeyLabel, Sessao, StepName, TipoSessao } from './types';

export const squad = [
  'Lucas Silva', 'Rafael Souza', 'Bruno Costa', 'Diego Martins', 'Thiago Alves',
  'Gabriel Rocha', 'Matheus Lima', 'Eduardo Pinto', 'Felipe Santos', 'Rodrigo Nunes',
  'André Melo', 'Caio Ferreira',
];

export const fieldPlayers = squad.slice(0, 7);

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

export function labelFor(list: KeyLabel[], key: string | undefined): string {
  if (!key) return '';
  const found = list.find((o) => o.key === key);
  return found ? found.label : '';
}

export function buildSummary(eventType: EventTypeKey, data: FlowData): string {
  if (eventType === 'gol') {
    const zone = data.zone !== undefined ? zoneLabels[data.zone] : '';
    const det = labelFor(detailOptions, data.detail);
    const origin = labelFor(originOptions, data.origin);
    const assist = data.assist && data.assist !== 'none' ? ` · Assist.: ${data.assist}` : ' · Sem assistência';
    return `${data.scorer} · ${zone} · ${det} · ${origin}${assist}`;
  }
  if (eventType === 'cartao') return `${labelFor(cardColors, data.cardColor)} · ${data.player}`;
  return `${data.player} · ${labelFor(resultadoOptions, data.resultado)}`;
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

export function formatMinuto(min: number): string {
  return `${min}'`;
}

export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const opponents = ['Falcões', 'Titans', 'Leões FC', 'Furacão', 'Atlético Vale', 'Unidos SC', 'Estrela Azul', 'Norte FC'];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Seed data ported from the earlier fictitious dashboard baseline, now expressed as real sessões/eventos. */
export function seedSessoesEEventos(): { sessoes: Sessao[]; eventos: EventoRegistrado[] } {
  const sessoes: Sessao[] = opponents.map((op, i) => {
    const rand = seededRand((i + 1) * 733);
    const placarNos = Math.floor(rand() * 4);
    const placarAdversario = Math.floor(rand() * 3);
    const daysAgo = (opponents.length - i) * 7;
    const d = new Date(Date.now() - daysAgo * 86400000);
    return {
      id: `seed-partida-${i}`,
      tipoSessao: 'partida' as TipoSessao,
      data: d.toISOString().slice(0, 10),
      label: `vs ${op}`,
      comVideo: false,
      placarNos,
      placarAdversario,
      createdAt: d.getTime(),
    };
  });

  const eventos: EventoRegistrado[] = [];
  squad.forEach((player, pIdx) => {
    const rand = seededRand((pIdx + 1) * 9301 + 49297);
    sessoes.forEach((sessao) => {
      const count = Math.floor(rand() * 3.2);
      for (let i = 0; i < count; i++) {
        const zone = Math.floor(rand() * zoneLabels.length);
        const detail = detailOptions[Math.floor(rand() * detailOptions.length)].key;
        const origin = originOptions[Math.floor(rand() * originOptions.length)].key;
        const assistCandidates = fieldPlayers.filter((p) => p !== player);
        const assist = rand() < 0.45 ? assistCandidates[Math.floor(rand() * assistCandidates.length)] : 'none';
        const minuto = 1 + Math.floor(rand() * 39);
        const data: FlowData = { zone, detail, origin, scorer: player, assist };
        eventos.push({
          id: `seed-evt-${sessao.id}-${pIdx}-${i}`,
          sessaoId: sessao.id,
          tipo: 'gol',
          minuto,
          data,
          summary: buildSummary('gol', data),
          criadoEm: sessao.createdAt + minuto * 60000,
        });
      }
    });
  });

  return { sessoes, eventos };
}

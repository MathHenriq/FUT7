import type {
  EventTypeKey, EventTypeMeta, EventoRegistrado, FlowData, GradeZonas, Jogador,
  KeyLabel, Posicao, Sessao, StepName, TipoSessao,
} from './types';

export const posicoes: { key: Posicao; label: string; curto: string }[] = [
  { key: 'goleiro', label: 'Goleiro', curto: 'GOL' },
  { key: 'zagueiro', label: 'Zagueiro', curto: 'ZAG' },
  { key: 'ala', label: 'Ala', curto: 'ALA' },
  { key: 'meia', label: 'Meia', curto: 'MEI' },
  { key: 'atacante', label: 'Atacante', curto: 'ATA' },
];

export function labelPosicao(p: Posicao): string {
  return posicoes.find((o) => o.key === p)?.label ?? p;
}

export function curtoPosicao(p: Posicao): string {
  return posicoes.find((o) => o.key === p)?.curto ?? '';
}

const elencoSeed: { nome: string; numero: number; posicao: Posicao }[] = [
  { nome: 'Lucas Silva', numero: 10, posicao: 'atacante' },
  { nome: 'Rafael Souza', numero: 9, posicao: 'atacante' },
  { nome: 'Bruno Costa', numero: 8, posicao: 'meia' },
  { nome: 'Diego Martins', numero: 7, posicao: 'ala' },
  { nome: 'Thiago Alves', numero: 11, posicao: 'ala' },
  { nome: 'Gabriel Rocha', numero: 5, posicao: 'meia' },
  { nome: 'Matheus Lima', numero: 6, posicao: 'zagueiro' },
  { nome: 'Eduardo Pinto', numero: 4, posicao: 'zagueiro' },
  { nome: 'Felipe Santos', numero: 3, posicao: 'ala' },
  { nome: 'Rodrigo Nunes', numero: 2, posicao: 'zagueiro' },
  { nome: 'André Melo', numero: 12, posicao: 'meia' },
  { nome: 'Caio Ferreira', numero: 1, posicao: 'goleiro' },
];

export function criarElencoInicial(): Jogador[] {
  return elencoSeed.map((j, i) => ({ id: `jog-seed-${i}`, ativo: true, ...j }));
}

// ---- Pitch coordinates -------------------------------------------------------
// Everything is stored as normalized full-pitch x,y. Sector grids are derived,
// which is what lets the 9 <-> 12 setting re-bucket the whole history losslessly.

export const colunasLabels = ['Esquerda', 'Centro', 'Direita'];

export function faixasLabels(grade: GradeZonas): string[] {
  return grade === 12
    ? ['Ataque', 'Meio ofensivo', 'Meio defensivo', 'Defesa']
    : ['Ataque', 'Meio', 'Defesa'];
}

export function linhasDaGrade(grade: GradeZonas): number {
  return grade === 12 ? 4 : 3;
}

/** Sector index for a coordinate, row 0 = attacking third (top of an attacking-up pitch). */
export function setorIndex(x: number, y: number, grade: GradeZonas): number {
  const cols = 3;
  const rows = linhasDaGrade(grade);
  const c = Math.min(cols - 1, Math.max(0, Math.floor(x * cols)));
  const r = Math.min(rows - 1, Math.max(0, Math.floor((1 - y) * rows)));
  return r * cols + c;
}

export function setorLabels(grade: GradeZonas): string[] {
  const out: string[] = [];
  for (const faixa of faixasLabels(grade)) {
    for (const col of colunasLabels) out.push(`${faixa} ${col.toLowerCase()}`);
  }
  return out;
}

/** Human description of a point, finer than the sector grid so summaries stay readable. */
export function descreveLocal(x?: number, y?: number): string {
  if (x === undefined || y === undefined) return 'local não informado';
  const col = x < 1 / 3 ? 'esquerda' : x < 2 / 3 ? 'centro' : 'direita';
  let faixa: string;
  if (y >= 0.86) faixa = 'pequena área';
  else if (y >= 0.7) faixa = 'meia-lua';
  else if (y >= 0.55) faixa = 'entrada de área';
  else if (y >= 0.35) faixa = 'meio-campo';
  else faixa = 'campo defensivo';
  return `${faixa} ${col}`;
}

/** The 3x3 attacking-third picker still used during capture, expressed as coordinates. */
export const localPresets: { key: string; label: string; x: number; y: number }[] = [
  { key: 'p0', label: 'Esquerda afastada', x: 0.2, y: 0.62 },
  { key: 'p1', label: 'Centro afastado', x: 0.5, y: 0.62 },
  { key: 'p2', label: 'Direita afastada', x: 0.8, y: 0.62 },
  { key: 'p3', label: 'Esquerda meia-lua', x: 0.2, y: 0.78 },
  { key: 'p4', label: 'Centro meia-lua', x: 0.5, y: 0.78 },
  { key: 'p5', label: 'Direita meia-lua', x: 0.8, y: 0.78 },
  { key: 'p6', label: 'Esquerda pequena área', x: 0.2, y: 0.93 },
  { key: 'p7', label: 'Centro pequena área', x: 0.5, y: 0.93 },
  { key: 'p8', label: 'Direita pequena área', x: 0.8, y: 0.93 },
];

// ---- Event vocabulary --------------------------------------------------------

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

const stepSeqBase: Record<EventTypeKey, StepName[]> = {
  gol: ['local', 'detail', 'origin', 'scorer', 'assist'],
  cartao: ['cardColor', 'player'],
  passe: ['player', 'resultado'],
  cruzamento: ['player', 'resultado'],
  lancamento: ['player', 'resultado'],
};

const passosDeJogador: StepName[] = ['scorer', 'assist', 'player'];

/** Opponent events skip our roster steps — we don't keep their squad, and live
 *  tagging has to stay fast. */
export function stepsPara(eventType: EventTypeKey, lado: 'nos' | 'adversario'): StepName[] {
  const seq = stepSeqBase[eventType];
  if (lado === 'nos') return seq;
  const filtrado = seq.filter((s) => !passosDeJogador.includes(s));
  return filtrado.length > 0 ? filtrado : [seq[0]];
}

export const stepTitles: Record<string, string> = {
  local: 'ZONA DE FINALIZAÇÃO',
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

export function buildSummary(eventType: EventTypeKey, data: FlowData, lado: 'nos' | 'adversario'): string {
  const quem = lado === 'adversario' ? 'Adversário' : undefined;
  if (eventType === 'gol') {
    const local = descreveLocal(data.x, data.y);
    const det = labelFor(detailOptions, data.detail);
    const origin = labelFor(originOptions, data.origin);
    const partes = [quem ?? data.scorer, local, det, origin].filter(Boolean);
    if (lado === 'nos') {
      partes.push(data.assist && data.assist !== 'none' ? `Assist.: ${data.assist}` : 'Sem assistência');
    }
    return partes.join(' · ');
  }
  if (eventType === 'cartao') {
    return [labelFor(cardColors, data.cardColor), quem ?? data.player].filter(Boolean).join(' · ');
  }
  return [quem ?? data.player, labelFor(resultadoOptions, data.resultado)].filter(Boolean).join(' · ');
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

export function seedSessoesEEventos(jogadores: Jogador[]): { sessoes: Sessao[]; eventos: EventoRegistrado[] } {
  const linha = jogadores.filter((j) => j.posicao !== 'goleiro');

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
      escalacao: jogadores.map((j) => j.id),
      placarNos,
      placarAdversario,
      createdAt: d.getTime(),
    };
  });

  const eventos: EventoRegistrado[] = [];
  jogadores.forEach((jog, pIdx) => {
    const rand = seededRand((pIdx + 1) * 9301 + 49297);
    sessoes.forEach((sessao) => {
      const count = Math.floor(rand() * 3.2);
      for (let i = 0; i < count; i++) {
        const preset = localPresets[Math.floor(rand() * localPresets.length)];
        const detail = detailOptions[Math.floor(rand() * detailOptions.length)].key;
        const origin = originOptions[Math.floor(rand() * originOptions.length)].key;
        const candidatos = linha.filter((p) => p.id !== jog.id);
        const assist = rand() < 0.45 ? candidatos[Math.floor(rand() * candidatos.length)].nome : 'none';
        const minuto = 1 + Math.floor(rand() * 39);
        const data: FlowData = { x: preset.x, y: preset.y, detail, origin, scorer: jog.nome, assist };
        eventos.push({
          id: `seed-evt-${sessao.id}-${pIdx}-${i}`,
          sessaoId: sessao.id,
          tipo: 'gol',
          lado: 'nos',
          minuto,
          data,
          summary: buildSummary('gol', data, 'nos'),
          criadoEm: sessao.createdAt + minuto * 60000,
        });
      }
    });
  });

  // A few opponent goals so the nós x adversário split has something to show.
  sessoes.forEach((sessao, sIdx) => {
    const rand = seededRand((sIdx + 1) * 4111);
    const count = sessao.placarAdversario ?? 0;
    for (let i = 0; i < count; i++) {
      const preset = localPresets[Math.floor(rand() * localPresets.length)];
      const minuto = 1 + Math.floor(rand() * 39);
      const data: FlowData = {
        x: preset.x,
        y: preset.y,
        detail: detailOptions[Math.floor(rand() * detailOptions.length)].key,
        origin: originOptions[Math.floor(rand() * originOptions.length)].key,
      };
      eventos.push({
        id: `seed-evt-adv-${sessao.id}-${i}`,
        sessaoId: sessao.id,
        tipo: 'gol',
        lado: 'adversario',
        minuto,
        data,
        summary: buildSummary('gol', data, 'adversario'),
        criadoEm: sessao.createdAt + minuto * 60000,
      });
    }
  });

  return { sessoes, eventos };
}

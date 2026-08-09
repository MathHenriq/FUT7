import type {
  EventButton, EventTypeKey, EventoRegistrado, FlowData, GradeZonas, Jogador,
  KeyLabel, Lado, Posicao, ResultadoFin, Sessao, StepName, TipoSessao,
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

export function nomeDe(jogadores: Jogador[], id: string | undefined): string {
  if (!id) return '';
  return jogadores.find((j) => j.id === id)?.nome ?? 'Jogador removido';
}

// ---- Pitch coordinates -------------------------------------------------------

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

export function descreveLocal(x?: number, y?: number): string {
  if (x === undefined || y === undefined) return 'local não informado';
  const col = x < 1 / 3 ? 'esquerda' : x < 2 / 3 ? 'centro' : 'direita';
  let faixa: string;
  if (y >= 0.88) faixa = 'pequena área';
  else if (y >= 0.72) faixa = 'meia-lua';
  else if (y >= 0.52) faixa = 'ataque afastado';
  else if (y >= 0.26) faixa = 'meio-campo';
  else faixa = 'campo defensivo';
  return `${faixa} ${col}`;
}

/** Interim location picker: the FULL pitch, not just the attacking half — a keeper's
 *  kick has to be recordable. Replaced by the pitch-image picker later; coordinates
 *  are already stored full-pitch so that swap costs no data. */
export const localPresets: { key: string; label: string; x: number; y: number }[] = [
  { key: 'l0', label: 'Peq. área esq.', x: 0.2, y: 0.95 },
  { key: 'l1', label: 'Peq. área centro', x: 0.5, y: 0.95 },
  { key: 'l2', label: 'Peq. área dir.', x: 0.8, y: 0.95 },
  { key: 'l3', label: 'Meia-lua esq.', x: 0.2, y: 0.8 },
  { key: 'l4', label: 'Meia-lua centro', x: 0.5, y: 0.8 },
  { key: 'l5', label: 'Meia-lua dir.', x: 0.8, y: 0.8 },
  { key: 'l6', label: 'Ataque afast. esq.', x: 0.2, y: 0.62 },
  { key: 'l7', label: 'Ataque afast. centro', x: 0.5, y: 0.62 },
  { key: 'l8', label: 'Ataque afast. dir.', x: 0.8, y: 0.62 },
  { key: 'l9', label: 'Meio-campo esq.', x: 0.2, y: 0.4 },
  { key: 'l10', label: 'Meio-campo centro', x: 0.5, y: 0.4 },
  { key: 'l11', label: 'Meio-campo dir.', x: 0.8, y: 0.4 },
  { key: 'l12', label: 'Nosso campo esq.', x: 0.2, y: 0.12 },
  { key: 'l13', label: 'Nosso campo centro', x: 0.5, y: 0.12 },
  { key: 'l14', label: 'Nosso campo dir.', x: 0.8, y: 0.12 },
];

// ---- Event vocabulary --------------------------------------------------------

export const resultadoFinOptions: { key: ResultadoFin; label: string }[] = [
  { key: 'gol', label: 'Gol' },
  { key: 'defendida', label: 'Defendida' },
  { key: 'trave', label: 'Na trave' },
  { key: 'fora', label: 'Pra fora' },
  { key: 'bloqueada', label: 'Bloqueada' },
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

export const eventButtons: EventButton[] = [
  { key: 'gol', tipo: 'finalizacao', label: 'Gol', mono: 'GOL', shortcut: 'G', preset: { resultadoFin: 'gol' } },
  { key: 'finalizacao', tipo: 'finalizacao', label: 'Finalização', mono: 'FIN', shortcut: 'F' },
  { key: 'passe', tipo: 'passe', label: 'Passe', mono: 'PA', shortcut: 'P' },
  { key: 'cruzamento', tipo: 'cruzamento', label: 'Cruzamento', mono: 'CR', shortcut: 'X' },
  { key: 'lancamento', tipo: 'lancamento', label: 'Lançamento', mono: 'LA', shortcut: 'L' },
  { key: 'cartao', tipo: 'cartao', label: 'Cartão', mono: 'CA', shortcut: 'C' },
];

export function labelTipo(tipo: EventTypeKey): string {
  switch (tipo) {
    case 'finalizacao': return 'Finalização';
    case 'cartao': return 'Cartão';
    case 'passe': return 'Passe';
    case 'cruzamento': return 'Cruzamento';
    case 'lancamento': return 'Lançamento';
  }
}

const passosDeJogador: StepName[] = ['scorer', 'assist', 'player'];

/** Step order depends on what's already filled: assist only exists for a goal, and the
 *  opponent's roster isn't ours to track, so their events skip player steps. */
export function stepsPara(tipo: EventTypeKey, lado: Lado, data: FlowData): StepName[] {
  let seq: StepName[];
  switch (tipo) {
    case 'finalizacao':
      seq = ['resultadoFin', 'local', 'detail', 'origin', 'scorer'];
      if (data.resultadoFin === 'gol') seq.push('assist');
      break;
    case 'cartao':
      seq = ['cardColor', 'player'];
      break;
    default:
      // Passe / cruzamento / lançamento now record where the ball left from, which is
      // what makes "de onde saem mais lançamentos" answerable at all.
      seq = ['local', 'player', 'resultado'];
      break;
  }
  if (lado === 'nos') return seq;
  const filtrado = seq.filter((s) => !passosDeJogador.includes(s));
  return filtrado.length > 0 ? filtrado : [seq[0]];
}

/** Step -> FlowData field mapping lives here so the capture screen never has to know
 *  that 'local' means two coordinates and 'scorer' means an id. */
export function aplicarPasso(data: FlowData, step: StepName, value: string | number): FlowData {
  switch (step) {
    case 'local': {
      const preset = localPresets.find((p) => p.key === value);
      return { ...data, x: preset?.x, y: preset?.y };
    }
    case 'resultadoFin': return { ...data, resultadoFin: value as ResultadoFin };
    case 'scorer': return { ...data, scorerId: String(value) };
    case 'assist': return { ...data, assistId: String(value) };
    case 'player': return { ...data, playerId: String(value) };
    default: return { ...data, [step]: value };
  }
}

export function passoPreenchido(step: StepName, data: FlowData): boolean {
  switch (step) {
    case 'local': return data.x !== undefined && data.y !== undefined;
    case 'resultadoFin': return data.resultadoFin !== undefined;
    case 'detail': return data.detail !== undefined;
    case 'origin': return data.origin !== undefined;
    case 'scorer': return data.scorerId !== undefined;
    case 'assist': return data.assistId !== undefined;
    case 'cardColor': return data.cardColor !== undefined;
    case 'player': return data.playerId !== undefined;
    case 'resultado': return data.resultado !== undefined;
  }
}

export const stepTitles: Record<StepName, string> = {
  resultadoFin: 'NO QUE DEU A FINALIZAÇÃO',
  local: 'DE ONDE SAIU',
  detail: 'COMO FOI',
  origin: 'ORIGEM DA JOGADA',
  scorer: 'QUEM FINALIZOU',
  assist: 'ASSISTÊNCIA (OPCIONAL)',
  cardColor: 'TIPO DE CARTÃO',
  player: 'JOGADOR',
  resultado: 'RESULTADO',
};

export function labelFor(list: KeyLabel[], key: string | undefined): string {
  if (!key) return '';
  return list.find((o) => o.key === key)?.label ?? '';
}

/** Built at render time from the roster, so renaming a player updates their history. */
export function resumoEvento(evento: EventoRegistrado, jogadores: Jogador[]): string {
  const { data, tipo, lado } = evento;
  const adversario = lado === 'adversario';

  if (tipo === 'finalizacao') {
    const res = resultadoFinOptions.find((r) => r.key === data.resultadoFin)?.label ?? '';
    const partes = [
      res,
      adversario ? 'Adversário' : nomeDe(jogadores, data.scorerId),
      descreveLocal(data.x, data.y),
      labelFor(detailOptions, data.detail),
      labelFor(originOptions, data.origin),
    ].filter(Boolean);
    if (!adversario && data.resultadoFin === 'gol') {
      partes.push(data.assistId && data.assistId !== 'none'
        ? `Assist.: ${nomeDe(jogadores, data.assistId)}`
        : 'Sem assistência');
    }
    return partes.join(' · ');
  }

  if (tipo === 'cartao') {
    return [labelFor(cardColors, data.cardColor), adversario ? 'Adversário' : nomeDe(jogadores, data.playerId)]
      .filter(Boolean).join(' · ');
  }

  return [
    adversario ? 'Adversário' : nomeDe(jogadores, data.playerId),
    descreveLocal(data.x, data.y),
    labelFor(resultadoOptions, data.resultado),
  ].filter(Boolean).join(' · ');
}

export function ehGol(e: EventoRegistrado): boolean {
  return e.tipo === 'finalizacao' && e.data.resultadoFin === 'gol';
}

export function placarDaSessao(eventos: EventoRegistrado[], sessaoId: string): { nos: number; adversario: number } {
  const gols = eventos.filter((e) => e.sessaoId === sessaoId && ehGol(e));
  return {
    nos: gols.filter((e) => e.lado === 'nos').length,
    adversario: gols.filter((e) => e.lado === 'adversario').length,
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
  const sessoes: Sessao[] = opponents.map((op, i) => {
    const daysAgo = (opponents.length - i) * 7;
    const d = new Date(Date.now() - daysAgo * 86400000);
    return {
      id: `seed-partida-${i}`,
      tipoSessao: 'partida' as TipoSessao,
      data: d.toISOString().slice(0, 10),
      label: `vs ${op}`,
      comVideo: false,
      escalacao: jogadores.map((j) => j.id),
      createdAt: d.getTime(),
    };
  });

  const eventos: EventoRegistrado[] = [];
  const pesosResultado: ResultadoFin[] = ['gol', 'gol', 'defendida', 'defendida', 'fora', 'fora', 'trave', 'bloqueada'];

  jogadores.forEach((jog, pIdx) => {
    const rand = seededRand((pIdx + 1) * 9301 + 49297);
    sessoes.forEach((sessao) => {
      const count = Math.floor(rand() * 4.5);
      for (let i = 0; i < count; i++) {
        // Keepers shoot from their own half; everyone else from the attacking end.
        const pool = jog.posicao === 'goleiro' ? localPresets.slice(12) : localPresets.slice(0, 12);
        const preset = pool[Math.floor(rand() * pool.length)];
        const candidatos = jogadores.filter((p) => p.id !== jog.id);
        const minuto = 1 + Math.floor(rand() * 39);
        const resultadoFin = pesosResultado[Math.floor(rand() * pesosResultado.length)];
        const data: FlowData = {
          x: preset.x,
          y: preset.y,
          resultadoFin,
          detail: detailOptions[Math.floor(rand() * detailOptions.length)].key,
          origin: originOptions[Math.floor(rand() * originOptions.length)].key,
          scorerId: jog.id,
          assistId: resultadoFin === 'gol' && rand() < 0.45
            ? candidatos[Math.floor(rand() * candidatos.length)].id
            : 'none',
        };
        eventos.push({
          id: `seed-evt-${sessao.id}-${pIdx}-${i}`,
          sessaoId: sessao.id,
          tipo: 'finalizacao',
          lado: 'nos',
          minuto,
          data,
          criadoEm: sessao.createdAt + minuto * 60000,
        });
      }
    });
  });

  sessoes.forEach((sessao, sIdx) => {
    const rand = seededRand((sIdx + 1) * 4111);
    const count = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i++) {
      const preset = localPresets[Math.floor(rand() * 12)];
      const minuto = 1 + Math.floor(rand() * 39);
      eventos.push({
        id: `seed-evt-adv-${sessao.id}-${i}`,
        sessaoId: sessao.id,
        tipo: 'finalizacao',
        lado: 'adversario' as Lado,
        minuto,
        data: {
          x: preset.x,
          y: preset.y,
          resultadoFin: pesosResultado[Math.floor(rand() * pesosResultado.length)],
          detail: detailOptions[Math.floor(rand() * detailOptions.length)].key,
          origin: originOptions[Math.floor(rand() * originOptions.length)].key,
        },
        criadoEm: sessao.createdAt + minuto * 60000,
      });
    }
  });

  return { sessoes, eventos };
}

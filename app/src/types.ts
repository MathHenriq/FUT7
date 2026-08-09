export type EventTypeKey = 'gol' | 'cartao' | 'passe' | 'cruzamento' | 'lancamento';

/** Which team an event belongs to. Never encoded as a red/green pair in the UI. */
export type Lado = 'nos' | 'adversario';

export type Posicao = 'goleiro' | 'zagueiro' | 'ala' | 'meia' | 'atacante';

export interface Jogador {
  id: string;
  nome: string;
  numero?: number;
  posicao: Posicao;
  ativo: boolean;
}

export interface EventTypeMeta {
  key: EventTypeKey;
  label: string;
  mono: string;
  shortcut: string;
}

export type StepName = 'local' | 'detail' | 'origin' | 'scorer' | 'assist' | 'cardColor' | 'player' | 'resultado';

export interface FlowData {
  /** Pitch coordinates, normalized to the FULL pitch: x 0=left touchline .. 1=right,
   *  y 0=our own goal line .. 1=opponent goal line. The sector grid (9 or 12) is
   *  derived at read time, so changing the grid never invalidates recorded history. */
  x?: number;
  y?: number;
  detail?: string;
  origin?: string;
  scorer?: string;
  assist?: string;
  cardColor?: string;
  player?: string;
  resultado?: string;
}

export interface KeyLabel {
  key: string;
  label: string;
}

export type TipoSessao = 'partida' | 'treino';

export interface Sessao {
  id: string;
  tipoSessao: TipoSessao;
  data: string;
  label: string;
  comVideo: boolean;
  /** Jogador ids that took part in this session. */
  escalacao: string[];
  placarNos?: number;
  placarAdversario?: number;
  createdAt: number;
}

export interface EventoRegistrado {
  id: string;
  sessaoId: string;
  tipo: EventTypeKey;
  lado: Lado;
  minuto: number;
  data: FlowData;
  summary: string;
  criadoEm: number;
}

export type GradeZonas = 9 | 12;

export interface Config {
  /** Sector granularity used for display. Always 3 columns; 9 = 3 faixas, 12 = 4 faixas,
   *  so left/center/right keeps the same meaning when switching. */
  gradeZonas: GradeZonas;
  nomeTime: string;
}

export interface FlowState {
  eventType: EventTypeKey | null;
  lado: Lado;
  stepIndex: number | 'saved' | 'minuto';
  data: FlowData;
  minuto?: number;
  editingId?: string;
}

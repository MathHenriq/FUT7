export type EventTypeKey =
  | 'finalizacao' | 'cartao' | 'passe' | 'cruzamento' | 'lancamento'
  | 'perda' | 'recuperacao' | 'falta';

/** Which team an event belongs to. Never encoded as a red/green pair in the UI. */
export type Lado = 'nos' | 'adversario';

export type Posicao = 'goleiro' | 'zagueiro' | 'ala' | 'meia' | 'atacante';

/** A goal is a *result* of a shot, not a separate event type — that is what makes
 *  conversion rate computable and gives missed shots somewhere to live. */
export type ResultadoFin = 'gol' | 'defendida' | 'trave' | 'fora' | 'bloqueada';

export interface Jogador {
  id: string;
  nome: string;
  numero?: number;
  posicao: Posicao;
  ativo: boolean;
}

export interface EventButton {
  key: string;
  tipo: EventTypeKey;
  label: string;
  mono: string;
  shortcut: string;
  /** Pre-filled fields, so "Gol" stays a one-tap path into the shot flow. */
  preset?: Partial<FlowData>;
}

export type StepName =
  | 'local' | 'localFim' | 'resultadoFin' | 'detail' | 'origin' | 'scorer' | 'assist'
  | 'cardColor' | 'player' | 'resultado'
  | 'comoPerdeu' | 'comoRecuperou' | 'faltaTipo' | 'goleiro';

export interface FlowData {
  /** Pitch coordinates, normalized to the FULL pitch: x 0=left touchline .. 1=right,
   *  y 0=our own goal line .. 1=opponent goal line. The sector grid (9 or 12) is
   *  derived at read time, so changing the grid never invalidates recorded history. */
  x?: number;
  y?: number;
  /** Where the ball arrived. Origin + destination is exactly what a drag gesture
   *  produces, so the future "riscar a trajetória" input fills these two directly. */
  x2?: number;
  y2?: number;
  resultadoFin?: ResultadoFin;
  detail?: string;
  origin?: string;
  /** Players are referenced by id — renaming someone must not orphan their history. */
  scorerId?: string;
  assistId?: string;
  playerId?: string;
  /** Our keeper, credited on a save even though the shot belongs to the opponent. */
  goleiroId?: string;
  cardColor?: string;
  resultado?: string;
  comoPerdeu?: string;
  comoRecuperou?: string;
  faltaTipo?: string;
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
  createdAt: number;
}

export interface EventoRegistrado {
  id: string;
  sessaoId: string;
  tipo: EventTypeKey;
  lado: Lado;
  minuto: number;
  data: FlowData;
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
  botao: EventButton | null;
  lado: Lado;
  stepIndex: number | 'saved' | 'minuto';
  data: FlowData;
  minuto?: number;
  editingId?: string;
}

export type EventTypeKey =
  | 'finalizacao' | 'cartao' | 'passe' | 'cruzamento' | 'lancamento'
  | 'perda' | 'recuperacao' | 'falta';

/** Which side of the session an event belongs to. Positional, not possessive: the
 *  session declares who side A and side B are. In our own matches A is our team, so
 *  nothing changes on screen; when scouting a professional match neither side is ours.
 *  Stored values stay 'nos'/'adversario' so existing history migrates untouched.
 *  Never encoded as a red/green pair in the UI. */
export type Lado = 'nos' | 'adversario';

/** How a session is tagged. The three modes produce the same events; what differs is
 *  where the timing comes from and who does the tagging. */
export type ModoRegistro = 'ao-vivo' | 'video' | 'ia';

/** Provenance of a single event. An AI guess must never be indistinguishable from a
 *  human call in the statistics. */
export type OrigemEvento = 'ao-vivo' | 'manual' | 'ia';

export type Posicao = 'goleiro' | 'zagueiro' | 'ala' | 'meia' | 'atacante';

/** Clubs. Ours is just one of them — which is what makes scouting possible at all. */
export interface Time {
  id: string;
  nome: string;
  ehMeuTime: boolean;
  criadoEm: number;
}

/** A player in our squad, or one we are watching from outside. */
export type VinculoJogador = 'elenco' | 'observado';

/** A goal is a *result* of a shot, not a separate event type — that is what makes
 *  conversion rate computable and gives missed shots somewhere to live. */
export type ResultadoFin = 'gol' | 'defendida' | 'trave' | 'fora' | 'bloqueada';

export interface Jogador {
  id: string;
  nome: string;
  numero?: number;
  posicao: Posicao;
  ativo: boolean;
  timeId: string;
  vinculo: VinculoJogador;
  /** Scouting context that our own squad never needs. */
  idade?: number;
  pePreferido?: 'direito' | 'esquerdo' | 'ambos';
  nota?: string;
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

/** Observação is a match we are not playing in, watched to scout somebody. */
export type TipoSessao = 'partida' | 'treino' | 'observacao';

export interface Sessao {
  id: string;
  tipoSessao: TipoSessao;
  data: string;
  label: string;
  modoRegistro: ModoRegistro;
  /** Who side A and side B are. A is our team in our own sessions. */
  timeAId?: string;
  timeBId?: string;
  /** Scouting sessions track one player specifically. */
  jogadorFocoId?: string;
  /** Present once a video file has been attached (the file lives in IndexedDB). */
  video?: { nome: string; tamanho: number; tipo: string; salvoEm: number };
  /** Where kickoff sits inside the recording, in seconds. The tape starts before the
   *  whistle, so match minute = (videoSegundo - this) / 60. */
  videoOffsetSegundos?: number;
  /** Jogador ids that took part in this session. */
  escalacao: string[];
  /** Minutes each player was on the pitch. Without it every ranking rewards whoever
   *  plays most rather than whoever plays best. */
  minutosPorJogador?: Record<string, number>;
  /** Session length, used as the default when filling minutes. */
  duracaoMin?: number;
  createdAt: number;
}

export interface EventoRegistrado {
  id: string;
  sessaoId: string;
  tipo: EventTypeKey;
  lado: Lado;
  /** Match clock, in minutes. */
  minuto: number;
  /** Position inside the media file, in seconds. Deliberately separate from `minuto`:
   *  the recording starts before kickoff and may have the interval cut out. */
  videoSegundo?: number;
  origem: OrigemEvento;
  /** Which drill this happened in, for training sessions. */
  exercicioId?: string;
  /** 0..1 for AI suggestions; absent for anything a human tagged. */
  confianca?: number;
  /** AI suggestions only count once a human confirms them. */
  confirmado?: boolean;
  data: FlowData;
  criadoEm: number;
}

export type TipoExercicio = 'aquecimento' | 'tecnico' | 'tatico' | 'fisico' | 'finalizacao' | 'jogo-treino';

/** A block inside a training session. Events tagged during it carry its id, which is
 *  what lets "como fomos no 4v4" be answered separately from the session as a whole. */
export interface Exercicio {
  id: string;
  sessaoId: string;
  nome: string;
  tipo: TipoExercicio;
  duracaoMin?: number;
  ordem: number;
}

/** Where a physical number came from. A hand-typed guess and a GPS reading must not
 *  look the same on screen. */
export type OrigemMetrica = 'manual' | 'gps' | 'video';

/** Physical output is a *measurement over a period*, not a discrete event — so it gets
 *  its own entity instead of being forced into the event model. */
export interface MetricaFisica {
  id: string;
  sessaoId: string;
  jogadorId: string;
  velocidadeMaxKmh?: number;
  distanciaM?: number;
  sprints?: number;
  origem: OrigemMetrica;
  atualizadoEm: number;
}

/** The product backlog lives inside the product. Status carries a shape as well as a
 *  colour (check, strike-through) so it never depends on hue alone. */
export type StatusIdeia = 'ideia' | 'estudando' | 'fazendo' | 'feito' | 'descartado';

/** Mapped to the four-beat cycle every serious analysis tool runs, plus the layers
 *  that cut across it. */
export type AreaIdeia =
  | 'captura' | 'codificacao' | 'analise' | 'devolucao'
  | 'ia' | 'fisico' | 'scouting' | 'engajamento' | 'plataforma';

export type Escala = 1 | 2 | 3;

export interface Ideia {
  id: string;
  titulo: string;
  descricao: string;
  area: AreaIdeia;
  status: StatusIdeia;
  /** Impact over effort is what turns a wish list into an order of work. */
  impacto: Escala;
  esforco: Escala;
  /** Where it came from — a platform we studied, a piece of research, a conversation. */
  referencia?: string;
  criadoEm: number;
  atualizadoEm: number;
}

export type GradeZonas = 9 | 12;

export interface Config {
  meuTimeId?: string;
  /** Bumped when the seeded backlog changes, so new items reach existing installs
   *  without overwriting anything the user edited. */
  ideiasSeedVersao?: number;
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

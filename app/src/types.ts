export type EventTypeKey = 'gol' | 'cartao' | 'passe' | 'cruzamento' | 'lancamento';

export interface EventTypeMeta {
  key: EventTypeKey;
  label: string;
  mono: string;
  shortcut: string;
}

export type StepName = 'zone' | 'detail' | 'origin' | 'scorer' | 'assist' | 'cardColor' | 'player' | 'resultado';

export interface FlowData {
  zone?: number;
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
  placarNos?: number;
  placarAdversario?: number;
  createdAt: number;
}

export interface EventoRegistrado {
  id: string;
  sessaoId: string;
  tipo: EventTypeKey;
  minuto: number;
  data: FlowData;
  summary: string;
  criadoEm: number;
}

export interface FlowState {
  eventType: EventTypeKey | null;
  stepIndex: number | 'saved' | 'minuto';
  data: FlowData;
  minuto?: number;
  editingId?: string;
}

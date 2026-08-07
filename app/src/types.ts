export type Screen = 'mobile' | 'pc' | 'dashboard';
export type Branch = 'mobile' | 'pc';

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

export interface LogEntry {
  id: string;
  typeLabel: string;
  typeMono: string;
  summary: string;
  time: string;
}

export interface FlowState {
  eventType: EventTypeKey | null;
  stepIndex: number | 'saved';
  data: FlowData;
  savedEntry?: LogEntry;
}

export interface GoalRecord {
  id: string;
  matchIndex: number;
  zone: number;
  detail: string;
  origin: string;
  scorer: string;
  assist?: string;
}

export interface KeyLabel {
  key: string;
  label: string;
}

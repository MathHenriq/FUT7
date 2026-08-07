import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { Branch, EventTypeKey, FlowData, FlowState, GoalRecord, LogEntry, Screen, StepName } from './types';
import { buildSummary, eventTypesMeta, formatTime, LIVE_MATCH_INDEX, stepSeq, toGoalRecord } from './data';

interface AppState {
  activeScreen: Screen;
  mobile: FlowState;
  pc: FlowState;
  mobileLog: LogEntry[];
  pcLog: LogEntry[];
  goals: GoalRecord[];
  pcPlaying: boolean;
  pcSeconds: number;
  dashPlayer: string;
  dashMatch: string;
}

const emptyFlow: FlowState = { eventType: null, stepIndex: 0, data: {} };

const initialState: AppState = {
  activeScreen: 'mobile',
  mobile: emptyFlow,
  pc: emptyFlow,
  mobileLog: [],
  pcLog: [],
  goals: [],
  pcPlaying: false,
  pcSeconds: 0,
  dashPlayer: 'Lucas Silva',
  dashMatch: 'all',
};

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'START_EVENT'; branch: Branch; eventType: EventTypeKey }
  | { type: 'SELECT_STEP'; branch: Branch; step: StepName; value: string | number }
  | { type: 'GO_BACK'; branch: Branch }
  | { type: 'NEW_ENTRY'; branch: Branch }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'TICK' }
  | { type: 'SET_DASH_PLAYER'; player: string }
  | { type: 'SET_DASH_MATCH'; match: string };

function saveEntry(state: AppState, branch: Branch, flow: FlowState): AppState {
  const meta = eventTypesMeta.find((m) => m.key === flow.eventType)!;
  const time = branch === 'pc'
    ? formatTime(state.pcSeconds)
    : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const id = `${Date.now()}-${Math.random()}`;
  const entry: LogEntry = {
    id,
    typeLabel: meta.label,
    typeMono: meta.mono,
    summary: buildSummary(flow.eventType as EventTypeKey, flow.data),
    time,
  };
  const logKey = branch === 'mobile' ? 'mobileLog' : 'pcLog';
  const nextGoals = flow.eventType === 'gol'
    ? [toGoalRecord(id, LIVE_MATCH_INDEX, flow.data), ...state.goals]
    : state.goals;
  return {
    ...state,
    goals: nextGoals,
    [logKey]: [entry, ...state[logKey]].slice(0, 20),
    [branch]: { eventType: flow.eventType, stepIndex: 'saved', data: flow.data, savedEntry: entry },
  } as AppState;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, activeScreen: action.screen };
    case 'START_EVENT':
      return { ...state, [action.branch]: { eventType: action.eventType, stepIndex: 0, data: {} } };
    case 'SELECT_STEP': {
      const flow = state[action.branch];
      if (!flow.eventType) return state;
      const data: FlowData = { ...flow.data, [action.step]: action.value };
      const seq = stepSeq[flow.eventType];
      const idx = seq.indexOf(action.step);
      if (idx === seq.length - 1) {
        return saveEntry(state, action.branch, { ...flow, data });
      }
      return { ...state, [action.branch]: { ...flow, data, stepIndex: idx + 1 } };
    }
    case 'GO_BACK': {
      const flow = state[action.branch];
      if (!flow.eventType) return state;
      if (flow.stepIndex === 'saved' || flow.stepIndex === 0) {
        return { ...state, [action.branch]: emptyFlow };
      }
      return { ...state, [action.branch]: { ...flow, stepIndex: flow.stepIndex - 1 } };
    }
    case 'NEW_ENTRY':
      return { ...state, [action.branch]: emptyFlow };
    case 'TOGGLE_PLAY':
      return { ...state, pcPlaying: !state.pcPlaying };
    case 'TICK':
      return state.pcPlaying ? { ...state, pcSeconds: state.pcSeconds + 1 } : state;
    case 'SET_DASH_PLAYER':
      return { ...state, dashPlayer: action.player };
    case 'SET_DASH_MATCH':
      return { ...state, dashMatch: action.match };
    default:
      return state;
  }
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (state.activeScreen !== 'pc') return;
      const tag = (e.target as HTMLElement)?.tagName || '';
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === ' ') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PLAY' });
        return;
      }
      if (k === 'escape') {
        dispatch({ type: 'GO_BACK', branch: 'pc' });
        return;
      }
      const map: Record<string, EventTypeKey> = { g: 'gol', c: 'cartao', p: 'passe', x: 'cruzamento', l: 'lancamento' };
      if (map[k] && !state.pc.eventType) {
        dispatch({ type: 'START_EVENT', branch: 'pc', eventType: map[k] });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.activeScreen, state.pc.eventType]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

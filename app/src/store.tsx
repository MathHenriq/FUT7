import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { EventTypeKey, EventoRegistrado, FlowData, Sessao, TipoSessao } from './types';
import { buildSummary, seedSessoesEEventos } from './data';

const STORAGE_KEY = 'fut7-analytics-v2';

interface AppState {
  sessoes: Sessao[];
  eventos: EventoRegistrado[];
  currentSessaoId: string | null;
  dashPlayer: string;
  dashSessao: string;
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sessoes) && Array.isArray(parsed.eventos)) {
        return {
          sessoes: parsed.sessoes,
          eventos: parsed.eventos,
          currentSessaoId: parsed.currentSessaoId ?? null,
          dashPlayer: parsed.dashPlayer ?? 'Lucas Silva',
          dashSessao: parsed.dashSessao ?? 'all',
        };
      }
    }
  } catch {
    // ignore corrupt storage, fall through to seed
  }
  const { sessoes, eventos } = seedSessoesEEventos();
  return { sessoes, eventos, currentSessaoId: null, dashPlayer: 'Lucas Silva', dashSessao: 'all' };
}

type Action =
  | { type: 'CREATE_SESSAO'; sessao: Sessao }
  | { type: 'SET_CURRENT_SESSAO'; id: string | null }
  | { type: 'ADD_EVENTO'; evento: EventoRegistrado }
  | { type: 'UPDATE_EVENTO'; id: string; tipo: EventTypeKey; minuto: number; data: FlowData }
  | { type: 'DELETE_EVENTO'; id: string }
  | { type: 'SET_DASH_PLAYER'; player: string }
  | { type: 'SET_DASH_SESSAO'; sessaoId: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_SESSAO':
      return { ...state, sessoes: [action.sessao, ...state.sessoes], currentSessaoId: action.sessao.id };
    case 'SET_CURRENT_SESSAO':
      return { ...state, currentSessaoId: action.id };
    case 'ADD_EVENTO':
      return { ...state, eventos: [action.evento, ...state.eventos] };
    case 'UPDATE_EVENTO':
      return {
        ...state,
        eventos: state.eventos.map((e) => (e.id === action.id
          ? { ...e, tipo: action.tipo, minuto: action.minuto, data: action.data, summary: buildSummary(action.tipo, action.data) }
          : e)),
      };
    case 'DELETE_EVENTO':
      return { ...state, eventos: state.eventos.filter((e) => e.id !== action.id) };
    case 'SET_DASH_PLAYER':
      return { ...state, dashPlayer: action.player };
    case 'SET_DASH_SESSAO':
      return { ...state, dashSessao: action.sessaoId };
    default:
      return state;
  }
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  createSessao: (input: { tipoSessao: TipoSessao; label: string; comVideo: boolean; data: string; placarNos?: number; placarAdversario?: number }) => string;
  saveEvento: (sessaoId: string, tipo: EventTypeKey, minuto: number, data: FlowData) => void;
  updateEvento: (id: string, tipo: EventTypeKey, minuto: number, data: FlowData) => void;
  deleteEvento: (id: string) => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<Ctx>(() => ({
    state,
    dispatch,
    createSessao: (input) => {
      const id = `sessao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      dispatch({ type: 'CREATE_SESSAO', sessao: { id, createdAt: Date.now(), ...input } });
      return id;
    },
    saveEvento: (sessaoId, tipo, minuto, data) => {
      const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      dispatch({
        type: 'ADD_EVENTO',
        evento: { id, sessaoId, tipo, minuto, data, summary: buildSummary(tipo, data), criadoEm: Date.now() },
      });
    },
    updateEvento: (id, tipo, minuto, data) => dispatch({ type: 'UPDATE_EVENTO', id, tipo, minuto, data }),
    deleteEvento: (id) => dispatch({ type: 'DELETE_EVENTO', id }),
  }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

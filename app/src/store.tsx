import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type {
  Config, EventTypeKey, EventoRegistrado, FlowData, GradeZonas, Jogador, Lado, Sessao, TipoSessao,
} from './types';
import { buildSummary, criarElencoInicial, localPresets, seedSessoesEEventos } from './data';

const STORAGE_KEY = 'fut7-analytics-v3';
const LEGACY_KEY = 'fut7-analytics-v2';

interface AppState {
  jogadores: Jogador[];
  sessoes: Sessao[];
  eventos: EventoRegistrado[];
  config: Config;
  currentSessaoId: string | null;
  dashPlayer: string;
  dashSessao: string;
}

const defaultConfig: Config = { gradeZonas: 9, nomeTime: 'Meu time' };

function estadoSemeado(): AppState {
  const jogadores = criarElencoInicial();
  const { sessoes, eventos } = seedSessoesEEventos(jogadores);
  return {
    jogadores,
    sessoes,
    eventos,
    config: defaultConfig,
    currentSessaoId: null,
    dashPlayer: jogadores[0]?.nome ?? '',
    dashSessao: 'all',
  };
}

/** v2 stored `data.zone` (0-8 over the attacking third) and had no roster or lado.
 *  Coordinates are recovered from the same preset table the picker still uses, so
 *  nothing recorded before this change is lost. */
function migrarDeV2(parsed: {
  sessoes?: unknown[];
  eventos?: unknown[];
  currentSessaoId?: string | null;
  dashPlayer?: string;
  dashSessao?: string;
}): AppState {
  const jogadores = criarElencoInicial();
  const porNome = new Map(jogadores.map((j) => [j.nome, j]));

  const sessoesV2 = (parsed.sessoes ?? []) as Record<string, unknown>[];
  const eventosV2 = (parsed.eventos ?? []) as Record<string, unknown>[];

  // Any player name that shows up in old events but isn't in the seed roster gets added,
  // otherwise their history would point at nobody.
  for (const e of eventosV2) {
    const d = (e.data ?? {}) as Record<string, unknown>;
    for (const campo of ['scorer', 'player', 'assist']) {
      const nome = d[campo];
      if (typeof nome === 'string' && nome && nome !== 'none' && !porNome.has(nome)) {
        const novo: Jogador = { id: `jog-mig-${porNome.size}`, nome, posicao: 'meia', ativo: true };
        porNome.set(nome, novo);
        jogadores.push(novo);
      }
    }
  }

  const sessoes: Sessao[] = sessoesV2.map((s) => ({
    id: String(s.id),
    tipoSessao: (s.tipoSessao as TipoSessao) ?? 'partida',
    data: String(s.data ?? new Date().toISOString().slice(0, 10)),
    label: String(s.label ?? 'Sessão'),
    comVideo: Boolean(s.comVideo),
    escalacao: jogadores.map((j) => j.id),
    placarNos: s.placarNos as number | undefined,
    placarAdversario: s.placarAdversario as number | undefined,
    createdAt: Number(s.createdAt ?? Date.now()),
  }));

  const eventos: EventoRegistrado[] = eventosV2.map((e) => {
    const antigo = (e.data ?? {}) as Record<string, unknown>;
    const zone = typeof antigo.zone === 'number' ? antigo.zone : undefined;
    const preset = zone !== undefined ? localPresets[zone] : undefined;
    const data: FlowData = {
      x: preset?.x,
      y: preset?.y,
      detail: antigo.detail as string | undefined,
      origin: antigo.origin as string | undefined,
      scorer: antigo.scorer as string | undefined,
      assist: antigo.assist as string | undefined,
      cardColor: antigo.cardColor as string | undefined,
      player: antigo.player as string | undefined,
      resultado: antigo.resultado as string | undefined,
    };
    const tipo = (e.tipo as EventTypeKey) ?? 'gol';
    return {
      id: String(e.id),
      sessaoId: String(e.sessaoId),
      tipo,
      lado: 'nos' as Lado,
      minuto: Number(e.minuto ?? 0),
      data,
      summary: buildSummary(tipo, data, 'nos'),
      criadoEm: Number(e.criadoEm ?? Date.now()),
    };
  });

  return {
    jogadores,
    sessoes,
    eventos,
    config: defaultConfig,
    currentSessaoId: parsed.currentSessaoId ?? null,
    dashPlayer: parsed.dashPlayer ?? jogadores[0]?.nome ?? '',
    dashSessao: parsed.dashSessao ?? 'all',
  };
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.jogadores) && Array.isArray(parsed.sessoes) && Array.isArray(parsed.eventos)) {
        return { ...estadoSemeado(), ...parsed, config: { ...defaultConfig, ...(parsed.config ?? {}) } };
      }
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && Array.isArray(parsed.sessoes) && Array.isArray(parsed.eventos)) return migrarDeV2(parsed);
    }
  } catch {
    // corrupt storage falls through to a fresh seed
  }
  return estadoSemeado();
}

type Action =
  | { type: 'CREATE_SESSAO'; sessao: Sessao }
  | { type: 'SET_CURRENT_SESSAO'; id: string | null }
  | { type: 'SET_ESCALACAO'; sessaoId: string; escalacao: string[] }
  | { type: 'ADD_EVENTO'; evento: EventoRegistrado }
  | { type: 'UPDATE_EVENTO'; id: string; tipo: EventTypeKey; lado: Lado; minuto: number; data: FlowData }
  | { type: 'DELETE_EVENTO'; id: string }
  | { type: 'ADD_JOGADOR'; jogador: Jogador }
  | { type: 'UPDATE_JOGADOR'; jogador: Jogador }
  | { type: 'DELETE_JOGADOR'; id: string }
  | { type: 'SET_CONFIG'; config: Partial<Config> }
  | { type: 'SET_DASH_PLAYER'; player: string }
  | { type: 'SET_DASH_SESSAO'; sessaoId: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE_SESSAO':
      return { ...state, sessoes: [action.sessao, ...state.sessoes], currentSessaoId: action.sessao.id };
    case 'SET_CURRENT_SESSAO':
      return { ...state, currentSessaoId: action.id };
    case 'SET_ESCALACAO':
      return {
        ...state,
        sessoes: state.sessoes.map((s) => (s.id === action.sessaoId ? { ...s, escalacao: action.escalacao } : s)),
      };
    case 'ADD_EVENTO':
      return { ...state, eventos: [action.evento, ...state.eventos] };
    case 'UPDATE_EVENTO':
      return {
        ...state,
        eventos: state.eventos.map((e) => (e.id === action.id
          ? {
            ...e,
            tipo: action.tipo,
            lado: action.lado,
            minuto: action.minuto,
            data: action.data,
            summary: buildSummary(action.tipo, action.data, action.lado),
          }
          : e)),
      };
    case 'DELETE_EVENTO':
      return { ...state, eventos: state.eventos.filter((e) => e.id !== action.id) };
    case 'ADD_JOGADOR':
      return { ...state, jogadores: [...state.jogadores, action.jogador] };
    case 'UPDATE_JOGADOR':
      return {
        ...state,
        jogadores: state.jogadores.map((j) => (j.id === action.jogador.id ? action.jogador : j)),
      };
    case 'DELETE_JOGADOR':
      return {
        ...state,
        jogadores: state.jogadores.filter((j) => j.id !== action.id),
        sessoes: state.sessoes.map((s) => ({ ...s, escalacao: s.escalacao.filter((id) => id !== action.id) })),
      };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.config } };
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
  createSessao: (input: {
    tipoSessao: TipoSessao; label: string; comVideo: boolean; data: string; escalacao: string[];
    placarNos?: number; placarAdversario?: number;
  }) => string;
  saveEvento: (sessaoId: string, tipo: EventTypeKey, lado: Lado, minuto: number, data: FlowData) => void;
  updateEvento: (id: string, tipo: EventTypeKey, lado: Lado, minuto: number, data: FlowData) => void;
  deleteEvento: (id: string) => void;
  addJogador: (input: { nome: string; numero?: number; posicao: Jogador['posicao'] }) => void;
  updateJogador: (jogador: Jogador) => void;
  deleteJogador: (id: string) => void;
  setGradeZonas: (grade: GradeZonas) => void;
}

const AppContext = createContext<Ctx | null>(null);

function novoId(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<Ctx>(() => ({
    state,
    dispatch,
    createSessao: (input) => {
      const id = novoId('sessao');
      dispatch({ type: 'CREATE_SESSAO', sessao: { id, createdAt: Date.now(), ...input } });
      return id;
    },
    saveEvento: (sessaoId, tipo, lado, minuto, data) => {
      dispatch({
        type: 'ADD_EVENTO',
        evento: {
          id: novoId('evt'), sessaoId, tipo, lado, minuto, data,
          summary: buildSummary(tipo, data, lado), criadoEm: Date.now(),
        },
      });
    },
    updateEvento: (id, tipo, lado, minuto, data) => dispatch({ type: 'UPDATE_EVENTO', id, tipo, lado, minuto, data }),
    deleteEvento: (id) => dispatch({ type: 'DELETE_EVENTO', id }),
    addJogador: (input) => dispatch({ type: 'ADD_JOGADOR', jogador: { id: novoId('jog'), ativo: true, ...input } }),
    updateJogador: (jogador) => dispatch({ type: 'UPDATE_JOGADOR', jogador }),
    deleteJogador: (id) => dispatch({ type: 'DELETE_JOGADOR', id }),
    setGradeZonas: (grade) => dispatch({ type: 'SET_CONFIG', config: { gradeZonas: grade } }),
  }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

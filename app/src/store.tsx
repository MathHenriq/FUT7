import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type {
  Config, EventTypeKey, EventoRegistrado, Exercicio, FlowData, GradeZonas, Ideia, Jogador, Lado,
  MetricaFisica, ModoRegistro, OrigemEvento, Sessao, Time, TipoExercicio, TipoSessao, VinculoJogador,
} from './types';
import { criarElencoInicial, seedSessoesEEventos } from './data';
import { criarIdeiasIniciais, fundirIdeias, SEED_IDEIAS_VERSAO } from './ideias';

const STORAGE_KEY = 'fut7-analytics-v4';
const LEGACY_V3 = 'fut7-analytics-v3';
const LEGACY_V2 = 'fut7-analytics-v2';

interface AppState {
  times: Time[];
  jogadores: Jogador[];
  sessoes: Sessao[];
  eventos: EventoRegistrado[];
  exercicios: Exercicio[];
  metricas: MetricaFisica[];
  ideias: Ideia[];
  config: Config;
  currentSessaoId: string | null;
  dashPlayerId: string;
  dashSessao: string;
}

const MEU_TIME_ID = 'time-meu';
const defaultConfig: Config = {
  gradeZonas: 9, nomeTime: 'Meu time', meuTimeId: MEU_TIME_ID, ideiasSeedVersao: SEED_IDEIAS_VERSAO,
};

function estadoSemeado(): AppState {
  const meuTime: Time = { id: MEU_TIME_ID, nome: 'Meu time', ehMeuTime: true, criadoEm: Date.now() };
  const jogadores = criarElencoInicial();
  const { sessoes, eventos } = seedSessoesEEventos(jogadores);
  return {
    times: [meuTime],
    jogadores,
    sessoes,
    eventos,
    exercicios: [],
    metricas: [],
    ideias: criarIdeiasIniciais(),
    config: defaultConfig,
    currentSessaoId: null,
    dashPlayerId: jogadores[0]?.id ?? '',
    dashSessao: 'all',
  };
}

type Loose = Record<string, unknown>;

/** v2 sector indices, kept verbatim so old records land where they were actually meant. */
const legadoZonasV2 = [
  { x: 0.2, y: 0.62 }, { x: 0.5, y: 0.62 }, { x: 0.8, y: 0.62 },
  { x: 0.2, y: 0.78 }, { x: 0.5, y: 0.78 }, { x: 0.8, y: 0.78 },
  { x: 0.2, y: 0.93 }, { x: 0.5, y: 0.93 }, { x: 0.8, y: 0.93 },
];

/** v2 -> v3 shape: adds a roster, a lado, and turns sector indices into coordinates. */
function migrarV2(parsed: Loose): Loose {
  const eventosV2 = (parsed.eventos ?? []) as Loose[];
  const jogadores = criarElencoInicial();
  const porNome = new Map(jogadores.map((j) => [j.nome, j]));

  for (const e of eventosV2) {
    const d = (e.data ?? {}) as Loose;
    for (const campo of ['scorer', 'player', 'assist']) {
      const nome = d[campo];
      if (typeof nome === 'string' && nome && nome !== 'none' && !porNome.has(nome)) {
        const novo: Jogador = {
          id: `jog-mig-${porNome.size}`, nome, posicao: 'meia', ativo: true,
          timeId: MEU_TIME_ID, vinculo: 'elenco',
        };
        porNome.set(nome, novo);
        jogadores.push(novo);
      }
    }
  }

  const sessoes = ((parsed.sessoes ?? []) as Loose[]).map((s) => ({
    ...s,
    escalacao: jogadores.map((j) => j.id),
  }));

  const eventos = eventosV2.map((e) => {
    const antigo = (e.data ?? {}) as Loose;
    const zone = typeof antigo.zone === 'number' ? antigo.zone : undefined;
    const coord = zone !== undefined ? legadoZonasV2[zone] : undefined;
    return { ...e, lado: 'nos', data: { ...antigo, x: coord?.x, y: coord?.y } };
  });

  return { ...parsed, jogadores, sessoes, eventos };
}

/** v3 -> v4: goals become shots carrying a result, player references become ids,
 *  scores stop being stored (they are derived from the goal events themselves). */
function migrarV3(parsed: Loose): AppState {
  const base = estadoSemeado();
  const jogadores = (Array.isArray(parsed.jogadores) && parsed.jogadores.length > 0
    ? parsed.jogadores as Jogador[]
    : criarElencoInicial()).map((j) => ({ ...j }));
  const porNome = new Map(jogadores.map((j) => [j.nome, j]));

  const idPara = (nome: unknown): string | undefined => {
    if (typeof nome !== 'string' || !nome) return undefined;
    if (nome === 'none') return 'none';
    const achado = porNome.get(nome);
    if (achado) return achado.id;
    const novo: Jogador = {
      id: `jog-mig-${porNome.size}`, nome, posicao: 'meia', ativo: true,
      timeId: MEU_TIME_ID, vinculo: 'elenco',
    };
    porNome.set(nome, novo);
    jogadores.push(novo);
    return novo.id;
  };

  const eventos: EventoRegistrado[] = ((parsed.eventos ?? []) as Loose[]).map((e) => {
    const d = (e.data ?? {}) as Loose;
    const tipoAntigo = String(e.tipo ?? 'gol');
    const eraGol = tipoAntigo === 'gol';
    const data: FlowData = {
      x: d.x as number | undefined,
      y: d.y as number | undefined,
      resultadoFin: eraGol ? 'gol' : undefined,
      detail: d.detail as string | undefined,
      origin: d.origin as string | undefined,
      scorerId: idPara(d.scorer),
      assistId: idPara(d.assist),
      playerId: idPara(d.player),
      cardColor: d.cardColor as string | undefined,
      resultado: d.resultado as string | undefined,
    };
    return {
      id: String(e.id),
      sessaoId: String(e.sessaoId),
      tipo: (eraGol ? 'finalizacao' : tipoAntigo) as EventTypeKey,
      lado: (e.lado === 'adversario' ? 'adversario' : 'nos') as Lado,
      minuto: Number(e.minuto ?? 0),
      origem: 'manual' as OrigemEvento,
      data,
      criadoEm: Number(e.criadoEm ?? Date.now()),
    };
  });

  const sessoes: Sessao[] = ((parsed.sessoes ?? []) as Loose[]).map((s) => ({
    timeAId: MEU_TIME_ID,
    id: String(s.id),
    tipoSessao: (s.tipoSessao as TipoSessao) ?? 'partida',
    data: String(s.data ?? new Date().toISOString().slice(0, 10)),
    label: String(s.label ?? 'Sessão'),
    modoRegistro: (s.comVideo ? 'video' : 'ao-vivo') as ModoRegistro,
    escalacao: Array.isArray(s.escalacao) ? (s.escalacao as string[]) : jogadores.map((j) => j.id),
    createdAt: Number(s.createdAt ?? Date.now()),
  }));

  const dashPlayerId = porNome.get(String(parsed.dashPlayer ?? ''))?.id ?? jogadores[0]?.id ?? '';

  return {
    times: [{ id: MEU_TIME_ID, nome: 'Meu time', ehMeuTime: true, criadoEm: Date.now() }],
    jogadores: jogadores.map((j) => ({ ...j, timeId: MEU_TIME_ID, vinculo: 'elenco' as VinculoJogador })),
    sessoes: sessoes.length > 0 ? sessoes : base.sessoes,
    eventos: sessoes.length > 0 ? eventos : base.eventos,
    exercicios: [],
    metricas: [],
    ideias: criarIdeiasIniciais(),
    config: { ...defaultConfig, ...((parsed.config ?? {}) as Partial<Config>) },
    currentSessaoId: (parsed.currentSessaoId as string | null) ?? null,
    dashPlayerId,
    dashSessao: String(parsed.dashSessao ?? 'all'),
  };
}

/** Absence has to survive the seed merge: fields the install never had arrive here as
 *  undefined, not as the default value, or we cannot tell "never stored" from "stored
 *  the default" — which is exactly what made the club inherit the wrong name. */
type EstadoBruto = Omit<AppState, 'times' | 'config'> & {
  times?: Time[];
  config?: Partial<Config>;
};

/** Fills in everything added after v4 without a version bump, since each addition is a
 *  superset: provenance, the club a player belongs to, and which teams a session is
 *  between. Our own team is created from the name already in config. */
function normalizar(st: EstadoBruto): AppState {
  const meuTimeId = st.config?.meuTimeId ?? MEU_TIME_ID;
  const versaoAnterior = st.config?.ideiasSeedVersao ?? 0;
  const times = (st.times && st.times.length > 0)
    ? st.times
    : [{ id: meuTimeId, nome: st.config?.nomeTime ?? 'Meu time', ehMeuTime: true, criadoEm: Date.now() }];

  return {
    ...st,
    times,
    jogadores: st.jogadores.map((j) => ({
      ...j,
      timeId: j.timeId ?? meuTimeId,
      vinculo: j.vinculo ?? ('elenco' as VinculoJogador),
    })),
    config: {
      ...defaultConfig,
      ...st.config,
      meuTimeId,
      ideiasSeedVersao: SEED_IDEIAS_VERSAO,
    },
    sessoes: st.sessoes.map((s) => {
      const bruto = s as Sessao & { comVideo?: boolean };
      const modoRegistro: ModoRegistro = bruto.modoRegistro ?? (bruto.comVideo ? 'video' : 'ao-vivo');
      // Sessions we played get our club as side A; an observation has no side of ours.
      const timeAId = s.timeAId ?? (s.tipoSessao === 'observacao' ? undefined : meuTimeId);
      return { ...s, modoRegistro, timeAId };
    }),
    eventos: st.eventos.map((e) => ({ ...e, origem: e.origem ?? ('manual' as OrigemEvento) })),
    exercicios: st.exercicios ?? [],
    metricas: st.metricas ?? [],
    // New backlog items reach existing installs; anything the user edited stays put.
    ideias: fundirIdeias(st.ideias, versaoAnterior),
  };
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.jogadores) && Array.isArray(parsed.eventos)) {
        return normalizar({
          ...estadoSemeado(),
          ...parsed,
          // Passed through raw so normalizar can tell "never stored" from "default".
          times: parsed.times,
          config: { ...(parsed.config ?? {}) },
        });
      }
    }
    const v3 = localStorage.getItem(LEGACY_V3);
    if (v3) return normalizar(migrarV3(JSON.parse(v3)));
    const v2 = localStorage.getItem(LEGACY_V2);
    if (v2) return normalizar(migrarV3(migrarV2(JSON.parse(v2))));
  } catch {
    // corrupt storage falls through to a fresh seed
  }
  return estadoSemeado();
}

type Action =
  | { type: 'CREATE_SESSAO'; sessao: Sessao }
  | { type: 'SET_CURRENT_SESSAO'; id: string | null }
  | { type: 'SET_ESCALACAO'; sessaoId: string; escalacao: string[] }
  | { type: 'SET_VIDEO_META'; sessaoId: string; video: Sessao['video'] }
  | { type: 'SET_VIDEO_OFFSET'; sessaoId: string; segundos: number }
  | { type: 'SET_MINUTOS'; sessaoId: string; jogadorId: string; minutos: number | undefined }
  | { type: 'SET_DURACAO'; sessaoId: string; minutos: number }
  | { type: 'CONFIRMAR_EVENTO'; id: string }
  | { type: 'ADD_EXERCICIO'; exercicio: Exercicio }
  | { type: 'UPDATE_EXERCICIO'; exercicio: Exercicio }
  | { type: 'DELETE_EXERCICIO'; id: string }
  | { type: 'SET_METRICA'; metrica: MetricaFisica }
  | { type: 'ADD_TIME'; time: Time }
  | { type: 'UPDATE_TIME'; time: Time }
  | { type: 'DELETE_TIME'; id: string }
  | { type: 'ADD_IDEIA'; ideia: Ideia }
  | { type: 'UPDATE_IDEIA'; ideia: Ideia }
  | { type: 'DELETE_IDEIA'; id: string }
  | { type: 'ADD_EVENTO'; evento: EventoRegistrado }
  | { type: 'UPDATE_EVENTO'; id: string; tipo: EventTypeKey; lado: Lado; minuto: number; data: FlowData }
  | { type: 'DELETE_EVENTO'; id: string }
  | { type: 'ADD_JOGADOR'; jogador: Jogador }
  | { type: 'UPDATE_JOGADOR'; jogador: Jogador }
  | { type: 'DELETE_JOGADOR'; id: string }
  | { type: 'SET_CONFIG'; config: Partial<Config> }
  | { type: 'SET_DASH_PLAYER'; playerId: string }
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
    case 'SET_VIDEO_META':
      return {
        ...state,
        sessoes: state.sessoes.map((s) => (s.id === action.sessaoId ? { ...s, video: action.video } : s)),
      };
    case 'SET_VIDEO_OFFSET':
      return {
        ...state,
        sessoes: state.sessoes.map((s) => (s.id === action.sessaoId ? { ...s, videoOffsetSegundos: action.segundos } : s)),
      };
    case 'SET_MINUTOS':
      return {
        ...state,
        sessoes: state.sessoes.map((s) => {
          if (s.id !== action.sessaoId) return s;
          const atual = { ...(s.minutosPorJogador ?? {}) };
          if (action.minutos === undefined) delete atual[action.jogadorId];
          else atual[action.jogadorId] = action.minutos;
          return { ...s, minutosPorJogador: atual };
        }),
      };
    case 'SET_DURACAO':
      return {
        ...state,
        sessoes: state.sessoes.map((s) => (s.id === action.sessaoId ? { ...s, duracaoMin: action.minutos } : s)),
      };
    case 'CONFIRMAR_EVENTO':
      return {
        ...state,
        eventos: state.eventos.map((e) => (e.id === action.id ? { ...e, confirmado: true } : e)),
      };
    case 'ADD_EVENTO':
      return { ...state, eventos: [action.evento, ...state.eventos] };
    case 'UPDATE_EVENTO':
      return {
        ...state,
        eventos: state.eventos.map((e) => (e.id === action.id
          ? { ...e, tipo: action.tipo, lado: action.lado, minuto: action.minuto, data: action.data }
          : e)),
      };
    case 'DELETE_EVENTO':
      return { ...state, eventos: state.eventos.filter((e) => e.id !== action.id) };
    case 'ADD_EXERCICIO':
      return { ...state, exercicios: [...state.exercicios, action.exercicio] };
    case 'UPDATE_EXERCICIO':
      return {
        ...state,
        exercicios: state.exercicios.map((x) => (x.id === action.exercicio.id ? action.exercicio : x)),
      };
    case 'DELETE_EXERCICIO':
      // Events keep existing; they just stop belonging to a drill.
      return {
        ...state,
        exercicios: state.exercicios.filter((x) => x.id !== action.id),
        eventos: state.eventos.map((e) => (e.exercicioId === action.id ? { ...e, exercicioId: undefined } : e)),
      };
    case 'SET_METRICA': {
      const existe = state.metricas.some(
        (m) => m.sessaoId === action.metrica.sessaoId && m.jogadorId === action.metrica.jogadorId,
      );
      return {
        ...state,
        metricas: existe
          ? state.metricas.map((m) => (
            m.sessaoId === action.metrica.sessaoId && m.jogadorId === action.metrica.jogadorId ? action.metrica : m
          ))
          : [...state.metricas, action.metrica],
      };
    }
    case 'ADD_TIME':
      return { ...state, times: [...state.times, action.time] };
    case 'UPDATE_TIME':
      return { ...state, times: state.times.map((t) => (t.id === action.time.id ? action.time : t)) };
    case 'DELETE_TIME':
      // Our own club is never removable; players of a removed club go with it.
      if (state.times.find((t) => t.id === action.id)?.ehMeuTime) return state;
      return {
        ...state,
        times: state.times.filter((t) => t.id !== action.id),
        jogadores: state.jogadores.filter((j) => j.timeId !== action.id),
      };
    case 'ADD_IDEIA':
      return { ...state, ideias: [action.ideia, ...state.ideias] };
    case 'UPDATE_IDEIA':
      return {
        ...state,
        ideias: state.ideias.map((i) => (i.id === action.ideia.id ? { ...action.ideia, atualizadoEm: Date.now() } : i)),
      };
    case 'DELETE_IDEIA':
      return { ...state, ideias: state.ideias.filter((i) => i.id !== action.id) };
    case 'ADD_JOGADOR':
      return { ...state, jogadores: [...state.jogadores, action.jogador] };
    case 'UPDATE_JOGADOR':
      return { ...state, jogadores: state.jogadores.map((j) => (j.id === action.jogador.id ? action.jogador : j)) };
    case 'DELETE_JOGADOR':
      return {
        ...state,
        jogadores: state.jogadores.filter((j) => j.id !== action.id),
        sessoes: state.sessoes.map((s) => ({ ...s, escalacao: s.escalacao.filter((id) => id !== action.id) })),
      };
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.config } };
    case 'SET_DASH_PLAYER':
      return { ...state, dashPlayerId: action.playerId };
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
    tipoSessao: TipoSessao; label: string; modoRegistro: ModoRegistro; data: string; escalacao: string[];
    timeAId?: string; timeBId?: string; jogadorFocoId?: string;
  }) => string;
  saveEvento: (
    sessaoId: string, tipo: EventTypeKey, lado: Lado, minuto: number, data: FlowData,
    extra?: { origem?: OrigemEvento; videoSegundo?: number; exercicioId?: string },
  ) => void;
  updateEvento: (id: string, tipo: EventTypeKey, lado: Lado, minuto: number, data: FlowData) => void;
  deleteEvento: (id: string) => void;
  addJogador: (input: {
    nome: string; numero?: number; posicao: Jogador['posicao'];
    timeId?: string; vinculo?: VinculoJogador; idade?: number; nota?: string;
  }) => void;
  updateJogador: (jogador: Jogador) => void;
  deleteJogador: (id: string) => void;
  setGradeZonas: (grade: GradeZonas) => void;
  addExercicio: (input: { sessaoId: string; nome: string; tipo: TipoExercicio; duracaoMin?: number }) => string;
  updateExercicio: (exercicio: Exercicio) => void;
  deleteExercicio: (id: string) => void;
  addTime: (nome: string) => string;
  updateTime: (time: Time) => void;
  deleteTime: (id: string) => void;
  addIdeia: (input: Omit<Ideia, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateIdeia: (ideia: Ideia) => void;
  deleteIdeia: (id: string) => void;
  setMetrica: (input: {
    sessaoId: string; jogadorId: string; velocidadeMaxKmh?: number; distanciaM?: number;
    sprints?: number; origem?: MetricaFisica['origem'];
  }) => void;
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
    saveEvento: (sessaoId, tipo, lado, minuto, data, extra) => {
      dispatch({
        type: 'ADD_EVENTO',
        evento: {
          id: novoId('evt'), sessaoId, tipo, lado, minuto, data,
          origem: extra?.origem ?? 'manual',
          videoSegundo: extra?.videoSegundo,
          exercicioId: extra?.exercicioId,
          criadoEm: Date.now(),
        },
      });
    },
    updateEvento: (id, tipo, lado, minuto, data) => dispatch({ type: 'UPDATE_EVENTO', id, tipo, lado, minuto, data }),
    deleteEvento: (id) => dispatch({ type: 'DELETE_EVENTO', id }),
    addJogador: (input) => dispatch({
      type: 'ADD_JOGADOR',
      jogador: {
        id: novoId('jog'), ativo: true,
        timeId: state.config.meuTimeId ?? MEU_TIME_ID, vinculo: 'elenco' as VinculoJogador,
        ...input,
      },
    }),
    updateJogador: (jogador) => dispatch({ type: 'UPDATE_JOGADOR', jogador }),
    deleteJogador: (id) => dispatch({ type: 'DELETE_JOGADOR', id }),
    setGradeZonas: (grade) => dispatch({ type: 'SET_CONFIG', config: { gradeZonas: grade } }),
    addExercicio: (input) => {
      const id = novoId('exe');
      const ordem = state.exercicios.filter((x) => x.sessaoId === input.sessaoId).length;
      dispatch({ type: 'ADD_EXERCICIO', exercicio: { id, ordem, ...input } });
      return id;
    },
    updateExercicio: (exercicio) => dispatch({ type: 'UPDATE_EXERCICIO', exercicio }),
    deleteExercicio: (id) => dispatch({ type: 'DELETE_EXERCICIO', id }),
    addTime: (nome) => {
      const id = novoId('time');
      dispatch({ type: 'ADD_TIME', time: { id, nome, ehMeuTime: false, criadoEm: Date.now() } });
      return id;
    },
    updateTime: (time) => dispatch({ type: 'UPDATE_TIME', time }),
    deleteTime: (id) => dispatch({ type: 'DELETE_TIME', id }),
    addIdeia: (input) => dispatch({
      type: 'ADD_IDEIA',
      ideia: { id: novoId('ideia'), criadoEm: Date.now(), atualizadoEm: Date.now(), ...input },
    }),
    updateIdeia: (ideia) => dispatch({ type: 'UPDATE_IDEIA', ideia }),
    deleteIdeia: (id) => dispatch({ type: 'DELETE_IDEIA', id }),
    setMetrica: (input) => dispatch({
      type: 'SET_METRICA',
      metrica: {
        id: novoId('met'), origem: input.origem ?? 'manual', atualizadoEm: Date.now(), ...input,
      },
    }),
  }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

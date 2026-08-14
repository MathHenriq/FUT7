import { useMemo } from 'react';
import { useApp } from '../store';
import { agregar, defDe, pontosDoJogador, porQuarenta, porSessao } from '../stats';
import { metricasComparaveis } from './useComparacao';
import type { MetricaKey } from '../stats';
import type { Jogador } from '../types';

export type Base = 'quarenta' | 'sessao';

export interface FichaJogador {
  jogador: Jogador;
  clube: string;
  sessoes: number;
  minutos: number;
  /** Every comparable metric on the chosen basis. Null where the player has no
   *  data for it — a keeper with no passes is absent from pass accuracy, not zero. */
  valores: Record<MetricaKey, number | null>;
  /** 1 = best among everyone who has a value for that metric. */
  ranks: Record<MetricaKey, number | null>;
}

/** The whole searchable bank, computed once. Filtering and sorting happen in the
 *  screen — this only answers "what is true about each player". */
export function useBancoJogadores(base: Base) {
  const { state } = useApp();

  return useMemo(() => {
    const fonte = { sessoes: state.sessoes, eventos: state.eventos, metricas: state.metricas };

    const pontosPorJogador = new Map<string, ReturnType<typeof pontosDoJogador>>();
    for (const j of state.jogadores) pontosPorJogador.set(j.id, pontosDoJogador(j.id, fonte));

    const comHistorico = state.jogadores.filter((j) => (pontosPorJogador.get(j.id) ?? []).length > 0);

    const valorDe = (id: string, key: MetricaKey): number | null => {
      const p = pontosPorJogador.get(id) ?? [];
      if (p.length === 0) return null;
      if (defDe(key).agregacao !== 'soma') return agregar(p, key);
      return base === 'quarenta' ? porQuarenta(p, key) : porSessao(p, key);
    };

    // One pass per metric to build the ranking, instead of re-scanning per player.
    const ordenados = new Map<MetricaKey, number[]>();
    for (const key of metricasComparaveis) {
      const vals = comHistorico
        .map((j) => valorDe(j.id, key))
        .filter((v): v is number => v !== null);
      ordenados.set(key, vals);
    }

    const nomeTime = (id: string | undefined) => state.times.find((t) => t.id === id)?.nome ?? '—';

    const fichas: FichaJogador[] = comHistorico.map((j) => {
      const pontos = pontosPorJogador.get(j.id) ?? [];
      const valores = {} as Record<MetricaKey, number | null>;
      const ranks = {} as Record<MetricaKey, number | null>;

      for (const key of metricasComparaveis) {
        const v = valorDe(j.id, key);
        valores[key] = v;
        if (v === null) { ranks[key] = null; continue; }
        const pool = ordenados.get(key) ?? [];
        const maiorEhMelhor = defDe(key).melhorQuando === 'alto';
        ranks[key] = pool.filter((o) => (maiorEhMelhor ? o > v : o < v)).length + 1;
      }

      return {
        jogador: j,
        clube: nomeTime(j.timeId),
        sessoes: pontos.length,
        minutos: pontos.reduce((a, p) => a + (p.minutos ?? 0), 0),
        valores,
        ranks,
      };
    });

    /** Per-40 is only offered when somebody has actually filled minutes in. */
    const temMinutos = fichas.some((f) => f.minutos > 0);

    const posicoesPresentes = [...new Set(comHistorico.map((j) => j.posicao))];
    const clubesPresentes = [...new Set(comHistorico.map((j) => nomeTime(j.timeId)))].sort();

    return {
      fichas,
      temMinutos,
      posicoesPresentes,
      clubesPresentes,
      /** Players that exist but have no session yet — they cannot be searched on
       *  numbers, and a search that silently drops them would look like a bug. */
      semHistorico: state.jogadores.length - comHistorico.length,
    };
  }, [state.jogadores, state.sessoes, state.eventos, state.metricas, state.times, base]);
}

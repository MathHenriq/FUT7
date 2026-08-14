import { useMemo } from 'react';
import { useApp } from '../store';
import {
  agregar, defDe, metricasDef, pontosDoJogador, porQuarenta, porSessao,
} from '../stats';
import type { MetricaKey, PontoSessao } from '../stats';
import type { Jogador } from '../types';

/** Which yardstick the numbers are put on.
 *  `quarenta` is the honest one; `sessao` is the fallback when minutes have not
 *  been filled in. They are never mixed inside one comparison — half the squad on
 *  one basis and half on the other would produce a ranking that means nothing. */
export type Base = 'quarenta' | 'sessao';

/** Whether the percentile is read against the whole squad or only players in the
 *  same position. A keeper's "goals" percentile against forwards is noise, but a
 *  twelve-man squad rarely has enough of one position to rank within it. */
export type Escopo = 'todos' | 'posicao';

export interface CelulaComparacao {
  valor: number | null;
  /** 0..100, already oriented so that higher always means better. */
  percentil: number | null;
  /** 1 = best in the pool. Shown instead of leaning on the percentile, because
   *  "78º percentil" out of eleven players is false precision; "3º de 11" is not. */
  posicaoRank: number | null;
  /** How many players the rank was actually taken over. Not the same as the scope
   *  size: a keeper with no passes has no pass accuracy, so he is not in that
   *  ranking at all. Saying "11º de 12" when the ranking ran over 11 is a lie the
   *  reader has no way to catch. */
  pool: number;
}

export interface LinhaJogador {
  jogador: Jogador;
  pontos: PontoSessao[];
  sessoes: number;
  minutos: number;
  celulas: Record<MetricaKey, CelulaComparacao>;
}

/** Metrics worth putting side by side. Distance and top speed are left out unless
 *  measured — they come from the physical panel, not from tagging. */
export const metricasComparaveis: MetricaKey[] = [
  'gols', 'assistencias', 'finalizacoes', 'conversao',
  'passes', 'precisaoPasse', 'recuperacoes', 'perdas', 'saldoBola',
];

/** Below this the word "percentile" stops being honest — say the rank instead. */
export const POOL_MINIMO = 8;

export function useComparacao(jogadorIds: string[], base: Base, escopo: Escopo) {
  const { state } = useApp();

  return useMemo(() => {
    const fonte = { sessoes: state.sessoes, eventos: state.eventos, metricas: state.metricas };

    const pontosPorJogador = new Map<string, PontoSessao[]>();
    const comHistorico = state.jogadores.filter((j) => {
      const p = pontosDoJogador(j.id, fonte);
      pontosPorJogador.set(j.id, p);
      return p.length > 0;
    });

    const selecionados = jogadorIds
      .map((id) => state.jogadores.find((j) => j.id === id))
      .filter((j): j is Jogador => j !== undefined);

    /** The value a single player carries into the ranking, on the chosen basis.
     *  Rate metrics (conversion, pass accuracy) are already rates and are never
     *  divided again. */
    const valorDe = (id: string, key: MetricaKey): number | null => {
      const pontos = pontosPorJogador.get(id) ?? [];
      if (pontos.length === 0) return null;
      if (defDe(key).agregacao !== 'soma') return agregar(pontos, key);
      return base === 'quarenta' ? porQuarenta(pontos, key) : porSessao(pontos, key);
    };

    /** Everyone this player is being ranked against. */
    const poolDe = (j: Jogador): Jogador[] =>
      escopo === 'posicao' ? comHistorico.filter((o) => o.posicao === j.posicao) : comHistorico;

    const linhas: LinhaJogador[] = selecionados.map((j) => {
      const pontos = pontosPorJogador.get(j.id) ?? [];
      const pool = poolDe(j);

      const celulas = {} as Record<MetricaKey, CelulaComparacao>;
      for (const key of metricasComparaveis) {
        const valor = valorDe(j.id, key);
        const doPool = pool
          .map((o) => valorDe(o.id, key))
          .filter((v): v is number => v !== null);

        if (valor === null || doPool.length < 2) {
          celulas[key] = { valor, percentil: null, posicaoRank: null, pool: doPool.length };
          continue;
        }

        const maiorEhMelhor = defDe(key).melhorQuando === 'alto';
        const piores = doPool.filter((v) => (maiorEhMelhor ? v < valor : v > valor)).length;
        const melhores = doPool.filter((v) => (maiorEhMelhor ? v > valor : v < valor)).length;

        celulas[key] = {
          valor,
          percentil: Math.round((piores / (doPool.length - 1)) * 100),
          posicaoRank: melhores + 1,
          pool: doPool.length,
        };
      }

      return {
        jogador: j,
        pontos,
        sessoes: pontos.length,
        minutos: pontos.reduce((a, p) => a + (p.minutos ?? 0), 0),
        celulas,
      };
    });

    /** Per-40 is only offered when every compared player actually has minutes —
     *  otherwise the button would produce a chart with holes where the bench is. */
    const todosTemMinutos = linhas.length > 0
      && linhas.every((l) => l.pontos.some((p) => p.minutos !== null && p.minutos > 0));

    const tamanhoPool = linhas.length > 0 ? poolDe(linhas[0].jogador).length : comHistorico.length;
    const porPosicao = new Map<string, number>();
    for (const j of comHistorico) porPosicao.set(j.posicao, (porPosicao.get(j.posicao) ?? 0) + 1);

    return {
      linhas,
      elegiveis: comHistorico,
      tamanhoPool,
      poolPequeno: tamanhoPool < POOL_MINIMO,
      todosTemMinutos,
      /** Enough of one position to rank inside it? */
      posicaoViavel: selecionados.every((j) => (porPosicao.get(j.posicao) ?? 0) >= 5),
      metricas: metricasComparaveis.map(defDe),
      metricasDef,
    };
  }, [state.jogadores, state.sessoes, state.eventos, state.metricas, jogadorIds, base, escopo]);
}

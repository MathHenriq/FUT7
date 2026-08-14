import { useMemo } from 'react';
import { useApp } from '../store';
import {
  agregar as agregarPontos, MINUTOS_REFERENCIA, metricasDef,
  porQuarenta as porQuarentaDePontos, pontosDoJogador,
} from '../stats';
import type { MetricaDef, MetricaKey, PontoSessao } from '../stats';

/** The calculation itself lives in ../stats so the comparison screen can run it
 *  across the whole squad without a second definition of what a goal is. */
export { MINUTOS_REFERENCIA, metricasDef };
export type { MetricaDef, MetricaKey, PontoSessao };

export function useJogadorStats(jogadorId: string) {
  const { state } = useApp();

  return useMemo(() => {
    const fonte = { sessoes: state.sessoes, eventos: state.eventos, metricas: state.metricas };
    const pontos = pontosDoJogador(jogadorId, fonte);

    const minutosTotais = pontos.reduce((a, p) => a + (p.minutos ?? 0), 0);
    const sessoesComMinuto = pontos.filter((p) => p.minutos !== null).length;

    // Shot map for this player, independent of the session filter.
    const finalizacoes = state.eventos.filter(
      (e) => e.tipo === 'finalizacao' && e.lado === 'nos' && e.data.scorerId === jogadorId,
    );

    return {
      pontos,
      agregar: (key: MetricaKey) => agregarPontos(pontos, key),
      porQuarenta: (key: MetricaKey) => porQuarentaDePontos(pontos, key),
      minutosTotais,
      sessoesComMinuto,
      finalizacoes,
      sessoesJogadas: pontos.length,
      partidas: pontos.filter((p) => p.tipoSessao === 'partida').length,
      treinos: pontos.filter((p) => p.tipoSessao === 'treino').length,
    };
  }, [state.eventos, state.sessoes, state.metricas, jogadorId]);
}

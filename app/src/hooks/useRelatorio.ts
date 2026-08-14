import { useMemo } from 'react';
import { useApp } from '../store';
import { ehGol, labelPosicao } from '../data';
import { agregar, defDe, pontosDoJogador, porQuarenta, porSessao } from '../stats';
import { metricasComparaveis } from './useComparacao';
import type { MetricaDef, MetricaKey } from '../stats';
import type { EventoRegistrado, Sessao } from '../types';

/** Percentile above which a metric is worth naming as a strength, and below which
 *  it is worth naming as a weakness. Deliberately not 50: everything is above or
 *  below average, and a report that lists nine "findings" has found nothing. */
const FORTE = 70;
const FRACO = 30;

/** A verdict written off one afternoon is a guess. The report says so. */
const OBSERVACOES_MINIMAS = 3;

export interface DestaqueMetrica {
  def: MetricaDef;
  valor: number;
  percentil: number;
  posicaoRank: number;
  pool: number;
}

export interface SessaoObservada {
  sessao: Sessao;
  adversario: string;
  minutos: number | null;
  gols: number;
  eventos: number;
}

export function useRelatorio(jogadorId: string) {
  const { state } = useApp();

  return useMemo(() => {
    const jogador = state.jogadores.find((j) => j.id === jogadorId);
    const fonte = { sessoes: state.sessoes, eventos: state.eventos, metricas: state.metricas };
    const pontos = jogador ? pontosDoJogador(jogadorId, fonte) : [];

    const minutosTotais = pontos.reduce((a, p) => a + (p.minutos ?? 0), 0);
    const temMinutos = pontos.some((p) => p.minutos !== null && p.minutos > 0);

    /** Same basis rule as the comparison screen: per-40 when minutes exist,
     *  per-session otherwise, and the report prints which one it used. */
    const base: 'quarenta' | 'sessao' = temMinutos ? 'quarenta' : 'sessao';
    const valorDe = (id: string, key: MetricaKey): number | null => {
      const p = id === jogadorId ? pontos : pontosDoJogador(id, fonte);
      if (p.length === 0) return null;
      if (defDe(key).agregacao !== 'soma') return agregar(p, key);
      return base === 'quarenta' ? porQuarenta(p, key) : porSessao(p, key);
    };

    /** Ranked against everyone with history — the same pool the comparison uses,
     *  named in the report so the reader knows what "3º" is out of. */
    const pool = state.jogadores.filter((j) => pontosDoJogador(j.id, fonte).length > 0);

    const linhas: DestaqueMetrica[] = [];
    for (const key of metricasComparaveis) {
      const valor = valorDe(jogadorId, key);
      if (valor === null) continue;
      const doPool = pool.map((o) => valorDe(o.id, key)).filter((v): v is number => v !== null);
      if (doPool.length < 2) continue;

      const def = defDe(key);
      const maiorEhMelhor = def.melhorQuando === 'alto';
      const piores = doPool.filter((v) => (maiorEhMelhor ? v < valor : v > valor)).length;
      const melhores = doPool.filter((v) => (maiorEhMelhor ? v > valor : v < valor)).length;

      linhas.push({
        def,
        valor,
        percentil: Math.round((piores / (doPool.length - 1)) * 100),
        posicaoRank: melhores + 1,
        pool: doPool.length,
      });
    }

    // Membership is decided by percentile, but the list is *sorted by the rank it
    // prints*. Ties pull the two apart — five players level on assists share a low
    // percentile while ranking 7th — and a list ordered by one number while showing
    // another reads as broken even when both are right.
    const fortes = linhas.filter((l) => l.percentil >= FORTE).sort((a, b) => a.posicaoRank - b.posicaoRank);
    const fracos = linhas.filter((l) => l.percentil <= FRACO).sort((a, b) => b.posicaoRank - a.posicaoRank);

    const nomeTime = (id: string | undefined, padrao: string) =>
      state.times.find((t) => t.id === id)?.nome ?? padrao;

    const sessoes: SessaoObservada[] = pontos.map((p) => {
      const s = state.sessoes.find((x) => x.id === p.sessaoId)!;
      const evs: EventoRegistrado[] = state.eventos.filter(
        (e) => e.sessaoId === s.id && (e.data.scorerId === jogadorId || e.data.playerId === jogadorId || e.data.assistId === jogadorId),
      );
      return {
        sessao: s,
        adversario: nomeTime(s.timeBId, s.label),
        minutos: p.minutos,
        gols: evs.filter((e) => ehGol(e) && e.data.scorerId === jogadorId).length,
        eventos: evs.length,
      };
    });

    const finalizacoes = state.eventos.filter(
      (e) => e.tipo === 'finalizacao' && e.data.scorerId === jogadorId,
    );

    const clube = jogador ? nomeTime(jogador.timeId, '—') : '—';

    return {
      jogador,
      clube,
      posicao: jogador ? labelPosicao(jogador.posicao) : '',
      pontos,
      sessoes,
      finalizacoes,
      linhas,
      fortes,
      fracos,
      minutosTotais,
      base,
      tamanhoPool: pool.length,
      /** One or two viewings is an impression, not an assessment. */
      amostraFina: pontos.length < OBSERVACOES_MINIMAS,
      observacoesMinimas: OBSERVACOES_MINIMAS,
    };
  }, [state.jogadores, state.sessoes, state.eventos, state.metricas, state.times, jogadorId]);
}

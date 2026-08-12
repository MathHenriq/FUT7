import { useMemo } from 'react';
import { useApp } from '../store';
import { ehGol } from '../data';
import type { EventoRegistrado, TipoSessao } from '../types';

export type MetricaKey =
  | 'gols' | 'assistencias' | 'finalizacoes' | 'conversao'
  | 'passes' | 'precisaoPasse' | 'perdas' | 'recuperacoes' | 'saldoBola'
  | 'faltas' | 'velocidadeMax' | 'distancia';

export interface MetricaDef {
  key: MetricaKey;
  label: string;
  sufixo?: string;
  decimais?: number;
  /** Percentages and speeds are ratios, not tallies — summing them would be nonsense. */
  agregacao: 'soma' | 'media' | 'maximo';
}

export const metricasDef: MetricaDef[] = [
  { key: 'gols', label: 'Gols', agregacao: 'soma' },
  { key: 'assistencias', label: 'Assistências', agregacao: 'soma' },
  { key: 'finalizacoes', label: 'Finalizações', agregacao: 'soma' },
  { key: 'conversao', label: 'Conversão', sufixo: '%', agregacao: 'media' },
  { key: 'passes', label: 'Passes', agregacao: 'soma' },
  { key: 'precisaoPasse', label: 'Precisão de passe', sufixo: '%', agregacao: 'media' },
  { key: 'perdas', label: 'Perdas de bola', agregacao: 'soma' },
  { key: 'recuperacoes', label: 'Recuperações', agregacao: 'soma' },
  { key: 'saldoBola', label: 'Saldo de bola', agregacao: 'soma' },
  { key: 'faltas', label: 'Faltas cometidas', agregacao: 'soma' },
  { key: 'velocidadeMax', label: 'Velocidade máxima', sufixo: ' km/h', decimais: 1, agregacao: 'maximo' },
  { key: 'distancia', label: 'Distância', sufixo: ' km', decimais: 1, agregacao: 'soma' },
];

export interface PontoSessao {
  sessaoId: string;
  label: string;
  data: string;
  tipoSessao: TipoSessao;
  /** Null when nobody filled it — never assumed, because assuming a full match would
   *  silently deflate the rate of whoever came off the bench. */
  minutos: number | null;
  valores: Record<MetricaKey, number | null>;
}

/** A fut7 half-length reference: totals normalised "per 40" are what make a reserve and
 *  a starter comparable at all. */
export const MINUTOS_REFERENCIA = 40;

/** True when the event belongs to this player, whichever role field applies. */
function doJogador(e: EventoRegistrado, id: string): boolean {
  return e.data.scorerId === id || e.data.playerId === id;
}

export function useJogadorStats(jogadorId: string) {
  const { state } = useApp();

  return useMemo(() => {
    const sessoes = [...state.sessoes].sort((a, b) => a.createdAt - b.createdAt);

    const participou = sessoes.filter((s) => {
      if (s.escalacao.includes(jogadorId)) return true;
      if (state.eventos.some((e) => e.sessaoId === s.id && (doJogador(e, jogadorId) || e.data.assistId === jogadorId))) return true;
      return state.metricas.some((m) => m.sessaoId === s.id && m.jogadorId === jogadorId);
    });

    const pontos: PontoSessao[] = participou.map((s) => {
      const meus = state.eventos.filter((e) => e.sessaoId === s.id && e.lado === 'nos' && doJogador(e, jogadorId));
      const fins = meus.filter((e) => e.tipo === 'finalizacao');
      const gols = fins.filter(ehGol).length;
      const passes = meus.filter((e) => e.tipo === 'passe');
      const passesCertos = passes.filter((e) => e.data.resultado === 'certo').length;
      const perdas = meus.filter((e) => e.tipo === 'perda').length;
      const recuperacoes = meus.filter((e) => e.tipo === 'recuperacao').length;
      const faltas = meus.filter((e) => e.tipo === 'falta' && e.data.faltaTipo === 'cometida').length;
      const assistencias = state.eventos.filter(
        (e) => e.sessaoId === s.id && e.lado === 'nos' && ehGol(e) && e.data.assistId === jogadorId,
      ).length;
      const met = state.metricas.find((m) => m.sessaoId === s.id && m.jogadorId === jogadorId);
      const minutos = s.minutosPorJogador?.[jogadorId] ?? null;

      return {
        sessaoId: s.id,
        label: s.label,
        data: s.data,
        tipoSessao: s.tipoSessao,
        minutos,
        valores: {
          gols,
          assistencias,
          finalizacoes: fins.length,
          conversao: fins.length > 0 ? Math.round((gols / fins.length) * 100) : null,
          passes: passes.length,
          precisaoPasse: passes.length > 0 ? Math.round((passesCertos / passes.length) * 100) : null,
          perdas,
          recuperacoes,
          saldoBola: recuperacoes - perdas,
          faltas,
          velocidadeMax: met?.velocidadeMaxKmh ?? null,
          distancia: met?.distanciaM !== undefined ? met.distanciaM / 1000 : null,
        },
      };
    });

    const minutosTotais = pontos.reduce((a, p) => a + (p.minutos ?? 0), 0);
    const sessoesComMinuto = pontos.filter((p) => p.minutos !== null).length;

    /** Per-40 rate, computed only over sessions that actually have a minute recorded —
     *  mixing measured and unmeasured sessions would understate the rate. */
    function porQuarenta(key: MetricaKey): number | null {
      const def = metricasDef.find((m) => m.key === key)!;
      if (def.agregacao !== 'soma') return null;
      const comMinuto = pontos.filter((p) => p.minutos !== null && p.minutos > 0);
      if (comMinuto.length === 0) return null;
      const total = comMinuto.reduce((a, p) => a + (p.valores[key] ?? 0), 0);
      const min = comMinuto.reduce((a, p) => a + (p.minutos as number), 0);
      if (min === 0) return null;
      return (total / min) * MINUTOS_REFERENCIA;
    }

    function agregar(key: MetricaKey): number | null {
      const def = metricasDef.find((m) => m.key === key)!;
      const vals = pontos.map((p) => p.valores[key]).filter((v): v is number => v !== null);
      if (vals.length === 0) return null;
      if (def.agregacao === 'maximo') return Math.max(...vals);
      const soma = vals.reduce((a, b) => a + b, 0);
      return def.agregacao === 'media' ? Math.round(soma / vals.length) : soma;
    }

    // Shot map for this player, independent of the session filter.
    const finalizacoes = state.eventos.filter(
      (e) => e.tipo === 'finalizacao' && e.lado === 'nos' && e.data.scorerId === jogadorId,
    );

    return {
      pontos,
      agregar,
      porQuarenta,
      minutosTotais,
      sessoesComMinuto,
      finalizacoes,
      sessoesJogadas: pontos.length,
      partidas: pontos.filter((p) => p.tipoSessao === 'partida').length,
      treinos: pontos.filter((p) => p.tipoSessao === 'treino').length,
    };
  }, [state.eventos, state.sessoes, state.metricas, jogadorId]);
}

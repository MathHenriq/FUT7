import { ehGol } from './data';
import type { EventoRegistrado, MetricaFisica, Sessao, TipoSessao } from './types';

/** One definition of what each number means, used by the player profile and by the
 *  comparison alike. Two copies of "what counts as a goal" would drift within a
 *  month, and the two screens would quietly disagree about the same player. */

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
  /** Which direction is good. Losing the ball less is better, and a comparison that
   *  ignored this would draw the longest bar for the worst player. */
  melhorQuando: 'alto' | 'baixo';
}

export const metricasDef: MetricaDef[] = [
  { key: 'gols', label: 'Gols', agregacao: 'soma', melhorQuando: 'alto' },
  { key: 'assistencias', label: 'Assistências', agregacao: 'soma', melhorQuando: 'alto' },
  { key: 'finalizacoes', label: 'Finalizações', agregacao: 'soma', melhorQuando: 'alto' },
  { key: 'conversao', label: 'Conversão', sufixo: '%', agregacao: 'media', melhorQuando: 'alto' },
  { key: 'passes', label: 'Passes', agregacao: 'soma', melhorQuando: 'alto' },
  { key: 'precisaoPasse', label: 'Precisão de passe', sufixo: '%', agregacao: 'media', melhorQuando: 'alto' },
  { key: 'perdas', label: 'Perdas de bola', agregacao: 'soma', melhorQuando: 'baixo' },
  { key: 'recuperacoes', label: 'Recuperações', agregacao: 'soma', melhorQuando: 'alto' },
  { key: 'saldoBola', label: 'Saldo de bola', agregacao: 'soma', melhorQuando: 'alto' },
  { key: 'faltas', label: 'Faltas cometidas', agregacao: 'soma', melhorQuando: 'baixo' },
  { key: 'velocidadeMax', label: 'Velocidade máxima', sufixo: ' km/h', decimais: 1, agregacao: 'maximo', melhorQuando: 'alto' },
  { key: 'distancia', label: 'Distância', sufixo: ' km', decimais: 1, agregacao: 'soma', melhorQuando: 'alto' },
];

export function defDe(key: MetricaKey): MetricaDef {
  return metricasDef.find((m) => m.key === key)!;
}

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

export interface Fonte {
  sessoes: Sessao[];
  eventos: EventoRegistrado[];
  metricas: MetricaFisica[];
}

/** Every session this player took part in, with the numbers for each. */
export function pontosDoJogador(jogadorId: string, { sessoes, eventos, metricas }: Fonte): PontoSessao[] {
  const ordenadas = [...sessoes].sort((a, b) => a.createdAt - b.createdAt);

  const participou = ordenadas.filter((s) => {
    if (s.escalacao.includes(jogadorId)) return true;
    if (eventos.some((e) => e.sessaoId === s.id && (doJogador(e, jogadorId) || e.data.assistId === jogadorId))) return true;
    return metricas.some((m) => m.sessaoId === s.id && m.jogadorId === jogadorId);
  });

  return participou.map((s) => {
    const meus = eventos.filter((e) => e.sessaoId === s.id && e.lado === 'nos' && doJogador(e, jogadorId));
    const fins = meus.filter((e) => e.tipo === 'finalizacao');
    const gols = fins.filter(ehGol).length;
    const passes = meus.filter((e) => e.tipo === 'passe');
    const passesCertos = passes.filter((e) => e.data.resultado === 'certo').length;
    const perdas = meus.filter((e) => e.tipo === 'perda').length;
    const recuperacoes = meus.filter((e) => e.tipo === 'recuperacao').length;
    const faltas = meus.filter((e) => e.tipo === 'falta' && e.data.faltaTipo === 'cometida').length;
    const assistencias = eventos.filter(
      (e) => e.sessaoId === s.id && e.lado === 'nos' && ehGol(e) && e.data.assistId === jogadorId,
    ).length;
    const met = metricas.find((m) => m.sessaoId === s.id && m.jogadorId === jogadorId);

    return {
      sessaoId: s.id,
      label: s.label,
      data: s.data,
      tipoSessao: s.tipoSessao,
      minutos: s.minutosPorJogador?.[jogadorId] ?? null,
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
}

export function agregar(pontos: PontoSessao[], key: MetricaKey): number | null {
  const def = defDe(key);
  const vals = pontos.map((p) => p.valores[key]).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  if (def.agregacao === 'maximo') return Math.max(...vals);
  const soma = vals.reduce((a, b) => a + b, 0);
  return def.agregacao === 'media' ? Math.round(soma / vals.length) : soma;
}

/** Per-40 rate, computed only over sessions that actually have a minute recorded —
 *  mixing measured and unmeasured sessions would understate the rate. */
export function porQuarenta(pontos: PontoSessao[], key: MetricaKey): number | null {
  if (defDe(key).agregacao !== 'soma') return null;
  const comMinuto = pontos.filter((p) => p.minutos !== null && p.minutos > 0);
  if (comMinuto.length === 0) return null;
  const total = comMinuto.reduce((a, p) => a + (p.valores[key] ?? 0), 0);
  const min = comMinuto.reduce((a, p) => a + (p.minutos as number), 0);
  if (min === 0) return null;
  return (total / min) * MINUTOS_REFERENCIA;
}

/** Per-session rate: the fallback basis when minutes have not been filled in.
 *  Weaker than per-40 — it rewards whoever plays the full match — but it is at
 *  least a rate, and the screen says which basis it used. */
export function porSessao(pontos: PontoSessao[], key: MetricaKey): number | null {
  if (defDe(key).agregacao !== 'soma') return null;
  if (pontos.length === 0) return null;
  const total = pontos.reduce((a, p) => a + (p.valores[key] ?? 0), 0);
  return total / pontos.length;
}

import { useMemo } from 'react';
import { useApp } from '../store';
import { ehGol } from '../data';
import type { EventoRegistrado, Lado } from '../types';

/** Attack momentum: how the pressure swung, minute by minute.
 *
 *  This is a *model*, not a measurement — there is no such thing as a recorded
 *  "pressure" event. It reads the events we already store and turns them into a
 *  score, so the weights below are the whole argument and are kept in one place,
 *  visible, instead of scattered through the drawing code.
 *
 *  Coordinates help because of an invariant the app already relies on: x,y are
 *  recorded in the attacking frame of whichever side produced the event, which is
 *  what makes the opponent's shot map readable on the same grid. So y is
 *  "how far toward the goal being attacked" for both sides, and a recovery at
 *  y 0.8 is a high press for whoever made it.
 */

/** Neutral advancement for an event tagged without a location — a shot still
 *  counts as a shot, it just stops earning the positional part. */
const Y_DESCONHECIDO = 0.5;

/** Where the final third begins, in normalised pitch coordinates. */
const TERCO_FINAL = 0.55;

/** Contribution of a single event to the pressure of the side that produced it.
 *  Nothing is ever negative: the absence of pressure is already zero, and a
 *  turnover is credited to the other side through its own `recuperacao`, so
 *  charging it twice would double-count the same moment. */
export function pesoDoEvento(e: EventoRegistrado): number {
  const y = e.data.y ?? Y_DESCONHECIDO;

  switch (e.tipo) {
    case 'finalizacao':
      if (ehGol(e)) return 10;
      // On target is worth more than a shot that never threatened.
      if (e.data.resultadoFin === 'defendida' || e.data.resultadoFin === 'trave') return 6;
      return 4;
    case 'cruzamento':
      return 3;
    case 'lancamento':
      return 2;
    case 'recuperacao':
      // Winning it back in their half is pressure; winning it back in our own box
      // is just defending, and scales to nearly nothing.
      return 3 * y;
    case 'passe':
      return e.data.resultado === 'certo' && y >= TERCO_FINAL ? 1 : 0;
    case 'falta':
      return e.data.faltaTipo === 'sofrida' && y >= TERCO_FINAL ? 2 : 0;
    default:
      return 0;
  }
}

/** Half-width of the smoothing window, in minutes. Pressure is something that
 *  builds and fades — a raw per-minute tally reads as noise, not as momentum. */
const JANELA = 2;

export interface PontoMomentum {
  minuto: number;
  /** Positive is us, negative is them. Normalised to ±1 across the session. */
  valor: number;
  nos: number;
  adversario: number;
}

export interface Golzinho {
  minuto: number;
  lado: Lado;
}

export interface Onda {
  lado: Lado;
  inicio: number;
  fim: number;
  pico: number;
}

export function useMomentum(sessaoId: string) {
  const { state } = useApp();

  return useMemo(() => {
    const sessao = state.sessoes.find((s) => s.id === sessaoId);
    const eventos = state.eventos.filter((e) => e.sessaoId === sessaoId);

    const ultimoMinuto = eventos.reduce((a, e) => Math.max(a, e.minuto), 0);
    const duracao = Math.max(sessao?.duracaoMin ?? 0, ultimoMinuto, 1);

    // Raw per-minute tallies, one array per side.
    const cru: Record<Lado, number[]> = {
      nos: new Array(duracao + 1).fill(0),
      adversario: new Array(duracao + 1).fill(0),
    };
    for (const e of eventos) {
      const m = Math.min(duracao, Math.max(0, Math.round(e.minuto)));
      cru[e.lado][m] += pesoDoEvento(e);
    }

    // Triangular smoothing: a shot in minute 30 still says something about 29 and 31.
    const suavizar = (arr: number[]): number[] =>
      arr.map((_, i) => {
        let soma = 0;
        let pesos = 0;
        for (let d = -JANELA; d <= JANELA; d++) {
          const j = i + d;
          if (j < 0 || j >= arr.length) continue;
          const w = JANELA + 1 - Math.abs(d);
          soma += arr[j] * w;
          pesos += w;
        }
        return pesos > 0 ? soma / pesos : 0;
      });

    const nosSuave = suavizar(cru.nos);
    const advSuave = suavizar(cru.adversario);

    const liquido = nosSuave.map((v, i) => v - advSuave[i]);
    const pico = Math.max(...liquido.map(Math.abs), 1e-6);

    const pontos: PontoMomentum[] = liquido.map((v, i) => ({
      minuto: i,
      valor: v / pico,
      nos: nosSuave[i],
      adversario: advSuave[i],
    }));

    const gols: Golzinho[] = eventos
      .filter(ehGol)
      .map((e) => ({ minuto: Math.min(duracao, Math.max(0, Math.round(e.minuto))), lado: e.lado }))
      .sort((a, b) => a.minuto - b.minuto);

    /** The chart's own summary in words, so the reading never depends on colour
     *  alone — and so a spell of pressure can be named instead of pointed at. */
    const ondas: Onda[] = [];
    const LIMIAR = 0.35;
    let atual: Onda | null = null;
    for (const p of pontos) {
      const lado: Lado | null = p.valor >= LIMIAR ? 'nos' : p.valor <= -LIMIAR ? 'adversario' : null;
      if (lado === null) {
        if (atual) { ondas.push(atual); atual = null; }
        continue;
      }
      if (atual && atual.lado === lado) {
        atual.fim = p.minuto;
        atual.pico = Math.max(atual.pico, Math.abs(p.valor));
      } else {
        if (atual) ondas.push(atual);
        atual = { lado, inicio: p.minuto, fim: p.minuto, pico: Math.abs(p.valor) };
      }
    }
    if (atual) ondas.push(atual);

    const maiorOnda = ondas.length > 0
      ? ondas.reduce((a, b) => ((b.fim - b.inicio) * b.pico > (a.fim - a.inicio) * a.pico ? b : a))
      : null;

    /** How much of each side was actually tagged.
     *
     *  This chart is only about the match to the extent that both sides were
     *  recorded. Tag every one of our touches and only the opponent's goals, and
     *  the shape says we dominated from start to finish — when all it really says
     *  is who the analyst was watching. The number is cheap to compute and the
     *  chart is worthless without it, so it travels with the data. */
    const porLado: Record<Lado, number> = {
      nos: eventos.filter((e) => e.lado === 'nos').length,
      adversario: eventos.filter((e) => e.lado === 'adversario').length,
    };
    const maiorLado = Math.max(porLado.nos, porLado.adversario);
    const menorLado = Math.min(porLado.nos, porLado.adversario);
    const ladoFraco: Lado = porLado.nos <= porLado.adversario ? 'nos' : 'adversario';

    return {
      sessao,
      pontos,
      duracao,
      gols,
      ondas: ondas.filter((o) => o.fim > o.inicio),
      maiorOnda,
      /** Nothing to draw is different from a flat line at zero. */
      temDados: eventos.some((e) => pesoDoEvento(e) > 0),
      totalEventos: eventos.length,
      cobertura: {
        ...porLado,
        ladoFraco,
        /** One side barely tagged: read the chart as coverage, not as the match. */
        desequilibrada: maiorLado > 0 && menorLado / maiorLado < 0.25,
      },
    };
  }, [state.eventos, state.sessoes, sessaoId]);
}

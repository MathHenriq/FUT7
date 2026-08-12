import { colors } from '../colors';
import { useMemo } from 'react';
import { useApp } from '../store';
import { ehGol, heatColor, linhasDaGrade, originOptions, setorIndex, setorLabels } from '../data';
import type { Lado } from '../types';

const CHART_W = 560;
const CHART_H = 200;
const PAD_X = 34;
const PAD_Y = 22;
const BASE_MAX_VAL = 4;

export function useDashboardData(lado: Lado) {
  const { state } = useApp();
  const { gradeZonas } = state.config;

  return useMemo(() => {
    const finsDoLado = state.eventos.filter((e) => e.tipo === 'finalizacao' && e.lado === lado);
    const golsDoLado = finsDoLado.filter(ehGol);

    const originCounts = originOptions.map((o) => ({
      label: o.label,
      count: golsDoLado.filter((g) => g.data.origin === o.key).length,
    }));
    const originTotal = originCounts.reduce((a, c) => a + c.count, 0);
    const goalOrigin = originCounts.map((o) => ({
      label: o.label,
      count: o.count,
      pct: originTotal > 0 ? Math.round((o.count / originTotal) * 100) : 0,
    }));

    // Sectors are derived from stored coordinates, so flipping 9 <-> 12 re-buckets
    // the entire history instead of invalidating it.
    const labels = setorLabels(gradeZonas);
    const counts = new Array(labels.length).fill(0) as number[];
    for (const g of golsDoLado) {
      if (g.data.x === undefined || g.data.y === undefined) continue;
      counts[setorIndex(g.data.x, g.data.y, gradeZonas)] += 1;
    }
    const maxHeat = Math.max(...counts, 1);
    const heatCells = counts.map((v, i) => ({ value: v, label: labels[i], bg: heatColor(v, maxHeat) }));
    const heatRows = linhasDaGrade(gradeZonas);
    const semLocal = golsDoLado.filter((g) => g.data.x === undefined).length;

    const sessoesOrdenadas = [...state.sessoes].sort((a, b) => a.createdAt - b.createdAt);
    const golsNossos = state.eventos.filter((e) => e.lado === 'nos' && ehGol(e));
    const goalsByMatch = sessoesOrdenadas.map(
      (s) => golsNossos.filter((g) => g.sessaoId === s.id && g.data.scorerId === state.dashPlayerId).length,
    );

    const maxVal = Math.max(BASE_MAX_VAL, ...goalsByMatch);
    const n = goalsByMatch.length;
    const chartPoints = goalsByMatch.map((v, i) => {
      const highlighted = state.dashSessao !== 'all' && state.dashSessao === sessoesOrdenadas[i].id;
      return {
        x: n > 1 ? PAD_X + (i * (CHART_W - 2 * PAD_X)) / (n - 1) : CHART_W / 2,
        y: CHART_H - PAD_Y - (v / maxVal) * (CHART_H - 2 * PAD_Y),
        r: highlighted ? 6 : 4,
        fill: highlighted ? colors.gold : colors.blue,
      };
    });
    const chartPath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const totalGoalsSel = state.dashSessao === 'all'
      ? goalsByMatch.reduce((a, c) => a + c, 0)
      : (goalsByMatch[sessoesOrdenadas.findIndex((s) => s.id === state.dashSessao)] ?? 0);
    const selSessao = sessoesOrdenadas.find((s) => s.id === state.dashSessao);
    const selLabel = state.dashSessao === 'all' ? 'na temporada' : `em ${selSessao?.label ?? ''}`;
    const sessaoOptionsList = sessoesOrdenadas.map((s) => ({ id: s.id, label: s.label }));

    const golsPro = state.eventos.filter((e) => e.lado === 'nos' && ehGol(e)).length;
    const golsContra = state.eventos.filter((e) => e.lado === 'adversario' && ehGol(e)).length;

    // Only computable now that a shot exists independently of a goal.
    const finalizacoes = finsDoLado.length;
    const aproveitamento = finalizacoes > 0 ? Math.round((golsDoLado.length / finalizacoes) * 100) : 0;

    const doLado = state.eventos.filter((e) => e.lado === lado);
    const perdas = doLado.filter((e) => e.tipo === 'perda').length;
    const recuperacoes = doLado.filter((e) => e.tipo === 'recuperacao').length;
    const faltasCometidas = doLado.filter((e) => e.tipo === 'falta' && e.data.faltaTipo === 'cometida').length;
    const faltasSofridas = doLado.filter((e) => e.tipo === 'falta' && e.data.faltaTipo === 'sofrida').length;

    // Where we give the ball away — the defensive counterpart of the shot map.
    const perdaCounts = new Array(labels.length).fill(0) as number[];
    for (const p of doLado.filter((e) => e.tipo === 'perda')) {
      if (p.data.x === undefined || p.data.y === undefined) continue;
      perdaCounts[setorIndex(p.data.x, p.data.y, gradeZonas)] += 1;
    }
    const maxPerda = Math.max(...perdaCounts, 1);
    const perdaCells = perdaCounts.map((v, i) => ({ value: v, label: labels[i], bg: heatColor(v, maxPerda) }));

    const passes = doLado.filter((e) => e.tipo === 'passe');
    const passesCertos = passes.filter((e) => e.data.resultado === 'certo').length;
    const precisaoPasse = passes.length > 0 ? Math.round((passesCertos / passes.length) * 100) : 0;

    return {
      goalOrigin, heatCells, heatRows, semLocal, chartPath, chartPoints,
      totalGoalsSel, selLabel, sessaoOptionsList, golsPro, golsContra,
      finalizacoes, aproveitamento, golsDoLado: golsDoLado.length,
      perdas, recuperacoes, faltasCometidas, faltasSofridas, perdaCells,
      passes: passes.length, precisaoPasse,
    };
  }, [state.eventos, state.sessoes, state.dashPlayerId, state.dashSessao, gradeZonas, lado]);
}

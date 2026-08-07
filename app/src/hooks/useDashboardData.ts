import { useMemo } from 'react';
import { useApp } from '../store';
import { heatColor, originOptions, zoneLabels } from '../data';

const CHART_W = 560;
const CHART_H = 200;
const PAD_X = 34;
const PAD_Y = 22;
const BASE_MAX_VAL = 4;

export function useDashboardData() {
  const { state } = useApp();

  return useMemo(() => {
    const gols = state.eventos.filter((e) => e.tipo === 'gol');

    const originCounts = originOptions.map((o) => ({
      label: o.label,
      count: gols.filter((g) => g.data.origin === o.key).length,
    }));
    const originTotal = originCounts.reduce((a, c) => a + c.count, 0);
    const goalOrigin = originCounts.map((o) => ({
      label: o.label,
      count: o.count,
      pct: originTotal > 0 ? Math.round((o.count / originTotal) * 100) : 0,
    }));

    const zoneCounts = zoneLabels.map((_, i) => gols.filter((g) => g.data.zone === i).length);
    const maxHeat = Math.max(...zoneCounts, 1);
    const heatCells = zoneCounts.map((v, i) => ({ value: v, label: zoneLabels[i], bg: heatColor(v, maxHeat) }));

    const sessoesOrdenadas = [...state.sessoes].sort((a, b) => a.createdAt - b.createdAt);
    const goalsByMatch = sessoesOrdenadas.map((s) => gols.filter((g) => g.sessaoId === s.id && g.data.scorer === state.dashPlayer).length);

    const maxVal = Math.max(BASE_MAX_VAL, ...goalsByMatch);
    const n = goalsByMatch.length;
    const chartPoints = goalsByMatch.map((v, i) => {
      const highlighted = state.dashSessao !== 'all' && state.dashSessao === sessoesOrdenadas[i].id;
      return {
        x: n > 1 ? PAD_X + (i * (CHART_W - 2 * PAD_X)) / (n - 1) : CHART_W / 2,
        y: CHART_H - PAD_Y - (v / maxVal) * (CHART_H - 2 * PAD_Y),
        r: highlighted ? 6 : 4,
        fill: highlighted ? '#f5a623' : '#4f8ef7',
      };
    });
    const chartPath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const totalGoalsSel = state.dashSessao === 'all'
      ? goalsByMatch.reduce((a, c) => a + c, 0)
      : (goalsByMatch[sessoesOrdenadas.findIndex((s) => s.id === state.dashSessao)] ?? 0);
    const selSessao = sessoesOrdenadas.find((s) => s.id === state.dashSessao);
    const selLabel = state.dashSessao === 'all' ? 'na temporada' : `em ${selSessao?.label ?? ''}`;
    const sessaoOptionsList = sessoesOrdenadas.map((s) => ({ id: s.id, label: s.label }));

    return { goalOrigin, heatCells, chartPath, chartPoints, totalGoalsSel, selLabel, sessaoOptionsList };
  }, [state.eventos, state.sessoes, state.dashPlayer, state.dashSessao]);
}

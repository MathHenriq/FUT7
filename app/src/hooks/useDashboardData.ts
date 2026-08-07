import { useMemo } from 'react';
import { useApp } from '../store';
import {
  goalOriginBaseline, heatColor, heatmapBaseline, historicalGoalsByMatch,
  LIVE_MATCH_INDEX, matches, originOptions, zoneLabels,
} from '../data';

const CHART_W = 560;
const CHART_H = 200;
const PAD_X = 34;
const PAD_Y = 22;
const BASE_MAX_VAL = 4;

export function useDashboardData() {
  const { state } = useApp();

  return useMemo(() => {
    const liveByOrigin: Record<string, number> = {};
    const liveByZone = new Array(zoneLabels.length).fill(0);
    for (const g of state.goals) {
      liveByOrigin[g.origin] = (liveByOrigin[g.origin] ?? 0) + 1;
      if (g.zone >= 0 && g.zone < liveByZone.length) liveByZone[g.zone] += 1;
    }

    const originCounts = originOptions.map((o) => ({
      label: o.label,
      count: (goalOriginBaseline[o.key] ?? 0) + (liveByOrigin[o.key] ?? 0),
    }));
    const originTotal = originCounts.reduce((a, c) => a + c.count, 0);
    const goalOrigin = originCounts.map((o) => ({
      label: o.label,
      count: o.count,
      pct: originTotal > 0 ? Math.round((o.count / originTotal) * 100) : 0,
    }));

    const heatmapValues = heatmapBaseline.map((v, i) => v + liveByZone[i]);
    const maxHeat = Math.max(...heatmapValues, 1);
    const heatCells = heatmapValues.map((v, i) => ({
      value: v, label: zoneLabels[i], bg: heatColor(v, maxHeat),
    }));

    const player = state.dashPlayer;
    const historical = historicalGoalsByMatch[player] ?? new Array(LIVE_MATCH_INDEX).fill(0);
    const liveCount = state.goals.filter((g) => g.scorer === player && g.matchIndex === LIVE_MATCH_INDEX).length;
    const goalsByMatch = [...historical, liveCount];

    const maxVal = Math.max(BASE_MAX_VAL, ...goalsByMatch);
    const n = goalsByMatch.length;
    const chartPoints = goalsByMatch.map((v, i) => {
      const highlighted = state.dashMatch !== 'all' && Number(state.dashMatch) === i;
      return {
        x: PAD_X + (i * (CHART_W - 2 * PAD_X)) / (n - 1),
        y: CHART_H - PAD_Y - (v / maxVal) * (CHART_H - 2 * PAD_Y),
        r: highlighted ? 6 : 4,
        fill: highlighted ? '#f5a623' : '#4f8ef7',
      };
    });
    const chartPath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const totalGoalsSel = state.dashMatch === 'all'
      ? goalsByMatch.reduce((a, c) => a + c, 0)
      : (goalsByMatch[Number(state.dashMatch)] ?? 0);
    const selLabel = state.dashMatch === 'all' ? 'na temporada' : `em ${matches[Number(state.dashMatch)]}`;
    const matchOptionsList = matches.map((label, idx) => ({ idx, label }));

    return { goalOrigin, heatCells, chartPath, chartPoints, totalGoalsSel, selLabel, matchOptionsList };
  }, [state.goals, state.dashPlayer, state.dashMatch]);
}

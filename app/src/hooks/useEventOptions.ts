import { useMemo } from 'react';
import {
  cardColors, detailOptions, fieldPlayers, originOptions,
  resultadoOptions, squad, zoneLabels,
} from '../data';
import type { FlowData, StepName } from '../types';
import type { FlowOption } from '../components/OptionPickers';

export function useEventOptions(data: FlowData, select: (step: StepName, value: string | number) => void) {
  return useMemo(() => {
    const zoneItems: FlowOption[] = zoneLabels.map((label, i) => ({
      key: `z${i}`, label, selected: data.zone === i, onClick: () => select('zone', i),
    }));

    const detailItems: FlowOption[] = detailOptions.map((d) => ({
      key: d.key, label: d.label, selected: data.detail === d.key, onClick: () => select('detail', d.key),
    }));

    const originItems: FlowOption[] = originOptions.map((o) => ({
      key: o.key, label: o.label, selected: data.origin === o.key, onClick: () => select('origin', o.key),
    }));

    const scorerItems: FlowOption[] = fieldPlayers.map((p) => ({
      key: p, label: p, selected: data.scorer === p, onClick: () => select('scorer', p),
    }));

    const assistItems: FlowOption[] = fieldPlayers
      .filter((p) => p !== data.scorer)
      .map((p): FlowOption => ({ key: p, label: p, selected: data.assist === p, onClick: () => select('assist', p) }))
      .concat([{ key: 'none', label: 'Sem assistência', selected: data.assist === 'none', warn: true, onClick: () => select('assist', 'none') }]);

    const cardColorItems: FlowOption[] = cardColors.map((c) => ({
      key: c.key, label: c.label, selected: data.cardColor === c.key,
      dot: c.key === 'amarelo' ? '#f2c94c' : '#e15554', onClick: () => select('cardColor', c.key),
    }));

    const playerItems: FlowOption[] = squad.map((p) => ({
      key: p, label: p, selected: data.player === p, onClick: () => select('player', p),
    }));

    const resultadoItems: FlowOption[] = resultadoOptions.map((r) => ({
      key: r.key, label: r.label, selected: data.resultado === r.key, warn: r.key === 'errado', onClick: () => select('resultado', r.key),
    }));

    return { zoneItems, detailItems, originItems, scorerItems, assistItems, cardColorItems, playerItems, resultadoItems };
  }, [data, select]);
}

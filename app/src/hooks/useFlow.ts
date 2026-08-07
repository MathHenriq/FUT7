import { useMemo } from 'react';
import { useApp } from '../store';
import {
  cardColors, detailOptions, eventTypesMeta, fieldPlayers, originOptions,
  resultadoOptions, squad, stepSeq, zoneLabels,
} from '../data';
import type { Branch, EventTypeKey, StepName } from '../types';

export interface FlowOption {
  key: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  dot?: string;
}

export function useFlow(branch: Branch) {
  const { state, dispatch } = useApp();
  const flow = state[branch];

  return useMemo(() => {
    const active = !!flow.eventType;
    const saved = flow.stepIndex === 'saved';
    const idle = !active;
    const flowActive = active && !saved;
    const seq = active ? stepSeq[flow.eventType!] : [];
    const currentStep: StepName | null = flowActive ? seq[flow.stepIndex as number] : null;

    const select = (step: StepName, value: string | number) =>
      dispatch({ type: 'SELECT_STEP', branch, step, value });

    const zoneItems: FlowOption[] = zoneLabels.map((label, i) => ({
      key: `z${i}`, label, selected: flow.data.zone === i, onClick: () => select('zone', i),
    }));

    const detailItems: FlowOption[] = detailOptions.map((d) => ({
      key: d.key, label: d.label, selected: flow.data.detail === d.key, onClick: () => select('detail', d.key),
    }));

    const originItems: FlowOption[] = originOptions.map((o) => ({
      key: o.key, label: o.label, selected: flow.data.origin === o.key, onClick: () => select('origin', o.key),
    }));

    const scorerItems: FlowOption[] = fieldPlayers.map((p) => ({
      key: p, label: p, selected: flow.data.scorer === p, onClick: () => select('scorer', p),
    }));

    const assistItems: FlowOption[] = fieldPlayers
      .filter((p) => p !== flow.data.scorer)
      .map((p) => ({ key: p, label: p, selected: flow.data.assist === p, onClick: () => select('assist', p) }))
      .concat([{ key: 'none', label: 'Sem assistência', selected: flow.data.assist === 'none', onClick: () => select('assist', 'none') }]);

    const cardColorItems: FlowOption[] = cardColors.map((c) => ({
      key: c.key, label: c.label, selected: flow.data.cardColor === c.key,
      dot: c.key === 'amarelo' ? '#f2c94c' : '#e15554', onClick: () => select('cardColor', c.key),
    }));

    const playerItems: FlowOption[] = squad.map((p) => ({
      key: p, label: p, selected: flow.data.player === p, onClick: () => select('player', p),
    }));

    const resultadoItems: FlowOption[] = resultadoOptions.map((r) => ({
      key: r.key, label: r.label, selected: flow.data.resultado === r.key, onClick: () => select('resultado', r.key),
    }));

    const meta = active ? eventTypesMeta.find((m) => m.key === flow.eventType) ?? null : null;

    return {
      flow, active, idle, saved, flowActive, currentStep,
      stepDisplay: flowActive ? `${seq.indexOf(currentStep!) + 1} / ${seq.length}` : '',
      eventTypeLabel: meta ? meta.label : '',
      zoneItems, detailItems, originItems, scorerItems, assistItems, cardColorItems, playerItems, resultadoItems,
      onBack: () => dispatch({ type: 'GO_BACK', branch }),
      onNew: () => dispatch({ type: 'NEW_ENTRY', branch }),
      onStart: (eventType: EventTypeKey) => dispatch({ type: 'START_EVENT', branch, eventType }),
    };
  }, [flow, branch, dispatch]);
}

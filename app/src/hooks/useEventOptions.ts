import { useMemo } from 'react';
import {
  cardColors, detailOptions, localPresets, originOptions, resultadoFinOptions, resultadoOptions,
} from '../data';
import type { FlowData, Jogador, StepName } from '../types';
import type { FlowOption } from '../components/OptionPickers';

export function useEventOptions(
  data: FlowData,
  jogadores: Jogador[],
  select: (step: StepName, value: string | number) => void,
) {
  return useMemo(() => {
    // The keeper stays eligible to score and to assist: on a small pitch a punt that
    // launches the counter is a routine assist, and keeper goals do happen.
    const ativos = jogadores.filter((j) => j.ativo);

    const localItems: FlowOption[] = localPresets.map((p) => ({
      key: p.key,
      label: p.label,
      selected: data.x === p.x && data.y === p.y,
      onClick: () => select('local', p.key),
    }));

    const resultadoFinItems: FlowOption[] = resultadoFinOptions.map((r) => ({
      key: r.key,
      label: r.label,
      selected: data.resultadoFin === r.key,
      warn: r.key !== 'gol',
      onClick: () => select('resultadoFin', r.key),
    }));

    const detailItems: FlowOption[] = detailOptions.map((d) => ({
      key: d.key, label: d.label, selected: data.detail === d.key, onClick: () => select('detail', d.key),
    }));

    const originItems: FlowOption[] = originOptions.map((o) => ({
      key: o.key, label: o.label, selected: data.origin === o.key, onClick: () => select('origin', o.key),
    }));

    const scorerItems: FlowOption[] = ativos.map((p) => ({
      key: p.id, label: p.nome, selected: data.scorerId === p.id, onClick: () => select('scorer', p.id),
    }));

    const assistItems: FlowOption[] = ativos
      .filter((p) => p.id !== data.scorerId)
      .map((p): FlowOption => ({ key: p.id, label: p.nome, selected: data.assistId === p.id, onClick: () => select('assist', p.id) }))
      .concat([{ key: 'none', label: 'Sem assistência', selected: data.assistId === 'none', warn: true, onClick: () => select('assist', 'none') }]);

    const cardColorItems: FlowOption[] = cardColors.map((c) => ({
      key: c.key, label: c.label, selected: data.cardColor === c.key,
      dot: c.key === 'amarelo' ? '#f2c94c' : '#e15554', onClick: () => select('cardColor', c.key),
    }));

    const playerItems: FlowOption[] = ativos.map((p) => ({
      key: p.id, label: p.nome, selected: data.playerId === p.id, onClick: () => select('player', p.id),
    }));

    const resultadoItems: FlowOption[] = resultadoOptions.map((r) => ({
      key: r.key, label: r.label, selected: data.resultado === r.key, warn: r.key === 'errado', onClick: () => select('resultado', r.key),
    }));

    return {
      localItems, resultadoFinItems, detailItems, originItems,
      scorerItems, assistItems, cardColorItems, playerItems, resultadoItems,
    };
  }, [data, jogadores, select]);
}

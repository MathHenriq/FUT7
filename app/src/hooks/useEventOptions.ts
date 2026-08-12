import { colors } from '../colors';
import { useMemo } from 'react';
import {
  cardColors, comoPerdeuOptions, comoRecuperouOptions, detailOptions, faltaTipoOptions,
  originOptions, resultadoFinOptions, resultadoOptions,
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
      dot: c.key === 'amarelo' ? colors.cartaoAmarelo : colors.cartaoVermelho, onClick: () => select('cardColor', c.key),
    }));

    const playerItems: FlowOption[] = ativos.map((p) => ({
      key: p.id, label: p.nome, selected: data.playerId === p.id, onClick: () => select('player', p.id),
    }));

    const resultadoItems: FlowOption[] = resultadoOptions.map((r) => ({
      key: r.key, label: r.label, selected: data.resultado === r.key, warn: r.key === 'errado', onClick: () => select('resultado', r.key),
    }));

    // Falls back to the whole squad when nobody is flagged as keeper, so the step
    // never dead-ends on an incomplete roster.
    const goleiros = ativos.filter((j) => j.posicao === 'goleiro');
    const goleiroItems: FlowOption[] = (goleiros.length > 0 ? goleiros : ativos).map((p) => ({
      key: p.id, label: p.nome, selected: data.goleiroId === p.id, onClick: () => select('goleiro', p.id),
    }));

    const comoPerdeuItems: FlowOption[] = comoPerdeuOptions.map((o) => ({
      key: o.key, label: o.label, selected: data.comoPerdeu === o.key, warn: true, onClick: () => select('comoPerdeu', o.key),
    }));

    const comoRecuperouItems: FlowOption[] = comoRecuperouOptions.map((o) => ({
      key: o.key, label: o.label, selected: data.comoRecuperou === o.key, onClick: () => select('comoRecuperou', o.key),
    }));

    const faltaTipoItems: FlowOption[] = faltaTipoOptions.map((o) => ({
      key: o.key, label: o.label, selected: data.faltaTipo === o.key,
      warn: o.key === 'cometida', onClick: () => select('faltaTipo', o.key),
    }));

    return {
      resultadoFinItems, detailItems, originItems,
      scorerItems, assistItems, goleiroItems, cardColorItems, playerItems, resultadoItems,
      comoPerdeuItems, comoRecuperouItems, faltaTipoItems,
    };
  }, [data, jogadores, select]);
}

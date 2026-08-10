import { useMemo, useState } from 'react';
import { colors, fontDisplay } from '../colors';
import { curtoPosicao, ehGol } from '../data';
import { useApp } from '../store';
import type { Jogador, MetricaFisica, TipoExercicio } from '../types';

export const tiposExercicio: { key: TipoExercicio; label: string }[] = [
  { key: 'aquecimento', label: 'Aquecimento' },
  { key: 'tecnico', label: 'Técnico' },
  { key: 'tatico', label: 'Tático' },
  { key: 'fisico', label: 'Físico' },
  { key: 'finalizacao', label: 'Finalização' },
  { key: 'jogo-treino', label: 'Jogo-treino' },
];

interface BarProps {
  sessaoId: string;
  ativoId: string | null;
  onSelecionar: (id: string | null) => void;
}

/** The active drill stamps every event tagged while it is selected. */
export function ExerciciosBar({ sessaoId, ativoId, onSelecionar }: BarProps) {
  const { state, addExercicio, deleteExercicio } = useApp();
  const [abrindo, setAbrindo] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoExercicio>('tecnico');
  const [duracao, setDuracao] = useState('');

  const exercicios = state.exercicios
    .filter((x) => x.sessaoId === sessaoId)
    .sort((a, b) => a.ordem - b.ordem);

  // Names already used in past sessions, so a weekly drill is not retyped every time.
  const sugestoes = useMemo(
    () => Array.from(new Set(state.exercicios.map((x) => x.nome))).sort(),
    [state.exercicios],
  );

  const contagem = (exercicioId: string) => state.eventos.filter((e) => e.exercicioId === exercicioId).length;

  function criar() {
    const n = nome.trim();
    if (!n) return;
    const id = addExercicio({
      sessaoId, nome: n, tipo,
      duracaoMin: duracao.trim() === '' ? undefined : Number(duracao),
    });
    onSelecionar(id);
    setNome('');
    setDuracao('');
    setAbrindo(false);
  }

  function remover(id: string, nomeExe: string) {
    const n = contagem(id);
    const aviso = n > 0
      ? `"${nomeExe}" tem ${n} evento(s). Eles continuam na sessão, mas deixam de pertencer a um exercício. Remover?`
      : `Remover "${nomeExe}"?`;
    if (!window.confirm(aviso)) return;
    if (ativoId === id) onSelecionar(null);
    deleteExercicio(id);
  }

  const input = {
    background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`,
    borderRadius: 8, padding: '9px 11px', fontSize: 13,
  } as const;

  return (
    <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, letterSpacing: 0.4 }}>EXERCÍCIO ATIVO</div>
        <div style={{ fontSize: 11, color: colors.mutedDark }}>
          {ativoId ? 'os próximos registros entram nele' : 'sem exercício — os registros ficam soltos na sessão'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div
          onClick={() => onSelecionar(null)}
          style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: ativoId === null ? colors.blueSofter : colors.chipBg,
            border: `1px solid ${ativoId === null ? colors.blue : colors.chipBorder}`,
            color: ativoId === null ? colors.text : colors.muted,
          }}
        >
          Sessão inteira
        </div>
        {exercicios.map((x) => {
          const on = ativoId === x.id;
          return (
            <div
              key={x.id}
              onClick={() => onSelecionar(x.id)}
              style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: on ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${on ? colors.blue : colors.chipBorder}`,
                color: on ? colors.text : colors.muted,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span>{x.nome}</span>
              <span style={{ fontSize: 10, color: colors.mutedDark }}>
                {tiposExercicio.find((t) => t.key === x.tipo)?.label}
                {x.duracaoMin ? ` · ${x.duracaoMin}min` : ''} · {contagem(x.id)}
              </span>
              <span
                onClick={(e) => { e.stopPropagation(); remover(x.id, x.nome); }}
                style={{ color: colors.gold, fontWeight: 700, cursor: 'pointer' }}
              >
                ×
              </span>
            </div>
          );
        })}
        <div
          onClick={() => setAbrindo((o) => !o)}
          style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: colors.chipBg, border: `1px dashed ${colors.borderStrong}`, color: colors.blue,
          }}
        >
          {abrindo ? 'Cancelar' : '+ Exercício'}
        </div>
      </div>

      {abrindo && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') criar(); }}
            placeholder="Nome do exercício"
            list="exercicios-sugeridos"
            autoFocus
            style={{ ...input, flex: 1, minWidth: 180 }}
          />
          <datalist id="exercicios-sugeridos">
            {sugestoes.map((s) => <option key={s} value={s} />)}
          </datalist>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoExercicio)} style={{ ...input, fontWeight: 600 }}>
            {tiposExercicio.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <input
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') criar(); }}
            placeholder="min"
            type="number"
            style={{ ...input, width: 76 }}
          />
          <div onClick={criar} style={{ padding: '9px 16px', background: colors.blue, color: '#0a0e13', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            Adicionar
          </div>
        </div>
      )}
    </div>
  );
}

/** Manual entry today; a GPS import fills the exact same fields later, which is why
 *  each row carries its own origin. */
export function MetricasFisicas({ sessaoId, jogadores }: { sessaoId: string; jogadores: Jogador[] }) {
  const { state, setMetrica } = useApp();
  const [aberto, setAberto] = useState(false);

  const porJogador = useMemo(() => {
    const m = new Map<string, MetricaFisica>();
    for (const x of state.metricas) if (x.sessaoId === sessaoId) m.set(x.jogadorId, x);
    return m;
  }, [state.metricas, sessaoId]);

  function alterar(jogadorId: string, campo: 'velocidadeMaxKmh' | 'distanciaM' | 'sprints', valor: string) {
    const atual = porJogador.get(jogadorId);
    const num = valor.trim() === '' ? undefined : Number(valor);
    setMetrica({
      sessaoId,
      jogadorId,
      velocidadeMaxKmh: atual?.velocidadeMaxKmh,
      distanciaM: atual?.distanciaM,
      sprints: atual?.sprints,
      [campo]: Number.isFinite(num as number) ? num : undefined,
      origem: 'manual',
    });
  }

  const preenchidas = jogadores.filter((j) => {
    const m = porJogador.get(j.id);
    return m && (m.velocidadeMaxKmh !== undefined || m.distanciaM !== undefined || m.sprints !== undefined);
  }).length;

  const cell = {
    background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`,
    borderRadius: 6, padding: '6px 8px', fontSize: 13, width: 84, fontFamily: fontDisplay, fontWeight: 700,
  } as const;

  return (
    <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}>
      <div
        onClick={() => setAberto((o) => !o)}
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, cursor: 'pointer', flexWrap: 'wrap' }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, letterSpacing: 0.4 }}>FÍSICO</div>
        <div style={{ fontSize: 11, color: colors.mutedDark }}>
          {preenchidas} de {jogadores.length} preenchidos
        </div>
        <div style={{ fontSize: 12, color: colors.blue, fontWeight: 600 }}>{aberto ? '▲' : '▼'}</div>
      </div>

      {aberto && (
        <>
          <div style={{ fontSize: 11, color: colors.mutedDark, margin: '10px 0 12px', lineHeight: 1.4 }}>
            Entrada manual — de relógio, GPS do celular no bolso, ou cronômetro. Velocidade por vídeo
            só sai confiável com câmera fixa e linhas do campo visíveis, então preferimos não estimar.
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 460 }}>
              <thead>
                <tr style={{ color: colors.muted, textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px 6px 0', fontWeight: 600 }}>Jogador</th>
                  <th style={{ padding: '6px 10px', fontWeight: 600 }}>Vel. máx (km/h)</th>
                  <th style={{ padding: '6px 10px', fontWeight: 600 }}>Distância (m)</th>
                  <th style={{ padding: '6px 10px', fontWeight: 600 }}>Sprints</th>
                </tr>
              </thead>
              <tbody>
                {jogadores.map((j) => {
                  const m = porJogador.get(j.id);
                  return (
                    <tr key={j.id} style={{ borderTop: `1px solid ${colors.rowBorder}` }}>
                      <td style={{ padding: '7px 10px 7px 0', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600 }}>{j.nome}</span>
                        <span style={{ color: colors.mutedDark, marginLeft: 6, fontSize: 10 }}>{curtoPosicao(j.posicao)}</span>
                      </td>
                      <td style={{ padding: '5px 10px' }}>
                        <input type="number" step="0.1" style={cell} value={m?.velocidadeMaxKmh ?? ''}
                          onChange={(e) => alterar(j.id, 'velocidadeMaxKmh', e.target.value)} />
                      </td>
                      <td style={{ padding: '5px 10px' }}>
                        <input type="number" style={cell} value={m?.distanciaM ?? ''}
                          onChange={(e) => alterar(j.id, 'distanciaM', e.target.value)} />
                      </td>
                      <td style={{ padding: '5px 10px' }}>
                        <input type="number" style={cell} value={m?.sprints ?? ''}
                          onChange={(e) => alterar(j.id, 'sprints', e.target.value)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** Per-drill readout: what each block actually produced. */
export function ResumoExercicios({ sessaoId }: { sessaoId: string }) {
  const { state } = useApp();
  const exercicios = state.exercicios.filter((x) => x.sessaoId === sessaoId).sort((a, b) => a.ordem - b.ordem);
  if (exercicios.length === 0) return null;

  const linhas = exercicios.map((x) => {
    const evs = state.eventos.filter((e) => e.exercicioId === x.id);
    const fins = evs.filter((e) => e.tipo === 'finalizacao');
    const gols = fins.filter(ehGol).length;
    const passes = evs.filter((e) => e.tipo === 'passe');
    const passesCertos = passes.filter((e) => e.data.resultado === 'certo').length;
    return {
      x,
      total: evs.length,
      fins: fins.length,
      gols,
      conversao: fins.length > 0 ? Math.round((gols / fins.length) * 100) : null,
      precisao: passes.length > 0 ? Math.round((passesCertos / passes.length) * 100) : null,
      passes: passes.length,
    };
  });

  return (
    <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, letterSpacing: 0.4, marginBottom: 10 }}>
        RESUMO POR EXERCÍCIO
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', minWidth: 460 }}>
          <thead>
            <tr style={{ color: colors.muted, textAlign: 'left' }}>
              <th style={{ padding: '6px 10px 6px 0', fontWeight: 600 }}>Exercício</th>
              <th style={{ padding: '6px 10px', fontWeight: 600 }}>Eventos</th>
              <th style={{ padding: '6px 10px', fontWeight: 600 }}>Finalizações</th>
              <th style={{ padding: '6px 10px', fontWeight: 600 }}>Conversão</th>
              <th style={{ padding: '6px 10px', fontWeight: 600 }}>Passe certo</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.x.id} style={{ borderTop: `1px solid ${colors.rowBorder}` }}>
                <td style={{ padding: '8px 10px 8px 0' }}>
                  <span style={{ fontWeight: 600 }}>{l.x.nome}</span>
                  <span style={{ color: colors.mutedDark, marginLeft: 6, fontSize: 10 }}>
                    {tiposExercicio.find((t) => t.key === l.x.tipo)?.label}
                  </span>
                </td>
                <td style={{ padding: '8px 10px', fontFamily: fontDisplay, fontWeight: 700, fontSize: 15 }}>{l.total}</td>
                <td style={{ padding: '8px 10px' }}>{l.fins} <span style={{ color: colors.mutedDark }}>({l.gols} gols)</span></td>
                <td style={{ padding: '8px 10px', color: l.conversao === null ? colors.mutedDark : colors.text }}>
                  {l.conversao === null ? '—' : `${l.conversao}%`}
                </td>
                <td style={{ padding: '8px 10px', color: l.precisao === null ? colors.mutedDark : colors.text }}>
                  {l.precisao === null ? '—' : `${l.precisao}%`}
                  {l.passes > 0 && <span style={{ color: colors.mutedDark }}> ({l.passes})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

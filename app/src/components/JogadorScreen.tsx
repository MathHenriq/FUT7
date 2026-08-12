import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fontDisplay } from '../colors';
import { heatColor, labelPosicao, setorIndex, setorLabels } from '../data';
import GraficoLinha from './GraficoLinha';
import { metricasDef, useJogadorStats, type MetricaKey } from '../hooks/useJogadorStats';
import { useApp } from '../store';

const destaques: MetricaKey[] = ['gols', 'assistencias', 'conversao', 'precisaoPasse', 'saldoBola', 'velocidadeMax'];

export default function JogadorScreen() {
  const { jogadorId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const jogador = state.jogadores.find((j) => j.id === jogadorId);
  const stats = useJogadorStats(jogadorId ?? '');
  const [metrica, setMetrica] = useState<MetricaKey>('gols');
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'partida' | 'treino'>('todas');

  const def = metricasDef.find((m) => m.key === metrica)!;

  const pontosFiltrados = useMemo(
    () => stats.pontos.filter((p) => filtroTipo === 'todas' || p.tipoSessao === filtroTipo),
    [stats.pontos, filtroTipo],
  );

  const heat = useMemo(() => {
    const labels = setorLabels(state.config.gradeZonas);
    const counts = new Array(labels.length).fill(0) as number[];
    for (const f of stats.finalizacoes) {
      if (f.data.x === undefined || f.data.y === undefined) continue;
      counts[setorIndex(f.data.x, f.data.y, state.config.gradeZonas)] += 1;
    }
    const max = Math.max(...counts, 1);
    return counts.map((v, i) => ({ v, label: labels[i], bg: heatColor(v, max) }));
  }, [stats.finalizacoes, state.config.gradeZonas]);

  if (!jogador) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ fontSize: 14, color: colors.muted }}>Jogador não encontrado.</div>
        <div onClick={() => navigate('/elenco')} style={{ marginTop: 12, color: colors.blue, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>‹ Voltar para Jogadores</div>
      </div>
    );
  }

  const serie = pontosFiltrados.map((p) => ({
    label: p.label,
    valor: p.valores[metrica],
    sub: p.data,
  }));

  const corSerie = metrica === 'perdas' || metrica === 'faltas' ? colors.gold : colors.blue;

  return (
    <div style={{ padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1180, margin: '0 auto' }}>
      <div onClick={() => navigate('/elenco')} style={{ fontSize: 12, color: colors.muted, cursor: 'pointer' }}>‹ Jogadores</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, background: colors.blueSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fontDisplay, fontSize: 26, fontWeight: 800, color: colors.blue,
        }}>
          {jogador.numero ?? '—'}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{jogador.nome}</div>
          <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2 }}>
            {labelPosicao(jogador.posicao)} · {stats.partidas} partida{stats.partidas === 1 ? '' : 's'} · {stats.treinos} treino{stats.treinos === 1 ? '' : 's'}
            {!jogador.ativo && ' · inativo'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        {destaques.map((k) => {
          const d = metricasDef.find((m) => m.key === k)!;
          const v = stats.agregar(k);
          return (
            <div key={k} style={{ background: colors.cardBgDense, border: `1px solid ${colors.borderAlt}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: colors.muted, fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 800 }}>
                {v === null ? '—' : `${v.toFixed(d.decimais ?? 0)}${d.sufixo ?? ''}`}
              </div>
              <div style={{ fontSize: 10, color: colors.mutedDark, marginTop: 2 }}>
                {d.agregacao === 'soma' ? 'total' : d.agregacao === 'media' ? 'média por sessão' : 'recorde'}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Evolução</div>
            <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2 }}>
              {def.label} · {pontosFiltrados.length} sessão(ões)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {([['todas', 'Todas'], ['partida', 'Partidas'], ['treino', 'Treinos']] as const).map(([k, l]) => (
              <div key={k} onClick={() => setFiltroTipo(k)} style={{
                padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: filtroTipo === k ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${filtroTipo === k ? colors.blue : colors.chipBorder}`,
                color: filtroTipo === k ? colors.text : colors.muted,
              }}>
                {l}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {metricasDef.map((m) => (
            <div key={m.key} onClick={() => setMetrica(m.key)} style={{
              padding: '6px 12px', borderRadius: 18, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: metrica === m.key ? colors.blue : colors.chipBg,
              border: `1px solid ${metrica === m.key ? colors.blue : colors.chipBorder}`,
              color: metrica === m.key ? '#0a0e13' : colors.muted,
            }}>
              {m.label}
            </div>
          ))}
        </div>

        <GraficoLinha
          pontos={serie}
          cor={corSerie}
          sufixo={def.sufixo ?? ''}
          decimais={def.decimais ?? 0}
          baseZero={def.key !== 'velocidadeMax'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>De onde finaliza</div>
          <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2, marginBottom: 14 }}>
            {stats.finalizacoes.length} finalizações · ataque no topo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, maxWidth: 260 }}>
            {heat.map((h, i) => (
              <div key={i} title={h.label} style={{
                aspectRatio: '1', borderRadius: 7, background: h.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 800, color: '#fff' }}>{h.v}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: colors.mutedDark, marginTop: 10 }}>
            Grade de {state.config.gradeZonas} · muda em Campo
          </div>
        </div>

        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Sessão a sessão</div>
          {pontosFiltrados.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.mutedDark }}>Nenhuma sessão registrada.</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: 320 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', minWidth: 380 }}>
                <thead>
                  <tr style={{ color: colors.muted, textAlign: 'left' }}>
                    <th style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>Sessão</th>
                    <th style={{ padding: '5px 8px', fontWeight: 600 }}>G</th>
                    <th style={{ padding: '5px 8px', fontWeight: 600 }}>A</th>
                    <th style={{ padding: '5px 8px', fontWeight: 600 }}>Fin.</th>
                    <th style={{ padding: '5px 8px', fontWeight: 600 }}>Saldo</th>
                    <th style={{ padding: '5px 8px', fontWeight: 600 }}>Vel.</th>
                  </tr>
                </thead>
                <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {[...pontosFiltrados].reverse().map((p) => (
                    <tr key={p.sessaoId} style={{ borderTop: `1px solid ${colors.rowBorder}` }}>
                      <td style={{ padding: '7px 8px 7px 0' }}>
                        <span style={{ fontWeight: 600 }}>{p.label}</span>
                        <span style={{ color: colors.mutedDark, marginLeft: 6, fontSize: 10 }}>{p.data}</span>
                      </td>
                      <td style={{ padding: '7px 8px' }}>{p.valores.gols}</td>
                      <td style={{ padding: '7px 8px' }}>{p.valores.assistencias}</td>
                      <td style={{ padding: '7px 8px' }}>{p.valores.finalizacoes}</td>
                      <td style={{ padding: '7px 8px', color: (p.valores.saldoBola ?? 0) < 0 ? colors.gold : colors.text }}>
                        {(p.valores.saldoBola ?? 0) > 0 ? '+' : ''}{p.valores.saldoBola}
                      </td>
                      <td style={{ padding: '7px 8px', color: p.valores.velocidadeMax === null ? colors.mutedDark : colors.text }}>
                        {p.valores.velocidadeMax === null ? '—' : p.valores.velocidadeMax.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

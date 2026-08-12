import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontDisplay } from '../colors';
import { curtoPosicao, placarDaSessao } from '../data';
import { useApp } from '../store';
import type { ModoRegistro, TipoSessao } from '../types';

export default function SessoesScreen() {
  const { state, createSessao } = useApp();
  const navigate = useNavigate();
  const ativos = state.jogadores.filter((j) => j.ativo);

  const [open, setOpen] = useState(false);
  const [tipoSessao, setTipoSessao] = useState<TipoSessao>('partida');
  const [label, setLabel] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [modoRegistro, setModoRegistro] = useState<ModoRegistro>('ao-vivo');
  const [escalacao, setEscalacao] = useState<string[]>(() => ativos.map((j) => j.id));
  const meuTimeId = state.config.meuTimeId ?? state.times.find((t) => t.ehMeuTime)?.id ?? '';
  const outros = state.times.filter((t) => !t.ehMeuTime);
  const [timeAId, setTimeAId] = useState<string>(outros[0]?.id ?? '');
  const [timeBId, setTimeBId] = useState<string>(outros[1]?.id ?? '');
  const [jogadorFocoId, setJogadorFocoId] = useState<string>('');
  const ehObservacao = tipoSessao === 'observacao';
  const focoCandidatos = state.jogadores.filter((j) => j.timeId === timeAId || j.timeId === timeBId);

  const sessoes = [...state.sessoes].sort((a, b) => b.createdAt - a.createdAt);
  const eventosPorSessao = (id: string) => state.eventos.filter((e) => e.sessaoId === id).length;

  function toggleEscalado(id: string) {
    setEscalacao((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  function handleCreate() {
    const padrao = tipoSessao === 'partida' ? 'Partida sem nome'
      : tipoSessao === 'treino' ? 'Treino sem nome' : 'Observação sem nome';
    const finalLabel = label.trim() || padrao;
    const id = createSessao({
      tipoSessao, label: finalLabel, modoRegistro, data,
      escalacao: ehObservacao ? [] : escalacao,
      timeAId: ehObservacao ? timeAId || undefined : meuTimeId,
      timeBId: ehObservacao ? timeBId || undefined : undefined,
      jogadorFocoId: ehObservacao ? jogadorFocoId || undefined : undefined,
    });
    navigate(`/registro/${id}`);
  }

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Sessões</div>
        <div onClick={() => setOpen((o) => !o)} style={{ padding: '10px 18px', background: colors.blue, color: colors.onBlue, borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {open ? 'Cancelar' : '+ Nova sessão'}
        </div>
      </div>

      {open && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 3, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['partida', 'treino', 'observacao'] as TipoSessao[]).map((t) => (
              <div key={t} onClick={() => setTipoSessao(t)} style={{
                padding: '10px 18px', borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: tipoSessao === t ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${tipoSessao === t ? colors.blue : colors.chipBorder}`,
              }}>
                {t === 'partida' ? 'Partida' : t === 'treino' ? 'Treino' : 'Observação'}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>
                {ehObservacao ? 'NOME DA PARTIDA' : 'NOME / ADVERSÁRIO'}
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={tipoSessao === 'partida' ? 'vs Falcões' : tipoSessao === 'treino' ? 'Treino técnico' : 'Santos x Palmeiras'}
                style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 3, padding: '10px 12px', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>DATA</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 3, padding: '10px 12px', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>COMO VAI REGISTRAR</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}>
              {([
                { v: 'ao-vivo' as ModoRegistro, l: 'Ao vivo', d: 'Na beira do campo, marcando pelo cronômetro da partida.', pronto: true },
                { v: 'video' as ModoRegistro, l: 'Vídeo (retroativo)', d: 'Sobe a gravação e marca depois, com o vídeo na tela.', pronto: true },
                { v: 'ia' as ModoRegistro, l: 'IA assistente', d: 'A IA propõe os lances da gravação e você confirma.', pronto: false },
              ]).map((o) => (
                <div
                  key={o.v}
                  onClick={() => { if (o.pronto) setModoRegistro(o.v); }}
                  style={{
                    padding: '12px 14px', borderRadius: 3, cursor: o.pronto ? 'pointer' : 'not-allowed',
                    background: modoRegistro === o.v ? colors.blueSofter : colors.chipBg,
                    border: `1px solid ${modoRegistro === o.v ? colors.blue : colors.chipBorder}`,
                    opacity: o.pronto ? 1 : 0.45,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {o.l}
                    {!o.pronto && (
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: colors.goldSoft, color: colors.gold }}>
                        EM BREVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: colors.mutedDark, marginTop: 4, lineHeight: 1.35 }}>{o.d}</div>
                </div>
              ))}
            </div>
          </div>

          {ehObservacao ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>QUEM JOGA</div>
              {outros.length < 1 ? (
                <div style={{ fontSize: 13, color: colors.mutedDark }}>
                  Cadastre os clubes primeiro em{' '}
                  <span onClick={() => navigate('/elenco')} style={{ color: colors.blue, cursor: 'pointer' }}>Jogadores</span>.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={timeAId} onChange={(e) => setTimeAId(e.target.value)} style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 3, padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>
                      <option value="">Time A</option>
                      {outros.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                    <span style={{ color: colors.mutedDark, fontSize: 13 }}>×</span>
                    <select value={timeBId} onChange={(e) => setTimeBId(e.target.value)} style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 3, padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>
                      <option value="">Time B</option>
                      {outros.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>JOGADOR OBSERVADO</label>
                    <select value={jogadorFocoId} onChange={(e) => setJogadorFocoId(e.target.value)} style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 3, padding: '10px 12px', fontSize: 13, fontWeight: 600, maxWidth: 320 }}>
                      <option value="">Nenhum — marcar o jogo inteiro</option>
                      {focoCandidatos.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.numero !== undefined ? `${j.numero} · ` : ''}{j.nome}
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: colors.mutedDark, lineHeight: 1.45, maxWidth: 460 }}>
                      Com um jogador escolhido, a marcação foca nele — é assim que o olheiro trabalha,
                      e o registro fica muito mais rápido do que tentar cobrir vinte e dois.
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <label style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>QUEM JOGOU</label>
              <span style={{ fontSize: 11, color: colors.mutedDark }}>{escalacao.length} selecionados</span>
              <span onClick={() => setEscalacao(ativos.map((j) => j.id))} style={{ fontSize: 11, color: colors.blue, cursor: 'pointer' }}>todos</span>
              <span onClick={() => setEscalacao([])} style={{ fontSize: 11, color: colors.blue, cursor: 'pointer' }}>nenhum</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ativos.map((j) => {
                const on = escalacao.includes(j.id);
                return (
                  <div key={j.id} onClick={() => toggleEscalado(j.id)} style={{
                    padding: '8px 12px', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: on ? colors.blueSofter : colors.chipBg,
                    border: `1px solid ${on ? colors.blue : colors.chipBorder}`,
                    color: on ? colors.text : colors.muted,
                  }}>
                    {j.numero !== undefined ? `${j.numero} · ` : ''}{j.nome}
                    <span style={{ color: colors.mutedDark, marginLeft: 6, fontSize: 11 }}>{curtoPosicao(j.posicao)}</span>
                  </div>
                );
              })}
              {ativos.length === 0 && (
                <div style={{ fontSize: 13, color: colors.mutedDark }}>
                  Nenhum jogador ativo. <span onClick={() => navigate('/elenco')} style={{ color: colors.blue, cursor: 'pointer' }}>Cadastrar elenco</span>
                </div>
              )}
            </div>
          </div>
          )}

          <div onClick={handleCreate} style={{ alignSelf: 'flex-start', padding: '10px 20px', background: colors.blue, color: colors.onBlue, borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Criar e começar a registrar
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sessoes.map((s) => (
          <div
            key={s.id}
            onClick={() => navigate(`/registro/${s.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, background: colors.cardBg, border: `1px solid ${colors.border}`,
              borderRadius: 3, padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap',
            }}
          >
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: '4px 8px', borderRadius: 3,
              background: s.tipoSessao === 'observacao' ? colors.goldSoft : colors.blueSoft,
              color: s.tipoSessao === 'observacao' ? colors.gold : colors.blue,
            }}>
              {s.tipoSessao === 'partida' ? 'PARTIDA' : s.tipoSessao === 'treino' ? 'TREINO' : 'OBSERVAÇÃO'}
            </div>
            <div style={{ flex: 1, minWidth: 160, fontSize: 14, fontWeight: 600 }}>{s.label}</div>
            {s.tipoSessao === 'partida' && (() => {
              const p = placarDaSessao(state.eventos, s.id);
              return <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 800 }}>{p.nos} — {p.adversario}</div>;
            })()}
            <div style={{ fontSize: 12, color: colors.mutedDark, minWidth: 90 }}>{s.data}</div>
            <div style={{ fontSize: 12, color: colors.mutedDark }}>
              {s.modoRegistro === 'video' ? (s.video ? 'vídeo anexado' : 'vídeo pendente') : s.modoRegistro === 'ia' ? 'IA' : 'ao vivo'}
            </div>
            <div style={{ fontSize: 12, color: colors.mutedDark }}>
              {s.tipoSessao === 'observacao'
                ? (s.jogadorFocoId
                  ? `foco: ${state.jogadores.find((j) => j.id === s.jogadorFocoId)?.nome ?? '—'}`
                  : 'jogo inteiro')
                : `${s.escalacao.length} jogadores`}
            </div>
            <div style={{ fontSize: 12, color: colors.muted }}>{eventosPorSessao(s.id)} eventos</div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontDisplay } from '../colors';
import { curtoPosicao, placarDaSessao } from '../data';
import { useApp } from '../store';
import type { TipoSessao } from '../types';

export default function SessoesScreen() {
  const { state, createSessao } = useApp();
  const navigate = useNavigate();
  const ativos = state.jogadores.filter((j) => j.ativo);

  const [open, setOpen] = useState(false);
  const [tipoSessao, setTipoSessao] = useState<TipoSessao>('partida');
  const [label, setLabel] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [comVideo, setComVideo] = useState(true);
  const [escalacao, setEscalacao] = useState<string[]>(() => ativos.map((j) => j.id));

  const sessoes = [...state.sessoes].sort((a, b) => b.createdAt - a.createdAt);
  const eventosPorSessao = (id: string) => state.eventos.filter((e) => e.sessaoId === id).length;

  function toggleEscalado(id: string) {
    setEscalacao((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  function handleCreate() {
    const finalLabel = label.trim() || (tipoSessao === 'partida' ? 'Partida sem nome' : 'Treino sem nome');
    const id = createSessao({ tipoSessao, label: finalLabel, comVideo, data, escalacao });
    navigate(`/registro/${id}`);
  }

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Sessões</div>
        <div onClick={() => setOpen((o) => !o)} style={{ padding: '10px 18px', background: colors.blue, color: '#0a0e13', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {open ? 'Cancelar' : '+ Nova sessão'}
        </div>
      </div>

      {open && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['partida', 'treino'] as TipoSessao[]).map((t) => (
              <div key={t} onClick={() => setTipoSessao(t)} style={{
                padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: tipoSessao === t ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${tipoSessao === t ? colors.blue : colors.chipBorder}`,
              }}>
                {t === 'partida' ? 'Partida' : 'Treino'}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>NOME / ADVERSÁRIO</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={tipoSessao === 'partida' ? 'vs Falcões' : 'Treino técnico'}
                style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: colors.muted, fontWeight: 600 }}>DATA</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                style={{ background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '10px 12px', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {[{ v: true, l: 'Com vídeo (ao vivo)' }, { v: false, l: 'Sem vídeo (retroativo)' }].map((o) => (
              <div key={String(o.v)} onClick={() => setComVideo(o.v)} style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: comVideo === o.v ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${comVideo === o.v ? colors.blue : colors.chipBorder}`,
              }}>
                {o.l}
              </div>
            ))}
          </div>

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
                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
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

          <div onClick={handleCreate} style={{ alignSelf: 'flex-start', padding: '10px 20px', background: colors.blue, color: '#0a0e13', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
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
              borderRadius: 12, padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap',
            }}
          >
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: '4px 8px', borderRadius: 6,
              background: s.tipoSessao === 'partida' ? colors.blueSoft : 'rgba(245,166,35,0.14)',
              color: s.tipoSessao === 'partida' ? colors.blue : colors.gold,
            }}>
              {s.tipoSessao === 'partida' ? 'PARTIDA' : 'TREINO'}
            </div>
            <div style={{ flex: 1, minWidth: 160, fontSize: 14, fontWeight: 600 }}>{s.label}</div>
            {s.tipoSessao === 'partida' && (() => {
              const p = placarDaSessao(state.eventos, s.id);
              return <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 800 }}>{p.nos} — {p.adversario}</div>;
            })()}
            <div style={{ fontSize: 12, color: colors.mutedDark, minWidth: 90 }}>{s.data}</div>
            <div style={{ fontSize: 12, color: colors.mutedDark }}>{s.comVideo ? 'com vídeo' : 'retroativo'}</div>
            <div style={{ fontSize: 12, color: colors.mutedDark }}>{s.escalacao.length} jogadores</div>
            <div style={{ fontSize: 12, color: colors.muted }}>{eventosPorSessao(s.id)} eventos</div>
          </div>
        ))}
      </div>
    </div>
  );
}

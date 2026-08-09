import { useState } from 'react';
import { colors, fontDisplay } from '../colors';
import { curtoPosicao, posicoes } from '../data';
import { useApp } from '../store';
import type { Jogador, Posicao } from '../types';

const posicaoVazia: Posicao = 'meia';

export default function ElencoScreen() {
  const { state, addJogador, updateJogador, deleteJogador } = useApp();
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [posicao, setPosicao] = useState<Posicao>(posicaoVazia);
  const [editando, setEditando] = useState<string | null>(null);

  const jogadores = [...state.jogadores].sort((a, b) => {
    if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
    return (a.numero ?? 999) - (b.numero ?? 999);
  });

  function submit() {
    const n = nome.trim();
    if (!n) return;
    const num = numero.trim() === '' ? undefined : Number(numero);
    if (editando) {
      const atual = state.jogadores.find((j) => j.id === editando);
      if (atual) updateJogador({ ...atual, nome: n, numero: num, posicao });
      setEditando(null);
    } else {
      addJogador({ nome: n, numero: num, posicao });
    }
    setNome('');
    setNumero('');
    setPosicao(posicaoVazia);
  }

  function iniciarEdicao(j: Jogador) {
    setEditando(j.id);
    setNome(j.nome);
    setNumero(j.numero !== undefined ? String(j.numero) : '');
    setPosicao(j.posicao);
  }

  function cancelar() {
    setEditando(null);
    setNome('');
    setNumero('');
    setPosicao(posicaoVazia);
  }

  function remover(j: Jogador) {
    const usados = state.eventos.filter(
      (e) => e.data.scorerId === j.id || e.data.playerId === j.id || e.data.assistId === j.id,
    ).length;
    const aviso = usados > 0
      ? `${j.nome} aparece em ${usados} evento(s) já registrado(s). Os eventos continuam, mas o jogador sai do elenco. Remover?`
      : `Remover ${j.nome} do elenco?`;
    if (window.confirm(aviso)) deleteJogador(j.id);
  }

  const input = {
    background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`,
    borderRadius: 8, padding: '10px 12px', fontSize: 13,
  } as const;

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Elenco</div>
        <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 4 }}>
          {jogadores.filter((j) => j.ativo).length} ativos · {jogadores.length} no total
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted }}>
          {editando ? 'EDITAR JOGADOR' : 'ADICIONAR JOGADOR'}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Nome do jogador"
            style={{ ...input, flex: 1, minWidth: 200 }}
          />
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Nº"
            type="number"
            style={{ ...input, width: 80 }}
          />
          <select value={posicao} onChange={(e) => setPosicao(e.target.value as Posicao)} style={{ ...input, fontWeight: 600 }}>
            {posicoes.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div onClick={submit} style={{ padding: '10px 20px', background: colors.blue, color: '#0a0e13', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {editando ? 'Salvar' : 'Adicionar'}
          </div>
          {editando && (
            <div onClick={cancelar} style={{ padding: '10px 20px', background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: colors.muted }}>
              Cancelar
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {jogadores.map((j) => (
          <div key={j.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, background: colors.cardBg,
            border: `1px solid ${colors.border}`, borderRadius: 12, padding: '12px 16px',
            opacity: j.ativo ? 1 : 0.5, flexWrap: 'wrap',
          }}>
            <div style={{
              fontFamily: fontDisplay, fontSize: 20, fontWeight: 800, width: 34, textAlign: 'center',
              color: j.numero !== undefined ? colors.text : colors.mutedDark,
            }}>
              {j.numero ?? '—'}
            </div>
            <div style={{ flex: 1, minWidth: 140, fontSize: 14, fontWeight: 600 }}>{j.nome}</div>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: '4px 8px', borderRadius: 6,
              background: colors.blueSoft, color: colors.blue,
            }}>
              {curtoPosicao(j.posicao)}
            </div>
            <div
              onClick={() => updateJogador({ ...j, ativo: !j.ativo })}
              style={{ fontSize: 12, color: j.ativo ? colors.muted : colors.gold, cursor: 'pointer', fontWeight: 600 }}
            >
              {j.ativo ? 'Ativo' : 'Inativo'}
            </div>
            <div onClick={() => iniciarEdicao(j)} style={{ fontSize: 12, color: colors.blue, cursor: 'pointer', fontWeight: 600 }}>editar</div>
            <div onClick={() => remover(j)} style={{ fontSize: 12, color: colors.gold, cursor: 'pointer', fontWeight: 600 }}>remover</div>
          </div>
        ))}
        {jogadores.length === 0 && (
          <div style={{ fontSize: 13, color: colors.mutedDark }}>Elenco vazio. Adicione o primeiro jogador acima.</div>
        )}
      </div>
    </div>
  );
}

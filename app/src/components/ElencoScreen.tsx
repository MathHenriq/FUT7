import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontDisplay } from '../colors';
import { curtoPosicao, posicoes } from '../data';
import { useApp } from '../store';
import type { Jogador, Posicao, VinculoJogador } from '../types';

const vazio = {
  nome: '', numero: '', posicao: 'meia' as Posicao, idade: '', nota: '',
};

export default function ElencoScreen() {
  const { state, addJogador, updateJogador, deleteJogador, addTime, updateTime, deleteTime } = useApp();
  const navigate = useNavigate();

  const meuTimeId = state.config.meuTimeId ?? state.times.find((t) => t.ehMeuTime)?.id ?? '';
  const [timeSel, setTimeSel] = useState<string>(meuTimeId);
  const [form, setForm] = useState(vazio);
  const [editando, setEditando] = useState<string | null>(null);
  const [novoTime, setNovoTime] = useState('');
  const [gerindoTimes, setGerindoTimes] = useState(false);

  const time = state.times.find((t) => t.id === timeSel) ?? state.times[0];
  const ehMeu = time?.ehMeuTime ?? false;
  const vinculo: VinculoJogador = ehMeu ? 'elenco' : 'observado';

  const jogadores = useMemo(() => (
    state.jogadores
      .filter((j) => j.timeId === time?.id)
      .sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return (a.numero ?? 999) - (b.numero ?? 999);
      })
  ), [state.jogadores, time?.id]);

  const contagem = (timeId: string) => state.jogadores.filter((j) => j.timeId === timeId).length;

  function submit() {
    const n = form.nome.trim();
    if (!n || !time) return;
    const dados = {
      nome: n,
      numero: form.numero.trim() === '' ? undefined : Number(form.numero),
      posicao: form.posicao,
      idade: form.idade.trim() === '' ? undefined : Number(form.idade),
      nota: form.nota.trim() || undefined,
    };
    if (editando) {
      const atual = state.jogadores.find((j) => j.id === editando);
      if (atual) updateJogador({ ...atual, ...dados });
      setEditando(null);
    } else {
      addJogador({ ...dados, timeId: time.id, vinculo });
    }
    setForm(vazio);
  }

  function iniciarEdicao(j: Jogador) {
    setEditando(j.id);
    setForm({
      nome: j.nome,
      numero: j.numero !== undefined ? String(j.numero) : '',
      posicao: j.posicao,
      idade: j.idade !== undefined ? String(j.idade) : '',
      nota: j.nota ?? '',
    });
  }

  function remover(j: Jogador) {
    const usados = state.eventos.filter(
      (e) => e.data.scorerId === j.id || e.data.playerId === j.id || e.data.assistId === j.id,
    ).length;
    const aviso = usados > 0
      ? `${j.nome} aparece em ${usados} evento(s) já registrado(s). Os eventos continuam, mas o jogador sai da lista. Remover?`
      : `Remover ${j.nome}?`;
    if (window.confirm(aviso)) deleteJogador(j.id);
  }

  function criarTime() {
    const n = novoTime.trim();
    if (!n) return;
    const id = addTime(n);
    setTimeSel(id);
    setNovoTime('');
  }

  function removerTime() {
    if (!time || time.ehMeuTime) return;
    const n = contagem(time.id);
    const aviso = n > 0
      ? `Remover "${time.nome}" apaga também os ${n} jogador(es) dele. Os eventos já registrados continuam. Confirmar?`
      : `Remover "${time.nome}"?`;
    if (!window.confirm(aviso)) return;
    deleteTime(time.id);
    setTimeSel(meuTimeId);
  }

  const input = {
    background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`,
    borderRadius: 3, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
  } as const;

  return (
    <div style={{ padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Jogadores</div>
        <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 3, maxWidth: 580, lineHeight: 1.5 }}>
          O seu elenco e os jogadores que você observa, cada um no seu clube. Um clube é só um
          clube — o nosso é apenas aquele marcado como tal.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {state.times.map((t) => {
          const on = t.id === timeSel;
          return (
            <div
              key={t.id}
              onClick={() => { setTimeSel(t.id); setEditando(null); setForm(vazio); }}
              style={{
                padding: '8px 14px', borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: on ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${on ? colors.blue : colors.chipBorder}`,
                color: on ? colors.text : colors.muted,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {t.ehMeuTime && (
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: colors.blue }}>MEU</span>
              )}
              <span>{t.nome}</span>
              <span style={{ fontSize: 11, color: colors.mutedDark }}>{contagem(t.id)}</span>
            </div>
          );
        })}
        <div
          onClick={() => setGerindoTimes((g) => !g)}
          style={{
            padding: '8px 12px', borderRadius: 3, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: colors.chipBg, border: `1px dashed ${colors.borderStrong}`, color: colors.blue,
          }}
        >
          {gerindoTimes ? 'Fechar' : '+ Clube'}
        </div>
      </div>

      {gerindoTimes && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 3, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={novoTime}
              onChange={(e) => setNovoTime(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') criarTime(); }}
              placeholder="Nome do clube a observar"
              style={{ ...input, flex: 1, minWidth: 220 }}
            />
            <div onClick={criarTime} style={{ padding: '10px 20px', background: colors.blue, color: colors.onBlue, borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Criar
            </div>
          </div>
          {time && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={time.nome}
                onChange={(e) => updateTime({ ...time, nome: e.target.value })}
                style={{ ...input, flex: 1, minWidth: 200 }}
              />
              {time.ehMeuTime ? (
                <span style={{ fontSize: 11, color: colors.mutedDark }}>O seu clube não pode ser removido.</span>
              ) : (
                <div onClick={removerTime} style={{ padding: '10px 16px', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, color: colors.gold }}>
                  Remover clube
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 3, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted }}>
          {editando ? 'EDITAR JOGADOR' : `ADICIONAR ${ehMeu ? 'AO ELENCO' : 'AOS OBSERVADOS'}`}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Nome do jogador"
            style={{ ...input, flex: 1, minWidth: 200 }}
          />
          <input
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Nº"
            type="number"
            style={{ ...input, width: 76 }}
          />
          <select value={form.posicao} onChange={(e) => setForm({ ...form, posicao: e.target.value as Posicao })} style={{ ...input, fontWeight: 600 }}>
            {posicoes.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          {!ehMeu && (
            <input
              value={form.idade}
              onChange={(e) => setForm({ ...form, idade: e.target.value })}
              placeholder="Idade"
              type="number"
              style={{ ...input, width: 88 }}
            />
          )}
        </div>
        {!ehMeu && (
          <input
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Observação livre (opcional)"
            style={input}
          />
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <div onClick={submit} style={{ padding: '10px 20px', background: colors.blue, color: colors.onBlue, borderRadius: 3, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {editando ? 'Salvar' : 'Adicionar'}
          </div>
          {editando && (
            <div onClick={() => { setEditando(null); setForm(vazio); }} style={{ padding: '10px 20px', background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, borderRadius: 3, fontWeight: 600, fontSize: 13, cursor: 'pointer', color: colors.muted }}>
              Cancelar
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {jogadores.map((j) => (
          <div key={j.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, background: colors.cardBg,
            border: `1px solid ${colors.border}`, borderRadius: 3, padding: '12px 16px',
            opacity: j.ativo ? 1 : 0.5, flexWrap: 'wrap',
          }}>
            <div style={{
              fontFamily: fontDisplay, fontSize: 20, fontWeight: 800, width: 34, textAlign: 'center',
              color: j.numero !== undefined ? colors.text : colors.mutedDark,
            }}>
              {j.numero ?? '—'}
            </div>
            <div
              onClick={() => navigate(`/jogador/${j.id}`)}
              style={{ flex: 1, minWidth: 150, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              {j.nome}
              <span style={{ color: colors.blue, marginLeft: 8, fontSize: 11, fontWeight: 600 }}>ver perfil ›</span>
              {j.nota && (
                <div style={{ fontSize: 11, color: colors.mutedDark, fontWeight: 400, marginTop: 2 }}>{j.nota}</div>
              )}
            </div>
            {j.idade !== undefined && (
              <div style={{ fontSize: 11, color: colors.mutedDark }}>{j.idade} anos</div>
            )}
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: '4px 8px', borderRadius: 3,
              background: colors.blueSoft, color: colors.blue,
            }}>
              {curtoPosicao(j.posicao)}
            </div>
            {j.vinculo === 'observado' && (
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: '4px 8px', borderRadius: 3,
                background: colors.goldSoft, color: colors.gold,
              }}>
                OBSERVADO
              </div>
            )}
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
          <div style={{ fontSize: 13, color: colors.mutedDark }}>
            {ehMeu ? 'Elenco vazio. Adicione o primeiro jogador acima.' : `Nenhum jogador observado em ${time?.nome}.`}
          </div>
        )}
      </div>
    </div>
  );
}

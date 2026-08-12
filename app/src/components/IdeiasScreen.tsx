import { useMemo, useState } from 'react';
import { colors, fontDisplay } from '../colors';
import {
  areasIdeia, escalaLabel, labelArea, prioridade, statusIdeia,
} from '../ideias';
import { useApp } from '../store';
import type { AreaIdeia, Escala, Ideia, StatusIdeia } from '../types';

/** Status carries a shape as well as a colour — a check, a strike-through — so the
 *  board never depends on hue alone to be read. */
const estiloStatus: Record<StatusIdeia, { cor: string; fundo: string; marca?: string; risco?: boolean }> = {
  fazendo: { cor: colors.blue, fundo: colors.blueSofter, marca: '▸' },
  estudando: { cor: colors.gold, fundo: colors.goldSoft, marca: '◦' },
  ideia: { cor: colors.muted, fundo: colors.chipBg },
  feito: { cor: colors.blue, fundo: colors.blueSoft, marca: '✓' },
  descartado: { cor: colors.mutedDark, fundo: colors.chipBg, risco: true },
};

const vazio = {
  titulo: '', descricao: '', area: 'analise' as AreaIdeia, status: 'ideia' as StatusIdeia,
  impacto: 2 as Escala, esforco: 2 as Escala, referencia: '',
};

export default function IdeiasScreen() {
  const { state, addIdeia, updateIdeia, deleteIdeia } = useApp();
  const [filtroArea, setFiltroArea] = useState<AreaIdeia | 'todas'>('todas');
  const [filtroStatus, setFiltroStatus] = useState<StatusIdeia | 'todos'>('todos');
  const [form, setForm] = useState(vazio);
  const [abrindo, setAbrindo] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const lista = state.ideias.filter((i) => (
      (filtroArea === 'todas' || i.area === filtroArea)
      && (filtroStatus === 'todos' || i.status === filtroStatus)
    ));
    return [...lista].sort((a, b) => {
      const oa = statusIdeia.find((s) => s.key === a.status)?.ordem ?? 9;
      const ob = statusIdeia.find((s) => s.key === b.status)?.ordem ?? 9;
      if (oa !== ob) return oa - ob;
      return prioridade(b) - prioridade(a);
    });
  }, [state.ideias, filtroArea, filtroStatus]);

  const porStatus = useMemo(() => {
    const m = new Map<StatusIdeia, Ideia[]>();
    for (const i of filtradas) {
      const arr = m.get(i.status) ?? [];
      arr.push(i);
      m.set(i.status, arr);
    }
    return m;
  }, [filtradas]);

  const contagem = (s: StatusIdeia) => state.ideias.filter((i) => i.status === s).length;

  function submit() {
    const t = form.titulo.trim();
    if (!t) return;
    const payload = { ...form, titulo: t, referencia: form.referencia.trim() || undefined };
    if (editando) {
      const atual = state.ideias.find((i) => i.id === editando);
      if (atual) updateIdeia({ ...atual, ...payload });
      setEditando(null);
    } else {
      addIdeia(payload);
    }
    setForm(vazio);
    setAbrindo(false);
  }

  function editar(i: Ideia) {
    setEditando(i.id);
    setForm({
      titulo: i.titulo, descricao: i.descricao, area: i.area, status: i.status,
      impacto: i.impacto, esforco: i.esforco, referencia: i.referencia ?? '',
    });
    setAbrindo(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remover(i: Ideia) {
    if (window.confirm(`Remover "${i.titulo}" do backlog?`)) deleteIdeia(i.id);
  }

  function mover(i: Ideia, novo: StatusIdeia) {
    updateIdeia({ ...i, status: novo });
  }

  const input = {
    background: colors.chipBg, color: colors.text, border: `1px solid ${colors.borderStrong}`,
    borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
  } as const;

  return (
    <div style={{ padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Ideias</div>
          <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 3, maxWidth: 560, lineHeight: 1.5 }}>
            O caminho do app, do registro do lance até a recomendação de profissional. Ordenado por
            impacto sobre esforço — sem isso, backlog vira lista de desejos.
          </div>
        </div>
        <div
          onClick={() => { setAbrindo((o) => !o); if (abrindo) { setEditando(null); setForm(vazio); } }}
          style={{ padding: '10px 18px', background: colors.blue, color: '#0a0e13', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          {abrindo ? 'Cancelar' : '+ Nova ideia'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {statusIdeia.map((s) => {
          const on = filtroStatus === s.key;
          const e = estiloStatus[s.key];
          return (
            <div
              key={s.key}
              onClick={() => setFiltroStatus(on ? 'todos' : s.key)}
              style={{
                padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: on ? e.fundo : colors.chipBg,
                border: `1px solid ${on ? e.cor : colors.chipBorder}`,
                color: on ? colors.text : colors.muted,
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              {e.marca && <span style={{ color: e.cor }}>{e.marca}</span>}
              <span>{s.label}</span>
              <span style={{ fontFamily: fontDisplay, fontSize: 14, fontWeight: 800, color: on ? e.cor : colors.mutedDark }}>
                {contagem(s.key)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <div
          onClick={() => setFiltroArea('todas')}
          style={{
            padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: filtroArea === 'todas' ? colors.blue : colors.chipBg,
            border: `1px solid ${filtroArea === 'todas' ? colors.blue : colors.chipBorder}`,
            color: filtroArea === 'todas' ? '#0a0e13' : colors.muted,
          }}
        >
          Todas as áreas
        </div>
        {areasIdeia.map((a) => (
          <div
            key={a.key}
            onClick={() => setFiltroArea(a.key)}
            title={a.nota}
            style={{
              padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: filtroArea === a.key ? colors.blue : colors.chipBg,
              border: `1px solid ${filtroArea === a.key ? colors.blue : colors.chipBorder}`,
              color: filtroArea === a.key ? '#0a0e13' : colors.muted,
            }}
          >
            {a.label}
          </div>
        ))}
      </div>

      {abrindo && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted }}>
            {editando ? 'EDITAR IDEIA' : 'NOVA IDEIA'}
          </div>
          <input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título"
            autoFocus
            style={input}
          />
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="O que é, e por que vale a pena"
            rows={3}
            style={{ ...input, resize: 'vertical', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as AreaIdeia })} style={{ ...input, fontWeight: 600 }}>
              {areasIdeia.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as StatusIdeia })} style={{ ...input, fontWeight: 600 }}>
              {statusIdeia.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select value={form.impacto} onChange={(e) => setForm({ ...form, impacto: Number(e.target.value) as Escala })} style={{ ...input, fontWeight: 600 }}>
              {[1, 2, 3].map((n) => <option key={n} value={n}>Impacto: {escalaLabel[n as Escala]}</option>)}
            </select>
            <select value={form.esforco} onChange={(e) => setForm({ ...form, esforco: Number(e.target.value) as Escala })} style={{ ...input, fontWeight: 600 }}>
              {[1, 2, 3].map((n) => <option key={n} value={n}>Esforço: {escalaLabel[n as Escala]}</option>)}
            </select>
            <input
              value={form.referencia}
              onChange={(e) => setForm({ ...form, referencia: e.target.value })}
              placeholder="De onde veio (opcional)"
              style={{ ...input, flex: 1, minWidth: 180 }}
            />
          </div>
          <div onClick={submit} style={{ alignSelf: 'flex-start', padding: '10px 20px', background: colors.blue, color: '#0a0e13', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {editando ? 'Salvar' : 'Adicionar'}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {statusIdeia.map((s) => {
          const lista = porStatus.get(s.key);
          if (!lista || lista.length === 0) return null;
          const e = estiloStatus[s.key];
          return (
            <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: e.cor, fontSize: 13 }}>{e.marca ?? '·'}</span>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: colors.muted, textTransform: 'uppercase' }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 12, color: colors.mutedDark }}>{lista.length}</span>
                <div style={{ flex: 1, height: 1, background: colors.rowBorder }} />
              </div>

              {lista.map((i) => (
                <div
                  key={i.id}
                  style={{
                    background: colors.cardBg, border: `1px solid ${colors.border}`,
                    borderLeft: `3px solid ${e.cor}`, borderRadius: 10, padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                    opacity: s.key === 'descartado' ? 0.62 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <div style={{
                      fontSize: 15, fontWeight: 700,
                      textDecoration: e.risco ? 'line-through' : 'none',
                      textDecorationColor: colors.mutedDark,
                    }}>
                      {i.titulo}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 600 }}>
                      <span onClick={() => editar(i)} style={{ color: colors.blue, cursor: 'pointer' }}>editar</span>
                      <span onClick={() => remover(i)} style={{ color: colors.gold, cursor: 'pointer' }}>remover</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: colors.mutedLight, lineHeight: 1.55 }}>{i.descricao}</div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 11 }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 5, background: colors.chipBg,
                      border: `1px solid ${colors.chipBorder}`, color: colors.muted, fontWeight: 600,
                    }}>
                      {labelArea(i.area)}
                    </span>
                    <span style={{ color: colors.mutedDark }}>
                      Impacto <strong style={{ color: colors.text }}>{escalaLabel[i.impacto]}</strong>
                      {' · '}Esforço <strong style={{ color: colors.text }}>{escalaLabel[i.esforco]}</strong>
                    </span>
                    {i.referencia && (
                      <span style={{ color: colors.mutedDark, fontStyle: 'italic' }}>{i.referencia}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    {statusIdeia.filter((o) => o.key !== i.status).map((o) => (
                      <span
                        key={o.key}
                        onClick={() => mover(i, o.key)}
                        style={{
                          fontSize: 10.5, fontWeight: 600, padding: '4px 9px', borderRadius: 6,
                          background: colors.chipBg, border: `1px dashed ${colors.chipBorder}`,
                          color: colors.mutedDark, cursor: 'pointer',
                        }}
                      >
                        → {o.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {filtradas.length === 0 && (
          <div style={{ fontSize: 13, color: colors.mutedDark, padding: '20px 0' }}>
            Nenhuma ideia com esse filtro.
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: colors.mutedDark, borderTop: `1px solid ${colors.rowBorder}`, paddingTop: 14, lineHeight: 1.6 }}>
        {state.ideias.length} ideias no total · {contagem('feito')} entregues.
        As descartadas ficam com o motivo à vista de propósito — para não voltarem à mesa daqui a três meses.
      </div>
    </div>
  );
}

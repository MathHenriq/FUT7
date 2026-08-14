import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fontDisplay, rotulo } from '../colors';
import { heatColor, setorIndex, setorLabels } from '../data';
import { MINUTOS_REFERENCIA } from '../stats';
import { useRelatorio } from '../hooks/useRelatorio';
import { useApp } from '../store';
import type { Avaliacao, Recomendacao } from '../types';

const RECOMENDACOES: { key: Recomendacao; label: string; marca: string }[] = [
  { key: 'contratar', label: 'Vale contratar', marca: '★' },
  { key: 'seguir-observando', label: 'Seguir observando', marca: '◎' },
  { key: 'nao-serve', label: 'Não serve agora', marca: '×' },
];

export default function RelatorioScreen() {
  const { jogadorId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const r = useRelatorio(jogadorId ?? '');
  const jogador = r.jogador;

  const [av, setAv] = useState<Avaliacao>({});
  const [copiado, setCopiado] = useState(false);
  const [novoForte, setNovoForte] = useState('');
  const [novoFraco, setNovoFraco] = useState('');

  useEffect(() => { setAv(jogador?.avaliacao ?? {}); }, [jogador?.id, jogador?.avaliacao]);

  if (!jogador) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ fontSize: 14, color: colors.muted }}>Jogador não encontrado.</div>
        <div onClick={() => navigate('/elenco')} style={{ marginTop: 12, color: colors.blue, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>‹ Voltar</div>
      </div>
    );
  }

  function salvar(patch: Partial<Avaliacao>) {
    const proximo: Avaliacao = { ...av, ...patch, atualizadoEm: Date.now() };
    setAv(proximo);
    dispatch({ type: 'UPDATE_JOGADOR', jogador: { ...jogador!, avaliacao: proximo } });
  }

  const baseLabel = r.base === 'quarenta' ? `por ${MINUTOS_REFERENCIA} min` : 'por sessão';

  /** Plain text so it survives WhatsApp, e-mail and a paste into any document. */
  function montarTexto(): string {
    const l: string[] = [];
    l.push(`RELATÓRIO DE OBSERVAÇÃO — ${jogador!.nome}`);
    l.push('');
    l.push(`Posição: ${r.posicao}${jogador!.numero ? ` · nº ${jogador!.numero}` : ''}`);
    l.push(`Clube: ${r.clube}`);
    if (jogador!.idade) l.push(`Idade: ${jogador!.idade}`);
    if (jogador!.pePreferido) l.push(`Pé: ${jogador!.pePreferido}`);
    l.push(`Observações: ${r.pontos.length}${r.minutosTotais > 0 ? ` · ${r.minutosTotais} min` : ''}`);
    l.push('');
    if (r.amostraFina) {
      l.push(`RESSALVA: apenas ${r.pontos.length} observação(ões). Abaixo de ${r.observacoesMinimas} isto é uma impressão, não uma avaliação.`);
      l.push('');
    }
    l.push(`NÚMEROS (${baseLabel}, contra ${r.tamanhoPool} jogadores)`);
    for (const x of r.linhas) {
      const v = x.valor.toFixed(x.def.agregacao === 'soma' ? 2 : (x.def.decimais ?? 0));
      l.push(`  ${x.def.label}: ${v}${x.def.sufixo ?? ''} — ${x.posicaoRank}º de ${x.pool}`);
    }
    l.push('');
    const fortesTxt = [...r.fortes.map((f) => `${f.def.label} (${f.posicaoRank}º de ${f.pool})`), ...(av.fortes ?? [])];
    const fracosTxt = [...r.fracos.map((f) => `${f.def.label} (${f.posicaoRank}º de ${f.pool})`), ...(av.fracos ?? [])];
    l.push('PONTOS FORTES');
    l.push(fortesTxt.length ? fortesTxt.map((t) => `  + ${t}`).join('\n') : '  —');
    l.push('');
    l.push('PONTOS A MELHORAR');
    l.push(fracosTxt.length ? fracosTxt.map((t) => `  - ${t}`).join('\n') : '  —');
    l.push('');
    l.push('SESSÕES OBSERVADAS');
    for (const s of r.sessoes) {
      l.push(`  ${s.sessao.data} · ${s.sessao.label} · ${s.eventos} lances${s.gols ? ` · ${s.gols} gol(s)` : ''}${s.minutos ? ` · ${s.minutos} min` : ''}`);
    }
    l.push('');
    if (av.parecer) { l.push('PARECER'); l.push(av.parecer); l.push(''); }
    const rec = RECOMENDACOES.find((x) => x.key === av.recomendacao);
    if (rec) l.push(`RECOMENDAÇÃO: ${rec.label}`);
    if (av.autor) l.push(`Assinado por: ${av.autor}`);
    l.push(`Emitido em ${new Date().toLocaleDateString('pt-BR')} · FUT7 Analytics`);
    return l.join('\n');
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(montarTexto());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  }

  function baixar() {
    const blob = new Blob([montarTexto()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${jogador!.nome.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const heat = (() => {
    const labels = setorLabels(state.config.gradeZonas);
    const counts = new Array(labels.length).fill(0) as number[];
    for (const f of r.finalizacoes) {
      if (f.data.x === undefined || f.data.y === undefined) continue;
      counts[setorIndex(f.data.x, f.data.y, state.config.gradeZonas)] += 1;
    }
    const max = Math.max(...counts, 1);
    return counts.map((v, i) => ({ v, label: labels[i], bg: heatColor(v, max) }));
  })();

  const painel = {
    background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 3, padding: 20,
  } as const;

  const acao = {
    padding: '8px 14px', border: `1px solid ${colors.chipBorder}`, borderRadius: 3,
    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  } as const;

  const campo = {
    width: '100%', background: colors.cardBgAlt, color: colors.text,
    border: `1px solid ${colors.chipBorder}`, borderRadius: 3, padding: '10px 12px',
    fontSize: 13, fontFamily: 'inherit',
  } as const;

  function addItem(campoLista: 'fortes' | 'fracos', texto: string) {
    const t = texto.trim();
    if (!t) return;
    salvar({ [campoLista]: [...(av[campoLista] ?? []), t] } as Partial<Avaliacao>);
  }

  function removeItem(campoLista: 'fortes' | 'fracos', i: number) {
    salvar({ [campoLista]: (av[campoLista] ?? []).filter((_, k) => k !== i) } as Partial<Avaliacao>);
  }

  return (
    <div className="rel-page" style={{ padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1000, margin: '0 auto' }}>
      <div className="rel-esconder" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div onClick={() => navigate(`/jogador/${jogador.id}`)} style={{ fontSize: 12, color: colors.mutedDark, cursor: 'pointer' }}>
          ‹ Perfil
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div onClick={() => window.print()} style={acao}>Imprimir / PDF</div>
          <div onClick={baixar} style={acao}>Baixar .txt</div>
          <div onClick={copiar} style={acao}>{copiado ? 'Copiado' : 'Copiar texto'}</div>
        </div>
      </div>

      {/* ---- Cabeçalho do documento ---- */}
      <div style={painel}>
        <div style={{ ...rotulo, color: colors.mutedDark }}>Relatório de observação</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{jogador.nome}</div>
          {jogador.numero !== undefined && (
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, color: colors.mutedDark }}>nº {jogador.numero}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginTop: 12, fontSize: 12.5 }}>
          <Dado k="Posição" v={r.posicao} />
          <Dado k="Clube" v={r.clube} />
          {jogador.idade !== undefined && <Dado k="Idade" v={String(jogador.idade)} />}
          {jogador.pePreferido && <Dado k="Pé" v={jogador.pePreferido} />}
          <Dado k="Observações" v={String(r.pontos.length)} />
          {r.minutosTotais > 0 && <Dado k="Minutos" v={String(r.minutosTotais)} />}
        </div>
      </div>

      {r.amostraFina && (
        <div style={{
          background: colors.goldSoft, borderLeft: `3px solid ${colors.gold}`, borderRadius: 3,
          padding: '12px 16px', fontSize: 12.5, lineHeight: 1.55,
        }}>
          <b>{r.pontos.length} observação{r.pontos.length === 1 ? '' : 'ões'} até aqui.</b> Abaixo de {r.observacoesMinimas},
          isto é uma impressão, não uma avaliação — um jogo ruim ou um jogo excepcional domina tudo que
          está escrito abaixo. A ressalva acompanha o relatório exportado.
        </div>
      )}

      {/* ---- Números ---- */}
      <div style={painel}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Números</div>
        <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2, marginBottom: 12 }}>
          {baseLabel} · posição contra {r.tamanhoPool} jogadores com histórico
        </div>
        {r.linhas.length === 0 ? (
          <div style={{ fontSize: 13, color: colors.mutedDark }}>Nenhum lance registrado ainda.</div>
        ) : (
          <div className="rel-grade">
            {r.linhas.map((x) => (
              <div key={x.def.key} style={{ borderTop: `1px solid ${colors.rowBorder}`, padding: '9px 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 12.5, flex: 1 }}>{x.def.label}</span>
                  <span style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 800 }}>
                    {x.valor.toFixed(x.def.agregacao === 'soma' ? 2 : (x.def.decimais ?? 0))}{x.def.sufixo ?? ''}
                  </span>
                  <span style={{ fontSize: 11, color: colors.mutedDark, minWidth: 62, textAlign: 'right' }}>
                    {x.posicaoRank}º de {x.pool}
                  </span>
                </div>
                <div style={{ height: 6, background: colors.cardBgAlt, borderRadius: 2, marginTop: 5 }}>
                  <div style={{
                    width: `${Math.max(x.percentil, 1.5)}%`, height: '100%',
                    background: colors.blue, borderRadius: '2px 3px 3px 2px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Fortes e fracos ---- */}
      <div className="rel-grade2">
        <div style={painel}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pontos fortes</div>
          <Lista
            auto={r.fortes.map((f) => `${f.def.label} — ${f.posicaoRank}º de ${f.pool}`)}
            manuais={av.fortes ?? []}
            sinal="+"
            corSinal={colors.blue}
            onRemove={(i) => removeItem('fortes', i)}
          />
          <div className="rel-esconder" style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <input
              value={novoForte} onChange={(e) => setNovoForte(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { addItem('fortes', novoForte); setNovoForte(''); } }}
              placeholder="O que o dado não mostra…" style={campo}
            />
            <div onClick={() => { addItem('fortes', novoForte); setNovoForte(''); }} style={acao}>+</div>
          </div>
        </div>

        <div style={painel}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Pontos a melhorar</div>
          <Lista
            auto={r.fracos.map((f) => `${f.def.label} — ${f.posicaoRank}º de ${f.pool}`)}
            manuais={av.fracos ?? []}
            sinal="−"
            corSinal={colors.gold}
            onRemove={(i) => removeItem('fracos', i)}
          />
          <div className="rel-esconder" style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <input
              value={novoFraco} onChange={(e) => setNovoFraco(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { addItem('fracos', novoFraco); setNovoFraco(''); } }}
              placeholder="O que o dado não mostra…" style={campo}
            />
            <div onClick={() => { addItem('fracos', novoFraco); setNovoFraco(''); }} style={acao}>+</div>
          </div>
        </div>
      </div>

      {/* ---- Onde finaliza + sessões ---- */}
      <div className="rel-grade2">
        <div style={painel}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>De onde finaliza</div>
          <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2, marginBottom: 12 }}>
            {r.finalizacoes.length} finalizações · ataque no topo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3, maxWidth: 230 }}>
            {heat.map((h, i) => (
              <div key={i} title={h.label} style={{
                aspectRatio: '1', borderRadius: 2, background: h.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 800, color: colors.heatTinta }}>{h.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={painel}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Sessões observadas</div>
          {r.sessoes.length === 0 ? (
            <div style={{ fontSize: 13, color: colors.mutedDark }}>Nenhuma ainda.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: colors.mutedDark, textAlign: 'left' }}>
                  <th style={{ ...rotulo, fontWeight: 600, padding: '0 8px 6px 0' }}>Sessão</th>
                  <th style={{ ...rotulo, fontWeight: 600, padding: '0 8px 6px', textAlign: 'right' }}>Lances</th>
                  <th style={{ ...rotulo, fontWeight: 600, padding: '0 0 6px 8px', textAlign: 'right' }}>Min</th>
                </tr>
              </thead>
              <tbody>
                {[...r.sessoes].reverse().map((s) => (
                  <tr key={s.sessao.id} style={{ borderTop: `1px solid ${colors.rowBorder}` }}>
                    <td style={{ padding: '7px 8px 7px 0' }}>
                      <span style={{ fontWeight: 600 }}>{s.sessao.label}</span>
                      <span style={{ color: colors.mutedDark, marginLeft: 6, fontSize: 10 }}>{s.sessao.data}</span>
                      {s.gols > 0 && <span style={{ color: colors.blue, marginLeft: 6, fontWeight: 700 }}>{s.gols} gol{s.gols > 1 ? 's' : ''}</span>}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{s.eventos}</td>
                    <td style={{ padding: '7px 0 7px 8px', textAlign: 'right', color: s.minutos === null ? colors.mutedDark : colors.text }}>
                      {s.minutos ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ---- Parecer ---- */}
      <div style={painel}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Parecer</div>
        <div style={{ fontSize: 12, color: colors.mutedDark, marginBottom: 10 }}>
          A parte que nenhum número escreve. É o que faz o relatório valer.
        </div>
        <textarea
          value={av.parecer ?? ''}
          onChange={(e) => setAv({ ...av, parecer: e.target.value })}
          onBlur={(e) => salvar({ parecer: e.target.value })}
          rows={5}
          placeholder="Como joga, o que resolve, onde some, com quem combina, o que precisaria treinar…"
          style={{ ...campo, resize: 'vertical', lineHeight: 1.55 }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, alignItems: 'center' }}>
          <span style={{ ...rotulo, color: colors.mutedDark, marginRight: 4 }}>Recomendação</span>
          {RECOMENDACOES.map((o) => {
            const ativo = av.recomendacao === o.key;
            return (
              <div
                key={o.key}
                className={ativo ? 'rel-opcao' : 'rel-opcao rel-opcao-off'}
                onClick={() => salvar({ recomendacao: ativo ? undefined : o.key })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 3,
                  fontSize: 12.5, cursor: 'pointer', fontWeight: ativo ? 700 : 500,
                  background: ativo ? (o.key === 'nao-serve' ? colors.goldSoft : colors.blueSofter) : colors.chipBg,
                  border: `1px solid ${ativo ? (o.key === 'nao-serve' ? colors.gold : colors.blue) : colors.chipBorder}`,
                  color: ativo ? colors.text : colors.muted,
                }}
              >
                {/* Shape carries the meaning too, never the colour alone. */}
                <span aria-hidden style={{ fontSize: 13 }}>{o.marca}</span>
                {o.label}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ ...rotulo, color: colors.mutedDark }}>Assinado por</span>
          <input
            value={av.autor ?? ''}
            onChange={(e) => setAv({ ...av, autor: e.target.value })}
            onBlur={(e) => salvar({ autor: e.target.value })}
            placeholder="quem observou"
            style={{ ...campo, width: 220 }}
          />
          {av.atualizadoEm && (
            <span style={{ fontSize: 11, color: colors.mutedDark }}>
              atualizado em {new Date(av.atualizadoEm).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Dado({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ ...rotulo, color: colors.mutedDark }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function Lista({ auto, manuais, sinal, corSinal, onRemove }: {
  auto: string[]; manuais: string[]; sinal: string; corSinal: string; onRemove: (i: number) => void;
}) {
  if (auto.length === 0 && manuais.length === 0) {
    return <div style={{ fontSize: 12.5, color: colors.mutedDark }}>Nada a destacar com os dados de hoje.</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {auto.map((t, i) => (
        <div key={`a${i}`} style={{ display: 'flex', gap: 8, fontSize: 12.5, alignItems: 'baseline' }}>
          <span style={{ color: corSinal, fontWeight: 800 }}>{sinal}</span>
          <span>{t}</span>
        </div>
      ))}
      {manuais.map((t, i) => (
        <div key={`m${i}`} style={{ display: 'flex', gap: 8, fontSize: 12.5, alignItems: 'baseline' }}>
          <span style={{ color: corSinal, fontWeight: 800 }}>{sinal}</span>
          <span style={{ flex: 1 }}>{t}</span>
          <span
            className="rel-esconder"
            onClick={() => onRemove(i)}
            style={{ color: colors.mutedDark, cursor: 'pointer', fontSize: 11 }}
          >
            remover
          </span>
        </div>
      ))}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontDisplay, rotulo } from '../colors';
import { curtoPosicao, posicoes } from '../data';
import { defDe, metricasDef } from '../stats';
import { metricasComparaveis } from '../hooks/useComparacao';
import { useBancoJogadores, type Base } from '../hooks/useBancoJogadores';
import type { MetricaKey } from '../stats';
import type { Posicao, Recomendacao, VinculoJogador } from '../types';

/** Criteria add a column each. Three is where the table stops being readable —
 *  past that the answer is a shortlist and a comparison, not a wider table. */
const MAX_CRITERIOS = 3;

interface Criterio {
  key: MetricaKey;
  minimo: string;
}

type Ordenacao = { campo: 'nome' | 'sessoes' | 'minutos' | 'idade' | MetricaKey; desc: boolean };

const RECOMENDACAO_LABEL: Record<Recomendacao, string> = {
  contratar: '★ Vale contratar',
  'seguir-observando': '◎ Seguir observando',
  'nao-serve': '× Não serve agora',
};

export default function BuscarScreen() {
  const navigate = useNavigate();
  const [base, setBase] = useState<Base>('quarenta');
  const [texto, setTexto] = useState('');
  const [posSel, setPosSel] = useState<Posicao[]>([]);
  const [vinculo, setVinculo] = useState<VinculoJogador | 'todos'>('todos');
  const [idadeMin, setIdadeMin] = useState('');
  const [idadeMax, setIdadeMax] = useState('');
  const [sessoesMin, setSessoesMin] = useState('');
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [ordem, setOrdem] = useState<Ordenacao>({ campo: 'sessoes', desc: true });

  const banco = useBancoJogadores(base);
  const baseEfetiva: Base = banco.temMinutos ? base : 'sessao';
  const bancoEfetivo = useBancoJogadores(baseEfetiva);

  const resultados = useMemo(() => {
    const t = texto.trim().toLowerCase();
    const iMin = idadeMin === '' ? null : Number(idadeMin);
    const iMax = idadeMax === '' ? null : Number(idadeMax);
    const sMin = sessoesMin === '' ? null : Number(sessoesMin);

    const filtradas = bancoEfetivo.fichas.filter((f) => {
      const j = f.jogador;
      if (t && !j.nome.toLowerCase().includes(t) && !f.clube.toLowerCase().includes(t)) return false;
      if (posSel.length > 0 && !posSel.includes(j.posicao)) return false;
      if (vinculo !== 'todos' && j.vinculo !== vinculo) return false;
      if (iMin !== null && (j.idade === undefined || j.idade < iMin)) return false;
      if (iMax !== null && (j.idade === undefined || j.idade > iMax)) return false;
      if (sMin !== null && f.sessoes < sMin) return false;

      for (const c of criterios) {
        if (c.minimo === '') continue;
        const v = f.valores[c.key];
        // No value means the player is not in that metric at all — a "mínimo"
        // filter cannot be satisfied by an absent number.
        if (v === null) return false;
        const alvo = Number(c.minimo);
        if (Number.isNaN(alvo)) continue;
        if (defDe(c.key).melhorQuando === 'alto' ? v < alvo : v > alvo) return false;
      }
      return true;
    });

    const valorOrdem = (f: typeof filtradas[number]): number | string | null => {
      if (ordem.campo === 'nome') return f.jogador.nome;
      if (ordem.campo === 'sessoes') return f.sessoes;
      if (ordem.campo === 'minutos') return f.minutos;
      if (ordem.campo === 'idade') return f.jogador.idade ?? null;
      return f.valores[ordem.campo];
    };

    return [...filtradas].sort((a, b) => {
      const va = valorOrdem(a);
      const vb = valorOrdem(b);
      // Missing values always sink, whichever direction the sort runs — otherwise
      // "sort by top speed" would put everyone who was never measured on top.
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return ordem.desc ? -cmp : cmp;
    });
  }, [bancoEfetivo.fichas, texto, posSel, vinculo, idadeMin, idadeMax, sessoesMin, criterios, ordem]);

  function alternarPos(p: Posicao) {
    setPosSel((atual) => (atual.includes(p) ? atual.filter((x) => x !== p) : [...atual, p]));
  }

  function ordenarPor(campo: Ordenacao['campo']) {
    setOrdem((o) => (o.campo === campo ? { campo, desc: !o.desc } : { campo, desc: true }));
  }

  function limpar() {
    setTexto(''); setPosSel([]); setVinculo('todos');
    setIdadeMin(''); setIdadeMax(''); setSessoesMin(''); setCriterios([]);
  }

  const painel = {
    background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 3, padding: 20,
  } as const;

  const chip = (ativo: boolean) => ({
    padding: '6px 12px', borderRadius: 3, fontSize: 12, cursor: 'pointer',
    fontWeight: ativo ? 700 : 500,
    background: ativo ? colors.blueSofter : colors.chipBg,
    border: `1px solid ${ativo ? colors.blue : colors.chipBorder}`,
    color: ativo ? colors.text : colors.muted,
  });

  const campo = {
    background: colors.cardBgAlt, color: colors.text, border: `1px solid ${colors.chipBorder}`,
    borderRadius: 3, padding: '7px 10px', fontSize: 12.5, fontFamily: 'inherit',
  } as const;

  const th = (campoOrd: Ordenacao['campo'], label: string, alinhaDireita = false, chave?: string) => (
    <th
      key={chave ?? campoOrd}
      onClick={() => ordenarPor(campoOrd)}
      style={{
        ...rotulo, color: ordem.campo === campoOrd ? colors.text : colors.mutedDark,
        fontWeight: 600, padding: '0 8px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
        textAlign: alinhaDireita ? 'right' : 'left',
      }}
    >
      {label}{ordem.campo === campoOrd ? (ordem.desc ? ' ▾' : ' ▴') : ''}
    </th>
  );

  const filtroAtivo = texto !== '' || posSel.length > 0 || vinculo !== 'todos'
    || idadeMin !== '' || idadeMax !== '' || sessoesMin !== '' || criterios.length > 0;

  return (
    <div style={{ padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180, margin: '0 auto' }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Buscar por critério</div>
        <div style={{ fontSize: 13, color: colors.mutedDark, marginTop: 4, maxWidth: '72ch', lineHeight: 1.55 }}>
          O que faz o banco de observações virar decisão em vez de arquivo morto: filtre por
          posição, idade e faixa de métrica, e chegue numa lista curta que dá para levar adiante.
        </div>
      </div>

      <div style={painel}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Nome ou clube" style={{ ...campo, minWidth: 200, flex: '1 1 200px' }}
          />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ ...rotulo, color: colors.mutedDark, marginRight: 4 }}>Base</span>
            <div onClick={() => banco.temMinutos && setBase('quarenta')} style={{ ...chip(baseEfetiva === 'quarenta'), opacity: banco.temMinutos ? 1 : 0.5 }}>
              por 40 min
            </div>
            <div onClick={() => setBase('sessao')} style={chip(baseEfetiva === 'sessao')}>por sessão</div>
          </div>
          {filtroAtivo && (
            <div onClick={limpar} style={{ ...chip(false), marginLeft: 'auto' }}>Limpar filtros</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          <span style={{ ...rotulo, color: colors.mutedDark, marginRight: 4 }}>Posição</span>
          {posicoes.filter((p) => bancoEfetivo.posicoesPresentes.includes(p.key)).map((p) => (
            <div key={p.key} onClick={() => alternarPos(p.key)} style={chip(posSel.includes(p.key))}>
              {p.label}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ ...rotulo, color: colors.mutedDark, marginRight: 4 }}>Vínculo</span>
            {([['todos', 'Todos'], ['elenco', 'Elenco'], ['observado', 'Observados']] as const).map(([k, l]) => (
              <div key={k} onClick={() => setVinculo(k)} style={chip(vinculo === k)}>{l}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ ...rotulo, color: colors.mutedDark }}>Idade</span>
            <input value={idadeMin} onChange={(e) => setIdadeMin(e.target.value)} placeholder="de" inputMode="numeric" style={{ ...campo, width: 58 }} />
            <input value={idadeMax} onChange={(e) => setIdadeMax(e.target.value)} placeholder="até" inputMode="numeric" style={{ ...campo, width: 58 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ ...rotulo, color: colors.mutedDark }}>Mín. de sessões</span>
            <input value={sessoesMin} onChange={(e) => setSessoesMin(e.target.value)} placeholder="0" inputMode="numeric" style={{ ...campo, width: 58 }} />
          </div>
        </div>

        {/* ---- Critérios de métrica ---- */}
        <div style={{ marginTop: 14, borderTop: `1px solid ${colors.rowBorder}`, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ ...rotulo, color: colors.mutedDark }}>Critérios de métrica</span>
            {criterios.length < MAX_CRITERIOS && (
              <div
                onClick={() => setCriterios((c) => [
                  ...c,
                  { key: metricasComparaveis.find((k) => !c.some((x) => x.key === k)) ?? 'gols', minimo: '' },
                ])}
                style={chip(false)}
              >
                + critério
              </div>
            )}
            {criterios.length >= MAX_CRITERIOS && (
              <span style={{ fontSize: 11, color: colors.mutedDark }}>
                máximo de {MAX_CRITERIOS} — além disso a tabela deixa de ser legível
              </span>
            )}
          </div>

          {criterios.length === 0 ? (
            <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 8 }}>
              Nenhum. Adicione um para filtrar por número — e ele vira coluna na tabela.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {criterios.map((c, i) => {
                const def = defDe(c.key);
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={c.key}
                      onChange={(e) => setCriterios((ls) => ls.map((x, k) => (k === i ? { ...x, key: e.target.value as MetricaKey } : x)))}
                      style={{ ...campo, minWidth: 170 }}
                    >
                      {metricasComparaveis.map((k) => (
                        <option key={k} value={k}>{metricasDef.find((m) => m.key === k)!.label}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 12, color: colors.mutedDark }}>
                      {def.melhorQuando === 'alto' ? 'no mínimo' : 'no máximo'}
                    </span>
                    <input
                      value={c.minimo}
                      onChange={(e) => setCriterios((ls) => ls.map((x, k) => (k === i ? { ...x, minimo: e.target.value } : x)))}
                      placeholder="valor" inputMode="decimal" style={{ ...campo, width: 82 }}
                    />
                    <span style={{ fontSize: 11, color: colors.mutedDark }}>
                      {def.sufixo ?? (def.agregacao === 'soma' ? (baseEfetiva === 'quarenta' ? 'por 40 min' : 'por sessão') : '')}
                    </span>
                    <div onClick={() => setCriterios((ls) => ls.filter((_, k) => k !== i))} style={{ ...chip(false), marginLeft: 'auto' }}>
                      remover
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!banco.temMinutos && (
        <div style={{
          background: colors.goldSoft, borderLeft: `3px solid ${colors.gold}`, borderRadius: 3,
          padding: '12px 16px', fontSize: 12.5, lineHeight: 1.55,
        }}>
          <b>Lendo por sessão.</b> Nenhum minuto foi preenchido ainda, então não dá para
          normalizar por tempo — e quem joga a partida inteira leva vantagem sobre quem entra
          no segundo tempo. Preencha os minutos na escalação e a base por 40 fica disponível.
        </div>
      )}

      <div style={painel}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 800 }}>{resultados.length}</span>
          <span style={{ fontSize: 13, color: colors.muted }}>
            jogador{resultados.length === 1 ? '' : 'es'} de {bancoEfetivo.fichas.length} com histórico
          </span>
          {bancoEfetivo.semHistorico > 0 && (
            <span style={{ fontSize: 11.5, color: colors.mutedDark, marginLeft: 'auto' }}>
              {bancoEfetivo.semHistorico} cadastrado{bancoEfetivo.semHistorico === 1 ? '' : 's'} sem sessão ainda — fora da busca
            </span>
          )}
        </div>

        {resultados.length === 0 ? (
          <div style={{ fontSize: 13, color: colors.mutedDark, lineHeight: 1.55 }}>
            Nenhum jogador atende a todos os critérios. Afrouxe um deles — ou observe mais.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 720 }}>
              <thead>
                <tr>
                  {th('nome', 'Jogador')}
                  <th style={{ ...rotulo, color: colors.mutedDark, fontWeight: 600, padding: '0 8px 8px', textAlign: 'left' }}>Clube</th>
                  <th style={{ ...rotulo, color: colors.mutedDark, fontWeight: 600, padding: '0 8px 8px', textAlign: 'left' }}>Pos</th>
                  {th('idade', 'Idade', true)}
                  {th('sessoes', 'Sessões', true)}
                  {th('minutos', 'Min', true)}
                  {criterios.map((c, i) => th(c.key, defDe(c.key).label, true, `crit-${i}`))}
                  <th style={{ ...rotulo, color: colors.mutedDark, fontWeight: 600, padding: '0 0 8px 8px', textAlign: 'right' }}>Parecer</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((f) => (
                  <tr
                    key={f.jogador.id}
                    onClick={() => navigate(`/relatorio/${f.jogador.id}`)}
                    style={{ borderTop: `1px solid ${colors.rowBorder}`, cursor: 'pointer' }}
                  >
                    <td style={{ padding: '9px 8px 9px 8px' }}>
                      <span style={{ fontWeight: 600 }}>{f.jogador.nome}</span>
                      {f.jogador.numero !== undefined && (
                        <span style={{ color: colors.mutedDark, marginLeft: 6, fontSize: 11 }}>nº {f.jogador.numero}</span>
                      )}
                      {f.jogador.vinculo === 'observado' && (
                        <span style={{ ...rotulo, color: colors.blue, marginLeft: 8 }}>observado</span>
                      )}
                    </td>
                    <td style={{ padding: '9px 8px', color: colors.muted }}>{f.clube}</td>
                    <td style={{ padding: '9px 8px', color: colors.muted }}>{curtoPosicao(f.jogador.posicao)}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right', color: f.jogador.idade === undefined ? colors.mutedDark : colors.text }}>
                      {f.jogador.idade ?? '—'}
                    </td>
                    <td style={{ padding: '9px 8px', textAlign: 'right' }}>{f.sessoes}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right', color: f.minutos === 0 ? colors.mutedDark : colors.text }}>
                      {f.minutos || '—'}
                    </td>
                    {criterios.map((c, i) => {
                      const def = defDe(c.key);
                      const v = f.valores[c.key];
                      return (
                        <td key={`crit-${i}`} style={{ padding: '9px 8px', textAlign: 'right' }}>
                          {v === null ? (
                            <span style={{ color: colors.mutedDark }}>—</span>
                          ) : (
                            <>
                              <span style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 800 }}>
                                {v.toFixed(def.agregacao === 'soma' ? 2 : (def.decimais ?? 0))}{def.sufixo ?? ''}
                              </span>
                              <span style={{ color: colors.mutedDark, fontSize: 10.5, marginLeft: 5 }}>
                                {f.ranks[c.key]}º
                              </span>
                            </>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '9px 0 9px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {f.jogador.avaliacao?.recomendacao ? (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: f.jogador.avaliacao.recomendacao === 'nao-serve' ? colors.gold : colors.blue,
                        }}>
                          {RECOMENDACAO_LABEL[f.jogador.avaliacao.recomendacao]}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: colors.mutedDark }}>sem parecer</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ ...rotulo, color: colors.mutedDark, marginTop: 12 }}>
          Clique numa linha para abrir o relatório · º = posição no banco inteiro, não na lista filtrada
        </div>
      </div>
    </div>
  );
}

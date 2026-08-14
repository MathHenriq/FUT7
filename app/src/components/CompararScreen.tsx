import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, fontDisplay, rotulo } from '../colors';
import { curtoPosicao } from '../data';
import { POOL_MINIMO, useComparacao, type Base, type Escopo } from '../hooks/useComparacao';

/** Fixed slots, not a growing list. A player keeps the colour of the slot they
 *  were put in, so removing someone never repaints the ones who stayed — colour
 *  follows the player, never their position in the list. */
const SLOTS = 4;
const CORES = [colors.serie1, colors.serie2, colors.serie3, colors.serie4];

export default function CompararScreen() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<(string | null)[]>(() => new Array(SLOTS).fill(null));
  const [base, setBase] = useState<Base>('quarenta');
  const [escopo, setEscopo] = useState<Escopo>('todos');

  const ids = useMemo(() => slots.filter((s): s is string => s !== null), [slots]);
  const c = useComparacao(ids, base, escopo);

  // Per-40 needs minutes; without them the honest fallback is per-session.
  const baseEfetiva: Base = c.todosTemMinutos ? base : 'sessao';
  const escopoEfetivo: Escopo = c.posicaoViavel ? escopo : 'todos';
  const cEfetivo = useComparacao(ids, baseEfetiva, escopoEfetivo);

  const slotDe = (id: string) => slots.indexOf(id);

  function alternar(id: string) {
    setSlots((atual) => {
      const i = atual.indexOf(id);
      if (i >= 0) return atual.map((s, k) => (k === i ? null : s));
      const vago = atual.indexOf(null);
      if (vago < 0) return atual;
      return atual.map((s, k) => (k === vago ? id : s));
    });
  }

  const painel = {
    background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 3, padding: 20,
  } as const;

  const botao = (ativo: boolean, desabilitado = false) => ({
    padding: '7px 14px', borderRadius: 3, fontSize: 12, cursor: desabilitado ? 'default' : 'pointer',
    fontWeight: ativo ? 700 : 500,
    background: ativo ? colors.blueSofter : colors.chipBg,
    border: `1px solid ${ativo ? colors.blue : colors.chipBorder}`,
    color: desabilitado ? colors.mutedDark : ativo ? colors.text : colors.muted,
    opacity: desabilitado ? 0.55 : 1,
  });

  const sufixoBase = baseEfetiva === 'quarenta' ? 'por 40 min' : 'por sessão';

  return (
    <div style={{ padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180, margin: '0 auto' }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Comparar jogadores</div>
        <div style={{ fontSize: 13, color: colors.mutedDark, marginTop: 4, maxWidth: '70ch', lineHeight: 1.55 }}>
          Número isolado não diz se é bom. Aqui cada métrica é lida contra os outros jogadores
          com histórico — a barra é a posição no grupo, e o número ao lado é o valor de verdade.
        </div>
      </div>

      <div style={painel}>
        <div style={{ ...rotulo, color: colors.mutedDark, marginBottom: 10 }}>
          Quem comparar · até {SLOTS}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {c.elegiveis.map((j) => {
            const slot = slotDe(j.id);
            const escolhido = slot >= 0;
            const cheio = ids.length >= SLOTS && !escolhido;
            return (
              <div
                key={j.id}
                onClick={() => !cheio && alternar(j.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 3,
                  fontSize: 12.5, fontWeight: escolhido ? 700 : 500,
                  cursor: cheio ? 'default' : 'pointer',
                  background: escolhido ? colors.cardBgAlt : 'transparent',
                  border: `1px solid ${escolhido ? CORES[slot] : colors.chipBorder}`,
                  color: cheio ? colors.mutedDark : colors.text,
                  opacity: cheio ? 0.5 : 1,
                }}
              >
                <span style={{
                  width: 9, height: 9, borderRadius: 1, display: 'inline-block',
                  background: escolhido ? CORES[slot] : 'transparent',
                  border: escolhido ? 'none' : `1px solid ${colors.chipBorder}`,
                }} />
                {j.nome}
                <span style={{ color: colors.mutedDark, fontSize: 11 }}>{curtoPosicao(j.posicao)}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ ...rotulo, color: colors.mutedDark, marginRight: 6 }}>Base</span>
            <div onClick={() => c.todosTemMinutos && setBase('quarenta')} style={botao(baseEfetiva === 'quarenta', !c.todosTemMinutos)}>
              por 40 min
            </div>
            <div onClick={() => setBase('sessao')} style={botao(baseEfetiva === 'sessao')}>por sessão</div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ ...rotulo, color: colors.mutedDark, marginRight: 6 }}>Comparar contra</span>
            <div onClick={() => setEscopo('todos')} style={botao(escopoEfetivo === 'todos')}>
              elenco todo
            </div>
            <div onClick={() => c.posicaoViavel && setEscopo('posicao')} style={botao(escopoEfetivo === 'posicao', !c.posicaoViavel)}>
              mesma posição
            </div>
          </div>
        </div>
      </div>

      {ids.length === 0 ? (
        <div style={{ ...painel, fontSize: 13, color: colors.mutedDark }}>
          Escolha ao menos um jogador acima.
        </div>
      ) : (
        <>
          {!c.todosTemMinutos && (
            <Aviso>
              <b>Lendo por sessão, não por 40 minutos.</b> Sem os minutos preenchidos na escalação
              não dá para normalizar por tempo — e por sessão quem joga a partida inteira leva
              vantagem sobre quem entrou no segundo tempo. Preencha os minutos e a base por 40
              fica disponível.
            </Aviso>
          )}

          {cEfetivo.poolPequeno && (
            <Aviso>
              <b>Grupo de {cEfetivo.tamanhoPool} jogadores.</b> Com menos de {POOL_MINIMO},
              percentil vira precisão falsa — leia a posição ({cEfetivo.tamanhoPool > 1 ? `1º a ${cEfetivo.tamanhoPool}º` : 'único'}),
              não a porcentagem. A barra continua útil para ver a ordem.
            </Aviso>
          )}

          <div style={painel}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              {cEfetivo.linhas.map((l) => (
                <span key={l.jogador.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
                  <i style={{ width: 10, height: 10, borderRadius: 1, background: CORES[slotDe(l.jogador.id)], display: 'inline-block' }} />
                  <span style={{ fontWeight: 700 }}>{l.jogador.nome}</span>
                  <span style={{ color: colors.mutedDark, fontSize: 11 }}>
                    {l.sessoes} sessões{l.minutos > 0 ? ` · ${l.minutos} min` : ''}
                  </span>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cEfetivo.metricas.map((m, mi) => (
                <div
                  key={m.key}
                  className="cmp-linha"
                  style={{ borderTop: mi === 0 ? 'none' : `1px solid ${colors.rowBorder}` }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 10.5, color: colors.mutedDark, marginTop: 1 }}>
                      {m.agregacao === 'soma' ? sufixoBase : m.agregacao === 'media' ? 'média' : 'recorde'}
                      {m.melhorQuando === 'baixo' && ' · menos é melhor'}
                    </div>
                  </div>

                  <div className="cmp-barras">
                    {cEfetivo.linhas.map((l) => {
                      const cel = l.celulas[m.key];
                      const cor = CORES[slotDe(l.jogador.id)];
                      const larg = cel.percentil ?? 0;
                      return (
                        <div key={l.jogador.id} className="cmp-barra-linha">
                          <div className="cmp-trilho">
                            {cel.percentil !== null && (
                              <div style={{
                                width: `${Math.max(larg, 1.5)}%`, height: '100%', background: cor,
                                borderRadius: '2px 4px 4px 2px',
                              }} />
                            )}
                          </div>
                          <div className="cmp-valor" style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 800 }}>
                            {cel.valor === null
                              ? <span style={{ color: colors.mutedDark }}>—</span>
                              : `${cel.valor.toFixed(m.agregacao === 'soma' ? 2 : (m.decimais ?? 0))}${m.sufixo ?? ''}`}
                          </div>
                          <div className="cmp-rank" style={{ fontSize: 11, color: colors.mutedDark }}>
                            {cel.posicaoRank === null ? '' : `${cel.posicaoRank}º de ${cel.pool}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...rotulo, color: colors.mutedDark, marginTop: 14 }}>
              Barra = posição no grupo · número = valor
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {cEfetivo.linhas.map((l) => (
              <div
                key={l.jogador.id}
                onClick={() => navigate(`/jogador/${l.jogador.id}`)}
                style={{
                  padding: '8px 14px', border: `1px solid ${colors.chipBorder}`, borderRadius: 3,
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Perfil de {l.jogador.nome} ›
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: colors.goldSoft, borderLeft: `3px solid ${colors.gold}`, borderRadius: 3,
      padding: '12px 16px', fontSize: 12.5, lineHeight: 1.55,
    }}>
      {children}
    </div>
  );
}

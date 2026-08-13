import { useNavigate, useParams } from 'react-router-dom';
import { colors, fontDisplay, rotulo } from '../colors';
import { placarDaSessao } from '../data';
import MomentumChart from './MomentumChart';
import { useMomentum } from '../hooks/useMomentum';
import { useApp } from '../store';
import type { Lado } from '../types';

export default function SessaoScreen() {
  const { sessaoId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const m = useMomentum(sessaoId ?? '');
  const sessao = m.sessao;

  if (!sessao) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ fontSize: 14, color: colors.muted }}>Sessão não encontrada.</div>
        <div onClick={() => navigate('/sessoes')} style={{ marginTop: 12, color: colors.blue, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          ‹ Voltar para Sessões
        </div>
      </div>
    );
  }

  const nomeTime = (id: string | undefined, padrao: string) =>
    state.times.find((t) => t.id === id)?.nome ?? padrao;
  const nomeNos = nomeTime(sessao.timeAId ?? state.config.meuTimeId, state.config.nomeTime || 'Meu time');
  const nomeAdv = nomeTime(sessao.timeBId, 'Adversário');
  const placar = placarDaSessao(state.eventos, sessao.id);
  const nomeDoLado = (l: Lado) => (l === 'nos' ? nomeNos : nomeAdv);

  const painel = {
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 3,
    padding: 20,
  } as const;

  return (
    <div style={{ padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1180, margin: '0 auto' }}>
      <div onClick={() => navigate('/sessoes')} style={{ fontSize: 12, color: colors.mutedDark, cursor: 'pointer' }}>‹ Sessões</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{sessao.label}</div>
        {sessao.tipoSessao === 'partida' && (
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 800 }}>
            {placar.nos} — {placar.adversario}
          </div>
        )}
        <div style={{ ...rotulo, color: colors.mutedDark }}>
          {sessao.tipoSessao} · {sessao.data} · {m.totalEventos} eventos
        </div>
        <div
          onClick={() => navigate(`/registro/${sessao.id}`)}
          style={{
            marginLeft: 'auto', padding: '8px 16px', border: `1px solid ${colors.chipBorder}`,
            borderRadius: 3, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Marcar eventos
        </div>
      </div>

      <div style={painel}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Momento de ataque</div>
          <div style={{ fontSize: 12, color: colors.mutedDark, marginTop: 2, maxWidth: '68ch', lineHeight: 1.5 }}>
            Quem estava pressionando, minuto a minuto. Sai dos lances já registrados — finalização,
            cruzamento, lançamento, recuperação alta e posse no último terço — não de uma medição à parte.
          </div>
        </div>

        {m.temDados && m.cobertura.desequilibrada && (
          <div style={{
            marginTop: 14, background: colors.goldSoft, borderLeft: `3px solid ${colors.gold}`,
            borderRadius: 3, padding: '12px 16px', fontSize: 12.5, lineHeight: 1.55,
          }}>
            <b>Leia com ressalva.</b>{' '}
            Foram registrados {m.cobertura.nos} lances de {nomeNos} e {m.cobertura.adversario} de {nomeAdv}.
            Com essa diferença, o gráfico mostra sobretudo o que foi marcado — não necessariamente
            quem pressionou. Para o momento de ataque valer, os dois lados precisam ser marcados
            com o mesmo cuidado.
          </div>
        )}

        {m.temDados ? (
          <div style={{ marginTop: 14 }}>
            <MomentumChart
              pontos={m.pontos}
              gols={m.gols}
              duracao={m.duracao}
              nomeNos={nomeNos}
              nomeAdv={nomeAdv}
            />
          </div>
        ) : (
          <div style={{ marginTop: 14, fontSize: 13, color: colors.mutedDark, lineHeight: 1.55 }}>
            Ainda não há lances que contem como pressão nesta sessão. Registre finalizações,
            cruzamentos ou recuperações e o gráfico aparece.
          </div>
        )}
      </div>

      {m.temDados && (
        <div style={painel}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Como o jogo oscilou</div>
          {m.ondas.length === 0 ? (
            <div style={{ fontSize: 13, color: colors.mutedDark }}>
              Nenhum lado abriu vantagem clara de pressão — o jogo ficou equilibrado do começo ao fim.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {m.ondas.map((o, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'baseline', gap: 12, padding: '9px 0',
                    borderBottom: i === m.ondas.length - 1 ? 'none' : `1px solid ${colors.rowBorder}`,
                  }}
                >
                  {/* Shape as well as colour: the bar points up for us, down for them. */}
                  <span style={{
                    fontFamily: fontDisplay, fontSize: 15, fontWeight: 800, width: 18,
                    color: o.lado === 'nos' ? colors.blue : colors.gold,
                  }}>
                    {o.lado === 'nos' ? '▲' : '▼'}
                  </span>
                  <span style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 800, minWidth: 82 }}>
                    {o.inicio}&#8242;–{o.fim}&#8242;
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{nomeDoLado(o.lado)}</span>
                  <span style={{ fontSize: 12, color: colors.mutedDark, marginLeft: 'auto' }}>
                    {o.fim - o.inicio} min de pressão
                    {m.maiorOnda === o && ' · maior do jogo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

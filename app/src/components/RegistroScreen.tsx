import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { colors, fontDisplay } from '../colors';
import {
  aplicarPasso, curtoPosicao, eventButtons, formatClock, formatMinuto, labelTipo, linhasDaGrade,
  passoPreenchido, placarDaSessao, resumoEvento, stepsPara, stepTitles,
} from '../data';
import { useEventOptions } from '../hooks/useEventOptions';
import { useApp } from '../store';
import CampoSeletor from './CampoSeletor';
import VideoPlayer, { type MarcadorVideo } from './VideoPlayer';
import { ExerciciosBar, MetricasFisicas, ResumoExercicios } from './TreinoPainel';
import { StepCardColor, StepGrid, StepList } from './OptionPickers';
import type { EventButton, EventoRegistrado, FlowData, FlowState, Lado, StepName } from '../types';

const emptyFlow: FlowState = { botao: null, lado: 'nos', stepIndex: 0, data: {} };

export default function RegistroScreen() {
  const { sessaoId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, saveEvento, updateEvento, deleteEvento } = useApp();
  const sessao = state.sessoes.find((s) => s.id === sessaoId);

  useEffect(() => {
    if (sessaoId) dispatch({ type: 'SET_CURRENT_SESSAO', id: sessaoId });
  }, [sessaoId, dispatch]);

  const [flow, setFlow] = useState<FlowState>(emptyFlow);
  const [lado, setLado] = useState<Lado>('nos');
  const [minutoDraft, setMinutoDraft] = useState('1');
  const [escalacaoAberta, setEscalacaoAberta] = useState(false);
  const [videoSegundo, setVideoSegundo] = useState(0);
  const [relogio, setRelogio] = useState(0);
  const [relogioAtivo, setRelogioAtivo] = useState(false);
  const [exercicioAtivo, setExercicioAtivo] = useState<string | null>(null);

  const ehVideo = sessao?.modoRegistro === 'video';
  const ehTreino = sessao?.tipoSessao === 'treino';

  useEffect(() => {
    if (!relogioAtivo) return;
    const id = setInterval(() => setRelogio((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [relogioAtivo]);

  const jogadoresDaSessao = useMemo(() => {
    if (!sessao) return [];
    const escalados = state.jogadores.filter((j) => sessao.escalacao.includes(j.id));
    return escalados.length > 0 ? escalados : state.jogadores.filter((j) => j.ativo);
  }, [sessao, state.jogadores]);

  /** Match minute derived from where we are in the tape, once kickoff is marked. */
  const minutoDoVideo = useCallback(() => {
    const off = sessao?.videoOffsetSegundos ?? 0;
    return Math.max(0, Math.floor((videoSegundo - off) / 60));
  }, [sessao?.videoOffsetSegundos, videoSegundo]);

  const avancar = useCallback((step: StepName, data: FlowData) => {
    const botao = flow.botao;
    if (!botao) return;
    const seq = stepsPara(botao.tipo, flow.lado, data);
    const idx = seq.indexOf(step);
    if (idx === seq.length - 1) {
      // Side effect (dispatch) must happen outside setFlow's updater, never inside it —
      // React may invoke updater functions during render to check purity (esp. under StrictMode).
      if (flow.editingId) {
        updateEvento(flow.editingId, botao.tipo, flow.lado, flow.minuto ?? 0, data);
      } else {
        saveEvento(sessaoId as string, botao.tipo, flow.lado, flow.minuto ?? 0, data, {
          origem: ehVideo ? 'manual' : 'ao-vivo',
          videoSegundo: ehVideo ? videoSegundo : undefined,
          exercicioId: exercicioAtivo ?? undefined,
        });
      }
      setFlow({ ...flow, data, stepIndex: 'saved' });
      return;
    }
    setFlow({ ...flow, data, stepIndex: idx + 1 });
  }, [flow, saveEvento, updateEvento, sessaoId, ehVideo, videoSegundo, exercicioAtivo]);

  const select = useCallback(
    (step: StepName, value: string | number) => avancar(step, aplicarPasso(flow.data, step, value)),
    [avancar, flow.data],
  );

  const pickCoord = useCallback((step: StepName, x: number, y: number) => {
    const data: FlowData = step === 'localFim'
      ? { ...flow.data, x2: x, y2: y }
      : { ...flow.data, x, y };
    avancar(step, data);
  }, [avancar, flow.data]);

  const options = useEventOptions(flow.data, jogadoresDaSessao, select);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName || '';
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'escape') { goBack(); return; }
      if (k === 'a' && !flow.botao) { setLado((l) => (l === 'nos' ? 'adversario' : 'nos')); return; }
      const botao = eventButtons.find((b) => b.shortcut.toLowerCase() === k);
      if (botao && !flow.botao) startBotao(botao);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.botao, lado, videoSegundo, sessao?.videoOffsetSegundos, relogio]);

  if (!sessao) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ fontSize: 14, color: colors.muted }}>Sessão não encontrada.</div>
        <div onClick={() => navigate('/sessoes')} style={{ marginTop: 12, color: colors.blue, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>‹ Voltar para Sessões</div>
      </div>
    );
  }

  function primeiroPassoPendente(b: EventButton, l: Lado, data: FlowData): number {
    const seq = stepsPara(b.tipo, l, data);
    let i = 0;
    while (i < seq.length && passoPreenchido(seq[i], data)) i++;
    return Math.min(i, seq.length - 1);
  }

  function startBotao(b: EventButton) {
    const data: FlowData = { ...(b.preset ?? {}) };
    const inicio = primeiroPassoPendente(b, lado, data);
    if (ehVideo) {
      // The tape already knows when this happened; no reason to ask.
      setFlow({ botao: b, lado, stepIndex: inicio, data, minuto: minutoDoVideo() });
    } else {
      setMinutoDraft(String(Math.floor(relogio / 60)));
      setFlow({ botao: b, lado, stepIndex: 'minuto', data });
    }
  }

  function confirmMinuto() {
    const m = Math.max(0, Math.min(120, Number(minutoDraft) || 0));
    setFlow((f) => ({ ...f, stepIndex: f.botao ? primeiroPassoPendente(f.botao, f.lado, f.data) : 0, minuto: m }));
  }

  function goBack() {
    if (!flow.botao) return;
    if (flow.stepIndex === 'saved' || flow.stepIndex === 'minuto') { setFlow(emptyFlow); return; }
    if (flow.stepIndex === 0) {
      if (!ehVideo && !flow.editingId) { setFlow((f) => ({ ...f, stepIndex: 'minuto' })); return; }
      setFlow(emptyFlow);
      return;
    }
    setFlow((f) => ({ ...f, stepIndex: (f.stepIndex as number) - 1 }));
  }

  function startEdit(evento: EventoRegistrado) {
    const botao = eventButtons.find((b) => b.tipo === evento.tipo && !b.preset)
      ?? eventButtons.find((b) => b.tipo === evento.tipo)!;
    setLado(evento.lado);
    setFlow({ botao, lado: evento.lado, stepIndex: 0, data: evento.data, minuto: evento.minuto, editingId: evento.id });
    setMinutoDraft(String(evento.minuto));
  }

  function removeEvento(id: string) {
    if (window.confirm('Excluir este evento registrado?')) deleteEvento(id);
  }

  function toggleEscalado(jogadorId: string) {
    const atual = sessao!.escalacao;
    const nova = atual.includes(jogadorId) ? atual.filter((id) => id !== jogadorId) : [...atual, jogadorId];
    dispatch({ type: 'SET_ESCALACAO', sessaoId: sessao!.id, escalacao: nova });
  }

  const seq = flow.botao ? stepsPara(flow.botao.tipo, flow.lado, flow.data) : [];
  const currentStep: StepName | null = flow.stepIndex !== 'saved' && flow.stepIndex !== 'minuto' && flow.botao
    ? seq[flow.stepIndex as number] ?? null : null;
  const eventos = state.eventos.filter((e) => e.sessaoId === sessao.id).sort((a, b) => b.criadoEm - a.criadoEm);
  const placar = placarDaSessao(state.eventos, sessao.id);
  const corLado = (l: Lado) => (l === 'nos' ? colors.blue : colors.gold);

  const marcadores: MarcadorVideo[] = eventos
    .filter((e) => e.videoSegundo !== undefined)
    .map((e) => ({
      id: e.id,
      segundo: e.videoSegundo as number,
      cor: corLado(e.lado),
      titulo: `${labelTipo(e.tipo)} · ${formatMinuto(e.minuto)}`,
    }));

  const apitoMarcado = sessao.videoOffsetSegundos !== undefined;

  return (
    <div className="registro-page">
      <div onClick={() => navigate('/sessoes')} style={{ fontSize: 12, color: colors.muted, cursor: 'pointer' }}>‹ Sessões</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{sessao.label}</div>
        <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 800 }}>
          {placar.nos} <span style={{ color: colors.mutedDark }}>—</span> {placar.adversario}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 5,
          background: ehVideo ? colors.goldSoft : colors.blueSoft, color: ehVideo ? colors.gold : colors.blue,
        }}>
          {ehVideo ? 'VÍDEO' : 'AO VIVO'}
        </div>
        <div style={{ fontSize: 12, color: colors.mutedDark }}>
          {sessao.tipoSessao === 'partida' ? 'Partida' : 'Treino'} · {sessao.data}
        </div>
        <div onClick={() => setEscalacaoAberta((o) => !o)} style={{ fontSize: 12, color: colors.blue, cursor: 'pointer', fontWeight: 600 }}>
          Escalação: {sessao.escalacao.length} {escalacaoAberta ? '▲' : '▼'}
        </div>
      </div>

      {escalacaoAberta && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {state.jogadores.filter((j) => j.ativo).map((j) => {
            const escalado = sessao.escalacao.includes(j.id);
            return (
              <div key={j.id} onClick={() => toggleEscalado(j.id)} style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: escalado ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${escalado ? colors.blue : colors.chipBorder}`,
                color: escalado ? colors.text : colors.muted,
              }}>
                {j.numero !== undefined ? `${j.numero} · ` : ''}{j.nome}
                <span style={{ color: colors.mutedDark, marginLeft: 6, fontSize: 11 }}>{curtoPosicao(j.posicao)}</span>
              </div>
            );
          })}
          {state.jogadores.filter((j) => j.ativo).length === 0 && (
            <div style={{ fontSize: 13, color: colors.mutedDark }}>
              Nenhum jogador no elenco. <span onClick={() => navigate('/elenco')} style={{ color: colors.blue, cursor: 'pointer' }}>Cadastrar elenco</span>
            </div>
          )}
        </div>
      )}

      {ehTreino && (
        <ExerciciosBar sessaoId={sessao.id} ativoId={exercicioAtivo} onSelecionar={setExercicioAtivo} />
      )}

      <div className="registro-top">
        {ehVideo ? (
          <div className="registro-video-col" style={{ border: 'none', background: 'none' }}>
            <VideoPlayer
              sessaoId={sessao.id}
              metaSalva={sessao.video}
              marcadores={marcadores}
              onMetaChange={(v) => dispatch({ type: 'SET_VIDEO_META', sessaoId: sessao.id, video: v })}
              onTempo={setVideoSegundo}
            />
            {sessao.video && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap',
                fontSize: 12, color: colors.mutedDark,
              }}>
                <div
                  onClick={() => dispatch({ type: 'SET_VIDEO_OFFSET', sessaoId: sessao.id, segundos: videoSegundo })}
                  style={{
                    padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    background: apitoMarcado ? colors.chipBg : colors.blueSofter,
                    border: `1px solid ${apitoMarcado ? colors.chipBorder : colors.blue}`,
                    color: apitoMarcado ? colors.muted : colors.text,
                  }}
                >
                  {apitoMarcado ? 'Remarcar apito inicial' : 'Marcar apito inicial'}
                </div>
                {apitoMarcado ? (
                  <span>
                    Apito em {formatClock(sessao.videoOffsetSegundos as number)} · o lance atual é{' '}
                    <strong style={{ color: colors.text }}>{formatMinuto(minutoDoVideo())}</strong> de jogo
                  </span>
                ) : (
                  <span>Leve o vídeo até o apito inicial e marque, para o minuto de jogo sair certo.</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
            background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, letterSpacing: 0.4 }}>CRONÔMETRO</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 800, letterSpacing: 1, minWidth: 84 }}>
              {formatClock(relogio)}
            </div>
            <div onClick={() => setRelogioAtivo((r) => !r)} style={{
              padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              background: relogioAtivo ? colors.chipBg : colors.blue,
              border: `1px solid ${relogioAtivo ? colors.chipBorder : colors.blue}`,
              color: relogioAtivo ? colors.text : '#0a0e13',
            }}>
              {relogioAtivo ? 'Pausar' : 'Iniciar'}
            </div>
            <div onClick={() => { setRelogio(0); setRelogioAtivo(false); }} style={{
              padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer',
              background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, color: colors.muted,
            }}>
              Zerar
            </div>
            <div style={{ fontSize: 11, color: colors.mutedDark }}>
              O minuto do evento já vem preenchido daqui — dá pra corrigir na hora.
            </div>
          </div>
        )}

        <div className="registro-shortcuts">
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 2 }}>ATALHOS</div>
          {eventButtons.map((b) => (
            <div key={b.key} onClick={() => startBotao(b)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: colors.cardBgDense,
              border: `1px solid ${colors.borderAlt}`, borderRadius: 10, cursor: 'pointer',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: colors.chipBg, border: `1px solid ${colors.borderStrong}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: colors.blue,
              }}>{b.shortcut}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginTop: 2, color: colors.mutedDark, fontSize: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: colors.cardBgDense, border: `1px solid ${colors.borderAlt}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>A</div>
            <div>Alternar time</div>
          </div>
        </div>
      </div>

      <div className="registro-main">
        <div className="registro-capture">
          <div className="registro-grabber" />

          {!flow.botao && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['nos', 'adversario'] as Lado[]).map((l) => (
                  <div key={l} onClick={() => setLado(l)} style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700,
                    background: lado === l ? (l === 'nos' ? colors.blueSofter : colors.goldSoft) : colors.chipBg,
                    border: `1px solid ${lado === l ? corLado(l) : colors.chipBorder}`,
                    color: lado === l ? colors.text : colors.muted,
                  }}>
                    {l === 'nos' ? state.config.nomeTime : 'Adversário'}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {eventButtons.map((b) => (
                  <div key={b.key} onClick={() => startBotao(b)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px',
                    background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, borderRadius: 14, cursor: 'pointer',
                    minHeight: 88, justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                      background: lado === 'nos' ? colors.blueSoft : colors.goldSoft, color: corLado(lado),
                    }}>{b.mono}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, textAlign: 'center' }}>{b.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {flow.botao && flow.stepIndex === 'minuto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={goBack} style={{ fontSize: 13, color: colors.muted, cursor: 'pointer' }}>‹ Voltar</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{flow.botao.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: corLado(flow.lado) }}>
                  {flow.lado === 'nos' ? state.config.nomeTime : 'Adversário'}
                </div>
              </div>
              <div style={{ fontSize: 12, color: colors.muted, fontWeight: 600 }}>MINUTO DO EVENTO</div>
              <input
                type="number" className="minuto-input" value={minutoDraft} min={0} max={120} autoFocus
                onChange={(e) => setMinutoDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmMinuto(); }}
              />
              <div onClick={confirmMinuto} style={{ padding: '12px 24px', background: colors.blue, color: '#0a0e13', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'center' }}>
                Confirmar
              </div>
            </div>
          )}

          {flow.botao && currentStep && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={goBack} style={{ fontSize: 13, color: colors.muted, cursor: 'pointer' }}>‹ Voltar</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {flow.botao.label}{flow.minuto !== undefined ? ` · ${formatMinuto(flow.minuto)}` : ''}{flow.editingId ? ' (editando)' : ''}
                </div>
                <div style={{ fontSize: 12, color: colors.mutedDark }}>{seq.indexOf(currentStep) + 1} / {seq.length}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: -6, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: colors.muted, fontWeight: 600 }}>{stepTitles[currentStep]}</div>
                <div style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                  background: flow.lado === 'nos' ? colors.blueSoft : colors.goldSoft, color: corLado(flow.lado),
                }}>
                  {flow.lado === 'nos' ? state.config.nomeTime.toUpperCase() : 'ADVERSÁRIO'}
                </div>
              </div>
              {currentStep === 'local' && (
                <CampoSeletor
                  cols={3}
                  rows={linhasDaGrade(state.config.gradeZonas)}
                  valor={flow.data.x !== undefined ? { x: flow.data.x, y: flow.data.y as number } : undefined}
                  onPick={(x, y) => pickCoord('local', x, y)}
                />
              )}
              {currentStep === 'localFim' && (
                <CampoSeletor
                  cols={3}
                  rows={linhasDaGrade(state.config.gradeZonas)}
                  origem={flow.data.x !== undefined ? { x: flow.data.x, y: flow.data.y as number } : undefined}
                  valor={flow.data.x2 !== undefined ? { x: flow.data.x2, y: flow.data.y2 as number } : undefined}
                  onPick={(x, y) => pickCoord('localFim', x, y)}
                />
              )}
              {currentStep === 'resultadoFin' && <StepGrid items={options.resultadoFinItems} />}
              {currentStep === 'detail' && <StepGrid items={options.detailItems} />}
              {currentStep === 'origin' && <StepGrid items={options.originItems} />}
              {currentStep === 'scorer' && <StepList items={options.scorerItems} />}
              {currentStep === 'assist' && <StepList items={options.assistItems} />}
              {currentStep === 'goleiro' && <StepList items={options.goleiroItems} />}
              {currentStep === 'cardColor' && <StepCardColor items={options.cardColorItems} />}
              {currentStep === 'player' && <StepList items={options.playerItems} />}
              {currentStep === 'resultado' && <StepGrid items={options.resultadoItems} />}
              {currentStep === 'comoPerdeu' && <StepGrid items={options.comoPerdeuItems} />}
              {currentStep === 'comoRecuperou' && <StepGrid items={options.comoRecuperouItems} />}
              {currentStep === 'faltaTipo' && <StepGrid items={options.faltaTipoItems} />}
            </div>
          )}

          {flow.botao && flow.stepIndex === 'saved' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '10px 0', animation: 'popIn 220ms ease-out' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: flow.lado === 'nos' ? colors.blueSoft : colors.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 10, borderLeft: `3px solid ${corLado(flow.lado)}`, borderBottom: `3px solid ${corLado(flow.lado)}`, transform: 'rotate(-45deg) translate(2px,-2px)' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{flow.editingId ? 'Alterações salvas' : 'Salvo'}</div>
              <div style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
                {flow.minuto !== undefined ? `${formatMinuto(flow.minuto)} · ` : ''}
                {resumoEvento(
                  {
                    id: '', sessaoId: '', tipo: flow.botao.tipo, lado: flow.lado, minuto: flow.minuto ?? 0,
                    origem: ehVideo ? 'manual' : 'ao-vivo', data: flow.data, criadoEm: 0,
                  },
                  state.jogadores,
                )}
              </div>
              <div onClick={() => setFlow(emptyFlow)} style={{ marginTop: 4, padding: '12px 24px', background: colors.blue, color: '#0a0e13', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Novo registro
              </div>
            </div>
          )}
        </div>

        <div className="registro-log">
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, letterSpacing: 0.4, marginBottom: 10 }}>
            EVENTOS DA SESSÃO <span style={{ color: colors.mutedDark }}>({eventos.length})</span>
          </div>
          {eventos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eventos.map((e) => (
                <div key={e.id} style={{
                  background: colors.cardBg, border: `1px solid ${colors.logBorder}`, borderRadius: 10,
                  padding: '10px 12px', borderLeft: `3px solid ${corLado(e.lado)}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.mutedDark, marginBottom: 4, gap: 8 }}>
                    <span>
                      {labelTipo(e.tipo)} · {formatMinuto(e.minuto)}
                      <span style={{ color: corLado(e.lado), fontWeight: 700, marginLeft: 6 }}>
                        {e.lado === 'nos' ? state.config.nomeTime : 'Adversário'}
                      </span>
                      {e.origem === 'ia' && (
                        <span style={{ marginLeft: 6, color: colors.gold, fontWeight: 700 }}>IA</span>
                      )}
                      {e.exercicioId && (
                        <span style={{ marginLeft: 6, color: colors.mutedDark }}>
                          · {state.exercicios.find((x) => x.id === e.exercicioId)?.nome ?? 'exercício'}
                        </span>
                      )}
                    </span>
                    <span style={{ display: 'flex', gap: 10 }}>
                      <span onClick={() => startEdit(e)} style={{ cursor: 'pointer', color: colors.blue }}>editar</span>
                      <span onClick={() => removeEvento(e.id)} style={{ cursor: 'pointer', color: colors.gold }}>excluir</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.mutedLight }}>{resumoEvento(e, state.jogadores)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: colors.mutedDark }}>Nenhum evento registrado ainda.</div>
          )}
        </div>
      </div>

      {ehTreino && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <ResumoExercicios sessaoId={sessao.id} />
          <MetricasFisicas sessaoId={sessao.id} jogadores={jogadoresDaSessao} />
        </div>
      )}
    </div>
  );
}

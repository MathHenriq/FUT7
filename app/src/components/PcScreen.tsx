import { colors, fontDisplay } from '../colors';
import { eventTypesMeta, formatTime } from '../data';
import { useFlow, type FlowOption } from '../hooks/useFlow';
import { useApp } from '../store';
import type { StepName } from '../types';

function chipStyle(selected: boolean, opts?: { onBg?: string; onBorder?: string }) {
  return {
    background: selected ? (opts?.onBg ?? colors.blueSofter) : colors.chipBg,
    border: `1px solid ${selected ? (opts?.onBorder ?? colors.blue) : colors.chipBorder}`,
  };
}

function StepZone({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, maxWidth: 340 }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={{
          padding: '10px 6px', textAlign: 'center', fontSize: 10, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
          ...chipStyle(item.selected),
        }}>{item.label}</div>
      ))}
    </div>
  );
}

function StepWrap({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={{
          padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', ...chipStyle(item.selected),
        }}>{item.label}</div>
      ))}
    </div>
  );
}

function StepList({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          ...chipStyle(item.selected, item.key === 'none' ? { onBg: colors.goldSoft, onBorder: colors.gold } : undefined),
        }}>{item.label}</div>
      ))}
    </div>
  );
}

function StepCardColor({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
          ...chipStyle(item.selected),
        }}>
          <div style={{ width: 12, height: 16, borderRadius: 2, background: item.dot }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function StepResultado({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={{
          padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          ...chipStyle(item.selected, item.key === 'errado' ? { onBg: colors.goldSoft, onBorder: colors.gold } : undefined),
        }}>{item.label}</div>
      ))}
    </div>
  );
}

function FlowStepBody({ step, f }: { step: StepName; f: ReturnType<typeof useFlow> }) {
  return (
    <>
      {step === 'zone' && <StepZone items={f.zoneItems} />}
      {step === 'detail' && <StepWrap items={f.detailItems} />}
      {step === 'origin' && <StepWrap items={f.originItems} />}
      {step === 'scorer' && <StepList items={f.scorerItems} />}
      {step === 'assist' && <StepList items={f.assistItems} />}
      {step === 'cardColor' && <StepCardColor items={f.cardColorItems} />}
      {step === 'player' && <StepList items={f.playerItems} />}
      {step === 'resultado' && <StepResultado items={f.resultadoItems} />}
    </>
  );
}

export default function PcScreen() {
  const { state, dispatch } = useApp();
  const f = useFlow('pc');
  const log = state.pcLog;
  const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, background: colors.cardBgAlt, border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ height: 420, position: 'relative', background: 'linear-gradient(160deg,#0e1620,#161f2b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 13, fontWeight: 700, color: colors.muted }}>CÂMERA PRINCIPAL</div>
            <div onClick={togglePlay} style={{
              width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <div style={{ width: 0, height: 0, borderLeft: '22px solid #eef2f6', borderTop: '14px solid transparent', borderBottom: '14px solid transparent', marginLeft: 4 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderTop: `1px solid ${colors.border}` }}>
            <div onClick={togglePlay} style={{ fontSize: 13, fontWeight: 700, color: colors.blue, cursor: 'pointer', width: 70 }}>
              {state.pcPlaying ? 'Pausar' : 'Reproduzir'}
            </div>
            <div style={{ flex: 1, height: 4, background: colors.borderAlt, borderRadius: 2 }}>
              <div style={{ width: '38%', height: '100%', background: colors.blue, borderRadius: 2 }} />
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, letterSpacing: 0.5, minWidth: 60, textAlign: 'right' }}>
              {formatTime(state.pcSeconds)}
            </div>
          </div>
        </div>
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 2 }}>ATALHOS</div>
          {eventTypesMeta.map((et) => (
            <div key={et.key} onClick={() => f.onStart(et.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: colors.cardBgDense,
              border: `1px solid ${colors.borderAlt}`, borderRadius: 10, cursor: 'pointer',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6, background: colors.chipBg, border: `1px solid ${colors.borderStrong}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: colors.blue,
              }}>{et.shortcut}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{et.label}</div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginTop: 2, color: colors.mutedDark, fontSize: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: colors.cardBgDense, border: `1px solid ${colors.borderAlt}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>␣</div>
            <div>Play / Pause</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, background: colors.cardBgAlt, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '16px 18px', minHeight: 120 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 10 }}>REGISTRO DE EVENTO</div>

          {f.idle && <div style={{ fontSize: 13, color: colors.mutedDark }}>Pressione uma tecla de atalho ou clique em um evento à direita.</div>}

          {f.flowActive && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div onClick={f.onBack} style={{ fontSize: 12, color: colors.muted, cursor: 'pointer' }}>‹ Voltar (Esc)</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{f.eventTypeLabel}</div>
                <div style={{ fontSize: 12, color: colors.mutedDark }}>{f.stepDisplay}</div>
              </div>
              {f.currentStep && <FlowStepBody step={f.currentStep} f={f} />}
            </div>
          )}

          {f.saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'popIn 220ms ease-out' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: colors.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 14, height: 9, borderLeft: `2px solid ${colors.blue}`, borderBottom: `2px solid ${colors.blue}`, transform: 'rotate(-45deg) translate(1px,-1px)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Salvo — {f.flow.savedEntry?.summary}</div>
              </div>
              <div onClick={f.onNew} style={{ padding: '8px 16px', background: colors.blue, color: '#0a0e13', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Novo</div>
            </div>
          )}
        </div>

        <div style={{ width: 360, background: colors.cardBgAlt, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '16px 18px', maxHeight: 360, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 10 }}>LOG DA PARTIDA</div>
          {log.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {log.map((e) => (
                <div key={e.id} style={{
                  display: 'grid', gridTemplateColumns: '44px 40px 1fr', gap: 8, alignItems: 'center',
                  padding: '8px 0', borderBottom: `1px solid ${colors.rowBorder}`, fontSize: 12,
                }}>
                  <div style={{ color: colors.mutedDark, fontFamily: fontDisplay, fontWeight: 700 }}>{e.time}</div>
                  <div style={{ color: colors.blue, fontWeight: 700 }}>{e.typeMono}</div>
                  <div style={{ color: colors.mutedLight }}>{e.summary}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: colors.mutedDark }}>Nenhum evento registrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}

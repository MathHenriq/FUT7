import type { CSSProperties } from 'react';
import { colors } from '../colors';
import { eventTypesMeta, stepTitles } from '../data';
import { useFlow, type FlowOption } from '../hooks/useFlow';
import { useApp } from '../store';
import type { StepName } from '../types';

const gridChip = (selected: boolean): CSSProperties => ({
  padding: '18px 10px', borderRadius: 12, textAlign: 'center', fontSize: 14, fontWeight: 600,
  cursor: 'pointer', background: selected ? colors.blueSofter : colors.chipBg,
  border: `1px solid ${selected ? colors.blue : colors.chipBorder}`,
});

const listChip = (selected: boolean, isNone = false): CSSProperties => ({
  padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600,
  background: selected ? (isNone ? colors.goldSoft : colors.blueSofter) : colors.chipBg,
  border: `1px solid ${selected ? (isNone ? colors.gold : colors.blue) : colors.chipBorder}`,
});

function StepGrid({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={gridChip(item.selected)}>{item.label}</div>
      ))}
    </div>
  );
}

function StepList({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={listChip(item.selected, item.key === 'none')}>{item.label}</div>
      ))}
    </div>
  );
}

function StepZone({ items }: { items: FlowOption[] }) {
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: 6,
        height: 230, background: colors.cardBgAlt, border: `1px solid ${colors.borderAlt}`, borderRadius: 12, padding: 8,
      }}>
        {items.map((item) => (
          <div key={item.key} onClick={item.onClick} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            fontSize: 10, fontWeight: 600, color: colors.mutedLight, padding: 4, borderRadius: 8, cursor: 'pointer',
            background: item.selected ? colors.blueSofter : colors.chipBg,
            border: `1px solid ${item.selected ? colors.blue : colors.chipBorder}`,
          }}>{item.label}</div>
        ))}
      </div>
      <div style={{ height: 8, background: colors.blue, borderRadius: '0 0 8px 8px', marginTop: 4, opacity: 0.4 }} />
    </div>
  );
}

function StepCardColor({ items }: { items: FlowOption[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map((item) => (
        <div key={item.key} onClick={item.onClick} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px', borderRadius: 12,
          cursor: 'pointer', background: item.selected ? colors.blueSofter : colors.chipBg,
          border: `1px solid ${item.selected ? colors.blue : colors.chipBorder}`,
        }}>
          <div style={{ width: 18, height: 24, borderRadius: 2, background: item.dot }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function FlowStepBody({ step, f }: { step: StepName; f: ReturnType<typeof useFlow> }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8, fontWeight: 600 }}>{stepTitles[step]}</div>
      {step === 'zone' && <StepZone items={f.zoneItems} />}
      {step === 'detail' && <StepGrid items={f.detailItems} />}
      {step === 'origin' && <StepGrid items={f.originItems} />}
      {step === 'scorer' && <StepList items={f.scorerItems} />}
      {step === 'assist' && <StepList items={f.assistItems} />}
      {step === 'cardColor' && <StepCardColor items={f.cardColorItems} />}
      {step === 'player' && <StepList items={f.playerItems} />}
      {step === 'resultado' && <StepGrid items={f.resultadoItems} />}
    </div>
  );
}

export default function MobileScreen() {
  const { state } = useApp();
  const f = useFlow('mobile');
  const log = state.mobileLog;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 40, padding: '40px 24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ width: 380, background: '#000', borderRadius: 40, padding: 14, boxShadow: '0 30px 60px rgba(0,0,0,0.5)', flexShrink: 0 }}>
        <div style={{ width: '100%', height: 800, background: '#0a0e13', borderRadius: 28, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative', background: 'linear-gradient(160deg,#0e1620,#161f2b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.muted, fontWeight: 600 }}>
              <div>AO VIVO · 34:12</div>
              <div style={{ color: colors.text }}>TIME A 2 — 1 TIME B</div>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ width: 0, height: 0, borderLeft: '20px solid #eef2f6', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', marginLeft: 4 }} />
            </div>
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
              <div style={{ width: '46%', height: '100%', background: colors.blue, borderRadius: 2 }} />
            </div>
          </div>

          <div style={{ background: '#11161c', borderTop: '1px solid #232d38', borderRadius: '20px 20px 0 0', padding: '18px 16px 22px', minHeight: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 36, height: 4, background: '#2b3644', borderRadius: 2, margin: '0 auto' }} />

            {f.idle && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {eventTypesMeta.map((et) => (
                  <div key={et.key} onClick={() => f.onStart(et.key)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px',
                    background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, borderRadius: 14, cursor: 'pointer',
                    minHeight: 88, justifyContent: 'center',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: colors.blueSoft, color: colors.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{et.mono}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{et.label}</div>
                  </div>
                ))}
              </div>
            )}

            {f.flowActive && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div onClick={f.onBack} style={{ fontSize: 13, color: colors.muted, cursor: 'pointer' }}>‹ Voltar</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{f.eventTypeLabel}</div>
                  <div style={{ fontSize: 12, color: colors.mutedDark }}>{f.stepDisplay}</div>
                </div>
                {f.currentStep && <FlowStepBody step={f.currentStep} f={f} />}
              </div>
            )}

            {f.saved && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0', animation: 'popIn 260ms ease-out' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: colors.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 12, borderLeft: `3px solid ${colors.blue}`, borderBottom: `3px solid ${colors.blue}`, transform: 'rotate(-45deg) translate(2px,-2px)' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Salvo</div>
                <div style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>{f.flow.savedEntry?.summary}</div>
                <div onClick={f.onNew} style={{ marginTop: 6, padding: '12px 24px', background: colors.blue, color: '#0a0e13', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Novo registro</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.muted, letterSpacing: 0.4 }}>ÚLTIMOS REGISTROS</div>
        {log.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {log.map((e) => (
              <div key={e.id} style={{ background: colors.cardBg, border: `1px solid ${colors.logBorder}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.mutedDark, marginBottom: 4 }}>
                  <span>{e.typeLabel}</span><span>{e.time}</span>
                </div>
                <div style={{ fontSize: 12, color: colors.mutedLight }}>{e.summary}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: colors.mutedDark }}>Nenhum evento registrado ainda.</div>
        )}
      </div>
    </div>
  );
}

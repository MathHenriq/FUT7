import { useCallback, useEffect, useRef, useState } from 'react';
import { colors, fontDisplay } from '../colors';
import { carregarVideo, espacoDisponivel, formatarTamanho, removerVideo, salvarVideo } from '../video';
import type { VideoMeta } from '../video';

const VELOCIDADES = [0.25, 0.5, 1, 2, 3];
/** One frame at 30fps — the step size that makes frame-accurate tagging possible. */
const PASSO_FRAME = 1 / 30;

export interface MarcadorVideo {
  id: string;
  segundo: number;
  cor: string;
  titulo: string;
}

interface Props {
  sessaoId: string;
  metaSalva?: VideoMeta;
  marcadores: MarcadorVideo[];
  onMetaChange: (meta: VideoMeta | undefined) => void;
  /** Reports the current position so the capture flow can stamp events with it. */
  onTempo: (segundo: number) => void;
  onMarcadorClick?: (id: string) => void;
}

function formatarTempo(seg: number): string {
  if (!Number.isFinite(seg)) return '0:00';
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = Math.floor(seg % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoPlayer({
  sessaoId, metaSalva, marcadores, onMetaChange, onTempo, onMarcadorClick,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const [src, setSrc] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | undefined>(metaSalva);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [velocidade, setVelocidade] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const liberarUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // Reload the stored file whenever the session changes.
  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    carregarVideo(sessaoId).then((r) => {
      if (cancelado) return;
      liberarUrl();
      if (r) {
        const url = URL.createObjectURL(r.blob);
        urlRef.current = url;
        setSrc(url);
        setMeta(r.meta);
      } else {
        setSrc(null);
        setMeta(undefined);
      }
      setCarregando(false);
    });
    return () => { cancelado = true; };
  }, [sessaoId, liberarUrl]);

  useEffect(() => liberarUrl, [liberarUrl]);

  async function receberArquivo(file: File) {
    if (!file.type.startsWith('video/')) {
      setErro('Esse arquivo não é um vídeo.');
      return;
    }
    setErro(null);
    setCarregando(true);
    const espaco = await espacoDisponivel();
    if (espaco && file.size > espaco.total - espaco.usado) {
      setErro(`Vídeo de ${formatarTamanho(file.size)} não cabe no espaço livre do navegador (${formatarTamanho(espaco.total - espaco.usado)}).`);
      setCarregando(false);
      return;
    }
    try {
      const novaMeta = await salvarVideo(sessaoId, file);
      liberarUrl();
      const url = URL.createObjectURL(file);
      urlRef.current = url;
      setSrc(url);
      setMeta(novaMeta);
      onMetaChange(novaMeta);
    } catch {
      setErro('Não foi possível guardar o vídeo no navegador.');
    }
    setCarregando(false);
  }

  async function remover() {
    if (!window.confirm('Remover o vídeo desta sessão? Os eventos registrados continuam.')) return;
    await removerVideo(sessaoId);
    liberarUrl();
    setSrc(null);
    setMeta(undefined);
    onMetaChange(undefined);
  }

  function pular(delta: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(duracao, Math.max(0, v.currentTime + delta));
  }

  function irPara(segundo: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(duracao, Math.max(0, segundo));
  }

  function alternar() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }

  // Exposed on the element so the capture screen's spacebar shortcut can drive it.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = velocidade;
  }, [velocidade, src]);

  if (!src) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          const f = e.dataTransfer.files?.[0];
          if (f) receberArquivo(f);
        }}
        style={{
          border: `2px dashed ${arrastando ? colors.blue : colors.borderStrong}`,
          background: arrastando ? colors.blueSoft : colors.cardBgAlt,
          borderRadius: 14, padding: '38px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {carregando ? 'Carregando…' : 'Suba o vídeo do jogo'}
        </div>
        <div style={{ fontSize: 12, color: colors.mutedDark, maxWidth: 380 }}>
          Arraste o arquivo aqui ou escolha do dispositivo. Ele fica guardado neste navegador —
          não sobe para servidor nenhum.
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) receberArquivo(f); }}
        />
        <div
          onClick={() => inputRef.current?.click()}
          style={{ marginTop: 4, padding: '10px 20px', background: colors.blue, color: '#0a0e13', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          Escolher arquivo
        </div>
        {erro && <div style={{ fontSize: 12, color: colors.gold, maxWidth: 380 }}>{erro}</div>}
      </div>
    );
  }

  const pct = duracao > 0 ? (tempo / duracao) * 100 : 0;

  return (
    <div style={{ background: colors.cardBgAlt, border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={src}
        onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
        onTimeUpdate={(e) => { setTempo(e.currentTarget.currentTime); onTempo(e.currentTarget.currentTime); }}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onClick={alternar}
        style={{ width: '100%', display: 'block', background: '#000', maxHeight: '46vh', cursor: 'pointer' }}
      />

      {/* Linha do tempo com os eventos já marcados */}
      <div
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          irPara(((e.clientX - r.left) / r.width) * duracao);
        }}
        style={{ position: 'relative', height: 22, background: colors.cardBgDense, cursor: 'pointer' }}
      >
        <div style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 4, background: colors.borderAlt }} />
        <div style={{ position: 'absolute', top: 9, left: 0, width: `${pct}%`, height: 4, background: colors.blue }} />
        {duracao > 0 && marcadores.map((m) => (
          <div
            key={m.id}
            title={m.titulo}
            onPointerDown={(e) => { e.stopPropagation(); irPara(m.segundo); onMarcadorClick?.(m.id); }}
            style={{
              position: 'absolute', top: 4, left: `${(m.segundo / duracao) * 100}%`,
              width: 3, height: 14, marginLeft: -1.5, background: m.cor, borderRadius: 2, cursor: 'pointer',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', flexWrap: 'wrap' }}>
        <div onClick={alternar} style={{ fontSize: 13, fontWeight: 700, color: colors.blue, cursor: 'pointer', minWidth: 64 }}>
          {tocando ? 'Pausar' : 'Reproduzir'}
        </div>
        {[['−10s', -10], ['−1f', -PASSO_FRAME], ['+1f', PASSO_FRAME], ['+10s', 10]].map(([rot, d]) => (
          <div
            key={rot as string}
            onClick={() => pular(d as number)}
            style={{
              padding: '5px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, color: colors.muted,
            }}
          >
            {rot as string}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 3 }}>
          {VELOCIDADES.map((v) => (
            <div
              key={v}
              onClick={() => setVelocidade(v)}
              style={{
                padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: velocidade === v ? colors.blueSofter : colors.chipBg,
                border: `1px solid ${velocidade === v ? colors.blue : colors.chipBorder}`,
                color: velocidade === v ? colors.text : colors.muted,
              }}
            >
              {v}×
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
          {formatarTempo(tempo)} <span style={{ color: colors.mutedDark }}>/ {formatarTempo(duracao)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px 10px', fontSize: 11, color: colors.mutedDark, flexWrap: 'wrap' }}>
        <span>{meta?.nome}</span>
        {meta && <span>· {formatarTamanho(meta.tamanho)}</span>}
        <span onClick={remover} style={{ color: colors.gold, cursor: 'pointer', fontWeight: 600 }}>remover vídeo</span>
      </div>
    </div>
  );
}

/** Design tokens, by role rather than by appearance.
 *
 *  Every value here is a CSS custom property, not a hex. The actual colour is decided
 *  by the nearest ancestor carrying `data-plano`, which means the same component
 *  renders correctly on the dark shell and on the light reading plane without
 *  knowing which one it is in. Values live in index.css.
 *
 *  This works in inline styles and — verified in Chromium — in SVG presentation
 *  attributes too, so charts and the pitch selector need no special handling.
 */
export const colors = {
  /* ---- surfaces, lightest-to-darkest by role, never by look ---- */
  bg: 'var(--plano)',
  headerBg: 'var(--painel)',
  cardBg: 'var(--painel)',
  cardBgAlt: 'var(--painel-2)',
  cardBgDense: 'var(--painel-2)',
  chipBg: 'var(--painel-2)',

  /* ---- ink ---- */
  text: 'var(--tinta)',
  muted: 'var(--tinta-2)',
  mutedLight: 'var(--tinta-2)',
  mutedDark: 'var(--tinta-3)',

  /* ---- rules. One weight for divisions, one for the end of a block ---- */
  border: 'var(--filete)',
  borderAlt: 'var(--filete)',
  rowBorder: 'var(--filete)',
  logBorder: 'var(--filete)',
  chipBorder: 'var(--filete-forte)',
  borderStrong: 'var(--filete-forte)',
  headerBorder: 'var(--filete-forte)',

  /* ---- the two meanings colour is allowed to carry ----
   *  Blue is us / positive / selected. Amber is them / negative / attention.
   *  Blue↔orange is the only pair that survives protanopia, deuteranopia and
   *  tritanopia at once, which is why the whole system hangs off it. */
  blue: 'var(--acento)',
  blueSoft: 'var(--acento-fraco)',
  blueSofter: 'var(--acento-fraco2)',
  /** Readable ink on top of a filled accent. */
  onBlue: 'var(--acento-tinta)',
  gold: 'var(--atencao)',
  goldSoft: 'var(--atencao-fraco)',
  onGold: 'var(--atencao-tinta)',

  /* ---- categorical series, fixed order, never cycled ----
   *  Validated per plane: worst adjacent pair holds ΔE 8.4 (dark) / 9.1 (light)
   *  under simulated protanopia, above the ΔE 8 target. */
  serie1: 'var(--s1)',
  serie2: 'var(--s2)',
  serie3: 'var(--s3)',
  serie4: 'var(--s4)',
  serie5: 'var(--s5)',
  serie6: 'var(--s6)',

  /** Ink that stays legible on every step of the heat ramp, in either plane. */
  heatTinta: 'var(--heat-tinta)',

  /* ---- domain colours, not encodings ----
   *  A yellow card is yellow and a red card is red; that is the sport, not a
   *  good/bad pair. Both always ship beside their written label. */
  cartaoAmarelo: 'var(--cartao-amarelo)',
  cartaoVermelho: 'var(--cartao-vermelho)',
} as const;

/** Three voices, each with one job.
 *  Display: numbers and titles — the scoreboard voice.
 *  Body: prose.
 *  Mono: technical labels, shortcuts, units — never prose. */
export const fontDisplay = "'Barlow Condensed', 'Arial Narrow', sans-serif";
export const fontBody = "'Inter', ui-sans-serif, system-ui, sans-serif";
export const fontMono = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

/** Uppercase technical label — the mono voice, applied. */
export const rotulo = {
  fontFamily: fontMono,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
} as const;

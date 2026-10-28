// Temporal: the temporal.io brand system. Space Black, Off White and UV,
// light-weight headings, mono labels, a perspective grid and a soft glow.
export default {
  name: 'temporal',
  description: 'Space Black, Off White and UV: a band of timeline rows, drawn like the Temporal UI timeline graph, crawls across and drags the card on and off screen. A light title over a violet glow, mono labels, gradient key caps. temporal.io.',
  colors: {
    bg: '#141414',        // Space Black
    text: '#f8fafc',      // Off White
    muted: '#a9a9c0',
    uv: '#444ce7',        // primary
    violet: '#b664ff',    // the other end of the primary gradient
    mint: '#1ff1a5',
    lime: '#c3ff62',
    pink: '#ff6bff',
    grid: '#444ce7',      // the perspective grid lines
  },
  fonts: {
    sans: 'Aeonik, Inter, "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
    mono: '"Noto Sans Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  },
  pad: '#141414',
  // wipe: 'crawl' (the band crawls across), 'fail' (an activity fails, the
  // screen shakes, a retry recovers), 'rail' (a time rail sweeps), or 'cycle'.
  options: { wipe: 'crawl' },
};

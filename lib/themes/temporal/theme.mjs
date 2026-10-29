// Temporal: the temporal.io brand system. Space Black, Off White and UV,
// light-weight headings, mono labels, a perspective grid and a soft glow.
export default {
  name: 'temporal',
  description: 'Space Black, Off White and UV: a diagonal timeline front, drawn like the Temporal UI timeline graph with its glowing time rail, sweeps across and reveals a light title over a violet glow. Mono labels, gradient key caps. temporal.io.',
  colors: {
    bg: '#141414',        // Space Black
    text: '#f8fafc',      // Off White
    muted: '#a9a9c0',
    uv: '#444ce7',        // primary
    violet: '#b664ff',    // the other end of the primary gradient
    mint: '#1ff1a5',
    lime: '#c3ff62',
    pink: '#ff6bff',
  },
  fonts: {
    sans: 'Aeonik, Inter, "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
    mono: '"Noto Sans Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  },
  pad: '#141414',
  // wipe: 'rail' (the timeline front sweeps across, 2 beats), 'fail' (an
  // activity on the front fails, the card shakes, a retry recovers; 4 beats),
  // 'signal' (a signal lands on the front; 5 beats), or 'cycle'. The slow
  // wipes fall back to 'rail' unless the card's hold is at least the wipe
  // minus one beat: give such a project timing: { cardBeats: 12, holdBeats: 8 }.
  options: { wipe: 'rail' },
};

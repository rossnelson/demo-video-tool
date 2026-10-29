// Temporal: the temporal.io brand system. Space Black, Off White and UV,
// light-weight headings, mono labels and a soft glow, in a dark and a light mode.
const UV = '#444ce7', VIOLET = '#b664ff';

export default {
  name: 'temporal',
  description: 'Space Black, Off White and UV: a diagonal timeline front, drawn like the Temporal UI timeline graph with its glowing time rail, sweeps across and reveals a light title over a violet glow. Mono labels, gradient key caps. temporal.io.',
  colors: {
    bg: '#141414',        // Space Black
    text: '#f8fafc',      // Off White
    muted: '#a9a9c0',
    onAccent: '#f8fafc',  // text on the UV gradient (key caps, the url)
    star: '#f8fafc',      // the slow stars; transparent to hide them
    uv: UV,               // primary
    violet: VIOLET,       // the other end of the primary gradient
    // the glow behind the title: a soft violet-to-UV wash on black
    glow: `radial-gradient(closest-side,${VIOLET}2e 0%,${UV}26 25%,${UV}14 45%,${UV}06 62%,transparent 78%)`,
    mint: '#1ff1a5',
    lime: '#c3ff62',
    pink: '#ff6bff',
  },
  fonts: {
    sans: 'Aeonik, Inter, "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
    mono: '"Noto Sans Mono", "IBM Plex Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  },
  pad: '#141414',
  // mode: 'light' is temporal.io's light sections: Off White with Space
  // Black text, the same UV gradient, no stars, and mint and lime deepened
  // so labels and the rule hold on white.
  modes: {
    dark: {},
    light: {
      colors: {
        bg: '#f8fafc', text: '#141414', muted: '#55556e', star: 'transparent', mint: '#0a7f58', lime: '#3a7d00',
        // fewer stops: on white, every stop reads as a ring
        glow: `radial-gradient(closest-side,${VIOLET}30 0%,${UV}16 42%,${UV}00 80%)`,
      },
      pad: '#f8fafc',
    },
  },
  // wipe: 'rail' (the timeline front sweeps across, 2 beats), 'fail' (an
  // activity on the front fails, the card shakes, a retry recovers; 4 beats),
  // 'signal' (a signal lands on the front; 5 beats), or 'cycle'. The slow
  // wipes fall back to 'rail' unless the card's hold is at least the wipe
  // minus one beat: give such a project timing: { cardBeats: 12, holdBeats: 8 }.
  // mode: 'dark' (default) or 'light'.
  // rest: 'stars' (default) or 'axis' (the UI's time axis ticks behind the title).
  options: { wipe: 'rail', mode: 'dark', rest: 'stars' },
};

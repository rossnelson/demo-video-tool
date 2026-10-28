// Terminal: a dark terminal window; the title types itself. For CLIs and developer tools.
export default {
  name: 'terminal',
  description: 'A dark terminal window types the title at a prompt, with a blinking cursor and faint scanlines. CLIs and developer tools.',
  colors: {
    bg: '#0b0f14',       // screen
    frame: '#161b22',    // window chrome
    border: '#30363d',
    text: '#e6edf3',
    muted: '#7d8590',    // comments, subtitles
    prompt: '#5af78e',   // the prompt, key caps, the end card URL
    accent: '#f2cc60',   // the step
  },
  fonts: { mono: '"JetBrains Mono", "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' },
  pad: '#0b0f14',
};

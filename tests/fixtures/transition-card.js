// A test card for tests/transition_test.sh: a cream card with a title, whose
// exit is the theme option `exit`:
//   fade   the whole card fades out (no exit, and a grey wash over a dark page)
//   small  the title moves up 30 px as the card fades (exit too small)
//   wipe   a clip-path wipe of the card, no move
//   slide  the card slides in from below and off the top, no opacity
// With opts.keep, the slide card's words leave and the paper stays; with
// opts.afterCard, the paper is already up and the words slide in.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function mount(css, html) {
    document.getElementById('demo-transition')?.remove();
    const el = document.createElement('div');
    el.id = 'demo-transition';
    el.attachShadow({ mode: 'open' }).innerHTML = `<style>${css}</style><div class="demo">${html}</div>`;
    document.body.append(el);
  }
  function card(title, subtitle, out, o = {}) {
    const B = cfg().beat ?? 500;
    const exit = cfg().theme?.options?.exit ?? 'fade';
    const leave = out < Infinity;
    const base = `:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;background:#f6f1e6;color:#1b1c20;font:600 64px Georgia,serif}
.card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}
h1{margin:0;font-size:96px}p{margin:0;font-size:36px;font-weight:400;color:#4d4a45}
@keyframes fadeIn{from{opacity:0}}@keyframes fadeOut{to{opacity:0}}
@keyframes lift{to{transform:translateY(-30px)}}
@keyframes wipeIn{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes wipeOut{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 0 0 100%)}}
@keyframes slideIn{from{transform:translateY(100%)}to{transform:none}}
@keyframes slideOut{from{transform:none}to{transform:translateY(-100%)}}`;
    const css = {
      fade: `.demo{animation:fadeIn ${B}ms ease forwards${leave ? `, fadeOut ${1.5 * B}ms ease ${out}ms forwards` : ''}}`,
      small: `.demo{animation:fadeIn ${B}ms ease forwards${leave ? `, fadeOut ${1.5 * B}ms ease ${out}ms forwards` : ''}}
h1{${leave ? `animation:lift ${1.5 * B}ms ease-in ${out}ms forwards` : ''}}`,
      wipe: `.demo{clip-path:inset(0 100% 0 0);animation:wipeIn ${B}ms ease forwards${leave ? `, wipeOut ${1.5 * B}ms ease ${out}ms forwards` : ''}}`,
      slide: o.keep || o.afterCard
        ? `.card{${o.afterCard ? 'transform:translateY(100%);' : ''}animation:${[o.afterCard ? `slideIn ${B}ms ease-out forwards` : '', o.keep && leave ? `slideOut ${1.5 * B}ms ease-in ${out}ms forwards` : ''].filter(Boolean).join(', ') || 'none'}}`
        : `.demo{transform:translateY(100%);animation:slideIn ${B}ms ease-out forwards${leave ? `, slideOut ${1.5 * B}ms ease-in ${out}ms forwards` : ''}}`,
    }[exit];
    mount(base + '\n' + css, `<div class="card"><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>`);
  }
  window.__demo = {
    transition(step, title, subtitle, holdMs, opts = {}) {
      const B = cfg().beat ?? 500;
      card(title, subtitle, 2 * B + holdMs, opts);
      return 4 * B + holdMs;
    },
    end({ title, subtitle }, holdMs) {
      const B = cfg().beat ?? 500;
      card(title, subtitle, Infinity);
      return 2 * B + holdMs;
    },
    keys() {},
  };
})();

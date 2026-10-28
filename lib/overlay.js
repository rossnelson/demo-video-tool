// Injected into every page. Draws the SVG transition card and the key hints.
// window.__demoConfig (set by record.mjs) carries the beat length in ms, the
// key cap glyphs and the theme colours.
window.__demo = {
  transition(step, title, subtitle, holdMs) {
    document.getElementById('demo-transition')?.remove();
    const cfg = window.__demoConfig ?? {};
    const T = Object.assign(
      { bg: '#141414', accent: '#444ce7', deep: '#1d1b3a', spark: '#1ff1a5', spark2: '#f25cb0', text: '#fff', muted: '#d8d6ff', step: '#b8f5dc' },
      cfg.theme,
    );
    const keys = cfg.keys ?? [];
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const el = document.createElement('div');
    el.id = 'demo-transition';
    const B = cfg.beat ?? 510;
    holdMs ??= 4 * B;
    const IN = 2 * B, OUT = 2 * B;
    const total = IN + holdMs + OUT;
    el.innerHTML = `
<style>
#demo-transition{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}
#demo-transition svg{position:absolute;inset:0;width:100%;height:100%}
#demo-transition .bar{transform:translateX(-120%);animation:demoIn ${1.8 * B}ms cubic-bezier(.7,0,.2,1) forwards, demoOut ${1.8 * B}ms cubic-bezier(.7,0,.3,1) ${IN + holdMs}ms forwards}
#demo-transition .b2{animation-delay:${0.1 * B}ms, ${IN + holdMs + 0.1 * B}ms}
#demo-transition .b3{animation-delay:${0.2 * B}ms, ${IN + holdMs + 0.2 * B}ms}
#demo-transition .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;opacity:0;animation:demoCardIn ${B}ms ease ${0.6 * B}ms forwards, demoCardOut ${B}ms ease ${IN + holdMs}ms forwards}
#demo-transition .row{display:flex;align-items:center;gap:22px}
#demo-transition .key{display:flex;align-items:center;justify-content:center;min-width:88px;height:88px;padding:0 18px;border-radius:20px;background:#fff;color:#141414;font-size:44px;font-weight:700;box-shadow:0 8px 0 #c9c9d6,0 20px 40px rgba(0,0,0,.35);transform:scale(.2) rotate(-12deg);animation:demoKey ${1.1 * B}ms cubic-bezier(.3,1.6,.5,1) ${B}ms forwards}
${keys.map((_, i) => `#demo-transition .key.k${i + 1}{animation-delay:${(1 + 0.5 * i) * B}ms}`).join('\n')}
#demo-transition .num{font-size:22px;letter-spacing:.3em;color:${T.step};font-weight:600;opacity:0;animation:demoUp ${B}ms ease ${2 * B}ms forwards}
#demo-transition h1{margin:0;font-size:64px;line-height:1;color:${T.text};font-weight:700;letter-spacing:-.02em;opacity:0;animation:demoUp ${B}ms ease ${2 * B}ms forwards}
#demo-transition p{margin:0;font-size:26px;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${2.5 * B}ms forwards}
@keyframes demoIn{to{transform:translateX(0)}}
@keyframes demoOut{from{transform:translateX(0)}to{transform:translateX(120%)}}
@keyframes demoCardIn{from{opacity:0}to{opacity:1}}
@keyframes demoCardOut{from{opacity:1}to{opacity:0}}
@keyframes demoKey{to{transform:scale(1) rotate(0)}}
@keyframes demoUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
</style>
<svg viewBox="0 0 1600 900" preserveAspectRatio="none">
  <g class="bar b1"><polygon points="-200,0 1500,0 1300,900 -400,900" fill="${T.bg}"/></g>
  <g class="bar b2"><polygon points="-100,0 1700,0 1500,900 -300,900" fill="${T.accent}" opacity=".92"/></g>
  <g class="bar b3"><polygon points="0,0 1800,0 1600,900 -200,900" fill="${T.deep}"/>
    <circle cx="1350" cy="160" r="6" fill="${T.spark}"/><circle cx="1400" cy="200" r="3" fill="${T.spark2}"/>
    <circle cx="260" cy="720" r="5" fill="${T.spark}"/><circle cx="210" cy="760" r="9" fill="none" stroke="${T.spark2}" stroke-width="3"/>
    <path d="M120 140 h120 M120 160 h80" stroke="${T.accent}" stroke-width="6" stroke-linecap="round"/>
    <path d="M1380 740 h120 M1420 760 h80" stroke="${T.spark}" stroke-width="6" stroke-linecap="round"/>
  </g>
</svg>
<div class="card">
  ${keys.length ? `<div class="row">${keys.map((k, i) => `<span class="key k${i + 1}">${esc(k)}</span>`).join('')}</div>` : ''}
  ${step ? `<div class="num">${esc(step)}</div>` : ''}
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
</div>`;
    document.body.append(el);
    return total;
  },
  keys(label) {
    document.getElementById('demo-keys')?.remove();
    const host = document.querySelector('dialog[open]') ?? document.body;
    const el = document.createElement('div');
    el.id = 'demo-keys';
    el.textContent = label;
    el.setAttribute('style', 'position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 20px;border-radius:14px;background:rgba(20,20,20,.88);color:#fff;font:600 22px Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em;box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);transition:opacity .3s');
    host.append(el);
    setTimeout(() => (el.style.opacity = '0'), 1100);
    setTimeout(() => el.remove(), 1500);
  },
};

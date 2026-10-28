// Slant: three diagonal bars wipe in from the left, key caps pop, the title
// rises. Injected into every page; window.__demoConfig carries the beat
// length in ms, the key cap glyphs and the theme tokens.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const font = () => cfg().theme?.fonts?.sans ?? 'Inter,ui-sans-serif,system-ui,sans-serif';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // The bars and the key caps, shared by the transition and the end card.
  // `out` is when the bars leave; Infinity keeps them.
  function frame(B, out, keyCount) {
    const T = colors();
    return `
<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;font-family:${font()}}
.demo svg{position:absolute;inset:0;width:100%;height:100%}
.demo .bar{transform:translateX(-120%);animation:demoIn ${1.8 * B}ms cubic-bezier(.7,0,.2,1) forwards${out < Infinity ? `, demoOut ${1.8 * B}ms cubic-bezier(.7,0,.3,1) ${out}ms forwards` : ''}}
.demo .b2{animation-delay:${0.1 * B}ms, ${out + 0.1 * B}ms}
.demo .b3{animation-delay:${0.2 * B}ms, ${out + 0.2 * B}ms}
.demo .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:min(22px,2.5vw);padding:0 6vw;text-align:center;opacity:0;animation:demoCardIn ${B}ms ease ${0.6 * B}ms forwards${out < Infinity ? `, demoCardOut ${B}ms ease ${out}ms forwards` : ''}}
.demo .row{display:flex;align-items:center;gap:min(22px,2.5vw)}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(88px,14vw);height:min(88px,14vw);padding:0 min(18px,2vw);border-radius:min(20px,3vw);background:#fff;color:#141414;font-size:min(44px,7vw);font-weight:700;box-shadow:0 8px 0 #c9c9d6,0 20px 40px rgba(0,0,0,.35);transform:scale(.2) rotate(-12deg);animation:demoKey ${1.1 * B}ms cubic-bezier(.3,1.6,.5,1) ${B}ms forwards}
${Array.from({ length: keyCount }, (_, i) => `.demo .key.k${i + 1}{animation-delay:${(1 + 0.5 * i) * B}ms}`).join('\n')}
.demo .num{font-size:min(22px,3.5vw);letter-spacing:.3em;color:${T.step};font-weight:600;opacity:0;animation:demoUp ${B}ms ease ${2 * B}ms forwards}
.demo h1{margin:0;font-size:min(64px,9vw);line-height:1.05;color:${T.text};font-weight:700;letter-spacing:-.02em;opacity:0;animation:demoUp ${B}ms ease ${2 * B}ms forwards}
.demo p{margin:0;font-size:min(26px,4.5vw);color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${2.5 * B}ms forwards}
.demo .url{margin:min(10px,1vw) 0 0;font-size:min(40px,6vw);font-weight:600;color:${T.spark};letter-spacing:-.01em;opacity:0;animation:demoUp ${B}ms ease ${2.5 * B}ms forwards}
.demo .lines{display:flex;flex-direction:column;gap:6px;font-size:min(22px,4vw);color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${3 * B}ms forwards}
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
</svg>`;
  }
  const keyCaps = (keys) => (keys.length ? `<div class="row">${keys.map((k, i) => `<span class="key k${i + 1}">${esc(k)}</span>`).join('')}</div>` : '');
  // The card lives in a shadow root, so the page's own CSS cannot restyle it.
  function mount(html) {
    document.getElementById('demo-transition')?.remove();
    const el = document.createElement('div');
    el.id = 'demo-transition';
    const i = html.indexOf('</style>') + 8;
    el.attachShadow({ mode: 'open' }).innerHTML = `${html.slice(0, i)}<div class="demo">${html.slice(i)}</div>`;
    document.body.append(el);
  }

  window.__demo = {
    // A scene's card: 2 beats in, holdMs, 2 beats out. Returns the total in ms.
    transition(step, title, subtitle, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      holdMs ??= 4 * B;
      const IN = 2 * B, OUT = 2 * B;
      mount(`${frame(B, IN + holdMs, keys.length)}
<div class="card">
  ${keyCaps(keys)}
  ${step ? `<div class="num">${esc(step)}</div>` : ''}
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
</div>`);
      return IN + holdMs + OUT;
    },
    // The end card: comes in like a scene card and stays.
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      mount(`${frame(B, Infinity, keys.length)}
<div class="card">
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  ${url ? `<div class="url">${esc(url)}</div>` : ''}
  ${lines.length ? `<div class="lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
</div>`);
      return 2 * B + (holdMs ?? 4 * B);
    },
    // A key hint at the bottom of the page.
    keys(label) {
      document.getElementById('demo-keys')?.remove();
      const host = document.querySelector('dialog[open]') ?? document.body;
      const el = document.createElement('div');
      el.id = 'demo-keys';
      el.textContent = label;
      el.setAttribute('style', `position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 20px;border-radius:14px;background:rgba(20,20,20,.88);color:#fff;font:600 22px ${font()};letter-spacing:.04em;box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);transition:opacity .3s`);
      host.append(el);
      setTimeout(() => (el.style.opacity = '0'), 1100);
      setTimeout(() => el.remove(), 1500);
    },
  };
})();

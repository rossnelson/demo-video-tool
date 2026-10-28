// Paper: the page fades to cream, two hairlines draw out from the centre,
// the serif title settles between them.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const serif = () => cfg().theme?.fonts?.serif ?? 'Georgia, serif';
  const sans = () => cfg().theme?.fonts?.sans ?? 'Inter, system-ui, sans-serif';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function style(B, out, keyCount) {
    const T = colors();
    const leave = out < Infinity ? `, demoFadeOut ${1.5 * B}ms ease ${out}ms forwards` : '';
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;font-family:${serif()};background:${T.bg};opacity:0;animation:demoFadeIn ${0.8 * B}ms ease forwards${leave}}
.demo .grain{position:absolute;inset:0;opacity:.35;mix-blend-mode:multiply}
.demo .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:min(20px,2.4vw);padding:0 8vw;text-align:center}
.demo .rule{width:min(520px,70vw);height:1px;background:${T.rule};transform:scaleX(0);animation:demoRule ${1.2 * B}ms cubic-bezier(.6,0,.2,1) ${0.6 * B}ms forwards}
.demo .row{display:flex;gap:min(16px,2vw)}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(68px,11vw);height:min(68px,11vw);padding:0 min(14px,2vw);border:1.5px solid ${T.text};border-radius:min(10px,2vw);color:${T.text};font-size:min(32px,5.5vw);opacity:0;animation:demoFade ${B}ms ease forwards}
${Array.from({ length: keyCount }, (_, i) => `.demo .key.k${i + 1}{animation-delay:${(1.2 + 0.25 * i) * B}ms}`).join('\n')}
.demo .num{font-family:${sans()};font-size:min(14px,2.8vw);letter-spacing:.4em;text-transform:uppercase;color:${T.step};opacity:0;animation:demoFade ${B}ms ease ${B}ms forwards}
.demo h1{margin:0;font-size:min(72px,9.5vw);line-height:1.1;font-weight:500;color:${T.text};letter-spacing:-.01em;opacity:0;transform:translateY(8px);animation:demoSettle ${1.4 * B}ms ease ${B}ms forwards}
.demo p{margin:0;font-size:min(26px,4.4vw);font-style:italic;color:${T.muted};opacity:0;animation:demoFade ${1.2 * B}ms ease ${1.6 * B}ms forwards}
.demo .orn{color:${T.accent};font-size:min(18px,3.5vw);letter-spacing:.5em;opacity:0;animation:demoFade ${B}ms ease ${1.8 * B}ms forwards}
.demo .url{margin:0;font-family:${sans()};font-size:min(32px,5.5vw);color:${T.accent};text-decoration:underline;text-underline-offset:.2em;text-decoration-thickness:1px;opacity:0;animation:demoFade ${1.2 * B}ms ease ${1.6 * B}ms forwards}
.demo .lines{display:flex;flex-direction:column;gap:4px;font-size:min(22px,4vw);font-style:italic;color:${T.muted};opacity:0;animation:demoFade ${1.2 * B}ms ease ${2 * B}ms forwards}
@keyframes demoFadeIn{to{opacity:1}}
@keyframes demoFadeOut{to{opacity:0}}
@keyframes demoFade{to{opacity:1}}
@keyframes demoSettle{to{opacity:1;transform:none}}
@keyframes demoRule{to{transform:scaleX(1)}}
</style>
<svg class="grain" width="100%" height="100%"><filter id="demoGrain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .55 0 0 0 0 .5 0 0 0 0 .42 0 0 0 .18 0"/></filter><rect width="100%" height="100%" filter="url(#demoGrain)"/></svg>`;
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
    transition(step, title, subtitle, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      holdMs ??= 4 * B;
      const IN = 2 * B, OUT = 2 * B;
      mount(`${style(B, IN + holdMs, keys.length)}
<div class="card">
  <div class="rule"></div>
  ${keyCaps(keys)}
  ${step ? `<div class="num">No. ${esc(step)}</div>` : ''}
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  <div class="rule"></div>
</div>`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      mount(`${style(B, Infinity, keys.length)}
<div class="card">
  <div class="rule"></div>
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  <div class="orn">❦</div>
  ${url ? `<div class="url">${esc(url)}</div>` : ''}
  ${lines.length ? `<div class="lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
  <div class="rule"></div>
</div>`);
      return 2 * B + (holdMs ?? 4 * B);
    },
    keys(label) {
      const T = colors();
      document.getElementById('demo-keys')?.remove();
      const host = document.querySelector('dialog[open]') ?? document.body;
      const el = document.createElement('div');
      el.id = 'demo-keys';
      el.textContent = label;
      el.setAttribute('style', `position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 22px;border-radius:8px;background:${T.bg};color:${T.text};font:500 22px ${serif()};letter-spacing:.04em;box-shadow:0 10px 30px rgba(40,30,10,.18);border:1px solid ${T.rule};transition:opacity .3s`);
      host.append(el);
      setTimeout(() => (el.style.opacity = '0'), 1100);
      setTimeout(() => el.remove(), 1500);
    },
  };
})();

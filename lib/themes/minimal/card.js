// Minimal: the page fades to white, the title rises, an accent rule draws in.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const font = () => cfg().theme?.fonts?.sans ?? 'Inter,ui-sans-serif,system-ui,sans-serif';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function style(B, out, keyCount) {
    const T = colors();
    const leave = out < Infinity ? `, demoFadeOut ${B}ms ease ${out}ms forwards` : '';
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;font-family:${font()};background:${T.bg};opacity:0;animation:demoFadeIn ${0.6 * B}ms ease forwards${leave}}
.demo .card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:min(18px,2.2vw);padding:0 8vw;text-align:center}
.demo .row{display:flex;gap:min(14px,2vw);margin-bottom:min(10px,1vw)}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(72px,12vw);height:min(72px,12vw);padding:0 min(16px,2vw);border-radius:min(14px,2.5vw);background:${T.key};border:1px solid ${T.keyEdge};color:${T.text};font-size:min(34px,6vw);font-weight:600;opacity:0;transform:translateY(10px) scale(.9);animation:demoPop ${0.8 * B}ms cubic-bezier(.2,.9,.3,1.2) forwards}
${Array.from({ length: keyCount }, (_, i) => `.demo .key.k${i + 1}{animation-delay:${(0.8 + 0.25 * i) * B}ms}`).join('\n')}
.demo .num{font-size:min(15px,3vw);letter-spacing:.35em;text-transform:uppercase;color:${T.step};font-weight:600;opacity:0;animation:demoUp ${B}ms ease ${0.8 * B}ms forwards}
.demo h1{margin:0;font-size:min(60px,8.5vw);line-height:1.08;color:${T.text};font-weight:600;letter-spacing:-.025em;opacity:0;animation:demoUp ${B}ms ease ${B}ms forwards}
.demo .rule{width:min(72px,12vw);height:3px;background:${T.accent};transform:scaleX(0);transform-origin:left;animation:demoRule ${B}ms cubic-bezier(.7,0,.2,1) ${1.4 * B}ms forwards}
.demo p{margin:0;font-size:min(24px,4.2vw);color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${1.6 * B}ms forwards}
.demo .url{margin:0;font-size:min(34px,5.5vw);font-weight:600;color:${T.accent};opacity:0;animation:demoUp ${B}ms ease ${1.6 * B}ms forwards}
.demo .lines{display:flex;flex-direction:column;gap:4px;font-size:min(20px,3.8vw);color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${2 * B}ms forwards}
@keyframes demoFadeIn{to{opacity:1}}
@keyframes demoFadeOut{to{opacity:0}}
@keyframes demoPop{to{opacity:1;transform:none}}
@keyframes demoUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes demoRule{to{transform:scaleX(1)}}
</style>`;
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
  ${keyCaps(keys)}
  ${step ? `<div class="num">${esc(step)}</div>` : ''}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
</div>`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      mount(`${style(B, Infinity, keys.length)}
<div class="card">
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  ${url ? `<div class="url">${esc(url)}</div>` : ''}
  ${lines.length ? `<div class="lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
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
      el.setAttribute('style', `position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 20px;border-radius:12px;background:${T.bg};color:${T.text};font:600 22px ${font()};letter-spacing:.04em;box-shadow:0 10px 30px rgba(0,0,0,.18);border:1px solid ${T.keyEdge};transition:opacity .3s`);
      host.append(el);
      setTimeout(() => (el.style.opacity = '0'), 1100);
      setTimeout(() => el.remove(), 1500);
    },
  };
})();

// Poster: the field, the block and the band snap in on half beats, then the
// title. Nothing eases. They snap out again in reverse.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const display = () => cfg().theme?.fonts?.display ?? '"Arial Black", Inter, sans-serif';
  const sans = () => cfg().theme?.fonts?.sans ?? 'Inter, Helvetica, Arial, sans-serif';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Each part snaps in at `at` beats and, unless out is Infinity, snaps out at out + `leave` beats.
  const snap = (B, out, at, leave) => `opacity:0;animation:demoSnapIn 1ms linear ${at * B}ms forwards${out < Infinity ? `, demoSnapOut 1ms linear ${out + leave * B}ms forwards` : ''}`;

  function style(B, out, keyCount) {
    const T = colors();
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;font-family:${display()};overflow:hidden}
.demo .field{position:absolute;inset:0;background:${T.bg};${snap(B, out, 0, 1.5)}}
.demo .block{position:absolute;top:0;bottom:0;left:58%;right:0;background:${T.block};${snap(B, out, 0.5, 1)}}
.demo .band{position:absolute;left:0;right:0;bottom:0;height:min(120px,16vw);background:${T.band};${snap(B, out, 1, 0.5)}}
.demo .big{position:absolute;right:3vw;top:50%;transform:translateY(-58%);font-size:min(420px,26vw);line-height:1;color:transparent;-webkit-text-stroke:min(4px,.5vw) ${T.onBlock};letter-spacing:-.04em;${snap(B, out, 1.5, 0.5)}}
.demo h1{position:absolute;left:5vw;top:50%;transform:translateY(-62%);margin:0;max-width:52vw;font-size:calc(min(130px,12vw) * var(--fit,1));line-height:.92;text-transform:uppercase;letter-spacing:-.03em;color:${T.text};${snap(B, out, 2, 0)}}
.demo .stack{position:absolute;left:5vw;top:50%;transform:translateY(-55%);max-width:52vw;display:flex;flex-direction:column;gap:min(24px,3vw)}
.demo .stack h1{position:static;transform:none;max-width:none}
.demo .row{position:absolute;left:5vw;top:min(60px,6vw);display:flex;gap:min(10px,1.5vw)}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(80px,12vw);height:min(80px,12vw);padding:0 min(16px,2vw);background:${T.block};color:${T.onBlock};font-size:min(40px,6vw);${snap(B, out, 1.5, 0.5)}}
${Array.from({ length: keyCount }, (_, i) => `.demo .key.k${i + 1}{animation-delay:${(1.5 + 0.25 * i) * B}ms${out < Infinity ? `, ${out + 0.5 * B}ms` : ''}}`).join('\n')}
.demo p{position:absolute;left:5vw;right:5vw;bottom:0;height:min(120px,16vw);display:flex;align-items:center;margin:0;font-family:${sans()};font-weight:700;font-size:min(30px,4.4vw);letter-spacing:.06em;text-transform:uppercase;color:${T.onBand};${snap(B, out, 2.5, 0)}}
.demo .url{margin:0;font-family:${sans()};font-weight:800;font-size:max(14px,min(44px,3.2vw));line-height:1.1;color:${T.text};overflow-wrap:anywhere;${snap(B, out, 2.5, 0)}}
.demo .lines{position:absolute;right:4vw;bottom:min(150px,20vw);text-align:right;font-family:${sans()};font-weight:600;font-size:min(26px,4vw);line-height:1.5;color:${T.onBlock};${snap(B, out, 3, 0)}}
@keyframes demoSnapIn{to{opacity:1}}
@keyframes demoSnapOut{to{opacity:0}}
</style>`;
  }
  // Long titles get smaller type: full size up to about 20 characters (and
  // words of 5), half at 40+. Words never break; the column is 52vw wide.
  const fit = (title) => {
    const t = String(title ?? '');
    const longest = Math.max(1, ...t.split(/\s+/).map((w) => w.length));
    return Math.max(0.5, Math.min(1, 20 / Math.max(t.length, 1), 5.5 / longest));
  };
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
<div class="field"></div><div class="block"></div><div class="band"></div>
${step ? `<div class="big">${esc(step)}</div>` : ''}
${keyCaps(keys)}
<h1 style="--fit:${fit(title)}">${esc(title)}</h1>
${subtitle ? `<p>${esc(subtitle)}</p>` : ''}`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      mount(`${style(B, Infinity, keys.length)}
<div class="field"></div><div class="block"></div><div class="band"></div>
${keyCaps(keys)}
<div class="stack"><h1 style="--fit:${fit(title) * 0.8}">${esc(title)}</h1>${url ? `<div class="url">${esc(url)}</div>` : ''}</div>
${lines.length ? `<div class="lines">${lines.map((l) => `<div>${esc(l)}</div>`).join('')}</div>` : ''}
${subtitle ? `<p>${esc(subtitle)}</p>` : ''}`);
      return 2 * B + (holdMs ?? 4 * B);
    },
    keys(label) {
      const T = colors();
      document.getElementById('demo-keys')?.remove();
      const host = document.querySelector('dialog[open]') ?? document.body;
      const el = document.createElement('div');
      el.id = 'demo-keys';
      el.textContent = label;
      el.setAttribute('style', `position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 22px;background:${T.block};color:${T.onBlock};font:800 22px ${sans()};letter-spacing:.08em;text-transform:uppercase;box-shadow:6px 6px 0 ${T.band};transition:opacity .3s`);
      host.append(el);
      setTimeout(() => (el.style.opacity = '0'), 1100);
      setTimeout(() => el.remove(), 1500);
    },
  };
})();

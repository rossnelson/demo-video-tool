// Temporal: rows of event bars sweep in from the left like a workflow
// timeline filling up, then the scene fades in over them: a drifting 3D grid
// floor under a violet-to-UV glow, twinkling stars, a mono step label, a
// light title that sharpens into place, and a mint-to-lime rule. Leaving,
// the scene fades back to the bars and they slide out to the right. Key caps
// are gradient buttons with square corners.
// Everything moves by transform and opacity; only the small text block is
// blurred. A blur over the whole frame is slow to paint without a GPU, and
// every animation waits for that first paint.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const sans = () => cfg().theme?.fonts?.sans ?? 'Inter, system-ui, sans-serif';
  const mono = () => cfg().theme?.fonts?.mono ?? 'Menlo, Consolas, monospace';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function style(B, out, keyCount) {
    const T = colors();
    const leave = out < Infinity;
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;overflow:hidden;font-family:${sans()}}
.demo .wipe{position:absolute;inset:0;display:flex;flex-direction:column;gap:2px}
.demo .bar{position:relative;flex:1;background:linear-gradient(90deg,${T.uv} 0%,${T.violet} 100%);background-size:220% 100%;background-position:calc(var(--i) * 11%) 0;transform:translateX(-101%);animation:demoBarIn ${0.9 * B}ms cubic-bezier(.7,0,.2,1) calc(var(--i) * ${0.07 * B}ms) forwards${leave ? `, demoBarOut ${0.8 * B}ms cubic-bezier(.7,0,.6,1) calc(${out + 0.5 * B}ms + var(--i) * ${0.06 * B}ms) forwards` : ''}}
.demo .bar i{position:absolute;right:min(18px,2vw);top:50%;width:min(12px,1.6vw);height:min(12px,1.6vw);margin-top:calc(min(12px,1.6vw) / -2);border-radius:50%;background:${T.lime};box-shadow:0 0 0 3px ${T.bg}66}
.demo .bar.even i{background:${T.mint}}
.demo .stage{position:absolute;inset:0;background:${T.bg};opacity:0;transform:scale(1.04);animation:demoArrive ${0.8 * B}ms cubic-bezier(.2,.7,.2,1) ${1.1 * B}ms forwards${leave ? `, demoDepart ${0.5 * B}ms ease-in ${out}ms forwards` : ''}}
.demo .glow{position:absolute;left:50%;top:42%;width:170vw;height:115vw;transform:translate(-50%,-50%);background:radial-gradient(closest-side,${T.violet}2e 0%,${T.uv}26 25%,${T.uv}14 45%,${T.uv}06 62%,transparent 78%);opacity:.9;animation:demoBreathe ${16 * B}ms ease-in-out infinite alternate}
.demo .floor{position:absolute;left:-30%;right:-30%;bottom:0;height:110%;overflow:hidden;transform-origin:50% 100%;transform:perspective(600px) rotateX(60deg);-webkit-mask-image:linear-gradient(180deg,transparent 30%,#000 70%);mask-image:linear-gradient(180deg,transparent 30%,#000 70%)}
.demo .floor i{position:absolute;left:0;right:0;top:-96px;bottom:0;background:repeating-linear-gradient(90deg,${T.grid}99 0 1px,transparent 1px 96px),repeating-linear-gradient(0deg,${T.grid}99 0 1px,transparent 1px 96px);background-position:center 0;animation:demoFloor ${4 * B}ms linear infinite}
.demo .stars i{position:absolute;width:3px;height:3px;border-radius:50%;background:${T.text};opacity:.8;animation:demoTwinkle var(--tw) ease-in-out var(--d) infinite alternate, demoDrift var(--dr) ease-in-out var(--d) infinite alternate}
.demo .content{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 7vw min(8vw,90px)}
.demo .block{display:flex;flex-direction:column;align-items:center;gap:min(22px,2.6vw);text-align:center;filter:blur(12px);animation:demoSharpen ${B}ms cubic-bezier(.2,.7,.2,1) ${1.2 * B}ms forwards${leave ? `, demoSoften ${0.5 * B}ms ease-in ${out}ms forwards` : ''}}
.demo .chip{display:inline-flex;align-items:center;gap:10px;padding:min(8px,1vw) min(14px,1.8vw);border:1px solid ${T.uv};font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.22em;text-transform:uppercase;color:${T.text};opacity:0;animation:demoUp ${B}ms ease ${1.3 * B}ms forwards}
.demo .chip i{width:6px;height:6px;border-radius:50%;background:${T.lime}}
.demo .row{display:flex;gap:min(12px,1.6vw);opacity:0;animation:demoUp ${B}ms ease ${1.5 * B}ms forwards}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(64px,10vw);height:min(64px,10vw);padding:0 min(16px,2vw);border-radius:4px;background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(30px,5vw);font-weight:500;box-shadow:0 12px 40px ${T.uv}66}
${Array.from({ length: keyCount }, (_, i) => i ? `.demo .key.k${i + 1}{background:${T.bg};border:1px solid ${T.uv};box-shadow:none}` : '').join('\n')}
.demo h1{margin:0;font-size:min(84px,10.5vw);line-height:1.02;font-weight:300;letter-spacing:-.03em;color:${T.text};opacity:0;transform:translateY(16px);animation:demoUp ${1.2 * B}ms cubic-bezier(.2,.7,.2,1) ${1.3 * B}ms forwards}
.demo .rule{width:min(120px,16vw);height:2px;background:linear-gradient(255deg,${T.mint} 0%,${T.lime} 100%);transform:scaleX(0);animation:demoRule ${B}ms cubic-bezier(.7,0,.2,1) ${1.9 * B}ms forwards}
.demo p{margin:0;max-width:60ch;font-size:min(26px,4.2vw);font-weight:400;line-height:1.4;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${2.1 * B}ms forwards}
.demo .url{display:inline-block;margin-top:min(8px,1vw);padding:min(16px,2vw) min(30px,4vw);background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(26px,4vw);font-weight:500;letter-spacing:.02em;opacity:0;animation:demoUp ${B}ms ease ${2.1 * B}ms forwards}
.demo .lines{display:flex;flex-wrap:wrap;justify-content:center;gap:min(10px,1.2vw) min(28px,3vw);font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.18em;text-transform:uppercase;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${2.5 * B}ms forwards}
@keyframes demoBarIn{to{transform:none}}
@keyframes demoBarOut{to{transform:translateX(101%)}}
@keyframes demoArrive{to{opacity:1;transform:none}}
@keyframes demoDepart{to{opacity:0;transform:scale(1.04)}}
@keyframes demoSharpen{to{filter:blur(0)}}
@keyframes demoSoften{to{filter:blur(12px)}}
@keyframes demoBreathe{to{transform:translate(-50%,-50%) scale(1.08)}}
@keyframes demoFloor{to{transform:translateY(96px)}}
@keyframes demoTwinkle{from{opacity:.25}to{opacity:.9}}
@keyframes demoDrift{to{transform:translate(var(--dx),var(--dy))}}
@keyframes demoUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes demoRule{to{transform:scaleX(1)}}
</style>`;
  }
  // Stars: position, twinkle period in beats, drift period in beats, drift in px.
  const stars = [[8, 18, 5, 23, 9, -6], [21, 9, 7, 31, -7, 5], [34, 24, 4, 19, 6, 8], [61, 12, 6, 27, -9, -4], [73, 21, 5, 35, 8, 6], [88, 15, 8, 21, -5, 9], [93, 31, 4, 29, 7, -8], [14, 42, 7, 25, -8, -5], [82, 44, 6, 33, 9, 7], [5, 55, 5, 17, -6, 8], [47, 7, 9, 37, 5, -9], [57, 30, 6, 23, -7, 6]];
  // The timeline: rows of event bars that sweep in from the left.
  const ROWS = 9;
  const bars = () => `<div class="wipe">${Array.from({ length: ROWS }, (_, i) => `<div class="bar${i % 2 ? ' even' : ''}" style="--i:${i}">${i % 3 === 1 ? '<i></i>' : ''}</div>`).join('')}</div>`;
  function scene(B) {
    return `<div class="glow"></div>
<div class="floor"><i></i></div>
<div class="stars">${stars.map(([x, y, tw, dr, dx, dy], i) => `<i style="left:${x}%;top:${y}%;--tw:${tw * B}ms;--dr:${dr * B}ms;--dx:${dx}px;--dy:${dy}px;--d:${-i * 1.7 * B}ms"></i>`).join('')}</div>`;
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
      mount(`${style(B, IN + holdMs, keys.length)}${bars()}<div class="stage">${scene(B)}
<div class="content"><div class="block">
  ${step ? `<div class="chip"><i></i>${esc(step)}</div>` : ''}
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
</div></div></div>`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      mount(`${style(B, Infinity, keys.length)}${bars()}<div class="stage">${scene(B)}
<div class="content"><div class="block">
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  ${url ? `<div class="url">${esc(url)}</div>` : ''}
  ${lines.length ? `<div class="lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
</div></div></div>`);
      return 2 * B + (holdMs ?? 4 * B);
    },
    keys(label) {
      const T = colors();
      document.getElementById('demo-keys')?.remove();
      const host = document.querySelector('dialog[open]') ?? document.body;
      const el = document.createElement('div');
      el.id = 'demo-keys';
      el.textContent = label;
      el.setAttribute('style', `position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 22px;border-radius:4px;background:${T.bg};color:${T.text};font:500 20px ${mono()};letter-spacing:.08em;box-shadow:0 10px 30px rgba(0,0,0,.45);border:1px solid ${T.uv};transition:opacity .3s`);
      host.append(el);
      setTimeout(() => (el.style.opacity = '0'), 1100);
      setTimeout(() => el.remove(), 1500);
    },
  };
})();

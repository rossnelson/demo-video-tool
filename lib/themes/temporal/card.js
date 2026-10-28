// Temporal: Space Black fades in, a perspective grid rises from the horizon
// under a violet-to-UV glow, a mono step label, a light title, a mint-to-lime
// rule that draws in. Key caps are gradient buttons with square corners.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const sans = () => cfg().theme?.fonts?.sans ?? 'Inter, system-ui, sans-serif';
  const mono = () => cfg().theme?.fonts?.mono ?? 'Menlo, Consolas, monospace';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // The grid: lines converging on a vanishing point above the horizon, and
  // horizontals spaced for perspective.
  function grid() {
    const vx = 800, vy = 610, horizon = 650, bottom = 900;
    const lines = [];
    for (let i = -14; i <= 14; i++) lines.push(`<line x1="${vx}" y1="${vy}" x2="${vx + i * 260}" y2="${bottom}"/>`);
    for (let k = 1; k <= 9; k++) {
      const y = horizon + (bottom - horizon) * (k * k) / 81;
      lines.push(`<line x1="-200" y1="${y.toFixed(1)}" x2="1800" y2="${y.toFixed(1)}"/>`);
    }
    return lines.join('');
  }

  function style(B, out, keyCount) {
    const T = colors();
    const leave = out < Infinity;
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;overflow:hidden;font-family:${sans()};background:${T.bg};opacity:0;animation:demoFadeIn ${0.4 * B}ms ease forwards${leave ? `, demoFadeOut ${0.8 * B}ms ease ${out + 0.6 * B}ms forwards` : ''}}
.demo .glow{position:absolute;left:50%;top:42%;width:220vw;height:150vw;transform:translate(-50%,-50%);background:radial-gradient(closest-side,${T.violet}30 0%,${T.uv}26 28%,${T.uv}12 50%,transparent 72%);filter:blur(40px);opacity:0;animation:demoGlow ${2 * B}ms ease ${0.2 * B}ms forwards}
.demo svg.grid{position:absolute;inset:0;width:100%;height:100%;opacity:0;animation:demoGrid ${1.4 * B}ms cubic-bezier(.2,.7,.2,1) ${0.3 * B}ms forwards}
.demo svg.grid line{stroke:${T.grid};stroke-width:1;stroke-opacity:.45;vector-effect:non-scaling-stroke}
.demo .stars i{position:absolute;width:3px;height:3px;border-radius:50%;background:${T.text};opacity:0;animation:demoStar ${B}ms ease forwards}
.demo .content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:min(22px,2.6vw);padding:0 7vw min(12vw,140px);text-align:center;${leave ? `animation:demoFadeOut ${0.6 * B}ms ease ${out}ms forwards` : ''}}
.demo .chip{display:inline-flex;align-items:center;gap:10px;padding:min(8px,1vw) min(14px,1.8vw);border:1px solid ${T.uv};font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.22em;text-transform:uppercase;color:${T.text};opacity:0;animation:demoUp ${B}ms ease ${0.9 * B}ms forwards}
.demo .chip i{width:6px;height:6px;border-radius:50%;background:${T.lime}}
.demo .row{display:flex;gap:min(12px,1.6vw);opacity:0;animation:demoUp ${B}ms ease ${1.2 * B}ms forwards}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(64px,10vw);height:min(64px,10vw);padding:0 min(16px,2vw);border-radius:4px;background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(30px,5vw);font-weight:500;box-shadow:0 12px 40px ${T.uv}66}
${Array.from({ length: keyCount }, (_, i) => i ? `.demo .key.k${i + 1}{background:${T.bg};border:1px solid ${T.uv};box-shadow:none}` : '').join('\n')}
.demo h1{margin:0;font-size:min(84px,10.5vw);line-height:1.02;font-weight:300;letter-spacing:-.03em;color:${T.text};opacity:0;transform:translateY(16px);animation:demoUp ${1.2 * B}ms cubic-bezier(.2,.7,.2,1) ${B}ms forwards}
.demo .rule{width:min(120px,16vw);height:2px;background:linear-gradient(255deg,${T.mint} 0%,${T.lime} 100%);transform:scaleX(0);animation:demoRule ${B}ms cubic-bezier(.7,0,.2,1) ${1.6 * B}ms forwards}
.demo p{margin:0;max-width:60ch;font-size:min(26px,4.2vw);font-weight:400;line-height:1.4;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${1.8 * B}ms forwards}
.demo .url{display:inline-block;margin-top:min(8px,1vw);padding:min(16px,2vw) min(30px,4vw);background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(26px,4vw);font-weight:500;letter-spacing:.02em;opacity:0;animation:demoUp ${B}ms ease ${1.8 * B}ms forwards}
.demo .lines{display:flex;flex-wrap:wrap;justify-content:center;gap:min(10px,1.2vw) min(28px,3vw);font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.18em;text-transform:uppercase;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${2.2 * B}ms forwards}
@keyframes demoFadeIn{to{opacity:1}}
@keyframes demoFadeOut{to{opacity:0}}
@keyframes demoGlow{to{opacity:.9}}
@keyframes demoGrid{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
@keyframes demoStar{to{opacity:.8}}
@keyframes demoUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes demoRule{to{transform:scaleX(1)}}
</style>`;
  }
  const stars = [[8, 18], [21, 9], [34, 24], [61, 12], [73, 21], [88, 15], [93, 31], [14, 42], [82, 44], [5, 55]];
  function scene(B) {
    return `<div class="glow"></div>
<svg class="grid" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="demoFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#fff"/></linearGradient><mask id="demoGridMask"><rect x="-200" y="610" width="2000" height="290" fill="url(#demoFade)"/></mask></defs><g mask="url(#demoGridMask)">${grid()}</g></svg>
<div class="stars">${stars.map(([x, y], i) => `<i style="left:${x}%;top:${y}%;animation-delay:${(0.5 + i * 0.12) * B}ms"></i>`).join('')}</div>`;
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
      mount(`${style(B, IN + holdMs, keys.length)}${scene(B)}
<div class="content">
  ${step ? `<div class="chip"><i></i>${esc(step)}</div>` : ''}
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
</div>`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      mount(`${style(B, Infinity, keys.length)}${scene(B)}
<div class="content">
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
      el.setAttribute('style', `position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;padding:10px 22px;border-radius:4px;background:${T.bg};color:${T.text};font:500 20px ${mono()};letter-spacing:.08em;box-shadow:0 10px 30px rgba(0,0,0,.45);border:1px solid ${T.uv};transition:opacity .3s`);
      host.append(el);
      setTimeout(() => (el.style.opacity = '0'), 1100);
      setTimeout(() => el.remove(), 1500);
    },
  };
})();

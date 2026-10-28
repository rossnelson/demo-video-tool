// Temporal: a glowing "now" line sweeps across and reveals the scene behind
// it, the way the timeline's time rail scrubs. Under the title, an event
// history draws in row by row: lines and dots from the Temporal UI's
// timeline graph (temporalio/ui, lines-and-dots/timeline-graph), with the
// UI's row geometry, status colours and category icons. A violet glow and
// slow stars behind. Leaving, the line sweeps again and takes the scene
// with it. Key caps are gradient buttons with square corners.
// Everything moves by transform, opacity and clip-path; only the small text
// block is blurred. A blur over the whole frame is slow to paint without a
// GPU, and every animation waits for that first paint.
(() => {
  const cfg = () => window.__demoConfig ?? {};
  const colors = () => cfg().theme?.colors ?? {};
  const sans = () => cfg().theme?.fonts?.sans ?? 'Inter, system-ui, sans-serif';
  const mono = () => cfg().theme?.fonts?.mono ?? 'Menlo, Consolas, monospace';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // --- The timeline graph, after temporalio/ui lines-and-dots/timeline-graph.
  // Geometry: ROW_HEIGHT 24, RADIUS 9, DOT_STROKE 2 (connector = 2 × RADIUS tall,
  // dot = 2 × RADIUS + stroke, rounded by RADIUS × .3), scaled by S for video.
  const S = 1.4;
  const ROW = 24 * S, RADIUS = 9 * S, STROKE = 2 * S, DOT = 2 * RADIUS + STROKE, DOT_R = RADIUS * 0.3 + STROKE / 2, ICON = 12 * S;
  // Dark-theme colours (theme-dark.ts, colors.ts).
  const UI = {
    surface: '#191919', text: '#fbfbfa', dotStroke: '#191919',
    line: { workflow: '#5280ea', activity: '#8b008b', signal: '#ec5800', timer: '#c4347c', child: '#5280ea', completed: '#30a46c', running: '#0090ff', fired: '#ffa800', signaled: '#ff46a2' },
    dot: { started: ['#84a7f0', '#191919'], completed: ['#30a46c', '#218358'], fired: ['#ffa800', '#ffc53d'], signaled: ['#ff46a2', '#ff8ec9'], pending: ['#191919', '#a197ff'] },
  };
  const ICONS = {
    workflow: 'M5.208 16H0v-5.208h5.208zm8.188-5.208a2.604 2.604 0 1 1 0 5.208 2.604 2.604 0 0 1 0-5.208M1.455 14.545h2.299v-2.299h-2.3zm11.94-2.299a1.15 1.15 0 1 0 .001 2.3 1.15 1.15 0 0 0 0-2.3M9.94 14.123H6.061V12.67h3.878zM3.331 9.94H1.877V6.061H3.33zM2.604 0a2.604 2.604 0 1 1 0 5.209 2.604 2.604 0 0 1 0-5.209M16 5.208h-5.208V0H16zM2.604 1.455a1.15 1.15 0 1 0 0 2.299 1.15 1.15 0 0 0 0-2.3m9.642 2.299h2.3v-2.3h-2.3zM9.94 3.33H6.061V1.877h3.878z',
    activity: 'M8 0a8 8 0 0 1 7.975 7.396H16v1.5h-.05a8 8 0 0 1-15.9 0H0v-1.5h.025A8 8 0 0 1 8 0M6.219 5.524a.25.25 0 0 0-.462.011l-.86 2.238a1.75 1.75 0 0 1-1.633 1.123h-1.7a6.5 6.5 0 0 0 12.873 0h-1.335c-.099 0-.19.06-.229.15l-.94 2.161c-.61 1.398-2.591 1.402-3.206.007zM8 1.5a6.5 6.5 0 0 0-6.472 5.896h1.736a.25.25 0 0 0 .233-.16l.86-2.238c.56-1.458 2.605-1.508 3.235-.08l2.507 5.69a.25.25 0 0 0 .458 0l.941-2.16a1.75 1.75 0 0 1 1.604-1.052h1.37A6.5 6.5 0 0 0 8 1.5',
    signal: 'M8 1.948a2.36 2.36 0 0 1 1.782 3.904l1.53 3.384 1.364 3.016 1.394 3.082-.678.307-.678.306-1.196-2.644h-7.02l-1.173 2.66-1.362-.6 1.37-3.104 1.33-3.016 1.515-3.437a2.36 2.36 0 0 1-.533-1.495A2.36 2.36 0 0 1 8 1.948m-2.845 9.867h5.69l-.691-1.528H5.829zM6.486 8.8h2.996l-.987-2.18q-.24.054-.495.055-.283-.002-.548-.066zM14.873.037a8.07 8.07 0 0 1 .055 8.129l-1.29-.742a6.58 6.58 0 0 0-.046-6.63zM1.718.505l.644.37a6.58 6.58 0 0 0-.045 6.472l-.65.361-.65.362A8.06 8.06 0 0 1 1.071.133zm10.69.997a5.16 5.16 0 0 1 .034 5.199l-.645-.371-.645-.37a3.67 3.67 0 0 0-.025-3.7zm-8.186.432.645.372a3.67 3.67 0 0 0-.025 3.611l-.651.36-.65.362a5.16 5.16 0 0 1 .036-5.075zM8 3.436a.87.87 0 0 0-.867.875.876.876 0 0 0 .867.875.876.876 0 0 0 0-1.75',
    timer: 'M5.345 0h5v1.5h-1.75v1.544a6.45 6.45 0 0 1 3.557 1.59l.912-.915.531-.531 1.06 1.062-.532.531-.968.969A6.499 6.499 0 0 1 7.845 16a6.499 6.499 0 0 1-.75-12.956V1.5h-1.75zm2.5 14.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10m.75-7.75v4h-1.5V6h1.5z',
    retry: 'M15.172 6.897H16V.276h-1.655v3.59l-.69-.81a7.7 7.7 0 0 0-5.93-2.78 7.725 7.725 0 1 0 4.634 13.903l-.993-1.324a6.07 6.07 0 1 1 1.02-8.738l.004.007.951 1.117H9.38v1.656h5.793',
  };
  // An event history: [icon, status, x1 %, x2 %, label]. The first row is the
  // workflow itself, still running. A single x is a one-event row.
  const HISTORY = [
    ['workflow', 'running', 0, 100, ''],
    ['activity', 'completed', 3, 22, 'Activity'],
    ['timer', 'fired', 8, 34, 'Timer'],
    ['activity', 'completed', 24, 47, 'Activity'],
    ['signal', 'signaled', 41, 41, 'Signal'],
    ['workflow', 'completed', 46, 68, 'Child Workflow'],
    ['activity', 'completed', 61, 80, 'Activity'],
    ['activity', 'pending', 76, 100, 'Activity'],
  ];
  const icon = (name) => `<svg viewBox="0 0 16 16"><path fill="#000" d="${ICONS[name]}"/></svg>`;
  function graph(B) {
    const rows = HISTORY.map(([ic, status, x1, x2, label], i) => {
      const d = `calc(${0.45 * B}ms + ${i} * ${0.14 * B}ms)`;
      const running = status === 'running' || status === 'pending';
      const lineColor = running ? UI.line.running : UI.line[status] ?? UI.line[ic];
      const [f1, s1] = status === 'pending' ? UI.dot.started : ic === 'workflow' && status === 'running' ? UI.dot.started : status === 'completed' ? UI.dot.started : UI.dot[status] ?? UI.dot.started;
      const [f2, s2] = status === 'pending' ? UI.dot.pending : UI.dot[status] ?? UI.dot.completed;
      const single = x1 === x2;
      const pending = status === 'pending';
      // As in the UI: a pending row keeps its retry dot at the start and runs
      // dashes to the end; a label sits left of a row that starts past the middle.
      const left = x1 > 50;
      const labelX = left ? x1 : pending ? x1 : x2;
      return `<div class="row" style="--d:${d}">
  ${single ? '' : `<div class="line${running ? ' dash' : ''}" style="left:${x1}%;width:${x2 - x1}%;--c:${lineColor}"></div>`}
  <div class="dot" style="left:${x1}%;--f:${pending ? UI.dot.pending[0] : f1};--s:${pending ? UI.dot.pending[1] : s1}">${icon(pending ? 'retry' : ic)}</div>
  ${single || pending ? '' : `<div class="dot last" style="left:${x2}%;--f:${f2};--s:${s2}">${icon(ic)}</div>`}
  ${label ? `<div class="label${left ? ' left' : ''}" style="left:${labelX}%">${esc(label)}</div>` : ''}
</div>`;
    }).join('');
    const ticks = Array.from({ length: 9 }, (_, i) => `<i style="left:${(i + 1) * 10}%"><b>${((i + 1) * 1.2).toFixed(1)}s</b></i>`).join('');
    return `<div class="graph"><div class="ticks">${ticks}</div>${rows}<div class="baseline"></div></div>`;
  }

  function style(B, out, keyCount) {
    const T = colors();
    const leave = out < Infinity;
    const sweep = `${1.2 * B}ms cubic-bezier(.6,0,.3,1)`;
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;overflow:hidden;font-family:${sans()}}
.demo .stage{position:absolute;inset:0;background:${T.bg};clip-path:inset(0 100% 0 0);animation:demoSweepIn ${sweep} forwards${leave ? `, demoSweepOut ${sweep} ${out + 0.2 * B}ms forwards` : ''}}
.demo .playhead{position:absolute;top:0;bottom:0;left:0;width:2px;background:${UI.line.workflow};box-shadow:0 0 2px #fff,0 0 14px ${UI.line.workflow},0 0 40px ${T.uv};transform:translateX(-4px);animation:demoHeadIn ${sweep} forwards${leave ? `, demoHeadIn ${sweep} ${out + 0.2 * B}ms forwards` : ''}}
.demo .playhead::after{content:'';position:absolute;top:0;left:-7px;border:8px solid transparent;border-top:10px solid ${UI.line.workflow};border-bottom:0}
.demo .glow{position:absolute;left:50%;top:38%;width:170vw;height:115vw;transform:translate(-50%,-50%);background:radial-gradient(closest-side,${T.violet}2e 0%,${T.uv}26 25%,${T.uv}14 45%,${T.uv}06 62%,transparent 78%);opacity:.9;animation:demoBreathe ${16 * B}ms ease-in-out infinite alternate}
.demo .stars i{position:absolute;width:3px;height:3px;border-radius:50%;background:${T.text};opacity:.8;animation:demoTwinkle var(--tw) ease-in-out var(--d) infinite alternate, demoDrift var(--dr) ease-in-out var(--d) infinite alternate}
.demo .graph{position:absolute;left:0;right:0;bottom:min(8vw,70px);height:${HISTORY.length * ROW + 10}px;padding:0 min(48px,5vw);color:${UI.text};opacity:.62;animation:demoGraphDrift ${48 * B}ms ease-in-out infinite alternate}
.demo .ticks i{position:absolute;top:0;bottom:0;width:1px;background:${UI.text};opacity:.3}
.demo .ticks b{position:absolute;left:0;top:100%;margin-top:${RADIUS}px;font:12px ${mono()};font-weight:400;line-height:1;white-space:nowrap;transform:rotate(45deg);transform-origin:left center;color:${UI.text}}
.demo .baseline{position:absolute;left:min(48px,5vw);right:min(48px,5vw);bottom:0;height:${RADIUS / 2}px;background:${UI.text};opacity:.7}
.demo .row{position:relative;height:${ROW}px;opacity:0;animation:demoRow 1ms linear var(--d) forwards}
.demo .line{position:absolute;top:${(ROW - 2 * RADIUS) / 2}px;height:${2 * RADIUS}px;border-radius:9999px;background:var(--c);transform:scaleX(0);transform-origin:left center;animation:demoLine ${0.7 * B}ms cubic-bezier(.3,0,.2,1) var(--d) forwards}
.demo .line.dash{background:transparent;overflow:hidden}
.demo .line.dash::after{content:'';position:absolute;inset:0 -${6 * S}px 0 0;background-image:repeating-linear-gradient(to right,var(--c) 0 ${3 * S}px,transparent ${3 * S}px ${6 * S}px);background-size:${6 * S}px 100%;animation:demoDash 1.8s linear infinite}
.demo .dot{position:absolute;top:${(ROW - DOT) / 2}px;width:${DOT}px;height:${DOT}px;margin-left:${-DOT / 2}px;border-radius:${DOT_R}px;border:${STROKE}px solid var(--s);background:var(--f);box-sizing:border-box;transform:scale(0);animation:demoPop ${0.5 * B}ms cubic-bezier(.3,1.4,.5,1) var(--d) forwards}
.demo .dot.last{animation-delay:calc(var(--d) + ${0.55 * B}ms)}
.demo .dot svg{position:absolute;left:50%;top:50%;width:${ICON}px;height:${ICON}px;transform:translate(-50%,-50%)}
.demo .label{position:absolute;top:50%;margin-left:${DOT / 2 + 6}px;transform:translateY(-50%);}
.demo .label.left{margin-left:0;transform:translate(calc(-100% - ${DOT / 2 + 6}px),-50%)}
.demo .label{padding:0 6px;min-height:${DOT}px;display:flex;align-items:center;border-radius:9999px;background:${UI.surface};font-size:14px;line-height:1;white-space:nowrap;color:${UI.text};opacity:0;animation:demoFade ${0.4 * B}ms ease calc(var(--d) + ${0.8 * B}ms) forwards}
.demo .content{position:absolute;left:0;right:0;top:0;height:60%;display:flex;align-items:center;justify-content:center;padding:min(4vw,40px) 7vw 0}
.demo .block{display:flex;flex-direction:column;align-items:center;gap:min(20px,2.4vw);text-align:center;filter:blur(12px);animation:demoSharpen ${B}ms cubic-bezier(.2,.7,.2,1) ${0.6 * B}ms forwards${leave ? `, demoSoften ${0.6 * B}ms ease-in ${out}ms forwards` : ''}}
.demo .chip{display:inline-flex;align-items:center;gap:10px;padding:min(8px,1vw) min(14px,1.8vw);border:1px solid ${T.uv};font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.22em;text-transform:uppercase;color:${T.text};opacity:0;animation:demoUp ${B}ms ease ${0.8 * B}ms forwards}
.demo .chip i{width:6px;height:6px;border-radius:50%;background:${T.lime}}
.demo .row-keys{display:flex;gap:min(12px,1.6vw);opacity:0;animation:demoUp ${B}ms ease ${1.1 * B}ms forwards}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(64px,10vw);height:min(64px,10vw);padding:0 min(16px,2vw);border-radius:4px;background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(30px,5vw);font-weight:500;box-shadow:0 12px 40px ${T.uv}66}
${Array.from({ length: keyCount }, (_, i) => i ? `.demo .key.k${i + 1}{background:${T.bg};border:1px solid ${T.uv};box-shadow:none}` : '').join('\n')}
.demo h1{margin:0;font-size:min(84px,10.5vw);line-height:1.02;font-weight:300;letter-spacing:-.03em;color:${T.text};opacity:0;transform:translateY(16px);animation:demoUp ${1.2 * B}ms cubic-bezier(.2,.7,.2,1) ${0.9 * B}ms forwards}
.demo .rule{width:min(120px,16vw);height:2px;background:linear-gradient(255deg,${T.mint} 0%,${T.lime} 100%);transform:scaleX(0);animation:demoRule ${B}ms cubic-bezier(.7,0,.2,1) ${1.5 * B}ms forwards}
.demo p{margin:0;max-width:60ch;font-size:min(26px,4.2vw);font-weight:400;line-height:1.4;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${1.7 * B}ms forwards}
.demo .url{display:inline-block;margin-top:min(8px,1vw);padding:min(16px,2vw) min(30px,4vw);background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(26px,4vw);font-weight:500;letter-spacing:.02em;opacity:0;animation:demoUp ${B}ms ease ${1.7 * B}ms forwards}
.demo .lines{display:flex;flex-wrap:wrap;justify-content:center;gap:min(10px,1.2vw) min(28px,3vw);font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.18em;text-transform:uppercase;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${2.1 * B}ms forwards}
@keyframes demoSweepIn{to{clip-path:inset(0 0 0 0)}}
@keyframes demoSweepOut{to{clip-path:inset(0 0 0 100%)}}
@keyframes demoHeadIn{from{transform:translateX(-4px);opacity:1}90%{opacity:1}to{transform:translateX(100vw);opacity:0}}
@keyframes demoBreathe{to{transform:translate(-50%,-50%) scale(1.08)}}
@keyframes demoTwinkle{from{opacity:.25}to{opacity:.9}}
@keyframes demoDrift{to{transform:translate(var(--dx),var(--dy))}}
@keyframes demoGraphDrift{to{transform:translateX(-1.5%)}}
@keyframes demoRow{to{opacity:1}}
@keyframes demoLine{to{transform:scaleX(1)}}
@keyframes demoDash{to{transform:translateX(-${6 * S}px)}}
@keyframes demoPop{to{transform:scale(1)}}
@keyframes demoFade{to{opacity:1}}
@keyframes demoSharpen{to{filter:blur(0)}}
@keyframes demoSoften{to{filter:blur(12px)}}
@keyframes demoUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes demoRule{to{transform:scaleX(1)}}
</style>`;
  }
  const stars = [[8, 14], [21, 7], [34, 19], [61, 9], [73, 17], [88, 12], [93, 26], [14, 36], [82, 38], [5, 48], [47, 5], [57, 25]].map((p, i) => [...p, [5, 7, 4, 6, 5, 8, 4, 7, 6, 5, 9, 6][i], [23, 31, 19, 27, 35, 21, 29, 25, 33, 17, 37, 23][i], [9, -7, 6, -9, 8, -5, 7, -8, 9, -6, 5, -7][i], [-6, 5, 8, -4, 6, 9, -8, -5, 7, 8, -9, 6][i]]);
  function scene(B) {
    return `<div class="glow"></div>
<div class="stars">${stars.map(([x, y, tw, dr, dx, dy], i) => `<i style="left:${x}%;top:${y}%;--tw:${tw * B}ms;--dr:${dr * B}ms;--dx:${dx}px;--dy:${dy}px;--d:${-i * 1.7 * B}ms"></i>`).join('')}</div>
${graph(B)}`;
  }
  const keyCaps = (keys) => (keys.length ? `<div class="row-keys">${keys.map((k, i) => `<span class="key k${i + 1}">${esc(k)}</span>`).join('')}</div>` : '');
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
      mount(`${style(B, IN + holdMs, keys.length)}<div class="stage">${scene(B)}
<div class="content"><div class="block">
  ${step ? `<div class="chip"><i></i>${esc(step)}</div>` : ''}
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
</div></div></div><div class="playhead"></div>`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      mount(`${style(B, Infinity, keys.length)}<div class="stage">${scene(B)}
<div class="content"><div class="block">
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  ${url ? `<div class="url">${esc(url)}</div>` : ''}
  ${lines.length ? `<div class="lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
</div></div></div><div class="playhead"></div>`);
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

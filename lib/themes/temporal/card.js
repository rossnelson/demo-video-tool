// Temporal: a band of timeline rows crawls across the frame, drawn to the
// Temporal UI's timeline graph (temporalio/ui, lines-and-dots/timeline-graph:
// row geometry, status colours, category icons). Its leading edge drags the
// card on screen on the way in, and off screen on the way out. The card is a
// light title over a violet glow and slow stars. Key caps are gradient
// buttons with square corners.
//
// Options (theme.mjs `options`, a project's `theme: { options }`, or a
// scene's `card: { … }`):
//   wipe: 'crawl'  the band crawls across (default)
//         'fail'   mid-crawl an activity fails: the screen stops and shakes,
//                  the row turns red, a retry picks it up and the crawl goes on
//         'signal' a signal flies in and slams into the frame, which shakes,
//                  then the band crawls out from where it landed
//         'rail'   a glowing time rail sweeps across instead of the band
//         'cycle'  crawl, fail, signal, rail in turn, by the scene's index
// The out sweep is always the plain crawl (or the rail, for 'rail').
//
// Everything moves by transform, opacity, clip-path and mask; only the small
// text block is blurred. A blur over the whole frame is slow to paint without
// a GPU, and every animation waits for that first paint.
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
  const BANDW = 55; // the band's width, vw
  const ROW = 24 * S, RADIUS = 9 * S, STROKE = 2 * S, DOT = 2 * RADIUS + STROKE, DOT_R = RADIUS * 0.3 + STROKE / 2, ICON = 12 * S;
  // Dark-theme colours (theme-dark.ts, colors.ts).
  const UI = {
    surface: '#191919', text: '#fbfbfa', dotStroke: '#191919',
    line: { workflow: '#5280ea', activity: '#8b008b', signal: '#ec5800', timer: '#c4347c', child: '#5280ea', completed: '#30a46c', running: '#0090ff', fired: '#ffa800', signaled: '#ff46a2', failed: '#ce2c31' },
    dot: { started: ['#84a7f0', '#191919'], completed: ['#30a46c', '#218358'], fired: ['#ffa800', '#ffc53d'], signaled: ['#ff46a2', '#ff8ec9'], pending: ['#191919', '#a197ff'], failed: ['#e5484d', '#ce2c31'] },
  };
  const ICONS = {
    workflow: 'M5.208 16H0v-5.208h5.208zm8.188-5.208a2.604 2.604 0 1 1 0 5.208 2.604 2.604 0 0 1 0-5.208M1.455 14.545h2.299v-2.299h-2.3zm11.94-2.299a1.15 1.15 0 1 0 .001 2.3 1.15 1.15 0 0 0 0-2.3M9.94 14.123H6.061V12.67h3.878zM3.331 9.94H1.877V6.061H3.33zM2.604 0a2.604 2.604 0 1 1 0 5.209 2.604 2.604 0 0 1 0-5.209M16 5.208h-5.208V0H16zM2.604 1.455a1.15 1.15 0 1 0 0 2.299 1.15 1.15 0 0 0 0-2.3m9.642 2.299h2.3v-2.3h-2.3zM9.94 3.33H6.061V1.877h3.878z',
    activity: 'M8 0a8 8 0 0 1 7.975 7.396H16v1.5h-.05a8 8 0 0 1-15.9 0H0v-1.5h.025A8 8 0 0 1 8 0M6.219 5.524a.25.25 0 0 0-.462.011l-.86 2.238a1.75 1.75 0 0 1-1.633 1.123h-1.7a6.5 6.5 0 0 0 12.873 0h-1.335c-.099 0-.19.06-.229.15l-.94 2.161c-.61 1.398-2.591 1.402-3.206.007zM8 1.5a6.5 6.5 0 0 0-6.472 5.896h1.736a.25.25 0 0 0 .233-.16l.86-2.238c.56-1.458 2.605-1.508 3.235-.08l2.507 5.69a.25.25 0 0 0 .458 0l.941-2.16a1.75 1.75 0 0 1 1.604-1.052h1.37A6.5 6.5 0 0 0 8 1.5',
    signal: 'M8 1.948a2.36 2.36 0 0 1 1.782 3.904l1.53 3.384 1.364 3.016 1.394 3.082-.678.307-.678.306-1.196-2.644h-7.02l-1.173 2.66-1.362-.6 1.37-3.104 1.33-3.016 1.515-3.437a2.36 2.36 0 0 1-.533-1.495A2.36 2.36 0 0 1 8 1.948m-2.845 9.867h5.69l-.691-1.528H5.829zM6.486 8.8h2.996l-.987-2.18q-.24.054-.495.055-.283-.002-.548-.066zM14.873.037a8.07 8.07 0 0 1 .055 8.129l-1.29-.742a6.58 6.58 0 0 0-.046-6.63zM1.718.505l.644.37a6.58 6.58 0 0 0-.045 6.472l-.65.361-.65.362A8.06 8.06 0 0 1 1.071.133zm10.69.997a5.16 5.16 0 0 1 .034 5.199l-.645-.371-.645-.37a3.67 3.67 0 0 0-.025-3.7zm-8.186.432.645.372a3.67 3.67 0 0 0-.025 3.611l-.651.36-.65.362a5.16 5.16 0 0 1 .036-5.075zM8 3.436a.87.87 0 0 0-.867.875.876.876 0 0 0 .867.875.876.876 0 0 0 0-1.75',
    timer: 'M5.345 0h5v1.5h-1.75v1.544a6.45 6.45 0 0 1 3.557 1.59l.912-.915.531-.531 1.06 1.062-.532.531-.968.969A6.499 6.499 0 0 1 7.845 16a6.499 6.499 0 0 1-.75-12.956V1.5h-1.75zm2.5 14.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10m.75-7.75v4h-1.5V6h1.5z',
    retry: 'M15.172 6.897H16V.276h-1.655v3.59l-.69-.81a7.7 7.7 0 0 0-5.93-2.78 7.725 7.725 0 1 0 4.634 13.903l-.993-1.324a6.07 6.07 0 1 1 1.02-8.738l.004.007.951 1.117H9.38v1.656h5.793',
  };
  // The band: rows of events whose leading dots sit on the band's front edge,
  // packed at the UI's row height. [icon, status, start % of the band, fail].
  // The connector runs to the front; the row marked fail is the one that
  // fails in the 'fail' wipe.
  const BAND = [
    ['workflow', 'running', 0],
    ['activity', 'completed', 30],
    ['timer', 'fired', 10],
    ['activity', 'pending', 46, true],
    ['signal', 'signaled', 64],
    ['workflow', 'completed', 20],
    ['activity', 'completed', 55],
    ['timer', 'fired', 38],
    ['activity', 'completed', 72],
    ['signal', 'signaled', 50],
    ['activity', 'pending', 60],
  ];
  const icon = (name) => `<svg viewBox="0 0 16 16"><path fill="#000" d="${ICONS[name]}"/></svg>`;
  function band(fail) {
    const rows = BAND.map(([ic, status, x1, isFail]) => {
      const running = status === 'running' || status === 'pending';
      const c = running ? UI.line.running : UI.line[status];
      const [f1, s1] = status === 'pending' ? UI.dot.pending : UI.dot.started;
      const [f2, s2] = UI.dot[status] ?? UI.dot.started;
      const failing = fail && isFail;
      return `<div class="row${failing ? ' failing' : ''}">
  <div class="line${running ? ' dash' : ''}" style="left:${x1}%;right:${DOT / 2}px;--c:${c}"></div>
  ${failing ? `<div class="line red" style="left:${x1}%"></div><div class="line retry"></div><div class="dot failed" style="--f:${UI.dot.failed[0]};--s:${UI.dot.failed[1]}">${icon('activity')}</div>` : ''}
  <div class="dot" style="left:${x1}%;--f:${f1};--s:${s1}">${icon(status === 'pending' ? 'retry' : ic)}</div>
  <div class="dot lead" style="--f:${f2};--s:${s2}">${icon(ic)}</div>
</div>`;
    }).join('');
    return `<div class="band"><div class="rows">${rows}</div></div>`;
  }
  const WIPES = ['crawl', 'fail', 'signal', 'rail'];
  function pickWipe(opts) {
    const w = opts?.wipe ?? cfg().theme?.options?.wipe ?? 'crawl';
    if (w === 'cycle') return WIPES[(opts?.index ?? 0) % WIPES.length];
    return WIPES.includes(w) ? w : 'crawl';
  }

  function style(B, out, keyCount, wipe) {
    const T = colors();
    const leave = out < Infinity;
    const fail = wipe === 'fail';
    const rail = wipe === 'rail';
    const signal = wipe === 'signal';
    // The in sweep: 1.5 beats; 2 with the failure's pause; after the signal's
    // impact, 1.4 beats starting at 0.6. The out sweep: 1.5.
    const inMs = fail || signal ? 2 * B : 1.5 * B;
    const startMs = signal ? 0.6 * B : 0;
    const ease = 'cubic-bezier(.5,0,.3,1)';
    const sweepIn = `${inMs - startMs}ms ${ease} ${startMs}ms`;
    const sweepOut = `${1.5 * B}ms ${ease}`;
    // Where the signal lands: just inside the left edge, on its row.
    const SIGNAL_ROW = BAND.findIndex(([ic]) => ic === 'signal');
    const signalY = `calc(50% - ${(BAND.length / 2 - SIGNAL_ROW - 0.5) * ROW}px)`;
    // In the failure, the band stops with its front at FAIL_AT of the width.
    const FAIL_AT = 42;
    const after = 100 - FAIL_AT;   // how far the band travels after it resumes, vw
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;overflow:hidden;font-family:${sans()}}
.demo .shake{position:absolute;inset:0;${fail ? `animation:demoShake ${0.5 * B}ms linear ${0.74 * B}ms forwards` : signal ? `animation:demoShake ${0.4 * B}ms linear ${0.5 * B}ms forwards` : ''}}
.demo .stage{position:absolute;inset:0;background:${T.bg};clip-path:inset(0 100% 0 0);animation:${fail ? 'demoSweepInFail' : 'demoSweepIn'} ${sweepIn} forwards${leave ? `, demoSweepOut ${sweepOut} ${out}ms forwards` : ''}}
.demo .alarm{position:absolute;inset:0;background:${signal ? UI.dot.signaled[0] : UI.dot.failed[0]};opacity:0;${fail ? `animation:demoAlarm ${0.5 * B}ms ease ${0.74 * B}ms forwards` : signal ? `animation:demoAlarm ${0.4 * B}ms ease ${0.5 * B}ms forwards` : ''}}
.demo .band{position:absolute;top:0;bottom:0;left:0;width:${BANDW}vw;transform:translateX(-${BANDW}vw);-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 60%);mask-image:linear-gradient(90deg,transparent 0%,#000 60%);animation:${fail ? 'demoBandFail' : 'demoBand'} ${sweepIn} forwards, demoBandFade ${0.4 * B}ms ease ${inMs}ms forwards${leave ? `, demoBand ${sweepOut} ${out}ms forwards, demoBandFade ${0.4 * B}ms ease ${out + 1.5 * B}ms forwards` : ''}}
.demo .rows{position:absolute;left:0;right:0;top:50%;height:${BAND.length * ROW}px;margin-top:${-BAND.length * ROW / 2}px}
.demo .row{position:relative;height:${ROW}px}
.demo .line{position:absolute;top:${(ROW - 2 * RADIUS) / 2}px;height:${2 * RADIUS}px;border-radius:9999px;background:var(--c)}
.demo .line.dash{background:transparent;overflow:hidden}
.demo .line.dash::after{content:'';position:absolute;inset:0 -${6 * S}px 0 0;background-image:repeating-linear-gradient(to right,var(--c) 0 ${3 * S}px,transparent ${3 * S}px ${6 * S}px);background-size:${6 * S}px 100%;animation:demoDash 1.8s linear infinite}
.demo .dot{position:absolute;top:${(ROW - DOT) / 2}px;width:${DOT}px;height:${DOT}px;margin-left:${-DOT / 2}px;border-radius:${DOT_R}px;border:${STROKE}px solid var(--s);background:var(--f);box-sizing:border-box}
.demo .dot.lead{left:auto;right:0;margin-left:0}
.demo .dot svg{position:absolute;left:50%;top:50%;width:${ICON}px;height:${ICON}px;transform:translate(-50%,-50%)}
${fail ? `
.demo .failing .line.red{right:${DOT / 2}px;background:${UI.line.failed};opacity:0;animation:demoFailLine ${inMs}ms linear forwards}
.demo .failing .line.retry{left:calc(100% - ${DOT / 2}px);right:${DOT / 2}px;background:linear-gradient(255deg,${UI.line.completed} 0%,${UI.line.failed} 100%);opacity:0;animation:demoRetryLine ${inMs}ms ${ease} forwards}
.demo .failing .dot.failed{left:auto;right:0;margin-left:0;opacity:0;animation:demoFailDot ${inMs}ms ${ease} forwards}
.demo .failing .dot.lead{animation:demoLeadFail ${inMs}ms linear forwards}` : ''}
${signal ? `
.demo .signal{position:absolute;left:12vw;top:${signalY};width:0;height:0;transform:translate(115vw,-30vw) scale(1.8);animation:demoSignalFly ${0.5 * B}ms cubic-bezier(.4,0,1,.5) forwards, demoSignalGone 1ms linear ${B}ms forwards}
.demo .signal .dot{left:0;top:${-DOT / 2}px}
.demo .signal .trail{position:absolute;left:0;top:${-DOT * 0.3}px;width:48vw;height:${DOT * 0.6}px;border-radius:9999px;transform-origin:0 50%;transform:rotate(-14.6deg);background:linear-gradient(90deg,${UI.dot.signaled[0]}cc 0%,${UI.dot.signaled[0]}00 100%);animation:demoTrail ${0.3 * B}ms ease ${0.5 * B}ms forwards}
.demo .signal .ring{position:absolute;left:${-DOT / 2}px;top:${-DOT / 2}px;width:${DOT}px;height:${DOT}px;border-radius:50%;border:3px solid ${UI.dot.signaled[0]};opacity:0;animation:demoRing ${0.6 * B}ms cubic-bezier(.2,.7,.3,1) ${0.5 * B}ms forwards}` : ''}
${rail ? `.demo .railhead{position:absolute;top:0;bottom:0;left:0;width:2px;background:${UI.line.workflow};box-shadow:0 0 2px #fff,0 0 14px ${UI.line.workflow},0 0 40px ${T.uv};transform:translateX(-4px);animation:demoRail ${sweepIn} forwards${leave ? `, demoRail ${sweepOut} ${out}ms forwards` : ''}}
.demo .railhead::after{content:'';position:absolute;top:0;left:-7px;border:8px solid transparent;border-top:10px solid ${UI.line.workflow};border-bottom:0}
.demo .band{display:none}` : ''}
.demo .glow{position:absolute;left:50%;top:42%;width:170vw;height:115vw;transform:translate(-50%,-50%);background:radial-gradient(closest-side,${T.violet}2e 0%,${T.uv}26 25%,${T.uv}14 45%,${T.uv}06 62%,transparent 78%);opacity:.9;animation:demoBreathe ${16 * B}ms ease-in-out infinite alternate}
.demo .stars i{position:absolute;width:3px;height:3px;border-radius:50%;background:${T.text};opacity:.8;animation:demoTwinkle var(--tw) ease-in-out var(--d) infinite alternate, demoDrift var(--dr) ease-in-out var(--d) infinite alternate}
.demo .content{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 7vw min(4vw,40px)}
.demo .block{display:flex;flex-direction:column;align-items:center;gap:min(20px,2.4vw);text-align:center;filter:blur(12px);animation:demoSharpen ${B}ms cubic-bezier(.2,.7,.2,1) ${inMs - 0.6 * B}ms forwards${leave ? `, demoSoften ${0.6 * B}ms ease-in ${out}ms forwards` : ''}}
.demo .chip{display:inline-flex;align-items:center;gap:10px;padding:min(8px,1vw) min(14px,1.8vw);border:1px solid ${T.uv};font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.22em;text-transform:uppercase;color:${T.text};opacity:0;animation:demoUp ${B}ms ease ${inMs - 0.7 * B}ms forwards}
.demo .chip i{width:6px;height:6px;border-radius:50%;background:${T.lime}}
.demo .row-keys{display:flex;gap:min(12px,1.6vw);opacity:0;animation:demoUp ${B}ms ease ${inMs - 0.4 * B}ms forwards}
.demo .key{display:flex;align-items:center;justify-content:center;min-width:min(64px,10vw);height:min(64px,10vw);padding:0 min(16px,2vw);border-radius:4px;background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(30px,5vw);font-weight:500;box-shadow:0 12px 40px ${T.uv}66}
${Array.from({ length: keyCount }, (_, i) => i ? `.demo .key.k${i + 1}{background:${T.bg};border:1px solid ${T.uv};box-shadow:none}` : '').join('\n')}
.demo h1{margin:0;font-size:min(84px,10.5vw);line-height:1.02;font-weight:300;letter-spacing:-.03em;color:${T.text};opacity:0;transform:translateY(16px);animation:demoUp ${1.2 * B}ms cubic-bezier(.2,.7,.2,1) ${inMs - 0.6 * B}ms forwards}
.demo .rule{width:min(120px,16vw);height:2px;background:linear-gradient(255deg,${T.mint} 0%,${T.lime} 100%);transform:scaleX(0);animation:demoRule ${B}ms cubic-bezier(.7,0,.2,1) ${inMs}ms forwards}
.demo p{margin:0;max-width:60ch;font-size:min(26px,4.2vw);font-weight:400;line-height:1.4;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${inMs + 0.2 * B}ms forwards}
.demo .url{display:inline-block;margin-top:min(8px,1vw);padding:min(16px,2vw) min(30px,4vw);background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.text};font-family:${mono()};font-size:min(26px,4vw);font-weight:500;letter-spacing:.02em;opacity:0;animation:demoUp ${B}ms ease ${inMs + 0.2 * B}ms forwards}
.demo .lines{display:flex;flex-wrap:wrap;justify-content:center;gap:min(10px,1.2vw) min(28px,3vw);font-family:${mono()};font-size:min(14px,2.6vw);letter-spacing:.18em;text-transform:uppercase;color:${T.muted};opacity:0;animation:demoUp ${B}ms ease ${inMs + 0.6 * B}ms forwards}
@keyframes demoSweepIn{to{clip-path:inset(0 0 0 0)}}
@keyframes demoSweepOut{to{clip-path:inset(0 0 0 100%)}}
@keyframes demoBand{from{transform:translateX(-${BANDW}vw);opacity:1}to{transform:translateX(${100 - BANDW}vw);opacity:1}}
@keyframes demoBandFade{to{opacity:0}}
@keyframes demoRail{from{transform:translateX(-4px);opacity:1}90%{opacity:1}to{transform:translateX(100vw);opacity:0}}
@keyframes demoSweepInFail{0%{clip-path:inset(0 100% 0 0)}37%{clip-path:inset(0 ${100 - FAIL_AT}% 0 0)}60%{clip-path:inset(0 ${100 - FAIL_AT}% 0 0)}100%{clip-path:inset(0 0 0 0)}}
@keyframes demoBandFail{0%{transform:translateX(-${BANDW}vw);opacity:1}37%{transform:translateX(${FAIL_AT - BANDW}vw);opacity:1}60%{transform:translateX(${FAIL_AT - BANDW}vw);opacity:1}100%{transform:translateX(${100 - BANDW}vw);opacity:1}}
@keyframes demoShake{0%,100%{transform:none}8%{transform:translate(-9px,4px)}18%{transform:translate(8px,-5px)}28%{transform:translate(-7px,-3px)}38%{transform:translate(6px,4px)}48%{transform:translate(-5px,2px)}58%{transform:translate(4px,-3px)}68%{transform:translate(-3px,2px)}78%{transform:translate(2px,-1px)}88%{transform:translate(-1px,1px)}}
@keyframes demoAlarm{0%{opacity:0}15%{opacity:.22}100%{opacity:0}}
@keyframes demoFailLine{0%,36%{opacity:0}37%,59%{opacity:1;right:${DOT / 2}px}100%{opacity:1;right:calc(${after}vw + ${DOT / 2}px)}}
@keyframes demoFailDot{0%,36%{opacity:0;right:0}37%,60%{opacity:1;right:0}100%{opacity:1;right:${after}vw}}
@keyframes demoRetryLine{0%,60%{opacity:0;left:calc(100% - ${DOT / 2}px)}61%{opacity:1;left:calc(100% - ${DOT / 2}px)}100%{opacity:1;left:calc(100% - ${after}vw - ${DOT / 2}px)}}
@keyframes demoLeadFail{0%,36%{background:${UI.dot.started[0]};border-color:${UI.dot.started[1]}}37%,60%{background:${UI.dot.failed[0]};border-color:${UI.dot.failed[1]}}61%,100%{background:${UI.dot.completed[0]};border-color:${UI.dot.completed[1]}}}
@keyframes demoSignalFly{to{transform:translate(0,0) scale(1)}}
@keyframes demoSignalGone{to{opacity:0}}
@keyframes demoTrail{to{opacity:0}}
@keyframes demoRing{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(9)}}
@keyframes demoBreathe{to{transform:translate(-50%,-50%) scale(1.08)}}
@keyframes demoTwinkle{from{opacity:.25}to{opacity:.9}}
@keyframes demoDrift{to{transform:translate(var(--dx),var(--dy))}}
@keyframes demoDash{to{transform:translateX(-${6 * S}px)}}
@keyframes demoSharpen{to{filter:blur(0)}}
@keyframes demoSoften{to{filter:blur(12px)}}
@keyframes demoUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes demoRule{to{transform:scaleX(1)}}
</style>`;
  }
  const stars = [[8, 14], [21, 7], [34, 19], [61, 9], [73, 17], [88, 12], [93, 26], [14, 36], [82, 38], [5, 48], [47, 5], [57, 25]].map((p, i) => [...p, [5, 7, 4, 6, 5, 8, 4, 7, 6, 5, 9, 6][i], [23, 31, 19, 27, 35, 21, 29, 25, 33, 17, 37, 23][i], [9, -7, 6, -9, 8, -5, 7, -8, 9, -6, 5, -7][i], [-6, 5, 8, -4, 6, 9, -8, -5, 7, 8, -9, 6][i]]);
  function scene(B) {
    return `<div class="glow"></div>
<div class="stars">${stars.map(([x, y, tw, dr, dx, dy], i) => `<i style="left:${x}%;top:${y}%;--tw:${tw * B}ms;--dr:${dr * B}ms;--dx:${dx}px;--dy:${dy}px;--d:${-i * 1.7 * B}ms"></i>`).join('')}</div>`;
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
    transition(step, title, subtitle, holdMs, opts) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      const wipe = pickWipe(opts);
      holdMs ??= 4 * B;
      const IN = 2 * B, OUT = 2 * B;
      mount(`${style(B, IN + holdMs, keys.length, wipe)}<div class="shake"><div class="stage">${scene(B)}
<div class="content"><div class="block">
  ${step ? `<div class="chip"><i></i>${esc(step)}</div>` : ''}
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
</div></div></div>${band(wipe === 'fail')}${wipe === 'rail' ? '<div class="railhead"></div>' : ''}${wipe === 'signal' ? `<div class="signal"><div class="trail"></div><div class="ring"></div><div class="dot" style="--f:${UI.dot.signaled[0]};--s:${UI.dot.signaled[1]}">${icon('signal')}</div></div>` : ''}<div class="alarm"></div></div>`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs, opts) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      const wipe = pickWipe(opts);
      mount(`${style(B, Infinity, keys.length, wipe)}<div class="shake"><div class="stage">${scene(B)}
<div class="content"><div class="block">
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  ${url ? `<div class="url">${esc(url)}</div>` : ''}
  ${lines.length ? `<div class="lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
</div></div></div>${band(wipe === 'fail')}${wipe === 'rail' ? '<div class="railhead"></div>' : ''}${wipe === 'signal' ? `<div class="signal"><div class="trail"></div><div class="ring"></div><div class="dot" style="--f:${UI.dot.signaled[0]};--s:${UI.dot.signaled[1]}">${icon('signal')}</div></div>` : ''}<div class="alarm"></div></div>`);
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

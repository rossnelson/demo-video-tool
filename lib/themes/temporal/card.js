// Temporal: the wipe is a timeline front: a diagonal column of successive
// activity bars leaning forward, the top row ahead and each row below a step
// behind, like a real history, with the glowing time rail along their
// leading edge. The front sweeps across as one block and the card is
// revealed behind it; on the way out it sweeps again and uncovers the page.
// Rows, dots and colours follow the Temporal UI's timeline graph
// (temporalio/ui, lines-and-dots/timeline-graph). The column is generated
// per card: the workflow's own row at the top, a child workflow at the
// bottom, one timer, one signal, one running activity, and completed
// activities whose lengths are seeded by the scene, so no two cards show the
// same history. The card is a light title over a violet glow and slow stars,
// after temporal.io, in a dark mode (Space Black) or a light one (Off
// White, no stars). Key caps are gradient buttons with square corners.
//
// Options (theme.mjs `options`, a project's `theme: { options }`, or a
// scene's `card: { … }`):
//   wipe: 'rail'    the front sweeps across over 2 beats (default)
//         'fail'    4 beats: the running activity on the front, a little
//                   above the middle of the frame, fails; the card stops
//                   dead and shakes; time creeps while the retry's dashed
//                   line (the UI's retry colour) runs on to the rail; it
//                   completes as the UI draws a retried activity, one line
//                   with the failed-to-completed gradient and a green dot,
//                   with a ring; then the whole timeline accelerates away
//         'signal'  5 beats, in steps: a signal flies in enlarged and hits
//                   the page where the title will sit; it shakes, with two
//                   rings; the front starts; it pauses at the signal while
//                   the signal shrinks into the column's signal row; the
//                   drag carries the row away, a pulse marks the spot, and
//                   the title grows out of it as the column clears
//         'cycle'   rail, fail, signal in turn, by the scene's index
//   retryLabel: a caption over the retry in the fail wipe, such as 'attempt 2'
//               (off by default)
//   rest: 'axis'    the UI's time axis behind the title (default): faint vertical
//                   ticks every 60px, a stronger one every 300px, fading down
//         'stars'   slow stars instead (the light mode hides them)
// The out sweep is always the plain rail, and an end card uses the rail
// unless its scene names a wipe. A slow wipe needs room: if the card's hold
// is shorter than the wipe minus one beat it falls back to the rail, so give
// a project that uses fail or signal timing: { cardBeats: 12, holdBeats: 8 }.
//
// Everything moves by transform, opacity and clip-path (the retry line
// animates its width); only the small text block is blurred. The card, its
// edge and the column shake as one object; the flash and every ring that
// marks a recovery or a pickup are inside the card's clip. The one thing
// drawn on the recorded product on purpose is the signal's arrival: it
// lands on the app, which is the point.
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
    line: { workflow: '#5280ea', activity: '#8b008b', signal: '#ec5800', timer: '#c4347c', child: '#5280ea', completed: '#30a46c', running: '#0090ff', pending: '#a197ff', retry: '#ff996c', fired: '#ffa800', signaled: '#ff46a2', failed: '#ce2c31' },
    dot: { started: ['#84a7f0', '#191919'], completed: ['#30a46c', '#218358'], fired: ['#ffa800', '#ffc53d'], signaled: ['#ff46a2', '#ff8ec9'], pending: ['#191919', '#a197ff'], failed: ['#e5484d', '#ce2c31'] },
  };
  const ICONS = {
    workflow: 'M5.208 16H0v-5.208h5.208zm8.188-5.208a2.604 2.604 0 1 1 0 5.208 2.604 2.604 0 0 1 0-5.208M1.455 14.545h2.299v-2.299h-2.3zm11.94-2.299a1.15 1.15 0 1 0 .001 2.3 1.15 1.15 0 0 0 0-2.3M9.94 14.123H6.061V12.67h3.878zM3.331 9.94H1.877V6.061H3.33zM2.604 0a2.604 2.604 0 1 1 0 5.209 2.604 2.604 0 0 1 0-5.209M16 5.208h-5.208V0H16zM2.604 1.455a1.15 1.15 0 1 0 0 2.299 1.15 1.15 0 0 0 0-2.3m9.642 2.299h2.3v-2.3h-2.3zM9.94 3.33H6.061V1.877h3.878z',
    activity: 'M8 0a8 8 0 0 1 7.975 7.396H16v1.5h-.05a8 8 0 0 1-15.9 0H0v-1.5h.025A8 8 0 0 1 8 0M6.219 5.524a.25.25 0 0 0-.462.011l-.86 2.238a1.75 1.75 0 0 1-1.633 1.123h-1.7a6.5 6.5 0 0 0 12.873 0h-1.335c-.099 0-.19.06-.229.15l-.94 2.161c-.61 1.398-2.591 1.402-3.206.007zM8 1.5a6.5 6.5 0 0 0-6.472 5.896h1.736a.25.25 0 0 0 .233-.16l.86-2.238c.56-1.458 2.605-1.508 3.235-.08l2.507 5.69a.25.25 0 0 0 .458 0l.941-2.16a1.75 1.75 0 0 1 1.604-1.052h1.37A6.5 6.5 0 0 0 8 1.5',
    signal: 'M8 1.948a2.36 2.36 0 0 1 1.782 3.904l1.53 3.384 1.364 3.016 1.394 3.082-.678.307-.678.306-1.196-2.644h-7.02l-1.173 2.66-1.362-.6 1.37-3.104 1.33-3.016 1.515-3.437a2.36 2.36 0 0 1-.533-1.495A2.36 2.36 0 0 1 8 1.948m-2.845 9.867h5.69l-.691-1.528H5.829zM6.486 8.8h2.996l-.987-2.18q-.24.054-.495.055-.283-.002-.548-.066zM14.873.037a8.07 8.07 0 0 1 .055 8.129l-1.29-.742a6.58 6.58 0 0 0-.046-6.63zM1.718.505l.644.37a6.58 6.58 0 0 0-.045 6.472l-.65.361-.65.362A8.06 8.06 0 0 1 1.071.133zm10.69.997a5.16 5.16 0 0 1 .034 5.199l-.645-.371-.645-.37a3.67 3.67 0 0 0-.025-3.7zm-8.186.432.645.372a3.67 3.67 0 0 0-.025 3.611l-.651.36-.65.362a5.16 5.16 0 0 1 .036-5.075zM8 3.436a.87.87 0 0 0-.867.875.876.876 0 0 0 .867.875.876.876 0 0 0 0-1.75',
    timer: 'M5.345 0h5v1.5h-1.75v1.544a6.45 6.45 0 0 1 3.557 1.59l.912-.915.531-.531 1.06 1.062-.532.531-.968.969A6.499 6.499 0 0 1 7.845 16a6.499 6.499 0 0 1-.75-12.956V1.5h-1.75zm2.5 14.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10m.75-7.75v4h-1.5V6h1.5z',
    retry: 'M15.172 6.897H16V.276h-1.655v3.59l-.69-.81a7.7 7.7 0 0 0-5.93-2.78 7.725 7.725 0 1 0 4.634 13.903l-.993-1.324a6.07 6.07 0 1 1 1.02-8.738l.004.007.951 1.117H9.38v1.656h5.793',
  };
  // --- The column. Rows carry [icon, status, length, lag]: length is the bar
  // in vw (with a px floor for narrow frames), lag is how far behind the rail
  // the bar ends (completed work finished a moment ago; running work reaches
  // "now"). Built per card from the scene's index so each history differs.
  const STEP = 1.3;                       // vw each row trails the one above: the angle
  // Rows start half a row above the frame and run past its bottom, like a
  // scrolled list, so no row hugs an edge.
  const rowCount = () => Math.ceil(window.innerHeight / ROW) + 2;
  const rowTop = (i) => (i - 0.5) * ROW;
  // The front leans forward: the top row leads, each row below trails. A
  // row's leader sits exactly on the rail, which runs from span() at the top
  // of the frame to 0 at the bottom, so the x follows the row's y.
  const rowX = (i) => span() * (1 - (rowTop(i) + ROW / 2) / window.innerHeight);
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // signalRow: the row the signal lands in (the title's row, measured) when given.
  function buildColumn(wipe, seed, signalRow) {
    const n = rowCount();
    const rnd = mulberry(seed * 7919 + n);
    const sr = signalRow ?? Math.floor(n / 2), tr = Math.round(n * 0.12), cr = Math.round(n * 0.66);
    let pr = Math.round(n * 0.4); if (Math.abs(pr - sr) < 2) pr = sr - 2;   // the running activity: a little above the middle, clear of the signal
    return Array.from({ length: n }, (_, i) => {
      if (i === 0) return { icon: 'workflow', status: 'running', len: 30, lag: 0 };
      if (i === n - 1) return { icon: 'workflow', status: 'completed', len: 14, lag: 3 };
      if (i === sr) return { icon: 'signal', status: 'signaled', len: 0, lag: 0, carry: wipe === 'signal' };
      if (i === tr) return { icon: 'timer', status: 'fired', len: 16, lag: 2 };
      if (i === cr) return { icon: 'workflow', status: 'completed', len: 12, lag: 1 };
      if (i === pr) return { icon: 'activity', status: 'pending', len: 10, lag: 0, fail: wipe === 'fail' };
      return { icon: 'activity', status: 'completed', len: 7 + Math.round(rnd() * 11), lag: Math.round(rnd() * 5) };
    });
  }
  // Icons are the UI's; the UI draws them black, which vanishes on the dark
  // pending fill, so dark fills get the UI's light text colour instead.
  const icon = (name, fill) => `<svg viewBox="0 0 16 16"><path fill="${fill === 'currentColor' ? 'currentColor' : fill === UI.dot.pending[0] ? UI.text : '#000'}" d="${ICONS[name]}"/></svg>`;
  const startedDot = () => { const T = colors(); return T.dotStartFill ? [T.dotStartFill, T.dotStartStroke ?? UI.dot.started[1]] : UI.dot.started; };
  const dots = (r) => {
    const running = r.status === 'running' || r.status === 'pending';
    const start = startedDot();
    const lead = r.status === 'pending' ? UI.dot.pending : UI.dot[r.status] ?? startedDot();
    return { running, start, lead, line: r.status === 'pending' ? UI.line.pending : running ? UI.line.running : UI.line[r.status] };
  };
  const lenCss = (len) => `max(${len}vw,${len * 7}px)`;

  // --- Easing and tracks (vw, as functions of sweep progress w 0..1).
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const clamp01 = (x) => clamp(x, 0, 1);
  const inOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
  const outCubic = (x) => 1 - (1 - x) ** 3;
  const inQuad = (x) => x * x;
  // The front's x at the bottom row. It starts with the whole column parked
  // off the left edge (at least 60px: a dot and its glow must not peek on a
  // phone) and ends with it off the right; eased so it settles.
  const span = () => STEP * (rowCount() - 1);
  const off = () => Math.max(2, 60 / (window.innerWidth / 100));
  const frontAt = (w) => -span() - off() + (100 + 2 * span() + off() + 24) * inOutCubic(clamp01(w));
  // The first p (0..1) at which fn(warp(p)) holds, on the keyframe grid.
  const STOPS = 50;
  const firstP = (warp, fn) => { for (let k = 0; k <= STOPS; k++) if (fn(warp(k / STOPS))) return k / STOPS; return 1; };
  // The w at which the front puts row i's leader at x vw.
  const wFor = (i, x) => { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (frontAt(m) + rowX(i) < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  // A pause in the drag: it stops dead at `at` between `from` and `to` of
  // the time (an impact), then eases back up to speed.
  const pauseWarp = (from, to, at) => (p) => (p < from ? (p / from) * at : p < to ? at : at + (1 - at) * inQuad((p - to) / (1 - to)));
  // The same pause, but the approach moves early and settles into it: the
  // position (not the progress) eases out, so the column is clearly moving
  // the moment it starts.
  const invEase = (e) => { let lo = 0, hi = 1; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (inOutCubic(m) < e) lo = m; else hi = m; } return (lo + hi) / 2; };
  const outQuad = (x) => 1 - (1 - x) ** 2;
  const settleWarp = (from, to, at) => (p) => (p < from ? invEase(inOutCubic(at) * outQuad(p / from)) : p < to ? at : at + (1 - at) * inQuad((p - to) / (1 - to)));
  // The failure: the front stops dead at FAIL_W when it is FAIL_FROM into the
  // wipe, stays still for FAIL_STILL (the shake), then time creeps by CREEP
  // while the retry runs, and from FAIL_TO it accelerates away.
  const FAIL_W = 0.38, FAIL_FROM = 0.33, FAIL_STILL = 0.1, FAIL_TO = 0.7, CREEP = 0.06;
  const warpFail = (at) => (p) => {
    if (p < FAIL_FROM) return (p / FAIL_FROM) * at;
    if (p < FAIL_FROM + FAIL_STILL) return at;
    if (p < FAIL_TO) return at + CREEP * inOutCubic((p - FAIL_FROM - FAIL_STILL) / (FAIL_TO - FAIL_FROM - FAIL_STILL));
    const w1 = at + CREEP;
    return w1 + (1 - w1) * inQuad((p - FAIL_TO) / (1 - FAIL_TO));
  };
  // The signal: the front stops when its signal row's leader reaches where
  // the signal landed, holds while the signal shrinks into it, then goes on.
  const PICK_FROM = 0.3, PICK_TO = 0.42;
  const kf = (name, fn) => `@keyframes ${name}{${Array.from({ length: STOPS + 1 }, (_, k) => { const p = k / STOPS; return `${(p * 100).toFixed(1)}%{${fn(p)}}`; }).join('')}}`;

  function front(col) {
    const rows = col.map((r, i) => {
      const d = dots(r);
      const x = rowX(i) - r.lag;
      return `<div class="row${r.fail ? ' failing' : ''}${r.carry ? ' carrying' : ''}" style="top:${rowTop(i)}px;--len:${lenCss(r.len)}">
  ${r.len ? `<div class="line${d.running ? ' dash' : ''}" style="left:calc(${x}vw - var(--len));width:var(--len);--c:${d.line}"></div><div class="dot" style="left:calc(${x}vw - var(--len));--f:${d.start[0]};--s:${d.start[1]}">${icon(r.status === 'pending' ? 'retry' : r.icon, d.start[0])}</div>` : ''}
  ${r.status === 'pending' ? '' : `<div class="dot lead" style="left:${x}vw;--f:${d.lead[0]};--s:${d.lead[1]}">${icon(r.icon, d.lead[0])}</div>`}
</div>`;
    }).join('');
    return `<div class="front"><div class="rail"></div>${rows}</div>`;
  }
  const WIPES = ['rail', 'fail', 'signal'];
  const wipeBeats = { rail: 2, fail: 4, signal: 5 };
  function pickWipe(opts, holdMs, B, isEnd) {
    let w = opts?.wipe ?? (isEnd ? 'rail' : cfg().theme?.options?.wipe ?? 'rail');
    if (w === 'cycle') w = WIPES[(opts?.index ?? 0) % WIPES.length];
    if (!WIPES.includes(w)) w = 'rail';
    // A slow wipe needs the card to be fully up for at least a beat.
    if (holdMs < (wipeBeats[w] - 1) * B) { console.warn(`demo: the ${w} wipe needs a hold of at least ${wipeBeats[w] - 1} beats (this card holds ${(holdMs / B).toFixed(1)}); using rail`); w = 'rail'; }
    return w;
  }

  function style(B, out, keyCount, wipe, col) {
    const T = colors();
    const leave = out < Infinity;
    const fail = wipe === 'fail';
    const signal = wipe === 'signal';
    const inMs = wipeBeats[wipe] * B;
    const outMs = 2 * B;
    const n = col.length;
    // The signal's steps, then the drag: flight to the impact, the shake,
    // then the front starts.
    const impactMs = signal ? 1.0 * B : 0;
    const startMs = signal ? 1.3 * B : 0;
    const dragIn = inMs - startMs;
    const pickStartMs = startMs + PICK_FROM * dragIn, pickEndMs = startMs + PICK_TO * dragIn;
    const D = span();
    const EDGE = 20;                                          // px the stage overhangs the frame, so the shake never shows its edge
    // The rail: a line from the top row's leader to the bottom row's, with a glow.
    const vw = window.innerWidth / 100;
    const railLen = Math.hypot(D * vw, window.innerHeight);
    const railAng = (Math.atan2(D * vw, window.innerHeight) * 180) / Math.PI;
    // The rows involved, and where the front stops for them.
    const fr = col.findIndex((r) => r.fail), sr = col.findIndex((r) => r.icon === 'signal');
    // The signal lands on the title: the front pauses with the signal row's leader at mid-frame.
    const pickW = signal ? wFor(sr, 50) : 0;
    // On a narrow frame the stop moves right so the failed piece (its bar has a px floor) is fully in frame.
    const failLenVw = fr >= 0 ? Math.max(col[fr].len, (col[fr].len * 7) / vw) : 0;
    const failW = fail ? Math.max(FAIL_W, wFor(fr, 4 + failLenVw + DOT / vw)) : FAIL_W;
    const warp = fail ? warpFail(failW) : signal ? settleWarp(PICK_FROM, PICK_TO, pickW) : (p) => p;
    const signalX = signal ? frontAt(pickW) + rowX(sr) : 0;
    const signalY = rowTop(sr) + ROW / 2;
    // The retried row, as the UI draws it: pinned at its start while the
    // retry's dashed line runs on to the rail, then one line with the
    // completed-to-failed gradient; carried off with the front afterwards.
    const failStop = frontAt(failW) + rowX(fr);
    const w1 = failW + CREEP;
    const pieceX = (w) => failStop - failLenVw + Math.max(0, frontAt(w) - frontAt(w1));
    const failAt = FAIL_FROM * inMs, retryAt = (FAIL_FROM + FAIL_STILL) * inMs;
    const retryDone = (w) => w >= failW + 0.8 * CREEP;        // the retry completes near the end of the creep, still in frame
    const doneMs = fail ? firstP(warp, retryDone) * inMs : 0;
    const doneLeadX = fail ? frontAt(warp(doneMs / inMs)) + rowX(fr) : 0;   // where the retry's lead sits when it completes, vw
    const failLen = fr >= 0 ? col[fr].len : 0;
    // The text: in once the column's bars have cleared the title's rows (the
    // title's right end is at ~70vw, bars start up to 23vw behind their
    // leader); for the signal it grows out of the pickup point, and the
    // pulse there bridges the wait.
    const titleRow = Math.round(n * 0.47);
    const clearMs = startMs + firstP(warp, (w) => frontAt(w) + rowX(titleRow) >= 92) * dragIn;
    const t0 = signal ? clearMs - 0.35 * B : fail ? clearMs - 0.25 * B : Math.max(inMs - 0.6 * B, clearMs - 0.15 * B);
    const pulseMs = signal ? Math.max(pickEndMs, t0 + 0.05 * B) : 0;   // the pulse at the landing point runs into the title's birth
    // Dashes on running rows keep crawling, except while the front is stopped dead.
    const dashAt = (p) => { const t = p * inMs; const from = fail ? failAt : pickStartMs, to = fail ? retryAt : pickEndMs; const eff = fail || signal ? (t < from ? t : t < to ? from : t - (to - from)) : t; return `transform:translateX(${(-(6 * S) * (eff / 1800)).toFixed(2)}px)`; };
    // The polygons stay in plain vw: a calc() mixing units keeps the clip
    // animation off the compositor, and then the card's edge lags the column
    // in a recording.
    // The stage overhangs the frame by EDGE, so its corners sit EDGE above
    // and below the rail's ends: the edge is extended along the rail's slope.
    const E = EDGE / vw, EY = (D * EDGE) / window.innerHeight;
    const clipIn = (f) => `clip-path:polygon(0 0,${(f + D + E + EY).toFixed(2)}vw 0,${(f + E - EY).toFixed(2)}vw 100%,0 100%)`;
    const inFrames = [
      kf('demoClipIn', (p) => clipIn(frontAt(warp(p)))),
      kf('demoFrontIn', (p) => `transform:translateX(${frontAt(warp(p)).toFixed(2)}vw)`),
      kf('demoDashIn', dashAt),
      ...(fail ? [
        kf('demoFailed', (p) => `opacity:${p >= FAIL_FROM ? 1 : 0};left:${pieceX(warp(p)).toFixed(2)}vw`),
        // The row's line runs from its start to the rail: the retry's dashes until it completes, then the gradient.
        kf('demoRetry', (p) => { const w = warp(p); const f = frontAt(w) + rowX(fr); return `width:${Math.max(0, f - pieceX(w)).toFixed(2)}vw;background-image:${retryDone(w) ? `linear-gradient(90deg,${UI.line.failed} 0%,${UI.line.completed} 100%)` : `repeating-linear-gradient(to right,${UI.line.retry} 0 ${3 * S}px,transparent ${3 * S}px ${6 * S}px)`}`; }),
      ] : []),
    ].join('\n');
    const outFrames = leave ? [
      kf('demoClipOut', (p) => { const f = frontAt(p); return `clip-path:polygon(${(f + D + E + EY).toFixed(2)}vw 0,100% 0,100% 100%,${(f + E - EY).toFixed(2)}vw 100%)`; }),
      kf('demoFrontOut', (p) => `transform:translateX(${frontAt(p).toFixed(2)}vw)`),
    ].join('\n') : '';
    const shake = fail ? `animation:demoShake ${0.7 * B}ms linear ${failAt}ms forwards` : signal ? `animation:demoShake ${0.6 * B}ms linear ${impactMs}ms forwards` : '';
    const up = (delay, dur = B) => `opacity:0;animation:demoUp ${dur}ms cubic-bezier(.2,.8,.2,1) ${delay.toFixed(0)}ms forwards`;
    return `<style>
:host{position:fixed;inset:0;z-index:2147483647;pointer-events:none}
.demo{position:absolute;inset:0;overflow:hidden;font-family:${sans()}}
.demo .shake{position:absolute;inset:0;${shake}}
.demo .stage{position:absolute;inset:-${EDGE}px;background:${T.bg};clip-path:polygon(0 0,0 0,0 100%,0 100%);animation:demoClipIn ${dragIn}ms linear ${startMs}ms forwards${leave ? `, demoClipOut ${outMs}ms linear ${out}ms forwards` : ''}}
${fail ? `.demo .alarm{position:absolute;inset:0;background:${UI.dot.failed[0]};opacity:0;mix-blend-mode:${T.alarmBlend ?? 'normal'};animation:demoAlarm ${0.8 * B}ms ease ${failAt}ms forwards}` : ''}
.demo .front{position:absolute;left:0;top:0;right:0;bottom:0;transform:translateX(${(-D - off()).toFixed(2)}vw);animation:demoFrontIn ${dragIn}ms linear ${startMs}ms forwards${leave ? `, demoFrontOut ${outMs}ms linear ${out}ms forwards` : ''}}
.demo .rail{position:absolute;left:${D.toFixed(2)}vw;top:0;width:2px;height:${railLen.toFixed(0)}px;margin-left:-1px;transform-origin:50% 0;transform:rotate(${railAng.toFixed(2)}deg);background:${UI.line.workflow};box-shadow:0 0 2px ${T.railHalo ?? '#fff'},0 0 14px ${UI.line.workflow},0 0 40px ${T.uv}${T.railShade ? `,${T.railShade}` : ''}}
.demo .row{position:absolute;left:0;right:0;height:${ROW}px}
.demo .line{position:absolute;top:${(ROW - 2 * RADIUS) / 2}px;height:${2 * RADIUS}px;border-radius:9999px;background:var(--c)}
.demo .line.dash{background:transparent;overflow:hidden}
.demo .line.dash::after{content:'';position:absolute;inset:0 -80px 0 0;background-image:repeating-linear-gradient(to right,var(--c) 0 ${3 * S}px,transparent ${3 * S}px ${6 * S}px);background-size:${6 * S}px 100%;animation:demoDashIn ${inMs}ms linear forwards}
.demo .dot{position:absolute;top:${(ROW - DOT) / 2}px;width:${DOT}px;height:${DOT}px;margin-left:${-DOT / 2}px;border-radius:${DOT_R}px;border:${STROKE}px solid var(--s);background:var(--f);box-sizing:border-box}
.demo .dot svg{position:absolute;left:50%;top:50%;width:${ICON}px;height:${ICON}px;transform:translate(-50%,-50%)}
.demo .ring{position:absolute;left:${-DOT / 2}px;top:${-DOT / 2}px;width:${DOT}px;height:${DOT}px;border-radius:50%;border:3px solid ${UI.dot.signaled[0]};opacity:0}
${fail ? `
.demo .failing .line,.demo .failing .dot{animation:demoHide 1ms linear ${failAt}ms forwards}
.demo .failing .line::after{display:none}
.demo .failed{position:absolute;top:${rowTop(fr)}px;height:${ROW}px;opacity:0;animation:demoFailed ${inMs}ms linear forwards}
.demo .failed .dot.start{left:0}
.demo .failed .dot.start .i-done{opacity:0;animation:demoShow 1ms linear ${doneMs.toFixed(0)}ms forwards}
.demo .failed .dot.start .i-retry{animation:demoHide 1ms linear ${doneMs.toFixed(0)}ms forwards}
.demo .failed .caption{position:absolute;left:${DOT}px;top:${-ROW * 0.55}px;font:500 ${12 * S}px ${mono()};letter-spacing:.08em;color:${UI.line.retry};white-space:nowrap;opacity:0;animation:demoShow 1ms linear ${failAt}ms forwards, demoCaption ${inMs}ms linear forwards}
.demo .failed .line.retry{left:0;width:0;background:transparent;animation:demoRetry ${inMs}ms linear forwards}
.demo .failed .line.retry .dot.lead{left:100%;top:${-(DOT - 2 * RADIUS) / 2}px;opacity:0;animation:demoShow 1ms linear ${doneMs.toFixed(0)}ms forwards, demoPop ${0.4 * B}ms cubic-bezier(.2,.8,.2,1) ${doneMs.toFixed(0)}ms}
.demo .rings.recover{left:calc(${doneLeadX.toFixed(2)}vw + ${EDGE}px);top:${(rowTop(fr) + ROW / 2 + EDGE).toFixed(1)}px}
.demo .rings.recover .ring{border-color:${UI.line.completed};animation:demoRecoverRing ${0.5 * B}ms cubic-bezier(.2,.7,.3,1) ${doneMs.toFixed(0)}ms forwards}
.demo .rings.recover .ring.second{border-width:2px;animation:demoRingMid ${0.8 * B}ms cubic-bezier(.2,.7,.3,1) ${(doneMs + 0.1 * B).toFixed(0)}ms forwards}` : ''}
${signal ? `
.demo .signal{position:absolute;left:${signalX.toFixed(2)}vw;top:${signalY}px;width:0;height:0;opacity:0;transform:translate(46vw,-42vw) scale(4.5);animation:demoSignalPath ${inMs}ms linear forwards}
.demo .signal .jolt{position:absolute;left:0;top:0;width:0;height:0;animation:demoJolt ${0.6 * B}ms linear ${impactMs}ms forwards}
.demo .signal .dot{left:0;top:${-DOT / 2}px;box-shadow:0 0 30px ${UI.dot.signaled[0]}88}
.demo .signal .trail{position:absolute;left:0;top:${-DOT * 0.3}px;width:40vw;height:${DOT * 0.6}px;border-radius:9999px;transform-origin:0 50%;transform:rotate(-39.3deg);background:linear-gradient(90deg,${UI.dot.signaled[0]}cc 0%,${UI.dot.signaled[0]}00 100%);animation:demoTrailGone ${0.3 * B}ms ease ${impactMs}ms forwards}
.demo .ringAfter{position:absolute;left:${signalX.toFixed(2)}vw;top:${signalY}px;width:0;height:0}
.demo .ringAfter .ring{animation:demoRing ${0.9 * B}ms cubic-bezier(.2,.7,.3,1) ${impactMs}ms forwards}
.demo .ring.second{border-width:2px;animation:demoRingWide ${1.1 * B}ms cubic-bezier(.2,.7,.3,1) ${impactMs + 0.12 * B}ms forwards}
.demo .rings{position:absolute;width:0;height:0}
.demo .rings.pulse{left:calc(${signalX.toFixed(2)}vw + ${EDGE}px);top:${(signalY + EDGE).toFixed(1)}px}
.demo .rings.pulse .ring{animation:demoRingWide ${1.1 * B}ms cubic-bezier(.2,.7,.3,1) ${pulseMs.toFixed(0)}ms forwards}
.demo .carrying .dot.lead{opacity:0;animation:demoShow 1ms linear ${pickEndMs}ms forwards}
.demo .carrying .dot.lead::after{content:'';position:absolute;inset:-${STROKE}px;border-radius:50%;border:3px solid ${UI.dot.signaled[0]};opacity:0;animation:demoRecoverRing ${0.5 * B}ms cubic-bezier(.2,.7,.3,1) ${pickEndMs}ms forwards}` : ''}
.demo .grain{position:absolute;inset:0;opacity:${T.grain ?? 0.07};mix-blend-mode:${T.grainBlend ?? 'normal'};background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");background-size:240px 240px}
.demo .glow{position:absolute;left:50%;top:42%;width:${(170 * (T.glowScale ?? 1)).toFixed(0)}vw;height:${(115 * (T.glowScale ?? 1)).toFixed(0)}vw;transform:translate(-50%,-50%);background:${T.glow ?? `radial-gradient(closest-side,${T.violet}2e 0%,${T.uv}26 25%,${T.uv}14 45%,${T.uv}06 62%,transparent 78%)`};opacity:.9;animation:demoBreathe ${16 * B}ms ease-in-out infinite alternate}
.demo .axis{position:absolute;inset:0;background-image:repeating-linear-gradient(90deg,${T.uv} 0 1px,transparent 1px ${(60 * S).toFixed(0)}px),repeating-linear-gradient(90deg,${T.uv} 0 2px,transparent 2px ${(300 * S).toFixed(0)}px);background-position:calc(50% + ${(30 * S).toFixed(0)}px) 0,calc(50% + ${(150 * S).toFixed(0)}px) 0;opacity:${T.axis ?? 0.24};--tick:${(60 * S).toFixed(0)}px;mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 100%);-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 100%)}
.demo .stars i{position:absolute;width:3px;height:3px;border-radius:50%;background:${T.star ?? T.text};opacity:.8;animation:demoTwinkle var(--tw) ease-in-out var(--d) infinite alternate, demoDrift var(--dr) ease-in-out var(--d) infinite alternate}
.demo .content{position:absolute;inset:${EDGE}px;display:flex;align-items:center;justify-content:center;padding:0 7vw min(4vw,40px)}
.demo .block{display:flex;flex-direction:column;align-items:center;gap:min(20px,2.4vw);text-align:center;filter:blur(12px);animation:demoSharpen ${1.1 * B}ms cubic-bezier(.2,.8,.2,1) ${(signal ? t0 - 0.9 * B : t0).toFixed(0)}ms forwards${leave ? `, demoSoften ${0.6 * B}ms ease-in ${out}ms forwards` : ''}}
.demo .chip{display:inline-flex;align-items:center;gap:10px;padding:min(8px,1vw) min(14px,1.8vw);border:1px solid color-mix(in srgb,${T.uv} 60%,${T.text});font-family:${mono()};font-size:clamp(11px,2.6vw,14px);letter-spacing:.22em;text-transform:uppercase;color:${T.text};${up(signal ? t0 + 0.3 * B : t0 - 0.1 * B)}}
.demo .chip i{width:6px;height:6px;border-radius:50%;background:${T.lime}}
.demo .row-keys{display:flex;gap:min(12px,1.6vw);${up(signal ? t0 + 0.4 * B : t0 + 0.2 * B)}}
.demo .key.glyph{padding:0;width:min(64px,10vw)}
.demo .key{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:min(64px,10vw);height:min(64px,10vw);padding:0 min(16px,2vw);border:1px solid transparent;border-radius:4px;background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.onAccent ?? T.text};font-family:${mono()};font-size:min(30px,5vw);font-weight:500;box-shadow:0 12px 40px ${T.uv}66}
${Array.from({ length: keyCount }, (_, i) => i ? `.demo .key.k${i + 1}{background:${T.bg};color:${T.text};border-color:${T.uv};box-shadow:none}` : '').join('\n')}
.demo .key.outline{background:${T.bg};color:${T.text};border-color:${T.uv};box-shadow:none}
.demo.end .axis{animation:demoTicks ${(60 * S * 1000).toFixed(0)}ms linear infinite}
@keyframes demoTicks{to{background-position:calc(50% + ${(30 * S).toFixed(0)}px + var(--tick)) 0,calc(50% + ${(150 * S).toFixed(0)}px + var(--tick)) 0}}
.demo h1{margin:0;font-size:min(84px,10.5vw);line-height:1.02;font-weight:300;letter-spacing:-.03em;color:${T.text};opacity:0;--sy:0px;animation:${signal ? `demoEmerge ${1.0 * B}ms cubic-bezier(.2,.8,.2,1) ${t0.toFixed(0)}ms forwards` : `demoUp ${1.3 * B}ms cubic-bezier(.2,.8,.2,1) ${t0.toFixed(0)}ms forwards`}}
.demo .rule{width:min(120px,16vw);height:2px;background:linear-gradient(255deg,${T.mint} 0%,${T.lime} 100%);transform:scaleX(0);opacity:0;animation:demoRule ${B}ms cubic-bezier(.65,0,.15,1) ${(t0 + (signal ? 0.45 : 0.6) * B).toFixed(0)}ms forwards}
.demo p{margin:0;max-width:60ch;font-size:min(26px,4.2vw);font-weight:400;line-height:1.4;color:${T.muted};${up(t0 + (signal ? 0.6 : 0.8) * B)}}
.demo .url{display:inline-block;margin-top:min(8px,1vw);padding:min(16px,2vw) min(30px,4vw);background:linear-gradient(45deg,${T.violet} 0%,${T.uv} 100%);color:${T.onAccent ?? T.text};font-family:${mono()};font-size:min(26px,4vw);font-weight:500;letter-spacing:.02em;${up(t0 + 0.8 * B)}}
.demo .lines{display:flex;flex-wrap:wrap;justify-content:center;gap:min(10px,1.2vw) min(20px,2.4vw);font-family:${mono()};font-size:clamp(16px,2.8vw,18px);letter-spacing:.14em;text-transform:uppercase;color:${T.muted};${up(t0 + 1.2 * B)}}
.demo .lines span+span::before{content:'·';margin-right:min(20px,2.4vw);opacity:.6}
${inFrames}
${outFrames}
${kf('demoShake', (p) => { const d = Math.exp(-4.2 * p); return `transform:translate(${(13 * d * Math.sin(2 * Math.PI * 4.5 * p)).toFixed(1)}px,${(6 * d * Math.sin(2 * Math.PI * 6.5 * p)).toFixed(1)}px)`; })}
${fail ? '@keyframes demoAlarm{0%{opacity:0}10%{opacity:.2}100%{opacity:0}}' : ''}
@keyframes demoRecoverRing{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(2.6)}}
@keyframes demoHide{to{opacity:0}}
${fail ? kf('demoCaption', (p) => `color:${retryDone(warp(p)) ? UI.line.completed : UI.line.retry}`) : ''}
@keyframes demoShow{to{opacity:1}}
@keyframes demoPop{0%{transform:scale(.4)}100%{transform:scale(1)}}
${signal ? kf('demoSignalPath', (p) => {
      const t = p * inMs;
      if (t < impactMs) { const e = (t / impactMs) ** 1.8; return `opacity:1;transform:translate(${(46 * (1 - e)).toFixed(2)}vw,${(-42 * (1 - e)).toFixed(2)}vw) scale(${(4.5 - 2 * e).toFixed(3)})`; }
      if (t < impactMs + 0.3 * B) { const q = (t - impactMs) / (0.3 * B); return `opacity:1;transform:translate(0,0) scale(${(2.5 + 0.7 * Math.sin(Math.PI * q)).toFixed(3)})`; }
      if (t < pickStartMs) return 'opacity:1;transform:translate(0,0) scale(2.5)';
      if (t < pickEndMs) { const q = (t - pickStartMs) / (pickEndMs - pickStartMs); return `opacity:1;transform:translate(0,0) scale(${(2.5 - 1.5 * outCubic(q)).toFixed(3)})`; }
      return 'opacity:0;transform:translate(0,0) scale(1)';
    }) : ''}
${kf('demoJolt', (p) => { const d = Math.exp(-5 * p); return `transform:translate(${(10 * d * Math.sin(2 * Math.PI * 7 * p)).toFixed(1)}px,${(8 * d * Math.sin(2 * Math.PI * 9 * p)).toFixed(1)}px) rotate(${(9 * d * Math.sin(2 * Math.PI * 6 * p)).toFixed(1)}deg)`; })}
@keyframes demoTrailGone{to{opacity:0}}
@keyframes demoRing{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(6)}}
@keyframes demoRingMid{0%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(5)}}
@keyframes demoRingWide{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(11)}}
@keyframes demoEmerge{0%{opacity:0;transform:translateY(var(--sy)) scale(.5)}40%{opacity:0;transform:translateY(calc(var(--sy) * .6)) scale(.7)}100%{opacity:1;transform:none}}
@keyframes demoBreathe{to{transform:translate(-50%,-50%) scale(1.08)}}
@keyframes demoTwinkle{from{opacity:.25}to{opacity:.9}}
@keyframes demoDrift{to{transform:translate(var(--dx),var(--dy))}}
@keyframes demoSharpen{to{filter:blur(0)}}
@keyframes demoSoften{to{filter:blur(12px)}}
@keyframes demoUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@media (max-width:480px){.demo h1{font-size:12.5vw}.demo p{font-size:4.8vw}.demo .chip{font-size:3.2vw}.demo .lines{flex-direction:column;gap:.5em}.demo .lines span+span::before{content:none;margin:0}}
@keyframes demoRule{0%{transform:scaleX(0);opacity:0}15%{opacity:1}100%{transform:scaleX(1);opacity:1}}
</style>`;
  }
  const stars = [[8, 14], [21, 7], [34, 19], [61, 9], [73, 17], [88, 12], [93, 26], [14, 36], [82, 38], [5, 48], [47, 5], [57, 25]].map((p, i) => [...p, [5, 7, 4, 6, 5, 8, 4, 7, 6, 5, 9, 6][i], [23, 31, 19, 27, 35, 21, 29, 25, 33, 17, 37, 23][i], [9, -7, 6, -9, 8, -5, 7, -8, 9, -6, 5, -7][i], [-6, 5, 8, -4, 6, 9, -8, -5, 7, 8, -9, 6][i]]);
  function scene(B, opts) {
    const T = colors();
    const rest = opts?.rest ?? cfg().theme?.options?.rest ?? 'axis';
    return `<div class="glow"></div><div class="grain"></div>
${rest === 'axis' ? '<div class="axis"></div>' : T.star === 'transparent' ? '' : `<div class="stars">${stars.map(([x, y, tw, dr, dx, dy], i) => `<i style="left:${x}%;top:${y}%;--tw:${tw * B}ms;--dr:${dr * B}ms;--dx:${dx}px;--dy:${dy}px;--d:${-i * 1.7 * B}ms"></i>`).join('')}</div>`}`;
  }
  const keyCaps = (keys, outline = false) => (keys.length ? `<div class="row-keys">${keys.map((k, i) => `<span class="key k${i + 1}${[...String(k)].length === 1 ? ' glyph' : ''}${outline ? ' outline' : ''}">${esc(k)}</span>`).join('')}</div>` : '');
  // The card lives in a shadow root, so the page's own CSS cannot restyle it.
  function mount(html, cls) {
    document.getElementById('demo-transition')?.remove();
    const el = document.createElement('div');
    el.id = 'demo-transition';
    const i = html.indexOf('</style>') + 8;
    const root = el.attachShadow({ mode: 'open' });
    root.innerHTML = `${html.slice(0, i)}<div class="demo${cls ? ` ${cls}` : ''}">${html.slice(i)}</div>`;
    document.body.append(el);
    return root;
  }
  const extras = (wipe, col) => {
    const fr = col.findIndex((r) => r.fail);
    const label = cfg().theme?.options?.retryLabel;
    const failed = wipe === 'fail' ? `<div class="failed">${label ? `<div class="caption">${esc(label)}</div>` : ''}<div class="line retry"><div class="dot lead" style="--f:${UI.dot.completed[0]};--s:${UI.dot.completed[1]}">${icon(col[fr].icon, UI.dot.completed[0])}</div></div><div class="dot start" style="--f:${startedDot()[0]};--s:${startedDot()[1]}"><span class="i-retry">${icon('retry', startedDot()[0])}</span><span class="i-done">${icon(col[fr].icon, startedDot()[0])}</span></div></div>` : '';
    const sig = wipe === 'signal' ? `<div class="signal"><div class="jolt"><div class="trail"></div><div class="dot" style="--f:${UI.dot.signaled[0]};--s:${UI.dot.signaled[1]}">${icon('signal', UI.dot.signaled[0])}</div></div></div><div class="ringAfter"><div class="ring"></div><div class="ring second"></div></div>` : '';
    return `${front(col)}${failed}${sig}`;
  };
  // Rings that must stay on the card: drawn inside the clipped stage.
  const stageExtras = (wipe) => (wipe === 'fail' ? '<div class="rings recover"><div class="ring"></div><div class="ring second"></div></div>' : wipe === 'signal' ? '<div class="rings pulse"><div class="ring"></div></div>' : '');
  // Draws a card. For the signal wipe the signal lands on the title, so the
  // card is drawn once to measure where the title sits, then again with the
  // signal row at that height; the title then grows out of that point.
  function render(B, out, keys, wipe, seed, opts, block) {
    let signalRow;
    for (let pass = 0; pass < 2; pass++) {
      const col = buildColumn(wipe, seed, signalRow);
      const root = mount(`${style(B, out, keys.length, wipe, col)}<div class="shake"><div class="stage">${scene(B, opts)}
<div class="content"><div class="block">${block}</div></div>${wipe === 'fail' ? '<div class="alarm"></div>' : ''}${stageExtras(wipe)}</div>${extras(wipe, col)}</div>`, opts?.end ? 'end' : '');
      if (wipe !== 'signal') return;
      const h1 = root.querySelector('h1');
      if (!h1) return;
      const r = h1.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      const want = clamp(Math.round(cy / ROW), 2, rowCount() - 3);
      const sr = col.findIndex((x) => x.icon === 'signal');
      if (want === sr || pass === 1) { h1.style.setProperty('--sy', `${(rowTop(sr) + ROW / 2 - cy).toFixed(1)}px`); return; }
      signalRow = want;
    }
  }
  window.__demo = {
    transition(step, title, subtitle, holdMs, opts) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      holdMs ??= 4 * B;
      const wipe = pickWipe(opts, holdMs, B, false);
      const IN = 2 * B, OUT = 2 * B;
      render(B, IN + holdMs, keys, wipe, (opts?.index ?? 0) + 1, opts, `
  ${step ? `<div class="chip"><i></i>${esc(step)}</div>` : ''}
  ${keyCaps(keys)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}`);
      return IN + holdMs + OUT;
    },
    end({ title, subtitle, url, lines = [] }, holdMs, opts) {
      const B = cfg().beat ?? 510;
      const keys = cfg().keys ?? [];
      const wipe = pickWipe(opts, Infinity, B, true);
      render(B, Infinity, keys, wipe, (opts?.index ?? 0) + 1, { ...opts, end: true }, `
  ${keyCaps(keys, true)}
  <h1>${esc(title)}</h1>
  <div class="rule"></div>
  ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  ${url ? `<div class="url">${esc(url)}</div>` : ''}
  ${lines.length ? `<div class="lines">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>` : ''}`);
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

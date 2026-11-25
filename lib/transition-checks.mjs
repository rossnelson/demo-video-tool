// Judges card transitions: does the card's exit move anything, is the move
// big enough to read, and does a frame in the middle wash out to grey.
// The theme preview samples a card (sampleCard, in the page) and judges it
// here; the review of a built video uses judgeWash on its frames.

export const FPS = 12;            // frames per second for the strips and checks
export const MIN_MOVE = 60;       // px: an exit that moves less does not read
export const MIN_EXIT = 0.3;      // s: an exit shorter than this does not read
export const WASH_RATIO = 0.6;    // a middle frame's spread under this share of the ends' range
export const WASH_GAP = 64;       // ...when the ends differ this much in mean luminance (0-255)
export const WASH_FIT = 0.12;     // ...and the frame is a cross-fade of the ends within this error
const STILL = 1;                  // px: less is not a move

// Runs in the page: each element inside the card's shadow root, with its box,
// transform, clip and opacity. The shadow root's top-level elements are the
// card's root: their own opacity is left out, so a whole-card fade is not a
// change of an element.
export function sampleCard() {
  const host = document.getElementById('demo-transition');
  const root = host?.shadowRoot;
  if (!root) return [];
  const out = [];
  const tops = new Set([...root.children]);
  const walk = (el, depth, alpha, path) => {
    const cs = getComputedStyle(el);
    const own = tops.has(el) ? 1 : Number(cs.opacity);
    const a = alpha * own;
    if (!['STYLE', 'SCRIPT', 'LINK'].includes(el.tagName)) {
      const r = el.getBoundingClientRect();
      out.push({
        label: path,
        x: r.x, y: r.y, w: r.width, h: r.height,
        transform: cs.transform, clip: cs.clipPath,
        opacity: a, top: tops.has(el),
      });
    }
    [...el.children].forEach((c, i) => walk(c, depth + 1, a, `${path} > ${c.tagName.toLowerCase()}${c.classList.length ? `.${[...c.classList].join('.')}` : ''}:${i}`));
  };
  [...root.children].forEach((c, i) => walk(c, 0, 1, `${c.tagName.toLowerCase()}${c.classList.length ? `.${[...c.classList].join('.')}` : ''}:${i}`));
  return out;
}

const move = (a, b) => Math.max(
  Math.abs(a.x + a.w / 2 - (b.x + b.w / 2)),
  Math.abs(a.y + a.h / 2 - (b.y + b.h / 2)),
  Math.abs(a.w - b.w),
  Math.abs(a.h - b.h),
);
const name = (label) => label.split(' > ').pop().replace(/:\d+$/, '');

// The motion of each element over a window: the largest move from the first
// frame, whether its clip changed, and the frames in which it changed.
function motion(samples) {
  const first = samples[0] ?? [];
  return first.map((el, i) => {
    let most = 0, clipped = false, faded = false, firstChange = -1, lastChange = -1;
    for (let f = 1; f < samples.length; f++) {
      const now = samples[f][i], prev = samples[f - 1][i];
      if (!now || now.label !== el.label) continue;
      most = Math.max(most, move(el, now));
      if (now.clip !== el.clip) clipped = true;
      const fades = !el.top && Math.abs(now.opacity - prev.opacity) > 0.02;
      if (fades) faded = true;
      if (move(prev, now) > STILL || now.clip !== prev.clip || fades) {
        if (firstChange < 0) firstChange = f;
        lastChange = f;
      }
    }
    // Seen: visible with a size in some frame (an exit may bring in a
    // sweep that starts hidden).
    const seen = samples.some((f) => f[i] && f[i].opacity > 0.05 && f[i].w * f[i].h > 0);
    return { el, most, clipped, faded, firstChange, lastChange, seen };
  });
}

// The exit's findings. `exit` and `hold` are sampleCard() results frame by
// frame; motion that an element already has while the card holds (a bob, a
// drift) is not exit. A clip change is a wipe, which hides the element, so
// it counts as a full move. Parts that fade out one after another (a stepped
// exit) are an exit too, with no movement to judge; parts that all fade at
// the same moment are the whole card fading, which is no exit.
// Returns { findings: [...], most, seconds, element }.
export function judgeExit(exit, hold = [], fps = FPS) {
  const jitter = new Map(motion(hold).map((m) => [m.el.label, m]));
  const changes = motion(exit)
    .filter((m) => m.seen)
    .map((m) => {
      const still = jitter.get(m.el.label);
      const base = still ? still.most : 0;
      const clipped = m.clipped && !(still?.clipped);
      const most = clipped ? Math.max(MIN_MOVE, m.most - base) : m.most - base;
      return { ...m, most: Math.max(0, most), clipped, faded: m.faded && !(still?.faded) };
    });
  const moves = changes.filter((m) => m.clipped || m.most > STILL);
  const fades = changes.filter((m) => m.faded && !moves.includes(m));
  const staggered = new Set(fades.map((m) => m.firstChange)).size > 1;
  if (!moves.length && !staggered) {
    return { findings: [{ kind: 'no exit', text: 'no exit: nothing on the card moves when it leaves, only the whole card fades' }], most: 0, seconds: 0 };
  }
  const parts = [...moves, ...(staggered ? fades : [])];
  const seconds = (Math.max(...parts.map((m) => m.lastChange)) - Math.min(...parts.map((m) => m.firstChange)) + 1) / fps;
  const findings = [];
  const top = moves.length ? moves.reduce((x, y) => (y.most > x.most ? y : x)) : null;
  if (top && top.most < MIN_MOVE) {
    findings.push({ kind: 'exit too small', text: `exit too small: the largest movement is ${Math.round(top.most)} px (${name(top.el.label)}), under ${MIN_MOVE} px` });
  }
  if (seconds < MIN_EXIT) {
    findings.push({ kind: 'exit too small', text: `exit too small: the exit lasts ${seconds.toFixed(2)} s, under ${MIN_EXIT} s` });
  }
  return { findings, most: top?.most ?? 0, seconds, element: top ? name(top.el.label) : null };
}

// How well a frame is a cross-fade of the first and the last: the share
// `alpha` of the way from the first to the last, and the error left over, as
// a share of the difference between the ends. A frame that an opacity fade
// makes is close to 0; a slide, a wipe, or a flat colour block is not.
export function crossFade(first, last, frame) {
  let dd = 0, yd = 0;
  for (let i = 0; i < frame.length; i++) {
    const d = last[i] - first[i], y = frame[i] - first[i];
    dd += d * d; yd += y * d;
  }
  if (!dd) return { alpha: 0, error: 1 };
  const alpha = yd / dd;
  let rr = 0;
  for (let i = 0; i < frame.length; i++) {
    const r = frame[i] - first[i] - alpha * (last[i] - first[i]);
    rr += r * r;
  }
  return { alpha, error: Math.sqrt(rr / dd) };
}

// A grey wash: the ends differ in mean luminance (one light, one dark), and
// a frame strictly between them is a cross-fade of the two (an opacity fade
// of one over the other, from 20% to 80% of the way) with a luminance spread
// under WASH_RATIO of the range the two ends cover together (the darkest of
// their 1st percentiles to the lightest of their 99th). A fade averages the
// two frames, so its middle frames pull in to grey; a slide or a wipe shows
// parts of both ends and keeps the whole range.
// `stats` is luma.frameStats() output. Returns the finding or null.
export function judgeWash(stats, what) {
  if (stats.length < 3) return null;
  const a = stats[0], z = stats[stats.length - 1];
  if (Math.abs(a.mean - z.mean) < WASH_GAP) return null;
  const range = Math.max(a.hi, z.hi) - Math.min(a.lo, z.lo);
  const floor = range * WASH_RATIO;
  let worst = -1;
  for (let i = 1; i < stats.length - 1; i++) {
    const f = stats[i];
    if (f.spread >= floor) continue;
    if (a.pixels && z.pixels && f.pixels) {
      const fit = crossFade(a.pixels, z.pixels, f.pixels);
      if (fit.error > WASH_FIT || fit.alpha < 0.2 || fit.alpha > 0.8) continue;
    }
    if (worst < 0 || f.spread < stats[worst].spread) worst = i;
  }
  if (worst < 0) return null;
  return {
    kind: 'grey wash',
    text: `grey wash: ${what}, frame ${worst + 1} of ${stats.length} is a fade of the first and the last frame with a luminance spread of ${stats[worst].spread}, under ${Math.round(WASH_RATIO * 100)}% of the ${range} that the two cover`,
  };
}

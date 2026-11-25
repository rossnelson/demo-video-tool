// Judges card transitions: does the card's exit move anything, is the move
// big enough to read, and does a frame in the middle wash out to grey.
// The theme preview samples a card (sampleCard, in the page) and judges it
// here; the review of a built video uses judgeWash on its frames.

export const FPS = 12;            // frames per second for the strips and checks
export const MIN_MOVE = 60;       // px: an exit that moves less does not read
export const MIN_EXIT = 0.3;      // s: an exit shorter than this does not read
export const WASH_RATIO = 0.5;    // a middle frame's spread under this share of the ends'
export const WASH_GAP = 64;       // ...when the ends differ this much in mean luminance (0-255)
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
    let most = 0, clipped = false, firstChange = -1, lastChange = -1;
    for (let f = 1; f < samples.length; f++) {
      const now = samples[f][i], prev = samples[f - 1][i];
      if (!now || now.label !== el.label) continue;
      most = Math.max(most, move(el, now));
      if (now.clip !== el.clip) clipped = true;
      if (move(prev, now) > STILL || now.clip !== prev.clip) {
        if (firstChange < 0) firstChange = f;
        lastChange = f;
      }
    }
    return { el, most, clipped, firstChange, lastChange };
  });
}

// The exit's findings. `exit` and `hold` are sampleCard() results frame by
// frame; motion that an element already has while the card holds (a bob, a
// drift) is not exit. A clip change is a wipe, which hides the element, so
// it counts as a full move. Returns { findings: [...], most, seconds, element }.
export function judgeExit(exit, hold = [], fps = FPS) {
  const jitter = new Map(motion(hold).map((m) => [m.el.label, m]));
  const moves = motion(exit)
    .filter((m) => m.el.opacity > 0.05 && m.el.w * m.el.h > 0)
    .map((m) => {
      const still = jitter.get(m.el.label);
      const base = still ? still.most : 0;
      const clipped = m.clipped && !(still?.clipped);
      const most = clipped ? Math.max(MIN_MOVE, m.most - base) : m.most - base;
      return { ...m, most: Math.max(0, most), clipped };
    })
    .filter((m) => m.clipped || m.most > STILL);
  if (!moves.length) {
    return { findings: [{ kind: 'no exit', text: 'no exit: nothing on the card moves when it leaves, only the whole card fades' }], most: 0, seconds: 0 };
  }
  const top = moves.reduce((a, b) => (b.most > a.most ? b : a));
  const seconds = Math.max(...moves.map((m) => (m.lastChange - m.firstChange + 1) / fps));
  const findings = [];
  if (top.most < MIN_MOVE) {
    findings.push({ kind: 'exit too small', text: `exit too small: the largest movement is ${Math.round(top.most)} px (${name(top.el.label)}), under ${MIN_MOVE} px` });
  }
  if (seconds < MIN_EXIT) {
    findings.push({ kind: 'exit too small', text: `exit too small: the exit lasts ${seconds.toFixed(2)} s, under ${MIN_EXIT} s` });
  }
  return { findings, most: top.most, seconds, element: name(top.el.label) };
}

// A grey wash: a frame strictly between the first and the last has a
// luminance spread under half of the smaller of the ends' spreads, and the
// ends differ in mean luminance (one light, one dark), as when a light layer
// fades with opacity over a dark page. `stats` is luma.frameStats() output.
// Returns the finding or null.
export function judgeWash(stats, what) {
  if (stats.length < 3) return null;
  const a = stats[0], z = stats[stats.length - 1];
  if (Math.abs(a.mean - z.mean) < WASH_GAP) return null;
  const floor = Math.min(a.spread, z.spread) * WASH_RATIO;
  let worst = -1;
  for (let i = 1; i < stats.length - 1; i++) {
    if (stats[i].spread < floor && (worst < 0 || stats[i].spread < stats[worst].spread)) worst = i;
  }
  if (worst < 0) return null;
  return {
    kind: 'grey wash',
    text: `grey wash: ${what}, frame ${worst + 1} of ${stats.length} has a luminance spread of ${stats[worst].spread.toFixed(0)}, under half of the ends (${a.spread.toFixed(0)} and ${z.spread.toFixed(0)})`,
  };
}

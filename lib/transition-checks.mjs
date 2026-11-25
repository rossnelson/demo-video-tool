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
const AXES = [(e) => e.x + e.w / 2, (e) => e.y + e.h / 2, (e) => e.w, (e) => e.h];

// What an element does while the card holds: the range of its centre, its
// size and its opacity, and the clips it shows. An idle bob or drift stays
// inside that range, so it is not exit. The range is widened by half its own
// size on each side, because the sampled hold may not catch a slow bob at
// both of its ends.
function rest(frames) {
  const ranges = AXES.map((get) => {
    const v = frames.map(get);
    const lo = Math.min(...v), hi = Math.max(...v), tol = STILL + (hi - lo) / 2;
    return [lo - tol, hi + tol, lo - STILL, hi + STILL];
  });
  const op = frames.map((e) => e.opacity);
  const lo = Math.min(...op), hi = Math.max(...op), tol = 0.02 + (hi - lo) / 2;
  return { ranges, opacity: [lo - tol, hi + tol], clips: new Set(frames.map((e) => e.clip)) };
}
// How far an element is outside its rest, in px: outside the widened range,
// or, with `strict`, outside the range it really covered in the hold.
const outside = (r, e, strict = false) => Math.max(0, ...AXES.map((get, k) => {
  const v = get(e), [lo, hi, rlo, rhi] = r.ranges[k];
  return strict ? Math.max(rlo - v, v - rhi) : Math.max(lo - v, v - hi);
}));

// The motion of each element over the exit. Its rest in the hold (or, with
// no hold sample, the exit's first frame) decides whether it leaves: an
// idle bob stays inside. When it leaves, its move and its length are
// measured as they are, not from the edge of the rest: the move is the
// largest distance from where it was when the exit began, and the change
// starts at the frame from which its distance from there only grows on the
// way out of the rest, and ends at its last frame of change.
function motion(exit, hold) {
  const first = exit[0] ?? [];
  return first.map((el, i) => {
    const at = (f) => (f[i] && f[i].label === el.label ? f[i] : null);
    const held = hold.map(at).filter(Boolean);
    const r = rest(held.length ? held : [el]);
    let most = 0, clipped = false, faded = -1, firstChange = -1, lastChange = -1, left = -1;
    const dist = exit.map((f) => (at(f) ? move(el, at(f)) : 0));
    for (let f = 1; f < exit.length; f++) {
      const now = at(exit[f]), prev = at(exit[f - 1]);
      if (!now || !prev) continue;
      const out = outside(r, now) > STILL;
      const clipOut = !r.clips.has(now.clip);
      const fadeOut = !el.top && (now.opacity < r.opacity[0] || now.opacity > r.opacity[1]);
      if (out) most = Math.max(most, dist[f]);
      if (clipOut) clipped = true;
      if (fadeOut && faded < 0) faded = f;   // the frame its own fade leaves its rest
      const changed = move(prev, now) > STILL || now.clip !== prev.clip
        || (!el.top && Math.abs(now.opacity - prev.opacity) > 0.02);
      if ((out || clipOut || fadeOut) && changed) {
        if (left < 0) left = f;
        lastChange = f;
      }
    }
    if (left > 0) {
      firstChange = left;
      // Back to the first frame of the move that took it out: frame f
      // counts when the element moved between f - 1 and f. Only while the
      // element is already outside the range it covered in the hold, so an
      // idle bob before the exit does not count as exit.
      const leaving = (f) => at(exit[f]) && outside(r, at(exit[f]), true) > 0;
      while (firstChange > 1 && leaving(firstChange - 1) && dist[firstChange - 2] < dist[firstChange - 1] - STILL / 2) firstChange--;
    }
    // Seen: visible with a size in some frame (an exit may bring in a
    // sweep that starts hidden).
    const seen = exit.some((f) => at(f) && at(f).opacity > 0.05 && at(f).w * at(f).h > 0);
    return { el, most, clipped, faded, firstChange, lastChange, seen };
  });
}

// `faded` is the frame at which the element's own opacity left its rest, or
// -1: a stepped exit has parts that do so at different frames.

// The exit's findings. `exit` and `hold` are sampleCard() results frame by
// frame; motion that an element already has while the card holds (a bob, a
// drift) is not exit. A clip change is a wipe, which hides the element, so
// it counts as a full move. Parts that fade out one after another (a stepped
// exit) are an exit too, with no movement to judge; parts that all fade at
// the same moment are the whole card fading, which is no exit. The exit is
// too short when every part's own change lasts under MIN_EXIT.
// Returns { findings: [...], most, seconds, element }.
export function judgeExit(exit, hold = [], fps = FPS) {
  const changes = motion(exit, hold)
    .filter((m) => m.seen && m.firstChange > 0)
    .map((m) => ({ ...m, most: m.clipped ? Math.max(MIN_MOVE, m.most) : m.most }));
  const moves = changes.filter((m) => m.clipped || m.most > STILL);
  const fades = changes.filter((m) => m.faded > 0 && !moves.includes(m));
  const staggered = new Set(fades.map((m) => m.faded)).size > 1;
  if (!moves.length && !staggered) {
    return { findings: [{ kind: 'no exit', text: 'no exit: nothing on the card moves when it leaves, only the whole card fades' }], most: 0, seconds: 0 };
  }
  const parts = [...moves, ...(staggered ? fades : [])];
  const seconds = Math.max(...parts.map((m) => (m.lastChange - m.firstChange + 1) / fps));
  const findings = [];
  const top = moves.length ? moves.reduce((x, y) => (y.most > x.most ? y : x)) : null;
  if (top && top.most < MIN_MOVE) {
    findings.push({ kind: 'exit too small', text: `exit too small: the largest movement is ${Math.round(top.most)} px (${name(top.el.label)}), under ${MIN_MOVE} px` });
  }
  if (seconds < MIN_EXIT) {
    findings.push({ kind: 'exit too small', text: `exit too small: the longest part of the exit lasts ${seconds.toFixed(2)} s, under ${MIN_EXIT} s` });
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

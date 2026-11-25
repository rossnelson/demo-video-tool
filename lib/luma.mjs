// Luminance of frames, and frame strips, with ffmpeg. The theme preview and
// the review of a built video both use it, so both judge the same pixels the
// same way.
//   frameStats(input)        -> [{ mean, lo, hi, spread, pixels }] per frame, 0 to 255
//   strip(input, n, file)    -> one PNG with the n frames side by side
// `input` is ffmpeg input arguments plus filters that pick the frames:
//   { args: ['-i', 'dir/%03d.png'] }
//   { args: ['-ss', '12.5', '-t', '1.2', '-i', 'video.mp4'], filters: ['fps=12'] }
import { spawnSync } from 'node:child_process';

const W = 384, H = 216;          // small frames, but big enough to keep a title's strokes

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', ...args], { maxBuffer: 1 << 28 });
  if (r.error) throw new Error(`ffmpeg: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`ffmpeg: ${String(r.stderr).trim().split('\n').pop()}`);
  return r.stdout;
}

// The mean of each frame's luminance, its 1st and 99th percentiles (lo, hi),
// and the spread between them. Percentiles, not the darkest and the lightest
// pixel, so a few stray pixels do not count. `pixels` is the small grey frame.
export function frameStats({ args, filters = [] }) {
  const raw = ffmpeg([...args, '-vf', [...filters, `scale=${W}:${H}`, 'format=gray'].join(','), '-f', 'rawvideo', '-']);
  const size = W * H, stats = [];
  for (let off = 0; off + size <= raw.length; off += size) {
    const counts = new Array(256).fill(0);
    let sum = 0;
    for (let i = off; i < off + size; i++) { counts[raw[i]]++; sum += raw[i]; }
    const at = (share) => {
      let seen = 0;
      for (let v = 0; v < 256; v++) { seen += counts[v]; if (seen >= share * size) return v; }
      return 255;
    };
    const lo = at(0.01), hi = at(0.99);
    stats.push({ mean: sum / size, lo, hi, spread: hi - lo, pixels: raw.subarray(off, off + size) });
  }
  return stats;
}

// The frames side by side in one PNG, 320 px wide each.
export function strip({ args, filters = [] }, n, file) {
  ffmpeg([...args, '-vf', [...filters, 'scale=320:-2', `tile=${Math.max(1, n)}x1:padding=4:color=0x222222`].join(','), '-frames:v', '1', '-update', '1', '-y', file]);
  return file;
}

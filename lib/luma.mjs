// Luminance of frames, and frame strips, with ffmpeg. The theme preview and
// the review of a built video both use it, so both judge the same pixels the
// same way.
//   frameStats(input)        -> [{ mean, spread }] per frame, 0 to 255
//   strip(input, n, file)    -> one PNG with the n frames side by side
// `input` is ffmpeg input arguments plus filters that pick the frames:
//   { args: ['-i', 'dir/%03d.png'] }
//   { args: ['-ss', '12.5', '-t', '1.2', '-i', 'video.mp4'], filters: ['fps=12'] }
import { spawnSync } from 'node:child_process';

const W = 192, H = 108;          // small frames: the spread needs no detail

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', ...args], { maxBuffer: 1 << 28 });
  if (r.error) throw new Error(`ffmpeg: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`ffmpeg: ${String(r.stderr).trim().split('\n').pop()}`);
  return r.stdout;
}

// The mean and the standard deviation (the spread) of each frame's luminance.
// The standard deviation, not a percentile range: a light card with dark
// text is mostly one colour, and its 5th to 95th percentiles are equal.
export function frameStats({ args, filters = [] }) {
  const raw = ffmpeg([...args, '-vf', [...filters, `scale=${W}:${H}`, 'format=gray'].join(','), '-f', 'rawvideo', '-']);
  const size = W * H, stats = [];
  for (let off = 0; off + size <= raw.length; off += size) {
    let sum = 0, sq = 0;
    for (let i = off; i < off + size; i++) { sum += raw[i]; sq += raw[i] * raw[i]; }
    const mean = sum / size;
    stats.push({ mean, spread: Math.sqrt(Math.max(0, sq / size - mean * mean)) });
  }
  return stats;
}

// The frames side by side in one PNG, 320 px wide each.
export function strip({ args, filters = [] }, n, file) {
  ffmpeg([...args, '-vf', [...filters, 'scale=320:-2', `tile=${Math.max(1, n)}x1:padding=4:color=0x222222`].join(','), '-frames:v', '1', '-update', '1', '-y', file]);
  return file;
}

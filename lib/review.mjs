// Reviews a built video: a strip of frames at 12 fps for each card entry,
// each card exit and each card-to-card handover, a grey wash check on each,
// the scenes that started late and the pages shown less than 2 seconds.
//   node lib/review.mjs <project-dir>   -> build/review/*.png, build/review/report.md
// The video's time is the plan's time: the recorder films on the plan's clock.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { keepsCard, loadProject, shortPages } from './project.mjs';
import { frameStats, strip } from './luma.mjs';
import { FPS, judgeWash } from './transition-checks.mjs';

const arg = process.argv[2] ?? '.';
const project = await loadProject(arg);
const build = project.build;
const video = join(build, `${project.name}.mp4`);
const planFile = join(build, 'plan.json');
for (const f of [video, planFile]) {
  if (!existsSync(f)) {
    console.error(`review: no ${relative(process.cwd(), f) || f}; run bin/demo build ${arg} first`);
    process.exit(1);
  }
}
const plan = JSON.parse(readFileSync(planFile, 'utf8'));
const recordLog = join(build, 'record.log');
const log = existsSync(recordLog) ? readFileSync(recordLog, 'utf8') : '';
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf8' });
const length = Number(probe.stdout.trim()) || 0;

const out = join(build, 'review');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// The card windows, in video seconds. A kept card (an intro, an outro) hands
// over to the next card: one window over the change, and no entry for the
// next card. The opening card is at rest (open: 'card'), so it has no entry.
const beat = plan.beat;
const windows = [];
const scenes = project.scenes;
for (const [i, scene] of scenes.entries()) {
  const p = plan.segments[scene.name];
  if (!p || scene.card === false) continue;
  const afterKept = i > 0 && keepsCard(scenes, i - 1);
  const opening = i === 0 && project.open !== 'page';
  if (!afterKept && !opening) windows.push({ scene: scene.name, kind: 'entry', start: p.start, length: 2 * beat });
  if (keepsCard(scenes, i)) {
    windows.push({ scene: scene.name, kind: 'handover', start: p.end - 2 * beat, length: 4 * beat, next: scenes[i + 1].name });
  } else if (scene.kind !== 'end') {
    windows.push({ scene: scene.name, kind: 'exit', start: p.start + 2 * beat + p.holdMs / 1000, length: 2 * beat });
  }
}

const problems = [];
const strips = [];
const unread = [];
for (const w of windows) {
  const what = w.kind === 'handover' ? `handover from ${w.scene} to ${w.next}` : `${w.scene} card ${w.kind}`;
  if (w.start + w.length > length + 0.05) {
    unread.push(`${what} at ${w.start.toFixed(2)} s: past the end of the video (${length.toFixed(2)} s)`);
    continue;
  }
  const input = { args: ['-ss', w.start.toFixed(3), '-t', w.length.toFixed(3), '-i', video], filters: [`fps=${FPS}`] };
  const stats = frameStats(input);
  const file = `${w.scene}-${w.kind}.png`;
  strip(input, stats.length, join(out, file));
  strips.push({ file, text: `${what}, from ${w.start.toFixed(2)} s, ${stats.length} frames` });
  const wash = judgeWash(stats, what);
  if (wash) problems.push(`${wash.text} (${file})`);
}

const late = [...log.matchAll(/([\w.-]+) started ([\d.]+)s late/g)].map((m) => `${m[1]} started ${m[2]} s late`);
const short = shortPages(project, plan).map((s) => `${s.scene} shows its page for ${s.shown.toFixed(1)} s before the ${s.next} card`);
const list = (items, none) => (items.length ? items.map((x) => `- ${x}`).join('\n') : none);

const report = `# Review: ${project.name}

Video: ${video}, ${length.toFixed(2)} s.

## Problems

${list(problems, windows.length ? 'No grey wash.' : 'No card transition in this video.')}

## Late scenes

${list(late, existsSync(recordLog) ? 'None.' : 'No record.log, so no timing to read.')}

## Pages shown less than 2 seconds

${list(short, 'None.')}

## Strips

${list(strips.map((s) => `${s.file}: ${s.text}`), 'None.')}
${unread.length ? `\n## Not read\n\n${list(unread, '')}\n` : ''}`;
writeFileSync(join(out, 'report.md'), report);
console.log(report);
console.log(`${strips.length} strips and the report in ${out}`);

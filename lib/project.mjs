// Loads a project directory's project.mjs, fills in the defaults and resolves
// paths. Run directly, it prints the project as JSON (functions left out) for
// the Python scripts:  node lib/project.mjs <project-dir>
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const defaults = {
  name: 'demo',            // base name of the output files
  title: '',               // shown on the intro and outro cards and the splash
  subtitle: '',
  keys: [],                // key cap glyphs on the cards and the splash, e.g. ['⌘', 'K']
  theme: {
    bg: '#141414',         // the card's first bar, and the splash background
    accent: '#444ce7',     // the second bar
    deep: '#1d1b3a',       // the third bar, behind the text
    spark: '#1ff1a5',      // small decorations
    spark2: '#f25cb0',
    text: '#ffffff',
    muted: '#d8d6ff',      // subtitles
    step: '#b8f5dc',       // the step number
  },
  voice: {
    id: 'cBTYF7NiJbR8Bvmdeuse',
    model: 'eleven_multilingual_v2',
    format: 'mp3_44100_128',
    settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
  },
  music: {
    path: null,            // the track; $MUSIC overrides it
    leadIn: 1.5,           // seconds of the track to skip: the first downbeat after this is the video's first
    firstDownbeatAt: 0.3,  // where that downbeat lands in the video
    fadeBars: 2,           // the music fades over the last bars
  },
  mix: { voiceLufs: -16, musicLufs: -27 },
  timing: {
    cardBeats: 8,          // a scene's card: 2 beats in, 4 hold, 2 out, then narration
    holdBeats: 4,
    gap: 0.6,              // seconds after the narration before the next downbeat can cut
    introGap: 0.4,
    outroBars: 3,          // the music plays out this long over the outro card
  },
  video: { width: 1920, height: 1080, fps: 30, background: '#0b0b14', quality: 92 },
  browser: {
    viewport: { width: 1440, height: 810 },
    deviceScaleFactor: 4 / 3,
    colorScheme: 'light',
    permissions: [],
    profile: '.profile',   // persistent Chrome profile, relative to the project; null for a fresh context
    headless: false,
  },
  splash: { width: 1600, height: 900, scale: 2, chips: [], file: null },
  scenes: [],
};

function merge(base, over) {
  if (!over) return structuredClone(base);
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(over)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] && !Array.isArray(out[k])
      ? merge(out[k], v)
      : v;
  }
  return out;
}

const expand = (p) => (p?.startsWith('~') ? join(homedir(), p.slice(1)) : p);

export async function loadProject(dir) {
  dir = resolve(dir);
  const file = join(dir, 'project.mjs');
  if (!existsSync(file)) throw new Error(`no project.mjs in ${dir}`);
  const raw = (await import(pathToFileURL(file).href)).default;
  const project = merge(defaults, raw);
  // Functions do not survive structuredClone; put the hooks and actions back.
  for (const hook of ['setup', 'teardown', 'clear']) if (raw[hook]) project[hook] = raw[hook];
  project.scenes = (raw.scenes ?? []).map((s) => {
    const titled = s.kind === 'intro' || s.kind === 'outro';
    return { kind: 'scene', step: '', title: titled ? project.title : '', subtitle: titled ? project.subtitle : '', ...s };
  });
  project.dir = dir;
  project.build = join(dir, 'build');
  const music = process.env.MUSIC ?? project.music.path;
  project.music.path = music ? (isAbsolute(expand(music)) ? expand(music) : resolve(dir, expand(music))) : null;
  if (project.browser.profile) {
    project.browser.profile = process.env.PROFILE_DIR ?? resolve(dir, expand(project.browser.profile));
  }
  if (project.splash.file) project.splash.file = resolve(dir, project.splash.file);

  const names = new Set();
  for (const s of project.scenes) {
    if (!s.name) throw new Error(`scene ${JSON.stringify(s)} has no name`);
    if (names.has(s.name)) throw new Error(`duplicate scene name ${s.name}`);
    names.add(s.name);
    if (typeof s.narration !== 'string') throw new Error(`scene ${s.name} has no narration`);
    if (!['intro', 'scene', 'outro'].includes(s.kind)) throw new Error(`scene ${s.name}: kind must be intro, scene or outro`);
  }
  return project;
}

export function toJSON(project) {
  return JSON.stringify(project, (k, v) => (typeof v === 'function' ? undefined : v), 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node lib/project.mjs <project-dir>');
    process.exit(2);
  }
  console.log(toJSON(await loadProject(dir)));
}

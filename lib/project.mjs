// Loads a project directory's project.mjs, fills in the defaults and resolves
// paths. Run directly, it prints the project as JSON (functions left out) for
// the Python scripts:  node lib/project.mjs <project-dir>
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const LIB = new URL('.', import.meta.url).pathname;
export const THEMES = join(LIB, 'themes');

export const defaults = {
  name: 'demo',            // base name of the output files
  title: '',               // shown on the intro and outro cards and the splash
  subtitle: '',
  url: '',                 // shown on the end card
  keys: [],                // key cap glyphs on the cards and the splash, e.g. ['⌘', 'K']
  // The look: a theme name from lib/themes, a path to a theme directory
  // ('./my-theme'), or { name, colors: {…}, fonts: {…}, pad, options: {…} } to override tokens
  // and the theme's own options (such as which wipe it uses, or its mode).
  theme: 'slant',
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
    outroBars: 3,          // the music plays out this long over the outro card (1 bar when an end card follows)
    endBars: 4,            // an end card holds at least this long
  },
  video: { width: 1920, height: 1080, fps: 30, background: null, quality: 92 },   // background: null takes the theme's pad colour
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

export function listThemes() {
  return readdirSync(THEMES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(THEMES, d.name, 'theme.mjs')))
    .map((d) => d.name)
    .sort();
}

// A theme directory: lib/themes/<name>, or a path relative to `from`.
export function themeDir(name, from = process.cwd()) {
  const dir = /[\/]/.test(name) || name.startsWith('.') ? resolve(from, name) : join(THEMES, name);
  if (!existsSync(join(dir, 'theme.mjs'))) {
    throw new Error(`no theme ${name}: ${dir}/theme.mjs is missing (themes: ${listThemes().join(', ')})`);
  }
  return dir;
}

// Loads a theme's tokens, with overrides from a project's theme setting.
export async function loadTheme(spec = 'slant', from = process.cwd()) {
  if (typeof spec === 'string') spec = { name: spec };
  const dir = themeDir(spec.name ?? 'slant', from);
  const base = (await import(pathToFileURL(join(dir, 'theme.mjs')).href)).default;
  let theme = merge({ colors: {}, fonts: {}, pad: '#000000', options: {}, modes: {}, description: '' }, base);
  const { name, ...overrides } = spec;
  for (const k of Object.keys(overrides)) {
    if (!['colors', 'fonts', 'pad', 'options'].includes(k)) throw new Error(`theme override ${k}: only colors, fonts, pad and options can be overridden`);
  }
  // A theme may offer modes (say, light and dark): `modes.<mode>` holds the
  // tokens that differ, applied when `options.mode` names it, before the
  // project's own overrides.
  const mode = overrides.options?.mode ?? theme.options.mode;
  if (mode !== undefined) {
    if (!theme.modes[mode]) throw new Error(`theme ${name ?? basename(dir)} has no mode ${mode} (modes: ${Object.keys(theme.modes).join(', ') || 'none'})`);
    theme = merge(theme, theme.modes[mode]);
  }
  theme = merge(theme, overrides);
  theme.name = base.name ?? basename(dir);
  theme.dir = dir;
  return theme;
}

export async function loadProject(dir) {
  dir = resolve(dir);
  const file = join(dir, 'project.mjs');
  if (!existsSync(file)) throw new Error(`no project.mjs in ${dir}`);
  const raw = (await import(pathToFileURL(file).href)).default;
  const project = merge({ ...defaults, theme: undefined }, { ...raw, theme: undefined });
  project.theme = await loadTheme(raw.theme ?? defaults.theme, dir);
  project.video.background ??= project.theme.pad;
  // Functions do not survive structuredClone; put the hooks and actions back.
  for (const hook of ['setup', 'teardown', 'clear']) if (raw[hook]) project[hook] = raw[hook];
  project.scenes = (raw.scenes ?? []).map((s) => {
    const titled = ['intro', 'outro', 'end'].includes(s.kind);
    return {
      kind: 'scene', step: '', narration: '', lines: [],
      title: titled ? project.title : '', subtitle: titled ? project.subtitle : '',
      url: s.kind === 'end' ? project.url : '',
      ...s,
    };
  });
  // A scene may take its own theme (a name, or { name, colors, options … }
  // like the project's); the intro, outro, end card and splash follow the
  // project's unless they name one too.
  for (const s of project.scenes) if (s.theme !== undefined) s.theme = await loadTheme(s.theme, dir);
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
    if (typeof s.narration !== 'string') throw new Error(`scene ${s.name}: narration must be a string`);
    if (!['intro', 'scene', 'outro', 'end'].includes(s.kind)) throw new Error(`scene ${s.name}: kind must be intro, scene, outro or end`);
    if (!s.narration && s.kind !== 'end') throw new Error(`scene ${s.name} has no narration (only an end card may be silent)`);
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

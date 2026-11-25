/**
 * What each project field means. The defaults come from lib/project.mjs at
 * build time; this file only explains them. A field with no entry here still
 * shows, with its default.
 */
export const fieldText: Record<string, string> = {
	name: 'The base name of the output files: build/<name>.mp4 and build/<name>-splash.png.',
	title: 'Shown on the intro, outro and end cards and on the splash.',
	subtitle: 'Shown under the title on the same cards.',
	url: 'Shown on the end card.',
	keys: "Key cap glyphs on the cards and the splash, such as ['⌘', 'K']. [] for none.",
	open: "The first frame. 'card': the first scene's card, already at rest. 'page': the page, with the first card wiping in on the first downbeat.",
	theme: "A built-in theme name, a path to a theme folder ('./my-theme'), or { name, colors, fonts, pad, options } to override its tokens and options.",
	voice: 'The ElevenLabs voice, model, output format and voice settings. $VOICE_ID overrides the voice.',
	music: 'The music bed and where its first downbeat falls.',
	mix: 'The loudness of each narration clip and of the music, in LUFS. The music ducks under the voice.',
	timing: 'How long cards hold and where a scene may end, in beats, bars and seconds.',
	video: 'The output frame size, frame rate, the colour behind frames that do not fill it, and the JPEG quality of the frames.',
	browser:
		"The recording browser. Also takes channel ('chrome' for a real Chrome), args and ignoreDefaultArgs. $PROFILE_DIR overrides the profile.",
	splash: 'The still image: its size, its scale, the chips under the title, and an optional page of your own (file).',
	scenes: 'The scenes, in order. Every project needs at least one. See Scenes below.'
};

export const subText: Record<string, string> = {
	'voice.id': 'the ElevenLabs voice id',
	'voice.model': 'the ElevenLabs model',
	'voice.format': 'the clip format',
	'voice.settings': 'stability, similarity, style and speaker boost',
	'music.path': 'the track, relative to the project or with ~; $MUSIC overrides it',
	'music.leadIn': 'seconds of the track to skip; the first downbeat after this starts the video',
	'music.firstDownbeatAt': 'where that downbeat lands in the video, in seconds',
	'music.fadeBars': 'the music fades out over the last bars',
	'mix.voiceLufs': 'the loudness of each narration clip',
	'mix.musicLufs': 'the loudness of the music',
	'timing.cardBeats': 'a scene card plays this long before its narration starts',
	'timing.holdBeats': 'how long the card holds still inside that',
	'timing.gap': 'seconds after the narration before the next downbeat can cut',
	'timing.introGap': 'the same, for the intro',
	'timing.outroBars': 'the music plays out this long over the outro card (1 bar when an end card follows)',
	'timing.endBars': 'an end card holds at least this long',
	'video.width': 'frame width in pixels',
	'video.height': 'frame height in pixels',
	'video.fps': 'frames per second',
	'video.background': "behind frames that do not fill 16:9; null takes the theme's pad",
	'video.quality': 'quality of the recorded frames',
	'browser.viewport': 'the page size, in CSS pixels',
	'browser.deviceScaleFactor': 'pixel density of the recording',
	'browser.colorScheme': "the page's prefers-color-scheme",
	'browser.permissions': 'permissions granted to the page',
	'browser.profile': 'a persistent Chrome profile, relative to the project, so sign-ins survive; null for a fresh context',
	'browser.headless': 'record without a window',
	'splash.width': 'image width',
	'splash.height': 'image height',
	'splash.scale': 'pixel density',
	'splash.chips': "key hints under the title, such as [{ key: '↵', label: 'run' }]",
	'splash.file': 'a splash page of your own, relative to the project'
};

export const sceneFields: [string, string][] = [
	['name', 'Required, and unique. Names the narration clip, such as 01-add.'],
	['kind', "'intro', 'scene' (the default), 'outro' or 'end'."],
	['step', "A small label on the card, such as '01'."],
	['title, subtitle', 'The card text. An intro, outro or end card takes the project’s unless it gives its own.'],
	['narration', 'The words to say. Only an end card, or a scene with minSeconds, may be silent.'],
	['lines', 'Extra lines on the end card.'],
	['card', 'false skips the card, and the narration starts with the scene. An object passes options to the theme, such as { wipe: \'rail\' }.'],
	['theme', 'A theme for this scene only, as a name or an object like the project’s.'],
	['minSeconds', 'Keeps the scene up at least this long, still ending on a downbeat: for a page that loads slowly or an answer that streams in.'],
	['before(api)', 'Runs off camera before the scene.'],
	['run(api)', 'Runs on camera while the narration plays.'],
	['after(api)', 'Runs off camera after the scene.']
];

export const sceneKinds: [string, string][] = [
	['intro', 'A title card that holds through its narration. Takes the project’s title and subtitle.'],
	['scene', 'A card for cardBeats, then the narration over the page, then a cut on the first downbeat after the narration plus gap.'],
	['outro', 'Like intro, at the end. The music plays out under it.'],
	['end', 'Comes last. Shows the title, the url and any lines, holds at least endBars and stays while the music fades. May be silent.']
];

export const hooks: [string, string][] = [
	['setup(api)', 'Before recording: sign in, seed data, open the first page.'],
	['teardown(api)', 'After recording.'],
	['clear(api)', 'Before each scene, before a cut, and 0.7 s before a scene ends.']
];

export const api: [string, string][] = [
	['page, ctx, cdp', 'The Playwright page and context, and a CDP session.'],
	['wait(ms)', 'Pause.'],
	['keys(label)', 'Show a key hint at the bottom of the page.'],
	['press(key, label, pauseMs)', 'Show the hint, press the key, pause.'],
	['type(text, pauseMs)', 'Type with a human delay.'],
	['settle(url)', 'Open a page and wait for it to go quiet.'],
	['cut(url)', 'Navigate off camera.'],
	['offCamera(fn)', 'Run fn with the recording paused.'],
	['emulate({ width, height }), emulate(null)', 'Phone metrics and touch, off camera; null puts them back.'],
	['pause(), resume(), vnow()', 'Pause and resume the recording; the video time.'],
	['project, plan, beat, bar, env, log', 'The project, the plan, a beat and a bar in ms, process.env, a logger.']
];

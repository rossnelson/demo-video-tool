export type Command = { name: string; usage: string; text: string; writes?: string };

export type CommandGroup = { title: string; intro?: string; commands: Command[] };

export const commandGroups: CommandGroup[] = [
	{
		title: 'Install and check',
		commands: [
			{
				name: 'setup',
				usage: 'demo-video setup',
				text: 'Installs what Homebrew cannot: a Python environment with the beat tracker’s packages, and Playwright with Chromium. They go in ~/.local/share/demo-video, or $DEMO_VIDEO_HOME. Run it again after an upgrade; it changes nothing that is already there.'
			},
			{
				name: 'doctor',
				usage: 'demo-video doctor [project]',
				text: 'Lists ffmpeg, ffprobe, Node, Python, the beat tracker, Playwright and the ElevenLabs key as found or missing (with a project, its .el-key counts too), with the command or file that fixes each missing one. Exits non-zero when something is missing.'
			},
			{ name: '--version', usage: 'demo-video --version', text: 'Prints demo-video and its version.' },
			{ name: 'help', usage: 'demo-video --help', text: 'Lists every command.' }
		]
	},
	{
		title: 'Start a project',
		commands: [
			{
				name: 'new',
				usage: 'demo-video new <dir>',
				text: 'Copies the example project into a new folder. Stops if the folder exists.'
			},
			{
				name: 'show',
				usage: 'demo-video show <project>',
				text: 'Prints the project as JSON with every default filled in and every path resolved.'
			}
		]
	},
	{
		title: 'Make a video, one stage at a time',
		intro: 'Each stage reads what the stages before it wrote, so you can run one again on its own.',
		commands: [
			{
				name: 'narrate',
				usage: 'demo-video narrate <project> [scene …] [--dry]',
				text: 'Makes the narration of each scene with ElevenLabs. Name scenes to make only those clips again. --dry makes silent clips of an estimated length and needs no key.',
				writes: 'build/audio/, build/durations.json'
			},
			{
				name: 'beats',
				usage: 'demo-video beats <project>',
				text: 'Finds the beats and downbeats of the music track (music.path, or $MUSIC).',
				writes: 'build/beats.json'
			},
			{
				name: 'plan',
				usage: 'demo-video plan <project>',
				text: 'Places each scene on the downbeats: its card, its narration, and its end on the first downbeat after the narration plus the gap.',
				writes: 'build/plan.json'
			},
			{
				name: 'record',
				usage: 'demo-video record <project>',
				text: 'Opens the browser, runs each scene’s actions and records the frames. On a machine with no display it uses xvfb.',
				writes: 'build/frames/, build/record.log'
			},
			{
				name: 'assemble',
				usage: 'demo-video assemble <project>',
				text: 'Mixes the narration over the music, ducks the music under the voice, and encodes the video.',
				writes: 'build/<name>.mp4'
			},
			{
				name: 'check',
				usage: 'demo-video check <project>',
				text: 'Measures the loudness of each narration window in the mix.'
			},
			{
				name: 'splash',
				usage: 'demo-video splash <project>',
				text: 'Renders the theme’s splash image with the project’s title, keys and chips.',
				writes: 'build/<name>-splash.png'
			}
		]
	},
	{
		title: 'Run the stages together',
		commands: [
			{ name: 'build', usage: 'demo-video build <project>', text: 'Runs plan, record, assemble and check. Use it after you change the scenes but not the narration.' },
			{
				name: 'all',
				usage: 'demo-video all <project> [--dry]',
				text: 'Runs narrate, beats, build and splash: everything, from text to video. Arguments go to narrate, so --dry makes a silent video.'
			}
		]
	},
	{
		title: 'Themes',
		commands: [
			{ name: 'themes', usage: 'demo-video themes', text: 'Lists the built-in themes with their descriptions.' },
			{
				name: 'theme',
				usage: 'demo-video theme <name> [project]',
				text: 'Renders a theme’s cards, end card, key hint and splash with a contact sheet, in a few seconds and with no recording. With a project, it uses that project’s words and keys.',
				writes: './build/themes/<name>/, or <project>/build/themes/<name>-<project name>/'
			}
		]
	}
];

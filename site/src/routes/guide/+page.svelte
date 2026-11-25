<script lang="ts">
	import CodeBlock from '#lib/CodeBlock.svelte';
	import { install } from '#lib/install.ts';
	import { link } from '#lib/links.ts';

	const music = `export default {
  name: 'my-video',                    // build/my-video.mp4
  title: 'Notes',
  subtitle: 'A tiny to-do list',
  music: { path: '~/Music/bed.mp3' },  // or set $MUSIC
  scenes: [ /* … */ ],
};`;

	const key = `export ELEVENLABS_API_KEY=sk_…                # this shell only
echo 'sk_…' > my-video/.el-key                  # this project only
mkdir -p ~/.config/demo-video
echo 'sk_…' > ~/.config/demo-video/el-key       # every project`;

	const outputs: [string, string, string][] = [
		['narrate', 'build/audio/, build/durations.json', 'one clip per scene, and how long each one is'],
		['beats', 'build/beats.json', 'the beats and downbeats of the music'],
		['plan', 'build/plan.json', 'each scene placed on the downbeats'],
		['record', 'build/frames/, build/record.log', 'the screen recording, and when each scene ended'],
		['assemble', 'build/<name>.mp4', 'the finished video'],
		['splash', 'build/<name>-splash.png', 'a still image for a page or a post'],
		['theme', 'build/themes/<theme>-<name>/', 'a preview of a theme’s cards, with a contact sheet']
	];
</script>

<svelte:head>
	<title>Your first video · demo-video</title>
	<meta name="description" content="Install demo-video, make a project, do a silent dry run, then make the narrated video." />
</svelte:head>

<article class="guide">
	<header class="head">
		<h1>Your first video</h1>
		<p class="lead">
			From install to a narrated video in eight steps. The first video is silent, so you can see the cuts and
			the cards before you spend ElevenLabs credits.
		</p>
	</header>

	<ol class="steps">
		<li>
			<h2>Install</h2>
			<p>The formula brings ffmpeg, Node and Python with it.</p>
			<CodeBlock code={install} copy prompt />
		</li>

		<li>
			<h2>Set up the browser and the beat tracker</h2>
			<p>
				Homebrew cannot install these two, so <code>setup</code> does it once: a Python environment for the beat
				tracker, and Playwright with Chromium. They go in <code>~/.local/share/demo-video</code>, or in
				<code>$DEMO_VIDEO_HOME</code> when you set it. It is safe to run again.
			</p>
			<CodeBlock code="demo-video setup" copy prompt />
		</li>

		<li>
			<h2>Check what is missing</h2>
			<p>
				<code>doctor</code> lists each dependency as found or missing, with the command or file that fixes a missing
				one. Before step 7 it reports the ElevenLabs key as missing; that is expected.
			</p>
			<CodeBlock code="demo-video doctor" copy prompt />
		</li>

		<li>
			<h2>Start a project</h2>
			<p>
				A project is a folder with a <code>project.mjs</code>. <code>new</code> copies the example project: a small
				to-do page and the scenes that record it.
			</p>
			<CodeBlock code="demo-video new my-video" copy prompt />
		</li>

		<li>
			<h2>Write the video</h2>
			<p>
				Open <code>my-video/project.mjs</code>. Change the title, the narration and the actions of each scene. Give
				it a music track too: the beat tracker needs one, even for a dry run.
			</p>
			<CodeBlock code={music} lang="js" title="my-video/project.mjs" />
			<p>
				<code>demo-video show my-video</code> prints the project with every default filled in. The
				<a href={link('/reference/project')}>project file reference</a> explains each field.
			</p>
		</li>

		<li>
			<h2>Make a silent dry run</h2>
			<p>
				<code>--dry</code> makes silent clips of an estimated length in place of the narration, so you need no key.
				Then it finds the beats, plans the scenes, records, assembles and renders the splash.
			</p>
			<CodeBlock code="demo-video all my-video --dry" copy prompt />
			<p>
				Open <code>my-video/build/my-video.mp4</code>. In <code>build/record.log</code>,
				<code>late: none</code> means every cut landed on its downbeat.
			</p>
		</li>

		<li>
			<h2>Add your ElevenLabs key</h2>
			<p>The narration reads the key from the first of these that is set:</p>
			<CodeBlock code={key} />
		</li>

		<li>
			<h2>Make the narrated video</h2>
			<p>The same command without <code>--dry</code> makes the voice, then plans and records the video again around it.</p>
			<CodeBlock code="demo-video all my-video" copy prompt />
			<p>
				To change one line of narration, make only that clip again, then build:
				<code>demo-video narrate my-video 01-add</code> and <code>demo-video build my-video</code>.
			</p>
		</li>
	</ol>

	<section class="after">
		<h2>Where the files go</h2>
		<p>Every command writes to the project’s <code>build/</code> folder.</p>
		<div class="table">
			<table>
				<thead>
					<tr><th>Command</th><th>Writes</th><th>What it is</th></tr>
				</thead>
				<tbody>
					{#each outputs as [cmd, path, what] (cmd)}
						<tr><td><code>{cmd}</code></td><td><code>{path}</code></td><td>{what}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>

		<h2>Logs</h2>
		<p>
			Each command also writes its output to <code>build/&lt;command&gt;.log</code>, and keeps the run before it in
			<code>build/&lt;command&gt;.prev.log</code>. When a cut is late, <code>build/record.log</code> names the scene
			and by how much.
		</p>

		<h2>Next</h2>
		<p>
			Try another look with <code>demo-video theme paper my-video</code>, which renders that theme’s cards with your
			project’s words in a few seconds. See <a href={link('/reference/themes')}>the themes</a> and
			<a href={link('/reference/commands')}>every command</a>.
		</p>
	</section>
</article>

<style>
	.guide {
		max-width: 48rem;
	}

	.head {
		padding: clamp(2.5rem, 6vw, 4.5rem) 0 1rem;
	}

	h1 {
		margin-bottom: 1rem;
	}

	.steps {
		list-style: none;
		counter-reset: step;
		margin: 2rem 0 0;
		padding: 0;
	}

	.steps > li {
		counter-increment: step;
		position: relative;
		padding: 0 0 2.25rem 3.25rem;
		min-width: 0;
	}

	/* The rail between the steps. */
	.steps > li::after {
		content: '';
		position: absolute;
		left: 0.95rem;
		top: 2.3rem;
		bottom: 0.4rem;
		width: 1px;
		background: var(--rule);
	}

	.steps > li:last-child::after {
		display: none;
	}

	.steps > li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: 0;
		width: 1.95rem;
		height: 1.95rem;
		display: grid;
		place-items: center;
		font: 600 0.85rem/1 var(--mono);
		color: var(--ink);
		border: 1.5px solid var(--rule-strong);
		border-radius: 50%;
		background: var(--bg);
	}

	.steps h2 {
		margin: 0.1rem 0 0.6rem;
		font-size: 1.3rem;
	}

	.steps p {
		color: var(--ink-2);
	}

	.after {
		border-top: 1px solid var(--rule);
		margin-top: 1rem;
	}

	.after h2 {
		font-size: 1.35rem;
		margin-top: 2.5rem;
	}

	.table {
		overflow-x: auto;
		border: 1px solid var(--rule);
		border-radius: 10px;
	}

	th,
	td {
		text-align: left;
		padding: 0.6rem 0.9rem;
		border-bottom: 1px solid var(--rule);
		vertical-align: top;
		font-size: 0.93rem;
	}

	th {
		font-weight: 600;
		font-size: 0.82rem;
		color: var(--ink-3);
		background: var(--raised);
	}

	tr:last-child td {
		border-bottom: 0;
	}

	td:first-child,
	td:nth-child(2) {
		white-space: nowrap;
	}

	@media (max-width: 600px) {
		thead {
			display: none;
		}

		table,
		tbody,
		tr,
		td {
			display: block;
		}

		tr {
			padding: 0.6rem 0;
			border-bottom: 1px solid var(--rule);
		}

		tr:last-child {
			border-bottom: 0;
		}

		td {
			border: 0;
			padding: 0.1rem 0.9rem;
		}

		td:nth-child(2) {
			white-space: normal;
			overflow-wrap: anywhere;
		}

		td:last-child {
			color: var(--ink-2);
		}
	}

	@media (max-width: 520px) {
		.steps > li {
			padding-left: 2.6rem;
		}

		.steps > li::before {
			width: 1.75rem;
			height: 1.75rem;
		}

		.steps > li::after {
			left: 0.85rem;
		}
	}
</style>

<script lang="ts">
	import Meta from '#lib/Meta.svelte';
	import BeatRuler from '#lib/BeatRuler.svelte';
	import CodeBlock from '#lib/CodeBlock.svelte';
	import { install, repo } from '#lib/install.ts';
	import { link } from '#lib/links.ts';

	const scene = `{
  name: '01-add', step: '01',
  title: 'Add a note', subtitle: 'Type it and press Enter',
  narration: 'Type what needs doing and press Enter.',
  before: ({ cut }) => cut('http://localhost:3000/notes'),   // off camera
  async run({ page, type, press }) {                          // while the narration plays
    await page.locator('#text').click();
    await type('Record the demo');
    await press('Enter', '↵');
  },
},`;

	const points = [
		{
			term: 'Cut on the beat',
			text: 'A beat tracker finds the downbeats of your music track. Each scene ends on the first downbeat after its narration, so the cuts land with the music.'
		},
		{
			term: 'Narrated by ElevenLabs',
			text: 'Write the narration as text in each scene. The tool makes the voice, measures each clip and plans the video around it. A dry run makes silent clips with no key.'
		},
		{
			term: 'Cards from a theme',
			text: 'Six built-in themes draw the title cards, the end card, the key hints and the splash image. Override a colour, or point at a theme folder of your own.'
		},
		{
			term: 'A project is code',
			text: 'One project.mjs holds the narration, the cards and the Playwright actions for each scene. Change a line, run the build again, get the same video with the fix.'
		}
	];
</script>

<Meta
	title="demo-video: narrated product videos, cut on the beat"
	description="demo-video makes a narrated product video from a browser: a screen recording, ElevenLabs narration, title cards and a music bed, with every cut on a downbeat."
	route="/"
/>

<section class="hero">
	<div class="copy">
		<h1>Product videos that cut on the beat.</h1>
		<p class="lead" data-testid="what">
			demo-video makes a narrated product video from a browser: a screen recording, ElevenLabs narration,
			title cards and a music bed, with every cut on a downbeat.
		</p>
		<CodeBlock code={install} copy prompt testid="install" />
		<p class="next">
			<a class="primary" href={link('/guide')}>Make your first video</a>
			<a href={link('/reference/commands')}>Reference</a>
			<a href={repo}>GitHub</a>
		</p>
	</div>
	<div class="figure">
		<BeatRuler />
	</div>
</section>

<section class="points" aria-labelledby="how">
	<h2 id="how">What it does</h2>
	<dl>
		{#each points as p (p.term)}
			<div>
				<dt>{p.term}</dt>
				<dd>{p.text}</dd>
			</div>
		{/each}
	</dl>
</section>

<section class="excerpt" aria-labelledby="scene">
	<div class="note">
		<h2 id="scene">A scene, in full</h2>
		<p>
			A scene has a card, a line of narration and what to do on screen while it plays. <code>before</code>
			runs off camera; <code>run</code> runs on camera, with the hints for each key drawn at the bottom of the
			page.
		</p>
		<p>
			Every field and its default is in the <a href={link('/reference/project')}>project file reference</a>.
		</p>
	</div>
	<CodeBlock code={scene} lang="js" title="my-video/project.mjs" />
</section>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		gap: 3rem 4rem;
		align-items: center;
		padding: clamp(3rem, 8vw, 6.5rem) 0 clamp(2.5rem, 6vw, 4.5rem);
		border-bottom: 1px solid var(--rule);
	}

	.copy {
		min-width: 0;
	}

	h1 {
		max-width: 14ch;
		margin-bottom: 1.25rem;
	}

	.lead {
		margin-bottom: 1.75rem;
	}

	.copy :global(.block) {
		max-width: 34rem;
		margin-bottom: 1.25rem;
	}

	.next {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1.4rem;
		margin: 0;
	}

	.primary {
		display: inline-block;
		padding: 0.6rem 1rem;
		background: var(--ink);
		color: var(--bg);
		text-decoration: none;
		border-radius: 8px;
		font-weight: 560;
		transition: background-color 160ms ease-out;
	}

	.primary:hover {
		background: var(--cut);
		color: var(--bg);
	}

	.figure {
		min-width: 0;
	}

	.points h2,
	.excerpt h2 {
		margin-top: 0;
	}

	.points {
		padding: 4rem 0;
		border-bottom: 1px solid var(--rule);
	}

	dl {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0 4rem;
		margin: 1.5rem 0 0;
	}

	dl > div {
		padding: 1.25rem 0 1.4rem;
		border-top: 1px solid var(--rule);
	}

	dt {
		font-weight: 620;
		font-size: 1.08rem;
		margin-bottom: 0.35rem;
	}

	dd {
		margin: 0;
		color: var(--ink-2);
		max-width: 46ch;
	}

	.excerpt {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
		gap: 1rem 4rem;
		align-items: start;
		padding: 4rem 0 0;
	}

	.excerpt :global(.block) {
		margin-top: 0;
	}

	.note p {
		color: var(--ink-2);
	}

	@media (max-width: 860px) {
		.hero,
		.excerpt {
			grid-template-columns: minmax(0, 1fr);
		}

		dl {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>

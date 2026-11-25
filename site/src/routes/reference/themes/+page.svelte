<script lang="ts">
	import CodeBlock from '#lib/CodeBlock.svelte';
	import RefHead from '#lib/reference/RefHead.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const pick = `theme: 'paper',                                          // a built-in theme
theme: { name: 'paper', colors: { accent: '#0a7' } },    // with a colour of your own
theme: { name: 'temporal', options: { mode: 'light' } }, // with an option
theme: './my-theme',                                     // a theme folder of your own`;
</script>

<svelte:head>
	<title>Themes · demo-video</title>
	<meta name="description" content="The built-in demo-video themes, with their colours." />
</svelte:head>

<RefHead title="Themes">
	A theme owns the look: the scene cards, the end card, the key hint and the splash. The engine owns the timing. Pick
	one for the project, or give a single scene its own.
</RefHead>

<CodeBlock code={pick} lang="js" title="project.mjs" />
<p class="tip">
	<code>demo-video theme &lt;name&gt; my-video</code> renders a theme’s cards with your project’s words in a few seconds.
</p>

<ul class="themes">
	{#each data.themes as t (t.dir)}
		<li class="theme" id={t.dir} data-theme={t.dir}>
			<div class="text">
				<h2>{t.dir}</h2>
				<p>{t.description}</p>
				{#if t.options.length}
					<p class="opts">Options: {#each t.options as o, i (o)}<code>{o}</code>{i < t.options.length - 1 ? ' ' : ''}{/each}</p>
				{/if}
			</div>
			<div class="palettes">
				<ul class="swatches" aria-label="{t.dir} colours">
					{#each t.swatches as s (s.name)}
						<li>
							<span class="chip" style="background: {s.value}"></span>
							<span class="label"><span>{s.name}</span><code>{s.value}</code></span>
						</li>
					{/each}
				</ul>
				{#each t.modes as m (m.mode)}
					<p class="mode">mode: '{m.mode}'</p>
					<ul class="swatches" aria-label="{t.dir} {m.mode} colours">
						{#each m.swatches as s (s.name)}
							<li>
								<span class="chip" style="background: {s.value}"></span>
								<span class="label"><span>{s.name}</span><code>{s.value}</code></span>
							</li>
						{/each}
					</ul>
				{/each}
			</div>
		</li>
	{/each}
</ul>

<style>
	.tip {
		color: var(--ink-2);
		margin-bottom: 2.5rem;
	}

	.themes {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.theme {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: 1.25rem 3rem;
		padding: 2rem 0;
		border-top: 1px solid var(--rule);
		scroll-margin-top: 1rem;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-family: var(--mono);
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.text p {
		color: var(--ink-2);
		max-width: 48ch;
	}

	.opts {
		font-size: 0.9rem;
		line-height: 1.9;
	}

	.palettes {
		min-width: 0;
	}

	.swatches {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
		gap: 0.9rem 0.75rem;
	}

	.swatches li {
		min-width: 0;
	}

	.chip {
		display: block;
		height: 2.6rem;
		border-radius: 7px;
		box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.28);
	}

	.label {
		display: flex;
		flex-direction: column;
		margin-top: 0.35rem;
		font-size: 0.8rem;
		line-height: 1.35;
	}

	.label span {
		color: var(--ink);
	}

	.label code {
		background: none;
		padding: 0;
		color: var(--ink-3);
		font-size: 0.75rem;
	}

	.mode {
		margin: 1.25rem 0 0.6rem;
		font: 0.8rem var(--mono);
		color: var(--ink-3);
	}

	@media (max-width: 760px) {
		.theme {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>

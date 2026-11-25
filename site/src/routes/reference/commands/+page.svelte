<script lang="ts">
	import RefHead from '#lib/reference/RefHead.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Commands · demo-video</title>
	<meta name="description" content="Every demo-video command and what it does." />
</svelte:head>

<RefHead title="Commands">
	Every command takes a project folder, relative to where you are, except <code>setup</code>, <code>doctor</code>,
	<code>themes</code> and <code>new</code>, which takes the folder to make. Each command also writes its output to
	<code>build/&lt;command&gt;.log</code>.
</RefHead>

{#each data.groups as group (group.title)}
	<section class="group">
		<h2>{group.title}</h2>
		{#if group.intro}<p class="intro">{group.intro}</p>{/if}
		<dl>
			{#each group.commands as c (c.name)}
				<div class="cmd" id={c.name.replace(/^-+/, '')}>
					<dt>
						<code class="name">{c.name}</code>
						<code class="usage">{c.usage}</code>
					</dt>
					<dd>
						{c.text}
						{#if c.writes}<span class="writes">Writes <code>{c.writes}</code></span>{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</section>
{/each}

<style>
	.group {
		max-width: 52rem;
	}

	h2 {
		font-size: 1.35rem;
	}

	.intro {
		color: var(--ink-2);
	}

	dl {
		margin: 0;
	}

	.cmd {
		display: grid;
		grid-template-columns: 9rem minmax(0, 1fr);
		gap: 0.3rem 1.5rem;
		padding: 1rem 0;
		border-top: 1px solid var(--rule);
		scroll-margin-top: 1rem;
	}

	dt {
		display: contents;
	}

	.name {
		background: none;
		padding: 0;
		font-weight: 650;
		font-size: 0.98rem;
		color: var(--ink);
		grid-row: span 2;
	}

	.usage {
		background: none;
		padding: 0;
		color: var(--cut);
		font-size: 0.86rem;
	}

	dd {
		margin: 0;
		color: var(--ink-2);
		grid-column: 2;
	}

	.writes {
		display: block;
		margin-top: 0.35rem;
		font-size: 0.9rem;
		color: var(--ink-3);
	}

	@media (max-width: 600px) {
		.cmd {
			grid-template-columns: minmax(0, 1fr);
		}

		.name {
			grid-row: auto;
		}

		dd {
			grid-column: 1;
		}
	}
</style>

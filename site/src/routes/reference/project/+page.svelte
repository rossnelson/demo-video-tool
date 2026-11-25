<script lang="ts">
	import CodeBlock from '#lib/CodeBlock.svelte';
	import RefHead from '#lib/reference/RefHead.svelte';
	import { api, hooks, sceneFields, sceneKinds } from '#lib/reference/project.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const skeleton = `export default {
  name: 'my-video',
  title: 'Notes',
  theme: 'paper',
  music: { path: '~/Music/bed.mp3' },
  async setup({ settle }) { await settle('http://localhost:3000'); },
  scenes: [
    { name: '00-intro', kind: 'intro', narration: 'Notes keeps today on one page.' },
    { name: '01-add', step: '01', title: 'Add a note', narration: '…', async run(api) { /* … */ } },
    { name: '02-end', kind: 'end', lines: ['Free for personal use'] },
  ],
};`;
</script>

<svelte:head>
	<title>Project file · demo-video</title>
	<meta name="description" content="Every field of a demo-video project.mjs, with its default, plus scenes, hooks and the api." />
</svelte:head>

<RefHead title="Project file">
	A project is a folder with a <code>project.mjs</code> that exports one object. Everything but <code>scenes</code> is
	optional; <code>demo-video show &lt;project&gt;</code> prints the project with every default filled in.
</RefHead>

<CodeBlock code={skeleton} lang="js" title="project.mjs" />

<section>
	<h2 id="fields">Fields</h2>
	<p class="note">An object field merges with its default, so you set only the keys you change.</p>
	<dl class="fields">
		{#each data.fields as f (f.key)}
			<div class="field" id={`field-${f.key}`}>
				<dt>
					<code class="key">{f.key}</code>
					{#if f.value}<code class="default">{f.value}</code>{/if}
				</dt>
				<dd>
					{#if f.text}<p>{f.text}</p>{/if}
					{#if f.sub.length}
						<div class="table">
							<table>
								<tbody>
									{#each f.sub as s (s.key)}
										<tr>
											<th scope="row"><code>{s.key}</code></th>
											<td class="val"><code>{s.value}</code></td>
											<td>{s.text}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</dd>
			</div>
		{/each}
	</dl>
</section>

<section>
	<h2 id="scenes">Scenes</h2>
	<p class="note">Scenes play in order. Each has a kind:</p>
	<div class="table">
		<table>
			<tbody>
				{#each sceneKinds as [k, t] (k)}
					<tr><th scope="row"><code>{k}</code></th><td>{t}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	<h3>Scene fields</h3>
	<div class="table">
		<table>
			<tbody>
				{#each sceneFields as [k, t] (k)}
					<tr><th scope="row"><code>{k}</code></th><td>{t}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section>
	<h2 id="hooks">Hooks</h2>
	<p class="note">Optional functions on the project. Each gets the api below.</p>
	<div class="table">
		<table>
			<tbody>
				{#each hooks as [k, t] (k)}
					<tr><th scope="row"><code>{k}</code></th><td>{t}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<section>
	<h2 id="api">The api</h2>
	<p class="note">Hooks and a scene's <code>before</code>, <code>run</code> and <code>after</code> get one object with these members.</p>
	<div class="table">
		<table>
			<tbody>
				{#each api as [k, t] (k)}
					<tr><th scope="row"><code>{k}</code></th><td>{t}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	section {
		max-width: 56rem;
	}

	h2 {
		font-size: 1.45rem;
		scroll-margin-top: 1rem;
	}

	.note {
		color: var(--ink-2);
	}

	.fields {
		margin: 0;
	}

	.field {
		display: grid;
		grid-template-columns: 10rem minmax(0, 1fr);
		gap: 0.4rem 1.5rem;
		padding: 1.1rem 0;
		border-top: 1px solid var(--rule);
		scroll-margin-top: 1rem;
	}

	dt {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.key {
		background: none;
		padding: 0;
		font-weight: 650;
		font-size: 0.98rem;
	}

	.default {
		color: var(--cut);
		font-size: 0.82rem;
	}

	dd {
		margin: 0;
		min-width: 0;
		color: var(--ink-2);
	}

	dd p {
		margin-bottom: 0.7rem;
	}

	dd p:last-child {
		margin-bottom: 0;
	}

	.table {
		overflow-x: auto;
		border: 1px solid var(--rule);
		border-radius: 10px;
		margin: 0.5rem 0 1rem;
	}

	th,
	td {
		text-align: left;
		vertical-align: top;
		padding: 0.55rem 0.85rem;
		border-bottom: 1px solid var(--rule);
		font-size: 0.92rem;
		color: var(--ink-2);
	}

	tr:last-child th,
	tr:last-child td {
		border-bottom: 0;
	}

	th {
		font-weight: 500;
		color: var(--ink);
		white-space: nowrap;
	}

	th code,
	.val code {
		background: none;
		padding: 0;
	}

	.val code {
		color: var(--cut);
		overflow-wrap: normal;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.field {
			grid-template-columns: minmax(0, 1fr);
		}

		dt {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 0.3rem 0.8rem;
		}
	}
</style>
